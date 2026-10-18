// =========================================================================
// WIDGET LISTE — ÉDITION — Le Bureau du Prof
// Génère en PDF les documents de la classe : liste de classe, feuille de
// pointage, grandes étiquettes, petites étiquettes et fiches de suivi.
// (mêmes fonctionnalités que l'onglet « Édition » du widget Liste de classe)
//
// 📌 Dépendance : widget-liste-de-classe.js doit être chargé sur la page
//    (il fournit window.ClasseListe = les classes/élèves, et
//    window.ClasseEdition = le moteur de génération PDF).
//    L'ordre de chargement des deux fichiers n'a pas d'importance.
//    Les classes se créent / se remplissent dans le widget « Liste de classe » ;
//    ce widget-ci les utilise directement (mêmes données, même classe active,
//    même tri Prénom / Nom).
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (à la suite de widget-liste-de-classe.js) :
//      <script src="widget-liste-de-classe.js"></script>
//      <script src="widget-liste-edition.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createListeEditionWidget();closeMainMenu()">
//          <span class="mm-ico">🖨️</span>Liste — Édition
//      </div>
//
// 📌 Le PDF utilise jsPDF + jsPDF-AutoTable (chargés automatiquement depuis
//    cdnjs au premier usage ; connexion Internet requise).
// =========================================================================

// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}


