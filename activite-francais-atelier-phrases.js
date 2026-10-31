// =========================================================================
// WIDGET L'ATELIER DE PHRASES — Le Bureau du Prof
// Des étiquettes-mots colorées selon leur nature, regroupées par fonction,
// que l'on manipule sur une ligne pour visualiser les manipulations syntaxiques :
//   ✋ Déplacer  : le complément circonstanciel se déplace, le COD non.
//   ✂️ Supprimer : le CC (ou l'adjectif épithète) se supprime, le sujet non.
//   🔁 Pronom    : un groupe se remplace par un pronom (le COD passe avant le verbe).
// Chaque manipulation est commentée (✓ phrase correcte / ✗ phrase incorrecte).
// L'enseignant peut aussi construire sa propre phrase (« Mes phrases »,
// gardées dans le navigateur).
//
// Même fenêtre que « La phrase du jour » : redimensionnement libre,
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

    if (document.getElementById('atp-style')) return;
    const s = document.createElement('style');
    s.id = 'atp-style';
    s.textContent = `
        .widget[data-type="atelier-phrases"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .atp-container {
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
            overflow: hidden;
        }
        .atp-container input { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .atp-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .atp-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .atp-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #fdecd8; color: #9a4a00; }

        /* Réduit / plein écran */
        .atp-container.wf-minimized > *:not(.atp-header) { display: none !important; }
        .atp-container.wf-minimized { gap: 0; }
        .atp-container.wf-fullboard {
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
            .atp-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .atp-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .atp-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s, box-shadow .15s;
        }
        .atp-btn:active { transform: scale(0.96); }
        .atp-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .atp-btn-blue  { background: #4a90e2; color: #fff; }
        .atp-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .atp-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .atp-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .atp-btn-green { background: #28a745; color: #fff; }
        .atp-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .atp-btn-red   { background: #fff0f0; color: #b91c1c; border: 1px solid #f3c4c4; }
        .atp-btn-red:hover:not(:disabled)   { background: #fde2e2; }
        .atp-btn.on    { background: #fdecd8; color: #9a4a00; border: 1px solid #f3c79a; }
        .atp-nav-label { font-size: 12px; font-weight: 700; color: #6b7280; min-width: 84px; text-align: center; }
        .atp-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .atp-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .atp-level-btn:hover { background: #e0e0e0; }
        .atp-level-btn.active { background: #fdecd8; color: #9a4a00; border-color: #f3c79a; }

        /* Barre des manipulations */
        .atp-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .atp-mode {
            padding: 6px 12px; border-radius: 9px; border: 2px solid transparent;
            font-size: 13px; font-weight: 800; cursor: pointer;
            background: var(--ml); color: var(--mc);
            transition: transform .1s, border-color .15s, box-shadow .15s;
        }
        .atp-mode:hover { transform: translateY(-1px); }
        .atp-mode.active { border-color: var(--mc); box-shadow: 0 2px 6px rgba(0,0,0,.15); transform: scale(1.05); }
        .atp-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .atp-tool {
            padding: 4px 9px; border-radius: 8px; border: 2px solid transparent;
            font-size: 11px; font-weight: 800; cursor: pointer;
            background: var(--tl, #f0f0f0); color: var(--tc, #333);
        }
        .atp-tool.active { border-color: var(--tc, #333); box-shadow: 0 2px 6px rgba(0,0,0,.15); }

        /* Phrase de départ / phrase obtenue */
        .atp-read { font-size: 13px; color: #6b7280; line-height: 1.35; }
        .atp-read b { color: #374151; }
        .atp-read .atp-now { color: #111827; font-weight: 700; }

        /* Scène : la ligne d'étiquettes */
        .atp-stage-wrap { position: relative; flex-shrink: 0; }
        .atp-stage {
            --atp-fs: 32px;
            display: flex; flex-wrap: wrap; align-content: center; justify-content: center;
            align-items: flex-start; gap: .7em .45em;
            padding: 1.6em .8em .9em;
            background: repeating-linear-gradient(180deg, #f8f9fa 0, #f8f9fa calc(100% - 2px), #eef0f3 calc(100% - 2px));
            background: #f8f9fa;
            border: 1px solid #e5e7eb; border-radius: 10px;
            box-sizing: border-box; overflow: hidden;
            font-size: var(--atp-fs);
        }
        .atp-status {
            position: absolute; top: 6px; right: 8px; z-index: 2;
            font-size: 12px; font-weight: 800; padding: 2px 9px; border-radius: 20px;
            pointer-events: none;
        }
        .atp-status.ok { background: #dcfce7; color: #166534; border: 1px solid #a7e3bb; }
        .atp-status.ko { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .atp-empty { font-size: 16px; color: #9ca3af; font-weight: 600; text-align: center; align-self: center; }

        .atp-g { display: flex; flex-direction: column; align-items: center; gap: .14em; touch-action: none; position: relative; }
        .atp-g-box {
            display: flex; align-items: center; gap: .2em;
            padding: .12em .16em; border: .08em solid #d1d5db; border-radius: .35em;
            background: #fff; box-shadow: 0 .05em .16em rgba(0,0,0,.12);
            transition: transform .12s, box-shadow .12s;
        }
        .atp-show-fn .atp-g-box { border-color: var(--fc); }
        .atp-show-fn .atp-g[data-fn="ATT"] .atp-g-box { border-style: dashed; }
        .atp-show-fn .atp-g[data-fn="V"] .atp-g-box { border-width: .11em; }
        .atp-g.clitic .atp-g-box { background: #fff8ec; }
        .atp-w {
            padding: .05em .28em; border-radius: .22em;
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800;
            color: #1f2937; background: #f1f5f9; line-height: 1.25; white-space: nowrap;
            position: relative;
        }
        .atp-show-nat .atp-w { background: var(--nl); color: var(--nc); }
        .atp-w.glue { margin-right: -.2em; padding-right: .06em; }
        .atp-w.pron { box-shadow: inset 0 0 0 .06em #d97706; }
        .atp-fnlbl {
            font-size: .38em; font-weight: 800; color: #fff; background: var(--fc);
            padding: .06em .55em; border-radius: 1em; line-height: 1.35; white-space: nowrap;
            visibility: hidden;
        }
        .atp-show-fn .atp-fnlbl { visibility: visible; }
        .atp-punct { font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; color: #1f2937; padding-top: .2em; }
        .atp-comma { font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; color: #1f2937; margin-left: -.15em; }

        /* Modes */
        .atp-mode-move .atp-g:not(.clitic) .atp-g-box { cursor: grab; }
        .atp-mode-move .atp-g:not(.clitic) .atp-g-box:hover { transform: translateY(-.05em); box-shadow: 0 .12em .3em rgba(0,0,0,.18); }
        .atp-mode-del .atp-g-box, .atp-mode-pron .atp-g-box { cursor: pointer; }
        .atp-mode-del .atp-g-box:hover { box-shadow: 0 0 0 .08em #ef4444; }
        .atp-mode-del .atp-w.del-word:hover { outline: .08em dashed #ef4444; outline-offset: .04em; }
        .atp-mode-pron .atp-g-box:hover { box-shadow: 0 0 0 .08em #d97706; }
        .atp-dragging { opacity: .25; }
        .atp-caret { width: .16em; min-height: 1.5em; align-self: stretch; background: #4a90e2; border-radius: .1em; }
        .atp-ghost {
            position: fixed; z-index: 100000; pointer-events: none;
            transform: rotate(-2deg) scale(1.06); opacity: .93;
            filter: drop-shadow(0 6px 10px rgba(0,0,0,.25));
        }
        .atp-flash .atp-g-box { animation: atpFlash .6s ease-out; }
        @keyframes atpFlash { 0% { transform: scale(1); } 40% { transform: scale(1.1); } 100% { transform: scale(1); } }

        /* Légende */
        .atp-legend { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: #4b5563; align-items: center; }
        .atp-legend span { display: inline-flex; align-items: center; gap: 4px; }
        .atp-legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

        /* Commentaire de la manipulation */
        .atp-verdict {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
            animation: atpFade .3s ease-out;
        }
        .atp-verdict.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .atp-verdict.ko   { background: #fff1f1; border-color: #f5c2c2; color: #7f1d1d; }
        .atp-verdict.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        @keyframes atpFade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Groupes supprimés */
        .atp-trash { display: none; gap: 6px; flex-wrap: wrap; align-items: center; font-size: 12px; color: #6b7280; }
        .atp-trash.show { display: flex; }
        .atp-trash-item {
            padding: 3px 9px; border-radius: 14px; border: 1px dashed #9ca3af; background: #fff;
            cursor: pointer; font-weight: 700; color: #374151; font-size: 12px;
        }
        .atp-trash-item:hover { background: #ecfdf5; border-color: #16a34a; }

        /* Création d'une phrase perso */
        .atp-custom-row { display: none; gap: 6px; align-items: center; flex-wrap: wrap; }
        .atp-custom-row.show { display: flex; }
        .atp-custom-input { flex: 1; min-width: 200px; padding: 6px 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; outline: none; }
        .atp-custom-input:focus { border-color: #4a90e2; }
        .atp-hint {
            display: none; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 12px;
            color: #6b4b00; background: #fffbea; border: 1px solid #f3e1a0; border-radius: 8px; padding: 6px 10px;
        }
        .atp-hint.show { display: flex; }
        .atp-dw { position: relative; cursor: pointer; }
        .atp-dw .atp-g-box { border-bottom-width: .14em; }
        .atp-split-mark { width: .12em; align-self: stretch; background: #111827; border-radius: .1em; margin: 0 .1em; }

        /* Aide */
        .atp-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .atp-help-btn:hover { background: #e0e0e0; color: #333; }
        .atp-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .atp-help-popup.show { display: block; }
        .atp-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .atp-help-popup p { margin: 0 0 6px; }
        .atp-help-popup p:last-child { margin-bottom: 0; }

        .atp-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .atp-container:hover .atp-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Natures et fonctions ──────────────────────────────────────────────────
const ATP_NATURES = [
    { k: 'D',  nom: 'Déterminant',    c: '#2563eb', l: '#dbeafe' },
    { k: 'N',  nom: 'Nom',            c: '#dc2626', l: '#fee2e2' },
    { k: 'A',  nom: 'Adjectif',       c: '#16a34a', l: '#dcfce7' },
    { k: 'V',  nom: 'Verbe',          c: '#9333ea', l: '#f3e8ff' },
    { k: 'PR', nom: 'Pronom',         c: '#d97706', l: '#fef3c7' },
    { k: 'I',  nom: 'Mot invariable', c: '#475569', l: '#e2e8f0' }
];
const ATP_NAT = {};
ATP_NATURES.forEach(n => { ATP_NAT[n.k] = n; });

const ATP_FONCTIONS = [
    { k: 'S',   nom: 'Sujet',          lbl: 'Sujet',    c: '#dc2626', long: 'le sujet' },
    { k: 'V',   nom: 'Verbe',          lbl: 'Verbe',    c: '#b91c1c', long: 'le verbe' },
    { k: 'COD', nom: 'COD',            lbl: 'COD',      c: '#2563eb', long: 'le COD' },
    { k: 'COI', nom: 'COI',            lbl: 'COI',      c: '#16a34a', long: 'le COI' },
    { k: 'CC',  nom: 'CC',             lbl: 'CC',       c: '#111827', long: 'le complément circonstanciel' },
    { k: 'ATT', nom: 'Attribut',       lbl: 'Attribut', c: '#dc2626', long: 'l\'attribut du sujet' }
];
const ATP_FN = {};
ATP_FONCTIONS.forEach(f => { ATP_FN[f.k] = f; });
const ATP_FN_NONE = { k: null, lbl: '?', c: '#9ca3af', long: 'ce groupe' };

const ATP_LEVELS = {
    '1':     { label: 'Niveau 1',    titre: 'Niveau 1 : sujet, verbe, COD et CC' },
    '2':     { label: 'Niveau 2',    titre: 'Niveau 2 : avec des COI' },
    '3':     { label: 'Niveau 3',    titre: 'Niveau 3 : attribut du sujet, groupes plus longs' },
    'perso': { label: 'Mes phrases', titre: 'Mes phrases' }
};
const ATP_STORE_KEY = 'atp-mes-phrases';

// Ordre des pronoms placés avant le verbe : la le / lui leur / y / en
const ATP_CLITIC_RANK = { me: 1, te: 1, se: 1, nous: 1, vous: 1, le: 2, la: 2, les: 2, lui: 3, leur: 3, y: 4, en: 5 };

// ── Banque de phrases ─────────────────────────────────────────────────────
// Écriture : FONCTION[ mot:NATURE … ]>pronom
//   fonctions : S, V, COD, COI, CC, ATT ; « COD+ » = COD qu'on peut supprimer
//   natures   : D, N, A, V, PR, I (mot invariable), NP (nom propre)
//   >pronom   : pronom qui remplace le groupe (facultatif)
// Le signe de ponctuation final est écrit seul à la fin.
const ATP_BANQUE = {
    '1': [
        "S[Le:D petit:A chat:N]>il V[mange:V] COD+[la:D souris:N grise:A]>la CC[dans:I la:D cuisine:N]>y .",
        "S[Les:D enfants:N]>ils V[construisent:V] COD[la:D cabane:N]>la CC[dans:I le:D jardin:N]>y .",
        "S[Mon:D frère:N]>il V[lave:V] COD[la:D voiture:N]>la CC[le:D samedi:N] .",
        "CC[Ce:D matin:N] S[Léa:NP]>elle V[promène:V] COD[son:D chien:N]>le .",
        "S[Le:D boulanger:N]>il V[prépare:V] COD[le:D pain:N]>le CC[très:I tôt:I] .",
        "S[Les:D élèves:N]>ils V[écoutent:V] COD[la:D maîtresse:N]>la CC[attentivement:I] .",
        "S[Le:D jardinier:N]>il V[arrose:V] COD[les:D fleurs:N]>les CC[chaque:D soir:N] .",
        "S[Mes:D cousins:N]>ils V[jouent:V] CC[au:I parc:N]>y CC[après:I l':D école:N] .",
        "S[Ma:D grand-mère:N]>elle V[tricote:V] COD+[une:D écharpe:N bleue:A] CC[près:I de:I la:D cheminée:N]>y .",
        "S[Le:D pêcheur:N]>il V[attrape:V] COD[le:D gros:A poisson:N]>le CC[avec:I sa:D canne:N] ."
    ],
    '2': [
        "S[Le:D chien:N]>il V[obéit:V] COI[à:I son:D maître:N]>lui .",
        "S[Julie:NP]>elle V[parle:V] COI[à:I ses:D amies:N]>leur CC[pendant:I la:D récréation:N] .",
        "S[Le:D facteur:N]>il V[apporte:V] COD[le:D colis:N]>le COI[à:I ma:D voisine:N]>lui CC[ce:D matin:N] .",
        "CC[Chaque:D soir:N] S[papa:N]>il V[raconte:V] COD+[une:D histoire:N] COI[à:I mon:D petit:A frère:N]>lui .",
        "S[Les:D touristes:N]>ils V[visitent:V] COD[le:D vieux:A château:N]>le CC[avec:I un:D guide:N] .",
        "S[La:D maîtresse:N]>elle V[distribue:V] COD[les:D cahiers:N]>les COI[aux:I élèves:N]>leur .",
        "CC[En:I hiver:N] S[les:D marmottes:N]>elles V[dorment:V] CC[dans:I leur:D terrier:N]>y .",
        "S[Tom:NP]>il V[téléphone:V] COI[à:I sa:D grand-mère:N]>lui CC[tous:D les:D dimanches:N] .",
        "S[Les:D oiseaux:N migrateurs:A]>ils V[quittent:V] COD[notre:D pays:N]>le CC[à:I l':D automne:N] .",
        "S[Le:D vent:N]>il V[secoue:V] COD[les:D branches:N]>les CC[violemment:I] ."
    ],
    '3': [
        "S[Le:D ciel:N]>il V[est:V] ATT[très:I sombre:A]>le CC[ce:D soir:N] .",
        "S[Les:D élèves:N de:I CM2:NP]>ils V[semblent:V] ATT[fatigués:A]>le CC[après:I la:D sortie:N] .",
        "S[La:D petite:A fille:N aux:I cheveux:N roux:A]>elle V[cueille:V] COD[les:D fraises:N mûres:A]>les CC[dans:I le:D potager:N]>y .",
        "CC[Au:I printemps:N] S[les:D hirondelles:N]>elles V[reviennent:V] CC[sous:I notre:D toit:N] .",
        "S[Le:D vieux:A marin:N]>il V[raconte:V] COD[ses:D voyages:N lointains:A]>les COI[à:I ses:D petits-enfants:N]>leur .",
        "S[Mon:D oncle:N]>il V[devient:V] ATT[un:D excellent:A cuisinier:N]>le .",
        "S[Le:D chat:N de:I la:D voisine:N]>il V[observe:V] CC[patiemment:I] COD[les:D oiseaux:N du:I jardin:N]>les .",
        "S[Les:D pompiers:N courageux:A]>ils V[éteignent:V] COD[l':D incendie:N]>le CC[en:I quelques:D minutes:N] .",
        "CC[Pendant:I les:D vacances:N] S[nous:PR] V[visiterons:V] COD[les:D grottes:N préhistoriques:A]>les .",
        "S[Cette:D histoire:N étonnante:A]>elle V[plaît:V] COI[à:I tous:D les:D enfants:N]>leur ."
    ]
};

// ── Outils ────────────────────────────────────────────────────────────────
function _atpLowerFirst(t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
function _atpUpperFirst(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
function _atpEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _atpParse(code) {
    const groups = [];
    let cur = null, punct = '.';
    code.trim().split(/\s+/).forEach(raw => {
        let s = raw, m;
        if ((m = s.match(/^(S|V|COD|COI|CC|ATT)(\+?)\[/))) {
            cur = { id: groups.length, fn: m[1], opt: !!m[2], words: [], pr: null };
            groups.push(cur);
            s = s.slice(m[0].length);
        }
        let close = false, pr = null;
        if ((m = s.match(/\](?:>(.+))?$/))) {
            close = true;
            pr = m[1] || null;
            s = s.slice(0, m.index);
        }
        const c = s.lastIndexOf(':');
        if (c > 0 && cur) {
            let t = s.slice(0, c), nat = s.slice(c + 1), np = false;
            if (nat === 'NP') { nat = 'N'; np = true; }
            cur.words.push({ t: np ? t : _atpLowerFirst(t), nat, np });
        } else if (s && !cur) {
            punct = s;
        }
        if (close && cur) { if (pr) cur.pr = pr; cur = null; }
    });
    return { groups, punct };
}

let _atpParsed = null;
function _atpBanque(level) {
    if (!_atpParsed) {
        _atpParsed = {};
        Object.keys(ATP_BANQUE).forEach(lv => { _atpParsed[lv] = ATP_BANQUE[lv].map(_atpParse); });
    }
    return _atpParsed[level] || [];
}

function _atpLoadMes() {
    try {
        const a = JSON.parse(localStorage.getItem(ATP_STORE_KEY) || '[]');
        return Array.isArray(a) ? a.filter(p => p && Array.isArray(p.groups) && p.groups.length) : [];
    } catch (e) { return []; }
}
function _atpSaveMes(list) {
    try { localStorage.setItem(ATP_STORE_KEY, JSON.stringify(list)); } catch (e) {}
}

// Découpe une phrase tapée par l'enseignant
function _atpTokenize(text) {
    const t = (text || '')
        .replace(/[’`]/g, "'")
        .replace(/([.,!?;:…()«»"])/g, ' $1 ')
        .replace(/'/g, "' ")
        .trim();
    if (!t) return [];
    return t.split(/\s+/).map(w => {
        const p = /^[.,!?;:…()«»"]+$/.test(w);
        return { t: w, p };
    });
}

// Devine le pronom d'un groupe d'une phrase perso (d'après le déterminant)
const ATP_DET_M  = ['le', 'un', 'mon', 'ton', 'son', 'ce', 'cet', 'notre', 'votre', 'leur', "l'"];
const ATP_DET_F  = ['la', 'une', 'ma', 'ta', 'sa', 'cette'];
const ATP_DET_PL = ['les', 'des', 'mes', 'tes', 'ses', 'ces', 'nos', 'vos', 'leurs', 'quelques', 'plusieurs', 'tous', 'toutes'];
const ATP_DET_INDEF = ['un', 'une', 'des', 'du', 'de', "d'", 'quelques', 'plusieurs'];
function _atpGuessPronoun(g) {
    const ws = g.words;
    if (!ws.length) return null;
    const lw = ws.map(w => (w.t || '').toLowerCase());
    const det = lw.find((t, i) => ws[i].nat === 'D');
    const pl = det ? ATP_DET_PL.includes(det) : false;
    const f  = det ? ATP_DET_F.includes(det) : false;
    if (g.fn === 'S') {
        if (ws.length === 1 && ws[0].nat === 'PR') return null;
        if (!det) return null;
        return pl ? 'ils' : (f ? 'elle' : 'il');
    }
    if (g.fn === 'COD') {
        if (!det || ATP_DET_INDEF.includes(det)) return null;
        return pl ? 'les' : (f ? 'la' : 'le');
    }
    if (g.fn === 'COI') {
        if (lw[0] === 'aux') return 'leur';
        if (lw[0] === 'au') return 'lui';
        if (lw[0] === 'à') return pl ? 'leur' : 'lui';
        return null;
    }
    if (g.fn === 'ATT') return 'le';
    return null;
}

function _atpIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createAtelierPhrasesWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'atelier-phrases';
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
    container.className = 'atp-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'atp-header';
    header.innerHTML = `
        <span class="atp-title">🧩 L'atelier de phrases</span>
        <span class="atp-badge">Niveau 1</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.atp-badge');
    container.appendChild(header);

    // ── Choix de la phrase ────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'atp-row';
    controls.innerHTML = `
        <button class="atp-btn atp-btn-grey" data-act="prev" title="Phrase précédente">◀</button>
        <span class="atp-nav-label"></span>
        <button class="atp-btn atp-btn-grey" data-act="next" title="Phrase suivante">▶</button>
        <button class="atp-btn atp-btn-grey" data-act="random">🎲 Au hasard</button>
        <button class="atp-btn atp-btn-grey" data-act="custom" title="Construire votre propre phrase">✏️ Ma phrase</button>
        <button class="atp-btn atp-btn-red" data-act="delete-perso" title="Supprimer cette phrase de « Mes phrases »" style="display:none">🗑 Supprimer</button>
        <div class="atp-level-btns">
            ${Object.keys(ATP_LEVELS).map(k =>
                `<button class="atp-level-btn" data-level="${k}" title="${ATP_LEVELS[k].titre}">${k === 'perso' ? '⭐ ' : ''}${ATP_LEVELS[k].label}</button>`
            ).join('')}
        </div>
    `;
    const navLabel = controls.querySelector('.atp-nav-label');
    const prevBtn  = controls.querySelector('[data-act="prev"]');
    const nextBtn  = controls.querySelector('[data-act="next"]');
    const delPersoBtn = controls.querySelector('[data-act="delete-perso"]');
    container.appendChild(controls);

    // ── Saisie d'une phrase perso ─────────────────────────────────────────
    const customRow = document.createElement('div');
    customRow.className = 'atp-custom-row';
    customRow.innerHTML = `
        <input class="atp-custom-input" type="text" maxlength="200" placeholder="Écrivez votre phrase, par exemple : Le petit chien ronge son os dans le jardin." spellcheck="true" autocomplete="off">
        <button class="atp-btn atp-btn-blue" data-act="custom-ok">Suivant ▶</button>
        <button class="atp-btn atp-btn-grey" data-act="custom-cancel">Annuler</button>
    `;
    const customInput = customRow.querySelector('.atp-custom-input');
    container.appendChild(customRow);

    const hint = document.createElement('div');
    hint.className = 'atp-hint';
    hint.innerHTML = `
        <span>✏️ <b>1.</b> Choisissez une nature puis cliquez sur les mots. <b>2.</b> Choisissez une fonction et cliquez sur les mots de chaque groupe (les mots voisins de même fonction forment un groupe ; <b>│ Couper</b> sépare deux groupes qui se suivent). <b>3.</b> Enregistrez.</span>
        <button class="atp-btn atp-btn-green" data-act="draft-save">💾 Enregistrer l'atelier</button>
        <button class="atp-btn atp-btn-grey" data-act="draft-cancel">Annuler</button>
    `;
    container.appendChild(hint);

    // ── Barre des manipulations ───────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'atp-tools';
    tools.innerHTML = `
        <button class="atp-mode" data-mode="move" style="--mc:#1d4ed8;--ml:#dbeafe" title="Faire glisser une étiquette pour la déplacer">✋ Déplacer</button>
        <button class="atp-mode" data-mode="del"  style="--mc:#b91c1c;--ml:#fee2e2" title="Cliquer sur un groupe (ou sur un adjectif) pour le supprimer">✂️ Supprimer</button>
        <button class="atp-mode" data-mode="pron" style="--mc:#b45309;--ml:#fef3c7" title="Cliquer sur un groupe pour le remplacer par un pronom">🔁 Pronom</button>
        <span class="atp-sep"></span>
        <button class="atp-btn atp-btn-grey" data-act="undo" title="Annuler la dernière manipulation">↩ Annuler</button>
        <button class="atp-btn atp-btn-grey" data-act="reset" title="Revenir à la phrase de départ">🔄 Phrase de départ</button>
        <span class="atp-sep"></span>
        <button class="atp-btn atp-btn-grey" data-act="toggle-nat" title="Afficher ou masquer les couleurs des natures">🎨 Natures</button>
        <button class="atp-btn atp-btn-grey" data-act="toggle-fn" title="Afficher ou masquer les fonctions">🏷️ Fonctions</button>
    `;
    const undoBtn  = tools.querySelector('[data-act="undo"]');
    const resetBtn = tools.querySelector('[data-act="reset"]');
    const natBtn   = tools.querySelector('[data-act="toggle-nat"]');
    const fnBtn    = tools.querySelector('[data-act="toggle-fn"]');
    container.appendChild(tools);

    // Barre de marquage (phrase perso en cours)
    const markTools = document.createElement('div');
    markTools.className = 'atp-tools';
    markTools.style.display = 'none';
    markTools.innerHTML =
        ATP_NATURES.map(n => `<button class="atp-tool" data-tool="nat:${n.k}" style="--tc:${n.c};--tl:${n.l}">${n.nom}</button>`).join('') +
        `<span class="atp-sep"></span>` +
        ATP_FONCTIONS.map(f => `<button class="atp-tool" data-tool="fn:${f.k}" style="--tc:${f.c};--tl:#fff;border-color:#e3e3e3">${f.nom}</button>`).join('') +
        `<span class="atp-sep"></span>
         <button class="atp-tool" data-tool="split" style="--tc:#111827;--tl:#fff" title="Cliquer sur le premier mot d'un nouveau groupe">│ Couper</button>
         <button class="atp-tool" data-tool="gomme" style="--tc:#6b7280;--tl:#fff" title="Effacer les marques d'un mot">🧽 Gomme</button>`;
    container.appendChild(markTools);

    // ── Phrase de départ ──────────────────────────────────────────────────
    const readTop = document.createElement('div');
    readTop.className = 'atp-read';
    container.appendChild(readTop);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stageWrap = document.createElement('div');
    stageWrap.className = 'atp-stage-wrap';
    const stage = document.createElement('div');
    stage.className = 'atp-stage';
    stage.style.height = Math.round(initH * 0.42) + 'px';
    const statusEl = document.createElement('div');
    statusEl.className = 'atp-status';
    stageWrap.appendChild(stage);
    stageWrap.appendChild(statusEl);
    container.appendChild(stageWrap);

    const legend = document.createElement('div');
    legend.className = 'atp-legend';
    legend.innerHTML = ATP_NATURES.map(n => `<span><i style="background:${n.l};box-shadow:inset 0 0 0 2px ${n.c}"></i>${n.nom}</span>`).join('');
    container.appendChild(legend);

    const verdictEl = document.createElement('div');
    verdictEl.className = 'atp-verdict';
    container.appendChild(verdictEl);

    const trash = document.createElement('div');
    trash.className = 'atp-trash';
    container.appendChild(trash);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'atp-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'atp-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 L'atelier de phrases</h4>
        <p>Chaque mot est une étiquette colorée selon sa <b>nature</b>. Les mots sont réunis en <b>groupes</b>
        encadrés selon leur <b>fonction</b> (sujet, verbe, COD, COI, CC, attribut).</p>
        <p><b>✋ Déplacer</b> : faites glisser un groupe. Le <b>complément circonstanciel</b> se déplace sans
        problème ; le sujet, le verbe et le COD, non : la phrase devient incorrecte ou change de sens.</p>
        <p><b>✂️ Supprimer</b> : cliquez sur un groupe. Le CC est facultatif, le sujet et le verbe sont obligatoires.
        Un clic sur un <b>adjectif épithète</b> ne supprime que lui. Les groupes supprimés restent en bas : un clic les remet.</p>
        <p><b>🔁 Pronom</b> : cliquez sur un groupe pour le remplacer par un pronom. Le COD, le COI, l'attribut
        et le « y » de lieu se placent <b>avant le verbe</b>. Un nouveau clic remet le groupe.</p>
        <p>Chaque manipulation est commentée, avec ✓ ou ✗. <b>🎨 Natures</b> et <b>🏷️ Fonctions</b> masquent
        les couleurs ou les fonctions pour les faire trouver aux élèves.</p>
        <p><b>✏️ Ma phrase</b> : écrivez votre phrase, indiquez les natures et les fonctions, puis enregistrez-la
        dans <b>⭐ Mes phrases</b> (dans ce navigateur). Les pronoms sont devinés d'après les déterminants.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'atp-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let level = '1';
    let idx = 0;
    let cur = null;            // { groups, punct }
    let order = [];            // ordre des groupes (ids)
    let removed = new Set();   // groupes supprimés
    let removedW = new Set();  // mots supprimés « gid:wi »
    let pron = new Set();      // groupes remplacés par un pronom
    let history = [];          // pour « Annuler »
    let mode = 'move';
    let showNat = true, showFn = true;
    let verdict = null;        // { cls, html }
    let flashId = null;
    let mesPhrases = _atpLoadMes();
    // Phrase perso en cours de construction
    let draft = null;          // { tokens, nat:{}, fn:{}, split:{} }
    let tool = 'nat:N';

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function getList(lv) { return lv === 'perso' ? mesPhrases : _atpBanque(lv); }
    function G(id) { return cur.groups[id]; }
    function fnOf(g) { return (g && g.fn && ATP_FN[g.fn]) || ATP_FN_NONE; }

    function groupText(g, opts) {
        opts = opts || {};
        const ws = g.words
            .map((w, wi) => ({ w, wi }))
            .filter(x => !opts.rw || !removedW.has(g.id + ':' + x.wi))
            .map(x => x.w.t);
        return ws.join(' ').replace(/' /g, "'");
    }

    // ── Chargement ────────────────────────────────────────────────────────
    function resetState() {
        order = cur ? cur.groups.map(g => g.id) : [];
        removed = new Set();
        removedW = new Set();
        pron = new Set();
        history = [];
        verdict = null;
    }
    function loadPhrase(lv, i) {
        level = ATP_LEVELS[lv] ? String(lv) : '1';
        draft = null;
        const list = getList(level);
        if (!list.length) { cur = null; idx = 0; }
        else {
            const n = list.length;
            idx = ((i % n) + n) % n;
            cur = list[idx];
        }
        resetState();
        renderAll();
    }

    function snapshot() {
        return { order: order.slice(), removed: [...removed], removedW: [...removedW], pron: [...pron] };
    }
    function pushHistory() {
        history.push(snapshot());
        if (history.length > 60) history.shift();
    }

    // ── Analyse de la phrase obtenue ──────────────────────────────────────
    function isClitic(id) { return pron.has(id) && G(id).fn !== 'S'; }
    function nonCCSeq(ord) {
        return ord.filter(id => !removed.has(id) && !isClitic(id) && G(id).fn !== 'CC');
    }
    function orderOk() {
        const a = nonCCSeq(order), b = nonCCSeq(cur.groups.map(g => g.id));
        return a.length === b.length && a.every((x, i) => x === b[i]);
    }
    function isMandatory(g) {
        if (!g.fn) return false;
        if (g.fn === 'CC') return false;
        if (g.fn === 'COD') return !g.opt;
        return true;
    }
    function phraseOk() {
        if (!orderOk()) return false;
        for (const id of removed) if (isMandatory(G(id))) return false;
        return true;
    }

    // Construit la suite d'étiquettes à afficher
    function buildItems() {
        const vis = order.filter(id => !removed.has(id));
        const clitics = vis.filter(isClitic)
            .sort((a, b) => (ATP_CLITIC_RANK[G(a).pr] || 9) - (ATP_CLITIC_RANK[G(b).pr] || 9));
        const hasV = vis.some(id => G(id).fn === 'V' && !isClitic(id));
        const items = [];
        vis.forEach(id => {
            const g = G(id);
            if (isClitic(id)) {
                if (!hasV) items.push({ gid: id, clitic: true, words: [{ t: g.pr, nat: 'PR', pron: true }] });
                return;
            }
            if (g.fn === 'V' && hasV) {
                clitics.forEach(cid => items.push({ gid: cid, clitic: true, words: [{ t: G(cid).pr, nat: 'PR', pron: true }] }));
            }
            const words = pron.has(id)
                ? [{ t: g.pr, nat: 'PR', pron: true }]
                : g.words.map((w, wi) => Object.assign({ wi }, w)).filter(w => !removedW.has(id + ':' + w.wi));
            if (words.length) items.push({ gid: id, words });
        });
        // Majuscule, élision des pronoms (le, la → l'), virgule après un CC en tête
        const flat = [];
        items.forEach(it => it.words.forEach(w => flat.push(w)));
        flat.forEach(w => { w.show = w.np ? w.t : _atpLowerFirst(w.t); w.glue = /'$/.test(w.t); });
        flat.forEach((w, k) => {
            const nx = flat[k + 1];
            if (w.pron && ['le', 'la', 'me', 'te', 'se'].includes(w.t) && nx && /^[aeiouyhâàäéèêëîïôöûüœ]/i.test(nx.show)) {
                w.show = w.t.charAt(0) + "'";
                w.glue = true;
            }
        });
        if (flat.length) flat[0].show = _atpUpperFirst(flat[0].show);
        if (items.length > 1 && !items[0].clitic && G(items[0].gid).fn === 'CC') items[0].comma = true;
        return items;
    }
    function itemsText(items) {
        let s = '';
        items.forEach(it => {
            it.words.forEach(w => {
                if (s && !/'$/.test(s)) s += ' ';
                s += w.show;
            });
            if (it.comma) s += ',';
        });
        return s + (cur.punct === '.' || cur.punct === '!' || cur.punct === '?' ? (cur.punct === '.' ? '.' : ' ' + cur.punct) : cur.punct);
    }
    function originalText() {
        const saved = { order, removed, removedW, pron };
        order = cur.groups.map(g => g.id); removed = new Set(); removedW = new Set(); pron = new Set();
        const t = itemsText(buildItems());
        order = saved.order; removed = saved.removed; removedW = saved.removedW; pron = saved.pron;
        return t;
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function wordSpan(w, gid) {
        const n = ATP_NAT[w.nat];
        const sp = document.createElement('span');
        sp.className = 'atp-w' + (w.glue ? ' glue' : '') + (w.pron ? ' pron' : '');
        sp.textContent = w.show != null ? w.show : w.t;
        if (n) { sp.style.setProperty('--nc', n.c); sp.style.setProperty('--nl', n.l); sp.title = n.nom; }
        if (w.wi !== undefined) {
            sp.dataset.wi = w.wi;
            if (canDelWord(gid, w.wi)) sp.classList.add('del-word');
        }
        return sp;
    }
    function canDelWord(gid, wi) {
        const g = G(gid);
        const w = g.words[wi];
        return !!(w && w.nat === 'A' && g.fn !== 'ATT' && g.words.some(x => x.nat === 'N'));
    }

    function renderStage() {
        stage.innerHTML = '';
        stage.className = 'atp-stage atp-mode-' + mode + (showNat ? ' atp-show-nat' : '') + (showFn ? ' atp-show-fn' : '');
        if (draft) { renderDraft(); return; }
        if (!cur) {
            const e = document.createElement('div');
            e.className = 'atp-empty';
            e.textContent = level === 'perso'
                ? 'Aucune phrase enregistrée : cliquez sur ✏️ Ma phrase pour en construire une.'
                : 'Aucune phrase.';
            stage.appendChild(e);
            statusEl.style.display = 'none';
            readTop.innerHTML = '';
            return;
        }
        const items = buildItems();
        items.forEach(it => {
            const g = G(it.gid);
            const f = fnOf(g);
            const gEl = document.createElement('div');
            gEl.className = 'atp-g' + (it.clitic ? ' clitic' : '') + (flashId === it.gid ? ' atp-flash' : '');
            gEl.dataset.gid = it.gid;
            if (g.fn) gEl.dataset.fn = g.fn;
            gEl.style.setProperty('--fc', f.c);
            const box = document.createElement('div');
            box.className = 'atp-g-box';
            it.words.forEach(w => box.appendChild(wordSpan(w, it.gid)));
            if (it.comma) {
                const cm = document.createElement('span');
                cm.className = 'atp-comma';
                cm.textContent = ',';
                box.appendChild(cm);
            }
            const lbl = document.createElement('div');
            lbl.className = 'atp-fnlbl';
            lbl.textContent = f.lbl + (it.clitic || (pron.has(it.gid) && g.fn === 'S') ? ' (pronom)' : '');
            gEl.appendChild(box);
            gEl.appendChild(lbl);
            stage.appendChild(gEl);
        });
        const p = document.createElement('span');
        p.className = 'atp-punct';
        p.textContent = cur.punct;
        stage.appendChild(p);
        flashId = null;

        const ok = phraseOk();
        statusEl.style.display = '';
        statusEl.className = 'atp-status ' + (ok ? 'ok' : 'ko');
        statusEl.textContent = ok ? '✓ Phrase correcte' : '✗ Phrase incorrecte';

        const changed = history.length > 0;
        readTop.innerHTML = `<b>Phrase de départ :</b> ${_atpEsc(originalText())}` +
            (changed ? `<br><b>Phrase obtenue :</b> <span class="atp-now">${_atpEsc(itemsText(items))}</span>` : '');
    }

    function renderDraft() {
        statusEl.style.display = 'none';
        readTop.innerHTML = '<b>Nouvelle phrase :</b> indiquez les natures et les fonctions.';
        draft.tokens.forEach((tk, i) => {
            if (tk.p) {
                const p = document.createElement('span');
                p.className = 'atp-punct';
                p.textContent = tk.t;
                stage.appendChild(p);
                return;
            }
            if (draft.split[i]) {
                const m = document.createElement('span');
                m.className = 'atp-split-mark';
                stage.appendChild(m);
            }
            const f = ATP_FN[draft.fn[i]] || ATP_FN_NONE;
            const gEl = document.createElement('div');
            gEl.className = 'atp-g atp-dw';
            gEl.dataset.di = i;
            gEl.style.setProperty('--fc', f.c);
            const box = document.createElement('div');
            box.className = 'atp-g-box';
            box.appendChild(wordSpan({ t: tk.t, show: tk.t, nat: draft.nat[i] || null }));
            const lbl = document.createElement('div');
            lbl.className = 'atp-fnlbl';
            lbl.textContent = draft.fn[i] ? f.lbl : '—';
            gEl.appendChild(box);
            gEl.appendChild(lbl);
            stage.appendChild(gEl);
        });
    }

    function renderTrash() {
        trash.innerHTML = '';
        if (!cur || draft) { trash.classList.remove('show'); return; }
        const items = [];
        order.forEach(id => { if (removed.has(id)) items.push({ id }); });
        removedW.forEach(k => {
            const [gid, wi] = k.split(':').map(Number);
            if (!removed.has(gid)) items.push({ id: gid, wi });
        });
        trash.classList.toggle('show', items.length > 0);
        if (!items.length) return;
        const lbl = document.createElement('span');
        lbl.textContent = '🗑 Supprimés (cliquer pour remettre) :';
        trash.appendChild(lbl);
        items.forEach(it => {
            const b = document.createElement('button');
            b.className = 'atp-trash-item';
            if (it.wi !== undefined) {
                b.textContent = G(it.id).words[it.wi].t;
                b.dataset.restoreWord = it.id + ':' + it.wi;
            } else {
                b.textContent = (fnOf(G(it.id)).lbl) + ' : ' + groupText(G(it.id));
                b.dataset.restore = it.id;
            }
            trash.appendChild(b);
        });
    }

    function renderVerdict() {
        if (draft) {
            verdictEl.className = 'atp-verdict';
            verdictEl.innerHTML = 'Une fois la phrase analysée, cliquez sur <b>💾 Enregistrer l\'atelier</b>.';
            return;
        }
        if (!cur) { verdictEl.className = 'atp-verdict'; verdictEl.innerHTML = ''; verdictEl.style.display = 'none'; return; }
        verdictEl.style.display = '';
        if (verdict) {
            verdictEl.className = 'atp-verdict ' + verdict.cls;
            verdictEl.innerHTML = verdict.html;
        } else {
            verdictEl.className = 'atp-verdict';
            verdictEl.innerHTML = {
                move: '✋ <b>Déplacer</b> : faites glisser un groupe à un autre endroit de la phrase. Lesquels peuvent bouger ?',
                del:  '✂️ <b>Supprimer</b> : cliquez sur un groupe pour l\'enlever. La phrase reste-t-elle correcte ?',
                pron: '🔁 <b>Pronom</b> : cliquez sur un groupe pour le remplacer par un pronom. Où se place le pronom ?'
            }[mode];
        }
    }

    function renderHeader() {
        const list = getList(level);
        if (draft) navLabel.textContent = 'Nouvelle phrase';
        else navLabel.textContent = cur ? `Phrase ${idx + 1} / ${list.length}` : 'Aucune phrase';
        prevBtn.disabled = !!draft || list.length < 2;
        nextBtn.disabled = !!draft || list.length < 2;
        badge.textContent = draft ? 'Ma phrase' : ATP_LEVELS[level].label;
        controls.querySelectorAll('.atp-level-btn').forEach(b => b.classList.toggle('active', !draft && b.dataset.level === level));
        delPersoBtn.style.display = (level === 'perso' && !draft && cur) ? '' : 'none';
        hint.classList.toggle('show', !!draft);
        tools.style.display = draft ? 'none' : '';
        markTools.style.display = draft ? '' : 'none';
        tools.querySelectorAll('.atp-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        markTools.querySelectorAll('.atp-tool').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
        undoBtn.disabled  = !history.length;
        resetBtn.disabled = !history.length;
        natBtn.classList.toggle('on', showNat);
        fnBtn.classList.toggle('on', showFn);
        legend.style.display = showNat ? '' : 'none';
    }

    function renderAll() {
        renderHeader();
        renderStage();
        renderTrash();
        renderVerdict();
        requestAnimationFrame(fit);
    }

    // ── Taille des étiquettes selon la place disponible ───────────────────
    function fit() {
        const sw = stage.clientWidth, sh = stage.clientHeight;
        if (!sw || !sh) return;
        let size = Math.max(14, Math.min(sh / 3.4, sw / 16, 64));
        stage.style.setProperty('--atp-fs', size + 'px');
        let guard = 0;
        while ((stage.scrollHeight > sh + 1 || stage.scrollWidth > sw + 1) && size > 11 && guard++ < 80) {
            size *= 0.93;
            stage.style.setProperty('--atp-fs', size + 'px');
        }
    }

    // ── Commentaires ──────────────────────────────────────────────────────
    function say(cls, html) { verdict = { cls, html }; }
    function q(t) { return '« ' + _atpEsc(t) + ' »'; }

    function verdictMove(id) {
        const g = G(id), f = fnOf(g);
        const ok = phraseOk();
        if (g.fn === 'CC') {
            const first = buildItems()[0];
            const atStart = first && first.gid === id;
            if (ok) say('ok', `✓ <b>Le complément circonstanciel ${q(groupText(g))} se déplace</b> : la phrase reste correcte et garde son sens. C'est un indice pour reconnaître un CC.` +
                (atStart ? ' En tête de phrase, on le sépare par une virgule.' : ''));
            else say('ko', '✗ La phrase n\'est plus correcte, mais ce n\'est pas à cause du CC : un autre groupe n\'est pas à sa place.');
            return;
        }
        if (ok) { say('ok', '✓ La phrase reste correcte : seuls les compléments circonstanciels ont changé de place autour de ce groupe.'); return; }
        const msg = {
            S:   `✗ <b>Le sujet ${q(groupText(g))} ne se déplace pas librement</b> : la phrase devient incorrecte, ou un autre groupe devient le sujet et le sens change.`,
            V:   `✗ <b>Le verbe ${q(groupText(g))} ne se déplace pas</b> : il reste entre le sujet et ses compléments.`,
            COD: `✗ <b>Le COD ${q(groupText(g))} ne se déplace pas</b> : il se place après le verbe. Déplacé, il rend la phrase incorrecte ou change son sens. (Seul le pronom COD passe devant le verbe.)`,
            COI: `✗ <b>Le COI ${q(groupText(g))} ne se déplace pas</b> : c'est un complément essentiel du verbe, il reste après lui.`,
            ATT: `✗ <b>L'attribut ${q(groupText(g))} ne se déplace pas</b> : il suit le verbe d'état.`
        }[g.fn];
        say('ko', msg || `✗ ${_atpUpperFirst(f.long)} ne se déplace pas ici : la phrase n'est plus correcte.`);
    }

    function verdictDelete(id) {
        const g = G(id);
        const t = q(groupText(g));
        const ordBad = !orderOk();
        const suffix = ordBad ? ' (Attention : un autre groupe n\'est pas à sa place.)' : '';
        const m = {
            CC:  ['ok', `✓ <b>Le complément circonstanciel ${t} se supprime</b> : la phrase reste correcte. Il est facultatif : il apporte seulement une précision (lieu, temps, manière…).`],
            S:   ['ko', `✗ <b>Le sujet ${t} ne se supprime pas</b> : sans lui, la phrase n'est plus correcte. C'est un groupe obligatoire.`],
            V:   ['ko', `✗ <b>Le verbe ${t} ne se supprime pas</b> : sans verbe conjugué, il n'y a plus de phrase verbale.`],
            COI: ['ko', `✗ <b>Le COI ${t} ne se supprime pas</b> : c'est un complément essentiel, la phrase devient incomplète.`],
            ATT: ['ko', `✗ <b>L'attribut ${t} ne se supprime pas</b> : avec un verbe d'état, la phrase n'a plus de sens.`]
        };
        if (g.fn === 'COD') {
            if (g.opt) say('warn', `⚠️ <b>Ici, le COD ${t} peut se supprimer</b> : la phrase reste correcte car le verbe peut s'employer seul, mais elle perd une information importante. En général, le COD est un complément essentiel.` + suffix);
            else say('ko', `✗ <b>Le COD ${t} ne se supprime pas</b> : c'est un complément essentiel du verbe, la phrase devient incomplète.`);
            return;
        }
        const r = m[g.fn] || ['warn', `La fonction de ce groupe n'a pas été indiquée : la classe peut juger si la phrase reste correcte.`];
        say(r[0], r[1] + (r[0] === 'ok' ? suffix : ''));
    }

    function verdictPron(id, on) {
        const g = G(id);
        const t = q(groupText(g));
        if (!on) { say('info', `Le groupe ${t} a retrouvé sa place.`); return; }
        const p = q(g.pr);
        const m = {
            S:   `✓ <b>Le sujet ${t} est remplacé par le pronom personnel ${p}</b>. Le pronom reste à la place du sujet.`,
            COD: `✓ <b>Le COD ${t} est remplacé par ${p}</b>. Attention : le pronom COD se place <b>avant le verbe</b> !`,
            COI: `✓ <b>Le COI ${t} est remplacé par ${p}</b>, placé <b>avant le verbe</b> : la préposition « à » disparaît.`,
            CC:  `✓ <b>Le complément de lieu ${t} est remplacé par ${p}</b>, placé <b>avant le verbe</b>.`,
            ATT: `✓ <b>L'attribut ${t} est remplacé par ${p}</b> (toujours « le », invariable), placé <b>avant le verbe</b>.`
        };
        say('ok', m[g.fn] || `✓ Le groupe ${t} est remplacé par ${p}.`);
    }

    function noPronMsg(g) {
        if (g.fn === 'V') return '🔁 Un verbe ne se remplace pas par un pronom : choisissez un groupe du nom.';
        if (g.fn === 'CC') return `🔁 Le complément circonstanciel ${q(groupText(g))} ne se remplace pas par un pronom (seuls certains compléments de lieu se remplacent par « y »).`;
        if (g.fn === 'COD') return `🔁 Avec un déterminant comme « un », « une » ou « des », le COD se remplace par « en » (elle en tricote une) : ce cas n'est pas proposé ici.`;
        if (g.fn === 'S' && g.words.length === 1 && g.words[0].nat === 'PR') return '🔁 Ce sujet est déjà un pronom.';
        return '🔁 Pas de pronom prévu pour ce groupe.';
    }

    // ── Manipulations ─────────────────────────────────────────────────────
    function deleteGroup(id) {
        if (removed.has(id)) return;
        pushHistory();
        removed.add(id);
        pron.delete(id);
        verdictDelete(id);
        renderAll();
        save();
    }
    function deleteWord(id, wi) {
        const k = id + ':' + wi;
        if (removedW.has(k)) return;
        pushHistory();
        removedW.add(k);
        say(orderOk() ? 'ok' : 'warn', `✓ <b>L'adjectif ${q(G(id).words[wi].t)} se supprime</b> : c'est une expansion du nom (un adjectif épithète). La phrase reste correcte, elle est seulement moins précise.`);
        renderAll();
        save();
    }
    function togglePron(id) {
        const g = G(id);
        if (pron.has(id)) {
            pushHistory();
            pron.delete(id);
            flashId = id;
            verdictPron(id, false);
            renderAll();
            save();
            return;
        }
        if (!g.pr) { say('info', noPronMsg(g)); renderVerdict(); return; }
        pushHistory();
        pron.add(id);
        flashId = id;
        verdictPron(id, true);
        renderAll();
        save();
    }
    function restoreGroup(id) {
        if (!removed.has(id)) return;
        pushHistory();
        removed.delete(id);
        flashId = id;
        say('info', `Le groupe ${q(groupText(G(id)))} est revenu dans la phrase.`);
        renderAll();
        save();
    }
    function restoreWord(k) {
        if (!removedW.has(k)) return;
        pushHistory();
        removedW.delete(k);
        say('info', 'Le mot est revenu dans la phrase.');
        renderAll();
        save();
    }
    function undo() {
        const h = history.pop();
        if (!h) return;
        order = h.order; removed = new Set(h.removed); removedW = new Set(h.removedW); pron = new Set(h.pron);
        say('info', '↩ Dernière manipulation annulée.');
        renderAll();
        save();
    }
    function resetPhrase() {
        if (!cur) return;
        resetState();
        renderAll();
        save();
    }

    // ── Glisser-déposer des groupes ───────────────────────────────────────
    let drag = null, ghost = null, caret = null;

    function startGhost() {
        const r = drag.el.getBoundingClientRect();
        drag.dx = drag.x0 - r.left;
        drag.dy = drag.y0 - r.top;
        ghost = document.createElement('div');
        ghost.className = 'atp-ghost' + (showNat ? ' atp-show-nat' : '') + (showFn ? ' atp-show-fn' : '');
        ghost.style.fontSize = getComputedStyle(stage).fontSize;
        ghost.appendChild(drag.el.cloneNode(true));
        document.body.appendChild(ghost);
        drag.el.classList.add('atp-dragging');
        caret = document.createElement('div');
        caret.className = 'atp-caret';
        drag.started = true;
    }
    function placeCaret(x, y) {
        const others = Array.from(stage.querySelectorAll('.atp-g:not(.clitic)')).filter(el => el !== drag.el);
        let target = null;
        for (const el of others) {
            const r = el.getBoundingClientRect();
            if (y < r.top - 6) { target = el; break; }
            if (y <= r.bottom + 6 && x < r.left + r.width / 2) { target = el; break; }
        }
        drag.target = target;
        let before = target;
        if (target) {
            let p = target.previousElementSibling;
            while (p && p.classList.contains('clitic')) { before = p; p = p.previousElementSibling; }
            if (before.previousElementSibling === caret) return;
            stage.insertBefore(caret, before);
        } else {
            const punct = stage.querySelector('.atp-punct');
            stage.insertBefore(caret, punct);
        }
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
        placeCaret(e.clientX, e.clientY);
    }
    function onDragEnd(e) {
        if (!drag || (e && e.pointerId !== drag.pid)) return;
        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        const d = drag;
        drag = null;
        if (!d.started) {
            say('info', '✋ Faites <b>glisser</b> l\'étiquette (sans lâcher) jusqu\'à sa nouvelle place.');
            renderVerdict();
            return;
        }
        if (ghost) { ghost.remove(); ghost = null; }
        if (caret) { caret.remove(); caret = null; }
        d.el.classList.remove('atp-dragging');
        if (e && e.type === 'pointercancel') { renderStage(); return; }
        const id = d.id;
        const o = order.filter(x => x !== id);
        let pos;
        if (d.target) pos = o.indexOf(+d.target.dataset.gid);
        else {
            const vis = o.filter(x => !removed.has(x) && !isClitic(x));
            pos = vis.length ? o.indexOf(vis[vis.length - 1]) + 1 : o.length;
        }
        o.splice(pos, 0, id);
        if (o.every((x, i) => x === order[i])) { renderStage(); return; }
        pushHistory();
        order = o;
        flashId = id;
        verdictMove(id);
        renderAll();
        save();
    }

    stage.addEventListener('pointerdown', (e) => {
        const gEl = e.target.closest('.atp-g');
        e.stopPropagation();
        if (!gEl || draft || !cur || mode !== 'move' || e.button > 0) return;
        if (gEl.classList.contains('clitic')) {
            say('info', '✋ Ce pronom reste collé <b>devant le verbe</b> : il ne se déplace pas seul.');
            renderVerdict();
            return;
        }
        e.preventDefault();
        drag = { id: +gEl.dataset.gid, el: gEl, x0: e.clientX, y0: e.clientY, pid: e.pointerId, started: false, target: null };
        document.addEventListener('pointermove', onDragMove, { passive: false });
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);
    });

    stage.addEventListener('click', (e) => {
        e.stopPropagation();
        if (draft) {
            const dEl = e.target.closest('.atp-dw');
            if (dEl) markDraftWord(+dEl.dataset.di);
            return;
        }
        if (!cur || mode === 'move') return;
        const gEl = e.target.closest('.atp-g');
        if (!gEl) return;
        const id = +gEl.dataset.gid;
        if (mode === 'del') {
            const wEl = e.target.closest('.atp-w');
            if (wEl && wEl.dataset.wi !== undefined && !gEl.classList.contains('clitic') && canDelWord(id, +wEl.dataset.wi)) {
                deleteWord(id, +wEl.dataset.wi);
            } else {
                deleteGroup(id);
            }
        } else if (mode === 'pron') {
            togglePron(id);
        }
    });

    // Les zones de travail ne déplacent pas le widget
    [stageWrap, tools, markTools, customRow, hint, trash, verdictEl, controls].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    // ── Phrase perso ──────────────────────────────────────────────────────
    function openCustom() {
        customRow.classList.add('show');
        customInput.value = '';
        setTimeout(() => customInput.focus(), 30);
    }
    function closeCustom() { customRow.classList.remove('show'); }
    function validateCustom() {
        const tokens = _atpTokenize(customInput.value);
        if (!tokens.some(t => !t.p)) { customInput.focus(); return; }
        draft = { tokens, nat: {}, fn: {}, split: {} };
        tool = 'nat:N';
        closeCustom();
        renderAll();
        save();
    }
    function markDraftWord(i) {
        if (!draft || draft.tokens[i].p) return;
        if (tool.startsWith('nat:')) {
            const k = tool.slice(4);
            if (draft.nat[i] === k) delete draft.nat[i]; else draft.nat[i] = k;
        } else if (tool.startsWith('fn:')) {
            const k = tool.slice(3);
            if (draft.fn[i] === k) delete draft.fn[i]; else draft.fn[i] = k;
        } else if (tool === 'split') {
            if (draft.split[i]) delete draft.split[i]; else draft.split[i] = true;
        } else if (tool === 'gomme') {
            delete draft.nat[i]; delete draft.fn[i]; delete draft.split[i];
        }
        renderStage();
        requestAnimationFrame(fit);
        save();
    }
    function buildFromDraft() {
        const groups = [];
        let g = null, punct = '.', firstDone = false;
        draft.tokens.forEach((tk, i) => {
            if (tk.p) { if (/[.!?…]/.test(tk.t)) punct = tk.t; return; }
            const f = draft.fn[i] || null;
            if (!g || g.fn !== f || draft.split[i]) {
                g = { id: groups.length, fn: f, opt: false, words: [], pr: null };
                groups.push(g);
            }
            const nat = draft.nat[i] || null;
            let t = tk.t, np = false;
            if (/^[A-ZÀ-ÖØ-Þ]/.test(t)) np = firstDone ? true : (nat === 'N' && !g.words.some(w => w.nat === 'D'));
            firstDone = true;
            g.words.push({ t: np ? t : _atpLowerFirst(t), nat, np });
        });
        groups.forEach(gr => { gr.pr = _atpGuessPronoun(gr); });
        return { groups, punct };
    }
    function saveDraft() {
        if (!draft) return;
        const ph = buildFromDraft();
        if (!ph.groups.length) return;
        mesPhrases = _atpLoadMes();
        mesPhrases.push(ph);
        _atpSaveMes(mesPhrases);
        loadPhrase('perso', mesPhrases.length - 1);
        say('info', '💾 Votre phrase est enregistrée dans <b>⭐ Mes phrases</b>. À vous de la manipuler !');
        renderVerdict();
        save();
    }
    async function deletePerso() {
        if (level !== 'perso' || !cur || draft) return;
        let ok;
        if (typeof modalConfirm === 'function') ok = await modalConfirm('Supprimer cette phrase ?', 'Elle sera retirée de « Mes phrases ».');
        else ok = window.confirm('Supprimer cette phrase de « Mes phrases » ?');
        if (!ok) return;
        mesPhrases = _atpLoadMes();
        mesPhrases.splice(idx, 1);
        _atpSaveMes(mesPhrases);
        loadPhrase('perso', Math.max(0, idx - 1));
        save();
    }

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-level],[data-mode],[data-tool],[data-restore],[data-restore-word]');
        if (!b || !container.contains(b) || stage.contains(b)) return;
        if (b.dataset.restore !== undefined)     { restoreGroup(+b.dataset.restore); return; }
        if (b.dataset.restoreWord !== undefined) { restoreWord(b.dataset.restoreWord); return; }
        if (b.dataset.mode) {
            mode = b.dataset.mode;
            verdict = null;
            renderAll();
            save();
            return;
        }
        if (b.dataset.tool) { tool = b.dataset.tool; renderHeader(); return; }
        if (b.dataset.level) {
            mesPhrases = _atpLoadMes();
            closeCustom();
            loadPhrase(b.dataset.level, b.dataset.level === level && !draft ? idx : 0);
            save();
            return;
        }
        switch (b.dataset.act) {
            case 'prev': loadPhrase(level, idx - 1); save(); break;
            case 'next': loadPhrase(level, idx + 1); save(); break;
            case 'random': {
                const lv = draft ? '1' : level;
                const n = getList(lv).length;
                let r = 0;
                if (n > 1) { do { r = Math.floor(Math.random() * n); } while (r === idx && lv === level); }
                loadPhrase(lv, r);
                save();
                break;
            }
            case 'custom':        openCustom(); break;
            case 'custom-ok':     validateCustom(); break;
            case 'custom-cancel': closeCustom(); break;
            case 'draft-save':    saveDraft(); break;
            case 'draft-cancel':  draft = null; renderAll(); save(); break;
            case 'delete-perso':  deletePerso(); break;
            case 'undo':          undo(); break;
            case 'reset':         resetPhrase(); break;
            case 'toggle-nat':    showNat = !showNat; renderAll(); save(); break;
            case 'toggle-fn':     showFn = !showFn; renderAll(); save(); break;
        }
    });

    customInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') validateCustom();
        if (e.key === 'Escape') closeCustom();
    });
    customInput.addEventListener('click', (e) => { e.stopPropagation(); customInput.focus(); });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la ligne de phrase) ─
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(90,  startH + y - y0) + 'px';
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
            window._wfMiniBarCollapse(widget, '🧩 L\'atelier de phrases', { onExpand: () => requestAnimationFrame(fit) });
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
            stage.style.height = Math.round(window.innerHeight * 0.42) + 'px';
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

    loadPhrase('1', 0);

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._atpGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        level, idx,
        st: cur ? { order: order.slice(), removed: [...removed], removedW: [...removedW], pron: [...pron], changed: history.length > 0 } : null,
        mode, showNat, showFn,
        draft: draft ? { tokens: draft.tokens, nat: draft.nat, fn: draft.fn, split: draft.split } : null,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_atpIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._atpSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_atpIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        if (['move', 'del', 'pron'].includes(d.mode)) mode = d.mode;
        if (typeof d.showNat === 'boolean') showNat = d.showNat;
        if (typeof d.showFn === 'boolean')  showFn  = d.showFn;
        mesPhrases = _atpLoadMes();
        loadPhrase(ATP_LEVELS[d.level] ? String(d.level) : '1', parseInt(d.idx, 10) || 0);
        if (cur && d.st && Array.isArray(d.st.order)) {
            const ids = cur.groups.map(g => g.id);
            const okIds = d.st.order.length === ids.length && ids.every(x => d.st.order.includes(x));
            if (okIds) {
                order = d.st.order.slice();
                removed  = new Set((d.st.removed || []).filter(x => ids.includes(x)));
                removedW = new Set(d.st.removedW || []);
                pron     = new Set((d.st.pron || []).filter(x => ids.includes(x) && G(x).pr));
                // La phrase avait été manipulée : on garde une étape pour pouvoir revenir au départ
                if (d.st.changed) history = [{ order: ids.slice(), removed: [], removedW: [], pron: [] }];
            }
        }
        if (d.draft && Array.isArray(d.draft.tokens)) {
            draft = { tokens: d.draft.tokens, nat: d.draft.nat || {}, fn: d.draft.fn || {}, split: d.draft.split || {} };
        }
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
