// =========================================================================
// WIDGET VILLE DU SILENCE — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'bruit'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-bruit.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets ou Outils) :
//      <div class="mm-sub-item" onclick="createWidget('bruit');closeMainMenu()">
//          <span class="mm-ico">🏙️</span>&nbsp;&nbsp;Ville du Silence
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    .widget[data-type="bruit"],
    .widget[data-type="bruit"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="bruit"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    .bruit-outer {
        position: relative;
        width: 380px;
        height: 460px;
        min-width: 240px;
        min-height: 290px;
        overflow: hidden;
        box-sizing: border-box;
        border-radius: 20px;
        box-shadow: 0 6px 32px rgba(0,0,0,0.18);
        font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
    }
    .widget[data-type="bruit"]:hover .bruit-outer,
    .widget[data-type="bruit"]:focus-within .bruit-outer {
        outline: 2px dashed rgba(255,255,255,0.3);
    }

    /* Poignée resize */
    .bruit-resize-handle {
        position: absolute;
        bottom: 0; right: 0;
        width: 20px; height: 20px;
        cursor: nwse-resize;
        z-index: 30;
        opacity: 0;
        transition: opacity 0.2s;
        background-image: linear-gradient(135deg,
            transparent 50%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.5) 62%,
            transparent 62%, transparent 72%,
            rgba(255,255,255,0.5) 72%, rgba(255,255,255,0.5) 84%, transparent 84%);
        border-bottom-right-radius: 20px;
    }
    .widget[data-type="bruit"]:hover .bruit-resize-handle,
    .widget[data-type="bruit"]:focus-within .bruit-resize-handle {
        opacity: 1;
    }

    .bruit-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
        z-index: 0;
        pointer-events: none;
    }

    /* ── Éléments décoratifs : ne captent pas les clics ── */
    .bruit-sky, .bruit-stars, .bruit-star, .bruit-sun,
    .bruit-cloud, .bruit-ground, .bruit-road,
    .bruit-building, .bruit-building-body, .bruit-building-roof,
    .bruit-window-grid, .bruit-win,
    .bruit-tree, .bruit-tree-top, .bruit-tree-trunk,
    .bruit-crack, .bruit-smoke, .bruit-lightning,
    .bruit-car, .bruit-bird {
        pointer-events: none;
    }

    /* ── Éléments interactifs : captent les clics ── */
    .bruit-btn-start, .bruit-toggle-ctrl,
    .bruit-icon-btn, .bruit-reset-btn,
    .bruit-ctrl-slider, .bruit-resize-handle {
        pointer-events: all;
    }

    /* ── Ciel dégradé animé ── */
    .bruit-sky {
        position: absolute;
        inset: 0;
        transition: background 1.2s ease;
    }

    /* ── Nuages ── */
    .bruit-cloud {
        position: absolute;
        border-radius: 50px;
        transition: opacity 0.8s ease, transform 0.8s ease;
    }

    /* ── Soleil / Lune ── */
    .bruit-sun {
        position: absolute;
        border-radius: 50%;
        transition: all 1s ease;
    }

    /* ── Étoiles ── */
    .bruit-stars {
        position: absolute;
        inset: 0;
        transition: opacity 0.8s ease;
    }
    .bruit-star {
        position: absolute;
        background: #fff;
        border-radius: 50%;
        animation: bruit-twinkle 2s infinite alternate;
    }
    @keyframes bruit-twinkle {
        from { opacity: 0.3; transform: scale(0.8); }
        to   { opacity: 1;   transform: scale(1.2); }
    }

    /* ── Sol ── */
    .bruit-ground {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 80px;
        transition: background 1s ease;
        border-radius: 0 0 20px 20px;
    }

    /* ── Route ── */
    .bruit-road {
        position: absolute;
        bottom: 18px;
        left: 0; right: 0;
        height: 22px;
        background: #555;
        opacity: 0.6;
    }
    .bruit-road::after {
        content: '';
        position: absolute;
        top: 50%; left: 0; right: 0;
        height: 3px;
        background: repeating-linear-gradient(90deg, #fff 0, #fff 24px, transparent 24px, transparent 48px);
        transform: translateY(-50%);
        opacity: 0.5;
    }

    /* ── Arbres ── */
    .bruit-tree {
        position: absolute;
        bottom: 40px;
        transition: filter 0.8s ease;
    }
    .bruit-tree-trunk {
        width: 6px;
        margin: 0 auto;
        background: #7a5c3a;
        border-radius: 2px;
    }
    .bruit-tree-top {
        border-radius: 50% 50% 40% 40%;
        margin: 0 auto;
        transition: background 0.8s ease;
    }

    /* ── Bâtiments ── */
    .bruit-building {
        position: absolute;
        bottom: 40px;
        transition: filter 0.5s ease;
    }
    .bruit-building-body {
        position: relative;
        border-radius: 4px 4px 0 0;
        transition: background 0.8s ease, filter 0.5s ease;
        overflow: hidden;
    }
    .bruit-building-body::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
    }
    .bruit-building-roof {
        margin: 0 auto;
        transition: background 0.8s ease;
    }
    .bruit-window-grid {
        position: absolute;
        inset: 6px 4px;
        display: grid;
        gap: 3px;
    }
    .bruit-win {
        border-radius: 2px;
        transition: background 0.6s ease, box-shadow 0.6s ease;
    }

    /* ── Fissures ── */
    .bruit-crack {
        position: absolute;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
        z-index: 5;
    }
    .bruit-crack.visible { opacity: 1; }

    /* ── Particules poussière/débris ── */
    .bruit-debris {
        position: absolute;
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
        z-index: 8;
    }
    @keyframes bruit-debris-fly {
        0%   { opacity: 0.8; transform: translate(0,0) rotate(0deg); }
        100% { opacity: 0;   transform: translate(var(--dx), var(--dy)) rotate(360deg); }
    }

    /* ── Éclair ── */
    .bruit-lightning {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255,240,100,0.35);
        border-radius: 20px;
        opacity: 0;
        pointer-events: none;
        z-index: 20;
        transition: opacity 0.05s;
    }

    /* ── Fumée ── */
    .bruit-smoke {
        position: absolute;
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
        z-index: 6;
        animation: bruit-smoke-rise 3s infinite ease-out;
    }
    @keyframes bruit-smoke-rise {
        0%   { opacity: 0;   transform: translateY(0)   scale(0.5); }
        30%  { opacity: 0.4; }
        100% { opacity: 0;   transform: translateY(-60px) scale(2); }
    }

    /* ── Tremblement ── */
    @keyframes bruit-shake {
        0%,100% { transform: translate(0,0); }
        20% { transform: translate(-3px, 1px); }
        40% { transform: translate(3px, -1px); }
        60% { transform: translate(-2px, 2px); }
        80% { transform: translate(2px, -2px); }
    }
    .bruit-shaking { animation: bruit-shake 0.3s ease infinite; }

    /* ── Éléments interactifs au-dessus du décor ── */
    .bruit-status-bar, .bruit-controls, .bruit-bottom-bar,
    .bruit-btn-start, .bruit-toggle-ctrl, .bruit-resize-handle {
        position: absolute;
        z-index: 10;
    }

    /* ── Panneau statut ── */
    .bruit-status-bar {
        pointer-events: none;
        position: absolute;
        top: 0; left: 0; right: 0;
        padding: 10px 14px 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 15;
        background: linear-gradient(to bottom, rgba(0,0,0,0.35), transparent);
    }
    .bruit-title {
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.85);
        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }
    .bruit-status-pill {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 3px 10px;
        border-radius: 20px;
        color: #fff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        transition: background 0.6s ease;
    }

    /* ── Bouton démarrer ── */
    .bruit-btn-start {
        position: absolute;
        bottom: 100px; left: 0; right: 0;
        margin: auto;
        width: 90px; height: 90px;
        border-radius: 50%;
        border: none;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #fff;
        background: rgba(30,80,160,0.85);
        backdrop-filter: blur(6px);
        cursor: pointer;
        z-index: 25;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: opacity 0.4s, transform 0.4s, background 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        line-height: 1.3;
    }
    .bruit-btn-start:hover { background: rgba(40,100,200,0.9); }
    .bruit-btn-start.is-listening { opacity: 0.12; transform: scale(0.85); pointer-events: none; }
    .bruit-btn-start.is-listening:hover { opacity: 0.45; pointer-events: auto; }

    /* ── Jauge en bas ── */
    .bruit-bottom-bar {
        pointer-events: none;
        position: absolute;
        bottom: 0; left: 0; right: 0;
        padding: 8px 14px 10px;
        z-index: 15;
        background: linear-gradient(to top, rgba(0,0,0,0.45), transparent);
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .bruit-gauge-track {
        height: 8px;
        border-radius: 4px;
        background: rgba(255,255,255,0.2);
        overflow: hidden;
    }
    .bruit-gauge-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.15s ease-out, background 0.4s ease;
        background: #4ade80;
        width: 0%;
    }
    .bruit-bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .bruit-no-mic {
        font-size: 10px;
        color: rgba(255,150,150,0.95);
        display: none;
    }

    /* ── Contrôles ── */
    .bruit-controls {
        pointer-events: none;
        position: absolute;
        bottom: 52px; left: 0; right: 0;
        padding: 0 14px;
        z-index: 15;
        display: flex;
        flex-direction: column;
        gap: 5px;
        max-height: 110px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        opacity: 1;
    }
    .bruit-controls.hidden { max-height: 0; opacity: 0; pointer-events: none; }
    .bruit-ctrl-row {
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255,255,255,0.75);
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    .bruit-ctrl-label { width: 70px; flex-shrink: 0; }
    .bruit-ctrl-slider {
        flex: 1;
        accent-color: #fff;
        height: 3px;
        cursor: pointer;
        background: rgba(255,255,255,0.25);
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
    }
    .bruit-ctrl-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px; height: 12px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .bruit-ctrl-slider::-moz-range-thumb {
        width: 12px; height: 12px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        border: none;
    }
    .bruit-ctrl-val { width: 26px; text-align: right; font-size: 9px; color: rgba(255,255,255,0.8); flex-shrink: 0; }

    /* ── Boutons action ── */
    .bruit-action-btns {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .bruit-icon-btn {
        background: rgba(255,255,255,0.15);
        border: none;
        border-radius: 6px;
        color: rgba(255,255,255,0.8);
        font-size: 13px;
        padding: 3px 6px;
        cursor: pointer;
        transition: background 0.2s;
        backdrop-filter: blur(4px);
    }
    .bruit-icon-btn:hover { background: rgba(255,255,255,0.28); }
    .bruit-icon-btn.muted { color: rgba(255,100,100,0.8); }
    .bruit-reset-btn {
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: rgba(255,255,255,0.12);
        border: none;
        border-radius: 6px;
        color: rgba(255,255,255,0.7);
        padding: 3px 8px;
        cursor: pointer;
        backdrop-filter: blur(4px);
        transition: background 0.2s;
    }
    .bruit-reset-btn:hover { background: rgba(255,255,255,0.25); }
    .bruit-alert-count-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .bruit-alert-label {
        font-size: 8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255,255,255,0.55);
    }
    .bruit-alert-num {
        font-size: 20px;
        font-weight: 900;
        color: #fca5a5;
        line-height: 1;
        text-shadow: 0 1px 6px rgba(239,68,68,0.5);
    }

    /* ── Toggle contrôles ── */
    .bruit-toggle-ctrl {
        position: absolute;
        top: 8px; left: 10px;
        background: rgba(255,255,255,0.12);
        border: none;
        border-radius: 6px;
        color: rgba(255,255,255,0.7);
        font-size: 11px;
        padding: 3px 7px;
        cursor: pointer;
        z-index: 20;
        backdrop-filter: blur(4px);
        transition: background 0.18s;
    }
    .bruit-toggle-ctrl:hover { background: rgba(255,255,255,0.22); }

    /* ── Voiture ── */
    .bruit-car {
        position: absolute;
        bottom: 46px;
        transition: opacity 0.5s;
    }
    @keyframes bruit-drive {
        from { left: -60px; }
        to   { left: 420px; }
    }
    .bruit-car.driving {
        animation: bruit-drive 6s linear infinite;
    }

    /* ── Oiseau ── */
    .bruit-bird {
        position: absolute;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.6s;
    }
    @keyframes bruit-fly {
        0%   { left: -30px; top: 60px; }
        50%  { top: 40px; }
        100% { left: 420px; top: 55px; }
    }
    .bruit-bird.flying {
        opacity: 1;
        animation: bruit-fly 7s linear infinite;
    }
    `;

    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById('bruit-widget-style')) {
        var st = document.createElement('style');
        st.id = 'bruit-widget-style';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Initialisation ────────────────────────────────────────────────────
    window.initBruitWidget = function (widget) {
        (function () {

            var contentZone = widget.querySelector('.widget-content');

            // ── Bâtiments SVG (dessinés via innerHTML) ──
            // On génère la scène en HTML pur
            contentZone.innerHTML =
                '<div class="bruit-outer">'
              + '<div class="bruit-resize-handle"></div>'

              // ── Décor visuel (dans le scale-wrap, ne reçoit pas les clics) ──
              + '<div class="bruit-scale-wrap">'
              +   '<div style="width:380px;height:460px;position:relative;pointer-events:none;">'
              +     '<div class="bruit-sky"></div>'
              +     '<div class="bruit-stars"></div>'
              +     '<div class="bruit-sun"></div>'
              +     '<div class="bruit-cloud" style="width:80px;height:28px;top:55px;left:30px;"></div>'
              +     '<div class="bruit-cloud" style="width:55px;height:20px;top:70px;left:80px;"></div>'
              +     '<div class="bruit-cloud" style="width:100px;height:32px;top:48px;right:40px;"></div>'
              +     '<div class="bruit-cloud" style="width:60px;height:22px;top:68px;right:80px;"></div>'
              +     '<div class="bruit-building" style="left:0px;width:70px;"><div class="bruit-building-roof" style="width:20px;height:16px;border-radius:50% 50% 0 0;margin-bottom:-1px;"></div><div class="bruit-building-body" style="height:130px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(4,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-building" style="left:55px;width:55px;"><div class="bruit-building-body" style="height:90px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-building" style="left:100px;width:80px;"><div class="bruit-building-roof" style="width:0;height:0;border-left:40px solid transparent;border-right:40px solid transparent;border-bottom:30px solid #888;margin-bottom:-1px;border-radius:0;background:none;"></div><div class="bruit-building-body" style="height:160px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(5,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-building" style="left:170px;width:60px;"><div class="bruit-building-body" style="height:110px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(4,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-building" style="left:220px;width:90px;"><div class="bruit-building-roof" style="width:16px;height:28px;border-radius:2px;margin-bottom:-1px;"></div><div class="bruit-building-body" style="height:145px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(5,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-building" style="right:40px;width:65px;"><div class="bruit-building-body" style="height:120px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(4,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-building" style="right:0px;width:50px;"><div class="bruit-building-body" style="height:100px;"><div class="bruit-window-grid" style="grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,1fr);"><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div><div class="bruit-win"></div></div></div></div>'
              +     '<div class="bruit-tree" style="left:50px;"><div class="bruit-tree-top" style="width:28px;height:36px;"></div><div class="bruit-tree-trunk" style="height:14px;"></div></div>'
              +     '<div class="bruit-tree" style="left:340px;"><div class="bruit-tree-top" style="width:24px;height:30px;"></div><div class="bruit-tree-trunk" style="height:12px;"></div></div>'
              +     '<div class="bruit-tree" style="left:310px;"><div class="bruit-tree-top" style="width:18px;height:24px;"></div><div class="bruit-tree-trunk" style="height:10px;"></div></div>'
              +     '<svg class="bruit-crack" style="left:105px;bottom:100px;width:30px;height:60px;" viewBox="0 0 30 60"><polyline points="15,0 10,20 18,22 8,45 14,47 5,60" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
              +     '<svg class="bruit-crack" style="left:230px;bottom:120px;width:24px;height:50px;" viewBox="0 0 24 50"><polyline points="12,0 8,18 16,20 6,40 13,42 4,50" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
              +     '<svg class="bruit-crack" style="left:160px;bottom:90px;width:20px;height:40px;" viewBox="0 0 20 40"><polyline points="10,0 6,14 14,16 5,30 11,32 3,40" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'
              +     '<div class="bruit-smoke" style="width:24px;height:24px;left:170px;bottom:190px;background:rgba(120,120,120,0.4);animation-delay:0s;"></div>'
              +     '<div class="bruit-smoke" style="width:18px;height:18px;left:180px;bottom:185px;background:rgba(100,100,100,0.3);animation-delay:1s;"></div>'
              +     '<div class="bruit-smoke" style="width:30px;height:30px;left:230px;bottom:175px;background:rgba(130,130,130,0.35);animation-delay:1.5s;"></div>'
              +     '<div class="bruit-car">🚗</div>'
              +     '<div class="bruit-bird">🐦</div>'
              +     '<div class="bruit-lightning"></div>'
              +   '</div>'
              + '</div>'

              // ── Éléments interactifs (hors scale-wrap, positionnés sur bruit-outer) ──
              + '<div class="bruit-status-bar">'
              +   '<div class="bruit-title">🏙️ Ville du Silence</div>'
              +   '<div class="bruit-status-pill">Calme</div>'
              + '</div>'
              + '<div class="bruit-controls">'
              +   '<div class="bruit-ctrl-row"><span class="bruit-ctrl-label">Sensibilité</span><input type="range" class="bruit-ctrl-slider bruit-sens-sl" min="0.1" max="5" step="0.1" value="1.5"><span class="bruit-ctrl-val bruit-sens-val">1.5</span></div>'
              +   '<div class="bruit-ctrl-row"><span class="bruit-ctrl-label">Seuil alerte</span><input type="range" class="bruit-ctrl-slider bruit-seuil-sl" min="10" max="100" step="5" value="70"><span class="bruit-ctrl-val bruit-seuil-val">70%</span></div>'
              +   '<div class="bruit-ctrl-row"><span class="bruit-ctrl-label">Lissage</span><input type="range" class="bruit-ctrl-slider bruit-smooth-sl" min="0" max="10" step="1" value="4"><span class="bruit-ctrl-val bruit-smooth-val">4</span></div>'
              + '</div>'
              + '<div class="bruit-bottom-bar">'
              +   '<div class="bruit-gauge-track"><div class="bruit-gauge-fill"></div></div>'
              +   '<div class="bruit-bottom-row">'
              +     '<div class="bruit-alert-count-wrap"><span class="bruit-alert-label">Alertes&nbsp;</span><span class="bruit-alert-num">0</span></div>'
              +     '<div class="bruit-action-btns">'
              +       '<button class="bruit-icon-btn bruit-sound-btn" title="Son on/off">🔊</button>'
              +       '<button class="bruit-reset-btn">Reset</button>'
              +     '</div>'
              +   '</div>'
              +   '<div class="bruit-no-mic">⚠️ Microphone refusé</div>'
              + '</div>'
              + '<button class="bruit-btn-start"><span class="bruit-btn-text">Lancer<br>l\'analyse</span></button>'
              + '<button class="bruit-toggle-ctrl" title="Contrôles">⚙️</button>'
              + '</div>';

            // ── Refs DOM ──
            var outer        = widget.querySelector('.bruit-outer');
            var scaleWrap    = widget.querySelector('.bruit-scale-wrap');
            var sky          = widget.querySelector('.bruit-sky');
            var sun          = widget.querySelector('.bruit-sun');
            var starsEl      = widget.querySelector('.bruit-stars');
            var clouds       = widget.querySelectorAll('.bruit-cloud');
            var buildings    = widget.querySelectorAll('.bruit-building-body');
            var roofs        = widget.querySelectorAll('.bruit-building-roof');
            var windows      = widget.querySelectorAll('.bruit-win');
            var treeTops     = widget.querySelectorAll('.bruit-tree-top');
            var treeEls      = widget.querySelectorAll('.bruit-tree');
            var ground       = widget.querySelector('.bruit-ground');
            var cracks       = widget.querySelectorAll('.bruit-crack');
            var smokes       = widget.querySelectorAll('.bruit-smoke');
            var lightning    = widget.querySelector('.bruit-lightning');
            var car          = widget.querySelector('.bruit-car');
            var bird         = widget.querySelector('.bruit-bird');
            var statusPill   = widget.querySelector('.bruit-status-pill');
            var gaugeFill    = widget.querySelector('.bruit-gauge-fill');
            var alertNum     = widget.querySelector('.bruit-alert-num');
            var soundBtn     = widget.querySelector('.bruit-sound-btn');
            var resetBtn     = widget.querySelector('.bruit-reset-btn');
            var noMicEl      = widget.querySelector('.bruit-no-mic');
            var btnStart     = widget.querySelector('.bruit-btn-start');
            var btnText      = widget.querySelector('.bruit-btn-text');
            var toggleCtrl   = widget.querySelector('.bruit-toggle-ctrl');
            var controlsEl   = widget.querySelector('.bruit-controls');
            var sensSlider   = widget.querySelector('.bruit-sens-sl');
            var seuilSlider  = widget.querySelector('.bruit-seuil-sl');
            var smoothSlider = widget.querySelector('.bruit-smooth-sl');
            var sensValEl    = widget.querySelector('.bruit-sens-val');
            var seuilValEl   = widget.querySelector('.bruit-seuil-val');
            var smoothValEl  = widget.querySelector('.bruit-smooth-val');
            var scene        = scaleWrap.querySelector('div');

            // ── Générer étoiles ──
            for (var s = 0; s < 28; s++) {
                var star = document.createElement('div');
                star.className = 'bruit-star';
                var sz = 1 + Math.random() * 2;
                star.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + (Math.random()*380) + 'px;top:' + (Math.random()*140) + 'px;animation-delay:' + (Math.random()*2) + 's;animation-duration:' + (1.5+Math.random()*2) + 's;';
                starsEl.appendChild(star);
            }
            // ── Resize proportionnel ──
            var REF_W = 380, REF_H = 460, RATIO = REF_H / REF_W;
            function rescale() {
                var ow = outer.offsetWidth || REF_W;
                var s  = ow / REF_W;
                outer.style.height        = Math.round(ow * RATIO) + 'px';
                scaleWrap.style.width     = REF_W + 'px';
                scaleWrap.style.height    = REF_H + 'px';
                scaleWrap.style.transform = 'scale(' + s + ')';
            }
            var resizeHandle = outer.querySelector('.bruit-resize-handle');
            resizeHandle.addEventListener('mousedown', function(e) {
                e.preventDefault(); e.stopPropagation();
                var startX = e.clientX, startW = outer.offsetWidth;
                function onMove(ev) { outer.style.width = Math.max(240, startW + (ev.clientX - startX)) + 'px'; rescale(); }
                function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); if (typeof saveBoard === 'function') saveBoard(); }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
            resizeHandle.addEventListener('touchstart', function(e) {
                e.preventDefault(); e.stopPropagation();
                var startX = e.touches[0].clientX, startW = outer.offsetWidth;
                function onMove(ev) { outer.style.width = Math.max(240, startW + (ev.touches[0].clientX - startX)) + 'px'; rescale(); }
                function onEnd() { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); if (typeof saveBoard === 'function') saveBoard(); }
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            }, { passive: false });
            rescale();

            // ── État ──
            var isListening      = false;
            var isMuted          = false;
            var alertsCount      = 0;
            var canTrigger       = true;
            var canPlaySound     = true;
            var smoothedLevel    = 0;
            var sensitivity      = 1.5;
            var threshold        = 70;
            var smoothingStrength = 4;
            var sampleBuffer     = [];
            var sustainFrames    = 0;
            var sustainRequired  = 0;
            var currentState     = -1; // force premier rendu
            var lightningTimer   = null;

            // ── États visuels ──
            // 0 = nuit calme, 1 = jour normal, 2 = agité, 3 = orage/chaos
            var STATES = [
                {
                    label: '😴 Silence parfait', pill: '#3b82f6',
                    sky: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 60%, #2d5986 100%)',
                    sun: { bg: '#fffde0', shadow: '0 0 20px 8px rgba(255,250,200,0.5)', size: '28px', top: '22px', right: '60px', opacity: 1 }, // lune
                    starsOpacity: 1,
                    cloudColor: 'rgba(30,60,100,0.5)',
                    buildingBg: '#1e293b', roofBg: '#1e293b',
                    winOn: '#fffab0', winOff: '#0f172a', winOnRatio: 0.3,
                    treeBg: '#166534',
                    groundBg: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
                    cracksVisible: false, smokesVisible: false,
                    carDriving: false, birdFlying: false,
                    shaking: false
                },
                {
                    label: '🌤️ Calme', pill: '#22c55e',
                    sky: 'linear-gradient(180deg, #bfdbfe 0%, #93c5fd 40%, #dbeafe 100%)',
                    sun: { bg: '#fde68a', shadow: '0 0 30px 12px rgba(253,230,138,0.6)', size: '42px', top: '18px', right: '28px', opacity: 1 },
                    starsOpacity: 0,
                    cloudColor: 'rgba(255,255,255,0.9)',
                    buildingBg: '#94a3b8', roofBg: '#64748b',
                    winOn: '#fde68a', winOff: '#cbd5e1', winOnRatio: 0.5,
                    treeBg: '#16a34a',
                    groundBg: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
                    cracksVisible: false, smokesVisible: false,
                    carDriving: true, birdFlying: true,
                    shaking: false
                },
                {
                    label: '⚡ Agité', pill: '#f59e0b',
                    sky: 'linear-gradient(180deg, #78350f 0%, #92400e 35%, #b45309 70%, #d97706 100%)',
                    sun: { bg: '#ef4444', shadow: '0 0 25px 10px rgba(239,68,68,0.4)', size: '36px', top: '20px', right: '32px', opacity: 0.85 },
                    starsOpacity: 0,
                    cloudColor: 'rgba(80,40,10,0.7)',
                    buildingBg: '#78350f', roofBg: '#57250a',
                    winOn: '#fbbf24', winOff: '#451a03', winOnRatio: 0.7,
                    treeBg: '#854d0e',
                    groundBg: 'linear-gradient(180deg, #713f12 0%, #854d0e 100%)',
                    cracksVisible: true, smokesVisible: true,
                    carDriving: false, birdFlying: false,
                    shaking: false
                },
                {
                    label: '🌩️ DANGER !', pill: '#ef4444',
                    sky: 'linear-gradient(180deg, #111 0%, #1c1917 40%, #292524 100%)',
                    sun: { bg: '#dc2626', shadow: '0 0 20px 8px rgba(220,38,38,0.5)', size: '32px', top: '22px', right: '36px', opacity: 0.6 },
                    starsOpacity: 0,
                    cloudColor: 'rgba(30,20,20,0.85)',
                    buildingBg: '#292524', roofBg: '#1c1917',
                    winOn: '#fca5a5', winOff: '#0c0a09', winOnRatio: 0.85,
                    treeBg: '#422006',
                    groundBg: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)',
                    cracksVisible: true, smokesVisible: true,
                    carDriving: false, birdFlying: false,
                    shaking: true
                }
            ];

            function applyState(idx) {
                if (idx === currentState) return;
                currentState = idx;
                var st = STATES[idx];

                sky.style.background = st.sky;
                starsEl.style.opacity = st.starsOpacity;

                // Soleil / lune
                sun.style.cssText = 'width:' + st.sun.size + ';height:' + st.sun.size + ';top:' + st.sun.top + ';right:' + st.sun.right
                    + ';background:' + st.sun.bg + ';box-shadow:' + st.sun.shadow
                    + ';opacity:' + st.sun.opacity + ';border-radius:50%;position:absolute;transition:all 1s ease;';

                clouds.forEach(function(c) { c.style.background = st.cloudColor; });

                buildings.forEach(function(b) { b.style.background = st.buildingBg; });
                roofs.forEach(function(r) {
                    if (r.style.border) return; // triangle SVG border trick
                    r.style.background = st.roofBg;
                });
                treeTops.forEach(function(t) { t.style.background = st.treeBg; });

                // Fenêtres
                windows.forEach(function(w, i) {
                    var on = Math.random() < st.winOnRatio;
                    w.style.background = on ? st.winOn : st.winOff;
                    w.style.boxShadow  = on ? '0 0 4px ' + st.winOn : 'none';
                });

                // Sol
                ground.style.background = st.groundBg;

                // Fissures
                cracks.forEach(function(c) { c.classList.toggle('visible', st.cracksVisible); });

                // Fumée
                smokes.forEach(function(s) { s.style.opacity = st.smokesVisible ? '1' : '0'; });

                // Pill statut
                statusPill.textContent = st.label;
                statusPill.style.background = st.pill;

                // Voiture / oiseau
                car.classList.toggle('driving', st.carDriving);
                bird.classList.toggle('flying', st.birdFlying);

                // Tremblement
                scene.classList.toggle('bruit-shaking', st.shaking);

                // Éclairs en mode danger
                if (lightningTimer) clearInterval(lightningTimer);
                if (idx === 3) {
                    lightningTimer = setInterval(function() {
                        lightning.style.opacity = '1';
                        setTimeout(function() { lightning.style.opacity = '0'; }, 80);
                    }, 1800 + Math.random() * 2000);
                } else {
                    lightning.style.opacity = '0';
                }
            }

            // Appliquer état initial (nuit calme)
            // On applique manuellement les styles sans déclencher currentState
            currentState = -1;
            applyState(0);

            // ── Lissage ──
            function updateSmoothingParams() {
                var bufSize = smoothingStrength === 0 ? 1 : Math.round(2 + smoothingStrength * 1.8);
                sustainRequired = smoothingStrength === 0 ? 0 : Math.round(smoothingStrength * 1.4);
                if (sampleBuffer.length > bufSize) sampleBuffer = sampleBuffer.slice(-bufSize);
                return bufSize;
            }

            // ── Audio ──
            var audioCtx = null, analyser = null, scriptProcessor = null, micStream = null;

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
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(660, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 0.5);
                setTimeout(function() { canPlaySound = true; }, 2000);
            }

            function render(value) {
                var raw = Math.min(value * sensitivity, 100);

                if (smoothingStrength === 0) {
                    smoothedLevel += (raw - smoothedLevel) * 0.15;
                } else {
                    var bufSize = updateSmoothingParams();
                    sampleBuffer.push(raw);
                    if (sampleBuffer.length > bufSize) sampleBuffer.shift();
                    var sorted = sampleBuffer.slice().sort(function(a, b){ return a - b; });
                    var pctIdx = Math.floor(sorted.length * Math.max(0.2, 0.8 - smoothingStrength * 0.06));
                    var ambientLevel = sorted[pctIdx] || 0;
                    var upAlpha   = Math.max(0.03, 0.12 - smoothingStrength * 0.008);
                    var downAlpha = Math.max(0.01, 0.06 - smoothingStrength * 0.004);
                    var alpha = ambientLevel > smoothedLevel ? upAlpha : downAlpha;
                    smoothedLevel += (ambientLevel - smoothedLevel) * alpha;
                }

                // Jauge
                var gaugeColor = smoothedLevel < 40 ? '#4ade80'
                               : smoothedLevel < threshold * 0.75 ? '#facc15'
                               : smoothedLevel < threshold ? '#f97316'
                               : '#ef4444';
                gaugeFill.style.width = smoothedLevel + '%';
                gaugeFill.style.background = gaugeColor;

                // État visuel selon niveau
                var stateIdx;
                if (!isListening) {
                    stateIdx = 0;
                } else if (smoothedLevel < threshold * 0.45) {
                    stateIdx = 1; // calme
                } else if (smoothedLevel < threshold) {
                    stateIdx = 2; // agité
                } else {
                    stateIdx = 3; // danger
                }
                applyState(stateIdx);

                // Alerte
                if (smoothedLevel > threshold) {
                    sustainFrames++;
                    if (canTrigger && sustainFrames >= sustainRequired) {
                        alertsCount++;
                        alertNum.textContent = alertsCount;
                        playAlert();
                        canTrigger = false;
                        // Rafraîchir les fenêtres allumées pour un effet "panique"
                        windows.forEach(function(w) {
                            var on = Math.random() < 0.9;
                            w.style.background = on ? STATES[3].winOn : STATES[3].winOff;
                            w.style.boxShadow  = on ? '0 0 4px ' + STATES[3].winOn : 'none';
                        });
                    }
                } else {
                    sustainFrames = 0;
                    if (smoothedLevel < threshold - 5) canTrigger = true;
                }
            }

            function startMic() {
                // Feedback immédiat : changer le texte du bouton pour confirmer que le clic est reçu
                btnText.innerHTML = '⏳';

                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    btnText.innerHTML = "Lancer<br>l'analyse";
                    noMicEl.style.display = 'block';
                    noMicEl.textContent = '⚠️ Micro indisponible (HTTPS requis ?)';
                    console.warn('[Bruit] navigator.mediaDevices non disponible');
                    return;
                }

                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(function(stream) {
                        micStream  = stream;
                        audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
                        analyser   = audioCtx.createAnalyser();
                        analyser.fftSize = 256;
                        var source = audioCtx.createMediaStreamSource(stream);
                        scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
                        source.connect(analyser);
                        analyser.connect(scriptProcessor);
                        scriptProcessor.connect(audioCtx.destination);
                        scriptProcessor.onaudioprocess = function() { render(getFrequencyAvg()); };
                        isListening = true;
                        btnStart.classList.add('is-listening');
                        btnText.innerHTML = 'Arrêter';
                        noMicEl.style.display = 'none';
                        currentState = -1; // forcer re-rendu
                        setTimeout(function() { playAlert(); }, 100);
                    })
                    .catch(function(err) {
                        noMicEl.style.display = 'block';
                        console.warn('[Bruit] Microphone refusé :', err);
                    });
            }

            function stopMic() {
                if (scriptProcessor) scriptProcessor.onaudioprocess = null;
                if (micStream) { micStream.getTracks().forEach(function(t){ t.stop(); }); micStream = null; }
                if (audioCtx)  { audioCtx.close(); audioCtx = null; }
                analyser = null; scriptProcessor = null;
                isListening = false;
                smoothedLevel = 0; sampleBuffer = []; sustainFrames = 0;
                gaugeFill.style.width = '0%';
                if (lightningTimer) { clearInterval(lightningTimer); lightningTimer = null; }
                lightning.style.opacity = '0';
                scene.classList.remove('bruit-shaking');
                btnStart.classList.remove('is-listening');
                btnText.innerHTML = "Lancer<br>l'analyse";
                currentState = -1;
                applyState(0);
            }

            // ── Boutons ──
            btnStart.addEventListener('pointerdown', function(e) { e.stopPropagation(); });
            btnStart.addEventListener('pointerup', function(e) {
                e.stopPropagation();
                if (!isListening) startMic(); else stopMic();
            });
            btnStart.addEventListener('click', function(e) { e.stopPropagation(); });            soundBtn.addEventListener('pointerdown', function(e) { e.stopPropagation(); });
            soundBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                isMuted = !isMuted;
                soundBtn.textContent = isMuted ? '🔇' : '🔊';
                soundBtn.classList.toggle('muted', isMuted);
            });
            resetBtn.addEventListener('pointerdown', function(e) { e.stopPropagation(); });
            resetBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                alertsCount = 0; alertNum.textContent = '0'; canTrigger = true;
            });
            sensSlider.addEventListener('input', function() {
                sensitivity = parseFloat(this.value);
                sensValEl.textContent = parseFloat(this.value).toFixed(1);
            });
            seuilSlider.addEventListener('input', function() {
                threshold = parseInt(this.value);
                seuilValEl.textContent = threshold + '%';
            });
            smoothSlider.addEventListener('input', function() {
                smoothingStrength = parseInt(this.value);
                smoothValEl.textContent = smoothingStrength;
                sampleBuffer = []; sustainFrames = 0;
            });

            // ── Toggle contrôles ──
            var controlsVisible = true;
            toggleCtrl.addEventListener('pointerdown', function(e) { e.stopPropagation(); });
            toggleCtrl.addEventListener('click', function(e) {
                e.stopPropagation();
                controlsVisible = !controlsVisible;
                controlsEl.classList.toggle('hidden', !controlsVisible);
                toggleCtrl.style.color = controlsVisible ? 'rgba(255,255,255,0.7)' : '#60a5fa';
            });

            // ── Propagation ──
            outer.addEventListener('mousedown', function(e) {
                if (e.target.closest('button, input, .bruit-resize-handle')) e.stopPropagation();
            });
            outer.addEventListener('touchstart', function(e) {
                if (e.target.closest('button, input, .bruit-resize-handle')) e.stopPropagation();
            }, { passive: true });
            outer.addEventListener('mousemove', function(e) {
                if (e.target.closest('button, input')) return;
                if (e.target.closest('.bruit-resize-handle')) { outer.style.cursor = 'nwse-resize'; return; }
                outer.style.cursor = 'move';
            });
            outer.addEventListener('mouseleave', function() { outer.style.cursor = ''; });

            // ── Nettoyage ──
            var obs = new MutationObserver(function() {
                if (!document.contains(widget)) { stopMic(); obs.disconnect(); }
            });
            obs.observe(document.body, { childList: true, subtree: true });

        })();
    };

    // ── Hook dans createWidget ────────────────────────────────────────────
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function(type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'bruit') initBruitWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function(type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'bruit') initBruitWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
