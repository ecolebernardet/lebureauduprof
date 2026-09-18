// =========================================================================
// WIDGET DÉ — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'de'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-de.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils > Outils divers) :
//      <div class="mm-sub-item" onclick="createWidget('de');closeMainMenu()">
//          <span class="mm-ico">🎲</span>&nbsp;&nbsp;Lancer un dé
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

    // ── CSS boutons fenêtre (injecté une seule fois) ───────────────────────
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

    // ── CSS spécifique du widget dé ────────────────────────────────────────
    if (!document.getElementById('widget-de-style')) {
        const s = document.createElement('style');
        s.id = 'widget-de-style';
        s.textContent = `
        .widget[data-type="de"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .de-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 300px;
            min-width: 240px;
            min-height: 340px;
        }
        .de-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding: 0 !important;
            align-items: center;
            justify-content: center;
        }
        .de-container.wf-fullboard .de-header {
            position: absolute;
            top: 12px;
            left: 0;
            right: 0;
            padding: 0 16px;
            cursor: default;
        }
        .de-container.wf-fullboard .de-title {
            display: block;
        }
        .de-header {
            display: flex; align-items: center; gap: 8px;
            cursor: move; user-select: none; flex-shrink: 0;
        }
        .de-title {
            font-size: 13px; font-weight: 800; color: #374151;
            letter-spacing: 0.3px; pointer-events: none; white-space: nowrap;
        }
        .de-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0; transition: background .15s;
        }
        .de-help-btn:hover { background: #e0e0e0; color: #333; }
        .de-help-popup {
            display: none; position: absolute; top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd; border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15); padding: 12px 14px; width: 240px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .de-help-popup.show { display: block; }
        .de-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .de-help-popup p  { margin: 0 0 6px; }
        .de-faces-row {
            display: flex; align-items: center; gap: 8px; flex-shrink: 0;
            background: #f8f9ff; border: 1px solid #e0e3ff;
            border-radius: 10px; padding: 7px 10px;
        }
        .de-faces-label {
            font-size: 11px; font-weight: 700; color: #374151; white-space: nowrap;
        }
        .de-faces-slider { flex: 1; accent-color: #6366f1; cursor: pointer; min-width: 0; }
        .de-faces-value {
            font-size: 14px; font-weight: 900; color: #6366f1;
            min-width: 30px; text-align: right;
            background: #eef2ff; border-radius: 6px; padding: 2px 6px;
        }
        .de-dice-zone {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 6px; min-height: 150px;
            width: 100%;
        }
        .de-dice-svg {
            cursor: pointer;
            filter: drop-shadow(0 4px 14px rgba(99,102,241,0.30));
            transition: filter .2s;
            width: 80%;
            min-width: 90px;
            height: auto;
            display: block;
        }
        .de-container.wf-fullboard .de-dice-zone {
            flex: 1;
        }
        .de-container.wf-fullboard .de-dice-svg {
            width: min(55vw, 55vh);
            max-width: none;
        }
        .de-dice-svg:hover {
            filter: drop-shadow(0 6px 20px rgba(99,102,241,0.50));
        }
        .de-dice-svg.rolling {
            animation: de-roll 0.55s cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes de-roll {
            0%   { transform: rotate(0deg)   scale(1); }
            15%  { transform: rotate(-18deg) scale(0.88); }
            35%  { transform: rotate(14deg)  scale(1.10); }
            55%  { transform: rotate(-9deg)  scale(0.95); }
            75%  { transform: rotate(5deg)   scale(1.03); }
            100% { transform: rotate(0deg)   scale(1); }
        }
        .de-dice-main-txt.flash {
            animation: de-flash 0.15s ease-out;
        }
        @keyframes de-flash {
            0%   { opacity: 0.15; }
            100% { opacity: 1; }
        }
        .de-result-hint {
            font-size: 11px; color: #9ca3af; text-align: center;
            font-style: italic; min-height: 16px;
        }
        .de-history-row { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .de-history-label {
            font-size: 10px; font-weight: 700; color: #9ca3af;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .de-history {
            display: flex; flex-wrap: wrap; gap: 4px;
            max-height: 56px; overflow-y: auto;
        }
        .de-history:empty::after {
            content: '—'; font-size: 11px; color: #d1d5db; font-style: italic;
        }
        .de-history-item {
            padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
            background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb;
        }
        .de-history-item:first-child {
            background: #eef2ff; color: #6366f1; border-color: #c7d2fe;
        }
        .de-controls { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
        .de-btn {
            padding: 8px 14px; border-radius: 10px; border: none;
            font-size: 12px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .de-btn:active { transform: scale(0.95); }
        .de-btn-roll  { background: #6366f1; color: white; flex: 1; font-size: 13px; }
        .de-btn-roll:hover  { background: #4f46e5; }
        .de-btn-clear {
            background: #f3f4f6; color: #6b7280;
            border: 1px solid #e5e7eb; font-size: 14px; padding: 8px 10px;
        }
        .de-btn-clear:hover { background: #e5e7eb; color: #374151; }
        .de-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
            cursor: se-resize; background: linear-gradient(135deg, transparent 50%, #bbb 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .de-container:hover .de-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-de';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="de-container">

  <!-- En-tête -->
  <div class="de-header">
    <span class="de-title">🎲 Lancer un dé</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="de-help-btn" title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Sélecteur de faces -->
  <div class="de-faces-row">
    <span class="de-faces-label">Faces :</span>
    <input type="range" class="de-faces-slider" min="2" max="30" value="6" step="1" />
    <span class="de-faces-value">6</span>
  </div>

  <!-- Zone principale du dé -->
  <div class="de-dice-zone">
    <svg class="de-dice-svg" viewBox="0 0 160 170"
         xmlns="http://www.w3.org/2000/svg" role="button" aria-label="Lancer le dé">
      <defs>
        <!-- Face frontale -->
        <linearGradient id="de-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
        <!-- Face du dessus -->
        <linearGradient id="de-top" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#a5b4fc"/>
          <stop offset="100%" stop-color="#c7d2fe"/>
        </linearGradient>
        <!-- Face droite -->
        <linearGradient id="de-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#4338ca"/>
          <stop offset="100%" stop-color="#3730a3"/>
        </linearGradient>
        <!-- Ombre portée -->
        <filter id="de-shadow" x="-15%" y="-10%" width="145%" height="150%">
          <feDropShadow dx="2" dy="8" stdDeviation="7" flood-color="#1e1b4b" flood-opacity="0.40"/>
        </filter>
      </defs>

      <g filter="url(#de-shadow)">
        <!-- Face frontale (grande, carrée, angles droits) -->
        <polygon points="10,35  120,35  120,145  10,145" fill="url(#de-front)"/>
        <!-- Face du dessus -->
        <polygon points="10,35  40,10  150,10  120,35" fill="url(#de-top)"/>
        <!-- Face droite -->
        <polygon points="120,35  150,10  150,120  120,145" fill="url(#de-right)"/>
        <!-- Arêtes -->
        <polygon points="10,35  120,35  120,145  10,145"
              fill="none" stroke="#3730a3" stroke-width="1.5" stroke-linejoin="round"/>
        <polygon points="10,35  40,10  150,10  120,35"
              fill="none" stroke="#3730a3" stroke-width="1.5" stroke-linejoin="round"/>
        <polygon points="120,35  150,10  150,120  120,145"
              fill="none" stroke="#3730a3" stroke-width="1.5" stroke-linejoin="round"/>
      </g>

      <!-- Résultat centré sur la face frontale -->
      <text class="de-dice-main-txt" x="65" y="92" text-anchor="middle"
            dominant-baseline="central"
            font-family="'Segoe UI',system-ui,sans-serif" font-size="64" font-weight="900"
            fill="white">—</text>
    </svg>
    <div class="de-result-hint">Clique sur le dé ou sur « Lancer »</div>
  </div>

  <!-- Historique -->
  <div class="de-history-row">
    <div class="de-history-label">Historique</div>
    <div class="de-history"></div>
  </div>

  <!-- Contrôles -->
  <div class="de-controls">
    <button class="de-btn de-btn-roll">🎲 Lancer</button>
    <button class="de-btn de-btn-clear" title="Effacer l'historique">🗑</button>
  </div>

  <!-- Popup aide -->
  <div class="de-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p><b>Nombre de faces</b> — Utilise le curseur pour choisir entre 2 et 30 faces (d2, d6, d20…).</p>
    <p><b>Lancer</b> — Clique sur <b>🎲 Lancer</b> ou directement sur le dé pour obtenir un résultat aléatoire.</p>
    <p><b>Historique</b> — Les 20 derniers lancers s'affichent. Le plus récent est en violet.</p>
    <p><b>🗑</b> — Efface l'historique des lancers.</p>
  </div>

  <!-- Poignée resize -->
  <div class="de-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initDeWidget = function (widget) {

        const container    = widget.querySelector('.de-container');
        const helpBtn      = widget.querySelector('.de-help-btn');
        const helpPopup    = widget.querySelector('.de-help-popup');
        const facesSlider  = widget.querySelector('.de-faces-slider');
        const facesValue   = widget.querySelector('.de-faces-value');
        const diceSvg      = widget.querySelector('.de-dice-svg');
        const diceMainTxt  = widget.querySelector('.de-dice-main-txt');
        const resultHint   = widget.querySelector('.de-result-hint');
        const historyEl    = widget.querySelector('.de-history');
        const rollBtn      = widget.querySelector('.de-btn-roll');
        const clearBtn     = widget.querySelector('.de-btn-clear');
        const resizeHandle = widget.querySelector('.de-resize-handle');

        // ── Restaurer l'état persisté dans les dataset ───────────────────
        let nbFaces = 6;
        let history = [];

        if (widget.dataset.deFaces) {
            nbFaces = parseInt(widget.dataset.deFaces, 10) || 6;
        }
        if (widget.dataset.deHistory) {
            try { history = JSON.parse(widget.dataset.deHistory); } catch(e) { history = []; }
        }

        facesSlider.value = nbFaces;
        facesValue.textContent = nbFaces;

        // ── Helper tap stylet (pointer-safe, < 12px) ─────────────────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (Math.sqrt(dx*dx + dy*dy) < 12) {
                        eu.stopPropagation();
                        handler(eu);
                    }
                }
                el.addEventListener('pointerup',     onUp);
                el.addEventListener('pointercancel', onUp);
            });
        }

        // ── Curseur de faces ──────────────────────────────────────────────
        facesSlider.addEventListener('pointerdown', (e) => e.stopPropagation());
        facesSlider.addEventListener('input', () => {
            nbFaces = parseInt(facesSlider.value, 10);
            facesValue.textContent = nbFaces;
            widget.dataset.deFaces = nbFaces;
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Nettoyage automatique de la classe rolling à la fin de l'anim ──
        diceSvg.addEventListener('animationend', () => {
            diceSvg.classList.remove('rolling');
        });

        // ── Lancer le dé ─────────────────────────────────────────────────
        let _rolling = false;

        function roll() {
            if (_rolling) return;
            _rolling = true;

            const result = Math.floor(Math.random() * nbFaces) + 1;

            // Animation rotation du dé
            diceSvg.classList.remove('rolling');
            requestAnimationFrame(() => requestAnimationFrame(() => diceSvg.classList.add('rolling')));

            resultHint.textContent = '…';

            // Séquence de délais croissants : rapide → lent → résultat
            // 12 chiffres intermédiaires, intervalles de 60ms→80→110→150→200→résultat
            const delays = [60, 60, 80, 80, 100, 100, 130, 130, 160, 180, 200, 220, 300];
            let elapsed = 0;

            delays.forEach((delay, i) => {
                elapsed += delay;
                const isFinal = (i === delays.length - 1);
                // Taille progressive : de 20px (premier) à 42px (avant-dernier), puis saut à 64px pour le résultat
                const fontSize = isFinal ? 64 : Math.round(20 + (i / (delays.length - 2)) * 22);
                setTimeout(() => {
                    if (isFinal) {
                        diceMainTxt.classList.remove('flash');
                        void diceMainTxt.getBoundingClientRect();
                        diceMainTxt.setAttribute('font-size', 64);
                        diceMainTxt.textContent = result;
                        diceMainTxt.classList.add('flash');
                        resultHint.textContent  = `Résultat : ${result}  (sur ${nbFaces})`;
                        _rolling = false;
                        history.unshift(result);
                        if (history.length > 20) history = history.slice(0, 20);
                        widget.dataset.deHistory = JSON.stringify(history);
                        renderHistory();
                        if (typeof saveBoard === 'function') saveBoard();
                    } else {
                        let rnd;
                        do { rnd = Math.floor(Math.random() * nbFaces) + 1; }
                        while (String(rnd) === diceMainTxt.textContent && nbFaces > 1);
                        diceMainTxt.classList.remove('flash');
                        void diceMainTxt.getBoundingClientRect();
                        diceMainTxt.setAttribute('font-size', fontSize);
                        diceMainTxt.textContent = rnd;
                        diceMainTxt.classList.add('flash');
                    }
                }, elapsed);
            });
        }

        // ── Rendu de l'historique ─────────────────────────────────────────
        function renderHistory() {
            historyEl.innerHTML = '';
            history.forEach((val, i) => {
                const item = document.createElement('span');
                item.className = 'de-history-item';
                item.textContent = val;
                if (i === 0) item.title = 'Dernier lancer';
                historyEl.appendChild(item);
            });
        }

        // Afficher l'historique restauré + dernier résultat
        renderHistory();
        if (history.length > 0) {
            const last = history[0];
            diceMainTxt.textContent = last;
            resultHint.textContent  = `Dernier résultat : ${last}  (sur ${nbFaces})`;
        }

        // ── Boutons principaux ────────────────────────────────────────────
        makeTap(rollBtn,  roll);
        makeTap(diceSvg,  roll);

        makeTap(clearBtn, () => {
            history = [];
            widget.dataset.deHistory = '[]';
            renderHistory();
            diceMainTxt.textContent = '—';
            resultHint.textContent = 'Clique sur le dé ou sur « Lancer »';
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn)
                helpPopup.classList.remove('show');
        }, { passive: true });

        // ── Boutons fenêtre (réduire / plein écran / fermer) ──────────────
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
                window._wfMiniBarCollapse(widget, '🎲 Lancer un dé', {});
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

        // ── Redimensionnement libre (poignée coin bas-droit) ──────────────
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
                container.style.width  = Math.max(240, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(340, startH + ev.clientY - startY) + 'px';
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup',   onEnd);
                saveDimsToDataset();
                if (typeof saveBoard === 'function') saveBoard();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup',   onEnd);
        });

        // ── Restauration des dimensions sauvegardées ──────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
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
            if (type === 'de') initDeWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'de') initDeWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
