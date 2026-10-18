// =========================================================================
// WIDGET SONOMÈTRE — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'sonometre'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-sonometre.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('sonometre');closeMainMenu()">
//          <span class="mm-ico">🔊</span>&nbsp;&nbsp;Sonomètre
//      </div>
//
// Boutons fenêtre (comme les autres widgets) :
//   🟡 Réduire      → mini-barre en haut du tableau (la mesure continue,
//                      la mini-barre affiche l'état sonore)
//   🟢 Plein écran  → le sonomètre occupe tout l'écran (Échap pour sortir)
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

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* Le widget parent devient invisible, sono-outer porte tout le visuel */
    .widget[data-type="sonometre"],
    .widget[data-type="sonometre"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="sonometre"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Rectangle principal : fond pastel + reflet (style calculatrice) ── */
    .widget[data-type="sonometre"] .sono-outer {
        --so-ink:   #14202E;
        --so-muted: rgba(20,32,46,0.6);
        --so-glass: rgba(255,255,255,0.62);
        --so-bg:    #F6D86A;
        --so-op:    #B9770E;

        position: relative;
        width:  300px;
        height: 560px;
        min-width:  220px;
        min-height: 200px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        background-color: var(--so-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        color: var(--so-ink);
        transition: background-color .3s;
    }
    .widget[data-type="sonometre"]:hover .sono-outer,
    .widget[data-type="sonometre"]:focus-within .sono-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Plein écran ── */
    .widget[data-type="sonometre"] .sono-outer.sono-fullboard {
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
    .sono-outer.sono-fullboard .sono-resize-handle { display: none; }

    /* ── Téléphone : plein écran à la hauteur réelle de l'écran, décalé de 40 px à gauche pour laisser les onglets latéraux visibles ── */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget[data-type="sonometre"] .sono-outer.sono-fullboard {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
        }
    }

    /* Poignée de redimensionnement (pointillés) */
    .sono-resize-handle {
        position: absolute;
        bottom: 6px; right: 6px;
        width: 18px; height: 18px;
        cursor: nwse-resize;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s;
        background: radial-gradient(circle, rgba(20,32,46,0.55) 1.3px, transparent 1.7px) 0 0 / 6px 6px;
        -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                mask: linear-gradient(135deg, transparent 50%, #000 50%);
    }

    /* Poignées des bords : droite (largeur) et bas (hauteur) */
    .sono-resize-handle.rh-e,
    .sono-resize-handle.rh-s {
        background: none;
        -webkit-mask: none;
                mask: none;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .sono-resize-handle.rh-e { top: 40px; bottom: 40px; right: 0; width: 10px; height: auto; cursor: ew-resize; }
    .sono-resize-handle.rh-s { left: 40px; right: 40px; bottom: 0; height: 10px; width: auto; cursor: ns-resize; }
    .sono-resize-handle.rh-e::after,
    .sono-resize-handle.rh-s::after {
        content: '';
        border-radius: 999px;
        background: rgba(20,32,46,0.35);
    }
    .sono-resize-handle.rh-e::after { width: 4px; height: 36px; }
    .sono-resize-handle.rh-s::after { width: 36px; height: 4px; }
    .widget[data-type="sonometre"]:hover .sono-resize-handle,
    .widget[data-type="sonometre"]:focus-within .sono-resize-handle {
        opacity: 1;
    }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="sonometre"] .sono-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
    }

    /* ── Widget intérieur (taille de référence 300×560) ── */
    .sono-widget {
        --g: 1;        /* agrandissement de la jauge */
        --v: 44px;     /* taille du chiffre */
        --b: 48px;     /* hauteur des barres */
        position: relative;
        width: 300px;
        height: 560px; /* hauteur de référence : le contenu remplit tout le widget */
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 14px 14px;
        gap: 10px;
        user-select: none;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        box-sizing: border-box;
        color: var(--so-ink);
    }

    /* ── En-tête : pastilles « verre » ── */
    .sono-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
    }
    .sono-title,
    .sono-tools {
        display: flex;
        align-items: center;
        background: var(--so-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .sono-title {
        gap: 7px;
        padding: 7px 12px 7px 10px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
    }
    .sono-title svg { width: 18px; height: 18px; flex-shrink: 0; }
    .sono-tools { gap: 2px; padding: 4px 10px 4px 4px; flex-shrink: 0; }
    .sono-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }
    .sono-toggle-controls {
        width: 28px; height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--so-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .sono-toggle-controls svg { width: 17px; height: 17px; }
    .sono-toggle-controls:hover,
    .sono-toggle-controls.is-on { background: rgba(20,32,46,0.12); }

    /* ── Carte de mesure ── */
    .sono-card {
        flex: 1 1 auto;
        min-height: 0;
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 14px 12px 12px;
        border-radius: 20px;
        background: rgba(255,255,255,0.62);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
    }

    /* ── Jauge semi-circulaire ── */
    .sono-gauge-wrap {
        position: relative;
        width: calc(220px * var(--g));
        height: calc(120px * var(--g));
        transition: width .3s ease, height .3s ease;
        overflow: visible;
    }
    .sono-gauge-wrap svg {
        width: 100%;
        height: auto;
        overflow: visible;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        font-weight: 700;
    }

    /* ── Affichage du niveau numérique (0 à 100) ── */
    .sono-db-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 2px;
    }
    .sono-db-value {
        font-size: var(--v);
        font-weight: 700;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        letter-spacing: -1px;
        transition: color 0.3s, font-size .3s ease;
        color: var(--so-ink);
    }
    .sono-db-unit {
        font-size: 12px;
        font-weight: 700;
        color: var(--so-muted);
        margin-top: 3px;
    }

    /* ── Label état ── */
    .sono-label {
        font-size: 14px;
        font-weight: 700;
        padding: 6px 18px;
        border-radius: 999px;
        background: rgba(20,32,46,0.08);
        color: var(--so-muted);
        transition: background 0.4s, color 0.4s;
        text-align: center;
    }

    /* ── Barres verticales (visualiseur) ── */
    .sono-bars {
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: var(--b);
        transition: height .3s ease;
        overflow: hidden;
        width: 100%;
        justify-content: center;
        padding: 0 4px;
        box-sizing: border-box;
    }
    .sono-bar {
        flex: 1;
        max-width: 14px;
        border-radius: 4px 4px 2px 2px;
        transition: height 0.08s ease-out, background 0.3s;
        min-height: 2px;
    }

    /* ── Boutons ── */
    .sono-btns {
        display: flex;
        gap: 8px;
    }
    .sono-btn {
        font-family: inherit;
        padding: 9px 18px;
        border: none;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 3px 0 rgba(10,20,35,0.2);
        transition: transform 0.08s, box-shadow 0.08s, filter 0.15s, background 0.2s;
    }
    .sono-btn:hover { filter: brightness(1.06); }
    .sono-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.2); }
    .sono-btn-start {
        background: var(--so-op);
        color: #fff;
    }
    .sono-btn-start.is-running { background: var(--so-ink); }
    .sono-btn-reset {
        background: rgba(255,255,255,0.85);
        color: var(--so-ink);
    }

    /* ── Seuils personnalisables ── */
    .sono-thresholds {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--so-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 16px;
        padding: 10px 12px;
        box-sizing: border-box;
    }
    .sono-thresh-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        font-weight: 700;
        color: var(--so-muted);
    }
    .sono-thresh-dot {
        width: 11px; height: 11px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .sono-thresh-label { flex: 1; }
    .sono-thresh-input {
        width: 46px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 999px;
        color: var(--so-ink);
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        text-align: center;
        padding: 3px 4px;
        outline: none;
        box-shadow: inset 0 1px 3px rgba(10,20,35,0.15);
    }
    .sono-thresh-input:focus { box-shadow: 0 0 0 2px var(--so-op); }

    /* Couleur du widget */
    .sono-swatches { display: flex; gap: 6px; }
    .sono-swatch {
        width: 20px; height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .sono-swatch.is-on { border-color: var(--so-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Message alerte (en haut à droite de la carte de mesure) ── */
    .sono-alert {
        display: none;
        position: absolute;
        top: 70px;
        right: 26px;
        font-size: 22px;
        animation: sono-pulse 0.6s infinite alternate;
        pointer-events: none;
        z-index: 5;
    }
    @keyframes sono-pulse {
        from { opacity: 0.5; transform: scale(0.9); }
        to   { opacity: 1;   transform: scale(1.1); }
    }

    /* ── Zone contrôles (boutons + seuils) ── */
    .sono-controls {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        max-height: 240px;
        opacity: 1;
    }
    .sono-controls.hidden {
        max-height: 0;
        opacity: 0;
        pointer-events: none;
    }

    /* ── Micro refusé ── */
    .sono-no-mic {
        font-size: 12px;
        font-weight: 700;
        color: #C0392B;
        text-align: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.8);
        display: none;
    }
    `;

    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById('sono-style-v3')) {
        const st = document.createElement('style');
        st.id = 'sono-style-v3';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // Police arrondie partagée avec la calculatrice (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── Couleurs disponibles (mêmes teintes que la calculatrice) ──────────
    const THEMES = {
        bleu:   { name: 'Bleu',   bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',   bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',  bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',   bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet', bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',   bg: '#D4DAE2', op: '#4A5868' }
    };
    const DEFAULT_THEME = 'jaune';
    // Couleurs des niveaux : calme / agité / trop bruyant
    const C_CALM = '#3DBE8B', C_MID = '#F0A53A', C_LOUD = '#EF5B4F';
    const ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
    const ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';

    // ── Initialisation d'une instance de widget ────────────────────────────
    window.initSonometreWidget = function (widget) {
        (function () {

            // Identifiant unique : chaque sonomètre a son propre dégradé
            // (sinon, réduire un sonomètre ferait disparaître la jauge des autres)
            var uid = Math.random().toString(36).slice(2, 8);
            var gradId = 'sonoGaugeGrad-' + uid;

            // Injection HTML directe (sans passer par le système de template)
            var bars = '';
            for (var b = 0; b < 16; b++) {
                bars += '<div class="sono-bar" style="height:2px;background:rgba(20,32,46,0.15)"></div>';
            }
            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML = ''
                + '<div class="sono-outer"><div class="sono-resize-handle" data-dir="se" title="Redimensionner"></div><div class="sono-resize-handle rh-e" data-dir="e" title="Largeur"></div><div class="sono-resize-handle rh-s" data-dir="s" title="Hauteur"></div><div class="sono-scale-wrap"><div class="sono-widget">'
                + '<div class="sono-header">'
                +   '<div class="sono-title">' + ICON_MIC + '<span>Sonom\u00E8tre</span></div>'
                +   '<div class="sono-tools">'
                +     '<button class="sono-toggle-controls" title="Afficher/masquer les contrôles">' + ICON_SLIDERS + '</button>'
                +     '<span class="sono-sep"></span>'
                +     '<div class="wf-btns">'
                +       '<button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>'
                +       '<button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>'
                +       '<button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>'
                +     '</div>'
                +   '</div>'
                + '</div>'
                + '<div class="sono-card">'
                + '<div class="sono-gauge-wrap"><svg viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">'
                + '<defs><linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="0%">'
                + '<stop offset="0%" stop-color="' + C_CALM + '"/><stop offset="50%" stop-color="' + C_MID + '"/><stop offset="100%" stop-color="' + C_LOUD + '"/>'
                + '</linearGradient></defs>'
                + '<path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(20,32,46,0.10)" stroke-width="16" stroke-linecap="round"/>'
                + '<path class="sono-arc-val" d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="url(#' + gradId + ')" stroke-width="16" stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="283" style="transition:stroke-dashoffset 0.15s ease-out;"/>'
                + '<line class="sono-needle" x1="110" y1="110" x2="110" y2="30" stroke="#14202E" stroke-width="3" stroke-linecap="round" style="transform-origin:110px 110px;transform:rotate(-90deg);transition:transform 0.15s ease-out;"/>'
                + '<circle cx="110" cy="110" r="7" fill="#14202E"/>'
                + '<text x="16" y="128" fill="rgba(20,32,46,0.5)" font-size="10" text-anchor="middle">0</text>'
                + '<text x="55" y="60" fill="rgba(20,32,46,0.5)" font-size="10" text-anchor="middle">25</text>'
                + '<text x="110" y="28" fill="rgba(20,32,46,0.5)" font-size="10" text-anchor="middle">50</text>'
                + '<text x="165" y="60" fill="rgba(20,32,46,0.5)" font-size="10" text-anchor="middle">75</text>'
                + '<text x="204" y="128" fill="rgba(20,32,46,0.5)" font-size="10" text-anchor="middle">100</text>'
                + '</svg></div>'
                + '<div class="sono-db-display"><div class="sono-db-value">--</div><div class="sono-db-unit">niveau sonore / 100</div></div>'
                + '<div class="sono-label">Microphone inactif</div>'
                + '<div class="sono-alert" style="display:none;">&#x1F507;</div>'
                + '<div class="sono-bars">' + bars + '</div>'
                + '</div>'
                + '<div class="sono-controls">'
                + '<div class="sono-btns">'
                + '<button class="sono-btn sono-btn-start">&#9654; Démarrer</button>'
                + '<button class="sono-btn sono-btn-reset">Réinitialiser</button>'
                + '</div>'
                + '<div class="sono-thresholds">'
                + '<div class="sono-thresh-row"><div class="sono-thresh-dot" style="background:' + C_CALM + '"></div><span class="sono-thresh-label">Calme (en-dessous de)</span><input class="sono-thresh-input" type="number" min="0" max="100" value="20"> / 100</div>'
                + '<div class="sono-thresh-row"><div class="sono-thresh-dot" style="background:' + C_MID + '"></div><span class="sono-thresh-label">Agité (en-dessous de)</span><input class="sono-thresh-input" type="number" min="0" max="100" value="40"> / 100</div>'
                + '<div class="sono-thresh-row"><div class="sono-thresh-dot" style="background:' + C_LOUD + '"></div><span class="sono-thresh-label">Trop bruyant (au-dessus)</span></div>'
                + '<div class="sono-thresh-row"><span class="sono-thresh-label">Couleur</span><div class="sono-swatches">'
                + Object.keys(THEMES).map(function (id) {
                    return '<button class="sono-swatch" data-theme="' + id + '" title="' + THEMES[id].name + '" style="background:' + THEMES[id].bg + '"></button>';
                  }).join('')
                + '</div></div>'
                + '</div>'
                + '</div>'
                + '<div class="sono-no-mic" style="display:none;">&#x26A0;&#xFE0F; Acc\u00E8s au microphone refus\u00E9</div>'
                + '</div></div></div>';

            // ── Éléments DOM ──
            const outer     = widget.querySelector('.sono-outer');
            const scaleWrap = widget.querySelector('.sono-scale-wrap');
            const sonoInner = widget.querySelector('.sono-widget');
            const arcVal    = widget.querySelector('.sono-arc-val');
            const needle    = widget.querySelector('.sono-needle');
            const dbValue   = widget.querySelector('.sono-db-value');
            const labelEl   = widget.querySelector('.sono-label');
            const alertEl   = widget.querySelector('.sono-alert');
            const barsEl    = widget.querySelectorAll('.sono-bar');
            const btnStart  = widget.querySelector('.sono-btn-start');
            const btnReset  = widget.querySelector('.sono-btn-reset');
            const noMicEl   = widget.querySelector('.sono-no-mic');
            const threshInputs = widget.querySelectorAll('.sono-thresh-input');
            const wfMin     = widget.querySelector('[data-role="wf-min"]');
            const wfMax     = widget.querySelector('[data-role="wf-max"]');
            const wfClose   = widget.querySelector('[data-role="wf-close"]');

            // ── État ──
            let running      = false;
            let isMax        = false;
            let audioCtx     = null;
            let analyser     = null;
            let micStream    = null;
            let rafId        = null;
            let maxLevel     = 0;
            let smoothLevel  = 0;   // niveau lissé pour l'affichage (0..100)
            let barHistory   = Array(16).fill(0);
            let curStateIdx  = -1;

            // Seuils par défaut (lus depuis les inputs)
            function getThresholds() {
                const vals = Array.from(threshInputs).map(i => parseFloat(i.value) || 0);
                return { calm: vals[0] || 20, agitated: vals[1] || 40 };
            }

            // ── Mise à l'échelle ──────────────────────────────────────────
            const REF_W = 300, REF_H = 560;

            // ── Remplissage : l'espace en plus (widget plus haut, réglages
            // masqués) est réparti entre la jauge (limitée par la largeur),
            // le chiffre et les barres.
            var BASE_G = 1, BASE_V = 44, BASE_B = 48;
            var barMaxH = BASE_B - 2;
            function setFill(g, v, b) {
                sonoInner.style.setProperty('--g', g);
                sonoInner.style.setProperty('--v', v + 'px');
                sonoInner.style.setProperty('--b', b + 'px');
                barMaxH = b - 2;
            }
            // Hauteur naturelle du contenu à la taille de base (réglages compris s'ils sont affichés)
            function naturalHeight() {
                setFill(BASE_G, BASE_V, BASE_B);
                var ctrl = widget.querySelector('.sono-controls');
                var prevH = sonoInner.style.height, prevD = ctrl.style.display;
                sonoInner.style.height = 'auto';
                ctrl.style.display = 'none';
                var h = sonoInner.offsetHeight;
                sonoInner.style.height = prevH;
                ctrl.style.display = prevD;
                if (!ctrl.classList.contains('hidden')) h += ctrl.scrollHeight + 10;
                return h;
            }

            // Le contenu remplit toute la place : il est agrandi selon la plus
            // petite dimension et centré ; la hauteur en plus agrandit la mesure.
            function rescale() {
                var W, H;
                if (isMax) {
                    W = outer.clientWidth  || window.innerWidth;
                    H = outer.clientHeight || window.innerHeight;
                } else {
                    W = outer.offsetWidth;
                    H = outer.offsetHeight;
                }
                if (!W || !H) return;   // widget réduit (caché)
                var m = isMax ? 0.96 : 1;
                var N = naturalHeight();
                var s = Math.min(W * m / REF_W, H * m / N);
                var availH = H * m / s;
                var free = availH - N;
                if (free > 0) {
                    var g = Math.min(1.12, 1 + free / 120);           // jauge
                    var rest = free - 120 * (g - 1);
                    var dv = Math.min(36, rest * 0.25);                // chiffre
                    var db = Math.min(170, rest - dv);                 // barres (le reste centre la carte)
                    setFill(g, BASE_V + dv, BASE_B + db);
                }
                sonoInner.style.height    = availH + 'px';
                scaleWrap.style.width     = REF_W + 'px';
                scaleWrap.style.height    = availH + 'px';
                scaleWrap.style.left      = Math.round((W - REF_W * s) / 2) + 'px';
                scaleWrap.style.top       = Math.round((H - availH * s) / 2) + 'px';
                scaleWrap.style.transform = 'scale(' + s + ')';
            }

            // ── Redimensionnement libre : coin (les deux), bord droit (largeur), bord bas (hauteur) ──
            var MIN_W = 220, MIN_H = 200;
            outer.querySelectorAll('.sono-resize-handle').forEach(function (handle) {
                var dir = handle.dataset.dir || 'se';
                function start(x0, y0, isTouch) {
                    var startW = outer.offsetWidth, startH = outer.offsetHeight;
                    function apply(x, y) {
                        if (dir.indexOf('e') >= 0) outer.style.width  = Math.max(MIN_W, startW + (x - x0)) + 'px';
                        if (dir.indexOf('s') >= 0) outer.style.height = Math.max(MIN_H, startH + (y - y0)) + 'px';
                        rescale();
                    }
                    function onMouse(ev) { apply(ev.clientX, ev.clientY); }
                    function onTouch(ev) { ev.preventDefault(); apply(ev.touches[0].clientX, ev.touches[0].clientY); }
                    function end() {
                        document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', isTouch ? onTouch : onMouse);
                        document.removeEventListener(isTouch ? 'touchend' : 'mouseup', end);
                        if (typeof saveBoard === 'function') saveBoard();
                    }
                    document.addEventListener(isTouch ? 'touchmove' : 'mousemove', isTouch ? onTouch : onMouse, isTouch ? { passive: false } : undefined);
                    document.addEventListener(isTouch ? 'touchend' : 'mouseup', end);
                }
                handle.addEventListener('mousedown', function (e) {
                    if (isMax) return;
                    e.preventDefault(); e.stopPropagation();
                    start(e.clientX, e.clientY, false);
                });
                handle.addEventListener('touchstart', function (e) {
                    if (isMax) return;
                    e.preventDefault(); e.stopPropagation();
                    start(e.touches[0].clientX, e.touches[0].clientY, true);
                }, { passive: false });
            });

            rescale();

            // ── Conversion niveau audio → niveau sonore 0..100 ────────────
            // L'AnalyserNode donne des données de volume [0..255].
            // Ce n'est PAS une mesure en décibels : le micro n'est pas calibré.
            // On affiche donc un niveau relatif de 0 (silence) à 100 (maximum),
            // utile pour comparer les moments de la séance entre eux.
            function rawToLevel(raw) {
                if (raw <= 0) return 0;
                return Math.min(100, Math.round((raw / 255) * 100));
            }

            // ── Mise à jour de la jauge SVG ────────────────────────────────
            // L'arc total (demi-cercle) = 283 unités de stroke-dasharray (π×r avec r≈90).
            const ARC_TOTAL = 283;
            function updateGauge(level) {
                const ratio    = Math.max(0, Math.min(1, level / 100)); // 0..100 → 0..1
                const dashOffset = ARC_TOTAL * (1 - ratio);
                arcVal.style.strokeDashoffset = dashOffset;

                // Aiguille : -90° (niveau 0) → +90° (niveau 100)
                const angleDeg = -90 + ratio * 180;
                needle.style.transform = `rotate(${angleDeg}deg)`;
            }

            // ── Couleur / label selon le niveau ───────────────────────────
            const STATES = [
                { color: '#23915A', bg: 'rgba(61,190,139,0.22)',  text: '😊 Calme',        alert: null },
                { color: '#B9770E', bg: 'rgba(240,165,58,0.25)',  text: '😬 Un peu agité', alert: null },
                { color: '#C0392B', bg: 'rgba(239,91,79,0.22)',   text: '🔴 Trop bruyant!', alert: '🔇' },
            ];

            // ── Libellé de la mini-barre (widget réduit) ──
            function miniLabelText() {
                var txt = '🎙️ Sonomètre';
                if (running && curStateIdx >= 0) txt += ' — ' + STATES[curStateIdx].text;
                return txt;
            }
            function updateMiniLabel() {
                var lbl = widget.querySelector('.wf-mini-bar > span');
                if (lbl) lbl.textContent = miniLabelText();
            }

            function getStateIdx(level) {
                const t = getThresholds();
                if (level < t.calm)     return 0;
                if (level < t.agitated) return 1;
                return 2;
            }

            function applyState(idx) {
                const s = STATES[idx];
                dbValue.style.color    = s.color;
                labelEl.textContent    = s.text;
                labelEl.style.background = s.bg;
                labelEl.style.color    = s.color;
                if (s.alert) {
                    alertEl.textContent = s.alert;
                    alertEl.style.display = 'block';
                } else {
                    alertEl.style.display = 'none';
                }
                if (idx !== curStateIdx) {
                    curStateIdx = idx;
                    updateMiniLabel();
                }
            }

            // ── Mise à jour barres ─────────────────────────────────────────
            function updateBars(dataArray) {
                const step = Math.floor(dataArray.length / 16);
                for (let i = 0; i < 16; i++) {
                    let sum = 0;
                    for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
                    const avg = sum / step;
                    // lissage léger
                    barHistory[i] = barHistory[i] * 0.6 + avg * 0.4;
                    const h = Math.max(2, Math.round((barHistory[i] / 255) * barMaxH));
                    const t = getThresholds();
                    const lvl = rawToLevel(barHistory[i]);
                    const barColor = lvl < t.calm ? C_CALM : lvl < t.agitated ? C_MID : C_LOUD;
                    barsEl[i].style.height     = h + 'px';
                    barsEl[i].style.background = barColor;
                }
            }

            // ── Boucle RAF ─────────────────────────────────────────────────
            function frame() {
                if (!running || !analyser) return;
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);

                // Volume moyen (pondéré sur les fréquences pertinentes voix)
                let sum = 0, count = 0;
                const lo = Math.floor(data.length * 0.05);
                const hi = Math.floor(data.length * 0.6);
                for (let i = lo; i < hi; i++) { sum += data[i]; count++; }
                const raw = count ? sum / count : 0;

                const level = rawToLevel(raw);
                smoothLevel = smoothLevel * 0.7 + level * 0.3;
                const displayLevel = Math.round(smoothLevel);

                if (displayLevel > maxLevel) maxLevel = displayLevel;

                dbValue.textContent = displayLevel;
                updateGauge(displayLevel);
                applyState(getStateIdx(displayLevel));
                updateBars(data);

                rafId = requestAnimationFrame(frame);
            }

            // ── Démarrer le micro ──────────────────────────────────────────
            async function startMic() {
                try {
                    noMicEl.style.display = 'none';
                    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
                    analyser  = audioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    analyser.smoothingTimeConstant = 0.6;
                    const src = audioCtx.createMediaStreamSource(micStream);
                    src.connect(analyser);
                    running = true;
                    btnStart.textContent = '⏹ Arrêter';
                    btnStart.className   = 'sono-btn sono-btn-start';
                    btnStart.classList.add('is-running');
                    rafId = requestAnimationFrame(frame);
                } catch (err) {
                    noMicEl.style.display = 'block';
                    console.warn('[Sonomètre] Microphone refusé :', err);
                }
            }

            // ── Arrêter le micro ───────────────────────────────────────────
            function stopMic() {
                running = false;
                cancelAnimationFrame(rafId);
                rafId = null;
                if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
                if (audioCtx)  { audioCtx.close(); audioCtx = null; }
                analyser = null;
                btnStart.textContent = '▶ Démarrer';
                btnStart.classList.remove('is-running');
                dbValue.textContent  = '--';
                dbValue.style.color  = '';
                labelEl.textContent  = 'Microphone inactif';
                labelEl.style.background = '';
                labelEl.style.color  = '';
                alertEl.style.display = 'none';
                updateGauge(0);
                barsEl.forEach(b => { b.style.height = '2px'; b.style.background = 'rgba(20,32,46,0.15)'; });
                barHistory.fill(0);
                smoothLevel = 0;
                curStateIdx = -1;
                updateMiniLabel();
            }

            // ── Bouton toggle contrôles ───────────────────────────────────
            var toggleBtn  = widget.querySelector('.sono-toggle-controls');
            var controlsEl = widget.querySelector('.sono-controls');
            var controlsVisible = true;
            // Réglages masqués : la mesure s'agrandit pour remplir le widget
            function fitContent() { rescale(); }

            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                controlsVisible = !controlsVisible;
                controlsEl.classList.toggle('hidden', !controlsVisible);
                fitContent();
                toggleBtn.classList.toggle('is-on', !controlsVisible);
            });

            // ── Couleur ───────────────────────────────────────────────────
            var themeId = DEFAULT_THEME;
            function setTheme(id) {
                if (!THEMES[id]) id = DEFAULT_THEME;
                themeId = id;
                outer.style.setProperty('--so-bg', THEMES[id].bg);
                outer.style.setProperty('--so-op', THEMES[id].op);
                widget.dataset.wfTheme = id;
                widget.querySelectorAll('.sono-swatch').forEach(function (sw) {
                    sw.classList.toggle('is-on', sw.dataset.theme === id);
                });
            }
            widget.querySelectorAll('.sono-swatch').forEach(function (sw) {
                sw.addEventListener('click', function (e) {
                    e.stopPropagation();
                    setTheme(sw.dataset.theme);
                    if (typeof saveBoard === 'function') saveBoard();
                });
            });
            setTheme(widget.dataset.wfTheme || DEFAULT_THEME);
            // Pour une sauvegarde éventuelle (save-load.js)
            widget._wfGetTheme = function () { return themeId; };
            widget._wfSetTheme = setTheme;

            // ── Boutons fenêtre : réduire / plein écran / fermer ──────────
            function setMax(on) {
                isMax = !!on;
                outer.classList.toggle('sono-fullboard', isMax);
                wfMax.title = isMax ? 'Quitter le plein écran' : 'Plein écran';
                rescale();
            }

            widget._wfSetMax = setMax;   // utilisé à l'ouverture sur téléphone
            function onWinResize() { if (isMax) rescale(); }
            function onKey(e) { if (isMax && e.key === 'Escape') setMax(false); }
            window.addEventListener('resize', onWinResize);
            document.addEventListener('keydown', onKey);

            wfMin.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isMax) setMax(false);
                // On masque le sonomètre pendant la réduction : la mesure continue,
                // la mini-barre affiche l'état sonore.
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

            // Bloquer stopPropagation sur les éléments interactifs (et partout en plein écran)
            // Le reste du widget reste draggable normalement
            var interactiveSelectors = 'button, input, .sono-resize-handle, .sono-toggle-controls';
            outer.addEventListener('mousedown', function(e) {
                if (isMax || e.target.closest(interactiveSelectors)) {
                    e.stopPropagation();
                }
            });
            outer.addEventListener('touchstart', function(e) {
                if (isMax || e.target.closest(interactiveSelectors)) {
                    e.stopPropagation();
                }
            }, { passive: true });
            // En plein écran, aucun appui ne doit déplacer le widget (resté dessous)
            outer.addEventListener('pointerdown', function (e) {
                if (isMax) e.stopPropagation();
            });

            // Bouton start / stop
            btnStart.addEventListener('click', function () {
                if (!running) startMic();
                else stopMic();
            });

            // Bouton reset
            btnReset.addEventListener('click', function () {
                maxLevel = 0;
                smoothLevel = 0;
                if (!running) {
                    dbValue.textContent = '--';
                    updateGauge(0);
                }
            });

            // ── Nettoyage à la suppression du widget ──────────────────────
            const obs = new MutationObserver(function () {
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
            if (type === 'sonometre' && widget) {
                    initSonometreWidget(widget);
                    // Sur téléphone : ouverture directe en plein écran (bouton vert)
                    if (_wfIsPhoneLaunch() && widget._wfSetMax) { widget._wfSetMax(true); requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); }); }
                }
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'sonometre' && widget) {
                    initSonometreWidget(widget);
                    // Sur téléphone : ouverture directe en plein écran (bouton vert)
                    if (_wfIsPhoneLaunch() && widget._wfSetMax) { widget._wfSetMax(true); requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); }); }
                }
                    return widget;
                };
            }
        });
    }

})();
