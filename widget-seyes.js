// =========================================================================
// WIDGET ÉCRITURE seyes — Le Bureau du Prof
// Zone d'écriture cursive sur fond seyes clair avec marge.
// Police BelleAllure alignée sur le lignage seyes (interligne = 16px,
// grande ligne = 64px).
//
// Règles seyes :
//   • Corps de la lettre (minuscule sans jambage) = 1 interligne = 16px
//   • Boucles hautes (l, b, d, f, h, k…)         = 3 interlignes = 48px au-dessus de la ligne de base
//   • Barres hautes (t, d, p côté haut…)          = 2 interlignes = 32px au-dessus de la ligne de base
//   • Boucles basses (g, j, p, q, y, z…)         = 2 interlignes = 32px en-dessous de la ligne de base
//   • Ligne de base = grande ligne (toutes les 64px)
//
// La zone de texte est un <div contenteditable> transparent par-dessus
// le fond seyes, avec line-height = 64px (une grande ligne par ligne de texte)
// et font-size calé pour que les minuscules fassent exactement 16px de haut
// (soit 1 interligne).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//
// En cas de souci avec la position des mots sur les lignes, régler les valeurs lignes 671, 672 et 683
//
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Déclaration de la police BelleAllureGS (une seule fois)
    if (!document.getElementById('bellealluregs-face')) {
        const ff = document.createElement('style');
        ff.id = 'bellealluregs-face';
        ff.textContent = `
            @font-face {
                font-family: 'BelleAllureGS';
                src: url('polices/BelleAllureGS-Gros.otf') format('opentype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
        `;
        document.head.appendChild(ff);
    }

    // Déclaration de la police MarelleBaton (une seule fois)
    if (!document.getElementById('marellebaton-face')) {
        const ff2 = document.createElement('style');
        ff2.id = 'marellebaton-face';
        ff2.textContent = `
            @font-face {
                font-family: 'MarelleBaton';
                src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
        `;
        document.head.appendChild(ff2);
    }

    // Réutiliser les helpers globaux si déjà injectés
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top          = MARGIN_TOP + 'px';
            widget.style.left         = occupiedX + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.zIndex       = '9000';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.display      = 'block';
            widget.style.overflow     = 'hidden';
            widget.style.padding      = '0';
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
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top          = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left         = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width        = widget.dataset.wfMiniSavedW    || '';
                widget.style.height       = widget.dataset.wfMiniSavedH    || '';
                widget.style.zIndex       = '';
                widget.style.background   = '';
                widget.style.borderRadius = '';
                widget.style.border       = '';
                widget.style.display      = '';
                widget.style.overflow     = '';
                widget.style.padding      = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

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

    if (!document.getElementById('widget-seyes-style')) {
        const s = document.createElement('style');
        s.id = 'widget-seyes-style';

        // ── Variables seyes ──────────────────────────────────────────────
        // Grande ligne  : 64px  (= 4 interlignes)
        // Interligne    : 16px  (= corps de la lettre minuscule)
        // Marge rouge   : à 256px du bord gauche (identique au preset bg)
        // Corps police  : font-size calibré pour que x-height ≈ 16px
        //   → BelleAllure a un x-height ratio ≈ 0.45, donc font-size = 16/0.45 ≈ 36px
        //   → On ajuste avec padding-top pour caler la ligne de base sur la grande ligne

        s.textContent = `
        /* ── Conteneur principal ─────────────────────────── */
        .widget[data-type="seyes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .seyes-container {
            background-color: #fafcff;
            outline: none;
            border: 1.5px solid #c8d8eb;
            border-radius: 4px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 2px 12px rgba(0,0,0,0.10);
            position: relative;
            overflow: hidden;
        }

        /* ── En-tête / barre d'édition ──────────────────── */
        .seyes-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 10px;
            background: rgba(255,254,245,0.95);
            border-bottom: 1px solid #d4e4f0;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            z-index: 2;
            backdrop-filter: blur(2px);
        }

        .seyes-title {
            font-size: 12px;
            font-weight: 800;
            color: #4a6580;
            letter-spacing: 0.3px;
            pointer-events: none;
            flex-shrink: 0;
        }

        /* ── Barre d'outils texte (pied du widget) ───────── */
        .seyes-toolbar {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
            justify-content: center;
        }

        /* ── Pied de page / barre d'outils ──────────────── */
        .seyes-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 5px 10px;
            background: rgba(255,254,245,0.95);
            border-top: 1px solid #d4e4f0;
            flex-shrink: 0;
            z-index: 2;
            flex-wrap: wrap;
            user-select: none;
        }

        .seyes-tool-btn {
            padding: 3px 8px;
            border-radius: 5px;
            border: 1px solid #d0dcea;
            background: #f0f5fa;
            color: #4a6580;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, border-color .15s;
            line-height: 1.4;
            white-space: nowrap;
        }
        .seyes-tool-btn:hover { background: #ddeaf5; border-color: #9aadbe; }
        .seyes-tool-btn:active { transform: scale(0.95); }
        .seyes-tool-btn.active { background: #9aadbe; color: #fff; border-color: #7a9ab0; }

        .seyes-sep {
            width: 1px;
            height: 20px;
            background: #d0dcea;
            flex-shrink: 0;
            margin: 0 2px;
        }

        /* ── Zone d'écriture ─────────────────────────────── */
        .seyes-writing-area {
            flex: 1;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
            min-height: 192px;
            background-color: #fafcff;
        }

        /* Couche de fond (derrière l'éditeur, grandit avec lui) */
        .seyes-bg-layer {
            position: absolute;
            top: 0; left: 0; right: 0;
            min-height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        /* Le contenteditable principal — commence APRÈS la marge */
        .seyes-editor {
            position: absolute;
            top: 0; right: 0;
            left: 256px;
            min-height: 100%;
            line-height: 64px;
            padding: 0 16px 0 16px;
            box-sizing: border-box;
            background: transparent;
            outline: none;
            cursor: text;
            color: #1a1a2e;
            font-family: 'BelleAllureGS', cursive;
            font-size: 36px;
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
            user-select: text;
            -webkit-user-select: text;
            min-height: 192px;
            -webkit-line-break: after-white-space;
            z-index: 2;
            text-underline-offset: 16px;
            text-decoration-skip-ink: none;
        }

        /* Zone d'écriture dans la marge */
        .seyes-editor-marge {
            position: absolute;
            top: 0; left: 0;
            width: max-content;
            max-width: none;
            min-height: 100%;
            padding: 2px 8px 0 8px;
            box-sizing: border-box;
            background: transparent;
            outline: none;
            cursor: default;
            color: #1a1a2e;
            font-family: 'BelleAllureGS', cursive;
            font-size: 36px;
            line-height: 64px;
            white-space: nowrap;
            word-break: normal;
            overflow-wrap: normal;
            overflow: visible;
            user-select: none;
            -webkit-user-select: none;
            pointer-events: none;
            z-index: 2;
            text-underline-offset: 16px;
            text-decoration-skip-ink: none;
        }
        .seyes-editor-marge.active {
            pointer-events: auto;
            cursor: text;
            user-select: text;
            -webkit-user-select: text;
        }
        .seyes-editor-marge:empty::before {
            content: attr(data-placeholder);
            color: #c8d8eb;
            font-style: italic;
            pointer-events: none;
        }

        /* Calque invisible qui capte les clics dans la marge */
        .seyes-marge-catcher {
            position: absolute;
            top: 0; left: 0;
            width: 256px;
            min-height: 100%;
            cursor: text;
            z-index: 3;
            background: transparent;
        }
        /* Quand la marge est active, le catcher s'efface pour laisser passer les clics à editorMarge */
        .seyes-editor-marge.active ~ .seyes-marge-catcher,
        .seyes-marge-catcher.hidden {
            display: none;
        }

        .seyes-editor:empty::before {
            content: attr(data-placeholder);
            color: #b0c4d8;
            font-style: italic;
            pointer-events: none;
        }

        /* ── Images collées dans l'éditeur ───────────────── */
        /* Taille libre ; JS ajoute une marge haute pour que la ligne occupe un nombre entier de grandes lignes (lignage aligné) */
        .seyes-editor img {
            vertical-align: bottom;
            max-width: 100%;
            object-fit: contain;
            cursor: move;
            -webkit-user-drag: none;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
        }
        .seyes-img-frame {
            position: absolute;
            display: none;
            z-index: 4;
            pointer-events: none;
            border: 2px solid #4a90d9;
            border-radius: 2px;
            box-sizing: border-box;
        }
        .seyes-img-handle {
            position: absolute;
            right: 2px; bottom: 2px;
            width: 18px; height: 18px;
            background: #4a90d9;
            border: 2px solid #fff;
            border-radius: 50%;
            box-sizing: border-box;
            box-shadow: 0 1px 3px rgba(0,0,0,.35);
            cursor: se-resize;
            pointer-events: auto;
            touch-action: none;
        }

        /* ── Barre de redimensionnement ─────────────────── */
        .seyes-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #9aadbe 50%);
            border-radius: 0 0 2px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .seyes-container:hover .seyes-resize-handle { opacity: 0.7; }
        .seyes-resize-handle:hover { opacity: 1 !important; }

        /* ── État réduit ────────────────────────────────── */
        .seyes-container.wf-minimized > *:not(.seyes-header) { display: none !important; }
        .seyes-container.wf-minimized { gap: 0; }

        /* ── État plein écran board ─────────────────────── */
        .seyes-container.wf-fullboard {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 50px !important;
            right: 0 !important;
            width: calc(100% - 50px) !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
        }
        .seyes-container.wf-fullboard .seyes-writing-area { flex: 1; min-height: unset; overflow-y: auto; }
        .seyes-container.wf-fullboard .seyes-editor { min-height: unset; }
        .seyes-container.wf-fullboard .seyes-footer { flex-shrink: 0; }

        /* ── Modale confirmation effacement ─────────────── */
        .seyes-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(30, 40, 60, 0.45);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: seyes-modal-fadein .18s ease;
        }
        @keyframes seyes-modal-fadein {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        .seyes-modal {
            background: #fafcff;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10);
            padding: 32px 36px 28px;
            min-width: 320px;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            animation: seyes-modal-popin .22s cubic-bezier(.34,1.56,.64,1);
            border: 1.5px solid #d4e4f0;
        }
        @keyframes seyes-modal-popin {
            from { opacity: 0; transform: scale(.88) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .seyes-modal-icon {
            font-size: 38px;
            line-height: 1;
            margin-bottom: 4px;
        }
        .seyes-modal-title {
            font-size: 16px;
            font-weight: 800;
            color: #2c3e50;
            text-align: center;
            letter-spacing: 0.2px;
        }
        .seyes-modal-body {
            font-size: 13px;
            color: #7a9ab0;
            text-align: center;
            line-height: 1.5;
        }
        .seyes-modal-btns {
            display: flex;
            gap: 10px;
            margin-top: 8px;
        }
        .seyes-modal-btn {
            padding: 9px 24px;
            border-radius: 10px;
            border: none;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: transform .1s, filter .15s;
        }
        .seyes-modal-btn:hover  { filter: brightness(.92); }
        .seyes-modal-btn:active { transform: scale(.96); }
        .seyes-modal-btn-cancel {
            background: #eef2f7;
            color: #4a6580;
        }
        .seyes-modal-btn-confirm {
            background: #e05050;
            color: #fff;
        }

        /* ── Bouton aide ─────────────────────────────────── */
        .seyes-help-btn {
            width: 18px; height: 18px;
            border-radius: 50%;
            border: 1.5px solid #9aadbe;
            background: #eef5fb;
            color: #4a7a9b;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: background .15s, border-color .15s;
            line-height: 1;
            padding: 0;
        }
        .seyes-help-btn:hover { background: #c8d8eb; border-color: #7a9ab0; }

        /* ── Modale aide ─────────────────────────────────── */
        .seyes-help-modal {
            background: #fafcff;
            border-radius: 18px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10);
            padding: 28px 32px 24px;
            width: 460px;
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 48px);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: seyes-modal-popin .22s cubic-bezier(.34,1.56,.64,1);
            border: 1.5px solid #d4e4f0;
        }
        .seyes-help-modal-title {
            font-size: 17px;
            font-weight: 800;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .seyes-help-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .seyes-help-section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #9aadbe;
        }
        .seyes-help-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 12.5px;
            color: #4a6580;
            line-height: 1.5;
        }
        .seyes-help-row-icon {
            font-size: 16px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .seyes-help-close {
            align-self: center;
            margin-top: 4px;
            padding: 8px 28px;
            border-radius: 10px;
            border: none;
            background: #4a7a9b;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: filter .15s;
        }
        .seyes-help-close:hover { filter: brightness(.9); }
        `;
        document.head.appendChild(s);
    }
})();

