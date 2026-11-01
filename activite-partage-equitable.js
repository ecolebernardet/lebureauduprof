// =========================================================================
// WIDGET LE PARTAGE ÉQUITABLE — Le Bureau du Prof
// Des jetons (ou bonbons, billes, pommes) à distribuer dans des boîtes.
// Chaque boîte doit en recevoir autant : ce qui ne peut plus être partagé
// reste à côté. On donne ainsi du sens à la division et au reste :
//      17 ÷ 5 = 3, reste 2     17 = (5 × 3) + 2     (le reste est plus petit que 5)
//
// Trois façons de jouer :
//   🤲 Partager     : N jetons entre K boîtes → combien dans chaque boîte ? (division-partage)
//   📦 Faire des paquets : N jetons, des boîtes de C → combien de boîtes pleines ? (division-groupement)
//   🎯 Défi         : la classe prévoit d'abord la part et le reste, puis on vérifie en distribuant.
//
// Manipulations : faire glisser un jeton dans une boîte, cliquer sur un jeton
// de la réserve (il va dans la boîte la moins remplie), cliquer sur un jeton
// d'une boîte (il revient dans la réserve), ou « Distribuer un tour » /
// « Tout distribuer ».
//
// Même fenêtre que « L'atelier de phrases » : redimensionnement libre,
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

    if (document.getElementById('peq-style')) return;
    const s = document.createElement('style');
    s.id = 'peq-style';
    s.textContent = `
        .widget[data-type="partage-equitable"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .peq-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 9px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .peq-container input { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .peq-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .peq-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .peq-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #fdecd8; color: #9a4a00; }

        /* Réduit / plein écran */
        .peq-container.wf-minimized > *:not(.peq-header) { display: none !important; }
        .peq-container.wf-minimized { gap: 0; }
        .peq-container.wf-fullboard {
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
            .peq-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .peq-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .peq-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s, box-shadow .15s;
        }
        .peq-btn:active { transform: scale(0.96); }
        .peq-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .peq-btn-blue  { background: #4a90e2; color: #fff; }
        .peq-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .peq-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .peq-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .peq-btn-green { background: #28a745; color: #fff; }
        .peq-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .peq-btn-orange { background: #f59e0b; color: #fff; }
        .peq-btn-orange:hover:not(:disabled) { background: #d97706; }
        .peq-btn.on    { background: #fdecd8; color: #9a4a00; border: 1px solid #f3c79a; }
        .peq-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .peq-tab {
            padding: 5px 10px; border-radius: 8px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 11px; font-weight: 800; cursor: pointer; color: #555;
        }
        .peq-tab:hover { background: #e9e9e9; }
        .peq-tab.active { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .peq-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; align-items: center; }
        .peq-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .peq-level-btn:hover { background: #e0e0e0; }
        .peq-level-btn.active { background: #fdecd8; color: #9a4a00; border-color: #f3c79a; }
        .peq-theme {
            padding: 3px 6px; border-radius: 6px; border: 1px solid #ddd; background: #fff;
            font-size: 11px; font-weight: 700; color: #444; cursor: pointer;
        }

        /* Réglages et actions */
        .peq-tools {
            display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .peq-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .peq-step { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #4b5563; }
        .peq-step button {
            width: 24px; height: 24px; border-radius: 7px; border: 1px solid #ccc; background: #fff;
            font-size: 15px; font-weight: 800; color: #374151; cursor: pointer; line-height: 1; padding: 0;
            touch-action: manipulation;
        }
        .peq-step button:hover { background: #eef2f7; }
        .peq-step b {
            min-width: 30px; text-align: center; font-size: 16px; color: #111827;
            background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1px 4px;
        }

        /* Consigne / prévision */
        .peq-task {
            display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
            padding: 8px 12px; border-radius: 10px; background: #f0f7ff; border: 1px solid #cfe2fb;
            font-size: 15px; color: #1e3a5f; line-height: 1.35;
        }
        .peq-task:empty { display: none; }
        .peq-task .peq-big { font-size: 22px; font-weight: 900; color: #1d4ed8; }
        .peq-pred { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; font-weight: 700; }
        .peq-pred input {
            width: 58px; padding: 4px 6px; border: 2px solid #c7d7ee; border-radius: 8px;
            font-size: 18px; font-weight: 800; text-align: center; outline: none; color: #111827;
        }
        .peq-pred input:focus { border-color: #4a90e2; }
        .peq-pred input.ok { border-color: #16a34a; background: #f0fff4; }
        .peq-pred input.ko { border-color: #dc2626; background: #fff1f1; }

        /* La scène */
        .peq-stage-wrap { position: relative; flex-shrink: 0; }
        .peq-stage {
            --u: 26px;
            display: flex; flex-direction: column; gap: 8px; height: 320px;
            box-sizing: border-box; overflow: hidden;
        }
        .peq-pot {
            flex: 0 0 auto; display: flex; flex-direction: column; border-radius: 12px;
            border: 2px dashed #f59e0b; background: #fffbeb; min-height: 0;
            transition: box-shadow .12s, background .2s, border-color .2s;
        }
        .peq-pot.rest { border-style: solid; border-color: #dc2626; background: #fff1f1; }
        .peq-pot.over { box-shadow: 0 0 0 3px #f59e0b; }
        .peq-pot-head, .peq-box-head {
            display: flex; align-items: center; gap: 6px; padding: 3px 8px;
            font-size: 12px; font-weight: 800; color: #92400e; white-space: nowrap;
        }
        .peq-pot.rest .peq-pot-head { color: #b91c1c; }
        .peq-num {
            min-width: 22px; padding: 0 7px; border-radius: 10px; background: #fff; border: 1.5px solid currentColor;
            text-align: center; line-height: 18px; font-size: 12px; font-weight: 900;
        }
        .peq-hide .peq-num { color: transparent !important; background: #e5e7eb; border-color: #d1d5db; }
        .peq-tokens {
            flex: 1; min-height: 0; overflow: hidden;
            display: flex; flex-wrap: wrap; align-content: flex-start; justify-content: center;
            gap: calc(var(--u) * .18); padding: calc(var(--u) * .25);
            font-size: var(--u);
        }
        .peq-boxes {
            flex: 1; min-height: 0; display: grid; gap: 8px;
            grid-auto-rows: minmax(0, 1fr);
        }
        .peq-box {
            display: flex; flex-direction: column; min-width: 0; min-height: 0;
            border-radius: 12px; border: 2.5px solid #93c5fd; background: #eff6ff;
            transition: box-shadow .12s, border-color .2s, background .2s;
        }
        .peq-box .peq-box-head { color: #1d4ed8; }
        .peq-box.over { box-shadow: 0 0 0 3px #3b82f6; }
        .peq-box.over-bad { box-shadow: 0 0 0 3px #dc2626; }
        .peq-box.eq  { border-color: #22c55e; background: #f0fdf4; }
        .peq-box.eq .peq-box-head { color: #15803d; }
        .peq-box.neq { border-color: #f87171; background: #fff5f5; }
        .peq-box.neq .peq-box-head { color: #b91c1c; }
        .peq-box.full { border-color: #22c55e; background: #f0fdf4; }
        .peq-box.full .peq-box-head { color: #15803d; }
        .peq-box.newbox {
            border-style: dashed; border-color: #c4c4c4; background: #fafafa;
            align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; font-weight: 800; text-align: center;
        }
        .peq-box.newbox.over { border-color: #3b82f6; color: #1d4ed8; }
        .peq-box-ico { font-size: 14px; }
        .peq-box-head .peq-lbl { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .peq-box-head { overflow: hidden; }
        .peq-stage.narrow .peq-box-ico { display: none; }
        .peq-stage.narrow .peq-box-head { gap: 3px; padding: 3px 4px; font-size: 11px; }
        .peq-stage.narrow .peq-num { padding: 0 4px; min-width: 16px; }

        /* Les jetons (1em = taille d'un jeton) */
        .peq-t {
            width: 1em; height: 1em; flex-shrink: 0; position: relative; touch-action: none;
            display: flex; align-items: center; justify-content: center; cursor: grab;
            transition: transform .12s, filter .12s;
        }
        .peq-t:hover { transform: scale(1.12); }
        .peq-t svg { width: 100%; height: 100%; display: block; }
        .peq-t .peq-emo { font-size: .86em; line-height: 1; pointer-events: none; }
        .peq-t.dragging { opacity: .25; }
        .peq-t.new { animation: peqPop .35s ease-out; }
        @keyframes peqPop { 0% { transform: scale(.2); opacity: 0; } 70% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }
        .peq-ghost {
            position: fixed; z-index: 100000; pointer-events: none;
            transform: scale(1.15); filter: drop-shadow(0 5px 8px rgba(0,0,0,.3));
        }
        .peq-ghost .peq-t:hover { transform: none; }

        /* Le résultat */
        .peq-result {
            display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: center;
            padding: 6px 10px; border-radius: 10px; background: #f8fafc; border: 1px solid #e5e7eb;
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: 22px; font-weight: 900; color: #1f2937;
        }
        .peq-result:empty { display: none; }
        .peq-result .q { color: #15803d; }
        .peq-result .r { color: #b91c1c; }
        .peq-result .k { color: #1d4ed8; }
        .peq-result .sep { width: 2px; height: 26px; background: #e5e7eb; }
        .peq-result small { font-size: 13px; font-weight: 700; color: #6b7280; }

        /* Commentaire */
        .peq-verdict {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
            animation: peqFade .3s ease-out;
        }
        .peq-verdict.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .peq-verdict.ko   { background: #fff1f1; border-color: #f5c2c2; color: #7f1d1d; }
        .peq-verdict.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        @keyframes peqFade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Aide */
        .peq-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .peq-help-btn:hover { background: #e0e0e0; color: #333; }
        .peq-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 350px; max-width: calc(100% - 20px); font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .peq-help-popup.show { display: block; }
        .peq-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .peq-help-popup p { margin: 0 0 6px; }
        .peq-help-popup p:last-child { margin-bottom: 0; }

        .peq-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .peq-container:hover .peq-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Thèmes ────────────────────────────────────────────────────────────────
const PEQ_THEMES = {
    // f : la boîte est féminine (accords : une / un, pleine / plein, toutes / tous…)
    jetons:  { label: '🔴 Jetons',  tok: 'jeton',  toks: 'jetons',  box: 'boîte',  boxes: 'boîtes',  Box: 'Boîte',  each: 'dans chaque boîte',  ico: '📦', emo: null,  f: true },
    bonbons: { label: '🍬 Bonbons', tok: 'bonbon', toks: 'bonbons', box: 'enfant', boxes: 'enfants', Box: 'Enfant', each: 'pour chaque enfant', ico: '🧒', emo: '🍬', f: false },
    billes:  { label: '🔵 Billes',  tok: 'bille',  toks: 'billes',  box: 'sachet', boxes: 'sachets', Box: 'Sachet', each: 'dans chaque sachet', ico: '👝', emo: null,  f: false },
    pommes:  { label: '🍎 Pommes',  tok: 'pomme',  toks: 'pommes',  box: 'panier', boxes: 'paniers', Box: 'Panier', each: 'dans chaque panier', ico: '🧺', emo: '🍎', f: false }
};

const PEQ_MODES = {
    partage: { label: '🤲 Partager' },
    paquets: { label: '📦 Faire des paquets' },
    defi:    { label: '🎯 Défi' }
};

// Niveaux du défi
const PEQ_LEVELS = {
    '1': { label: 'Jusqu\'à 20',  nMax: 20,  kMin: 2, kMax: 5 },
    '2': { label: 'Jusqu\'à 50',  nMax: 50,  kMin: 2, kMax: 9 },
    '3': { label: 'Jusqu\'à 100', nMax: 100, kMin: 3, kMax: 10 }
};

const PEQ_N_MAX = 100;   // jetons au maximum
const PEQ_K_MAX = 10;    // boîtes au maximum (partage)
const PEQ_C_MIN = 2, PEQ_C_MAX = 10;   // taille des paquets

function _peqTokenSvg(theme) {
    if (theme === 'billes') {
        return `<svg viewBox="0 0 20 20"><defs><radialGradient id="peqB" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#bfdbfe"/><stop offset=".55" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></radialGradient></defs>` +
               `<circle cx="10" cy="10" r="9" fill="url(#peqB)"/><ellipse cx="7" cy="6.5" rx="2.6" ry="1.6" fill="#fff" opacity=".75"/></svg>`;
    }
    return `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#ef4444" stroke="#b91c1c" stroke-width="1.4"/>` +
           `<circle cx="10" cy="10" r="5.6" fill="none" stroke="#fecaca" stroke-width="1.2" stroke-dasharray="2 1.6"/>` +
           `<circle cx="7.2" cy="6.6" r="1.6" fill="#fff" opacity=".6"/></svg>`;
}

