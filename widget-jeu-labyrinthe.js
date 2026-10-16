// =========================================================================
// WIDGET JEU : LABYRINTHE — guider l'animal jusqu'à son trésor
// -------------------------------------------------------------------------
// • 40 labyrinthes en 4 difficultés (Débutant → Expert), du 6×6 au 22×22.
//   Ils sont générés à partir d'une graine fixe : le niveau 12 est toujours
//   le même labyrinthe, pour toute la classe.
// • Le « minimum » affiché est le nombre exact de pas du plus court chemin.
// • Se déplacer : tracer le chemin au doigt / stylet / souris depuis le
//   personnage, balayer le plateau (glisse jusqu'au prochain carrefour),
//   flèches du clavier (Maj + flèche = glisser), ou la croix directionnelle.
// • Annuler, recommencer, indice (les prochains pas), solution animée,
//   mode brouillard, choix du personnage.
// • Progression (étoiles, records) mémorisée dans le navigateur.
// • Sauvegarde du tableau : niveau, chemin parcouru, temps, options, taille
//   (via _jlabGetData / createJeuLabyrintheWidget(data), cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-labyrinthe';
    var STORE_KEY = 'jlab-progress-v1';
    var DEF_W = 780, DEF_H = 580, MIN_W = 340, MIN_H = 380;
    var NB_LEVELS = 40;

    // Directions : [décalage ligne, décalage colonne, bit, bit opposé]
    var DIRS = { N: [-1, 0, 1, 4], E: [0, 1, 2, 8], S: [1, 0, 4, 1], W: [0, -1, 8, 2] };
    var DLIST = ['N', 'E', 'S', 'W'];

    var GROUPS = [
        { name: 'Débutant',      cls: 'g1', from: 0,  to: 9,  loops: 0    },
        { name: 'Intermédiaire', cls: 'g2', from: 10, to: 19, loops: 0.01  },
        { name: 'Avancé',        cls: 'g3', from: 20, to: 29, loops: 0.015 },
        { name: 'Expert',        cls: 'g4', from: 30, to: 39, loops: 0.02  }
    ];
    function groupOf(idx) {
        for (var i = 0; i < GROUPS.length; i++) if (idx >= GROUPS[i].from && idx <= GROUPS[i].to) return GROUPS[i];
        return GROUPS[0];
    }

    // Personnages (et leur trésor)
    var AVATARS = [
        { a: '🐭', g: '🧀', n: 'la souris',  t: 'son fromage' },
        { a: '🐱', g: '🐟', n: 'le chat',    t: 'son poisson' },
        { a: '🐶', g: '🦴', n: 'le chien',   t: 'son os' },
        { a: '🐰', g: '🥕', n: 'le lapin',   t: 'sa carotte' },
        { a: '🐼', g: '🎋', n: 'le panda',   t: 'son bambou' },
        { a: '🐝', g: '🌻', n: "l'abeille",  t: 'sa fleur' }
    ];

    // ── Génération déterministe des labyrinthes ─────────────────────────
    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            var t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function levelSize(i) { return 6 + Math.round(i * 16 / (NB_LEVELS - 1)); }

    // Algorithme du « retour sur trace » (labyrinthe parfait),
    // puis quelques murs retirés aux niveaux élevés pour créer plusieurs chemins.
    function genMaze(N, seed, loopRate) {
        var rnd = mulberry32(seed);
        var cells = new Uint8Array(N * N), seen = new Uint8Array(N * N);
        var stack = [0]; seen[0] = 1;
        while (stack.length) {
            var cur = stack[stack.length - 1], r = Math.floor(cur / N), c = cur % N, opts = [];
            for (var k = 0; k < 4; k++) {
                var d = DIRS[DLIST[k]], nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < N && nc >= 0 && nc < N && !seen[nr * N + nc]) opts.push(k);
            }
            if (!opts.length) { stack.pop(); continue; }
            var dk = DIRS[DLIST[opts[Math.floor(rnd() * opts.length)]]];
            var nx = (r + dk[0]) * N + (c + dk[1]);
            cells[cur] |= dk[2]; cells[nx] |= dk[3];
            seen[nx] = 1; stack.push(nx);
        }
        var loops = Math.round(N * N * loopRate), guard = 0;
        while (loops > 0 && guard++ < 5000) {
            var idx = Math.floor(rnd() * N * N), rr = Math.floor(idx / N), cc = idx % N;
            var dd = DIRS[DLIST[Math.floor(rnd() * 4)]], r2 = rr + dd[0], c2 = cc + dd[1];
            if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N || (cells[idx] & dd[2])) continue;
            cells[idx] |= dd[2]; cells[r2 * N + c2] |= dd[3]; loops--;
        }
        return cells;
    }

    var _cache = {};
    function getLevel(i) {
        if (_cache[i]) return _cache[i];
        // Parmi quelques graines, on garde le labyrinthe dont le plus court
        // chemin est le plus proche de la longueur visée : la difficulté
        // augmente ainsi régulièrement d'un niveau à l'autre.
        var N = levelSize(i), g = groupOf(i);
        var target = Math.round(N * N * 0.42), best = null;
        for (var k = 0; k < 24; k++) {
            var L = { N: N, cells: genMaze(N, 12345 + i * 9973 + k * 7919, g.loops), start: 0, exit: N * N - 1 };
            L.min = shortest(L, L.start).length - 1;
            if (!best || Math.abs(L.min - target) < Math.abs(best.min - target)) best = L;
        }
        _cache[i] = best;
        return best;
    }

    // Plus court chemin (parcours en largeur) : liste des cases de `from` à la sortie
    function shortest(L, from) {
        var N = L.N, prev = new Int32Array(N * N).fill(-1), q = [from];
        prev[from] = from;
        for (var h = 0; h < q.length; h++) {
            var cur = q[h];
            if (cur === L.exit) break;
            var r = Math.floor(cur / N), c = cur % N;
            for (var k = 0; k < 4; k++) {
                var d = DIRS[DLIST[k]];
                if (!(L.cells[cur] & d[2])) continue;
                var nx = (r + d[0]) * N + (c + d[1]);
                if (prev[nx] !== -1) continue;
                prev[nx] = cur; q.push(nx);
            }
        }
        var path = [], j = L.exit;
        if (prev[j] === -1) return [from];
        while (j !== from) { path.unshift(j); j = prev[j]; }
        path.unshift(from);
        return path;
    }
    function openings(L, idx) {
        var n = 0, v = L.cells[idx];
        for (var k = 0; k < 4; k++) if (v & DIRS[DLIST[k]][2]) n++;
        return n;
    }

    // ── Progression (étoiles, records, son, personnage) ─────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, bestTime: p.bestTime || {},
                     sound: p.sound !== false, avatar: p.avatar | 0 };
        } catch (e) { return { stars: {}, best: {}, bestTime: {}, sound: true, avatar: 0 }; }
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
        if (document.getElementById('jlab-style')) return;
        var s = document.createElement('style');
        s.id = 'jlab-style';
        s.textContent = [
'.jlab-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#2fae8a 0%,#1d8a6c 45%,#0f5e4a 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jlab-root *{box-sizing:border-box}',
'.jlab-root.jlab-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jlab-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête (zone de déplacement du widget)
'.jlab-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;',
'  background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0));}',
'.jlab-title{font-weight:900;font-size:calc(22px*var(--ui));letter-spacing:.5px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jlab-title b{color:#ffd23f}',
'.jlab-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}',
'.jlab-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jlab-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px}',
'.jlab-pill.g1{background:#22c55e;color:#06321a}.jlab-pill.g2{background:#38bdf8;color:#062a3a}',
'.jlab-pill.g3{background:#fb923c;color:#3b1702}.jlab-pill.g4{background:#f43f5e;color:#fff}',
'.jlab-spacer{flex:1}',
'.jlab-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0;padding:0}',
'.jlab-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jlab-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jlab-root.jlab-tall .jlab-body{flex-direction:column}',
'.jlab-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative;touch-action:none}',
'.jlab-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(236px*var(--ui))}',
'.jlab-root.jlab-tall .jlab-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center}',
'.jlab-stats{display:flex;gap:5px}',
'.jlab-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 2px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(50px*var(--ui))}',
'.jlab-stat small{display:block;font-size:calc(9px*var(--ui));font-weight:900;letter-spacing:.6px;opacity:.8;text-transform:uppercase}',
'.jlab-stat span{display:block;font-size:calc(20px*var(--ui));font-weight:900;line-height:1.15}',
'.jlab-stat.jlab-st-moves span{color:#ffd23f}',
'.jlab-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jlab-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jlab-stars .off{color:rgba(255,255,255,.25)}',
'.jlab-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jlab-root.jlab-tall .jlab-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jlab-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#0b3b2e;background:#e9fff6;box-shadow:0 3px 0 #9fd8c2;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jlab-btn:hover{filter:brightness(1.05)}.jlab-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #9fd8c2}',
'.jlab-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jlab-btn.jlab-hint{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jlab-btn.jlab-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jlab-btn.jlab-fog.on{background:#334155;box-shadow:0 3px 0 #0f172a;color:#fff}',
'.jlab-btn.jlab-wide{grid-column:1 / -1}',
// Croix directionnelle
'.jlab-pad{display:grid;grid-template-columns:repeat(3,calc(38px*var(--ui)));grid-template-rows:repeat(3,calc(34px*var(--ui)));gap:3px;justify-content:center}',
'.jlab-pad button{border:none;cursor:pointer;border-radius:10px;background:rgba(0,0,0,.28);color:#fff;font-size:calc(16px*var(--ui));',
'  box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);touch-action:none;padding:0;font-family:inherit}',
'.jlab-pad button:active,.jlab-pad button.press{background:#ffd23f;color:#3a2a00}',
'.jlab-pad .u{grid-column:2;grid-row:1}.jlab-pad .l{grid-column:1;grid-row:2}.jlab-pad .r{grid-column:3;grid-row:2}.jlab-pad .d{grid-column:2;grid-row:3}',
'.jlab-pad .mid{grid-column:2;grid-row:2;display:flex;align-items:center;justify-content:center;font-size:calc(18px*var(--ui));opacity:.9}',
'.jlab-goal{font-size:calc(12px*var(--ui));opacity:.9;text-align:center;line-height:1.3}',
'.jlab-goal b{color:#ffe48a}',
'.jlab-msg{min-height:1.3em;font-size:calc(12px*var(--ui));text-align:center;font-weight:700;color:#ffe48a}',
// Plateau
'.jlab-board{position:relative;flex-shrink:0;border-radius:14px;',
'  background:linear-gradient(145deg,#3c4a52,#1f2a30);box-shadow:0 8px 22px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.08)}',
'.jlab-canvas{position:absolute;display:block;border-radius:6px;cursor:pointer;touch-action:none}',
'.jlab-exit{position:absolute;display:flex;align-items:center;justify-content:center;gap:1px;color:#ffd23f;font-weight:900;pointer-events:none}',
'.jlab-exit span{line-height:1;animation:jlabArrow 1.2s infinite;opacity:.35}',
'.jlab-exit span:nth-child(2){animation-delay:.2s}.jlab-exit span:nth-child(3){animation-delay:.4s}',
'@keyframes jlabArrow{0%,100%{opacity:.25}50%{opacity:1}}',
'.jlab-lbl{position:absolute;font-weight:900;letter-spacing:1px;color:#ffd23f;background:rgba(0,0,0,.35);border-radius:6px;',
'  padding:1px 6px;white-space:nowrap;transform:translate(-50%,-100%);pointer-events:none;font-size:11px}',
'.jlab-lbl.start{color:#bbf7d0}',
// Fenêtres superposées (niveaux, victoire, aide)
'.jlab-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(6,40,31,.78);backdrop-filter:blur(3px);padding:14px}',
'.jlab-ov.show{display:flex}',
'.jlab-card{background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jlab-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#0f5e4a}',
'.jlab-lv-grp{margin:8px 0 2px;text-align:left}',
'.jlab-lv-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin-top:4px}',
'.jlab-lv{border:none;cursor:pointer;border-radius:10px;padding:5px 2px 3px;font-weight:900;font-size:calc(15px*var(--ui));min-width:calc(40px*var(--ui));',
'  background:#eef6f3;color:#0f5e4a;box-shadow:0 2px 0 #c8ddd5;line-height:1.1;font-family:inherit}',
'.jlab-lv small{display:block;font-size:calc(9px*var(--ui));letter-spacing:1px;color:#f4b400;min-height:1.1em}',
'.jlab-lv.cur{background:#0f5e4a;color:#fff;box-shadow:0 2px 0 #062a20}',
'.jlab-lv:hover{filter:brightness(.96)}',
'.jlab-av-grid{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:6px 0 2px}',
'.jlab-av{border:none;cursor:pointer;border-radius:14px;background:#eef6f3;box-shadow:0 2px 0 #c8ddd5;font-size:calc(28px*var(--ui));padding:6px 10px;line-height:1.1}',
'.jlab-av small{display:block;font-size:calc(16px*var(--ui))}',
'.jlab-av.cur{background:#ffd23f;box-shadow:0 2px 0 #c99a00}',
'.jlab-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jlab-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jlabPop .5s backwards}',
'.jlab-win-stars .off{color:#d7e3df}',
'@keyframes jlabPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jlab-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 12px;color:#345}',
'.jlab-win-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
'.jlab-card .jlab-btn{box-shadow:0 3px 0 #b7d6cb;background:#eef6f3}',
'.jlab-card .jlab-btn.jlab-next{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jlab-x{position:absolute;top:10px;right:10px}',
'.jlab-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jlabFall linear forwards;z-index:21}',
'@keyframes jlabFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jlab-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jlab-grip:hover{opacity:1}',
// Format étroit : en-tête compacte
'.jlab-root.jlab-narrow .jlab-head{gap:6px;padding:8px 8px 6px 10px}',
'.jlab-root.jlab-narrow .jlab-title .jlab-tt{display:none}',
'.jlab-root.jlab-narrow .jlab-lvlword{display:none}',
'.jlab-root.jlab-narrow .jlab-icon{width:24px;height:24px;font-size:12px}',
'.jlab-root.jlab-narrow .jlab-help{display:none}',
'.jlab-root.jlab-tall .jlab-goal{display:none}',
'.jlab-root.jlab-fullboard .jlab-grip,.widget.phone-fs .jlab-grip{display:none}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .jlab-root.jlab-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
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

    // ── Flèches du clavier : écoute globale ──────────────────────────────
    // Les flèches doivent piloter le personnage même quand le jeu n'a pas le
    // focus clavier (après un clic ailleurs, un widget juste créé…), et ne pas
    // déplacer en même temps le widget sélectionné sur le tableau.
    // Le labyrinthe visé : le dernier touché, ou le seul visible à l'écran.
    var _jlabInstances = [], _jlabActive = null;
    function _jlabVisible(inst) {
        return inst.root.isConnected && inst.root.offsetParent !== null && inst.root.style.display !== 'none';
    }
    function _jlabTarget() {
        _jlabInstances = _jlabInstances.filter(function (i) { return i.root.isConnected; });
        if (_jlabActive && _jlabVisible(_jlabActive)) return _jlabActive;
        var vis = _jlabInstances.filter(_jlabVisible);
        return vis.length === 1 ? vis[0] : null;
    }
    var ARROWS = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' };
    function _jlabGlobalKey(e) {
        var dk = ARROWS[e.key];
        if (!dk || e.ctrlKey || e.metaKey || e.altKey) return;
        // Ne pas voler les flèches pendant une saisie de texte
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        var inst = _jlabTarget();
        if (!inst) return;
        // Focus dans un autre widget du tableau : on le laisse tranquille
        var other = t && t.closest && t.closest('.widget');
        if (other && other !== inst.widget) return;
        if (!inst.handleArrow(dk, e.shiftKey)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
    }
    window.addEventListener('keydown', _jlabGlobalKey, true);
    // Un clic dans un autre widget rend la main au tableau ; un clic dans le
    // labyrinthe le rend actif.
    window.addEventListener('pointerdown', function (e) {
        var w = e.target && e.target.closest && e.target.closest('.widget');
        if (!w) return;
        var hit = null;
        _jlabInstances.forEach(function (i) { if (i.widget === w) hit = i; });
        _jlabActive = hit;
    }, true);

    var EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initLabyrinthe(widget, data) {
        if (!widget || widget._jlabInit) return;
        widget._jlabInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            level: 0, L: null, path: [0], hints: 0, solutionSeen: false,
            won: false, busy: false, cell: 20, frame: 10,
            elapsed: 0, t0: 0, fog: false,
            w: DEF_W, h: DEF_H, fullboard: false,
            disp: { r: 0, c: 0 }, hint: null
        };
        if (prog.avatar < 0 || prog.avatar >= AVATARS.length) prog.avatar = 0;

        // Fond transparent : seul le cadre arrondi du jeu est visible
        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jlab-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jlab-head">' +
                '<div class="jlab-title">🌀<span class="jlab-tt"> Laby<b>rinthe</b></span></div>' +
                '<button class="jlab-lvlbtn" title="Choisir un niveau"><span class="jlab-pill"></span><span class="jlab-lvltxt"></span> ▾</button>' +
                '<div class="jlab-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jlab-icon jlab-avbtn" title="Choisir le personnage"></button>' +
                    '<button class="jlab-icon jlab-sound" title="Son"></button>' +
                    '<button class="jlab-icon jlab-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jlab-body">' +
                '<div class="jlab-stage"><div class="jlab-board">' +
                    '<canvas class="jlab-canvas"></canvas>' +
                    '<div class="jlab-exit"><span>›</span><span>›</span><span>›</span></div>' +
                    '<div class="jlab-lbl start">DÉPART</div><div class="jlab-lbl end">ARRIVÉE</div>' +
                '</div></div>' +
                '<div class="jlab-side">' +
                    '<div class="jlab-stats">' +
                        '<div class="jlab-stat jlab-st-moves"><small>Pas</small><span class="jlab-v-moves">0</span></div>' +
                        '<div class="jlab-stat"><small>Minimum</small><span class="jlab-v-min">0</span></div>' +
                        '<div class="jlab-stat"><small>Record</small><span class="jlab-v-best">–</span></div>' +
                        '<div class="jlab-stat"><small>Temps</small><span class="jlab-v-time">0:00</span></div>' +
                    '</div>' +
                    '<div class="jlab-stars"></div>' +
                    '<div class="jlab-btns">' +
                        '<button class="jlab-btn jlab-undo" title="Revenir d\'un pas (Ctrl+Z)">↶ Annuler</button>' +
                        '<button class="jlab-btn jlab-reset" title="Recommencer le labyrinthe">↺ Recommencer</button>' +
                        '<button class="jlab-btn jlab-hint" title="Montrer les prochains pas">💡 Indice</button>' +
                        '<button class="jlab-btn jlab-sol" title="Regarder la solution">🎬 Solution</button>' +
                        '<button class="jlab-btn jlab-prev" title="Niveau précédent">◀ Préc.</button>' +
                        '<button class="jlab-btn jlab-next" title="Niveau suivant">Suiv. ▶</button>' +
                        '<button class="jlab-btn jlab-fog jlab-wide" title="Ne voir que les alentours du personnage">🌫️ Brouillard</button>' +
                    '</div>' +
                    '<div class="jlab-pad">' +
                        '<button class="u" data-d="N" title="Haut">▲</button><button class="l" data-d="W" title="Gauche">◀</button>' +
                        '<div class="mid"></div>' +
                        '<button class="r" data-d="E" title="Droite">▶</button><button class="d" data-d="S" title="Bas">▼</button>' +
                    '</div>' +
                    '<div class="jlab-goal"></div>' +
                    '<div class="jlab-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jlab-ov jlab-ov-levels"><div class="jlab-card" style="position:relative;"><button class="jlab-icon jlab-x" style="background:#0f5e4a;">✕</button><h3>Choisis un labyrinthe</h3><div class="jlab-lv-list"></div></div></div>' +
            '<div class="jlab-ov jlab-ov-avatar"><div class="jlab-card" style="position:relative;"><button class="jlab-icon jlab-x" style="background:#0f5e4a;">✕</button><h3>Choisis ton personnage</h3><div class="jlab-av-grid"></div></div></div>' +
            '<div class="jlab-ov jlab-ov-win"><div class="jlab-card"><h3 class="jlab-win-title">Bravo !</h3><div class="jlab-win-stars"></div><div class="jlab-win-txt"></div>' +
                '<div class="jlab-win-btns"><button class="jlab-btn jlab-w-replay">↺ Rejouer</button><button class="jlab-btn jlab-w-levels">☰ Niveaux</button><button class="jlab-btn jlab-next jlab-w-next">Niveau suivant ▶</button></div></div></div>' +
            '<div class="jlab-ov jlab-ov-help"><div class="jlab-card" style="max-width:460px;position:relative;text-align:left;"><button class="jlab-icon jlab-x" style="background:#0f5e4a;">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> guider le personnage du <b>départ</b> (en haut à gauche) jusqu\'à son <b>trésor</b>, à l\'arrivée (en bas à droite).</p>' +
                '<p style="margin:6px 0;">✍️ <b>Trace le chemin</b> au doigt, au stylet ou à la souris en partant du personnage.</p>' +
                '<p style="margin:6px 0;">👆 <b>Balaye</b> le plateau dans une direction : le personnage glisse jusqu\'au prochain carrefour.</p>' +
                '<p style="margin:6px 0;">⌨️ <b>Flèches</b> du clavier (Maj + flèche pour glisser, reste appuyé pour avancer) ou la <b>croix</b> à droite (reste appuyé pour avancer).</p>' +
                '<p style="margin:6px 0;">⭐ Chaque case parcourue compte pour un <b>pas</b>. Atteins le minimum pour gagner 3 étoiles (2 au maximum si tu as utilisé un indice).</p>' +
                '<p style="margin:6px 0;">🌫️ <b>Brouillard :</b> tu ne vois que ce qui est autour de toi. Un vrai défi !</p></div></div>' +
            '<div class="jlab-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var stage = $('.jlab-stage'), boardEl = $('.jlab-board'), canvas = $('.jlab-canvas'), ctx = canvas.getContext('2d');
        var exitEl = $('.jlab-exit'), lblStart = $('.jlab-lbl.start'), lblEnd = $('.jlab-lbl.end');

        // ── Isoler les interactions du jeu du déplacement du widget ─────
        // L'en-tête reste une zone de prise pour déplacer le widget.
        function isolate(e) {
            if (e.target.closest('.jlab-head') && !e.target.closest('button')) return;
            e.stopPropagation();
            if (e.type === 'pointerdown' || e.type === 'mousedown') {
                if (typeof bringToFront === 'function') { try { bringToFront(widget); } catch (er) {} }
            }
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.jlab-head button').forEach(function (b) {
            ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
                b.addEventListener(t, function (e) { e.stopPropagation(); }, t === 'touchstart' ? { passive: true } : false);
            });
        });

        function cur() { return S.path[S.path.length - 1]; }
        function rc(idx) { return { r: Math.floor(idx / S.L.N), c: idx % S.L.N }; }

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
            if (!W || !H || !S.L) return;
            var ui = Math.max(0.75, Math.min(1.6, Math.min(W / DEF_W, H / DEF_H) * 1.05));
            root.style.setProperty('--ui', ui.toFixed(3));
            root.classList.toggle('jlab-narrow', W < 600);
            root.classList.toggle('jlab-tall', W < H * 1.15);
            var sw = stage.clientWidth, sh = stage.clientHeight;
            var exitW = Math.max(16, Math.round(Math.min(sw, sh) * 0.06));
            var avail = Math.min(sw - exitW - 4, sh - 40);
            var f = Math.max(6, Math.round(avail * 0.03));
            var N = S.L.N;
            var cell = Math.max(6, Math.floor((avail - 2 * f) / N));
            S.cell = cell; S.frame = f;
            var inner = N * cell, size = inner + 2 * f;
            boardEl.style.width = size + 'px'; boardEl.style.height = size + 'px';
            boardEl.style.marginRight = exitW + 'px';
            boardEl.style.marginTop = '14px';
            var dpr = Math.min(3, window.devicePixelRatio || 1);
            canvas.style.left = f + 'px'; canvas.style.top = f + 'px';
            canvas.style.width = inner + 'px'; canvas.style.height = inner + 'px';
            canvas.width = Math.round(inner * dpr); canvas.height = Math.round(inner * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            exitEl.style.left = (f + inner) + 'px';
            exitEl.style.top = (f + (N - 1) * cell) + 'px';
            exitEl.style.width = (f + exitW) + 'px';
            exitEl.style.height = cell + 'px';
            exitEl.style.fontSize = Math.max(10, Math.min(cell * 0.8, exitW * 0.6)) + 'px';
            var fs = Math.max(9, Math.min(13, Math.round(11 * ui)));
            lblStart.style.fontSize = fs + 'px'; lblEnd.style.fontSize = fs + 'px';
            lblStart.style.left = (f + cell / 2 + 18) + 'px'; lblStart.style.top = '-2px';
            lblEnd.style.left = (f + inner - cell / 2 - 10) + 'px'; lblEnd.style.top = 'auto';
            lblEnd.style.bottom = (-fs - 8) + 'px'; lblEnd.style.transform = 'translate(-50%,0)';
            draw();
        }

        // ── Dessin du labyrinthe (canvas) ────────────────────────────────
        function cx(c) { return (c + 0.5) * S.cell; }
        function draw() {
            var L = S.L; if (!L) return;
            var N = L.N, c = S.cell, inner = N * c;
            var wall = Math.max(2, Math.round(c * 0.2));
            var h = wall / 2;
            // Haies
            var hedge = ctx.createLinearGradient(0, 0, inner, inner);
            hedge.addColorStop(0, '#166534'); hedge.addColorStop(1, '#0b3d22');
            ctx.fillStyle = hedge;
            ctx.fillRect(0, 0, inner, inner);
            // Allées (sable)
            ctx.fillStyle = '#f3e3bf';
            for (var i = 0; i < N * N; i++) {
                var r = Math.floor(i / N), col = i % N, x = col * c, y = r * c, v = L.cells[i];
                ctx.fillRect(x + h, y + h, c - wall, c - wall);
                if (v & 2) ctx.fillRect(x + c - h - 0.5, y + h, wall + 1, c - wall);   // vers l'est
                if (v & 4) ctx.fillRect(x + h, y + c - h - 0.5, c - wall, wall + 1);   // vers le sud
            }
            // Ouverture de la sortie
            ctx.fillRect((N - 1) * c + h, (N - 1) * c + h, c, c - wall);
            // Petit relief des haies
            if (c >= 14) {
                ctx.fillStyle = 'rgba(255,255,255,.07)';
                for (var j = 0; j < N * N; j += 1) {
                    var rr = Math.floor(j / N), cc = j % N;
                    if (!(L.cells[j] & 2) && cc < N - 1) ctx.fillRect((cc + 1) * c - h, rr * c, Math.max(1, wall * 0.35), c);
                }
            }
            // Case de départ
            ctx.fillStyle = 'rgba(34,197,94,.30)';
            ctx.fillRect(h, h, c - wall, c - wall);

            // Cases déjà visitées (faible) et chemin effectif (sans les retours en arrière)
            var visited = {};
            S.path.forEach(function (p) { visited[p] = 1; });
            ctx.fillStyle = 'rgba(56,189,248,.16)';
            Object.keys(visited).forEach(function (k) {
                var p = rc(+k);
                ctx.fillRect(p.c * c + h, p.r * c + h, c - wall, c - wall);
            });
            var eff = effectivePath();
            if (eff.length > 1) {
                ctx.strokeStyle = 'rgba(14,116,144,.75)';
                ctx.lineWidth = Math.max(2, c * 0.22);
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath();
                eff.forEach(function (p, k) {
                    var q = rc(p);
                    if (k === 0) ctx.moveTo(cx(q.c), cx(q.r)); else ctx.lineTo(cx(q.c), cx(q.r));
                });
                ctx.lineTo(cx(S.disp.c), cx(S.disp.r));
                ctx.stroke();
            }
            // Indice : les prochains pas en pointillés jaunes
            if (S.hint && S.hint.length > 1) {
                ctx.save();
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = Math.max(2, c * 0.18);
                ctx.setLineDash([Math.max(3, c * 0.25), Math.max(3, c * 0.22)]);
                ctx.lineCap = 'round';
                ctx.beginPath();
                S.hint.forEach(function (p, k) {
                    var q = rc(p);
                    if (k === 0) ctx.moveTo(cx(q.c), cx(q.r)); else ctx.lineTo(cx(q.c), cx(q.r));
                });
                ctx.stroke();
                var last = rc(S.hint[S.hint.length - 1]);
                ctx.setLineDash([]);
                ctx.fillStyle = '#facc15';
                ctx.beginPath(); ctx.arc(cx(last.c), cx(last.r), Math.max(3, c * 0.18), 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            // Trésor à l'arrivée
            var av = AVATARS[prog.avatar];
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            if (!S.won) {
                ctx.font = Math.round(c * 0.7) + 'px ' + EMOJI_FONT;
                ctx.fillText(av.g, cx(N - 1), cx(N - 1) + c * 0.04);
            }
            // Personnage
            var pr = Math.max(3, c * 0.42);
            ctx.fillStyle = 'rgba(0,0,0,.18)';
            ctx.beginPath(); ctx.ellipse(cx(S.disp.c), cx(S.disp.r) + c * 0.3, pr * 0.75, pr * 0.25, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = Math.round(c * 0.8) + 'px ' + EMOJI_FONT;
            ctx.fillText(av.a, cx(S.disp.c), cx(S.disp.r) + c * 0.04);

            // Brouillard
            if (S.fog && !S.won) {
                var R = Math.max(c * 3.2, 64);
                var gr = ctx.createRadialGradient(cx(S.disp.c), cx(S.disp.r), 0, cx(S.disp.c), cx(S.disp.r), R);
                gr.addColorStop(0, 'rgba(8,24,18,0)');
                gr.addColorStop(0.55, 'rgba(8,24,18,0)');
                gr.addColorStop(1, 'rgba(8,24,18,.96)');
                ctx.fillStyle = gr;
                ctx.fillRect(0, 0, inner, inner);
                // L'arrivée reste signalée par une petite lueur
                var ex = cx(N - 1), ey = cx(N - 1);
                var g2 = ctx.createRadialGradient(ex, ey, 0, ex, ey, c * 0.7);
                g2.addColorStop(0, 'rgba(255,210,63,.8)'); g2.addColorStop(1, 'rgba(255,210,63,0)');
                ctx.fillStyle = g2;
                ctx.fillRect(ex - c, ey - c, 2 * c, 2 * c);
            }
        }
        // Chemin sans les boucles (quand on revient sur une case, on coupe)
        function effectivePath() {
            var out = [], at = {};
            S.path.forEach(function (p) {
                if (at[p] !== undefined) {
                    var k = at[p];
                    for (var j = k + 1; j < out.length; j++) delete at[out[j]];
                    out.length = k + 1;
                } else { at[p] = out.length; out.push(p); }
            });
            return out;
        }

        // ── Animation du personnage ──────────────────────────────────────
        var animRaf = 0;
        function animate() {
            if (animRaf) return;
            var step = function () {
                animRaf = 0;
                if (!root.isConnected || !S.L) return;
                var t = S.won && S.exiting ? { r: S.L.N - 1, c: S.L.N + 0.6 } : rc(cur());
                var dr = t.r - S.disp.r, dc = t.c - S.disp.c;
                var k = 0.38;
                if (Math.abs(dr) < 0.01 && Math.abs(dc) < 0.01) { S.disp.r = t.r; S.disp.c = t.c; draw(); return; }
                S.disp.r += dr * k; S.disp.c += dc * k;
                draw();
                animRaf = requestAnimationFrame(step);
            };
            animRaf = requestAnimationFrame(step);
        }
        function snap() { var p = rc(cur()); S.disp.r = p.r; S.disp.c = p.c; }

        // ── Chargement d'un niveau ───────────────────────────────────────
        function loadLevel(idx, saved) {
            idx = Math.max(0, Math.min(NB_LEVELS - 1, idx | 0));
            S.level = idx;
            S.L = getLevel(idx);
            S.path = [S.L.start];
            S.hints = 0; S.solutionSeen = false; S.won = false; S.exiting = false; S.busy = false;
            S.elapsed = 0; S.t0 = 0; S.hint = null;
            if (saved && Array.isArray(saved.path) && validPath(saved.path)) {
                S.path = saved.path.slice();
                S.hints = saved.hints | 0;
                S.elapsed = +saved.elapsed || 0;
            }
            hideOv();
            snap();
            updateUI();
            setMsg('');
            layout();
        }
        function validPath(p) {
            if (!p.length || p[0] !== S.L.start) return false;
            var N = S.L.N;
            for (var i = 1; i < p.length; i++) {
                if (!canStep(p[i - 1], p[i])) return false;
            }
            return p[p.length - 1] !== S.L.exit && p.length < N * N * 20;
        }
        function canStep(a, b) {
            var N = S.L.N, ra = Math.floor(a / N), ca = a % N, rb = Math.floor(b / N), cb = b % N;
            for (var k = 0; k < 4; k++) {
                var d = DIRS[DLIST[k]];
                if (ra + d[0] === rb && ca + d[1] === cb) return !!(S.L.cells[a] & d[2]);
            }
            return false;
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
        function moves() { return S.path.length - 1; }
        function timeNow() { return S.elapsed + (S.t0 ? Date.now() - S.t0 : 0); }

        function updateUI() {
            var g = groupOf(S.level), L = S.L, av = AVATARS[prog.avatar];
            var pill = $('.jlab-pill');
            pill.className = 'jlab-pill ' + g.cls; pill.textContent = g.name;
            $('.jlab-lvltxt').innerHTML = '<span class="jlab-lvlword">Niveau </span>' + (S.level + 1) + ' / ' + NB_LEVELS;
            $('.jlab-v-moves').textContent = moves();
            $('.jlab-v-min').textContent = L.min;
            var best = prog.best[S.level];
            $('.jlab-v-best').textContent = best ? best : '–';
            $('.jlab-v-time').textContent = fmtTime(timeNow());
            $('.jlab-stars').innerHTML = starHTML(prog.stars[S.level] || 0);
            $('.jlab-undo').disabled = S.path.length < 2 || S.won || S.busy;
            $('.jlab-reset').disabled = (S.path.length < 2 && !S.won) || S.busy;
            $('.jlab-hint').disabled = S.won || S.busy;
            $('.jlab-sol').disabled = S.won || S.busy;
            $('.jlab-prev').disabled = S.level === 0 || S.busy;
            $('.jlab-next').disabled = S.level === NB_LEVELS - 1 || S.busy;
            $('.jlab-fog').classList.toggle('on', S.fog);
            var sb = $('.jlab-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
            $('.jlab-avbtn').textContent = av.a;
            $('.jlab-pad .mid').textContent = av.a;
            $('.jlab-goal').innerHTML = 'Guide <b>' + av.n + '</b> ' + av.a + ' jusqu\'à <b>' + av.t + '</b> ' + av.g + ' (' + L.N + '×' + L.N + ').';
        }
        function setMsg(t) { $('.jlab-msg').textContent = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // Chronomètre (affichage)
        var tick = setInterval(function () {
            if (!root.isConnected) { clearInterval(tick); return; }
            if (S.t0 && !S.won) $('.jlab-v-time').textContent = fmtTime(timeNow());
        }, 500);

        // ── Déplacements ─────────────────────────────────────────────────
        var saveTimer = 0;
        function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 600); }

        function stepTo(nx, silent) {
            if (S.won) return false;
            if (!canStep(cur(), nx)) return false;
            if (!S.t0) S.t0 = Date.now();
            S.path.push(nx);
            if (S.hint) {
                if (S.hint[1] === nx) S.hint.shift(); else S.hint = null;
                if (S.hint && S.hint.length < 2) S.hint = null;
            }
            if (!silent && prog.sound) beep(420 + (S.path.length % 4) * 30, 0.04, 'triangle', 0.035);
            animate();
            updateUI();
            if (nx === S.L.exit) win(); else saveSoon();
            return true;
        }
        function neighbor(idx, dk) {
            var N = S.L.N, r = Math.floor(idx / N), c = idx % N, d = DIRS[dk];
            if (!(S.L.cells[idx] & d[2])) return -1;
            return (r + d[0]) * N + (c + d[1]);
        }
        function stepDir(dk) {
            if (S.won || S.busy) return false;
            var nx = neighbor(cur(), dk);
            if (nx < 0) { if (prog.sound) beep(150, 0.06, 'square', 0.025); return false; }
            return stepTo(nx);
        }
        // Glisser dans une direction jusqu'au prochain carrefour / mur
        function glide(dk) {
            if (S.won || S.busy) return;
            var n = 0;
            while (n < 200) {
                var nx = neighbor(cur(), dk);
                if (nx < 0) break;
                stepTo(nx, n > 0);
                n++;
                if (S.won || nx === S.L.exit || openings(S.L, nx) > 2) break;
            }
            if (!n && prog.sound) beep(150, 0.06, 'square', 0.025);
        }

        function undo() {
            if (S.path.length < 2 || S.won || S.busy) return;
            S.path.pop();
            S.hint = null;
            animate();
            if (prog.sound) beep(300, 0.05, 'sine', 0.04);
            updateUI(); saveSoon();
        }
        function reset() {
            if (S.busy) return;
            loadLevel(S.level);
            save();
        }

        // ── Pointeur : tracer depuis le personnage, ou balayer ───────────
        var ptr = null;
        function cellAt(ev) {
            var b = canvas.getBoundingClientRect();
            var k = b.width / canvas.offsetWidth || 1;
            var x = (ev.clientX - b.left) / k, y = (ev.clientY - b.top) / k;
            var c = Math.floor(x / S.cell), r = Math.floor(y / S.cell), N = S.L.N;
            if (r < 0 || c < 0 || r >= N || c >= N) return null;
            return { r: r, c: c, idx: r * N + c };
        }
        // Avance vers la case visée en ligne droite (pour suivre un doigt rapide)
        function followTo(target) {
            var N = S.L.N, guard = 0;
            while (guard++ < N * 2 && !S.won) {
                var p = rc(cur());
                if (p.r === target.r && p.c === target.c) return;
                // Revenir en arrière en repassant sur la case précédente : c'est un pas normal
                var dk = null;
                if (p.r === target.r) dk = target.c > p.c ? 'E' : 'W';
                else if (p.c === target.c) dk = target.r > p.r ? 'S' : 'N';
                else {
                    // Diagonale : essaie l'axe le plus éloigné, puis l'autre
                    var a = Math.abs(target.c - p.c) >= Math.abs(target.r - p.r)
                        ? [target.c > p.c ? 'E' : 'W', target.r > p.r ? 'S' : 'N']
                        : [target.r > p.r ? 'S' : 'N', target.c > p.c ? 'E' : 'W'];
                    dk = neighbor(cur(), a[0]) >= 0 ? a[0] : a[1];
                }
                var nx = neighbor(cur(), dk);
                if (nx < 0) return;
                stepTo(nx);
            }
        }
        canvas.addEventListener('pointerdown', function (ev) {
            if (S.won || S.busy) return;
            if (ev.button != null && ev.button > 0) return;
            ev.preventDefault(); ev.stopPropagation();
            root.focus({ preventScroll: true });
            var at = cellAt(ev);
            if (!at) return;
            var p = rc(cur());
            var dist = Math.abs(at.r - p.r) + Math.abs(at.c - p.c);
            ptr = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, trace: dist <= 1, moved: false };
            try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
            if (ptr.trace && dist === 1) followTo(at);
        });
        canvas.addEventListener('pointermove', function (ev) {
            if (!ptr || ev.pointerId !== ptr.id) return;
            if (Math.abs(ev.clientX - ptr.sx) + Math.abs(ev.clientY - ptr.sy) > 6) ptr.moved = true;
            if (!ptr.trace) return;
            var at = cellAt(ev);
            if (at) followTo(at);
        });
        function ptrUp(ev) {
            if (!ptr || ev.pointerId !== ptr.id) return;
            var p = ptr; ptr = null;
            try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
            if (p.trace) return;
            var dx = ev.clientX - p.sx, dy = ev.clientY - p.sy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
                if (!p.moved) setMsg('✍️ Pars du personnage pour tracer, ou balaye pour glisser.');
                return;
            }
            glide(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N'));
        }
        canvas.addEventListener('pointerup', ptrUp);
        canvas.addEventListener('pointercancel', ptrUp);

        // ── Croix directionnelle (appui long = avance en continu) ────────
        var padTimer = 0;
        function padStop() {
            clearTimeout(padTimer); clearInterval(padTimer); padTimer = 0;
            root.querySelectorAll('.jlab-pad button.press').forEach(function (b) { b.classList.remove('press'); });
        }
        root.querySelectorAll('.jlab-pad button').forEach(function (b) {
            b.addEventListener('pointerdown', function (e) {
                e.preventDefault(); e.stopPropagation();
                padStop();
                b.classList.add('press');
                root.focus({ preventScroll: true });
                var dk = b.dataset.d;
                stepDir(dk);
                padTimer = setTimeout(function () {
                    padTimer = setInterval(function () { if (!stepDir(dk)) padStop(); }, 120);
                }, 320);
            });
            b.addEventListener('pointerup', padStop);
            b.addEventListener('pointerleave', padStop);
            b.addEventListener('pointercancel', padStop);
        });

        // ── Clavier : flèches / ZQSD, Maj = glisser, Ctrl+Z ──────────────
        // Les flèches passent par l'écoute globale (_jlabGlobalKey) ;
        // ZQSD / WASD fonctionnent quand le jeu a le focus.
        var KEYS = { z: 'N', s: 'S', q: 'W', d: 'E', w: 'N', a: 'W', Z: 'N', S: 'S', Q: 'W', D: 'E', W: 'N', A: 'W' };
        var inst = {
            widget: widget, root: root,
            handleArrow: function (dk, shift) {
                if (S.won || S.busy || !S.L) return false;
                if (root.querySelector('.jlab-ov.show')) return false;
                if (shift) glide(dk); else stepDir(dk);
                return true;
            }
        };
        _jlabInstances.push(inst);
        _jlabActive = inst;
        root.addEventListener('keydown', function (e) {
            if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); e.stopPropagation(); return; }
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Escape') { hideOv(); e.stopPropagation(); return; }
            var dk = KEYS[e.key];
            if (!dk || S.won || S.busy) return;
            if (root.querySelector('.jlab-ov.show')) return;
            e.preventDefault(); e.stopPropagation();
            if (e.shiftKey) glide(dk); else stepDir(dk);
        });

        // ── Indice : les prochains pas du plus court chemin ──────────────
        function hint() {
            if (S.won || S.busy) return;
            var path = shortest(S.L, cur());
            if (path.length < 2) { setMsg('Aucun indice disponible.'); return; }
            S.hints++;
            var n = Math.min(path.length, 1 + Math.max(4, Math.round(S.L.N * 0.6)));
            S.hint = path.slice(0, n);
            draw();
            setMsg('💡 Suis les pointillés jaunes. (Encore ' + (path.length - 1) + ' pas au mieux.)');
            if (prog.sound) beep(880, 0.12, 'sine', 0.05);
            updateUI(); saveSoon();
        }

        // ── Solution animée ──────────────────────────────────────────────
        function playSolution() {
            if (S.won || S.busy) return;
            var path = shortest(S.L, cur());
            if (path.length < 2) return;
            S.busy = true; S.solutionSeen = true; S.hint = null;
            updateUI();
            setMsg('🎬 Solution en ' + (path.length - 1) + ' pas…');
            var k = 1, delay = Math.max(45, Math.min(180, 2600 / path.length));
            (function step() {
                if (!root.isConnected) return;
                if (k >= path.length) { S.busy = false; updateUI(); return; }
                S.busy = false;
                stepTo(path[k++], k % 3 !== 0);
                if (!S.won) { S.busy = true; updateUI(); setTimeout(step, delay); }
            })();
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            S.won = true;
            if (S.t0) { S.elapsed += Date.now() - S.t0; S.t0 = 0; }
            S.hint = null;
            updateUI();
            var min = S.L.min, mv = moves(), t = S.elapsed;
            var stars = starsFor(mv, min, S.hints, S.solutionSeen);
            if (!S.solutionSeen) {
                if (stars > (prog.stars[S.level] || 0)) prog.stars[S.level] = stars;
                if (!S.hints && (!prog.best[S.level] || mv < prog.best[S.level])) prog.best[S.level] = mv;
                if (!S.hints && (!prog.bestTime[S.level] || t < prog.bestTime[S.level])) prog.bestTime[S.level] = t;
                saveProgress(prog);
                updateUI();
            }
            // Le personnage sort du labyrinthe
            setTimeout(function () { S.exiting = true; animate(); }, 200);
            if (prog.sound) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.25 + j * 0.11); });
            setTimeout(function () {
                if (!root.isConnected) return;
                var av = AVATARS[prog.avatar];
                $('.jlab-win-title').textContent = S.solutionSeen ? 'Solution terminée' : (stars === 3 ? 'Parfait ! ' + av.g : 'Bravo ! ' + av.g);
                var st = $('.jlab-win-stars');
                st.innerHTML = starHTML(stars);
                st.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt;
                if (S.solutionSeen) txt = 'Tu as regardé la solution : essaie maintenant de le faire seul !';
                else txt = 'Sorti en <b>' + mv + '</b> pas (minimum : ' + min + ') en <b>' + fmtTime(t) + '</b>' +
                    (S.hints ? '<br>avec ' + S.hints + ' indice' + (S.hints > 1 ? 's' : '') : '') +
                    (S.fog ? '<br>🌫️ dans le brouillard !' : '') +
                    (stars === 3 ? '<br>🏆 Chemin le plus court !' : (mv > min ? '<br>Peux-tu le faire en ' + min + ' pas ?' : ''));
                $('.jlab-win-txt').innerHTML = txt;
                $('.jlab-w-next').style.display = S.level < NB_LEVELS - 1 ? '' : 'none';
                showOv('.jlab-ov-win');
                if (stars >= 2 && !S.solutionSeen) confetti();
            }, 800);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#e11d2e', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jlab-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Fenêtres : niveaux / personnage / victoire / aide ────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jlab-ov').forEach(function (o) { o.classList.remove('show'); }); }
        function openLevels() {
            var html = '';
            GROUPS.forEach(function (g) {
                var done = 0;
                for (var j = g.from; j <= g.to; j++) if (prog.stars[j]) done++;
                html += '<div class="jlab-lv-grp"><span class="jlab-pill ' + g.cls + '">' + g.name + '</span> ' +
                        '<small style="color:#567;font-weight:700;">' + done + ' / ' + (g.to - g.from + 1) + ' réussis · ' +
                        levelSize(g.from) + '×' + levelSize(g.from) + ' à ' + levelSize(g.to) + '×' + levelSize(g.to) + '</small>' +
                        '<div class="jlab-lv-grid">';
                for (var i = g.from; i <= g.to; i++) {
                    var s = prog.stars[i] || 0, n = levelSize(i);
                    html += '<button class="jlab-lv' + (i === S.level ? ' cur' : '') + '" data-lv="' + i + '" title="' +
                            n + '×' + n + '">' + (i + 1) + '<small>' + (s ? '★★★'.slice(0, s) : '') + '</small></button>';
                }
                html += '</div></div>';
            });
            $('.jlab-lv-list').innerHTML = html;
            showOv('.jlab-ov-levels');
        }
        function openAvatars() {
            $('.jlab-av-grid').innerHTML = AVATARS.map(function (a, i) {
                return '<button class="jlab-av' + (i === prog.avatar ? ' cur' : '') + '" data-av="' + i + '" title="' + a.n + '">' + a.a + '<small>' + a.g + '</small></button>';
            }).join('');
            showOv('.jlab-ov-avatar');
        }
        root.addEventListener('click', function (e) {
            var lv = e.target.closest('.jlab-lv');
            if (lv) { loadLevel(+lv.dataset.lv); save(); return; }
            var avb = e.target.closest('.jlab-av');
            if (avb) { prog.avatar = +avb.dataset.av; saveProgress(prog); hideOv(); updateUI(); draw(); return; }
            if (e.target.closest('.jlab-x')) { hideOv(); return; }
            if (e.target.classList.contains('jlab-ov') && !$('.jlab-ov-win').classList.contains('show')) hideOv();
        });

        $('.jlab-lvlbtn').addEventListener('click', openLevels);
        $('.jlab-avbtn').addEventListener('click', openAvatars);
        $('.jlab-undo').addEventListener('click', undo);
        $('.jlab-reset').addEventListener('click', reset);
        $('.jlab-hint').addEventListener('click', hint);
        $('.jlab-sol').addEventListener('click', playSolution);
        $('.jlab-fog').addEventListener('click', function () { S.fog = !S.fog; updateUI(); draw(); save(); });
        $('.jlab-prev').addEventListener('click', function () { if (S.level > 0) { loadLevel(S.level - 1); save(); } });
        $('.jlab-next').addEventListener('click', function () { if (S.level < NB_LEVELS - 1) { loadLevel(S.level + 1); save(); } });
        $('.jlab-w-replay').addEventListener('click', function () { loadLevel(S.level); save(); });
        $('.jlab-w-levels').addEventListener('click', openLevels);
        $('.jlab-w-next').addEventListener('click', function () { loadLevel(S.level + 1); save(); });
        $('.jlab-help').addEventListener('click', function () { showOv('.jlab-ov-help'); });
        $('.jlab-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv();
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '🌀 Labyrinthe', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jlab-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jlabZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jlabZ || '';
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
        var grip = $('.jlab-grip'), rs = null;
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
        widget._jlabGetData = function () {
            return {
                level: S.level,
                path: S.won ? null : (S.path.length > 4000 ? null : S.path.slice()),
                hints: S.won ? 0 : S.hints,
                elapsed: S.won ? 0 : timeNow(),
                fog: S.fog,
                w: S.w, h: S.h,
                fullboard: S.fullboard
            };
        };

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fog) S.fog = true;
        if (data.fullboard) { S.fullboard = true; root.classList.add('jlab-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        var startLevel = (typeof data.level === 'number') ? data.level : firstUnsolved();
        loadLevel(startLevel, data.path ? data : null);
        requestAnimationFrame(layout);
        setTimeout(layout, 120);
        setTimeout(function () { try { root.focus({ preventScroll: true }); } catch (e) {} }, 150);
        // Redessiner quand la police des émojis est prête
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (root.isConnected) draw(); });

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
    window.createJeuLabyrintheWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        // Le crochet de createWidget (ci-dessous) lit ces données de façon synchrone
        window._jlabNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jlabNextPendingData = null;
        }
        if (w && !w._jlabInit) initLabyrinthe(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-labyrinthe') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jlabHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jlabInit) {
                var pending = window._jlabNextPendingData || null;
                initLabyrinthe(w, pending);
            }
            return w;
        };
        // Conserver les marqueurs des autres crochets (Rush Hour, Taquin…)
        for (var k in orig) if (Object.prototype.hasOwnProperty.call(orig, k)) wrapped[k] = orig[k];
        wrapped._jlabHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests / le débogage
    window._jlabGetLevel = getLevel;
})();
