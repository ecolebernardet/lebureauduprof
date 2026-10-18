// ══════════════════════════════════════════════════════════════════
//  widget-sondage.js  —  Sondage express interactif
// ══════════════════════════════════════════════════════════════════

// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}


// Couleurs du cadre (mêmes que Tirage / Équipes / Liste de classe / Minuteur)
const SND_THEMES = {
    bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
    vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
    jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
    rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
    violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
    gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
    noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
};
const SND_DEFAULT_THEME = 'violet';
const SND_ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';
const SND_ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
const SND_ICON_TITLE   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="6.5" rx="1"/><rect x="10.5" y="5" width="3" height="12.5" rx="1"/><rect x="15.5" y="8.5" width="3" height="9" rx="1"/></svg>';

function createSondageWidget() {

    // Police arrondie partagée avec les autres widgets (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }
    // Taille des pastilles fenêtre (identique aux autres widgets)
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

    // ── CSS (injecté une seule fois) ──────────────────────────────
    const _existingStyle = document.getElementById('snd-style');
    if (_existingStyle) _existingStyle.remove();
    {
        const s = document.createElement('style');
        s.id = 'snd-style';
        s.textContent = `
        /* ═══ Nouveau graphisme (même charte que Tirage / Équipes / Liste) ═══ */
        .widget[data-type="sondage"],
        .widget[data-type="sondage"]:focus-within {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        /* ── Cadre coloré ── */
        .snd-container {
            --sn-ink:   #14202E;
            --sn-glass: rgba(255,255,255,0.62);
            --sn-bg:    #C2B2F0;
            --sn-op:    #6A4FC2;
            background-color: var(--sn-bg);
            background-image:
                radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
                radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
            border: none;
            border-radius: 24px;
            padding: 0 16px 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            color: var(--sn-ink);
            box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
            position: relative;
            user-select: none;
            overflow: hidden;
            container-type: inline-size;
            transition: background-color .3s;
        }
        .widget[data-type="sondage"]:hover .snd-container,
        .widget[data-type="sondage"]:focus-within .snd-container {
            outline: 2px dashed rgba(20,32,46,0.35);
            outline-offset: 2px;
        }
        /* ── En-tête : deux pastilles « verre » ── */
        .snd-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px 0 0;
            flex-shrink: 0;
            cursor: move;
            user-select: none;
            border: none;
            background: transparent;
        }
        .snd-title, .snd-tools, .snd-glass {
            background: var(--sn-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        }
        .snd-title, .snd-tools {
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 999px;
        }
        .snd-title {
            padding: 7px 16px 7px 12px;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0;
            color: var(--sn-ink);
            white-space: nowrap;
            overflow: hidden;
            min-width: 0;
            pointer-events: none;
        }
        .snd-title span { overflow: hidden; text-overflow: ellipsis; }
        .snd-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--sn-op); }
        .snd-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
        @container (max-width: 460px) { .snd-title span { display: none; } .snd-title { padding: 7px 10px; } }
        .snd-icon-btn {
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: none; background: transparent;
            color: var(--sn-ink); cursor: pointer; padding: 0;
            transition: background .15s;
        }
        .snd-icon-btn svg { width: 18px; height: 18px; }
        .snd-icon-btn:hover, .snd-icon-btn.is-on { background: rgba(20,32,46,0.12); }
        .snd-hsep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }
        /* ── Panneau « Couleur du cadre » ── */
        .snd-pop {
            display: none;
            position: absolute; top: 62px; right: 16px; z-index: 400;
            width: 250px; max-width: calc(100% - 32px);
            box-sizing: border-box;
            flex-direction: column; gap: 10px;
            padding: 14px 16px;
            border-radius: 16px;
            background: rgba(255,255,255,0.96);
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            color: var(--sn-ink);
            cursor: default;
        }
        .snd-pop.show { display: flex; }
        .snd-pop-title { font-size: 13px; font-weight: 700; }
        .snd-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
        .snd-swatch {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid rgba(20,32,46,0.15); padding: 0; cursor: pointer;
        }
        .snd-swatch.is-on { border-color: var(--sn-ink); box-shadow: 0 0 0 2px #fff inset; }
        /* ── Plein écran : marge à gauche pour laisser visibles les onglets des panneaux ── */
        .snd-container.snd-fullboard {
            position: fixed !important;
            inset: 0 !important;
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            outline: none !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .snd-container.snd-fullboard { height: 100dvh !important; padding: 0 10px 10px; }
        }

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
        .snd-container { font-size: 14px; min-width: 220px; }

        /* ── Plein écran : contenu centré et agrandi ── */
        .snd-container.snd-fullboard { align-items: center !important; overflow-y: auto !important; font-size: 14px !important; }
        .snd-container.snd-fullboard .snd-header { width: 100% !important; box-sizing: border-box !important; flex-shrink: 0 !important; }
        .snd-container.snd-fullboard .snd-body { width: min(800px, 90vw) !important; padding: 1.5em 1.4em !important; }
        .snd-container.snd-fullboard .snd-question { font-size: 2.5em !important; }
        .snd-container.snd-fullboard .snd-option-text { font-size: 1.8em !important; }
        .snd-container.snd-fullboard .snd-percent { font-size: 1.2em !important; }

        /* ── Aide ── */
        .snd-help-popup {
            display: none;
            position: absolute; top: 62px; right: 16px; z-index: 200;
            width: 300px; max-width: calc(100% - 32px);
            box-sizing: border-box;
            padding: 14px 16px;
            border-radius: 16px;
            background: rgba(255,255,255,0.96);
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            color: rgba(20,32,46,0.85);
            font-size: 12px; font-weight: 600; line-height: 1.5;
            cursor: default;
        }
        .snd-help-popup.snd-help-show { display: block; }
        .snd-help-popup h4 { margin: 0 0 8px; color: var(--sn-ink); font-size: 13px; font-weight: 700; }
        .snd-help-popup strong { color: var(--sn-op); }
        .snd-help-section { margin-bottom: 0.6em; }
        .snd-help-section:last-child { margin-bottom: 0; }

        /* ── Zone du sondage (zone blanche arrondie) ── */
        .snd-body {
            display: flex;
            flex-direction: column;
            padding: 1.1em 1.2em;
            gap: 0.6em;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            background: rgba(255,255,255,0.94);
            border-radius: 18px;
            box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
            box-sizing: border-box;
            scrollbar-width: thin;
        }

        /* ── Question ── */
        .snd-question {
            font-size: 2em;
            font-weight: 700;
            color: var(--sn-ink);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 1em;
            opacity: 0.45;
        }
        .snd-question.snd-active { opacity: 1; }
        .snd-options { display: flex; flex-direction: column; gap: 3em; }

        /* ── Options ── */
        .snd-option {
            position: relative;
            background: #F4F6F9;
            border: 1.5px solid rgba(20,32,46,0.08);
            border-radius: 1.1em;
            padding: 0.75em 1em;
            cursor: pointer;
            overflow: hidden;
            box-shadow: 0 2px 0 rgba(20,32,46,0.06);
            transition: transform 0.1s, border-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5em;
        }
        .snd-option:hover { border-color: var(--sn-op); transform: scale(0.99); }
        .snd-option:active { transform: scale(0.97); }
        .snd-option.snd-winner { border-width: 0.16em; animation: snd-pulse 2s infinite ease-in-out; }
        @keyframes snd-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
        .snd-option-fill {
            position: absolute; left: 0; top: 0; bottom: 0;
            opacity: 0.2; transition: width 0.4s ease;
            background: var(--sn-op);
        }
        .snd-option-left { display: flex; align-items: center; gap: 0.4em; position: relative; z-index: 1; }
        .snd-option-text {
            font-size: 1.5em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.03em;
            color: var(--sn-ink);
        }
        .snd-percent {
            font-size: 1em; font-weight: 700;
            color: var(--sn-op);
            position: relative; z-index: 1;
            flex-shrink: 0;
        }

        /* ── Pied ── */
        .snd-footer { display: none; flex-direction: column; align-items: center; gap: 0.6em; padding: 0.6em 0 0.2em; }
        .snd-footer.snd-visible { display: flex; }
        .snd-total {
            font-size: 0.8em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: var(--sn-op);
        }
        .snd-footer-btns { display: flex; gap: 0.4em; flex-wrap: wrap; justify-content: center; }
        .snd-footer-btn {
            font-size: 0.8em; font-weight: 700;
            font-family: inherit;
            border-radius: 999px; padding: 0.45em 1em;
            border: none; cursor: pointer;
            background: rgba(20,32,46,0.06);
            transition: background 0.15s, transform 0.15s;
        }
        .snd-footer-btn:hover { background: rgba(20,32,46,0.12); }
        .snd-footer-btn:active { transform: scale(0.94); }
        .snd-btn-reset  { color: #B9770E; }
        .snd-btn-edit   { color: #2F6FB3; }
        .snd-btn-delete { color: #C0392B; }

        /* ── Bouton « Nouveau sondage » ── */
        .snd-new-btn {
            margin: 0.4em auto 0;
            display: flex; align-items: center; gap: 0.4em;
            font-size: 0.9em; font-weight: 700;
            font-family: inherit;
            background: var(--sn-op); border: none;
            color: #fff; border-radius: 999px; padding: 0.55em 1.3em;
            box-shadow: 0 3px 0 rgba(0,0,0,0.22);
            cursor: pointer; transition: filter 0.15s, transform 0.1s;
        }
        .snd-new-btn:hover { filter: brightness(1.1); }
        .snd-new-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.22); }

        /* ── Modale ── */
        .snd-modal {
            --sn-ink: #14202E; --sn-op: #6A4FC2;
            display: none;
            position: fixed; inset: 0;
            background: rgba(10,20,35,0.35);
            -webkit-backdrop-filter: blur(4px);
                    backdrop-filter: blur(4px);
            align-items: center; justify-content: center;
            z-index: 10000; padding: 1.5em;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            font-size: 16px;
        }
        .snd-modal.snd-modal-open { display: flex; }
        .snd-modal-content {
            background: rgba(255,255,255,0.98);
            border: none;
            border-radius: 20px;
            padding: 1.4em 1.5em;
            width: 100%; max-width: 420px;
            box-sizing: border-box;
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            color: var(--sn-ink);
        }
        .snd-modal-title { font-size: 1em; font-weight: 700; color: var(--sn-ink); text-align: center; margin: 0 0 1em; }
        .snd-modal-input {
            background: #F4F6F9; border: 1.5px solid rgba(20,32,46,0.12);
            border-radius: 999px; padding: 0.55em 0.9em;
            color: var(--sn-ink); font-size: 0.9em; font-weight: 600;
            width: 100%; box-sizing: border-box; outline: none;
            font-family: inherit;
            transition: border-color 0.15s, background 0.15s;
        }
        .snd-modal-input:focus { border-color: var(--sn-op); background: #fff; }
        .snd-option-row { display: flex; gap: 0.5em; align-items: center; margin-bottom: 0.45em; }
        .snd-option-row .snd-modal-input { flex: 1; }
        .snd-remove-btn {
            background: none; border: none; color: #C0392B;
            font-size: 1em; cursor: pointer; opacity: 0.5;
            width: 1.8em; height: 1.8em; border-radius: 50%;
            padding: 0; flex-shrink: 0;
            transition: opacity 0.15s, background 0.15s;
        }
        .snd-remove-btn:hover { opacity: 1; background: rgba(192,57,43,0.1); }
        .snd-add-option-btn {
            background: none; border: none; color: var(--sn-op);
            font-size: 0.8em; font-weight: 700; font-family: inherit;
            cursor: pointer; padding: 0.4em 0.2em;
        }
        .snd-add-option-btn:hover { text-decoration: underline; }
        .snd-modal-btns { display: flex; gap: 0.6em; margin-top: 1em; }
        .snd-modal-btn {
            flex: 1; padding: 0.65em; border-radius: 999px;
            font-size: 0.85em; font-weight: 700; font-family: inherit;
            border: none; cursor: pointer;
            transition: background 0.15s, filter 0.15s, transform 0.15s;
        }
        .snd-modal-btn:active { transform: scale(0.96); }
        .snd-modal-btn-cancel { background: rgba(20,32,46,0.08); color: var(--sn-ink); }
        .snd-modal-btn-cancel:hover { background: rgba(20,32,46,0.15); }
        .snd-modal-btn-confirm { background: var(--sn-op); color: #fff; }
        .snd-modal-btn-confirm:hover { filter: brightness(1.1); }
        .snd-modal-btn-danger { background: #C0392B; color: #fff; }
        .snd-modal-btn-danger:hover { filter: brightness(1.1); }
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
        <div class="snd-container" style="width:${initW}px; height:${initH}px;">
            <div class="snd-header">
                <div class="snd-title">${SND_ICON_TITLE}<span>Sondage</span></div>
                <div class="snd-tools">
                    <button class="snd-icon-btn snd-theme-btn" title="Couleur du cadre">${SND_ICON_PALETTE}</button>
                    <button class="snd-icon-btn snd-help-btn" title="Aide">${SND_ICON_HELP}</button>
                    <span class="snd-hsep"></span>
                    <div class="wf-btns">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                    </div>
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
            if (_isMax) return;
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        sndHeader.addEventListener('touchstart', (e) => {
            if (_isMax) return;
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
    const container = cont;

    // ── Couleur du cadre (palette, mémorisée dans la sauvegarde du tableau) ──
    const sndThemeBtn = container.querySelector('.snd-theme-btn');
    const sndPop = document.createElement('div');
    sndPop.className = 'snd-pop';
    sndPop.innerHTML = '<div class="snd-pop-title">Couleur du cadre</div><div class="snd-swatches">' +
        Object.keys(SND_THEMES).map(id =>
            '<button class="snd-swatch" data-theme="' + id + '" title="' + SND_THEMES[id].name +
            '" style="background:' + SND_THEMES[id].bg + '"></button>').join('') + '</div>';
    container.appendChild(sndPop);
    function sndApplyTheme(id) {
        if (!SND_THEMES[id]) id = SND_DEFAULT_THEME;
        widget.dataset.sndTheme = id;
        [container].forEach(el => {
            if (!el) return;
            el.style.setProperty('--sn-bg', SND_THEMES[id].bg);
            el.style.setProperty('--sn-op', SND_THEMES[id].op);
        });
        sndPop.querySelectorAll('.snd-swatch').forEach(b => b.classList.toggle('is-on', b.dataset.theme === id));
        
    }
    widget._sndApplyTheme = sndApplyTheme;
    sndThemeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    sndThemeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !sndPop.classList.contains('show');
        sndPop.classList.toggle('show', open);
        sndThemeBtn.classList.toggle('is-on', open);
    });
    sndPop.addEventListener('mousedown', (e) => e.stopPropagation());
    sndPop.addEventListener('click', (e) => e.stopPropagation());
    sndPop.querySelectorAll('.snd-swatch').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        sndApplyTheme(b.dataset.theme);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    document.addEventListener('click', () => { sndPop.classList.remove('show'); sndThemeBtn.classList.remove('is-on'); });
    sndApplyTheme(widget.dataset.sndTheme || SND_DEFAULT_THEME);

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

    // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
    // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
    {
        const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
        cont.addEventListener('touchstart',  stopInMax, { passive: true });
        cont.addEventListener('pointerdown', stopInMax);
        cont.addEventListener('mousedown',   stopInMax);
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
        helpPopup.addEventListener('click', (e) => e.stopPropagation());
        helpPopup.addEventListener('mousedown', (e) => e.stopPropagation());
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

    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    if (_wfIsPhoneLaunch() && wfMax && !_isMax) wfMax.click();

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
    const ACCENT = 'var(--sn-op)';

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
        const _c = widget.querySelector('.snd-container');
        if (_c) ['--sn-bg', '--sn-op'].forEach(v => { const val = _c.style.getPropertyValue(v); if (val) overlay.style.setProperty(v, val); });
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
        // En plein écran (téléphone ou bouton vert), on enregistre la taille normale du cadre
        // (son style), pas la taille de l'écran du téléphone
        const phoneFs = widget.classList.contains('phone-fs') || isFullboard;
        const cw = c ? (phoneFs ? (parseFloat(c.style.width)  || 800) : c.offsetWidth)  : null;
        const ch = c ? (phoneFs ? (parseFloat(c.style.height) || 600) : c.offsetHeight) : null;
        return { poll, containerW: cw, containerH: ch, fullboard: isFullboard, theme: widget.dataset.sndTheme || null };
    };
    widget._sndSetData = (data) => {
        if (!data) return;
        if (data.poll !== undefined) poll = data.poll;
        if (data.theme && typeof widget._sndApplyTheme === 'function') widget._sndApplyTheme(data.theme);
        if (data.fullboard) _isMax = true;
        render();
    };

    render();
}

// ── Couleur du cadre dans la sauvegarde du tableau (correspondance par ordre) ──
(function patchThemePersistSondage() {
    function patchBuild() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function' || _orig._sndThemePatched) return;
        const patched = function () {
            const state = _orig.apply(this, arguments);
            try {
                const list = (state && Array.isArray(state.widgets)) ? state.widgets : (Array.isArray(state) ? state : []);
                const saved = list.filter(w => w && w.type === 'sondage');
                document.querySelectorAll('.widget[data-type="sondage"]').forEach((w, i) => {
                    if (saved[i] && w.dataset.sndTheme) saved[i].sndTheme = w.dataset.sndTheme;
                });
            } catch (e) {}
            return state;
        };
        patched._sndThemePatched = true;
        window.buildBoardState = patched;
    }
    function patchRestore() {
        const _orig = window.restoreBoardFromJSON;
        if (typeof _orig !== 'function' || _orig._sndThemePatched) return;
        const patched = function (json) {
            let themes = [];
            try {
                const parsed  = JSON.parse(json);
                const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                themes = widgets.filter(w => w && w.type === 'sondage').map(w => w.sndTheme || '');
            } catch (e) {}
            const res = _orig.apply(this, arguments);
            const apply = () => document.querySelectorAll('.widget[data-type="sondage"]').forEach((w, i) => {
                if (themes[i] && typeof w._sndApplyTheme === 'function') w._sndApplyTheme(themes[i]);
            });
            apply();
            setTimeout(apply, 250);
            return res;
        };
        patched._sndThemePatched = true;
        window.restoreBoardFromJSON = patched;
    }
    function doPatch() { patchBuild(); patchRestore(); }
    if (typeof window.buildBoardState === 'function' && typeof window.restoreBoardFromJSON === 'function') doPatch();
    else document.addEventListener('DOMContentLoaded', doPatch);
})();
