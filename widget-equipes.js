// =========================================================================
// WIDGET ÉQUIPES ÉQUILIBRÉES — Le Bureau du Prof
// Inspiré de outils_equipes.html (OutilsProfs)
// Graphisme aligné sur le Tirage au sort / Visualiseur : cadre coloré
// arrondi, pastilles « verre », police Quicksand, icônes SVG, couleur du
// cadre au choix (mémorisée dans la sauvegarde du tableau : equipesTheme).
// Les équipes formées s'affichent PAR-DESSUS les prénoms, sur un calque
// qui floute l'arrière-plan.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-equipes.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createEquipesWidget();closeMainMenu()">
//          <span class="mm-ico">👥</span>Équipes équilibrées
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
    const STYLE = `
    /* ── Widget transparent : equipes-outer porte tout le visuel ── */
    .widget[data-type="equipes"],
    .widget[data-type="equipes"]:focus-within {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe (taille + ombre) ── */
    .widget[data-type="equipes"] .equipes-outer {
        --eq-ink:   #14202E;
        --eq-glass: rgba(255,255,255,0.62);
        --eq-bg:    #7FD6A6;
        --eq-op:    #23915A;

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
    .widget[data-type="equipes"] .equipes-outer::-webkit-resizer { display: none; }
    .widget[data-type="equipes"]:hover .equipes-outer,
    .widget[data-type="equipes"]:focus-within .equipes-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Cadre coloré ── */
    .equipes-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px 16px;
        box-sizing: border-box;
        background-color: var(--eq-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        border-radius: 24px;
        overflow: hidden;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--eq-ink);
        user-select: none;
        position: relative;
        container-type: size;
        transition: background-color .3s;
    }

    /* ── En-tête : deux pastilles « verre » ── */
    .equipes-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 0 0;
        flex-shrink: 0;
        cursor: move;
        position: relative;
        z-index: 6;
    }
    .equipes-title,
    .equipes-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--eq-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .equipes-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        pointer-events: none;
    }
    .equipes-title span { overflow: hidden; text-overflow: ellipsis; }
    .equipes-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--eq-op); }
    .equipes-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
    @container (max-width: 460px) { .equipes-title span { display: none; } .equipes-title { padding: 7px 10px; } }

    .equipes-icon-btn {
        width: 32px; height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--eq-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .equipes-icon-btn svg { width: 18px; height: 18px; }
    .equipes-icon-btn:hover,
    .equipes-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .equipes-icon-btn:focus-visible { outline: 2px solid var(--eq-ink); outline-offset: 2px; }
    .equipes-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Scène : tout ce qui est sous l'en-tête (le calque des équipes s'y pose) ── */
    .equipes-stage {
        position: relative;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* ── Zone d'import (avant chargement d'une liste) ── */
    .equipes-import-zone {
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
    .equipes-import-ico svg {
        width: clamp(40px, 12cqmin, 90px);
        height: clamp(40px, 12cqmin, 90px);
        color: var(--eq-op);
        opacity: .75;
    }
    .equipes-import-msg {
        font-size: clamp(13px, 3cqmin, 20px);
        font-weight: 600;
        line-height: 1.4;
        max-width: 460px;
        color: rgba(20,32,46,0.8);
    }
    .equipes-import-btns {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
    }
    .equipes-import-btn {
        font-family: inherit;
        font-size: clamp(13px, 2.6cqmin, 18px);
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 10px 22px;
        cursor: pointer;
        background: var(--eq-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
        transition: filter .15s, transform .1s;
    }
    .equipes-import-btn:hover { filter: brightness(1.1); }
    .equipes-import-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }
    .equipes-class-btn { background: var(--eq-ink) !important; }
    .equipes-open-teams-btn {
        background: #fff !important;
        color: var(--eq-op) !important;
        box-shadow: 0 3px 0 rgba(20,32,46,0.15) !important;
    }
    .equipes-status {
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.55);
    }
    .equipes-status.ok  { color: #23915A; }
    .equipes-status.err { color: #C0392B; }

    /* ── Filtres niveau (pastille « verre ») ── */
    .equipes-level-tabs {
        display: none;
        flex-wrap: wrap;
        gap: 4px;
        padding: 4px;
        align-items: center;
        flex-shrink: 0;
        background: var(--eq-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 18px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .equipes-level-tab {
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
    .equipes-level-tab[data-level]:hover { background: rgba(20,32,46,0.08); }
    .equipes-change-class-btn,
    .equipes-open-tab {
        height: 30px;
        display: flex; align-items: center; justify-content: center;
        background: #fff;
        color: var(--eq-op);
        box-shadow: 0 2px 6px -2px rgba(10,20,35,0.3);
    }
    .equipes-change-class-btn { width: 30px; padding: 0; }
    .equipes-open-tab {
        margin-right: auto;
        gap: 6px;
        padding: 0 12px;
        text-transform: none;
        letter-spacing: 0;
    }
    .equipes-change-class-btn:hover,
    .equipes-open-tab:hover { background: #f4f6f9; }
    .equipes-change-class-btn svg,
    .equipes-open-tab svg { width: 16px; height: 16px; flex-shrink: 0; }
    @container (max-width: 520px) {
        .equipes-open-tab span { display: none; }
        .equipes-open-tab { width: 30px; padding: 0; }
    }

    /* ── Grille élèves (zone blanche arrondie) ── */
    .equipes-body {
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
    .equipes-level-label {
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
    .equipes-body > div:first-child .equipes-level-label { margin-top: 0; }
    .equipes-grid {
        display: grid;
        grid-template-columns: repeat(var(--pill-cols, 5), minmax(0, 1fr));
        gap: var(--pill-gap, 4px);
    }
    .equipes-pill {
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
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: normal;
        overflow-wrap: normal;
        word-break: normal;
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
        color: var(--eq-ink);
    }
    .equipes-pill:hover { border-color: rgba(20,32,46,0.25); transform: translateY(-1px); }
    .equipes-pill.girl { color: #15803D; border-color: #BBF7D0; background: #ECFDF3; }
    .equipes-pill.girl:hover { background: #DCFCE7; border-color: #86EFAC; }
    .equipes-pill.boy  { color: #C2410C; border-color: #FED7AA; background: #FFF4EA; }
    .equipes-pill.boy:hover  { background: #FFEDD5; border-color: #FDBA74; }
    .equipes-pill.absent {
        background: rgba(20,32,46,0.03) !important;
        color: rgba(20,32,46,0.3) !important;
        text-decoration: line-through;
        border: 1.5px dashed rgba(20,32,46,0.15) !important;
        box-shadow: none;
        opacity: 0.75;
        transform: scale(0.95);
    }

    /* ── Réglages : nombre d'équipes + bouton (pastille « verre ») ── */
    .equipes-config {
        display: none;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px 14px;
        margin: 0 auto;
        max-width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        background: var(--eq-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 22px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .equipes-config-label {
        font-size: 12px;
        font-weight: 700;
        color: rgba(20,32,46,0.7);
    }
    .equipes-selector {
        display: flex;
        gap: 2px;
        padding: 3px;
        background: #fff;
        border-radius: 999px;
        box-shadow: inset 0 2px 6px rgba(10,20,35,0.1);
    }
    .equipes-num-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        background: transparent;
        color: var(--eq-ink);
        transition: background .15s, color .15s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-family: inherit;
    }
    .equipes-num-btn:hover { background: rgba(20,32,46,0.08); }
    .equipes-num-btn.selected {
        background: var(--eq-op);
        color: #fff;
        box-shadow: 0 2px 0 rgba(0,0,0,0.2);
    }
    .equipes-generate-btn,
    .equipes-view-btn {
        padding: 9px 20px;
        font-size: clamp(13px, 2.4cqmin, 17px);
        font-weight: 700;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        font-family: inherit;
        background: var(--eq-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
        transition: filter .15s, transform .1s;
    }
    .equipes-view-btn { background: #fff; color: var(--eq-op); box-shadow: 0 3px 0 rgba(20,32,46,0.15); }
    .equipes-generate-btn:hover,
    .equipes-view-btn:hover { filter: brightness(1.08); }
    .equipes-generate-btn:active,
    .equipes-view-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }

    /* ── Calque des équipes : par-dessus les prénoms, arrière-plan flouté ── */
    .equipes-teams-overlay {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: none;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
        box-sizing: border-box;
        border-radius: 18px;
        background: rgba(255,255,255,0.22);
        -webkit-backdrop-filter: blur(12px) saturate(1.1);
                backdrop-filter: blur(12px) saturate(1.1);
        box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.45);
        container-type: size;
    }
    .equipes-teams-overlay.open { display: flex; animation: eqFadeIn .25s ease both; }
    @keyframes eqFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .equipes-teams-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }
    .equipes-teams-title,
    .equipes-teams-actions {
        display: flex;
        align-items: center;
        background: var(--eq-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .equipes-teams-title {
        gap: 8px;
        padding: 7px 14px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
    }
    .equipes-teams-title small {
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.6);
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .equipes-teams-actions { margin-left: auto; gap: 2px; padding: 4px; flex-shrink: 0; }
    .equipes-act-btn {
        height: 32px;
        padding: 0 12px;
        border-radius: 999px;
        border: none;
        background: transparent;
        color: var(--eq-ink);
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: background .15s, filter .15s;
    }
    .equipes-act-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
    .equipes-act-btn:hover { background: rgba(20,32,46,0.1); }
    .equipes-act-btn:disabled { opacity: .5; cursor: default; }
    .equipes-act-btn.primary { background: var(--eq-op); color: #fff; }
    .equipes-act-btn.primary:hover { filter: brightness(1.1); }
    .equipes-act-btn.danger { color: #C0392B; }
    @container (max-width: 700px) {
        .equipes-act-btn span { display: none; }
        .equipes-act-btn { width: 32px; padding: 0; justify-content: center; }
        .equipes-teams-title small { display: none; }
    }

    .equipes-results-wrapper {
        flex: 1;
        min-height: 0;
        position: relative;
        display: flex;
    }
    .equipes-results {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        scrollbar-width: none;
    }
    .equipes-results::-webkit-scrollbar { display: none; }
    .equipes-results-grid {
        --team-fs: 16px;
        display: grid;
        grid-template-columns: repeat(var(--team-cols, 2), minmax(0, 1fr));
        gap: var(--team-gap, 10px);
        align-items: start;
    }
    .equipes-team-card {
        min-width: 0;
        background: rgba(255,255,255,0.95);
        border-radius: 16px;
        border-top: 5px solid var(--team-color, var(--eq-op));
        padding: calc(var(--team-fs) * 0.55) calc(var(--team-fs) * 0.7) calc(var(--team-fs) * 0.6);
        box-shadow: 0 10px 22px -14px rgba(10,20,35,0.6);
        animation: eqCardIn .35s cubic-bezier(.175,.885,.32,1.275) both;
        animation-delay: calc(var(--i, 0) * 60ms);
    }
    @keyframes eqCardIn {
        from { opacity: 0; transform: translateY(10px) scale(.96); }
        to   { opacity: 1; transform: none; }
    }
    .equipes-team-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding-bottom: calc(var(--team-fs) * 0.35);
        margin-bottom: calc(var(--team-fs) * 0.35);
        border-bottom: 1.5px solid rgba(20,32,46,0.08);
    }
    .equipes-team-title {
        font-size: calc(var(--team-fs) * 1.0);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .5px;
        color: var(--team-color, var(--eq-op));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }
    .equipes-team-stats { display: flex; gap: 4px; flex-shrink: 0; }
    .equipes-chip {
        font-size: max(9px, calc(var(--team-fs) * 0.55));
        font-weight: 700;
        padding: 1px 7px;
        border-radius: 999px;
        line-height: 1.5;
    }
    .equipes-chip.f { background: #ECFDF3; color: #15803D; }
    .equipes-chip.m { background: #FFF4EA; color: #C2410C; }
    .equipes-team-member {
        display: flex;
        align-items: center;
        gap: calc(var(--team-fs) * 0.35);
        font-size: var(--team-fs);
        font-weight: 700;
        line-height: 1.3;
        padding: calc(var(--team-fs) * 0.1) 0;
        min-width: 0;
    }
    .equipes-tag {
        font-size: max(8px, calc(var(--team-fs) * 0.5));
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 999px;
        color: #fff;
        min-width: 2.6em;
        text-align: center;
        flex-shrink: 0;
    }
    .equipes-member-name {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .equipes-name-f { color: #15803D; }
    .equipes-name-m { color: #C2410C; }

    /* ── Boutons de défilement (si les équipes ne tiennent pas) ── */
    .equipes-scroll-btn {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 28px;
        border-radius: 999px;
        border: none;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 4px 12px -4px rgba(10,20,35,0.45);
        color: var(--eq-op);
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s, background .15s;
        line-height: 1;
    }
    .equipes-scroll-btn.visible { opacity: 1; pointer-events: auto; }
    .equipes-scroll-btn:hover { background: #fff; }
    .equipes-scroll-btn:active { transform: translateX(-50%) scale(0.95); }
    .equipes-scroll-up   { top: 4px; }
    .equipes-scroll-down { bottom: 4px; }

    /* ── Petits cadres : on compacte ── */
    @container (max-height: 520px) {
        .equipes-inner { gap: 7px; }
        .equipes-stage { gap: 7px; }
        .equipes-header { padding-top: 10px; }
        .equipes-title { padding: 5px 12px 5px 10px; font-size: 13px; }
        .equipes-tools { padding: 3px 10px 3px 4px; }
        .equipes-icon-btn { width: 28px; height: 28px; }
        .equipes-level-tab { padding: 3px 10px; }
        .equipes-change-class-btn, .equipes-open-tab { height: 26px; }
        .equipes-change-class-btn { width: 26px; }
        .equipes-body { padding: 8px 10px; }
        .equipes-config { padding: 5px 10px; gap: 6px 10px; }
        .equipes-num-btn { width: 26px; height: 26px; font-size: 12px; }
        .equipes-generate-btn, .equipes-view-btn { padding: 6px 14px; }
    }
    @container (max-height: 380px) {
        .equipes-config-label { display: none; }
    }

    /* ── Modal confirmation ── */
    .equipes-modal-overlay {
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
    .equipes-modal-overlay.open { display: flex; }
    .equipes-modal-box {
        background: rgba(255,255,255,0.97);
        padding: 20px;
        border-radius: 18px;
        width: 100%;
        max-width: 320px;
        color: var(--eq-ink);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
    }
    .equipes-modal-title {
        font-size: 15px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 7px;
    }
    .equipes-modal-text {
        font-size: 13px;
        color: rgba(20,32,46,0.7);
        text-align: center;
        line-height: 1.5;
        font-weight: 600;
        white-space: pre-line;
        margin: 0;
    }
    .equipes-modal-text:empty { display: none; }
    .equipes-modal-btns {
        display: flex;
        gap: 8px;
        margin-top: 14px;
    }
    .equipes-modal-btn {
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
    .equipes-modal-btn:active { transform: scale(0.96); }
    .equipes-modal-cancel { background: rgba(20,32,46,0.08); color: var(--eq-ink); }
    .equipes-modal-cancel:hover { background: rgba(20,32,46,0.15); }
    .equipes-modal-confirm { background: var(--eq-op); color: #fff; }
    .equipes-modal-confirm:hover { filter: brightness(1.1); }
    .equipes-modal-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; max-height: 220px; overflow-y: auto; }
    .equipes-modal-list:empty { display: none; }
    .equipes-modal-list button {
        padding: 9px 12px; border-radius: 999px; border: 1.5px solid rgba(20,32,46,0.12); background: #fff;
        color: var(--eq-op); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
        transition: background .15s, border-color .15s;
    }
    .equipes-modal-list button:hover { background: #F4F6F9; border-color: var(--eq-op); }
    .equipes-modal-list button.file { color: rgba(20,32,46,0.7); }
    .equipes-modal-list button.file:hover { border-color: rgba(20,32,46,0.3); }
    .equipes-modal-input {
        display: block;
        width: 100%;
        box-sizing: border-box;
        margin-top: 10px;
        padding: 9px 14px;
        border: 1.5px solid rgba(20,32,46,0.15);
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        color: var(--eq-ink);
        user-select: text;
    }
    .equipes-modal-input:focus { outline: none; border-color: var(--eq-op); }

    /* ── Panneaux (aide, couleur) ── */
    .equipes-panel {
        display: none;
        position: absolute;
        top: 62px;
        right: 16px;
        width: 300px;
        max-width: calc(100% - 32px);
        max-height: calc(100% - 80px);
        overflow-y: auto;
        box-sizing: border-box;
        z-index: 30;
        flex-direction: column;
        gap: 10px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        color: var(--eq-ink);
    }
    .equipes-panel.show { display: flex; }
    .equipes-panel-title { font-size: 13px; font-weight: 700; }
    .equipes-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .equipes-help-list li { margin-bottom: 4px; }
    .equipes-help-list em { font-style: normal; font-weight: 700; color: var(--eq-op); }
    .equipes-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .equipes-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .equipes-swatch.is-on { border-color: var(--eq-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* La règle .widget { touch-action: none } du tableau bloque aussi le
       défilement au doigt : on le réautorise dans la liste des prénoms et
       dans les résultats, et on évite le délai / zoom du double-tap. */
    .widget[data-type="equipes"] .equipes-body,
    .widget[data-type="equipes"] .equipes-results { touch-action: pan-y; }
    .widget[data-type="equipes"] .equipes-pill,
    .widget[data-type="equipes"] .equipes-inner button { touch-action: manipulation; }

    /* ── Téléphone : plein écran (classe .phone-fs posée par index.html) ──
       Décalage à gauche pour laisser les onglets latéraux visibles, et
       passage sous les onglets (z-index 50005) et les panneaux (50000). */
    .widget.phone-fs[data-type="equipes"] {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
        z-index: 49990 !important;
    }
    .widget.phone-fs[data-type="equipes"] .equipes-outer {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        border-radius: 0 !important;
        outline: none !important;
    }
    .widget.phone-fs[data-type="equipes"] .equipes-inner {
        border-radius: 0 !important;
        padding: 0 10px 10px;
    }
    .widget.phone-fs[data-type="equipes"] .equipes-header {
        cursor: default;
        padding-right: 56px; /* laisse la place au bouton ⤡ de sortie du plein écran */
    }

    /* ── Plein écran du bouton vert (classe .wf-max) ── */
    .widget.wf-max[data-type="equipes"] .equipes-outer { outline: none !important; }
    .widget.wf-max[data-type="equipes"] .equipes-header { cursor: default; }
    /* Marge à gauche pour laisser visibles les onglets des panneaux latéraux */
    .widget.wf-max[data-type="equipes"] .equipes-inner {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
    }

    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget.wf-max[data-type="equipes"] .equipes-inner {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            padding: 0 10px 10px;
        }
    }
    `;

    if (!document.getElementById('equipes-widget-style')) {
        const s = document.createElement('style');
        s.id = 'equipes-widget-style';
        s.textContent = STYLE;
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
    const EQUIPES_LEVEL_COLORS = {
        'CP': '#ec4899', 'CE1': '#3b82f6', 'CE2': '#eab308',
        'CM1': '#ef4444', 'CM2': '#22c55e', 'AUTRE': '#a855f7'
    };
    const EQUIPES_LEVEL_ORDER = ['CP','CE1','CE2','CM1','CM2','AUTRE'];
    const EQUIPES_THEME       = 'var(--eq-op)';   // couleur d'accent du cadre choisi
    const ALGORITHM_ITERATIONS = 300;
    const TEAM_MIN = 2;
    const TEAM_MAX = 8;
    const DEFAULT_TEAM_COUNT = 4;
    const SAVE_FILE_TYPE = 'bdp-equipes'; // identifiant des fichiers .json d'équipes

    // Couleur de chaque équipe (bandeau de la carte + titre)
    const TEAM_COLORS = ['#2F6FB3', '#C2456E', '#23915A', '#B9770E', '#6A4FC2', '#0E8A9A', '#C0392B', '#4A5868'];

    // Taille automatique des étiquettes prénoms (voir updatePillScale)
    const PILL_FS_MIN = 6;
    const PILL_FS_MAX = 30;
    const PILL_COLS   = [5, 4, 6, 3, 7, 8, 2, 9, 10];

    // Taille automatique du texte des équipes (voir fitTeams)
    const TEAM_FS_MIN = 11;
    const TEAM_FS_MAX = 44;

    // Couleurs du cadre (mêmes que le Visualiseur / Tirage)
    const EQUIPES_THEMES = {
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };
    const DEFAULT_THEME = 'vert';

    // ── Icônes ────────────────────────────────────────────────────────────
    const ICON_USERS   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.9.3 5 2.6 5 5.8"/></svg>';
    const ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';
    const ICON_FOLDER  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
    const ICON_OPEN    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17"/></svg>';
    const ICON_SAVE    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="5" rx="1"/></svg>';
    const ICON_PDF     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
    const ICON_SHUFFLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h4v4"/><path d="M4 20 20 4"/><path d="M20 16v4h-4"/><path d="M15 15l5 5"/><path d="M4 4l5 5"/></svg>';
    const ICON_LIST    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="7" height="7" rx="2"/><rect x="13.5" y="4" width="7" height="7" rx="2"/><rect x="3.5" y="14" width="7" height="6" rx="2"/><rect x="13.5" y="14" width="7" height="6" rx="2"/></svg>';
    const ICON_TRASH   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/></svg>';

    // ── HTML interne partagé (création + restauration) ────────────────────
    function equipesInnerHTML() {
        const swatches = Object.keys(EQUIPES_THEMES).map(id =>
            '<button class="equipes-swatch" data-theme="' + id + '" title="' + EQUIPES_THEMES[id].name +
            '" style="background:' + EQUIPES_THEMES[id].bg + '"></button>'
        ).join('');
        return `
        <div class="equipes-inner">
            <div class="equipes-header">
                <div class="equipes-title">${ICON_USERS}<span>Équipes équilibrées</span></div>
                <div class="equipes-tools">
                    <button class="equipes-icon-btn equipes-theme-btn" title="Couleur du cadre" onmousedown="event.stopPropagation()">${ICON_PALETTE}</button>
                    <button class="equipes-icon-btn equipes-help-btn" title="Aide" onmousedown="event.stopPropagation()">${ICON_HELP}</button>
                    <span class="equipes-sep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                    </div>
                </div>
            </div>
            <div class="equipes-panel equipes-help-popup">
                <div class="equipes-panel-title">Aide</div>
                <ul class="equipes-help-list">
                    <li>Utilisez une liste de classe, ou importez un fichier (.txt ou .csv).<br>Format : <em>Prénom;NOM;sexe;NIVEAU;date</em></li>
                    <li>Cliquez sur un prénom pour le marquer absent (il ne sera pas inclus).</li>
                    <li>Choisissez le nombre d'équipes (2 à 8), puis <em>Former les équipes</em> : elles sont équilibrées par genre et par niveau.</li>
                    <li>Les équipes s'affichent par-dessus la liste. <em>Prénoms</em> revient à la liste, <em>Refaire</em> forme de nouvelles équipes.</li>
                    <li><em>Enregistrer</em> télécharge les équipes (.json), le bouton d'ouverture les recharge, <em>PDF</em> crée un fichier à imprimer.</li>
                    <li>La palette change la couleur du cadre.</li>
                </ul>
            </div>
            <div class="equipes-panel equipes-theme-popup">
                <div class="equipes-panel-title">Couleur du cadre</div>
                <div class="equipes-swatches">${swatches}</div>
            </div>
            <div class="equipes-stage">
                <div class="equipes-import-zone">
                    <div class="equipes-import-ico">${ICON_USERS}</div>
                    <div class="equipes-import-msg">Chargez une liste d'élèves pour former des équipes équilibrées.</div>
                    <div class="equipes-import-btns">
                        <button class="equipes-import-btn equipes-class-btn" style="display:none;">📋 Utiliser une liste de classe</button>
                        <button class="equipes-import-btn equipes-file-btn">📄 Importer une liste d'élèves</button>
                        <button class="equipes-import-btn equipes-open-teams-btn">📥 Ouvrir des équipes (.json)</button>
                    </div>
                    <input type="file" class="equipes-teams-file-input" accept=".json,application/json" style="display:none;">
                    <input type="file" class="equipes-file-input" accept=".txt,.csv" style="display:none;">
                    <div class="equipes-status">Format : Prénom;NOM;sexe;NIVEAU;date</div>
                </div>
                <div class="equipes-level-tabs"></div>
                <div class="equipes-body" style="display:none;"></div>
                <div class="equipes-config">
                    <span class="equipes-config-label">Nombre d'équipes</span>
                    <div class="equipes-selector"></div>
                    <button class="equipes-generate-btn">⚖️ Former les équipes</button>
                    <button class="equipes-view-btn" style="display:none;">👥 Voir les équipes</button>
                </div>
                <div class="equipes-teams-overlay">
                    <div class="equipes-teams-bar">
                        <div class="equipes-teams-title"><span class="equipes-teams-count">Équipes</span><small class="equipes-teams-sub"></small></div>
                        <div class="equipes-teams-actions">
                            <button class="equipes-act-btn equipes-back-btn" title="Revenir à la liste des prénoms">${ICON_LIST}<span>Prénoms</span></button>
                            <button class="equipes-act-btn equipes-redo-btn" title="Former de nouvelles équipes">${ICON_SHUFFLE}<span>Refaire</span></button>
                            <button class="equipes-act-btn equipes-save-btn" title="Enregistrer ces équipes dans un fichier .json">${ICON_SAVE}<span>Enregistrer</span></button>
                            <button class="equipes-act-btn equipes-pdf-btn" title="Exporter les équipes en PDF">${ICON_PDF}<span>PDF</span></button>
                            <button class="equipes-act-btn danger equipes-reset-btn" title="Effacer les équipes">${ICON_TRASH}<span>Effacer</span></button>
                        </div>
                    </div>
                    <div class="equipes-results-wrapper">
                        <button class="equipes-scroll-btn equipes-scroll-up" title="Défiler vers le haut">▲</button>
                        <div class="equipes-results">
                            <div class="equipes-results-grid"></div>
                        </div>
                        <button class="equipes-scroll-btn equipes-scroll-down" title="Défiler vers le bas">▼</button>
                    </div>
                </div>
            </div>
            <div class="equipes-modal-overlay">
                <div class="equipes-modal-box">
                    <div class="equipes-modal-title">Confirmation</div>
                    <p class="equipes-modal-text"></p>
                    <input type="text" class="equipes-modal-input" maxlength="60" style="display:none;">
                    <div class="equipes-modal-list"></div>
                    <div class="equipes-modal-btns">
                        <button class="equipes-modal-btn equipes-modal-cancel">Annuler</button>
                        <button class="equipes-modal-btn equipes-modal-confirm">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initEquipesWidget = function (widget) {

        const outer = widget.querySelector('.equipes-outer');

        // Bloquer la remontée mousedown depuis l'intérieur
        outer.addEventListener('mousedown', e => e.stopPropagation());

        // Même chose au doigt / au stylet (on laisse passer l'en-tête, qui sert à déplacer)
        if (!outer._touchGuard) {
            outer._touchGuard = true;
            const stopIfNotHeader = (e) => {
                if (e.target.closest && e.target.closest('.equipes-header')) return;
                e.stopPropagation();
            };
            outer.addEventListener('touchstart',  stopIfNotHeader, { passive: true });
            outer.addEventListener('pointerdown', stopIfNotHeader);
        }

        // ── Header draggable (une seule fois) ─────────────────────────────
        const equipesHeader = widget.querySelector('.equipes-header');
        if (equipesHeader && !equipesHeader._dragInit) {
            equipesHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            equipesHeader.addEventListener('mousedown',  onHeaderDown);
            equipesHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const importZone     = widget.querySelector('.equipes-import-zone');
        const importBtn      = widget.querySelector('.equipes-file-btn');
        const openTeamsBtn   = widget.querySelector('.equipes-open-teams-btn');
        const teamsFileInput = widget.querySelector('.equipes-teams-file-input');
        const classBtn       = widget.querySelector('.equipes-class-btn');
        const fileInput      = widget.querySelector('.equipes-file-input');
        const statusEl       = widget.querySelector('.equipes-status');
        const levelTabs      = widget.querySelector('.equipes-level-tabs');
        const body           = widget.querySelector('.equipes-body');
        const configPanel    = widget.querySelector('.equipes-config');
        const selector       = widget.querySelector('.equipes-selector');
        const generateBtn    = widget.querySelector('.equipes-generate-btn');
        const viewBtn        = widget.querySelector('.equipes-view-btn');
        const teamsOverlay   = widget.querySelector('.equipes-teams-overlay');
        const teamsCountEl   = widget.querySelector('.equipes-teams-count');
        const teamsSubEl     = widget.querySelector('.equipes-teams-sub');
        const backBtn        = widget.querySelector('.equipes-back-btn');
        const redoBtn        = widget.querySelector('.equipes-redo-btn');
        const saveBtn        = widget.querySelector('.equipes-save-btn');
        const pdfBtn         = widget.querySelector('.equipes-pdf-btn');
        const resetBtn       = widget.querySelector('.equipes-reset-btn');
        const resultsPanel   = widget.querySelector('.equipes-results');
        const resultsGrid    = widget.querySelector('.equipes-results-grid');
        const scrollUpBtn    = widget.querySelector('.equipes-scroll-up');
        const scrollDownBtn  = widget.querySelector('.equipes-scroll-down');
        const modalOverlay   = widget.querySelector('.equipes-modal-overlay');
        const modalInput     = widget.querySelector('.equipes-modal-input');
        const helpBtn        = widget.querySelector('.equipes-help-btn');
        const helpPopup      = widget.querySelector('.equipes-help-popup');
        const themeBtn       = widget.querySelector('.equipes-theme-btn');
        const themePopup     = widget.querySelector('.equipes-theme-popup');

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        const wfMin   = widget.querySelector('[data-role="wf-min"]');
        const wfMax   = widget.querySelector('[data-role="wf-max"]');
        const wfClose = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;

        function equipesCollapse() {
            if (_isMax) setMax(false);
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') {
                window.exitPhoneFullscreen(widget);
            }
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.equipesW) || 800;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.equipesH) || 600;
            widget.dataset.equipesW = savedW;
            widget.dataset.equipesH = savedH;

            // Sauvegarder la position ORIGINALE avant de modifier le widget
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.equipesLeftSaved = widget.offsetLeft;
            widget.dataset.equipesTopSaved  = widget.offsetTop;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

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

            const miniBar = document.createElement('div');
            miniBar.className = 'equipes-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '👥 Équipes équilibrées';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); equipesExpand(); });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

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

        function equipesExpand() {
            const savedW    = parseFloat(widget.dataset.equipesW)        || 800;
            const savedH    = parseFloat(widget.dataset.equipesH)        || 600;
            const savedLeft = parseFloat(widget.dataset.equipesLeftSaved);
            const savedTop  = parseFloat(widget.dataset.equipesTopSaved);

            widget.querySelectorAll('.equipes-mini-bar').forEach(el => el.remove());

            widget.removeAttribute('style');
            widget.style.left = (!isNaN(savedLeft) ? savedLeft : widget.offsetLeft) + 'px';
            widget.style.top  = (!isNaN(savedTop)  ? savedTop  : widget.offsetTop)  + 'px';

            const wc = widget.querySelector('.widget-content');
            if (wc) wc.removeAttribute('style');

            widget.dataset.collapsed = '0';

            outer.style.display = '';
            outer.style.width   = savedW + 'px';
            outer.style.height  = savedH + 'px';

            outer.innerHTML = equipesInnerHTML();
            initEquipesWidget(widget);

            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        widget._equipesExpand = equipesExpand;

        if (wfMin) {
            wfMin.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            wfMin.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); equipesCollapse(); });
        }
        // Plein écran (bouton vert). Sur téléphone, il est activé dès l'ouverture.
        function setMax(on) {
            _isMax = !!on;
            const inner = widget.querySelector('.equipes-inner');
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
            requestAnimationFrame(() => { updatePillScale(); fitTeams(); });
        }
        widget._wfSetMax = setMax;
        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                setMax(!_isMax);
            });
        }
        const _maxInner = widget.querySelector('.equipes-inner');
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
            panel.addEventListener('click', (e) => e.stopPropagation());
        });
        if (!widget._equipesPanelsDocClose) {
            widget._equipesPanelsDocClose = true;
            document.addEventListener('click', () => {
                widget.querySelectorAll('.equipes-panel.show').forEach(p => p.classList.remove('show'));
                widget.querySelectorAll('.equipes-icon-btn.is-on').forEach(b => b.classList.remove('is-on'));
            });
        }

        // ── Couleur du cadre (mémorisée dans le tableau) ──────────────────
        function applyTheme(id) {
            if (!EQUIPES_THEMES[id]) id = DEFAULT_THEME;
            widget.dataset.equipesTheme = id;
            outer.style.setProperty('--eq-bg', EQUIPES_THEMES[id].bg);
            outer.style.setProperty('--eq-op', EQUIPES_THEMES[id].op);
            widget.querySelectorAll('.equipes-swatch').forEach(s =>
                s.classList.toggle('is-on', s.dataset.theme === id));
        }
        widget.querySelectorAll('.equipes-swatch').forEach(s => {
            s.addEventListener('click', (e) => {
                e.stopPropagation();
                applyTheme(s.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });

        // ── État ──────────────────────────────────────────────────────────
        let allStudents    = [];
        let absentSet      = new Set();
        let selectedCount  = DEFAULT_TEAM_COUNT;
        let currentLevel   = 'tous';
        let savedTeams     = null;
        let teamsVisible   = false;
        let classId        = widget.dataset.equipesClassId || null; // liste de classe liée

        // ── Normalisation des données élèves ─────────────────────────────
        // Supporte le format tirage (prenom/nom/sexe/niveau) et le format outils (identite/sexe/niveau)
        function normalizeStudents(raw) {
            return raw.map((s, i) => {
                if (s.prenom !== undefined) {
                    return {
                        id:     s.id !== undefined ? s.id : i,
                        prenom: s.prenom,
                        nom:    s.nom || '',
                        sexe:   s.sexe || '',
                        niveau: (s.niveau || 'AUTRE').trim().toUpperCase()
                    };
                } else if (s.identite !== undefined) {
                    const parts = s.identite.trim().split(' ');
                    return {
                        id:     s.id !== undefined ? s.id : i,
                        prenom: parts[0] || '',
                        nom:    parts.slice(1).join(' ') || '',
                        sexe:   s.sexe || '',
                        niveau: (s.niveau || 'AUTRE').toString().trim().toUpperCase()
                    };
                }
                return s;
            });
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
                    niveau: (parts[3] || 'AUTRE').trim().toUpperCase()
                });
            });
            if (!students.length) { setStatus('Aucun élève trouvé.', 'err'); return; }
            classId = null;
            delete widget.dataset.equipesClassId;
            allStudents  = students;
            absentSet    = new Set();
            currentLevel = 'tous';
            setStatus('✓ ' + students.length + ' élève(s) chargé(s)', 'ok');
            try { localStorage.setItem('tirage_students_list', JSON.stringify(allStudents)); } catch(e) {}
            resetResults();
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

        function resetResults() {
            savedTeams = null;
            resultsGrid.innerHTML = '';
            setTeamsVisible(false);
        }

        function loadFromClass(id) {
            const CL = window.ClasseListe;
            if (!CL) return;
            const list = CL.getStudents(id);
            if (!list.length) {
                showAlert('Cette classe ne contient aucun élève.');
                return;
            }
            classId = id;
            widget.dataset.equipesClassId = id;
            allStudents  = normalizeStudents(list);
            absentSet    = new Set();
            currentLevel = 'tous';
            resetResults();
            persistData();
            showLoadedState();
        }

        function showClassPicker() {
            const classes = classesAvailable();
            if (!classes.length) { fileInput.click(); return; }
            modalOverlay.querySelector('.equipes-modal-title').textContent = 'Choisir une liste';
            modalOverlay.querySelector('.equipes-modal-text').textContent  = '';
            const listEl = modalOverlay.querySelector('.equipes-modal-list');
            listEl.innerHTML = '';
            hideModalInput();
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
            modalOverlay.querySelector('.equipes-modal-cancel').style.display  = '';
            modalOverlay.querySelector('.equipes-modal-confirm').style.display = 'none';
            modalOverlay.classList.add('open');
        }

        // Synchronisation : la liste de classe a été modifiée → mise à jour sans perdre absents ni équipes
        function syncFromClass() {
            refreshClassBtn();
            const CL = window.ClasseListe;
            if (!classId || !CL) return;
            if (!CL.getClass(classId)) {
                classId = null;
                delete widget.dataset.equipesClassId;
                return;
            }
            const fresh = normalizeStudents(CL.getStudents(classId));
            const byId  = new Map(fresh.map(s => [String(s.id), s]));
            absentSet = new Set(Array.from(absentSet).filter(id => byId.has(String(id))));
            if (savedTeams) {
                savedTeams = savedTeams.map(t => t.map(s => byId.get(String(s.id))).filter(Boolean));
                if (!savedTeams.some(t => t.length)) savedTeams = null;
            }
            allStudents = fresh;
            persistData();
            showLoadedState();
            if (savedTeams) { renderTeams(savedTeams); setTeamsVisible(teamsVisible); }
            else resetResults();
        }

        if (window.ClasseListe) {
            if (typeof widget._equipesClassOff === 'function') widget._equipesClassOff();
            const onClassChange = () => {
                if (!document.contains(widget)) { window.removeEventListener('bdp-classes-changed', onClassChange); return; }
                syncFromClass();
            };
            window.addEventListener('bdp-classes-changed', onClassChange);
            widget._equipesClassOff = () => window.removeEventListener('bdp-classes-changed', onClassChange);
        }
        if (classBtn) classBtn.addEventListener('click', showClassPicker);

        function showLoadedState() {
            importZone.style.display  = 'none';
            body.style.display        = 'flex';
            configPanel.style.display = 'flex';
            buildLevelTabs();
            buildSelector();
            renderAttendance();
            updateViewBtn();
        }

        function setStatus(msg, cls) {
            statusEl.textContent = msg;
            statusEl.className   = 'equipes-status' + (cls ? ' ' + cls : '');
        }

        function persistData() {
            widget.dataset.equipesStudents = JSON.stringify(allStudents);
            widget.dataset.equipesAbsents  = JSON.stringify(Array.from(absentSet));
            widget.dataset.equipesCount    = selectedCount;
            widget.dataset.equipesTeams    = savedTeams ? JSON.stringify(savedTeams) : '';
            widget.dataset.equipesTeamsHidden = (savedTeams && !teamsVisible) ? '1' : '';
        }

        // ── Onglets niveau ────────────────────────────────────────────────
        function buildLevelTabs() {
            const niveaux = [...new Set(allStudents.map(s => s.niveau))].sort((a, b) =>
                (EQUIPES_LEVEL_ORDER.indexOf(a) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(a)) -
                (EQUIPES_LEVEL_ORDER.indexOf(b) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(b))
            );
            levelTabs.innerHTML = '';
            levelTabs.style.display = 'flex';

            const changeBtn = document.createElement('button');
            changeBtn.className = 'equipes-level-tab equipes-change-class-btn';
            changeBtn.title = 'Charger une autre liste (classe ou fichier)';
            changeBtn.innerHTML = ICON_FOLDER;
            changeBtn.addEventListener('click', showClassPicker);
            levelTabs.appendChild(changeBtn);

            const openTab = document.createElement('button');
            openTab.className = 'equipes-level-tab equipes-open-tab';
            openTab.title = 'Ouvrir un fichier d\'équipes (.json)';
            openTab.innerHTML = ICON_OPEN + '<span>Ouvrir des équipes</span>';
            openTab.addEventListener('click', openTeamsFile);
            levelTabs.appendChild(openTab);

            if (niveaux.length > 1) {
                levelTabs.appendChild(makeTab('Tous', 'tous'));
                niveaux.forEach(niv => levelTabs.appendChild(makeTab(niv, niv)));
                setActiveTab(currentLevel);
            }
        }

        function makeTab(label, value) {
            const tab = document.createElement('button');
            tab.className    = 'equipes-level-tab';
            tab.textContent  = label;
            tab.dataset.level = value;
            tab.addEventListener('click', () => { currentLevel = value; setActiveTab(value); renderAttendance(); });
            return tab;
        }

        function setActiveTab(value) {
            levelTabs.querySelectorAll('.equipes-level-tab[data-level]').forEach(t => {
                const isActive = t.dataset.level === value;
                const color    = t.dataset.level === 'tous' ? EQUIPES_THEME : getLevelColor(t.dataset.level);
                t.style.backgroundColor = isActive ? color  : '';
                t.style.color           = isActive ? '#fff' : '';
            });
        }

        function getLevelColor(niv) { return EQUIPES_LEVEL_COLORS[niv] || '#a855f7'; }

        // ── Sélecteur nombre d'équipes ────────────────────────────────────
        function buildSelector() {
            selector.innerHTML = '';
            for (let i = TEAM_MIN; i <= TEAM_MAX; i++) {
                const btn = document.createElement('button');
                btn.className = 'equipes-num-btn' + (i === selectedCount ? ' selected' : '');
                btn.textContent = i;
                btn.dataset.count = i;
                btn.addEventListener('click', () => selectCount(i));
                selector.appendChild(btn);
            }
        }

        function selectCount(count) {
            selectedCount = count;
            selector.querySelectorAll('.equipes-num-btn').forEach(btn => {
                btn.classList.toggle('selected', parseInt(btn.dataset.count) === count);
            });
            persistData();
        }

        // ── Rendu grille présence ─────────────────────────────────────────
        function getFiltered() {
            return currentLevel === 'tous' ? allStudents : allStudents.filter(s => s.niveau === currentLevel);
        }

        function hasDupPrenom(p) {
            return allStudents.filter(s => s.prenom.toLowerCase() === p.toLowerCase()).length > 1;
        }

        function displayName(s) {
            return hasDupPrenom(s.prenom) ? s.prenom + ' ' + ((s.nom || '').charAt(0) || '') + '.' : s.prenom;
        }

        // Toucher fiable sur téléphone/tablette (voir widget-tirage)
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
                if (moved > 10) return;
                lastTouchTap = Date.now();
                e.preventDefault();
                fn();
            });
            el.addEventListener('pointercancel', () => { start = null; });
            el.addEventListener('click', () => {
                if (Date.now() - lastTouchTap < 600) return;
                fn();
            });
        }

        function renderAttendance() {
            body.innerHTML = '';
            const students = getFiltered();
            const groups   = {};
            students.forEach(s => { if (!groups[s.niveau]) groups[s.niveau] = []; groups[s.niveau].push(s); });

            const sortedLevels = Object.keys(groups).sort((a, b) =>
                (EQUIPES_LEVEL_ORDER.indexOf(a) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(a)) -
                (EQUIPES_LEVEL_ORDER.indexOf(b) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(b))
            );

            sortedLevels.forEach(niv => {
                const block = document.createElement('div');
                if (sortedLevels.length > 1) {
                    const lbl = document.createElement('div');
                    lbl.className = 'equipes-level-label';
                    lbl.style.color = getLevelColor(niv);
                    lbl.textContent = niv;
                    block.appendChild(lbl);
                }
                const grid = document.createElement('div');
                grid.className = 'equipes-grid';
                groups[niv].sort((a, b) => a.prenom.localeCompare(b.prenom)).forEach(s => {
                    const pill = document.createElement('div');
                    pill.className = 'equipes-pill';
                    const isAbsent = absentSet.has(String(s.id));
                    if (isAbsent) {
                        pill.classList.add('absent');
                    } else {
                        const sx = (s.sexe || '').toLowerCase();
                        const pillCls = sx.startsWith('f') ? 'girl' : (sx ? 'boy' : '');
                        if (pillCls) pill.classList.add(pillCls);
                    }
                    pill.textContent = displayName(s);
                    pill.title       = s.prenom + ' ' + s.nom + (isAbsent ? ' (absent)' : '');
                    onTap(pill, () => toggleAbsent(s.id));
                    grid.appendChild(pill);
                });
                block.appendChild(grid);
                body.appendChild(block);
            });
            updatePillScale();
        }

        function toggleAbsent(id) {
            const key = String(id);
            if (absentSet.has(key)) absentSet.delete(key);
            else absentSet.add(key);
            persistData();
            renderAttendance();
        }

        // ── Algorithme de génération d'équipes ────────────────────────────
        generateBtn.addEventListener('click', generateBalancedTeams);

        function isFemale(s) { return (s.sexe || '').toLowerCase().startsWith('f'); }

        function getTeamStats(team) {
            const stats = { f: 0, m: 0, total: team.length, levels: {} };
            EQUIPES_LEVEL_ORDER.forEach(level => {
                stats.levels[level] = { f: 0, m: 0, total: 0 };
            });
            team.forEach(s => {
                const female = isFemale(s);
                const level  = s.niveau;
                if (female) stats.f++; else stats.m++;
                if (stats.levels[level]) {
                    stats.levels[level].total++;
                    if (female) stats.levels[level].f++;
                    else stats.levels[level].m++;
                }
            });
            return stats;
        }

        // Score = pénalités (plus bas = mieux)
        function calculateScore(stats1, stats2) {
            let score = 0;
            score += Math.abs(stats1.f - stats2.f) * 10;
            score += Math.abs(stats1.m - stats2.m) * 10;
            EQUIPES_LEVEL_ORDER.forEach(level => {
                score += Math.abs(stats1.levels[level].f     - stats2.levels[level].f)     * 20;
                score += Math.abs(stats1.levels[level].total - stats2.levels[level].total)  * 5;
            });
            return score;
        }

        function generateBalancedTeams() {
            const pool = currentLevel === 'tous'
                ? allStudents
                : allStudents.filter(s => s.niveau === currentLevel);
            const present = pool.filter(s => !absentSet.has(String(s.id)));

            if (present.length < selectedCount) {
                showAlert(`Pas assez d'élèves présents (${present.length}) pour former ${selectedCount} équipes.`);
                return;
            }

            let teams = Array.from({ length: selectedCount }, () => []);
            const shuffled = [...present].sort(() => Math.random() - 0.5);
            shuffled.forEach((s, idx) => teams[idx % selectedCount].push(s));

            for (let iter = 0; iter < ALGORITHM_ITERATIONS; iter++) {
                for (let i = 0; i < teams.length; i++) {
                    for (let j = i + 1; j < teams.length; j++) {
                        const currentScore = calculateScore(getTeamStats(teams[i]), getTeamStats(teams[j]));
                        for (let x = 0; x < teams[i].length; x++) {
                            for (let y = 0; y < teams[j].length; y++) {
                                const tmp = teams[i][x];
                                teams[i][x] = teams[j][y];
                                teams[j][y] = tmp;
                                const newScore = calculateScore(getTeamStats(teams[i]), getTeamStats(teams[j]));
                                if (newScore >= currentScore) {
                                    teams[j][y] = teams[i][x];
                                    teams[i][x] = tmp;
                                }
                            }
                        }
                    }
                }
            }

            savedTeams = teams;
            renderTeams(teams);
            setTeamsVisible(true);
            persistData();
        }

        // ── Calque des équipes ────────────────────────────────────────────
        function sortByLevel(team) {
            return [...team].sort((a, b) => {
                const ia = EQUIPES_LEVEL_ORDER.indexOf(a.niveau);
                const ib = EQUIPES_LEVEL_ORDER.indexOf(b.niveau);
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.prenom.localeCompare(b.prenom);
            });
        }

        function teamColor(idx) { return TEAM_COLORS[idx % TEAM_COLORS.length]; }

        function renderTeams(teams) {
            resultsGrid.innerHTML = '';
            const multiLevel = new Set(allStudents.map(s => s.niveau)).size > 1;
            const total = teams.reduce((n, t) => n + t.length, 0);

            teamsCountEl.textContent = teams.length + ' équipes';
            teamsSubEl.textContent   = total + ' élève' + (total > 1 ? 's' : '') +
                (currentLevel !== 'tous' && !multiLevel ? '' : '');

            teams.forEach((team, idx) => {
                const stats = getTeamStats(team);
                const card = document.createElement('div');
                card.className = 'equipes-team-card';
                card.style.setProperty('--team-color', teamColor(idx));
                card.style.setProperty('--i', idx);

                const header = document.createElement('div');
                header.className = 'equipes-team-header';
                header.innerHTML =
                    `<span class="equipes-team-title">Équipe ${idx + 1}</span>` +
                    `<span class="equipes-team-stats">` +
                        `<span class="equipes-chip f" title="Filles">${stats.f} F</span>` +
                        `<span class="equipes-chip m" title="Garçons">${stats.m} G</span>` +
                    `</span>`;
                card.appendChild(header);

                sortByLevel(team).forEach(s => {
                    const nameClass = isFemale(s) ? 'equipes-name-f' : 'equipes-name-m';
                    const member    = document.createElement('div');
                    member.className = 'equipes-team-member';
                    const tag = multiLevel
                        ? `<span class="equipes-tag" style="background:${getLevelColor(s.niveau)}">${esc(s.niveau)}</span>`
                        : '';
                    member.innerHTML = tag + `<span class="equipes-member-name ${nameClass}" title="${esc(s.prenom + ' ' + (s.nom || ''))}">${esc(displayName(s))}</span>`;
                    card.appendChild(member);
                });

                resultsGrid.appendChild(card);
            });
        }

        function setTeamsVisible(on) {
            teamsVisible = !!on && !!(savedTeams && savedTeams.length);
            teamsOverlay.classList.toggle('open', teamsVisible);
            updateViewBtn();
            if (teamsVisible) {
                resultsPanel.scrollTop = 0;
                requestAnimationFrame(fitTeams);
            }
        }

        function updateViewBtn() {
            if (viewBtn) viewBtn.style.display = (!teamsVisible && savedTeams && savedTeams.length) ? '' : 'none';
        }

        // Plus grande taille de texte qui fait tenir toutes les équipes
        // sans défilement ni prénom coupé ; le nombre de colonnes suit la place.
        function fitTeams() {
            if (widget._equipesTeamFitting) return;
            if (!teamsVisible || !resultsPanel.clientHeight) return;
            const n = resultsGrid.children.length;
            if (!n) return;
            widget._equipesTeamFitting = true;
            try {
                const w = resultsPanel.clientWidth;
                let cols = n <= 4 ? n : (n <= 6 ? 3 : 4);
                if (w < 520) cols = Math.min(cols, 2);
                else if (w < 700) cols = Math.min(cols, 3);
                resultsGrid.style.setProperty('--team-cols', cols);

                const apply = (fs) => {
                    resultsGrid.style.setProperty('--team-fs', fs.toFixed(1) + 'px');
                    resultsGrid.style.setProperty('--team-gap', Math.max(8, fs * 0.55).toFixed(1) + 'px');
                };
                const fits = () => {
                    if (resultsPanel.scrollHeight > resultsPanel.clientHeight + 1) return false;
                    const names = resultsGrid.querySelectorAll('.equipes-member-name');
                    for (let i = 0; i < names.length; i++) {
                        if (names[i].scrollWidth > names[i].clientWidth + 1) return false;
                    }
                    return true;
                };

                resultsPanel.style.overflowY = 'hidden';
                let best;
                apply(TEAM_FS_MAX);
                if (fits()) best = TEAM_FS_MAX;
                else {
                    apply(TEAM_FS_MIN);
                    if (!fits()) best = TEAM_FS_MIN;          // trop d'élèves : on défilera
                    else {
                        let lo = TEAM_FS_MIN, hi = TEAM_FS_MAX;
                        while (hi - lo > 0.25) {
                            const mid = (lo + hi) / 2;
                            apply(mid);
                            if (fits()) lo = mid; else hi = mid;
                        }
                        best = lo;
                    }
                }
                apply(best);
            } finally {
                resultsPanel.style.overflowY = '';
                widget._equipesTeamFitting = false;
                updateScrollButtons();
            }
        }

        if (viewBtn) viewBtn.addEventListener('click', () => { setTeamsVisible(true); persistData(); });
        if (backBtn) backBtn.addEventListener('click', () => { setTeamsVisible(false); persistData(); });
        if (redoBtn) redoBtn.addEventListener('click', generateBalancedTeams);

        // ── Effacer les équipes ───────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            showConfirm('Effacer les équipes ?', 'Les équipes formées seront supprimées.', () => {
                resetResults();
                persistData();
            }, 'Effacer');
        });

        // ── Modal ─────────────────────────────────────────────────────────
        function showAlert(text) {
            modalOverlay.querySelector('.equipes-modal-title').textContent = 'Information';
            modalOverlay.querySelector('.equipes-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.equipes-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.equipes-modal-confirm');
            const pickList = modalOverlay.querySelector('.equipes-modal-list');
            if (pickList) pickList.innerHTML = '';
            hideModalInput();
            cancelBtn.style.display = 'none';
            confirmBtn.style.display = '';
            confirmBtn.textContent  = 'OK';
            confirmBtn.onclick      = closeModal;
            modalOverlay.classList.add('open');
        }

        function showConfirm(title, text, onConfirm, confirmLabel) {
            modalOverlay.querySelector('.equipes-modal-title').textContent = title;
            modalOverlay.querySelector('.equipes-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.equipes-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.equipes-modal-confirm');
            const pickList = modalOverlay.querySelector('.equipes-modal-list');
            if (pickList) pickList.innerHTML = '';
            hideModalInput();
            confirmBtn.style.display = '';
            confirmBtn.textContent = confirmLabel || 'Confirmer';
            cancelBtn.style.display = '';
            confirmBtn.onclick = () => { closeModal(); onConfirm(); };
            modalOverlay.classList.add('open');
        }
        function closeModal() {
            modalOverlay.classList.remove('open');
            modalOverlay.querySelector('.equipes-modal-cancel').textContent = 'Annuler';
            hideModalInput();
        }
        modalOverlay.querySelector('.equipes-modal-cancel').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

        function hideModalInput() {
            if (!modalInput) return;
            modalInput.style.display = 'none';
            modalInput.value = '';
            modalInput.onkeydown = null;
        }

        // =================================================================
        // ENREGISTREMENT / OUVERTURE DES ÉQUIPES (fichier .json)
        // =================================================================
        function getClassName() {
            const CL = window.ClasseListe;
            if (!CL || !classId) return '';
            const c = CL.getClasses().find(c => String(c.id) === String(classId));
            return c ? c.name : '';
        }

        function formatDate(d, long) {
            return long
                ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }

        function defaultSetName() {
            const cls = getClassName();
            const n = savedTeams ? savedTeams.length : selectedCount;
            return (cls ? cls + ' – ' : '') + n + ' équipes – ' + new Date().toLocaleDateString('fr-FR');
        }

        function flashButton(btn, text) {
            if (!btn) return;
            const label = btn.querySelector('span');
            const target = label || btn;
            const old = target.textContent;
            target.textContent = text;
            btn.disabled = true;
            setTimeout(() => { target.textContent = old; btn.disabled = false; }, 1600);
        }

        function safeFileName(name) {
            return (name || 'equipes')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[\/\\:*?"<>|]+/g, '-')
                .replace(/\s+/g, '_')
                .replace(/^[-_.]+|[-_.]+$/g, '')
                .slice(0, 80) || 'equipes';
        }

        function downloadJSON(data, fileName) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function saveCurrentTeams() {
            if (!savedTeams || !savedTeams.length) return;
            const def = defaultSetName();
            modalOverlay.querySelector('.equipes-modal-title').textContent = 'Enregistrer les équipes';
            modalOverlay.querySelector('.equipes-modal-text').textContent  = 'Nom du fichier .json :';
            modalOverlay.querySelector('.equipes-modal-list').innerHTML = '';
            const cancelBtn  = modalOverlay.querySelector('.equipes-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.equipes-modal-confirm');
            cancelBtn.style.display  = '';
            confirmBtn.style.display = '';
            confirmBtn.textContent   = '💾 Enregistrer';

            const doSave = () => {
                const name = (modalInput.value || '').trim() || def;
                const data = {
                    type:      SAVE_FILE_TYPE,
                    version:   1,
                    name:      name,
                    date:      new Date().toISOString(),
                    className: getClassName() || null,
                    classId:   classId || null,
                    count:     savedTeams.length,
                    teams:     savedTeams,
                    students:  allStudents,
                    absents:   Array.from(absentSet)
                };
                closeModal();
                try {
                    downloadJSON(data, safeFileName(name) + '.json');
                    flashButton(saveBtn, '✓ Enregistré');
                } catch (e) {
                    showAlert("L'enregistrement du fichier a échoué.");
                }
            };

            modalInput.style.display = 'block';
            modalInput.value = def;
            modalInput.onkeydown = (e) => {
                e.stopPropagation();
                if (e.key === 'Enter')  { e.preventDefault(); doSave(); }
                if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
            };
            confirmBtn.onclick = doSave;
            modalOverlay.classList.add('open');
            setTimeout(() => { modalInput.focus(); modalInput.select(); }, 30);
        }

        function openTeamsFile() {
            if (teamsFileInput) teamsFileInput.click();
        }

        function isValidTeamsFile(data) {
            return data && typeof data === 'object' &&
                Array.isArray(data.teams) && data.teams.length &&
                data.teams.every(t => Array.isArray(t) && t.every(s => s && typeof s.prenom === 'string'));
        }

        if (teamsFileInput) {
            teamsFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                e.target.value = '';
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    let data;
                    try { data = JSON.parse(ev.target.result); } catch (err) { data = null; }
                    if (!isValidTeamsFile(data)) {
                        showAlert("Ce fichier n'est pas un fichier d'équipes valide.\nChoisissez un fichier .json enregistré depuis ce widget.");
                        return;
                    }
                    const label = data.name || file.name.replace(/\.json$/i, '');
                    if (savedTeams && savedTeams.length) {
                        showConfirm('Ouvrir « ' + label + ' » ?',
                            'Les équipes affichées seront remplacées.',
                            () => loadSavedSet(data), 'Ouvrir');
                    } else {
                        loadSavedSet(data);
                    }
                };
                reader.onerror = () => showAlert('Impossible de lire ce fichier.');
                reader.readAsText(file, 'UTF-8');
            });
        }

        function loadSavedSet(set) {
            if (!set || !Array.isArray(set.teams) || !set.teams.length) {
                showAlert('Cette sauvegarde est vide ou illisible.');
                return;
            }
            const teams     = set.teams.map(t => normalizeStudents(t));
            const fromTeams = [].concat(...teams);
            allStudents   = (Array.isArray(set.students) && set.students.length) ? normalizeStudents(set.students) : fromTeams;
            absentSet     = new Set((set.absents || []).map(String));
            selectedCount = Math.min(TEAM_MAX, Math.max(TEAM_MIN, teams.length));
            currentLevel  = 'tous';
            savedTeams    = teams;
            teamsVisible  = true;

            const CL = window.ClasseListe;
            if (set.classId && CL && CL.getClass(set.classId)) {
                classId = set.classId;
                widget.dataset.equipesClassId = classId;
                persistData();
                syncFromClass();          // noms à jour depuis la liste de classe
            } else {
                classId = null;
                delete widget.dataset.equipesClassId;
                showLoadedState();
                renderTeams(savedTeams);
                setTeamsVisible(true);
                persistData();
            }
            if (typeof saveBoard === 'function') saveBoard();
        }

        // =================================================================
        // EXPORT PDF
        // =================================================================
        function esc(str) {
            return String(str == null ? '' : str).replace(/[&<>"']/g, c => (
                { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        const JSPDF_URLS = [
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
        ];
        function loadJsPDF() {
            if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
            if (window._equipesJsPDFPromise) return window._equipesJsPDFPromise;
            const tryUrl = (i) => new Promise((resolve, reject) => {
                if (i >= JSPDF_URLS.length) { reject(new Error('jsPDF indisponible')); return; }
                const sc = document.createElement('script');
                sc.src = JSPDF_URLS[i];
                sc.async = true;
                sc.onload  = () => (window.jspdf && window.jspdf.jsPDF)
                    ? resolve(window.jspdf.jsPDF)
                    : tryUrl(i + 1).then(resolve, reject);
                sc.onerror = () => { sc.remove(); tryUrl(i + 1).then(resolve, reject); };
                document.head.appendChild(sc);
            });
            window._equipesJsPDFPromise = tryUrl(0).catch(err => {
                window._equipesJsPDFPromise = null;
                throw err;
            });
            return window._equipesJsPDFPromise;
        }

        function hexToRgb(hex) {
            const h = hex.replace('#', '');
            return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
        }

        function fitText(doc, text, maxW) {
            if (doc.getTextWidth(text) <= maxW) return text;
            let t = text;
            while (t.length > 1 && doc.getTextWidth(t + '...') > maxW) t = t.slice(0, -1);
            return t + '...';
        }

        function buildTeamsPDF(JsPDF) {
            const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const PAGE_W = 210, PAGE_H = 297, M = 14;
            const GRAY_DARK = [55, 65, 81], GRAY = [107, 114, 128], GRAY_LIGHT = [156, 163, 175];
            const BORDER = [209, 213, 219], GREEN = [22, 163, 74], ORANGE = [234, 88, 12];

            const cls     = getClassName();
            const title   = 'Équipes' + (cls ? ' – ' + cls : '');
            const dateTxt = formatDate(new Date(), true);
            const multiLevel = new Set(allStudents.map(s => s.niveau)).size > 1;

            let y = M + 6;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(...GRAY_DARK);
            doc.text(title, M, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...GRAY);
            doc.text(dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1), M, y);
            y += 8;

            const cols  = savedTeams.length <= 4 ? 2 : 3;
            const GAP   = 5;
            const cardW = (PAGE_W - 2 * M - GAP * (cols - 1)) / cols;
            const PAD = 4, HEAD_H = 12, LINE_H = 7;
            const TAG_W = 11, TAG_H = 4.4;

            for (let r = 0; r < savedTeams.length; r += cols) {
                const rowTeams = savedTeams.slice(r, r + cols);
                const rowH = Math.max(...rowTeams.map(t => HEAD_H + PAD * 2 + t.length * LINE_H));
                if (y + rowH > PAGE_H - M) { doc.addPage(); y = M; }

                rowTeams.forEach((team, k) => {
                    const idx = r + k;
                    const x = M + k * (cardW + GAP);
                    const st = getTeamStats(team);
                    const tc = hexToRgb(teamColor(idx));

                    doc.setDrawColor(...BORDER);
                    doc.setLineWidth(0.4);
                    doc.setFillColor(248, 249, 250);
                    doc.roundedRect(x, y, cardW, rowH, 3, 3, 'FD');
                    // Bandeau de couleur de l'équipe
                    doc.setFillColor(...tc);
                    doc.rect(x + 3, y, cardW - 6, 1.6, 'F');

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(13);
                    doc.setTextColor(...tc);
                    doc.text('ÉQUIPE ' + (idx + 1), x + PAD, y + PAD + 4.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(...GRAY_LIGHT);
                    doc.text(st.total + ' élèves  -  ' + st.f + ' F / ' + st.m + ' G', x + PAD, y + PAD + 9);
                    doc.setDrawColor(229, 231, 235);
                    doc.setLineWidth(0.3);
                    doc.line(x + PAD, y + HEAD_H + 1, x + cardW - PAD, y + HEAD_H + 1);

                    let ly = y + HEAD_H + PAD + 3.5;
                    sortByLevel(team).forEach(s => {
                        let nx = x + PAD;
                        if (multiLevel) {
                            doc.setFillColor(...hexToRgb(getLevelColor(s.niveau)));
                            doc.roundedRect(nx, ly - 3.4, TAG_W, TAG_H, 2.2, 2.2, 'F');
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(6.5);
                            doc.setTextColor(255, 255, 255);
                            doc.text(fitText(doc, s.niveau, TAG_W - 1), nx + TAG_W / 2, ly - 0.3, { align: 'center' });
                            nx += TAG_W + 2.5;
                        }
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(12);
                        doc.setTextColor(...(isFemale(s) ? GREEN : ORANGE));
                        doc.text(fitText(doc, displayName(s), x + cardW - PAD - nx), nx, ly);
                        ly += LINE_H;
                    });
                });
                y += rowH + GAP;
            }

            const absents = allStudents
                .filter(s => absentSet.has(String(s.id)))
                .map(s => s.prenom + (s.nom ? ' ' + s.nom : ''));
            if (absents.length) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                const lines = doc.splitTextToSize('Absents : ' + absents.join(', '), PAGE_W - 2 * M);
                if (y + lines.length * 5 > PAGE_H - M) { doc.addPage(); y = M + 4; }
                doc.setTextColor(...GRAY);
                doc.text(lines, M, y + 3);
            }

            doc.setProperties({ title: title, creator: 'Le Bureau du Prof' });
            return { doc, fileName: safeFileName(title + '_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')) + '.pdf' };
        }

        function exportTeamsPDF() {
            if (!savedTeams || !savedTeams.length) return;
            const label = pdfBtn.querySelector('span');
            const oldLabel = label.textContent;
            label.textContent = 'Création…';
            pdfBtn.disabled = true;
            loadJsPDF()
                .then(JsPDF => {
                    const { doc, fileName } = buildTeamsPDF(JsPDF);
                    doc.save(fileName);
                    label.textContent = oldLabel;
                    pdfBtn.disabled = false;
                    flashButton(pdfBtn, '✓ PDF créé');
                })
                .catch(err => {
                    console.warn('equipes: export PDF', err);
                    label.textContent = oldLabel;
                    pdfBtn.disabled = false;
                    showAlert("Impossible de créer le PDF.\nVérifiez la connexion Internet (la bibliothèque PDF est chargée en ligne au premier export).");
                });
        }

        if (saveBtn)      saveBtn.addEventListener('click', saveCurrentTeams);
        if (pdfBtn)       pdfBtn.addEventListener('click', exportTeamsPDF);
        if (openTeamsBtn) openTeamsBtn.addEventListener('click', openTeamsFile);

        // ── Boutons de défilement tactiles pour les équipes ───────────────
        const SCROLL_STEP = 120;

        function updateScrollButtons() {
            if (!resultsPanel || !scrollUpBtn || !scrollDownBtn) return;
            const canUp   = resultsPanel.scrollTop > 2;
            const canDown = resultsPanel.scrollTop < resultsPanel.scrollHeight - resultsPanel.clientHeight - 2;
            scrollUpBtn.classList.toggle('visible', canUp);
            scrollDownBtn.classList.toggle('visible', canDown);
        }

        resultsPanel.addEventListener('scroll', updateScrollButtons);

        function makeScrollHandler(direction) {
            let interval = null;
            function doScroll() {
                resultsPanel.scrollBy({ top: direction * SCROLL_STEP, behavior: 'smooth' });
            }
            return {
                start: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    doScroll();
                    interval = setInterval(doScroll, 300);
                },
                stop: () => {
                    clearInterval(interval);
                    interval = null;
                    setTimeout(updateScrollButtons, 350);
                }
            };
        }

        [[scrollUpBtn, -1], [scrollDownBtn, 1]].forEach(([btn, dir]) => {
            if (!btn) return;
            const h = makeScrollHandler(dir);
            btn.addEventListener('pointerdown',   h.start);
            btn.addEventListener('pointerup',     h.stop);
            btn.addEventListener('pointerleave',  h.stop);
            btn.addEventListener('pointercancel', h.stop);
        });

        // ── Taille automatique des étiquettes prénoms ─────────────────────
        // Plus grande taille qui tient ENTIÈREMENT dans le cadre blanc.
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
            const pills = body.querySelectorAll('.equipes-pill');
            for (let i = 0; i < pills.length; i++) {
                if (pills[i].scrollWidth > pills[i].clientWidth) return false;
            }
            return true;
        }
        function bestSizeFor(cols, mustBeat) {
            applyPillScale(PILL_FS_MAX, cols);
            if (pillsFit()) return PILL_FS_MAX;
            let lo = Math.max(PILL_FS_MIN, mustBeat);
            applyPillScale(lo, cols);
            if (!pillsFit()) return -Infinity;
            let hi = PILL_FS_MAX;
            while (hi - lo > 0.25) {
                const mid = (lo + hi) / 2;
                applyPillScale(mid, cols);
                if (pillsFit()) lo = mid; else hi = mid;
            }
            return lo;
        }
        function updatePillScale() {
            if (widget._equipesFitting) return;
            if (!body.offsetParent || !body.clientHeight) return;
            widget._equipesFitting = true;
            try {
                body.style.overflowY = 'hidden';
                const nbPills = body.querySelectorAll('.equipes-pill').length;
                let best = -Infinity, bestCols = 5;
                for (const cols of PILL_COLS) {
                    if (cols !== 5 && cols > Math.max(2, nbPills)) continue;
                    const fs = bestSizeFor(cols, best);
                    if (fs > best + 0.3) { best = fs; bestCols = cols; }
                    if (best >= PILL_FS_MAX) break;
                }
                if (best === -Infinity) {
                    best = PILL_FS_MIN;
                    bestCols = Math.max(3, Math.min(10, Math.floor(body.clientWidth / 60)));
                }
                applyPillScale(best, bestCols);
            } finally {
                body.style.overflowY = '';
                widget._equipesFitting = false;
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
                const minW = 300, minH = 260;

                function onMove(ev) {
                    ev.preventDefault();
                    outer.style.width  = Math.max(minW, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(minH, startH + ev.clientY - startY) + 'px';
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
                if (outer.dataset.collapsed !== '1' && !widget.classList.contains('phone-fs')) {
                    if (outer.offsetWidth  > 0) widget.dataset.equipesW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.equipesH = outer.offsetHeight;
                }
                updatePillScale();
                fitTeams();
            });
            ro.observe(outer);
            ro.observe(body);
            ro.observe(teamsOverlay);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }

        // =================================================================
        // DÉMARRAGE : thème + données (en dernier, tout est défini)
        // =================================================================
        applyTheme(widget.dataset.equipesTheme || DEFAULT_THEME);
        refreshClassBtn();

        if (widget.dataset.equipesStudents) {
            try {
                allStudents   = JSON.parse(widget.dataset.equipesStudents);
                absentSet     = new Set(JSON.parse(widget.dataset.equipesAbsents || '[]').map(String));
                selectedCount = parseInt(widget.dataset.equipesCount || DEFAULT_TEAM_COUNT);
                savedTeams    = widget.dataset.equipesTeams ? JSON.parse(widget.dataset.equipesTeams) : null;
                const hidden  = widget.dataset.equipesTeamsHidden === '1';
                showLoadedState();
                if (savedTeams) { renderTeams(savedTeams); setTeamsVisible(!hidden); }
            } catch(e) { console.warn('equipes: erreur restauration dataset', e); }
        } else if (window.ClasseListe && window.ClasseListe.getStudents().length) {
            loadFromClass(window.ClasseListe.getActiveId());
        } else {
            try {
                const saved = localStorage.getItem('tirage_students_list') || localStorage.getItem('maListeEleves');
                if (saved) {
                    allStudents = normalizeStudents(JSON.parse(saved));
                    setStatus('✓ ' + allStudents.length + ' élève(s) (liste mémorisée)', 'ok');
                    showLoadedState();
                }
            } catch(e) {}
        }
        requestAnimationFrame(() => { updatePillScale(); fitTeams(); });
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createEquipesWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 140, y: 90 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'equipes';
        widget.dataset.transparent = 'true';
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
            <div class="equipes-outer">${equipesInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        try { initEquipesWidget(widget); }
        catch (e) { console.error('Équipes : erreur à l\'ouverture', e); }
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
            document.querySelectorAll('.widget[data-type="equipes"]').forEach(widget => {
                const outer     = widget.querySelector('.equipes-outer');
                const collapsed = widget.dataset.collapsed === '1';
                if (!outer) return;

                if (collapsed) {
                    const origLeft = parseFloat(widget.dataset.equipesLeftSaved);
                    const origTop  = parseFloat(widget.dataset.equipesTopSaved);
                    if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                    if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                }

                const match = (state.widgets || []).find(w => w.type === 'equipes' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                );
                if (match) {
                    const w = parseFloat(widget.dataset.equipesW) || outer.offsetWidth;
                    const h = parseFloat(widget.dataset.equipesH) || outer.offsetHeight;
                    if (w > 0) match.equipesW = w;
                    if (h > 0) match.equipesH = h;
                    match.widthPercent    = 0;
                    match.contentHPercent = 0;
                    if (collapsed) {
                        match.leftPercent = parseFloat(widget.dataset.leftPercent);
                        match.topPercent  = parseFloat(widget.dataset.topPercent);
                    }
                    match.equipesCollapsed  = collapsed;
                    if (widget.dataset.equipesLeftSaved)   match.equipesLeftSaved   = widget.dataset.equipesLeftSaved;
                    if (widget.dataset.equipesTopSaved)    match.equipesTopSaved    = widget.dataset.equipesTopSaved;
                    if (widget.dataset.equipesStudents)    match.equipesStudents    = widget.dataset.equipesStudents;
                    if (widget.dataset.equipesAbsents)     match.equipesAbsents     = widget.dataset.equipesAbsents;
                    if (widget.dataset.equipesCount)       match.equipesCount       = widget.dataset.equipesCount;
                    if (widget.dataset.equipesTeams)       match.equipesTeams       = widget.dataset.equipesTeams;
                    if (widget.dataset.equipesClassId)     match.equipesClassId     = widget.dataset.equipesClassId;
                    if (widget.dataset.equipesTheme)       match.equipesTheme       = widget.dataset.equipesTheme;
                    if (widget.dataset.equipesTeamsHidden) match.equipesTeamsHidden = widget.dataset.equipesTeamsHidden;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestoreEquipes() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                let equipesList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === 'equipes') equipesList.push(w); });
                } catch(e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="equipes"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.equipes-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'equipes-outer';
                            widget.appendChild(outer);
                        }
                        // Toujours repartir du nouveau gabarit (les anciennes sauvegardes
                        // contiennent l'ancien graphisme)
                        if (!outer.querySelector('.equipes-stage')) {
                            outer.innerHTML = equipesInnerHTML();
                        }

                        const saved = equipesList[idx];

                        if (saved) {
                            if (saved.equipesStudents)    widget.dataset.equipesStudents    = saved.equipesStudents;
                            if (saved.equipesAbsents)     widget.dataset.equipesAbsents     = saved.equipesAbsents;
                            if (saved.equipesCount)       widget.dataset.equipesCount       = saved.equipesCount;
                            if (saved.equipesTeams)       widget.dataset.equipesTeams       = saved.equipesTeams;
                            if (saved.equipesClassId)     widget.dataset.equipesClassId     = saved.equipesClassId;
                            if (saved.equipesTheme)       widget.dataset.equipesTheme       = saved.equipesTheme;
                            if (saved.equipesTeamsHidden) widget.dataset.equipesTeamsHidden = saved.equipesTeamsHidden;
                            if (saved.equipesLeftSaved)   widget.dataset.equipesLeftSaved   = saved.equipesLeftSaved;
                            if (saved.equipesTopSaved)    widget.dataset.equipesTopSaved    = saved.equipesTopSaved;
                            const w = saved.equipesW || parseFloat(widget.dataset.equipesW);
                            const h = saved.equipesH || parseFloat(widget.dataset.equipesH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.equipesW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.equipesH = h; }

                            if (saved.equipesCollapsed) {
                                const origLeft = parseFloat(saved.equipesLeftSaved);
                                const origTop  = parseFloat(saved.equipesTopSaved);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initEquipesWidget(widget);

                        // Appliquer l'état réduit APRÈS init (qui remet outer visible)
                        if (saved && saved.equipesCollapsed) {
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

                            if (!widget.querySelector('.equipes-mini-bar')) {
                                const miniBar = document.createElement('div');
                                miniBar.className = 'equipes-mini-bar';
                                miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
                                const labelEl = document.createElement('span');
                                labelEl.textContent = '👥 Équipes équilibrées';
                                labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
                                const expandBtn = document.createElement('button');
                                expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
                                expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
                                expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
                                expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
                                expandBtn.addEventListener('click', e => {
                                    e.stopPropagation(); e.preventDefault();
                                    if (typeof widget._equipesExpand === 'function') widget._equipesExpand();
                                });
                                miniBar.appendChild(labelEl);
                                miniBar.appendChild(expandBtn);
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
    // HOOK createWidget — intercepter type 'equipes'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'equipes') return window.createEquipesWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
