// =========================================================================
// WIDGET 108 HEURES — Le Bureau du Prof
// Inspiré de 108heures.html (OutilsProfs)
// Graphisme aligné sur le Tirage au sort / Visualiseur : cadre coloré
// arrondi, pastilles « verre », police Quicksand, icônes SVG, couleur du
// cadre au choix, redimensionnement libre, aide, réduire, plein écran, fermer.
//
// Données :
//   • Les séances, la quotité et le nom de l'enseignant sont gardés dans le
//     navigateur (localStorage), communs à tous les tableaux :
//       bdp_108h_seances, bdp_108h_quotite, bdp_108h_nom, bdp_108h_a_exporter
//   • Le tableau (save-load.js) ne mémorise que la fenêtre : taille, couleur,
//     état réduit / plein écran, catégories dépliées (champ h108Data).
//   • Export / import .txt au même format que 108heures.html (compatible).
//
// 📌 Intégration dans index.html :
//   <script src="outil-108heures.js"></script>   (après outil-tirage.js)
//   Carte du panneau Outils : onclick="createHeures108Widget();toggleToolsPanel()"
// =========================================================================


// ─────────────────────────────────────────────────────────────────────────
// DÉPLACEMENT DES WIDGETS DEPUIS N'IMPORTE QUELLE ZONE LIBRE
// (fonction partagée entre les widgets, définie une seule fois)
// ─────────────────────────────────────────────────────────────────────────
if (!window.bdpCanDragFrom) {
    window.bdpCanDragFrom = function (e, root, extra) {
        const t = e.target;
        if (!t || !t.closest || !root || !root.contains(t)) return false;
        if (e.type === 'mousedown' && e.button !== 0) return false;
        if (e.touches && e.touches.length > 1) return false;
        let sel = 'input, textarea, select, option, button, a, label, ' +
                  '[contenteditable=""], [contenteditable="true"], .wf-btns, [data-nodrag]';
        if (extra) sel += ', ' + extra;
        const hit = t.closest(sel);
        if (hit && root.contains(hit)) return false;
        const pt = e.touches ? e.touches[0] : e;
        for (let el = t; el && el.nodeType === 1; el = el.parentElement) {
            const cs   = getComputedStyle(el);
            const canY = /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
            const canX = /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth  > el.clientWidth  + 1;
            if (canY || canX) {
                if (e.touches) return false;
                const r = el.getBoundingClientRect();
                if (canY && pt.clientX > r.left + el.clientLeft + el.clientWidth)  return false;
                if (canX && pt.clientY > r.top  + el.clientTop  + el.clientHeight) return false;
            }
            if (el === root) break;
        }
        return true;
    };
}

