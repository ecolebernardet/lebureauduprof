// =========================================================================
// WIDGET JE CONJUGUE — Le Bureau du Prof
// Une série de verbes à conjuguer (inspirée de gene_conjugaison.html) :
//   - Format « Une personne »         : N questions (verbe · pronom · temps),
//                                         sans doublon, équilibrées par verbe,
//                                         par temps et par personne.
//   - Format « Toutes les personnes » : N verbes à conjuguer en entier.
// Réglages : temps (présent, imparfait, futur, passé simple, passé composé),
//   groupes (être / avoir, 1er groupe simple, 1er groupe particulier
//   (-cer, -ger, -yer, appeler / jeter, e → è, é → è, -éer, -ier, -uer, -ouer),
//   avec l'orthographe réformée de 1990 pour les verbes en -eler / -eter
//   (j'épèle, je feuillète ; mais j'appelle, je jette et leurs dérivés),
//   2e groupe, 3e groupe) ou une liste de verbes personnelle, personnes,
//   nombre de questions ou de verbes, titre de la fiche.
// Les élèves écrivent dans les cases ; « Correction » colore les réponses
// et affiche la bonne forme (radical / terminaison en deux couleurs,
// auxiliaire en violet, accord en orange). « PDF » télécharge la fiche
// et son corrigé.
//
// Même fenêtre que « Conjugaison flash » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer, restauration après F5.
// Sur téléphone et tablette : ouverture directe en plein écran (bouton vert).
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

    if (document.getElementById('cjv-style')) return;
    const s = document.createElement('style');
    s.id = 'cjv-style';
    s.textContent = `
        .widget[data-type="conjugaison-verbes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: default;
        }
        .cjv-container {
            --zu: 8px;
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
            cursor: default;
            overflow: hidden;
        }
        .cjv-container input, .cjv-container textarea { user-select: text; -webkit-user-select: text; }
        /* Aucun bloc ne se fait écraser quand la fenêtre a une hauteur fixe (plein écran) :
           c'est la scène qui s'adapte, et la fenêtre défile si l'écran est trop petit */
        .cjv-container > * { flex-shrink: 0; }

        /* En-tête */
        .cjv-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: grab; user-select: none; }
        .cjv-header:active { cursor: grabbing; }
        .cjv-container.wf-fullboard .cjv-header { cursor: default; }
        .cjv-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.3px; pointer-events: none; }
        .cjv-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px; background: #ede9fe; color: #5b21b6; }

        /* Réduit / plein écran */
        .cjv-container.wf-minimized > *:not(.cjv-header) { display: none !important; }
        .cjv-container.wf-minimized { gap: 0; }
        .cjv-container.wf-fullboard {
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
            .cjv-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .cjv-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .cjv-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s, box-shadow .2s;
        }
        .cjv-btn:active { transform: scale(0.96); }
        .cjv-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .cjv-btn-blue  { background: #4a90e2; color: white; }
        .cjv-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .cjv-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .cjv-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .cjv-btn-green { background: #28a745; color: white; }
        .cjv-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .cjv-btn-red { background: #ef4444; color: white; }
        .cjv-btn-red:hover:not(:disabled) { background: #dc2626; }
        .cjv-btn-big { font-size: 14px; padding: 8px 18px; border-radius: 10px; }
        .cjv-btn.cjv-pulse { box-shadow: 0 0 0 4px rgba(74,144,226,.35); animation: cjvPulse 1.2s ease-in-out infinite; }
        @keyframes cjvPulse { 0%,100% { box-shadow: 0 0 0 2px rgba(74,144,226,.25); } 50% { box-shadow: 0 0 0 6px rgba(74,144,226,.45); } }
        .cjv-chips { display: flex; gap: 4px; flex-wrap: wrap; }
        .cjv-chip {
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            color: #666;
            transition: background .15s;
        }
        .cjv-chip:hover { background: #e0e0e0; }
        .cjv-chip.active { background: #ede9fe; color: #5b21b6; border-color: #c4b5fd; }
        .cjv-chip small { font-weight: 600; opacity: .7; }
        .cjv-right { margin-left: auto; display: flex; gap: 6px; align-items: center; }
        .cjv-progress { font-size: 12px; font-weight: 800; color: #6b7280; }
        .cjv-progress.good { color: #15803d; }
        .cjv-progress.warn { color: #b45309; }

        /* Réglages */
        .cjv-settings {
            display: none;
            flex-direction: column;
            gap: 6px;
            padding: 8px 10px;
            background: #fafafa;
            border: 1px solid #eee;
            border-radius: 10px;
            max-height: 45vh;
            overflow-y: auto;
        }
        .cjv-settings.show { display: flex; }
        .cjv-set-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .cjv-set-lbl { font-size: 11px; font-weight: 800; color: #6b7280; min-width: 92px; }
        .cjv-set-hint { font-size: 11px; color: #9ca3af; }
        .cjv-list-box { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 220px; }
        .cjv-list {
            width: 100%;
            min-height: 70px;
            box-sizing: border-box;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 6px 8px;
            font: 600 13px 'Nunito', 'Segoe UI', sans-serif;
            resize: vertical;
            outline: none;
        }
        .cjv-list:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,.18); }
        .cjv-list-status { font-size: 11px; font-weight: 700; color: #6b7280; }
        .cjv-list-status .ok { color: #15803d; }
        .cjv-list-status .ko { color: #dc2626; }
        .cjv-title-input {
            flex: 1; min-width: 180px; max-width: 360px;
            border: 1px solid #d1d5db; border-radius: 8px; padding: 4px 8px;
            font: 600 12px 'Segoe UI', system-ui, sans-serif; outline: none;
        }
        .cjv-title-input:focus { border-color: #8b5cf6; }

        /* Scène */
        .cjv-stage {
            position: relative;
            padding: calc(var(--zu) * 1.2);
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: auto;
        }
        .cjv-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(calc(var(--zu) * 36), 1fr));
            gap: calc(var(--zu) * 1);
            width: 100%;
            align-items: start;
        }
        .cjv-grid.cjv-grid-table { grid-template-columns: repeat(auto-fill, minmax(calc(var(--zu) * 44), 1fr)); }
        .cjv-empty {
            grid-column: 1 / -1;
            text-align: center;
            padding: 30px 10px;
            color: #6b7280;
            font-weight: 700;
            font-size: max(13px, calc(var(--zu) * 1.8));
        }
        .cjv-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: calc(var(--zu) * 0.8) calc(var(--zu) * 1.1);
            display: flex;
            flex-direction: column;
            gap: calc(var(--zu) * 0.5);
            box-shadow: 0 1px 2px rgba(0,0,0,.04);
            min-width: 0;
        }
        .cjv-card-head {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            font-size: max(11px, calc(var(--zu) * 1.35));
            font-weight: 800;
        }
        .cjv-num { color: #9ca3af; min-width: 1.4em; }
        .cjv-verb { color: #0369a1; font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: max(14px, calc(var(--zu) * 2)); font-weight: 900; }
        .cjv-grp { color: #9ca3af; font-weight: 700; font-size: .85em; }
        .cjv-tense { margin-left: auto; padding: 1px 8px; border-radius: 6px; text-transform: uppercase; font-size: .85em; letter-spacing: .3px; white-space: nowrap; }
        .cjv-t-pres { background: #cffafe; color: #0e7490; }
        .cjv-t-imp  { background: #f3e8ff; color: #7e22ce; }
        .cjv-t-fut  { background: #ffedd5; color: #c2410c; }
        .cjv-t-ps   { background: #fce7f3; color: #be185d; }
        .cjv-t-pc   { background: #dcfce7; color: #15803d; }
        .cjv-tbl-btn {
            border: 1px solid #ddd; background: #f5f5f5; border-radius: 6px;
            font-size: .9em; padding: 0 6px; cursor: pointer; line-height: 1.5;
        }
        .cjv-tbl-btn:hover { background: #e0e0e0; }
        .cjv-row { display: flex; flex-direction: column; gap: 2px; }
        .cjv-line {
            display: flex;
            align-items: center;
            gap: calc(var(--zu) * 0.8);
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: max(16px, calc(var(--zu) * 2.3));
            font-weight: 800;
            color: #374151;
        }
        .cjv-pron { flex-shrink: 0; text-align: right; min-width: 3.2em; color: #374151; }
        .cjv-card-table .cjv-pron { min-width: 4.6em; }
        .cjv-input {
            flex: 1;
            min-width: 0;
            border: none;
            border-bottom: 2px solid #d1d5db;
            background: transparent;
            font: inherit;
            font-size: max(16px, 1em);
            color: #0369a1;
            padding: 1px 4px;
            outline: none;
            border-radius: 4px 4px 0 0;
            touch-action: manipulation;
            -webkit-user-select: text;
            user-select: text;
        }
        .cjv-input:focus { border-bottom-color: #8b5cf6; background: #f5f3ff; }
        .cjv-input.ok { color: #15803d; border-bottom-color: #22c55e; background: #f0fdf4; }
        .cjv-input.ko { color: #dc2626; border-bottom-color: #ef4444; background: #fef2f2; }
        .cjv-mark { width: 1.1em; text-align: center; flex-shrink: 0; }
        .cjv-mark.ok { color: #16a34a; }
        .cjv-mark.ko { color: #dc2626; }
        .cjv-expect {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: max(14px, calc(var(--zu) * 2));
            font-weight: 900;
            padding-left: 3.6em;
            color: #6b7280;
        }
        .cjv-card-table .cjv-expect { padding-left: 5em; }
        .cjv-rad  { color: #2563eb; }
        .cjv-term { color: #dc2626; text-decoration: underline; text-decoration-thickness: .06em; text-underline-offset: .12em; }
        .cjv-aux  { color: #7c3aed; }
        .cjv-acc  { color: #ea580c; }
        .cjv-irr  { color: #0f766e; }
        .cjv-legend { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; font-size: 11px; font-weight: 700; color: #6b7280; }
        .cjv-legend b { font-weight: 900; }

        /* Conjugaison complète */
        .cjv-table { border-collapse: collapse; font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: max(13px, calc(var(--zu) * 1.8)); font-weight: 800; margin-top: 4px; background: #fafafa; border-radius: 8px; }
        .cjv-table td { padding: 1px 8px; }
        .cjv-table td:first-child { color: #6b7280; text-align: right; }
        .cjv-table tr.cur { background: #fef9c3; }

        /* Aide */
        .cjv-help-btn {
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
        .cjv-help-btn:hover { background: #e0e0e0; color: #333; }
        .cjv-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 340px;
            max-width: calc(100% - 20px);
            box-sizing: border-box;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .cjv-help-popup.show { display: block; }
        .cjv-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .cjv-help-popup p { margin: 0 0 6px; }
        .cjv-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement */
        .cjv-resize-handle {
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
        .cjv-container:hover .cjv-resize-handle { opacity: 1; }
        .cjv-container.wf-fullboard .cjv-resize-handle { display: none; }
    `;
    document.head.appendChild(s);
})();