// ─────────────────────────────────────────────────────────────────────────
// DÉPLACEMENT DES WIDGETS DEPUIS N'IMPORTE QUELLE ZONE LIBRE
// (fonction partagée entre les widgets, définie une seule fois)
// Renvoie true si l'appui (souris / doigt) peut lancer le déplacement :
// pas sur un champ à remplir, un bouton, un lien, une zone cliquable
// (sélecteurs « extra »), ni sur une barre de défilement. Au doigt, un
// appui dans une liste qui défile sert à faire défiler, pas à déplacer.
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
                if (e.touches) return false;           // au doigt : on laisse défiler
                const r = el.getBoundingClientRect();
                if (canY && pt.clientX > r.left + el.clientLeft + el.clientWidth)  return false; // barre verticale
                if (canX && pt.clientY > r.top  + el.clientTop  + el.clientHeight) return false; // barre horizontale
            }
            if (el === root) break;
        }
        return true;
    };
}

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
    const STYLE = `
    /* ── Widget transparent : ledit-outer porte tout le visuel ── */
    .widget[data-type="liste-edition"],
    .widget[data-type="liste-edition"]:focus-within {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe (taille + ombre) ── */
    .widget[data-type="liste-edition"] .ledit-outer {
        --le-ink:   #14202E;
        --le-glass: rgba(255,255,255,0.62);
        --le-bg:    #F4A9C0;
        --le-op:    #C2456E;

        position: relative;
        width: 640px;
        height: 460px;
        min-width: 300px;
        min-height: 240px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
    }
    .widget[data-type="liste-edition"] .ledit-outer::-webkit-resizer { display: none; }
    .widget[data-type="liste-edition"]:hover .ledit-outer,
    .widget[data-type="liste-edition"]:focus-within .ledit-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    /* ── Cadre coloré ── */
    .ledit-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px 16px;
        box-sizing: border-box;
        background-color: var(--le-bg);
        background-image:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
        border-radius: 24px;
        overflow: hidden;
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        color: var(--le-ink);
        user-select: none;
        position: relative;
        container-type: size;
        transition: background-color .3s;
    }

    /* ── En-tête : deux pastilles « verre » ── */
    .ledit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 0 0;
        flex-shrink: 0;
        cursor: move;
    }
    .ledit-title,
    .ledit-tools,
    .ledit-tabs {
        background: var(--le-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .ledit-title,
    .ledit-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
    }
    .ledit-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
        pointer-events: none;
    }
    .ledit-title span { overflow: hidden; text-overflow: ellipsis; }
    .ledit-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--le-op); }
    .ledit-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
    @container (max-width: 460px) { .ledit-title span { display: none; } .ledit-title { padding: 7px 10px; } }

    .ledit-icon-btn {
        width: 32px; height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--le-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s;
    }
    .ledit-icon-btn svg { width: 18px; height: 18px; }
    .ledit-icon-btn:hover,
    .ledit-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .ledit-icon-btn:focus-visible { outline: 2px solid var(--le-ink); outline-offset: 2px; }
    .ledit-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Onglets classes (pastille « verre ») ── */
    .ledit-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 4px;
        align-items: center;
        flex-shrink: 0;
        border-radius: 18px;
    }
    .ledit-tab {
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: background .15s, color .15s;
        font-family: inherit;
        background: transparent;
        color: rgba(20,32,46,0.65);
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .ledit-tab:hover { background: rgba(20,32,46,0.08); }
    .ledit-tab.active { background: var(--le-op); color: #fff; box-shadow: 0 2px 0 rgba(0,0,0,0.2); }

    /* ── Panneau Édition (zone blanche arrondie) ── */
    .ledit-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 14px;
        background: rgba(255,255,255,0.92);
        border-radius: 18px;
        box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        scrollbar-width: thin;
        scrollbar-color: rgba(20,32,46,0.25) transparent;
    }
    .ledit-info { font-size: 13px; font-weight: 700; color: rgba(20,32,46,0.75); }
    .ledit-fields { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: flex-end; }
    .ledit-field {
        display: flex; flex-direction: column; gap: 4px;
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        color: rgba(20,32,46,0.55); letter-spacing: .4px;
    }
    .ledit-input {
        padding: 8px 14px;
        border-radius: 999px;
        border: 1.5px solid rgba(20,32,46,0.12);
        background: #fff;
        font-size: 13px;
        font-family: inherit;
        font-weight: 600;
        color: var(--le-ink);
        user-select: text;
        transition: border-color .15s;
        width: 190px;
        box-sizing: border-box;
    }
    .ledit-input:focus { outline: none; border-color: var(--le-op); }
    .ledit-input.ledit-year { width: 120px; }

    /* ── Sélecteur de tri (segmenté) ── */
    .ledit-sortgroup {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 2px 6px -2px rgba(10,20,35,0.3);
    }
    .ledit-sort-label {
        padding: 0 6px 0 8px;
        font-size: 11px;
        font-weight: 700;
        color: rgba(20,32,46,0.65);
        white-space: nowrap;
    }
    .ledit-sort-opt {
        padding: 5px 12px;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: rgba(20,32,46,0.65);
        font-size: 11px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: background .15s, color .15s;
    }
    .ledit-sort-opt:hover { background: rgba(20,32,46,0.08); }
    .ledit-sort-opt.active { background: var(--le-op); color: #fff; }

    /* ── Cartes documents ── */
    .ledit-doc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 10px;
    }
    .ledit-doc-card {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px;
        background: #F4F6F9;
        border: 1.5px solid rgba(20,32,46,0.08);
        border-radius: 16px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: var(--le-ink);
        box-shadow: 0 2px 0 rgba(20,32,46,0.06);
        transition: box-shadow .15s, transform .1s, border-color .15s, background .15s;
    }
    .ledit-doc-card:hover { background: #fff; border-color: var(--c); box-shadow: 0 6px 16px -10px rgba(10,20,35,0.5); }
    .ledit-doc-card:active { transform: scale(0.98); }
    .ledit-doc-card:disabled { opacity: .55; cursor: wait; }
    .ledit-doc-ico {
        width: 40px; height: 40px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
        background: var(--t);
        transition: background .15s;
    }
    .ledit-doc-card:hover .ledit-doc-ico { background: var(--c); }
    .ledit-doc-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .ledit-doc-txt b { font-size: 13px; font-weight: 700; }
    .ledit-doc-txt small { font-size: 11px; color: rgba(20,32,46,0.6); font-weight: 600; }
    .ledit-status { font-size: 12px; font-weight: 600; color: rgba(20,32,46,0.55); min-height: 16px; word-break: break-all; }
    .ledit-status.ok  { color: #23915A; }
    .ledit-status.err { color: #C0392B; }

    /* ── Message (module absent) ── */
    .ledit-missing {
        text-align: center;
        color: #C0392B;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.6;
        padding: 30px 10px;
    }

    /* ── Petits cadres : on compacte ── */
    @container (max-height: 420px) {
        .ledit-inner { gap: 7px; }
        .ledit-header { padding-top: 10px; }
        .ledit-title { padding: 5px 12px 5px 10px; font-size: 13px; }
        .ledit-tools { padding: 3px 10px 3px 4px; }
        .ledit-icon-btn { width: 28px; height: 28px; }
        .ledit-tab { padding: 3px 10px; }
        .ledit-body { padding: 10px; gap: 10px; }
        .ledit-doc-card { padding: 8px 10px; }
        .ledit-doc-ico { width: 32px; height: 32px; font-size: 15px; }
    }

    /* ── Panneaux (aide, couleur) ── */
    .ledit-panel {
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
        color: var(--le-ink);
    }
    .ledit-panel.show { display: flex; }
    .ledit-panel-title { font-size: 13px; font-weight: 700; }
    .ledit-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .ledit-help-list li { margin-bottom: 4px; }
    .ledit-help-list ul { margin: 2px 0 0; padding-left: 16px; }
    .ledit-help-list b { font-weight: 700; }
    .ledit-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .ledit-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .ledit-swatch.is-on { border-color: var(--le-ink); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Plein écran du bouton vert (classe .wf-max) ──
       Marge à gauche pour laisser visibles les onglets des panneaux latéraux */
    .widget.wf-max[data-type="liste-edition"] .ledit-outer { outline: none !important; }
    .widget.wf-max[data-type="liste-edition"] .ledit-header { cursor: default; }
    .widget.wf-max[data-type="liste-edition"] .ledit-inner {
        left: 40px !important;
        width: calc(100vw - 40px) !important;
    }

    /* ── Téléphone : plein écran, hauteur réelle de l'écran ── */
    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget.wf-max[data-type="liste-edition"] .ledit-inner {
            height: 100dvh !important;
            border-radius: 0 !important;
            padding: 0 10px 10px;
        }
    }

    /* ── Déplacement : clic-glisser n'importe où sur une zone libre du cadre ── */
    .ledit-inner { cursor: move; }
    .ledit-inner input, .ledit-inner textarea { cursor: text; }
    .ledit-inner select, .ledit-inner button:not(:disabled) { cursor: pointer; }
    .ledit-inner label, .ledit-panel, .ledit-modal-overlay { cursor: default; }
    .widget.wf-max[data-type="liste-edition"] .ledit-inner,
    .widget.phone-fs[data-type="liste-edition"] .ledit-inner { cursor: default; }

    `;

    if (!document.getElementById('ledit-widget-style')) {
        const s = document.createElement('style');
        s.id = 'ledit-widget-style';
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

    // Injecter le CSS des boutons wf si pas déjà fait
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

    // ── Constantes ────────────────────────────────────────────────────────
    const LE_TYPE      = 'liste-edition';
    const LE_DEFAULT_W = 640;
    const LE_DEFAULT_H = 460;
    const LE_MIN_W     = 300;
    const LE_MIN_H     = 240;
    const LE_LABEL     = '🖨️ Liste — Édition';

    // Couleurs du cadre (mêmes que le Visualiseur / Tirage / Équipes / Liste de classe)
    const LE_THEMES = {
        bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };
    const LE_DEFAULT_THEME = 'rose';

    // ── Icônes ────────────────────────────────────────────────────────────
    const LE_ICON_PRINT   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path d="M7 14h10v6.5H7z"/><circle cx="17" cy="11" r=".9" fill="currentColor" stroke="none"/></svg>';
    const LE_ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
    const LE_ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';

    // ── HTML interne partagé (création + restauration) ────────────────────
    function leditInnerHTML() {
        const CE = window.ClasseEdition;
        const docCards = (CE ? CE.KINDS : []).map(k => `
                <button class="ledit-doc-card" data-doc="${k.id}" style="--c:${k.color};--t:${k.tint};">
                    <span class="ledit-doc-ico">${k.icon}</span>
                    <span class="ledit-doc-txt"><b>${k.title}</b><small>${k.desc}</small></span>
                </button>`).join('');
        const swatches = Object.keys(LE_THEMES).map(id =>
            '<button class="ledit-swatch" data-theme="' + id + '" title="' + LE_THEMES[id].name +
            '" style="background:' + LE_THEMES[id].bg + '"></button>'
        ).join('');
        return `
        <div class="ledit-inner">
            <div class="ledit-header">
                <div class="ledit-title">${LE_ICON_PRINT}<span>Liste — Édition</span></div>
                <div class="ledit-tools">
                    <button class="ledit-icon-btn ledit-theme-btn" title="Couleur du cadre" onmousedown="event.stopPropagation()">${LE_ICON_PALETTE}</button>
                    <button class="ledit-icon-btn ledit-help-btn" title="Aide" onmousedown="event.stopPropagation()">${LE_ICON_HELP}</button>
                    <span class="ledit-sep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                    </div>
                </div>
            </div>
            <div class="ledit-panel ledit-help-popup">
                <div class="ledit-panel-title">Aide</div>
                <ul class="ledit-help-list">
                    <li>Pour <b>déplacer</b> le widget : cliquez-glissez sur n'importe quelle zone libre du cadre.</li>
                    <li>Choisissez la <b>classe</b> avec les onglets (la classe active est la même que dans le widget « Liste de classe »).</li>
                    <li>Indiquez l'<b>enseignant de la classe</b> (propre à chaque classe) et l'<b>année scolaire</b> : ils figurent sur les documents.</li>
                    <li>Le tri <b>Prénom / Nom</b> est appliqué aux documents.</li>
                    <li>Cliquez sur un document pour le générer en <b>PDF</b> :
                        <ul>
                            <li>liste de classe (tableau A4)</li>
                            <li>feuille de pointage (15 cases)</li>
                            <li>grandes étiquettes (8 par page)</li>
                            <li>petites étiquettes (27 par page)</li>
                            <li>fiches de suivi (2 fiches A5 par page)</li>
                        </ul>
                    </li>
                    <li>Les élèves se saisissent dans le widget <b>Liste de classe</b>.</li>
                    <li>Connexion Internet requise au premier usage (bibliothèque PDF).</li>
                    <li>La palette change la couleur du cadre.</li>
                </ul>
            </div>
            <div class="ledit-panel ledit-theme-popup">
                <div class="ledit-panel-title">Couleur du cadre</div>
                <div class="ledit-swatches">${swatches}</div>
            </div>
            <div class="ledit-tabs"></div>
            <div class="ledit-body">
                <div class="ledit-info"></div>
                <div class="ledit-fields">
                    <label class="ledit-field">Enseignant de la classe
                        <input type="text" class="ledit-input ledit-prof" placeholder="ex : M. PROF" autocomplete="off">
                    </label>
                    <label class="ledit-field">Année scolaire
                        <input type="text" class="ledit-input ledit-year" placeholder="2026-2027" autocomplete="off">
                    </label>
                    <div class="ledit-sortgroup" title="Le tri choisi s'applique aux documents">
                        <span class="ledit-sort-label">🔤 Trier par</span>
                        <button class="ledit-sort-opt" data-sort="prenom">Prénom</button>
                        <button class="ledit-sort-opt" data-sort="nom">Nom</button>
                    </div>
                </div>
                <div class="ledit-doc-grid">${docCards}
                </div>
                <div class="ledit-status">Choisissez un document : il sera généré en PDF pour la classe active.</div>
            </div>
        </div>`;
    }

    // ── Mini-barre (widget réduit) — partagé collapse + restauration ──────
    function leditApplyCollapsedLook(widget) {
        widget.querySelector('.ledit-outer').style.display = 'none';
        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
              .forEach(el => el.style.display = 'none');

        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
        const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
            w !== widget && w.dataset.collapsed === '1'
        );
        const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
        widget.style.top          = MARGIN_TOP + 'px';
        widget.style.left         = occupiedX  + 'px';
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

        if (widget.querySelector('.ledit-mini-bar')) return;

        const miniBar = document.createElement('div');
        miniBar.className = 'ledit-mini-bar';
        miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

        const labelEl = document.createElement('span');
        labelEl.textContent = LE_LABEL;
        labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

        const expandBtn = document.createElement('button');
        expandBtn.title = 'Déplier';
        expandBtn.textContent = '▲';
        expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
        expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
        expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
        expandBtn.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            if (typeof widget._leditExpand === 'function') widget._leditExpand();
        });

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
            const onMove = ev => {
                widget.style.left = Math.max(0, ev.clientX - startX) + 'px';
                widget.style.top  = Math.max(0, ev.clientY - startY) + 'px';
            };
            const onUp = () => {
                miniBar.removeEventListener('pointermove', onMove);
                miniBar.removeEventListener('pointerup',   onUp);
                const curW  = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            miniBar.addEventListener('pointermove', onMove);
            miniBar.addEventListener('pointerup',   onUp);
        });
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initListeEditionWidget = function (widget) {

        // Nettoyer une éventuelle initialisation précédente (déplier, etc.)
        if (typeof widget._leditCleanup === 'function') widget._leditCleanup();
        const cleanups = [];
        widget._leditCleanup = () => cleanups.forEach(fn => { try { fn(); } catch (e) {} });

        const outer = widget.querySelector('.ledit-outer');

        // Repartir d'un DOM neuf si déjà initialisé (évite d'empiler les écouteurs)
        if (widget._leditInited) outer.innerHTML = leditInnerHTML();
        widget._leditInited = true;

        // Bloquer la remontée mousedown/clavier (drag du board, raccourcis)
        const stopEvt = e => e.stopPropagation();
        ['mousedown', 'keydown', 'keyup'].forEach(ev => {
            outer.addEventListener(ev, stopEvt);
            cleanups.push(() => outer.removeEventListener(ev, stopEvt));
        });

        // ── Déplacement : clic-glisser n'importe où sur le widget ─────────
        //    (sauf champs à remplir, boutons, zones cliquables, panneaux,
        //     barres de défilement ; désactivé en plein écran)
        const dragRoot = widget.querySelector('.ledit-inner');
        if (dragRoot && !dragRoot._dragInit) {
            dragRoot._dragInit = true;
            const onDragDown = (e) => {
                if (_isMax || widget.classList.contains('phone-fs')) return;
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (!window.bdpCanDragFrom(e, dragRoot, '.ledit-panel')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            dragRoot.addEventListener('mousedown',  onDragDown);
            dragRoot.addEventListener('touchstart', onDragDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const CL         = window.ClasseListe;
        const CE         = window.ClasseEdition;
        const tabsEl     = widget.querySelector('.ledit-tabs');
        const bodyEl     = widget.querySelector('.ledit-body');
        const infoEl     = widget.querySelector('.ledit-info');
        const statusEl   = widget.querySelector('.ledit-status');
        const profInput  = widget.querySelector('.ledit-prof');
        const yearInput  = widget.querySelector('.ledit-year');
        const sortOpts   = widget.querySelectorAll('.ledit-sort-opt');
        const docBtns    = widget.querySelectorAll('.ledit-doc-card');
        const helpBtn    = widget.querySelector('.ledit-help-btn');
        const helpPopup  = widget.querySelector('.ledit-help-popup');
        const themeBtn   = widget.querySelector('.ledit-theme-btn');
        const themePopup = widget.querySelector('.ledit-theme-popup');
        const wfMin      = widget.querySelector('[data-role="wf-min"]');
        const wfMax      = widget.querySelector('[data-role="wf-max"]');
        const wfClose    = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        function leditCollapse() {
            if (_isMax) toggleMax();   // sortir d'abord du plein écran
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.leditW) || LE_DEFAULT_W;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.leditH) || LE_DEFAULT_H;
            widget.dataset.leditW = savedW;
            widget.dataset.leditH = savedH;

            // Sauvegarder la position ORIGINALE avant de déplacer le widget
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leditSavedLeft = widget.offsetLeft;
            widget.dataset.leditSavedTop  = widget.offsetTop;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            leditApplyCollapsedLook(widget);
            if (typeof saveBoard === 'function') saveBoard();
        }

        function leditExpand() {
            const savedW    = parseFloat(widget.dataset.leditW) || LE_DEFAULT_W;
            const savedH    = parseFloat(widget.dataset.leditH) || LE_DEFAULT_H;
            const savedLeft = parseFloat(widget.dataset.leditSavedLeft);
            const savedTop  = parseFloat(widget.dataset.leditSavedTop);

            widget.querySelectorAll('.ledit-mini-bar').forEach(el => el.remove());

            // Réinitialiser tous les styles inline du widget
            widget.removeAttribute('style');
            widget.style.left = (!isNaN(savedLeft) ? savedLeft : widget.offsetLeft) + 'px';
            widget.style.top  = (!isNaN(savedTop)  ? savedTop  : widget.offsetTop)  + 'px';

            const wc = widget.querySelector('.widget-content');
            if (wc) wc.removeAttribute('style');

            widget.dataset.collapsed = '0';

            outer.style.display = '';
            outer.style.width   = savedW + 'px';
            outer.style.height  = savedH + 'px';

            // Réinitialiser (réinjecte le HTML interne et remet les écouteurs)
            initListeEditionWidget(widget);

            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        widget._leditExpand = leditExpand;

        function toggleMax() {
            _isMax = !_isMax;
            const inner = widget.querySelector('.ledit-inner');
            widget.classList.toggle('wf-max', _isMax);
            if (_isMax) {
                inner.style.position     = 'fixed';
                inner.style.inset        = '0';
                inner.style.width        = '100%';
                inner.style.height       = '100%';
                inner.style.zIndex       = '9999';
                inner.style.borderRadius = '0';
            } else {
                inner.style.position     = '';
                inner.style.inset        = '';
                inner.style.width        = '';
                inner.style.height       = '';
                inner.style.zIndex       = '';
                inner.style.borderRadius = '';
            }
        }

        if (wfMin) {
            wfMin.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            wfMin.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); leditCollapse(); });
        }
        // Plein écran (bouton vert) — utilisé aussi à l'ouverture sur téléphone
        widget._wfSetMax = (on) => { if (!!on !== _isMax) toggleMax(); };
        if (wfMax) wfMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMax(); });
        // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
        // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
        {
            const _el = widget.querySelector('.ledit-inner');
            const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
            if (_el) {
                _el.addEventListener('touchstart',  stopInMax, { passive: true });
                _el.addEventListener('pointerdown', stopInMax);
                _el.addEventListener('mousedown',   stopInMax);
            }
        }

        if (wfClose) {
            wfClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }
        // Échap = quitter le plein écran
        const onEscape = (e) => { if (e.key === 'Escape' && _isMax) toggleMax(); };
        outer.addEventListener('keydown', onEscape);
        cleanups.push(() => outer.removeEventListener('keydown', onEscape));

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
        document.addEventListener('click', closePanels);
        cleanups.push(() => document.removeEventListener('click', closePanels));

        // ── Couleur du cadre (mémorisée dans le tableau) ──────────────────
        function applyTheme(id) {
            if (!LE_THEMES[id]) id = LE_DEFAULT_THEME;
            widget.dataset.leditTheme = id;
            outer.style.setProperty('--le-bg', LE_THEMES[id].bg);
            outer.style.setProperty('--le-op', LE_THEMES[id].op);
            widget.querySelectorAll('.ledit-swatch').forEach(s =>
                s.classList.toggle('is-on', s.dataset.theme === id));
        }
        widget.querySelectorAll('.ledit-swatch').forEach(s => {
            s.addEventListener('click', (e) => {
                e.stopPropagation();
                applyTheme(s.dataset.theme);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });
        applyTheme(widget.dataset.leditTheme || LE_DEFAULT_THEME);

        // ── Poignée de redimensionnement custom ───────────────────────────
        function setupResize() {
            if (widget.querySelector('.custom-resize-handle')) return;
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

                function onMove(ev) {
                    ev.preventDefault();
                    outer.style.width  = Math.max(LE_MIN_W, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(LE_MIN_H, startH + ev.clientY - startY) + 'px';
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

        function setupSizeObserver() {
            if (!window.ResizeObserver) return;
            const ro = new ResizeObserver(() => {
                // Ne pas écraser les dimensions sauvegardées si le widget est réduit
                // ni en plein écran téléphone (sinon il garderait la taille du téléphone)
                if (widget.dataset.collapsed !== '1' && !widget.classList.contains('phone-fs')) {
                    if (outer.offsetWidth  > 0) widget.dataset.leditW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.leditH = outer.offsetHeight;
                }
            });
            ro.observe(outer);
            cleanups.push(() => ro.disconnect());
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
            cleanups.push(() => guard.disconnect());
        }

        setupResize();
        setupSizeObserver();

        // ── Modules requis (widget-liste-de-classe.js) ────────────────────
        if (!CL || !CE) {
            bodyEl.innerHTML = '<div class="ledit-missing">⚠️ Le module « Liste de classe » est introuvable.<br>' +
                'Vérifiez que <b>widget-liste-de-classe.js</b> est bien chargé dans la page.</div>';
            return;
        }

        // Au moins une classe (comme le widget Liste de classe)
        if (!CL.getClasses().length) CL.createClass('Ma classe', widget);

        // ── Affichage ─────────────────────────────────────────────────────
        function activeClass() { return CL.getClass(CL.getActiveId()); }

        function editFlash(msg, cls) {
            statusEl.textContent = msg;
            statusEl.className = 'ledit-status' + (cls ? ' ' + cls : '');
        }

        function renderTabs() {
            tabsEl.innerHTML = '';
            const activeId = CL.getActiveId();
            CL.getClasses().forEach(c => {
                const tab = document.createElement('button');
                tab.className   = 'ledit-tab' + (c.id === activeId ? ' active' : '');
                tab.textContent = c.name + ' (' + c.count + ')';
                const prof = CE.getProf(c.id);
                tab.title       = c.name + (prof ? ' — ' + prof : '');
                tab.addEventListener('click', () => { CL.setActive(c.id, widget); refreshAll(); });
                tabsEl.appendChild(tab);
            });
        }

        function renderSortMode() {
            const mode = CL.getSortMode(CL.getActiveId());
            sortOpts.forEach(b => b.classList.toggle('active', b.dataset.sort === mode));
        }

        function renderInfo() {
            const cls = activeClass();
            if (!cls) { infoEl.textContent = ''; return; }
            const n  = cls.students.length;
            const lv = cls.levels || [];
            infoEl.textContent = cls.name + ' · ' + n + ' élève' + (n > 1 ? 's' : '') + (lv.length >= 2 ? ' · ' + lv.join(' / ') : '');
            // Enseignant de la classe active (sans écraser une saisie en cours)
            if (document.activeElement !== profInput) profInput.value = CE.getProf(cls.id);
        }

        function refreshAll() {
            renderTabs();
            renderSortMode();
            renderInfo();
        }

        // ── Enseignant / année scolaire ───────────────────────────────────
        profInput.value = CE.getProf(CL.getActiveId());
        yearInput.value = CE.getYear();
        profInput.addEventListener('change', () => {
            const cls = activeClass(); if (!cls) return;
            CE.setProf(profInput.value, cls.id);
            editFlash('✓ Enseignant de « ' + cls.name + ' » enregistré', 'ok');
        });
        yearInput.addEventListener('change', () => { CE.setYear(yearInput.value); yearInput.value = CE.getYear(); });

        // ── Tri Prénom / Nom ──────────────────────────────────────────────
        sortOpts.forEach(btn => btn.addEventListener('click', () => {
            const cls = activeClass(); if (!cls) return;
            CL.setSortMode(cls.id, btn.dataset.sort, widget);
            refreshAll();
            editFlash('✓ Tri par ' + (btn.dataset.sort === 'nom' ? 'nom' : 'prénom'), 'ok');
        }));

        // ── Génération des PDF ────────────────────────────────────────────
        let docBusy = false;
        docBtns.forEach(btn => btn.addEventListener('click', async () => {
            if (docBusy) return;
            const cls = activeClass(); if (!cls) return;
            CE.setProf(profInput.value, cls.id);
            CE.setYear(yearInput.value);
            docBusy = true;
            docBtns.forEach(b => b.disabled = true);
            editFlash('⏳ Génération en cours…');
            try {
                const file = await CE.generate(btn.dataset.doc, cls.id);
                editFlash('✓ ' + file, 'ok');
            } catch (err) {
                editFlash(err && err.empty ? 'La liste est vide !' : ((err && err.message) || 'Erreur lors de la génération.'), 'err');
                console.warn('ClasseEdition', err);
            } finally {
                docBusy = false;
                docBtns.forEach(b => b.disabled = false);
            }
        }));

        // ── Synchronisation avec le widget Liste de classe ────────────────
        const off = CL.onChange((source) => {
            if (!document.contains(widget)) { off(); return; }
            if (source === widget) return;
            refreshAll();
        });
        cleanups.push(off);

        // ── Rendu initial ─────────────────────────────────────────────────
        refreshAll();
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createListeEditionWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 120, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = LE_TYPE;
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
            <div class="ledit-outer">${leditInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        initListeEditionWidget(widget);
        // Sur téléphone : ouverture directe en plein écran (bouton vert)
        if (_wfIsPhoneLaunch() && widget._wfSetMax) widget._wfSetMax(true);
        saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK buildBoardState — inclure dimensions + état réduit dans le JSON
    // (les élèves/classes sont dans le stockage partagé de Liste de classe)
    // =========================================================================
    (function patchBuildBoardState() {
        function doPatch() {
            const _orig = window.buildBoardState;
            if (typeof _orig !== 'function') return;
            window.buildBoardState = function () {
                const state = _orig.apply(this, arguments);
                const curW  = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                document.querySelectorAll('.widget[data-type="' + LE_TYPE + '"]').forEach(widget => {
                    const outer     = widget.querySelector('.ledit-outer');
                    const collapsed = widget.dataset.collapsed === '1';
                    if (!outer) return;

                    // Quand réduit, leftPercent/topPercent = position d'ORIGINE (sauvée avant collapse)
                    if (collapsed) {
                        const origLeft = parseFloat(widget.dataset.leditSavedLeft);
                        const origTop  = parseFloat(widget.dataset.leditSavedTop);
                        if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                        if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                    }

                    const match = (state.widgets || []).find(w => w.type === LE_TYPE &&
                        Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                    );
                    if (match) {
                        const w = parseFloat(widget.dataset.leditW) || outer.offsetWidth;
                        const h = parseFloat(widget.dataset.leditH) || outer.offsetHeight;
                        if (w > 0) match.leditW = w;
                        if (h > 0) match.leditH = h;
                        match.widthPercent    = 0;
                        match.contentHPercent = 0;
                        if (collapsed) {
                            match.leftPercent = parseFloat(widget.dataset.leftPercent);
                            match.topPercent  = parseFloat(widget.dataset.topPercent);
                        }
                        match.leditCollapsed = collapsed;
                        if (widget.dataset.leditSavedLeft) match.leditSavedLeft = widget.dataset.leditSavedLeft;
                        if (widget.dataset.leditSavedTop)  match.leditSavedTop  = widget.dataset.leditSavedTop;
                        if (widget.dataset.leditTheme)     match.leditTheme     = widget.dataset.leditTheme;
                    }
                });
                return state;
            };
        }
        if (typeof window.buildBoardState === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestore() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                let savedList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === LE_TYPE) savedList.push(w); });
                } catch (e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="' + LE_TYPE + '"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.ledit-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'ledit-outer';
                            widget.appendChild(outer);
                        }
                        // Repartir du nouveau gabarit (les anciennes sauvegardes
                        // contiennent l'ancien graphisme)
                        if (!outer.querySelector('.ledit-tools')) {
                            outer.innerHTML = leditInnerHTML();
                        }

                        // Correspondance par index d'ordre
                        const saved = savedList[idx];

                        if (saved) {
                            if (saved.leditSavedLeft) widget.dataset.leditSavedLeft = saved.leditSavedLeft;
                            if (saved.leditSavedTop)  widget.dataset.leditSavedTop  = saved.leditSavedTop;
                            if (saved.leditTheme)     widget.dataset.leditTheme     = saved.leditTheme;
                            const w = saved.leditW || parseFloat(widget.dataset.leditW);
                            const h = saved.leditH || parseFloat(widget.dataset.leditH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.leditW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.leditH = h; }

                            if (saved.leditCollapsed) {
                                const origLeft = parseFloat(saved.leditSavedLeft);
                                const origTop  = parseFloat(saved.leditSavedTop);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initListeEditionWidget(widget);

                        // Appliquer l'état réduit APRÈS init
                        if (saved && saved.leditCollapsed) leditApplyCollapsedLook(widget);
                    });
                }, 150);
            };
        }

        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK createWidget — intercepter type 'liste-edition'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === LE_TYPE) return window.createListeEditionWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