// ── Création du widget ────────────────────────────────────────────────────
function createSeyesWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type    = 'pdf';      // permet la détection par draw.js (_attachHoverToPdfWidget)
    widget.dataset.subtype = 'seyes';    // identifie le widget comme seyes pour les autres systèmes
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
    widget.tabIndex = 0;

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
    `;

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'seyes-container';

    const initW = Math.round(window.innerWidth * 0.72);
    container.style.width  = initW + 'px';
    container.style.height = (640 + 40) + 'px'; // 10 grandes lignes (640px) + header (~40px)

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'seyes-header';
    header.innerHTML = `
        <span class="seyes-title">✏️ Écriture Seyes</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="seyes-help-btn" data-role="wf-pdf"  title="Exporter / Imprimer" style="width:auto;padding:0 6px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:0.3px;border-color:#c8d8eb;">PDF</button>
            <button class="seyes-help-btn" data-role="wf-save" title="Sauvegarder en JSON" style="width:auto;padding:0 6px;border-radius:6px;font-size:13px;font-weight:800;letter-spacing:0.3px;border-color:#c8d8eb;">💾</button>
            <button class="seyes-help-btn" data-role="wf-load" title="Charger une sauvegarde JSON" style="width:auto;padding:0 6px;border-radius:6px;font-size:13px;font-weight:800;letter-spacing:0.3px;border-color:#c8d8eb;">📂</button>
            <button class="seyes-help-btn" data-role="wf-help" title="Aide">?</button>
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);

    // ── Pied de page (barre d'outils) ────────────────────────────────────
    const footer = document.createElement('div');
    footer.className = 'seyes-footer';
    // Le footer sera ajouté au container après writingArea (voir plus bas)

    const toolbar = document.createElement('div');
    toolbar.id = 'seyes-toolbar-inner';
    toolbar.className = 'seyes-toolbar';

    // Zoom — placé en premier dans la toolbar
    const zoomGroup = document.createElement('div');
    zoomGroup.style.cssText = 'display:flex;align-items:center;gap:2px;background:#eef5fb;border:1.5px solid #c8d8eb;border-radius:8px;padding:0 4px;height:22px;flex-shrink:0;';
    zoomGroup.innerHTML = `
        <button data-role="wf-zoom-out" title="Réduire (Ctrl + −)" style="width:18px;height:18px;border:none;background:transparent;font-size:15px;font-weight:900;color:#4a7a9b;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;">−</button>
        <span data-role="wf-zoom-label" style="font-size:10px;font-weight:800;color:#4a7a9b;min-width:30px;text-align:center;user-select:none;">100%</span>
        <button data-role="wf-zoom-in"  title="Agrandir (Ctrl + +)" style="width:18px;height:18px;border:none;background:transparent;font-size:15px;font-weight:900;color:#4a7a9b;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;">+</button>
    `;
    toolbar.appendChild(zoomGroup);

    // Séparateur après zoom
    const sep0 = document.createElement('div');
    sep0.className = 'seyes-sep';
    toolbar.appendChild(sep0);

    footer.appendChild(toolbar);

    // ── Barre d'outils ────────────────────────────────────────────────────
    // Couleur du texte via cpick
    const seyesCpickId = 'seyes-color-' + Date.now(); // id unique par instance
    const colorWrap = document.createElement('div');
    colorWrap.className = 'seyes-color-wrap cpick-wrap';
    colorWrap.id = 'cpick-' + seyesCpickId;
    colorWrap.title = 'Couleur du texte';
    colorWrap.innerHTML = `
        <div class="cpick-swatch seyes-color-swatch" style="background:#1a1a2e;width:22px;height:22px;border-radius:50%;border:2px solid #d0dcea;cursor:pointer;flex-shrink:0;"
             onclick="cpickOpen('${seyesCpickId}', this)"></div>
        <div class="cpick-popup" id="cpick-pop-${seyesCpickId}"></div>
    `;
    toolbar.appendChild(colorWrap);
    // Téléporter le popup vers document.body pour éviter les problèmes de z-index/stacking
    document.body.appendChild(colorWrap.querySelector('.cpick-popup'));

    // Sélection sauvegardée avant ouverture du picker
    let _seyesSavedSelection = null;

    // Sauvegarder la sélection juste avant l'ouverture du picker (texte)
    colorWrap.addEventListener('mousedown', () => {
        const sel = window.getSelection();
        _seyesSavedSelection = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    });

    // Séparateur
    const sep1 = document.createElement('div');
    sep1.className = 'seyes-sep';
    toolbar.appendChild(sep1);

    // Police : sélecteur de police
    const fontSelect = document.createElement('select');
    fontSelect.title = 'Choisir la police';
    fontSelect.style.cssText = 'font-size:11px;color:#4a6580;border:1px solid #d0dcea;border-radius:5px;background:#f0f5fa;padding:2px 4px;cursor:pointer;outline:none;max-width:130px;';
    [
        { value: 'BelleAllureGS', label: 'BelleAllureGS' },
        { value: 'MarelleBaton',  label: 'MarelleBaton'  },
    ].forEach(({ value, label }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        fontSelect.appendChild(opt);
    });
    fontSelect.addEventListener('mousedown', (e) => e.stopPropagation());
    fontSelect.addEventListener('change', () => {
        const chosen = fontSelect.value;
        if (chosen === 'MarelleBaton') {
            // MarelleBaton : x-height ratio ≈ 0.55 (plus grand que BelleAllure ~0.45)
            // → font-size réduit pour que les minuscules ≈ 32px
            // ascent ratio ≈ 0.87 → paddingTop ajusté en conséquence
            const fsM = 32;
            const ascentM = fsM * 0.87;
            let ptM = Math.round(LH - ascentM + 4);
            if (ptM < 0) ptM = 0;
            editor.style.fontFamily      = "'MarelleBaton', cursive";
            editor.style.fontSize        = fsM + 'px';
            editor.style.paddingTop      = ptM + 'px';
            editorMarge.style.fontFamily = "'MarelleBaton', cursive";
            editorMarge.style.fontSize   = fsM + 'px';
            editorMarge.style.paddingTop = ptM + 'px';
        } else {
            // BelleAllureGS : réglages d'origine (inchangés)
            const ptB = _seyesPaddingTop(36, LH);
            editor.style.fontFamily      = "'BelleAllureGS', cursive";
            editor.style.fontSize        = '36px';
            editor.style.paddingTop      = ptB + 'px';
            editorMarge.style.fontFamily = "'BelleAllureGS', cursive";
            editorMarge.style.fontSize   = '36px';
            editorMarge.style.paddingTop = ptB + 'px';
        }
        saveBoard();
    });
    toolbar.appendChild(fontSelect);

    // Séparateur
    const sep2 = document.createElement('div');
    sep2.className = 'seyes-sep';
    toolbar.appendChild(sep2);

    // Gras / Italique
    [
        { cmd: 'bold',   label: 'G', title: 'Gras (Ctrl+B)',     style: 'font-weight:700;' },
        { cmd: 'italic', label: 'I', title: 'Italique (Ctrl+I)', style: 'font-style:italic;' },
    ].forEach(({ cmd, label, title, style }) => {
        const btn = document.createElement('button');
        btn.className = 'seyes-tool-btn';
        btn.title = title;
        btn.innerHTML = `<span style="${style}">${label}</span>`;
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            const activeEd = document.activeElement;
            const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
            targetEd.focus();
            document.execCommand(cmd, false, null);
            saveBoard();
        });
        toolbar.appendChild(btn);
    });

    // Souligné + swatch couleur de soulignage (groupés visuellement)
    let _underlineColor = '#1a1a2e';

    const underlineGroup = document.createElement('div');
    underlineGroup.style.cssText = 'display:flex;align-items:center;gap:2px;';

    // ── Helper générique : retirer un style sur tous les spans d'un range ──
    const _removeStyleFromRange = (range, testFn, cleanFn) => {
        const ancestor = range.commonAncestorContainer;
        const root = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
        const spans = Array.from(root.querySelectorAll('[style]'));
        spans.forEach(sp => {
            if (!range.intersectsNode(sp)) return;
            if (!testFn(sp)) return;
            cleanFn(sp);
            // Si le span n'a plus aucun style utile, on l'aplatit
            const remaining = (sp.getAttribute('style') || '')
                .split(';').map(s => s.trim()).filter(s => s && !s.endsWith(':'));
            if (!remaining.length) {
                const parent = sp.parentNode;
                while (sp.firstChild) parent.insertBefore(sp.firstChild, sp);
                parent.removeChild(sp);
            }
        });
    };

    const underlineBtn = document.createElement('button');
    underlineBtn.className = 'seyes-tool-btn';
    underlineBtn.title = 'Souligné (Ctrl+U)';
    underlineBtn.innerHTML = `<span style="text-decoration:underline;">S</span>`;
    underlineBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const activeEd = document.activeElement;
        const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
        const sel = window.getSelection();
        const savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;

        targetEd.focus();
        if (savedRange) { sel.removeAllRanges(); sel.addRange(savedRange); }

        if (!savedRange || savedRange.collapsed) {
            // Pas de sélection : toggle via execCommand
            document.execCommand('underline', false, null);
        } else {
            const alreadyUnderlined = document.queryCommandState('underline');
            if (alreadyUnderlined) {
                // Retirer : nettoyer les spans custom
                _removeStyleFromRange(
                    savedRange,
                    sp => (sp.style.textDecoration || '').includes('underline'),
                    sp => {
                        sp.style.textDecoration      = (sp.style.textDecoration || '').replace(/\bunderline\b/g, '').trim();
                        sp.style.textDecorationColor = '';
                        sp.style.textUnderlineOffset = '';
                    }
                );
                // Retirer aussi les <u> natifs
                sel.removeAllRanges(); sel.addRange(savedRange);
                if (document.queryCommandState('underline')) document.execCommand('underline', false, null);
                if (document.queryCommandState('underline')) document.execCommand('underline', false, null);
            } else {
                // Appliquer avec décalage d'un interligne (16px)
                sel.removeAllRanges(); sel.addRange(savedRange);
                const span = document.createElement('span');
                span.style.textDecoration          = 'underline';
                span.style.textDecorationColor     = _underlineColor;
                span.style.textUnderlineOffset     = '16px';
                span.style.textDecorationSkipInk   = 'none';
                try { savedRange.surroundContents(span); }
                catch(_) { document.execCommand('underline', false, null); }
            }
        }
        saveBoard();
    });
    underlineGroup.appendChild(underlineBtn);

    // Swatch couleur de soulignage (suffixe aléatoire pour éviter collision avec seyesCpickId)
    const seyesUlCpickId = 'seyes-ul-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const ulColorWrap = document.createElement('div');
    ulColorWrap.className = 'cpick-wrap';
    ulColorWrap.id = 'cpick-' + seyesUlCpickId;
    ulColorWrap.title = 'Couleur du soulignage';
    ulColorWrap.innerHTML = `
        <div class="cpick-swatch" style="background:#1a1a2e;width:14px;height:14px;border-radius:3px;border:1.5px solid #d0dcea;cursor:pointer;flex-shrink:0;margin-bottom:-1px;"
             onclick="cpickOpen('${seyesUlCpickId}', this)"></div>
        <div class="cpick-popup" id="cpick-pop-${seyesUlCpickId}"></div>
    `;
    // Brancher l'action couleur de soulignage
    ulColorWrap.addEventListener('mousedown', () => {
        const sel = window.getSelection();
        _seyesSavedSelection = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    });

    // ── Dispatch cpick centralisé pour cette instance ────────────────────
    const _origDispatch = window.cpickDispatch;
    window.cpickDispatch = (id, color) => {
        if (id === seyesCpickId) {
            // Couleur du texte
            const swatch = colorWrap.querySelector('.cpick-swatch');
            if (swatch) swatch.style.background = color;
            if (_seyesSavedSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(_seyesSavedSelection);
            }
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) {
                document.execCommand('foreColor', false, color);
            } else {
                const activeEd = document.activeElement;
                const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
                targetEd.style.color = color;
            }
            saveBoard();
        } else if (id === seyesUlCpickId) {
            // Couleur du soulignage : stocker et appliquer sur la sélection
            _underlineColor = color;
            const ulSwatch = ulColorWrap.querySelector('.cpick-swatch');
            if (ulSwatch) ulSwatch.style.background = color;
            underlineBtn.querySelector('span').style.textDecorationColor = color;
            // Appliquer immédiatement sur la sélection sauvegardée si elle existe
            if (_seyesSavedSelection && !_seyesSavedSelection.collapsed) {
                const targetEd = (editorMarge && _seyesSavedSelection.intersectsNode && _seyesSavedSelection.intersectsNode(editorMarge)) ? editorMarge : editor;
                targetEd.focus();
                const sel = window.getSelection();
                sel.removeAllRanges();
                const rangeClone = _seyesSavedSelection.cloneRange();
                sel.addRange(rangeClone);
                const span = document.createElement('span');
                span.style.textDecoration        = 'underline';
                span.style.textDecorationColor   = color;
                span.style.textUnderlineOffset   = '16px';
                span.style.textDecorationSkipInk = 'none';
                try {
                    rangeClone.surroundContents(span);
                } catch(err) {
                    document.execCommand('underline', false, null);
                }
            }
            saveBoard();
        } else if (id === seyesHlCpickId) {
            // Couleur de surlignage
            _highlightColor = color;
            const hlSwatch = hlColorWrap.querySelector('.cpick-swatch');
            if (hlSwatch) hlSwatch.style.background = color;
            highlightBtn.querySelector('span').style.backgroundColor = color;
            if (_seyesSavedSelection && !_seyesSavedSelection.collapsed) {
                const targetEd = (editorMarge && _seyesSavedSelection.intersectsNode && _seyesSavedSelection.intersectsNode(editorMarge)) ? editorMarge : editor;
                targetEd.focus();
                const sel = window.getSelection();
                sel.removeAllRanges();
                const rangeClone = _seyesSavedSelection.cloneRange();
                sel.addRange(rangeClone);
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                try {
                    rangeClone.surroundContents(span);
                } catch(err) {
                    document.execCommand('backColor', false, color);
                }
            }
            saveBoard();
        } else if (id === seyesBdCpickId) {
            // Couleur d'encadrement
            _borderColor = color;
            const bdSwatch = bdColorWrap.querySelector('.cpick-swatch');
            if (bdSwatch) bdSwatch.style.background = color;
            borderBtn.querySelector('span').style.borderColor = color;
            if (_seyesSavedSelection && !_seyesSavedSelection.collapsed) {
                const targetEd = (editorMarge && _seyesSavedSelection.intersectsNode && _seyesSavedSelection.intersectsNode(editorMarge)) ? editorMarge : editor;
                targetEd.focus();
                const sel = window.getSelection();
                sel.removeAllRanges();
                const rangeClone = _seyesSavedSelection.cloneRange();
                sel.addRange(rangeClone);
                const span = document.createElement('span');
                span.style.border = '2.5px solid ' + color;
                span.style.borderRadius = '2px';
                span.style.padding = '0 2px';
                span.style.boxDecorationBreak = 'clone';
                span.style.webkitBoxDecorationBreak = 'clone';
                try {
                    rangeClone.surroundContents(span);
                } catch(err) {
                    const frag = rangeClone.extractContents();
                    span.appendChild(frag);
                    rangeClone.insertNode(span);
                }
            }
            saveBoard();
        } else if (typeof _origDispatch === 'function') {
            _origDispatch(id, color);
        }
    };

    underlineGroup.appendChild(ulColorWrap);
    toolbar.appendChild(underlineGroup);

    // Séparateur
    const sep3a = document.createElement('div');
    sep3a.className = 'seyes-sep';
    toolbar.appendChild(sep3a);
    // Téléporter le popup soulignage vers document.body
    document.body.appendChild(ulColorWrap.querySelector('.cpick-popup'));

    // ── Surlignage ────────────────────────────────────────────────────────
    let _highlightColor = '#fff176';

    const highlightGroup = document.createElement('div');
    highlightGroup.style.cssText = 'display:flex;align-items:center;gap:2px;';

    const highlightBtn = document.createElement('button');
    highlightBtn.className = 'seyes-tool-btn';
    highlightBtn.title = 'Surligner la sélection';
    highlightBtn.innerHTML = `<span style="background:#fff176;padding:0 3px;border-radius:2px;">S</span>`;
    highlightBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const sel = window.getSelection();
        const savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
        if (!savedRange || savedRange.collapsed) return;
        const activeEd = document.activeElement;
        const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
        targetEd.focus();

        // Détecter si la sélection est déjà surlignée
        const ancestor = savedRange.commonAncestorContainer;
        const root = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
        const hlSpans = Array.from(root.querySelectorAll('[style]'))
            .filter(sp => savedRange.intersectsNode(sp) && (sp.style.backgroundColor || '').trim());
        const alreadyHighlighted = hlSpans.length > 0;

        if (alreadyHighlighted) {
            // Retirer le surlignage
            _removeStyleFromRange(
                savedRange,
                sp => !!(sp.style.backgroundColor || '').trim(),
                sp => { sp.style.backgroundColor = ''; }
            );
            // Retirer aussi les backColor natifs du navigateur
            sel.removeAllRanges(); sel.addRange(savedRange);
            document.execCommand('backColor', false, 'transparent');
        } else {
            // Appliquer le surlignage
            sel.removeAllRanges(); sel.addRange(savedRange);
            const span = document.createElement('span');
            span.style.backgroundColor = _highlightColor;
            try { savedRange.surroundContents(span); }
            catch(_) { document.execCommand('backColor', false, _highlightColor); }
        }
        saveBoard();
    });
    highlightGroup.appendChild(highlightBtn);

    const seyesHlCpickId = 'seyes-hl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const hlColorWrap = document.createElement('div');
    hlColorWrap.className = 'cpick-wrap';
    hlColorWrap.id = 'cpick-' + seyesHlCpickId;
    hlColorWrap.title = 'Couleur de surlignage';
    hlColorWrap.innerHTML = `
        <div class="cpick-swatch" style="background:#fff176;width:14px;height:14px;border-radius:3px;border:1.5px solid #d0dcea;cursor:pointer;flex-shrink:0;margin-bottom:-1px;"
             onclick="cpickOpen('${seyesHlCpickId}', this)"></div>
        <div class="cpick-popup" id="cpick-pop-${seyesHlCpickId}"></div>
    `;
    hlColorWrap.addEventListener('mousedown', () => {
        const sel = window.getSelection();
        _seyesSavedSelection = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    });
    highlightGroup.appendChild(hlColorWrap);
    toolbar.appendChild(highlightGroup);

    // Séparateur
    const sep3b = document.createElement('div');
    sep3b.className = 'seyes-sep';
    toolbar.appendChild(sep3b);
    document.body.appendChild(hlColorWrap.querySelector('.cpick-popup'));

    // ── Encadrement ───────────────────────────────────────────────────────
    let _borderColor = '#e05050';

    const borderGroup = document.createElement('div');
    borderGroup.style.cssText = 'display:flex;align-items:center;gap:2px;';

    const borderBtn = document.createElement('button');
    borderBtn.className = 'seyes-tool-btn';
    borderBtn.title = 'Encadrer la sélection';
    borderBtn.innerHTML = `<span style="border:2.5px solid #e05050;padding:0 3px;border-radius:2px;">E</span>`;
    borderBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const sel = window.getSelection();
        const savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
        if (!savedRange || savedRange.collapsed) return;
        const activeEd = document.activeElement;
        const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
        targetEd.focus();

        // Détecter si la sélection est déjà encadrée
        const ancestor = savedRange.commonAncestorContainer;
        const root = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
        const bdSpans = Array.from(root.querySelectorAll('[style]'))
            .filter(sp => savedRange.intersectsNode(sp) && (sp.style.border || '').trim());
        const alreadyBordered = bdSpans.length > 0;

        if (alreadyBordered) {
            // Retirer l'encadrement
            _removeStyleFromRange(
                savedRange,
                sp => !!(sp.style.border || '').trim(),
                sp => {
                    sp.style.border          = '';
                    sp.style.borderRadius    = '';
                    sp.style.padding         = '';
                    sp.style.boxDecorationBreak = '';
                    sp.style.webkitBoxDecorationBreak = '';
                }
            );
        } else {
            // Appliquer l'encadrement
            sel.removeAllRanges(); sel.addRange(savedRange);
            const span = document.createElement('span');
            span.style.border = '2.5px solid ' + _borderColor;
            span.style.borderRadius = '2px';
            span.style.padding = '0 2px';
            span.style.boxDecorationBreak = 'clone';
            span.style.webkitBoxDecorationBreak = 'clone';
            try { savedRange.surroundContents(span); }
            catch(_) {
                const frag = savedRange.extractContents();
                span.appendChild(frag);
                savedRange.insertNode(span);
            }
        }
        saveBoard();
    });
    borderGroup.appendChild(borderBtn);

    const seyesBdCpickId = 'seyes-bd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const bdColorWrap = document.createElement('div');
    bdColorWrap.className = 'cpick-wrap';
    bdColorWrap.id = 'cpick-' + seyesBdCpickId;
    bdColorWrap.title = "Couleur d'encadrement";
    bdColorWrap.innerHTML = `
        <div class="cpick-swatch" style="background:#e05050;width:14px;height:14px;border-radius:3px;border:1.5px solid #d0dcea;cursor:pointer;flex-shrink:0;margin-bottom:-1px;"
             onclick="cpickOpen('${seyesBdCpickId}', this)"></div>
        <div class="cpick-popup" id="cpick-pop-${seyesBdCpickId}"></div>
    `;
    bdColorWrap.addEventListener('mousedown', () => {
        const sel = window.getSelection();
        _seyesSavedSelection = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    });
    borderGroup.appendChild(bdColorWrap);
    toolbar.appendChild(borderGroup);
    document.body.appendChild(bdColorWrap.querySelector('.cpick-popup'));

    // Séparateur
    const sep4 = document.createElement('div');
    sep4.className = 'seyes-sep';
    toolbar.appendChild(sep4);

    // Annuler / Refaire
    const undoBtn = document.createElement('button');
    undoBtn.className = 'seyes-tool-btn';
    undoBtn.title = 'Annuler (Ctrl+Z)';
    undoBtn.innerHTML = '↩';
    undoBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const activeEd = document.activeElement;
        const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
        targetEd.focus();
        document.execCommand('undo', false, null);
        saveBoard();
    });
    toolbar.appendChild(undoBtn);

    const redoBtn = document.createElement('button');
    redoBtn.className = 'seyes-tool-btn';
    redoBtn.title = 'Refaire (Ctrl+Y)';
    redoBtn.innerHTML = '↪';
    redoBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const activeEd = document.activeElement;
        const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
        targetEd.focus();
        document.execCommand('redo', false, null);
        saveBoard();
    });
    toolbar.appendChild(redoBtn);

    // Séparateur
    const sep5 = document.createElement('div');
    sep5.className = 'seyes-sep';
    toolbar.appendChild(sep5);

    // Effacer tout
    const clearBtn = document.createElement('button');
    clearBtn.className = 'seyes-tool-btn';
    clearBtn.textContent = '🗑️';
    clearBtn.title = 'Effacer tout le texte';
    clearBtn.addEventListener('click', () => {
        // Modale de confirmation
        const overlay = document.createElement('div');
        overlay.className = 'seyes-modal-overlay';
        overlay.innerHTML = `
            <div class="seyes-modal">
                <div class="seyes-modal-icon">🗑️</div>
                <div class="seyes-modal-title">Effacer tout le texte ?</div>
                <div class="seyes-modal-body">Cette action supprimera tout ce qui a été écrit,<br>y compris dans la marge.</div>
                <div class="seyes-modal-btns">
                    <button class="seyes-modal-btn seyes-modal-btn-cancel">Annuler</button>
                    <button class="seyes-modal-btn seyes-modal-btn-confirm">Effacer</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Focus sur Annuler par défaut
        const cancelBtn = overlay.querySelector('.seyes-modal-btn-cancel');
        const confirmBtn = overlay.querySelector('.seyes-modal-btn-confirm');
        cancelBtn.focus();
        cancelBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            editor.innerHTML = '';
            editorMarge.innerHTML = '';
            editor.focus();
            saveBoard();
        });
        // Fermer avec Échap
        overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
    });
    toolbar.appendChild(clearBtn);

    // ── Zone d'écriture ───────────────────────────────────────────────────
    const writingArea = document.createElement('div');
    writingArea.className = 'seyes-writing-area';

    const editor = document.createElement('div');
    editor.className = 'seyes-editor';
    editor.contentEditable = 'true';
    editor.dataset.placeholder = 'ou ici…';
    editor.setAttribute('spellcheck', 'true');

    // Taille initiale : Normal (36px / 64px line-height)
    const LH = 64;
    const pt = _seyesPaddingTop(36, LH);
    editor.style.fontSize   = '36px';
    editor.style.lineHeight = LH + 'px';
    editor.style.paddingTop = pt + 'px';

    // ── Fond seyes SVG tile ───────────────────────────────────────────────
    // Deux SVG tiles appliqués sur writingArea :
    // - svgMarge (sans colonnes) couvre toute la largeur depuis x=0
    // - svgCols  (avec colonnes) couvre depuis x=256px
    // offsetY = pt - (LH - 1) place la grande ligne (bas du tile) sur la baseline
    function _seyesMakeBg() {
        const il = LH / 4;

        // Tile SVG 64×64 : lignes horizontales uniquement (pas de colonne)
        const svgLignes = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${LH}" height="${LH}">`,
            `<line x1="0" y1="${il * 1}" x2="${LH}" y2="${il * 1}" stroke="#c8d8eb" stroke-width="0.7"/>`,
            `<line x1="0" y1="${il * 2}" x2="${LH}" y2="${il * 2}" stroke="#c8d8eb" stroke-width="0.7"/>`,
            `<line x1="0" y1="${il * 3}" x2="${LH}" y2="${il * 3}" stroke="#c8d8eb" stroke-width="0.7"/>`,
            `<line x1="0" y1="${LH - 0.5}" x2="${LH}" y2="${LH - 0.5}" stroke="#9aadbe" stroke-width="1"/>`,
            `</svg>`
        ].join('');

        // Tile SVG 64×64 : colonne verticale uniquement (pas de lignes horizontales)
        const svgCols = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${LH}" height="${LH}">`,
            `<line x1="${LH - 0.5}" y1="0" x2="${LH - 0.5}" y2="${LH}" stroke="#c8d8eb" stroke-width="0.8"/>`,
            `</svg>`
        ].join('');

        const enc = (svg) => 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
        const urlLignes = enc(svgLignes);
        const urlCols   = enc(svgCols);

        // Ligne rouge de marge
        const urlRed = 'linear-gradient(to right, transparent 254px, #e05050 254px, #e05050 256px, transparent 256px)';
        // Masque opaque sur la marge (0→256px) placé AU-DESSUS du tile colonnes
        // mais EN-DESSOUS du tile lignes → efface les colonnes dans la marge
        // sans toucher aux lignes horizontales qui sont dans une couche supérieure
        const urlMaskCols = 'linear-gradient(to right, #fafcff 256px, transparent 256px)';

        const offsetY = pt - LH + 170;

        // Ordre des couches (de dessus vers dessous) :
        // 1. urlRed      – ligne rouge (no-repeat, au-dessus de tout)
        // 2. urlLignes   – lignes horizontales (repeat partout, marge incluse)
        // 3. urlMaskCols – masque blanc 0→256px (no-repeat, cache les colonnes dans la marge)
        // 4. urlCols     – colonnes verticales (repeat depuis x=0)
        writingArea.style.backgroundImage      = `${urlRed}, ${urlLignes}, ${urlMaskCols}, ${urlCols}`;
        writingArea.style.backgroundSize       = `100% 100%, ${LH}px ${LH}px, 100% 100%, ${LH}px ${LH}px`;
        writingArea.style.backgroundRepeat     = 'no-repeat, repeat, no-repeat, repeat';
        writingArea.style.backgroundPosition   = `0 0, 0 ${offsetY}px, 0 0, 0 ${offsetY}px`;
        writingArea.style.backgroundAttachment = 'local, local, local, local';
    }
    _seyesMakeBg();

    writingArea.appendChild(editor);

    // ── Zone d'écriture dans la marge ─────────────────────────────────────
    const editorMarge = document.createElement('div');
    editorMarge.className = 'seyes-editor-marge';
    editorMarge.contentEditable = 'true';
    editorMarge.dataset.placeholder = 'ici…';
    editorMarge.setAttribute('spellcheck', 'true');
    editorMarge.style.fontSize   = '36px';
    editorMarge.style.lineHeight = '64px';
    editorMarge.style.paddingTop = _seyesPaddingTop(36, 64) + 'px';
    writingArea.appendChild(editorMarge);

    // Calque transparent qui capte les clics dans la zone marge
    const margeCatcher = document.createElement('div');
    margeCatcher.className = 'seyes-marge-catcher';
    writingArea.appendChild(margeCatcher);

    container.appendChild(writingArea);

    // ── Handle redimensionnement ─────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'seyes-resize-handle';
    container.appendChild(resizeHandle);

    // ── Footer (barre d'outils) ──────────────────────────────────────────
    container.appendChild(footer);

    widget.appendChild(container);

    // ── Canvas d'annotation draw.js ───────────────────────────────────────
    // Le canvas est dans writingArea (suit le scroll naturellement).
    // Pas de transform ni de synchronisation complexe : writingArea n'est
    // plus zoomée par transform:scale, le contenu est zoomé directement
    // (font-size, line-height, fond SVG). Le canvas reste à taille naturelle.

    // Faux pdf-canvas-wrap (toujours display:block) pour satisfaire _findActivePdfWidget.
    const _seyesFakeWrap = document.createElement('div');
    _seyesFakeWrap.className = 'pdf-canvas-wrap';
    _seyesFakeWrap.style.cssText = 'display:block;position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:3;';

    // Proxy scrollLeft / scrollTop → redirige vers writingArea.
    Object.defineProperty(_seyesFakeWrap, 'scrollLeft', {
        get: () => writingArea.scrollLeft,
        set: (v) => { writingArea.scrollLeft = v; },
        configurable: true
    });
    Object.defineProperty(_seyesFakeWrap, 'scrollTop', {
        get: () => writingArea.scrollTop,
        set: (v) => { writingArea.scrollTop = v; },
        configurable: true
    });

    const annotCanvas = document.createElement('canvas');
    annotCanvas.className = 'pdf-annot-canvas';
    annotCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:10;touch-action:none;display:block;';

    // Overlay transparent qui capte TOUS les events quand le mode annotation est actif.
    const _seyesAnnotOverlay = document.createElement('div');
    _seyesAnnotOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;z-index:20;pointer-events:none;touch-action:none;cursor:inherit;';

    _seyesFakeWrap.appendChild(annotCanvas);
    _seyesFakeWrap.appendChild(_seyesAnnotOverlay);
    writingArea.appendChild(_seyesFakeWrap);

    let _seyesCurrentZoom = 1.0;

    function _seyesSyncCanvas() {
        const w = writingArea.offsetWidth;
        const h = writingArea.scrollHeight;
        if (w === 0 || h === 0) return;
        _seyesFakeWrap.style.height     = h + 'px';
        _seyesAnnotOverlay.style.height = h + 'px';
        annotCanvas.style.height        = h + 'px';
        const dpr  = window.devicePixelRatio || 1;
        const newW = Math.round(w * dpr);
        const newH = Math.round(h * dpr);
        if (annotCanvas.width !== newW || annotCanvas.height !== newH) {
            annotCanvas.width  = newW;
            annotCanvas.height = newH;
            _seyesRedrawAnnotations();
        }
    }

    function _seyesResizeAnnotCanvas() { _seyesSyncCanvas(); }

    // ── Données d'annotation (strokes normalisés 0→1) ─────────────────────
    const _seyesAnnotLayer = { strokes: [], history: [], redoHistory: [] };
    let   _seyesIsDrawing  = false;
    let   _seyesCurStroke  = null;
    let   _seyesSnapshot   = null; // ImageData snapshot des strokes validés

    const actx = annotCanvas.getContext('2d');

    // Coordonnées normalisées relatives au contenu à zoom=1
    // → une annotation tracée sur un mot reste sur ce mot quel que soit le zoom
    function _seyesContentW() { return writingArea.offsetWidth  / _seyesCurrentZoom; }
    function _seyesContentH() { return writingArea.scrollHeight / _seyesCurrentZoom; }

    function _seyesToNorm(px, py) {
        // px/py sont en pixels canvas (depuis getBoundingClientRect du canvas)
        // On ramène d'abord en pixels contenu zoomé, puis en pixels zoom=1
        const dpr = window.devicePixelRatio || 1;
        const cw = writingArea.offsetWidth;
        const ch = writingArea.scrollHeight;
        return {
            x: (px / dpr) / cw,
            y: (py / dpr) / ch
        };
    }
    function _seyesFromNorm(nx, ny) {
        const dpr = window.devicePixelRatio || 1;
        const cw = writingArea.offsetWidth;
        const ch = writingArea.scrollHeight;
        return {
            x: nx * cw * dpr,
            y: ny * ch * dpr
        };
    }

    function _seyesBuildSnapshot() {
        _seyesSnapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
    }

    function _seyesInvalidateSnapshot() {
        _seyesSnapshot = null;
    }

    function _seyesDrawStroke(ctx, stroke) {
        const cw = annotCanvas.width;
        const ch = annotCanvas.height;
        const displayW = annotCanvas.getBoundingClientRect().width  || cw;
        const sizeScaled = stroke.size * cw / displayW;

        if (stroke.tool === 'text') {
            const pos = _seyesFromNorm(stroke.nx, stroke.ny);
            const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * cw / 600);
            ctx.save();
            ctx.font      = `${fontSize}px 'Segoe UI', sans-serif`;
            ctx.fillStyle = stroke.color;
            ctx.globalAlpha = 1;
            const lines = (stroke.text || '').split('\n');
            if (stroke.rotation) {
                const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
                const textH = lines.length * fontSize * 1.3;
                ctx.translate(pos.x + textW/2, pos.y + textH/2);
                ctx.rotate(stroke.rotation);
                ctx.translate(-(pos.x + textW/2), -(pos.y + textH/2));
            }
            lines.forEach((line, i) => ctx.fillText(line, pos.x, pos.y + (i + 1) * fontSize * 1.3));
            ctx.restore();
            return;
        }

        if (stroke.tool === 'figure') {
            if (!stroke.pts || stroke.pts.length < 2) return;
            const pxPts = stroke.pts.map(p => _seyesFromNorm(p.x, p.y));
            ctx.save();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth   = sizeScaled;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
            ctx.globalAlpha = 1;
            ctx.beginPath();
            pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
            if (stroke.fillColor && stroke.fillOpacity > 0) {
                ctx.globalAlpha = stroke.fillOpacity;
                ctx.fillStyle   = stroke.fillColor;
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        if (!stroke.pts || stroke.pts.length === 0) return;
        const pxPts = stroke.pts.map(p => _seyesFromNorm(p.x, p.y));
        ctx.save();

        if (stroke.dot) {
            ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
            ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
            const r = Math.max(1, sizeScaled / 2);
            ctx.beginPath();
            ctx.arc(pxPts[0].x, pxPts[0].y, r, 0, Math.PI * 2);
            ctx.fillStyle = stroke.color;
            ctx.fill();
        } else if (stroke.tool === 'highlighter') {
            const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
            ctx.globalAlpha = 0.35;
            ctx.globalCompositeOperation = 'multiply';
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth   = lw;
            ctx.lineCap     = 'butt';
            ctx.lineJoin    = 'round';
            ctx.beginPath();
            pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
        } else if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = sizeScaled * 2;
            ctx.lineCap   = 'round';
            ctx.lineJoin  = 'round';
            ctx.beginPath();
            pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
        } else {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth   = sizeScaled;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
            ctx.beginPath();
            pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }
        ctx.restore();
    }

    function _seyesRedrawAnnotations() {
        actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
        if (_seyesAnnotLayer._snapshot) {
            actx.putImageData(_seyesAnnotLayer._snapshot, 0, 0);
        } else {
            _seyesAnnotLayer.strokes.forEach(s => _seyesDrawStroke(actx, s));
        }
    }

    // ── _pdfAnnotAPI : interface attendue par draw.js ──────────────────────
    widget._pdfAnnotAPI = {
        startStroke(color, size, tool, px, py) {
            const norm = _seyesToNorm(px, py);
            _seyesCurStroke = { tool, color, size, pts: [norm] };
            _seyesIsDrawing = true;
            _seyesBuildSnapshot();
        },
        continueStroke(color, size, tool, px, py) {
            if (!_seyesIsDrawing || !_seyesCurStroke) return;
            const norm = _seyesToNorm(px, py);
            const pts  = _seyesCurStroke.pts;
            const prev = pts[pts.length - 1];
            pts.push(norm);
            _seyesCurStroke.color = color;
            _seyesCurStroke.size  = size;
            _seyesCurStroke.tool  = tool;

            const cw      = annotCanvas.width;
            const displayW = annotCanvas.getBoundingClientRect().width || 600;
            const sizeScaled = size * cw / displayW;
            const pPrev = _seyesFromNorm(prev.x, prev.y);
            const pCur  = _seyesFromNorm(norm.x,  norm.y);

            actx.save();
            if (tool === 'highlighter') {
                if (pts.length % 20 === 0) {
                    if (_seyesSnapshot) actx.putImageData(_seyesSnapshot, 0, 0);
                    else actx.clearRect(0, 0, cw, annotCanvas.height);
                    const pxPts = pts.map(p => _seyesFromNorm(p.x, p.y));
                    const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                    actx.globalAlpha = 0.35;
                    actx.globalCompositeOperation = 'multiply';
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
            if (!_seyesIsDrawing || !_seyesCurStroke) return;
            _seyesIsDrawing = false;
            if (_seyesCurStroke.pts.length === 1) _seyesCurStroke.dot = true;
            _seyesAnnotLayer.redoHistory = [];
            _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
            if (_seyesAnnotLayer.history.length > 30) _seyesAnnotLayer.history.shift();
            _seyesAnnotLayer.strokes.push(_seyesCurStroke);
            _seyesCurStroke = null;
            _seyesRedrawAnnotations();
            _seyesInvalidateSnapshot();
        },
        undo() {
            if (_seyesAnnotLayer.history.length > 0) {
                _seyesAnnotLayer.redoHistory.push([..._seyesAnnotLayer.strokes]);
                _seyesAnnotLayer.strokes = _seyesAnnotLayer.history.pop();
            } else if (_seyesAnnotLayer.strokes.length > 0) {
                _seyesAnnotLayer.redoHistory.push([..._seyesAnnotLayer.strokes]);
                _seyesAnnotLayer.strokes.pop();
            }
            _seyesAnnotLayer._snapshot = null;
            _seyesRedrawAnnotations();
        },
        redo() {
            if (_seyesAnnotLayer.redoHistory.length > 0) {
                _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
                _seyesAnnotLayer.strokes = _seyesAnnotLayer.redoHistory.pop();
                _seyesAnnotLayer._snapshot = null;
                _seyesRedrawAnnotations();
            }
        },
        clear() {
            if (_seyesAnnotLayer.strokes.length > 0) {
                _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
            }
            _seyesAnnotLayer.strokes = [];
            _seyesAnnotLayer._snapshot = null;
            _seyesAnnotLayer.redoHistory = [];
            _seyesRedrawAnnotations();
        },
        getAnnotCanvas()  { return annotCanvas; },
        getPdfDoc()       { return null; },
        getTotalPages()   { return 1; },
        getAnnotLayers()  { return { 1: _seyesAnnotLayer }; },
        drawStrokeOn(ctx, stroke, cw) { _seyesDrawStroke(ctx, stroke); },
        addTextStroke(text, color, size, px, py) {
            const norm = _seyesToNorm(px, py);
            const stroke = { tool: 'text', color, size, text, nx: norm.x, ny: norm.y };
            _seyesAnnotLayer.redoHistory = [];
            _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
            if (_seyesAnnotLayer.history.length > 30) _seyesAnnotLayer.history.shift();
            _seyesAnnotLayer.strokes.push(stroke);
            _seyesRedrawAnnotations();
        },
        previewFigure(color, size, pts, fillColor, fillOpacity) {
            _seyesRedrawAnnotations();
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
            const normPts = pts.map(p => _seyesToNorm(p.x, p.y));
            const stroke = { tool: 'figure', color, size, pts: normPts };
            if (fillColor && fillOpacity > 0) { stroke.fillColor = fillColor; stroke.fillOpacity = fillOpacity; }
            _seyesAnnotLayer.redoHistory = [];
            _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
            if (_seyesAnnotLayer.history.length > 30) _seyesAnnotLayer.history.shift();
            _seyesAnnotLayer.strokes.push(stroke);
            _seyesRedrawAnnotations(); _seyesInvalidateSnapshot();
        },
        previewEraser(px, py, r) {
            if (_seyesSnapshot) actx.putImageData(_seyesSnapshot, 0, 0);
            else _seyesRedrawAnnotations();
            const cw = annotCanvas.width;
            const displayW = annotCanvas.getBoundingClientRect().width || 600;
            const rScaled = r * cw / displayW;
            actx.save();
            actx.globalCompositeOperation = 'source-over';
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
            _seyesAnnotLayer._snapshot = imgData;
            _seyesAnnotLayer.strokes = [];
        },
        redrawAnnotations() { _seyesRedrawAnnotations(); },
        drawTextSelection(index) {
            const s = _seyesAnnotLayer.strokes[index];
            if (!s || s.tool !== 'text') return;
            if (_seyesSnapshot) actx.putImageData(_seyesSnapshot, 0, 0);
            else _seyesRedrawAnnotations();
            _seyesDrawStroke(actx, s);
        },
        moveTextStroke(index, px, py) {
            const norm = _seyesToNorm(px, py);
            if (!_seyesAnnotLayer.strokes[index]) return;
            _seyesAnnotLayer.strokes[index] = { ..._seyesAnnotLayer.strokes[index], nx: norm.x, ny: norm.y };
            if (_seyesSnapshot) { actx.putImageData(_seyesSnapshot, 0, 0); _seyesDrawStroke(actx, _seyesAnnotLayer.strokes[index]); }
            else _seyesRedrawAnnotations();
        },
        saveTextMove(index) {
            if (!_seyesAnnotLayer.strokes[index]) return;
            _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
            if (_seyesAnnotLayer.history.length > 30) _seyesAnnotLayer.history.shift();
            _seyesInvalidateSnapshot();
        },
        rotateTextStroke(index, angle) {
            if (!_seyesAnnotLayer.strokes[index]) return;
            _seyesAnnotLayer.strokes[index] = { ..._seyesAnnotLayer.strokes[index], rotation: angle };
            if (_seyesSnapshot) { actx.putImageData(_seyesSnapshot, 0, 0); _seyesDrawStroke(actx, _seyesAnnotLayer.strokes[index]); }
            else _seyesRedrawAnnotations();
        },
        saveTextTransform(index) {
            if (!_seyesAnnotLayer.strokes[index]) return;
            _seyesAnnotLayer.history.push([..._seyesAnnotLayer.strokes]);
            if (_seyesAnnotLayer.history.length > 30) _seyesAnnotLayer.history.shift();
            _seyesInvalidateSnapshot();
        },
        detachNativeEvents() {},  // rien à détacher côté seyes
    };

    // Dimensionner le canvas au premier rendu puis à chaque resize/contenu
    requestAnimationFrame(() => _seyesResizeAnnotCanvas());
    const _seyesResizeObs = new ResizeObserver(() => _seyesResizeAnnotCanvas());
    _seyesResizeObs.observe(writingArea);
    _seyesResizeObs.observe(editor);       // l'éditeur grandit quand on tape
    _seyesResizeObs.observe(editorMarge);  // idem pour la marge

    // ── Activation / désactivation du mode annotation ─────────────────────
    // draw.js ajoute la classe 'pdf-annot-target' sur le widget quand il active
    // l'annotation. On surveille ce changement pour :
    //   - activer l'overlay (capte les events, bloque les contenteditable)
    //   - désactiver les contenteditable (sinon ils volent le focus et les events)
    //   - inverser à la désactivation
    function _seyesEnterAnnotMode() {
        // Overlay capture tous les events
        _seyesAnnotOverlay.style.pointerEvents = 'auto';
        // Désactiver les éditeurs de texte
        editor.contentEditable      = 'false';
        editorMarge.contentEditable = 'false';
        editor.style.pointerEvents      = 'none';
        editorMarge.style.pointerEvents = 'none';
        margeCatcher.style.pointerEvents = 'none';
        // Désactiver aussi le footer pour éviter les conflits
        footer.style.pointerEvents = 'none';
    }
    function _seyesLeaveAnnotMode() {
        _seyesAnnotOverlay.style.pointerEvents = 'none';
        editor.contentEditable      = 'true';
        editorMarge.contentEditable = 'true';
        editor.style.pointerEvents      = '';
        editorMarge.style.pointerEvents = '';
        margeCatcher.style.pointerEvents = '';
        footer.style.pointerEvents = '';
    }

    const _seyesAnnotObserver = new MutationObserver(() => {
        if (widget.classList.contains('pdf-annot-target')) {
            _seyesEnterAnnotMode();
        } else {
            _seyesLeaveAnnotMode();
        }
    });
    _seyesAnnotObserver.observe(widget, { attributes: true, attributeFilter: ['class'] });

    // ── Interactions éditeur ──────────────────────────────────────────────

    // Éditeur principal (zone après la marge)
    editor.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    editor.addEventListener('click',     (e) => { e.stopPropagation(); editor.focus(); });
    editor.addEventListener('keydown',   (e) => { e.stopPropagation(); });
    editor.addEventListener('input',     ()  => { saveBoard(); });
    editor.addEventListener('focus', () => {
        editorMarge.classList.remove('active');
        margeCatcher.classList.remove('hidden');
    });

    // Calque marge-catcher : capte le premier clic dans la zone marge
    margeCatcher.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        editorMarge.classList.add('active');
        margeCatcher.classList.add('hidden');
        editorMarge.focus();
        // Placer le curseur à la position exacte du clic
        const placeCaretAt = (x, y) => {
            if (document.caretRangeFromPoint) {
                const range = document.caretRangeFromPoint(x, y);
                if (range) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
            } else if (document.caretPositionFromPoint) {
                const pos = document.caretPositionFromPoint(x, y);
                if (pos) {
                    const range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.collapse(true);
                    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
                }
            }
        };
        placeCaretAt(e.clientX, e.clientY);
    });

    // Éditeur marge
    editorMarge.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    editorMarge.addEventListener('click',     (e) => { e.stopPropagation(); });
    editorMarge.addEventListener('keydown',   (e) => { e.stopPropagation(); });
    editorMarge.addEventListener('input',     ()  => { saveBoard(); });
    editorMarge.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== editorMarge) {
                editorMarge.classList.remove('active');
                margeCatcher.classList.remove('hidden');
            }
        }, 100);
    });

    // ── Images collées (presse-papier) ────────────────────────────────────
    // • Le texte reste collé en texte brut.
    // • Si le presse-papier ne contient qu'une image (capture d'écran, "copier l'image"…),
    //   elle est posée LIBREMENT sur la feuille (position: absolute dans l'éditeur) :
    //   data-x / data-y = position, data-w = largeur, data-ratio = ratio l/h (tout à zoom 100 %).
    //   Elle ne suit ni les lignes ni le texte ; le zoom la met à l'échelle.
    //   (Anciennes images « dans le texte » : elles restent alignées sur le lignage
    //   jusqu'à ce qu'on les déplace ; elles deviennent alors libres.)
    // • Glisser l'image = la déplacer. Clic = cadre de sélection + poignée ronde (bas droite).
    // • Suppr / Retour arrière supprime l'image sélectionnée.
    const SEYES_IMG_MAX_SRC_W = 1200;   // largeur max des pixels conservés (allège le JSON)
    const SEYES_IMG_MAX_SRC_H = 1600;
    const SEYES_IMG_MIN_W = 24;         // largeur mini (px écran)
    let _seyesSelImg = null;
    let _seyesResizing = false;

    const imgFrame = document.createElement('div');
    imgFrame.className = 'seyes-img-frame';
    const imgHandle = document.createElement('div');
    imgHandle.className = 'seyes-img-handle';
    imgHandle.title = 'Redimensionner';
    imgFrame.appendChild(imgHandle);
    writingArea.appendChild(imgFrame);

    // Firefox : désactive ses poignées natives (on a les nôtres)
    try { document.execCommand('enableObjectResizing', false, false); } catch (_) {}

    function _seyesImgLineH()  { return Math.round(LH * ZOOM_STEPS[_zoomIdx]); }
    function _seyesImgAvailW() { return Math.max(40, editor.clientWidth - 32); } // padding 16+16

    function _seyesSizeImg(img) {
        const g = _seyesImgGeom(img, ZOOM_STEPS[_zoomIdx], _seyesImgLineH());
        img.style.width  = g.w + 'px';
        img.style.height = g.h + 'px';
        if (g.free) {
            img.style.position  = 'absolute';
            img.style.left      = g.x + 'px';
            img.style.top       = g.y + 'px';
            img.style.margin    = '0';
        } else {
            img.style.marginTop = g.mt + 'px';
        }
    }

    // Détache une image « dans le texte » pour la rendre libre (position figée là où elle est)
    function _seyesFreeImg(img) {
        if (img.dataset.x !== undefined) return;
        const z = ZOOM_STEPS[_zoomIdx];
        _seyesImgGeom(img, z, _seyesImgLineH());          // migre data-lines → data-w si besoin
        img.dataset.x = (img.offsetLeft / z).toFixed(1);
        img.dataset.y = (img.offsetTop  / z).toFixed(1);
        _seyesSizeImg(img);
    }

    function _seyesApplyImgSizes() {
        editor.querySelectorAll('img[data-ratio]').forEach(_seyesSizeImg);
        _seyesUpdateImgFrame();
    }

    function _seyesDeselectImg() {
        _seyesSelImg = null;
        imgFrame.style.display = 'none';
    }

    function _seyesUpdateImgFrame() {
        if (!_seyesSelImg) return;
        if (!editor.contains(_seyesSelImg)) { _seyesDeselectImg(); return; }
        // offsetLeft/Top : indépendant d'une éventuelle rotation du widget
        imgFrame.style.display = 'block';
        imgFrame.style.left   = (editor.offsetLeft + _seyesSelImg.offsetLeft) + 'px';
        imgFrame.style.top    = (editor.offsetTop  + _seyesSelImg.offsetTop)  + 'px';
        imgFrame.style.width  = _seyesSelImg.offsetWidth  + 'px';
        imgFrame.style.height = _seyesSelImg.offsetHeight + 'px';
    }

    function _seyesSelectImg(img, nativeSelect) {
        _seyesSelImg = img;
        if (nativeSelect) {
            // Sélection native de l'image : Suppr / Retour arrière la supprime
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNode(img);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        _seyesUpdateImgFrame();
    }

    // Lecture + réduction de l'image (canvas) → data URL
    function _seyesLoadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const im = new Image();
            im.onload = () => {
                const k  = Math.min(1, SEYES_IMG_MAX_SRC_W / im.naturalWidth, SEYES_IMG_MAX_SRC_H / im.naturalHeight);
                const cw = Math.max(1, Math.round(im.naturalWidth  * k));
                const ch = Math.max(1, Math.round(im.naturalHeight * k));
                const cv = document.createElement('canvas');
                cv.width = cw; cv.height = ch;
                cv.getContext('2d').drawImage(im, 0, 0, cw, ch);
                let dataUrl;
                if (file.type === 'image/jpeg') {
                    dataUrl = cv.toDataURL('image/jpeg', 0.88);
                } else {
                    dataUrl = cv.toDataURL('image/png');
                    if (dataUrl.length > 1500000) {   // PNG trop lourd → JPEG sur fond blanc
                        const c2 = document.createElement('canvas');
                        c2.width = cw; c2.height = ch;
                        const x2 = c2.getContext('2d');
                        x2.fillStyle = '#fff'; x2.fillRect(0, 0, cw, ch);
                        x2.drawImage(im, 0, 0, cw, ch);
                        dataUrl = c2.toDataURL('image/jpeg', 0.85);
                    }
                }
                URL.revokeObjectURL(url);
                resolve({ dataUrl, w: cw, h: ch });
            };
            im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')); };
            im.src = url;
        });
    }

    function _seyesInsertImageFile(file) {
        const sel = window.getSelection();
        const savedRange = (sel.rangeCount && editor.contains(sel.anchorNode))
            ? sel.getRangeAt(0).cloneRange() : null;

        _seyesLoadImage(file).then(({ dataUrl, w, h }) => {
            const z  = ZOOM_STEPS[_zoomIdx];
            const lh = _seyesImgLineH();
            const r  = w / h;

            // Taille initiale (largeur à zoom 100 %) : taille réelle, 5 grandes lignes de haut max,
            // et doit tenir dans la largeur de l'éditeur
            let w0 = Math.min(h, 5 * LH) * r;
            w0 = Math.min(w0, _seyesImgAvailW() / z);
            w0 = Math.max(SEYES_IMG_MIN_W / z, Math.round(w0 * 10) / 10);
            const g = _seyesImgGeom({ dataset: { w: w0, ratio: r } }, z, lh);

            // Position de départ : là où était le curseur (sinon coin haut-gauche visible)
            const eRect = editor.getBoundingClientRect();
            const k  = (eRect.width / editor.offsetWidth) || 1;
            let px = 16, py = writingArea.scrollTop + 8;
            if (savedRange) {
                const rc = savedRange.getClientRects()[0] || savedRange.getBoundingClientRect();
                if (rc && (rc.width || rc.height)) {
                    px = (rc.left - eRect.left) / k;
                    py = (rc.top  - eRect.top)  / k;
                }
            }
            px = Math.max(0, Math.min(px, editor.offsetWidth - g.w));
            py = Math.max(0, py);
            const x0 = Math.round(px / z * 10) / 10;
            const y0 = Math.round(py / z * 10) / 10;

            // Insertion (annulable avec Ctrl+Z) en fin de contenu : l'image est absolue,
            // sa place dans le DOM n'a aucun effet sur le texte ; le curseur revient où il était.
            editor.focus();
            const s = window.getSelection();
            const end = document.createRange();
            end.selectNodeContents(editor);
            end.collapse(false);
            s.removeAllRanges();
            s.addRange(end);

            const uid = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const html = '<img src="' + dataUrl + '" alt="image collée" draggable="false"' +
                ' data-seyes-uid="' + uid + '"' +
                ' data-w="' + w0 + '" data-ratio="' + r.toFixed(4) + '"' +
                ' data-x="' + x0 + '" data-y="' + y0 + '"' +
                ' style="position:absolute;margin:0;left:' + Math.round(x0 * z) + 'px;top:' + Math.round(y0 * z) + 'px;' +
                'width:' + g.w + 'px;height:' + g.h + 'px;">';
            document.execCommand('insertHTML', false, html);

            const img = editor.querySelector('img[data-seyes-uid="' + uid + '"]');
            s.removeAllRanges();
            if (savedRange) {
                s.addRange(savedRange);
            } else if (img) {
                const before = document.createRange();
                before.setStartBefore(img);
                before.collapse(true);
                s.addRange(before);
            }
            if (img) _seyesSelectImg(img, false);   // cadre + poignée
            saveBoard();
        }).catch(() => {
            alert("Impossible de lire l'image du presse-papier.");
        });
    }

    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const cd = e.clipboardData || window.clipboardData;
        const text = cd.getData('text/plain');

        // Pas de texte utilisable + une image dans le presse-papier → on colle l'image
        if (!text || !text.trim()) {
            let file = null;
            const items = Array.from(cd.items || []);
            const it = items.find(x => x.kind === 'file' && x.type.startsWith('image/'));
            if (it) file = it.getAsFile();
            if (!file && cd.files && cd.files.length) {
                file = Array.from(cd.files).find(f => f.type.startsWith('image/')) || null;
            }
            if (file) { _seyesInsertImageFile(file); return; }
        }
        // Sinon : texte brut uniquement (comportement d'origine)
        document.execCommand('insertText', false, text);
    });

    // Déplacement d'une image : glisser-déposer libre sur la feuille
    editor.addEventListener('mousedown', (e) => {
        // Empêche le glisser-déposer / la sélection natifs du navigateur sur l'image
        if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });
    editor.addEventListener('pointerdown', (e) => {
        const img = e.target;
        if (!img || img.tagName !== 'IMG' || e.button > 0) return;
        editor.focus();
        _seyesFreeImg(img);
        _seyesSelectImg(img, true);
        _seyesResizing = true;   // ignore le blur pendant le glissement
        const z      = ZOOM_STEPS[_zoomIdx];
        const startX = e.clientX, startY = e.clientY;
        const x0 = img.offsetLeft, y0 = img.offsetTop;
        const k  = (img.getBoundingClientRect().width / (img.offsetWidth || 1)) || 1;
        let moved = false;
        try { img.setPointerCapture(e.pointerId); } catch (_) {}

        const onMove = (ev) => {
            const dx = (ev.clientX - startX) / k, dy = (ev.clientY - startY) / k;
            if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;   // évite un déplacement au simple clic
            moved = true;
            const nx = Math.max(0, Math.min(editor.offsetWidth - img.offsetWidth, x0 + dx));
            const ny = Math.max(0, y0 + dy);
            img.dataset.x = (nx / z).toFixed(1);
            img.dataset.y = (ny / z).toFixed(1);
            img.style.left = Math.round(nx) + 'px';
            img.style.top  = Math.round(ny) + 'px';
            _seyesUpdateImgFrame();
        };
        const onUp = (ev) => {
            img.removeEventListener('pointermove', onMove);
            img.removeEventListener('pointerup', onUp);
            img.removeEventListener('pointercancel', onUp);
            try { img.releasePointerCapture(ev.pointerId); } catch (_) {}
            _seyesResizing = false;
            if (moved) saveBoard();
        };
        img.addEventListener('pointermove', onMove);
        img.addEventListener('pointerup', onUp);
        img.addEventListener('pointercancel', onUp);
    });

    // Sélection d'une image au clic
    editor.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'IMG') _seyesSelectImg(e.target, true);
        else _seyesDeselectImg();
    });
    editor.addEventListener('keydown', (e) => {
        if (!_seyesSelImg) return;
        // Frappe ou flèches : on quitte le mode "image sélectionnée"
        if ((e.key.length === 1 && !e.ctrlKey && !e.metaKey) || /^Arrow/.test(e.key)) _seyesDeselectImg();
    });
    editor.addEventListener('blur', () => { if (!_seyesResizing) _seyesDeselectImg(); });

    // Le cadre suit l'image (frappe, suppression, undo, chargement, redimensionnement du widget…)
    new MutationObserver(() => _seyesUpdateImgFrame())
        .observe(editor, { childList: true, subtree: true, characterData: true });
    if (window.ResizeObserver) new ResizeObserver(() => _seyesUpdateImgFrame()).observe(editor);

    // Poignée de redimensionnement (libre, ratio conservé)
    ['mousedown', 'click'].forEach(t => imgFrame.addEventListener(t, (e) => { e.stopPropagation(); e.preventDefault(); }));
    imgHandle.addEventListener('pointerdown', (e) => {
        if (!_seyesSelImg) return;
        // (le mousedown compat est annulé par imgFrame → pas de perte de focus ni de sélection texte)
        e.stopPropagation();
        _seyesResizing = true;
        const img    = _seyesSelImg;
        const startX = e.clientX, startY = e.clientY;
        const startW = img.offsetWidth || 1, startH = img.offsetHeight || 1;
        const k      = (img.getBoundingClientRect().width / startW) || 1;   // échelle écran (widget transformé)
        const r      = parseFloat(img.dataset.ratio) || (startW / startH);
        const z      = ZOOM_STEPS[_zoomIdx];
        const maxW   = Math.max(SEYES_IMG_MIN_W,
            img.dataset.x !== undefined ? editor.offsetWidth - img.offsetLeft : _seyesImgAvailW());
        try { imgHandle.setPointerCapture(e.pointerId); } catch (_) {}

        const onMove = (ev) => {
            const dx = (ev.clientX - startX) / k;
            const dy = (ev.clientY - startY) / k;
            // largeur visée = moyenne entre le glissement horizontal et vertical (ratio conservé)
            let wNew = ((startW + dx) + (startH + dy) * r) / 2;
            wNew = Math.max(SEYES_IMG_MIN_W, Math.min(maxW, wNew));
            img.dataset.w = (wNew / z).toFixed(1);
            _seyesSizeImg(img);
            _seyesUpdateImgFrame();
        };
        const onUp = (ev) => {
            imgHandle.removeEventListener('pointermove', onMove);
            imgHandle.removeEventListener('pointerup', onUp);
            imgHandle.removeEventListener('pointercancel', onUp);
            try { imgHandle.releasePointerCapture(ev.pointerId); } catch (_) {}
            _seyesResizing = false;
            saveBoard();
        };
        imgHandle.addEventListener('pointermove', onMove);
        imgHandle.addEventListener('pointerup', onUp);
        imgHandle.addEventListener('pointercancel', onUp);
    });

    // ── Redimensionnement ─────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            const newW = Math.max(400, startW + ev.clientX - startX);
            const newH = Math.max(128, startH + ev.clientY - startY);
            container.style.width  = newW + 'px';
            container.style.height = newH + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            const newW = Math.max(400, startW + t.clientX - startX);
            const newH = Math.max(128, startH + t.clientY - startY);
            container.style.width  = newW + 'px';
            container.style.height = newH + 'px';
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfPdf      = header.querySelector('[data-role="wf-pdf"]');
    const wfSave     = header.querySelector('[data-role="wf-save"]');
    const wfLoad     = header.querySelector('[data-role="wf-load"]');
    const wfZoomOut  = toolbar.querySelector('[data-role="wf-zoom-out"]');
    const wfZoomIn   = toolbar.querySelector('[data-role="wf-zoom-in"]');
    const wfZoomLbl  = toolbar.querySelector('[data-role="wf-zoom-label"]');
    const wfHelp     = header.querySelector('[data-role="wf-help"]');
    const wfMin      = header.querySelector('[data-role="wf-min"]');
    const wfMax      = header.querySelector('[data-role="wf-max"]');
    const wfClose    = header.querySelector('[data-role="wf-close"]');

    // ── Zoom ─────────────────────────────────────────────────────────────
    const ZOOM_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];
    let _zoomIdx = 5; // 1.0 par défaut

    function _applyZoom() {
        const z = ZOOM_STEPS[_zoomIdx];

        // ── Zoom du contenu (pas de transform sur writingArea) ────────────
        // On scale font-size, line-height, paddingTop, marge et fond SVG.
        // writingArea reste à taille naturelle → le canvas d'annotation
        // n'est jamais affecté par un transform et reste parfaitement aligné.

        const lhZ  = Math.round(LH * z);           // line-height zoomé
        const il   = lhZ / 4;                       // interligne zoomé
        const margeZ = Math.round(256 * z);         // largeur marge zoomée

        // Police courante
        const isMarelle = (fontSelect.value === 'MarelleBaton');
        let fsZ, ptZ, ascentZ;
        if (isMarelle) {
            fsZ = Math.round(32 * z);
            ascentZ = fsZ * 0.87;
            ptZ = Math.max(0, Math.round(lhZ - ascentZ + 4));
        } else {
            fsZ = Math.round(36 * z);
            ascentZ = fsZ * 0.80;
            ptZ = _seyesPaddingTop(fsZ, lhZ);
        }

        // Appliquer sur les éditeurs
        editor.style.fontSize   = fsZ + 'px';
        editor.style.lineHeight = lhZ + 'px';
        editor.style.paddingTop = ptZ + 'px';
        editor.style.left       = margeZ + 'px';
        editor.style.textUnderlineOffset = Math.round(16 * z) + 'px';

        editorMarge.style.fontSize   = fsZ + 'px';
        editorMarge.style.lineHeight = lhZ + 'px';
        editorMarge.style.paddingTop = ptZ + 'px';

        // Largeur du catcher de marge
        margeCatcher.style.width = margeZ + 'px';

        // Mettre à jour le fond SVG avec les nouvelles dimensions
        const svgLignes = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${lhZ}" height="${lhZ}">`,
            `<line x1="0" y1="${il*1}" x2="${lhZ}" y2="${il*1}" stroke="#c8d8eb" stroke-width="0.7"/>`,
            `<line x1="0" y1="${il*2}" x2="${lhZ}" y2="${il*2}" stroke="#c8d8eb" stroke-width="0.7"/>`,
            `<line x1="0" y1="${il*3}" x2="${lhZ}" y2="${il*3}" stroke="#c8d8eb" stroke-width="0.7"/>`,
            `<line x1="0" y1="${lhZ-0.5}" x2="${lhZ}" y2="${lhZ-0.5}" stroke="#9aadbe" stroke-width="1"/>`,
            `</svg>`
        ].join('');
        const svgCols = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${lhZ}" height="${lhZ}">`,
            `<line x1="${lhZ-0.5}" y1="0" x2="${lhZ-0.5}" y2="${lhZ}" stroke="#c8d8eb" stroke-width="0.8"/>`,
            `</svg>`
        ].join('');
        const enc = (svg) => 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
        const urlLignes   = enc(svgLignes);
        const urlCols     = enc(svgCols);
        const mL = margeZ - 2;
        const mR = margeZ;
        const urlRed      = `linear-gradient(to right, transparent ${mL}px, #e05050 ${mL}px, #e05050 ${mR}px, transparent ${mR}px)`;
        const urlMaskCols = `linear-gradient(to right, #fafcff ${mR}px, transparent ${mR}px)`;
        const offsetY     = Math.round(ptZ + ascentZ - lhZ + 0.5);
        writingArea.style.backgroundImage      = `${urlRed}, ${urlLignes}, ${urlMaskCols}, ${urlCols}`;
        writingArea.style.backgroundSize       = `100% 100%, ${lhZ}px ${lhZ}px, 100% 100%, ${lhZ}px ${lhZ}px`;
        writingArea.style.backgroundRepeat     = 'no-repeat, repeat, no-repeat, repeat';
        writingArea.style.backgroundPosition   = `0 0, 0 ${offsetY}px, 0 0, 0 ${offsetY}px`;

        // Supprimer tout transform résiduel sur writingArea
        writingArea.style.transform  = '';
        writingArea.style.marginRight  = '';
        writingArea.style.marginBottom = '';

        wfZoomLbl.textContent = Math.round(z * 100) + '%';
        wfZoomOut.disabled = (_zoomIdx === 0);
        wfZoomIn.disabled  = (_zoomIdx === ZOOM_STEPS.length - 1);
        wfZoomOut.style.opacity = wfZoomOut.disabled ? '0.35' : '1';
        wfZoomIn.style.opacity  = wfZoomIn.disabled  ? '0.35' : '1';

        // Le canvas n'a pas besoin d'être resynchronisé (pas de transform)
        // mais on force un redraw pour que les annotations suivent le zoom du contenu
        // Images collées : taille zoomée + marge haute pour rester sur le lignage
        _seyesApplyImgSizes();

        _seyesCurrentZoom = z;
        _seyesResizeAnnotCanvas();
        _seyesRedrawAnnotations();
    }

    if (wfZoomOut) {
        wfZoomOut.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_zoomIdx > 0) { _zoomIdx--; _applyZoom(); }
        });
    }
    if (wfZoomIn) {
        wfZoomIn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_zoomIdx < ZOOM_STEPS.length - 1) { _zoomIdx++; _applyZoom(); }
        });
    }

    // Double-clic sur le label pour reset à 100%
    if (wfZoomLbl) {
        wfZoomLbl.title = 'Double-clic pour revenir à 100%';
        wfZoomLbl.style.cursor = 'pointer';
        wfZoomLbl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            _zoomIdx = 5; _applyZoom();
        });
    }

    let _isMax = false;

    if (wfPdf) {
        wfPdf.addEventListener('click', (e) => {
            e.stopPropagation();

            const fontUrl      = new URL('polices/BelleAllureGS-Gros.otf', window.location.href).href;
            const editorHTML   = editor.innerHTML  || '';
            const margeHTML    = editorMarge.innerHTML || '';
            const hasMargeContent = editorMarge.textContent.trim().length > 0;

            // ── Dimensions page A4 à 96dpi ──────────────────────────────
            // A4 = 210×297mm. Zone imprimable avec marges 15/12mm :
            //   largeur = 210 - 24 = 186mm = ~703px
            //   hauteur = 297 - 30 = 252mm = ~953px
            // Grande ligne seyes = 8mm = ~30.24px → on arrondit à 30px
            const LINE_H   = 30;   // px — 1 grande ligne (4 interlignes)
            const IL       = LINE_H / 4; // 7.5px — 1 interligne
            const PAGE_W   = 703;  // px zone imprimable
            const PAGE_H   = 953;  // px zone imprimable
            const MARGE_X  = 128;  // px — largeur marge (≈34mm)
            const NB_LINES = Math.floor(PAGE_H / LINE_H);

            // ── Génération SVG du fond seyes ─────────────────────────────
            // On génère un SVG de PAGE_W × PAGE_H avec toutes les lignes
            let svgLines = '';
            for (let i = 0; i <= NB_LINES; i++) {
                const y = i * LINE_H;
                // Grande ligne (bleue foncée) — toute la largeur
                svgLines += `<line x1="0" y1="${y}" x2="${PAGE_W}" y2="${y}" stroke="#9aadbe" stroke-width="0.8"/>`;
                if (i < NB_LINES) {
                    // 3 interlignes (bleue claire) — toute la largeur (marge incluse)
                    for (let j = 1; j <= 3; j++) {
                        const yil = y + j * IL;
                        svgLines += `<line x1="0" y1="${yil}" x2="${PAGE_W}" y2="${yil}" stroke="#c8d8eb" stroke-width="0.5"/>`;
                    }
                }
            }
            // Colonnes verticales (après la marge, toutes les LINE_H px)
            for (let x = MARGE_X + LINE_H; x < PAGE_W; x += LINE_H) {
                svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${PAGE_H}" stroke="#c8d8eb" stroke-width="0.5"/>`;
            }
            // Ligne rouge de marge
            svgLines += `<line x1="${MARGE_X}" y1="0" x2="${MARGE_X}" y2="${PAGE_H}" stroke="#e05050" stroke-width="1.2"/>`;

            const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}">${svgLines}</svg>`;
            const bgSvgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bgSvg);

            // ── Alignement baseline sur la grande ligne ──────────────────
            // La première grande ligne est à y=LINE_H (pas y=0).
            // baseline = top + ascent  →  top = LINE_H - ascent
            // ascent BelleAllureGS ≈ 0.80 * fontSize
            const fsPrint  = Math.round(LINE_H * 0.62); // légèrement plus grand que 36/64
            const ascent   = fsPrint * 1.0;
            const ptPrint  = Math.round(LINE_H - ascent);  // top du bloc texte

            const printHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Écriture Seyes</title>
<style>
    @font-face {
        font-family: 'BelleAllureGS';
        src: url('${fontUrl}') format('opentype');
        font-display: block;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    html, body { width: ${PAGE_W}px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page {
        position: relative;
        width: ${PAGE_W}px;
        min-height: ${PAGE_H}px;
        background-color: #fafcff;
        background-image: url('${bgSvgUrl}');
        background-repeat: no-repeat;
        background-size: ${PAGE_W}px ${PAGE_H}px;
        background-position: top left;
    }
    .print-editor {
        position: absolute;
        top: ${ptPrint}px;
        left: ${MARGE_X + 8}px;
        right: 0;
        font-family: 'BelleAllureGS', cursive;
        font-size: ${fsPrint}px;
        line-height: ${LINE_H}px;
        color: #1a1a2e;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: break-word;
    }
    .print-editor div, .print-editor p,
    .print-editor img { vertical-align: bottom; max-width: 100%; object-fit: contain; }
    .print-marge div, .print-marge p {
        margin: 0; padding: 0;
        min-height: ${LINE_H}px;
        line-height: ${LINE_H}px;
    }
    .print-marge {
        position: absolute;
        top: ${ptPrint}px;
        left: 4px;
        width: ${MARGE_X - 6}px;
        font-family: 'BelleAllureGS', cursive;
        font-size: ${fsPrint}px;
        line-height: ${LINE_H}px;
        color: #1a1a2e;
        white-space: nowrap;
        overflow: visible;
    }
</style>
</head>
<body>
<div class="page">
    <div class="print-editor">${_seyesPrintHTML(editorHTML, LINE_H, 8, ptPrint)}</div>
    ${hasMargeContent ? `<div class="print-marge">${margeHTML}</div>` : ''}
</div>
</body>
</html>`;

            const printWin = window.open('', '_blank', 'width=794,height=1123');
            if (!printWin) {
                alert('Le navigateur a bloqué la fenêtre popup. Autorisez les popups pour ce site.');
                return;
            }
            printWin.document.write(printHTML);
            printWin.document.close();
            printWin.onload = () => {
                // Délai pour laisser la police se charger
                setTimeout(() => { printWin.focus(); printWin.print(); }, 800);
            };
        });
    }

    if (wfSave) {
        wfSave.addEventListener('click', (e) => {
            e.stopPropagation();

            // Récupérer le contenu des deux zones
            const editorHTML    = editor.innerHTML  || '';
            const margeHTML     = editorMarge.innerHTML || '';
            const editorText    = editor.innerText   || '';
            const margeText     = editorMarge.innerText || '';
            const chosenFont    = fontSelect ? fontSelect.value : 'BelleAllureGS';

            // Construire l'objet JSON
            const data = {
                _type:    'widget-seyes',
                _version: '1.0',
                date:     new Date().toISOString(),
                police:   chosenFont,
                contenu: {
                    principal: {
                        html:  editorHTML,
                        texte: editorText
                    },
                    marge: {
                        html:  margeHTML,
                        texte: margeText
                    }
                }
            };

            // Générer le nom de fichier avec date/heure
            const now   = new Date();
            const pad   = n => String(n).padStart(2, '0');
            const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
            const fileName = `seyes_${stamp}.json`;

            // Télécharger le fichier
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Feedback visuel bref sur le bouton
            const origText = wfSave.textContent;
            wfSave.textContent = '✓';
            wfSave.style.color = '#28c840';
            setTimeout(() => {
                wfSave.textContent = origText;
                wfSave.style.color = '';
            }, 1200);
        });
    }

    if (wfLoad) {
        wfLoad.addEventListener('click', (e) => {
            e.stopPropagation();

            const fileInput = document.createElement('input');
            fileInput.type   = 'file';
            fileInput.accept = '.json,application/json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (!file) { document.body.removeChild(fileInput); return; }

                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);

                        // Vérifier que c'est bien un fichier seyes
                        if (data._type !== 'widget-seyes') {
                            alert('Ce fichier ne semble pas être une sauvegarde Seyes valide.');
                            return;
                        }

                        // Restaurer le contenu principal
                        editor.innerHTML = data.contenu?.principal?.html || '';
                        _seyesDeselectImg();
                        _seyesApplyImgSizes();   // recale les images sur le zoom courant

                        // Restaurer le contenu de la marge
                        editorMarge.innerHTML = data.contenu?.marge?.html || '';

                        // Restaurer la police si disponible
                        if (data.police && fontSelect) {
                            const opt = Array.from(fontSelect.options).find(o => o.value === data.police);
                            if (opt) {
                                fontSelect.value = data.police;
                                fontSelect.dispatchEvent(new Event('change'));
                            }
                        }

                        saveBoard();

                        // Feedback visuel bref
                        const origText = wfLoad.textContent;
                        wfLoad.textContent = '✓';
                        wfLoad.style.color = '#28c840';
                        setTimeout(() => {
                            wfLoad.textContent = origText;
                            wfLoad.style.color = '';
                        }, 1200);

                    } catch (err) {
                        alert('Impossible de lire le fichier JSON : ' + err.message);
                    }
                };
                reader.readAsText(file, 'utf-8');
                document.body.removeChild(fileInput);
            });

            fileInput.click();
        });
    }

    if (wfHelp) {
        wfHelp.addEventListener('click', (e) => {
            e.stopPropagation();
            const overlay = document.createElement('div');
            overlay.className = 'seyes-modal-overlay';
            overlay.innerHTML = `
                <div class="seyes-help-modal">
                    <div class="seyes-help-modal-title">✏️ Aide — Écriture Seyes</div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Le lignage</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">📏</span><span>Le fond reproduit un vrai Seyes : 3 petits interlignes (16 px) pour 1 grande ligne (64 px). Les boucles hautes montent sur 3 interlignes, les barres (t, d…) sur 2, les jambages descendent sur 2.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Écrire dans la marge</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🖊️</span><span>Par défaut, le curseur se place après la ligne rouge. Pour écrire <strong>dans la marge</strong> (date, numéro…), cliquez à gauche de la ligne rouge : la zone marge s'active.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">↩️</span><span>Pour revenir à l'écriture principale, cliquez à droite de la ligne rouge.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Mise en forme (barre du bas)</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🎨</span><span>Le <strong>rond de couleur</strong> colorie le mot sélectionné. Sans sélection, il change la couleur de tout l'éditeur. Le sélecteur de police permet de basculer entre BelleAllureGS et MarelleBaton.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon"><strong>G I</strong></span><span><strong>Ctrl+B</strong> gras · <strong>Ctrl+I</strong> italique · <strong>Ctrl+U</strong> souligné. Le petit carré à côté du <u>S</u> souligné règle la couleur du trait indépendamment.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon"><span style="background:#fff176;padding:0 2px;border-radius:2px;font-size:12px;">S</span></span><span>Surligner la sélection. Cliquer à nouveau sur le bouton avec le même texte sélectionné <strong>retire</strong> le surlignage. Même logique pour le soulignage et l'encadrement.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">↩ ↪</span><span><strong>Annuler</strong> (aussi Ctrl+Z) et <strong>Refaire</strong> (aussi Ctrl+Y) les dernières actions.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🗑️</span><span>Efface tout le texte (avec confirmation).</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Images</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🖼️</span><span><strong>Ctrl+V</strong> colle une image du presse-papier (capture d'écran, « copier l'image »…) à l'endroit du curseur. Elle se pose librement sur la feuille, sans suivre les lignes ni le texte.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">↘</span><span><strong>Glissez l'image</strong> pour la déplacer où vous voulez. Cliquez dessus pour afficher la poignée ronde en bas à droite : glissez-la pour agrandir ou réduire. <strong>Suppr</strong> supprime l'image sélectionnée. Collage possible dans l'écriture principale uniquement, pas dans la marge.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Zoom</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🔍</span><span>Les boutons <strong>−</strong> et <strong>+</strong> (début de la barre du bas) agrandissent ou réduisent l'affichage de 50 % à 200 %. Double-clic sur le pourcentage remet à 100 %. Le zoom n'affecte pas l'export PDF.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Sauvegarde et chargement</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">💾</span><span>Sauvegarde le contenu (texte, marge, mise en forme, police) dans un fichier <strong>.json</strong> horodaté sur votre ordinateur.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">📂</span><span>Charge un fichier .json précédemment sauvegardé. Le contenu actuel est remplacé.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">PDF</span><span>Ouvre une fenêtre d'impression avec le fond Seyes et le texte mis en page au format A4.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Fenêtre</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🟢</span><span>Plein écran / fenêtré — la poignée ↘ en bas à droite redimensionne le widget.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🟡</span><span>Réduit le widget en mini-barre déplaçable en haut de l'écran.</span></div>
                    </div>

                    <button class="seyes-help-close">Compris !</button>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('.seyes-help-close').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
            overlay.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') overlay.remove(); });
        });
    }

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            // Sauvegarder la largeur du container avant de réduire
            const savedContainerW = container.offsetWidth + 'px';
            // Synchroniser la taille du widget avec le container
            // (_wfMiniBarCollapse lit/écrit widget.style.width/height)
            widget.style.width  = container.offsetWidth  + 'px';
            widget.style.height = container.offsetHeight + 'px';
            // Masquer le container pour que overflow:hidden fonctionne proprement
            container.style.display = 'none';
            window._wfMiniBarCollapse(widget, '✏️ Écriture Seyes', {
                onExpand: () => {
                    // Restaurer la largeur sur le container, pas sur le widget
                    container.style.width   = savedContainerW;
                    container.style.display = '';
                    widget.style.width      = '';
                    widget.style.height     = '';
                }
            });
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
            }
        });
    }

    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            // Nettoyer les popups téléportés dans body
            [seyesCpickId, seyesUlCpickId, seyesHlCpickId, seyesBdCpickId].forEach(id => {
                const p = document.getElementById('cpick-pop-' + id);
                if (p) p.remove();
            });
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Drag sur le header (sauf toolbar) ────────────────────────────────
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.seyes-toolbar, .wf-btns, .cpick-wrap, .cpick-popup')) return;
        bringToFront(widget);
    });

    // ── Footer : empêcher le drag du widget ───────────────────────────────
    footer.addEventListener('mousedown', (e) => { e.stopPropagation(); });

    // ── Focus widget ──────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'SELECT' || editor.contains(e.target) ||
            e.target.closest('.cpick-popup, .cpick-wrap, .cpick-color')) return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Ouvrir directement en plein écran board
    _isMax = true;
    container.classList.add('wf-fullboard');

    // Focus auto sur l'éditeur
    requestAnimationFrame(() => requestAnimationFrame(() => editor.focus()));

    saveBoard();
    return widget;
}

