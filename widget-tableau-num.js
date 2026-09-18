// ══════════════════════════════════════════════════════════════════
//  widget-tableau-num.js  —  Tableau de numération décimale
// ══════════════════════════════════════════════════════════════════

function createTableauNumWidget() {

    // ── Créer le widget conteneur standard ──────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'tableau-num';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 80, y: 80 };
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left = '100px';
    widget.style.top  = p.y + 'px';

    widget.addEventListener('mousedown', () => {
        if (typeof isDrawMode   !== 'undefined' && isDrawMode)   return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true' && typeof bringToFront === 'function') bringToFront(widget);
    });

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle"  onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle"   onclick="togglePin(this.closest('.widget,.shape-widget'))"    title="Épingler">📌</div>
            <div class="widget-back-handle"  onclick="sendToBack(this.closest('.widget,.shape-widget'))"   title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
        <div class="widget-content">
            <div class="editor-container tnum-editor-container">
                <div class="tnum-container">

                  <div class="tnum-header">
                    <span class="tnum-title">🔢 Tableau de numération</span>
                    <button class="tnum-settings-toggle tnum-settings-open" title="Paramètres">⚙️</button>
                    <div class="wf-btns" style="margin-left:auto">
                      <button class="tnum-help-btn" title="Aide">?</button>
                      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                    </div>
                  </div>

                  <div class="tnum-help-popup">
                    <h4>💡 Tableau de numération</h4>
                    <div class="tnum-help-section">
                      <strong>⚙️ Colonnes</strong><br>
                      Activez ou désactivez les classes (Milliards, Millions, Milliers) et la partie décimale via les cases à cocher.
                    </div>
                    <div class="tnum-help-section">
                      <strong>✏️ Saisie</strong><br>
                      Cliquez sur une case et tapez un chiffre (0–9), ou utilisez les boutons + et − pour augmenter / diminuer.
                    </div>
                    <div class="tnum-help-section">
                      <strong>🔢 Mode Libre / Nombre</strong><br>
                      <em>Libre</em> : chaque case est indépendante.<br>
                      <em>Nombre</em> : les retenues se propagent automatiquement (9+1 → 10, etc.).
                    </div>
                    <div class="tnum-help-section">
                      <strong>➕ Lignes</strong><br>
                      Ajoutez ou supprimez des lignes avec les boutons ＋ et × en bas du tableau.
                    </div>
                  </div>

                  <div class="tnum-settings-bar">
                    <label class="tnum-toggle-label" title="Classe des milliards">
                      <input type="checkbox" class="tnum-chk" data-col-group="milliards"> Milliards
                    </label>
                    <label class="tnum-toggle-label" title="Classe des millions">
                      <input type="checkbox" class="tnum-chk" data-col-group="millions"> Millions
                    </label>
                    <label class="tnum-toggle-label" title="Classe des milliers">
                      <input type="checkbox" class="tnum-chk" data-col-group="milliers" checked> Milliers
                    </label>
                    <label class="tnum-toggle-label" title="Classe des unités — toujours visible">
                      <input type="checkbox" class="tnum-chk" data-col-group="unites" checked disabled> Unités
                    </label>
                    <span class="tnum-sep-v"></span>
                    <label class="tnum-toggle-label" title="Partie décimale (dixièmes)">
                      <input type="checkbox" class="tnum-chk" data-col-group="decimales"> Décimales
                    </label>
                    <label class="tnum-toggle-label tnum-dec-sub" title="Centièmes">
                      <input type="checkbox" class="tnum-chk" data-col-group="centiemes" checked> Centièmes
                    </label>
                    <label class="tnum-toggle-label tnum-dec-sub" title="Millièmes">
                      <input type="checkbox" class="tnum-chk" data-col-group="milliemes" checked> Millièmes
                    </label>
                    <span class="tnum-sep-v"></span>
                    <div class="tnum-mode-toggle" title="Changer de mode">
                      <button class="tnum-mode-btn tnum-mode-active" data-mode="libre"   title="Mode libre : chaque case est indépendante">Libre</button>
                      <button class="tnum-mode-btn"                  data-mode="nombre"  title="Mode nombre : +1 propage comme un vrai nombre">Nombre</button>
                    </div>
                  </div>

                  <div class="tnum-scroll-wrap">
                    <table class="tnum-table">
                      <thead class="tnum-thead"></thead>
                      <tbody class="tnum-tbody"></tbody>
                    </table>
                  </div>

                  <div class="tnum-footer">
                    <button class="tnum-add-row-btn" title="Ajouter une ligne">＋</button>
                    <button class="tnum-reset-btn" title="Effacer toutes les cases">🗑️</button>
                  </div>

                </div>
            </div>
        </div>`;

    const board = document.getElementById('board');
    board.appendChild(widget);
    if (typeof bringToFront            === 'function') bringToFront(widget);
    if (typeof makeDraggable           === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate     === 'function') makeDraggableRotate(widget);
    if (typeof makeResizableByHandle   === 'function') makeResizableByHandle(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    // ── Header comme poignée de déplacement ───────────────────────
    const tnumHeader = widget.querySelector('.tnum-header');
    if (tnumHeader && typeof startWidgetDrag === 'function') {
        tnumHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            widget.focus();
            startWidgetDrag(e, widget);
        });
        tnumHeader.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Scaling proportionnel via ResizeObserver ───────────────────
    _initTableauNumResize(widget);

    // ── Init comportement interne ──────────────────────────────────
    _initTableauNumWidget(widget);

    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Injecter CSS wf-btns si pas encore présent ────────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; padding:0; font-size:0; flex-shrink:0; }
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

    // ── Police MarelleBaton pour les chiffres du tableau ──────────
    if (!document.getElementById('tnum-font-style')) {
        const fs = document.createElement('style');
        fs.id = 'tnum-font-style';
        fs.textContent = `
    @font-face {
        font-family: 'MarelleBaton';
        src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    .tnum-digit {
        font-family: 'MarelleBaton', sans-serif !important;
    }
        `;
        document.head.appendChild(fs);
    }

    // ── Boutons wf (min / max / close) ────────────────────────────
    const ec      = widget.querySelector('.editor-container');
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    let _tnumIsMax = false;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_tnumIsMax) wfMax.click();
            if (typeof window._wfMiniBarCollapse === 'function') {
                window._wfMiniBarCollapse(widget, '🔢 Tableau de numération');
            }
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _tnumIsMax = !_tnumIsMax;
            const tnumCont = widget.querySelector('.tnum-container');
            if (tnumCont) {
                if (_tnumIsMax) {
                    tnumCont.dataset.tnumSavedW = ec ? ec.style.width : '';
                    tnumCont.classList.add('tnum-fullboard');
                } else {
                    tnumCont.classList.remove('tnum-fullboard');
                    if (ec && tnumCont.dataset.tnumSavedW) ec.style.width = tnumCont.dataset.tnumSavedW;
                }
                // Forcer recalcul du scaling après changement de mode
                requestAnimationFrame(() => { if (widget._tnumApplyScale) widget._tnumApplyScale(); });
            }
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

    // ── Toggle paramètres ─────────────────────────────────────────
    const settingsToggle = widget.querySelector('.tnum-settings-toggle');
    const settingsBar    = widget.querySelector('.tnum-settings-bar');
    if (settingsToggle && settingsBar) {
        settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const hidden = settingsBar.classList.toggle('tnum-settings-hidden');
            settingsToggle.classList.toggle('tnum-settings-open', !hidden);
        });
    }

    // ── Bouton aide ───────────────────────────────────────────────
    const helpBtn   = widget.querySelector('.tnum-help-btn');
    const helpPopup = widget.querySelector('.tnum-help-popup');
    if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('tnum-help-show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('tnum-help-show'));
    }

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();

    return widget;
}

// ── Scaling proportionnel ──────────────────────────────────────────
// Largeur de référence 600 px → font-size 14 px
// Tout le CSS du widget est en em, donc tout scale automatiquement.
const TNUM_REF_W   = 900;
const TNUM_BASE_FS = 14;

function _initTableauNumResize(widget) {
    const ec       = widget.querySelector('.editor-container');
    const tnumCont = widget.querySelector('.tnum-container');
    if (!ec || typeof ResizeObserver === 'undefined') return;

    function _applyScale() {
        // En mode plein écran, .tnum-container est fixed et occupe tout l'écran ;
        // son offsetWidth reflète la vraie largeur affichée. Sinon on utilise ec.
        const isFullboard = tnumCont && tnumCont.classList.contains('tnum-fullboard');
        const w = isFullboard
            ? (tnumCont.offsetWidth || window.innerWidth)
            : ec.offsetWidth;
        if (!w) return;
        const fs = Math.max(6, Math.round((w / TNUM_REF_W) * TNUM_BASE_FS * 10) / 10);
        ec.style.fontSize = fs + 'px';
    }

    const ro = new ResizeObserver(_applyScale);
    ro.observe(ec);
    if (tnumCont) ro.observe(tnumCont);
    requestAnimationFrame(_applyScale);

    // Exposer pour pouvoir forcer un recalcul après toggle fullboard
    widget._tnumApplyScale = _applyScale;
}

// ── Définition des colonnes ────────────────────────────────────────
const TNUM_COLS = [
    // Milliards
    { id: 'Cmds', label: 'centaines de milliards', abbr: 'c', group: 'milliards', cls: 'tnum-milliards', color: '#7c3aed' },
    { id: 'Dmds', label: 'dizaines de milliards', abbr: 'd', group: 'milliards', cls: 'tnum-milliards', color: '#7c3aed' },
    { id: 'Mmds', label: 'unités de milliards',        abbr: 'u', group: 'milliards', cls: 'tnum-milliards', color: '#7c3aed' },
    // Millions
    { id: 'CM',   label: 'centaines de millions',  abbr: 'c', group: 'millions',  cls: 'tnum-millions',  color: '#0891b2' },
    { id: 'DM',   label: 'dizaines de millions',  abbr: 'd', group: 'millions',  cls: 'tnum-millions',  color: '#0891b2' },
    { id: 'M',    label: 'unités de millions',          abbr: 'u', group: 'millions',  cls: 'tnum-millions',  color: '#0891b2' },
    // Milliers
    { id: 'Cde',  label: 'centaines de mille',  abbr: 'c', group: 'milliers',  cls: 'tnum-milliers',  color: '#059669' },
    { id: 'Dde',  label: 'dizaine de mille',  abbr: 'd', group: 'milliers',  cls: 'tnum-milliers',  color: '#059669' },
    { id: 'mde',  label: 'unités de mille',          abbr: 'u', group: 'milliers',  cls: 'tnum-milliers',  color: '#059669' },
    // Unités
    { id: 'C',    label: 'centaines',        abbr: 'c', group: 'unites',    cls: 'tnum-centaines', color: '#e07b2a' },
    { id: 'D',    label: 'dizaines',          abbr: 'd', group: 'unites',    cls: 'tnum-dizaines',  color: '#e07b2a' },
    { id: 'U',    label: 'unités',            abbr: 'u', group: 'unites',    cls: 'tnum-unites',    color: '#e07b2a' },
    // Décimales
    { id: 'dix',  label: 'dixièmes',          abbr: '1/10',   group: 'decimales',  cls: 'tnum-dixiemes',  color: '#be185d', decimal: true },
    { id: 'cen',  label: 'centièmes',         abbr: '1/100',  group: 'centiemes',  cls: 'tnum-centiemes', color: '#be185d', decimal: true },
    { id: 'mil',  label: 'millièmes',         abbr: '1/1000', group: 'milliemes',  cls: 'tnum-milliemes', color: '#be185d', decimal: true },
];

const TNUM_CLASS_HEADERS = [
    { label: 'classe des milliards', labelCourt: 'milliards', group: 'milliards' },
    { label: 'classe des millions',  labelCourt: 'millions',  group: 'millions'  },
    { label: 'classe des milliers',  labelCourt: 'milliers',  group: 'milliers'  },
    { label: 'classe des unités',    labelCourt: 'unités',    group: 'unites'    },
    { label: 'partie décimale',       labelCourt: 'décimales', group: 'decimales' },
];

// ── Init logique du widget ─────────────────────────────────────────
function _initTableauNumWidget(widget) {
    const container = widget.querySelector('.tnum-container');
    if (!container) return;

    const state = {
        groups: { milliards: false, millions: false, milliers: true, unites: true, decimales: false, centiemes: true, milliemes: true },
        mode:   'libre',   // 'libre' | 'nombre'
        rows:   [ { id: _tnumRowId(), cells: {} } ]
    };

    // ── API sauvegarde/restauration ────────────────────────────────
    widget._tnumGetData = () => ({
        groups: { ...state.groups },
        mode:   state.mode,
        rows:   state.rows.map(r => ({ id: r.id, cells: { ...r.cells } }))
    });

    widget._tnumSetData = (data) => {
        if (!data) return;
        if (data.groups) Object.assign(state.groups, data.groups);
        if (data.mode)   state.mode = data.mode;
        if (data.rows)   state.rows = data.rows.map(r => ({ id: r.id || _tnumRowId(), cells: { ...r.cells } }));
        _syncCheckboxes();
        _syncModeBtns();
        _renderAll();
    };

    function _syncCheckboxes() {
        container.querySelectorAll('.tnum-chk').forEach(chk => {
            const g = chk.dataset.colGroup;
            if (g === 'unites') return;
            chk.checked = !!state.groups[g];
        });
        // Afficher/masquer les sous-options décimales selon l'état de decimales
        container.querySelectorAll('.tnum-dec-sub').forEach(el => {
            el.style.display = state.groups['decimales'] ? 'flex' : 'none';
        });
    }

    function _syncModeBtns() {
        container.querySelectorAll('.tnum-mode-btn').forEach(btn => {
            btn.classList.toggle('tnum-mode-active', btn.dataset.mode === state.mode);
        });
    }

    function _ensureZeroUnite(row) {
        _ensureZeroUniteForRow(row, _visibleCols());
    }

    function _refreshRowInputs(tr, row) {
        _refreshRowInputsDOM(tr, row);
    }

    function _visibleCols() {
        return TNUM_COLS.filter(c => {
            // Les sous-groupes décimaux ne sont visibles que si decimales est actif
            if (c.group === 'centiemes' || c.group === 'milliemes') {
                return state.groups['decimales'] && state.groups[c.group] !== false;
            }
            return state.groups[c.group] !== false;
        });
    }

    function _renderAll() { _renderHead(); _renderBody(); }

    // ── En-têtes ──────────────────────────────────────────────────
    function _renderHead() {
        const thead = container.querySelector('.tnum-thead');
        if (!thead) return;
        const vis = _visibleCols();

        // Nombre de classes actives → label court si ≥ 3
        const activeGroups = TNUM_CLASS_HEADERS.filter(ch =>
            vis.some(c => ch.group === 'decimales' ? c.decimal : c.group === ch.group)
        ).length;
        const useShort = activeGroups >= 3;

        let r1 = '<tr class="tnum-head-classes"><th class="tnum-head-actions" rowspan="2"></th>';
        TNUM_CLASS_HEADERS.forEach(ch => {
            // Pour "partie décimale", compter toutes les colonnes décimales visibles
            const span = ch.group === 'decimales'
                ? vis.filter(c => c.decimal).length
                : vis.filter(c => c.group === ch.group).length;
            if (!span) return;
            const txt = useShort ? ch.labelCourt : ch.label;
            r1 += `<th class="tnum-head-class tnum-cls-${ch.group}" colspan="${span}" title="${ch.label}">${txt}</th>`;
        });
        r1 += '</tr>';

        let r2 = '<tr class="tnum-head-cols">';
        vis.forEach((col, idx) => {
            const isFirstDec = col.decimal && (idx === 0 || !vis[idx - 1]?.decimal);
            r2 += `<th class="tnum-head-col ${col.cls}${isFirstDec ? ' tnum-virgule-col' : ''}"
                       style="--tnum-col-color:${col.color}" title="${col.label}">${col.abbr}</th>`;
        });
        r2 += '</tr>';

        thead.innerHTML = r1 + r2;
    }

    // ── Corps ──────────────────────────────────────────────────────
    function _renderBody() {
        const tbody = container.querySelector('.tnum-tbody');
        if (!tbody) return;
        const vis = _visibleCols();
        tbody.innerHTML = '';

        state.rows.forEach((row, rowIdx) => {
            const tr = document.createElement('tr');
            tr.dataset.rowId = row.id;

            // Bouton supprimer ligne
            const tdAct = document.createElement('td');
            tdAct.className = 'tnum-row-actions';
            const delBtn = document.createElement('button');
            delBtn.className = 'tnum-del-row-btn';
            delBtn.title = 'Supprimer cette ligne';
            delBtn.textContent = '×';
            delBtn.addEventListener('click', () => {
                if (state.rows.length <= 1) return;
                state.rows.splice(rowIdx, 1);
                _renderBody();
                if (typeof snapshotNow === 'function') snapshotNow();
                if (typeof saveBoard   === 'function') saveBoard();
            });
            tdAct.appendChild(delBtn);
            tr.appendChild(tdAct);

            // Cellules chiffres
            vis.forEach((col, colIdx) => {
                const isFirstDec = col.decimal && (colIdx === 0 || !vis[colIdx - 1]?.decimal);
                const td = document.createElement('td');
                td.className = `tnum-cell ${col.cls}${isFirstDec ? ' tnum-virgule-col' : ''}`;
                td.dataset.colId = col.id;
                td.style.setProperty('--tnum-col-color', col.color);

                const val = row.cells[col.id] ?? '';

                const inner   = document.createElement('div');
                inner.className = 'tnum-cell-inner';

                const btnUp   = document.createElement('button');
                btnUp.className = 'tnum-step tnum-step-up';
                btnUp.tabIndex  = -1;
                btnUp.title     = 'Augmenter (+1)';
                btnUp.textContent = '+';

                const input   = document.createElement('input');
                input.className   = 'tnum-digit';
                input.type        = 'text';
                input.inputMode   = 'numeric';
                input.maxLength   = 1;
                input.value       = val;
                input.autocomplete = 'off';

                const btnDown = document.createElement('button');
                btnDown.className = 'tnum-step tnum-step-down';
                btnDown.tabIndex  = -1;
                btnDown.title     = 'Diminuer (-1)';
                btnDown.textContent = '−';

                inner.append(btnUp, input, btnDown);
                td.appendChild(inner);

                // Saisie clavier
                input.addEventListener('input', () => {
                    let v = input.value.replace(/[^0-9]/g, '');
                    if (v.length > 1) v = v.slice(-1);
                    input.value       = v;
                    row.cells[col.id] = v;
                    _ensureZeroUnite(row);
                    // Rafraîchir les autres inputs de la ligne si un 0 a été posé
                    _refreshRowInputs(tr, row);
                    if (typeof saveBoard === 'function') saveBoard();
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp')   { e.preventDefault(); _stepCell(row, col.id, input, +1); }
                    if (e.key === 'ArrowDown') { e.preventDefault(); _stepCell(row, col.id, input, -1); }
                    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
                        e.preventDefault();
                        const next = _siblingInput(tr, input, +1);
                        if (next) next.focus();
                    }
                    if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
                        e.preventDefault();
                        const prev = _siblingInput(tr, input, -1);
                        if (prev) prev.focus();
                    }
                });

                input.addEventListener('focus', () => input.select());

                btnUp.addEventListener('mousedown',   e => e.preventDefault());
                btnDown.addEventListener('mousedown', e => e.preventDefault());
                btnUp.addEventListener('click',   () => { _stepCell(row, col.id, input, +1); if (state.mode !== 'nombre') _focusNoSelect(input); });
                btnDown.addEventListener('click', () => { _stepCell(row, col.id, input, -1); if (state.mode !== 'nombre') _focusNoSelect(input); });

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    function _stepCell(row, colId, input, dir) {
        if (state.mode === 'nombre') {
            _stepWithRetenue(row, colId, dir);
            // Re-render complet de la ligne pour garantir la cohérence
            const tr = input.closest('tr');
            if (tr) {
                const rowId = tr.dataset.rowId;
                _renderBody();
                // Redonner le focus à la même case après re-render
                const newTr = container.querySelector(`tr[data-row-id="${rowId}"]`);
                if (newTr) {
                    const newInput = newTr.querySelector(`td[data-col-id="${colId}"] .tnum-digit`);
                    if (newInput) _focusNoSelect(newInput);
                }
            }
        } else {
            // Mode libre : case isolée, rotation 0↔9
            const cur = parseInt(input.value, 10);
            let next;
            if (isNaN(cur)) { next = dir > 0 ? 1 : 9; }
            else { next = cur + dir; if (next > 9) next = 0; if (next < 0) next = 9; }
            input.value      = next;
            row.cells[colId] = String(next);
            _ensureZeroUnite(row);
            // Rafraîchir si un 0 a été posé ailleurs
            const trEl = input.closest('tr');
            if (trEl) _refreshRowInputs(trEl, row);
        }
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Logique mode Nombre ────────────────────────────────────────
    // Lit toutes les cases comme un entier, applique ±1 sur le rang
    // ciblé, propage les retenues/emprunts en cascade, puis réécrit.
    function _stepWithRetenue(row, colId, dir) {
        const vis     = _visibleCols();
        const allCols = vis;
        const colIdx  = allCols.findIndex(c => c.id === colId);
        if (colIdx === -1) {
            const cur = parseInt(row.cells[colId] ?? '0', 10) || 0;
            let next = cur + dir; if (next > 9) next = 0; if (next < 0) next = 9;
            row.cells[colId] = String(next);
            return;
        }

        // Lire les chiffres (case vide = 0)
        const digits = allCols.map(c => {
            const v = parseInt(row.cells[c.id], 10);
            return isNaN(v) ? 0 : v;
        });

        // Appliquer le pas sur le rang ciblé
        digits[colIdx] += dir;

        // Propagation complète gauche (retenues et emprunts) — sans break prématuré
        for (let i = allCols.length - 1; i > 0; i--) {
            if (digits[i] >= 10) {
                digits[i] -= 10;
                digits[i - 1] += 1;
            } else if (digits[i] < 0) {
                digits[i] += 10;
                digits[i - 1] -= 1;
            }
        }

        // Rang le plus fort : saturation (pas de débordement ni négatif)
        if (digits[0] > 9) digits[0] = 9;
        if (digits[0] < 0) {
            // En dessous de zéro → tout à zéro
            for (let i = 0; i < digits.length; i++) digits[i] = 0;
        }

        // Réécriture avec suppression des zéros de tête
        const isAllZero = digits.every(d => d === 0);
        const entierCols  = allCols.filter(c => !c.decimal);
        const decimalCols = allCols.filter(c =>  c.decimal);
        const entierSum   = entierCols.reduce((s, c) => s + digits[allCols.indexOf(c)], 0);
        const decimalSum  = decimalCols.reduce((s, c) => s + digits[allCols.indexOf(c)], 0);
        // Dernière colonne entière (les Unités)
        const lastEntierIdx = allCols.reduce((last, c, i) => c.decimal ? last : i, -1);

        let leadingZero = true;
        allCols.forEach((c, i) => {
            if (isAllZero) {
                // Nombre nul : 0 sur la dernière colonne entière, vide ailleurs
                const showAt = lastEntierIdx >= 0 ? lastEntierIdx : allCols.length - 1;
                row.cells[c.id] = i === showAt ? '0' : '';
            } else if (entierSum === 0 && decimalSum > 0 && entierCols.length > 0) {
                // Partie entière nulle mais décimales présentes → 0 obligatoire sur dernière colonne entière
                if (!c.decimal) {
                    row.cells[c.id] = i === lastEntierIdx ? '0' : '';
                } else {
                    row.cells[c.id] = String(digits[i]);
                }
            } else {
                if (leadingZero && digits[i] === 0 && !c.decimal) {
                    row.cells[c.id] = '';   // zéro de tête entier → vide
                } else {
                    leadingZero = false;
                    row.cells[c.id] = String(digits[i]);
                }
            }
        });
    }

    function _siblingInput(tr, current, dir) {
        const inputs = Array.from(tr.querySelectorAll('.tnum-digit'));
        const idx = inputs.indexOf(current);
        if (idx === -1) return null;
        return inputs[idx + dir] || null;
    }

    // ── Ajouter une ligne ──────────────────────────────────────────
    const addBtn = container.querySelector('.tnum-add-row-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            state.rows.push({ id: _tnumRowId(), cells: {} });
            _renderBody();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    }

    // ── Réinitialiser ──────────────────────────────────────────────
    const resetBtn = container.querySelector('.tnum-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            state.rows.forEach(row => { row.cells = {}; });
            _renderBody();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    }

    // ── Checkboxes colonnes ────────────────────────────────────────
    // Ordre hiérarchique des classes (du plus petit au plus grand)
    const GROUP_ORDER = ['unites', 'milliers', 'millions', 'milliards'];

    container.querySelectorAll('.tnum-chk').forEach(chk => {
        const g = chk.dataset.colGroup;
        if (g === 'unites') return;
        chk.addEventListener('change', () => {
            if (g === 'decimales') {
                state.groups['decimales'] = chk.checked;
                // Si on désactive les décimales, réinitialiser les sous-groupes
                if (!chk.checked) {
                    state.groups['centiemes'] = true;
                    state.groups['milliemes'] = true;
                }
            } else if (g === 'centiemes') {
                state.groups['centiemes'] = chk.checked;
                // Décocher centiemes → désactiver millièmes aussi
                if (!chk.checked) state.groups['milliemes'] = false;
            } else if (g === 'milliemes') {
                state.groups['milliemes'] = chk.checked;
                // Cocher millièmes → activer centiemes aussi
                if (chk.checked) state.groups['centiemes'] = true;
            } else if (chk.checked) {
                // Activer ce groupe ET tous les groupes inférieurs
                const idx = GROUP_ORDER.indexOf(g);
                for (let i = 0; i <= idx; i++) {
                    state.groups[GROUP_ORDER[i]] = true;
                }
            } else {
                // Désactiver ce groupe ET tous les groupes supérieurs
                const idx = GROUP_ORDER.indexOf(g);
                for (let i = idx; i < GROUP_ORDER.length; i++) {
                    if (GROUP_ORDER[i] !== 'unites') state.groups[GROUP_ORDER[i]] = false;
                }
            }
            _syncCheckboxes();
            _renderAll();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    });

    // ── Boutons de mode Libre / Retenue ────────────────────────────
    container.querySelectorAll('.tnum-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.mode = btn.dataset.mode;
            _syncModeBtns();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    });

    // ── Rendu initial ──────────────────────────────────────────────
    _syncCheckboxes();
    _syncModeBtns();
    _renderAll();
}

// ── Focus sans sélection (après +/-) ──────────────────────────────
function _focusNoSelect(input) {
    input.focus();
    // Déplacer le curseur à la fin sans sélectionner
    const len = input.value.length;
    input.setSelectionRange(len, len);
}

// ── Zéro obligatoire dans les unités si seules les décimales ont des valeurs ──
// Appelé après chaque saisie/step en mode libre.
function _ensureZeroUniteForRow(row, visibleCols) {
    const entierCols  = visibleCols.filter(c => !c.decimal);
    const decimalCols = visibleCols.filter(c =>  c.decimal);
    if (!decimalCols.length || !entierCols.length) return;

    const hasDecimal = decimalCols.some(c => row.cells[c.id] && row.cells[c.id] !== '');
    const hasEntier  = entierCols.some(c  => row.cells[c.id] && row.cells[c.id] !== '');

    if (hasDecimal && !hasEntier) {
        // Poser 0 sur la dernière colonne entière (les Unités)
        const lastEntier = entierCols[entierCols.length - 1];
        row.cells[lastEntier.id] = '0';
    }
}

// ── Rafraîchir les inputs DOM d'une ligne sans re-render complet ──
function _refreshRowInputsDOM(tr, row) {
    tr.querySelectorAll('.tnum-digit').forEach(inp => {
        const cid = inp.closest('td')?.dataset.colId;
        if (cid) inp.value = row.cells[cid] ?? '';
    });
}

// ── ID unique de ligne ─────────────────────────────────────────────
function _tnumRowId() {
    return 'r' + Math.random().toString(36).slice(2, 9);
}
