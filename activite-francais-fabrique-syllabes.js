// =========================================================================
// WIDGET LA FABRIQUE À SYLLABES — Le Bureau du Prof
// Combinatoire (cycle 2) : on touche une consonne puis une voyelle,
// elles s'assemblent dans la fabrique (m + a → ma) et la syllabe est lue
// à voix haute. On ajoute ensuite les syllabes au mot pour le lire.
//   • ordres : consonne + voyelle (ma), voyelle + consonne (am),
//     deux consonnes + voyelle (bra) ;
//   • voyelles simples, et sons complexes (ou, on, an, oi, eau…) en option ;
//   • écriture script, cursive ou capitales ;
//   • 🎲 syllabe au hasard (rituel de lecture : on lit, puis on écoute) ;
//   • 🎯 défi : une image, il faut fabriquer le mot syllabe par syllabe.
//
// Même fenêtre que « Lettres cursives » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
// L'état est restauré après actualisation via save-load.js
// (_fsGetData / _fsSetData).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

const FS_CONSONNES = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'z', 'ch', 'ph', 'gn', 'qu'];
const FS_VOYELLES  = ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ê'];
const FS_SONS      = ['ou', 'on', 'an', 'en', 'in', 'oi', 'au', 'eau', 'eu', 'ai', 'ei', 'un'];
const FS_MODES = {
    CV:  { lbl: 'ma',  titre: 'Consonne + voyelle',              slots: ['C', 'V'] },
    VC:  { lbl: 'am',  titre: 'Voyelle + consonne',              slots: ['V', 'C'] },
    CCV: { lbl: 'bra', titre: 'Deux consonnes + voyelle (br, cl, tr…)', slots: ['C', 'C', 'V'] }
};
const FS_ECRITURES = {
    script:  { lbl: 'script',   titre: 'Écriture script' },
    cursive: { lbl: 'cursive',  titre: 'Écriture cursive' },
    caps:    { lbl: 'CAPITALES', titre: 'Écriture en capitales' }
};
// Mots du défi : emoji | mot | syllabes (fabricables avec les cartes)
const FS_MOTS = [
    '🏍️|moto|mo.to', '🚲|vélo|vé.lo', '🦙|lama|la.ma', '🥋|judo|ju.do', '☕|café|ca.fé', '👶|bébé|bé.bé',
    '📺|télé|té.lé', '🍅|tomate|to.ma.te', '🥗|salade|sa.la.de', '🍌|banane|ba.na.ne', '🏴‍☠️|pirate|pi.ra.te',
    '📻|radio|ra.di.o', '🥝|kiwi|ki.wi', '🌙|lune|lu.ne', '👗|robe|ro.be', '🌹|rose|ro.se', '🛋️|canapé|ca.na.pé',
    '🍒|cerise|ce.ri.se', '🦒|girafe|gi.ra.fe', '🌷|tulipe|tu.li.pe', '🐮|vache|va.che', '🔥|feu|feu', '🎮|jeu|jeu',
    '🐑|mouton|mou.ton', '🐔|poule|pou.le', '🔍|loupe|lou.pe', '🪰|mouche|mou.che', '🦉|hibou|hi.bou',
    '🍬|bonbon|bon.bon', '🍈|melon|me.lon', '🐇|lapin|la.pin', '🎄|sapin|sa.pin', '🍇|raisin|rai.sin',
    '🦈|requin|re.quin', '🐬|dauphin|dau.phin', '🐷|cochon|co.chon', '🎁|cadeau|ca.deau', '⛵|bateau|ba.teau',
    '🎩|chapeau|cha.peau', '🐫|chameau|cha.meau', '🐂|taureau|tau.reau', '🤴|roi|roi'
].map(l => { const p = l.split('|'); return { e: p[0], w: p[1], syl: p[2].split('.') }; });

