// =========================================================================
// WIDGET RADAR DE BRUIT — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'radar'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-radar.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets ou Outils) :
//      <div class="mm-sub-item" onclick="createWidget('radar');closeMainMenu()">
//          <span class="mm-ico">📡</span>&nbsp;&nbsp;Radar de Bruit
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* Widget parent transparent : radar-outer porte tout le visuel */
    .widget[data-type="radar"],
    .widget[data-type="radar"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="radar"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="radar"] .radar-outer {
        --rd-ink:    #EAF0FA;
        --rd-muted:  #9AABC8;
        --rd-line:   rgba(234,240,250,0.13);
        --rd-calm:   #8FE0C0;
        --rd-warn:   #F2CF8B;
        --rd-alert:  #FF8A7A;
        --rd-accent: #8EC5FF;
        --rd-deep:   #13203A;
        --rd-level:  var(--rd-calm);

        position: relative;
        width:  340px;
        height: 420px;
        min-width:  220px;
        min-height: 272px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        background:
            radial-gradient(90% 60% at 50% 42%, rgba(142,197,255,0.10), transparent 70%),
            linear-gradient(172deg, #1C2846 0%, #243557 55%, #2C4066 100%);
        border: 1px solid rgba(234,240,250,0.08);
        box-shadow: 0 22px 48px -18px rgba(6,12,28,0.65), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .widget[data-type="radar"] .radar-outer[data-zone="warn"]  { --rd-level: var(--rd-warn); }
    .widget[data-type="radar"] .radar-outer[data-zone="alert"] { --rd-level: var(--rd-alert); }
    .widget[data-type="radar"]:hover .radar-outer,
    .widget[data-type="radar"]:focus-within .radar-outer {
        outline: 2px dashed rgba(142,197,255,0.40);
        outline-offset: 2px;
    }

    /* Poignée de resize proportionnel */
    .radar-resize-handle {
        position: absolute;
        bottom: 5px; right: 5px;
        width: 16px; height: 16px;
        cursor: nwse-resize;
        z-index: 20;
        opacity: 0;
        transition: opacity 0.2s;
        background: radial-gradient(circle, rgba(234,240,250,0.45) 1.2px, transparent 1.6px) 0 0 / 5px 5px;
        -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                mask: linear-gradient(135deg, transparent 50%, #000 50%);
    }
    .widget[data-type="radar"]:hover .radar-resize-handle,
    .widget[data-type="radar"]:focus-within .radar-resize-handle { opacity: 1; }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="radar"] .radar-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
        z-index: 3;
    }

    /* ── Widget intérieur (taille de référence 340×420) ── */
    .radar-widget {
        width: 340px;
        height: 420px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px 16px;
        box-sizing: border-box;
        color: var(--rd-ink);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
    }

    /* ── En-tête ── */
    .radar-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
    }
    .radar-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        color: var(--rd-ink);
    }
    .radar-title svg { width: 18px; height: 18px; color: var(--rd-accent); }

    .radar-icon-btn {
        width: 30px; height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1px solid transparent;
        background: transparent;
        color: var(--rd-muted);
        cursor: pointer;
        padding: 0;
        transition: background .15s, color .15s, border-color .15s;
    }
    .radar-icon-btn svg { width: 17px; height: 17px; }
    .radar-icon-btn:hover { background: rgba(234,240,250,0.08); color: var(--rd-ink); }
    .radar-icon-btn:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; }
    .radar-toggle-controls.is-off { color: var(--rd-accent); border-color: rgba(142,197,255,0.35); }

    /* ── Zone radar ── */
    .radar-box-wrap {
        position: relative;
        width: 210px;
        height: 210px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .radar-ring {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid var(--rd-line);
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
    }
    .radar-ring.outer-ring { background: rgba(10,18,36,0.22); border-color: rgba(234,240,250,0.14); }

    .radar-threshold-ring {
        position: absolute;
        border-radius: 50%;
        border: 2px dashed rgba(255,138,122,0.75);
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
        z-index: 12;
        pointer-events: none;
        transition: transform 0.2s ease-out;
    }

    .radar-blob {
        position: absolute;
        width: 100%; height: 100%;
        border-radius: 50%;
        background-color: var(--rd-level);
        background-image:
            radial-gradient(circle at 34% 28%, rgba(255,255,255,0.6), rgba(255,255,255,0) 55%),
            radial-gradient(circle at 70% 80%, rgba(19,32,58,0.18), rgba(19,32,58,0) 60%);
        box-shadow: 0 0 60px -6px var(--rd-level);
        z-index: 10;
        transform: scale(0);
        transition: transform 0.1s ease-out, background-color 0.5s ease, box-shadow 0.5s ease;
    }

    /* ── Bouton central ── */
    .radar-btn-start {
        position: absolute;
        inset: 0; margin: auto;
        z-index: 50;
        width: 92px; height: 92px;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        font-family: inherit;
        color: var(--rd-deep);
        background: var(--rd-accent);
        box-shadow: 0 10px 26px -8px rgba(142,197,255,0.75);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 0;
        transition: background-color .3s, box-shadow .3s, transform .15s, color .3s;
    }
    .radar-btn-start:active { transform: scale(0.95); }
    .radar-btn-start:focus-visible { outline: 2px solid var(--rd-ink); outline-offset: 3px; }
    .radar-btn-start svg { width: 22px; height: 22px; }
    .radar-btn-text { font-size: 13px; font-weight: 700; }
    .radar-btn-status,
    .radar-btn-stop { display: none; font-size: 15px; font-weight: 700; }

    .radar-btn-start.is-listening {
        background: transparent;
        box-shadow: none;
        color: var(--rd-deep);
    }
    .radar-btn-start.is-listening svg,
    .radar-btn-start.is-listening .radar-btn-text { display: none; }
    .radar-btn-start.is-listening .radar-btn-status { display: block; }
    .radar-btn-start.is-listening:hover { background: rgba(19,32,58,0.75); color: var(--rd-ink); }
    .radar-btn-start.is-listening:hover .radar-btn-status { display: none; }
    .radar-btn-start.is-listening:hover .radar-btn-stop { display: block; }

    /* Le statut reste lisible même quand le blob est petit */
    .radar-outer[data-zone] .radar-btn-start.is-listening:not(:hover) {
        background: rgba(234,240,250,0.92);
        width: 96px; height: 40px;
        border-radius: 999px;
        box-shadow: 0 6px 18px -8px rgba(0,0,0,0.5);
    }

    /* ── Alertes ── */
    .radar-alerts-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        padding: 8px 4px 0;
        border-top: 1px solid var(--rd-line);
    }
    .radar-alerts-main { display: flex; align-items: baseline; gap: 8px; }
    .radar-alert-count {
        font-size: 34px;
        font-weight: 700;
        color: var(--rd-alert);
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }
    .radar-alert-label { font-size: 13px; font-weight: 600; color: var(--rd-muted); }
    .radar-alert-btns { display: flex; align-items: center; gap: 4px; }
    .radar-sound-btn.muted { color: var(--rd-alert); }
    .radar-reset-btn {
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        color: var(--rd-muted);
        background: transparent;
        border: 1px solid var(--rd-line);
        border-radius: 999px;
        padding: 5px 11px;
        cursor: pointer;
        transition: color .15s, border-color .15s;
    }
    .radar-reset-btn:hover { color: var(--rd-ink); border-color: rgba(234,240,250,0.3); }
    .radar-reset-btn:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; }

    /* ── Réglages ── */
    .radar-controls {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 9px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        max-height: 150px;
        opacity: 1;
    }
    .radar-controls.hidden { max-height: 0; opacity: 0; pointer-events: none; }
    .radar-slider-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: var(--rd-muted);
    }
    .radar-slider-label { width: 74px; flex-shrink: 0; }
    .radar-slider {
        --fill: 50%;
        --thumb: var(--rd-accent);
        flex: 1;
        height: 6px;
        margin: 0;
        cursor: pointer;
        border-radius: 6px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, var(--thumb) var(--fill), rgba(234,240,250,0.14) var(--fill));
    }
    .radar-seuil-slider { --thumb: var(--rd-alert); }
    .radar-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--thumb);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
    }
    .radar-slider::-moz-range-thumb {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--thumb);
        cursor: pointer;
    }
    .radar-slider:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 5px; }
    .radar-slider-val {
        width: 34px;
        text-align: right;
        font-weight: 700;
        color: var(--rd-ink);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
    }

    /* ── Alerte : halo rouge sur tout le widget ── */
    .radar-alert-flash {
        display: none;
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: radial-gradient(80% 70% at 50% 45%, rgba(255,138,122,0.0) 30%, rgba(255,138,122,0.28) 100%);
        box-shadow: inset 0 0 0 2px rgba(255,138,122,0.55);
        pointer-events: none;
        z-index: 2;
        animation: radar-flash 0.7s ease-in-out infinite alternate;
    }
    .radar-alert-flash.active { display: block; }
    @keyframes radar-flash { from { opacity: 0.35; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
        .radar-alert-flash { animation: none; opacity: 0.8; }
    }

    /* ── Micro refusé ── */
    .radar-no-mic {
        font-size: 12px;
        font-weight: 600;
        color: var(--rd-alert);
        text-align: center;
        padding: 2px 8px;
        display: none;
        flex-shrink: 0;
    }
    `;

    // Police arrondie partagée avec la Pause calme (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        var fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById('radar-widget-style-v2')) {
        var st = document.createElement('style');
        st.id = 'radar-widget-style-v2';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initRadarWidget = function (widget) {
        (function () {

            // ── Injection HTML ──
            var contentZone = widget.querySelector('.widget-content');
            var ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
            var ICON_MUTE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/></svg>';
            var ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
            var ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
            var ICON_WAVES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/><path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" opacity=".55"/></svg>';

            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML =
                '<div class="radar-outer">'
              +   '<div class="radar-resize-handle"></div>'
              +   '<div class="radar-alert-flash"></div>'
              +   '<div class="radar-scale-wrap">'
              +     '<div class="radar-widget">'
              +       '<div class="radar-header">'
              +         '<div class="radar-title">' + ICON_WAVES + 'Radar de bruit</div>'
              +         '<button class="radar-icon-btn radar-toggle-controls" title="Afficher ou masquer les réglages">' + ICON_SLIDERS + '</button>'
              +       '</div>'
              +       '<div class="radar-box-wrap">'
              +         '<div class="radar-ring outer-ring"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.25)"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.50)"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.75)"></div>'
              +         '<div class="radar-threshold-ring"></div>'
              +         '<div class="radar-blob"></div>'
              +         '<button class="radar-btn-start">'
              +           ICON_MIC
              +           '<span class="radar-btn-text">Écouter</span>'
              +           '<span class="radar-btn-status" aria-live="polite">Calme</span>'
              +           '<span class="radar-btn-stop">Arrêter</span>'
              +         '</button>'
              +       '</div>'
              +       '<div class="radar-alerts-row">'
              +         '<div class="radar-alerts-main">'
              +           '<span class="radar-alert-count">0</span>'
              +           '<span class="radar-alert-label">alerte</span>'
              +         '</div>'
              +         '<div class="radar-alert-btns">'
              +           '<button class="radar-icon-btn radar-sound-btn" title="Couper le bip">' + ICON_SOUND + '</button>'
              +           '<button class="radar-reset-btn">Remettre à zéro</button>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-controls">'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label">Sensibilité</span>'
              +           '<input type="range" class="radar-slider radar-sens-slider" min="0.1" max="5" step="0.1" value="1.5" aria-label="Sensibilité">'
              +           '<span class="radar-slider-val radar-sens-val">1.5</span>'
              +         '</div>'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label">Seuil</span>'
              +           '<input type="range" class="radar-slider radar-seuil-slider" min="10" max="100" step="5" value="75" aria-label="Seuil d\'alerte">'
              +           '<span class="radar-slider-val radar-seuil-val">75%</span>'
              +         '</div>'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label" title="Ignore les bruits courts (règle qui tombe, éternuement…)">Lissage</span>'
              +           '<input type="range" class="radar-slider radar-smooth-slider" min="0" max="10" step="1" value="4" aria-label="Lissage">'
              +           '<span class="radar-slider-val radar-smooth-val">4</span>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-no-mic">Le micro est bloqué. Autorisez-le dans le navigateur.</div>'
              +     '</div>'
              +   '</div>'
              + '</div>';

            // ── Références DOM ──
            var outer          = widget.querySelector('.radar-outer');
            var scaleWrap      = widget.querySelector('.radar-scale-wrap');
            var blob           = widget.querySelector('.radar-blob');
            var threshRing     = widget.querySelector('.radar-threshold-ring');
            var btnStart       = widget.querySelector('.radar-btn-start');
            var btnText        = widget.querySelector('.radar-btn-text');
            var alertCount     = widget.querySelector('.radar-alert-count');
            var soundBtn       = widget.querySelector('.radar-sound-btn');
            var resetBtn       = widget.querySelector('.radar-reset-btn');
            var sensSlider     = widget.querySelector('.radar-sens-slider');
            var seuilSlider    = widget.querySelector('.radar-seuil-slider');
            var sensVal        = widget.querySelector('.radar-sens-val');
            var seuilVal       = widget.querySelector('.radar-seuil-val');
            var noMicEl        = widget.querySelector('.radar-no-mic');
            var flashEl        = widget.querySelector('.radar-alert-flash');
            var toggleBtn      = widget.querySelector('.radar-toggle-controls');
            var controlsEl     = widget.querySelector('.radar-controls');
            var smoothSlider   = widget.querySelector('.radar-smooth-slider');
            var smoothVal      = widget.querySelector('.radar-smooth-val');
            var statusEl       = widget.querySelector('.radar-btn-status');
            var alertLabel     = widget.querySelector('.radar-alert-label');

            function setCount(n) {
                alertCount.textContent = n;
                alertLabel.textContent = n > 1 ? 'alertes' : 'alerte';
            }

            // Remplissage coloré des curseurs
            function paintSlider(sl) {
                var min = parseFloat(sl.min), max = parseFloat(sl.max);
                sl.style.setProperty('--fill', ((parseFloat(sl.value) - min) / (max - min) * 100) + '%');
            }
            [sensSlider, seuilSlider, smoothSlider].forEach(paintSlider);

            // Zones : calme (vert) → attention (doré) → trop fort (corail)
            var ZONE_LABELS = { calm: 'Calme', warn: 'Attention', alert: 'Trop fort' };
            function setZone(level) {
                var r = threshold > 0 ? level / threshold : 0;
                var z = r >= 1 ? 'alert' : (r >= 0.7 ? 'warn' : 'calm');
                if (outer.dataset.zone !== z) {
                    outer.dataset.zone = z;
                    statusEl.textContent = ZONE_LABELS[z];
                }
            }

            // ── Dimensions de référence ──
            var REF_W = 340, REF_H = 420;
            var RATIO = REF_H / REF_W;

            function rescale() {
                var ow = outer.offsetWidth || REF_W;
                var s  = ow / REF_W;
                outer.style.height        = Math.round(ow * RATIO) + 'px';
                scaleWrap.style.width     = REF_W + 'px';
                scaleWrap.style.height    = REF_H + 'px';
                scaleWrap.style.transform = 'scale(' + s + ')';
            }

            // ── Resize proportionnel ──
            var resizeHandle = outer.querySelector('.radar-resize-handle');
            resizeHandle.addEventListener('mousedown', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var startX = e.clientX;
                var startW = outer.offsetWidth;

                function onMove(ev) {
                    var newW = Math.max(220, startW + (ev.clientX - startX));
                    outer.style.width = newW + 'px';
                    rescale();
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
            resizeHandle.addEventListener('touchstart', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var startX = e.touches[0].clientX;
                var startW = outer.offsetWidth;
                function onMove(ev) {
                    var newW = Math.max(220, startW + (ev.touches[0].clientX - startX));
                    outer.style.width = newW + 'px';
                    rescale();
                }
                function onEnd() {
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend',  onEnd);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend',  onEnd);
            }, { passive: false });

            rescale();

            // ── État interne ──
            var isListening   = false;
            var isMuted       = false;
            var alertsCount   = 0;
            var canTrigger    = true;
            var canPlaySound  = true;
            var smoothedLevel = 0;
            var sensitivity   = 1.5;
            var threshold     = 75;

            // ── Lissage anti-pics courts ──
            // smoothingStrength : 0 = désactivé, 1-10 = force croissante
            var smoothingStrength = 4;
            // Buffer circulaire pour moyenne glissante
            var BUFFER_MAX = 30;          // taille max du buffer (frames)
            var sampleBuffer = [];
            // Durée minimale de dépassement avant alerte (en frames ~43ms chacune)
            // smoothingStrength 0→0 frames, 10→~15 frames (~650ms)
            var sustainFrames = 0;        // nb frames consécutives au-dessus du seuil
            var sustainRequired = 0;      // nb frames requis avant déclenchement

            function updateSmoothingParams() {
                // bufferSize : de 1 (pas de lissage) à 20 frames
                var bufSize = smoothingStrength === 0 ? 1 : Math.round(2 + smoothingStrength * 1.8);
                // frames requises au-dessus du seuil : 0 à ~15
                sustainRequired = smoothingStrength === 0 ? 0 : Math.round(smoothingStrength * 1.4);
                // tronquer le buffer si on réduit la taille
                if (sampleBuffer.length > bufSize) sampleBuffer = sampleBuffer.slice(-bufSize);
                return bufSize;
            }
            updateSmoothingParams();

            // Seuil → taille du cercle pointillé
            function applyThreshold(val) {
                threshold = parseInt(val);
                threshRing.style.transform = 'scale(' + (threshold / 100) + ')';
                seuilVal.textContent = threshold + '%';
            }
            applyThreshold(75);

            // ── Audio ──
            var audioCtx        = null;
            var analyser        = null;
            var scriptProcessor = null;
            var micStream       = null;

            function getFrequencyAvg() {
                if (!analyser) return 0;
                var arr = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(arr);
                var sum = 0;
                for (var i = 0; i < arr.length; i++) sum += arr[i];
                return sum / arr.length;
            }

            function playAlert() {
                if (isMuted || !canPlaySound || !audioCtx) return;
                canPlaySound = false;
                if (audioCtx.state === 'suspended') audioCtx.resume();
                var osc      = audioCtx.createOscillator();
                var gainNode = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);
                setTimeout(function () { canPlaySound = true; }, 1500);
            }

            function render(value) {
                var raw = Math.min(value * sensitivity, 100);

                if (smoothingStrength === 0) {
                    // Mode direct : comportement original
                    smoothedLevel += (raw - smoothedLevel) * 0.15;
                    blob.style.transform = 'scale(' + (smoothedLevel / 100) + ')';
                    setZone(smoothedLevel);
                    if (smoothedLevel > threshold) {
                        blob.classList.add('is-alerting');
                        flashEl.classList.add('active');
                        if (canTrigger) { alertsCount++; setCount(alertsCount); playAlert(); canTrigger = false; }
                    } else {
                        blob.classList.remove('is-alerting'); flashEl.classList.remove('active');
                        if (smoothedLevel < threshold - 5) canTrigger = true;
                    }
                    return;
                }

                // ── Mode lissage : séparer le niveau ambiant soutenu des pics courts ──

                // 1. Buffer circulaire de valeurs brutes
                var bufSize = updateSmoothingParams();
                sampleBuffer.push(raw);
                if (sampleBuffer.length > bufSize) sampleBuffer.shift();

                // 2. Percentile bas = niveau ambiant (ignore les pics hauts)
                //    Plus le lissage est fort, plus on prend bas dans le tableau trié
                var sorted = sampleBuffer.slice().sort(function(a, b){ return a - b; });
                var pctIdx = Math.floor(sorted.length * Math.max(0.2, 0.8 - smoothingStrength * 0.06));
                var ambientLevel = sorted[pctIdx] || 0;

                // 3. Lissage exponentiel très lent sur ce niveau ambiant
                var upAlpha   = Math.max(0.03, 0.12 - smoothingStrength * 0.008);
                var downAlpha = Math.max(0.01, 0.06 - smoothingStrength * 0.004);
                var alpha = ambientLevel > smoothedLevel ? upAlpha : downAlpha;
                smoothedLevel += (ambientLevel - smoothedLevel) * alpha;

                // 4. Blob = niveau ambiant uniquement (les pics courts n'y apparaissent pas)
                blob.style.transform = 'scale(' + (smoothedLevel / 100) + ')';
                setZone(smoothedLevel);

                // 5. Alerte si le niveau ambiant depasse le seuil de facon soutenue
                if (smoothedLevel > threshold) {
                    blob.classList.add('is-alerting');
                    flashEl.classList.add('active');
                    sustainFrames++;
                    if (canTrigger && sustainFrames >= sustainRequired) {
                        alertsCount++; setCount(alertsCount); playAlert(); canTrigger = false;
                    }
                } else {
                    blob.classList.remove('is-alerting'); flashEl.classList.remove('active');
                    sustainFrames = 0;
                    if (smoothedLevel < threshold - 5) canTrigger = true;
                }
            }

            function startMic() {
                navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(function (stream) {
                        micStream = stream;
                        audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
                        analyser  = audioCtx.createAnalyser();
                        analyser.fftSize = 256;
                        var source = audioCtx.createMediaStreamSource(stream);
                        scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
                        source.connect(analyser);
                        analyser.connect(scriptProcessor);
                        scriptProcessor.connect(audioCtx.destination);
                        scriptProcessor.onaudioprocess = function () {
                            render(getFrequencyAvg());
                        };

                        isListening = true;
                        btnStart.classList.add('is-listening');
                        setZone(0);
                        noMicEl.style.display = 'none';

                        // Son de démarrage
                        setTimeout(function () { playAlert(); }, 100);
                    })
                    .catch(function (err) {
                        noMicEl.style.display = 'block';
                        console.warn('[Radar] Microphone refusé :', err);
                    });
            }

            function stopMic() {
                if (scriptProcessor) { scriptProcessor.onaudioprocess = null; }
                if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
                if (audioCtx)  { audioCtx.close(); audioCtx = null; }
                analyser = null;
                scriptProcessor = null;
                isListening = false;
                smoothedLevel = 0;
                sampleBuffer = [];
                sustainFrames = 0;
                blob.style.transform = 'scale(0)';
                blob.classList.remove('is-alerting');
                flashEl.classList.remove('active');
                btnStart.classList.remove('is-listening');
                delete outer.dataset.zone;
            }

            // ── Événements boutons ──
            btnStart.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!isListening) startMic(); else stopMic();
            });

            soundBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                isMuted = !isMuted;
                soundBtn.innerHTML = isMuted ? ICON_MUTE : ICON_SOUND;
                soundBtn.title = isMuted ? 'Remettre le bip' : 'Couper le bip';
                soundBtn.classList.toggle('muted', isMuted);
            });

            resetBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                alertsCount = 0;
                setCount(0);
                canTrigger = true;
            });

            sensSlider.addEventListener('input', function () {
                sensitivity = parseFloat(this.value);
                sensVal.textContent = parseFloat(this.value).toFixed(1);
                paintSlider(this);
            });

            seuilSlider.addEventListener('input', function () {
                applyThreshold(this.value);
                paintSlider(this);
            });

            smoothSlider.addEventListener('input', function () {
                smoothingStrength = parseInt(this.value);
                smoothVal.textContent = smoothingStrength;
                paintSlider(this);
                sampleBuffer = [];
                sustainFrames = 0;
                updateSmoothingParams();
            });

            // ── Toggle contrôles ──
            var controlsVisible = true;
            toggleBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                controlsVisible = !controlsVisible;
                controlsEl.classList.toggle('hidden', !controlsVisible);
                toggleBtn.classList.toggle('is-off', !controlsVisible);
            });

            // ── Bloquer propagation uniquement sur éléments interactifs ──
            outer.addEventListener('mousedown', function (e) {
                if (e.target.closest('button, input, .radar-resize-handle')) {
                    e.stopPropagation();
                }
            });
            outer.addEventListener('touchstart', function (e) {
                if (e.target.closest('button, input, .radar-resize-handle')) {
                    e.stopPropagation();
                }
            }, { passive: true });

            // ── Curseur move sauf sur éléments interactifs et coin resize ──
            outer.addEventListener('mousemove', function (e) {
                if (e.target.closest('button, input')) { return; }
                if (e.target.closest('.radar-resize-handle')) { outer.style.cursor = 'nwse-resize'; return; }
                outer.style.cursor = 'move';
            });
            outer.addEventListener('mouseleave', function () {
                outer.style.cursor = '';
            });

            // ── Nettoyage à la suppression ──
            var obs = new MutationObserver(function () {
                if (!document.contains(widget)) {
                    stopMic();
                    obs.disconnect();
                }
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
            if (type === 'radar') initRadarWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'radar') initRadarWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
