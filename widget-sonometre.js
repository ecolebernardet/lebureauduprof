// =========================================================================
// WIDGET SONOMÈTRE — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'sonometre'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-sonometre.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('sonometre');closeMainMenu()">
//          <span class="mm-ico">🔊</span>&nbsp;&nbsp;Sonomètre
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* Le widget parent devient invisible, sono-outer porte tout le visuel */
    .widget[data-type="sonometre"],
    .widget[data-type="sonometre"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="sonometre"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Wrapper externe ── */
    /* Le widget parent devient invisible, sono-outer porte tout le visuel */
    .widget[data-type="sonometre"],
    .widget[data-type="sonometre"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="sonometre"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }
    .widget[data-type="sonometre"] .sono-outer {
        position: relative;
        width:  300px;
        height: 480px;
        min-width:  220px;
        min-height: 352px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
    }
    .widget[data-type="sonometre"]:hover .sono-outer,
    .widget[data-type="sonometre"]:focus-within .sono-outer {
        outline: 2px dashed rgba(74,144,226,0.35);
    }
    /* Poignée de resize proportionnel custom */
    .sono-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 18px;
        height: 18px;
        cursor: nwse-resize;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s;
        background-image: linear-gradient(135deg,
            transparent 50%, #4a90e2 50%, #4a90e2 60%,
            transparent 60%, transparent 70%,
            #4a90e2 70%, #4a90e2 80%, transparent 80%);
        border-bottom-right-radius: 16px;
    }
    .widget[data-type="sonometre"]:hover .sono-resize-handle,
    .widget[data-type="sonometre"]:focus-within .sono-resize-handle {
        opacity: 1;
    }

    /* ── Contenu mis à l'échelle ── */
    .widget[data-type="sonometre"] .sono-scale-wrap {
        position: absolute;
        top: 0; left: 0;
        transform-origin: top left;
    }

    /* ── Widget intérieur (taille de référence 300x340) ── */
    .sono-widget {
        width: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 18px 14px;
        gap: 10px;
        user-select: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
        box-sizing: border-box;
        background: #1a1a2e;
        border-radius: 16px;
        color: #fff;
    }

    /* ── Titre ── */
    .sono-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.5);
        margin-bottom: 2px;
    }

    /* ── Jauge semi-circulaire ── */
    .sono-gauge-wrap {
        position: relative;
        width: 220px;
        height: 120px;
        overflow: visible;
    }
    .sono-gauge-wrap svg {
        width: 100%;
        height: auto;
        overflow: visible;
    }

    /* ── Affichage dB numérique ── */
    .sono-db-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: -4px;
    }
    .sono-db-value {
        font-size: 40px;
        font-weight: 800;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        letter-spacing: -2px;
        transition: color 0.3s;
        color: #fff;
    }
    .sono-db-unit {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255,255,255,0.4);
        letter-spacing: 1px;
        margin-top: 2px;
    }

    /* ── Label état ── */
    .sono-label {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 5px 18px;
        border-radius: 20px;
        transition: background 0.4s, color 0.4s;
        text-align: center;
    }

    /* ── Barres verticales (visualiseur) ── */
    .sono-bars {
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: 48px;
        width: 100%;
        justify-content: center;
        padding: 0 4px;
        box-sizing: border-box;
    }
    .sono-bar {
        flex: 1;
        max-width: 14px;
        border-radius: 3px 3px 0 0;
        transition: height 0.08s ease-out, background 0.3s;
        min-height: 2px;
    }

    /* ── Boutons ── */
    .sono-btns {
        display: flex;
        gap: 8px;
        margin-top: 2px;
    }
    .sono-btn {
        padding: 7px 18px;
        border: none;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.18s, transform 0.1s, opacity 0.2s;
        letter-spacing: 0.5px;
    }
    .sono-btn:active { transform: scale(0.96); }
    .sono-btn-start {
        background: #4a90e2;
        color: #fff;
    }
    .sono-btn-start:hover { background: #357abd; }
    .sono-btn-reset {
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.7);
    }
    .sono-btn-reset:hover { background: rgba(255,255,255,0.18); }

    /* ── Seuils personnalisables ── */
    .sono-thresholds {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: rgba(255,255,255,0.06);
        border-radius: 10px;
        padding: 8px 10px;
        box-sizing: border-box;
    }
    .sono-thresh-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: rgba(255,255,255,0.6);
    }
    .sono-thresh-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .sono-thresh-label { flex: 1; }
    .sono-thresh-input {
        width: 46px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 5px;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        text-align: center;
        padding: 2px 4px;
        outline: none;
    }
    .sono-thresh-input:focus { border-color: #4a90e2; }

    /* ── Message alerte ── */
    .sono-alert {
        display: none;
        position: absolute;
        top: 10px;
        right: 14px;
        font-size: 22px;
        animation: sono-pulse 0.6s infinite alternate;
        pointer-events: none;
        z-index: 5;
    }
    @keyframes sono-pulse {
        from { opacity: 0.5; transform: scale(0.9); }
        to   { opacity: 1;   transform: scale(1.1); }
    }

    /* ── Bouton toggle contrôles ── */
    .sono-toggle-controls {
        position: absolute;
        top: 8px;
        left: 10px;
        background: rgba(255,255,255,0.08);
        border: none;
        border-radius: 6px;
        color: rgba(255,255,255,0.5);
        font-size: 11px;
        padding: 3px 8px;
        cursor: pointer;
        transition: background 0.18s, color 0.18s;
        z-index: 5;
    }
    .sono-toggle-controls:hover {
        background: rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.9);
    }

    /* ── Zone contrôles (boutons + seuils) ── */
    .sono-controls {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        max-height: 200px;
        opacity: 1;
    }
    .sono-controls.hidden {
        max-height: 0;
        opacity: 0;
        pointer-events: none;
    }

    /* ── Micro refusé ── */
    .sono-no-mic {
        font-size: 11px;
        color: rgba(255,100,100,0.8);
        text-align: center;
        padding: 4px 8px;
        display: none;
    }
    `;

    // ── Injection CSS ─────────────────────────────────────────────────────
    if (!document.getElementById('sono-style')) {
        const st = document.createElement('style');
        st.id = 'sono-style';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Initialisation d'une instance de widget ────────────────────────────
    window.initSonometreWidget = function (widget) {
        (function () {

            // Injection HTML directe (sans passer par le système de template)
            var bars = '';
            for (var b = 0; b < 16; b++) {
                bars += '<div class="sono-bar" style="height:2px;background:rgba(255,255,255,0.2)"></div>';
            }
            var contentZone = widget.querySelector('.widget-content');
            contentZone.innerHTML = ''
                + '<div class="sono-outer"><div class="sono-resize-handle"></div><div class="sono-scale-wrap"><div class="sono-widget">'
                + '<div class="sono-title">\uD83C\uDF99\uFE0F Sonom\u00E8tre</div>'
                + '<div class="sono-gauge-wrap"><svg viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">'
                + '<defs><linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">'
                + '<stop offset="0%" stop-color="#2ecc71"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#e74c3c"/>'
                + '</linearGradient></defs>'
                + '<path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="16" stroke-linecap="round"/>'
                + '<path class="sono-arc-val" d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="url(#gaugeGrad)" stroke-width="16" stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="283" style="transition:stroke-dashoffset 0.15s ease-out;"/>'
                + '<line class="sono-needle" x1="110" y1="110" x2="110" y2="30" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" style="transform-origin:110px 110px;transform:rotate(-90deg);transition:transform 0.15s ease-out;"/>'
                + '<circle cx="110" cy="110" r="6" fill="rgba(255,255,255,0.9)"/>'
                + '<text x="16" y="128" fill="rgba(255,255,255,0.35)" font-size="9" text-anchor="middle">0</text>'
                + '<text x="55" y="60" fill="rgba(255,255,255,0.35)" font-size="9" text-anchor="middle">30</text>'
                + '<text x="110" y="28" fill="rgba(255,255,255,0.35)" font-size="9" text-anchor="middle">60</text>'
                + '<text x="165" y="60" fill="rgba(255,255,255,0.35)" font-size="9" text-anchor="middle">90</text>'
                + '<text x="204" y="128" fill="rgba(255,255,255,0.35)" font-size="9" text-anchor="middle">120</text>'
                + '</svg></div>'
                + '<div class="sono-db-display"><div class="sono-db-value">--</div><div class="sono-db-unit">dB</div></div>'
                + '<div class="sono-label">Microphone inactif</div>'
                + '<div class="sono-alert" style="display:none;">&#x1F507;</div>'
                + '<div class="sono-bars">' + bars + '</div>'
                + '<button class="sono-toggle-controls" title="Afficher/masquer les contrôles">⚙️</button>'
                + '<div class="sono-controls">'
                + '<div class="sono-btns">'
                + '<button class="sono-btn sono-btn-start">&#9654; Démarrer</button>'
                + '<button class="sono-btn sono-btn-reset">Réinitialiser</button>'
                + '</div>'
                + '<div class="sono-thresholds">'
                + '<div class="sono-thresh-row"><div class="sono-thresh-dot" style="background:#2ecc71"></div><span class="sono-thresh-label">Calme (en-dessous de)</span><input class="sono-thresh-input" type="number" min="10" max="100" value="40"> dB</div>'
                + '<div class="sono-thresh-row"><div class="sono-thresh-dot" style="background:#f39c12"></div><span class="sono-thresh-label">Agité (en-dessous de)</span><input class="sono-thresh-input" type="number" min="10" max="120" value="60"> dB</div>'
                + '<div class="sono-thresh-row"><div class="sono-thresh-dot" style="background:#e74c3c"></div><span class="sono-thresh-label">Trop bruyant (au-dessus)</span></div>'
                + '</div>'
                + '</div>'
                + '<div class="sono-no-mic" style="display:none;">&#x26A0;&#xFE0F; Acc\u00E8s au microphone refus\u00E9</div>'
                + '</div></div></div>';

            // ── Éléments DOM ──
            const outer     = widget.querySelector('.sono-outer');
            const scaleWrap = widget.querySelector('.sono-scale-wrap');
            const arcVal    = widget.querySelector('.sono-arc-val');
            const needle    = widget.querySelector('.sono-needle');
            const dbValue   = widget.querySelector('.sono-db-value');
            const labelEl   = widget.querySelector('.sono-label');
            const alertEl   = widget.querySelector('.sono-alert');
            const barsEl    = widget.querySelectorAll('.sono-bar');
            const btnStart  = widget.querySelector('.sono-btn-start');
            const btnReset  = widget.querySelector('.sono-btn-reset');
            const noMicEl   = widget.querySelector('.sono-no-mic');
            const threshInputs = widget.querySelectorAll('.sono-thresh-input');

            // ── État ──
            let running      = false;
            let audioCtx     = null;
            let analyser     = null;
            let micStream    = null;
            let rafId        = null;
            let maxDb        = 0;
            let smoothDb     = 0;   // valeur lissée pour l'affichage
            let barHistory   = Array(16).fill(0);

            // Seuils par défaut (lus depuis les inputs)
            function getThresholds() {
                const vals = Array.from(threshInputs).map(i => parseFloat(i.value) || 0);
                return { calm: vals[0] || 45, agitated: vals[1] || 65 };
            }

            // ── Mise à l'échelle ──────────────────────────────────────────
            const REF_W = 300, REF_H = 480;
            const RATIO = REF_H / REF_W;

            function rescale() {
                var ow = outer.offsetWidth || REF_W;
                var s  = ow / REF_W;
                outer.style.height        = Math.round(ow * RATIO) + 'px';
                scaleWrap.style.width     = REF_W + 'px';
                scaleWrap.style.height    = REF_H + 'px';
                scaleWrap.style.transform = 'scale(' + s + ')';
            }

            // ── Resize proportionnel custom ───────────────────────────────
            var resizeHandle = outer.querySelector('.sono-resize-handle');
            resizeHandle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var startX  = e.clientX;
                var startW  = outer.offsetWidth;

                document.addEventListener('mousemove', onResizeMove);
                document.addEventListener('mouseup',   onResizeUp);

                function onResizeMove(ev) {
                    var newW = Math.max(220, startW + (ev.clientX - startX));
                    outer.style.width = newW + 'px';
                    rescale();
                }
                function onResizeUp() {
                    document.removeEventListener('mousemove', onResizeMove);
                    document.removeEventListener('mouseup',   onResizeUp);
                    if (typeof saveBoard === 'function') saveBoard();
                }
            });
            resizeHandle.addEventListener('touchstart', function(e) {
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

            // ── Conversion niveau audio → dB estimé ───────────────────────
            // L'AnalyserNode donne des données de volume [0..255].
            // On mappe vers une plage dB "simulée" 20..100 dB représentative
            // du bruit en classe.
            function rawToDB(raw) {
                // raw : 0..255 → linéaire → décibels perçus
                if (raw <= 0) return 20;
                // mapping exponentiel pour rendre la jauge réaliste
                return Math.min(120, Math.round(20 + (raw / 255) * 100));
            }

            // ── Mise à jour de la jauge SVG ────────────────────────────────
            // L'arc total (demi-cercle) = 283 unités de stroke-dasharray (π×r avec r≈90).
            const ARC_TOTAL = 283;
            function updateGauge(db) {
                const ratio    = Math.max(0, Math.min(1, (db - 20) / 100)); // 20..120 → 0..1
                const dashOffset = ARC_TOTAL * (1 - ratio);
                arcVal.style.strokeDashoffset = dashOffset;

                // Aiguille : -90° (0 dB) → +90° (120 dB)
                const angleDeg = -90 + ratio * 180;
                needle.style.transform = `rotate(${angleDeg}deg)`;
            }

            // ── Couleur / label selon le niveau ───────────────────────────
            const STATES = [
                { color: '#2ecc71', bg: 'rgba(46,204,113,0.18)',  text: '😊 Calme',        alert: null },
                { color: '#f39c12', bg: 'rgba(243,156,18,0.18)',  text: '😬 Un peu agité', alert: null },
                { color: '#e74c3c', bg: 'rgba(231,76,60,0.22)',   text: '🔴 Trop bruyant!', alert: '🔇' },
            ];

            function getStateIdx(db) {
                const t = getThresholds();
                if (db < t.calm)     return 0;
                if (db < t.agitated) return 1;
                return 2;
            }

            function applyState(idx) {
                const s = STATES[idx];
                dbValue.style.color    = s.color;
                labelEl.textContent    = s.text;
                labelEl.style.background = s.bg;
                labelEl.style.color    = s.color;
                if (s.alert) {
                    alertEl.textContent = s.alert;
                    alertEl.style.display = 'block';
                } else {
                    alertEl.style.display = 'none';
                }
            }

            // ── Mise à jour barres ─────────────────────────────────────────
            function updateBars(dataArray) {
                const step = Math.floor(dataArray.length / 16);
                for (let i = 0; i < 16; i++) {
                    let sum = 0;
                    for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
                    const avg = sum / step;
                    // lissage léger
                    barHistory[i] = barHistory[i] * 0.6 + avg * 0.4;
                    const h = Math.max(2, Math.round((barHistory[i] / 255) * 46));
                    const t = getThresholds();
                    const db = rawToDB(barHistory[i]);
                    const barColor = db < t.calm ? '#2ecc71' : db < t.agitated ? '#f39c12' : '#e74c3c';
                    barsEl[i].style.height     = h + 'px';
                    barsEl[i].style.background = barColor;
                }
            }

            // ── Boucle RAF ─────────────────────────────────────────────────
            function frame() {
                if (!running || !analyser) return;
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);

                // Volume moyen (pondéré sur les fréquences pertinentes voix)
                let sum = 0, count = 0;
                const lo = Math.floor(data.length * 0.05);
                const hi = Math.floor(data.length * 0.6);
                for (let i = lo; i < hi; i++) { sum += data[i]; count++; }
                const raw = count ? sum / count : 0;

                const db = rawToDB(raw);
                smoothDb = smoothDb * 0.7 + db * 0.3;
                const displayDb = Math.round(smoothDb);

                if (displayDb > maxDb) maxDb = displayDb;

                dbValue.textContent = displayDb;
                updateGauge(displayDb);
                applyState(getStateIdx(displayDb));
                updateBars(data);

                rafId = requestAnimationFrame(frame);
            }

            // ── Démarrer le micro ──────────────────────────────────────────
            async function startMic() {
                try {
                    noMicEl.style.display = 'none';
                    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
                    analyser  = audioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    analyser.smoothingTimeConstant = 0.6;
                    const src = audioCtx.createMediaStreamSource(micStream);
                    src.connect(analyser);
                    running = true;
                    btnStart.textContent = '⏹ Arrêter';
                    btnStart.className   = 'sono-btn sono-btn-start';
                    btnStart.style.background = '#e74c3c';
                    rafId = requestAnimationFrame(frame);
                } catch (err) {
                    noMicEl.style.display = 'block';
                    console.warn('[Sonomètre] Microphone refusé :', err);
                }
            }

            // ── Arrêter le micro ───────────────────────────────────────────
            function stopMic() {
                running = false;
                cancelAnimationFrame(rafId);
                rafId = null;
                if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
                if (audioCtx)  { audioCtx.close(); audioCtx = null; }
                analyser = null;
                btnStart.textContent = '▶ Démarrer';
                btnStart.style.background = '#4a90e2';
                dbValue.textContent  = '--';
                labelEl.textContent  = 'Microphone inactif';
                labelEl.style.background = 'rgba(255,255,255,0.07)';
                labelEl.style.color  = 'rgba(255,255,255,0.5)';
                alertEl.style.display = 'none';
                updateGauge(20);
                barsEl.forEach(b => { b.style.height = '2px'; b.style.background = 'rgba(255,255,255,0.2)'; });
                barHistory.fill(0);
                smoothDb = 0;
            }

            // ── Bouton toggle contrôles ───────────────────────────────────
            var toggleBtn  = widget.querySelector('.sono-toggle-controls');
            var controlsEl = widget.querySelector('.sono-controls');
            var controlsVisible = true;
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                controlsVisible = !controlsVisible;
                controlsEl.classList.toggle('hidden', !controlsVisible);
                toggleBtn.textContent = controlsVisible ? '⚙️' : '⚙️';
                toggleBtn.style.color = controlsVisible ? 'rgba(255,255,255,0.5)' : '#4a90e2';
            });

            // Bloquer stopPropagation uniquement sur les elements interactifs
            // Le reste du widget reste draggable normalement
            var interactiveSelectors = 'button, input, .sono-resize-handle, .sono-toggle-controls';
            outer.addEventListener('mousedown', function(e) {
                if (e.target.closest(interactiveSelectors)) {
                    e.stopPropagation();
                }
            });
            outer.addEventListener('touchstart', function(e) {
                if (e.target.closest(interactiveSelectors)) {
                    e.stopPropagation();
                }
            }, { passive: true });

            // Bouton start / stop
            btnStart.addEventListener('click', function () {
                if (!running) startMic();
                else stopMic();
            });

            // Bouton reset
            btnReset.addEventListener('click', function () {
                maxDb = 0;
                smoothDb = 0;
                if (!running) {
                    dbValue.textContent = '--';
                    updateGauge(20);
                }
            });

            // ── Nettoyage à la suppression du widget ──────────────────────
            const obs = new MutationObserver(function () {
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
            if (type === 'sonometre') initSonometreWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'sonometre') initSonometreWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
