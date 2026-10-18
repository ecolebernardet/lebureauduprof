// =========================================================================
// WIDGET MINUTEUR & CHRONOMÈTRE — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'minuteur'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widgets_minuteur_chrono.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('minuteur');closeMainMenu()">
//          <span class="mm-ico">⏱️</span>Minuteur & Chrono
//      </div>
// =========================================================================

(function () {

    // ── Police arrondie partagée avec les autres widgets (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── CSS injecté une seule fois ────────────────────────────────────────
    // Même design que Tirage / Équipes / Liste de classe : cadre coloré
    // arrondi, pastilles « verre » dans l'en-tête, carte blanche arrondie.
    const STYLE = `
    /* ── Cadre coloré (porte la taille, la couleur et la poignée resize) ── */
    .widget[data-type="minuteur"] .mc-outer {
        --mc-ink:   #14202E;
        --mc-glass: rgba(255,255,255,0.62);
        --mc-bg:    #F6D86A;
        --mc-op:    #B9770E;

        position: relative;
        width:  500px;
        height: 400px;
        min-width:  240px;
        min-height: 200px;
        overflow: hidden;
        resize: both;
        box-sizing: border-box;
        border-radius: 24px;
        background-color: var(--mc-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--mc-ink);
        transition: background-color .3s;
    }
    .widget[data-type="minuteur"] .mc-outer button,
    .widget[data-type="minuteur"] .mc-outer input,
    .widget[data-type="minuteur"] .mc-outer label,
    .widget[data-type="minuteur"] .mc-outer select {
        cursor: pointer;
        font-family: inherit;
    }
    /* Contour au survol */
    .widget[data-type="minuteur"]:hover .mc-outer,
    .widget[data-type="minuteur"]:focus-within .mc-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }
    .widget[data-type="minuteur"] .mc-outer::-webkit-resizer {
        background-color: transparent;
        background-image: linear-gradient(135deg,
            transparent 50%, rgba(20,32,46,0.45) 50%, rgba(20,32,46,0.45) 60%,
            transparent 60%, transparent 70%,
            rgba(20,32,46,0.45) 70%, rgba(20,32,46,0.45) 80%, transparent 80%);
    }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="minuteur"] .mc-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
    }

    /* ── Carte blanche (taille de référence 320x260) ── */
    .mc-widget {
        width:  320px;
        min-height: 260px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 14px;
        gap: 9px;
        user-select: none;
        box-sizing: border-box;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        color: var(--mc-ink);
    }

    /* ── Onglets (sélecteur segmenté) ── */
    .mc-tabs {
        display: flex;
        gap: 3px;
        background: rgba(20,32,46,0.07);
        border-radius: 999px;
        padding: 3px;
        width: 100%;
        box-sizing: border-box;
    }
    .mc-tab {
        flex: 1; padding: 5px 0; border: none;
        border-radius: 999px; background: transparent;
        font-size: 12px; font-weight: 700; color: rgba(20,32,46,0.6);
        cursor: pointer;
        transition: background 0.18s, color 0.18s;
    }
    .mc-tab:hover { background: rgba(20,32,46,0.06); }
    .mc-tab.active {
        background: var(--mc-op); color: #fff;
        box-shadow: 0 2px 0 rgba(0,0,0,0.2);
    }

    /* ── Panneaux ── */
    .mc-panel { display: none; flex-direction: column; align-items: center; gap: 9px; width: 100%; }
    .mc-panel.active { display: flex; }

    /* ── Affichage chiffres ── */
    .mc-display {
        font-size: 50px; font-weight: 700; letter-spacing: 1px;
        color: var(--mc-ink); font-variant-numeric: tabular-nums;
        line-height: 1; padding: 4px 0; transition: color 0.3s;
    }
    .mc-display.mc-running  { color: #23915A; }
    .mc-display.mc-paused   { color: #B9770E; }
    .mc-display.mc-finished { color: #C0392B; animation: mc-blink 0.6s infinite alternate; }

    @keyframes mc-blink { from { opacity:1; } to { opacity:0.3; } }

    /* ── Barre de progression ── */
    .mc-progress-wrap { width:100%; height:9px; background:rgba(20,32,46,0.08); border-radius:99px; overflow:hidden; }
    .mc-progress-bar {
        height:100%; width:100%;
        background: linear-gradient(90deg, var(--mc-op), #23915A);
        border-radius:99px;
        transition: width 0.35s linear, background 0.3s;
    }
    .mc-progress-bar.mc-low  { background: linear-gradient(90deg, #E08E0B, #C0392B); }
    .mc-progress-bar.mc-done { background: #C0392B; width:100% !important; }

    /* ── Réglage H:M:S ── */
    .mc-inputs { display:flex; align-items:center; gap:6px; }
    .mc-input-group { display:flex; flex-direction:column; align-items:center; gap:1px; }
    .mc-input-group label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:rgba(20,32,46,0.45); }
    .mc-num-btn {
        background:none; border:none; font-size:13px; color:rgba(20,32,46,0.35);
        cursor:pointer; line-height:1; padding:1px 8px; border-radius:999px;
        transition:color 0.15s, background 0.15s;
    }
    .mc-num-btn:hover { color:var(--mc-op); background:rgba(20,32,46,0.06); }
    .mc-num-input {
        width:52px; font-size:26px; font-weight:700; text-align:center; font-family:inherit;
        border:1.5px solid rgba(20,32,46,0.12); border-radius:12px; padding:3px 0; color:var(--mc-ink);
        background:#F4F6F9; outline:none; font-variant-numeric:tabular-nums;
        -moz-appearance:textfield; appearance:textfield;
    }
    .mc-num-input::-webkit-outer-spin-button,
    .mc-num-input::-webkit-inner-spin-button { -webkit-appearance:none; }
    .mc-num-input:focus { border-color:var(--mc-op); background:#fff; }
    .mc-sep { font-size:26px; font-weight:700; color:rgba(20,32,46,0.25); line-height:1; }

    /* ── Boutons ── */
    .mc-btns { display:flex; gap:7px; }
    .mc-btn {
        padding:7px 18px; border:none; border-radius:999px;
        font-size:12px; font-weight:700; cursor:pointer;
        box-shadow: 0 3px 0 rgba(0,0,0,0.22);
        transition:filter 0.15s, transform 0.1s, box-shadow 0.1s;
    }
    .mc-btn:hover  { filter:brightness(1.08); }
    .mc-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,0.22); }
    .mc-btn-start  { background:#23915A; color:#fff; }
    .mc-btn-pause  { background:#D98A10; color:#fff; }
    .mc-btn-reset  { background:#F4F6F9; color:var(--mc-ink); box-shadow:0 2px 0 rgba(20,32,46,0.12); }
    .mc-btn-lap    { background:var(--mc-op); color:#fff; }

    /* ── Son ── */
    .mc-sound-row { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:rgba(20,32,46,0.6); }
    .mc-sound-row input { cursor:pointer; accent-color:var(--mc-op); }

    /* ── Tours chrono ── */
    .mc-laps { width:100%; max-height:90px; overflow-y:auto; display:flex; flex-direction:column; gap:3px; scrollbar-width:thin; }
    .mc-lap-row {
        display:flex; justify-content:space-between; align-items:center;
        font-size:12px; font-weight:600; padding:3px 8px; border-radius:999px; background:#F4F6F9; color:var(--mc-ink);
        font-variant-numeric:tabular-nums;
    }
    .mc-lap-row:nth-child(odd) { background:rgba(20,32,46,0.06); }
    .mc-lap-n     { font-weight:700; color:var(--mc-op); min-width:32px; }
    .mc-lap-split { color:rgba(20,32,46,0.45); font-size:11px; }

    /* ── Minuteur VISUEL (type Time Timer) ── */
    .mc-tt { display:flex; align-items:center; gap:12px; width:100%; }
    .mc-tt-dial { width:156px; height:156px; flex-shrink:0; touch-action:none; cursor:grab; }
    .mc-tt-dial.mc-tt-locked { cursor:default; }
    .mc-tt-dial.mc-tt-done .mc-tt-face { animation: mc-tt-flash 0.5s infinite alternate; }
    @keyframes mc-tt-flash { from { fill:#fff; } to { fill:#ffd6d6; } }
    .mc-tt-side { display:flex; flex-direction:column; gap:6px; flex:1; min-width:0; }
    .mc-tt-presets { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
    .mc-tt-preset {
        height:23px; border:none; border-radius:999px; background:#F4F6F9;
        font-size:11px; font-weight:700; color:var(--mc-ink); cursor:pointer; padding:0;
        box-shadow: inset 0 0 0 1.5px rgba(20,32,46,0.08);
        transition:background 0.15s, color 0.15s;
    }
    .mc-tt-preset:hover { background:rgba(20,32,46,0.1); }
    .mc-tt-preset.active { background:var(--mc-op); color:#fff; box-shadow:none; }
    .mc-tt-preset:disabled { opacity:0.4; cursor:default; }
    .mc-tt-colors { display:flex; justify-content:space-between; }
    .mc-tt-color {
        width:18px; height:18px; border-radius:50%; border:2px solid #fff;
        box-shadow:0 0 0 1px rgba(20,32,46,0.2); cursor:pointer; padding:0;
    }
    .mc-tt-color.active { box-shadow:0 0 0 2px var(--mc-ink); }
    .mc-tt-opts { display:flex; gap:4px; }
    .mc-tt-opt {
        flex:1; height:23px; border:none; border-radius:999px; background:#F4F6F9;
        font-size:12px; cursor:pointer; padding:0; opacity:0.45; transition:opacity 0.15s, box-shadow 0.15s;
    }
    .mc-tt-opt.on { opacity:1; box-shadow: inset 0 0 0 1.5px var(--mc-op); }
    .mc-tt-side .mc-btns { gap:4px; }
    .mc-tt-side .mc-btn { flex:1; padding:6px 0; font-size:11px; }
    .mc-tt-side .mc-btn-hide { flex:0 0 32px; background:#F4F6F9; color:var(--mc-ink); box-shadow:0 2px 0 rgba(20,32,46,0.12); }

    /* Durée personnalisée */
    .mc-tt-custom { display:flex; align-items:center; justify-content:center; gap:4px; font-size:11px; font-weight:700; color:rgba(20,32,46,0.5); }
    .mc-tt-custom input {
        width:40px; height:23px; box-sizing:border-box; padding:0;
        font-size:13px; font-weight:700; text-align:center; color:var(--mc-ink); background:#F4F6F9;
        border:1.5px solid rgba(20,32,46,0.1); border-radius:999px; outline:none;
        font-variant-numeric:tabular-nums; -moz-appearance:textfield; appearance:textfield;
    }
    .mc-tt-custom input::-webkit-outer-spin-button,
    .mc-tt-custom input::-webkit-inner-spin-button { -webkit-appearance:none; }
    .mc-tt-custom input:focus { border-color:var(--mc-op); background:#fff; }
    .mc-tt-custom input:disabled { opacity:0.4; }

    /* Mode épuré : réglages masqués, cadran agrandi */
    .mc-widget.mc-tt-clean { position:relative; justify-content:center; }
    .mc-widget.mc-tt-clean .mc-tabs,
    .mc-widget.mc-tt-clean .mc-tt-side { display:none; }
    .mc-widget.mc-tt-clean .mc-tt { justify-content:center; }
    .mc-widget.mc-tt-clean .mc-tt-dial { width:232px; height:232px; cursor:pointer; }
    .mc-tt-mini { display:none; position:absolute; top:10px; right:10px; flex-direction:column; gap:5px; }
    .mc-widget.mc-tt-clean .mc-tt-mini { display:flex; }
    .mc-tt-mini button {
        width:28px; height:28px; border:none; border-radius:50%; background:#F4F6F9;
        color:var(--mc-ink); font-size:13px; cursor:pointer; padding:0; opacity:0.6; transition:opacity 0.15s;
    }
    .mc-tt-mini button:hover { opacity:1; }
    `;

    if (!document.getElementById('mc-widget-style')) {
        const s = document.createElement('style');
        s.id = 'mc-widget-style';
        s.textContent = STYLE + `
    /* ── En-tête : deux pastilles « verre » (hors mise à l'échelle) ── */
    .widget[data-type="minuteur"] .mc-header {
        position: absolute; top: 12px; left: 12px; right: 12px;
        height: 40px;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        box-sizing: border-box; z-index: 3;
        pointer-events: none;            /* le fond reste déplaçable */
    }
    .widget[data-type="minuteur"] .mc-title,
    .widget[data-type="minuteur"] .mc-tools {
        display: flex; align-items: center; gap: 8px;
        background: var(--mc-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .widget[data-type="minuteur"] .mc-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px; font-weight: 700;
        white-space: nowrap; overflow: hidden; min-width: 0;
    }
    .widget[data-type="minuteur"] .mc-title span { overflow: hidden; text-overflow: ellipsis; }
    .widget[data-type="minuteur"] .mc-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--mc-op); }
    .widget[data-type="minuteur"] .mc-tools { padding: 4px 12px 4px 4px; gap: 2px; flex-shrink: 0; pointer-events: auto; }
    .widget[data-type="minuteur"] .mc-icon-btn {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: none; background: transparent;
        color: var(--mc-ink); padding: 0; transition: background .15s;
    }
    .widget[data-type="minuteur"] .mc-icon-btn svg { width: 18px; height: 18px; }
    .widget[data-type="minuteur"] .mc-icon-btn:hover,
    .widget[data-type="minuteur"] .mc-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .widget[data-type="minuteur"] .mc-hsep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }
    /* Cadre étroit : on masque le texte du titre */
    .widget[data-type="minuteur"] .mc-outer.mc-narrow .mc-title span { display: none; }
    .widget[data-type="minuteur"] .mc-outer.mc-narrow .mc-title { padding: 7px 10px; }

    /* ── Panneau « Couleur du cadre » ── */
    .widget[data-type="minuteur"] .mc-pop {
        display: none;
        position: absolute; top: 60px; right: 12px; z-index: 10;
        width: 250px; max-width: calc(100% - 24px);
        box-sizing: border-box;
        flex-direction: column; gap: 10px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        color: var(--mc-ink);
        cursor: default;
    }
    .widget[data-type="minuteur"] .mc-pop.show { display: flex; }
    .widget[data-type="minuteur"] .mc-pop-title { font-size: 13px; font-weight: 700; }
    .widget[data-type="minuteur"] .mc-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .widget[data-type="minuteur"] .mc-swatch {
        width: 28px; height: 28px; border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15); padding: 0;
    }
    .widget[data-type="minuteur"] .mc-swatch.is-on { border-color: var(--mc-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Plein écran du bouton vert (classe .mc-max) ──
       Marge à gauche pour laisser visibles les onglets des panneaux latéraux */
    .widget[data-type="minuteur"] .mc-outer.mc-max {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
        outline: none !important;
    }

    /* ── Téléphone : plein écran, hauteur réelle de l'écran ── */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget[data-type="minuteur"] .mc-outer.mc-max {
            height: 100dvh !important;
        }
    }`;
        document.head.appendChild(s);
    }

    // ── Taille des pastilles fenêtre (identique au Visualiseur / Tirage) ──
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

    // Injecter le CSS des boutons wf si pas déjà fait (partagé avec les autres widgets)
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

    // ── Couleurs du cadre (mêmes que Tirage / Équipes / Liste de classe) ──
    const MC_THEMES = {
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };
    const MC_DEFAULT_THEME = 'jaune';
    const MC_ICON_CLOCK   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2"/><path d="M10 2.5h4"/><path d="M12 2.5V6"/></svg>';
    const MC_ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';

    // ── Template ─────────────────────────────────────────────────────────
    if (!document.getElementById('template-minuteur')) {
        const tpl = document.createElement('template');
        tpl.id = 'template-minuteur';
        tpl.innerHTML = `
<div class="mc-outer">
  <div class="mc-scale-wrap">
  <div class="mc-widget">

    <div class="mc-tabs">
        <button class="mc-tab active" data-panel="min">&#x23F3; Minuteur</button>
        <button class="mc-tab"        data-panel="vis">&#x1F534; Timer</button>
        <button class="mc-tab"        data-panel="chr">&#x23F1; Chrono</button>
    </div>

    <!-- MINUTEUR -->
    <div class="mc-panel active" data-id="min">
        <div class="mc-inputs" data-role="setup">
            <div class="mc-input-group">
                <label>H</label>
                <button class="mc-num-btn" data-dir="up">&#9650;</button>
                <input  class="mc-num-input" type="number" value="0" min="0" max="23">
                <button class="mc-num-btn" data-dir="down">&#9660;</button>
            </div>
            <div class="mc-sep">:</div>
            <div class="mc-input-group">
                <label>Min</label>
                <button class="mc-num-btn" data-dir="up">&#9650;</button>
                <input  class="mc-num-input" type="number" value="5" min="0" max="59">
                <button class="mc-num-btn" data-dir="down">&#9660;</button>
            </div>
            <div class="mc-sep">:</div>
            <div class="mc-input-group">
                <label>Sec</label>
                <button class="mc-num-btn" data-dir="up">&#9650;</button>
                <input  class="mc-num-input" type="number" value="0" min="0" max="59">
                <button class="mc-num-btn" data-dir="down">&#9660;</button>
            </div>
        </div>
        <div class="mc-display" data-role="display" style="display:none;">00:05:00</div>
        <div class="mc-progress-wrap" data-role="progress" style="display:none;">
            <div class="mc-progress-bar" data-role="bar"></div>
        </div>
        <div class="mc-sound-row">
            <input type="checkbox" data-role="sound" checked>
            <label>Son de fin</label>
        </div>
        <div class="mc-btns">
            <button class="mc-btn mc-btn-start" data-role="start">&#9654; Demarrer</button>
            <button class="mc-btn mc-btn-reset" data-role="reset" style="display:none;">&#8635; Reset</button>
        </div>
    </div>

    <!-- MINUTEUR VISUEL (type Time Timer) -->
    <div class="mc-panel" data-id="vis">
        <div class="mc-tt">
            <svg class="mc-tt-dial" data-role="dial" viewBox="-100 -100 200 200">
                <title data-role="dialTitle">Faites glisser sur le cadran pour régler la durée</title>
                <circle class="mc-tt-face" r="97" fill="#fff" stroke="#d0d4da" stroke-width="3"/>
                <g data-role="ticks"></g>
                <path data-role="wedge" fill="#e74c3c" d=""/>
                <line data-role="hand" x1="0" y1="0" x2="0" y2="-70" stroke="#333" stroke-width="3" stroke-linecap="round"/>
                <circle r="25" fill="#fff" stroke="#d0d4da" stroke-width="2"/>
                <text data-role="center" x="0" y="5" text-anchor="middle"
                      font-size="13" font-weight="700" fill="#333"
                      style="font-variant-numeric:tabular-nums;">05:00</text>
            </svg>
            <div class="mc-tt-side">
                <div class="mc-tt-presets" data-role="presets">
                    <button class="mc-tt-preset" data-min="1">1'</button>
                    <button class="mc-tt-preset" data-min="2">2'</button>
                    <button class="mc-tt-preset active" data-min="5">5'</button>
                    <button class="mc-tt-preset" data-min="10">10'</button>
                    <button class="mc-tt-preset" data-min="15">15'</button>
                    <button class="mc-tt-preset" data-min="20">20'</button>
                    <button class="mc-tt-preset" data-min="30">30'</button>
                    <button class="mc-tt-preset" data-min="45">45'</button>
                    <button class="mc-tt-preset" data-min="60">60'</button>
                </div>
                <div class="mc-tt-custom" title="Durée personnalisée (jusqu'à 120 min)">
                    <input type="number" data-role="customMin" min="0" max="120" value="5">
                    <span>min</span>
                    <input type="number" data-role="customSec" min="0" max="59" value="00">
                    <span>s</span>
                </div>
                <div class="mc-tt-colors" data-role="colors">
                    <button class="mc-tt-color active" data-color="#e74c3c" style="background:#e74c3c" title="Rouge"></button>
                    <button class="mc-tt-color" data-color="#3b82f6" style="background:#3b82f6" title="Bleu"></button>
                    <button class="mc-tt-color" data-color="#22a55b" style="background:#22a55b" title="Vert"></button>
                    <button class="mc-tt-color" data-color="#f59e0b" style="background:#f59e0b" title="Orange"></button>
                    <button class="mc-tt-color" data-color="#8b5cf6" style="background:#8b5cf6" title="Violet"></button>
                </div>
                <div class="mc-tt-opts">
                    <button class="mc-tt-opt on" data-role="optSound" title="Son de fin">&#x1F514;</button>
                    <button class="mc-tt-opt on" data-role="optDigits" title="Afficher le temps restant au centre">&#x1F522;</button>
                    <button class="mc-tt-opt on" data-role="optLabels" title="Afficher les graduations chiffrées">&#x1F550;</button>
                </div>
                <div class="mc-btns">
                    <button class="mc-btn mc-btn-start" data-role="start">&#9654; Go</button>
                    <button class="mc-btn mc-btn-reset" data-role="reset" title="Remettre à zéro">&#8635;</button>
                    <button class="mc-btn mc-btn-hide" data-role="hide" title="Masquer les réglages">&#x1F441;</button>
                </div>
            </div>
        </div>
        <div class="mc-tt-mini">
            <button data-role="show" title="Afficher les réglages">&#9881;</button>
            <button data-role="miniReset" title="Remettre à zéro">&#8635;</button>
        </div>
    </div>

    <!-- CHRONOM&#200;TRE -->
    <div class="mc-panel" data-id="chr">
        <div class="mc-display" data-role="display">00:00.0</div>
        <div class="mc-btns">
            <button class="mc-btn mc-btn-start" data-role="start">&#9654; Demarrer</button>
            <button class="mc-btn mc-btn-lap"   data-role="lap"   style="display:none;">Tour</button>
            <button class="mc-btn mc-btn-reset" data-role="reset" style="display:none;">&#8635; Reset</button>
        </div>
        <div class="mc-laps" data-role="laps"></div>
    </div>

  </div>
  </div>
</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    window.initMinuteurWidget = function (widget) {

        // ── Le widget s'ouvre à 100px du bord gauche du board ──────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW = window.innerWidth;
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));

        const outer     = widget.querySelector('.mc-outer');
        const scaleWrap = widget.querySelector('.mc-scale-wrap');

        // ── En-tête : pastilles « verre » (titre / palette + boutons fenêtre) ──
        // (un ancien en-tête, venant d'une sauvegarde, est remplacé)
        outer.querySelectorAll('.mc-header').forEach(h => { if (!h.querySelector('.mc-tools')) h.remove(); });
        if (!outer.querySelector('.mc-header')) {
            const header = document.createElement('div');
            header.className = 'mc-header';
            header.innerHTML = `
                <div class="mc-title">${MC_ICON_CLOCK}<span>Minuteur &amp; Chrono</span></div>
                <div class="mc-tools">
                    <button class="mc-icon-btn mc-theme-btn" title="Couleur du cadre">${MC_ICON_PALETTE}</button>
                    <span class="mc-hsep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                    </div>
                </div>`;
            outer.insertBefore(header, outer.firstChild);
        }
        if (!outer.querySelector('.mc-pop')) {
            const pop = document.createElement('div');
            pop.className = 'mc-pop';
            pop.innerHTML = '<div class="mc-pop-title">Couleur du cadre</div><div class="mc-swatches">' +
                Object.keys(MC_THEMES).map(id =>
                    '<button class="mc-swatch" data-theme="' + id + '" title="' + MC_THEMES[id].name +
                    '" style="background:' + MC_THEMES[id].bg + '"></button>').join('') + '</div>';
            outer.appendChild(pop);
        }
        const HEADER_H = 58;   // 12 px de marge + 40 px de pastilles + 6 px d'écart
        const PAD      = 12;   // marge autour de la carte blanche

        // ── Couleur du cadre (mémorisée dans la sauvegarde du tableau) ──────
        const themeBtn = outer.querySelector('.mc-theme-btn');
        const themePop = outer.querySelector('.mc-pop');
        function applyTheme(id) {
            if (!MC_THEMES[id]) id = MC_DEFAULT_THEME;
            widget.dataset.mcTheme = id;
            outer.style.setProperty('--mc-bg', MC_THEMES[id].bg);
            outer.style.setProperty('--mc-op', MC_THEMES[id].op);
            outer.querySelectorAll('.mc-swatch').forEach(b => b.classList.toggle('is-on', b.dataset.theme === id));
        }
        widget._mcApplyTheme = applyTheme;
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = !themePop.classList.contains('show');
            themePop.classList.toggle('show', open);
            themeBtn.classList.toggle('is-on', open);
        });
        themePop.addEventListener('click', (e) => e.stopPropagation());
        outer.querySelectorAll('.mc-swatch').forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation();
            applyTheme(b.dataset.theme);
            if (typeof saveBoard === 'function') saveBoard();
        }));
        if (!widget._mcPopDocClose) {
            widget._mcPopDocClose = true;
            document.addEventListener('click', () => {
                widget.querySelectorAll('.mc-pop.show').forEach(p => p.classList.remove('show'));
                widget.querySelectorAll('.mc-theme-btn.is-on').forEach(b => b.classList.remove('is-on'));
            });
        }
        applyTheme(widget.dataset.mcTheme || MC_DEFAULT_THEME);

        // Nettoyer un éventuel état "réduit" resté d'une sauvegarde précédente
        widget.querySelectorAll('.mc-mini-bar').forEach(el => el.remove());
        widget.dataset.collapsed = '0';
        outer.style.display = '';

        // Dimensions de référence (taille native du template)
        const REF_W = 320;
        const REF_H = 260;

        // ── Scaling : adapte le contenu à la taille du container ─────────────
        function applyScale() {
            const fullW = outer.clientWidth  || (REF_W + 2 * PAD);
            const fullH = outer.clientHeight || (REF_H + HEADER_H + PAD);
            const ow = Math.max(1, fullW - 2 * PAD);
            const oh = Math.max(1, fullH - HEADER_H - PAD);
            const s  = Math.min(ow / REF_W, oh / REF_H);
            scaleWrap.style.width     = REF_W + 'px';
            scaleWrap.style.height    = REF_H + 'px';
            scaleWrap.style.transform = 'scale(' + s + ')';
            scaleWrap.style.left      = (PAD + (ow - REF_W * s) / 2) + 'px';
            scaleWrap.style.top       = (HEADER_H + (oh - REF_H * s) / 2) + 'px';
            outer.classList.toggle('mc-narrow', fullW < 360);
        }

        applyScale();

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(applyScale);
            ro.observe(outer);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }

        // ── Drag depuis n'importe où sauf boutons/inputs ─────────────────────
        // On laisse remonter le mousedown vers makeDraggable sauf si la cible
        // est un élément interactif (bouton, input, label, checkbox).
        const INTERACTIVE = 'button, input, label, select, textarea, .mc-num-btn, .mc-tab, .mc-tt-dial, .mc-pop';
        outer.addEventListener('mousedown', function(e) {
            if (_isMax || e.target.closest(INTERACTIVE)) { e.stopPropagation(); return; }
            // Bloquer aussi le drag si on est dans le coin resize
            const r = outer.getBoundingClientRect();
            const nearCorner = (r.right - e.clientX) < RESIZE_ZONE && (r.bottom - e.clientY) < RESIZE_ZONE;
            if (nearCorner) e.stopPropagation();
        });
        outer.addEventListener('touchstart', function(e) {
            if (_isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
        }, { passive: true });
        // En plein écran, aucun appui ne doit déplacer le widget (resté dessous)
        outer.addEventListener('pointerdown', function(e) {
            if (_isMax) e.stopPropagation();
        });

        // ── Curseur move sauf sur la zone resize (coin bas-droit ~20px) ──────
        const RESIZE_ZONE = 20;
        outer.addEventListener('mousemove', function(e) {
            if (_isMax) { outer.style.cursor = ''; return; }
            if (e.target.closest(INTERACTIVE)) return;
            const r = outer.getBoundingClientRect();
            const nearCorner = (r.right - e.clientX) < RESIZE_ZONE && (r.bottom - e.clientY) < RESIZE_ZONE;
            outer.style.cursor = nearCorner ? 'se-resize' : 'move';
        });
        outer.addEventListener('mouseleave', function() {
            outer.style.cursor = '';
        });

        // ── Boutons fenêtre wf-btns ──────────────────────────────────────────
        const wfMin   = outer.querySelector('[data-role="wf-min"]');
        const wfMax   = outer.querySelector('[data-role="wf-max"]');
        const wfClose = outer.querySelector('[data-role="wf-close"]');
        const HANDLES = '.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle';
        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
        let _isMax = false;
        let _outerStyleBeforeMax = '';

        [wfMin, wfMax, wfClose].forEach(b => {
            if (!b) return;
            b.addEventListener('pointerdown', e => e.stopPropagation());
            b.addEventListener('mousedown',   e => e.stopPropagation());
            b.addEventListener('touchstart',  e => e.stopPropagation(), { passive: true });
        });

        function updatePercents() {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
        }

        // Apparence "réduite" : mini-barre à la position (left, top)
        function showCollapsedLook(left, top) {
            outer.style.display = 'none';
            widget.querySelectorAll(HANDLES).forEach(el => el.style.display = 'none');
            widget.style.left         = left + 'px';
            widget.style.top          = top  + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.overflow     = 'hidden';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.padding      = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            const mb = widget.querySelector('.mc-mini-bar');
            if (mb) mb.style.display = 'flex';
        }

        // Apparence "dépliée" : styles d'origine restaurés
        function showExpandedLook() {
            widget.style.cssText = widget._mcSavedStyle || '';
            const wc = widget.querySelector('.widget-content');
            if (wc) wc.style.cssText = widget._mcSavedWcStyle || '';
            outer.style.display = '';
            widget.querySelectorAll(HANDLES).forEach(el => el.style.display = '');
            const mb = widget.querySelector('.mc-mini-bar');
            if (mb) mb.style.display = 'none';
        }

        function mcEnterMax() {
            if (_isMax) return;
            _isMax = true;
            _outerStyleBeforeMax = outer.style.cssText;
            outer.style.position     = 'fixed';
            outer.style.inset        = '0';
            outer.style.width        = '100%';
            outer.style.height       = '100%';
            outer.style.zIndex       = '9999';
            outer.style.borderRadius = '0';
            outer.style.resize       = 'none';
            outer.classList.add('mc-max');
            applyScale();
        }

        function mcExitMax() {
            if (!_isMax) return;
            _isMax = false;
            outer.classList.remove('mc-max');
            outer.style.cssText = _outerStyleBeforeMax;
            applyScale();
        }
        // Utilisé à l'ouverture sur téléphone (voir le hook createWidget)
        widget._mcEnterMax = mcEnterMax;

        function mcCollapse() {
            if (widget.dataset.collapsed === '1') return;
            mcExitMax();

            // Mémoriser l'état d'origine
            const wc = widget.querySelector('.widget-content');
            widget._mcSavedStyle   = widget.style.cssText;
            widget._mcSavedWcStyle = wc ? wc.style.cssText : '';
            widget.dataset.mcLeftSaved = widget.offsetLeft;
            widget.dataset.mcTopSaved  = widget.offsetTop;

            // Placer la mini-barre en haut, à droite des autres widgets réduits
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.dataset.collapsed === '1'
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

            // Créer la mini-barre
            const miniBar = document.createElement('div');
            miniBar.className = 'mc-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '⏱️ Minuteur & Chrono';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); mcExpand(); });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            // Mini-barre déplaçable
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp   = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup',   onUp);
                    updatePercents();
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup',   onUp);
            });
            miniBar.addEventListener('mousedown', e => e.stopPropagation());

            showCollapsedLook(occupiedX, MARGIN_TOP);
            widget.dataset.collapsed = '1';
            updatePercents();
            if (typeof saveBoard === 'function') saveBoard();
        }

        function mcExpand() {
            if (widget.dataset.collapsed !== '1') return;
            const savedLeft = parseFloat(widget.dataset.mcLeftSaved);
            const savedTop  = parseFloat(widget.dataset.mcTopSaved);
            widget.querySelectorAll('.mc-mini-bar').forEach(el => el.remove());
            showExpandedLook();
            if (!isNaN(savedLeft)) widget.style.left = savedLeft + 'px';
            if (!isNaN(savedTop))  widget.style.top  = savedTop  + 'px';
            widget.dataset.collapsed = '0';
            applyScale();
            updatePercents();
            if (typeof saveBoard === 'function') saveBoard();
        }

        // Utilisé par la sauvegarde : un widget réduit est enregistré déplié
        widget._mcTempExpand = function () {
            const l = widget.offsetLeft, t = widget.offsetTop;
            showExpandedLook();
            const savedLeft = parseFloat(widget.dataset.mcLeftSaved);
            const savedTop  = parseFloat(widget.dataset.mcTopSaved);
            if (!isNaN(savedLeft)) widget.style.left = savedLeft + 'px';
            if (!isNaN(savedTop))  widget.style.top  = savedTop  + 'px';
            updatePercents();
            return function restore() { showCollapsedLook(l, t); updatePercents(); };
        };

        if (wfMin) {
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); mcCollapse(); });
        }
        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!_isMax) mcEnterMax();
                else mcExitMax();
            });
        }
        if (wfClose) {
            wfClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Onglets ──────────────────────────────────────────────────────────
        const tabs   = widget.querySelectorAll('.mc-tab');
        const panels = widget.querySelectorAll('.mc-panel');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(function(t)  { t.classList.remove('active'); });
                panels.forEach(function(p) { p.classList.remove('active'); });
                tab.classList.add('active');
                var target = widget.querySelector('.mc-panel[data-id="' + tab.dataset.panel + '"]');
                if (target) target.classList.add('active');
            });
        });

        // ─────────────────────────────────────────────────────────────────────
        // ══ MINUTEUR ══
        // ─────────────────────────────────────────────────────────────────────
        (function () {
            var panel    = widget.querySelector('.mc-panel[data-id="min"]');
            var setup    = panel.querySelector('[data-role="setup"]');
            var display  = panel.querySelector('[data-role="display"]');
            var progress = panel.querySelector('[data-role="progress"]');
            var bar      = panel.querySelector('[data-role="bar"]');
            var soundCb  = panel.querySelector('[data-role="sound"]');
            var btnStart = panel.querySelector('[data-role="start"]');
            var btnReset = panel.querySelector('[data-role="reset"]');
            // Les 3 inputs dans l'ordre H / M / S
            var inputs   = Array.from(panel.querySelectorAll('.mc-num-input'));
            var inpH = inputs[0], inpM = inputs[1], inpS = inputs[2];

            var totalSec = 0, remaining = 0, startTime = null;
            var intervalId = null;
            var state = 'idle'; // idle | running | paused | finished

            // Boutons ▲▼
            panel.querySelectorAll('.mc-num-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (state !== 'idle') return;
                    var inp = btn.closest('.mc-input-group').querySelector('.mc-num-input');
                    if (!inp) return;
                    var max = parseInt(inp.max);
                    var v   = (parseInt(inp.value) || 0) + (btn.dataset.dir === 'up' ? 1 : -1);
                    if (v < 0) v = max;
                    if (v > max) v = 0;
                    inp.value = String(v).padStart(2, '0');
                });
            });

            // Validation saisie directe
            inputs.forEach(function(inp) {
                inp.addEventListener('change', function() {
                    var v = parseInt(inp.value) || 0;
                    v = Math.max(0, Math.min(parseInt(inp.max), v));
                    inp.value = String(v).padStart(2, '0');
                });
            });

            function getTotal() {
                return (parseInt(inpH.value) || 0) * 3600
                     + (parseInt(inpM.value) || 0) * 60
                     + (parseInt(inpS.value) || 0);
            }

            function fmt(sec) {
                var h  = Math.floor(sec / 3600);
                var m  = Math.floor((sec % 3600) / 60);
                var s  = sec % 60;
                var mm = String(m).padStart(2, '0');
                var ss = String(s).padStart(2, '0');
                return h > 0 ? (h + ':' + mm + ':' + ss) : (mm + ':' + ss);
            }

            function updateDisplay() {
                display.textContent = fmt(remaining);
                var pct = totalSec > 0 ? (remaining / totalSec) * 100 : 100;
                bar.style.width = pct + '%';
                bar.className   = 'mc-progress-bar' + (pct <= 20 ? ' mc-low' : '');
            }

            function tick() {
                var elapsed = Math.floor((Date.now() - startTime) / 1000);
                remaining = Math.max(0, totalSec - elapsed);
                updateDisplay();
                if (remaining <= 0) finish();
            }

            function finish() {
                clearInterval(intervalId); intervalId = null;
                state = 'finished';
                display.className      = 'mc-display mc-finished';
                bar.className          = 'mc-progress-bar mc-done';
                btnStart.textContent   = 'Recommencer';
                btnStart.className     = 'mc-btn mc-btn-start';
                btnReset.style.display = 'inline-block';
                if (soundCb.checked) playBeep();
            }

            function playBeep() {
                try {
                    var ctx = new (window.AudioContext || window.webkitAudioContext)();
                    [[880,0,0.18],[880,0.22,0.18],[1318,0.44,0.4]].forEach(function(p) {
                        var osc = ctx.createOscillator(), gain = ctx.createGain();
                        osc.connect(gain); gain.connect(ctx.destination);
                        osc.frequency.value = p[0]; osc.type = 'sine';
                        gain.gain.setValueAtTime(0.5, ctx.currentTime + p[1]);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + p[1] + p[2]);
                        osc.start(ctx.currentTime + p[1]);
                        osc.stop(ctx.currentTime + p[1] + p[2] + 0.05);
                    });
                } catch(e) {}
            }

            btnStart.addEventListener('click', function() {
                if (state === 'idle' || state === 'finished') {
                    totalSec = getTotal();
                    if (totalSec <= 0) return;
                    remaining  = totalSec;
                    startTime  = Date.now();
                    state      = 'running';
                    setup.style.display    = 'none';
                    display.style.display  = 'block';
                    progress.style.display = 'block';
                    display.className      = 'mc-display mc-running';
                    bar.className          = 'mc-progress-bar';
                    updateDisplay();
                    intervalId = setInterval(tick, 250);
                    btnStart.textContent   = 'Pause';
                    btnStart.className     = 'mc-btn mc-btn-pause';
                    btnReset.style.display = 'inline-block';

                } else if (state === 'running') {
                    clearInterval(intervalId); intervalId = null;
                    totalSec             = remaining;
                    state                = 'paused';
                    display.className    = 'mc-display mc-paused';
                    btnStart.textContent = 'Reprendre';
                    btnStart.className   = 'mc-btn mc-btn-start';

                } else if (state === 'paused') {
                    startTime            = Date.now();
                    state                = 'running';
                    display.className    = 'mc-display mc-running';
                    intervalId           = setInterval(tick, 250);
                    btnStart.textContent = 'Pause';
                    btnStart.className   = 'mc-btn mc-btn-pause';
                }
            });

            btnReset.addEventListener('click', function() {
                clearInterval(intervalId); intervalId = null;
                state = 'idle'; remaining = 0;
                setup.style.display    = '';
                display.style.display  = 'none';
                progress.style.display = 'none';
                display.className      = 'mc-display';
                bar.style.width        = '100%';
                bar.className          = 'mc-progress-bar';
                btnStart.textContent   = 'Demarrer';
                btnStart.className     = 'mc-btn mc-btn-start';
                btnReset.style.display = 'none';
            });

            var obs = new MutationObserver(function() {
                if (!document.contains(widget)) { clearInterval(intervalId); obs.disconnect(); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        })();

        // ─────────────────────────────────────────────────────────────────────
        // ══ MINUTEUR VISUEL (type Time Timer) ══
        // Le disque coloré représente le temps restant ; il se réduit dans le
        // sens inverse des aiguilles d'une montre jusqu'à disparaître.
        // Réglage : boutons de durée OU glisser directement sur le cadran.
        // ─────────────────────────────────────────────────────────────────────
        (function () {
            var NS       = 'http://www.w3.org/2000/svg';
            var panel    = widget.querySelector('.mc-panel[data-id="vis"]');
            var dial     = panel.querySelector('[data-role="dial"]');
            var ticksG   = panel.querySelector('[data-role="ticks"]');
            var wedge    = panel.querySelector('[data-role="wedge"]');
            var hand     = panel.querySelector('[data-role="hand"]');
            var center   = panel.querySelector('[data-role="center"]');
            var presets  = Array.from(panel.querySelectorAll('.mc-tt-preset'));
            var colors   = Array.from(panel.querySelectorAll('.mc-tt-color'));
            var optSound = panel.querySelector('[data-role="optSound"]');
            var optDig   = panel.querySelector('[data-role="optDigits"]');
            var optLab   = panel.querySelector('[data-role="optLabels"]');
            var btnStart = panel.querySelector('[data-role="start"]');
            var btnReset = panel.querySelector('[data-role="reset"]');
            var btnHide  = panel.querySelector('[data-role="hide"]');
            var btnShow  = panel.querySelector('[data-role="show"]');
            var btnMiniR = panel.querySelector('[data-role="miniReset"]');
            var inCMin   = panel.querySelector('[data-role="customMin"]');
            var inCSec   = panel.querySelector('[data-role="customSec"]');
            var root     = widget.querySelector('.mc-widget');
            var MAX_SEC  = 120 * 60;

            // Cadrans disponibles (en minutes) : pas des graduations et des chiffres
            // unit 's' : chiffres affichés en secondes (cadrans très courts)
            var SCALES = [
                { max: 1,   minor: 2/60, label: 10/60, unit: 's' },
                { max: 2,   minor: 5/60, label: 15/60, unit: 's' },
                { max: 5,   minor: 0.25, label: 1  },
                { max: 10,  minor: 0.5,  label: 1  },
                { max: 15,  minor: 0.5,  label: 1  },
                { max: 20,  minor: 1,    label: 2  },
                { max: 30,  minor: 1,    label: 5  },
                { max: 45,  minor: 1,    label: 5  },
                { max: 60,  minor: 1,    label: 5  },
                { max: 120, minor: 2,    label: 10 }
            ];
            var R_WEDGE = 70;

            var scale     = SCALES[5];   // cadran 60 min par défaut
            var setSec    = 5 * 60;      // durée réglée
            var remaining = setSec;      // secondes restantes (décimales)
            var endTime   = 0;
            var timerId   = null;
            var state     = 'idle';      // idle | running | paused | finished
            var showLabels = true, showDigits = true;

            function scaleFor(sec) {
                var m = sec / 60;
                for (var i = 0; i < SCALES.length; i++) if (m <= SCALES[i].max) return SCALES[i];
                return SCALES[SCALES.length - 1];
            }

            // Angle (radians, sens horaire depuis midi) → coordonnées
            function pt(frac, r) {
                var a = frac * Math.PI * 2;
                return { x: r * Math.sin(a), y: -r * Math.cos(a) };
            }

            function drawTicks() {
                while (ticksG.firstChild) ticksG.removeChild(ticksG.firstChild);
                var n = Math.round(scale.max / scale.minor);
                for (var i = 0; i < n; i++) {
                    var v = i * scale.minor;
                    var isLabel = Math.abs(v / scale.label - Math.round(v / scale.label)) < 1e-6;
                    var isInt   = Math.abs(v - Math.round(v)) < 1e-6;
                    var len = isLabel ? 8 : (isInt ? 5 : 3);
                    var p1 = pt(v / scale.max, 95), p2 = pt(v / scale.max, 95 - len);
                    var l = document.createElementNS(NS, 'line');
                    l.setAttribute('x1', p1.x); l.setAttribute('y1', p1.y);
                    l.setAttribute('x2', p2.x); l.setAttribute('y2', p2.y);
                    l.setAttribute('stroke', isLabel ? '#555' : '#aaa');
                    l.setAttribute('stroke-width', isLabel ? 2 : 1);
                    ticksG.appendChild(l);
                    if (isLabel && showLabels) {
                        var pl = pt(v / scale.max, 80);
                        var t = document.createElementNS(NS, 'text');
                        t.setAttribute('x', pl.x); t.setAttribute('y', pl.y + 4);
                        t.setAttribute('text-anchor', 'middle');
                        t.setAttribute('font-size', scale.max <= 15 && scale.max > 10 ? 10 : 12);
                        t.setAttribute('font-weight', '700');
                        t.setAttribute('fill', '#666');
                        t.setAttribute('font-family', "'Segoe UI', system-ui, sans-serif");
                        t.textContent = scale.unit === 's' ? Math.round(v * 60) : Math.round(v);
                        ticksG.appendChild(t);
                    }
                }
            }

            function fmt(sec) {
                sec = Math.ceil(sec);
                var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
                if (h > 0) return h + 'h' + String(m).padStart(2, '0');
                return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            }

            function render() {
                var frac = Math.max(0, Math.min(1, remaining / (scale.max * 60)));
                if (frac >= 0.9999) {
                    wedge.setAttribute('d', 'M0,-' + R_WEDGE + ' A' + R_WEDGE + ',' + R_WEDGE + ' 0 1 0 0,' + R_WEDGE
                                           + ' A' + R_WEDGE + ',' + R_WEDGE + ' 0 1 0 0,-' + R_WEDGE + ' Z');
                } else if (frac <= 0) {
                    wedge.setAttribute('d', '');
                } else {
                    var e = pt(frac, R_WEDGE);
                    wedge.setAttribute('d', 'M0,0 L0,-' + R_WEDGE + ' A' + R_WEDGE + ',' + R_WEDGE
                        + ' 0 ' + (frac > 0.5 ? 1 : 0) + ' 1 ' + e.x.toFixed(2) + ',' + e.y.toFixed(2) + ' Z');
                }
                var hp = pt(frac, 70);
                hand.setAttribute('x2', hp.x.toFixed(2)); hand.setAttribute('y2', hp.y.toFixed(2));
                center.textContent = fmt(remaining);
                center.style.display = showDigits ? '' : 'none';
            }

            function markPreset() {
                presets.forEach(function (b) {
                    b.classList.toggle('active', parseInt(b.dataset.min) * 60 === setSec);
                });
            }

            function syncCustom() {
                inCMin.value = Math.floor(setSec / 60);
                inCSec.value = String(setSec % 60).padStart(2, '0');
            }

            // fromInputs = true : l'appel vient des champs, on ne réécrit pas pendant la frappe
            function setDuration(sec, keepScale, fromInputs) {
                setSec = Math.max(0, Math.min(MAX_SEC, Math.round(sec)));
                remaining = setSec;
                if (!keepScale) { scale = scaleFor(setSec || 60); drawTicks(); }
                markPreset();
                if (!fromInputs) syncCustom();
                render();
            }

            function lockSetup(locked) {
                dial.classList.toggle('mc-tt-locked', locked && !root.classList.contains('mc-tt-clean'));
                presets.forEach(function (b) { b.disabled = locked; });
                inCMin.disabled = locked; inCSec.disabled = locked;
            }

            // ── Durée personnalisée ──
            function applyCustom(final) {
                if (state === 'running') return;
                var m = parseInt(inCMin.value, 10) || 0;
                var sc = parseInt(inCSec.value, 10) || 0;
                m = Math.max(0, Math.min(120, m));
                sc = Math.max(0, Math.min(59, sc));
                stopTimer(); state = 'idle'; dial.classList.remove('mc-tt-done');
                setDuration(m * 60 + sc, false, !final);
                updateButtons();
            }
            [inCMin, inCSec].forEach(function (inp) {
                inp.addEventListener('input',  function () { applyCustom(false); });
                inp.addEventListener('change', function () { applyCustom(true); });
                inp.addEventListener('keydown', function (e) {
                    e.stopPropagation();                 // ne pas déclencher les raccourcis du board
                    if (e.key === 'Enter') { applyCustom(true); inp.blur(); }
                });
                inp.addEventListener('focus', function () { inp.select(); });
            });

            // ── Afficher / masquer les réglages ──
            var dialTitle = panel.querySelector('[data-role="dialTitle"]');
            function setClean(on) {
                root.classList.toggle('mc-tt-clean', on);
                dialTitle.textContent = on ? 'Appuyer pour démarrer / mettre en pause'
                                           : 'Faites glisser sur le cadran pour régler la durée';
                lockSetup(state === 'running');
            }
            btnHide.addEventListener('click', function () { setClean(true); });
            btnShow.addEventListener('click', function () { setClean(false); });
            btnMiniR.addEventListener('click', function () { btnReset.click(); });

            // ── Durées rapides ──
            presets.forEach(function (b) {
                b.addEventListener('click', function () {
                    if (state === 'running') return;
                    stopTimer(); state = 'idle'; dial.classList.remove('mc-tt-done');
                    setDuration(parseInt(b.dataset.min) * 60);
                    updateButtons();
                });
            });

            // ── Couleur du disque ──
            colors.forEach(function (c) {
                c.addEventListener('click', function () {
                    colors.forEach(function (x) { x.classList.remove('active'); });
                    c.classList.add('active');
                    wedge.setAttribute('fill', c.dataset.color);
                });
            });

            // ── Options ──
            optSound.addEventListener('click', function () { optSound.classList.toggle('on'); });
            optDig.addEventListener('click', function () {
                showDigits = !showDigits; optDig.classList.toggle('on', showDigits); render();
            });
            optLab.addEventListener('click', function () {
                showLabels = !showLabels; optLab.classList.toggle('on', showLabels); drawTicks();
            });

            // ── Réglage en glissant sur le cadran ──
            var dragging = false;
            function secFromPointer(e) {
                var r  = dial.getBoundingClientRect();
                var dx = e.clientX - (r.left + r.width / 2);
                var dy = e.clientY - (r.top + r.height / 2);
                // angle horaire depuis midi, entre 0 et 1
                var frac = Math.atan2(dx, -dy) / (Math.PI * 2);
                if (frac < 0) frac += 1;
                var step = scale.max <= 2 ? 5 : scale.max <= 10 ? 15 : (scale.max <= 30 ? 30 : 60); // pas en secondes
                var sec  = Math.round(frac * scale.max * 60 / step) * step;
                if (sec === 0 && frac > 0.5) sec = scale.max * 60; // tour complet
                return sec;
            }
            dial.addEventListener('pointerdown', function (e) {
                if (root.classList.contains('mc-tt-clean')) {
                    e.preventDefault(); e.stopPropagation();
                    btnStart.click();
                    return;
                }
                if (state === 'running') return;
                e.preventDefault(); e.stopPropagation();
                dragging = true;
                try { dial.setPointerCapture(e.pointerId); } catch (err) {}
                stopTimer(); state = 'idle'; dial.classList.remove('mc-tt-done');
                setDuration(secFromPointer(e), true);
                updateButtons();
            });
            dial.addEventListener('pointermove', function (e) {
                if (!dragging) return;
                e.preventDefault();
                setDuration(secFromPointer(e), true);
            });
            function endDrag() { dragging = false; }
            dial.addEventListener('pointerup', endDrag);
            dial.addEventListener('pointercancel', endDrag);

            // ── Décompte ──
            function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

            function tick() {
                remaining = Math.max(0, (endTime - Date.now()) / 1000);
                render();
                if (remaining <= 0) finish();
            }

            function finish() {
                stopTimer();
                state = 'finished';
                dial.classList.add('mc-tt-done');
                updateButtons();
                if (optSound.classList.contains('on')) playChime();
            }

            function playChime() {
                try {
                    var ctx = new (window.AudioContext || window.webkitAudioContext)();
                    [[659, 0], [784, 0.35], [1047, 0.7]].forEach(function (p) {
                        var osc = ctx.createOscillator(), gain = ctx.createGain();
                        osc.connect(gain); gain.connect(ctx.destination);
                        osc.type = 'triangle'; osc.frequency.value = p[0];
                        var t0 = ctx.currentTime + p[1];
                        gain.gain.setValueAtTime(0.0001, t0);
                        gain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.2);
                        osc.start(t0); osc.stop(t0 + 1.25);
                    });
                } catch (e) {}
            }

            function updateButtons() {
                if (state === 'running') {
                    btnStart.innerHTML = '&#10074;&#10074; Pause';
                    btnStart.className = 'mc-btn mc-btn-pause';
                } else if (state === 'paused') {
                    btnStart.innerHTML = '&#9654; Reprendre';
                    btnStart.className = 'mc-btn mc-btn-start';
                } else if (state === 'finished') {
                    btnStart.innerHTML = '&#8635; Relancer';
                    btnStart.className = 'mc-btn mc-btn-start';
                } else {
                    btnStart.innerHTML = '&#9654; Go';
                    btnStart.className = 'mc-btn mc-btn-start';
                }
                lockSetup(state === 'running');
            }

            btnStart.addEventListener('click', function () {
                if (state === 'idle' || state === 'finished') {
                    if (setSec <= 0) return;
                    dial.classList.remove('mc-tt-done');
                    remaining = setSec;
                    endTime = Date.now() + remaining * 1000;
                    state = 'running';
                    timerId = setInterval(tick, 100);
                } else if (state === 'running') {
                    stopTimer(); tick(); state = 'paused';
                } else if (state === 'paused') {
                    endTime = Date.now() + remaining * 1000;
                    state = 'running';
                    timerId = setInterval(tick, 100);
                }
                updateButtons();
            });

            btnReset.addEventListener('click', function () {
                stopTimer();
                state = 'idle';
                dial.classList.remove('mc-tt-done');
                remaining = setSec;
                render();
                updateButtons();
            });

            // Init
            drawTicks();
            setDuration(setSec);
            updateButtons();

            var obs = new MutationObserver(function () {
                if (!document.contains(widget)) { stopTimer(); obs.disconnect(); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        })();

        // ─────────────────────────────────────────────────────────────────────
        // ══ CHRONOMÈTRE ══
        // ─────────────────────────────────────────────────────────────────────
        (function () {
            var panel    = widget.querySelector('.mc-panel[data-id="chr"]');
            var display  = panel.querySelector('[data-role="display"]');
            var lapsEl   = panel.querySelector('[data-role="laps"]');
            var btnStart = panel.querySelector('[data-role="start"]');
            var btnLap   = panel.querySelector('[data-role="lap"]');
            var btnReset = panel.querySelector('[data-role="reset"]');

            var startTime = null, elapsed = 0, lapStart = 0;
            var rafId = null, running = false, laps = [];

            function fmt(ms) {
                var s  = Math.floor(ms / 1000);
                var h  = Math.floor(s / 3600);
                var m  = Math.floor((s % 3600) / 60);
                var ss = s % 60;
                var ds = Math.floor((ms % 1000) / 100);
                if (h > 0)
                    return h + ':' + String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0') + '.' + ds;
                return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0') + '.' + ds;
            }

            function frame() {
                elapsed = Date.now() - startTime;
                display.textContent = fmt(elapsed);
                rafId = requestAnimationFrame(frame);
            }

            function renderLaps() {
                lapsEl.innerHTML = '';
                var rev = laps.slice().reverse();
                rev.forEach(function(lap, i) {
                    var n   = laps.length - i;
                    var row = document.createElement('div');
                    row.className = 'mc-lap-row';
                    row.innerHTML = '<span class="mc-lap-n">Tour ' + n + '</span>'
                        + '<span>' + fmt(lap.total) + '</span>'
                        + '<span class="mc-lap-split">+' + fmt(lap.split) + '</span>';
                    lapsEl.appendChild(row);
                });
            }

            btnStart.addEventListener('click', function() {
                if (!running) {
                    startTime = Date.now() - elapsed;
                    running   = true;
                    display.className      = 'mc-display mc-running';
                    rafId = requestAnimationFrame(frame);
                    btnStart.textContent   = 'Pause';
                    btnStart.className     = 'mc-btn mc-btn-pause';
                    btnLap.style.display   = 'inline-block';
                    btnReset.style.display = 'none';
                } else {
                    cancelAnimationFrame(rafId); rafId = null;
                    running = false;
                    display.className      = 'mc-display mc-paused';
                    btnStart.textContent   = 'Reprendre';
                    btnStart.className     = 'mc-btn mc-btn-start';
                    btnLap.style.display   = 'none';
                    btnReset.style.display = 'inline-block';
                }
            });

            btnLap.addEventListener('click', function() {
                var split = elapsed - lapStart;
                lapStart  = elapsed;
                laps.push({ total: elapsed, split: split });
                renderLaps();
            });

            btnReset.addEventListener('click', function() {
                cancelAnimationFrame(rafId); rafId = null;
                running = false; elapsed = 0; lapStart = 0; laps = []; startTime = null;
                display.textContent    = '00:00.0';
                display.className      = 'mc-display';
                lapsEl.innerHTML       = '';
                btnStart.textContent   = 'Demarrer';
                btnStart.className     = 'mc-btn mc-btn-start';
                btnLap.style.display   = 'none';
                btnReset.style.display = 'none';
            });

            var obs = new MutationObserver(function() {
                if (!document.contains(widget)) { cancelAnimationFrame(rafId); obs.disconnect(); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        })();
    };

    // =========================================================================
    // HOOK buildBoardState — un minuteur réduit est sauvegardé à sa taille
    // et à sa position d'origine (il se rouvrira déplié au rechargement)
    // =========================================================================
    (function patchBuildBoardStateMinuteur() {
        function doPatch() {
            const _origBuild = window.buildBoardState;
            if (typeof _origBuild !== 'function' || _origBuild._mcPatched) return;
            const patched = function () {
                const restores = [];
                document.querySelectorAll('.widget[data-type="minuteur"]').forEach(w => {
                    if (w.dataset.collapsed === '1' && typeof w._mcTempExpand === 'function') {
                        restores.push(w._mcTempExpand());
                    }
                });
                try {
                    const state = _origBuild.apply(this, arguments);
                    // Couleur du cadre : correspondance par ordre d'apparition
                    try {
                        const list = (state && Array.isArray(state.widgets)) ? state.widgets
                                   : (Array.isArray(state) ? state : []);
                        const saved = list.filter(w => w && w.type === 'minuteur');
                        document.querySelectorAll('.widget[data-type="minuteur"]').forEach((w, i) => {
                            if (saved[i] && w.dataset.mcTheme) saved[i].mcTheme = w.dataset.mcTheme;
                        });
                    } catch (e) {}
                    return state;
                } finally {
                    restores.forEach(fn => fn());
                }
            };
            patched._mcPatched = true;
            window.buildBoardState = patched;
        }
        if (typeof window.buildBoardState === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — remettre la couleur du cadre
    // =========================================================================
    (function patchRestoreMinuteurTheme() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function' || _orig._mcPatched) return;
            const patched = function (json) {
                let themes = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    themes = widgets.filter(w => w && w.type === 'minuteur').map(w => w.mcTheme || '');
                } catch (e) {}
                const res = _orig.apply(this, arguments);
                const apply = () => document.querySelectorAll('.widget[data-type="minuteur"]').forEach((w, i) => {
                    if (!themes[i]) return;
                    w.dataset.mcTheme = themes[i];
                    if (typeof w._mcApplyTheme === 'function') w._mcApplyTheme(themes[i]);
                });
                apply();
                setTimeout(apply, 200);   // si le widget est initialisé après coup
                return res;
            };
            patched._mcPatched = true;
            window.restoreBoardFromJSON = patched;
        }
        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    function openMaxOnPhone(widget) {
        var phone = typeof window.isPhoneScreen === 'function'
            ? window.isPhoneScreen()
            : !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
        if (phone && widget._mcEnterMax) widget._mcEnterMax();
    }

    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'minuteur' && widget) { initMinuteurWidget(widget); openMaxOnPhone(widget); }
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'minuteur' && widget) { initMinuteurWidget(widget); openMaxOnPhone(widget); }
                    return widget;
                };
            }
        });
    }

})();
