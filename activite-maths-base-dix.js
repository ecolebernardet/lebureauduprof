// =========================================================================
// WIDGET LE MATÉRIEL BASE DIX — Le Bureau du Prof
// Des cubes (unités), des barres (dizaines), des plaques (centaines) et des
// gros cubes (milliers) que l'on pose dans les colonnes d'un tapis de
// numération, puis que l'on manipule :
//   🔗 Grouper : 10 cubes se « collent » en une barre, 10 barres en une plaque…
//                → on voit la RETENUE.
//   🔨 Casser  : une barre se « casse » en 10 cubes, une plaque en 10 barres…
//                → on voit l'EMPRUNT.
// Cinq façons de jouer :
//   🧱 Libre          : construire et manipuler librement.
//   🎯 Représenter    : construire le nombre demandé (avec ou sans le moins de pièces).
//   ❓ Quel nombre ?  : un nombre est posé (parfois « en désordre », ex. 14 dizaines),
//                       la classe le trouve, puis on le révèle.
//   ➕ Addition       : les pièces des deux nombres sont posées, on regroupe
//                       par 10 → les retenues apparaissent dans l'opération posée.
//   ➖ Soustraction   : on enlève les pièces demandées ; s'il n'y en a pas assez,
//                       on casse une pièce de la colonne de gauche → l'emprunt.
//
// Même fenêtre que « L'atelier de phrases » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('b10-style')) return;
    const s = document.createElement('style');
    s.id = 'b10-style';
    s.textContent = `
        .widget[data-type="base-dix"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: default;
        }
        .b10-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 9px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            cursor: default;
            overflow: hidden;
        }

        /* En-tête */
        .b10-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: grab; }
        .b10-header:active { cursor: grabbing; }
        .b10-container.wf-fullboard .b10-header { cursor: default; }
        .b10-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .b10-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #fdecd8; color: #9a4a00; }

        /* Réduit / plein écran */
        .b10-container.wf-minimized > *:not(.b10-header) { display: none !important; }
        .b10-container.wf-minimized { gap: 0; }
        .b10-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .b10-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .b10-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .b10-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s, box-shadow .15s;
        }
        .b10-btn:active { transform: scale(0.96); }
        .b10-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .b10-btn-blue  { background: #4a90e2; color: #fff; }
        .b10-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .b10-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .b10-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .b10-btn-green { background: #28a745; color: #fff; }
        .b10-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .b10-btn.on    { background: #fdecd8; color: #9a4a00; border: 1px solid #f3c79a; }
        .b10-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .b10-tab {
            padding: 5px 10px; border-radius: 8px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 11px; font-weight: 800; cursor: pointer; color: #555;
        }
        .b10-tab:hover { background: #e9e9e9; }
        .b10-tab.active { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .b10-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .b10-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .b10-level-btn:hover { background: #e0e0e0; }
        .b10-level-btn.active { background: #fdecd8; color: #9a4a00; border-color: #f3c79a; }

        /* Barre d'outils */
        .b10-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .b10-mode {
            padding: 6px 12px; border-radius: 9px; border: 2px solid transparent;
            font-size: 13px; font-weight: 800; cursor: pointer;
            background: var(--ml); color: var(--mc);
            transition: transform .1s, border-color .15s, box-shadow .15s;
        }
        .b10-mode:hover { transform: translateY(-1px); }
        .b10-mode.active { border-color: var(--mc); box-shadow: 0 2px 6px rgba(0,0,0,.15); transform: scale(1.05); }
        .b10-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }

        /* Réserve de pièces */
        .b10-palette { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: 12px; color: #6b7280; font-weight: 700; }
        .b10-pal-item {
            display: flex; align-items: center; gap: 6px; padding: 4px 10px 4px 6px;
            border-radius: 10px; border: 2px solid var(--pc); background: #fff;
            cursor: pointer; touch-action: none; font-size: 12px; font-weight: 800; color: var(--pc);
            transition: transform .1s, box-shadow .15s;
        }
        .b10-pal-item:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.12); }
        .b10-pal-ico { display: flex; align-items: flex-end; justify-content: center; height: 26px; min-width: 26px; font-size: 2.4px; pointer-events: none; }
        .b10-pal-ico .b10-p { pointer-events: none; }

        /* Consigne */
        .b10-task {
            display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
            padding: 8px 12px; border-radius: 10px; background: #f0f7ff; border: 1px solid #cfe2fb;
            font-size: 15px; color: #1e3a5f; line-height: 1.35;
        }
        .b10-task:empty { display: none; }
        .b10-task .b10-big { font-size: 24px; font-weight: 900; color: #1d4ed8; letter-spacing: 1px; }
        .b10-task .b10-rest { display: inline-flex; gap: 6px; flex-wrap: wrap; }
        .b10-task .b10-chip {
            font-size: 13px; font-weight: 800; padding: 2px 9px; border-radius: 14px;
            background: #fff; border: 1.5px solid var(--cc); color: var(--cc);
        }
        .b10-task .b10-chip.done { opacity: .45; text-decoration: line-through; }
        .b10-task .b10-chip.lack { background: #fff1f1; border-color: #dc2626; color: #b91c1c; }

        /* Le tapis */
        .b10-stage-wrap { position: relative; flex-shrink: 0; }
        .b10-stage {
            --u: 14px;
            display: flex; gap: 6px; height: 260px;
            box-sizing: border-box; overflow: hidden;
        }
        .b10-col {
            display: flex; flex-direction: column; min-width: 0;
            border-radius: 10px; border: 2px solid var(--cl); background: var(--cbg);
            transition: box-shadow .12s, transform .12s;
        }
        .b10-col.over { box-shadow: 0 0 0 3px var(--cc); }
        .b10-col.over-bad { box-shadow: 0 0 0 3px #dc2626; }
        .b10-col-head {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 4px 6px; background: var(--cc); color: #fff; border-radius: 7px 7px 0 0;
            font-size: 13px; font-weight: 800; white-space: nowrap;
        }
        .b10-short { display: none; }
        .b10-stage.narrow .b10-long { display: none; }
        .b10-stage.narrow .b10-short { display: inline; text-transform: uppercase; }
        .b10-stage.narrow .b10-col-head { gap: 3px; padding: 4px 2px; font-size: 12px; }
        .b10-stage.narrow .b10-group-btn { font-size: 10px; padding: 3px 5px; white-space: normal; text-align: center; }
        .b10-count {
            min-width: 22px; padding: 0 6px; border-radius: 10px; background: rgba(255,255,255,.95);
            color: var(--cc); font-size: 12px; font-weight: 900; text-align: center; line-height: 18px;
        }
        .b10-count.ten { background: #fee2e2; color: #b91c1c; animation: b10Pulse 1.2s ease-in-out infinite; }
        @keyframes b10Pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .b10-pile {
            flex: 1; min-height: 0; overflow: hidden;
            display: flex; flex-wrap: wrap-reverse; align-content: flex-start; justify-content: center;
            align-items: flex-end; gap: calc(var(--u) * .35);
            padding: calc(var(--u) * .5);
            font-size: var(--u);
        }
        .b10-col-foot { min-height: 30px; display: flex; align-items: center; justify-content: center; padding: 3px; }
        .b10-group-btn {
            padding: 4px 9px; border-radius: 8px; border: 2px solid var(--cn); background: #fff;
            color: var(--cn); font-size: 11px; font-weight: 800; cursor: pointer; white-space: nowrap;
            animation: b10Fade .25s ease-out;
        }
        .b10-group-btn:hover { background: var(--cn); color: #fff; }

        /* Les pièces (tailles en em : 1em = 1 unité du tapis) */
        .b10-p { flex-shrink: 0; position: relative; touch-action: none; }
        .b10-p svg { display: block; width: 100%; height: 100%; overflow: visible; }
        .b10-p0 { width: 1em;  height: 1em; }
        .b10-p1 { width: 1em;  height: 10em; }
        .b10-p2 { width: 10em; height: 10em; }
        .b10-p3 { width: 12em; height: 12em; }
        .b10-pile .b10-p { cursor: pointer; transition: transform .12s, filter .12s; }
        .b10-tool-break .b10-pile .b10-p:not(.b10-p0) { cursor: pointer; }
        .b10-tool-break .b10-pile .b10-p:not(.b10-p0):hover { filter: drop-shadow(0 0 .25em #f59e0b); transform: scale(1.04); }
        .b10-tool-del .b10-pile .b10-p { cursor: pointer; }
        .b10-tool-del .b10-pile .b10-p:hover { filter: drop-shadow(0 0 .25em #dc2626) grayscale(.4); }
        .b10-pile .b10-p.dragging { opacity: .25; }
        .b10-p.new { animation: b10Pop .45s ease-out; }
        @keyframes b10Pop { 0% { transform: scale(.2); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        .b10-p.merge { animation: b10Merge .38s ease-in forwards; }
        @keyframes b10Merge { to { transform: scale(.3) translateY(-1em); opacity: 0; } }
        .b10-p.gone { animation: b10Gone .3s ease-in forwards; }
        @keyframes b10Gone { to { transform: scale(.2) rotate(25deg); opacity: 0; } }
        .b10-ghost {
            position: fixed; z-index: 100000; pointer-events: none;
            transform: rotate(-3deg) scale(1.05); opacity: .92;
            filter: drop-shadow(0 6px 10px rgba(0,0,0,.25));
        }
        .b10-empty-hint {
            position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
            pointer-events: none; color: #9ca3af; font-size: 15px; font-weight: 700; text-align: center; padding: 20px;
        }

        /* Le nombre */
        .b10-info { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .b10-numtab { border-collapse: collapse; font-family: 'Nunito', 'Segoe UI', sans-serif; }
        .b10-numtab th { font-size: 11px; font-weight: 800; color: #fff; background: var(--cc); padding: 2px 10px; }
        .b10-numtab td {
            font-size: 24px; font-weight: 900; text-align: center; padding: 1px 10px; min-width: 34px;
            border: 2px solid var(--cl); color: #1f2937; background: #fff;
        }
        .b10-numtab td.ten { color: #b91c1c; background: #fff1f1; }
        .b10-eq { font-size: 15px; color: #374151; line-height: 1.5; }
        .b10-eq b { font-size: 22px; color: #111827; }
        .b10-eq .hid { display: inline-block; min-width: 2.2em; text-align: center; background: #e5e7eb; border-radius: 6px; color: #6b7280; }

        /* Opération posée */
        .b10-op { border-collapse: collapse; font-family: 'Nunito', 'Segoe UI', sans-serif; margin-left: auto; }
        .b10-op td { font-size: 22px; font-weight: 900; text-align: center; width: 30px; padding: 0 2px; color: #1f2937; }
        .b10-op td.sign { color: #6b7280; width: 22px; }
        .b10-op tr.marks td { font-size: 13px; color: #dc2626; height: 18px; vertical-align: bottom; }
        .b10-op tr.res td { border-top: 3px solid #1f2937; }
        .b10-op tr.res td.sign { border-top: none; }
        .b10-op tr.b td { color: #6b7280; }
        .b10-op .q { color: #9ca3af; }

        /* Légende addition */
        .b10-legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; color: #4b5563; align-items: center; }
        .b10-legend span { display: inline-flex; align-items: center; gap: 4px; }
        .b10-legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

        /* Commentaire */
        .b10-verdict {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
            animation: b10Fade .3s ease-out;
        }
        .b10-verdict.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .b10-verdict.ko   { background: #fff1f1; border-color: #f5c2c2; color: #7f1d1d; }
        .b10-verdict.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        @keyframes b10Fade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Aide */
        .b10-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .b10-help-btn:hover { background: #e0e0e0; color: #333; }
        .b10-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 350px; max-width: calc(100% - 20px); font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .b10-help-popup.show { display: block; }
        .b10-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .b10-help-popup p { margin: 0 0 6px; }
        .b10-help-popup p:last-child { margin-bottom: 0; }

        .b10-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .b10-container:hover .b10-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Les ordres de grandeur ────────────────────────────────────────────────
// k : 0 = unités, 1 = dizaines, 2 = centaines, 3 = milliers
const B10_ORD = [
    { k: 0, val: 1,    nom: 'unité',   noms: 'unités',   piece: 'cube',      pieces: 'cubes',      pieceUn: 'un cube',      col: 'Unités',    abbr: 'u', c: '#f59e0b', d: '#b45309', l: '#fde68a', bg: '#fffbeb', cl: '#fcd34d' },
    { k: 1, val: 10,   nom: 'dizaine', noms: 'dizaines', piece: 'barre',     pieces: 'barres',     pieceUn: 'une barre',    col: 'Dizaines',  abbr: 'd', c: '#3b82f6', d: '#1d4ed8', l: '#bfdbfe', bg: '#eff6ff', cl: '#93c5fd' },
    { k: 2, val: 100,  nom: 'centaine', noms: 'centaines', piece: 'plaque',   pieces: 'plaques',    pieceUn: 'une plaque',   col: 'Centaines', abbr: 'c', c: '#16a34a', d: '#166534', l: '#bbf7d0', bg: '#f0fdf4', cl: '#86efac' },
    { k: 3, val: 1000, nom: 'millier', noms: 'milliers',  piece: 'gros cube', pieces: 'gros cubes', pieceUn: 'un gros cube', col: 'Milliers',  abbr: 'm', c: '#9333ea', d: '#6b21a8', l: '#e9d5ff', bg: '#faf5ff', cl: '#d8b4fe' }
];

const B10_LEVELS = {
    '2': { label: 'Jusqu\'à 99',    titre: 'Dizaines et unités (jusqu\'à 99)' },
    '3': { label: 'Jusqu\'à 999',   titre: 'Centaines, dizaines et unités (jusqu\'à 999)' },
    '4': { label: 'Jusqu\'à 9 999', titre: 'Milliers, centaines, dizaines et unités (jusqu\'à 9 999)' }
};

const B10_MODES = {
    libre:    { label: '🧱 Libre' },
    represent:{ label: '🎯 Représenter' },
    guess:    { label: '❓ Quel nombre ?' },
    add:      { label: '➕ Addition' },
    sub:      { label: '➖ Soustraction' }
};

const B10_MAX_PER_COL = 60;   // nombre maximum de pièces dans une colonne

// ── Dessins des pièces (SVG) ──────────────────────────────────────────────
function _b10Svg(k, light) {
    const o = B10_ORD[k];
    const fill = light ? o.l : o.c;
    const st = o.d;
    if (k === 0) {
        return `<svg viewBox="0 0 10 10"><rect x=".4" y=".4" width="9.2" height="9.2" rx="1.2" fill="${fill}" stroke="${st}" stroke-width=".8"/>` +
               `<path d="M2 3 L2 2 L3 2" stroke="#fff" stroke-opacity=".7" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>`;
    }
    if (k === 1) {
        let lines = '';
        for (let i = 1; i < 10; i++) lines += `<line x1=".6" y1="${i * 10}" x2="9.4" y2="${i * 10}" stroke="${st}" stroke-width=".7" stroke-opacity=".55"/>`;
        return `<svg viewBox="0 0 10 100" preserveAspectRatio="none"><rect x=".4" y=".4" width="9.2" height="99.2" rx="1.2" fill="${fill}" stroke="${st}" stroke-width=".8"/>${lines}` +
               `<line x1="2" y1="3" x2="2" y2="97" stroke="#fff" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/></svg>`;
    }
    if (k === 2) {
        let lines = '';
        for (let i = 1; i < 10; i++) {
            lines += `<line x1="${i * 10}" y1="1" x2="${i * 10}" y2="99" stroke="${st}" stroke-width=".6" stroke-opacity=".5"/>`;
            lines += `<line x1="1" y1="${i * 10}" x2="99" y2="${i * 10}" stroke="${st}" stroke-width=".6" stroke-opacity=".5"/>`;
        }
        return `<svg viewBox="0 0 100 100"><rect x=".6" y=".6" width="98.8" height="98.8" rx="2" fill="${fill}" stroke="${st}" stroke-width="1.2"/>${lines}</svg>`;
    }
    // Gros cube : vue en perspective (face avant + dessus + côté)
    const top = light ? '#f3e8ff' : '#c084fc';
    const side = light ? '#d8b4fe' : '#7e22ce';
    let grid = '';
    for (let i = 1; i < 10; i++) {
        grid += `<line x1="${i * 10}" y1="20" x2="${i * 10}" y2="120" stroke="${st}" stroke-width=".6" stroke-opacity=".5"/>`;
        grid += `<line x1="0" y1="${20 + i * 10}" x2="100" y2="${20 + i * 10}" stroke="${st}" stroke-width=".6" stroke-opacity=".5"/>`;
        grid += `<line x1="${i * 10}" y1="20" x2="${i * 10 + 20}" y2="0" stroke="${st}" stroke-width=".5" stroke-opacity=".45"/>`;
        grid += `<line x1="100" y1="${20 + i * 10}" x2="120" y2="${i * 10}" stroke="${st}" stroke-width=".5" stroke-opacity=".45"/>`;
    }
    return `<svg viewBox="0 0 120 120">` +
        `<polygon points="0,20 20,0 120,0 100,20" fill="${top}" stroke="${st}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<polygon points="100,20 120,0 120,100 100,120" fill="${side}" stroke="${st}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<rect x="0" y="20" width="100" height="100" fill="${fill}" stroke="${st}" stroke-width="1.2"/>${grid}` +
        `<rect x="0" y="20" width="100" height="100" fill="none" stroke="${st}" stroke-width="1.4"/></svg>`;
}

// ── Outils ────────────────────────────────────────────────────────────────
function _b10Rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function _b10Digits(n, L) {
    const d = [];
    for (let k = 0; k < L; k++) { d.push(n % 10); n = Math.floor(n / 10); }
    return d;   // d[k] = chiffre de rang k
}
function _b10Fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function _b10Pl(n, sing, plur) { return n + ' ' + (n > 1 ? plur : sing); }

function _b10IsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createBaseDixWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'base-dix';
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
    container.className = 'b10-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'b10-header';
    header.innerHTML = `
        <span class="b10-title">🧮 Le matériel base dix</span>
        <span class="b10-badge">Libre</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.b10-badge');
    container.appendChild(header);

    // ── Façons de jouer + niveaux ─────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'b10-row';
    controls.innerHTML = `
        <div class="b10-tabs">
            ${Object.keys(B10_MODES).map(k => `<button class="b10-tab" data-tab="${k}">${B10_MODES[k].label}</button>`).join('')}
        </div>
        <div class="b10-level-btns">
            ${Object.keys(B10_LEVELS).map(k => `<button class="b10-level-btn" data-level="${k}" title="${B10_LEVELS[k].titre}">${B10_LEVELS[k].label}</button>`).join('')}
        </div>
    `;
    container.appendChild(controls);

    // ── Outils ────────────────────────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'b10-tools';
    tools.innerHTML = `
        <button class="b10-mode" data-tool="move"  style="--mc:#1d4ed8;--ml:#dbeafe" title="Faire glisser les pièces d'une colonne à l'autre">✋ Manipuler</button>
        <button class="b10-mode" data-tool="break" style="--mc:#b45309;--ml:#fef3c7" title="Cliquer sur une pièce pour la casser en 10 pièces plus petites">🔨 Casser</button>
        <button class="b10-mode" data-tool="del"   style="--mc:#b91c1c;--ml:#fee2e2" title="Cliquer sur une pièce pour l'enlever">🗑 Enlever</button>
        <span class="b10-sep"></span>
        <button class="b10-btn b10-btn-grey" data-act="undo" title="Annuler la dernière manipulation">↩ Annuler</button>
        <button class="b10-btn b10-btn-grey" data-act="reset" title="Revenir au départ">🔄 Recommencer</button>
        <button class="b10-btn b10-btn-blue" data-act="new" title="Un nouveau nombre">🎲 Nouveau</button>
        <span class="b10-sep"></span>
        <button class="b10-btn b10-btn-grey" data-act="toggle-val" title="Afficher ou masquer le nombre obtenu">👁 Nombre</button>
        <button class="b10-btn b10-btn-grey" data-act="toggle-op" title="Afficher ou masquer l'opération posée">🧾 Opération</button>
    `;
    const undoBtn  = tools.querySelector('[data-act="undo"]');
    const resetBtn = tools.querySelector('[data-act="reset"]');
    const newBtn   = tools.querySelector('[data-act="new"]');
    const valBtn   = tools.querySelector('[data-act="toggle-val"]');
    const opBtn    = tools.querySelector('[data-act="toggle-op"]');
    container.appendChild(tools);

    // ── Réserve de pièces ─────────────────────────────────────────────────
    const palette = document.createElement('div');
    palette.className = 'b10-palette';
    container.appendChild(palette);

    // ── Consigne ──────────────────────────────────────────────────────────
    const task = document.createElement('div');
    task.className = 'b10-task';
    container.appendChild(task);

    // ── Le tapis ──────────────────────────────────────────────────────────
    const stageWrap = document.createElement('div');
    stageWrap.className = 'b10-stage-wrap';
    const stage = document.createElement('div');
    stage.className = 'b10-stage';
    stage.style.height = Math.round(initH * 0.48) + 'px';
    const emptyHint = document.createElement('div');
    emptyHint.className = 'b10-empty-hint';
    stageWrap.appendChild(stage);
    stageWrap.appendChild(emptyHint);
    container.appendChild(stageWrap);

    // ── Légende (addition) ────────────────────────────────────────────────
    const legend = document.createElement('div');
    legend.className = 'b10-legend';
    container.appendChild(legend);

    // ── Le nombre et l'opération ──────────────────────────────────────────
    const info = document.createElement('div');
    info.className = 'b10-info';
    container.appendChild(info);

    const verdictEl = document.createElement('div');
    verdictEl.className = 'b10-verdict';
    container.appendChild(verdictEl);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'b10-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'b10-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le matériel base dix</h4>
        <p>Un <b>cube</b> vaut 1 unité, une <b>barre</b> vaut 10 (une dizaine), une <b>plaque</b> vaut 100
        (une centaine), un <b>gros cube</b> vaut 1 000 (un millier).</p>
        <p><b>Ajouter</b> : cliquez sur une pièce de la réserve, ou faites-la glisser dans sa colonne.
        Une barre lâchée dans les unités arrive directement en 10 cubes.</p>
        <p><b>🔗 Grouper</b> : dès qu'une colonne a 10 pièces ou plus, son compteur clignote et un bouton
        apparaît : 10 cubes se collent en une barre. On peut aussi faire glisser un cube vers la colonne des dizaines.
        C'est la <b>retenue</b>.</p>
        <p><b>🔨 Casser</b> : cliquez sur une barre (outil Casser) ou faites-la glisser dans la colonne des unités :
        elle devient 10 cubes. C'est l'<b>emprunt</b>.</p>
        <p><b>🗑 Enlever</b> : cliquez sur une pièce, ou faites-la glisser hors du tapis.</p>
        <p><b>🎯 Représenter</b> : construire le nombre demandé. <b>❓ Quel nombre ?</b> : trouver le nombre posé
        (parfois avec plus de 10 pièces dans une colonne). <b>➕ Addition</b> : regrouper pour trouver le résultat ;
        les retenues s'écrivent dans l'opération posée. <b>➖ Soustraction</b> : enlever les pièces demandées,
        en cassant une pièce quand il n'y en a pas assez.</p>
        <p><b>👁 Nombre</b> masque le nombre obtenu pour le faire trouver aux élèves.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'b10-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let mode = 'libre';
    let level = '3';
    let tool = 'move';
    let showVal = true;
    let showOp = true;
    let cols = [[], [], [], []];   // cols[k] = liste de pièces { id, o } (o : 'a', 'b' ou 'g')
    let ex = null;                 // données de l'exercice en cours
    let start = null;              // état de départ (pour « Recommencer »)
    let history = [];
    let verdict = null;            // { cls, html }
    let busy = false;              // animation en cours
    let nextId = 1;
    let flash = new Set();         // pièces qui viennent d'apparaître

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function L() { return parseInt(level, 10); }
    function count(k) { return cols[k].length; }
    function value() { let v = 0; for (let k = 0; k < 4; k++) v += count(k) * B10_ORD[k].val; return v; }
    function piece(o) { return { id: nextId++, o: o || 'a' }; }
    function makePieces(n, o) { const a = []; for (let i = 0; i < n; i++) a.push(piece(o)); return a; }
    function isCanonical() { for (let k = 0; k < L(); k++) if (count(k) >= 10) return false; return true; }
    function say(cls, html) { verdict = { cls, html }; }

    function exportCols() { return cols.map(c => c.map(p => p.o).join('')); }
    function importCols(arr) {
        cols = [[], [], [], []];
        (arr || []).forEach((s, k) => {
            if (k > 3 || typeof s !== 'string') return;
            for (const ch of s) if (cols[k].length < B10_MAX_PER_COL) cols[k].push(piece(ch));
        });
    }
    function snap() { return { cols: exportCols(), ex: ex ? JSON.parse(JSON.stringify(ex)) : null }; }
    function pushHistory() {
        history.push(snap());
        if (history.length > 80) history.shift();
    }
    function restoreSnap(s) {
        importCols(s.cols);
        ex = s.ex ? JSON.parse(JSON.stringify(s.ex)) : null;
    }

    // ── Exercices ─────────────────────────────────────────────────────────
    function randNumber() {
        const lv = L();
        const lo = Math.pow(10, lv - 1), hi = Math.pow(10, lv) - 1;
        return _b10Rand(lo + 1, hi);
    }

    function newExercise() {
        const lv = L();
        const max = Math.pow(10, lv) - 1;
        cols = [[], [], [], []];
        verdict = null;
        if (mode === 'libre') {
            ex = null;
        } else if (mode === 'represent') {
            ex = { target: randNumber(), checked: false };
        } else if (mode === 'guess') {
            // Un nombre, posé parfois « en désordre » (plus de 10 pièces dans une colonne)
            const n = randNumber();
            const d = _b10Digits(n, lv);
            const breaks = _b10Rand(0, 2);
            for (let t = 0; t < breaks; t++) {
                const cand = [];
                for (let k = 1; k < lv; k++) if (d[k] > 0 && d[k - 1] + 10 <= 19) cand.push(k);
                if (!cand.length) break;
                const k = cand[_b10Rand(0, cand.length - 1)];
                d[k]--; d[k - 1] += 10;
            }
            for (let k = 0; k < lv; k++) cols[k] = makePieces(d[k], 'a');
            ex = { n, revealed: false };
        } else if (mode === 'add') {
            let a, b, tries = 0;
            do {
                const lo = Math.pow(10, lv - 1);
                a = _b10Rand(Math.max(1, Math.floor(lo / 2)), Math.floor(max * 0.7));
                b = _b10Rand(Math.max(1, Math.floor(lo / 2)), max - a);
                tries++;
            } while (tries < 300 && (b < 1 || a + b > max || !hasCarry(a, b, lv)));
            const da = _b10Digits(a, lv), db = _b10Digits(b, lv);
            for (let k = 0; k < lv; k++) cols[k] = makePieces(da[k], 'a').concat(makePieces(db[k], 'b'));
            ex = { a, b, carries: [0, 0, 0, 0], done: false };
        } else if (mode === 'sub') {
            let a, b, tries = 0;
            do {
                a = randNumber();
                b = _b10Rand(Math.max(1, Math.floor(a / 6)), a - 1);
                tries++;
            } while (tries < 300 && !hasBorrow(a, b, lv));
            const da = _b10Digits(a, lv), db = _b10Digits(b, lv);
            for (let k = 0; k < lv; k++) cols[k] = makePieces(da[k], 'a');
            ex = { a, b, rem: db.concat([0, 0, 0, 0]).slice(0, 4), borrows: [0, 0, 0, 0], done: false };
        }
        history = [];
        start = snap();
    }
    function hasCarry(a, b, lv) {
        const da = _b10Digits(a, lv), db = _b10Digits(b, lv);
        for (let k = 0; k < lv; k++) if (da[k] + db[k] >= 10) return true;
        return false;
    }
    function hasBorrow(a, b, lv) {
        const da = _b10Digits(a, lv), db = _b10Digits(b, lv);
        for (let k = 0; k < lv; k++) if (db[k] > da[k]) return true;
        return false;
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function pieceEl(k, p) {
        const el = document.createElement('div');
        el.className = 'b10-p b10-p' + k + (flash.has(p.id) ? ' new' : '');
        el.dataset.k = k;
        el.dataset.id = p.id;
        el.innerHTML = _b10Svg(k, p.o === 'b');
        el.title = B10_ORD[k].pieceUn.charAt(0).toUpperCase() + B10_ORD[k].pieceUn.slice(1) + ' = ' + _b10Fmt(B10_ORD[k].val);
        return el;
    }

    function renderStage() {
        stage.innerHTML = '';
        stage.className = 'b10-stage b10-tool-' + tool;
        const lv = L();
        const weights = { 3: 3.2, 2: 2.4, 1: 1.5, 0: 1.2 };
        for (let k = lv - 1; k >= 0; k--) {
            const o = B10_ORD[k];
            const col = document.createElement('div');
            col.className = 'b10-col';
            col.dataset.k = k;
            col.style.flex = weights[k] + ' 1 0';
            col.style.setProperty('--cc', o.c);
            col.style.setProperty('--cl', o.cl);
            col.style.setProperty('--cbg', o.bg);
            const n = count(k);
            const ten = n >= 10 && k < lv - 1;
            col.innerHTML = `<div class="b10-col-head"><span class="b10-long">${o.col}</span><span class="b10-short">${o.abbr}</span><span class="b10-count${ten ? ' ten' : ''}">${n}</span></div>`;
            const pile = document.createElement('div');
            pile.className = 'b10-pile';
            cols[k].forEach(p => pile.appendChild(pieceEl(k, p)));
            col.appendChild(pile);
            const foot = document.createElement('div');
            foot.className = 'b10-col-foot';
            if (ten) {
                const nx = B10_ORD[k + 1];
                const gb = document.createElement('button');
                gb.className = 'b10-group-btn';
                gb.dataset.group = k;
                gb.style.setProperty('--cn', nx.c);
                gb.textContent = `🔗 10 ${o.pieces} → ${nx.pieceUn}`;
                gb.title = `Coller 10 ${o.pieces} pour faire ${nx.pieceUn}`;
                foot.appendChild(gb);
            }
            col.appendChild(foot);
            stage.appendChild(col);
        }
        flash.clear();
        let any = false;
        for (let k = 0; k < lv; k++) if (count(k)) any = true;
        emptyHint.style.display = (!any && (mode === 'libre' || mode === 'represent')) ? '' : 'none';
        emptyHint.textContent = 'Cliquez sur une pièce de la réserve, ou faites-la glisser dans sa colonne.';
    }

    function renderPalette() {
        const show = mode === 'libre' || mode === 'represent';
        palette.style.display = show ? '' : 'none';
        if (!show) return;
        const lv = L();
        let html = '<span>Ajouter :</span>';
        for (let k = 0; k < lv; k++) {
            const o = B10_ORD[k];
            html += `<div class="b10-pal-item" data-add="${k}" style="--pc:${o.d}" title="Ajouter ${o.pieceUn} (${_b10Fmt(o.val)}) — cliquer ou faire glisser">
                <span class="b10-pal-ico" style="font-size:${[10, 2.5, 2.3, 2][k]}px"><span class="b10-p b10-p${k}">${_b10Svg(k, false)}</span></span>
                ${o.piece} = ${_b10Fmt(o.val)}</div>`;
        }
        palette.innerHTML = html;
    }

    function chip(k, txt, cls) {
        return `<span class="b10-chip ${cls || ''}" style="--cc:${B10_ORD[k].d}">${txt}</span>`;
    }

    function renderTask() {
        let html = '';
        if (mode === 'represent' && ex) {
            html = `<span>Construis le nombre</span><span class="b10-big">${_b10Fmt(ex.target)}</span>
                    <button class="b10-btn b10-btn-green" data-act="check">✔ Vérifier</button>`;
        } else if (mode === 'guess' && ex) {
            html = `<span>Quel est ce nombre ?</span><span class="b10-big">${ex.revealed ? _b10Fmt(ex.n) : '?'}</span>
                    <button class="b10-btn b10-btn-green" data-act="reveal">${ex.revealed ? '🙈 Cacher' : '👁 Révéler'}</button>`;
        } else if (mode === 'add' && ex) {
            html = `<span>Calcule</span><span class="b10-big">${_b10Fmt(ex.a)} + ${_b10Fmt(ex.b)}</span>
                    <span>en regroupant les pièces par 10.</span>`;
        } else if (mode === 'sub' && ex) {
            const lv = L();
            const chips = [];
            for (let k = lv - 1; k >= 0; k--) {
                const r = ex.rem[k];
                const tot = _b10Digits(ex.b, lv)[k];
                if (!tot) continue;
                const lack = r > count(k);
                chips.push(chip(k, `${r ? 'encore ' + _b10Pl(r, B10_ORD[k].piece, B10_ORD[k].pieces) : '✓ ' + B10_ORD[k].noms}`, r === 0 ? 'done' : (lack ? 'lack' : '')));
            }
            html = `<span>Calcule</span><span class="b10-big">${_b10Fmt(ex.a)} − ${_b10Fmt(ex.b)}</span>
                    <span>À enlever :</span><span class="b10-rest">${chips.join('')}</span>`;
        }
        task.innerHTML = html;
    }

    function renderLegend() {
        if (mode === 'add' && ex) {
            legend.style.display = '';
            legend.innerHTML = `<span><i style="background:#3b82f6"></i>Pièces foncées : ${_b10Fmt(ex.a)}</span>
                                <span><i style="background:#bfdbfe;box-shadow:inset 0 0 0 2px #1d4ed8"></i>Pièces claires : ${_b10Fmt(ex.b)}</span>`;
        } else {
            legend.style.display = 'none';
            legend.innerHTML = '';
        }
    }

    function valueHidden() {
        if (mode === 'guess') return !(ex && ex.revealed);
        if (mode === 'add') return !(ex && ex.done) && !showVal;
        return !showVal;
    }

    function renderInfo() {
        const lv = L();
        const hid = valueHidden();
        // Tableau de numération
        let th = '', td = '';
        for (let k = lv - 1; k >= 0; k--) {
            const o = B10_ORD[k];
            const n = count(k);
            th += `<th style="--cc:${o.c}">${o.abbr}</th>`;
            td += `<td class="${n >= 10 ? 'ten' : ''}" style="--cl:${o.cl}" title="${n >= 10 ? 'On ne peut écrire qu\'un seul chiffre par colonne : il faut grouper !' : ''}">${n}</td>`;
        }
        let parts = [], vals = [];
        for (let k = lv - 1; k >= 0; k--) {
            const n = count(k), o = B10_ORD[k];
            parts.push(_b10Pl(n, o.nom, o.noms));
            if (n) vals.push(_b10Fmt(n * o.val));
        }
        const v = value();
        const eq = parts.join(' + ') + (hid ? '' : ' = ' + (vals.length ? vals.join(' + ') : '0')) +
                   ' = ' + (hid ? '<span class="hid">?</span>' : `<b>${_b10Fmt(v)}</b>`);
        let html = `<table class="b10-numtab"><tr>${th}</tr><tr>${td}</tr></table><div class="b10-eq">${eq}</div>`;
        if (showOp && (mode === 'add' || mode === 'sub') && ex) html += posedOp();
        info.innerHTML = html;
    }

    // Opération posée, colonnes alignées : retenues (addition) ou emprunts (soustraction)
    function posedOp() {
        const lv = L();
        const da = _b10Digits(ex.a, lv), db = _b10Digits(ex.b, lv);
        const lead = (d) => { let i = lv - 1; while (i > 0 && d[i] === 0) i--; return i; };
        const la = lead(da), lb = lead(db);
        let marks = '<td class="sign"></td>', ra = '<td class="sign"></td>', rb = `<td class="sign">${mode === 'add' ? '+' : '−'}</td>`, rr = '<td class="sign">=</td>';
        const resD = ex.done ? _b10Digits(value(), lv) : null;
        const lr = resD ? lead(resD) : -1;
        for (let k = lv - 1; k >= 0; k--) {
            let m = '';
            if (mode === 'add') {
                const c = k > 0 ? ex.carries[k - 1] : 0;
                if (c) m = String(c);
            } else {
                const parts = [];
                if (ex.borrows[k - 1] && k > 0) parts.push('−' + ex.borrows[k - 1]);
                if (ex.borrows[k]) parts.push('+' + (10 * ex.borrows[k]));
                m = parts.join(' ');
            }
            marks += `<td>${m}</td>`;
            ra += `<td>${k <= la ? da[k] : ''}</td>`;
            rb += `<td>${k <= lb ? db[k] : ''}</td>`;
            rr += `<td>${resD ? (k <= lr ? resD[k] : '') : '<span class="q">?</span>'}</td>`;
        }
        return `<table class="b10-op" title="${mode === 'add' ? 'Les retenues apparaissent quand on groupe 10 pièces' : 'Les emprunts apparaissent quand on casse une pièce'}">` +
               `<tr class="marks">${marks}</tr><tr>${ra}</tr><tr class="b">${rb}</tr><tr class="res">${rr}</tr></table>`;
    }

    function renderVerdict() {
        verdictEl.style.display = '';
        if (verdict) {
            verdictEl.className = 'b10-verdict ' + (verdict.cls || '');
            verdictEl.innerHTML = verdict.html;
            return;
        }
        verdictEl.className = 'b10-verdict';
        verdictEl.innerHTML = {
            libre:     'Posez des pièces, puis <b>groupez</b> par 10 ou <b>cassez</b> une pièce. Le nombre change-t-il ?',
            represent: '🎯 Construisez le nombre avec les pièces de la réserve, puis cliquez sur <b>✔ Vérifier</b>.',
            guess:     '❓ Comptez les pièces de chaque colonne. Attention : une colonne peut avoir 10 pièces ou plus !',
            add:       '➕ Une colonne a 10 pièces ou plus ? <b>Groupez-les</b> : c\'est la retenue !',
            sub:       '➖ Enlevez les pièces demandées (outil <b>🗑 Enlever</b> ou en les sortant du tapis). Pas assez de pièces ? <b>Cassez</b> une pièce de la colonne de gauche !'
        }[mode];
    }

    function renderHeader() {
        badge.textContent = B10_MODES[mode].label.replace(/^\S+\s/, '') + ' · ' + B10_LEVELS[level].label;
        controls.querySelectorAll('.b10-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === mode));
        controls.querySelectorAll('.b10-level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
        tools.querySelectorAll('.b10-mode').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
        undoBtn.disabled  = !history.length || busy;
        resetBtn.disabled = !history.length || busy;
        newBtn.style.display = mode === 'libre' ? 'none' : '';
        resetBtn.textContent = mode === 'libre' ? '🗑 Tout vider' : '🔄 Recommencer';
        resetBtn.disabled = mode === 'libre' ? (busy || !cols.some(c => c.length)) : resetBtn.disabled;
        valBtn.classList.toggle('on', showVal);
        valBtn.style.display = mode === 'guess' ? 'none' : '';
        opBtn.classList.toggle('on', showOp);
        opBtn.style.display = (mode === 'add' || mode === 'sub') ? '' : 'none';
    }

    function renderAll() {
        renderHeader();
        renderPalette();
        renderTask();
        renderStage();
        renderLegend();
        renderInfo();
        renderVerdict();
        requestAnimationFrame(fit);
    }

    // ── Taille des pièces selon la place disponible ───────────────────────
    function fit() {
        const sh = stage.clientHeight, sw = stage.clientWidth;
        if (!sh || !sw) return;
        // Colonnes étroites (téléphone) : titres abrégés (c, d, u)
        stage.classList.remove('narrow');
        const colsEl = Array.from(stage.querySelectorAll('.b10-col'));
        const tooWide = c => {
            const h = c.querySelector('.b10-col-head');
            const need = Array.from(h.children).reduce((t, el) => t + (el.offsetWidth || 0), 0) + 22;
            return need > h.clientWidth;
        };
        if (colsEl.some(tooWide)) stage.classList.add('narrow');
        const piles = Array.from(stage.querySelectorAll('.b10-pile'));
        if (!piles.length) return;
        const pileH = piles[0].clientHeight || (sh - 70);
        let u = Math.max(3, Math.min(pileH / 13.5, sw / (L() * 14), 26));
        stage.style.setProperty('--u', u + 'px');
        let guard = 0;
        const overflow = () => piles.some(p => p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1);
        while (overflow() && u > 2.5 && guard++ < 90) {
            u *= 0.93;
            stage.style.setProperty('--u', u + 'px');
        }
    }

    // ── Fin d'exercice ? ──────────────────────────────────────────────────
    function checkAddDone() {
        if (mode !== 'add' || !ex || ex.done) return false;
        if (!isCanonical()) return false;
        ex.done = true;
        const nc = ex.carries.reduce((s, x) => s + x, 0);
        say('ok', `✓ Plus aucune colonne n'a 10 pièces : <b>${_b10Fmt(ex.a)} + ${_b10Fmt(ex.b)} = ${_b10Fmt(value())}</b>. ` +
                  (nc ? `Vous avez fait ${_b10Pl(nc, 'retenue', 'retenues')} : regardez-la${nc > 1 ? 's' : ''} dans l'opération posée.` : 'Pas de retenue ici.'));
        return true;
    }
    function checkSubDone() {
        if (mode !== 'sub' || !ex || ex.done) return false;
        if (ex.rem.some(r => r > 0)) return false;
        ex.done = true;
        const nb = ex.borrows.reduce((s, x) => s + x, 0);
        say('ok', `✓ Toutes les pièces sont enlevées : <b>${_b10Fmt(ex.a)} − ${_b10Fmt(ex.b)} = ${_b10Fmt(value())}</b>. ` +
                  (nb ? `Vous avez cassé ${_b10Pl(nb, 'pièce', 'pièces')} : ${nb > 1 ? 'ce sont les emprunts' : 'c\'est l\'emprunt'}.` : 'Pas besoin de casser de pièce ici.'));
        return true;
    }
    function lackHint() {
        if (mode !== 'sub' || !ex) return null;
        for (let k = 0; k < L(); k++) {
            if (ex.rem[k] > count(k)) {
                const o = B10_ORD[k], up = B10_ORD[k + 1];
                if (!up) return null;
                return `⚠️ Il faut enlever encore ${_b10Pl(ex.rem[k], o.piece, o.pieces)}, mais il n'y en a que ${count(k)}. ` +
                       `<b>Cassez ${up.pieceUn}</b> : elle donne 10 ${o.pieces} de plus.`;
            }
        }
        return null;
    }

    // ── Manipulations ─────────────────────────────────────────────────────
    function addPieces(k, n, o) {
        if (busy) return;
        if (!(mode === 'libre' || mode === 'represent')) return;
        if (count(k) + n > B10_MAX_PER_COL) {
            say('warn', `⚠️ La colonne des ${B10_ORD[k].noms} est pleine. Groupez d'abord !`);
            renderVerdict();
            return;
        }
        pushHistory();
        const ps = makePieces(n, o || 'a');
        ps.forEach(p => flash.add(p.id));
        cols[k] = cols[k].concat(ps);
        if (ex) ex.checked = false;
        verdict = null;
        if (n === 10 && k < 3) {
            const up = B10_ORD[k + 1];
            say('info', `${up.pieceUn.charAt(0).toUpperCase() + up.pieceUn.slice(1)} posée dans les ${B10_ORD[k].noms} arrive en <b>10 ${B10_ORD[k].pieces}</b> : 1 ${up.nom} = 10 ${B10_ORD[k].noms}.`);
        }
        renderAll();
        save();
    }

    function animate(ids, cls, then) {
        busy = true;
        renderHeader();
        ids.forEach(id => {
            const el = stage.querySelector(`.b10-p[data-id="${id}"]`);
            if (el) { el.classList.remove('new'); el.classList.add(cls); }
        });
        setTimeout(() => { busy = false; then(); }, cls === 'merge' ? 380 : 300);
    }

    function group(k, keepId) {
        if (busy) return;
        const lv = L();
        const o = B10_ORD[k];
        if (k >= lv - 1) {
            say('warn', `Il n'y a pas de colonne à gauche des ${o.noms} dans ce niveau.`);
            renderVerdict();
            return;
        }
        if (count(k) < 10) {
            say('warn', `Pour faire ${B10_ORD[k + 1].pieceUn}, il faut <b>10 ${o.pieces}</b> : il n'y en a que ${count(k)}.`);
            renderVerdict();
            return;
        }
        if (count(k + 1) + 1 > B10_MAX_PER_COL) return;
        pushHistory();
        // On prend la pièce choisie (si glissée) + les dernières pièces de la colonne
        const list = cols[k];
        const take = [];
        if (keepId != null) { const p = list.find(x => x.id === keepId); if (p) take.push(p); }
        for (let i = list.length - 1; i >= 0 && take.length < 10; i--) if (!take.includes(list[i])) take.push(list[i]);
        const ids = take.map(p => p.id);
        animate(ids, 'merge', () => {
            cols[k] = cols[k].filter(p => !ids.includes(p.id));
            const np = piece('g');
            flash.add(np.id);
            cols[k + 1].push(np);
            const nx = B10_ORD[k + 1];
            if (mode === 'add' && ex) {
                ex.carries[k]++;
                say('info', `🔗 10 ${o.pieces} se collent en <b>${nx.pieceUn}</b> : c'est la <b>retenue</b>. On écrit 1 au-dessus des ${nx.noms}.`);
            } else {
                say('info', `🔗 10 ${o.pieces} se collent en <b>${nx.pieceUn}</b> : 10 ${o.noms} = 1 ${nx.nom}. Le nombre ne change pas !`);
            }
            if (ex) ex.checked = false;
            checkAddDone();
            renderAll();
            save();
        });
    }

    function breakPiece(k, id) {
        if (busy) return;
        if (k === 0) {
            say('warn', 'Un cube, c\'est la plus petite pièce : on ne peut pas le casser.');
            renderVerdict();
            return;
        }
        if (count(k - 1) + 10 > B10_MAX_PER_COL) {
            say('warn', `⚠️ La colonne des ${B10_ORD[k - 1].noms} est trop pleine pour recevoir 10 pièces de plus.`);
            renderVerdict();
            return;
        }
        const p = cols[k].find(x => x.id === id) || cols[k][cols[k].length - 1];
        if (!p) return;
        pushHistory();
        animate([p.id], 'gone', () => {
            cols[k] = cols[k].filter(x => x.id !== p.id);
            const ps = makePieces(10, p.o === 'b' ? 'b' : 'a');
            ps.forEach(x => flash.add(x.id));
            cols[k - 1] = cols[k - 1].concat(ps);
            const o = B10_ORD[k], lo = B10_ORD[k - 1];
            if (mode === 'sub' && ex) {
                ex.borrows[k - 1]++;
                say('info', `🔨 ${o.pieceUn.charAt(0).toUpperCase() + o.pieceUn.slice(1)} cassée en <b>10 ${lo.pieces}</b> : c'est l'<b>emprunt</b>. Il y a maintenant ${count(k - 1)} ${lo.pieces}.`);
            } else {
                say('info', `🔨 ${o.pieceUn.charAt(0).toUpperCase() + o.pieceUn.slice(1)} cassée en <b>10 ${lo.pieces}</b> : 1 ${o.nom} = 10 ${lo.noms}. Le nombre ne change pas !`);
            }
            if (ex) ex.checked = false;
            renderAll();
            save();
        });
    }

    function removePiece(k, id) {
        if (busy) return;
        const o = B10_ORD[k];
        if (mode === 'add' || mode === 'guess') {
            say('warn', mode === 'add'
                ? '➕ Dans une addition, on n\'enlève pas de pièce : on les <b>groupe</b> par 10.'
                : '❓ On ne retire pas de pièce : le nombre changerait ! Vous pouvez grouper ou casser.');
            renderVerdict();
            return;
        }
        if (mode === 'sub' && ex) {
            if (ex.done) return;
            if (ex.rem[k] <= 0) {
                say('warn', `Il n'y a plus de ${o.pieces} à enlever.` + (lackHint() ? ' ' + lackHint() : ''));
                renderVerdict();
                return;
            }
        }
        const p = cols[k].find(x => x.id === id) || cols[k][cols[k].length - 1];
        if (!p) return;
        pushHistory();
        animate([p.id], 'gone', () => {
            cols[k] = cols[k].filter(x => x.id !== p.id);
            if (mode === 'sub' && ex) {
                ex.rem[k]--;
                if (!checkSubDone()) {
                    const h = lackHint();
                    if (h) say('warn', h);
                    else say('info', ex.rem[k] ? `Encore ${_b10Pl(ex.rem[k], o.piece, o.pieces)} à enlever.` : `✓ Toutes les ${o.noms} demandées sont enlevées.`);
                }
            } else {
                if (ex) ex.checked = false;
                verdict = null;
            }
            renderAll();
            save();
        });
    }

    function undo() {
        if (busy) return;
        const h = history.pop();
        if (!h) return;
        restoreSnap(h);
        say('info', '↩ Dernière manipulation annulée.');
        renderAll();
        save();
    }
    function resetAll() {
        if (busy) return;
        if (mode === 'libre') {
            pushHistory();
            cols = [[], [], [], []];
            verdict = null;
        } else if (start) {
            restoreSnap(start);
            history = [];
            verdict = null;
        }
        renderAll();
        save();
    }

    function checkRepresent() {
        if (!ex) return;
        const v = value();
        ex.checked = true;
        if (v === ex.target) {
            const nPieces = cols.reduce((s, c) => s + c.length, 0);
            if (isCanonical()) {
                say('ok', `✓ Bravo ! ${_b10Fmt(v)}, c'est bien ça, avec le moins de pièces possible (${nPieces}).`);
            } else {
                say('ok', `✓ C'est juste : ${_b10Fmt(v)} ! Mais une colonne a 10 pièces ou plus. <b>Groupez</b> pour utiliser moins de pièces.`);
            }
        } else {
            const diff = v - ex.target;
            say('ko', `✗ Vos pièces font <b>${_b10Fmt(v)}</b>. Il ${diff < 0 ? 'manque' : 'y a'} ${_b10Fmt(Math.abs(diff))} ${diff < 0 ? '' : 'de trop'}.`);
        }
        renderVerdict();
        save();
    }

    // ── Glisser-déposer ───────────────────────────────────────────────────
    let drag = null, ghost = null, overCol = null;

    function colAt(x, y) {
        const el = document.elementFromPoint(x, y);
        return el ? el.closest('.b10-col') : null;
    }
    function startGhost() {
        const d = drag;
        ghost = document.createElement('div');
        ghost.className = 'b10-ghost';
        const u = parseFloat(stage.style.getPropertyValue('--u')) || 14;
        ghost.style.fontSize = u + 'px';
        const el = document.createElement('div');
        el.className = 'b10-p b10-p' + d.k;
        el.innerHTML = _b10Svg(d.k, d.o === 'b');
        ghost.appendChild(el);
        document.body.appendChild(ghost);
        const r = el.getBoundingClientRect();
        d.dx = r.width / 2; d.dy = r.height / 2;
        if (d.el && d.from === 'stage') d.el.classList.add('dragging');
        d.started = true;
    }
    function setOver(col, bad) {
        if (overCol && overCol !== col) overCol.classList.remove('over', 'over-bad');
        overCol = col;
        if (col) { col.classList.toggle('over', !bad); col.classList.toggle('over-bad', !!bad); }
    }
    function dropOk(j) {
        const k = drag.k;
        if (drag.from === 'pal') return j === k || j === k - 1;
        return j === k || j === k - 1 || (j === k + 1 && count(k) >= 10 && k + 1 < L());
    }
    function onDragMove(e) {
        if (!drag || e.pointerId !== drag.pid) return;
        if (!drag.started) {
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
            startGhost();
        }
        e.preventDefault();
        ghost.style.left = (e.clientX - drag.dx) + 'px';
        ghost.style.top  = (e.clientY - drag.dy) + 'px';
        const col = colAt(e.clientX, e.clientY);
        setOver(col, col ? !dropOk(+col.dataset.k) : false);
    }
    function endDrag() {
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        if (ghost) { ghost.remove(); ghost = null; }
        setOver(null);
    }
    function onDragEnd(e) {
        if (!drag || (e && e.pointerId !== drag.pid)) return;
        const d = drag;
        drag = null;
        endDrag();
        if (d.el) d.el.classList.remove('dragging');
        if (e && e.type === 'pointercancel') return;
        if (!d.started) { tap(d); return; }
        const col = colAt(e.clientX, e.clientY);
        const k = d.k;
        if (d.from === 'pal') {
            if (!col) return;
            const j = +col.dataset.k;
            if (j === k) addPieces(k, 1, 'a');
            else if (j === k - 1) addPieces(j, 10, 'a');
            else { say('warn', `${B10_ORD[k].pieceUn.charAt(0).toUpperCase() + B10_ORD[k].pieceUn.slice(1)} se pose dans la colonne des <b>${B10_ORD[k].noms}</b>.`); renderVerdict(); }
            return;
        }
        // Pièce déjà sur le tapis
        if (!col) {
            // Glissée hors du tapis : on l'enlève
            const sr = stage.getBoundingClientRect();
            const inside = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
            if (!inside) removePiece(k, d.id);
            return;
        }
        const j = +col.dataset.k;
        if (j === k) return;
        if (j === k - 1) { breakPiece(k, d.id); return; }
        if (j === k + 1) { group(k, d.id); return; }
        const o = B10_ORD[k], t = B10_ORD[j];
        if (j < k) say('warn', `On casse une pièce <b>étape par étape</b> : ${o.pieceUn} devient d'abord 10 ${B10_ORD[k - 1].pieces}.`);
        else say('warn', `${o.pieces.charAt(0).toUpperCase() + o.pieces.slice(1)} ne vont pas dans les ${t.noms}. Groupez 10 ${o.pieces} pour faire ${B10_ORD[k + 1].pieceUn}.`);
        renderVerdict();
    }

    function tap(d) {
        if (d.from === 'pal') { addPieces(d.k, 1, 'a'); return; }
        if (tool === 'break') breakPiece(d.k, d.id);
        else if (tool === 'del') removePiece(d.k, d.id);
        else {
            say('info', '✋ Faites <b>glisser</b> la pièce : vers la colonne de droite pour la casser, vers la colonne de gauche pour grouper 10 pièces, hors du tapis pour l\'enlever.');
            renderVerdict();
        }
    }

    function startDrag(e, info) {
        e.preventDefault();
        drag = Object.assign({ x0: e.clientX, y0: e.clientY, pid: e.pointerId, started: false }, info);
        document.addEventListener('pointermove', onDragMove, { passive: false });
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
    }

    stage.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (busy || e.button > 0) return;
        const gb = e.target.closest('.b10-group-btn');
        if (gb) return;
        const pEl = e.target.closest('.b10-p');
        if (!pEl) return;
        const k = +pEl.dataset.k, id = +pEl.dataset.id;
        const p = cols[k].find(x => x.id === id);
        startDrag(e, { from: 'stage', k, id, o: p ? p.o : 'a', el: pEl });
    });
    stage.addEventListener('click', (e) => {
        e.stopPropagation();
        const gb = e.target.closest('.b10-group-btn');
        if (gb) group(+gb.dataset.group);
    });
    palette.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (busy || e.button > 0) return;
        const it = e.target.closest('.b10-pal-item');
        if (!it) return;
        startDrag(e, { from: 'pal', k: +it.dataset.add, o: 'a', el: null });
    });

    // Les zones de travail ne déplacent pas le widget
    [stageWrap, tools, palette, task, info, verdictEl, controls, legend].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-tab],[data-level],[data-tool]');
        if (!b || !container.contains(b) || stage.contains(b)) return;
        if (b.dataset.tab) {
            if (busy) return;
            mode = b.dataset.tab;
            // Outil adapté : « Enlever » pour la soustraction, pas d'« Enlever » en addition / Quel nombre ?
            if (mode === 'sub') tool = 'del';
            else if ((mode === 'add' || mode === 'guess') && tool === 'del') tool = 'move';
            newExercise();
            renderAll();
            save();
            return;
        }
        if (b.dataset.level) {
            if (busy) return;
            level = b.dataset.level;
            newExercise();
            renderAll();
            save();
            return;
        }
        if (b.dataset.tool) {
            tool = b.dataset.tool;
            verdict = null;
            if (tool === 'break') say('info', '🔨 Cliquez sur une barre, une plaque ou un gros cube : elle se casse en 10 pièces plus petites.');
            if (tool === 'del') say('info', '🗑 Cliquez sur une pièce pour l\'enlever.');
            renderAll();
            save();
            return;
        }
        switch (b.dataset.act) {
            case 'undo':   undo(); break;
            case 'reset':  resetAll(); break;
            case 'new':    if (!busy) { newExercise(); renderAll(); save(); } break;
            case 'check':  checkRepresent(); break;
            case 'reveal':
                if (ex) {
                    ex.revealed = !ex.revealed;
                    if (ex.revealed) {
                        const lv = L();
                        const d = _b10Digits(ex.n, lv);
                        say('ok', `Ce nombre est <b>${_b10Fmt(ex.n)}</b>.` + (isCanonical() ? '' :
                            ` Une colonne a 10 pièces ou plus : en groupant, on retrouve ${d.slice().reverse().map((x, i) => x + ' ' + B10_ORD[lv - 1 - i].abbr).join(' ')}.`));
                    } else verdict = null;
                    renderAll();
                    save();
                }
                break;
            case 'toggle-val': showVal = !showVal; renderAll(); save(); break;
            case 'toggle-op':  showOp = !showOp; renderAll(); save(); break;
        }
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur du tapis) ──────────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(480, startW + x - x0) + 'px';
            stage.style.height    = Math.max(150, startH + y - y0) + 'px';
            fit();
        };
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const move = startResize(e.clientX, e.clientY);
        document.onmousemove = (ev) => move(ev.clientX, ev.clientY);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const move = startResize(t0.clientX, t0.clientY);
        function onMove(ev) { const t = ev.touches[0]; move(t.clientX, t.clientY); }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); return; }
        fit();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🧮 Le matériel base dix', { onExpand: () => requestAnimationFrame(fit) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(fit);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = stage.style.height;
            container.classList.add('wf-fullboard');
            stage.style.height = Math.max(180, Math.round(window.innerHeight * 0.5)) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
        }
        requestAnimationFrame(fit);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        window.removeEventListener('resize', onWinResize);
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    newExercise();
    renderAll();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._b10GetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        mode, level, tool, showVal, showOp,
        cols: exportCols(),
        ex: ex ? JSON.parse(JSON.stringify(ex)) : null,
        start: start ? JSON.parse(JSON.stringify(start)) : null,
        changed: history.length > 0,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_b10IsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._b10SetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_b10IsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        if (B10_MODES[d.mode]) mode = d.mode;
        if (B10_LEVELS[d.level]) level = String(d.level);
        if (['move', 'break', 'del'].includes(d.tool)) tool = d.tool;
        if (typeof d.showVal === 'boolean') showVal = d.showVal;
        if (typeof d.showOp === 'boolean')  showOp  = d.showOp;
        importCols(d.cols);
        ex = d.ex && typeof d.ex === 'object' ? d.ex : null;
        if (ex && Array.isArray(ex.carries) === false && mode === 'add') ex.carries = [0, 0, 0, 0];
        if (ex && mode === 'sub') {
            if (!Array.isArray(ex.rem)) ex.rem = _b10Digits(ex.b || 0, 4);
            if (!Array.isArray(ex.borrows)) ex.borrows = [0, 0, 0, 0];
        }
        if ((mode !== 'libre') && !ex) newExercise();
        start = d.start && Array.isArray(d.start.cols) ? d.start : snap();
        history = [];
        // L'exercice avait été manipulé : on garde une étape pour pouvoir revenir au départ
        if (d.changed && mode !== 'libre') history = [JSON.parse(JSON.stringify(start))];
        verdict = null;
        if (mode === 'add' && ex && ex.done) { ex.done = false; checkAddDone(); }
        if (mode === 'sub' && ex && ex.done) { ex.done = false; checkSubDone(); }
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}

