// =========================================================================
// WIDGET « LES COULEURS DU BRUIT » — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'couleurs-bruit'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-couleurs-bruit.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets ou Outils) :
//      <div class="mm-sub-item" onclick="createWidget('couleurs-bruit');closeMainMenu()">
//          <span class="mm-ico">🎨</span>&nbsp;&nbsp;Les couleurs du bruit
//      </div>
//
// Fonctionnement :
//   • Le rectangle (800 × 600 à l'ouverture) est vert au départ.
//   • Il passe en dégradé continu vers le jaune (40 %), l'orange (60 %)
//     puis le rouge (80 %) quand le bruit augmente.
//   • Une courbe traverse le rectangle de gauche à droite ; elle s'anime
//     de plus en plus quand le bruit augmente.
//   • Latence : la couleur monte assez vite mais redescend lentement
//     vers le vert (réglage « Retour au vert »).
//   • Écoute : même mesure que le Sonomètre (bande de fréquences de la voix,
//     niveau relatif 0 à 100, pas des décibels).
//   • Lissage : même logique que le Radar de bruit (médiane sur une fenêtre
//     de quelques secondes + montée progressive) → les bruits courts et
//     soudains (toux, règle qui tombe…) sont ignorés.
//
// Boutons fenêtre (comme les autres widgets) :
//   🟡 Réduire      → mini-barre en haut du tableau (l'écoute continue)
//   🟢 Plein écran  → le widget occupe tout l'écran (Échap pour sortir)
//   🔴 Fermer       → coupe le micro et supprime le widget
// =========================================================================

// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

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
    /* Widget parent transparent : cb-outer porte tout le visuel */
    .widget[data-type="couleurs-bruit"],
    .widget[data-type="couleurs-bruit"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="couleurs-bruit"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Rectangle principal ── */
    .widget[data-type="couleurs-bruit"] .cb-outer {
        --cb-ink:   #14202E;
        --cb-glass: rgba(255,255,255,0.62);

        position: relative;
        width:  800px;
        height: 600px;
        min-width:  320px;
        min-height: 240px;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 24px;
        background-color: rgb(52,199,123);
        color: var(--cb-ink);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
        container-type: size;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
    }
    .widget[data-type="couleurs-bruit"]:hover .cb-outer,
    .widget[data-type="couleurs-bruit"]:focus-within .cb-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* Reflet doux + léger vignettage pour donner de la profondeur */
    .cb-sheen {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
    }

    .cb-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        pointer-events: none;
    }

    /* ── Plein écran ── */
    .widget[data-type="couleurs-bruit"] .cb-outer.cb-fullboard {
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
    .cb-outer.cb-fullboard .cb-resize-handle { display: none; }

    /* ── Téléphone : plein écran du bouton vert, décalé de 40 px à gauche
       pour laisser les onglets latéraux visibles, hauteur réelle de l'écran ── */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget[data-type="couleurs-bruit"] .cb-outer.cb-fullboard {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
            border: none !important;
            border-radius: 0 !important;
        }
    }

    /* ── En-tête ── */
    .cb-header {
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
    .cb-header > * { pointer-events: auto; }
    .cb-title,
    .cb-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--cb-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .cb-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
    }
    .cb-title svg { width: 18px; height: 18px; flex-shrink: 0; }
    .cb-tools { padding: 5px 12px 5px 6px; flex-shrink: 0; }

    .cb-icon-btn {
        width: 32px; height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--cb-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .cb-icon-btn svg { width: 18px; height: 18px; }
    .cb-icon-btn:hover,
    .cb-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .cb-icon-btn:focus-visible { outline: 2px solid var(--cb-ink); outline-offset: 2px; }

    .cb-listen-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 7px 14px 7px 11px;
        cursor: pointer;
        background: var(--cb-ink);
        color: #fff;
        transition: background .2s, color .2s, transform .1s;
    }
    .cb-listen-btn svg { width: 15px; height: 15px; }
    .cb-listen-btn:active { transform: scale(0.96); }
    .cb-listen-btn:focus-visible { outline: 2px solid var(--cb-ink); outline-offset: 2px; }
    .cb-listen-btn.is-on { background: rgba(20,32,46,0.12); color: var(--cb-ink); }
    .cb-listen-btn.is-on:hover { background: rgba(20,32,46,0.2); }
    .cb-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 4px; }

    /* ── Bouton central (avant l'écoute) ── */
    .cb-center {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4;
        pointer-events: none;
    }
    .cb-start {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: inherit;
        font-size: clamp(16px, 3.6cqmin, 26px);
        font-weight: 700;
        color: var(--cb-ink);
        background: rgba(255,255,255,0.88);
        border: none;
        border-radius: 999px;
        padding: 0.8em 1.5em 0.8em 1.2em;
        cursor: pointer;
        box-shadow: 0 14px 30px -14px rgba(10,20,35,0.6);
        transition: transform .15s, box-shadow .2s;
    }
    .cb-start svg { width: 1.3em; height: 1.3em; }
    .cb-start:hover { transform: translateY(-2px); box-shadow: 0 18px 34px -14px rgba(10,20,35,0.6); }
    .cb-start:active { transform: scale(0.97); }
    .cb-start:focus-visible { outline: 3px solid var(--cb-ink); outline-offset: 4px; }
    .cb-outer.is-listening .cb-center { display: none; }

    /* ── Étiquette d'état (pendant l'écoute) ── */
    .cb-status {
        position: absolute;
        left: 50%;
        bottom: 7%;
        transform: translateX(-50%);
        z-index: 4;
        display: none;
        align-items: center;
        gap: 0.45em;
        padding: 0.3em 1.1em 0.3em 0.8em;
        border-radius: 999px;
        background: rgba(255,255,255,0.72);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        font-size: clamp(16px, 6cqmin, 60px);
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 10px 26px -14px rgba(10,20,35,0.55);
    }
    .cb-outer.is-listening .cb-status { display: flex; }
    .cb-status-dot {
        width: 0.62em; height: 0.62em;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.25);
        flex-shrink: 0;
    }

    /* ── Panneau de réglages ── */
    .cb-settings {
        position: absolute;
        top: 62px;
        right: 16px;
        width: 290px;
        max-width: calc(100% - 32px);
        box-sizing: border-box;
        z-index: 6;
        display: none;
        flex-direction: column;
        gap: 11px;
        padding: 14px 16px 12px;
        border-radius: 16px;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
    }
    .cb-settings.open { display: flex; }
    .cb-settings-title { font-size: 13px; font-weight: 700; }
    .cb-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.75);
    }
    .cb-row-label { width: 92px; flex-shrink: 0; }
    .cb-slider {
        --fill: 50%;
        flex: 1;
        height: 6px;
        margin: 0;
        cursor: pointer;
        border-radius: 6px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, var(--cb-ink) var(--fill), rgba(20,32,46,0.15) var(--fill));
    }
    .cb-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--cb-ink);
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        cursor: pointer;
    }
    .cb-slider::-moz-range-thumb {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--cb-ink);
        cursor: pointer;
    }
    .cb-slider:focus-visible { outline: 2px solid var(--cb-ink); outline-offset: 5px; }
    .cb-row-val {
        width: 38px;
        text-align: right;
        font-weight: 700;
        color: var(--cb-ink);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
    }
    .cb-legend {
        display: flex;
        height: 8px;
        border-radius: 8px;
        overflow: hidden;
        background: linear-gradient(to right,
            rgb(52,199,123) 0%, rgb(246,212,60) 40%, rgb(247,152,58) 60%,
            rgb(232,77,61) 80%, rgb(214,52,52) 100%);
        position: relative;
    }
    .cb-legend-marker {
        position: absolute;
        top: -3px;
        width: 3px; height: 14px;
        border-radius: 2px;
        background: var(--cb-ink);
        left: 0;
        transform: translateX(-50%);
    }
    .cb-legend-ticks {
        position: relative;
        height: 12px;
        font-size: 10px;
        font-weight: 700;
        color: rgba(20,32,46,0.6);
        margin-top: -6px;
    }
    .cb-legend-ticks span { position: absolute; transform: translateX(-50%); }
    .cb-readout { font-size: 11px; font-weight: 600; color: rgba(20,32,46,0.6); }

    /* ── Micro refusé ── */
    .cb-no-mic {
        position: absolute;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        z-index: 6;
        display: none;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        background: rgba(20,32,46,0.85);
        padding: 7px 14px;
        border-radius: 999px;
        white-space: nowrap;
    }

    /* ── Poignée de redimensionnement ── */
    .cb-resize-handle {
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
    .widget[data-type="couleurs-bruit"]:hover .cb-resize-handle,
    .widget[data-type="couleurs-bruit"]:focus-within .cb-resize-handle { opacity: 1; }
    `;

    if (!document.getElementById('couleurs-bruit-style')) {
        var st = document.createElement('style');
        st.id = 'couleurs-bruit-style';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Palette : vert → jaune (40 %) → orange (60 %) → rouge (80 %) ──────
    var COLOR_STOPS = [
        { at: 0,   rgb: [52, 199, 123] },  // vert
        { at: 40,  rgb: [246, 212, 60] },  // jaune
        { at: 60,  rgb: [247, 152, 58] },  // orange
        { at: 80,  rgb: [232, 77, 61]  },  // rouge
        { at: 100, rgb: [214, 52, 52]  }   // rouge plus profond
    ];
    function colorAt(level) {
        var l = Math.max(0, Math.min(100, level));
        for (var i = 1; i < COLOR_STOPS.length; i++) {
            var a = COLOR_STOPS[i - 1], b = COLOR_STOPS[i];
            if (l <= b.at) {
                var t = (l - a.at) / (b.at - a.at);
                // interpolation adoucie : transitions plus naturelles
                t = t * t * (3 - 2 * t);
                return [
                    Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
                    Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
                    Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t)
                ];
            }
        }
        return COLOR_STOPS[COLOR_STOPS.length - 1].rgb.slice();
    }

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initCouleursBruitWidget = function (widget) {
        (function () {

            // ── Icônes ──
            var ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
            var ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>';
            var ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
            var ICON_WAVE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0 2 3 2 3"/></svg>';

            // ── Injection HTML ──
            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML =
                '<div class="cb-outer">'
              +   '<div class="cb-sheen"></div>'
              +   '<canvas class="cb-canvas"></canvas>'
              +   '<div class="cb-header">'
              +     '<div class="cb-title">' + ICON_WAVE + '<span>Les couleurs du bruit</span></div>'
              +     '<div class="cb-tools">'
              +       '<button class="cb-icon-btn cb-settings-btn" title="Réglages">' + ICON_SLIDERS + '</button>'
              +       '<button class="cb-listen-btn">' + ICON_MIC + '<span>Écouter</span></button>'
              +       '<span class="cb-sep"></span>'
              +       '<div class="wf-btns">'
              +         '<button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>'
              +         '<button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>'
              +         '<button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>'
              +       '</div>'
              +     '</div>'
              +   '</div>'
              +   '<div class="cb-settings">'
              +     '<div class="cb-settings-title">Réglages</div>'
              +     '<div class="cb-row">'
              +       '<span class="cb-row-label" title="Amplifie le son capté par le micro">Sensibilité</span>'
              +       '<input type="range" class="cb-slider cb-sens" min="0.2" max="4" step="0.1" value="1.2" aria-label="Sensibilité">'
              +       '<span class="cb-row-val cb-sens-val">1.2</span>'
              +     '</div>'
              +     '<div class="cb-row">'
              +       '<span class="cb-row-label" title="Ignore les bruits courts et soudains (toux, règle qui tombe…). Plus la valeur est haute, plus il faut un brouhaha qui dure.">Lissage</span>'
              +       '<input type="range" class="cb-slider cb-smooth" min="0" max="10" step="1" value="4" aria-label="Lissage">'
              +       '<span class="cb-row-val cb-smooth-val">4</span>'
              +     '</div>'
              +     '<div class="cb-row">'
              +       '<span class="cb-row-label" title="Temps qu\'il faut à la couleur pour redescendre du rouge vers le vert">Retour au vert</span>'
              +       '<input type="range" class="cb-slider cb-fall" min="2" max="30" step="1" value="10" aria-label="Retour au vert">'
              +       '<span class="cb-row-val cb-fall-val">10 s</span>'
              +     '</div>'
              +     '<div>'
              +       '<div class="cb-legend"><span class="cb-legend-marker"></span></div>'
              +       '<div class="cb-legend-ticks"><span style="left:0%;transform:none">0</span><span style="left:40%">40</span><span style="left:60%">60</span><span style="left:80%">80</span><span style="left:100%;transform:translateX(-100%)">100</span></div>'
              +     '</div>'
              +     '<div class="cb-readout">Micro inactif</div>'
              +   '</div>'
              +   '<div class="cb-center">'
              +     '<button class="cb-start">' + ICON_MIC + '<span>Écouter la classe</span></button>'
              +   '</div>'
              +   '<div class="cb-status" aria-live="polite"><span class="cb-status-dot"></span><span class="cb-status-text">Calme</span></div>'
              +   '<div class="cb-no-mic">Le micro est bloqué. Autorisez-le dans le navigateur.</div>'
              +   '<div class="cb-resize-handle"></div>'
              + '</div>';

            // ── Références DOM ──
            var outer       = widget.querySelector('.cb-outer');
            var canvas      = widget.querySelector('.cb-canvas');
            var ctx         = canvas.getContext('2d');
            var listenBtn   = widget.querySelector('.cb-listen-btn');
            var startBtn    = widget.querySelector('.cb-start');
            var settingsBtn = widget.querySelector('.cb-settings-btn');
            var settingsEl  = widget.querySelector('.cb-settings');
            var sensSlider  = widget.querySelector('.cb-sens');
            var smoothSlider= widget.querySelector('.cb-smooth');
            var fallSlider  = widget.querySelector('.cb-fall');
            var sensVal     = widget.querySelector('.cb-sens-val');
            var smoothVal   = widget.querySelector('.cb-smooth-val');
            var fallVal     = widget.querySelector('.cb-fall-val');
            var marker      = widget.querySelector('.cb-legend-marker');
            var readout     = widget.querySelector('.cb-readout');
            var statusDot   = widget.querySelector('.cb-status-dot');
            var statusText  = widget.querySelector('.cb-status-text');
            var noMicEl     = widget.querySelector('.cb-no-mic');
            var resizeHandle= widget.querySelector('.cb-resize-handle');
            var wfMin       = widget.querySelector('[data-role="wf-min"]');
            var wfMax       = widget.querySelector('[data-role="wf-max"]');
            var wfClose     = widget.querySelector('[data-role="wf-close"]');

            // ── État ──
            var isListening  = false;
            var isMax        = false;
            var alive        = true;
            var sensitivity  = 1.2;
            var smoothingStrength = 4;
            var fallSeconds  = 10;   // durée du retour du rouge vers le vert
            var smoothedLevel = 0;   // niveau lissé (anime la courbe)
            var colorLevel    = 0;   // niveau de couleur (avec latence à la descente)
            var lastRawLevel  = 0;
            var zone          = null;

            // ── Zones (pour l'étiquette et la mini-barre) ──
            var ZONES = [
                { max: 40,  key: 'calm',   label: 'Calme',     emoji: '🟢' },
                { max: 60,  key: 'rise',   label: 'Agité',     emoji: '🟡' },
                { max: 80,  key: 'loud',   label: 'Bruyant',   emoji: '🟠' },
                { max: 101, key: 'tooloud',label: 'Trop fort\u00A0!', emoji: '🔴' }
            ];
            function zoneFor(l) {
                for (var i = 0; i < ZONES.length; i++) if (l < ZONES[i].max) return ZONES[i];
                return ZONES[ZONES.length - 1];
            }

            function miniLabelText() {
                var txt = '🎨 Les couleurs du bruit';
                if (isListening && zone) txt += ' — ' + zone.emoji + ' ' + zone.label;
                return txt;
            }
            function updateMiniLabel() {
                var lbl = widget.querySelector('.wf-mini-bar > span');
                if (lbl) lbl.textContent = miniLabelText();
            }

            // ── Curseurs ──
            function paintSlider(sl) {
                var min = parseFloat(sl.min), max = parseFloat(sl.max);
                sl.style.setProperty('--fill', ((parseFloat(sl.value) - min) / (max - min) * 100) + '%');
            }
            [sensSlider, smoothSlider, fallSlider].forEach(paintSlider);

            // ── Lissage (repris du Radar de bruit) ──
            // On garde les N dernières secondes de mesures ; le niveau ambiant
            // est la MÉDIANE de cette fenêtre : un bruit court (toux, règle qui
            // tombe) qui dure moins de la moitié de la fenêtre est ignoré.
            // smoothingStrength : 0 = désactivé, 1 à 10 = force croissante.
            var sampleBuffer = [];
            function smoothingParams() {
                var k = smoothingStrength;
                return {
                    windowSec: 1 + k * 0.5,    // fenêtre de la médiane : 1,5 s → 6 s (défaut 3 s)
                    riseTau:   0.3 + k * 0.17, // temps de montée : ~0,5 s → 2 s
                    fallTau:   1.0 + k * 0.1   // temps de redescente du niveau mesuré
                };
            }
            function resetSmoothing() { sampleBuffer = []; }

            function updateSmoothed(raw, now, dt) {
                if (smoothingStrength === 0) {
                    smoothedLevel += (raw - smoothedLevel) * (1 - Math.exp(-dt / 0.12));
                    return;
                }
                var p = smoothingParams();
                sampleBuffer.push({ t: now, v: raw });
                while (sampleBuffer.length && now - sampleBuffer[0].t > p.windowSec) sampleBuffer.shift();
                var sorted = sampleBuffer.map(function (s) { return s.v; }).sort(function (a, b) { return a - b; });
                var ambient = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0;
                var tau = ambient > smoothedLevel ? p.riseTau : p.fallTau;
                smoothedLevel += (ambient - smoothedLevel) * (1 - Math.exp(-dt / tau));
            }

            // Couleur : suit le niveau lissé à la montée, mais redescend
            // beaucoup plus lentement (latence). En « fallSeconds », la couleur
            // a fait ~95 % du chemin de retour.
            function updateColorLevel(dt) {
                var rising = smoothedLevel > colorLevel;
                var tau = rising ? 0.5 : fallSeconds / 3;
                colorLevel += (smoothedLevel - colorLevel) * (1 - Math.exp(-dt / tau));
            }

            // ── Écoute (reprise du Sonomètre) ──
            var audioCtx  = null;
            var analyser  = null;
            var micStream = null;
            var freqData  = null;

            // Niveau relatif 0..100 sur la bande de fréquences de la voix
            function measureLevel() {
                if (!analyser) return 0;
                analyser.getByteFrequencyData(freqData);
                var lo = Math.floor(freqData.length * 0.05);
                var hi = Math.floor(freqData.length * 0.6);
                var sum = 0, count = 0;
                for (var i = lo; i < hi; i++) { sum += freqData[i]; count++; }
                var raw = count ? sum / count : 0;
                return Math.min(100, (raw / 255) * 100 * sensitivity);
            }

            function setListeningUI(on) {
                outer.classList.toggle('is-listening', on);
                listenBtn.classList.toggle('is-on', on);
                listenBtn.innerHTML = on ? ICON_STOP + '<span>Arrêter</span>' : ICON_MIC + '<span>Écouter</span>';
                listenBtn.title = on ? 'Arrêter l\'écoute' : 'Écouter la classe';
                if (!on) readout.textContent = 'Micro inactif';
                updateMiniLabel();
            }

            function startMic() {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    noMicEl.style.display = 'block';
                    return;
                }
                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(function (stream) {
                        if (!alive) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
                        micStream = stream;
                        audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
                        analyser  = audioCtx.createAnalyser();
                        analyser.fftSize = 256;
                        analyser.smoothingTimeConstant = 0.6;
                        freqData = new Uint8Array(analyser.frequencyBinCount);
                        audioCtx.createMediaStreamSource(stream).connect(analyser);
                        resetSmoothing();
                        isListening = true;
                        noMicEl.style.display = 'none';
                        setListeningUI(true);
                    })
                    .catch(function (err) {
                        noMicEl.style.display = 'block';
                        console.warn('[Couleurs du bruit] Microphone refusé :', err);
                    });
            }

            function stopMic() {
                if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
                if (audioCtx)  { audioCtx.close(); audioCtx = null; }
                analyser = null;
                isListening = false;
                lastRawLevel = 0;
                resetSmoothing();
                setListeningUI(false);
                // La couleur et la courbe redescendent doucement d'elles-mêmes
            }

            // ── Canvas : taille réelle × densité d'écran ──
            var cw = 0, ch = 0, dpr = 1;
            function sizeCanvas() {
                var w = outer.clientWidth, h = outer.clientHeight;
                var d = window.devicePixelRatio || 1;
                if (w === cw && h === ch && d === dpr) return;
                cw = w; ch = h; dpr = d;
                canvas.width  = Math.max(1, Math.round(w * d));
                canvas.height = Math.max(1, Math.round(h * d));
            }

            // ── Courbe du son ──
            // Trois ondes superposées : plus le bruit est fort, plus l'amplitude,
            // la vitesse et les petites ondulations « nerveuses » augmentent.
            var phase1 = 0, phase2 = 0, phase3 = 0;
            function drawWave(level, dt) {
                var L = Math.max(0, Math.min(1, level / 100));
                phase1 += dt * (0.7 + 3.2 * L);
                phase2 += dt * (1.0 + 5.0 * L);
                phase3 += dt * (1.8 + 11  * L);

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.clearRect(0, 0, cw, ch);

                var mid    = ch / 2;
                var amp    = ch * (0.025 + 0.27 * L);
                var cycles = 1.3 + 2.0 * L;
                var w2     = 0.28 * (0.35 + L);       // 2e harmonique
                var w3     = 0.22 * L * L;            // agitation (bruit fort)
                var norm   = 1 / (0.62 + w2 + w3);
                var step   = Math.max(3, cw / 260);

                var layers = [
                    { off:  1.1, alpha: 0.16, lw: 2,   m: 0.70 },
                    { off: -0.7, alpha: 0.26, lw: 2.5, m: 0.86 },
                    { off:  0,   alpha: 0.82, lw: Math.max(3, Math.min(ch, cw) * 0.009), m: 1 }
                ];
                ctx.lineCap  = 'round';
                ctx.lineJoin = 'round';
                for (var li = 0; li < layers.length; li++) {
                    var ly = layers[li];
                    ctx.beginPath();
                    for (var x = 0; x <= cw + step; x += step) {
                        var u = (x / cw) * Math.PI * 2 * cycles;
                        var y = 0.62 * Math.sin(u + phase1 + ly.off)
                              + w2   * Math.sin(2.3 * u - phase2 + ly.off * 1.7)
                              + w3   * Math.sin(7.1 * u + phase3 - ly.off);
                        y = mid + amp * ly.m * y * norm;
                        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.strokeStyle = 'rgba(20,32,46,' + ly.alpha + ')';
                    ctx.lineWidth = ly.lw;
                    ctx.stroke();
                }
            }

            // ── Boucle d'animation ──
            var rafId = null;
            var lastTs = null;
            var readoutTimer = 0;
            function frame(ts) {
                if (!alive) return;
                rafId = requestAnimationFrame(frame);
                var dt = lastTs === null ? 1 / 60 : Math.min(0.1, Math.max(0, (ts - lastTs) / 1000));
                lastTs = ts;
                var now = ts / 1000;

                if (isListening && analyser) {
                    lastRawLevel = measureLevel();
                    updateSmoothed(lastRawLevel, now, dt);
                } else {
                    // Micro coupé : retour doux au calme
                    smoothedLevel += (0 - smoothedLevel) * (1 - Math.exp(-dt / 1.2));
                }
                updateColorLevel(dt);

                // Rien à dessiner si le widget est réduit
                if (outer.style.display === 'none') return;

                // Couleur de fond en dégradé continu
                var c = colorAt(colorLevel);
                outer.style.backgroundColor = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';

                // Étiquette d'état (basée sur la couleur affichée)
                var z = zoneFor(colorLevel);
                if (z !== zone) {
                    zone = z;
                    statusText.textContent = z.label;
                    updateMiniLabel();
                }
                statusDot.style.background = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';

                // Réglages : repère sur la légende + lecture du niveau
                if (settingsEl.classList.contains('open')) {
                    marker.style.left = Math.max(0, Math.min(100, colorLevel)) + '%';
                    readoutTimer += dt;
                    if (isListening && readoutTimer > 0.25) {
                        readoutTimer = 0;
                        readout.textContent = 'Niveau mesuré : ' + Math.round(lastRawLevel)
                            + ' / 100 · retenu : ' + Math.round(smoothedLevel) + ' / 100';
                    }
                }

                sizeCanvas();
                drawWave(smoothedLevel, dt);
            }
            sizeCanvas();
            rafId = requestAnimationFrame(frame);

            var ro = null;
            if (window.ResizeObserver) {
                ro = new ResizeObserver(function () { sizeCanvas(); });
                ro.observe(outer);
            }

            // ── Événements ──
            function toggleListen(e) {
                e.stopPropagation();
                if (!isListening) startMic(); else stopMic();
            }
            listenBtn.addEventListener('click', toggleListen);
            startBtn.addEventListener('click', toggleListen);

            settingsBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var open = !settingsEl.classList.contains('open');
                settingsEl.classList.toggle('open', open);
                settingsBtn.classList.toggle('is-on', open);
            });

            sensSlider.addEventListener('input', function () {
                sensitivity = parseFloat(this.value);
                sensVal.textContent = sensitivity.toFixed(1);
                paintSlider(this);
            });
            smoothSlider.addEventListener('input', function () {
                smoothingStrength = parseInt(this.value);
                smoothVal.textContent = smoothingStrength;
                paintSlider(this);
                resetSmoothing();
            });
            fallSlider.addEventListener('input', function () {
                fallSeconds = parseInt(this.value);
                fallVal.textContent = fallSeconds + ' s';
                paintSlider(this);
            });

            // ── Redimensionnement libre (rectangle) ──
            function startResize(clientX, clientY, isTouch) {
                var startX = clientX, startY = clientY;
                var startW = outer.offsetWidth, startH = outer.offsetHeight;
                function apply(x, y) {
                    outer.style.width  = Math.max(320, startW + (x - startX)) + 'px';
                    outer.style.height = Math.max(240, startH + (y - startY)) + 'px';
                    sizeCanvas();
                }
                function onMouseMove(ev) { apply(ev.clientX, ev.clientY); }
                function onTouchMove(ev) { ev.preventDefault(); apply(ev.touches[0].clientX, ev.touches[0].clientY); }
                function end() {
                    document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', isTouch ? onTouchMove : onMouseMove);
                    document.removeEventListener(isTouch ? 'touchend' : 'mouseup', end);
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

            // ── Boutons fenêtre : réduire / plein écran / fermer ──
            function setMax(on) {
                isMax = !!on;
                outer.classList.toggle('cb-fullboard', isMax);
                wfMax.title = isMax ? 'Quitter le plein écran' : 'Plein écran';
                outer.style.cursor = '';
                sizeCanvas();
            }
            widget._cbSetMax = setMax;   // utilisé à l'ouverture sur téléphone
            function onKey(e) { if (isMax && e.key === 'Escape') setMax(false); }
            document.addEventListener('keydown', onKey);

            wfMin.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isMax) setMax(false);
                // Le rectangle est masqué pendant la réduction : l'écoute continue,
                // la mini-barre affiche l'état.
                outer.style.display = 'none';
                window._wfMiniBarCollapse(widget, miniLabelText(), {
                    onExpand: function () {
                        outer.style.display = '';
                        requestAnimationFrame(sizeCanvas);
                    }
                });
            });

            wfMax.addEventListener('click', function (e) {
                e.stopPropagation();
                setMax(!isMax);
            });

            function destroy() {
                if (!alive) return;
                alive = false;
                cancelAnimationFrame(rafId);
                stopMic();
                if (ro) ro.disconnect();
                document.removeEventListener('keydown', onKey);
            }

            wfClose.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                destroy();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });

            // ── Propagation : ne pas déplacer le widget depuis les contrôles ──
            var INTERACTIVE = 'button, input, .cb-settings, .cb-resize-handle';
            outer.addEventListener('mousedown', function (e) {
                if (isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
            });
            outer.addEventListener('touchstart', function (e) {
                if (isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
            }, { passive: true });
            // En plein écran, aucun appui ne doit déplacer le widget (resté dessous)
            outer.addEventListener('pointerdown', function (e) {
                if (isMax) e.stopPropagation();
            });

            // ── Curseur « déplacer » sur le fond ──
            outer.addEventListener('mousemove', function (e) {
                if (isMax) { outer.style.cursor = ''; return; }
                if (e.target.closest('button, input, .cb-settings')) { outer.style.cursor = ''; return; }
                if (e.target.closest('.cb-resize-handle')) { outer.style.cursor = 'nwse-resize'; return; }
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

        })();
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'couleurs-bruit' && widget) {
                    initCouleursBruitWidget(widget);
                    // Sur téléphone : ouverture directe en plein écran (bouton vert)
                    if (_wfIsPhoneLaunch() && widget._cbSetMax) widget._cbSetMax(true);
                }
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'couleurs-bruit' && widget) {
                    initCouleursBruitWidget(widget);
                    // Sur téléphone : ouverture directe en plein écran (bouton vert)
                    if (_wfIsPhoneLaunch() && widget._cbSetMax) widget._cbSetMax(true);
                }
                    return widget;
                };
            }
        });
    }

})();