// ── Données ───────────────────────────────────────────────────────────────
const CJV_TEMPS = [
    { k: 'pres', nom: 'présent' },
    { k: 'imp',  nom: 'imparfait' },
    { k: 'fut',  nom: 'futur' },
    { k: 'ps',   nom: 'passé simple' },
    { k: 'pc',   nom: 'passé composé' }
];
const CJV_TEMPS_NOM = {};
CJV_TEMPS.forEach(t => { CJV_TEMPS_NOM[t.k] = t.nom; });

// Personnes : pronoms tirés au sort (format « une personne »)
// et étiquette du tableau (format « toutes les personnes »)
const CJV_PERS = [
    { p: 0, lbl: 'je',             pron: ['je'],              tbl: 'je' },
    { p: 1, lbl: 'tu',             pron: ['tu'],              tbl: 'tu' },
    { p: 2, lbl: 'il / elle / on', pron: ['il', 'elle', 'on'], tbl: 'il/elle' },
    { p: 3, lbl: 'nous',           pron: ['nous'],            tbl: 'nous' },
    { p: 4, lbl: 'vous',           pron: ['vous'],            tbl: 'vous' },
    { p: 5, lbl: 'ils / elles',    pron: ['ils', 'elles'],    tbl: 'ils/elles' }
];

const CJV_GROUPES = [
    { k: 'ea', nom: 'être / avoir' },
    { k: '1s', nom: '1er groupe simple' },
    { k: '1p', nom: '1er groupe particulier' },
    { k: '2',  nom: '2e groupe' },
    { k: '3',  nom: '3e groupe' }
];

// Familles de verbes particuliers du 1er groupe
const CJV_FAMS = [
    { k: 'cer',    nom: '-cer',              ex: 'commencer' },
    { k: 'ger',    nom: '-ger',              ex: 'manger' },
    { k: 'yer',    nom: '-yer',              ex: 'payer, envoyer' },
    { k: 'eler',   nom: 'appeler / jeter',   ex: 'rappeler, rejeter' },
    { k: 'egrave', nom: 'e → è',             ex: 'acheter, épeler, lever' },
    { k: 'eaigu',  nom: 'é → è',             ex: 'céder, espérer' },
    { k: 'eer',    nom: '-éer',              ex: 'créer' },
    { k: 'ier',    nom: '-ier',              ex: 'crier' },
    { k: 'uer',    nom: '-uer',              ex: 'tuer' },
    { k: 'ouer',   nom: '-ouer',             ex: 'jouer' }
];

const CJV_END = {
    pres1: ['e', 'es', 'e', 'ons', 'ez', 'ent'],
    pres2: ['is', 'is', 'it', 'issons', 'issez', 'issent'],
    imp:   ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
    fut:   ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
    ps_a:  ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
    ps_i:  ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
    ps_u:  ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
    ps_in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent']
};
const CJV_AUX = {
    avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    etre:  ['suis', 'es', 'est', 'sommes', 'êtes', 'sont']
};

// Orthographe réformée de 1990 : les verbes en -eler / -eter prennent un accent grave
// (j'épèle, je feuillète), sauf appeler, jeter et leurs dérivés qui doublent la consonne
// (j'appelle, je rappelle, je jette, je rejette, je projette).
const CJV_LL_TT = /(appeler|jeter)$/;
// Verbes en -eler / -eter qui prenaient déjà un accent grave avant la réforme
// (pour les autres, l'ancienne forme avec consonne doublée reste acceptée)
const CJV_E_GRAVE = ['acheter', 'racheter', 'geler', 'congeler', 'dégeler', 'surgeler', 'peler',
    'modeler', 'marteler', 'ciseler', 'haleter', 'crocheter', 'fureter', 'démanteler',
    'écarteler', 'celer', 'déceler', 'receler'];

// Verbes qui se conjuguent avec être au passé composé
const CJV_ETRE = ['aller', 'venir', 'revenir', 'devenir', 'parvenir', 'intervenir', 'survenir',
    'partir', 'repartir', 'sortir', 'arriver', 'entrer', 'rentrer', 'rester', 'tomber', 'retomber',
    'monter', 'remonter', 'descendre', 'redescendre', 'retourner', 'naître', 'mourir', 'décéder'];