function _peqRand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function _peqPl(n, sing, plur) { return n + ' ' + (n > 1 ? plur : sing); }

function _peqIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createPartageEquitableWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'partage-equitable';
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
    container.className = 'peq-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'peq-header';
    header.innerHTML = `
        <span class="peq-title">🤲 Le partage équitable</span>
        <span class="peq-badge">Partager</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.peq-badge');
    container.appendChild(header);

    // ── Façons de jouer, niveau, thème ────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'peq-row';
    controls.innerHTML = `
        <div class="peq-tabs">
            ${Object.keys(PEQ_MODES).map(k => `<button class="peq-tab" data-tab="${k}">${PEQ_MODES[k].label}</button>`).join('')}
        </div>
        <div class="peq-level-btns">
            ${Object.keys(PEQ_LEVELS).map(k => `<button class="peq-level-btn" data-level="${k}" title="Nombres tirés au hasard ${PEQ_LEVELS[k].label.toLowerCase()}">${PEQ_LEVELS[k].label}</button>`).join('')}
            <select class="peq-theme" title="Ce que l'on partage">
                ${Object.keys(PEQ_THEMES).map(k => `<option value="${k}">${PEQ_THEMES[k].label}</option>`).join('')}
            </select>
        </div>
    `;
    const themeSel = controls.querySelector('.peq-theme');
    container.appendChild(controls);

    // ── Réglages et actions ───────────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'peq-tools';
    container.appendChild(tools);

    // ── Consigne / prévision ──────────────────────────────────────────────
    const task = document.createElement('div');
    task.className = 'peq-task';
    container.appendChild(task);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stageWrap = document.createElement('div');
    stageWrap.className = 'peq-stage-wrap';
    const stage = document.createElement('div');
    stage.className = 'peq-stage';
    stage.style.height = Math.round(initH * 0.55) + 'px';
    stageWrap.appendChild(stage);
    container.appendChild(stageWrap);

    const resultEl = document.createElement('div');
    resultEl.className = 'peq-result';
    container.appendChild(resultEl);

    const verdictEl = document.createElement('div');
    verdictEl.className = 'peq-verdict';
    container.appendChild(verdictEl);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'peq-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'peq-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le partage équitable</h4>
        <p><b>Distribuer</b> : faites glisser un jeton de la réserve dans une boîte, ou cliquez sur un jeton de la
        réserve (il va dans la boîte la moins remplie). Un clic sur un jeton d'une boîte le remet dans la réserve.
        <b>Distribuer un tour</b> donne un jeton à chaque boîte ; <b>Tout distribuer</b> continue tant que c'est possible.</p>
        <p>Les boîtes deviennent <b>vertes</b> quand elles ont toutes autant de jetons, <b>rouges</b> sinon.
        Quand il ne reste plus assez de jetons pour en donner un à chaque boîte, la réserve devient le <b>reste</b>.</p>
        <p><b>🤲 Partager</b> : N jetons entre K boîtes → combien dans chaque boîte ?
        <b>📦 Faire des paquets</b> : N jetons, des boîtes de C → combien de boîtes pleines ?
        Dans les deux cas, on obtient <b>N = (K × part) + reste</b>, avec un reste plus petit que K.</p>
        <p><b>🎯 Défi</b> : la classe écrit d'abord sa prévision (la part et le reste), puis on vérifie en distribuant.</p>
        <p><b>👁 Nombres</b> masque les compteurs pour faire compter les élèves.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'peq-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let mode = 'partage';
    let level = '1';
    let theme = 'jetons';
    let n = 17, k = 5, c = 4;   // jetons, boîtes (partage), taille des paquets
    let pot = n;                // jetons dans la réserve
    let boxes = [];             // nombre de jetons dans chaque boîte
    let pred = { q: '', r: '', checked: false };
    let showNum = true;
    let history = [];
    let verdict = null;
    let busy = false;
    let flash = new Set();      // 'pot' ou index de boîte qui vient de recevoir un jeton

    const T = () => PEQ_THEMES[theme];
    // Petits mots accordés au genre de la boîte
    const G = (fem, masc) => (T().f ? fem : masc);
    const UNE = () => G('une', 'un');
    const PLEINE = (n) => G('pleine', 'plein') + (n > 1 ? 's' : '');
    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function say(cls, html) { verdict = { cls, html }; }
    function isPartage() { return mode === 'partage' || mode === 'defi'; }
    function nb() { return isPartage() ? k : c; }    // diviseur
    function snap() { return { pot, boxes: boxes.slice() }; }
    function pushHistory() { history.push(snap()); if (history.length > 200) history.shift(); }

    function resetDistribution() {
        pot = n;
        boxes = isPartage() ? new Array(k).fill(0) : [];
        history = [];
        verdict = null;
    }

    function newRandom() {
        const lv = PEQ_LEVELS[level];
        if (isPartage()) {
            k = _peqRand(lv.kMin, lv.kMax);
            n = _peqRand(k + 1, lv.nMax);
        } else {
            c = _peqRand(Math.max(PEQ_C_MIN, lv.kMin), lv.kMax);
            n = _peqRand(c + 1, lv.nMax);
        }
        pred = { q: '', r: '', checked: false };
        resetDistribution();
    }

    // ── Analyse ───────────────────────────────────────────────────────────
    function allEqual() { return boxes.length > 0 && boxes.every(x => x === boxes[0]); }
    function finished() {
        if (isPartage()) return pot < k && allEqual();
        return pot < c && boxes.every(x => x === c);
    }
    function partialBox() { return boxes.findIndex(x => x < c); }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function tokenHTML(fl) {
        const t = T();
        const inner = t.emo ? `<span class="peq-emo">${t.emo}</span>` : _peqTokenSvg(theme);
        return `<div class="peq-t${fl ? ' new' : ''}">${inner}</div>`;
    }
    function tokensHTML(count, newFrom) {
        let h = '';
        for (let i = 0; i < count; i++) h += tokenHTML(newFrom != null && i >= newFrom);
        return h;
    }

    function renderTools() {
        const t = T();
        let html = '';
        if (mode !== 'defi') {
            html += `<span class="peq-step" title="Nombre de ${t.toks}">${t.toks.charAt(0).toUpperCase() + t.toks.slice(1)} :
                        <button data-step="n" data-d="-1">−</button><b>${n}</b><button data-step="n" data-d="1">+</button></span>`;
            if (mode === 'partage') {
                html += `<span class="peq-step" title="Nombre de ${t.boxes}">${t.boxes.charAt(0).toUpperCase() + t.boxes.slice(1)} :
                        <button data-step="k" data-d="-1">−</button><b>${k}</b><button data-step="k" data-d="1">+</button></span>`;
            } else {
                html += `<span class="peq-step" title="Nombre de ${t.toks} par ${t.box}">Par ${t.box} :
                        <button data-step="c" data-d="-1">−</button><b>${c}</b><button data-step="c" data-d="1">+</button></span>`;
            }
            html += `<button class="peq-btn peq-btn-grey" data-act="random" title="Des nombres au hasard">🎲 Au hasard</button>`;
        } else {
            html += `<button class="peq-btn peq-btn-blue" data-act="random" title="Un nouveau défi">🎲 Nouveau défi</button>`;
        }
        html += `<span class="peq-sep"></span>`;
        if (isPartage()) {
            html += `<button class="peq-btn peq-btn-orange" data-act="round" title="Donner un ${t.tok} à chaque ${t.box}">🔁 Distribuer un tour</button>
                     <button class="peq-btn peq-btn-green" data-act="all" title="Distribuer tant que c'est possible">⏩ Tout distribuer</button>`;
        } else {
            html += `<button class="peq-btn peq-btn-orange" data-act="round" title="Remplir ${UNE()} ${t.box} de ${c}">📦 Remplir ${UNE()} ${t.box}</button>
                     <button class="peq-btn peq-btn-green" data-act="all" title="Remplir des ${t.boxes} tant que c'est possible">⏩ Tout remplir</button>`;
        }
        html += `<span class="peq-sep"></span>
                 <button class="peq-btn peq-btn-grey" data-act="undo" title="Annuler le dernier geste" ${history.length && !busy ? '' : 'disabled'}>↩ Annuler</button>
                 <button class="peq-btn peq-btn-grey" data-act="reset" title="Tout remettre dans la réserve" ${pot !== n && !busy ? '' : 'disabled'}>🔄 Recommencer</button>
                 <button class="peq-btn peq-btn-grey ${showNum ? 'on' : ''}" data-act="toggle-num" title="Afficher ou masquer les compteurs">👁 Nombres</button>`;
        tools.innerHTML = html;
    }

    function renderTask() {
        const t = T();
        if (mode === 'defi') {
            const qc = pred.checked ? (String(parseInt(pred.q, 10)) === String(Math.floor(n / k)) ? 'ok' : 'ko') : '';
            const rc = pred.checked ? (String(parseInt(pred.r, 10)) === String(n % k) ? 'ok' : 'ko') : '';
            task.innerHTML = `<span>On partage</span><span class="peq-big">${_peqPl(n, t.tok, t.toks)}</span>
                <span>entre</span><span class="peq-big">${_peqPl(k, t.box, t.boxes)}</span>.
                <span class="peq-pred">Ma prévision : ${t.each}
                    <input type="text" inputmode="numeric" maxlength="3" data-pred="q" class="${qc}" value="${pred.q}">
                    , il reste <input type="text" inputmode="numeric" maxlength="3" data-pred="r" class="${rc}" value="${pred.r}">
                    <button class="peq-btn peq-btn-green" data-act="check">✔ Vérifier</button></span>`;
        } else if (mode === 'paquets') {
            task.innerHTML = `<span>On range</span><span class="peq-big">${_peqPl(n, t.tok, t.toks)}</span>
                <span>par</span><span class="peq-big">${c}</span><span>: combien de ${t.boxes} ${PLEINE(2)} ?</span>`;
        } else {
            task.innerHTML = `<span>On partage</span><span class="peq-big">${_peqPl(n, t.tok, t.toks)}</span>
                <span>entre</span><span class="peq-big">${_peqPl(k, t.box, t.boxes)}</span><span>: combien ${t.each} ?</span>`;
        }
    }

    function renderStage(flashFrom) {
        flashFrom = flashFrom || {};
        const t = T();
        stage.classList.toggle('peq-hide', !showNum);
        const isRest = isPartage() ? pot < k && allEqual() : pot < c && (boxes.length === 0 || partialBox() === -1);
        let html = `<div class="peq-pot${isRest ? ' rest' : ''}" data-zone="pot">
            <div class="peq-pot-head">${isRest ? '🧺 Reste' : '🫙 Réserve'} <span class="peq-num">${pot}</span>
            ${isRest && pot > 0 ? `<span style="font-weight:700">: on ne peut plus ${isPartage() ? 'en donner un à chaque ' + t.box : 'remplir ' + UNE() + ' ' + t.box + ' de ' + c}</span>` : ''}</div>
            <div class="peq-tokens">${tokensHTML(pot, flashFrom.pot)}</div></div>`;
        const eq = isPartage() && allEqual() && boxes.some(x => x > 0);
        const nbBoxes = boxes.length + (isPartage() ? 0 : 1);
        const narrow = stage.clientWidth < 520;
        stage.classList.toggle('narrow', narrow);
        const perRow = Math.min(Math.max(nbBoxes, 1), narrow ? 3 : 5);
        html += `<div class="peq-boxes" style="grid-template-columns:repeat(${perRow}, minmax(0,1fr))">`;
        boxes.forEach((cnt, i) => {
            let cls = '';
            if (isPartage()) {
                // Vert : toutes égales. Rouge : partage déséquilibré (écart de plus d'un jeton,
                // ou distribution impossible à terminer) → on marque les boîtes qui en ont trop.
                const mx = Math.max(...boxes), mn = Math.min(...boxes);
                if (eq) cls = ' eq';
                else if ((mx - mn > 1 || pot < k) && cnt === mx) cls = ' neq';
            } else cls = cnt === c ? ' full' : '';
            html += `<div class="peq-box${cls}" data-zone="box" data-i="${i}">
                <div class="peq-box-head"><span class="peq-box-ico">${t.ico}</span><span class="peq-lbl">${t.Box} ${i + 1}</span>
                <span class="peq-num" style="margin-left:auto">${cnt}${isPartage() ? '' : '/' + c}</span></div>
                <div class="peq-tokens">${tokensHTML(cnt, flashFrom['b' + i])}</div></div>`;
        });
        if (!isPartage()) {
            html += `<div class="peq-box newbox" data-zone="new">＋<br>${G('nouvelle', 'nouveau')} ${t.box}<br><small>de ${c}</small></div>`;
        }
        html += '</div>';
        stage.innerHTML = html;
    }

    function renderResult() {
        const t = T();
        if (!finished()) { resultEl.innerHTML = ''; return; }
        const d = nb();
        const q = isPartage() ? boxes[0] : boxes.length;
        const r = pot;
        if (mode === 'defi' && !pred.checked) {
            resultEl.innerHTML = '<small>Distribution terminée : cliquez sur <b>✔ Vérifier</b> pour comparer avec votre prévision.</small>';
            return;
        }
        if (isPartage()) {
            resultEl.innerHTML = `<span>${n} ÷ <span class="k">${d}</span> = <span class="q">${q}</span>${r ? ` <small>reste</small> <span class="r">${r}</span>` : ''}</span>
                <span class="sep"></span>
                <span>${n} = (<span class="k">${d}</span> × <span class="q">${q}</span>)${r ? ` + <span class="r">${r}</span>` : ''}</span>`;
        } else {
            resultEl.innerHTML = `<span>${n} ÷ <span class="k">${d}</span> = <span class="q">${q}</span>${r ? ` <small>reste</small> <span class="r">${r}</span>` : ''}</span>
                <span class="sep"></span>
                <span>${n} = (<span class="q">${q}</span> × <span class="k">${d}</span>)${r ? ` + <span class="r">${r}</span>` : ''}</span>`;
        }
    }

    function autoVerdict() {
        const t = T();
        if (isPartage()) {
            const distributed = boxes.some(x => x > 0);
            if (!distributed) return { cls: '', html: `Distribuez les ${t.toks} : chaque ${t.box} doit en avoir <b>autant</b>.` };
            if (!allEqual()) {
                const mx = Math.max(...boxes), mn = Math.min(...boxes);
                if (pot === 0 || mx - mn > 1) return { cls: 'ko', html: `✗ Les ${t.boxes} n'ont pas ${G('toutes', 'tous')} autant de ${t.toks} (de ${mn} à ${mx}) : ce n'est pas un partage équitable.` };
                return { cls: '', html: `Continuez : ${G('certaines', 'certains')} ${t.boxes} ont ${_peqPl(mx, t.tok, t.toks)}, d'autres ${mn}.` };
            }
            if (pot >= k) return { cls: '', html: `Chaque ${t.box} a ${_peqPl(boxes[0], t.tok, t.toks)}. Il reste ${pot} ${t.toks} : assez pour en donner encore <b>un à chaque ${t.box}</b> !` };
            const q = boxes[0], r = pot;
            if (mode === 'defi' && !pred.checked) return { cls: '', html: `La distribution est finie. Comparez avec votre prévision !` };
            return { cls: 'ok', html: `✓ Partage équitable : ${_peqPl(q, t.tok, t.toks)} ${t.each}` +
                (r ? `, et il reste <b>${_peqPl(r, t.tok, t.toks)}</b>. On ne peut plus partager : ${r} est plus petit que ${k}.` : `, et il ne reste rien : ${n} se partage exactement en ${k}.`) };
        }
        // Paquets
        if (!boxes.length) return { cls: '', html: `Remplissez des ${t.boxes} de <b>${c} ${t.toks}</b> chacune.` };
        const pb = partialBox();
        if (pb !== -1) return { cls: '', html: `${t.Box} ${pb + 1} : ${boxes[pb]} sur ${c}. Continuez à la remplir.` };
        if (pot >= c) return { cls: '', html: `${_peqPl(boxes.length, t.box + ' ' + PLEINE(1), t.boxes + ' ' + PLEINE(2))}. Il reste ${pot} ${t.toks} : on peut encore remplir ${UNE()} ${t.box} !` };
        return { cls: 'ok', html: `✓ ${_peqPl(boxes.length, t.box + ' ' + PLEINE(1), t.boxes + ' ' + PLEINE(2))} de ${c}` +
            (pot ? `, et il reste <b>${_peqPl(pot, t.tok, t.toks)}</b> : pas assez pour ${UNE()} ${t.box} de plus.` : ', et il ne reste rien.') };
    }

    function renderVerdict() {
        const v = verdict || autoVerdict();
        verdictEl.className = 'peq-verdict ' + (v.cls || '');
        verdictEl.innerHTML = v.html;
    }

    function renderHeader() {
        badge.textContent = PEQ_MODES[mode].label.replace(/^\S+\s/, '') + (mode === 'defi' ? ' · ' + PEQ_LEVELS[level].label : '');
        controls.querySelectorAll('.peq-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === mode));
        controls.querySelectorAll('.peq-level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
        themeSel.value = theme;
    }

    function renderAll(flashFrom) {
        renderHeader();
        renderTools();
        renderTask();
        renderStage(flashFrom);
        renderResult();
        renderVerdict();
        requestAnimationFrame(fit);
    }

    // ── Taille des jetons ─────────────────────────────────────────────────
    function fit() {
        const sh = stage.clientHeight, sw = stage.clientWidth;
        if (!sh || !sw) return;
        const potEl = stage.querySelector('.peq-pot');
        const zones = Array.from(stage.querySelectorAll('.peq-tokens'));
        // La réserve prend une part de la hauteur selon son contenu
        const potShare = pot ? Math.min(0.42, 0.18 + pot / 260) : 0.16;
        if (potEl) potEl.style.height = Math.max(46, Math.round(sh * potShare)) + 'px';
        let u = Math.min(40, sh / 6);
        stage.style.setProperty('--u', u + 'px');
        const over = () => zones.some(z => z.scrollHeight > z.clientHeight + 1 || z.scrollWidth > z.clientWidth + 1);
        let guard = 0;
        while (over() && u > 6 && guard++ < 90) {
            u *= 0.93;
            stage.style.setProperty('--u', u + 'px');
        }
    }

    // ── Gestes ────────────────────────────────────────────────────────────
    function giveTo(i, silent) {
        if (pot <= 0) return false;
        if (!isPartage() && boxes[i] >= c) {
            if (!silent) { say('warn', `${T().Box} ${i + 1} est ${PLEINE(1)} : ${G('elle', 'il')} contient déjà ${c} ${T().toks}.`); renderVerdict(); }
            return false;
        }
        pot--; boxes[i]++;
        return true;
    }

    function tapPot() {
        if (busy || pot <= 0) return;
        let i;
        if (isPartage()) {
            const mn = Math.min(...boxes);
            i = boxes.indexOf(mn);
        } else {
            i = partialBox();
            if (i === -1) { boxes.push(0); i = boxes.length - 1; }
        }
        pushHistory();
        const before = boxes[i];
        giveTo(i);
        verdict = null;
        renderAll({ ['b' + i]: before });
        save();
    }

    function backToPot(i) {
        if (busy || !boxes[i]) return;
        pushHistory();
        boxes[i]--; pot++;
        if (!isPartage() && boxes[i] === 0) boxes.splice(i, 1);
        verdict = null;
        renderAll({ pot: pot - 1 });
        save();
    }

    function moveBetween(from, to) {
        if (from === to || !boxes[from]) return;
        if (!isPartage() && boxes[to] >= c) { say('warn', `${T().Box} ${to + 1} est ${PLEINE(1)}.`); renderVerdict(); return; }
        pushHistory();
        boxes[from]--; boxes[to]++;
        const before = boxes[to] - 1;
        if (!isPartage() && boxes[from] === 0) boxes.splice(from, 1);
        verdict = null;
        renderAll(isPartage() || from > to ? { ['b' + to]: before } : { ['b' + (to - 1)]: before });
        save();
    }

    // Un tour : un jeton à chaque boîte (partage) / remplir une boîte (paquets), animé
    function oneRound(cb) {
        const t = T();
        if (isPartage()) {
            // Si les boîtes sont différentes, le tour complète d'abord celles qui ont un jeton de moins
            const mx = Math.max(...boxes);
            let targets = boxes.map((x, i) => i).filter(i => boxes[i] < mx);
            if (!targets.length) targets = boxes.map((x, i) => i);
            const missing = targets.reduce((s, i) => s + (Math.max(mx, boxes[i] + 1) - boxes[i]), 0);
            if (pot < missing || pot === 0) {
                if (!cb) {
                    say('warn', allEqual()
                        ? `Il reste ${pot} ${t.toks} : pas assez pour en donner un à ${G('chacune', 'chacun')} des ${k} ${t.boxes}. C'est le <b>reste</b>.`
                        : `Il reste ${pot} ${t.toks} : pas assez pour que toutes les ${t.boxes} en aient autant. Reprenez des ${t.toks} pour équilibrer.`);
                    renderVerdict();
                }
                cb && cb(false);
                return;
            }
            pushHistory();
            busy = true;
            let j = 0;
            const goal = targets.length === k && boxes.every(x => x === mx) ? mx + 1 : mx;
            const step = () => {
                while (j < targets.length && boxes[targets[j]] >= goal) j++;
                if (j >= targets.length || pot <= 0) { busy = false; verdict = null; renderAll(); save(); cb && cb(true); return; }
                const i = targets[j];
                const before = boxes[i];
                pot--; boxes[i]++;
                renderAll({ ['b' + i]: before });
                setTimeout(step, Math.max(40, 260 / k));
            };
            step();
        } else {
            let i = partialBox();
            const need = i === -1 ? c : c - boxes[i];
            if (pot < need) {
                if (!cb) { say('warn', `Il reste ${pot} ${t.toks} : pas assez pour remplir ${UNE()} ${t.box} de ${c}. C'est le <b>reste</b>.`); renderVerdict(); }
                cb && cb(false);
                return;
            }
            pushHistory();
            if (i === -1) { boxes.push(0); i = boxes.length - 1; }
            busy = true;
            const step = () => {
                if (boxes[i] >= c || pot <= 0) { busy = false; verdict = null; renderAll(); save(); cb && cb(true); return; }
                const before = boxes[i];
                pot--; boxes[i]++;
                renderAll({ ['b' + i]: before });
                setTimeout(step, Math.max(40, 240 / c));
            };
            step();
        }
    }
    function distributeAll() {
        if (busy) return;
        let first = true;
        const go = () => oneRound((ok) => {
            if (ok) { first = false; setTimeout(go, 160); }
            else if (first) oneRound();   // rien n'a pu être distribué : on explique pourquoi
        });
        go();
    }

    function undo() {
        if (busy) return;
        const h = history.pop();
        if (!h) return;
        pot = h.pot; boxes = h.boxes.slice();
        say('info', '↩ Dernier geste annulé.');
        renderAll();
        save();
    }

    function checkPred() {
        const q = parseInt(pred.q, 10), r = parseInt(pred.r, 10);
        if (isNaN(q) || isNaN(r)) {
            say('warn', 'Écrivez d\'abord la part et le reste prévus.');
            renderVerdict();
            return;
        }
        pred.checked = true;
        const tq = Math.floor(n / k), tr = n % k;
        const t = T();
        if (q === tq && r === tr) {
            say('ok', `✓ Bravo ! ${n} ${t.toks} entre ${k} : ${tq} ${t.each}, il reste ${tr}. ` + (finished() ? '' : 'Distribuez pour le voir !'));
        } else if (r >= k) {
            say('ko', `✗ Le reste (${r}) ne peut pas être plus grand que ${k - 1} : avec ${r} ${t.toks}, on peut encore en donner un à chaque ${t.box} !` + (finished() ? '' : ' Distribuez pour vérifier.'));
        } else if (k * q + r === n) {
            say('ko', `✗ ${k} × ${q} + ${r} fait bien ${n}, mais ce n'est pas le bon reste.`);
        } else {
            say('ko', `✗ Pas tout à fait : ${k} × ${q} + ${r} = ${k * q + r}, et non ${n}. ` + (finished() ? `La bonne réponse : ${tq}, reste ${tr}.` : 'Distribuez pour trouver !'));
        }
        renderAll();
        save();
    }

    function setParam(which, d) {
        if (busy) return;
        if (which === 'n') n = Math.max(1, Math.min(PEQ_N_MAX, n + d));
        if (which === 'k') k = Math.max(1, Math.min(PEQ_K_MAX, k + d));
        if (which === 'c') c = Math.max(PEQ_C_MIN, Math.min(PEQ_C_MAX, c + d));
        resetDistribution();
        renderAll();
        save();
    }

    // ── Glisser-déposer ───────────────────────────────────────────────────
    let drag = null, ghost = null, overEl = null;

    function zoneAt(x, y) {
        const el = document.elementFromPoint(x, y);
        return el ? el.closest('[data-zone]') : null;
    }
    function setOver(z, bad) {
        if (overEl && overEl !== z) overEl.classList.remove('over', 'over-bad');
        overEl = z;
        if (z) { z.classList.toggle('over', !bad); z.classList.toggle('over-bad', !!bad); }
    }
    function onDragMove(e) {
        if (!drag || e.pointerId !== drag.pid) return;
        if (!drag.started) {
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
            ghost = document.createElement('div');
            ghost.className = 'peq-ghost';
            ghost.style.fontSize = (parseFloat(stage.style.getPropertyValue('--u')) || 26) + 'px';
            ghost.innerHTML = tokenHTML(false);
            document.body.appendChild(ghost);
            drag.el.classList.add('dragging');
            drag.started = true;
        }
        e.preventDefault();
        const g = ghost.getBoundingClientRect();
        ghost.style.left = (e.clientX - g.width / 2) + 'px';
        ghost.style.top  = (e.clientY - g.height / 2) + 'px';
        const z = zoneAt(e.clientX, e.clientY);
        const bad = z && z.dataset.zone === 'box' && !isPartage() && boxes[+z.dataset.i] >= c;
        setOver(z, bad);
    }
    function onDragEnd(e) {
        if (!drag || (e && e.pointerId !== drag.pid)) return;
        const d = drag;
        drag = null;
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        if (ghost) { ghost.remove(); ghost = null; }
        setOver(null);
        if (d.el) d.el.classList.remove('dragging');
        if (e && e.type === 'pointercancel') return;
        if (!d.started) {
            if (d.from === 'pot') tapPot();
            else backToPot(d.from);
            return;
        }
        const z = zoneAt(e.clientX, e.clientY);
        if (d.from === 'pot') {
            if (!z || z.dataset.zone === 'pot') return;
            if (z.dataset.zone === 'new') {
                pushHistory(); boxes.push(0); const i = boxes.length - 1; giveTo(i); verdict = null; renderAll({ ['b' + i]: 0 }); save();
                return;
            }
            const i = +z.dataset.i;
            if (!isPartage() && boxes[i] >= c) { giveTo(i); return; }   // message « pleine »
            pushHistory();
            const before = boxes[i];
            giveTo(i);
            verdict = null;
            renderAll({ ['b' + i]: before });
            save();
            return;
        }
        // Jeton pris dans une boîte
        if (!z || z.dataset.zone === 'pot') { backToPot(d.from); return; }
        if (z.dataset.zone === 'new') {
            if (boxes[d.from] <= 0) return;
            pushHistory();
            boxes[d.from]--; boxes.push(1);
            if (boxes[d.from] === 0) boxes.splice(d.from, 1);
            verdict = null; renderAll(); save();
            return;
        }
        moveBetween(d.from, +z.dataset.i);
    }

    stage.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (busy || e.button > 0) return;
        const tEl = e.target.closest('.peq-t');
        if (!tEl) return;
        const z = tEl.closest('[data-zone]');
        if (!z) return;
        e.preventDefault();
        drag = { from: z.dataset.zone === 'pot' ? 'pot' : +z.dataset.i, el: tEl, x0: e.clientX, y0: e.clientY, pid: e.pointerId, started: false };
        document.addEventListener('pointermove', onDragMove, { passive: false });
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
    });

    // Les zones de travail ne déplacent pas le widget
    [stageWrap, tools, task, resultEl, verdictEl, controls].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-tab],[data-level],[data-step]');
        if (!b || !container.contains(b) || stage.contains(b)) return;
        if (busy && !b.dataset.act) return;
        if (b.dataset.tab) {
            mode = b.dataset.tab;
            if (mode === 'defi') newRandom();
            else { pred = { q: '', r: '', checked: false }; resetDistribution(); }
            renderAll();
            save();
            return;
        }
        if (b.dataset.level) {
            level = b.dataset.level;
            newRandom();
            renderAll();
            save();
            return;
        }
        if (b.dataset.step) { setParam(b.dataset.step, +b.dataset.d); return; }
        if (busy) return;
        switch (b.dataset.act) {
            case 'random': newRandom(); renderAll(); save(); break;
            case 'round':  oneRound(); break;
            case 'all':    distributeAll(); break;
            case 'undo':   undo(); break;
            case 'reset':  resetDistribution(); renderAll(); save(); break;
            case 'check':  checkPred(); break;
            case 'toggle-num': showNum = !showNum; renderAll(); save(); break;
        }
    });

    themeSel.addEventListener('change', () => { theme = themeSel.value in PEQ_THEMES ? themeSel.value : 'jetons'; renderAll(); save(); });
    themeSel.addEventListener('mousedown', (e) => e.stopPropagation());

    // Saisie de la prévision
    task.addEventListener('input', (e) => {
        const inp = e.target.closest('[data-pred]');
        if (!inp) return;
        inp.value = inp.value.replace(/\D/g, '');
        pred[inp.dataset.pred] = inp.value;
        pred.checked = false;
        inp.classList.remove('ok', 'ko');
        save();
    });
    task.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && e.target.closest('[data-pred]')) checkPred();
    });
    task.addEventListener('click', (e) => {
        const inp = e.target.closest('[data-pred]');
        if (inp) { e.stopPropagation(); inp.focus(); }
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la scène) ───────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(180, startH + y - y0) + 'px';
            fit();
        };
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const move = startResize(e.clientX, e.clientY);
        document.onmousemove = (ev) => move(ev.clientX, ev.clientY);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; renderAll(); save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const move = startResize(t0.clientX, t0.clientY);
        function onMove(ev) { const t = ev.touches[0]; move(t.clientX, t.clientY); }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            renderAll();
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); return; }
        fit();
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
            window._wfMiniBarCollapse(widget, '🤲 Le partage équitable', { onExpand: () => requestAnimationFrame(fit) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(fit);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = stage.style.height;
            container.classList.add('wf-fullboard');
            stage.style.height = Math.max(220, Math.round(window.innerHeight * 0.55)) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
        }
        requestAnimationFrame(() => { renderStage(); fit(); });
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        window.removeEventListener('resize', onWinResize);
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

    resetDistribution();
    renderAll();
    // La grille des boîtes dépend de la largeur réelle : second rendu une fois le widget posé
    requestAnimationFrame(() => { renderStage(); fit(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._peqGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        mode, level, theme, n, k, c, pot, boxes: boxes.slice(),
        pred: Object.assign({}, pred), showNum,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_peqIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._peqSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_peqIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        if (PEQ_MODES[d.mode]) mode = d.mode;
        if (PEQ_LEVELS[d.level]) level = String(d.level);
        if (PEQ_THEMES[d.theme]) theme = d.theme;
        const clamp = (v, a, b, def) => { v = parseInt(v, 10); return isNaN(v) ? def : Math.max(a, Math.min(b, v)); };
        n = clamp(d.n, 1, PEQ_N_MAX, n);
        k = clamp(d.k, 1, PEQ_K_MAX, k);
        c = clamp(d.c, PEQ_C_MIN, PEQ_C_MAX, c);
        if (typeof d.showNum === 'boolean') showNum = d.showNum;
        if (d.pred && typeof d.pred === 'object') pred = { q: String(d.pred.q || ''), r: String(d.pred.r || ''), checked: !!d.pred.checked };
        resetDistribution();
        // Reprendre la distribution si elle est cohérente (même total)
        if (Array.isArray(d.boxes)) {
            const bx = d.boxes.map(x => Math.max(0, parseInt(x, 10) || 0));
            const p = Math.max(0, parseInt(d.pot, 10) || 0);
            const okLen = isPartage() ? bx.length === k : bx.every(x => x <= c);
            if (okLen && p + bx.reduce((s, x) => s + x, 0) === n) {
                pot = p; boxes = bx;
                // La distribution avait commencé : on garde une étape pour pouvoir annuler vers le départ
                if (pot !== n) history = [{ pot: n, boxes: isPartage() ? new Array(k).fill(0) : [] }];
            }
        }
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(() => { renderStage(); fit(); }, 250);
    };

    saveBoard();
    return widget;
}
