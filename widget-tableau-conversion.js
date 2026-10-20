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
   widget-tableau-conversion.js — Widget « Tableau de conversion »
   Le Bureau du Prof

   Un tableau de conversion des mesures dans lequel on écrit directement :
   - 4 tableaux : longueurs (km → mm), masses (kg → mg, + t et q en option),
     contenances (kL → mL, + m³ / dm³ / cm³ en option),
     aires (km² → mm², 2 colonnes par unité, + ha / a / ca en option)
   - colonne(s) vide(s) à gauche de km / kg / kL / km² (et à droite en option)
     pour les nombres qui sortent du tableau
   - écriture AU STYLET OU À LA SOURIS avec la barre Dessin (crayon, crayon
     de couleur, surligneur, figures, gomme, pot de peinture).
     Pot de peinture : sur une case → colorie la case ; sur un en-tête
     d'unité → colorie toute la colonne.
   - sans la barre Dessin : clic dans une case puis chiffres au clavier
     (le curseur avance tout seul ; « , » place la virgule après le chiffre)
   - fond opaque, clair ou transparent, et option « toujours au premier
     plan » : on peut le poser par-dessus un PDF (même en plein écran)
   - boutons fenêtre jaune (réduire), vert (plein écran), rouge (fermer)

   Les dessins sont enregistrés en « unités de case » : ils restent dans
   leurs cases quand on redimensionne le widget, qu'on ajoute des lignes
   ou des colonnes vides. Chaque tableau (longueurs, masses…) garde ses
   propres dessins, chiffres et couleurs.

   Utilisation : createWidget('tableau-conversion')
   Le template #template-tableau-conversion est injecté par ce fichier.
   Sauvegarde : window.tconvGetData / window.tconvSetData (save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const TYPES = {
        longueurs:   { n: 'Longueurs',   ico: '📏', u: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], base: 3 },
        masses:      { n: 'Masses',      ico: '⚖️', u: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'], base: 3 },
        contenances: { n: 'Contenances', ico: '🧪', u: ['kL', 'hL', 'daL', 'L', 'dL', 'cL', 'mL'], base: 3 },
        aires:       { n: 'Aires',       ico: '⬛', u: ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'], base: 3, sub: 2 }
    };
    const TYPE_KEYS = Object.keys(TYPES);
    const COLORS = ['#2f6fb5', '#2e9e6a', '#d9822b', '#7b5cc4', '#d6456b', '#b8901a', '#5a5f6b'];
    const LIM = { rMin: 1, rMax: 12, sMax: 3 };
    const DEFAULT = {
        type: 'longueurs',
        rows: 3,
        spareL: 0,           // colonnes vides à gauche (pour les aires : 1 = 2 sous-colonnes)
        spareR: 0,           // colonnes vides à droite
        tq: false,           // masses : tonne et quintal
        vol: false,          // contenances : m³, dm³, cm³
        agr: false,          // aires : ha, a, ca
        color: '#2f6fb5',
        bgMode: 'opaque',    // 'opaque' | 'clair' | 'transparent'
        front: true,         // toujours au-dessus des autres widgets (PDF…)
        d: {}                // par tableau : { s: dessins, v: chiffres tapés, b: couleurs des cases, cb: couleurs des colonnes }
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

    function normalize(o) {
        const st = Object.assign(clone(DEFAULT), o || {});
        if (!TYPES[st.type]) st.type = 'longueurs';
        st.rows = clampInt(st.rows, LIM.rMin, LIM.rMax);
        st.spareL = clampInt(st.spareL, 0, LIM.sMax);
        st.spareR = clampInt(st.spareR, 0, LIM.sMax);
        st.tq = !!st.tq; st.vol = !!st.vol; st.agr = !!st.agr;
        st.front = st.front !== false;
        if (!['opaque', 'clair', 'transparent'].includes(st.bgMode)) st.bgMode = 'opaque';
        if (!isObj(st.d)) st.d = {};
        TYPE_KEYS.forEach(k => {
            const v = isObj(st.d[k]) ? st.d[k] : {};
            st.d[k] = {
                s:  Array.isArray(v.s) ? v.s : [],
                v:  isObj(v.v)  ? v.v  : {},
                b:  isObj(v.b)  ? v.b  : {},
                cb: isObj(v.cb) ? v.cb : {}
            };
        });
        return st;
    }

    function getState(root) {
        if (!root._tc) {
            let init = {};
            try { init = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) {}
            root._tc = normalize(init);
        }
        return root._tc;
    }
    const cur = st => st.d[st.type];

    /* ── Géométrie du tableau ─────────────────────────────────────────
       Les colonnes sont repérées par x (en « cases ») : x = 0 est la
       colonne km / kg / kL / km². Les colonnes vides de gauche ont x < 0. */
    function geom(st) {
        const type = st.type, T = TYPES[type], sub = T.sub || 1;
        const realMin = (type === 'masses' && st.tq) ? -3 : 0;
        const unitsEnd = T.u.length * sub;
        const xMin = realMin - st.spareL * sub, xMax = unitsEnd + st.spareR * sub;

        // Complète une ligne d'en-tête avec des cases vides entre les étiquettes
        const fill = segs => {
            const out = []; let x = xMin;
            segs.sort((p, q) => p.a - q.a).forEach(s => {
                const a = Math.max(s.a, xMin), b = Math.min(s.b, xMax);
                if (b <= a) return;
                if (a > x) out.push({ a: x, b: a, label: '', cls: 'tc-hblank' });
                out.push(Object.assign({}, s, { a, b }));
                x = b;
            });
            if (x < xMax) out.push({ a: x, b: xMax, label: '', cls: 'tc-hblank' });
            return out;
        };

        const heads = [];
        if (type === 'contenances' && st.vol) {
            heads.push(fill([
                { a: -2, b: 1, label: 'm³',  cls: 'tc-hvol' },
                { a: 1,  b: 4, label: 'dm³', cls: 'tc-hvol' },
                { a: 4,  b: 7, label: 'cm³', cls: 'tc-hvol' }
            ]));
        }
        const units = T.u.map((u, i) => ({ a: i * sub, b: (i + 1) * sub, label: u, cls: 'tc-hunit' + (i === T.base ? ' tc-base' : ''), unit: true }));
        if (realMin < 0) {
            units.push({ a: -3, b: -2, label: 't', cls: 'tc-hunit', unit: true },
                       { a: -2, b: -1, label: 'q', cls: 'tc-hunit', unit: true },
                       { a: -1, b: 0,  label: '',  cls: 'tc-hunit', unit: true });
        }
        const unitRow = heads.length;
        heads.push(fill(units));
        if (type === 'aires' && st.agr) {
            heads.push(fill([
                { a: 2, b: 4, label: 'ha', cls: 'tc-hagr' },
                { a: 4, b: 6, label: 'a',  cls: 'tc-hagr' },
                { a: 6, b: 8, label: 'ca', cls: 'tc-hagr' }
            ]));
        }
        return { T, sub, realMin, unitsEnd, xMin, xMax, n: xMax - xMin, heads, unitRow,
                 baseA: T.base * sub, baseB: (T.base + 1) * sub };
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
        const full = root.classList.contains('tc-full');
        const tabs = TYPE_KEYS.map(k =>
            '<button type="button" class="tc-type' + (k === st.type ? ' is-on' : '') + '" data-tc-type="' + k + '" title="' + TYPES[k].n + '">' +
            '<span class="tc-type-ico">' + TYPES[k].ico + '</span><span class="tc-type-n">' + TYPES[k].n + '</span></button>'
        ).join('');
        return '<div class="tc-bar" title="Glisser pour déplacer">' +
            '<span class="tc-grip" title="Déplacer" aria-hidden="true">⠿</span>' +
            '<button type="button" class="tc-gear" data-tc-action="toggle" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
            '<div class="tc-types"' + STOP + '>' + tabs + '</div>' +
            '<span class="tc-step"' + STOP + ' title="Lignes">' +
                '<button type="button" class="tc-sbtn" data-tc-action="row-" aria-label="Retirer une ligne">−</button>' +
                '<span class="tc-num">' + st.rows + '<small> ' + (st.rows > 1 ? 'lignes' : 'ligne') + '</small></span>' +
                '<button type="button" class="tc-sbtn" data-tc-action="row+" aria-label="Ajouter une ligne">+</button>' +
            '</span>' +
            '<div class="wf-btns"' + STOP + '>' +
                '<button type="button" class="wf-btn wf-btn-min" data-tc-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                '<button type="button" class="wf-btn wf-btn-max" data-tc-action="wf-max" title="' + (full ? 'Quitter le plein écran' : 'Plein écran') + '" aria-label="Plein écran"></button>' +
                '<button type="button" class="wf-btn wf-btn-close" data-tc-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
            '</div>' +
        '</div>';
    }

    function cellInner(v) {
        if (!v) return '';
        const d = v.replace(',', '');
        return '<span class="tc-d">' + esc(d) + '</span>' + (v.includes(',') ? '<span class="tc-comma">,</span>' : '');
    }

    function cellBg(D, r, x) {
        return D.b[r + ':' + x] || D.cb[x] || '';
    }

    function buildGrid(st) {
        const g = geom(st), D = cur(st), H = g.heads.length;
        let html = '';
        g.heads.forEach((row, k) => row.forEach(s => {
            let style = 'grid-column:' + (s.a - g.xMin + 1) + ' / ' + (s.b - g.xMin + 1) + ';grid-row:' + (k + 1);
            if (s.unit && D.cb[s.a]) style += ';background:' + esc(D.cb[s.a]);
            html += '<div class="tc-h ' + s.cls + (k === H - 1 ? ' tc-hlast' : '') + (s.b === g.xMax ? ' tc-hend' : '') + '" style="' + style + '">' + esc(s.label) + '</div>';
        }));
        for (let r = 0; r < st.rows; r++) {
            for (let x = g.xMin; x < g.xMax; x++) {
                const spare = x < g.realMin || x >= g.unitsEnd;
                let cls = 'tc-c';
                if (spare) cls += ' tc-spare';
                if (x === g.realMin - 1) cls += ' tc-edgeL';                  // dernière colonne vide : trait plein à droite
                if (g.sub === 2 && ((x % 2) + 2) % 2 === 0) cls += ' tc-in';  // aires : trait pointillé au milieu de l'unité
                if (x >= g.baseA && x < g.baseB) cls += ' tc-bc';
                if (x === g.xMax - 1) cls += ' tc-lastc';
                if (r === st.rows - 1) cls += ' tc-lastr';
                const bg = cellBg(D, r, x);
                html += '<div class="' + cls + '" tabindex="-1" data-r="' + r + '" data-x="' + x + '" style="grid-column:' + (x - g.xMin + 1) +
                    ';grid-row:' + (H + r + 1) + (bg ? ';background:' + esc(bg) : '') + '">' + cellInner(D.v[r + ':' + x]) + '</div>';
            }
        }
        return '<div class="tc-area"' + STOP + '>' +
            '<div class="tc-grid" style="grid-template-columns:repeat(' + g.n + ',minmax(0,1fr));grid-template-rows:repeat(' + H + ',minmax(0,.62fr)) repeat(' + st.rows + ',minmax(0,1fr))">' +
            html + '</div><canvas class="tc-ink"></canvas></div>';
    }

    function buildSettings(st) {
        const T = TYPES[st.type];
        const swatches = COLORS.map(col =>
            '<button type="button" class="tc-sw' + (col === st.color ? ' is-on' : '') + '" data-tc-color="' + col + '" style="background:' + col + '" aria-label="Couleur ' + col + '"></button>'
        ).join('');
        const types = TYPE_KEYS.map(k =>
            '<button type="button" class="tc-pill' + (k === st.type ? ' is-on' : '') + '" data-tc-type="' + k + '">' + TYPES[k].ico + ' ' + TYPES[k].n + '</button>'
        ).join('');
        const bgs = [['opaque', '⬜ Opaque'], ['clair', '🌫️ Clair'], ['transparent', '🔲 Transparent']].map(b =>
            '<button type="button" class="tc-pill' + (b[0] === st.bgMode ? ' is-on' : '') + '" data-tc-bg="' + b[0] + '">' + b[1] + '</button>'
        ).join('');
        let opt = '';
        if (st.type === 'masses')      opt = '<label class="tc-chk"><input type="checkbox" data-tc-opt="tq"' + (st.tq ? ' checked' : '') + '> Ajouter la tonne (t) et le quintal (q)</label>';
        if (st.type === 'contenances') opt = '<label class="tc-chk"><input type="checkbox" data-tc-opt="vol"' + (st.vol ? ' checked' : '') + '> Afficher les volumes (m³, dm³, cm³)</label>';
        if (st.type === 'aires')       opt = '<label class="tc-chk"><input type="checkbox" data-tc-opt="agr"' + (st.agr ? ' checked' : '') + '> Afficher les mesures agraires (ha, a, ca)</label>';
        const first = st.type === 'masses' && st.tq ? 't' : T.u[0];
        return '<div class="tc-settings"' + STOP + '>' +
            '<div class="tc-set-title">Réglages du tableau de conversion</div>' +
            '<div class="tc-lbl">Mesures</div><div class="tc-pills">' + types + '</div>' +
            (opt ? '<div class="tc-opt">' + opt + '</div>' : '') +
            '<div class="tc-row3">' +
              '<label class="tc-lbl">Lignes<input type="number" min="' + LIM.rMin + '" max="' + LIM.rMax + '" value="' + st.rows + '" data-tc-rows></label>' +
              '<label class="tc-lbl">Colonnes vides à gauche de ' + esc(first) + '<input type="number" min="0" max="' + LIM.sMax + '" value="' + st.spareL + '" data-tc-spare="L"></label>' +
              '<label class="tc-lbl">Colonnes vides à droite<input type="number" min="0" max="' + LIM.sMax + '" value="' + st.spareR + '" data-tc-spare="R"></label>' +
            '</div>' +
            '<div class="tc-lbl">Couleur du tableau</div><div class="tc-sws">' + swatches + '</div>' +
            '<div class="tc-lbl">Fond (pour poser le tableau sur un PDF)</div><div class="tc-pills">' + bgs + '</div>' +
            '<label class="tc-chk"><input type="checkbox" data-tc-front' + (st.front ? ' checked' : '') + '> Toujours au premier plan (reste au-dessus d\'un PDF, même en plein écran)</label>' +
            '<div class="tc-lbl">Effacer (tableau « ' + T.n + ' »)</div>' +
            '<div class="tc-clear">' +
              '<button type="button" data-tc-action="clear-ink">🧽 Les dessins</button>' +
              '<button type="button" data-tc-action="clear-text">⌫ Les chiffres tapés</button>' +
              '<button type="button" data-tc-action="clear-bg">🎨 Les couleurs</button>' +
            '</div>' +
            '<div class="tc-help">✏️ <b>Pour écrire au stylet ou à la souris</b> : ouvrez la barre Dessin et écrivez directement dans les cases. ' +
              'Le pot de peinture colorie une case, ou toute une colonne si on clique sur l\'unité.<br>' +
              '⌨️ <b>Au clavier</b> : barre Dessin fermée, cliquez dans une case et tapez les chiffres (le curseur avance tout seul). ' +
              '« , » ajoute la virgule après le chiffre, Retour arrière efface, les flèches déplacent.</div>' +
            '<button type="button" class="tc-done" data-tc-action="close">Terminé</button>' +
        '</div>';
    }

    function applyLook(root, st) {
        root.style.setProperty('--tc-c', st.color);
        ['opaque', 'clair', 'transparent'].forEach(m => root.classList.toggle('tc-bg-' + m, st.bgMode === m));
        root.classList.toggle('tc-front', st.front);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('tc-see-through', st.bgMode !== 'opaque');
    }

    function render(root) {
        const st = getState(root);
        const open = root.classList.contains('tc-open');
        applyLook(root, st);
        root.innerHTML = buildBar(root, st) + buildGrid(st) + (open ? buildSettings(st) : '');
        bindCanvas(root);
        watchSize(root);
        layout(root);
        syncMode(root);
    }

    function renderLight(root) {
        const settings = root.querySelector('.tc-settings');
        const scroll = settings ? settings.scrollTop : 0;
        render(root);
        const s2 = root.querySelector('.tc-settings');
        if (s2) s2.scrollTop = scroll;
    }

    function paintCell(root, r, x) {
        const st = getState(root), D = cur(st);
        const cell = root.querySelector('.tc-c[data-r="' + r + '"][data-x="' + x + '"]');
        if (!cell) return;
        cell.innerHTML = cellInner(D.v[r + ':' + x]);
        cell.style.background = cellBg(D, r, x);
    }

    /* ── Mise en page : mesure des cases, canvas, tailles de texte ───── */
    function layout(root) {
        const area = root.querySelector('.tc-area'), cv = root.querySelector('.tc-ink');
        const grid = root.querySelector('.tc-grid');
        const c0 = root.querySelector('.tc-c[data-r="0"][data-x="0"]');
        if (!area || !cv || !grid || !c0) return;
        const W = area.clientWidth, H = area.clientHeight;
        if (!W || !H) return;
        const st = getState(root), g = geom(st);
        root._geo = {
            ox: c0.offsetLeft + grid.clientLeft,
            top: c0.offsetTop + grid.clientTop,
            cw: c0.offsetWidth || 1,
            rh: c0.offsetHeight || 1
        };
        const h0 = root.querySelector('.tc-h');
        const hh = h0 ? h0.offsetHeight : root._geo.rh * 0.6;
        const geo = root._geo;
        root.style.setProperty('--tc-fs', Math.max(8, Math.min(geo.rh * 0.62, geo.cw * 0.85)).toFixed(1) + 'px');
        root.style.setProperty('--tc-hfs', Math.max(8, Math.min(hh * 0.58, geo.cw * g.sub * 0.3, 44)).toFixed(1) + 'px');
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

    /* ── Dessin des traits (coordonnées en cases → pixels) ────────── */
    const toPx = (geo, a) => ({ x: geo.ox + a[0] * geo.cw, y: geo.top + a[1] * geo.rh });
    const toU  = (geo, p) => [(p.x - geo.ox) / geo.cw, (p.y - geo.top) / geo.rh];

    function paintStroke(ctx, s, geo) {
        if (!s.p || !s.p.length) return;
        const pts = s.p.map(a => toPx(geo, a));
        const lw = Math.max(0.5, s.w * geo.cw);
        const single = s.dot || pts.length < 2;

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

    function redraw(root) {
        const area = root.querySelector('.tc-area'), cv = root.querySelector('.tc-ink');
        const geo = root._geo;
        if (!area || !cv || !cv.width || !geo) return;
        const W = area.clientWidth;
        if (!W) return;
        const ctx = cv.getContext('2d');
        const dpr = cv.width / W;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cur(getState(root)).s.forEach(s => paintStroke(ctx, s, geo));
        if (root._live) paintStroke(ctx, root._live, geo);
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

    /* ── Gomme : coupe les traits touchés ─────────────────────────── */
    function densify(pts, step) {
        if (pts.length < 2) return pts.slice();
        const out = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const A = pts[i], B = pts[i + 1];
            const n = Math.floor(Math.hypot(B.x - A.x, B.y - A.y) / step);
            for (let j = 1; j <= n; j++) {
                const t = j / (n + 1);
                out.push({ x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) });
            }
            out.push(B);
        }
        return out;
    }

    function eraseAt(root, pos) {
        const D = cur(getState(root)), geo = root._geo;
        if (!geo) return false;
        const r = eraserRadius();
        let changed = false;
        const out = [];
        D.s.forEach(s => {
            const half = (s.w * geo.cw) / 2;
            const px = s.p.map(a => toPx(geo, a));
            const m = r + half + 2;
            if (!px.some(p => Math.abs(p.x - pos.x) < m + 400 && Math.abs(p.y - pos.y) < m + 400)) { out.push(s); return; }
            const d = densify(px, 3);
            const hit = p => Math.hypot(p.x - pos.x, p.y - pos.y) <= r + half * 0.5;
            if (!d.some(hit)) { out.push(s); return; }
            changed = true;
            if (s.dot || d.length < 2) return;
            let piece = [];
            const flush = () => {
                if (piece.length >= 2) out.push(Object.assign({}, s, { p: piece.map(q => toU(geo, q).map(r4)) }));
                piece = [];
            };
            d.forEach(p => { if (hit(p)) flush(); else piece.push(p); });
            flush();
        });
        if (changed) D.s = out;
        return changed;
    }

    /* ── Pot de peinture : une case, ou toute la colonne (en-tête) ─── */
    function fillAt(root, pos) {
        const st = getState(root), D = cur(st), g = geom(st), geo = root._geo;
        if (!geo) return;
        const x = Math.floor((pos.x - geo.ox) / geo.cw);
        if (x < g.xMin || x >= g.xMax) return;
        const color = typeof _fillCurrentColor === 'function' ? _fillCurrentColor() : curColor();
        snap();
        if (pos.y < geo.top) {
            // En-tête : toute la colonne de l'unité (les 2 sous-colonnes pour les aires)
            const seg = g.heads[g.unitRow].find(s => x >= s.a && x < s.b) || { a: x, b: x + 1 };
            const off = D.cb[seg.a] === color;
            for (let xx = seg.a; xx < seg.b; xx++) {
                if (off) delete D.cb[xx]; else D.cb[xx] = color;
            }
            renderLight(root);
        } else {
            const r = Math.floor((pos.y - geo.top) / geo.rh);
            if (r < 0 || r >= st.rows) return;
            const k = r + ':' + x;
            if (D.b[k] === color) delete D.b[k]; else D.b[k] = color;
            paintCell(root, r, x);
        }
        save();
    }

    /* ── Événements du calque de dessin ────────────────────────────── */
    function localPos(root, e) {
        const area = root.querySelector('.tc-area');
        const rect = area.getBoundingClientRect();
        const W = area.clientWidth || rect.width, H = area.clientHeight || rect.height;
        return {
            x: (e.clientX - rect.left) * (W / (rect.width || 1)),
            y: (e.clientY - rect.top) * (H / (rect.height || 1))
        };
    }

    function bindCanvas(root) {
        const cv = root.querySelector('.tc-ink');
        if (!cv) return;

        // Empêche la barre Dessin de tracer aussi sur le fond du tableau
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
                p: [toU(root._geo, pos)]
            };
            scheduleRedraw(root);
        });

        cv.addEventListener('pointermove', e => {
            const mode = drawState();
            if (!mode || !root._geo) return;
            e.stopPropagation();
            const geo = root._geo;
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
            if (live.t === 'fig') {
                const pts = _buildFigurePoints(live.fig, root._start, localPos(root, e));
                if (pts) live.p = pts.map(p => toU(geo, p));
            } else {
                const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
                evs.forEach(ev => {
                    const pos = localPos(root, ev);
                    const last = toPx(geo, live.p[live.p.length - 1]);
                    if (Math.hypot(last.x - pos.x, last.y - pos.y) < 0.8) return;
                    live.p.push(toU(geo, pos));
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
            const geo = root._geo;
            if (live.t === 'fig') {
                if (live.p.length < 2) { redraw(root); return; }
            } else {
                const o = live.p[0];
                if (live.p.every(p => Math.hypot((p[0] - o[0]) * geo.cw, (p[1] - o[1]) * geo.rh) <= 3)) {
                    live.dot = true;
                    live.p = [o];
                }
            }
            live.p = live.p.map(p => [r4(p[0]), r4(p[1])]);
            live.w = r4(live.w);
            if (live.t !== 'fig') delete live.fig;
            cur(getState(root)).s.push(live);
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
        if (root.classList.contains('tc-drawing') !== on) {
            root.classList.toggle('tc-drawing', on);
            if (on && document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
        }
        const cv = root.querySelector('.tc-ink');
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
            if (o === w || o.querySelector('.tc-root.tc-front')) return;
            const z = parseInt(getComputedStyle(o).zIndex) || 0;
            if (z > max) max = z;
            // Un PDF (ou un média) en plein écran passe au-dessus de tout le tableau
            if (o.querySelector('.wf-pdf-fullboard, .wf-media-fullboard, .wf-fullboard')) max = Math.max(max, 10000);
        });
        const mine = parseInt(w.style.zIndex) || 0;
        if (mine <= max) w.style.zIndex = String(max + 1);
    }

    /* ── Réglages de structure ─────────────────────────────────────── */
    function setOpt(root, fn) {
        snap();
        fn(getState(root));
        root._tc = normalize(getState(root));
        renderLight(root);
        save();
    }

    /* ── Boutons fenêtre ──────────────────────────────────────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('tc-full');
        root.classList.toggle('tc-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('tc-is-full', full);
        const b = root.querySelector('[data-tc-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    }

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('tc-full')) toggleFull(root, false);
        root.classList.remove('tc-open');
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden';
        window._wfMiniBarCollapse(widget, '📐 Conversion', {
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
            Promise.resolve(modalConfirm('Tableau de conversion', msg)).then(ok => { if (ok) fn(); });
        } else if (window.confirm(msg)) fn();
    }

    /* ── Événements délégués ──────────────────────────────────────── */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('[data-tc-action], [data-tc-color], [data-tc-type], [data-tc-bg]');
        if (!btn) return;
        const root = btn.closest('.tc-root');
        if (!root) return;
        e.stopPropagation();
        const st = getState(root);
        if (btn.hasAttribute('data-tc-type')) {
            const t = btn.getAttribute('data-tc-type');
            if (t !== st.type) { st.type = t; renderLight(root); save(); }
            return;
        }
        if (btn.hasAttribute('data-tc-color')) { st.color = btn.getAttribute('data-tc-color'); renderLight(root); save(); return; }
        if (btn.hasAttribute('data-tc-bg'))    { st.bgMode = btn.getAttribute('data-tc-bg'); renderLight(root); save(); return; }
        const act = btn.getAttribute('data-tc-action');
        if (act === 'wf-min')   { minimizeWidget(root); return; }
        if (act === 'wf-max')   { toggleFull(root); return; }
        if (act === 'wf-close') { closeWidget(root); return; }
        if (act === 'row+') { if (st.rows < LIM.rMax) setOpt(root, s => { s.rows++; }); return; }
        if (act === 'row-') { if (st.rows > LIM.rMin) setOpt(root, s => { s.rows--; }); return; }
        const D = cur(st);
        if (act === 'clear-ink') {
            if (!D.s.length) return;
            confirmThen('Effacer tous les dessins de ce tableau ?', () => { snap(); D.s = []; redraw(root); save(); });
            return;
        }
        if (act === 'clear-text') {
            if (!Object.keys(D.v).length) return;
            confirmThen('Effacer tous les chiffres tapés dans ce tableau ?', () => { snap(); D.v = {}; renderLight(root); save(); });
            return;
        }
        if (act === 'clear-bg') { snap(); D.b = {}; D.cb = {}; renderLight(root); save(); return; }
        if (act === 'toggle') root.classList.toggle('tc-open');
        if (act === 'close') root.classList.remove('tc-open');
        render(root);
    }, true);

    document.addEventListener('change', function (e) {
        const t = e.target;
        const root = t.closest && t.closest('.tc-root');
        if (!root || !t.closest('.tc-settings')) return;
        if (t.hasAttribute('data-tc-rows'))  { setOpt(root, s => { s.rows = t.value; }); return; }
        if (t.hasAttribute('data-tc-spare')) { const side = t.getAttribute('data-tc-spare'); setOpt(root, s => { s['spare' + side] = t.value; }); return; }
        if (t.hasAttribute('data-tc-opt'))   { const k = t.getAttribute('data-tc-opt'); setOpt(root, s => { s[k] = t.checked; }); return; }
        if (t.hasAttribute('data-tc-front')) {
            const st = getState(root);
            st.front = t.checked;
            applyLook(root, st);
            keepFront(root);
            save();
        }
    });

    // Clic dans une case (barre Dessin fermée) : prête à recevoir des chiffres
    document.addEventListener('pointerup', function (e) {
        const cell = e.target.closest && e.target.closest('.tc-c');
        if (!cell) return;
        const root = cell.closest('.tc-root');
        if (!root || root.classList.contains('tc-drawing')) return;
        cell.focus();
    });
    document.addEventListener('focusin', function (e) {
        if (e.target.closest && e.target.closest('.tc-c')) snap();
    });

    // Clavier : chiffres, virgule, effacement, déplacements
    document.addEventListener('keydown', function (e) {
        const t = e.target;
        if (!t.closest) return;
        const root = t.closest('.tc-root');
        if (e.key === 'Escape' && !root) {
            document.querySelectorAll('.tc-root.tc-full').forEach(r => toggleFull(r, false));
            return;
        }
        if (!root) return;
        e.stopPropagation();            // pas de raccourcis du tableau (Suppr…) pendant la saisie
        const cell = t.closest('.tc-c');
        if (!cell || e.ctrlKey || e.metaKey || e.altKey) return;
        const st = getState(root), D = cur(st), g = geom(st);
        const r = +cell.dataset.r, x = +cell.dataset.x;
        const K = (rr, xx) => rr + ':' + xx;
        const go = (rr, xx) => {
            const c = root.querySelector('.tc-c[data-r="' + rr + '"][data-x="' + xx + '"]');
            if (c) c.focus();
        };
        const done = () => { e.preventDefault(); save(); };
        if (/^[0-9]$/.test(e.key)) {
            D.v[K(r, x)] = e.key;
            paintCell(root, r, x);
            if (x + 1 < g.xMax) go(r, x + 1);
            done(); return;
        }
        if (e.key === ',' || e.key === '.') {
            // La virgule se place après le chiffre qu'on vient de taper
            let tx = x;
            if (!/[0-9]/.test(D.v[K(r, x)] || '') && x - 1 >= g.xMin && /[0-9]/.test(D.v[K(r, x - 1)] || '')) tx = x - 1;
            const k = K(r, tx), v = D.v[k] || '';
            const nv = v.includes(',') ? v.replace(',', '') : v + ',';
            if (nv) D.v[k] = nv; else delete D.v[k];
            paintCell(root, r, tx);
            done(); return;
        }
        if (e.key === 'Backspace') {
            if (D.v[K(r, x)]) { delete D.v[K(r, x)]; paintCell(root, r, x); }
            else if (x - 1 >= g.xMin) { delete D.v[K(r, x - 1)]; paintCell(root, r, x - 1); go(r, x - 1); }
            done(); return;
        }
        if (e.key === 'Delete' || e.key === ' ') {
            delete D.v[K(r, x)]; paintCell(root, r, x);
            if (e.key === ' ' && x + 1 < g.xMax) go(r, x + 1);
            done(); return;
        }
        const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0], Enter: [1, 0] };
        if (e.key === 'Tab') moves.Tab = [0, e.shiftKey ? -1 : 1];
        if (moves[e.key]) {
            e.preventDefault();
            const nr = r + moves[e.key][0], nx = x + moves[e.key][1];
            if (nr >= 0 && nr < st.rows && nx >= g.xMin && nx < g.xMax) go(nr, nx);
            return;
        }
        if (e.key === 'Escape') { e.preventDefault(); cell.blur(); }
    }, true);

    /* ── Déplacement du widget par la barre du haut ────────────────
       On attrape la barre (hors boutons) et on fait glisser le widget.
       Un petit mouvement est toléré pour ne pas gêner les clics. */
    function onBarDown(e) {
        const bar = e.target.closest && e.target.closest('.tc-bar');
        if (!bar) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('button, input, select, label')) return;
        const root = bar.closest('.tc-root');
        const w = root && root.closest('.widget');
        if (!w || root.classList.contains('tc-full') || w.querySelector('.wf-mini-bar')) return;
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
                bar.classList.add('tc-moving');
            }
            w.style.left = Math.round(l0 + dx) + 'px';
            w.style.top  = Math.round(t0 + dy) + 'px';
        };
        const up = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            bar.classList.remove('tc-moving');
            if (moved) save();
        };
        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    }
    document.addEventListener('pointerdown', onBarDown, true);
    // Empêche le déplacement natif du board de démarrer en même temps
    ['mousedown', 'touchstart'].forEach(t => document.addEventListener(t, e => {
        const bar = e.target.closest && e.target.closest('.tc-bar');
        if (!bar || e.target.closest('button, input, select, label')) return;
        e.stopPropagation();
    }, { capture: true, passive: true }));

    /* ── Redimensionnement libre (poignée du board) ───────────────── */
    const MIN_W = 300, MIN_H = 150, MAX_W = 3200, MAX_H = 2000;

    function tcBox(widget) {
        const root = widget.querySelector('.tc-root');
        return root ? (root.closest('.editor-container') || root) : null;
    }

    function startResize(e, widget) {
        const box = tcBox(widget);
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
        if (!widget || !widget.querySelector('.tc-root')) return;
        if (widget.classList.contains('tc-is-full') || widget.querySelector('.wf-mini-bar')) return;
        if (e.type === 'pointerdown') { startResize(e, widget); return; }
        e.stopPropagation(); e.stopImmediatePropagation();
        if (e.cancelable) e.preventDefault();
    }
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t =>
        document.addEventListener(t, onResizeDown, { capture: true, passive: false }));

    /* ── Hydratation : nouveaux widgets et boards rechargés ──────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        const roots = node.matches('.tc-root') ? [node] : Array.from(node.querySelectorAll('.tc-root'));
        roots.forEach(r => {
            if (!r.querySelector('.tc-grid')) render(r);
            else applyLook(r, getState(r));
            const w = r.closest('.widget');
            if (w && !w._tcAutoMax) {
                w._tcAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('tc-full'), null, true);
            }
            setTimeout(() => keepFront(r), 0);
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) m.addedNodes.forEach(n => {
            if (!(n instanceof Element)) return;
            if (n.closest('.tc-root') && !n.matches('.tc-root')) return;
            if (n.matches('.widget, .tc-root') || n.querySelector('.tc-root')) hydrate(n);
        });
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-tableau-conversion')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-tableau-conversion';
        tpl.innerHTML =
            '<div class="editor-container" style="width:820px;height:270px;">' +
                '<div class="tc-root" data-cfg="{}"></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('tc-styles')) return;
        const st = document.createElement('style');
        st.id = 'tc-styles';
        st.textContent = `
.tc-root{
  --tc-c:#2f6fb5; --tc-ink:#26221d; --tc-soft:#6f675c; --tc-line:#e6dfd0; --tc-fs:24px; --tc-hfs:16px;
  --tc-paper:#fbf8f1; --tc-grid-bg:#fff;
  --tc-head-bg:color-mix(in srgb,var(--tc-c) 16%,#fff);
  --tc-vol-bg:color-mix(in srgb,var(--tc-c) 30%,#fff);
  --tc-bc-bg:color-mix(in srgb,var(--tc-c) 6%,#fff);
  --tc-bar-bg:transparent;
  --tc-rule:color-mix(in srgb,var(--tc-c) 50%,#bbb);
  container-type:inline-size; position:relative; width:100%; height:100%;
  box-sizing:border-box; background:var(--tc-paper);
  display:flex; flex-direction:column; overflow:hidden;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:var(--tc-ink);
}
.tc-root.tc-bg-clair{
  --tc-paper:rgba(251,248,241,.45); --tc-grid-bg:rgba(255,255,255,.4);
  --tc-head-bg:color-mix(in srgb,var(--tc-c) 22%,transparent);
  --tc-vol-bg:color-mix(in srgb,var(--tc-c) 36%,transparent);
  --tc-bc-bg:color-mix(in srgb,var(--tc-c) 8%,transparent);
  --tc-bar-bg:rgba(255,255,255,.7);
}
.tc-root.tc-bg-transparent{
  --tc-paper:transparent; --tc-grid-bg:transparent;
  --tc-head-bg:color-mix(in srgb,var(--tc-c) 22%,transparent);
  --tc-vol-bg:color-mix(in srgb,var(--tc-c) 36%,transparent);
  --tc-bc-bg:transparent;
  --tc-bar-bg:rgba(255,255,255,.8);
}
.widget.tc-see-through,
.widget.tc-see-through > .widget-content,
.widget.tc-see-through .editor-container{background:transparent !important;box-shadow:none !important;border-color:transparent !important}
.tc-bar{flex:none;display:grid;grid-template-columns:auto auto 1fr auto auto;align-items:center;gap:1.5cqw;
  padding:.8cqw 1.6cqw;margin:.6cqw 1.6cqw 0;border-radius:8px;background:var(--tc-bar-bg);user-select:none;
  cursor:grab;touch-action:none}
.tc-bar.tc-moving{cursor:grabbing}
.tc-bar button{cursor:pointer}
.tc-grip{color:#b3aa9b;font-size:max(14px,2.4cqw);line-height:1;padding:0 .2em}
.tc-bar:hover .tc-grip{color:var(--tc-ink)}
.tc-root.tc-full .tc-bar{cursor:default}
.tc-gear{border:0;background:none;color:#a39a8b;font-size:max(14px,2.6cqw);line-height:1;cursor:pointer;padding:.5cqw;border-radius:5px}
.tc-gear:hover,.tc-gear:focus-visible{color:var(--tc-ink);outline:1px solid var(--tc-line)}
.tc-types{display:flex;flex-wrap:wrap;gap:.7cqw;justify-content:center}
.tc-type{display:inline-flex;align-items:center;gap:.35em;border:1px solid var(--tc-line);background:#fff;color:var(--tc-soft);
  border-radius:99px;padding:.25em .75em;font:inherit;font-size:max(11px,1.7cqw);cursor:pointer;white-space:nowrap}
.tc-type:hover{border-color:var(--tc-c);color:var(--tc-c)}
.tc-type.is-on{background:var(--tc-c);border-color:var(--tc-c);color:#fff;font-weight:700}
@container (max-width: 560px){ .tc-type-n{display:none} .tc-type{padding:.25em .55em} }
.tc-step{display:inline-flex;align-items:center;gap:.4em;font-size:max(11px,1.7cqw);color:var(--tc-soft);white-space:nowrap}
.tc-num{font-weight:700;color:var(--tc-ink);min-width:1.2em;text-align:center}
.tc-num small{font-weight:400;color:var(--tc-soft);font-size:.9em}
@container (max-width: 460px){ .tc-num small{display:none} }
.tc-sbtn{width:1.7em;height:1.7em;border:1px solid var(--tc-line);background:#fff;color:var(--tc-ink);border-radius:50%;
  cursor:pointer;font:inherit;font-weight:700;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center}
.tc-sbtn:hover{border-color:var(--tc-c);color:var(--tc-c)}
.tc-bar :focus-visible{outline:2px solid var(--tc-c);outline-offset:1px}
.tc-area{flex:1;min-height:0;position:relative;margin:1cqw 1.6cqw 1.6cqw}
.tc-grid{position:absolute;inset:0;display:grid;background:var(--tc-grid-bg);box-sizing:border-box;
  border:2px solid var(--tc-c);border-radius:max(4px,.7cqw);overflow:hidden}
.tc-h{box-sizing:border-box;min-width:0;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center;
  border-right:1px solid var(--tc-rule);border-bottom:1px solid var(--tc-rule);
  background:var(--tc-head-bg);font-weight:700;font-size:var(--tc-hfs);white-space:nowrap;color:var(--tc-ink);user-select:none}
.tc-h.tc-hlast{border-bottom:2px solid var(--tc-c)}
.tc-h.tc-hvol{background:var(--tc-vol-bg)}
.tc-h.tc-hagr{font-weight:600;font-style:italic;font-size:calc(var(--tc-hfs)*.9)}
.tc-h.tc-hblank{background:transparent}
.tc-h.tc-base{background:var(--tc-c);color:#fff}
.tc-h.tc-hend{border-right:0}
.tc-c{box-sizing:border-box;min-width:0;min-height:0;position:relative;overflow:hidden;outline:none;
  border-right:1px solid var(--tc-rule);border-bottom:1px solid var(--tc-rule);
  display:flex;align-items:center;justify-content:center;
  font-family:'MDI','Andika',cursive;font-size:var(--tc-fs);line-height:1;color:var(--tc-ink);cursor:text}
.tc-c.tc-bc{background:var(--tc-bc-bg)}
.tc-c.tc-in{border-right-style:dashed;border-right-color:color-mix(in srgb,var(--tc-rule) 65%,transparent)}
.tc-c.tc-spare{border-right-style:dashed;border-bottom-style:dashed;border-color:color-mix(in srgb,var(--tc-rule) 60%,transparent)}
.tc-c.tc-edgeL{border-right:2px solid var(--tc-c)}
.tc-c.tc-lastc{border-right:0}
.tc-c.tc-lastr{border-bottom:0}
.tc-c:focus{box-shadow:inset 0 0 0 2px var(--tc-c);background:color-mix(in srgb,var(--tc-c) 10%,transparent)}
.tc-d{pointer-events:none}
.tc-comma{position:absolute;right:-.08em;bottom:.02em;font-weight:700;font-size:1.05em;line-height:1;pointer-events:none;color:#c0392b}
.tc-ink{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2}
.tc-root.tc-drawing .tc-ink{pointer-events:auto}
.tc-root.tc-drawing .tc-c{cursor:inherit}
.tc-settings{position:absolute;inset:0;z-index:4;background:#fff;padding:2.6cqw 3.4cqw;overflow-y:auto;
  font-size:max(12px,1.9cqw);color:#222;user-select:auto}
.tc-set-title{font-weight:700;font-size:1.15em;margin-bottom:1.4cqw}
.tc-lbl{display:block;font-weight:600;margin:1.8cqw 0 .8cqw}
.tc-row3{display:flex;gap:2.4cqw;flex-wrap:wrap}
.tc-row3 .tc-lbl{flex:1;min-width:140px}
.tc-settings input[type=number]{display:block;width:100%;box-sizing:border-box;margin-top:.8cqw;
  padding:5px 6px;font:inherit;font-weight:400;border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.tc-pills{display:flex;flex-wrap:wrap;gap:6px}
.tc-pill{font:inherit;border:1px solid #ccc;background:#faf7f0;border-radius:99px;padding:5px 12px;cursor:pointer}
.tc-pill:hover{border-color:var(--tc-c);color:var(--tc-c)}
.tc-pill.is-on{background:var(--tc-c);border-color:var(--tc-c);color:#fff;font-weight:700}
.tc-opt{margin-top:1cqw}
.tc-chk{display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer}
.tc-sws{display:flex;flex-wrap:wrap;gap:8px}
.tc-sw{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #bbb;cursor:pointer;padding:0}
.tc-sw.is-on{box-shadow:0 0 0 2px #222}
.tc-clear{display:flex;flex-wrap:wrap;gap:6px}
.tc-clear button{font:inherit;border:1px solid #ccc;background:#faf7f0;border-radius:99px;padding:5px 12px;cursor:pointer}
.tc-clear button:hover{border-color:var(--tc-c);color:var(--tc-c)}
.tc-help{margin-top:2.4cqw;padding:8px 10px;border-left:4px solid var(--tc-c);background:color-mix(in srgb,var(--tc-c) 8%,#fff);
  border-radius:0 8px 8px 0;line-height:1.45;font-size:.95em}
.tc-done{margin-top:2.4cqw;width:100%;padding:7px;border:0;border-radius:4px;background:var(--tc-ink);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.tc-settings :focus-visible{outline:2px solid var(--tc-c);outline-offset:1px}
.tc-root.tc-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto}
.tc-root.tc-full.tc-bg-opaque{background:#fbf8f1}
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .tc-root.tc-full{left:40px;height:100vh;height:100dvh}
}
.widget.tc-is-full > .drag-handle,
.widget.tc-is-full > .widget-rotate-handle,
.widget.tc-is-full > .widget-action-bar,
.widget.tc-is-full > .widget-ctx-menu,
.widget.tc-is-full > .custom-resize-handle{display:none !important}
@media print{.tc-bar,.tc-settings{display:none}}
`;
        document.head.appendChild(st);
    }

    // « Effacer tout » de la barre Dessin efface aussi les dessins et couleurs du tableau affiché
    function hookClearCanvas() {
        const orig = window.clearCanvas;
        if (typeof orig !== 'function' || orig._tcWrapped) return;
        const wrapped = function () {
            const r = orig.apply(this, arguments);
            let changed = false;
            document.querySelectorAll('.tc-root').forEach(root => {
                const D = cur(getState(root));
                if (!D.s.length && !Object.keys(D.b).length && !Object.keys(D.cb).length) return;
                D.s = []; D.b = {}; D.cb = {};
                renderLight(root);
                changed = true;
            });
            if (changed) save();
            return r;
        };
        wrapped._tcWrapped = true;
        window.clearCanvas = wrapped;
    }

    function init() {
        hookClearCanvas();
        injectStyles();
        injectTemplate();
        document.querySelectorAll('.tc-root').forEach(r => { if (!r.querySelector('.tc-grid')) render(r); });
        mo.observe(document.body, { childList: true, subtree: true });
        setInterval(() => document.querySelectorAll('.tc-root').forEach(syncMode), 150);
        setInterval(() => document.querySelectorAll('.tc-root.tc-front').forEach(keepFront), 300);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => document.querySelectorAll('.tc-root').forEach(layout));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Sauvegarde / chargement (utilisés par save-load.js)
    window.tconvGetData = function (widget) {
        const root = widget && widget.querySelector('.tc-root');
        return root ? clone(getState(root)) : null;
    };
    window.tconvSetData = function (widget, data) {
        const root = widget && widget.querySelector('.tc-root');
        if (!root || !data) return;
        root._tc = normalize(data);
        render(root);
    };
})();
