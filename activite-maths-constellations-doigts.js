// =========================================================================
// WIDGET CONSTELLATIONS ET DOIGTS — Le Bureau du Prof
// Rituel de subitizing (cycle 2) : une quantité s'affiche brièvement
// (dés, doigts, jetons éparpillés ou boîte de 10), puis se cache.
// La classe dit le nombre ; on vérifie avec « ✓ Réponse » (nombre, mot,
// décomposition « 5 et 2 », lecture à voix haute).
//   • choix de la représentation (ou au hasard), des nombres et de la durée ;
//   • 👁 Revoir, ▶ Suivant ; touche Espace pour enchaîner ;
//   • pavé de réponse (facultatif) pour un travail en autonomie, avec score.
//
// Même fenêtre que « Lettres cursives » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
// L'état est restauré après actualisation via save-load.js
// (_cdGetData / _cdSetData).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

const CD_REPS = {
    des:    { lbl: '🎲 Dés',        titre: 'Constellations du dé (deux ou trois dés au-delà de 6)' },
    doigts: { lbl: '✋ Doigts',     titre: 'Les doigts levés (jusqu\'à 10)' },
    jetons: { lbl: '⚪ Jetons',     titre: 'Des jetons éparpillés, sans organisation' },
    boite:  { lbl: '▦ Boîte de 10', titre: 'La boîte de 10 (deux boîtes au-delà de 10)' },
    hasard: { lbl: '🔀 Au hasard',  titre: 'Une représentation différente à chaque fois' }
};
const CD_RANGES = {
    '5':  { lbl: '1 à 5',  max: 5 },
    '6':  { lbl: '1 à 6',  max: 6 },
    '10': { lbl: '1 à 10', max: 10 },
    '12': { lbl: '1 à 12', max: 12 },
    '20': { lbl: '1 à 20', max: 20 }
};
const CD_DUREES = {
    '1':   { lbl: '1 s', ms: 1000 },
    '2':   { lbl: '2 s', ms: 2000 },
    '3':   { lbl: '3 s', ms: 3000 },
    'inf': { lbl: '∞',   ms: 0, titre: 'Reste affiché jusqu\'au clic sur « Cacher »' }
};
const CD_MOTS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt'];
const CD_COULEURS = ['#ef4444', '#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#0891b2'];
const CD_NS = 'http://www.w3.org/2000/svg';

// Points du dé (grille 3 × 3 : 0 = gauche/haut, 1 = milieu, 2 = droite/bas)
const CD_DE = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
};

