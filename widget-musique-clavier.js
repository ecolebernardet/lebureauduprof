// =========================================================================
// WIDGET CLAVIER DE PIANO — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'musique-clavier'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-musique-clavier.js"></script>
//
//   2. Ajouter dans le panneau Activités (rubrique Arts & Sciences) :
//      <div class="act-card" onclick="createWidget('musique-clavier');toggleActivitiesPanel()">
//          <div class="act-card-ico">🎹</div>
//          <div class="act-card-name">Clavier de piano</div>
//          <div class="act-card-desc">Jouer les notes sur 3 octaves</div>
//      </div>
// =========================================================================

(function () {

    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w => w !== widget && w.querySelector('.wf-mini-bar'));
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');
            const miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('pointerup', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // ── CSS boutons fenêtre (injecté une seule fois) ──────────────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    // ── CSS du widget ──────────────────────────────────────────────────────
    if (!document.getElementById('widget-musique-clavier-style')) {
        const s = document.createElement('style');
        s.id = 'widget-musique-clavier-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="musique-clavier"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .mk-container {
            background: #1a1a2e;
            border: 1.5px solid #3a3a5c;
            border-radius: 16px;
            padding: 14px 16px 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 24px rgba(0,0,0,0.35);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 860px;
            min-width: 480px;
            min-height: 260px;
        }

        /* ── Plein écran ── */
        .mk-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
        }

        /* ── En-tête ── */
        .mk-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .mk-title {
            font-size: 13px;
            font-weight: 800;
            color: #e0e0f0;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Bouton aide ── */
        .mk-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #555; background: #2a2a4e;
            color: #aaa; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .mk-help-btn:hover { background: #3a3a6e; color: #fff; }

        /* ── Popup aide ── */
        .mk-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            padding: 12px 14px; width: 300px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .mk-help-popup.show { display: block; }
        .mk-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .mk-help-popup p  { margin: 0 0 6px; }

        /* ── Indicateur de note jouée ── */
        .mk-note-display {
            text-align: center;
            flex-shrink: 0;
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .mk-note-name {
            font-size: 32px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 1px;
            text-shadow: 0 0 18px rgba(255,220,80,0.7);
            transition: transform .08s, color .15s;
            min-width: 60px;
            text-align: center;
        }
        .mk-note-name.ping {
            transform: scale(1.18);
            color: #ffd740;
        }
        .mk-note-octave {
            font-size: 14px;
            color: #888;
            font-weight: 600;
        }
        .mk-note-solfege {
            font-size: 13px;
            font-weight: 600;
            color: #888;
            min-width: 40px;
            text-align: left;
        }

        /* ── Zone clavier ── */
        .mk-keyboard-wrap {
            flex: 1;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            overflow: hidden;
            position: relative;
            min-height: 130px;
            touch-action: none;
        }
        .mk-keyboard {
            display: flex;
            position: relative;
            height: 100%;
            width: 100%;
            align-items: flex-end;
            touch-action: none;
        }

        /* ── Touche blanche ── */
        .mk-white-key {
            position: relative;
            flex: 1;
            height: 100%;
            min-height: 130px;
            background: linear-gradient(to bottom, #f8f8f8 0%, #ffffff 60%, #e8e8e8 100%);
            border: 1px solid #bbb;
            border-top: none;
            border-radius: 0 0 6px 6px;
            cursor: pointer;
            box-sizing: border-box;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 6px;
            transition: background .07s;
            z-index: 1;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 -1px 0 #ccc;
            touch-action: none;
        }
        .mk-white-key:hover {
            background: linear-gradient(to bottom, #fffde0 0%, #fffff0 60%, #f0f0d8 100%);
        }
        .mk-white-key.active {
            background: linear-gradient(to bottom, #ffd740 0%, #ffecaa 60%, #e8d480 100%) !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1) !important;
            transform: translateY(2px);
        }
        .mk-white-key .mk-key-label {
            font-size: 9px;
            font-weight: 700;
            color: #999;
            pointer-events: none;
            line-height: 1;
        }
        .mk-white-key.active .mk-key-label { color: #8b6a00; }

        /* ── C marqué (début d'octave) ── */
        .mk-white-key.mk-c-key .mk-key-label {
            color: #555;
            font-size: 10px;
        }

        /* ── Touche noire ── */
        .mk-black-key {
            position: absolute;
            width: 58%;
            height: 62%;
            background: linear-gradient(to bottom, #333 0%, #111 70%, #222 100%);
            border-radius: 0 0 5px 5px;
            cursor: pointer;
            z-index: 2;
            box-shadow: 2px 4px 8px rgba(0,0,0,0.6), inset 0 -2px 0 rgba(255,255,255,0.08);
            transition: background .07s;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 4px;
            touch-action: none;
        }
        .mk-black-key:hover {
            background: linear-gradient(to bottom, #555 0%, #222 70%, #333 100%);
        }
        .mk-black-key.active {
            background: linear-gradient(to bottom, #b8860b 0%, #ffd700 60%, #b8860b 100%) !important;
            box-shadow: 1px 2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(0,0,0,0.2) !important;
            transform: translateY(2px);
        }
        .mk-black-key .mk-key-label {
            font-size: 8px;
            font-weight: 700;
            color: rgba(255,255,255,0.3);
            pointer-events: none;
            line-height: 1;
        }
        .mk-black-key.active .mk-key-label { color: rgba(0,0,0,0.5); }

        /* ── Contrôles ── */
        .mk-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
            flex-wrap: wrap;
        }
        .mk-label {
            font-size: 11px;
            color: #888;
            font-weight: 600;
            white-space: nowrap;
        }

        .mk-volume-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .mk-volume-wrap input[type=range] {
            -webkit-appearance: none;
            width: 80px; height: 4px;
            background: #3a3a6e; border-radius: 2px; outline: none;
            cursor: pointer;
        }
        .mk-volume-wrap input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px; height: 14px;
            border-radius: 50%;
            background: #7a7ace;
            cursor: pointer;
        }

        /* ── Poignée resize ── */
        .mk-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #555 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .mk-container:hover .mk-resize-handle { opacity: 1; }

        /* ── Séparateur d'octave ── */
        .mk-octave-sep {
            position: absolute;
            bottom: 0; top: 0;
            width: 2px;
            background: rgba(255,200,0,0.18);
            z-index: 3;
            pointer-events: none;
        }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-musique-clavier';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="mk-container">

  <!-- En-tête -->
  <div class="mk-header">
    <span class="mk-title">🎹 Clavier de piano</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="mk-help-btn" title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Indicateur de note -->
  <div class="mk-note-display">
    <span class="mk-note-name">—</span>
    <span class="mk-note-solfege"></span>
    <span class="mk-note-octave"></span>
  </div>

  <!-- Clavier -->
  <div class="mk-keyboard-wrap">
    <div class="mk-keyboard"></div>
  </div>

  <!-- Contrôles -->
  <div class="mk-controls">
    <div class="mk-volume-wrap">
      <span class="mk-label">🔊</span>
      <input type="range" class="mk-volume" min="0" max="100" value="70">
    </div>
  </div>

  <!-- Popup aide -->
  <div class="mk-help-popup">
    <h4>💡 Comment utiliser ce clavier ?</h4>
    <p><b>🖱️ Clic / toucher</b> — Cliquez sur une touche pour entendre la note correspondante.</p>
    <p><b>Nom des notes</b> — Le nom anglais (C, D, E…) et le nom solfège (Do, Ré, Mi…) s'affichent en haut.</p>
    <p><b>3 octaves</b> — Le clavier couvre les octaves 3, 4 et 5. Le Do central (C4) est marqué « C4 ».</p>
    <p><b>Volume</b> — Réglez le volume avec le curseur.</p>
    <p style="margin:0;font-style:italic;color:#888">Redimensionnez le widget en tirant le coin inférieur droit.</p>
  </div>

  <!-- Poignée resize -->
  <div class="mk-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // DÉFINITIONS DES NOTES (3 octaves : C3 à B5)
    // =========================================================================

    // Notes blanches par octave : C D E F G A B
    const WHITE_NOTES = ['C','D','E','F','G','A','B'];
    // Notes noires (dièses) et leur position relative parmi les blanches (0-indexed)
    // C#=0, D#=1, F#=3, G#=4, A#=5  (pas de E#, B#)
    const BLACK_POSITIONS = [0, 1, 3, 4, 5]; // indices dans WHITE_NOTES
    const BLACK_NAMES     = ['C#','D#','F#','G#','A#'];

    const SOLFEGE = { C:'Do', D:'Ré', E:'Mi', F:'Fa', G:'Sol', A:'La', B:'Si',
                      'C#':'Do#', 'D#':'Ré#', 'F#':'Fa#', 'G#':'Sol#', 'A#':'La#' };

    // Fréquence de A4 = 440 Hz, calcul par demi-tons depuis C0
    function noteFrequency(noteName, octave) {
        const semitones = { C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11 };
        const semi = semitones[noteName];
        if (semi === undefined) return 440;
        // C0 = MIDI 12 : fréquence = 440 * 2^((midi - 69)/12)
        const midi = (octave + 1) * 12 + semi;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initMusiqueClavier = function (widget) {

        const container    = widget.querySelector('.mk-container');
        const keyboardEl   = widget.querySelector('.mk-keyboard');
        const noteNameEl   = widget.querySelector('.mk-note-name');
        const noteSolEl    = widget.querySelector('.mk-note-solfege');
        const noteOctEl    = widget.querySelector('.mk-note-octave');
        const helpBtn      = widget.querySelector('.mk-help-btn');
        const helpPopup    = widget.querySelector('.mk-help-popup');
        const resizeHandle = widget.querySelector('.mk-resize-handle');
        const volumeSlider = widget.querySelector('.mk-volume');

        // ── État ──────────────────────────────────────────────────────────
        let currentVolume = 0.7;
        let audioCtx     = null;
        let activeNodes  = {}; // noteId → { osc, gain }
        let pingTimeout  = null;

        // AudioContext (créé à la première interaction pour respecter les politiques navigateur)
        function getAudioCtx() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        }

        // ── Jouer une note ────────────────────────────────────────────────
        function playNote(noteName, octave, keyEl) {
            const ctx  = getAudioCtx();
            const freq = noteFrequency(noteName, octave);
            const noteId = noteName + octave;

            // Couper immédiatement le son précédent de cette touche
            stopNote(noteId);

            const gainNode = ctx.createGain();
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            const t0 = ctx.currentTime;
            // Attaque
            gainNode.gain.setValueAtTime(0, t0);
            gainNode.gain.linearRampToValueAtTime(currentVolume, t0 + 0.008);
            // Decay → sustain bas
            gainNode.gain.exponentialRampToValueAtTime(currentVolume * 0.25, t0 + 0.35);
            // Release progressif jusqu'au silence
            gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start(t0);
            // Arrêt propre programmé via Web Audio (évite tout artefact/écho)
            osc.stop(t0 + 1.65);

            activeNodes[noteId] = { osc, gain: gainNode };
            // Nettoyer la référence quand l'oscillateur est vraiment terminé
            osc.onended = () => { delete activeNodes[noteId]; };

            // ── Affichage ──
            noteNameEl.textContent = SOLFEGE[noteName] || noteName;
            noteSolEl.textContent  = noteName;
            noteOctEl.textContent  = 'Octave ' + octave;

            // Ping visuel
            clearTimeout(pingTimeout);
            noteNameEl.classList.add('ping');
            pingTimeout = setTimeout(() => noteNameEl.classList.remove('ping'), 200);

            // Surbrillance de la touche (limitée à 500 ms max)
            if (keyEl) {
                keyEl.classList.add('active');
                setTimeout(() => keyEl.classList.remove('active'), 500);
            }
        }

        function stopNote(noteId) {
            const node = activeNodes[noteId];
            if (node) {
                try {
                    const ctx = getAudioCtx();
                    const t = ctx.currentTime;
                    node.gain.gain.cancelScheduledValues(t);
                    node.gain.gain.setValueAtTime(node.gain.gain.value || 0.0001, t);
                    node.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
                    node.osc.stop(t + 0.05);
                } catch(e) {}
                delete activeNodes[noteId];
            }
        }

        // ── Construction du clavier ───────────────────────────────────────
        const OCTAVES = [3, 4, 5];
        // 3 octaves × 7 blanches + C6 final = 22 touches blanches
        const TOTAL_WHITE = OCTAVES.length * WHITE_NOTES.length + 1;

        function buildKeyboard() {
            keyboardEl.innerHTML = '';

            // touch-action:none indispensable pour multi-touch et glissement
            const wrap = document.createElement('div');
            wrap.style.cssText = 'position:relative;display:flex;width:100%;height:100%;touch-action:none;';

            // ── Touches blanches ──────────────────────────────────────────────
            OCTAVES.forEach(oct => {
                WHITE_NOTES.forEach((note) => {
                    const key = document.createElement('div');
                    key.className = 'mk-white-key' + (note === 'C' ? ' mk-c-key' : '');
                    key.dataset.note   = note;
                    key.dataset.octave = oct;
                    const lbl = document.createElement('span');
                    lbl.className = 'mk-key-label';
                    lbl.textContent = (note === 'C') ? SOLFEGE[note] + oct : SOLFEGE[note];
                    key.appendChild(lbl);
                    wrap.appendChild(key);
                });
            });
            // ── C6 final (touche blanche seule, sans noires associées) ──────
            {
                const key = document.createElement('div');
                key.className = 'mk-white-key mk-c-key';
                key.dataset.note   = 'C';
                key.dataset.octave = 6;
                const lbl = document.createElement('span');
                lbl.className = 'mk-key-label';
                lbl.textContent = 'Do6';
                key.appendChild(lbl);
                wrap.appendChild(key);
            }

            // ── Touches noires (positionnées après layout) ───────────────────────
            requestAnimationFrame(() => {
                const totalW = wrap.offsetWidth || container.offsetWidth - 32;
                const whiteW = totalW / TOTAL_WHITE;

                OCTAVES.forEach((oct, oi) => {
                    BLACK_POSITIONS.forEach((wPos, bi) => {
                        const globalIdx = oi * WHITE_NOTES.length + wPos;
                        const leftPx    = (globalIdx + 0.7) * whiteW;
                        const key = document.createElement('div');
                        key.className      = 'mk-black-key';
                        key.dataset.note   = BLACK_NAMES[bi];
                        key.dataset.octave = oct;
                        const bW = whiteW * 0.60;
                        key.style.width  = bW + 'px';
                        key.style.left   = (leftPx - bW * 0.08) + 'px';
                        key.style.top    = '0';
                        key.style.height = (wrap.offsetHeight * 0.62 || 80) + 'px';
                        const lbl = document.createElement('span');
                        lbl.className = 'mk-key-label';
                        lbl.textContent = SOLFEGE[BLACK_NAMES[bi]] || BLACK_NAMES[bi];
                        key.appendChild(lbl);
                        wrap.appendChild(key);
                    });

                    if (oi > 0) {
                        const sep = document.createElement('div');
                        sep.className = 'mk-octave-sep';
                        sep.style.left = (oi * WHITE_NOTES.length * whiteW) + 'px';
                        wrap.appendChild(sep);
                    }
                });
                // Séparateur avant C6
                {
                    const sep = document.createElement('div');
                    sep.className = 'mk-octave-sep';
                    sep.style.left = (OCTAVES.length * WHITE_NOTES.length * whiteW) + 'px';
                    wrap.appendChild(sep);
                }

                // ── Gestion centralisée des événements pointer ────────────────────────
                // Toute la logique est au niveau du wrap pour supporter :
                //   • clic simple
                //   • glissement (slide) sur les touches
                //   • multi-touch simultané
                // On utilise elementFromPoint pour identifier la touche sous le doigt,
                // ce qui contourne la capture implicite du pointer par l''élément d'origine.

                // activePointers : pointerId → noteId joué en dernier par ce doigt
                const activePointers = {};

                function keyFromPoint(x, y) {
                    const el = document.elementFromPoint(x, y);
                    if (!el) return null;
                    const key = el.closest('.mk-black-key, .mk-white-key');
                    if (!key || !wrap.contains(key)) return null;
                    return key;
                }

                function handlePointerOnKey(pointerId, x, y) {
                    const key = keyFromPoint(x, y);
                    if (!key) return;
                    const note   = key.dataset.note;
                    const octave = parseInt(key.dataset.octave);
                    const noteId = note + octave;
                    // Ne rejouer que si on change de touche
                    if (activePointers[pointerId] === noteId) return;
                    activePointers[pointerId] = noteId;
                    playNote(note, octave, key);
                }

                wrap.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    wrap.setPointerCapture(e.pointerId);
                    handlePointerOnKey(e.pointerId, e.clientX, e.clientY);
                });

                wrap.addEventListener('pointermove', (e) => {
                    if (!wrap.hasPointerCapture(e.pointerId)) return;
                    e.preventDefault();
                    handlePointerOnKey(e.pointerId, e.clientX, e.clientY);
                });

                wrap.addEventListener('pointerup', (e) => {
                    delete activePointers[e.pointerId];
                });

                wrap.addEventListener('pointercancel', (e) => {
                    delete activePointers[e.pointerId];
                });
            });

            keyboardEl.appendChild(wrap);
        }

        // ── Helper tap stylet ─────────────────────────────────────────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (Math.sqrt(dx*dx+dy*dy) < 12) { eu.stopPropagation(); handler(eu); }
                }
                el.addEventListener('pointerup',     onUp);
                el.addEventListener('pointercancel', onUp);
            });
        }

        // ── Aide ──────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
        });

        // ── Volume ────────────────────────────────────────────────────────
        volumeSlider.addEventListener('pointerdown', (e) => e.stopPropagation());
        volumeSlider.addEventListener('input', () => {
            currentVolume = volumeSlider.value / 100;
        });

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null, _isMax = false;

        if (wfMin) {
            makeTap(wfMin, () => {
                if (_isMax) {
                    _isMax = false;
                    container.classList.remove('wf-fullboard');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                window._wfMiniBarCollapse(widget, '🎹 Clavier de piano', {
                    onExpand: () => rebuildBlackKeys()
                });
            });
        }
        if (wfMax) {
            makeTap(wfMax, () => {
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    _savedH = container.style.height;
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                setTimeout(() => rebuildBlackKeys(), 50);
                saveDimsToDataset();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Recalcul des touches noires (après resize) ────────────────────
        function rebuildBlackKeys() {
            // Supprimer les touches noires existantes et les séparateurs
            const wrap = keyboardEl.querySelector('div');
            if (!wrap) return;
            wrap.querySelectorAll('.mk-black-key, .mk-octave-sep').forEach(el => el.remove());

            const totalW = wrap.offsetWidth || container.offsetWidth - 32;
            const whiteW = totalW / TOTAL_WHITE;

            OCTAVES.forEach((oct, oi) => {
                BLACK_POSITIONS.forEach((wPos, bi) => {
                    const globalIdx = oi * WHITE_NOTES.length + wPos;
                    const leftPx    = (globalIdx + 0.7) * whiteW;

                    const key = document.createElement('div');
                    key.className   = 'mk-black-key';
                    key.dataset.note   = BLACK_NAMES[bi];
                    key.dataset.octave = oct;
                    const bW2 = whiteW * 0.60;
                    key.style.width  = bW2 + 'px';
                    key.style.left   = (leftPx - bW2 * 0.08) + 'px';
                    key.style.top    = '0';
                    key.style.height = (wrap.offsetHeight * 0.62 || 80) + 'px';

                    const lbl = document.createElement('span');
                    lbl.className = 'mk-key-label';
                    lbl.textContent = SOLFEGE[BLACK_NAMES[bi]] || BLACK_NAMES[bi];
                    key.appendChild(lbl);
                    wrap.appendChild(key);
                });

                if (oi > 0) {
                    const sep = document.createElement('div');
                    sep.className = 'mk-octave-sep';
                    sep.style.left = (oi * WHITE_NOTES.length * whiteW) + 'px';
                    wrap.appendChild(sep);
                }
            });
            // Séparateur avant C6
            {
                const sep = document.createElement('div');
                sep.className = 'mk-octave-sep';
                sep.style.left = (OCTAVES.length * WHITE_NOTES.length * whiteW) + 'px';
                wrap.appendChild(sep);
            }
        }

        // ── Resize 2D ────────────────────────────────────────────────────
        function saveDimsToDataset() {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
            widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
        }

        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            function onMove(ev) {
                container.style.width  = Math.max(480, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(260, startH + ev.clientY - startY) + 'px';
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup',   onEnd);
                saveDimsToDataset();
                rebuildBlackKeys();
                if (typeof saveBoard === 'function') saveBoard();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup',   onEnd);
        });

        // ── Empêcher le slider de déplacer le widget ──────────────────────
        volumeSlider.addEventListener('pointerdown', (e) => e.stopPropagation());

        // ── Init ──────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            // Restaurer les dimensions sauvegardées
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct  = parseFloat(widget.dataset.widthPercent);
            const hPct  = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';

            buildKeyboard();
            // Le widget s'ouvre à 100px du bord gauche du board.
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'musique-clavier') initMusiqueClavier(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'musique-clavier') initMusiqueClavier(widget);
                    return widget;
                };
            }
        });
    }

})();