// Verbes.
//  1er groupe : seul l'infinitif est noté, le reste est calculé (_cjvFirst)
//  2e groupe  : radical = infinitif sans -ir (fin → finis, finissons)
//  3e groupe, être, avoir : formes du présent (radical|terminaison), radical de
//    l'imparfait, du futur, passé simple [radical, type], participe passé
const CJV_VERBES = [
    // être et avoir
    { inf: 'être',  g: 'ea', pres: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imp: 'ét', fut: 'ser', ps: ['f', 'u'], pp: 'été' },
    { inf: 'avoir', g: 'ea', pres: ['ai', 'as', 'a', 'av|ons', 'av|ez', 'ont'], imp: 'av', fut: 'aur', ps: ['e', 'u'], pp: 'eu' },

    // 1er groupe simple
    ...['chanter', 'parler', 'aimer', 'regarder', 'danser', 'marcher', 'écouter', 'travailler',
        'dessiner', 'chercher', 'trouver', 'donner', 'porter', 'penser', 'demander', 'habiter',
        'laver', 'sauter', 'fermer', 'garder', 'raconter', 'préparer', 'arriver', 'tomber',
        'rester', 'entrer', 'monter', 'rentrer'].map(inf => ({ inf, g: '1' })),

    // 1er groupe particulier
    ...['commencer', 'lancer', 'placer', 'avancer', 'effacer', 'tracer', 'prononcer',
        'manger', 'nager', 'ranger', 'partager', 'voyager', 'changer', 'bouger',
        'payer', 'essayer', 'nettoyer', 'envoyer', 'employer', 'essuyer', 'aboyer',
        'appeler', 'rappeler', 'jeter', 'rejeter', 'projeter',
        'épeler', 'feuilleter', 'étiqueter', 'ficeler',
        'acheter', 'geler', 'peler', 'lever', 'mener', 'peser', 'promener', 'semer', 'enlever',
        'céder', 'espérer', 'répéter', 'préférer', 'compléter', 'sécher',
        'créer', 'recréer',
        'crier', 'oublier', 'étudier', 'copier', 'remercier', 'plier',
        'tuer', 'continuer', 'saluer', 'remuer', 'distribuer', 'éternuer',
        'jouer', 'nouer', 'secouer', 'louer', 'clouer', 'échouer'].map(inf => ({ inf, g: '1' })),

    // 2e groupe
    ...['finir', 'choisir', 'grandir', 'réussir', 'obéir', 'remplir', 'rougir', 'réfléchir',
        'bâtir', 'agir', 'applaudir', 'nourrir', 'punir', 'guérir', 'ralentir', 'atterrir',
        'vieillir'].map(inf => ({ inf, g: '2' })),

    // 3e groupe
    { inf: 'aller',    g: '3', pres: ['vais', 'vas', 'va', 'all|ons', 'all|ez', 'vont'], imp: 'all', fut: 'ir', ps: ['all', 'a'], pp: 'all|é' },
    { inf: 'faire',    g: '3', pres: ['fai|s', 'fai|s', 'fai|t', 'fais|ons', 'faites', 'font'], imp: 'fais', fut: 'fer', ps: ['f', 'i'], pp: 'fait' },
    { inf: 'dire',     g: '3', pres: ['di|s', 'di|s', 'di|t', 'dis|ons', 'dites', 'dis|ent'], imp: 'dis', fut: 'dir', ps: ['d', 'i'], pp: 'dit' },
    { inf: 'prendre',  g: '3', pres: ['prend|s', 'prend|s', 'prend|', 'pren|ons', 'pren|ez', 'prenn|ent'], imp: 'pren', fut: 'prendr', ps: ['pr', 'i'], pp: 'pris' },
    { inf: 'comprendre', g: '3', pres: ['comprend|s', 'comprend|s', 'comprend|', 'compren|ons', 'compren|ez', 'comprenn|ent'], imp: 'compren', fut: 'comprendr', ps: ['compr', 'i'], pp: 'compris' },
    { inf: 'apprendre', g: '3', pres: ['apprend|s', 'apprend|s', 'apprend|', 'appren|ons', 'appren|ez', 'apprenn|ent'], imp: 'appren', fut: 'apprendr', ps: ['appr', 'i'], pp: 'appris' },
    { inf: 'venir',    g: '3', pres: ['vien|s', 'vien|s', 'vien|t', 'ven|ons', 'ven|ez', 'vienn|ent'], imp: 'ven', fut: 'viendr', ps: ['v', 'in'], pp: 'ven|u' },
    { inf: 'revenir',  g: '3', pres: ['revien|s', 'revien|s', 'revien|t', 'reven|ons', 'reven|ez', 'revienn|ent'], imp: 'reven', fut: 'reviendr', ps: ['rev', 'in'], pp: 'reven|u' },
    { inf: 'devenir',  g: '3', pres: ['devien|s', 'devien|s', 'devien|t', 'deven|ons', 'deven|ez', 'devienn|ent'], imp: 'deven', fut: 'deviendr', ps: ['dev', 'in'], pp: 'deven|u' },
    { inf: 'tenir',    g: '3', pres: ['tien|s', 'tien|s', 'tien|t', 'ten|ons', 'ten|ez', 'tienn|ent'], imp: 'ten', fut: 'tiendr', ps: ['t', 'in'], pp: 'ten|u' },
    { inf: 'obtenir',  g: '3', pres: ['obtien|s', 'obtien|s', 'obtien|t', 'obten|ons', 'obten|ez', 'obtienn|ent'], imp: 'obten', fut: 'obtiendr', ps: ['obt', 'in'], pp: 'obten|u' },
    { inf: 'pouvoir',  g: '3', pres: ['peu|x', 'peu|x', 'peu|t', 'pouv|ons', 'pouv|ez', 'peuv|ent'], imp: 'pouv', fut: 'pourr', ps: ['p', 'u'], pp: 'pu' },
    { inf: 'vouloir',  g: '3', pres: ['veu|x', 'veu|x', 'veu|t', 'voul|ons', 'voul|ez', 'veul|ent'], imp: 'voul', fut: 'voudr', ps: ['voul', 'u'], pp: 'voul|u' },
    { inf: 'voir',     g: '3', pres: ['voi|s', 'voi|s', 'voi|t', 'voy|ons', 'voy|ez', 'voi|ent'], imp: 'voy', fut: 'verr', ps: ['v', 'i'], pp: 'vu' },
    { inf: 'savoir',   g: '3', pres: ['sai|s', 'sai|s', 'sai|t', 'sav|ons', 'sav|ez', 'sav|ent'], imp: 'sav', fut: 'saur', ps: ['s', 'u'], pp: 'su' },
    { inf: 'devoir',   g: '3', pres: ['doi|s', 'doi|s', 'doi|t', 'dev|ons', 'dev|ez', 'doiv|ent'], imp: 'dev', fut: 'devr', ps: ['d', 'u'], pp: 'dû' },
    { inf: 'recevoir', g: '3', pres: ['reçoi|s', 'reçoi|s', 'reçoi|t', 'recev|ons', 'recev|ez', 'reçoiv|ent'], imp: 'recev', fut: 'recevr', ps: ['reç', 'u'], pp: 'reç|u' },
    { inf: 'apercevoir', g: '3', pres: ['aperçoi|s', 'aperçoi|s', 'aperçoi|t', 'apercev|ons', 'apercev|ez', 'aperçoiv|ent'], imp: 'apercev', fut: 'apercevr', ps: ['aperç', 'u'], pp: 'aperç|u' },
    { inf: 'partir',   g: '3', pres: ['par|s', 'par|s', 'par|t', 'part|ons', 'part|ez', 'part|ent'], imp: 'part', fut: 'partir', ps: ['part', 'i'], pp: 'part|i' },
    { inf: 'sortir',   g: '3', pres: ['sor|s', 'sor|s', 'sor|t', 'sort|ons', 'sort|ez', 'sort|ent'], imp: 'sort', fut: 'sortir', ps: ['sort', 'i'], pp: 'sort|i' },
    { inf: 'dormir',   g: '3', pres: ['dor|s', 'dor|s', 'dor|t', 'dorm|ons', 'dorm|ez', 'dorm|ent'], imp: 'dorm', fut: 'dormir', ps: ['dorm', 'i'], pp: 'dorm|i' },
    { inf: 'sentir',   g: '3', pres: ['sen|s', 'sen|s', 'sen|t', 'sent|ons', 'sent|ez', 'sent|ent'], imp: 'sent', fut: 'sentir', ps: ['sent', 'i'], pp: 'sent|i' },
    { inf: 'servir',   g: '3', pres: ['ser|s', 'ser|s', 'ser|t', 'serv|ons', 'serv|ez', 'serv|ent'], imp: 'serv', fut: 'servir', ps: ['serv', 'i'], pp: 'serv|i' },
    { inf: 'courir',   g: '3', pres: ['cour|s', 'cour|s', 'cour|t', 'cour|ons', 'cour|ez', 'cour|ent'], imp: 'cour', fut: 'courr', ps: ['cour', 'u'], pp: 'cour|u' },
    { inf: 'mourir',   g: '3', pres: ['meur|s', 'meur|s', 'meur|t', 'mour|ons', 'mour|ez', 'meur|ent'], imp: 'mour', fut: 'mourr', ps: ['mour', 'u'], pp: 'mort' },
    { inf: 'ouvrir',   g: '3', pres: ['ouvr|e', 'ouvr|es', 'ouvr|e', 'ouvr|ons', 'ouvr|ez', 'ouvr|ent'], imp: 'ouvr', fut: 'ouvrir', ps: ['ouvr', 'i'], pp: 'ouvert' },
    { inf: 'offrir',   g: '3', pres: ['offr|e', 'offr|es', 'offr|e', 'offr|ons', 'offr|ez', 'offr|ent'], imp: 'offr', fut: 'offrir', ps: ['offr', 'i'], pp: 'offert' },
    { inf: 'cueillir', g: '3', pres: ['cueill|e', 'cueill|es', 'cueill|e', 'cueill|ons', 'cueill|ez', 'cueill|ent'], imp: 'cueill', fut: 'cueiller', ps: ['cueill', 'i'], pp: 'cueill|i' },
    { inf: 'fuir',     g: '3', pres: ['fui|s', 'fui|s', 'fui|t', 'fuy|ons', 'fuy|ez', 'fui|ent'], imp: 'fuy', fut: 'fuir', ps: ['fu', 'i'], pp: 'fu|i' },
    { inf: 'mettre',   g: '3', pres: ['met|s', 'met|s', 'met|', 'mett|ons', 'mett|ez', 'mett|ent'], imp: 'mett', fut: 'mettr', ps: ['m', 'i'], pp: 'mis' },
    { inf: 'permettre', g: '3', pres: ['permet|s', 'permet|s', 'permet|', 'permett|ons', 'permett|ez', 'permett|ent'], imp: 'permett', fut: 'permettr', ps: ['perm', 'i'], pp: 'permis' },
    { inf: 'promettre', g: '3', pres: ['promet|s', 'promet|s', 'promet|', 'promett|ons', 'promett|ez', 'promett|ent'], imp: 'promett', fut: 'promettr', ps: ['prom', 'i'], pp: 'promis' },
    { inf: 'battre',   g: '3', pres: ['bat|s', 'bat|s', 'bat|', 'batt|ons', 'batt|ez', 'batt|ent'], imp: 'batt', fut: 'battr', ps: ['batt', 'i'], pp: 'batt|u' },
    { inf: 'lire',     g: '3', pres: ['li|s', 'li|s', 'li|t', 'lis|ons', 'lis|ez', 'lis|ent'], imp: 'lis', fut: 'lir', ps: ['l', 'u'], pp: 'lu' },
    { inf: 'écrire',   g: '3', pres: ['écri|s', 'écri|s', 'écri|t', 'écriv|ons', 'écriv|ez', 'écriv|ent'], imp: 'écriv', fut: 'écrir', ps: ['écriv', 'i'], pp: 'écrit' },
    { inf: 'rire',     g: '3', pres: ['ri|s', 'ri|s', 'ri|t', 'ri|ons', 'ri|ez', 'ri|ent'], imp: 'ri', fut: 'rir', ps: ['r', 'i'], pp: 'ri' },
    { inf: 'croire',   g: '3', pres: ['croi|s', 'croi|s', 'croi|t', 'croy|ons', 'croy|ez', 'croi|ent'], imp: 'croy', fut: 'croir', ps: ['cr', 'u'], pp: 'cru' },
    { inf: 'boire',    g: '3', pres: ['boi|s', 'boi|s', 'boi|t', 'buv|ons', 'buv|ez', 'boiv|ent'], imp: 'buv', fut: 'boir', ps: ['b', 'u'], pp: 'bu' },
    { inf: 'connaître', g: '3', pres: ['connai|s', 'connai|s', 'connaî|t', 'connaiss|ons', 'connaiss|ez', 'connaiss|ent'], imp: 'connaiss', fut: 'connaîtr', ps: ['conn', 'u'], pp: 'connu' },
    { inf: 'naître',   g: '3', pres: ['nai|s', 'nai|s', 'naî|t', 'naiss|ons', 'naiss|ez', 'naiss|ent'], imp: 'naiss', fut: 'naîtr', ps: ['naqu', 'i'], pp: 'né' },
    { inf: 'vivre',    g: '3', pres: ['vi|s', 'vi|s', 'vi|t', 'viv|ons', 'viv|ez', 'viv|ent'], imp: 'viv', fut: 'vivr', ps: ['véc', 'u'], pp: 'véc|u' },
    { inf: 'suivre',   g: '3', pres: ['sui|s', 'sui|s', 'sui|t', 'suiv|ons', 'suiv|ez', 'suiv|ent'], imp: 'suiv', fut: 'suivr', ps: ['suiv', 'i'], pp: 'suiv|i' },
    { inf: 'entendre', g: '3', pres: ['entend|s', 'entend|s', 'entend|', 'entend|ons', 'entend|ez', 'entend|ent'], imp: 'entend', fut: 'entendr', ps: ['entend', 'i'], pp: 'entend|u' },
    { inf: 'attendre', g: '3', pres: ['attend|s', 'attend|s', 'attend|', 'attend|ons', 'attend|ez', 'attend|ent'], imp: 'attend', fut: 'attendr', ps: ['attend', 'i'], pp: 'attend|u' },
    { inf: 'répondre', g: '3', pres: ['répond|s', 'répond|s', 'répond|', 'répond|ons', 'répond|ez', 'répond|ent'], imp: 'répond', fut: 'répondr', ps: ['répond', 'i'], pp: 'répond|u' },
    { inf: 'descendre', g: '3', pres: ['descend|s', 'descend|s', 'descend|', 'descend|ons', 'descend|ez', 'descend|ent'], imp: 'descend', fut: 'descendr', ps: ['descend', 'i'], pp: 'descend|u' },
    { inf: 'perdre',   g: '3', pres: ['perd|s', 'perd|s', 'perd|', 'perd|ons', 'perd|ez', 'perd|ent'], imp: 'perd', fut: 'perdr', ps: ['perd', 'i'], pp: 'perd|u' },
    { inf: 'vendre',   g: '3', pres: ['vend|s', 'vend|s', 'vend|', 'vend|ons', 'vend|ez', 'vend|ent'], imp: 'vend', fut: 'vendr', ps: ['vend', 'i'], pp: 'vend|u' },
    { inf: 'peindre',  g: '3', pres: ['pein|s', 'pein|s', 'pein|t', 'peign|ons', 'peign|ez', 'peign|ent'], imp: 'peign', fut: 'peindr', ps: ['peign', 'i'], pp: 'peint' },
    { inf: 'éteindre', g: '3', pres: ['étein|s', 'étein|s', 'étein|t', 'éteign|ons', 'éteign|ez', 'éteign|ent'], imp: 'éteign', fut: 'éteindr', ps: ['éteign', 'i'], pp: 'éteint' },
    { inf: 'craindre', g: '3', pres: ['crain|s', 'crain|s', 'crain|t', 'craign|ons', 'craign|ez', 'craign|ent'], imp: 'craign', fut: 'craindr', ps: ['craign', 'i'], pp: 'craint' },
    { inf: 'conduire', g: '3', pres: ['condui|s', 'condui|s', 'condui|t', 'conduis|ons', 'conduis|ez', 'conduis|ent'], imp: 'conduis', fut: 'conduir', ps: ['conduis', 'i'], pp: 'conduit' },
    { inf: 'construire', g: '3', pres: ['construi|s', 'construi|s', 'construi|t', 'construis|ons', 'construis|ez', 'construis|ent'], imp: 'construis', fut: 'construir', ps: ['construis', 'i'], pp: 'construit' }
];

