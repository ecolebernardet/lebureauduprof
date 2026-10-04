// =========================================================================
// WIDGET FRISE HISTORIQUE — Le Bureau du Prof
// Frise chronologique des 5 grandes périodes de l'histoire :
//   Préhistoire (-6 millions → -3000), Antiquité (-3000 → 476),
//   Moyen Âge (476 → 1492), Temps modernes (1492 → 1789),
//   Époque contemporaine (1789 → aujourd'hui).
// Options : échelle égale / proportionnelle, repères historiques,
//   masquer les noms (mode devinette), repères personnalisés.
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
                e.stopPropagation();
                e.preventDefault();
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
        .widget[data-type="frise-historique"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .fh-container {
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
        .fh-container input {
            user-select: text;
            -webkit-user-select: text;
            font-family: inherit;
        }

        /* En-tête */
        .fh-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .fh-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .fh-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #f6ecdc;
            color: #7a5326;
        }

        /* Réduit / plein écran */
        .fh-container.wf-minimized > *:not(.fh-header) { display: none !important; }
        .fh-container.wf-minimized { gap: 0; }
        .fh-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        /* Contrôles */
        .fh-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .fh-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
            background: #f0f0f0;
            color: #333;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .fh-btn:hover { background: #e0e0e0; }
        .fh-btn:active { transform: scale(0.96); }
        .fh-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .fh-btn.on:hover { background: #357abd; }
        .fh-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .fh-btn-reveal:hover { background: #218838; }

        .fh-scale-btns { display: flex; gap: 4px; margin-left: auto; align-items: center; }
        .fh-scale-lbl { font-size: 10px; font-weight: 700; color: #888; margin-right: 2px; }
        .fh-scale-btn {
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
        .fh-scale-btn:hover { background: #e0e0e0; }
        .fh-scale-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Ajout d'un repère personnalisé */
        .fh-add {
            display: none;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
            padding: 6px 8px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            font-size: 11px;
            color: #555;
        }
        .fh-add.show { display: flex; }
        .fh-add input {
            padding: 4px 8px;
            border: 1.5px solid #ddd;
            border-radius: 6px;
            font-size: 12px;
            outline: none;
        }
        .fh-add input:focus { border-color: #4a90e2; }
        .fh-add .fh-add-year  { width: 90px; }
        .fh-add .fh-add-label { flex: 1; min-width: 160px; }
        .fh-add-ok {
            padding: 5px 12px; border-radius: 8px; border: none;
            background: #4a90e2; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
        }
        .fh-add-ok:hover { background: #357abd; }
        .fh-add-msg { color: #9c1c28; font-weight: 700; }

        /* Scène de la frise */
        .fh-stage { position: relative; width: 100%; }
        .fh-events { position: relative; width: 100%; }
        .fh-band   { position: relative; width: 100%; }
        .fh-dates  { position: relative; width: 100%; }

        .fh-seg {
            position: absolute;
            top: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            border-right: 2px solid #fff;
            color: #fff;
            font-weight: 800;
            text-align: center;
            line-height: 1.1;
            text-shadow: 0 1px 2px rgba(0,0,0,0.35);
            cursor: pointer;
            overflow: hidden;
            transition: filter .15s, opacity .2s, box-shadow .2s;
        }
        .fh-seg:first-child { border-radius: 8px 0 0 8px; }
        .fh-seg:hover { filter: brightness(1.08); }
        .fh-seg.dim { opacity: .45; }
        .fh-seg.sel { box-shadow: inset 0 0 0 3px rgba(255,255,255,0.9); }
        .fh-seg .fh-seg-name { padding: 0 4px; pointer-events: none; }
        .fh-seg .fh-seg-name.vert { writing-mode: vertical-rl; transform: rotate(180deg); }
        .fh-seg.hidden-name {
            background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 10px, transparent 10px 20px);
        }
        .fh-arrow { position: absolute; top: 0; bottom: 0; pointer-events: none; }
        .fh-break {
            position: absolute; top: -4px; bottom: -4px; width: 14px;
            background: #fff;
            clip-path: polygon(30% 0, 70% 0, 40% 20%, 80% 40%, 40% 60%, 80% 80%, 70% 100%, 30% 100%, 0 80%, 40% 60%, 0 40%, 40% 20%);
            pointer-events: none;
        }

        /* Repères */
        .fh-ev { position: absolute; bottom: 0; width: 0; }
        .fh-ev-stem {
            position: absolute; bottom: 0; left: -1px; width: 2px; z-index: 1;
            background: #9ca3af;
        }
        .fh-ev-dot {
            position: absolute; bottom: -5px; left: -5px; width: 10px; height: 10px;
            border-radius: 50%; background: #fff; border: 2px solid #4b5563; box-sizing: border-box; z-index: 1;
        }
        .fh-ev-lbl {
            position: absolute; z-index: 2;
            white-space: nowrap;
            background: #fff;
            border: 1.5px solid #d1d5db;
            border-left-width: 4px;
            border-radius: 6px;
            padding: 2px 6px;
            box-sizing: border-box;
            color: #374151;
            line-height: 1.25;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .fh-ev-lbl b { display: block; color: #111827; }
        .fh-ev.boundary .fh-ev-lbl { background: #fffbea; }
        .fh-ev.boundary .fh-ev-stem { background: #6b7280; }
        .fh-ev.custom .fh-ev-lbl { border-style: dashed; background: #f5f3ff; }
        .fh-ev.custom .fh-ev-stem { background: #7c3aed; }
        .fh-ev.custom .fh-ev-dot { border-color: #7c3aed; }
        .fh-ev-del {
            position: absolute; top: -8px; right: -8px;
            width: 16px; height: 16px; border-radius: 50%;
            border: none; background: #dc3545; color: #fff;
            font-size: 11px; line-height: 16px; padding: 0; cursor: pointer;
            display: none;
        }
        .fh-ev.custom .fh-ev-lbl:hover .fh-ev-del { display: block; }

        /* Dates */
        .fh-date { position: absolute; top: 0; width: 0; }
        .fh-date-tick { position: absolute; top: 0; left: -1px; width: 2px; background: #374151; }
        .fh-date-lbl {
            position: absolute; white-space: nowrap; font-weight: 800; color: #374151;
            font-variant-numeric: tabular-nums;
        }
        .fh-scale-note { font-size: 11px; color: #9ca3af; font-style: italic; text-align: right; }

        /* Fiche de la période */
        .fh-detail {
            display: none;
            padding: 10px 14px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-left: 6px solid #999;
            border-radius: 10px;
            color: #374151;
            line-height: 1.45;
        }
        .fh-detail.show { display: block; }
        .fh-detail h4 { margin: 0 0 2px; font-weight: 900; }
        .fh-detail .fh-d-dates { font-weight: 700; color: #6b7280; margin-bottom: 6px; }
        .fh-detail .fh-d-limits { margin-bottom: 6px; }
        .fh-detail p { margin: 0 0 6px; }
        .fh-detail .fh-d-chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .fh-detail .fh-chip {
            padding: 2px 8px; border-radius: 12px; background: #fff; border: 1px solid #ddd;
        }

        /* Aide */
        .fh-help-btn {
            width: 22px; height: 22px;
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
        .fh-help-btn:hover { background: #e0e0e0; color: #333; }
        .fh-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 310px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .fh-help-popup.show { display: block; }
        .fh-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .fh-help-popup p { margin: 0 0 6px; }
        .fh-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .fh-resize-handle {
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
        .fh-container:hover .fh-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données historiques ───────────────────────────────────────────────────
const FH_NOW = new Date().getFullYear();

const FH_PERIODS = [
    {
        name: 'Préhistoire', short: 'Préhist.', start: -6000000, end: -3000, color: '#9c7a54',
        from: 'Apparition des premiers ancêtres de l\'Homme', to: 'Invention de l\'écriture',
        desc: 'C\'est la période la plus longue de l\'histoire de l\'humanité. Les premiers humains sont nomades : ils vivent de la chasse, de la pêche et de la cueillette. Ils taillent la pierre, maîtrisent le feu et peignent sur les parois des grottes. Au Néolithique, ils deviennent agriculteurs et éleveurs, et s\'installent dans des villages.'
    },
    {
        name: 'Antiquité', short: 'Antiq.', start: -3000, end: 476, color: '#d39b2f',
        from: 'Invention de l\'écriture', to: 'Chute de l\'Empire romain d\'Occident',
        desc: 'L\'écriture apparaît en Mésopotamie. De grandes civilisations se développent : l\'Égypte des pharaons, la Grèce, puis Rome. En Gaule, les Gaulois sont conquis par Jules César ; la Gaule devient romaine (on parle de Gallo-Romains).'
    },
    {
        name: 'Moyen Âge', short: 'M. Âge', start: 476, end: 1492, color: '#5b8c5a',
        from: 'Chute de l\'Empire romain d\'Occident', to: 'Découverte de l\'Amérique par Christophe Colomb',
        desc: 'La société est organisée autour des seigneurs, qui vivent dans des châteaux forts et protègent les paysans. L\'Église est très puissante : on construit des églises romanes puis des cathédrales gothiques. Les rois de France agrandissent peu à peu leur royaume.'
    },
    {
        name: 'Temps modernes', short: 'T. mod.', start: 1492, end: 1789, color: '#4f7cac',
        from: 'Découverte de l\'Amérique par Christophe Colomb', to: 'Révolution française',
        desc: 'C\'est l\'époque des grandes découvertes et de la Renaissance (arts, sciences, imprimerie). Les rois deviennent tout-puissants : c\'est la monarchie absolue, symbolisée par Louis XIV à Versailles. Au XVIIIe siècle, les philosophes des Lumières critiquent ce pouvoir.'
    },
    {
        name: 'Époque contemporaine', short: 'Contemp.', start: 1789, end: FH_NOW, color: '#b5536b',
        from: 'Révolution française', to: 'Aujourd\'hui',
        desc: 'La Révolution met fin à la monarchie absolue et proclame les droits de l\'Homme. Puis viennent Napoléon, l\'industrialisation, la République et l\'école gratuite, laïque et obligatoire. Le XXe siècle est marqué par deux guerres mondiales et de grands progrès scientifiques.'
    }
];

// y : année (négative avant notre ère) ; d : date affichée ; t : texte
const FH_EVENTS = [
    { y: -3200000, d: 'vers -3,2 millions', t: 'Lucy (australopithèque)' },
    { y: -400000,  d: 'vers -400 000',      t: 'Maîtrise du feu' },
    { y: -300000,  d: 'vers -300 000',      t: 'Homo sapiens' },
    { y: -17000,   d: 'vers -17 000',       t: 'Peintures de Lascaux' },
    { y: -10000,   d: 'vers -10 000',       t: 'Néolithique : agriculture' },
    { y: -3000,    d: 'vers -3 000',        t: 'Invention de l\'écriture', b: true },
    { y: -2600,    d: 'vers -2 600',        t: 'Pyramides d\'Égypte' },
    { y: -52,      d: '-52',                t: 'Bataille d\'Alésia' },
    { y: 1,        d: 'an 1',               t: 'Début de notre ère' },
    { y: 476,      d: '476',                t: 'Chute de l\'Empire romain', b: true },
    { y: 496,      d: 'vers 496',           t: 'Baptême de Clovis' },
    { y: 800,      d: '800',                t: 'Charlemagne empereur' },
    { y: 987,      d: '987',                t: 'Hugues Capet roi' },
    { y: 1429,     d: '1429',               t: 'Jeanne d\'Arc' },
    { y: 1450,     d: 'vers 1450',          t: 'Imprimerie (Gutenberg)' },
    { y: 1492,     d: '1492',               t: 'Christophe Colomb en Amérique', b: true },
    { y: 1515,     d: '1515',               t: 'Marignan (François Ier)' },
    { y: 1682,     d: '1682',               t: 'Louis XIV à Versailles' },
    { y: 1789,     d: '1789',               t: 'Révolution française', b: true },
    { y: 1804,     d: '1804',               t: 'Napoléon Ier empereur' },
    { y: 1848,     d: '1848',               t: 'Abolition de l\'esclavage' },
    { y: 1882,     d: '1882',               t: 'École obligatoire (J. Ferry)' },
    { y: 1914,     d: '1914-1918',          t: '1re Guerre mondiale' },
    { y: 1939,     d: '1939-1945',          t: '2e Guerre mondiale' },
    { y: 1969,     d: '1969',               t: 'Premiers pas sur la Lune' }
];

function _fhFmtYear(y) {
    if (y === FH_NOW) return 'Aujourd\'hui (' + y + ')';
    if (y <= -1000000) return '-' + String(Math.abs(y) / 1000000).replace('.', ',') + ' millions';
    if (y < -9999) return '-' + Math.abs(y).toLocaleString('fr-FR');
    if (y < 0) return '-' + Math.abs(y).toLocaleString('fr-FR');
    return String(y);
}

function _fhEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let _fhCtx = null;
function _fhTextW(txt, size, weight) {
    if (!_fhCtx) _fhCtx = document.createElement('canvas').getContext('2d');
    _fhCtx.font = (weight || 400) + ' ' + size + 'px "Segoe UI", system-ui, sans-serif';
    return _fhCtx.measureText(txt).width;
}

function _fhPeriodOf(y) {
    for (let i = 0; i < FH_PERIODS.length; i++) {
        if (y < FH_PERIODS[i].end || i === FH_PERIODS.length - 1) return i;
    }
    return FH_PERIODS.length - 1;
}

// Répartit des étiquettes [{left, right}] sur plusieurs niveaux sans chevauchement
function _fhStagger(items, gap) {
    const rows = [];
    items.forEach(it => {
        let lvl = rows.findIndex(r => r + gap <= it.left);
        if (lvl < 0) { lvl = rows.length; rows.push(-Infinity); }
        rows[lvl] = it.right;
        it.level = lvl;
    });
    return rows.length;
}

// ── Création du widget ────────────────────────────────────────────────────
function createFriseHistoriqueWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'frise-historique';
    widget.dataset.transparent = 'true';
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

    const container = document.createElement('div');
    container.className = 'fh-container';

    // Taille initiale : 75% de la largeur de la page
    const initW = Math.round(window.innerWidth * 0.75);
    container.style.width = initW + 'px';

    // En-tête
    const header = document.createElement('div');
    header.className = 'fh-header';
    header.innerHTML = `
        <span class="fh-title">📜 Frise historique</span>
        <span class="fh-badge">Échelle égale</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.fh-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'fh-controls';
    controls.innerHTML = `
        <button class="fh-btn fh-btn-events on" title="Afficher / cacher les repères historiques">📍 Repères</button>
        <button class="fh-btn fh-btn-hide" title="Cacher le nom des périodes pour faire deviner les élèves">🙈 Masquer les noms</button>
        <button class="fh-btn fh-btn-reveal" style="display:none">👁 Tout révéler</button>
        <button class="fh-btn fh-btn-add" title="Ajouter un repère personnalisé">➕ Ajouter un repère</button>
        <div class="fh-scale-btns">
            <span class="fh-scale-lbl">Échelle :</span>
            <button class="fh-scale-btn active" data-scale="equal">Égale</button>
            <button class="fh-scale-btn" data-scale="prop">Proportionnelle</button>
        </div>
    `;
    const evBtn     = controls.querySelector('.fh-btn-events');
    const hideBtn   = controls.querySelector('.fh-btn-hide');
    const revealBtn = controls.querySelector('.fh-btn-reveal');
    const addBtn    = controls.querySelector('.fh-btn-add');
    container.appendChild(controls);

    // Zone d'ajout de repère
    const addZone = document.createElement('div');
    addZone.className = 'fh-add';
    addZone.innerHTML = `
        <span>Année :</span>
        <input class="fh-add-year" type="text" placeholder="ex. -52" maxlength="9" spellcheck="false" autocomplete="off">
        <span>Événement :</span>
        <input class="fh-add-label" type="text" placeholder="ex. Naissance de mon village" maxlength="40" spellcheck="false" autocomplete="off">
        <button class="fh-add-ok">✓ Ajouter</button>
        <span class="fh-add-msg"></span>
    `;
    const addYear  = addZone.querySelector('.fh-add-year');
    const addLabel = addZone.querySelector('.fh-add-label');
    const addOk    = addZone.querySelector('.fh-add-ok');
    const addMsg   = addZone.querySelector('.fh-add-msg');
    container.appendChild(addZone);

    // Scène de la frise
    const stage = document.createElement('div');
    stage.className = 'fh-stage';
    const evTrack   = document.createElement('div'); evTrack.className   = 'fh-events';
    const band      = document.createElement('div'); band.className      = 'fh-band';
    const dateTrack = document.createElement('div'); dateTrack.className = 'fh-dates';
    stage.appendChild(evTrack);
    stage.appendChild(band);
    stage.appendChild(dateTrack);
    container.appendChild(stage);

    const scaleNote = document.createElement('div');
    scaleNote.className = 'fh-scale-note';
    container.appendChild(scaleNote);

    // Fiche de la période sélectionnée
    const detail = document.createElement('div');
    detail.className = 'fh-detail';
    container.appendChild(detail);

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'fh-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'fh-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La frise historique</h4>
        <p>La frise présente les <b>5 grandes périodes</b> de l'histoire, de la Préhistoire à nos jours.</p>
        <p>👆 <b>Clique sur une période</b> pour l'agrandir : elle prend plus de place sur la frise,
        seuls ses repères sont affichés et sa fiche apparaît (dates, début, fin, description).
        Clique à nouveau dessus pour revenir à la frise complète.</p>
        <p>📍 <b>Repères</b> : affiche ou cache les grands événements historiques.</p>
        <p>🙈 <b>Masquer les noms</b> : les noms des périodes sont cachés ; clique sur une période
        pour la dévoiler. Idéal pour faire réviser les élèves !</p>
        <p>➕ <b>Ajouter un repère</b> : place ton propre événement (année négative avant notre ère,
        ex. -52). Survole-le puis clique sur × pour le supprimer.</p>
        <p>📏 <b>Échelle égale</b> : chaque période a la même largeur.
        <b>Échelle proportionnelle</b> : la largeur dépend de la durée réelle (la Préhistoire,
        beaucoup trop longue, est raccourcie : voir la coupure ⚡).</p>
        <p style="color:#888">Redimensionne le widget avec le coin en bas à droite
        (largeur et hauteur de la frise).</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'fh-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let scale = 'equal';          // 'equal' | 'prop'
    let showEvents = true;
    let hideNames = false;
    let revealed = new Set();     // périodes dévoilées en mode masqué
    let selected = -1;            // période dont la fiche est ouverte
    let custom = [];              // repères personnalisés [{ y, t }]
    let bandH = Math.max(60, Math.round(initW * 0.075));

    // ── Géométrie ─────────────────────────────────────────────────────────
    function baseFractions() {
        if (scale === 'equal') return FH_PERIODS.map(() => 1 / FH_PERIODS.length);
        const pre = 0.16;
        const total = FH_NOW - FH_PERIODS[1].start;
        return FH_PERIODS.map((p, i) => i === 0 ? pre : (1 - pre) * (p.end - p.start) / total);
    }

    // Largeurs cibles : la période sélectionnée est agrandie, les autres se resserrent
    const FH_ZOOM = 0.6; // part de la frise occupée par la période agrandie
    function targetFractions() {
        const base = baseFractions();
        if (selected < 0) return base;
        const z = Math.max(base[selected], FH_ZOOM);
        const rest = base.reduce((sum, f, i) => i === selected ? sum : sum + f, 0);
        return base.map((f, i) => i === selected ? z : (1 - z) * f / rest);
    }

    let animFr = null;   // largeurs intermédiaires pendant l'animation
    let animId = null;
    function segFractions() { return animFr || targetFractions(); }

    // Animation fluide entre les anciennes et les nouvelles largeurs
    function animateTo(fromFr) {
        if (animId) cancelAnimationFrame(animId);
        const to = targetFractions();
        const t0 = performance.now(), dur = 380;
        const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            if (k >= 1 || !document.body.contains(widget)) {
                animFr = null; animId = null;
                render(); renderDetail();
                return;
            }
            const e = ease(k);
            animFr = fromFr.map((f, i) => f + (to[i] - f) * e);
            render();
            animId = requestAnimationFrame(step);
        };
        animId = requestAnimationFrame(step);
    }

    function layout(bw) {
        const fr = segFractions();
        let x = 0;
        return fr.map(f => { const s = { x, w: f * bw }; x += f * bw; return s; });
    }

    function xOf(y, segs) {
        const i = _fhPeriodOf(y);
        const p = FH_PERIODS[i];
        let f;
        if (i === 0) {
            // Échelle logarithmique pour la Préhistoire (sinon tout serait collé à la fin)
            const k = 1000;
            f = 1 - Math.log10(1 + (p.end - y) / k) / Math.log10(1 + (p.end - p.start) / k);
        } else {
            f = (y - p.start) / (p.end - p.start);
        }
        f = Math.max(0, Math.min(1, f));
        return segs[i].x + f * segs[i].w;
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function render() {
        const W = stage.clientWidth;
        if (!W) return;
        const fs = Math.max(11, Math.min(24, W / 80));
        const arrowW = Math.round(bandH * 0.45);
        const bw = W - arrowW;
        const segs = layout(bw);

        // Bandeau des périodes
        band.innerHTML = '';
        band.style.height = bandH + 'px';
        FH_PERIODS.forEach((p, i) => {
            const seg = document.createElement('div');
            seg.className = 'fh-seg';
            seg.style.left = segs[i].x + 'px';
            seg.style.width = segs[i].w + 'px';
            seg.style.background = p.color;
            if (i === FH_PERIODS.length - 1) seg.style.borderRight = 'none';
            const nameSize = Math.round(fs * 1.3);
            const isHidden = hideNames && !revealed.has(i);
            const name = document.createElement('span');
            name.className = 'fh-seg-name';
            if (isHidden) {
                seg.classList.add('hidden-name');
                name.textContent = '?';
                name.style.fontSize = nameSize + 'px';
                seg.title = 'Clique pour dévoiler cette période';
            } else {
                const avail = segs[i].w - 16;
                let txt = p.name, size = nameSize;
                if (_fhTextW(txt, size, 800) > avail) {
                    // Sur deux lignes si le nom contient un espace
                    const parts = txt.split(' ');
                    const longest = parts.reduce((m, w) => Math.max(m, _fhTextW(w, size, 800)), 0);
                    if (parts.length > 1 && longest <= avail) {
                        txt = parts.join('\n');
                        name.style.whiteSpace = 'pre-line';
                    } else {
                        txt = p.short;
                        size = Math.round(fs * 1.05);
                        if (_fhTextW(txt, size, 800) > avail) name.classList.add('vert');
                    }
                }
                name.textContent = txt;
                name.style.fontSize = size + 'px';
                seg.title = p.name + ' (' + _fhFmtYear(p.start) + ' → ' + (i === FH_PERIODS.length - 1 ? 'aujourd\'hui' : _fhFmtYear(p.end)) + ')'
                    + (selected === i ? ' — clique pour revenir à la frise complète' : ' — clique pour agrandir');
            }
            if (selected >= 0) seg.classList.add(selected === i ? 'sel' : 'dim');
            seg.appendChild(name);
            seg.addEventListener('mousedown', (e) => e.stopPropagation());
            seg.addEventListener('click', (e) => { e.stopPropagation(); onSegClick(i); });
            band.appendChild(seg);
        });
        // Flèche du temps
        const arrow = document.createElement('div');
        arrow.className = 'fh-arrow';
        arrow.style.left = (bw - 1) + 'px';
        arrow.style.width = (arrowW + 1) + 'px';
        arrow.style.background = FH_PERIODS[FH_PERIODS.length - 1].color;
        arrow.style.clipPath = 'polygon(0 0, 100% 50%, 0 100%)';
        if (selected >= 0 && selected !== FH_PERIODS.length - 1) arrow.style.opacity = '.45';
        band.appendChild(arrow);
        // Coupure de la Préhistoire en échelle proportionnelle
        if (scale === 'prop') {
            const br = document.createElement('div');
            br.className = 'fh-break';
            br.style.left = (segs[0].w * 0.2 - 7) + 'px';
            band.appendChild(br);
        }

        renderEvents(W, fs, segs);
        renderDates(W, fs, segs, bw);

        scaleNote.style.fontSize = Math.round(fs * 0.85) + 'px';
        scaleNote.textContent = scale === 'equal'
            ? 'Échelle non proportionnelle : chaque période a la même largeur.'
            : 'Échelle proportionnelle à la durée (la Préhistoire, qui dure environ 6 millions d\'années, est raccourcie).';
    }

    function renderEvents(W, fs, segs) {
        evTrack.innerHTML = '';
        if (!showEvents) { evTrack.style.height = '0px'; evTrack.style.display = 'none'; return; }
        evTrack.style.display = '';
        const dSize = Math.round(fs * 0.85), tSize = Math.round(fs * 0.8);
        const all = FH_EVENTS.map(e => ({ ...e }))
            .concat(custom.map((c, idx) => ({ y: c.y, d: _fhFmtYear(c.y), t: c.t, c: true, idx })))
            .filter(e => {
                if (selected < 0) return true;
                const p = FH_PERIODS[selected];
                return e.y >= p.start && e.y <= p.end;
            });
        // Création des étiquettes puis mesure réelle de leur largeur
        const items = all.map(e => {
            const p = FH_PERIODS[_fhPeriodOf(e.y)];
            const ev = document.createElement('div');
            ev.className = 'fh-ev' + (e.b ? ' boundary' : '') + (e.c ? ' custom' : '');
            const stem = document.createElement('div');
            stem.className = 'fh-ev-stem';
            const dot = document.createElement('div');
            dot.className = 'fh-ev-dot';
            const lbl = document.createElement('div');
            lbl.className = 'fh-ev-lbl';
            lbl.style.borderLeftColor = e.c ? '#7c3aed' : p.color;
            lbl.innerHTML = `<b style="font-size:${dSize}px">${_fhEsc(e.d)}</b><span style="font-size:${tSize}px">${_fhEsc(e.t)}</span>`;
            if (e.c) {
                const del = document.createElement('button');
                del.className = 'fh-ev-del';
                del.title = 'Supprimer ce repère';
                del.textContent = '×';
                del.addEventListener('mousedown', (ev2) => ev2.stopPropagation());
                del.addEventListener('click', (ev2) => {
                    ev2.stopPropagation();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    custom.splice(e.idx, 1);
                    render(); renderDetail(); saveBoard();
                });
                lbl.appendChild(del);
            }
            ev.appendChild(stem);
            ev.appendChild(dot);
            ev.appendChild(lbl);
            evTrack.appendChild(ev);
            return { e, ev, stem, lbl, x: xOf(e.y, segs) };
        }).sort((a, b) => a.x - b.x);
        items.forEach(it => {
            it.w = Math.ceil(it.lbl.offsetWidth) + 2;
            it.left = Math.max(0, Math.min(W - it.w, it.x - it.w / 2));
            it.right = it.left + it.w;
        });
        const nLevels = _fhStagger(items, 4);
        const rowH = Math.max(...items.map(it => it.lbl.offsetHeight), 20) + 6;
        const base = 10;
        evTrack.style.height = (nLevels * rowH + base + 4) + 'px';

        items.forEach(it => {
            const stemH = base + it.level * rowH;
            it.ev.style.left = it.x + 'px';
            it.stem.style.height = stemH + 'px';
            it.lbl.style.bottom = stemH + 'px';
            it.lbl.style.left = (it.left - it.x) + 'px';
        });
    }

    function renderDates(W, fs, segs, bw) {
        dateTrack.innerHTML = '';
        const size = Math.round(fs * 0.95);
        const years = FH_PERIODS.map(p => p.start).concat([FH_NOW]);
        const items = years.map((y, i) => {
            const x = i === years.length - 1 ? bw : xOf(y, segs);
            const txt = _fhFmtYear(y);
            const w = Math.ceil(_fhTextW(txt, size, 800));
            const left = Math.max(0, Math.min(W - w, x - w / 2));
            return { x, txt, w, left, right: left + w };
        });
        const n = _fhStagger(items, 8);
        const tickH = 8, rowH = Math.round(size * 1.35);
        dateTrack.style.height = (tickH + n * rowH + 4) + 'px';
        items.forEach(it => {
            const d = document.createElement('div');
            d.className = 'fh-date';
            d.style.left = it.x + 'px';
            const tick = document.createElement('div');
            tick.className = 'fh-date-tick';
            tick.style.height = (tickH + it.level * rowH) + 'px';
            const lbl = document.createElement('div');
            lbl.className = 'fh-date-lbl';
            lbl.style.fontSize = size + 'px';
            lbl.style.top = (tickH + it.level * rowH) + 'px';
            lbl.style.left = (it.left - it.x) + 'px';
            lbl.textContent = it.txt;
            d.appendChild(tick);
            d.appendChild(lbl);
            dateTrack.appendChild(d);
        });
    }

    function renderDetail() {
        if (selected < 0 || (hideNames && !revealed.has(selected))) {
            detail.classList.remove('show');
            detail.innerHTML = '';
            return;
        }
        const W = stage.clientWidth || initW;
        const fs = Math.max(12, Math.min(22, W / 75));
        const i = selected, p = FH_PERIODS[i];
        const endTxt = i === FH_PERIODS.length - 1 ? 'nos jours' : _fhFmtYear(p.end);
        const evs = FH_EVENTS.filter(e => _fhPeriodOf(e.y) === i && !e.b)
            .concat(custom.filter(c => _fhPeriodOf(c.y) === i).map(c => ({ d: _fhFmtYear(c.y), t: c.t })));
        detail.style.borderLeftColor = p.color;
        detail.style.fontSize = Math.round(fs * 0.9) + 'px';
        detail.innerHTML = `
            <h4 style="color:${p.color};font-size:${Math.round(fs * 1.35)}px">${_fhEsc(p.name)}</h4>
            <div class="fh-d-dates">De ${_fhFmtYear(p.start)} à ${endTxt}</div>
            <div class="fh-d-limits">▶ <b>Début :</b> ${_fhEsc(p.from)} &nbsp;&nbsp; ■ <b>Fin :</b> ${_fhEsc(p.to)}</div>
            <p>${_fhEsc(p.desc)}</p>
            ${evs.length ? '<div class="fh-d-chips">' + evs.map(e =>
                `<span class="fh-chip"><b>${_fhEsc(e.d)}</b> : ${_fhEsc(e.t)}</span>`).join('') + '</div>' : ''}
        `;
        detail.classList.add('show');
    }

    // ── Interactions ──────────────────────────────────────────────────────
    function onSegClick(i) {
        const fromFr = segFractions();
        if (hideNames && !revealed.has(i)) {
            revealed.add(i);
            selected = -1;
        } else {
            selected = selected === i ? -1 : i;
        }
        renderDetail();
        animateTo(fromFr);
        saveBoard();
    }

    function setScale(sc) {
        const fromFr = segFractions();
        scale = sc === 'prop' ? 'prop' : 'equal';
        badge.textContent = scale === 'prop' ? 'Échelle proportionnelle' : 'Échelle égale';
        container.querySelectorAll('.fh-scale-btn').forEach(b => b.classList.toggle('active', b.dataset.scale === scale));
        animateTo(fromFr);
    }

    function setShowEvents(v) {
        showEvents = !!v;
        evBtn.classList.toggle('on', showEvents);
        render();
    }

    function setHideNames(v) {
        hideNames = !!v;
        hideBtn.classList.toggle('on', hideNames);
        hideBtn.textContent = hideNames ? '🙉 Afficher les noms' : '🙈 Masquer les noms';
        revealBtn.style.display = hideNames ? '' : 'none';
        render(); renderDetail();
    }

    function addCustom() {
        const raw = (addYear.value || '').replace(/[\s\u00a0\u202f.]/g, '').replace(/^−/, '-');
        const label = (addLabel.value || '').trim();
        addMsg.textContent = '';
        if (!/^-?\d+$/.test(raw)) { addMsg.textContent = 'Année invalide (ex. 1515 ou -52).'; return; }
        const y = parseInt(raw, 10);
        if (y < FH_PERIODS[0].start || y > FH_NOW) {
            addMsg.textContent = 'L\'année doit être comprise entre -6 000 000 et ' + FH_NOW + '.';
            return;
        }
        if (!label) { addMsg.textContent = 'Écris le nom de l\'événement.'; return; }
        if (typeof snapshotNow === 'function') snapshotNow();
        custom.push({ y, t: label });
        addYear.value = ''; addLabel.value = '';
        if (!showEvents) setShowEvents(true); else render();
        renderDetail();
        saveBoard();
    }

    evBtn.addEventListener('click', () => { setShowEvents(!showEvents); saveBoard(); });
    hideBtn.addEventListener('click', () => {
        revealed = new Set();
        if (!hideNames) selected = -1;
        setHideNames(!hideNames);
        saveBoard();
    });
    revealBtn.addEventListener('click', () => {
        FH_PERIODS.forEach((p, i) => revealed.add(i));
        render(); renderDetail(); saveBoard();
    });
    addBtn.addEventListener('click', () => {
        const open = addZone.classList.toggle('show');
        addBtn.classList.toggle('on', open);
        addMsg.textContent = '';
        if (open) setTimeout(() => addYear.focus(), 0);
    });
    addOk.addEventListener('click', (e) => { e.stopPropagation(); addCustom(); });
    [addYear, addLabel].forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') addCustom();
        });
        inp.addEventListener('mousedown', (e) => e.stopPropagation());
        inp.addEventListener('click', (e) => { e.stopPropagation(); inp.focus(); });
    });
    container.querySelectorAll('.fh-scale-btn').forEach(btn => {
        btn.addEventListener('click', () => { setScale(btn.dataset.scale); saveBoard(); });
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Resize 2D (largeur du widget + hauteur de la frise)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = bandH;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(480, startW + ev.clientX - startX) + 'px';
            bandH = Math.max(40, startH + ev.clientY - startY);
            render(); renderDetail();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = bandH;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width = Math.max(480, startW + t.clientX - startX) + 'px';
            bandH = Math.max(40, startH + t.clientY - startY);
            render(); renderDetail();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Re-rendu si la largeur change (plein écran, fenêtre…)
    let _lastW = 0;
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            const w = stage.clientWidth;
            if (w && w !== _lastW) { _lastW = w; render(); renderDetail(); }
        });
        ro.observe(stage);
    }

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '📜 Frise historique', {
            onExpand: () => requestAnimationFrame(() => { render(); renderDetail(); })
        });
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = bandH;
            container.classList.add('wf-fullboard');
            bandH = Math.max(bandH, Math.round(window.innerHeight * 0.14));
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) bandH = _savedH;
        }
        requestAnimationFrame(() => { render(); renderDetail(); });
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
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

    render();
    requestAnimationFrame(() => requestAnimationFrame(() => { render(); renderDetail(); }));

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._fhGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        bandH:      _isMax && _savedH ? _savedH : bandH,
        scale,
        showEvents,
        hideNames,
        revealed:   Array.from(revealed),
        selected,
        custom:     custom.map(c => ({ y: c.y, t: c.t }))
    });
    widget._fhSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.bandH)      bandH = Math.max(40, d.bandH);
        if (Array.isArray(d.custom)) {
            custom = d.custom
                .filter(c => c && typeof c.y === 'number' && typeof c.t === 'string')
                .map(c => ({ y: c.y, t: c.t.slice(0, 40) }));
        }
        if (Array.isArray(d.revealed)) revealed = new Set(d.revealed.filter(n => n >= 0 && n < FH_PERIODS.length));
        if (typeof d.selected === 'number') selected = d.selected;
        scale = d.scale === 'prop' ? 'prop' : 'equal';
        badge.textContent = scale === 'prop' ? 'Échelle proportionnelle' : 'Échelle égale';
        container.querySelectorAll('.fh-scale-btn').forEach(b => b.classList.toggle('active', b.dataset.scale === scale));
        showEvents = d.showEvents !== false;
        evBtn.classList.toggle('on', showEvents);
        setHideNames(!!d.hideNames);
        requestAnimationFrame(() => { render(); renderDetail(); });
    };

    saveBoard();
    return widget;
}
