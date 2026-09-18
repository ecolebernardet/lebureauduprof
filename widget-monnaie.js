// =========================================================================
// WIDGET MONNAIE — Le Bureau du Prof
// Affiche un ensemble de pièces et billets euros à additionner.
// 3 niveaux : facile / moyen / difficile
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;

            // Sauvegarder position et taille sur le widget
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';

            // Ranger à la suite des autres widgets réduits
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

            // Réduire le widget
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

            // Cacher les poignées
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');

            // Créer la mini-barre
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
                e.stopPropagation();
                e.preventDefault();
                // Restaurer
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

            // Mini-barre draggable
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation();
                e.preventDefault();
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

    // CSS partagé boutons fenêtre (injecté une seule fois)
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

    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="monnaie"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .monnaie-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .monnaie-container input {
            user-select: text;
            -webkit-user-select: text;
            font-family: inherit;
        }

        /* En-tête */
        .monnaie-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .monnaie-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }

        /* ── État réduit monnaie ── */
        .monnaie-container.wf-minimized > *:not(.monnaie-header) { display: none !important; }
        .monnaie-container.wf-minimized { gap: 0; }

        /* ── État plein écran board monnaie ── */
        .monnaie-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        .monnaie-level-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .monnaie-level-badge.facile   { background: #d4edda; color: #1a7a3a; }
        .monnaie-level-badge.moyen    { background: #fff3cd; color: #8a5c00; }
        .monnaie-level-badge.difficile{ background: #f8d7da; color: #842029; }

        /* Contrôles */
        .monnaie-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .monnaie-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .monnaie-btn:active { transform: scale(0.96); }
        .monnaie-btn-new {
            background: #4a90e2;
            color: white;
        }
        .monnaie-btn-new:hover { background: #357abd; }
        .monnaie-btn-answer {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .monnaie-btn-answer:hover { background: #e0e0e0; }
        .monnaie-btn-answer.revealed {
            background: #28a745;
            color: white;
            border-color: #28a745;
        }

        .monnaie-level-btns {
            display: flex;
            gap: 4px;
            margin-left: auto;
        }
        .monnaie-lvl-btn {
            padding: 4px 9px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            color: #666;
            transition: background .15s;
        }
        .monnaie-lvl-btn:hover { background: #e0e0e0; }
        .monnaie-lvl-btn.active-facile    { background: #d4edda; color: #1a7a3a; border-color: #a3d4b0; }
        .monnaie-lvl-btn.active-moyen     { background: #fff3cd; color: #8a5c00; border-color: #ffd97a; }
        .monnaie-lvl-btn.active-difficile { background: #f8d7da; color: #842029; border-color: #f5a8ae; }

        /* Zone items */
        .monnaie-items {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            align-content: center;
            height: 160px;
            overflow: hidden;
            padding: 8px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            flex-shrink: 0;
            box-sizing: border-box;
        }

        .monnaie-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            position: relative;
        }
        .monnaie-item img {
            display: block;
            object-fit: contain;
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        }
        .monnaie-item .monnaie-qty {
            font-size: 10px;
            font-weight: 700;
            color: #666;
            background: rgba(255,255,255,0.85);
            border-radius: 8px;
            padding: 1px 5px;
        }

        /* Réponse */
        .monnaie-answer-zone {
            min-height: 28px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .monnaie-answer-text {
			font-family: 'Marelle Baton', 'Nunito', sans-serif;
            font-size: 30px;
            font-weight: 800;
            color: #28a745;
            opacity: 0;
            transition: opacity .3s;
        }
        .monnaie-answer-text.show { opacity: 1; }
        .monnaie-answer-input {
			font-family: 'Marelle Baton', 'Nunito', sans-serif !important;
            flex: 1;
            max-width: 110px;
            padding: 5px 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 700;
            outline: none;
            text-align: right;
            transition: border-color .2s;
        }
        .monnaie-answer-input:focus { border-color: #4a90e2; }
        .monnaie-answer-input.correct { border-color: #28a745; background: #f0fff4; color: #1a7a3a; }
        .monnaie-answer-input.wrong   { border-color: #dc3545; background: #fff5f5; color: #9c1c28; }
        .monnaie-answer-label {
            font-size: 12px;
            color: #888;
        }
        .monnaie-check-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: #4a90e2;
            color: white;
            transition: background .15s;
        }
        .monnaie-check-btn:hover { background: #357abd; }

        /* Bouton aide */
        .monnaie-help-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .monnaie-help-btn:hover { background: #e0e0e0; color: #333; }

        .monnaie-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 280px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .monnaie-help-popup.show { display: block; }
        .monnaie-help-popup h4 {
            margin: 0 0 8px;
            font-size: 12px;
            color: #374151;
        }
        .monnaie-help-popup .help-level {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        .monnaie-help-popup .help-level:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .monnaie-help-popup .help-level strong {
            display: inline-block;
            margin-bottom: 2px;
        }
        .help-badge {
            display: inline-block;
            font-size: 9px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 10px;
            text-transform: uppercase;
            margin-right: 4px;
            vertical-align: middle;
        }
        .help-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .help-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .help-badge.difficile { background: #f8d7da; color: #842029; }

        /* Resize handle */
        .monnaie-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .monnaie-container:hover .monnaie-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données monnaie ───────────────────────────────────────────────────────
const MONNAIE_DATA = {
    billets: [
        { valeur:  500, label: '5 €',   src: 'images/monnaie-billet-5.jpg',   w: 110, h: 55, type: 'billet' },
        { valeur: 1000, label: '10 €',  src: 'images/monnaie-billet-10.jpg',  w: 110, h: 55, type: 'billet' },
        { valeur: 2000, label: '20 €',  src: 'images/monnaie-billet-20.jpg',  w: 110, h: 55, type: 'billet' },
        { valeur: 5000, label: '50 €',  src: 'images/monnaie-billet-50.jpg',  w: 110, h: 55, type: 'billet' },
        { valeur:10000, label: '100 €', src: 'images/monnaie-billet-100.jpg', w: 110, h: 55, type: 'billet' },
    ],
    pieces: [
        { valeur:   1, label: '1 c',  src: 'images/monnaie-piece-001.png', w: 42, h: 42, type: 'piece' },
        { valeur:   2, label: '2 c',  src: 'images/monnaie-piece-002.png', w: 44, h: 44, type: 'piece' },
        { valeur:   5, label: '5 c',  src: 'images/monnaie-piece-005.png', w: 46, h: 46, type: 'piece' },
        { valeur:  10, label: '10 c', src: 'images/monnaie-piece-010.png', w: 48, h: 48, type: 'piece' },
        { valeur:  20, label: '20 c', src: 'images/monnaie-piece-020.png', w: 50, h: 50, type: 'piece' },
        { valeur:  50, label: '50 c', src: 'images/monnaie-piece-050.png', w: 52, h: 52, type: 'piece' },
        { valeur: 100, label: '1 €',  src: 'images/monnaie-piece-1.png',   w: 54, h: 54, type: 'piece' },
        { valeur: 200, label: '2 €',  src: 'images/monnaie-piece-2.png',   w: 58, h: 58, type: 'piece' },
    ]
};

const NIVEAUX = {
    facile: {
        label: 'Facile',
        // Billets autorisés : 5, 10, 20 €
        billets:    [500, 1000, 2000],
        // Pièces centimes (1c–50c) : optionnelles, max 99c au total, 1 tirage sur 2 sans
        maxCentimes: 99,
        forceCentimes: false,
        minItems: 3, maxItems: 6
    },
    moyen: {
        label: 'Moyen',
        // Billets autorisés : 5, 10, 20, 50 €
        billets:    [500, 1000, 2000, 5000],
        // Pièces centimes : toujours présentes, max 150c
        maxCentimes: 150,
        forceCentimes: true,
        minItems: 5, maxItems: 10
    },
    difficile: {
        label: 'Difficile',
        // Tous les billets : 5, 10, 20, 50, 100 €
        billets:    [500, 1000, 2000, 5000, 10000],
        // Pièces centimes : toujours présentes, max 250c
        maxCentimes: 250,
        forceCentimes: true,
        minItems: 8, maxItems: 20
    }
};

// ── Générateur d'exercice ─────────────────────────────────────────────────
function _genMonnaie(niveauKey) {
    const niveau = NIVEAUX[niveauKey];

    // Toutes les pièces centimes (1c à 50c)
    const PIECES_CENTIMES = MONNAIE_DATA.pieces.filter(p => p.valeur <= 50);
    // Toutes les pièces euros (1€ et 2€)
    const PIECES_EURO     = MONNAIE_DATA.pieces.filter(p => p.valeur >= 100);
    // Billets autorisés pour ce niveau
    const BILLETS         = MONNAIE_DATA.billets.filter(b => niveau.billets.includes(b.valeur));

    // Nombre d'items individuels visés pour cet exercice
    const targetItems = niveau.minItems + Math.floor(Math.random() * (niveau.maxItems - niveau.minItems + 1));

    // Compte le nombre d'items individuels dans selected
    function countItems(sel) { return sel.reduce((s, e) => s + e.qty, 0); }

    // Ajoute un item individuel dans selected (regroupe les doublons)
    function addOne(sel, item) {
        const ex = sel.find(s => s.item.valeur === item.valeur && s.item.type === item.type);
        if (ex) ex.qty++;
        else sel.push({ item, qty: 1 });
    }

    // Mélange un tableau
    function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

    const selected = [];
    let centimesTotal = 0; // total des pièces centimes (1c–50c) ajoutées

    // ── Étape 1 : pièces centimes (1c–50c) ──────────────────────────────────
    // En facile : 1 tirage sur 2 sans centimes
    const avecCentimes = niveau.forceCentimes || Math.random() < 0.5;
    // En mode difficile : réserver 3 slots pour les billets obligatoires
    const slotsReservesBillets = (niveauKey === 'difficile') ? 3 : 1;

    if (avecCentimes) {
        // Choisir un total cible de centimes entre 1 et maxCentimes
        const targetC = 1 + Math.floor(Math.random() * niveau.maxCentimes);
        // Nombre max de slots pour les centimes (on réserve les slots billets)
        const maxSlotsCentimes = targetItems - slotsReservesBillets;
        let remaining = targetC;

        for (const p of shuffle(PIECES_CENTIMES)) {
            if (remaining <= 0) break;
            if (countItems(selected) >= maxSlotsCentimes) break;
            const slotsLeft  = maxSlotsCentimes - countItems(selected);
            const maxQty     = Math.min(slotsLeft, Math.floor(remaining / p.valeur));
            if (maxQty < 1) continue;
            if (Math.random() < 0.4) continue; // ne pas toujours prendre toutes les pièces
            const qty = Math.floor(Math.random() * maxQty) + 1;
            for (let i = 0; i < qty; i++) {
                if (countItems(selected) >= maxSlotsCentimes) break;
                addOne(selected, p);
                centimesTotal += p.valeur;
            }
            remaining -= p.valeur * qty;
        }
        // Si remaining > 0, combler avec les plus grandes pièces disponibles
        if (remaining > 0) {
            for (const p of [...PIECES_CENTIMES].sort((a, b) => b.valeur - a.valeur)) {
                if (remaining <= 0) break;
                if (countItems(selected) >= maxSlotsCentimes) break;
                const slotsLeft = maxSlotsCentimes - countItems(selected);
                const qty = Math.min(slotsLeft, Math.floor(remaining / p.valeur));
                if (qty < 1) continue;
                for (let i = 0; i < qty; i++) {
                    if (countItems(selected) >= maxSlotsCentimes) break;
                    addOne(selected, p);
                    centimesTotal += p.valeur;
                }
                remaining -= p.valeur * qty;
            }
        }
    }

    // ── Étape 2 : billets et pièces euro pour atteindre targetItems ──────────
    // En mode difficile : ajouter 3 billets en priorité (slots réservés à l'étape 1)
    const billetsShuffled = shuffle(BILLETS);
    if (niveauKey === 'difficile') {
        for (let i = 0; i < 3; i++) {
            addOne(selected, billetsShuffled[i % billetsShuffled.length]);
        }
    }

    // Compléter avec billets + pièces euro mélangés
    const pool = shuffle([...BILLETS, ...PIECES_EURO]);
    for (const item of pool) {
        if (countItems(selected) >= targetItems) break;
        const slotsLeft = targetItems - countItems(selected);
        // Ajouter 1 à 3 exemplaires de ce type (sans dépasser les slots)
        const qty = Math.min(slotsLeft, Math.floor(Math.random() * 3) + 1);
        for (let i = 0; i < qty; i++) {
            if (countItems(selected) >= targetItems) break;
            addOne(selected, item);
        }
    }

    // ── Étape 3 : garantir minItems (filet de sécurité) ─────────────────────
    while (countItems(selected) < niveau.minItems) {
        addOne(selected, BILLETS[Math.floor(Math.random() * BILLETS.length)]);
    }

    // Calculer le total final (centimes + billets/pièces euro)
    const total = selected.reduce((s, e) => s + e.item.valeur * e.qty, 0);

    return { items: selected, total };
}

// ── Formatage du montant ──────────────────────────────────────────────────
function _formatMontant(centimes) {
    const euros = Math.floor(centimes / 100);
    const cts   = centimes % 100;
    if (cts === 0) return euros + ',00 €';
    return euros + ',' + String(cts).padStart(2, '0') + ' €';
}

// ── Création du widget ────────────────────────────────────────────────────
function createMonnaieWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'monnaie';
    widget.dataset.transparent = 'true';
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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

    // Contenu principal
    const container = document.createElement('div');
    container.className = 'monnaie-container';

    // Taille initiale : 75% de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // En-tête
    const header = document.createElement('div');
    header.className = 'monnaie-header';
    header.innerHTML = `
        <span class="monnaie-title">💶 Combien y a-t-il en tout ?</span>
        <span class="monnaie-level-badge facile">Facile</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.monnaie-level-badge');
    container.appendChild(header);

    // Boutons contrôle
    const controls = document.createElement('div');
    controls.className = 'monnaie-controls';
    controls.innerHTML = `
        <button class="monnaie-btn monnaie-btn-new">🔄 Nouveau</button>
        <button class="monnaie-btn monnaie-btn-answer">👁 Voir la réponse</button>
        <div class="monnaie-level-btns">
            <button class="monnaie-lvl-btn active-facile" data-level="facile">😊 Facile</button>
            <button class="monnaie-lvl-btn" data-level="moyen">😐 Moyen</button>
            <button class="monnaie-lvl-btn" data-level="difficile">😤 Difficile</button>
        </div>
    `;
    const newBtn    = controls.querySelector('.monnaie-btn-new');
    const showBtn   = controls.querySelector('.monnaie-btn-answer');
    container.appendChild(controls);

    // Zone images
    const itemsZone = document.createElement('div');
    itemsZone.className = 'monnaie-items';
    itemsZone.style.height = Math.round(initH * 0.55) + 'px';
    container.appendChild(itemsZone);

    // Zone réponse
    const answerZone = document.createElement('div');
    answerZone.className = 'monnaie-answer-zone';

    const answerLabel = document.createElement('span');
    answerLabel.className = 'monnaie-answer-label';
    answerLabel.textContent = 'Ta réponse :';

    const answerInput = document.createElement('input');
    answerInput.className = 'monnaie-answer-input';
    answerInput.type = 'text';
    answerInput.placeholder = '0,00 €';

    const checkBtn = document.createElement('button');
    checkBtn.className = 'monnaie-check-btn';
    checkBtn.textContent = '✓ Vérifier';

    const answerText = document.createElement('span');
    answerText.className = 'monnaie-answer-text';

    answerZone.appendChild(answerLabel);
    answerZone.appendChild(answerInput);
    answerZone.appendChild(checkBtn);
    answerZone.appendChild(answerText);

    // Bouton aide (inséré dans le header, à gauche du bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'monnaie-help-btn';
    helpBtn.title = 'Aide sur les niveaux';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    // Popup aide
    const helpPopup = document.createElement('div');
    helpPopup.className = 'monnaie-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les niveaux de jeu</h4>
        <div class="help-level">
            <span class="help-badge facile">😊 Facile</span><br>
            Billets de 5, 10 et 20 €<br>
            Toutes les pièces (1c à 2 €)<br>
            1 tirage sur 2 sans pièces centimes<br>
            Total centimes : max 0,99 €<br>
            3 à 6 éléments
        </div>
        <div class="help-level">
            <span class="help-badge moyen">😐 Moyen</span><br>
            Billets de 5, 10, 20 et 50 €<br>
            Toutes les pièces (1c à 2 €)<br>
            Toujours des pièces centimes<br>
            Total centimes : max 1,50 €<br>
            5 à 10 éléments
        </div>
        <div class="help-level">
            <span class="help-badge difficile">😤 Difficile</span><br>
            Tous les billets (5 à 100 €)<br>
            Toutes les pièces (1c à 2 €)<br>
            Toujours des pièces centimes<br>
            Total centimes : max 2,50 €<br>
            Au moins 3 billets<br>
            8 à 20 éléments
        </div>
    `
    container.appendChild(helpPopup);

    container.appendChild(answerZone);

    // Poignée resize
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'monnaie-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let currentLevel = 'facile';
    let currentTotal = 0;
    let answerRevealed = false;

    // ── Tailles de référence (base 1x) ────────────────────────────────────
    const BASE_W = initW;      // largeur initiale du container
    const BASE_ITEMS_H = Math.round(initH * 0.55); // zone items ~ 55% de la hauteur totale
    let currentScale = 1;
    let lastExercice = null;

    // ── Calcul du scale de référence à partir des dimensions actuelles ────
    // Référence absolue : une pièce de 1c fait 42px de base, on veut qu'elle
    // soit lisible. On cible une hauteur de rangée de ~80px pour les pièces.
    const BASE_PIECE_H = 42; // hauteur de la plus petite pièce à scale=1
    const TARGET_PIECE_H = 80; // hauteur souhaitée pour une pièce standard

    function computeScale() {
        const cw = container.offsetWidth  || BASE_W;
        const zh = itemsZone.offsetHeight || BASE_ITEMS_H;
        // Scale basé sur la taille réelle de la zone vs la taille de référence (480px)
        const REF_W = 480;
        const REF_ITEMS_H = 160;
        const scaleW = cw / REF_W;
        const scaleH = zh / REF_ITEMS_H;
        return Math.max(0.5, Math.min(5, Math.min(scaleW, scaleH)));
    }

    // ── Applique le scale sur toutes les images existantes ─────────────────
    function applyScaleToImages() {
        currentScale = computeScale();
        itemsZone.querySelectorAll('.monnaie-item img').forEach(img => {
            const bw = parseFloat(img.dataset.baseW);
            const bh = parseFloat(img.dataset.baseH);
            if (!isNaN(bw) && !isNaN(bh)) {
                img.width  = Math.round(bw * currentScale);
                img.height = Math.round(bh * currentScale);
            }
        });
    }

    // ── Rendu des items ───────────────────────────────────────────────────
    function renderItems(exercice) {
        lastExercice = exercice;
        itemsZone.innerHTML = '';
        answerRevealed = false;
        answerText.textContent = '';
        answerText.classList.remove('show');
        answerInput.value = '';
        answerInput.className = 'monnaie-answer-input';
        showBtn.textContent = '👁 Voir la réponse';
        showBtn.classList.remove('revealed');

        // Aplatir la liste en items individuels
        const allItems = [];
        exercice.items.forEach(({ item, qty }) => {
            for (let i = 0; i < qty; i++) allItems.push(item);
        });

        const GAP = 10; // gap CSS (column-gap et row-gap identiques)
        const PAD = 16; // padding zone (8px de chaque côté)

        // Simule le flex-wrap et retourne la hauteur totale occupée pour un scale donné
        function estimateHeight(scale) {
            const zoneW = Math.max(BASE_W, container.offsetWidth || BASE_W) - PAD;
            let rowW = 0, rowH = 0, totalH = 0;
            for (const item of allItems) {
                const iw = Math.round(item.w * scale) + GAP;
                const ih = Math.round(item.h * scale) + GAP;
                if (rowW > 0 && rowW + iw > zoneW) {
                    totalH += rowH + GAP; // hauteur rangée + gap entre rangées
                    rowW = 0; rowH = 0;
                }
                rowW += iw;
                rowH = Math.max(rowH, ih);
            }
            totalH += rowH; // dernière rangée (pas de gap après)
            return totalH;
        }

        // Recherche dichotomique du scale maximum qui tient dans la zone
        function findFitScale() {
            // Marge de sécurité de 15% pour absorber les écarts entre simulation et rendu réel
            const rawH = Math.max(BASE_ITEMS_H, itemsZone.offsetHeight || BASE_ITEMS_H);
            const zoneH = (rawH - PAD) * 0.85;
            let lo = 0.2, hi = computeScale(), mid;
            // Si même le scale minimum ne tient pas, on garde 0.2
            if (estimateHeight(lo) > zoneH) return lo;
            // Si le scale initial tient déjà, on le retourne directement
            if (estimateHeight(hi) <= zoneH) return hi;
            // Dichotomie sur 12 itérations (~0.0002 de précision)
            for (let i = 0; i < 12; i++) {
                mid = (lo + hi) / 2;
                if (estimateHeight(mid) <= zoneH) lo = mid;
                else hi = mid;
            }
            return lo;
        }

        currentScale = findFitScale();

        allItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'monnaie-item';
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.label;
            img.dataset.baseW = item.w;
            img.dataset.baseH = item.h;
            img.width  = Math.round(item.w * currentScale);
            img.height = Math.round(item.h * currentScale);
            el.appendChild(img);
            itemsZone.appendChild(el);
        });
    }

    // ── Génère un nouvel exercice ─────────────────────────────────────────
    function newExercice() {
        const ex = _genMonnaie(currentLevel);
        currentTotal = ex.total;
        renderItems(ex);
        saveBoard();
    }

    // ── Changer de niveau ─────────────────────────────────────────────────
    function setLevel(level) {
        currentLevel = level;
        widget.dataset.monnaieLevel = level;
        badge.className = `monnaie-level-badge ${level}`;
        badge.textContent = NIVEAUX[level].label;

        container.querySelectorAll('.monnaie-lvl-btn').forEach(btn => {
            btn.className = 'monnaie-lvl-btn';
            if (btn.dataset.level === level) btn.classList.add(`active-${level}`);
        });

        newExercice();
    }

    // ── Vérifier la réponse ───────────────────────────────────────────────
    function checkAnswer() {
        let raw = answerInput.value.replace(/\s/g, '').replace('€', '').replace(',', '.');
        let userCentimes = null;
        if (raw.includes('.')) {
            const parts = raw.split('.');
            const euros = parseInt(parts[0]) || 0;
            const cts   = parseInt((parts[1] + '0').substring(0, 2)) || 0;
            userCentimes = euros * 100 + cts;
        } else {
            const val = parseFloat(raw);
            if (!isNaN(val)) userCentimes = Math.round(val * 100);
        }
        if (userCentimes === null || isNaN(userCentimes)) {
            answerInput.className = 'monnaie-answer-input wrong';
            return;
        }
        if (userCentimes === currentTotal) {
            answerInput.className = 'monnaie-answer-input correct';
            answerText.textContent = '✅ Bravo !';
            answerText.classList.add('show');
        } else {
            answerInput.className = 'monnaie-answer-input wrong';
            answerText.textContent = '❌ Essaie encore !';
            answerText.classList.add('show');
        }
    }

    // ── Afficher / cacher la réponse ──────────────────────────────────────
    function toggleAnswer() {
        if (!answerRevealed) {
            answerRevealed = true;
            answerText.textContent = '= ' + _formatMontant(currentTotal);
            answerText.classList.add('show');
            showBtn.textContent = '🙈 Cacher';
            showBtn.classList.add('revealed');
        } else {
            answerRevealed = false;
            answerText.textContent = '';
            answerText.classList.remove('show');
            showBtn.textContent = '👁 Voir la réponse';
            showBtn.classList.remove('revealed');
        }
    }

    // ── Event listeners ───────────────────────────────────────────────────
    newBtn.addEventListener('click', newExercice);
    showBtn.addEventListener('click', toggleAnswer);
    checkBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    // Fermer la popup si on clique ailleurs
    document.addEventListener('click', () => helpPopup.classList.remove('show'));
    container.querySelectorAll('.monnaie-lvl-btn').forEach(btn => {
        btn.addEventListener('click', () => setLevel(btn.dataset.level));
    });

    // Resize 2D (horizontal + vertical) avec mise à l'échelle des images
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startItemsH = itemsZone.offsetHeight;

        document.onmousemove = (ev) => {
            const newW = Math.max(300, startW + ev.clientX - startX);
            const newItemsH = Math.max(80, startItemsH + ev.clientY - startY);
            container.style.width = newW + 'px';
            itemsZone.style.height = newItemsH + 'px';
            applyScaleToImages();
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startItemsH = itemsZone.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            const newW = Math.max(300, startW + t.clientX - startX);
            const newItemsH = Math.max(80, startItemsH + t.clientY - startY);
            container.style.width = newW + 'px';
            itemsZone.style.height = newItemsH + 'px';
            applyScaleToImages();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Empêcher le widget de voler le focus quand on clique sur l'input
    answerInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    answerInput.addEventListener('click', (e) => {
        e.stopPropagation();
        answerInput.focus();
    });



    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _savedW = null, _savedH = null;
    let _isMin = false, _isMax = false;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '💶 Monnaie', {
                onExpand: () => { if (lastExercice) applyScaleToImages(); }
            });
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMin) { _isMin = false; container.classList.remove('wf-minimized'); }
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = container.style.width;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedW) container.style.width = _savedW;
                if (lastExercice) applyScaleToImages();
            }
        });
    }

    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        // Ne pas voler le focus si on clique sur un input ou bouton
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Premier exercice — après deux frames pour que le layout soit calculé
    requestAnimationFrame(() => requestAnimationFrame(() => setLevel('facile')));

    // Exposer setLevel pour la restauration par save-load.js
    widget._setLevel = setLevel;

    saveBoard();
    return widget;
}
