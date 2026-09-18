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
        position: relative;
        width:  340px;
        height: 420px;
        min-width:  220px;
        min-height: 272px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 24px;
        background: #f5f7fa;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .widget[data-type="radar"]:hover .radar-outer,
    .widget[data-type="radar"]:focus-within .radar-outer {
        outline: 2px dashed rgba(74,144,226,0.45);
    }

    /* Poignée de resize proportionnel */
    .radar-resize-handle {
        position: absolute;
        bottom: 0; right: 0;
        width: 18px; height: 18px;
        cursor: nwse-resize;
        z-index: 20;
        opacity: 0;
        transition: opacity 0.2s;
        background-image: linear-gradient(135deg,
            transparent 50%, #3b82f6 50%, #3b82f6 60%,
            transparent 60%, transparent 70%,
            #3b82f6 70%, #3b82f6 80%, transparent 80%);
        border-bottom-right-radius: 24px;
    }
    .widget[data-type="radar"]:hover .radar-resize-handle,
    .widget[data-type="radar"]:focus-within .radar-resize-handle {
        opacity: 1;
    }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="radar"] .radar-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
    }

    /* ── Widget intérieur (taille de référence 340×420) ── */
    .radar-widget {
        width: 340px;
        height: 420px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 18px 16px 16px;
        box-sizing: border-box;
        background: #f5f7fa;
        border-radius: 24px;
        color: #1a1a2e;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
        gap: 0;
    }

    /* ── Titre ── */
    .radar-title {
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(0,0,0,0.35);
        flex-shrink: 0;
    }

    /* ── Zone radar ── */
    .radar-box-wrap {
        position: relative;
        width: 220px;
        height: 220px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .radar-ring {
        position: absolute;
        border-radius: 50%;
        border: 4px solid #3b82f6;
        opacity: 0.12;
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
    }

    .radar-threshold-ring {
        position: absolute;
        border-radius: 50%;
        border: 2px dashed rgba(0,0,0,0.3);
        top: 0; left: 0;
        width: 100%; height: 100%;
        box-sizing: border-box;
        z-index: 5;
        pointer-events: none;
        transition: transform 0.2s ease-out;
    }

    .radar-blob {
        position: absolute;
        width: 100%; height: 100%;
        border-radius: 50%;
        background: #3b82f6;
        box-shadow: 0 0 40px rgba(59,130,246,0.4);
        z-index: 10;
        transform: scale(0);
        transition: transform 0.1s ease-out, background-color 0.4s ease, box-shadow 0.4s ease;
    }

    .radar-blob.is-alerting {
        background: #ef4444 !important;
        box-shadow: 0 0 50px rgba(239,68,68,0.4) !important;
    }

    /* ── Bouton démarrer (au centre du radar) ── */
    .radar-btn-start {
        position: absolute;
        inset: 0; margin: auto;
        z-index: 50;
        width: 80px; height: 80px;
        border-radius: 50%;
        font-size: 9px;
        font-weight: 900;
        line-height: 1.3;
        text-transform: uppercase;
        cursor: pointer;
        border: none;
        color: #fff;
        background: #3b82f6;
        transition: opacity 0.3s, transform 0.3s;
        box-shadow: 0 6px 16px rgba(59,130,246,0.35);
    }
    .radar-btn-start.is-listening {
        opacity: 0.15;
        transform: scale(0.9);
    }
    .radar-btn-start.is-listening:hover {
        opacity: 0.6;
    }

    /* ── Compteur alertes ── */
    .radar-alerts-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-shrink: 0;
    }
    .radar-alert-label {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        opacity: 0.4;
        letter-spacing: 1px;
        color: #1a1a2e;
    }
    .radar-alert-count {
        font-size: 32px;
        font-weight: 900;
        color: #ef4444;
        line-height: 1;
        min-width: 36px;
        text-align: center;
    }

    /* ── Bouton son + reset ── */
    .radar-alert-btns {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .radar-sound-btn {
        background: none;
        border: none;
        color: rgba(0,0,0,0.4);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        font-size: 14px;
        transition: color 0.2s;
    }
    .radar-sound-btn:hover { color: rgba(0,0,0,0.8); }
    .radar-sound-btn.muted { color: rgba(220,50,50,0.6); }
    .radar-reset-btn {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        color: rgba(0,0,0,0.3);
        background: none;
        border: none;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s;
    }
    .radar-reset-btn:hover { color: rgba(0,0,0,0.6); }

    /* ── Contrôles (sliders) ── */
    .radar-controls {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        max-height: 150px;
        opacity: 1;
    }
    .radar-controls.hidden {
        max-height: 0;
        opacity: 0;
        pointer-events: none;
    }
    .radar-slider-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 10px;
        color: rgba(0,0,0,0.5);
    }
    .radar-slider-label {
        width: 72px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 9px;
        flex-shrink: 0;
    }
    .radar-slider {
        flex: 1;
        accent-color: #3b82f6;
        height: 4px;
        cursor: pointer;
        background: rgba(0,0,0,0.12);
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
    }
    .radar-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    .radar-slider::-moz-range-thumb {
        width: 14px; height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: none;
    }
    .radar-slider-val {
        width: 28px;
        text-align: right;
        font-size: 10px;
        font-weight: 700;
        color: rgba(0,0,0,0.5);
        flex-shrink: 0;
    }

    /* ── Toggle contrôles ── */
    .radar-toggle-controls {
        position: absolute;
        top: 8px; left: 10px;
        background: rgba(0,0,0,0.06);
        border: none;
        border-radius: 6px;
        color: rgba(0,0,0,0.35);
        font-size: 11px;
        padding: 3px 8px;
        cursor: pointer;
        transition: background 0.18s, color 0.18s;
        z-index: 15;
    }
    .radar-toggle-controls:hover {
        background: rgba(0,0,0,0.12);
        color: rgba(0,0,0,0.8);
    }

    /* ── Alerte flash ── */
    .radar-alert-flash {
        display: none;
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: rgba(239,68,68,0.12);
        pointer-events: none;
        z-index: 2;
        animation: radar-flash 0.6s ease-in-out infinite alternate;
    }
    .radar-alert-flash.active { display: block; }
    @keyframes radar-flash {
        from { opacity: 0.3; }
        to   { opacity: 1; }
    }

    /* ── No mic ── */
    .radar-no-mic {
        font-size: 10px;
        color: rgba(200,50,50,0.9);
        text-align: center;
        padding: 2px 8px;
        display: none;
        flex-shrink: 0;
    }
    `;

    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById('radar-widget-style')) {
        var st = document.createElement('style');
        st.id = 'radar-widget-style';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initRadarWidget = function (widget) {
        (function () {

            // ── Injection HTML ──
            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML =
                '<div class="radar-outer">'
              +   '<div class="radar-resize-handle"></div>'
              +   '<div class="radar-alert-flash"></div>'
              +   '<button class="radar-toggle-controls" title="Afficher/masquer les contrôles">⚙️</button>'
              +   '<div class="radar-scale-wrap">'
              +     '<div class="radar-widget">'
              +       '<div class="radar-title">📡 Radar de Bruit</div>'
              +       '<div class="radar-box-wrap">'
              +         '<div class="radar-ring" style="transform:scale(0.25)"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.50)"></div>'
              +         '<div class="radar-ring" style="transform:scale(0.75)"></div>'
              +         '<div class="radar-ring" style="transform:scale(1)"></div>'
              +         '<div class="radar-threshold-ring"></div>'
              +         '<div class="radar-blob"></div>'
              +         '<button class="radar-btn-start"><span class="radar-btn-text">Lancer<br>l\'analyse</span></button>'
              +       '</div>'
              +       '<div class="radar-alerts-row">'
              +         '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">'
              +           '<div class="radar-alert-label">Alertes</div>'
              +           '<div class="radar-alert-count">0</div>'
              +         '</div>'
              +         '<div class="radar-alert-btns">'
              +           '<button class="radar-sound-btn" title="Son on/off">🔊</button>'
              +           '<button class="radar-reset-btn">Reset</button>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-controls">'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label">Sensibilité</span>'
              +           '<input type="range" class="radar-slider radar-sens-slider" min="0.1" max="5" step="0.1" value="1.5">'
              +           '<span class="radar-slider-val radar-sens-val">1.5</span>'
              +         '</div>'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label">Seuil</span>'
              +           '<input type="range" class="radar-slider radar-seuil-slider" min="10" max="100" step="5" value="75">'
              +           '<span class="radar-slider-val radar-seuil-val">75%</span>'
              +         '</div>'
              +         '<div class="radar-slider-row">'
              +           '<span class="radar-slider-label" title="Lisse les bruits courts (règle, éternuement…)">Lissage</span>'
              +           '<input type="range" class="radar-slider radar-smooth-slider" min="0" max="10" step="1" value="4">'
              +           '<span class="radar-slider-val radar-smooth-val">4</span>'
              +         '</div>'
              +       '</div>'
              +       '<div class="radar-no-mic">⚠️ Microphone refusé</div>'
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
                    if (smoothedLevel > threshold) {
                        blob.classList.add('is-alerting');
                        flashEl.classList.add('active');
                        if (canTrigger) { alertsCount++; alertCount.textContent = alertsCount; playAlert(); canTrigger = false; }
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

                // 5. Alerte si le niveau ambiant depasse le seuil de facon soutenue
                if (smoothedLevel > threshold) {
                    blob.classList.add('is-alerting');
                    flashEl.classList.add('active');
                    sustainFrames++;
                    if (canTrigger && sustainFrames >= sustainRequired) {
                        alertsCount++; alertCount.textContent = alertsCount; playAlert(); canTrigger = false;
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
                        btnText.innerHTML = 'Arrêter';
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
                btnText.innerHTML = "Lancer<br>l'analyse";
            }

            // ── Événements boutons ──
            btnStart.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!isListening) startMic(); else stopMic();
            });

            soundBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                isMuted = !isMuted;
                soundBtn.textContent = isMuted ? '🔇' : '🔊';
                soundBtn.classList.toggle('muted', isMuted);
            });

            resetBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                alertsCount = 0;
                alertCount.textContent = '0';
                canTrigger = true;
            });

            sensSlider.addEventListener('input', function () {
                sensitivity = parseFloat(this.value);
                sensVal.textContent = parseFloat(this.value).toFixed(1);
            });

            seuilSlider.addEventListener('input', function () {
                applyThreshold(this.value);
            });

            smoothSlider.addEventListener('input', function () {
                smoothingStrength = parseInt(this.value);
                smoothVal.textContent = smoothingStrength;
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
                toggleBtn.style.color = controlsVisible
                    ? 'rgba(0,0,0,0.35)'
                    : '#3b82f6';
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
