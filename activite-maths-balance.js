// =========================================================================
// WIDGET LA BALANCE À PLATEAUX — Le Bureau du Prof
// On pose des nombres, des masses ou des boîtes mystère sur chaque plateau :
// la balance penche du côté le plus lourd, ou s'équilibre.
//   🔢 Nombres   : égalités et compléments (7 + 8 = 10 + ?)
//   ⚖️ Masses    : poids marqués (1 g à 2 kg) et objets de masse inconnue
//   ❓ Équations : boîtes « ? » de valeur cachée (? + ? + 3 = 11)
// Mode libre ou 🎯 défis (3 niveaux). L'égalité (=, < ou >) s'écrit sous
// la balance à partir des plateaux. Glisser-déposer ou clic pour ajouter,
// clic sur une étiquette d'un plateau pour la retirer.
//
// Même fenêtre que « La phrase du jour » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // CSS partagé boutons fenêtre (injecté une seule fois)
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

    if (document.getElementById('bal-style')) return;
    const s = document.createElement('style');
    s.id = 'bal-style';
    s.textContent = `
        .widget[data-type="balance"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: default;
        }
        .bal-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            cursor: default;
            overflow: hidden;
        }
        .bal-container input { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .bal-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: grab; }
        .bal-header:active { cursor: grabbing; }
        .bal-container.wf-fullboard .bal-header { cursor: default; }
        .bal-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .bal-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #dbeafe; color: #1e40af; }

        /* Réduit / plein écran */
        .bal-container.wf-minimized > *:not(.bal-header) { display: none !important; }
        .bal-container.wf-minimized { gap: 0; }
        .bal-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .bal-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .bal-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .bal-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .bal-btn:active { transform: scale(0.96); }
        .bal-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .bal-btn-blue  { background: #4a90e2; color: #fff; }
        .bal-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .bal-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .bal-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .bal-btn-green { background: #28a745; color: #fff; }
        .bal-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .bal-btn-big { font-size: 13px; padding: 7px 14px; }
        .bal-btn.on { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
        .bal-tab {
            padding: 6px 12px; border-radius: 9px; border: 2px solid transparent; cursor: pointer;
            font-size: 13px; font-weight: 800; background: #f3f4f6; color: #4b5563;
        }
        .bal-tab.active { background: #dbeafe; color: #1e40af; border-color: #60a5fa; }
        .bal-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .bal-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .bal-level-btn:hover { background: #e0e0e0; }
        .bal-level-btn.active { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
        .bal-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .bal-side { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .bal-side button { border: none; background: #fff; padding: 4px 10px; font-size: 11px; font-weight: 800; cursor: pointer; color: #6b7280; }
        .bal-side button.on { background: #1e40af; color: #fff; }

        /* Palette */
        .bal-palette {
            display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
            padding: 6px 8px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .bal-chip {
            min-width: 34px; height: 34px; padding: 0 8px; border-radius: 8px;
            display: inline-flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 15px; cursor: pointer; touch-action: none;
            border: 2px solid rgba(0,0,0,.15); box-shadow: 0 2px 3px rgba(0,0,0,.12);
            font-family: 'Nunito', 'Segoe UI', sans-serif; color: #1f2937;
        }
        .bal-chip:hover { transform: translateY(-1px); }
        .bal-chip.w { background: linear-gradient(#e5e7eb, #9ca3af); border-radius: 10px 10px 6px 6px; font-size: 12px; }
        .bal-chip.x { background: #a855f7; color: #fff; }
        .bal-other { width: 70px; padding: 5px 7px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
        .bal-other:focus { border-color: #4a90e2; }

        /* Scène */
        .bal-stage {
            position: relative; flex-shrink: 0; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;
            background: linear-gradient(#f8fafc, #eef2f7);
        }
        .bal-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
        .bal-svg .item { cursor: pointer; }
        .bal-svg .item.locked { cursor: default; }
        .bal-svg .item:not(.locked):hover { filter: brightness(1.06) drop-shadow(0 0 4px rgba(37,99,235,.6)); }
        .bal-ghost { position: fixed; z-index: 100000; pointer-events: none; transform: translate(-50%, -50%) scale(1.15); opacity: .92; }

        /* Égalité et message */
        .bal-eq {
            text-align: center; font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 900; color: #1f2937;
            font-size: 28px; line-height: 1.25; min-height: 1.25em;
        }
        .bal-eq .sym { display: inline-block; min-width: 1.2em; color: #1e40af; }
        .bal-eq .sym.ne { color: #dc2626; }
        .bal-eq .tot { color: #64748b; font-size: .7em; }
        .bal-eq .q { color: #9333ea; }
        .bal-msg {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
        }
        .bal-msg.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .bal-msg.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .bal-msg.ko   { background: #fff1f1; border-color: #f5c2c2; color: #7f1d1d; }
        .bal-answer { display: none; gap: 6px; align-items: center; flex-wrap: wrap; font-weight: 800; color: #374151; }
        .bal-answer.show { display: flex; }
        .bal-answer input { width: 90px; padding: 6px 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; font-weight: 800; outline: none; }
        .bal-answer input:focus { border-color: #9333ea; }

        /* Aide */
        .bal-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .bal-help-btn:hover { background: #e0e0e0; color: #333; }
        .bal-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .bal-help-popup.show { display: block; }
        .bal-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .bal-help-popup p { margin: 0 0 6px; }
        .bal-help-popup p:last-child { margin-bottom: 0; }

        .bal-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .bal-container:hover .bal-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données ───────────────────────────────────────────────────────────────
const BAL_MODES = {
    nombres: { nom: 'Nombres',   ico: '🔢' },
    masses:  { nom: 'Masses',    ico: '⚖️' },
    eq:      { nom: 'Équations', ico: '❓' }
};
const BAL_LEVELS = {
    '1': { label: 'Niveau 1' },
    '2': { label: 'Niveau 2' },
    '3': { label: 'Niveau 3' }
};
const BAL_LEVEL_TITLES = {
    nombres: { '1': 'Compléments jusqu\'à 20', '2': 'Égalités jusqu\'à 100', '3': 'Égalités jusqu\'à 1 000' },
    masses:  { '1': 'Objets de 20 à 200 g', '2': 'Objets de 100 g à 1 kg', '3': 'Objets de 1 à 3 kg (conversions)' },
    eq:      { '1': '? + a = b', '2': 'n × ? + a = b (n ≤ 3)', '3': 'n × ? + a = b (plus grands nombres)' }
};
const BAL_NUMS    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100, 200, 500];
const BAL_WEIGHTS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
const BAL_OBJECTS = [
    { e: '🥚', nom: 'l\'œuf',              min: 50,   max: 70 },
    { e: '🥕', nom: 'la carotte',          min: 50,   max: 150 },
    { e: '🍌', nom: 'la banane',           min: 100,  max: 200 },
    { e: '🍎', nom: 'la pomme',            min: 100,  max: 250 },
    { e: '🍐', nom: 'la poire',            min: 120,  max: 250 },
    { e: '🍫', nom: 'la tablette de chocolat', min: 100, max: 200 },
    { e: '🧀', nom: 'le fromage',          min: 150,  max: 500 },
    { e: '📕', nom: 'le livre',            min: 200,  max: 800 },
    { e: '🧸', nom: 'l\'ours en peluche',  min: 200,  max: 700 },
    { e: '🧃', nom: 'la brique de jus',    min: 200,  max: 1000 },
    { e: '🍍', nom: 'l\'ananas',           min: 800,  max: 2000 },
    { e: '🍉', nom: 'la pastèque',         min: 1500, max: 3000 },
    { e: '🎃', nom: 'la citrouille',       min: 1000, max: 3000 }
];

// ── Outils ────────────────────────────────────────────────────────────────
function _balFmtMass(g) {
    g = Math.round(g);
    if (g < 1000) return g + ' g';
    const kg = Math.floor(g / 1000), r = g % 1000;
    return r ? `${kg} kg ${r} g` : `${kg} kg`;
}
function _balFmt(n) { return Number(n).toLocaleString('fr-FR'); }
function _balEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function _balRnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function _balIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}
// Décompose un nombre avec les étiquettes disponibles (le moins d'étiquettes possible)
function _balDecompose(n, set) {
    const out = [];
    const s = set.slice().sort((a, b) => b - a);
    for (const v of s) while (n >= v) { out.push(v); n -= v; }
    return out;
}
function _balNumColor(v) {
    if (v < 10) return '#fde047';
    if (v < 100) return '#93c5fd';
    if (v < 1000) return '#86efac';
    return '#fca5a5';
}

// ── Création du widget ────────────────────────────────────────────────────
function createBalanceWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'balance';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
    `;

    const container = document.createElement('div');
    container.className = 'bal-container';
    const initW = Math.round(window.innerWidth * 0.75);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'bal-header';
    header.innerHTML = `
        <span class="bal-title">⚖️ La balance à plateaux</span>
        <span class="bal-badge">Nombres</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.bal-badge');
    container.appendChild(header);

    // ── Modes et niveaux ──────────────────────────────────────────────────
    const tabs = document.createElement('div');
    tabs.className = 'bal-row';
    tabs.innerHTML = Object.keys(BAL_MODES).map(k => `<button class="bal-tab" data-mode="${k}">${BAL_MODES[k].ico} ${BAL_MODES[k].nom}</button>`).join('') +
        `<div class="bal-level-btns">${Object.keys(BAL_LEVELS).map(k => `<button class="bal-level-btn" data-level="${k}">${BAL_LEVELS[k].label}</button>`).join('')}</div>`;
    container.appendChild(tabs);

    // ── Actions ───────────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'bal-row';
    actions.innerHTML = `
        <button class="bal-btn bal-btn-green bal-btn-big" data-act="defi">🎯 Nouveau défi</button>
        <button class="bal-btn bal-btn-grey" data-act="libre" title="Plateaux vides, sans défi">🧪 Mode libre</button>
        <button class="bal-btn bal-btn-grey" data-act="vider" title="Retirer tout ce qui n'est pas verrouillé">🧽 Vider</button>
        <button class="bal-btn bal-btn-grey" data-act="totaux" title="Afficher la somme de chaque plateau">👁 Totaux</button>
        <span class="bal-lbl" style="margin-left:6px">Un clic ajoute à :</span>
        <span class="bal-side"><button data-side="L">◀ Gauche</button><button data-side="R">Droite ▶</button></span>
    `;
    const totBtn = actions.querySelector('[data-act="totaux"]');
    container.appendChild(actions);

    // ── Palette ───────────────────────────────────────────────────────────
    const palette = document.createElement('div');
    palette.className = 'bal-palette';
    container.appendChild(palette);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'bal-stage';
    stage.style.height = Math.round(initW * 0.4) + 'px';
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'bal-svg');
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = `
        <defs>
            <linearGradient id="bal-metal" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#9ca3af"/><stop offset=".45" stop-color="#f3f4f6"/><stop offset="1" stop-color="#6b7280"/>
            </linearGradient>
            <linearGradient id="bal-wood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#b7793e"/><stop offset="1" stop-color="#7c4a1e"/>
            </linearGradient>
            <linearGradient id="bal-plate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#b45309"/>
            </linearGradient>
        </defs>
        <ellipse cx="500" cy="585" rx="230" ry="12" fill="rgba(0,0,0,.12)"/>
        <path d="M330 585 L670 585 L620 540 L380 540 Z" fill="url(#bal-wood)"/>
        <rect x="488" y="175" width="24" height="370" rx="8" fill="url(#bal-metal)" stroke="#6b7280" stroke-width="2"/>
        <g data-role="needle"><line x1="500" y1="170" x2="500" y2="240" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/></g>
        <path d="M478 250 L522 250 L500 222 Z" fill="#374151"/>
        <g data-role="left"></g>
        <g data-role="right"></g>
        <g data-role="beam"></g>
        <circle cx="500" cy="170" r="16" fill="#374151"/><circle cx="500" cy="170" r="6" fill="#e5e7eb"/>
        <text data-role="tilt" x="500" y="40" text-anchor="middle" font-size="26" font-weight="800" fill="#334155" font-family="Segoe UI, sans-serif"></text>
    `;
    stage.appendChild(svg);
    container.appendChild(stage);
    const gLeft   = svg.querySelector('[data-role="left"]');
    const gRight  = svg.querySelector('[data-role="right"]');
    const gBeam   = svg.querySelector('[data-role="beam"]');
    const gNeedle = svg.querySelector('[data-role="needle"]');
    const tiltTxt = svg.querySelector('[data-role="tilt"]');

    const eqEl = document.createElement('div');
    eqEl.className = 'bal-eq';
    container.appendChild(eqEl);

    const answerRow = document.createElement('div');
    answerRow.className = 'bal-answer';
    answerRow.innerHTML = `
        <span><span style="color:#9333ea">?</span> =</span>
        <input type="number" min="0" max="100000" placeholder="…">
        <button class="bal-btn bal-btn-blue" data-act="check">✔ Vérifier</button>
        <button class="bal-btn bal-btn-grey" data-act="show-x">👁 Montrer ?</button>
    `;
    const answerInput = answerRow.querySelector('input');
    container.appendChild(answerRow);

    const msgEl = document.createElement('div');
    msgEl.className = 'bal-msg';
    container.appendChild(msgEl);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'bal-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'bal-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La balance à plateaux</h4>
        <p>Faites <b>glisser</b> une étiquette de la palette sur un plateau, ou <b>cliquez</b> dessus pour l'ajouter
        au côté choisi (◀ Gauche / Droite ▶). Un clic sur une étiquette posée la retire ; on peut aussi la faire
        glisser vers l'autre plateau. Les étiquettes 🔒 font partie du défi.</p>
        <p>La balance penche du côté le plus lourd. L'égalité (<b>=</b>, <b>&lt;</b> ou <b>&gt;</b>) s'écrit en dessous.</p>
        <p><b>🔢 Nombres</b> : compléter un plateau pour équilibrer (7 + 8 = 10 + ?).
        <b>⚖️ Masses</b> : trouver la masse d'un objet avec des poids marqués.
        <b>❓ Équations</b> : chaque boîte <b style="color:#9333ea">?</b> cache le même nombre. Enlever la même chose
        des deux côtés garde l'équilibre : c'est le principe des équations.</p>
        <p><b>👁 Totaux</b> affiche la somme de chaque plateau. <b>🧪 Mode libre</b> vide la balance pour vos propres exemples.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'bal-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let mode = 'nombres';
    let level = '1';
    let plates = { L: [], R: [] };   // items : { id, k:'n'|'w'|'x'|'o', v, lock, e, nom }
    let defi = null;                 // { type, solved, x, obj }
    let eqX = 5;                     // valeur cachée des boîtes « ? » (mode Équations)
    let showX = false;
    let showTot = true;
    let side = 'R';
    let msg = null;                  // { cls, html }
    let nextId = 1;
    let angle = 0, vel = 0, target = 0, animRaf = null;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function sum(arr) { return arr.reduce((a, it) => a + it.v, 0); }
    function mk(k, v, extra) { return Object.assign({ id: nextId++, k, v }, extra || {}); }

    // ── Palette ───────────────────────────────────────────────────────────
    function renderPalette() {
        let h = '';
        if (mode === 'masses') {
            h += BAL_WEIGHTS.map(v => `<span class="bal-chip w" data-add="w:${v}" title="Poids de ${_balFmtMass(v)}">${_balFmtMass(v)}</span>`).join('');
        } else {
            if (mode === 'eq') h += `<span class="bal-chip x" data-add="x:0" title="Boîte mystère : elle vaut toujours le même nombre">?</span>`;
            const nums = mode === 'eq' ? [1, 2, 3, 5, 10, 20, 50, 100] : BAL_NUMS;
            h += nums.map(v => `<span class="bal-chip" data-add="n:${v}" style="background:${_balNumColor(v)}">${v}</span>`).join('');
            h += `<span class="bal-lbl" style="margin-left:4px">Autre :</span><input class="bal-other" type="number" min="1" max="100000" placeholder="n">` +
                 `<button class="bal-btn bal-btn-grey" data-act="add-other">➕</button>`;
        }
        palette.innerHTML = h;
        const other = palette.querySelector('.bal-other');
        if (other) {
            other.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') addOther(); });
            other.addEventListener('click', (e) => { e.stopPropagation(); other.focus(); });
        }
    }
    function addOther() {
        const inp = palette.querySelector('.bal-other');
        const v = parseInt(inp && inp.value, 10);
        if (!Number.isFinite(v) || v < 1 || v > 100000) { if (inp) inp.focus(); return; }
        addItem(side, mk('n', v));
        inp.value = '';
    }
    function itemFromCode(code) {
        const [k, vs] = code.split(':');
        const v = parseInt(vs, 10);
        if (k === 'x') return mk('x', eqX);
        if (k === 'w') return mk('w', v);
        return mk('n', v);
    }

    // ── Manipulations ─────────────────────────────────────────────────────
    function addItem(s, it) {
        if (plates[s].length >= 30) { msg = { cls: 'warn', html: 'Ce plateau est plein (30 étiquettes au maximum).' }; renderInfo(); return; }
        plates[s].push(it);
        afterChange();
    }
    function removeItem(s, id) {
        const i = plates[s].findIndex(it => it.id === id);
        if (i < 0) return;
        if (plates[s][i].lock) { msg = { cls: 'warn', html: '🔒 Cette étiquette fait partie du défi : elle ne se retire pas.' }; renderInfo(); return; }
        plates[s].splice(i, 1);
        afterChange();
    }
    function moveItem(from, id, to) {
        const i = plates[from].findIndex(it => it.id === id);
        if (i < 0 || from === to) return;
        if (plates[from][i].lock) { msg = { cls: 'warn', html: '🔒 Cette étiquette fait partie du défi : elle reste sur son plateau.' }; renderInfo(); return; }
        if (plates[to].length >= 30) return;
        plates[to].push(plates[from].splice(i, 1)[0]);
        afterChange();
    }
    function afterChange() {
        msg = null;
        checkDefi();
        renderAll();
        save();
    }

    // ── Défis ─────────────────────────────────────────────────────────────
    function newDefi() {
        plates = { L: [], R: [] };
        showX = false;
        answerInput.value = '';
        msg = null;
        if (mode === 'nombres') {
            const max = level === '1' ? 20 : level === '2' ? 100 : 1000;
            const total = _balRnd(Math.round(max * 0.45), max);
            const n = _balRnd(2, 3);
            // Gauche : 2 ou 3 nombres dont la somme vaut « total »
            let rest = total;
            const left = [];
            for (let i = 0; i < n - 1; i++) {
                const step = level === '1' ? 1 : level === '2' ? 1 : 10;
                const v = Math.max(step, Math.round(_balRnd(Math.round(rest * 0.2), Math.round(rest * 0.6)) / step) * step);
                left.push(v); rest -= v;
            }
            left.push(rest);
            // Droite : un nombre plus petit que le total ; il faudra compléter
            const step = level === '3' ? 10 : 1;
            const r = Math.max(step, Math.round(_balRnd(Math.round(total * 0.3), Math.round(total * 0.75)) / step) * step);
            left.filter(v => v > 0).forEach(v => plates.L.push(mk('n', v, { lock: true })));
            plates.R.push(mk('n', r, { lock: true }));
            defi = { type: 'nombres', solved: false, missing: total - r };
            side = 'R';
            msg = { cls: '', html: `🎯 Ajoute des étiquettes sur le plateau de droite pour <b>équilibrer la balance</b>. Quel nombre manque-t-il ?` };
        } else if (mode === 'masses') {
            const ranges = { '1': [20, 200, 10], '2': [100, 1000, 5], '3': [1000, 3000, 50] };
            const [lo, hi, step] = ranges[level];
            const objs = BAL_OBJECTS.filter(o => o.max >= lo && o.min <= hi);
            const o = objs[Math.floor(Math.random() * objs.length)];
            const a = Math.ceil(Math.max(lo, o.min) / step), b = Math.floor(Math.min(hi, o.max) / step);
            const m = _balRnd(a, Math.max(a, b)) * step;
            plates.L.push(mk('o', m, { lock: true, e: o.e, nom: o.nom }));
            defi = { type: 'masses', solved: false, obj: { e: o.e, nom: o.nom, m } };
            side = 'R';
            msg = { cls: '', html: `🎯 Combien pèse ${_balEsc(o.nom)} ${o.e} ? Pose des poids sur le plateau de droite jusqu'à l'<b>équilibre</b>.` };
        } else {
            let x, n, a;
            if (level === '1') { x = _balRnd(1, 10); n = 1; a = _balRnd(1, 10); }
            else if (level === '2') { x = _balRnd(2, 12); n = _balRnd(1, 3); a = _balRnd(0, 12); }
            else { x = _balRnd(3, 25); n = _balRnd(2, 4); a = _balRnd(1, 30); }
            eqX = x;
            const b = n * x + a;
            for (let i = 0; i < n; i++) plates.L.push(mk('x', x, { lock: true }));
            const tokens = [1, 2, 5, 10, 20, 50, 100];
            _balDecompose(a, tokens).forEach(v => plates.L.push(mk('n', v)));
            _balDecompose(b, tokens).forEach(v => plates.R.push(mk('n', v)));
            defi = { type: 'eq', solved: false, x, n, a, b };
            msg = { cls: '', html: `🎯 La balance est en équilibre. Chaque boîte <b style="color:#9333ea">?</b> cache le même nombre : lequel ?` +
                ` Astuce : enlève la même chose des deux côtés, la balance reste équilibrée.` };
        }
        renderPalette();
        afterChangeSilently();
    }
    function afterChangeSilently() { renderAll(); save(); }

    function freeMode() {
        plates = { L: [], R: [] };
        defi = null;
        showX = false;
        if (mode === 'eq') eqX = _balRnd(1, 10);
        msg = { cls: '', html: mode === 'eq'
            ? '🧪 Mode libre : les boîtes <b style="color:#9333ea">?</b> cachent un nombre tiré au sort. Construisez votre propre équation !'
            : '🧪 Mode libre : posez ce que vous voulez sur les plateaux.' };
        renderPalette();
        renderAll();
        save();
    }

    function checkDefi() {
        if (!defi || defi.solved) return;
        const L = sum(plates.L), R = sum(plates.R);
        if (defi.type === 'nombres' && L === R) {
            defi.solved = true;
            msg = { cls: 'ok', html: `🎉 Bravo, la balance est en équilibre ! ${eqText(true)}` };
        } else if (defi.type === 'masses' && L === R) {
            defi.solved = true;
            const m = defi.obj.m;
            const nom = defi.obj.nom.charAt(0).toUpperCase() + defi.obj.nom.slice(1);
            msg = { cls: 'ok', html: `🎉 Équilibre ! ${_balEsc(nom)} ${defi.obj.e} pèse <b>${_balFmtMass(m)}</b>` +
                (m >= 1000 ? ` = <b>${_balFmt(m)} g</b>` : '') + '.' };
        }
    }

    function checkAnswer() {
        const v = parseInt(answerInput.value, 10);
        if (!Number.isFinite(v)) { answerInput.focus(); return; }
        if (v === eqX) {
            showX = true;
            if (defi && defi.type === 'eq') defi.solved = true;
            const d = defi && defi.type === 'eq' ? defi : null;
            msg = { cls: 'ok', html: `🎉 Oui ! <b style="color:#9333ea">?</b> = <b>${v}</b>.` +
                (d ? ` Vérification : ${d.n > 1 ? d.n + ' × ' + v : v}${d.a ? ' + ' + d.a : ''} = ${d.b}.` : '') };
        } else {
            msg = { cls: 'ko', html: `✗ Ce n'est pas ${v}. Si chaque boîte valait ${v}, la balance ne serait pas en équilibre : essaie encore !` };
        }
        renderAll();
        save();
    }

    // ── Écriture de l'égalité ─────────────────────────────────────────────
    function termHTML(it, plain) {
        if (it.k === 'x') return showX ? (plain ? String(it.v) : `<span class="q">${it.v}</span>`) : (plain ? '?' : '<span class="q">?</span>');
        if (it.k === 'o') return it.e;
        if (it.k === 'w' || mode === 'masses') return _balFmtMass(it.v);
        return _balFmt(it.v);
    }
    function sideText(arr, plain) {
        if (!arr.length) return '0';
        // On regroupe les boîtes « ? » en tête : ? + ? + 3
        const sorted = arr.slice().sort((a, b) => (a.k === 'x' || a.k === 'o' ? 0 : 1) - (b.k === 'x' || b.k === 'o' ? 0 : 1));
        return sorted.map(it => termHTML(it, plain)).join(' + ');
    }
    function hasHidden(arr) { return arr.some(it => it.k === 'o' || (it.k === 'x' && !showX)); }
    function totText(arr) {
        if (!arr.length) return '';
        if (hasHidden(arr)) return '';
        const t = sum(arr);
        return mode === 'masses' ? _balFmtMass(t) : _balFmt(t);
    }
    function eqText(plain) {
        const L = sum(plates.L), R = sum(plates.R);
        const sym = L === R ? '=' : (L < R ? '<' : '>');
        return `${sideText(plates.L, plain)} ${sym} ${sideText(plates.R, plain)}`;
    }

    // ── Dessin des plateaux ───────────────────────────────────────────────
    function itemSize(it) {
        if (it.k === 'w') {
            const t = Math.log10(it.v) / Math.log10(2000);   // 0 → 1
            return { w: 46 + t * 50, h: 40 + t * 40 };
        }
        if (it.k === 'o') return { w: 92, h: 86 };
        if (it.k === 'x') return { w: 64, h: 60 };
        const digits = String(it.v).length;
        return { w: Math.max(56, 26 + digits * 17), h: 52 };
    }
    function itemSVG(it, s) {
        const { w, h } = itemSize(it);
        let inner = '';
        if (it.k === 'w') {
            inner = `<path d="M${-w / 2} 0 L${w / 2} 0 L${w * 0.36} ${-h * 0.78} L${-w * 0.36} ${-h * 0.78} Z" fill="url(#bal-metal)" stroke="#4b5563" stroke-width="2"/>` +
                `<rect x="${-w * 0.14}" y="${-h}" width="${w * 0.28}" height="${h * 0.26}" rx="4" fill="url(#bal-metal)" stroke="#4b5563" stroke-width="2"/>` +
                `<text x="0" y="${-h * 0.3}" text-anchor="middle" font-size="${Math.min(20, w * 0.27)}" font-weight="800" fill="#111827" font-family="Segoe UI, sans-serif">${_balFmtMass(it.v)}</text>`;
        } else if (it.k === 'o') {
            inner = `<text x="0" y="-8" text-anchor="middle" font-size="74">${it.e}</text>`;
        } else if (it.k === 'x') {
            inner = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="8" fill="#a855f7" stroke="#6b21a8" stroke-width="3"/>` +
                `<path d="M${-w / 2} ${-h + 14} L${w / 2} ${-h + 14}" stroke="#6b21a8" stroke-width="2" opacity=".5"/>` +
                `<text x="0" y="${-h * 0.25}" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="Nunito, Segoe UI, sans-serif">${showX ? it.v : '?'}</text>`;
        } else {
            inner = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="9" fill="${_balNumColor(it.v)}" stroke="rgba(0,0,0,.35)" stroke-width="2.5"/>` +
                `<text x="0" y="${-h * 0.27}" text-anchor="middle" font-size="30" font-weight="900" fill="#1f2937" font-family="Nunito, Segoe UI, sans-serif">${_balFmt(it.v)}</text>`;
        }
        if (it.lock) inner += `<text x="${w / 2 - 6}" y="${-h + 14}" text-anchor="middle" font-size="14">🔒</text>`;
        return `<g class="item${it.lock ? ' locked' : ''}" data-side="${s}" data-id="${it.id}">${inner}</g>`;
    }
    // Range les étiquettes en rangées au-dessus du plateau (les plus grosses en bas)
    function layoutPlate(arr) {
        const W = 270;
        const items = arr.slice().sort((a, b) => itemSize(b).h - itemSize(a).h);
        const rows = [];
        let row = [], rw = 0;
        items.forEach(it => {
            const { w } = itemSize(it);
            if (row.length && rw + w + 6 > W) { rows.push(row); row = []; rw = 0; }
            row.push(it); rw += w + 6;
        });
        if (row.length) rows.push(row);
        let y = 0, out = '';
        rows.forEach(r => {
            const tw = r.reduce((a, it) => a + itemSize(it).w + 6, -6);
            let x = -tw / 2;
            const rh = Math.max(...r.map(it => itemSize(it).h));
            r.forEach(it => {
                const { w } = itemSize(it);
                out += `<g transform="translate(${x + w / 2} ${-y})">${itemSVG(it, arr === plates.L ? 'L' : 'R')}</g>`;
                x += w + 6;
            });
            y += rh + 4;
        });
        const scale = y > 150 ? 150 / y : 1;
        return `<g transform="scale(${scale})">${out}</g>`;
    }
    function plateSVG(arr, s) {
        const tot = showTot ? totText(arr) : '';
        return `<line x1="-120" y1="0" x2="0" y2="-150" stroke="#6b7280" stroke-width="3"/>` +
            `<line x1="120" y1="0" x2="0" y2="-150" stroke="#6b7280" stroke-width="3"/>` +
            `<g transform="translate(0 -4)">${layoutPlate(arr)}</g>` +
            `<path d="M-150 0 L150 0 Q140 22 0 24 Q-140 22 -150 0 Z" fill="url(#bal-plate)" stroke="#92400e" stroke-width="3"/>` +
            (tot ? `<text x="0" y="60" text-anchor="middle" font-size="30" font-weight="900" fill="#334155" font-family="Nunito, Segoe UI, sans-serif">${_balEsc(tot)}</text>` : '');
    }
    function renderPlates() {
        gLeft.innerHTML = plateSVG(plates.L, 'L');
        gRight.innerHTML = plateSVG(plates.R, 'R');
        positionParts();
    }
    // Place le fléau et les plateaux pour l'angle courant
    function positionParts() {
        const a = angle * Math.PI / 180;
        const cx = 500, cy = 170, half = 320;
        const lx = cx - half * Math.cos(a), ly = cy - half * Math.sin(a);
        const rx = cx + half * Math.cos(a), ry = cy + half * Math.sin(a);
        gBeam.innerHTML = `<line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="#374151" stroke-width="14" stroke-linecap="round"/>` +
            `<line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/>` +
            `<circle cx="${lx}" cy="${ly}" r="8" fill="#374151"/><circle cx="${rx}" cy="${ry}" r="8" fill="#374151"/>`;
        gLeft.setAttribute('transform', `translate(${lx} ${ly + 150})`);
        gRight.setAttribute('transform', `translate(${rx} ${ry + 150})`);
        gNeedle.setAttribute('transform', `rotate(${angle} 500 170)`);
    }
    function targetAngle() {
        const L = sum(plates.L), R = sum(plates.R);
        if (L === R) return 0;
        const t = Math.abs(R - L) / Math.max(L, R, 1);
        return Math.sign(R - L) * (3 + 9 * Math.min(1, t * 2));
    }
    // Petite oscillation amortie, comme une vraie balance
    function animate() {
        target = targetAngle();
        if (animRaf) return;
        let last = performance.now();
        const step = (now) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const acc = 60 * (target - angle) - 7 * vel;
            vel += acc * dt;
            angle += vel * dt;
            positionParts();
            if (Math.abs(target - angle) < 0.02 && Math.abs(vel) < 0.05) {
                angle = target; vel = 0; positionParts(); animRaf = null; return;
            }
            animRaf = requestAnimationFrame(step);
        };
        animRaf = requestAnimationFrame(step);
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function renderInfo() {
        const L = sum(plates.L), R = sum(plates.R);
        const empty = !plates.L.length && !plates.R.length;
        tiltTxt.textContent = empty ? '' : L === R ? '⚖️ Équilibre' : (L > R ? '⬅ La balance penche à gauche' : 'La balance penche à droite ➡');
        if (empty) eqEl.innerHTML = '<span class="tot">Posez des étiquettes sur les plateaux.</span>';
        else {
            const sym = L === R ? '=' : (L < R ? '<' : '>');
            const tl = showTot ? totText(plates.L) : '', tr = showTot ? totText(plates.R) : '';
            eqEl.innerHTML = `${sideText(plates.L)} <span class="sym${sym === '=' ? '' : ' ne'}">${sym}</span> ${sideText(plates.R)}` +
                (tl && tr && (plates.L.length > 1 || plates.R.length > 1) ? `<br><span class="tot">${_balEsc(tl)} ${sym} ${_balEsc(tr)}</span>` : '');
        }
        if (msg) { msgEl.style.display = ''; msgEl.className = 'bal-msg ' + (msg.cls || ''); msgEl.innerHTML = msg.html; }
        else if (defi && !defi.solved) {
            msgEl.style.display = ''; msgEl.className = 'bal-msg';
            msgEl.innerHTML = L === R ? '⚖️ La balance est en équilibre.' : (L > R ? '⬅ Le plateau de gauche est plus lourd.' : '➡ Le plateau de droite est plus lourd.');
        } else msgEl.style.display = 'none';
    }
    function renderControls() {
        badge.textContent = BAL_MODES[mode].nom + (defi ? ' · ' + BAL_LEVELS[level].label : ' · libre');
        tabs.querySelectorAll('.bal-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        tabs.querySelectorAll('.bal-level-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.level === level);
            b.title = BAL_LEVEL_TITLES[mode][b.dataset.level];
        });
        actions.querySelectorAll('[data-side]').forEach(b => b.classList.toggle('on', b.dataset.side === side));
        totBtn.classList.toggle('on', showTot);
        answerRow.classList.toggle('show', mode === 'eq' && (plates.L.some(it => it.k === 'x') || plates.R.some(it => it.k === 'x')));
    }
    function renderAll() {
        renderControls();
        renderPlates();
        renderInfo();
        animate();
        fitEq();
    }
    function fitEq() {
        const w = stage.clientWidth;
        if (w) eqEl.style.fontSize = Math.max(16, Math.min(40, w / 28)) + 'px';
    }

    // ── Glisser-déposer ───────────────────────────────────────────────────
    function svgPoint(x, y) {
        const p = svg.createSVGPoint();
        p.x = x; p.y = y;
        const m = svg.getScreenCTM();
        return m ? p.matrixTransform(m.inverse()) : { x: -1, y: -1 };
    }
    function dropSide(x, y) {
        const r = svg.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
        return svgPoint(x, y).x < 500 ? 'L' : 'R';
    }
    let drag = null;
    function startDrag(e, info) {
        drag = Object.assign({ x0: e.clientX, y0: e.clientY, pid: e.pointerId, moved: false, ghost: null }, info);
        document.addEventListener('pointermove', onMove, { passive: false });
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    }
    function onMove(e) {
        if (!drag || e.pointerId !== drag.pid) return;
        if (!drag.moved) {
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
            drag.moved = true;
            const g = document.createElement('div');
            g.className = 'bal-ghost';
            g.innerHTML = drag.html;
            document.body.appendChild(g);
            drag.ghost = g;
        }
        e.preventDefault();
        drag.ghost.style.left = e.clientX + 'px';
        drag.ghost.style.top = e.clientY + 'px';
    }
    function onUp(e) {
        if (!drag || (e && e.pointerId !== drag.pid)) return;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        const d = drag;
        drag = null;
        if (d.ghost) d.ghost.remove();
        const to = e && e.type === 'pointerup' ? dropSide(e.clientX, e.clientY) : null;
        if (d.from) {
            // Étiquette déjà sur un plateau
            if (!d.moved) { removeItem(d.from, d.id); return; }
            if (!to) removeItem(d.from, d.id);
            else if (to !== d.from) moveItem(d.from, d.id, to);
        } else {
            // Étiquette de la palette
            if (!d.moved) addItem(side, itemFromCode(d.code));
            else if (to) addItem(to, itemFromCode(d.code));
        }
    }

    palette.addEventListener('pointerdown', (e) => {
        const c = e.target.closest('[data-add]');
        if (!c || e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        startDrag(e, { code: c.dataset.add, html: c.outerHTML });
    });
    svg.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const g = e.target.closest('.item');
        if (!g || e.button > 0) return;
        e.preventDefault();
        const s = g.dataset.side, id = +g.dataset.id;
        const it = plates[s].find(x => x.id === id);
        if (!it) return;
        const chip = it.k === 'w' ? `<span class="bal-chip w">${_balFmtMass(it.v)}</span>`
            : it.k === 'x' ? `<span class="bal-chip x">${showX ? it.v : '?'}</span>`
            : it.k === 'o' ? `<span style="font-size:48px">${it.e}</span>`
            : `<span class="bal-chip" style="background:${_balNumColor(it.v)}">${it.v}</span>`;
        startDrag(e, { from: s, id, html: chip });
    });

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-mode],[data-level],[data-side]');
        if (!b || !container.contains(b) || svg.contains(b)) return;
        if (b.dataset.mode) {
            if (b.dataset.mode === mode) return;
            mode = b.dataset.mode;
            freeMode();
            return;
        }
        if (b.dataset.level) { level = b.dataset.level; newDefi(); return; }
        if (b.dataset.side) { side = b.dataset.side; renderControls(); save(); return; }
        switch (b.dataset.act) {
            case 'defi':      newDefi(); break;
            case 'libre':     freeMode(); break;
            case 'vider':
                plates.L = plates.L.filter(it => it.lock);
                plates.R = plates.R.filter(it => it.lock);
                if (defi) defi.solved = false;
                afterChange();
                break;
            case 'totaux':    showTot = !showTot; renderAll(); save(); break;
            case 'add-other': addOther(); break;
            case 'check':     checkAnswer(); break;
            case 'show-x':
                showX = !showX;
                if (showX) msg = { cls: 'warn', html: `👁 Chaque boîte <b style="color:#9333ea">?</b> vaut <b>${eqX}</b>.` };
                else msg = null;
                renderAll(); save();
                break;
        }
    });
    answerInput.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') checkAnswer(); });
    answerInput.addEventListener('click', (e) => { e.stopPropagation(); answerInput.focus(); });

    [stage, palette, actions, tabs, answerRow, msgEl, eqEl].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la balance) ─────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(200, startH + y - y0) + 'px';
            fitEq();
        };
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const move = startResize(e.clientX, e.clientY);
        document.onmousemove = (ev) => move(ev.clientX, ev.clientY);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const move = startResize(t0.clientX, t0.clientY);
        function onMoveT(ev) { const t = ev.touches[0]; move(t.clientX, t.clientY); }
        function onEnd() {
            document.removeEventListener('touchmove', onMoveT);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMoveT, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); return; }
        fitEq();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '⚖️ La balance à plateaux', { onExpand: () => requestAnimationFrame(fitEq) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(fitEq);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = stage.style.height;
            container.classList.add('wf-fullboard');
            stage.style.height = Math.round(window.innerHeight * 0.5) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
        }
        requestAnimationFrame(fitEq);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        window.removeEventListener('resize', onWinResize);
        if (animRaf) cancelAnimationFrame(animRaf);
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Au départ : un premier défi de nombres
    newDefi();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;
    const cleanItems = (arr) => arr.map(it => ({ k: it.k, v: it.v, lock: !!it.lock, e: it.e, nom: it.nom }));

    widget._balGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        mode, level, side, showTot, showX, eqX,
        plates: { L: cleanItems(plates.L), R: cleanItems(plates.R) },
        defi: defi ? JSON.parse(JSON.stringify(defi)) : null,
        msg,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_balIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._balSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_balIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        mode  = BAL_MODES[d.mode] ? d.mode : 'nombres';
        level = BAL_LEVELS[d.level] ? String(d.level) : '1';
        side  = d.side === 'L' ? 'L' : 'R';
        showTot = d.showTot !== false;
        showX = !!d.showX;
        eqX = Number.isFinite(d.eqX) ? d.eqX : 5;
        const okItem = it => it && ['n', 'w', 'x', 'o'].includes(it.k) && Number.isFinite(it.v) && it.v >= 0;
        const load = arr => (Array.isArray(arr) ? arr.filter(okItem).slice(0, 30) : []).map(it =>
            mk(it.k, it.k === 'x' ? eqX : it.v, { lock: !!it.lock, e: it.e, nom: it.nom }));
        plates = { L: load(d.plates && d.plates.L), R: load(d.plates && d.plates.R) };
        defi = d.defi && typeof d.defi === 'object' ? d.defi : null;
        msg = d.msg && typeof d.msg.html === 'string' ? d.msg : null;
        renderPalette();
        angle = targetAngle(); vel = 0;
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fitEq, 250);
    };

    saveBoard();
    return widget;
}

