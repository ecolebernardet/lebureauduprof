// =========================================================================
// WIDGET JEU : REPRODUCTION SUR QUADRILLAGE — reproduire un modèle en couleurs
// -------------------------------------------------------------------------
// Panneau « Jeux » › rubrique « Jeux divers » (construit sur le modèle de
// widget-jeu-taquin.js : mêmes boutons fenêtre, même sauvegarde, même
// plein écran sur téléphone ; outils inspirés de widget-repro-quadrillage.js).
//
// • À gauche le MODÈLE, à droite le quadrillage vierge de l'élève.
// • 3 types : « Cases » (colorier des carreaux), « Traits » (tracer des
//   segments d'un nœud à l'autre), « Les deux ».
// • Plusieurs couleurs : palette avec les couleurs du modèle (+ couleurs
//   « pièges » à partir du niveau Facile).
// • 4 niveaux : Débutant (5×5, 2 couleurs), Facile (6×6, 3 couleurs),
//   Moyen (8×8, 4 couleurs), Difficile (10×10, 5 couleurs, traits obliques).
// • Modèles : au hasard, un dessin de la bibliothèque, ou « Mon modèle »
//   (l'enseignant dessine lui-même le modèle, de 4×4 à 12×12).
// • Options : repères (A, B, C… / 1, 2, 3…), aide au repérage (la case
//   survolée est surlignée dans le modèle), défi symétrie (miroir).
// • Vérifier (les erreurs sont marquées), calque (voir le modèle par-dessus),
//   annuler (Ctrl+Z), effacer, victoire automatique, étoiles et records.
// • Sauvegarde du tableau via _jrqGetData / createJeuReproQuadrillageWidget(data)
//   (même mécanisme que le Taquin, cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-repro-quadrillage';
    var STORE_KEY = 'jrq-progress-v1';
    var DEF_W = 940, DEF_H = 600, MIN_W = 360, MIN_H = 420;

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

    var LEVELS = [
        { id: 'deb', name: 'Débutant',  ico: '🐣', n: 5,  colors: 2, cells: 6,  segs: 4,  cat: 0, extra: 0, cls: 'g1', desc: '5×5 · 2 couleurs' },
        { id: 'fac', name: 'Facile',    ico: '😊', n: 6,  colors: 3, cells: 10, segs: 6,  cat: 1, extra: 1, cls: 'g2', desc: '6×6 · 3 couleurs' },
        { id: 'moy', name: 'Moyen',     ico: '😐', n: 8,  colors: 4, cells: 17, segs: 8,  cat: 1, extra: 2, cls: 'g3', desc: '8×8 · 4 couleurs' },
        { id: 'dif', name: 'Difficile', ico: '😤', n: 10, colors: 5, cells: 28, segs: 11, cat: 2, extra: 9, cls: 'g4', desc: '10×10 · 5 couleurs' }
    ];
    var KINDS = [
        { id: 'cases',  name: 'Cases',    ico: '🟥', desc: 'colorier les carreaux' },
        { id: 'traits', name: 'Traits',   ico: '✏️', desc: 'tracer des segments' },
        { id: 'mixte',  name: 'Les deux', ico: '🎨', desc: 'cases + traits' }
    ];
    var SOURCES = [
        { id: 'hasard', name: 'Au hasard',  ico: '🎲', desc: 'un nouveau modèle' },
        { id: 'dessin', name: 'Un dessin',  ico: '🖼️', desc: 'maison, fusée…' },
        { id: 'perso',  name: 'Mon modèle', ico: '✍️', desc: 'je le dessine' }
    ];

    // ── Bibliothèque : dessins en cases (lettre = couleur, « . » = vide) ──
    var PIXELS = [
        { name: 'Cœur',        rows: ['.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..'] },
        { name: 'Sapin',       rows: ['..V..', '.VVV.', 'VVVVV', '..M..', '..M..'] },
        { name: 'Maison',      rows: ['..R..', '.RRR.', 'RRRRR', '.JBJ.', '.JMJ.'] },
        { name: 'Champignon',  rows: ['.RRR.', 'RJRJR', 'RRRRR', '..M..', '.MMM.'] },
        { name: 'Fleur',       rows: ['.S.S.', 'SSJSS', '.SSS.', '..V..', '.VV..'] },
        { name: 'Bateau',      rows: ['..R...', '..RR..', '..RRR.', '..K...', 'MMMMMM', '.MMMM.'] },
        { name: 'Glace',       rows: ['..SS..', '.SSSS.', '.VVVV.', '.OOOO.', '..OO..', '..OO..'] },
        { name: 'Arbre',       rows: ['..VV..', '.VVVV.', 'VVRVVV', '.VVVR.', '..MM..', '..MM..'] },
        { name: 'Soleil',      rows: ['J..O..J', '.JJJJJ.', '.JKJKJ.', 'OJJJJJO', '.JKKKJ.', '.JJJJJ.', 'J..O..J'] },
        { name: 'Smiley',      rows: ['..JJJJ..', '.JJJJJJ.', 'JJKJJKJJ', 'JJJJJJJJ', 'JKJJJJKJ', 'JJKKKKJJ', '.JJJJJJ.', '..JJJJ..'] },
        { name: 'Fusée',       rows: ['...RR...', '..RRRR..', '..BBBB..', '..BJJB..', '..BBBB..', '.RBBBBR.', 'RR.OO.RR', '...OO...'] },
        { name: 'Chat',        rows: ['O......O', 'OO....OO', 'OOOOOOOO', 'OKOOOOKO', 'OOOSSOOO', 'OOOKKOOO', '.OOOOOO.', '..OOOO..'] },
        { name: 'Voiture',     rows: ['..RRRR..', '.RBBBBR.', 'RRRRRRRJ', 'RRRRRRRR', '.KK..KK.'] },
        { name: 'Robot',       rows: ['....RR....', '....KK....', '.BBBBBBBB.', '.BJJBBJJB.', '.BJKBBKJB.', '.BBBBBBBB.', '.BBRRRRBB.', '.BBBBBBBB.', '..KK..KK..', '..KK..KK..'] },
        { name: 'Papillon',    rows: ['..K....K..', '...K..K...', 'SS..KK..SS', 'SUS.KK.SUS', 'SUUSKKSUUS', '.SUSKKSUS.', '..SSKKSS..', '.SJSKKSJS.', '.SSSKKSSS.'] },
        { name: 'Arc-en-ciel', rows: ['...RRRR...', '.RROOOORR.', '.ROJJJJOR.', 'ROJJVVJJOR', 'ROJV..VJOR', 'ROJV..VJOR'] },
        { name: 'Poisson',     rows: ['..........', '....BBB...', 'B..BBBBBB.', 'BBBBBBKBBB', 'BBBBBBBBBO', 'B..BBBBBB.', '....BBB...', '..........'] }
    ];
    // ── Bibliothèque : figures en traits (lignes brisées, coordonnées des nœuds) ──
    var FIGS = [
        { name: 'Croix',    w: 3, h: 3, lines: [['R', [1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1], [1, 0]]] },
        { name: 'Escalier', w: 4, h: 4, lines: [['B', [0, 4], [0, 3], [1, 3], [1, 2], [2, 2], [2, 1], [3, 1], [3, 0], [4, 0], [4, 4], [0, 4]]] },
        { name: 'Château',  w: 5, h: 5, lines: [['K', [0, 5], [0, 1], [1, 1], [1, 2], [2, 2], [2, 1], [3, 1], [3, 2], [4, 2], [4, 1], [5, 1], [5, 5], [0, 5]],
                                                ['R', [2, 5], [2, 3], [3, 3], [3, 5]]] },
        { name: 'Robot',    w: 4, h: 5, lines: [['B', [0, 1], [4, 1], [4, 4], [0, 4], [0, 1]], ['R', [1, 2], [1, 3], [3, 3], [3, 2], [1, 2]], ['K', [2, 1], [2, 0], [3, 0]], ['K', [1, 4], [1, 5]], ['K', [3, 4], [3, 5]]] },
        { name: 'Cœur',     w: 4, h: 4, lines: [['R', [2, 1], [1, 0], [0, 1], [0, 2], [2, 4], [4, 2], [4, 1], [3, 0], [2, 1]]] },
        { name: 'Maison',   w: 4, h: 5, lines: [['M', [0, 2], [0, 5], [4, 5], [4, 2], [0, 2]], ['R', [0, 2], [2, 0], [4, 2]], ['B', [1, 5], [1, 3], [2, 3], [2, 5]]] },
        { name: 'Flèche',   w: 5, h: 4, lines: [['V', [0, 1], [3, 1], [3, 0], [5, 2], [3, 4], [3, 3], [0, 3], [0, 1]]] },
        { name: 'Poisson',  w: 5, h: 4, lines: [['O', [1, 2], [3, 0], [5, 2], [3, 4], [1, 2]], ['B', [1, 2], [0, 1], [0, 3], [1, 2]]] },
        { name: 'Sapin',    w: 6, h: 6, lines: [['V', [3, 0], [1, 2], [2, 2], [0, 4], [6, 4], [4, 2], [5, 2], [3, 0]], ['M', [2, 4], [2, 6], [4, 6], [4, 4]]] },
        { name: 'Bateau',   w: 6, h: 6, lines: [['M', [0, 4], [6, 4], [5, 6], [1, 6], [0, 4]], ['K', [3, 4], [3, 0]], ['R', [3, 1], [5, 3], [3, 3]]] },
        { name: 'Fusée',    w: 4, h: 7, lines: [['R', [1, 2], [2, 0], [3, 2]], ['B', [1, 2], [1, 6], [3, 6], [3, 2], [1, 2]], ['V', [1, 4], [0, 6], [1, 6]], ['V', [3, 4], [4, 6], [3, 6]], ['O', [1, 6], [2, 7], [3, 6]]] },
        { name: 'Voiture',  w: 8, h: 5, lines: [['B', [0, 2], [2, 2], [3, 0], [6, 0], [7, 2], [8, 2], [8, 4], [0, 4], [0, 2]], ['K', [1, 4], [2, 5], [3, 4]], ['K', [5, 4], [6, 5], [7, 4]], ['U', [3, 2], [6, 2]]] },
        { name: 'Étoile',   w: 8, h: 8, lines: [['J', [4, 0], [5, 3], [8, 3], [6, 5], [7, 8], [4, 6], [1, 8], [2, 5], [0, 3], [3, 3], [4, 0]]] }
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

    // Un trait est découpé en « morceaux » élémentaires (d'un nœud au suivant
    // sur la droite) : tracer A→C ou A→B puis B→C revient au même.
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
    function stepCat(dx, dy) {
        if (!dx || !dy) return 0;
        return Math.abs(dx) === Math.abs(dy) ? 1 : 2;
    }
    function mirrorModel(m, n) {
        var out = emptyModel();
        Object.keys(m.cells).forEach(function (k) {
            var p = k.split(','), r = +p[0], c = +p[1];
            out.cells[r + ',' + (n - 1 - c)] = m.cells[k];
        });
        out.segs = m.segs.map(function (s) { return { a: [n - s.a[0], s.a[1]], b: [n - s.b[0], s.b[1]], c: s.c }; });
        return out;
    }
    function colorsOf(m) {
        var set = {};
        Object.keys(m.cells).forEach(function (k) { set[m.cells[k]] = 1; });
        m.segs.forEach(function (s) { set[s.c] = 1; });
        return COLORS.map(function (c) { return c.k; }).filter(function (k) { return set[k]; });
    }

    // Comparaison élève / cible
    function compare(target, player) {
        var r = { okCells: 0, badCells: {}, missCells: 0, okSegs: 0, badSegs: {}, missSegs: 0, total: 0 };
        Object.keys(target.cells).forEach(function (k) {
            r.total++;
            if (player.cells[k] === target.cells[k]) r.okCells++;
            else if (!player.cells[k]) r.missCells++;
        });
        Object.keys(player.cells).forEach(function (k) { if (player.cells[k] !== target.cells[k]) r.badCells[k] = 1; });
        var tp = pieces(target.segs), pp = pieces(player.segs);
        Object.keys(tp).forEach(function (k) {
            r.total++;
            if (pp[k] === tp[k]) r.okSegs++;
            else if (!pp[k]) r.missSegs++;
        });
        Object.keys(pp).forEach(function (k) { if (pp[k] !== tp[k]) r.badSegs[k] = 1; });
        r.nBad = Object.keys(r.badCells).length + Object.keys(r.badSegs).length;
        r.nMiss = r.missCells + r.missSegs;
        r.done = !r.nBad && !r.nMiss;
        return r;
    }

    // ── Fabrication des modèles ─────────────────────────────────────────
    function pickColors(k) { return shuffle(COLORS.map(function (c) { return c.k; })).slice(0, k); }

    function randCells(n, k, total, sym) {
        var cols = pickColors(k), cells = {}, W = sym ? Math.ceil(n / 2) : n;
        var goal = sym ? Math.max(k, Math.round(total / 2)) : total;
        var per = Math.max(1, Math.round(goal / k));
        cols.forEach(function (c) {
            var patch = [], tries = 0;
            while (!patch.length && tries++ < 200) {
                var r0 = rnd(n), c0 = rnd(W);
                if (!cells[r0 + ',' + c0]) { cells[r0 + ',' + c0] = c; patch.push([r0, c0]); }
            }
            tries = 0;
            while (patch.length && patch.length < per && tries++ < 500) {
                var p = patch[rnd(patch.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd(4)];
                var r = p[0] + d[0], cc = p[1] + d[1];
                if (r < 0 || cc < 0 || r >= n || cc >= W || cells[r + ',' + cc]) continue;
                cells[r + ',' + cc] = c; patch.push([r, cc]);
            }
        });
        if (sym) Object.keys(cells).forEach(function (key) {
            var p = key.split(','); cells[p[0] + ',' + (n - 1 - p[1])] = cells[key];
        });
        return cells;
    }

    function stepSet(cat, n) {
        var base = [], maxL = n <= 5 ? 2 : 3;
        for (var l = 1; l <= maxL; l++) base.push([l, 0], [0, l]);
        if (cat >= 1) { base.push([1, 1], [2, 2], [1, 1]); }
        if (cat >= 2) { base.push([2, 1], [1, 2], [2, 1], [1, 2]); }
        var out = [];
        base.forEach(function (v) { [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) { out.push([v[0] * s[0], v[1] * s[1]]); }); });
        return out;
    }
    function randSegs(n, k, total, cat) {
        var cols = pickColors(k), segs = [], used = {}, steps = stepSet(cat, n);
        var per = Math.max(2, Math.round(total / k));
        cols.forEach(function (c) {
            var cur = null, prev = null;
            for (var t = 0; t < 30 && !cur; t++) {
                var p = [rnd(n + 1), rnd(n + 1)], free = true;
                Object.keys(used).forEach(function (key) {
                    var q = key.split(',').map(Number);
                    if ((q[0] === p[0] && q[1] === p[1]) || (q[2] === p[0] && q[3] === p[1])) free = false;
                });
                if (free || t > 20) cur = p;
            }
            for (var j = 0; j < per; j++) {
                for (var tries = 0; tries < 40; tries++) {
                    var v = steps[rnd(steps.length)];
                    if (prev && v[0] * prev[0] + v[1] * prev[1] < 0 && v[0] * prev[1] === v[1] * prev[0]) continue;   // demi-tour
                    var b = [cur[0] + v[0], cur[1] + v[1]];
                    if (b[0] < 0 || b[1] < 0 || b[0] > n || b[1] > n) continue;
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

    function fitPixel(P, n) {
        var h = P.rows.length, w = P.rows[0].length, cells = {};
        var oR = Math.floor((n - h) / 2), oC = Math.floor((n - w) / 2);
        P.rows.forEach(function (row, r) {
            for (var c = 0; c < row.length; c++) if (COL[row[c]]) cells[(r + oR) + ',' + (c + oC)] = row[c];
        });
        return cells;
    }
    function fitFig(F, n) {
        var oX = Math.floor((n - F.w) / 2), oY = Math.floor((n - F.h) / 2), segs = [];
        F.lines.forEach(function (L) {
            for (var i = 2; i < L.length; i++) {
                segs.push({ a: [L[i - 1][0] + oX, L[i - 1][1] + oY], b: [L[i][0] + oX, L[i][1] + oY], c: L[0] });
            }
        });
        return segs;
    }
    function pixColors(P) { var s = {}; P.rows.join('').split('').forEach(function (ch) { if (COL[ch]) s[ch] = 1; }); return Object.keys(s).length; }
    function figCat(F) {
        var m = 0;
        F.lines.forEach(function (L) { for (var i = 2; i < L.length; i++) m = Math.max(m, stepCat(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1])); });
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
        if (document.getElementById('jrq-style')) return;
        var s = document.createElement('style');
        s.id = 'jrq-style';
        s.textContent = [
'.jrq-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#4f7df0 0%,#2f56c9 45%,#1c3486 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jrq-root *{box-sizing:border-box}',
'.jrq-root{cursor:move}.jrq-root .jrq-ov,.jrq-root .jrq-frame{cursor:default}',
'.jrq-root.jrq-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jrq-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête
'.jrq-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0))}',
'.jrq-title{font-weight:900;font-size:calc(21px*var(--ui));letter-spacing:.4px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jrq-title b{color:#ffd23f}',
'.jrq-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;min-width:0;overflow:hidden;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);font-family:inherit}',
'.jrq-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jrq-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap}',
'.jrq-pill.g1{background:#a3e635;color:#1a2e05}.jrq-pill.g2{background:#22c55e;color:#06321a}',
'.jrq-pill.g3{background:#38bdf8;color:#062a3a}.jrq-pill.g4{background:#f43f5e;color:#fff}.jrq-pill.g5{background:#ffd23f;color:#3a2a00}',
'.jrq-spacer{flex:1}',
'.jrq-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;font-weight:900;font-family:inherit;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0;padding:0}',
'.jrq-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jrq-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jrq-root.jrq-tall .jrq-body{flex-direction:column}',
'.jrq-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;gap:calc(10px*var(--ui));position:relative}',
'.jrq-stage.col{flex-direction:column}',
'.jrq-pane{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0}',
'.jrq-pane-lbl{font-weight:900;font-size:calc(13px*var(--ui));letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:6px;height:calc(20px*var(--ui));white-space:nowrap}',
'.jrq-pane-lbl .tag{background:rgba(0,0,0,.3);border-radius:999px;padding:1px 10px}',
'.jrq-pane.mine .jrq-pane-lbl .tag{background:#ffd23f;color:#3a2a00}',
'.jrq-frame{border-radius:12px;padding:calc(6px*var(--ui));background:linear-gradient(145deg,#8a5a32,#5b3818);',
'  box-shadow:0 8px 20px rgba(0,0,0,.4),inset 0 0 0 2px rgba(255,255,255,.1),inset 0 2px 0 rgba(255,255,255,.18)}',
'.jrq-svg{display:block;border-radius:6px;background:#fff;touch-action:none}',
'.jrq-pane.mine .jrq-svg{cursor:crosshair}',
'.jrq-pane.edit .jrq-frame{background:linear-gradient(145deg,#ffd23f,#e0a800)}',
'.jrq-axis{display:none;align-self:stretch;align-items:center;justify-content:center;flex-direction:column;gap:6px;font-size:calc(18px*var(--ui))}',
'.jrq-axis::before,.jrq-axis::after{content:"";flex:1;border-left:3px dashed rgba(255,255,255,.55)}',
'.jrq-stage.mirror .jrq-axis{display:flex}',
'.jrq-stage.col .jrq-axis{display:none!important}',
// Panneau latéral
'.jrq-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(236px*var(--ui))}',
'.jrq-root.jrq-tall .jrq-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px}',
'.jrq-stats{display:flex;gap:6px}',
'.jrq-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 4px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.jrq-stat small{display:block;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;opacity:.8;text-transform:uppercase}',
'.jrq-stat span{display:block;font-size:calc(22px*var(--ui));font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}',
'.jrq-stat.jrq-st-time span{color:#ffd23f}',
'.jrq-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jrq-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jrq-stars .off{color:rgba(255,255,255,.25)}',
'.jrq-box{background:rgba(0,0,0,.22);border-radius:14px;padding:calc(7px*var(--ui));display:flex;flex-direction:column;gap:calc(6px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
'.jrq-root.jrq-tall .jrq-box{flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center}',
'.jrq-tools{display:flex;gap:5px}',
'.jrq-tool{flex:1;border:none;cursor:pointer;border-radius:10px;padding:calc(5px*var(--ui)) 4px;font-family:inherit;font-weight:800;font-size:calc(12px*var(--ui));',
'  background:rgba(255,255,255,.14);color:#fff;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);white-space:nowrap}',
'.jrq-tool i{font-style:normal;font-size:calc(18px*var(--ui));line-height:1.1}',
'.jrq-tool:hover{background:rgba(255,255,255,.24)}',
'.jrq-tool.sel{background:#fff;color:#1c3486;box-shadow:0 0 0 2px #ffd23f}',
'.jrq-tool.sel.gomme{background:#ffedd5;color:#9a3412}',
'.jrq-pal{display:flex;flex-wrap:wrap;gap:calc(5px*var(--ui));justify-content:center}',
'.jrq-sw{width:calc(30px*var(--ui));height:calc(30px*var(--ui));border-radius:50%;border:3px solid rgba(255,255,255,.85);cursor:pointer;padding:0;',
'  box-shadow:0 2px 0 rgba(0,0,0,.3);transition:transform .1s;position:relative;font-size:calc(10px*var(--ui));font-weight:900;color:rgba(255,255,255,.9);font-family:inherit}',
'.jrq-sw:hover{transform:scale(1.1)}',
'.jrq-sw.sel{transform:scale(1.18);border-color:#ffd23f;box-shadow:0 0 0 3px rgba(255,210,63,.45),0 2px 0 rgba(0,0,0,.3)}',
'.jrq-sw.sel::after{content:"✓";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(15px*var(--ui));text-shadow:0 1px 2px rgba(0,0,0,.6)}',
'.jrq-palname{text-align:center;font-size:calc(11px*var(--ui));font-weight:800;opacity:.85;min-height:1.2em}',
'.jrq-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jrq-root.jrq-tall .jrq-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jrq-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#1c3486;background:#eef3ff;box-shadow:0 3px 0 #a9bbea;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jrq-btn:hover{filter:brightness(1.05)}.jrq-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #a9bbea}',
'.jrq-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jrq-btn.jrq-check{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jrq-btn.jrq-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jrq-btn.jrq-on{background:#1c3486;color:#fff;box-shadow:0 3px 0 #0b1a4a}',
'.jrq-btn.wide{grid-column:1 / -1}',
'.jrq-size{display:none;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:calc(13px*var(--ui))}',
'.jrq-root.jrq-editing .jrq-size{display:flex}',
'.jrq-size button{width:28px;height:28px;border-radius:8px;border:none;background:#eef3ff;color:#1c3486;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 2px 0 #a9bbea}',
'.jrq-size b{min-width:46px;text-align:center;font-size:calc(16px*var(--ui))}',
'.jrq-goal{font-size:calc(12px*var(--ui));opacity:.92;text-align:center;line-height:1.3}',
'.jrq-goal b{color:#ffe48a}',
'.jrq-msg{min-height:1.3em;font-size:calc(12px*var(--ui));text-align:center;font-weight:800;color:#ffe48a;line-height:1.3}',
'.jrq-root.jrq-tall .jrq-goal{display:none}',
'.jrq-root.jrq-editing .jrq-playonly{display:none!important}',
'.jrq-root:not(.jrq-editing) .jrq-editonly{display:none!important}',
// SVG
'.jrq-svg .lbl{font:900 0.42px "Nunito",sans-serif;fill:#64748b}',
'.jrq-svg .hl{fill:none;stroke:#f59e0b;stroke-width:.09;pointer-events:none}',
'.jrq-svg .hlband{fill:rgba(250,204,21,.16);pointer-events:none}',
'.jrq-svg .ghost{pointer-events:none}',
'.jrq-svg .bad{animation:jrqBlink .9s ease-in-out 3}',
'@keyframes jrqBlink{50%{opacity:.25}}',
'.jrq-svg.done{animation:jrqWin .6s ease}',
'@keyframes jrqWin{40%{transform:scale(1.04)}}',
// Fenêtres superposées
'.jrq-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(12,26,74,.78);backdrop-filter:blur(3px);padding:14px}',
'.jrq-ov.show{display:flex}',
'.jrq-card{position:relative;background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jrq-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#1c3486}',
'.jrq-card h4{margin:12px 0 6px;font-size:calc(13px*var(--ui));font-weight:900;color:#1c3486;text-transform:uppercase;letter-spacing:1px;text-align:left}',
'.jrq-chips{display:flex;flex-wrap:wrap;gap:6px}',
'.jrq-chip{border:2px solid #d3ddf6;cursor:pointer;border-radius:12px;padding:6px 10px;font-weight:800;font-size:calc(13px*var(--ui));background:#f4f7ff;color:#1c3486;font-family:inherit;line-height:1.2}',
'.jrq-chip small{display:block;font-size:.78em;opacity:.7;font-weight:700}',
'.jrq-chip.sel{border-color:#1c3486;background:#1c3486;color:#fff}',
'.jrq-chip.off{opacity:.4}',
'.jrq-check{display:flex;align-items:center;gap:6px;margin-top:7px;font-weight:700;font-size:calc(13px*var(--ui));color:#345;cursor:pointer;text-align:left}',
'.jrq-check input{width:18px;height:18px;accent-color:#1c3486;flex-shrink:0}',
'.jrq-card .jrq-btn{box-shadow:0 3px 0 #c3cfee;background:#eef3ff}',
'.jrq-card .jrq-btn.jrq-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jrq-card-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}',
'.jrq-x{position:absolute;top:10px;right:10px;background:#1c3486!important}',
'.jrq-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jrq-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jrqPop .5s backwards}',
'.jrq-win-stars .off{color:#d7e0f3}',
'@keyframes jrqPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jrq-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 4px;color:#345;line-height:1.45}',
'.jrq-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jrqFall linear forwards;z-index:21}',
'@keyframes jrqFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jrq-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jrq-grip:hover{opacity:1}',
'.jrq-root.jrq-fullboard .jrq-grip,.widget.phone-fs .jrq-grip{display:none}',
// Format étroit
'.jrq-root.jrq-narrow .jrq-head{gap:6px;padding:8px 8px 6px 10px}',
'.jrq-root.jrq-narrow .jrq-title .jrq-tt{display:none}',
'.jrq-root.jrq-narrow .jrq-lvlword{display:none}',
'.jrq-root.jrq-narrow .jrq-icon{width:24px;height:24px;font-size:12px}',
'.jrq-root.jrq-narrow .jrq-help{display:none}',
'.jrq-root.jrq-narrow .jrq-tool span{display:none}',
'.jrq-root.jrq-tall .jrq-palname{display:none}',
'.jrq-root.jrq-tall .jrq-tool span{display:none}',
'.jrq-root.jrq-tall .jrq-tool{flex:0 0 auto;padding:4px 8px}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .jrq-root.jrq-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
'    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}',
'}',
'@media (prefers-reduced-motion: reduce){.jrq-root *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
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
    function lvlById(id) { return byId(LEVELS, id, LEVELS[1]); }
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

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initRepro(widget, data) {
        if (!widget || widget._jrqInit) return;
        widget._jrqInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            lvl: 'deb', kind: 'cases', src: 'hasard', mirror: false, coords: true, aid: true,
            n: 5, model: emptyModel(), player: emptyModel(), target: emptyModel(), palette: [],
            custom: null, editing: false, modelName: '',
            tool: 'paint', color: 'R', history: [],
            time: 0, checks: 0, peeked: false, started: false, won: false,
            calque: false, marks: null, hl: null, anchor: null,
            w: DEF_W, h: DEF_H, fullboard: false
        };

        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jrq-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jrq-head">' +
                '<div class="jrq-title">🖍️<span class="jrq-tt"> <b>Reproduis</b> le modèle</span></div>' +
                '<button class="jrq-lvlbtn" title="Choisir le niveau et le modèle"><span class="jrq-pill"></span><span class="jrq-lvltxt"></span> ▾</button>' +
                '<div class="jrq-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jrq-icon jrq-sound" title="Son"></button>' +
                    '<button class="jrq-icon jrq-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jrq-body">' +
                '<div class="jrq-stage">' +
                    '<div class="jrq-pane model"><div class="jrq-pane-lbl"><span class="tag jrq-lbl-model">Modèle</span></div><div class="jrq-frame"><svg class="jrq-svg jrq-svg-model"></svg></div></div>' +
                    '<div class="jrq-axis" title="Axe de symétrie">🪞</div>' +
                    '<div class="jrq-pane mine"><div class="jrq-pane-lbl"><span class="tag jrq-lbl-mine">À toi !</span></div><div class="jrq-frame"><svg class="jrq-svg jrq-svg-mine"></svg></div></div>' +
                '</div>' +
                '<div class="jrq-side">' +
                    '<div class="jrq-stats jrq-playonly">' +
                        '<div class="jrq-stat jrq-st-time"><small>Temps</small><span class="jrq-v-time">0:00</span></div>' +
                        '<div class="jrq-stat"><small>Vérif.</small><span class="jrq-v-checks">0</span></div>' +
                        '<div class="jrq-stat"><small>Record</small><span class="jrq-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="jrq-stars jrq-playonly"></div>' +
                    '<div class="jrq-size jrq-editonly"><button class="jrq-sz" data-d="-1" title="Moins de carreaux">−</button><b class="jrq-v-size">6×6</b><button class="jrq-sz" data-d="1" title="Plus de carreaux">+</button></div>' +
                    '<div class="jrq-box">' +
                        '<div class="jrq-tools"></div>' +
                        '<div class="jrq-pal"></div>' +
                        '<div class="jrq-palname"></div>' +
                    '</div>' +
                    '<div class="jrq-btns">' +
                        '<button class="jrq-btn jrq-undo" title="Annuler (Ctrl+Z)">↶ Annuler</button>' +
                        '<button class="jrq-btn jrq-clear" title="Tout effacer">🗑️ Effacer</button>' +
                        '<button class="jrq-btn jrq-check jrq-playonly" title="Vérifier ma reproduction">✔ Vérifier</button>' +
                        '<button class="jrq-btn jrq-calque jrq-playonly" title="Voir le modèle en transparence sur ma grille">👁 Calque</button>' +
                        '<button class="jrq-btn jrq-go jrq-new wide jrq-playonly" title="Un autre modèle">🔀 Nouveau modèle</button>' +
                        '<button class="jrq-btn jrq-go jrq-editdone wide jrq-editonly" title="Faire jouer avec ce modèle">▶ Jouer avec ce modèle</button>' +
                    '</div>' +
                    '<div class="jrq-goal"></div>' +
                    '<div class="jrq-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jrq-ov jrq-ov-set"><div class="jrq-card" style="max-width:480px;"><button class="jrq-icon jrq-x">✕</button><h3>Choisis ton modèle</h3>' +
                '<h4>Niveau</h4><div class="jrq-chips jrq-set-lvl"></div>' +
                '<h4>À reproduire</h4><div class="jrq-chips jrq-set-kind"></div>' +
                '<h4>Modèle</h4><div class="jrq-chips jrq-set-src"></div>' +
                '<label class="jrq-check"><input type="checkbox" class="jrq-set-coords"> Afficher les repères (A, B, C… et 1, 2, 3…)</label>' +
                '<label class="jrq-check"><input type="checkbox" class="jrq-set-aid"> Aide au repérage : la case visée s\'allume aussi dans le modèle</label>' +
                '<label class="jrq-check"><input type="checkbox" class="jrq-set-mirror"> 🪞 Défi symétrie : reproduire le modèle en miroir</label>' +
                '<div class="jrq-card-btns"><button class="jrq-btn jrq-go jrq-set-play">▶ Jouer</button></div></div></div>' +
            '<div class="jrq-ov jrq-ov-win"><div class="jrq-card"><h3 class="jrq-win-title">Bravo !</h3><div class="jrq-win-stars"></div><div class="jrq-win-txt"></div>' +
                '<div class="jrq-card-btns"><button class="jrq-btn jrq-w-replay">↺ Refaire ce modèle</button><button class="jrq-btn jrq-w-set">☰ Changer</button><button class="jrq-btn jrq-go jrq-w-new">🔀 Nouveau modèle</button></div></div></div>' +
            '<div class="jrq-ov jrq-ov-help"><div class="jrq-card" style="max-width:460px;text-align:left;"><button class="jrq-icon jrq-x">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> reproduire exactement le <b>modèle</b> (à gauche) dans <b>ta grille</b> (à droite), avec les mêmes couleurs, au même endroit.</p>' +
                '<p style="margin:6px 0;">🎨 Choisis d\'abord une <b>couleur</b> dans la palette (touches 1 à 9).</p>' +
                '<p style="margin:6px 0;">🖌️ <b>Colorier</b> : touche une case (ou glisse sur plusieurs cases). Retoucher une case de la même couleur l\'efface.</p>' +
                '<p style="margin:6px 0;">✏️ <b>Tracer</b> : appuie sur un point de la grille et glisse jusqu\'à un autre point (ou touche les deux points l\'un après l\'autre).</p>' +
                '<p style="margin:6px 0;">🧽 <b>Gomme</b> : touche une case ou un trait pour l\'effacer.</p>' +
                '<p style="margin:6px 0;">💡 Astuce : compte les carreaux à partir d\'un coin ou utilise les <b>repères</b> (A1, B3…).</p>' +
                '<p style="margin:6px 0;">⭐ 3 étoiles sans aide, 2 étoiles avec 1 ou 2 vérifications, 1 étoile avec le calque.</p></div></div>' +
            '<div class="jrq-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var stageEl = $('.jrq-stage'), svgModel = $('.jrq-svg-model'), svgMine = $('.jrq-svg-mine');
        var paneModel = $('.jrq-pane.model'), paneMine = $('.jrq-pane.mine');

        // ── Déplacement du widget : comme Simon, on peut l'attraper n'importe où,
        //    sauf sur les zones de jeu, les boutons, les champs et les fenêtres.
        var NO_DRAG = '.jrq-frame, .jrq-ov, .jrq-grip, button, input, select, textarea, label, a';
        function isolate(e) {
            if ((e.type === 'pointerdown' || e.type === 'mousedown') && typeof bringToFront === 'function') {
                try { bringToFront(widget); } catch (er) {}
            }
            var fixe = S.fullboard || widget.classList.contains('phone-fs');   // plein écran : rien à déplacer
            if (!fixe && e.target.closest && !e.target.closest(NO_DRAG)) return;   // le tableau déplace le widget
            e.stopPropagation();
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.jrq-head button').forEach(function (b) {
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
            root.classList.toggle('jrq-narrow', W < 640);
            root.classList.toggle('jrq-tall', W < H * 1.25);
            var sw = stageEl.clientWidth, sh = stageEl.clientHeight;
            var lab = 24 * ui, gap = 10 * ui + (S.mirror ? 26 * ui : 0), fr = 2 * 6 * ui;
            var size, col = false;
            if (S.editing) {
                size = Math.min(sw, sh - lab) - fr;
            } else {
                var row = Math.min((sw - gap) / 2, sh - lab) - fr;
                var stk = Math.min(sw, (sh - 10 * ui) / 2 - lab) - fr;
                col = stk > row * 1.08;
                size = col ? stk : row;
            }
            size = Math.max(90, Math.floor(size));
            stageEl.classList.toggle('col', col);
            [svgModel, svgMine].forEach(function (s) { s.style.width = size + 'px'; s.style.height = size + 'px'; });
        }

        // ── Dessin des grilles (SVG) ─────────────────────────────────────
        function padOf() { return S.coords ? 0.7 : 0.14; }
        function svgString(m, o) {
            var n = S.n, p = padOf(), q = (S.coords && S.kind === 'traits') ? 0.4 : 0.14, h = '';
            var showNodes = S.kind !== 'cases';
            // fond
            h += '<rect x="0" y="0" width="' + n + '" height="' + n + '" fill="#fff"/>';
            // bandes de repérage (ligne/colonne visée)
            h += '<rect class="hlband hb-r" x="0" y="0" width="' + n + '" height="1" style="display:none"/>';
            h += '<rect class="hlband hb-c" x="0" y="0" width="1" height="' + n + '" style="display:none"/>';
            // cases colorées
            Object.keys(m.cells).forEach(function (k) {
                var a = k.split(','), c = COL[m.cells[k]];
                if (c) h += '<rect x="' + a[1] + '" y="' + a[0] + '" width="1" height="1" fill="' + c.hex + '"/>';
            });
            // quadrillage
            var g = '';
            for (var i = 1; i < n; i++) {
                g += 'M' + i + ' 0V' + n + 'M0 ' + i + 'H' + n;
            }
            h += '<path d="' + g + '" stroke="#b9c6e4" stroke-width="0.035" fill="none"/>';
            h += '<rect x="0" y="0" width="' + n + '" height="' + n + '" fill="none" stroke="#475569" stroke-width="0.07"/>';
            // calque (modèle en transparence)
            if (o.ghost) {
                h += '<g class="ghost" opacity="0.42">';
                Object.keys(o.ghost.cells).forEach(function (k) {
                    var a = k.split(','), c = COL[o.ghost.cells[k]];
                    h += '<rect x="' + (+a[1] + 0.12) + '" y="' + (+a[0] + 0.12) + '" width="0.76" height="0.76" rx="0.12" fill="' + c.hex + '"/>';
                });
                o.ghost.segs.forEach(function (s) {
                    h += '<line x1="' + s.a[0] + '" y1="' + s.a[1] + '" x2="' + s.b[0] + '" y2="' + s.b[1] + '" stroke="' + COL[s.c].hex + '" stroke-width="0.1" stroke-dasharray="0.18 0.14" stroke-linecap="round"/>';
                });
                h += '</g>';
            }
            // traits
            m.segs.forEach(function (s, i) {
                h += '<line data-i="' + i + '" x1="' + s.a[0] + '" y1="' + s.a[1] + '" x2="' + s.b[0] + '" y2="' + s.b[1] + '" stroke="' + COL[s.c].hex + '" stroke-width="0.14" stroke-linecap="round"/>';
            });
            // nœuds (points d'accroche)
            if (showNodes && o.nodes) {
                var d = '';
                for (var x = 0; x <= n; x++) for (var y = 0; y <= n; y++) d += 'M' + x + ' ' + y + 'h0';
                h += '<path d="' + d + '" stroke="#94a3b8" stroke-width="0.11" stroke-linecap="round" fill="none" pointer-events="none"/>';
            }
            // marques d'erreur
            if (o.marks) {
                h += '<g class="bad" pointer-events="none">';
                Object.keys(o.marks.badCells).forEach(function (k) {
                    var a = k.split(','), x = +a[1], y = +a[0];
                    h += '<path d="M' + (x + 0.2) + ' ' + (y + 0.2) + 'L' + (x + 0.8) + ' ' + (y + 0.8) + 'M' + (x + 0.8) + ' ' + (y + 0.2) + 'L' + (x + 0.2) + ' ' + (y + 0.8) + '" stroke="#fff" stroke-width="0.22" stroke-linecap="round"/>';
                    h += '<path d="M' + (x + 0.2) + ' ' + (y + 0.2) + 'L' + (x + 0.8) + ' ' + (y + 0.8) + 'M' + (x + 0.8) + ' ' + (y + 0.2) + 'L' + (x + 0.2) + ' ' + (y + 0.8) + '" stroke="#dc2626" stroke-width="0.12" stroke-linecap="round"/>';
                });
                Object.keys(o.marks.badSegs).forEach(function (k) {
                    var a = k.split(',').map(Number);
                    h += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + a[2] + '" y2="' + a[3] + '" stroke="#dc2626" stroke-width="0.3" stroke-linecap="round" opacity="0.55"/>';
                    var mx = (a[0] + a[2]) / 2, my = (a[1] + a[3]) / 2;
                    h += '<circle cx="' + mx + '" cy="' + my + '" r="0.2" fill="#dc2626" stroke="#fff" stroke-width="0.05"/>';
                    h += '<path d="M' + (mx - 0.08) + ' ' + (my - 0.08) + 'l0.16 0.16m0 -0.16l-0.16 0.16" stroke="#fff" stroke-width="0.06"/>';
                });
                h += '</g>';
            }
            // surlignage de la case / du point visé
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
            return { vb: (-p) + ' ' + (-p) + ' ' + (n + p + q) + ' ' + (n + p + q), html: h };
        }
        function renderSvg(svg, m, o) {
            var r = svgString(m, o);
            svg.setAttribute('viewBox', r.vb);
            svg.innerHTML = r.html;
        }
        function render() {
            if (S.editing) {
                renderSvg(svgModel, S.model, { nodes: true });
            } else {
                renderSvg(svgModel, S.model, { nodes: false });
                renderSvg(svgMine, S.player, { nodes: true, ghost: S.calque ? S.target : null, marks: S.marks });
            }
            if (S.anchor) showAnchor(S.anchor);
        }

        // ── Palette et outils ────────────────────────────────────────────
        function toolsFor() {
            var t = [];
            if (S.kind !== 'traits') t.push({ id: 'paint', ico: '🖌️', name: 'Colorier' });
            if (S.kind !== 'cases') t.push({ id: 'line', ico: '✏️', name: 'Tracer' });
            t.push({ id: 'erase', ico: '🧽', name: 'Gomme' });
            return t;
        }
        function renderTools() {
            var list = toolsFor();
            if (!list.some(function (t) { return t.id === S.tool; })) S.tool = list[0].id;
            $('.jrq-tools').innerHTML = list.map(function (t) {
                return '<button class="jrq-tool' + (t.id === S.tool ? ' sel' : '') + (t.id === 'erase' ? ' gomme' : '') + '" data-tool="' + t.id + '" title="' + t.name + '"><i>' + t.ico + '</i><span>' + t.name + '</span></button>';
            }).join('');
            var pal = S.editing ? COLORS.map(function (c) { return c.k; }) : S.palette;
            if (pal.indexOf(S.color) < 0) S.color = pal[0] || 'R';
            $('.jrq-pal').innerHTML = pal.map(function (k, i) {
                return '<button class="jrq-sw' + (k === S.color ? ' sel' : '') + '" data-col="' + k + '" title="' + COL[k].name + ' (' + (i + 1) + ')" style="background:' + COL[k].hex + '"></button>';
            }).join('');
            $('.jrq-palname').textContent = S.tool === 'erase' ? 'Gomme' : 'Couleur : ' + COL[S.color].name;
            paneMine.querySelector('.jrq-svg').style.cursor = S.tool === 'erase' ? 'cell' : 'crosshair';
        }
        function setTool(t) { S.tool = t; S.anchor = null; hideGhost(); renderTools(); }
        function setColor(k) {
            S.color = k;
            if (S.tool === 'erase') S.tool = S.kind === 'traits' ? 'line' : 'paint';
            renderTools();
        }

        // ── Nouvelle partie ──────────────────────────────────────────────
        function buildModel() {
            var L = lvlById(S.lvl), n = L.n, m = emptyModel(), name = '';
            if (S.src === 'perso' && S.custom) {
                n = S.custom.n;
                m = cloneModel(S.custom);
                name = 'Mon modèle';
            } else if (S.src === 'dessin' && S.kind === 'cases') {
                var okP = PIXELS.filter(function (P) { return P.rows.length <= n && P.rows[0].length <= n && Math.max(P.rows.length, P.rows[0].length) >= n - 3 && pixColors(P) <= L.colors + 1 && P.name !== S.modelName; });
                if (!okP.length) okP = PIXELS.filter(function (P) { return P.rows.length <= n && P.rows[0].length <= n; });
                var P = okP[rnd(okP.length)];
                m.cells = fitPixel(P, n); name = P.name;
            } else if (S.src === 'dessin' && S.kind === 'traits') {
                var okF = FIGS.filter(function (F) { return F.w <= n && F.h <= n && figCat(F) <= L.cat && Math.max(F.w, F.h) >= n - 4 && F.name !== S.modelName; });
                if (!okF.length) okF = FIGS.filter(function (F) { return F.w <= n && F.h <= n && figCat(F) <= L.cat; });
                var F = okF[rnd(okF.length)];
                m.segs = fitFig(F, n); name = F.name;
            } else {
                var sym = !S.mirror && Math.random() < 0.5;
                if (S.kind === 'cases') m.cells = randCells(n, L.colors, L.cells, sym);
                else if (S.kind === 'traits') m.segs = randSegs(n, Math.max(1, L.colors - 1), L.segs, L.cat);
                else {
                    m.cells = randCells(n, Math.max(1, L.colors - 1), Math.round(L.cells * 0.6), sym);
                    m.segs = randSegs(n, Math.max(1, L.colors - 2), Math.round(L.segs * 0.6), L.cat);
                }
            }
            S.n = n; S.model = m; S.modelName = name;
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
            S.target = S.mirror ? mirrorModel(S.model, S.n) : cloneModel(S.model);
            S.player = emptyModel();
            S.history = []; S.time = 0; S.checks = 0; S.peeked = false; S.started = false; S.won = false;
            S.calque = false; S.marks = null; S.anchor = null; S.editing = false;
            buildPalette();
            hideOv();
            refreshMode();
            setMsg('');
        }
        function refreshMode() {
            root.classList.toggle('jrq-editing', S.editing);
            paneMine.style.display = S.editing ? 'none' : '';
            paneModel.classList.toggle('edit', S.editing);
            stageEl.classList.toggle('mirror', S.mirror && !S.editing);
            $('.jrq-lbl-model').textContent = S.editing ? '✍️ Dessine ton modèle' : 'Modèle' + (S.modelName && S.modelName !== 'Mon modèle' ? ' · ' + S.modelName : '');
            $('.jrq-lbl-mine').textContent = S.mirror ? '🪞 En miroir !' : 'À toi !';
            $('.jrq-goal').innerHTML = S.editing
                ? 'Dessine le modèle avec <b>toutes les couleurs</b> que tu veux, puis appuie sur <b>Jouer</b>.'
                : (S.mirror ? 'Reproduis le modèle <b>en symétrie</b>, comme dans un miroir.' : 'Reproduis le modèle <b>au même endroit</b> et <b>avec les mêmes couleurs</b>.');
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
        function recKey() { return S.src === 'perso' ? null : S.lvl + '|' + S.kind + (S.mirror ? '|miroir' : ''); }

        function updateUI() {
            var L = lvlById(S.lvl), pill = $('.jrq-pill');
            if (S.src === 'perso') { pill.className = 'jrq-pill g5'; pill.textContent = 'Mon modèle'; }
            else { pill.className = 'jrq-pill ' + L.cls; pill.textContent = L.name; }
            var K = byId(KINDS, S.kind, KINDS[0]);
            $('.jrq-lvltxt').innerHTML = S.n + '×' + S.n + '<span class="jrq-lvlword"> · ' + K.ico + ' ' + K.name + (S.mirror ? ' · 🪞' : '') + '</span>';
            $('.jrq-v-time').textContent = fmtTime(S.time);
            $('.jrq-v-checks').textContent = S.checks;
            var k = recKey(), best = k ? prog.best[k] : null;
            $('.jrq-v-best').textContent = best ? fmtTime(best) : '–';
            $('.jrq-stars').innerHTML = starHTML(k ? (prog.stars[k] || 0) : 0);
            $('.jrq-v-size').textContent = S.n + '×' + S.n;
            $('.jrq-undo').disabled = !S.history.length || S.won;
            var cur = S.editing ? S.model : S.player;
            $('.jrq-clear').disabled = isEmpty(cur) || S.won;
            $('.jrq-check').disabled = S.won || isEmpty(S.player);
            $('.jrq-calque').disabled = S.won;
            $('.jrq-calque').classList.toggle('jrq-on', S.calque);
            var nb = $('.jrq-new');
            nb.innerHTML = S.src === 'perso' ? '✏️ Modifier mon modèle' : '🔀 Nouveau modèle';
            var sb = $('.jrq-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
        }
        function setMsg(t) { $('.jrq-msg').innerHTML = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // ── Chronomètre ──────────────────────────────────────────────────
        var timer = setInterval(function () {
            if (!root.isConnected) { if (!widget.isConnected) clearInterval(timer); return; }
            if (S.started && !S.won && !S.editing && root.offsetParent !== null && !root.querySelector('.jrq-ov.show')) {
                S.time++;
                $('.jrq-v-time').textContent = fmtTime(S.time);
            }
        }, 1000);

        // ── Saisie sur la grille ─────────────────────────────────────────
        function cur() { return S.editing ? S.model : S.player; }
        function activeSvg() { return S.editing ? svgModel : svgMine; }
        function svgPt(svg, e) {
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
            if (!S.editing && compare(S.target, S.player).done) win(); else save();
        }
        function paintCell(rc, mode) {
            var m = cur(), k = rc[0] + ',' + rc[1];
            if (mode === 'erase') { if (!m.cells[k]) return false; delete m.cells[k]; return true; }
            if (m.cells[k] === S.color) return false;
            m.cells[k] = S.color; return true;
        }
        function eraseAt(pt) {
            var m = cur(), best = -1, bd = 0.24;
            for (var i = m.segs.length - 1; i >= 0; i--) { var d = distSeg(pt, m.segs[i]); if (d < bd) { bd = d; best = i; } }
            if (best >= 0) { m.segs.splice(best, 1); return true; }
            var rc = cellAt(pt);
            return rc ? paintCell(rc, 'erase') : false;
        }
        function addSeg(a, b) {
            var m = cur(), pc = pieces([{ a: a, b: b, c: S.color }]), dup = false;
            // Retirer les morceaux recouverts par le nouveau trait (même tracé redessiné)
            m.segs = m.segs.filter(function (s) {
                var sp = pieces([s]), keys = Object.keys(sp), inside = keys.every(function (k) { return pc[k]; });
                if (inside && s.c === S.color && keys.length === Object.keys(pc).length) dup = true;
                return !inside;
            });
            m.segs.push({ a: a, b: b, c: S.color });
            if (prog.sound) beep(dup ? 300 : 520, 0.07, 'triangle', 0.05);
        }

        function showAnchor(nd) {
            var a = activeSvg().querySelector('.anchor');
            if (!a) return;
            if (!nd) { a.style.display = 'none'; return; }
            a.setAttribute('cx', nd[0]); a.setAttribute('cy', nd[1]); a.style.display = '';
        }
        function hideGhost() {
            [svgModel, svgMine].forEach(function (s) {
                s.querySelectorAll('.ghost-line,.anchor').forEach(function (g) { g.style.display = 'none'; });
            });
        }
        function showGhost(a, b) {
            var g = activeSvg().querySelector('.ghost-line');
            if (!g) return;
            if (!a || !b) { g.style.display = 'none'; return; }
            g.setAttribute('x1', a[0]); g.setAttribute('y1', a[1]); g.setAttribute('x2', b[0]); g.setAttribute('y2', b[1]);
            g.style.display = '';
        }
        // Surlignage : la case (ou le point) visée, dans les deux grilles
        function highlight(pt) {
            var svgs = S.editing ? [svgModel] : [svgMine, svgModel];
            svgs.forEach(function (svg, idx) {
                var hc = svg.querySelector('.hl-cell'), hn = svg.querySelector('.hl-node'),
                    br = svg.querySelector('.hb-r'), bc = svg.querySelector('.hb-c');
                if (!hc) return;
                hc.style.display = hn.style.display = br.style.display = bc.style.display = 'none';
                if (!pt) return;
                var isModel = svg === svgModel && !S.editing;
                if (isModel && !S.aid) return;
                var useNode = S.tool === 'line' || (S.tool === 'erase' && S.kind === 'traits');
                if (useNode) {
                    var nd = nodeAt(pt, false); if (!nd) return;
                    var x = isModel && S.mirror ? S.n - nd[0] : nd[0];
                    hn.setAttribute('cx', x); hn.setAttribute('cy', nd[1]); hn.style.display = '';
                } else {
                    var rc = cellAt(pt); if (!rc) return;
                    var c = isModel && S.mirror ? S.n - 1 - rc[1] : rc[1];
                    hc.setAttribute('x', c); hc.setAttribute('y', rc[0]); hc.style.display = '';
                    if (S.aid && !S.editing) {
                        br.setAttribute('y', rc[0]); bc.setAttribute('x', c);
                        br.style.display = bc.style.display = '';
                    }
                }
            });
        }

        var ptr = null;
        function onDown(e) {
            var svg = e.currentTarget;
            if (svg !== activeSvg() || S.won || (e.button != null && e.button > 0)) return;
            e.preventDefault(); e.stopPropagation();
            root.focus({ preventScroll: true });
            var pt = svgPt(svg, e); if (!pt) return;
            try { svg.setPointerCapture(e.pointerId); } catch (er) {}
            if (S.tool === 'paint') {
                var rc = cellAt(pt); if (!rc) return;
                var k = rc[0] + ',' + rc[1];
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
            var svg = e.currentTarget;
            if (svg !== activeSvg()) return;
            var pt = svgPt(svg, e); if (!pt) return;
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
                var pt = svgPt(e.currentTarget, e), nd = pt && nodeAt(pt, true);
                if (nd && (nd[0] !== p.start[0] || nd[1] !== p.start[1])) {
                    var a = S.anchor; S.anchor = null; hideGhost();
                    pushHistory(); addSeg(a, nd); changed();
                }
                // sinon : simple toucher → le point reste accroché (2e toucher = fin du trait)
            }
        }
        [svgModel, svgMine].forEach(function (svg) {
            svg.addEventListener('pointerdown', onDown);
            svg.addEventListener('pointermove', onMove);
            svg.addEventListener('pointerup', onUp);
            svg.addEventListener('pointercancel', onUp);
            svg.addEventListener('pointerleave', function () { if (!ptr) highlight(null); });
        });

        function undo() {
            if (!S.history.length || S.won) return;
            var prev = JSON.parse(S.history.pop());
            if (S.editing) S.model = prev; else S.player = prev;
            S.anchor = null; S.marks = null;
            if (prog.sound) beep(300, 0.06, 'sine', 0.05);
            render(); updateUI(); save();
        }
        function clearAll() {
            var m = cur();
            if (isEmpty(m) || S.won) return;
            pushHistory();
            if (S.editing) S.model = emptyModel(); else S.player = emptyModel();
            S.anchor = null; S.marks = null;
            render(); updateUI(); save();
            setMsg('Grille effacée (↶ Annuler pour revenir en arrière).');
        }

        // ── Vérifier / calque ────────────────────────────────────────────
        function check() {
            if (S.won || S.editing || isEmpty(S.player)) return;
            var r = compare(S.target, S.player);
            if (r.done) { win(); return; }
            S.checks++;
            S.marks = r;
            render(); updateUI(); save();
            var unit = S.kind === 'cases' ? 'case' : (S.kind === 'traits' ? 'morceau de trait' : 'élément');
            var parts = [];
            var good = r.okCells + r.okSegs;
            parts.push('✔ ' + good + ' bon' + (good > 1 ? 's' : ''));
            if (r.nBad) parts.push('✖ ' + r.nBad + ' erreur' + (r.nBad > 1 ? 's' : '') + ' (en rouge)');
            if (r.nMiss) parts.push('il manque ' + r.nMiss + ' ' + unit + (r.nMiss > 1 && unit !== 'morceau de trait' ? 's' : (r.nMiss > 1 ? 's' : '')));
            setMsg(parts.join(' · '));
            if (prog.sound) { if (r.nBad) beep(200, 0.15, 'square', 0.03); else beep(660, 0.1, 'sine', 0.05); }
        }
        function toggleCalque() {
            if (S.won || S.editing) return;
            S.calque = !S.calque;
            if (S.calque && !S.peeked) { S.peeked = true; setMsg('👁 Le calque montre le modèle sur ta grille (1 étoile maximum).'); }
            render(); updateUI(); save();
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            S.won = true; S.calque = false; S.marks = null; S.anchor = null;
            render();
            svgMine.classList.remove('done'); void svgMine.offsetWidth; svgMine.classList.add('done');
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
                $('.jrq-win-title').textContent = st === 3 ? 'Bravo, artiste !' : 'Bravo !';
                var se = $('.jrq-win-stars');
                se.innerHTML = starHTML(st);
                se.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt = (S.mirror ? 'Symétrique réussi' : 'Modèle reproduit') + ' en <b>' + fmtTime(S.time) + '</b>';
                if (S.checks) txt += '<br>avec ' + S.checks + ' vérification' + (S.checks > 1 ? 's' : '');
                if (S.peeked) txt += '<br>avec le calque — essaie sans la prochaine fois !';
                if (newRec && key) txt += '<br>🏆 Nouveau record !';
                $('.jrq-win-txt').innerHTML = txt;
                $('.jrq-w-new').textContent = S.src === 'perso' ? '✏️ Modifier mon modèle' : '🔀 Nouveau modèle';
                showOv('.jrq-ov-win');
                if (st >= 2) confetti();
            }, 700);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#ff4f5e', '#22c55e', '#3ba7ff', '#9b6bff', '#ff9f1a'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jrq-confetti');
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
            if (S.custom) { S.n = S.custom.n; S.model = cloneModel(S.custom); }
            else { S.n = lvlById(S.lvl).n; S.model = emptyModel(); }
            S.modelName = 'Mon modèle';
            refreshMode();
            setMsg('');
            save();
        }
        function resizeEditor(d) {
            var n = Math.max(4, Math.min(12, S.n + d));
            if (n === S.n) return;
            pushHistory();
            S.n = n;
            S.model = sanitizeModel(S.model, n);
            S.anchor = null;
            render(); updateUI(); layout(); save();
        }
        function finishEditor() {
            if (isEmpty(S.model)) { setMsg('Dessine d\'abord quelque chose dans la grille !'); return; }
            S.custom = { n: S.n, cells: Object.assign({}, S.model.cells), segs: cloneModel(S.model).segs };
            // Le type de jeu suit ce qui a été dessiné
            var hasC = Object.keys(S.model.cells).length > 0, hasS = S.model.segs.length > 0;
            S.kind = hasC && hasS ? 'mixte' : (hasS ? 'traits' : 'cases');
            S.src = 'perso';
            newGame(true);
            save();
        }

        // ── Fenêtres : réglages / victoire / aide ────────────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jrq-ov').forEach(function (o) { o.classList.remove('show'); }); }
        var pend = null;
        function openSettings() {
            pend = { lvl: S.lvl, kind: S.kind, src: S.src, coords: S.coords, aid: S.aid, mirror: S.mirror };
            renderSettings();
            showOv('.jrq-ov-set');
        }
        function renderSettings() {
            if (pend.kind === 'mixte' && pend.src === 'dessin') pend.src = 'hasard';
            $('.jrq-set-lvl').innerHTML = LEVELS.map(function (L) {
                return '<button class="jrq-chip' + (L.id === pend.lvl ? ' sel' : '') + '" data-lvl="' + L.id + '">' + L.ico + ' ' + L.name + '<small>' + L.desc + '</small></button>';
            }).join('');
            $('.jrq-set-kind').innerHTML = KINDS.map(function (K) {
                return '<button class="jrq-chip' + (K.id === pend.kind ? ' sel' : '') + '" data-kind="' + K.id + '">' + K.ico + ' ' + K.name + '<small>' + K.desc + '</small></button>';
            }).join('');
            $('.jrq-set-src').innerHTML = SOURCES.map(function (O) {
                var off = O.id === 'dessin' && pend.kind === 'mixte';
                return '<button class="jrq-chip' + (O.id === pend.src ? ' sel' : '') + (off ? ' off' : '') + '" data-src="' + O.id + '"' + (off ? ' title="Pas de dessin tout prêt pour « Les deux »"' : '') + '>' + O.ico + ' ' + O.name + '<small>' + (O.id === 'perso' && S.custom ? 'le reprendre / le modifier' : O.desc) + '</small></button>';
            }).join('');
            $('.jrq-set-coords').checked = pend.coords;
            $('.jrq-set-aid').checked = pend.aid;
            $('.jrq-set-mirror').checked = pend.mirror;
            $('.jrq-set-play').textContent = pend.src === 'perso' ? '✍️ Dessiner le modèle' : '▶ Jouer';
        }
        $('.jrq-set-lvl').addEventListener('click', function (e) { var b = e.target.closest('[data-lvl]'); if (!b) return; pend.lvl = b.dataset.lvl; renderSettings(); });
        $('.jrq-set-kind').addEventListener('click', function (e) { var b = e.target.closest('[data-kind]'); if (!b) return; pend.kind = b.dataset.kind; renderSettings(); });
        $('.jrq-set-src').addEventListener('click', function (e) {
            var b = e.target.closest('[data-src]'); if (!b) return;
            if (b.dataset.src === 'dessin' && pend.kind === 'mixte') return;
            pend.src = b.dataset.src; renderSettings();
        });
        ['coords', 'aid', 'mirror'].forEach(function (k) {
            var inp = $('.jrq-set-' + k);
            inp.addEventListener('change', function () { pend[k] = this.checked; });
            ['pointerdown', 'mousedown'].forEach(function (t) { inp.addEventListener(t, function (e) { e.stopPropagation(); }); });
        });
        $('.jrq-set-play').addEventListener('click', function () {
            S.lvl = pend.lvl; S.kind = pend.kind; S.coords = pend.coords; S.aid = pend.aid; S.mirror = pend.mirror;
            var wasPerso = S.src === 'perso';
            S.src = pend.src;
            S.modelName = '';
            if (S.src === 'perso') {
                // Le type choisi décide des outils de l'éditeur
                openEditor();
                if (wasPerso && S.custom) setMsg('Ton modèle est prêt : modifie-le ou appuie sur ▶ Jouer.');
            } else {
                newGame(false);
                save();
            }
        });

        root.addEventListener('click', function (e) {
            if (e.target.closest('.jrq-x')) { hideOv(); return; }
            if (e.target.classList.contains('jrq-ov') && !$('.jrq-ov-win').classList.contains('show')) hideOv();
        });
        $('.jrq-lvlbtn').addEventListener('click', openSettings);
        $('.jrq-tools').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
        $('.jrq-pal').addEventListener('click', function (e) { var b = e.target.closest('[data-col]'); if (b) setColor(b.dataset.col); });
        $('.jrq-undo').addEventListener('click', undo);
        $('.jrq-clear').addEventListener('click', clearAll);
        $('.jrq-check').addEventListener('click', check);
        $('.jrq-calque').addEventListener('click', toggleCalque);
        $('.jrq-new').addEventListener('click', function () { if (S.src === 'perso') openEditor(); else { newGame(false); save(); } });
        $('.jrq-editdone').addEventListener('click', finishEditor);
        root.querySelectorAll('.jrq-sz').forEach(function (b) { b.addEventListener('click', function () { resizeEditor(+b.dataset.d); }); });
        $('.jrq-w-replay').addEventListener('click', function () { newGame(true); save(); });
        $('.jrq-w-new').addEventListener('click', function () { if (S.src === 'perso') openEditor(); else { newGame(false); save(); } });
        $('.jrq-w-set').addEventListener('click', openSettings);
        $('.jrq-help').addEventListener('click', function () { showOv('.jrq-ov-help'); });
        $('.jrq-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });

        // Clavier : Ctrl+Z, 1-9 pour la couleur, C/T/G pour les outils, Échap
        root.addEventListener('keydown', function (e) {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); e.stopPropagation(); return; }
            if (e.key === 'Escape') { hideOv(); S.anchor = null; hideGhost(); return; }
            if (root.querySelector('.jrq-ov.show') || e.ctrlKey || e.metaKey || e.altKey) return;
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
            window._wfMiniBarCollapse(widget, '🖍️ Repro. quadrillage', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jrq-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jrqZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jrqZ || '';
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
        var grip = $('.jrq-grip'), rs = null;
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
        widget._jrqGetData = function () {
            return {
                v: 1, lvl: S.lvl, kind: S.kind, src: S.src, mirror: S.mirror, coords: S.coords, aid: S.aid,
                n: S.n, model: cloneModel(S.model), modelName: S.modelName,
                player: S.won ? null : cloneModel(S.player),
                custom: S.custom ? { n: S.custom.n, cells: Object.assign({}, S.custom.cells), segs: cloneModel(S.custom).segs } : null,
                editing: S.editing, color: S.color, tool: S.tool,
                time: S.won ? 0 : S.time, checks: S.won ? 0 : S.checks, peeked: S.won ? false : S.peeked,
                w: S.w, h: S.h, fullboard: S.fullboard
            };
        };
        function restore(d) {
            S.lvl = lvlById(d.lvl).id;
            S.kind = byId(KINDS, d.kind, KINDS[0]).id;
            S.src = byId(SOURCES, d.src, SOURCES[0]).id;
            S.mirror = !!d.mirror;
            if (typeof d.coords === 'boolean') S.coords = d.coords;
            if (typeof d.aid === 'boolean') S.aid = d.aid;
            if (d.custom && d.custom.n >= 4 && d.custom.n <= 12) {
                var cm = sanitizeModel(d.custom, d.custom.n);
                S.custom = { n: d.custom.n, cells: cm.cells, segs: cm.segs };
            }
            if (S.src === 'perso' && !S.custom && !d.editing) S.src = 'hasard';
            if (COL[d.color]) S.color = d.color;
            if (d.tool) S.tool = d.tool;
            var n = Math.max(4, Math.min(12, +d.n || lvlById(S.lvl).n));
            var m = sanitizeModel(d.model, n);
            if (d.editing) {
                S.n = n; S.model = m; S.modelName = 'Mon modèle';
                S.editing = true; S.history = [];
                refreshMode();
                return;
            }
            if (isEmpty(m)) { newGame(false); return; }
            S.n = n; S.model = m; S.modelName = d.modelName || '';
            newGame(true);
            if (d.player) {
                S.player = sanitizeModel(d.player, n);
                S.time = +d.time || 0; S.checks = +d.checks || 0; S.peeked = !!d.peeked;
                S.started = !isEmpty(S.player);
                if (S.started && compare(S.target, S.player).done) S.player = emptyModel();
                renderTools(); render(); updateUI();
            }
        }

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('jrq-fullboard'); widget.style.zIndex = '9999'; }
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
    window.createJeuReproQuadrillageWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        window._jrqNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jrqNextPendingData = null;
        }
        if (w && !w._jrqInit) initRepro(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-repro-quadrillage') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jrqHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jrqInit) initRepro(w, window._jrqNextPendingData || null);
            return w;
        };
        // Conserver les marqueurs des autres jeux qui ont déjà enveloppé createWidget
        Object.keys(orig).forEach(function (k) { wrapped[k] = orig[k]; });
        wrapped._jrqHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests
    window._jrqTest = { pieces: pieces, compare: compare, mirrorModel: mirrorModel, PIXELS: PIXELS, FIGS: FIGS, fitPixel: fitPixel, fitFig: fitFig, randCells: randCells, randSegs: randSegs };
})();
