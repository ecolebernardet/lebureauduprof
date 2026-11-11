// =========================================================================
// OUTIL GONG / CLOCHE DE SIGNAL — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'gong'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="outil-gong.js"></script>
//
//   2. Ajouter dans le panneau Outils, rubrique « Gestion du bruit » :
//      <div class="tools-card" onclick="createWidget('gong');toggleToolsPanel()"> … </div>
//
//   3. Ajouter 'gong' à EXCLUDED_TYPES (script « TÉLÉPHONE » de index.html) :
//      le widget gère lui-même son plein écran (bouton vert) sur téléphone.
//
// Principe : un signal sonore pour obtenir le silence sans élever la voix.
//   • 4 sons synthétisés (pas de fichier, fonctionne hors-ligne) :
//     Gong · Cloche · Carillon · Bol chantant
//   • Un message s'affiche en grand (« Silence, s'il vous plaît »…)
//   • Délai de silence optionnel : compte à rebours, puis « Merci ! »
//   • Mode « visuel seul » : flash + message, sans aucun son
//   • Compteur de signaux de la journée
//
// Boutons fenêtre (comme les autres widgets) :
//   🟡 Réduire      → mini-barre en haut du tableau, avec un bouton 🔔
//                      pour sonner sans déplier le widget
//   🟢 Plein écran  → le gong occupe tout l'écran (Échap pour sortir,
//                      Espace pour sonner)
//   🔴 Fermer       → supprime le widget
//
// Sur téléphone et tablette, le widget s'ouvre directement en plein écran.
// Les réglages (son, volume, coups, délai, message, couleur, taille) sont
// mémorisés et restaurés après l'actualisation du tableau.
// =========================================================================

