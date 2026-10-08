// =========================================================================
// WIDGET RADAR DE BRUIT — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'radar'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-radar.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets ou Outils) :
//      <div class="mm-sub-item" onclick="createWidget('radar');closeMainMenu()">
//          <span class="mm-ico">📡</span>&nbsp;&nbsp;Radar de Bruit
//      </div>
//
// Boutons fenêtre (comme les autres widgets) :
//   🟡 Réduire      → mini-barre en haut du tableau (l'écoute continue,
//                      la mini-barre affiche l'état et le nombre d'alertes)
//   🟢 Plein écran  → le radar occupe tout l'écran (Échap pour sortir)
//   🔴 Fermer       → coupe le micro et supprime le widget
//
// Niveaux de voix (rangée de 4 boutons sous le titre) :
//   0 Silence · 1 Chuchoter · 2 En groupe · 3 Classe
//   Chaque niveau a son propre seuil d'alerte. Le curseur « Seuil »
//   règle le seuil du niveau sélectionné, qui est mémorisé.
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

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* Widget parent transparent : radar-outer porte tout le visuel */
    .widget[data-type="radar"],
    .widget[data-type="radar"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="radar"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="radar"] .radar-outer {
        --rd-ink:    #EAF0FA;
        --rd-muted:  #9AABC8;
        --rd-line:   rgba(234,240,250,0.13);
        --rd-calm:   #8FE0C0;
        --rd-warn:   #F2CF8B;
        --rd-alert:  #FF8A7A;
        --rd-accent: #8EC5FF;
        --rd-deep:   #13203A;
        --rd-level:  var(--rd-calm);

        position: relative;
        width:  340px;
        height: 470px;
        min-width:  220px;
        min-height: 304px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        background:
            radial-gradient(90% 60% at 50% 42%, rgba(142,197,255,0.10), transparent 70%),
            linear-gradient(172deg, #1C2846 0%, #243557 55%, #2C4066 100%);
        border: 1px solid rgba(234,240,250,0.08);
        box-shadow: 0 22px 48px -18px rgba(6,12,28,0.65), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .widget[data-type="radar"] .radar-outer[data-zone="warn"]  { --rd-level: var(--rd-warn); }
    .widget[data-type="radar"] .radar-outer[data-zone="alert"] { --rd-level: var(--rd-alert); }
    .widget[data-type="radar"]:hover .radar-outer,
    .widget[data-type="radar"]:focus-within .radar-outer {
        outline: 2px dashed rgba(142,197,255,0.40);
        outline-offset: 2px;
    }

    /* ── Plein écran ── */
    .widget[data-type="radar"] .radar-outer.radar-fullboard {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-width: 0 !important;
        min-height: 0 !important;
        z-index: 9999 !important;
        border-radius: 0 !important;
        border: none !important;
        outline: none !important;
        cursor: default !important;
    }
    .radar-outer.radar-fullboard .radar-alert-flash { border-radius: 0; }
    .radar-outer.radar-fullboard .radar-resize-handle { display: none; }

    /* Poignée de resize proportionnel */
    .radar-resize-handle {
        position: absolute;
        bottom: 5px; right: 5px;
        width: 16px; height: 16px;
        cursor: nwse-resize;
        z-index: 20;
        opacity: 0;
        transition: opacity 0.2s;
        background: radial-gradient(circle, rgba(234,240,250,0.45) 1.2px, transparent 1.6px) 0 0 / 5px 5px;
        -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                mask: linear-gradient(135deg, transparent 50%, #000 50%);
    }
    .widget[data-type="radar"]:hover .radar-resize-handle,
    .widget[data-type="radar"]:focus-within .radar-resize-handle { opacity: 1; }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="radar"] .radar-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
        z-index: 3;
    }

    /* ── Widget intérieur (taille de référence 340×470) ── */
    .radar-widget {
        width: 340px;
        height: 470px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px 16px;
        box-sizing: border-box;
        color: var(--rd-ink);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
    }

    /* ── En-tête ── */
    .radar-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
    }
    .radar-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        color: var(--rd-ink);
        white-space: nowrap;
        overflow: hidden;
    }
    .radar-title svg { width: 18px; height: 18px; color: var(--rd-accent); flex-shrink: 0; }
    .radar-header-right {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .radar-icon-btn {
        width: 30px; height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1px solid transparent;
        background: transparent;
        color: var(--rd-muted);
        cursor: pointer;
        padding: 0;
        transition: background .15s, color .15s, border-color .15s;
    }
    .radar-icon-btn svg { width: 17px; height: 17px; }
    .radar-icon-btn:hover { background: rgba(234,240,250,0.08); color: var(--rd-ink); }
    .radar-icon-btn:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; }
    .radar-toggle-controls.is-off { color: var(--rd-accent); border-color: rgba(142,197,255,0.35); }

    /* ── Niveaux de voix ── */
    .radar-voice {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        flex-shrink: 0;
    }
    .radar-voice-btn {
        font-family: inherit;
        background: rgba(234,240,250,0.05);
        border: 1px solid var(--rd-line);
        border-radius: 12px;
        color: var(--rd-muted);
        padding: 6px 2px 7px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        cursor: pointer;
        transition: background .2s, color .2s, border-color .2s, transform .1s;
    }
    .radar-voice-btn:hover { background: rgba(234,240,250,0.10); color: var(--rd-ink); }
    .radar-voice-btn:active { transform: scale(0.96); }
    .radar-voice-btn:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; }
    .radar-voice-num  { font-size: 19px; font-weight: 700; line-height: 1; }
    .radar-voice-name { font-size: 10.5px; font-weight: 700; white-space: nowrap; }
    .radar-voice-btn.is-active {
        background: var(--rd-accent);
        border-color: transparent;
        color: var(--rd-deep);
        box-shadow: 0 6px 16px -8px rgba(142,197,255,0.8);
    }

    /* ── Zone radar ── */
    .radar-box-wrap {
        position: relative;
        width: 210px;
        height: 210px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .radar-ring {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid var(--rd-line);
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
    }
    .radar-ring.outer-ring { background: rgba(10,18,36,0.22); border-color: rgba(234,240,250,0.14); }

    .radar-threshold-ring {
        position: absolute;
        border-radius: 50%;
        border: 2px dashed rgba(255,138,122,0.75);
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
        z-index: 12;
        pointer-events: none;
        transition: transform 0.2s ease-out;
    }

    .radar-blob {
        position: absolute;
        width: 100%; height: 100%;
        border-radius: 50%;
        background-color: var(--rd-level);
        background-image:
            radial-gradient(circle at 34% 28%, rgba(255,255,255,0.6), rgba(255,255,255,0) 55%),
            radial-gradient(circle at 70% 80%, rgba(19,32,58,0.18), rgba(19,32,58,0) 60%);
        box-shadow: 0 0 60px -6px var(--rd-level);
        z-index: 10;
        transform: scale(0);
        transition: transform 0.1s ease-out, background-color 0.5s ease, box-shadow 0.5s ease;
    }

    /* ── Bouton central ── */
    .radar-btn-start {
        position: absolute;
        inset: 0; margin: auto;
        z-index: 50;
        width: 92px; height: 92px;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        font-family: inherit;
        color: var(--rd-deep);
        background: var(--rd-accent);
        box-shadow: 0 10px 26px -8px rgba(142,197,255,0.75);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 0;
        transition: background-color .3s, box-shadow .3s, transform .15s, color .3s;
    }
    .radar-btn-start:active { transform: scale(0.95); }
    .radar-btn-start:focus-visible { outline: 2px solid var(--rd-ink); outline-offset: 3px; }
    .radar-btn-start svg { width: 22px; height: 22px; }
    .radar-btn-text { font-size: 13px; font-weight: 700; }
    .radar-btn-status,
    .radar-btn-stop { display: none; font-size: 15px; font-weight: 700; }

    .radar-btn-start.is-listening {
        background: transparent;
        box-shadow: none;
        color: var(--rd-deep);
    }
    .radar-btn-start.is-listening svg,
    .radar-btn-start.is-listening .radar-btn-text { display: none; }
    .radar-btn-start.is-listening .radar-btn-status { display: block; }
    .radar-btn-start.is-listening:hover { background: rgba(19,32,58,0.75); color: var(--rd-ink); }
    .radar-btn-start.is-listening:hover .radar-btn-status { display: none; }
    .radar-btn-start.is-listening:hover .radar-btn-stop { display: block; }

    /* Le statut reste lisible même quand le blob est petit */
    .radar-outer[data-zone] .radar-btn-start.is-listening:not(:hover) {
        background: rgba(234,240,250,0.92);
        width: 96px; height: 40px;
        border-radius: 999px;
        box-shadow: 0 6px 18px -8px rgba(0,0,0,0.5);
    }

    /* ── Alertes ── */
    .radar-alerts-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        padding: 8px 4px 0;
        border-top: 1px solid var(--rd-line);
    }
    .radar-alerts-main { display: flex; align-items: baseline; gap: 8px; }
    .radar-alert-count {
        font-size: 34px;
        font-weight: 700;
        color: var(--rd-alert);
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }
    .radar-alert-label { font-size: 13px; font-weight: 600; color: var(--rd-muted); }
    .radar-alert-btns { display: flex; align-items: center; gap: 4px; }
    .radar-sound-btn.muted { color: var(--rd-alert); }
    .radar-reset-btn {
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        color: var(--rd-muted);
        background: transparent;
        border: 1px solid var(--rd-line);
        border-radius: 999px;
        padding: 5px 11px;
        cursor: pointer;
        transition: color .15s, border-color .15s;
    }
    .radar-reset-btn:hover { color: var(--rd-ink); border-color: rgba(234,240,250,0.3); }
    .radar-reset-btn:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; }

    /* ── Réglages ── */
    .radar-controls {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 9px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        max-height: 150px;
        opacity: 1;
    }
    .radar-controls.hidden { max-height: 0; opacity: 0; pointer-events: none; }
    .radar-slider-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: var(--rd-muted);
    }
    .radar-slider-label { width: 74px; flex-shrink: 0; }
    .radar-slider {
        --fill: 50%;
        --thumb: var(--rd-accent);
        flex: 1;
        height: 6px;
        margin: 0;
        cursor: pointer;
        border-radius: 6px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, var(--thumb) var(--fill), rgba(234,240,250,0.14) var(--fill));
    }
    .radar-seuil-slider { --thumb: var(--rd-alert); }
    .radar-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--thumb);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
    }
    .radar-slider::-moz-range-thumb {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--thumb);
        cursor: pointer;
    }
    .radar-slider:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 5px; }
    .radar-slider-val {
        width: 34px;
        text-align: right;
        font-weight: 700;
        color: var(--rd-ink);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
    }

    /* ── Alerte : halo rouge sur tout le widget ── */
    .radar-alert-flash {
        display: none;
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: radial-gradient(80% 70% at 50% 45%, rgba(255,138,122,0.0) 30%, rgba(255,138,122,0.28) 100%);
        box-shadow: inset 0 0 0 2px rgba(255,138,122,0.55);
        pointer-events: none;
        z-index: 2;
        animation: radar-flash 0.7s ease-in-out infinite alternate;
    }
    .radar-alert-flash.active { display: block; }
    @keyframes radar-flash { from { opacity: 0.35; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
        .radar-alert-flash { animation: none; opacity: 0.8; }
    }

    /* ── Micro refusé ── */
    .radar-no-mic {
        font-size: 12px;
        font-weight: 600;
        color: var(--rd-alert);
        text-align: center;
        padding: 2px 8px;
        display: none;
        flex-shrink: 0;
    }
    `;

    // Police arrondie partagée avec la Pause calme (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        var fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById('radar-widget-style-v3')) {
        var st = document.createElement('style');
        st.id = 'radar-widget-style-v3';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initRadarWidget = function (widget) {
        (function () {

            // ── Icônes ──
            var ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
            var ICON_MUTE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/></svg>';
            var ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
            var ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
            var ICON_WAVES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/><path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" opacity=".55"/></svg>';

            // ── Injection HTML ──
            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML =
                '<div class="radar-outer">'
              +   '<div class="radar-resize-handle"></div>'
              +   '<div class="radar-alert-flash"></div>'
              +   '<div class="radar-scale-wrap">'
              +     '<div class="radar-widget">'
              +       '<div class="radar-header">'
              +         '<div class="radar-title">' + ICON_WAVES + 'Radar de bruit</div>'
              +         '<div class="radar-header-right">'
              +           '<button class="radar-icon-btn radar-toggle-controls" title="Afficher ou masquer les réglages">' + ICON_SLIDERS + '</button>'
              +           '<div class="wf-btns">'
              +             '<button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>'
              +             '<button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>'
              +             '<button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>'
              +           '</div>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-voice" role="group" aria-label="Niveau de voix attendu">'
              +         '<button class="radar-voice-btn" data-voice="0" title="Silence : on ne parle pas"><span class="radar-voice-num">0</span><span class="radar-voice-name">Silence</span></button>'
              +         '<button class="radar-voice-btn" data-voice="1" title="Chuchotement : seul mon voisin m\'entend"><span class="radar-voice-num">1</span><span class="radar-voice-name">Chuchoter</span></button>'
              +         '<button class="radar-voice-btn" data-voice="2" title="Voix de groupe : seul mon groupe m\'entend"><span class="radar-voice-num">2</span><span class="radar-voice-name">En groupe</span></button>'
              +         '<button class="radar-voice-btn" data-voice="3" title="Voix de classe : toute la classe m\'entend"><span class="radar-voice-num">3</span><span class="radar-voice-name">Classe</span></button>'
              +       '</div>'
              +       '<div class="radar-box-wrap">'
              +         '<div class="radar-ring outer-ring"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.25)"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.50)"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.75)"></div>'
              +         '<div class="radar-threshold-ring"></div>'
              +         '<div class="radar-blob"></div>'
              +         '<button class="radar-btn-start">'
              +           ICON_MIC
              +           '<span class="radar-btn-text">Écouter</span>'
              +           '<span class="radar-btn-status" aria-live="polite">Calme</span>'
              +           '<span class="radar-btn-stop">Arrêter</span>'
              +         '</button>'
              +       '</div>'
              +       '<div class="radar-alerts-row">'
              +         '<div class="radar-alerts-main">'
              +           '<span class="radar-alert-count">0</span>'
              +           '<span class="radar-alert-label">alerte</span>'
              +         '</div>'
              +         '<div class="radar-alert-btns">'
              +           '<button class="radar-icon-btn radar-sound-btn" title="Couper le bip">' + ICON_SOUND + '</button>'
              +           '<button class="radar-reset-btn">Remettre à zéro</button>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-controls">'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label">Sensibilité</span>'
              +           '<input type="range" class="radar-slider radar-sens-slider" min="0.1" max="5" step="0.1" value="1.5" aria-label="Sensibilité">'
              +           '<span class="radar-slider-val radar-sens-val">1.5</span>'
              +         '</div>'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label">Seuil</span>'
              +           '<input type="range" class="radar-slider radar-seuil-slider" min="10" max="100" step="5" value="85" aria-label="Seuil d\'alerte">'
              +           '<span class="radar-slider-val radar-seuil-val">85%</span>'
              +         '</div>'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label" title="Ignore les bruits courts et soudains (toux, règle qui tombe…). Plus la valeur est haute, plus le radar attend un brouhaha qui dure.">Lissage</span>'
              +           '<input type="range" class="radar-slider radar-smooth-slider" min="0" max="10" step="1" value="4" aria-label="Lissage">'
              +           '<span class="radar-slider-val radar-smooth-val">4</span>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-no-mic">Le micro est bloqué. Autorisez-le dans le navigateur.</div>'
              +     '</div>'
              +   '</div>'
              + '</div>';

            // ── Références DOM ──
            var outer          = widget.querySelector('.radar-outer');
            var scaleWrap      = widget.querySelector('.radar-scale-wrap');
            var blob           = widget.querySelector('.radar-blob');
            var threshRing     = widget.querySelector('.radar-threshold-ring');
            var btnStart       = widget.querySelector('.radar-btn-start');
            var alertCount     = widget.querySelector('.radar-alert-count');
            var soundBtn       = widget.querySelector('.radar-sound-btn');
            var resetBtn       = widget.querySelector('.radar-reset-btn');
            var sensSlider     = widget.querySelector('.radar-sens-slider');
            var seuilSlider    = widget.querySelector('.radar-seuil-slider');
            var sensVal        = widget.querySelector('.radar-sens-val');
            var seuilVal       = widget.querySelector('.radar-seuil-val');
            var noMicEl        = widget.querySelector('.radar-no-mic');
            var flashEl        = widget.querySelector('.radar-alert-flash');
            var toggleBtn      = widget.querySelector('.radar-toggle-controls');
            var controlsEl     = widget.querySelector('.radar-controls');
            var smoothSlider   = widget.querySelector('.radar-smooth-slider');
            var smoothVal      = widget.querySelector('.radar-smooth-val');
            var statusEl       = widget.querySelector('.radar-btn-status');
            var alertLabel     = widget.querySelector('.radar-alert-label');
            var wfMin          = widget.querySelector('[data-role="wf-min"]');
            var wfMax          = widget.querySelector('[data-role="wf-max"]');
            var wfClose        = widget.querySelector('[data-role="wf-close"]');
            var voiceBtns      = widget.querySelectorAll('.radar-voice-btn');

            // ── État interne ──
            var isListening   = false;
            var isMuted       = false;
            var isMax         = false;
            var alertsCount   = 0;
            var canTrigger    = true;
            var canPlaySound  = true;
            var smoothedLevel = 0;
            var sensitivity   = 1.5;
            var threshold     = 85;

            // ── Niveaux de voix : seuil propre à chaque niveau ──
            var VOICE_LEVELS = [
                { name: 'Silence',   threshold: 20 },
                { name: 'Chuchoter', threshold: 40 },
                { name: 'En groupe', threshold: 60 },
                { name: 'Classe',    threshold: 85 }
            ];
            var voiceLevel = 3;

            // ── Libellé de la mini-barre (widget réduit) ──
            var ZONE_LABELS = { calm: 'Calme', warn: 'Attention', alert: 'Trop fort' };
            var ZONE_EMOJI  = { calm: '🟢', warn: '🟠', alert: '🔴' };
            function miniLabelText() {
                var txt = '📡 Voix ' + voiceLevel + ' (' + VOICE_LEVELS[voiceLevel].name + ')';
                if (isListening && outer.dataset.zone) {
                    txt += ' — ' + ZONE_EMOJI[outer.dataset.zone] + ' ' + ZONE_LABELS[outer.dataset.zone];
                }
                if (alertsCount > 0) {
                    txt += ' · ' + alertsCount + (alertsCount > 1 ? ' alertes' : ' alerte');
                }
                return txt;
            }
            function updateMiniLabel() {
                var lbl = widget.querySelector('.wf-mini-bar > span');
                if (lbl) lbl.textContent = miniLabelText();
            }

            function setCount(n) {
                alertCount.textContent = n;
                alertLabel.textContent = n > 1 ? 'alertes' : 'alerte';
                updateMiniLabel();
            }

            // Remplissage coloré des curseurs
            function paintSlider(sl) {
                var min = parseFloat(sl.min), max = parseFloat(sl.max);
                sl.style.setProperty('--fill', ((parseFloat(sl.value) - min) / (max - min) * 100) + '%');
            }
            [sensSlider, seuilSlider, smoothSlider].forEach(paintSlider);

            // Zones : calme (vert) → attention (doré) → trop fort (corail)
            function setZone(level) {
                var r = threshold > 0 ? level / threshold : 0;
                var z = r >= 1 ? 'alert' : (r >= 0.7 ? 'warn' : 'calm');
                if (outer.dataset.zone !== z) {
                    outer.dataset.zone = z;
                    statusEl.textContent = ZONE_LABELS[z];
                    updateMiniLabel();
                }
            }

            // ── Dimensions de référence ──
            var REF_W = 340, REF_H = 470;
            var RATIO = REF_H / REF_W;

            function rescale() {
                if (isMax) {
                    // Plein écran : le contenu est agrandi au maximum et centré
                    var fw = outer.clientWidth  || window.innerWidth;
                    var fh = outer.clientHeight || window.innerHeight;
                    var fs = Math.min(fw / REF_W, fh / REF_H) * 0.96;
                    scaleWrap.style.width     = REF_W + 'px';
                    scaleWrap.style.height    = REF_H + 'px';
                    scaleWrap.style.left      = Math.round((fw - REF_W * fs) / 2) + 'px';
                    scaleWrap.style.top       = Math.round((fh - REF_H * fs) / 2) + 'px';
                    scaleWrap.style.transform = 'scale(' + fs + ')';
                    return;
                }
                var ow = outer.offsetWidth || REF_W;
                var s  = ow / REF_W;
                outer.style.height        = Math.round(ow * RATIO) + 'px';
                scaleWrap.style.width     = REF_W + 'px';
                scaleWrap.style.height    = REF_H + 'px';
                scaleWrap.style.left      = '0px';
                scaleWrap.style.top       = '0px';
                scaleWrap.style.transform = 'scale(' + s + ')';
            }

            // ── Resize proportionnel ──
            var resizeHandle = outer.querySelector('.radar-resize-handle');
            resizeHandle.addEventListener('mousedown', function (e) {
                if (isMax) return;
                e.preventDefault();
                e.stopPropagation();
                var startX = e.clientX;
                var startW = outer.offsetWidth;

                function onMove(ev) {
                    var newW = Math.max(220, startW + (ev.clientX - startX));
                    outer.style.width = newW + 'px';
                    rescale();
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
            resizeHandle.addEventListener('touchstart', function (e) {
                if (isMax) return;
                e.preventDefault();
                e.stopPropagation();
                var startX = e.touches[0].clientX;
                var startW = outer.offsetWidth;
                function onMove(ev) {
                    var newW = Math.max(220, startW + (ev.touches[0].clientX - startX));
                    outer.style.width = newW + 'px';
                    rescale();
                }
                function onEnd() {
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend',  onEnd);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend',  onEnd);
            }, { passive: false });

            rescale();

            // ── Lissage anti-pics courts ──
            // Objectif : ignorer les bruits courts et soudains (toux, règle qui
            // tombe, chaise…) et ne réagir qu'au brouhaha qui monte peu à peu.
            //
            // Principe (basé sur le temps réel, pas sur un nombre d'images) :
            //   1. On garde les N dernières secondes de mesures.
            //   2. Le niveau ambiant = la MÉDIANE de cette fenêtre : un bruit qui
            //      dure moins de la moitié de la fenêtre ne la fait pas bouger.
            //   3. Le radar suit ce niveau ambiant en douceur (montée progressive).
            //   4. L'alerte ne part que si le seuil est dépassé pendant un
            //      certain temps sans interruption.
            //
            // smoothingStrength : 0 = désactivé, 1 à 10 = force croissante
            var smoothingStrength = 4;
            var sampleBuffer   = [];   // { t: secondes, v: niveau 0..100 }
            var aboveSince     = null; // instant où le seuil a commencé à être dépassé
            var lastSampleTime = null;

            // Réglages déduits de la force du lissage (en secondes)
            function smoothingParams() {
                var k = smoothingStrength;
                return {
                    windowSec:  1 + k * 0.5,    // fenêtre de la médiane : 1,5 s → 6 s (défaut 3 s)
                    riseTau:    0.3 + k * 0.17, // temps de montée du radar : ~0,5 s → 2 s
                    fallTau:    1.0 + k * 0.1,  // temps de redescente : ~1,1 s → 2 s
                    sustainSec: 0.3 + k * 0.17  // durée de dépassement avant alerte : ~0,5 s → 2 s
                };
            }
            function resetSmoothing() {
                sampleBuffer = [];
                aboveSince = null;
                lastSampleTime = null;
            }
            // Seuil → taille du cercle pointillé
            function applyThreshold(val) {
                threshold = parseInt(val);
                threshRing.style.transform = 'scale(' + (threshold / 100) + ')';
                seuilVal.textContent = threshold + '%';
            }

            // Sélection d'un niveau de voix → applique son seuil
            function setVoiceLevel(n) {
                voiceLevel = n;
                voiceBtns.forEach(function (b) {
                    var on = parseInt(b.dataset.voice) === n;
                    b.classList.toggle('is-active', on);
                    b.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
                var t = VOICE_LEVELS[n].threshold;
                seuilSlider.value = t;
                paintSlider(seuilSlider);
                applyThreshold(t);
                aboveSince = null;
                if (smoothedLevel < threshold - 5) canTrigger = true;
                if (isListening) setZone(smoothedLevel);
                updateMiniLabel();
            }
            setVoiceLevel(3);

            // ── Audio ──
            var audioCtx        = null;
            var analyser        = null;
            var scriptProcessor = null;
            var micStream       = null;

            function getFrequencyAvg() {
                if (!analyser) return 0;
                var arr = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(arr);
                var sum = 0;
                for (var i = 0; i < arr.length; i++) sum += arr[i];
                return sum / arr.length;
            }

            function playAlert() {
                if (isMuted || !canPlaySound || !audioCtx) return;
                canPlaySound = false;
                if (audioCtx.state === 'suspended') audioCtx.resume();
                var osc      = audioCtx.createOscillator();
                var gainNode = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);
                setTimeout(function () { canPlaySound = true; }, 1500);
            }

            function nowSec() {
                return (window.performance ? performance.now() : Date.now()) / 1000;
            }

            function setAlerting(on) {
                blob.classList.toggle('is-alerting', on);
                flashEl.classList.toggle('active', on);
            }

            function triggerAlert() {
                alertsCount++; setCount(alertsCount); playAlert(); canTrigger = false;
            }

            function render(value) {
                var raw = Math.min(value * sensitivity, 100);

                if (smoothingStrength === 0) {
                    // Mode direct : réagit à tout, y compris aux bruits courts
                    smoothedLevel += (raw - smoothedLevel) * 0.15;
                    blob.style.transform = 'scale(' + (smoothedLevel / 100) + ')';
                    setZone(smoothedLevel);
                    if (smoothedLevel > threshold) {
                        setAlerting(true);
                        if (canTrigger) triggerAlert();
                    } else {
                        setAlerting(false);
                        if (smoothedLevel < threshold - 5) canTrigger = true;
                    }
                    return;
                }

                // ── Mode lissage : on ne garde que le brouhaha soutenu ──
                var p   = smoothingParams();
                var now = nowSec();
                var dt  = lastSampleTime === null ? 0.05 : Math.min(0.5, Math.max(0, now - lastSampleTime));
                lastSampleTime = now;

                // 1. Fenêtre glissante des N dernières secondes
                sampleBuffer.push({ t: now, v: raw });
                while (sampleBuffer.length && now - sampleBuffer[0].t > p.windowSec) sampleBuffer.shift();

                // 2. Niveau ambiant = médiane (les pics courts n'y entrent pas)
                var sorted = sampleBuffer.map(function (s) { return s.v; }).sort(function (a, b) { return a - b; });
                var ambient = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0;

                // 3. Suivi progressif du niveau ambiant (indépendant de la fréquence d'appel)
                var tau   = ambient > smoothedLevel ? p.riseTau : p.fallTau;
                var alpha = 1 - Math.exp(-dt / tau);
                smoothedLevel += (ambient - smoothedLevel) * alpha;

                blob.style.transform = 'scale(' + (smoothedLevel / 100) + ')';
                setZone(smoothedLevel);

                // 4. Alerte seulement si le seuil est dépassé de façon continue
                if (smoothedLevel > threshold) {
                    setAlerting(true);
                    if (aboveSince === null) aboveSince = now;
                    if (canTrigger && now - aboveSince >= p.sustainSec) triggerAlert();
                } else {
                    setAlerting(false);
                    aboveSince = null;
                    if (smoothedLevel < threshold - 5) canTrigger = true;
                }
            }

            function startMic() {
                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(function (stream) {
                        micStream = stream;
                        audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
                        analyser  = audioCtx.createAnalyser();
                        analyser.fftSize = 256;
                        var source = audioCtx.createMediaStreamSource(stream);
                        scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
                        source.connect(analyser);
                        analyser.connect(scriptProcessor);
                        scriptProcessor.connect(audioCtx.destination);
                        scriptProcessor.onaudioprocess = function () {
                            render(getFrequencyAvg());
                        };

                        isListening = true;
                        btnStart.classList.add('is-listening');
                        setZone(0);
                        updateMiniLabel();
                        noMicEl.style.display = 'none';

                        // Son de démarrage
                        setTimeout(function () { playAlert(); }, 100);
                    })
                    .catch(function (err) {
                        noMicEl.style.display = 'block';
                        console.warn('[Radar] Microphone refusé :', err);
                    });
            }

            function stopMic() {
                if (scriptProcessor) { scriptProcessor.onaudioprocess = null; }
                if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
                if (audioCtx)  { audioCtx.close(); audioCtx = null; }
                analyser = null;
                scriptProcessor = null;
                isListening = false;
                smoothedLevel = 0;
                resetSmoothing();
                blob.style.transform = 'scale(0)';
                blob.classList.remove('is-alerting');
                flashEl.classList.remove('active');
                btnStart.classList.remove('is-listening');
                delete outer.dataset.zone;
                updateMiniLabel();
            }

            // ── Événements boutons ──
            btnStart.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!isListening) startMic(); else stopMic();
            });

            soundBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                isMuted = !isMuted;
                soundBtn.innerHTML = isMuted ? ICON_MUTE : ICON_SOUND;
                soundBtn.title = isMuted ? 'Remettre le bip' : 'Couper le bip';
                soundBtn.classList.toggle('muted', isMuted);
            });

            resetBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                alertsCount = 0;
                setCount(0);
                canTrigger = true;
            });

            sensSlider.addEventListener('input', function () {
                sensitivity = parseFloat(this.value);
                sensVal.textContent = parseFloat(this.value).toFixed(1);
                paintSlider(this);
            });

            seuilSlider.addEventListener('input', function () {
                applyThreshold(this.value);
                VOICE_LEVELS[voiceLevel].threshold = threshold; // mémorisé pour ce niveau
                paintSlider(this);
            });

            voiceBtns.forEach(function (b) {
                b.addEventListener('click', function (e) {
                    e.stopPropagation();
                    setVoiceLevel(parseInt(this.dataset.voice));
                });
            });

            smoothSlider.addEventListener('input', function () {
                smoothingStrength = parseInt(this.value);
                smoothVal.textContent = smoothingStrength;
                paintSlider(this);
                resetSmoothing();
            });

            // ── Toggle contrôles ──
            var controlsVisible = true;
            toggleBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                controlsVisible = !controlsVisible;
                controlsEl.classList.toggle('hidden', !controlsVisible);
                toggleBtn.classList.toggle('is-off', !controlsVisible);
            });

            // ── Boutons fenêtre : réduire / plein écran / fermer ──────────
            function setMax(on) {
                isMax = !!on;
                outer.classList.toggle('radar-fullboard', isMax);
                wfMax.title = isMax ? 'Quitter le plein écran' : 'Plein écran';
                outer.style.cursor = '';
                rescale();
            }

            function onWinResize() { if (isMax) rescale(); }
            function onKey(e) { if (isMax && e.key === 'Escape') setMax(false); }
            window.addEventListener('resize', onWinResize);
            document.addEventListener('keydown', onKey);

            wfMin.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isMax) setMax(false);
                // On masque le radar pendant la réduction : l'écoute continue,
                // la mini-barre affiche l'état et le nombre d'alertes.
                outer.style.display = 'none';
                window._wfMiniBarCollapse(widget, miniLabelText(), {
                    onExpand: function () {
                        outer.style.display = '';
                        requestAnimationFrame(rescale);
                    }
                });
            });

            wfMax.addEventListener('click', function (e) {
                e.stopPropagation();
                setMax(!isMax);
            });

            wfClose.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                stopMic();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });

            // ── Bloquer propagation sur éléments interactifs (et partout en plein écran) ──
            outer.addEventListener('mousedown', function (e) {
                if (isMax || e.target.closest('button, input, .radar-resize-handle')) {
                    e.stopPropagation();
                }
            });
            outer.addEventListener('touchstart', function (e) {
                if (isMax || e.target.closest('button, input, .radar-resize-handle')) {
                    e.stopPropagation();
                }
            }, { passive: true });

            // ── Curseur move sauf sur éléments interactifs et coin resize ──
            outer.addEventListener('mousemove', function (e) {
                if (isMax) { outer.style.cursor = ''; return; }
                if (e.target.closest('button, input')) { return; }
                if (e.target.closest('.radar-resize-handle')) { outer.style.cursor = 'nwse-resize'; return; }
                outer.style.cursor = 'move';
            });
            outer.addEventListener('mouseleave', function () {
                outer.style.cursor = '';
            });

            // ── Nettoyage à la suppression ──
            var obs = new MutationObserver(function () {
                if (!document.contains(widget)) {
                    stopMic();
                    window.removeEventListener('resize', onWinResize);
                    document.removeEventListener('keydown', onKey);
                    obs.disconnect();
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });

        })();
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'radar') initRadarWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'radar') initRadarWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
