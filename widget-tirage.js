// =========================================================================
// WIDGET TIRAGE AU SORT — Le Bureau du Prof
// Inspiré de outils_tirage.html (OutilsProfs)
// Graphisme aligné sur le Visualiseur : cadre coloré arrondi, pastilles
// « verre », police Quicksand, icônes SVG, couleur du cadre au choix
// (mémorisée dans la sauvegarde du tableau : champ tirageTheme).
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-tirage.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createTirageWidget();closeMainMenu()">
//          <span class="mm-ico">🎡</span>Tirage au Sort
//      </div>
// =========================================================================

(function () {

    function isPhoneNow() {
        if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }

    // ── Police arrondie partagée avec les autres widgets (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── CSS injecté une seule fois ────────────────────────────────────────
    // Même design que le Visualiseur : cadre coloré arrondi, pastilles
    // « verre » dans l'en-tête, zones blanches arrondies, police Quicksand.
    const STYLE = `
    /* ── Widget transparent : tirage-outer porte tout le visuel ── */
    .widget[data-type="tirage"],
    .widget[data-type="tirage"]:focus-within {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe (taille + ombre) ── */
    .widget[data-type="tirage"] .tirage-outer {
        --tir-ink:   #14202E;
        --tir-glass: rgba(255,255,255,0.62);
        --tir-bg:    #8EC5F2;
        --tir-op:    #2F6FB3;

        position: relative;
        width: 800px;
        height: 600px;
        min-width: 300px;
        min-height: 260px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
    }
    .widget[data-type="tirage"] .tirage-outer::-webkit-resizer { display: none; }
    .widget[data-type="tirage"]:hover .tirage-outer,
    .widget[data-type="tirage"]:focus-within .tirage-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Cadre coloré (porte la couleur, y compris en plein écran) ── */
    .tirage-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px 16px;
        box-sizing: border-box;
        background-color: var(--tir-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        border-radius: 24px;
        overflow: hidden;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--tir-ink);
        user-select: none;
        position: relative;
        container-type: size;
        transition: background-color .3s;
    }

    /* ── En-tête : deux pastilles « verre » ── */
    .tirage-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 0 0;
        flex-shrink: 0;
        cursor: move;
    }
    .tirage-title,
    .tirage-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--tir-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .tirage-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        pointer-events: none;
    }
    .tirage-title span { overflow: hidden; text-overflow: ellipsis; }
    .tirage-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--tir-op); }
    .tirage-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
    @container (max-width: 460px) { .tirage-title span { display: none; } .tirage-title { padding: 7px 10px; } }

    .tirage-icon-btn {
        width: 32px; height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--tir-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .tirage-icon-btn svg { width: 18px; height: 18px; }
    .tirage-icon-btn:hover,
    .tirage-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .tirage-icon-btn:focus-visible { outline: 2px solid var(--tir-ink); outline-offset: 2px; }
    .tirage-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Zone d'import (avant chargement d'une liste) ── */
    .tirage-import-zone {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 20px;
        text-align: center;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
    }
    .tirage-import-ico svg {
        width: clamp(40px, 12cqmin, 90px);
        height: clamp(40px, 12cqmin, 90px);
        color: var(--tir-op);
        opacity: .75;
    }
    .tirage-import-msg {
        font-size: clamp(13px, 3cqmin, 20px);
        font-weight: 600;
        line-height: 1.4;
        max-width: 460px;
        color: rgba(20,32,46,0.8);
    }
    .tirage-import-btn {
        font-family: inherit;
        font-size: clamp(13px, 2.6cqmin, 18px);
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 10px 22px;
        cursor: pointer;
        background: var(--tir-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
        transition: filter .15s, transform .1s;
    }
    .tirage-import-btn:hover { filter: brightness(1.1); }
    .tirage-import-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }
    .tirage-class-btn { background: var(--tir-ink) !important; }
    .tirage-status {
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.55);
    }
    .tirage-status.ok  { color: #23915A; }
    .tirage-status.err { color: #C0392B; }

    /* ── Filtres niveau (pastille « verre ») ── */
    .tirage-level-tabs {
        display: none;
        flex-wrap: wrap;
        gap: 4px;
        padding: 4px;
        align-items: center;
        flex-shrink: 0;
        background: var(--tir-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 18px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .tirage-level-tab {
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .4px;
        cursor: pointer;
        border: none;
        transition: background .15s, color .15s;
        font-family: inherit;
        background: transparent;
        color: rgba(20,32,46,0.6);
    }
    .tirage-level-tab[data-level]:hover { background: rgba(20,32,46,0.08); }
    .tirage-change-class-btn {
        margin-right: auto;
        width: 30px; height: 30px;
        padding: 0;
        display: flex; align-items: center; justify-content: center;
        background: #fff;
        color: var(--tir-op);
        box-shadow: 0 2px 6px -2px rgba(10,20,35,0.3);
    }
    .tirage-change-class-btn:hover { background: #f4f6f9; }
    .tirage-change-class-btn svg { width: 16px; height: 16px; }

    /* ── Grille élèves (zone blanche arrondie) ── */
    .tirage-body {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
        min-height: 0;
        flex: 1 1 auto;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        scrollbar-width: thin;
        scrollbar-color: rgba(20,32,46,0.25) transparent;
        --pill-fs: 9px;
        --pill-pad: 4px;
        --pill-gap: 4px;
    }
    .tirage-level-label {
        font-size: var(--pill-label-fs, 11px);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        line-height: 1.2;
        margin-top: var(--pill-gap, 6px);
        margin-bottom: calc(var(--pill-gap, 6px) * 0.7);
        text-align: center;
        color: rgba(20,32,46,0.6);
    }
    .tirage-body > div:first-child .tirage-level-label { margin-top: 0; }
    .tirage-grid {
        display: grid;
        /* minmax(0, …) : un prénom long ne peut pas élargir la grille hors du cadre */
        grid-template-columns: repeat(var(--pill-cols, 5), minmax(0, 1fr));
        gap: var(--pill-gap, 4px);
    }
    .tirage-pill {
        min-width: 0;
        line-height: 1.2;
        padding: var(--pill-pad, 4px) 4px;
        border-radius: 10px;
        font-size: var(--pill-fs, 9px);
        font-weight: 700;
        text-align: center;
        cursor: pointer;
        background: #F4F6F9;
        border: 1.5px solid rgba(20,32,46,0.1);
        box-shadow: 0 2px 0 rgba(20,32,46,0.07);
        transition: background .15s, border-color .15s, transform .15s, opacity .15s;
        /* Un prénom composé (Marie-Charlotte, Jean Paul…) peut passer sur deux
           lignes, au trait d'union ou à l'espace : il ne bride plus la taille des autres */
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: normal;
        overflow-wrap: normal;
        word-break: normal;
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
        color: var(--tir-ink);
    }
    .tirage-pill:hover { border-color: rgba(20,32,46,0.25); transform: translateY(-1px); }
    .tirage-pill.girl { color: #15803D; border-color: #BBF7D0; background: #ECFDF3; }
    .tirage-pill.girl:hover { background: #DCFCE7; border-color: #86EFAC; }
    .tirage-pill.boy  { color: #C2410C; border-color: #FED7AA; background: #FFF4EA; }
    .tirage-pill.boy:hover  { background: #FFEDD5; border-color: #FDBA74; }
    .tirage-pill.drawn {
        background: rgba(20,32,46,0.03) !important;
        color: rgba(20,32,46,0.3) !important;
        text-decoration: line-through;
        border: 1.5px dashed rgba(20,32,46,0.15) !important;
        box-shadow: none;
        opacity: 0.75;
        transform: scale(0.95);
    }

    /* ── Carte résultat (pastille « verre ») ── */
    .tirage-result-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin: 0 auto;
        width: min(440px, 100%);
        box-sizing: border-box;
        padding: 12px;
        background: var(--tir-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 20px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .tirage-result-display {
        background: #fff;
        border-radius: 14px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.1);
        height: clamp(54px, 13cqh, 110px);
        width: 100%;
        box-sizing: border-box;
        padding: 0 12px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        font-size: clamp(22px, 7cqmin, 56px);
        font-weight: 700;
        transition: transform .2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color .2s;
    }
    .tirage-draw-btn {
        width: 80%;
        padding: 10px 22px;
        font-size: clamp(13px, 2.6cqmin, 18px);
        font-weight: 700;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        font-family: inherit;
        background: var(--tir-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
        transition: filter .15s, transform .1s, opacity .15s;
    }
    .tirage-draw-btn:hover { filter: brightness(1.1); }
    .tirage-draw-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }
    .tirage-draw-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.4); transform: none; }
    .tirage-stats {
        font-size: 12px;
        color: rgba(20,32,46,0.65);
        font-weight: 700;
    }

    /* ── Petits cadres : on compacte tout pour laisser de la place aux prénoms ── */
    @container (max-height: 520px) {
        .tirage-inner { gap: 7px; }
        .tirage-header { padding-top: 10px; }
        .tirage-title { padding: 5px 12px 5px 10px; font-size: 13px; }
        .tirage-tools { padding: 3px 10px 3px 4px; }
        .tirage-icon-btn { width: 28px; height: 28px; }
        .tirage-level-tab { padding: 3px 10px; }
        .tirage-change-class-btn { width: 26px; height: 26px; }
        .tirage-body { padding: 8px 10px; }
        .tirage-result-card { padding: 7px; gap: 5px; border-radius: 16px; }
        .tirage-result-display { height: clamp(34px, 11cqh, 60px); font-size: clamp(18px, 6cqmin, 34px); border-radius: 11px; }
        .tirage-draw-btn { padding: 6px 16px; }
        .tirage-reset-btn { padding: 4px 12px; font-size: 11px; }
    }
    @container (max-height: 380px) {
        .tirage-stats { display: none; }
        .tirage-result-card { flex-direction: row; width: 100%; }
        .tirage-result-display { flex: 1; height: 34px; font-size: 18px; }
        .tirage-draw-btn { width: auto; flex-shrink: 0; font-size: 12px; }
    }

    /* ── Footer RàZ ── */
    .tirage-footer {
        flex-shrink: 0;
        text-align: center;
    }
    .tirage-reset-btn {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        font-family: inherit;
        background: var(--tir-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        color: #C0392B;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        transition: background .15s, transform .1s;
    }
    .tirage-reset-btn:hover { background: rgba(255,255,255,0.85); }
    .tirage-reset-btn:active { transform: scale(0.97); }

    /* ── Modal confirmation ── */
    .tirage-modal-overlay {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 200;
        background: rgba(10,20,35,0.35);
        -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px);
        align-items: center;
        justify-content: center;
        padding: 20px;
        border-radius: inherit;
        box-sizing: border-box;
    }
    .tirage-modal-overlay.open { display: flex; }
    .tirage-modal-box {
        background: rgba(255,255,255,0.97);
        padding: 20px;
        border-radius: 18px;
        width: 100%;
        max-width: 320px;
        color: var(--tir-ink);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
    }
    .tirage-modal-title {
        font-size: 15px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 7px;
    }
    .tirage-modal-text {
        font-size: 13px;
        color: rgba(20,32,46,0.7);
        text-align: center;
        line-height: 1.5;
        font-weight: 600;
        white-space: pre-line;
        margin: 0;
    }
    .tirage-modal-text:empty { display: none; }
    .tirage-modal-btns {
        display: flex;
        gap: 8px;
        margin-top: 14px;
    }
    .tirage-modal-btn {
        flex: 1;
        padding: 9px;
        border: none;
        border-radius: 999px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        font-family: inherit;
        transition: background .15s, filter .15s, transform .1s;
    }
    .tirage-modal-btn:active { transform: scale(0.96); }
    .tirage-modal-cancel { background: rgba(20,32,46,0.08); color: var(--tir-ink); }
    .tirage-modal-cancel:hover { background: rgba(20,32,46,0.15); }
    .tirage-modal-confirm { background: var(--tir-op); color: #fff; }
    .tirage-modal-confirm:hover { filter: brightness(1.1); }
    .tirage-modal-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; max-height: 220px; overflow-y: auto; }
    .tirage-modal-list:empty { display: none; }
    .tirage-modal-list button {
        padding: 9px 12px; border-radius: 999px; border: 1.5px solid rgba(20,32,46,0.12); background: #fff;
        color: var(--tir-op); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
        transition: background .15s, border-color .15s;
    }
    .tirage-modal-list button:hover { background: #F4F6F9; border-color: var(--tir-op); }
    .tirage-modal-list button.file { color: rgba(20,32,46,0.7); }
    .tirage-modal-list button.file:hover { border-color: rgba(20,32,46,0.3); }

    /* ── Panneaux (aide, couleur) — style des réglages du Visualiseur ── */
    .tirage-panel {
        display: none;
        position: absolute;
        top: 62px;
        right: 16px;
        width: 290px;
        max-width: calc(100% - 32px);
        max-height: calc(100% - 80px);
        overflow-y: auto;
        box-sizing: border-box;
        z-index: 10;
        flex-direction: column;
        gap: 10px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        color: var(--tir-ink);
    }
    .tirage-panel.show { display: flex; }
    .tirage-panel-title { font-size: 13px; font-weight: 700; }
    .tirage-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .tirage-help-list li { margin-bottom: 4px; }
    .tirage-help-list em { font-style: normal; font-weight: 700; color: var(--tir-op); }
    .tirage-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .tirage-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .tirage-swatch.is-on { border-color: var(--tir-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Téléphone : plein écran (classe .phone-fs posée par index.html) ──
       Le cadre fait 800×600 px par défaut : en plein écran il doit
       remplir tout l'écran du téléphone. */
    /* Décalage à gauche pour laisser les onglets latéraux visibles
       (ils dépassent d'environ 34 px du bord), et passage sous les
       onglets (z-index 50005) et sous les panneaux (50000) pour qu'on
       puisse toujours les ouvrir. */
    .widget.phone-fs[data-type="tirage"] {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
        z-index: 49990 !important;
    }
    .widget.phone-fs[data-type="tirage"] .tirage-outer {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        border-radius: 0 !important;
        outline: none !important;
    }
    .widget.phone-fs[data-type="tirage"] .tirage-inner {
        border-radius: 0 !important;
        padding: 0 10px 10px;
    }
    .widget.phone-fs[data-type="tirage"] .tirage-header {
        cursor: default;
        padding-right: 56px; /* laisse la place au bouton ⤡ de sortie du plein écran */
    }
    .widget.phone-fs[data-type="tirage"] .tirage-result-card { width: 100%; }
    /* La règle .widget { touch-action: none } du tableau bloque aussi le
       défilement au doigt : on le réautorise dans la liste des prénoms,
       et on évite le délai / zoom du double-tap sur les boutons. */
    .widget[data-type="tirage"] .tirage-body { touch-action: pan-y; }
    .widget[data-type="tirage"] .tirage-pill,
    .widget[data-type="tirage"] .tirage-inner button { touch-action: manipulation; }


    /* ── Plein écran du bouton vert (classe .wf-max) ── */
    .widget.wf-max[data-type="tirage"] .tirage-outer { outline: none !important; }
    .widget.wf-max[data-type="tirage"] .tirage-header { cursor: default; }

    /* ── Téléphone : plein écran du bouton vert ──
       Décalé de 40 px à gauche pour laisser les onglets latéraux
       visibles, et hauteur réelle de l'écran (barres du navigateur
       déduites). */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget.wf-max[data-type="tirage"] .tirage-inner {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            padding: 0 10px 10px;
        }
        .widget.wf-max[data-type="tirage"] .tirage-result-card { width: 100%; }
    }

    `;

    if (!document.getElementById('tirage-widget-style')) {
        const s = document.createElement('style');
        s.id = 'tirage-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── Taille des pastilles fenêtre (identique au Visualiseur) ───────────
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

    // Injecter le CSS des boutons wf si pas déjà fait (normalement par un autre widget)
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

    // ── Constantes ────────────────────────────────────────────────────────
    const TIRAGE_LEVEL_COLORS = {
        'CP': '#ec4899', 'CE1': '#3b82f6', 'CE2': '#eab308',
        'CM1': '#ef4444', 'CM2': '#22c55e', 'AUTRE': '#a855f7'
    };
    const TIRAGE_LEVEL_ORDER = ['CP','CE1','CE2','CM1','CM2','AUTRE'];
    // Couleur d'accent du thème choisi (variable CSS du cadre)
    const TIRAGE_THEME       = 'var(--tir-op)';
    const DRAW_ITERATIONS    = 15;
    const DRAW_INTERVAL      = 70;

    // Taille automatique des étiquettes prénoms (voir updatePillScale)
    const PILL_FS_MIN = 6;                              // px
    const PILL_FS_MAX = 30;                             // px
    const PILL_COLS   = [5, 4, 6, 3, 7, 8, 2, 9, 10];   // 5 colonnes de préférence

    // Couleurs du cadre (mêmes que le Visualiseur)
    const TIRAGE_THEMES = {
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };

    // ── Icônes ────────────────────────────────────────────────────────────
    const ICON_DICE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/></svg>';
    const ICON_HELP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';
    const ICON_FOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
    const ICON_USERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.9.3 5 2.6 5 5.8"/></svg>';

    // ── HTML interne partagé (création + restauration) ────────────────────
    function tirageInnerHTML() {
        const swatches = Object.keys(TIRAGE_THEMES).map(id =>
            '<button class="tirage-swatch" data-theme="' + id + '" title="' + TIRAGE_THEMES[id].name +
            '" style="background:' + TIRAGE_THEMES[id].bg + '"></button>'
        ).join('');
        return `
        <div class="tirage-inner">
            <div class="tirage-header">
                <div class="tirage-title">${ICON_DICE}<span>Tirage au sort</span></div>
                <div class="tirage-tools">
                    <button class="tirage-icon-btn tirage-theme-btn" title="Couleur du cadre" onmousedown="event.stopPropagation()">${ICON_PALETTE}</button>
                    <button class="tirage-icon-btn tirage-help-btn" title="Aide" onmousedown="event.stopPropagation()">${ICON_HELP}</button>
                    <span class="tirage-sep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                    </div>
                </div>
            </div>
            <div class="tirage-panel tirage-help-popup">
                <div class="tirage-panel-title">Aide</div>
                <ul class="tirage-help-list">
                    <li>Importez une liste d'élèves (.txt ou .csv), ou utilisez une liste de classe.<br>Format : <em>Prénom;NOM;sexe;NIVEAU;date</em></li>
                    <li>Cliquez sur un prénom pour l'exclure (absent), cliquez à nouveau pour le remettre.</li>
                    <li>Le tirage se fait parmi les élèves restants du niveau affiché.</li>
                    <li>Le bouton dossier, à gauche des niveaux, permet de changer de liste.</li>
                    <li>La palette change la couleur du cadre.</li>
                </ul>
            </div>
            <div class="tirage-panel tirage-theme-popup">
                <div class="tirage-panel-title">Couleur du cadre</div>
                <div class="tirage-swatches">${swatches}</div>
            </div>
            <div class="tirage-import-zone">
                <div class="tirage-import-ico">${ICON_USERS}</div>
                <div class="tirage-import-msg">Chargez une liste d'élèves pour commencer le tirage.</div>
                <button class="tirage-import-btn tirage-class-btn" style="display:none;">📋 Utiliser une liste de classe</button>
                <button class="tirage-import-btn">📄 Importer une liste d'élèves</button>
                <input type="file" class="tirage-file-input" accept=".txt,.csv" style="display:none;">
                <div class="tirage-status">Format : Prénom;NOM;sexe;NIVEAU;date</div>
            </div>
            <div class="tirage-level-tabs"></div>
            <div class="tirage-body" style="display:none;"></div>
            <div class="tirage-result-card" style="display:none;">
                <div class="tirage-result-display" style="color:var(--tir-op);">PRÊT</div>
                <button class="tirage-draw-btn" disabled>🎲 Tirer un prénom</button>
                <div class="tirage-stats">--</div>
            </div>
            <div class="tirage-footer" style="display:none;">
                <button class="tirage-reset-btn">↺ Remettre le tirage à zéro</button>
            </div>
            <div class="tirage-modal-overlay">
                <div class="tirage-modal-box">
                    <div class="tirage-modal-title">Confirmation</div>
                    <p class="tirage-modal-text"></p>
                    <div class="tirage-modal-list"></div>
                    <div class="tirage-modal-btns">
                        <button class="tirage-modal-btn tirage-modal-cancel">Annuler</button>
                        <button class="tirage-modal-btn tirage-modal-confirm">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initTirageWidget = function (widget) {

        const outer = widget.querySelector('.tirage-outer');

        // Bloquer la remontée mousedown depuis l'intérieur (sinon le drag se déclenche)
        outer.addEventListener('mousedown', e => e.stopPropagation());

        // Même chose au doigt / au stylet : sans ça, le toucher sur un prénom
        // remonte jusqu'au tableau, qui le prend pour un déplacement du widget
        // et annule le clic. On laisse passer l'en-tête (il sert à déplacer).
        if (!outer._touchGuard) {
            outer._touchGuard = true;
            const stopIfNotHeader = (e) => {
                if (e.target.closest && e.target.closest('.tirage-header')) return;
                e.stopPropagation();
            };
            outer.addEventListener('touchstart',  stopIfNotHeader, { passive: true });
            outer.addEventListener('pointerdown', stopIfNotHeader);
        }

        // ── Header draggable (une seule fois) ─────────────────────────────
        const tirageHeader = widget.querySelector('.tirage-header');
        if (tirageHeader && !tirageHeader._dragInit) {
            tirageHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            tirageHeader.addEventListener('mousedown',  onHeaderDown);
            tirageHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const importZone      = widget.querySelector('.tirage-import-zone');
        const importBtn       = widget.querySelector('.tirage-import-btn:not(.tirage-class-btn)');
        const classBtn        = widget.querySelector('.tirage-class-btn');
        const fileInput       = widget.querySelector('.tirage-file-input');
        const statusEl        = widget.querySelector('.tirage-status');
        const levelTabs       = widget.querySelector('.tirage-level-tabs');
        const body            = widget.querySelector('.tirage-body');
        const resultCard      = widget.querySelector('.tirage-result-card');
        const resultDisplay   = widget.querySelector('.tirage-result-display');
        const drawBtn         = widget.querySelector('.tirage-draw-btn');
        const statsEl         = widget.querySelector('.tirage-stats');
        const footer          = widget.querySelector('.tirage-footer');
        const resetBtn        = widget.querySelector('.tirage-reset-btn');
        const modalOverlay    = widget.querySelector('.tirage-modal-overlay');
        const helpBtn         = widget.querySelector('.tirage-help-btn');
        const helpPopup       = widget.querySelector('.tirage-help-popup');

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        const wfMin   = widget.querySelector('[data-role="wf-min"]');
        const wfMax   = widget.querySelector('[data-role="wf-max"]');
        const wfClose = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;

        function tirageCollapse() {
            // En plein écran (bouton vert) : on en sort d'abord
            if (_isMax) setMax(false);
            // En plein écran téléphone : on en sort d'abord pour retrouver la taille normale
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') {
                window.exitPhoneFullscreen(widget);
            }
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.tirageW) || 800;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.tirageH) || 600;
            widget.dataset.tirageW = savedW;
            widget.dataset.tirageH = savedH;

            // Sauvegarder la position ORIGINALE avant de déplacer le widget
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.tirageSavedLeft = widget.offsetLeft;
            widget.dataset.tirageSavedTop  = widget.offsetTop;
            // Aussi sauvegarder les % pour que buildBoardState les retrouve
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            // Cacher le contenu et les poignées
            outer.style.display = 'none';
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                  .forEach(el => el.style.display = 'none');

            // Dimensionner le widget en mini-barre et le placer en haut à gauche
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.dataset.collapsed === '1'
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top  = MARGIN_TOP + 'px';
            widget.style.left = occupiedX  + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.overflow     = 'hidden';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.padding      = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.dataset.collapsed = '1';

            // Créer la mini-barre
            const miniBar = document.createElement('div');
            miniBar.className = 'tirage-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '🎲 Tirage au Sort';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); tirageExpand(); });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            // Mini-barre draggable
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
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup',   onUp);
            });

            if (typeof saveBoard === 'function') saveBoard();
        }

        function tirageExpand() {
            const savedW    = parseFloat(widget.dataset.tirageW)    || 800;
            const savedH    = parseFloat(widget.dataset.tirageH)    || 600;
            const savedLeft = parseFloat(widget.dataset.tirageSavedLeft);
            const savedTop  = parseFloat(widget.dataset.tirageSavedTop);

            // Supprimer la mini-barre
            widget.querySelectorAll('.tirage-mini-bar').forEach(el => el.remove());

            // Réinitialiser tous les styles inline du widget (comme une actualisation)
            widget.removeAttribute('style');
            widget.style.left = (!isNaN(savedLeft) ? savedLeft : widget.offsetLeft) + 'px';
            widget.style.top  = (!isNaN(savedTop)  ? savedTop  : widget.offsetTop)  + 'px';

            const wc = widget.querySelector('.widget-content');
            if (wc) wc.removeAttribute('style');

            widget.dataset.collapsed = '0';

            // Réafficher et redimensionner outer
            outer.style.display = '';
            outer.style.width   = savedW + 'px';
            outer.style.height  = savedH + 'px';

            // Réinjecter le HTML interne et réinitialiser (comme l'actualisation)
            outer.innerHTML = tirageInnerHTML();
            initTirageWidget(widget);

            // Mettre à jour les % de position
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        // Exposer expand sur le widget pour que la mini-barre de restauration puisse l'appeler
        widget._tirageExpand = tirageExpand;

        if (wfMin) {
            wfMin.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            wfMin.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); tirageCollapse(); });
        }
        // Plein écran (bouton vert). Sur téléphone, il est activé dès
        // l'ouverture du widget (voir createTirageWidget).
        function setMax(on) {
            _isMax = !!on;
            const inner = widget.querySelector('.tirage-inner');
            if (!inner) return;
            widget.classList.toggle('wf-max', _isMax);
            if (_isMax) {
                inner.style.position = 'fixed';
                inner.style.inset = '0';
                inner.style.width = '100%';
                inner.style.height = '100%';
                inner.style.zIndex = '9999';
                inner.style.borderRadius = '0';
            } else {
                inner.style.position = '';
                inner.style.inset = '';
                inner.style.width = '';
                inner.style.height = '';
                inner.style.zIndex = '';
                inner.style.borderRadius = '';
            }
            requestAnimationFrame(() => { if (typeof updatePillScale === 'function') updatePillScale(); });
        }
        widget._wfSetMax = setMax;
        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                setMax(!_isMax);
            });
        }
        // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
        // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
        const _maxInner = widget.querySelector('.tirage-inner');
        if (_maxInner) {
            const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
            _maxInner.addEventListener('touchstart',  stopInMax, { passive: true });
            _maxInner.addEventListener('pointerdown', stopInMax);
            _maxInner.addEventListener('mousedown',   stopInMax);
        }
        if (wfClose) {
            wfClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Panneaux aide / couleur ───────────────────────────────────────
        const themeBtn   = widget.querySelector('.tirage-theme-btn');
        const themePopup = widget.querySelector('.tirage-theme-popup');
        const panels = [[helpBtn, helpPopup], [themeBtn, themePopup]].filter(p => p[0] && p[1]);
        function closePanels() {
            panels.forEach(([b, p]) => { p.classList.remove('show'); b.classList.remove('is-on'); });
        }
        panels.forEach(([btn, panel]) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const open = !panel.classList.contains('show');
                closePanels();
                panel.classList.toggle('show', open);
                btn.classList.toggle('is-on', open);
            });
            // Un clic dans le panneau ne doit pas le refermer
            panel.addEventListener('click', (e) => e.stopPropagation());
        });
        if (!widget._tiragePanelsDocClose) {
            widget._tiragePanelsDocClose = true;
            document.addEventListener('click', () => {
                widget.querySelectorAll('.tirage-panel.show').forEach(p => p.classList.remove('show'));
                widget.querySelectorAll('.tirage-icon-btn.is-on').forEach(b => b.classList.remove('is-on'));
            });
        }

        // ── Couleur du cadre (mémorisée dans le tableau) ──────────────────
        function applyTheme(id) {
            if (!TIRAGE_THEMES[id]) id = 'bleu';
            widget.dataset.tirageTheme = id;
            outer.style.setProperty('--tir-bg', TIRAGE_THEMES[id].bg);
            outer.style.setProperty('--tir-op', TIRAGE_THEMES[id].op);
            widget.querySelectorAll('.tirage-swatch').forEach(s =>
                s.classList.toggle('is-on', s.dataset.theme === id));
        }
        widget.querySelectorAll('.tirage-swatch').forEach(s => {
            s.addEventListener('click', (e) => {
                e.stopPropagation();
                applyTheme(s.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });
        applyTheme(widget.dataset.tirageTheme || 'bleu');

        // ── État ──────────────────────────────────────────────────────────
        let allStudents  = [];
        let remaining    = [];
        let isDrawing    = false;
        let currentLevel = 'tous';
        let classId      = widget.dataset.tirageClassId || null; // liste de classe liée (widget-liste-de-classe)

        // Restaurer depuis dataset si données présentes (priorité board JSON)
        // Sinon classe active du widget-liste-de-classe, sinon localStorage (ancienne liste)
        if (widget.dataset.tirageStudents) {
            try {
                allStudents = JSON.parse(widget.dataset.tirageStudents);
                remaining   = JSON.parse(widget.dataset.tirageRemaining || '[]').map(Number);
                if (!remaining.length && allStudents.length)
                    remaining = allStudents.map(s => Number(s.id));
                showLoadedState();
            } catch(e) { console.warn('tirage: erreur restauration dataset', e); }
        } else if (window.ClasseListe && window.ClasseListe.getStudents().length) {
            loadFromClass(window.ClasseListe.getActiveId());
        } else {
            // Charger la liste depuis localStorage si disponible
            try {
                const saved = localStorage.getItem('tirage_students_list');
                if (saved) {
                    allStudents = JSON.parse(saved);
                    remaining   = allStudents.map(s => s.id); // toujours full au premier chargement
                    setStatus('✓ ' + allStudents.length + ' élève(s) (liste mémorisée)', 'ok');
                    showLoadedState();
                }
            } catch(e) {}
        }

        // ── Import ────────────────────────────────────────────────────────
        importBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => parseStudents(ev.target.result);
            reader.readAsText(file, 'UTF-8');
            e.target.value = '';
        });

        function parseStudents(text) {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const students = [];
            lines.forEach((line, i) => {
                const parts = line.split(';').map(s => s.trim());
                if (!parts[0]) return;
                students.push({
                    id:     i,
                    prenom: parts[0],
                    nom:    parts[1] || '',
                    sexe:   parts[2] || '',
                    niveau: (parts[3] || 'AUTRE').trim().toUpperCase(),
                    dob:    parts[4] || ''
                });
            });
            if (!students.length) { setStatus('Aucun élève trouvé.', 'err'); return; }
            // Un import de fichier remplace la liaison à une liste de classe
            classId = null;
            delete widget.dataset.tirageClassId;
            allStudents = students;
            remaining   = students.map(s => s.id);
            setStatus('✓ ' + students.length + ' élève(s) chargé(s)', 'ok');
            persistData();
            showLoadedState();
        }

        // ── Liste de classe (widget-liste-de-classe) ──────────────────────
        function classesAvailable() {
            const CL = window.ClasseListe;
            return CL ? CL.getClasses().filter(c => c.count > 0) : [];
        }

        function refreshClassBtn() {
            if (classBtn) classBtn.style.display = classesAvailable().length ? '' : 'none';
        }

        function loadFromClass(id) {
            const CL = window.ClasseListe;
            if (!CL) return;
            const list = CL.getStudents(id);
            if (!list.length) {
                showConfirm('Classe vide', 'Cette classe ne contient aucun élève.');
                return;
            }
            classId = id;
            widget.dataset.tirageClassId = id;
            allStudents  = list;
            remaining    = list.map(s => Number(s.id));
            currentLevel = 'tous';
            persistData();
            showLoadedState();
        }

        function showClassPicker() {
            const classes = classesAvailable();
            if (!classes.length) { fileInput.click(); return; }
            modalOverlay.querySelector('.tirage-modal-title').textContent = 'Choisir une liste';
            modalOverlay.querySelector('.tirage-modal-text').textContent  = '';
            const listEl = modalOverlay.querySelector('.tirage-modal-list');
            listEl.innerHTML = '';
            classes.forEach(c => {
                const b = document.createElement('button');
                b.textContent = '📋 ' + c.name + ' (' + c.count + ')';
                b.addEventListener('click', () => { closeModal(); loadFromClass(c.id); });
                listEl.appendChild(b);
            });
            const fb = document.createElement('button');
            fb.className = 'file';
            fb.textContent = '📄 Importer un fichier…';
            fb.addEventListener('click', () => { closeModal(); fileInput.click(); });
            listEl.appendChild(fb);
            modalOverlay.querySelector('.tirage-modal-cancel').style.display  = '';
            modalOverlay.querySelector('.tirage-modal-confirm').style.display = 'none';
            modalOverlay.classList.add('open');
        }

        // Synchronisation : la liste de classe a été modifiée → mettre à jour sans perdre le tirage en cours
        function syncFromClass() {
            refreshClassBtn();
            const CL = window.ClasseListe;
            if (!classId || !CL) return;
            if (!CL.getClass(classId)) {           // classe supprimée : on garde la liste actuelle
                classId = null;
                delete widget.dataset.tirageClassId;
                return;
            }
            const fresh    = CL.getStudents(classId);
            const oldIds   = new Set(allStudents.map(s => Number(s.id)));
            const freshIds = new Set(fresh.map(s => Number(s.id)));
            remaining = remaining.map(Number).filter(id => freshIds.has(id));
            fresh.forEach(s => { if (!oldIds.has(Number(s.id))) remaining.push(Number(s.id)); });
            allStudents = fresh;
            persistData();
            showLoadedState();
        }

        if (window.ClasseListe) {
            if (typeof widget._tirageClassOff === 'function') widget._tirageClassOff();
            const onClassChange = () => {
                if (!document.contains(widget)) { window.removeEventListener('bdp-classes-changed', onClassChange); return; }
                syncFromClass();
            };
            window.addEventListener('bdp-classes-changed', onClassChange);
            widget._tirageClassOff = () => window.removeEventListener('bdp-classes-changed', onClassChange);
        }
        if (classBtn) classBtn.addEventListener('click', showClassPicker);
        refreshClassBtn();

        function showLoadedState() {
            importZone.style.display  = 'none';
            body.style.display        = 'flex';
            resultCard.style.display  = 'flex';
            footer.style.display      = 'block';
            drawBtn.disabled          = false;
            buildLevelTabs();
            renderList();
        }

        function setStatus(msg, cls) {
            statusEl.textContent = msg;
            statusEl.className   = 'tirage-status' + (cls ? ' ' + cls : '');
        }

        function normalizeRemaining() {
            remaining = [...new Set(remaining.map(Number))];
        }

        function persistData() {
            normalizeRemaining();
            widget.dataset.tirageStudents  = JSON.stringify(allStudents);
            widget.dataset.tirageRemaining = JSON.stringify(remaining);
            if (allStudents.length) {
                try { localStorage.setItem('tirage_students_list', JSON.stringify(allStudents)); } catch(e) {}
            }
            // NE PAS appeler saveBoard() ici — cela déclencherait restoreBoardFromJSON
            // qui rappellerait initTirageWidget et écraserait remaining en mémoire
        }

        // ── Onglets niveau ────────────────────────────────────────────────
        function buildLevelTabs() {
            const niveaux = [...new Set(allStudents.map(s => s.niveau))].sort((a, b) =>
                (TIRAGE_LEVEL_ORDER.indexOf(a) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(a)) -
                (TIRAGE_LEVEL_ORDER.indexOf(b) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(b))
            );
            levelTabs.innerHTML = '';
            levelTabs.style.display = 'flex';

            // Bouton "Changer de classe" toujours présent dans la barre
            const changeBtn = document.createElement('button');
            changeBtn.className = 'tirage-level-tab tirage-change-class-btn';
            changeBtn.title = 'Charger une autre liste (classe ou fichier)';
            changeBtn.innerHTML = ICON_FOLDER;
            changeBtn.addEventListener('click', showClassPicker);
            levelTabs.appendChild(changeBtn);

            if (niveaux.length > 1) {
                levelTabs.appendChild(makeTab('Tous', 'tous'));
                niveaux.forEach(niv => levelTabs.appendChild(makeTab(niv, niv)));
                setActiveTab('tous');
            }
        }

        function makeTab(label, value) {
            const tab = document.createElement('button');
            tab.className    = 'tirage-level-tab';
            tab.textContent  = label;
            tab.dataset.level = value;
            tab.addEventListener('click', () => { currentLevel = value; setActiveTab(value); renderList(); });
            return tab;
        }

        function setActiveTab(value) {
            levelTabs.querySelectorAll('.tirage-level-tab[data-level]').forEach(t => {
                const isActive = t.dataset.level === value;
                const color    = t.dataset.level === 'tous' ? TIRAGE_THEME : getLevelColor(t.dataset.level);
                t.style.backgroundColor = isActive ? color  : '';
                t.style.color           = isActive ? '#fff' : '';
            });
        }

        function getLevelColor(niv) { return TIRAGE_LEVEL_COLORS[niv] || '#a855f7'; }

        // ── Rendu grille ──────────────────────────────────────────────────
        function getFiltered() {
            return currentLevel === 'tous' ? allStudents : allStudents.filter(s => s.niveau === currentLevel);
        }

        // Toucher fiable sur téléphone/tablette : un appui court (sans glisser,
        // pour ne pas gêner le défilement de la liste) déclenche l'action dès
        // que le doigt se lève. À la souris, on garde le clic habituel.
        let lastTouchTap = 0;
        function onTap(el, fn) {
            let start = null;
            el.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse') return;
                start = { x: e.clientX, y: e.clientY };
            });
            el.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'mouse' || !start) return;
                const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
                start = null;
                if (moved > 10) return;            // c'était un défilement
                lastTouchTap = Date.now();
                e.preventDefault();
                fn();
            });
            el.addEventListener('pointercancel', () => { start = null; });
            el.addEventListener('click', () => {
                if (Date.now() - lastTouchTap < 600) return; // déjà traité au toucher
                fn();
            });
        }

        function hasDupPrenom(p) {
            return allStudents.filter(s => s.prenom.toLowerCase() === p.toLowerCase()).length > 1;
        }

        function displayName(s) {
            return hasDupPrenom(s.prenom) ? s.prenom + ' ' + s.nom.charAt(0) + '.' : s.prenom;
        }

        function renderList() {
            body.innerHTML = '';
            const students = getFiltered();
            const groups   = {};
            students.forEach(s => { if (!groups[s.niveau]) groups[s.niveau] = []; groups[s.niveau].push(s); });

            const sortedLevels = Object.keys(groups).sort((a, b) =>
                (TIRAGE_LEVEL_ORDER.indexOf(a) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(a)) -
                (TIRAGE_LEVEL_ORDER.indexOf(b) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(b))
            );

            sortedLevels.forEach(niv => {
                const block = document.createElement('div');
                if (sortedLevels.length > 1) {
                    const lbl = document.createElement('div');
                    lbl.className = 'tirage-level-label';
                    lbl.style.color = getLevelColor(niv);
                    lbl.textContent = niv;
                    block.appendChild(lbl);
                }
                const grid = document.createElement('div');
                grid.className = 'tirage-grid';
                groups[niv].sort((a, b) => a.prenom.localeCompare(b.prenom)).forEach(s => {
                    const pill = document.createElement('div');
                    pill.className = 'tirage-pill';
                    const isDrawn = !remaining.includes(Number(s.id));
                    const sx = (s.sexe || '').toLowerCase();
                    const pillCls = isDrawn ? 'drawn' : (sx.startsWith('f') ? 'girl' : (sx ? 'boy' : ''));
                    if (pillCls) pill.classList.add(pillCls);
                    pill.textContent = displayName(s);
                    pill.title       = s.prenom + ' ' + s.nom + (isDrawn ? ' (tiré)' : '');
                    onTap(pill, () => toggleStudent(s.id));
                    grid.appendChild(pill);
                });
                block.appendChild(grid);
                body.appendChild(block);
            });
            updateStats();
            updatePillScale();
        }

        function updateStats() {
            const filtered = getFiltered();
            const remFilt  = filtered.filter(s => remaining.includes(Number(s.id))).length;
            statsEl.textContent = remFilt + ' restant' + (remFilt > 1 ? 's' : '') + ' / ' + filtered.length;
            const hasRem = remaining.length > 0;
            drawBtn.disabled    = !hasRem || isDrawing;
            drawBtn.textContent = hasRem ? '🎲 Tirer un prénom' : 'Session terminée';
        }

        function toggleStudent(id) {
            id = Number(id);
            if (remaining.includes(id)) remaining = remaining.filter(r => Number(r) !== id);
            else remaining = [...new Set([...remaining.map(Number), id])];
            persistData();
            renderList();
        }

        // ── Tirage ────────────────────────────────────────────────────────
        drawBtn.addEventListener('click', drawName);

        function drawName() {
            const pool = getFiltered().map(s => Number(s.id)).filter(id => remaining.includes(id));
            if (!pool.length || isDrawing) return;
            isDrawing = true;
            drawBtn.disabled = true;
            resultDisplay.style.color     = 'rgba(20,32,46,0.28)';
            resultDisplay.style.transform = 'scale(0.95)';

            const winnerId = Number(pool[Math.floor(Math.random() * pool.length)]);
            const winner   = allStudents.find(s => Number(s.id) === winnerId);

            const STEP_MS   = 70;
            const NB_STEPS  = 14;
            let step = 0;
            // Rotation sur TOUT le pool (y compris le gagnant) pour un défilement fluide
            let rotIdx = Math.floor(Math.random() * pool.length);

            function nextStep() {
                if (step < NB_STEPS) {
                    const tempId = pool[rotIdx % pool.length];
                    rotIdx++;
                    resultDisplay.textContent = displayName(allStudents.find(s => s.id === tempId));
                    step++;
                    setTimeout(nextStep, STEP_MS);
                } else {
                    remaining = remaining.filter(r => Number(r) !== winnerId);
                    resultDisplay.textContent     = displayName(winner);
                    resultDisplay.style.color     = TIRAGE_THEME;
                    resultDisplay.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        resultDisplay.style.transform = 'scale(1)';
                        isDrawing = false;
                        persistData();
                        renderList();
                    }, 250);
                }
            }

            nextStep();
        }

        // ── RàZ ───────────────────────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            showConfirm('Remettre à zéro ?', 'Tous les élèves seront à nouveau disponibles.', () => {
                remaining = allStudents.map(s => s.id);
                resultDisplay.textContent = 'PRÊT';
                resultDisplay.style.color = TIRAGE_THEME;
                persistData();
                renderList();
            });
        });

        // ── Modal ─────────────────────────────────────────────────────────
        function showConfirm(title, text, onConfirm, confirmLabel) {
            modalOverlay.querySelector('.tirage-modal-title').textContent = title;
            modalOverlay.querySelector('.tirage-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.tirage-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.tirage-modal-confirm');
            confirmBtn.textContent = confirmLabel || 'Confirmer';
            confirmBtn.style.display = '';
            const pickList = modalOverlay.querySelector('.tirage-modal-list');
            if (pickList) pickList.innerHTML = '';
            if (onConfirm) {
                cancelBtn.style.display = '';
                confirmBtn.onclick = () => { closeModal(); onConfirm(); };
            } else {
                cancelBtn.style.display = 'none';
                confirmBtn.onclick = closeModal;
            }
            modalOverlay.classList.add('open');
        }
        function closeModal() { modalOverlay.classList.remove('open'); }
        modalOverlay.querySelector('.tirage-modal-cancel').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

        // ── Mise à l'échelle des pills selon la largeur du widget ─────────
        // Les étiquettes prennent la plus grande taille possible qui tient
        // ENTIÈREMENT dans le cadre blanc : ni débordement en hauteur
        // (pas de barre de défilement), ni en largeur, ni prénom coupé.
        // Le nombre de colonnes s'adapte aussi à la forme du cadre.
        // (Réglages PILL_* définis en haut du fichier.)
        function applyPillScale(fs, cols) {
            body.style.setProperty('--pill-fs',  fs.toFixed(1) + 'px');
            body.style.setProperty('--pill-pad', Math.max(2, fs * 0.3).toFixed(1) + 'px');
            body.style.setProperty('--pill-gap', Math.max(3, fs * 0.35).toFixed(1) + 'px');
            body.style.setProperty('--pill-label-fs', Math.max(8, Math.min(13, fs * 0.6)).toFixed(1) + 'px');
            body.style.setProperty('--pill-cols', cols);
        }
        function pillsFit() {
            if (body.scrollHeight > body.clientHeight) return false;
            if (body.scrollWidth  > body.clientWidth)  return false;
            const pills = body.querySelectorAll('.tirage-pill');
            for (let i = 0; i < pills.length; i++) {
                if (pills[i].scrollWidth > pills[i].clientWidth) return false;
            }
            return true;
        }
        // Plus grande taille qui tient avec ce nombre de colonnes,
        // ou -Infinity si on ne peut pas faire mieux que « mustBeat »
        function bestSizeFor(cols, mustBeat) {
            applyPillScale(PILL_FS_MAX, cols);
            if (pillsFit()) return PILL_FS_MAX;
            let lo = Math.max(PILL_FS_MIN, mustBeat);
            applyPillScale(lo, cols);
            if (!pillsFit()) return -Infinity;
            let hi = PILL_FS_MAX;
            while (hi - lo > 0.25) {                    // recherche par dichotomie
                const mid = (lo + hi) / 2;
                applyPillScale(mid, cols);
                if (pillsFit()) lo = mid; else hi = mid;
            }
            return lo;
        }
        function updatePillScale() {
            if (widget._tirageFitting) return;
            // Liste masquée (zone d'import, widget réduit) : rien à ajuster
            if (!body.offsetParent || !body.clientHeight) return;
            widget._tirageFitting = true;
            try {
                body.style.overflowY = 'hidden';        // mesure sans barre de défilement
                const nbPills = body.querySelectorAll('.tirage-pill').length;
                let best = -Infinity, bestCols = 5;
                for (const cols of PILL_COLS) {
                    if (cols !== 5 && cols > Math.max(2, nbPills)) continue;
                    const fs = bestSizeFor(cols, best);
                    if (fs > best + 0.3) { best = fs; bestCols = cols; }
                    if (best >= PILL_FS_MAX) break;
                }
                widget._tiragePillsOverflow = best === -Infinity;
                if (best === -Infinity) {
                    // Liste vraiment énorme pour la place : taille mini, et on peut défiler
                    best = PILL_FS_MIN;
                    bestCols = Math.max(3, Math.min(10, Math.floor(body.clientWidth / 60)));
                }
                applyPillScale(best, bestCols);
            } finally {
                body.style.overflowY = '';
                widget._tirageFitting = false;
            }
        }

        // ── Poignée de redimensionnement custom ───────────────────────────
        if (!widget.querySelector('.custom-resize-handle')) {
            const handle = document.createElement('div');
            handle.className = 'custom-resize-handle';
            handle.title = 'Redimensionner';
            widget.appendChild(handle);

            handle.addEventListener('pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                e.stopPropagation();
                e.preventDefault();
                handle.setPointerCapture(e.pointerId);
                const startX = e.clientX, startY = e.clientY;
                const startW = outer.offsetWidth,  startH = outer.offsetHeight;
                const minW = 280, minH = 200;

                let goodW = startW, goodH = startH;
                function onMove(ev) {
                    ev.preventDefault();
                    const nw = Math.max(minW, startW + ev.clientX - startX);
                    const nh = Math.max(minH, startH + ev.clientY - startY);
                    outer.style.width  = nw + 'px';
                    outer.style.height = nh + 'px';
                    // On refuse de rétrécir au point que les prénoms ne tiennent
                    // plus dans le cadre blanc : on garde la dernière taille valable
                    updatePillScale();
                    if (widget._tiragePillsOverflow && (nw < goodW || nh < goodH)) {
                        // On essaie de garder au moins un des deux sens
                        outer.style.width = nw + 'px'; outer.style.height = goodH + 'px';
                        updatePillScale();
                        if (widget._tiragePillsOverflow) {
                            outer.style.width = goodW + 'px'; outer.style.height = nh + 'px';
                            updatePillScale();
                            if (widget._tiragePillsOverflow) {
                                outer.style.width = goodW + 'px'; outer.style.height = goodH + 'px';
                                updatePillScale();
                                return;
                            }
                        }
                    }
                    goodW = outer.offsetWidth; goodH = outer.offsetHeight;
                }
                function onUp() {
                    handle.removeEventListener('pointermove',   onMove);
                    handle.removeEventListener('pointerup',     onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                handle.addEventListener('pointermove',   onMove);
                handle.addEventListener('pointerup',     onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        }

        // ── Sauvegarder la taille via ResizeObserver ──────────────────────
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                // Ne pas écraser les dimensions sauvegardées si le widget est réduit
                // ni quand il est en plein écran sur téléphone (sinon, rouvert sur
                // ordinateur, il garderait la taille de l'écran du téléphone)
                if (outer.dataset.collapsed !== '1' && !widget.classList.contains('phone-fs')) {
                    if (outer.offsetWidth  > 0) widget.dataset.tirageW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.tirageH = outer.offsetHeight;
                }
                updatePillScale();
            });
            ro.observe(outer);
            ro.observe(body);   // suit aussi le plein écran et l'affichage de la liste
            updatePillScale(); // appel initial
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createTirageWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 120, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'tirage';
        widget.dataset.transparent = 'true';
        // Le widget s'ouvre à 100px du bord gauche du board.
        widget.style.cssText = `left:100px; top:${pos.y}px;`;
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
            <div class="tirage-outer">${tirageInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        // Une erreur à l'initialisation ne doit jamais bloquer la suite
        // (fermeture du panneau Outils, sauvegarde…)
        try { initTirageWidget(widget); }
        catch (e) { console.error('Tirage au sort : erreur à l\'ouverture', e); }
        // Sur téléphone : ouverture directe en plein écran (bouton vert).
        if (isPhoneNow() && widget._wfSetMax) widget._wfSetMax(true);
        saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK buildBoardState — inclure dimensions + données dans le JSON
    // =========================================================================
    (function patchBuildBoardState() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function') return;
        window.buildBoardState = function () {
            const state = _orig.apply(this, arguments);
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            document.querySelectorAll('.widget[data-type="tirage"]').forEach(widget => {
                const outer     = widget.querySelector('.tirage-outer');
                const collapsed = widget.dataset.collapsed === '1';
                if (!outer) return;

                // Quand réduit, leftPercent/topPercent dans le dataset = position d'ORIGINE (sauvée avant collapse)
                // save-load.js les a recalculés sur la mini-barre → on les corrige ici
                if (collapsed) {
                    const origLeft = parseFloat(widget.dataset.tirageSavedLeft);
                    const origTop  = parseFloat(widget.dataset.tirageSavedTop);
                    if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                    if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                }

                const match = (state.widgets || []).find(w => w.type === 'tirage' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                );
                if (match) {
                    const w = parseFloat(widget.dataset.tirageW) || outer.offsetWidth;
                    const h = parseFloat(widget.dataset.tirageH) || outer.offsetHeight;
                    if (w > 0) match.tirageW = w;
                    if (h > 0) match.tirageH = h;
                    match.widthPercent    = 0;
                    match.contentHPercent = 0;
                    // Corriger la position dans le JSON si réduit
                    if (collapsed) {
                        match.leftPercent = parseFloat(widget.dataset.leftPercent);
                        match.topPercent  = parseFloat(widget.dataset.topPercent);
                    }
                    match.tirageCollapsed = collapsed;
                    if (widget.dataset.tirageSavedLeft) match.tirageSavedLeft = widget.dataset.tirageSavedLeft;
                    if (widget.dataset.tirageSavedTop)  match.tirageSavedTop  = widget.dataset.tirageSavedTop;
                    if (widget.dataset.tirageStudents)  match.tirageStudents  = widget.dataset.tirageStudents;
                    if (widget.dataset.tirageRemaining) match.tirageRemaining = widget.dataset.tirageRemaining;
                    if (widget.dataset.tirageClassId)   match.tirageClassId   = widget.dataset.tirageClassId;
                    if (widget.dataset.tirageTheme)     match.tirageTheme     = widget.dataset.tirageTheme;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestoreTirage() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                // Pré-parser : stocker les données tirage dans un tableau ordonné
                let tirageList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === 'tirage') tirageList.push(w); });
                } catch(e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="tirage"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.tirage-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'tirage-outer';
                            widget.appendChild(outer);
                        }
                        if (!outer.querySelector('.tirage-inner')) {
                            outer.innerHTML = tirageInnerHTML();
                        }

                        // Correspondance par index d'ordre
                        const saved = tirageList[idx];

                        if (saved) {
                            if (saved.tirageStudents)  widget.dataset.tirageStudents  = saved.tirageStudents;
                            if (saved.tirageRemaining) widget.dataset.tirageRemaining = saved.tirageRemaining;
                            if (saved.tirageClassId)   widget.dataset.tirageClassId   = saved.tirageClassId;
                            if (saved.tirageTheme)     widget.dataset.tirageTheme     = saved.tirageTheme;
                            if (saved.tirageSavedLeft) widget.dataset.tirageSavedLeft = saved.tirageSavedLeft;
                            if (saved.tirageSavedTop)  widget.dataset.tirageSavedTop  = saved.tirageSavedTop;
                            const w = saved.tirageW || parseFloat(widget.dataset.tirageW);
                            const h = saved.tirageH || parseFloat(widget.dataset.tirageH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.tirageW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.tirageH = h; }

                            // Restaurer position d'origine si le widget était réduit
                            if (saved.tirageCollapsed) {
                                const origLeft = parseFloat(saved.tirageSavedLeft);
                                const origTop  = parseFloat(saved.tirageSavedTop);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initTirageWidget(widget);

                        // Appliquer l'état réduit APRÈS init (qui remet outer visible)
                        if (saved && saved.tirageCollapsed) {
                            outer.style.display = 'none';
                            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                                  .forEach(el => el.style.display = 'none');
                            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
                            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                                w !== widget && w.dataset.collapsed === '1'
                            );
                            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
                            widget.style.top  = MARGIN_TOP + 'px';
                            widget.style.left = occupiedX  + 'px';
                            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
                            widget.style.overflow = 'hidden'; widget.style.background = '#2a2a3e';
                            widget.style.borderRadius = '8px'; widget.style.border = 'none'; widget.style.padding = '0';
                            const wc = widget.querySelector('.widget-content');
                            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
                            widget.dataset.collapsed = '1';

                            // Créer la mini-barre
                            if (!widget.querySelector('.tirage-mini-bar')) {
                                const miniBar = document.createElement('div');
                                miniBar.className = 'tirage-mini-bar';
                                miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
                                const labelEl = document.createElement('span');
                                labelEl.textContent = '🎲 Tirage au Sort';
                                labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
                                const expandBtn = document.createElement('button');
                                expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
                                expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
                                expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
                                expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
                                expandBtn.addEventListener('click', e => {
                                    e.stopPropagation(); e.preventDefault();
                                    if (typeof widget._tirageExpand === 'function') widget._tirageExpand();
                                });
                                miniBar.appendChild(labelEl);
                                miniBar.appendChild(expandBtn);
                                // Mini-barre draggable
                                miniBar.addEventListener('pointerdown', (e) => {
                                    if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                                    e.stopPropagation(); e.preventDefault();
                                    miniBar.setPointerCapture(e.pointerId);
                                    const startX = e.clientX - widget.offsetLeft;
                                    const startY = e.clientY - widget.offsetTop;
                                    const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                                    const onUp   = () => {
                                        miniBar.removeEventListener('pointermove', onMove);
                                        miniBar.removeEventListener('pointerup', onUp);
                                        const curW = window.innerWidth;
                                        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                                        widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                                        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                                        if (typeof saveBoard === 'function') saveBoard();
                                    };
                                    miniBar.addEventListener('pointermove', onMove);
                                    miniBar.addEventListener('pointerup', onUp);
                                });
                                widget.appendChild(miniBar);
                            }
                        }
                    });
                }, 150);
            };
        }

        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK createWidget — intercepter type 'tirage'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'tirage') return window.createTirageWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
