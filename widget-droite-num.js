// =========================================================================
// WIDGET DROITE NUMÉRIQUE — Le Bureau du Prof   (version 2)
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'droite-num'.
//
// Trois activités :
//   🎯 Placer  : les élèves font glisser des étiquettes-nombres sur la droite,
//               puis on vérifie (vert = bien placé, rouge = à corriger).
//   🔍 Lire    : des flèches A, B, C… montrent la droite ; on clique sur une flèche
//               pour montrer / cacher le nombre qui lui correspond.
//   ✏️ Libre   : on clique sur la droite pour poser des flèches,
//               avec affichage possible des « bonds » entre elles.
//
// Nombres acceptés partout : entiers (3, -2), décimaux (1,5 ou 1.5),
// fractions (3/4, -7/3) et nombres mixtes (1 1/2).
// Les calculs sont faits en fractions exactes : pas d'erreur d'arrondi.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-droite-num.js"></script>
//
//   2. Ajouter dans le panneau Activités (rubrique Mathématiques) :
//      <div class="act-card" onclick="createWidget('droite-num');toggleActivitiesPanel()">
//          ...
//      </div>
//
// Les sauvegardes faites avec l'ancienne version sont converties
// automatiquement à l'ouverture.
// =========================================================================

(function () {

    // ── Réutilise la mini-barre collapse partagée (définie dans widget-nature-gramm.js) ──
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

    // ── Boutons macOS (injectés une seule fois) ────────────────────────────
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
    if (!document.getElementById('widget-droite-num-style-v2')) {
        const s = document.createElement('style');
        s.id = 'widget-droite-num-style-v2';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="droite-num"],
        .widget[data-subtype="droite-num"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .dn-container {
            --dn-ink: #1f2937;
            --dn-muted: #6b7280;
            --dn-line: #d1d5db;
            --dn-blue: #2563eb;
            --dn-amber: #f59e0b;
            --dn-purple: #7c3aed;
            --dn-green: #16a34a;
            --dn-red: #dc2626;
            background: #ffffff;
            border: 1.5px solid var(--dn-line);
            border-radius: 16px;
            padding: 12px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: var(--dn-ink);
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 1000px;
            min-width: 520px;
            min-height: 300px;
        }
        .dn-container button { font-family: inherit; }

        /* ── Plein écran board ── */
        .dn-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── En-tête ── */
        .dn-header {
            display: flex; align-items: center; gap: 10px;
            cursor: move; user-select: none; flex-shrink: 0; flex-wrap: wrap;
        }
        .dn-title {
            font-size: 14px; font-weight: 800; color: #374151;
            pointer-events: none; white-space: nowrap;
        }
        .dn-spacer { flex: 1; }

        /* ── Boutons segmentés (mode, type de nombres) ── */
        .dn-seg {
            display: inline-flex; border-radius: 9px; overflow: hidden;
            border: 1px solid var(--dn-line); background: #f3f4f6; flex-shrink: 0;
        }
        .dn-seg button {
            padding: 6px 12px; font-size: 13px; font-weight: 600;
            cursor: pointer; border: none; background: transparent; color: #4b5563;
            transition: background .15s, color .15s;
        }
        .dn-seg button + button { border-left: 1px solid var(--dn-line); }
        .dn-seg button:hover { background: #e5e7eb; }
        .dn-seg button.active { background: var(--dn-blue); color: #fff; }

        /* ── Boutons de l'en-tête ── */
        .dn-head-btn {
            height: 30px; padding: 0 10px; border-radius: 8px;
            border: 1px solid #cbd5e1; background: #f8fafc; color: #374151;
            font-size: 13px; font-weight: 600; cursor: pointer;
            display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
        }
        .dn-head-btn:hover { background: #eef2f7; }
        .dn-head-btn.active { background: #1e293b; color: #fff; border-color: #1e293b; }
        .dn-head-btn.round { width: 30px; padding: 0; justify-content: center; border-radius: 50%; }

        /* ── Popup aide ── */
        .dn-help-popup {
            display: none; position: absolute;
            top: 52px; right: 12px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.16);
            padding: 14px 16px; width: 380px; max-width: calc(100% - 24px);
            font-size: 13px; color: #374151; z-index: 20; line-height: 1.5;
        }
        .dn-help-popup.show { display: block; }
        .dn-help-popup h4 { margin: 0 0 8px; font-size: 14px; }
        .dn-help-popup p { margin: 0 0 8px; }
        .dn-help-popup p:last-child { margin: 0; }

        /* ── Panneau réglages ── */
        .dn-params-panel {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
            font-size: 13px;
            max-height: 60%;
            overflow-y: auto;
        }
        .dn-params-panel.show { display: flex; }
        .dn-p-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .dn-p-row[hidden] { display: none; }
        .dn-p-lab { font-weight: 700; color: #334155; width: 92px; flex-shrink: 0; white-space: nowrap; }
        .dn-gap { width: 14px; }
        .dn-p-row input[type=text], .dn-p-row input[type=number] {
            width: 64px; padding: 5px 8px; border-radius: 7px;
            border: 1px solid #cbd5e1; font-size: 14px; font-family: inherit;
            outline: none; background: #fff; text-align: center;
        }
        .dn-p-row input.dn-wide { width: 240px; text-align: left; }
        .dn-p-row input:focus, .dn-p-row select:focus { border-color: var(--dn-blue); box-shadow: 0 0 0 2px rgba(37,99,235,.15); }
        .dn-p-row select {
            padding: 5px 8px; border-radius: 7px; border: 1px solid #cbd5e1;
            font-size: 13px; background: #fff; cursor: pointer; outline: none; font-family: inherit;
        }
        .dn-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .dn-chip {
            padding: 4px 10px; border-radius: 999px; border: 1px solid #cbd5e1;
            background: #fff; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer;
        }
        .dn-chip:hover { border-color: var(--dn-blue); color: var(--dn-blue); }
        .dn-small-btn {
            padding: 5px 10px; border-radius: 7px; border: 1px solid #cbd5e1;
            background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; color: #334155;
        }
        .dn-small-btn:hover { background: #eef2f7; }
        .dn-check { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; color: #334155; }
        .dn-notes { font-size: 12.5px; line-height: 1.5; color: #475569; }
        .dn-notes:empty { display: none; }
        .dn-notes .info { color: #1d4ed8; }
        .dn-notes .warn { color: #b45309; }

        /* ── Zone droite numérique ── */
        .dn-line-zone {
            flex: 1; overflow: hidden; position: relative; min-height: 150px;
            display: flex; flex-direction: column; justify-content: center;
        }
        .dn-svg-wrap { width: 100%; height: 100%; position: relative; min-height: 150px; }
        .dn-svg { width: 100%; height: 100%; overflow: visible; display: block; touch-action: none; }
        .dn-svg text { font-variant-numeric: tabular-nums; }

        /* ── Étiquettes à placer ── */
        .dn-tokens-zone {
            display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
            padding: 10px 12px;
            background: #fffbeb;
            border: 1.5px solid #fde68a;
            border-radius: 12px;
            min-height: 54px;
            flex-shrink: 0;
        }
        .dn-tokens-label { font-size: 13px; font-weight: 700; color: #92400e; width: 100%; margin-bottom: -2px; }
        .dn-tokens-empty { font-size: 13px; color: #92400e; }

        .dn-token {
            padding: 6px 14px;
            border-radius: 9px;
            font-size: 20px;
            font-weight: 700;
            cursor: grab;
            user-select: none;
            background: white;
            border: 2px solid #fcd34d;
            color: var(--dn-ink);
            box-shadow: 0 2px 5px rgba(0,0,0,0.10);
            white-space: nowrap;
            transition: opacity .2s, border-color .12s, box-shadow .12s;
            touch-action: none;
            display: inline-flex; align-items: center; min-height: 32px;
        }
        .dn-token:hover { border-color: var(--dn-amber); box-shadow: 0 3px 10px rgba(245,158,11,0.3); }
        .dn-token.placed { opacity: 0.3; cursor: default; pointer-events: none; border-style: dashed; }
        .dn-token.is-dragging { opacity: 0.15; }

        /* Fractions écrites « en étage » */
        .dn-f { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; font-size: 0.82em; margin: 0 1px; }
        .dn-f-bar { align-self: stretch; height: 2px; background: currentColor; margin: 1px 0; border-radius: 1px; }
        .dn-f-whole { margin-right: 3px; }
        .dn-f-sign { margin-right: 2px; }

        /* Fantôme pendant le glisser-déposer */
        .dn-drag-ghost {
            position: fixed; pointer-events: none; z-index: 99999;
            padding: 6px 14px; border-radius: 9px; font-weight: 700;
            background: var(--dn-amber); color: white; border: 2px solid #d97706;
            box-shadow: 0 8px 20px rgba(245,158,11,0.45);
            transform: translate(-50%, -120%) rotate(2deg);
            white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 20px; display: inline-flex; align-items: center;
        }

        /* ── Barre du bas ── */
        .dn-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0; }
        .dn-btn {
            padding: 8px 14px; border-radius: 9px; border: none;
            font-size: 14px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
            background: #e5e7eb; color: #1f2937;
        }
        .dn-btn:hover { background: #d1d5db; }
        .dn-btn:active { transform: scale(0.96); }
        .dn-btn.primary { background: var(--dn-blue); color: #fff; }
        .dn-btn.primary:hover { background: #1d4ed8; }
        .dn-btn.on { background: #1e293b; color: #fff; }
        .dn-hint { font-size: 13px; color: var(--dn-muted); }
        .dn-result-text { font-size: 17px; font-weight: 800; margin-left: 6px; }

        /* ── Poignée resize ── */
        .dn-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .dn-container:hover .dn-resize-handle { opacity: 1; }

        @keyframes dn-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-4px); }
            40%, 80% { transform: translateX(4px); }
        }
        .dn-wrong { animation: dn-shake 0.5s ease; }
        @media (prefers-reduced-motion: reduce) { .dn-wrong { animation: none; } }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // OUTILS : FRACTIONS EXACTES ET LECTURE DES NOMBRES
    // =========================================================================
    const NS = 'http://www.w3.org/2000/svg';
    const FONT = "'Segoe UI', system-ui, sans-serif";

    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
    function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
    function F(n, d) {
        if (d === undefined) d = 1;
        if (d < 0) { n = -n; d = -d; }
        const g = gcd(n, d);
        return { n: n / g, d: d / g };
    }
    const fAdd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
    const fSub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
    const fMul = (a, b) => F(a.n * b.n, a.d * b.d);
    const fDiv = (a, b) => F(a.n * b.d, a.d * b.n);
    const fCmp = (a, b) => a.n * b.d - b.n * a.d;
    const fNum = (a) => a.n / a.d;
    const fStr = (a) => a.n + '/' + a.d;
    function fFromStr(s) {
        if (!s || typeof s !== 'string') return null;
        const p = s.split('/');
        const n = parseInt(p[0], 10), d = parseInt(p[1] || '1', 10);
        return (isNaN(n) || isNaN(d) || d === 0) ? null : F(n, d);
    }
    function fFromNumber(x) {
        for (let d = 1; d <= 1000; d++) {
            const n = Math.round(x * d);
            if (Math.abs(n / d - x) < 1e-9) return F(n, d);
        }
        return F(Math.round(x * 1000), 1000);
    }

    // Lit « 3 », « -2 », « 1,5 », « 1.5 », « 3/4 », « -7/3 », « 1 1/2 ».
    // Renvoie { v: fraction exacte, disp: façon de l'écrire } ou null.
    function parseNum(raw) {
        if (raw === null || raw === undefined) return null;
        let s = String(raw).trim().replace(/[\u2212\u2013]/g, '-').replace(/\s*\/\s*/g, '/');
        if (!s) return null;
        let m;
        if ((m = s.match(/^([+-]?)(\d+)\s+(\d+)\/(\d+)$/))) {
            const w = +m[2], n = +m[3], d = +m[4];
            if (!d) return null;
            const neg = m[1] === '-';
            const v = F((w * d + n) * (neg ? -1 : 1), d);
            return { v, disp: { neg, whole: w, n, d } };
        }
        if ((m = s.match(/^([+-]?)(\d+)\/(\d+)$/))) {
            const n = +m[2], d = +m[3];
            if (!d) return null;
            const neg = m[1] === '-';
            return { v: F(neg ? -n : n, d), disp: { neg, n, d } };
        }
        const s2 = s.replace(',', '.');
        if ((m = s2.match(/^([+-]?)(\d*)(?:\.(\d+))?$/)) && (m[2] || m[3])) {
            const ip = m[2] || '0', dec = m[3] || '';
            if (dec.length > 6) return null;
            const neg = m[1] === '-';
            const n = parseInt(ip + dec, 10), d = Math.pow(10, dec.length);
            const isZero = n === 0;
            return { v: F(neg ? -n : n, d), disp: { text: (neg && !isZero ? '−' : '') + ip + (dec ? ',' + dec : '') } };
        }
        return null;
    }

    // Découpe une liste « 3 ; 1,5 ; 3/4 ». Le « ; » sépare les nombres
    // (la virgule sert aux décimaux). Compatibilité : « 3, 1/2, 0.5 ».
    function splitList(str) {
        if (!str) return [];
        let parts = String(str).split(/[;\n]+/);
        if (parts.length === 1 && /,\s/.test(str)) parts = String(str).split(/,\s+/);
        return parts.map(x => x.trim()).filter(Boolean);
    }

    // Écriture décimale exacte (virgule française) ou null si impossible.
    function decimalString(v) {
        let dd = v.d, twos = 0, fives = 0;
        while (dd % 2 === 0) { dd /= 2; twos++; }
        while (dd % 5 === 0) { dd /= 5; fives++; }
        if (dd !== 1) return null;
        const k = Math.max(twos, fives);
        const neg = v.n < 0;
        const scaled = Math.round(Math.abs(v.n) * Math.pow(10, k) / v.d);
        const s = String(scaled).padStart(k + 1, '0');
        const ip = s.slice(0, s.length - k), fp = s.slice(s.length - k);
        return (neg ? '−' : '') + ip + (k ? ',' + fp : '');
    }

    // Texte « tapable » d'un affichage (pour remplir les champs).
    function dispToInput(disp) {
        if (disp.text !== undefined) return disp.text.replace('−', '-');
        return (disp.neg ? '-' : '') + (disp.whole ? disp.whole + ' ' : '') + disp.n + '/' + disp.d;
    }
    function escapeHTML(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function dispHTML(disp) {
        if (disp.text !== undefined) return '<span>' + escapeHTML(disp.text) + '</span>';
        return (disp.neg ? '<span class="dn-f-sign">−</span>' : '') +
            (disp.whole ? '<span class="dn-f-whole">' + disp.whole + '</span>' : '') +
            '<span class="dn-f"><span>' + disp.n + '</span><span class="dn-f-bar"></span><span>' + disp.d + '</span></span>';
    }
    function dispPlain(disp) {
        if (disp.text !== undefined) return disp.text;
        return (disp.neg ? '−' : '') + (disp.whole ? disp.whole + ' ' : '') + disp.n + '/' + disp.d;
    }

    function svgEl(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }

    // Taille (largeur, hauteur) d'un nombre écrit à la taille fs.
    function dispSize(disp, fs) {
        if (disp.text !== undefined) return { w: disp.text.length * fs * 0.58 + 2, h: fs * 1.15 };
        const ff = fs * 0.9;
        const wf = Math.max(String(disp.n).length, String(disp.d).length) * ff * 0.6 + 6;
        let w = wf;
        if (disp.neg) w += ff * 0.62;
        if (disp.whole) w += String(disp.whole).length * fs * 0.6 + 3;
        return { w, h: ff * 2.25 };
    }

    // Dessine un nombre centré en x, avec son bord HAUT en yTop.
    function drawDisp(parent, disp, x, yTop, fs, color, weight, halo) {
        const g = svgEl('g');
        const baseAttrs = (size) => {
            const a = { 'font-size': size, fill: color, 'font-weight': weight || 600, 'font-family': FONT, 'text-anchor': 'middle' };
            if (halo) { a.stroke = '#ffffff'; a['stroke-width'] = Math.max(3, size / 4); a['paint-order'] = 'stroke'; a['stroke-linejoin'] = 'round'; }
            return a;
        };
        if (disp.text !== undefined) {
            const t = svgEl('text', Object.assign(baseAttrs(fs), { x, y: yTop + fs * 0.88 }));
            t.textContent = disp.text;
            g.appendChild(t);
            parent.appendChild(g);
            return g;
        }
        const ff = fs * 0.9;
        const size = dispSize(disp, fs);
        const wf = Math.max(String(disp.n).length, String(disp.d).length) * ff * 0.6 + 6;
        const left = x - size.w / 2;
        const cxFrac = left + size.w - wf / 2;
        const barY = yTop + ff * 1.12;
        let cursor = left;
        if (disp.neg) {
            const t = svgEl('text', Object.assign(baseAttrs(ff), { x: cursor + ff * 0.3, y: barY + ff * 0.33 }));
            t.textContent = '−'; g.appendChild(t);
            cursor += ff * 0.62;
        }
        if (disp.whole) {
            const ww = String(disp.whole).length * fs * 0.6;
            const t = svgEl('text', Object.assign(baseAttrs(fs), { x: cursor + ww / 2, y: barY + fs * 0.35 }));
            t.textContent = disp.whole; g.appendChild(t);
        }
        const tn = svgEl('text', Object.assign(baseAttrs(ff), { x: cxFrac, y: yTop + ff * 0.86 }));
        tn.textContent = disp.n; g.appendChild(tn);
        if (halo) g.appendChild(svgEl('line', { x1: cxFrac - wf / 2, x2: cxFrac + wf / 2, y1: barY, y2: barY, stroke: '#fff', 'stroke-width': Math.max(4, fs / 5), 'stroke-linecap': 'round' }));
        g.appendChild(svgEl('line', { x1: cxFrac - wf / 2 + 1, x2: cxFrac + wf / 2 - 1, y1: barY, y2: barY, stroke: color, 'stroke-width': Math.max(1.5, fs / 12), 'stroke-linecap': 'round' }));
        const td = svgEl('text', Object.assign(baseAttrs(ff), { x: cxFrac, y: barY + ff * 1.02 }));
        td.textContent = disp.d; g.appendChild(td);
        parent.appendChild(g);
        return g;
    }

    const PRESETS = [
        { id: 'ent10',  label: 'Entiers 0 → 10',        type: 'entiers',   debut: '0',   fin: '10',  pas: '1',   parts: 1,  labels: 'principales' },
        { id: 'ent100', label: '0 → 100 (dizaines)',    type: 'entiers',   debut: '0',   fin: '100', pas: '10',  parts: 10, labels: 'principales' },
        { id: 'rel',    label: 'Relatifs −10 → 10',     type: 'entiers',   debut: '-10', fin: '10',  pas: '1',   parts: 1,  labels: 'principales' },
        { id: 'dix',    label: 'Dixièmes 0 → 3',        type: 'decimaux',  debut: '0',   fin: '3',   pas: '1',   parts: 10, labels: 'principales' },
        { id: 'cent',   label: 'Centièmes 1 → 1,5',     type: 'decimaux',  debut: '1',   fin: '1,5', pas: '0,1', parts: 10, labels: 'principales' },
        { id: 'demis',  label: 'Demis 0 → 5',           type: 'fractions', debut: '0',   fin: '5',   pas: '1',   parts: 2,  labels: 'principales' },
        { id: 'tiers',  label: 'Tiers 0 → 3',           type: 'fractions', debut: '0',   fin: '3',   pas: '1',   parts: 3,  labels: 'principales' },
        { id: 'quarts', label: 'Quarts 0 → 3',          type: 'fractions', debut: '0',   fin: '3',   pas: '1',   parts: 4,  labels: 'principales' },
        { id: 'cinq',   label: 'Cinquièmes 0 → 2',      type: 'fractions', debut: '0',   fin: '2',   pas: '1',   parts: 5,  labels: 'principales' },
    ];

    // =========================================================================
    // FONCTION D'INITIALISATION
    // =========================================================================
    window.initDroiteNumWidget = function(widget, savedData) {
        if (!widget) return;
        widget.dataset.type    = 'pdf';         // détection par draw.js (_attachHoverToPdfWidget)
        widget.dataset.subtype = 'droite-num';  // identifie le widget pour les autres systèmes

        // ── Vider le contenu par défaut du widget ──────────────────────────
        const wContent = widget.querySelector('.widget-content');
        if (wContent) wContent.innerHTML = '';
        else { widget.innerHTML = ''; }

        // ── Conteneur principal ────────────────────────────────────────────
        const container = document.createElement('div');
        container.className = 'dn-container';

        // ── En-tête ────────────────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'dn-header';
        header.innerHTML = `
            <span class="dn-title">📏 Droite numérique</span>
            <div class="dn-seg" data-role="modes" title="Choisir l'activité">
                <button data-v="placer">🎯 Placer</button>
                <button data-v="lire">🔍 Lire</button>
                <button data-v="libre">✏️ Libre</button>
            </div>
            <span class="dn-spacer"></span>
            <button class="dn-head-btn" data-role="paramsBtn" title="Régler la droite et les nombres">⚙ Réglages</button>
            <button class="dn-head-btn round" data-role="helpBtn" title="Mode d'emploi">?</button>
        `;
        const modesSeg  = header.querySelector('[data-role=modes]');
        const paramsBtn = header.querySelector('[data-role=paramsBtn]');
        const helpBtn   = header.querySelector('[data-role=helpBtn]');

        // Boutons macOS
        const wfBtns = document.createElement('div');
        wfBtns.className = 'wf-btns';
        const minBtn = document.createElement('button');
        minBtn.className = 'wf-btn wf-btn-min'; minBtn.title = 'Réduire';
        const maxBtn = document.createElement('button');
        maxBtn.className = 'wf-btn wf-btn-max'; maxBtn.title = 'Plein écran';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'wf-btn wf-btn-close'; closeBtn.title = 'Fermer';
        wfBtns.appendChild(minBtn); wfBtns.appendChild(maxBtn); wfBtns.appendChild(closeBtn);
        header.appendChild(wfBtns);

        // ── Popup aide ─────────────────────────────────────────────────────
        const helpPopup = document.createElement('div');
        helpPopup.className = 'dn-help-popup';
        helpPopup.innerHTML = `
            <h4>📏 Mode d'emploi</h4>
            <p><b>1. Réglez la droite</b> avec ⚙ Réglages : choisissez un modèle tout prêt (Dixièmes, Quarts…) ou indiquez le début, la fin, l'écart entre deux grandes graduations et le nombre de parts entre elles.</p>
            <p><b>🎯 Placer :</b> les élèves font glisser chaque étiquette jaune sur la droite. Une flèche apparaît et vient pointer la graduation la plus proche. « Vérifier » colore les flèches : vert = bien placé, rouge = à corriger. On peut faire glisser une flèche pour la déplacer, ou cliquer dessus pour l'effacer : l'étiquette revient en bas.</p>
            <p><b>🔍 Lire :</b> des flèches A, B, C… montrent des graduations (si deux flèches sont proches, elles sont à des hauteurs différentes). Les élèves disent quel nombre correspond à chaque point ; cliquez sur une flèche pour montrer ou cacher la réponse.</p>
            <p><b>✏️ Libre :</b> cliquez sur la droite pour poser une flèche. Faites-la glisser pour la déplacer, ou cliquez dessus pour l'effacer. Les « bonds », dessinés sous la droite, montrent l'écart entre deux flèches posées l'une après l'autre (pratique pour les additions et soustractions).</p>
            <p><b>Écrire les nombres :</b> 3 &nbsp;·&nbsp; -2 &nbsp;·&nbsp; 1,5 &nbsp;·&nbsp; 3/4 &nbsp;·&nbsp; 1 1/2. Séparez-les par un point-virgule : <i>3 ; 1,5 ; 3/4</i>.</p>
        `;

        // ── Panneau réglages ───────────────────────────────────────────────
        const paramsPanel = document.createElement('div');
        paramsPanel.className = 'dn-params-panel';
        paramsPanel.innerHTML = `
            <div class="dn-p-row">
                <span class="dn-p-lab">Modèles</span>
                <div class="dn-chips">${PRESETS.map(p => `<button class="dn-chip" data-preset="${p.id}">${p.label}</button>`).join('')}</div>
            </div>
            <div class="dn-p-row">
                <span class="dn-p-lab">Nombres</span>
                <div class="dn-seg" data-role="type">
                    <button data-v="entiers">Entiers</button>
                    <button data-v="decimaux">Décimaux</button>
                    <button data-v="fractions">Fractions</button>
                </div>
                <label class="dn-check" data-role="simplifyWrap"><input type="checkbox" data-role="simplify"> Simplifier (2/4 → 1/2)</label>
                <span class="dn-gap"></span>
                écrits
                <select data-role="labels">
                    <option value="principales">sous les grandes graduations</option>
                    <option value="toutes">sous toutes les graduations</option>
                    <option value="debut">seulement les deux premiers (ex. 0 et 1)</option>
                    <option value="aucune">nulle part</option>
                </select>
            </div>
            <div class="dn-p-row">
                <span class="dn-p-lab">Droite</span>
                de <input type="text" data-role="debut" title="Premier nombre de la droite">
                à <input type="text" data-role="fin" title="Dernier nombre de la droite">
                <span class="dn-gap"></span>
                grande graduation tous les <input type="text" data-role="pas" title="Écart entre deux grandes graduations (ex : 1 ; 0,1 ; 10)">
                partagée en <input type="number" data-role="parts" min="1" max="20" step="1" title="Nombre de parts égales entre deux grandes graduations"> parts
            </div>
            <div class="dn-p-row" data-show="placer">
                <span class="dn-p-lab">À placer</span>
                <input type="text" class="dn-wide" data-role="tokens" placeholder="ex : 3 ; 1,5 ; 3/4">
                <button class="dn-small-btn" data-role="genTokens">🎲 Au hasard</button>
                <input type="number" data-role="count" min="1" max="12" step="1" title="Combien de nombres tirer au hasard"> nombres par tirage
            </div>
            <div class="dn-p-row" data-show="lire">
                <span class="dn-p-lab">Points à lire</span>
                <input type="text" class="dn-wide" data-role="lire" placeholder="ex : 2,5 ; 7/4">
                <button class="dn-small-btn" data-role="genLire">🎲 Au hasard</button>
                <input type="number" data-role="count2" min="1" max="8" step="1" title="Combien de points tirer au hasard"> points par tirage
            </div>
            <div class="dn-notes" data-role="notes"></div>
        `;
        const P = (role) => paramsPanel.querySelector(`[data-role="${role}"]`);
        const typeSeg = P('type'), simplifyWrap = P('simplifyWrap'), inSimplify = P('simplify');
        const inDebut = P('debut'), inFin = P('fin'), inPas = P('pas'), inParts = P('parts');
        const selLabels = P('labels'), inTokens = P('tokens'), inLire = P('lire'), inCount = P('count'), inCount2 = P('count2');
        const notesEl = P('notes');

        // ── Zone droite numérique (SVG) ────────────────────────────────────
        const lineZone = document.createElement('div');
        lineZone.className = 'dn-line-zone';
        const svgWrap = document.createElement('div');
        svgWrap.className = 'dn-svg-wrap';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('xmlns', NS);
        svg.setAttribute('class', 'dn-svg');
        svgWrap.appendChild(svg);
        lineZone.appendChild(svgWrap);

        // ── Zone étiquettes ────────────────────────────────────────────────
        const tokensZone = document.createElement('div');
        tokensZone.className = 'dn-tokens-zone';

        // ── Barre du bas ───────────────────────────────────────────────────
        const controls = document.createElement('div');
        controls.className = 'dn-controls';

        // ── Poignée resize ─────────────────────────────────────────────────
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'dn-resize-handle';

        // ── Assemblage ─────────────────────────────────────────────────────
        container.appendChild(header);
        container.appendChild(helpPopup);
        container.appendChild(paramsPanel);
        container.appendChild(lineZone);
        container.appendChild(tokensZone);
        container.appendChild(controls);
        container.appendChild(resizeHandle);

        if (wContent) wContent.appendChild(container);
        else widget.appendChild(container);

        // =========================================================================
        // CANVAS D'ANNOTATION DRAW.JS
        // =========================================================================
        // Faux pdf-canvas-wrap (toujours display:block) pour satisfaire _findActivePdfWidget.
        const _dnFakeWrap = document.createElement('div');
        _dnFakeWrap.className = 'pdf-canvas-wrap';
        _dnFakeWrap.style.cssText = 'display:block;position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:visible;';

        const annotCanvas = document.createElement('canvas');
        annotCanvas.className = 'pdf-annot-canvas';
        annotCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:51;touch-action:none;display:block;border-radius:16px;';

        // Overlay transparent qui capte TOUS les events quand le mode annotation est actif.
        const _dnAnnotOverlay = document.createElement('div');
        _dnAnnotOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:52;pointer-events:none;touch-action:none;cursor:inherit;';

        _dnFakeWrap.appendChild(annotCanvas);
        _dnFakeWrap.appendChild(_dnAnnotOverlay);
        // Placer dans wContent/widget, par-dessus le container.
        if (wContent) wContent.appendChild(_dnFakeWrap);
        else widget.appendChild(_dnFakeWrap);

        let _dnSyncLocked = false;  // bloque le resize canvas pendant un trait actif

        function _dnSyncAnnotCanvas() {
            if (_dnSyncLocked) return;
            const w = container.offsetWidth;
            const h = container.offsetHeight;
            if (w === 0 || h === 0) return;
            const dpr  = window.devicePixelRatio || 1;
            const newW = Math.round(w * dpr);
            const newH = Math.round(h * dpr);
            if (annotCanvas.width === newW && annotCanvas.height === newH) return;
            // Sauvegarder le contenu avant redimensionnement
            let saved = null;
            if (annotCanvas.width > 0 && annotCanvas.height > 0) {
                try { saved = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height); } catch(e) {}
            }
            annotCanvas.width  = newW;
            annotCanvas.height = newH;
            if (saved && saved.width > 0 && saved.height > 0) {
                const tmp = document.createElement('canvas');
                tmp.width = saved.width; tmp.height = saved.height;
                tmp.getContext('2d').putImageData(saved, 0, 0);
                actx.drawImage(tmp, 0, 0, saved.width, saved.height, 0, 0, newW, newH);
            } else {
                _dnRedrawAnnotations();
            }
        }

        // Données d'annotation (strokes normalisés 0->1)
        const _dnAnnotLayer = { strokes: [], history: [], redoHistory: [] };
        let   _dnIsDrawing  = false;
        let   _dnCurStroke  = null;

        const actx = annotCanvas.getContext('2d');



        function _dnToNorm(px, py) {
            const dpr = window.devicePixelRatio || 1;
            const cw = annotCanvas.width;
            const ch = annotCanvas.height;
            return { x: px / cw, y: py / ch };
        }
        function _dnFromNorm(nx, ny) {
            return { x: nx * annotCanvas.width, y: ny * annotCanvas.height };
        }

        function _dnBuildSnapshot() {
            _dnAnnotLayer._snapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
        }
        function _dnInvalidateSnapshot() { _dnAnnotLayer._snapshot = null; }

        function _dnDrawStroke(ctx, stroke) {
            const cw = annotCanvas.width;
            const displayW = annotCanvas.getBoundingClientRect().width || cw;
            const sizeScaled = stroke.size * cw / displayW;
            if (stroke.tool === 'text') {
                const pos = _dnFromNorm(stroke.nx, stroke.ny);
                const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * cw / 600);
                ctx.save();
                ctx.font = fontSize + 'px \'Segoe UI\', sans-serif';
                ctx.fillStyle = stroke.color; ctx.globalAlpha = 1;
                const lines = (stroke.text || '').split('\n');
                if (stroke.rotation) {
                    const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
                    const textH = lines.length * fontSize * 1.3;
                    ctx.translate(pos.x + textW/2, pos.y + textH/2);
                    ctx.rotate(stroke.rotation);
                    ctx.translate(-(pos.x + textW/2), -(pos.y + textH/2));
                }
                lines.forEach((line, i) => ctx.fillText(line, pos.x, pos.y + (i + 1) * fontSize * 1.3));
                ctx.restore(); return;
            }
            if (stroke.tool === 'figure') {
                if (!stroke.pts || stroke.pts.length < 2) return;
                const pxPts = stroke.pts.map(p => _dnFromNorm(p.x, p.y));
                ctx.save();
                ctx.strokeStyle = stroke.color; ctx.lineWidth = sizeScaled;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1;
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
                if (stroke.fillColor && stroke.fillOpacity > 0) {
                    ctx.globalAlpha = stroke.fillOpacity; ctx.fillStyle = stroke.fillColor; ctx.fill();
                }
                ctx.restore(); return;
            }
            if (!stroke.pts || stroke.pts.length === 0) return;
            const pxPts = stroke.pts.map(p => _dnFromNorm(p.x, p.y));
            ctx.save();
            if (stroke.dot) {
                ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
                ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
                const r = Math.max(1, sizeScaled / 2);
                ctx.beginPath(); ctx.arc(pxPts[0].x, pxPts[0].y, r, 0, Math.PI * 2);
                ctx.fillStyle = stroke.color; ctx.fill();
            } else if (stroke.tool === 'highlighter') {
                const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'multiply';
                ctx.strokeStyle = stroke.color; ctx.lineWidth = lw;
                ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else if (stroke.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = sizeScaled * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else {
                ctx.globalAlpha = 1; ctx.strokeStyle = stroke.color;
                ctx.lineWidth = sizeScaled; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
            ctx.restore();
        }

        function _dnRedrawAnnotations() {
            actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
            if (_dnAnnotLayer._snapshot) {
                actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
            } else {
                _dnAnnotLayer.strokes.forEach(s => _dnDrawStroke(actx, s));
            }
        }

        // _pdfAnnotAPI : interface attendue par draw.js
        widget._pdfAnnotAPI = {
            startStroke(color, size, tool, px, py) {
                _dnSyncLocked = true;  // bloquer tout resize pendant le trait
                const norm = _dnToNorm(px, py);
                _dnCurStroke = { tool, color, size, pts: [norm] };
                _dnIsDrawing = true;
                _dnBuildSnapshot();
            },
            continueStroke(color, size, tool, px, py) {
                if (!_dnIsDrawing || !_dnCurStroke) return;
                const norm = _dnToNorm(px, py);
                const pts  = _dnCurStroke.pts;
                const prev = pts[pts.length - 1];
                pts.push(norm);
                _dnCurStroke.color = color; _dnCurStroke.size = size; _dnCurStroke.tool = tool;
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const sizeScaled = size * cw / displayW;
                const pPrev = _dnFromNorm(prev.x, prev.y);
                const pCur  = _dnFromNorm(norm.x, norm.y);
                actx.save();
                if (tool === 'highlighter') {
                    if (pts.length % 20 === 0) {
                        if (_dnAnnotLayer._snapshot) actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
                        else actx.clearRect(0, 0, cw, annotCanvas.height);
                        const pxPts = pts.map(p => _dnFromNorm(p.x, p.y));
                        const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                        actx.globalAlpha = 0.35; actx.globalCompositeOperation = 'multiply';
                        actx.strokeStyle = color; actx.lineWidth = lw;
                        actx.lineCap = 'butt'; actx.lineJoin = 'round';
                        actx.beginPath();
                        pxPts.forEach((p, i) => i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y));
                        actx.stroke();
                    } else {
                        const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                        actx.globalAlpha = 0.35; actx.globalCompositeOperation = 'multiply';
                        actx.strokeStyle = color; actx.lineWidth = lw;
                        actx.lineCap = 'round'; actx.lineJoin = 'round';
                        actx.beginPath(); actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y); actx.stroke();
                    }
                } else if (tool === 'eraser') {
                    actx.globalCompositeOperation = 'destination-out';
                    actx.lineWidth = sizeScaled * 2; actx.lineCap = 'round';
                    actx.beginPath(); actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y); actx.stroke();
                } else {
                    actx.strokeStyle = color; actx.lineWidth = sizeScaled;
                    actx.lineCap = 'round'; actx.lineJoin = 'round';
                    actx.beginPath(); actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y); actx.stroke();
                }
                actx.restore();
            },
            endStroke() {
                if (!_dnIsDrawing || !_dnCurStroke) return;
                _dnIsDrawing = false;
                if (_dnCurStroke.pts.length === 1) _dnCurStroke.dot = true;
                _dnAnnotLayer.redoHistory = [];
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnAnnotLayer.strokes.push(_dnCurStroke);
                _dnCurStroke = null;
                _dnInvalidateSnapshot();   // invalider le snapshot vide AVANT de redessiner
                _dnRedrawAnnotations();
                setTimeout(() => { _dnSyncLocked = false; }, 100);
            },
            undo() {
                if (_dnAnnotLayer.history.length > 0) {
                    _dnAnnotLayer.redoHistory.push([..._dnAnnotLayer.strokes]);
                    _dnAnnotLayer.strokes = _dnAnnotLayer.history.pop();
                } else if (_dnAnnotLayer.strokes.length > 0) {
                    _dnAnnotLayer.redoHistory.push([..._dnAnnotLayer.strokes]);
                    _dnAnnotLayer.strokes.pop();
                }
                _dnAnnotLayer._snapshot = null;
                _dnRedrawAnnotations();
            },
            redo() {
                if (_dnAnnotLayer.redoHistory.length > 0) {
                    _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                    _dnAnnotLayer.strokes = _dnAnnotLayer.redoHistory.pop();
                    _dnAnnotLayer._snapshot = null;
                    _dnRedrawAnnotations();
                }
            },
            clear() {
                if (_dnAnnotLayer.strokes.length > 0) _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                _dnAnnotLayer.strokes = [];
                _dnAnnotLayer._snapshot = null;
                _dnAnnotLayer.redoHistory = [];
                _dnRedrawAnnotations();
            },
            getAnnotCanvas()  { return annotCanvas; },
            getPdfDoc()       { return null; },
            getTotalPages()   { return 1; },
            getAnnotLayers()  { return { 1: _dnAnnotLayer }; },
            drawStrokeOn(ctx, stroke) { _dnDrawStroke(ctx, stroke); },
            addTextStroke(text, color, size, px, py) {
                const norm = _dnToNorm(px, py);
                const stroke = { tool: 'text', color, size, text, nx: norm.x, ny: norm.y };
                _dnAnnotLayer.redoHistory = [];
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnAnnotLayer.strokes.push(stroke);
                _dnRedrawAnnotations();
            },
            previewFigure(color, size, pts, fillColor, fillOpacity) {
                _dnRedrawAnnotations();
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const sizeScaled = size * cw / displayW;
                actx.save();
                actx.strokeStyle = color; actx.lineWidth = sizeScaled;
                actx.lineCap = 'round'; actx.lineJoin = 'round';
                actx.setLineDash([6, 4]); actx.globalAlpha = 0.7;
                actx.beginPath();
                pts.forEach((p, i) => i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y));
                if (fillColor && fillOpacity > 0) {
                    actx.save(); actx.globalAlpha = fillOpacity * 0.7;
                    actx.fillStyle = fillColor; actx.setLineDash([]); actx.fill(); actx.restore();
                    actx.setLineDash([6, 4]);
                }
                actx.stroke(); actx.setLineDash([]); actx.restore();
            },
            addFigureStroke(color, size, pts, fillColor, fillOpacity) {
                const normPts = pts.map(p => _dnToNorm(p.x, p.y));
                const stroke = { tool: 'figure', color, size, pts: normPts };
                if (fillColor && fillOpacity > 0) { stroke.fillColor = fillColor; stroke.fillOpacity = fillOpacity; }
                _dnAnnotLayer.redoHistory = [];
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnAnnotLayer.strokes.push(stroke); _dnRedrawAnnotations(); _dnInvalidateSnapshot();
            },
            previewEraser(px, py, r) {
                if (_dnAnnotLayer._snapshot) actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
                else _dnRedrawAnnotations();
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const rScaled = r * cw / displayW;
                actx.save(); actx.globalCompositeOperation = 'source-over';
                actx.beginPath(); actx.arc(px, py, rScaled, 0, Math.PI * 2);
                actx.strokeStyle = 'rgba(80,80,80,0.9)'; actx.lineWidth = 1.5;
                actx.setLineDash([4, 3]); actx.stroke();
                actx.beginPath(); actx.arc(px, py, 2, 0, Math.PI * 2);
                actx.fillStyle = 'rgba(80,80,80,0.7)'; actx.fill();
                actx.setLineDash([]); actx.restore();
            },
            eraseAt(px, py, r) {
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const rScaled = r * cw / displayW;
                actx.save(); actx.globalCompositeOperation = 'destination-out';
                actx.beginPath(); actx.arc(px, py, rScaled, 0, Math.PI * 2);
                actx.fill(); actx.restore();
            },
            saveEraserSnapshot() {
                const imgData = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                _dnAnnotLayer._snapshot = imgData;
                _dnAnnotLayer.strokes = [];
            },
            redrawAnnotations() { _dnRedrawAnnotations(); },
            drawTextSelection(index) {
                const s = _dnAnnotLayer.strokes[index];
                if (!s || s.tool !== 'text') return;
                if (_dnAnnotLayer._snapshot) actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
                else _dnRedrawAnnotations();
                _dnDrawStroke(actx, s);
            },
            moveTextStroke(index, px, py) {
                const norm = _dnToNorm(px, py);
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.strokes[index] = { ..._dnAnnotLayer.strokes[index], nx: norm.x, ny: norm.y };
                if (_dnAnnotLayer._snapshot) { actx.putImageData(_dnAnnotLayer._snapshot, 0, 0); _dnDrawStroke(actx, _dnAnnotLayer.strokes[index]); }
                else _dnRedrawAnnotations();
            },
            saveTextMove(index) {
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnInvalidateSnapshot();
            },
            rotateTextStroke(index, angle) {
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.strokes[index] = { ..._dnAnnotLayer.strokes[index], rotation: angle };
                if (_dnAnnotLayer._snapshot) { actx.putImageData(_dnAnnotLayer._snapshot, 0, 0); _dnDrawStroke(actx, _dnAnnotLayer.strokes[index]); }
                else _dnRedrawAnnotations();
            },
            saveTextTransform(index) {
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnInvalidateSnapshot();
            },
            detachNativeEvents() {},
        };

        // Sync canvas taille via ResizeObserver.
        // Quand les dimensions changent, on sauvegarde le contenu via ImageData
        // avant de redimensionner, puis on restaure — le canvas n'est jamais vidé.
        requestAnimationFrame(() => _dnSyncAnnotCanvas());
        const _dnResizeObs = new ResizeObserver(() => _dnSyncAnnotCanvas());
        _dnResizeObs.observe(widget);

        // Activation / desactivation du mode annotation
        // draw.js ajoute la classe 'pdf-annot-target' sur le widget quand il active l'annotation.
        function _dnEnterAnnotMode() {
            _dnAnnotOverlay.style.pointerEvents = 'auto';
            svgWrap.style.pointerEvents = 'none';
            tokensZone.style.pointerEvents = 'none';
            controls.style.pointerEvents = 'none';
        }
        function _dnLeaveAnnotMode() {
            _dnAnnotOverlay.style.pointerEvents = 'none';
            svgWrap.style.pointerEvents = '';
            tokensZone.style.pointerEvents = '';
            controls.style.pointerEvents = '';
        }
        const _dnAnnotObserver = new MutationObserver(() => {
            if (widget.classList.contains('pdf-annot-target')) {
                _dnEnterAnnotMode();
            } else {
                _dnLeaveAnnotMode();
            }
        });
        _dnAnnotObserver.observe(widget, { attributes: true, attributeFilter: ['class'] });


        // =========================================================================
        // ÉTAT INTERNE
        // =========================================================================
        const cfg = {
            mode: 'placer',          // 'placer' | 'lire' | 'libre'
            type: 'entiers',         // 'entiers' | 'decimaux' | 'fractions'
            simplify: false,
            debut: '0', fin: '10', pas: '1', parts: 1,
            labels: 'principales',   // 'principales' | 'toutes' | 'debut' | 'aucune'
            tokensStr: '',
            lireStr: '',
            count: 4,               // nombres à placer par tirage
            countLire: 4,           // points à lire par tirage
            showValues: true,        // mode libre
            bonds: false,            // mode libre
        };

        let G = null;                // graduation calculée
        let gridNotes = [];          // remarques sur la graduation
        let tokens = [];             // { disp, v, placed }
        let tokenErrors = [];
        let placerMarkers = [];      // { id, v, tokenIdx, correct }
        let showSolution = false;
        let lirePoints = [];         // { v, letter, revealed }
        let lireErrors = [];
        let libreMarkers = [];       // { id, v }
        let markerIdCounter = 0;
        let resultMsg = { text: '', color: '' };
        let justDragged = false;

        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };

        // ── Calcul de la graduation (fractions exactes) ───────────────────
        function computeGrid() {
            gridNotes = [];
            const pDeb = parseNum(cfg.debut);
            const deb = pDeb ? pDeb.v : F(0);
            if (!pDeb) gridNotes.push({ c: 'warn', t: `Le début « ${cfg.debut} » n'est pas un nombre : 0 est utilisé.` });

            const pPas = parseNum(cfg.pas);
            let pas = pPas ? pPas.v : null;
            if (!pas || pas.n <= 0) {
                pas = F(1);
                gridNotes.push({ c: 'warn', t: `L'écart entre deux grandes graduations doit être un nombre positif : 1 est utilisé.` });
            }
            let parts = parseInt(cfg.parts, 10);
            if (isNaN(parts) || parts < 1) parts = 1;
            if (parts > 20) parts = 20;
            const fine = fDiv(pas, F(parts));

            const pFin = parseNum(cfg.fin);
            let fin = pFin ? pFin.v : null;
            if (!fin || fCmp(fin, deb) <= 0) {
                fin = fAdd(deb, fMul(pas, F(10)));
                gridNotes.push({ c: 'warn', t: `La fin doit être plus grande que le début : la droite va jusqu'à ${dispPlain(dispValueRaw(fin, fine, deb))}.` });
            }
            const ratio = fDiv(fSub(fin, deb), fine);
            let N = Math.floor(fNum(ratio) + 1e-9);
            if (ratio.d !== 1 && N >= 1) {
                gridNotes.push({ c: 'warn', t: `La fin ne tombe pas sur une graduation : la droite s'arrête à ${dispPlain(dispValueRaw(fAdd(deb, fMul(fine, F(N))), fine, deb))}.` });
            }
            if (N < 1) N = parts;
            if (N > 400) {
                N = 400;
                gridNotes.push({ c: 'warn', t: `Trop de graduations : la droite est raccourcie à 400 petites graduations.` });
            }
            G = { deb, pas, parts, fine, N, fin: fAdd(deb, fMul(fine, F(N))) };

            const fineDec = decimalString(fine);
            const fineTxt = dispPlain(fine.d === 1 ? { text: String(fine.n) } : { n: fine.n, d: fine.d }) + (fineDec && fine.d !== 1 && cfg.type === 'fractions' ? ` (= ${fineDec})` : '');
            gridNotes.unshift({ c: 'info', t: parts > 1
                ? `Entre deux grandes graduations, il y a ${parts} parts égales : une petite graduation vaut ${cfg.type === 'fractions' ? fineTxt : (fineDec || fineTxt)}.`
                : `Chaque graduation vaut ${fineDec || fineTxt} de plus que la précédente.` });
        }
        const tick = (k) => fAdd(G.deb, fMul(G.fine, F(k)));

        // Écriture d'un nombre de la droite selon le type choisi
        function dispValueRaw(v, fine, deb) {
            if (v.d === 1) return { text: (v.n < 0 ? '−' : '') + Math.abs(v.n) };
            if (cfg.type === 'fractions') {
                let n = v.n, d = v.d;
                if (!cfg.simplify && fine) {
                    const D = lcm(fine.d, deb ? deb.d : 1);
                    if (D % d === 0) { n = n * (D / d); d = D; }
                }
                return { neg: n < 0, n: Math.abs(n), d };
            }
            const ds = decimalString(v);
            if (ds !== null) return { text: ds };
            return { neg: v.n < 0, n: Math.abs(v.n), d: v.d };
        }
        const dispValue = (v) => dispValueRaw(v, G.fine, G.deb);

        // ── Lecture des listes de nombres ─────────────────────────────────
        function parseTokens() {
            tokens = []; tokenErrors = [];
            splitList(cfg.tokensStr).forEach(txt => {
                const p = parseNum(txt);
                if (p) tokens.push({ disp: p.disp, v: p.v, placed: false });
                else tokenErrors.push(txt);
            });
            placerMarkers = [];
            showSolution = false;
            resultMsg = { text: '', color: '' };
        }
        function parseLire() {
            lirePoints = []; lireErrors = [];
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            splitList(cfg.lireStr).forEach(txt => {
                const p = parseNum(txt);
                if (p) lirePoints.push({ v: p.v, letter: letters[lirePoints.length % 26], revealed: false });
                else lireErrors.push(txt);
            });
        }

        // ── Tirages au hasard ─────────────────────────────────────────────
        function labeledSetRaw() {
            const set = new Set();
            if (cfg.labels === 'aucune') return set;
            if (cfg.labels === 'debut') { set.add(0); set.add(Math.min(G.parts, G.N)); return set; }
            const step = cfg.labels === 'toutes' ? 1 : G.parts;
            for (let k = 0; k <= G.N; k += step) set.add(k);
            return set;
        }
        function randomValues(count) {
            const labeled = labeledSetRaw();
            let cand = [];
            for (let k = 1; k < G.N; k++) if (!labeled.has(k)) cand.push(k);
            if (cand.length < count) { cand = []; for (let k = 0; k <= G.N; k++) cand.push(k); }
            for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
            return cand.slice(0, Math.min(count, cand.length)).map(k => tick(k));
        }
        function generateTokens() {
            cfg.tokensStr = randomValues(cfg.count).map(v => dispToInput(dispValue(v))).join(' ; ');
            inTokens.value = cfg.tokensStr;
            parseTokens();
        }
        function generateLire() {
            cfg.lireStr = randomValues(cfg.countLire).map(v => dispToInput(dispValue(v))).join(' ; ');
            inLire.value = cfg.lireStr;
            parseLire();
        }

        // ── Après un changement de graduation ─────────────────────────────
        function snapValue(v) {
            let k = Math.round(fNum(fDiv(fSub(v, G.deb), G.fine)));
            return Math.max(0, Math.min(G.N, k));
        }
        function inRange(v) { return fCmp(v, G.deb) >= 0 && fCmp(v, G.fin) <= 0; }
        function onGridChanged() {
            computeGrid();
            // Mode placer : on recommence (les étiquettes reviennent)
            placerMarkers = []; tokens.forEach(t => t.placed = false);
            showSolution = false; resultMsg = { text: '', color: '' };
            // Mode libre : on garde les points qui restent sur la droite
            libreMarkers = libreMarkers.filter(m => inRange(m.v)).map(m => Object.assign(m, { v: tick(snapValue(m.v)) }));
        }

        // =========================================================================
        // DESSIN DE LA DROITE
        // =========================================================================
        let geom = null;

        function getLineDims() {
            const W = svgWrap.clientWidth || 780;
            const H = svgWrap.clientHeight || 260;
            return { W, H };
        }
        function valueToX(v) {
            const t = (fNum(v) - fNum(G.deb)) / (fNum(G.fin) - fNum(G.deb));
            return geom.pad + t * (geom.W - 2 * geom.pad);
        }
        function kToX(k) { return geom.pad + (k / G.N) * (geom.W - 2 * geom.pad); }
        function xToK(x) {
            const k = Math.round((x - geom.pad) / (geom.W - 2 * geom.pad) * G.N);
            return Math.max(0, Math.min(G.N, k));
        }
        function clientToSvg(cx, cy) {
            const m = svg.getScreenCTM();
            if (!m) return null;
            const pt = svg.createSVGPoint();
            pt.x = cx; pt.y = cy;
            return pt.matrixTransform(m.inverse());
        }
        function nearLine(p) {
            return p && p.x >= geom.pad - 30 && p.x <= geom.W - geom.pad + 30 && Math.abs(p.y - geom.cy) <= geom.fs * 5;
        }

        // Quelles graduations reçoivent un nombre (en évitant les chevauchements)
        function labeledIndices() {
            if (cfg.labels === 'aucune') return [];
            if (cfg.labels === 'debut') return [0, Math.min(G.parts, G.N)];
            const spacing = (geom.W - 2 * geom.pad) / G.N;
            const widthOf = (k) => dispSize(dispValue(tick(k)), geom.labelFs).w;
            const fits = (s) => {
                let maxW = 0;
                for (let k = 0; k <= G.N; k += s) maxW = Math.max(maxW, widthOf(k));
                return spacing * s >= maxW + 10;
            };
            let s = null;
            if (cfg.labels === 'toutes') {
                for (let d = 1; d <= G.parts; d++) if (G.parts % d === 0 && fits(d)) { s = d; break; }
            }
            if (s === null) {
                let m = 1;
                while (!fits(G.parts * m) && G.parts * m < G.N) m++;
                s = G.parts * m;
            }
            const out = [];
            for (let k = 0; k <= G.N; k += s) out.push(k);
            return out;
        }

        function render() {
            if (!G) computeGrid();
            const { W, H } = getLineDims();
            const fs = Math.max(12, Math.min(34, Math.round(Math.min(W / 50, H / 11))));
            const pad = Math.max(48, fs * 2.8);
            const cy = Math.round(H * (cfg.mode === 'libre' && cfg.bonds ? 0.5 : 0.58));   // place sous la droite pour les bonds
            geom = { W, H, pad, cy, fs, labelFs: Math.round(fs * 0.95), r: Math.max(7, fs * 0.42) };
            svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            const ink = '#1f2937';
            const x0 = pad - 16, x1 = W - pad + 22;

            // Zone sensible (clics en mode libre, surbrillance au dépôt)
            const hit = svgEl('rect', { x: x0 - 10, y: cy - fs * 3, width: x1 - x0 + 20, height: fs * 6, fill: 'transparent', rx: 12, 'data-role': 'hit' });
            hit.style.cursor = cfg.mode === 'libre' ? 'crosshair' : 'default';
            svg.appendChild(hit);

            // Ligne + flèche
            svg.appendChild(svgEl('line', { x1: x0, y1: cy, x2: x1 - 4, y2: cy, stroke: ink, 'stroke-width': Math.max(2.5, fs / 7), 'stroke-linecap': 'round', 'pointer-events': 'none' }));
            const a = fs * 0.55;
            svg.appendChild(svgEl('polygon', { points: `${x1 + a * 0.3},${cy} ${x1 - a},${cy - a * 0.6} ${x1 - a},${cy + a * 0.6}`, fill: ink, 'pointer-events': 'none' }));

            // Graduations
            const unitEmph = G.pas.d !== 1;   // si les grandes graduations ne sont pas des entiers, on souligne les entiers
            const ticksG = svgEl('g', { 'pointer-events': 'none' });
            for (let k = 0; k <= G.N; k++) {
                const v = tick(k), x = kToX(k);
                const main = k % G.parts === 0;
                let h = main ? 0.62 : 0.34;
                if (unitEmph && v.d === 1) h = 0.85;
                const zero = v.n === 0;
                ticksG.appendChild(svgEl('line', {
                    x1: x, x2: x, y1: cy - fs * h, y2: cy + fs * h,
                    stroke: main || zero ? ink : '#6b7280',
                    'stroke-width': zero ? Math.max(3, fs / 6) : (main ? Math.max(2, fs / 10) : Math.max(1.2, fs / 16)),
                }));
            }
            svg.appendChild(ticksG);

            // Nombres sous la droite
            const labelsG = svgEl('g', { 'pointer-events': 'none' });
            geom.gradH = 0;
            labeledIndices().forEach(k => {
                geom.gradH = Math.max(geom.gradH, dispSize(dispValue(tick(k)), geom.labelFs).h);
                const v = tick(k);
                drawDisp(labelsG, dispValue(v), kToX(k), cy + fs * 0.95, geom.labelFs, v.n === 0 ? ink : '#374151', v.n === 0 || k % G.parts === 0 ? 700 : 500, false);
            });
            svg.appendChild(labelsG);

            // Contenu selon l'activité
            if (cfg.mode === 'placer') renderPlacer();
            else if (cfg.mode === 'lire') renderLire();
            else renderLibre();

            hit.addEventListener('click', onLineClick);
        }

        // Point + nombre au-dessus
        function drawPoint(parent, x, disp, color, opts) {
            opts = opts || {};
            const { cy, fs, r } = geom;
            const g = svgEl('g');
            if (opts.cls) g.setAttribute('class', opts.cls);
            g.appendChild(svgEl('circle', { cx: x, cy, r: r + 10, fill: 'transparent' }));   // zone de prise plus large
            g.appendChild(svgEl('circle', { cx: x, cy, r, fill: color, stroke: '#ffffff', 'stroke-width': 2.5 }));
            if (disp) {
                const sz = dispSize(disp, fs);
                const bottom = cy - fs * 0.95;
                drawDisp(g, disp, x, bottom - sz.h, fs, color, 800, true);
            }
            parent.appendChild(g);
            return g;
        }

        // ── Flèches posées au-dessus de la droite (Placer et Libre) ───────
        // items : { x, disp, color, solution?, marker?, list?, onRemove? }
        function drawArrows(items) {
            if (!items.length) return;
            const { cy, fs } = geom;
            items.forEach(o => {
                const sz = dispSize(o.disp, fs);
                o.bw = Math.max(sz.w + 14, fs * 1.6);
                o.bh = sz.h + 8;
            });
            items.sort((a, b) => a.x - b.x);

            // Hauteurs en escalier : deux flèches trop proches ne sont pas au même niveau
            const levels = [];
            items.forEach(o => {
                let lv = 0;
                while (levels[lv] !== undefined && o.x - o.bw / 2 < levels[lv] + 10) lv++;
                levels[lv] = o.x + o.bw / 2;
                o.level = lv;
            });
            const bhMax = Math.max(...items.map(o => o.bh));
            const step = bhMax + 12;
            const tipY = cy - Math.max(2, fs / 14);
            const shaftBase = fs * 1.6;

            // Flèches d'abord, cadres ensuite (une grande flèche passe derrière un cadre voisin)
            const arrowsLayer = svgEl('g'), labelsLayer = svgEl('g');
            svg.appendChild(arrowsLayer); svg.appendChild(labelsLayer);

            items.forEach(o => {
                const { x, color } = o;
                const topY = tipY - shaftBase - o.level * step;
                const ga = svgEl('g'), gl = svgEl('g');
                const dash = o.solution ? '6 4' : '';

                const ah = Math.max(9, fs * 0.55), aw = Math.max(6, fs * 0.36);
                ga.appendChild(svgEl('rect', { x: x - aw - 4, y: topY, width: 2 * aw + 8, height: tipY - topY, fill: 'transparent' }));
                ga.appendChild(svgEl('line', { x1: x, x2: x, y1: topY, y2: tipY - ah + 1, stroke: color, 'stroke-width': Math.max(2.5, fs / 8), 'stroke-linecap': 'round', 'stroke-dasharray': dash }));
                ga.appendChild(svgEl('polygon', { points: `${x},${tipY} ${x - aw},${tipY - ah} ${x + aw},${tipY - ah}`, fill: o.solution ? 'none' : color, stroke: color, 'stroke-width': o.solution ? 2 : 0, 'stroke-linejoin': 'round' }));

                gl.appendChild(svgEl('rect', {
                    x: x - o.bw / 2, y: topY - o.bh, width: o.bw, height: o.bh, rx: 8,
                    fill: o.solution ? '#f0fdf4' : '#ffffff', stroke: color, 'stroke-width': o.solution ? 2 : 2.5, 'stroke-dasharray': dash,
                }));
                drawDisp(gl, o.disp, x, topY - o.bh + 4, fs, color, 800, false);

                if (o.solution) {
                    ga.setAttribute('pointer-events', 'none');
                    gl.setAttribute('pointer-events', 'none');
                    ga.setAttribute('opacity', '0.9'); gl.setAttribute('opacity', '0.9');
                } else if (o.marker) {
                    const m = o.marker;
                    [ga, gl].forEach(el => {
                        el.setAttribute('data-mid', m.id);
                        el.style.cursor = 'grab';
                        attachMarkerDrag(el, m, o.list, o.onRemove || null);
                    });
                    if (m.correct === false) gl.setAttribute('class', 'dn-wrong');
                }
                arrowsLayer.appendChild(ga);
                labelsLayer.appendChild(gl);
            });
        }

        // ── Activité « Placer » ───────────────────────────────────────────
        function renderPlacer() {
            const green = '#16a34a';
            // Flèches des élèves + flèches de la solution (pointillés verts)
            const items = [];
            placerMarkers.forEach(m => {
                const t = tokens[m.tokenIdx];
                if (!t) return;
                const color = m.correct === true ? green : m.correct === false ? '#dc2626' : '#2563eb';
                items.push({ x: valueToX(m.v), disp: t.disp, color, marker: m, list: placerMarkers, onRemove: () => { t.placed = false; } });
            });
            if (showSolution) {
                tokens.forEach(t => {
                    if (!inRange(t.v)) return;
                    items.push({ x: valueToX(t.v), disp: t.disp, color: green, solution: true });
                });
            }
            drawArrows(items);
        }

        // ── Activité « Lire » ─────────────────────────────────────────────
        function renderLire() {
            const { cy, fs } = geom;
            const color = '#7c3aed';
            // Points visibles, triés de gauche à droite
            const pts = lirePoints.filter(p => inRange(p.v))
                .map(p => {
                    const full = dispSize(dispValue(p.v), fs);           // taille une fois révélé
                    const bw = Math.max(full.w + 16, fs * 1.8);
                    return { p, x: valueToX(p.v), bw, bhFull: full.h + 10 };
                })
                .sort((a, b) => a.x - b.x);
            if (!pts.length) return;

            // Hauteurs en escalier : deux flèches trop proches ne sont pas au même niveau.
            // (calculé avec la taille « révélée » pour que rien ne bouge quand on clique)
            const levels = [];   // pour chaque niveau : bord droit du dernier cadre posé
            pts.forEach(o => {
                let lv = 0;
                while (levels[lv] !== undefined && o.x - o.bw / 2 < levels[lv] + 10) lv++;
                levels[lv] = o.x + o.bw / 2;
                o.level = lv;
            });
            const bhMax = Math.max(...pts.map(o => o.bhFull));
            const letterH = fs * 1.25;
            const step = bhMax + letterH + 10;              // écart vertical entre deux niveaux
            const tipY = cy - Math.max(2, fs / 14);          // pointe posée sur la droite
            const shaftBase = fs * 1.9;                      // longueur de la flèche au niveau 0

            // Deux calques : d'abord toutes les flèches, puis les lettres et cadres par-dessus,
            // pour qu'une grande flèche passe derrière le cadre d'une flèche voisine.
            const arrowsLayer = svgEl('g'), labelsLayer = svgEl('g');
            svg.appendChild(arrowsLayer); svg.appendChild(labelsLayer);
            pts.forEach(o => {
                const { p, x, bw } = o;
                const ga = svgEl('g'), g = svgEl('g');
                ga.style.cursor = 'pointer'; g.style.cursor = 'pointer';
                const topY = tipY - shaftBase - o.level * step;   // haut de la flèche

                // Flèche : tige + pointe (avec une zone de clic un peu plus large)
                const ah = Math.max(9, fs * 0.55), aw = Math.max(6, fs * 0.36);
                ga.appendChild(svgEl('rect', { x: x - aw - 4, y: topY, width: 2 * aw + 8, height: tipY - topY, fill: 'transparent' }));
                ga.appendChild(svgEl('line', { x1: x, x2: x, y1: topY, y2: tipY - ah + 1, stroke: color, 'stroke-width': Math.max(2.5, fs / 8), 'stroke-linecap': 'round' }));
                ga.appendChild(svgEl('polygon', { points: `${x},${tipY} ${x - aw},${tipY - ah} ${x + aw},${tipY - ah}`, fill: color }));

                // Lettre juste au-dessus de la flèche
                const lt = svgEl('text', { x, y: topY - 6, 'text-anchor': 'middle', 'font-size': fs * 1.1, 'font-weight': 800, fill: color, 'font-family': FONT, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' });
                lt.textContent = p.letter;
                g.appendChild(lt);

                // Cadre réponse au-dessus de la lettre
                const disp = p.revealed ? dispValue(p.v) : { text: '?' };
                const sz = dispSize(disp, fs);
                const bh = sz.h + 10;
                const bBottom = topY - letterH - 4;
                g.appendChild(svgEl('rect', {
                    x: x - bw / 2, y: bBottom - bh, width: bw, height: bh, rx: 8,
                    fill: p.revealed ? '#f5f3ff' : '#ffffff', stroke: color, 'stroke-width': 2,
                    'stroke-dasharray': p.revealed ? '' : '5 4',
                }));
                drawDisp(g, disp, x, bBottom - bh + 5, fs, p.revealed ? '#5b21b6' : '#a78bfa', 800, false);

                [ga, g].forEach(el => {
                    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        p.revealed = !p.revealed;
                        render(); renderControls(); save();
                    });
                });
                arrowsLayer.appendChild(ga);
                labelsLayer.appendChild(g);
            });
        }

        // ── Activité « Libre » ────────────────────────────────────────────
        function signedDisp(diff) {
            const d = dispValue(F(Math.abs(diff.n), diff.d));
            const sign = diff.n < 0 ? '−' : '+';
            if (d.text !== undefined) return { text: sign + d.text };
            return { text: undefined, n: d.n, d: d.d, whole: d.whole, neg: false, _sign: sign };
        }
        function renderLibre() {
            const { cy, fs } = geom;
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            // Bonds entre flèches successives : dessinés SOUS la droite, sous les nombres,
            // pour ne pas gêner les flèches et leurs cadres au-dessus.
            if (cfg.bonds && libreMarkers.length > 1) {
                const bondsG = svgEl('g', { 'pointer-events': 'none' });
                const base = cy + fs * 0.95 + (geom.gradH || 0) + 10;
                // pointillés reliant chaque graduation pointée au départ des bonds
                libreMarkers.forEach(m => {
                    const x = valueToX(m.v);
                    bondsG.appendChild(svgEl('line', { x1: x, x2: x, y1: cy + fs * 0.4, y2: base, stroke: '#94a3b8', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
                });
                // Profondeur de chaque bond : deux bonds qui se chevauchent ne sont pas
                // à la même profondeur, pour que leurs écarts écrits ne se superposent pas.
                const bondDepth = [];
                const depthEnds = [];   // pour chaque profondeur : liste des intervalles occupés
                for (let i = 1; i < libreMarkers.length; i++) {
                    const x1 = valueToX(libreMarkers[i - 1].v), x2 = valueToX(libreMarkers[i].v);
                    const lo = Math.min(x1, x2) - fs, hi = Math.max(x1, x2) + fs;
                    let lv = 0;
                    while (depthEnds[lv] && depthEnds[lv].some(([a, b]) => lo < b && hi > a)) lv++;
                    (depthEnds[lv] = depthEnds[lv] || []).push([lo, hi]);
                    bondDepth[i] = lv;
                }
                for (let i = 1; i < libreMarkers.length; i++) {
                    const a = libreMarkers[i - 1], b = libreMarkers[i];
                    const xa = valueToX(a.v), xb = valueToX(b.v);
                    if (Math.abs(xb - xa) < 2) continue;
                    const lift = fs * 1.1 + bondDepth[i] * fs * 1.9;
                    const mx = (xa + xb) / 2;
                    const ctrlY = base + lift * 1.35;
                    const color = fCmp(b.v, a.v) > 0 ? '#0d9488' : '#ea580c';
                    bondsG.appendChild(svgEl('path', { d: `M ${xa} ${base} Q ${mx} ${ctrlY} ${xb} ${base}`, fill: 'none', stroke: color, 'stroke-width': Math.max(2, fs / 9) }));
                    // pointe de flèche orientée selon la courbe
                    const tx = xb - mx, ty = base - ctrlY, tl = Math.hypot(tx, ty) || 1;
                    const ux = tx / tl, uy = ty / tl, ah = fs * 0.5;
                    const bx = xb - ux * ah, by = base - uy * ah;
                    bondsG.appendChild(svgEl('polygon', { points: `${xb},${base} ${bx - uy * ah * 0.45},${by + ux * ah * 0.45} ${bx + uy * ah * 0.45},${by - ux * ah * 0.45}`, fill: color }));
                    // écart, écrit sous le bond
                    const diff = fSub(b.v, a.v);
                    const d = signedDisp(diff);
                    const lbl = d.text !== undefined ? d : { neg: false, n: d.n, d: d.d };
                    const sz = dispSize(lbl, fs * 0.85);
                    const yTop = (base + ctrlY) / 2 + 4;
                    if (d.text === undefined) {
                        const st = svgEl('text', { x: mx - sz.w / 2 - fs * 0.3, y: yTop + sz.h / 2 + fs * 0.3, 'text-anchor': 'middle', 'font-size': fs * 0.85, 'font-weight': 800, fill: color, 'font-family': FONT, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' });
                        st.textContent = d._sign; bondsG.appendChild(st);
                    }
                    drawDisp(bondsG, lbl, mx, yTop, fs * 0.85, color, 800, true);
                }
                svg.appendChild(bondsG);
            }
            // Flèches : lettre = ordre dans lequel les points ont été placés
            drawArrows(libreMarkers.map((m, i) => ({
                x: valueToX(m.v),
                disp: cfg.showValues ? dispValue(m.v) : { text: letters[i % 26] },
                color: '#2563eb',
                marker: m, list: libreMarkers,
            })));
        }

        // ── Clic sur la droite (mode libre) ───────────────────────────────
        function onLineClick(e) {
            if (cfg.mode !== 'libre' || justDragged) return;
            const p = clientToSvg(e.clientX, e.clientY);
            if (!p) return;
            libreMarkers.push({ id: ++markerIdCounter, v: tick(xToK(p.x)) });
            render(); save();
        }

        // ── Déplacer / enlever un point déjà placé ────────────────────────
        function attachMarkerDrag(g, m, list, onRemove) {
            g.addEventListener('pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                e.stopPropagation(); e.preventDefault();
                let moved = false, away = false;
                const startX = e.clientX, startY = e.clientY;
                const startP = clientToSvg(startX, startY);
                const onMove = (ev) => {
                    if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
                    moved = true;
                    const p = clientToSvg(ev.clientX, ev.clientY);
                    if (!p || !startP) return;
                    // On enlève si on s'éloigne verticalement de l'endroit où on a attrapé
                    // (la flèche peut être attrapée par son cadre, loin au-dessus de la droite)
                    away = Math.abs(p.y - startP.y) > geom.fs * 4 || p.x < geom.pad - 30 || p.x > geom.W - geom.pad + 30;
                    if (!away) {
                        const v = tick(xToK(p.x));
                        if (fCmp(v, m.v) !== 0) { m.v = v; m.correct = undefined; resultMsg = { text: '', color: '' }; }
                    }
                    render();
                    // Aperçu : point transparent si on va l'enlever
                    if (away) svg.querySelectorAll(`[data-mid="${m.id}"]`).forEach(el => el.setAttribute('opacity', '0.3'));
                };
                const onUp = (ev) => {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.removeEventListener('pointercancel', onUp);
                    if (!moved && ev && ev.type === 'pointercancel') return;   // geste interrompu : on ne touche à rien
                    justDragged = true; setTimeout(() => { justDragged = false; }, 80);
                    if (!moved) {
                        // Simple clic sur une flèche déjà posée : on l'efface
                        const i = list.indexOf(m);
                        if (i >= 0) list.splice(i, 1);
                        if (onRemove) onRemove();
                        resultMsg = { text: '', color: '' };
                        renderTokens(); render(); renderControls(); save();
                    } else {
                        if (away) {
                            const i = list.indexOf(m);
                            if (i >= 0) list.splice(i, 1);
                            if (onRemove) onRemove();
                            resultMsg = { text: '', color: '' };
                            renderTokens();
                        }
                        render(); renderControls(); save();
                    }
                };
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
                document.addEventListener('pointercancel', onUp);
            });
        }

        // =========================================================================
        // ÉTIQUETTES À PLACER
        // =========================================================================
        function renderTokens() {
            tokensZone.innerHTML = '';
            if (cfg.mode !== 'placer') { tokensZone.style.display = 'none'; return; }
            tokensZone.style.display = 'flex';
            const label = document.createElement('div');
            label.className = 'dn-tokens-label';
            label.textContent = 'Fais glisser chaque nombre à sa place sur la droite';
            tokensZone.appendChild(label);
            if (tokens.length === 0) {
                const empty = document.createElement('span');
                empty.className = 'dn-tokens-empty';
                empty.textContent = 'Aucun nombre à placer pour l\'instant : cliquez sur « 🎲 Nouveaux nombres » ou écrivez-les dans ⚙ Réglages.';
                tokensZone.appendChild(empty);
                return;
            }
            tokens.forEach((tok, idx) => {
                const el = document.createElement('div');
                el.className = 'dn-token' + (tok.placed ? ' placed' : '');
                el.innerHTML = dispHTML(tok.disp);
                if (!tok.placed) setupTokenDrag(el, idx);
                tokensZone.appendChild(el);
            });
        }

        function setupTokenDrag(el, idx) {
            el.addEventListener('pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                e.stopPropagation(); e.preventDefault();
                el.classList.add('is-dragging');
                const ghost = document.createElement('div');
                ghost.className = 'dn-drag-ghost';
                ghost.innerHTML = dispHTML(tokens[idx].disp);
                document.body.appendChild(ghost);
                const moveGhost = (cx, cy) => { ghost.style.left = cx + 'px'; ghost.style.top = cy + 'px'; };
                moveGhost(e.clientX, e.clientY);

                const onMove = (ev) => {
                    moveGhost(ev.clientX, ev.clientY);
                    showDropPreview(clientToSvg(ev.clientX, ev.clientY));
                };
                const onUp = (ev) => {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    document.removeEventListener('pointercancel', onUp);
                    el.classList.remove('is-dragging');
                    ghost.remove();
                    showDropPreview(null);
                    const p = clientToSvg(ev.clientX, ev.clientY);
                    if (ev.type === 'pointerup' && nearLine(p)) {
                        placerMarkers.push({ id: ++markerIdCounter, v: tick(xToK(p.x)), tokenIdx: idx, correct: undefined });
                        tokens[idx].placed = true;
                        resultMsg = { text: '', color: '' };
                        renderTokens(); render(); renderControls(); save();
                    }
                };
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
                document.addEventListener('pointercancel', onUp);
            });
        }

        function showDropPreview(p) {
            const old = svg.querySelector('[data-role="preview"]');
            if (old) old.remove();
            const hit = svg.querySelector('[data-role="hit"]');
            const over = nearLine(p);
            if (hit) hit.setAttribute('fill', over ? 'rgba(37,99,235,0.07)' : 'transparent');
            if (!over) return;
            const x = kToX(xToK(p.x));
            const g = svgEl('g', { 'data-role': 'preview', 'pointer-events': 'none' });
            const fs = geom.fs, tipY = geom.cy - Math.max(2, fs / 14);
            const ah = Math.max(9, fs * 0.55), aw = Math.max(6, fs * 0.36);
            g.appendChild(svgEl('line', { x1: x, x2: x, y1: tipY - fs * 1.6, y2: tipY - ah + 1, stroke: '#f59e0b', 'stroke-width': Math.max(2.5, fs / 8), 'stroke-dasharray': '5 4', 'stroke-linecap': 'round' }));
            g.appendChild(svgEl('polygon', { points: `${x},${tipY} ${x - aw},${tipY - ah} ${x + aw},${tipY - ah}`, fill: '#f59e0b' }));
            svg.appendChild(g);
        }

        // =========================================================================
        // BARRE DU BAS (change selon l'activité)
        // =========================================================================
        function mkBtn(text, cls, onClick, title) {
            const b = document.createElement('button');
            b.className = 'dn-btn' + (cls ? ' ' + cls : '');
            b.textContent = text;
            if (title) b.title = title;
            b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
            return b;
        }
        function renderControls() {
            controls.innerHTML = '';
            if (cfg.mode === 'placer') {
                controls.appendChild(mkBtn('🎲 Nouveaux nombres', '', () => {
                    generateTokens(); renderAll(); save();
                }, 'Tirer au hasard de nouveaux nombres à placer'));
                controls.appendChild(mkBtn('✔ Vérifier', 'primary', checkPlacer));
                controls.appendChild(mkBtn(showSolution ? '🙈 Cacher la solution' : '👁 Voir la solution', showSolution ? 'on' : '', () => {
                    showSolution = !showSolution; render(); renderControls();
                }));
                controls.appendChild(mkBtn('↺ Recommencer', '', () => {
                    placerMarkers = []; tokens.forEach(t => t.placed = false);
                    showSolution = false; resultMsg = { text: '', color: '' };
                    renderAll(); save();
                }, 'Remettre toutes les étiquettes en bas'));
            } else if (cfg.mode === 'lire') {
                controls.appendChild(mkBtn('🎲 Nouveaux points', '', () => {
                    generateLire(); renderAll(); save();
                }));
                controls.appendChild(mkBtn('👁 Tout montrer', '', () => { lirePoints.forEach(p => p.revealed = true); render(); save(); }));
                controls.appendChild(mkBtn('🙈 Tout cacher', '', () => { lirePoints.forEach(p => p.revealed = false); render(); save(); }));
                const hint = document.createElement('span');
                hint.className = 'dn-hint';
                hint.textContent = lirePoints.length
                    ? 'Clique sur une flèche pour montrer ou cacher son nombre.'
                    : 'Aucune flèche : cliquez sur « 🎲 Nouveaux points » ou écrivez-les dans ⚙ Réglages.';
                controls.appendChild(hint);
            } else {
                controls.appendChild(mkBtn(cfg.showValues ? '🔢 Nombres affichés' : '🔤 Lettres affichées', cfg.showValues ? 'on' : '', () => {
                    cfg.showValues = !cfg.showValues; render(); renderControls(); save();
                }, 'Écrire le nombre de chaque flèche, ou seulement une lettre'));
                controls.appendChild(mkBtn('↪ Bonds', cfg.bonds ? 'on' : '', () => {
                    cfg.bonds = !cfg.bonds; render(); renderControls(); save();
                }, 'Montrer l\'écart entre deux flèches posées l\'une après l\'autre'));
                controls.appendChild(mkBtn('↶ Annuler', '', () => {
                    libreMarkers.pop(); render(); save();
                }, 'Enlever la dernière flèche posée'));
                controls.appendChild(mkBtn('↺ Tout effacer', '', () => {
                    libreMarkers = []; render(); save();
                }));
                const hint = document.createElement('span');
                hint.className = 'dn-hint';
                hint.textContent = 'Clique sur la droite pour poser une flèche ; reclique dessus pour l\'effacer.';
                controls.appendChild(hint);
            }
            if (resultMsg.text) {
                const r = document.createElement('span');
                r.className = 'dn-result-text';
                r.style.color = resultMsg.color;
                r.textContent = resultMsg.text;
                controls.appendChild(r);
            }
        }

        function checkPlacer() {
            if (tokens.length === 0) {
                resultMsg = { text: '⚠️ Il n\'y a aucun nombre à placer.', color: '#b45309' };
            } else if (placerMarkers.length === 0) {
                resultMsg = { text: '⚠️ Aucun nombre n\'est encore placé.', color: '#b45309' };
            } else {
                const tol = fNum(G.fine) / 2 + 1e-9;
                let ok = 0, ko = 0;
                placerMarkers.forEach(m => {
                    const t = tokens[m.tokenIdx];
                    m.correct = !!t && Math.abs(fNum(m.v) - fNum(t.v)) <= tol;
                    if (m.correct) ok++; else ko++;
                });
                const reste = tokens.filter(t => !t.placed).length;
                const s = (n) => n > 1 ? 's' : '';
                if (ko === 0 && reste === 0) resultMsg = { text: `✅ Bravo ! Les ${ok} nombres sont bien placés.`, color: '#16a34a' };
                else if (ko === 0) resultMsg = { text: `👍 ${ok} bien placé${s(ok)}. Il en reste ${reste} à placer.`, color: '#16a34a' };
                else resultMsg = { text: `${ok} bien placé${s(ok)}, ${ko} à corriger (flèches rouges)` + (reste ? `, ${reste} à placer.` : '.'), color: '#dc2626' };
            }
            render(); renderControls();
        }

        // =========================================================================
        // PANNEAU RÉGLAGES
        // =========================================================================
        function syncPanel() {
            typeSeg.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.v === cfg.type));
            modesSeg.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.v === cfg.mode));
            simplifyWrap.style.display = cfg.type === 'fractions' ? '' : 'none';
            inSimplify.checked = !!cfg.simplify;
            inDebut.value = cfg.debut; inFin.value = cfg.fin; inPas.value = cfg.pas; inParts.value = cfg.parts;
            selLabels.value = cfg.labels;
            inTokens.value = cfg.tokensStr; inLire.value = cfg.lireStr; inCount.value = cfg.count; inCount2.value = cfg.countLire;
            paramsPanel.querySelectorAll('[data-show]').forEach(row => {
                row.hidden = !row.dataset.show.split(' ').includes(cfg.mode);
            });
        }
        function renderNotes() {
            const notes = gridNotes.slice();
            if (cfg.mode === 'placer') {
                tokenErrors.forEach(t => notes.push({ c: 'warn', t: `« ${t} » n'est pas un nombre reconnu : il est ignoré.` }));
                tokens.forEach(t => {
                    if (!inRange(t.v)) notes.push({ c: 'warn', t: `${dispPlain(t.disp)} est en dehors de la droite.` });
                    else if (fDiv(fSub(t.v, G.deb), G.fine).d !== 1) notes.push({ c: 'info', t: `${dispPlain(t.disp)} ne tombe pas sur une graduation : la graduation la plus proche sera acceptée.` });
                });
            }
            if (cfg.mode === 'lire') {
                lireErrors.forEach(t => notes.push({ c: 'warn', t: `« ${t} » n'est pas un nombre reconnu : il est ignoré.` }));
                lirePoints.forEach(p => { if (!inRange(p.v)) notes.push({ c: 'warn', t: `Le point ${p.letter} est en dehors de la droite.` }); });
            }
            notesEl.innerHTML = notes.map(n => `<div class="${n.c}">${n.c === 'warn' ? '⚠ ' : 'ℹ '}${escapeHTML(n.t)}</div>`).join('');
        }
        function renderAll() {
            syncPanel(); renderNotes(); renderTokens(); render(); renderControls();
        }

        // Frappe dans les champs : mise à jour après une courte pause
        let debounceT = null;
        const later = (fn) => { clearTimeout(debounceT); debounceT = setTimeout(fn, 350); };

        [[inDebut, 'debut'], [inFin, 'fin'], [inPas, 'pas'], [inParts, 'parts']].forEach(([el, key]) => {
            el.addEventListener('input', () => later(() => {
                cfg[key] = key === 'parts' ? (parseInt(el.value, 10) || 1) : el.value;
                onGridChanged();
                renderNotes(); renderTokens(); render(); renderControls(); save();
            }));
        });
        inTokens.addEventListener('input', () => later(() => {
            cfg.tokensStr = inTokens.value; parseTokens();
            renderNotes(); renderTokens(); render(); renderControls(); save();
        }));
        inLire.addEventListener('input', () => later(() => {
            cfg.lireStr = inLire.value; parseLire();
            renderNotes(); render(); renderControls(); save();
        }));
        inCount.addEventListener('input', () => {
            const n = parseInt(inCount.value, 10);
            if (!isNaN(n)) { cfg.count = Math.max(1, Math.min(12, n)); save(); }
        });
        inCount2.addEventListener('input', () => {
            const n = parseInt(inCount2.value, 10);
            if (!isNaN(n)) { cfg.countLire = Math.max(1, Math.min(8, n)); save(); }
        });
        selLabels.addEventListener('change', () => { cfg.labels = selLabels.value; render(); save(); });
        inSimplify.addEventListener('change', () => { cfg.simplify = inSimplify.checked; renderNotes(); render(); save(); });
        typeSeg.addEventListener('click', (e) => {
            const b = e.target.closest('button'); if (!b) return;
            cfg.type = b.dataset.v;
            computeGrid(); renderAll(); save();
        });
        paramsPanel.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = PRESETS.find(x => x.id === btn.dataset.preset);
                if (!p) return;
                Object.assign(cfg, { type: p.type, debut: p.debut, fin: p.fin, pas: p.pas, parts: p.parts, labels: p.labels });
                onGridChanged();
                libreMarkers = [];
                generateTokens();
                generateLire();
                renderAll(); save();
            });
        });
        P('genTokens').addEventListener('click', () => { generateTokens(); renderAll(); save(); });
        P('genLire').addEventListener('click', () => { generateLire(); renderAll(); save(); });
        // Les touches tapées dans le panneau ne doivent pas déclencher les raccourcis du tableau
        paramsPanel.addEventListener('keydown', (e) => e.stopPropagation());

        modesSeg.addEventListener('click', (e) => {
            const b = e.target.closest('button'); if (!b) return;
            e.stopPropagation();
            cfg.mode = b.dataset.v;
            if (cfg.mode === 'placer' && tokens.length === 0) generateTokens();
            if (cfg.mode === 'lire' && lirePoints.length === 0) generateLire();
            resultMsg = { text: '', color: '' };
            renderAll(); save();
        });

        // ── Événements header ─────────────────────────────────────────────
        let helpVisible = false;
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpVisible = !helpVisible;
            helpPopup.classList.toggle('show', helpVisible);
            helpBtn.classList.toggle('active', helpVisible);
        });
        document.addEventListener('pointerdown', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) {
                helpVisible = false;
                helpPopup.classList.remove('show');
                helpBtn.classList.remove('active');
            }
        });

        let paramsVisible = false;
        paramsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            paramsVisible = !paramsVisible;
            paramsPanel.classList.toggle('show', paramsVisible);
            paramsBtn.classList.toggle('active', paramsVisible);
        });

        // ── Bouton Réduire ────────────────────────────────────────────────
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window._wfMiniBarCollapse(widget, '📏 Droite numérique', { onExpand: () => setTimeout(render, 50) });
        });

        // ── Bouton Plein écran ─────────────────────────────────────────────
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('wf-fullboard');
            save();
            setTimeout(render, 50);
        });

        // ── Bouton Fermer ─────────────────────────────────────────────────
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            save();
        });

        // ── Drag de l'en-tête (déplacer le widget) ────────────────────────
        header.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button, input, select')) return;
            e.preventDefault(); e.stopPropagation();
            header.setPointerCapture(e.pointerId);
            const startX = e.clientX - widget.offsetLeft;
            const startY = e.clientY - widget.offsetTop;
            const onMove = (ev) => {
                widget.style.left = Math.max(0, ev.clientX - startX) + 'px';
                widget.style.top  = Math.max(0, ev.clientY - startY) + 'px';
            };
            const onUp = () => {
                header.removeEventListener('pointermove', onMove);
                header.removeEventListener('pointerup', onUp);
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                save();
            };
            header.addEventListener('pointermove', onMove);
            header.addEventListener('pointerup', onUp);
        });

        // ── Resize handle ─────────────────────────────────────────────────
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            const onMove = (ev) => {
                const newW = Math.max(520, startW + ev.clientX - startX);
                const newH = Math.max(300, startH + ev.clientY - startY);
                container.style.width  = newW + 'px';
                container.style.height = newH + 'px';
                render();
            };
            const onUp = () => {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup', onUp);
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
                widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
                save();
            };
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup', onUp);
        });

        // ── Redessiner quand la taille change ─────────────────────────────
        let roEnabled = false;
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => { if (roEnabled) render(); });
            ro.observe(svgWrap);
        }

        // =========================================================================
        // DONNÉES GET / SET (pour save-load.js)
        // =========================================================================
        widget._dnGetData = function() {
            return {
                version: 2,
                config: Object.assign({}, cfg),
                placer: placerMarkers.map(m => ({ id: m.id, v: fStr(m.v), tokenIdx: m.tokenIdx, correct: m.correct })),
                libre: libreMarkers.map(m => ({ id: m.id, v: fStr(m.v) })),
                lireRevealed: lirePoints.map(p => !!p.revealed),
                markerIdCounter,
                containerW: container.offsetWidth,
                containerH: container.offsetHeight,
                fullboard: container.classList.contains('wf-fullboard')
            };
        };

        widget._dnSetData = function(data) {
            if (!data) return;
            let placerSaved = [], libreSaved = [];
            if (data.version === 2) {
                Object.assign(cfg, data.config || {});
                placerSaved = (data.placer || []).map(m => Object.assign({}, m, { v: fFromStr(m.v) }));
                libreSaved  = (data.libre  || []).map(m => Object.assign({}, m, { v: fFromStr(m.v) }));
            } else {
                // ── Ancienne version : conversion ──
                const c = data.config || {};
                const num = (x, def) => (x === undefined || x === null || x === '') ? def : String(x).replace('.', ',');
                cfg.type  = ['entiers', 'decimaux', 'fractions'].includes(c.typeNombre) ? c.typeNombre : 'entiers';
                cfg.debut = num(c.min, '0');
                cfg.fin   = num(c.max, '10');
                cfg.pas   = num(c.pas, '1');
                cfg.parts = (parseInt(c.subdivisions, 10) || 0) + 1;
                if (cfg.type === 'fractions' && !(parseInt(c.subdivisions, 10) > 0) && Number(c.pas) === 1) cfg.parts = parseInt(c.fracDen, 10) || 4;
                cfg.tokensStr = splitList(c.tokensStr || '').join(' ; ');
                cfg.mode = c.mode === 'libre' ? 'libre' : 'placer';
                (data.markers || []).forEach(m => {
                    if (typeof m.value !== 'number') return;
                    const v = fFromNumber(m.value);
                    if (m.tokenIdx !== null && m.tokenIdx !== undefined) placerSaved.push({ id: m.id, v, tokenIdx: m.tokenIdx });
                    else libreSaved.push({ id: m.id, v });
                });
            }
            computeGrid();
            parseTokens();
            parseLire();
            placerMarkers = placerSaved.filter(m => m.v && tokens[m.tokenIdx] && !tokens[m.tokenIdx].placed);
            placerMarkers.forEach(m => { tokens[m.tokenIdx].placed = true; });
            libreMarkers = libreSaved.filter(m => m.v);
            (data.lireRevealed || []).forEach((r, i) => { if (lirePoints[i]) lirePoints[i].revealed = !!r; });
            markerIdCounter = Math.max(data.markerIdCounter || 0, ...placerMarkers.map(m => m.id || 0), ...libreMarkers.map(m => m.id || 0));
            if (data.fullboard) container.classList.add('wf-fullboard');
            renderAll();
        };

        // ── Initialisation ─────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
            if (!container.style.height) container.style.height = '640px';

            if (savedData) {
                widget._dnSetData(savedData);
            } else {
                // Nouveau widget : ouvert à 100px du bord gauche, avec des nombres prêts à placer
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
                cfg.labels = 'debut';   // seuls 0 et 1 sont écrits : placer les entiers a du sens
                computeGrid();
                generateTokens();
                generateLire();
                renderAll();
            }
            // Activer le ResizeObserver seulement après le premier rendu complet
            requestAnimationFrame(() => { roEnabled = true; });
        }));
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function(type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'droite-num') {
                // Consommer les données de restauration posées juste avant l'appel
                const pending = window._dnNextPendingData || null;
                initDroiteNumWidget(widget, pending);
            }
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function(type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'droite-num') {
                        const pending = window._dnNextPendingData || null;
                        initDroiteNumWidget(widget, pending);
                    }
                    return widget;
                };
            }
        });
    }

})();
