// =========================================================================
// WIDGET JEU : TAQUIN — remettre les pièces dans l'ordre en les faisant glisser
// -------------------------------------------------------------------------
// Panneau « Jeux » › rubrique « Jeux divers » (construit sur le modèle de
// widget-jeu-rush-hour.js : mêmes boutons fenêtre, même sauvegarde, même
// plein écran sur téléphone).
//
// • 4 niveaux : Débutant (3×3 peu mélangé), Facile (3×3), Moyen (4×4),
//   Difficile (5×5). Tous les mélanges sont garantis faisables.
// • Plateaux : nombres, 6 images intégrées, ou « Ma photo » (image de
//   l'ordinateur, recadrée et gardée avec le tableau).
// • Jouer : cliquer/toucher une pièce de la même ligne ou colonne que la case
//   vide (plusieurs pièces glissent d'un coup), glisser le doigt sur le
//   plateau, ou utiliser les flèches du clavier.
// • Annuler (Ctrl+Z), recommencer, nouveau mélange, aperçu du modèle,
//   indice (prochain bon coup), solution animée.
// • Records (coups, temps) et étoiles mémorisés dans le navigateur.
// • Sauvegarde du tableau : niveau, plateau, pièces, coups, temps, taille
//   (via _jtqGetData / createJeuTaquinWidget(data), cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-taquin';
    var STORE_KEY = 'jtq-progress-v1';
    var DEF_W = 780, DEF_H = 580, MIN_W = 340, MIN_H = 380;

    var LEVELS = [
        { id: 'deb',  name: 'Débutant',  ico: '🐣', n: 3, walk: true, cls: 'g1', desc: '3×3 peu mélangé' },
        { id: 'fac',  name: 'Facile',    ico: '😊', n: 3, cls: 'g2', desc: '3×3' },
        { id: 'moy',  name: 'Moyen',     ico: '😐', n: 4, cls: 'g3', desc: '4×4' },
        { id: 'dif',  name: 'Difficile', ico: '😤', n: 5, cls: 'g4', desc: '5×5' }
    ];
    // Poids de l'A* : 1 = solution la plus courte (3×3), plus grand = plus rapide
    var SOLVER_W = { 3: 1, 4: 2, 5: 3 };
    var ROW_COLORS = ['#ff4f5e', '#ff9f1a', '#2fbf71', '#3ba7ff', '#9b6bff'];

    // Images intégrées, dessinées à la volée (dégradé + émojis)
    var PICTURES = [
        { id: 'lion',    name: 'Savane',   sky: ['#ffe58a', '#ff9f43'], ground: '#d39a45', sun: '#fff3b0',
          main: ['🦁', 300, 330, 270], extras: [['🌴', 95, 400, 150], ['🦒', 505, 395, 150], ['🦜', 480, 105, 95], ['🐘', 110, 520, 95], ['🌵', 515, 535, 70]] },
        { id: 'fusee',   name: 'Espace',   sky: ['#0b1a4a', '#4b2390'], stars: true,
          main: ['🚀', 300, 300, 250], extras: [['🪐', 115, 120, 130], ['🌙', 500, 105, 105], ['🌍', 490, 495, 150], ['⭐', 95, 500, 80], ['👽', 290, 540, 70]] },
        { id: 'mer',     name: 'Océan',    sky: ['#86dcff', '#0a63b0'], ground: '#f2d38b',
          main: ['🐠', 300, 300, 250], extras: [['🐳', 490, 115, 135], ['🫧', 105, 110, 95], ['🐙', 110, 480, 130], ['🐚', 505, 535, 80], ['🦀', 300, 545, 70]] },
        { id: 'chateau', name: 'Château',  sky: ['#a8e0ff', '#eaf8ff'], ground: '#5cc46b',
          main: ['🏰', 300, 320, 260], extras: [['🌈', 115, 115, 125], ['☁️', 480, 100, 115], ['🐉', 500, 490, 120], ['🌷', 95, 520, 85], ['🦄', 115, 395, 85]] },
        { id: 'dino',    name: 'Dinosaures', sky: ['#c7f5c9', '#62c47d'], ground: '#8a5a32',
          main: ['🦖', 300, 320, 260], extras: [['🌋', 110, 125, 135], ['☀️', 500, 100, 105], ['🌴', 505, 430, 150], ['🥚', 95, 525, 80], ['🦕', 115, 400, 95]] },
        { id: 'ferme',   name: 'Ferme',    sky: ['#bfe9ff', '#fff5cc'], ground: '#7cc456', sun: '#ffe066',
          main: ['🐷', 300, 330, 240], extras: [['🏡', 110, 130, 130], ['🌻', 500, 120, 105], ['🚜', 485, 480, 130], ['🐔', 105, 500, 100], ['🐄', 300, 545, 75]] }
    ];
    var _picCache = {};
    function pictureURL(id) {
        if (_picCache[id]) return _picCache[id];
        var P = null;
        for (var i = 0; i < PICTURES.length; i++) if (PICTURES[i].id === id) P = PICTURES[i];
        if (!P) return '';
        var c = document.createElement('canvas'); c.width = c.height = 600;
        var x = c.getContext('2d');
        var g = x.createLinearGradient(0, 0, 0, 600);
        g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]);
        x.fillStyle = g; x.fillRect(0, 0, 600, 600);
        if (P.stars) {
            x.fillStyle = 'rgba(255,255,255,0.85)';
            for (var s = 0; s < 70; s++) { x.beginPath(); x.arc((s * 137) % 600, (s * 211) % 600, (s % 3) + 1, 0, 7); x.fill(); }
        }
        if (P.sun) { x.fillStyle = P.sun; x.beginPath(); x.arc(300, 95, 70, 0, 7); x.fill(); }
        if (P.ground) {
            x.fillStyle = P.ground; x.beginPath(); x.moveTo(0, 470);
            x.quadraticCurveTo(300, 420, 600, 470); x.lineTo(600, 600); x.lineTo(0, 600); x.fill();
        }
        // Cercles de couleur discrets : aident à repérer les pièces
        var dots = ['rgba(255,255,255,0.25)', 'rgba(0,0,0,0.08)'];
        for (var d = 0; d < 8; d++) { x.fillStyle = dots[d % 2]; x.beginPath(); x.arc((d * 173 + 60) % 600, (d * 97 + 200) % 420, 22 + (d % 3) * 10, 0, 7); x.fill(); }
        x.textAlign = 'center'; x.textBaseline = 'middle';
        function emo(e, ex, ey, size) {
            x.fillStyle = '#000';          // opaque : sinon les émojis héritent de la transparence
            x.globalAlpha = 1;
            x.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
            x.fillText(e, ex, ey);
        }
        P.extras.forEach(function (e) { emo(e[0], e[1], e[2], e[3]); });
        x.shadowColor = 'rgba(0,0,0,0.25)'; x.shadowBlur = 18; x.shadowOffsetY = 8;
        emo(P.main[0], P.main[1], P.main[2], P.main[3]);
        try { _picCache[id] = c.toDataURL('image/jpeg', 0.88); } catch (e) { _picCache[id] = ''; }
        return _picCache[id];
    }

    // ── Progression (étoiles, records, son) ─────────────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, time: p.time || {}, sound: p.sound !== false, wins: p.wins || 0 };
        } catch (e) { return { stars: {}, best: {}, time: {}, sound: true, wins: 0 }; }
    }
    function saveProgress(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {} }

    // ── Logique du taquin ───────────────────────────────────────────────
    function solved(n) { var t = []; for (var i = 1; i < n * n; i++) t.push(i); t.push(0); return t; }
    function isSolved(t) { for (var i = 0; i < t.length - 1; i++) if (t[i] !== i + 1) return false; return t[t.length - 1] === 0; }
    function isSolvable(t, n) {
        var a = t.filter(function (v) { return v; }), inv = 0;
        for (var i = 0; i < a.length; i++) for (var j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
        if (n % 2) return inv % 2 === 0;
        var zr = Math.floor(t.indexOf(0) / n);
        return (inv + (n - zr)) % 2 === 1;
    }
    function neighbors(z, n) {
        var r = Math.floor(z / n), c = z % n, out = [];
        if (r > 0) out.push(z - n); if (r < n - 1) out.push(z + n);
        if (c > 0) out.push(z - 1); if (c < n - 1) out.push(z + 1);
        return out;
    }
    function shuffleFull(n) {
        for (;;) {
            var t = solved(n);
            for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), k = t[i]; t[i] = t[j]; t[j] = k; }
            if (!isSolvable(t, n) || isSolved(t)) continue;
            var ok = 0; for (var q = 0; q < t.length - 1; q++) if (t[q] === q + 1) ok++;
            if (ok <= Math.ceil(n / 2)) return t;      // pas trop de pièces déjà bien placées
        }
    }
    function shuffleWalk(n, steps) {
        for (;;) {
            var t = solved(n), z = t.length - 1, prev = -1;
            for (var s = 0; s < steps; s++) {
                var nb = neighbors(z, n).filter(function (p) { return p !== prev; });
                var p = nb[Math.floor(Math.random() * nb.length)];
                t[z] = t[p]; t[p] = 0; prev = z; z = p;
            }
            var path = solve(t, n, 1, 50000);
            if (path && path.length >= 6) return t;
        }
    }

    // Solveur A* pondéré : distance de Manhattan + conflits linéaires.
    // Renvoie la liste des cases à faire glisser vers la case vide.
    function solve(start, n, w, cap) {
        var N = n * n, gr = new Int8Array(N), gc = new Int8Array(N), v, i;
        for (v = 1; v < N; v++) { gr[v] = Math.floor((v - 1) / n); gc[v] = (v - 1) % n; }
        function h(t) {
            var s = 0, r, c, a, b, va, vb;
            for (i = 0; i < N; i++) { v = t[i]; if (v) s += Math.abs(gr[v] - Math.floor(i / n)) + Math.abs(gc[v] - i % n); }
            for (r = 0; r < n; r++) for (a = 0; a < n; a++) {
                va = t[r * n + a]; if (!va || gr[va] !== r) continue;
                for (b = a + 1; b < n; b++) { vb = t[r * n + b]; if (vb && gr[vb] === r && gc[vb] < gc[va]) s += 2; }
            }
            for (c = 0; c < n; c++) for (a = 0; a < n; a++) {
                va = t[a * n + c]; if (!va || gc[va] !== c) continue;
                for (b = a + 1; b < n; b++) { vb = t[b * n + c]; if (vb && gc[vb] === c && gr[vb] < gr[va]) s += 2; }
            }
            return s;
        }
        function key(t) { return String.fromCharCode.apply(null, t); }
        var heap = [];
        function push(x) { heap.push(x); var k = heap.length - 1; while (k > 0) { var p = (k - 1) >> 1; if (heap[p].f <= x.f) break; heap[k] = heap[p]; k = p; } heap[k] = x; }
        function pop() {
            var top = heap[0], last = heap.pop();
            if (heap.length) {
                var k = 0;
                for (;;) {
                    var l = 2 * k + 1, r = l + 1, m = k, mf = last.f;
                    if (l < heap.length && heap[l].f < mf) { m = l; mf = heap[l].f; }
                    if (r < heap.length && heap[r].f < mf) { m = r; }
                    if (m === k) break;
                    heap[k] = heap[m]; k = m;
                }
                heap[k] = last;
            }
            return top;
        }
        var t0 = Uint8Array.from(start), h0 = h(t0), seen = new Map(), count = 0;
        if (h0 === 0) return [];
        push({ t: t0, z: Array.prototype.indexOf.call(t0, 0), g: 0, f: w * h0, hv: h0, par: null, mv: -1 });
        seen.set(key(t0), 0);
        while (heap.length) {
            var nd = pop();
            if (nd.hv === 0) { var path = [], x = nd; while (x.par) { path.unshift(x.mv); x = x.par; } return path; }
            if (++count > cap) return null;
            var nb = neighbors(nd.z, n);
            for (var q = 0; q < nb.length; q++) {
                var p = nb[q];
                if (nd.par && p === nd.par.z) continue;
                var t = nd.t.slice(); t[nd.z] = t[p]; t[p] = 0;
                var k = key(t), g = nd.g + 1, old = seen.get(k);
                if (old !== undefined && old <= g) continue;
                seen.set(k, g);
                var hv = h(t);
                push({ t: t, z: p, g: g, f: g + w * hv, hv: hv, par: nd, mv: p });
            }
        }
        return null;
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

    // ── CSS (injecté une seule fois) ────────────────────────────────────
    function injectCSS() {
        if (document.getElementById('jtq-style')) return;
        var s = document.createElement('style');
        s.id = 'jtq-style';
        s.textContent = [
'.jtq-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#2fae8a 0%,#1d8a6c 45%,#0f5e4a 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jtq-root *{box-sizing:border-box}',
'.jtq-root.jtq-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jtq-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête
'.jtq-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0))}',
'.jtq-title{font-weight:900;font-size:calc(22px*var(--ui));letter-spacing:.5px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jtq-title b{color:#ffd23f}',
'.jtq-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);font-family:inherit}',
'.jtq-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jtq-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap}',
'.jtq-pill.g1{background:#a3e635;color:#1a2e05}.jtq-pill.g2{background:#22c55e;color:#06321a}',
'.jtq-pill.g3{background:#38bdf8;color:#062a3a}.jtq-pill.g4{background:#f43f5e;color:#fff}',
'.jtq-spacer{flex:1}',
'.jtq-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;font-weight:900;font-family:inherit;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0;padding:0}',
'.jtq-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jtq-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jtq-root.jtq-tall .jtq-body{flex-direction:column}',
'.jtq-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}',
'.jtq-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(236px*var(--ui))}',
'.jtq-root.jtq-tall .jtq-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center}',
'.jtq-stats{display:flex;gap:6px}',
'.jtq-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 4px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.jtq-stat small{display:block;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;opacity:.8;text-transform:uppercase}',
'.jtq-stat span{display:block;font-size:calc(24px*var(--ui));font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}',
'.jtq-stat.jtq-st-moves span{color:#ffd23f}',
'.jtq-model{display:flex;align-items:center;gap:8px;justify-content:center}',
'.jtq-model img{width:calc(64px*var(--ui));height:calc(64px*var(--ui));border-radius:10px;box-shadow:0 0 0 2px rgba(255,255,255,.6),0 4px 10px rgba(0,0,0,.3);object-fit:cover}',
'.jtq-model small{font-size:calc(11px*var(--ui));font-weight:800;opacity:.85;line-height:1.25;text-align:left}',
'.jtq-root.jtq-tall .jtq-model{display:none!important}',
'.jtq-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jtq-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jtq-stars .off{color:rgba(255,255,255,.25)}',
'.jtq-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jtq-root.jtq-tall .jtq-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jtq-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#0b3b2e;background:#e9fff6;box-shadow:0 3px 0 #9fd8c2;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jtq-btn:hover{filter:brightness(1.05)}.jtq-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #9fd8c2}',
'.jtq-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jtq-btn.jtq-hint{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jtq-btn.jtq-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jtq-btn.jtq-on{background:#0f5e4a;color:#fff;box-shadow:0 3px 0 #062a20}',
'.jtq-goal{font-size:calc(12px*var(--ui));opacity:.9;text-align:center;line-height:1.3}',
'.jtq-goal b{color:#ffe48a}',
'.jtq-msg{min-height:1.3em;font-size:calc(12px*var(--ui));text-align:center;font-weight:700;color:#ffe48a}',
// Plateau
'.jtq-board{position:relative;flex-shrink:0;border-radius:calc(var(--cell)*0.16);touch-action:none;',
'  background:linear-gradient(145deg,#8a5a32,#5b3818);box-shadow:0 calc(var(--cell)*0.08) calc(var(--cell)*0.25) rgba(0,0,0,.45),inset 0 0 0 3px rgba(255,255,255,.1),inset 0 3px 0 rgba(255,255,255,.18)}',
'.jtq-lot{position:absolute;border-radius:calc(var(--cell)*0.07);background:#3b2410;box-shadow:inset 0 0 calc(var(--cell)*0.25) rgba(0,0,0,.6)}',
'.jtq-tile{position:absolute;cursor:pointer;border-radius:calc(var(--cell)*0.14);display:flex;align-items:center;justify-content:center;',
'  font-weight:900;color:#fff;font-size:calc(var(--cell)*0.46);line-height:1;text-shadow:0 calc(var(--cell)*0.03) 0 rgba(0,0,0,.25);',
'  background:linear-gradient(160deg,var(--c1),var(--c2));',
'  box-shadow:0 calc(var(--cell)*0.05) 0 var(--c3),0 calc(var(--cell)*0.08) calc(var(--cell)*0.14) rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.35);',
'  transition:left .13s ease,top .13s ease,width .4s,height .4s,border-radius .4s,box-shadow .2s;font-family:"Lilita One","Nunito",sans-serif;font-variant-numeric:tabular-nums}',
'.jtq-tile.img{background-color:#ddd;color:#fff}',
'.jtq-tile.img .jtq-num{position:absolute;left:6%;top:6%;min-width:1.6em;height:1.6em;padding:0 .3em;border-radius:1em;background:rgba(0,0,0,.55);',
'  font-size:calc(var(--cell)*0.17);display:flex;align-items:center;justify-content:center;text-shadow:none;font-family:"Nunito",sans-serif}',
'.jtq-root.jtq-nonum .jtq-tile.img .jtq-num{display:none}',
'.jtq-tile.ok:not(.img)::after{content:"";position:absolute;right:9%;bottom:9%;width:calc(var(--cell)*0.11);height:calc(var(--cell)*0.11);border-radius:50%;background:rgba(255,255,255,.85)}',
'.jtq-tile.jtq-hintv{animation:jtqPulse .8s ease-in-out infinite;z-index:4}',
'@keyframes jtqPulse{0%,100%{outline:3px solid rgba(255,210,63,.3);outline-offset:1px}50%{outline:4px solid #ffd23f;outline-offset:4px}}',
'.jtq-arrow{position:absolute;z-index:5;pointer-events:none;color:#ffd23f;font-size:calc(var(--cell)*0.5);font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,.6);',
'  display:flex;align-items:center;justify-content:center;animation:jtqNudge .8s ease-in-out infinite}',
'@keyframes jtqNudge{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx),var(--dy))}}',
'.jtq-board.done .jtq-tile{box-shadow:none;border-radius:0;transition:left .3s,top .3s,width .5s,height .5s,border-radius .5s,box-shadow .3s}',
'.jtq-preview{position:absolute;z-index:6;display:none;border-radius:calc(var(--cell)*0.07);overflow:hidden;background-size:cover;box-shadow:0 0 0 3px #ffd23f}',
'.jtq-preview.show{display:block}',
'.jtq-preview .jtq-pv-tag{position:absolute;left:50%;top:6px;transform:translateX(-50%);background:#ffd23f;color:#3a2a00;font-weight:900;font-size:13px;border-radius:8px;padding:2px 10px}',
'.jtq-pv-grid{position:absolute;inset:0;display:grid}',
'.jtq-pv-grid div{display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-family:"Lilita One","Nunito",sans-serif;border:1px solid rgba(0,0,0,.15)}',
// Fenêtres superposées
'.jtq-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(6,40,31,.78);backdrop-filter:blur(3px);padding:14px}',
'.jtq-ov.show{display:flex}',
'.jtq-card{position:relative;background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jtq-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#0f5e4a}',
'.jtq-card h4{margin:12px 0 6px;font-size:calc(13px*var(--ui));font-weight:900;color:#0f5e4a;text-transform:uppercase;letter-spacing:1px;text-align:left}',
'.jtq-chips{display:flex;flex-wrap:wrap;gap:6px}',
'.jtq-chip{border:2px solid #cfe5dd;cursor:pointer;border-radius:12px;padding:6px 10px;font-weight:800;font-size:calc(13px*var(--ui));background:#f3faf7;color:#0f5e4a;font-family:inherit;line-height:1.2}',
'.jtq-chip small{display:block;font-size:.78em;opacity:.7;font-weight:700}',
'.jtq-chip.sel{border-color:#0f5e4a;background:#0f5e4a;color:#fff}',
'.jtq-pics{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}',
'.jtq-pic{border:3px solid transparent;cursor:pointer;border-radius:12px;padding:0;background:#eef6f3;overflow:hidden;position:relative;aspect-ratio:1;min-width:calc(62px*var(--ui))}',
'.jtq-pic img{width:100%;height:100%;object-fit:cover;display:block}',
'.jtq-pic span{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);color:#fff;font-size:calc(10px*var(--ui));font-weight:800;padding:1px 0}',
'.jtq-pic.sel{border-color:#0f5e4a;box-shadow:0 0 0 2px #22c55e}',
'.jtq-pic.num{display:flex;align-items:center;justify-content:center;font-size:calc(22px*var(--ui));font-weight:900;color:#0f5e4a;font-family:"Lilita One","Nunito",sans-serif}',
'.jtq-pic.photo{display:flex;align-items:center;justify-content:center;font-size:calc(26px*var(--ui))}',
'.jtq-check{display:flex;align-items:center;gap:6px;margin-top:8px;font-weight:700;font-size:calc(13px*var(--ui));color:#345;cursor:pointer;text-align:left}',
'.jtq-check input{width:18px;height:18px;accent-color:#0f5e4a}',
'.jtq-card .jtq-btn{box-shadow:0 3px 0 #b7d6cb;background:#eef6f3}',
'.jtq-card .jtq-btn.jtq-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jtq-card-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}',
'.jtq-x{position:absolute;top:10px;right:10px;background:#0f5e4a!important}',
'.jtq-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jtq-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jtqPop .5s backwards}',
'.jtq-win-stars .off{color:#d7e3df}',
'@keyframes jtqPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jtq-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 4px;color:#345;line-height:1.45}',
'.jtq-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jtqFall linear forwards;z-index:21}',
'@keyframes jtqFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jtq-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jtq-grip:hover{opacity:1}',
'.jtq-root.jtq-fullboard .jtq-grip,.widget.phone-fs .jtq-grip{display:none}',
// Format étroit
'.jtq-root.jtq-narrow .jtq-head{gap:6px;padding:8px 8px 6px 10px}',
'.jtq-root.jtq-narrow .jtq-title .jtq-tt{display:none}',
'.jtq-root.jtq-narrow .jtq-lvlword{display:none}',
'.jtq-root.jtq-narrow .jtq-icon{width:24px;height:24px;font-size:12px}',
'.jtq-root.jtq-narrow .jtq-help{display:none}',
'.jtq-root.jtq-narrow .jtq-pics{grid-template-columns:repeat(3,1fr)}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .jtq-root.jtq-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
'    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}',
'}',
'@media (prefers-reduced-motion: reduce){.jtq-root *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
        ].join('\n');
        document.head.appendChild(s);
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
    function fmtTime(s) {
        s = Math.max(0, Math.floor(s || 0));
        var m = Math.floor(s / 60), r = s % 60;
        return m + ':' + (r < 10 ? '0' : '') + r;
    }
    function lvlById(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return LEVELS[1]; }

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initTaquin(widget, data) {
        if (!widget || widget._jtqInit) return;
        widget._jtqInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            lvl: 'fac', pic: 'num', custom: null, showNum: true,
            n: 3, tiles: null, start: null, history: [],
            moves: 0, time: 0, hints: 0, solutionSeen: false, started: false,
            won: false, busy: false, optimal: null,
            cell: 60, frame: 10, w: DEF_W, h: DEF_H, fullboard: false, preview: false
        };

        // Fond transparent : seul le cadre arrondi du jeu est visible
        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jtq-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jtq-head">' +
                '<div class="jtq-title">🧩<span class="jtq-tt"> <b>Taquin</b></span></div>' +
                '<button class="jtq-lvlbtn" title="Choisir le niveau et l\'image"><span class="jtq-pill"></span><span class="jtq-lvltxt"></span> ▾</button>' +
                '<div class="jtq-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jtq-icon jtq-sound" title="Son"></button>' +
                    '<button class="jtq-icon jtq-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jtq-body">' +
                '<div class="jtq-stage"><div class="jtq-board"><div class="jtq-lot"></div><div class="jtq-preview"></div></div></div>' +
                '<div class="jtq-side">' +
                    '<div class="jtq-stats">' +
                        '<div class="jtq-stat jtq-st-moves"><small>Coups</small><span class="jtq-v-moves">0</span></div>' +
                        '<div class="jtq-stat"><small>Temps</small><span class="jtq-v-time">0:00</span></div>' +
                        '<div class="jtq-stat"><small>Record</small><span class="jtq-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="jtq-model"><img alt="Modèle"><small>Modèle<br>à reconstituer</small></div>' +
                    '<div class="jtq-stars"></div>' +
                    '<div class="jtq-btns">' +
                        '<button class="jtq-btn jtq-undo" title="Annuler le dernier coup (Ctrl+Z)">↶ Annuler</button>' +
                        '<button class="jtq-btn jtq-reset" title="Revenir au mélange de départ">↺ Recommencer</button>' +
                        '<button class="jtq-btn jtq-hint" title="Montrer un bon coup">💡 Indice</button>' +
                        '<button class="jtq-btn jtq-sol" title="Regarder la solution">🎬 Solution</button>' +
                        '<button class="jtq-btn jtq-peek" title="Voir le modèle par-dessus le plateau">👁 Aperçu</button>' +
                        '<button class="jtq-btn jtq-go jtq-new" title="Mélanger à nouveau">🔀 Mélanger</button>' +
                    '</div>' +
                    '<div class="jtq-goal">Fais glisser les pièces dans la case vide pour <b>tout remettre dans l\'ordre</b>.</div>' +
                    '<div class="jtq-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jtq-ov jtq-ov-set"><div class="jtq-card" style="max-width:460px;"><button class="jtq-icon jtq-x">✕</button><h3>Choisis ton taquin</h3>' +
                '<h4>Niveau</h4><div class="jtq-chips jtq-set-lvl"></div>' +
                '<h4>Plateau</h4><div class="jtq-pics jtq-set-pic"></div>' +
                '<label class="jtq-check"><input type="checkbox" class="jtq-set-num"> Afficher les numéros sur les images (plus facile)</label>' +
                '<input type="file" accept="image/*" class="jtq-file" style="display:none">' +
                '<div class="jtq-card-btns"><button class="jtq-btn jtq-go jtq-set-play">▶ Jouer</button></div></div></div>' +
            '<div class="jtq-ov jtq-ov-win"><div class="jtq-card"><h3 class="jtq-win-title">Bravo !</h3><div class="jtq-win-stars"></div><div class="jtq-win-txt"></div>' +
                '<div class="jtq-card-btns"><button class="jtq-btn jtq-w-replay">↺ Rejouer ce mélange</button><button class="jtq-btn jtq-w-set">☰ Changer</button><button class="jtq-btn jtq-go jtq-w-new">🔀 Nouveau mélange</button></div></div></div>' +
            '<div class="jtq-ov jtq-ov-help"><div class="jtq-card" style="max-width:440px;text-align:left;"><button class="jtq-icon jtq-x">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> remettre les pièces dans l\'ordre (1, 2, 3… ou l\'image complète), la case vide finissant <b>en bas à droite</b>.</p>' +
                '<p style="margin:6px 0;">👆 <b>Touche une pièce</b> à côté de la case vide pour la faire glisser. Si la pièce est sur la même ligne ou colonne, toutes celles entre les deux glissent ensemble.</p>' +
                '<p style="margin:6px 0;">🖐️ Tu peux aussi <b>glisser le doigt</b> sur le plateau, ou utiliser les <b>flèches</b> du clavier.</p>' +
                '<p style="margin:6px 0;">💡 Astuce : range d\'abord la <b>première ligne</b>, puis la <b>première colonne</b>, et ainsi de suite.</p>' +
                '<p style="margin:6px 0;">⭐ 3 étoiles sans indice, 2 étoiles avec 1 à 3 indices.</p></div></div>' +
            '<div class="jtq-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var boardEl = $('.jtq-board'), lotEl = $('.jtq-lot'), pvEl = $('.jtq-preview');
        var tileEls = {}, arrowEl = null, hintPos = -1;

        // ── Isoler les interactions du jeu du déplacement du widget ─────
        function isolate(e) {
            if (e.target.closest('.jtq-head') && !e.target.closest('button')) return;
            e.stopPropagation();
            if ((e.type === 'pointerdown' || e.type === 'mousedown') && typeof bringToFront === 'function') {
                try { bringToFront(widget); } catch (er) {}
            }
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.jtq-head button').forEach(function (b) {
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
            root.classList.toggle('jtq-narrow', W < 600);
            root.classList.toggle('jtq-tall', W < H * 1.15);
            var stage = $('.jtq-stage');
            var avail = Math.floor(Math.min(stage.clientWidth, stage.clientHeight) * 0.97);
            var f = Math.max(6, Math.round(avail * 0.035));
            var cell = Math.max(22, Math.floor((avail - 2 * f) / S.n));
            S.cell = cell; S.frame = f;
            var size = S.n * cell + 2 * f;
            boardEl.style.setProperty('--cell', cell + 'px');
            boardEl.style.width = size + 'px'; boardEl.style.height = size + 'px';
            [lotEl, pvEl].forEach(function (e) {
                e.style.left = f + 'px'; e.style.top = f + 'px';
                e.style.width = (S.n * cell) + 'px'; e.style.height = (S.n * cell) + 'px';
            });
            placeAll(true);
            if (hintPos >= 0) showHintAt(hintPos);
        }

        // ── Pièces ───────────────────────────────────────────────────────
        function imageURL() {
            if (S.pic === 'num') return '';
            if (S.pic === 'photo') return S.custom || '';
            return pictureURL(S.pic);
        }
        function tileRect(pos) {
            var c = S.cell, g = S.won ? 0 : Math.max(2, Math.round(c * 0.035)), f = S.frame;
            var r = Math.floor(pos / S.n), col = pos % S.n;
            return { left: f + col * c + g, top: f + r * c + g, size: c - 2 * g, g: g };
        }
        function placeTile(v, pos, instant) {
            var e = tileEls[v]; if (!e) return;
            var rc = tileRect(pos);
            if (instant) e.style.transition = 'none';
            e.style.left = rc.left + 'px'; e.style.top = rc.top + 'px';
            e.style.width = rc.size + 'px'; e.style.height = rc.size + 'px';
            if (e._img) {
                var gr = Math.floor((v - 1) / S.n), gc = (v - 1) % S.n;
                e.style.backgroundSize = (S.n * S.cell) + 'px ' + (S.n * S.cell) + 'px';
                e.style.backgroundPosition = (-(gc * S.cell + rc.g)) + 'px ' + (-(gr * S.cell + rc.g)) + 'px';
            }
            e.classList.toggle('ok', pos === v - 1);
            if (instant) { void e.offsetWidth; e.style.transition = ''; }
        }
        function placeAll(instant) {
            for (var p = 0; p < S.tiles.length; p++) if (S.tiles[p]) placeTile(S.tiles[p], p, instant);
        }
        function buildTiles() {
            Object.keys(tileEls).forEach(function (k) { tileEls[k].remove(); });
            tileEls = {};
            clearHint();
            var url = imageURL(), N = S.n * S.n;
            for (var v = 1; v <= N; v++) {
                var e = el('div', 'jtq-tile' + (url ? ' img' : ''));
                if (url) {
                    e._img = true;
                    e.style.backgroundImage = 'url("' + url + '")';
                    e.innerHTML = '<span class="jtq-num">' + (v === N ? '' : v) + '</span>';
                } else {
                    var col = ROW_COLORS[Math.floor((v - 1) / S.n) % ROW_COLORS.length];
                    e.style.setProperty('--c1', shade(col, 0.2));
                    e.style.setProperty('--c2', col);
                    e.style.setProperty('--c3', shade(col, -0.42));
                    e.textContent = v === N ? '' : v;
                }
                e.dataset.v = v;
                if (v === N) { e.style.display = 'none'; e.classList.add('jtq-last'); }
                boardEl.appendChild(e);
                tileEls[v] = e;
            }
            placeAll(true);
            renderPreview();
        }
        function renderPreview() {
            var url = imageURL();
            if (url) {
                pvEl.style.backgroundImage = 'url("' + url + '")';
                pvEl.innerHTML = '<div class="jtq-pv-tag">Modèle</div>';
            } else {
                pvEl.style.backgroundImage = '';
                var h = '<div class="jtq-pv-grid" style="grid-template-columns:repeat(' + S.n + ',1fr);">';
                for (var v = 1; v <= S.n * S.n; v++) {
                    var col = v === S.n * S.n ? '#3b2410' : ROW_COLORS[Math.floor((v - 1) / S.n) % ROW_COLORS.length];
                    h += '<div style="background:' + col + ';font-size:calc(var(--cell)*0.4)">' + (v === S.n * S.n ? '' : v) + '</div>';
                }
                pvEl.innerHTML = h + '</div><div class="jtq-pv-tag">Modèle</div>';
            }
            var model = $('.jtq-model');
            model.style.display = url ? '' : 'none';
            if (url) model.querySelector('img').src = url;
        }

        // ── Nouvelle partie ──────────────────────────────────────────────
        function newGame(keepStart) {
            var L = lvlById(S.lvl);
            S.n = L.n;
            if (!keepStart || !S.start || S.start.length !== S.n * S.n) {
                S.start = L.walk ? shuffleWalk(S.n, 14 + Math.floor(Math.random() * 6)) : shuffleFull(S.n);
            }
            S.tiles = S.start.slice();
            S.optimal = null;
            S.history = []; S.moves = 0; S.time = 0; S.hints = 0;
            S.solutionSeen = false; S.started = false; S.won = false; S.busy = false;
            setPreview(false);
            boardEl.classList.remove('done');
            hideOv();
            buildTiles();
            layout();
            updateUI();
            setMsg('');
        }
        function restore(d) {
            S.lvl = lvlById(d.lvl).id;
            S.n = lvlById(S.lvl).n;
            if (d.pic) S.pic = d.pic;
            if (d.custom) S.custom = d.custom;
            if (S.pic === 'photo' && !S.custom) S.pic = 'num';
            if (typeof d.showNum === 'boolean') S.showNum = d.showNum;
            var N = S.n * S.n;
            var okArr = function (a) {
                if (!a || a.length !== N) return false;
                var seen = {};
                for (var i = 0; i < N; i++) { if (typeof a[i] !== 'number' || a[i] < 0 || a[i] >= N || seen[a[i]]) return false; seen[a[i]] = 1; }
                return isSolvable(a, S.n);
            };
            if (okArr(d.start) && okArr(d.tiles) && !isSolved(d.tiles)) {
                S.start = d.start.slice();
                newGame(true);
                S.tiles = d.tiles.slice();
                S.moves = d.moves || 0; S.time = d.time || 0; S.hints = d.hints || 0;
                S.started = S.moves > 0;
                placeAll(true); updateUI();
            } else {
                newGame(false);
            }
        }

        function stars() {
            if (S.solutionSeen) return 0;
            return S.hints === 0 ? 3 : (S.hints <= 3 ? 2 : 1);
        }
        function starHTML(n) {
            var h = '';
            for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
            return h;
        }
        function recKey() { return S.lvl + '|' + (S.pic === 'num' ? 'num' : 'img'); }

        function updateUI() {
            var L = lvlById(S.lvl);
            var pill = $('.jtq-pill');
            pill.className = 'jtq-pill ' + L.cls; pill.textContent = L.name;
            $('.jtq-lvltxt').innerHTML = S.n + '×' + S.n + '<span class="jtq-lvlword"> · ' + (S.pic === 'num' ? 'Nombres' : (S.pic === 'photo' ? 'Ma photo' : picName(S.pic))) + '</span>';
            $('.jtq-v-moves').textContent = S.moves;
            $('.jtq-v-time').textContent = fmtTime(S.time);
            var best = prog.best[recKey()];
            $('.jtq-v-best').textContent = best ? best : '–';
            $('.jtq-stars').innerHTML = starHTML(prog.stars[recKey()] || 0);
            $('.jtq-undo').disabled = !S.history.length || S.won || S.busy;
            $('.jtq-reset').disabled = (!S.history.length && !S.won) || S.busy;
            $('.jtq-hint').disabled = S.won || S.busy;
            $('.jtq-sol').disabled = S.won || S.busy;
            $('.jtq-new').disabled = S.busy;
            $('.jtq-peek').classList.toggle('jtq-on', S.preview);
            root.classList.toggle('jtq-nonum', !S.showNum);
            var sb = $('.jtq-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
        }
        function picName(id) { for (var i = 0; i < PICTURES.length; i++) if (PICTURES[i].id === id) return PICTURES[i].name; return 'Image'; }
        function setMsg(t) { $('.jtq-msg').textContent = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // ── Chronomètre ──────────────────────────────────────────────────
        var timer = setInterval(function () {
            if (!root.isConnected) { if (!widget.isConnected) clearInterval(timer); return; }
            if (S.started && !S.won && !S.busy && root.offsetParent !== null) {
                S.time++;
                $('.jtq-v-time').textContent = fmtTime(S.time);
            }
        }, 1000);

        // ── Jouer ────────────────────────────────────────────────────────
        // Fait glisser la (ou les) pièce(s) entre la case pos et la case vide
        function slideFrom(pos, silent) {
            if (S.won) return false;
            var n = S.n, z = S.tiles.indexOf(0);
            var pr = Math.floor(pos / n), pc = pos % n, zr = Math.floor(z / n), zc = z % n;
            if (pos === z || (pr !== zr && pc !== zc)) {
                if (!silent && prog.sound) beep(150, 0.07, 'square', 0.025);
                return false;
            }
            S.history.push(S.tiles.slice());
            if (S.history.length > 500) S.history.shift();
            var step = pr === zr ? (pc > zc ? 1 : -1) : (pr > zr ? n : -n);
            var k = 0;
            while (z !== pos) {
                var nx = z + step;
                S.tiles[z] = S.tiles[nx]; S.tiles[nx] = 0;
                placeTile(S.tiles[z], z);
                z = nx; k++;
            }
            S.moves += k;
            S.started = true;
            clearHint();
            if (prog.sound) beep(420 + Math.random() * 60, 0.06, 'triangle', 0.05);
            updateUI();
            if (isSolved(S.tiles)) win(); else save();
            return true;
        }

        function undo() {
            if (!S.history.length || S.won || S.busy) return;
            var prev = S.history.pop();
            var diff = 0;
            for (var i = 0; i < prev.length; i++) if (prev[i] !== S.tiles[i]) diff++;
            S.tiles = prev;
            S.moves = Math.max(0, S.moves - Math.max(1, diff - 1));
            clearHint(); placeAll(false);
            if (prog.sound) beep(300, 0.06, 'sine', 0.05);
            updateUI(); save();
        }

        // Toucher / cliquer / glisser sur le plateau
        var ptr = null;
        boardEl.addEventListener('pointerdown', function (e) {
            if (S.won || S.busy || (e.button != null && e.button > 0)) return;
            e.preventDefault(); e.stopPropagation();
            root.focus({ preventScroll: true });
            ptr = { id: e.pointerId, x: e.clientX, y: e.clientY };
            try { boardEl.setPointerCapture(e.pointerId); } catch (er) {}
        });
        function endPtr(e) {
            if (!ptr || e.pointerId !== ptr.id) return;
            var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, start = ptr;
            ptr = null;
            if (e.type === 'pointercancel') return;
            var rect = lotEl.getBoundingClientRect(), n = S.n;
            var cs = rect.width / n;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > Math.max(18, cs * 0.25)) {
                // Glissement : la pièce voisine de la case vide, du côté opposé, avance
                var z = S.tiles.indexOf(0), zr = Math.floor(z / n), zc = z % n, p = -1;
                if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && zc > 0) p = z - 1; if (dx < 0 && zc < n - 1) p = z + 1; }
                else { if (dy > 0 && zr > 0) p = z - n; if (dy < 0 && zr < n - 1) p = z + n; }
                if (p >= 0) slideFrom(p);
                return;
            }
            var col = Math.floor((start.x - rect.left) / cs), row = Math.floor((start.y - rect.top) / cs);
            if (col < 0 || row < 0 || col >= n || row >= n) return;
            slideFrom(row * n + col);
        }
        boardEl.addEventListener('pointerup', endPtr);
        boardEl.addEventListener('pointercancel', endPtr);

        // Clavier : la flèche indique le sens de déplacement de la pièce
        root.addEventListener('keydown', function (e) {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); e.stopPropagation(); return; }
            if (e.key === 'Escape') { hideOv(); setPreview(false); return; }
            if (S.won || S.busy || root.querySelector('.jtq-ov.show')) return;
            var n = S.n, z = S.tiles.indexOf(0), zr = Math.floor(z / n), zc = z % n, p = -1;
            if (e.key === 'ArrowUp' && zr < n - 1) p = z + n;
            if (e.key === 'ArrowDown' && zr > 0) p = z - n;
            if (e.key === 'ArrowLeft' && zc < n - 1) p = z + 1;
            if (e.key === 'ArrowRight' && zc > 0) p = z - 1;
            if (!/^Arrow/.test(e.key)) return;
            e.preventDefault(); e.stopPropagation();
            if (p >= 0) slideFrom(p); else if (prog.sound) beep(150, 0.07, 'square', 0.025);
        });

        // ── Indice ───────────────────────────────────────────────────────
        function clearHint() {
            Object.keys(tileEls).forEach(function (k) { tileEls[k].classList.remove('jtq-hintv'); });
            if (arrowEl) { arrowEl.remove(); arrowEl = null; }
            hintPos = -1;
        }
        function showHintAt(pos) {
            var v = S.tiles[pos], e = tileEls[v];
            if (!e) return;
            Object.keys(tileEls).forEach(function (k) { tileEls[k].classList.remove('jtq-hintv'); });
            e.classList.add('jtq-hintv');
            var z = S.tiles.indexOf(0), n = S.n, rc = tileRect(z);
            var dr = Math.floor(z / n) - Math.floor(pos / n), dc = (z % n) - (pos % n);
            if (!arrowEl) { arrowEl = el('div', 'jtq-arrow'); boardEl.appendChild(arrowEl); }
            arrowEl.textContent = dr < 0 ? '▲' : dr > 0 ? '▼' : dc < 0 ? '◀' : '▶';
            arrowEl.style.left = rc.left + 'px'; arrowEl.style.top = rc.top + 'px';
            arrowEl.style.width = rc.size + 'px'; arrowEl.style.height = rc.size + 'px';
            arrowEl.style.setProperty('--dx', (dc * 6) + 'px');
            arrowEl.style.setProperty('--dy', (dr * 6) + 'px');
            hintPos = pos;
        }
        function computePath() {
            return solve(S.tiles, S.n, SOLVER_W[S.n] || 3, S.n === 3 ? 400000 : 300000);
        }
        function hint() {
            if (S.won || S.busy) return;
            setMsg('Je réfléchis…');
            setTimeout(function () {
                var path = computePath();
                if (!path) { setMsg('Trop de possibilités : range d\'abord la première ligne !'); return; }
                if (!path.length) { setMsg(''); return; }
                S.hints++;
                showHintAt(path[0]);
                setMsg('💡 Fais glisser la pièce qui clignote vers la case vide.' + (S.n === 3 ? ' (Encore ' + path.length + ' coups au mieux.)' : ''));
                if (prog.sound) beep(880, 0.12, 'sine', 0.05);
                updateUI(); save();
            }, 30);
        }

        // ── Solution animée ──────────────────────────────────────────────
        function playSolution() {
            if (S.won || S.busy) return;
            setMsg('Je réfléchis…');
            setTimeout(function () {
                var path = computePath();
                if (!path) { setMsg('Solution introuvable, essaie l\'indice.'); return; }
                S.busy = true; S.solutionSeen = true;
                setPreview(false); clearHint(); updateUI();
                setMsg('🎬 Solution en ' + path.length + ' coup' + (path.length > 1 ? 's' : '') + '…');
                var k = 0, delay = path.length > 60 ? 140 : (path.length > 30 ? 220 : 330);
                (function step() {
                    if (!root.isConnected) return;
                    if (k >= path.length) { S.busy = false; updateUI(); return; }
                    var p = path[k++];
                    S.busy = false;
                    slideFrom(p, true);
                    if (!S.won) { S.busy = true; updateUI(); setTimeout(step, delay); }
                })();
            }, 30);
        }

        // ── Aperçu du modèle ─────────────────────────────────────────────
        function setPreview(on) {
            S.preview = !!on;
            pvEl.classList.toggle('show', S.preview);
            var b = $('.jtq-peek'); if (b) b.classList.toggle('jtq-on', S.preview);
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            S.won = true;
            clearHint(); setPreview(false);
            var st = stars(), key = recKey(), newRec = false;
            if (!S.solutionSeen) {
                if (st > (prog.stars[key] || 0)) prog.stars[key] = st;
                if (!S.hints && (!prog.best[key] || S.moves < prog.best[key])) { prog.best[key] = S.moves; newRec = true; }
                if (!S.hints && (!prog.time[key] || S.time < prog.time[key])) prog.time[key] = S.time;
                prog.wins++;
                saveProgress(prog);
            }
            // La dernière pièce apparaît et l'image se ressoude
            var last = tileEls[S.n * S.n];
            if (last) { last.style.display = ''; last.style.opacity = '0'; placeTile(S.n * S.n, S.n * S.n - 1, true); }
            setTimeout(function () {
                if (last) { last.style.transition = 'opacity .4s'; last.style.opacity = '1'; }
                boardEl.classList.add('done');
                placeAll(false);
                if (last) placeTile(S.n * S.n, S.n * S.n - 1, false);
            }, 150);
            updateUI();
            if (prog.sound) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.25 + j * 0.11); });
            // Pour le 3×3 : nombre minimum de coups depuis le mélange de départ
            var opt = null;
            if (S.n === 3) { var pth = solve(S.start, 3, 1, 400000); if (pth) opt = pth.length; }
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.jtq-win-title').textContent = S.solutionSeen ? 'Solution terminée' : (st === 3 ? 'Bravo, champion !' : 'Bravo !');
                var se = $('.jtq-win-stars');
                se.innerHTML = starHTML(st);
                se.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt;
                if (S.solutionSeen) txt = 'Tu as regardé la solution : essaie maintenant de le faire seul !';
                else {
                    txt = 'Reconstitué en <b>' + S.moves + '</b> coup' + (S.moves > 1 ? 's' : '') + ' et <b>' + fmtTime(S.time) + '</b>';
                    if (S.hints) txt += '<br>avec ' + S.hints + ' indice' + (S.hints > 1 ? 's' : '');
                    if (newRec) txt += '<br>🏆 Nouveau record !';
                    if (opt) txt += '<br><small>Le minimum possible pour ce mélange : ' + opt + ' coups' + (S.moves <= opt ? ' — tu l\'as atteint ! 🤩' : '') + '</small>';
                }
                $('.jtq-win-txt').innerHTML = txt;
                showOv('.jtq-ov-win');
                if (st >= 2) confetti();
            }, 1100);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#ff4f5e', '#22c55e', '#3ba7ff', '#9b6bff', '#ff9f1a'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jtq-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Fenêtres : réglages / victoire / aide ────────────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jtq-ov').forEach(function (o) { o.classList.remove('show'); }); }
        var pend = null;
        function openSettings() {
            pend = { lvl: S.lvl, pic: S.pic, showNum: S.showNum };
            renderSettings();
            showOv('.jtq-ov-set');
        }
        function renderSettings() {
            $('.jtq-set-lvl').innerHTML = LEVELS.map(function (L) {
                return '<button class="jtq-chip' + (L.id === pend.lvl ? ' sel' : '') + '" data-lvl="' + L.id + '">' + L.ico + ' ' + L.name + '<small>' + L.desc + '</small></button>';
            }).join('');
            var h = '<button class="jtq-pic num' + (pend.pic === 'num' ? ' sel' : '') + '" data-pic="num">1 2 3<span>Nombres</span></button>';
            PICTURES.forEach(function (P) {
                h += '<button class="jtq-pic' + (pend.pic === P.id ? ' sel' : '') + '" data-pic="' + P.id + '"><img src="' + pictureURL(P.id) + '" alt=""><span>' + P.name + '</span></button>';
            });
            h += '<button class="jtq-pic photo' + (pend.pic === 'photo' ? ' sel' : '') + '" data-pic="photo" title="Choisir une image sur l\'ordinateur">' +
                 (S.custom ? '<img src="' + S.custom + '" alt="">' : '📷') + '<span>Ma photo</span></button>';
            $('.jtq-set-pic').innerHTML = h;
            $('.jtq-set-num').checked = pend.showNum;
        }
        $('.jtq-set-lvl').addEventListener('click', function (e) {
            var b = e.target.closest('[data-lvl]'); if (!b) return;
            pend.lvl = b.dataset.lvl; renderSettings();
        });
        $('.jtq-set-pic').addEventListener('click', function (e) {
            var b = e.target.closest('[data-pic]'); if (!b) return;
            if (b.dataset.pic === 'photo' && (!S.custom || pend.pic === 'photo')) { $('.jtq-file').click(); return; }
            pend.pic = b.dataset.pic; renderSettings();
        });
        $('.jtq-set-num').addEventListener('change', function () { pend.showNum = this.checked; });
        $('.jtq-file').addEventListener('change', function () {
            var f = this.files && this.files[0];
            this.value = '';
            if (!f) return;
            var rd = new FileReader();
            rd.onload = function () {
                var img = new Image();
                img.onload = function () {
                    // Recadrage carré au centre, 600×600, en JPEG (léger pour la sauvegarde)
                    var c = document.createElement('canvas'); c.width = c.height = 600;
                    var s = Math.min(img.width, img.height);
                    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 600, 600);
                    try { S.custom = c.toDataURL('image/jpeg', 0.82); } catch (er) { return; }
                    pend.pic = 'photo';
                    renderSettings();
                };
                img.src = rd.result;
            };
            rd.readAsDataURL(f);
        });
        ['pointerdown', 'mousedown'].forEach(function (t) {
            $('.jtq-set-num').addEventListener(t, function (e) { e.stopPropagation(); });
        });
        $('.jtq-set-play').addEventListener('click', function () {
            S.lvl = pend.lvl; S.pic = pend.pic; S.showNum = pend.showNum;
            if (S.pic === 'photo' && !S.custom) S.pic = 'num';
            newGame(false);
            save();
        });

        root.addEventListener('click', function (e) {
            if (e.target.closest('.jtq-x')) { hideOv(); return; }
            if (e.target.classList.contains('jtq-ov') && !$('.jtq-ov-win').classList.contains('show')) hideOv();
        });
        $('.jtq-lvlbtn').addEventListener('click', openSettings);
        $('.jtq-undo').addEventListener('click', undo);
        $('.jtq-reset').addEventListener('click', function () { if (!S.busy) { newGame(true); save(); } });
        $('.jtq-new').addEventListener('click', function () { if (!S.busy) { newGame(false); save(); } });
        $('.jtq-hint').addEventListener('click', hint);
        $('.jtq-sol').addEventListener('click', playSolution);
        $('.jtq-peek').addEventListener('click', function () { setPreview(!S.preview); });
        pvEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); setPreview(false); });
        $('.jtq-w-replay').addEventListener('click', function () { newGame(true); save(); });
        $('.jtq-w-new').addEventListener('click', function () { newGame(false); save(); });
        $('.jtq-w-set').addEventListener('click', openSettings);
        $('.jtq-help').addEventListener('click', function () { showOv('.jtq-ov-help'); });
        $('.jtq-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });

        // ── Boutons fenêtre : réduire / plein écran / fermer ─────────────
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv(); setPreview(false);
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '🧩 Taquin', {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jtq-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jtqZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jtqZ || '';
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
        var grip = $('.jtq-grip'), rs = null;
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
        widget._jtqGetData = function () {
            return {
                lvl: S.lvl, pic: S.pic, showNum: S.showNum,
                custom: S.pic === 'photo' ? S.custom : null,
                start: S.start ? S.start.slice() : null,
                tiles: S.won ? null : S.tiles.slice(),
                moves: S.won ? 0 : S.moves, time: S.won ? 0 : S.time, hints: S.won ? 0 : S.hints,
                w: S.w, h: S.h, fullboard: S.fullboard
            };
        };

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('jtq-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        if (data.lvl) restore(data); else newGame(false);
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        // Sur téléphone, une partie lancée depuis le panneau s'ouvre directement
        // en plein écran (bouton vert), comme Simon et Rush Hour
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
    window.createJeuTaquinWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        window._jtqNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jtqNextPendingData = null;
        }
        if (w && !w._jtqInit) initTaquin(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-taquin') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jtqHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jtqInit) initTaquin(w, window._jtqNextPendingData || null);
            return w;
        };
        // Conserver les marqueurs des autres jeux qui ont déjà enveloppé createWidget
        Object.keys(orig).forEach(function (k) { wrapped[k] = orig[k]; });
        wrapped._jtqHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests
    window._jtqSolve = solve;
})();
