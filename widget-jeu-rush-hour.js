// =========================================================================
// WIDGET JEU : RUSH HOUR — libérer la voiture rouge du parking
// -------------------------------------------------------------------------
// • 40 niveaux en 4 difficultés (Débutant → Expert), tous vérifiés par un
//   solveur : le « minimum » affiché est le nombre exact de coups optimal.
// • Un coup = faire glisser un véhicule (quelle que soit la distance).
// • Glisser au doigt, au stylet ou à la souris ; ou cliquer un véhicule
//   puis utiliser les flèches du clavier.
// • Annuler, recommencer, indice (prochain coup optimal), solution animée.
// • Progression (étoiles, records) mémorisée dans le navigateur.
// • Sauvegarde du tableau : niveau, position des véhicules, coups, taille
//   (via _jrhGetData / createJeuRushHourWidget(data), cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-rush-hour';
    var STORE_KEY = 'jrh-progress-v1';
    var N = 6, EXIT_ROW = 2, EXIT_POS = 4;      // la voiture rouge sort quand elle atteint les colonnes 4-5
    var DEF_W = 780, DEF_H = 580, MIN_W = 340, MIN_H = 380;

    // Grille 6×6 lue ligne par ligne : '.' = vide, 'A' = voiture rouge,
    // autres lettres = véhicules. Le nombre = coups minimum (calculé au solveur).
    var LEVELS = [
        ['C.....C.GGEECAADF.BBBDF.............', 3],
        ['....DDBB......AACG....CGF..HH.F...EE', 4],
        ['.C.....C.HEE.AAH.....H...FFDD...BBGG', 4],
        ['..BB........AAE..C.FE..C.FGG.C....DD', 5],
        ['.........EEGAAD..GC.D..GC.D.FFC.BB..', 5],
        ['..CC.G....DG.AA.DG...FEE...F....BB..', 6],
        ['EBB..GE....G..AA.G.F..CC.FDHHH..D...', 6],
        ['.CEEE..C..G..CAAG..FFH.....HBB.DDD..', 7],
        ['H....EH.D..EAADG.E...G...B.....BFFCC', 7],
        ['...HEE...H...AAF...B.F.CGB.DDCGB....', 8],
        ['.KKIID.CCCGDAA..GD.H.JJ.BH.FF.BHLLEE', 9],
        ['IFCCC.IFJMMMAAJL.EGKHL.EGKH..E.KBBDD', 9],
        ['GJBB..GJFF.H..EAAH..ED.H...DCC....II', 10],
        ['....C.I...C.IAA.C...GFF.B.GDD.BHHEE.', 10],
        ['..HH.....G.FAA.GBFCCCGB.D.EEE.D.....', 11],
        ['..BCCC..BDHH.AADJ.....JEGGKKKE.FFII.', 11],
        ['JIFFCCJI....AAG.....G.EHBDDDEHB..KK.', 12],
        ['.HHCLLEE.C..M.AAF.MDDDFJ..KGGJBBK.II', 12],
        ['JJG...I.G.LEIAA.LE.FFBBEMCKKHHMC..DD', 13],
        ['.....GC..B.GCAAB.G..IDHH..IDEEJJ.FF.', 13],
        ['D..HH.D.CCF.AAB.F...B.I..EEEI.....GG', 14],
        ['G..FFJGDD.HJG.AAHI..CKKILLCBMMEEEB..', 15],
        ['CJDDHGCJE.HGAAE.FG....F...I.....IBBB', 16],
        ['HHKF....KFBBCAA.EICMDDEI.M.GJJ.LLG..', 17],
        ['CGGF..CL.FBB.LAAE.MDD.EHM.JIIHKKJNN.', 18],
        ['.HIIKK.HDDD.AABF..C.BFGGC.EEJ.....J.', 19],
        ['G.BB.HGFFD.HAAED.H.JE....JKKCC..LLII', 20],
        ['F..DDCF.LL.CJAAE.CJ..E..J.IBGGHHIBKK', 21],
        ['..LLGGD.EEECD.AAKCMMHHKCBBBI..JJ.IFF', 22],
        ['..BHH.DKBCCJDKAAFJ....F.EEE.I.LLGGI.', 23],
        ['..CEEEDDC...HAAJ..H..JKKGGBBBI.FF..I', 24],
        ['FDJJCCFDEEELAAK..LB.K.HHB.GGMINNN.MI', 25],
        ['LL..C.IJJJC.IGAAC.EG.HKKE..H.DBBFF.D', 26],
        ['MKK.LLM.JBBFAAJE.FNH.ECCNHGGD..II.D.', 27],
        ['..EKK..GE.CJLGAACJLHH..I.DDDBIFF..B.', 28],
        ['GMM.JJGNNLLBAA..FB.CIIFB.CDKHHEEDK..', 29],
        ['KDDJJJKHHHI.AABFI...BFGG.CCC.E..LL.E', 30],
        ['.KFFJ..KDLJEAADLBEIHHCBEI..C..I.GGG.', 32],
        ['.HMMFFBHEEJLBHAAJLNNDIJL..DIGG.KKCC.', 34],
        ['KK.G..DE.GJFDEAAJFDHHB.F..LBII..LCCC', 38]
    ];

    var GROUPS = [
        { name: 'Débutant',      cls: 'g1', from: 0,  to: 9  },
        { name: 'Intermédiaire', cls: 'g2', from: 10, to: 19 },
        { name: 'Avancé',        cls: 'g3', from: 20, to: 29 },
        { name: 'Expert',        cls: 'g4', from: 30, to: 39 }
    ];
    function groupOf(idx) {
        for (var i = 0; i < GROUPS.length; i++) if (idx >= GROUPS[i].from && idx <= GROUPS[i].to) return GROUPS[i];
        return GROUPS[0];
    }

    var CAR_COLORS   = ['#f4c430', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#14b8a6',
                        '#ec4899', '#84cc16', '#0ea5e9', '#eab308', '#8b5cf6', '#10b981'];
    var TRUCK_COLORS = ['#7c3aed', '#2563eb', '#ca8a04', '#0d9488', '#be185d', '#4d7c0f'];

    // ── Progression (étoiles, records, son) ─────────────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, sound: p.sound !== false };
        } catch (e) { return { stars: {}, best: {}, sound: true }; }
    }
    function saveProgress(p) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
    }

    // ── Lecture d'un niveau ─────────────────────────────────────────────
    function parseLevel(str) {
        var cells = {};
        for (var i = 0; i < 36; i++) {
            var ch = str.charAt(i);
            if (ch !== '.') (cells[ch] = cells[ch] || []).push(i);
        }
        var ids = Object.keys(cells).sort();          // 'A' (voiture rouge) en premier
        var pieces = [], pos = [], car = 0, truck = 0;
        ids.forEach(function (id) {
            var c = cells[id];
            var h = (c[1] - c[0]) === 1;
            var len = c.length;
            var p = {
                h: h, len: len,
                fix: h ? Math.floor(c[0] / 6) : c[0] % 6,
                hero: id === 'A'
            };
            p.color = p.hero ? '#e11d2e' : (len === 3 ? TRUCK_COLORS[truck++ % TRUCK_COLORS.length]
                                                       : CAR_COLORS[car++ % CAR_COLORS.length]);
            pieces.push(p);
            pos.push(h ? c[0] % 6 : Math.floor(c[0] / 6));
        });
        return { pieces: pieces, pos: pos };
    }

    function buildGrid(pieces, pos) {
        var g = new Int8Array(36).fill(-1);
        for (var i = 0; i < pieces.length; i++) {
            var p = pieces[i], v = pos[i];
            for (var k = 0; k < p.len; k++) g[p.h ? p.fix * 6 + v + k : (v + k) * 6 + p.fix] = i;
        }
        return g;
    }

    // Plage de positions atteignables par le véhicule i
    function rangeOf(pieces, pos, i) {
        var g = buildGrid(pieces, pos), p = pieces[i], v = pos[i], lo = v, hi = v;
        while (lo - 1 >= 0 && g[p.h ? p.fix * 6 + lo - 1 : (lo - 1) * 6 + p.fix] === -1) lo--;
        while (hi + p.len < 6 && g[p.h ? p.fix * 6 + hi + p.len : (hi + p.len) * 6 + p.fix] === -1) hi++;
        return [lo, hi];
    }

    // ── Solveur (parcours en largeur) : renvoie la liste des coups optimaux ──
    function solve(pieces, start) {
        var n = pieces.length;
        function enc(pos) { var k = 0; for (var i = 0; i < n; i++) k = k * 5 + pos[i]; return k; }
        function dec(k) { var pos = new Array(n); for (var i = n - 1; i >= 0; i--) { pos[i] = k % 5; k = Math.floor(k / 5); } return pos; }
        if (start[0] === EXIT_POS) return [];
        var keys = [enc(start)], parent = [-1], mvPiece = [-1], mvTo = [-1];
        var seen = new Map(); seen.set(keys[0], 0);
        for (var h = 0; h < keys.length; h++) {
            if (keys.length > 800000) return null;
            var pos = dec(keys[h]), g = buildGrid(pieces, pos);
            for (var i = 0; i < n; i++) {
                var p = pieces[i], v = pos[i], d, e;
                for (var dir = -1; dir <= 1; dir += 2) {
                    for (d = v + dir; d >= 0 && d + p.len <= 6; d += dir) {
                        e = dir < 0 ? d : d + p.len - 1;
                        if (g[p.h ? p.fix * 6 + e : e * 6 + p.fix] !== -1) break;
                        var np = pos.slice(); np[i] = d;
                        var k = enc(np);
                        if (seen.has(k)) continue;
                        seen.set(k, keys.length);
                        keys.push(k); parent.push(h); mvPiece.push(i); mvTo.push(d);
                        if (i === 0 && d === EXIT_POS) {
                            var path = [], j = keys.length - 1;
                            while (parent[j] !== -1) { path.unshift({ i: mvPiece[j], to: mvTo[j] }); j = parent[j]; }
                            return path;
                        }
                    }
                }
            }
        }
        return null;
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

    // ── CSS (injecté une seule fois) ────────────────────────────────────
    function injectCSS() {
        if (document.getElementById('jrh-style')) return;
        var s = document.createElement('style');
        s.id = 'jrh-style';
        s.textContent = [
'.jrh-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#2fae8a 0%,#1d8a6c 45%,#0f5e4a 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jrh-root *{box-sizing:border-box}',
'.jrh-root.jrh-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jrh-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête (zone de déplacement du widget)
'.jrh-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;',
'  background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0));}',
'.jrh-title{font-weight:900;font-size:calc(22px*var(--ui));letter-spacing:.5px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jrh-title b{color:#ff4d5a}.jrh-title i{font-style:normal;color:#ffd23f}',
'.jrh-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}',
'.jrh-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jrh-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px}',
'.jrh-pill.g1{background:#22c55e;color:#06321a}.jrh-pill.g2{background:#38bdf8;color:#062a3a}',
'.jrh-pill.g3{background:#fb923c;color:#3b1702}.jrh-pill.g4{background:#f43f5e;color:#fff}',
'.jrh-spacer{flex:1}',
'.jrh-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0}',
'.jrh-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jrh-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jrh-root.jrh-tall .jrh-body{flex-direction:column}',
'.jrh-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}',
'.jrh-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(236px*var(--ui))}',
'.jrh-root.jrh-tall .jrh-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center}',
'.jrh-stats{display:flex;gap:6px}',
'.jrh-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 4px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.jrh-stat small{display:block;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;opacity:.8;text-transform:uppercase}',
'.jrh-stat span{display:block;font-size:calc(24px*var(--ui));font-weight:900;line-height:1.1}',
'.jrh-stat.jrh-st-moves span{color:#ffd23f}',
'.jrh-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jrh-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jrh-stars .off{color:rgba(255,255,255,.25)}',
'.jrh-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jrh-root.jrh-tall .jrh-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jrh-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));',
'  color:#0b3b2e;background:#e9fff6;box-shadow:0 3px 0 #9fd8c2;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jrh-btn:hover{filter:brightness(1.05)}.jrh-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #9fd8c2}',
'.jrh-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jrh-btn.jrh-hint{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jrh-btn.jrh-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jrh-btn.jrh-wide{grid-column:1 / -1}',
'.jrh-goal{font-size:calc(12px*var(--ui));opacity:.9;text-align:center;line-height:1.3}',
'.jrh-goal b{color:#ff8a92}',
'.jrh-msg{min-height:1.3em;font-size:calc(12px*var(--ui));text-align:center;font-weight:700;color:#ffe48a}',
// Plateau
'.jrh-board{position:relative;flex-shrink:0;border-radius:calc(var(--cell)*0.22);',
'  background:linear-gradient(145deg,#3c4a52,#1f2a30);box-shadow:0 calc(var(--cell)*0.12) calc(var(--cell)*0.35) rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.08)}',
'.jrh-lot{position:absolute;border-radius:calc(var(--cell)*0.08);background-color:#59646b;',
'  background-image:linear-gradient(rgba(255,255,255,.13) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.13) 2px,transparent 2px);',
'  background-size:var(--cell) var(--cell);background-position:-1px -1px;box-shadow:inset 0 0 calc(var(--cell)*0.3) rgba(0,0,0,.45)}',
'.jrh-exit{position:absolute;display:flex;align-items:center;justify-content:center;gap:2px;background:#59646b;',
'  border-radius:0 calc(var(--cell)*0.12) calc(var(--cell)*0.12) 0;color:#ffd23f;font-weight:900;overflow:hidden}',
'.jrh-exit span{font-size:calc(var(--cell)*0.34);line-height:1;animation:jrhArrow 1.2s infinite;opacity:.35}',
'.jrh-exit span:nth-child(2){animation-delay:.2s}.jrh-exit span:nth-child(3){animation-delay:.4s}',
'@keyframes jrhArrow{0%,100%{opacity:.25}50%{opacity:1}}',
'.jrh-exit-lbl{position:absolute;font-weight:900;font-size:calc(var(--cell)*0.2);letter-spacing:1px;color:#ffd23f;',
'  background:rgba(0,0,0,.35);border-radius:6px;padding:1px 6px;white-space:nowrap;transform:translateX(-50%)}',
// Véhicules
'.jrh-veh{position:absolute;cursor:grab;touch-action:none;border-radius:calc(var(--cell)*0.2);',
'  background:linear-gradient(160deg,var(--c1),var(--c2));',
'  box-shadow:0 calc(var(--cell)*0.06) 0 var(--c3),0 calc(var(--cell)*0.1) calc(var(--cell)*0.18) rgba(0,0,0,.45),inset 0 2px 0 rgba(255,255,255,.35);',
'  transition:left .16s ease,top .16s ease,box-shadow .15s}',
'.jrh-veh.jrh-drag{transition:none;cursor:grabbing;z-index:5}',
'.jrh-veh.jrh-sel{outline:3px solid #fff;outline-offset:2px;z-index:4}',
'.jrh-veh.jrh-hintv{animation:jrhPulse .8s ease-in-out infinite;z-index:4}',
'@keyframes jrhPulse{0%,100%{outline:3px solid rgba(255,210,63,.3);outline-offset:2px}50%{outline:4px solid #ffd23f;outline-offset:5px}}',
// Toit + vitres (voiture)
'.jrh-roof{position:absolute;border-radius:calc(var(--cell)*0.12);background:var(--c2);box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}',
'.jrh-veh.h .jrh-roof{left:22%;right:22%;top:16%;bottom:16%;border-left:calc(var(--cell)*0.13) solid #cdeeff;border-right:calc(var(--cell)*0.11) solid #a7d8f2}',
'.jrh-veh.v .jrh-roof{top:22%;bottom:22%;left:16%;right:16%;border-top:calc(var(--cell)*0.11) solid #a7d8f2;border-bottom:calc(var(--cell)*0.13) solid #cdeeff}',
// Camion : cabine + benne
'.jrh-veh.t .jrh-roof{display:none}',
'.jrh-cargo{position:absolute;border-radius:calc(var(--cell)*0.1);background:repeating-linear-gradient(var(--sd),rgba(255,255,255,.22) 0 3px,transparent 3px 12px),var(--c2);box-shadow:inset 0 0 0 2px rgba(0,0,0,.12)}',
'.jrh-veh.h .jrh-cargo{left:7%;top:12%;bottom:12%;right:34%;--sd:90deg}',
'.jrh-veh.v .jrh-cargo{top:7%;left:12%;right:12%;bottom:34%;--sd:0deg}',
'.jrh-cab{position:absolute;border-radius:calc(var(--cell)*0.08);background:#cdeeff;box-shadow:inset 0 0 0 2px rgba(0,0,0,.12)}',
'.jrh-veh.h .jrh-cab{right:9%;top:20%;bottom:20%;width:13%}',
'.jrh-veh.v .jrh-cab{bottom:9%;left:20%;right:20%;height:13%}',
// Phares
'.jrh-lights{position:absolute;pointer-events:none}',
'.jrh-veh.h .jrh-lights{right:2px;top:12%;bottom:12%;width:calc(var(--cell)*0.06);border-top:calc(var(--cell)*0.1) solid #fff6b0;border-bottom:calc(var(--cell)*0.1) solid #fff6b0;border-radius:2px}',
'.jrh-veh.v .jrh-lights{bottom:2px;left:12%;right:12%;height:calc(var(--cell)*0.06);border-left:calc(var(--cell)*0.1) solid #fff6b0;border-right:calc(var(--cell)*0.1) solid #fff6b0;border-radius:2px}',
'.jrh-veh.hero{box-shadow:0 calc(var(--cell)*0.06) 0 var(--c3),0 0 calc(var(--cell)*0.3) rgba(255,60,60,.55),0 calc(var(--cell)*0.1) calc(var(--cell)*0.18) rgba(0,0,0,.45),inset 0 2px 0 rgba(255,255,255,.35)}',
'.jrh-star{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:calc(var(--cell)*0.34);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);pointer-events:none;line-height:1}',
'.jrh-veh.jrh-out{transition:left .55s cubic-bezier(.5,0,.9,.4),opacity .55s;opacity:0}',
// Fantôme de l'indice
'.jrh-ghost{position:absolute;border:3px dashed #ffd23f;border-radius:calc(var(--cell)*0.2);background:rgba(255,210,63,.15);pointer-events:none;z-index:3}',
// Fenêtres superposées (niveaux, victoire)
'.jrh-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(6,40,31,.78);backdrop-filter:blur(3px);padding:14px}',
'.jrh-ov.show{display:flex}',
'.jrh-card{background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jrh-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#0f5e4a}',
'.jrh-lv-grp{margin:8px 0 2px;text-align:left}',
'.jrh-lv-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin-top:4px}',
'.jrh-lv{border:none;cursor:pointer;border-radius:10px;padding:5px 2px 3px;font-weight:900;font-size:calc(15px*var(--ui));min-width:calc(40px*var(--ui));',
'  background:#eef6f3;color:#0f5e4a;box-shadow:0 2px 0 #c8ddd5;line-height:1.1}',
'.jrh-lv small{display:block;font-size:calc(9px*var(--ui));letter-spacing:1px;color:#f4b400;min-height:1.1em}',
'.jrh-lv.cur{background:#0f5e4a;color:#fff;box-shadow:0 2px 0 #062a20}',
'.jrh-lv:hover{filter:brightness(.96)}',
'.jrh-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jrh-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jrhPop .5s backwards}',
'.jrh-win-stars .off{color:#d7e3df}',
'@keyframes jrhPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jrh-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 12px;color:#345}',
'.jrh-win-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
'.jrh-card .jrh-btn{box-shadow:0 3px 0 #b7d6cb;background:#eef6f3}',
'.jrh-card .jrh-btn.jrh-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jrh-x{position:absolute;top:10px;right:10px}',
'.jrh-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jrhFall linear forwards;z-index:21}',
'@keyframes jrhFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jrh-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jrh-grip:hover{opacity:1}',
// Format étroit : en-tête compacte
'.jrh-root.jrh-narrow .jrh-head{gap:6px;padding:8px 8px 6px 10px}',
'.jrh-root.jrh-narrow .jrh-title .jrh-tt{display:none}',
'.jrh-root.jrh-narrow .jrh-lvlword{display:none}',
'.jrh-root.jrh-narrow .jrh-icon{width:24px;height:24px;font-size:12px}',
'.jrh-root.jrh-narrow .jrh-help{display:none}',
'.jrh-root.jrh-fullboard .jrh-grip,.widget.phone-fs .jrh-grip{display:none}'
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

    function shade(hex, f) {   // f < 0 : assombrir, f > 0 : éclaircir
        var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
        function m(c) { return Math.max(0, Math.min(255, Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f))); }
        return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
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
    function initRushHour(widget, data) {
        if (!widget || widget._jrhInit) return;
        widget._jrhInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            level: 0, pieces: null, pos: null, start: null,
            history: [], moves: 0, hints: 0, solutionSeen: false,
            sel: -1, won: false, busy: false, cell: 60,
            w: DEF_W, h: DEF_H, fullboard: false
        };

        // Fond transparent : seul le cadre arrondi du jeu est visible
        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jrh-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jrh-head">' +
                '<div class="jrh-title">🚗<span class="jrh-tt"> <b>Rush</b> <i>Hour</i></span></div>' +
                '<button class="jrh-lvlbtn" title="Choisir un niveau"><span class="jrh-pill"></span><span class="jrh-lvltxt"></span> ▾</button>' +
                '<div class="jrh-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jrh-icon jrh-sound" title="Son"></button>' +
                    '<button class="jrh-icon jrh-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jrh-body">' +
                '<div class="jrh-stage"><div class="jrh-board"><div class="jrh-lot"></div><div class="jrh-exit"><span>›</span><span>›</span><span>›</span></div><div class="jrh-exit-lbl">SORTIE</div></div></div>' +
                '<div class="jrh-side">' +
                    '<div class="jrh-stats">' +
                        '<div class="jrh-stat jrh-st-moves"><small>Coups</small><span class="jrh-v-moves">0</span></div>' +
                        '<div class="jrh-stat"><small>Minimum</small><span class="jrh-v-min">0</span></div>' +
                        '<div class="jrh-stat"><small>Record</small><span class="jrh-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="jrh-stars"></div>' +
                    '<div class="jrh-btns">' +
                        '<button class="jrh-btn jrh-undo" title="Annuler le dernier coup (Ctrl+Z)">↶ Annuler</button>' +
                        '<button class="jrh-btn jrh-reset" title="Recommencer le niveau">↺ Recommencer</button>' +
                        '<button class="jrh-btn jrh-hint" title="Montrer le meilleur coup">💡 Indice</button>' +
                        '<button class="jrh-btn jrh-sol" title="Regarder la solution">🎬 Solution</button>' +
                        '<button class="jrh-btn jrh-prev" title="Niveau précédent">◀ Préc.</button>' +
                        '<button class="jrh-btn jrh-next" title="Niveau suivant">Suiv. ▶</button>' +
                    '</div>' +
                    '<div class="jrh-goal">Fais glisser les véhicules pour libérer la <b>voiture rouge</b> vers la sortie.</div>' +
                    '<div class="jrh-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jrh-ov jrh-ov-levels"><div class="jrh-card" style="position:relative;"><button class="jrh-icon jrh-x" style="background:#0f5e4a;">✕</button><h3>Choisis un niveau</h3><div class="jrh-lv-list"></div></div></div>' +
            '<div class="jrh-ov jrh-ov-win"><div class="jrh-card"><h3 class="jrh-win-title">Bravo !</h3><div class="jrh-win-stars"></div><div class="jrh-win-txt"></div>' +
                '<div class="jrh-win-btns"><button class="jrh-btn jrh-w-replay">↺ Rejouer</button><button class="jrh-btn jrh-w-levels">☰ Niveaux</button><button class="jrh-btn jrh-next jrh-w-next">Niveau suivant ▶</button></div></div></div>' +
            '<div class="jrh-ov jrh-ov-help"><div class="jrh-card" style="max-width:440px;position:relative;text-align:left;"><button class="jrh-icon jrh-x" style="background:#0f5e4a;">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> faire sortir la <b style="color:#e11d2e;">voiture rouge</b> par la sortie, à droite du parking.</p>' +
                '<p style="margin:6px 0;">↔️ Les véhicules avancent ou reculent <b>dans leur sens</b> uniquement : jamais de côté, et ils ne passent pas les uns sur les autres.</p>' +
                '<p style="margin:6px 0;">🖐️ Fais-les <b>glisser</b> au doigt, au stylet ou à la souris. Au clavier : clique un véhicule puis utilise les <b>flèches</b>.</p>' +
                '<p style="margin:6px 0;">⭐ Un <b>coup</b> = un véhicule déplacé, quelle que soit la distance. Atteins le minimum pour gagner 3 étoiles (2 au maximum si tu as utilisé un indice).</p></div></div>' +
            '<div class="jrh-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var boardEl = $('.jrh-board'), lotEl = $('.jrh-lot'), exitEl = $('.jrh-exit'), exitLbl = $('.jrh-exit-lbl');
        var vehEls = [], ghostEl = null;

        // ── Isoler les interactions du jeu du déplacement du widget ─────
        // L'en-tête reste une zone de prise pour déplacer le widget.
        function isolate(e) {
            if (e.target.closest('.jrh-head') && !e.target.closest('button')) return;
            e.stopPropagation();
            if (e.type === 'pointerdown' || e.type === 'mousedown') {
                if (typeof bringToFront === 'function') { try { bringToFront(widget); } catch (er) {} }
            }
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.jrh-head button').forEach(function (b) {
            ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
                b.addEventListener(t, function (e) { e.stopPropagation(); }, t === 'touchstart' ? { passive: true } : false);
            });
        });

        // ── Mise en page (taille des cases selon la place disponible) ────
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
            var tall = W < H * 1.15;
            root.classList.toggle('jrh-narrow', W < 600);
            root.classList.toggle('jrh-tall', tall);
            var stage = $('.jrh-stage');
            var sw = stage.clientWidth, sh = stage.clientHeight;
            var cell = Math.floor(Math.min(sw / 7.55, sh / 6.7));
            cell = Math.max(24, cell);
            S.cell = cell;
            var f = Math.round(cell * 0.28);
            S.frame = f;
            var size = 6 * cell + 2 * f;
            boardEl.style.setProperty('--cell', cell + 'px');
            boardEl.style.width = size + 'px';
            boardEl.style.height = size + 'px';
            boardEl.style.marginRight = Math.round(cell * 0.9) + 'px';
            lotEl.style.left = f + 'px'; lotEl.style.top = f + 'px';
            lotEl.style.width = (6 * cell) + 'px'; lotEl.style.height = (6 * cell) + 'px';
            exitEl.style.left = (f + 6 * cell - 2) + 'px';
            exitEl.style.top = (f + EXIT_ROW * cell) + 'px';
            exitEl.style.width = (f + Math.round(cell * 0.9) + 2) + 'px';
            exitEl.style.height = cell + 'px';
            exitLbl.style.left = (f + 6 * cell + (f + cell * 0.9) / 2) + 'px';
            exitLbl.style.top = (f + EXIT_ROW * cell - cell * 0.36) + 'px';
            placeAll(true);
            if (ghostEl) placeGhost();
        }

        function vehRect(i, v) {
            var p = S.pieces[i], c = S.cell, g = Math.round(c * 0.07), f = S.frame;
            var r = p.h ? p.fix : v, col = p.h ? v : p.fix;
            return {
                left: f + col * c + g, top: f + r * c + g,
                w: (p.h ? p.len : 1) * c - 2 * g, h: (p.h ? 1 : p.len) * c - 2 * g
            };
        }
        function placeVeh(i, v, instant) {
            var e = vehEls[i], rc = vehRect(i, v);
            if (instant) e.style.transition = 'none';
            e.style.left = rc.left + 'px'; e.style.top = rc.top + 'px';
            e.style.width = rc.w + 'px'; e.style.height = rc.h + 'px';
            if (instant) { void e.offsetWidth; e.style.transition = ''; }
        }
        function placeAll(instant) { for (var i = 0; i < vehEls.length; i++) placeVeh(i, S.pos[i], instant); }

        // ── Création des véhicules ───────────────────────────────────────
        function buildVehicles() {
            vehEls.forEach(function (e) { e.remove(); });
            vehEls = [];
            clearHint();
            S.pieces.forEach(function (p, i) {
                var e = el('div', 'jrh-veh ' + (p.h ? 'h' : 'v') + (p.len === 3 ? ' t' : '') + (p.hero ? ' hero' : ''));
                e.style.setProperty('--c1', shade(p.color, 0.18));
                e.style.setProperty('--c2', p.color);
                e.style.setProperty('--c3', shade(p.color, -0.45));
                e.innerHTML = p.len === 3
                    ? '<div class="jrh-cargo"></div><div class="jrh-cab"></div><div class="jrh-lights"></div>'
                    : '<div class="jrh-roof"></div><div class="jrh-lights"></div>' + (p.hero ? '<div class="jrh-star">★</div>' : '');
                e.title = p.hero ? 'La voiture rouge : fais-la sortir !' : (p.len === 3 ? 'Camion' : 'Voiture');
                e.addEventListener('pointerdown', function (ev) { onDown(ev, i); });
                boardEl.appendChild(e);
                vehEls.push(e);
            });
            placeAll(true);
        }

        // ── Chargement d'un niveau ───────────────────────────────────────
        function loadLevel(idx, savedPos) {
            idx = Math.max(0, Math.min(LEVELS.length - 1, idx | 0));
            var L = parseLevel(LEVELS[idx][0]);
            S.level = idx;
            S.pieces = L.pieces;
            S.start = L.pos.slice();
            S.pos = (savedPos && savedPos.length === L.pos.length && validPos(L.pieces, savedPos)) ? savedPos.slice() : L.pos.slice();
            S.history = []; S.moves = 0; S.hints = 0; S.solutionSeen = false;
            S.sel = -1; S.won = false; S.busy = false;
            hideOv();
            buildVehicles();
            updateUI();
            setMsg('');
        }
        function validPos(pieces, pos) {
            var g = new Int8Array(36).fill(-1);
            for (var i = 0; i < pieces.length; i++) {
                var p = pieces[i], v = pos[i];
                if (typeof v !== 'number' || v < 0 || v + p.len > 6) return false;
                for (var k = 0; k < p.len; k++) {
                    var idx = p.h ? p.fix * 6 + v + k : (v + k) * 6 + p.fix;
                    if (g[idx] !== -1) return false;
                    g[idx] = i;
                }
            }
            return true;
        }

        function starsFor(moves, min, hints, sol) {
            if (sol) return 0;
            var s = moves <= min ? 3 : (moves <= min + Math.ceil(min * 0.5) ? 2 : 1);
            if (hints > 0) s = Math.min(s, 2);
            return s;
        }
        function starHTML(n) {
            var h = '';
            for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
            return h;
        }

        function updateUI() {
            var g = groupOf(S.level), min = LEVELS[S.level][1];
            var pill = $('.jrh-pill');
            pill.className = 'jrh-pill ' + g.cls; pill.textContent = g.name;
            $('.jrh-lvltxt').innerHTML = '<span class="jrh-lvlword">Niveau </span>' + (S.level + 1) + ' / ' + LEVELS.length;
            $('.jrh-v-moves').textContent = S.moves;
            $('.jrh-v-min').textContent = min;
            var best = prog.best[S.level];
            $('.jrh-v-best').textContent = best ? best : '–';
            $('.jrh-stars').innerHTML = starHTML(prog.stars[S.level] || 0);
            $('.jrh-undo').disabled = !S.history.length || S.won || S.busy;
            $('.jrh-reset').disabled = (!S.history.length && !S.won) || S.busy;
            $('.jrh-hint').disabled = S.won || S.busy;
            $('.jrh-sol').disabled = S.won || S.busy;
            $('.jrh-prev').disabled = S.level === 0 || S.busy;
            $('.jrh-next').disabled = S.level === LEVELS.length - 1 || S.busy;
            var sb = $('.jrh-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
            vehEls.forEach(function (e, i) { e.classList.toggle('jrh-sel', i === S.sel); });
        }
        function setMsg(t) { $('.jrh-msg').textContent = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // ── Jouer un coup ────────────────────────────────────────────────
        function commitMove(i, to, fromHistory) {
            if (S.pos[i] === to) return;
            S.history.push(S.pos.slice());
            if (S.history.length > 400) S.history.shift();
            S.pos[i] = to;
            S.moves++;
            clearHint();
            placeVeh(i, to);
            if (prog.sound) beep(i === 0 ? 520 : 380, 0.08, 'triangle', 0.06);
            updateUI();
            if (i === 0 && to === EXIT_POS) win();
            else save();
        }

        function undo() {
            if (!S.history.length || S.won || S.busy) return;
            S.pos = S.history.pop();
            S.moves = Math.max(0, S.moves - 1);
            clearHint();
            placeAll(false);
            if (prog.sound) beep(300, 0.06, 'sine', 0.05);
            updateUI(); save();
        }
        function reset() {
            if (S.busy) return;
            loadLevel(S.level);
            save();
        }

        // ── Glisser-déposer d'un véhicule ────────────────────────────────
        var drag = null;
        function onDown(ev, i) {
            if (S.won || S.busy) return;
            if (ev.button != null && ev.button > 0) return;
            ev.preventDefault();
            ev.stopPropagation();
            root.focus({ preventScroll: true });
            var range = rangeOf(S.pieces, S.pos, i);
            drag = {
                i: i, id: ev.pointerId, range: range, startV: S.pos[i],
                sx: ev.clientX, sy: ev.clientY, moved: false, cur: S.pos[i],
                scale: boardEl.getBoundingClientRect().width / boardEl.offsetWidth || 1
            };
            try { vehEls[i].setPointerCapture(ev.pointerId); } catch (e) {}
            vehEls[i].classList.add('jrh-drag');
        }
        function onMove(ev) {
            if (!drag || ev.pointerId !== drag.id) return;
            var p = S.pieces[drag.i];
            var d = (p.h ? ev.clientX - drag.sx : ev.clientY - drag.sy) / drag.scale;
            if (Math.abs(d) > 4) drag.moved = true;
            var v = drag.startV + d / S.cell;
            v = Math.max(drag.range[0], Math.min(drag.range[1], v));
            drag.cur = v;
            var rc = vehRect(drag.i, v);
            vehEls[drag.i].style.left = rc.left + 'px';
            vehEls[drag.i].style.top = rc.top + 'px';
        }
        function onUp(ev) {
            if (!drag || ev.pointerId !== drag.id) return;
            var i = drag.i, e = vehEls[i];
            e.classList.remove('jrh-drag');
            try { e.releasePointerCapture(drag.id); } catch (er) {}
            var to = Math.round(drag.cur);
            var moved = drag.moved;
            drag = null;
            if (!moved) {                        // simple clic : sélection (clavier)
                S.sel = S.sel === i ? -1 : i;
                placeVeh(i, S.pos[i]);
                updateUI();
                return;
            }
            S.sel = -1;
            if (to !== S.pos[i]) commitMove(i, to);
            else { placeVeh(i, S.pos[i]); updateUI(); }
        }
        root.addEventListener('pointermove', onMove);
        root.addEventListener('pointerup', onUp);
        root.addEventListener('pointercancel', onUp);

        // ── Clavier : flèches pour le véhicule sélectionné, Ctrl+Z ───────
        root.addEventListener('keydown', function (e) {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); e.stopPropagation(); return; }
            if (S.sel < 0 || S.won || S.busy) return;
            var p = S.pieces[S.sel], dir = 0;
            if (p.h && e.key === 'ArrowLeft') dir = -1;
            if (p.h && e.key === 'ArrowRight') dir = 1;
            if (!p.h && e.key === 'ArrowUp') dir = -1;
            if (!p.h && e.key === 'ArrowDown') dir = 1;
            if (e.key === 'Escape') { S.sel = -1; updateUI(); e.stopPropagation(); return; }
            if (!dir) return;
            e.preventDefault(); e.stopPropagation();
            var r = rangeOf(S.pieces, S.pos, S.sel), to = S.pos[S.sel] + dir;
            if (to < r[0] || to > r[1]) { if (prog.sound) beep(150, 0.08, 'square', 0.03); return; }
            var i = S.sel;
            commitMove(i, to);
            if (!S.won) { S.sel = i; updateUI(); }
        });

        // ── Indice : prochain coup de la solution optimale ───────────────
        function clearHint() {
            vehEls.forEach(function (e) { e.classList.remove('jrh-hintv'); });
            if (ghostEl) { ghostEl.remove(); ghostEl = null; }
        }
        var hintMove = null;
        function placeGhost() {
            if (!ghostEl || !hintMove) return;
            var rc = vehRect(hintMove.i, hintMove.to);
            ghostEl.style.left = rc.left + 'px'; ghostEl.style.top = rc.top + 'px';
            ghostEl.style.width = rc.w + 'px'; ghostEl.style.height = rc.h + 'px';
        }
        function hint() {
            if (S.won || S.busy) return;
            setMsg('Je réfléchis…');
            setTimeout(function () {
                var path = solve(S.pieces, S.pos);
                if (!path || !path.length) { setMsg('Aucun indice disponible.'); return; }
                S.hints++;
                clearHint();
                hintMove = path[0];
                vehEls[hintMove.i].classList.add('jrh-hintv');
                ghostEl = el('div', 'jrh-ghost');
                boardEl.appendChild(ghostEl);
                placeGhost();
                setMsg('💡 Déplace le véhicule qui clignote jusqu\'au cadre jaune. (Encore ' + path.length + ' coup' + (path.length > 1 ? 's' : '') + ' au mieux.)');
                if (prog.sound) beep(880, 0.12, 'sine', 0.05);
            }, 30);
        }

        // ── Solution animée ──────────────────────────────────────────────
        function playSolution() {
            if (S.won || S.busy) return;
            var path = solve(S.pieces, S.pos);
            if (!path) { setMsg('Solution introuvable.'); return; }
            S.busy = true; S.solutionSeen = true; S.sel = -1;
            clearHint(); updateUI();
            setMsg('🎬 Solution en ' + path.length + ' coup' + (path.length > 1 ? 's' : '') + '…');
            var k = 0;
            (function step() {
                if (!root.isConnected) return;
                if (k >= path.length) { S.busy = false; return; }
                var m = path[k++];
                S.busy = false;           // commitMove peut déclencher la victoire
                commitMove(m.i, m.to);
                if (!S.won) { S.busy = true; updateUI(); setTimeout(step, 650); }
            })();
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            S.won = true; S.sel = -1;
            clearHint(); updateUI();
            var min = LEVELS[S.level][1];
            var stars = starsFor(S.moves, min, S.hints, S.solutionSeen);
            if (!S.solutionSeen) {
                if (stars > (prog.stars[S.level] || 0)) prog.stars[S.level] = stars;
                if (!S.hints && (!prog.best[S.level] || S.moves < prog.best[S.level])) prog.best[S.level] = S.moves;
                saveProgress(prog);
            }
            // La voiture rouge file vers la sortie
            var car = vehEls[0];
            setTimeout(function () {
                car.classList.add('jrh-out');
                car.style.left = (S.frame + 8 * S.cell) + 'px';
            }, 180);
            if (prog.sound) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.25 + j * 0.11); });
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.jrh-win-title').textContent = S.solutionSeen ? 'Solution terminée' : (stars === 3 ? 'Parfait !' : 'Bravo !');
                var st = $('.jrh-win-stars');
                st.innerHTML = starHTML(stars);
                st.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt;
                if (S.solutionSeen) txt = 'Tu as regardé la solution : essaie maintenant de le faire seul !';
                else txt = 'Libérée en <b>' + S.moves + '</b> coup' + (S.moves > 1 ? 's' : '') + ' (minimum : ' + min + ')' +
                    (S.hints ? '<br>avec ' + S.hints + ' indice' + (S.hints > 1 ? 's' : '') : '') +
                    (stars === 3 ? '<br>🏆 Solution optimale !' : (S.moves > min ? '<br>Peux-tu le faire en ' + min + ' coups ?' : ''));
                $('.jrh-win-txt').innerHTML = txt;
                $('.jrh-w-next').style.display = S.level < LEVELS.length - 1 ? '' : 'none';
                showOv('.jrh-ov-win');
                if (stars >= 2 && !S.solutionSeen) confetti();
            }, 800);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#e11d2e', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jrh-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Fenêtres : niveaux / victoire / aide ─────────────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jrh-ov').forEach(function (o) { o.classList.remove('show'); }); }
        function openLevels() {
            var html = '';
            GROUPS.forEach(function (g) {
                var done = 0;
                for (var j = g.from; j <= g.to; j++) if (prog.stars[j]) done++;
                html += '<div class="jrh-lv-grp"><span class="jrh-pill ' + g.cls + '">' + g.name + '</span> ' +
                        '<small style="color:#567;font-weight:700;">' + done + ' / ' + (g.to - g.from + 1) + ' réussis</small>' +
                        '<div class="jrh-lv-grid">';
                for (var i = g.from; i <= g.to; i++) {
                    var s = prog.stars[i] || 0;
                    html += '<button class="jrh-lv' + (i === S.level ? ' cur' : '') + '" data-lv="' + i + '" title="' +
                            LEVELS[i][1] + ' coups minimum">' + (i + 1) + '<small>' + (s ? '★★★'.slice(0, s) : '') + '</small></button>';
                }
                html += '</div></div>';
            });
            $('.jrh-lv-list').innerHTML = html;
            showOv('.jrh-ov-levels');
        }
        root.addEventListener('click', function (e) {
            var lv = e.target.closest('.jrh-lv');
            if (lv) { loadLevel(+lv.dataset.lv); save(); return; }
            if (e.target.closest('.jrh-x')) { hideOv(); return; }
            if (e.target.classList.contains('jrh-ov') && !$('.jrh-ov-win').classList.contains('show')) hideOv();
        });

        $('.jrh-lvlbtn').addEventListener('click', openLevels);
        $('.jrh-undo').addEventListener('click', undo);
        $('.jrh-reset').addEventListener('click', reset);
        $('.jrh-hint').addEventListener('click', hint);
        $('.jrh-sol').addEventListener('click', playSolution);
        $('.jrh-prev').addEventListener('click', function () { if (S.level > 0) { loadLevel(S.level - 1); save(); } });
        $('.jrh-next').addEventListener('click', function () { if (S.level < LEVELS.length - 1) { loadLevel(S.level + 1); save(); } });
        $('.jrh-w-replay').addEventListener('click', function () { loadLevel(S.level); save(); });
        $('.jrh-w-levels').addEventListener('click', openLevels);
        $('.jrh-w-next').addEventListener('click', function () { loadLevel(S.level + 1); save(); });
        $('.jrh-help').addEventListener('click', function () { showOv('.jrh-ov-help'); });
        $('.jrh-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv();
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '🚗 Rush Hour', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jrh-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jrhZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jrhZ || '';
            applySize();
            requestAnimationFrame(layout);
            save();
        });
        $('.wf-btn-close').addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (e) {} }
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            widget.remove();
            save();
        });

        // ── Redimensionnement par la poignée ─────────────────────────────
        var grip = $('.jrh-grip'), rs = null;
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
        widget._jrhGetData = function () {
            return {
                level: S.level,
                pos: S.won ? null : S.pos.slice(),
                moves: S.won ? 0 : S.moves,
                hints: S.won ? 0 : S.hints,
                w: S.w, h: S.h,
                fullboard: S.fullboard
            };
        };

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('jrh-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        var startLevel = (typeof data.level === 'number') ? data.level : firstUnsolved();
        loadLevel(startLevel, data.pos);
        if (data.pos && typeof data.moves === 'number') { S.moves = data.moves; S.hints = data.hints || 0; updateUI(); }
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        function firstUnsolved() {
            for (var i = 0; i < LEVELS.length; i++) if (!prog.stars[i]) return i;
            return 0;
        }
    }

    // =====================================================================
    // Création : depuis le panneau Jeux (createWidget) ou à la restauration
    // =====================================================================
    window.createJeuRushHourWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        // Le crochet de createWidget (ci-dessous) lit ces données de façon synchrone
        window._jrhNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jrhNextPendingData = null;
        }
        if (w && !w._jrhInit) initRushHour(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-rush-hour') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jrhHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jrhInit) {
                var pending = window._jrhNextPendingData || null;
                initRushHour(w, pending);
            }
            return w;
        };
        wrapped._jrhHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests / le débogage
    window._jrhLevels = LEVELS;
    window._jrhSolve = function (str) { var L = parseLevel(str); return solve(L.pieces, L.pos); };
})();
