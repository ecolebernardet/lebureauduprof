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
        width:  500px;
        height: 400px;
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

    /* ── Minuteur VISUEL (type Time Timer) ── */
    .mc-tt { display:flex; align-items:center; gap:12px; width:100%; }
    .mc-tt-dial { width:156px; height:156px; flex-shrink:0; touch-action:none; cursor:grab; }
    .mc-tt-dial.mc-tt-locked { cursor:default; }
    .mc-tt-dial.mc-tt-done .mc-tt-face { animation: mc-tt-flash 0.5s infinite alternate; }
    @keyframes mc-tt-flash { from { fill:#fff; } to { fill:#ffd6d6; } }
    .mc-tt-side { display:flex; flex-direction:column; gap:6px; flex:1; min-width:0; }
    .mc-tt-presets { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
    .mc-tt-preset {
        height:23px; border:1px solid #e0e0e0; border-radius:6px; background:#fff;
        font-size:11px; font-weight:700; color:#555; cursor:pointer; padding:0;
        transition:background 0.15s, border-color 0.15s;
    }
    .mc-tt-preset:hover { border-color:#4a90e2; }
    .mc-tt-preset.active { background:#4a90e2; border-color:#4a90e2; color:#fff; }
    .mc-tt-preset:disabled { opacity:0.4; cursor:default; }
    .mc-tt-colors { display:flex; justify-content:space-between; }
    .mc-tt-color {
        width:17px; height:17px; border-radius:50%; border:2px solid #fff;
        box-shadow:0 0 0 1px #ccc; cursor:pointer; padding:0;
    }
    .mc-tt-color.active { box-shadow:0 0 0 2px #333; }
    .mc-tt-opts { display:flex; gap:4px; }
    .mc-tt-opt {
        flex:1; height:22px; border:1px solid #e0e0e0; border-radius:6px; background:#fff;
        font-size:12px; cursor:pointer; padding:0; opacity:0.45; transition:opacity 0.15s;
    }
    .mc-tt-opt.on { opacity:1; border-color:#4a90e2; }
    .mc-tt-side .mc-btns { gap:4px; }
    .mc-tt-side .mc-btn { flex:1; padding:6px 0; font-size:11px; }
    .mc-tt-side .mc-btn-hide { flex:0 0 30px; background:#e8eaed; color:#555; }

    /* Durée personnalisée */
    .mc-tt-custom { display:flex; align-items:center; justify-content:center; gap:4px; font-size:10px; font-weight:700; color:#999; }
    .mc-tt-custom input {
        width:38px; height:22px; box-sizing:border-box; padding:0;
        font-size:13px; font-weight:700; text-align:center; color:#333;
        border:1px solid #e0e0e0; border-radius:6px; outline:none;
        font-variant-numeric:tabular-nums; -moz-appearance:textfield; appearance:textfield;
    }
    .mc-tt-custom input::-webkit-outer-spin-button,
    .mc-tt-custom input::-webkit-inner-spin-button { -webkit-appearance:none; }
    .mc-tt-custom input:focus { border-color:#4a90e2; }
    .mc-tt-custom input:disabled { opacity:0.4; }

    /* Mode épuré : réglages masqués, cadran agrandi */
    .mc-widget.mc-tt-clean { position:relative; }
    .mc-widget.mc-tt-clean .mc-tabs,
    .mc-widget.mc-tt-clean .mc-tt-side { display:none; }
    .mc-widget.mc-tt-clean .mc-tt { justify-content:center; }
    .mc-widget.mc-tt-clean .mc-tt-dial { width:232px; height:232px; cursor:pointer; }
    .mc-tt-mini { display:none; position:absolute; top:10px; right:10px; flex-direction:column; gap:5px; }
    .mc-widget.mc-tt-clean .mc-tt-mini { display:flex; }
    .mc-tt-mini button {
        width:26px; height:26px; border:none; border-radius:50%; background:#f0f2f5;
        color:#666; font-size:13px; cursor:pointer; padding:0; opacity:0.55; transition:opacity 0.15s;
    }
    .mc-tt-mini button:hover { opacity:1; }
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
        <button class="mc-tab"        data-panel="vis">&#x1F534; Timer</button>
        <button class="mc-tab"        data-panel="chr">&#x23F1; Chrono</button>
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

    <!-- MINUTEUR VISUEL (type Time Timer) -->
    <div class="mc-panel" data-id="vis">
        <div class="mc-tt">
            <svg class="mc-tt-dial" data-role="dial" viewBox="-100 -100 200 200">
                <title data-role="dialTitle">Faites glisser sur le cadran pour régler la durée</title>
                <circle class="mc-tt-face" r="97" fill="#fff" stroke="#d0d4da" stroke-width="3"/>
                <g data-role="ticks"></g>
                <path data-role="wedge" fill="#e74c3c" d=""/>
                <line data-role="hand" x1="0" y1="0" x2="0" y2="-70" stroke="#333" stroke-width="3" stroke-linecap="round"/>
                <circle r="25" fill="#fff" stroke="#d0d4da" stroke-width="2"/>
                <text data-role="center" x="0" y="5" text-anchor="middle"
                      font-size="13" font-weight="700" fill="#333"
                      style="font-variant-numeric:tabular-nums;">05:00</text>
            </svg>
            <div class="mc-tt-side">
                <div class="mc-tt-presets" data-role="presets">
                    <button class="mc-tt-preset" data-min="1">1'</button>
                    <button class="mc-tt-preset" data-min="2">2'</button>
                    <button class="mc-tt-preset active" data-min="5">5'</button>
                    <button class="mc-tt-preset" data-min="10">10'</button>
                    <button class="mc-tt-preset" data-min="15">15'</button>
                    <button class="mc-tt-preset" data-min="20">20'</button>
                    <button class="mc-tt-preset" data-min="30">30'</button>
                    <button class="mc-tt-preset" data-min="45">45'</button>
                    <button class="mc-tt-preset" data-min="60">60'</button>
                </div>
                <div class="mc-tt-custom" title="Durée personnalisée (jusqu'à 120 min)">
                    <input type="number" data-role="customMin" min="0" max="120" value="5">
                    <span>min</span>
                    <input type="number" data-role="customSec" min="0" max="59" value="00">
                    <span>s</span>
                </div>
                <div class="mc-tt-colors" data-role="colors">
                    <button class="mc-tt-color active" data-color="#e74c3c" style="background:#e74c3c" title="Rouge"></button>
                    <button class="mc-tt-color" data-color="#3b82f6" style="background:#3b82f6" title="Bleu"></button>
                    <button class="mc-tt-color" data-color="#22a55b" style="background:#22a55b" title="Vert"></button>
                    <button class="mc-tt-color" data-color="#f59e0b" style="background:#f59e0b" title="Orange"></button>
                    <button class="mc-tt-color" data-color="#8b5cf6" style="background:#8b5cf6" title="Violet"></button>
                </div>
                <div class="mc-tt-opts">
                    <button class="mc-tt-opt on" data-role="optSound" title="Son de fin">&#x1F514;</button>
                    <button class="mc-tt-opt on" data-role="optDigits" title="Afficher le temps restant au centre">&#x1F522;</button>
                    <button class="mc-tt-opt on" data-role="optLabels" title="Afficher les graduations chiffrées">&#x1F550;</button>
                </div>
                <div class="mc-btns">
                    <button class="mc-btn mc-btn-start" data-role="start">&#9654; Go</button>
                    <button class="mc-btn mc-btn-reset" data-role="reset" title="Remettre à zéro">&#8635;</button>
                    <button class="mc-btn mc-btn-hide" data-role="hide" title="Masquer les réglages">&#x1F441;</button>
                </div>
            </div>
        </div>
        <div class="mc-tt-mini">
            <button data-role="show" title="Afficher les réglages">&#9881;</button>
            <button data-role="miniReset" title="Remettre à zéro">&#8635;</button>
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
        const INTERACTIVE = 'button, input, label, select, textarea, .mc-num-btn, .mc-tab, .mc-tt-dial';
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
        // ══ MINUTEUR VISUEL (type Time Timer) ══
        // Le disque coloré représente le temps restant ; il se réduit dans le
        // sens des aiguilles d'une montre jusqu'à disparaître.
        // Réglage : boutons de durée OU glisser directement sur le cadran.
        // ─────────────────────────────────────────────────────────────────────
        (function () {
            var NS       = 'http://www.w3.org/2000/svg';
            var panel    = widget.querySelector('.mc-panel[data-id="vis"]');
            var dial     = panel.querySelector('[data-role="dial"]');
            var ticksG   = panel.querySelector('[data-role="ticks"]');
            var wedge    = panel.querySelector('[data-role="wedge"]');
            var hand     = panel.querySelector('[data-role="hand"]');
            var center   = panel.querySelector('[data-role="center"]');
            var presets  = Array.from(panel.querySelectorAll('.mc-tt-preset'));
            var colors   = Array.from(panel.querySelectorAll('.mc-tt-color'));
            var optSound = panel.querySelector('[data-role="optSound"]');
            var optDig   = panel.querySelector('[data-role="optDigits"]');
            var optLab   = panel.querySelector('[data-role="optLabels"]');
            var btnStart = panel.querySelector('[data-role="start"]');
            var btnReset = panel.querySelector('[data-role="reset"]');
            var btnHide  = panel.querySelector('[data-role="hide"]');
            var btnShow  = panel.querySelector('[data-role="show"]');
            var btnMiniR = panel.querySelector('[data-role="miniReset"]');
            var inCMin   = panel.querySelector('[data-role="customMin"]');
            var inCSec   = panel.querySelector('[data-role="customSec"]');
            var root     = widget.querySelector('.mc-widget');
            var MAX_SEC  = 120 * 60;

            // Cadrans disponibles (en minutes) : pas des graduations et des chiffres
            var SCALES = [
                { max: 5,   minor: 0.25, label: 1  },
                { max: 10,  minor: 0.5,  label: 1  },
                { max: 15,  minor: 0.5,  label: 1  },
                { max: 20,  minor: 1,    label: 2  },
                { max: 30,  minor: 1,    label: 5  },
                { max: 60,  minor: 1,    label: 5  },
                { max: 120, minor: 2,    label: 10 }
            ];
            var R_WEDGE = 70;

            var scale     = SCALES[5];   // cadran 60 min par défaut
            var setSec    = 5 * 60;      // durée réglée
            var remaining = setSec;      // secondes restantes (décimales)
            var endTime   = 0;
            var timerId   = null;
            var state     = 'idle';      // idle | running | paused | finished
            var showLabels = true, showDigits = true;

            function scaleFor(sec) {
                var m = sec / 60;
                for (var i = 0; i < SCALES.length; i++) if (m <= SCALES[i].max) return SCALES[i];
                return SCALES[SCALES.length - 1];
            }

            // Angle (radians, sens anti-horaire depuis midi) → coordonnées
            function pt(frac, r) {
                var a = frac * Math.PI * 2;
                return { x: -r * Math.sin(a), y: -r * Math.cos(a) };
            }

            function drawTicks() {
                while (ticksG.firstChild) ticksG.removeChild(ticksG.firstChild);
                var n = Math.round(scale.max / scale.minor);
                for (var i = 0; i < n; i++) {
                    var v = i * scale.minor;
                    var isLabel = Math.abs(v / scale.label - Math.round(v / scale.label)) < 1e-6;
                    var isInt   = Math.abs(v - Math.round(v)) < 1e-6;
                    var len = isLabel ? 8 : (isInt ? 5 : 3);
                    var p1 = pt(v / scale.max, 95), p2 = pt(v / scale.max, 95 - len);
                    var l = document.createElementNS(NS, 'line');
                    l.setAttribute('x1', p1.x); l.setAttribute('y1', p1.y);
                    l.setAttribute('x2', p2.x); l.setAttribute('y2', p2.y);
                    l.setAttribute('stroke', isLabel ? '#555' : '#aaa');
                    l.setAttribute('stroke-width', isLabel ? 2 : 1);
                    ticksG.appendChild(l);
                    if (isLabel && showLabels) {
                        var pl = pt(v / scale.max, 80);
                        var t = document.createElementNS(NS, 'text');
                        t.setAttribute('x', pl.x); t.setAttribute('y', pl.y + 4);
                        t.setAttribute('text-anchor', 'middle');
                        t.setAttribute('font-size', scale.max <= 15 && scale.max > 10 ? 10 : 12);
                        t.setAttribute('font-weight', '700');
                        t.setAttribute('fill', '#666');
                        t.setAttribute('font-family', "'Segoe UI', system-ui, sans-serif");
                        t.textContent = Math.round(v);
                        ticksG.appendChild(t);
                    }
                }
            }

            function fmt(sec) {
                sec = Math.ceil(sec);
                var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
                if (h > 0) return h + 'h' + String(m).padStart(2, '0');
                return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            }

            function render() {
                var frac = Math.max(0, Math.min(1, remaining / (scale.max * 60)));
                if (frac >= 0.9999) {
                    wedge.setAttribute('d', 'M0,-' + R_WEDGE + ' A' + R_WEDGE + ',' + R_WEDGE + ' 0 1 0 0,' + R_WEDGE
                                           + ' A' + R_WEDGE + ',' + R_WEDGE + ' 0 1 0 0,-' + R_WEDGE + ' Z');
                } else if (frac <= 0) {
                    wedge.setAttribute('d', '');
                } else {
                    var e = pt(frac, R_WEDGE);
                    wedge.setAttribute('d', 'M0,0 L0,-' + R_WEDGE + ' A' + R_WEDGE + ',' + R_WEDGE
                        + ' 0 ' + (frac > 0.5 ? 1 : 0) + ' 0 ' + e.x.toFixed(2) + ',' + e.y.toFixed(2) + ' Z');
                }
                var hp = pt(frac, 70);
                hand.setAttribute('x2', hp.x.toFixed(2)); hand.setAttribute('y2', hp.y.toFixed(2));
                center.textContent = fmt(remaining);
                center.style.display = showDigits ? '' : 'none';
            }

            function markPreset() {
                presets.forEach(function (b) {
                    b.classList.toggle('active', parseInt(b.dataset.min) * 60 === setSec);
                });
            }

            function syncCustom() {
                inCMin.value = Math.floor(setSec / 60);
                inCSec.value = String(setSec % 60).padStart(2, '0');
            }

            // fromInputs = true : l'appel vient des champs, on ne réécrit pas pendant la frappe
            function setDuration(sec, keepScale, fromInputs) {
                setSec = Math.max(0, Math.min(MAX_SEC, Math.round(sec)));
                remaining = setSec;
                if (!keepScale) { scale = scaleFor(setSec || 60); drawTicks(); }
                markPreset();
                if (!fromInputs) syncCustom();
                render();
            }

            function lockSetup(locked) {
                dial.classList.toggle('mc-tt-locked', locked && !root.classList.contains('mc-tt-clean'));
                presets.forEach(function (b) { b.disabled = locked; });
                inCMin.disabled = locked; inCSec.disabled = locked;
            }

            // ── Durée personnalisée ──
            function applyCustom(final) {
                if (state === 'running') return;
                var m = parseInt(inCMin.value, 10) || 0;
                var sc = parseInt(inCSec.value, 10) || 0;
                m = Math.max(0, Math.min(120, m));
                sc = Math.max(0, Math.min(59, sc));
                stopTimer(); state = 'idle'; dial.classList.remove('mc-tt-done');
                setDuration(m * 60 + sc, false, !final);
                updateButtons();
            }
            [inCMin, inCSec].forEach(function (inp) {
                inp.addEventListener('input',  function () { applyCustom(false); });
                inp.addEventListener('change', function () { applyCustom(true); });
                inp.addEventListener('keydown', function (e) {
                    e.stopPropagation();                 // ne pas déclencher les raccourcis du board
                    if (e.key === 'Enter') { applyCustom(true); inp.blur(); }
                });
                inp.addEventListener('focus', function () { inp.select(); });
            });

            // ── Afficher / masquer les réglages ──
            var dialTitle = panel.querySelector('[data-role="dialTitle"]');
            function setClean(on) {
                root.classList.toggle('mc-tt-clean', on);
                dialTitle.textContent = on ? 'Appuyer pour démarrer / mettre en pause'
                                           : 'Faites glisser sur le cadran pour régler la durée';
                lockSetup(state === 'running');
            }
            btnHide.addEventListener('click', function () { setClean(true); });
            btnShow.addEventListener('click', function () { setClean(false); });
            btnMiniR.addEventListener('click', function () { btnReset.click(); });

            // ── Durées rapides ──
            presets.forEach(function (b) {
                b.addEventListener('click', function () {
                    if (state === 'running') return;
                    stopTimer(); state = 'idle'; dial.classList.remove('mc-tt-done');
                    setDuration(parseInt(b.dataset.min) * 60);
                    updateButtons();
                });
            });

            // ── Couleur du disque ──
            colors.forEach(function (c) {
                c.addEventListener('click', function () {
                    colors.forEach(function (x) { x.classList.remove('active'); });
                    c.classList.add('active');
                    wedge.setAttribute('fill', c.dataset.color);
                });
            });

            // ── Options ──
            optSound.addEventListener('click', function () { optSound.classList.toggle('on'); });
            optDig.addEventListener('click', function () {
                showDigits = !showDigits; optDig.classList.toggle('on', showDigits); render();
            });
            optLab.addEventListener('click', function () {
                showLabels = !showLabels; optLab.classList.toggle('on', showLabels); drawTicks();
            });

            // ── Réglage en glissant sur le cadran ──
            var dragging = false;
            function secFromPointer(e) {
                var r  = dial.getBoundingClientRect();
                var dx = e.clientX - (r.left + r.width / 2);
                var dy = e.clientY - (r.top + r.height / 2);
                // angle anti-horaire depuis midi, entre 0 et 1
                var frac = Math.atan2(-dx, -dy) / (Math.PI * 2);
                if (frac < 0) frac += 1;
                var step = scale.max <= 10 ? 15 : (scale.max <= 30 ? 30 : 60); // pas en secondes
                var sec  = Math.round(frac * scale.max * 60 / step) * step;
                if (sec === 0 && frac > 0.5) sec = scale.max * 60; // tour complet
                return sec;
            }
            dial.addEventListener('pointerdown', function (e) {
                if (root.classList.contains('mc-tt-clean')) {
                    e.preventDefault(); e.stopPropagation();
                    btnStart.click();
                    return;
                }
                if (state === 'running') return;
                e.preventDefault(); e.stopPropagation();
                dragging = true;
                try { dial.setPointerCapture(e.pointerId); } catch (err) {}
                stopTimer(); state = 'idle'; dial.classList.remove('mc-tt-done');
                setDuration(secFromPointer(e), true);
                updateButtons();
            });
            dial.addEventListener('pointermove', function (e) {
                if (!dragging) return;
                e.preventDefault();
                setDuration(secFromPointer(e), true);
            });
            function endDrag() { dragging = false; }
            dial.addEventListener('pointerup', endDrag);
            dial.addEventListener('pointercancel', endDrag);

            // ── Décompte ──
            function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

            function tick() {
                remaining = Math.max(0, (endTime - Date.now()) / 1000);
                render();
                if (remaining <= 0) finish();
            }

            function finish() {
                stopTimer();
                state = 'finished';
                dial.classList.add('mc-tt-done');
                updateButtons();
                if (optSound.classList.contains('on')) playChime();
            }

            function playChime() {
                try {
                    var ctx = new (window.AudioContext || window.webkitAudioContext)();
                    [[659, 0], [784, 0.35], [1047, 0.7]].forEach(function (p) {
                        var osc = ctx.createOscillator(), gain = ctx.createGain();
                        osc.connect(gain); gain.connect(ctx.destination);
                        osc.type = 'triangle'; osc.frequency.value = p[0];
                        var t0 = ctx.currentTime + p[1];
                        gain.gain.setValueAtTime(0.0001, t0);
                        gain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.2);
                        osc.start(t0); osc.stop(t0 + 1.25);
                    });
                } catch (e) {}
            }

            function updateButtons() {
                if (state === 'running') {
                    btnStart.innerHTML = '&#10074;&#10074; Pause';
                    btnStart.className = 'mc-btn mc-btn-pause';
                } else if (state === 'paused') {
                    btnStart.innerHTML = '&#9654; Reprendre';
                    btnStart.className = 'mc-btn mc-btn-start';
                } else if (state === 'finished') {
                    btnStart.innerHTML = '&#8635; Relancer';
                    btnStart.className = 'mc-btn mc-btn-start';
                } else {
                    btnStart.innerHTML = '&#9654; Go';
                    btnStart.className = 'mc-btn mc-btn-start';
                }
                lockSetup(state === 'running');
            }

            btnStart.addEventListener('click', function () {
                if (state === 'idle' || state === 'finished') {
                    if (setSec <= 0) return;
                    dial.classList.remove('mc-tt-done');
                    remaining = setSec;
                    endTime = Date.now() + remaining * 1000;
                    state = 'running';
                    timerId = setInterval(tick, 100);
                } else if (state === 'running') {
                    stopTimer(); tick(); state = 'paused';
                } else if (state === 'paused') {
                    endTime = Date.now() + remaining * 1000;
                    state = 'running';
                    timerId = setInterval(tick, 100);
                }
                updateButtons();
            });

            btnReset.addEventListener('click', function () {
                stopTimer();
                state = 'idle';
                dial.classList.remove('mc-tt-done');
                remaining = setSec;
                render();
                updateButtons();
            });

            // Init
            drawTicks();
            setDuration(setSec);
            updateButtons();

            var obs = new MutationObserver(function () {
                if (!document.contains(widget)) { stopTimer(); obs.disconnect(); }
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
