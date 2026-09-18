// =========================================================================
// WIDGET JEU TAUPE DES TABLES 🐹 — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-tables-taupe'.
// Design repris de widget-jeu-tables-multi.js (thème clair, redimensionnement
// libre, barre d'édition avec aide, réduire, plein écran board, fermer).
//
// Principe : façon "Taupe qui sort du trou" (whack-a-mole). Une opération
// s'affiche en haut (ex. "7 × 8 = ?") puis des taupes surgissent une par
// une (avec un léger décalage) dans des trous répartis sur la pelouse,
// chacune portant un nombre. L'élève doit taper sur la taupe qui porte le
// bon résultat avant qu'elle ne redescende dans son trou.
// Bonne taupe tapée = point + nouvelle question. Mauvaise taupe tapée =
// perte d'une vie. Si aucune taupe correcte n'est tapée à temps, une
// nouvelle question arrive et une vie est aussi perdue.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-tables-taupe.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-tables-taupe');toggleJeuxPanel()">
//          ...
//      </div>
// =========================================================================

(function () {

    // ── Fonction utilitaire mini-barre collapse (partagée, déjà injectée par
    //    un autre widget-jeu — on ne la redéfinit pas si elle existe déjà) ──
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

    // ── CSS boutons fenêtre (partagée — déjà injectée par d'autres widgets) ──
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

    // ── CSS spécifique au widget ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-tables-taupe-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tables-taupe-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-tables-taupe"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal (thème clair) ── */
        .jtt-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 860px;
            min-width: 620px;
            min-height: 520px;
            color: #374151;
        }

        /* ── État plein écran ── */
        .jtt-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── État plein écran, adapté au téléphone ──
           Le padding-left de 52px (pensé pour dégager les onglets
           latéraux desktop) prend trop de place sur un petit écran, mais
           il en faut quand même un peu : les onglets latéraux (Jeux,
           Activités, etc. — voir style-phone.css) débordent d'environ
           33px sur le bord gauche de l'écran même en fullboard, il ne
           faut donc pas descendre en dessous pour ne pas les recouvrir. */
        .jtt-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jtt-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jtt-title {
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 15px;
            font-weight: 800;
            color: #7a4a10;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
            text-shadow: 0 1px 0 #fff, 0 2px 2px rgba(0,0,0,0.12);
        }

        /* ── Boutons paramètres / aide ── */
        .jtt-params-btn, .jtt-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
            touch-action: manipulation;
        }
        .jtt-params-btn:hover, .jtt-help-btn:hover { background: #e0e0e0; color: #333; }
        .jtt-params-btn.active { background: #a9631a; color: white; border-color: #8a4f14; }

        /* ── Popup aide ── */
        .jtt-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jtt-help-popup.show { display: block; }
        .jtt-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jtt-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jtt-params-panel.show { display: flex; }
        .jtt-params-title {
            font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px;
        }
        .jtt-params-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .jtt-table-check {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            border: 1.5px solid transparent;
            background: #f3e6d6; color: #7a4a10;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            transition: all .15s;
            user-select: none;
            touch-action: manipulation;
        }
        .jtt-table-check input[type=checkbox] { display: none; }
        .jtt-table-check.checked { border-color: currentColor; }
        .jtt-table-check:not(.checked) { opacity: 0.4; }
        .jtt-table-check:hover { opacity: 1; }

        .jtt-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .jtt-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jtt-speed-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white; color: #374151;
        }
        .jtt-speed-select:focus { border-color: #a9631a; }

        /* ── HUD (score / vies) ── */
        .jtt-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            padding: 0 2px;
            gap: 8px;
        }
        .jtt-score {
            font-size: 13px;
            font-weight: 800;
            color: #ffe28a;
            background: linear-gradient(180deg, #4a3420 0%, #2c1e10 100%);
            border: 1.5px solid #1a1109;
            border-radius: 20px;
            padding: 4px 12px;
            box-shadow: inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 3px rgba(0,0,0,0.2);
        }
        .jtt-timer {
            font-variant-numeric: tabular-nums;
            font-size: 13px;
            font-weight: 800;
            color: #fff;
            background: linear-gradient(180deg, #e15b4f 0%, #b83a30 100%);
            border: 1.5px solid #8a2a22;
            border-radius: 20px;
            padding: 4px 12px;
            box-shadow: inset 0 1px 2px rgba(255,255,255,0.25), 0 2px 3px rgba(0,0,0,0.2);
        }
        .jtt-lives { letter-spacing: 2px; font-size: 15px; transition: transform .15s; }
        .jtt-lives.jtt-lives-flash { animation: jtt-lives-flash .5s ease; }
        @keyframes jtt-lives-flash {
            0%, 100% { transform: scale(1); }
            35% { transform: scale(1.35); }
        }

        /* ── Ligne opération courante ── */
        .jtt-op-row { text-align: center; flex-shrink: 0; }
        .jtt-round-bar {
            margin-top: 5px;
            width: 100%;
            height: 6px;
            border-radius: 4px;
            background: #e5e7eb;
            border: 1px solid #d1d5db;
            overflow: hidden;
        }
        .jtt-round-bar-fill {
            height: 100%;
            width: 100%;
            border-radius: 4px;
            background: linear-gradient(90deg, #e8a23c, #e0563f);
        }
        .jtt-op {
            display: inline-block;
            font-size: var(--jtt-op-fs, 20px);
            font-weight: 900;
            color: #8a5a00;
            font-family: 'Marelle', 'Courier New', monospace;
            letter-spacing: 1px;
            background: #fff3cf;
            border: 1.5px solid #f4dc9a;
            border-radius: 8px;
            padding: 2px 12px;
            transition: background .15s, border-color .15s, color .15s;
        }
        .jtt-op.jtt-op-missed {
            background: #fde0de;
            border-color: #e5837a;
            color: #a23b30;
        }

        /* ── Espace de jeu (pelouse + trous) ── */
        .jtt-space {
            flex: 1;
            min-height: 160px;
            position: relative;
            border-radius: 12px;
            background: linear-gradient(180deg, #bfe6f7 0%, #bfe6f7 16%, #eaf7d0 40%, #cdeaa0 68%, #a3d977 100%);
            border: 1.5px solid #8fbf5f;
            overflow: hidden;
            padding: 34px 14px 14px;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 14px 10px;
            touch-action: manipulation;
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 100 100'><g transform='rotate(-35 40 25)'><rect x='34' y='38' width='13' height='55' rx='6' fill='%23a9713c' stroke='%235b3a1e' stroke-width='2'/><rect x='37' y='44' width='3' height='43' rx='1.5' fill='%23c99a5b' opacity='0.55'/><rect x='33' y='33' width='15' height='10' rx='3' fill='%235b3a1e'/><rect x='7' y='10' width='67' height='30' rx='15' fill='%23e5392b' stroke='%237a1810' stroke-width='2.5'/><ellipse cx='36' cy='18' rx='25' ry='5.5' fill='%23ffffff' opacity='0.35'/><rect x='7' y='10' width='67' height='30' rx='15' fill='none' stroke='%23b52a1f' stroke-width='1' opacity='0.4'/></g></svg>") 15 39, pointer;
        }
        .jtt-space::before {
            content: '';
            position: absolute;
            top: 6%; left: 8%;
            width: 70px; height: 22px;
            background: radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 72%);
            border-radius: 50%;
            pointer-events: none;
        }
        .jtt-space::after {
            content: '';
            position: absolute;
            top: 3%; right: 14%;
            width: 46px; height: 16px;
            background: radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 72%);
            border-radius: 50%;
            pointer-events: none;
        }

        /* ── Trou / monticule ── */
        .jtt-hole {
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            overflow: visible;
            background-image:
                radial-gradient(ellipse 10px 6px at 22% 62%, #6fa843 0%, transparent 75%),
                radial-gradient(ellipse 8px 5px at 78% 58%, #6fa843 0%, transparent 75%),
                radial-gradient(ellipse 9px 5px at 30% 70%, #7fb84f 0%, transparent 75%),
                radial-gradient(ellipse 9px 5px at 72% 72%, #7fb84f 0%, transparent 75%);
        }
        .jtt-hole::before {
            content: '';
            position: absolute;
            left: 50%; bottom: 6%;
            width: 80%; height: 44%;
            transform: translateX(-50%);
            border-radius: 50%;
            background: radial-gradient(ellipse at 50% 38%, #7c4f28 0%, #6b4423 55%, #4e3119 100%);
            box-shadow: inset 0 5px 8px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(255,255,255,0.10);
        }
        .jtt-hole::after {
            content: '';
            position: absolute;
            left: 50%; bottom: 9%;
            width: 58%; height: 24%;
            transform: translateX(-50%);
            border-radius: 50%;
            background: radial-gradient(ellipse at 50% 28%, #000000 0%, #1c0f06 55%, #3a2410 100%);
            box-shadow: inset 0 4px 6px rgba(0,0,0,0.7);
        }

        /* ── Taupe ── */
        .jtt-mole {
            position: absolute;
            left: 50%; bottom: 10%;
            width: 58%; height: 58%;
            max-width: 72px; max-height: 72px;
            transform: translateX(-50%) translateY(65%) scale(0.7);
            opacity: 0;
            transition: transform .22s cubic-bezier(.34,1.4,.64,1), opacity .2s ease;
            z-index: 4;
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 100 100'><g transform='rotate(-35 40 25)'><rect x='34' y='38' width='13' height='55' rx='6' fill='%23a9713c' stroke='%235b3a1e' stroke-width='2'/><rect x='37' y='44' width='3' height='43' rx='1.5' fill='%23c99a5b' opacity='0.55'/><rect x='33' y='33' width='15' height='10' rx='3' fill='%235b3a1e'/><rect x='7' y='10' width='67' height='30' rx='15' fill='%23e5392b' stroke='%237a1810' stroke-width='2.5'/><ellipse cx='36' cy='18' rx='25' ry='5.5' fill='%23ffffff' opacity='0.35'/><rect x='7' y='10' width='67' height='30' rx='15' fill='none' stroke='%23b52a1f' stroke-width='1' opacity='0.4'/></g></svg>") 15 39, pointer;
        }
        .jtt-mole.up { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        .jtt-mole.down { transform: translateX(-50%) translateY(65%) scale(0.7); opacity: 0; }
        .jtt-mole.bonk-correct { animation: jtt-bonk-correct .5s ease; }
        .jtt-mole.bonk-wrong { animation: jtt-bonk-wrong .55s ease; }
        .jtt-mole.bonk-wrong .jtt-mole-sign {
            border-color: #d94a3a;
            box-shadow: 0 0 0 3px rgba(217,74,58,0.35), 0 3px 5px rgba(0,0,0,0.3);
        }
        .jtt-mole-wrong-badge {
            position: absolute;
            left: 50%; top: 34%;
            width: 62%; height: 62%;
            transform: translate(-50%, -50%) scale(0.3);
            border-radius: 50%;
            background: rgba(214,54,42,0.92);
            border: 2px solid #fff;
            color: #fff;
            font-weight: 900;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5em;
            opacity: 0;
            z-index: 8;
            pointer-events: none;
            animation: jtt-wrong-badge-pop .5s ease forwards;
        }
        @keyframes jtt-wrong-badge-pop {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
            50%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .jtt-mole.jtt-mole-reveal {
            animation: jtt-reveal-pulse .9s ease;
            z-index: 7;
        }
        .jtt-mole.jtt-mole-reveal .jtt-mole-sign {
            border-color: #d94a3a;
            box-shadow: 0 0 0 3px rgba(217,74,58,0.35), 0 3px 5px rgba(0,0,0,0.3);
        }
        @keyframes jtt-reveal-pulse {
            0%   { filter: brightness(1);   transform: translateX(-50%) translateY(0) scale(1); }
            15%  { filter: brightness(1.35) saturate(1.3); transform: translateX(-50%) translateY(0) scale(1.14); }
            35%  { filter: brightness(1);   transform: translateX(-50%) translateY(0) scale(1); }
            55%  { filter: brightness(1.35) saturate(1.3); transform: translateX(-50%) translateY(0) scale(1.14); }
            75%  { filter: brightness(1);   transform: translateX(-50%) translateY(0) scale(1); }
            100% { filter: brightness(1);   transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes jtt-bonk-correct {
            0% { filter: brightness(1); }
            30% { filter: brightness(1.5) saturate(1.4); transform: translateX(-50%) translateY(0) scale(1.18); }
            100% { filter: brightness(1); }
        }
        @keyframes jtt-bonk-wrong {
            0%, 100% { transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); filter: brightness(1); }
            25% { transform: translateX(-58%) translateY(0) scale(0.92) rotate(-6deg); filter: brightness(0.7) saturate(1.6); }
            75% { transform: translateX(-42%) translateY(0) scale(0.92) rotate(6deg); filter: brightness(0.7) saturate(1.6); }
        }

        /* ── Corps de la taupe ── */
        .jtt-mole-body {
            position: absolute;
            left: 0; bottom: 0;
            width: 100%; height: 82%;
            border-radius: 50% 50% 44% 44%;
            background-image:
                radial-gradient(circle at 32% 24%, rgba(255,255,255,0.4) 0%, transparent 45%),
                linear-gradient(155deg, #c49a71 0%, #8a5f3d 55%, #6b4626 100%);
            box-shadow: 0 4px 8px rgba(0,0,0,0.28), inset 0 -3px 4px rgba(0,0,0,0.2), inset 0 2px 3px rgba(255,255,255,0.3);
        }
        .jtt-mole-ear {
            position: absolute;
            top: -6%;
            width: 24%; height: 24%;
            border-radius: 50%;
            background: linear-gradient(155deg, #c49a71 0%, #8a5f3d 100%);
            box-shadow: inset 0 -2px 3px rgba(0,0,0,0.2);
            z-index: 1;
        }
        .jtt-mole-ear-l { left: 4%; }
        .jtt-mole-ear-r { right: 4%; }
        .jtt-mole-muzzle {
            position: absolute;
            left: 50%; bottom: 14%;
            width: 52%; height: 40%;
            transform: translateX(-50%);
            border-radius: 50%;
            background: linear-gradient(165deg, #f3e2c8 0%, #e0c294 100%);
            z-index: 2;
        }
        .jtt-mole-nose {
            position: absolute;
            left: 50%; bottom: 40%;
            width: 15%; height: 12%;
            transform: translateX(-50%);
            border-radius: 50%;
            background: radial-gradient(circle at 35% 30%, #ffb3c6 0%, #e8577d 70%, #c23b60 100%);
            box-shadow: 0 1px 2px rgba(0,0,0,0.25);
            z-index: 3;
        }
        .jtt-mole-eye {
            position: absolute;
            top: 26%;
            width: 22%; height: 22%;
            border-radius: 50%;
            background: #fff;
            box-shadow: inset 0 0 0 2px #1a2e20, 0 1px 2px rgba(0,0,0,0.2);
            z-index: 3;
            display: flex; align-items: center; justify-content: center;
        }
        .jtt-mole-eye-l { left: 8%; }
        .jtt-mole-eye-r { right: 8%; }
        .jtt-mole-pupil {
            width: 46%; height: 46%;
            border-radius: 50%;
            background: #2b1a10;
        }
        .jtt-mole-hand {
            position: absolute;
            top: -20%;
            width: 26%; height: 26%;
            border-radius: 50%;
            background: linear-gradient(155deg, #c49a71 0%, #8a5f3d 100%);
            box-shadow: 0 1px 3px rgba(0,0,0,0.25), inset 0 -2px 2px rgba(0,0,0,0.15);
            z-index: 5;
        }
        .jtt-mole-hand-l { left: -2%; }
        .jtt-mole-hand-r { right: -2%; }

        /* ── Pancarte tenue par la taupe ── */
        .jtt-mole-sign {
            position: absolute;
            left: 50%; top: -46%;
            transform: translateX(-50%);
            min-width: 118%;
            padding: 3px 7px;
            box-sizing: border-box;
            background: linear-gradient(160deg, #f6dfae 0%, #e0b978 55%, #cfa05c 100%);
            border: 2px solid #8a5a2b;
            border-radius: 7px;
            box-shadow: 0 3px 5px rgba(0,0,0,0.3);
            text-align: center;
            z-index: 6;
            white-space: nowrap;
        }
        .jtt-mole-sign::before {
            content: '';
            position: absolute;
            left: 20%;
            bottom: -14%;
            width: 3px; height: 16%;
            background: #6b4423;
        }
        .jtt-mole-sign::after {
            content: '';
            position: absolute;
            right: 20%;
            bottom: -14%;
            width: 3px; height: 16%;
            background: #6b4423;
        }
        .jtt-mole-value {
            font-family: 'Marelle', 'Courier New', monospace;
            font-weight: 900;
            color: #5c3a12;
            font-size: var(--jtt-mole-fs, 15px);
            letter-spacing: 0.5px;
        }

        /* ── Overlay démarrage / fin de partie ── */
        .jtt-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(1px);
            z-index: 10;
            text-align: center;
            padding: 10px;
        }
        .jtt-overlay.hidden { display: none; }
        .jtt-overlay-title {
            font-size: 18px; font-weight: 800; color: #374151;
        }
        .jtt-overlay-sub {
            font-size: 13px; color: #6b7280;
            max-width: 90%;
        }
        .jtt-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #a9631a; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
            box-shadow: 0 0 14px rgba(169,99,26,0.5);
            touch-action: manipulation;
        }
        .jtt-start-btn:hover { background: #8a4f14; }
        .jtt-start-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jtt-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jtt-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
            touch-action: manipulation;
        }
        .jtt-btn:active { transform: scale(0.96); }
        .jtt-btn-reset { background: #6b7280; color: white; }
        .jtt-btn-reset:hover { background: #4b5563; }
        .jtt-btn-pause { background: #a9631a; color: white; }
        .jtt-btn-pause:hover { background: #8a4f14; }

        /* ── Poignée resize ── */
        .jtt-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jtt-container:hover .jtt-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-tables-taupe';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jtt-container">

  <!-- En-tête -->
  <div class="jtt-header">
    <span class="jtt-title">🐹 Taupe des tables</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jtt-params-btn" title="Paramètres">⚙</button>
      <button class="jtt-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jtt-params-panel">
    <div class="jtt-params-title">Tables à réviser :</div>
    <div class="jtt-params-grid"></div>
    <div class="jtt-params-row">
      <label>Vitesse :</label>
      <select class="jtt-speed-select">
        <option value="5000">🐢 Facile</option>
        <option value="4000" selected>🚶 Moyen</option>
        <option value="3000">🚀 Rapide</option>
        <option value="2000">🔥 Extrême</option>
        <option value="progressive">⚡ Progressif (accélère toutes les 10 bonnes réponses)</option>
      </select>
    </div>
  </div>

  <!-- HUD -->
  <div class="jtt-hud">
    <span class="jtt-score">⭐ Score : 0</span>
    <span class="jtt-timer">⏱️ 00:00</span>
    <span class="jtt-lives">❤️❤️❤️</span>
  </div>
  <div class="jtt-op-row">
    <span class="jtt-op">❓ …</span>
    <div class="jtt-round-bar"><div class="jtt-round-bar-fill"></div></div>
  </div>

  <!-- Espace de jeu -->
  <div class="jtt-space">
    <div class="jtt-overlay">
      <div class="jtt-overlay-title">🐹 Taupe des tables</div>
      <div class="jtt-overlay-sub">Tape sur la taupe qui porte le bon résultat avant qu'elle ne redescende dans son trou !</div>
      <button class="jtt-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jtt-controls">
    <button class="jtt-btn jtt-btn-reset">🔄 Réinitialiser</button>
    <button class="jtt-btn jtt-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jtt-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Tables à réviser</b> — Coche ou décoche les tables (de 2 à 9 ; les tables du 0 et du 1 ne sont pas proposées) que tu veux voir apparaître dans le jeu.</p>
    <p style="margin:0 0 10px"><b>Vitesse</b> — Choisis la durée pendant laquelle chaque taupe reste sortie de son trou : Facile, Moyen, Rapide, Extrême, ou <b>Progressif</b> (le temps se réduit automatiquement toutes les 10 bonnes réponses).</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Une opération s'affiche en haut (ex. 7 × 8 = ?). Plusieurs taupes surgissent l'une après l'autre dans les trous, chacune portant un nombre. Tape (clique) sur la taupe qui porte le <b>bon résultat</b> avant qu'elle ne redescende.</p>
    <p style="margin:0 0 6px">Taper la bonne taupe rapporte un point et fait apparaître une nouvelle opération. Taper une mauvaise taupe affiche une croix ✗ et fait perdre une vie ❤️. Si aucune taupe correcte n'est tapée à temps, elle reste affichée quelques instants pour te montrer où elle était, une vie ❤️ est perdue aussi, puis une nouvelle opération arrive. Un chrono ⏱️ affiche le temps écoulé depuis le début de la partie.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">La partie se termine quand les 3 vies sont perdues. Clique sur <b>🔄 Réinitialiser</b> pour rejouer.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jtt-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuTablesTaupeWidget = function (widget) {

        const container    = widget.querySelector('.jtt-container');
        const paramsBtn     = widget.querySelector('.jtt-params-btn');
        const paramsPanel   = widget.querySelector('.jtt-params-panel');
        const paramsGrid    = widget.querySelector('.jtt-params-grid');
        const speedSelect   = widget.querySelector('.jtt-speed-select');
        const helpBtn       = widget.querySelector('.jtt-help-btn');
        const helpPopup     = widget.querySelector('.jtt-help-popup');
        const resizeHandle  = widget.querySelector('.jtt-resize-handle');
        const scoreEl       = widget.querySelector('.jtt-score');
        const timerEl       = widget.querySelector('.jtt-timer');
        const livesEl       = widget.querySelector('.jtt-lives');
        const opEl          = widget.querySelector('.jtt-op');
        const roundBarFill  = widget.querySelector('.jtt-round-bar-fill');
        const space         = widget.querySelector('.jtt-space');
        const overlay       = widget.querySelector('.jtt-overlay');
        const overlayTitle  = widget.querySelector('.jtt-overlay-title');
        const overlaySub    = widget.querySelector('.jtt-overlay-sub');
        const startBtn      = widget.querySelector('.jtt-start-btn');
        const resetBtn      = widget.querySelector('.jtt-btn-reset');
        const pauseBtn      = widget.querySelector('.jtt-btn-pause');

        // ── Grille de trous ───────────────────────────────────────────────
        const HOLES_COLS = 4;
        const HOLES_ROWS = 3;
        const HOLES_COUNT = HOLES_COLS * HOLES_ROWS;
        let holeEls = [];

        // ── État du jeu ──────────────────────────────────────────────────
        const MAX_LIVES = 3;
        let activeTables   = new Set([2,3,4,5,6,7,8,9]); // tables du 0 et du 1 exclues (trop triviales)
        let moveIntervalMs = 4000; // ms : durée pendant laquelle une taupe reste sortie
        let score          = 0;
        let lives          = MAX_LIVES;
        let running        = false;
        let paused         = true;
        let currentRound   = null; // { resolved, remaining, moles:[...] }
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;
        let activeTimers   = [];

        // ── Mode de vitesse progressive : accélère toutes les 10 bonnes réponses ──
        const PROGRESSIVE_START_DURATION = 5000;
        const PROGRESSIVE_MIN_DURATION   = 1500;
        const PROGRESSIVE_DECAY          = 0.90;
        let isProgressiveMode = false;
        let lastProgressiveMilestone = 0;

        // ── Chrono de la partie ───────────────────────────────────────────
        let elapsedMs = 0;
        let lastShownSeconds = -1;

        // ── Helper tap stylet (pointer-safe, tactile / stylet VPI) ────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const pid = e.pointerId;
                try { el.setPointerCapture(pid); } catch (err) {}
                const sx = e.clientX, sy = e.clientY;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    try { el.releasePointerCapture(pid); } catch (err) {}
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

        // ── Construction des cases à cocher des tables (0 et 1 exclues) ──
        for (let n = 2; n <= 9; n++) {
            const label = document.createElement('label');
            label.className = 'jtt-table-check checked';
            label.dataset.table = n;
            label.innerHTML = `<input type="checkbox" value="${n}" checked> ×${n}`;
            label.addEventListener('pointerdown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                const cb = label.querySelector('input[type=checkbox]');
                cb.checked = !cb.checked;
                if (cb.checked) { activeTables.add(n); label.classList.add('checked'); }
                else { activeTables.delete(n); label.classList.remove('checked'); }
            });
            paramsGrid.appendChild(label);
        }

        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        speedSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        speedSelect.addEventListener('change', () => { applySpeedSelection(); });

        function applySpeedSelection() {
            if (speedSelect.value === 'progressive') {
                isProgressiveMode = true;
                moveIntervalMs = PROGRESSIVE_START_DURATION;
                lastProgressiveMilestone = 0;
            } else {
                isProgressiveMode = false;
                moveIntervalMs = parseInt(speedSelect.value, 10) || 500;
            }
        }

        function maybeAdvanceProgressiveSpeed() {
            if (!isProgressiveMode) return;
            const milestone = Math.floor(score / 10);
            if (milestone > lastProgressiveMilestone) {
                lastProgressiveMilestone = milestone;
                moveIntervalMs = Math.max(PROGRESSIVE_MIN_DURATION, Math.round(PROGRESSIVE_START_DURATION * Math.pow(PROGRESSIVE_DECAY, milestone)));
            }
        }

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

        // ── Construction des trous (une fois) ───────────────────────────
        function buildHoles() {
            space.querySelectorAll('.jtt-hole').forEach(el => el.remove());
            holeEls = [];
            for (let i = 0; i < HOLES_COUNT; i++) {
                const hole = document.createElement('div');
                hole.className = 'jtt-hole';
                space.appendChild(hole);
                holeEls.push(hole);
            }
        }
        buildHoles();

        // ── Mise à l'échelle (taille de police selon la largeur du widget) ──
        function layoutBoard() {
            const ops  = Math.max(16, Math.min(26, Math.round(container.offsetWidth / 700 * 20)));
            container.style.setProperty('--jtt-op-fs', ops + 'px');
            const moleFs = Math.max(12, Math.min(20, Math.round(container.offsetWidth / 860 * 16)));
            container.style.setProperty('--jtt-mole-fs', moleFs + 'px');
        }

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null, _isMax = false;

        if (wfMin) {
            makeTap(wfMin, () => {
                pauseGame();
                if (_isMax) {
                    _isMax = false;
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jti-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                    layoutBoard();
                }
                window._wfMiniBarCollapse(widget, '🐹 Taupe des tables', {
                    onExpand: layoutBoard
                });
            });
        }
        if (wfMax) {
            makeTap(wfMax, () => {
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    _savedH = container.style.height;
                    if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                        container.classList.add('jti-mobile');
                    }
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jti-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                layoutBoard();
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                stopGame();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
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
                container.style.width  = Math.max(620, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(520, startH + ev.clientY - startY) + 'px';
                layoutBoard();
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

        // =====================================================================
        // LOGIQUE DU JEU
        // =====================================================================

        function formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const ss = (totalSec % 60).toString().padStart(2, '0');
            return mm + ':' + ss;
        }

        function updateHUD() {
            scoreEl.textContent = '⭐ Score : ' + score;
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, MAX_LIVES - lives));
        }

        function updateTimerDisplay(force) {
            const sec = Math.floor(elapsedMs / 1000);
            if (!force && sec === lastShownSeconds) return;
            lastShownSeconds = sec;
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function generateOperation() {
            const tables = activeTables.size > 0 ? Array.from(activeTables) : [2,3,4,5,6,7,8,9];
            const a = tables[randInt(0, tables.length - 1)];
            const b = randInt(0, 9);
            const correct = a * b;
            const wrongCount = 4;

            const wrongSet = new Set();
            let guardCount = 0;
            while (wrongSet.size < wrongCount && guardCount < 80) {
                guardCount++;
                let candidate;
                const mode = randInt(0, 3);
                if (mode === 0) candidate = correct + randInt(1, 8) * (Math.random() < 0.5 ? -1 : 1);
                else if (mode === 1) candidate = a * (b + randInt(1, 3) * (Math.random() < 0.5 ? -1 : 1));
                else if (mode === 2) candidate = (a + randInt(1, 2) * (Math.random() < 0.5 ? -1 : 1)) * b;
                else candidate = correct + randInt(1, 3) * 10 * (Math.random() < 0.5 ? -1 : 1);
                if (candidate === correct || candidate < 0) continue;
                wrongSet.add(candidate);
            }
            let fallback = correct + 1;
            while (wrongSet.size < wrongCount) {
                if (fallback !== correct) wrongSet.add(fallback);
                fallback++;
            }
            const choices = [correct, ...Array.from(wrongSet)];
            shuffleArray(choices);
            return { a, b, correct, choices };
        }

        function pickHoleIndexes(count) {
            const idxs = shuffleArray(Array.from({ length: HOLES_COUNT }, (_, i) => i));
            return idxs.slice(0, count);
        }

        function trackTimer(id) { activeTimers.push(id); return id; }

        function clearAllTimers() {
            activeTimers.forEach(id => clearTimeout(id));
            activeTimers = [];
        }

        // ── Nettoyage immédiat (sans animation) de toutes les taupes visibles ──
        function hideAllMolesInstant() {
            holeEls.forEach(h => h.querySelectorAll('.jtt-mole').forEach(el => el.remove()));
        }

        // ── Signal visuel commun : une vie vient d'être perdue ──────────
        function flashLifeLost() {
            opEl.classList.add('jtt-op-missed');
            trackTimer(setTimeout(() => { opEl.classList.remove('jtt-op-missed'); }, 500));
            livesEl.classList.remove('jtt-lives-flash');
            void livesEl.offsetWidth;
            livesEl.classList.add('jtt-lives-flash');
            trackTimer(setTimeout(() => { livesEl.classList.remove('jtt-lives-flash'); }, 500));
        }

        function retreatMole(round, mole, wasHit) {
            if (!mole || mole.retreated) return;
            mole.retreated = true;
            if (mole.el) {
                const elRef = mole.el;
                elRef.classList.remove('up');
                elRef.classList.add('down');
                trackTimer(setTimeout(() => { if (elRef && elRef.parentNode) elRef.remove(); }, 220));
            }
        }

        // ── Arrête la barre de temps du round là où elle en est (figée) ──
        function freezeRoundBar() {
            const cs = getComputedStyle(roundBarFill).width;
            roundBarFill.style.transition = 'none';
            roundBarFill.style.width = cs;
        }

        // ── Réinitialise la barre de temps (prête pour un nouveau round) ──
        function resetRoundBar() {
            roundBarFill.style.transition = 'none';
            roundBarFill.style.width = '100%';
        }

        // ── La taupe qui portait la bonne réponse n'a pas été tapée à temps :
        //    on la fait clairement réapparaître (ou on la garde visible) avec
        //    une mise en évidence, avant de perdre une vie et de passer à la suite ──
        function handleMissedCorrect(round, mole) {
            if (currentRound !== round || round.resolved || mole.hit || mole.retreated) return;
            round.resolved = true;
            freezeRoundBar();
            lives--;
            updateHUD();
            flashLifeLost();
            checkGameOver();

            // Cacher les autres taupes encore visibles pour focaliser l'attention
            round.moles.forEach(m => { if (m !== mole && !m.retreated && m.popped) retreatMole(round, m, true); });

            // Mettre en évidence la bonne taupe pendant un court instant
            if (mole.el) mole.el.classList.add('jtt-mole-reveal');
            trackTimer(setTimeout(() => {
                retreatMole(round, mole, true);
                trackTimer(setTimeout(() => {
                    if (currentRound !== round) return;
                    if (running && !paused && lives > 0) spawnRound();
                }, 280));
            }, 950));
        }

        function handleMoleHit(round, mole) {
            if (currentRound !== round || round.resolved || mole.hit || mole.retreated) return;
            mole.hit = true;
            if (mole.correct) {
                score++;
                updateHUD();
                round.resolved = true;
                freezeRoundBar();
                if (mole.el) mole.el.classList.add('bonk-correct');
                maybeAdvanceProgressiveSpeed();
                round.moles.forEach(m => { if (!m.retreated) retreatMole(round, m, true); });
                trackTimer(setTimeout(() => {
                    if (currentRound !== round) return;
                    if (running && !paused && lives > 0) spawnRound();
                }, 650));
            } else {
                lives--;
                updateHUD();
                flashLifeLost();
                if (mole.el) {
                    mole.el.classList.add('bonk-wrong');
                    const badge = document.createElement('div');
                    badge.className = 'jtt-mole-wrong-badge';
                    badge.textContent = '✗';
                    mole.el.appendChild(badge);
                }
                trackTimer(setTimeout(() => { retreatMole(round, mole, true); }, 480));
                checkGameOver();
            }
        }

        function popMole(round, mole) {
            if (currentRound !== round || round.resolved || destroyed) return;
            mole.popped = true;
            const holeEl = holeEls[mole.holeIndex];
            const el = document.createElement('div');
            el.className = 'jtt-mole';
            el.innerHTML =
                '<div class="jtt-mole-sign"><span class="jtt-mole-value"></span></div>' +
                '<div class="jtt-mole-hand jtt-mole-hand-l"></div>' +
                '<div class="jtt-mole-hand jtt-mole-hand-r"></div>' +
                '<div class="jtt-mole-body">' +
                    '<div class="jtt-mole-ear jtt-mole-ear-l"></div>' +
                    '<div class="jtt-mole-ear jtt-mole-ear-r"></div>' +
                    '<div class="jtt-mole-eye jtt-mole-eye-l"><span class="jtt-mole-pupil"></span></div>' +
                    '<div class="jtt-mole-eye jtt-mole-eye-r"><span class="jtt-mole-pupil"></span></div>' +
                    '<div class="jtt-mole-muzzle"></div>' +
                    '<div class="jtt-mole-nose"></div>' +
                '</div>';
            el.querySelector('.jtt-mole-value').textContent = mole.value;
            holeEl.appendChild(el);
            mole.el = el;
            requestAnimationFrame(() => { if (el.parentNode) el.classList.add('up'); });
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); e.preventDefault();
                handleMoleHit(round, mole);
            });
            if (mole.correct) {
                mole.retreatTimer = trackTimer(setTimeout(() => handleMissedCorrect(round, mole), moveIntervalMs));
            } else {
                mole.retreatTimer = trackTimer(setTimeout(() => retreatMole(round, mole, false), moveIntervalMs));
            }
        }

        function spawnRound() {
            if (destroyed) return;
            const { a, b, correct, choices } = generateOperation();
            opEl.textContent = '❓ ' + a + ' × ' + b + ' = ?';

            const holeIdxs = pickHoleIndexes(choices.length);
            const round = { resolved: false, moles: [] };
            currentRound = round;

            const staggerMax = Math.round(moveIntervalMs * 0.35);
            let correctDelay = 0;
            choices.forEach((val, i) => {
                const mole = { holeIndex: holeIdxs[i], value: val, correct: val === correct, el: null, popped: false, hit: false, retreated: false, retreatTimer: null };
                round.moles.push(mole);
                const delay = randInt(0, staggerMax);
                if (mole.correct) correctDelay = delay;
                trackTimer(setTimeout(() => popMole(round, mole), delay));
            });

            // Barre de temps : dure jusqu'au moment où la bonne taupe (si non tapée) redescendrait
            resetRoundBar();
            void roundBarFill.offsetWidth; // forcer le recalcul avant de lancer la transition
            const roundTotalMs = correctDelay + moveIntervalMs;
            requestAnimationFrame(() => {
                if (currentRound !== round) return;
                roundBarFill.style.transition = 'width ' + roundTotalMs + 'ms linear';
                roundBarFill.style.width = '0%';
            });
        }

        function clearRound() {
            hideAllMolesInstant();
            currentRound = null;
            resetRoundBar();
        }

        function checkGameOver() {
            if (lives <= 0) {
                lives = 0;
                updateHUD();
                endGame();
            }
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            const dt = now - lastTime;
            lastTime = now;

            if (running && !paused) {
                elapsedMs += dt;
                updateTimerDisplay(false);
            }
            rafId = requestAnimationFrame(gameLoop);
        }

        function showOverlay(title, sub, btnLabel) {
            overlayTitle.textContent = title;
            overlaySub.textContent = sub;
            startBtn.textContent = btnLabel;
            overlay.classList.remove('hidden');
        }
        function hideOverlay() { overlay.classList.add('hidden'); }

        function startGame() {
            if (running && !paused) return;
            if (!running) {
                score = 0; lives = MAX_LIVES;
                elapsedMs = 0; lastShownSeconds = -1;
                applySpeedSelection();
                updateHUD();
                updateTimerDisplay(true);
            }
            clearAllTimers();
            clearRound();
            running = true;
            paused = false;
            hideOverlay();
            paramsPanel.classList.remove('show');
            paramsBtn.classList.remove('active');
            pauseBtn.textContent = '⏸ Pause';
            lastTime = null;
            spawnRound();
            if (!rafId) rafId = requestAnimationFrame(gameLoop);
        }

        function pauseGame() {
            if (!running || paused) return;
            paused = true;
            clearAllTimers();
            clearRound();
            pauseBtn.textContent = '▶ Reprendre';
            showOverlay('⏸ En pause', 'Clique sur Démarrer pour reprendre la partie.', '▶ Reprendre');
        }

        function togglePause() {
            if (!running) { startGame(); return; }
            if (paused) startGame(); else pauseGame();
        }

        function stopGame() {
            running = false;
            paused = true;
            destroyed = true;
            clearAllTimers();
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }

        function endGame() {
            running = false;
            paused = true;
            clearAllTimers();
            clearRound();
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Clique sur Démarrer pour rejouer.', '▶ Rejouer');
        }

        function resetGame() {
            applySpeedSelection();
            clearAllTimers();
            clearRound();
            score = 0; lives = MAX_LIVES; running = false; paused = true;
            lastTime = null; elapsedMs = 0; lastShownSeconds = -1;
            opEl.textContent = '❓ …';
            updateHUD();
            updateTimerDisplay(true);
            showOverlay('🐹 Taupe des tables', 'Tape sur la taupe qui porte le bon résultat avant qu\'elle ne redescende dans son trou !', '▶ Démarrer');
        }

        // ── Écouteurs des contrôles ─────────────────────────────────────
        makeTap(startBtn, () => startGame());
        makeTap(pauseBtn, () => togglePause());
        makeTap(resetBtn, () => resetGame());

        // ── Init ─────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const isMobile = typeof isMobileBoardMode === 'function' && isMobileBoardMode();

            if (!isMobile) {
                // Le widget s'ouvre à 100px du bord gauche du board.
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }

            if (isMobile) {
                const wPct = parseFloat(widget.dataset.widthPercent);
                const hPct = parseFloat(widget.dataset.contentHPercent);
                if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
                if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
                if (!container.style.height) container.style.height = '800px';
            } else {
                // Sur PC, le jeu démarre toujours à 1000×800px.
                container.style.width  = '1000px';
                container.style.height = '800px';
            }

            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile) {
                container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            } else {
                _isMax = false;
            }

            layoutBoard();
            updateHUD();
            resetGame();
            paramsPanel.classList.add('show');
            paramsBtn.classList.add('active');
            rafId = requestAnimationFrame(gameLoop);
        }));

        // ── Nettoyage si le widget est retiré du DOM autrement que via wfClose ──
        const _observer = new MutationObserver(() => {
            if (!document.body.contains(widget)) {
                stopGame();
                _observer.disconnect();
            }
        });
        _observer.observe(document.body, { childList: true, subtree: true });
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'jeu-tables-taupe') initJeuTablesTaupeWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-tables-taupe') initJeuTablesTaupeWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