function _cdIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
// Parole : plusieurs phrases dites l'une après l'autre, avec une pause entre elles
// (« huit » … pause … « cinq et trois »)
let _cdSpeakToken = 0;
function _cdSpeak(texts, pauseMs) {
    const list = (Array.isArray(texts) ? texts : [texts]).filter(Boolean);
    const tok = ++_cdSpeakToken;
    try {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
        window.speechSynthesis.cancel();
        const v = (window.speechSynthesis.getVoices() || []).find(x => /^fr/i.test(x.lang));
        const next = (i) => {
            if (i >= list.length || tok !== _cdSpeakToken) return;
            const u = new SpeechSynthesisUtterance(list[i]);
            u.lang = 'fr-FR';
            u.rate = 0.8;
            if (v) u.voice = v;
            // La phrase suivante part dès la fin de celle-ci (+ une courte pause), ou au plus tard
            // après une durée estimée : Firefox signale la fin de la parole avec du retard.
            // Si la voix parle encore, la phrase suivante attend simplement son tour.
            const pause = pauseMs == null ? 150 : pauseMs;
            let done = false;
            const go = () => { if (!done) { done = true; next(i + 1); } };
            u.onend = () => setTimeout(go, pause);
            u.onerror = go;
            window.speechSynthesis.speak(u);
            setTimeout(go, 250 + list[i].length * 60 + pause);
        };
        next(0);
    } catch (e) {}
}
function _cdEl(tag, attrs, parent) {
    const el = document.createElementNS(CD_NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(el);
    return el;
}
function _cdRand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

// Décomposition en dés (chaque dé ≤ 6), variée : 7 → 5 + 2, 4 + 3, 6 + 1…
function _cdSplitDes(n) {
    if (n <= 6) return [n];
    const k = Math.ceil(n / 6);
    const opts = [];
    const rec = (left, parts) => {
        if (parts.length === k - 1) { if (left >= 1 && left <= 6) opts.push(parts.concat(left)); return; }
        for (let a = 1; a <= 6; a++) if (left - a >= 1) rec(left - a, parts.concat(a));
    };
    rec(n, []);
    // on préfère les dés « équilibrés » et la grande valeur d'abord
    const good = opts.filter(o => o.every((x, i) => i === 0 || x <= o[i - 1]));
    const list = good.length ? good : opts;
    return list[Math.floor(Math.random() * list.length)] || [6, n - 6];
}
// Jetons éparpillés : positions dans [0,1]² avec une distance minimale
function _cdScatter(n) {
    const minD = n <= 5 ? 0.28 : n <= 10 ? 0.2 : 0.14;
    for (let essai = 0; essai < 40; essai++) {
        const pts = [];
        let guard = 0;
        while (pts.length < n && guard++ < 3000) {
            const p = [0.08 + Math.random() * 0.84, 0.1 + Math.random() * 0.8];
            if (pts.every(q => Math.hypot((p[0] - q[0]) * 1.6, p[1] - q[1]) >= minD)) pts.push(p);
        }
        if (pts.length === n) return pts.map(p => [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]);
    }
    const out = [];
    for (let i = 0; i < n; i++) out.push([0.1 + 0.8 * ((i % 5) / 4), 0.2 + 0.6 * Math.floor(i / 5) / 3]);
    return out;
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

    if (document.getElementById('cd-style')) return;
    const s = document.createElement('style');
    s.id = 'cd-style';
    s.textContent = `
        .widget[data-type="constellations-doigts"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .cd-container {
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
        .cd-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .cd-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .cd-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #dbeafe; color: #1e40af; }

        .cd-container.wf-minimized > *:not(.cd-header) { display: none !important; }
        .cd-container.wf-minimized { gap: 0; }
        .cd-container.wf-fullboard {
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
            .cd-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
            .cd-container .cd-sep { display: none; }
            .cd-container .cd-badge { display: none; }
            .cd-container .cd-tools { gap: 4px; padding: 4px; }
            .cd-container .cd-btn { padding: 4px 8px; }
            .cd-container .cd-seg button { padding: 4px 7px; }
            .cd-container .cd-info, .cd-container.wf-fullboard .cd-info { font-size: 14px; }
            .cd-container .cd-play .cd-btn, .cd-container.wf-fullboard .cd-play .cd-btn { font-size: 13px; padding: 6px 10px; }
        }

        .cd-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .cd-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .cd-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .cd-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .cd-btn:active { transform: scale(0.96); }
        .cd-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .cd-btn-blue  { background: #4a90e2; color: #fff; }
        .cd-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .cd-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .cd-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .cd-btn-green { background: #28a745; color: #fff; }
        .cd-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .cd-btn-orange { background: #f59e0b; color: #fff; }
        .cd-btn-orange:hover:not(:disabled) { background: #d97706; }
        .cd-btn.on    { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .cd-seg { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .cd-seg button {
            padding: 5px 9px; border: none; background: #f5f5f5; font-size: 11px; font-weight: 700;
            color: #555; cursor: pointer; border-right: 1px solid #ddd;
        }
        .cd-seg button:last-child { border-right: none; }
        .cd-seg button.active { background: #dbeafe; color: #1e40af; }

        /* Scène */
        .cd-stage {
            position: relative; flex-shrink: 0; box-sizing: border-box; overflow: hidden;
            background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px;
        }
        .cd-stage svg { display: block; width: 100%; height: 100%; }
        .cd-cover {
            position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: repeating-linear-gradient(45deg, #eef2ff, #eef2ff 18px, #e0e7ff 18px, #e0e7ff 36px);
            color: #3730a3; font-weight: 900; font-family: 'Nunito', 'Segoe UI', sans-serif;
            transition: opacity .15s;
        }
        .cd-cover .q { font-size: var(--cd-q, 110px); line-height: 1; }
        .cd-cover .t { font-size: max(14px, calc(var(--cd-q, 110px) * .2)); color: #4338ca; margin-top: .3em; }
        .cd-cover.hide { opacity: 0; pointer-events: none; }
        .cd-answer {
            position: absolute; right: 12px; top: 10px; display: flex; flex-direction: column; align-items: center;
            background: #fff; border: 3px solid #16a34a; border-radius: 16px; padding: 4px 16px 6px;
            box-shadow: 0 4px 14px rgba(0,0,0,.12); font-family: 'Nunito', 'Segoe UI', sans-serif;
            animation: cdPop .35s ease-out;
        }
        .cd-answer .n { font-size: var(--cd-a, 64px); font-weight: 900; color: #15803d; line-height: 1.05; }
        .cd-answer .m { font-size: max(13px, calc(var(--cd-a, 64px) * .3)); font-weight: 800; color: #166534; }
        .cd-answer .d { font-size: max(12px, calc(var(--cd-a, 64px) * .24)); font-weight: 700; color: #6b7280; }
        @keyframes cdPop { 0% { transform: scale(.6); opacity: 0; } 70% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
        .cd-timer { position: absolute; left: 0; bottom: 0; height: 5px; background: #f59e0b; border-radius: 0 3px 3px 0; }

        .cd-play { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .cd-play .cd-btn { font-size: 15px; padding: 8px 18px; border-radius: 10px; }
        .cd-container.wf-fullboard .cd-play .cd-btn { font-size: 18px; padding: 10px 22px; }

        /* Pavé de réponse */
        .cd-pad { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
        .cd-key {
            min-width: 40px; height: 40px; border-radius: 10px; border: 2px solid #c7d2fe; background: #fff;
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 900; font-size: 20px; color: #3730a3; cursor: pointer;
        }
        .cd-key:hover:not(:disabled) { background: #eef2ff; }
        .cd-key:disabled { opacity: .5; cursor: default; }
        .cd-key.ok { background: #dcfce7; border-color: #16a34a; color: #15803d; }
        .cd-key.ko { background: #fee2e2; border-color: #dc2626; color: #b91c1c; }

        .cd-info {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4; min-height: 24px;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
            display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .cd-info .txt { flex: 1; min-width: 160px; }
        .cd-info .score { font-weight: 800; color: #1e40af; white-space: nowrap; }
        .cd-info.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .cd-info.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .cd-container.wf-fullboard .cd-info { font-size: 19px; }

        /* Aide */
        .cd-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cd-help-btn:hover { background: #e0e0e0; color: #333; }
        .cd-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .cd-help-popup.show { display: block; }
        .cd-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .cd-help-popup p { margin: 0 0 6px; }
        .cd-help-popup p:last-child { margin-bottom: 0; }

        .cd-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .cd-container:hover .cd-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Création du widget ────────────────────────────────────────────────────
function createConstellationsDoigtsWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'constellations-doigts';
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
    container.className = 'cd-container';
    const initW = Math.round(window.innerWidth * 0.65);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'cd-header';
    header.innerHTML = `
        <span class="cd-title">🎲 Constellations et doigts</span>
        <span class="cd-badge">Dés · 1 à 6</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.cd-badge');
    container.appendChild(header);

    // ── Réglages ──────────────────────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'cd-tools';
    tools.innerHTML = `
        <div class="cd-seg" data-group="rep">
            ${Object.keys(CD_REPS).map(k => `<button data-rep="${k}" title="${CD_REPS[k].titre}">${CD_REPS[k].lbl}</button>`).join('')}
        </div>
        <span class="cd-sep"></span>
        <div class="cd-seg" data-group="range">
            ${Object.keys(CD_RANGES).map(k => `<button data-range="${k}">${CD_RANGES[k].lbl}</button>`).join('')}
        </div>
        <span class="cd-sep"></span>
        <span style="display:inline-flex;gap:5px;align-items:center"><span class="cd-lbl">Durée</span>
        <div class="cd-seg" data-group="duree">
            ${Object.keys(CD_DUREES).map(k => `<button data-duree="${k}" title="${CD_DUREES[k].titre || 'Affichage pendant ' + CD_DUREES[k].lbl}">${CD_DUREES[k].lbl}</button>`).join('')}
        </div></span>
        <span class="cd-sep"></span>
        <button class="cd-btn cd-btn-grey" data-act="toggle-pad" title="Afficher des boutons-nombres pour répondre (travail en autonomie)">🔢 Pavé</button>
        <button class="cd-btn cd-btn-grey" data-act="toggle-pouce" title="Doigts : commencer à compter par le pouce (sinon par l'index)">👍 Pouce = 1</button>
        <button class="cd-btn cd-btn-grey" data-act="toggle-voice" title="Dire le nombre quand la réponse s'affiche">🔊 Voix</button>
    `;
    container.appendChild(tools);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'cd-stage';
    stage.style.height = Math.round(initH * 0.62) + 'px';
    const svg = document.createElementNS(CD_NS, 'svg');
    stage.appendChild(svg);
    const cover = document.createElement('div');
    cover.className = 'cd-cover';
    stage.appendChild(cover);
    const timerBar = document.createElement('div');
    timerBar.className = 'cd-timer';
    stage.appendChild(timerBar);
    container.appendChild(stage);

    // ── Boutons de jeu ────────────────────────────────────────────────────
    const play = document.createElement('div');
    play.className = 'cd-play';
    play.innerHTML = `
        <button class="cd-btn cd-btn-blue"   data-act="flash"  title="Montrer une nouvelle quantité (touche Espace)">▶ Montrer</button>
        <button class="cd-btn cd-btn-grey"   data-act="hide"   title="Cacher la quantité">🙈 Cacher</button>
        <button class="cd-btn cd-btn-orange" data-act="again"  title="Montrer à nouveau la même quantité">👁 Revoir</button>
        <button class="cd-btn cd-btn-green"  data-act="answer" title="Afficher la réponse">✓ Réponse</button>
    `;
    container.appendChild(play);

    const pad = document.createElement('div');
    pad.className = 'cd-pad';
    container.appendChild(pad);

    const info = document.createElement('div');
    info.className = 'cd-info';
    container.appendChild(info);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'cd-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'cd-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Constellations et doigts</h4>
        <p><b>▶ Montrer</b> (ou la touche <b>Espace</b>) affiche une quantité pendant la durée choisie, puis la cache.
        Les élèves disent ou écrivent le nombre <b>sans compter un par un</b> : ils « voient » la quantité (subitizing).</p>
        <p><b>👁 Revoir</b> remontre la même quantité, <b>✓ Réponse</b> l'affiche avec le nombre, son nom et une
        décomposition (« 5 et 2 », « 4 + 3 »), lus à voix haute avec <b>🔊 Voix</b>.</p>
        <p>Représentations : <b>dés</b> (deux ou trois dés au-delà de 6), <b>doigts</b> (une main pleine + l'autre main
        au-delà de 5 ; <b>👍 Pouce = 1</b> ou en commençant par l'index), <b>jetons éparpillés</b>, <b>boîte de 10</b>, ou <b>au hasard</b>.
        Au-delà de 10, les doigts sont remplacés par la boîte de 10.</p>
        <p><b>🔢 Pavé</b> : des boutons-nombres pour répondre en autonomie, avec le score de la série.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'cd-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let rep = 'des';
    let range = '6';
    let duree = '2';
    let showPad = false;
    let pouce = true;
    let voice = true;
    let cur = null;        // { n, kind, parts (dés / mains), pts (jetons), color }
    let phase = 'idle';    // idle | shown | hidden | answer
    let picked = null;     // réponse choisie au pavé
    let score = { ok: 0, total: 0 };
    let timer = null, timerAnim = null;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Tirage ────────────────────────────────────────────────────────────
    function kindFor(n) {
        let k = rep;
        if (k === 'hasard') {
            const ks = ['des', 'doigts', 'jetons', 'boite'].filter(x => !(x === 'doigts' && n > 10) && !(x === 'des' && n > 18));
            k = ks[Math.floor(Math.random() * ks.length)];
        }
        if (k === 'doigts' && n > 10) k = 'boite';
        if (k === 'des' && n > 18) k = 'boite';
        return k;
    }
    function draw() {
        const max = CD_RANGES[range].max;
        let n, guard = 0;
        do { n = _cdRand(1, max); } while (cur && n === cur.n && max > 1 && guard++ < 10);
        const kind = kindFor(n);
        const q = { n, kind, color: CD_COULEURS[Math.floor(Math.random() * CD_COULEURS.length)] };
        if (kind === 'des') q.parts = _cdSplitDes(n);
        if (kind === 'doigts') q.parts = n <= 5 ? [n] : [5, n - 5];
        if (kind === 'jetons') q.pts = _cdScatter(n);
        if (kind === 'boite') q.parts = n <= 10 ? [n] : [10, n - 10];
        return q;
    }
    function decomposition(q) {
        if (!q) return '';
        if (q.kind === 'des' && q.parts.length > 1) return q.parts.join(' + ');
        if (q.kind === 'doigts' && q.parts.length > 1) return '5 et ' + q.parts[1];
        if (q.kind === 'boite') return q.n === 10 ? 'une dizaine' : q.n > 10 ? '10 et ' + (q.n - 10) : (q.n >= 5 ? '5 et ' + (q.n - 5) : (10 - q.n) + ' pour faire 10');
        return '';
    }

    // ── Dessin ────────────────────────────────────────────────────────────
    function renderSvg() {
        const W = stage.clientWidth || 600, H = stage.clientHeight || 300;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.innerHTML = '';
        if (!cur) return;
        const pad = Math.min(W, H) * 0.07;
        const bw = W - pad * 2, bh = H - pad * 2;
        if (cur.kind === 'des') drawDes(cur.parts, pad, pad, bw, bh);
        else if (cur.kind === 'doigts') drawMains(cur.parts, pad, pad, bw, bh);
        else if (cur.kind === 'jetons') drawJetons(cur.pts, pad, pad, bw, bh, cur.color || CD_COULEURS[0]);
        else if (cur.kind === 'boite') drawBoites(cur.parts, pad, pad, bw, bh, cur.color || CD_COULEURS[0]);
    }

    function drawDes(parts, x, y, w, h) {
        const n = parts.length, gap = 0.25;
        const s = Math.min(h, w / (n + gap * (n - 1)));
        let x0 = x + (w - (s * n + s * gap * (n - 1))) / 2;
        const y0 = y + (h - s) / 2;
        parts.forEach((v, i) => {
            const dx = x0 + i * s * (1 + gap);
            _cdEl('rect', { x: dx, y: y0, width: s, height: s, rx: s * 0.16, fill: '#fff', stroke: '#334155', 'stroke-width': Math.max(2, s * 0.025) }, svg);
            (CD_DE[v] || []).forEach(([cx, cy]) => {
                _cdEl('circle', { cx: dx + s * (0.22 + cx * 0.28), cy: y0 + s * (0.22 + cy * 0.28), r: s * 0.095, fill: '#1e293b' }, svg);
            });
        });
    }

    function drawJetons(pts, x, y, w, h, color) {
        const n = pts.length;
        const r = Math.min(w, h) * (n <= 5 ? 0.075 : n <= 10 ? 0.06 : 0.045);
        pts.forEach(([px, py]) => {
            _cdEl('circle', { cx: x + px * w, cy: y + py * h, r, fill: color, stroke: 'rgba(0,0,0,.25)', 'stroke-width': Math.max(1.5, r * 0.08) }, svg);
        });
    }

    function drawBoites(parts, x, y, w, h, color) {
        const n = parts.length, gapB = 0.6;
        // une boîte : 5 colonnes × 2 lignes ; deux boîtes l'une sous l'autre
        const cell = Math.min(w / 5, h / (2 * n + gapB * (n - 1)));
        const bwid = cell * 5, bhei = cell * 2;
        const totH = bhei * n + cell * gapB * (n - 1);
        const x0 = x + (w - bwid) / 2, y0 = y + (h - totH) / 2;
        parts.forEach((v, b) => {
            const by = y0 + b * (bhei + cell * gapB);
            _cdEl('rect', { x: x0, y: by, width: bwid, height: bhei, fill: '#fff', stroke: '#334155', 'stroke-width': Math.max(2, cell * 0.05), rx: cell * 0.06 }, svg);
            for (let i = 1; i < 5; i++) _cdEl('line', { x1: x0 + i * cell, x2: x0 + i * cell, y1: by, y2: by + bhei, stroke: '#94a3b8', 'stroke-width': Math.max(1, cell * 0.025) }, svg);
            _cdEl('line', { x1: x0, x2: x0 + bwid, y1: by + cell, y2: by + cell, stroke: '#94a3b8', 'stroke-width': Math.max(1, cell * 0.025) }, svg);
            for (let i = 0; i < v; i++) {
                const cx = x0 + (i % 5 + 0.5) * cell, cy = by + (Math.floor(i / 5) + 0.5) * cell;
                _cdEl('circle', { cx, cy, r: cell * 0.36, fill: color, stroke: 'rgba(0,0,0,.25)', 'stroke-width': Math.max(1.5, cell * 0.03) }, svg);
            }
        });
    }

    // Une main stylisée : paume + 5 doigts ; doigt levé = long, doigt plié = court
    // ordre des doigts : 0 pouce, 1 index, 2 majeur, 3 annulaire, 4 auriculaire
    function drawMain(cx, by, s, raised, mirror) {
        const g = _cdEl('g', { transform: `translate(${cx} ${by}) scale(${mirror ? -s : s} ${s})` }, svg);
        const skin = '#f8d3ad', line = '#b7794b', sw = 0.035;
        // doigts (repère : paume de x −0.5 à 0.5, haut de la paume à y = −1.0, bas à y = 0)
        const fingers = [
            null,
            { x: -0.36, len: 0.92 },
            { x: -0.12, len: 1.02 },
            { x: 0.12,  len: 0.94 },
            { x: 0.35,  len: 0.74 }
        ];
        const fw = 0.215;
        for (let i = 1; i <= 4; i++) {
            const f = fingers[i];
            const L = raised[i] ? f.len : 0.22;
            _cdEl('rect', { x: f.x - fw / 2, y: -1.0 - L, width: fw, height: L + 0.25, rx: fw / 2,
                fill: skin, stroke: line, 'stroke-width': sw }, g);
            if (raised[i]) _cdEl('path', { d: `M${f.x - fw * 0.28} ${-1.0 - L + 0.08} q${fw * 0.28} -0.04 ${fw * 0.56} 0`, fill: 'none', stroke: '#e9b48b', 'stroke-width': 0.03 }, g);
        }
        // pouce levé : écarté sur le côté de la paume (dessiné derrière la paume)
        if (raised[0]) {
            _cdEl('rect', { x: -0.125, y: -0.74, width: 0.25, height: 0.84, rx: 0.125,
                fill: skin, stroke: line, 'stroke-width': sw, transform: 'translate(-0.4 -0.36) rotate(-42)' }, g);
        }
        // paume
        _cdEl('path', { d: 'M-0.5 -1.0 L0.5 -1.0 Q0.52 -0.35 0.38 -0.08 Q0.2 0.08 0 0.08 Q-0.25 0.08 -0.4 -0.08 Q-0.52 -0.35 -0.5 -1.0 Z',
            fill: skin, stroke: line, 'stroke-width': sw }, g);
        // poignet
        _cdEl('rect', { x: -0.3, y: 0.02, width: 0.6, height: 0.3, rx: 0.06, fill: skin, stroke: line, 'stroke-width': sw }, g);
        // pouce replié : couché en travers de la paume
        if (!raised[0]) {
            _cdEl('rect', { x: -0.52, y: -0.62, width: 0.62, height: 0.24, rx: 0.12,
                fill: skin, stroke: line, 'stroke-width': sw, transform: 'rotate(-12 -0.2 -0.5)' }, g);
        }
        // plis des doigts repliés (petits traits sur la paume)
        for (let i = 1; i <= 4; i++) if (!raised[i]) {
            const f = fingers[i];
            _cdEl('path', { d: `M${f.x - fw * 0.35} -0.98 L${f.x + fw * 0.35} -0.98`, stroke: line, 'stroke-width': 0.025 }, g);
        }
    }
    function raisedFor(k) {
        const order = pouce ? [0, 1, 2, 3, 4] : [1, 2, 3, 4, 0];
        const r = [false, false, false, false, false];
        for (let i = 0; i < k; i++) r[order[i]] = true;
        return r;
    }
    function drawMains(parts, x, y, w, h) {
        const n = parts.length;
        // une main occupe environ 1.5 × 2.6 unités
        const s = Math.min(h / 2.45, w / (n * 1.75 + (n - 1) * 0.35));
        const totW = s * (n * 1.75 + (n - 1) * 0.35);
        const x0 = x + (w - totW) / 2;
        const by = y + h - s * 0.32;
        parts.forEach((k, i) => {
            const cx = x0 + s * (0.95 + i * (1.75 + 0.35));
            // deux mains : main gauche (en miroir) puis main droite, pouces vers l'intérieur
            const mirror = n > 1 && i === 0;
            drawMain(cx, by, s, raisedFor(k), n > 1 ? mirror : false);
        });
    }

    // ── Affichage ─────────────────────────────────────────────────────────
    function renderCover() {
        const q = Math.max(48, Math.min(stage.clientHeight * 0.5, 200));
        stage.style.setProperty('--cd-q', q + 'px');
        stage.style.setProperty('--cd-a', Math.max(34, Math.min(stage.clientHeight * 0.28, 120)) + 'px');
        if (phase === 'idle') {
            cover.className = 'cd-cover';
            cover.innerHTML = `<span class="q">🎲</span><span class="t">Clique sur ▶ Montrer</span>`;
        } else if (phase === 'hidden') {
            cover.className = 'cd-cover';
            cover.innerHTML = `<span class="q">?</span><span class="t">Combien ?</span>`;
        } else {
            cover.className = 'cd-cover hide';
            cover.innerHTML = '';
        }
        const old = stage.querySelector('.cd-answer');
        if (old) old.remove();
        if (phase === 'answer' && cur) {
            const a = document.createElement('div');
            a.className = 'cd-answer';
            const d = decomposition(cur);
            a.innerHTML = `<span class="n">${cur.n}</span><span class="m">${CD_MOTS[cur.n] || ''}</span>${d ? `<span class="d">${d}</span>` : ''}`;
            stage.appendChild(a);
        }
    }
    function renderPad() {
        pad.style.display = showPad ? '' : 'none';
        if (!showPad) return;
        const max = CD_RANGES[range].max;
        let h = '';
        for (let i = 1; i <= max; i++) {
            let cls = '';
            if (picked != null && cur) {
                if (i === cur.n) cls = 'ok';
                else if (i === picked) cls = 'ko';
            }
            h += `<button class="cd-key ${cls}" data-key="${i}" ${picked != null || phase === 'idle' ? 'disabled' : ''}>${i}</button>`;
        }
        pad.innerHTML = h;
    }
    function setInfo(cls, html) {
        info.className = 'cd-info' + (cls ? ' ' + cls : '');
        const sc = showPad && score.total ? `<span class="score">⭐ ${score.ok} / ${score.total}</span>` : '';
        info.innerHTML = `<span class="txt">${html}</span>${sc}`;
    }
    function renderInfo() {
        if (phase === 'idle') setInfo('', '👀 Une quantité va s\'afficher très vite : dis le nombre <b>sans compter un par un</b>.');
        else if (phase === 'shown') setInfo('', '👀 Regarde bien…');
        else if (phase === 'hidden') setInfo('', showPad ? '🤔 Combien y en avait-il ? Touche le bon nombre.' : '🤔 Combien y en avait-il ? Dis-le, puis clique sur <b>✓ Réponse</b>.');
        else if (phase === 'answer') {
            if (picked != null) {
                const ok = picked === cur.n;
                setInfo(ok ? 'ok' : 'warn', ok ? `🌟 Bravo, c'est <b>${cur.n}</b> !` : `Ce n'était pas ${picked} : c'était <b>${cur.n}</b>. ${decomposition(cur) ? 'Regarde : ' + decomposition(cur) + '.' : ''}`);
            } else setInfo('ok', `✓ C'était <b>${cur.n}</b>${decomposition(cur) ? ' : ' + decomposition(cur) : ''}. Clique sur <b>▶ Montrer</b> pour continuer.`);
        }
    }
    function renderBars() {
        tools.querySelectorAll('[data-rep]').forEach(b => b.classList.toggle('active', b.dataset.rep === rep));
        tools.querySelectorAll('[data-range]').forEach(b => b.classList.toggle('active', b.dataset.range === range));
        tools.querySelectorAll('[data-duree]').forEach(b => b.classList.toggle('active', b.dataset.duree === duree));
        tools.querySelector('[data-act="toggle-pad"]').classList.toggle('on', showPad);
        tools.querySelector('[data-act="toggle-pouce"]').classList.toggle('on', pouce);
        tools.querySelector('[data-act="toggle-pouce"]').textContent = pouce ? '👍 Pouce = 1' : '☝️ Index = 1';
        tools.querySelector('[data-act="toggle-voice"]').classList.toggle('on', voice);
        play.querySelector('[data-act="flash"]').textContent = phase === 'idle' ? '▶ Montrer' : '▶ Suivant';
        play.querySelector('[data-act="hide"]').disabled = phase !== 'shown';
        play.querySelector('[data-act="again"]').disabled = !cur || phase === 'shown' || phase === 'idle';
        play.querySelector('[data-act="answer"]').disabled = !cur || phase === 'answer' || phase === 'idle';
        badge.textContent = CD_REPS[rep].lbl.replace(/^\S+\s/, '') + ' · ' + CD_RANGES[range].lbl;
    }
    function renderAll() {
        renderBars();
        renderSvg();
        renderCover();
        renderPad();
        renderInfo();
        if (_isMax) requestAnimationFrame(fitFullHeight);
    }

    // ── Déroulement ───────────────────────────────────────────────────────
    function clearTimer() {
        clearTimeout(timer); timer = null;
        if (timerAnim) { timerAnim.cancel(); timerAnim = null; }
        timerBar.style.width = '0';
    }
    function show() {
        clearTimer();
        phase = 'shown';
        renderAll();
        const ms = CD_DUREES[duree].ms;
        if (ms) {
            timerBar.style.width = '100%';
            try { timerAnim = timerBar.animate([{ width: '100%' }, { width: '0%' }], { duration: ms, easing: 'linear', fill: 'forwards' }); } catch (e) {}
            timer = setTimeout(hide, ms);
        }
    }
    function flash() {
        cur = draw();
        picked = null;
        show();
        save();
    }
    function hide() {
        clearTimer();
        if (phase !== 'shown') return;
        phase = 'hidden';
        renderAll();
        save();
    }
    function answer() {
        if (!cur || phase === 'idle') return;
        clearTimer();
        phase = 'answer';
        renderAll();
        if (voice) {
            // le nombre, une pause, puis la décomposition dite en mots (« cinq et trois »)
            const d = decomposition(cur);
            const dit = d ? d.replace(/\d+/g, x => CD_MOTS[+x] || x).replace(/\+/g, 'plus') : '';
            _cdSpeak([CD_MOTS[cur.n] || String(cur.n), dit], 150);
        }
        save();
    }
    function pick(n) {
        if (!cur || picked != null || phase === 'idle') return;
        picked = n;
        score.total++;
        if (n === cur.n) score.ok++;
        answer();
    }

    // ── Événements ────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-rep],[data-range],[data-duree],[data-key]');
        if (!b || !container.contains(b)) return;
        e.stopPropagation();
        if (b.dataset.key) { pick(+b.dataset.key); return; }
        if (b.dataset.rep)   { rep = b.dataset.rep; renderBars(); save(); return; }
        if (b.dataset.range) { range = b.dataset.range; score = { ok: 0, total: 0 }; renderBars(); renderPad(); renderInfo(); save(); return; }
        if (b.dataset.duree) { duree = b.dataset.duree; renderBars(); save(); return; }
        switch (b.dataset.act) {
            case 'flash': flash(); break;
            case 'hide': hide(); break;
            case 'again': if (cur) show(); break;
            case 'answer': answer(); break;
            case 'toggle-pad': showPad = !showPad; renderAll(); save(); break;
            case 'toggle-pouce': pouce = !pouce; renderBars(); renderSvg(); save(); break;
            case 'toggle-voice': voice = !voice; renderBars(); save(); break;
        }
    });
    cover.addEventListener('click', (e) => { e.stopPropagation(); if (phase === 'idle') flash(); });

    widget.addEventListener('keydown', (e) => {
        const tg = e.target.tagName;
        if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault(); e.stopPropagation();
            if (phase === 'shown') hide();
            else if (phase === 'hidden') answer();
            else flash();
        } else if (/^[0-9]$/.test(e.key) && showPad && phase === 'hidden') {
            e.stopPropagation();
            pick(+e.key === 0 ? 10 : +e.key);
        }
    });

    // Les zones de travail ne déplacent pas le widget
    [tools, stage, play, pad, info].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la scène) ───────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(420, startW + x - x0) + 'px';
            stage.style.height    = Math.max(150, startH + y - y0) + 'px';
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

    let _lastSize = '';
    function onStageResize() {
        const sz = stage.clientWidth + 'x' + stage.clientHeight;
        if (sz === _lastSize || !stage.clientWidth) return;
        _lastSize = sz;
        renderSvg();
        renderCover();
    }
    let _ro = null;
    if (typeof ResizeObserver === 'function') { _ro = new ResizeObserver(onStageResize); _ro.observe(stage); }
    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); if (_ro) _ro.disconnect(); clearTimer(); return; }
        if (_isMax) fitFullHeight();
        onStageResize();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    function fitFullHeight() {
        const others = [header, tools, play, pad, info].reduce((a, el) => a + (el.offsetHeight || 0), 0);
        const avail = window.innerHeight - others - 9 * 5 - 30;
        stage.style.height = Math.max(160, Math.round(avail)) + 'px';
        onStageResize();
    }

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🎲 Constellations et doigts', { onExpand: () => requestAnimationFrame(onStageResize) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(onStageResize);
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
        requestAnimationFrame(onStageResize);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimer();
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
    _lastSize = stage.clientWidth + 'x' + stage.clientHeight;

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._cdGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        rep, range, duree, showPad, pouce, voice,
        cur: cur ? JSON.parse(JSON.stringify(cur)) : null,
        phase: phase === 'shown' ? 'hidden' : phase,
        picked, score: Object.assign({}, score),
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_cdIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._cdSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_cdIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        clearTimer();
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        if (CD_REPS[d.rep]) rep = d.rep;
        if (CD_RANGES[d.range]) range = d.range;
        if (CD_DUREES[d.duree]) duree = d.duree;
        if (typeof d.showPad === 'boolean') showPad = d.showPad;
        if (typeof d.pouce === 'boolean') pouce = d.pouce;
        if (typeof d.voice === 'boolean') voice = d.voice;
        cur = null; phase = 'idle'; picked = null;
        const c = d.cur;
        if (c && Number.isInteger(c.n) && c.n >= 1 && c.n <= 20 && ['des', 'doigts', 'jetons', 'boite'].includes(c.kind)) {
            const okParts = Array.isArray(c.parts) && c.parts.every(x => Number.isInteger(x) && x >= 0 && x <= 10);
            const okPts = Array.isArray(c.pts) && c.pts.length === c.n;
            if ((c.kind === 'jetons' && okPts) || (c.kind !== 'jetons' && okParts)) {
                cur = c;
                phase = ['hidden', 'answer'].includes(d.phase) ? d.phase : 'hidden';
                picked = Number.isInteger(d.picked) ? d.picked : null;
            }
        }
        if (d.score && Number.isInteger(d.score.ok) && Number.isInteger(d.score.total)) score = { ok: d.score.ok, total: d.score.total };
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(onStageResize, 250);
    };

    saveBoard();
    return widget;
}