// ── Utilitaire : géométrie d'une image collée ──
// data-w = largeur à zoom 100 % (grande ligne = 64 px), data-ratio = largeur / hauteur.
// scale = facteur d'affichage (zoom, ou lineH/64 pour l'impression).
// mt = marge haute qui complète la hauteur jusqu'à un nombre entier de grandes lignes :
// l'image repose sur la ligne et le texte qui suit reste aligné sur le lignage.
// (Anciennes sauvegardes : data-lines converti en largeur.)
function _seyesImgGeom(img, scale, lineH) {
    const r = parseFloat(img.dataset.ratio) || 1;
    let w0 = parseFloat(img.dataset.w);
    if (!(w0 > 0)) {
        w0 = (parseInt(img.dataset.lines, 10) || 1) * 64 * r;
        img.dataset.w = w0.toFixed(1);
    }
    const w  = Math.max(1, Math.round(w0 * scale));
    const h  = Math.max(1, Math.round(w / r));
    // Image libre (data-x / data-y) : position absolue, pas de marge d'alignement
    const free = img.dataset.x !== undefined;
    const mt = free ? 0 : Math.ceil(h / lineH - 0.001) * lineH - h;
    return {
        w, h, mt, free,
        x: free ? Math.round((parseFloat(img.dataset.x) || 0) * scale) : 0,
        y: free ? Math.round((parseFloat(img.dataset.y) || 0) * scale) : 0
    };
}