// ── Curseurs : flèche par défaut, main qui attrape sur la barre du haut (déplacement),
//    doigt qui pointe sur tout ce qui est cliquable. ──
(function () {
    if (typeof document === 'undefined' || document.getElementById('curseurs-balance')) return;
    const st = document.createElement('style');
    st.id = 'curseurs-balance';
    st.textContent = `
.widget[data-type="balance"] { cursor: default; }
.widget[data-type="balance"] .bal-header { cursor: grab; }
.widget[data-type="balance"] .bal-header:active { cursor: grabbing; }
.widget[data-type="balance"] .wf-fullboard .bal-header, .widget[data-type="balance"] .tnum-fullboard .bal-header, .widget[data-type="balance"] .s3d-fullboard .bal-header, .widget[data-type="balance"] .wf-fullboard .bal-header:active, .widget[data-type="balance"] .tnum-fullboard .bal-header:active, .widget[data-type="balance"] .s3d-fullboard .bal-header:active { cursor: default; }
.widget[data-type="balance"] .bal-header :is(button, select, .wf-btn, [role="button"]) { cursor: pointer; }
:where(.widget[data-type="balance"]) :where(button, select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="color"]) { cursor: pointer; }
.widget[data-type="balance"] :is(input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"]) { cursor: pointer; }
.widget[data-type="balance"] :is(button, select, input, textarea):disabled { cursor: default !important; }
.widget[data-type="balance"] .wf-mini-bar { cursor: grab !important; }
.widget[data-type="balance"] .wf-mini-bar:active { cursor: grabbing !important; }
.widget[data-type="balance"] .wf-mini-bar :is(button, .wf-btn) { cursor: pointer !important; }
`;
    (document.head || document.documentElement).appendChild(st);
})();