// ── Moteur de conjugaison ─────────────────────────────────────────────────
// Verbe du 1er groupe : radical, radical fort, cédille / e doux, futur
function _cjvFirst(inf, extra) {
    const w = inf.slice(0, -2);
    const v = { inf, g: '1', w, fam: '' };
    if (/cer$/.test(inf)) { v.soft = 'c'; v.fam = 'cer'; }
    else if (/ger$/.test(inf)) { v.soft = 'g'; v.fam = 'ger'; }
    else if (/yer$/.test(inf)) {
        v.fam = 'yer';
        v.s = w.slice(0, -1) + 'i';                       // je paie, je nettoie
        if (/^r?envoyer$/.test(inf)) v.fut = inf.replace(/oyer$/, 'err');   // j'enverrai
        else v.fut = v.s + 'er';                           // je paierai, je nettoierai
        if (/ayer$/.test(inf)) { v.altS = w; v.altFut = inf; }  // je paye, je payerai (acceptés)
    }
    else if (/éer$/.test(inf)) v.fam = 'eer';
    else if (/ouer$/.test(inf)) v.fam = 'ouer';
    else if (/[^gq]uer$/.test(inf)) v.fam = 'uer';
    else if (/ier$/.test(inf)) v.fam = 'ier';
    else if (/[^é]e[lt]er$/.test(inf)) {
        if (CJV_LL_TT.test(inf)) { v.fam = 'eler'; v.s = w + w.slice(-1); }                                 // j'appelle, je jette
        else {
            v.fam = 'egrave'; v.s = w.slice(0, -2) + 'è' + w.slice(-1);                                     // j'achète, j'épèle, je feuillète
            // Ancienne orthographe (consonne doublée) encore acceptée : j'épelle, je feuillette
            if (!CJV_E_GRAVE.includes(inf)) { v.altS = w + w.slice(-1); v.altFut = v.altS + 'er'; }
        }
        v.fut = v.s + 'er';
    }
    else if (/é(ch|gn|gr|gl|br|tr|cr|vr|pl|[bcdfgjklmnpqrstvz])er$/.test(inf)) {
        v.fam = 'eaigu';
        const i = w.lastIndexOf('é');
        v.s = w.slice(0, i) + 'è' + w.slice(i + 1);         // je cède
        v.altFut = v.s + 'er';                             // je cèderai (orthographe rectifiée, acceptée)
    }
    else if (/e(ch|vr|[bcdfgjkmnpqrsvz])er$/.test(inf)) {
        v.fam = 'egrave';
        const i = w.lastIndexOf('e');
        v.s = w.slice(0, i) + 'è' + w.slice(i + 1);         // je lève, je mène
        v.fut = v.s + 'er';
    }
    if (extra) Object.keys(extra).forEach(k => { if (k !== 'inf' && k !== 'g') v[k] = extra[k]; });
    return v;
}

