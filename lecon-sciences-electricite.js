// =========================================================================
// ACTIVITÉ — L'ÉLECTRICITÉ : LES CIRCUITS ÉLECTRIQUES (cycle 3)
// -------------------------------------------------------------------------
// Widget autonome (type « sciences-electricite »), en 5 onglets :
//   1. L'atelier            — plaque de montage libre : piles, ampoules,
//                             interrupteurs, moteurs, DEL, fils. Le circuit est
//                             calculé en direct : ça s'allume… ou pas !
//                             Vue « objets réels » ou « schéma normalisé »,
//                             affichage du courant, exemples tout faits.
//   2. Les défis            — 10 montages à réaliser, vérifiés automatiquement
//                             (série, dérivation, ET / OU, court-circuit…)
//   3. Conducteur ou isolant ? — tester 12 objets dans un circuit
//   4. La leçon             — circuit fermé, symboles, série / dérivation,
//                             court-circuit, sécurité
//   5. Quiz                 — 12 questions corrigées
//
// Modèle électrique (simplifié mais cohérent) :
//   pile = source de tension E avec une petite résistance interne,
//   ampoule / moteur / DEL = résistances, fil et interrupteur fermé = liaison
//   parfaite, DEL = ne conduit que dans un sens. Résolution par la méthode
//   des nœuds. Brillance = puissance reçue (2 ampoules en série brillent
//   moins), ampoule grillée si trop de piles, court-circuit détecté par le
//   courant très fort dans la pile.
//
// Intégration :
//   - index.html : <script src="activite-sciences-electricite.js">
//                  + carte dans le panneau Activités (section HGS / sciences)
//                  + type 'sciences-electricite' dans EXCLUDED_TYPES
//   - save-load.js : electriciteData via widget._elcGetData / _elcSetData
// =========================================================================
(function () {
    'use strict';

    var TYPE   = 'sciences-electricite';
    var BASE_W = 1000;
    var DEF_W  = 1000;
    var DEF_H  = 660;
    var MIN_W  = 580;
    var MIN_H  = 400;

    // Plaque de montage
    var GRID = 40, BW = 920, BH = 480, HALF = 40;   // HALF = demi-longueur d'un composant (bornes à ±40)
    var MAX_COMPS = 18;

    // Grandeurs électriques (unités « école » : 1 pile = 1)
    var E_BAT = 1, R_BAT = 0.05, R_LAMP = 1, R_MOTOR = 1, R_LED = 1.2;
    var P0 = Math.pow(E_BAT / (R_LAMP + R_BAT), 2) * R_LAMP;   // puissance d'une ampoule seule sur une pile
    var BURN = 2.2;       // au-delà (en multiple de P0), l'ampoule ou la DEL grille
    var SHORT_I = 4;      // courant de pile au-delà duquel on parle de court-circuit
    var LIT = 0.15;       // seuil « allumée »

    var NAMES = { battery: 'Pile', lamp: 'Ampoule', 'switch': 'Interrupteur', motor: 'Moteur', led: 'DEL' };
    var WIRE_COLORS = ['#d63031', '#2d3436', '#0984e3', '#00a86b', '#e67e22', '#8e44ad'];

    // ─────────────────────────────────────────────────────────────────────
    // OUTILS
    // ─────────────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    }
    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function range(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    var DIRS = { 0: [1, 0], 90: [0, 1], 180: [-1, 0], 270: [0, -1] };
    function terms(c) {
        var d = DIRS[c.rot] || DIRS[0];
        return [{ x: c.x - HALF * d[0], y: c.y - HALF * d[1] }, { x: c.x + HALF * d[0], y: c.y + HALF * d[1] }];
    }
    var uidN = 0;

    // ─────────────────────────────────────────────────────────────────────
    // SIMULATION (méthode des nœuds)
    // ─────────────────────────────────────────────────────────────────────
    function solve(A, b) {
        var n = b.length, i, j, k;
        for (i = 0; i < n; i++) {
            var p = i, best = Math.abs(A[i][i]);
            for (k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > best) { best = Math.abs(A[k][i]); p = k; }
            if (best < 1e-14) continue;
            if (p !== i) { var t = A[i]; A[i] = A[p]; A[p] = t; var tb = b[i]; b[i] = b[p]; b[p] = tb; }
            for (k = i + 1; k < n; k++) {
                var f = A[k][i] / A[i][i];
                if (!f) continue;
                for (j = i; j < n; j++) A[k][j] -= f * A[i][j];
                b[k] -= f * b[i];
            }
        }
        var x = new Array(n).fill(0);
        for (i = n - 1; i >= 0; i--) {
            var s = b[i];
            for (j = i + 1; j < n; j++) s -= A[i][j] * x[j];
            x[i] = Math.abs(A[i][i]) < 1e-14 ? 0 : s / A[i][i];
        }
        return x;
    }

    // comps : [{id,type,x,y,rot,on,burnt}], wires : [{id,a:{c,t},b:{c,t}}]
    // ov : interrupteurs forcés {id: true/false} (pour vérifier les défis)
    function simulate(comps, wires, ov) {
        ov = ov || {};
        var parent = {};
        function key(id, t) { return id + ':' + t; }
        function find(k) { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; }
        function uni(a, b) { a = find(a); b = find(b); if (a !== b) parent[a] = b; }
        comps.forEach(function (c) { parent[key(c.id, 0)] = key(c.id, 0); parent[key(c.id, 1)] = key(c.id, 1); });
        wires.forEach(function (w) {
            var ka = key(w.a.c, w.a.t), kb = key(w.b.c, w.b.t);
            if (parent[ka] !== undefined && parent[kb] !== undefined) uni(ka, kb);
        });
        function closed(c) { return Object.prototype.hasOwnProperty.call(ov, c.id) ? !!ov[c.id] : !!c.on; }
        comps.forEach(function (c) { if (c.type === 'switch' && closed(c)) uni(key(c.id, 0), key(c.id, 1)); });

        var idx = {}, n = 0, N = {};
        function node(id, t) { var r = find(key(id, t)); if (idx[r] === undefined) idx[r] = n++; return idx[r]; }
        comps.forEach(function (c) { N[c.id] = [node(c.id, 0), node(c.id, 1)]; });

        var ledOn = {};
        comps.forEach(function (c) { if (c.type === 'led') ledOn[c.id] = true; });
        var V = [];
        for (var iter = 0; iter < 12; iter++) {
            var G = [], I = [];
            for (var i = 0; i < n; i++) { G.push(new Array(n).fill(0)); I.push(0); G[i][i] = 1e-6; }
            var stamp = function (a, b, g) { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
            comps.forEach(function (c) {
                var a = N[c.id][0], b = N[c.id][1];
                if (c.type === 'battery') { stamp(a, b, 1 / R_BAT); I[b] += E_BAT / R_BAT; I[a] -= E_BAT / R_BAT; }
                else if (c.type === 'lamp' && !c.burnt) stamp(a, b, 1 / R_LAMP);
                else if (c.type === 'motor') stamp(a, b, 1 / R_MOTOR);
                else if (c.type === 'led' && !c.burnt && ledOn[c.id]) stamp(a, b, 1 / R_LED);
            });
            V = n ? solve(G, I) : [];
            var changed = false;
            comps.forEach(function (c) {
                if (c.type !== 'led' || c.burnt) return;
                var vd = V[N[c.id][0]] - V[N[c.id][1]];
                if (ledOn[c.id] && vd < -1e-6) { ledOn[c.id] = false; changed = true; }
                else if (!ledOn[c.id] && vd > 0.05) { ledOn[c.id] = true; changed = true; }
            });
            if (!changed) break;
        }
        var res = {}, short = false, anyCurrent = false;
        comps.forEach(function (c) {
            var a = N[c.id][0], b = N[c.id][1], v = (V[a] || 0) - (V[b] || 0), I = 0, P = 0, R = 0;
            if (c.type === 'battery') { I = (E_BAT + v) / R_BAT; if (Math.abs(I) > SHORT_I) short = true; }
            else if (c.type === 'lamp') { R = R_LAMP; I = c.burnt ? 0 : v / R; }
            else if (c.type === 'motor') { R = R_MOTOR; I = v / R; }
            else if (c.type === 'led') { R = R_LED; I = (c.burnt || !ledOn[c.id]) ? 0 : v / R; }
            if (Math.abs(I) < 1e-4) I = 0;
            P = I * I * R;
            var bright = P / P0;
            res[c.id] = {
                I: I, v: v, b: bright, nodes: [a, b],
                lit: bright > LIT, over: (c.type === 'lamp' || c.type === 'led') && bright > BURN,
                ledReversed: c.type === 'led' && !ledOn[c.id] && v < -0.2,
                closed: c.type === 'switch' ? closed(c) : undefined
            };
            if (c.type !== 'battery' && c.type !== 'switch' && Math.abs(I) > 0.02) anyCurrent = true;
        });
        return { res: res, short: short, anyCurrent: anyCurrent };
    }

    // ─────────────────────────────────────────────────────────────────────
    // DESSINS DES COMPOSANTS
    // (repère local : composant horizontal centré en 0,0, bornes à -40 et +40)
    // ─────────────────────────────────────────────────────────────────────
    function T(x, y, txt, rot, attrs) {
        return '<text x="' + x + '" y="' + y + '" transform="rotate(' + (-rot) + ' ' + x + ' ' + y + ')" ' + (attrs || '') + '>' + txt + '</text>';
    }
    // Vue « objets réels »
    function realComp(c, r, u) {
        var rot = c.rot || 0, s = '';
        r = r || {};
        if (c.type === 'battery') {
            s += '<line x1="-40" y1="0" x2="-30" y2="0" stroke="#8a7a50" stroke-width="4"/><line x1="30" y1="0" x2="40" y2="0" stroke="#8a7a50" stroke-width="4"/>';
            if (r.short) s += '<rect class="elc-hot" x="-38" y="-24" width="76" height="48" rx="10" fill="#ff3b30" opacity=".55"/>';
            s += '<rect x="-31" y="-17" width="58" height="34" rx="6" fill="url(#elc-bat-' + u + ')" stroke="#1d2730" stroke-width="1.5"/>';
            s += '<rect x="12" y="-17" width="15" height="34" fill="#f5c518"/>';
            s += '<rect x="27" y="-8" width="7" height="16" rx="2" fill="#cfd8dc" stroke="#78909c"/>';
            // « 4,5 V » suit la pile (lisible de côté), sauf à l'envers où on le redresse
            s += '<text x="-5" y="4" text-anchor="middle" font-size="10" font-weight="800" fill="#fff"' + (rot === 180 ? ' transform="rotate(180 -5 0.5)"' : '') + '>4,5 V</text>';
            s += T(20, 5, '+', rot, 'text-anchor="middle" font-size="15" font-weight="900" fill="#1d2730"');
            s += T(-25, 5, '−', rot, 'text-anchor="middle" font-size="15" font-weight="900" fill="#fff"');
        } else if (c.type === 'lamp') {
            var b = Math.min(1.4, r.b || 0), lit = !c.burnt && b > LIT;
            s += '<path d="M-40,0 L-20,0 L-20,6 M40,0 L20,0 L20,6" stroke="#8a7a50" stroke-width="3" fill="none"/>';
            if (lit) s += '<circle cx="0" cy="-26" r="' + (30 + 14 * Math.min(1, b)) + '" fill="url(#elc-glow-' + u + ')" opacity="' + Math.min(1, 0.25 + b * 0.75).toFixed(2) + '"/>';
            s += '<circle cx="0" cy="-26" r="17" fill="' + (c.burnt ? '#6d6d6d' : lit ? 'rgb(255,' + Math.round(246 - 30 * Math.min(1, b)) + ',' + Math.round(170 - 90 * Math.min(1, b)) + ')' : 'rgba(225,238,246,.75)') + '" stroke="#90a4ae" stroke-width="1.5"/>';
            s += '<rect x="-9" y="-12" width="18" height="7" fill="#cfd8dc" stroke="#90a4ae"/>';
            if (c.burnt) s += '<path d="M-5,-10 L-5,-22 Q-3,-29 0,-29 M5,-10 L5,-20 Q4,-26 2,-25" stroke="#222" stroke-width="1.6" fill="none"/>';
            else s += '<path d="M-5,-10 L-5,-24 Q0,-33 5,-24 L5,-10" stroke="' + (lit ? '#ff8f00' : '#555') + '" stroke-width="' + (lit ? 2.2 : 1.5) + '" fill="none"/>';
            s += '<rect x="-22" y="-6" width="44" height="16" rx="3" fill="#8d6e63" stroke="#5d4037"/>';
            s += '<rect x="-13" y="-8" width="26" height="5" rx="1.5" fill="#b0bec5"/>';
            if (c.burnt) s += T(0, -50, '💥', rot, 'text-anchor="middle" font-size="16"');
        } else if (c.type === 'switch') {
            var on = !!c.on;
            s += '<line x1="-40" y1="0" x2="-24" y2="0" stroke="#8a7a50" stroke-width="3"/><line x1="24" y1="0" x2="40" y2="0" stroke="#8a7a50" stroke-width="3"/>';
            s += '<rect x="-34" y="-2" width="68" height="16" rx="3" fill="#bc9a6c" stroke="#7b5e3b"/>';
            s += '<rect x="20" y="-8" width="9" height="8" rx="1.5" fill="#b0bec5" stroke="#607d8b"/>';
            s += '<circle cx="-24" cy="-3" r="5" fill="#c9a227" stroke="#7a5c00"/>';
            var ex = on ? 24 : 15.3, ey = on ? -4 : -30;
            s += '<g class="elc-lever"><line x1="-24" y1="-3" x2="' + ex + '" y2="' + ey + '" stroke="#455a64" stroke-width="5" stroke-linecap="round"/>' +
                '<circle cx="' + ex + '" cy="' + ey + '" r="6" fill="#d32f2f" stroke="#7f1d1d"/>' +
                '<rect x="-36" y="-40" width="72" height="40" fill="transparent"/></g>';
        } else if (c.type === 'motor') {
            var I = r.I || 0, sp = Math.abs(I);
            s += '<path d="M-40,0 L-22,0 M40,0 L22,0" stroke="#8a7a50" stroke-width="3"/>';
            s += '<rect x="-22" y="-14" width="44" height="28" rx="7" fill="url(#elc-mot-' + u + ')" stroke="#37474f" stroke-width="1.5"/>';
            s += '<rect x="-14" y="-14" width="5" height="28" fill="#90a4ae" opacity=".6"/><rect x="9" y="-14" width="5" height="28" fill="#90a4ae" opacity=".6"/>';
            s += '<line x1="0" y1="-14" x2="0" y2="-30" stroke="#78909c" stroke-width="3"/>';
            var anim = sp > 0.05 ? ' style="animation-duration:' + Math.max(0.12, 0.9 / sp).toFixed(2) + 's;animation-direction:' + (I > 0 ? 'normal' : 'reverse') + '"' : ' style="animation:none"';
            s += '<g transform="translate(0,-34)"><g class="elc-prop"' + anim + '>' +
                '<ellipse cx="0" cy="-11" rx="4.5" ry="11" fill="#e53935"/><ellipse cx="0" cy="-11" rx="4.5" ry="11" fill="#1e88e5" transform="rotate(120)"/>' +
                '<ellipse cx="0" cy="-11" rx="4.5" ry="11" fill="#fdd835" transform="rotate(240)"/><circle r="3.5" fill="#37474f"/></g></g>';
            s += T(0, 5, 'M', rot, 'text-anchor="middle" font-size="12" font-weight="900" fill="#eceff1"');
        } else if (c.type === 'led') {
            var bl = Math.min(1.3, r.b || 0), litL = !c.burnt && bl > LIT;
            s += '<path d="M-40,0 L-7,0 L-5,-6 M40,0 L9,0 L5,-6" stroke="#9e9e9e" stroke-width="2.4" fill="none"/>';
            if (litL) s += '<circle cx="0" cy="-18" r="' + (20 + 10 * Math.min(1, bl)) + '" fill="url(#elc-rglow-' + u + ')" opacity="' + Math.min(1, 0.3 + bl * 0.7).toFixed(2) + '"/>';
            s += '<rect x="-11" y="-9" width="22" height="4" rx="1" fill="' + (c.burnt ? '#444' : '#c62828') + '"/>';
            s += '<path d="M-9,-8 L-9,-21 A9,9 0 0 1 9,-21 L9,-8 Z" fill="' + (c.burnt ? '#4e342e' : litL ? '#ff5252' : 'rgba(198,40,40,.75)') + '" stroke="#8e0000" stroke-width="1"/>';
            s += '<path d="M-4,-12 L-4,-22" stroke="#fff" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>';
            s += T(-26, -8, '+', rot, 'text-anchor="middle" font-size="13" font-weight="900" fill="#c62828"');
            if (c.burnt) s += T(0, -38, '💥', rot, 'text-anchor="middle" font-size="14"');
        }
        return s;
    }
    // Vue « schéma normalisé »
    function symComp(c, r) {
        var rot = c.rot || 0, s = '', K = 'stroke="#1f2a37" stroke-width="2.4" fill="none" stroke-linecap="round"';
        r = r || {};
        if (c.type === 'battery') {
            if (r.short) s += '<rect class="elc-hot" x="-22" y="-26" width="44" height="52" rx="8" fill="#ff3b30" opacity=".45"/>';
            s += '<path d="M-40,0 H-5 M5,0 H40" ' + K + '/>';
            s += '<line x1="-5" y1="-10" x2="-5" y2="10" stroke="#1f2a37" stroke-width="6"/>';
            s += '<line x1="5" y1="-20" x2="5" y2="20" stroke="#1f2a37" stroke-width="2.4"/>';
            s += T(16, -12, '+', rot, 'text-anchor="middle" font-size="14" font-weight="900" fill="#1f2a37"');
            s += T(-16, -12, '−', rot, 'text-anchor="middle" font-size="14" font-weight="900" fill="#1f2a37"');
        } else if (c.type === 'lamp') {
            var lit = !c.burnt && (r.b || 0) > LIT;
            s += '<path d="M-40,0 H-14 M14,0 H40" ' + K + '/>';
            if (lit) {
                s += '<circle r="22" fill="#ffe066" opacity="' + Math.min(0.9, 0.3 + (r.b || 0) * 0.6).toFixed(2) + '"/>';
                s += '<g stroke="#f59f00" stroke-width="2" stroke-linecap="round"><line x1="0" y1="-20" x2="0" y2="-27"/><line x1="15" y1="-15" x2="20" y2="-20"/><line x1="-15" y1="-15" x2="-20" y2="-20"/></g>';
            }
            s += '<circle r="14" fill="' + (c.burnt ? '#9e9e9e' : '#fff') + '" stroke="#1f2a37" stroke-width="2.4"/>';
            s += '<path d="M-10,-10 L10,10 M10,-10 L-10,10" ' + K + '/>';
            if (c.burnt) s += T(0, -24, '💥', rot, 'text-anchor="middle" font-size="14"');
        } else if (c.type === 'switch') {
            s += '<path d="M-40,0 H-16 M16,0 H40" ' + K + '/>';
            s += '<circle cx="-16" cy="0" r="2.8" fill="#1f2a37"/><circle cx="16" cy="0" r="2.8" fill="#1f2a37"/>';
            s += '<g class="elc-lever">' + (c.on ? '<line x1="-16" y1="0" x2="16" y2="0" ' + K + '/>' : '<line x1="-16" y1="0" x2="13" y2="-17" ' + K + '/>') +
                '<rect x="-26" y="-26" width="52" height="34" fill="transparent"/></g>';
        } else if (c.type === 'motor') {
            var I = r.I || 0, sp = Math.abs(I);
            s += '<path d="M-40,0 H-15 M15,0 H40" ' + K + '/>';
            s += '<circle r="15" fill="#fff" stroke="#1f2a37" stroke-width="2.4"/>';
            s += T(0, 5.5, 'M', rot, 'text-anchor="middle" font-size="16" font-weight="900" fill="#1f2a37"');
            if (sp > 0.05) s += '<g class="elc-prop" style="animation-duration:' + Math.max(0.2, 1.2 / sp).toFixed(2) + 's;animation-direction:' + (I > 0 ? 'normal' : 'reverse') + '"><path d="M0,-21 A21,21 0 0 1 18,-11" stroke="#1e88e5" stroke-width="2.4" fill="none"/><path d="M18,-11 l-1,-6 M18,-11 l-6,1" stroke="#1e88e5" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>';
        } else if (c.type === 'led') {
            var litL = !c.burnt && (r.b || 0) > LIT;
            s += '<path d="M-40,0 H-11 M11,0 H40" ' + K + '/>';
            s += '<path d="M-11,-11 L-11,11 L11,0 Z" fill="' + (c.burnt ? '#9e9e9e' : litL ? '#ff5252' : '#fff') + '" stroke="#1f2a37" stroke-width="2.4" stroke-linejoin="round"/>';
            s += '<line x1="11" y1="-11" x2="11" y2="11" stroke="#1f2a37" stroke-width="2.4"/>';
            s += '<g stroke="' + (litL ? '#e03131' : '#1f2a37') + '" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M2,-12 L9,-21 M9,-21 l-5,0 M9,-21 l0,5"/><path d="M8,-9 L15,-18 M15,-18 l-5,0 M15,-18 l0,5"/></g>';
            if (c.burnt) s += T(0, -26, '💥', rot, 'text-anchor="middle" font-size="14"');
        }
        return s;
    }
    function svgDefs(u) {
        return '<defs>' +
            '<linearGradient id="elc-bat-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5d6e"/><stop offset=".5" stop-color="#2c3a47"/><stop offset="1" stop-color="#1b2631"/></linearGradient>' +
            '<linearGradient id="elc-mot-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0bec5"/><stop offset=".5" stop-color="#78909c"/><stop offset="1" stop-color="#546e7a"/></linearGradient>' +
            '<radialGradient id="elc-glow-' + u + '"><stop offset="0" stop-color="#fff3b0" stop-opacity="1"/><stop offset=".45" stop-color="#ffd43b" stop-opacity=".55"/><stop offset="1" stop-color="#ffd43b" stop-opacity="0"/></radialGradient>' +
            '<radialGradient id="elc-rglow-' + u + '"><stop offset="0" stop-color="#ff8a80" stop-opacity="1"/><stop offset=".5" stop-color="#ff5252" stop-opacity=".45"/><stop offset="1" stop-color="#ff5252" stop-opacity="0"/></radialGradient>' +
            '<pattern id="elc-dots-' + u + '" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.8" fill="#b7c4cf"/></pattern>' +
            '<pattern id="elc-dots2-' + u + '" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.2" fill="#c9d3dc"/></pattern>' +
            '</defs>';
    }

    // Forme d'un fil entre deux points.
    // En vue schéma, le fil est tracé en équerre ; corner = coin choisi par routeSchema()
    // En vue « objets », da / db = direction de sortie de chaque borne (vers
    // l'extérieur de l'objet) : le câble quitte la borne en s'éloignant de
    // l'objet, au lieu de repasser sous lui.
    function wirePath(a, b, view, corner, da, db) {
        if (view === 'schema') {
            if (a.x === b.x || a.y === b.y) return 'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y;
            var k = corner || { x: b.x, y: a.y };
            return 'M' + a.x + ',' + a.y + ' L' + k.x + ',' + k.y + ' L' + b.x + ',' + b.y;
        }
        var dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy);
        var p1, p2;
        if (da || db) {
            var near = dist <= 90;                       // ex. fil entre les deux bornes d'un même objet
            var L = near ? 46 : Math.min(110, 34 + dist * 0.3);
            var sag = near ? 70 : 8 + dist * 0.08;
            p1 = da ? { x: a.x + da[0] * L, y: a.y + da[1] * L + sag } : { x: a.x + dx * 0.25, y: a.y + sag };
            p2 = db ? { x: b.x + db[0] * L, y: b.y + db[1] * L + sag } : { x: b.x - dx * 0.25, y: b.y + sag };
        } else {
            var sg = dist <= 90 ? 60 : 14 + dist * 0.18;
            p1 = { x: a.x + dx * 0.25, y: a.y + sg }; p2 = { x: b.x - dx * 0.25, y: b.y + sg };
        }
        return 'M' + a.x + ',' + a.y + ' C' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1) + ' ' + b.x + ',' + b.y;
    }
    // Direction « vers l'extérieur » de la borne t d'un composant
    function outDir(c, t) {
        var d = DIRS[c.rot] || DIRS[0];
        return t === 0 ? [-d[0], -d[1]] : [d[0], d[1]];
    }

    // Choix du coin de chaque fil en vue schéma : on évite de traverser un
    // composant et de superposer deux fils (deux tracés possibles, on garde le meilleur)
    function routeSchema(comps, wires, byId) {
        var segs = [], corners = {};
        function crossesBody(p, q) {
            var n = 0;
            comps.forEach(function (c) {
                var horiz = c.rot === 0 || c.rot === 180;
                var hx = horiz ? 30 : 16, hy = horiz ? 16 : 30;
                var x0 = Math.min(p.x, q.x), x1 = Math.max(p.x, q.x), y0 = Math.min(p.y, q.y), y1 = Math.max(p.y, q.y);
                if (x1 > c.x - hx && x0 < c.x + hx && y1 > c.y - hy && y0 < c.y + hy) n++;
            });
            return n;
        }
        function overlap(p, q) {
            var n = 0;
            segs.forEach(function (sg) {
                var a = sg[0], b = sg[1];
                if (p.y === q.y && a.y === b.y && a.y === p.y) {
                    var o = Math.min(Math.max(p.x, q.x), Math.max(a.x, b.x)) - Math.max(Math.min(p.x, q.x), Math.min(a.x, b.x));
                    if (o > 2) n++;
                } else if (p.x === q.x && a.x === b.x && a.x === p.x) {
                    var o2 = Math.min(Math.max(p.y, q.y), Math.max(a.y, b.y)) - Math.max(Math.min(p.y, q.y), Math.min(a.y, b.y));
                    if (o2 > 2) n++;
                }
            });
            return n;
        }
        wires.forEach(function (w) {
            var ca = byId[w.a.c], cb = byId[w.b.c];
            if (!ca || !cb) return;
            var A = terms(ca)[w.a.t], B = terms(cb)[w.b.t];
            if (A.x === B.x || A.y === B.y) { segs.push([A, B]); return; }
            var best = null, bs = 1e9;
            [{ x: B.x, y: A.y }, { x: A.x, y: B.y }].forEach(function (k) {
                var sc = (crossesBody(A, k) + crossesBody(k, B)) * 10 + (overlap(A, k) + overlap(k, B)) * 4;
                if (sc < bs) { bs = sc; best = k; }
            });
            corners[w.id] = best;
            segs.push([A, best], [best, B]);
        });
        return corners;
    }

    // Sens du courant dans un fil (1 : de a vers b, -1 : de b vers a, 0 : rien)
    function wireFlow(w, sim, comps) {
        function at(end) {
            var r = sim.res[end.c];
            if (!r || Math.abs(r.I) < 0.02) return 0;
            var out = (r.I > 0 && end.t === 1) || (r.I < 0 && end.t === 0);
            return out ? 1 : -1;     // 1 : le courant sort du composant par cette borne
        }
        var fa = at(w.a), fb = at(w.b);
        if (fa === 1 || fb === -1) return 1;
        if (fb === 1 || fa === -1) return -1;
        return 0;
    }

    // Rendu complet d'un circuit (chaîne SVG, sans la balise <svg>)
    function circuitSVG(comps, wires, sim, o) {
        var u = o.uid, view = o.view || 'real', s = '';
        var byId = {};
        comps.forEach(function (c) { byId[c.id] = c; });
        // fond
        s += '<rect x="0" y="0" width="' + BW + '" height="' + BH + '" fill="' + (view === 'schema' ? '#ffffff' : '#eef3f0') + '"/>';
        s += '<rect x="0" y="0" width="' + BW + '" height="' + BH + '" fill="url(#elc-' + (view === 'schema' ? 'dots2-' : 'dots-') + u + ')"/>';
        // composants
        s += '<g class="elc-comps">';
        comps.forEach(function (c) {
            var r = sim.res[c.id] || {};
            if (c.type === 'battery') r = { I: r.I, short: sim.short && Math.abs(r.I || 0) > SHORT_I };
            var sel = o.sel && o.sel.k === 'c' && o.sel.id === c.id;
            s += '<g class="elc-comp elc-t-' + c.type + (sel ? ' elc-sel' : '') + '" data-comp="' + c.id + '" transform="translate(' + c.x + ',' + c.y + ') rotate(' + (c.rot || 0) + ')">';
            if (sel) s += '<rect x="-48" y="-50" width="96" height="74" rx="10" fill="rgba(77,171,247,.12)" stroke="#4dabf7" stroke-width="2" stroke-dasharray="5 4"/>';
            s += '<rect class="elc-body" x="-34" y="-44" width="68" height="62" fill="transparent"/>';
            s += view === 'schema' ? symComp(c, r) : realComp(c, r, u);
            if (c.label) s += T(0, view === 'schema' ? 34 : 36, c.label, c.rot || 0, 'class="elc-lbl" text-anchor="middle"');
            s += '</g>';
        });
        s += '</g>';
        // fils (par-dessus les objets, comme de vrais câbles posés sur la table)
        var corners = view === 'schema' ? routeSchema(comps, wires, byId) : {};
        s += '<g class="elc-wires">';
        wires.forEach(function (w, i) {
            var ca = byId[w.a.c], cb = byId[w.b.c];
            if (!ca || !cb) return;
            var A = terms(ca)[w.a.t], B = terms(cb)[w.b.t];
            var da = outDir(ca, w.a.t), db = outDir(cb, w.b.t);
            var d = wirePath(A, B, view, corners[w.id], da, db), sel = o.sel && o.sel.k === 'w' && o.sel.id === w.id;
            var col = view === 'schema' ? '#1f2a37' : (w.col || WIRE_COLORS[i % WIRE_COLORS.length]);
            s += '<g class="elc-wire" data-wire="' + w.id + '">';
            if (sel) s += '<path d="' + d + '" stroke="#4dabf7" stroke-width="' + (view === 'schema' ? 9 : 12) + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>';
            if (view === 'schema') {
                s += '<path d="' + d + '" stroke="' + (sim.short ? '#e03131' : col) + '" stroke-width="2.4" fill="none" stroke-linejoin="round"/>';
            } else {
                s += '<path d="' + d + '" stroke="' + col + '" stroke-width="6" fill="none" stroke-linecap="round"/>';
                s += '<path d="' + d + '" stroke="rgba(255,255,255,.35)" stroke-width="1.6" fill="none" stroke-linecap="round" transform="translate(-1,-1.5)"/>';
            }
            if (o.showCurrent) {
                var f = wireFlow(w, sim, comps);
                if (f) s += '<path class="elc-flow' + (sim.short ? ' elc-flow-short' : '') + '" d="' + (f === 1 ? d : wirePath(B, A, view, corners[w.id], db, da)) + '" fill="none"/>';
            }
            s += '<path class="elc-hit" d="' + d + '" stroke="transparent" stroke-width="16" fill="none"/>';
            s += '</g>';
        });
        s += '</g>';
        // bornes
        s += '<g class="elc-terms">';
        comps.forEach(function (c) {
            terms(c).forEach(function (p, t) {
                var pend = o.pending && o.pending.c === c.id && o.pending.t === t;
                s += '<g class="elc-term' + (pend ? ' elc-pend' : '') + '" data-term="' + c.id + ':' + t + '">' +
                    '<circle cx="' + p.x + '" cy="' + p.y + '" r="14" fill="transparent"/>' +
                    (view === 'schema'
                        ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="#1f2a37"/>'
                        : '<circle cx="' + p.x + '" cy="' + p.y + '" r="6.5" fill="#d4a72c" stroke="#7a5c00" stroke-width="1.5"/><circle cx="' + p.x + '" cy="' + p.y + '" r="2.2" fill="#7a5c00"/>') +
                    (pend ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="12" fill="none" stroke="#4dabf7" stroke-width="3"/>' : '') +
                    '</g>';
            });
        });
        s += '</g>';
        return s;
    }

    // ─────────────────────────────────────────────────────────────────────
    // EXEMPLES ET DÉFIS
    // ─────────────────────────────────────────────────────────────────────
    function W(id, ac, at, bc, bt) { return { id: id, a: { c: ac, t: at }, b: { c: bc, t: bt } }; }
    var EXAMPLES = [
        { k: 'simple', label: 'Circuit simple',
          comps: [{ id: 'c1', type: 'battery', x: 240, y: 360, rot: 0 }, { id: 'c2', type: 'lamp', x: 480, y: 200, rot: 0 }],
          wires: [W('w1', 'c1', 1, 'c2', 1), W('w2', 'c1', 0, 'c2', 0)] },
        { k: 'inter', label: 'Avec interrupteur',
          comps: [{ id: 'c1', type: 'battery', x: 240, y: 360, rot: 0 }, { id: 'c2', type: 'lamp', x: 440, y: 160, rot: 0 }, { id: 'c3', type: 'switch', x: 640, y: 360, rot: 0, on: false }],
          wires: [W('w1', 'c1', 0, 'c2', 0), W('w2', 'c2', 1, 'c3', 1), W('w3', 'c3', 0, 'c1', 1)] },
        { k: 'serie', label: 'En série',
          comps: [{ id: 'c1', type: 'battery', x: 440, y: 400, rot: 0 }, { id: 'c2', type: 'lamp', x: 280, y: 160, rot: 0 }, { id: 'c3', type: 'lamp', x: 600, y: 160, rot: 0 }],
          wires: [W('w1', 'c1', 0, 'c2', 0), W('w2', 'c2', 1, 'c3', 0), W('w3', 'c3', 1, 'c1', 1)] },
        { k: 'deriv', label: 'En dérivation',
          comps: [{ id: 'c1', type: 'battery', x: 200, y: 280, rot: 270 }, { id: 'c2', type: 'lamp', x: 440, y: 160, rot: 0 }, { id: 'c3', type: 'lamp', x: 440, y: 400, rot: 0 }],
          wires: [W('w1', 'c1', 1, 'c2', 0), W('w2', 'c1', 1, 'c3', 0), W('w3', 'c2', 1, 'c3', 1), W('w4', 'c3', 1, 'c1', 0)] },
        { k: 'moteur', label: 'Moteur',
          comps: [{ id: 'c1', type: 'battery', x: 280, y: 360, rot: 0 }, { id: 'c2', type: 'motor', x: 520, y: 240, rot: 0 }],
          wires: [W('w1', 'c1', 1, 'c2', 0), W('w2', 'c2', 1, 'c1', 0)] },
        { k: 'cc', label: 'Court-circuit !',
          comps: [{ id: 'c1', type: 'battery', x: 280, y: 360, rot: 0 }, { id: 'c2', type: 'lamp', x: 520, y: 200, rot: 0 }],
          wires: [W('w1', 'c1', 1, 'c2', 1), W('w2', 'c1', 0, 'c2', 0), W('w3', 'c1', 0, 'c1', 1)] }
    ];

    // Chaque défi : composants imposés, éventuels fils déjà posés, et vérification.
    // chk(run) : run(ov) simule avec les interrupteurs forcés (ov : {étiquette: bool})
    // et renvoie un objet q avec q.lit(lbl), q.b(lbl), q.I(lbl), q.short, q.over.
    var CHALLENGES = [
        { title: 'Allume l’ampoule', text: 'Avec une pile et des fils, allume l’ampoule A.',
          hint: 'Il faut un « chemin » qui part d’une borne de la pile, passe par l’ampoule et revient à l’autre borne : un circuit fermé.',
          comps: [{ type: 'battery', x: 240, y: 360 }, { type: 'lamp', x: 600, y: 200, label: 'A' }],
          chk: function (run) { var q = run(); return q.lit('A'); } },
        { title: 'Un interrupteur', text: 'Branche l’interrupteur 1 pour pouvoir allumer et éteindre l’ampoule A.',
          hint: 'L’interrupteur se place dans la boucle, avec la pile et l’ampoule. Vérifie : fermé, ça s’allume ; ouvert, ça s’éteint.',
          comps: [{ type: 'battery', x: 200, y: 380 }, { type: 'lamp', x: 440, y: 160, label: 'A' }, { type: 'switch', x: 680, y: 380, label: '1', on: false }],
          chk: function (run) { return run({ 1: true }).lit('A') && !run({ 1: false }).lit('A'); } },
        { title: 'Deux ampoules, une pile', text: 'Allume les deux ampoules A et B avec une seule pile.',
          hint: 'Plusieurs montages sont possibles ! Essaie de les brancher l’une après l’autre, dans la même boucle.',
          comps: [{ type: 'battery', x: 200, y: 380 }, { type: 'lamp', x: 360, y: 160, label: 'A' }, { type: 'lamp', x: 640, y: 160, label: 'B' }],
          chk: function (run) { var q = run(); return q.lit('A') && q.lit('B'); },
          after: function (run) {
              var q = run();
              return q.b('A') < 0.6 ? 'Tes ampoules sont branchées <b>en série</b>, l’une après l’autre : elles se partagent l’énergie de la pile et brillent moins fort. Si l’une grille, l’autre s’éteint aussi.'
                                    : 'Tes ampoules sont branchées <b>en dérivation</b> : chacune a sa propre boucle et brille fort. Bravo !';
          } },
        { title: 'Deux ampoules qui brillent fort', text: 'Les ampoules A et B doivent briller aussi fort que si elles étaient seules avec la pile.',
          hint: 'Il faut que chaque ampoule soit reliée directement aux deux bornes de la pile : c’est le montage en dérivation.',
          comps: [{ type: 'battery', x: 200, y: 280, rot: 270 }, { type: 'lamp', x: 520, y: 160, label: 'A' }, { type: 'lamp', x: 520, y: 400, label: 'B' }],
          chk: function (run) { var q = run(); return q.b('A') > 0.75 && q.b('B') > 0.75; } },
        { title: 'Le moteur tourne', text: 'Fais tourner l’hélice du moteur dans le sens des aiguilles d’une montre ⟳.',
          hint: 'Si l’hélice tourne à l’envers, retourne la pile (bouton ↻ deux fois) ou inverse les fils : le moteur change de sens.',
          comps: [{ type: 'battery', x: 280, y: 380, rot: 180 }, { type: 'motor', x: 580, y: 220, label: 'M' }],
          chk: function (run) { return run().I('M') > 0.3; } },
        { title: 'Allume la DEL', text: 'Allume la diode électroluminescente (DEL).',
          hint: 'La DEL ne laisse passer le courant que dans un sens : sa borne « + » (la patte la plus longue) doit être reliée au + de la pile.',
          comps: [{ type: 'battery', x: 260, y: 360 }, { type: 'led', x: 600, y: 220, rot: 180, label: 'D' }],
          chk: function (run) { return run().lit('D'); } },
        { title: 'Les deux à la fois', text: 'L’ampoule A ne doit s’allumer que si l’on ferme <b>les deux</b> interrupteurs.',
          hint: 'Place les deux interrupteurs l’un après l’autre dans la même boucle (en série) : il suffit qu’un seul soit ouvert pour couper le courant.',
          comps: [{ type: 'battery', x: 200, y: 380 }, { type: 'lamp', x: 460, y: 140, label: 'A' }, { type: 'switch', x: 460, y: 400, label: '1', on: false }, { type: 'switch', x: 720, y: 260, label: '2', on: false, rot: 90 }],
          chk: function (run) { return run({ 1: true, 2: true }).lit('A') && !run({ 1: true, 2: false }).lit('A') && !run({ 1: false, 2: true }).lit('A') && !run({ 1: false, 2: false }).lit('A'); } },
        { title: 'L’un ou l’autre', text: 'L’ampoule A doit s’allumer si l’on ferme l’interrupteur 1 <b>ou</b> l’interrupteur 2.',
          hint: 'Place les deux interrupteurs côte à côte, en dérivation : chacun ouvre un passage pour le courant.',
          comps: [{ type: 'battery', x: 200, y: 380 }, { type: 'lamp', x: 460, y: 140, label: 'A' }, { type: 'switch', x: 520, y: 320, label: '1', on: false }, { type: 'switch', x: 520, y: 440, label: '2', on: false }],
          chk: function (run) { return run({ 1: true, 2: false }).lit('A') && run({ 1: false, 2: true }).lit('A') && run({ 1: true, 2: true }).lit('A') && !run({ 1: false, 2: false }).lit('A'); } },
        { title: 'Comme dans une maison', text: 'L’ampoule A reste toujours allumée ; l’interrupteur 1 n’allume et n’éteint que l’ampoule B.',
          hint: 'Mets les ampoules en dérivation, et place l’interrupteur dans la branche de l’ampoule B seulement. C’est ainsi que sont branchées les lampes d’une maison.',
          comps: [{ type: 'battery', x: 160, y: 280, rot: 270 }, { type: 'lamp', x: 440, y: 140, label: 'A' }, { type: 'lamp', x: 440, y: 400, label: 'B' }, { type: 'switch', x: 720, y: 400, label: '1', on: false }],
          chk: function (run) { var o = run({ 1: false }), f = run({ 1: true }); return o.lit('A') && !o.lit('B') && f.lit('A') && f.lit('B'); } },
        { title: 'Répare le court-circuit', text: 'Ce montage est dangereux : la pile chauffe ! Trouve le fil en trop, supprime-le et allume l’ampoule A.',
          hint: 'Un fil relie directement les deux bornes de l’ampoule : le courant passe par ce fil sans résistance, au lieu de traverser l’ampoule. Clique sur ce fil, puis sur ✕.',
          comps: [{ type: 'battery', x: 260, y: 380 }, { type: 'lamp', x: 560, y: 200, label: 'A' }],
          wires: [[0, 1, 1, 1], [0, 0, 1, 0], [1, 0, 1, 1]],
          chk: function (run) { var q = run(); return q.lit('A') && !q.short; } }
    ];
    function challengeCircuit(i) {
        var d = CHALLENGES[i], comps = [], wires = [];
        d.comps.forEach(function (c, k) {
            comps.push({ id: 'k' + k, type: c.type, x: c.x, y: c.y, rot: c.rot || 0, on: !!c.on, label: c.label || '', fixed: true });
        });
        (d.wires || []).forEach(function (w, k) { wires.push(W('kw' + k, 'k' + w[0], w[1], 'k' + w[2], w[3])); wires[k].col = WIRE_COLORS[k % WIRE_COLORS.length]; });
        return { comps: comps, wires: wires, nextId: 1 };
    }
    function checkChallenge(i, comps, wires) {
        var byLbl = {};
        comps.forEach(function (c) { if (c.label) byLbl[c.label] = c.id; });
        function run(ovL) {
            var ov = {};
            Object.keys(ovL || {}).forEach(function (l) { if (byLbl[l]) ov[byLbl[l]] = ovL[l]; });
            var r = simulate(comps, wires, ov);
            var over = Object.keys(r.res).some(function (id) { return r.res[id].over; });
            return {
                short: r.short, over: over,
                lit: function (l) { var x = r.res[byLbl[l]]; return !!x && x.lit && !r.short && !over; },
                b: function (l) { var x = r.res[byLbl[l]]; return x && !r.short && !over ? x.b : 0; },
                I: function (l) { var x = r.res[byLbl[l]]; return x && !r.short ? x.I : 0; }
            };
        }
        var ok = false;
        try { ok = !!CHALLENGES[i].chk(run); } catch (e) { ok = false; }
        return { ok: ok, after: ok && CHALLENGES[i].after ? CHALLENGES[i].after(run) : '' };
    }

    // ─────────────────────────────────────────────────────────────────────
    // CONDUCTEURS ET ISOLANTS
    // ─────────────────────────────────────────────────────────────────────
    var OBJECTS = [
        { id: 'cle', name: 'Une clé', mat: 'en fer', c: true,
          svg: '<circle cx="18" cy="30" r="11" fill="none" stroke="#8d99a6" stroke-width="6"/><path d="M28,30 H54 M46,30 v8 M52,30 v6" stroke="#8d99a6" stroke-width="6" stroke-linecap="round"/>' },
        { id: 'piece', name: 'Une pièce', mat: 'en métal', c: true,
          svg: '<circle cx="30" cy="30" r="20" fill="#e2b13c" stroke="#a87b12" stroke-width="3"/><circle cx="30" cy="30" r="14" fill="none" stroke="#c9971f" stroke-width="1.5"/><text x="30" y="36" text-anchor="middle" font-size="16" font-weight="900" fill="#8a6100">€</text>' },
        { id: 'trombone', name: 'Un trombone', mat: 'en acier', c: true,
          svg: '<path d="M22,48 V18 a8,8 0 0 1 16,0 V44 a5,5 0 0 1 -10,0 V22" fill="none" stroke="#8d99a6" stroke-width="3.5" stroke-linecap="round"/>' },
        { id: 'alu', name: 'Du papier d’aluminium', mat: 'en métal', c: true,
          svg: '<path d="M10,22 L22,12 L34,18 L50,10 L52,30 L46,48 L30,44 L14,50 L8,36 Z" fill="#d7dde3" stroke="#9aa5b1" stroke-width="2"/><path d="M22,12 L26,30 L14,50 M34,18 L30,44 M26,30 L46,48 M26,30 L52,30" stroke="#b6c0ca" stroke-width="1.2" fill="none"/>' },
        { id: 'cuillere', name: 'Une cuillère', mat: 'en métal', c: true,
          svg: '<ellipse cx="18" cy="30" rx="12" ry="9" fill="#c4ccd4" stroke="#8d99a6" stroke-width="2"/><path d="M29,30 H56" stroke="#8d99a6" stroke-width="5" stroke-linecap="round"/>' },
        { id: 'mine', name: 'La mine d’un crayon', mat: 'en graphite', c: true,
          svg: '<path d="M6,34 L40,34 L40,26 L6,26 Z" fill="#f2c94c" stroke="#b58900" stroke-width="1.5"/><path d="M40,26 L52,30 L40,34 Z" fill="#e8c9a0"/><path d="M48,28.6 L54,30 L48,31.4 Z" fill="#333"/><text x="30" y="52" text-anchor="middle" font-size="9" font-weight="800" fill="#555">graphite</text>' },
        { id: 'gomme', name: 'Une gomme', mat: 'en caoutchouc', c: false,
          svg: '<rect x="10" y="18" width="40" height="24" rx="4" fill="#f06595" stroke="#c2255c" stroke-width="2"/><rect x="10" y="18" width="16" height="24" rx="4" fill="#4dabf7" stroke="#1c7ed6" stroke-width="2"/>' },
        { id: 'regle', name: 'Une règle', mat: 'en plastique', c: false,
          svg: '<rect x="6" y="22" width="48" height="16" rx="2" fill="rgba(116,192,252,.55)" stroke="#339af0" stroke-width="2"/><path d="M12,22 v6 M18,22 v4 M24,22 v6 M30,22 v4 M36,22 v6 M42,22 v4 M48,22 v6" stroke="#1c7ed6" stroke-width="1.2"/>' },
        { id: 'bois', name: 'Un bâtonnet', mat: 'en bois', c: false,
          svg: '<rect x="6" y="25" width="48" height="10" rx="5" fill="#d9a066" stroke="#9c6b30" stroke-width="2"/><path d="M14,30 Q24,27 34,30 T50,30" stroke="#b07a40" stroke-width="1" fill="none"/>' },
        { id: 'bille', name: 'Une bille', mat: 'en verre', c: false,
          svg: '<circle cx="30" cy="30" r="16" fill="rgba(165,216,255,.6)" stroke="#4dabf7" stroke-width="2"/><path d="M22,32 Q30,22 38,30" stroke="#e8590c" stroke-width="3" fill="none"/><circle cx="24" cy="23" r="3.5" fill="#fff" opacity=".85"/>' },
        { id: 'liege', name: 'Un bouchon', mat: 'en liège', c: false,
          svg: '<path d="M18,14 L42,14 L38,48 L22,48 Z" fill="#c8a165" stroke="#8b6a35" stroke-width="2"/><g fill="#9c7a44"><circle cx="26" cy="24" r="1.5"/><circle cx="34" cy="30" r="1.5"/><circle cx="28" cy="38" r="1.5"/><circle cx="35" cy="20" r="1.2"/></g>' },
        { id: 'papier', name: 'Une feuille', mat: 'en papier', c: false,
          svg: '<path d="M14,8 H38 L46,16 V52 H14 Z" fill="#fff" stroke="#adb5bd" stroke-width="2"/><path d="M38,8 V16 H46" fill="none" stroke="#adb5bd" stroke-width="2"/><path d="M19,24 H41 M19,31 H41 M19,38 H35" stroke="#74c0fc" stroke-width="1.5"/>' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // QUIZ
    // ─────────────────────────────────────────────────────────────────────
    var QUIZ = [
        { q: 'Pour qu’une ampoule s’allume, le circuit doit être…', o: ['fermé', 'ouvert', 'coupé en deux', 'sans pile'], a: 0,
          x: 'Le courant doit pouvoir faire le tour complet : de la pile, à travers l’ampoule, et revenir à la pile.' },
        { q: 'Que fait un interrupteur ?', o: ['Il ouvre ou ferme le circuit', 'Il fabrique du courant', 'Il fait briller plus fort', 'Il change la couleur de la lumière'], a: 0,
          x: 'Ouvert, il coupe le chemin du courant ; fermé, il le laisse passer.' },
        { q: 'Lequel de ces objets laisse passer le courant ?', o: ['Une cuillère en métal', 'Une règle en plastique', 'Un bouchon en liège', 'Une gomme'], a: 0,
          x: 'Les métaux sont de bons conducteurs. Le plastique, le liège ou le caoutchouc sont des isolants.' },
        { q: 'Et la mine d’un crayon à papier ?', o: ['Elle conduit le courant', 'Elle ne le conduit pas', 'Elle le stocke', 'Elle fait exploser l’ampoule'], a: 0,
          x: 'C’est une surprise : la mine est en graphite, un matériau qui conduit l’électricité (moins bien que le métal).' },
        { q: 'Que se passe-t-il si un fil relie directement les deux bornes de la pile ?', o: ['Un court-circuit : la pile chauffe et s’use', 'L’ampoule brille plus fort', 'Rien du tout', 'La pile se recharge'], a: 0,
          x: 'Le courant passe par le fil sans rien traverser : il est très fort, la pile chauffe et se vide. Avec le courant de la maison, cela peut provoquer un incendie.' },
        { q: 'Deux ampoules branchées l’une après l’autre (en série) sur une pile…', o: ['brillent moins fort qu’une seule', 'brillent plus fort qu’une seule', 'ne s’allument jamais', 'grillent tout de suite'], a: 0,
          x: 'Elles se partagent l’énergie de la pile.' },
        { q: 'En série, si une ampoule grille…', o: ['l’autre s’éteint aussi', 'l’autre brille plus fort', 'l’autre ne change pas', 'la pile explose'], a: 0,
          x: 'Le circuit est coupé : le courant ne peut plus faire le tour.' },
        { q: 'En dérivation, si une ampoule grille…', o: ['l’autre reste allumée', 'l’autre s’éteint aussi', 'les deux grillent', 'la pile s’arrête'], a: 0,
          x: 'Chaque ampoule a sa propre boucle. C’est ainsi que sont branchées les lampes d’une maison.' },
        { q: 'Quel est le symbole de la lampe ?', o: ['Un cercle avec une croix', 'Un cercle avec la lettre M', 'Un grand trait fin et un petit trait épais', 'Un triangle et une barre'], a: 0,
          x: 'Le cercle avec la lettre M est le moteur, les deux traits sont la pile, le triangle avec une barre est la DEL.' },
        { q: 'Que se passe-t-il si l’on retourne la pile qui fait tourner un moteur ?', o: ['Il tourne dans l’autre sens', 'Il s’arrête pour toujours', 'Il tourne plus vite', 'Il grille'], a: 0,
          x: 'Le courant circule dans l’autre sens, le moteur aussi.' },
        { q: 'Une DEL ne s’allume pas. Que peut-on essayer ?', o: ['La retourner : elle ne marche que dans un sens', 'Ajouter de l’eau', 'L’envelopper de papier', 'Enlever la pile'], a: 0,
          x: 'Sa patte la plus longue (+) doit être du côté du + de la pile.' },
        { q: 'Pourquoi ne faut-il jamais toucher l’intérieur d’une prise électrique ?', o: ['Le courant de la maison (230 V) peut tuer', 'Cela use les piles', 'Cela éteint les lumières', 'Ce n’est pas dangereux'], a: 0,
          x: 'À l’école, on n’expérimente qu’avec des piles. Le corps humain conduit l’électricité, surtout avec les mains mouillées.' }
    ];

    var TABS = [
        { k: 'atelier', label: 'L’atelier' },
        { k: 'defis',   label: 'Les défis' },
        { k: 'cond',    label: 'Conducteur ou isolant ?' },
        { k: 'lecon',   label: 'La leçon' },
        { k: 'quiz',    label: 'Quiz' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────────────────────
    function injectCss() {
        if (document.getElementById('elc-style')) return;
        var css = `
.widget[data-type="sciences-electricite"] { background: transparent !important; border-radius: 16px; }
.elc-container {
    --ink:#1f2a37; --paper:#f4f6f8; --line:#d3dbe3; --navy:#1f3a5a; --yellow:#f5c518; --red:#e03131; --green:#2b8a3e;
    position: relative; display: flex; flex-direction: column; box-sizing: border-box;
    width: ${DEF_W}px; height: ${DEF_H}px; font-size: 16px;
    background: var(--paper); color: var(--ink); border-radius: 14px; overflow: hidden;
    box-shadow: 0 10px 34px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.25);
    font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; line-height: 1.35;
    user-select: none; -webkit-user-select: none; touch-action: manipulation;
}
.elc-container *, .elc-container *::before, .elc-container *::after { box-sizing: border-box; }
.elc-container.elc-fullboard { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important;
    z-index: 9999 !important; border-radius: 0 !important; padding-left: 60px; box-shadow: none !important; }
@media (max-width: 768px) { .elc-container.elc-fullboard { padding-left: 0; } }
.elc-container.elc-collapsed { height: auto !important; }
.elc-container.elc-collapsed .elc-body, .elc-container.elc-collapsed .elc-tabs, .elc-container.elc-collapsed .elc-resize { display: none !important; }

.elc-head { flex-shrink: 0; background: linear-gradient(120deg, #1b2733, #2c3e50 60%, #1b2733); color: #fff; border-bottom: .2em solid var(--yellow); }
.elc-headrow { display: flex; align-items: center; gap: .7em; padding: .45em .8em .35em; }
.elc-logo { width: 2.1em; height: 2.1em; flex-shrink: 0; }
.elc-titles { flex: 1; min-width: 0; }
.elc-t1 { font-size: 1.12em; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.elc-t2 { font-size: .72em; opacity: .75; font-weight: 600; }
.elc-head .wf-btns { gap: .5em; }
.elc-tabs { display: flex; gap: .25em; padding: 0 .6em; overflow-x: auto; scrollbar-width: none; }
.elc-tabs::-webkit-scrollbar { display: none; }
.elc-tab { all: unset; flex-shrink: 0; padding: .42em .85em .5em; font-size: .82em; font-weight: 700; color: rgba(255,255,255,.72);
    border-radius: .6em .6em 0 0; transition: background .15s, color .15s; }
.elc-tab:hover { background: rgba(255,255,255,.1); color: #fff; }
.elc-tab.on { background: var(--paper); color: var(--navy); }
.elc-tab:focus-visible { outline: 2px solid var(--yellow); }

.elc-body { flex: 1; min-height: 0; position: relative; overflow: hidden; }
.elc-pane { position: absolute; inset: 0; overflow: auto; padding: .8em 1em 1em; display: none; }
.elc-pane.on { display: block; }
.elc-pane::-webkit-scrollbar { width: .5em; }
.elc-pane::-webkit-scrollbar-thumb { background: rgba(31,58,90,.3); border-radius: .3em; }
.elc-h { font-size: 1.02em; font-weight: 800; color: var(--navy); margin: 0 0 .5em; display: flex; align-items: center; gap: .4em; flex-wrap: wrap; }
.elc-h small { font-weight: 600; color: #6b7a89; font-size: .78em; }
.elc-p { font-size: .9em; margin: 0 0 .6em; }
.elc-btn { all: unset; display: inline-flex; align-items: center; gap: .35em; padding: .36em .75em; border-radius: .55em;
    background: #fff; border: 1px solid var(--line); font-size: .8em; font-weight: 700; color: var(--ink); white-space: nowrap;
    transition: background .15s, border-color .15s, transform .08s; }
.elc-btn:hover { border-color: #f0b400; background: #fffbea; }
.elc-btn:active { transform: scale(.96); }
.elc-btn.prim { background: var(--navy); color: #fff; border-color: var(--navy); }
.elc-btn.prim:hover { background: #2a5078; }
.elc-btn.on { background: var(--yellow); color: #3b2f00; border-color: #e0b000; }
.elc-btn.danger { color: var(--red); }
.elc-btn[disabled] { opacity: .4; pointer-events: none; }
.elc-ctrl { display: flex; flex-wrap: wrap; gap: .35em; align-items: center; margin-bottom: .5em; }
.elc-ctrl .lbl { font-size: .74em; font-weight: 800; color: #6b7a89; margin-left: .4em; }
.elc-seg { display: inline-flex; border: 1px solid var(--line); border-radius: .55em; overflow: hidden; background: #fff; }
.elc-seg .elc-btn { border: none; border-radius: 0; }
.elc-seg .elc-btn + .elc-btn { border-left: 1px solid var(--line); }
.elc-info { background: #fff; border: 1px solid var(--line); border-left: .3em solid var(--yellow); border-radius: .6em; padding: .55em .8em; font-size: .88em; }
.elc-info b.it { display: block; color: var(--navy); font-size: 1.04em; margin-bottom: .15em; }
.elc-info.ok { border-left-color: var(--green); background: #ebfbee; }
.elc-info.ko { border-left-color: var(--red); background: #fff5f5; }
.elc-info.warn { border-left-color: #f08c00; background: #fff9db; }

/* Atelier */
.elc-atelier { display: grid; grid-template-columns: 7.2em 1fr; gap: .7em; align-items: start; }
.elc-palette { display: flex; flex-direction: column; gap: .4em; }
.elc-palette-title { font-size: .72em; font-weight: 800; color: #6b7a89; text-transform: uppercase; letter-spacing: .06em; }
.elc-pal { display: flex; flex-direction: column; align-items: center; background: #fff; border: 1px solid var(--line); border-radius: .7em;
    padding: .25em .2em .3em; transition: border-color .15s, transform .12s, box-shadow .15s; touch-action: none; }
.elc-pal:hover { border-color: #f0b400; transform: translateY(-2px); box-shadow: 0 .4em .8em rgba(31,58,90,.12); }
.elc-pal svg { width: 100%; height: 3.2em; display: block; }
.elc-pal b { font-size: .74em; }
.elc-pal-hint { font-size: .66em; color: #6b7a89; text-align: center; line-height: 1.25; }
.elc-board { width: 100%; height: auto; display: block; border-radius: .6em; border: 2px solid #9fb0bf; touch-action: none; background: #eef3f0; }
.elc-status { margin-bottom: .5em; min-height: 3.1em; }
.elc-select { font: inherit; font-size: .8em; font-weight: 700; color: var(--ink); padding: .36em .5em; border-radius: .55em;
    border: 1px solid var(--line); background: #fff; height: auto; }
.elc-select:hover { border-color: #f0b400; }
.elc-ghost { position: fixed; z-index: 100000; width: 5.5em; height: 4em; pointer-events: none; opacity: .85;
    transform: translate(-50%, -50%); filter: drop-shadow(0 6px 10px rgba(0,0,0,.3)); }
.elc-ghost svg { width: 100%; height: 100%; }

.elc-board .elc-lbl { font-size: 15px; font-weight: 900; fill: #1f3a5a; paint-order: stroke; stroke: #fff; stroke-width: 4px; }
.elc-flow { stroke: #ffd43b; stroke-width: 3.2; stroke-dasharray: 3 11; stroke-linecap: round; animation: elc-flow .6s linear infinite; pointer-events: none; }
.elc-flow-short { stroke: #ff6b6b; animation-duration: .2s; }
@keyframes elc-flow { to { stroke-dashoffset: -28; } }
.elc-prop { transform-box: fill-box; transform-origin: center; animation: elc-spin 1s linear infinite; }
@keyframes elc-spin { to { transform: rotate(360deg); } }
@keyframes elc-hot { 50% { opacity: .15; } }
.elc-hot { animation: elc-hot .5s ease-in-out infinite; }
@keyframes elc-pend { 50% { opacity: .3; } }
.elc-pend circle:last-child { animation: elc-pend .8s infinite; }
.elc-tool circle { transition: transform .12s; transform-box: fill-box; transform-origin: center; }
.elc-tool:hover circle { transform: scale(1.12); }
@media (prefers-reduced-motion: reduce) { .elc-flow, .elc-hot, .elc-pend circle:last-child { animation: none; } }

/* Défis */
.elc-defis { display: grid; grid-template-columns: 13em 1fr; gap: .8em; align-items: start; }
.elc-chlist { display: flex; flex-direction: column; gap: .3em; }
.elc-ch { display: flex; align-items: center; gap: .5em; padding: .38em .5em; background: #fff; border: 1px solid var(--line); border-radius: .6em;
    font-size: .8em; font-weight: 700; transition: background .15s, transform .12s; }
.elc-ch:hover { transform: translateX(2px); background: #fffbea; }
.elc-ch.on { background: #e7f0fa; border-color: var(--navy); }
.elc-ch .n { flex-shrink: 0; width: 1.7em; height: 1.7em; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: #e9edf1; color: #4a5a6a; font-size: .85em; }
.elc-ch.done .n { background: var(--green); color: #fff; }
.elc-chprog { font-size: .74em; font-weight: 800; color: #6b7a89; margin-top: .2em; }

/* Conducteurs */
.elc-cond { display: grid; grid-template-columns: 1fr 1fr; gap: .9em; align-items: start; }
.elc-scene { width: 100%; height: auto; display: block; border-radius: .6em; border: 2px solid #9fb0bf; background: #eef3f0; }
.elc-objs { display: grid; grid-template-columns: repeat(4, 1fr); gap: .4em; }
.elc-obj { display: flex; flex-direction: column; align-items: center; text-align: center; background: #fff; border: 1px solid var(--line); border-radius: .7em;
    padding: .2em .2em .35em; position: relative; transition: border-color .15s, transform .12s; touch-action: none; }
.elc-obj:hover { border-color: #f0b400; transform: translateY(-2px); }
.elc-obj.on { border-color: var(--navy); background: #e7f0fa; }
.elc-obj svg { width: 2.8em; height: 2.8em; }
.elc-obj b { font-size: .68em; line-height: 1.15; }
.elc-obj small { font-size: .6em; color: #6b7a89; }
.elc-obj .badge { position: absolute; top: .2em; right: .25em; font-size: .75em; }
.elc-tbl { display: grid; grid-template-columns: 1fr 1fr; gap: .5em; margin-top: .7em; }
.elc-col { background: #fff; border: 1px solid var(--line); border-radius: .7em; padding: .45em .6em; min-height: 4em; }
.elc-col h4 { margin: 0 0 .3em; font-size: .82em; }
.elc-col.c h4 { color: var(--green); } .elc-col.i h4 { color: var(--red); }
.elc-col span { display: inline-block; font-size: .74em; font-weight: 700; padding: .12em .45em; margin: .12em; border-radius: 1em; background: #f1f3f5; }

/* Leçon */
.elc-lesson { display: grid; grid-template-columns: 1fr 1fr; gap: .7em; }
.elc-lcard { background: #fff; border: 1px solid var(--line); border-radius: .8em; padding: .6em .75em; border-top: .3em solid var(--c, #1f3a5a); }
.elc-lcard h4 { margin: 0 0 .35em; color: var(--navy); font-size: .95em; }
.elc-lcard p { margin: 0 0 .4em; font-size: .84em; }
.elc-lcard svg { width: 100%; height: auto; display: block; }
.elc-lcard.wide { grid-column: 1 / -1; }
.elc-symtab { display: grid; grid-template-columns: repeat(6, 1fr); gap: .4em; }
.elc-sym { text-align: center; border: 1px solid #e9edf1; border-radius: .6em; padding: .25em; }
.elc-sym svg { height: 3.4em; }
.elc-sym b { display: block; font-size: .72em; }
.elc-danger { border-top-color: var(--red); background: #fff5f5; }

/* Quiz */
.elc-quiz { max-width: 40em; margin: 0 auto; }
.elc-qhead { display: flex; justify-content: space-between; font-size: .82em; font-weight: 800; color: #6b7a89; margin-bottom: .4em; }
.elc-qbar { height: .45em; background: #e3e8ee; border-radius: .3em; overflow: hidden; margin-bottom: .8em; }
.elc-qbar i { display: block; height: 100%; background: var(--yellow); transition: width .3s; }
.elc-q { font-size: 1.1em; font-weight: 800; color: var(--navy); margin-bottom: .7em; }
.elc-opts { display: grid; grid-template-columns: 1fr 1fr; gap: .5em; }
.elc-opt { all: unset; padding: .7em .8em; border-radius: .7em; background: #fff; border: 2px solid var(--line); font-size: .92em; font-weight: 700; transition: border-color .15s; }
.elc-opt:hover { border-color: #f0b400; }
.elc-opt.ok { background: #ebfbee; border-color: var(--green); color: #1b5e20; }
.elc-opt.ko { background: #fff5f5; border-color: var(--red); color: #8a1c1c; }
.elc-opt.dim { opacity: .55; }
.elc-qnav { display: flex; justify-content: flex-end; margin-top: .7em; }
.elc-score { text-align: center; padding: 1em; }
.elc-score .big { font-size: 3em; font-weight: 900; color: var(--navy); }

.elc-resize { position: absolute; right: 0; bottom: 0; width: 1.3em; height: 1.3em; z-index: 5; touch-action: none;
    background: linear-gradient(135deg, transparent 50%, rgba(31,58,90,.5) 50%); border-radius: 0 0 14px 0; }
.elc-container.elc-fullboard .elc-resize { display: none; }

.elc-narrow .elc-atelier { grid-template-columns: 1fr; }
.elc-narrow .elc-palette { flex-direction: row; flex-wrap: wrap; }
.elc-narrow .elc-pal { flex: 1 1 5em; }
.elc-narrow .elc-palette-title, .elc-narrow .elc-pal-hint { width: 100%; }
.elc-narrow .elc-defis, .elc-narrow .elc-cond, .elc-narrow .elc-lesson { grid-template-columns: 1fr; }
.elc-narrow .elc-chlist { flex-direction: row; flex-wrap: wrap; }
.elc-narrow .elc-ch { flex: 1 1 10em; }
.elc-narrow .elc-symtab { grid-template-columns: repeat(3, 1fr); }
.elc-narrow .elc-opts { grid-template-columns: 1fr; }

/* ── Curseurs ──────────────────────────────────────────────────────────
   Flèche partout par défaut, main qui pointe sur ce qui se clique,
   main qui attrape sur ce qui se déplace, main fermée pendant le glisser. */
.elc-container, .elc-container * { cursor: default; }
.elc-container .elc-tab, .elc-container .elc-btn, .elc-container .wf-btn, .elc-container .elc-select, .elc-container .elc-select *,
.elc-container .elc-ch, .elc-container .elc-ch *,
.elc-container .elc-opt:not([disabled]),
.elc-container .elc-wire, .elc-container .elc-wire *,
.elc-container .elc-term, .elc-container .elc-term *,
.elc-container .elc-tool, .elc-container .elc-tool *,
.elc-container .elc-t-switch .elc-lever, .elc-container .elc-t-switch .elc-lever * { cursor: pointer; }
.elc-container .elc-btn[disabled], .elc-container .elc-opt[disabled] { cursor: default; }
.elc-container .elc-headrow, .elc-container .elc-headrow .elc-titles, .elc-container .elc-headrow .elc-titles *,
.elc-container .elc-headrow .elc-logo, .elc-container .elc-headrow .elc-logo *,
.elc-container .elc-pal, .elc-container .elc-pal *,
.elc-container .elc-obj, .elc-container .elc-obj *,
.elc-container .elc-comp, .elc-container .elc-comp * { cursor: grab; }
.elc-container .elc-t-switch .elc-lever, .elc-container .elc-t-switch .elc-lever * { cursor: pointer; }
.elc-container .elc-t-lamp.elc-burnt, .elc-container .elc-t-lamp.elc-burnt * { cursor: pointer; }
.elc-container .elc-resize { cursor: nwse-resize; }
.elc-container.elc-fullboard .elc-headrow, .elc-container.elc-fullboard .elc-headrow *,
.widget[data-anchored="true"] .elc-container .elc-headrow, .widget[data-anchored="true"] .elc-container .elc-headrow * { cursor: default; }
.elc-container.elc-fullboard .elc-headrow .wf-btn, .widget[data-anchored="true"] .elc-container .elc-headrow .wf-btn { cursor: pointer; }
.elc-container.elc-grabbing, .elc-container.elc-grabbing * { cursor: grabbing !important; }
body.elc-grabbing, body.elc-grabbing * { cursor: grabbing !important; }
`;
        var st = document.createElement('style');
        st.id = 'elc-style';
        st.textContent = css;
        document.head.appendChild(st);
    }

    var LOGO = '<svg class="elc-logo" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#f5c518" stroke="#fff3bf" stroke-width="2"/>' +
        '<path d="M22,6 L11,22 H19 L17,34 L29,17 H21 Z" fill="#1b2733" stroke="#1b2733" stroke-width="1" stroke-linejoin="round"/></svg>';

    // Petit dessin isolé d'un composant (palette, leçon)
    function miniSVG(type, view, u, extra) {
        var c = { id: 'm', type: type, x: 0, y: 0, rot: 0, on: extra && extra.on };
        var r = extra && extra.r ? extra.r : {};
        return '<svg viewBox="-50 -58 100 80">' + svgDefs(u) + (view === 'schema' ? symComp(c, r) : realComp(c, r, u)) + '</svg>';
    }

    // ─────────────────────────────────────────────────────────────────────
    // PLAQUE DE MONTAGE INTERACTIVE (utilisée par l'atelier et les défis)
    // ─────────────────────────────────────────────────────────────────────
    function makeBench(svg, cfg) {
        var u = 'b' + (++uidN);
        var B = { comps: [], wires: [], nextId: 1, sel: null, pending: null, sim: { res: {}, short: false } };
        svg.setAttribute('viewBox', '0 0 ' + BW + ' ' + BH);
        svg.innerHTML = svgDefs(u) + '<g class="elc-layer"></g><g class="elc-over"></g>';
        var layer = svg.querySelector('.elc-layer'), over = svg.querySelector('.elc-over');

        function byId(id) { for (var i = 0; i < B.comps.length; i++) if (B.comps[i].id === id) return B.comps[i]; return null; }
        function newId(p) { return p + (B.nextId++); }

        function runSim() {
            var sim;
            for (var k = 0; k < 6; k++) {
                sim = simulate(B.comps, B.wires);
                var burned = false;
                B.comps.forEach(function (c) {
                    var r = sim.res[c.id];
                    if (r && r.over && !c.burnt) { c.burnt = true; burned = true; }
                });
                if (!burned) break;
            }
            B.sim = sim;
            return sim;
        }
        function render() {
            var sim = runSim(), o = cfg.opts();
            layer.innerHTML = circuitSVG(B.comps, B.wires, sim, { uid: u, view: o.view, showCurrent: o.showCurrent, sel: B.sel, pending: B.pending });
            // l'ampoule grillée se répare d'un clic
            B.comps.forEach(function (c) {
                if (c.burnt) { var g = layer.querySelector('[data-comp="' + c.id + '"]'); if (g) g.classList.add('elc-burnt'); }
            });
            renderTools();
            if (cfg.onRender) cfg.onRender(sim, B);
        }
        function renderTools() {
            var s = '';
            if (B.sel && B.sel.k === 'c') {
                var c = byId(B.sel.id);
                if (c) {
                    var y = Math.max(22, c.y - 70), x = Math.min(BW - 40, Math.max(40, c.x));
                    var btns = [{ a: 'rot', t: '↻', tip: 'Tourner' }];
                    if (!c.fixed) btns.push({ a: 'del', t: '✕', tip: 'Supprimer' });
                    var x0 = x - (btns.length - 1) * 17;
                    btns.forEach(function (b, i) {
                        s += '<g class="elc-tool" data-act="' + b.a + '" transform="translate(' + (x0 + i * 34) + ',' + y + ')"><title>' + b.tip + '</title>' +
                            '<circle r="14" fill="' + (b.a === 'del' ? '#fff5f5' : '#fff') + '" stroke="' + (b.a === 'del' ? '#e03131' : '#1f3a5a') + '" stroke-width="2"/>' +
                            '<text y="5.5" text-anchor="middle" font-size="16" font-weight="900" fill="' + (b.a === 'del' ? '#e03131' : '#1f3a5a') + '">' + b.t + '</text></g>';
                    });
                }
            } else if (B.sel && B.sel.k === 'w') {
                var w = null;
                B.wires.forEach(function (x) { if (x.id === B.sel.id) w = x; });
                if (w) {
                    var ca = byId(w.a.c), cb = byId(w.b.c);
                    if (ca && cb) {
                        var A = terms(ca)[w.a.t], Bp = terms(cb)[w.b.t];
                        var mx = (A.x + Bp.x) / 2, my = (A.y + Bp.y) / 2;
                        if (cfg.opts().view !== 'schema') {
                            // point au milieu de la courbe du câble
                            var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            tmp.setAttribute('d', wirePath(A, Bp, 'real', null, outDir(ca, w.a.t), outDir(cb, w.b.t)));
                            over.appendChild(tmp);
                            try { var mp = tmp.getPointAtLength(tmp.getTotalLength() / 2); mx = mp.x; my = mp.y + 22; } catch (er) {}
                            tmp.remove();
                        }
                        if (cfg.opts().view === 'schema' && A.x !== Bp.x && A.y !== Bp.y) {
                            var byIdM = {}; B.comps.forEach(function (c) { byIdM[c.id] = c; });
                            var kk = routeSchema(B.comps, B.wires, byIdM)[w.id] || { x: Bp.x, y: A.y };
                            mx = kk.x; my = kk.y;
                        }
                        s += '<g class="elc-tool" data-act="delw" transform="translate(' + mx + ',' + (my - 22) + ')"><title>Supprimer le fil</title>' +
                            '<circle r="14" fill="#fff5f5" stroke="#e03131" stroke-width="2"/><text y="5.5" text-anchor="middle" font-size="16" font-weight="900" fill="#e03131">✕</text></g>';
                    }
                }
            }
            over.innerHTML = s;
        }
        function changed() { render(); if (cfg.onChange) cfg.onChange(B); }

        function toSvg(e) {
            var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
            var m = svg.getScreenCTM();
            return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
        }
        function snap(v, max) { return Math.max(GRID, Math.min(max - GRID, Math.round(v / GRID) * GRID)); }
        function occupied(x, y, except) {
            return B.comps.some(function (c) { return c.id !== except && Math.abs(c.x - x) < 70 && Math.abs(c.y - y) < 60; });
        }
        function freeSpot(x, y, except) {
            if (!occupied(x, y, except)) return { x: x, y: y };
            for (var r = 1; r < 14; r++) {
                for (var dx = -r; dx <= r; dx++) for (var dy = -r; dy <= r; dy++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                    var nx = x + dx * GRID * 2, ny = y + dy * GRID;
                    if (nx < 80 || nx > BW - 80 || ny < 80 || ny > BH - 40) continue;
                    if (!occupied(nx, ny, except)) return { x: nx, y: ny };
                }
            }
            return { x: x, y: y };
        }
        function termAt(p, exclude) {
            var best = null, bd = 24;
            B.comps.forEach(function (c) {
                terms(c).forEach(function (q, t) {
                    if (exclude && exclude.c === c.id && exclude.t === t) return;
                    var d = Math.hypot(q.x - p.x, q.y - p.y);
                    if (d < bd) { bd = d; best = { c: c.id, t: t }; }
                });
            });
            return best;
        }
        function addWire(a, b) {
            if (!a || !b || (a.c === b.c && a.t === b.t)) return false;
            var dup = B.wires.some(function (w) {
                return (w.a.c === a.c && w.a.t === a.t && w.b.c === b.c && w.b.t === b.t) || (w.a.c === b.c && w.a.t === b.t && w.b.c === a.c && w.b.t === a.t);
            });
            if (dup) return false;
            var used = {};
            B.wires.forEach(function (w) { used[w.col] = (used[w.col] || 0) + 1; });
            var col = WIRE_COLORS.slice().sort(function (x, y) { return (used[x] || 0) - (used[y] || 0); })[0];
            B.wires.push({ id: newId('w'), a: { c: a.c, t: a.t }, b: { c: b.c, t: b.t }, col: col });
            return true;
        }
        function del() {
            if (!B.sel) return;
            if (B.sel.k === 'c') {
                var c = byId(B.sel.id);
                if (!c || c.fixed) return;
                B.comps = B.comps.filter(function (x) { return x.id !== c.id; });
                B.wires = B.wires.filter(function (w) { return w.a.c !== c.id && w.b.c !== c.id; });
            } else {
                B.wires = B.wires.filter(function (w) { return w.id !== B.sel.id; });
            }
            B.sel = null;
            changed();
        }

        // ── Pointeur sur la plaque ──
        var drag = null;
        svg.addEventListener('pointerdown', function (e) {
            if (e.button !== undefined && e.button > 0) return;
            var t = e.target, p = toSvg(e);
            var tool = t.closest('.elc-tool');
            if (tool) {
                e.preventDefault();
                var act = tool.dataset.act;
                if (act === 'rot' && B.sel) { var c = byId(B.sel.id); if (c) { c.rot = ((c.rot || 0) + 90) % 360; changed(); } }
                else if (act === 'del' || act === 'delw') del();
                return;
            }
            var term = t.closest('[data-term]');
            if (term) {
                e.preventDefault();
                var k = term.dataset.term.split(':');
                drag = { kind: 'wire', from: { c: k[0], t: +k[1] }, sx: e.clientX, sy: e.clientY, moved: false };
                try { svg.setPointerCapture(e.pointerId); } catch (er) {}
                return;
            }
            var comp = t.closest('[data-comp]');
            if (comp) {
                e.preventDefault();
                var cc = byId(comp.dataset.comp);
                drag = { kind: 'comp', c: cc, sx: e.clientX, sy: e.clientY, ox: p.x - cc.x, oy: p.y - cc.y, moved: false,
                         lever: !!t.closest('.elc-lever') };
                try { svg.setPointerCapture(e.pointerId); } catch (er) {}
                return;
            }
            var wire = t.closest('[data-wire]');
            if (wire) { B.sel = { k: 'w', id: wire.dataset.wire }; B.pending = null; render(); return; }
            if (B.sel || B.pending) { B.sel = null; B.pending = null; render(); }
        });
        svg.addEventListener('pointermove', function (e) {
            if (!drag) return;
            var dist = Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy);
            if (!drag.moved && dist < 5) return;
            if (!drag.moved) { drag.moved = true; cfg.container.classList.add('elc-grabbing'); }
            var p = toSvg(e);
            if (drag.kind === 'comp') {
                var nx = snap(p.x - drag.ox, BW), ny = snap(p.y - drag.oy, BH);
                if (nx !== drag.c.x || ny !== drag.c.y) { drag.c.x = nx; drag.c.y = ny; B.sel = { k: 'c', id: drag.c.id }; render(); }
            } else if (drag.kind === 'wire') {
                var c0 = byId(drag.from.c), A = terms(c0)[drag.from.t];
                var tgt = termAt(p, drag.from), end = p, dEnd = null;
                if (tgt) { var ct = byId(tgt.c); end = terms(ct)[tgt.t]; dEnd = outDir(ct, tgt.t); }
                var o = cfg.opts();
                over.innerHTML = '<path d="' + wirePath(A, end, o.view, null, outDir(c0, drag.from.t), dEnd) + '" stroke="' + (o.view === 'schema' ? '#1f2a37' : '#4dabf7') + '" stroke-width="' + (o.view === 'schema' ? 2.4 : 5) + '" fill="none" stroke-linecap="round" stroke-dasharray="' + (tgt ? '0' : '8 6') + '" opacity=".85"/>' +
                    (tgt ? '<circle cx="' + end.x + '" cy="' + end.y + '" r="12" fill="none" stroke="#4dabf7" stroke-width="3"/>' : '');
            }
        });
        function endDrag(e) {
            if (!drag) return;
            var d = drag; drag = null;
            cfg.container.classList.remove('elc-grabbing');
            if (d.kind === 'comp') {
                if (d.moved) {
                    var spot = freeSpot(d.c.x, d.c.y, d.c.id);
                    d.c.x = spot.x; d.c.y = spot.y;
                    B.sel = { k: 'c', id: d.c.id }; changed();
                } else {
                    // simple clic : interrupteur ↔, ampoule grillée remplacée, sélection
                    B.pending = null;
                    if (d.c.type === 'switch') d.c.on = !d.c.on;
                    if (d.c.burnt) d.c.burnt = false;
                    B.sel = { k: 'c', id: d.c.id };
                    changed();
                }
            } else if (d.kind === 'wire') {
                over.innerHTML = '';
                if (d.moved) {
                    var tgt = termAt(toSvg(e), d.from);
                    B.pending = null;
                    if (tgt && addWire(d.from, tgt)) { B.sel = null; changed(); } else render();
                } else {
                    // clic sur une borne, puis clic sur une autre : un fil (pratique au doigt)
                    if (B.pending && !(B.pending.c === d.from.c && B.pending.t === d.from.t)) {
                        var ok = addWire(B.pending, d.from);
                        B.pending = null; B.sel = null;
                        if (ok) changed(); else render();
                    } else {
                        B.pending = B.pending ? null : d.from;
                        B.sel = null;
                        render();
                    }
                }
            }
        }
        svg.addEventListener('pointerup', endDrag);
        svg.addEventListener('pointercancel', function () { drag = null; over.innerHTML = ''; cfg.container.classList.remove('elc-grabbing'); render(); });

        // ── Palette (atelier) : cliquer ou glisser un composant sur la plaque ──
        if (cfg.palette) {
            cfg.palette.addEventListener('pointerdown', function (e) {
                var it = e.target.closest('[data-pal]');
                if (!it || (e.button !== undefined && e.button > 0)) return;
                e.preventDefault();
                var type = it.dataset.pal, sx = e.clientX, sy = e.clientY, moved = false, ghost = null;
                function mv(ev) {
                    if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return;
                    if (!moved) {
                        moved = true;
                        ghost = document.createElement('div');
                        ghost.className = 'elc-ghost';
                        ghost.innerHTML = miniSVG(type, cfg.opts().view, 'g' + u);
                        document.body.appendChild(ghost);
                        document.body.classList.add('elc-grabbing');
                    }
                    ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
                }
                function up(ev) {
                    document.removeEventListener('pointermove', mv);
                    document.removeEventListener('pointerup', up);
                    document.removeEventListener('pointercancel', up);
                    document.body.classList.remove('elc-grabbing');
                    if (ghost) ghost.remove();
                    if (B.comps.length >= MAX_COMPS) { if (cfg.onFull) cfg.onFull(); return; }
                    var spot;
                    if (moved) {
                        var r = svg.getBoundingClientRect();
                        if (ev.type === 'pointercancel' || ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
                        var p = toSvg(ev);
                        spot = freeSpot(snap(p.x, BW), snap(p.y, BH));
                    } else {
                        spot = freeSpot(200 + (B.comps.length % 4) * 160, 160 + Math.floor(B.comps.length / 4) % 3 * 120);
                    }
                    var c = { id: newId('c'), type: type, x: spot.x, y: spot.y, rot: 0, on: false };
                    B.comps.push(c);
                    B.sel = { k: 'c', id: c.id };
                    changed();
                }
                document.addEventListener('pointermove', mv);
                document.addEventListener('pointerup', up);
                document.addEventListener('pointercancel', up);
            });
        }

        return {
            B: B,
            render: render,
            del: del,
            hasSel: function () { return !!B.sel; },
            get: function () { return { comps: clone(B.comps), wires: clone(B.wires), nextId: B.nextId }; },
            set: function (d) {
                B.comps = (d && d.comps ? clone(d.comps) : []).filter(function (c) { return NAMES[c.type]; });
                var ids = {}; B.comps.forEach(function (c) { ids[c.id] = 1; });
                B.wires = (d && d.wires ? clone(d.wires) : []).filter(function (w) { return ids[w.a.c] && ids[w.b.c]; });
                B.nextId = Math.max(d && d.nextId || 1, B.comps.length + B.wires.length + 1);
                B.sel = null; B.pending = null;
                render();
            },
            clear: function () { B.comps = B.comps.filter(function (c) { return c.fixed; }); B.wires = []; B.sel = null; B.pending = null; changed(); }
        };
    }

    // Message d'état d'un circuit
    function statusOf(sim, B) {
        var comps = B.comps;
        var n = function (t) { return comps.filter(function (c) { return c.type === t; }).length; };
        if (!comps.length) return { cls: '', html: '<b class="it">🔧 La plaque est vide</b>Glisse (ou clique) une pile et une ampoule depuis la colonne de gauche, puis relie leurs bornes dorées avec des fils : appuie sur une borne et fais glisser jusqu’à une autre.' };
        if (!n('battery')) return { cls: '', html: '<b class="it">🔋 Il manque une pile</b>C’est la pile qui fait circuler le courant. Sans pile, rien ne s’allume !' };
        if (sim.short) return { cls: 'ko', html: '<b class="it">⚠️ Court-circuit !</b>Les deux bornes de la pile sont reliées par un chemin sans ampoule ni moteur. Le courant est très fort : la pile chauffe et se vide très vite. Avec le courant de la maison, cela peut provoquer un incendie. Supprime le fil en trop !' };
        var burnt = comps.filter(function (c) { return c.burnt; });
        if (burnt.length) return { cls: 'warn', html: '<b class="it">💥 ' + (burnt[0].type === 'led' ? 'La DEL a grillé' : 'Une ampoule a grillé') + ' !</b>Il y avait trop de piles pour elle. Retire une pile, puis clique sur ' + (burnt[0].type === 'led' ? 'la DEL' : 'l’ampoule') + ' pour la remplacer par une neuve.' };
        var lamps = comps.filter(function (c) { return c.type === 'lamp' && sim.res[c.id] && sim.res[c.id].lit; });
        var motors = comps.filter(function (c) { return c.type === 'motor' && sim.res[c.id] && Math.abs(sim.res[c.id].I) > 0.05; });
        var leds = comps.filter(function (c) { return c.type === 'led' && sim.res[c.id] && sim.res[c.id].lit; });
        var revLed = comps.some(function (c) { return c.type === 'led' && sim.res[c.id] && sim.res[c.id].ledReversed; });
        if (lamps.length || motors.length || leds.length) {
            var parts = [];
            if (lamps.length) parts.push(lamps.length === 1 ? 'une ampoule brille' : lamps.length + ' ampoules brillent');
            if (leds.length) parts.push(leds.length === 1 ? 'la DEL s’allume' : leds.length + ' DEL s’allument');
            if (motors.length) parts.push(motors.length === 1 ? 'le moteur tourne' : motors.length + ' moteurs tournent');
            var extra = '';
            var dim = lamps.some(function (c) { return sim.res[c.id].b < 0.6; });
            if (dim) extra += ' Certaines ampoules brillent faiblement : elles sont branchées <b>en série</b> et se partagent l’énergie de la pile.';
            if (motors.length) {
                var cw = motors.some(function (c) { return sim.res[c.id].I > 0; }), ccw = motors.some(function (c) { return sim.res[c.id].I < 0; });
                extra += ' Le moteur tourne dans le sens ' + (cw && !ccw ? 'des aiguilles d’une montre ⟳' : ccw && !cw ? 'inverse des aiguilles d’une montre ⟲' : 'qui dépend de son branchement') + ' : retourne la pile pour changer de sens.';
            }
            if (revLed) extra += ' Une DEL reste éteinte : elle est branchée à l’envers.';
            var out = parts.join(', ');
            return { cls: 'ok', html: '<b class="it">💡 Le circuit est fermé : ' + out + ' !</b>Le courant fait le tour du circuit, d’une borne de la pile à l’autre.' + extra };
        }
        if (revLed) return { cls: 'warn', html: '<b class="it">🔴 La DEL est à l’envers</b>Une DEL ne laisse passer le courant que dans un sens : sa borne « + » doit être reliée au + de la pile. Sélectionne-la et tourne-la deux fois (↻ ↻).' };
        var openSw = comps.some(function (c) { return c.type === 'switch' && !c.on; });
        return { cls: '', html: '<b class="it">⭕ Le circuit est ouvert</b>Le courant ne peut pas faire le tour. Vérifie que chaque borne est bien reliée par un fil' + (openSw ? ' et que l’interrupteur est fermé (clique dessus)' : '') + '.' };
    }

    // ─────────────────────────────────────────────────────────────────────
    // HTML DES ONGLETS
    // ─────────────────────────────────────────────────────────────────────
    function paneAtelier() {
        var s = '<div class="elc-atelier"><div class="elc-palette"><div class="elc-palette-title">Composants</div>';
        ['battery', 'lamp', 'switch', 'motor', 'led'].forEach(function (t) {
            s += '<div class="elc-pal" data-pal="' + t + '" title="Glisse sur la plaque, ou clique pour ajouter"><span class="elc-pal-svg"></span><b>' + NAMES[t] + '</b></div>';
        });
        s += '<div class="elc-pal-hint">Glisse un composant sur la plaque.<br>Relie les bornes <b>dorées</b> avec des fils.</div></div>';
        s += '<div><div class="elc-ctrl">' +
            '<span class="elc-seg"><button class="elc-btn elc-view" data-view="real">📷 Objets</button><button class="elc-btn elc-view" data-view="schema">✏️ Schéma</button></span>' +
            '<button class="elc-btn elc-current">⚡ Voir le courant</button>' +
            '<select class="elc-select elc-exsel" title="Charger un montage tout prêt"><option value="">📚 Exemples…</option>';
        EXAMPLES.forEach(function (x, i) { s += '<option value="' + i + '">' + x.label + '</option>'; });
        s += '</select><span style="flex:1"></span><button class="elc-btn danger elc-clear">🗑 Tout effacer</button></div>';
        s += '<div class="elc-info elc-status elc-status-at"></div><svg class="elc-board elc-board-at"></svg></div></div>';
        return s;
    }
    function paneDefis() {
        var s = '<div class="elc-defis"><div><div class="elc-h">🏆 Les défis</div><div class="elc-chlist">';
        CHALLENGES.forEach(function (c, i) {
            s += '<div class="elc-ch" data-ch="' + i + '"><span class="n">' + (i + 1) + '</span><span>' + c.title + '</span></div>';
        });
        s += '</div><div class="elc-chprog"></div></div><div>';
        s += '<div class="elc-info elc-ch-goal" style="margin-bottom:.5em"></div>';
        s += '<div class="elc-ctrl"><span class="elc-seg"><button class="elc-btn elc-view" data-view="real">📷 Objets</button><button class="elc-btn elc-view" data-view="schema">✏️ Schéma</button></span>' +
            '<button class="elc-btn elc-current">⚡ Voir le courant</button><button class="elc-btn elc-hint">💡 Un indice</button>' +
            '<span style="flex:1"></span><button class="elc-btn elc-chreset">↺ Recommencer ce défi</button><button class="elc-btn prim elc-chnext">Défi suivant ▶</button></div>';
        s += '<div class="elc-info elc-status elc-status-ch"></div><svg class="elc-board elc-board-ch"></svg></div></div>';
        return s;
    }
    function condSceneSVG(u) {
        var bat = { id: 'sb', type: 'battery', x: 110, y: 230, rot: 270 }, lamp = { id: 'sl', type: 'lamp', x: 300, y: 70, rot: 0 };
        var s = '<svg class="elc-scene" viewBox="0 0 440 330">' + svgDefs(u);
        s += '<rect width="440" height="330" fill="#eef3f0"/><rect width="440" height="330" fill="url(#elc-dots-' + u + ')"/>';
        // fils fixes
        s += '<path d="M110,190 C110,90 200,70 260,70" stroke="#d63031" stroke-width="6" fill="none" stroke-linecap="round"/>';
        s += '<path d="M340,70 C420,80 400,240 330,262" stroke="#0984e3" stroke-width="6" fill="none" stroke-linecap="round"/>';
        s += '<path d="M110,270 C110,300 160,290 168,268" stroke="#2d3436" stroke-width="6" fill="none" stroke-linecap="round"/>';
        s += '<g class="elc-cond-lamp"></g>';
        s += '<g transform="translate(' + bat.x + ',' + bat.y + ') rotate(' + bat.rot + ')">' + realComp(bat, {}, u) + '</g>';
        // pinces crocodiles
        function croc(x, y, flip) {
            return '<g transform="translate(' + x + ',' + y + ') scale(' + (flip ? -1 : 1) + ',1)">' +
                '<path d="M-12,-8 L22,-6 L26,-1 L22,4 L-12,8 Z" fill="#e03131" stroke="#8a1c1c" stroke-width="1.5"/>' +
                '<path d="M22,-6 L34,-3 M22,4 L34,1" stroke="#adb5bd" stroke-width="3" stroke-linecap="round"/>' +
                '<g stroke="#adb5bd" stroke-width="1.5"><line x1="27" y1="-4" x2="27" y2="-1"/><line x1="31" y1="-3" x2="31" y2="0"/></g></g>';
        }
        s += croc(178, 266, false) + croc(318, 266, true);
        s += '<rect class="elc-drop" x="200" y="226" width="96" height="80" rx="12" fill="rgba(255,255,255,.55)" stroke="#9fb0bf" stroke-width="2" stroke-dasharray="6 5"/>';
        s += '<text class="elc-drop-txt" x="248" y="270" text-anchor="middle" font-size="12" font-weight="800" fill="#6b7a89">dépose ici</text>';
        s += '<g class="elc-cond-obj"></g>';
        s += '</svg>';
        return s;
    }
    function paneCond(u) {
        var s = '<div class="elc-cond"><div><div class="elc-h">🔎 Conducteur ou isolant ? <small>Le courant traverse-t-il l’objet ?</small></div>' + condSceneSVG(u) +
            '<div class="elc-info elc-cond-info" style="margin-top:.5em"></div></div>';
        s += '<div><div class="elc-h">🧺 Les objets à tester <small>Glisse-les entre les pinces (ou clique)</small></div><div class="elc-objs">';
        OBJECTS.forEach(function (o) {
            s += '<div class="elc-obj" data-obj="' + o.id + '"><span class="badge"></span><svg viewBox="0 0 60 60">' + o.svg + '</svg><b>' + o.name + '</b><small>' + o.mat + '</small></div>';
        });
        s += '</div><div class="elc-tbl"><div class="elc-col c"><h4>⚡ Conducteurs <small>(le courant passe)</small></h4><div class="elc-col-c"></div></div>' +
            '<div class="elc-col i"><h4>🚫 Isolants <small>(le courant ne passe pas)</small></h4><div class="elc-col-i"></div></div></div>' +
            '<div class="elc-ctrl" style="margin-top:.5em"><button class="elc-btn elc-cond-reset">↺ Tout recommencer</button></div></div></div>';
        return s;
    }
    function lessonSVG(comps, wires, view, u) {
        var sim = simulate(comps, wires);
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        comps.forEach(function (c) { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); });
        var vb = (x0 - 80) + ' ' + (y0 - 70) + ' ' + (x1 - x0 + 160) + ' ' + (y1 - y0 + 130);
        return '<svg viewBox="' + vb + '" style="max-height:13em">' + svgDefs(u) + circuitSVG(comps, wires, sim, { uid: u, view: view, showCurrent: true })
            .replace(/<g class="elc-terms">[\s\S]*$/, '') + '</svg>';
    }
    function paneLecon(u) {
        var ex = function (k) { for (var i = 0; i < EXAMPLES.length; i++) if (EXAMPLES[i].k === k) return EXAMPLES[i]; };
        var s = '<div class="elc-lesson">';
        s += '<div class="elc-lcard" style="--c:#f5c518"><h4>🔁 Un circuit fermé</h4><p>Pour qu’une ampoule s’allume, il faut une <b>boucle complète</b> : le courant part d’une borne de la pile, traverse l’ampoule et revient par l’autre borne. Si le chemin est coupé, le circuit est <b>ouvert</b> et rien ne s’allume.</p>' +
            lessonSVG(ex('simple').comps, ex('simple').wires, 'schema', u + 'a') + '</div>';
        s += '<div class="elc-lcard" style="--c:#1f3a5a"><h4>🔘 L’interrupteur</h4><p>Il <b>ouvre</b> ou <b>ferme</b> le circuit, comme un pont-levis : fermé, le courant passe ; ouvert, il est arrêté.</p>' +
            lessonSVG(ex('inter').comps, ex('inter').wires, 'schema', u + 'b') + '</div>';
        s += '<div class="elc-lcard wide" style="--c:#2b8a3e"><h4>✏️ Les symboles normalisés</h4><p>Pour dessiner un circuit, tous les électriciens du monde utilisent les mêmes symboles : c’est le <b>schéma</b>. Dans l’atelier, le bouton « Schéma » transforme tes objets en symboles.</p><div class="elc-symtab">';
        [['battery', 'Pile', 'Le grand trait fin est le +'], ['lamp', 'Lampe', ''], ['switch', 'Interrupteur ouvert', '', false], ['switch', 'Interrupteur fermé', '', true], ['motor', 'Moteur', ''], ['led', 'DEL', 'Le triangle montre le sens du courant']].forEach(function (x, i) {
            s += '<div class="elc-sym">' + miniSVG(x[0], 'real', u + 'r' + i, { on: x[3] }) + miniSVG(x[0], 'schema', u + 's' + i, { on: x[3] }) + '<b>' + x[1] + '</b></div>';
        });
        s += '</div></div>';
        s += '<div class="elc-lcard" style="--c:#e67700"><h4>➡️ En série</h4><p>Les ampoules sont l’une après l’autre, dans une seule boucle. Elles brillent <b>moins fort</b>. Si l’une grille ou est dévissée, <b>tout s’éteint</b> : le circuit est coupé.</p>' +
            lessonSVG(ex('serie').comps, ex('serie').wires, 'schema', u + 'c') + '</div>';
        s += '<div class="elc-lcard" style="--c:#7048e8"><h4>🔀 En dérivation</h4><p>Chaque ampoule a sa propre boucle avec la pile. Elles brillent <b>fort</b>, et si l’une grille, <b>l’autre reste allumée</b>. C’est le montage des lampes d’une maison.</p>' +
            lessonSVG(ex('deriv').comps, ex('deriv').wires, 'schema', u + 'd') + '</div>';
        s += '<div class="elc-lcard" style="--c:#e03131"><h4>⚠️ Le court-circuit</h4><p>Si un fil relie directement les deux bornes de la pile, le courant passe par ce fil sans rien traverser : il devient <b>très fort</b>. La pile chauffe et se vide. Les ampoules du circuit s’éteignent.</p>' +
            lessonSVG(ex('cc').comps, ex('cc').wires, 'schema', u + 'e') + '</div>';
        s += '<div class="elc-lcard elc-danger"><h4>⛔ Danger : le courant de la maison</h4><p>Une pile donne quelques volts : on peut faire des expériences sans risque. Mais le courant des <b>prises</b> de la maison (230 volts) est <b>très dangereux</b> : il peut brûler gravement et même tuer.</p>' +
            '<p>➜ Ne jamais mettre d’objet dans une prise.<br>➜ Ne jamais toucher un appareil électrique avec les mains mouillées : l’eau et le corps humain conduisent l’électricité.<br>➜ Ne jamais s’approcher d’un fil électrique tombé à terre ni d’un transformateur.</p></div>';
        s += '</div>';
        return s;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CRÉATION DU WIDGET
    // ─────────────────────────────────────────────────────────────────────
    function createElectriciteWidget(saved) {
        injectCss();
        var board = document.getElementById('board');
        if (!board) return null;
        var restoring = !!saved;
        if (!restoring && typeof snapshotNow === 'function') { try { snapshotNow(); } catch (e) {} }
        var u = 'w' + (++uidN);

        var widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = TYPE;
        widget.tabIndex = 0;
        var tabsHtml = TABS.map(function (t) { return '<button class="elc-tab" data-tab="' + t.k + '">' + t.label + '</button>'; }).join('');
        widget.innerHTML =
            '<div class="drag-handle" title="Déplacer">✥</div>' +
            '<div class="widget-rotate-handle" title="Faire pivoter">↻</div>' +
            '<div class="widget-action-bar">' +
                '<div class="widget-menu-handle" title="Menu">☰</div>' +
                '<div class="widget-pin-handle" title="Épingler">📌</div>' +
                '<div class="widget-back-handle" title="Envoyer derrière">🔽</div>' +
                '<div class="widget-close-handle" title="Fermer">×</div>' +
            '</div>' +
            '<div class="widget-ctx-menu"></div>' +
            '<div class="elc-container">' +
                '<div class="elc-head"><div class="elc-headrow">' + LOGO +
                    '<div class="elc-titles"><div class="elc-t1">L’électricité : les circuits électriques</div><div class="elc-t2">Piles, ampoules, interrupteurs… ça s’allume ou pas ?</div></div>' +
                    '<div class="wf-btns"><button class="wf-btn wf-btn-min" title="Réduire"></button><button class="wf-btn wf-btn-max" title="Plein écran"></button><button class="wf-btn wf-btn-close" title="Fermer"></button></div>' +
                '</div><div class="elc-tabs" role="tablist">' + tabsHtml + '</div></div>' +
                '<div class="elc-body">' +
                    '<section class="elc-pane" data-pane="atelier">' + paneAtelier() + '</section>' +
                    '<section class="elc-pane" data-pane="defis">' + paneDefis() + '</section>' +
                    '<section class="elc-pane" data-pane="cond">' + paneCond(u + 'c') + '</section>' +
                    '<section class="elc-pane" data-pane="lecon">' + paneLecon(u + 'l') + '</section>' +
                    '<section class="elc-pane" data-pane="quiz"><div class="elc-quiz"></div></section>' +
                '</div>' +
                '<div class="elc-resize" title="Redimensionner"></div>' +
            '</div>';

        var C = widget.querySelector('.elc-container');
        function q(sel) { return C.querySelector(sel); }
        function qa(sel) { return Array.prototype.slice.call(C.querySelectorAll(sel)); }

        var st = { tab: 'atelier', view: 'real', showCurrent: false, ch: 0, chDone: [], chData: {}, hint: false, cond: { tested: [], cur: null }, quiz: null };

        // ── Barre d'action ──
        widget.querySelector('.widget-menu-handle').addEventListener('click', function () { if (typeof toggleCtxMenu === 'function') toggleCtxMenu(widget); });
        widget.querySelector('.widget-pin-handle').addEventListener('click', function () { if (typeof togglePin === 'function') togglePin(widget); });
        widget.querySelector('.widget-back-handle').addEventListener('click', function () { if (typeof sendToBack === 'function') sendToBack(widget); });
        widget.querySelector('.widget-close-handle').addEventListener('click', closeWidget);

        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }
        var saveTimer = 0;
        function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }
        function closeWidget() {
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (e) {} }
            if (ro) ro.disconnect();
            widget.remove();
            save();
        }

        // ── Échelle ──
        function updateScale() {
            var w = C.clientWidth || DEF_W;
            var fs = Math.max(9, Math.min(26, 16 * w / BASE_W));
            C.style.fontSize = fs.toFixed(2) + 'px';
            C.classList.toggle('elc-narrow', w < 760 || (C.classList.contains('elc-fullboard') && w / fs < 50));
        }
        var ro = null;
        if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(updateScale); ro.observe(C); }

        // ── Isolation des événements ──
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (evt) {
            C.addEventListener(evt, function (e) {
                e.stopPropagation();
                if (evt === 'pointerdown' && typeof bringToFront === 'function') { try { bringToFront(widget); } catch (err) {} }
            }, evt === 'touchstart' ? { passive: true } : false);
        });
        C.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT') { e.stopPropagation(); return; }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                var bench = st.tab === 'atelier' ? benchA : st.tab === 'defis' ? benchC : null;
                if (bench && bench.hasSel()) { e.preventDefault(); e.stopPropagation(); bench.del(); }
            }
        });

        // ── Déplacement par la barre de titre ──
        q('.elc-headrow').addEventListener('pointerdown', function (e) {
            if (e.target.closest('.wf-btns, button')) return;
            if (C.classList.contains('elc-fullboard') || widget.dataset.anchored === 'true') return;
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            try { widget.focus({ preventScroll: true }); } catch (er) {}
            var sx = e.clientX, sy = e.clientY, ox = widget.offsetLeft, oy = widget.offsetTop, moved = false;
            function mv(ev) {
                var dx = ev.clientX - sx, dy = ev.clientY - sy;
                if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
                if (!moved) { moved = true; C.classList.add('elc-grabbing'); if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} } }
                widget.style.left = (ox + dx) + 'px';
                widget.style.top = Math.max(0, oy + dy) + 'px';
                if (typeof positionActionBar === 'function') { try { positionActionBar(widget); } catch (er) {} }
            }
            function up() {
                document.removeEventListener('pointermove', mv);
                document.removeEventListener('pointerup', up);
                document.removeEventListener('pointercancel', up);
                C.classList.remove('elc-grabbing');
                if (moved) { storePercents(); save(); }
            }
            document.addEventListener('pointermove', mv);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', up);
        });
        function storePercents() {
            var curW = window.innerWidth, curVH = (typeof virtualH === 'function') ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent = (widget.offsetTop / curVH) * 100;
        }

        // ── Redimensionnement ──
        q('.elc-resize').addEventListener('pointerdown', function (e) {
            e.preventDefault(); e.stopPropagation();
            var sx = e.clientX, sy = e.clientY, sw = C.offsetWidth, sh = C.offsetHeight;
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} }
            function mv(ev) {
                C.style.width = Math.max(MIN_W, sw + ev.clientX - sx) + 'px';
                C.style.height = Math.max(MIN_H, sh + ev.clientY - sy) + 'px';
            }
            function up() {
                document.removeEventListener('pointermove', mv);
                document.removeEventListener('pointerup', up);
                document.removeEventListener('pointercancel', up);
                save();
            }
            document.addEventListener('pointermove', mv);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', up);
        });

        // ── Boutons fenêtre ──
        function rememberSize() {
            if (!C.classList.contains('elc-fullboard') && !C.classList.contains('elc-collapsed')) {
                C.dataset.prevW = C.offsetWidth; C.dataset.prevH = C.offsetHeight;
            }
        }
        q('.wf-btn-max').addEventListener('pointerdown', rememberSize, true);
        q('.wf-btn-min').addEventListener('pointerdown', rememberSize, true);
        q('.wf-btn-close').addEventListener('click', closeWidget);
        q('.wf-btn-max').addEventListener('click', function () { setFullboard(!C.classList.contains('elc-fullboard')); save(); });
        q('.wf-btn-min').addEventListener('click', function () {
            if (C.classList.contains('elc-fullboard')) setFullboard(false);
            C.classList.toggle('elc-collapsed');
            save();
        });
        function setFullboard(on) {
            C.classList.toggle('elc-fullboard', on);
            if (on) C.classList.remove('elc-collapsed');
            q('.wf-btn-max').title = on ? 'Quitter le plein écran' : 'Plein écran';
            requestAnimationFrame(updateScale);
        }

        // ── Onglets ──
        function showTab(k) {
            if (!TABS.some(function (t) { return t.k === k; })) k = 'atelier';
            st.tab = k;
            qa('.elc-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === k); b.setAttribute('aria-selected', b.dataset.tab === k); });
            qa('.elc-pane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === k); });
            if (k === 'quiz') renderQuiz();
        }
        qa('.elc-tab').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); save(); }); });

        // ── Réglages communs (vue, courant) ──
        function opts() { return { view: st.view, showCurrent: st.showCurrent }; }
        function syncToggles() {
            qa('.elc-view').forEach(function (b) { b.classList.toggle('on', b.dataset.view === st.view); });
            qa('.elc-current').forEach(function (b) { b.classList.toggle('on', st.showCurrent); });
            qa('.elc-pal').forEach(function (p) { p.querySelector('.elc-pal-svg').innerHTML = miniSVG(p.dataset.pal, st.view, u + 'p' + p.dataset.pal + st.view); });
        }
        qa('.elc-view').forEach(function (b) {
            b.addEventListener('click', function () { st.view = b.dataset.view; syncToggles(); benchA.render(); benchC.render(); save(); });
        });
        qa('.elc-current').forEach(function (b) {
            b.addEventListener('click', function () { st.showCurrent = !st.showCurrent; syncToggles(); benchA.render(); benchC.render(); save(); });
        });

        // ═════════════ 1. L'ATELIER ═════════════
        var benchA = makeBench(q('.elc-board-at'), {
            container: C, palette: q('.elc-palette'), opts: opts,
            onRender: function (sim, B) {
                var stt = statusOf(sim, B), box = q('.elc-status-at');
                box.className = 'elc-info elc-status elc-status-at ' + stt.cls;
                box.innerHTML = stt.html;
            },
            onChange: saveSoon,
            onFull: function () {
                var box = q('.elc-status-at');
                box.className = 'elc-info elc-status elc-status-at warn';
                box.innerHTML = '<b class="it">La plaque est pleine</b>Supprime un composant (sélectionne-le puis ✕) avant d’en ajouter un autre.';
            }
        });
        q('.elc-exsel').addEventListener('change', function () {
            var x = EXAMPLES[+this.value];
            this.value = '';
            if (!x) return;
            benchA.set({ comps: x.comps, wires: x.wires.map(function (w, i) { var c = clone(w); c.col = WIRE_COLORS[i % WIRE_COLORS.length]; return c; }), nextId: 50 });
            save();
        });
        q('.elc-clear').addEventListener('click', function () { benchA.clear(); save(); });

        // ═════════════ 2. LES DÉFIS ═════════════
        var benchC = makeBench(q('.elc-board-ch'), {
            container: C, opts: opts,
            onRender: function (sim, B) { renderChStatus(sim, B); },
            onChange: function (B) { st.chData[st.ch] = benchC.get(); saveSoon(); }
        });
        function renderChStatus(sim, B) {
            var res = checkChallenge(st.ch, B.comps, B.wires), box = q('.elc-status-ch');
            if (res.ok) {
                if (st.chDone.indexOf(st.ch) === -1) { st.chDone.push(st.ch); renderChList(); saveSoon(); }
                box.className = 'elc-info elc-status elc-status-ch ok';
                box.innerHTML = '<b class="it">🎉 Défi réussi !</b>' + (res.after || 'Bravo, ton montage fonctionne.') + (st.ch < CHALLENGES.length - 1 ? ' Passe au défi suivant ▶' : ' Tu as terminé tous les défis : tu es un vrai électricien !');
            } else {
                var stt = statusOf(sim, B);
                box.className = 'elc-info elc-status elc-status-ch ' + (stt.cls === 'ok' ? '' : stt.cls);
                box.innerHTML = stt.html + (st.hint ? '<div style="margin-top:.35em"><b>💡 Indice :</b> ' + CHALLENGES[st.ch].hint + '</div>' : '');
            }
        }
        function renderChList() {
            qa('.elc-ch').forEach(function (el) {
                var i = +el.dataset.ch;
                el.classList.toggle('on', i === st.ch);
                el.classList.toggle('done', st.chDone.indexOf(i) !== -1);
                el.querySelector('.n').textContent = st.chDone.indexOf(i) !== -1 ? '✓' : (i + 1);
            });
            q('.elc-chprog').textContent = st.chDone.length + ' / ' + CHALLENGES.length + ' défis réussis';
            q('.elc-chnext').disabled = st.ch >= CHALLENGES.length - 1;
        }
        function loadChallenge(i, fresh) {
            st.ch = Math.max(0, Math.min(CHALLENGES.length - 1, i));
            st.hint = false;
            var d = CHALLENGES[st.ch];
            q('.elc-ch-goal').innerHTML = '<b class="it">Défi ' + (st.ch + 1) + ' : ' + d.title + '</b>' + d.text;
            if (fresh || !st.chData[st.ch]) st.chData[st.ch] = challengeCircuit(st.ch);
            renderChList();
            benchC.set(st.chData[st.ch]);
        }
        qa('.elc-ch').forEach(function (el) { el.addEventListener('click', function () { loadChallenge(+el.dataset.ch); save(); }); });
        q('.elc-chreset').addEventListener('click', function () { loadChallenge(st.ch, true); save(); });
        q('.elc-chnext').addEventListener('click', function () { loadChallenge(st.ch + 1); save(); });
        q('.elc-hint').addEventListener('click', function () { st.hint = !st.hint; benchC.render(); });

        // ═════════════ 3. CONDUCTEUR OU ISOLANT ═════════════
        var condSvg = q('.elc-scene');
        function objById(id) { for (var i = 0; i < OBJECTS.length; i++) if (OBJECTS[i].id === id) return OBJECTS[i]; return null; }
        function renderCond() {
            var o = objById(st.cond.cur), lit = !!(o && o.c);
            var lamp = { id: 'sl', type: 'lamp', x: 300, y: 70, rot: 0 };
            condSvg.querySelector('.elc-cond-lamp').innerHTML = '<g transform="translate(300,70)">' + realComp(lamp, { b: lit ? 1 : 0 }, u + 'c') + '</g>';
            condSvg.querySelector('.elc-cond-obj').innerHTML = o ? '<g transform="translate(218,236) scale(1)"><svg x="0" y="0" width="60" height="60" viewBox="0 0 60 60">' + o.svg + '</svg></g>' : '';
            condSvg.querySelector('.elc-drop-txt').style.display = o ? 'none' : '';
            if (st.showCurrent && lit) {
                // petit rappel visuel du courant dans les fils
            }
            var info = q('.elc-cond-info');
            if (!o) {
                info.className = 'elc-info elc-cond-info';
                info.innerHTML = '<b class="it">Le circuit est ouvert entre les deux pinces</b>Place un objet entre les pinces rouges : si l’ampoule s’allume, le courant traverse l’objet. On dit qu’il est <b>conducteur</b>. Sinon, c’est un <b>isolant</b>.';
            } else if (o.c) {
                info.className = 'elc-info elc-cond-info ok';
                info.innerHTML = '<b class="it">💡 L’ampoule s’allume : ' + o.name.toLowerCase() + ' ' + o.mat + ' est conducteur.</b>' +
                    (o.id === 'mine' ? 'Surprise ! La mine du crayon n’est pas en plomb mais en graphite, un matériau qui conduit le courant.' : 'Les métaux laissent très bien passer le courant : c’est pour cela que les fils électriques sont en cuivre.');
            } else {
                info.className = 'elc-info elc-cond-info ko';
                info.innerHTML = '<b class="it">⭕ L’ampoule reste éteinte : ' + o.name.toLowerCase() + ' ' + o.mat + ' est isolant.</b>' +
                    'Les isolants empêchent le courant de passer. On s’en sert pour protéger : la gaine des fils électriques est en plastique.';
            }
            qa('.elc-obj').forEach(function (el) {
                var ob = objById(el.dataset.obj), tested = st.cond.tested.indexOf(ob.id) !== -1;
                el.classList.toggle('on', st.cond.cur === ob.id);
                el.querySelector('.badge').textContent = tested ? (ob.c ? '⚡' : '🚫') : '';
            });
            var cc = '', ii = '';
            st.cond.tested.forEach(function (id) {
                var ob = objById(id); if (!ob) return;
                var tag = '<span>' + ob.name + ' <small>' + ob.mat + '</small></span>';
                if (ob.c) cc += tag; else ii += tag;
            });
            q('.elc-col-c').innerHTML = cc || '<small style="color:#9aa">—</small>';
            q('.elc-col-i').innerHTML = ii || '<small style="color:#9aa">—</small>';
        }
        function testObj(id) {
            st.cond.cur = id;
            if (st.cond.tested.indexOf(id) === -1) st.cond.tested.push(id);
            renderCond(); save();
        }
        q('.elc-objs').addEventListener('pointerdown', function (e) {
            var el = e.target.closest('[data-obj]');
            if (!el || (e.button !== undefined && e.button > 0)) return;
            e.preventDefault();
            var id = el.dataset.obj, sx = e.clientX, sy = e.clientY, moved = false, ghost = null;
            function mv(ev) {
                if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return;
                if (!moved) {
                    moved = true;
                    ghost = document.createElement('div');
                    ghost.className = 'elc-ghost';
                    ghost.innerHTML = '<svg viewBox="0 0 60 60">' + objById(id).svg + '</svg>';
                    document.body.appendChild(ghost);
                    document.body.classList.add('elc-grabbing');
                }
                ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
            }
            function up(ev) {
                document.removeEventListener('pointermove', mv);
                document.removeEventListener('pointerup', up);
                document.removeEventListener('pointercancel', up);
                document.body.classList.remove('elc-grabbing');
                if (ghost) ghost.remove();
                if (!moved) { testObj(id); return; }
                if (ev.type === 'pointercancel') return;
                var r = condSvg.getBoundingClientRect();
                if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) testObj(id);
            }
            document.addEventListener('pointermove', mv);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', up);
        });
        q('.elc-cond-reset').addEventListener('click', function () { st.cond = { tested: [], cur: null }; renderCond(); save(); });

        // ═════════════ 5. QUIZ ═════════════
        function newQuiz() {
            st.quiz = { order: shuffle(range(QUIZ.length)), perm: QUIZ.map(function (x) { return shuffle(range(x.o.length)); }), idx: 0, score: 0, choice: -1 };
        }
        function renderQuiz() {
            if (!st.quiz) newQuiz();
            var z = st.quiz, box = q('.elc-quiz'), n = z.order.length;
            if (z.idx >= n) {
                var pct = z.score / n, msg = pct === 1 ? 'Parfait ! Tu es un véritable électricien ! ⚡' : pct >= 0.7 ? 'Très bien ! Le courant passe ! 💡' : pct >= 0.4 ? 'Pas mal ! Relis la leçon et retente ta chance. 🔋' : 'Courage ! Fais quelques montages dans l’atelier puis recommence. 🔧';
                box.innerHTML = '<div class="elc-score"><div class="big">' + z.score + ' / ' + n + '</div><p class="elc-p" style="font-size:1.05em;font-weight:700">' + msg + '</p><button class="elc-btn prim elc-qagain">🔁 Recommencer le quiz</button></div>';
                box.querySelector('.elc-qagain').addEventListener('click', function () { newQuiz(); renderQuiz(); save(); });
                return;
            }
            var qi = z.order[z.idx], Q = QUIZ[qi], perm = z.perm[qi], answered = z.choice >= 0;
            var s = '<div class="elc-qhead"><span>Question ' + (z.idx + 1) + ' / ' + n + '</span><span>Score : ' + z.score + '</span></div>' +
                '<div class="elc-qbar"><i style="width:' + (z.idx / n * 100) + '%"></i></div><div class="elc-q">' + Q.q + '</div><div class="elc-opts">';
            perm.forEach(function (oi) {
                var cls = answered ? (oi === Q.a ? ' ok' : oi === z.choice ? ' ko' : ' dim') : '';
                s += '<button class="elc-opt' + cls + '" data-opt="' + oi + '"' + (answered ? ' disabled' : '') + '>' + Q.o[oi] + '</button>';
            });
            s += '</div>';
            if (answered) {
                s += '<div class="elc-info ' + (z.choice === Q.a ? 'ok' : 'ko') + '" style="margin-top:.7em"><b class="it">' + (z.choice === Q.a ? '✔ Bonne réponse !' : '✘ Ce n’est pas ça.') + '</b>' + Q.x + '</div>' +
                    '<div class="elc-qnav"><button class="elc-btn prim elc-qnext">' + (z.idx + 1 < n ? 'Question suivante ▶' : 'Voir mon score 🏆') + '</button></div>';
            }
            box.innerHTML = s;
            qa('.elc-opt').forEach(function (b) {
                b.addEventListener('click', function () {
                    if (z.choice >= 0) return;
                    z.choice = +b.dataset.opt;
                    if (z.choice === Q.a) z.score++;
                    renderQuiz(); save();
                });
            });
            var nx = box.querySelector('.elc-qnext');
            if (nx) nx.addEventListener('click', function () { z.idx++; z.choice = -1; renderQuiz(); save(); });
        }

        // ── Sauvegarde / restauration ──
        widget._elcGetData = function () {
            var full = C.classList.contains('elc-fullboard'), coll = C.classList.contains('elc-collapsed');
            st.chData[st.ch] = benchC.get();
            var chData = {}; Object.keys(st.chData).forEach(function (k) { chData[k] = st.chData[k]; });
            return {
                tab: st.tab, view: st.view, showCurrent: st.showCurrent,
                atelier: benchA.get(),
                ch: st.ch, chDone: st.chDone.slice(), chData: chData,
                cond: { tested: st.cond.tested.slice(), cur: st.cond.cur },
                quiz: st.quiz,
                w: (full || coll) ? (+C.dataset.prevW || DEF_W) : C.offsetWidth,
                h: (full || coll) ? (+C.dataset.prevH || DEF_H) : C.offsetHeight,
                refW: window.innerWidth, fullboard: full, collapsed: coll
            };
        };
        widget._elcSetData = function (d) {
            if (!d || typeof d !== 'object') return;
            if (d.view === 'real' || d.view === 'schema') st.view = d.view;
            st.showCurrent = !!d.showCurrent;
            if (Array.isArray(d.chDone)) st.chDone = d.chDone.filter(function (i) { return CHALLENGES[i]; });
            if (d.chData && typeof d.chData === 'object') st.chData = d.chData;
            if (d.cond && Array.isArray(d.cond.tested)) {
                st.cond.tested = d.cond.tested.filter(objById);
                st.cond.cur = objById(d.cond.cur) ? d.cond.cur : null;
            }
            if (d.quiz && Array.isArray(d.quiz.order) && d.quiz.order.length === QUIZ.length && Array.isArray(d.quiz.perm)) st.quiz = d.quiz;
            if (d.w && d.h) {
                var k = d.refW ? window.innerWidth / d.refW : 1;
                var w = Math.max(MIN_W, Math.round(d.w * k)), h = Math.max(MIN_H, Math.round(d.h * k));
                C.style.width = w + 'px'; C.style.height = h + 'px';
                C.dataset.prevW = w; C.dataset.prevH = h;
            }
            syncToggles();
            benchA.set(d.atelier || null);
            loadChallenge(typeof d.ch === 'number' ? d.ch : 0);
            renderCond();
            showTab(d.tab || 'atelier');
            if (d.collapsed) C.classList.add('elc-collapsed');
            if (d.fullboard) setFullboard(true);
        };

        // ── Mise en place ──
        board.appendChild(widget);
        if (typeof makeDraggable === 'function') { try { makeDraggable(widget); } catch (e) {} }
        if (typeof makeDraggableRotate === 'function') { try { makeDraggableRotate(widget); } catch (e) {} }

        function initDefault() {
            syncToggles();
            var ex0 = EXAMPLES[0];
            benchA.set({ comps: ex0.comps, wires: ex0.wires.map(function (w, i) { var c = clone(w); c.col = WIRE_COLORS[i % WIRE_COLORS.length]; return c; }), nextId: 50 });
            loadChallenge(0);
            renderCond();
            showTab('atelier');
        }
        if (!restoring) {
            var vw = window.innerWidth, vh = window.innerHeight;
            var w0 = Math.min(DEF_W, vw - 120), h0 = Math.min(DEF_H, Math.round(w0 * DEF_H / DEF_W), vh - 60);
            w0 = Math.max(Math.min(MIN_W, vw - 20), w0); h0 = Math.max(Math.min(MIN_H, vh - 20), h0);
            C.style.width = w0 + 'px'; C.style.height = h0 + 'px';
            var scrollTop = (document.scrollingElement && document.scrollingElement.scrollTop) || window.scrollY || 0;
            widget.style.left = Math.max(66, Math.round((vw - w0) / 2)) + 'px';
            widget.style.top = Math.max(10, Math.round(scrollTop + (vh - h0) / 2)) + 'px';
            initDefault();
        } else {
            C.style.width = DEF_W + 'px'; C.style.height = DEF_H + 'px';
            if (saved && !saved._restored) widget._elcSetData(saved);
            else initDefault();
        }
        updateScale();
        if (typeof bringToFront === 'function') { try { bringToFront(widget); } catch (e) {} }
        storePercents();

        if (!restoring) {
            var phone = typeof window.isPhoneScreen === 'function' && window.isPhoneScreen();
            if (phone && Date.now() - (window._wfLastLaunch || 0) < 2500) setFullboard(true);
            try { widget.focus({ preventScroll: true }); } catch (e) {}
            save();
        }
        return widget;
    }

    window.createElectriciteWidget = createElectriciteWidget;
    // Pour les tests : le moteur de calcul est accessible
    window._elcSimulate = simulate;
})();
