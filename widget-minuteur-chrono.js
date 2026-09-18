// =========================================================================
// WIDGET MINUTEUR & CHRONOMÈTRE — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'minuteur'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widgets_minuteur_chrono.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('minuteur');closeMainMenu()">
//          <span class="mm-ico">⏱️</span>Minuteur & Chrono
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Wrapper externe : poignée resize native ── */
    .widget[data-type="minuteur"] .mc-outer {
        position: relative;
        width:  320px;
        height: 260px;
        min-width:  200px;
        min-height: 160px;
        overflow: hidden;
        resize: both;
        box-sizing: border-box;
        border-radius: 12px;
    }
    .widget[data-type="minuteur"] .mc-outer button,
    .widget[data-type="minuteur"] .mc-outer input,
    .widget[data-type="minuteur"] .mc-outer label,
    .widget[data-type="minuteur"] .mc-outer select {
        cursor: pointer;
    }
    /* Poignée resize visible au survol */
    .widget[data-type="minuteur"]:hover .mc-outer,
    .widget[data-type="minuteur"]:focus-within .mc-outer {
        outline: 2px dashed rgba(74,144,226,0.35);
    }
    .widget[data-type="minuteur"] .mc-outer::-webkit-resizer {
        background-color: transparent;
        background-image: linear-gradient(135deg,
            transparent 50%, #4a90e2 50%, #4a90e2 60%,
            transparent 60%, transparent 70%,
            #4a90e2 70%, #4a90e2 80%, transparent 80%);
    }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="minuteur"] .mc-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
    }

    /* ── Widget intérieur (taille de référence 320x260) ── */
    .mc-widget {
        width:  320px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 14px 16px 12px;
        gap: 8px;
        user-select: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
        box-sizing: border-box;
    }

    /* ── Onglets ── */
    .mc-tabs {
        display: flex;
        gap: 5px;
        background: #f0f2f5;
        border-radius: 9px;
        padding: 3px;
        width: 100%;
        box-sizing: border-box;
    }
    .mc-tab {
        flex: 1; padding: 5px 0; border: none;
        border-radius: 6px; background: transparent;
        font-size: 12px; font-weight: 600; color: #888;
        cursor: pointer;
        transition: background 0.18s, color 0.18s;
    }
    .mc-tab.active {
        background: #fff; color: #333;
        box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }

    /* ── Panneaux ── */
    .mc-panel { display: none; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
    .mc-panel.active { display: flex; }

    /* ── Affichage chiffres ── */
    .mc-display {
        font-size: 48px; font-weight: 700; letter-spacing: 2px;
        color: #1a1a2e; font-variant-numeric: tabular-nums;
        line-height: 1; padding: 4px 0; transition: color 0.3s;
    }
    .mc-display.mc-running  { color: #2ecc71; }
    .mc-display.mc-paused   { color: #f39c12; }
    .mc-display.mc-finished { color: #e74c3c; animation: mc-blink 0.6s infinite alternate; }

    @keyframes mc-blink { from { opacity:1; } to { opacity:0.3; } }

    /* ── Barre de progression ── */
    .mc-progress-wrap { width:100%; height:7px; background:#e8eaed; border-radius:99px; overflow:hidden; }
    .mc-progress-bar {
        height:100%; width:100%;
        background: linear-gradient(90deg, #4a90e2, #6bcb77);
        border-radius:99px;
        transition: width 0.35s linear, background 0.3s;
    }
    .mc-progress-bar.mc-low  { background: linear-gradient(90deg, #f39c12, #e74c3c); }
    .mc-progress-bar.mc-done { background: #e74c3c; width:100% !important; }

    /* ── Réglage H:M:S ── */
    .mc-inputs { display:flex; align-items:center; gap:6px; }
    .mc-input-group { display:flex; flex-direction:column; align-items:center; gap:1px; }
    .mc-input-group label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#bbb; }
    .mc-num-btn {
        background:none; border:none; font-size:13px; color:#bbb;
        cursor:pointer; line-height:1; padding:1px 6px; transition:color 0.15s;
    }
    .mc-num-btn:hover { color:#4a90e2; }
    .mc-num-input {
        width:48px; font-size:26px; font-weight:700; text-align:center;
        border:2px solid #e0e0e0; border-radius:7px; padding:3px 0; color:#333;
        outline:none; font-variant-numeric:tabular-nums;
        -moz-appearance:textfield; appearance:textfield;
    }
    .mc-num-input::-webkit-outer-spin-button,
    .mc-num-input::-webkit-inner-spin-button { -webkit-appearance:none; }
    .mc-num-input:focus { border-color:#4a90e2; }
    .mc-sep { font-size:26px; font-weight:700; color:#ddd; line-height:1; }

    /* ── Boutons ── */
    .mc-btns { display:flex; gap:7px; }
    .mc-btn {
        padding:7px 16px; border:none; border-radius:8px;
        font-size:12px; font-weight:700; cursor:pointer;
        transition:opacity 0.15s, transform 0.1s;
    }
    .mc-btn:hover  { opacity:0.85; }
    .mc-btn:active { transform:scale(0.95); }
    .mc-btn-start  { background:#2ecc71; color:#fff; }
    .mc-btn-pause  { background:#f39c12; color:#fff; }
    .mc-btn-reset  { background:#e8eaed; color:#555; }
    .mc-btn-lap    { background:#4a90e2; color:#fff; }

    /* ── Son ── */
    .mc-sound-row { display:flex; align-items:center; gap:5px; font-size:11px; color:#aaa; }
    .mc-sound-row input { cursor:pointer; accent-color:#4a90e2; }

    /* ── Tours chrono ── */
    .mc-laps { width:100%; max-height:90px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
    .mc-lap-row {
        display:flex; justify-content:space-between; align-items:center;
        font-size:11px; padding:2px 5px; border-radius:4px; background:#f7f8fa; color:#555;
    }
    .mc-lap-row:nth-child(odd) { background:#f0f2f5; }
    .mc-lap-n     { font-weight:700; color:#4a90e2; min-width:28px; }
    .mc-lap-split { color:#bbb; font-size:10px; }
    `;

    if (!document.getElementById('mc-widget-style')) {
        const s = document.createElement('style');
        s.id = 'mc-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── Template ─────────────────────────────────────────────────────────
    if (!document.getElementById('template-minuteur')) {
        const tpl = document.createElement('template');
        tpl.id = 'template-minuteur';
        tpl.innerHTML = `
<div class="mc-outer">
  <div class="mc-scale-wrap">
  <div class="mc-widget">

    <div class="mc-tabs">
        <button class="mc-tab active" data-panel="min">&#x23F3; Minuteur</button>
        <button class="mc-tab"        data-panel="chr">&#x23F1; Chronometre</button>
    </div>

    <!-- MINUTEUR -->
    <div class="mc-panel active" data-id="min">
        <div class="mc-inputs" data-role="setup">
            <div class="mc-input-group">
                <label>H</label>
                <button class="mc-num-btn" data-dir="up">&#9650;</button>
                <input  class="mc-num-input" type="number" value="0" min="0" max="23">
                <button class="mc-num-btn" data-dir="down">&#9660;</button>
            </div>
            <div class="mc-sep">:</div>
            <div class="mc-input-group">
                <label>Min</label>
                <button class="mc-num-btn" data-dir="up">&#9650;</button>
                <input  class="mc-num-input" type="number" value="5" min="0" max="59">
                <button class="mc-num-btn" data-dir="down">&#9660;</button>
            </div>
            <div class="mc-sep">:</div>
            <div class="mc-input-group">
                <label>Sec</label>
                <button class="mc-num-btn" data-dir="up">&#9650;</button>
                <input  class="mc-num-input" type="number" value="0" min="0" max="59">
                <button class="mc-num-btn" data-dir="down">&#9660;</button>
            </div>
        </div>
        <div class="mc-display" data-role="display" style="display:none;">00:05:00</div>
        <div class="mc-progress-wrap" data-role="progress" style="display:none;">
            <div class="mc-progress-bar" data-role="bar"></div>
        </div>
        <div class="mc-sound-row">
            <input type="checkbox" data-role="sound" checked>
            <label>Son de fin</label>
        </div>
        <div class="mc-btns">
            <button class="mc-btn mc-btn-start" data-role="start">&#9654; Demarrer</button>
            <button class="mc-btn mc-btn-reset" data-role="reset" style="display:none;">&#8635; Reset</button>
        </div>
    </div>

    <!-- CHRONOM&#200;TRE -->
    <div class="mc-panel" data-id="chr">
        <div class="mc-display" data-role="display">00:00.0</div>
        <div class="mc-btns">
            <button class="mc-btn mc-btn-start" data-role="start">&#9654; Demarrer</button>
            <button class="mc-btn mc-btn-lap"   data-role="lap"   style="display:none;">Tour</button>
            <button class="mc-btn mc-btn-reset" data-role="reset" style="display:none;">&#8635; Reset</button>
        </div>
        <div class="mc-laps" data-role="laps"></div>
    </div>

  </div>
  </div>
</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    window.initMinuteurWidget = function (widget) {

        // ── Le widget s'ouvre à 100px du bord gauche du board ──────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW = window.innerWidth;
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));

        const outer     = widget.querySelector('.mc-outer');
        const scaleWrap = widget.querySelector('.mc-scale-wrap');

        // Dimensions de référence (taille native du template)
        const REF_W = 320;
        const REF_H = 260;

        // ── Scaling : adapte le contenu à la taille du container ─────────────
        function applyScale() {
            const ow = outer.offsetWidth  || REF_W;
            const oh = outer.offsetHeight || REF_H;
            const s  = Math.min(ow / REF_W, oh / REF_H);
            scaleWrap.style.width     = REF_W + 'px';
            scaleWrap.style.height    = REF_H + 'px';
            scaleWrap.style.transform = 'scale(' + s + ')';
            scaleWrap.style.left      = ((ow - REF_W * s) / 2) + 'px';
            scaleWrap.style.top       = ((oh - REF_H * s) / 2) + 'px';
        }

        applyScale();

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(applyScale);
            ro.observe(outer);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }

        // ── Drag depuis n'importe où sauf boutons/inputs ─────────────────────
        // On laisse remonter le mousedown vers makeDraggable sauf si la cible
        // est un élément interactif (bouton, input, label, checkbox).
        const INTERACTIVE = 'button, input, label, select, textarea, .mc-num-btn, .mc-tab';
        outer.addEventListener('mousedown', function(e) {
            if (e.target.closest(INTERACTIVE)) { e.stopPropagation(); return; }
            // Bloquer aussi le drag si on est dans le coin resize
            const r = outer.getBoundingClientRect();
            const nearCorner = (r.right - e.clientX) < RESIZE_ZONE && (r.bottom - e.clientY) < RESIZE_ZONE;
            if (nearCorner) e.stopPropagation();
        });
        outer.addEventListener('touchstart', function(e) {
            if (e.target.closest(INTERACTIVE)) e.stopPropagation();
        }, { passive: true });

        // ── Curseur move sauf sur la zone resize (coin bas-droit ~20px) ──────
        const RESIZE_ZONE = 20;
        outer.addEventListener('mousemove', function(e) {
            if (e.target.closest(INTERACTIVE)) return;
            const r = outer.getBoundingClientRect();
            const nearCorner = (r.right - e.clientX) < RESIZE_ZONE && (r.bottom - e.clientY) < RESIZE_ZONE;
            outer.style.cursor = nearCorner ? 'se-resize' : 'move';
        });
        outer.addEventListener('mouseleave', function() {
            outer.style.cursor = '';
        });

        // ── Onglets ──────────────────────────────────────────────────────────
        const tabs   = widget.querySelectorAll('.mc-tab');
        const panels = widget.querySelectorAll('.mc-panel');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(function(t)  { t.classList.remove('active'); });
                panels.forEach(function(p) { p.classList.remove('active'); });
                tab.classList.add('active');
                var target = widget.querySelector('.mc-panel[data-id="' + tab.dataset.panel + '"]');
                if (target) target.classList.add('active');
            });
        });

        // ─────────────────────────────────────────────────────────────────────
        // ══ MINUTEUR ══
        // ─────────────────────────────────────────────────────────────────────
        (function () {
            var panel    = widget.querySelector('.mc-panel[data-id="min"]');
            var setup    = panel.querySelector('[data-role="setup"]');
            var display  = panel.querySelector('[data-role="display"]');
            var progress = panel.querySelector('[data-role="progress"]');
            var bar      = panel.querySelector('[data-role="bar"]');
            var soundCb  = panel.querySelector('[data-role="sound"]');
            var btnStart = panel.querySelector('[data-role="start"]');
            var btnReset = panel.querySelector('[data-role="reset"]');
            // Les 3 inputs dans l'ordre H / M / S
            var inputs   = Array.from(panel.querySelectorAll('.mc-num-input'));
            var inpH = inputs[0], inpM = inputs[1], inpS = inputs[2];

            var totalSec = 0, remaining = 0, startTime = null;
            var intervalId = null;
            var state = 'idle'; // idle | running | paused | finished

            // Boutons ▲▼
            panel.querySelectorAll('.mc-num-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (state !== 'idle') return;
                    var inp = btn.closest('.mc-input-group').querySelector('.mc-num-input');
                    if (!inp) return;
                    var max = parseInt(inp.max);
                    var v   = (parseInt(inp.value) || 0) + (btn.dataset.dir === 'up' ? 1 : -1);
                    if (v < 0) v = max;
                    if (v > max) v = 0;
                    inp.value = String(v).padStart(2, '0');
                });
            });

            // Validation saisie directe
            inputs.forEach(function(inp) {
                inp.addEventListener('change', function() {
                    var v = parseInt(inp.value) || 0;
                    v = Math.max(0, Math.min(parseInt(inp.max), v));
                    inp.value = String(v).padStart(2, '0');
                });
            });

            function getTotal() {
                return (parseInt(inpH.value) || 0) * 3600
                     + (parseInt(inpM.value) || 0) * 60
                     + (parseInt(inpS.value) || 0);
            }

            function fmt(sec) {
                var h  = Math.floor(sec / 3600);
                var m  = Math.floor((sec % 3600) / 60);
                var s  = sec % 60;
                var mm = String(m).padStart(2, '0');
                var ss = String(s).padStart(2, '0');
                return h > 0 ? (h + ':' + mm + ':' + ss) : (mm + ':' + ss);
            }

            function updateDisplay() {
                display.textContent = fmt(remaining);
                var pct = totalSec > 0 ? (remaining / totalSec) * 100 : 100;
                bar.style.width = pct + '%';
                bar.className   = 'mc-progress-bar' + (pct <= 20 ? ' mc-low' : '');
            }

            function tick() {
                var elapsed = Math.floor((Date.now() - startTime) / 1000);
                remaining = Math.max(0, totalSec - elapsed);
                updateDisplay();
                if (remaining <= 0) finish();
            }

            function finish() {
                clearInterval(intervalId); intervalId = null;
                state = 'finished';
                display.className      = 'mc-display mc-finished';
                bar.className          = 'mc-progress-bar mc-done';
                btnStart.textContent   = 'Recommencer';
                btnStart.className     = 'mc-btn mc-btn-start';
                btnReset.style.display = 'inline-block';
                if (soundCb.checked) playBeep();
            }

            function playBeep() {
                try {
                    var ctx = new (window.AudioContext || window.webkitAudioContext)();
                    [[880,0,0.18],[880,0.22,0.18],[1318,0.44,0.4]].forEach(function(p) {
                        var osc = ctx.createOscillator(), gain = ctx.createGain();
                        osc.connect(gain); gain.connect(ctx.destination);
                        osc.frequency.value = p[0]; osc.type = 'sine';
                        gain.gain.setValueAtTime(0.5, ctx.currentTime + p[1]);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + p[1] + p[2]);
                        osc.start(ctx.currentTime + p[1]);
                        osc.stop(ctx.currentTime + p[1] + p[2] + 0.05);
                    });
                } catch(e) {}
            }

            btnStart.addEventListener('click', function() {
                if (state === 'idle' || state === 'finished') {
                    totalSec = getTotal();
                    if (totalSec <= 0) return;
                    remaining  = totalSec;
                    startTime  = Date.now();
                    state      = 'running';
                    setup.style.display    = 'none';
                    display.style.display  = 'block';
                    progress.style.display = 'block';
                    display.className      = 'mc-display mc-running';
                    bar.className          = 'mc-progress-bar';
                    updateDisplay();
                    intervalId = setInterval(tick, 250);
                    btnStart.textContent   = 'Pause';
                    btnStart.className     = 'mc-btn mc-btn-pause';
                    btnReset.style.display = 'inline-block';

                } else if (state === 'running') {
                    clearInterval(intervalId); intervalId = null;
                    totalSec             = remaining;
                    state                = 'paused';
                    display.className    = 'mc-display mc-paused';
                    btnStart.textContent = 'Reprendre';
                    btnStart.className   = 'mc-btn mc-btn-start';

                } else if (state === 'paused') {
                    startTime            = Date.now();
                    state                = 'running';
                    display.className    = 'mc-display mc-running';
                    intervalId           = setInterval(tick, 250);
                    btnStart.textContent = 'Pause';
                    btnStart.className   = 'mc-btn mc-btn-pause';
                }
            });

            btnReset.addEventListener('click', function() {
                clearInterval(intervalId); intervalId = null;
                state = 'idle'; remaining = 0;
                setup.style.display    = '';
                display.style.display  = 'none';
                progress.style.display = 'none';
                display.className      = 'mc-display';
                bar.style.width        = '100%';
                bar.className          = 'mc-progress-bar';
                btnStart.textContent   = 'Demarrer';
                btnStart.className     = 'mc-btn mc-btn-start';
                btnReset.style.display = 'none';
            });

            var obs = new MutationObserver(function() {
                if (!document.contains(widget)) { clearInterval(intervalId); obs.disconnect(); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        })();

        // ─────────────────────────────────────────────────────────────────────
        // ══ CHRONOMÈTRE ══
        // ─────────────────────────────────────────────────────────────────────
        (function () {
            var panel    = widget.querySelector('.mc-panel[data-id="chr"]');
            var display  = panel.querySelector('[data-role="display"]');
            var lapsEl   = panel.querySelector('[data-role="laps"]');
            var btnStart = panel.querySelector('[data-role="start"]');
            var btnLap   = panel.querySelector('[data-role="lap"]');
            var btnReset = panel.querySelector('[data-role="reset"]');

            var startTime = null, elapsed = 0, lapStart = 0;
            var rafId = null, running = false, laps = [];

            function fmt(ms) {
                var s  = Math.floor(ms / 1000);
                var h  = Math.floor(s / 3600);
                var m  = Math.floor((s % 3600) / 60);
                var ss = s % 60;
                var ds = Math.floor((ms % 1000) / 100);
                if (h > 0)
                    return h + ':' + String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0') + '.' + ds;
                return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0') + '.' + ds;
            }

            function frame() {
                elapsed = Date.now() - startTime;
                display.textContent = fmt(elapsed);
                rafId = requestAnimationFrame(frame);
            }

            function renderLaps() {
                lapsEl.innerHTML = '';
                var rev = laps.slice().reverse();
                rev.forEach(function(lap, i) {
                    var n   = laps.length - i;
                    var row = document.createElement('div');
                    row.className = 'mc-lap-row';
                    row.innerHTML = '<span class="mc-lap-n">Tour ' + n + '</span>'
                        + '<span>' + fmt(lap.total) + '</span>'
                        + '<span class="mc-lap-split">+' + fmt(lap.split) + '</span>';
                    lapsEl.appendChild(row);
                });
            }

            btnStart.addEventListener('click', function() {
                if (!running) {
                    startTime = Date.now() - elapsed;
                    running   = true;
                    display.className      = 'mc-display mc-running';
                    rafId = requestAnimationFrame(frame);
                    btnStart.textContent   = 'Pause';
                    btnStart.className     = 'mc-btn mc-btn-pause';
                    btnLap.style.display   = 'inline-block';
                    btnReset.style.display = 'none';
                } else {
                    cancelAnimationFrame(rafId); rafId = null;
                    running = false;
                    display.className      = 'mc-display mc-paused';
                    btnStart.textContent   = 'Reprendre';
                    btnStart.className     = 'mc-btn mc-btn-start';
                    btnLap.style.display   = 'none';
                    btnReset.style.display = 'inline-block';
                }
            });

            btnLap.addEventListener('click', function() {
                var split = elapsed - lapStart;
                lapStart  = elapsed;
                laps.push({ total: elapsed, split: split });
                renderLaps();
            });

            btnReset.addEventListener('click', function() {
                cancelAnimationFrame(rafId); rafId = null;
                running = false; elapsed = 0; lapStart = 0; laps = []; startTime = null;
                display.textContent    = '00:00.0';
                display.className      = 'mc-display';
                lapsEl.innerHTML       = '';
                btnStart.textContent   = 'Demarrer';
                btnStart.className     = 'mc-btn mc-btn-start';
                btnLap.style.display   = 'none';
                btnReset.style.display = 'none';
            });

            var obs = new MutationObserver(function() {
                if (!document.contains(widget)) { cancelAnimationFrame(rafId); obs.disconnect(); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        })();
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'minuteur') initMinuteurWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'minuteur') initMinuteurWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