// ── Curseurs : flèche par défaut, main qui attrape sur la barre du haut (déplacement),
//    doigt qui pointe sur tout ce qui est cliquable. ──
(function () {
    if (typeof document === 'undefined' || document.getElementById('curseurs-base-dix')) return;
    const st = document.createElement('style');
    st.id = 'curseurs-base-dix';
    st.textContent = `
.widget[data-type="base-dix"] { cursor: default; }
.widget[data-type="base-dix"] .b10-header { cursor: grab; }
.widget[data-type="base-dix"] .b10-header:active { cursor: grabbing; }
.widget[data-type="base-dix"] .wf-fullboard .b10-header, .widget[data-type="base-dix"] .tnum-fullboard .b10-header, .widget[data-type="base-dix"] .s3d-fullboard .b10-header, .widget[data-type="base-dix"] .wf-fullboard .b10-header:active, .widget[data-type="base-dix"] .tnum-fullboard .b10-header:active, .widget[data-type="base-dix"] .s3d-fullboard .b10-header:active { cursor: default; }
.widget[data-type="base-dix"] .b10-header :is(button, select, .wf-btn, [role="button"]) { cursor: pointer; }
:where(.widget[data-type="base-dix"]) :where(button, select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="color"]) { cursor: pointer; }
.widget[data-type="base-dix"] :is(input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"]) { cursor: pointer; }
.widget[data-type="base-dix"] :is(button, select, input, textarea):disabled { cursor: default !important; }
.widget[data-type="base-dix"] .wf-mini-bar { cursor: grab !important; }
.widget[data-type="base-dix"] .wf-mini-bar:active { cursor: grabbing !important; }
.widget[data-type="base-dix"] .wf-mini-bar :is(button, .wf-btn) { cursor: pointer !important; }
`;
    (document.head || document.documentElement).appendChild(st);
})();
