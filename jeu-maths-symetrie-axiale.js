// =========================================================================
// WIDGET JEU : SYMÉTRIE AXIALE — compléter une figure par symétrie
// -------------------------------------------------------------------------
// Panneau « Jeux » › rubrique « Jeux de maths » (construit sur le modèle de
// jeu-divers-repro-quadrillage.js : mêmes boutons fenêtre, même sauvegarde,
// même plein écran sur téléphone, mêmes outils).
//
// • Une grille avec un axe de symétrie rouge : une partie de la figure est
//   donnée, l'élève colorie / trace le reste pour que la figure soit
//   symétrique par rapport à l'axe (ou aux deux axes).
// • 3 types : « Cases » (colorier des carreaux), « Traits » (tracer des
//   segments d'un nœud à l'autre), « Les deux ».
// • Axes : vertical, horizontal, diagonale ↘, diagonale ↗, 2 axes « + »
//   (vertical + horizontal), 2 axes « × » (les deux diagonales), ou au
//   hasard selon le niveau.
// • 4 niveaux : Débutant (6×6, axe vertical), Facile (8×8, vertical ou
//   horizontal), Moyen (8×8, + diagonales, traits à 45°), Difficile (10×10,
//   1 ou 2 axes, traits obliques).
// • Modèles : au hasard, un dessin de la bibliothèque (axe vertical), ou
//   « Mon modèle » (l'enseignant dessine la partie donnée).
// • Options : repères (A, B, C… / 1, 2, 3…), aide (la case symétrique
//   s'allume), zone à compléter colorée.
// • Vérifier (les erreurs sont marquées), calque (voir la solution en
//   transparence), annuler (Ctrl+Z), effacer ; la victoire n'est annoncée
//   qu'au clic sur « Vérifier » (la vérification réussie ne coûte pas
//   d'étoile) ; étoiles et records.
// • Sauvegarde du tableau via _jsaGetData / createJeuSymetrieAxialeWidget(data)
//   (même mécanisme que le Taquin, cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-symetrie-axiale';
    var STORE_KEY = 'jsa-progress-v1';
    var DEF_W = 860, DEF_H = 600, MIN_W = 360, MIN_H = 420;

    // ── Couleurs (lettre → nom, teinte) ─────────────────────────────────
    var COLORS = [
        { k: 'R', name: 'Rouge',  hex: '#ef4444' },
        { k: 'O', name: 'Orange', hex: '#f97316' },
        { k: 'J', name: 'Jaune',  hex: '#facc15' },
        { k: 'V', name: 'Vert',   hex: '#22c55e' },
        { k: 'B', name: 'Bleu',   hex: '#3b82f6' },
        { k: 'U', name: 'Violet', hex: '#8b5cf6' },
        { k: 'S', name: 'Rose',   hex: '#f472b6' },
        { k: 'M', name: 'Marron', hex: '#92400e' },
        { k: 'K', name: 'Noir',   hex: '#1f2937' }
    ];
    var COL = {};
    COLORS.forEach(function (c) { COL[c.k] = c; });

    // cells / segs = taille de la partie DONNÉE (l'élève fait le reste)
    var LEVELS = [
        { id: 'deb', name: 'Débutant',  ico: '🐣', n: 6,  colors: 2, cells: 5,  segs: 3, cat: 0, extra: 0, axes: ['V'],                          cls: 'g1', desc: '6×6 · axe vertical' },
        { id: 'fac', name: 'Facile',    ico: '😊', n: 8,  colors: 3, cells: 8,  segs: 5, cat: 0, extra: 1, axes: ['V', 'H'],                     cls: 'g2', desc: '8×8 · vertical ou horizontal' },
        { id: 'moy', name: 'Moyen',     ico: '😐', n: 8,  colors: 3, cells: 9,  segs: 6, cat: 1, extra: 2, axes: ['V', 'H', 'D1', 'D2'],         cls: 'g3', desc: '8×8 · + diagonales' },
        { id: 'dif', name: 'Difficile', ico: '😤', n: 10, colors: 4, cells: 10, segs: 8, cat: 2, extra: 3, axes: ['V', 'H', 'D1', 'D2', 'VH', 'DD'], cls: 'g4', desc: '10×10 · 1 ou 2 axes' }
    ];
    var KINDS = [
        { id: 'cases',  name: 'Cases',    ico: '🟥', desc: 'colorier les carreaux' },
        { id: 'traits', name: 'Traits',   ico: '✏️', desc: 'tracer des segments' },
        { id: 'mixte',  name: 'Les deux', ico: '🎨', desc: 'cases + traits' }
    ];
    var AXES = [
        { id: 'auto', name: 'Selon le niveau', ico: '🎲', desc: 'au hasard' },
        { id: 'V',    name: 'Vertical',        ico: '│',  desc: '1 axe',  gens: ['V'] },
        { id: 'H',    name: 'Horizontal',      ico: '―',  desc: '1 axe',  gens: ['H'] },
        { id: 'D1',   name: 'Diagonale ↘',     ico: '╲',  desc: '1 axe',  gens: ['D1'] },
        { id: 'D2',   name: 'Diagonale ↗',     ico: '╱',  desc: '1 axe',  gens: ['D2'] },
        { id: 'VH',   name: '2 axes +',        ico: '┼',  desc: 'vertical + horizontal', gens: ['V', 'H'] },
        { id: 'DD',   name: '2 axes ×',        ico: '╳',  desc: 'les 2 diagonales',      gens: ['D1', 'D2'] }
    ];
    var SOURCES = [
        { id: 'hasard', name: 'Au hasard',  ico: '🎲', desc: 'une nouvelle figure' },
        { id: 'dessin', name: 'Un dessin',  ico: '🖼️', desc: 'cœur, fusée, chat…' },
        { id: 'perso',  name: 'Mon modèle', ico: '✍️', desc: 'je le dessine' }
    ];

    // ── Bibliothèque : MOITIÉS GAUCHES de dessins symétriques (axe à droite) ──
    var HALF_PIX = [
        { name: 'Cœur',        rows: ['.RR', 'RRR', 'RRR', '.RR', '..R'] },
        { name: 'Champignon',  rows: ['.RR', 'RJR', 'RRR', '..M', '.MM'] },
        { name: 'Sapin',       rows: ['..J', '..V', '.VV', 'VVV', '..M', '..M'] },
        { name: 'Maison',      rows: ['...R', '..RR', '.RRR', 'RRRR', '.JBJ', '.JJM', '.JJM'] },
        { name: 'Fusée',       rows: ['...R', '..RR', '..BB', '..BJ', '..BB', '.RBB', 'RR.O', '...O'] },
        { name: 'Smiley',      rows: ['..JJ', '.JJJ', 'JJKJ', 'JJJJ', 'JKJJ', 'JJKK', '.JJJ', '..JJ'] },
        { name: 'Chat',        rows: ['O...', 'OO..', 'OOOO', 'OKOO', 'OOOS', 'OOOK', '.OOO', '..OO'] },
        { name: 'Robot',       rows: ['....R', '....K', '.BBBB', '.BJJB', '.BJKB', '.BBBB', '.BBRR', '.BBBB', '..KK.', '..KK.'] },
        { name: 'Papillon',    rows: ['..K..', '...K.', 'SS..K', 'SUS.K', 'SUUSK', '.SUSK', '..SSK', '.SJSK', '.SSSK'] },
        { name: 'Arc-en-ciel', rows: ['...RR', '.RROO', '.ROJJ', 'ROJJV', 'ROJV.', 'ROJV.'] }
    ];
    // ── Bibliothèque : moitiés gauches de figures en traits (axe en x = hw) ──
    var HALF_FIG = [
        { name: 'Cœur',    hw: 2, h: 4, lines: [['R', [2, 1], [1, 0], [0, 1], [0, 2], [2, 4]]] },
        { name: 'Maison',  hw: 2, h: 5, lines: [['M', [2, 5], [0, 5], [0, 2], [2, 2]], ['R', [0, 2], [2, 0]], ['B', [2, 5], [1, 5], [1, 3], [2, 3]]] },
        { name: 'Flèche',  hw: 2, h: 5, lines: [['V', [2, 0], [0, 2], [1, 2], [1, 5], [2, 5]]] },
        { name: 'Sapin',   hw: 3, h: 6, lines: [['V', [3, 0], [1, 2], [2, 2], [0, 4], [3, 4]], ['M', [2, 4], [2, 6], [3, 6]]] },
        { name: 'Fusée',   hw: 2, h: 7, lines: [['R', [1, 2], [2, 0]], ['B', [2, 2], [1, 2], [1, 6], [2, 6]], ['V', [1, 4], [0, 6], [1, 6]], ['O', [1, 6], [2, 7]]] },
        { name: 'Château', hw: 3, h: 5, lines: [['K', [3, 5], [0, 5], [0, 1], [1, 1], [1, 2], [2, 2], [2, 1], [3, 1]], ['R', [2, 5], [2, 3], [3, 3]]] },
        { name: 'Étoile',  hw: 4, h: 8, lines: [['J', [4, 0], [3, 3], [0, 3], [2, 5], [1, 8], [4, 6]]] },
        { name: 'Robot',   hw: 3, h: 6, lines: [['B', [3, 1], [0, 1], [0, 4], [3, 4]], ['R', [3, 2], [1, 2], [1, 3], [3, 3]], ['K', [3, 1], [3, 0], [2, 0]], ['K', [1, 4], [1, 6]]] }
    ];

    // ── Progression (étoiles, records, son) ─────────────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, sound: p.sound !== false, wins: p.wins || 0 };
        } catch (e) { return { stars: {}, best: {}, sound: true, wins: 0 }; }
    }
    function saveProgress(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {} }

    // ── Outils géométriques ─────────────────────────────────────────────
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
    function rnd(n) { return Math.floor(Math.random() * n); }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function emptyModel() { return { cells: {}, segs: [] }; }
    function cloneModel(m) { return { cells: Object.assign({}, m.cells || {}), segs: (m.segs || []).map(function (s) { return { a: s.a.slice(), b: s.b.slice(), c: s.c }; }) }; }
    function isEmpty(m) { return !Object.keys(m.cells).length && !m.segs.length; }

    // Un trait est découpé en « morceaux » élémentaires (d'un nœud au suivant)
    function pieceKey(x1, y1, x2, y2) {
        if (x1 > x2 || (x1 === x2 && y1 > y2)) { var t = x1; x1 = x2; x2 = t; t = y1; y1 = y2; y2 = t; }
        return x1 + ',' + y1 + ',' + x2 + ',' + y2;
    }
    function pieces(segs) {
        var out = {};
        segs.forEach(function (s) {
            var dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], g = gcd(dx, dy);
            if (!g) return;
            var sx = dx / g, sy = dy / g;
            for (var i = 0; i < g; i++) {
                var x = s.a[0] + sx * i, y = s.a[1] + sy * i;
                out[pieceKey(x, y, x + sx, y + sy)] = s.c;
            }
        });
        return out;
    }

    // ── Symétries (sur les nœuds de la grille, coordonnées x = colonne, y = ligne) ──
    function reflectNode(g, x, y, n) {
        switch (g) {
            case 'V':  return [n - x, y];
            case 'H':  return [x, n - y];
            case 'D1': return [y, x];             // diagonale ↘ (haut-gauche → bas-droite)
            case 'D2': return [n - y, n - x];     // diagonale ↗ (bas-gauche → haut-droite)
        }
        return [x, y];
    }
    function axisGens(axisId) { var A = byId(AXES, axisId, AXES[1]); return A.gens || ['V']; }
    // Toutes les transformations engendrées par les axes (identité comprise)
    function transforms(axisId, n) {
        var gens = axisGens(axisId);
        var keyOf = function (f) { var p = f(1, 2), q = f(5, 11); return p.join(',') + ',' + q.join(','); };
        var id = function (x, y) { return [x, y]; };
        var seen = {}, list = [id], queue = [id];
        seen[keyOf(id)] = 1;
        while (queue.length) {
            var f = queue.shift();
            gens.forEach(function (g) {
                var h = (function (f0) { return function (x, y) { var p = f0(x, y); return reflectNode(g, p[0], p[1], n); }; })(f);
                var k = keyOf(h);
                if (!seen[k]) { seen[k] = 1; list.push(h); queue.push(h); }
            });
        }
        return list;
    }
    function mapCell(f, r, c) { var p = f(c + 0.5, r + 0.5); return [Math.round(p[1] - 0.5), Math.round(p[0] - 0.5)]; }
    // Figure complète = la partie donnée + toutes ses images
    function orbitModel(m, axisId, n) {
        var T = transforms(axisId, n), out = emptyModel();
        Object.keys(m.cells).forEach(function (k) {
            var p = k.split(',').map(Number);
            T.forEach(function (f) { var q = mapCell(f, p[0], p[1]); out.cells[q[0] + ',' + q[1]] = m.cells[k]; });
        });
        Object.keys(m.cells).forEach(function (k) { out.cells[k] = m.cells[k]; });   // la partie donnée garde ses couleurs
        m.segs.forEach(function (s) {
            T.forEach(function (f) { out.segs.push({ a: f(s.a[0], s.a[1]), b: f(s.b[0], s.b[1]), c: s.c }); });
        });
        return out;
    }
    // Zone de départ (moitié / quart / triangle où l'on pose la partie donnée)
    function inSrcCell(axisId, n, r, c) {
        return axisGens(axisId).every(function (g) {
            if (g === 'V') return c < n / 2;
            if (g === 'H') return r < n / 2;
            if (g === 'D1') return r >= c;
            if (g === 'D2') return r + c <= n - 1;
            return true;
        });
    }
    function inSrcNode(axisId, n, x, y) {
        return axisGens(axisId).every(function (g) {
            if (g === 'V') return x <= n / 2;
            if (g === 'H') return y <= n / 2;
            if (g === 'D1') return y >= x;
            if (g === 'D2') return x + y <= n;
            return true;
        });
    }
    function colorsOf(m) {
        var set = {};
        Object.keys(m.cells).forEach(function (k) { set[m.cells[k]] = 1; });
        m.segs.forEach(function (s) { set[s.c] = 1; });
        return COLORS.map(function (c) { return c.k; }).filter(function (k) { return set[k]; });
    }

    // Comparaison : ce que l'élève a fait / ce qu'il reste à faire (figure − partie donnée)
    function compare(target, given, player) {
        var r = { okCells: 0, badCells: {}, missCells: 0, okSegs: 0, badSegs: {}, missSegs: 0, total: 0 };
        Object.keys(target.cells).forEach(function (k) {
            if (given.cells[k]) return;
            r.total++;
            if (player.cells[k] === target.cells[k]) r.okCells++;
            else if (!player.cells[k]) r.missCells++;
        });
        Object.keys(player.cells).forEach(function (k) { if (player.cells[k] !== target.cells[k] || given.cells[k]) r.badCells[k] = 1; });
        var tp = pieces(target.segs), gp = pieces(given.segs), pp = pieces(player.segs);
        Object.keys(tp).forEach(function (k) {
            if (gp[k] === tp[k]) return;
            r.total++;
            if (pp[k] === tp[k]) r.okSegs++;
            else if (!pp[k]) r.missSegs++;
        });
        Object.keys(pp).forEach(function (k) {
            if (gp[k] && gp[k] === pp[k]) return;            // trait du modèle repassé : sans effet
            if (pp[k] !== tp[k]) r.badSegs[k] = 1;
        });
        r.nBad = Object.keys(r.badCells).length + Object.keys(r.badSegs).length;
        r.nMiss = r.missCells + r.missSegs;
        r.done = !r.nBad && !r.nMiss;
        return r;
    }

    // ── Fabrication des figures ─────────────────────────────────────────
    function pickColors(k) { return shuffle(COLORS.map(function (c) { return c.k; })).slice(0, k); }

    function randCells(n, k, total, axisId) {
        var cols = pickColors(k), cells = {};
        var per = Math.max(1, Math.round(total / k));
        var ok = function (r, c) { return r >= 0 && c >= 0 && r < n && c < n && inSrcCell(axisId, n, r, c); };
        cols.forEach(function (c) {
            var patch = [], tries = 0;
            while (!patch.length && tries++ < 300) {
                var r0 = rnd(n), c0 = rnd(n);
                if (ok(r0, c0) && !cells[r0 + ',' + c0]) { cells[r0 + ',' + c0] = c; patch.push([r0, c0]); }
            }
            tries = 0;
            while (patch.length && patch.length < per && tries++ < 600) {
                var p = patch[rnd(patch.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
                var r = p[0] + d[0], cc = p[1] + d[1];
                if (!ok(r, cc) || cells[r + ',' + cc]) continue;
                cells[r + ',' + cc] = c; patch.push([r, cc]);
            }
        });
        return cells;
    }

    function stepSet(cat, n) {
        var base = [], maxL = n <= 6 ? 2 : 3;
        for (var l = 1; l <= maxL; l++) base.push([l, 0], [0, l]);
        if (cat >= 1) { base.push([1, 1], [2, 2], [1, 1]); }
        if (cat >= 2) { base.push([2, 1], [1, 2], [2, 1], [1, 2]); }
        var out = [];
        base.forEach(function (v) { [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) { out.push([v[0] * s[0], v[1] * s[1]]); }); });
        return out;
    }
    function randSegs(n, k, total, cat, axisId) {
        var cols = pickColors(k), segs = [], used = {}, steps = stepSet(cat, n);
        var per = Math.max(2, Math.round(total / k));
        var okN = function (p) { return p[0] >= 0 && p[1] >= 0 && p[0] <= n && p[1] <= n && inSrcNode(axisId, n, p[0], p[1]); };
        cols.forEach(function (c) {
            var cur = null, prev = null;
            for (var t = 0; t < 60 && !cur; t++) {
                var p = [rnd(n + 1), rnd(n + 1)];
                if (okN(p)) cur = p;
            }
            if (!cur) return;
            for (var j = 0; j < per; j++) {
                for (var tries = 0; tries < 50; tries++) {
                    var v = steps[rnd(steps.length)];
                    if (prev && v[0] * prev[0] + v[1] * prev[1] < 0 && v[0] * prev[1] === v[1] * prev[0]) continue;   // demi-tour
                    var b = [cur[0] + v[0], cur[1] + v[1]];
                    if (!okN(b)) continue;
                    var seg = { a: cur.slice(), b: b, c: c }, pc = pieces([seg]), clash = false;
                    Object.keys(pc).forEach(function (key) { if (used[key]) clash = true; });
                    if (clash) continue;
                    Object.keys(pc).forEach(function (key) { used[key] = c; });
                    segs.push(seg); prev = v; cur = b;
                    break;
                }
            }
        });
        return segs;
    }

    // Dessin de la bibliothèque : moitié gauche posée contre l'axe vertical,
    // puis éventuellement transposée pour un axe horizontal.
    function fitHalfPix(P, n, axisId) {
        var h = P.rows.length, hw = P.rows[0].length, cells = {};
        var oR = Math.floor((n - h) / 2), oC = n / 2 - hw;
        P.rows.forEach(function (row, r) {
            for (var c = 0; c < row.length; c++) if (COL[row[c]]) {
                var rr = r + oR, cc = c + oC;
                if (axisId === 'H') cells[cc + ',' + rr] = row[c]; else cells[rr + ',' + cc] = row[c];
            }
        });
        return cells;
    }
    function fitHalfFig(F, n, axisId) {
        var oX = n / 2 - F.hw, oY = Math.floor((n - F.h) / 2), segs = [];
        var P = function (q) { var x = q[0] + oX, y = q[1] + oY; return axisId === 'H' ? [y, x] : [x, y]; };
        F.lines.forEach(function (L) {
            for (var i = 2; i < L.length; i++) segs.push({ a: P(L[i - 1]), b: P(L[i]), c: L[0] });
        });
        return segs;
    }
    function pixColors(P) { var s = {}; P.rows.join('').split('').forEach(function (ch) { if (COL[ch]) s[ch] = 1; }); return Object.keys(s).length; }
    function figCat(F) {
        var m = 0;
        F.lines.forEach(function (L) {
            for (var i = 2; i < L.length; i++) {
                var dx = L[i][0] - L[i - 1][0], dy = L[i][1] - L[i - 1][1];
                if (dx && dy) m = Math.max(m, Math.abs(dx) === Math.abs(dy) ? 1 : 2);
            }
        });
        return m;
    }

    // ── Sons (WebAudio, très discrets) ──────────────────────────────────
    var _actx = null;
    function beep(freq, dur, type, vol, delay) {
        try {
            _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
            if (_actx.state === 'suspended') _actx.resume();
            var t = _actx.currentTime + (delay || 0);
            var o = _actx.createOscillator(), gn = _actx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
            gn.gain.setValueAtTime(0.0001, t);
            gn.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(gn); gn.connect(_actx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        } catch (e) {}
    }

    // ── Boutons fenêtre (CSS partagé avec les autres widgets) ───────────
    function injectWfButtons() {
        if (document.getElementById('wf-btns-style')) return;
        var ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = [
            '.wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }',
            '.wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;',
            '    display:flex; align-items:center; justify-content:center; font-size:0;',
            '    transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }',
            '.wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }',
            '.wf-btn:active { transform:scale(0.92); }',
            '.wf-btn-min   { background:#febc2e; }',
            '.wf-btn-max   { background:#28c840; }',
            '.wf-btn-close { background:#ff5f57; }',
            '.wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }',
            ".wf-btns:hover .wf-btn-min::after   { content:'−'; }",
            ".wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }",
            ".wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }"
        ].join('\n');
        document.head.appendChild(ws);
    }

    // ── Mini-barre « réduire » (partagée : même code que les autres jeux) ──
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function (widget, label, opts) {
            var COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            var onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            var others = Array.prototype.filter.call(document.querySelectorAll('.widget'), function (w) { return w !== widget && w.querySelector('.wf-mini-bar'); });
            var occupiedX = others.reduce(function (maxX, w) { return Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP); }, MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e'; widget.style.borderRadius = '8px';
            widget.style.border = 'none'; widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
            var wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(function (el) { el.style.display = 'none'; });
            var miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
            var labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            var expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
            expandBtn.addEventListener('click', function (e) {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || ''; widget.style.height = widget.dataset.wfMiniSavedH || '';
                ['zIndex', 'background', 'borderRadius', 'border', 'display', 'overflow', 'padding'].forEach(function (p) { widget.style[p] = ''; });
                var wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(function (el) { el.style.display = ''; });
                miniBar.remove();
                var curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent = (widget.offsetTop / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', function (e) {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                var startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                var onMove = function (ev) { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                var onUp = function () {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    var curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent = (widget.offsetTop / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            var curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent = (widget.offsetTop / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // ── CSS (injecté une seule fois) ────────────────────────────────────
    function injectCSS() {
        if (document.getElementById('jsa-style')) return;
        var s = document.createElement('style');
        s.id = 'jsa-style';
        s.textContent = [
'.jsa-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#9b6bff 0%,#6d3fd6 45%,#3b1a86 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jsa-root *{box-sizing:border-box}',
'.jsa-root{cursor:move}.jsa-root .jsa-ov,.jsa-root .jsa-frame{cursor:default}',
'.jsa-root.jsa-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jsa-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête
'.jsa-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0))}',
'.jsa-title{font-weight:900;font-size:calc(21px*var(--ui));letter-spacing:.4px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jsa-title b{color:#ffd23f}',
'.jsa-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;min-width:0;overflow:hidden;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);font-family:inherit}',
'.jsa-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jsa-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap}',
'.jsa-pill.g1{background:#a3e635;color:#1a2e05}.jsa-pill.g2{background:#22c55e;color:#06321a}',
'.jsa-pill.g3{background:#38bdf8;color:#062a3a}.jsa-pill.g4{background:#f43f5e;color:#fff}.jsa-pill.g5{background:#ffd23f;color:#3a2a00}',
'.jsa-spacer{flex:1}',
'.jsa-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;font-weight:900;font-family:inherit;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0;padding:0}',
'.jsa-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jsa-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jsa-root.jsa-tall .jsa-body{flex-direction:column}',
'.jsa-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}',
'.jsa-pane{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0}',
'.jsa-pane-lbl{font-weight:900;font-size:calc(13px*var(--ui));letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:6px;height:calc(20px*var(--ui));white-space:nowrap}',
'.jsa-pane-lbl .tag{background:#ffd23f;color:#3a2a00;border-radius:999px;padding:1px 10px}',
'.jsa-frame{border-radius:12px;padding:calc(6px*var(--ui));background:linear-gradient(145deg,#8a5a32,#5b3818);',
'  box-shadow:0 8px 20px rgba(0,0,0,.4),inset 0 0 0 2px rgba(255,255,255,.1),inset 0 2px 0 rgba(255,255,255,.18)}',
'.jsa-svg{display:block;border-radius:6px;background:#fff;touch-action:none;cursor:crosshair}',
'.jsa-pane.edit .jsa-frame{background:linear-gradient(145deg,#ffd23f,#e0a800)}',
// Panneau latéral
'.jsa-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(236px*var(--ui))}',
'.jsa-root.jsa-tall .jsa-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px}',
'.jsa-stats{display:flex;gap:6px}',
'.jsa-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 4px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.jsa-stat small{display:block;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;opacity:.8;text-transform:uppercase}',
'.jsa-stat span{display:block;font-size:calc(22px*var(--ui));font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}',
'.jsa-stat.jsa-st-time span{color:#ffd23f}',
'.jsa-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jsa-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jsa-stars .off{color:rgba(255,255,255,.25)}',
'.jsa-box{background:rgba(0,0,0,.22);border-radius:14px;padding:calc(7px*var(--ui));display:flex;flex-direction:column;gap:calc(6px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
'.jsa-root.jsa-tall .jsa-box{flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center}',
'.jsa-tools{display:flex;gap:5px}',
'.jsa-tool{flex:1;border:none;cursor:pointer;border-radius:10px;padding:calc(5px*var(--ui)) 4px;font-family:inherit;font-weight:800;font-size:calc(12px*var(--ui));',
'  background:rgba(255,255,255,.14);color:#fff;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);white-space:nowrap}',
'.jsa-tool i{font-style:normal;font-size:calc(18px*var(--ui));line-height:1.1}',
'.jsa-tool:hover{background:rgba(255,255,255,.24)}',
'.jsa-tool.sel{background:#fff;color:#3b1a86;box-shadow:0 0 0 2px #ffd23f}',
'.jsa-tool.sel.gomme{background:#ffedd5;color:#9a3412}',
'.jsa-pal{display:flex;flex-wrap:wrap;gap:calc(5px*var(--ui));justify-content:center}',
'.jsa-sw{width:calc(30px*var(--ui));height:calc(30px*var(--ui));border-radius:50%;border:3px solid rgba(255,255,255,.85);cursor:pointer;padding:0;',
'  box-shadow:0 2px 0 rgba(0,0,0,.3);transition:transform .1s;position:relative;font-size:calc(10px*var(--ui));font-weight:900;color:rgba(255,255,255,.9);font-family:inherit}',
'.jsa-sw:hover{transform:scale(1.1)}',
'.jsa-sw.sel{transform:scale(1.18);border-color:#ffd23f;box-shadow:0 0 0 3px rgba(255,210,63,.45),0 2px 0 rgba(0,0,0,.3)}',
'.jsa-sw.sel::after{content:"✓";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(15px*var(--ui));text-shadow:0 1px 2px rgba(0,0,0,.6)}',
'.jsa-palname{text-align:center;font-size:calc(11px*var(--ui));font-weight:800;opacity:.85;min-height:1.2em}',
'.jsa-axes{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}',
'.jsa-axbtn{border:none;cursor:pointer;border-radius:9px;padding:4px 7px;font-family:inherit;font-weight:800;font-size:calc(12px*var(--ui));background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}',
'.jsa-axbtn.sel{background:#fff;color:#3b1a86;box-shadow:0 0 0 2px #ffd23f}',
'.jsa-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jsa-root.jsa-tall .jsa-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jsa-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#3b1a86;background:#f1ecff;box-shadow:0 3px 0 #bba9ea;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jsa-btn:hover{filter:brightness(1.05)}.jsa-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #bba9ea}',
'.jsa-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jsa-btn.jsa-check{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jsa-btn.jsa-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jsa-btn.jsa-on{background:#3b1a86;color:#fff;box-shadow:0 3px 0 #1d0b4a}',
'.jsa-btn.wide{grid-column:1 / -1}',
'.jsa-size{display:none;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:calc(13px*var(--ui))}',
'.jsa-root.jsa-editing .jsa-size{display:flex}',
'.jsa-size button{width:28px;height:28px;border-radius:8px;border:none;background:#f1ecff;color:#3b1a86;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 2px 0 #bba9ea}',
'.jsa-size b{min-width:46px;text-align:center;font-size:calc(16px*var(--ui))}',
'.jsa-goal{font-size:calc(12px*var(--ui));opacity:.92;text-align:center;line-height:1.3}',
'.jsa-goal b{color:#ffe48a}',
'.jsa-msg{min-height:1.3em;font-size:calc(12px*var(--ui));text-align:center;font-weight:800;color:#ffe48a;line-height:1.3}',
'.jsa-root.jsa-tall .jsa-goal{display:none}',
'.jsa-root.jsa-editing .jsa-playonly{display:none!important}',
'.jsa-root:not(.jsa-editing) .jsa-editonly{display:none!important}',
// SVG
'.jsa-svg .lbl{font:900 0.42px "Nunito",sans-serif;fill:#64748b}',
'.jsa-svg .hl{fill:none;stroke:#f59e0b;stroke-width:.09;pointer-events:none}',
'.jsa-svg .hlimg{fill:rgba(124,58,237,.12);stroke:#7c3aed;stroke-width:.09;stroke-dasharray:.16 .1;pointer-events:none}',
'.jsa-svg .ghost,.jsa-svg .axis,.jsa-svg .zone{pointer-events:none}',
'.jsa-svg .bad{animation:jsaBlink .9s ease-in-out 3}',
'@keyframes jsaBlink{50%{opacity:.25}}',
'.jsa-svg.done{animation:jsaWin .6s ease}',
'@keyframes jsaWin{40%{transform:scale(1.04)}}',
// Fenêtres superposées
'.jsa-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(30,12,74,.78);backdrop-filter:blur(3px);padding:14px}',
'.jsa-ov.show{display:flex}',
'.jsa-card{position:relative;background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jsa-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#3b1a86}',
'.jsa-card h4{margin:12px 0 6px;font-size:calc(13px*var(--ui));font-weight:900;color:#3b1a86;text-transform:uppercase;letter-spacing:1px;text-align:left}',
'.jsa-chips{display:flex;flex-wrap:wrap;gap:6px}',
'.jsa-chip{border:2px solid #ddd3f6;cursor:pointer;border-radius:12px;padding:6px 10px;font-weight:800;font-size:calc(13px*var(--ui));background:#f7f4ff;color:#3b1a86;font-family:inherit;line-height:1.2}',
'.jsa-chip small{display:block;font-size:.78em;opacity:.7;font-weight:700}',
'.jsa-chip.sel{border-color:#3b1a86;background:#3b1a86;color:#fff}',
'.jsa-chip.off{opacity:.4}',
'.jsa-checkl{display:flex;align-items:center;gap:6px;margin-top:7px;font-weight:700;font-size:calc(13px*var(--ui));color:#345;cursor:pointer;text-align:left}',
'.jsa-checkl input{width:18px;height:18px;accent-color:#3b1a86;flex-shrink:0}',
'.jsa-card .jsa-btn{box-shadow:0 3px 0 #cfc3ee;background:#f1ecff}',
'.jsa-card .jsa-btn.jsa-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jsa-card-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}',
'.jsa-x{position:absolute;top:10px;right:10px;background:#3b1a86!important}',
'.jsa-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jsa-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jsaPop .5s backwards}',
'.jsa-win-stars .off{color:#e0d9f3}',
'@keyframes jsaPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jsa-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 4px;color:#345;line-height:1.45}',
'.jsa-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jsaFall linear forwards;z-index:21}',
'@keyframes jsaFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jsa-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jsa-grip:hover{opacity:1}',
'.jsa-root.jsa-fullboard .jsa-grip,.widget.phone-fs .jsa-grip{display:none}',
// Format étroit
'.jsa-root.jsa-narrow .jsa-head{gap:6px;padding:8px 8px 6px 10px}',
'.jsa-root.jsa-narrow .jsa-title .jsa-tt{display:none}',
'.jsa-root.jsa-narrow .jsa-lvlword{display:none}',
'.jsa-root.jsa-narrow .jsa-icon{width:24px;height:24px;font-size:12px}',
'.jsa-root.jsa-narrow .jsa-help{display:none}',
'.jsa-root.jsa-narrow .jsa-tool span{display:none}',
'.jsa-root.jsa-tall .jsa-palname{display:none}',
'.jsa-root.jsa-tall .jsa-tool span{display:none}',
'.jsa-root.jsa-tall .jsa-tool{flex:0 0 auto;padding:4px 8px}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .jsa-root.jsa-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
'    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}',
'}',
'@media (prefers-reduced-motion: reduce){.jsa-root *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    function fmtTime(s) {
        s = Math.max(0, Math.floor(s || 0));
        var m = Math.floor(s / 60), r = s % 60;
        return m + ':' + (r < 10 ? '0' : '') + r;
    }
    function byId(list, id, def) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return def; }
    function lvlById(id) { return byId(LEVELS, id, LEVELS[0]); }
    function colLetter(i) { return i < 26 ? String.fromCharCode(65 + i) : String(i + 1); }
    function sanitizeModel(m, n) {
        var out = emptyModel();
        if (!m) return out;
        if (m.cells && typeof m.cells === 'object') Object.keys(m.cells).forEach(function (k) {
            var p = k.split(',').map(Number), c = m.cells[k];
            if (p.length === 2 && p[0] >= 0 && p[1] >= 0 && p[0] < n && p[1] < n && COL[c]) out.cells[p[0] + ',' + p[1]] = c;
        });
        if (Array.isArray(m.segs)) m.segs.forEach(function (s) {
            if (!s || !s.a || !s.b || !COL[s.c]) return;
            var ok = [s.a[0], s.a[1], s.b[0], s.b[1]].every(function (v) { return typeof v === 'number' && v >= 0 && v <= n && v === Math.round(v); });
            if (ok && (s.a[0] !== s.b[0] || s.a[1] !== s.b[1])) out.segs.push({ a: [s.a[0], s.a[1]], b: [s.b[0], s.b[1]], c: s.c });
        });
        return out;
    }
    function axisLines(axisId, n) {
        return axisGens(axisId).map(function (g) {
            if (g === 'V')  return [n / 2, 0, n / 2, n];
            if (g === 'H')  return [0, n / 2, n, n / 2];
            if (g === 'D1') return [0, 0, n, n];
            return [n, 0, 0, n];
        });
    }

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initSym(widget, data) {
        if (!widget || widget._jsaInit) return;
        widget._jsaInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            lvl: 'deb', kind: 'cases', src: 'hasard', axisSet: 'auto', axis: 'V',
            coords: true, aid: true, zone: true,
            n: 6, given: emptyModel(), player: emptyModel(), target: emptyModel(), palette: [],
            custom: null, editing: false, modelName: '',
            tool: 'paint', color: 'R', history: [],
            time: 0, checks: 0, peeked: false, started: false, won: false,
            calque: false, marks: null, anchor: null,
            w: DEF_W, h: DEF_H, fullboard: false
        };

        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jsa-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jsa-head">' +
                '<div class="jsa-title">🪞<span class="jsa-tt"> <b>Symétrie</b> axiale</span></div>' +
                '<button class="jsa-lvlbtn" title="Choisir le niveau, l\'axe et la figure"><span class="jsa-pill"></span><span class="jsa-lvltxt"></span> ▾</button>' +
                '<div class="jsa-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jsa-icon jsa-sound" title="Son"></button>' +
                    '<button class="jsa-icon jsa-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jsa-body">' +
                '<div class="jsa-stage">' +
                    '<div class="jsa-pane"><div class="jsa-pane-lbl"><span class="tag jsa-lbl">Complète la figure !</span></div><div class="jsa-frame"><svg class="jsa-svg"></svg></div></div>' +
                '</div>' +
                '<div class="jsa-side">' +
                    '<div class="jsa-stats jsa-playonly">' +
                        '<div class="jsa-stat jsa-st-time"><small>Temps</small><span class="jsa-v-time">0:00</span></div>' +
                        '<div class="jsa-stat"><small>Vérif.</small><span class="jsa-v-checks">0</span></div>' +
                        '<div class="jsa-stat"><small>Record</small><span class="jsa-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="jsa-stars jsa-playonly"></div>' +
                    '<div class="jsa-box jsa-editonly"><div class="jsa-palname">Axe de symétrie</div><div class="jsa-axes"></div></div>' +
                    '<div class="jsa-size jsa-editonly"><button class="jsa-sz" data-d="-2" title="Moins de carreaux">−</button><b class="jsa-v-size">8×8</b><button class="jsa-sz" data-d="2" title="Plus de carreaux">+</button></div>' +
                    '<div class="jsa-box">' +
                        '<div class="jsa-tools"></div>' +
                        '<div class="jsa-pal"></div>' +
                        '<div class="jsa-palname jsa-colname"></div>' +
                    '</div>' +
                    '<div class="jsa-btns">' +
                        '<button class="jsa-btn jsa-undo" title="Annuler (Ctrl+Z)">↶ Annuler</button>' +
                        '<button class="jsa-btn jsa-clear" title="Tout effacer">🗑️ Effacer</button>' +
                        '<button class="jsa-btn jsa-check jsa-playonly" title="Vérifier ma figure">✔ Vérifier</button>' +
                        '<button class="jsa-btn jsa-calque jsa-playonly" title="Voir la solution en transparence">👁 Calque</button>' +
                        '<button class="jsa-btn jsa-go jsa-new wide jsa-playonly" title="Une autre figure">🔀 Nouvelle figure</button>' +
                        '<button class="jsa-btn jsa-go jsa-editdone wide jsa-editonly" title="Faire jouer avec cette figure">▶ Jouer avec cette figure</button>' +
                    '</div>' +
                    '<div class="jsa-goal"></div>' +
                    '<div class="jsa-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jsa-ov jsa-ov-set"><div class="jsa-card" style="max-width:500px;"><button class="jsa-icon jsa-x">✕</button><h3>Choisis ta figure</h3>' +
                '<h4>Niveau</h4><div class="jsa-chips jsa-set-lvl"></div>' +
                '<h4>Axe de symétrie</h4><div class="jsa-chips jsa-set-axis"></div>' +
                '<h4>À compléter</h4><div class="jsa-chips jsa-set-kind"></div>' +
                '<h4>Figure</h4><div class="jsa-chips jsa-set-src"></div>' +
                '<label class="jsa-checkl"><input type="checkbox" class="jsa-set-coords"> Afficher les repères (A, B, C… et 1, 2, 3…)</label>' +
                '<label class="jsa-checkl"><input type="checkbox" class="jsa-set-aid"> Aide : la case (ou le point) symétrique s\'allume</label>' +
                '<label class="jsa-checkl"><input type="checkbox" class="jsa-set-zone"> Colorer la zone à compléter</label>' +
                '<div class="jsa-card-btns"><button class="jsa-btn jsa-go jsa-set-play">▶ Jouer</button></div></div></div>' +
            '<div class="jsa-ov jsa-ov-win"><div class="jsa-card"><h3 class="jsa-win-title">Bravo !</h3><div class="jsa-win-stars"></div><div class="jsa-win-txt"></div>' +
                '<div class="jsa-card-btns"><button class="jsa-btn jsa-w-replay">↺ Refaire cette figure</button><button class="jsa-btn jsa-w-set">☰ Changer</button><button class="jsa-btn jsa-go jsa-w-new">🔀 Nouvelle figure</button></div></div></div>' +
            '<div class="jsa-ov jsa-ov-help"><div class="jsa-card" style="max-width:470px;text-align:left;"><button class="jsa-icon jsa-x">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> compléter la figure pour qu\'elle soit <b>symétrique</b> par rapport à l\'<b>axe rouge</b> (ou aux deux axes), comme si on pliait la feuille le long de l\'axe.</p>' +
                '<p style="margin:6px 0;">📏 Chaque case colorée a une image <b>de l\'autre côté de l\'axe</b>, à la <b>même distance</b> de l\'axe.</p>' +
                '<p style="margin:6px 0;">🎨 Choisis d\'abord une <b>couleur</b> dans la palette (touches 1 à 9).</p>' +
                '<p style="margin:6px 0;">🖌️ <b>Colorier</b> : touche une case (ou glisse sur plusieurs cases). Retoucher une case de la même couleur l\'efface.</p>' +
                '<p style="margin:6px 0;">✏️ <b>Tracer</b> : appuie sur un point de la grille et glisse jusqu\'à un autre point (ou touche les deux points l\'un après l\'autre).</p>' +
                '<p style="margin:6px 0;">🧽 <b>Gomme</b> : touche une case ou un trait que tu as fait pour l\'effacer. La partie donnée ne s\'efface pas.</p>' +
                '<p style="margin:6px 0;">✔ Quand tu penses avoir fini, appuie sur <b>Vérifier</b>.</p>' +
                '<p style="margin:6px 0;">⭐ 3 étoiles si c\'est juste du premier coup, 2 étoiles après 1 ou 2 vérifications avec des erreurs, 1 étoile avec le calque.</p></div></div>' +
            '<div class="jsa-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var stageEl = $('.jsa-stage'), svg = $('.jsa-svg'), pane = $('.jsa-pane');

        // ── Déplacement du widget : on peut l'attraper n'importe où, sauf
        //    sur la grille, les boutons, les champs et les fenêtres.
        var NO_DRAG = '.jsa-frame, .jsa-ov, .jsa-grip, button, input, select, textarea, label, a';
        function isolate(e) {
            if ((e.type === 'pointerdown' || e.type === 'mousedown') && typeof bringToFront === 'function') {
                try { bringToFront(widget); } catch (er) {}
            }
            var fixe = S.fullboard || widget.classList.contains('phone-fs');
            if (!fixe && e.target.closest && !e.target.closest(NO_DRAG)) return;
            e.stopPropagation();
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.jsa-head button').forEach(function (b) {
            ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
                b.addEventListener(t, function (e) { e.stopPropagation(); }, t === 'touchstart' ? { passive: true } : false);
            });
        });

        // ── Mise en page ─────────────────────────────────────────────────
        function applySize() {
            if (S.fullboard || widget.classList.contains('phone-fs')) { root.style.width = ''; root.style.height = ''; }
            else { root.style.width = S.w + 'px'; root.style.height = S.h + 'px'; }
        }
        function layout() {
            var W = root.clientWidth, H = root.clientHeight;
            if (!W || !H) return;
            var ui = Math.max(0.75, Math.min(1.6, Math.min(W / DEF_W, H / DEF_H) * 1.05));
            root.style.setProperty('--ui', ui.toFixed(3));
            root.classList.toggle('jsa-narrow', W < 600);
            root.classList.toggle('jsa-tall', W < H * 1.15);
            var sw = stageEl.clientWidth, sh = stageEl.clientHeight;
            var lab = 24 * ui, fr = 2 * 6 * ui;
            var size = Math.max(90, Math.floor(Math.min(sw, sh - lab) - fr));
            svg.style.width = size + 'px'; svg.style.height = size + 'px';
        }

        // ── Dessin de la grille (SVG) ────────────────────────────────────
        function padOf() { return S.coords ? 0.7 : 0.14; }
        function cur() { return S.editing ? S.given : S.player; }
        function cellsHTML(cells) {
            var h = '';
            Object.keys(cells).forEach(function (k) {
                var a = k.split(','), c = COL[cells[k]];
                if (c) h += '<rect x="' + a[1] + '" y="' + a[0] + '" width="1" height="1" fill="' + c.hex + '"/>';
            });
            return h;
        }
        function segsHTML(segs, cls) {
            var h = '';
            segs.forEach(function (s, i) {
                h += '<line' + (cls ? ' class="' + cls + '"' : '') + ' data-i="' + i + '" x1="' + s.a[0] + '" y1="' + s.a[1] + '" x2="' + s.b[0] + '" y2="' + s.b[1] + '" stroke="' + COL[s.c].hex + '" stroke-width="0.14" stroke-linecap="round"/>';
            });
            return h;
        }
        function render() {
            var n = S.n, p = padOf(), q = (S.coords && S.kind === 'traits') ? 0.4 : 0.14, h = '';
            var showNodes = S.editing || S.kind !== 'cases';
            h += '<rect x="0" y="0" width="' + n + '" height="' + n + '" fill="#fff"/>';
            // zone à compléter (légèrement teintée)
            if (S.zone && !S.editing && S.src !== 'perso') {
                var z = '';
                for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (!inSrcCell(S.axis, n, r, c)) z += 'M' + c + ' ' + r + 'h1v1h-1z';
                h += '<path class="zone" d="' + z + '" fill="rgba(250,204,21,.16)"/>';
            }
            // cases : partie donnée + cases de l'élève
            h += cellsHTML(S.given.cells);
            if (!S.editing) h += cellsHTML(S.player.cells);
            // quadrillage
            var g = '';
            for (var i = 1; i < n; i++) g += 'M' + i + ' 0V' + n + 'M0 ' + i + 'H' + n;
            h += '<path d="' + g + '" stroke="#c9bfe6" stroke-width="0.035" fill="none"/>';
            h += '<rect x="0" y="0" width="' + n + '" height="' + n + '" fill="none" stroke="#475569" stroke-width="0.07"/>';
            // calque : la solution (ou, dans l'éditeur, la figure complète) en transparence
            var ghost = S.editing ? orbitModel(S.given, S.axis, n) : (S.calque ? S.target : null);
            if (ghost) {
                h += '<g class="ghost" opacity="' + (S.editing ? 0.3 : 0.42) + '">';
                Object.keys(ghost.cells).forEach(function (k) {
                    if (S.given.cells[k]) return;
                    var a = k.split(','), cc = COL[ghost.cells[k]];
                    h += '<rect x="' + (+a[1] + 0.12) + '" y="' + (+a[0] + 0.12) + '" width="0.76" height="0.76" rx="0.12" fill="' + cc.hex + '"/>';
                });
                ghost.segs.forEach(function (s) {
                    h += '<line x1="' + s.a[0] + '" y1="' + s.a[1] + '" x2="' + s.b[0] + '" y2="' + s.b[1] + '" stroke="' + COL[s.c].hex + '" stroke-width="0.1" stroke-dasharray="0.18 0.14" stroke-linecap="round"/>';
                });
                h += '</g>';
            }
            // axe(s) de symétrie
            h += '<g class="axis">';
            axisLines(S.axis, n).forEach(function (L) {
                h += '<line x1="' + L[0] + '" y1="' + L[1] + '" x2="' + L[2] + '" y2="' + L[3] + '" stroke="#fff" stroke-width="0.16" stroke-linecap="round" opacity=".85"/>';
                h += '<line x1="' + L[0] + '" y1="' + L[1] + '" x2="' + L[2] + '" y2="' + L[3] + '" stroke="#dc2626" stroke-width="0.09" stroke-dasharray="0.3 0.17" stroke-linecap="round"/>';
            });
            h += '</g>';
            // traits
            h += segsHTML(S.given.segs, 'given');
            if (!S.editing) h += segsHTML(S.player.segs, 'mine');
            // nœuds
            if (showNodes) {
                var d = '';
                for (var x = 0; x <= n; x++) for (var y = 0; y <= n; y++) d += 'M' + x + ' ' + y + 'h0';
                h += '<path d="' + d + '" stroke="#a5a0bd" stroke-width="0.11" stroke-linecap="round" fill="none" pointer-events="none"/>';
            }
            // marques d'erreur
            if (S.marks && !S.editing) {
                h += '<g class="bad" pointer-events="none">';
                Object.keys(S.marks.badCells).forEach(function (k) {
                    var a = k.split(','), xx = +a[1], yy = +a[0];
                    var dd = 'M' + (xx + 0.2) + ' ' + (yy + 0.2) + 'L' + (xx + 0.8) + ' ' + (yy + 0.8) + 'M' + (xx + 0.8) + ' ' + (yy + 0.2) + 'L' + (xx + 0.2) + ' ' + (yy + 0.8);
                    h += '<path d="' + dd + '" stroke="#fff" stroke-width="0.22" stroke-linecap="round"/>';
                    h += '<path d="' + dd + '" stroke="#dc2626" stroke-width="0.12" stroke-linecap="round"/>';
                });
                Object.keys(S.marks.badSegs).forEach(function (k) {
                    var a = k.split(',').map(Number);
                    h += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + a[2] + '" y2="' + a[3] + '" stroke="#dc2626" stroke-width="0.3" stroke-linecap="round" opacity="0.55"/>';
                    var mx = (a[0] + a[2]) / 2, my = (a[1] + a[3]) / 2;
                    h += '<circle cx="' + mx + '" cy="' + my + '" r="0.2" fill="#dc2626" stroke="#fff" stroke-width="0.05"/>';
                    h += '<path d="M' + (mx - 0.08) + ' ' + (my - 0.08) + 'l0.16 0.16m0 -0.16l-0.16 0.16" stroke="#fff" stroke-width="0.06"/>';
                });
                h += '</g>';
            }
            // surlignage : case / point visé et son (ses) image(s)
            h += '<g class="hlimgs"></g>';
            h += '<rect class="hl hl-cell" x="0" y="0" width="1" height="1" rx="0.08" style="display:none"/>';
            h += '<circle class="hl hl-node" cx="0" cy="0" r="0.2" style="display:none"/>';
            // aide au tracé
            h += '<line class="ghost ghost-line" x1="0" y1="0" x2="0" y2="0" stroke="#1f2937" stroke-opacity=".45" stroke-width="0.1" stroke-dasharray="0.2 0.14" stroke-linecap="round" style="display:none"/>';
            h += '<circle class="ghost anchor" cx="0" cy="0" r="0.17" fill="#1f2937" stroke="#fff" stroke-width="0.05" style="display:none"/>';
            // repères
            if (S.coords) {
                var nodeLbl = S.kind === 'traits';
                for (var j = 0; j < (nodeLbl ? n + 1 : n); j++) {
                    var pos = nodeLbl ? j : j + 0.5;
                    h += '<text class="lbl" x="' + pos + '" y="' + (-p / 2 + 0.03) + '" text-anchor="middle" dominant-baseline="middle">' + colLetter(j) + '</text>';
                    h += '<text class="lbl" x="' + (-p / 2) + '" y="' + (pos + 0.02) + '" text-anchor="middle" dominant-baseline="middle">' + (j + 1) + '</text>';
                }
            }
            svg.setAttribute('viewBox', (-p) + ' ' + (-p) + ' ' + (n + p + q) + ' ' + (n + p + q));
            svg.innerHTML = h;
            if (S.anchor) showAnchor(S.anchor);
        }

        // ── Palette et outils ────────────────────────────────────────────
        function toolsFor() {
            var t = [];
            if (S.editing || S.kind !== 'traits') t.push({ id: 'paint', ico: '🖌️', name: 'Colorier' });
            if (S.editing || S.kind !== 'cases') t.push({ id: 'line', ico: '✏️', name: 'Tracer' });
            t.push({ id: 'erase', ico: '🧽', name: 'Gomme' });
            return t;
        }
        function renderTools() {
            var list = toolsFor();
            if (!list.some(function (t) { return t.id === S.tool; })) S.tool = list[0].id;
            $('.jsa-tools').innerHTML = list.map(function (t) {
                return '<button class="jsa-tool' + (t.id === S.tool ? ' sel' : '') + (t.id === 'erase' ? ' gomme' : '') + '" data-tool="' + t.id + '" title="' + t.name + '"><i>' + t.ico + '</i><span>' + t.name + '</span></button>';
            }).join('');
            var pal = S.editing ? COLORS.map(function (c) { return c.k; }) : S.palette;
            if (pal.indexOf(S.color) < 0) S.color = pal[0] || 'R';
            $('.jsa-pal').innerHTML = pal.map(function (k, i) {
                return '<button class="jsa-sw' + (k === S.color ? ' sel' : '') + '" data-col="' + k + '" title="' + COL[k].name + ' (' + (i + 1) + ')" style="background:' + COL[k].hex + '"></button>';
            }).join('');
            $('.jsa-colname').textContent = S.tool === 'erase' ? 'Gomme' : 'Couleur : ' + COL[S.color].name;
            svg.style.cursor = S.tool === 'erase' ? 'cell' : 'crosshair';
            $('.jsa-axes').innerHTML = AXES.filter(function (A) { return A.id !== 'auto'; }).map(function (A) {
                return '<button class="jsa-axbtn' + (A.id === S.axis ? ' sel' : '') + '" data-axis="' + A.id + '" title="' + A.name + '">' + A.ico + ' ' + A.name + '</button>';
            }).join('');
        }
        function setTool(t) { S.tool = t; S.anchor = null; hideGhost(); renderTools(); }
        function setColor(k) {
            S.color = k;
            if (S.tool === 'erase') S.tool = (!S.editing && S.kind === 'traits') ? 'line' : 'paint';
            renderTools();
        }

        // ── Nouvelle partie ──────────────────────────────────────────────
        function chooseAxis(L, preferVH) {
            if (S.axisSet !== 'auto') return S.axisSet;
            var list = L.axes;
            if (preferVH) { var vh = list.filter(function (a) { return a === 'V' || a === 'H'; }); if (vh.length) list = vh; }
            return list[rnd(list.length)];
        }
        function dessinOK(kind, axisSet) {
            return kind !== 'mixte' && (axisSet === 'auto' || axisSet === 'V');
        }
        function buildModel() {
            var L = lvlById(S.lvl), n = L.n, m = emptyModel(), name = '';
            if (S.src === 'perso' && S.custom) {
                n = S.custom.n; S.axis = S.custom.axis;
                m = cloneModel(S.custom); name = 'Mon modèle';
            } else if (S.src === 'dessin' && dessinOK(S.kind, S.axisSet)) {
                S.axis = 'V';   // les dessins sont symétriques par rapport à un axe vertical
                if (S.kind === 'cases') {
                    var okP = HALF_PIX.filter(function (P) { return P.rows.length <= n && P.rows[0].length <= n / 2 && Math.max(P.rows.length, 2 * P.rows[0].length) >= n - 3 && pixColors(P) <= L.colors + 1 && P.name !== S.modelName; });
                    if (!okP.length) okP = HALF_PIX.filter(function (P) { return P.rows.length <= n && P.rows[0].length <= n / 2; });
                    var P = okP[rnd(okP.length)];
                    m.cells = fitHalfPix(P, n, S.axis); name = P.name;
                } else {
                    var okF = HALF_FIG.filter(function (F) { return F.h <= n && F.hw <= n / 2 && figCat(F) <= L.cat && Math.max(F.h, 2 * F.hw) >= n - 4 && F.name !== S.modelName; });
                    if (!okF.length) okF = HALF_FIG.filter(function (F) { return F.h <= n && F.hw <= n / 2; });
                    var F = okF[rnd(okF.length)];
                    m.segs = fitHalfFig(F, n, S.axis); name = F.name;
                }
            } else {
                for (var t = 0; t < 25; t++) {
                    S.axis = chooseAxis(L, false);
                    var two = axisGens(S.axis).length > 1, kc = two ? Math.max(1, L.colors - 1) : L.colors;
                    var nc = two ? Math.round(L.cells * 0.7) : L.cells, ns = two ? Math.round(L.segs * 0.7) : L.segs;
                    m = emptyModel();
                    if (S.kind === 'cases') m.cells = randCells(n, kc, nc, S.axis);
                    else if (S.kind === 'traits') m.segs = randSegs(n, Math.max(1, kc - 1), ns, L.cat, S.axis);
                    else {
                        m.cells = randCells(n, Math.max(1, kc - 1), Math.round(nc * 0.6), S.axis);
                        m.segs = randSegs(n, Math.max(1, kc - 2), Math.round(ns * 0.6), L.cat, S.axis);
                    }
                    if (compare(orbitModel(m, S.axis, n), m, emptyModel()).total >= 2) break;
                }
            }
            S.n = n; S.given = m; S.modelName = name;
        }
        function buildPalette() {
            var used = colorsOf(S.target);
            var extra = S.src === 'perso' ? Math.min(2, 9 - used.length) : lvlById(S.lvl).extra;
            var others = shuffle(COLORS.map(function (c) { return c.k; }).filter(function (k) { return used.indexOf(k) < 0; })).slice(0, extra);
            var all = used.concat(others);
            S.palette = COLORS.map(function (c) { return c.k; }).filter(function (k) { return all.indexOf(k) >= 0; });
            if (S.palette.indexOf(S.color) < 0) S.color = used[0] || S.palette[0];
        }
        function newGame(keepModel) {
            if (!keepModel) buildModel();
            S.target = orbitModel(S.given, S.axis, S.n);
            S.player = emptyModel();
            S.history = []; S.time = 0; S.checks = 0; S.peeked = false; S.started = false; S.won = false;
            S.calque = false; S.marks = null; S.anchor = null; S.editing = false;
            buildPalette();
            hideOv();
            refreshMode();
            setMsg('');
        }
        function axisPhrase() {
            var g = axisGens(S.axis);
            if (g.length > 1) return 'par rapport aux <b>deux axes rouges</b>';
            return 'par rapport à l\'<b>axe rouge</b>';
        }
        function refreshMode() {
            root.classList.toggle('jsa-editing', S.editing);
            pane.classList.toggle('edit', S.editing);
            $('.jsa-lbl').textContent = S.editing ? '✍️ Dessine la partie donnée'
                : 'Complète la figure !' + (S.modelName && S.modelName !== 'Mon modèle' ? ' · ' + S.modelName : '');
            $('.jsa-goal').innerHTML = S.editing
                ? 'Choisis l\'<b>axe</b>, dessine ce que l\'élève verra au départ (la figure complète apparaît en transparence), puis appuie sur <b>Jouer</b>.'
                : 'Colorie et trace pour que la figure soit <b>symétrique</b> ' + axisPhrase() + '.';
            renderTools(); render(); updateUI(); layout();
            requestAnimationFrame(layout);
        }

        function stars() {
            if (S.peeked) return 1;
            return S.checks === 0 ? 3 : (S.checks <= 2 ? 2 : 1);
        }
        function starHTML(n) {
            var h = '';
            for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
            return h;
        }
        function recKey() { return S.src === 'perso' ? null : S.lvl + '|' + S.kind + '|' + S.axisSet; }

        function updateUI() {
            var L = lvlById(S.lvl), pill = $('.jsa-pill');
            if (S.src === 'perso') { pill.className = 'jsa-pill g5'; pill.textContent = 'Mon modèle'; }
            else { pill.className = 'jsa-pill ' + L.cls; pill.textContent = L.name; }
            var K = byId(KINDS, S.kind, KINDS[0]), A = byId(AXES, S.axis, AXES[1]);
            $('.jsa-lvltxt').innerHTML = S.n + '×' + S.n + '<span class="jsa-lvlword"> · ' + A.ico + ' ' + A.name + ' · ' + K.ico + ' ' + K.name + '</span>';
            $('.jsa-v-time').textContent = fmtTime(S.time);
            $('.jsa-v-checks').textContent = S.checks;
            var k = recKey(), best = k ? prog.best[k] : null;
            $('.jsa-v-best').textContent = best ? fmtTime(best) : '–';
            $('.jsa-stars').innerHTML = starHTML(k ? (prog.stars[k] || 0) : 0);
            $('.jsa-v-size').textContent = S.n + '×' + S.n;
            $('.jsa-undo').disabled = !S.history.length || S.won;
            $('.jsa-clear').disabled = isEmpty(cur()) || S.won;
            $('.jsa-check').disabled = S.won || isEmpty(S.player);
            $('.jsa-calque').disabled = S.won;
            $('.jsa-calque').classList.toggle('jsa-on', S.calque);
            $('.jsa-new').innerHTML = S.src === 'perso' ? '✏️ Modifier ma figure' : '🔀 Nouvelle figure';
            var sb = $('.jsa-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
        }
        function setMsg(t) { $('.jsa-msg').innerHTML = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // ── Chronomètre ──────────────────────────────────────────────────
        var timer = setInterval(function () {
            if (!root.isConnected) { if (!widget.isConnected) clearInterval(timer); return; }
            if (S.started && !S.won && !S.editing && root.offsetParent !== null && !root.querySelector('.jsa-ov.show')) {
                S.time++;
                $('.jsa-v-time').textContent = fmtTime(S.time);
            }
        }, 1000);

        // ── Saisie sur la grille ─────────────────────────────────────────
        function svgPt(e) {
            var m = svg.getScreenCTM(); if (!m) return null;
            var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
            return p.matrixTransform(m.inverse());
        }
        function cellAt(pt) {
            var c = Math.floor(pt.x), r = Math.floor(pt.y);
            return (r < 0 || c < 0 || r >= S.n || c >= S.n) ? null : [r, c];
        }
        function nodeAt(pt, strict) {
            var x = Math.round(pt.x), y = Math.round(pt.y);
            if (x < 0 || y < 0 || x > S.n || y > S.n) return null;
            if (strict && Math.hypot(pt.x - x, pt.y - y) > 0.42) return null;
            return [x, y];
        }
        function distSeg(pt, s) {
            var ax = s.a[0], ay = s.a[1], bx = s.b[0], by = s.b[1];
            var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
            var t = L ? Math.max(0, Math.min(1, ((pt.x - ax) * dx + (pt.y - ay) * dy) / L)) : 0;
            return Math.hypot(pt.x - (ax + t * dx), pt.y - (ay + t * dy));
        }
        function pushHistory() {
            S.history.push(JSON.stringify(cur()));
            if (S.history.length > 300) S.history.shift();
        }
        function changed() {
            S.marks = null;
            if (!S.editing && !S.started) S.started = true;
            render(); updateUI();
            save();   // la victoire n'est annoncée qu'au clic sur « Vérifier »
        }
        var lockWarned = 0;
        function lockedMsg() {
            var now = Date.now();
            if (now - lockWarned < 1500) return;
            lockWarned = now;
            setMsg('🔒 Cette case fait partie de la figure de départ.');
            if (prog.sound) beep(220, 0.08, 'square', 0.025);
        }
        function paintCell(rc, mode) {
            var m = cur(), k = rc[0] + ',' + rc[1];
            if (!S.editing && S.given.cells[k]) { lockedMsg(); return false; }
            if (mode === 'erase') { if (!m.cells[k]) return false; delete m.cells[k]; return true; }
            if (m.cells[k] === S.color) return false;
            m.cells[k] = S.color; return true;
        }
        function eraseAt(pt) {
            var m = cur(), best = -1, bd = 0.24;
            for (var i = m.segs.length - 1; i >= 0; i--) { var d = distSeg(pt, m.segs[i]); if (d < bd) { bd = d; best = i; } }
            if (best >= 0) { m.segs.splice(best, 1); return true; }
            var rc = cellAt(pt);
            if (!rc) return false;
            var k = rc[0] + ',' + rc[1];
            if (!m.cells[k]) { if (!S.editing && S.given.cells[k]) lockedMsg(); return false; }
            return paintCell(rc, 'erase');
        }
        function addSeg(a, b) {
            var m = cur(), pc = pieces([{ a: a, b: b, c: S.color }]), dup = false;
            m.segs = m.segs.filter(function (s) {
                var sp = pieces([s]), keys = Object.keys(sp), inside = keys.every(function (k) { return pc[k]; });
                if (inside && s.c === S.color && keys.length === Object.keys(pc).length) dup = true;
                return !inside;
            });
            m.segs.push({ a: a, b: b, c: S.color });
            if (prog.sound) beep(dup ? 300 : 520, 0.07, 'triangle', 0.05);
        }

        function showAnchor(nd) {
            var a = svg.querySelector('.anchor');
            if (!a) return;
            if (!nd) { a.style.display = 'none'; return; }
            a.setAttribute('cx', nd[0]); a.setAttribute('cy', nd[1]); a.style.display = '';
        }
        function hideGhost() {
            svg.querySelectorAll('.ghost-line,.anchor').forEach(function (g) { g.style.display = 'none'; });
        }
        function showGhost(a, b) {
            var g = svg.querySelector('.ghost-line');
            if (!g) return;
            if (!a || !b) { g.style.display = 'none'; return; }
            g.setAttribute('x1', a[0]); g.setAttribute('y1', a[1]); g.setAttribute('x2', b[0]); g.setAttribute('y2', b[1]);
            g.style.display = '';
        }
        // Surlignage : la case (ou le point) visée + son image par la symétrie
        function highlight(pt) {
            var hc = svg.querySelector('.hl-cell'), hn = svg.querySelector('.hl-node'), gi = svg.querySelector('.hlimgs');
            if (!hc) return;
            hc.style.display = hn.style.display = 'none';
            gi.innerHTML = '';
            if (!pt) return;
            var T = transforms(S.axis, S.n).slice(1), h = '', seen = {};
            var useNode = S.tool === 'line' || (S.tool === 'erase' && S.kind === 'traits' && !S.editing);
            if (useNode) {
                var nd = nodeAt(pt, false); if (!nd) return;
                hn.setAttribute('cx', nd[0]); hn.setAttribute('cy', nd[1]); hn.style.display = '';
                if (S.aid || S.editing) T.forEach(function (f) {
                    var q = f(nd[0], nd[1]), k = q.join(',');
                    if (seen[k] || (q[0] === nd[0] && q[1] === nd[1])) return; seen[k] = 1;
                    h += '<circle class="hlimg" cx="' + q[0] + '" cy="' + q[1] + '" r="0.2"/>';
                });
            } else {
                var rc = cellAt(pt); if (!rc) return;
                hc.setAttribute('x', rc[1]); hc.setAttribute('y', rc[0]); hc.style.display = '';
                if (S.aid || S.editing) T.forEach(function (f) {
                    var q = mapCell(f, rc[0], rc[1]), k = q.join(',');
                    if (seen[k] || (q[0] === rc[0] && q[1] === rc[1])) return; seen[k] = 1;
                    h += '<rect class="hlimg" x="' + q[1] + '" y="' + q[0] + '" width="1" height="1" rx="0.08"/>';
                });
            }
            gi.innerHTML = h;
        }

        var ptr = null;
        function onDown(e) {
            if (S.won || (e.button != null && e.button > 0)) return;
            e.preventDefault(); e.stopPropagation();
            root.focus({ preventScroll: true });
            var pt = svgPt(e); if (!pt) return;
            try { svg.setPointerCapture(e.pointerId); } catch (er) {}
            if (S.tool === 'paint') {
                var rc = cellAt(pt); if (!rc) return;
                var k = rc[0] + ',' + rc[1];
                if (!S.editing && S.given.cells[k]) { lockedMsg(); return; }
                pushHistory();
                var mode = cur().cells[k] === S.color ? 'erase' : 'paint';
                paintCell(rc, mode);
                if (prog.sound) beep(mode === 'erase' ? 330 : 460 + rnd(60), 0.05, 'triangle', 0.045);
                ptr = { id: e.pointerId, tool: 'paint', mode: mode, last: k, did: true };
                changed();
            } else if (S.tool === 'erase') {
                pushHistory();
                var did = eraseAt(pt);
                if (did) { if (prog.sound) beep(300, 0.05, 'sine', 0.04); changed(); } else S.history.pop();
                ptr = { id: e.pointerId, tool: 'erase', did: did };
            } else if (S.tool === 'line') {
                var nd = nodeAt(pt, true);
                if (!nd) return;
                if (S.anchor) {
                    var a = S.anchor; S.anchor = null; hideGhost();
                    if (a[0] !== nd[0] || a[1] !== nd[1]) { pushHistory(); addSeg(a, nd); changed(); }
                    ptr = null;
                    return;
                }
                S.anchor = nd; showAnchor(nd);
                if (prog.sound) beep(700, 0.04, 'sine', 0.035);
                ptr = { id: e.pointerId, tool: 'line', start: nd };
            }
        }
        function onMove(e) {
            var pt = svgPt(e); if (!pt) return;
            highlight(pt);
            if (S.tool === 'line' && S.anchor) showGhost(S.anchor, nodeAt(pt, false));
            if (!ptr || e.pointerId !== ptr.id) return;
            if (ptr.tool === 'paint') {
                var rc = cellAt(pt); if (!rc) return;
                var k = rc[0] + ',' + rc[1];
                if (k === ptr.last) return;
                ptr.last = k;
                if (paintCell(rc, ptr.mode)) { if (prog.sound) beep(460 + rnd(80), 0.04, 'triangle', 0.035); changed(); }
            } else if (ptr.tool === 'erase') {
                if (!ptr.did) { pushHistory(); ptr.did = true; }
                if (eraseAt(pt)) changed();
            }
        }
        function onUp(e) {
            if (!ptr || e.pointerId !== ptr.id) return;
            var p = ptr; ptr = null;
            if (e.type === 'pointercancel') return;
            if (p.tool === 'erase' && p.did && S.history.length && S.history[S.history.length - 1] === JSON.stringify(cur())) S.history.pop();
            if (p.tool === 'line' && S.anchor) {
                var pt = svgPt(e), nd = pt && nodeAt(pt, true);
                if (nd && (nd[0] !== p.start[0] || nd[1] !== p.start[1])) {
                    var a = S.anchor; S.anchor = null; hideGhost();
                    pushHistory(); addSeg(a, nd); changed();
                }
            }
        }
        svg.addEventListener('pointerdown', onDown);
        svg.addEventListener('pointermove', onMove);
        svg.addEventListener('pointerup', onUp);
        svg.addEventListener('pointercancel', onUp);
        svg.addEventListener('pointerleave', function () { if (!ptr) highlight(null); });

        function undo() {
            if (!S.history.length || S.won) return;
            var prev = JSON.parse(S.history.pop());
            if (S.editing) S.given = prev; else S.player = prev;
            S.anchor = null; S.marks = null;
            if (prog.sound) beep(300, 0.06, 'sine', 0.05);
            render(); updateUI(); save();
        }
        function clearAll() {
            if (isEmpty(cur()) || S.won) return;
            pushHistory();
            if (S.editing) S.given = emptyModel(); else S.player = emptyModel();
            S.anchor = null; S.marks = null;
            render(); updateUI(); save();
            setMsg('Grille effacée (↶ Annuler pour revenir en arrière).');
        }

        // ── Vérifier / calque ────────────────────────────────────────────
        function check() {
            if (S.won || S.editing || isEmpty(S.player)) return;
            var r = compare(S.target, S.given, S.player);
            if (r.done) { win(); return; }
            S.checks++;
            S.marks = r;
            render(); updateUI(); save();
            var unit = S.kind === 'cases' ? 'case' : (S.kind === 'traits' ? 'morceau de trait' : 'élément');
            var parts = [], good = r.okCells + r.okSegs;
            parts.push('✔ ' + good + ' bon' + (good > 1 ? 's' : ''));
            if (r.nBad) parts.push('✖ ' + r.nBad + ' erreur' + (r.nBad > 1 ? 's' : '') + ' (en rouge)');
            var plur = { 'case': 'cases', 'élément': 'éléments', 'morceau de trait': 'morceaux de trait' };
            if (r.nMiss) parts.push('il manque ' + r.nMiss + ' ' + (r.nMiss > 1 ? plur[unit] : unit));
            setMsg(parts.join(' · '));
            if (prog.sound) { if (r.nBad) beep(200, 0.15, 'square', 0.03); else beep(660, 0.1, 'sine', 0.05); }
        }
        function toggleCalque() {
            if (S.won || S.editing) return;
            S.calque = !S.calque;
            if (S.calque && !S.peeked) { S.peeked = true; setMsg('👁 Le calque montre la solution en transparence (1 étoile maximum).'); }
            render(); updateUI(); save();
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            S.won = true; S.calque = false; S.marks = null; S.anchor = null;
            render();
            svg.classList.remove('done'); void svg.offsetWidth; svg.classList.add('done');
            var st = stars(), key = recKey(), newRec = false;
            if (key) {
                if (st > (prog.stars[key] || 0)) prog.stars[key] = st;
                if (!S.peeked && (!prog.best[key] || S.time < prog.best[key])) { prog.best[key] = Math.max(1, S.time); newRec = true; }
            }
            prog.wins++;
            saveProgress(prog);
            updateUI();
            if (prog.sound) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.1 + j * 0.11); });
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.jsa-win-title').textContent = st === 3 ? 'Bravo, parfait miroir !' : 'Bravo !';
                var se = $('.jsa-win-stars');
                se.innerHTML = starHTML(st);
                se.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt = 'Figure symétrique complétée en <b>' + fmtTime(S.time) + '</b>';
                if (S.checks) txt += '<br>après ' + S.checks + ' vérification' + (S.checks > 1 ? 's' : '') + ' avec des erreurs';
                if (S.peeked) txt += '<br>avec le calque — essaie sans la prochaine fois !';
                if (newRec && key) txt += '<br>🏆 Nouveau record !';
                $('.jsa-win-txt').innerHTML = txt;
                $('.jsa-w-new').textContent = S.src === 'perso' ? '✏️ Modifier ma figure' : '🔀 Nouvelle figure';
                showOv('.jsa-ov-win');
                if (st >= 2) confetti();
            }, 700);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#ff4f5e', '#22c55e', '#3ba7ff', '#9b6bff', '#ff9f1a'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jsa-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Éditeur « Mon modèle » ───────────────────────────────────────
        function openEditor() {
            hideOv();
            S.editing = true; S.won = false; S.calque = false; S.marks = null; S.anchor = null; S.history = [];
            if (S.custom) { S.n = S.custom.n; S.axis = S.custom.axis; S.given = cloneModel(S.custom); }
            else {
                S.n = lvlById(S.lvl).n; S.given = emptyModel();
                S.axis = S.axisSet !== 'auto' ? S.axisSet : 'V';
            }
            S.modelName = 'Mon modèle';
            if (S.tool === 'erase') S.tool = 'paint';
            refreshMode();
            setMsg('');
            save();
        }
        function resizeEditor(d) {
            var n = Math.max(4, Math.min(12, S.n + d));
            if (n === S.n) return;
            pushHistory();
            S.n = n;
            S.given = sanitizeModel(S.given, n);
            S.anchor = null;
            render(); updateUI(); layout(); save();
        }
        function finishEditor() {
            if (isEmpty(S.given)) { setMsg('Dessine d\'abord quelque chose dans la grille !'); return; }
            if (!compare(orbitModel(S.given, S.axis, S.n), S.given, emptyModel()).total) {
                setMsg('Cette figure est déjà symétrique : il n\'y a rien à compléter !'); return;
            }
            S.custom = { n: S.n, axis: S.axis, cells: Object.assign({}, S.given.cells), segs: cloneModel(S.given).segs };
            var hasC = Object.keys(S.given.cells).length > 0, hasS = S.given.segs.length > 0;
            S.kind = hasC && hasS ? 'mixte' : (hasS ? 'traits' : 'cases');
            S.src = 'perso';
            newGame(true);
            save();
        }

        // ── Fenêtres : réglages / victoire / aide ────────────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jsa-ov').forEach(function (o) { o.classList.remove('show'); }); }
        var pend = null;
        function openSettings() {
            pend = { lvl: S.lvl, kind: S.kind, src: S.src, axisSet: S.axisSet, coords: S.coords, aid: S.aid, zone: S.zone };
            renderSettings();
            showOv('.jsa-ov-set');
        }
        function renderSettings() {
            if (pend.src === 'dessin' && !dessinOK(pend.kind, pend.axisSet)) pend.src = 'hasard';
            $('.jsa-set-lvl').innerHTML = LEVELS.map(function (L) {
                return '<button class="jsa-chip' + (L.id === pend.lvl ? ' sel' : '') + '" data-lvl="' + L.id + '">' + L.ico + ' ' + L.name + '<small>' + L.desc + '</small></button>';
            }).join('');
            $('.jsa-set-axis').innerHTML = AXES.map(function (A) {
                return '<button class="jsa-chip' + (A.id === pend.axisSet ? ' sel' : '') + '" data-axis="' + A.id + '">' + A.ico + ' ' + A.name + '<small>' + A.desc + '</small></button>';
            }).join('');
            $('.jsa-set-kind').innerHTML = KINDS.map(function (K) {
                return '<button class="jsa-chip' + (K.id === pend.kind ? ' sel' : '') + '" data-kind="' + K.id + '">' + K.ico + ' ' + K.name + '<small>' + K.desc + '</small></button>';
            }).join('');
            $('.jsa-set-src').innerHTML = SOURCES.map(function (O) {
                var off = O.id === 'dessin' && !dessinOK(pend.kind, pend.axisSet);
                return '<button class="jsa-chip' + (O.id === pend.src ? ' sel' : '') + (off ? ' off' : '') + '" data-src="' + O.id + '"' + (off ? ' title="Dessins disponibles pour « Cases » ou « Traits », avec l\'axe vertical"' : '') + '>' + O.ico + ' ' + O.name + '<small>' + (O.id === 'perso' && S.custom ? 'la reprendre / la modifier' : O.desc) + '</small></button>';
            }).join('');
            $('.jsa-set-coords').checked = pend.coords;
            $('.jsa-set-aid').checked = pend.aid;
            $('.jsa-set-zone').checked = pend.zone;
            $('.jsa-set-play').textContent = pend.src === 'perso' ? '✍️ Dessiner la figure' : '▶ Jouer';
        }
        $('.jsa-set-lvl').addEventListener('click', function (e) { var b = e.target.closest('[data-lvl]'); if (!b) return; pend.lvl = b.dataset.lvl; renderSettings(); });
        $('.jsa-set-axis').addEventListener('click', function (e) { var b = e.target.closest('[data-axis]'); if (!b) return; pend.axisSet = b.dataset.axis; renderSettings(); });
        $('.jsa-set-kind').addEventListener('click', function (e) { var b = e.target.closest('[data-kind]'); if (!b) return; pend.kind = b.dataset.kind; renderSettings(); });
        $('.jsa-set-src').addEventListener('click', function (e) {
            var b = e.target.closest('[data-src]'); if (!b) return;
            if (b.dataset.src === 'dessin' && !dessinOK(pend.kind, pend.axisSet)) return;
            pend.src = b.dataset.src; renderSettings();
        });
        ['coords', 'aid', 'zone'].forEach(function (k) {
            var inp = $('.jsa-set-' + k);
            inp.addEventListener('change', function () { pend[k] = this.checked; });
            ['pointerdown', 'mousedown'].forEach(function (t) { inp.addEventListener(t, function (e) { e.stopPropagation(); }); });
        });
        $('.jsa-set-play').addEventListener('click', function () {
            S.lvl = pend.lvl; S.kind = pend.kind; S.axisSet = pend.axisSet; S.coords = pend.coords; S.aid = pend.aid; S.zone = pend.zone;
            var wasPerso = S.src === 'perso';
            S.src = pend.src;
            S.modelName = '';
            if (S.src === 'perso') {
                openEditor();
                if (wasPerso && S.custom) setMsg('Ta figure est prête : modifie-la ou appuie sur ▶ Jouer.');
            } else {
                newGame(false);
                save();
            }
        });

        root.addEventListener('click', function (e) {
            if (e.target.closest('.jsa-x')) { hideOv(); return; }
            if (e.target.classList.contains('jsa-ov') && !$('.jsa-ov-win').classList.contains('show')) hideOv();
        });
        $('.jsa-lvlbtn').addEventListener('click', openSettings);
        $('.jsa-tools').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
        $('.jsa-pal').addEventListener('click', function (e) { var b = e.target.closest('[data-col]'); if (b) setColor(b.dataset.col); });
        $('.jsa-axes').addEventListener('click', function (e) {
            var b = e.target.closest('[data-axis]'); if (!b || !S.editing) return;
            S.axis = b.dataset.axis; S.anchor = null;
            renderTools(); render(); updateUI(); save();
        });
        $('.jsa-undo').addEventListener('click', undo);
        $('.jsa-clear').addEventListener('click', clearAll);
        $('.jsa-check').addEventListener('click', check);
        $('.jsa-calque').addEventListener('click', toggleCalque);
        $('.jsa-new').addEventListener('click', function () { if (S.src === 'perso') openEditor(); else { newGame(false); save(); } });
        $('.jsa-editdone').addEventListener('click', finishEditor);
        root.querySelectorAll('.jsa-sz').forEach(function (b) { b.addEventListener('click', function () { resizeEditor(+b.dataset.d); }); });
        $('.jsa-w-replay').addEventListener('click', function () { newGame(true); save(); });
        $('.jsa-w-new').addEventListener('click', function () { if (S.src === 'perso') openEditor(); else { newGame(false); save(); } });
        $('.jsa-w-set').addEventListener('click', openSettings);
        $('.jsa-help').addEventListener('click', function () { showOv('.jsa-ov-help'); });
        $('.jsa-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });

        // Clavier : Ctrl+Z, 1-9 pour la couleur, C/T/G pour les outils, Échap
        root.addEventListener('keydown', function (e) {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); e.stopPropagation(); return; }
            if (e.key === 'Escape') { hideOv(); S.anchor = null; hideGhost(); return; }
            if (root.querySelector('.jsa-ov.show') || e.ctrlKey || e.metaKey || e.altKey) return;
            var pal = S.editing ? COLORS.map(function (c) { return c.k; }) : S.palette;
            if (/^[1-9]$/.test(e.key) && pal[+e.key - 1]) { setColor(pal[+e.key - 1]); e.preventDefault(); e.stopPropagation(); return; }
            var map = { c: 'paint', t: 'line', g: 'erase' }, t = map[e.key.toLowerCase()];
            if (t && toolsFor().some(function (x) { return x.id === t; })) { setTool(t); e.preventDefault(); e.stopPropagation(); }
        });

        // ── Boutons fenêtre : réduire / plein écran / fermer ─────────────
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv();
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '🪞 Symétrie axiale', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jsa-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jsaZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jsaZ || '';
            applySize();
            requestAnimationFrame(layout);
            save();
        });
        $('.wf-btn-close').addEventListener('click', function (e) {
            e.stopPropagation();
            clearInterval(timer);
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} }
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            widget.remove();
            save();
        });

        // ── Redimensionnement par la poignée ─────────────────────────────
        var grip = $('.jsa-grip'), rs = null;
        grip.addEventListener('pointerdown', function (e) {
            e.preventDefault(); e.stopPropagation();
            rs = { x: e.clientX, y: e.clientY, w: root.offsetWidth, h: root.offsetHeight, id: e.pointerId,
                   k: root.getBoundingClientRect().width / root.offsetWidth || 1 };
            try { grip.setPointerCapture(e.pointerId); } catch (er) {}
        });
        grip.addEventListener('pointermove', function (e) {
            if (!rs || e.pointerId !== rs.id) return;
            S.w = Math.max(MIN_W, Math.round(rs.w + (e.clientX - rs.x) / rs.k));
            S.h = Math.max(MIN_H, Math.round(rs.h + (e.clientY - rs.y) / rs.k));
            applySize();
        });
        function endResize(e) { if (!rs || e.pointerId !== rs.id) return; rs = null; save(); }
        grip.addEventListener('pointerup', endResize);
        grip.addEventListener('pointercancel', endResize);

        if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(root);
        else window.addEventListener('resize', layout);

        // ── Données pour la sauvegarde du tableau (save-load.js) ─────────
        widget._jsaGetData = function () {
            return {
                v: 1, lvl: S.lvl, kind: S.kind, src: S.src, axisSet: S.axisSet, axis: S.axis,
                coords: S.coords, aid: S.aid, zone: S.zone,
                n: S.n, given: cloneModel(S.given), modelName: S.modelName,
                player: S.won ? null : cloneModel(S.player),
                custom: S.custom ? { n: S.custom.n, axis: S.custom.axis, cells: Object.assign({}, S.custom.cells), segs: cloneModel(S.custom).segs } : null,
                editing: S.editing, color: S.color, tool: S.tool,
                time: S.won ? 0 : S.time, checks: S.won ? 0 : S.checks, peeked: S.won ? false : S.peeked,
                w: S.w, h: S.h, fullboard: S.fullboard
            };
        };
        function validAxis(a) { return a && a !== 'auto' && byId(AXES, a, null) ? a : 'V'; }
        function restore(d) {
            S.lvl = lvlById(d.lvl).id;
            S.kind = byId(KINDS, d.kind, KINDS[0]).id;
            S.src = byId(SOURCES, d.src, SOURCES[0]).id;
            S.axisSet = byId(AXES, d.axisSet, AXES[0]).id;
            S.axis = validAxis(d.axis);
            if (typeof d.coords === 'boolean') S.coords = d.coords;
            if (typeof d.aid === 'boolean') S.aid = d.aid;
            if (typeof d.zone === 'boolean') S.zone = d.zone;
            if (d.custom && d.custom.n >= 4 && d.custom.n <= 12) {
                var cm = sanitizeModel(d.custom, d.custom.n);
                S.custom = { n: d.custom.n, axis: validAxis(d.custom.axis), cells: cm.cells, segs: cm.segs };
            }
            if (S.src === 'perso' && !S.custom && !d.editing) S.src = 'hasard';
            if (COL[d.color]) S.color = d.color;
            if (d.tool) S.tool = d.tool;
            var n = Math.max(4, Math.min(12, +d.n || lvlById(S.lvl).n));
            var m = sanitizeModel(d.given, n);
            if (d.editing) {
                S.n = n; S.given = m; S.modelName = 'Mon modèle';
                S.editing = true; S.history = [];
                refreshMode();
                return;
            }
            if (isEmpty(m)) { newGame(false); return; }
            S.n = n; S.given = m; S.modelName = d.modelName || '';
            newGame(true);
            if (d.player) {
                S.player = sanitizeModel(d.player, n);
                S.time = +d.time || 0; S.checks = +d.checks || 0; S.peeked = !!d.peeked;
                S.started = !isEmpty(S.player);
                renderTools(); render(); updateUI();
            }
        }

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('jsa-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        if (data.lvl) restore(data); else newGame(false);
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        // Sur téléphone, une partie lancée depuis le panneau s'ouvre directement
        // en plein écran (bouton vert), comme le Taquin
        if (!data.lvl && isPhone() && !S.fullboard) {
            requestAnimationFrame(function () { $('.wf-btn-max').click(); });
        }
        function isPhone() {
            if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
            return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
        }
    }

    // =====================================================================
    // Création : depuis le panneau Jeux (createWidget) ou à la restauration
    // =====================================================================
    window.createJeuSymetrieAxialeWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        window._jsaNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jsaNextPendingData = null;
        }
        if (w && !w._jsaInit) initSym(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-symetrie-axiale') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jsaHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jsaInit) initSym(w, window._jsaNextPendingData || null);
            return w;
        };
        // Conserver les marqueurs des autres jeux qui ont déjà enveloppé createWidget
        Object.keys(orig).forEach(function (k) { wrapped[k] = orig[k]; });
        wrapped._jsaHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests
    window._jsaTest = { pieces: pieces, compare: compare, orbitModel: orbitModel, transforms: transforms, inSrcCell: inSrcCell, HALF_PIX: HALF_PIX, HALF_FIG: HALF_FIG, fitHalfPix: fitHalfPix, fitHalfFig: fitHalfFig, randCells: randCells, randSegs: randSegs };
})();
