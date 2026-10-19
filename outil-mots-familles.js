// =========================================================================
// WIDGET BILLETS AUX FAMILLES — Le Bureau du Prof
// Inspiré de outils_mots_familles.html (OutilsProfs)
// Graphisme et fonctionnement alignés sur le widget Tirage au sort :
// cadre coloré arrondi, pastilles « verre », police Quicksand, icônes SVG,
// redimensionnement libre, aide, couleur du cadre, réduire / plein écran /
// fermer, et restauration après actualisation du tableau (via save-load.js,
// champ mfData).
//
// Principe : on choisit un motif (matériel manquant, absence, rendez-vous…),
// on adapte le titre et le message si besoin, on voit l'aperçu du billet,
// puis on édite un PDF A4 de 10 billets (2 × 5) à découper.
//
// 📌 Intégration dans index.html :
//   <script src="outil-mots-familles.js"></script>   (après outil-tirage.js)
//   Carte du panneau Outils → « Gestion de la classe » :
//   onclick="createMotsFamillesWidget();toggleToolsPanel()"
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

    // ── Réglages ──────────────────────────────────────────────────────────
    const DEFAULT_W = 860;
    const DEFAULT_H = 620;
    const MIN_W     = 360;
    const MIN_H     = 300;
    const NOM_KEY   = 'bdp_mf_nom';          // nom de l'enseignant (mémorisé pour les prochains billets)

    // Modèles de billets (repris de outils_mots_familles.html)
    const MF_MESSAGES = {
        materiel: {
            label: 'Matériel manquant',
            title: '🎒 Matériel manquant',
            body:  "Bonjour, il manque actuellement à votre enfant le matériel suivant :\n\n....................................................................\n\nMerci de compléter ses affaires pour permettre un travail efficace en classe."
        },
        absence: {
            label: "Justification d'absence",
            title: "⚠️ Justification d'absence",
            body:  "Madame, Monsieur, nous n'avons pas reçu de justificatif pour l'absence de votre enfant en date du ........................ .\nMerci de bien vouloir nous le transmettre au plus vite."
        },
        rdv: {
            label: 'Demande de rendez-vous',
            title: '🗓️ Demande de rendez-vous',
            body:  "Madame, Monsieur, je souhaiterais vous rencontrer afin de faire un point sur la scolarité de votre enfant."
        },
        comportement: {
            label: 'Point comportement',
            title: '🤝 Point comportement',
            body:  "Bonjour, je vous informe que le comportement de votre enfant aujourd'hui a été difficile :\n\n.................................................\n\nUn échange à la maison serait bénéfique."
        },
        autre: {
            label: 'Message personnalisé',
            title: '✉️ Information',
            body:  ''
        }
    };

    // Billets du PDF (en mm) : 2 colonnes × 5 lignes = 10 billets par page A4
    const MF_PDF = { cols: 2, rows: 5, marginX: 10, marginY: 10, billetW: 95, billetH: 55 };

    // Couleurs du cadre (mêmes que le Tirage au sort / Visualiseur)
    const MF_THEMES = {
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent : mf-outer porte tout le visuel ── */
    .widget[data-type="mots-familles"],
    .widget[data-type="mots-familles"]:focus-within {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    .widget[data-type="mots-familles"] .mf-outer {
        --mf-ink:   #14202E;
        --mf-glass: rgba(255,255,255,0.62);
        --mf-bg:    #8EC5F2;
        --mf-op:    #2F6FB3;

        position: relative;
        width: ${DEFAULT_W}px;
        height: ${DEFAULT_H}px;
        min-width: ${MIN_W}px;
        min-height: ${MIN_H}px;
        overflow: hidden;
        box-sizing: border-box;
        border-radius: 24px;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
    }
    .widget[data-type="mots-familles"]:hover .mf-outer,
    .widget[data-type="mots-familles"]:focus-within .mf-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Cadre coloré ── */
    .mf-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px 16px;
        box-sizing: border-box;
        background-color: var(--mf-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        border-radius: 24px;
        overflow: hidden;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--mf-ink);
        user-select: none;
        position: relative;
        container-type: size;
        transition: background-color .3s;
        cursor: move;
    }

    /* ── En-tête : deux pastilles « verre » ── */
    .mf-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 0 0;
        flex-shrink: 0;
        cursor: move;
    }
    .mf-title,
    .mf-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--mf-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .mf-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        pointer-events: none;
    }
    .mf-title span { overflow: hidden; text-overflow: ellipsis; }
    .mf-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--mf-op); }
    .mf-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
    @container (max-width: 460px) { .mf-title span { display: none; } .mf-title { padding: 7px 10px; } }

    .mf-icon-btn {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--mf-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .mf-icon-btn svg { width: 18px; height: 18px; }
    .mf-icon-btn:hover,
    .mf-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .mf-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Corps : formulaire + aperçu ── */
    .mf-main {
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
        gap: 10px;
    }
    .mf-zone {
        min-height: 0;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        box-sizing: border-box;
    }
    .mf-form {
        display: flex;
        flex-direction: column;
        gap: 9px;
        padding: 12px 14px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(20,32,46,0.25) transparent;
        cursor: default;
    }
    .mf-field { display: flex; flex-direction: column; gap: 4px; }
    .mf-field.grow { flex: 1 1 auto; min-height: 150px; }
    .mf-pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
    .mf-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .6px;
        color: rgba(20,32,46,0.55);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
    }
    .mf-input, .mf-select, .mf-textarea {
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        color: var(--mf-ink);
        background: #F4F6F9;
        border: 1.5px solid rgba(20,32,46,0.1);
        border-radius: 12px;
        padding: 8px 10px;
        outline: none;
        width: 100%;
        box-sizing: border-box;
        user-select: text;
        transition: border-color .15s, background .15s;
    }
    .mf-select { cursor: pointer; font-weight: 700; }
    .mf-textarea { flex: 1 1 auto; min-height: 120px; resize: none; line-height: 1.45; }
    .mf-input:disabled { opacity: .45; cursor: not-allowed; }
    .mf-input:focus, .mf-select:focus, .mf-textarea:focus { border-color: var(--mf-op); background: #fff; }
    .mf-mini-link {
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        color: var(--mf-op);
        cursor: pointer;
        padding: 0;
        text-transform: none;
        letter-spacing: 0;
    }
    .mf-mini-link:hover { text-decoration: underline; }
    .mf-check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
    }
    .mf-check input { accent-color: var(--mf-op); width: 16px; height: 16px; cursor: pointer; margin: 0; }
    .mf-row { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
    .mf-row .mf-check { flex-shrink: 0; white-space: nowrap; }
    .mf-row .mf-input { flex: 1; }

    /* ── Aperçu : billet aux proportions exactes du PDF (95 × 55 mm) ──
       Les tailles sont en cqw : 100cqw = 95 mm, donc l'aperçu est fidèle. */
    .mf-preview-zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        overflow: hidden;
    }
    .mf-preview-lbl {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .6px;
        color: rgba(20,32,46,0.55);
    }
    .mf-preview-wrap {
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        container-type: size;
    }
    .mf-billet {
        width: min(100cqw, calc(100cqh * 95 / 55));
        aspect-ratio: 95 / 55;
        background: #fff;
        border: 1.5px dashed #b8b8b8;
        box-shadow: 0 6px 18px -10px rgba(10,20,35,0.45);
        container-type: inline-size;
        position: relative;
        box-sizing: border-box;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        font-weight: 500;
        color: #000;
        overflow: hidden;
    }
    .mf-b-head {
        position: absolute;
        left: 5.26cqw; right: 5.26cqw; top: 3.4cqw;
        display: flex;
        justify-content: space-between;
        gap: 2cqw;
        font-size: 2.6cqw;
        font-weight: 700;
        text-transform: uppercase;
        padding-bottom: 1.2cqw;
        border-bottom: 0.25cqw solid #000;
        white-space: nowrap;
    }
    .mf-b-head span:first-child { overflow: hidden; text-overflow: ellipsis; }
    .mf-b-title {
        position: absolute;
        left: 5.26cqw; right: 5.26cqw; top: 12.5cqw;
        text-align: center;
        font-size: 3.71cqw;
        font-weight: 700;
        line-height: 1.15;
    }
    .mf-b-body {
        position: absolute;
        left: 6.3cqw; right: 6.3cqw;
        top: var(--mf-body-top, 21cqw);
        bottom: var(--mf-body-bottom, 9cqw);
        font-size: calc(3.34cqw * var(--mf-fit, 1));
        line-height: 1.15;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        overflow: hidden;
    }
    .mf-b-sign {
        position: absolute;
        right: 6.3cqw; bottom: 4.2cqw;
        font-size: 2.97cqw;
        font-weight: 700;
        max-width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .mf-fit-note {
        font-size: 11px;
        font-weight: 600;
        color: #B9770E;
        min-height: 14px;
        text-align: center;
    }

    /* ── Barre du bas : bouton PDF (pastille « verre ») ── */
    .mf-footer {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 0 auto;
        padding: 8px 10px;
        background: var(--mf-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        max-width: 100%;
        box-sizing: border-box;
    }
    .mf-pdf-btn {
        font-family: inherit;
        font-size: clamp(12px, 2.4cqmin, 16px);
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 9px 22px;
        cursor: pointer;
        background: var(--mf-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.25);
        transition: filter .15s, transform .1s, opacity .15s;
        white-space: nowrap;
    }
    .mf-pdf-btn:hover { filter: brightness(1.1); }
    .mf-pdf-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.25); }
    .mf-pdf-btn:disabled { opacity: .5; cursor: wait; }
    .mf-status { font-size: 12px; font-weight: 700; color: rgba(20,32,46,0.65); white-space: nowrap; }
    .mf-status.err { color: #C0392B; }
    .mf-status:empty { display: none; }

    /* ── Cadre étroit : formulaire au-dessus, aperçu en dessous ── */
    @container (max-width: 620px) {
        .mf-main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1.4fr) minmax(0, 1fr); }
        .mf-field.grow { min-height: 130px; }
        .mf-pdf-btn { padding: 8px 16px; }
    }
    @container (max-height: 420px) {
        .mf-inner { gap: 7px; }
        .mf-header { padding-top: 10px; }
        .mf-title { padding: 5px 12px 5px 10px; font-size: 13px; }
        .mf-tools { padding: 3px 10px 3px 4px; }
        .mf-icon-btn { width: 28px; height: 28px; }
        .mf-footer { padding: 5px 8px; }
        .mf-pdf-btn { padding: 6px 14px; }
        .mf-preview-lbl, .mf-fit-note { display: none; }
    }

    /* ── Panneaux (aide, couleur) ── */
    .mf-panel {
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
        color: var(--mf-ink);
        cursor: default;
    }
    .mf-panel.show { display: flex; }
    .mf-panel-title { font-size: 13px; font-weight: 700; }
    .mf-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .mf-help-list li { margin-bottom: 4px; }
    .mf-help-list em { font-style: normal; font-weight: 700; color: var(--mf-op); }
    .mf-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .mf-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .mf-swatch.is-on { border-color: var(--mf-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Curseurs ── */
    .mf-inner input, .mf-inner textarea { cursor: text; }
    .mf-inner input[type="checkbox"], .mf-inner select, .mf-inner button:not(:disabled) { cursor: pointer; }

    /* ── Plein écran du bouton vert (.wf-max) ── */
    .widget.wf-max[data-type="mots-familles"] .mf-outer { outline: none !important; }
    .widget.wf-max[data-type="mots-familles"] .mf-header,
    .widget.wf-max[data-type="mots-familles"] .mf-inner { cursor: default; }
    .widget.wf-max[data-type="mots-familles"] .mf-inner {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
    }

    /* ── Téléphone : plein écran générique (.phone-fs, posé par index.html) ── */
    .widget.phone-fs[data-type="mots-familles"] {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
        max-width: calc(100vw - 40px) !important;
        z-index: 49990 !important;
    }
    .widget.phone-fs[data-type="mots-familles"] .mf-outer {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        border-radius: 0 !important;
        outline: none !important;
    }
    .widget.phone-fs[data-type="mots-familles"] .mf-inner { border-radius: 0 !important; padding: 0 10px 10px; cursor: default; }
    .widget.phone-fs[data-type="mots-familles"] .mf-header { cursor: default; padding-right: 56px; }

    /* ── Téléphone : plein écran du bouton vert ── */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget.wf-max[data-type="mots-familles"] .mf-inner {
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            padding: 0 10px 10px;
        }
    }

    /* Défilement au doigt dans le formulaire, pas de délai sur les boutons */
    .widget[data-type="mots-familles"] .mf-form { touch-action: pan-y; }
    .widget[data-type="mots-familles"] .mf-inner button { touch-action: manipulation; }
    `;

    if (!document.getElementById('mf-widget-style')) {
        const s = document.createElement('style');
        s.id = 'mf-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── Pastilles fenêtre (si aucun autre widget ne les a déjà injectées) ──
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

    // ── Icônes ────────────────────────────────────────────────────────────
    const ICON_MAIL    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.8 7l8.2 6 8.2-6"/></svg>';
    const ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';

    // ── Utilitaires ───────────────────────────────────────────────────────
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }
    function dateDuJour() { return new Date().toLocaleDateString('fr-FR'); }
    function nomFichier() {
        const d = new Date();
        return 'lebureauduprof_billets_familles_' + d.getFullYear() +
            String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.pdf';
    }
    // Les polices standard du PDF ne savent pas afficher les émojis
    function sansEmojis(t) {
        return String(t || '')
            .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
            .replace(/[ \t]{2,}/g, ' ')
            .trim();
    }
    // Caractères typographiques que la police Helvetica du PDF n'a pas toujours
    function pourPdf(t) {
        return sansEmojis(t)
            .replace(/[‘’ʼ]/g, "'")
            .replace(/[“”]/g, '"')
            .replace(/…/g, '...')
            .replace(/[–—]/g, '-')
            .replace(/ | /g, ' ');
    }
    function nomMemorise() {
        try { return localStorage.getItem(NOM_KEY) || localStorage.getItem('nom_enseignant') || ''; }
        catch (e) { return ''; }
    }

    // Police Quicksand pour le PDF (fichiers TTF statiques, chargés une seule fois).
    // On essaie d'abord le dossier polices/ du site, puis le CDN Fontsource.
    const MF_PDF_FONTS = {
        normal: ['polices/Quicksand-Medium.ttf',
                 'https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-500-normal.ttf'],
        bold:   ['polices/Quicksand-Bold.ttf',
                 'https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-700-normal.ttf']
    };
    let _fontPromise = null;
    function bufToBase64(buf) {
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin);
    }
    async function fetchFirst(urls) {
        for (const u of urls) {
            try {
                const r = await fetch(u);
                if (!r.ok) continue;
                const buf = await r.arrayBuffer();
                // Un vrai fichier TTF commence par 00 01 00 00 ou « true »
                const h = new Uint8Array(buf, 0, 4);
                if ((h[0] === 0 && h[1] === 1) || String.fromCharCode(h[0], h[1], h[2], h[3]) === 'true') {
                    return bufToBase64(buf);
                }
            } catch (e) { /* essai suivant */ }
        }
        throw new Error('Police Quicksand introuvable');
    }
    function loadQuicksandPdf() {
        if (!_fontPromise) {
            _fontPromise = Promise.all([fetchFirst(MF_PDF_FONTS.normal), fetchFirst(MF_PDF_FONTS.bold)])
                .then(([normal, bold]) => ({ normal, bold }))
                .catch(err => { _fontPromise = null; throw err; });
        }
        return _fontPromise;
    }
    // Ajoute Quicksand au document ; renvoie le nom de police à utiliser
    async function prepareFont(doc) {
        try {
            const f = await loadQuicksandPdf();
            doc.addFileToVFS('Quicksand-Medium.ttf', f.normal);
            doc.addFont('Quicksand-Medium.ttf', 'Quicksand', 'normal');
            doc.addFileToVFS('Quicksand-Bold.ttf', f.bold);
            doc.addFont('Quicksand-Bold.ttf', 'Quicksand', 'bold');
            return 'Quicksand';
        } catch (e) {
            console.warn('Billets aux familles : Quicksand indisponible, police Helvetica utilisée', e);
            return 'helvetica';
        }
    }

    // Chargement de jsPDF à la demande (une seule fois pour tous les widgets)
    let _jspdfPromise = null;
    function loadJsPDF() {
        if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
        if (_jspdfPromise) return _jspdfPromise;
        _jspdfPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload  = () => (window.jspdf && window.jspdf.jsPDF) ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF indisponible'));
            s.onerror = () => { _jspdfPromise = null; reject(new Error('Chargement de jsPDF impossible (connexion internet ?)')); };
            document.head.appendChild(s);
        });
        return _jspdfPromise;
    }

    // ── HTML interne ──────────────────────────────────────────────────────
    function mfInnerHTML() {
        const swatches = Object.keys(MF_THEMES).map(id =>
            '<button class="mf-swatch" data-theme="' + id + '" title="' + MF_THEMES[id].name +
            '" style="background:' + MF_THEMES[id].bg + '"></button>'
        ).join('');
        const options = Object.keys(MF_MESSAGES).map(k =>
            '<option value="' + k + '">' + esc(MF_MESSAGES[k].label) + '</option>'
        ).join('');
        return `
        <div class="mf-inner">
            <div class="mf-header">
                <div class="mf-title">${ICON_MAIL}<span>Billets aux familles</span></div>
                <div class="mf-tools">
                    <button class="mf-icon-btn mf-theme-btn" title="Couleur du cadre" onmousedown="event.stopPropagation()">${ICON_PALETTE}</button>
                    <button class="mf-icon-btn mf-help-btn" title="Aide" onmousedown="event.stopPropagation()">${ICON_HELP}</button>
                    <span class="mf-sep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"     onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran" onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"      onmousedown="event.stopPropagation()"></button>
                    </div>
                </div>
            </div>
            <div class="mf-panel mf-help-popup">
                <div class="mf-panel-title">Aide</div>
                <ul class="mf-help-list">
                    <li>Pour <b>déplacer</b> le widget : cliquez-glissez sur une zone libre du cadre coloré.</li>
                    <li>Choisissez un <em>motif</em> : le titre et le message du modèle se remplissent tout seuls.</li>
                    <li>Modifiez librement le titre et le message (les pointillés servent à compléter à la main).</li>
                    <li><em>Texte du modèle</em> remet le message d'origine du motif choisi.</li>
                    <li>Le nom de l'enseignant est mémorisé pour les prochains billets.</li>
                    <li>L'aperçu a la taille exacte d'un billet : si le texte est long, il est réduit pour tenir.</li>
                    <li><em>Éditer en PDF</em> crée une page A4 de 10 billets à découper en police Quicksand (les émojis ne sont pas imprimés).</li>
                    <li>La palette change la couleur du cadre.</li>
                </ul>
            </div>
            <div class="mf-panel mf-theme-popup">
                <div class="mf-panel-title">Couleur du cadre</div>
                <div class="mf-swatches">${swatches}</div>
            </div>

            <div class="mf-main">
                <div class="mf-zone mf-form">
                    <div class="mf-pair">
                        <div class="mf-field">
                            <div class="mf-label">Motif</div>
                            <select class="mf-select mf-type">${options}</select>
                        </div>
                        <div class="mf-field">
                            <div class="mf-label">Classe de</div>
                            <input type="text" class="mf-input mf-nom" placeholder="ex. : Mme Martin" maxlength="60">
                        </div>
                    </div>
                    <div class="mf-field">
                        <div class="mf-label">Titre</div>
                        <input type="text" class="mf-input mf-titre" maxlength="80">
                    </div>
                    <div class="mf-field grow">
                        <div class="mf-label">Message <button type="button" class="mf-mini-link mf-reset-msg" title="Remettre le message du modèle">↺ Texte du modèle</button></div>
                        <textarea class="mf-textarea mf-message" placeholder="Écrivez votre message ici…"></textarea>
                    </div>
                    <div class="mf-row mf-sign-row">
                        <label class="mf-check"><input type="checkbox" class="mf-sign-on" checked> Signer</label>
                        <input type="text" class="mf-input mf-sign" placeholder="Signature (par défaut : le nom)" maxlength="60">
                    </div>
                </div>
                <div class="mf-zone mf-preview-zone">
                    <div class="mf-preview-lbl">Aperçu du billet</div>
                    <div class="mf-preview-wrap">
                        <div class="mf-billet">
                            <div class="mf-b-head"><span class="mf-b-classe"></span><span class="mf-b-date"></span></div>
                            <div class="mf-b-title"></div>
                            <div class="mf-b-body"></div>
                            <div class="mf-b-sign"></div>
                        </div>
                    </div>
                    <div class="mf-fit-note"></div>
                </div>
            </div>

            <div class="mf-footer">
                <button class="mf-pdf-btn">📄 Éditer en PDF (10 billets par page A4)</button>
                <span class="mf-status"></span>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    function initMotsFamillesWidget(widget, saved) {
        const outer = widget.querySelector('.mf-outer');
        const inner = widget.querySelector('.mf-inner');

        // L'intérieur ne doit pas déclencher le déplacement générique du tableau
        outer.addEventListener('mousedown', e => e.stopPropagation());
        const stopIfNotHeader = (e) => {
            if (e.target.closest && e.target.closest('.mf-header')) return;
            e.stopPropagation();
        };
        outer.addEventListener('touchstart',  stopIfNotHeader, { passive: true });
        outer.addEventListener('pointerdown', stopIfNotHeader);
        // Les raccourcis clavier du tableau ne doivent pas réagir à la saisie
        outer.addEventListener('keydown', (e) => {
            if (e.target.closest && e.target.closest('input, textarea, select')) e.stopPropagation();
        });

        // ── Références DOM ────────────────────────────────────────────────
        const typeSel   = widget.querySelector('.mf-type');
        const nomIn     = widget.querySelector('.mf-nom');
        const titreIn   = widget.querySelector('.mf-titre');
        const msgIn     = widget.querySelector('.mf-message');
        const resetMsg  = widget.querySelector('.mf-reset-msg');
        const signOn    = widget.querySelector('.mf-sign-on');
        const signIn    = widget.querySelector('.mf-sign');
        const signRow   = widget.querySelector('.mf-sign-row');
        const bClasse   = widget.querySelector('.mf-b-classe');
        const bDate     = widget.querySelector('.mf-b-date');
        const bTitle    = widget.querySelector('.mf-b-title');
        const bBody     = widget.querySelector('.mf-b-body');
        const bSign     = widget.querySelector('.mf-b-sign');
        const billet    = widget.querySelector('.mf-billet');
        const fitNote   = widget.querySelector('.mf-fit-note');
        const pdfBtn    = widget.querySelector('.mf-pdf-btn');
        const statusEl  = widget.querySelector('.mf-status');

        let _isMax = false;

        // ── État (valeurs sauvegardées ou modèle par défaut) ──────────────
        const d = saved || {};
        const type0 = MF_MESSAGES[d.type] ? d.type : 'materiel';
        typeSel.value = type0;
        nomIn.value   = d.nom   != null ? d.nom   : nomMemorise();
        titreIn.value = d.titre != null ? d.titre : MF_MESSAGES[type0].title;
        msgIn.value   = d.message != null ? d.message : MF_MESSAGES[type0].body;
        signOn.checked = d.signature !== false;
        signIn.value  = d.signText || '';

        // Sauvegarde différée (pas à chaque frappe)
        let saveT = null;
        function saveSoon() {
            clearTimeout(saveT);
            saveT = setTimeout(() => { if (typeof saveBoard === 'function') saveBoard(); }, 400);
        }

        // ── Données lues par le PDF et l'aperçu ───────────────────────────
        function current() {
            const nom = nomIn.value.trim();
            return {
                classe:    'Classe de ' + (nom || '.......................'),
                date:      dateDuJour(),
                titre:     titreIn.value.trim(),
                message:   msgIn.value.replace(/\s+$/, ''),
                signature: signOn.checked ? (signIn.value.trim() || nom) : ''
            };
        }

        // ── Aperçu ────────────────────────────────────────────────────────
        function updatePreview() {
            const c = current();
            bClasse.textContent = c.classe;
            bDate.textContent   = c.date;
            bTitle.textContent  = c.titre;
            bBody.textContent   = c.message;
            bSign.textContent   = c.signature;
            bSign.style.display = c.signature ? '' : 'none';
            signIn.disabled = !signOn.checked;
            fitPreview();
        }

        // Place le message sous le titre (qui peut tenir sur 2 lignes) et
        // réduit le texte s'il dépasse, comme le fera le PDF
        function fitPreview() {
            if (!billet.offsetWidth) return;
            const W = billet.clientWidth;          // = 95 mm
            const mm = W / 95;
            const titleBottom = bTitle.offsetTop + bTitle.offsetHeight;
            const top = Math.max(21 * W / 100, titleBottom + 3 * mm);
            billet.style.setProperty('--mf-body-top', top + 'px');
            billet.style.setProperty('--mf-body-bottom', (bSign.style.display === 'none' ? 4 : 9) * W / 100 + 'px');
            let fit = 1;
            billet.style.setProperty('--mf-fit', fit);
            while (bBody.scrollHeight > bBody.clientHeight + 1 && fit > 0.56) {
                fit -= 0.04;
                billet.style.setProperty('--mf-fit', fit.toFixed(2));
            }
            const trop = bBody.scrollHeight > bBody.clientHeight + 1;
            fitNote.textContent = trop ? '⚠️ Message trop long : il sera coupé sur le billet.'
                                : (fit < 0.99 ? 'Texte réduit pour tenir dans le billet.' : '');
            fitNote.style.color = trop ? '#C0392B' : '';
        }

        // ── Événements du formulaire ──────────────────────────────────────
        typeSel.addEventListener('change', () => {
            const m = MF_MESSAGES[typeSel.value];
            titreIn.value = m.title;
            msgIn.value   = m.body;
            updatePreview();
            saveSoon();
        });
        resetMsg.addEventListener('click', (e) => {
            e.preventDefault();
            const m = MF_MESSAGES[typeSel.value];
            titreIn.value = m.title;
            msgIn.value   = m.body;
            updatePreview();
            saveSoon();
        });
        nomIn.addEventListener('input', () => {
            try { localStorage.setItem(NOM_KEY, nomIn.value.trim()); } catch (e) {}
            updatePreview(); saveSoon();
        });
        [titreIn, msgIn, signIn].forEach(el => el.addEventListener('input', () => { updatePreview(); saveSoon(); }));
        signOn.addEventListener('change', () => { updatePreview(); saveSoon(); });

        // ── PDF ───────────────────────────────────────────────────────────
        function setStatus(msg, err) {
            statusEl.textContent = msg || '';
            statusEl.classList.toggle('err', !!err);
        }

        function dessinerBillet(doc, x, y, c, font) {
            const { billetW, billetH } = MF_PDF;

            // Cadre de découpe discret (pointillés)
            doc.setDrawColor(190, 190, 190);
            doc.setLineDashPattern([1, 1], 0);
            doc.rect(x, y, billetW, billetH);
            doc.setLineDashPattern([], 0);

            doc.setTextColor(0, 0, 0);
            doc.setDrawColor(0, 0, 0);

            // En-tête : classe et date
            doc.setFont(font, 'bold');
            doc.setFontSize(7);
            const dateW = doc.getTextWidth(c.date);
            const classe = doc.splitTextToSize(c.classe.toUpperCase(), billetW - 10 - dateW - 4)[0] || '';
            doc.text(classe, x + 5, y + 6);
            doc.text(c.date, x + billetW - 5, y + 6, { align: 'right' });
            doc.setLineWidth(0.2);
            doc.line(x + 5, y + 8, x + billetW - 5, y + 8);

            // Titre (2 lignes au plus)
            let curY = y + 16;
            if (c.titre) {
                doc.setFontSize(10);
                const tl = doc.splitTextToSize(c.titre, billetW - 10).slice(0, 2);
                doc.text(tl, x + billetW / 2, curY, { align: 'center', lineHeightFactor: 1.15 });
                curY += (tl.length - 1) * 10 * 0.3528 * 1.15;
            }

            // Message : taille réduite au besoin pour tenir dans le billet
            const bodyTop    = curY + 7;
            const bodyBottom = y + billetH - (c.signature ? 9 : 4);
            doc.setFont(font, 'normal');
            let fs = 9, lines = [];
            for (; fs >= 5; fs -= 0.5) {
                doc.setFontSize(fs);
                lines = doc.splitTextToSize(c.message, billetW - 12);
                const lh = fs * 0.3528 * 1.15;
                if (lines.length * lh <= bodyBottom - bodyTop + lh * 0.75) break;
            }
            if (fs < 5) {                        // vraiment trop long : on coupe
                fs = 5; doc.setFontSize(fs);
                const lh = fs * 0.3528 * 1.15;
                lines = lines.slice(0, Math.max(1, Math.floor((bodyBottom - bodyTop) / lh) + 1));
            }
            if (lines.length) {
                // la ligne de base de la 1re ligne se trouve à ~0,8 × taille sous le haut
                doc.text(lines, x + 6, bodyTop - fs * 0.3528 * 0.2 + fs * 0.3528 * 0.8, { lineHeightFactor: 1.15 });
            }

            // Signature
            if (c.signature) {
                doc.setFont(font, 'bold');
                doc.setFontSize(8);
                doc.text(c.signature, x + billetW - 6, y + billetH - 5, { align: 'right' });
            }
        }

        function enregistrerPdf(doc, nom) {
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            if (window.Android && window.Android.savePdfFromBase64) {
                window.Android.savePdfFromBase64(pdfBase64, nom);
                return;
            }
            const blob = doc.output('blob');
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = nom;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        async function genererPDF() {
            pdfBtn.disabled = true;
            setStatus('Préparation…');
            try {
                const JsPDF = await loadJsPDF();
                const doc = new JsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const font = await prepareFont(doc);
                const c0 = current();
                const c = {
                    classe:    pourPdf(c0.classe),
                    date:      c0.date,
                    titre:     pourPdf(c0.titre),
                    message:   pourPdf(c0.message).replace(/\n{3,}/g, '\n\n'),
                    signature: pourPdf(c0.signature)
                };
                const { cols, rows, marginX, marginY, billetW, billetH } = MF_PDF;
                for (let r = 0; r < rows; r++) {
                    for (let col = 0; col < cols; col++) {
                        dessinerBillet(doc, marginX + col * billetW, marginY + r * billetH, c, font);
                    }
                }
                enregistrerPdf(doc, nomFichier());
                const ok = font === 'Quicksand' ? '✓ PDF créé' : '✓ PDF créé (police Quicksand indisponible hors-ligne)';
                setStatus(ok);
                setTimeout(() => { if (statusEl.textContent === ok) setStatus(''); }, 4000);
            } catch (err) {
                console.error('Billets aux familles : erreur PDF', err);
                setStatus(err && err.message ? err.message : "L'export a échoué.", true);
            } finally {
                pdfBtn.disabled = false;
            }
        }
        pdfBtn.addEventListener('click', (e) => { e.stopPropagation(); genererPDF(); });

        // ── Déplacement : clic-glisser sur une zone libre du cadre ────────
        if (!inner._dragInit) {
            inner._dragInit = true;
            const onDragDown = (e) => {
                if (_isMax || widget.classList.contains('phone-fs')) return;
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (!window.bdpCanDragFrom(e, inner, '.mf-zone, .mf-panel, .mf-footer')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            inner.addEventListener('mousedown',  onDragDown);
            inner.addEventListener('touchstart', onDragDown, { passive: false });
        }

        // ── Panneaux aide / couleur ───────────────────────────────────────
        const helpBtn    = widget.querySelector('.mf-help-btn');
        const helpPopup  = widget.querySelector('.mf-help-popup');
        const themeBtn   = widget.querySelector('.mf-theme-btn');
        const themePopup = widget.querySelector('.mf-theme-popup');
        const panels = [[helpBtn, helpPopup], [themeBtn, themePopup]];
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
        const onDocClick = () => {
            if (!document.contains(widget)) { document.removeEventListener('click', onDocClick); return; }
            closePanels();
        };
        document.addEventListener('click', onDocClick);

        // ── Couleur du cadre ──────────────────────────────────────────────
        function applyTheme(id) {
            if (!MF_THEMES[id]) id = 'bleu';
            widget.dataset.mfTheme = id;
            outer.style.setProperty('--mf-bg', MF_THEMES[id].bg);
            outer.style.setProperty('--mf-op', MF_THEMES[id].op);
            widget.querySelectorAll('.mf-swatch').forEach(s =>
                s.classList.toggle('is-on', s.dataset.theme === id));
        }
        widget.querySelectorAll('.mf-swatch').forEach(s => {
            s.addEventListener('click', (e) => {
                e.stopPropagation();
                applyTheme(s.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });
        applyTheme(d.theme || widget.dataset.mfTheme || 'bleu');

        // ── Taille ────────────────────────────────────────────────────────
        if (d.w > 0) outer.style.width  = Math.max(MIN_W, d.w) + 'px';
        if (d.h > 0) outer.style.height = Math.max(MIN_H, d.h) + 'px';
        widget.dataset.mfW = outer.offsetWidth  || d.w || DEFAULT_W;
        widget.dataset.mfH = outer.offsetHeight || d.h || DEFAULT_H;

        // ── Plein écran (bouton vert) ─────────────────────────────────────
        function setMax(on) {
            _isMax = !!on;
            widget.classList.toggle('wf-max', _isMax);
            if (_isMax) {
                Object.assign(inner.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '9999', borderRadius: '0' });
            } else {
                ['position', 'inset', 'width', 'height', 'zIndex', 'borderRadius'].forEach(p => inner.style[p] = '');
            }
            requestAnimationFrame(fitPreview);
        }
        widget._wfSetMax = setMax;
        // Au doigt, en plein écran : l'appui ne doit pas remonter jusqu'au tableau
        const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
        inner.addEventListener('touchstart',  stopInMax, { passive: true });
        inner.addEventListener('pointerdown', stopInMax);
        inner.addEventListener('mousedown',   stopInMax);

        // ── Réduire (mini-barre) ──────────────────────────────────────────
        // La mini-barre porte la classe .wf-mini-bar et la position d'origine
        // est gardée dans data-wf-mini-saved-left/top : save-load.js s'en sert
        // pour sauvegarder la vraie position du widget.
        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
        const WIDGET_STYLE_PROPS = ['width', 'height', 'overflow', 'background', 'borderRadius', 'border', 'padding'];

        function collapse(silent) {
            if (widget.dataset.collapsed === '1') return;
            if (_isMax) setMax(false);
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') {
                window.exitPhoneFullscreen(widget);
            }
            closePanels();
            widget.dataset.mfW = outer.offsetWidth  || widget.dataset.mfW;
            widget.dataset.mfH = outer.offsetHeight || widget.dataset.mfH;
            widget.dataset.wfMiniSavedLeft = widget.offsetLeft;
            widget.dataset.wfMiniSavedTop  = widget.offsetTop;

            outer.style.display = 'none';
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                  .forEach(el => el.style.display = 'none');

            const others = Array.from(document.querySelectorAll('.widget'))
                .filter(w => w !== widget && w.dataset.collapsed === '1');
            const x = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            Object.assign(widget.style, {
                top: MARGIN_TOP + 'px', left: x + 'px',
                width: COLLAPSED_W + 'px', height: COLLAPSED_H + 'px',
                overflow: 'hidden', background: '#2a2a3e', borderRadius: '8px', border: 'none', padding: '0'
            });
            widget.dataset.collapsed = '1';

            const bar = document.createElement('div');
            bar.className = 'wf-mini-bar mf-mini-bar';
            bar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
            const lbl = document.createElement('span');
            lbl.textContent = '✉️ Billets aux familles';
            lbl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            const btn = document.createElement('button');
            btn.title = 'Déplier';
            btn.textContent = '▲';
            btn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            btn.addEventListener('pointerdown', e => e.stopPropagation());
            btn.addEventListener('mousedown',   e => e.stopPropagation());
            btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); expand(); });
            bar.appendChild(lbl);
            bar.appendChild(btn);
            widget.appendChild(bar);

            bar.addEventListener('pointerdown', (e) => {
                if (btn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                bar.setPointerCapture(e.pointerId);
                const sx = e.clientX - widget.offsetLeft, sy = e.clientY - widget.offsetTop;
                const onMove = ev => {
                    widget.style.left = Math.max(0, ev.clientX - sx) + 'px';
                    widget.style.top  = Math.max(0, ev.clientY - sy) + 'px';
                };
                const onUp = () => {
                    bar.removeEventListener('pointermove', onMove);
                    bar.removeEventListener('pointerup',   onUp);
                    bar.removeEventListener('pointercancel', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                };
                bar.addEventListener('pointermove', onMove);
                bar.addEventListener('pointerup',   onUp);
                bar.addEventListener('pointercancel', onUp);
            });

            if (!silent && typeof saveBoard === 'function') saveBoard();
        }

        function expand() {
            widget.querySelectorAll('.mf-mini-bar').forEach(el => el.remove());
            const l = parseFloat(widget.dataset.wfMiniSavedLeft);
            const t = parseFloat(widget.dataset.wfMiniSavedTop);
            WIDGET_STYLE_PROPS.forEach(p => widget.style[p] = '');
            if (!isNaN(l)) widget.style.left = l + 'px';
            if (!isNaN(t)) widget.style.top  = t + 'px';
            delete widget.dataset.wfMiniSavedLeft;
            delete widget.dataset.wfMiniSavedTop;
            widget.dataset.collapsed = '0';

            outer.style.display = '';
            outer.style.width   = (parseFloat(widget.dataset.mfW) || DEFAULT_W) + 'px';
            outer.style.height  = (parseFloat(widget.dataset.mfH) || DEFAULT_H) + 'px';
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                  .forEach(el => el.style.display = '');
            if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
            requestAnimationFrame(fitPreview);
            if (typeof saveBoard === 'function') saveBoard();
        }
        widget._mfCollapse = collapse;
        widget._mfExpand   = expand;

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = widget.querySelector('[data-role="wf-min"]');
        const wfMax   = widget.querySelector('[data-role="wf-max"]');
        const wfClose = widget.querySelector('[data-role="wf-close"]');
        [wfMin, wfMax, wfClose].forEach(b => b.addEventListener('pointerdown', e => e.stopPropagation()));
        wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); collapse(); });
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            setMax(!_isMax);
            if (typeof saveBoard === 'function') saveBoard();
        });
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Poignée de redimensionnement ──────────────────────────────────
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
                const sx = e.clientX, sy = e.clientY;
                const sw = outer.offsetWidth, sh = outer.offsetHeight;
                const onMove = (ev) => {
                    ev.preventDefault();
                    outer.style.width  = Math.max(MIN_W, sw + ev.clientX - sx) + 'px';
                    outer.style.height = Math.max(MIN_H, sh + ev.clientY - sy) + 'px';
                };
                const onUp = () => {
                    handle.removeEventListener('pointermove',   onMove);
                    handle.removeEventListener('pointerup',     onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                };
                handle.addEventListener('pointermove',   onMove);
                handle.addEventListener('pointerup',     onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        }

        // ── Suivi de la taille (sauvegarde + aperçu) ──────────────────────
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                if (widget.dataset.collapsed !== '1' && !_isMax && !widget.classList.contains('phone-fs')) {
                    if (outer.offsetWidth  > 0) widget.dataset.mfW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.mfH = outer.offsetHeight;
                }
                fitPreview();
            });
            ro.observe(outer);
            ro.observe(billet);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPreview);

        // ── Données pour save-load.js (champ mfData) ──────────────────────
        widget._mfGetData = function () {
            return {
                type:      typeSel.value,
                nom:       nomIn.value,
                titre:     titreIn.value,
                message:   msgIn.value,
                signature: signOn.checked,
                signText:  signIn.value,
                theme:     widget.dataset.mfTheme || 'bleu',
                w:         parseFloat(widget.dataset.mfW) || DEFAULT_W,
                h:         parseFloat(widget.dataset.mfH) || DEFAULT_H,
                collapsed: widget.dataset.collapsed === '1',
                max:       _isMax
            };
        };

        updatePreview();
    }

    // =========================================================================
    // CRÉATION (nouveau widget ou restauration depuis save-load.js)
    // data : null pour un nouveau widget, objet mfData (ou { _restored:true })
    //        quand le tableau est rechargé.
    // =========================================================================
    window.createMotsFamillesWidget = function (data) {
        const restoring = !!(data && typeof data === 'object');
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 120, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'mots-familles';
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
            <div class="mf-outer">${mfInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (!restoring && typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);
        if (!restoring && typeof bringToFront === 'function') bringToFront(widget);

        // Nouveau widget : hauteur adaptée à l'écran pour que tout le formulaire soit visible
        if (!restoring) {
            const outerEl = widget.querySelector('.mf-outer');
            const free = window.innerHeight - widget.getBoundingClientRect().top - 24;
            if (outerEl && free < DEFAULT_H) outerEl.style.height = Math.max(MIN_H, free) + 'px';
        }
        try { initMotsFamillesWidget(widget, restoring ? data : null); }
        catch (e) { console.error('Billets aux familles : erreur à l\'ouverture', e); }

        if (restoring) {
            // restoreBoardFromJSON replace le widget juste après sa création :
            // on applique l'état réduit / plein écran une fois la position posée.
            setTimeout(() => {
                if (!document.contains(widget)) return;
                if (data.collapsed && widget._mfCollapse) widget._mfCollapse(true);
                else if (data.max && widget._wfSetMax) widget._wfSetMax(true);
            }, 0);
        } else {
            widget.focus();
            // Sur téléphone : ouverture directe en plein écran (bouton vert)
            if (isPhoneNow() && widget._wfSetMax) widget._wfSetMax(true);
            if (typeof saveBoard === 'function') saveBoard();
        }
        return widget;
    };

    // =========================================================================
    // HOOK createWidget — createWidget('mots-familles') ouvre ce widget
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function' || _orig._mfPatched) return;
            window.createWidget = function (type) {
                if (type === 'mots-familles') return window.createMotsFamillesWidget();
                return _orig.apply(this, arguments);
            };
            window.createWidget._mfPatched = true;
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
