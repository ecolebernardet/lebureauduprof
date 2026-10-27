// =========================================================================
// WIDGET ZOOM SUR LES DÉCIMAUX — Le Bureau du Prof
// Une droite graduée que l'on agrandit à la loupe : on clique entre 2 et 3,
// la droite zoome et montre les dixièmes (2,1 ; 2,2 ; …) ; on clique entre
// 2,4 et 2,5 et l'on voit les centièmes, puis les millièmes.
// Au-dessus de la droite, la droite précédente reste visible avec la partie
// agrandie (effet loupe), pour comprendre d'où viennent les dixièmes et les
// centièmes.
//   - Mode Explorer : zoomer librement, cliquer une graduation pour lire le
//     nombre et sa décomposition (unités, dixièmes, centièmes, millièmes),
//     ou taper un nombre pour que la droite zoome toute seule jusqu'à lui.
//   - Mode Défi : un nombre est donné, il faut zoomer dans le bon intervalle
//     puis cliquer la bonne graduation.
//
// Même fenêtre que « Le mot le plus long » : redimensionnement libre,
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

    if (document.getElementById('zd-style')) return;
    const s = document.createElement('style');
    s.id = 'zd-style';
    s.textContent = `
        .widget[data-type="zoom-decimaux"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .zd-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .zd-container input { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .zd-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; user-select: none; }
        .zd-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.3px; pointer-events: none; }
        .zd-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px; background: #fef3c7; color: #92400e; }

        /* Réduit / plein écran */
        .zd-container.wf-minimized > *:not(.zd-header) { display: none !important; }
        .zd-container.wf-minimized { gap: 0; }
        .zd-container.wf-fullboard {
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
            .zd-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .zd-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .zd-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .zd-btn:active { transform: scale(0.96); }
        .zd-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .zd-btn-blue  { background: #4a90e2; color: white; }
        .zd-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .zd-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .zd-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .zd-btn-green { background: #28a745; color: white; }
        .zd-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .zd-mode-btns, .zd-prec-btns { display: flex; gap: 4px; }
        .zd-chip {
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            color: #666;
            transition: background .15s;
        }
        .zd-chip:hover { background: #e0e0e0; }
        .zd-chip.active { background: #fef3c7; color: #92400e; border-color: #f4d58d; }
        .zd-right { margin-left: auto; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .zd-goto-input {
            width: 90px;
            padding: 5px 8px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            outline: none;
            text-align: center;
        }
        .zd-goto-input:focus { border-color: #4a90e2; }
        .zd-goto-input.bad { border-color: #dc2626; background: #fff5f5; }
        .zd-label-sm { font-size: 11px; font-weight: 700; color: #6b7280; }

        /* Fil d'Ariane des zooms */
        .zd-crumbs { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; min-height: 26px; }
        .zd-crumb {
            padding: 3px 9px;
            border-radius: 20px;
            border: 1.5px solid var(--rc);
            background: #fff;
            color: var(--rc);
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: background .15s;
        }
        .zd-crumb:hover { background: #f8fafc; }
        .zd-crumb.current { background: var(--rc); color: #fff; cursor: default; }
        .zd-crumb-sep { color: #9ca3af; font-size: 12px; font-weight: 800; }

        /* Consigne du défi */
        .zd-target {
            display: none;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            padding: 6px 12px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 700;
            color: #7c2d12;
        }
        .zd-target.show { display: flex; }
        .zd-target-num { font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: 30px; font-weight: 900; letter-spacing: .5px; }
        .zd-score { margin-left: auto; font-size: 13px; color: #9a3412; }

        /* Zone de la droite */
        .zd-zone {
            position: relative;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: hidden;
        }
        .zd-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; font-family: 'Nunito', 'Segoe UI', sans-serif; }
        .zd-seg { fill: transparent; cursor: zoom-in; transition: fill .15s; }
        .zd-seg:hover { fill: rgba(250, 204, 21, 0.22); }
        .zd-seg.nozoom { cursor: default; }
        .zd-seg.nozoom:hover { fill: transparent; }
        .zd-seg.wrong { animation: zdWrong .7s ease-out; }
        .zd-tick-hit { fill: transparent; cursor: pointer; }
        .zd-tick-hit:hover { fill: rgba(37, 99, 235, 0.10); }
        .zd-tick-hit.wrong { animation: zdWrong .7s ease-out; }
        @keyframes zdWrong { 0% { fill: rgba(220,38,38,.45); } 100% { fill: transparent; } }

        /* Explications */
        .zd-info {
            padding: 8px 12px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 10px;
            color: #0c4a6e;
            font-size: 16px;
            line-height: 1.45;
            min-height: 24px;
        }
        .zd-info.ok  { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .zd-info.ko  { background: #fff5f5; border-color: #fecaca; color: #7f1d1d; }
        .zd-info-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .zd-big { font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: 34px; font-weight: 900; line-height: 1.1; }
        .zd-lines div { margin: 1px 0; }
        .zd-pv { border-collapse: collapse; font-family: 'Nunito', 'Segoe UI', sans-serif; margin-left: auto; }
        .zd-pv th { font-size: 11px; font-weight: 800; padding: 2px 8px; color: #fff; }
        .zd-pv td { font-size: 22px; font-weight: 900; text-align: center; padding: 2px 8px; border: 1px solid #e5e7eb; background: #fff; min-width: 26px; }
        .zd-pv td.zd-comma { border: none; background: transparent; padding: 0 2px; min-width: 0; color: #111827; }
        .zd-pv th.zd-comma { background: transparent; }
        .zd-muted { color: #6b7280; font-size: 14px; }

        /* Aide */
        .zd-help-btn {
            width: 22px; height: 22px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .zd-help-btn:hover { background: #e0e0e0; color: #333; }
        .zd-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 320px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .zd-help-popup.show { display: block; }
        .zd-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .zd-help-popup p { margin: 0 0 6px; }
        .zd-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement */
        .zd-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .zd-container:hover .zd-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Rangs : unités, dixièmes, centièmes, millièmes ────────────────────────
// Toutes les valeurs sont gardées en millièmes entiers (2,47 → 2470) pour
// éviter les erreurs d'arrondi des nombres à virgule.
const ZD_RANKS = [
    { pM: 1000, d: 0, nom: 'unité',    pl: 'unités',    court: 'U', c: '#2563eb' },
    { pM: 100,  d: 1, nom: 'dixième',  pl: 'dixièmes',  court: 'd', c: '#dc2626' },
    { pM: 10,   d: 2, nom: 'centième', pl: 'centièmes', court: 'c', c: '#16a34a' },
    { pM: 1,    d: 3, nom: 'millième', pl: 'millièmes', court: 'm', c: '#9333ea' }
];
const ZD_MAX_LEVEL = 3;                  // niveau 0 : 0 → 10 (unités) … niveau 3 : millièmes
const ZD_VIEW_M = [10000, 1000, 100, 10]; // largeur de la vue à chaque niveau, en millièmes
const ZD_FRAC = ['', '10', '100', '1 000'];

function _zdRankOfP(pM) {
    return ZD_RANKS.find(r => r.pM === pM) || ZD_RANKS[0];
}

// Nombre en millièmes → texte avec d décimales (virgule française)
function _zdFmt(m, d) {
    return (m / 1000).toFixed(d).replace('.', ',');
}

// Borne d'un intervalle : sans zéros inutiles (8 et non 8,0 ; 2,5 et non 2,50)
function _zdFmtB(m, d) {
    return _zdFmt(m, Math.min(d, _zdDecimals(m)));
}

// Chiffres colorés selon leur rang (texte HTML ou tspans SVG)
function _zdDigits(m, d, svg) {
    const txt = (m / 1000).toFixed(d);
    const [ent, dec] = txt.split('.');
    const span = (t, c) => svg
        ? `<tspan fill="${c}">${t}</tspan>`
        : `<span style="color:${c}">${t}</span>`;
    let out = span(ent, ZD_RANKS[0].c);
    if (d > 0) {
        out += span(',', '#111827');
        for (let i = 0; i < dec.length; i++) out += span(dec[i], ZD_RANKS[i + 1].c);
    }
    return out;
}

// Nombre de décimales réellement utiles (2,50 → 1)
function _zdDecimals(m) {
    if (m % 1000 === 0) return 0;
    if (m % 100 === 0) return 1;
    if (m % 10 === 0) return 2;
    return 3;
}

// Lit un nombre tapé : « 2,47 », « 2.47 », « 3 » → millièmes, ou null
function _zdParse(txt) {
    const t = String(txt || '').trim().replace(/\s/g, '').replace('.', ',');
    if (!/^\d{1,2}(,\d{0,3})?$/.test(t)) return null;
    const [e, dRaw] = t.split(',');
    const dec = (dRaw || '').padEnd(3, '0');
    const m = parseInt(e, 10) * 1000 + parseInt(dec || '0', 10);
    if (m < 0 || m > 10000) return null;
    return { m, d: Math.max(_zdDecimals(m), (dRaw || '').replace(/0+$/, '').length) };
}

// Téléphone (même détection que les autres jeux et activités)
function _zdIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createZoomDecimauxWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'zoom-decimaux';
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
    container.className = 'zd-container';

    // Taille initiale : 75 % de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'zd-header';
    header.innerHTML = `
        <span class="zd-title">🔍 Zoom sur les décimaux</span>
        <span class="zd-badge">Explorer</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.zd-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'zd-controls';
    controls.innerHTML = `
        <div class="zd-mode-btns">
            <button class="zd-chip" data-mode="explore" title="Zoomer librement et lire les nombres">🔎 Explorer</button>
            <button class="zd-chip" data-mode="defi" title="Retrouver un nombre donné sur la droite">🎯 Défi</button>
        </div>
        <button class="zd-btn zd-btn-grey" data-act="out" title="Revenir au zoom précédent">⤺ Dézoomer</button>
        <button class="zd-btn zd-btn-grey" data-act="home" title="Revenir à la droite de 0 à 10">⟲ Tout voir</button>
        <div class="zd-right zd-explore-only">
            <span class="zd-label-sm">Aller à</span>
            <input class="zd-goto-input" type="text" inputmode="decimal" maxlength="6" placeholder="2,47" autocomplete="off" spellcheck="false">
            <button class="zd-btn zd-btn-blue" data-act="goto" title="La droite zoome toute seule jusqu'à ce nombre">🔍 Montrer</button>
        </div>
        <div class="zd-right zd-defi-only">
            <div class="zd-prec-btns">
                <button class="zd-chip" data-prec="1" title="Nombres avec des dixièmes (ex. 3,7)">Dixièmes</button>
                <button class="zd-chip" data-prec="2" title="Nombres avec des centièmes (ex. 3,58)">Centièmes</button>
                <button class="zd-chip" data-prec="3" title="Nombres avec des millièmes (ex. 3,582)">Millièmes</button>
            </div>
            <button class="zd-btn zd-btn-blue" data-act="new">🎲 Nouveau défi</button>
            <button class="zd-btn zd-btn-grey" data-act="reveal" title="La droite zoome jusqu'à la bonne réponse">💡 Montrer la solution</button>
        </div>
    `;
    const gotoInput = controls.querySelector('.zd-goto-input');
    const outBtn    = controls.querySelector('[data-act="out"]');
    const homeBtn   = controls.querySelector('[data-act="home"]');
    const revealBtn = controls.querySelector('[data-act="reveal"]');
    container.appendChild(controls);

    // ── Fil des zooms ─────────────────────────────────────────────────────
    const crumbs = document.createElement('div');
    crumbs.className = 'zd-crumbs';
    container.appendChild(crumbs);

    // ── Consigne du défi ──────────────────────────────────────────────────
    const target = document.createElement('div');
    target.className = 'zd-target';
    container.appendChild(target);

    // ── Zone de la droite ─────────────────────────────────────────────────
    const zone = document.createElement('div');
    zone.className = 'zd-zone';
    zone.style.height = Math.round(initH * 0.46) + 'px';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'zd-svg');
    zone.appendChild(svg);
    container.appendChild(zone);

    // ── Explications ──────────────────────────────────────────────────────
    const info = document.createElement('div');
    info.className = 'zd-info';
    container.appendChild(info);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'zd-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'zd-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Zoom sur les décimaux</h4>
        <p>Cliquez <b>entre deux graduations</b> pour zoomer : l'intervalle s'agrandit et se partage en
        <b>10 parts égales</b>. Entre 2 et 3, on voit les <b style="color:#dc2626">dixièmes</b> ; entre 2,4 et 2,5,
        les <b style="color:#16a34a">centièmes</b> ; puis les <b style="color:#9333ea">millièmes</b>.</p>
        <p>La petite droite du haut montre <b>où l'on a zoomé</b> (effet loupe).</p>
        <p>Cliquez <b>sur une graduation</b> pour lire le nombre : sa décomposition, son écriture
        avec des fractions et sa place dans le tableau de numération.</p>
        <p><b>Aller à</b> : tapez un nombre (ex. 2,475) puis <b>Montrer</b> : la droite zoome toute seule jusqu'à lui.
        Toutes les droites restent affichées l'une sous l'autre (unités, dixièmes, centièmes, millièmes) ;
        faites défiler si besoin.</p>
        <p><b>🎯 Défi</b> : un nombre est donné. Zoomez dans le bon intervalle, puis cliquez la bonne graduation.
        Choisissez la difficulté : dixièmes, centièmes ou millièmes.</p>
        <p><b>⤺ Dézoomer</b>, <b>⟲ Tout voir</b> ou les pastilles colorées permettent de revenir en arrière.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'zd-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let mode = 'explore';
    let path = [0];          // début de la vue (en millièmes) à chaque niveau de zoom
    let sel = null;          // graduation choisie : { m, d }
    let prec = 2;            // difficulté du défi : nombre de décimales
    let defi = null;         // { m, d, found, errs, aide }
    let score = { ok: 0, errs: 0 };
    let message = null;      // { html, cls } : message ponctuel du défi
    let anim = null;         // vue en cours d'animation : { lo, hi } (en unités)
    let busy = false;        // pendant une animation, les clics sont ignorés
    let stack = false;       // affichage « en escalier » : toutes les droites l'une sous l'autre (zoom automatique)
    let animSeg = null;      // intervalle en cours d'agrandissement (en millièmes)
    let lastRows = 0;

    const level = () => path.length - 1;
    const viewLoM = () => path[level()];
    const viewWM = () => ZD_VIEW_M[level()];
    const stepM = () => viewWM() / 10;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Dessin de la droite ───────────────────────────────────────────────
    // Dessine une droite allant de lo à hi (en unités) à la hauteur y.
    // opts : minPM (plus petite graduation dessinée), maxFs, hit, small
    function lineSVG(lo, hi, y, W, H, mx, opts) {
        const len = W - 2 * mx;
        const scale = len / (hi - lo);          // pixels par unité
        const X = u => mx + (u - lo) * scale;
        let out = `<line x1="${mx}" y1="${y}" x2="${W - mx}" y2="${y}" stroke="#111827" stroke-width="${opts.small ? 1.5 : 2.5}" stroke-linecap="round"/>`;
        // 1) Rangs visibles : écart entre graduations, taille de texte, une étiquette sur combien
        const ranks = [];
        ZD_RANKS.forEach(r => {
            if (r.pM < opts.minPM) return;
            const spacing = r.pM / 1000 * scale;
            if (spacing < 5) return;
            const fs = Math.max(opts.small ? 9 : 10, Math.min(opts.maxFs, spacing * 0.3));
            const sample = _zdFmt(Math.floor(hi * 1000 / r.pM) * r.pM, r.d);
            const textW = sample.length * fs * 0.6;
            const every = textW <= spacing * 0.92 ? 1
                        : textW <= spacing * 5 * 0.92 ? 5
                        : textW <= spacing * 10 * 0.92 ? 10 : 0;
            ranks.push({ r, spacing, fs, every });
        });
        // Les nombres des grandes graduations ne doivent pas écraser les autres :
        // au plus 1,3 fois la taille des plus petits nombres écrits
        const labelled = ranks.filter(x => x.every);
        const baseFs = labelled.length ? labelled[labelled.length - 1].fs : opts.maxFs;
        // 2) Graduations
        const ticks = [];
        let tickMaxH = 0;
        ranks.forEach(({ r, spacing, fs, every }) => {
            const kMin = Math.ceil(lo * 1000 / r.pM - 1e-6);
            const kMax = Math.floor(hi * 1000 / r.pM + 1e-6);
            const h = Math.min(H * (opts.small ? 0.07 : 0.12), Math.max(5, spacing * 0.22));
            const fsUsed = Math.min(fs, baseFs * 1.3);
            for (let k = kMin; k <= kMax; k++) {
                const m = k * r.pM;
                if (r.pM < 1000 && m % (r.pM * 10) === 0) continue;  // déjà dessinée par un rang plus grand
                const half = m % (r.pM * 5) === 0;
                const th = half ? h * 1.3 : h;
                tickMaxH = Math.max(tickMaxH, th);
                const lbl = every && (k % every === 0);
                ticks.push({ m, x: X(m / 1000), th, c: r.c, fs: fsUsed, d: r.d, lbl, w: opts.small ? 1.4 : 2 });
            }
        });
        // 3) Tous les nombres sur la même ligne, sous la plus grande graduation
        const maxFsUsed = ticks.reduce((mx2, t) => t.lbl ? Math.max(mx2, t.fs) : mx2, 0);
        const labelY = y + tickMaxH * 0.5 + maxFsUsed * 1.05;
        ticks.forEach(t => {
            out += `<line x1="${t.x}" y1="${y - t.th}" x2="${t.x}" y2="${y + t.th * 0.5}" stroke="${t.c}" stroke-width="${t.w}" stroke-linecap="round"/>`;
            if (t.lbl) {
                out += `<text x="${t.x}" y="${labelY}" font-size="${t.fs}" font-weight="800" text-anchor="middle">${_zdDigits(t.m, t.d, true)}</text>`;
            }
        });
        return { svg: out, X, scale, tickMaxH };
    }

    // Affichage normal : la droite précédente (petite) au-dessus de la droite actuelle
    function draw() {
        if (stack) { drawStack(); return; }
        // Retour à une zone sans défilement
        zone.style.overflowY = '';
        svg.style.position = ''; svg.style.height = '';
        zone.scrollTop = 0;
        lastRows = 0;
        const W = zone.clientWidth, H = zone.clientHeight;
        if (W <= 0 || H <= 0) return;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const mx = Math.max(26, W * 0.045);
        const L = level();
        const steady = !anim;
        const lo = anim ? anim.lo : viewLoM() / 1000;
        const hi = anim ? anim.hi : (viewLoM() + viewWM()) / 1000;
        const showParent = steady && L > 0;
        const mainY = showParent ? H * 0.68 : H * 0.52;
        let out = '';

        // Droite précédente + effet loupe
        if (showParent) {
            const pLo = path[L - 1] / 1000, pHi = (path[L - 1] + ZD_VIEW_M[L - 1]) / 1000;
            const py = H * 0.2;
            const pr = lineSVG(pLo, pHi, py, W, H, mx, { minPM: ZD_VIEW_M[L - 1] / 10, maxFs: H * 0.05, small: true });
            const x1 = pr.X(lo), x2 = pr.X(hi);
            const yTop = mainY - H * 0.16;
            out += `<polygon points="${x1},${py} ${x2},${py} ${W - mx},${yTop} ${mx},${yTop}" fill="rgba(250,204,21,0.16)" stroke="#ca8a04" stroke-width="1.2" stroke-dasharray="5 4"/>`;
            out += `<rect x="${x1}" y="${py - H * 0.05}" width="${x2 - x1}" height="${H * 0.1}" rx="3" fill="rgba(250,204,21,0.45)" stroke="#ca8a04" stroke-width="1.5"/>`;
            out += pr.svg;
            if (sel && sel.m >= path[L - 1] && sel.m <= path[L - 1] + ZD_VIEW_M[L - 1]) {
                out += `<circle cx="${pr.X(sel.m / 1000)}" cy="${py}" r="4" fill="#e11d48"/>`;
            }
        }

        // Droite principale
        const main = lineSVG(lo, hi, mainY, W, H, mx, {
            minPM: steady ? stepM() : 1,
            maxFs: H * 0.075,
            small: false
        });

        // Zones cliquables (seulement à l'arrêt)
        let hits = '';
        if (steady) {
            const sM = stepM();
            const spacing = sM / 1000 * main.scale;
            const strip = Math.min(28, spacing * 0.38);
            const bandTop = mainY - H * (showParent ? 0.15 : 0.3);
            const nozoom = L >= ZD_MAX_LEVEL ? ' nozoom' : '';
            for (let k = 0; k < 10; k++) {
                const a = viewLoM() + k * sM;
                const xa = main.X(a / 1000) + strip / 2, xb = main.X((a + sM) / 1000) - strip / 2;
                hits += `<rect class="zd-seg${nozoom}" data-seg="${a}" x="${xa}" y="${bandTop}" width="${Math.max(0, xb - xa)}" height="${mainY - bandTop + H * 0.06}" rx="4"/>`;
            }
            for (let k = 0; k <= 10; k++) {
                const m = viewLoM() + k * sM;
                const x = main.X(m / 1000);
                hits += `<rect class="zd-tick-hit" data-tick="${m}" x="${x - strip / 2}" y="${bandTop}" width="${strip}" height="${H - bandTop}" rx="4"/>`;
            }
        }

        // Repère du nombre choisi (ou trouvé dans le défi)
        let pin = '';
        const pinOf = (m, color) => {
            if (m < lo * 1000 - 1e-6 || m > hi * 1000 + 1e-6) return '';
            const x = main.X(m / 1000);
            const top = mainY - H * (showParent ? 0.13 : 0.24);
            const r = Math.max(6, H * 0.025);
            return `<line x1="${x}" y1="${top + r}" x2="${x}" y2="${mainY}" stroke="${color}" stroke-width="2.5"/>
                    <circle cx="${x}" cy="${top}" r="${r}" fill="${color}" stroke="#fff" stroke-width="2"/>`;
        };
        if (mode === 'explore' && sel) pin = pinOf(sel.m, '#e11d48');
        if (mode === 'defi' && defi && defi.found) pin = pinOf(defi.m, '#16a34a');

        svg.innerHTML = out + main.svg + pin + hits;
    }

    // Affichage « en escalier » : unités, puis dixièmes, centièmes et millièmes,
    // chaque droite sous la précédente, reliées par l'effet loupe.
    // La zone défile si toutes les droites ne tiennent pas.
    function drawStack() {
        const W = zone.clientWidth, Hz = zone.clientHeight;
        if (W <= 0 || Hz <= 0) return;
        const L = level();
        const animating = !!anim;
        const rows = L + 1 + (animating ? 1 : 0);
        const RH = Math.max(150, Math.min(240, Hz * 0.55));     // hauteur d'une droite
        const total = Math.max(Hz - 2, rows * RH + RH * 0.12);
        zone.style.overflowY = 'auto';
        svg.style.position = 'relative';
        svg.style.height = total + 'px';
        svg.setAttribute('viewBox', `0 0 ${W} ${total}`);
        const mx = Math.max(26, W * 0.045);
        const rowY = r => r * RH + RH * 0.45;

        // Droites
        const lines = [];
        for (let r = 0; r < rows; r++) {
            const isAnim = animating && r === L + 1;
            const lo = isAnim ? anim.lo : path[r] / 1000;
            const hi = isAnim ? anim.hi : (path[r] + ZD_VIEW_M[r]) / 1000;
            const ln = lineSVG(lo, hi, rowY(r), W, RH, mx, {
                minPM: isAnim ? 1 : ZD_VIEW_M[r] / 10,
                maxFs: RH * 0.1,
                small: false
            });
            lines.push({ lo, hi, ln, isAnim });
        }

        let out = '';
        // Effet loupe entre chaque droite et la suivante
        const clampX = x => Math.max(mx, Math.min(W - mx, x));
        for (let r = 0; r < rows - 1; r++) {
            const segM = (r < L) ? path[r + 1] : animSeg;
            if (segM === null || segM === undefined) continue;
            const w = ZD_VIEW_M[r + 1] / 1000;
            const top = lines[r], bot = lines[r + 1];
            const x1 = top.ln.X(segM / 1000), x2 = top.ln.X(segM / 1000 + w);
            const y1 = rowY(r), yb = rowY(r + 1) - RH * 0.22;
            const bx1 = clampX(bot.ln.X(segM / 1000)), bx2 = clampX(bot.ln.X(segM / 1000 + w));
            out += `<polygon points="${x1},${y1} ${x2},${y1} ${bx2},${yb} ${bx1},${yb}" fill="rgba(250,204,21,0.16)" stroke="#ca8a04" stroke-width="1.2" stroke-dasharray="5 4"/>`;
            out += `<rect x="${x1}" y="${y1 - RH * 0.06}" width="${x2 - x1}" height="${RH * 0.12}" rx="3" fill="rgba(250,204,21,0.45)" stroke="#ca8a04" stroke-width="1.5"/>`;
        }
        lines.forEach(l => { out += l.ln.svg; });

        // Étiquette du rang devant chaque droite (Unités, Dixièmes…)
        lines.forEach((l, r) => {
            if (l.isAnim) return;
            const rk = ZD_RANKS[r];   // droite 0 : unités, 1 : dixièmes, 2 : centièmes, 3 : millièmes
            const fs = Math.max(10, RH * 0.075);
            const txt = rk.pl.charAt(0).toUpperCase() + rk.pl.slice(1);
            const w = txt.length * fs * 0.62 + fs;
            const y = rowY(r) - RH * 0.36;
            out += `<rect x="${mx - 4}" y="${y - fs * 0.95}" width="${w}" height="${fs * 1.35}" rx="${fs * 0.65}" fill="#fff" stroke="${rk.c}" stroke-width="1.5"/>
                    <text x="${mx - 4 + w / 2}" y="${y}" font-size="${fs}" font-weight="800" fill="${rk.c}" text-anchor="middle">${txt}</text>`;
        });

        // Repère du nombre cherché sur chaque droite
        const pinM = (mode === 'explore' && sel) ? sel.m : (mode === 'defi' && defi && defi.found) ? defi.m : null;
        const pinC = mode === 'defi' ? '#16a34a' : '#e11d48';
        let pin = '';
        if (pinM !== null) {
            lines.forEach((l, r) => {
                if (pinM < l.lo * 1000 - 1e-6 || pinM > l.hi * 1000 + 1e-6) return;
                const x = l.ln.X(pinM / 1000), y = rowY(r);
                const last = r === rows - 1 && !l.isAnim;
                if (last) {
                    const top = y - RH * 0.24, rad = Math.max(6, RH * 0.04);
                    pin += `<line x1="${x}" y1="${top + rad}" x2="${x}" y2="${y}" stroke="${pinC}" stroke-width="2.5"/>
                            <circle cx="${x}" cy="${top}" r="${rad}" fill="${pinC}" stroke="#fff" stroke-width="2"/>`;
                } else {
                    pin += `<circle cx="${x}" cy="${y}" r="${Math.max(4, RH * 0.025)}" fill="${pinC}" stroke="#fff" stroke-width="1.5"/>`;
                }
            });
        }

        // Zones cliquables sur la dernière droite (à l'arrêt)
        let hits = '';
        if (!animating) {
            const main = lines[L].ln, y = rowY(L);
            const sM = stepM();
            const spacing = sM / 1000 * main.scale;
            const strip = Math.min(28, spacing * 0.38);
            const bandTop = y - RH * 0.15;
            const nozoom = L >= ZD_MAX_LEVEL ? ' nozoom' : '';
            for (let k = 0; k < 10; k++) {
                const a = viewLoM() + k * sM;
                const xa = main.X(a / 1000) + strip / 2, xb = main.X((a + sM) / 1000) - strip / 2;
                hits += `<rect class="zd-seg${nozoom}" data-seg="${a}" x="${xa}" y="${bandTop}" width="${Math.max(0, xb - xa)}" height="${RH * 0.21}" rx="4"/>`;
            }
            for (let k = 0; k <= 10; k++) {
                const m = viewLoM() + k * sM;
                const x = main.X(m / 1000);
                hits += `<rect class="zd-tick-hit" data-tick="${m}" x="${x - strip / 2}" y="${bandTop}" width="${strip}" height="${RH * 0.45}" rx="4"/>`;
            }
        }

        svg.innerHTML = out + pin + hits;

        // Garder la dernière droite visible
        if (animating || rows !== lastRows) zone.scrollTop = zone.scrollHeight;
        lastRows = rows;
    }

    // ── Animation de zoom ─────────────────────────────────────────────────
    // Passe de la vue [lo0, lo0+w0] à [lo1, lo1+w1] (en unités), en gardant
    // fixe le point qui ne bouge pas à l'écran : on voit l'intervalle grandir.
    function animateView(lo0, w0, lo1, w1, dur) {
        return new Promise(resolve => {
            if (Math.abs(w0 - w1) < 1e-12 && Math.abs(lo0 - lo1) < 1e-12) { resolve(); return; }
            const F = Math.abs(w1 - w0) > 1e-12 ? (lo0 * w1 - lo1 * w0) / (w1 - w0) : null;
            const t0 = performance.now();
            busy = true;
            function frame(now) {
                if (!document.body.contains(widget)) { busy = false; anim = null; resolve(); return; }
                let t = Math.min(1, (now - t0) / dur);
                const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                const w = w0 * Math.pow(w1 / w0, e);
                const lo = F === null ? lo0 + (lo1 - lo0) * e : F - (F - lo0) * w / w0;
                anim = { lo, hi: lo + w };
                draw();
                if (t < 1) requestAnimationFrame(frame);
                else { anim = null; busy = false; resolve(); }
            }
            requestAnimationFrame(frame);
        });
    }

    async function zoomInto(segM) {
        if (busy || level() >= ZD_MAX_LEVEL) return;
        const lo0 = viewLoM() / 1000, w0 = viewWM() / 1000;
        animSeg = segM;
        await animateView(lo0, w0, segM / 1000, w0 / 10, 650);
        animSeg = null;
        path.push(segM);
        renderAll();
        save();
    }

    async function zoomOutTo(lv) {
        if (busy || lv >= level() || lv < 0) return;
        if (stack) { stack = false; draw(); }
        const lo0 = viewLoM() / 1000, w0 = viewWM() / 1000;
        await animateView(lo0, w0, path[lv] / 1000, ZD_VIEW_M[lv] / 1000, 550);
        path = path.slice(0, lv + 1);
        renderAll();
        save();
    }

    // La droite zoome toute seule jusqu'à m, en s'arrêtant au niveau d
    async function travelTo(m, d) {
        if (busy) return;
        d = Math.min(d, ZD_MAX_LEVEL);
        // Garder les zooms déjà faits qui contiennent m
        let keep = 0;
        for (let L = 1; L <= Math.min(level(), d); L++) {
            if (m >= path[L] && m <= path[L] + ZD_VIEW_M[L]) keep = L; else break;
        }
        if (level() > keep) {
            await zoomOutTo(keep);
            await new Promise(r => setTimeout(r, 200));
        }
        // Toutes les droites restent affichées, l'une sous l'autre
        stack = true;
        draw();
        for (let L = level(); L < d; L++) {
            const w = ZD_VIEW_M[L + 1];
            let seg = Math.floor(m / w) * w;
            if (seg + w > path[L] + ZD_VIEW_M[L]) seg = path[L] + ZD_VIEW_M[L] - w; // m sur le bord droit
            if (!document.body.contains(widget)) return;
            await zoomInto(seg);
            await new Promise(r => setTimeout(r, 250));
        }
    }

    // ── Textes d'explication ──────────────────────────────────────────────
    function explainHTML(m, d) {
        const digits = [Math.floor(m / 1000), Math.floor(m / 100) % 10, Math.floor(m / 10) % 10, m % 10];
        const parts = [], fracs = [];
        if (digits[0] || d === 0) parts.push(`<span style="color:${ZD_RANKS[0].c}">${digits[0]} ${digits[0] > 1 ? 'unités' : 'unité'}</span>`);
        fracs.push(`<span style="color:${ZD_RANKS[0].c}">${digits[0]}</span>`);
        for (let i = 1; i <= d; i++) {
            if (!digits[i]) continue;
            const r = ZD_RANKS[i];
            parts.push(`<span style="color:${r.c}">${digits[i]} ${digits[i] > 1 ? r.pl : r.nom}</span>`);
            fracs.push(`<span style="color:${r.c}">${digits[i]}/${ZD_FRAC[i]}</span>`);
        }
        let lines = `<div>= ${parts.join(' + ') || '0'}</div>`;
        if (d > 0) {
            lines += `<div>= ${fracs.join(' + ')}</div>`;
            const total = Math.round(m / ZD_RANKS[d].pM);
            lines += `<div>= <b>${total.toLocaleString('fr-FR')}</b> <span style="color:${ZD_RANKS[d].c}">${total > 1 ? ZD_RANKS[d].pl : ZD_RANKS[d].nom}</span></div>`;
            // Encadrement au rang juste au-dessus
            const up = ZD_RANKS[d - 1];
            const a = Math.floor(m / up.pM) * up.pM;
            if (a !== m) {
                lines += `<div class="zd-muted">${_zdFmt(m, d)} est entre ${_zdFmtB(a, up.d)} et ${_zdFmtB(a + up.pM, up.d)}</div>`;
            }
        }
        // Tableau de numération
        const head = ZD_RANKS.map((r, i) => i === 0
            ? `<th style="background:${r.c}">U</th><th class="zd-comma"></th>`
            : `<th style="background:${r.c}">${r.pl}</th>`).join('');
        const cells = ZD_RANKS.map((r, i) => {
            const v = i <= d ? digits[i] : '';
            return i === 0
                ? `<td style="color:${r.c}">${v}</td><td class="zd-comma">,</td>`
                : `<td style="color:${r.c}">${v}</td>`;
        }).join('');
        return `<div class="zd-info-row">
                    <div class="zd-big">${_zdDigits(m, d, false)}</div>
                    <div class="zd-lines">${lines}</div>
                    <table class="zd-pv"><tr>${head}</tr><tr>${cells}</tr></table>
                </div>`;
    }

    // ── Rendu général ─────────────────────────────────────────────────────
    function renderCrumbs() {
        let html = '';
        for (let L = 0; L <= level(); L++) {
            const r = ZD_RANKS[L];
            const a = path[L], b = path[L] + ZD_VIEW_M[L];
            const dd = Math.max(0, L - 1);
            const lbl = L === 0 ? `Unités : ${_zdFmtB(a, 0)} → ${_zdFmtB(b, 0)}`
                                : `${r.pl.charAt(0).toUpperCase() + r.pl.slice(1)} : ${_zdFmtB(a, dd)} → ${_zdFmtB(b, dd)}`;
            if (L) html += `<span class="zd-crumb-sep">›</span>`;
            html += `<button class="zd-crumb${L === level() ? ' current' : ''}" data-crumb="${L}" style="--rc:${r.c}" title="${L === level() ? 'Zoom actuel' : 'Revenir à ce zoom'}">${lbl}</button>`;
        }
        crumbs.innerHTML = html;
    }

    function renderTarget() {
        if (mode !== 'defi' || !defi) { target.classList.remove('show'); return; }
        target.classList.add('show');
        target.innerHTML = `🎯 Place <span class="zd-target-num">${_zdDigits(defi.m, defi.d, false)}</span> sur la droite
            <span class="zd-score">✅ Réussis : ${score.ok} · ❌ Erreurs : ${score.errs}</span>`;
    }

    function renderInfo() {
        info.className = 'zd-info';
        if (mode === 'defi') {
            if (message) {
                info.innerHTML = message.html;
                if (message.cls) info.classList.add(message.cls);
            } else if (defi && defi.found) {
                info.classList.add('ok');
                info.innerHTML = explainHTML(defi.m, defi.d);
            } else {
                info.innerHTML = 'Clique <b>entre deux graduations</b> pour zoomer dans le bon intervalle, puis <b>sur la bonne graduation</b>.';
            }
            return;
        }
        if (sel) info.innerHTML = explainHTML(sel.m, sel.d);
        else if (level() >= ZD_MAX_LEVEL) info.innerHTML = 'On ne peut pas zoomer plus : on voit les <b style="color:#9333ea">millièmes</b>. Clique sur une graduation pour lire le nombre.';
        else info.innerHTML = 'Clique <b>entre deux graduations</b> pour zoomer, ou <b>sur une graduation</b> pour lire le nombre.';
    }

    function renderHeader() {
        badge.textContent = mode === 'defi' ? 'Défi' : 'Explorer';
        controls.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        controls.querySelectorAll('[data-prec]').forEach(b => b.classList.toggle('active', +b.dataset.prec === prec));
        controls.querySelector('.zd-explore-only').style.display = mode === 'explore' ? '' : 'none';
        controls.querySelector('.zd-defi-only').style.display = mode === 'defi' ? '' : 'none';
        outBtn.disabled = level() === 0;
        homeBtn.disabled = level() === 0;
        revealBtn.disabled = !defi || defi.found;
    }

    function renderAll() {
        renderHeader();
        renderCrumbs();
        renderTarget();
        renderInfo();
        draw();
    }

    // ── Défi ──────────────────────────────────────────────────────────────
    function newDefi() {
        let m;
        const old = defi ? defi.m : -1;
        do {
            const ent = Math.floor(Math.random() * 10);
            let dec = 0;
            for (let i = 1; i <= prec; i++) {
                const dig = i === prec ? 1 + Math.floor(Math.random() * 9) : Math.floor(Math.random() * 10);
                dec += dig * ZD_RANKS[i].pM;
            }
            m = ent * 1000 + dec;
        } while (m === old);
        defi = { m, d: prec, found: false, errs: 0, aide: false };
        message = null;
        path = [0];
        stack = false;
        renderAll();
        save();
    }

    function wrongFlash(el) {
        if (!el) return;
        el.classList.remove('wrong');
        void el.getBoundingClientRect();
        el.classList.add('wrong');
    }

    function onDefiSegment(segM, el) {
        if (!defi || defi.found) return;
        const t = defi.m, w = stepM();
        const d = level();   // les bornes d'un intervalle ont autant de décimales que le niveau de zoom
        if (t >= segM && t <= segM + w) {
            message = null;
            zoomInto(segM);
            return;
        }
        defi.errs++; score.errs++;
        wrongFlash(el);
        const a = _zdFmtB(segM, d), b = _zdFmtB(segM + w, d);
        const sens = t < segM ? 'plus petit' : 'plus grand';
        message = { cls: 'ko', html: `❌ Non : <b>${_zdFmt(t, defi.d)}</b> n'est pas entre ${a} et ${b}. Il est <b>${sens}</b> que ${t < segM ? a : b}.` };
        renderTarget();
        renderInfo();
        save();
    }

    function onDefiTick(m, el) {
        if (!defi || defi.found) return;
        if (m === defi.m) {
            defi.found = true;
            if (!defi.aide) score.ok++;
            message = null;
            renderAll();
            info.innerHTML = `<div style="font-weight:800;margin-bottom:4px">🏆 Bravo ! ${defi.errs ? `(${defi.errs} erreur${defi.errs > 1 ? 's' : ''})` : 'Du premier coup !'}</div>` + explainHTML(defi.m, defi.d);
            save();
            return;
        }
        defi.errs++; score.errs++;
        wrongFlash(el);
        const dd = Math.min(Math.max(level(), _zdDecimals(m)), 3);
        const sens = defi.m < m ? 'plus petit' : 'plus grand';
        let tip = '';
        if (level() < defi.d && _zdDecimals(defi.m) > level()) tip = ' Astuce : il faut d\'abord <b>zoomer</b> entre deux graduations.';
        message = { cls: 'ko', html: `❌ Ici, c'est <b>${_zdFmt(m, dd)}</b>. On cherche <b>${_zdFmt(defi.m, defi.d)}</b>, qui est <b>${sens}</b>.${tip}` };
        renderTarget();
        renderInfo();
        save();
    }

    async function revealDefi() {
        if (!defi || defi.found || busy) return;
        defi.aide = true;
        message = { cls: '', html: '💡 Regarde bien les zooms successifs…' };
        renderInfo();
        await travelTo(defi.m, defi.d);
        defi.found = true;
        message = null;
        renderAll();
        info.innerHTML = `<div style="font-weight:800;margin-bottom:4px">💡 Voici où se trouve ${_zdFmt(defi.m, defi.d)} :</div>` + explainHTML(defi.m, defi.d);
        save();
    }

    // ── Clics sur la droite ───────────────────────────────────────────────
    svg.addEventListener('click', (e) => {
        if (busy) return;
        const el = e.target;
        if (!el || !el.dataset) return;
        if (el.dataset.seg !== undefined) {
            e.stopPropagation();
            const segM = parseInt(el.dataset.seg, 10);
            if (level() >= ZD_MAX_LEVEL) {
                if (mode === 'explore') {
                    info.className = 'zd-info';
                    info.innerHTML = 'On ne peut pas zoomer plus : on voit déjà les <b style="color:#9333ea">millièmes</b>. Clique sur une graduation pour lire le nombre.';
                }
                return;
            }
            if (mode === 'defi') onDefiSegment(segM, el);
            else zoomInto(segM);
        } else if (el.dataset.tick !== undefined) {
            e.stopPropagation();
            const m = parseInt(el.dataset.tick, 10);
            if (mode === 'defi') onDefiTick(m, el);
            else {
                sel = { m, d: Math.max(level(), 0) };
                renderInfo();
                draw();
                save();
            }
        }
    });

    // Les clics dans la droite et les réglages ne déplacent pas le widget
    [zone, controls, crumbs, target, info].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-mode],[data-prec],[data-crumb]');
        if (!b || !container.contains(b) || b.closest('.zd-help-popup')) return;
        if (b.dataset.mode) {
            if (busy || b.dataset.mode === mode) return;
            mode = b.dataset.mode;
            message = null;
            if (mode === 'defi' && (!defi || defi.found)) { newDefi(); return; }
            renderAll();
            save();
            return;
        }
        if (b.dataset.prec) {
            if (busy) return;
            prec = +b.dataset.prec;
            newDefi();
            return;
        }
        if (b.dataset.crumb !== undefined) {
            zoomOutTo(+b.dataset.crumb);
            return;
        }
        switch (b.dataset.act) {
            case 'out':  zoomOutTo(level() - 1); break;
            case 'home': zoomOutTo(0); break;
            case 'goto': goTo(); break;
            case 'new':  if (!busy) newDefi(); break;
            case 'reveal': revealDefi(); break;
        }
    });

    async function goTo() {
        if (busy) return;
        const v = _zdParse(gotoInput.value);
        if (!v) {
            gotoInput.classList.add('bad');
            info.className = 'zd-info ko';
            info.innerHTML = 'Tapez un nombre entre 0 et 10, avec au plus 3 chiffres après la virgule (ex. 2,47).';
            return;
        }
        gotoInput.classList.remove('bad');
        sel = null;
        renderInfo();
        await travelTo(v.m, v.d);
        sel = { m: v.m, d: v.d };
        renderInfo();
        draw();
        save();
    }

    gotoInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') goTo();
    });
    gotoInput.addEventListener('input', () => gotoInput.classList.remove('bad'));
    gotoInput.addEventListener('click', (e) => { e.stopPropagation(); gotoInput.focus(); });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la droite) ──────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = zone.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(420, startW + ev.clientX - startX) + 'px';
            zone.style.height     = Math.max(140, startH + ev.clientY - startY) + 'px';
            draw();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = zone.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width = Math.max(420, startW + t.clientX - startX) + 'px';
            zone.style.height     = Math.max(140, startH + t.clientY - startY) + 'px';
            draw();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Redessiner quand la taille change (fenêtre, plein écran, rotation…)
    let ro = null;
    if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => { if (!anim) draw(); });
        ro.observe(zone);
    }
    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); if (ro) ro.disconnect(); return; }
        draw();
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
            window._wfMiniBarCollapse(widget, '🔍 Zoom sur les décimaux', {
                onExpand: () => requestAnimationFrame(draw)
            });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(draw);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = zone.style.height;
            container.classList.add('wf-fullboard');
            zone.style.height = Math.round(window.innerHeight * 0.5) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) zone.style.height = _savedH;
        }
        requestAnimationFrame(draw);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        window.removeEventListener('resize', onWinResize);
        if (ro) ro.disconnect();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON') return;
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
    requestAnimationFrame(() => requestAnimationFrame(draw));

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._zdGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        zoneH:      _isMax ? (parseFloat(_savedH) || zone.offsetHeight)     : zone.offsetHeight,
        mode, path: path.slice(), sel, prec,
        defi: defi ? Object.assign({}, defi) : null,
        score: Object.assign({}, score),
        gotoVal: gotoInput.value,
        stack,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_zdIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._zdSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        // Sur téléphone, le widget reste en plein écran (bouton vert) après une actualisation
        const toPhoneFull = () => {
            if (_zdIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.zoneH)      zone.style.height     = d.zoneH + 'px';
        mode = d.mode === 'defi' ? 'defi' : 'explore';
        prec = [1, 2, 3].includes(d.prec) ? d.prec : 2;
        // Zooms : chaque vue doit être dans la précédente
        const p = [0];
        if (Array.isArray(d.path)) {
            for (let L = 1; L < d.path.length && L <= ZD_MAX_LEVEL; L++) {
                const v = parseInt(d.path[L], 10);
                const w = ZD_VIEW_M[L];
                if (isNaN(v) || v % w !== 0 || v < p[L - 1] || v + w > p[L - 1] + ZD_VIEW_M[L - 1]) break;
                p.push(v);
            }
        }
        path = p;
        sel = d.sel && Number.isInteger(d.sel.m) && d.sel.m >= 0 && d.sel.m <= 10000
            ? { m: d.sel.m, d: Math.min(3, Math.max(0, d.sel.d | 0)) } : null;
        defi = d.defi && Number.isInteger(d.defi.m)
            ? { m: d.defi.m, d: Math.min(3, Math.max(1, d.defi.d | 0)), found: !!d.defi.found, errs: d.defi.errs | 0, aide: !!d.defi.aide }
            : null;
        if (d.score) score = { ok: d.score.ok | 0, errs: d.score.errs | 0 };
        if (typeof d.gotoVal === 'string') gotoInput.value = d.gotoVal;
        stack = !!d.stack;
        message = null;
        if (mode === 'defi' && !defi) { newDefi(); }
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        // Après la restauration du tableau, on redessine à la bonne taille
        setTimeout(draw, 250);
    };

    saveBoard();
    return widget;
}
