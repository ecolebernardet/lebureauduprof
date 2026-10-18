// =========================================================================
// WIDGET DÉ — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'de'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-de.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils > Outils divers) :
//      <div class="mm-sub-item" onclick="createWidget('de');closeMainMenu()">
//          <span class="mm-ico">🎲</span>&nbsp;&nbsp;Lancer un dé
//      </div>
//
// Plusieurs dés : boutons − / + (de 1 à 6 dés lancés en même temps).
// =========================================================================

// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

(function () {

    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w => w !== widget && w.querySelector('.wf-mini-bar'));
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
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
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('pointerup', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
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

    // Police arrondie partagée avec les autres widgets (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── CSS boutons fenêtre (injecté une seule fois) ───────────────────────
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

    // ── CSS spécifique du widget dé ────────────────────────────────────────
    if (!document.getElementById('widget-de-style')) {
        const s = document.createElement('style');
        s.id = 'widget-de-style';
        s.textContent = `
        /* Widget parent transparent : .de-container porte tout le visuel */
        .widget[data-type="de"],
        .widget[data-type="de"]:focus-within {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        .widget[data-type="de"] .widget-content {
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
        }

        /* ── Rectangle principal (même design que la calculatrice) ── */
        .de-container {
            --de-ink:   #14202E;
            --de-glass: rgba(255,255,255,0.62);
            --de-bg:    #C2B2F0;
            --de-op:    #6A4FC2;
            --de-d1:    #9581d6;
            --de-d2:    #6A4FC2;
            --de-d3:    #503b92;

            background-color: var(--de-bg);
            color: var(--de-ink);
            border: none;
            border-radius: 24px;
            padding: 14px 16px 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 380px;
            min-width: 260px;
            min-height: 420px;
            container-type: inline-size;
            transition: background-color .3s;
        }
        .widget[data-type="de"]:hover .de-container {
            outline: 2px dashed rgba(20,32,46,0.35);
            outline-offset: 2px;
        }
        .de-sheen {
            position: absolute; inset: 0; pointer-events: none; z-index: 0;
            background:
                radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
                radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        }
        .de-header, .de-faces-row, .de-count-row, .de-dice-zone, .de-history-row, .de-controls { position: relative; z-index: 1; }

        /* ── Plein écran ── */
        .de-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 0 !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            outline: none !important;
            align-items: center;
            justify-content: center;
            padding: 66px 16px 20px !important;
            box-sizing: border-box !important;
        }
        .de-container.wf-fullboard .de-header {
            position: absolute;
            top: 14px; left: 0; right: 0;
            padding: 0 16px;
            cursor: default;
            pointer-events: none;
            z-index: 30;
        }
        .de-container.wf-fullboard .de-header > * { pointer-events: auto; }
        .de-container.wf-fullboard .de-resize-handle { display: none; }
        .de-container.wf-fullboard .de-faces-row,
        .de-container.wf-fullboard .de-count-row,
        .de-container.wf-fullboard .de-history-row,
        .de-container.wf-fullboard .de-controls {
            width: min(520px, 100%);
            z-index: 31;
        }
        .de-container.wf-fullboard .de-dice-zone { flex: 1; width: 100%; }

        /* ── En-tête : pastilles « verre » ── */
        .de-header {
            display: flex; align-items: center; justify-content: space-between;
            gap: 8px; cursor: move; user-select: none; flex-shrink: 0;
        }
        .de-title,
        .de-tools {
            display: flex; align-items: center; gap: 8px;
            background: var(--de-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            border-radius: 999px;
            box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        }
        .de-title {
            padding: 7px 16px 7px 12px;
            font-size: 15px; font-weight: 700; color: var(--de-ink);
            white-space: nowrap; overflow: hidden; min-width: 0;
            pointer-events: none;
        }
        .de-title span { overflow: hidden; text-overflow: ellipsis; }
        .de-title svg { width: 18px; height: 18px; flex-shrink: 0; }
        .de-tools { padding: 5px 12px 5px 6px; flex-shrink: 0; gap: 2px; cursor: default; }
        @container (max-width: 335px) {
            .de-title span { display: none; }
            .de-title { padding: 7px 10px; }
        }
        .de-icon-btn {
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: none; background: transparent;
            color: var(--de-ink); cursor: pointer; padding: 0;
            transition: background .15s;
        }
        .de-icon-btn svg { width: 18px; height: 18px; }
        .de-icon-btn:hover,
        .de-icon-btn.is-on { background: rgba(20,32,46,0.12); }
        .de-icon-btn:focus-visible { outline: 2px solid var(--de-ink); outline-offset: 2px; }
        .de-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

        /* ── Panneaux réglages / aide ── */
        .de-panel {
            position: absolute;
            top: 62px; right: 16px;
            width: 280px;
            max-width: calc(100% - 32px);
            max-height: calc(100% - 80px);
            overflow-y: auto;
            box-sizing: border-box;
            z-index: 40;
            display: none;
            flex-direction: column;
            gap: 11px;
            padding: 14px 16px;
            border-radius: 16px;
            background: rgba(255,255,255,0.95);
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            user-select: text;
            color: var(--de-ink);
        }
        .de-panel.show { display: flex; }
        .de-panel-title { font-size: 13px; font-weight: 700; }
        .de-panel-row { font-size: 12px; font-weight: 600; color: rgba(20,32,46,0.75); }
        .de-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
        .de-help-list li { margin-bottom: 4px; }
        .de-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
        .de-swatch {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid rgba(20,32,46,0.15); cursor: pointer; padding: 0;
        }
        .de-swatch.is-on { border-color: var(--de-ink); box-shadow: 0 0 0 2px #fff inset; }

        /* ── Réglages : faces et nombre de dés ── */
        .de-faces-row,
        .de-count-row {
            display: flex; align-items: center; gap: 8px; flex-shrink: 0;
            background: var(--de-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            border-radius: 16px;
            padding: 7px 12px;
        }
        .de-faces-label {
            font-size: 13px; font-weight: 700; color: var(--de-ink); white-space: nowrap;
        }
        .de-faces-slider { flex: 1; accent-color: var(--de-op); cursor: pointer; min-width: 0; }
        .de-faces-value,
        .de-count-value {
            font-size: 15px; font-weight: 700; color: var(--de-ink);
            min-width: 26px; text-align: center;
            background: rgba(255,255,255,0.9); border-radius: 10px; padding: 2px 8px;
            font-variant-numeric: tabular-nums;
        }
        .de-count-btn {
            width: 30px; height: 30px; border-radius: 10px; border: none;
            background: var(--de-op); color: #fff;
            font-family: inherit; font-size: 18px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            padding: 0; line-height: 1; flex-shrink: 0;
            box-shadow: 0 3px 0 rgba(10,20,35,0.18);
            transition: transform .08s, filter .15s, box-shadow .08s, opacity .15s;
        }
        .de-count-btn:hover  { filter: brightness(1.08); }
        .de-count-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.18); }
        .de-count-btn.off    { opacity: .35; pointer-events: none; }
        .de-count-hint {
            margin-left: auto; font-size: 11px; font-weight: 600;
            color: rgba(20,32,46,0.6); white-space: nowrap;
        }

        /* ── Zone des dés ── */
        .de-dice-zone {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 8px; min-height: 0;
            width: 100%;
        }
        /* Rangée de dés (un ou plusieurs) */
        .de-stage-row {
            --de-size: 110px;
            display: flex; justify-content: center; align-items: flex-end;
            width: 100%;
        }
        /* ── Scène 3D : le dé est un vrai cube CSS (6 faces) ── */
        .de-stage {
            position: relative;
            flex: 1 1 0; min-width: 0;
            height: calc(var(--de-size) * 1.75);
            perspective: calc(var(--de-size) * 6);
            perspective-origin: 50% 25%;
            cursor: pointer;
            touch-action: manipulation;
        }
        .de-floor {
            position: absolute; left: 50%; bottom: calc(var(--de-size) * 0.12);
            width: calc(var(--de-size) * 1.35); height: calc(var(--de-size) * 0.32);
            margin-left: calc(var(--de-size) * -0.675);
            border-radius: 50%;
            background: radial-gradient(ellipse at center,
                rgba(10,20,35,0.40) 0%, rgba(10,20,35,0.16) 45%, rgba(10,20,35,0) 72%);
            pointer-events: none;
            will-change: transform, opacity;
        }
        .de-toss {
            position: absolute; left: 50%; bottom: calc(var(--de-size) * 0.28);
            width: var(--de-size); height: var(--de-size);
            margin-left: calc(var(--de-size) * -0.5);
            transform-style: preserve-3d;
            transform-origin: 50% 100%;
            will-change: transform;
        }
        .de-poly {
            position: absolute; left: -35%; top: -35%;
            width: 170%; height: 170%;
            display: none; pointer-events: none;
        }
        .de-stage.is-poly .de-cube { display: none; }
        .de-stage.is-poly .de-poly { display: block; }
        .de-cube {
            position: absolute; inset: 0;
            transform-style: preserve-3d;
            transform: rotateX(-22deg) rotateY(-28deg) rotateZ(0deg);
            will-change: transform;
        }
        .de-face {
            position: absolute; inset: 0;
            box-sizing: border-box;
            border-radius: 0;
            background:
                radial-gradient(circle at 30% 22%, rgba(255,255,255,0.30), rgba(255,255,255,0) 50%),
                radial-gradient(ellipse at 50% 50%, rgba(30,27,75,0) 60%, rgba(30,27,75,0.14) 100%),
                linear-gradient(145deg, var(--c1, var(--de-d1)) 0%, var(--c2, var(--de-d2)) 55%, var(--c3, var(--de-d3)) 100%);
            /* Arête fine et douce : un simple filet clair d'un pixel */
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22);
            outline: 1px solid transparent;      /* anticrénelage des bords en 3D (Chrome) */
            -webkit-font-smoothing: antialiased;
            display: flex; align-items: center; justify-content: center;
            color: #fff;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            font-weight: 700;
            font-size: calc(var(--de-size) * 0.50);
            line-height: 1;
            text-shadow: 0 calc(var(--de-size) * 0.02) calc(var(--de-size) * 0.04) rgba(20,32,46,0.45);
            backface-visibility: hidden;
        }
        /* Coque intérieure fermée (cache les micro-jointures entre faces) */
        .de-core {
            position: absolute; inset: 1%;
            background: var(--de-d3);
        }
        .de-c-front  { transform: translateZ(calc(var(--de-size) * 0.49)); }
        .de-c-back   { transform: rotateY(180deg) translateZ(calc(var(--de-size) * 0.49)); }
        .de-c-right  { transform: rotateY(90deg)  translateZ(calc(var(--de-size) * 0.49)); }
        .de-c-left   { transform: rotateY(-90deg) translateZ(calc(var(--de-size) * 0.49)); }
        .de-c-top    { transform: rotateX(90deg)  translateZ(calc(var(--de-size) * 0.49)); }
        .de-c-bottom { transform: rotateX(-90deg) translateZ(calc(var(--de-size) * 0.49)); }
        .de-face.two-digits { font-size: calc(var(--de-size) * 0.42); letter-spacing: -0.03em; }
        .de-face.is-unknown { font-size: calc(var(--de-size) * 0.44); opacity: 1; }
        /* Éclairage fixe par face (lumière venant d'en haut à gauche) */
        .de-face::after {
            content: ''; position: absolute; inset: 0; border-radius: inherit;
            pointer-events: none; background: #14202E;
        }
        .de-f-front::after  { opacity: 0;    }
        .de-f-top::after    { background: #fff; opacity: 0.18; }
        .de-f-right::after  { opacity: 0.28; }
        .de-f-left::after   { opacity: 0.12; }
        .de-f-back::after   { opacity: 0.35; }
        .de-f-bottom::after { opacity: 0.45; }
        .de-f-front  { transform: translateZ(calc(var(--de-size) * 0.5)); }
        .de-f-back   { transform: rotateY(180deg) translateZ(calc(var(--de-size) * 0.5)); }
        .de-f-right  { transform: rotateY(90deg)  translateZ(calc(var(--de-size) * 0.5)); }
        .de-f-left   { transform: rotateY(-90deg) translateZ(calc(var(--de-size) * 0.5)); }
        .de-f-top    { transform: rotateX(90deg)  translateZ(calc(var(--de-size) * 0.5)); }
        .de-f-bottom { transform: rotateX(-90deg) translateZ(calc(var(--de-size) * 0.5)); }
        /* Points (pips) pour le d6 */
        .de-pips {
            position: absolute; inset: 14%;
            display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
        }
        .de-pip {
            width: 62%; height: 62%; margin: auto; border-radius: 50%;
            background: radial-gradient(circle at 40% 35%, #ffffff 0%, #f3f4f8 55%, #d6dbe6 100%);
            box-shadow: inset 0 calc(var(--de-size) * 0.012) calc(var(--de-size) * 0.02) rgba(20,32,46,0.35);
        }
        .de-pip.off { visibility: hidden; }
        /* Face du résultat : prend une couleur propre au numéro tiré */
        .de-face.lit .de-pip {
            background: radial-gradient(circle at 40% 35%, #ffffff 0%, #fffaf0 60%, #f1f1f1 100%);
        }
        /* Résultat : petite pulsation lumineuse de la face avant */
        .de-poly.win,
        .de-f-front.win {
            animation: de-win 0.7s ease-out;
        }
        @keyframes de-win {
            0%   { filter: brightness(1.6) saturate(1.2); }
            100% { filter: brightness(1)   saturate(1); }
        }


        /* Le widget qui contient le dé en plein écran : aucune transformation
           (sinon position:fixed se cale sur le widget et non sur l'écran),
           et passe sous les onglets latéraux (50005) et les panneaux (50000). */
        .widget.de-max-host {
            transform: none !important;
            z-index: 49990 !important;
        }

        /* ── Téléphone : plein écran du bouton vert, décalé de 40 px à gauche
           pour laisser les onglets latéraux visibles, hauteur réelle de l'écran ── */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .de-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                border: none !important;
                border-radius: 0 !important;
                padding-top: calc(66px + env(safe-area-inset-top)) !important;
                padding-bottom: calc(20px + env(safe-area-inset-bottom)) !important;
            }
            /* Le bouton dessin passerait par-dessus le dé sans être utilisable */
            body.de-has-max #draw-fab-btn { display: none !important; }
        }

        /* ── Historique ── */
        .de-history-row {
            display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
            background: var(--de-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            border-radius: 16px;
            padding: 8px 12px 10px;
        }
        .de-history-label { font-size: 13px; font-weight: 700; color: var(--de-ink); }
        .de-history {
            display: flex; flex-wrap: wrap; gap: 5px;
            max-height: 62px; overflow-y: auto;
        }
        .de-history:empty::after {
            content: 'Aucun lancer pour l\\2019instant';
            font-size: 12px; font-weight: 600; color: rgba(20,32,46,0.55);
        }
        .de-history-item {
            padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
            background: rgba(255,255,255,0.8); color: rgba(20,32,46,0.75);
            font-variant-numeric: tabular-nums;
        }
        .de-history-item.lit { color: #fff !important; }

        /* ── Boutons ── */
        .de-controls { display: flex; gap: 10px; align-items: stretch; flex-shrink: 0; }
        .de-btn {
            border: none; border-radius: 16px;
            font-family: inherit; font-weight: 700; cursor: pointer;
            box-shadow: 0 3px 0 rgba(10,20,35,0.18);
            transition: transform .08s, filter .15s, box-shadow .08s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }
        .de-btn:hover  { filter: brightness(1.06); }
        .de-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.18); filter: brightness(0.94); }
        .de-btn svg { width: 20px; height: 20px; flex-shrink: 0; }
        .de-btn-roll {
            flex: 1; padding: 11px 16px; font-size: 17px;
            background: var(--de-ink); color: #fff;
        }
        .de-btn-roll.busy { opacity: .65; pointer-events: none; }
        .de-btn-clear {
            padding: 0 14px; background: rgba(255,255,255,0.82); color: #C0392B;
        }
        .de-container.wf-fullboard .de-btn-roll { font-size: 20px; padding: 14px 18px; }

        /* ── Poignée de redimensionnement ── */
        .de-resize-handle {
            position: absolute; bottom: 6px; right: 6px;
            width: 18px; height: 18px;
            cursor: nwse-resize; z-index: 7;
            opacity: 0; transition: opacity .2s;
            background: radial-gradient(circle, rgba(20,32,46,0.55) 1.3px, transparent 1.7px) 0 0 / 6px 6px;
            -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                    mask: linear-gradient(135deg, transparent 50%, #000 50%);
        }
        .widget[data-type="de"]:hover .de-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-de';

    // Icônes (même trait que la calculatrice)
    const ICON_DIE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" stroke-width="3"/></svg>';
    const ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
    const ICON_HELP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></svg>';

    // Couleurs (mêmes teintes que la calculatrice)
    const DE_THEMES = {
        violet: { name: 'Violet', bg: '#C2B2F0', op: '#6A4FC2' },
        bleu:   { name: 'Bleu',   bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',   bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',  bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',   bg: '#F4A9C0', op: '#C2456E' },
        gris:   { name: 'Gris',   bg: '#D4DAE2', op: '#4A5868' }
    };
    const SWATCHES_HTML = Object.keys(DE_THEMES).map(id =>
        `<button class="de-swatch" data-theme="${id}" title="${DE_THEMES[id].name}" style="background:${DE_THEMES[id].bg}"></button>`
    ).join('');

    const COUNT_ROW_HTML = `
    <span class="de-faces-label">Dés</span>
    <button class="de-count-btn de-count-minus" title="Retirer un dé">−</button>
    <span class="de-count-value">1</span>
    <button class="de-count-btn de-count-plus" title="Ajouter un dé">+</button>
    <span class="de-count-hint">lancés ensemble</span>`;

    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="de-container">
  <div class="de-sheen"></div>

  <!-- En-tête -->
  <div class="de-header">
    <div class="de-title">${ICON_DIE}<span>Lancer un dé</span></div>
    <div class="de-tools">
      <button class="de-icon-btn de-settings-btn" title="Réglages">${ICON_SLIDERS}</button>
      <button class="de-icon-btn de-help-btn" title="Aide">${ICON_HELP}</button>
      <span class="de-sep"></span>
      <div class="wf-btns">
        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
      </div>
    </div>
  </div>

  <!-- Sélecteur de faces -->
  <div class="de-faces-row">
    <span class="de-faces-label">Faces</span>
    <input type="range" class="de-faces-slider" min="2" max="30" value="6" step="1" />
    <span class="de-faces-value">6</span>
  </div>

  <!-- Nombre de dés -->
  <div class="de-count-row">${COUNT_ROW_HTML}
  </div>

  <!-- Zone principale : les dés sont créés par le script -->
  <div class="de-dice-zone">
    <div class="de-stage-row"></div>
  </div>

  <!-- Historique -->
  <div class="de-history-row">
    <div class="de-history-label">Historique</div>
    <div class="de-history"></div>
  </div>

  <!-- Contrôles -->
  <div class="de-controls">
    <button class="de-btn de-btn-roll">${ICON_DIE}Lancer</button>
    <button class="de-btn de-btn-clear" title="Effacer l'historique">${ICON_TRASH}</button>
  </div>

  <!-- Panneau réglages -->
  <div class="de-panel de-settings-panel">
    <div class="de-panel-title">Réglages</div>
    <div class="de-panel-row">Couleur</div>
    <div class="de-swatches">${SWATCHES_HTML}</div>
  </div>

  <!-- Panneau aide -->
  <div class="de-panel de-help-popup">
    <div class="de-panel-title">Aide</div>
    <ul class="de-help-list">
      <li><b>Faces</b> : le curseur choisit entre 2 et 30 faces. La forme du dé s'adapte : pièce (2), tétraèdre (4), cube à points (6), octaèdre (8), toupie (10 et autres nombres pairs), dodécaèdre (12), icosaèdre (20), dé long pour les nombres impairs.</li>
      <li><b>Dés</b> : les boutons <b>−</b> et <b>+</b> lancent de 1 à 6 dés en même temps ; la somme apparaît dans l'historique (ex. 3+5=8).</li>
      <li><b>Lancer</b> : bouton <b>Lancer</b> ou clic directement sur un dé.</li>
      <li><b>Historique</b> : les 20 derniers lancers ; le plus récent est en couleur. La corbeille l'efface.</li>
      <li><b>Réglages</b> : choix de la couleur du widget et des dés.</li>
      <li>Poignée en bas à droite pour redimensionner. Pastilles : réduire, plein écran, fermer.</li>
    </ul>
  </div>

  <!-- Poignée resize -->
  <div class="de-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // Contenu d'un dé (cube CSS + canvas pour les autres formes)
    const DIE_HTML = `
      <div class="de-floor"></div>
      <div class="de-toss">
        <div class="de-cube">
          <div class="de-core de-c-front"></div>
          <div class="de-core de-c-back"></div>
          <div class="de-core de-c-right"></div>
          <div class="de-core de-c-left"></div>
          <div class="de-core de-c-top"></div>
          <div class="de-core de-c-bottom"></div>
          <div class="de-face de-f-front"></div>
          <div class="de-face de-f-back"></div>
          <div class="de-face de-f-right"></div>
          <div class="de-face de-f-left"></div>
          <div class="de-face de-f-top"></div>
          <div class="de-face de-f-bottom"></div>
        </div>
        <canvas class="de-poly"></canvas>
      </div>`;

    // =========================================================================
    // MOTEUR 3D (canvas) — dés autres que le d6
    //   2 → pièce · 4 → tétraèdre · 8 → octaèdre · 12 → dodécaèdre
    //   20 → icosaèdre · autres pairs → toupie (trapézoèdre, comme le d10)
    //   impairs → dé long (prisme à bouts pointus qui roule sur ses côtés)
    // =========================================================================
    const DePoly = (function () {
        const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
        const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
        const mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
        const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
        const len = (a) => Math.sqrt(dot(a, a));
        const norm = (a) => { const l = len(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
        // Matrices 3×3 (tableau de 9, ligne par ligne)
        const mm = (A, B) => {
            const C = new Array(9);
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
                C[i*3+j] = A[i*3]*B[j] + A[i*3+1]*B[3+j] + A[i*3+2]*B[6+j];
            return C;
        };
        const mv = (M, p) => [
            M[0]*p[0] + M[1]*p[1] + M[2]*p[2],
            M[3]*p[0] + M[4]*p[1] + M[5]*p[2],
            M[6]*p[0] + M[7]*p[1] + M[8]*p[2]];
        const rx = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1,0,0, 0,c,-s, 0,s,c]; };
        const ry = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c,0,s, 0,1,0, -s,0,c]; };
        const rz = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c,-s,0, s,c,0, 0,0,1]; };
        const raxis = (u, a) => {
            const [x, y, z] = u, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
            return [t*x*x+c, t*x*y-s*z, t*x*z+s*y,
                    t*x*y+s*z, t*y*y+c, t*y*z-s*x,
                    t*x*z-s*y, t*y*z+s*x, t*z*z+c];
        };

        // Ordonne les sommets d'une face autour de son axe
        function orderAround(idx, verts, axis) {
            axis = norm(axis);
            let ref = Math.abs(axis[0]) < 0.9 ? [1,0,0] : [0,1,0];
            const e1 = norm(sub(ref, mul(axis, dot(ref, axis)))), e2 = cross(axis, e1);
            const c = mul(idx.reduce((s, i) => add(s, verts[i]), [0,0,0]), 1 / idx.length);
            return idx.slice().sort((i, j) => {
                const a = sub(verts[i], c), b = sub(verts[j], c);
                return Math.atan2(dot(a, e2), dot(a, e1)) - Math.atan2(dot(b, e2), dot(b, e1));
            });
        }

        // Calcule normales, centres, repères de lecture et place disponible
        function finalize(verts, faces) {
            const m = Math.max(...verts.map(len));
            verts = verts.map(p => mul(p, 1 / m));
            faces.forEach(f => {
                const upV = f.upV != null ? f.upV : f.idx[0];
                const pts = f.idx.map(i => verts[i]);
                const c = mul(pts.reduce((s, p) => add(s, p), [0,0,0]), 1 / pts.length);
                let n = [0,0,0];
                for (let i = 0; i < pts.length; i++) {
                    const a = pts[i], b = pts[(i + 1) % pts.length];
                    n[0] += (a[1]-b[1]) * (a[2]+b[2]);
                    n[1] += (a[2]-b[2]) * (a[0]+b[0]);
                    n[2] += (a[0]-b[0]) * (a[1]+b[1]);
                }
                n = norm(n);
                if (dot(n, c) < 0) { n = mul(n, -1); f.idx.reverse(); }
                let up = f.axisUp ? cross(n, f.axisUp) : (f.upDir || sub(verts[upV], c));
                up = norm(sub(up, mul(n, dot(up, n))));
                let inr = Infinity;
                const P = f.idx.map(i => verts[i]);
                for (let i = 0; i < P.length; i++) {
                    const a = P[i], b = P[(i + 1) % P.length];
                    inr = Math.min(inr, len(cross(sub(b, a), sub(c, a))) / len(sub(b, a)));
                }
                f.c = c; f.n = n; f.up = up; f.right = cross(up, n); f.inr = inr;
            });
            return { verts, faces };
        }

        // Numérotation fixe mais mélangée (comme un vrai dé)
        function label(faces, n) {
            const nums = Array.from({ length: n }, (_, i) => i + 1);
            let seed = n * 7919 + 13;
            const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
            for (let i = nums.length - 1; i > 0; i--) {
                const j = Math.floor(rnd() * (i + 1));
                [nums[i], nums[j]] = [nums[j], nums[i]];
            }
            let k = 0;
            faces.forEach(f => { if (f.numbered) f.label = nums[k++]; });
        }

        function tetra() {
            const v = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
            const f = [[0,1,2],[0,3,1],[0,2,3],[1,3,2]].map(idx => ({ idx, numbered: true }));
            return finalize(v, f);
        }
        function octa() {
            const v = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
            const f = [];
            for (const a of [0,1]) for (const b of [2,3]) for (const c of [4,5])
                f.push({ idx: [a, b, c], numbered: true });
            return finalize(v, f);
        }
        function icosaRaw() {
            const p = (1 + Math.sqrt(5)) / 2, v = [];
            for (const a of [-1,1]) for (const b of [-p,p]) { v.push([0,a,b]); v.push([a,b,0]); v.push([b,0,a]); }
            const f = [];
            const d = (i, j) => len(sub(v[i], v[j]));
            for (let i = 0; i < 12; i++) for (let j = i+1; j < 12; j++) for (let k = j+1; k < 12; k++)
                if (Math.abs(d(i,j)-2) < 1e-6 && Math.abs(d(j,k)-2) < 1e-6 && Math.abs(d(i,k)-2) < 1e-6)
                    f.push([i, j, k]);
            return { v, f };
        }
        function icosa() {
            const { v, f } = icosaRaw();
            return finalize(v, f.map(idx => ({ idx, numbered: true })));
        }
        function dodeca() {
            // Dual de l'icosaèdre : centres des 20 triangles = 20 sommets
            const { v, f } = icosaRaw();
            const verts = f.map(t => mul(add(add(v[t[0]], v[t[1]]), v[t[2]]), 1/3));
            const faces = [];
            for (let i = 0; i < 12; i++) {
                const around = [];
                f.forEach((t, k) => { if (t.includes(i)) around.push(k); });
                faces.push({ idx: orderAround(around, verts, v[i]), numbered: true });
            }
            return finalize(verts, faces);
        }
        function trapezo(k) {
            // Toupie à 2k faces en losange (le d10 pour k = 5)
            // hauteur des pointes fixée (≈ celle d'un vrai d10) ; l'écart entre
            // les deux anneaux en découle pour que chaque losange reste plan
            const cq = Math.cos(Math.PI / k);
            const h = 1.05 * (1 - cq) / (1 + cq), v = [], faces = [];
            for (let i = 0; i < k; i++) {
                const a = 2 * Math.PI * i / k, b = a + Math.PI / k;
                v.push([Math.cos(a), Math.sin(a), h]);      // anneau haut : 0..k-1
                v.push([Math.cos(b), Math.sin(b), -h]);     // anneau bas  : décalé
            }
            const U = (i) => 2 * (i % k), L = (i) => 2 * (i % k) + 1;
            const n0 = cross(sub(v[L(0)], v[U(0)]), sub(v[U(1)], v[U(0)]));
            const apex = dot(n0, v[U(0)]) / n0[2];            // rend chaque losange bien plan
            const T = v.length; v.push([0, 0, Math.abs(apex)]);
            const B = v.length; v.push([0, 0, -Math.abs(apex)]);
            for (let i = 0; i < k; i++) {
                faces.push({ idx: [T, U(i), L(i), U(i+1)], upV: T, numbered: true });
                faces.push({ idx: [B, L(i), U(i+1), L(i+1)], upV: B, numbered: true });
            }
            return finalize(v, faces);
        }
        function longDie(n) {
            // Prisme à n côtés numérotés + deux bouts pointus (non numérotés)
            const r = 0.5 + n * 0.012, hl = 0.95, tip = 1.22, v = [], faces = [];
            for (let i = 0; i < n; i++) {
                const a = 2 * Math.PI * i / n;
                v.push([-hl, r * Math.cos(a), r * Math.sin(a)]);
                v.push([ hl, r * Math.cos(a), r * Math.sin(a)]);
            }
            const A = (i) => 2 * (i % n), Bv = (i) => 2 * (i % n) + 1;
            const tA = v.length; v.push([-tip, 0, 0]);
            const tB = v.length; v.push([ tip, 0, 0]);
            for (let i = 0; i < n; i++) {
                faces.push({ idx: [A(i), A(i+1), Bv(i+1), Bv(i)], axisUp: [1,0,0], numbered: true, wide: true });
                faces.push({ idx: [tA, A(i+1), A(i)] });
                faces.push({ idx: [tB, Bv(i), Bv(i+1)] });
            }
            return finalize(v, faces);
        }
        function coin() {
            // Pièce : deux faces numérotées (1 et 2) + tranche
            const N = 40, t = 0.13, v = [], faces = [];
            for (let i = 0; i < N; i++) {
                const a = 2 * Math.PI * i / N;
                v.push([Math.cos(a), Math.sin(a),  t]);
                v.push([Math.cos(a), Math.sin(a), -t]);
            }
            const top = [], bot = [];
            for (let i = 0; i < N; i++) { top.push(2*i); bot.push(2*i+1); }
            faces.push({ idx: top, upDir: [0,1,0], numbered: true, coin: true });
            faces.push({ idx: bot, upDir: [0,1,0], numbered: true, coin: true });
            for (let i = 0; i < N; i++) {
                const j = (i + 1) % N;
                faces.push({ idx: [2*i, 2*j, 2*j+1, 2*i+1], rim: true });
            }
            return finalize(v, faces);
        }

        const cache = {};
        function geometry(n) {
            if (cache[n]) return cache[n];
            let g;
            if (n === 2) g = coin();
            else if (n === 4) g = tetra();
            else if (n === 8) g = octa();
            else if (n === 12) g = dodeca();
            else if (n === 20) g = icosa();
            else if (n % 2 === 0) g = trapezo(n / 2);
            else g = longDie(n);
            g.long = (n % 2 === 1);
            label(g.faces, n);
            return (cache[n] = g);
        }

        // Orientation où la face « val » regarde le spectateur, lisible à l'endroit,
        // légèrement inclinée pour qu'on voie le relief.
        function restFor(g, val, roll) {
            const f = g.faces.find(x => x.label === val) || g.faces.find(x => x.numbered);
            const align = [...f.right, ...f.up, ...f.n];
            const tilt = g.long ? mm(rx(0.38), ry(-0.30))
                       : g.faces.length === 4 ? mm(rx(0.55), ry(-0.62))
                       : mm(rx(0.36), ry(-0.40));
            return mm(rz(roll || 0), mm(tilt, align));
        }

        const hexRgb = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
        const LIGHT = norm([-0.45, 0.65, 0.62]);
        const HALF  = norm(add(LIGHT, [0, 0, 1]));
        const FOCAL = 7;

        function draw(ctx, W, H, g, R, opts) {
            const radius = opts.radius, n = opts.n;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, W, H);
            const cx = W / 2, cy = H / 2;
            const proj = (p) => { const s = FOCAL / (FOCAL - p[2]); return [cx + p[0] * radius * s, cy - p[1] * radius * s]; };
            const cam = [0, 0, FOCAL];
            const base = hexRgb(opts.base || '#6366f1');
            const rimC = hexRgb(opts.rim || '#4338ca');
            const litC = opts.litColor ? hexRgb(opts.litColor) : null;
            ctx.lineJoin = 'round';

            for (const f of g.faces) {
                const nn = mv(R, f.n), c = mv(R, f.c);
                const toCam = sub(cam, c);
                const facing = dot(nn, norm(toCam));
                if (facing <= 0) continue;
                const pts = f.idx.map(i => proj(mv(R, g.verts[i])));

                // Couleur + éclairage (diffus + reflet)
                let col = f.numbered ? base : rimC;
                if (f.numbered && litC && f.label === opts.lit) col = litC;
                const diff = Math.max(0, dot(nn, LIGHT));
                const spec = Math.pow(Math.max(0, dot(nn, HALF)), 28) * 0.45;
                const k = 0.46 + 0.66 * diff;
                const rgb = col.map(x => Math.round(Math.min(255, x * k + (255 - x * k) * spec)));

                ctx.beginPath();
                pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
                ctx.closePath();
                ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
                ctx.fill();
                if (!f.rim) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.26)';
                    ctx.lineWidth = opts.dpr;
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = ctx.fillStyle;   // tranche de pièce sans jointures
                    ctx.lineWidth = opts.dpr * 0.6;
                    ctx.stroke();
                }

                // Numéro posé à plat sur la face (suit la perspective)
                if (f.label != null) {
                    const alpha = Math.max(0, Math.min(1, (facing - 0.12) * 3));
                    if (alpha <= 0) continue;
                    const s = f.inr;
                    const p0 = proj(c);
                    const pr = proj(add(c, mul(mv(R, f.right), s)));
                    const pu = proj(add(c, mul(mv(R, f.up), s)));
                    ctx.setTransform(
                        (pr[0] - p0[0]) / 100, (pr[1] - p0[1]) / 100,
                        -(pu[0] - p0[0]) / 100, -(pu[1] - p0[1]) / 100,
                        p0[0], p0[1]);
                    let txt = String(f.label);
                    if (n >= 9 && (f.label === 6 || f.label === 9)) txt += '.';
                    let fs = f.coin ? 95 : (txt.length > 1 ? 105 : 125);
                    ctx.font = `700 ${fs}px 'Quicksand', 'Segoe UI', system-ui, sans-serif`;
                    const maxW = f.wide ? 320 : (f.coin ? 150 : 165);
                    const w = ctx.measureText(txt).width;
                    if (w > maxW) { fs *= maxW / w; ctx.font = `700 ${fs}px 'Quicksand', 'Segoe UI', system-ui, sans-serif`; }
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const dy = 0;
                    ctx.fillStyle = `rgba(30,27,75,${0.35 * alpha})`;
                    ctx.fillText(txt, 3, 7 + dy);
                    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                    ctx.fillText(txt, 0, 4 + dy);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
            }
        }

        return { geometry, restFor, draw, mm, rx, raxis, norm };
    })();

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initDeWidget = function (widget) {

        const MAX_DICE = 6;

        const container    = widget.querySelector('.de-container');
        const helpBtn      = widget.querySelector('.de-help-btn');
        const helpPopup    = widget.querySelector('.de-help-popup');
        const settingsBtn   = widget.querySelector('.de-settings-btn');
        const settingsPanel = widget.querySelector('.de-settings-panel');
        const facesSlider  = widget.querySelector('.de-faces-slider');
        const facesValue   = widget.querySelector('.de-faces-value');
        const facesRow     = widget.querySelector('.de-faces-row');
        const diceZone     = widget.querySelector('.de-dice-zone');
        // Plus d'affichage texte du résultat : on retire l'ancien bloc s'il existe
        widget.querySelectorAll('.de-result-hint').forEach(el => el.remove());
        const historyEl    = widget.querySelector('.de-history');
        const rollBtn      = widget.querySelector('.de-btn-roll');
        const clearBtn     = widget.querySelector('.de-btn-clear');
        const resizeHandle = widget.querySelector('.de-resize-handle');

        // Rangée des dés (créée si absente, ex. ancien widget restauré)
        let stageRow = diceZone.querySelector('.de-stage-row');
        diceZone.querySelectorAll('.de-stage').forEach(el => el.remove());
        if (!stageRow) {
            stageRow = document.createElement('div');
            stageRow.className = 'de-stage-row';
            diceZone.insertBefore(stageRow, diceZone.firstChild);
        }

        // Ligne « Dés : − n + » (créée si absente)
        let countRow = widget.querySelector('.de-count-row');
        if (!countRow) {
            countRow = document.createElement('div');
            countRow.className = 'de-count-row';
            countRow.innerHTML = COUNT_ROW_HTML;
            facesRow.insertAdjacentElement('afterend', countRow);
        }
        const minusBtn   = countRow.querySelector('.de-count-minus');
        const plusBtn    = countRow.querySelector('.de-count-plus');
        const countValue = countRow.querySelector('.de-count-value');
        countRow.addEventListener('pointerdown', (e) => e.stopPropagation());

        // ── Restaurer l'état persisté dans les dataset ───────────────────
        let nbFaces = 6;
        let nbDice  = 1;
        let history = [];

        if (widget.dataset.deFaces) {
            nbFaces = parseInt(widget.dataset.deFaces, 10) || 6;
        }
        if (widget.dataset.deCount) {
            nbDice = Math.max(1, Math.min(MAX_DICE, parseInt(widget.dataset.deCount, 10) || 1));
        }
        if (widget.dataset.deHistory) {
            try { history = JSON.parse(widget.dataset.deHistory); } catch(e) { history = []; }
        }

        facesSlider.value = nbFaces;
        facesValue.textContent = nbFaces;

        // ── Helper tap stylet (pointer-safe, < 12px) ─────────────────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (Math.sqrt(dx*dx + dy*dy) < 12) {
                        eu.stopPropagation();
                        handler(eu);
                    }
                }
                el.addEventListener('pointerup',     onUp);
                el.addEventListener('pointercancel', onUp);
            });
        }

        // ── Curseur de faces ──────────────────────────────────────────────
        facesSlider.addEventListener('pointerdown', (e) => e.stopPropagation());
        facesSlider.addEventListener('input', () => {
            nbFaces = parseInt(facesSlider.value, 10);
            facesValue.textContent = nbFaces;
            widget.dataset.deFaces = nbFaces;
            if (typeof saveBoard === 'function') saveBoard();
        });

        // =================================================================
        // DÉS 3D
        // =================================================================
        // Orientation de repos : face avant visible + dessus + côté droit
        const REST_X = -22, REST_Y = -28;
        const restTransform = (z) => `rotateX(${REST_X}deg) rotateY(${REST_Y}deg) rotateZ(${z}deg)`;

        const rndInt  = (n) => Math.floor(Math.random() * n) + 1;
        const rndReal = (a, b) => a + Math.random() * (b - a);
        const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const curSize = () => parseFloat(stageRow.style.getPropertyValue('--de-size')) || 110;

        // Disposition des points (grille 3×3) pour le d6
        const PIPS = { 1:[4], 2:[2,6], 3:[2,4,6], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };

        // Une couleur par numéro (le même numéro garde toujours la même couleur)
        const COLORS = [
            ['#fb7185','#e11d48','#be123c'],  // rouge
            ['#fdba74','#f97316','#c2410c'],  // orange
            ['#fcd34d','#f59e0b','#b45309'],  // ambre
            ['#86efac','#22c55e','#15803d'],  // vert
            ['#5eead4','#14b8a6','#0f766e'],  // turquoise
            ['#7dd3fc','#0ea5e9','#0369a1'],  // bleu ciel
            ['#c4b5fd','#8b5cf6','#6d28d9'],  // violet
            ['#f9a8d4','#ec4899','#be185d'],  // rose
            ['#a3e635','#65a30d','#3f6212'],  // vert pomme
            ['#93c5fd','#3b82f6','#1d4ed8'],  // bleu
        ];
        const colorOf = (val) => COLORS[(Math.max(1, val) - 1) % COLORS.length];

        const isPoly = () => nbFaces !== 6;

        // ── Texte du résultat ─────────────────────────────────────────────
        const IDLE_HINT = 'Clique sur un dé ou sur « Lancer »';
        function setHint(text, idle) {
            /* affichage du résultat retiré */
        }

        // ── Couleur du widget et des dés ──────────────────────────────────
        // shade(hex, k) : k > 0 éclaircit vers le blanc, k < 0 assombrit
        function shade(hex, k) {
            const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
            const out = c.map(x => Math.round(k >= 0 ? x + (255 - x) * k : x * (1 + k)));
            return '#' + out.map(x => x.toString(16).padStart(2, '0')).join('');
        }
        const theme = { id: 'violet', op: '#6A4FC2', rim: '#4b3789' };
        function applyTheme(id) {
            if (!DE_THEMES[id]) id = 'violet';
            const t = DE_THEMES[id];
            theme.id = id; theme.op = t.op; theme.rim = shade(t.op, -0.3);
            container.style.setProperty('--de-bg', t.bg);
            container.style.setProperty('--de-op', t.op);
            container.style.setProperty('--de-d1', shade(t.op, 0.3));
            container.style.setProperty('--de-d2', t.op);
            container.style.setProperty('--de-d3', shade(t.op, -0.25));
            widget.querySelectorAll('.de-swatch').forEach(sw =>
                sw.classList.toggle('is-on', sw.dataset.theme === id));
            widget.dataset.deTheme = id;
            dice.forEach(d => polyDraw(d));
        }

        // ── Création d'un dé ──────────────────────────────────────────────
        const dice = [];
        function createDie() {
            const stage = document.createElement('div');
            stage.className = 'de-stage';
            stage.setAttribute('role', 'button');
            stage.setAttribute('aria-label', 'Lancer les dés');
            stage.innerHTML = DIE_HTML;
            const polyCanvas = stage.querySelector('.de-poly');
            const d = {
                stage,
                floorEl: stage.querySelector('.de-floor'),
                toss:    stage.querySelector('.de-toss'),
                cube:    stage.querySelector('.de-cube'),
                polyCanvas,
                polyCtx: polyCanvas.getContext('2d'),
                polyR: null, polyLit: null, polyRoll: 0,
                faceEls: {
                    front:  stage.querySelector('.de-f-front'),
                    back:   stage.querySelector('.de-f-back'),
                    right:  stage.querySelector('.de-f-right'),
                    left:   stage.querySelector('.de-f-left'),
                    top:    stage.querySelector('.de-f-top'),
                    bottom: stage.querySelector('.de-f-bottom'),
                }
            };
            d.cube.style.transform = restTransform(0);
            makeTap(stage, roll);
            return d;
        }

        // ── Dés non cubiques (canvas) ─────────────────────────────────────
        function polyDraw(d) {
            if (!isPoly() || !d.polyR) return;
            const g = DePoly.geometry(nbFaces);
            const S = curSize();
            const dpr = Math.min(3, window.devicePixelRatio || 1);
            const W = Math.round(S * 1.7 * dpr);
            if (d.polyCanvas.width !== W) { d.polyCanvas.width = W; d.polyCanvas.height = W; }
            DePoly.draw(d.polyCtx, W, W, g, d.polyR, {
                radius: S * 0.62 * dpr, dpr, n: nbFaces,
                base: theme.op, rim: theme.rim,
                lit: d.polyLit, litColor: d.polyLit != null ? colorOf(d.polyLit)[1] : null
            });
        }
        function polyShow(d, val, lit) {
            const g = DePoly.geometry(nbFaces);
            d.polyR = DePoly.restFor(g, val == null ? 1 : val, d.polyRoll);
            d.polyLit = lit ? val : null;
            polyDraw(d);
        }
        function setMode(d) { d.stage.classList.toggle('is-poly', isPoly()); }

        // Met en couleur la face du résultat
        function lightResult(d, val) {
            if (isPoly()) { polyShow(d, val, true); return; }
            const el = d.faceEls.front;
            const [c1, c2, c3] = colorOf(val);
            el.style.setProperty('--c1', c1);
            el.style.setProperty('--c2', c2);
            el.style.setProperty('--c3', c3);
            el.classList.add('lit');
        }

        function paintFace(el, val) {
            el.classList.remove('two-digits', 'is-unknown', 'win', 'lit');
            el.style.removeProperty('--c1'); el.style.removeProperty('--c2'); el.style.removeProperty('--c3');
            el.textContent = '';
            if (val == null) { el.textContent = '?'; el.classList.add('is-unknown'); return; }
            if (nbFaces === 6 && val >= 1 && val <= 6) {
                const grid = document.createElement('div');
                grid.className = 'de-pips';
                for (let i = 0; i < 9; i++) {
                    const pip = document.createElement('span');
                    pip.className = 'de-pip' + (PIPS[val].includes(i) ? '' : ' off');
                    grid.appendChild(pip);
                }
                el.appendChild(grid);
            } else {
                el.textContent = val;
                if (String(val).length > 1) el.classList.add('two-digits');
            }
        }

        // Remplit les 6 faces d'un dé ; `front` = valeur visible à l'arrêt (null → « ? »)
        function paintAll(d, front) {
            setMode(d);
            if (isPoly()) { polyShow(d, front, false); return; }
            const f = front == null ? rndInt(nbFaces) : front;
            let v;
            if (nbFaces === 6) {
                // Vrai dé : les faces opposées font toujours 7
                const pool = [1,2,3,4,5,6].filter(x => x !== f && x !== 7 - f);
                const t = pick(pool);
                const r = pick(pool.filter(x => x !== t && x !== 7 - t));
                v = { front: f, back: 7 - f, top: t, bottom: 7 - t, right: r, left: 7 - r };
            } else {
                const used = new Set([f]), others = [];
                for (let i = 0; i < 5; i++) {
                    let x, tries = 0;
                    do { x = rndInt(nbFaces); } while (used.has(x) && used.size < nbFaces && tries++ < 60);
                    used.add(x); others.push(x);
                }
                v = { front: f, back: others[0], right: others[1], left: others[2], top: others[3], bottom: others[4] };
            }
            Object.keys(d.faceEls).forEach(k => paintFace(d.faceEls[k], v[k]));
            if (front == null) paintFace(d.faceEls.front, null);
        }

        // ── Historique : une entrée = un nombre (1 dé) ou un tableau (plusieurs dés)
        const entryValues = (h) => Array.isArray(h) ? h : [h];
        const entrySum    = (h) => entryValues(h).reduce((a, b) => a + b, 0);
        function entryText(h) {
            const v = entryValues(h);
            return v.length === 1 ? String(v[0]) : `${v.join('+')}=${entrySum(h)}`;
        }
        function describe(h, prefix) {
            const v = entryValues(h);
            if (v.length === 1) return `${prefix} : ${v[0]}  (sur ${nbFaces})`;
            return `${prefix} : ${v.join(' + ')} = ${entrySum(h)}  (${v.length} dés à ${nbFaces} faces)`;
        }

        // Affiche les dés au repos avec le dernier résultat (si compatible)
        function showRest() {
            const last = history.length ? entryValues(history[0]) : [];
            let allOk = last.length === dice.length;
            dice.forEach((d, i) => {
                const val = last[i] != null && last[i] <= nbFaces ? last[i] : null;
                if (val == null) allOk = false;
                paintAll(d, val);
                if (val != null) lightResult(d, val);
            });
            return allOk;
        }

        // Taille des dés selon la place disponible
        // Hauteur disponible pour la rangée de dés
        function freeHeight() {
            const cs  = getComputedStyle(container);
            const gap = parseFloat(cs.rowGap) || 10;
            let others = 0, count = 0;
            ['.de-header', '.de-faces-row', '.de-count-row', '.de-history-row', '.de-controls'].forEach(sel => {
                const el = container.querySelector(sel);
                if (!el || getComputedStyle(el).position === 'absolute' || el.offsetParent === null) return;
                others += el.offsetHeight; count++;
            });
            return container.clientHeight
                - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
                - others - count * gap - 4;
        }

        function updateSize() {
            const n = Math.max(1, dice.length);
            const rowW = stageRow.clientWidth || (container.clientWidth - 32);
            const per = rowW / n;
            let size;
            const full = container.classList.contains('wf-fullboard');
            if (full) {
                size = Math.min(rowW * 0.62, per * 0.66);
            } else {
                size = Math.min(rowW * 0.36, per * 0.66);
            }
            // Hauteur imposée (plein écran ou widget redimensionné) : les dés ne
            // prennent que la place laissée libre, pour que le résultat reste visible.
            if (full || container.style.height) {
                size = Math.min(size, freeHeight() / 1.75);
            }
            size = Math.round(Math.max((n === 1 && !full && !container.style.height) ? 70 : 36, Math.min(size, 700)));
            if (stageRow.style.getPropertyValue('--de-size') !== size + 'px')
                stageRow.style.setProperty('--de-size', size + 'px');
            dice.forEach(polyDraw);
        }

        // ── Nombre de dés ─────────────────────────────────────────────────
        let _rolling = false;

        function setCount(n, fromUser) {
            n = Math.max(1, Math.min(MAX_DICE, n));
            while (dice.length < n) {
                const d = createDie();
                dice.push(d);
                stageRow.appendChild(d.stage);
            }
            while (dice.length > n) {
                const d = dice.pop();
                d.stage.remove();
            }
            nbDice = n;
            widget.dataset.deCount = n;
            countValue.textContent = n;
            minusBtn.classList.toggle('off', n <= 1);
            plusBtn.classList.toggle('off', n >= MAX_DICE);

            if (fromUser) {
                // Élargit un peu le widget pour que les dés gardent une taille lisible
                if (!container.classList.contains('wf-fullboard')) {
                    const need = n === 1 ? 0 : Math.max(380, 40 + n * 120);
                    if (container.offsetWidth < need) {
                        container.style.width = need + 'px';
                        saveDimsToDataset();
                    }
                }
                const allOk = showRest();
                if (!allOk) setHint(IDLE_HINT, true);
                if (typeof saveBoard === 'function') saveBoard();
            }
            updateSize();
        }

        makeTap(plusBtn,  () => { if (!_rolling) setCount(nbDice + 1, true); });
        makeTap(minusBtn, () => { if (!_rolling) setCount(nbDice - 1, true); });

        // ── Lancer les dés ───────────────────────────────────────────────
        function rollDie(d, result, S, D, delay, done) {
            paintAll(d, result);

            const dir    = Math.random() < 0.5 ? -1 : 1;     // arrive par la gauche ou par la droite
            const sgn    = () => (Math.random() < 0.5 ? -1 : 1);
            const newZ   = rndReal(-9, 9);                    // petite inclinaison finale naturelle

            // Nombre de tours sur chaque axe (le dé tourne de moins en moins vite)
            const spinX = (2 + Math.floor(Math.random() * 2)) * 360 * sgn();
            const spinY = (1 + Math.floor(Math.random() * 2)) * 360 * dir;
            const spinZ = 360 * sgn();
            const offX = rndReal(-50, 50), offY = rndReal(-50, 50), offZ = rndReal(-50, 50);

            const rot = (k, tiltX = 0) =>
                `rotateX(${REST_X + tiltX + (spinX + offX) * k}deg) rotateY(${REST_Y + (spinY + offY) * k}deg) rotateZ(${newZ + (spinZ + offZ) * k}deg)`;

            // Rotation : tourne vite en l'air, ralentit à chaque rebond, bascule un peu à l'arrêt
            let cubeAnim = null;
            if (!isPoly()) {
                cubeAnim = d.cube.animate([
                    { transform: rot(1),          offset: 0,    easing: 'cubic-bezier(.25,.6,.45,1)' },
                    { transform: rot(0.16),       offset: 0.48, easing: 'cubic-bezier(.3,.5,.5,1)' },
                    { transform: rot(0.02, 10),   offset: 0.72, easing: 'ease-out' },
                    { transform: rot(0, -4),      offset: 0.86, easing: 'ease-in-out' },
                    { transform: rot(0),          offset: 1 }
                ], { duration: D, delay, fill: 'both' });
            } else {
                // Polyèdre : tourne autour d'un axe au hasard, de moins en moins vite,
                // puis se pose sur la face tirée avec un petit balancement.
                const g = DePoly.geometry(nbFaces);
                d.polyRoll = newZ * Math.PI / 180;
                const Rf = DePoly.restFor(g, result, d.polyRoll);
                const axis = DePoly.norm([rndReal(-1, 1), rndReal(-1, 1), rndReal(-1, 1)]);
                const total = (2.4 + Math.random()) * 2 * Math.PI * sgn();
                d.polyLit = null;
                const t0 = performance.now() + delay;
                const tick = (now) => {
                    const t = Math.max(0, Math.min(1, (now - t0) / D));
                    const x = Math.min(1, t / 0.86), k = Math.pow(1 - x, 3);
                    const w = t > 0.62 ? 0.16 * Math.sin((t - 0.62) / 0.38 * 2 * Math.PI) * (1 - (t - 0.62) / 0.38) : 0;
                    d.polyR = DePoly.mm(DePoly.rx(w), DePoly.mm(Rf, DePoly.raxis(axis, total * k)));
                    polyDraw(d);
                    if (t < 1) requestAnimationFrame(tick);
                    else { d.polyR = Rf; finish(); }
                };
                requestAnimationFrame(tick);
            }

            // Trajectoire : chute en arc + 3 rebonds de plus en plus petits, avec écrasement à l'impact
            const fallIn  = 'cubic-bezier(.55,0,1,.55)';   // accélère en tombant
            const riseOut = 'cubic-bezier(0,.45,.45,1)';   // ralentit en montant
            const P = [
                // offset, x (× taille), y (× taille), scaleX, scaleY, easing du segment suivant
                [0,    -1.15, -1.45, 1,    1,    fallIn ],
                [0.30, -0.50,  0,    1.10, 0.86, 'linear'],
                [0.33, -0.44,  0,    1,    1,    riseOut],
                [0.46, -0.24, -0.50, 1,    1,    fallIn ],
                [0.59, -0.08,  0,    1.06, 0.92, 'linear'],
                [0.61, -0.06,  0,    1,    1,    riseOut],
                [0.69, -0.02, -0.14, 1,    1,    fallIn ],
                [0.77,  0,     0,    1.03, 0.97, 'ease-out'],
                [0.82,  0,     0,    1,    1,    'linear'],
                [1,     0,     0,    1,    1,    'linear'],
            ];
            const tossAnim = d.toss.animate(P.map(([o, x, y, sx, sy, e]) => ({
                offset: o, easing: e,
                transform: `translate(${x * dir * S}px, ${y * S}px) scale(${sx}, ${sy})`,
                opacity: o === 0 ? 0 : 1
            })), { duration: D, delay, fill: 'both' });

            // Ombre au sol : petite et pâle quand le dé est haut, nette quand il touche
            const floorAnim = d.floorEl.animate(P.map(([o, x, y, , , e]) => {
                const h = Math.min(1, -y / 1.45);
                return {
                    offset: o, easing: e,
                    transform: `translateX(${x * dir * S}px) scale(${1 - 0.5 * h})`,
                    opacity: o === 0 ? 0 : 1 - 0.65 * h
                };
            }), { duration: D, delay, fill: 'both' });

            function finish() {
                tossAnim.cancel(); floorAnim.cancel();
                if (cubeAnim) {
                    d.cube.style.transform = restTransform(newZ);
                    cubeAnim.cancel();
                    const front = d.faceEls.front;
                    lightResult(d, result);
                    front.classList.remove('win'); void front.offsetWidth; front.classList.add('win');
                } else {
                    d.polyLit = result;
                    polyDraw(d);
                    d.polyCanvas.classList.remove('win'); void d.polyCanvas.offsetWidth; d.polyCanvas.classList.add('win');
                }
                done();
            }
            if (cubeAnim) cubeAnim.onfinish = finish;
        }

        function roll() {
            if (_rolling) return;
            _rolling = true;
            rollBtn.classList.add('busy');
            setHint('…');

            const results = dice.map(() => rndInt(nbFaces));
            const S       = curSize();
            const reduce  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const D       = reduce ? 450 : 1500;
            let pending   = dice.length;

            dice.forEach((d, i) => {
                // léger décalage entre les dés pour un lancer plus naturel
                const delay = (reduce || i === 0) ? 0 : Math.round(rndReal(0, 160));
                rollDie(d, results[i], S, D, delay, () => {
                    if (--pending > 0) return;
                    const entry = results.length === 1 ? results[0] : results;
                    setHint(describe(entry, 'Résultat'));
                    _rolling = false;
                    rollBtn.classList.remove('busy');
                    history.unshift(entry);
                    if (history.length > 20) history = history.slice(0, 20);
                    widget.dataset.deHistory = JSON.stringify(history);
                    renderHistory();
                    if (typeof saveBoard === 'function') saveBoard();
                });
            });
        }

        // ── Rendu de l'historique ─────────────────────────────────────────
        function renderHistory() {
            historyEl.innerHTML = '';
            history.forEach((entry, i) => {
                const item = document.createElement('span');
                item.className = 'de-history-item';
                item.textContent = entryText(entry);
                if (i === 0) {
                    item.title = 'Dernier lancer';
                    item.classList.add('lit');
                    item.style.background = colorOf(entrySum(entry))[1];
                }
                historyEl.appendChild(item);
            });
        }

        // ── Mise en place initiale ────────────────────────────────────────
        applyTheme(widget.dataset.deTheme || 'violet');
        setCount(nbDice, false);
        if (typeof ResizeObserver === 'function') {
            new ResizeObserver(() => updateSize()).observe(container);
        }
        window.addEventListener('resize', updateSize);

        // Afficher l'historique restauré + dernier résultat
        renderHistory();
        if (history.length && showRest()) {
            setHint(describe(history[0], 'Dernier résultat'));
        } else if (!history.length) {
            dice.forEach(d => paintAll(d, null));
        }

        // Changement du nombre de faces : on repeint les dés au repos
        facesSlider.addEventListener('input', () => {
            if (_rolling) return;
            showRest();
        });

        // ── Boutons principaux ────────────────────────────────────────────
        makeTap(rollBtn, roll);

        makeTap(clearBtn, () => {
            if (_rolling) return;
            history = [];
            widget.dataset.deHistory = '[]';
            renderHistory();
            dice.forEach(d => paintAll(d, null));
            setHint(IDLE_HINT, true);
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Aide ─────────────────────────────────────────────────────────
        // ── Panneaux aide / réglages (un seul ouvert à la fois) ──────────
        function togglePanel(panel, btn) {
            const open = !panel.classList.contains('show');
            [[helpPopup, helpBtn], [settingsPanel, settingsBtn]].forEach(([p, b]) => {
                p.classList.remove('show'); b.classList.remove('is-on');
            });
            if (open) { panel.classList.add('show'); btn.classList.add('is-on'); }
        }
        makeTap(helpBtn,     () => togglePanel(helpPopup, helpBtn));
        makeTap(settingsBtn, () => togglePanel(settingsPanel, settingsBtn));
        [helpPopup, settingsPanel].forEach(p => p.addEventListener('pointerdown', (e) => e.stopPropagation()));
        document.addEventListener('pointerdown', (e) => {
            [[helpPopup, helpBtn], [settingsPanel, settingsBtn]].forEach(([p, b]) => {
                if (!p.contains(e.target) && !b.contains(e.target)) {
                    p.classList.remove('show'); b.classList.remove('is-on');
                }
            });
        }, { passive: true, capture: true });

        // Couleur choisie dans les réglages
        settingsPanel.querySelectorAll('.de-swatch').forEach(sw => {
            makeTap(sw, () => {
                applyTheme(sw.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });

        // ── Boutons fenêtre (réduire / plein écran / fermer) ──────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null, _isMax = false;

        // Plein écran (bouton vert) — utilisé aussi à l'ouverture sur téléphone
        function setMax(on) {
            on = !!on;
            if (on && _isMax) {
                // déjà en plein écran : on s'assure seulement que les classes sont en place
                container.classList.add('wf-fullboard');
                widget.classList.add('de-max-host');
                document.body.classList.add('de-has-max');
                return;
            }
            if (on === _isMax) return;
            _isMax = on;
            if (_isMax) {
                _savedW = container.style.width;
                _savedH = container.style.height;
                container.classList.add('wf-fullboard');
                widget.classList.add('de-max-host');
                document.body.classList.add('de-has-max');
            } else {
                container.classList.remove('wf-fullboard');
                widget.classList.remove('de-max-host');
                if (!document.querySelector('.widget.de-max-host'))
                    document.body.classList.remove('de-has-max');
                if (_savedW) container.style.width  = _savedW;
                if (_savedH) container.style.height = _savedH;
            }
            updateSize();
        }

        // Sur téléphone, le script général d'index.html peut poser son propre
        // plein écran (.phone-fs + bouton ⤡). Pour le dé, on le remplace par
        // le plein écran du bouton vert.
        function refusePhoneFs() {
            if (!widget.classList.contains('phone-fs')) return;
            widget.classList.remove('phone-fs');
            if (!document.querySelector('.widget.phone-fs')) {
                document.body.classList.remove('has-phone-fs');
                document.querySelectorAll('.phone-fs-exit').forEach(b => b.remove());
            }
            setMax(true);
        }
        if (typeof MutationObserver === 'function') {
            new MutationObserver(refusePhoneFs)
                .observe(widget, { attributes: true, attributeFilter: ['class'] });
        }
        refusePhoneFs();
        widget._deSetMax = setMax;

        if (wfMin) {
            makeTap(wfMin, () => {
                setMax(false);
                window._wfMiniBarCollapse(widget, '🎲 Lancer un dé', {});
            });
        }
        if (wfMax) {
            makeTap(wfMax, () => {
                setMax(!_isMax);
                if (typeof saveBoard === 'function') saveBoard();
            });
        }
        // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
        // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
        {
            const _el = container;
            const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
            if (_el) {
                _el.addEventListener('touchstart',  stopInMax, { passive: true });
                _el.addEventListener('pointerdown', stopInMax);
                _el.addEventListener('mousedown',   stopInMax);
            }
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Redimensionnement libre (poignée coin bas-droit) ──────────────
        function saveDimsToDataset() {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
            widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
        }

        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            function onMove(ev) {
                container.style.width  = Math.max(260, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(420, startH + ev.clientY - startY) + 'px';
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup',   onEnd);
                saveDimsToDataset();
                if (typeof saveBoard === 'function') saveBoard();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup',   onEnd);
        });

        // ── Restauration des dimensions sauvegardées ──────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
            // Le widget s'ouvre à 100px du bord gauche du board.
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
            updateSize();
        }));
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'de' && widget) {
                    initDeWidget(widget);
                    // Sur téléphone : ouverture directe en plein écran (bouton vert)
                    if (_wfIsPhoneLaunch() && widget._deSetMax) {
                        widget._deSetMax(true);
                        // une seconde fois après les réglages éventuels de createWidget
                        requestAnimationFrame(() => requestAnimationFrame(() => widget._deSetMax(true)));
                    }
                }
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'de' && widget) {
                    initDeWidget(widget);
                    // Sur téléphone : ouverture directe en plein écran (bouton vert)
                    if (_wfIsPhoneLaunch() && widget._deSetMax) {
                        widget._deSetMax(true);
                        // une seconde fois après les réglages éventuels de createWidget
                        requestAnimationFrame(() => requestAnimationFrame(() => widget._deSetMax(true)));
                    }
                }
                    return widget;
                };
            }
        });
    }

})();
