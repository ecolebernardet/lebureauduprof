// =========================================================================
// WIDGET JEU : PIXEL ART — reproduire un modèle case par case
// -------------------------------------------------------------------------
// Panneau « Jeux » › rubrique « Jeux divers » (construit sur le modèle de
// widget-jeu-repro-quadrillage.js : mêmes boutons fenêtre, même sauvegarde,
// même plein écran sur téléphone).
//
// • Les modèles sont ceux du widget Pixel art (PXL_MODELES, défini dans
//   widget-pixelart.js, à charger AVANT ce fichier). Tout nouveau modèle
//   ajouté là-bas apparaît automatiquement dans le jeu.
// • À gauche le MODÈLE, à droite la grille vierge (plus grande) de l'élève.
// • Outils : pinceau (glisser pour colorier plusieurs cases), pot de
//   peinture (remplit une zone), gomme. Toucher le modèle prend sa couleur
//   (pipette).
// • Palette = les couleurs du modèle (+ couleurs pièges en option).
// • Aides : repères tous les 5 carreaux, numéros des lignes/colonnes,
//   case visée surlignée dans le modèle, contours noirs déjà coloriés.
// • Vérifier (erreurs marquées), calque, annuler (Ctrl+Z), effacer,
//   victoire automatique, étoiles et records par modèle.
// • Sauvegarde du tableau via _jpxGetData / createJeuPixelArtWidget(data)
//   (même mécanisme que le Taquin, cf. save-load.js).
// =========================================================================
(function () {
    'use strict';

    var TYPE      = 'jeu-pixel-art';
    var STORE_KEY = 'jpx-progress-v1';
    var DEF_W = 980, DEF_H = 620, MIN_W = 360, MIN_H = 420;

    // Noms et icônes des modèles connus (les autres reprennent leur clé)
    var NAMES = {
        coeur: ['Cœur', '❤️'], smiley: ['Smiley', '😊'], burger: ['Burger', '🍔'], glace: ['Glace', '🍧'],
        hellokitty: ['Hello Kitty', '😻'], mario: ['Mario', '🍄'], toad: ['Toad', '🍄'], pikachu: ['Pikachu', '⚡'],
        dracaufeu: ['Dracaufeu', '🔥'], papillon: ['Papillon', '🦋'], panda: ['Panda', '🐼']
    };
    var LEVELS = [
        { id: 'fac', name: 'Facile',    ico: '😊', cls: 'g2' },
        { id: 'moy', name: 'Moyen',     ico: '😐', cls: 'g3' },
        { id: 'dif', name: 'Difficile', ico: '😤', cls: 'g4' }
    ];
    // Couleurs « pièges » possibles (palette de base du Pixel art)
    var EXTRA_COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#78350f'];
    var COLOR_NAMES = {
        '#000000': 'Noir', '#ef4444': 'Rouge', '#f97316': 'Orange', '#eab308': 'Jaune', '#22c55e': 'Vert',
        '#3b82f6': 'Bleu', '#8b5cf6': 'Violet', '#ec4899': 'Rose', '#78350f': 'Marron', '#fadea6': 'Crème',
        '#f0ccaa': 'Peau', '#fa9e87': 'Saumon', '#ee706c': 'Saumon foncé', '#faa0a0': 'Rose clair',
        '#ff68e4': 'Magenta', '#f82870': 'Rose vif', '#fce860': 'Jaune clair', '#70f8b2': 'Menthe',
        '#008278': 'Vert-bleu', '#4e342d': 'Brun foncé', '#8b6e63': 'Brun clair', '#f0e6aa': 'Beige'
    };

    // ── Modèles (lus dans PXL_MODELES au moment de l'utilisation) ───────
    function normHex(c) {
        if (!c) return null;
        c = String(c).trim().toLowerCase();
        var m = c.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) c = '#' + [m[1], m[2], m[3]].map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('');
        if (/^#[0-9a-f]{3}$/.test(c)) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
        if (!/^#[0-9a-f]{6}$/.test(c) || c === '#ffffff') return null;   // blanc = case vide
        return c;
    }
    var _models = null, _modelsSrc = null;
    function getModels() {
        var src = (typeof PXL_MODELES !== 'undefined') ? PXL_MODELES : (window.PXL_MODELES || null);
        if (!src) return [];
        if (_models && _modelsSrc === src && Object.keys(src).length === _models.length) return _models;
        var list = [];
        Object.keys(src).forEach(function (key) {
            var m = src[key];
            if (!m || !m.size || !m.data) return;
            var n = +m.size, data = {}, cols = {};
            Object.keys(m.data).forEach(function (i) {
                var idx = +i, c = normHex(m.data[i]);
                if (c && idx >= 0 && idx < n * n) { data[idx] = c; cols[c] = (cols[c] || 0) + 1; }
            });
            var nCells = Object.keys(data).length;
            if (!nCells) return;
            var colors = Object.keys(cols).sort(function (a, b) { return cols[b] - cols[a]; });
            var score = n + colors.length * 2 + nCells / 40;
            var nm = NAMES[key] || [key.charAt(0).toUpperCase() + key.slice(1), '🎨'];
            list.push({ key: key, name: nm[0], ico: nm[1], n: n, data: data, colors: colors, cells: nCells,
                        score: score, lvl: score <= 33 ? 'fac' : (score <= 47 ? 'moy' : 'dif') });
        });
        list.sort(function (a, b) { return a.score - b.score; });
        _models = list; _modelsSrc = src;
        return list;
    }
    function modelByKey(k) { var l = getModels(); for (var i = 0; i < l.length; i++) if (l[i].key === k) return l[i]; return null; }
    function lvlById(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return LEVELS[0]; }

    // ── Progression (étoiles, records, son) ─────────────────────────────
    function loadProgress() {
        try {
            var p = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return { stars: p.stars || {}, best: p.best || {}, sound: p.sound !== false, wins: p.wins || 0 };
        } catch (e) { return { stars: {}, best: {}, sound: true, wins: 0 }; }
    }
    function saveProgress(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {} }

    function compare(target, player) {
        var r = { ok: 0, bad: {}, nBad: 0, miss: 0, total: 0 };
        Object.keys(target).forEach(function (k) {
            r.total++;
            if (player[k] === target[k]) r.ok++; else if (!player[k]) r.miss++;
        });
        Object.keys(player).forEach(function (k) { if (player[k] !== target[k]) { r.bad[k] = 1; r.nBad++; } });
        r.done = !r.nBad && !r.miss;
        return r;
    }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }

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
        if (document.getElementById('jpx-style')) return;
        var s = document.createElement('style');
        s.id = 'jpx-style';
        s.textContent = [
'.jpx-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;',
'  background:radial-gradient(ellipse at 50% 35%,#9a6bff 0%,#6d3fd6 45%,#40208f 100%);color:#fff;',
'  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12);font-family:"Nunito",sans-serif;',
'  user-select:none;-webkit-user-select:none;outline:none;--ui:1}',
'.jpx-root *{box-sizing:border-box}',
'.jpx-root.jpx-fullboard{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9999;border-radius:0}',
'.widget.phone-fs .jpx-root{width:100%!important;height:100%!important;border-radius:0}',
// En-tête
'.jpx-head{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 12px 6px 14px;cursor:move;background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,0))}',
'.jpx-title{font-weight:900;font-size:calc(21px*var(--ui));letter-spacing:.4px;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.25)}',
'.jpx-title b{color:#ffd23f}',
'.jpx-lvlbtn{white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:999px;padding:4px 12px 4px 6px;min-width:0;overflow:hidden;',
'  background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:calc(14px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);font-family:inherit}',
'.jpx-lvlbtn:hover{background:rgba(0,0,0,.4)}',
'.jpx-pill{border-radius:999px;padding:2px 9px;font-size:calc(11px*var(--ui));font-weight:900;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap}',
'.jpx-pill.g2{background:#22c55e;color:#06321a}.jpx-pill.g3{background:#38bdf8;color:#062a3a}.jpx-pill.g4{background:#f43f5e;color:#fff}',
'.jpx-spacer{flex:1}',
'.jpx-icon{width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;background:rgba(0,0,0,.25);color:#fff;font-size:15px;font-weight:900;font-family:inherit;',
'  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex-shrink:0;padding:0}',
'.jpx-icon:hover{background:rgba(0,0,0,.42)}',
// Corps
'.jpx-body{flex:1 1 auto;display:flex;min-height:0;gap:10px;padding:4px 12px 12px}',
'.jpx-root.jpx-tall .jpx-body{flex-direction:column}',
'.jpx-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;gap:calc(12px*var(--ui));position:relative}',
'.jpx-stage.col{flex-direction:column}',
'.jpx-pane{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0}',
'.jpx-pane-lbl{font-weight:900;font-size:calc(13px*var(--ui));letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:6px;height:calc(20px*var(--ui));white-space:nowrap}',
'.jpx-pane-lbl .tag{background:rgba(0,0,0,.3);border-radius:999px;padding:1px 10px}',
'.jpx-pane.mine .jpx-pane-lbl .tag{background:#ffd23f;color:#3a2a00}',
'.jpx-frame{border-radius:12px;padding:calc(6px*var(--ui));background:linear-gradient(145deg,#8a5a32,#5b3818);',
'  box-shadow:0 8px 20px rgba(0,0,0,.4),inset 0 0 0 2px rgba(255,255,255,.1),inset 0 2px 0 rgba(255,255,255,.18)}',
'.jpx-cv{display:block;border-radius:5px;background:#fff;touch-action:none}',
'.jpx-pane.model .jpx-cv{cursor:copy}',
'.jpx-pane.mine .jpx-cv{cursor:crosshair}',
'.jpx-cv.done{animation:jpxWin .6s ease}',
'@keyframes jpxWin{40%{transform:scale(1.04)}}',
'.jpx-empty{display:none;position:absolute;inset:0;align-items:center;justify-content:center;text-align:center;padding:30px;font-weight:800;font-size:16px;line-height:1.5}',
'.jpx-root.jpx-nomodels .jpx-empty{display:flex}',
'.jpx-root.jpx-nomodels .jpx-body{visibility:hidden}',
// Panneau latéral
'.jpx-side{flex:0 0 auto;display:flex;flex-direction:column;gap:calc(8px*var(--ui));justify-content:center;width:calc(236px*var(--ui))}',
'.jpx-root.jpx-tall .jpx-side{width:auto;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px}',
'.jpx-stats{display:flex;gap:6px}',
'.jpx-stat{flex:1;background:rgba(0,0,0,.25);border-radius:12px;padding:5px 4px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);min-width:calc(56px*var(--ui))}',
'.jpx-stat small{display:block;font-size:calc(10px*var(--ui));font-weight:900;letter-spacing:1px;opacity:.8;text-transform:uppercase}',
'.jpx-stat span{display:block;font-size:calc(22px*var(--ui));font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}',
'.jpx-stat.jpx-st-time span{color:#ffd23f}',
'.jpx-prog{background:rgba(0,0,0,.25);border-radius:999px;height:calc(18px*var(--ui));position:relative;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}',
'.jpx-prog i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#22c55e,#a3e635);border-radius:999px;transition:width .2s}',
'.jpx-prog span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(11px*var(--ui));font-weight:900;text-shadow:0 1px 2px rgba(0,0,0,.6)}',
'.jpx-root.jpx-tall .jpx-prog{width:calc(200px*var(--ui))}',
'.jpx-stars{text-align:center;font-size:calc(20px*var(--ui));letter-spacing:3px;line-height:1}',
'.jpx-stars .on{color:#ffd23f;text-shadow:0 0 8px rgba(255,210,63,.6)}.jpx-stars .off{color:rgba(255,255,255,.25)}',
'.jpx-box{background:rgba(0,0,0,.22);border-radius:14px;padding:calc(7px*var(--ui));display:flex;flex-direction:column;gap:calc(6px*var(--ui));box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
'.jpx-root.jpx-tall .jpx-box{flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center}',
'.jpx-tools{display:flex;gap:5px}',
'.jpx-tool{flex:1;border:none;cursor:pointer;border-radius:10px;padding:calc(5px*var(--ui)) 4px;font-family:inherit;font-weight:800;font-size:calc(12px*var(--ui));',
'  background:rgba(255,255,255,.14);color:#fff;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);white-space:nowrap}',
'.jpx-tool i{font-style:normal;font-size:calc(18px*var(--ui));line-height:1.1}',
'.jpx-tool:hover{background:rgba(255,255,255,.24)}',
'.jpx-tool.sel{background:#fff;color:#40208f;box-shadow:0 0 0 2px #ffd23f}',
'.jpx-tool.sel.gomme{background:#ffedd5;color:#9a3412}',
'.jpx-pal{display:flex;flex-wrap:wrap;gap:calc(5px*var(--ui));justify-content:center}',
'.jpx-sw{width:calc(30px*var(--ui));height:calc(30px*var(--ui));border-radius:50%;border:3px solid rgba(255,255,255,.85);cursor:pointer;padding:0;',
'  box-shadow:0 2px 0 rgba(0,0,0,.3);transition:transform .1s;position:relative;font-family:inherit}',
'.jpx-sw:hover{transform:scale(1.1)}',
'.jpx-sw.sel{transform:scale(1.18);border-color:#ffd23f;box-shadow:0 0 0 3px rgba(255,210,63,.45),0 2px 0 rgba(0,0,0,.3)}',
'.jpx-sw.sel::after{content:"✓";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(15px*var(--ui));font-weight:900;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6)}',
'.jpx-sw.sel.light::after{color:#1f2937;text-shadow:none}',
'.jpx-palname{text-align:center;font-size:calc(11px*var(--ui));font-weight:800;opacity:.85;min-height:1.2em}',
'.jpx-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
'.jpx-root.jpx-tall .jpx-btns{display:flex;flex-wrap:wrap;justify-content:center}',
'.jpx-btn{border:none;cursor:pointer;border-radius:12px;padding:calc(7px*var(--ui)) 8px;font-weight:800;font-size:calc(13px*var(--ui));font-family:inherit;',
'  color:#40208f;background:#f3eeff;box-shadow:0 3px 0 #c4b2ee;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}',
'.jpx-btn:hover{filter:brightness(1.05)}.jpx-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #c4b2ee}',
'.jpx-btn:disabled{opacity:.45;cursor:default;transform:none}',
'.jpx-btn.jpx-check{background:#ffd23f;box-shadow:0 3px 0 #c99a00;color:#3a2a00}',
'.jpx-btn.jpx-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jpx-btn.jpx-on{background:#40208f;color:#fff;box-shadow:0 3px 0 #1e0b4f}',
'.jpx-btn.wide{grid-column:1 / -1}',
'.jpx-goal{font-size:calc(12px*var(--ui));opacity:.92;text-align:center;line-height:1.3}',
'.jpx-goal b{color:#ffe48a}',
'.jpx-msg{min-height:1.3em;font-size:calc(12px*var(--ui));text-align:center;font-weight:800;color:#ffe48a;line-height:1.3}',
'.jpx-root.jpx-tall .jpx-goal{display:none}',
// Fenêtres superposées
'.jpx-ov{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(30,11,79,.8);backdrop-filter:blur(3px);padding:14px}',
'.jpx-ov.show{display:flex}',
'.jpx-card{position:relative;background:#fff;color:#123;border-radius:18px;padding:16px 18px;max-width:100%;max-height:100%;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}',
'.jpx-card h3{margin:0 0 8px;font-size:calc(22px*var(--ui));font-weight:900;color:#40208f}',
'.jpx-card h4{margin:12px 0 6px;font-size:calc(13px*var(--ui));font-weight:900;color:#40208f;text-transform:uppercase;letter-spacing:1px;text-align:left;display:flex;align-items:center;gap:8px}',
'.jpx-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(92px*var(--ui)),1fr));gap:8px}',
'.jpx-mod{border:3px solid #e4dcf8;cursor:pointer;border-radius:14px;padding:6px 4px 4px;background:#faf8ff;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;color:#40208f}',
'.jpx-mod:hover{border-color:#b9a4ee}',
'.jpx-mod.sel{border-color:#40208f;box-shadow:0 0 0 2px #ffd23f}',
'.jpx-mod canvas{width:calc(70px*var(--ui));height:calc(70px*var(--ui));image-rendering:pixelated;border-radius:6px;box-shadow:0 0 0 1px #ddd;background:#fff}',
'.jpx-mod b{font-size:calc(12px*var(--ui));font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
'.jpx-mod small{font-size:calc(10px*var(--ui));font-weight:800;opacity:.7}',
'.jpx-mod .st{font-size:calc(12px*var(--ui));letter-spacing:1px;line-height:1}',
'.jpx-mod .st .on{color:#ffc400}.jpx-mod .st .off{color:#ddd}',
'.jpx-check-l{display:flex;align-items:center;gap:6px;margin-top:7px;font-weight:700;font-size:calc(13px*var(--ui));color:#345;cursor:pointer;text-align:left}',
'.jpx-check-l input{width:18px;height:18px;accent-color:#40208f;flex-shrink:0}',
'.jpx-card .jpx-btn{box-shadow:0 3px 0 #d6cbf2;background:#f3eeff}',
'.jpx-card .jpx-btn.jpx-go{background:#22c55e;box-shadow:0 3px 0 #15803d;color:#fff}',
'.jpx-card-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}',
'.jpx-x{position:absolute;top:10px;right:10px;background:#40208f!important}',
'.jpx-win-stars{font-size:calc(44px*var(--ui));letter-spacing:6px;margin:4px 0}',
'.jpx-win-stars .on{color:#ffc400;text-shadow:0 2px 0 #c99a00;display:inline-block;animation:jpxPop .5s backwards}',
'.jpx-win-stars .off{color:#e2dbf3}',
'@keyframes jpxPop{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
'.jpx-win-txt{font-size:calc(15px*var(--ui));margin:6px 0 4px;color:#345;line-height:1.45}',
'.jpx-confetti{position:absolute;width:8px;height:12px;border-radius:2px;top:-14px;pointer-events:none;animation:jpxFall linear forwards;z-index:21}',
'@keyframes jpxFall{to{transform:translateY(110vh) rotate(720deg)}}',
// Poignée de redimensionnement
'.jpx-grip{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;z-index:15;opacity:.6;touch-action:none;',
'  background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,.55) 50%,rgba(255,255,255,.55) 60%,transparent 60%,transparent 72%,rgba(255,255,255,.55) 72%,rgba(255,255,255,.55) 82%,transparent 82%)}',
'.jpx-grip:hover{opacity:1}',
'.jpx-root.jpx-fullboard .jpx-grip,.widget.phone-fs .jpx-grip{display:none}',
// Format étroit
'.jpx-root.jpx-narrow .jpx-head{gap:6px;padding:8px 8px 6px 10px}',
'.jpx-root.jpx-narrow .jpx-title .jpx-tt{display:none}',
'.jpx-root.jpx-narrow .jpx-lvlword{display:none}',
'.jpx-root.jpx-narrow .jpx-icon{width:24px;height:24px;font-size:12px}',
'.jpx-root.jpx-narrow .jpx-help{display:none}',
'.jpx-root.jpx-narrow .jpx-tool span,.jpx-root.jpx-tall .jpx-tool span{display:none}',
'.jpx-root.jpx-tall .jpx-palname{display:none}',
'.jpx-root.jpx-tall .jpx-tool{flex:0 0 auto;padding:4px 8px}',
// Téléphone : plein écran (bouton vert) en laissant 40 px à gauche pour les onglets latéraux
'@media (max-width: 768px), (max-height: 500px) and (pointer: coarse){',
'  .jpx-root.jpx-fullboard{left:40px!important;width:calc(100vw - 40px)!important;height:100vh!important;height:100dvh!important;',
'    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0}',
'}',
'@media (prefers-reduced-motion: reduce){.jpx-root *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
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
    function starHTML(n) {
        var h = '';
        for (var i = 0; i < 3; i++) h += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
        return h;
    }
    function thumb(M) {
        var c = document.createElement('canvas');
        c.width = c.height = M.n;
        var x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, M.n, M.n);
        Object.keys(M.data).forEach(function (i) { x.fillStyle = M.data[i]; x.fillRect(i % M.n, Math.floor(i / M.n), 1, 1); });
        return c;
    }

    // =====================================================================
    // Initialisation d'un widget
    // =====================================================================
    function initPixel(widget, data) {
        if (!widget || widget._jpxInit) return;
        widget._jpxInit = true;
        injectCSS();
        injectWfButtons();
        data = data || {};

        var prog = loadProgress();
        var S = {
            key: null, M: null, n: 16, target: {}, player: {}, palette: [],
            tool: 'paint', color: null, history: [],
            five: true, coords: false, aid: true, outline: false, traps: false,
            time: 0, checks: 0, peeked: false, started: false, won: false,
            calque: false, marks: null, hover: -1,
            w: DEF_W, h: DEF_H, fullboard: false
        };

        widget.dataset.transparent = 'true';
        if (typeof applyTransparency === 'function') { try { applyTransparency(widget, true); } catch (e) {} }
        var host = widget.querySelector('.widget-content') || widget;
        if (host !== widget) { host.style.padding = '0'; host.style.background = 'transparent'; }

        // ── Construction de l'interface ─────────────────────────────────
        var root = el('div', 'jpx-root');
        root.tabIndex = 0;
        root.innerHTML =
            '<div class="jpx-head">' +
                '<div class="jpx-title">👾<span class="jpx-tt"> <b>Pixel</b> art</span></div>' +
                '<button class="jpx-lvlbtn" title="Choisir le dessin"><span class="jpx-pill"></span><span class="jpx-lvltxt"></span> ▾</button>' +
                '<div class="jpx-spacer"></div>' +
                '<div class="wf-btns">' +
                    '<button class="jpx-icon jpx-sound" title="Son"></button>' +
                    '<button class="jpx-icon jpx-help" title="Comment jouer ?">?</button>' +
                    '<button class="wf-btn wf-btn-min" title="Réduire"></button>' +
                    '<button class="wf-btn wf-btn-max" title="Plein écran"></button>' +
                    '<button class="wf-btn wf-btn-close" title="Fermer"></button>' +
                '</div>' +
            '</div>' +
            '<div class="jpx-body">' +
                '<div class="jpx-stage">' +
                    '<div class="jpx-pane model"><div class="jpx-pane-lbl"><span class="tag jpx-lbl-model">Modèle</span></div><div class="jpx-frame"><canvas class="jpx-cv jpx-cv-model" title="Touche le modèle pour prendre sa couleur"></canvas></div></div>' +
                    '<div class="jpx-pane mine"><div class="jpx-pane-lbl"><span class="tag">À toi !</span></div><div class="jpx-frame"><canvas class="jpx-cv jpx-cv-mine"></canvas></div></div>' +
                '</div>' +
                '<div class="jpx-side">' +
                    '<div class="jpx-stats">' +
                        '<div class="jpx-stat jpx-st-time"><small>Temps</small><span class="jpx-v-time">0:00</span></div>' +
                        '<div class="jpx-stat"><small>Vérif.</small><span class="jpx-v-checks">0</span></div>' +
                        '<div class="jpx-stat"><small>Record</small><span class="jpx-v-best">–</span></div>' +
                    '</div>' +
                    '<div class="jpx-prog" title="Cases coloriées"><i></i><span></span></div>' +
                    '<div class="jpx-stars"></div>' +
                    '<div class="jpx-box">' +
                        '<div class="jpx-tools">' +
                            '<button class="jpx-tool" data-tool="paint" title="Pinceau (P)"><i>🖌️</i><span>Pinceau</span></button>' +
                            '<button class="jpx-tool" data-tool="fill" title="Remplir une zone (R)"><i>🪣</i><span>Remplir</span></button>' +
                            '<button class="jpx-tool gomme" data-tool="erase" title="Gomme (G)"><i>🧽</i><span>Gomme</span></button>' +
                        '</div>' +
                        '<div class="jpx-pal"></div>' +
                        '<div class="jpx-palname"></div>' +
                    '</div>' +
                    '<div class="jpx-btns">' +
                        '<button class="jpx-btn jpx-undo" title="Annuler (Ctrl+Z)">↶ Annuler</button>' +
                        '<button class="jpx-btn jpx-clear" title="Tout effacer">🗑️ Effacer</button>' +
                        '<button class="jpx-btn jpx-check" title="Vérifier mon dessin">✔ Vérifier</button>' +
                        '<button class="jpx-btn jpx-calque" title="Voir le modèle en transparence sur ma grille">👁 Calque</button>' +
                        '<button class="jpx-btn jpx-go jpx-next wide" title="Choisir un autre dessin">🎨 Autre dessin</button>' +
                    '</div>' +
                    '<div class="jpx-goal">Colorie <b>les mêmes cases</b> que le modèle, <b>avec les mêmes couleurs</b>.</div>' +
                    '<div class="jpx-msg"></div>' +
                '</div>' +
            '</div>' +
            '<div class="jpx-empty">🎨 Aucun modèle trouvé.<br>Le jeu utilise les modèles du widget Pixel art :<br>widget-pixelart.js doit être chargé avant widget-jeu-pixel-art.js.</div>' +
            '<div class="jpx-ov jpx-ov-set"><div class="jpx-card" style="max-width:560px;"><button class="jpx-icon jpx-x">✕</button><h3>Choisis ton dessin</h3>' +
                '<div class="jpx-set-gal"></div>' +
                '<h4>Aides</h4>' +
                '<label class="jpx-check-l"><input type="checkbox" class="jpx-set-five"> Repères : lignes épaisses tous les 5 carreaux</label>' +
                '<label class="jpx-check-l"><input type="checkbox" class="jpx-set-coords"> Numéros des lignes et des colonnes</label>' +
                '<label class="jpx-check-l"><input type="checkbox" class="jpx-set-aid"> La case visée s\'allume aussi dans le modèle</label>' +
                '<label class="jpx-check-l"><input type="checkbox" class="jpx-set-outline"> Coup de pouce : les contours noirs sont déjà coloriés</label>' +
                '<label class="jpx-check-l"><input type="checkbox" class="jpx-set-traps"> Défi : ajouter des couleurs pièges dans la palette</label>' +
                '<div class="jpx-card-btns"><button class="jpx-btn jpx-go jpx-set-play">▶ Jouer</button></div></div></div>' +
            '<div class="jpx-ov jpx-ov-win"><div class="jpx-card"><h3 class="jpx-win-title">Bravo !</h3><div class="jpx-win-stars"></div><div class="jpx-win-txt"></div>' +
                '<div class="jpx-card-btns"><button class="jpx-btn jpx-w-replay">↺ Refaire ce dessin</button><button class="jpx-btn jpx-w-set">🎨 Choisir</button><button class="jpx-btn jpx-go jpx-w-next">▶ Dessin suivant</button></div></div></div>' +
            '<div class="jpx-ov jpx-ov-help"><div class="jpx-card" style="max-width:460px;text-align:left;"><button class="jpx-icon jpx-x">✕</button><h3 style="text-align:center;">Comment jouer ?</h3>' +
                '<p style="margin:6px 0;">🎯 <b>But :</b> reproduire le <b>modèle</b> (à gauche) dans <b>ta grille</b> (à droite) : mêmes cases, mêmes couleurs.</p>' +
                '<p style="margin:6px 0;">🎨 Choisis une <b>couleur</b> dans la palette (touches 1 à 9), ou <b>touche le modèle</b> pour prendre sa couleur.</p>' +
                '<p style="margin:6px 0;">🖌️ <b>Pinceau</b> : touche une case ou glisse sur plusieurs cases. Retoucher une case de la même couleur l\'efface.</p>' +
                '<p style="margin:6px 0;">🪣 <b>Remplir</b> : colorie d\'un coup toute une zone fermée.</p>' +
                '<p style="margin:6px 0;">🧽 <b>Gomme</b> : efface les cases touchées.</p>' +
                '<p style="margin:6px 0;">💡 Astuce : compte les carreaux grâce aux <b>lignes épaisses</b> (tous les 5 carreaux), commence par les contours.</p>' +
                '<p style="margin:6px 0;">⭐ 3 étoiles sans aide, 2 étoiles avec 1 ou 2 vérifications, 1 étoile avec le calque.</p></div></div>' +
            '<div class="jpx-grip" title="Redimensionner"></div>';
        host.appendChild(root);

        var $ = function (sel) { return root.querySelector(sel); };
        var stageEl = $('.jpx-stage'), cvModel = $('.jpx-cv-model'), cvMine = $('.jpx-cv-mine');

        // ── Isoler les interactions du jeu du déplacement du widget ─────
        function isolate(e) {
            if (e.target.closest('.jpx-head') && !e.target.closest('button')) return;
            e.stopPropagation();
            if ((e.type === 'pointerdown' || e.type === 'mousedown') && typeof bringToFront === 'function') {
                try { bringToFront(widget); } catch (er) {}
            }
        }
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
            root.addEventListener(t, isolate, t === 'touchstart' ? { passive: true } : false);
        });
        root.querySelectorAll('.jpx-head button').forEach(function (b) {
            ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
                b.addEventListener(t, function (e) { e.stopPropagation(); }, t === 'touchstart' ? { passive: true } : false);
            });
        });

        // ── Mise en page : la grille de l'élève est plus grande ─────────
        var RATIO = 0.74;   // taille du modèle / taille de la grille de l'élève
        function applySize() {
            if (S.fullboard || widget.classList.contains('phone-fs')) { root.style.width = ''; root.style.height = ''; }
            else { root.style.width = S.w + 'px'; root.style.height = S.h + 'px'; }
        }
        function layout() {
            var W = root.clientWidth, H = root.clientHeight;
            if (!W || !H) return;
            var ui = Math.max(0.75, Math.min(1.6, Math.min(W / DEF_W, H / DEF_H) * 1.05));
            root.style.setProperty('--ui', ui.toFixed(3));
            root.classList.toggle('jpx-narrow', W < 640);
            root.classList.toggle('jpx-tall', W < H * 1.25);
            var sw = stageEl.clientWidth, sh = stageEl.clientHeight;
            var lab = 24 * ui, gap = 12 * ui, fr = 2 * 6 * ui;
            // côte à côte : (1 + RATIO) × P + cadres + écart ≤ largeur
            var rowP = Math.min((sw - gap - 2 * fr) / (1 + RATIO), sh - lab - fr);
            // empilé : (1 + RATIO) × P + étiquettes + cadres + écart ≤ hauteur
            var colP = Math.min(sw - fr, (sh - gap - 2 * lab - 2 * fr) / (1 + RATIO));
            var col = colP > rowP * 1.08;
            var P = Math.max(120, Math.floor(col ? colP : rowP));
            stageEl.classList.toggle('col', col);
            sizeCanvas(cvMine, P);
            sizeCanvas(cvModel, Math.max(80, Math.floor(P * RATIO)));
            render();
        }
        function sizeCanvas(cv, px) {
            var dpr = Math.min(3, window.devicePixelRatio || 1);
            cv.style.width = px + 'px'; cv.style.height = px + 'px';
            var b = Math.round(px * dpr);
            if (cv.width !== b) { cv.width = b; cv.height = b; }
            cv._px = px;
        }

        // ── Dessin des grilles (canvas) ──────────────────────────────────
        function geo(cv) {
            var W = cv.width, pad = S.coords ? Math.round(W * 0.06) : Math.round(W * 0.012);
            var inner = W - pad - Math.round(W * 0.012);
            return { pad: pad, cell: inner / S.n, W: W };
        }
        function draw(cv, cells, o) {
            var x = cv.getContext('2d'), g = geo(cv), n = S.n, c = g.cell, p = g.pad;
            x.setTransform(1, 0, 0, 1, 0, 0);
            x.clearRect(0, 0, g.W, g.W);
            x.fillStyle = '#fff'; x.fillRect(0, 0, g.W, g.W);
            // bandes de repérage
            if (o.band != null && o.band >= 0) {
                var br = Math.floor(o.band / n), bc = o.band % n;
                x.fillStyle = 'rgba(250,204,21,.22)';
                x.fillRect(p, p + br * c, n * c, c);
                x.fillRect(p + bc * c, p, c, n * c);
            }
            // cases
            Object.keys(cells).forEach(function (k) {
                var i = +k;
                x.fillStyle = cells[k];
                x.fillRect(p + (i % n) * c, p + Math.floor(i / n) * c, Math.ceil(c), Math.ceil(c));
            });
            // calque
            if (o.ghost) {
                x.globalAlpha = 0.38;
                Object.keys(o.ghost).forEach(function (k) {
                    if (cells[k] === o.ghost[k]) return;
                    var i = +k;
                    x.fillStyle = o.ghost[k];
                    x.fillRect(p + (i % n) * c + c * 0.18, p + Math.floor(i / n) * c + c * 0.18, c * 0.64, c * 0.64);
                });
                x.globalAlpha = 1;
            }
            // quadrillage
            var thin = Math.max(1, g.W / 900), thick = Math.max(2, g.W / 300);
            x.beginPath();
            for (var j = 1; j < n; j++) {
                if (S.five && j % 5 === 0) continue;
                x.moveTo(p + j * c, p); x.lineTo(p + j * c, p + n * c);
                x.moveTo(p, p + j * c); x.lineTo(p + n * c, p + j * c);
            }
            x.strokeStyle = 'rgba(100,116,139,.38)'; x.lineWidth = thin; x.stroke();
            if (S.five) {
                x.beginPath();
                for (j = 5; j < n; j += 5) {
                    x.moveTo(p + j * c, p); x.lineTo(p + j * c, p + n * c);
                    x.moveTo(p, p + j * c); x.lineTo(p + n * c, p + j * c);
                }
                x.strokeStyle = 'rgba(64,32,143,.75)'; x.lineWidth = thick; x.stroke();
            }
            x.strokeStyle = '#334155'; x.lineWidth = thick; x.strokeRect(p, p, n * c, n * c);
            // erreurs
            if (o.marks) {
                x.lineCap = 'round';
                Object.keys(o.marks).forEach(function (k) {
                    var i = +k, cx = p + (i % n) * c, cy = p + Math.floor(i / n) * c, m = c * 0.22;
                    [['#fff', Math.max(3, c * 0.3)], ['#dc2626', Math.max(2, c * 0.16)]].forEach(function (st) {
                        x.beginPath();
                        x.moveTo(cx + m, cy + m); x.lineTo(cx + c - m, cy + c - m);
                        x.moveTo(cx + c - m, cy + m); x.lineTo(cx + m, cy + c - m);
                        x.strokeStyle = st[0]; x.lineWidth = st[1]; x.stroke();
                    });
                });
            }
            // case visée
            if (o.hl != null && o.hl >= 0) {
                x.strokeStyle = '#f59e0b'; x.lineWidth = Math.max(2, c * 0.14);
                x.strokeRect(p + (o.hl % n) * c, p + Math.floor(o.hl / n) * c, c, c);
            }
            // numéros
            if (S.coords) {
                var step = n > 20 ? 5 : 1;
                x.fillStyle = '#64748b'; x.textAlign = 'center'; x.textBaseline = 'middle';
                x.font = '800 ' + Math.max(7, Math.min(p * 0.62, c * (step === 1 ? 0.62 : 1.1))) + 'px Nunito, sans-serif';
                for (j = 0; j < n; j++) {
                    if (step > 1 && (j + 1) % step && j !== 0) continue;
                    x.fillText(String(j + 1), p + (j + 0.5) * c, p / 2);
                    x.fillText(String(j + 1), p / 2, p + (j + 0.5) * c);
                }
            }
        }
        function render() {
            if (!S.M || !cvMine.width) return;
            var hv = S.hover;
            draw(cvModel, S.target, { band: S.aid ? hv : -1, hl: S.aid ? hv : -1 });
            draw(cvMine, S.player, { ghost: S.calque ? S.target : null, marks: S.marks, hl: hv });
        }

        // ── Palette et outils ────────────────────────────────────────────
        function renderTools() {
            root.querySelectorAll('.jpx-tool').forEach(function (b) { b.classList.toggle('sel', b.dataset.tool === S.tool); });
            $('.jpx-pal').innerHTML = S.palette.map(function (h, i) {
                return '<button class="jpx-sw' + (h === S.color ? ' sel' : '') + (lum(h) > 0.75 ? ' light' : '') + '" data-col="' + h + '" title="' + (COLOR_NAMES[h] || h) + ' (' + (i + 1) + ')" style="background:' + h + '"></button>';
            }).join('');
            $('.jpx-palname').textContent = S.tool === 'erase' ? 'Gomme' : (S.color ? 'Couleur : ' + (COLOR_NAMES[S.color] || S.color) : '');
            cvMine.style.cursor = S.tool === 'erase' ? 'cell' : 'crosshair';
        }
        function setTool(t) { S.tool = t; renderTools(); }
        function setColor(h) {
            if (S.palette.indexOf(h) < 0) return;
            S.color = h;
            if (S.tool === 'erase') S.tool = 'paint';
            renderTools();
        }

        // ── Nouvelle partie ──────────────────────────────────────────────
        function startModel(key, keepPlayer) {
            var M = modelByKey(key) || getModels()[0];
            root.classList.toggle('jpx-nomodels', !M);
            if (!M) { S.M = null; updateUI(); return; }
            S.key = M.key; S.M = M; S.n = M.n;
            S.target = Object.assign({}, M.data);
            S.palette = M.colors.slice();
            if (S.traps) {
                var extra = shuffle(EXTRA_COLORS.filter(function (h) { return S.palette.indexOf(h) < 0; })).slice(0, 3);
                S.palette = S.palette.concat(extra);
                shuffle(S.palette);
            }
            if (S.palette.indexOf(S.color) < 0) S.color = M.colors[0];
            if (!keepPlayer) {
                S.player = {};
                if (S.outline) Object.keys(S.target).forEach(function (k) { if (S.target[k] === '#000000') S.player[k] = '#000000'; });
                S.history = []; S.time = 0; S.checks = 0; S.peeked = false; S.started = false;
            }
            S.won = false; S.calque = false; S.marks = null; S.hover = -1;
            hideOv();
            $('.jpx-lbl-model').textContent = 'Modèle · ' + M.name;
            renderTools(); updateUI(); layout();
            requestAnimationFrame(layout);
            setMsg('');
        }
        function nextKey() {
            var l = getModels(), i = 0;
            for (; i < l.length; i++) if (l[i].key === S.key) break;
            return l[(i + 1) % l.length] ? l[(i + 1) % l.length].key : null;
        }

        function stars() {
            if (S.peeked) return 1;
            return S.checks === 0 ? 3 : (S.checks <= 2 ? 2 : 1);
        }
        function updateUI() {
            var sb = $('.jpx-sound');
            sb.textContent = prog.sound ? '🔊' : '🔇';
            sb.title = prog.sound ? 'Couper le son' : 'Activer le son';
            if (!S.M) return;
            var L = lvlById(S.M.lvl), pill = $('.jpx-pill');
            pill.className = 'jpx-pill ' + L.cls; pill.textContent = L.name;
            $('.jpx-lvltxt').innerHTML = S.M.ico + '<span class="jpx-lvlword"> ' + S.M.name + '</span> · ' + S.n + '×' + S.n;
            $('.jpx-v-time').textContent = fmtTime(S.time);
            $('.jpx-v-checks').textContent = S.checks;
            var best = prog.best[S.key];
            $('.jpx-v-best').textContent = best ? fmtTime(best) : '–';
            $('.jpx-stars').innerHTML = starHTML(prog.stars[S.key] || 0);
            var nb = Object.keys(S.player).length, tot = S.M.cells;
            $('.jpx-prog i').style.width = Math.min(100, Math.round(nb / tot * 100)) + '%';
            $('.jpx-prog span').textContent = nb + ' / ' + tot + ' cases coloriées';
            $('.jpx-undo').disabled = !S.history.length || S.won;
            $('.jpx-clear').disabled = !nb || S.won;
            $('.jpx-check').disabled = !nb || S.won;
            $('.jpx-calque').disabled = S.won;
            $('.jpx-calque').classList.toggle('jpx-on', S.calque);
        }
        function setMsg(t) { $('.jpx-msg').innerHTML = t || ''; }
        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }

        // ── Chronomètre ──────────────────────────────────────────────────
        var timer = setInterval(function () {
            if (!root.isConnected) { if (!widget.isConnected) clearInterval(timer); return; }
            if (S.started && !S.won && root.offsetParent !== null && !root.querySelector('.jpx-ov.show')) {
                S.time++;
                $('.jpx-v-time').textContent = fmtTime(S.time);
            }
        }, 1000);

        // ── Saisie sur la grille ─────────────────────────────────────────
        function cellAt(cv, e) {
            var r = cv.getBoundingClientRect();
            if (!r.width) return -1;
            var g = geo(cv), k = cv.width / r.width;
            var px = (e.clientX - r.left) * k - g.pad, py = (e.clientY - r.top) * k - g.pad;
            var col = Math.floor(px / g.cell), row = Math.floor(py / g.cell);
            if (col < 0 || row < 0 || col >= S.n || row >= S.n) return -1;
            return row * S.n + col;
        }
        function pushHistory() {
            S.history.push(JSON.stringify(S.player));
            if (S.history.length > 200) S.history.shift();
        }
        function changed() {
            S.marks = null;
            if (!S.started) S.started = true;
            render(); updateUI();
            if (compare(S.target, S.player).done) win(); else save();
        }
        function setCell(i, mode) {
            if (mode === 'erase') { if (!S.player[i]) return false; delete S.player[i]; return true; }
            if (S.player[i] === S.color) return false;
            S.player[i] = S.color; return true;
        }
        function flood(i) {
            var n = S.n, from = S.player[i] || null, to = S.color;
            if (from === to) return 0;
            var stack = [i], seen = {}, count = 0;
            while (stack.length) {
                var k = stack.pop();
                if (seen[k]) continue; seen[k] = 1;
                if ((S.player[k] || null) !== from) continue;
                S.player[k] = to; count++;
                var r = Math.floor(k / n), c = k % n;
                if (r > 0) stack.push(k - n); if (r < n - 1) stack.push(k + n);
                if (c > 0) stack.push(k - 1); if (c < n - 1) stack.push(k + 1);
            }
            return count;
        }

        var ptr = null;
        cvMine.addEventListener('pointerdown', function (e) {
            if (!S.M || S.won || (e.button != null && e.button > 0)) return;
            e.preventDefault(); e.stopPropagation();
            root.focus({ preventScroll: true });
            var i = cellAt(cvMine, e); if (i < 0) return;
            try { cvMine.setPointerCapture(e.pointerId); } catch (er) {}
            if (S.tool === 'fill') {
                pushHistory();
                var cnt = flood(i);
                if (cnt) { if (prog.sound) beep(380, 0.12, 'triangle', 0.05); changed(); }
                else S.history.pop();
                if (cnt > S.n * S.n * 0.6) setMsg('🪣 Oups, la zone n\'était pas fermée : ↶ Annuler pour revenir en arrière.');
                return;
            }
            pushHistory();
            var mode = S.tool === 'erase' ? 'erase' : (S.player[i] === S.color ? 'erase' : 'paint');
            var did = setCell(i, mode);
            ptr = { id: e.pointerId, mode: mode, last: i, did: did };
            if (did) { if (prog.sound) beep(mode === 'erase' ? 320 : 460 + Math.random() * 60, 0.04, 'triangle', 0.04); changed(); }
        });
        cvMine.addEventListener('pointermove', function (e) {
            var i = cellAt(cvMine, e);
            if (i !== S.hover) { S.hover = i; if (!ptr) render(); }
            if (!ptr || e.pointerId !== ptr.id || i < 0 || i === ptr.last) return;
            ptr.last = i;
            if (setCell(i, ptr.mode)) {
                ptr.did = true;
                if (prog.sound) beep(460 + Math.random() * 80, 0.03, 'triangle', 0.03);
                changed();
            }
        });
        function endPtr(e) {
            if (!ptr || e.pointerId !== ptr.id) return;
            if (!ptr.did && S.history.length) S.history.pop();
            ptr = null; updateUI();
        }
        cvMine.addEventListener('pointerup', endPtr);
        cvMine.addEventListener('pointercancel', endPtr);
        cvMine.addEventListener('pointerleave', function () { if (!ptr) { S.hover = -1; render(); } });
        // Pipette : toucher le modèle prend sa couleur
        cvModel.addEventListener('pointerdown', function (e) {
            if (!S.M) return;
            e.preventDefault(); e.stopPropagation();
            var i = cellAt(cvModel, e); if (i < 0) return;
            var h = S.target[i];
            if (h) {
                setColor(h);
                if (prog.sound) beep(800, 0.05, 'sine', 0.04);
            } else { setTool('erase'); }
        });

        function undo() {
            if (!S.history.length || S.won) return;
            S.player = JSON.parse(S.history.pop());
            S.marks = null;
            if (prog.sound) beep(300, 0.06, 'sine', 0.05);
            render(); updateUI(); save();
        }
        function clearAll() {
            if (!Object.keys(S.player).length || S.won) return;
            pushHistory();
            S.player = {}; S.marks = null;
            render(); updateUI(); save();
            setMsg('Grille effacée (↶ Annuler pour revenir en arrière).');
        }

        // ── Vérifier / calque ────────────────────────────────────────────
        function check() {
            if (S.won || !S.M || !Object.keys(S.player).length) return;
            var r = compare(S.target, S.player);
            if (r.done) { win(); return; }
            S.checks++;
            S.marks = r.bad;
            render(); updateUI(); save();
            var parts = ['✔ ' + r.ok + ' bonne' + (r.ok > 1 ? 's' : '') + ' case' + (r.ok > 1 ? 's' : '')];
            if (r.nBad) parts.push('✖ ' + r.nBad + ' erreur' + (r.nBad > 1 ? 's' : '') + ' (en rouge)');
            if (r.miss) parts.push('il manque ' + r.miss + ' case' + (r.miss > 1 ? 's' : ''));
            setMsg(parts.join(' · '));
            if (prog.sound) { if (r.nBad) beep(200, 0.15, 'square', 0.03); else beep(660, 0.1, 'sine', 0.05); }
        }
        function toggleCalque() {
            if (S.won || !S.M) return;
            S.calque = !S.calque;
            if (S.calque && !S.peeked) { S.peeked = true; setMsg('👁 Le calque montre le modèle sur ta grille (1 étoile maximum).'); }
            render(); updateUI(); save();
        }

        // ── Victoire ─────────────────────────────────────────────────────
        function win() {
            S.won = true; S.calque = false; S.marks = null; S.hover = -1;
            render();
            cvMine.classList.remove('done'); void cvMine.offsetWidth; cvMine.classList.add('done');
            var st = stars(), key = S.key, newRec = false;
            if (st > (prog.stars[key] || 0)) prog.stars[key] = st;
            if (!S.peeked && !S.outline && (!prog.best[key] || S.time < prog.best[key])) { prog.best[key] = Math.max(1, S.time); newRec = true; }
            prog.wins++;
            saveProgress(prog);
            updateUI();
            if (prog.sound) [523, 659, 784, 1047].forEach(function (f, j) { beep(f, 0.18, 'triangle', 0.07, 0.1 + j * 0.11); });
            setTimeout(function () {
                if (!root.isConnected) return;
                $('.jpx-win-title').textContent = (st === 3 ? 'Bravo, artiste ! ' : 'Bravo ! ') + S.M.ico;
                var se = $('.jpx-win-stars');
                se.innerHTML = starHTML(st);
                se.querySelectorAll('.on').forEach(function (s, j) { s.style.animationDelay = (j * 0.18) + 's'; });
                var txt = '<b>' + S.M.name + '</b> reproduit en <b>' + fmtTime(S.time) + '</b>';
                if (S.checks) txt += '<br>avec ' + S.checks + ' vérification' + (S.checks > 1 ? 's' : '');
                if (S.peeked) txt += '<br>avec le calque — essaie sans la prochaine fois !';
                if (S.outline) txt += '<br><small>(avec les contours déjà coloriés)</small>';
                if (newRec) txt += '<br>🏆 Nouveau record !';
                $('.jpx-win-txt').innerHTML = txt;
                showOv('.jpx-ov-win');
                if (st >= 2) confetti();
            }, 700);
            save();
        }
        function confetti() {
            var cols = ['#ffd23f', '#ff4f5e', '#22c55e', '#3ba7ff', '#9b6bff', '#ff9f1a'];
            for (var i = 0; i < 40; i++) {
                var c = el('div', 'jpx-confetti');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[i % cols.length];
                c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                root.appendChild(c);
                (function (cc) { setTimeout(function () { cc.remove(); }, 3800); })(c);
            }
        }

        // ── Fenêtres : choix du dessin / victoire / aide ─────────────────
        function showOv(sel) { hideOv(); $(sel).classList.add('show'); }
        function hideOv() { root.querySelectorAll('.jpx-ov').forEach(function (o) { o.classList.remove('show'); }); }
        var pend = null;
        function openSettings() {
            var l = getModels();
            if (!l.length) { root.classList.add('jpx-nomodels'); return; }
            pend = { key: S.key || l[0].key, five: S.five, coords: S.coords, aid: S.aid, outline: S.outline, traps: S.traps };
            var h = '';
            LEVELS.forEach(function (L) {
                var ms = l.filter(function (M) { return M.lvl === L.id; });
                if (!ms.length) return;
                h += '<h4><span class="jpx-pill ' + L.cls + '">' + L.ico + ' ' + L.name + '</span></h4><div class="jpx-gal">';
                ms.forEach(function (M) {
                    h += '<button class="jpx-mod" data-key="' + M.key + '"><span class="th" data-key="' + M.key + '"></span><b>' + M.ico + ' ' + M.name + '</b>' +
                         '<small>' + M.n + '×' + M.n + ' · ' + M.colors.length + ' coul.</small><span class="st">' + starHTML(prog.stars[M.key] || 0) + '</span></button>';
                });
                h += '</div>';
            });
            var gal = $('.jpx-set-gal');
            gal.innerHTML = h;
            gal.querySelectorAll('.th').forEach(function (sp) { sp.replaceWith(thumb(modelByKey(sp.dataset.key))); });
            ['five', 'coords', 'aid', 'outline', 'traps'].forEach(function (k) { $('.jpx-set-' + k).checked = pend[k]; });
            markSel();
            showOv('.jpx-ov-set');
        }
        function markSel() {
            root.querySelectorAll('.jpx-mod').forEach(function (b) { b.classList.toggle('sel', b.dataset.key === pend.key); });
        }
        $('.jpx-set-gal').addEventListener('click', function (e) {
            var b = e.target.closest('[data-key]'); if (!b) return;
            pend.key = b.dataset.key; markSel();
        });
        $('.jpx-set-gal').addEventListener('dblclick', function (e) {
            var b = e.target.closest('[data-key]'); if (!b) return;
            pend.key = b.dataset.key; $('.jpx-set-play').click();
        });
        ['five', 'coords', 'aid', 'outline', 'traps'].forEach(function (k) {
            var inp = $('.jpx-set-' + k);
            inp.addEventListener('change', function () { pend[k] = this.checked; });
            ['pointerdown', 'mousedown'].forEach(function (t) { inp.addEventListener(t, function (e) { e.stopPropagation(); }); });
        });
        $('.jpx-set-play').addEventListener('click', function () {
            var sameModel = pend.key === S.key && !S.won;
            var onlyView = sameModel && pend.outline === S.outline && pend.traps === S.traps;
            S.five = pend.five; S.coords = pend.coords; S.aid = pend.aid;
            if (onlyView) { hideOv(); render(); save(); return; }   // simples réglages d'affichage : on garde la partie
            S.outline = pend.outline; S.traps = pend.traps;
            startModel(pend.key, false);
            save();
        });

        root.addEventListener('click', function (e) {
            if (e.target.closest('.jpx-x')) { hideOv(); return; }
            if (e.target.classList.contains('jpx-ov') && !$('.jpx-ov-win').classList.contains('show')) hideOv();
        });
        $('.jpx-lvlbtn').addEventListener('click', openSettings);
        $('.jpx-tools').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
        $('.jpx-pal').addEventListener('click', function (e) { var b = e.target.closest('[data-col]'); if (b) setColor(b.dataset.col); });
        $('.jpx-undo').addEventListener('click', undo);
        $('.jpx-clear').addEventListener('click', clearAll);
        $('.jpx-check').addEventListener('click', check);
        $('.jpx-calque').addEventListener('click', toggleCalque);
        $('.jpx-next').addEventListener('click', openSettings);
        $('.jpx-w-replay').addEventListener('click', function () { startModel(S.key, false); save(); });
        $('.jpx-w-next').addEventListener('click', function () { var k = nextKey(); if (k) { startModel(k, false); save(); } });
        $('.jpx-w-set').addEventListener('click', openSettings);
        $('.jpx-help').addEventListener('click', function () { showOv('.jpx-ov-help'); });
        $('.jpx-sound').addEventListener('click', function () { prog.sound = !prog.sound; saveProgress(prog); updateUI(); });

        // Clavier : Ctrl+Z, 1-9 pour la couleur, P/R/G pour les outils, Échap
        root.addEventListener('keydown', function (e) {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); e.stopPropagation(); return; }
            if (e.key === 'Escape') { hideOv(); return; }
            if (root.querySelector('.jpx-ov.show') || e.ctrlKey || e.metaKey || e.altKey) return;
            if (/^[1-9]$/.test(e.key) && S.palette[+e.key - 1]) { setColor(S.palette[+e.key - 1]); e.preventDefault(); e.stopPropagation(); return; }
            var t = { p: 'paint', r: 'fill', g: 'erase' }[e.key.toLowerCase()];
            if (t) { setTool(t); e.preventDefault(); e.stopPropagation(); }
        });

        // ── Boutons fenêtre : réduire / plein écran / fermer ─────────────
        $('.wf-btn-min').addEventListener('click', function (e) {
            e.stopPropagation();
            if (S.fullboard) $('.wf-btn-max').click();
            if (widget.classList.contains('phone-fs') && typeof window.exitPhoneFullscreen === 'function') window.exitPhoneFullscreen(widget);
            hideOv();
            root.style.display = 'none';
            window._wfMiniBarCollapse(widget, '👾 Pixel art' + (S.M ? ' · ' + S.M.name : ''), {
                onExpand: function () { root.style.display = ''; applySize(); requestAnimationFrame(layout); }
            });
        });
        $('.wf-btn-max').addEventListener('click', function (e) {
            e.stopPropagation();
            S.fullboard = !S.fullboard;
            root.classList.toggle('jpx-fullboard', S.fullboard);
            if (S.fullboard) { widget.dataset.jpxZ = widget.style.zIndex || ''; widget.style.zIndex = '9999'; }
            else widget.style.zIndex = widget.dataset.jpxZ || '';
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
        var grip = $('.jpx-grip'), rs = null;
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
        widget._jpxGetData = function () {
            return {
                v: 1, key: S.key, player: S.won ? null : Object.assign({}, S.player), color: S.color, tool: S.tool,
                five: S.five, coords: S.coords, aid: S.aid, outline: S.outline, traps: S.traps, palette: S.palette.slice(),
                time: S.won ? 0 : S.time, checks: S.won ? 0 : S.checks, peeked: S.won ? false : S.peeked,
                w: S.w, h: S.h, fullboard: S.fullboard
            };
        };
        function restore(d) {
            ['five', 'coords', 'aid', 'outline', 'traps'].forEach(function (k) { if (typeof d[k] === 'boolean') S[k] = d[k]; });
            if (d.tool) S.tool = d.tool;
            if (d.color) S.color = d.color;
            var M = modelByKey(d.key);
            if (!M) { startModel(null, false); return; }
            startModel(M.key, false);
            // Palette (avec ses éventuelles couleurs pièges) et dessin en cours
            if (Array.isArray(d.palette) && M.colors.every(function (c) { return d.palette.indexOf(c) >= 0; })) {
                S.palette = d.palette.map(normHex).filter(Boolean);
                if (d.color && S.palette.indexOf(d.color) >= 0) S.color = d.color;
            }
            if (d.player && typeof d.player === 'object') {
                S.player = {};
                Object.keys(d.player).forEach(function (k) {
                    var i = +k, c = normHex(d.player[k]);
                    if (c && i >= 0 && i < M.n * M.n) S.player[i] = c;
                });
                if (compare(S.target, S.player).done) S.player = {};
                S.time = +d.time || 0; S.checks = +d.checks || 0; S.peeked = !!d.peeked;
                S.started = Object.keys(S.player).length > 0;
            }
            renderTools(); updateUI(); render();
        }

        // ── État initial ─────────────────────────────────────────────────
        if (data.w) S.w = Math.max(MIN_W, +data.w || DEF_W);
        if (data.h) S.h = Math.max(MIN_H, +data.h || DEF_H);
        if (data.fullboard) { S.fullboard = true; root.classList.add('jpx-fullboard'); widget.style.zIndex = '9999'; }
        applySize();
        updateUI();
        if (data.key) restore(data);
        else {
            startModel((getModels()[0] || {}).key, false);
            if (getModels().length) setTimeout(openSettings, 60);   // on commence par choisir un dessin
        }
        requestAnimationFrame(layout);
        setTimeout(layout, 120);

        // Sur téléphone, une partie lancée depuis le panneau s'ouvre directement
        // en plein écran (bouton vert), comme le Taquin
        if (!data.key && isPhone() && !S.fullboard) {
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
    window.createJeuPixelArtWidget = function (data) {
        var restored = !!data;
        var payload = (data && !data._restored) ? data : null;
        window._jpxNextPendingData = payload;
        var w;
        try {
            w = restored ? createWidget(TYPE, '100px', '100px', false) : createWidget(TYPE);
        } finally {
            window._jpxNextPendingData = null;
        }
        if (w && !w._jpxInit) initPixel(w, payload);
        return w;
    };

    // Intercepter createWidget('jeu-pixel-art') pour y construire le jeu
    function hookCreateWidget() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jpxHooked) return;
        var orig = window.createWidget;
        var wrapped = function (type) {
            var w = orig.apply(this, arguments);
            if (type === TYPE && w && !w._jpxInit) initPixel(w, window._jpxNextPendingData || null);
            return w;
        };
        // Conserver les marqueurs des autres jeux qui ont déjà enveloppé createWidget
        Object.keys(orig).forEach(function (k) { wrapped[k] = orig[k]; });
        wrapped._jpxHooked = true;
        window.createWidget = wrapped;
    }
    hookCreateWidget();
    document.addEventListener('DOMContentLoaded', hookCreateWidget);

    // Accès pour les tests
    window._jpxTest = { getModels: getModels, compare: compare };
})();
