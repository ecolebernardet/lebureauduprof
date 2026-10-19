// =========================================================================
// WIDGET DÉROULÉ DE LA JOURNÉE — Le Bureau du Prof
// Les activités du jour en vignettes, avec un curseur « On en est là »
// qui avance tout seul avec l'heure (mode Auto) ou à la main (mode Manuel).
// Graphisme aligné sur le Tirage au sort / 108 heures : cadre coloré arrondi,
// pastilles « verre », police Quicksand, couleur du cadre au choix,
// redimensionnement libre, aide, réduire, plein écran, fermer.
//
// Données :
//   • Le programme de la semaine (une liste d'activités par jour) est gardé
//     dans le tableau (save-load.js, champ derData) ET recopié dans le
//     navigateur (localStorage « bdp_deroule_programme ») : un nouveau widget
//     reprend ainsi le dernier programme saisi.
//   • Le tableau mémorise aussi : taille, couleur, mode, disposition,
//     options d'affichage, position du curseur manuel, réduit / plein écran.
//   • Export / import du programme dans un fichier .txt.
//
// 📌 Intégration dans index.html :
//   <script src="outil-deroule-journee.js"></script>   (après outil-108heures.js)
//   Carte du panneau Outils : onclick="createDerouleWidget();toggleToolsPanel()"
//   Ajouter 'deroule' à la liste EXCLUDED_TYPES (plein écran géré par le widget)
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
    if (window.createDerouleWidget) return; // fichier déjà chargé

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
    /* ── Widget transparent : der-outer porte tout le visuel ── */
    .widget[data-type="deroule"],
    .widget[data-type="deroule"]:focus-within {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }
    .widget[data-type="deroule"] .der-outer {
        --der-ink:   #14202E;
        --der-glass: rgba(255,255,255,0.62);
        --der-bg:    #8EC5F2;
        --der-op:    #2F6FB3;

        position: relative;
        width: 480px;
        height: 640px;
        min-width: 280px;
        min-height: 300px;
        overflow: hidden;
        box-sizing: border-box;
        border-radius: 24px;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
    }
    .widget[data-type="deroule"]:hover .der-outer,
    .widget[data-type="deroule"]:focus-within .der-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Cadre coloré ── */
    .der-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px 16px;
        box-sizing: border-box;
        background-color: var(--der-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        border-radius: 24px;
        overflow: hidden;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--der-ink);
        user-select: none;
        position: relative;
        container-type: size;
        transition: background-color .3s;
        cursor: move;
    }

    /* ── En-tête : deux pastilles « verre » ── */
    .der-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 0 0;
        flex-shrink: 0;
        cursor: move;
    }
    .der-title,
    .der-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--der-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .der-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        pointer-events: none;
    }
    .der-title span { overflow: hidden; text-overflow: ellipsis; }
    .der-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--der-op); }
    .der-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
    @container (max-width: 420px) { .der-title span { display: none; } .der-title { padding: 7px 10px; } }

    .der-icon-btn {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--der-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .der-icon-btn svg { width: 18px; height: 18px; }
    .der-icon-btn:hover,
    .der-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .der-icon-btn:focus-visible { outline: 2px solid var(--der-ink); outline-offset: 2px; }
    .der-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Barre des jours + horloge ── */
    .der-daybar {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: clamp(11px, 2cqmin, 17px);
    }
    .der-chips {
        display: flex;
        gap: 3px;
        padding: 4px;
        border-radius: 999px;
        background: var(--der-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .der-chip {
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: 0.85em;
        font-weight: 700;
        color: var(--der-ink);
        padding: .3em .55em;
        border-radius: 999px;
        cursor: pointer;
        position: relative;
        transition: background .15s, color .15s;
    }
    .der-chip:hover { background: rgba(20,32,46,0.1); }
    .der-chip.is-empty { opacity: .4; }
    .der-chip.is-today::after {
        content: '';
        position: absolute;
        left: 50%; bottom: 1px;
        width: 4px; height: 4px;
        margin-left: -2px;
        border-radius: 50%;
        background: var(--der-op);
    }
    .der-chip.is-on { background: var(--der-op); color: #fff; opacity: 1; }
    .der-chip.is-on.is-today::after { background: #fff; }
    .der-clock {
        margin-left: auto;
        font-weight: 700;
        font-size: 1.05em;
        padding: .3em .8em;
        border-radius: 999px;
        background: var(--der-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }
    @container (max-width: 380px) { .der-chip { padding: .3em .4em; } }

    /* ── Zone blanche (contenu) ── */
    .der-body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.7em;
        padding: 0.9em;
        box-sizing: border-box;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        font-size: clamp(12px, 2.6cqmin, 26px);
        overflow: hidden;
    }

    /* Carte d'état « Maintenant » */
    .der-status {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: .7em;
        padding: .7em .9em;
        border-radius: 14px;
        background: color-mix(in srgb, var(--der-c, var(--der-op)) 16%, #fff);
        border: 2px solid color-mix(in srgb, var(--der-c, var(--der-op)) 55%, transparent);
    }
    .der-status-emo { font-size: 2.1em; line-height: 1; flex-shrink: 0; }
    .der-status-txt { min-width: 0; display: flex; flex-direction: column; gap: .1em; }
    .der-status-kicker {
        font-size: .68em; font-weight: 700; text-transform: uppercase;
        letter-spacing: .06em; color: rgba(20,32,46,0.6);
    }
    .der-status-lab { font-size: 1.25em; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }
    .der-status-sub { font-size: .78em; font-weight: 700; color: rgba(20,32,46,0.65); }

    .der-hint {
        font-size: .7em; font-weight: 700; text-align: center;
        color: var(--der-op);
        flex-shrink: 0;
    }

    /* Liste des activités */
    .der-list {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: .45em;
        padding: .15em .1em .3em;
        scrollbar-width: thin;
        scrollbar-color: rgba(20,32,46,0.25) transparent;
        touch-action: pan-y;
    }
    .der-item {
        --der-c: var(--der-op);
        position: relative;
        display: flex;
        align-items: center;
        gap: .65em;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        flex-shrink: 0;
        padding: .5em .75em;
        border-radius: 12px;
        border: 1.5px solid rgba(20,32,46,0.1);
        border-left: .35em solid var(--der-c);
        background: #fff;
        font-family: inherit;
        font-size: 1em;
        color: var(--der-ink);
        cursor: default;
        overflow: hidden;
        transition: opacity .3s, transform .15s, box-shadow .2s, background .2s;
    }
    .der-item.is-click { cursor: pointer; }
    .der-item.is-click:hover { border-color: rgba(20,32,46,0.28); border-left-color: var(--der-c); }
    .der-emo { font-size: 1.45em; line-height: 1; width: 1.35em; text-align: center; flex-shrink: 0; }
    .der-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .der-lab { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .der-time { font-size: .72em; font-weight: 700; color: rgba(20,32,46,0.55); font-variant-numeric: tabular-nums; }
    .der-mark { font-size: .8em; font-weight: 700; flex-shrink: 0; color: rgba(20,32,46,0.45); }

    .der-item.is-done { opacity: .45; }
    .der-item.is-done .der-lab { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: rgba(20,32,46,0.35); }
    .der-item.is-done .der-mark { color: #23915A; }
    .der-item.is-cur {
        background: color-mix(in srgb, var(--der-c) 14%, #fff);
        border-color: var(--der-c);
        box-shadow: 0 6px 16px -10px var(--der-c);
        transform: scale(1.02);
        margin: .15em 0;
        padding-bottom: .85em;
    }
    .der-item.is-cur .der-mark {
        color: #fff;
        background: var(--der-c);
        padding: .2em .65em;
        border-radius: 999px;
        font-size: .68em;
        text-transform: uppercase;
        letter-spacing: .04em;
        white-space: nowrap;
    }
    .der-item.is-next .der-mark { color: var(--der-c); }
    .der-prog {
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: .3em;
        background: rgba(20,32,46,0.08);
    }
    .der-prog > i { display: block; height: 100%; background: var(--der-c); transition: width .6s ease-out; }
    .der-empty {
        margin: auto;
        text-align: center;
        font-size: .85em;
        font-weight: 700;
        color: rgba(20,32,46,0.5);
        line-height: 1.5;
        padding: 1em;
    }
    .der-empty b { font-size: 2em; display: block; }

    /* Disposition « bande » (horizontale) */
    .der-outer.is-band .der-list {
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
        align-items: stretch;
        touch-action: pan-x;
        padding: .3em .2em .5em;
        gap: .55em;
    }
    .der-outer.is-band .der-item {
        flex-direction: column;
        justify-content: center;
        text-align: center;
        width: 7.5em;
        min-width: 7.5em;
        border-left: 1.5px solid rgba(20,32,46,0.1);
        border-top: .35em solid var(--der-c);
        padding: .7em .5em 1em;
        gap: .35em;
    }
    .der-outer.is-band .der-item.is-cur { border-color: var(--der-c); border-top-width: .35em; transform: scale(1.04); margin: 0 .15em; }
    .der-outer.is-band .der-emo { font-size: 2.4em; width: auto; }
    .der-outer.is-band .der-txt { align-items: center; width: 100%; }
    .der-outer.is-band .der-lab { white-space: normal; overflow-wrap: break-word; -webkit-hyphens: auto; hyphens: auto; line-height: 1.15; font-size: .92em; }
    .der-outer.is-band .der-mark { min-height: 1.4em; }

    /* Mode édition */
    .der-outer.is-edit .der-item { cursor: pointer; border-style: dashed; border-left-style: solid; }
    .der-outer.is-edit.is-band .der-item { border-left-style: dashed; border-top-style: solid; }
    .der-outer.is-edit .der-item:hover { background: #F4F6F9; }
    .der-outer.is-edit .der-item.is-cur, .der-outer.is-edit .der-item.is-done { opacity: 1; transform: none; background: #fff; box-shadow: none; margin: 0; padding-bottom: .5em; }
    .der-outer.is-edit .der-item .der-lab { text-decoration: none; }

    /* ── Pied : boutons (pastilles « verre ») ── */
    .der-footer {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        align-items: center;
        font-size: clamp(11px, 1.9cqmin, 18px);
    }
    .der-btn {
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
        background: var(--der-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        color: var(--der-ink);
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        transition: background .15s, transform .1s, filter .15s;
        white-space: nowrap;
    }
    .der-btn:hover { background: rgba(255,255,255,0.85); }
    .der-btn:active { transform: scale(0.97); }
    .der-btn:disabled { opacity: .45; cursor: default; transform: none; }
    .der-btn.primary {
        background: var(--der-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
    }
    .der-btn.primary:hover { filter: brightness(1.1); background: var(--der-op); }
    .der-btn.primary:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }
    .der-btn.danger { color: #C0392B; }
    .der-btn.is-on { background: var(--der-ink); color: #fff; }
    .der-mode {
        display: inline-flex;
        padding: 3px;
        border-radius: 999px;
        background: var(--der-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .der-mode button {
        border: none; background: transparent;
        font-family: inherit; font-size: .9em; font-weight: 700;
        color: var(--der-ink);
        padding: .4em .85em;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
    }
    .der-mode button.is-on { background: var(--der-op); color: #fff; }
    .der-footer [hidden] { display: none !important; }
    @container (max-width: 470px) { .der-btn-txt { display: none; } .der-btn.primary .der-btn-txt { display: inline; } }

    /* ── Petits cadres : on compacte ── */
    @container (max-height: 470px) {
        .der-inner { gap: 7px; }
        .der-header { padding-top: 10px; }
        .der-title { padding: 5px 12px 5px 10px; font-size: 13px; }
        .der-tools { padding: 3px 10px 3px 4px; }
        .der-icon-btn { width: 28px; height: 28px; }
        .der-body { padding: .6em; gap: .5em; }
        .der-btn { padding: .35em .9em; }
        .der-status { padding: .45em .7em; }
        .der-status-emo { font-size: 1.6em; }
    }

    /* ── Fenêtres modales ── */
    .der-modal-overlay {
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
    .der-modal-overlay.open { display: flex; }
    .der-confirm-overlay { z-index: 210; }
    .der-modal-box {
        background: rgba(255,255,255,0.97);
        padding: 18px;
        border-radius: 18px;
        width: 100%;
        max-width: 360px;
        max-height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
        color: var(--der-ink);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        user-select: text;
    }
    .der-form-box { max-width: 420px; }
    .der-modal-title { font-size: 15px; font-weight: 700; text-align: center; margin-bottom: 10px; }
    .der-modal-text {
        font-size: 13px; color: rgba(20,32,46,0.7); text-align: center;
        line-height: 1.5; font-weight: 600; white-space: pre-line; margin: 0;
    }
    .der-modal-text:empty { display: none; }
    .der-modal-btns { display: flex; gap: 8px; margin-top: 14px; }
    .der-modal-btn {
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
    .der-modal-btn:active { transform: scale(0.96); }
    .der-modal-cancel { background: rgba(20,32,46,0.08); color: var(--der-ink); }
    .der-modal-cancel:hover { background: rgba(20,32,46,0.15); }
    .der-modal-confirm { background: var(--der-op); color: #fff; }
    .der-modal-confirm:hover { filter: brightness(1.1); }
    .der-modal-danger { background: #C0392B; color: #fff; }
    .der-modal-danger:hover { filter: brightness(1.1); }

    .der-presets {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
        gap: 4px;
    }
    .der-presets button {
        height: 38px;
        border-radius: 10px;
        border: 1.5px solid rgba(20,32,46,0.1);
        background: #F4F6F9;
        font-size: 19px;
        cursor: pointer;
        padding: 0;
        transition: background .15s, transform .1s;
    }
    .der-presets button:hover { background: #E6EBF1; transform: scale(1.06); }
    .der-presets button.is-on { border-color: var(--der-op); background: #fff; box-shadow: 0 0 0 2px var(--der-op) inset; }
    .der-field { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
    .der-field-label {
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .06em; color: rgba(20,32,46,0.55); margin-left: 4px;
    }
    .der-input {
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1.5px solid rgba(20,32,46,0.15);
        background: #fff;
        color: var(--der-ink);
        width: 100%;
        box-sizing: border-box;
        outline: none;
        user-select: text;
    }
    .der-input:focus { border-color: var(--der-op); }
    .der-row2 { display: grid; grid-template-columns: 54px 1fr; gap: 6px; }
    .der-row2b { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .der-f-emo { text-align: center; font-size: 18px; padding: 6px 4px; }
    .der-form-err { color: #C0392B; font-size: 12px; font-weight: 700; text-align: center; margin-top: 8px; }
    .der-form-err:empty { display: none; }
    .der-colors { display: flex; flex-wrap: wrap; gap: 6px; }
    .der-color {
        width: 26px; height: 26px; border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.12);
        cursor: pointer; padding: 0;
    }
    .der-color.is-on { border-color: var(--der-ink); box-shadow: 0 0 0 2px #fff inset; }
    .der-copy-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; margin-top: 12px; }
    .der-copy-days button {
        padding: 8px 0;
        border-radius: 10px;
        border: 1.5px solid rgba(20,32,46,0.12);
        background: #F4F6F9;
        font-family: inherit; font-size: 11px; font-weight: 700;
        color: rgba(20,32,46,0.7);
        cursor: pointer;
    }
    .der-copy-days button.is-on { background: var(--der-op); color: #fff; border-color: transparent; }
    .der-copy-days button:disabled { opacity: .3; cursor: default; }

    /* ── Panneaux (aide, réglages) ── */
    .der-panel {
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
        color: var(--der-ink);
        cursor: default;
    }
    .der-panel.show { display: flex; }
    .der-panel-title { font-size: 13px; font-weight: 700; }
    .der-panel-label { font-size: 11px; font-weight: 700; color: rgba(20,32,46,0.6); }
    .der-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .der-help-list li { margin-bottom: 4px; }
    .der-help-list em { font-style: normal; font-weight: 700; color: var(--der-op); }
    .der-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .der-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .der-swatch.is-on { border-color: var(--der-ink); box-shadow: 0 0 0 2px #fff inset; }
    .der-seg { display: flex; gap: 4px; }
    .der-seg button {
        flex: 1;
        padding: 7px 4px;
        border-radius: 10px;
        border: 1.5px solid rgba(20,32,46,0.12);
        background: #F4F6F9;
        font-family: inherit; font-size: 12px; font-weight: 700;
        color: rgba(20,32,46,0.7);
        cursor: pointer;
    }
    .der-seg button.is-on { background: var(--der-op); color: #fff; border-color: transparent; }
    .der-check { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .der-check input { accent-color: var(--der-op); width: 16px; height: 16px; cursor: pointer; }
    .der-panel-btns { display: flex; gap: 6px; }
    .der-panel-btns button {
        flex: 1;
        padding: 7px 4px;
        border-radius: 999px;
        border: none;
        background: rgba(20,32,46,0.08);
        font-family: inherit; font-size: 12px; font-weight: 700;
        color: var(--der-ink);
        cursor: pointer;
    }
    .der-panel-btns button:hover { background: rgba(20,32,46,0.15); }

    /* ── Plein écran (bouton vert) ── */
    .widget.wf-max[data-type="deroule"] .der-outer { outline: none !important; }
    .widget.wf-max[data-type="deroule"] .der-header { cursor: default; }
    .widget.wf-max[data-type="deroule"] .der-inner {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
    }
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget.wf-max[data-type="deroule"] .der-inner {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            padding: 0 10px 10px;
        }
    }

    /* ── Téléphone : plein écran générique (.phone-fs) par sécurité ── */
    .widget.phone-fs[data-type="deroule"] {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
        z-index: 49990 !important;
    }
    .widget.phone-fs[data-type="deroule"] .der-outer {
        width: 100% !important; height: 100% !important;
        min-width: 0 !important; min-height: 0 !important;
        border-radius: 0 !important; outline: none !important;
    }
    .widget.phone-fs[data-type="deroule"] .der-inner { border-radius: 0 !important; padding: 0 10px 10px; }
    .widget.phone-fs[data-type="deroule"] .der-header { cursor: default; padding-right: 56px; }

    .widget[data-type="deroule"] .der-inner button,
    .widget[data-type="deroule"] .der-inner input,
    .widget[data-type="deroule"] .der-inner select { touch-action: manipulation; }

    .der-inner input[type="text"], .der-inner input[type="time"] { cursor: text; }
    .der-inner select, .der-inner button:not(:disabled), .der-inner input[type="checkbox"] { cursor: pointer; }
    .der-outer:not(.is-edit) .der-item:not(.is-click) { cursor: move; }
    .widget.wf-max[data-type="deroule"] .der-inner,
    .widget.phone-fs[data-type="deroule"] .der-inner { cursor: default; }
    `;

    if (!document.getElementById('der-widget-style')) {
        const s = document.createElement('style');
        s.id = 'der-widget-style';
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
    const DER_KEY_PROG  = 'bdp_deroule_programme';
    const DER_DEFAULT_W = 480;
    const DER_DEFAULT_H = 640;

    // Jours dans l'ordre d'affichage (clé = Date.getDay())
    const DER_DAYS = [
        { k: '1', short: 'Lun', long: 'lundi' },
        { k: '2', short: 'Mar', long: 'mardi' },
        { k: '3', short: 'Mer', long: 'mercredi' },
        { k: '4', short: 'Jeu', long: 'jeudi' },
        { k: '5', short: 'Ven', long: 'vendredi' },
        { k: '6', short: 'Sam', long: 'samedi' },
        { k: '0', short: 'Dim', long: 'dimanche' }
    ];
    const DER_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                        'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    // Couleurs des vignettes
    const DER_COLORS = ['#2F6FB3', '#23915A', '#D2691E', '#C2456E', '#6A4FC2', '#B9770E', '#0E8C8C', '#4A5868'];

    // Activités prêtes à l'emploi : emoji, nom, couleur
    const DER_PRESETS = [
        ['👋', 'Accueil',            '#4A5868'],
        ['📅', 'Rituels',            '#0E8C8C'],
        ['📖', 'Français',           '#2F6FB3'],
        ['✏️', 'Écriture',           '#2F6FB3'],
        ['📚', 'Lecture',            '#2F6FB3'],
        ['🔤', 'Orthographe',        '#2F6FB3'],
        ['🔢', 'Mathématiques',      '#D2691E'],
        ['🧮', 'Calcul mental',      '#D2691E'],
        ['📐', 'Géométrie',          '#D2691E'],
        ['🔬', 'Sciences',           '#23915A'],
        ['🏰', 'Histoire',           '#B9770E'],
        ['🌍', 'Géographie',         '#B9770E'],
        ['🤝', 'EMC',                '#6A4FC2'],
        ['🇬🇧', 'Anglais',            '#C2456E'],
        ['🎨', 'Arts plastiques',    '#C2456E'],
        ['🎵', 'Musique',            '#C2456E'],
        ['🏃', 'Sport',              '#23915A'],
        ['🏊', 'Piscine',            '#0E8C8C'],
        ['💻', 'Informatique',       '#4A5868'],
        ['📝', 'Évaluation',         '#C2456E'],
        ['🧩', 'Ateliers',           '#6A4FC2'],
        ['🎧', 'Travail autonome',   '#6A4FC2'],
        ['⚽', 'Récréation',         '#23915A'],
        ['🍽️', 'Cantine',            '#B9770E'],
        ['😴', 'Sieste / repos',     '#6A4FC2'],
        ['🧘', 'Retour au calme',    '#0E8C8C'],
        ['🗣️', 'Conseil de classe',  '#6A4FC2'],
        ['🚌', 'Sortie',             '#D2691E'],
        ['💬', 'Bilan de la journée', '#4A5868'],
        ['🏠', 'Fin de la journée',  '#4A5868']
    ];

    // Couleurs du cadre (mêmes que le Tirage au sort / 108 heures)
    const DER_THEMES = {
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        orange: { name: 'Orange',  bg: '#F7B98A', op: '#D2691E' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };

    // ── Icônes ────────────────────────────────────────────────────────────
    const ICON_DAY     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 14h3M7.5 17h6"/></svg>';
    const ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';
    const ICON_EDIT    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';

    // ── Outils ────────────────────────────────────────────────────────────
    function pad(n) { return String(n).padStart(2, '0'); }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function toMin(t) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ''));
        return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : NaN;
    }
    function fmtHM(t) { const v = toMin(t); return isNaN(v) ? '' : pad(Math.floor(v / 60)) + 'h' + pad(v % 60); }
    function fmtLeft(min) {
        min = Math.max(0, Math.ceil(min));
        if (min < 60) return min + ' min';
        const h = Math.floor(min / 60), m = min % 60;
        return h + ' h' + (m ? ' ' + pad(m) : '');
    }
    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    function todayKey() { return String(new Date().getDay()); }
    function dayInfo(k) { return DER_DAYS.find(d => d.k === String(k)) || DER_DAYS[0]; }
    function newId() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    function sortDay(list) {
        return list.slice().sort((a, b) => (toMin(a.start) - toMin(b.start)) || 0);
    }

    // Programme d'exemple : une journée type les lundi, mardi, jeudi et vendredi
    function exampleProgram() {
        const day = [
            ['👋', 'Accueil',             '08:20', '08:30', '#4A5868'],
            ['📅', 'Rituels',             '08:30', '08:50', '#0E8C8C'],
            ['📖', 'Français',            '08:50', '10:00', '#2F6FB3'],
            ['⚽', 'Récréation',          '10:00', '10:15', '#23915A'],
            ['🔢', 'Mathématiques',       '10:15', '11:30', '#D2691E'],
            ['🍽️', 'Cantine',             '11:30', '13:30', '#B9770E'],
            ['📚', 'Lecture',             '13:30', '14:15', '#2F6FB3'],
            ['🔬', 'Sciences',            '14:15', '15:00', '#23915A'],
            ['⚽', 'Récréation',          '15:00', '15:15', '#23915A'],
            ['🎨', 'Arts plastiques',     '15:15', '16:15', '#C2456E'],
            ['💬', 'Bilan de la journée', '16:15', '16:30', '#4A5868']
        ];
        const prog = {};
        DER_DAYS.forEach(d => { prog[d.k] = []; });
        ['1', '2', '4', '5'].forEach(k => {
            prog[k] = day.map(r => ({ id: newId(), emo: r[0], label: r[1], start: r[2], end: r[3], color: r[4] }));
        });
        return prog;
    }

    function cleanProgram(p) {
        const out = {};
        let count = 0;
        DER_DAYS.forEach(d => {
            const src = p && Array.isArray(p[d.k]) ? p[d.k] : [];
            out[d.k] = [];
            src.forEach(a => {
                if (!a || isNaN(toMin(a.start))) return;
                const label = String(a.label || '').trim().slice(0, 80);
                if (!label) return;
                const end = isNaN(toMin(a.end)) ? '' : String(a.end);
                out[d.k].push({
                    id: a.id ? String(a.id) : newId(),
                    emo: String(a.emo || '').slice(0, 8),
                    label,
                    start: String(a.start),
                    end: (end && toMin(end) > toMin(a.start)) ? end : '',
                    color: /^#[0-9a-fA-F]{6}$/.test(a.color) ? a.color : DER_COLORS[0]
                });
                count++;
            });
            out[d.k] = sortDay(out[d.k]);
        });
        out._count = count;
        return out;
    }
    function stripCount(p) { const c = Object.assign({}, p); delete c._count; return c; }

    function loadStoredProgram() {
        try {
            const raw = localStorage.getItem(DER_KEY_PROG);
            if (raw) {
                const p = cleanProgram(JSON.parse(raw));
                if (p._count > 0) return stripCount(p);
            }
        } catch (e) {}
        return null;
    }
    function storeProgram(p) {
        try { localStorage.setItem(DER_KEY_PROG, JSON.stringify(p)); } catch (e) {}
    }

    // ── HTML interne ──────────────────────────────────────────────────────
    function derInnerHTML() {
        const swatches = Object.keys(DER_THEMES).map(id =>
            '<button class="der-swatch" data-theme="' + id + '" title="' + DER_THEMES[id].name +
            '" style="background:' + DER_THEMES[id].bg + '"></button>'
        ).join('');
        const chips = DER_DAYS.map(d =>
            '<button class="der-chip" data-day="' + d.k + '" title="Voir le ' + d.long + '">' + d.short + '</button>'
        ).join('');
        const presets = DER_PRESETS.map((p, i) =>
            '<button type="button" data-preset="' + i + '" title="' + esc(p[1]) + '">' + p[0] + '</button>'
        ).join('');
        const colors = DER_COLORS.map(c =>
            '<button type="button" class="der-color" data-color="' + c + '" style="background:' + c + '"></button>'
        ).join('');
        const copyDays = DER_DAYS.map(d =>
            '<button type="button" data-copy="' + d.k + '">' + d.short + '</button>'
        ).join('');

        return `
        <div class="der-inner" lang="fr">
            <div class="der-header">
                <div class="der-title">${ICON_DAY}<span>Déroulé de la journée</span></div>
                <div class="der-tools">
                    <button class="der-icon-btn der-edit-btn" title="Modifier le programme" onmousedown="event.stopPropagation()">${ICON_EDIT}</button>
                    <button class="der-icon-btn der-settings-btn" title="Réglages (affichage, couleur du cadre)" onmousedown="event.stopPropagation()">${ICON_PALETTE}</button>
                    <button class="der-icon-btn der-help-btn" title="Aide" onmousedown="event.stopPropagation()">${ICON_HELP}</button>
                    <span class="der-sep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"     onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran" onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"      onmousedown="event.stopPropagation()"></button>
                    </div>
                </div>
            </div>

            <div class="der-panel der-help-popup">
                <div class="der-panel-title">Aide — Déroulé de la journée</div>
                <ul class="der-help-list">
                    <li>Pour <b>déplacer</b> le widget : cliquez-glissez sur une zone libre du cadre.</li>
                    <li>En mode <em>Auto</em>, le curseur « On en est là » avance tout seul avec l'heure et la barre montre le temps écoulé.</li>
                    <li>En mode <em>Manuel</em>, avancez avec <b>Suivant</b> / <b>Précédent</b>, ou cliquez directement sur une activité. Pratique quand on prend du retard !</li>
                    <li>Les pastilles <b>Lun… Dim</b> affichent un autre jour. Le point indique aujourd'hui.</li>
                    <li>Le <b>crayon</b> ouvre le mode édition : ajoutez une activité, cliquez sur une vignette pour la modifier, ou copiez la journée vers d'autres jours.</li>
                    <li>Le programme est enregistré avec le tableau et repris par tout nouveau widget. <b>Exporter</b> / <b>Importer</b> (dans les réglages) permettent de le transférer sur un autre ordinateur.</li>
                </ul>
            </div>
            <div class="der-panel der-settings-popup">
                <div class="der-panel-title">Réglages</div>
                <div class="der-panel-label">Disposition</div>
                <div class="der-seg der-layout-seg">
                    <button type="button" data-layout="col">☰ Colonne</button>
                    <button type="button" data-layout="band">▭ Bande</button>
                </div>
                <label class="der-check"><input type="checkbox" class="der-opt-times"> Afficher les horaires</label>
                <label class="der-check"><input type="checkbox" class="der-opt-left"> Afficher le temps restant (mode Auto)</label>
                <label class="der-check"><input type="checkbox" class="der-opt-clock"> Afficher l'horloge</label>
                <div class="der-panel-label">Couleur du cadre</div>
                <div class="der-swatches">${swatches}</div>
                <div class="der-panel-label">Programme de la semaine</div>
                <div class="der-panel-btns">
                    <button type="button" class="der-export-btn">💾 Exporter</button>
                    <button type="button" class="der-import-btn">📂 Importer</button>
                </div>
                <input type="file" class="der-file-input" accept=".txt,.json" style="display:none;">
            </div>

            <div class="der-daybar">
                <div class="der-chips">${chips}</div>
                <div class="der-clock"></div>
            </div>

            <div class="der-body">
                <div class="der-status"></div>
                <div class="der-hint" hidden>✏️ Cliquez sur une activité pour la modifier</div>
                <div class="der-list"></div>
            </div>

            <div class="der-footer">
                <div class="der-mode" data-group="view">
                    <button type="button" data-mode="auto" title="Le curseur suit l'heure">🕐 Auto</button>
                    <button type="button" data-mode="manual" title="Le curseur avance à la main">✋ Manuel</button>
                </div>
                <button class="der-btn der-prev-btn" data-group="manual" title="Activité précédente">◀<span class="der-btn-txt"> Précédent</span></button>
                <button class="der-btn primary der-next-btn" data-group="manual" title="Activité suivante"><span class="der-btn-txt">Suivant </span>▶</button>

                <button class="der-btn primary der-add-btn" data-group="edit" title="Ajouter une activité à ce jour">＋<span class="der-btn-txt"> Ajouter</span></button>
                <button class="der-btn der-copy-btn" data-group="edit" title="Copier ce jour vers d'autres jours">📋<span class="der-btn-txt"> Copier vers…</span></button>
                <button class="der-btn danger der-clear-btn" data-group="edit" title="Vider ce jour">🗑<span class="der-btn-txt"> Vider</span></button>
                <button class="der-btn is-on der-done-btn" data-group="edit" title="Quitter le mode édition">✓<span class="der-btn-txt"> Terminé</span></button>
            </div>

            <div class="der-modal-overlay der-form-overlay">
                <div class="der-modal-box der-form-box">
                    <div class="der-modal-title der-form-title">Nouvelle activité</div>
                    <div class="der-presets">${presets}</div>
                    <div class="der-field">
                        <span class="der-field-label">Pictogramme et nom</span>
                        <div class="der-row2">
                            <input type="text" class="der-input der-f-emo" maxlength="8" autocomplete="off" aria-label="Pictogramme">
                            <input type="text" class="der-input der-f-label" maxlength="80" autocomplete="off" placeholder="Ex. : Mathématiques">
                        </div>
                    </div>
                    <div class="der-field">
                        <span class="der-field-label">Début et fin (fin facultative)</span>
                        <div class="der-row2b">
                            <input type="time" class="der-input der-f-start" step="300">
                            <input type="time" class="der-input der-f-end" step="300">
                        </div>
                    </div>
                    <div class="der-field">
                        <span class="der-field-label">Couleur</span>
                        <div class="der-colors">${colors}</div>
                    </div>
                    <div class="der-form-err"></div>
                    <div class="der-modal-btns">
                        <button class="der-modal-btn der-modal-cancel der-f-cancel">Annuler</button>
                        <button class="der-modal-btn der-modal-danger der-f-delete">Supprimer</button>
                        <button class="der-modal-btn der-modal-confirm der-f-save">Enregistrer</button>
                    </div>
                </div>
            </div>

            <div class="der-modal-overlay der-copy-overlay">
                <div class="der-modal-box">
                    <div class="der-modal-title der-copy-title">Copier vers…</div>
                    <p class="der-modal-text">Les jours choisis seront remplacés par ce programme.</p>
                    <div class="der-copy-days">${copyDays}</div>
                    <div class="der-modal-btns">
                        <button class="der-modal-btn der-modal-cancel der-copy-cancel">Annuler</button>
                        <button class="der-modal-btn der-modal-confirm der-copy-ok">Copier</button>
                    </div>
                </div>
            </div>

            <div class="der-modal-overlay der-confirm-overlay">
                <div class="der-modal-box">
                    <div class="der-modal-title der-c-title">Confirmation</div>
                    <p class="der-modal-text der-c-text"></p>
                    <div class="der-modal-btns">
                        <button class="der-modal-btn der-modal-cancel der-c-cancel">Annuler</button>
                        <button class="der-modal-btn der-modal-confirm der-c-ok">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    function initDerouleWidget(widget, saved) {
        saved = saved || {};
        const outer = widget.querySelector('.der-outer');
        const inner = widget.querySelector('.der-inner');
        const q  = sel => widget.querySelector(sel);
        const qa = sel => Array.from(widget.querySelectorAll(sel));

        // Le tableau ne doit pas recevoir les appuis faits dans le widget
        outer.addEventListener('mousedown', e => e.stopPropagation());
        const stopIfNotHeader = (e) => {
            if (e.target.closest && e.target.closest('.der-header')) return;
            e.stopPropagation();
        };
        outer.addEventListener('touchstart',  stopIfNotHeader, { passive: true });
        outer.addEventListener('pointerdown', stopIfNotHeader);
        // Les raccourcis clavier du tableau ne doivent pas se déclencher pendant la saisie
        ['keydown', 'keyup', 'keypress', 'paste', 'copy', 'cut'].forEach(type =>
            outer.addEventListener(type, e => e.stopPropagation()));

        // ── Références DOM ────────────────────────────────────────────────
        const statusEl  = q('.der-status');
        const hintEl    = q('.der-hint');
        const listEl    = q('.der-list');
        const clockEl   = q('.der-clock');
        const formOv    = q('.der-form-overlay');
        const copyOv    = q('.der-copy-overlay');
        const confirmOv = q('.der-confirm-overlay');
        const fTitle    = q('.der-form-title');
        const fEmo      = q('.der-f-emo');
        const fLabel    = q('.der-f-label');
        const fStart    = q('.der-f-start');
        const fEnd      = q('.der-f-end');
        const fErr      = q('.der-form-err');
        const fDelete   = q('.der-f-delete');
        const fSave     = q('.der-f-save');
        const fileInput = q('.der-file-input');
        const optTimes  = q('.der-opt-times');
        const optLeft   = q('.der-opt-left');
        const optClock  = q('.der-opt-clock');

        // ── État ──────────────────────────────────────────────────────────
        let prog = null;
        if (saved.prog) {
            const p = cleanProgram(saved.prog);
            prog = stripCount(p);
        }
        if (!prog) prog = loadStoredProgram() || exampleProgram();

        let mode      = saved.mode === 'manual' ? 'manual' : 'auto';
        let layout    = saved.layout === 'band' ? 'band' : 'col';
        let showTimes = saved.showTimes !== false;
        let showLeft  = saved.showLeft  !== false;
        let showClock = saved.showClock !== false;
        let cursor    = (saved.cursorDate === todayStr() && saved.cursor >= 0) ? parseInt(saved.cursor, 10) : 0;
        let cursorDate = todayStr();
        let viewDay   = todayKey();   // jour affiché (revient à aujourd'hui à chaque ouverture)
        let editing   = false;
        let editId    = null;
        let selColor  = DER_COLORS[0];
        let _isMax    = false;
        let lastCurKey = null;        // pour ne faire défiler la liste que lorsque l'activité change

        // ── Taille ────────────────────────────────────────────────────────
        const w0 = parseFloat(saved.w), h0 = parseFloat(saved.h);
        outer.style.width  = (w0 > 0 ? w0 : DER_DEFAULT_W) + 'px';
        outer.style.height = (h0 > 0 ? h0 : DER_DEFAULT_H) + 'px';
        function rememberSize() {
            if (outer.offsetWidth  > 0) widget.dataset.derW = outer.offsetWidth;
            if (outer.offsetHeight > 0) widget.dataset.derH = outer.offsetHeight;
        }
        widget.dataset.derW = w0 > 0 ? w0 : DER_DEFAULT_W;
        widget.dataset.derH = h0 > 0 ? h0 : DER_DEFAULT_H;

        function persist() {
            storeProgram(prog);
            if (typeof saveBoard === 'function') saveBoard();
        }

        // ── Couleur du cadre ──────────────────────────────────────────────
        function applyTheme(id) {
            if (!DER_THEMES[id]) id = 'bleu';
            widget.dataset.derTheme = id;
            outer.style.setProperty('--der-bg', DER_THEMES[id].bg);
            outer.style.setProperty('--der-op', DER_THEMES[id].op);
            qa('.der-swatch').forEach(s => s.classList.toggle('is-on', s.dataset.theme === id));
        }
        qa('.der-swatch').forEach(s => {
            s.addEventListener('click', (e) => {
                e.stopPropagation();
                applyTheme(s.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });
        applyTheme(saved.theme || 'bleu');

        // ── Déplacement : clic-glisser n'importe où sur une zone libre ────
        const onDragDown = (e) => {
            if (_isMax || widget.classList.contains('phone-fs')) return;
            if (typeof isDrawMode !== 'undefined' && (isDrawMode || (typeof isEraserMode !== 'undefined' && isEraserMode))) return;
            if (!window.bdpCanDragFrom(e, inner, '.der-panel, .der-modal-overlay')) return;
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus();
            if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
        };
        inner.addEventListener('mousedown',  onDragDown);
        inner.addEventListener('touchstart', onDragDown, { passive: false });

        // ── Calcul de l'état de la journée ────────────────────────────────
        // Renvoie pour chaque activité : 'done' | 'cur' | 'next' | '' et des infos pour la carte d'état
        function computeState(list) {
            const n = list.length;
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
            const isToday = viewDay === todayKey();
            const ends = list.map((a, i) => {
                const e = toMin(a.end);
                if (!isNaN(e)) return e;
                if (i + 1 < n) return toMin(list[i + 1].start);
                return toMin(a.start) + 60;
            });
            const st = { states: new Array(n).fill(''), cur: -1, next: -1, nowMin, ends, isToday };
            if (!n || editing) return st;

            if (mode === 'manual') {
                if (cursorDate !== todayStr()) { cursor = 0; cursorDate = todayStr(); }
                if (cursor > n) cursor = n;
                for (let i = 0; i < n; i++) st.states[i] = i < cursor ? 'done' : (i === cursor ? 'cur' : '');
                st.cur = cursor < n ? cursor : -1;
                if (cursor + 1 < n) { st.next = cursor + 1; st.states[cursor + 1] = 'next'; }
                return st;
            }
            if (!isToday) return st;
            for (let i = 0; i < n; i++) {
                const s = toMin(list[i].start), e = ends[i];
                if (e <= nowMin) st.states[i] = 'done';
                else if (s <= nowMin && nowMin < e && st.cur < 0) st.cur = i;
            }
            if (st.cur >= 0) st.states[st.cur] = 'cur';
            for (let i = 0; i < n; i++) {
                if (toMin(list[i].start) > nowMin) { st.next = i; break; }
            }
            if (st.next >= 0 && st.cur >= 0 && st.next !== st.cur + 1) st.next = st.cur + 1 < n ? st.cur + 1 : -1;
            if (st.next >= 0 && st.states[st.next] === '') st.states[st.next] = 'next';
            return st;
        }

        function timeRange(a) {
            const s = fmtHM(a.start);
            const e = a.end ? fmtHM(a.end) : '';
            return e ? s + ' – ' + e : s;
        }

        // ── Rendu ─────────────────────────────────────────────────────────
        function renderClock() {
            const d = new Date();
            clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
            clockEl.style.display = showClock ? '' : 'none';
        }

        function render() {
            renderClock();
            const list = sortDay(prog[viewDay] || []);
            prog[viewDay] = list;
            const st = computeState(list);
            const info = dayInfo(viewDay);
            const tk = todayKey();

            // Pastilles des jours
            qa('.der-chip').forEach(c => {
                const k = c.dataset.day;
                c.classList.toggle('is-on', k === viewDay);
                c.classList.toggle('is-today', k === tk);
                c.classList.toggle('is-empty', !(prog[k] && prog[k].length));
            });

            // Classes de l'enveloppe
            outer.classList.toggle('is-band', layout === 'band');
            outer.classList.toggle('is-edit', editing);
            hintEl.hidden = !editing || !list.length;

            // Pied
            qa('.der-footer [data-group]').forEach(el => {
                const g = el.dataset.group;
                el.hidden = editing ? g !== 'edit' : (g === 'edit' || (g === 'manual' && mode !== 'manual'));
            });
            qa('.der-mode button').forEach(b => b.classList.toggle('is-on', b.dataset.mode === mode));
            q('.der-prev-btn').disabled = cursor <= 0;
            q('.der-next-btn').disabled = cursor >= list.length;
            q('.der-edit-btn').classList.toggle('is-on', editing);

            // Carte d'état
            statusEl.style.removeProperty('--der-c');
            let sEmo = '📅', sKick = '', sLab = '', sSub = '';
            const d = new Date();
            const dateTxt = info.long.charAt(0).toUpperCase() + info.long.slice(1) +
                (viewDay === tk ? ' ' + d.getDate() + ' ' + DER_MONTHS[d.getMonth()] : '');
            if (editing) {
                sEmo = '✏️'; sKick = 'Modification du programme'; sLab = dateTxt;
                sSub = list.length + ' activité' + (list.length > 1 ? 's' : '');
            } else if (!list.length) {
                sEmo = '🌤️'; sKick = dateTxt; sLab = 'Pas d\'activité prévue';
                sSub = 'Utilisez le crayon pour préparer ce jour.';
            } else if (mode === 'auto' && !st.isToday) {
                sKick = 'Programme du ' + info.long; sLab = list.length + ' activité' + (list.length > 1 ? 's' : '');
                sSub = showTimes ? 'De ' + fmtHM(list[0].start) + ' à ' + fmtHM(minToT(st.ends[list.length - 1])) : '';
            } else if (st.cur >= 0) {
                const a = list[st.cur];
                sEmo = a.emo || '▶'; sKick = 'Maintenant'; sLab = a.label;
                statusEl.style.setProperty('--der-c', a.color);
                if (mode === 'auto' && showLeft) sSub = 'Encore ' + fmtLeft(st.ends[st.cur] - st.nowMin);
                if (st.next >= 0) sSub += (sSub ? ' · ' : '') + 'Ensuite : ' + (list[st.next].emo ? list[st.next].emo + ' ' : '') + list[st.next].label;
            } else if (mode === 'manual') {
                sEmo = '🎉'; sKick = dateTxt; sLab = 'La journée est terminée !';
                sSub = 'Bravo à toute la classe.';
            } else if (st.next >= 0) {
                const a = list[st.next];
                const first = st.next === 0;
                sEmo = first ? '☀️' : '⏳';
                sKick = first ? dateTxt : 'Pause';
                sLab = first ? 'La journée commence bientôt' : 'Prochaine activité : ' + a.label;
                sSub = (first ? (a.emo ? a.emo + ' ' : '') + a.label + ' à ' + fmtHM(a.start) : 'À ' + fmtHM(a.start)) +
                       (showLeft ? ' (dans ' + fmtLeft(toMin(a.start) - st.nowMin) + ')' : '');
            } else {
                sEmo = '🎉'; sKick = dateTxt; sLab = 'La journée est terminée !';
                sSub = 'Bravo à toute la classe.';
            }
            statusEl.innerHTML =
                '<span class="der-status-emo">' + esc(sEmo) + '</span>' +
                '<span class="der-status-txt">' +
                    '<span class="der-status-kicker">' + esc(sKick) + '</span>' +
                    '<span class="der-status-lab">' + esc(sLab) + '</span>' +
                    (sSub ? '<span class="der-status-sub">' + esc(sSub) + '</span>' : '') +
                '</span>';

            // Vignettes
            if (!list.length) {
                listEl.innerHTML = '<div class="der-empty"><b>🗓️</b>' +
                    (editing ? 'Cliquez sur « Ajouter » pour créer la première activité,<br>ou copiez un autre jour.'
                             : 'Aucune activité ce ' + info.long + '.') + '</div>';
            } else {
                const clickable = editing || mode === 'manual';
                listEl.innerHTML = list.map((a, i) => {
                    const s = st.states[i];
                    let mark = '';
                    if (editing) mark = '✏️';
                    else if (s === 'done') mark = '✓';
                    else if (s === 'cur') mark = layout === 'band' ? '▶ Ici' : '▶ On en est là';
                    else if (s === 'next') mark = 'Ensuite';
                    let progHTML = '';
                    if (s === 'cur' && mode === 'auto') {
                        const sMin = toMin(a.start), eMin = st.ends[i];
                        const pct = eMin > sMin ? Math.min(100, Math.max(0, (st.nowMin - sMin) / (eMin - sMin) * 100)) : 0;
                        progHTML = '<span class="der-prog"><i style="width:' + pct.toFixed(1) + '%"></i></span>';
                    }
                    return '<button type="button" class="der-item' + (s ? ' is-' + s : '') + (clickable ? ' is-click' : '') +
                        '" data-idx="' + i + '" style="--der-c:' + a.color + '"' +
                        (editing ? ' title="Modifier cette activité"' : (mode === 'manual' ? ' title="Placer le curseur ici"' : '')) + '>' +
                        '<span class="der-emo">' + esc(a.emo || '•') + '</span>' +
                        '<span class="der-txt"><span class="der-lab">' + esc(a.label) + '</span>' +
                        (showTimes ? '<span class="der-time">' + timeRange(a) + '</span>' : '') + '</span>' +
                        '<span class="der-mark">' + mark + '</span>' + progHTML +
                        '</button>';
                }).join('');
            }

            // Mini-barre (widget réduit)
            const mini = widget.querySelector(':scope > .der-mini-bar span');
            if (mini) mini.textContent = miniLabel(list, st);

            // Faire défiler jusqu'à l'activité en cours quand elle change
            const curKey = viewDay + ':' + st.cur + ':' + mode + ':' + layout + ':' + editing;
            if (curKey !== lastCurKey) {
                lastCurKey = curKey;
                const target = listEl.querySelector('.der-item.is-cur') || listEl.querySelector('.der-item.is-next');
                if (target && !editing) {
                    requestAnimationFrame(() => {
                        if (layout === 'band') {
                            listEl.scrollLeft = Math.max(0, target.offsetLeft - listEl.offsetLeft - listEl.clientWidth / 2 + target.offsetWidth / 2);
                        } else {
                            listEl.scrollTop = Math.max(0, target.offsetTop - listEl.offsetTop - listEl.clientHeight / 3);
                        }
                    });
                }
            }
        }
        function minToT(m) { return pad(Math.floor(m / 60) % 24) + ':' + pad(Math.round(m % 60)); }
        function miniLabel(list, st) {
            if (!st) st = computeState(list);
            if (st.cur >= 0) return '🗓️ Maintenant : ' + list[st.cur].label;
            if (st.next >= 0) return '🗓️ Ensuite : ' + list[st.next].label;
            return '🗓️ Déroulé de la journée';
        }

        // ── Horloge : mise à jour régulière ───────────────────────────────
        const tick = setInterval(() => {
            if (!document.contains(widget)) { clearInterval(tick); return; }
            if (widget.dataset.collapsed === '1') {
                const list = sortDay(prog[viewDay] || []);
                const mini = widget.querySelector(':scope > .der-mini-bar span');
                if (mini) mini.textContent = miniLabel(list);
                return;
            }
            render();
        }, 15000);

        // ── Jours / mode ──────────────────────────────────────────────────
        qa('.der-chip').forEach(c => c.addEventListener('click', (e) => {
            e.stopPropagation();
            viewDay = c.dataset.day;
            lastCurKey = null;
            render();
        }));
        qa('.der-mode button').forEach(b => b.addEventListener('click', () => {
            mode = b.dataset.mode;
            if (mode === 'manual') {
                // On démarre le curseur manuel là où en est l'heure (si c'est aujourd'hui)
                const list = sortDay(prog[viewDay] || []);
                const saveMode = mode; mode = 'auto';
                const st = computeState(list);
                mode = saveMode;
                if (st.isToday && list.length) {
                    cursor = st.cur >= 0 ? st.cur : (st.next >= 0 ? st.next : list.length);
                } else cursor = 0;
                cursorDate = todayStr();
            }
            render();
            if (typeof saveBoard === 'function') saveBoard();
        }));
        function moveCursor(delta) {
            const n = (prog[viewDay] || []).length;
            cursor = Math.max(0, Math.min(n, cursor + delta));
            cursorDate = todayStr();
            render();
            if (typeof saveBoard === 'function') saveBoard();
        }
        q('.der-prev-btn').addEventListener('click', () => moveCursor(-1));
        q('.der-next-btn').addEventListener('click', () => moveCursor(1));

        listEl.addEventListener('click', (e) => {
            const it = e.target.closest('.der-item');
            if (!it) return;
            const i = parseInt(it.dataset.idx, 10);
            const list = prog[viewDay] || [];
            if (editing) { if (list[i]) openForm(list[i]); return; }
            if (mode === 'manual') {
                cursor = (cursor === i) ? i + 1 : i;   // un 2e clic sur l'activité en cours la termine
                cursorDate = todayStr();
                render();
                if (typeof saveBoard === 'function') saveBoard();
            }
        });

        // ── Mode édition ──────────────────────────────────────────────────
        function setEditing(on) {
            editing = !!on;
            closePanels();
            lastCurKey = null;
            render();
        }
        q('.der-edit-btn').addEventListener('click', (e) => { e.stopPropagation(); setEditing(!editing); });
        q('.der-done-btn').addEventListener('click', () => setEditing(false));

        // ── Fenêtre de confirmation ───────────────────────────────────────
        function showConfirm(title, text, onOk, okLabel) {
            q('.der-c-title').textContent = title;
            q('.der-c-text').textContent  = text || '';
            const cancel = q('.der-c-cancel');
            const ok     = q('.der-c-ok');
            ok.textContent = onOk ? (okLabel || 'Confirmer') : 'OK';
            cancel.style.display = onOk ? '' : 'none';
            ok.onclick = () => { closeConfirm(); if (onOk) onOk(); };
            confirmOv.classList.add('open');
        }
        function closeConfirm() { confirmOv.classList.remove('open'); }
        q('.der-c-cancel').addEventListener('click', closeConfirm);
        confirmOv.addEventListener('click', e => { if (e.target === confirmOv) closeConfirm(); });

        // ── Formulaire d'activité ─────────────────────────────────────────
        function setColor(c) {
            selColor = DER_COLORS.includes(c) ? c : (c || DER_COLORS[0]);
            qa('.der-color').forEach(b => b.classList.toggle('is-on', b.dataset.color === selColor));
        }
        qa('.der-color').forEach(b => b.addEventListener('click', () => setColor(b.dataset.color)));
        function markPreset() {
            qa('.der-presets button').forEach(b => {
                const p = DER_PRESETS[parseInt(b.dataset.preset, 10)];
                b.classList.toggle('is-on', p[0] === fEmo.value && p[1] === fLabel.value.trim());
            });
        }
        qa('.der-presets button').forEach(b => b.addEventListener('click', () => {
            const p = DER_PRESETS[parseInt(b.dataset.preset, 10)];
            fEmo.value = p[0];
            fLabel.value = p[1];
            setColor(p[2]);
            markPreset();
            fErr.textContent = '';
        }));
        fEmo.addEventListener('input', markPreset);
        fLabel.addEventListener('input', markPreset);

        function openForm(entry) {
            closePanels();
            editId = entry ? entry.id : null;
            const list = sortDay(prog[viewDay] || []);
            fEmo.value   = entry ? (entry.emo || '') : '';
            fLabel.value = entry ? entry.label : '';
            if (entry) {
                fStart.value = entry.start;
                fEnd.value   = entry.end || '';
            } else {
                // Nouvelle activité : elle commence à la fin de la dernière
                const last = list[list.length - 1];
                let s = '08:30';
                if (last) {
                    const e = toMin(last.end);
                    s = !isNaN(e) ? last.end : minToT(toMin(last.start) + 30);
                }
                fStart.value = s;
                fEnd.value = minToT(Math.min(23 * 60 + 55, toMin(s) + 45));
            }
            setColor(entry ? entry.color : DER_COLORS[0]);
            markPreset();
            fErr.textContent = '';
            fTitle.textContent = entry ? 'Modifier l\'activité' : 'Nouvelle activité — ' + dayInfo(viewDay).long;
            fSave.textContent  = entry ? 'Mettre à jour' : 'Ajouter';
            fDelete.style.display = entry ? '' : 'none';
            formOv.classList.add('open');
            setTimeout(() => { try { (entry ? fLabel : fLabel).focus(); } catch (e) {} }, 30);
        }
        function closeForm() { formOv.classList.remove('open'); editId = null; }
        function submitForm() {
            const label = fLabel.value.trim();
            const start = fStart.value;
            const end   = fEnd.value;
            if (!label) { fErr.textContent = 'Donnez un nom à l\'activité.'; return; }
            if (isNaN(toMin(start))) { fErr.textContent = 'Indiquez l\'heure de début.'; return; }
            if (end && !(toMin(end) > toMin(start))) { fErr.textContent = 'La fin doit être après le début.'; return; }
            const item = { emo: fEmo.value.trim(), label, start, end: end || '', color: selColor };
            const list = prog[viewDay] || [];
            if (editId !== null) {
                const i = list.findIndex(a => a.id === editId);
                if (i >= 0) list[i] = Object.assign({}, list[i], item);
            } else {
                list.push(Object.assign({ id: newId() }, item));
            }
            prog[viewDay] = sortDay(list);
            closeForm();
            render();
            persist();
        }
        q('.der-add-btn').addEventListener('click', () => openForm(null));
        q('.der-f-cancel').addEventListener('click', closeForm);
        fSave.addEventListener('click', submitForm);
        [fLabel, fEmo, fStart, fEnd].forEach(inp =>
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitForm(); } }));
        formOv.addEventListener('click', e => { if (e.target === formOv) closeForm(); });
        fDelete.addEventListener('click', () => {
            const id = editId;
            const a = (prog[viewDay] || []).find(x => x.id === id);
            if (!a) { closeForm(); return; }
            showConfirm('Supprimer cette activité ?',
                (a.emo ? a.emo + ' ' : '') + a.label + ' — ' + timeRange(a),
                () => {
                    prog[viewDay] = (prog[viewDay] || []).filter(x => x.id !== id);
                    closeForm();
                    render();
                    persist();
                }, 'Supprimer');
        });

        // ── Copier vers d'autres jours ────────────────────────────────────
        const copySel = new Set();
        q('.der-copy-btn').addEventListener('click', () => {
            if (!(prog[viewDay] || []).length) {
                showConfirm('Rien à copier', 'Ce jour ne contient encore aucune activité.');
                return;
            }
            copySel.clear();
            q('.der-copy-title').textContent = 'Copier le ' + dayInfo(viewDay).long + ' vers…';
            qa('.der-copy-days button').forEach(b => {
                b.disabled = b.dataset.copy === viewDay;
                b.classList.remove('is-on');
            });
            copyOv.classList.add('open');
        });
        qa('.der-copy-days button').forEach(b => b.addEventListener('click', () => {
            const k = b.dataset.copy;
            if (copySel.has(k)) copySel.delete(k); else copySel.add(k);
            b.classList.toggle('is-on', copySel.has(k));
        }));
        function closeCopy() { copyOv.classList.remove('open'); }
        q('.der-copy-cancel').addEventListener('click', closeCopy);
        copyOv.addEventListener('click', e => { if (e.target === copyOv) closeCopy(); });
        q('.der-copy-ok').addEventListener('click', () => {
            if (!copySel.size) { closeCopy(); return; }
            const src = prog[viewDay] || [];
            copySel.forEach(k => { prog[k] = src.map(a => Object.assign({}, a, { id: newId() })); });
            closeCopy();
            render();
            persist();
        });

        // ── Vider le jour ─────────────────────────────────────────────────
        q('.der-clear-btn').addEventListener('click', () => {
            if (!(prog[viewDay] || []).length) return;
            showConfirm('Vider le ' + dayInfo(viewDay).long + ' ?', 'Toutes les activités de ce jour seront supprimées.', () => {
                prog[viewDay] = [];
                render();
                persist();
            }, 'Vider');
        });

        // ── Réglages d'affichage ──────────────────────────────────────────
        function syncSettings() {
            qa('.der-layout-seg button').forEach(b => b.classList.toggle('is-on', b.dataset.layout === layout));
            optTimes.checked = showTimes;
            optLeft.checked  = showLeft;
            optClock.checked = showClock;
        }
        qa('.der-layout-seg button').forEach(b => b.addEventListener('click', () => {
            layout = b.dataset.layout;
            lastCurKey = null;
            syncSettings(); render();
            if (typeof saveBoard === 'function') saveBoard();
        }));
        optTimes.addEventListener('change', () => { showTimes = optTimes.checked; render(); if (typeof saveBoard === 'function') saveBoard(); });
        optLeft.addEventListener('change',  () => { showLeft  = optLeft.checked;  render(); if (typeof saveBoard === 'function') saveBoard(); });
        optClock.addEventListener('change', () => { showClock = optClock.checked; render(); if (typeof saveBoard === 'function') saveBoard(); });
        syncSettings();

        // ── Export / import du programme ──────────────────────────────────
        q('.der-export-btn').addEventListener('click', () => {
            const data = { format: 'bdp-deroule', version: 1, programme: prog };
            const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'text/plain;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = 'lebureauduprof_deroule_' + todayStr() + '.txt';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 200);
        });
        q('.der-import-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                let p = null;
                try {
                    const raw = JSON.parse(ev.target.result);
                    p = cleanProgram(raw && raw.programme ? raw.programme : raw);
                } catch (err) { p = null; }
                closePanels();
                if (!p || !p._count) {
                    showConfirm('Import impossible', 'Ce fichier ne contient aucun programme reconnu.');
                    return;
                }
                showConfirm('Remplacer le programme ?',
                    'Le programme actuel sera remplacé par celui du fichier (' + p._count + ' activité' + (p._count > 1 ? 's' : '') + ').',
                    () => { prog = stripCount(p); lastCurKey = null; render(); persist(); },
                    'Importer');
            };
            reader.readAsText(file, 'UTF-8');
        });

        // ── Panneaux aide / réglages ──────────────────────────────────────
        const panels = [
            [q('.der-help-btn'),     q('.der-help-popup')],
            [q('.der-settings-btn'), q('.der-settings-popup')]
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
            if (e.key === 'Escape') {
                if (confirmOv.classList.contains('open')) closeConfirm();
                else if (formOv.classList.contains('open')) closeForm();
                else if (copyOv.classList.contains('open')) closeCopy();
                else if (q('.der-panel.show')) closePanels();
                else if (editing) setEditing(false);
                return;
            }
            // Flèches : avancer / reculer le curseur en mode manuel
            const t = e.target;
            if (mode === 'manual' && !editing && !(t && t.matches && t.matches('input, textarea, select'))) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveCursor(1); }
                if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); moveCursor(-1); }
            }
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
            lastCurKey = null;
            render();
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
            clearInterval(tick);
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Réduire en mini-barre ─────────────────────────────────────────
        const MINI_W = 300, MINI_H = 50, GAP = 10, MARGIN_TOP = 8;
        const HANDLES = ':scope > .drag-handle, :scope > .widget-action-bar, :scope > .widget-rotate-handle, :scope > .custom-resize-handle';

        function buildMiniBar() {
            if (widget.querySelector(':scope > .der-mini-bar')) return;
            const miniBar = document.createElement('div');
            miniBar.className = 'der-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + MINI_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = miniLabel(sortDay(prog[viewDay] || []));
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
            closeForm(); closeConfirm(); closeCopy(); closePanels();
            if (editing) { editing = false; }
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
            widget.querySelectorAll(':scope > .der-mini-bar').forEach(el => el.remove());
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
            lastCurKey = null;
            render();
            if (typeof bringToFront === 'function') bringToFront(widget);
            if (typeof saveBoard === 'function') saveBoard();
        }
        widget._derExpand = expand;

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
                    outer.style.width  = Math.max(280, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(300, startH + ev.clientY - startY) + 'px';
                };
                const onUp = () => {
                    handle.removeEventListener('pointermove',   onMove);
                    handle.removeEventListener('pointerup',     onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    rememberSize();
                    lastCurKey = null;
                    render();
                    if (typeof saveBoard === 'function') saveBoard();
                };
                handle.addEventListener('pointermove',   onMove);
                handle.addEventListener('pointerup',     onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        }

        // ── Sauvegarde dans le tableau (lue par save-load.js) ─────────────
        widget._derGetData = function () {
            if (widget.dataset.collapsed !== '1' && !widget.classList.contains('phone-fs')) rememberSize();
            return {
                w: parseFloat(widget.dataset.derW) || DER_DEFAULT_W,
                h: parseFloat(widget.dataset.derH) || DER_DEFAULT_H,
                theme: widget.dataset.derTheme || 'bleu',
                collapsed: widget.dataset.collapsed === '1',
                max: _isMax,
                mode, layout, showTimes, showLeft, showClock,
                cursor, cursorDate,
                prog
            };
        };

        // ── Premier affichage + état restauré ─────────────────────────────
        if (!saved.prog) storeProgram(prog);
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
    //   savedData : null pour un nouveau widget, objet derData (ou
    //   { _restored: true }) quand save-load.js reconstruit le tableau.
    // =========================================================================
    window.createDerouleWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (!restoring && typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'deroule';
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
            <div class="der-outer">${derInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (!restoring && typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (!restoring) widget.focus();
        // Une erreur à l'initialisation ne doit jamais bloquer la suite
        try { initDerouleWidget(widget, restoring ? savedData : null); }
        catch (e) { console.error('Déroulé de la journée : erreur à l\'ouverture', e); }
        // Sur téléphone : ouverture directe en plein écran (bouton vert)
        if (!restoring && isPhoneNow() && widget._wfSetMax) widget._wfSetMax(true);
        if (!restoring && typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK createWidget — intercepter le type 'deroule'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function' || _orig._derPatched) return;
            window.createWidget = function (type) {
                if (type === 'deroule') return window.createDerouleWidget();
                return _orig.apply(this, arguments);
            };
            window.createWidget._derPatched = true;
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
