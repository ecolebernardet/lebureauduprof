// =========================================================================
// WIDGET JEU : BATAILLE NAVALE — se repérer sur un quadrillage
// -------------------------------------------------------------------------
// • Deux modes :
//   🎯 Chasse : l'ordinateur cache sa flotte, la classe la retrouve avec le
//      moins de tirs possible (étoiles et record).
//   ⚔️ Duel : chacun place sa flotte, puis on tire à tour de rôle contre
//      l'ordinateur (3 niveaux : Moussaillon, Capitaine, Amiral).
// • Grille 8 × 8 (4 navires) ou 10 × 10 (5 navires, règle classique).
// • Coordonnées comme en classe : la LETTRE de la colonne, puis le NOMBRE
//   de la ligne (ex. C5). On tire en touchant une case, en tapant la
//   coordonnée (« C5 » puis Entrée) ou au clavier (flèches + Entrée).
// • Indice (ligne ou colonne où se cache un navire), solution, son.
// • Progression (étoiles, records) mémorisée dans le navigateur.
// • Sauvegarde du tableau : mode, flottes, tirs, tour, taille, plein écran
//   (via _jbnGetData / createJeuBatailleNavaleWidget(data), cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-bataille-navale';
    var STORE_KEY = 'jbn-progress-v1';
    var DEF_W = 860, DEF_H = 600, MIN_W = 360, MIN_H = 400;
    var LETTERS = 'ABCDEFGHIJ';

    // Flottes : nom, longueur
    var FLEETS = {
        8:  [['Croiseur', 4], ['Contre-torpilleur', 3], ['Sous-marin', 3], ['Torpilleur', 2]],
        10: [['Porte-avions', 5], ['Croiseur', 4], ['Contre-torpilleur', 3], ['Sous-marin', 3], ['Torpilleur', 2]]
    };
    var AI_LEVELS = [
        { name: 'Moussaillon', cls: 'g1', desc: 'tire un peu au hasard' },
        { name: 'Capitaine',   cls: 'g2', desc: 'achève les navires touchés' },
        { name: 'Amiral',      cls: 'g4', desc: 'calcule où se cachent tes navires' }
    ];
    // Chasse : nombre de tirs pour 3 et 2 étoiles
    var STAR_LIMITS = { 8: [32, 42], 10: [50, 65] };   // l'ordinateur « Amiral » fait environ 30 et 45

    // ── Progression (étoiles, records, son) ─────────────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, wins: p.wins || {}, sound: p.sound !== false };
        } catch (e) { return { stars: {}, best: {}, wins: {}, sound: true }; }
    }
    function saveProgress(p) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
    }

    // ── Outils de grille ────────────────────────────────────────────────
    function coord(n, i) { return LETTERS.charAt(i % n) + (Math.floor(i / n) + 1); }
    function parseCoord(n, txt) {
        var t = String(txt || '').toUpperCase().replace(/[\s;,.()\-]/g, '');
        var m = t.match(/^([A-J])(\d{1,2})$/) || null, L, R;
        if (m) { L = m[1]; R = +m[2]; }
        else { m = t.match(/^(\d{1,2})([A-J])$/); if (m) { L = m[2]; R = +m[1]; } }
        if (!m) return -1;
        var c = LETTERS.indexOf(L);
        if (c < 0 || c >= n || R < 1 || R > n) return -1;
        return (R - 1) * n + c;
    }
    function shipCells(n, r, c, len, h) {
        var out = [];
        for (var k = 0; k < len; k++) {
            var rr = h ? r : r + k, cc = h ? c + k : c;
            if (rr < 0 || cc < 0 || rr >= n || cc >= n) return null;
            out.push(rr * n + cc);
        }
        return out;
    }
    function neighbours(n, i) {
        var r = Math.floor(i / n), c = i % n, out = [];
        if (r > 0) out.push(i - n);
        if (r < n - 1) out.push(i + n);
        if (c > 0) out.push(i - 1);
        if (c < n - 1) out.push(i + 1);
        return out;
    }

    // Placement au hasard (navires qui ne se touchent pas, si possible)
    function randomFleet(n) {
        var spec = FLEETS[n];
        for (var attempt = 0; attempt < 400; attempt++) {
            var strict = attempt < 300;
            var taken = new Int8Array(n * n), ships = [], ok = true;
            for (var s = 0; s < spec.length && ok; s++) {
                var placed = false;
                for (var t = 0; t < 200 && !placed; t++) {
                    var h = Math.random() < 0.5;
                    var r = Math.floor(Math.random() * n), c = Math.floor(Math.random() * n);
                    var cells = shipCells(n, r, c, spec[s][1], h);
                    if (!cells) continue;
                    var free = cells.every(function (x) {
                        if (taken[x]) return false;
                        if (!strict) return true;
                        var rr = Math.floor(x / n), cc = x % n;
                        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
                            var r2 = rr + dr, c2 = cc + dc;
                            if (r2 >= 0 && c2 >= 0 && r2 < n && c2 < n && taken[r2 * n + c2]) return false;
                        }
                        return true;
                    });
                    if (!free) continue;
                    cells.forEach(function (x) { taken[x] = 1; });
                    ships.push({ name: spec[s][0], len: spec[s][1], cells: cells, h: h });
                    placed = true;
                }
                if (!placed) ok = false;
            }
            if (ok) return ships;
        }
        return null;
    }
    function newSide(n, ships) { return { ships: ships, shots: new Array(n * n).fill(0) }; }   // 0 rien, 1 eau, 2 touché
    function shipAt(side, i) {
        for (var s = 0; s < side.ships.length; s++) if (side.ships[s].cells.indexOf(i) >= 0) return s;
        return -1;
    }
    function isSunk(side, s) { return side.ships[s].cells.every(function (x) { return side.shots[x] === 2; }); }
    function allSunk(side) { return side.ships.every(function (sh, s) { return isSunk(side, s); }); }
    function countShots(side) { return side.shots.filter(function (v) { return v > 0; }).length; }
    function countHits(side) { return side.shots.filter(function (v) { return v === 2; }).length; }

    // ── Intelligence de l'ordinateur ────────────────────────────────────
    // Ne « voit » que ses tirs (eau / touché) et les navires annoncés coulés.
    function aiChoose(n, side, level) {
        var shots = side.shots, N = n * n, i;
        var sunkCell = new Int8Array(N), remaining = [];
        side.ships.forEach(function (sh, s) {
            if (isSunk(side, s)) sh.cells.forEach(function (x) { sunkCell[x] = 1; });
            else remaining.push(sh.len);
        });
        var free = [];
        for (i = 0; i < N; i++) if (!shots[i]) free.push(i);
        if (!free.length) return -1;
        var openHits = [];
        for (i = 0; i < N; i++) if (shots[i] === 2 && !sunkCell[i]) openHits.push(i);
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        // Moussaillon : surtout au hasard, achève parfois un navire touché
        if (level === 0) {
            if (openHits.length && Math.random() < 0.5) {
                var around = [];
                openHits.forEach(function (h) { neighbours(n, h).forEach(function (x) { if (!shots[x]) around.push(x); }); });
                if (around.length) return pick(around);
            }
            return pick(free);
        }

        // Capitaine : chasse en damier, puis vise autour des touchés (dans l'alignement)
        if (level === 1) {
            if (openHits.length) {
                var aligned = [];
                openHits.forEach(function (h) {
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
                        var r = Math.floor(h / n), c = h % n;
                        var r1 = r + d[0], c1 = c + d[1], r0 = r - d[0], c0 = c - d[1];
                        var behindHit = r0 >= 0 && c0 >= 0 && r0 < n && c0 < n && shots[r0 * n + c0] === 2 && !sunkCell[r0 * n + c0];
                        if (behindHit && r1 >= 0 && c1 >= 0 && r1 < n && c1 < n && !shots[r1 * n + c1]) aligned.push(r1 * n + c1);
                    });
                });
                if (aligned.length) return pick(aligned);
                var adj = [];
                openHits.forEach(function (h) { neighbours(n, h).forEach(function (x) { if (!shots[x]) adj.push(x); }); });
                if (adj.length) return pick(adj);
            }
            var parity = free.filter(function (x) { return (Math.floor(x / n) + x % n) % 2 === 0; });
            return pick(parity.length ? parity : free);
        }

        // Amiral : carte de probabilités des navires restants
        var score = new Float64Array(N);
        remaining.forEach(function (len) {
            for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) for (var h = 0; h < 2; h++) {
                var cells = shipCells(n, r, c, len, h === 0);
                if (!cells) continue;
                var hits = 0, bad = false;
                for (var k = 0; k < cells.length; k++) {
                    var x = cells[k];
                    if (shots[x] === 1 || sunkCell[x]) { bad = true; break; }
                    if (shots[x] === 2) hits++;
                }
                if (bad) continue;
                var w = openHits.length ? (hits ? Math.pow(30, hits) : 1) : 1;
                cells.forEach(function (x) { if (!shots[x]) score[x] += w; });
            }
        });
        var best = -1, bestCells = [];
        free.forEach(function (x) {
            if (score[x] > best) { best = score[x]; bestCells = [x]; }
            else if (score[x] === best) bestCells.push(x);
        });
        return pick(bestCells.length ? bestCells : free);
    }

    // ── Sons (WebAudio, très discrets) ──────────────────────────────────
    var _actx = null;
    function beep(freq, dur, type, vol, delay, slideTo) {
        try {
            _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
            var t = _actx.currentTime + (delay || 0);
            var o = _actx.createOscillator(), gn = _actx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
            gn.gain.setValueAtTime(0.0001, t);
            gn.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(gn); gn.connect(_actx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        } catch (e) {}
    }
    function noise(dur, vol, freq) {
        try {
            _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
            var len = Math.floor(_actx.sampleRate * dur), buf = _actx.createBuffer(1, len, _actx.sampleRate), d = buf.getChannelData(0);
            for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
            var src = _actx.createBufferSource(), f = _actx.createBiquadFilter(), g = _actx.createGain();
            src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq || 900; g.gain.value = vol || 0.12;
            src.connect(f); f.connect(g); g.connect(_actx.destination); src.start();
        } catch (e) {}
    }
    function sndSplash() { noise(0.35, 0.09, 1800); }
    function sndHit() { noise(0.45, 0.2, 500); beep(180, 0.25, 'sawtooth', 0.04, 0, 70); }
    function sndSunk() { noise(0.8, 0.22, 380); [392, 330, 262].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.06, 0.25 + j * 0.13); }); }

    // ── CSS (injecté une seule fois) ────────────────────────────────────
    function injectCSS() {
        if (document.getElementById('jbn-style')) return;
        var s = document.createElement('style');
        s.id = 'jbn-style';
        s.textContent = [
'.jbn-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 30%,#1f7fb8 0%,#135f92 45%,#0b3d63 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jbn-root *{box-sizing:border-box}',
'.jbn-root{cursor:move}.jbn-root .jbn-ov,.jbn-root .jbn-board{cursor:default}',
'.jbn-root.jbn-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jbn-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête
'.jbn-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;',
'  background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,0));}',
'.jbn-title{font-weight:900;font-size:calc(22px*var(--ui));letter-spacing:.5px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jbn-title b{color:#ffd23f}.jbn-title i{font-style:normal;color:#7fe3ff}',
'.jbn-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}',
'.jbn-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jbn-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px}',
'.jbn-pill.g1{background:#22c55e;color:#06321a}.jbn-pill.g2{background:#38bdf8;color:#062a3a}',
'.jbn-pill.g3{background:#fb923c;color:#3b1702}.jbn-pill.g4{background:#f43f5e;color:#fff}.jbn-pill.gc{background:#ffd23f;color:#3a2a00}',
'.jbn-spacer{flex:1}',
'.jbn-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0}',
'.jbn-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jbn-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jbn-root.jbn-tall .jbn-body{flex-direction:column}',
'.jbn-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;gap:var(--gap,14px);position:relative}',
'.jbn-root.jbn-stack .jbn-stage{flex-direction:column}',
'.jbn-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(240px*var(--ui))}',
'.jbn-root.jbn-tall .jbn-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center}',
'.jbn-stats{display:flex;gap:6px}',
'.jbn-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 4px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.jbn-stat small{display:block;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;opacity:.8;text-transform:uppercase}',
'.jbn-stat span{display:block;font-size:calc(24px*var(--ui));font-weight:900;line-height:1.1}',
'.jbn-stat.jbn-st-shots span{color:#ffd23f}',
'.jbn-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jbn-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jbn-stars .off{color:rgba(255,255,255,.25)}',
'.jbn-aim{display:flex;gap:6px;align-items:center}',
'.jbn-aim input{flex:1;min-width:0;width:calc(70px*var(--ui));border:none;border-radius:12px;padding:calc(6px*var(--ui)) 10px;font:900 calc(18px*var(--ui)) "Nunito",sans-serif;',
'  text-align:center;text-transform:uppercase;color:#0b3d63;background:#eaf7ff;box-shadow:inset 0 2px 4px rgba(0,0,0,.15);outline:none;cursor:text}',
'.jbn-aim input:focus{box-shadow:inset 0 2px 4px rgba(0,0,0,.15),0 0 0 3px #ffd23f}',
'.jbn-target{font-size:calc(13px*var(--ui));text-align:center;font-weight:800;opacity:.9}',
'.jbn-target b{font-size:1.5em;color:#ffd23f;letter-spacing:1px}',
'.jbn-fleet{display:flex;flex-direction:column;gap:3px;background:rgba(0,0,0,.2);border-radius:12px;padding:6px 8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
'.jbn-fleet h5{margin:0 0 2px;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;text-transform:uppercase;opacity:.8}',
'.jbn-fl{display:flex;align-items:center;gap:6px;font-size:calc(12px*var(--ui));font-weight:800;white-space:nowrap}',
'.jbn-fl i{display:inline-flex;gap:2px}',
'.jbn-fl i u{display:inline-block;width:calc(9px*var(--ui));height:calc(9px*var(--ui));border-radius:2px;background:#cfe6f5}',
'.jbn-fl i u.x{background:#ff5a3c}',
'.jbn-fl.sunk{opacity:.55;text-decoration:line-through}',
'.jbn-fl.sunk i u{background:#ff5a3c}',
'.jbn-fleets{display:flex;flex-direction:column;gap:6px}',
'.jbn-m-duel .jbn-fleet{padding:4px 8px;gap:1px}',
'.jbn-m-duel .jbn-fl{font-size:calc(11px*var(--ui))}',
'.jbn-root.jbn-tall .jbn-fleets{flex-direction:row}',
'.jbn-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jbn-root.jbn-tall .jbn-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jbn-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));',
'  color:#0b3d63;background:#eaf7ff;box-shadow:0 3px 0 #9cc8e2;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jbn-btn:hover{filter:brightness(1.05)}.jbn-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #9cc8e2}',
'.jbn-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jbn-btn.jbn-hint{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jbn-btn.jbn-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jbn-btn.jbn-wide{grid-column:1 / -1}',
'.jbn-goal{font-size:calc(12px*var(--ui));opacity:.92;text-align:center;line-height:1.3}',
'.jbn-goal b{color:#ffd23f}',
'.jbn-msg{min-height:1.3em;font-size:calc(13px*var(--ui));text-align:center;font-weight:800;color:#ffe48a}',
'.jbn-turn{text-align:center;font-weight:900;font-size:calc(14px*var(--ui));border-radius:999px;padding:4px 10px;background:rgba(0,0,0,.25)}',
'.jbn-turn.me{background:#22c55e;color:#06321a}.jbn-turn.cpu{background:#f43f5e}',
'.jbn-ph-place .jbn-only-play,.jbn-ph-play .jbn-only-place,.jbn-ph-over .jbn-only-place{display:none!important}',
'.jbn-m-chasse .jbn-only-duel,.jbn-m-duel .jbn-only-chasse{display:none!important}',
// Plateaux
'.jbn-board{position:relative;flex-shrink:0;border-radius:calc(var(--cell)*0.22);',
'  background:linear-gradient(145deg,#24506e,#102c42);box-shadow:0 calc(var(--cell)*0.12) calc(var(--cell)*0.35) rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.08)}',
'.jbn-board.jbn-small{opacity:.97}',
'.jbn-lbl{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:900;color:#cfeaff;font-size:calc(var(--cell)*0.42);line-height:1;',
'  transition:color .12s,background .12s;border-radius:calc(var(--cell)*0.12)}',
'.jbn-lbl.on{color:#3a2a00;background:#ffd23f}',
'.jbn-corner{position:absolute;display:flex;align-items:center;justify-content:center;font-size:calc(var(--cell)*0.5)}',
'.jbn-sea{position:absolute;border-radius:calc(var(--cell)*0.1);overflow:hidden;',
'  background:repeating-linear-gradient(170deg,rgba(255,255,255,.05) 0 6px,transparent 6px 18px),linear-gradient(160deg,#2aa7e0,#1478b8);',
'  box-shadow:inset 0 0 calc(var(--cell)*0.4) rgba(0,30,60,.45)}',
'.jbn-cells{position:absolute;inset:0;display:grid;z-index:1}',
'.jbn-own .jbn-cells{pointer-events:none}',
'.jbn-c{position:relative;border-right:1px solid rgba(255,255,255,.22);border-bottom:1px solid rgba(255,255,255,.22)}',
'.jbn-board.jbn-target .jbn-c.free{cursor:crosshair}',
'.jbn-board.jbn-target .jbn-c.free:hover,.jbn-c.cur{background:rgba(255,210,63,.32)}',
'.jbn-c.rowhl,.jbn-c.colhl{background:rgba(255,255,255,.08)}',
'.jbn-c.cur{box-shadow:inset 0 0 0 3px #ffd23f;z-index:2}',
'.jbn-c.hintl{background:rgba(255,210,63,.22)}',
// Tirs
'.jbn-c.miss::after{content:"";position:absolute;left:50%;top:50%;width:30%;height:30%;transform:translate(-50%,-50%);border-radius:50%;',
'  background:#fff;box-shadow:0 0 0 calc(var(--cell)*0.08) rgba(255,255,255,.35)}',
'.jbn-c.hit::after{content:"";position:absolute;left:50%;top:50%;width:62%;height:62%;transform:translate(-50%,-50%);border-radius:50%;z-index:3;',
'  background:radial-gradient(circle,#fff6b0 0 18%,#ffb020 35%,#ff4b2b 62%,rgba(160,20,0,.0) 72%);filter:drop-shadow(0 0 4px rgba(255,80,40,.8))}',
'.jbn-c.boom::before{content:"";position:absolute;left:50%;top:50%;width:100%;height:100%;transform:translate(-50%,-50%) scale(.2);border-radius:50%;',
'  border:3px solid #fff;opacity:.9;animation:jbnRing .6s ease-out forwards;z-index:4;pointer-events:none}',
'.jbn-c.hit.boom::before{border-color:#ffb020}',
'@keyframes jbnRing{to{transform:translate(-50%,-50%) scale(1.8);opacity:0}}',
// Navires
'.jbn-ships{position:absolute;inset:0;pointer-events:none}',
'.jbn-ship{position:absolute;pointer-events:none;border-radius:calc(var(--cell)*0.45);',
'  background:linear-gradient(180deg,#b9c8d4,#7d93a5 55%,#5b6f80);box-shadow:0 calc(var(--cell)*0.05) 0 #3b4a57,0 calc(var(--cell)*0.08) calc(var(--cell)*0.15) rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.4);',
'  display:flex;align-items:center;justify-content:space-evenly}',
'.jbn-ship.v{flex-direction:column;background:linear-gradient(90deg,#b9c8d4,#7d93a5 55%,#5b6f80)}',
'.jbn-ship.h{border-top-right-radius:calc(var(--cell)*0.5) 50%;border-bottom-right-radius:calc(var(--cell)*0.5) 50%}',
'.jbn-ship.v{border-bottom-left-radius:50% calc(var(--cell)*0.5);border-bottom-right-radius:50% calc(var(--cell)*0.5)}',
'.jbn-ship u{display:block;width:calc(var(--cell)*0.26);height:calc(var(--cell)*0.26);border-radius:50%;background:#46596a;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}',
'.jbn-ship.sunk{filter:grayscale(.4) brightness(.7);outline:2px solid #ff5a3c;outline-offset:-2px}',
'.jbn-ship.ghost{opacity:.55}',
'.jbn-board.jbn-placing .jbn-ship{pointer-events:auto;cursor:grab;touch-action:none}',
'.jbn-board.jbn-placing .jbn-ship.sel{outline:3px solid #ffd23f;outline-offset:2px}',
'.jbn-ship.drag{cursor:grabbing;z-index:5;transition:none}',
'.jbn-ship.bad{outline:3px solid #ff3b3b!important;animation:jbnShake .3s}',
'@keyframes jbnShake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
'.jbn-cap{position:absolute;left:0;right:0;text-align:center;font-weight:900;letter-spacing:.5px;font-size:calc(var(--cell)*0.34);color:#cfeaff;white-space:nowrap}',
// Fenêtres superposées
'.jbn-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(5,30,50,.8);backdrop-filter:blur(3px);padding:14px}',
'.jbn-ov.show{display:flex}',
'.jbn-card{background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jbn-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#0b3d63}',
'.jbn-opt{margin:10px 0 4px;text-align:left;font-weight:900;color:#345;font-size:calc(13px*var(--ui))}',
'.jbn-choices{display:flex;gap:8px;flex-wrap:wrap}',
'.jbn-ch{flex:1;min-width:calc(120px*var(--ui));border:2px solid #d4e6f2;cursor:pointer;border-radius:14px;padding:8px 10px;background:#f3f9fd;color:#0b3d63;text-align:left;font-family:inherit}',
'.jbn-ch b{display:block;font-size:calc(15px*var(--ui));font-weight:900}',
'.jbn-ch small{display:block;font-size:calc(11px*var(--ui));color:#567;font-weight:700}',
'.jbn-ch.on{border-color:#1478b8;background:#e1f1fb;box-shadow:0 0 0 2px #1478b8 inset}',
'.jbn-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jbn-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jbnPop .5s backwards}',
'.jbn-win-stars .off{color:#d7e3df}',
'@keyframes jbnPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jbn-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 12px;color:#345}',
'.jbn-win-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
'.jbn-card .jbn-btn{box-shadow:0 3px 0 #b7cfe0;background:#eaf3f9}',
'.jbn-card .jbn-btn.jbn-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jbn-x{position:absolute;top:10px;right:10px}',
'.jbn-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jbnFall linear forwards;z-index:21}',
'@keyframes jbnFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jbn-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jbn-grip:hover{opacity:1}',
// Format étroit
'.jbn-root.jbn-narrow .jbn-head{gap:6px;padding:8px 8px 6px 10px}',
'.jbn-root.jbn-narrow .jbn-title .jbn-tt{display:none}',
'.jbn-root.jbn-narrow .jbn-lvlword{display:none}',
'.jbn-root.jbn-narrow .jbn-icon{width:24px;height:24px;font-size:12px}',
'.jbn-root.jbn-narrow .jbn-help{display:none}',
'.jbn-root.jbn-tall .jbn-goal{display:none}',
'.jbn-root.jbn-fullboard .jbn-grip,.widget.phone-fs .jbn-grip{display:none}',
'@media (prefers-reduced-motion: reduce){.jbn-c.boom::before{animation:none;opacity:0}}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 600px), (max-height: 500px) and (pointer: coarse){',
'  .jbn-root.jbn-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
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

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initBatailleNavale(widget, data) {
        if (!widget || widget._jbnInit) return;
        widget._jbnInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            mode: 'chasse', n: 10, ai: 1,
            phase: 'play',             // 'place' (duel : placer sa flotte), 'play', 'over'
            enemy: null,               // flotte de l'ordinateur (celle sur laquelle on tire)
            mine: null,                // ma flotte (duel)
            turn: 'me', busy: false,
            hints: 0, hintLine: null, solutionSeen: false, won: null,
            cur: -1, selShip: -1, lastMsg: '',
            w: DEF_W, h: DEF_H, fullboard: false, cell: 40
        };
        var cpuTimer = null;

        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jbn-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jbn-head">' +
                '<div class="jbn-title">⚓<span class="jbn-tt"> <b>Bataille</b> <i>navale</i></span></div>' +
                '<button class="jbn-lvlbtn" title="Nouvelle partie : mode, grille, niveau"><span class="jbn-pill"></span><span class="jbn-lvltxt"></span> ▾</button>' +
                '<div class="jbn-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jbn-icon jbn-sound" title="Son"></button>' +
                    '<button class="jbn-icon jbn-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jbn-body">' +
                '<div class="jbn-stage"></div>' +
                '<div class="jbn-side">' +
                    '<div class="jbn-turn jbn-only-duel jbn-only-play"></div>' +
                    '<div class="jbn-stats jbn-only-play">' +
                        '<div class="jbn-stat jbn-st-shots"><small>Tirs</small><span class="jbn-v-shots">0</span></div>' +
                        '<div class="jbn-stat"><small>Touchés</small><span class="jbn-v-hits">0</span></div>' +
                        '<div class="jbn-stat jbn-only-chasse"><small>Record</small><span class="jbn-v-best">–</span></div>' +
                        '<div class="jbn-stat jbn-only-duel"><small>Victoires</small><span class="jbn-v-wins">0</span></div>' +
                    '</div>' +
                    '<div class="jbn-stars jbn-only-chasse"></div>' +
                    '<div class="jbn-aim jbn-only-play"><input class="jbn-in" maxlength="4" placeholder="C5" aria-label="Coordonnée du tir (lettre puis nombre)" autocomplete="off" spellcheck="false"><button class="jbn-btn jbn-go jbn-fire" title="Tirer sur cette case">🎯 Feu !</button></div>' +
                    '<div class="jbn-target jbn-only-play">Case visée : <b class="jbn-v-aim">–</b></div>' +
                    '<div class="jbn-fleets jbn-only-play"></div>' +
                    '<div class="jbn-btns">' +
                        '<button class="jbn-btn jbn-shuffle jbn-only-duel jbn-only-place" title="Placer ma flotte au hasard">🔀 Au hasard</button>' +
                        '<button class="jbn-btn jbn-rotate jbn-only-duel jbn-only-place" title="Tourner le navire choisi (touche R)">⟳ Tourner</button>' +
                        '<button class="jbn-btn jbn-go jbn-start jbn-wide jbn-only-duel jbn-only-place" title="Lancer la bataille">▶ Commencer la bataille</button>' +
                        '<button class="jbn-btn jbn-hint jbn-only-chasse jbn-only-play" title="Indiquer une ligne ou une colonne où se cache un navire">💡 Indice</button>' +
                        '<button class="jbn-btn jbn-sol jbn-only-chasse jbn-only-play" title="Montrer la flotte cachée">🎬 Solution</button>' +
                        '<button class="jbn-btn jbn-again" title="Rejouer avec les mêmes réglages">↺ Nouvelle partie</button>' +
                        '<button class="jbn-btn jbn-opts" title="Changer de mode, de grille ou de niveau">☰ Réglages</button>' +
                    '</div>' +
                    '<div class="jbn-goal"></div>' +
                    '<div class="jbn-msg" aria-live="polite"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jbn-ov jbn-ov-opts"><div class="jbn-card" style="position:relative;max-width:520px;"><button class="jbn-icon jbn-x" style="background:#0b3d63;">✕</button><h3>Nouvelle partie</h3>' +
                '<div class="jbn-opt">Mode de jeu</div><div class="jbn-choices" data-opt="mode">' +
                    '<button class="jbn-ch" data-v="chasse"><b>🎯 Chasse</b><small>La flotte est cachée : trouve-la avec le moins de tirs possible. Idéal en classe entière.</small></button>' +
                    '<button class="jbn-ch" data-v="duel"><b>⚔️ Duel</b><small>Place ta flotte, puis tirez chacun votre tour contre l\'ordinateur.</small></button>' +
                '</div>' +
                '<div class="jbn-opt">Taille de la grille</div><div class="jbn-choices" data-opt="n">' +
                    '<button class="jbn-ch" data-v="8"><b>8 × 8</b><small>A à H, 1 à 8 · 4 navires</small></button>' +
                    '<button class="jbn-ch" data-v="10"><b>10 × 10</b><small>A à J, 1 à 10 · 5 navires</small></button>' +
                '</div>' +
                '<div class="jbn-opt jbn-opt-ai">Niveau de l\'ordinateur (duel)</div><div class="jbn-choices jbn-opt-ai" data-opt="ai">' +
                    AI_LEVELS.map(function (a, k) { return '<button class="jbn-ch" data-v="' + k + '"><b>' + a.name + '</b><small>' + a.desc + '</small></button>'; }).join('') +
                '</div>' +
                '<div class="jbn-win-btns" style="margin-top:14px;"><button class="jbn-btn jbn-go jbn-o-start">⚓ C\'est parti !</button></div>' +
            '</div></div>' +
            '<div class="jbn-ov jbn-ov-win"><div class="jbn-card"><h3 class="jbn-win-title">Bravo !</h3><div class="jbn-win-stars"></div><div class="jbn-win-txt"></div>' +
                '<div class="jbn-win-btns"><button class="jbn-btn jbn-w-see">👁 Voir la grille</button><button class="jbn-btn jbn-w-opts">☰ Réglages</button><button class="jbn-btn jbn-go jbn-w-again">↺ Rejouer</button></div></div></div>' +
            '<div class="jbn-ov jbn-ov-help"><div class="jbn-card" style="max-width:460px;position:relative;text-align:left;"><button class="jbn-icon jbn-x" style="background:#0b3d63;">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">📍 <b>Repérage :</b> une case se nomme par la <b>lettre de sa colonne</b>, puis le <b>nombre de sa ligne</b> : <b>C5</b> = colonne C, ligne 5.</p>' +
                '<p style="margin:6px 0;">🎯 <b>Tirer :</b> touche une case de la mer, ou tape sa coordonnée (« C5 ») puis <b>Entrée</b>. Au clavier : flèches puis Entrée.</p>' +
                '<p style="margin:6px 0;">💦 <b>À l\'eau</b> : rien ici. 💥 <b>Touché</b> : un navire est là, cherche autour (à droite, à gauche, en haut, en bas). 🔥 <b>Coulé</b> : toutes ses cases sont touchées.</p>' +
                '<p style="margin:6px 0;">🎯 <b>Chasse :</b> coule toute la flotte cachée avec le moins de tirs possible (3 étoiles si tu es très précis, 2 au maximum avec un indice).</p>' +
                '<p style="margin:6px 0;">⚔️ <b>Duel :</b> place ta flotte (fais glisser un navire, touche-le pour le tourner, ou 🔀 Au hasard), puis tirez chacun votre tour. Le premier qui coule toute la flotte de l\'autre gagne.</p>' +
                '<p style="margin:6px 0;">🚢 Les navires sont droits (horizontaux ou verticaux), jamais en diagonale.</p></div></div>' +
            '<div class="jbn-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var stage = $('.jbn-stage'), input = $('.jbn-in');
        var boards = { target: null, own: null };

        // ── Déplacement du widget : comme le Rush Hour, on peut l'attraper
        //    n'importe où, sauf sur les grilles, les boutons, les champs et les fenêtres.
        var NO_DRAG = '.jbn-board, .jbn-ov, .jbn-grip, button, input, select, textarea, label, a';
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
        root.querySelectorAll('.jbn-head button').forEach(function (b) {
            ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
                b.addEventListener(t, function (e) { e.stopPropagation(); }, t === 'touchstart' ? { passive: true } : false);
            });
        });

        // ── Construction d'une grille ────────────────────────────────────
        function makeBoard(kind) {
            var n = S.n;
            var b = el('div', 'jbn-board ' + (kind === 'target' ? 'jbn-target' : 'jbn-own'));
            var corner = el('div', 'jbn-corner', kind === 'target' ? '🎯' : '⚓');
            b.appendChild(corner);
            var colL = [], rowL = [];
            for (var k = 0; k < n; k++) {
                var cl = el('div', 'jbn-lbl', LETTERS.charAt(k)); b.appendChild(cl); colL.push(cl);
                var rl = el('div', 'jbn-lbl', String(k + 1)); b.appendChild(rl); rowL.push(rl);
            }
            var sea = el('div', 'jbn-sea');
            var grid = el('div', 'jbn-cells');
            grid.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
            grid.style.gridTemplateRows = 'repeat(' + n + ',1fr)';
            var cells = [];
            for (var i = 0; i < n * n; i++) {
                var c = el('div', 'jbn-c');
                c.dataset.i = i;
                grid.appendChild(c); cells.push(c);
            }
            // Les navires passent SOUS le quadrillage : les tirs restent visibles par-dessus
            var shipsL = el('div', 'jbn-ships');
            sea.appendChild(shipsL);
            sea.appendChild(grid);
            b.appendChild(sea);
            var cap = el('div', 'jbn-cap', kind === 'target' ? (S.mode === 'duel' ? 'Mer ennemie' : '') : 'Ta flotte');
            b.appendChild(cap);
            var B = { el: b, kind: kind, corner: corner, colL: colL, rowL: rowL, sea: sea, cells: cells, shipsL: shipsL, cap: cap, cell: 40 };
            if (kind === 'target') {
                grid.addEventListener('click', function (e) {
                    var c = e.target.closest('.jbn-c');
                    if (c) fire(+c.dataset.i);
                });
                grid.addEventListener('pointermove', function (e) {
                    var c = e.target.closest('.jbn-c');
                    highlight(B, c ? +c.dataset.i : -1);
                });
                grid.addEventListener('pointerleave', function () { highlight(B, S.cur); });
            }
            return B;
        }
        function sizeBoard(B, cell) {
            var n = S.n, lab = Math.round(cell * 0.75), pad = Math.round(cell * 0.18);
            var capH = B.cap.textContent ? Math.round(cell * 0.55) : 0;
            B.cell = cell;
            var size = n * cell;
            B.el.style.setProperty('--cell', cell + 'px');
            B.el.style.width = (pad * 2 + lab + size) + 'px';
            B.el.style.height = (pad * 2 + lab + size + capH) + 'px';
            var top = pad + capH;
            B.cap.style.top = Math.round(pad * 0.6) + 'px';
            B.corner.style.left = pad + 'px'; B.corner.style.top = top + 'px';
            B.corner.style.width = lab + 'px'; B.corner.style.height = lab + 'px';
            for (var k = 0; k < n; k++) {
                var cl = B.colL[k], rl = B.rowL[k];
                cl.style.left = (pad + lab + k * cell) + 'px'; cl.style.top = top + 'px';
                cl.style.width = cell + 'px'; cl.style.height = lab + 'px';
                rl.style.left = pad + 'px'; rl.style.top = (top + lab + k * cell) + 'px';
                rl.style.width = lab + 'px'; rl.style.height = cell + 'px';
            }
            B.sea.style.left = (pad + lab) + 'px'; B.sea.style.top = (top + lab) + 'px';
            B.sea.style.width = size + 'px'; B.sea.style.height = size + 'px';
            return { w: pad * 2 + lab + size, h: pad * 2 + lab + size + capH };
        }
        function boardUnits(B) { return S.n + 0.75 + 0.36 + (B.cap.textContent ? 0.55 : 0); }

        // ── Mise en page ─────────────────────────────────────────────────
        function applySize() {
            if (S.fullboard || widget.classList.contains('phone-fs')) {
                root.style.width = ''; root.style.height = '';
            } else {
                root.style.width = S.w + 'px'; root.style.height = S.h + 'px';
            }
        }
        function layout() {
            var W = root.clientWidth, H = root.clientHeight;
            if (!W || !H || !boards.target && !boards.own) return;
            var ui = Math.max(0.75, Math.min(1.6, Math.min(W / DEF_W, H / DEF_H) * 1.05));
            root.style.setProperty('--ui', ui.toFixed(3));
            var tall = W < H * 1.15;
            root.classList.toggle('jbn-narrow', W < 600);
            root.classList.toggle('jbn-tall', tall);
            var sw = stage.clientWidth, sh = stage.clientHeight, cell;
            var two = S.mode === 'duel' && S.phase !== 'place';
            if (!two) {
                var B = boards.target || boards.own, u = boardUnits(B);
                cell = Math.floor(Math.min(sw / u, sh / u));
                sizeBoard(B, Math.max(16, cell));
                root.classList.remove('jbn-stack');
            } else {
                var uT = boardUnits(boards.target), uO = boardUnits(boards.own), k = 0.55;
                var sideBySide = Math.min(sw / (uT + uO * k + 0.5), sh / uT);
                var stacked = Math.min(sw / uT, sh / (uT + uO * k + 0.5));
                var stack = stacked > sideBySide;
                root.classList.toggle('jbn-stack', stack);
                cell = Math.floor(Math.max(sideBySide, stacked));
                cell = Math.max(16, cell);
                stage.style.setProperty('--gap', Math.round(cell * 0.4) + 'px');
                sizeBoard(boards.target, cell);
                sizeBoard(boards.own, Math.max(10, Math.floor(cell * k)));
            }
            S.cell = cell;
            renderShips();
        }

        // ── Rendu ────────────────────────────────────────────────────────
        function highlight(B, i) {
            var n = S.n, r = i >= 0 ? Math.floor(i / n) : -1, c = i >= 0 ? i % n : -1;
            B.colL.forEach(function (l, k) { l.classList.toggle('on', k === c); });
            B.rowL.forEach(function (l, k) { l.classList.toggle('on', k === r); });
            $('.jbn-v-aim').textContent = i >= 0 ? coord(n, i) : (S.cur >= 0 ? coord(n, S.cur) : '–');
        }
        function renderCells(B, side) {
            if (!B || !side) return;
            var n = S.n, hl = S.hintLine;
            B.cells.forEach(function (c, i) {
                var v = side.shots[i];
                c.className = 'jbn-c' + (v === 1 ? ' miss' : v === 2 ? ' hit' : '') +
                    (B.kind === 'target' && !v && S.phase === 'play' ? ' free' : '') +
                    (B.kind === 'target' && i === S.cur && S.phase === 'play' ? ' cur' : '') +
                    (B.kind === 'target' && hl && !v && ((hl.t === 'r' && Math.floor(i / n) === hl.k) || (hl.t === 'c' && i % n === hl.k)) ? ' hintl' : '');
                c.title = coord(n, i);
            });
        }
        function shipEl(sh, cls) {
            var e = el('div', 'jbn-ship ' + (sh.h ? 'h' : 'v') + (cls ? ' ' + cls : ''));
            var turrets = '';
            for (var k = 0; k < Math.max(1, sh.len - 1); k++) turrets += '<u></u>';
            e.innerHTML = turrets;
            e.title = sh.name + ' (' + sh.len + ' cases)';
            return e;
        }
        function placeShipEl(B, e, sh) {
            var n = S.n, c = B.cell, g = Math.round(c * 0.1);
            var i0 = Math.min.apply(null, sh.cells), r = Math.floor(i0 / n), col = i0 % n;
            e.style.left = (col * c + g) + 'px'; e.style.top = (r * c + g) + 'px';
            e.style.width = ((sh.h ? sh.len : 1) * c - 2 * g) + 'px';
            e.style.height = ((sh.h ? 1 : sh.len) * c - 2 * g) + 'px';
        }
        function renderShips() {
            // Mer ennemie : navires coulés (ou toute la flotte quand la partie est finie)
            if (boards.target && S.enemy) {
                var T = boards.target;
                T.shipsL.innerHTML = '';
                S.enemy.ships.forEach(function (sh, s) {
                    var sunk = isSunk(S.enemy, s);
                    if (!sunk && S.phase !== 'over') return;
                    var e = shipEl(sh, sunk ? 'sunk' : 'ghost');
                    T.shipsL.appendChild(e); placeShipEl(T, e, sh);
                });
            }
            // Ma flotte
            if (boards.own && S.mine) {
                var O = boards.own;
                O.shipsL.innerHTML = '';
                O.el.classList.toggle('jbn-placing', S.phase === 'place');
                S.mine.ships.forEach(function (sh, s) {
                    var e = shipEl(sh, (isSunk(S.mine, s) && S.phase !== 'place' ? 'sunk' : '') + (S.phase === 'place' && s === S.selShip ? ' sel' : ''));
                    e.dataset.s = s;
                    if (S.phase === 'place') e.addEventListener('pointerdown', function (ev) { onShipDown(ev, s); });
                    O.shipsL.appendChild(e); placeShipEl(O, e, sh);
                });
            }
        }
        function fleetList(side, title, reveal) {
            var h = '<div class="jbn-fleet"><h5>' + title + '</h5>';
            side.ships.forEach(function (sh, s) {
                var sunk = isSunk(side, s), boxes = '';
                for (var k = 0; k < sh.len; k++) boxes += '<u class="' + (reveal && side.shots[sh.cells[k]] === 2 ? 'x' : '') + '"></u>';
                h += '<div class="jbn-fl' + (sunk ? ' sunk' : '') + '"><i>' + boxes + '</i>' + sh.name + '</div>';
            });
            return h + '</div>';
        }
        function starHTML(k) {
            var h = '';
            for (var i = 0; i < 3; i++) h += '<span class="' + (i < k ? 'on' : 'off') + '">★</span>';
            return h;
        }
        function keyCfg() { return S.mode + '-' + S.n + (S.mode === 'duel' ? '-' + S.ai : ''); }

        function updateUI() {
            root.classList.toggle('jbn-m-chasse', S.mode === 'chasse');
            root.classList.toggle('jbn-m-duel', S.mode === 'duel');
            ['place', 'play', 'over'].forEach(function (p) { root.classList.toggle('jbn-ph-' + p, S.phase === p); });
            // Pastille de l'en-tête
            var pill = $('.jbn-pill');
            if (S.mode === 'chasse') { pill.className = 'jbn-pill gc'; pill.textContent = 'Chasse'; }
            else { var a = AI_LEVELS[S.ai]; pill.className = 'jbn-pill ' + a.cls; pill.textContent = a.name; }
            $('.jbn-lvltxt').innerHTML = '<span class="jbn-lvlword">' + (S.mode === 'chasse' ? '🎯 ' : '⚔️ Duel · ') + '</span>' + S.n + ' × ' + S.n;
            // Statistiques
            var shots = S.enemy ? countShots(S.enemy) : 0, hits = S.enemy ? countHits(S.enemy) : 0;
            $('.jbn-v-shots').textContent = shots;
            $('.jbn-v-hits').textContent = hits;
            var best = prog.best[keyCfg()];
            $('.jbn-v-best').textContent = best ? best : '–';
            $('.jbn-v-wins').textContent = prog.wins[keyCfg()] || 0;
            $('.jbn-stars').innerHTML = starHTML(prog.stars[keyCfg()] || 0);
            // Tour
            var turn = $('.jbn-turn');
            if (S.phase === 'play' && S.mode === 'duel') {
                turn.className = 'jbn-turn jbn-only-duel jbn-only-play ' + (S.turn === 'me' ? 'me' : 'cpu');
                turn.textContent = S.turn === 'me' ? '🎯 À toi de tirer !' : '🤖 L\'ordinateur vise…';
            }
            // Flottes
            var fl = '';
            if (S.enemy) fl += fleetList(S.enemy, S.mode === 'duel' ? 'Flotte ennemie' : 'Flotte cachée', false);
            if (S.mode === 'duel' && S.mine && S.phase !== 'place') fl += fleetList(S.mine, 'Ta flotte', true);
            $('.jbn-fleets').innerHTML = fl;
            // Consigne
            $('.jbn-goal').innerHTML = S.phase === 'place'
                ? 'Place ta flotte : <b>fais glisser</b> un navire, <b>touche-le</b> pour le tourner. Les navires ne doivent pas se chevaucher.'
                : 'Une case = <b>lettre de la colonne</b> + <b>nombre de la ligne</b> (ex. <b>C5</b>).';
            // Boutons
            var locked = S.busy || S.phase !== 'play' || (S.mode === 'duel' && S.turn !== 'me');
            $('.jbn-fire').disabled = locked;
            input.disabled = locked;
            $('.jbn-hint').disabled = S.phase !== 'play' || !!S.solutionSeen;
            $('.jbn-sol').disabled = S.phase !== 'play';
            $('.jbn-rotate').disabled = S.selShip < 0;
            var sb = $('.jbn-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
            renderCells(boards.target, S.enemy);
            renderCells(boards.own, S.phase === 'place' ? null : S.mine);
            if (boards.target) highlight(boards.target, S.cur);
        }
        function setMsg(t) { S.lastMsg = t || ''; $('.jbn-msg').innerHTML = S.lastMsg; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // ── Nouvelle partie ──────────────────────────────────────────────
        function buildBoards() {
            stage.innerHTML = '';
            boards.target = null; boards.own = null;
            if (S.mode === 'duel') {
                if (S.phase !== 'place') { boards.target = makeBoard('target'); stage.appendChild(boards.target.el); }
                boards.own = makeBoard('own'); stage.appendChild(boards.own.el);
                if (S.phase === 'place') boards.own.cap.textContent = 'Place ta flotte';
            } else {
                boards.target = makeBoard('target'); stage.appendChild(boards.target.el);
            }
        }
        function newGame() {
            clearTimeout(cpuTimer);
            S.enemy = newSide(S.n, randomFleet(S.n));
            S.mine = S.mode === 'duel' ? newSide(S.n, randomFleet(S.n)) : null;
            S.phase = S.mode === 'duel' ? 'place' : 'play';
            S.turn = 'me'; S.busy = false; S.hints = 0; S.hintLine = null; S.solutionSeen = false; S.won = null;
            S.cur = -1; S.selShip = -1;
            hideOv();
            buildBoards();
            setMsg(S.mode === 'duel' ? '⚓ Place ta flotte, puis appuie sur « Commencer la bataille ».' : '🔭 Une flotte se cache dans cette mer. À toi de la trouver !');
            updateUI();
            requestAnimationFrame(layout);
        }
        function startBattle() {
            if (S.phase !== 'place') return;
            S.phase = 'play'; S.turn = 'me'; S.selShip = -1;
            buildBoards();
            setMsg('🎯 À toi ! Choisis une case de la mer ennemie.');
            updateUI();
            requestAnimationFrame(layout);
            if (prog.sound) [262, 330, 392].forEach(function (f, j) { beep(f, 0.12, 'triangle', 0.05, j * 0.1); });
            save();
        }

        // ── Tir du joueur ────────────────────────────────────────────────
        function fire(i) {
            if (S.phase !== 'play' || S.busy || (S.mode === 'duel' && S.turn !== 'me')) return;
            if (i < 0 || i >= S.n * S.n) return;
            if (S.enemy.shots[i]) { setMsg('Tu as déjà tiré en <b>' + coord(S.n, i) + '</b>. Choisis une autre case.'); return; }
            S.cur = i;
            var res = shoot(S.enemy, i);
            boom(boards.target, i);
            var txt = 'Tir en <b>' + coord(S.n, i) + '</b> : ';
            if (res.sunk) txt += '🔥 Coulé ! Tu as coulé le <b>' + res.sunk + '</b>.';
            else if (res.hit) txt += '💥 Touché !';
            else txt += '💦 À l\'eau.';
            if (S.hintLine && res.hit) S.hintLine = null;
            setMsg(txt);
            if (prog.sound) (res.sunk ? sndSunk : res.hit ? sndHit : sndSplash)();
            updateUI(); renderShips();
            if (allSunk(S.enemy)) { endGame(true); return; }
            if (S.mode === 'duel') {
                S.turn = 'cpu'; S.busy = true; updateUI();
                cpuTimer = setTimeout(cpuTurn, 1100);
            }
            save();
        }
        function shoot(side, i) {
            var s = shipAt(side, i);
            side.shots[i] = s >= 0 ? 2 : 1;
            return { hit: s >= 0, sunk: s >= 0 && isSunk(side, s) ? side.ships[s].name : null };
        }
        function boom(B, i) {
            if (!B) return;
            var c = B.cells[i];
            c.classList.remove('boom'); void c.offsetWidth;
            setTimeout(function () { if (B.cells[i]) B.cells[i].classList.add('boom'); }, 0);
            setTimeout(function () { if (B.cells[i]) B.cells[i].classList.remove('boom'); }, 700);
        }

        // ── Tour de l'ordinateur ─────────────────────────────────────────
        function cpuTurn() {
            if (!root.isConnected || S.phase !== 'play') return;
            var i = aiChoose(S.n, S.mine, S.ai);
            if (i < 0) return;
            var res = shoot(S.mine, i);
            S.busy = false;
            var txt = '🤖 L\'ordinateur tire en <b>' + coord(S.n, i) + '</b> : ';
            if (res.sunk) txt += '🔥 il a coulé ton <b>' + res.sunk + '</b> !';
            else if (res.hit) txt += '💥 touché !';
            else txt += '💦 à l\'eau.';
            setMsg(txt);
            if (prog.sound) (res.sunk ? sndSunk : res.hit ? sndHit : sndSplash)();
            S.turn = 'me';
            updateUI(); renderShips();
            boom(boards.own, i);
            if (allSunk(S.mine)) { endGame(false); return; }
            save();
        }

        // ── Fin de partie ────────────────────────────────────────────────
        function endGame(iWon) {
            clearTimeout(cpuTimer);
            S.phase = 'over'; S.won = iWon; S.busy = false;
            var shots = countShots(S.enemy), hits = countHits(S.enemy);
            var acc = shots ? Math.round(hits / shots * 100) : 0;
            var stars = 0, title, txt;
            if (S.mode === 'chasse') {
                var lim = STAR_LIMITS[S.n];
                if (!S.solutionSeen) {
                    stars = shots <= lim[0] ? 3 : shots <= lim[1] ? 2 : 1;
                    if (S.hints) stars = Math.min(stars, 2);
                    var k = keyCfg();
                    if (stars > (prog.stars[k] || 0)) prog.stars[k] = stars;
                    if (!S.hints && (!prog.best[k] || shots < prog.best[k])) prog.best[k] = shots;
                    saveProgress(prog);
                }
                title = S.solutionSeen ? 'Voici la flotte' : (stars === 3 ? 'Tir parfait !' : 'Flotte coulée !');
                txt = S.solutionSeen ? 'La flotte cachée est affichée. Rejoue pour la trouver toi-même !'
                    : 'Toute la flotte coulée en <b>' + shots + '</b> tirs (précision : ' + acc + ' %)' +
                      (S.hints ? '<br>avec ' + S.hints + ' indice' + (S.hints > 1 ? 's' : '') : '') +
                      (stars < 3 ? '<br>Pour 3 étoiles : ' + lim[0] + ' tirs maximum.' : '<br>🏆 Bravo, quel capitaine !');
            } else {
                if (iWon) { prog.wins[keyCfg()] = (prog.wins[keyCfg()] || 0) + 1; saveProgress(prog); }
                stars = iWon ? (acc >= 45 ? 3 : acc >= 30 ? 2 : 1) : 0;
                title = iWon ? 'Victoire !' : 'Ta flotte a coulé…';
                txt = iWon ? 'Tu as coulé la flotte de l\'ordinateur en <b>' + shots + '</b> tirs (précision : ' + acc + ' %).'
                           : 'L\'ordinateur (' + AI_LEVELS[S.ai].name + ') a gagné. Les navires ennemis restants sont affichés en transparence.<br>Prends ta revanche !';
            }
            updateUI(); renderShips();
            if (prog.sound) {
                if (iWon) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.25 + j * 0.11); });
                else [392, 349, 311, 262].forEach(function (f, j) { beep(f, 0.22, 'sine', 0.06, 0.2 + j * 0.16); });
            }
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.jbn-win-title').textContent = title;
                var st = $('.jbn-win-stars');
                st.innerHTML = S.solutionSeen || (S.mode === 'duel' && !iWon) ? '' : starHTML(stars);
                st.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                $('.jbn-win-txt').innerHTML = txt;
                showOv('.jbn-ov-win');
                if (iWon && stars >= 2 && !S.solutionSeen) confetti();
            }, 900);
            setMsg(iWon ? '🏆 Partie gagnée !' : (S.mode === 'chasse' ? '🎬 Solution affichée.' : '⚓ Partie perdue.'));
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#ff5a3c', '#22c55e', '#7fe3ff', '#ffffff', '#f97316'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jbn-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Indice et solution (mode Chasse) ─────────────────────────────
        function hint() {
            if (S.phase !== 'play' || S.mode !== 'chasse') return;
            var alive = S.enemy.ships.filter(function (sh, s) { return !isSunk(S.enemy, s); });
            if (!alive.length) return;
            var sh = alive[Math.floor(Math.random() * alive.length)];
            var free = sh.cells.filter(function (x) { return !S.enemy.shots[x]; });
            var x = free.length ? free[Math.floor(Math.random() * free.length)] : sh.cells[0];
            var n = S.n;
            S.hintLine = Math.random() < 0.5 ? { t: 'r', k: Math.floor(x / n) } : { t: 'c', k: x % n };
            S.hints++;
            setMsg('💡 Un navire passe par la ' + (S.hintLine.t === 'r' ? '<b>ligne ' + (S.hintLine.k + 1) + '</b>' : '<b>colonne ' + LETTERS.charAt(S.hintLine.k) + '</b>') + ' (en jaune).');
            if (prog.sound) beep(880, 0.12, 'sine', 0.05);
            updateUI(); save();
        }
        function solution() {
            if (S.phase !== 'play') return;
            S.solutionSeen = true;
            endGame(false);
        }

        // ── Placement de ma flotte (duel) ────────────────────────────────
        var drag = null;
        function validFor(s, cells) {
            if (!cells) return false;
            return S.mine.ships.every(function (sh, k) {
                return k === s || !sh.cells.some(function (x) { return cells.indexOf(x) >= 0; });
            });
        }
        function onShipDown(ev, s) {
            if (S.phase !== 'place' || (ev.button != null && ev.button > 0)) return;
            ev.preventDefault(); ev.stopPropagation();
            root.focus({ preventScroll: true });
            var O = boards.own, e = ev.currentTarget, sh = S.mine.ships[s];
            var i0 = Math.min.apply(null, sh.cells), n = S.n;
            var rect = O.sea.getBoundingClientRect(), k = rect.width / O.sea.offsetWidth || 1;
            drag = { s: s, id: ev.pointerId, e: e, sx: ev.clientX, sy: ev.clientY, r0: Math.floor(i0 / n), c0: i0 % n, k: k, moved: false, to: null };
            try { e.setPointerCapture(ev.pointerId); } catch (er) {}
            e.classList.add('drag');
        }
        function onShipMove(ev) {
            if (!drag || ev.pointerId !== drag.id) return;
            var O = boards.own, c = O.cell;
            var dx = (ev.clientX - drag.sx) / drag.k, dy = (ev.clientY - drag.sy) / drag.k;
            if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
            if (!drag.moved) return;
            var sh = S.mine.ships[drag.s];
            var r = Math.max(0, Math.min(S.n - (sh.h ? 1 : sh.len), drag.r0 + Math.round(dy / c)));
            var col = Math.max(0, Math.min(S.n - (sh.h ? sh.len : 1), drag.c0 + Math.round(dx / c)));
            var cells = shipCells(S.n, r, col, sh.len, sh.h);
            drag.to = cells;
            placeShipEl(O, drag.e, { cells: cells, h: sh.h, len: sh.len });
            drag.e.classList.toggle('bad', !validFor(drag.s, cells));
        }
        function onShipUp(ev) {
            if (!drag || ev.pointerId !== drag.id) return;
            var d = drag; drag = null;
            d.e.classList.remove('drag');
            try { d.e.releasePointerCapture(d.id); } catch (er) {}
            if (!d.moved) { S.selShip = d.s; rotateShip(d.s); return; }
            if (d.to && validFor(d.s, d.to)) { S.mine.ships[d.s].cells = d.to; S.selShip = d.s; if (prog.sound) beep(420, 0.06, 'triangle', 0.05); }
            else setMsg('⛔ Les navires ne peuvent pas se chevaucher.');
            renderShips(); updateUI(); save();
        }
        function rotateShip(s) {
            if (S.phase !== 'place' || s < 0) return;
            var sh = S.mine.ships[s], n = S.n, i0 = Math.min.apply(null, sh.cells);
            var r = Math.floor(i0 / n), c = i0 % n, h = !sh.h;
            // On essaie de tourner sur place, puis en décalant le navire pour qu'il reste dans la grille
            var tries = [[r, c]];
            for (var d = 1; d < sh.len; d++) tries.push(h ? [r, c - d] : [r - d, c]);
            for (var t = 0; t < tries.length; t++) {
                var cells = shipCells(n, tries[t][0], tries[t][1], sh.len, h);
                if (cells && validFor(s, cells)) {
                    sh.cells = cells; sh.h = h;
                    if (prog.sound) beep(520, 0.06, 'triangle', 0.05);
                    setMsg('⟳ ' + sh.name + ' tourné.');
                    renderShips(); updateUI(); save();
                    return;
                }
            }
            setMsg('⛔ Pas assez de place pour tourner le ' + sh.name + ' ici.');
            var e = boards.own.shipsL.querySelector('[data-s="' + s + '"]');
            if (e) { e.classList.add('bad'); setTimeout(function () { e.classList.remove('bad'); }, 400); }
            renderShips(); updateUI();
        }
        root.addEventListener('pointermove', onShipMove);
        root.addEventListener('pointerup', onShipUp);
        root.addEventListener('pointercancel', onShipUp);

        // ── Clavier : coordonnées, flèches + Entrée, R pour tourner ──────
        input.addEventListener('keydown', function (e) {
            e.stopPropagation();
            if (e.key === 'Enter') { fireInput(); e.preventDefault(); }
        });
        input.addEventListener('input', function () {
            var i = parseCoord(S.n, input.value);
            if (i >= 0 && boards.target) { S.cur = i; highlight(boards.target, i); renderCells(boards.target, S.enemy); }
        });
        function fireInput() {
            var v = input.value.trim();
            if (!v) { input.focus(); return; }
            var i = parseCoord(S.n, v);
            if (i < 0) { setMsg('« ' + v.replace(/</g, '&lt;') + ' » n\'est pas une case : écris une lettre (A à ' + LETTERS.charAt(S.n - 1) + ') puis un nombre (1 à ' + S.n + '), ex. C5.'); return; }
            input.value = '';
            fire(i);
            if (!input.disabled) input.focus({ preventScroll: true });
        }
        $('.jbn-fire').addEventListener('click', function () {
            if (input.value.trim()) fireInput();
            else if (S.cur >= 0 && !S.enemy.shots[S.cur]) fire(S.cur);
            else { setMsg('Écris une case (ex. C5) ou touche une case de la mer.'); input.focus(); }
        });
        root.addEventListener('keydown', function (e) {
            if (e.target === input) return;
            if (S.phase === 'place' && (e.key === 'r' || e.key === 'R')) { rotateShip(S.selShip); e.preventDefault(); e.stopPropagation(); return; }
            if (S.phase !== 'play' || !boards.target) return;
            var n = S.n, cur = S.cur < 0 ? 0 : S.cur, r = Math.floor(cur / n), c = cur % n, moved = true;
            if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
            else if (e.key === 'ArrowRight') c = Math.min(n - 1, c + 1);
            else if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
            else if (e.key === 'ArrowDown') r = Math.min(n - 1, r + 1);
            else if (e.key === 'Enter' || e.key === ' ') { if (S.cur >= 0) fire(S.cur); moved = false; }
            else return;
            e.preventDefault(); e.stopPropagation();
            if (moved) { S.cur = r * n + c; renderCells(boards.target, S.enemy); highlight(boards.target, S.cur); }
        });

        // ── Fenêtres : réglages / fin / aide ─────────────────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jbn-ov').forEach(function (o) { o.classList.remove('show'); }); }
        var draft = null;
        function openOptions() {
            draft = { mode: S.mode, n: S.n, ai: S.ai };
            syncOptions();
            showOv('.jbn-ov-opts');
        }
        function syncOptions() {
            root.querySelectorAll('.jbn-ov-opts [data-opt]').forEach(function (g) {
                var key = g.dataset.opt;
                g.querySelectorAll('.jbn-ch').forEach(function (b) { b.classList.toggle('on', String(draft[key]) === b.dataset.v); });
            });
            root.querySelectorAll('.jbn-opt-ai').forEach(function (x) { x.style.display = draft.mode === 'duel' ? '' : 'none'; });
        }
        root.addEventListener('click', function (e) {
            var ch = e.target.closest('.jbn-ch');
            if (ch && draft) {
                var key = ch.parentNode.dataset.opt;
                draft[key] = key === 'mode' ? ch.dataset.v : +ch.dataset.v;
                syncOptions(); return;
            }
            if (e.target.closest('.jbn-x')) { hideOv(); return; }
            if (e.target.classList.contains('jbn-ov') && !$('.jbn-ov-win').classList.contains('show')) hideOv();
        });
        $('.jbn-o-start').addEventListener('click', function () {
            S.mode = draft.mode; S.n = draft.n; S.ai = draft.ai;
            newGame(); save();
        });
        $('.jbn-lvlbtn').addEventListener('click', openOptions);
        $('.jbn-opts').addEventListener('click', openOptions);
        $('.jbn-again').addEventListener('click', function () { newGame(); save(); });
        $('.jbn-w-again').addEventListener('click', function () { newGame(); save(); });
        $('.jbn-w-opts').addEventListener('click', openOptions);
        $('.jbn-w-see').addEventListener('click', hideOv);
        $('.jbn-hint').addEventListener('click', hint);
        $('.jbn-sol').addEventListener('click', solution);
        $('.jbn-shuffle').addEventListener('click', function () {
            var f = randomFleet(S.n);
            if (f) { S.mine.ships = f; S.selShip = -1; renderShips(); updateUI(); setMsg('🔀 Nouvelle position de ta flotte.'); save(); }
        });
        $('.jbn-rotate').addEventListener('click', function () { rotateShip(S.selShip); });
        $('.jbn-start').addEventListener('click', startBattle);
        $('.jbn-help').addEventListener('click', function () { showOv('.jbn-ov-help'); });
        $('.jbn-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv();
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '⚓ Bataille navale', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jbn-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jbnZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jbnZ || '';
            applySize();
            requestAnimationFrame(layout);
            save();
        });
        $('.wf-btn-close').addEventListener('click', function (e) {
            e.stopPropagation();
            clearTimeout(cpuTimer);
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (e) {} }
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            widget.remove();
            save();
        });

        // ── Redimensionnement par la poignée ─────────────────────────────
        var grip = $('.jbn-grip'), rs = null;
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
        function sideData(side) {
            return side ? { ships: side.ships.map(function (sh) { return { cells: sh.cells.slice(), h: sh.h }; }), shots: side.shots.slice() } : null;
        }
        widget._jbnGetData = function () {
            return {
                mode: S.mode, n: S.n, ai: S.ai, phase: S.phase, turn: S.turn,
                enemy: sideData(S.enemy), mine: sideData(S.mine),
                hints: S.hints, hintLine: S.hintLine, solutionSeen: S.solutionSeen, won: S.won,
                cur: S.cur, msg: S.lastMsg,
                w: S.w, h: S.h, fullboard: S.fullboard
            };
        };
        function restoreSide(n, d) {
            var spec = FLEETS[n];
            if (!d || !Array.isArray(d.ships) || d.ships.length !== spec.length || !Array.isArray(d.shots) || d.shots.length !== n * n) return null;
            var taken = new Int8Array(n * n), ships = [];
            for (var s = 0; s < spec.length; s++) {
                var src = d.ships[s];
                if (!src || !Array.isArray(src.cells) || src.cells.length !== spec[s][1]) return null;
                var i0 = Math.min.apply(null, src.cells), h = !!src.h;
                var cells = shipCells(n, Math.floor(i0 / n), i0 % n, spec[s][1], h);
                if (!cells || cells.join() !== src.cells.slice().sort(function (a, b) { return a - b; }).join()) return null;
                for (var k = 0; k < cells.length; k++) { if (taken[cells[k]]) return null; taken[cells[k]] = 1; }
                ships.push({ name: spec[s][0], len: spec[s][1], cells: cells, h: h });
            }
            var shots = d.shots.map(function (v) { return v === 1 || v === 2 ? v : 0; });
            // Cohérence des tirs avec les navires
            for (var i = 0; i < n * n; i++) if (shots[i] && shots[i] !== (taken[i] ? 2 : 1)) return null;
            return { ships: ships, shots: shots };
        }
        function restore(d) {
            if (!d || (d.n !== 8 && d.n !== 10) || (d.mode !== 'chasse' && d.mode !== 'duel')) return false;
            var enemy = restoreSide(d.n, d.enemy);
            var mine = d.mode === 'duel' ? restoreSide(d.n, d.mine) : null;
            if (!enemy || (d.mode === 'duel' && !mine)) return false;
            S.mode = d.mode; S.n = d.n; S.ai = [0, 1, 2].indexOf(d.ai) >= 0 ? d.ai : 1;
            S.enemy = enemy; S.mine = mine;
            S.phase = ['place', 'play', 'over'].indexOf(d.phase) >= 0 ? d.phase : 'play';
            if (S.mode === 'chasse' && S.phase === 'place') S.phase = 'play';
            S.turn = d.turn === 'cpu' ? 'cpu' : 'me';
            S.hints = Math.max(0, d.hints | 0);
            S.hintLine = d.hintLine && (d.hintLine.t === 'r' || d.hintLine.t === 'c') && d.hintLine.k >= 0 && d.hintLine.k < d.n ? { t: d.hintLine.t, k: d.hintLine.k | 0 } : null;
            S.solutionSeen = !!d.solutionSeen;
            S.won = typeof d.won === 'boolean' ? d.won : null;
            S.cur = Number.isInteger(d.cur) && d.cur >= 0 && d.cur < d.n * d.n ? d.cur : -1;
            S.busy = false; S.selShip = -1;
            buildBoards();
            setMsg(typeof d.msg === 'string' ? d.msg : '');
            updateUI();
            requestAnimationFrame(layout);
            if (S.phase === 'play' && S.mode === 'duel' && S.turn === 'cpu') { S.busy = true; updateUI(); cpuTimer = setTimeout(cpuTurn, 900); }
            return true;
        }

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('jbn-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        if (!restore(data)) {
            if (data.n === 8 || data.n === 10) S.n = data.n;
            newGame();
        }
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        // Sur téléphone et tablette, une partie lancée depuis le panneau s'ouvre
        // directement en plein écran (bouton vert), comme le Rush Hour
        var fresh = !data.mode;
        if (fresh && isTablet() && !S.fullboard) {
            var _tabVH = typeof virtualH === 'function' ? virtualH(window.innerWidth) : window.innerHeight;
            S.w = Math.max(MIN_W, Math.min(S.w, window.innerWidth - 120));
            S.h = Math.max(MIN_H, Math.min(S.h, _tabVH - 20));
            applySize();
        }
        if (fresh && (isPhone() || isTablet()) && !S.fullboard) {
            requestAnimationFrame(function () { $('.wf-btn-max').click(); });
        }

        function isPhone() {
            if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
            if (typeof window.isPhoneScreen === 'function') return !!window.isPhoneScreen();
            return !!(window.matchMedia && window.matchMedia(window.PHONE_MEDIA_QUERY || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)').matches);
        }
        function isTablet() {
            if (isPhone()) return false;
            if (typeof isTabletBoardMode === 'function') { try { return !!isTabletBoardMode(); } catch (e) {} }
            return !!(window.matchMedia && window.matchMedia(window.TABLET_MEDIA_QUERY || '(pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
        }
    }

    // =====================================================================
    // Création : depuis le panneau Jeux (createWidget) ou à la restauration
    // =====================================================================
    window.createJeuBatailleNavaleWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        // Restauration sans données : pas d'ouverture automatique en plein écran
        window._jbnNextPendingData = restored ? (payload || { _restored: true, mode: 'restored' }) : null;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jbnNextPendingData = null;
        }
        if (w && !w._jbnInit) initBatailleNavale(w, restored ? (payload || { _restored: true, mode: 'restored' }) : null);
        return w;
    };

    // Intercepter createWidget('jeu-bataille-navale') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jbnHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jbnInit) {
                var pending = window._jbnNextPendingData || null;
                initBatailleNavale(w, pending);
            }
            return w;
        };
        // On garde les marques des autres jeux qui ont déjà intercepté createWidget
        Object.keys(orig).forEach(function (k) { if (/^_j\w+Hooked$/.test(k)) wrapped[k] = orig[k]; });
        wrapped._jbnHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests / le débogage
    window._jbnTest = { randomFleet: randomFleet, aiChoose: aiChoose, parseCoord: parseCoord, coord: coord, FLEETS: FLEETS, newSide: newSide, shipAt: shipAt, isSunk: isSunk, allSunk: allSunk };
})();