const _cjvCache = {};
// Retrouve un verbe (liste intégrée, ou verbe en -er / -ir reconnu automatiquement)
function _cjvGetVerb(raw) {
    const inf = String(raw || '').trim().toLowerCase().replace(/[’`´]/g, "'");
    if (!inf) return null;
    if (Object.prototype.hasOwnProperty.call(_cjvCache, inf)) return _cjvCache[inf];
    let v = null;
    const db = CJV_VERBES.find(x => x.inf === inf);
    if (db) {
        if (db.g === '1') v = _cjvFirst(inf, db);
        else if (db.g === '2') v = Object.assign({ w: inf.slice(0, -2) }, db);
        else v = Object.assign({}, db);
    } else if (/^[a-zàâäçéèêëîïôöûüÿœ-]+$/.test(inf) && inf.length > 3) {
        if (/er$/.test(inf)) v = _cjvFirst(inf, { custom: true });
        else if (/ir$/.test(inf)) v = { inf, g: '2', w: inf.slice(0, -2), custom: true };
    }
    if (v && !v.aux && CJV_ETRE.includes(v.inf)) v.aux = 'etre';
    _cjvCache[inf] = v;
    return v;
}

function _cjvGroupKey(v) {
    if (!v) return '';
    if (v.g === '1') return v.fam ? '1p' : '1s';
    return v.g;
}
function _cjvGroupLabel(v) {
    if (!v) return '';
    if (v.g === 'ea') return 'auxiliaire';
    if (v.g === '1') {
        const f = CJV_FAMS.find(x => x.k === v.fam);
        return f ? '1er groupe · ' + f.nom : '1er groupe';
    }
    return v.g === '2' ? '2e groupe' : '3e groupe';
}

// g doux (mangeons) / c doux (commençons) devant a, â, o, u
function _cjvSoft(rad, soft, end) {
    if (!soft || !/^[aâoôu]/.test(end)) return rad;
    if (soft === 'g') return rad + 'e';
    if (soft === 'c') return rad.slice(0, -1) + 'ç';
    return rad;
}
function _cjvSplit(form) {
    if (form.indexOf('|') >= 0) {
        const [r, e] = form.split('|');
        return [{ t: r, c: 'rad' }, { t: e, c: 'term' }];
    }
    return [{ t: form, c: 'irr' }];
}
function _cjvSimple(rad, end) { return [{ t: rad, c: 'rad' }, { t: end, c: 'term' }]; }
function _cjvParticipe(v) {
    if (v.g === '1') return _cjvSimple(v.w, 'é');
    if (v.g === '2') return _cjvSimple(v.w, 'i');
    return _cjvSplit(v.pp);
}
// Accord du participe avec être (forme affichée dans la correction)
const CJV_ACC_SHOW = { je: '(e)', tu: '(e)', il: '', elle: 'e', on: '', nous: '(e)s', vous: '(e)(s)', ils: 's', elles: 'es', 'il/elle': '(e)', 'ils/elles': '(e)s' };
// Accords acceptés dans la réponse de l'élève
const CJV_ACC_OK = { je: ['', 'e'], tu: ['', 'e'], il: [''], elle: ['e'], on: ['', 'e', 's', 'es'], nous: ['s', 'es'], vous: ['', 'e', 's', 'es'], ils: ['s'], elles: ['es'], 'il/elle': ['', 'e'], 'ils/elles': ['s', 'es'] };
const CJV_DEF_PRON = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

// Forme conjuguée : liste de morceaux { t, c } (c = rad, term, aux, acc, irr)
function _cjvConj(v, temps, p, pron) {
    if (temps === 'pc') {
        const auxKey = v.aux === 'etre' ? 'etre' : 'avoir';
        const parts = [{ t: CJV_AUX[auxKey][p], c: 'aux' }, { t: ' ', c: '' }].concat(_cjvParticipe(v));
        if (auxKey === 'etre') {
            const acc = CJV_ACC_SHOW[pron || CJV_DEF_PRON[p]];
            if (acc) parts.push({ t: acc, c: 'acc' });
        }
        return parts;
    }
    if (v.g === '1') {
        if (temps === 'pres') {
            const end = CJV_END.pres1[p];
            const rad = (p === 3 || p === 4) ? v.w : (v.s || v.w);
            return _cjvSimple(_cjvSoft(rad, v.soft, end), end);
        }
        if (temps === 'imp') { const e = CJV_END.imp[p];  return _cjvSimple(_cjvSoft(v.w, v.soft, e), e); }
        if (temps === 'fut') { return _cjvSimple(v.fut || v.inf, CJV_END.fut[p]); }
        if (temps === 'ps')  { const e = CJV_END.ps_a[p]; return _cjvSimple(_cjvSoft(v.w, v.soft, e), e); }
    }
    if (v.g === '2') {
        if (temps === 'pres') return _cjvSimple(v.w, CJV_END.pres2[p]);
        if (temps === 'imp')  return _cjvSimple(v.w + 'iss', CJV_END.imp[p]);
        if (temps === 'fut')  return _cjvSimple(v.inf, CJV_END.fut[p]);
        if (temps === 'ps')   return _cjvSimple(v.w, CJV_END.ps_i[p]);
    }
    // 3e groupe, être, avoir
    if (temps === 'pres') return _cjvSplit(v.pres[p]);
    if (temps === 'imp')  return _cjvSimple(v.imp, CJV_END.imp[p]);
    if (temps === 'fut')  return _cjvSimple(v.fut, CJV_END.fut[p]);
    if (temps === 'ps')   return _cjvSimple(v.ps[0], CJV_END['ps_' + v.ps[1]][p]);
    return [{ t: '?', c: 'irr' }];
}
function _cjvText(parts) { return parts.map(x => x.t).join(''); }
function _cjvEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function _cjvPartsHTML(parts) {
    return parts.map(x => x.c ? `<span class="cjv-${x.c}">${_cjvEsc(x.t)}</span>` : _cjvEsc(x.t)).join('');
}
// Pronom affiché devant la case (avec l'élision : j'aime, j'ai fini…)
function _cjvPronLabel(pron, first) {
    if (pron === 'je' && /^[aâeéèêiîoôuyh]/i.test(first)) return 'j’';
    if (pron === 'il/elle') return 'il / elle';
    if (pron === 'ils/elles') return 'ils / elles';
    return pron;
}

// Réponse de l'élève remise à plat (minuscules, apostrophes, espaces, pronom retiré)
function _cjvNorm(s) {
    let t = String(s || '').toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim().replace(/[.!;,]+$/, '').trim();
    t = t.replace(/^(il ?\/ ?elle|ils ?\/ ?elles|je|tu|il|elle|on|nous|vous|ils|elles) /, '').replace(/^j' ?/, '');
    return t.trim();
}
// Toutes les réponses acceptées (variantes d'orthographe, accords au passé composé)
function _cjvAccepted(v, t, p, pron) {
    const set = new Set();
    const variants = [v];
    if (v.altS || v.altFut) variants.push(Object.assign({}, v, { s: v.altS || v.s, fut: v.altFut || v.fut }));
    variants.forEach(vv => {
        const parts = _cjvConj(vv, t, p, pron);
        set.add(_cjvNorm(_cjvText(parts)));
        if (t === 'pc' && vv.aux === 'etre') {
            const base = _cjvText(parts.filter(x => x.c !== 'acc'));
            (CJV_ACC_OK[pron] || ['']).forEach(sfx => set.add(_cjvNorm(base + sfx)));
        }
    });
    return set;
}
function _cjvIsOk(answer, v, t, p, pron) {
    const a = _cjvNorm(answer);
    return !!a && _cjvAccepted(v, t, p, pron).has(a);
}

function _cjvShuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
// Liste de longueur n où chaque valeur revient autant de fois que possible
function _cjvBalanced(list, n) {
    const out = [];
    while (out.length < n) out.push(..._cjvShuffle(list.slice()));
    return out.slice(0, n);
}
function _cjvPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Lecture d'une liste de verbes tapée par l'enseignant
function _cjvParseList(text) {
    const ok = [], bad = [], seen = new Set();
    String(text || '').split(/[\n,;]+/).forEach(raw => {
        const s = raw.trim();
        if (!s) return;
        const v = _cjvGetVerb(s);
        if (!v) { if (!bad.includes(s)) bad.push(s); return; }
        if (seen.has(v.inf)) return;
        seen.add(v.inf);
        ok.push(v);
    });
    return { ok, bad };
}

// Téléphone et tablette (même détection que les autres activités)
function _cjvIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}

const CJV_NBQ = [5, 8, 10, 12, 15, 20];
const CJV_NBV = [1, 2, 3, 4, 6];

// ── Création du widget ────────────────────────────────────────────────────
function createConjugaisonVerbesWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'conjugaison-verbes';
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
    container.className = 'cjv-container';

    // Taille initiale : 75 % de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'cjv-header';
    header.innerHTML = `
        <span class="cjv-title">✏️ Je conjugue</span>
        <span class="cjv-badge">Une personne</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.cjv-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'cjv-controls';
    controls.innerHTML = `
        <div class="cjv-chips">
            <button class="cjv-chip" data-format="single" title="Chaque question : un verbe, un pronom et un temps">✏️ Une personne</button>
            <button class="cjv-chip" data-format="table" title="Chaque verbe à conjuguer à toutes les personnes">📋 Toutes les personnes</button>
        </div>
        <button class="cjv-btn cjv-btn-grey" data-act="settings" title="Choisir les temps, les verbes, les personnes et le nombre de questions">⚙️ Réglages</button>
        <div class="cjv-right"><span class="cjv-progress"></span></div>
    `;
    const progress = controls.querySelector('.cjv-progress');
    container.appendChild(controls);

    // ── Réglages ──────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'cjv-settings';
    settings.innerHTML = `
        <div class="cjv-set-row"><span class="cjv-set-lbl">Temps</span><div class="cjv-chips" data-set="temps">
            ${CJV_TEMPS.map(t => `<button class="cjv-chip" data-val="${t.k}">${t.nom}</button>`).join('')}
        </div></div>
        <div class="cjv-set-row"><span class="cjv-set-lbl">Verbes</span><div class="cjv-chips" data-set="src">
            <button class="cjv-chip" data-val="auto">🎲 au hasard, selon les groupes</button>
            <button class="cjv-chip" data-val="list">📝 ma liste de verbes</button>
        </div></div>
        <div class="cjv-set-row" data-row="groupes"><span class="cjv-set-lbl">Groupes</span><div class="cjv-chips" data-set="groupes">
            ${CJV_GROUPES.map(g => `<button class="cjv-chip" data-val="${g.k}">${g.nom}</button>`).join('')}
        </div></div>
        <div class="cjv-set-row" data-row="fams"><span class="cjv-set-lbl">Particuliers</span><div class="cjv-chips" data-set="fams">
            ${CJV_FAMS.map(f => `<button class="cjv-chip" data-val="${f.k}" title="${f.ex}">${f.nom} <small>${f.ex}</small></button>`).join('')}
        </div></div>
        <div class="cjv-set-row" data-row="list"><span class="cjv-set-lbl">Ma liste</span>
            <div class="cjv-list-box">
                <textarea class="cjv-list" placeholder="Un verbe par ligne (ou séparés par des virgules)&#10;chanter&#10;finir&#10;prendre"></textarea>
                <span class="cjv-list-status"></span>
            </div>
        </div>
        <div class="cjv-set-row"><span class="cjv-set-lbl">Personnes</span><div class="cjv-chips" data-set="pers">
            ${CJV_PERS.map(x => `<button class="cjv-chip" data-val="${x.p}">${x.lbl}</button>`).join('')}
        </div></div>
        <div class="cjv-set-row" data-row="nbQ"><span class="cjv-set-lbl">Nombre</span><div class="cjv-chips" data-set="nbQ">
            ${CJV_NBQ.map(n => `<button class="cjv-chip" data-val="${n}">${n} questions</button>`).join('')}
        </div></div>
        <div class="cjv-set-row" data-row="nbV"><span class="cjv-set-lbl">Nombre</span><div class="cjv-chips" data-set="nbV">
            ${CJV_NBV.map(n => `<button class="cjv-chip" data-val="${n}">${n} verbe${n > 1 ? 's' : ''}</button>`).join('')}
        </div></div>
        <div class="cjv-set-row"><span class="cjv-set-lbl">Titre de la fiche</span>
            <input type="text" class="cjv-title-input" maxlength="80" placeholder="Conjugaison">
        </div>
        <div class="cjv-set-hint">Au moins un choix par ligne. Une nouvelle série est tirée dès qu'un réglage change (si aucune réponse n'est encore écrite).</div>
    `;
    const listTa     = settings.querySelector('.cjv-list');
    const listStatus = settings.querySelector('.cjv-list-status');
    const titleInput = settings.querySelector('.cjv-title-input');
    container.appendChild(settings);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'cjv-stage';
    stage.style.height = Math.round(initH * 0.62) + 'px';
    stage.innerHTML = `<div class="cjv-grid"></div>`;
    const gridEl = stage.querySelector('.cjv-grid');
    container.appendChild(stage);

    // ── Légende + boutons d'action ────────────────────────────────────────
    const legend = document.createElement('div');
    legend.className = 'cjv-legend';
    legend.style.display = 'none';
    legend.innerHTML = `
        <span><b style="color:#2563eb">radical</b></span>
        <span><b style="color:#dc2626">terminaison</b></span>
        <span><b style="color:#7c3aed">auxiliaire</b></span>
        <span><b style="color:#ea580c">accord</b></span>
        <span><b style="color:#0f766e">forme irrégulière</b></span>
    `;
    container.appendChild(legend);

    const actions = document.createElement('div');
    actions.className = 'cjv-controls';
    actions.style.justifyContent = 'center';
    container.appendChild(actions);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'cjv-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'cjv-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Je conjugue</h4>
        <p>Une série de verbes à conjuguer, <b>sans doublon</b>, équilibrée entre les verbes, les temps et les personnes.</p>
        <p><b>✏️ Une personne</b> : chaque question donne un verbe, un pronom et un temps.
        <b>📋 Toutes les personnes</b> : chaque verbe se conjugue en entier.</p>
        <p><b>⚙️ Réglages</b> : temps (présent, imparfait, futur, passé simple, passé composé), groupes
        (être / avoir, 1er groupe simple, 1er groupe particulier : -cer, -ger, -yer, appeler / jeter, e → è, é → è,
        -éer, -ier, -uer, -ouer, 2e groupe, 3e groupe) ou <b>votre liste de verbes</b>, personnes et nombre.</p>
        <p>Orthographe réformée de 1990 : les verbes en -eler / -eter prennent un accent grave (j’épèle, je feuillète),
        sauf <b>appeler</b>, <b>jeter</b> et leurs dérivés (j’appelle, je rejette). L’ancienne forme reste acceptée.</p>
        <p>Les élèves écrivent la forme conjuguée dans les cases (le pronom peut être retapé ou non).
        <b>👁 Correction</b> colore les réponses et donne la bonne forme : <b style="color:#2563eb">radical</b>,
        <b style="color:#dc2626">terminaison</b>, <b style="color:#7c3aed">auxiliaire</b>, <b style="color:#ea580c">accord</b>.
        Le bouton 📋 d'une carte affiche toute la conjugaison.</p>
        <p>Au passé composé avec être, les accords possibles sont acceptés (je suis allé ou allée).
        Pour payer, essayer…, les deux formes sont acceptées (je paie / je paye).</p>
        <p><b>📄 PDF</b> télécharge la fiche à imprimer : 4 exemplaires par page pour une petite série (2 pour une série plus longue), à découper, puis le corrigé en couleurs sur une deuxième page.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'cjv-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let opts = {
        format: 'single',
        temps: ['pres', 'imp', 'fut'],
        src: 'auto',
        groupes: ['ea', '1s', '1p', '2', '3'],
        fams: CJV_FAMS.map(f => f.k),
        list: '',
        pers: [0, 1, 2, 3, 4, 5],
        nbQ: 10,
        nbV: 3,
        title: ''
    };
    let serie = null;          // { format, questions: [{ v, t, lines: [{ p, pron }] }] }
    let answers = [];          // answers[question][ligne]
    let correction = false;
    let openTables = [];       // cartes dont la conjugaison complète est affichée
    let settingsOpen = false;
    let dirty = false;         // réglages changés après le début de la série
    let emptyMsg = '';

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    let saveT = null;
    function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 500); }

    // ── Tirage de la série ────────────────────────────────────────────────
    function verbPool() {
        if (opts.src === 'list') return _cjvParseList(opts.list).ok;
        return CJV_VERBES.map(x => _cjvGetVerb(x.inf)).filter(v => {
            const k = _cjvGroupKey(v);
            return v && opts.groupes.includes(k) && (k !== '1p' || opts.fams.includes(v.fam));
        });
    }

    function generate() {
        const pool = verbPool();
        const pers = CJV_PERS.filter(x => opts.pers.includes(x.p));
        answers = []; correction = false; openTables = []; dirty = false;
        if (!pool.length) {
            serie = null;
            emptyMsg = opts.src === 'list'
                ? '📝 Écrivez votre liste de verbes dans les réglages (⚙️).'
                : 'Aucun verbe ne correspond aux réglages choisis.';
            return;
        }
        // Liste personnelle : on garde l'ordre ; sinon on mélange
        const verbs = opts.src === 'list' ? pool.slice() : _cjvShuffle(pool.slice());
        const questions = [];
        const used = new Set();

        if (opts.format === 'table') {
            const n = Math.min(opts.nbV, verbs.length * opts.temps.length);
            const T = _cjvBalanced(opts.temps, n);
            for (let i = 0; i < n; i++) {
                const v = verbs[i % verbs.length];
                let t = T[i];
                if (used.has(v.inf + '|' + t)) t = opts.temps.find(tt => !used.has(v.inf + '|' + tt));
                if (!t) continue;
                used.add(v.inf + '|' + t);
                questions.push({ v: v.inf, t, lines: pers.map(P => ({ p: P.p, pron: P.tbl })) });
            }
        } else {
            const n = Math.min(opts.nbQ, verbs.length * opts.temps.length * pers.length);
            const T = _cjvBalanced(opts.temps, n);
            const P = _cjvBalanced(pers, n);
            for (let i = 0; i < n; i++) {
                let done = false;
                // Verbe prévu, puis les suivants si toutes ses combinaisons sont prises
                for (let k = 0; k < verbs.length && !done; k++) {
                    const v = verbs[(i + k) % verbs.length];
                    let t = T[i], Pp = P[i];
                    if (used.has(v.inf + '|' + t + '|' + Pp.p)) {
                        let found = null;
                        for (const tt of _cjvShuffle(opts.temps.slice())) {
                            for (const pp of _cjvShuffle(pers.slice())) {
                                if (!used.has(v.inf + '|' + tt + '|' + pp.p)) { found = [tt, pp]; break; }
                            }
                            if (found) break;
                        }
                        if (!found) continue;
                        [t, Pp] = found;
                    }
                    used.add(v.inf + '|' + t + '|' + Pp.p);
                    questions.push({ v: v.inf, t, lines: [{ p: Pp.p, pron: _cjvPick(Pp.pron) }] });
                    done = true;
                }
            }
        }
        serie = { format: opts.format, questions };
        answers = questions.map(q => q.lines.map(() => ''));
    }

    function hasAnswers() { return answers.some(a => a.some(x => x && x.trim())); }

    // Un réglage a changé : nouvelle série tout de suite, sauf si des réponses sont écrites
    function settingsChanged() {
        if (serie && (hasAnswers() || correction)) dirty = true;
        else generate();
        renderAll();
        save();
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function tableHTML(v, t, curP) {
        const rows = [0, 1, 2, 3, 4, 5].map(p => {
            const pron = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'][p];
            const parts = _cjvConj(v, t, p, pron);
            const lbl = _cjvPronLabel(pron, _cjvText(parts));
            return `<tr class="${curP.includes(p) ? 'cur' : ''}"><td>${lbl}</td><td>${_cjvPartsHTML(parts)}</td></tr>`;
        }).join('');
        return `<table class="cjv-table">${rows}</table>`;
    }

    function scoreOf() {
        let ok = 0, total = 0, filled = 0;
        if (!serie) return { ok, total, filled };
        serie.questions.forEach((q, qi) => {
            const v = _cjvGetVerb(q.v);
            q.lines.forEach((ln, li) => {
                total++;
                const a = (answers[qi] && answers[qi][li]) || '';
                if (a.trim()) filled++;
                if (v && _cjvIsOk(a, v, q.t, ln.p, ln.pron)) ok++;
            });
        });
        return { ok, total, filled };
    }

    function renderGrid() {
        if (!serie || !serie.questions.length) {
            gridEl.classList.remove('cjv-grid-table');
            gridEl.innerHTML = `<div class="cjv-empty">${_cjvEsc(emptyMsg || 'Cliquez sur « Nouvelle série ».')}</div>`;
            legend.style.display = 'none';
            return;
        }
        const isTable = serie.format === 'table';
        gridEl.classList.toggle('cjv-grid-table', isTable);
        gridEl.innerHTML = serie.questions.map((q, qi) => {
            const v = _cjvGetVerb(q.v);
            if (!v) return '';
            const head = `<div class="cjv-card-head">
                <span class="cjv-num">${qi + 1}.</span>
                <span class="cjv-verb">${_cjvEsc(v.inf)}</span>
                <span class="cjv-grp">${_cjvEsc(_cjvGroupLabel(v))}</span>
                <span class="cjv-tense cjv-t-${q.t}">${CJV_TEMPS_NOM[q.t]}</span>
                ${correction ? `<button class="cjv-tbl-btn" data-tbl="${qi}" title="Toute la conjugaison">📋</button>` : ''}
            </div>`;
            const lines = q.lines.map((ln, li) => {
                const parts = _cjvConj(v, q.t, ln.p, ln.pron);
                const label = _cjvPronLabel(ln.pron, _cjvText(parts));
                const val = (answers[qi] && answers[qi][li]) || '';
                let cls = '', mark = '', expect = '';
                if (correction) {
                    const ok = _cjvIsOk(val, v, q.t, ln.p, ln.pron);
                    cls = ok ? 'ok' : 'ko';
                    mark = ok ? '✓' : '✗';
                    if (!ok) expect = `<div class="cjv-expect">→ ${_cjvPartsHTML(parts)}</div>`;
                }
                return `<div class="cjv-row">
                    <div class="cjv-line">
                        <span class="cjv-pron">${_cjvEsc(label)}</span>
                        <input type="text" class="cjv-input ${cls}" data-q="${qi}" data-l="${li}" value="${_cjvEsc(val)}"
                            ${correction ? 'readonly' : ''} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next">
                        <span class="cjv-mark ${cls}">${mark}</span>
                    </div>${expect}
                </div>`;
            }).join('');
            const tbl = (correction && openTables.includes(qi)) ? tableHTML(v, q.t, q.lines.map(l => l.p)) : '';
            return `<div class="cjv-card${isTable ? ' cjv-card-table' : ''}">${head}${lines}${tbl}</div>`;
        }).join('');
        legend.style.display = correction ? '' : 'none';
    }

    function updateProgress() {
        progress.classList.remove('good', 'warn');
        if (dirty) {
            progress.textContent = '⚙️ Réglages modifiés : cliquez sur « Nouvelle série »';
            progress.classList.add('warn');
            return;
        }
        if (!serie || !serie.questions.length) { progress.textContent = ''; return; }
        const s = scoreOf();
        if (correction) {
            progress.textContent = (s.ok === s.total ? '🎉 ' : '') + `Score : ${s.ok} / ${s.total}`;
            if (s.ok === s.total) progress.classList.add('good');
        } else {
            progress.textContent = `${s.filled} / ${s.total} réponse${s.total > 1 ? 's' : ''}`;
        }
    }

    function renderActions() {
        const has = !!(serie && serie.questions.length);
        actions.innerHTML = `
            <button class="cjv-btn cjv-btn-blue cjv-btn-big${dirty ? ' cjv-pulse' : ''}" data-act="new">🔄 Nouvelle série</button>
            <button class="cjv-btn ${correction ? 'cjv-btn-red' : 'cjv-btn-green'} cjv-btn-big" data-act="correct" ${has ? '' : 'disabled'}>${correction ? '✏️ Masquer la correction' : '👁 Correction'}</button>
            <button class="cjv-btn cjv-btn-grey cjv-btn-big" data-act="clear" ${has ? '' : 'disabled'}>🧹 Effacer les réponses</button>
            <button class="cjv-btn cjv-btn-grey cjv-btn-big" data-act="pdf" ${has ? '' : 'disabled'}>📄 PDF</button>
        `;
    }

    function renderListStatus() {
        if (opts.src !== 'list') { listStatus.innerHTML = ''; return; }
        const r = _cjvParseList(opts.list);
        let html = r.ok.length ? `<span class="ok">✓ ${r.ok.length} verbe${r.ok.length > 1 ? 's' : ''} reconnu${r.ok.length > 1 ? 's' : ''}</span>` : 'Aucun verbe pour l\'instant';
        if (r.bad.length) html += ` · <span class="ko">✗ non reconnu${r.bad.length > 1 ? 's' : ''} : ${r.bad.map(_cjvEsc).join(', ')}</span>`;
        html += '<br>Tous les verbes en -er et en -ir (comme finir) sont reconnus, ainsi que les verbes du 3e groupe de la liste intégrée.';
        listStatus.innerHTML = html;
    }

    function renderHeader() {
        badge.textContent = opts.format === 'table' ? 'Toutes les personnes' : 'Une personne';
        controls.querySelectorAll('[data-format]').forEach(b => b.classList.toggle('active', b.dataset.format === opts.format));
        settings.classList.toggle('show', settingsOpen);
        settings.querySelectorAll('[data-set]').forEach(box => {
            const key = box.dataset.set;
            box.querySelectorAll('[data-val]').forEach(b => {
                const val = (key === 'pers' || key === 'nbQ' || key === 'nbV') ? +b.dataset.val : b.dataset.val;
                const on = Array.isArray(opts[key]) ? opts[key].includes(val) : opts[key] === val;
                b.classList.toggle('active', on);
            });
        });
        const auto = opts.src === 'auto';
        settings.querySelector('[data-row="groupes"]').style.display = auto ? '' : 'none';
        settings.querySelector('[data-row="fams"]').style.display = (auto && opts.groupes.includes('1p')) ? '' : 'none';
        settings.querySelector('[data-row="list"]').style.display = auto ? 'none' : '';
        settings.querySelector('[data-row="nbQ"]').style.display = opts.format === 'single' ? '' : 'none';
        settings.querySelector('[data-row="nbV"]').style.display = opts.format === 'table' ? '' : 'none';
        if (document.activeElement !== listTa) listTa.value = opts.list;
        if (document.activeElement !== titleInput) titleInput.value = opts.title;
        renderListStatus();
        updateProgress();
    }

    function renderAll() {
        renderHeader();
        renderGrid();
        renderActions();
        fit();
        if (_isMax) requestAnimationFrame(sizeFull);
    }

    // Taille du texte proportionnelle à la largeur de la fenêtre
    function fit() {
        const w = stage.clientWidth || container.clientWidth;
        const u = Math.max(5.5, Math.min(w / 100, 13));
        container.style.setProperty('--zu', u + 'px');
    }

    // ── PDF : fiche + corrigé (jsPDF, chargé à la demande) ────────────────
    function loadJsPDF() {
        if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
        if (window._cjvJsPDFLoading) return window._cjvJsPDFLoading;
        window._cjvJsPDFLoading = new Promise((resolve, reject) => {
            const sc = document.createElement('script');
            sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            sc.onload = () => (window.jspdf && window.jspdf.jsPDF) ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF introuvable'));
            sc.onerror = () => { window._cjvJsPDFLoading = null; reject(new Error('connexion internet requise')); };
            document.head.appendChild(sc);
        });
        return window._cjvJsPDFLoading;
    }
    // Couleurs de la correction (mêmes que dans le widget)
    const PDF_COL = { rad: '#2563eb', term: '#dc2626', aux: '#7c3aed', acc: '#ea580c', irr: '#0f766e', '': '#111827' };
    const PDF_TENSE = {
        pres: ['#cffafe', '#0e7490'], imp: ['#f3e8ff', '#7e22ce'], fut: ['#ffedd5', '#c2410c'],
        ps: ['#fce7f3', '#be185d'], pc: ['#dcfce7', '#15803d']
    };
    const PDF_FONT = "Nunito, 'Segoe UI', Arial, sans-serif";

    // Dessine une fiche (ou son corrigé) dans un canvas de W × H pixels
    function drawFiche(ctx, W, H, corr) {
        const isTable = serie.format === 'table';
        const items = serie.questions.map(q => ({ q, v: _cjvGetVerb(q.v) })).filter(x => x.v);
        const pad = W * 0.045;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.textBaseline = 'alphabetic';

        // En-tête : titre, Nom / Date
        const titleSize = Math.min(W * 0.06, H * 0.045);
        let y = pad + titleSize;
        ctx.fillStyle = '#111827';
        ctx.font = `800 ${titleSize}px ${PDF_FONT}`;
        ctx.fillText((opts.title.trim() || 'Conjugaison') + (corr ? ' — corrigé' : ''), pad, y, W - 2 * pad);
        const small = titleSize * 0.62;
        y += small * 1.9;
        const dots = (x1, x2, yy, lw) => {
            ctx.save();
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = lw;
            ctx.setLineDash([lw * 1.2, lw * 2.6]);
            ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.stroke();
            ctx.restore();
        };
        if (!corr) {
            ctx.font = `600 ${small}px ${PDF_FONT}`;
            ctx.fillStyle = '#374151';
            const xDate = pad + (W - 2 * pad) * 0.64;
            ctx.fillText('Nom :', pad, y);
            dots(pad + ctx.measureText('Nom : ').width, xDate - small, y + 2, Math.max(1, small * 0.09));
            ctx.fillText('Date :', xDate, y);
            dots(xDate + ctx.measureText('Date : ').width, W - pad, y + 2, Math.max(1, small * 0.09));
        }
        y += small * 0.9;
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = Math.max(1, small * 0.08);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
        y += small * 0.6;

        // Lignes à dessiner : titre de la question, puis une ligne par personne
        const rows = [];
        items.forEach(({ q, v }, qi) => {
            rows.push({ k: 'head', q, v, qi, u: 1 });
            q.lines.forEach(ln => rows.push({ k: 'line', q, v, ln, u: isTable ? 1 : 1.05 }));
            if (qi < items.length - 1) rows.push({ k: 'gap', u: isTable ? 0.55 : 0.35 });
        });
        const total = rows.reduce((s, r) => s + r.u, 0);
        const unit = Math.min((H - y - pad) / total, titleSize * 1.35);
        const fs = unit * 0.66;
        const indent = isTable ? fs * 5.2 : fs * 3.6;      // place du pronom

        rows.forEach(r => {
            const h = unit * r.u;
            const base = y + h * 0.78;
            if (r.k === 'head') {
                ctx.font = `700 ${fs * 0.85}px ${PDF_FONT}`;
                ctx.fillStyle = '#9ca3af';
                const num = (r.qi + 1) + '.';
                ctx.fillText(num, pad, base);
                const xv = pad + ctx.measureText(num).width + fs * 0.35;
                ctx.font = `900 ${fs}px ${PDF_FONT}`;
                ctx.fillStyle = '#0369a1';
                ctx.fillText(r.v.inf, xv, base);
                // Étiquette du temps, à droite
                const label = CJV_TEMPS_NOM[r.q.t].toUpperCase();
                ctx.font = `800 ${fs * 0.62}px ${PDF_FONT}`;
                const tw = ctx.measureText(label).width + fs * 0.6;
                const th = fs * 0.95;
                const tx = W - pad - tw, ty = base - th * 0.78;
                const [bg, fg] = PDF_TENSE[r.q.t] || ['#eee', '#333'];
                ctx.fillStyle = bg;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(tx, ty, tw, th, th * 0.25); else ctx.rect(tx, ty, tw, th);
                ctx.fill();
                ctx.fillStyle = fg;
                ctx.fillText(label, tx + fs * 0.3, ty + th * 0.72);
            } else if (r.k === 'line') {
                const parts = _cjvConj(r.v, r.q.t, r.ln.p, r.ln.pron);
                const lbl = _cjvPronLabel(r.ln.pron, _cjvText(parts));
                ctx.font = `800 ${fs}px ${PDF_FONT}`;
                ctx.fillStyle = '#374151';
                ctx.textAlign = 'right';
                ctx.fillText(lbl, pad + indent, base);
                ctx.textAlign = 'left';
                const x0 = pad + indent + fs * 0.4;
                if (corr) {
                    let x = x0;
                    parts.forEach(pt => {
                        ctx.font = `${pt.c === 'term' ? 900 : 800} ${fs}px ${PDF_FONT}`;
                        ctx.fillStyle = PDF_COL[pt.c] || PDF_COL[''];
                        ctx.fillText(pt.t, x, base);
                        const w = ctx.measureText(pt.t).width;
                        if (pt.c === 'term' && w) {
                            ctx.fillRect(x, base + fs * 0.12, w, Math.max(1, fs * 0.06));
                        }
                        x += w;
                    });
                } else {
                    dots(x0, W - pad, base + fs * 0.1, Math.max(1, fs * 0.07));
                }
            }
            y += h;
        });
    }

    function ficheImage(wMm, hMm, corr) {
        const pxMm = 9;   // résolution : 9 pixels par millimètre (≈ 230 ppp)
        const c = document.createElement('canvas');
        c.width = Math.round(wMm * pxMm);
        c.height = Math.round(hMm * pxMm);
        drawFiche(c.getContext('2d'), c.width, c.height, corr);
        return c.toDataURL('image/png');
    }

    // ── Export PDF : plusieurs exemplaires de la fiche par page A4, puis le corrigé ──
    async function exportPDF() {
        if (!serie || !serie.questions.length) return;
        const btn = actions.querySelector('[data-act="pdf"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ PDF…'; }
        try {
            const JsPDF = await loadJsPDF();
            try { if (document.fonts && document.fonts.load) await document.fonts.load(`800 20px Nunito`); } catch (e) {}

            // Petite série : 4 exemplaires par page (2 × 2) ; sinon 2 exemplaires côte à côte
            const isTable = serie.format === 'table';
            const four = isTable ? serie.questions.length <= 2 : serie.questions.length <= 8;
            const M = 10, G = 6;
            const slotW = (210 - 2 * M - G) / 2;
            const slotH = four ? (297 - 2 * M - G) / 2 : 297 - 2 * M;
            const slots = [];
            for (let r = 0; r < (four ? 2 : 1); r++) {
                for (let c = 0; c < 2; c++) slots.push([M + c * (slotW + G), M + r * (slotH + G)]);
            }

            const pdf = new JsPDF('p', 'mm', 'a4');
            const cutLines = () => {
                pdf.setDrawColor(170); pdf.setLineWidth(0.2);
                pdf.setLineDashPattern([2, 2], 0);
                pdf.line(105, 4, 105, 293);
                if (four) pdf.line(4, 148.5, 206, 148.5);
                pdf.setLineDashPattern([], 0);
            };

            // Page 1 : les exemplaires de la fiche
            const dataFiche = ficheImage(slotW, slotH, false);
            slots.forEach(([x, y]) => pdf.addImage(dataFiche, 'PNG', x, y, slotW, slotH));
            cutLines();

            // Page 2 : le corrigé (un exemplaire)
            pdf.addPage();
            pdf.addImage(ficheImage(slotW, slotH, true), 'PNG', slots[0][0], slots[0][1], slotW, slotH);

            const date = new Date();
            const ds = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
            const name = `lebureauduprof_conjugaison_${ds}.pdf`;
            if (window.Android && typeof window.Android.savePdfFromBase64 === 'function') {
                window.Android.savePdfFromBase64(pdf.output('datauristring').split(',')[1], name);
            } else {
                pdf.save(name);
            }
        } catch (err) {
            alert('Le PDF n\'a pas pu être créé (' + (err && err.message ? err.message : err) + ').');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '📄 PDF'; }
        }
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-format],[data-val],[data-tbl]');
        if (!b || !container.contains(b) || b.closest('.cjv-help-popup')) return;
        if (b.dataset.tbl !== undefined) {
            const i = +b.dataset.tbl;
            openTables = openTables.includes(i) ? openTables.filter(x => x !== i) : openTables.concat([i]);
            renderGrid();
            save();
            return;
        }
        if (b.dataset.format) {
            if (b.dataset.format === opts.format) return;
            opts.format = b.dataset.format;
            settingsChanged();
            return;
        }
        if (b.dataset.val !== undefined) {
            const box = b.closest('[data-set]');
            if (!box) return;
            const key = box.dataset.set;
            const val = (key === 'pers' || key === 'nbQ' || key === 'nbV') ? +b.dataset.val : b.dataset.val;
            if (Array.isArray(opts[key])) {
                if (opts[key].includes(val)) {
                    if (opts[key].length > 1) opts[key] = opts[key].filter(x => x !== val);
                    else return;
                } else opts[key] = opts[key].concat([val]);
            } else {
                if (opts[key] === val) return;
                opts[key] = val;
            }
            settingsChanged();
            if (key === 'src' && val === 'list') setTimeout(() => listTa.focus(), 0);
            return;
        }
        switch (b.dataset.act) {
            case 'settings':
                settingsOpen = !settingsOpen;
                renderHeader();
                requestAnimationFrame(() => { fit(); sizeFull(); });
                save();
                break;
            case 'new':
                generate();
                renderAll();
                save();
                break;
            case 'correct':
                correction = !correction;
                if (!correction) openTables = [];
                renderGrid(); renderActions(); updateProgress();
                if (_isMax) requestAnimationFrame(sizeFull);
                save();
                break;
            case 'clear':
                answers = serie ? serie.questions.map(q => q.lines.map(() => '')) : [];
                correction = false; openTables = [];
                if (dirty) generate();
                renderAll();
                save();
                break;
            case 'pdf':
                exportPDF();
                break;
        }
    });

    // Saisie des réponses
    gridEl.addEventListener('input', (e) => {
        const inp = e.target.closest('.cjv-input');
        if (!inp || correction) return;
        const qi = +inp.dataset.q, li = +inp.dataset.l;
        if (!answers[qi]) return;
        answers[qi][li] = inp.value;
        updateProgress();
        saveSoon();
    });

    // Liste de verbes et titre de la fiche
    let listT = null;
    listTa.addEventListener('input', () => {
        opts.list = listTa.value;
        renderListStatus();
        clearTimeout(listT);
        listT = setTimeout(settingsChanged, 700);
    });
    titleInput.addEventListener('input', () => { opts.title = titleInput.value; saveSoon(); });

    // Les touches tapées dans les cases ne déclenchent pas les raccourcis du tableau
    // (Suppr, Ctrl+C / V, Alt+1…). Entrée passe à la case suivante.
    ['keydown', 'keyup', 'keypress', 'paste', 'copy', 'cut'].forEach(evt => {
        container.addEventListener(evt, (e) => {
            if (!e.target.matches || !e.target.matches('input, textarea')) return;
            e.stopPropagation();
            if (evt === 'keydown' && e.key === 'Enter' && e.target.classList.contains('cjv-input')) {
                e.preventDefault();
                const all = Array.from(gridEl.querySelectorAll('.cjv-input'));
                const i = all.indexOf(e.target);
                if (i >= 0 && all[i + 1]) all[i + 1].focus();
                else e.target.blur();
            }
            if (evt === 'keydown' && e.key === 'Enter' && e.target === titleInput) { e.preventDefault(); titleInput.blur(); }
        });
    });

    // Les clics dans la scène et les réglages ne déplacent pas le widget
    // (souris, doigt et stylet : le tableau ne doit pas « voler » le toucher des cases)
    [controls, settings, stage, legend, actions].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        ['pointerdown', 'touchstart', 'touchmove', 'touchend'].forEach(evt =>
            el.addEventListener(evt, (e) => e.stopPropagation(), { passive: true }));
    });

    // Téléphone / tablette : un toucher sur une case l'active à coup sûr (et ouvre le clavier),
    // même si un autre script de la page annule le toucher
    let _tapX = 0, _tapY = 0;
    container.addEventListener('touchstart', (e) => {
        const t = e.touches && e.touches[0];
        if (t) { _tapX = t.clientX; _tapY = t.clientY; }
    }, { passive: true, capture: true });
    container.addEventListener('touchend', (e) => {
        const f = e.target && e.target.closest ? e.target.closest('input[type="text"], textarea') : null;
        if (!f || f.readOnly || f.disabled) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (t && Math.hypot(t.clientX - _tapX, t.clientY - _tapY) > 10) return;   // c'était un défilement
        if (document.activeElement !== f) f.focus();
    }, { capture: true });

    // La case touchée reste visible quand le clavier s'ouvre
    function revealInput(inp) {
        if (!inp || !document.body.contains(inp)) return;
        const sr = stage.getBoundingClientRect(), ir = inp.getBoundingClientRect();
        if (ir.top < sr.top || ir.bottom > sr.bottom) {
            stage.scrollTop += (ir.top + ir.height / 2) - (sr.top + sr.height / 2);
        }
    }
    gridEl.addEventListener('focusin', (e) => {
        if (!e.target.classList || !e.target.classList.contains('cjv-input')) return;
        setTimeout(() => revealInput(e.target), 350);
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    const _closeHelp = () => helpPopup.classList.remove('show');
    document.addEventListener('click', _closeHelp);

    // ── Redimensionnement libre (largeur + hauteur de la scène) ───────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = stage.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(420, startW + ev.clientX - startX) + 'px';
            stage.style.height    = Math.max(180, startH + ev.clientY - startY) + 'px';
            fit();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = stage.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width = Math.max(420, startW + t.clientX - startX) + 'px';
            stage.style.height    = Math.max(180, startH + t.clientY - startY) + 'px';
            fit();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    let ro = null;
    if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => fit());
        ro.observe(stage);
    }
    function onWinResize() {
        if (!document.body.contains(widget)) {
            window.removeEventListener('resize', onWinResize);
            if (window.visualViewport) window.visualViewport.removeEventListener('resize', onWinResize);
            document.removeEventListener('click', _closeHelp);
            if (ro) ro.disconnect();
            return;
        }
        fit();
        sizeFull();
        // Clavier du téléphone ouvert : on garde la case active en vue
        const a = document.activeElement;
        if (a && a.classList && a.classList.contains('cjv-input') && gridEl.contains(a)) revealInput(a);
    }
    window.addEventListener('resize', onWinResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    // En plein écran, la scène prend toute la hauteur restante
    function sizeFull() {
        if (!_isMax) return;
        // Place prise au-dessus de la scène (en-tête, réglages…) et en dessous (légende, boutons)
        const cs = getComputedStyle(container);
        const gap = parseFloat(cs.rowGap || cs.gap) || 10;
        const above = stage.offsetTop;
        let below = parseFloat(cs.paddingBottom) || 0;
        [legend, actions].forEach(el => { if (el.offsetHeight) below += el.offsetHeight + gap; });
        const viewH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const boxH = Math.min(container.clientHeight || viewH, viewH);
        // Réglages ouverts : la scène se fait plus petite (elle défile) pour laisser voir tous les réglages
        const minH = settingsOpen ? 120 : 180;
        stage.style.height = Math.max(minH, Math.round(boxH - above - below - 4)) + 'px';
        fit();
    }

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '✏️ Je conjugue', {
                onExpand: () => requestAnimationFrame(fit)
            });
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
            requestAnimationFrame(sizeFull);
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
        clearTimeout(saveT); clearTimeout(listT);
        window.removeEventListener('resize', onWinResize);
        if (window.visualViewport) window.visualViewport.removeEventListener('resize', onWinResize);
        document.removeEventListener('click', _closeHelp);
        if (ro) ro.disconnect();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    generate();
    renderAll();
    requestAnimationFrame(() => requestAnimationFrame(fit));

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._cjvGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        opts: JSON.parse(JSON.stringify(opts)),
        serie: serie ? JSON.parse(JSON.stringify(serie)) : null,
        answers: JSON.parse(JSON.stringify(answers)),
        correction,
        openTables: openTables.slice(),
        settingsOpen,
        dirty,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone et tablette, ouverture directe en plein écran (bouton vert)
    if (_cjvIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._cjvSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        // Sur téléphone et tablette, le widget reste en plein écran après une actualisation
        const toPhoneFull = () => {
            if (_cjvIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';

        const o = d.opts || {};
        const keep = (arr, ok) => Array.isArray(arr) ? arr.filter(ok) : null;
        const temps   = keep(o.temps, x => !!CJV_TEMPS_NOM[x]);
        const groupes = keep(o.groupes, x => CJV_GROUPES.some(g => g.k === x));
        const fams    = keep(o.fams, x => CJV_FAMS.some(f => f.k === x));
        const pers    = keep(o.pers, x => Number.isInteger(x) && x >= 0 && x <= 5);
        if (temps && temps.length)     opts.temps = temps;
        if (groupes && groupes.length) opts.groupes = groupes;
        if (fams && fams.length)       opts.fams = fams;
        if (pers && pers.length)       opts.pers = pers;
        if (o.format === 'single' || o.format === 'table') opts.format = o.format;
        if (o.src === 'auto' || o.src === 'list') opts.src = o.src;
        if (typeof o.list === 'string')  opts.list = o.list.slice(0, 5000);
        if (typeof o.title === 'string') opts.title = o.title.slice(0, 80);
        if (CJV_NBQ.includes(o.nbQ)) opts.nbQ = o.nbQ;
        if (CJV_NBV.includes(o.nbV)) opts.nbV = o.nbV;

        // Série en cours (vérifiée ligne par ligne)
        const okLine = ln => ln && Number.isInteger(ln.p) && ln.p >= 0 && ln.p <= 5 && typeof ln.pron === 'string' && Object.prototype.hasOwnProperty.call(CJV_ACC_OK, ln.pron);
        const okQ = q => q && _cjvGetVerb(q.v) && CJV_TEMPS_NOM[q.t] && Array.isArray(q.lines) && q.lines.length && q.lines.every(okLine);
        const s = d.serie;
        if (s && (s.format === 'single' || s.format === 'table') && Array.isArray(s.questions) && s.questions.length && s.questions.every(okQ)) {
            serie = { format: s.format, questions: s.questions.map(q => ({ v: q.v, t: q.t, lines: q.lines.map(l => ({ p: l.p, pron: l.pron })) })) };
            answers = serie.questions.map((q, qi) => q.lines.map((_, li) => {
                const a = Array.isArray(d.answers) && Array.isArray(d.answers[qi]) ? d.answers[qi][li] : '';
                return typeof a === 'string' ? a.slice(0, 80) : '';
            }));
            correction = !!d.correction;
            openTables = Array.isArray(d.openTables) ? d.openTables.filter(i => Number.isInteger(i) && i >= 0 && i < serie.questions.length) : [];
            dirty = !!d.dirty;
        } else {
            generate();
        }
        settingsOpen = !!d.settingsOpen;
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(() => { fit(); sizeFull(); }, 250);
    };

    saveBoard();
    return widget;
}

// ── Curseurs : flèche par défaut, main qui attrape sur la barre du haut (déplacement),
//    doigt qui pointe sur tout ce qui est cliquable. ──
(function () {
    if (typeof document === 'undefined' || document.getElementById('curseurs-conjugaison-verbes')) return;
    const st = document.createElement('style');
    st.id = 'curseurs-conjugaison-verbes';
    st.textContent = `
.widget[data-type="conjugaison-verbes"] { cursor: default; }
.widget[data-type="conjugaison-verbes"] .cjv-header { cursor: grab; }
.widget[data-type="conjugaison-verbes"] .cjv-header:active { cursor: grabbing; }
.widget[data-type="conjugaison-verbes"] .wf-fullboard .cjv-header, .widget[data-type="conjugaison-verbes"] .wf-fullboard .cjv-header:active { cursor: default; }
.widget[data-type="conjugaison-verbes"] .cjv-header :is(button, select, .wf-btn, [role="button"]) { cursor: pointer; }
:where(.widget[data-type="conjugaison-verbes"]) :where(button, select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="color"]) { cursor: pointer; }
.widget[data-type="conjugaison-verbes"] :is(input[type="text"], textarea) { cursor: text; }
.widget[data-type="conjugaison-verbes"] input[readonly] { cursor: default; }
.widget[data-type="conjugaison-verbes"] :is(button, select, input, textarea):disabled { cursor: default !important; }
.widget[data-type="conjugaison-verbes"] .wf-mini-bar { cursor: grab !important; }
.widget[data-type="conjugaison-verbes"] .wf-mini-bar:active { cursor: grabbing !important; }
.widget[data-type="conjugaison-verbes"] .wf-mini-bar :is(button, .wf-btn) { cursor: pointer !important; }
`;
    (document.head || document.documentElement).appendChild(st);
})();