// Sur téléphone / tablette, un widget ouvert par l'utilisateur démarre en plein
// écran (bouton vert) — pas lors de la restauration d'un tableau enregistré.
// (Même règle que outil-radar.js ; on réutilise sa fonction si elle existe.)
if (typeof window._wfIsPhoneLaunch !== 'function') {
    window._wfIsPhoneLaunch = function () {
        if (window.isInitialLoading || window.isRestoringState) return false;
        if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
        if (typeof window.isPhoneScreen === 'function' && window.isPhoneScreen()) return true;
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
    };
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
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:grab;user-select:none;gap:6px;z-index:1;';

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
    /* Widget parent transparent : gong-outer porte tout le visuel */
    .widget[data-type="gong"],
    .widget[data-type="gong"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="gong"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Rectangle principal : fond pastel + reflet (style calculatrice) ── */
    .widget[data-type="gong"] .gong-outer {
        --gg-ink:    #14202E;
        --gg-muted:  rgba(20,32,46,0.6);
        --gg-line:   rgba(20,32,46,0.12);
        --gg-glass:  rgba(255,255,255,0.62);
        --gg-bg:     #F6D86A;
        --gg-op:     #B9770E;
        --gg-ok:     #23915A;

        position: relative;
        width:  340px;
        height: 540px;
        min-width:  220px;
        min-height: 200px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        background-color: var(--gg-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        transition: background-color .3s;
    }
    .widget[data-type="gong"]:hover .gong-outer,
    .widget[data-type="gong"]:focus-within .gong-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Plein écran ── */
    .widget[data-type="gong"] .gong-outer.gong-fullboard {
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
    .gong-outer.gong-fullboard .gong-flash { border-radius: 0; }
    .gong-outer.gong-fullboard .gong-resize-handle { display: none; }

    /* ── Téléphone / tablette : plein écran à la hauteur réelle de l'écran,
          décalé de 40 px à gauche pour laisser les onglets latéraux visibles ── */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget[data-type="gong"] .gong-outer.gong-fullboard {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
        }
    }

    /* Poignée de redimensionnement (pointillés) */
    .gong-resize-handle {
        position: absolute;
        bottom: 6px; right: 6px;
        width: 18px; height: 18px;
        cursor: nwse-resize;
        z-index: 20;
        opacity: 0;
        transition: opacity 0.2s;
        background: radial-gradient(circle, rgba(20,32,46,0.55) 1.3px, transparent 1.7px) 0 0 / 6px 6px;
        -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                mask: linear-gradient(135deg, transparent 50%, #000 50%);
    }
    /* Poignées des bords : droite (largeur) et bas (hauteur) */
    .gong-resize-handle.rh-e,
    .gong-resize-handle.rh-s {
        background: none;
        -webkit-mask: none;
                mask: none;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .gong-resize-handle.rh-e { top: 40px; bottom: 40px; right: 0; width: 10px; height: auto; cursor: ew-resize; }
    .gong-resize-handle.rh-s { left: 40px; right: 40px; bottom: 0; height: 10px; width: auto; cursor: ns-resize; }
    .gong-resize-handle.rh-e::after,
    .gong-resize-handle.rh-s::after {
        content: '';
        border-radius: 999px;
        background: rgba(20,32,46,0.35);
    }
    .gong-resize-handle.rh-e::after { width: 4px; height: 36px; }
    .gong-resize-handle.rh-s::after { width: 36px; height: 4px; }
    .widget[data-type="gong"]:hover .gong-resize-handle,
    .widget[data-type="gong"]:focus-within .gong-resize-handle { opacity: 1; }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="gong"] .gong-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
        z-index: 3;
    }

    /* ── Widget intérieur (taille de référence 340×540) ── */
    .gong-widget {
        width: 340px;
        height: 540px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 14px;
        box-sizing: border-box;
        color: var(--gg-ink);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
    }

    /* ── En-tête : pastilles « verre » ── */
    .gong-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        flex-shrink: 0;
    }
    .gong-title,
    .gong-header-right {
        display: flex;
        align-items: center;
        background: var(--gg-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .gong-title {
        gap: 7px;
        padding: 7px 13px 7px 10px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
    }
    .gong-title svg { width: 18px; height: 18px; flex-shrink: 0; }
    .gong-header-right { gap: 2px; padding: 4px 10px 4px 4px; flex-shrink: 0; }
    .gong-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    .gong-icon-btn {
        width: 28px; height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--gg-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s, color .15s;
    }
    .gong-icon-btn svg { width: 17px; height: 17px; }
    .gong-icon-btn:hover { background: rgba(20,32,46,0.12); }
    .gong-icon-btn:focus-visible { outline: 2px solid var(--gg-ink); outline-offset: 2px; }
    .gong-toggle-controls.is-off { background: rgba(20,32,46,0.12); }

    /* ── Choix du son : grandes touches ── */
    .gong-sounds {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        flex-shrink: 0;
    }
    .gong-sound-btn {
        font-family: inherit;
        background: rgba(255,255,255,0.82);
        border: none;
        border-radius: 14px;
        color: var(--gg-ink);
        padding: 6px 2px 7px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        box-shadow: 0 3px 0 rgba(10,20,35,0.16);
        transition: background .2s, color .2s, transform .08s, box-shadow .08s;
    }
    .gong-sound-btn svg { width: 20px; height: 20px; }
    .gong-sound-btn:hover { filter: brightness(1.04); }
    .gong-sound-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.16); }
    .gong-sound-btn:focus-visible { outline: 2px solid var(--gg-ink); outline-offset: 2px; }
    .gong-sound-name { font-size: 10.5px; font-weight: 700; white-space: nowrap; opacity: 0.7; }
    .gong-sound-btn.is-active { background: var(--gg-op); color: #fff; }
    .gong-sound-btn.is-active .gong-sound-name { opacity: 0.9; }

    /* ── Zone centrale : ondes + bouton ── */
    .gong-box-wrap {
        position: relative;
        width: var(--box, 210px);
        height: var(--box, 210px);
        transition: width .3s ease, height .3s ease;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .gong-ring {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid var(--gg-line);
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
    }
    .gong-ring.outer-ring {
        background: rgba(255,255,255,0.6);
        border: none;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.12), 0 8px 22px -14px rgba(10,20,35,0.5);
    }

    /* Ondes qui partent du centre quand on sonne */
    .gong-wave {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        border-radius: 50%;
        border: 4px solid var(--gg-op);
        box-sizing: border-box;
        opacity: 0;
        transform: scale(0.4);
        pointer-events: none;
        z-index: 10;
    }
    .gong-box-wrap.is-ringing .gong-wave { animation: gong-wave 1.6s ease-out forwards; }
    .gong-box-wrap.is-ringing .gong-wave.w2 { animation-delay: .25s; }
    .gong-box-wrap.is-ringing .gong-wave.w3 { animation-delay: .5s; }
    @keyframes gong-wave {
        0%   { opacity: .85; transform: scale(0.42); }
        100% { opacity: 0;   transform: scale(1.0); }
    }

    /* Anneau de progression du délai de silence */
    .gong-progress {
        position: absolute;
        inset: 0;
        width: 100%; height: 100%;
        transform: rotate(-90deg);
        z-index: 11;
        pointer-events: none;
        opacity: 0;
        transition: opacity .3s;
    }
    .gong-progress.is-on { opacity: 1; }
    .gong-progress circle {
        fill: none;
        stroke: var(--gg-op);
        stroke-width: 5;
        stroke-linecap: round;
        transition: stroke-dashoffset 1s linear, stroke .3s;
    }
    .gong-box-wrap.is-done .gong-progress circle { stroke: var(--gg-ok); }

    /* ── Bouton central ── */
    .gong-btn-strike {
        position: absolute;
        inset: 0; margin: auto;
        z-index: 50;
        width: 104px; height: 104px;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        font-family: inherit;
        color: #fff;
        background: var(--gg-op);
        box-shadow: 0 5px 0 rgba(10,20,35,0.22);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 0;
        transition: background-color .3s, box-shadow .1s, transform .1s, color .3s;
    }
    .gong-btn-strike:hover { filter: brightness(1.08); }
    .gong-btn-strike:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(10,20,35,0.22); }
    .gong-btn-strike:focus-visible { outline: 2px solid var(--gg-ink); outline-offset: 3px; }
    .gong-btn-strike svg { width: 30px; height: 30px; }
    .gong-btn-text { font-size: 14px; font-weight: 700; }
    .gong-btn-count, .gong-btn-unit, .gong-btn-done { display: none; }
    .gong-btn-count { font-size: 40px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
    .gong-btn-unit  { font-size: 11px; font-weight: 700; opacity: .85; }
    .gong-btn-done  { font-size: 17px; font-weight: 700; }

    .gong-btn-strike.is-counting svg,
    .gong-btn-strike.is-counting .gong-btn-text { display: none; }
    .gong-btn-strike.is-counting .gong-btn-count,
    .gong-btn-strike.is-counting .gong-btn-unit { display: block; }

    .gong-btn-strike.is-done { background: var(--gg-ok); }
    .gong-btn-strike.is-done svg,
    .gong-btn-strike.is-done .gong-btn-text,
    .gong-btn-strike.is-done .gong-btn-count,
    .gong-btn-strike.is-done .gong-btn-unit { display: none; }
    .gong-btn-strike.is-done .gong-btn-done { display: block; }

    .gong-btn-strike.is-hit { animation: gong-hit .35s ease-out; }
    @keyframes gong-hit {
        0% { transform: scale(1); } 30% { transform: scale(0.9); } 65% { transform: scale(1.06); } 100% { transform: scale(1); }
    }

    /* ── Message affiché en grand quand on sonne ── */
    .gong-message {
        position: absolute;
        left: 50%;
        bottom: 2px;
        transform: translate(-50%, 8px) scale(0.9);
        z-index: 60;
        max-width: 310px;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(255,255,255,0.96);
        color: var(--gg-ink);
        font-size: 17px;
        font-weight: 700;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 10px 24px -10px rgba(10,20,35,0.55);
        opacity: 0;
        pointer-events: none;
        transition: opacity .3s, transform .3s;
    }
    .gong-message.is-shown { opacity: 1; transform: translate(-50%, 0) scale(1); }

    /* ── Ligne d'informations : carte « verre » ── */
    .gong-info-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        padding: 6px 8px 6px 14px;
        box-sizing: border-box;
        border-radius: 18px;
        background: var(--gg-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
    }
    .gong-info-main { display: flex; align-items: baseline; gap: 8px; }
    .gong-count {
        font-size: 32px;
        font-weight: 700;
        color: var(--gg-op);
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }
    .gong-count-label { font-size: 13px; font-weight: 700; color: var(--gg-muted); }
    .gong-info-btns { display: flex; align-items: center; gap: 4px; }
    .gong-mute-btn.muted { color: #C0392B; background: rgba(192,57,43,0.12); }
    .gong-reset-btn {
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        color: var(--gg-ink);
        background: rgba(255,255,255,0.85);
        border: none;
        border-radius: 999px;
        padding: 6px 12px;
        cursor: pointer;
        box-shadow: 0 2px 0 rgba(10,20,35,0.15);
        transition: transform .08s, box-shadow .08s, filter .15s;
    }
    .gong-reset-btn:hover { filter: brightness(1.04); }
    .gong-reset-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 rgba(10,20,35,0.15); }
    .gong-reset-btn:focus-visible { outline: 2px solid var(--gg-ink); outline-offset: 2px; }

    /* ── Réglages : carte « verre » ── */
    .gong-controls {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow: hidden;
        box-sizing: border-box;
        padding: 9px 12px;
        border-radius: 18px;
        background: var(--gg-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
        max-height: 200px;
        opacity: 1;
    }
    .gong-controls.hidden { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; pointer-events: none;
        position: absolute; visibility: hidden; }   /* sort du flux : pas de bande vide en bas */
    .gong-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 700;
        color: var(--gg-muted);
        min-height: 22px;
    }
    .gong-row-label { width: 62px; flex-shrink: 0; }
    .gong-slider {
        --fill: 50%;
        flex: 1;
        height: 7px;
        margin: 0;
        cursor: pointer;
        border-radius: 999px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, var(--gg-op) var(--fill), rgba(20,32,46,0.14) var(--fill));
    }
    .gong-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 17px; height: 17px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--gg-op);
        box-shadow: 0 2px 6px rgba(10,20,35,0.3);
        cursor: pointer;
    }
    .gong-slider::-moz-range-thumb {
        width: 11px; height: 11px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--gg-op);
        cursor: pointer;
    }
    .gong-slider:focus-visible { outline: 2px solid var(--gg-ink); outline-offset: 5px; }
    .gong-val {
        width: 34px;
        text-align: right;
        font-weight: 700;
        color: var(--gg-ink);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
    }

    /* Nombre de coups : petites touches 1 / 2 / 3 */
    .gong-seg { flex: 1; display: flex; gap: 6px; }
    .gong-seg-btn {
        flex: 1;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        color: var(--gg-ink);
        background: rgba(255,255,255,0.85);
        border: none;
        border-radius: 999px;
        padding: 3px 0;
        cursor: pointer;
        box-shadow: 0 2px 0 rgba(10,20,35,0.12);
    }
    .gong-seg-btn.is-active { background: var(--gg-op); color: #fff; }
    .gong-seg-btn:focus-visible { outline: 2px solid var(--gg-ink); outline-offset: 2px; }

    /* Message : liste + champ libre */
    .gong-msg-wrap { flex: 1; display: flex; gap: 6px; min-width: 0; }
    .gong-select, .gong-input {
        flex: 1;
        min-width: 0;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        color: var(--gg-ink);
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(20,32,46,0.15);
        border-radius: 999px;
        padding: 3px 8px;
        height: 24px;
        box-sizing: border-box;
        outline: none;
    }
    .gong-select { cursor: pointer; }
    .gong-input { display: none; user-select: text; }
    .gong-msg-wrap.is-custom .gong-select { flex: 0 0 92px; }
    .gong-msg-wrap.is-custom .gong-input  { display: block; }
    .gong-select:focus-visible, .gong-input:focus { border-color: var(--gg-op); box-shadow: 0 0 0 2px rgba(255,255,255,0.8); }

    /* Couleur du widget */
    .gong-swatches { flex: 1; display: flex; gap: 6px; }
    .gong-swatch {
        width: 20px; height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .gong-swatch.is-on { border-color: var(--gg-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Flash doux sur tout le widget quand on sonne ── */
    .gong-flash {
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: radial-gradient(80% 70% at 50% 45%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.55) 100%);
        box-shadow: inset 0 0 0 4px var(--gg-op);
        pointer-events: none;
        z-index: 2;
        opacity: 0;
    }
    .gong-flash.active { animation: gong-flash 1.4s ease-out forwards; }
    @keyframes gong-flash { 0% { opacity: 1; } 100% { opacity: 0; } }

    @media (prefers-reduced-motion: reduce) {
        .gong-box-wrap.is-ringing .gong-wave { animation: none; }
        .gong-btn-strike.is-hit { animation: none; }
        .gong-flash.active { animation: none; opacity: .6; }
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
    if (!document.getElementById('gong-widget-style-v1')) {
        var st = document.createElement('style');
        st.id = 'gong-widget-style-v1';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Couleurs disponibles (mêmes teintes que la calculatrice et le radar) ──
    var THEMES = {
        jaune:  { name: 'Jaune',  bg: '#F6D86A', op: '#B9770E' },
        bleu:   { name: 'Bleu',   bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',   bg: '#7FD6A6', op: '#23915A' },
        rose:   { name: 'Rose',   bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet', bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',   bg: '#D4DAE2', op: '#4A5868' }
    };
    var DEFAULT_THEME = 'jaune';

    // ── Sons disponibles ──────────────────────────────────────────────────
    var SOUNDS = {
        gong:     { name: 'Gong',     gap: 1.8 },
        cloche:   { name: 'Cloche',   gap: 1.0 },
        carillon: { name: 'Carillon', gap: 1.9 },
        bol:      { name: 'Bol',      gap: 2.2 }
    };
    var SOUND_ORDER = ['gong', 'cloche', 'carillon', 'bol'];

    // ── Messages proposés ─────────────────────────────────────────────────
    var MESSAGES = [
        { id: 'silence',  text: '🤫 Silence, s\'il vous plaît' },
        { id: 'ecoute',   text: '👂 On écoute' },
        { id: 'regard',   text: '👀 Regardez-moi' },
        { id: 'range',    text: '🧹 On range' },
        { id: 'rang',     text: '🚶 On se met en rang' },
        { id: 'place',    text: '🪑 Chacun à sa place' },
        { id: 'aucun',    text: '' },
        { id: 'perso',    text: null }
    ];
    var MESSAGE_LABELS = {
        silence: 'Silence', ecoute: 'On écoute', regard: 'Regardez-moi', range: 'On range',
        rang: 'En rang', place: 'À sa place', aucun: 'Aucun message', perso: 'Personnalisé…'
    };

    // ── Réglages mémorisés (secours si la sauvegarde du tableau ne garde pas
    //    les attributs du widget) ──────────────────────────────────────────
    var PREFS_KEY = 'bdp-gong-prefs';
    function loadPrefs() {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; } catch (e) { return {}; }
    }
    function storePrefs(p) {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {}
    }
    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    // ── Icônes ──
    var ICON_BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/><path d="M12 3v2"/></svg>';
    var ICON_GONG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v18M20 3v18M4 4h16"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/></svg>';
    var ICON_CARILLON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18"/><path d="M6 4v8M12 4v12M18 4v6"/><circle cx="6" cy="14" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="12" r="2"/></svg>';
    var ICON_BOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" opacity=".6"/></svg>';
    var ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
    var ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    var ICON_MUTE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/></svg>';
    var SOUND_ICONS = { gong: ICON_GONG, cloche: ICON_BELL, carillon: ICON_CARILLON, bol: ICON_BOL };

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initGongWidget = function (widget) {
        (function () {

            var prefs = loadPrefs();
            var ds = widget.dataset;

            // ── Injection HTML ──
            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML =
                '<div class="gong-outer">'
              +   '<div class="gong-resize-handle" data-dir="se" title="Redimensionner"></div>'
              +   '<div class="gong-resize-handle rh-e" data-dir="e" title="Largeur"></div>'
              +   '<div class="gong-resize-handle rh-s" data-dir="s" title="Hauteur"></div>'
              +   '<div class="gong-flash"></div>'
              +   '<div class="gong-scale-wrap">'
              +     '<div class="gong-widget">'
              +       '<div class="gong-header">'
              +         '<div class="gong-title">' + ICON_BELL + 'Gong</div>'
              +         '<div class="gong-header-right">'
              +           '<button class="gong-icon-btn gong-toggle-controls" title="Afficher ou masquer les réglages">' + ICON_SLIDERS + '</button>'
              +           '<span class="gong-sep"></span>'
              +           '<div class="wf-btns">'
              +             '<button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>'
              +             '<button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>'
              +             '<button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>'
              +           '</div>'
              +         '</div>'
              +       '</div>'
              +       '<div class="gong-sounds" role="group" aria-label="Son du signal">'
              +         SOUND_ORDER.map(function (id) {
                          return '<button class="gong-sound-btn" data-sound="' + id + '" title="Choisir et écouter : ' + SOUNDS[id].name + '">'
                               +   SOUND_ICONS[id]
                               +   '<span class="gong-sound-name">' + SOUNDS[id].name + '</span>'
                               + '</button>';
                        }).join('')
              +       '</div>'
              +       '<div class="gong-box-wrap">'
              +         '<div class="gong-ring outer-ring"></div>'
              +         '<div class="gong-ring" style="transform:scale(0.55)"></div>'
              +         '<div class="gong-ring" style="transform:scale(0.78)"></div>'
              +         '<div class="gong-wave w1"></div>'
              +         '<div class="gong-wave w2"></div>'
              +         '<div class="gong-wave w3"></div>'
              +         '<svg class="gong-progress" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></svg>'
              +         '<button class="gong-btn-strike" title="Sonner (Espace en plein écran)">'
              +           '<span class="gong-btn-ico">' + ICON_BELL + '</span>'
              +           '<span class="gong-btn-text">Sonner</span>'
              +           '<span class="gong-btn-count" aria-live="polite">5</span>'
              +           '<span class="gong-btn-unit">secondes</span>'
              +           '<span class="gong-btn-done">Merci !</span>'
              +         '</button>'
              +         '<div class="gong-message" aria-live="polite"></div>'
              +       '</div>'
              +       '<div class="gong-info-row">'
              +         '<div class="gong-info-main">'
              +           '<span class="gong-count">0</span>'
              +           '<span class="gong-count-label">signal aujourd\'hui</span>'
              +         '</div>'
              +         '<div class="gong-info-btns">'
              +           '<button class="gong-icon-btn gong-mute-btn" title="Visuel seul : couper le son">' + ICON_SOUND + '</button>'
              +           '<button class="gong-reset-btn">Remettre à zéro</button>'
              +         '</div>'
              +       '</div>'
              +       '<div class="gong-controls">'
              +         '<div class="gong-row">'
              +           '<span class="gong-row-label">Volume</span>'
              +           '<input type="range" class="gong-slider gong-vol-slider" min="0" max="100" step="5" value="70" aria-label="Volume">'
              +           '<span class="gong-val gong-vol-val">70%</span>'
              +         '</div>'
              +         '<div class="gong-row">'
              +           '<span class="gong-row-label">Coups</span>'
              +           '<div class="gong-seg" role="group" aria-label="Nombre de coups">'
              +             '<button class="gong-seg-btn" data-rep="1">1</button>'
              +             '<button class="gong-seg-btn" data-rep="2">2</button>'
              +             '<button class="gong-seg-btn" data-rep="3">3</button>'
              +           '</div>'
              +         '</div>'
              +         '<div class="gong-row">'
              +           '<span class="gong-row-label" title="Temps laissé à la classe pour faire le silence. Un compte à rebours s\'affiche, puis « Merci ! ». 0 = pas de compte à rebours.">Délai</span>'
              +           '<input type="range" class="gong-slider gong-delay-slider" min="0" max="10" step="1" value="5" aria-label="Délai de silence">'
              +           '<span class="gong-val gong-delay-val">5 s</span>'
              +         '</div>'
              +         '<div class="gong-row">'
              +           '<span class="gong-row-label">Message</span>'
              +           '<div class="gong-msg-wrap">'
              +             '<select class="gong-select" aria-label="Message affiché">'
              +               MESSAGES.map(function (m) { return '<option value="' + m.id + '">' + MESSAGE_LABELS[m.id] + '</option>'; }).join('')
              +             '</select>'
              +             '<input type="text" class="gong-input" maxlength="40" placeholder="Votre message" aria-label="Message personnalisé">'
              +           '</div>'
              +         '</div>'
              +         '<div class="gong-row">'
              +           '<span class="gong-row-label">Couleur</span>'
              +           '<div class="gong-swatches">'
              +             Object.keys(THEMES).map(function (id) {
                              return '<button class="gong-swatch" data-theme="' + id + '" title="' + THEMES[id].name + '" style="background:' + THEMES[id].bg + '"></button>';
                            }).join('')
              +           '</div>'
              +         '</div>'
              +       '</div>'
              +     '</div>'
              +   '</div>'
              + '</div>';

            // ── Références DOM ──
            var outer       = widget.querySelector('.gong-outer');
            var scaleWrap   = widget.querySelector('.gong-scale-wrap');
            var inner       = widget.querySelector('.gong-widget');
            var boxWrap     = widget.querySelector('.gong-box-wrap');
            var btnStrike   = widget.querySelector('.gong-btn-strike');
            var btnIco      = widget.querySelector('.gong-btn-ico');
            var btnCount    = widget.querySelector('.gong-btn-count');
            var progress    = widget.querySelector('.gong-progress');
            var progCircle  = progress.querySelector('circle');
            var msgEl       = widget.querySelector('.gong-message');
            var flashEl     = widget.querySelector('.gong-flash');
            var countEl     = widget.querySelector('.gong-count');
            var countLabel  = widget.querySelector('.gong-count-label');
            var muteBtn     = widget.querySelector('.gong-mute-btn');
            var resetBtn    = widget.querySelector('.gong-reset-btn');
            var toggleBtn   = widget.querySelector('.gong-toggle-controls');
            var controlsEl  = widget.querySelector('.gong-controls');
            var volSlider   = widget.querySelector('.gong-vol-slider');
            var volVal      = widget.querySelector('.gong-vol-val');
            var delaySlider = widget.querySelector('.gong-delay-slider');
            var delayVal    = widget.querySelector('.gong-delay-val');
            var msgWrap     = widget.querySelector('.gong-msg-wrap');
            var msgSelect   = widget.querySelector('.gong-select');
            var msgInput    = widget.querySelector('.gong-input');
            var soundBtns   = widget.querySelectorAll('.gong-sound-btn');
            var segBtns     = widget.querySelectorAll('.gong-seg-btn');
            var wfMin       = widget.querySelector('[data-role="wf-min"]');
            var wfMax       = widget.querySelector('[data-role="wf-max"]');
            var wfClose     = widget.querySelector('[data-role="wf-close"]');

            // ── État (attributs du widget en priorité, puis derniers réglages) ──
            function pick(dsKey, prefKey, def) {
                if (ds[dsKey] !== undefined && ds[dsKey] !== '') return ds[dsKey];
                if (prefs[prefKey] !== undefined) return prefs[prefKey];
                return def;
            }
            var soundId   = pick('gongSound', 'sound', 'gong');
            if (!SOUNDS[soundId]) soundId = 'gong';
            var volume    = Math.max(0, Math.min(100, parseInt(pick('gongVol', 'vol', 70), 10) || 0));
            var repeats   = Math.max(1, Math.min(3, parseInt(pick('gongRep', 'rep', 1), 10) || 1));
            var delaySec  = Math.max(0, Math.min(10, parseInt(pick('gongDelay', 'delay', 5), 10)));
            if (isNaN(delaySec)) delaySec = 5;
            var msgId     = pick('gongMsg', 'msg', 'silence');
            if (!MESSAGE_LABELS[msgId]) msgId = 'silence';
            var msgCustom = pick('gongCustom', 'custom', '');
            var isMuted   = String(pick('gongMuted', 'muted', '0')) === '1';
            var controlsVisible = String(pick('gongCtrl', 'ctrl', '1')) !== '0';
            var isMax     = false;

            // Compteur du jour (remis à zéro automatiquement chaque jour)
            var signals = 0;
            if (ds.gongDay === todayKey()) signals = parseInt(ds.gongCount, 10) || 0;
            else if (prefs.day === todayKey()) signals = parseInt(prefs.count, 10) || 0;

            // ── Sauvegarde ──
            function persist(skipBoard) {
                ds.gongSound  = soundId;
                ds.gongVol    = volume;
                ds.gongRep    = repeats;
                ds.gongDelay  = delaySec;
                ds.gongMsg    = msgId;
                ds.gongCustom = msgCustom;
                ds.gongMuted  = isMuted ? '1' : '0';
                ds.gongCtrl   = controlsVisible ? '1' : '0';
                ds.gongCount  = signals;
                ds.gongDay    = todayKey();
                if (!isMax && outer.style.width)  ds.gongW = parseInt(outer.style.width, 10);
                if (!isMax && outer.style.height) ds.gongH = parseInt(outer.style.height, 10);
                storePrefs({
                    sound: soundId, vol: volume, rep: repeats, delay: delaySec,
                    msg: msgId, custom: msgCustom, muted: isMuted ? '1' : '0',
                    ctrl: controlsVisible ? '1' : '0', theme: themeId,
                    count: signals, day: todayKey(),
                    w: ds.gongW, h: ds.gongH
                });
                if (!skipBoard && typeof saveBoard === 'function') saveBoard();
            }

            // ── Taille restaurée ──
            var savedW = parseInt(ds.gongW || prefs.w, 10);
            var savedH = parseInt(ds.gongH || prefs.h, 10);
            if (savedW >= 220) outer.style.width  = savedW + 'px';
            if (savedH >= 200) outer.style.height = savedH + 'px';

            // ── Libellé de la mini-barre (widget réduit) ──
            function messageText() {
                if (msgId === 'perso') return (msgCustom || '').trim();
                for (var i = 0; i < MESSAGES.length; i++) if (MESSAGES[i].id === msgId) return MESSAGES[i].text || '';
                return '';
            }
            function miniLabelText() {
                var txt = '🔔 ' + SOUNDS[soundId].name;
                if (isMuted) txt += ' (visuel seul)';
                if (counting) txt += ' — ⏳ ' + remaining + ' s';
                if (signals > 0) txt += ' · ' + signals + (signals > 1 ? ' signaux' : ' signal');
                return txt;
            }
            function updateMiniLabel() {
                var lbl = widget.querySelector('.wf-mini-bar > span');
                if (lbl) lbl.textContent = miniLabelText();
            }

            function setCount(n) {
                signals = n;
                countEl.textContent = n;
                countLabel.textContent = (n > 1 ? 'signaux' : 'signal') + ' aujourd\'hui';
                updateMiniLabel();
            }

            // Remplissage coloré des curseurs
            function paintSlider(sl) {
                var min = parseFloat(sl.min), max = parseFloat(sl.max);
                sl.style.setProperty('--fill', ((parseFloat(sl.value) - min) / (max - min) * 100) + '%');
            }

            // ── Dimensions de référence ──
            var REF_W = 340, REF_H = 540;

            // Le contenu remplit toute la place : il est agrandi selon la plus petite
            // dimension, centré, et la zone centrale profite de la hauteur en plus
            // (ou de la place libérée quand les réglages sont masqués).
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
                var s = Math.min(W * m / REF_W, H * m / REF_H);
                var availH = H * m / s;
                var extra = availH - REF_H;
                if (controlsEl.classList.contains('hidden')) extra += controlsEl.scrollHeight + 18;
                var box = Math.min(300, 210 + Math.max(0, extra));
                inner.style.height = availH + 'px';
                inner.style.setProperty('--box', box + 'px');
                scaleWrap.style.width     = REF_W + 'px';
                scaleWrap.style.height    = availH + 'px';
                scaleWrap.style.left      = Math.round((W - REF_W * s) / 2) + 'px';
                scaleWrap.style.top       = Math.round((H - availH * s) / 2) + 'px';
                scaleWrap.style.transform = 'scale(' + s + ')';
            }

            // ── Redimensionnement libre : coin (les deux), bord droit (largeur), bord bas (hauteur) ──
            var MIN_W = 220, MIN_H = 200;
            outer.querySelectorAll('.gong-resize-handle').forEach(function (handle) {
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
                        persist();
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

            // =================================================================
            // AUDIO — sons synthétisés (aucun fichier, fonctionne hors-ligne)
            // =================================================================
            var audioCtx = null, master = null;

            function getCtx() {
                if (!audioCtx) {
                    var AC = window.AudioContext || window.webkitAudioContext;
                    if (!AC) return null;
                    audioCtx = new AC();
                    var comp = audioCtx.createDynamicsCompressor();
                    comp.threshold.value = -10;
                    comp.ratio.value = 4;
                    master = audioCtx.createGain();
                    master.connect(comp);
                    comp.connect(audioCtx.destination);
                }
                if (audioCtx.state === 'suspended') audioCtx.resume();
                master.gain.setValueAtTime(Math.pow(volume / 100, 1.6) * 0.9, audioCtx.currentTime);
                return audioCtx;
            }

            // Une composante sinusoïdale avec attaque et décroissance exponentielle
            function partial(ac, freq, gain, t, decay, attack, glide) {
                var o = ac.createOscillator();
                var g = ac.createGain();
                o.type = 'sine';
                if (glide) {
                    o.frequency.setValueAtTime(freq * glide, t);
                    o.frequency.exponentialRampToValueAtTime(freq, t + 1.2);
                } else {
                    o.frequency.setValueAtTime(freq, t);
                }
                g.gain.setValueAtTime(0.0001, t);
                g.gain.linearRampToValueAtTime(gain, t + (attack || 0.004));
                g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
                o.connect(g); g.connect(master);
                o.start(t); o.stop(t + decay + 0.05);
            }

            // Petit bruit filtré pour le choc de la mailloche
            function strikeNoise(ac, t, dur, gain, freq, q) {
                var len = Math.max(1, Math.floor(ac.sampleRate * dur));
                var buf = ac.createBuffer(1, len, ac.sampleRate);
                var d = buf.getChannelData(0);
                for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
                var src = ac.createBufferSource();
                src.buffer = buf;
                var bp = ac.createBiquadFilter();
                bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q || 1;
                var g = ac.createGain();
                g.gain.value = gain;
                src.connect(bp); bp.connect(g); g.connect(master);
                src.start(t);
            }

            var VOICES = {
                // Gong : fondamentale grave, partiels inharmoniques, léger glissando
                gong: function (ac, t) {
                    var f = 98;
                    strikeNoise(ac, t, 0.09, 0.35, 700, 0.8);
                    partial(ac, f * 0.5,  0.30, t, 6.5, 0.02);
                    partial(ac, f,        0.55, t, 6.0, 0.01, 1.03);
                    partial(ac, f * 1.47, 0.32, t, 5.0, 0.02, 1.02);
                    partial(ac, f * 2.09, 0.24, t, 4.2, 0.03, 1.02);
                    partial(ac, f * 2.56, 0.18, t, 3.6, 0.05);
                    partial(ac, f * 3.18, 0.14, t, 3.0, 0.08);
                    partial(ac, f * 4.21, 0.08, t, 2.2, 0.10);
                    partial(ac, f * 5.43, 0.05, t, 1.6, 0.12);
                },
                // Cloche : « ding » clair, comme une cloche de bureau
                cloche: function (ac, t) {
                    var f = 1046;
                    strikeNoise(ac, t, 0.02, 0.18, 5000, 1.5);
                    partial(ac, f * 0.5,  0.18, t, 2.8);
                    partial(ac, f,        0.50, t, 2.4, 0.002);
                    partial(ac, f * 1.19, 0.20, t, 1.8, 0.002);
                    partial(ac, f * 1.56, 0.16, t, 1.4, 0.002);
                    partial(ac, f * 2.0,  0.22, t, 1.2, 0.002);
                    partial(ac, f * 2.66, 0.10, t, 0.9, 0.002);
                    partial(ac, f * 3.01, 0.07, t, 0.7, 0.002);
                },
                // Carillon : trois notes descendantes « ding-dang-dong »
                carillon: function (ac, t) {
                    [784, 659, 523].forEach(function (f, i) {
                        var tt = t + i * 0.5;
                        partial(ac, f,        0.45, tt, 2.0, 0.003);
                        partial(ac, f * 2.0,  0.14, tt, 1.1, 0.003);
                        partial(ac, f * 3.0,  0.06, tt, 0.6, 0.003);
                        partial(ac, f * 4.2,  0.04, tt, 0.4, 0.003);
                    });
                },
                // Bol chantant : son long et doux, avec battements
                bol: function (ac, t) {
                    var f = 220;
                    strikeNoise(ac, t, 0.05, 0.12, 400, 1);
                    partial(ac, f,        0.45, t, 8.0, 0.03);
                    partial(ac, f * 1.004,0.35, t, 8.0, 0.03);
                    partial(ac, f * 2.71, 0.22, t, 6.0, 0.03);
                    partial(ac, f * 2.716,0.18, t, 6.0, 0.03);
                    partial(ac, f * 5.15, 0.08, t, 3.5, 0.03);
                }
            };

            function playSound(id, times) {
                var ac = getCtx();
                if (!ac) return;
                var t0 = ac.currentTime + 0.03;
                for (var i = 0; i < times; i++) VOICES[id](ac, t0 + i * SOUNDS[id].gap);
            }

            // =================================================================
            // SIGNAL : son + ondes + message + compte à rebours
            // =================================================================
            var counting = false, remaining = 0;
            var tickTimer = null, doneTimer = null, msgTimer = null;
            var waveTimers = [];

            function replayWaves() {
                boxWrap.classList.remove('is-ringing');
                void boxWrap.offsetWidth;            // relance l'animation
                boxWrap.classList.add('is-ringing');
            }
            function replayFlash() {
                flashEl.classList.remove('active');
                void flashEl.offsetWidth;
                flashEl.classList.add('active');
            }
            function hitButton() {
                btnStrike.classList.remove('is-hit');
                void btnStrike.offsetWidth;
                btnStrike.classList.add('is-hit');
            }

            function showMessage(on) {
                var txt = messageText();
                msgEl.textContent = txt;
                msgEl.classList.toggle('is-shown', !!(on && txt));
            }

            function clearTimers() {
                clearInterval(tickTimer); tickTimer = null;
                clearTimeout(doneTimer);  doneTimer = null;
                clearTimeout(msgTimer);   msgTimer = null;
                waveTimers.forEach(clearTimeout); waveTimers = [];
            }

            function setProgress(frac) {
                progCircle.style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, frac)) * 100);
            }

            function resetVisual() {
                clearTimers();
                counting = false;
                btnStrike.classList.remove('is-counting', 'is-done');
                boxWrap.classList.remove('is-done');
                progress.classList.remove('is-on');
                showMessage(false);
                updateMiniLabel();
            }

            function finishCountdown() {
                clearInterval(tickTimer); tickTimer = null;
                counting = false;
                btnStrike.classList.remove('is-counting');
                btnStrike.classList.add('is-done');
                boxWrap.classList.add('is-done');
                setProgress(1);
                updateMiniLabel();
                doneTimer = setTimeout(resetVisual, 2500);
            }

            function strike() {
                resetVisual();

                // Son (sauf mode « visuel seul »)
                if (!isMuted) playSound(soundId, repeats);

                // Ondes et flash, une fois par coup
                var gap = SOUNDS[soundId].gap * 1000;
                for (var i = 0; i < repeats; i++) {
                    (function (k) {
                        waveTimers.push(setTimeout(function () {
                            replayWaves(); replayFlash(); hitButton();
                        }, k * gap));
                    })(i);
                }

                showMessage(true);
                setCount(signals + 1);
                persist();

                if (delaySec > 0) {
                    counting = true;
                    remaining = delaySec;
                    btnCount.textContent = remaining;
                    btnStrike.classList.add('is-counting');
                    progress.classList.add('is-on');
                    // Anneau plein → se vide seconde par seconde
                    progCircle.style.transition = 'none';
                    setProgress(1);
                    void progCircle.getBoundingClientRect();
                    progCircle.style.transition = '';
                    updateMiniLabel();
                    tickTimer = setInterval(function () {
                        remaining--;
                        setProgress(remaining / delaySec);
                        if (remaining <= 0) { finishCountdown(); return; }
                        btnCount.textContent = remaining;
                        updateMiniLabel();
                    }, 1000);
                } else {
                    msgTimer = setTimeout(function () { showMessage(false); }, 4000);
                }
            }

            // ── Choix du son ──
            function setSound(id, preview) {
                if (!SOUNDS[id]) id = 'gong';
                soundId = id;
                soundBtns.forEach(function (b) {
                    var on = b.dataset.sound === id;
                    b.classList.toggle('is-active', on);
                    b.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
                btnIco.innerHTML = SOUND_ICONS[id];
                updateMiniLabel();
                if (preview && !isMuted) playSound(id, 1);
            }

            function setRepeats(n) {
                repeats = n;
                segBtns.forEach(function (b) {
                    var on = parseInt(b.dataset.rep, 10) === n;
                    b.classList.toggle('is-active', on);
                    b.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
            }

            function setMuted(on) {
                isMuted = !!on;
                muteBtn.innerHTML = isMuted ? ICON_MUTE : ICON_SOUND;
                muteBtn.title = isMuted ? 'Visuel seul : remettre le son' : 'Visuel seul : couper le son';
                muteBtn.classList.toggle('muted', isMuted);
                updateMiniLabel();
            }

            function setMessageChoice(id) {
                msgId = MESSAGE_LABELS[id] ? id : 'silence';
                msgSelect.value = msgId;
                msgWrap.classList.toggle('is-custom', msgId === 'perso');
                if (msgEl.classList.contains('is-shown')) showMessage(true);
            }

            // ── Application de l'état initial ──
            volSlider.value = volume;   volVal.textContent = volume + '%';
            delaySlider.value = delaySec; delayVal.textContent = delaySec ? delaySec + ' s' : 'non';
            msgInput.value = msgCustom;
            [volSlider, delaySlider].forEach(paintSlider);
            setSound(soundId, false);
            setRepeats(repeats);
            setMuted(isMuted);
            setMessageChoice(msgId);
            setCount(signals);
            controlsEl.classList.toggle('hidden', !controlsVisible);
            toggleBtn.classList.toggle('is-off', !controlsVisible);

            // ── Événements ──
            btnStrike.addEventListener('click', function (e) {
                e.stopPropagation();
                strike();
            });

            soundBtns.forEach(function (b) {
                b.addEventListener('click', function (e) {
                    e.stopPropagation();
                    setSound(b.dataset.sound, true);   // on entend le son choisi
                    persist();
                });
            });

            segBtns.forEach(function (b) {
                b.addEventListener('click', function (e) {
                    e.stopPropagation();
                    setRepeats(parseInt(b.dataset.rep, 10));
                    persist();
                });
            });

            volSlider.addEventListener('input', function () {
                volume = parseInt(this.value, 10);
                volVal.textContent = volume + '%';
                paintSlider(this);
                if (audioCtx && master) master.gain.setValueAtTime(Math.pow(volume / 100, 1.6) * 0.9, audioCtx.currentTime);
            });
            volSlider.addEventListener('change', function () {
                if (!isMuted) playSound(soundId, 1);   // aperçu du volume
                persist();
            });

            delaySlider.addEventListener('input', function () {
                delaySec = parseInt(this.value, 10);
                delayVal.textContent = delaySec ? delaySec + ' s' : 'non';
                paintSlider(this);
            });
            delaySlider.addEventListener('change', function () { persist(); });

            msgSelect.addEventListener('change', function () {
                setMessageChoice(this.value);
                if (msgId === 'perso') setTimeout(function () { msgInput.focus(); }, 0);
                persist();
            });
            msgInput.addEventListener('input', function () {
                msgCustom = this.value;
                if (msgEl.classList.contains('is-shown')) showMessage(true);
            });
            msgInput.addEventListener('change', function () { persist(); });
            // Les touches tapées dans le champ ne doivent pas déclencher les raccourcis du tableau
            msgInput.addEventListener('keydown', function (e) {
                e.stopPropagation();
                if (e.key === 'Enter') this.blur();
            });

            muteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                setMuted(!isMuted);
                persist();
            });

            resetBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                setCount(0);
                resetVisual();
                persist();
            });

            // ── Couleur ──
            var themeId = DEFAULT_THEME;
            function setTheme(id) {
                if (!THEMES[id]) id = DEFAULT_THEME;
                themeId = id;
                outer.style.setProperty('--gg-bg', THEMES[id].bg);
                outer.style.setProperty('--gg-op', THEMES[id].op);
                widget.dataset.wfTheme = id;
                widget.querySelectorAll('.gong-swatch').forEach(function (sw) {
                    sw.classList.toggle('is-on', sw.dataset.theme === id);
                });
            }
            widget.querySelectorAll('.gong-swatch').forEach(function (sw) {
                sw.addEventListener('click', function (e) {
                    e.stopPropagation();
                    setTheme(sw.dataset.theme);
                    persist();
                });
            });
            setTheme(widget.dataset.wfTheme || prefs.theme || DEFAULT_THEME);
            // Pour la sauvegarde (save-load.js), comme les autres widgets
            widget._wfGetTheme = function () { return themeId; };
            widget._wfSetTheme = function (id) { setTheme(id); persist(true); };

            // ── Afficher / masquer les réglages ──
            toggleBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                controlsVisible = !controlsVisible;
                controlsEl.classList.toggle('hidden', !controlsVisible);
                toggleBtn.classList.toggle('is-off', !controlsVisible);
                rescale();
                persist();
            });

            // ── Boutons fenêtre : réduire / plein écran / fermer ──────────
            function setMax(on) {
                isMax = !!on;
                outer.classList.toggle('gong-fullboard', isMax);
                wfMax.title = isMax ? 'Quitter le plein écran' : 'Plein écran';
                outer.style.cursor = '';
                rescale();
            }
            widget._wfSetMax = setMax;   // utilisé à l'ouverture sur téléphone / tablette

            function onWinResize() { if (isMax) rescale(); }
            function onKey(e) {
                if (!isMax) return;
                if (e.key === 'Escape') { setMax(false); return; }
                // Espace ou Entrée en plein écran : sonner (sauf pendant la saisie)
                var tag = (e.target && e.target.tagName) || '';
                if ((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tag) && !(e.target && e.target.isContentEditable)) {
                    e.preventDefault();
                    strike();
                }
            }
            window.addEventListener('resize', onWinResize);
            document.addEventListener('keydown', onKey);

            wfMin.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isMax) setMax(false);
                // Le gong est masqué pendant la réduction ; la mini-barre garde
                // un bouton 🔔 pour sonner sans déplier.
                outer.style.display = 'none';
                window._wfMiniBarCollapse(widget, miniLabelText(), {
                    onExpand: function () {
                        outer.style.display = '';
                        requestAnimationFrame(rescale);
                    }
                });
                var bar = widget.querySelector('.wf-mini-bar');
                if (bar && !bar.querySelector('.gong-mini-ring')) {
                    var ring = document.createElement('button');
                    ring.className = 'gong-mini-ring';
                    ring.title = 'Sonner';
                    ring.textContent = '🔔';
                    ring.style.cssText = 'flex-shrink:0;background:#febc2e;border:none;color:#14202E;border-radius:4px;width:28px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
                    ring.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
                    ring.addEventListener('mousedown',   function (ev) { ev.stopPropagation(); });
                    ring.addEventListener('click', function (ev) {
                        ev.stopPropagation(); ev.preventDefault();
                        strike();
                    });
                    var expand = bar.querySelector('button');
                    bar.insertBefore(ring, expand);
                }
            });

            wfMax.addEventListener('click', function (e) {
                e.stopPropagation();
                setMax(!isMax);
            });

            wfClose.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                cleanup();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });

            // ── Bloquer propagation sur éléments interactifs (et partout en plein écran) ──
            outer.addEventListener('mousedown', function (e) {
                if (isMax || e.target.closest('button, input, select, .gong-resize-handle')) {
                    e.stopPropagation();
                }
            });
            outer.addEventListener('touchstart', function (e) {
                if (isMax || e.target.closest('button, input, select, .gong-resize-handle')) {
                    e.stopPropagation();
                }
            }, { passive: true });
            // En plein écran, aucun appui ne doit déplacer le widget (resté dessous)
            outer.addEventListener('pointerdown', function (e) {
                if (isMax || e.target.closest('input, select')) e.stopPropagation();
            });

            // ── Curseur : main sur la barre du haut, flèche ailleurs ──
            outer.addEventListener('mousemove', function (e) {
                if (isMax) { outer.style.cursor = ''; return; }
                if (e.target.closest('button, input, select')) { return; }
                if (e.target.closest('.gong-resize-handle')) { outer.style.cursor = ''; return; }
                outer.style.cursor = e.target.closest('.gong-header') ? ((e.buttons & 1) ? 'grabbing' : 'grab') : 'default';
            });
            outer.addEventListener('mouseleave', function () {
                outer.style.cursor = '';
            });

            // ── Nettoyage à la suppression ──
            var cleaned = false;
            function cleanup() {
                if (cleaned) return;
                cleaned = true;
                clearTimers();
                window.removeEventListener('resize', onWinResize);
                document.removeEventListener('keydown', onKey);
                if (audioCtx) { try { audioCtx.close(); } catch (err) {} audioCtx = null; master = null; }
                obs.disconnect();
            }
            var obs = new MutationObserver(function () {
                if (!document.contains(widget)) cleanup();
            });
            obs.observe(document.body, { childList: true, subtree: true });

            persist(true);   // mémorise l'état initial sans relancer la sauvegarde du tableau
            rescale();
            requestAnimationFrame(rescale);

        })();
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function hook(orig) {
        return function (type) {
            var widget = orig.apply(this, arguments);
            if (type === 'gong' && widget) {
                initGongWidget(widget);
                // Sur téléphone / tablette : ouverture directe en plein écran (bouton vert)
                if (window._wfIsPhoneLaunch() && widget._wfSetMax) {
                    widget._wfSetMax(true);
                    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
                }
            }
            return widget;
        };
    }
    if (typeof window.createWidget === 'function') {
        window.createWidget = hook(window.createWidget);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof window.createWidget === 'function') window.createWidget = hook(window.createWidget);
        });
    }

})();