(function () {
    if (window.createHeures108Widget) return; // fichier déjà chargé

    function isPhoneNow() {
        if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }

    // ── Police arrondie partagée avec les autres widgets ──────────────────
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent : h108-outer porte tout le visuel ── */
    .widget[data-type="heures108"],
    .widget[data-type="heures108"]:focus-within {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe (taille + ombre) ── */
    .widget[data-type="heures108"] .h108-outer {
        --h108-ink:   #14202E;
        --h108-glass: rgba(255,255,255,0.62);
        --h108-bg:    #F7B98A;
        --h108-op:    #D2691E;

        position: relative;
        width: 760px;
        height: 580px;
        min-width: 300px;
        min-height: 260px;
        overflow: hidden;
        box-sizing: border-box;
        border-radius: 24px;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
    }
    .widget[data-type="heures108"]:hover .h108-outer,
    .widget[data-type="heures108"]:focus-within .h108-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Cadre coloré ── */
    .h108-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px 16px;
        box-sizing: border-box;
        background-color: var(--h108-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        border-radius: 24px;
        overflow: hidden;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--h108-ink);
        user-select: none;
        position: relative;
        container-type: size;
        transition: background-color .3s;
    }

    /* ── En-tête : deux pastilles « verre » ── */
    .h108-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 0 0;
        flex-shrink: 0;
        cursor: move;
    }
    .h108-title,
    .h108-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--h108-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .h108-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        pointer-events: none;
    }
    .h108-title span { overflow: hidden; text-overflow: ellipsis; }
    .h108-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--h108-op); }
    .h108-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
    @container (max-width: 420px) { .h108-title span { display: none; } .h108-title { padding: 7px 10px; } }

    .h108-icon-btn {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--h108-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .h108-icon-btn svg { width: 18px; height: 18px; }
    .h108-icon-btn:hover,
    .h108-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .h108-icon-btn:focus-visible { outline: 2px solid var(--h108-ink); outline-offset: 2px; }
    .h108-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Zone blanche (contenu) — la taille du texte suit celle du cadre ── */
    .h108-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.8em;
        padding: 1em;
        box-sizing: border-box;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        font-size: clamp(12px, 2.3cqmin, 22px);
        scrollbar-width: thin;
        scrollbar-color: rgba(20,32,46,0.25) transparent;
    }
    .h108-card {
        background: #F4F6F9;
        border: 1.5px solid rgba(20,32,46,0.08);
        border-radius: 14px;
        padding: 0.75em 1em;
        flex-shrink: 0;
    }
    .h108-label {
        font-size: 0.72em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: rgba(20,32,46,0.55);
    }
    .h108-quot-row { display: flex; align-items: center; gap: 1em; margin-top: 0.3em; }
    .h108-quot-range { flex: 1; min-width: 0; accent-color: var(--h108-op); cursor: pointer; height: 1.4em; }
    .h108-quot-val { font-weight: 700; min-width: 3.4em; text-align: right; }

    .h108-global-top { display: flex; justify-content: space-between; align-items: flex-end; gap: .6em; flex-wrap: wrap; }
    .h108-global-title { font-weight: 700; color: var(--h108-op); font-size: 0.85em; text-transform: uppercase; letter-spacing: .04em; }
    .h108-reste { font-weight: 700; font-size: 1.1em; color: var(--h108-op); }
    .h108-reste.over { color: #C0392B; }
    .h108-bar {
        height: 0.6em;
        background: rgba(20,32,46,0.09);
        border-radius: 999px;
        overflow: hidden;
        margin: 0.45em 0 0.35em;
    }
    .h108-bar.big { height: 0.95em; }
    .h108-bar > i {
        display: block;
        height: 100%;
        background: var(--h108-op);
        border-radius: inherit;
        transition: width .5s ease-out;
    }
    .h108-global-bottom {
        display: flex; justify-content: space-between;
        font-size: 0.75em; font-weight: 700; text-transform: uppercase;
        color: rgba(20,32,46,0.55);
    }

    /* ── Catégories (4 colonnes, 2 sur cadre étroit, 1 sur très étroit) ── */
    .h108-cats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.7em;
        align-items: start;
    }
    @container (max-width: 640px) { .h108-cats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @container (max-width: 330px) { .h108-cats { grid-template-columns: minmax(0, 1fr); } }
    .h108-cat { padding: 0.7em 0.8em; }
    .h108-cat-head { display: flex; align-items: center; gap: .4em; }
    .h108-cat-name { font-weight: 700; font-size: 0.8em; text-transform: uppercase; letter-spacing: .04em; }
    .h108-alert {
        width: .55em; height: .55em; border-radius: 50%;
        background: #f97316; box-shadow: 0 0 5px #f97316;
        animation: h108-blink 1.5s infinite;
        flex-shrink: 0;
    }
    @keyframes h108-blink {
        0%, 100% { transform: scale(0.9); opacity: .5; }
        50%      { transform: scale(1.2); opacity: 1; }
    }
    .h108-cat-count { font-size: 0.75em; font-weight: 700; color: rgba(20,32,46,0.55); }
    .h108-toggle {
        width: 100%;
        margin-top: .55em;
        border: none;
        background: rgba(20,32,46,0.07);
        border-radius: 999px;
        padding: .35em .5em;
        font-family: inherit;
        font-size: 0.7em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .04em;
        color: rgba(20,32,46,0.65);
        cursor: pointer;
        transition: background .15s;
    }
    .h108-toggle:hover { background: rgba(20,32,46,0.13); }
    .h108-list { display: flex; flex-direction: column; gap: .35em; margin-top: .5em; }
    .h108-item {
        display: block;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        background: #fff;
        border: 1.5px solid rgba(20,32,46,0.1);
        border-left: 4px solid var(--h108-op);
        border-radius: 10px;
        padding: .4em .6em;
        font-family: inherit;
        color: var(--h108-ink);
        cursor: pointer;
        transition: border-color .15s, transform .1s;
    }
    .h108-item:hover { border-color: rgba(20,32,46,0.25); border-left-color: var(--h108-op); }
    .h108-item:active { transform: scale(0.98); }
    .h108-item-line { display: flex; gap: .5em; align-items: baseline; }
    .h108-item-date { font-weight: 700; color: var(--h108-op); font-size: 0.8em; }
    .h108-item-dur  { font-weight: 700; font-size: 0.8em; }
    .h108-item-comm {
        font-size: 0.7em; font-style: italic; color: rgba(20,32,46,0.6);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        margin-top: .1em;
    }
    .h108-empty { font-size: 0.72em; color: rgba(20,32,46,0.45); text-align: center; padding: .3em; }

    /* ── Pied : boutons (pastilles « verre ») ── */
    .h108-footer {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        align-items: center;
        font-size: clamp(11px, 1.9cqmin, 18px);
    }
    .h108-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: .2em;
        padding: .5em 1.1em;
        border-radius: 999px;
        border: none;
        font-family: inherit;
        font-size: 1em;
        font-weight: 700;
        cursor: pointer;
        background: var(--h108-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        color: var(--h108-ink);
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        transition: background .15s, transform .1s, filter .15s;
        white-space: nowrap;
    }
    .h108-btn:hover { background: rgba(255,255,255,0.85); }
    .h108-btn:active { transform: scale(0.97); }
    .h108-btn.primary {
        background: var(--h108-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
    }
    .h108-btn.primary:hover { filter: brightness(1.1); background: var(--h108-op); }
    .h108-btn.primary:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }
    .h108-btn.danger { color: #C0392B; }
    @container (max-width: 560px) { .h108-btn-txt { display: none; } .h108-btn.primary .h108-btn-txt { display: inline; } }
    .h108-badge {
        display: none;
        position: absolute;
        top: -3px; right: -3px;
        width: 11px; height: 11px;
        border-radius: 50%;
        background: #f97316;
        border: 2px solid #fff;
        box-shadow: 0 0 5px #f97316;
        animation: h108-blink 1.5s infinite;
    }
    .h108-badge.on { display: block; }

    /* ── Petits cadres : on compacte ── */
    @container (max-height: 460px) {
        .h108-inner { gap: 7px; }
        .h108-header { padding-top: 10px; }
        .h108-title { padding: 5px 12px 5px 10px; font-size: 13px; }
        .h108-tools { padding: 3px 10px 3px 4px; }
        .h108-icon-btn { width: 28px; height: 28px; }
        .h108-body { padding: .7em; gap: .6em; }
        .h108-btn { padding: .35em .9em; }
    }

    /* ── Fenêtres modales (saisie, confirmation) ── */
    .h108-modal-overlay {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 200;
        background: rgba(10,20,35,0.35);
        -webkit-backdrop-filter: blur(4px);
                backdrop-filter: blur(4px);
        align-items: center;
        justify-content: center;
        padding: 14px;
        border-radius: inherit;
        box-sizing: border-box;
        cursor: default;
    }
    .h108-modal-overlay.open { display: flex; }
    .h108-confirm-overlay { z-index: 210; }
    .h108-modal-box {
        background: rgba(255,255,255,0.97);
        padding: 20px;
        border-radius: 18px;
        width: 100%;
        max-width: 340px;
        max-height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
        color: var(--h108-ink);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        user-select: text;
    }
    .h108-form-box { max-width: 400px; }
    .h108-modal-title { font-size: 15px; font-weight: 700; text-align: center; margin-bottom: 10px; }
    .h108-modal-text {
        font-size: 13px; color: rgba(20,32,46,0.7); text-align: center;
        line-height: 1.5; font-weight: 600; white-space: pre-line; margin: 0;
    }
    .h108-modal-text:empty { display: none; }
    .h108-modal-btns { display: flex; gap: 8px; margin-top: 14px; }
    .h108-modal-btn {
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
    .h108-modal-btn:active { transform: scale(0.96); }
    .h108-modal-cancel { background: rgba(20,32,46,0.08); color: var(--h108-ink); }
    .h108-modal-cancel:hover { background: rgba(20,32,46,0.15); }
    .h108-modal-confirm { background: var(--h108-op); color: #fff; }
    .h108-modal-confirm:hover { filter: brightness(1.1); }
    .h108-modal-danger { background: #C0392B; color: #fff; }
    .h108-modal-danger:hover { filter: brightness(1.1); }

    .h108-cat-choice { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
    .h108-cat-choice button {
        padding: 8px 2px;
        border-radius: 10px;
        border: 1.5px solid rgba(20,32,46,0.12);
        background: #F4F6F9;
        font-family: inherit;
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(20,32,46,0.65);
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: background .15s, color .15s;
    }
    .h108-cat-choice button.is-on { background: var(--h108-op); color: #fff; border-color: transparent; }
    .h108-field { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
    .h108-field-label {
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .06em; color: rgba(20,32,46,0.55); margin-left: 4px;
    }
    .h108-input {
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1.5px solid rgba(20,32,46,0.15);
        background: #fff;
        color: var(--h108-ink);
        width: 100%;
        box-sizing: border-box;
        outline: none;
        user-select: text;
    }
    .h108-input:focus { border-color: var(--h108-op); }
    .h108-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .h108-form-err { color: #C0392B; font-size: 12px; font-weight: 700; text-align: center; margin-top: 8px; }
    .h108-form-err:empty { display: none; }

    /* ── Panneaux (aide, réglages) ── */
    .h108-panel {
        display: none;
        position: absolute;
        top: 62px;
        right: 16px;
        width: 300px;
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
        color: var(--h108-ink);
        cursor: default;
    }
    .h108-panel.show { display: flex; }
    .h108-panel-title { font-size: 13px; font-weight: 700; }
    .h108-panel-label { font-size: 11px; font-weight: 700; color: rgba(20,32,46,0.6); }
    .h108-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .h108-help-list li { margin-bottom: 4px; }
    .h108-help-list em { font-style: normal; font-weight: 700; color: var(--h108-op); }
    .h108-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .h108-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .h108-swatch.is-on { border-color: var(--h108-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Plein écran (bouton vert) ── */
    .widget.wf-max[data-type="heures108"] .h108-outer { outline: none !important; }
    .widget.wf-max[data-type="heures108"] .h108-header { cursor: default; }
    /* Marge à gauche pour laisser visibles les onglets des panneaux latéraux */
    .widget.wf-max[data-type="heures108"] .h108-inner {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
    }
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget.wf-max[data-type="heures108"] .h108-inner {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            padding: 0 10px 10px;
        }
    }

    /* ── Téléphone : plein écran générique (.phone-fs) par sécurité ── */
    .widget.phone-fs[data-type="heures108"] {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
        z-index: 49990 !important;
    }
    .widget.phone-fs[data-type="heures108"] .h108-outer {
        width: 100% !important; height: 100% !important;
        min-width: 0 !important; min-height: 0 !important;
        border-radius: 0 !important; outline: none !important;
    }
    .widget.phone-fs[data-type="heures108"] .h108-inner { border-radius: 0 !important; padding: 0 10px 10px; }
    .widget.phone-fs[data-type="heures108"] .h108-header { cursor: default; padding-right: 56px; }

    /* Défilement au doigt dans la zone blanche, pas de délai sur les boutons */
    .widget[data-type="heures108"] .h108-body { touch-action: pan-y; }
    .widget[data-type="heures108"] .h108-inner button,
    .widget[data-type="heures108"] .h108-inner input,
    .widget[data-type="heures108"] .h108-inner select { touch-action: manipulation; }

    /* ── Déplacement : clic-glisser sur une zone libre du cadre ── */
    .h108-inner { cursor: move; }
    .h108-inner input[type="text"], .h108-inner input[type="date"] { cursor: text; }
    .h108-inner select, .h108-inner button:not(:disabled), .h108-inner input[type="range"] { cursor: pointer; }
    .widget.wf-max[data-type="heures108"] .h108-inner,
    .widget.phone-fs[data-type="heures108"] .h108-inner { cursor: default; }
    `;

    if (!document.getElementById('h108-widget-style')) {
        const s = document.createElement('style');
        s.id = 'h108-widget-style';
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
    // Quotas annuels à temps plein (en heures), proratisés selon la quotité
    const H108_CATS = [
        { key: 'APC',     name: 'APC',       quota: 36 },
        { key: 'PEDAGO',  name: 'Réunions',  quota: 48 },
        { key: 'FORM',    name: 'Formation', quota: 18 },
        { key: 'CONSEIL', name: 'Conseils',  quota: 6  }
    ];
    const H108_TOTAL_H   = 108;
    const H108_KEY_DATA  = 'bdp_108h_seances';
    const H108_KEY_QUOT  = 'bdp_108h_quotite';
    const H108_KEY_NAME  = 'bdp_108h_nom';
    const H108_KEY_DIRTY = 'bdp_108h_a_exporter';
    const H108_DEFAULT_W = 760;
    const H108_DEFAULT_H = 580;
    const H108_HTML2PDF  = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

    // Couleurs du cadre (mêmes que le Tirage au sort + orange, couleur d'origine des 108 h)
    const H108_THEMES = {
        orange: { name: 'Orange',  bg: '#F7B98A', op: '#D2691E' },
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };

    // ── Icônes ────────────────────────────────────────────────────────────
    const ICON_CLOCK   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>';
    const ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';

    // ── Outils ────────────────────────────────────────────────────────────
    function pad(n) { return String(n).padStart(2, '0'); }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function fmtDuree(min) {
        const neg = min < 0;
        const a = Math.abs(Math.round(min));
        const h = Math.floor(a / 60), m = a % 60;
        return (neg ? '-' : '') + h + 'h' + (m ? pad(m) : '');
    }
    // Les dates sont lues comme du texte « AAAA-MM-JJ » (pas de décalage de fuseau horaire)
    function fmtDate(s)     { const p = String(s).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : s; }
    function fmtDateLong(s) { const p = String(s).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }
    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    function schoolYear() {
        const d = new Date(), y = d.getFullYear();
        return d.getMonth() >= 7 ? y + '-' + (y + 1) : (y - 1) + '-' + y;
    }
    function quotaMin(cat, quot) { return cat.quota * 60 * quot / 100; }

    // ── Données (communes à tous les widgets 108 heures) ──────────────────
    function h108Clean(list) {
        if (!Array.isArray(list)) return [];
        const keys = H108_CATS.map(c => c.key);
        const out = [];
        list.forEach((r, i) => {
            if (!r || !keys.includes(r.cat)) return;
            const minutes = Math.round(Number(r.minutes));
            const date = String(r.date || '').slice(0, 10);
            if (!(minutes > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
            out.push({
                id: (r.id !== undefined && r.id !== null) ? r.id : Date.now() + i,
                cat: r.cat, date, minutes,
                comm: String(r.comm || '')
            });
        });
        return out;
    }
    function h108Load() {
        try {
            let raw = localStorage.getItem(H108_KEY_DATA);
            // Reprise des saisies de 108heures.html si elles existent dans ce navigateur
            if (raw === null) raw = localStorage.getItem('mesHeuresReu');
            return h108Clean(JSON.parse(raw || '[]'));
        } catch (e) { return []; }
    }
    function h108Notify() { window.dispatchEvent(new Event('bdp-108h-changed')); }
    function h108Save(list) {
        try { localStorage.setItem(H108_KEY_DATA, JSON.stringify(list)); } catch (e) {}
        h108Notify();
    }
    function h108GetQuot() {
        const v = parseInt(localStorage.getItem(H108_KEY_QUOT), 10);
        return (v >= 10 && v <= 100) ? v : 100;
    }
    function h108SetQuot(v) {
        try { localStorage.setItem(H108_KEY_QUOT, String(v)); } catch (e) {}
        h108Notify();
    }
    function h108GetName() { return localStorage.getItem(H108_KEY_NAME) || ''; }
    function h108SetName(n) {
        try { localStorage.setItem(H108_KEY_NAME, n); } catch (e) {}
    }
    function h108IsDirty() { return localStorage.getItem(H108_KEY_DIRTY) === '1'; }
    function h108SetDirty(on) {
        try {
            if (on) localStorage.setItem(H108_KEY_DIRTY, '1');
            else localStorage.removeItem(H108_KEY_DIRTY);
        } catch (e) {}
    }

    function loadHtml2pdf() {
        if (window.html2pdf) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = H108_HTML2PDF;
            s.onload = () => window.html2pdf ? resolve() : reject();
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // ── HTML interne ──────────────────────────────────────────────────────
    function h108InnerHTML() {
        const swatches = Object.keys(H108_THEMES).map(id =>
            '<button class="h108-swatch" data-theme="' + id + '" title="' + H108_THEMES[id].name +
            '" style="background:' + H108_THEMES[id].bg + '"></button>'
        ).join('');
        const catBtns = H108_CATS.map(c => '<button type="button" data-cat="' + c.key + '">' + c.name + '</button>').join('');
        let hOpts = '';
        for (let i = 0; i <= 12; i++) hOpts += '<option value="' + i + '">' + i + ' h</option>';
        let mOpts = '';
        for (let i = 0; i < 60; i += 5) mOpts += '<option value="' + i + '">' + pad(i) + ' min</option>';

        return `
        <div class="h108-inner">
            <div class="h108-header">
                <div class="h108-title">${ICON_CLOCK}<span>108 heures</span></div>
                <div class="h108-tools">
                    <button class="h108-icon-btn h108-settings-btn" title="Réglages (nom, couleur du cadre)" onmousedown="event.stopPropagation()">${ICON_PALETTE}</button>
                    <button class="h108-icon-btn h108-help-btn" title="Aide" onmousedown="event.stopPropagation()">${ICON_HELP}</button>
                    <span class="h108-sep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"     onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran" onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"      onmousedown="event.stopPropagation()"></button>
                    </div>
                </div>
            </div>

            <div class="h108-panel h108-help-popup">
                <div class="h108-panel-title">Aide — Gestion des 108 heures</div>
                <ul class="h108-help-list">
                    <li>Pour <b>déplacer</b> le widget : cliquez-glissez sur n'importe quelle zone libre du cadre.</li>
                    <li>Réglez votre <b>quotité</b> : les quotas sont recalculés (à temps plein : <em>APC 36 h</em>, <em>réunions 48 h</em>, <em>formation 18 h</em>, <em>conseils 6 h</em>).</li>
                    <li><b>Ajouter une séance</b> : choisissez la catégorie, la date, la durée et un commentaire.</li>
                    <li><b>Modifier / supprimer</b> : cliquez sur « Détails » sous une catégorie, puis sur la séance.</li>
                    <li>Une pastille orange à côté d'une catégorie indique que son quota est <b>dépassé</b>.</li>
                    <li>Les séances restent dans ce navigateur. La pastille orange sur <b>Exporter</b> signale des saisies pas encore sauvegardées dans un fichier .txt.</li>
                    <li><b>Importer</b> accepte aussi les fichiers .txt exportés par OutilsProfs.</li>
                    <li><b>PDF</b> : bilan imprimable (votre nom se règle avec la palette). Une connexion internet est nécessaire.</li>
                </ul>
            </div>
            <div class="h108-panel h108-settings-popup">
                <div class="h108-panel-title">Réglages</div>
                <div class="h108-panel-label">Nom de l'enseignant (pour le PDF)</div>
                <input type="text" class="h108-input h108-name-input" placeholder="Ex. : M. Dupont" autocomplete="off" maxlength="80">
                <div class="h108-panel-label">Couleur du cadre</div>
                <div class="h108-swatches">${swatches}</div>
            </div>

            <div class="h108-body">
                <div class="h108-card">
                    <div class="h108-label">Ma quotité de travail</div>
                    <div class="h108-quot-row">
                        <input type="range" class="h108-quot-range" min="10" max="100" step="5" value="100" aria-label="Quotité de travail">
                        <span class="h108-quot-val">100%</span>
                    </div>
                </div>
                <div class="h108-card">
                    <div class="h108-global-top">
                        <span class="h108-global-title">Total annuel</span>
                        <span class="h108-reste"></span>
                    </div>
                    <div class="h108-bar big"><i class="h108-global-bar"></i></div>
                    <div class="h108-global-bottom"><span class="h108-fait"></span><span class="h108-pct"></span></div>
                </div>
                <div class="h108-cats"></div>
            </div>

            <div class="h108-footer">
                <button class="h108-btn primary h108-add-btn" title="Enregistrer une nouvelle séance">＋<span class="h108-btn-txt"> Ajouter une séance</span></button>
                <button class="h108-btn h108-import-btn" title="Importer un fichier .txt">📂<span class="h108-btn-txt"> Importer</span></button>
                <button class="h108-btn h108-export-btn" title="Exporter les séances dans un fichier .txt">💾<span class="h108-btn-txt"> Exporter</span><span class="h108-badge" title="Saisies non exportées"></span></button>
                <button class="h108-btn h108-pdf-btn" title="Créer le bilan en PDF">📄<span class="h108-btn-txt"> PDF</span></button>
                <button class="h108-btn danger h108-reset-btn" title="Effacer toutes les séances">🗑<span class="h108-btn-txt"> Effacer</span></button>
                <input type="file" class="h108-file-input" accept=".txt,.json" style="display:none;">
            </div>

            <div class="h108-modal-overlay h108-form-overlay">
                <div class="h108-modal-box h108-form-box">
                    <div class="h108-modal-title h108-form-title">Nouvelle séance</div>
                    <div class="h108-cat-choice">${catBtns}</div>
                    <div class="h108-field">
                        <span class="h108-field-label">Date</span>
                        <input type="date" class="h108-input h108-f-date">
                    </div>
                    <div class="h108-field">
                        <span class="h108-field-label">Durée</span>
                        <div class="h108-row2">
                            <select class="h108-input h108-f-h">${hOpts}</select>
                            <select class="h108-input h108-f-m">${mOpts}</select>
                        </div>
                    </div>
                    <div class="h108-field">
                        <span class="h108-field-label">Commentaire</span>
                        <input type="text" class="h108-input h108-f-comm" placeholder="Ex. : conseil de cycle" autocomplete="off" maxlength="200">
                    </div>
                    <div class="h108-form-err"></div>
                    <div class="h108-modal-btns">
                        <button class="h108-modal-btn h108-modal-cancel h108-f-cancel">Annuler</button>
                        <button class="h108-modal-btn h108-modal-danger h108-f-delete">Supprimer</button>
                        <button class="h108-modal-btn h108-modal-confirm h108-f-save">Enregistrer</button>
                    </div>
                </div>
            </div>

            <div class="h108-modal-overlay h108-confirm-overlay">
                <div class="h108-modal-box">
                    <div class="h108-modal-title h108-c-title">Confirmation</div>
                    <p class="h108-modal-text h108-c-text"></p>
                    <div class="h108-modal-btns">
                        <button class="h108-modal-btn h108-modal-cancel h108-c-cancel">Annuler</button>
                        <button class="h108-modal-btn h108-modal-confirm h108-c-ok">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    function initHeures108Widget(widget, saved) {
        saved = saved || {};
        const outer = widget.querySelector('.h108-outer');
        const inner = widget.querySelector('.h108-inner');
        const q  = sel => widget.querySelector(sel);

        // Le tableau ne doit pas recevoir les appuis faits dans le widget
        outer.addEventListener('mousedown', e => e.stopPropagation());
        const stopIfNotHeader = (e) => {
            if (e.target.closest && e.target.closest('.h108-header')) return;
            e.stopPropagation();
        };
        outer.addEventListener('touchstart',  stopIfNotHeader, { passive: true });
        outer.addEventListener('pointerdown', stopIfNotHeader);
        // Les raccourcis clavier du tableau (Suppr, Ctrl+C/V, Alt+1…) ne doivent
        // pas se déclencher pendant qu'on tape dans un champ du widget
        ['keydown', 'keyup', 'keypress', 'paste', 'copy', 'cut'].forEach(type =>
            outer.addEventListener(type, e => e.stopPropagation()));

        // ── Références DOM ────────────────────────────────────────────────
        const quotRange   = q('.h108-quot-range');
        const quotVal     = q('.h108-quot-val');
        const globalTitle = q('.h108-global-title');
        const resteEl     = q('.h108-reste');
        const globalBar   = q('.h108-global-bar');
        const faitEl      = q('.h108-fait');
        const pctEl       = q('.h108-pct');
        const catsEl      = q('.h108-cats');
        const badge       = q('.h108-badge');
        const fileInput   = q('.h108-file-input');
        const nameInput   = q('.h108-name-input');
        const formOv      = q('.h108-form-overlay');
        const confirmOv   = q('.h108-confirm-overlay');
        const fTitle      = q('.h108-form-title');
        const fDate       = q('.h108-f-date');
        const fH          = q('.h108-f-h');
        const fM          = q('.h108-f-m');
        const fComm       = q('.h108-f-comm');
        const fErr        = q('.h108-form-err');
        const fDelete     = q('.h108-f-delete');
        const fSave       = q('.h108-f-save');

        // ── État ──────────────────────────────────────────────────────────
        const openCats = new Set(Array.isArray(saved.open) ? saved.open : []);
        let editId  = null;
        let selCat  = 'APC';
        let _isMax  = false;

        // ── Taille ────────────────────────────────────────────────────────
        const w0 = parseFloat(saved.w), h0 = parseFloat(saved.h);
        outer.style.width  = (w0 > 0 ? w0 : H108_DEFAULT_W) + 'px';
        outer.style.height = (h0 > 0 ? h0 : H108_DEFAULT_H) + 'px';
        function rememberSize() {
            if (outer.offsetWidth  > 0) widget.dataset.h108W = outer.offsetWidth;
            if (outer.offsetHeight > 0) widget.dataset.h108H = outer.offsetHeight;
        }
        widget.dataset.h108W = w0 > 0 ? w0 : H108_DEFAULT_W;
        widget.dataset.h108H = h0 > 0 ? h0 : H108_DEFAULT_H;

        // ── Couleur du cadre ──────────────────────────────────────────────
        function applyTheme(id) {
            if (!H108_THEMES[id]) id = 'orange';
            widget.dataset.h108Theme = id;
            outer.style.setProperty('--h108-bg', H108_THEMES[id].bg);
            outer.style.setProperty('--h108-op', H108_THEMES[id].op);
            widget.querySelectorAll('.h108-swatch').forEach(s =>
                s.classList.toggle('is-on', s.dataset.theme === id));
        }
        widget.querySelectorAll('.h108-swatch').forEach(s => {
            s.addEventListener('click', (e) => {
                e.stopPropagation();
                applyTheme(s.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });
        applyTheme(saved.theme || 'orange');

        // ── Déplacement : clic-glisser n'importe où sur une zone libre ────
        const onDragDown = (e) => {
            if (_isMax || widget.classList.contains('phone-fs')) return;
            if (typeof isDrawMode !== 'undefined' && (isDrawMode || (typeof isEraserMode !== 'undefined' && isEraserMode))) return;
            if (!window.bdpCanDragFrom(e, inner, '.h108-item, .h108-panel, .h108-modal-overlay')) return;
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus();
            if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
        };
        inner.addEventListener('mousedown',  onDragDown);
        inner.addEventListener('touchstart', onDragDown, { passive: false });

        // ── Rendu ─────────────────────────────────────────────────────────
        function render() {
            const list  = h108Load();
            const quot  = h108GetQuot();
            if (document.activeElement !== quotRange) quotRange.value = quot;
            quotVal.textContent = quot + '%';

            const total = H108_TOTAL_H * 60 * quot / 100;
            const done  = list.reduce((s, r) => s + r.minutes, 0);
            const ratio = total > 0 ? done / total : 0;

            globalTitle.textContent = 'Total annuel (' + fmtDuree(total) + ')';
            resteEl.textContent = done > total
                ? 'Dépassement : ' + fmtDuree(done - total)
                : 'Reste : ' + fmtDuree(total - done);
            resteEl.classList.toggle('over', done > total);
            globalBar.style.width = Math.min(100, ratio * 100) + '%';
            faitEl.textContent = 'Fait : ' + fmtDuree(done);
            pctEl.textContent  = Math.round(ratio * 100) + '%';
            badge.classList.toggle('on', h108IsDirty());
            if (document.activeElement !== nameInput) nameInput.value = h108GetName();

            catsEl.innerHTML = H108_CATS.map(c => {
                const items = list.filter(r => r.cat === c.key)
                                  .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
                const sum   = items.reduce((s, r) => s + r.minutes, 0);
                const quota = quotaMin(c, quot);
                const over  = sum > quota;
                const pct   = quota > 0 ? Math.min(100, sum / quota * 100) : 0;
                const open  = openCats.has(c.key);
                let listHTML = '';
                if (open) {
                    listHTML = '<div class="h108-list">' + (items.length
                        ? items.map(r =>
                            '<button class="h108-item" data-id="' + esc(r.id) + '" title="Modifier cette séance">' +
                                '<span class="h108-item-line"><span class="h108-item-date">' + fmtDate(r.date) + '</span>' +
                                '<span class="h108-item-dur">' + fmtDuree(r.minutes) + '</span></span>' +
                                (r.comm ? '<span class="h108-item-comm" style="display:block">' + esc(r.comm) + '</span>' : '') +
                            '</button>').join('')
                        : '<div class="h108-empty">Aucune séance</div>') + '</div>';
                }
                return '<div class="h108-card h108-cat">' +
                    '<div class="h108-cat-head"><span class="h108-cat-name">' + c.name + '</span>' +
                    (over ? '<span class="h108-alert" title="Quota dépassé"></span>' : '') + '</div>' +
                    '<div class="h108-bar"><i style="width:' + pct + '%"></i></div>' +
                    '<div class="h108-cat-count">' + fmtDuree(sum) + ' / ' + fmtDuree(quota) + '</div>' +
                    '<button class="h108-toggle" data-toggle="' + c.key + '">' + (open ? 'Masquer' : 'Détails') +
                    ' (' + items.length + ')</button>' + listHTML +
                '</div>';
            }).join('');
        }

        catsEl.addEventListener('click', (e) => {
            const tg = e.target.closest('[data-toggle]');
            if (tg) {
                const k = tg.dataset.toggle;
                if (openCats.has(k)) openCats.delete(k); else openCats.add(k);
                render();
                if (typeof saveBoard === 'function') saveBoard();
                return;
            }
            const it = e.target.closest('[data-id]');
            if (it) {
                const entry = h108Load().find(r => String(r.id) === it.dataset.id);
                if (entry) openForm(entry);
            }
        });

        // Synchronisation entre widgets (et autres onglets du navigateur)
        const onDataChange = () => {
            if (!document.contains(widget)) {
                window.removeEventListener('bdp-108h-changed', onDataChange);
                window.removeEventListener('storage', onStorage);
                return;
            }
            render();
        };
        const onStorage = (e) => { if (!e.key || e.key.indexOf('bdp_108h_') === 0) onDataChange(); };
        window.addEventListener('bdp-108h-changed', onDataChange);
        window.addEventListener('storage', onStorage);

        // ── Quotité / nom ─────────────────────────────────────────────────
        quotRange.addEventListener('input', () => {
            quotVal.textContent = quotRange.value + '%';
            h108SetQuot(parseInt(quotRange.value, 10));
        });
        nameInput.addEventListener('input', () => h108SetName(nameInput.value.trim()));

        // ── Fenêtre de confirmation ───────────────────────────────────────
        function showConfirm(title, text, onOk, okLabel) {
            q('.h108-c-title').textContent = title;
            q('.h108-c-text').textContent  = text || '';
            const cancel = q('.h108-c-cancel');
            const ok     = q('.h108-c-ok');
            ok.textContent = onOk ? (okLabel || 'Confirmer') : 'OK';
            cancel.style.display = onOk ? '' : 'none';
            ok.onclick = () => { closeConfirm(); if (onOk) onOk(); };
            confirmOv.classList.add('open');
        }
        function closeConfirm() { confirmOv.classList.remove('open'); }
        q('.h108-c-cancel').addEventListener('click', closeConfirm);
        confirmOv.addEventListener('click', e => { if (e.target === confirmOv) closeConfirm(); });

        // ── Formulaire de saisie ──────────────────────────────────────────
        function setCat(k) {
            selCat = k;
            widget.querySelectorAll('.h108-cat-choice button').forEach(b =>
                b.classList.toggle('is-on', b.dataset.cat === k));
        }
        widget.querySelectorAll('.h108-cat-choice button').forEach(b =>
            b.addEventListener('click', () => setCat(b.dataset.cat)));

        function openForm(entry) {
            closePanels();
            editId = entry ? entry.id : null;
            setCat(entry ? entry.cat : selCat);
            fDate.value = entry ? entry.date : todayStr();
            const hh = entry ? Math.floor(entry.minutes / 60) : 1;
            const mm = entry ? (Math.round((entry.minutes % 60) / 5) * 5) % 60 : 0;
            if (!fH.querySelector('option[value="' + hh + '"]')) {
                const o = document.createElement('option');
                o.value = hh; o.textContent = hh + ' h';
                fH.appendChild(o);
            }
            fH.value = hh;
            fM.value = mm;
            fComm.value = entry ? (entry.comm || '') : '';
            fErr.textContent = '';
            fTitle.textContent = entry ? 'Modifier la séance' : 'Nouvelle séance';
            fSave.textContent  = entry ? 'Mettre à jour' : 'Enregistrer';
            fDelete.style.display = entry ? '' : 'none';
            formOv.classList.add('open');
        }
        function closeForm() {
            formOv.classList.remove('open');
            editId = null;
        }
        function submitForm() {
            const date = fDate.value;
            const minutes = (parseInt(fH.value, 10) || 0) * 60 + (parseInt(fM.value, 10) || 0);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { fErr.textContent = 'Choisissez une date.'; return; }
            if (minutes <= 0) { fErr.textContent = 'La durée doit être supérieure à 0.'; return; }
            const comm = fComm.value.trim();
            const list = h108Load();
            if (editId !== null) {
                const i = list.findIndex(r => String(r.id) === String(editId));
                if (i >= 0) list[i] = Object.assign({}, list[i], { cat: selCat, date, minutes, comm });
            } else {
                list.push({ id: Date.now(), cat: selCat, date, minutes, comm });
            }
            openCats.add(selCat);
            h108SetDirty(true);
            closeForm();
            h108Save(list);
        }
        q('.h108-add-btn').addEventListener('click', () => openForm(null));
        q('.h108-f-cancel').addEventListener('click', closeForm);
        fSave.addEventListener('click', submitForm);
        fComm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitForm(); } });
        formOv.addEventListener('click', e => { if (e.target === formOv) closeForm(); });
        fDelete.addEventListener('click', () => {
            const id = editId;
            const entry = h108Load().find(r => String(r.id) === String(id));
            if (!entry) { closeForm(); return; }
            showConfirm('Supprimer cette séance ?',
                fmtDateLong(entry.date) + ' — ' + fmtDuree(entry.minutes) + (entry.comm ? '\n' + entry.comm : ''),
                () => {
                    h108SetDirty(true);
                    closeForm();
                    h108Save(h108Load().filter(r => String(r.id) !== String(id)));
                }, 'Supprimer');
        });

        // ── Export / import .txt ──────────────────────────────────────────
        q('.h108-export-btn').addEventListener('click', () => {
            const list = h108Load();
            if (!list.length) { showConfirm('Aucune donnée', "Il n'y a encore aucune séance à exporter."); return; }
            const blob = new Blob([JSON.stringify(list)], { type: 'text/plain;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = 'lebureauduprof_108heures_' + todayStr() + '.txt';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 200);
            h108SetDirty(false);
            h108Notify();
        });

        q('.h108-import-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                let list = [];
                try { list = h108Clean(JSON.parse(ev.target.result)); } catch (err) { list = []; }
                if (!list.length) {
                    showConfirm('Import impossible', 'Ce fichier ne contient aucune séance reconnue.');
                    return;
                }
                const cur = h108Load().length;
                showConfirm('Remplacer les données ?',
                    cur
                        ? 'Les ' + cur + ' séance(s) actuelle(s) seront remplacées par les ' + list.length + ' séance(s) du fichier.'
                        : list.length + ' séance(s) vont être importées.',
                    () => { h108SetDirty(false); h108Save(list); },
                    'Importer');
            };
            reader.readAsText(file, 'UTF-8');
        });

        // ── Effacer tout ──────────────────────────────────────────────────
        q('.h108-reset-btn').addEventListener('click', () => {
            if (!h108Load().length) { showConfirm('Rien à effacer', "Il n'y a aucune séance enregistrée."); return; }
            showConfirm('Tout effacer ?', 'Toutes les séances seront supprimées. Pensez à exporter vos données avant.', () => {
                h108SetDirty(false);
                h108Save([]);
            }, 'Tout effacer');
        });

        // ── Bilan PDF ─────────────────────────────────────────────────────
        q('.h108-pdf-btn').addEventListener('click', () => {
            const list  = h108Load();
            const quot  = h108GetQuot();
            const name  = h108GetName() || 'Enseignant';
            const total = H108_TOTAL_H * 60 * quot / 100;
            const done  = list.reduce((s, r) => s + r.minutes, 0);

            const block = (key) => {
                const c = H108_CATS.find(x => x.key === key);
                const items = list.filter(r => r.cat === key).sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
                const sum = items.reduce((s, r) => s + r.minutes, 0);
                const rows = items.length
                    ? items.map(r =>
                        '<tr style="border-bottom:0.2px solid #eee;">' +
                        '<td style="padding:2px;border-right:0.2px solid #eee;">' + fmtDateLong(r.date) + '</td>' +
                        '<td style="padding:2px;border-right:0.2px solid #eee;word-break:break-word;">' + (r.comm ? esc(r.comm) : '-') + '</td>' +
                        '<td style="padding:2px;text-align:right;font-weight:bold;">' + fmtDuree(r.minutes) + '</td></tr>').join('')
                    : '<tr><td colspan="3" style="padding:4px;color:gray;text-align:center;">Néant</td></tr>';
                return '<div style="page-break-inside:avoid;margin-bottom:12px;border:0.5px solid #000;">' +
                    '<div style="background:#eee;padding:4px;font-weight:bold;font-size:9px;border-bottom:0.5px solid #000;display:flex;justify-content:space-between;">' +
                    '<span>' + c.name + '</span><span>' + fmtDuree(sum) + ' / ' + fmtDuree(quotaMin(c, quot)) + '</span></div>' +
                    '<table style="width:100%;border-collapse:collapse;font-size:8px;"><thead>' +
                    '<tr style="background:#fafafa;border-bottom:0.5px solid #000;">' +
                    '<th style="text-align:left;padding:2px;width:24%;border-right:0.2px solid #ccc;">Date</th>' +
                    '<th style="text-align:left;padding:2px;border-right:0.2px solid #ccc;">Contenu</th>' +
                    '<th style="text-align:right;padding:2px;width:18%;">Durée</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
            };

            const container = document.createElement('div');
            container.style.cssText = 'padding:10px;color:black;background:white;font-family:Arial,sans-serif;';
            container.innerHTML =
                '<div style="text-align:center;border-bottom:1.5px solid black;padding-bottom:5px;margin-bottom:10px;">' +
                '<h1 style="font-size:14px;margin:0;text-transform:uppercase;">Bilan des 108 heures — ' + schoolYear() + '</h1>' +
                '<p style="font-size:10px;margin:2px 0;"><strong>' + esc(name) + '</strong> — Quotité : ' + quot + '% — Réalisé : <strong>' +
                fmtDuree(done) + '</strong> / ' + fmtDuree(total) + ' — Solde : <strong>' + fmtDuree(total - done) + '</strong></p></div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;align-items:start;">' +
                '<div>' + block('PEDAGO') + '</div>' +
                '<div>' + block('APC') + block('CONSEIL') + block('FORM') + '</div></div>';

            const safeName = name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_\-À-ÿ]/g, '');
            const opts = {
                margin: 8,
                filename: 'lebureauduprof_108h_' + safeName + '_' + todayStr() + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            loadHtml2pdf()
                .then(() => window.html2pdf().set(opts).from(container).save())
                .catch(() => showConfirm('PDF impossible', 'Une connexion internet est nécessaire pour créer le PDF.'));
        });

        // ── Panneaux aide / réglages ──────────────────────────────────────
        const panels = [
            [q('.h108-help-btn'),     q('.h108-help-popup')],
            [q('.h108-settings-btn'), q('.h108-settings-popup')]
        ];
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
            panel.addEventListener('click', e => e.stopPropagation());
        });
        const onDocClick = () => {
            if (!document.contains(widget)) { document.removeEventListener('click', onDocClick); return; }
            closePanels();
        };
        document.addEventListener('click', onDocClick);

        // Échap : ferme la fenêtre ouverte dans le widget
        outer.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (confirmOv.classList.contains('open')) closeConfirm();
            else if (formOv.classList.contains('open')) closeForm();
            else closePanels();
        });

        // ── Plein écran (bouton vert) ─────────────────────────────────────
        function setMax(on) {
            _isMax = !!on;
            widget.classList.toggle('wf-max', _isMax);
            if (_isMax) {
                Object.assign(inner.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '9999', borderRadius: '0' });
            } else {
                Object.assign(inner.style, { position: '', inset: '', width: '', height: '', zIndex: '', borderRadius: '' });
            }
        }
        widget._wfSetMax = setMax;
        q('[data-role="wf-max"]').addEventListener('click', (e) => {
            e.stopPropagation();
            setMax(!_isMax);
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Fermer ────────────────────────────────────────────────────────
        q('[data-role="wf-close"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Réduire en mini-barre ─────────────────────────────────────────
        const MINI_W = 300, MINI_H = 50, GAP = 10, MARGIN_TOP = 8;
        const HANDLES = ':scope > .drag-handle, :scope > .widget-action-bar, :scope > .widget-rotate-handle, :scope > .custom-resize-handle';

        function buildMiniBar() {
            if (widget.querySelector(':scope > .h108-mini-bar')) return;
            const miniBar = document.createElement('div');
            miniBar.className = 'h108-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + MINI_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '🕒 108 heures';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); expand(); });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            miniBar.addEventListener('mousedown', e => e.stopPropagation());
            miniBar.addEventListener('pointerdown', (e) => {
                if (expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = ev => {
                    widget.style.left = Math.max(0, ev.clientX - startX) + 'px';
                    widget.style.top  = Math.max(0, ev.clientY - startY) + 'px';
                };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup',   onUp);
                    miniBar.removeEventListener('pointercancel', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup',   onUp);
                miniBar.addEventListener('pointercancel', onUp);
            });
        }

        function collapse() {
            if (widget.dataset.collapsed === '1') return;
            closeForm(); closeConfirm(); closePanels();
            if (_isMax) setMax(false);
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') {
                window.exitPhoneFullscreen(widget);
            }
            rememberSize();
            // Position d'origine : relue par save-load.js tant que le widget est réduit
            widget.dataset.wfMiniSavedLeft = widget.offsetLeft;
            widget.dataset.wfMiniSavedTop  = widget.offsetTop;

            outer.style.display = 'none';
            widget.querySelectorAll(HANDLES).forEach(el => el.style.display = 'none');

            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.dataset.collapsed === '1');
            const x = others.reduce((mx, w) => Math.max(mx, w.offsetLeft + MINI_W + GAP), MARGIN_TOP);
            Object.assign(widget.style, {
                left: x + 'px', top: MARGIN_TOP + 'px',
                width: MINI_W + 'px', height: MINI_H + 'px',
                overflow: 'hidden', borderRadius: '8px', border: 'none', padding: '0'
            });
            widget.dataset.collapsed = '1';
            buildMiniBar();
            if (typeof saveBoard === 'function') saveBoard();
        }

        function expand() {
            widget.querySelectorAll(':scope > .h108-mini-bar').forEach(el => el.remove());
            const l = parseFloat(widget.dataset.wfMiniSavedLeft);
            const t = parseFloat(widget.dataset.wfMiniSavedTop);
            ['width', 'height', 'overflow', 'borderRadius', 'border', 'padding'].forEach(p => widget.style[p] = '');
            if (!isNaN(l)) widget.style.left = l + 'px';
            if (!isNaN(t)) widget.style.top  = t + 'px';
            delete widget.dataset.wfMiniSavedLeft;
            delete widget.dataset.wfMiniSavedTop;
            widget.dataset.collapsed = '0';
            outer.style.display = '';
            widget.querySelectorAll(HANDLES).forEach(el => el.style.display = '');
            render();
            if (typeof bringToFront === 'function') bringToFront(widget);
            if (typeof saveBoard === 'function') saveBoard();
        }
        widget._h108Expand = expand;

        q('[data-role="wf-min"]').addEventListener('pointerdown', e => e.stopPropagation());
        q('[data-role="wf-min"]').addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); collapse(); });

        // ── Poignée de redimensionnement libre ────────────────────────────
        if (!widget.querySelector(':scope > .custom-resize-handle')) {
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
                const startW = outer.offsetWidth, startH = outer.offsetHeight;
                const onMove = (ev) => {
                    ev.preventDefault();
                    outer.style.width  = Math.max(300, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(260, startH + ev.clientY - startY) + 'px';
                };
                const onUp = () => {
                    handle.removeEventListener('pointermove',   onMove);
                    handle.removeEventListener('pointerup',     onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    rememberSize();
                    if (typeof saveBoard === 'function') saveBoard();
                };
                handle.addEventListener('pointermove',   onMove);
                handle.addEventListener('pointerup',     onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        }

        // ── Sauvegarde dans le tableau (lue par save-load.js) ─────────────
        widget._h108GetData = function () {
            if (widget.dataset.collapsed !== '1' && !widget.classList.contains('phone-fs')) rememberSize();
            return {
                w: parseFloat(widget.dataset.h108W) || H108_DEFAULT_W,
                h: parseFloat(widget.dataset.h108H) || H108_DEFAULT_H,
                theme: widget.dataset.h108Theme || 'orange',
                collapsed: widget.dataset.collapsed === '1',
                max: _isMax,
                open: Array.from(openCats)
            };
        };

        // ── Premier affichage + état restauré ─────────────────────────────
        render();
        if (saved.collapsed) {
            // Après que save-load.js a replacé le widget à sa position d'origine
            setTimeout(collapse, 0);
        } else if (saved.max) {
            setMax(true);
        }
    }

    // =========================================================================
    // CRÉATION D'UN WIDGET (nouveau ou restauré)
    //   savedData : null pour un nouveau widget, objet h108Data (ou
    //   { _restored: true }) quand save-load.js reconstruit le tableau.
    // =========================================================================
    window.createHeures108Widget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (!restoring && typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'heures108';
        widget.dataset.transparent = 'true';
        widget.style.cssText = 'left:100px; top:' + pos.y + 'px;';
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
            <div class="h108-outer">${h108InnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (!restoring && typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (!restoring) widget.focus();
        // Une erreur à l'initialisation ne doit jamais bloquer la suite
        try { initHeures108Widget(widget, restoring ? savedData : null); }
        catch (e) { console.error('108 heures : erreur à l\'ouverture', e); }
        // Sur téléphone : ouverture directe en plein écran (bouton vert)
        if (!restoring && isPhoneNow() && widget._wfSetMax) widget._wfSetMax(true);
        if (!restoring && typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK createWidget — intercepter le type 'heures108'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function' || _orig._h108Patched) return;
            window.createWidget = function (type) {
                if (type === 'heures108') return window.createHeures108Widget();
                return _orig.apply(this, arguments);
            };
            window.createWidget._h108Patched = true;
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
