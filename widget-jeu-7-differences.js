// =========================================================================
// WIDGET JEU : LE JEU DES 7 DIFFÉRENCES
// -------------------------------------------------------------------------
// • 40 scènes illustrées en 4 difficultés (Débutant → Expert), sur 10 thèmes
//   (parc, plage, espace, ferme, ville, forêt, océan, goûter, neige, chambre).
//   Elles sont générées à partir d'une graine fixe : la scène 12 est toujours
//   la même, pour toute la classe. Aucune image externe : fonctionne hors ligne.
// • Bouton « Au hasard » : une nouvelle scène à chaque clic.
// • Différences : objet disparu, ajouté, remplacé, changé de couleur, retourné,
//   agrandi / rétréci, tourné, déplacé (les plus subtiles aux niveaux élevés).
// • Cliquer / toucher une différence sur l'une OU l'autre image.
// • Indice (zone entourée), solution, erreurs comptées, chrono, étoiles,
//   records (meilleur temps) mémorisés dans le navigateur.
// • Sauvegarde du tableau : scène, différences trouvées, erreurs, temps,
//   taille (via _j7dGetData / createJeu7DifferencesWidget(data), cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-7-differences';
    var STORE_KEY = 'j7d-progress-v1';
    var DEF_W = 820, DEF_H = 560, MIN_W = 360, MIN_H = 380;
    var NB_LEVELS = 40, NB_DIFF = 7;
    var VW = 400, VH = 300;                       // repère des scènes (viewBox)

    var GROUPS = [
        { name: 'Débutant',      cls: 'g1', from: 0,  to: 9,  n: [9, 12],  s: [40, 52], types: ['remove', 'add', 'swap', 'color', 'size'],                          big: 1.6,  hue: 160 },
        { name: 'Intermédiaire', cls: 'g2', from: 10, to: 19, n: [13, 16], s: [34, 46], types: ['remove', 'add', 'swap', 'color', 'size', 'flip', 'rotate'],          big: 1.45, hue: 140 },
        { name: 'Avancé',        cls: 'g3', from: 20, to: 29, n: [17, 21], s: [30, 40], types: ['remove', 'add', 'swap', 'color', 'size', 'flip', 'rotate', 'move'],  big: 1.35, hue: 120 },
        { name: 'Expert',        cls: 'g4', from: 30, to: 39, n: [22, 27], s: [25, 34], types: ['remove', 'add', 'swap', 'color', 'size', 'flip', 'rotate', 'move'],  big: 1.25, hue: 95 }
    ];
    function groupOf(idx) {
        for (var i = 0; i < GROUPS.length; i++) if (idx >= GROUPS[i].from && idx <= GROUPS[i].to) return GROUPS[i];
        return GROUPS[0];
    }

    // Thèmes. Préfixes des objets : « ^ » ciel / mur, « ~ » eau, sinon sol ;
    // « > » = dessin asymétrique (peut être retourné en miroir).
    var THEMES = [
        { id: 'parc', name: 'Au parc', ico: '🌳', zones: { sky: [22, 112], ground: [168, 280] },
          pool: ['^>🐦', '^>🦋', '^🎈', '^🪁', '^☁️', '^>🐝', '🌳', '🌷', '🌻', '>🐿️', '>🐕', '>🚲', '🌸', '>🐞', '🍄', '🧺', '>🐈', '⚽', '>🦆'] },
        { id: 'plage', name: 'À la plage', ico: '🏖️', zones: { sky: [22, 95], water: [132, 170], ground: [200, 282] },
          pool: ['^☁️', '^>🐦', '^🪁', '^>✈️', '~>⛵', '~>🐬', '~>🐟', '~>🚤', '🐚', '>🦀', '⛱️', '🌴', '🪣', '>🦩', '🏐', '🍉', '🏰', '🍦'] },
        { id: 'espace', name: "Dans l'espace", ico: '🚀', zones: { ground: [22, 280] },
          pool: ['>🚀', '🛸', '🪐', '>🌙', '⭐', '👽', '>🛰️', '>☄️', '🌍', '🌟', '>💫', '👾', '>🔭'] },
        { id: 'ferme', name: 'À la ferme', ico: '🐄', zones: { sky: [22, 100], ground: [170, 282] },
          pool: ['^☁️', '^>🐦', '^>🦋', '>🐄', '>🐖', '>🐑', '>🐓', '>🐴', '>🚜', '🌾', '>🐔', '>🦆', '>🐐', '>🥕', '🌽', '>🐇', '🌻'] },
        { id: 'ville', name: 'En ville', ico: '🚦', zones: { sky: [22, 80], ground: [200, 282] },
          pool: ['^☁️', '^>✈️', '^🎈', '^>🐦', '>🚗', '>🚌', '>🚲', '🚦', '>🐕', '>🛴', '>🚕', '>🚓', '>🚑', '🌳', '>🛵', '>🚒'] },
        { id: 'foret', name: 'Dans la forêt', ico: '🦊', zones: { sky: [22, 95], ground: [150, 282] },
          pool: ['^>🦉', '^>🐦', '^🍂', '^>🦋', '🌲', '>🦊', '🍄', '🐻', '>🦌', '>🐿️', '🌰', '>🐗', '>🦔', '🐸', '🌳', '>🐌', '>🐞'] },
        { id: 'ocean', name: "Sous l'océan", ico: '🐠', zones: { ground: [26, 272] },
          pool: ['>🐠', '>🐟', '>🐡', '>🦈', '🐙', '>🦑', '🐚', '>🦀', '>🐬', '>🐋', '>🐳', '>🦞', '⚓', '>🐢'] },
        { id: 'gouter', name: "L'heure du goûter", ico: '🧁', zones: { sky: [30, 120], ground: [190, 282] },
          pool: ['^🖼️', '^⏰', '^🎈', '🍎', '>🍌', '🍇', '🍓', '>🍰', '🧁', '🍪', '🥛', '🍩', '🍉', '>🥕', '>🍕', '>🧃', '>🍋', '🍐'] },
        { id: 'neige', name: 'À la neige', ico: '⛄', zones: { sky: [22, 95], ground: [165, 282] },
          pool: ['^❄️', '^☁️', '^>🐦', '⛄', '🌲', '>🐧', '>🛷', '🧣', '🧤', '>🦌', '>⛸️', '🎁', '>🦊', '>🐇'] },
        { id: 'chambre', name: 'Dans la chambre', ico: '🧸', zones: { sky: [30, 130], ground: [182, 282] },
          pool: ['^🖼️', '^⏰', '^>🪁', '^🎈', '🧸', '🪀', '🎲', '🧩', '>🚂', '🎨', '📚', '⚽', '🤖', '>🦖', '🏀', '>🚗', '🎁', '>👟'] }
    ];
    function parsePool(t) {
        return t.pool.map(function (p) {
            var o = { sky: false, water: false, asym: false, e: '' }, i = 0;
            while (i < p.length && (p[i] === '^' || p[i] === '~' || p[i] === '>')) {
                if (p[i] === '^') o.sky = true; else if (p[i] === '~') o.water = true; else o.asym = true;
                i++;
            }
            o.e = p.slice(i);
            o.zone = o.sky && t.zones.sky ? 'sky' : (o.water && t.zones.water ? 'water' : 'ground');
            return o;
        });
    }

    // ── Hasard déterministe ─────────────────────────────────────────────
    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            var t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // ── Génération d'une scène et de ses 7 différences ──────────────────
    // Garantit exactement 7 différences (sinon on retente avec une graine voisine)
    function genScene(seed, gi, themeIdx) {
        var sc = null;
        for (var a = 0; a < 30; a++) {
            sc = genSceneOnce((seed + a * 7919) >>> 0, gi, themeIdx);
            if (sc.diffs.length === NB_DIFF) return sc;
        }
        return sc;
    }
    function genSceneOnce(seed, gi, themeIdx) {
        var rnd = mulberry32(seed);
        var G = GROUPS[gi], T = THEMES[themeIdx], pool = parsePool(T);
        function pick(a) { return a[Math.floor(rnd() * a.length)]; }
        function between(a, b) { return a + rnd() * (b - a); }
        var objs = [];
        function fits(x, y, s, ignore) {
            if (x - s / 2 < 6 || x + s / 2 > VW - 6) return false;
            for (var k = 0; k < objs.length; k++) {
                if (k === ignore) continue;
                var o = objs[k], d = Math.hypot(o.x - x, o.y - y);
                if (d < (o.s + s) / 2 * 1.02) return false;
            }
            return true;
        }
        function place(item, s) {
            var z = T.zones[item.zone];
            for (var t = 0; t < 250; t++) {
                var y0 = Math.max(z[0] + s * 0.25, s / 2 + 6), y1 = Math.min(z[1], VH - s / 2 - 8);
                if (y1 < y0) y1 = y0;
                var x = between(s / 2 + 8, VW - s / 2 - 8), y = between(y0, y1);
                if (fits(x, y, s)) return { x: x, y: y };
            }
            return null;
        }
        var target = Math.round(between(G.n[0], G.n[1] + 0.99));
        var guard = 0;
        while (objs.length < target && guard++ < target * 6) {
            var it = pick(pool), s = Math.round(between(G.s[0], G.s[1]));
            if (it.zone !== 'ground') s = Math.round(s * 0.9);
            var p = place(it, s);
            if (p) objs.push({ e: it.e, asym: it.asym, zone: it.zone, x: p.x, y: p.y, s: s });
        }
        // Objets dessinés du plus loin (haut) au plus près (bas)
        objs.sort(function (a, b) { return a.y - b.y; });

        // Choix des différences (types variés, zones bien séparées)
        var diffs = [], used = {};
        var types = G.types.slice();
        function farFromDiffs(x, y, r) {
            for (var k = 0; k < diffs.length; k++) if (Math.hypot(diffs[k].x - x, diffs[k].y - y) < diffs[k].r + r + 6) return false;
            return true;
        }
        var order = [];
        // Au moins une fois chaque type (dans la limite de 7), puis au hasard
        types.forEach(function (t) { order.push(t); });
        for (var q = order.length - 1; q > 0; q--) { var j = Math.floor(rnd() * (q + 1)), tmp = order[q]; order[q] = order[j]; order[j] = tmp; }
        while (order.length < NB_DIFF + 12) order.push(pick(types));
        for (var oi = 0; oi < order.length && diffs.length < NB_DIFF; oi++) {
            var type = order[oi], d = null;
            for (var att = 0; att < 40 && !d; att++) {
                if (type === 'add') {
                    var it2 = pick(pool), s2 = Math.round(between(G.s[0], G.s[1]));
                    var p2 = place(it2, s2);
                    if (!p2) continue;
                    var r2 = s2 * 0.62 + 6;
                    if (!farFromDiffs(p2.x, p2.y, r2)) continue;
                    d = { type: 'add', obj: { e: it2.e, x: p2.x, y: p2.y, s: s2 }, x: p2.x, y: p2.y, r: r2 };
                    continue;
                }
                var idx = Math.floor(rnd() * objs.length), o = objs[idx];
                if (!o || used[idx]) continue;
                var r = Math.max(o.s * 0.62, 16) + 6;
                if (type === 'flip' && !o.asym) continue;
                if (type === 'swap') {
                    var cand = pool.filter(function (pp) { return pp.e !== o.e && pp.zone === o.zone; });
                    if (!cand.length) continue;
                    if (!farFromDiffs(o.x, o.y, r)) continue;
                    d = { type: 'swap', i: idx, e2: pick(cand).e, x: o.x, y: o.y, r: r };
                } else if (type === 'size') {
                    var k2 = rnd() < 0.5 ? G.big : 1 / G.big + 0.08;
                    if (k2 > 1 && (o.y + o.s * k2 / 2 > VH - 4 || o.y - o.s * k2 / 2 < 4 || o.x + o.s * k2 / 2 > VW - 4 || o.x - o.s * k2 / 2 < 4)) k2 = 1 / G.big + 0.08;
                    var rr = Math.max(o.s * k2 * 0.62, 16) + 6;
                    if (!farFromDiffs(o.x, o.y, rr)) continue;
                    d = { type: 'size', i: idx, k: k2, x: o.x, y: o.y, r: rr };
                } else if (type === 'move') {
                    var ang = rnd() * Math.PI * 2, dist = o.s * between(0.8, 1.2);
                    var nx = o.x + Math.cos(ang) * dist, ny = o.y + Math.sin(ang) * dist;
                    var zz = T.zones[o.zone];
                    if (ny < zz[0] - 6 || ny > zz[1] + 6 || ny - o.s / 2 < 6 || ny + o.s / 2 > VH - 8 || !fits(nx, ny, o.s, idx)) continue;
                    var mx = (o.x + nx) / 2, my = (o.y + ny) / 2, rm = dist / 2 + o.s * 0.62 + 6;
                    if (!farFromDiffs(mx, my, rm)) continue;
                    d = { type: 'move', i: idx, nx: nx, ny: ny, x: mx, y: my, r: rm };
                } else {
                    if (!farFromDiffs(o.x, o.y, r)) continue;
                    d = { type: type, i: idx, x: o.x, y: o.y, r: r };
                    if (type === 'rotate') d.a = 180;
                    if (type === 'color') d.hue = G.hue + Math.round(rnd() * 60);
                }
                if (d) used[idx] = 1;
            }
            if (d) diffs.push(d);
        }
        // Garde-fou (très rare) : compléter avec des objets retirés
        for (var z2 = 0; diffs.length < NB_DIFF && z2 < objs.length; z2++) {
            if (used[z2]) continue;
            var oo = objs[z2], rz = Math.max(oo.s * 0.62, 16) + 6;
            if (!farFromDiffs(oo.x, oo.y, rz)) continue;
            used[z2] = 1;
            diffs.push({ type: 'remove', i: z2, x: oo.x, y: oo.y, r: rz });
        }
        return { theme: themeIdx, bgSeed: seed ^ 0x5bd1e995, objs: objs, diffs: diffs, group: gi };
    }

    function levelScene(i) {
        var g = GROUPS.indexOf(groupOf(i));
        return genScene(777 + i * 104729, g, i % THEMES.length);
    }

    // ── Dessin des décors (SVG) ─────────────────────────────────────────
    function bgSVG(scene, P) {
        var t = THEMES[scene.theme].id, rnd = mulberry32(scene.bgSeed), h = '';
        function lg(id, a, b, x2, y2) {
            return '<linearGradient id="' + P + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
        }
        var defs = '';
        if (t === 'parc') {
            defs += lg('sky', '#7cc8ff', '#dff4ff');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/><circle cx="345" cy="48" r="26" fill="#ffd23f"/><circle cx="345" cy="48" r="36" fill="#ffd23f" opacity=".25"/>' +
                 '<ellipse cx="90" cy="175" rx="190" ry="55" fill="#8bd46f"/><ellipse cx="330" cy="170" rx="170" ry="50" fill="#79c95f"/>' +
                 '<rect y="160" width="400" height="140" fill="#6cc04f"/><path d="M170 300 C185 240 230 205 250 160 L268 160 C252 210 220 250 230 300 Z" fill="#e9cf98"/>';
        } else if (t === 'plage') {
            defs += lg('sky', '#6ec6ff', '#e6f7ff') + lg('sea', '#2a9df4', '#1677c9');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/><circle cx="60" cy="45" r="24" fill="#ffd23f"/>' +
                 '<rect y="112" width="400" height="80" fill="url(#' + P + 'sea)"/>' +
                 '<path d="M0 135 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfe6ff" stroke-width="2" fill="none" opacity=".7"/>' +
                 '<path d="M0 160 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfe6ff" stroke-width="2" fill="none" opacity=".5"/>' +
                 '<path d="M0 186 Q100 176 200 186 T400 184 L400 300 L0 300 Z" fill="#f6d58e"/>';
        } else if (t === 'espace') {
            defs += lg('sky', '#0b1030', '#2a1b5c');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/>';
            for (var i = 0; i < 70; i++) h += '<circle cx="' + (rnd() * 400).toFixed(1) + '" cy="' + (rnd() * 300).toFixed(1) + '" r="' + (rnd() * 1.3 + 0.3).toFixed(2) + '" fill="#fff" opacity="' + (rnd() * 0.6 + 0.3).toFixed(2) + '"/>';
            h += '<circle cx="360" cy="260" r="70" fill="#7c3aed" opacity=".25"/>';
        } else if (t === 'ferme') {
            defs += lg('sky', '#8fd3ff', '#eaf8ff');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/><circle cx="340" cy="45" r="22" fill="#ffd23f"/>' +
                 '<rect y="150" width="400" height="150" fill="#a3d977"/>' +
                 '<rect x="18" y="98" width="70" height="58" fill="#c0392b"/><polygon points="12,100 53,68 94,100" fill="#8e2a20"/><rect x="42" y="124" width="22" height="32" fill="#f5e6c8"/>' +
                 '<g stroke="#b08050" stroke-width="3"><line x1="100" y1="150" x2="400" y2="150"/><line x1="100" y1="140" x2="400" y2="140"/></g>' +
                 '<g fill="#b08050">' + [110, 150, 190, 230, 270, 310, 350, 390].map(function (x) { return '<rect x="' + (x - 2) + '" y="132" width="4" height="22"/>'; }).join('') + '</g>';
        } else if (t === 'ville') {
            defs += lg('sky', '#9ad7ff', '#eef9ff');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/>';
            var x0 = 0, cols = ['#94a3b8', '#f59e0b', '#64748b', '#ef8f6b', '#7dd3fc', '#a78bfa'];
            while (x0 < 400) {
                var bw = 40 + Math.floor(rnd() * 30), bh = 70 + Math.floor(rnd() * 70), c = cols[Math.floor(rnd() * cols.length)];
                h += '<rect x="' + x0 + '" y="' + (190 - bh) + '" width="' + bw + '" height="' + bh + '" fill="' + c + '"/>';
                for (var wy = 190 - bh + 10; wy < 178; wy += 18) for (var wx = x0 + 7; wx < x0 + bw - 10; wx += 14) h += '<rect x="' + wx + '" y="' + wy + '" width="7" height="9" fill="#fff8d6" opacity=".85"/>';
                x0 += bw + 4;
            }
            h += '<rect y="190" width="400" height="18" fill="#cbd5e1"/><rect y="208" width="400" height="92" fill="#475569"/>' +
                 '<g fill="#fff">' + [10, 70, 130, 190, 250, 310, 370].map(function (x) { return '<rect x="' + x + '" y="252" width="30" height="4"/>'; }).join('') + '</g>';
        } else if (t === 'foret') {
            defs += lg('sky', '#bfe9d6', '#f1fbf5');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/>';
            for (var f = 0; f < 14; f++) {
                var tx = f * 30 + rnd() * 20 - 10, th = 70 + rnd() * 40;
                h += '<polygon points="' + (tx - 22) + ',150 ' + tx + ',' + (150 - th) + ' ' + (tx + 22) + ',150" fill="#3f8f5f" opacity=".55"/>';
            }
            h += '<rect y="145" width="400" height="155" fill="#5a9e4b"/><ellipse cx="200" cy="300" rx="260" ry="70" fill="#4d8d3f"/>';
        } else if (t === 'ocean') {
            defs += lg('sky', '#38bdf8', '#0c4a6e');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/>' +
                 '<g fill="#fff" opacity=".08"><polygon points="60,0 110,0 40,300 0,300"/><polygon points="220,0 260,0 230,300 170,300"/><polygon points="330,0 370,0 400,220 400,300 340,300"/></g>' +
                 '<path d="M0 270 Q80 255 160 268 T320 262 T400 266 L400 300 L0 300 Z" fill="#e8c98a"/>';
            for (var bb = 0; bb < 16; bb++) h += '<circle cx="' + (rnd() * 400).toFixed(1) + '" cy="' + (rnd() * 250).toFixed(1) + '" r="' + (rnd() * 3 + 1).toFixed(1) + '" fill="none" stroke="#e0f2fe" stroke-width="1" opacity=".6"/>';
            h += '<g fill="#16a34a" opacity=".8"><path d="M30 300 q-8 -30 4 -60 q-10 30 4 60z"/><path d="M372 300 q-10 -40 6 -78 q-12 40 2 78z"/></g>';
        } else if (t === 'gouter') {
            h += '<rect width="400" height="300" fill="#fde9b6"/>' +
                 '<g opacity=".35" fill="#f5c76b">' + [0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map(function (x) { return '<rect x="' + x + '" y="0" width="20" height="160"/>'; }).join('') + '</g>' +
                 '<rect x="250" y="22" width="110" height="80" fill="#bfe6ff" stroke="#fff" stroke-width="6"/><line x1="305" y1="22" x2="305" y2="102" stroke="#fff" stroke-width="4"/>' +
                 '<rect y="160" width="400" height="140" fill="#b9733f"/><rect y="160" width="400" height="12" fill="#8e5428"/>' +
                 '<g fill="#ef4444" opacity=".85">';
            for (var gx = 0; gx < 400; gx += 40) for (var gy = 172; gy < 300; gy += 40) h += '<rect x="' + (gx + ((gy - 172) / 40 % 2 ? 20 : 0)) + '" y="' + gy + '" width="20" height="20"/>';
            h += '</g><rect y="172" width="400" height="128" fill="#fff" opacity=".35"/>';
        } else if (t === 'neige') {
            defs += lg('sky', '#a7d3ff', '#eef6ff');
            h += '<rect width="400" height="300" fill="url(#' + P + 'sky)"/>' +
                 '<polygon points="0,160 70,70 140,160" fill="#94a3b8"/><polygon points="52,94 70,70 88,94 78,90 70,98 62,90" fill="#fff"/>' +
                 '<polygon points="110,160 210,48 310,160" fill="#a5b4c8"/><polygon points="186,76 210,48 234,76 222,72 210,82 198,72" fill="#fff"/>' +
                 '<polygon points="270,160 345,80 420,160" fill="#94a3b8"/>' +
                 '<path d="M0 150 Q100 135 200 152 T400 148 L400 300 L0 300 Z" fill="#ffffff"/><path d="M0 220 Q120 205 250 222 T400 215" stroke="#dbeafe" stroke-width="3" fill="none"/>';
        } else {
            h += '<rect width="400" height="300" fill="#e9d5ff"/>' +
                 '<rect x="30" y="26" width="96" height="76" fill="#bfe6ff" stroke="#fff" stroke-width="6"/><line x1="78" y1="26" x2="78" y2="102" stroke="#fff" stroke-width="4"/>' +
                 '<rect y="165" width="400" height="135" fill="#d6a46a"/>' +
                 '<g stroke="#b9854d" stroke-width="2">' + [195, 225, 255, 285].map(function (y) { return '<line x1="0" y1="' + y + '" x2="400" y2="' + y + '"/>'; }).join('') + '</g>' +
                 '<rect y="160" width="400" height="8" fill="#fff"/><ellipse cx="220" cy="245" rx="150" ry="40" fill="#f472b6" opacity=".45"/>';
        }
        return '<defs>' + defs + '</defs>' + h;
    }

    var EMOJI_FONT = '&quot;Segoe UI Emoji&quot;,&quot;Apple Color Emoji&quot;,&quot;Noto Color Emoji&quot;,&quot;Twemoji Mozilla&quot;,sans-serif';
    function emojiSVG(e, x, y, s, tr, filt) {
        return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' + (tr ? ' ' + tr : '') + '"' + (filt ? ' filter="url(#' + filt + ')"' : '') + '>' +
               '<text x="0" y="0" font-size="' + s + '" text-anchor="middle" dominant-baseline="central" font-family="' + EMOJI_FONT + '">' + e + '</text></g>';
    }
    // Rend une image : side = 0 (originale) ou 1 (modifiée)
    function sceneSVG(scene, side, P) {
        var byI = {};
        scene.diffs.forEach(function (d) { if (d.i != null) byI[d.i] = d; });
        var filters = '';
        var body = '';
        scene.objs.forEach(function (o, i) {
            var d = side ? byI[i] : null, x = o.x, y = o.y, e = o.e, tr = '', filt = null;
            if (d) {
                if (d.type === 'remove') return;
                if (d.type === 'swap') e = d.e2;
                if (d.type === 'flip') tr = 'scale(-1 1)';
                if (d.type === 'rotate') tr = 'rotate(' + d.a + ')';
                if (d.type === 'size') tr = 'scale(' + d.k.toFixed(3) + ')';
                if (d.type === 'move') { x = d.nx; y = d.ny; }
                if (d.type === 'color') {
                    filt = P + 'h' + i;
                    filters += '<filter id="' + filt + '"><feColorMatrix type="hueRotate" values="' + d.hue + '"/></filter>';
                }
            }
            body += emojiSVG(e, x, y, o.s, tr, filt);
        });
        if (side) scene.diffs.forEach(function (d) { if (d.type === 'add') body += emojiSVG(d.obj.e, d.obj.x, d.obj.y, d.obj.s); });
        return '<svg class="j7d-svg" viewBox="0 0 ' + VW + ' ' + VH + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' +
               bgSVG(scene, P) + '<defs>' + filters + '</defs><g class="j7d-objs">' + body + '</g><g class="j7d-marks"></g></svg>';
    }

    // ── Progression (étoiles, meilleurs temps, son) ─────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, sound: p.sound !== false };
        } catch (e) { return { stars: {}, best: {}, sound: true }; }
    }
    function saveProgress(p) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
    }

    // ── Sons (WebAudio, très discrets) ──────────────────────────────────
    var _actx = null;
    function beep(freq, dur, type, vol, delay) {
        try {
            _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
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
    function fmtTime(ms) {
        var s = Math.floor((ms || 0) / 1000), m = Math.floor(s / 60);
        s = s % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ── CSS (injecté une seule fois) ────────────────────────────────────
    function injectCSS() {
        if (document.getElementById('j7d-style')) return;
        var s = document.createElement('style');
        s.id = 'j7d-style';
        s.textContent = [
'.j7d-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#2fae8a 0%,#1d8a6c 45%,#0f5e4a 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.j7d-root *{box-sizing:border-box}',
'.j7d-root.j7d-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .j7d-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête (zone de déplacement du widget)
'.j7d-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;',
'  background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0));}',
'.j7d-title{font-weight:900;font-size:calc(22px*var(--ui));letter-spacing:.5px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.j7d-title b{color:#ffd23f}',
'.j7d-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;font-family:inherit;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}',
'.j7d-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.j7d-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px}',
'.j7d-pill.g1{background:#22c55e;color:#06321a}.j7d-pill.g2{background:#38bdf8;color:#062a3a}',
'.j7d-pill.g3{background:#fb923c;color:#3b1702}.j7d-pill.g4{background:#f43f5e;color:#fff}',
'.j7d-spacer{flex:1}',
'.j7d-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;padding:0;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0}',
'.j7d-icon:hover{background:rgba(0,0,0,.42)}',
// Corps : les deux images + la barre de jeu
'.j7d-body{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;gap:8px;padding:4px 12px 12px}',
'.j7d-stage{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;gap:var(--gap,12px)}',
'.j7d-stage.col{flex-direction:column}',
'.j7d-pic{position:relative;flex-shrink:0;border-radius:12px;overflow:hidden;background:#fff;cursor:crosshair;touch-action:manipulation;',
'  box-shadow:0 6px 18px rgba(0,0,0,.4),0 0 0 4px rgba(255,255,255,.9)}',
'.j7d-pic .j7d-svg{display:block;width:100%;height:100%}',
'.j7d-tag{position:absolute;left:8px;top:8px;background:rgba(0,0,0,.55);color:#fff;font-weight:900;font-size:calc(12px*var(--ui));border-radius:8px;padding:1px 8px;pointer-events:none}',
'.j7d-mark{fill:none;stroke:#ef4444;stroke-width:4;filter:drop-shadow(0 0 2px #fff)}',
'.j7d-mark.sol{stroke:#a855f7;stroke-dasharray:7 5}',
'.j7d-markin{fill:none;stroke:#fff;stroke-width:1.5;opacity:.9}',
'.j7d-pop{animation:j7dPop .35s ease-out;transform-box:fill-box;transform-origin:center}',
'@keyframes j7dPop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}',
'.j7d-miss{animation:j7dMiss .9s ease-out forwards;transform-box:fill-box;transform-origin:center}',
'@keyframes j7dMiss{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.1)}70%{opacity:1}100%{opacity:0;transform:scale(1)}}',
'.j7d-hintc{fill:rgba(255,210,63,.18);stroke:#ffd23f;stroke-width:3;stroke-dasharray:8 6;animation:j7dHint 1s ease-in-out infinite}',
'@keyframes j7dHint{0%,100%{opacity:.45}50%{opacity:1}}',
'.j7d-pic.shake{animation:j7dShake .3s}',
'@keyframes j7dShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
// Barre de jeu
'.j7d-bar{flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:calc(8px*var(--ui))}',
'.j7d-found{display:flex;gap:calc(5px*var(--ui));align-items:center;background:rgba(0,0,0,.25);border-radius:999px;padding:5px 10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}',
'.j7d-found i{width:calc(16px*var(--ui));height:calc(16px*var(--ui));border-radius:50%;border:2px solid #9ee6c5;display:block;transition:background .2s,transform .2s}',
'.j7d-found i.on{background:#ffc21a;border-color:#fff;transform:scale(1.12)}',
'.j7d-found i.sol{background:#a855f7;border-color:#fff}',
'.j7d-found b{font-size:calc(14px*var(--ui));margin-left:4px;font-weight:900}',
'.j7d-stats{display:flex;gap:5px}',
'.j7d-stat{background:rgba(0,0,0,.25);border-radius:12px;padding:3px 8px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.j7d-stat small{display:block;font-size:calc(9px*var(--ui));font-weight:900;letter-spacing:.6px;opacity:.8;text-transform:uppercase}',
'.j7d-stat span{display:block;font-size:calc(17px*var(--ui));font-weight:900;line-height:1.15}',
'.j7d-stat.err span{color:#ff9aa2}',
'.j7d-stars{font-size:calc(18px*var(--ui));letter-spacing:2px;line-height:1}',
'.j7d-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.j7d-stars .off{color:rgba(255,255,255,.25)}',
'.j7d-btns{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
'.j7d-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(6px*var(--ui)) 10px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#0b3b2e;background:#e9fff6;box-shadow:0 3px 0 #9fd8c2;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.j7d-btn:hover{filter:brightness(1.05)}.j7d-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #9fd8c2}',
'.j7d-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.j7d-btn.j7d-hint{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.j7d-btn.j7d-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.j7d-btn.j7d-rand{background:#c4b5fd;box-shadow:0 3px 0 #7c3aed;color:#2e1065}',
'.j7d-msg{width:100%;min-height:1.2em;font-size:calc(12px*var(--ui));text-align:center;font-weight:700;color:#ffe48a;margin-top:-2px}',
// Fenêtres superposées (niveaux, victoire, aide)
'.j7d-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(6,40,31,.78);backdrop-filter:blur(3px);padding:14px}',
'.j7d-ov.show{display:flex}',
'.j7d-card{background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.j7d-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#0f5e4a}',
'.j7d-lv-grp{margin:8px 0 2px;text-align:left}',
'.j7d-lv-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin-top:4px}',
'.j7d-lv{border:none;cursor:pointer;border-radius:10px;padding:4px 2px 3px;font-weight:900;font-size:calc(14px*var(--ui));min-width:calc(42px*var(--ui));',
'  background:#eef6f3;color:#0f5e4a;box-shadow:0 2px 0 #c8ddd5;line-height:1.1;font-family:inherit}',
'.j7d-lv em{display:block;font-style:normal;font-size:calc(15px*var(--ui))}',
'.j7d-lv small{display:block;font-size:calc(9px*var(--ui));letter-spacing:1px;color:#f4b400;min-height:1.1em}',
'.j7d-lv.cur{background:#0f5e4a;color:#fff;box-shadow:0 2px 0 #062a20}',
'.j7d-lv:hover{filter:brightness(.96)}',
'.j7d-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.j7d-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:j7dStar .5s backwards}',
'.j7d-win-stars .off{color:#d7e3df}',
'@keyframes j7dStar{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.j7d-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 12px;color:#345}',
'.j7d-win-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
'.j7d-card .j7d-btn{box-shadow:0 3px 0 #b7d6cb;background:#eef6f3}',
'.j7d-card .j7d-btn.j7d-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.j7d-card .j7d-btn.j7d-rand{background:#c4b5fd;box-shadow:0 3px 0 #7c3aed;color:#2e1065}',
'.j7d-x{position:absolute;top:10px;right:10px}',
'.j7d-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:j7dFall linear forwards;z-index:21}',
'@keyframes j7dFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.j7d-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.j7d-grip:hover{opacity:1}',
// Format étroit : en-tête compacte
'.j7d-root.j7d-narrow .j7d-head{gap:6px;padding:8px 8px 6px 10px}',
'.j7d-root.j7d-narrow .j7d-title .j7d-tt{display:none}',
'.j7d-root.j7d-narrow .j7d-lvlword{display:none}',
'.j7d-root.j7d-narrow .j7d-icon{width:24px;height:24px;font-size:12px}',
'.j7d-root.j7d-narrow .j7d-help{display:none}',
'.j7d-root.j7d-narrow .j7d-btn .j7d-bl{display:none}',
'.j7d-root.j7d-fullboard .j7d-grip,.widget.phone-fs .j7d-grip{display:none}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .j7d-root.j7d-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
'    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}',
'}'
        ].join('\n');
        document.head.appendChild(s);
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
            var others = Array.from(document.querySelectorAll('.widget')).filter(function (w) { return w !== widget && w.querySelector('.wf-mini-bar'); });
            var occupiedX = others.reduce(function (maxX, w) { return Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP); }, MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
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
            expandBtn.addEventListener('mousedown',   function (e) { e.stopPropagation(); });
            expandBtn.addEventListener('click', function (e) {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                var wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(function (el) { el.style.display = ''; });
                miniBar.remove();
                var curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', function (e) {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                var startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                var onMove = function (ev) { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                var onUp = function () {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    var curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            var curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }


    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    var SVGNS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs) {
        var e = document.createElementNS(SVGNS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }
    var _uid = 0;

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function init7Diff(widget, data) {
        if (!widget || widget._j7dInit) return;
        widget._j7dInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var P = 'j7d' + (++_uid) + '_';
        var S = {
            level: 0, rand: null, scene: null, found: [], errors: 0, hints: 0, solutionSeen: false,
            won: false, elapsed: 0, t0: 0, hintIdx: -1,
            w: DEF_W, h: DEF_H, fullboard: false
        };

        // Fond transparent : seul le cadre arrondi du jeu est visible
        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'j7d-root');
        root.tabIndex = 0;
        var dots = '';
        for (var di = 0; di < NB_DIFF; di++) dots += '<i></i>';
        root.innerHTML =
            '<div class="j7d-head">' +
                '<div class="j7d-title">🔍<span class="j7d-tt"> Les <b>7</b> différences</span></div>' +
                '<button class="j7d-lvlbtn" title="Choisir une scène"><span class="j7d-pill"></span><span class="j7d-lvltxt"></span> ▾</button>' +
                '<div class="j7d-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="j7d-icon j7d-sound" title="Son"></button>' +
                    '<button class="j7d-icon j7d-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="j7d-body">' +
                '<div class="j7d-stage"><div class="j7d-pic j7d-pa"></div><div class="j7d-pic j7d-pb"></div></div>' +
                '<div class="j7d-bar">' +
                    '<div class="j7d-found" title="Différences trouvées">' + dots + '<b class="j7d-v-found">0/7</b></div>' +
                    '<div class="j7d-stats">' +
                        '<div class="j7d-stat err"><small>Erreurs</small><span class="j7d-v-err">0</span></div>' +
                        '<div class="j7d-stat"><small>Temps</small><span class="j7d-v-time">0:00</span></div>' +
                        '<div class="j7d-stat"><small>Record</small><span class="j7d-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="j7d-stars"></div>' +
                    '<div class="j7d-btns">' +
                        '<button class="j7d-btn j7d-hint" title="Entourer la zone d\'une différence">💡<span class="j7d-bl"> Indice</span></button>' +
                        '<button class="j7d-btn j7d-sol" title="Montrer toutes les différences">🎬<span class="j7d-bl"> Solution</span></button>' +
                        '<button class="j7d-btn j7d-reset" title="Recommencer la scène">↺<span class="j7d-bl"> Recommencer</span></button>' +
                        '<button class="j7d-btn j7d-prev" title="Scène précédente">◀<span class="j7d-bl"> Préc.</span></button>' +
                        '<button class="j7d-btn j7d-next" title="Scène suivante"><span class="j7d-bl">Suiv. </span>▶</button>' +
                        '<button class="j7d-btn j7d-rand" title="Une nouvelle scène au hasard (même difficulté)">🎲<span class="j7d-bl"> Au hasard</span></button>' +
                    '</div>' +
                    '<div class="j7d-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="j7d-ov j7d-ov-levels"><div class="j7d-card" style="position:relative;"><button class="j7d-icon j7d-x" style="background:#0f5e4a;">✕</button><h3>Choisis une scène</h3><div class="j7d-lv-list"></div></div></div>' +
            '<div class="j7d-ov j7d-ov-win"><div class="j7d-card"><h3 class="j7d-win-title">Bravo !</h3><div class="j7d-win-stars"></div><div class="j7d-win-txt"></div>' +
                '<div class="j7d-win-btns"><button class="j7d-btn j7d-w-see">👀 Revoir</button><button class="j7d-btn j7d-w-levels">☰ Scènes</button><button class="j7d-btn j7d-rand j7d-w-rand">🎲 Au hasard</button><button class="j7d-btn j7d-next j7d-w-next">Scène suivante ▶</button></div></div></div>' +
            '<div class="j7d-ov j7d-ov-help"><div class="j7d-card" style="max-width:460px;position:relative;text-align:left;"><button class="j7d-icon j7d-x" style="background:#0f5e4a;">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> les deux images se ressemblent, mais l\'image <b>B</b> a <b>7 différences</b>. Retrouve-les toutes !</p>' +
                '<p style="margin:6px 0;">👆 <b>Clique ou touche</b> une différence sur l\'une ou l\'autre image : elle est entourée en rouge sur les deux.</p>' +
                '<p style="margin:6px 0;">🔎 Un objet peut avoir <b>disparu</b>, être <b>apparu</b>, avoir été <b>remplacé</b>, changé de <b>couleur</b>, de <b>taille</b>, être <b>retourné</b>, <b>tourné</b> ou <b>déplacé</b>.</p>' +
                '<p style="margin:6px 0;">❌ Un clic au mauvais endroit compte comme une <b>erreur</b>. Peu d\'erreurs et pas d\'indice = 3 étoiles !</p>' +
                '<p style="margin:6px 0;">🎲 <b>Au hasard</b> crée une nouvelle scène de la même difficulté, à volonté.</p></div></div>' +
            '<div class="j7d-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var stage = $('.j7d-stage'), picA = $('.j7d-pa'), picB = $('.j7d-pb');

        // ── Isoler les interactions du jeu du déplacement du widget ─────
        // L'en-tête reste une zone de prise pour déplacer le widget.
        function isolate(e) {
            if (e.target.closest('.j7d-head') && !e.target.closest('button')) return;
            e.stopPropagation();
            if (e.type === 'pointerdown' || e.type === 'mousedown') {
                if (typeof bringToFront === 'function') { try { bringToFront(widget); } catch (er) {} }
            }
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.j7d-head button').forEach(function (b) {
            ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
                b.addEventListener(t, function (e) { e.stopPropagation(); }, t === 'touchstart' ? { passive: true } : false);
            });
        });

        // ── Mise en page : images côte à côte ou l'une sous l'autre ──────
        function applySize() {
            if (S.fullboard || widget.classList.contains('phone-fs')) {
                root.style.width = ''; root.style.height = '';
            } else {
                root.style.width = S.w + 'px'; root.style.height = S.h + 'px';
            }
        }
        function layout() {
            var W = root.clientWidth, H = root.clientHeight;
            if (!W || !H) return;
            var ui = Math.max(0.75, Math.min(1.6, Math.min(W / DEF_W, H / DEF_H) * 1.05));
            root.style.setProperty('--ui', ui.toFixed(3));
            root.classList.toggle('j7d-narrow', W < 620);
            var sw = stage.clientWidth, sh = stage.clientHeight, gap = Math.round(12 * ui), R = VW / VH;
            var row = Math.min((sw - gap) / 2, sh * R), col = Math.min(sw, (sh - gap) / 2 * R);
            var useCol = col > row;
            var pw = Math.max(80, Math.floor(useCol ? col : row) - 8);
            stage.classList.toggle('col', useCol);
            stage.style.setProperty('--gap', gap + 'px');
            [picA, picB].forEach(function (p) { p.style.width = pw + 'px'; p.style.height = Math.round(pw / R) + 'px'; });
        }

        // ── Chargement d'une scène ───────────────────────────────────────
        function loadScene(level, randSeed, saved) {
            level = Math.max(0, Math.min(NB_LEVELS - 1, level | 0));
            S.level = level;
            S.rand = (randSeed != null) ? (randSeed >>> 0) : null;
            if (S.rand != null) {
                var gi = GROUPS.indexOf(groupOf(level));
                S.scene = genScene(S.rand, gi, S.rand % THEMES.length);
            } else S.scene = levelScene(level);
            S.found = []; S.errors = 0; S.hints = 0; S.solutionSeen = false; S.won = false;
            S.elapsed = 0; S.t0 = 0; S.hintIdx = -1;
            if (saved) {
                if (Array.isArray(saved.found)) S.found = saved.found.filter(function (k) { return k >= 0 && k < S.scene.diffs.length; });
                S.errors = saved.errors | 0; S.hints = saved.hints | 0;
                S.elapsed = +saved.elapsed || 0;
            }
            picA.innerHTML = sceneSVG(S.scene, 0, P + 'a') + '<div class="j7d-tag">A</div>';
            picB.innerHTML = sceneSVG(S.scene, 1, P + 'b') + '<div class="j7d-tag">B</div>';
            S.found.forEach(function (k) { drawMark(k, false, false); });
            hideOv();
            updateUI();
            setMsg(saved ? '' : THEMES[S.scene.theme].ico + ' ' + THEMES[S.scene.theme].name + ' : trouve les 7 différences !');
            layout();
        }

        function starsFor() {
            if (S.solutionSeen) return 0;
            var s = S.errors <= 2 ? 3 : (S.errors <= 6 ? 2 : 1);
            if (S.hints > 0) s = Math.min(s, 2);
            if (S.hints > 2) s = 1;
            return s;
        }
        function starHTML(n) {
            var h = '';
            for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
            return h;
        }
        function timeNow() { return S.elapsed + (S.t0 ? Date.now() - S.t0 : 0); }

        function updateUI() {
            var g = groupOf(S.level);
            var pill = $('.j7d-pill');
            pill.className = 'j7d-pill ' + g.cls; pill.textContent = g.name;
            $('.j7d-lvltxt').innerHTML = S.rand != null
                ? '🎲 <span class="j7d-lvlword">Au hasard</span>'
                : '<span class="j7d-lvlword">Scène </span>' + (S.level + 1) + ' / ' + NB_LEVELS;
            root.querySelectorAll('.j7d-found i').forEach(function (d, k) {
                d.classList.toggle('on', k < S.found.length && !S.solutionSeen);
                d.classList.toggle('sol', S.solutionSeen);
            });
            $('.j7d-v-found').textContent = S.found.length + '/' + NB_DIFF;
            $('.j7d-v-err').textContent = S.errors;
            $('.j7d-v-time').textContent = fmtTime(timeNow());
            var best = S.rand == null ? prog.best[S.level] : null;
            $('.j7d-v-best').textContent = best ? fmtTime(best) : '–';
            $('.j7d-stars').innerHTML = starHTML(S.rand == null ? (prog.stars[S.level] || 0) : 0);
            $('.j7d-hint').disabled = S.won;
            $('.j7d-sol').disabled = S.won;
            $('.j7d-reset').disabled = !S.found.length && !S.errors && !S.won;
            $('.j7d-prev').disabled = S.rand == null && S.level === 0;
            $('.j7d-next').disabled = S.rand == null && S.level === NB_LEVELS - 1;
            var sb = $('.j7d-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
        }
        function setMsg(t) { $('.j7d-msg').textContent = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // Chronomètre (affichage)
        var tick = setInterval(function () {
            if (!root.isConnected) { clearInterval(tick); return; }
            if (S.t0 && !S.won) $('.j7d-v-time').textContent = fmtTime(timeNow());
        }, 500);

        // ── Marques sur les images ───────────────────────────────────────
        function marksOf(pic) { return pic.querySelector('.j7d-marks'); }
        function drawMark(k, anim, sol) {
            var d = S.scene.diffs[k];
            [picA, picB].forEach(function (pic) {
                var g = marksOf(pic); if (!g) return;
                var c = svgEl('circle', { cx: d.x.toFixed(1), cy: d.y.toFixed(1), r: d.r.toFixed(1), 'class': 'j7d-mark' + (sol ? ' sol' : '') + (anim ? ' j7d-pop' : '') });
                var c2 = svgEl('circle', { cx: d.x.toFixed(1), cy: d.y.toFixed(1), r: (d.r - 3).toFixed(1), 'class': 'j7d-markin' });
                g.appendChild(c2); g.appendChild(c);
            });
        }
        function clearHint() {
            S.hintIdx = -1;
            root.querySelectorAll('.j7d-hintc').forEach(function (h) { h.remove(); });
        }
        function drawMiss(pic, x, y) {
            var g = marksOf(pic); if (!g) return;
            var m = svgEl('g', { 'class': 'j7d-miss' });
            m.appendChild(svgEl('circle', { cx: x, cy: y, r: 11, fill: 'rgba(239,68,68,.25)', stroke: '#ef4444', 'stroke-width': 2.5 }));
            m.appendChild(svgEl('path', { d: 'M' + (x - 5) + ' ' + (y - 5) + 'L' + (x + 5) + ' ' + (y + 5) + 'M' + (x + 5) + ' ' + (y - 5) + 'L' + (x - 5) + ' ' + (y + 5), stroke: '#ef4444', 'stroke-width': 3, 'stroke-linecap': 'round' }));
            g.appendChild(m);
            setTimeout(function () { m.remove(); }, 950);
        }

        // ── Clic / toucher sur une image ─────────────────────────────────
        function onPick(ev, pic) {
            if (S.won) return;
            if (ev.button != null && ev.button > 0) return;
            ev.preventDefault(); ev.stopPropagation();
            root.focus({ preventScroll: true });
            var svg = pic.querySelector('svg');
            if (!svg || !svg.getScreenCTM()) return;
            var pt = svg.createSVGPoint();
            pt.x = ev.clientX; pt.y = ev.clientY;
            var p = pt.matrixTransform(svg.getScreenCTM().inverse());
            if (!S.t0) S.t0 = Date.now();
            var bestK = -1, bestD = 1e9;
            S.scene.diffs.forEach(function (d, k) {
                if (S.found.indexOf(k) >= 0) return;
                var dist = Math.hypot(d.x - p.x, d.y - p.y);
                if (dist <= d.r + 4 && dist < bestD) { bestD = dist; bestK = k; }
            });
            if (bestK >= 0) {
                S.found.push(bestK);
                if (S.hintIdx === bestK) clearHint();
                drawMark(bestK, true, false);
                if (prog.sound) { beep(660, 0.09, 'triangle', 0.07); beep(990, 0.12, 'triangle', 0.06, 0.08); }
                var left = NB_DIFF - S.found.length;
                setMsg(left ? '✅ Bien vu ! Encore ' + left + ' différence' + (left > 1 ? 's' : '') + '.' : '');
                updateUI();
                if (S.found.length >= S.scene.diffs.length) win(); else save();
            } else {
                // Clic sur une différence déjà trouvée : pas d'erreur
                var already = S.scene.diffs.some(function (d, k) { return S.found.indexOf(k) >= 0 && Math.hypot(d.x - p.x, d.y - p.y) <= d.r + 4; });
                if (already) { setMsg('Celle-ci est déjà trouvée 😉'); return; }
                S.errors++;
                drawMiss(pic, p.x, p.y);
                pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
                if (prog.sound) beep(170, 0.14, 'square', 0.035);
                setMsg('❌ Pas de différence ici.');
                updateUI(); save();
            }
        }
        picA.addEventListener('pointerdown', function (e) { onPick(e, picA); });
        picB.addEventListener('pointerdown', function (e) { onPick(e, picB); });

        // ── Indice : entourer largement la zone d'une différence ─────────
        function hint() {
            if (S.won) return;
            var rest = [];
            S.scene.diffs.forEach(function (d, k) { if (S.found.indexOf(k) < 0) rest.push(k); });
            if (!rest.length) return;
            clearHint();
            var k = rest[Math.floor(Math.random() * rest.length)], d = S.scene.diffs[k];
            S.hints++; S.hintIdx = k;
            if (!S.t0) S.t0 = Date.now();
            // Zone plus grande et décalée : on indique le secteur, pas l'objet exact
            var R = d.r * 2.3 + 14, a = Math.random() * Math.PI * 2, off = d.r * 0.7;
            var cx = Math.max(R * 0.5, Math.min(VW - R * 0.5, d.x + Math.cos(a) * off));
            var cy = Math.max(R * 0.5, Math.min(VH - R * 0.5, d.y + Math.sin(a) * off));
            [picA, picB].forEach(function (pic) {
                var g = marksOf(pic);
                if (g) g.appendChild(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: R.toFixed(1), 'class': 'j7d-hintc' }));
            });
            setMsg('💡 Une différence se cache dans le cercle jaune.');
            if (prog.sound) beep(880, 0.12, 'sine', 0.05);
            updateUI(); save();
        }

        // ── Solution : montrer toutes les différences restantes ─────────
        function showSolution() {
            if (S.won) return;
            clearHint();
            S.solutionSeen = true;
            var rest = [];
            S.scene.diffs.forEach(function (d, k) { if (S.found.indexOf(k) < 0) rest.push(k); });
            rest.forEach(function (k, j) {
                setTimeout(function () {
                    if (!root.isConnected) return;
                    S.found.push(k);
                    drawMark(k, true, true);
                    updateUI();
                    if (S.found.length >= S.scene.diffs.length) win();
                }, j * 350);
            });
            setMsg('🎬 Voici les différences…');
            updateUI();
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            if (S.won) return;
            S.won = true;
            if (S.t0) { S.elapsed += Date.now() - S.t0; S.t0 = 0; }
            clearHint();
            var stars = starsFor(), t = S.elapsed;
            var record = false;
            if (!S.solutionSeen && S.rand == null) {
                if (stars > (prog.stars[S.level] || 0)) prog.stars[S.level] = stars;
                if (!S.hints && (!prog.best[S.level] || t < prog.best[S.level])) { prog.best[S.level] = t; record = true; }
                saveProgress(prog);
            }
            updateUI();
            if (prog.sound && !S.solutionSeen) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.1 + j * 0.11); });
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.j7d-win-title').textContent = S.solutionSeen ? 'Solution affichée' : (stars === 3 ? 'Œil de lynx ! 🔍' : 'Bravo !');
                var st = $('.j7d-win-stars');
                st.innerHTML = starHTML(stars);
                st.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt;
                if (S.solutionSeen) txt = 'Observe bien les cercles violets, puis essaie une autre scène !';
                else txt = 'Les 7 différences trouvées en <b>' + fmtTime(t) + '</b>' +
                    '<br>avec <b>' + S.errors + '</b> erreur' + (S.errors > 1 ? 's' : '') +
                    (S.hints ? ' et ' + S.hints + ' indice' + (S.hints > 1 ? 's' : '') : '') +
                    (record ? '<br>🏆 Nouveau record !' : '');
                $('.j7d-win-txt').innerHTML = txt;
                $('.j7d-w-next').style.display = (S.rand != null || S.level < NB_LEVELS - 1) ? '' : 'none';
                showOv('.j7d-ov-win');
                if (stars >= 2 && !S.solutionSeen) confetti();
            }, S.solutionSeen ? 900 : 700);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#e11d2e', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'j7d-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Fenêtres : scènes / victoire / aide ──────────────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.j7d-ov').forEach(function (o) { o.classList.remove('show'); }); }
        function openLevels() {
            var html = '';
            GROUPS.forEach(function (g) {
                var done = 0;
                for (var j = g.from; j <= g.to; j++) if (prog.stars[j]) done++;
                html += '<div class="j7d-lv-grp"><span class="j7d-pill ' + g.cls + '">' + g.name + '</span> ' +
                        '<small style="color:#567;font-weight:700;">' + done + ' / ' + (g.to - g.from + 1) + ' réussies</small>' +
                        '<div class="j7d-lv-grid">';
                for (var i = g.from; i <= g.to; i++) {
                    var s = prog.stars[i] || 0, th = THEMES[i % THEMES.length];
                    html += '<button class="j7d-lv' + (i === S.level && S.rand == null ? ' cur' : '') + '" data-lv="' + i + '" title="' + th.name + '">' +
                            '<em>' + th.ico + '</em>' + (i + 1) + '<small>' + (s ? '★★★'.slice(0, s) : '') + '</small></button>';
                }
                html += '</div></div>';
            });
            $('.j7d-lv-list').innerHTML = html;
            showOv('.j7d-ov-levels');
        }
        function randomScene() {
            var seed = (Math.random() * 4294967295) >>> 0;
            loadScene(S.level, seed);
            save();
        }
        root.addEventListener('click', function (e) {
            var lv = e.target.closest('.j7d-lv');
            if (lv) { loadScene(+lv.dataset.lv); save(); return; }
            if (e.target.closest('.j7d-x')) { hideOv(); return; }
            if (e.target.classList.contains('j7d-ov') && !$('.j7d-ov-win').classList.contains('show')) hideOv();
        });
        root.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { hideOv(); e.stopPropagation(); }
        });

        $('.j7d-lvlbtn').addEventListener('click', openLevels);
        $('.j7d-hint').addEventListener('click', hint);
        $('.j7d-sol').addEventListener('click', showSolution);
        $('.j7d-reset').addEventListener('click', function () { loadScene(S.level, S.rand); save(); });
        $('.j7d-prev').addEventListener('click', function () {
            if (S.rand != null) { loadScene(S.level); save(); return; }
            if (S.level > 0) { loadScene(S.level - 1); save(); }
        });
        $('.j7d-next').addEventListener('click', function () {
            if (S.rand != null) { randomScene(); return; }
            if (S.level < NB_LEVELS - 1) { loadScene(S.level + 1); save(); }
        });
        $('.j7d-rand').addEventListener('click', randomScene);
        $('.j7d-w-rand').addEventListener('click', randomScene);
        $('.j7d-w-see').addEventListener('click', hideOv);
        $('.j7d-w-levels').addEventListener('click', openLevels);
        $('.j7d-w-next').addEventListener('click', function () {
            if (S.rand != null) randomScene();
            else { loadScene(S.level + 1); save(); }
        });
        $('.j7d-help').addEventListener('click', function () { showOv('.j7d-ov-help'); });
        $('.j7d-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv();
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '🔍 Les 7 différences', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('j7d-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.j7dZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.j7dZ || '';
            applySize();
            requestAnimationFrame(layout);
            save();
        });
        $('.wf-btn-close').addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} }
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            clearInterval(tick);
            widget.remove();
            save();
        });

        // ── Redimensionnement par la poignée ─────────────────────────────
        var grip = $('.j7d-grip'), rs = null;
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
        function endResize(e) {
            if (!rs || e.pointerId !== rs.id) return;
            rs = null; save();
        }
        grip.addEventListener('pointerup', endResize);
        grip.addEventListener('pointercancel', endResize);

        if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(root);
        else window.addEventListener('resize', layout);

        // ── Données pour la sauvegarde du tableau (save-load.js) ─────────
        widget._j7dGetData = function () {
            return {
                level: S.level,
                rand: S.rand,
                found: S.won ? null : S.found.slice(),
                errors: S.won ? 0 : S.errors,
                hints: S.won ? 0 : S.hints,
                elapsed: S.won ? 0 : timeNow(),
                w: S.w, h: S.h,
                fullboard: S.fullboard
            };
        };

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('j7d-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        var startLevel = (typeof data.level === 'number') ? data.level : firstUnsolved();
        loadScene(startLevel, (typeof data.rand === 'number') ? data.rand : null, data.found ? data : null);
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        // Sur téléphone, une partie lancée depuis le panneau s'ouvre directement
        // en plein écran (bouton vert), comme le Rush Hour
        if (!data.level && data.level !== 0 && isPhone() && !S.fullboard) {
            requestAnimationFrame(function () { $('.wf-btn-max').click(); });
        }

        function isPhone() {
            if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
            if (typeof window.isPhoneScreen === 'function') return !!window.isPhoneScreen();
            return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
        }
        function firstUnsolved() {
            for (var i = 0; i < NB_LEVELS; i++) if (!prog.stars[i]) return i;
            return 0;
        }
    }

    // =====================================================================
    // Création : depuis le panneau Jeux (createWidget) ou à la restauration
    // =====================================================================
    window.createJeu7DifferencesWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        // Le crochet de createWidget (ci-dessous) lit ces données de façon synchrone
        window._j7dNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._j7dNextPendingData = null;
        }
        if (w && !w._j7dInit) init7Diff(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-7-differences') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._j7dHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._j7dInit) {
                var pending = window._j7dNextPendingData || null;
                init7Diff(w, pending);
            }
            return w;
        };
        // Conserver les marqueurs des autres crochets (Rush Hour, Labyrinthe…)
        for (var k in orig) if (Object.prototype.hasOwnProperty.call(orig, k)) wrapped[k] = orig[k];
        wrapped._j7dHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests / le débogage
    window._j7dScene = levelScene;
    window._j7dGen = genScene;
})();