// ── Curseurs : flèche par défaut, main qui attrape sur la barre du haut (déplacement),
//    doigt qui pointe sur tout ce qui est cliquable. ──
(function () {
    if (typeof document === 'undefined' || document.getElementById('curseurs-gong')) return;
    const st = document.createElement('style');
    st.id = 'curseurs-gong';
    st.textContent = `
.widget[data-type="gong"] { cursor: default; }
.widget[data-type="gong"] .gong-header { cursor: grab; }
.widget[data-type="gong"] .gong-header:active { cursor: grabbing; }
.widget[data-type="gong"] .gong-fullboard .gong-header, .widget[data-type="gong"] .gong-fullboard .gong-header:active { cursor: default !important; }
.widget[data-type="gong"] .gong-header :is(button, select, .wf-btn, [role="button"]) { cursor: pointer; }
.widget[data-type="gong"] .drag-handle { cursor: grab; }
.widget[data-type="gong"] .drag-handle:active { cursor: grabbing; }
:where(.widget[data-type="gong"]) :where(button, select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="color"], input[type="file"]) { cursor: pointer; }
.widget[data-type="gong"] input[type="text"] { cursor: text; }
.widget[data-type="gong"] :is(button, select, input, textarea):disabled { cursor: default !important; }
.widget[data-type="gong"] .wf-mini-bar { cursor: grab !important; }
.widget[data-type="gong"] .wf-mini-bar:active { cursor: grabbing !important; }
.widget[data-type="gong"] .wf-mini-bar :is(button, .wf-btn) { cursor: pointer !important; }
`;
    (document.head || document.documentElement).appendChild(st);
})();
