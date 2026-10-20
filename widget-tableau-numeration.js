// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (même fonction partagée que widget-citations.js / widget-tableau.js ; installée une seule fois)
if (!window._wfPhoneAutoMax) {
    window._wfPhoneAutoMax = function (widget, open, isOpen, setKey, launchOnly) {
        var phone = false;
        if (typeof isMobileBoardMode === 'function') { try { phone = !!isMobileBoardMode(); } catch (e) {} }
        if (!phone && window.matchMedia) phone = window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches;
        if (!phone) return;
        if (launchOnly && !(typeof window._wfLastLaunch === 'number' && Date.now() - window._wfLastLaunch <= 2500)) return;
        var restored = false, auto = false;
        if (setKey && typeof widget[setKey] === 'function') {
            var orig = widget[setKey];
            widget[setKey] = function () {
                restored = true;
                if (auto && isOpen()) open();
                auto = false;
                return orig.apply(this, arguments);
            };
        }
        requestAnimationFrame(function () {
            if (restored || isOpen() || !widget.isConnected) return;
            auto = true;
            open();
        });
    };
}

/* ═══════════════════════════════════════════════════════════════════
   widget-tableau-numeration.js — Widget « Tableau de numération »
   Le Bureau du Prof

   Un tableau de numération dans lequel on écrit directement :
   - des centaines de milliards aux millièmes :
       classe des milliards | des millions | des mille | des unités | partie décimale
   - chaque classe s'affiche ou se cache d'un clic (pastilles de la barre du haut)
   - une couleur par classe (ou une seule couleur), noms abrégés (c d u) ou complets
   - trait rouge à l'emplacement de la virgule
   - colonnes vides en option à gauche / à droite (0 par défaut)
   - écriture AU STYLET OU À LA SOURIS avec la barre Dessin (crayon, crayon
     de couleur, surligneur, figures, gomme, pot de peinture).
     Pot de peinture : sur une case → la case ; sur un nom de colonne →
     la colonne ; sur le nom d'une classe → toute la classe.
   - sans la barre Dessin : clic dans une case puis chiffres au clavier
     (le curseur avance tout seul ; « , » place la virgule après le chiffre)
   - fond opaque, clair ou transparent, et option « toujours au premier
     plan » : on peut le poser par-dessus un PDF (même en plein écran)
   - toute la barre du haut sert à déplacer le widget (sauf les boutons)
   - boutons fenêtre jaune (réduire), vert (plein écran), rouge (fermer)

   Les dessins, chiffres et couleurs sont rattachés à leur colonne :
   cacher une classe les cache, la réafficher les fait réapparaître
   au bon endroit.

   Utilisation : createWidget('tableau-numeration')
   Le template #template-tableau-numeration est injecté par ce fichier.
   Sauvegarde : window.tnrGetData / window.tnrSetData (save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    // Les 5 classes, de gauche à droite. Colonne « globale » g = 3 × classe + rang (0 à 14)
    const CLASSES = [
        { k: 'mrd', n: 'Milliards', s: 'Mrd', l: 'Classe des milliards', c: '#7b5cc4' },
        { k: 'mio', n: 'Millions',  s: 'M',   l: 'Classe des millions',  c: '#d6456b' },
        { k: 'mil', n: 'Mille',     s: 'k',   l: 'Classe des mille',     c: '#2e9e6a' },
        { k: 'uni', n: 'Unités',    s: 'U',   l: 'Classe des unités',    c: '#2f6fb5' },
        { k: 'dec', n: 'Décimales', s: ',',   l: 'Partie décimale',      c: '#d9822b', dec: true }
    ];
    const COL_SHORT = ['c', 'd', 'u'], COL_LONG = ['centaines', 'dizaines', 'unités'];
    const DEC_SHORT = ['1/10', '1/100', '1/1000'], DEC_LONG = ['dixièmes', 'centièmes', 'millièmes'];
    const COLORS = ['#2f6fb5', '#2e9e6a', '#d9822b', '#7b5cc4', '#d6456b', '#b8901a', '#5a5f6b'];
    const LIM = { rMin: 1, rMax: 12, sMax: 3 };
    const DEFAULT = {
        show: { mrd: true, mio: true, mil: true, uni: true, dec: true },
        rows: 3,
        spareL: 0, spareR: 0,
        longNames: false,    // noms de colonnes complets (centaines…) au lieu de c, d, u
        classColors: true,   // une couleur par classe
        color: '#2f6fb5',    // couleur unique (si classColors = false)
        bgMode: 'opaque',    // 'opaque' | 'clair' | 'transparent'
        front: true,         // toujours au-dessus des autres widgets (PDF…)
        s: [],               // dessins : { t, c, w, o, p:[[g, y]…] } — g en colonnes globales, y en lignes
        v: {},               // chiffres tapés : { "ligne:g": "3" ou "3," }
        b: {},               // couleurs des cases : { "ligne:g": couleur }
        cb: {}               // couleurs des colonnes : { g: couleur }
    };
    const FIG_MODES = ['segment', 'simple-arrow', 'carre', 'rectangle', 'cercle', 'ovale', 'parallelo', 'losange',
        'triangle', 'right-triangle', 'equilateral-triangle', 'scalene-triangle', 'pentagon', 'hexagon', 'octagon'];

    /* ── Outils ───────────────────────────────────────────────────── */
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v || a)));
    const r4 = v => Math.round(v * 10000) / 10000;
    const clone = o => JSON.parse(JSON.stringify(o));
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
    const snap = () => { if (typeof snapshotNow === 'function') snapshotNow(); };
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const NO_DRAG = 'button, input, select, label';

    function normalize(o) {
        const st = Object.assign(clone(DEFAULT), o || {});
        const sh = isObj(st.show) ? st.show : {};
        st.show = {};
        CLASSES.forEach(C => { st.show[C.k] = sh[C.k] !== false; });
        if (!CLASSES.some(C => st.show[C.k])) st.show.uni = true;
        st.rows = clampInt(st.rows, LIM.rMin, LIM.rMax);
        st.spareL = clampInt(st.spareL, 0, LIM.sMax);
        st.spareR = clampInt(st.spareR, 0, LIM.sMax);
        st.longNames = !!st.longNames;
        st.classColors = st.classColors !== false;
        st.front = st.front !== false;
        if (!['opaque', 'clair', 'transparent'].includes(st.bgMode)) st.bgMode = 'opaque';
        if (!Array.isArray(st.s)) st.s = [];
        ['v', 'b', 'cb'].forEach(k => { if (!isObj(st[k])) st[k] = {}; });
        return st;
    }

    function getState(root) {
        if (!root._tnr) {
            let init = {};
            try { init = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) {}
            root._tnr = normalize(init);
        }
        return root._tnr;
    }

    /* ── Géométrie ────────────────────────────────────────────────────
       u = position affichée (0 = première colonne visible, < 0 = colonnes
       vides de gauche), g = colonne globale (0 = centaines de milliards,
       14 = millièmes). Tout est enregistré en g : cacher une classe ne
       décale rien. */
    function geom(st) {
        const V = [];
        CLASSES.forEach((C, i) => { if (st.show[C.k]) V.push(i * 3, i * 3 + 1, i * 3 + 2); });
        const n = V.length, uMin = -st.spareL, uMax = n + st.spareR;
        const gAt = u => u < 0 ? V[0] + u : (u >= n ? V[n - 1] + 1 + (u - n) : V[u]);
        // position affichée (continue) → colonne globale (continue)
        const f = u => {
            if (u < 0) return V[0] + u;
            if (u >= n) return V[n - 1] + 1 + (u - n);
            const k = Math.floor(u);
            return V[k] + (u - k);
        };
        // colonne globale → position affichée, ou null si la colonne est cachée
        const inv = gx => {
            const k = Math.floor(gx), idx = V.indexOf(k);
            if (idx >= 0) return idx + (gx - k);
            if (k < V[0] && gx >= V[0] - st.spareL) return gx - V[0];
            if (k > V[n - 1] && gx < V[n - 1] + 1 + st.spareR) return n + (gx - V[n - 1] - 1);
            return null;
        };
        return { V, n, uMin, uMax, gAt, f, inv };
    }
    const classOf = g => (g >= 0 && g < 15) ? CLASSES[Math.floor(g / 3)] : null;
    const kColor = (st, g) => { const C = classOf(g); return C ? (st.classColors ? C.c : st.color) : ''; };
    function colLabel(st, g) {
        const C = classOf(g);
        if (!C) return '';
        const i = g % 3;
        return C.dec ? (st.longNames ? DEC_LONG : DEC_SHORT)[i] : (st.longNames ? COL_LONG : COL_SHORT)[i];
    }

    /* ── Barre Dessin : quel outil est actif ? ──────────────────────── */
    function drawState() {
        const tb = document.getElementById('draw-toolbar');
        if (!tb || !tb.style.display || tb.style.display === 'none') return null;
        if (window.isTextPlacementMode) return null;
        if (window.isFillMode) return 'fill';
        if (window.isEraserMode) return 'eraser';
        if (window._pdfAnnotMode) return 'draw';   // annotation PDF : on écrit dans le tableau posé dessus
        if (window.isDrawMode) return 'draw';
        return null;
    }
    function curColor() {
        return window._drawColor
            || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
            || '#e84393';
    }
    function toolInfo() {
        const mode = window.currentDrawMode || 'free';
        const c = curColor();
        const size = parseInt((document.getElementById('draw-size') || {}).value) || 4;
        const o = window._drawOpacity != null ? window._drawOpacity : 1;
        if (mode === 'highlight') {
            const w = typeof _hlWidthPx === 'function' ? _hlWidthPx(window._hlSize || 20) : 24;
            return { t: 'hl', c, w, o: 1 };
        }
        if (mode === 'crayon') return { t: 'crayon', c, w: size, o: 1 };
        if (FIG_MODES.includes(mode) && typeof _buildFigurePoints === 'function') return { t: 'fig', c, w: size, o, fig: mode };
        return { t: 'pen', c, w: size, o };
    }
    const eraserRadius = () => parseInt((document.getElementById('eraser-size') || {}).value) || 15;

    /* ── Rendu HTML ───────────────────────────────────────────────── */
    function buildBar(root, st) {
        const full = root.classList.contains('tnr-full');
        const chips = CLASSES.map(C =>
            '<button type="button" class="tnr-chip' + (st.show[C.k] ? ' is-on' : '') + '" data-tnr-class="' + C.k + '" style="--k:' + (st.classColors ? C.c : st.color) + '"' +
            ' title="' + (st.show[C.k] ? 'Cacher' : 'Afficher') + ' : ' + esc(C.l.toLowerCase()) + '">' +
            '<span class="tnr-chip-n">' + C.n + '</span><span class="tnr-chip-s">' + esc(C.s) + '</span></button>'
        ).join('');
        return '<div class="tnr-bar" title="Glisser pour déplacer">' +
            '<span class="tnr-grip" title="Déplacer" aria-hidden="true">⠿</span>' +
            '<button type="button" class="tnr-gear" data-tnr-action="toggle" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
            '<div class="tnr-chips">' + chips + '</div>' +
            '<span class="tnr-step" title="Lignes">' +
                '<button type="button" class="tnr-sbtn" data-tnr-action="row-" aria-label="Retirer une ligne"' + STOP + '>−</button>' +
                '<span class="tnr-num">' + st.rows + '<small> ' + (st.rows > 1 ? 'lignes' : 'ligne') + '</small></span>' +
                '<button type="button" class="tnr-sbtn" data-tnr-action="row+" aria-label="Ajouter une ligne"' + STOP + '>+</button>' +
            '</span>' +
            '<div class="wf-btns">' +
                '<button type="button" class="wf-btn wf-btn-min" data-tnr-action="wf-min" title="Réduire" aria-label="Réduire"' + STOP + '></button>' +
                '<button type="button" class="wf-btn wf-btn-max" data-tnr-action="wf-max" title="' + (full ? 'Quitter le plein écran' : 'Plein écran') + '" aria-label="Plein écran"' + STOP + '></button>' +
                '<button type="button" class="wf-btn wf-btn-close" data-tnr-action="wf-close" title="Fermer" aria-label="Fermer"' + STOP + '></button>' +
            '</div>' +
        '</div>';
    }

    function cellInner(v) {
        if (!v) return '';
        const d = v.replace(',', '');
        return '<span class="tnr-d">' + esc(d) + '</span>' + (v.includes(',') ? '<span class="tnr-comma">,</span>' : '');
    }
    const cellBg = (st, r, g) => st.b[r + ':' + g] || st.cb[g] || '';

    // Classe(s) de bordure de droite d'une colonne affichée u
    function edgeCls(st, G, u) {
        if (u === G.uMax - 1) return ' tnr-lastc';
        if (u === -1) return ' tnr-edgeL';
        if (u === G.n - 1 && st.spareR) return ' tnr-cend';
        if (u < 0 || u >= G.n) return '';
        const g = G.gAt(u);
        if (g === 11 && st.show.dec) return ' tnr-virg';   // emplacement de la virgule
        if (g % 3 === 2) return ' tnr-cend';                 // fin de classe
        return '';
    }

    function buildGrid(st) {
        const G = geom(st);
        const nCols = G.uMax - G.uMin;
        const col = u => u - G.uMin + 1;
        let html = '';
        // Ligne 1 : noms des classes
        if (G.uMin < 0) html += '<div class="tnr-h tnr-hcls tnr-hblank tnr-edgeL" data-hk="0" data-ua="' + G.uMin + '" data-ub="0" style="grid-column:1 / ' + col(0) + ';grid-row:1"></div>';
        CLASSES.forEach((C, i) => {
            if (!st.show[C.k]) return;
            const ua = G.V.indexOf(i * 3), ub = ua + 3;
            const k = st.classColors ? C.c : st.color;
            html += '<div class="tnr-h tnr-hcls' + edgeCls(st, G, ub - 1) + '" data-hk="0" data-ua="' + ua + '" data-ub="' + ub + '" style="--k:' + k + ';grid-column:' + col(ua) + ' / ' + col(ub) + ';grid-row:1">' +
                esc(st.longNames ? C.l : C.n) + '</div>';
        });
        if (G.uMax > G.n) html += '<div class="tnr-h tnr-hcls tnr-hblank tnr-lastc" data-hk="0" data-ua="' + G.n + '" data-ub="' + G.uMax + '" style="grid-column:' + col(G.n) + ' / ' + (nCols + 1) + ';grid-row:1"></div>';
        // Ligne 2 : noms des colonnes ; puis les lignes d'écriture
        for (let u = G.uMin; u < G.uMax; u++) {
            const g = G.gAt(u), spare = u < 0 || u >= G.n;
            const k = spare ? '' : kColor(st, g);
            const cb = st.cb[g];
            html += '<div class="tnr-h tnr-hcol tnr-hlast' + (spare ? ' tnr-hblank' : '') + edgeCls(st, G, u) + '" data-hk="1" data-ua="' + u + '" data-ub="' + (u + 1) + '" style="' +
                (k ? '--k:' + k + ';' : '') + 'grid-column:' + col(u) + ';grid-row:2' + (cb ? ';background:' + esc(cb) : '') + '">' + esc(spare ? '' : colLabel(st, g)) + '</div>';
        }
        for (let r = 0; r < st.rows; r++) {
            for (let u = G.uMin; u < G.uMax; u++) {
                const g = G.gAt(u), spare = u < 0 || u >= G.n;
                let cls = 'tnr-c' + (spare ? ' tnr-spare' : '') + edgeCls(st, G, u) + (r === st.rows - 1 ? ' tnr-lastr' : '');
                const k = spare ? '' : kColor(st, g);
                const bg = cellBg(st, r, g);
                html += '<div class="' + cls + '" tabindex="-1" data-r="' + r + '" data-u="' + u + '" data-g="' + g + '" style="' +
                    (k ? '--k:' + k + ';' : '') + 'grid-column:' + col(u) + ';grid-row:' + (r + 3) + (bg ? ';background:' + esc(bg) : '') + '">' +
                    cellInner(st.v[r + ':' + g]) + '</div>';
            }
        }
        return '<div class="tnr-area"' + STOP + '>' +
            '<div class="tnr-grid" style="grid-template-columns:repeat(' + nCols + ',minmax(0,1fr));grid-template-rows:minmax(0,.55fr) minmax(0,.55fr) repeat(' + st.rows + ',minmax(0,1fr))">' +
            html + '</div><canvas class="tnr-ink"></canvas></div>';
    }

    function buildSettings(st) {
        const pill = (attr, val, on, txt) => '<button type="button" class="tnr-pill' + (on ? ' is-on' : '') + '" ' + attr + '="' + val + '">' + txt + '</button>';
        const classes = CLASSES.map(C => pill('data-tnr-class', C.k, st.show[C.k], esc(C.l))).join('');
        const swatches = COLORS.map(col =>
            '<button type="button" class="tnr-sw' + (!st.classColors && col === st.color ? ' is-on' : '') + '" data-tnr-color="' + col + '" style="background:' + col + '" aria-label="Couleur ' + col + '"></button>'
        ).join('');
        const bgs = [['opaque', '⬜ Opaque'], ['clair', '🌫️ Clair'], ['transparent', '🔲 Transparent']]
            .map(b => pill('data-tnr-bg', b[0], b[0] === st.bgMode, b[1])).join('');
        return '<div class="tnr-settings"' + STOP + '>' +
            '<div class="tnr-set-title">Réglages du tableau de numération</div>' +
            '<div class="tnr-lbl">Classes affichées</div><div class="tnr-pills">' + classes + '</div>' +
            '<div class="tnr-lbl">Noms des colonnes</div><div class="tnr-pills">' +
              pill('data-tnr-names', 'short', !st.longNames, 'Abrégés (c, d, u — 1/10…)') +
              pill('data-tnr-names', 'long', st.longNames, 'Complets (centaines… dixièmes…)') +
            '</div>' +
            '<div class="tnr-row3">' +
              '<label class="tnr-lbl">Lignes<input type="number" min="' + LIM.rMin + '" max="' + LIM.rMax + '" value="' + st.rows + '" data-tnr-rows></label>' +
              '<label class="tnr-lbl">Colonnes vides à gauche<input type="number" min="0" max="' + LIM.sMax + '" value="' + st.spareL + '" data-tnr-spare="L"></label>' +
              '<label class="tnr-lbl">Colonnes vides à droite<input type="number" min="0" max="' + LIM.sMax + '" value="' + st.spareR + '" data-tnr-spare="R"></label>' +
            '</div>' +
            '<div class="tnr-lbl">Couleurs</div><div class="tnr-pills">' +
              pill('data-tnr-ccol', 'on', st.classColors, '🌈 Une couleur par classe') +
              pill('data-tnr-ccol', 'off', !st.classColors, 'Une seule couleur') +
            '</div>' +
            (st.classColors ? '' : '<div class="tnr-sws">' + swatches + '</div>') +
            '<div class="tnr-lbl">Fond (pour poser le tableau sur un PDF)</div><div class="tnr-pills">' + bgs + '</div>' +
            '<label class="tnr-chk"><input type="checkbox" data-tnr-front' + (st.front ? ' checked' : '') + '> Toujours au premier plan (reste au-dessus d\'un PDF, même en plein écran)</label>' +
            '<div class="tnr-lbl">Effacer</div>' +
            '<div class="tnr-clear">' +
              '<button type="button" data-tnr-action="clear-ink">🧽 Les dessins</button>' +
              '<button type="button" data-tnr-action="clear-text">⌫ Les chiffres tapés</button>' +
              '<button type="button" data-tnr-action="clear-bg">🎨 Les couleurs</button>' +
            '</div>' +
            '<div class="tnr-help">✏️ <b>Pour écrire au stylet ou à la souris</b> : ouvrez la barre Dessin et écrivez directement dans les cases. ' +
              'Le pot de peinture colorie une case, une colonne (clic sur son nom) ou toute une classe (clic sur le nom de la classe).<br>' +
              '⌨️ <b>Au clavier</b> : barre Dessin fermée, cliquez dans une case et tapez les chiffres (le curseur avance tout seul). ' +
              '« , » ajoute la virgule après le chiffre, Retour arrière efface, les flèches déplacent.<br>' +
              '👁️ Les pastilles de la barre du haut affichent ou cachent une classe ; ce qui y est écrit réapparaît quand on la réaffiche.</div>' +
            '<button type="button" class="tnr-done" data-tnr-action="close">Terminé</button>' +
        '</div>';
    }

    function applyLook(root, st) {
        root.style.setProperty('--tnr-c', st.classColors ? '#4a4f5c' : st.color);
        ['opaque', 'clair', 'transparent'].forEach(m => root.classList.toggle('tnr-bg-' + m, st.bgMode === m));
        root.classList.toggle('tnr-front', st.front);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('tnr-see-through', st.bgMode !== 'opaque');
    }

    function render(root) {
        const st = getState(root);
        const open = root.classList.contains('tnr-open');
        applyLook(root, st);
        root.innerHTML = buildBar(root, st) + buildGrid(st) + (open ? buildSettings(st) : '');
        bindCanvas(root);
        watchSize(root);
        layout(root);
        syncMode(root);
    }

    function renderLight(root) {
        const settings = root.querySelector('.tnr-settings');
        const scroll = settings ? settings.scrollTop : 0;
        render(root);
        const s2 = root.querySelector('.tnr-settings');
        if (s2) s2.scrollTop = scroll;
    }

    function paintCell(root, r, g) {
        const st = getState(root);
        root.querySelectorAll('.tnr-c[data-r="' + r + '"][data-g="' + g + '"]').forEach(cell => {
            cell.innerHTML = cellInner(st.v[r + ':' + g]);
            cell.style.background = cellBg(st, r, g);
        });
    }

    /* ── Mise en page ─────────────────────────────────────────────── */
    function layout(root) {
        const area = root.querySelector('.tnr-area'), cv = root.querySelector('.tnr-ink');
        const grid = root.querySelector('.tnr-grid');
        const c0 = root.querySelector('.tnr-c[data-r="0"][data-u="0"]');
        if (!area || !cv || !grid || !c0) return;
        const W = area.clientWidth, H = area.clientHeight;
        if (!W || !H) return;
        root._geo = {
            ox: c0.offsetLeft + grid.clientLeft,
            top: c0.offsetTop + grid.clientTop,
            cw: c0.offsetWidth || 1,
            rh: c0.offsetHeight || 1,
            htop: grid.clientTop
        };
        const geo = root._geo;
        geo.hh = (geo.top - geo.htop) / 2;
        root.style.setProperty('--tnr-fs', Math.max(8, Math.min(geo.rh * 0.62, geo.cw * 0.85)).toFixed(1) + 'px');
        // Taille de chaque étiquette pour qu'elle tienne dans sa case
        root.querySelectorAll('.tnr-h').forEach(h => {
            const L = Math.max(1, h.textContent.length);
            const fs = Math.max(7, Math.min(h.clientHeight * 0.56, h.clientWidth / (L * 0.62 + 0.6), 40));
            h.style.fontSize = fs.toFixed(1) + 'px';
        });
        const dpr = window.devicePixelRatio || 1;
        const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
        redraw(root);
    }

    const ro = typeof ResizeObserver === 'function'
        ? new ResizeObserver(entries => entries.forEach(en => layout(en.target)))
        : null;
    const sized = new WeakSet();
    function watchSize(root) {
        if (!ro || sized.has(root)) return;
        sized.add(root);
        ro.observe(root);
    }

    /* ── Coordonnées : colonne globale ↔ pixels ───────────────────── */
    function toPx(root, a) {
        const geo = root._geo, u = root._G.inv(a[0]);
        if (u == null) return null;
        return { x: geo.ox + u * geo.cw, y: geo.top + a[1] * geo.rh };
    }
    function toG(root, p) {
        const geo = root._geo;
        return [root._G.f((p.x - geo.ox) / geo.cw), (p.y - geo.top) / geo.rh];
    }
    function freshG(root) { root._G = geom(getState(root)); return root._G; }

    // Ajoute des points sur les longs segments (en colonnes globales)
    function densify(pts, step) {
        if (pts.length < 2) return pts.slice();
        const out = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const A = pts[i], B = pts[i + 1];
            const n = Math.floor(Math.hypot(B[0] - A[0], B[1] - A[1]) / step);
            for (let j = 1; j <= n; j++) {
                const t = j / (n + 1);
                out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]);
            }
            out.push(B);
        }
        return out;
    }

    /* ── Dessin des traits (coupés là où une classe est cachée) ───── */
    function paintRun(ctx, s, pts, lw, single) {
        if (s.t === 'hl') {
            if (!single && typeof _drawHighlightPath === 'function') {
                _drawHighlightPath(ctx, pts, lw, s.c);
            } else {
                ctx.save();
                ctx.globalAlpha = 0.4; ctx.fillStyle = s.c; ctx.strokeStyle = s.c;
                ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
                ctx.beginPath();
                if (single) { ctx.arc(pts[0].x, pts[0].y, lw / 2, 0, Math.PI * 2); ctx.fill(); }
                else { ctx.moveTo(pts[0].x, pts[0].y); pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
                ctx.restore();
            }
            return;
        }
        if (s.t === 'crayon' && typeof crayonDrawPoints === 'function') {
            crayonDrawPoints(ctx, s, pts, s.c, lw, s.seed || 1, single, 1);
            return;
        }
        ctx.save();
        ctx.globalAlpha = s.o == null ? 1 : s.o;
        ctx.strokeStyle = ctx.fillStyle = s.c;
        ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        if (single) {
            ctx.arc(pts[0].x, pts[0].y, lw / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(pts[0].x, pts[0].y);
            if (s.t === 'fig' || pts.length === 2) {
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            } else {
                for (let i = 1; i < pts.length - 1; i++) {
                    const mx = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.25;
                    const my = pts[i].y + (pts[i + 1].y - pts[i].y) * 0.25;
                    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
                }
                ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    function paintStroke(ctx, root, s) {
        if (!s.p || !s.p.length) return;
        const lw = Math.max(0.5, s.w * root._geo.cw);
        const px = s.p.map(a => toPx(root, a));
        if (s.dot || px.length < 2) { if (px[0]) paintRun(ctx, s, [px[0]], lw, true); return; }
        let run = [];
        const flush = () => {
            if (run.length >= 2) paintRun(ctx, s, run, lw, false);
            run = [];
        };
        px.forEach(p => { if (p) run.push(p); else flush(); });
        flush();
    }

    function redraw(root) {
        const area = root.querySelector('.tnr-area'), cv = root.querySelector('.tnr-ink');
        if (!area || !cv || !cv.width || !root._geo) return;
        const W = area.clientWidth;
        if (!W) return;
        freshG(root);
        const ctx = cv.getContext('2d');
        const dpr = cv.width / W;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        getState(root).s.forEach(s => paintStroke(ctx, root, s));
        if (root._live) paintStroke(ctx, root, root._live);
        if (root._eraserPos && drawState() === 'eraser') {
            const p = root._eraserPos, r = eraserRadius();
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(60,60,60,0.75)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.restore();
        }
    }

    function scheduleRedraw(root) {
        if (root._raf) return;
        root._raf = requestAnimationFrame(() => { root._raf = 0; redraw(root); });
    }

    /* ── Gomme : coupe les traits touchés (seulement les parties visibles) ── */
    function eraseAt(root, pos) {
        const st = getState(root), geo = root._geo;
        if (!geo) return false;
        freshG(root);
        const r = eraserRadius();
        let changed = false;
        const out = [];
        st.s.forEach(s => {
            const half = (s.w * geo.cw) / 2;
            const m = r + half + 2;
            const near = s.p.some(a => { const p = toPx(root, a); return p && Math.abs(p.x - pos.x) < m + 400 && Math.abs(p.y - pos.y) < m + 400; });
            if (!near) { out.push(s); return; }
            const step = Math.max(0.01, 3 / geo.cw);
            const d = densify(s.p, step);
            const hit = a => { const p = toPx(root, a); return !!p && Math.hypot(p.x - pos.x, p.y - pos.y) <= r + half * 0.5; };
            if (!d.some(hit)) { out.push(s); return; }
            changed = true;
            if (s.dot || d.length < 2) return;
            let piece = [];
            const flush = () => {
                if (piece.length >= 2) out.push(Object.assign({}, s, { p: piece.map(a => [r4(a[0]), r4(a[1])]) }));
                piece = [];
            };
            d.forEach(a => { if (hit(a)) flush(); else piece.push(a); });
            flush();
        });
        if (changed) st.s = out;
        return changed;
    }

    /* ── Pot de peinture : case, colonne ou classe ────────────────── */
    function fillAt(root, pos) {
        const st = getState(root), geo = root._geo;
        if (!geo) return;
        const G = freshG(root);
        const u = Math.floor((pos.x - geo.ox) / geo.cw);
        if (u < G.uMin || u >= G.uMax) return;
        const color = typeof _fillCurrentColor === 'function' ? _fillCurrentColor() : curColor();
        snap();
        if (pos.y < geo.top) {
            let ua = u, ub = u + 1;
            const hk = Math.floor((pos.y - geo.htop) / (geo.hh || 1));
            if (hk <= 0) {
                // nom de la classe : ses 3 colonnes (ou toutes les colonnes vides du côté)
                const h = Array.from(root.querySelectorAll('.tnr-h[data-hk="0"]'))
                    .find(el => u >= +el.dataset.ua && u < +el.dataset.ub);
                if (h) { ua = +h.dataset.ua; ub = +h.dataset.ub; }
            }
            const gs = [];
            for (let uu = ua; uu < ub; uu++) gs.push(G.gAt(uu));
            const off = gs.every(g => st.cb[g] === color);
            gs.forEach(g => { if (off) delete st.cb[g]; else st.cb[g] = color; });
            renderLight(root);
        } else {
            const r = Math.floor((pos.y - geo.top) / geo.rh);
            if (r < 0 || r >= st.rows) return;
            const g = G.gAt(u), k = r + ':' + g;
            if (st.b[k] === color) delete st.b[k]; else st.b[k] = color;
            paintCell(root, r, g);
        }
        save();
    }

    /* ── Événements du calque de dessin ────────────────────────────── */
    function localPos(root, e) {
        const area = root.querySelector('.tnr-area');
        const rect = area.getBoundingClientRect();
        const W = area.clientWidth || rect.width, H = area.clientHeight || rect.height;
        return {
            x: (e.clientX - rect.left) * (W / (rect.width || 1)),
            y: (e.clientY - rect.top) * (H / (rect.height || 1))
        };
    }

    function bindCanvas(root) {
        const cv = root.querySelector('.tnr-ink');
        if (!cv) return;

        const block = e => {
            if (!drawState()) return;
            if (e.type === 'mousedown' && e.button !== 0) return;
            e.stopPropagation();
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
        };
        cv.addEventListener('mousedown', block);
        cv.addEventListener('mousemove', e => { if (drawState()) e.stopPropagation(); });
        cv.addEventListener('touchstart', block, { passive: false });
        cv.addEventListener('touchmove', e => { if (drawState()) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }, { passive: false });

        cv.addEventListener('pointerdown', e => {
            const mode = drawState();
            if (!mode || !root._geo) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
            const pos = localPos(root, e);
            if (mode === 'fill') { fillAt(root, pos); return; }
            try { cv.setPointerCapture(e.pointerId); } catch (_) {}
            snap();
            freshG(root);
            if (mode === 'eraser') {
                root._erasing = true;
                root._eraserPos = pos;
                if (eraseAt(root, pos)) root._erased = true;
                scheduleRedraw(root);
                return;
            }
            const tool = toolInfo();
            root._start = pos;
            root._live = {
                t: tool.t, c: tool.c, w: tool.w / root._geo.cw, o: tool.o, fig: tool.fig,
                seed: Math.floor(Math.random() * 1e9),
                p: [toG(root, pos)]
            };
            scheduleRedraw(root);
        });

        cv.addEventListener('pointermove', e => {
            const mode = drawState();
            if (!mode || !root._geo) return;
            e.stopPropagation();
            if (mode === 'eraser') {
                const evs = (root._erasing && e.getCoalescedEvents) ? e.getCoalescedEvents() : [e];
                evs.forEach(ev => {
                    const pos = localPos(root, ev);
                    root._eraserPos = pos;
                    if (root._erasing && eraseAt(root, pos)) root._erased = true;
                });
                scheduleRedraw(root);
                return;
            }
            const live = root._live;
            if (!live) return;
            if (!root._G) freshG(root);
            if (live.t === 'fig') {
                const pts = _buildFigurePoints(live.fig, root._start, localPos(root, e));
                if (pts) live.p = pts.map(p => toG(root, p));
            } else {
                const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
                evs.forEach(ev => {
                    const pos = localPos(root, ev);
                    const last = toPx(root, live.p[live.p.length - 1]);
                    if (last && Math.hypot(last.x - pos.x, last.y - pos.y) < 0.8) return;
                    live.p.push(toG(root, pos));
                });
            }
            scheduleRedraw(root);
        });

        const end = e => {
            if (root._erasing) {
                root._erasing = false;
                if (root._erased) { root._erased = false; save(); }
                return;
            }
            const live = root._live;
            if (!live) return;
            root._live = null;
            if (e && e.type === 'pointercancel' && live.p.length < 2) { redraw(root); return; }
            if (live.t === 'fig') {
                if (live.p.length < 2) { redraw(root); return; }
            } else {
                const o = live.p[0];
                const op = toPx(root, o);
                if (op && live.p.every(a => { const p = toPx(root, a); return p && Math.hypot(p.x - op.x, p.y - op.y) <= 3; })) {
                    live.dot = true;
                    live.p = [o];
                }
            }
            // Points ajoutés sur les longs segments : le trait se coupera proprement si une classe est cachée
            if (!live.dot) live.p = densify(live.p, 0.4);
            live.p = live.p.map(p => [r4(p[0]), r4(p[1])]);
            live.w = r4(live.w);
            if (live.t !== 'fig') delete live.fig;
            getState(root).s.push(live);
            redraw(root);
            save();
        };
        cv.addEventListener('pointerup', e => { if (drawState()) e.stopPropagation(); end(e); });
        cv.addEventListener('pointercancel', end);
        cv.addEventListener('pointerleave', () => {
            if (root._eraserPos && !root._erasing) { root._eraserPos = null; scheduleRedraw(root); }
        });
    }

    // Curseur en mode dessin : un point de la couleur du trait, bordé de blanc
    const _penCur = {};
    function penCursor() {
        const col = curColor();
        if (!_penCur[col]) {
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
                '<circle cx="8" cy="8" r="4.5" fill="' + col + '" stroke="#fff" stroke-width="1.6"/>' +
                '<circle cx="8" cy="8" r="6" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/></svg>';
            _penCur[col] = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 8 8, pointer';
        }
        return _penCur[col];
    }

    function syncMode(root) {
        const mode = drawState();
        const on = !!mode;
        if (root.classList.contains('tnr-drawing') !== on) {
            root.classList.toggle('tnr-drawing', on);
            if (on && document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
        }
        const cv = root.querySelector('.tnr-ink');
        if (!cv) return;
        let c = '';
        if (mode === 'eraser') c = 'none';           // l'aperçu de la gomme est dessiné dans le tableau
        else if (mode === 'draw') c = penCursor();   // petit point de la couleur choisie (pas de croix)
        if (cv.style.cursor !== c) cv.style.cursor = c;
        if (mode !== 'eraser' && root._eraserPos) { root._eraserPos = null; scheduleRedraw(root); }
    }

    /* ── Toujours au premier plan (au-dessus d'un PDF…) ─────────────── */
    function keepFront(root) {
        const st = getState(root);
        const w = root.closest('.widget');
        if (!st.front || !w || !w.parentElement) return;
        let max = 0;
        w.parentElement.querySelectorAll(':scope > .widget, :scope > .shape-widget').forEach(o => {
            if (o === w || o.querySelector('.tnr-root.tnr-front, .tc-root.tc-front')) return;
            const z = parseInt(getComputedStyle(o).zIndex) || 0;
            if (z > max) max = z;
            if (o.querySelector('.wf-pdf-fullboard, .wf-media-fullboard, .wf-fullboard')) max = Math.max(max, 10000);
        });
        const mine = parseInt(w.style.zIndex) || 0;
        if (mine <= max) w.style.zIndex = String(max + 1);
    }

    function setOpt(root, fn) {
        snap();
        fn(getState(root));
        root._tnr = normalize(getState(root));
        renderLight(root);
        save();
    }

    /* ── Boutons fenêtre ──────────────────────────────────────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('tnr-full');
        root.classList.toggle('tnr-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('tnr-is-full', full);
        const b = root.querySelector('[data-tnr-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    }

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('tnr-full')) toggleFull(root, false);
        root.classList.remove('tnr-open');
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden';
        window._wfMiniBarCollapse(widget, '🔢 Numération', {
            onExpand: () => { box.style.visibility = ''; render(root); }
        });
    }

    function closeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget) return;
        snap();
        widget.remove();
        save();
    }

    function confirmThen(msg, fn) {
        if (typeof modalConfirm === 'function') {
            Promise.resolve(modalConfirm('Tableau de numération', msg)).then(ok => { if (ok) fn(); });
        } else if (window.confirm(msg)) fn();
    }

    /* ── Événements délégués ──────────────────────────────────────── */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('[data-tnr-action], [data-tnr-color], [data-tnr-class], [data-tnr-bg], [data-tnr-names], [data-tnr-ccol]');
        if (!btn) return;
        const root = btn.closest('.tnr-root');
        if (!root) return;
        e.stopPropagation();
        const st = getState(root);
        if (btn.hasAttribute('data-tnr-class')) {
            const k = btn.getAttribute('data-tnr-class');
            const shown = CLASSES.filter(C => st.show[C.k]).length;
            if (st.show[k] && shown <= 1) return;   // au moins une classe reste affichée
            setOpt(root, s => { s.show[k] = !s.show[k]; });
            return;
        }
        if (btn.hasAttribute('data-tnr-names')) { setOpt(root, s => { s.longNames = btn.getAttribute('data-tnr-names') === 'long'; }); return; }
        if (btn.hasAttribute('data-tnr-ccol'))  { setOpt(root, s => { s.classColors = btn.getAttribute('data-tnr-ccol') === 'on'; }); return; }
        if (btn.hasAttribute('data-tnr-color')) { st.color = btn.getAttribute('data-tnr-color'); renderLight(root); save(); return; }
        if (btn.hasAttribute('data-tnr-bg'))    { st.bgMode = btn.getAttribute('data-tnr-bg'); renderLight(root); save(); return; }
        const act = btn.getAttribute('data-tnr-action');
        if (act === 'wf-min')   { minimizeWidget(root); return; }
        if (act === 'wf-max')   { toggleFull(root); return; }
        if (act === 'wf-close') { closeWidget(root); return; }
        if (act === 'row+') { if (st.rows < LIM.rMax) setOpt(root, s => { s.rows++; }); return; }
        if (act === 'row-') { if (st.rows > LIM.rMin) setOpt(root, s => { s.rows--; }); return; }
        if (act === 'clear-ink') {
            if (!st.s.length) return;
            confirmThen('Effacer tous les dessins du tableau ?', () => { snap(); st.s = []; redraw(root); save(); });
            return;
        }
        if (act === 'clear-text') {
            if (!Object.keys(st.v).length) return;
            confirmThen('Effacer tous les chiffres tapés dans le tableau ?', () => { snap(); st.v = {}; renderLight(root); save(); });
            return;
        }
        if (act === 'clear-bg') { snap(); st.b = {}; st.cb = {}; renderLight(root); save(); return; }
        if (act === 'toggle') root.classList.toggle('tnr-open');
        if (act === 'close') root.classList.remove('tnr-open');
        render(root);
    }, true);

    document.addEventListener('change', function (e) {
        const t = e.target;
        const root = t.closest && t.closest('.tnr-root');
        if (!root || !t.closest('.tnr-settings')) return;
        if (t.hasAttribute('data-tnr-rows'))  { setOpt(root, s => { s.rows = t.value; }); return; }
        if (t.hasAttribute('data-tnr-spare')) { const side = t.getAttribute('data-tnr-spare'); setOpt(root, s => { s['spare' + side] = t.value; }); return; }
        if (t.hasAttribute('data-tnr-front')) {
            const st = getState(root);
            st.front = t.checked;
            applyLook(root, st);
            keepFront(root);
            save();
        }
    });

    // Clic dans une case (barre Dessin fermée) : prête à recevoir des chiffres
    document.addEventListener('pointerup', function (e) {
        const cell = e.target.closest && e.target.closest('.tnr-c');
        if (!cell) return;
        const root = cell.closest('.tnr-root');
        if (!root || root.classList.contains('tnr-drawing')) return;
        cell.focus();
    });
    document.addEventListener('focusin', function (e) {
        if (e.target.closest && e.target.closest('.tnr-c')) snap();
    });

    // Clavier : chiffres, virgule, effacement, déplacements
    document.addEventListener('keydown', function (e) {
        const t = e.target;
        if (!t.closest) return;
        const root = t.closest('.tnr-root');
        if (e.key === 'Escape' && !root) {
            document.querySelectorAll('.tnr-root.tnr-full').forEach(r => toggleFull(r, false));
            return;
        }
        if (!root) return;
        e.stopPropagation();
        const cell = t.closest('.tnr-c');
        if (!cell || e.ctrlKey || e.metaKey || e.altKey) return;
        const st = getState(root), G = geom(st);
        const r = +cell.dataset.r, u = +cell.dataset.u, g = +cell.dataset.g;
        const K = (rr, gg) => rr + ':' + gg;
        const go = (rr, uu) => {
            const c = root.querySelector('.tnr-c[data-r="' + rr + '"][data-u="' + uu + '"]');
            if (c) c.focus();
        };
        const done = () => { e.preventDefault(); save(); };
        const gLeft = u - 1 >= G.uMin ? G.gAt(u - 1) : null;
        if (/^[0-9]$/.test(e.key)) {
            st.v[K(r, g)] = e.key;
            paintCell(root, r, g);
            if (u + 1 < G.uMax) go(r, u + 1);
            done(); return;
        }
        if (e.key === ',' || e.key === '.') {
            let tg = g;
            if (!/[0-9]/.test(st.v[K(r, g)] || '') && gLeft != null && /[0-9]/.test(st.v[K(r, gLeft)] || '')) tg = gLeft;
            const k = K(r, tg), v = st.v[k] || '';
            const nv = v.includes(',') ? v.replace(',', '') : v + ',';
            if (nv) st.v[k] = nv; else delete st.v[k];
            paintCell(root, r, tg);
            done(); return;
        }
        if (e.key === 'Backspace') {
            if (st.v[K(r, g)]) { delete st.v[K(r, g)]; paintCell(root, r, g); }
            else if (gLeft != null) { delete st.v[K(r, gLeft)]; paintCell(root, r, gLeft); go(r, u - 1); }
            done(); return;
        }
        if (e.key === 'Delete' || e.key === ' ') {
            delete st.v[K(r, g)]; paintCell(root, r, g);
            if (e.key === ' ' && u + 1 < G.uMax) go(r, u + 1);
            done(); return;
        }
        const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0], Enter: [1, 0] };
        if (e.key === 'Tab') moves.Tab = [0, e.shiftKey ? -1 : 1];
        if (moves[e.key]) {
            e.preventDefault();
            const nr = r + moves[e.key][0], nu = u + moves[e.key][1];
            if (nr >= 0 && nr < st.rows && nu >= G.uMin && nu < G.uMax) go(nr, nu);
            return;
        }
        if (e.key === 'Escape') { e.preventDefault(); cell.blur(); }
    }, true);

    /* ── Déplacement du widget par la barre du haut (sauf les boutons) ── */
    function onBarDown(e) {
        const bar = e.target.closest && e.target.closest('.tnr-bar');
        if (!bar) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest(NO_DRAG)) return;
        const root = bar.closest('.tnr-root');
        const w = root && root.closest('.widget');
        if (!w || root.classList.contains('tnr-full') || w.querySelector('.wf-mini-bar')) return;
        e.preventDefault();
        e.stopPropagation();
        const r = w.getBoundingClientRect();
        const scale = (w.offsetWidth && r.width) ? r.width / w.offsetWidth : 1;
        const x0 = e.clientX, y0 = e.clientY, l0 = w.offsetLeft, t0 = w.offsetTop;
        let moved = false;
        if (typeof bringToFront === 'function' && !getState(root).front) { try { bringToFront(w); } catch (_) {} }
        const move = ev => {
            const dx = (ev.clientX - x0) / scale, dy = (ev.clientY - y0) / scale;
            if (!moved) {
                if (Math.hypot(dx, dy) < 3) return;
                moved = true;
                snap();
                bar.classList.add('tnr-moving');
            }
            w.style.left = Math.round(l0 + dx) + 'px';
            w.style.top  = Math.round(t0 + dy) + 'px';
        };
        const up = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            bar.classList.remove('tnr-moving');
            if (moved) save();
        };
        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    }
    document.addEventListener('pointerdown', onBarDown, true);
    ['mousedown', 'touchstart'].forEach(t => document.addEventListener(t, e => {
        const bar = e.target.closest && e.target.closest('.tnr-bar');
        if (!bar || e.target.closest(NO_DRAG)) return;
        e.stopPropagation();
    }, { capture: true, passive: true }));

    /* ── Redimensionnement libre (poignée du board) ───────────────── */
    const MIN_W = 320, MIN_H = 150, MAX_W = 3200, MAX_H = 2000;

    function tnrBox(widget) {
        const root = widget.querySelector('.tnr-root');
        return root ? (root.closest('.editor-container') || root) : null;
    }

    function startResize(e, widget) {
        const box = tnrBox(widget);
        if (!box) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const w0 = box.offsetWidth, h0 = box.offsetHeight;
        const extra = {
            w: /px$/.test(widget.style.width)  ? widget.offsetWidth  - box.offsetWidth  : null,
            h: /px$/.test(widget.style.height) ? widget.offsetHeight - box.offsetHeight : null
        };
        const x0 = e.clientX, y0 = e.clientY;
        const move = ev => {
            const w = Math.round(Math.min(MAX_W, Math.max(MIN_W, w0 + ev.clientX - x0)));
            const h = Math.round(Math.min(MAX_H, Math.max(MIN_H, h0 + ev.clientY - y0)));
            box.style.width = w + 'px';
            box.style.height = h + 'px';
            if (extra.w !== null) widget.style.width  = (w + extra.w) + 'px';
            if (extra.h !== null) widget.style.height = (h + extra.h) + 'px';
        };
        const up = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            document.body.style.cursor = '';
            save();
        };
        document.body.style.cursor = 'nwse-resize';
        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    }

    function onResizeDown(e) {
        const handle = e.target.closest && e.target.closest('.custom-resize-handle');
        if (!handle) return;
        const widget = handle.closest('.widget');
        if (!widget || !widget.querySelector('.tnr-root')) return;
        if (widget.classList.contains('tnr-is-full') || widget.querySelector('.wf-mini-bar')) return;
        if (e.type === 'pointerdown') { startResize(e, widget); return; }
        e.stopPropagation(); e.stopImmediatePropagation();
        if (e.cancelable) e.preventDefault();
    }
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t =>
        document.addEventListener(t, onResizeDown, { capture: true, passive: false }));

    /* ── Hydratation ──────────────────────────────────────────────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        const roots = node.matches('.tnr-root') ? [node] : Array.from(node.querySelectorAll('.tnr-root'));
        roots.forEach(r => {
            if (!r.querySelector('.tnr-grid')) render(r);
            else applyLook(r, getState(r));
            const w = r.closest('.widget');
            if (w && !w._tnrAutoMax) {
                w._tnrAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('tnr-full'), null, true);
            }
            setTimeout(() => keepFront(r), 0);
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) m.addedNodes.forEach(n => {
            if (!(n instanceof Element)) return;
            if (n.closest('.tnr-root') && !n.matches('.tnr-root')) return;
            if (n.matches('.widget, .tnr-root') || n.querySelector('.tnr-root')) hydrate(n);
        });
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-tableau-numeration')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-tableau-numeration';
        tpl.innerHTML =
            '<div class="editor-container" style="width:1100px;height:300px;">' +
                '<div class="tnr-root" data-cfg="{}"></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('tnr-styles')) return;
        const st = document.createElement('style');
        st.id = 'tnr-styles';
        st.textContent = `
.tnr-root{
  --tnr-c:#4a4f5c; --k:#4a4f5c; --tnr-ink:#26221d; --tnr-soft:#6f675c; --tnr-line:#e6dfd0; --tnr-fs:24px;
  --tnr-paper:#fbf8f1; --tnr-grid-bg:#fff; --tnr-bar-bg:transparent; --tnr-virg:#d63031;
  --tnr-rule:color-mix(in srgb,var(--tnr-c) 35%,#c8c8c8);
  container-type:inline-size; position:relative; width:100%; height:100%;
  box-sizing:border-box; background:var(--tnr-paper);
  display:flex; flex-direction:column; overflow:hidden;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:var(--tnr-ink);
}
.tnr-root.tnr-bg-clair{--tnr-paper:rgba(251,248,241,.45);--tnr-grid-bg:rgba(255,255,255,.4);--tnr-bar-bg:rgba(255,255,255,.7)}
.tnr-root.tnr-bg-transparent{--tnr-paper:transparent;--tnr-grid-bg:transparent;--tnr-bar-bg:rgba(255,255,255,.8)}
.widget.tnr-see-through,
.widget.tnr-see-through > .widget-content,
.widget.tnr-see-through .editor-container{background:transparent !important;box-shadow:none !important;border-color:transparent !important}
.tnr-bar{flex:none;display:grid;grid-template-columns:auto auto 1fr auto auto;align-items:center;gap:1.2cqw;
  padding:.7cqw 1.4cqw;margin:.5cqw 1.4cqw 0;border-radius:8px;background:var(--tnr-bar-bg);user-select:none;
  cursor:grab;touch-action:none}
.tnr-bar.tnr-moving{cursor:grabbing}
.tnr-bar button{cursor:pointer}
.tnr-grip{color:#b3aa9b;font-size:max(14px,1.8cqw);line-height:1;padding:0 .2em}
.tnr-bar:hover .tnr-grip{color:var(--tnr-ink)}
.tnr-root.tnr-full .tnr-bar{cursor:default}
.tnr-gear{border:0;background:none;color:#a39a8b;font-size:max(14px,2cqw);line-height:1;padding:.4cqw;border-radius:5px}
.tnr-gear:hover,.tnr-gear:focus-visible{color:var(--tnr-ink);outline:1px solid var(--tnr-line)}
.tnr-chips{display:flex;flex-wrap:wrap;gap:.6cqw;justify-content:center}
.tnr-chip{display:inline-flex;align-items:center;border:1.5px solid var(--k);background:#fff;color:var(--k);
  border-radius:99px;padding:.2em .8em;font:inherit;font-size:max(11px,1.3cqw);font-weight:600;white-space:nowrap;opacity:.55}
.tnr-chip:hover{opacity:.85}
.tnr-chip.is-on{background:var(--k);color:#fff;opacity:1}
.tnr-chip-s{display:none}
@container (max-width: 700px){ .tnr-chip-n{display:none} .tnr-chip-s{display:inline} .tnr-chip{padding:.2em .6em} }
.tnr-step{display:inline-flex;align-items:center;gap:.4em;font-size:max(11px,1.3cqw);color:var(--tnr-soft);white-space:nowrap}
.tnr-num{font-weight:700;color:var(--tnr-ink);min-width:1.2em;text-align:center}
.tnr-num small{font-weight:400;color:var(--tnr-soft);font-size:.9em}
@container (max-width: 560px){ .tnr-num small{display:none} }
.tnr-sbtn{width:1.7em;height:1.7em;border:1px solid var(--tnr-line);background:#fff;color:var(--tnr-ink);border-radius:50%;
  font:inherit;font-weight:700;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center}
.tnr-sbtn:hover{border-color:var(--tnr-c);color:var(--tnr-c)}
.tnr-bar :focus-visible{outline:2px solid var(--tnr-c);outline-offset:1px}
.tnr-area{flex:1;min-height:0;position:relative;margin:.9cqw 1.4cqw 1.4cqw}
.tnr-grid{position:absolute;inset:0;display:grid;background:var(--tnr-grid-bg);box-sizing:border-box;
  border:2px solid var(--tnr-c);border-radius:max(4px,.6cqw);overflow:hidden}
.tnr-h{box-sizing:border-box;min-width:0;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center;
  border-right:1px solid var(--tnr-rule);border-bottom:1px solid var(--tnr-rule);
  font-weight:700;white-space:nowrap;color:var(--tnr-ink);user-select:none;line-height:1}
.tnr-h.tnr-hcls{background:var(--k);color:#fff}
.tnr-h.tnr-hcol{background:color-mix(in srgb,var(--k) 22%,#fff);font-weight:600}
.tnr-h.tnr-hlast{border-bottom:2px solid var(--tnr-c)}
.tnr-h.tnr-hblank{background:transparent !important}
.tnr-root.tnr-bg-clair .tnr-h.tnr-hcol,.tnr-root.tnr-bg-transparent .tnr-h.tnr-hcol{background:color-mix(in srgb,var(--k) 28%,transparent)}
.tnr-root.tnr-bg-clair .tnr-h.tnr-hcls,.tnr-root.tnr-bg-transparent .tnr-h.tnr-hcls{background:color-mix(in srgb,var(--k) 85%,transparent)}
.tnr-c{box-sizing:border-box;min-width:0;min-height:0;position:relative;overflow:hidden;outline:none;
  border-right:1px solid var(--tnr-rule);border-bottom:1px solid var(--tnr-rule);
  background:color-mix(in srgb,var(--k) 6%,#fff);
  display:flex;align-items:center;justify-content:center;
  font-family:'MDI','Andika',cursive;font-size:var(--tnr-fs);line-height:1;color:var(--tnr-ink);cursor:text}
.tnr-root.tnr-bg-clair .tnr-c{background:color-mix(in srgb,var(--k) 8%,transparent)}
.tnr-root.tnr-bg-transparent .tnr-c{background:transparent}
.tnr-c.tnr-spare{background:transparent;border-right-style:dashed;border-bottom-style:dashed;border-color:color-mix(in srgb,var(--tnr-rule) 60%,transparent)}
.tnr-cend{border-right:2px solid var(--tnr-c) !important}
.tnr-virg{border-right:3px solid var(--tnr-virg) !important}
.tnr-edgeL{border-right:2px solid var(--tnr-c) !important;border-right-style:solid !important}
.tnr-lastc{border-right:0 !important}
.tnr-c.tnr-lastr{border-bottom:0}
.tnr-c:focus{box-shadow:inset 0 0 0 2px var(--tnr-c);background:color-mix(in srgb,var(--k) 16%,transparent)}
.tnr-d{pointer-events:none}
.tnr-comma{position:absolute;right:-.08em;bottom:.02em;font-weight:700;font-size:1.05em;line-height:1;pointer-events:none;color:var(--tnr-virg)}
.tnr-ink{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2}
.tnr-root.tnr-drawing .tnr-ink{pointer-events:auto}
.tnr-root.tnr-drawing .tnr-c{cursor:inherit}
.tnr-settings{position:absolute;inset:0;z-index:4;background:#fff;padding:2cqw 2.8cqw;overflow-y:auto;
  font-size:max(12px,1.4cqw);color:#222;user-select:auto;cursor:default}
.tnr-set-title{font-weight:700;font-size:1.15em;margin-bottom:1cqw}
.tnr-lbl{display:block;font-weight:600;margin:1.4cqw 0 .6cqw}
.tnr-row3{display:flex;gap:2cqw;flex-wrap:wrap}
.tnr-row3 .tnr-lbl{flex:1;min-width:140px}
.tnr-settings input[type=number]{display:block;width:100%;box-sizing:border-box;margin-top:.6cqw;
  padding:5px 6px;font:inherit;font-weight:400;border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.tnr-pills{display:flex;flex-wrap:wrap;gap:6px}
.tnr-pill{font:inherit;border:1px solid #ccc;background:#faf7f0;border-radius:99px;padding:5px 12px;cursor:pointer}
.tnr-pill:hover{border-color:#4a4f5c}
.tnr-pill.is-on{background:#4a4f5c;border-color:#4a4f5c;color:#fff;font-weight:700}
.tnr-chk{display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;margin-top:1cqw}
.tnr-sws{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.tnr-sw{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #bbb;cursor:pointer;padding:0}
.tnr-sw.is-on{box-shadow:0 0 0 2px #222}
.tnr-clear{display:flex;flex-wrap:wrap;gap:6px}
.tnr-clear button{font:inherit;border:1px solid #ccc;background:#faf7f0;border-radius:99px;padding:5px 12px;cursor:pointer}
.tnr-clear button:hover{border-color:#4a4f5c}
.tnr-help{margin-top:1.8cqw;padding:8px 10px;border-left:4px solid #4a4f5c;background:#f4f4f6;
  border-radius:0 8px 8px 0;line-height:1.45;font-size:.95em}
.tnr-done{margin-top:1.8cqw;width:100%;padding:7px;border:0;border-radius:4px;background:var(--tnr-ink);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.tnr-settings :focus-visible{outline:2px solid #4a4f5c;outline-offset:1px}
.tnr-root.tnr-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto}
.tnr-root.tnr-full.tnr-bg-opaque{background:#fbf8f1}
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .tnr-root.tnr-full{left:40px;height:100vh;height:100dvh}
}
.widget.tnr-is-full > .drag-handle,
.widget.tnr-is-full > .widget-rotate-handle,
.widget.tnr-is-full > .widget-action-bar,
.widget.tnr-is-full > .widget-ctx-menu,
.widget.tnr-is-full > .custom-resize-handle{display:none !important}
@media print{.tnr-bar,.tnr-settings{display:none}}
`;
        document.head.appendChild(st);
    }

    // « Effacer tout » de la barre Dessin efface aussi les dessins et les couleurs du tableau
    function hookClearCanvas() {
        const orig = window.clearCanvas;
        if (typeof orig !== 'function' || orig._tnrWrapped) return;
        const wrapped = function () {
            const r = orig.apply(this, arguments);
            let changed = false;
            document.querySelectorAll('.tnr-root').forEach(root => {
                const st = getState(root);
                if (!st.s.length && !Object.keys(st.b).length && !Object.keys(st.cb).length) return;
                st.s = []; st.b = {}; st.cb = {};
                renderLight(root);
                changed = true;
            });
            if (changed) save();
            return r;
        };
        wrapped._tnrWrapped = true;
        window.clearCanvas = wrapped;
    }

    function init() {
        hookClearCanvas();
        injectStyles();
        injectTemplate();
        document.querySelectorAll('.tnr-root').forEach(r => { if (!r.querySelector('.tnr-grid')) render(r); });
        mo.observe(document.body, { childList: true, subtree: true });
        setInterval(() => document.querySelectorAll('.tnr-root').forEach(syncMode), 150);
        setInterval(() => document.querySelectorAll('.tnr-root.tnr-front').forEach(keepFront), 300);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => document.querySelectorAll('.tnr-root').forEach(layout));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Sauvegarde / chargement (utilisés par save-load.js)
    window.tnrGetData = function (widget) {
        const root = widget && widget.querySelector('.tnr-root');
        return root ? clone(getState(root)) : null;
    };
    window.tnrSetData = function (widget, data) {
        const root = widget && widget.querySelector('.tnr-root');
        if (!root || !data) return;
        root._tnr = normalize(data);
        render(root);
    };
})();
