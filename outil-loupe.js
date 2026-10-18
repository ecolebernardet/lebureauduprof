// =========================================================================
// LOUPE — Le Bureau du Prof
// Fichier autonome : injecte son CSS et sa loupe flottante.
//
// Principe : on photographie l'écran (html2canvas, déjà utilisé par le
// Bureau du Prof, chargé à la demande depuis cdnjs), puis la loupe affiche
// la zone située sous elle, agrandie. La loupe elle-même est exclue de la
// photo. Bouton 🔄 (ou touche R) pour reprendre la photo après une
// modification du board.
//
// 📌 Intégration dans index.html :
//   1. <script src="widget-loupe.js"></script>  (après widgets.js)
//   2. Carte du panneau Outils : onclick="createLoupeWidget();toggleToolsPanel()"
//
// API : createLoupeWidget() / closeLoupeWidget()
// Raccourcis (loupe ouverte) : + / − zoom, R actualiser, Échap fermer.
// Limite : le contenu des iframes (YouTube, sites web…) apparaît vide.
// =========================================================================

(function () {

    var Z_LOUPE   = 13050;
    var H2C_URL   = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    var ZOOMS     = [1.5, 2, 2.5, 3, 4, 5];
    var MIN_D     = 120, MAX_D = 640;

    // Éléments d'interface du board à ne pas photographier
    var HIDE_SELECTORS = '.anchor-badge,.drag-handle,.widget-action-bar,.widget-rotate-handle,'
                       + '.custom-resize-handle,.flip-h-btn,.flip-v-btn,.resize-lock-btn,'
                       + '#selection-controls,#pres-limit-line';

    var STYLE = `
    #loupe-root {
        position:fixed; z-index:${Z_LOUPE}; left:0; top:0; width:0; height:0;
        font:600 12px 'Segoe UI', system-ui, sans-serif; user-select:none;
    }
    #loupe-root .lp-lens {
        position:absolute; border-radius:50%; overflow:hidden; cursor:move; touch-action:none;
        background:#fff;
        box-shadow:0 0 0 6px #2a2a2e, 0 0 0 8px #4a90e2, 0 10px 34px rgba(0,0,0,0.45);
    }
    #loupe-root .lp-lens canvas { position:absolute; inset:0; width:100%; height:100%; display:block; }
    #loupe-root .lp-glass {
        position:absolute; inset:0; border-radius:50%; pointer-events:none;
        background:radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28), rgba(255,255,255,0) 38%);
        box-shadow:inset 0 0 18px rgba(0,0,0,0.25);
    }
    #loupe-root .lp-cross {
        position:absolute; left:50%; top:50%; width:14px; height:14px; margin:-7px 0 0 -7px;
        pointer-events:none; opacity:0.35;
        background:linear-gradient(#000,#000) center/1px 100% no-repeat,
                   linear-gradient(#000,#000) center/100% 1px no-repeat;
    }
    #loupe-root .lp-msg {
        position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        text-align:center; padding:18%; color:#555; background:rgba(255,255,255,0.85);
        pointer-events:none; font-size:13px;
    }
    #loupe-root .lp-handle {
        position:absolute; width:16px; height:58px; border-radius:8px; pointer-events:none;
        background:linear-gradient(90deg,#1c1c1f,#3a3a40,#1c1c1f);
        transform-origin:50% 0; box-shadow:0 4px 12px rgba(0,0,0,0.35);
    }
    #loupe-root .lp-knob {
        position:absolute; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%;
        background:#4a90e2; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.4);
        cursor:nwse-resize; touch-action:none;
    }
    #loupe-root .lp-bar {
        position:absolute; display:flex; align-items:center; gap:4px; transform:translateX(-50%);
        background:#1F1F21; border:1px solid #4a90e2; border-radius:10px; padding:4px 6px;
        box-shadow:0 4px 18px rgba(0,0,0,0.45); color:#ddd; white-space:nowrap;
    }
    #loupe-root .lp-bar button {
        font:inherit; height:26px; min-width:26px; padding:0 7px; border-radius:6px; cursor:pointer;
        background:#2a2a2e; color:#ccc; border:1px solid #444;
    }
    #loupe-root .lp-bar button:hover { border-color:#4a90e2; color:#fff; }
    #loupe-root .lp-bar .lp-zoom { min-width:34px; text-align:center; color:#fff; }
    #loupe-root .lp-bar .lp-sep { width:1px; height:18px; background:#3a3a40; margin:0 2px; }
    #loupe-root .lp-bar .lp-close { background:#6c757d; border-color:#6c757d; color:#fff; }
    #loupe-root .lp-bar .lp-close:hover { background:#e74c3c; border-color:#e74c3c; }
    #loupe-root .lp-bar .lp-refresh.lp-busy { animation:lp-spin 0.9s linear infinite; }
    @keyframes lp-spin { to { transform:rotate(360deg); } }
    `;

    // ── État ─────────────────────────────────────────────────────────────
    var root = null, lens = null, canvas = null, ctx = null, msg = null;
    var handle = null, knob = null, bar = null, zoomLbl = null, btnRefresh = null;
    var snap = null, snapScale = 1, snapScroll = { x: 0, y: 0 };
    var st = { x: 0, y: 0, d: 260, zi: 1 };    // centre, diamètre, index de zoom
    var busy = false, pending = false, resizeTimer = null;

    function W() { return window.innerWidth; }
    function H() { return window.innerHeight; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function injectStyle() {
        if (document.getElementById('loupe-widget-style')) return;
        var s = document.createElement('style');
        s.id = 'loupe-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    function shield(el) {
        ['mousedown', 'touchstart', 'click', 'dblclick'].forEach(function (ev) {
            el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
        });
    }

    function onDrag(el, handlers) {
        el.addEventListener('pointerdown', function (e) {
            if (e.button !== undefined && e.button > 0) return;
            e.preventDefault(); e.stopPropagation();
            try { el.setPointerCapture(e.pointerId); } catch (err) {}
            var last = { x: e.clientX, y: e.clientY };
            function move(ev) {
                handlers.move(ev.clientX - last.x, ev.clientY - last.y, ev);
                last = { x: ev.clientX, y: ev.clientY };
            }
            function up() {
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', up);
                el.removeEventListener('pointercancel', up);
            }
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', up);
            el.addEventListener('pointercancel', up);
        });
    }

    // ── Chargement html2canvas à la demande ──────────────────────────────
    function loadH2C() {
        return new Promise(function (resolve, reject) {
            if (window.html2canvas) return resolve(window.html2canvas);
            var existing = document.querySelector('script[src="' + H2C_URL + '"]');
            var s = existing || document.createElement('script');
            s.addEventListener('load', function () { resolve(window.html2canvas); });
            s.addEventListener('error', reject);
            if (!existing) { s.src = H2C_URL; document.head.appendChild(s); }
        });
    }

    // ── Photo de l'écran ─────────────────────────────────────────────────
    function capture() {
        if (!root) return;
        if (busy) { pending = true; return; }
        busy = true;
        btnRefresh.classList.add('lp-busy');
        if (!snap) showMsg('Préparation de la loupe…');

        var scale = Math.min(3, Math.max(2, (window.devicePixelRatio || 1) * 2));
        var hide = document.createElement('style');
        hide.id = '__loupe_capture_hide__';
        hide.textContent = HIDE_SELECTORS + '{visibility:hidden!important}';

        loadH2C().then(function (h2c) {
            document.head.appendChild(hide);
            var sx = window.scrollX, sy = window.scrollY;
            return h2c(document.body, {
                x: sx, y: sy, width: W(), height: H(),
                windowWidth: W(), windowHeight: H(),
                scale: scale, useCORS: true, allowTaint: true, logging: false,
                backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
                ignoreElements: function (el) {
                    return el.id === 'loupe-root' || el.id === 'cache-layer' || el.id === 'cache-bar';
                }
            }).then(function (c) {
                snap = c; snapScale = scale; snapScroll = { x: sx, y: sy };
                hideMsg(); render();
            });
        }).catch(function () {
            if (!snap) showMsg('Loupe indisponible : connexion internet nécessaire au premier usage.');
        }).then(function () {
            if (hide.parentNode) hide.parentNode.removeChild(hide);
            busy = false;
            if (btnRefresh) btnRefresh.classList.remove('lp-busy');
            if (pending) { pending = false; capture(); }
        });
    }

    function showMsg(t) { if (msg) { msg.textContent = t; msg.style.display = 'flex'; } }
    function hideMsg()  { if (msg) msg.style.display = 'none'; }

    // ── Dessin ───────────────────────────────────────────────────────────
    function render() {
        if (!root) return;
        var d = st.d, r = d / 2, dpr = window.devicePixelRatio || 1;
        var zoom = ZOOMS[st.zi];

        lens.style.left = (st.x - r) + 'px'; lens.style.top = (st.y - r) + 'px';
        lens.style.width = d + 'px';         lens.style.height = d + 'px';

        // Manche décoratif (en bas à droite) + poignée de taille sur le bord
        var a = Math.PI / 4;
        handle.style.left = (st.x + Math.cos(a) * (r + 6) - 8) + 'px';
        handle.style.top  = (st.y + Math.sin(a) * (r + 6)) + 'px';
        handle.style.transform = 'rotate(-45deg)';
        var ka = -Math.PI / 4;
        knob.style.left = (st.x + Math.cos(ka) * (r + 7)) + 'px';
        knob.style.top  = (st.y + Math.sin(ka) * (r + 7)) + 'px';

        // Barre sous la loupe, ou au-dessus si on est en bas de l'écran
        var below = st.y + r + 60 < H();
        bar.style.left = st.x + 'px';
        bar.style.top  = below ? (st.y + r + 16) + 'px' : (st.y - r - 50) + 'px';
        zoomLbl.textContent = (zoom % 1 ? zoom.toFixed(1) : zoom) + '×';

        var pw = Math.round(d * dpr);
        if (canvas.width !== pw) { canvas.width = pw; canvas.height = pw; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pw, pw);
        if (!snap) return;

        // Zone source (en px écran) centrée sous la loupe, corrigée du scroll
        var srcW = d / zoom;
        var cx = st.x + (window.scrollX - snapScroll.x);
        var cy = st.y + (window.scrollY - snapScroll.y);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(snap,
            (cx - srcW / 2) * snapScale, (cy - srcW / 2) * snapScale, srcW * snapScale, srcW * snapScale,
            0, 0, pw, pw);
    }

    function setZoom(delta) {
        st.zi = clamp(st.zi + delta, 0, ZOOMS.length - 1);
        render();
    }

    // ── Construction ─────────────────────────────────────────────────────
    function build() {
        root = document.createElement('div');
        root.id = 'loupe-root';
        root.innerHTML =
            '<div class="lp-handle"></div>' +
            '<div class="lp-lens" title="Faites glisser la loupe · molette = zoom">' +
                '<canvas></canvas><div class="lp-cross"></div><div class="lp-glass"></div>' +
                '<div class="lp-msg" style="display:none"></div>' +
            '</div>' +
            '<div class="lp-knob" title="Agrandir / réduire la loupe"></div>' +
            '<div class="lp-bar">' +
                '<button data-act="zout" title="Moins de zoom (−)">&#8722;</button>' +
                '<span class="lp-zoom">2&#215;</span>' +
                '<button data-act="zin" title="Plus de zoom (+)">+</button>' +
                '<span class="lp-sep"></span>' +
                '<button class="lp-refresh" data-act="refresh" title="Actualiser l\'image (R)">&#128260;</button>' +
                '<button class="lp-close" data-act="close" title="Fermer (Échap)">&#10006;</button>' +
            '</div>';
        document.body.appendChild(root);

        lens    = root.querySelector('.lp-lens');
        canvas  = root.querySelector('canvas');
        ctx     = canvas.getContext('2d');
        msg     = root.querySelector('.lp-msg');
        handle  = root.querySelector('.lp-handle');
        knob    = root.querySelector('.lp-knob');
        bar     = root.querySelector('.lp-bar');
        zoomLbl = root.querySelector('.lp-zoom');
        btnRefresh = root.querySelector('[data-act="refresh"]');
        [lens, knob, bar].forEach(shield);

        onDrag(lens, {
            move: function (dx, dy) {
                st.x = clamp(st.x + dx, 0, W());
                st.y = clamp(st.y + dy, 0, H());
                render();
            }
        });
        onDrag(knob, {
            move: function (dx, dy, e) {
                st.d = clamp(Math.hypot(e.clientX - st.x, e.clientY - st.y) * 2 - 14, MIN_D, MAX_D);
                render();
            }
        });
        lens.addEventListener('wheel', function (e) {
            e.preventDefault(); e.stopPropagation();
            setZoom(e.deltaY < 0 ? 1 : -1);
        }, { passive: false });

        bar.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        bar.querySelector('[data-act="zin"]').addEventListener('click', function () { setZoom(1); });
        bar.querySelector('[data-act="zout"]').addEventListener('click', function () { setZoom(-1); });
        btnRefresh.addEventListener('click', capture);
        bar.querySelector('[data-act="close"]').addEventListener('click', closeLoupeWidget);
    }

    function onKey(e) {
        if (!root) return;
        var tag = (e.target && e.target.tagName) || '';
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
        if (e.key === 'Escape') { e.stopPropagation(); closeLoupeWidget(); }
        else if (e.key === '+' || e.key === '=') { setZoom(1); }
        else if (e.key === '-' || e.key === '_') { setZoom(-1); }
        else if (e.key === 'r' || e.key === 'R') { capture(); }
    }

    function onResize() {
        st.x = clamp(st.x, 0, W()); st.y = clamp(st.y, 0, H());
        render();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(capture, 400);
    }

    // ── API ──────────────────────────────────────────────────────────────
    window.createLoupeWidget = function () {
        injectStyle();
        if (root) { capture(); return; }
        st.x = W() / 2; st.y = H() / 2;
        build();
        render();
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onResize, true);
        // Laisse le panneau Outils se refermer avant la photo
        setTimeout(capture, 350);
    };

    window.closeLoupeWidget = function () {
        if (root) root.remove();
        root = lens = canvas = ctx = msg = handle = knob = bar = zoomLbl = btnRefresh = null;
        snap = null;
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onResize, true);
    };

})();
