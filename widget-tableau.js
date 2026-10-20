// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (même fonction partagée que widget-citations.js ; installée une seule fois)
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
   widget-tableau.js — Widget « Tableau »
   Le Bureau du Prof

   Un tableau à remplir en classe :
   - nombre de lignes et de colonnes réglable (barre du haut ou ⚙)
   - première ligne et/ou première colonne en en-tête coloré
   - remplissage AU STYLET OU À LA SOURIS avec la barre Dessin :
       crayon, crayon de couleur, surligneur, figures (segment, flèche,
       rectangle…), gomme, pot de peinture (colorie une case).
     Couleur, épaisseur, opacité et taille de gomme sont celles
     choisies dans la barre Dessin.
   - sans la barre Dessin : on clique dans une case pour taper au clavier
     (Tab = case suivante, Échap = terminer)
   - boutons fenêtre jaune (réduire), vert (plein écran), rouge (fermer)

   Les dessins sont enregistrés par rapport au tableau : ils suivent le
   widget quand on le déplace ou qu'on l'agrandit, et restent dans leurs
   cases quand on ajoute ou retire des lignes ou des colonnes.

   Utilisation : createWidget('tableau')
   Le template #template-tableau est injecté dans le DOM par ce fichier.
   Sauvegarde : window.tabGetData / window.tabSetData (save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const LIM = { rMin: 1, rMax: 30, cMin: 1, cMax: 15 };
    const COLORS = ['#2f6fb5', '#2e9e6a', '#d9822b', '#7b5cc4', '#d6456b', '#b8901a', '#5a5f6b'];
    const FONTS = [
        { v: "'MDI', cursive",              n: 'MDI école' },
        { v: "'Andika', sans-serif",        n: 'Andika' },
        { v: "'BelleAllureGS', cursive",    n: 'Belle Allure (cursive)' },
        { v: "'Quicksand', sans-serif",     n: 'Quicksand' },
        { v: "Arial, sans-serif",           n: 'Arial' },
        { v: "'OpenDyslexicLocal', sans-serif", n: 'OpenDyslexic' }
    ];
    const DEFAULT = {
        rows: 2, cols: 6,
        headRow: false, headCol: true,
        color: '#2f6fb5',
        font: "'MDI', cursive",
        fs: 1,               // facteur de taille du texte (0,5 à 2)
        cells: null,         // textes : tableau [ligne][colonne]
        bg: null,            // couleurs de fond des cases : tableau [ligne][colonne]
        strokes: []          // dessins : { t, c, w, o, p:[[x,y]…], seed, dot } — coordonnées 0..1 du tableau
    };
    // Figures de la barre Dessin qu'on peut tracer dans le tableau
    // (cœur, étoile et grosse flèche créent des widgets à part : non gérées ici)
    const FIG_MODES = ['segment', 'simple-arrow', 'carre', 'rectangle', 'cercle', 'ovale', 'parallelo', 'losange',
        'triangle', 'right-triangle', 'equilateral-triangle', 'scalene-triangle', 'pentagon', 'hexagon', 'octagon'];

    /* ── Outils ───────────────────────────────────────────────────── */
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v || a)));
    const r4 = v => Math.round(v * 10000) / 10000;
    const clone = o => JSON.parse(JSON.stringify(o));
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
    const snap = () => { if (typeof snapshotNow === 'function') snapshotNow(); };
    // Empêche le déplacement du widget quand on clique sur un contrôle
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

    function normalize(st) {
        st = Object.assign(clone(DEFAULT), st || {});
        st.rows = clampInt(st.rows, LIM.rMin, LIM.rMax);
        st.cols = clampInt(st.cols, LIM.cMin, LIM.cMax);
        st.fs = Math.max(0.5, Math.min(2, +st.fs || 1));
        const mk = (src) => {
            const a = [];
            for (let r = 0; r < st.rows; r++) {
                const row = [];
                for (let c = 0; c < st.cols; c++) row.push(src && src[r] && src[r][c] != null ? String(src[r][c]) : '');
                a.push(row);
            }
            return a;
        };
        st.cells = mk(st.cells);
        st.bg = mk(st.bg);
        if (!Array.isArray(st.strokes)) st.strokes = [];
        return st;
    }

    function getState(root) {
        if (!root._tab) {
            let init = {};
            try { init = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) {}
            root._tab = normalize(init);
        }
        return root._tab;
    }

    /* ── Barre Dessin : quel outil est actif ? ──────────────────────
       Renvoie null (tableau au clavier), 'draw', 'eraser' ou 'fill'. */
    function drawState() {
        const tb = document.getElementById('draw-toolbar');
        if (!tb || !tb.style.display || tb.style.display === 'none') return null;
        if (window.isTextPlacementMode) return null;
        if (window.isFillMode) return 'fill';
        if (window.isEraserMode) return 'eraser';
        // Annotation PDF : un clic sur le tableau ramène la barre en mode « Board »
        // (géré par draw.js) ; on garde le calque actif pour ne pas taper dans les cases
        if (window._pdfAnnotMode) return 'draw';
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

    function eraserRadius() {
        return parseInt((document.getElementById('eraser-size') || {}).value) || 15;
    }

    /* ── Rendu HTML ───────────────────────────────────────────────── */
    function buildBar(root, st) {
        const full = root.classList.contains('tab-full');
        const step = (kind, val, word) =>
            '<span class="tab-step" title="' + word + '">' +
                '<button type="button" class="tab-sbtn" data-tab-action="' + kind + '-" aria-label="Retirer une ' + word.slice(0, -1) + '">−</button>' +
                '<span class="tab-num">' + val + '<small> ' + (val > 1 ? word : word.slice(0, -1)) + '</small></span>' +
                '<button type="button" class="tab-sbtn" data-tab-action="' + kind + '+" aria-label="Ajouter une ' + word.slice(0, -1) + '">+</button>' +
            '</span>';
        return '<div class="tab-bar">' +
            '<button type="button" class="tab-gear" data-tab-action="toggle" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
            '<div class="tab-steps"' + STOP + '>' + step('row', st.rows, 'lignes') + step('col', st.cols, 'colonnes') + '</div>' +
            '<div class="wf-btns"' + STOP + '>' +
                '<button type="button" class="wf-btn wf-btn-min" data-tab-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                '<button type="button" class="wf-btn wf-btn-max" data-tab-action="wf-max" title="' + (full ? 'Quitter le plein écran' : 'Plein écran') + '" aria-label="Plein écran"></button>' +
                '<button type="button" class="wf-btn wf-btn-close" data-tab-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
            '</div>' +
        '</div>';
    }

    function buildGrid(st) {
        let cells = '';
        for (let r = 0; r < st.rows; r++) {
            for (let c = 0; c < st.cols; c++) {
                const head = (st.headRow && r === 0) || (st.headCol && c === 0);
                const bg = st.bg[r][c];
                cells += '<div class="tab-cell' + (head ? ' tab-head' : '') +
                    (c === st.cols - 1 ? ' tab-lastc' : '') + (r === st.rows - 1 ? ' tab-lastr' : '') +
                    '" data-r="' + r + '" data-c="' + c + '"' +
                    (bg ? ' style="background:' + esc(bg) + '"' : '') + '>' +
                    '<div class="tab-txt" contenteditable="true" spellcheck="false">' + esc(st.cells[r][c]) + '</div></div>';
            }
        }
        return '<div class="tab-area"' + STOP + '>' +
            '<div class="tab-grid" style="grid-template-columns:repeat(' + st.cols + ',minmax(0,1fr));grid-template-rows:repeat(' + st.rows + ',minmax(0,1fr));font-family:' + esc(st.font) + '">' +
            cells + '</div><canvas class="tab-ink"></canvas></div>';
    }

    function buildSettings(st) {
        const swatches = COLORS.map(col =>
            '<button type="button" class="tab-sw' + (col === st.color ? ' is-on' : '') + '" data-tab-color="' + col + '" style="background:' + col + '" title="' + col + '" aria-label="Couleur ' + col + '"></button>'
        ).join('');
        const fonts = FONTS.map(f => '<option value="' + esc(f.v) + '"' + (f.v === st.font ? ' selected' : '') + '>' + f.n + '</option>').join('');
        return '<div class="tab-settings"' + STOP + '>' +
            '<div class="tab-set-title">Réglages du tableau</div>' +
            '<div class="tab-row2">' +
              '<label class="tab-lbl">Lignes<input type="number" min="' + LIM.rMin + '" max="' + LIM.rMax + '" value="' + st.rows + '" data-tab-rows></label>' +
              '<label class="tab-lbl">Colonnes<input type="number" min="' + LIM.cMin + '" max="' + LIM.cMax + '" value="' + st.cols + '" data-tab-cols></label>' +
            '</div>' +
            '<label class="tab-chk"><input type="checkbox" data-tab-headrow' + (st.headRow ? ' checked' : '') + '> Première ligne en en-tête</label>' +
            '<label class="tab-chk"><input type="checkbox" data-tab-headcol' + (st.headCol ? ' checked' : '') + '> Première colonne en en-tête</label>' +
            '<div class="tab-lbl">Couleur du tableau</div><div class="tab-sws">' + swatches + '</div>' +
            '<label class="tab-lbl">Police du texte tapé<select data-tab-font>' + fonts + '</select></label>' +
            '<label class="tab-lbl">Taille du texte tapé <span class="tab-n">(' + Math.round(st.fs * 100) + ' %)</span>' +
              '<input type="range" min="50" max="200" step="10" value="' + Math.round(st.fs * 100) + '" data-tab-fs></label>' +
            '<div class="tab-lbl">Effacer</div>' +
            '<div class="tab-clear">' +
              '<button type="button" data-tab-action="clear-ink">🧽 Les dessins</button>' +
              '<button type="button" data-tab-action="clear-text">⌫ Le texte tapé</button>' +
              '<button type="button" data-tab-action="clear-bg">🎨 Les couleurs des cases</button>' +
            '</div>' +
            '<div class="tab-help">✏️ <b>Pour écrire ou dessiner</b> : ouvrez la barre Dessin, puis tracez directement dans les cases ' +
              '(crayon, crayon de couleur, surligneur, figures, gomme). Le pot de peinture colorie une case.<br>' +
              '⌨️ <b>Pour taper</b> : barre Dessin fermée (ou en mode sélection), cliquez dans une case. Tab passe à la case suivante.</div>' +
            '<button type="button" class="tab-done" data-tab-action="close">Terminé</button>' +
        '</div>';
    }

    function render(root) {
        const st = getState(root);
        const open = root.classList.contains('tab-open');
        root.style.setProperty('--tb-c', st.color);
        root.innerHTML = buildBar(root, st) + buildGrid(st) + (open ? buildSettings(st) : '');
        bindCanvas(root);
        watchSize(root);
        layout(root);
        syncMode(root);
    }

    // Reconstruit seulement la barre et la grille (garde le panneau de réglages ouvert)
    function renderLight(root) {
        const settings = root.querySelector('.tab-settings');
        const scroll = settings ? settings.scrollTop : 0;
        render(root);
        const s2 = root.querySelector('.tab-settings');
        if (s2) s2.scrollTop = scroll;
    }

    /* ── Texte trop long : on réduit la police de la case pour que tout
       tienne sur 2 lignes maximum (et dans la hauteur de la case).
       Un mot trop long pour la largeur fait aussi réduire la police ;
       en dernier recours (police minimale), il est coupé. ──────────── */
    const MIN_FS = 6, MAX_LINES = 2, LH = 1.2, PAD = 0.36; // PAD = marge haut + bas (em) pour les jambages
    function fitCell(txt) {
        txt.style.fontSize = '';
        txt.classList.remove('tab-brk');
        if (!txt.textContent.trim()) return;
        const cell = txt.parentElement;
        const cs = getComputedStyle(cell);
        const availH = cell.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
        const base = parseFloat(getComputedStyle(txt).fontSize) || 16;
        // Lignes tapées avec Entrée : on ne peut pas les regrouper, elles comptent dans le maximum.
        // On les compte en mesurant le texte SANS retour automatique à la ligne, ce qui inclut
        // la ligne vide créée par Entrée juste avant de taper dessus.
        txt.style.fontSize = base + 'px';
        txt.style.whiteSpace = 'pre';
        const typed = Math.max(1, Math.round((txt.scrollHeight - base * PAD) / (base * LH)));
        txt.style.whiteSpace = '';
        const maxLines = Math.max(MAX_LINES, typed);
        const fits = fs => {
            txt.style.fontSize = fs + 'px';
            return txt.scrollHeight <= Math.min(fs * (LH * maxLines + PAD), availH) + 1
                && txt.scrollWidth <= txt.clientWidth + 1;
        };
        if (fits(base)) { txt.style.fontSize = ''; return; }
        if (!fits(MIN_FS)) {
            txt.classList.add('tab-brk');          // mot trop long : on autorise la coupure
            if (!fits(MIN_FS)) return;             // vraiment trop de texte : police minimale
        }
        let lo = MIN_FS, hi = base;
        for (let i = 0; i < 9; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) lo = mid; else hi = mid;
        }
        txt.style.fontSize = Math.floor(lo * 10) / 10 + 'px';
    }
    function fitAll(root) {
        root.querySelectorAll('.tab-txt').forEach(fitCell);
    }

    /* ── Mise en page : canvas à la taille du tableau, taille du texte ── */
    function layout(root) {
        const area = root.querySelector('.tab-area'), cv = root.querySelector('.tab-ink');
        if (!area || !cv) return;
        const st = getState(root);
        const W = area.clientWidth, H = area.clientHeight;
        if (!W || !H) return;
        const dpr = window.devicePixelRatio || 1;
        const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
        const fs = Math.max(9, Math.min((H / st.rows) * 0.45, (W / st.cols) * 0.3)) * st.fs;
        root.style.setProperty('--tb-fs', fs.toFixed(1) + 'px');
        fitAll(root);
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

    /* ── Dessin des traits ────────────────────────────────────────── */
    function paintStroke(ctx, s, W, H) {
        if (!s.p || !s.p.length) return;
        const pts = s.p.map(a => ({ x: a[0] * W, y: a[1] * H }));
        const lw = Math.max(0.5, s.w * W);
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
                // même lissage que les traits du tableau (draw.js)
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
        const area = root.querySelector('.tab-area'), cv = root.querySelector('.tab-ink');
        if (!area || !cv || !cv.width) return;
        const st = getState(root);
        const W = area.clientWidth, H = area.clientHeight;
        if (!W || !H) return;
        const ctx = cv.getContext('2d');
        const dpr = cv.width / W;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        st.strokes.forEach(s => paintStroke(ctx, s, W, H));
        if (root._live) paintStroke(ctx, root._live, W, H);
        // Aperçu de la gomme
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

    /* ── Gomme : coupe les traits touchés (comme la gomme du tableau) ── */
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
        const st = getState(root);
        const area = root.querySelector('.tab-area');
        const W = area.clientWidth, H = area.clientHeight;
        const r = eraserRadius();
        let changed = false;
        const out = [];
        st.strokes.forEach(s => {
            const half = (s.w * W) / 2;
            const px = s.p.map(a => ({ x: a[0] * W, y: a[1] * H }));
            const m = r + half + 2;
            if (!px.some(p => Math.abs(p.x - pos.x) < m + 400 && Math.abs(p.y - pos.y) < m + 400)) { out.push(s); return; }
            const d = densify(px, 3);
            const hit = p => Math.hypot(p.x - pos.x, p.y - pos.y) <= r + half * 0.5;
            if (!d.some(hit)) { out.push(s); return; }
            changed = true;
            if (s.dot || d.length < 2) return; // point effacé
            let cur = [];
            const flush = () => {
                if (cur.length >= 2) out.push(Object.assign({}, s, { p: cur.map(q => [r4(q.x / W), r4(q.y / H)]) }));
                cur = [];
            };
            d.forEach(p => { if (hit(p)) flush(); else cur.push(p); });
            flush();
        });
        if (changed) st.strokes = out;
        return changed;
    }

    /* ── Pot de peinture : colorie la case cliquée ─────────────────── */
    function fillCell(root, clientX, clientY) {
        const st = getState(root);
        const area = root.querySelector('.tab-area');
        const rect = area.getBoundingClientRect();
        const c = Math.min(st.cols - 1, Math.max(0, Math.floor((clientX - rect.left) / rect.width * st.cols)));
        const r = Math.min(st.rows - 1, Math.max(0, Math.floor((clientY - rect.top) / rect.height * st.rows)));
        const color = typeof _fillCurrentColor === 'function' ? _fillCurrentColor() : curColor();
        snap();
        // recliquer avec la même couleur retire la couleur de la case
        st.bg[r][c] = st.bg[r][c] === color ? '' : color;
        const cell = root.querySelector('.tab-cell[data-r="' + r + '"][data-c="' + c + '"]');
        if (cell) cell.style.background = st.bg[r][c];
        save();
    }

    /* ── Événements du calque de dessin ────────────────────────────── */
    function localPos(root, e) {
        const area = root.querySelector('.tab-area');
        const rect = area.getBoundingClientRect();
        const W = area.clientWidth || rect.width, H = area.clientHeight || rect.height;
        return {
            x: (e.clientX - rect.left) * (W / (rect.width || 1)),
            y: (e.clientY - rect.top) * (H / (rect.height || 1)),
            W, H
        };
    }

    function bindCanvas(root) {
        const cv = root.querySelector('.tab-ink');
        if (!cv) return;

        // Les gestionnaires de la barre Dessin écoutent mousedown/touchstart sur le
        // tableau : on les bloque ici pour qu'ils ne tracent pas aussi sur le fond.
        const block = e => {
            if (!drawState()) return;
            if (e.type === 'mousedown' && e.button !== 0) return; // clic droit : bascule gomme (draw.js)
            e.stopPropagation();
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
        };
        cv.addEventListener('mousedown', block);
        cv.addEventListener('mousemove', e => { if (drawState()) e.stopPropagation(); });
        cv.addEventListener('touchstart', block, { passive: false });
        cv.addEventListener('touchmove', e => { if (drawState()) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }, { passive: false });

        cv.addEventListener('pointerdown', e => {
            const mode = drawState();
            if (!mode) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            if (document.activeElement && document.activeElement.closest && document.activeElement.closest('.tab-root')) document.activeElement.blur();
            if (mode === 'fill') { fillCell(root, e.clientX, e.clientY); return; }
            try { cv.setPointerCapture(e.pointerId); } catch (_) {}
            const pos = localPos(root, e);
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
                t: tool.t, c: tool.c, w: tool.w / pos.W, o: tool.o, fig: tool.fig,
                seed: Math.floor(Math.random() * 1e9),
                p: [[pos.x / pos.W, pos.y / pos.H]]
            };
            scheduleRedraw(root);
        });

        cv.addEventListener('pointermove', e => {
            const mode = drawState();
            if (!mode) return;
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
            if (live.t === 'fig') {
                const pos = localPos(root, e);
                const pts = _buildFigurePoints(live.fig, root._start, pos);
                if (pts) live.p = pts.map(p => [p.x / pos.W, p.y / pos.H]);
            } else {
                const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
                evs.forEach(ev => {
                    const pos = localPos(root, ev);
                    const last = live.p[live.p.length - 1];
                    if (Math.hypot(last[0] * pos.W - pos.x, last[1] * pos.H - pos.y) < 0.8) return;
                    live.p.push([pos.x / pos.W, pos.y / pos.H]);
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
            const area = root.querySelector('.tab-area');
            const W = area.clientWidth, H = area.clientHeight;
            if (live.t === 'fig') {
                if (live.p.length < 2) { redraw(root); return; } // simple clic : pas de figure
            } else {
                const o = live.p[0];
                if (live.p.every(p => Math.hypot((p[0] - o[0]) * W, (p[1] - o[1]) * H) <= 3)) {
                    live.dot = true;
                    live.p = [o];
                }
            }
            live.p = live.p.map(p => [r4(p[0]), r4(p[1])]);
            if (live.t !== 'fig') delete live.fig;
            getState(root).strokes.push(live);
            redraw(root);
            save();
        };
        cv.addEventListener('pointerup', e => { if (drawState()) e.stopPropagation(); end(e); });
        cv.addEventListener('pointercancel', end);
        cv.addEventListener('pointerleave', () => {
            if (root._eraserPos && !root._erasing) { root._eraserPos = null; scheduleRedraw(root); }
        });
    }

    // Active le calque de dessin quand la barre Dessin est utilisée,
    // sinon les cases redeviennent cliquables au clavier
    function syncMode(root) {
        const mode = drawState();
        const on = !!mode;
        if (root.classList.contains('tab-drawing') !== on) {
            root.classList.toggle('tab-drawing', on);
            if (on && document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
        }
        const cv = root.querySelector('.tab-ink');
        if (!cv) return;
        let cur = '';
        if (mode === 'eraser') cur = 'none';
        else if (mode === 'draw') {
            const b = document.getElementById('board');
            cur = (b && b.style.getPropertyValue('cursor')) || 'crosshair';
            if (cur === 'none') cur = 'crosshair';
        }
        if (cv.style.cursor !== cur) cv.style.cursor = cur;
        if (mode !== 'eraser' && root._eraserPos) { root._eraserPos = null; scheduleRedraw(root); }
    }

    /* ── Lignes / colonnes ────────────────────────────────────────── */
    // Les dessins restent dans leurs cases : on recale leurs coordonnées,
    // et on coupe ce qui dépasse quand on retire des lignes ou des colonnes.
    function setDims(root, rows, cols) {
        const st = getState(root);
        rows = clampInt(rows, LIM.rMin, LIM.rMax);
        cols = clampInt(cols, LIM.cMin, LIM.cMax);
        if (rows === st.rows && cols === st.cols) return;
        snap();
        const fx = st.cols / cols, fy = st.rows / rows;
        const inside = p => p.x <= 1.0001 && p.y <= 1.0001;
        const out = [];
        st.strokes.forEach(s => {
            const pts = s.p.map(a => ({ x: a[0] * fx, y: a[1] * fy }));
            const s2 = Object.assign({}, s, { w: s.w }); // l'épaisseur ne change pas (largeur du widget identique)
            if (pts.every(inside)) { s2.p = pts.map(q => [r4(q.x), r4(q.y)]); out.push(s2); return; }
            if (s.dot || pts.length < 2) return;
            let cur = [];
            const flush = () => { if (cur.length >= 2) out.push(Object.assign({}, s2, { p: cur.map(q => [r4(q.x), r4(q.y)]) })); cur = []; };
            densify(pts, 0.004).forEach(q => { if (inside(q)) cur.push(q); else flush(); });
            flush();
        });
        st.strokes = out;
        st.rows = rows;
        st.cols = cols;
        root._tab = normalize(st);
        renderLight(root);
        save();
    }

    /* ── Boutons fenêtre : réduire / plein écran / fermer ───────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('tab-full');
        root.classList.toggle('tab-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('tab-is-full', full);
        const b = root.querySelector('[data-tab-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    }

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('tab-full')) toggleFull(root, false);
        root.classList.remove('tab-open');
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden';
        window._wfMiniBarCollapse(widget, '▦ Tableau', {
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
            Promise.resolve(modalConfirm('Tableau', msg)).then(ok => { if (ok) fn(); });
        } else if (window.confirm(msg)) fn();
    }

    /* ── Événements (délégués : survivent à la sauvegarde/restauration) ── */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('[data-tab-action], [data-tab-color]');
        if (!btn) return;
        const root = btn.closest('.tab-root');
        if (!root) return;
        e.stopPropagation();
        const st = getState(root);
        if (btn.hasAttribute('data-tab-color')) {
            st.color = btn.getAttribute('data-tab-color');
            renderLight(root); save();
            return;
        }
        const act = btn.getAttribute('data-tab-action');
        if (act === 'wf-min')   { minimizeWidget(root); return; }
        if (act === 'wf-max')   { toggleFull(root); return; }
        if (act === 'wf-close') { closeWidget(root); return; }
        if (act === 'row+') { setDims(root, st.rows + 1, st.cols); return; }
        if (act === 'row-') { setDims(root, st.rows - 1, st.cols); return; }
        if (act === 'col+') { setDims(root, st.rows, st.cols + 1); return; }
        if (act === 'col-') { setDims(root, st.rows, st.cols - 1); return; }
        if (act === 'clear-ink') {
            if (!st.strokes.length) return;
            confirmThen('Effacer tous les dessins du tableau ?', () => { snap(); st.strokes = []; redraw(root); save(); });
            return;
        }
        if (act === 'clear-text') {
            confirmThen('Effacer tout le texte tapé dans les cases ?', () => {
                snap(); st.cells = st.cells.map(row => row.map(() => '')); renderLight(root); save();
            });
            return;
        }
        if (act === 'clear-bg') {
            snap(); st.bg = st.bg.map(row => row.map(() => '')); renderLight(root); save();
            return;
        }
        if (act === 'toggle') root.classList.toggle('tab-open');
        if (act === 'close') root.classList.remove('tab-open');
        render(root);
    }, true);

    document.addEventListener('change', function (e) {
        const t = e.target;
        const root = t.closest && t.closest('.tab-root');
        if (!root || !t.closest('.tab-settings')) return;
        const st = getState(root);
        if (t.hasAttribute('data-tab-rows')) { setDims(root, t.value, st.cols); return; }
        if (t.hasAttribute('data-tab-cols')) { setDims(root, st.rows, t.value); return; }
        if (t.hasAttribute('data-tab-headrow')) st.headRow = t.checked;
        else if (t.hasAttribute('data-tab-headcol')) st.headCol = t.checked;
        else if (t.hasAttribute('data-tab-font')) st.font = t.value;
        else if (t.hasAttribute('data-tab-fs')) st.fs = (+t.value || 100) / 100;
        else return;
        renderLight(root);
        save();
    });

    // Taille du texte : aperçu en direct pendant qu'on bouge le curseur
    document.addEventListener('input', function (e) {
        const t = e.target;
        if (t.hasAttribute && t.hasAttribute('data-tab-fs')) {
            const root = t.closest('.tab-root');
            if (!root) return;
            getState(root).fs = (+t.value || 100) / 100;
            const n = t.parentElement && t.parentElement.querySelector('.tab-n');
            if (n) n.textContent = '(' + t.value + ' %)';
            layout(root);
            return;
        }
        // Saisie dans une case
        const txt = t.closest && t.closest('.tab-txt');
        const cell = txt && txt.closest('.tab-cell');
        if (!cell) return;
        const root = cell.closest('.tab-root');
        if (!root) return;
        const st = getState(root);
        const r = +cell.dataset.r, c = +cell.dataset.c;
        if (!st.cells[r]) return;
        st.cells[r][c] = txt.innerText.replace(/\n$/, '');
        fitCell(txt);
        clearTimeout(root._saveT);
        root._saveT = setTimeout(save, 400);
    });

    function focusEnd(txt) {
        txt.focus();
        const range = document.createRange();
        range.selectNodeContents(txt);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
    }
    document.addEventListener('pointerup', function (e) {
        const cell = e.target.closest && e.target.closest('.tab-cell');
        if (!cell || e.target.closest('.tab-txt')) return;
        const root = cell.closest('.tab-root');
        if (!root || root.classList.contains('tab-drawing')) return;
        const txt = cell.querySelector('.tab-txt');
        if (txt) focusEnd(txt);
    });

    // Une étape d'annulation par case modifiée
    document.addEventListener('focusin', function (e) {
        if (e.target.closest && e.target.closest('.tab-txt')) snap();
    });
    document.addEventListener('focusout', function (e) {
        const cell = e.target.closest && e.target.closest('.tab-txt');
        if (!cell) return;
        const root = cell.closest('.tab-root');
        if (root) { clearTimeout(root._saveT); save(); }
    });

    // Coller : texte brut uniquement
    document.addEventListener('paste', function (e) {
        const cell = e.target.closest && e.target.closest('.tab-txt');
        if (!cell) return;
        e.preventDefault();
        const txt = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
        document.execCommand('insertText', false, txt);
    }, true);

    // Clavier : Tab / Maj+Tab pour changer de case, Échap pour terminer,
    // et pas de raccourcis du tableau (Suppr…) pendant la saisie
    document.addEventListener('keydown', function (e) {
        const t = e.target;
        if (!t.closest) return;
        const inCell = t.closest('.tab-txt');
        if (e.key === 'Escape' && !inCell) {
            document.querySelectorAll('.tab-root.tab-full').forEach(r => toggleFull(r, false));
            return;
        }
        if (!t.closest('.tab-root')) return;
        e.stopPropagation();
        if (!inCell) return;
        if (e.key === 'Escape') { e.preventDefault(); inCell.blur(); return; }
        if (e.key === 'Tab') {
            e.preventDefault();
            const cells = Array.from(inCell.closest('.tab-grid').querySelectorAll('.tab-txt'));
            const i = cells.indexOf(inCell) + (e.shiftKey ? -1 : 1);
            focusEnd(cells[(i + cells.length) % cells.length]);
        }
    }, true);

    /* ── Redimensionnement libre (poignée du board) ───────────────── */
    const MIN_W = 220, MIN_H = 150, MAX_W = 3000, MAX_H = 2000;

    function tabBox(widget) {
        const root = widget.querySelector('.tab-root');
        return root ? (root.closest('.editor-container') || root) : null;
    }

    function startResize(e, widget) {
        const box = tabBox(widget);
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
        if (!widget || !widget.querySelector('.tab-root')) return;
        if (widget.classList.contains('tab-is-full') || widget.querySelector('.wf-mini-bar')) return;
        if (e.type === 'pointerdown') { startResize(e, widget); return; }
        e.stopPropagation(); e.stopImmediatePropagation();
        if (e.cancelable) e.preventDefault();
    }
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t =>
        document.addEventListener(t, onResizeDown, { capture: true, passive: false }));

    /* ── Hydratation : nouveaux widgets et boards rechargés ──────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        const roots = node.matches('.tab-root') ? [node] : Array.from(node.querySelectorAll('.tab-root'));
        roots.forEach(r => {
            if (!r.querySelector('.tab-grid')) render(r);
            const w = r.closest('.widget');
            if (w && !w._tabAutoMax) {
                w._tabAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('tab-full'), null, true);
            }
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) m.addedNodes.forEach(n => {
            if (!(n instanceof Element)) return;
            if (n.closest('.tab-root') && !n.matches('.tab-root')) return; // nos propres mises à jour
            if (n.matches('.widget, .tab-root') || n.querySelector('.tab-root')) hydrate(n);
        });
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-tableau')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-tableau';
        tpl.innerHTML =
            '<div class="editor-container" style="width:680px;height:230px;">' +
                '<div class="tab-root" data-cfg="{}"></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('tab-styles')) return;
        const st = document.createElement('style');
        st.id = 'tab-styles';
        st.textContent = `
.tab-root{
  --tb-c:#2f6fb5; --tb-paper:#fbf8f1; --tb-ink:#26221d; --tb-soft:#6f675c; --tb-line:#e6dfd0; --tb-fs:20px;
  container-type:inline-size; position:relative; width:100%; height:100%;
  box-sizing:border-box; background:var(--tb-paper);
  display:flex; flex-direction:column; overflow:hidden;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:var(--tb-ink);
}
.tab-bar{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.5cqw;padding:1.4cqw 2.2cqw 0;user-select:none}
.tab-bar .wf-btns{justify-self:end}
.tab-gear{justify-self:start;border:0;background:none;color:#b3aa9b;font-size:max(14px,3.4cqw);line-height:1;cursor:pointer;padding:.8cqw;border-radius:5px}
.tab-gear:hover,.tab-gear:focus-visible{color:var(--tb-ink);outline:1px solid var(--tb-line)}
.tab-steps{display:flex;align-items:center;gap:2cqw}
.tab-step{display:inline-flex;align-items:center;gap:.4em;font-size:max(11px,2.5cqw);color:var(--tb-soft);white-space:nowrap}
.tab-num{font-weight:700;color:var(--tb-ink);min-width:1.2em;text-align:center}
.tab-num small{font-weight:400;color:var(--tb-soft);font-size:.9em}
.tab-sbtn{width:1.7em;height:1.7em;border:1px solid var(--tb-line);background:#fff;color:var(--tb-ink);border-radius:50%;
  cursor:pointer;font:inherit;font-weight:700;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center}
.tab-sbtn:hover{border-color:var(--tb-c);color:var(--tb-c)}
.tab-bar :focus-visible{outline:2px solid var(--tb-c);outline-offset:1px}
.tab-area{flex:1;min-height:0;position:relative;margin:1.4cqw 2.2cqw 2.2cqw}
.tab-grid{position:absolute;inset:0;display:grid;background:#fff;box-sizing:border-box;
  border:2px solid var(--tb-c);border-radius:max(4px,.8cqw);overflow:hidden}
.tab-cell{box-sizing:border-box;min-width:0;min-height:0;overflow:hidden;padding:0 .3em;
  border-right:1px solid color-mix(in srgb,var(--tb-c) 45%,#ccc);border-bottom:1px solid color-mix(in srgb,var(--tb-c) 45%,#ccc);
  display:flex;flex-direction:column;justify-content:center;align-items:stretch;
  font-size:var(--tb-fs);cursor:text;color:var(--tb-ink)}
.tab-txt{display:block;width:100%;overflow:visible;box-sizing:border-box;padding:.18em .1em;
  text-align:center;white-space:pre-wrap;word-break:normal;overflow-wrap:normal;line-height:1.2;outline:none;cursor:text;
  min-height:1.2em}
.tab-txt.tab-brk{overflow-wrap:anywhere}
.tab-cell.tab-lastc{border-right:0}
.tab-cell.tab-lastr{border-bottom:0}
.tab-cell.tab-head{font-weight:700;background:color-mix(in srgb,var(--tb-c) 16%,#fff)}
.tab-cell:focus-within{box-shadow:inset 0 0 0 2px var(--tb-c)}
.tab-ink{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:2;border-radius:max(4px,.8cqw)}
.tab-root.tab-drawing .tab-ink{pointer-events:auto}
.tab-root.tab-drawing .tab-cell,.tab-root.tab-drawing .tab-txt{cursor:inherit}
.tab-settings{position:absolute;inset:0;z-index:4;background:#fff;padding:3cqw 4cqw;overflow-y:auto;
  font-size:max(12px,2.6cqw);color:#222;user-select:auto}
.tab-set-title{font-weight:700;font-size:1.15em;margin-bottom:2cqw}
.tab-lbl{display:block;font-weight:600;margin:2.2cqw 0 1cqw}
.tab-n{font-weight:400;color:#888;font-size:.92em}
.tab-row2{display:flex;gap:3cqw}
.tab-row2 .tab-lbl{flex:1;margin-top:0}
.tab-settings input[type=number],.tab-settings select{display:block;width:100%;box-sizing:border-box;margin-top:1cqw;
  padding:5px 6px;font:inherit;font-weight:400;border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.tab-settings input[type=range]{display:block;width:100%;margin-top:1cqw;accent-color:var(--tb-c)}
.tab-chk{display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer}
.tab-sws{display:flex;flex-wrap:wrap;gap:8px}
.tab-sw{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #bbb;cursor:pointer;padding:0}
.tab-sw.is-on{box-shadow:0 0 0 2px #222}
.tab-clear{display:flex;flex-wrap:wrap;gap:6px}
.tab-clear button{font:inherit;border:1px solid #ccc;background:#faf7f0;border-radius:99px;padding:5px 12px;cursor:pointer}
.tab-clear button:hover{border-color:var(--tb-c);color:var(--tb-c)}
.tab-help{margin-top:3cqw;padding:8px 10px;border-left:4px solid var(--tb-c);background:color-mix(in srgb,var(--tb-c) 8%,#fff);
  border-radius:0 8px 8px 0;line-height:1.45;font-size:.95em}
.tab-done{margin-top:3cqw;width:100%;padding:7px;border:0;border-radius:4px;background:var(--tb-ink);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.tab-settings :focus-visible{outline:2px solid var(--tb-c);outline-offset:1px}
.tab-root.tab-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto}
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .tab-root.tab-full{left:40px;height:100vh;height:100dvh}
}
.widget.tab-is-full > .drag-handle,
.widget.tab-is-full > .widget-rotate-handle,
.widget.tab-is-full > .widget-action-bar,
.widget.tab-is-full > .widget-ctx-menu,
.widget.tab-is-full > .custom-resize-handle{display:none !important}
@media print{.tab-bar,.tab-settings{display:none}}
`;
        document.head.appendChild(st);
    }

    // Le bouton poubelle « Effacer tout » de la barre Dessin (clearCanvas, draw.js)
    // efface aussi les dessins et les cases coloriées de tous les tableaux.
    // clearCanvas enregistre d'abord l'état pour « Annuler » : on efface après.
    function hookClearCanvas() {
        const orig = window.clearCanvas;
        if (typeof orig !== 'function' || orig._tabWrapped) return;
        const wrapped = function () {
            const r = orig.apply(this, arguments);
            let changed = false;
            document.querySelectorAll('.tab-root').forEach(root => {
                const st = getState(root);
                const hasBg = st.bg.some(row => row.some(Boolean));
                if (!st.strokes.length && !hasBg) return;
                st.strokes = [];
                st.bg = st.bg.map(row => row.map(() => ''));
                root.querySelectorAll('.tab-cell').forEach(c => { c.style.background = ''; });
                redraw(root);
                changed = true;
            });
            if (changed) save();
            return r;
        };
        wrapped._tabWrapped = true;
        window.clearCanvas = wrapped;
    }

    function init() {
        hookClearCanvas();
        injectStyles();
        injectTemplate();
        document.querySelectorAll('.tab-root').forEach(r => { if (!r.querySelector('.tab-grid')) render(r); });
        mo.observe(document.body, { childList: true, subtree: true });
        // Suit l'outil actif de la barre Dessin
        setInterval(() => document.querySelectorAll('.tab-root').forEach(syncMode), 150);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => document.querySelectorAll('.tab-root').forEach(layout));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Sauvegarde / chargement (utilisés par save-load.js)
    window.tabGetData = function (widget) {
        const root = widget && widget.querySelector('.tab-root');
        return root ? clone(getState(root)) : null;
    };
    window.tabSetData = function (widget, data) {
        const root = widget && widget.querySelector('.tab-root');
        if (!root || !data) return;
        root._tab = normalize(data);
        render(root);
    };
})();
