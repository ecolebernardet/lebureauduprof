// =========================================================================
// CACHE-ÉCRAN & SPOT — Le Bureau du Prof
// Fichier autonome : injecte son CSS, son calque plein écran et sa barre.
//
// Deux modes :
//   • Rideau : un cache opaque recouvre l'écran ; on tire ses 4 bords pour
//              dévoiler progressivement (correction, consigne…). On peut aussi
//              déplacer le cache en le faisant glisser.
//   • Spot   : tout l'écran est assombri sauf une zone (ronde ou rectangulaire)
//              qu'on déplace en glissant sur la zone sombre. La zone éclairée
//              reste utilisable (on peut écrire / cliquer à travers).
//
// 📌 Intégration dans index.html :
//   1. <script src="widget-cache.js"></script>  (après widgets.js)
//   2. Carte du panneau Outils : onclick="createCacheWidget();toggleToolsPanel()"
//
// API : createCacheWidget(mode)  → mode 'rideau' (défaut) ou 'spot'
//       closeCacheWidget()
// Raccourci : Échap ferme le cache.
// =========================================================================

(function () {

    var Z_LAYER = 12900;   // sous les barres d'outils (13000)
    var Z_BAR   = 13100;   // la barre du cache reste au-dessus de tout
    var NS      = 'http://www.w3.org/2000/svg';

    // ── CSS ──────────────────────────────────────────────────────────────
    var STYLE = `
    #cache-layer { position:fixed; inset:0; z-index:${Z_LAYER}; pointer-events:none; }
    #cache-layer * { box-sizing:border-box; }

    /* ── Rideau ── */
    .cache-curtain {
        position:absolute; pointer-events:auto; touch-action:none; cursor:move;
        background:#1F1F21;
        box-shadow:0 0 0 1px rgba(255,255,255,0.08), 0 6px 30px rgba(0,0,0,0.45);
        transition:background 0.25s;
    }
    .cache-curtain-hint {
        position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font:600 15px 'Segoe UI', system-ui, sans-serif; color:rgba(255,255,255,0.28);
        text-align:center; padding:20px; pointer-events:none; user-select:none;
    }
    .cache-curtain.cache-light .cache-curtain-hint { color:rgba(0,0,0,0.28); }
    .cache-handle {
        position:absolute; pointer-events:auto; touch-action:none;
        background:#4a90e2; border:2px solid #fff; border-radius:99px;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:12px; line-height:1; user-select:none;
        transition:transform 0.12s;
    }
    .cache-handle:hover { transform:scale(1.12); }
    .cache-handle[data-edge="top"],
    .cache-handle[data-edge="bottom"] { width:64px; height:22px; margin-left:-32px; cursor:ns-resize; }
    .cache-handle[data-edge="left"],
    .cache-handle[data-edge="right"]  { width:22px; height:64px; margin-top:-32px;  cursor:ew-resize; }
    .cache-handle[data-edge="top"]    { margin-top:-11px; }
    .cache-handle[data-edge="bottom"] { margin-top:-11px; }
    .cache-handle[data-edge="left"]   { margin-left:-11px; }
    .cache-handle[data-edge="right"]  { margin-left:-11px; }

    /* ── Spot ── */
    .cache-spot-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .cache-spot-dark { pointer-events:visiblePainted; cursor:move; touch-action:none; }
    .cache-spot-grip { pointer-events:stroke; cursor:nwse-resize; touch-action:none; }
    .cache-spot-corner { pointer-events:all; cursor:nwse-resize; touch-action:none; }

    /* ── Barre de contrôle ── */
    #cache-bar {
        position:fixed; z-index:${Z_BAR}; top:44px; left:50%; transform:translateX(-50%);
        display:flex; align-items:center; gap:8px;
        background:#1F1F21; border:1px solid #4a90e2; border-radius:12px;
        padding:6px 8px; box-shadow:0 4px 24px rgba(0,0,0,0.5);
        font:500 12px 'Segoe UI', system-ui, sans-serif; color:#ccc;
        user-select:none; touch-action:none; white-space:nowrap;
    }
    #cache-bar .cb-drag {
        width:18px; align-self:stretch; display:flex; align-items:center; justify-content:center;
        cursor:grab; opacity:0.5; border-radius:6px; background:rgba(255,255,255,0.06);
    }
    #cache-bar .cb-drag:hover { opacity:1; }
    #cache-bar .cb-sep { width:1px; align-self:stretch; background:#3a3a40; }
    #cache-bar .cb-seg { display:flex; background:#2a2a2e; border-radius:8px; padding:2px; gap:2px; }
    #cache-bar button {
        font:inherit; color:#bbb; background:#2a2a2e; border:1px solid #444;
        border-radius:7px; height:28px; padding:0 9px; cursor:pointer;
        display:flex; align-items:center; gap:5px;
    }
    #cache-bar button:hover { border-color:#4a90e2; color:#fff; }
    #cache-bar .cb-seg button { border:none; background:transparent; }
    #cache-bar .cb-seg button.active { background:#4a90e2; color:#fff; }
    #cache-bar .cb-group { display:flex; align-items:center; gap:6px; }
    #cache-bar .cb-swatch {
        width:20px; height:20px; padding:0; border-radius:50%;
        border:2px solid #1F1F21; box-shadow:0 0 0 1px #555;
    }
    #cache-bar .cb-swatch.active { box-shadow:0 0 0 2px #4a90e2; }
    #cache-bar input[type="range"] { width:80px; accent-color:#4a90e2; cursor:pointer; }
    #cache-bar .cb-close { background:#6c757d; color:#fff; border-color:#6c757d; }
    #cache-bar .cb-close:hover { background:#e74c3c; border-color:#e74c3c; }
    #cache-bar.cb-min .cb-body { display:none; }
    `;

    function injectStyle() {
        if (document.getElementById('cache-widget-style')) return;
        var s = document.createElement('style');
        s.id = 'cache-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── État ─────────────────────────────────────────────────────────────
    var layer = null, bar = null;
    var mode  = 'rideau';

    // Rideau : marges (px) entre les bords de l'écran et le cache
    var cur = { l: 0, t: 0, r: 0, b: 0, color: '#1F1F21' };
    var curEl = null, hintEl = null, handles = {};

    // Spot
    var spot = { x: 0, y: 0, r: 150, w: 420, h: 220, shape: 'rond', opacity: 0.85 };
    var svg = null, darkPath = null, ringVis = null, ringGrip = null, corner = null;

    var CURTAIN_COLORS = [
        { c: '#1F1F21', t: 'Noir' },
        { c: '#3d4a5c', t: 'Ardoise' },
        { c: '#1e3a5f', t: 'Bleu nuit' },
        { c: '#2f5d3a', t: 'Vert tableau' },
        { c: '#ffffff', t: 'Blanc' }
    ];
    var MIN_CURTAIN = 30;

    function W() { return window.innerWidth; }
    function H() { return window.innerHeight; }

    // Empêche le board (dessin, pan…) de réagir sous nos éléments
    function shield(el) {
        ['mousedown', 'touchstart', 'wheel', 'click', 'dblclick', 'contextmenu'].forEach(function (ev) {
            el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'contextmenu' });
        });
    }

    // Glisser avec les Pointer Events (souris, stylet, doigt)
    function onDrag(el, handlers) {
        el.addEventListener('pointerdown', function (e) {
            if (e.button !== undefined && e.button > 0) return;
            e.preventDefault(); e.stopPropagation();
            try { el.setPointerCapture(e.pointerId); } catch (err) {}
            var last = { x: e.clientX, y: e.clientY };
            if (handlers.start) handlers.start(e);
            function move(ev) {
                handlers.move(ev.clientX - last.x, ev.clientY - last.y, ev);
                last = { x: ev.clientX, y: ev.clientY };
            }
            function up() {
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', up);
                el.removeEventListener('pointercancel', up);
                if (handlers.end) handlers.end();
            }
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', up);
            el.addEventListener('pointercancel', up);
        });
    }

    // =====================================================================
    // RIDEAU
    // =====================================================================
    function buildCurtain() {
        curEl = document.createElement('div');
        curEl.className = 'cache-curtain';
        hintEl = document.createElement('div');
        hintEl.className = 'cache-curtain-hint';
        hintEl.textContent = 'Tirez les poignées bleues pour dévoiler';
        curEl.appendChild(hintEl);
        layer.appendChild(curEl);
        shield(curEl);

        // Déplacer tout le cache
        onDrag(curEl, {
            move: function (dx, dy) {
                if (cur.l + dx < 0) dx = -cur.l;
                if (cur.r - dx < 0) dx = cur.r;
                if (cur.t + dy < 0) dy = -cur.t;
                if (cur.b - dy < 0) dy = cur.b;
                cur.l += dx; cur.r -= dx; cur.t += dy; cur.b -= dy;
                hideHint(); renderCurtain();
            }
        });

        var arrows = { top: '&#9660;', bottom: '&#9650;', left: '&#9654;', right: '&#9664;' };
        ['top', 'bottom', 'left', 'right'].forEach(function (edge) {
            var h = document.createElement('div');
            h.className = 'cache-handle';
            h.dataset.edge = edge;
            h.innerHTML = arrows[edge];
            h.title = 'Tirer pour dévoiler';
            layer.appendChild(h);
            shield(h);
            handles[edge] = h;
            onDrag(h, {
                move: function (dx, dy) {
                    if (edge === 'top')    cur.t = clamp(cur.t + dy, 0, H() - cur.b - MIN_CURTAIN);
                    if (edge === 'bottom') cur.b = clamp(cur.b - dy, 0, H() - cur.t - MIN_CURTAIN);
                    if (edge === 'left')   cur.l = clamp(cur.l + dx, 0, W() - cur.r - MIN_CURTAIN);
                    if (edge === 'right')  cur.r = clamp(cur.r - dx, 0, W() - cur.l - MIN_CURTAIN);
                    hideHint(); renderCurtain();
                }
            });
        });
    }

    function hideHint() { if (hintEl) hintEl.style.display = 'none'; }

    function renderCurtain() {
        if (!curEl) return;
        var w = W() - cur.l - cur.r, h = H() - cur.t - cur.b;
        curEl.style.left = cur.l + 'px';  curEl.style.top = cur.t + 'px';
        curEl.style.width = w + 'px';     curEl.style.height = h + 'px';
        curEl.style.background = cur.color;
        curEl.classList.toggle('cache-light', cur.color === '#ffffff');
        // Poignées au milieu de chaque bord (décalées pour rester à l'écran)
        var cx = cur.l + w / 2, cy = cur.t + h / 2;
        place(handles.top,    cx, Math.max(cur.t, 13));
        place(handles.bottom, cx, Math.min(cur.t + h, H() - 13));
        place(handles.left,   Math.max(cur.l, 13), cy);
        place(handles.right,  Math.min(cur.l + w, W() - 13), cy);
    }

    function place(el, x, y) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function resetCurtain() {
        cur.l = cur.t = cur.r = cur.b = 0;
        if (hintEl) hintEl.style.display = '';
        renderCurtain();
    }

    // =====================================================================
    // SPOT
    // =====================================================================
    function buildSpot() {
        svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'cache-spot-svg');

        // Zone sombre = rectangle écran moins la forme (fill-rule evenodd) :
        // la zone éclairée laisse passer les clics vers le board.
        darkPath = document.createElementNS(NS, 'path');
        darkPath.setAttribute('class', 'cache-spot-dark');
        darkPath.setAttribute('fill-rule', 'evenodd');
        svg.appendChild(darkPath);

        ringVis = document.createElementNS(NS, 'path');
        ringVis.setAttribute('fill', 'none');
        ringVis.setAttribute('stroke', 'rgba(255,255,255,0.55)');
        ringVis.setAttribute('stroke-width', '2');
        ringVis.style.pointerEvents = 'none';
        svg.appendChild(ringVis);

        // Bord épais invisible pour redimensionner le rond
        ringGrip = document.createElementNS(NS, 'path');
        ringGrip.setAttribute('class', 'cache-spot-grip');
        ringGrip.setAttribute('fill', 'none');
        ringGrip.setAttribute('stroke', 'transparent');
        ringGrip.setAttribute('stroke-width', '22');
        svg.appendChild(ringGrip);

        // Poignée d'angle pour le rectangle
        corner = document.createElementNS(NS, 'circle');
        corner.setAttribute('class', 'cache-spot-corner');
        corner.setAttribute('r', '11');
        corner.setAttribute('fill', '#4a90e2');
        corner.setAttribute('stroke', '#fff');
        corner.setAttribute('stroke-width', '2');
        svg.appendChild(corner);

        layer.appendChild(svg);
        [darkPath, ringGrip, corner].forEach(shield);

        // Glisser sur la zone sombre = déplacer le spot
        onDrag(darkPath, {
            move: function (dx, dy) {
                spot.x = clamp(spot.x + dx, 0, W());
                spot.y = clamp(spot.y + dy, 0, H());
                renderSpot();
            }
        });

        // Redimensionner le rond : distance pointeur ↔ centre
        onDrag(ringGrip, {
            move: function (dx, dy, e) {
                spot.r = clamp(Math.hypot(e.clientX - spot.x, e.clientY - spot.y), 40, Math.max(W(), H()));
                renderSpot();
            }
        });

        // Redimensionner le rectangle depuis l'angle bas-droit (symétrique)
        onDrag(corner, {
            move: function (dx, dy, e) {
                spot.w = clamp(Math.abs(e.clientX - spot.x) * 2, 80, W() * 2);
                spot.h = clamp(Math.abs(e.clientY - spot.y) * 2, 50, H() * 2);
                renderSpot();
            }
        });

        // Molette sur la zone sombre = agrandir / réduire
        darkPath.addEventListener('wheel', function (e) {
            e.preventDefault();
            var k = e.deltaY < 0 ? 1.08 : 1 / 1.08;
            spot.r = clamp(spot.r * k, 40, Math.max(W(), H()));
            spot.w = clamp(spot.w * k, 80, W() * 2);
            spot.h = clamp(spot.h * k, 50, H() * 2);
            renderSpot();
        }, { passive: false });
    }

    function shapePath() {
        if (spot.shape === 'rond') {
            var r = spot.r, x = spot.x, y = spot.y;
            return 'M' + (x - r) + ',' + y
                 + ' A' + r + ',' + r + ' 0 1 0 ' + (x + r) + ',' + y
                 + ' A' + r + ',' + r + ' 0 1 0 ' + (x - r) + ',' + y + ' Z';
        }
        var w = spot.w, h = spot.h, x0 = spot.x - w / 2, y0 = spot.y - h / 2;
        var k = Math.min(18, w / 2, h / 2);
        return 'M' + (x0 + k) + ',' + y0
             + ' H' + (x0 + w - k) + ' A' + k + ',' + k + ' 0 0 1 ' + (x0 + w) + ',' + (y0 + k)
             + ' V' + (y0 + h - k) + ' A' + k + ',' + k + ' 0 0 1 ' + (x0 + w - k) + ',' + (y0 + h)
             + ' H' + (x0 + k) + ' A' + k + ',' + k + ' 0 0 1 ' + x0 + ',' + (y0 + h - k)
             + ' V' + (y0 + k) + ' A' + k + ',' + k + ' 0 0 1 ' + (x0 + k) + ',' + y0 + ' Z';
    }

    function renderSpot() {
        if (!svg) return;
        var p = shapePath();
        darkPath.setAttribute('d', 'M0,0 H' + W() + ' V' + H() + ' H0 Z ' + p);
        darkPath.setAttribute('fill', 'rgba(0,0,0,' + spot.opacity + ')');
        ringVis.setAttribute('d', p);
        ringGrip.setAttribute('d', p);
        var isRond = spot.shape === 'rond';
        ringGrip.style.display = isRond ? '' : 'none';
        corner.style.display   = isRond ? 'none' : '';
        corner.setAttribute('cx', spot.x + spot.w / 2);
        corner.setAttribute('cy', spot.y + spot.h / 2);
    }

    // =====================================================================
    // BARRE DE CONTRÔLE
    // =====================================================================
    function buildBar() {
        bar = document.createElement('div');
        bar.id = 'cache-bar';
        bar.innerHTML =
            '<div class="cb-drag" title="Déplacer">' +
                '<svg width="8" height="14" viewBox="0 0 8 14"><g fill="#aaa">' +
                '<circle cx="2" cy="2" r="1.3"/><circle cx="6" cy="2" r="1.3"/>' +
                '<circle cx="2" cy="7" r="1.3"/><circle cx="6" cy="7" r="1.3"/>' +
                '<circle cx="2" cy="12" r="1.3"/><circle cx="6" cy="12" r="1.3"/></g></svg>' +
            '</div>' +
            '<div class="cb-seg">' +
                '<button data-mode="rideau" title="Cache à dévoiler">&#x1F3AD; Rideau</button>' +
                '<button data-mode="spot" title="Projecteur">&#x1F526; Spot</button>' +
            '</div>' +
            '<div class="cb-body cb-group">' +
                '<div class="cb-sep"></div>' +
                // Options rideau
                '<div class="cb-group" data-for="rideau">' +
                    CURTAIN_COLORS.map(function (o) {
                        return '<button class="cb-swatch" data-color="' + o.c + '" title="' + o.t + '" style="background:' + o.c + '"></button>';
                    }).join('') +
                    '<button data-act="cover" title="Tout recouvrir">&#8634; Recouvrir</button>' +
                '</div>' +
                // Options spot
                '<div class="cb-group" data-for="spot">' +
                    '<div class="cb-seg">' +
                        '<button data-shape="rond" title="Spot rond">&#9679;</button>' +
                        '<button data-shape="rect" title="Spot rectangulaire">&#9644;</button>' +
                    '</div>' +
                    '<span title="Obscurité">&#x1F311;</span>' +
                    '<input type="range" data-act="opacity" min="40" max="100" value="85" title="Obscurité">' +
                    '<button data-act="center" title="Recentrer le spot">&#8982;</button>' +
                '</div>' +
            '</div>' +
            '<div class="cb-sep"></div>' +
            '<button data-act="min" title="Réduire la barre">&#8212;</button>' +
            '<button class="cb-close" data-act="close" title="Fermer (Échap)">&#10006;</button>';
        document.body.appendChild(bar);
        shield(bar);
        bar.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        bar.addEventListener('keydown', function (e) { e.stopPropagation(); });

        // Déplacement de la barre
        var drag = bar.querySelector('.cb-drag');
        onDrag(drag, {
            start: function () {
                var r = bar.getBoundingClientRect();
                bar.style.transform = 'none';
                bar.style.left = r.left + 'px'; bar.style.top = r.top + 'px';
            },
            move: function (dx, dy) {
                var r = bar.getBoundingClientRect();
                bar.style.left = clamp(r.left + dx, 0, W() - r.width) + 'px';
                bar.style.top  = clamp(r.top + dy, 0, H() - r.height) + 'px';
            }
        });

        bar.querySelectorAll('[data-mode]').forEach(function (b) {
            b.addEventListener('click', function () { setMode(b.dataset.mode); });
        });
        bar.querySelectorAll('[data-color]').forEach(function (b) {
            b.addEventListener('click', function () { cur.color = b.dataset.color; renderCurtain(); syncBar(); });
        });
        bar.querySelectorAll('[data-shape]').forEach(function (b) {
            b.addEventListener('click', function () { spot.shape = b.dataset.shape; renderSpot(); syncBar(); });
        });
        bar.querySelector('[data-act="cover"]').addEventListener('click', resetCurtain);
        bar.querySelector('[data-act="opacity"]').addEventListener('input', function (e) {
            spot.opacity = parseInt(e.target.value, 10) / 100; renderSpot();
        });
        bar.querySelector('[data-act="center"]').addEventListener('click', function () {
            spot.x = W() / 2; spot.y = H() / 2; renderSpot();
        });
        bar.querySelector('[data-act="min"]').addEventListener('click', function () {
            bar.classList.toggle('cb-min');
        });
        bar.querySelector('[data-act="close"]').addEventListener('click', closeCacheWidget);
    }

    function syncBar() {
        if (!bar) return;
        bar.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === mode); });
        bar.querySelectorAll('[data-for]').forEach(function (g) { g.style.display = g.dataset.for === mode ? 'flex' : 'none'; });
        bar.querySelectorAll('[data-color]').forEach(function (b) { b.classList.toggle('active', b.dataset.color === cur.color); });
        bar.querySelectorAll('[data-shape]').forEach(function (b) { b.classList.toggle('active', b.dataset.shape === spot.shape); });
    }

    function setMode(m) {
        mode = (m === 'spot') ? 'spot' : 'rideau';
        var isR = mode === 'rideau';
        curEl.style.display = isR ? '' : 'none';
        Object.keys(handles).forEach(function (k) { handles[k].style.display = isR ? '' : 'none'; });
        svg.style.display = isR ? 'none' : '';
        if (isR) renderCurtain(); else renderSpot();
        syncBar();
    }

    // =====================================================================
    // OUVERTURE / FERMETURE
    // =====================================================================
    function onKey(e) {
        if (e.key === 'Escape' && layer) { e.stopPropagation(); closeCacheWidget(); }
    }
    function onResize() {
        cur.t = Math.min(cur.t, Math.max(0, H() - cur.b - MIN_CURTAIN));
        cur.l = Math.min(cur.l, Math.max(0, W() - cur.r - MIN_CURTAIN));
        spot.x = clamp(spot.x, 0, W()); spot.y = clamp(spot.y, 0, H());
        renderCurtain(); renderSpot();
        if (bar) {
            var r = bar.getBoundingClientRect();
            if (r.right > W() || r.bottom > H()) {
                bar.style.left = '50%'; bar.style.top = '44px'; bar.style.transform = 'translateX(-50%)';
            }
        }
    }

    window.createCacheWidget = function (m) {
        injectStyle();
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'cache-layer';
            document.body.appendChild(layer);
            buildCurtain();
            buildSpot();
            buildBar();
            cur.l = cur.t = cur.r = cur.b = 0;
            spot.x = W() / 2; spot.y = H() / 2;
            window.addEventListener('keydown', onKey, true);
            window.addEventListener('resize', onResize);
        }
        setMode(m || mode);
    };

    window.closeCacheWidget = function () {
        if (layer) layer.remove();
        if (bar) bar.remove();
        layer = bar = curEl = hintEl = svg = null;
        handles = {};
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', onResize);
    };

})();
