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

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent ── */
    .widget[data-type="liste-edition"] {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="liste-edition"] .ledit-outer {
        position: relative;
        width: 640px;
        height: 460px;
        min-width: 300px;
        min-height: 240px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
    }
    .widget[data-type="liste-edition"] .ledit-outer::-webkit-resizer { display: none; }

    /* ── Container intérieur ── */
    .ledit-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border: 1.5px solid #d1d5db;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(0,0,0,0.12);
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #374151;
        user-select: none;
        box-sizing: border-box;
        position: relative;
    }

    /* ── Header ── */
    .ledit-header {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
        cursor: move;
    }
    .ledit-header-title {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.3px;
        flex-grow: 1;
        color: #374151;
        pointer-events: none;
    }

    /* ── Onglets classes ── */
    .ledit-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 6px 10px;
        align-items: center;
        flex-shrink: 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .ledit-tab {
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid #e0e0e0;
        transition: all .15s;
        font-family: inherit;
        background: #f0f0f0;
        color: #999;
        max-width: 160px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .ledit-tab:hover { border-color: #9ca3af; }
    .ledit-tab.active { background: #6366f1; border-color: #6366f1; color: #fff; }

    /* ── Panneau Édition ── */
    .ledit-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        scrollbar-width: thin;
        scrollbar-color: #d1d5db transparent;
    }
    .ledit-info { font-size: 11px; font-weight: 700; color: #6b7280; }
    .ledit-fields { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: flex-end; }
    .ledit-field {
        display: flex; flex-direction: column; gap: 3px;
        font-size: 9px; font-weight: 800; text-transform: uppercase;
        color: #9ca3af; letter-spacing: .3px;
    }
    .ledit-input {
        padding: 7px 10px;
        border-radius: 8px;
        border: 1.5px solid #d1d5db;
        font-size: 12px;
        font-family: inherit;
        font-weight: 600;
        color: #374151;
        user-select: text;
        transition: border-color .15s;
        width: 190px;
        box-sizing: border-box;
    }
    .ledit-input:focus { outline: none; border-color: #6366f1; }
    .ledit-input.ledit-year { width: 110px; }

    /* ── Sélecteur de tri ── */
    .ledit-sortgroup {
        display: inline-flex;
        align-items: center;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #f3f4f6;
    }
    .ledit-sort-label {
        padding: 0 8px;
        font-size: 10px;
        font-weight: 700;
        color: #4b5563;
        white-space: nowrap;
    }
    .ledit-sort-opt {
        padding: 7px 10px;
        border: none;
        border-left: 1px solid #e5e7eb;
        background: transparent;
        color: #6b7280;
        font-size: 10px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: background .15s, color .15s;
    }
    .ledit-sort-opt:hover { background: #e5e7eb; }
    .ledit-sort-opt.active { background: #6366f1; color: #fff; }

    /* ── Cartes documents ── */
    .ledit-doc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 10px;
    }
    .ledit-doc-card {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: #374151;
        transition: box-shadow .15s, transform .1s, border-color .15s;
    }
    .ledit-doc-card:hover { border-color: var(--c); box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .ledit-doc-card:active { transform: scale(0.98); }
    .ledit-doc-card:disabled { opacity: .55; cursor: wait; }
    .ledit-doc-ico {
        width: 38px; height: 38px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
        background: var(--t);
        transition: background .15s;
    }
    .ledit-doc-card:hover .ledit-doc-ico { background: var(--c); }
    .ledit-doc-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .ledit-doc-txt b { font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .ledit-doc-txt small { font-size: 10px; color: #6b7280; font-weight: 500; }
    .ledit-status { font-size: 11px; font-weight: 600; color: #9ca3af; min-height: 16px; word-break: break-all; }
    .ledit-status.ok  { color: #059669; }
    .ledit-status.err { color: #dc2626; }

    /* ── Message (module absent) ── */
    .ledit-missing {
        text-align: center;
        color: #dc2626;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.6;
        padding: 30px 10px;
    }

    /* ── Popup aide ── */
    .ledit-help-popup {
        display: none;
        position: absolute;
        top: 42px;
        right: 10px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 12px 14px;
        width: 270px;
        font-size: 11px;
        color: #4b5563;
        z-index: 10;
        line-height: 1.6;
    }
    .ledit-help-popup.show { display: block; }
    .ledit-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; font-weight: 800; }
    `;

    if (!document.getElementById('ledit-widget-style')) {
        const s = document.createElement('style');
        s.id = 'ledit-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
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

    // ── HTML interne partagé (création + restauration) ────────────────────
    function leditInnerHTML() {
        const CE = window.ClasseEdition;
        const docCards = (CE ? CE.KINDS : []).map(k => `
                <button class="ledit-doc-card" data-doc="${k.id}" style="--c:${k.color};--t:${k.tint};">
                    <span class="ledit-doc-ico">${k.icon}</span>
                    <span class="ledit-doc-txt"><b>${k.title}</b><small>${k.desc}</small></span>
                </button>`).join('');
        return `
        <div class="ledit-inner">
            <div class="ledit-header">
                <div class="ledit-header-title">${LE_LABEL}</div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="ledit-help-btn" title="Aide" onmousedown="event.stopPropagation()" style="width:22px;height:22px;border-radius:50%;border:1px solid #bbb;background:#f5f5f5;color:#666;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;font-family:inherit;">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                </div>
            </div>
            <div class="ledit-help-popup">
                <h4>💡 Comment ça marche</h4>
                <p>• Choisissez la <b>classe</b> avec les onglets (la classe active est la même que dans le widget « Liste de classe »).<br>
                • Indiquez l'<b>enseignant</b> et l'<b>année scolaire</b> : ils figurent sur les documents.<br>
                • Le tri <b>Prénom / Nom</b> est appliqué aux documents.<br>
                • Cliquez sur un document pour le générer en <b>PDF</b> :<br>
                &nbsp;&nbsp;– liste de classe (tableau A4)<br>
                &nbsp;&nbsp;– feuille de pointage (15 cases)<br>
                &nbsp;&nbsp;– grandes étiquettes (8 par page)<br>
                &nbsp;&nbsp;– petites étiquettes (27 par page)<br>
                &nbsp;&nbsp;– fiches de suivi (2 fiches A5 par page)<br>
                • Les élèves se saisissent dans le widget <b>Liste de classe</b>.<br>
                • Connexion Internet requise au premier usage (bibliothèque PDF).</p>
            </div>
            <div class="ledit-tabs"></div>
            <div class="ledit-body">
                <div class="ledit-info"></div>
                <div class="ledit-fields">
                    <label class="ledit-field">Enseignant
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

        // ── Header draggable (une seule fois) ─────────────────────────────
        const header = widget.querySelector('.ledit-header');
        if (header && !header._dragInit) {
            header._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            header.addEventListener('mousedown',  onHeaderDown);
            header.addEventListener('touchstart', onHeaderDown, { passive: false });
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
        const wfMin      = widget.querySelector('[data-role="wf-min"]');
        const wfMax      = widget.querySelector('[data-role="wf-max"]');
        const wfClose    = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        function leditCollapse() {
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
        if (wfMax) wfMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMax(); });
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

        // ── Aide popup ────────────────────────────────────────────────────
        if (helpBtn && helpPopup) {
            helpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                helpPopup.classList.toggle('show');
            });
            helpBtn.addEventListener('mouseover', () => { helpBtn.style.background = '#e0e0e0'; helpBtn.style.color = '#333'; });
            helpBtn.addEventListener('mouseout',  () => { helpBtn.style.background = '#f5f5f5'; helpBtn.style.color = '#666'; });
            const closeHelp = () => helpPopup.classList.remove('show');
            document.addEventListener('click', closeHelp);
            cleanups.push(() => document.removeEventListener('click', closeHelp));
        }

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
                if (widget.dataset.collapsed !== '1') {
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
                tab.title       = c.name;
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
        }

        function refreshAll() {
            renderTabs();
            renderSortMode();
            renderInfo();
        }

        // ── Enseignant / année scolaire ───────────────────────────────────
        profInput.value = CE.getProf();
        yearInput.value = CE.getYear();
        profInput.addEventListener('change', () => CE.setProf(profInput.value));
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
            CE.setProf(profInput.value);
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
                        if (!outer.querySelector('.ledit-inner')) {
                            outer.innerHTML = leditInnerHTML();
                        }

                        // Correspondance par index d'ordre
                        const saved = savedList[idx];

                        if (saved) {
                            if (saved.leditSavedLeft) widget.dataset.leditSavedLeft = saved.leditSavedLeft;
                            if (saved.leditSavedTop)  widget.dataset.leditSavedTop  = saved.leditSavedTop;
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
