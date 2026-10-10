// =========================================================================
// WIDGET « CALCULATRICE » — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'calculatrice'.
// (Même design et mêmes boutons fenêtre que « Les couleurs du bruit ».)
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-calculatrice.js"></script>
//   2. Carte dans le panneau Outils → « Outils divers » :
//      onclick="createWidget('calculatrice');toggleToolsPanel()"
//
// 📌 Sauvegarde (save-load.js) :
//   • widget._calcGetData() → taille, plein écran, réduit, couleur,
//     mode devinette, historique, calcul en cours
//   • widget._calcSetData(data) → restauration après actualisation
//
// Fonctionnement :
//   • Grandes touches lisibles au tableau, écran avec le calcul en cours
//     et un aperçu du résultat.
//   • Virgule française, espaces entre les milliers (12 345,6).
//   • Priorités opératoires et parenthèses respectées.
//   • Historique : cliquer sur un calcul réutilise son résultat.
//   • Mode devinette : le résultat est caché par « ? » ; on clique
//     sur l'écran pour le révéler (les élèves cherchent d'abord).
//   • Clavier : chiffres, + − * / (ou x et :), virgule ou point,
//     Entrée ou = pour calculer, Retour arrière, Suppr / Échap pour effacer.
//
// Boutons fenêtre (comme les autres widgets) :
//   🟡 Réduire      → mini-barre en haut du tableau
//   🟢 Plein écran  → le widget occupe tout l'écran (Échap pour sortir)
//   🔴 Fermer       → supprime le widget
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
    /* Widget parent transparent : calc-outer porte tout le visuel */
    .widget[data-type="calculatrice"],
    .widget[data-type="calculatrice"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="calculatrice"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Rectangle principal ── */
    .widget[data-type="calculatrice"] .calc-outer {
        --calc-ink:   #14202E;
        --calc-glass: rgba(255,255,255,0.62);
        --calc-bg:    #8EC5F2;
        --calc-op:    #2F6FB3;

        position: relative;
        width:  460px;
        height: 640px;
        min-width:  280px;
        min-height: 400px;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 24px;
        background-color: var(--calc-bg);
        color: var(--calc-ink);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
        container-type: size;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
        transition: background-color .3s;
    }
    .widget[data-type="calculatrice"]:hover .calc-outer,
    .widget[data-type="calculatrice"]:focus-within .calc-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    .calc-sheen {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
    }

    /* ── Plein écran ── */
    .widget[data-type="calculatrice"] .calc-outer.calc-fullboard {
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
    .calc-outer.calc-fullboard .calc-resize-handle { display: none; }
    .calc-outer.calc-fullboard .calc-body { left: 6%; right: 6%; bottom: 4%; }

    /* ── En-tête ── */
    .calc-header {
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
    .calc-header > * { pointer-events: auto; }
    .calc-title,
    .calc-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--calc-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .calc-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
    }
    .calc-title span { overflow: hidden; text-overflow: ellipsis; }
    .calc-title svg { width: 18px; height: 18px; flex-shrink: 0; }
    .calc-tools { padding: 5px 12px 5px 6px; flex-shrink: 0; gap: 2px; }
    @container (max-width: 400px) { .calc-title span { display: none; } .calc-title { padding: 7px 10px; } }

    .calc-icon-btn {
        width: 32px; height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--calc-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .calc-icon-btn svg { width: 18px; height: 18px; }
    .calc-icon-btn:hover,
    .calc-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .calc-icon-btn:focus-visible { outline: 2px solid var(--calc-ink); outline-offset: 2px; }
    .calc-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Corps : écran + clavier (+ historique) ── */
    .calc-body {
        position: absolute;
        top: 66px; left: 16px; right: 16px; bottom: 16px;
        display: flex;
        gap: 12px;
        z-index: 2;
    }
    .calc-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: clamp(8px, 2cqmin, 18px);
    }

    /* Écran */
    .calc-screen {
        flex: 0 0 auto;
        height: 24%;
        min-height: 84px;
        box-sizing: border-box;
        background: rgba(255,255,255,0.9);
        border-radius: 18px;
        padding: 8px 18px 10px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.14);
        overflow: hidden;
    }
    .calc-screen.is-revealable { cursor: pointer; }
    .calc-line1 {
        --calc-fit: 1;
        font-size: calc(clamp(13px, 4.2cqmin, 36px) * var(--calc-fit));
        font-weight: 600;
        color: rgba(20,32,46,0.55);
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        min-height: 1.3em;
        line-height: 1.3;
    }
    .calc-line2 {
        --calc-fit: 1;
        font-size: calc(clamp(26px, 10cqmin, 120px) * var(--calc-fit));
        font-weight: 700;
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        line-height: 1.15;
        font-variant-numeric: tabular-nums;
    }
    .calc-line2.is-error {
        font-size: clamp(16px, 5cqmin, 48px);
        color: #C0392B;
        white-space: normal;
    }
    .calc-line2.is-hidden { color: var(--calc-op); }
    .calc-reveal-hint {
        font-size: clamp(11px, 2.4cqmin, 18px);
        font-weight: 700;
        color: var(--calc-op);
        margin-right: 0.6em;
        vertical-align: middle;
    }

    /* Clavier */
    .calc-keys {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(5, 1fr);
        gap: clamp(6px, 1.8cqmin, 16px);
    }
    .calc-key {
        border: none;
        border-radius: clamp(10px, 2.6cqmin, 22px);
        font-family: inherit;
        font-weight: 700;
        font-size: clamp(18px, 6cqmin, 64px);
        color: var(--calc-ink);
        background: rgba(255,255,255,0.82);
        cursor: pointer;
        box-shadow: 0 3px 0 rgba(10,20,35,0.18);
        transition: transform .08s, filter .15s, box-shadow .08s, background .3s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        min-height: 0;
        min-width: 0;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }
    .calc-key:hover { filter: brightness(1.06); }
    .calc-key:active,
    .calc-key.is-pressed { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.18); filter: brightness(0.94); }
    .calc-key:focus-visible { outline: 3px solid var(--calc-ink); outline-offset: 2px; }
    .calc-key.k-fn { background: rgba(255,255,255,0.5); }
    .calc-key.k-clear { background: rgba(255,255,255,0.5); color: #C0392B; }
    .calc-key.k-op { background: var(--calc-op); color: #fff; }
    .calc-key.k-eq { background: var(--calc-ink); color: #fff; }
    .calc-key svg { width: 0.9em; height: 0.9em; }

    /* Historique */
    .calc-history {
        display: none;
        flex: 0 0 34%;
        min-width: 150px;
        box-sizing: border-box;
        flex-direction: column;
        gap: 8px;
        padding: 12px 10px 10px;
        border-radius: 18px;
        background: rgba(255,255,255,0.62);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
    }
    .calc-outer.show-history .calc-history { display: flex; }
    @container (max-width: 580px) {
        .calc-history { position: absolute; inset: 0; z-index: 3; background: rgba(255,255,255,0.95); }
    }
    .calc-history-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 0 4px;
        font-size: 13px;
        font-weight: 700;
    }
    .calc-small-btn {
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 4px 10px;
        cursor: pointer;
        background: rgba(20,32,46,0.1);
        color: var(--calc-ink);
    }
    .calc-small-btn:hover { background: rgba(20,32,46,0.18); }
    .calc-history-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-right: 2px;
    }
    .calc-history-item {
        display: block;
        width: 100%;
        text-align: right;
        border: none;
        border-radius: 12px;
        padding: 7px 10px;
        cursor: pointer;
        background: rgba(255,255,255,0.8);
        font-family: inherit;
        color: var(--calc-ink);
    }
    .calc-history-item:hover { background: #fff; }
    .calc-hi-expr {
        display: block;
        font-size: clamp(11px, 2.6cqmin, 20px);
        font-weight: 600;
        color: rgba(20,32,46,0.6);
        word-break: break-all;
    }
    .calc-hi-res {
        display: block;
        font-size: clamp(14px, 3.8cqmin, 32px);
        font-weight: 700;
        word-break: break-all;
    }
    .calc-hi-res.is-hidden { color: var(--calc-op); }
    .calc-history-empty {
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.55);
        text-align: center;
        margin-top: 14px;
        padding: 0 6px;
    }

    /* ── Panneaux réglages / aide ── */
    .calc-panel {
        position: absolute;
        top: 62px;
        right: 16px;
        width: 300px;
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
        background: rgba(255,255,255,0.95);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        user-select: text;
    }
    .calc-panel.open { display: flex; }
    .calc-panel-title { font-size: 13px; font-weight: 700; }
    .calc-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.75);
    }
    .calc-row-label { flex: 1; }
    .calc-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .calc-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .calc-swatch.is-on { border-color: var(--calc-ink); box-shadow: 0 0 0 2px #fff inset; }
    .calc-switch {
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
    .calc-switch::after {
        content: '';
        position: absolute;
        top: 3px; left: 3px;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        transition: left .2s;
    }
    .calc-switch[aria-checked="true"] { background: var(--calc-ink); }
    .calc-switch[aria-checked="true"]::after { left: 21px; }
    .calc-note { font-size: 11px; font-weight: 600; color: rgba(20,32,46,0.6); line-height: 1.4; }
    .calc-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .calc-help-list li { margin-bottom: 4px; }
    .calc-panel kbd {
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
    .calc-resize-handle {
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
    .widget[data-type="calculatrice"]:hover .calc-resize-handle,
    .widget[data-type="calculatrice"]:focus-within .calc-resize-handle { opacity: 1; }
    `;

    if (!document.getElementById('calculatrice-style')) {
        var st = document.createElement('style');
        st.id = 'calculatrice-style';
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
        gris:   { name: 'Gris',   bg: '#D4DAE2', op: '#4A5868' }
    };
    var DEFAULT_W = 460, DEFAULT_H = 640, MIN_W = 280, MIN_H = 400;

    // ── Calcul : analyse sûre de l'expression (pas d'eval) ───────────────
    // Expression interne : chiffres, '.', + - * /, parenthèses, 'e' (notation scientifique)
    var NUM_RE = /^(\d+\.?\d*|\.\d+)(e[+\-]?\d+)?/;

    function tokenize(s) {
        var t = [], i = 0;
        while (i < s.length) {
            var ch = s[i];
            if (/[0-9.]/.test(ch)) {
                var m = s.slice(i).match(NUM_RE);
                if (!m) throw { calc: 'incomplete' };
                t.push({ type: 'num', v: parseFloat(m[0]) });
                i += m[0].length;
            } else if ('+-*/'.indexOf(ch) >= 0) {
                t.push({ type: 'op', v: ch }); i++;
            } else if (ch === '(' || ch === ')') {
                t.push({ type: ch }); i++;
            } else {
                throw { calc: 'incomplete' };
            }
        }
        return t;
    }

    function evaluate(s) {
        var toks = tokenize(s), pos = 0;
        function peek() { return toks[pos]; }
        function isOp(tk, list) { return tk && tk.type === 'op' && list.indexOf(tk.v) >= 0; }
        function expr() {
            var v = term();
            while (isOp(peek(), '+-')) {
                var op = toks[pos++].v, r = term();
                v = op === '+' ? v + r : v - r;
            }
            return v;
        }
        function term() {
            var v = factor();
            while (isOp(peek(), '*/')) {
                var op = toks[pos++].v, r = factor();
                if (op === '/') {
                    if (r === 0) throw { calc: 'div0' };
                    v = v / r;
                } else v = v * r;
            }
            return v;
        }
        function factor() {
            var tk = peek();
            if (!tk) throw { calc: 'incomplete' };
            if (isOp(tk, '+-')) { pos++; var f = factor(); return tk.v === '-' ? -f : f; }
            if (tk.type === 'num') { pos++; return tk.v; }
            if (tk.type === '(') {
                pos++;
                var v = expr();
                if (!peek() || peek().type !== ')') throw { calc: 'incomplete' };
                pos++;
                return v;
            }
            throw { calc: 'incomplete' };
        }
        var v = expr();
        if (pos < toks.length) throw { calc: 'incomplete' };
        if (!isFinite(v)) throw { calc: 'overflow' };
        return parseFloat(v.toPrecision(12)); // supprime les 0,30000000000000004
    }

    function closeParens(s) {
        var open = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
        while (open-- > 0) s += ')';
        return s;
    }

    var ERRORS = {
        div0:       'Division par zéro impossible',
        incomplete: 'Calcul incomplet',
        overflow:   'Nombre trop grand'
    };

    // ── Mise en forme française ───────────────────────────────────────────
    var NNBSP = ' '; // espace fine insécable (milliers)
    function groupInt(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP); }

    function isScientific(x) {
        var ax = Math.abs(x);
        return ax !== 0 && (ax >= 1e15 || ax < 1e-6);
    }

    // Nombre → texte interne (réinjectable dans une expression)
    function rawFromNumber(x) {
        if (Object.is(x, -0)) x = 0;
        if (isScientific(x)) return x.toPrecision(10).replace(/\.?0+e/, 'e');
        if (Math.abs(x) >= 1e12) return String(Math.round(x));
        var s = x.toPrecision(12);
        if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
        return s;
    }

    // Nombre → texte affiché (12 345,6 · −3 · 1,5 × 10^20)
    function fmtNumber(x) {
        if (Object.is(x, -0)) x = 0;
        var neg = x < 0, ax = Math.abs(x);
        var out;
        if (isScientific(ax)) {
            var parts = ax.toPrecision(8).replace(/\.?0+e/, 'e').split('e');
            out = parts[0].replace('.', ',') + ' × 10^' + parseInt(parts[1], 10);
        } else {
            out = fmtRawNum(rawFromNumber(ax));
        }
        return (neg ? '−' : '') + out;
    }

    // Nombre tapé (interne) → affiché
    function fmtRawNum(str) {
        if (str.indexOf('e') >= 0) return fmtNumber(parseFloat(str));
        var p = str.split('.');
        var res = groupInt(p[0] || '0');
        if (p.length > 1) res += ',' + p[1];
        return res;
    }

    // Expression interne → affichée (× ÷ −, espaces, virgules)
    var SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    function prettyExpr(s) {
        var out = '', i = 0, prev = null;
        while (i < s.length) {
            var ch = s[i];
            if (/[0-9.]/.test(ch)) {
                var numStr = s.slice(i).match(/^[0-9.]+(e[+\-]?\d+)?/)[0];
                // un nombre en cours de saisie peut se terminer par '.' → « 3, »
                out += fmtRawNum(numStr.replace(/\.$/, '')) + (/\.$/.test(numStr) ? ',' : '');
                prev = 'num';
                i += numStr.length;
                continue;
            }
            if (SYM[ch]) {
                var unary = (ch === '-' || ch === '+') && (prev === null || prev === 'op' || prev === '(');
                out += unary ? SYM[ch] : ' ' + SYM[ch] + ' ';
                prev = 'op'; i++;
                continue;
            }
            out += ch; prev = ch; i++;
        }
        return out;
    }

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initCalculatriceWidget = function (widget, savedData) {

        // ── Icônes ──
        var ICON_CALC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.5" width="16" height="19" rx="3"/><rect x="7" y="5.5" width="10" height="4" rx="1"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/></svg>';
        var ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
        var ICON_HISTORY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 7.5V12l3 2"/></svg>';
        var ICON_HELP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
        var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>';

        // ── Touches (ordre de la grille 4 × 5) ──
        var KEYS = [
            { k: 'C', label: 'C', cls: 'k-clear', title: 'Tout effacer (Suppr)' },
            { k: '(', label: '(', cls: 'k-fn' },
            { k: ')', label: ')', cls: 'k-fn' },
            { k: '/', label: '÷', cls: 'k-op', title: 'Diviser (/ ou :)' },
            { k: '7', label: '7' }, { k: '8', label: '8' }, { k: '9', label: '9' },
            { k: '*', label: '×', cls: 'k-op', title: 'Multiplier (* ou x)' },
            { k: '4', label: '4' }, { k: '5', label: '5' }, { k: '6', label: '6' },
            { k: '-', label: '−', cls: 'k-op', title: 'Soustraire' },
            { k: '1', label: '1' }, { k: '2', label: '2' }, { k: '3', label: '3' },
            { k: '+', label: '+', cls: 'k-op', title: 'Additionner' },
            { k: 'back', label: ICON_BACK, cls: 'k-fn', title: 'Effacer le dernier caractère (Retour arrière)' },
            { k: '0', label: '0' },
            { k: ',', label: ',', title: 'Virgule (, ou .)' },
            { k: '=', label: '=', cls: 'k-eq', title: 'Calculer (Entrée)' }
        ];
        var keysHTML = KEYS.map(function (key) {
            return '<button class="calc-key ' + (key.cls || '') + '" data-k="' + key.k + '"'
                 + (key.title ? ' title="' + key.title + '"' : '') + '>' + key.label + '</button>';
        }).join('');

        var swatchesHTML = Object.keys(THEMES).map(function (id) {
            return '<button class="calc-swatch" data-theme="' + id + '" title="' + THEMES[id].name
                 + '" style="background:' + THEMES[id].bg + '"></button>';
        }).join('');

        // ── Injection HTML ──
        var contentZone = widget.querySelector('.widget-content');
        contentZone.innerHTML =
            '<div class="calc-outer" tabindex="0">'
          +   '<div class="calc-sheen"></div>'
          +   '<div class="calc-header">'
          +     '<div class="calc-title">' + ICON_CALC + '<span>Calculatrice</span></div>'
          +     '<div class="calc-tools">'
          +       '<button class="calc-icon-btn calc-history-btn" title="Historique">' + ICON_HISTORY + '</button>'
          +       '<button class="calc-icon-btn calc-settings-btn" title="Réglages">' + ICON_SLIDERS + '</button>'
          +       '<button class="calc-icon-btn calc-help-btn" title="Aide">' + ICON_HELP + '</button>'
          +       '<span class="calc-sep"></span>'
          +       '<div class="wf-btns">'
          +         '<button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>'
          +         '<button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>'
          +         '<button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>'
          +       '</div>'
          +     '</div>'
          +   '</div>'
          +   '<div class="calc-body">'
          +     '<div class="calc-main">'
          +       '<div class="calc-screen" aria-live="polite">'
          +         '<div class="calc-line1"></div>'
          +         '<div class="calc-line2">0</div>'
          +       '</div>'
          +       '<div class="calc-keys">' + keysHTML + '</div>'
          +     '</div>'
          +     '<div class="calc-history">'
          +       '<div class="calc-history-head"><span>Historique</span>'
          +         '<span style="display:flex;gap:4px;">'
          +           '<button class="calc-small-btn calc-history-clear" title="Effacer l\'historique">Effacer</button>'
          +           '<button class="calc-small-btn calc-history-close" title="Fermer l\'historique">✕</button>'
          +         '</span>'
          +       '</div>'
          +       '<div class="calc-history-list"></div>'
          +     '</div>'
          +   '</div>'
          +   '<div class="calc-panel calc-settings">'
          +     '<div class="calc-panel-title">Réglages</div>'
          +     '<div class="calc-row"><span class="calc-row-label">Couleur</span></div>'
          +     '<div class="calc-swatches">' + swatchesHTML + '</div>'
          +     '<div class="calc-row">'
          +       '<span class="calc-row-label">Mode devinette</span>'
          +       '<button class="calc-switch calc-guess" role="switch" aria-checked="false" aria-label="Mode devinette"></button>'
          +     '</div>'
          +     '<div class="calc-note">Le résultat est caché par « ? » : les élèves cherchent d\'abord, puis on clique sur l\'écran pour le révéler. L\'aperçu pendant la saisie est aussi masqué.</div>'
          +   '</div>'
          +   '<div class="calc-panel calc-help">'
          +     '<div class="calc-panel-title">Aide</div>'
          +     '<ul class="calc-help-list">'
          +       '<li>Touchez les touches ou utilisez le <b>clavier</b> (cliquez d\'abord sur la calculatrice).</li>'
          +       '<li><kbd>0</kbd>…<kbd>9</kbd> chiffres · <kbd>,</kbd> ou <kbd>.</kbd> virgule</li>'
          +       '<li><kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> ou <kbd>x</kbd> · <kbd>/</kbd> ou <kbd>:</kbd> opérations</li>'
          +       '<li><kbd>(</kbd> <kbd>)</kbd> parenthèses (fermées automatiquement au calcul)</li>'
          +       '<li><kbd>Entrée</kbd> ou <kbd>=</kbd> calculer</li>'
          +       '<li><kbd>⌫</kbd> efface le dernier caractère · <kbd>Suppr</kbd> ou <kbd>Échap</kbd> efface tout</li>'
          +       '<li>Les priorités sont respectées : 2 + 3 × 4 = 14.</li>'
          +       '<li><b>Historique</b> : cliquez sur un calcul pour réutiliser son résultat.</li>'
          +       '<li><b>Mode devinette</b> (Réglages) : le résultat reste caché jusqu\'au clic sur l\'écran.</li>'
          +       '<li>Poignée en bas à droite pour redimensionner. Pastilles : réduire, plein écran (<kbd>Échap</kbd> pour sortir), fermer.</li>'
          +     '</ul>'
          +   '</div>'
          +   '<div class="calc-resize-handle"></div>'
          + '</div>';

        // ── Références DOM ──
        var outer        = widget.querySelector('.calc-outer');
        var screenEl     = widget.querySelector('.calc-screen');
        var line1        = widget.querySelector('.calc-line1');
        var line2        = widget.querySelector('.calc-line2');
        var keysEl       = widget.querySelector('.calc-keys');
        var historyBtn   = widget.querySelector('.calc-history-btn');
        var settingsBtn  = widget.querySelector('.calc-settings-btn');
        var helpBtn      = widget.querySelector('.calc-help-btn');
        var settingsEl   = widget.querySelector('.calc-settings');
        var helpEl       = widget.querySelector('.calc-help');
        var historyList  = widget.querySelector('.calc-history-list');
        var historyClear = widget.querySelector('.calc-history-clear');
        var historyClose = widget.querySelector('.calc-history-close');
        var guessSwitch  = widget.querySelector('.calc-guess');
        var resizeHandle = widget.querySelector('.calc-resize-handle');
        var wfMin        = widget.querySelector('[data-role="wf-min"]');
        var wfMax        = widget.querySelector('[data-role="wf-max"]');
        var wfClose      = widget.querySelector('[data-role="wf-close"]');

        // ── État ──
        var alive         = true;
        var isMax         = false;
        var theme         = 'bleu';
        var guessMode     = false;
        var showHistory   = false;
        var history       = [];      // { e: expression interne, r: nombre, revealed: bool }
        var expr          = '';      // expression en cours (interne)
        var justEvaluated = false;
        var lastResult    = null;
        var shownExpr     = '';      // expression affichée au-dessus du résultat
        var revealed      = true;
        var errorMsg      = '';
        var saveTimer     = null;

        function scheduleSave() {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function () {
                if (alive && typeof saveBoard === 'function') saveBoard();
            }, 600);
        }

        function miniLabelText() {
            var txt = '🧮 Calculatrice';
            if (justEvaluated && revealed && lastResult !== null) txt += ' — ' + fmtNumber(lastResult);
            return txt;
        }
        function updateMiniLabel() {
            var lbl = widget.querySelector('.wf-mini-bar > span');
            if (lbl) lbl.textContent = miniLabelText();
        }

        // ── Saisie ──
        function lastChar() { return expr.slice(-1); }
        function isOpCh(c) { return c !== '' && '+-*/'.indexOf(c) >= 0; }
        function isNumEnd(c) { return c !== '' && /[0-9.]/.test(c); }
        function currentNumber() { var m = expr.match(/[0-9.]+(e[+\-]?\d+)?$/); return m ? m[0] : ''; }
        function resetIfDone() {
            if (justEvaluated || errorMsg) { expr = ''; justEvaluated = false; errorMsg = ''; shownExpr = ''; }
        }

        function inputDigit(d) {
            resetIfDone();
            if (lastChar() === ')') expr += '*';
            var cur = currentNumber();
            if (cur.indexOf('e') >= 0) return;
            if (cur === '0') expr = expr.slice(0, -1);           // pas de « 007 »
            if (cur.replace('.', '').length >= 15) return;        // limite de chiffres
            expr += d;
        }
        function inputComma() {
            resetIfDone();
            if (lastChar() === ')') expr += '*';
            var cur = currentNumber();
            if (cur) {
                if (cur.indexOf('.') >= 0 || cur.indexOf('e') >= 0) return;
                expr += '.';
            } else expr += '0.';
        }
        function inputOp(op) {
            if (errorMsg) { errorMsg = ''; expr = ''; shownExpr = ''; justEvaluated = false; }
            if (justEvaluated) {
                expr = lastResult !== null ? rawFromNumber(lastResult) : '';
                justEvaluated = false; shownExpr = '';
            }
            if (lastChar() === '.') expr = expr.slice(0, -1);
            var lc = lastChar();
            if (expr === '') { expr = op === '-' ? '-' : '0' + op; return; }
            if (lc === '(') { if (op === '-') expr += '-'; return; }
            if (isOpCh(lc)) {
                if (op === '-' && (lc === '*' || lc === '/')) { expr += '-'; return; }
                expr = expr.replace(/[+\-*/]+$/, '');
                if (expr === '' || lastChar() === '(') { if (op === '-') expr += '-'; return; }
            }
            expr += op;
        }
        function inputParen(p) {
            if (p === '(') {
                resetIfDone();
                if (lastChar() === '.') expr = expr.slice(0, -1);
                var lc = lastChar();
                if (isNumEnd(lc) || lc === ')') expr += '*';
                expr += '(';
            } else {
                if (justEvaluated || errorMsg) return;
                var open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
                if (open <= 0) return;
                if (lastChar() === '.') expr = expr.slice(0, -1);
                var lc2 = lastChar();
                if (lc2 === '' || isOpCh(lc2) || lc2 === '(') return;
                expr += ')';
            }
        }
        function backspace() {
            if (justEvaluated || errorMsg) { clearAll(); return; }
            expr = expr.slice(0, -1);
        }
        function clearAll() {
            expr = ''; justEvaluated = false; errorMsg = ''; shownExpr = ''; revealed = true;
        }
        function equals() {
            if (errorMsg || justEvaluated || expr === '') return;
            var e = closeParens(expr.replace(/\.$/, ''));
            try {
                var v = evaluate(e);
                lastResult = v;
                shownExpr = prettyExpr(e) + ' =';
                justEvaluated = true;
                revealed = !guessMode;
                expr = e;
                // un nombre seul (« 12 = 12 ») ne va pas dans l'historique
                if (/[+\-*/()]/.test(e.replace(/^-/, ''))) {
                    history.unshift({ e: e, r: v, revealed: revealed });
                    if (history.length > 50) history.length = 50;
                    renderHistory();
                }
            } catch (err) {
                errorMsg = (err && ERRORS[err.calc]) || ERRORS.incomplete;
                shownExpr = prettyExpr(e);
            }
        }

        function reveal() {
            if (!justEvaluated || revealed) return;
            revealed = true;
            if (history[0] && history[0].r === lastResult) history[0].revealed = true;
            render(); renderHistory(); scheduleSave();
        }

        function useValue(v) {
            var raw = rawFromNumber(v);
            if (justEvaluated || errorMsg || expr === '') {
                expr = raw; justEvaluated = false; errorMsg = ''; shownExpr = '';
            } else {
                if (lastChar() === '.') expr = expr.slice(0, -1);
                var lc = lastChar();
                if (isNumEnd(lc) || lc === ')') expr += '*';
                expr += raw;
            }
            render(); scheduleSave();
        }

        function press(k) {
            if (/^[0-9]$/.test(k)) inputDigit(k);
            else if (k === ',') inputComma();
            else if (isOpCh(k)) inputOp(k);
            else if (k === '(' || k === ')') inputParen(k);
            else if (k === 'back') backspace();
            else if (k === 'C') clearAll();
            else if (k === '=') equals();
            render();
            scheduleSave();
        }

        // ── Affichage ──
        function fitLine(el) {
            el.style.setProperty('--calc-fit', '1');
            if (outer.style.display === 'none') return;
            var f = 1, guard = 0;
            while (el.scrollWidth > el.clientWidth + 1 && f > 0.35 && guard++ < 20) {
                f *= 0.88;
                el.style.setProperty('--calc-fit', f.toFixed(3));
            }
            el.scrollLeft = el.scrollWidth;
        }

        function render() {
            line2.classList.remove('is-error', 'is-hidden');
            screenEl.classList.remove('is-revealable');
            screenEl.removeAttribute('title');
            if (errorMsg) {
                line1.textContent = shownExpr;
                line2.textContent = errorMsg;
                line2.classList.add('is-error');
            } else if (justEvaluated) {
                line1.textContent = shownExpr;
                if (revealed) {
                    line2.textContent = fmtNumber(lastResult);
                } else {
                    line2.innerHTML = '<span class="calc-reveal-hint">Cliquer pour révéler</span>?';
                    line2.classList.add('is-hidden');
                    screenEl.classList.add('is-revealable');
                    screenEl.title = 'Cliquer pour révéler le résultat';
                }
            } else {
                line2.textContent = expr === '' ? '0' : prettyExpr(expr);
                var preview = '';
                if (!guessMode && /[+\-*/]/.test(expr.replace(/^-/, '')) && !isOpCh(lastChar()) && lastChar() !== '(') {
                    try { preview = '= ' + fmtNumber(evaluate(closeParens(expr.replace(/\.$/, '')))); } catch (e) {}
                }
                line1.textContent = preview;
            }
            fitLine(line1);
            if (!line2.classList.contains('is-error')) fitLine(line2);
            updateMiniLabel();
        }

        function renderHistory() {
            historyList.innerHTML = '';
            if (!history.length) {
                var empty = document.createElement('div');
                empty.className = 'calc-history-empty';
                empty.textContent = 'Aucun calcul pour le moment.';
                historyList.appendChild(empty);
                return;
            }
            history.forEach(function (h) {
                var b = document.createElement('button');
                b.className = 'calc-history-item';
                b.title = h.revealed ? 'Réutiliser ce résultat' : 'Révéler le résultat';
                var e = document.createElement('span');
                e.className = 'calc-hi-expr';
                e.textContent = prettyExpr(h.e) + ' =';
                var r = document.createElement('span');
                r.className = 'calc-hi-res' + (h.revealed ? '' : ' is-hidden');
                r.textContent = h.revealed ? fmtNumber(h.r) : '?';
                b.appendChild(e); b.appendChild(r);
                b.addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    if (!h.revealed) {
                        h.revealed = true;
                        if (justEvaluated && !revealed && history[0] === h) revealed = true;
                        renderHistory(); render(); scheduleSave();
                        return;
                    }
                    useValue(h.r);
                });
                historyList.appendChild(b);
            });
        }

        // ── Réglages ──
        function setTheme(id) {
            if (!THEMES[id]) id = 'bleu';
            theme = id;
            outer.style.setProperty('--calc-bg', THEMES[id].bg);
            outer.style.setProperty('--calc-op', THEMES[id].op);
            widget.querySelectorAll('.calc-swatch').forEach(function (s) {
                s.classList.toggle('is-on', s.dataset.theme === id);
            });
        }
        function setGuess(on) {
            guessMode = !!on;
            guessSwitch.setAttribute('aria-checked', guessMode ? 'true' : 'false');
        }
        function setHistoryVisible(on) {
            showHistory = !!on;
            outer.classList.toggle('show-history', showHistory);
            historyBtn.classList.toggle('is-on', showHistory);
            requestAnimationFrame(render);
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
        }

        // ── Événements : touches ──
        keysEl.addEventListener('click', function (e) {
            var b = e.target.closest('.calc-key');
            if (!b) return;
            e.stopPropagation();
            press(b.dataset.k);
        });

        screenEl.addEventListener('click', function (e) {
            if (justEvaluated && !revealed) { e.stopPropagation(); reveal(); }
        });

        historyBtn.addEventListener('click', function (e) { e.stopPropagation(); setHistoryVisible(!showHistory); scheduleSave(); });
        historyClose.addEventListener('click', function (e) { e.stopPropagation(); setHistoryVisible(false); scheduleSave(); });
        historyClear.addEventListener('click', function (e) {
            e.stopPropagation();
            history = [];
            renderHistory(); scheduleSave();
        });
        settingsBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(settingsEl, settingsBtn); });
        helpBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(helpEl, helpBtn); });

        widget.querySelectorAll('.calc-swatch').forEach(function (s) {
            s.addEventListener('click', function (e) { e.stopPropagation(); setTheme(s.dataset.theme); scheduleSave(); });
        });
        guessSwitch.addEventListener('click', function (e) {
            e.stopPropagation();
            setGuess(!guessMode);
            render(); scheduleSave();
        });

        // ── Clavier (quand la calculatrice a le focus, ou en plein écran) ──
        var KEYMAP = {
            '.': ',', ',': ',', '+': '+', '-': '-', '*': '*', 'x': '*', 'X': '*',
            '/': '/', ':': '/', '(': '(', ')': ')', 'Enter': '=', '=': '=',
            'Backspace': 'back', 'Delete': 'C'
        };
        function flashKey(k) {
            var b = keysEl.querySelector('.calc-key[data-k="' + (k === ',' ? ',' : k) + '"]');
            if (!b) return;
            b.classList.add('is-pressed');
            setTimeout(function () { b.classList.remove('is-pressed'); }, 120);
        }
        function handleKey(e) {
            if (!alive || outer.style.display === 'none') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
            var key = e.key;
            if (key === 'Escape') {
                if (settingsEl.classList.contains('open') || helpEl.classList.contains('open')) {
                    closePanels(); e.preventDefault(); e.stopPropagation(); return;
                }
                if (isMax) return;              // laissé au gestionnaire « quitter le plein écran »
                key = 'Delete';
            }
            var k = /^[0-9]$/.test(key) ? key : KEYMAP[key];
            if (!k) return;
            e.preventDefault();
            e.stopPropagation();                // évite la suppression du widget par le tableau
            flashKey(k);
            press(k);
        }
        widget.addEventListener('keydown', handleKey);
        // En plein écran, le clavier fonctionne même si le focus est ailleurs
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
        outer.addEventListener('pointerdown', function () {
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
                render();
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
            var roTimer = null;
            ro = new ResizeObserver(function () {
                clearTimeout(roTimer);
                roTimer = setTimeout(function () { if (alive) render(); }, 30);
            });
            ro.observe(outer);
        }

        // ── Boutons fenêtre : réduire / plein écran / fermer ──
        function setMax(on) {
            isMax = !!on;
            outer.classList.toggle('calc-fullboard', isMax);
            wfMax.title = isMax ? 'Quitter le plein écran' : 'Plein écran';
            outer.style.cursor = '';
            if (isMax) { try { outer.focus({ preventScroll: true }); } catch (err) {} }
            requestAnimationFrame(render);
            scheduleSave();
        }

        function collapse() {
            if (widget.querySelector('.wf-mini-bar')) return;
            if (isMax) setMax(false);
            closePanels();
            outer.style.display = 'none';
            window._wfMiniBarCollapse(widget, miniLabelText(), {
                onExpand: function () {
                    outer.style.display = '';
                    requestAnimationFrame(render);
                }
            });
        }

        wfMin.addEventListener('click', function (e) { e.stopPropagation(); collapse(); });
        wfMax.addEventListener('click', function (e) { e.stopPropagation(); setMax(!isMax); });

        function destroy() {
            if (!alive) return;
            alive = false;
            clearTimeout(saveTimer);
            if (ro) ro.disconnect();
            document.removeEventListener('keydown', onDocKey);
        }

        wfClose.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            destroy();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Propagation : ne pas déplacer le widget depuis les contrôles ──
        var INTERACTIVE = 'button, input, .calc-panel, .calc-resize-handle, .calc-history, .calc-screen.is-revealable';
        outer.addEventListener('mousedown', function (e) {
            if (isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
        });
        outer.addEventListener('touchstart', function (e) {
            if (isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
        }, { passive: true });

        // ── Curseur « déplacer » sur le fond ──
        outer.addEventListener('mousemove', function (e) {
            if (isMax) { outer.style.cursor = ''; return; }
            if (e.target.closest('button, input, .calc-panel, .calc-history, .calc-screen.is-revealable')) { outer.style.cursor = ''; return; }
            if (e.target.closest('.calc-resize-handle')) { outer.style.cursor = 'nwse-resize'; return; }
            outer.style.cursor = 'move';
        });
        outer.addEventListener('mouseleave', function () { outer.style.cursor = ''; });

        // ── Nettoyage à la suppression ──
        var obs = new MutationObserver(function () {
            if (!document.contains(widget)) {
                destroy();
                obs.disconnect();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        // ── Sauvegarde / restauration (utilisé par save-load.js) ──
        widget._calcGetData = function () {
            return {
                w: parseFloat(outer.style.width)  || DEFAULT_W,
                h: parseFloat(outer.style.height) || DEFAULT_H,
                fullboard: isMax,
                collapsed: !!widget.querySelector('.wf-mini-bar'),
                theme: theme,
                guess: guessMode,
                showHistory: showHistory,
                history: history.slice(0, 50),
                expr: expr,
                justEvaluated: justEvaluated,
                lastResult: lastResult,
                shownExpr: shownExpr,
                revealed: revealed
            };
        };

        widget._calcSetData = function (d) {
            if (!d || typeof d !== 'object') return;
            if (d.w > 0) outer.style.width  = Math.max(MIN_W, Math.min(d.w, window.innerWidth))  + 'px';
            if (d.h > 0) outer.style.height = Math.max(MIN_H, Math.min(d.h, window.innerHeight)) + 'px';
            setTheme(d.theme);
            setGuess(!!d.guess);
            history = Array.isArray(d.history) ? d.history.filter(function (h) {
                return h && typeof h.e === 'string' && /^[0-9.+\-*/()e]*$/.test(h.e) && typeof h.r === 'number' && isFinite(h.r);
            }).slice(0, 50).map(function (h) { return { e: h.e, r: h.r, revealed: h.revealed !== false }; }) : [];
            expr = (typeof d.expr === 'string' && /^[0-9.+\-*/()e]*$/.test(d.expr)) ? d.expr : '';
            lastResult = (typeof d.lastResult === 'number' && isFinite(d.lastResult)) ? d.lastResult : null;
            justEvaluated = !!d.justEvaluated && lastResult !== null;
            shownExpr = justEvaluated && typeof d.shownExpr === 'string' ? d.shownExpr : '';
            revealed = d.revealed !== false;
            errorMsg = '';
            renderHistory();
            setHistoryVisible(!!d.showHistory);
            render();
            if (d.fullboard) setMax(true);
            if (d.collapsed) setTimeout(function () { if (alive) collapse(); }, 150);
        };

        // ── Démarrage ──
        outer.style.width  = DEFAULT_W + 'px';
        outer.style.height = DEFAULT_H + 'px';
        setTheme('bleu');
        renderHistory();
        render();
        if (savedData) widget._calcSetData(savedData);
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function installHook(orig) {
        window.createWidget = function (type) {
            var widget = orig.apply(this, arguments);
            if (type === 'calculatrice' && widget) initCalculatriceWidget(widget);
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