function _fsIsVowelish(t) { return FS_VOYELLES.includes(t) || FS_SONS.includes(t); }
function _fsIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
function _fsEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _fsSpeak(text) {
    try {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'fr-FR';
        u.rate = 0.8;
        const v = (window.speechSynthesis.getVoices() || []).find(x => /^fr/i.test(x.lang));
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('fs-style')) return;
    const s = document.createElement('style');
    s.id = 'fs-style';
    s.textContent = `
        .widget[data-type="fabrique-syllabes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .fs-container {
            --fs-c: #1d4ed8; --fs-cl: #dbeafe;      /* consonnes : bleu */
            --fs-v: #dc2626; --fs-vl: #fee2e2;      /* voyelles : rouge */
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
            -webkit-user-select: none;
            overflow: hidden;
        }
        .fs-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .fs-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .fs-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #ede9fe; color: #5b21b6; }

        .fs-container.wf-minimized > *:not(.fs-header) { display: none !important; }
        .fs-container.wf-minimized { gap: 0; }
        .fs-container.wf-fullboard {
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
            .fs-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
            .fs-container .fs-sep { display: none; }
            .fs-container .fs-tools { gap: 4px; padding: 4px; }
            .fs-container .fs-btn { padding: 4px 8px; }
            .fs-container .fs-cards { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 3px; }
            .fs-container .fs-card { flex-shrink: 0; }
            .fs-container .fs-info, .fs-container.wf-fullboard .fs-info { font-size: 14px; }
            .fs-container .fs-row-lbl { width: auto; writing-mode: vertical-rl; transform: rotate(180deg); font-size: 9px; }
            .fs-container .fs-badge { display: none; }
            .fs-container .fs-actions .fs-btn, .fs-container.wf-fullboard .fs-actions .fs-btn { font-size: 12px; padding: 5px 9px; white-space: nowrap; }
            .fs-container .fs-actions { gap: 5px; }
            .fs-container .fs-word { gap: 6px; padding: 6px 8px; }
            .fs-container .fs-word-empty { display: none; }
        }

        .fs-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .fs-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .fs-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .fs-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .fs-btn:active { transform: scale(0.96); }
        .fs-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .fs-btn-blue  { background: #4a90e2; color: #fff; }
        .fs-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .fs-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .fs-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .fs-btn-green { background: #28a745; color: #fff; }
        .fs-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .fs-btn-violet { background: #7c3aed; color: #fff; }
        .fs-btn-violet:hover:not(:disabled) { background: #6d28d9; }
        .fs-btn.on    { background: #ede9fe; color: #5b21b6; border: 1px solid #c4b5fd; }
        .fs-seg { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .fs-seg button {
            padding: 5px 9px; border: none; background: #f5f5f5; font-size: 11px; font-weight: 700;
            color: #555; cursor: pointer; border-right: 1px solid #ddd;
        }
        .fs-seg button:last-child { border-right: none; }
        .fs-seg button.active { background: #ede9fe; color: #5b21b6; }

        /* Écritures */
        .fs-w-script  .fs-t { font-family: 'Nunito', 'Andika', 'Segoe UI', sans-serif; font-weight: 800; }
        .fs-w-cursive .fs-t { font-family: 'BelleAllureGS', 'MDI', 'Segoe Script', cursive; font-weight: normal; }
        .fs-w-caps    .fs-t { font-family: 'Nunito', 'Andika', 'Segoe UI', sans-serif; font-weight: 800; text-transform: uppercase; }

        /* Cartes-lettres */
        .fs-rows { display: flex; flex-direction: column; gap: 6px; }
        .fs-row { display: flex; align-items: center; gap: 8px; }
        .fs-row-lbl { font-size: 11px; font-weight: 800; width: 74px; flex-shrink: 0; }
        .fs-cards { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; min-width: 0; }
        .fs-card {
            min-width: 40px; height: 44px; padding: 0 7px; box-sizing: border-box; border-radius: 9px;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            font-size: 26px; line-height: 1; border: 2px solid; background: #fff;
            box-shadow: 0 2px 0 rgba(0,0,0,.12); transition: transform .1s, box-shadow .1s;
            touch-action: manipulation;
        }
        .fs-card:hover { transform: translateY(-2px); }
        .fs-card:active { transform: translateY(1px); box-shadow: none; }
        .fs-card.c { color: var(--fs-c); border-color: #93c5fd; }
        .fs-card.c:hover { background: var(--fs-cl); }
        .fs-card.v { color: var(--fs-v); border-color: #fca5a5; }
        .fs-card.v:hover { background: var(--fs-vl); }
        .fs-card.used.c { background: var(--fs-cl); border-color: var(--fs-c); }
        .fs-card.used.v { background: var(--fs-vl); border-color: var(--fs-v); }
        .fs-container.wf-fullboard .fs-card { min-width: 48px; height: 52px; font-size: 32px; }

        /* La fabrique */
        .fs-stage {
            --fs-fs: 90px;
            position: relative; flex-shrink: 0; overflow: hidden; box-sizing: border-box;
            background: linear-gradient(180deg, #faf5ff, #fff);
            border: 1px solid #e9d5ff; border-radius: 14px;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .12em;
            font-size: var(--fs-fs);
        }
        .fs-machine { display: flex; align-items: center; justify-content: center; gap: .18em; }
        .fs-slot {
            min-width: 1.1em; height: 1.35em; padding: 0 .12em; box-sizing: border-box;
            border-radius: .16em; border: .04em dashed #cbd5e1; background: #fff;
            display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 1;
            position: relative;
        }
        .fs-slot.C { border-color: #93c5fd; }
        .fs-slot.V { border-color: #fca5a5; }
        .fs-slot.full { border-style: solid; box-shadow: 0 .04em .1em rgba(0,0,0,.12); }
        .fs-slot.full.C { color: var(--fs-c); background: var(--fs-cl); border-color: var(--fs-c); }
        .fs-slot.full.V { color: var(--fs-v); background: var(--fs-vl); border-color: var(--fs-v); }
        .fs-slot .fs-hint { font-size: .28em; color: #94a3b8; font-family: 'Segoe UI', sans-serif; font-weight: 700; }
        .fs-op { font-size: .5em; color: #a78bfa; font-weight: 900; font-family: 'Segoe UI', sans-serif; }
        .fs-result {
            display: flex; flex-direction: column; align-items: center; cursor: pointer;
            padding: 0 .1em; min-width: 1.4em;
        }
        .fs-result .fs-t { line-height: 1.15; }
        .fs-result .fs-t .c { color: var(--fs-c); }
        .fs-result .fs-t .v { color: var(--fs-v); }
        .fs-result.empty .fs-t { color: #e2e8f0; }
        .fs-arc {
            width: 100%; height: .22em; box-sizing: border-box;
            border: .055em solid #7c3aed; border-top: none; border-radius: 0 0 50% 50% / 0 0 100% 100%;
            margin-top: -.06em;
        }
        .fs-result.empty .fs-arc { border-color: #e9d5ff; }
        .fs-pop { animation: fsPop .45s ease-out; }
        @keyframes fsPop { 0% { transform: scale(.6); opacity: .3; } 60% { transform: scale(1.12); } 100% { transform: scale(1); } }
        .fs-actions { display: flex; gap: 8px; font-size: 14px; flex-wrap: wrap; justify-content: center; }
        .fs-actions .fs-btn { font-size: 14px; padding: 6px 14px; }
        .fs-container.wf-fullboard .fs-actions .fs-btn { font-size: 17px; padding: 8px 18px; }

        /* Le mot */
        .fs-word {
            display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
            padding: 8px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #e5e7eb; min-height: 56px;
        }
        .fs-word-lbl { font-size: 12px; font-weight: 800; color: #6b7280; }
        .fs-defi { font-size: 40px; line-height: 1; font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif; }
        .fs-train { display: flex; align-items: flex-end; gap: 4px; flex: 1; min-width: 120px; font-size: 40px; flex-wrap: wrap; }
        .fs-syl { display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 0 2px; }
        .fs-syl .fs-t { line-height: 1.1; color: #111827; }
        .fs-syl .fs-arc { border-width: .07em; height: .26em; }
        .fs-syl:nth-child(odd)  .fs-arc { border-color: #dc2626; }
        .fs-syl:nth-child(even) .fs-arc { border-color: #2563eb; }
        .fs-gap { width: .9em; height: 1.1em; border-bottom: .07em dashed #cbd5e1; margin: 0 2px; }
        .fs-word-empty { font-size: 14px; color: #9ca3af; font-weight: 600; }
        .fs-container.wf-fullboard .fs-train { font-size: 54px; }
        .fs-container.wf-fullboard .fs-defi { font-size: 56px; }

        .fs-info {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4; min-height: 24px;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
        }
        .fs-info.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .fs-info.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .fs-container.wf-fullboard .fs-info { font-size: 19px; }

        /* Aide */
        .fs-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .fs-help-btn:hover { background: #e0e0e0; color: #333; }
        .fs-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .fs-help-popup.show { display: block; }
        .fs-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .fs-help-popup p { margin: 0 0 6px; }
        .fs-help-popup p:last-child { margin-bottom: 0; }

        .fs-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .fs-container:hover .fs-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Création du widget ────────────────────────────────────────────────────
function createFabriqueSyllabesWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'fabrique-syllabes';
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
    container.className = 'fs-container fs-w-script';
    const initW = Math.round(window.innerWidth * 0.7);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'fs-header';
    header.innerHTML = `
        <span class="fs-title">🏭 La fabrique à syllabes</span>
        <span class="fs-badge">Fabriquer</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.fs-badge');
    container.appendChild(header);

    // ── Réglages ──────────────────────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'fs-tools';
    tools.innerHTML = `
        <span class="fs-lbl">Syllabes</span>
        <div class="fs-seg" data-group="mode">
            ${Object.keys(FS_MODES).map(k => `<button data-mode="${k}" title="${FS_MODES[k].titre}">${FS_MODES[k].lbl}</button>`).join('')}
        </div>
        <span class="fs-sep"></span>
        <div class="fs-seg" data-group="ecr">
            ${Object.keys(FS_ECRITURES).map(k => `<button data-ecr="${k}" title="${FS_ECRITURES[k].titre}">${FS_ECRITURES[k].lbl}</button>`).join('')}
        </div>
        <span class="fs-sep"></span>
        <button class="fs-btn fs-btn-grey" data-act="toggle-sons" title="Ajouter les sons complexes : ou, on, an, oi, eau…">+ ou, on, an…</button>
        <button class="fs-btn fs-btn-grey" data-act="toggle-auto" title="Lire la syllabe dès qu'elle est fabriquée">🔊 Auto</button>
        <span class="fs-sep"></span>
        <button class="fs-btn fs-btn-blue" data-act="random" title="Une syllabe au hasard : on la lit, puis on l'écoute">🎲 Au hasard</button>
        <button class="fs-btn fs-btn-violet" data-act="defi" title="Une image : fabriquer le mot syllabe par syllabe">🎯 Défi mot</button>
    `;
    container.appendChild(tools);

    // ── Cartes ────────────────────────────────────────────────────────────
    const rows = document.createElement('div');
    rows.className = 'fs-rows';
    const card = (t, cls) => `<button class="fs-card ${cls}" data-card="${_fsEsc(t)}"><span class="fs-t">${_fsEsc(t)}</span></button>`;
    rows.innerHTML = `
        <div class="fs-row"><span class="fs-row-lbl" style="color:#1d4ed8">Consonnes</span>
            <div class="fs-cards">${FS_CONSONNES.map(t => card(t, 'c')).join('')}</div></div>
        <div class="fs-row"><span class="fs-row-lbl" style="color:#dc2626">Voyelles</span>
            <div class="fs-cards">${FS_VOYELLES.map(t => card(t, 'v')).join('')}</div></div>
        <div class="fs-row" data-role="row-sons"><span class="fs-row-lbl" style="color:#dc2626">Sons</span>
            <div class="fs-cards">${FS_SONS.map(t => card(t, 'v')).join('')}</div></div>
    `;
    const rowSons = rows.querySelector('[data-role="row-sons"]');
    container.appendChild(rows);

    // ── La fabrique ───────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'fs-stage';
    stage.style.height = Math.round(initH * 0.42) + 'px';
    const machine = document.createElement('div');
    machine.className = 'fs-machine';
    const actions = document.createElement('div');
    actions.className = 'fs-actions';
    actions.innerHTML = `
        <button class="fs-btn fs-btn-green" data-act="say" title="Écouter la syllabe">🔊 Écouter</button>
        <button class="fs-btn fs-btn-violet" data-act="add" title="Ajouter la syllabe au mot">➕ Au mot</button>
        <button class="fs-btn fs-btn-grey" data-act="clear-slots" title="Vider la fabrique">🧹 Vider</button>
    `;
    stage.appendChild(machine);
    stage.appendChild(actions);
    container.appendChild(stage);

    // ── Le mot ────────────────────────────────────────────────────────────
    const wordBox = document.createElement('div');
    wordBox.className = 'fs-word';
    container.appendChild(wordBox);

    const info = document.createElement('div');
    info.className = 'fs-info';
    container.appendChild(info);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'fs-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'fs-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La fabrique à syllabes</h4>
        <p>Touchez une <b style="color:#1d4ed8">consonne</b> puis une <b style="color:#dc2626">voyelle</b> : elles entrent dans la
        fabrique et forment la syllabe (m + a → ma), lue à voix haute si <b>🔊 Auto</b> est activé.
        Touchez une autre voyelle pour la remplacer : ma → mo → mi… Touchez une case pour la vider.</p>
        <p><b>ma / am / bra</b> : consonne + voyelle, voyelle + consonne, ou deux consonnes + voyelle.
        <b>+ ou, on, an…</b> ajoute les sons complexes. L'écriture peut être en script, en cursive ou en capitales.</p>
        <p><b>➕ Au mot</b> ajoute la syllabe au mot (chaque syllabe soulignée d'un arc). <b>🔊 Lire le mot</b> lit les syllabes
        puis le mot entier. Touchez une syllabe du mot pour l'enlever.</p>
        <p><b>🎲 Au hasard</b> : une syllabe à lire par la classe, sans le son ; on l'écoute ensuite avec 🔊.
        <b>🎯 Défi mot</b> : une image, il faut fabriquer le mot syllabe par syllabe.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'fs-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let mode = 'CV';
    let ecr = 'script';
    let showSons = false;
    let auto = true;
    let slots = ['', ''];
    let word = [];            // syllabes du mot
    let defi = null;          // mot du défi (clé w)
    let lastMsg = null;
    let popNext = false;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function types() { return FS_MODES[mode].slots; }
    function syllable() { return slots.join(''); }
    function complete() { return slots.every(Boolean); }
    function hasVowel() { return types().some((t, i) => t === 'V' && slots[i]); }
    function defiMot() { return defi ? FS_MOTS.find(m => m.w === defi) : null; }

    // Syllabe colorée (consonnes en bleu, voyelles en rouge)
    function sylHTML(withColors) {
        if (!slots.some(Boolean)) return '<span>?</span>';
        return types().map((t, i) => slots[i] ? `<span class="${withColors ? (t === 'C' ? 'c' : 'v') : ''}">${_fsEsc(slots[i])}</span>` : '').join('');
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function renderMachine() {
        const ts = types();
        let h = '';
        ts.forEach((t, i) => {
            if (i > 0) h += '<span class="fs-op">+</span>';
            h += `<div class="fs-slot ${t}${slots[i] ? ' full' : ''}" data-slot="${i}" title="${slots[i] ? 'Toucher pour vider' : (t === 'C' ? 'Une consonne' : 'Une voyelle')}">` +
                (slots[i] ? `<span class="fs-t">${_fsEsc(slots[i])}</span>` : `<span class="fs-hint">${t === 'C' ? 'consonne' : 'voyelle'}</span>`) + '</div>';
        });
        const empty = !hasVowel();
        h += '<span class="fs-op">→</span>';
        h += `<div class="fs-result${empty ? ' empty' : ''}${popNext && !empty ? ' fs-pop' : ''}" data-act="say" title="Écouter"><span class="fs-t">${sylHTML(true)}</span><span class="fs-arc"></span></div>`;
        popNext = false;
        machine.innerHTML = h;
        actions.querySelector('[data-act="say"]').disabled = empty;
        actions.querySelector('[data-act="add"]').disabled = empty;
        actions.querySelector('[data-act="clear-slots"]').disabled = !slots.some(Boolean);
        // cartes utilisées
        rows.querySelectorAll('.fs-card').forEach(b => b.classList.toggle('used', slots.includes(b.dataset.card)));
        requestAnimationFrame(fit);
    }

    function renderWord() {
        const m = defiMot();
        let h = '';
        if (m) {
            h += `<span class="fs-defi" title="Écouter le mot">${m.e}</span>
                  <button class="fs-btn fs-btn-grey" data-act="say-defi" title="Écouter le mot à fabriquer">🔊</button>`;
        } else {
            h += '<span class="fs-word-lbl">Mon mot :</span>';
        }
        h += '<div class="fs-train">';
        if (word.length) h += word.map((s, i) => `<div class="fs-syl" data-syl="${i}" title="Toucher pour enlever"><span class="fs-t">${_fsEsc(s)}</span><span class="fs-arc"></span></div>`).join('');
        if (m) for (let i = word.length; i < m.syl.length; i++) h += '<span class="fs-gap"></span>';
        if (!word.length && !m) h += '<span class="fs-word-empty">Fabriquez une syllabe puis cliquez sur ➕ Au mot.</span>';
        h += '</div>';
        h += `<button class="fs-btn fs-btn-green" data-act="say-word" ${word.length ? '' : 'disabled'} title="Lire les syllabes puis le mot">🔊 Lire le mot</button>
              <button class="fs-btn fs-btn-grey" data-act="undo-word" ${word.length ? '' : 'disabled'} title="Enlever la dernière syllabe">↩</button>
              <button class="fs-btn fs-btn-grey" data-act="clear-word" ${word.length || m ? '' : 'disabled'} title="Effacer le mot${m ? ' et arrêter le défi' : ''}">🧹</button>`;
        if (m) h += `<button class="fs-btn fs-btn-grey" data-act="solution" title="Montrer le mot">👁 Solution</button>`;
        wordBox.innerHTML = h;
    }

    function setInfo(cls, html) {
        info.className = 'fs-info' + (cls ? ' ' + cls : '');
        info.innerHTML = html;
    }
    function renderInfo() {
        if (lastMsg) { setInfo(lastMsg.cls, lastMsg.html); return; }
        const m = defiMot();
        if (m) { setInfo('', `🎯 Fabrique le mot de l'image, syllabe par syllabe (${m.syl.length} syllabe${m.syl.length > 1 ? 's' : ''}). Touche 🔊 pour l'entendre.`); return; }
        const ts = types();
        const first = ts[0] === 'C' ? 'une <b style="color:#1d4ed8">consonne</b>' : 'une <b style="color:#dc2626">voyelle</b>';
        const second = ts[1] === 'C' ? 'une <b style="color:#1d4ed8">consonne</b>' : 'une <b style="color:#dc2626">voyelle</b>';
        setInfo('', `👆 Touche ${first}, puis ${second}${ts.length > 2 ? ', puis une <b style="color:#dc2626">voyelle</b>' : ''} : la fabrique assemble la syllabe.`);
    }

    function renderBars() {
        container.classList.remove('fs-w-script', 'fs-w-cursive', 'fs-w-caps');
        container.classList.add('fs-w-' + ecr);
        tools.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        tools.querySelectorAll('[data-ecr]').forEach(b => b.classList.toggle('active', b.dataset.ecr === ecr));
        tools.querySelector('[data-act="toggle-sons"]').classList.toggle('on', showSons);
        tools.querySelector('[data-act="toggle-auto"]').classList.toggle('on', auto);
        rowSons.style.display = showSons ? '' : 'none';
        badge.textContent = defi ? 'Défi' : FS_MODES[mode].titre;
    }

    function renderAll() {
        renderBars();
        renderMachine();
        renderWord();
        renderInfo();
        if (_isMax) requestAnimationFrame(fitFullHeight);
    }

    // Taille de la fabrique selon la place disponible
    function fit() {
        const w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        const n = types().length;
        let fs = Math.min((h - 50) / 1.75, w / (n * 1.6 + 3.2), 170);
        fs = Math.max(26, fs);
        stage.style.setProperty('--fs-fs', fs + 'px');
        let guard = 0;
        while (machine.scrollWidth > w - 10 && fs > 24 && guard++ < 40) {
            fs *= 0.92;
            stage.style.setProperty('--fs-fs', fs + 'px');
        }
    }

    // ── Actions ───────────────────────────────────────────────────────────
    function putCard(t) {
        const kind = _fsIsVowelish(t) ? 'V' : 'C';
        const ts = types();
        let idx = ts.findIndex((k, i) => k === kind && !slots[i]);
        if (idx < 0) {                     // toutes les cases de ce type sont pleines : on remplace la dernière
            for (let i = ts.length - 1; i >= 0; i--) if (ts[i] === kind) { idx = i; break; }
        }
        if (idx < 0) return;
        if (complete() && kind === 'C' && ts.filter(k => k === 'C').length === 2 && ts[0] === 'C') {
            // deux consonnes déjà en place : on recommence avec la nouvelle consonne en 1re case
            slots = slots.map((s, i) => ts[i] === 'C' ? '' : s);
            idx = 0;
        }
        slots[idx] = t;
        lastMsg = null;
        if (hasVowel()) popNext = true;
        renderMachine();
        renderInfo();
        if (auto && complete()) _fsSpeak(syllable());
        save();
    }
    function clearSlot(i) {
        if (!slots[i]) return;
        slots[i] = '';
        renderMachine();
        save();
    }
    function clearSlots() {
        slots = types().map(() => '');
        lastMsg = null;
        renderMachine();
        renderInfo();
        save();
    }
    function addToWord() {
        if (!hasVowel()) return;
        word.push(syllable());
        lastMsg = null;
        checkDefi();
        renderWord();
        renderInfo();
        save();
    }
    let sayTimers = [];
    function sayWord() {
        if (!word.length) return;
        sayTimers.forEach(clearTimeout);
        sayTimers = [];
        const syls = wordBox.querySelectorAll('.fs-syl');
        word.forEach((s, i) => sayTimers.push(setTimeout(() => {
            syls.forEach((el, j) => el.style.transform = j === i ? 'translateY(-6px)' : '');
            _fsSpeak(s);
        }, i * 900)));
        sayTimers.push(setTimeout(() => {
            syls.forEach(el => el.style.transform = '');
            _fsSpeak(word.join(''));
        }, word.length * 900 + 250));
    }
    function checkDefi() {
        const m = defiMot();
        if (!m) return;
        const built = word.join('');
        if (built === m.w) {
            lastMsg = { cls: 'ok', html: `🌟 Bravo ! Tu as fabriqué le mot « <b>${_fsEsc(m.w)}</b> ». Clique sur 🎯 Défi mot pour un nouveau mot.` };
            setTimeout(() => _fsSpeak(m.w), 200);
        } else if (!m.w.startsWith(built)) {
            lastMsg = { cls: 'warn', html: `🤔 Ce n'est pas encore ça : écoute le mot avec 🔊 et vérifie la dernière syllabe (↩ pour l'enlever).` };
        } else if (word.length >= m.syl.length) {
            lastMsg = { cls: 'warn', html: '🤔 Il y a trop de syllabes.' };
        }
    }
    function randomSyl() {
        const cons = FS_CONSONNES.filter(c => !['h', 'w', 'x', 'gn', 'ph', 'qu'].includes(c));
        const voy = showSons ? FS_VOYELLES.concat(FS_SONS) : FS_VOYELLES.filter(v => v !== 'y' && v !== 'ê');
        const pick = a => a[Math.floor(Math.random() * a.length)];
        const ts = types();
        const old = syllable();
        let guard = 0;
        do {
            slots = ts.map((t, i) => {
                if (t === 'V') return pick(voy);
                if (mode === 'CCV' && i === 1) return pick(['r', 'l']);
                if (mode === 'CCV' && i === 0) return pick(['b', 'c', 'd', 'f', 'g', 'p', 't', 'v']);
                return pick(cons);
            });
        } while ((syllable() === old || (mode === 'CCV' && /^(dl|tl|vl)/.test(syllable()))) && guard++ < 20);
        popNext = true;
        lastMsg = { cls: '', html: '👀 Lis la syllabe dans ta tête… puis clique sur <b>🔊 Écouter</b> pour vérifier.' };
        renderMachine();
        renderInfo();
        save();
    }
    function newDefi() {
        const old = defi;
        let m, guard = 0;
        do { m = FS_MOTS[Math.floor(Math.random() * FS_MOTS.length)]; } while (m.w === old && guard++ < 10);
        defi = m.w;
        word = [];
        // On adapte la fabrique : consonne + voyelle, avec les sons complexes si le mot en a besoin
        if (mode !== 'CV') { mode = 'CV'; slots = ['', '']; }
        if (m.syl.some(s => FS_SONS.some(x => s.includes(x)))) showSons = true;
        clearSlotsSilent();
        lastMsg = null;
        renderAll();
        setTimeout(() => _fsSpeak(m.w), 150);
        save();
    }
    function clearSlotsSilent() { slots = types().map(() => ''); }
    function solution() {
        const m = defiMot();
        if (!m) return;
        word = m.syl.slice();
        lastMsg = { cls: '', html: `👁 Le mot « <b>${_fsEsc(m.w)}</b> » : ${m.syl.map(_fsEsc).join(' - ')}.` };
        renderWord();
        renderInfo();
        save();
    }

    // ── Événements ────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-mode],[data-ecr],[data-card],[data-slot],[data-syl]');
        if (!b || !container.contains(b)) return;
        e.stopPropagation();
        if (b.dataset.card) { putCard(b.dataset.card); return; }
        if (b.dataset.slot !== undefined) { clearSlot(+b.dataset.slot); return; }
        if (b.dataset.syl !== undefined) { word.splice(+b.dataset.syl, 1); lastMsg = null; checkDefi(); renderWord(); renderInfo(); save(); return; }
        if (b.dataset.mode) { mode = b.dataset.mode; slots = types().map(() => ''); lastMsg = null; renderAll(); save(); return; }
        if (b.dataset.ecr) { ecr = b.dataset.ecr; renderBars(); requestAnimationFrame(fit); save(); return; }
        switch (b.dataset.act) {
            case 'say': if (hasVowel()) _fsSpeak(syllable()); break;
            case 'add': addToWord(); break;
            case 'clear-slots': clearSlots(); break;
            case 'say-word': sayWord(); break;
            case 'undo-word': word.pop(); lastMsg = null; checkDefi(); renderWord(); renderInfo(); save(); break;
            case 'clear-word': word = []; defi = null; lastMsg = null; renderAll(); save(); break;
            case 'say-defi': if (defiMot()) _fsSpeak(defiMot().w); break;
            case 'solution': solution(); break;
            case 'toggle-sons': showSons = !showSons; renderBars(); renderMachine(); if (_isMax) requestAnimationFrame(fitFullHeight); save(); break;
            case 'toggle-auto': auto = !auto; renderBars(); save(); break;
            case 'random': randomSyl(); break;
            case 'defi': newDefi(); break;
        }
    });
    wordBox.addEventListener('click', (e) => {
        if (e.target.closest('.fs-defi') && defiMot()) { e.stopPropagation(); _fsSpeak(defiMot().w); }
    });

    // Les zones de travail ne déplacent pas le widget
    [tools, rows, stage, wordBox, info].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la fabrique) ────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(130, startH + y - y0) + 'px';
            fit();
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
        function onMove(ev) { const t = ev.touches[0]; move(t.clientX, t.clientY); }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    let _ro = null;
    if (typeof ResizeObserver === 'function') { _ro = new ResizeObserver(() => fit()); _ro.observe(stage); }
    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); if (_ro) _ro.disconnect(); sayTimers.forEach(clearTimeout); return; }
        if (_isMax) fitFullHeight();
        fit();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    function fitFullHeight() {
        const others = [header, tools, rows, wordBox, info].reduce((a, el) => a + (el.offsetHeight || 0), 0);
        const avail = window.innerHeight - others - 9 * 5 - 30;
        stage.style.height = Math.max(150, Math.round(avail)) + 'px';
        fit();
    }

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🏭 La fabrique à syllabes', { onExpand: () => requestAnimationFrame(fit) });
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
            requestAnimationFrame(fitFullHeight);
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
        }
        requestAnimationFrame(fit);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        sayTimers.forEach(clearTimeout);
        window.removeEventListener('resize', onWinResize);
        if (_ro) _ro.disconnect();
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

    renderAll();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._fsGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        mode, ecr, showSons, auto,
        slots: slots.slice(),
        word: word.slice(),
        defi,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_fsIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._fsSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_fsIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        if (FS_MODES[d.mode]) mode = d.mode;
        if (FS_ECRITURES[d.ecr]) ecr = d.ecr;
        if (typeof d.showSons === 'boolean') showSons = d.showSons;
        if (typeof d.auto === 'boolean') auto = d.auto;
        const ok = t => typeof t === 'string' && (FS_CONSONNES.includes(t) || _fsIsVowelish(t));
        slots = types().map((k, i) => {
            const t = Array.isArray(d.slots) ? d.slots[i] : '';
            return ok(t) && ((k === 'V') === _fsIsVowelish(t)) ? t : '';
        });
        word = Array.isArray(d.word) ? d.word.filter(s => typeof s === 'string' && s.length && s.length < 8).slice(0, 12) : [];
        defi = (typeof d.defi === 'string' && FS_MOTS.some(m => m.w === d.defi)) ? d.defi : null;
        lastMsg = null;
        checkDefi();
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