// ── Utilitaire : recale les images collées sur la grande ligne de l'export PDF ──
// offX / offY : décalage du bloc texte imprimé par rapport à la ligne rouge / au haut de la page,
// pour que les images libres retombent au même endroit de la feuille.
function _seyesPrintHTML(html, lineH, offX, offY) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const scale = lineH / 64;
    tmp.querySelectorAll('img[data-ratio]').forEach(img => {
        const g = _seyesImgGeom(img, scale, lineH);
        img.style.width  = g.w + 'px';
        img.style.height = g.h + 'px';
        if (g.free) {
            img.style.position = 'absolute';
            img.style.margin   = '0';
            img.style.left     = Math.round(g.x - (offX || 0)) + 'px';
            img.style.top      = Math.round(g.y - (offY || 0)) + 'px';
        } else {
            img.style.marginTop = g.mt + 'px';
        }
    });
    return tmp.innerHTML;
}

// ── Utilitaire : calcule padding-top pour coller la baseline sur la grande ligne ──
// La grande ligne seyes est en bas de chaque bloc line-height.
// On veut que la baseline du texte tombe dessus.
// Estimation : ascent ≈ 0.80 * font-size pour BelleAllure
// baseline_y = paddingTop + ascent
// On veut baseline_y ≡ 0 (mod line-height), donc proche du bas du premier bloc.
// → baseline_y ≈ line-height - descent
// → descent ≈ 0.20 * font-size (2 interlignes sous baseline pour les jambages)
// → paddingTop = line-height - descent - ascent = line-height - font-size
// Avec un léger ajustement visuel de +4px pour BelleAllure.
function _seyesPaddingTop(fontSize, lineHeight) {
    const ascent = fontSize * 0.80;
    let pt = Math.round(lineHeight - ascent - 4 + 16);
    if (pt < 0) pt = 0;
    return pt;
}
