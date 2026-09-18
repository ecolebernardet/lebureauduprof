// ══════════════════════════════════════════════════════════════════
//  widget-sondage.js  —  Sondage express interactif
// ══════════════════════════════════════════════════════════════════

function createSondageWidget() {

    // ── CSS (injecté une seule fois) ──────────────────────────────
    const _existingStyle = document.getElementById('snd-style');
    if (_existingStyle) _existingStyle.remove();
    {
        const s = document.createElement('style');
        s.id = 'snd-style';
        s.textContent = `
        .widget[data-type="sondage"] {
            cursor: move;
            overflow: visible !important;
        }
        .widget[data-type="sondage"] button { cursor: pointer; }
        .widget[data-type="sondage"] .custom-resize-handle { cursor: se-resize; }
        .widget[data-type="sondage"] .drag-handle { cursor: move; }

        .snd-ec {
            overflow: visible !important;
            display: flex;
            flex-direction: column;
            height: auto !important;
        }

        /* ── Fullboard ── */
        .snd-container.snd-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            font-size: 14px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            overflow-y: auto !important;
        }
        .snd-container.snd-fullboard .snd-header {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            flex-shrink: 0 !important;
            font-size: 14px !important;
        }
        .snd-container.snd-fullboard .snd-body {
            width: min(800px, 90vw) !important;
            padding: 1.5em 1em !important;
        }
        .snd-container.snd-fullboard .snd-question {
            font-size: 2.5em !important;
        }
        .snd-container.snd-fullboard .snd-option-text {
            font-size: 1.8em !important;
        }
        .snd-container.snd-fullboard .snd-percent {
            font-size: 1.2em !important;
        }

        /* ── Container ── */
        .snd-container {
            display: flex;
            flex-direction: column;
            background: #12122a;
            border-radius: 14px;
            border: 0.07em solid #2e2e50;
            box-shadow: 0 0.3em 1.4em rgba(0,0,0,.35);
            font-size: 14px;
            min-width: 220px;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
        }

        /* ── Header ── */
        .snd-header {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.55em 0.85em;
            background: #1a1a38;
            border-bottom: 0.07em solid #2e2e50;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            border-radius: 14px 14px 0 0;
        }
        .snd-title { font-size: 0.82em; font-weight: 700; color: #a5b4fc; letter-spacing: 0.03em; }

        /* ── Help btn ── */
        .snd-help-btn {
            background: rgba(165,180,252,.12); border: 0.07em solid rgba(165,180,252,.3);
            color: #a5b4fc; font-size: 0.65em; font-weight: 700;
            width: 1.7em; height: 1.7em; border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
            flex-shrink: 0;
        }

        /* ── Help popup ── */
        .snd-help-popup {
            display: none; position: absolute; top: 3em; left: 0.8em; right: 0.8em;
            background: #1e1e40; border: 1px solid #3a3a60; border-radius: 10px;
            padding: 0.8em 1em; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,.5);
            color: #c7d2fe; font-size: 0.8em; line-height: 1.5;
        }
        .snd-help-popup.snd-help-show { display: block; }
        .snd-help-popup h4 { margin: 0 0 0.5em; color: #a5b4fc; font-size: 1em; }
        .snd-help-section { margin-bottom: 0.5em; }
        .snd-help-section:last-child { margin-bottom: 0; }

        /* ── Body ── */
        .snd-body {
            display: flex;
            flex-direction: column;
            padding: 0.9em 0.85em;
            gap: 0.55em;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }

        /* ── Question ── */
        .snd-question {
            font-size: 2em;
            font-weight: 800;
            color: #e2e8ff;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 1em;
            opacity: 0.5;
        }
        .snd-question.snd-active { opacity: 1; }
        .snd-options { display: flex; flex-direction: column; gap: 3em; }

        /* ── Options ── */
        .snd-option {
            position: relative;
            background: #1c1c3a;
            border: 0.07em solid #2e2e50;
            border-radius: 0.6em;
            padding: 0.7em 0.85em;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.1s, border-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5em;
        }
        .snd-option:hover { border-color: #6366f1; transform: scale(0.99); }
        .snd-option:active { transform: scale(0.97); }
        .snd-option.snd-winner {
            border-width: 0.12em;
            animation: snd-pulse 2s infinite ease-in-out;
        }
        @keyframes snd-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.015); }
        }
        .snd-option-fill {
            position: absolute; left: 0; top: 0; bottom: 0;
            opacity: 0.15; transition: width 0.4s ease;
            background: #6366f1;
        }
        .snd-option-left {
            display: flex; align-items: center; gap: 0.4em;
            position: relative; z-index: 1;
        }
        .snd-option-text {
            font-size: 1.5em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.03em;
            color: #c7d2fe;
        }
        .snd-percent {
            font-size: 1em; font-weight: 900;
            color: #a5b4fc;
            position: relative; z-index: 1;
            flex-shrink: 0;
        }

        /* ── Footer ── */
        .snd-footer {
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 0.5em;
            padding: 0.5em 0 0.2em;
        }
        .snd-footer.snd-visible { display: flex; }
        .snd-total {
            font-size: 0.62em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: #6366f1; opacity: 0.7;
        }
        .snd-footer-btns { display: flex; gap: 0.4em; flex-wrap: wrap; justify-content: center; }
        .snd-footer-btn {
            font-size: 0.6em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.04em;
            border-radius: 0.5em; padding: 0.35em 0.75em;
            border: 0.1em solid; cursor: pointer;
            transition: transform 0.15s;
            background: transparent;
        }
        .snd-footer-btn:active { transform: scale(0.94); }
        .snd-btn-reset  { color: #fb923c; border-color: rgba(251,146,60,.3);  }
        .snd-btn-edit   { color: #60a5fa; border-color: rgba(96,165,250,.3);  }
        .snd-btn-delete { color: #f87171; border-color: rgba(248,113,113,.3); }

        /* ── Bouton nouveau sondage ── */
        .snd-new-btn {
            margin: 0.3em auto 0;
            display: flex; align-items: center; gap: 0.4em;
            font-size: 0.65em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.04em;
            background: rgba(99,102,241,.15); border: 0.1em solid rgba(99,102,241,.4);
            color: #a5b4fc; border-radius: 2em; padding: 0.4em 1.1em;
            cursor: pointer; transition: background 0.15s;
        }
        .snd-new-btn:hover { background: rgba(99,102,241,.28); }

        /* ── Modal overlay ── */
        .snd-modal {
            display: none;
            position: fixed; inset: 0;
            background: rgba(0,0,0,.75);
            backdrop-filter: blur(6px);
            align-items: center; justify-content: center;
            z-index: 10000; padding: 1.5em;
        }
        .snd-modal.snd-modal-open { display: flex; }
        .snd-modal-content {
            background: #1a1a38;
            border: 1px solid #3a3a60;
            border-radius: 1.2em;
            padding: 1.4em 1.6em;
            width: 100%; max-width: 420px;
            box-shadow: 0 20px 50px rgba(0,0,0,.6);
            color: #c7d2fe;
        }
        .snd-modal-title {
            font-size: 0.95em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.04em;
            color: #a5b4fc; text-align: center;
            margin: 0 0 1em;
        }
        .snd-modal-input {
            background: #12122a; border: 1px solid #3a3a60;
            border-radius: 0.6em; padding: 0.55em 0.75em;
            color: #e2e8ff; font-size: 0.8em; font-weight: 600;
            width: 100%; box-sizing: border-box; outline: none;
            font-family: inherit;
            transition: border-color 0.15s;
        }
        .snd-modal-input:focus { border-color: #6366f1; }
        .snd-option-row {
            display: flex; gap: 0.5em; align-items: center;
            margin-bottom: 0.4em;
        }
        .snd-option-row .snd-modal-input { flex: 1; }
        .snd-remove-btn {
            background: none; border: none; color: #f87171;
            font-size: 1em; cursor: pointer; opacity: 0.5;
            padding: 0.2em; flex-shrink: 0;
            transition: opacity 0.15s;
        }
        .snd-remove-btn:hover { opacity: 1; }
        .snd-add-option-btn {
            background: none; border: none; color: #a5b4fc;
            font-size: 0.65em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.04em;
            cursor: pointer; opacity: 0.6; padding: 0.3em 0;
            transition: opacity 0.15s;
        }
        .snd-add-option-btn:hover { opacity: 1; }
        .snd-modal-btns { display: flex; gap: 0.6em; margin-top: 1em; }
        .snd-modal-btn {
            flex: 1; padding: 0.6em; border-radius: 0.7em;
            font-size: 0.7em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.04em;
            border: none; cursor: pointer;
            transition: transform 0.15s;
        }
        .snd-modal-btn:active { transform: scale(0.96); }
        .snd-modal-btn-cancel { background: rgba(255,255,255,.08); color: #c7d2fe; }
        .snd-modal-btn-confirm { background: #6366f1; color: #fff; }
        .snd-modal-btn-danger  { background: rgba(248,113,113,.15); color: #f87171; border: 1px solid rgba(248,113,113,.3); }

        /* ── Mode clair ── */
        body.menu-light .snd-container { background: #f4f5ff; border-color: #d4d4e8; }
        body.menu-light .snd-header    { background: #eef0f8; border-bottom-color: #d4d4e8; }
        body.menu-light .snd-title     { color: #4338ca; }
        body.menu-light .snd-help-btn  { background: rgba(67,56,202,.08); border-color: rgba(67,56,202,.3); color: #4338ca; }
        body.menu-light .snd-question  { color: #312e81; }
        body.menu-light .snd-option    { background: #fff; border-color: #d4d4e8; }
        body.menu-light .snd-option-text { color: #312e81; }
        body.menu-light .snd-percent   { color: #4338ca; }
        body.menu-light .snd-total     { color: #4338ca; }
        body.menu-light .snd-new-btn   { background: rgba(67,56,202,.08); border-color: rgba(67,56,202,.3); color: #4338ca; }
        body.menu-light .snd-modal-content { background: #fff; border-color: #d4d4e8; }
        body.menu-light .snd-modal-input   { background: #f4f5ff; border-color: #d4d4e8; color: #312e81; }
        body.menu-light .snd-modal-title   { color: #4338ca; }
        body.menu-light .snd-modal-btn-cancel { background: rgba(0,0,0,.07); color: #312e81; }
        body.menu-light .snd-help-popup { background: #fff; border-color: #d4d4e8; color: #312e81; }
        body.menu-light .snd-help-popup h4 { color: #4338ca; }
        `;
        document.head.appendChild(s);
    }

    // ── Widget DOM ───────────────────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'sondage';
    widget.dataset.transparent = 'true';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 100 };
    const initW = 800;
    const initH = 600;
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px; top:${p.y}px; overflow:visible;`;

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
        <div class="widget-ctx-menu"></div>`;

    const ec = document.createElement('div');
    ec.className = 'snd-ec';
    ec.style.overflow = 'visible';

    ec.innerHTML = `
        <div class="snd-container" style="width:${initW}px; height:${initH}px; position:relative;">
            <div class="snd-header">
                <span class="snd-title">📊 Sondage</span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="snd-help-btn" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>
            <div class="snd-help-popup">
                <h4>💡 Sondage express</h4>
                <div class="snd-help-section"><strong>➕ Créer un sondage</strong><br>Cliquez sur <em>+ Nouveau sondage</em>, saisissez votre question et au moins 2 options.</div>
                <div class="snd-help-section"><strong>🗳️ Voter</strong><br>Cliquez sur une option pour ajouter un vote. L'option gagnante s'affiche avec 🏆.</div>
                <div class="snd-help-section"><strong>✏️ Corriger</strong><br>Modifie la question ou les options. Les votes sont conservés si le texte reste identique.</div>
                <div class="snd-help-section"><strong>🔄 Réinitialiser</strong><br>Remet tous les compteurs à zéro sans supprimer le sondage.</div>
                <div class="snd-help-section"><strong>🗑️ Supprimer</strong><br>Supprime définitivement le sondage et tous ses votes.</div>
            </div>
            <div class="snd-body">
                <div class="snd-question">Aucun sondage actif</div>
                <div class="snd-options"></div>
                <div class="snd-footer">
                    <div class="snd-total">Total : <span class="snd-total-count">0</span> vote(s)</div>
                    <div class="snd-footer-btns">
                        <button class="snd-footer-btn snd-btn-reset">🔄 Réinitialiser</button>
                        <button class="snd-footer-btn snd-btn-edit">✏️ Corriger</button>
                        <button class="snd-footer-btn snd-btn-delete">🗑️ Supprimer</button>
                    </div>
                </div>
                <button class="snd-new-btn">➕ Nouveau sondage</button>
            </div>
        </div>`;

    widget.appendChild(ec);

    const board = document.getElementById('board');
    board.appendChild(widget);

    if (typeof bringToFront          === 'function') bringToFront(widget);
    if (typeof makeDraggable         === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate   === 'function') makeDraggableRotate(widget);
    if (typeof makeResizableByHandle === 'function') makeResizableByHandle(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    // ── Injecter CSS wf-btns ──────────────────────────────────────
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

    // ── Header drag ───────────────────────────────────────────────
    const sndHeader = widget.querySelector('.snd-header');
    if (sndHeader && typeof startWidgetDrag === 'function') {
        sndHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        sndHeader.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Boutons wf ────────────────────────────────────────────────
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const cont    = widget.querySelector('.snd-container');
    let _isMax = false, _savedW = '';

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            if (typeof window._wfMiniBarCollapse === 'function') {
                ec.style.display = 'none';
                window._wfMiniBarCollapse(widget, '📊 Sondage', {
                    onExpand: () => { ec.style.display = ''; }
                });
            }
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = cont.style.width;
                cont.classList.add('snd-fullboard');
            } else {
                cont.classList.remove('snd-fullboard');
                if (_savedW) cont.style.width = _savedW;
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

    // ── Aide ──────────────────────────────────────────────────────
    const helpBtn   = widget.querySelector('.snd-help-btn');
    const helpPopup = widget.querySelector('.snd-help-popup');
    if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('snd-help-show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('snd-help-show'));
    }

    // ── Touche Suppr ──────────────────────────────────────────────
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

    // ── Logique sondage ───────────────────────────────────────────
    _initSondageWidget(widget);

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();
    return widget;
}

// ── Logique interne du sondage ─────────────────────────────────────
function _initSondageWidget(widget) {
    const questionEl  = widget.querySelector('.snd-question');
    const optionsEl   = widget.querySelector('.snd-options');
    const footerEl    = widget.querySelector('.snd-footer');
    const totalEl     = widget.querySelector('.snd-total-count');
    const newBtn      = widget.querySelector('.snd-new-btn');
    const resetBtn    = widget.querySelector('.snd-btn-reset');
    const editBtn     = widget.querySelector('.snd-btn-edit');
    const deleteBtn   = widget.querySelector('.snd-btn-delete');

    // Couleur d'accentuation
    const ACCENT = '#6366f1';

    let poll = null; // { question, options: [{text, votes}] }

    // ── Rendu ────────────────────────────────────────────────────
    function render() {
        if (!poll) {
            questionEl.textContent = 'Aucun sondage actif';
            questionEl.classList.remove('snd-active');
            optionsEl.innerHTML = '';
            footerEl.classList.remove('snd-visible');
            return;
        }

        questionEl.textContent = poll.question;
        questionEl.classList.add('snd-active');
        footerEl.classList.add('snd-visible');

        const total = poll.options.reduce((s, o) => s + o.votes, 0);
        totalEl.textContent = total;
        const maxVotes = Math.max(...poll.options.map(o => o.votes));

        optionsEl.innerHTML = '';
        poll.options.forEach((opt, i) => {
            const pct     = total === 0 ? 0 : Math.round((opt.votes / total) * 100);
            const isWinner = total > 0 && opt.votes === maxVotes;

            const card = document.createElement('div');
            card.className = 'snd-option' + (isWinner ? ' snd-winner' : '');
            if (isWinner) card.style.borderColor = ACCENT;

            card.innerHTML = `
                <div class="snd-option-fill" style="width:${pct}%; background:${ACCENT}"></div>
                <div class="snd-option-left">
                    <span class="snd-option-text">${opt.text}</span>
                    ${isWinner ? '<span style="font-size:0.9em">🏆</span>' : ''}
                </div>
                <span class="snd-percent" style="color:${ACCENT}">${pct}%</span>`;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                poll.options[i].votes++;
                render();
                if (typeof saveBoard === 'function') saveBoard();
            });
            optionsEl.appendChild(card);
        });
    }

    // ── Modal ─────────────────────────────────────────────────────
    function openModal(html, onConfirm, opts = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'snd-modal snd-modal-open';
        overlay.innerHTML = `<div class="snd-modal-content">${html}</div>`;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        overlay.querySelector('.snd-modal-content').addEventListener('click', e => e.stopPropagation());

        const cancelBtn = overlay.querySelector('.snd-modal-btn-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', () => overlay.remove());

        const confirmBtn = overlay.querySelector('.snd-modal-btn-confirm, .snd-modal-btn-danger');
        if (confirmBtn && onConfirm) {
            confirmBtn.addEventListener('click', () => {
                onConfirm(overlay);
                overlay.remove();
            });
        }
        return overlay;
    }

    // ── Formulaire nouveau/corriger sondage ───────────────────────
    function openForm(isEdit = false) {
        const existingOpts = isEdit && poll ? poll.options.map(o => o.text) : ['', ''];
        const optsHtml = existingOpts.map(v => `
            <div class="snd-option-row">
                <input class="snd-modal-input snd-opt-input" type="text" placeholder="Option" value="${v.replace(/"/g, '&quot;')}">
                <button class="snd-remove-btn" title="Supprimer">✕</button>
            </div>`).join('');

        const html = `
            <div class="snd-modal-title">${isEdit ? '✏️ Corriger le sondage' : '➕ Nouveau sondage'}</div>
            <input class="snd-modal-input" id="snd-q-input" type="text" placeholder="Votre question…" value="${isEdit && poll ? poll.question.replace(/"/g, '&quot;') : ''}" style="margin-bottom:0.7em">
            <div class="snd-opts-list">${optsHtml}</div>
            <button class="snd-add-option-btn">+ Ajouter une option</button>
            <div class="snd-modal-btns">
                <button class="snd-modal-btn snd-modal-btn-cancel">Annuler</button>
                <button class="snd-modal-btn snd-modal-btn-confirm">Valider</button>
            </div>`;

        const overlay = openModal(html, (ov) => {
            const q = ov.querySelector('#snd-q-input').value.trim();
            const inputs = [...ov.querySelectorAll('.snd-opt-input')];
            const newOpts = inputs.map(i => i.value.trim()).filter(Boolean);
            if (!q || newOpts.length < 2) {
                showAlert('Il faut une question et au moins 2 options.', '❌');
                return;
            }
            if (isEdit && poll) {
                // Conserver les votes si texte identique
                poll.question = q;
                poll.options = newOpts.map((text, idx) => {
                    const old = poll.options[idx];
                    return { text, votes: (old && old.text === text) ? old.votes : 0 };
                });
            } else {
                poll = { question: q, options: newOpts.map(text => ({ text, votes: 0 })) };
            }
            render();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // Ajouter option
        overlay.querySelector('.snd-add-option-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const row = document.createElement('div');
            row.className = 'snd-option-row';
            row.innerHTML = `<input class="snd-modal-input snd-opt-input" type="text" placeholder="Option">
                             <button class="snd-remove-btn" title="Supprimer">✕</button>`;
            row.querySelector('.snd-remove-btn').addEventListener('click', () => row.remove());
            overlay.querySelector('.snd-opts-list').appendChild(row);
        });

        // Supprimer options existantes
        overlay.querySelectorAll('.snd-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.snd-option-row').remove());
        });
    }

    function showAlert(msg, icon = '⚠️', onConfirm = null) {
        const html = `
            <div style="text-align:center">
                <div style="font-size:2em;margin-bottom:0.3em">${icon}</div>
                <p style="font-size:0.8em;opacity:.85;margin-bottom:1em;line-height:1.5">${msg}</p>
                <div class="snd-modal-btns">
                    ${onConfirm ? '<button class="snd-modal-btn snd-modal-btn-cancel">Annuler</button>' : ''}
                    <button class="snd-modal-btn ${onConfirm ? 'snd-modal-btn-danger' : 'snd-modal-btn-confirm'}">${onConfirm ? 'Confirmer' : 'OK'}</button>
                </div>
            </div>`;
        openModal(html, onConfirm);
    }

    // ── Événements ────────────────────────────────────────────────
    newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (poll) {
            showAlert('Créer un nouveau sondage effacera le sondage actuel et tous ses votes. Continuer ?', '🆕', () => {
                poll = null;
                render();
                openForm(false);
            });
        } else {
            openForm(false);
        }
    });

    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAlert('Remettre tous les compteurs à zéro ?', '🔄', () => {
            if (poll) poll.options.forEach(o => o.votes = 0);
            render();
            if (typeof saveBoard === 'function') saveBoard();
        });
    });

    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openForm(true);
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAlert('Supprimer définitivement ce sondage ?', '🗑️', () => {
            poll = null;
            render();
            if (typeof saveBoard === 'function') saveBoard();
        });
    });

    // ── Sauvegarde / restauration ─────────────────────────────────
    widget._sndGetData = () => {
        const c = widget.querySelector('.snd-container');
        const isFullboard = c ? c.classList.contains('snd-fullboard') : false;
        return { poll, containerW: c ? c.offsetWidth : null, containerH: c ? c.offsetHeight : null, fullboard: isFullboard };
    };
    widget._sndSetData = (data) => {
        if (!data) return;
        if (data.poll !== undefined) poll = data.poll;
        if (data.fullboard) _isMax = true;
        render();
    };

    render();
}
