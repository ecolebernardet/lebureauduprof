// =========================================================================
// WIDGET CONJUGAISON FLASH — Le Bureau du Prof
// Trois rouleaux tirent au sort un verbe, un pronom et un temps
// (ex. « finir · nous · imparfait »). Les élèves conjuguent sur l'ardoise,
// puis la réponse s'affiche avec le radical et la terminaison en deux couleurs
// (et l'auxiliaire en violet pour le passé composé).
//   - Mode « Une à une » : on tire au sort une question, on montre la réponse.
//   - Mode « Série chronométrée » : N questions qui s'enchaînent avec un temps
//     limité, réponse après chaque question ou correction à la fin.
// Réglages : temps, groupes de verbes, personnes.
//
// Même fenêtre que « Le mot le plus long » : redimensionnement libre,
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

    if (document.getElementById('cjf-style')) return;
    const s = document.createElement('style');
    s.id = 'cjf-style';
    s.textContent = `
        .widget[data-type="conjugaison-flash"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .cjf-container {
            --zu: 9px;
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

        /* En-tête */
        .cjf-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; user-select: none; }
        .cjf-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.3px; pointer-events: none; }
        .cjf-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px; background: #e0f2fe; color: #075985; }

        /* Réduit / plein écran */
        .cjf-container.wf-minimized > *:not(.cjf-header) { display: none !important; }
        .cjf-container.wf-minimized { gap: 0; }
        .cjf-container.wf-fullboard {
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
            .cjf-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .cjf-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .cjf-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .cjf-btn:active { transform: scale(0.96); }
        .cjf-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .cjf-btn-blue  { background: #4a90e2; color: white; }
        .cjf-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .cjf-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .cjf-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .cjf-btn-green { background: #28a745; color: white; }
        .cjf-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .cjf-btn-orange { background: #f59e0b; color: white; }
        .cjf-btn-orange:hover:not(:disabled) { background: #d97706; }
        .cjf-btn-big { font-size: 14px; padding: 8px 18px; border-radius: 10px; }
        .cjf-chips { display: flex; gap: 4px; flex-wrap: wrap; }
        .cjf-chip {
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
        .cjf-chip:hover { background: #e0e0e0; }
        .cjf-chip.active { background: #e0f2fe; color: #075985; border-color: #9fd3f5; }
        .cjf-right { margin-left: auto; display: flex; gap: 6px; align-items: center; }

        /* Réglages */
        .cjf-settings {
            display: none;
            flex-direction: column;
            gap: 6px;
            padding: 8px 10px;
            background: #fafafa;
            border: 1px solid #eee;
            border-radius: 10px;
        }
        .cjf-settings.show { display: flex; }
        .cjf-set-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .cjf-set-lbl { font-size: 11px; font-weight: 800; color: #6b7280; min-width: 92px; }
        .cjf-set-hint { font-size: 11px; color: #9ca3af; }

        /* Scène : rouleaux + réponse */
        .cjf-stage {
            position: relative;
            display: flex;
            flex-direction: column;
            padding: calc(var(--zu) * 1.4) 12px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: auto;
        }
        /* margin:auto centre le contenu, et le laisse défiler depuis le haut s'il est trop grand */
        .cjf-stage-in {
            margin: auto;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: calc(var(--zu) * 1.6);
        }
        .cjf-reels { display: flex; gap: calc(var(--zu) * 1.4); justify-content: center; width: 100%; flex-wrap: nowrap; }
        .cjf-reel {
            flex: 1 1 0;
            max-width: calc(var(--zu) * 30);
            min-width: 0;
            background: #fff;
            border: 3px solid var(--rc);
            border-radius: calc(var(--zu) * 1.4);
            box-shadow: 0 4px 0 var(--rc), 0 6px 14px rgba(0,0,0,0.08);
            overflow: hidden;
            text-align: center;
        }
        .cjf-reel-head {
            background: var(--rc);
            color: #fff;
            font-size: max(11px, calc(var(--zu) * 1.4));
            font-weight: 800;
            letter-spacing: .5px;
            text-transform: uppercase;
            padding: calc(var(--zu) * 0.35) 4px;
        }
        .cjf-reel-win {
            height: calc(var(--zu) * 8);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            padding: 0 6px;
        }
        .cjf-reel-val {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: max(18px, calc(var(--zu) * 4.2));
            font-weight: 900;
            color: #1f2937;
            white-space: nowrap;
            overflow: hidden;
            max-width: 100%;
        }
        .cjf-reel.spinning .cjf-reel-val { filter: blur(1.2px); opacity: .75; }
        .cjf-reel.stopped .cjf-reel-val { animation: cjfPop .35s ease-out; }
        .cjf-reel-sub { font-size: max(10px, calc(var(--zu) * 1.2)); color: #6b7280; font-weight: 700; padding-bottom: calc(var(--zu) * 0.4); min-height: 1em; }
        @keyframes cjfPop { 0% { transform: scale(.7); } 70% { transform: scale(1.08); } 100% { transform: scale(1); } }

        .cjf-ask {
            font-size: max(14px, calc(var(--zu) * 2));
            font-weight: 800;
            color: #0369a1;
            text-align: center;
            min-height: 1.2em;
        }
        .cjf-timer { width: min(100%, calc(var(--zu) * 70)); display: none; flex-direction: column; gap: 4px; align-items: center; }
        .cjf-timer.show { display: flex; }
        .cjf-timer-bar { width: 100%; height: max(8px, calc(var(--zu) * 0.9)); background: #e5e7eb; border-radius: 99px; overflow: hidden; }
        .cjf-timer-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #22c55e, #84cc16); border-radius: 99px; transition: background .3s; }
        .cjf-timer-fill.warn { background: linear-gradient(90deg, #f59e0b, #ef4444); }
        .cjf-timer-txt { font-size: max(12px, calc(var(--zu) * 1.6)); font-weight: 800; color: #374151; font-variant-numeric: tabular-nums; }

        .cjf-answer {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: max(22px, calc(var(--zu) * 6));
            font-weight: 900;
            text-align: center;
            line-height: 1.15;
            min-height: 1.15em;
            color: #1f2937;
        }
        .cjf-answer.show { animation: cjfPop .4s ease-out; }
        .cjf-pron { color: #374151; }
        .cjf-rad  { color: #2563eb; }
        .cjf-term { color: #dc2626; text-decoration: underline; text-decoration-thickness: .06em; text-underline-offset: .12em; }
        .cjf-aux  { color: #7c3aed; }
        .cjf-acc  { color: #ea580c; }
        .cjf-irr  { color: #0f766e; }
        .cjf-legend { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; font-size: max(11px, calc(var(--zu) * 1.3)); font-weight: 700; color: #6b7280; }
        .cjf-legend b { font-weight: 900; }

        /* Conjugaison complète */
        .cjf-table { border-collapse: collapse; font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: max(14px, calc(var(--zu) * 2.2)); font-weight: 800; }
        .cjf-table td { padding: 2px 10px; }
        .cjf-table td:first-child { color: #6b7280; text-align: right; }
        .cjf-table tr.cur { background: #fef9c3; }
        .cjf-table tr.cur td:first-child { color: #92400e; }

        /* Correction de la série */
        .cjf-corr { width: 100%; max-width: calc(var(--zu) * 90); display: flex; flex-direction: column; gap: 4px; }
        .cjf-corr-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 4px 10px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: max(13px, calc(var(--zu) * 1.9));
            font-weight: 800;
            cursor: pointer;
        }
        .cjf-corr-row:hover { background: #f0f9ff; }
        .cjf-corr-num { color: #9ca3af; min-width: 1.8em; }
        .cjf-corr-q { color: #374151; }
        .cjf-corr-q .cjf-q-v { color: #0369a1; }
        .cjf-corr-q .cjf-q-p { color: #b45309; }
        .cjf-corr-q .cjf-q-t { color: #15803d; }
        .cjf-corr-a { margin-left: auto; font-family: 'Nunito', 'Segoe UI', sans-serif; }
        .cjf-corr-hidden { color: #9ca3af; font-weight: 700; font-size: .8em; }

        .cjf-progress { font-size: 12px; font-weight: 800; color: #6b7280; }

        /* Aide */
        .cjf-help-btn {
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
        .cjf-help-btn:hover { background: #e0e0e0; color: #333; }
        .cjf-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 320px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .cjf-help-popup.show { display: block; }
        .cjf-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .cjf-help-popup p { margin: 0 0 6px; }
        .cjf-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement */
        .cjf-resize-handle {
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
        .cjf-container:hover .cjf-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données de conjugaison ────────────────────────────────────────────────
const CJF_TEMPS = [
    { k: 'pres', nom: 'présent' },
    { k: 'imp',  nom: 'imparfait' },
    { k: 'fut',  nom: 'futur' },
    { k: 'ps',   nom: 'passé simple' },
    { k: 'pc',   nom: 'passé composé' }
];
const CJF_TEMPS_NOM = {};
CJF_TEMPS.forEach(t => { CJF_TEMPS_NOM[t.k] = t.nom; });

// Personnes (réglages) et pronoms tirés au sort pour chacune
const CJF_PERS = [
    { p: 0, lbl: 'je',             pron: ['je'] },
    { p: 1, lbl: 'tu',             pron: ['tu'] },
    { p: 2, lbl: 'il / elle / on', pron: ['il', 'elle', 'on'] },
    { p: 3, lbl: 'nous',           pron: ['nous'] },
    { p: 4, lbl: 'vous',           pron: ['vous'] },
    { p: 5, lbl: 'ils / elles',    pron: ['ils', 'elles'] }
];
const CJF_TABLE_PRON = ['je', 'tu', 'il / elle', 'nous', 'vous', 'ils / elles'];

const CJF_GROUPES = [
    { k: 'ea', nom: 'être / avoir' },
    { k: '1',  nom: '1er groupe' },
    { k: '2',  nom: '2e groupe' },
    { k: '3',  nom: '3e groupe' }
];

const CJF_END = {
    pres1: ['e', 'es', 'e', 'ons', 'ez', 'ent'],
    pres2: ['is', 'is', 'it', 'issons', 'issez', 'issent'],
    imp:   ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
    fut:   ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
    ps_a:  ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
    ps_i:  ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
    ps_u:  ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
    ps_in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent']
};
const CJF_AUX = {
    avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    etre:  ['suis', 'es', 'est', 'sommes', 'êtes', 'sont']
};

// Verbes.
//  1er groupe : w = radical (nous), s = radical fort (je, tu, il, ils) s'il change,
//               soft = 'g' (mangeons) ou 'c' (commençons), fut = radical du futur s'il change
//  2e groupe  : w = radical (fin → finis, finissons)
//  3e groupe et être / avoir : formes du présent (radical|terminaison), radical de
//               l'imparfait, du futur, passé simple [radical, type], participe passé
//  aux : 'etre' pour les verbes qui se conjuguent avec être au passé composé
const CJF_VERBES = [
    // être et avoir
    { inf: 'être',  g: 'ea', pres: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imp: 'ét', fut: 'ser', ps: ['f', 'u'], pp: 'été' },
    { inf: 'avoir', g: 'ea', pres: ['ai', 'as', 'a', 'av|ons', 'av|ez', 'ont'], imp: 'av', fut: 'aur', ps: ['e', 'u'], pp: 'eu' },
    // 1er groupe
    { inf: 'chanter',   g: '1', w: 'chant' },
    { inf: 'parler',    g: '1', w: 'parl' },
    { inf: 'jouer',     g: '1', w: 'jou' },
    { inf: 'aimer',     g: '1', w: 'aim' },
    { inf: 'regarder',  g: '1', w: 'regard' },
    { inf: 'danser',    g: '1', w: 'dans' },
    { inf: 'marcher',   g: '1', w: 'march' },
    { inf: 'écouter',   g: '1', w: 'écout' },
    { inf: 'travailler',g: '1', w: 'travaill' },
    { inf: 'dessiner',  g: '1', w: 'dessin' },
    { inf: 'arriver',   g: '1', w: 'arriv', aux: 'etre' },
    { inf: 'tomber',    g: '1', w: 'tomb',  aux: 'etre' },
    { inf: 'rester',    g: '1', w: 'rest',  aux: 'etre' },
    { inf: 'entrer',    g: '1', w: 'entr',  aux: 'etre' },
    { inf: 'manger',    g: '1', w: 'mang',  soft: 'g' },
    { inf: 'nager',     g: '1', w: 'nag',   soft: 'g' },
    { inf: 'commencer', g: '1', w: 'commenc', soft: 'c' },
    { inf: 'lancer',    g: '1', w: 'lanc',  soft: 'c' },
    { inf: 'appeler',   g: '1', w: 'appel', s: 'appell', fut: 'appeller' },
    { inf: 'acheter',   g: '1', w: 'achet', s: 'achèt',  fut: 'achèter' },
    // 2e groupe
    { inf: 'finir',     g: '2', w: 'fin' },
    { inf: 'choisir',   g: '2', w: 'chois' },
    { inf: 'grandir',   g: '2', w: 'grand' },
    { inf: 'réussir',   g: '2', w: 'réuss' },
    { inf: 'obéir',     g: '2', w: 'obé' },
    { inf: 'remplir',   g: '2', w: 'rempl' },
    { inf: 'rougir',    g: '2', w: 'roug' },
    // 3e groupe
    { inf: 'aller',   g: '3', pres: ['vais', 'vas', 'va', 'all|ons', 'all|ez', 'vont'], imp: 'all', fut: 'ir', ps: ['all', 'a'], pp: 'all|é', aux: 'etre' },
    { inf: 'faire',   g: '3', pres: ['fai|s', 'fai|s', 'fai|t', 'fais|ons', 'faites', 'font'], imp: 'fais', fut: 'fer', ps: ['f', 'i'], pp: 'fait' },
    { inf: 'dire',    g: '3', pres: ['di|s', 'di|s', 'di|t', 'dis|ons', 'dites', 'dis|ent'], imp: 'dis', fut: 'dir', ps: ['d', 'i'], pp: 'dit' },
    { inf: 'prendre', g: '3', pres: ['prend|s', 'prend|s', 'prend|', 'pren|ons', 'pren|ez', 'prenn|ent'], imp: 'pren', fut: 'prendr', ps: ['pr', 'i'], pp: 'pris' },
    { inf: 'venir',   g: '3', pres: ['vien|s', 'vien|s', 'vien|t', 'ven|ons', 'ven|ez', 'vienn|ent'], imp: 'ven', fut: 'viendr', ps: ['v', 'in'], pp: 'ven|u', aux: 'etre' },
    { inf: 'pouvoir', g: '3', pres: ['peu|x', 'peu|x', 'peu|t', 'pouv|ons', 'pouv|ez', 'peuv|ent'], imp: 'pouv', fut: 'pourr', ps: ['p', 'u'], pp: 'pu' },
    { inf: 'vouloir', g: '3', pres: ['veu|x', 'veu|x', 'veu|t', 'voul|ons', 'voul|ez', 'veul|ent'], imp: 'voul', fut: 'voudr', ps: ['voul', 'u'], pp: 'voul|u' },
    { inf: 'voir',    g: '3', pres: ['voi|s', 'voi|s', 'voi|t', 'voy|ons', 'voy|ez', 'voi|ent'], imp: 'voy', fut: 'verr', ps: ['v', 'i'], pp: 'vu' },
    { inf: 'partir',  g: '3', pres: ['par|s', 'par|s', 'par|t', 'part|ons', 'part|ez', 'part|ent'], imp: 'part', fut: 'partir', ps: ['part', 'i'], pp: 'part|i', aux: 'etre' },
    { inf: 'mettre',  g: '3', pres: ['met|s', 'met|s', 'met|', 'mett|ons', 'mett|ez', 'mett|ent'], imp: 'mett', fut: 'mettr', ps: ['m', 'i'], pp: 'mis' },
    { inf: 'savoir',  g: '3', pres: ['sai|s', 'sai|s', 'sai|t', 'sav|ons', 'sav|ez', 'sav|ent'], imp: 'sav', fut: 'saur', ps: ['s', 'u'], pp: 'su' },
    { inf: 'devoir',  g: '3', pres: ['doi|s', 'doi|s', 'doi|t', 'dev|ons', 'dev|ez', 'doiv|ent'], imp: 'dev', fut: 'devr', ps: ['d', 'u'], pp: 'dû' },
    { inf: 'lire',    g: '3', pres: ['li|s', 'li|s', 'li|t', 'lis|ons', 'lis|ez', 'lis|ent'], imp: 'lis', fut: 'lir', ps: ['l', 'u'], pp: 'lu' }
];

// g doux (mangeons) / c doux (commençons) devant a, â, o, u
function _cjfSoft(rad, soft, end) {
    if (!soft || !/^[aâoôu]/.test(end)) return rad;
    if (soft === 'g') return rad + 'e';
    if (soft === 'c') return rad.slice(0, -1) + 'ç';
    return rad;
}
// « fai|s » → ['fai', 's'] ; « sont » → forme irrégulière sans découpage
function _cjfSplit(form) {
    if (form.indexOf('|') >= 0) {
        const [r, e] = form.split('|');
        return [{ t: r, c: 'rad' }, { t: e, c: 'term' }];
    }
    return [{ t: form, c: 'irr' }];
}
function _cjfSimple(rad, end) {
    return [{ t: rad, c: 'rad' }, { t: end, c: 'term' }];
}

// Participe passé découpé (chant|é, fin|i, ven|u…)
function _cjfParticipe(v) {
    if (v.g === '1') return _cjfSimple(v.w, 'é');
    if (v.g === '2') return _cjfSimple(v.w, 'i');
    return _cjfSplit(v.pp);
}

// Accord du participe avec l'auxiliaire être
function _cjfAccord(pron) {
    return { je: '(e)', tu: '(e)', il: '', elle: 'e', on: '', nous: '(e)s', vous: '(e)(s)', ils: 's', elles: 'es' }[pron] || '';
}

// Forme conjuguée : liste de morceaux { t, c } (c = rad, term, aux, acc, irr)
function _cjfConj(v, temps, p, pron) {
    if (temps === 'pc') {
        const auxKey = v.aux === 'etre' ? 'etre' : 'avoir';
        const parts = [{ t: CJF_AUX[auxKey][p], c: 'aux' }, { t: ' ', c: '' }].concat(_cjfParticipe(v));
        if (auxKey === 'etre') {
            const acc = _cjfAccord(pron || ['je', 'tu', 'il', 'nous', 'vous', 'ils'][p]);
            if (acc) parts.push({ t: acc, c: 'acc' });
        }
        return parts;
    }
    if (v.g === '1') {
        if (temps === 'pres') {
            const end = CJF_END.pres1[p];
            const rad = (p === 3 || p === 4) ? v.w : (v.s || v.w);
            return _cjfSimple(_cjfSoft(rad, v.soft, end), end);
        }
        if (temps === 'imp') { const e = CJF_END.imp[p];  return _cjfSimple(_cjfSoft(v.w, v.soft, e), e); }
        if (temps === 'fut') { return _cjfSimple(v.fut || v.inf, CJF_END.fut[p]); }
        if (temps === 'ps')  { const e = CJF_END.ps_a[p]; return _cjfSimple(_cjfSoft(v.w, v.soft, e), e); }
    }
    if (v.g === '2') {
        if (temps === 'pres') return _cjfSimple(v.w, CJF_END.pres2[p]);
        if (temps === 'imp')  return _cjfSimple(v.w + 'iss', CJF_END.imp[p]);
        if (temps === 'fut')  return _cjfSimple(v.inf, CJF_END.fut[p]);
        if (temps === 'ps')   return _cjfSimple(v.w, CJF_END.ps_i[p]);
    }
    // 3e groupe, être, avoir
    if (temps === 'pres') return _cjfSplit(v.pres[p]);
    if (temps === 'imp')  return _cjfSimple(v.imp, CJF_END.imp[p]);
    if (temps === 'fut')  return _cjfSimple(v.fut, CJF_END.fut[p]);
    if (temps === 'ps')   return _cjfSimple(v.ps[0], CJF_END['ps_' + v.ps[1]][p]);
    return [{ t: '?', c: 'irr' }];
}

// Texte brut d'une forme (pour les tests et l'élision)
function _cjfText(parts) { return parts.map(x => x.t).join(''); }

// Pronom + forme, avec élision (j'aime, j'ai fini…)
function _cjfAnswerHTML(v, temps, p, pron) {
    const parts = _cjfConj(v, temps, p, pron);
    const first = _cjfText(parts);
    let pr = pron + ' ';
    if (pron === 'je' && /^[aeéèêiîoôuyh]/i.test(first)) pr = 'j’';
    const body = parts.map(x => x.c ? `<span class="cjf-${x.c}">${x.t}</span>` : x.t).join('');
    return `<span class="cjf-pron">${pr}</span>${body}`;
}

function _cjfFindVerb(inf) { return CJF_VERBES.find(v => v.inf === inf) || CJF_VERBES[0]; }

// Téléphone (même détection que les autres jeux et activités)
function _cjfIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createConjugaisonFlashWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'conjugaison-flash';
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
    container.className = 'cjf-container';

    // Taille initiale : 75 % de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'cjf-header';
    header.innerHTML = `
        <span class="cjf-title">⚡ Conjugaison flash</span>
        <span class="cjf-badge">Une à une</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.cjf-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'cjf-controls';
    controls.innerHTML = `
        <div class="cjf-chips">
            <button class="cjf-chip" data-mode="single" title="Une question à la fois, à votre rythme">🎲 Une à une</button>
            <button class="cjf-chip" data-mode="serie" title="Une série de questions chronométrées">⏱ Série chronométrée</button>
        </div>
        <button class="cjf-btn cjf-btn-grey" data-act="settings" title="Choisir les temps, les verbes et les personnes">⚙️ Réglages</button>
        <div class="cjf-right">
            <span class="cjf-progress"></span>
        </div>
    `;
    const progress = controls.querySelector('.cjf-progress');
    container.appendChild(controls);

    // ── Réglages ──────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'cjf-settings';
    settings.innerHTML = `
        <div class="cjf-set-row"><span class="cjf-set-lbl">Temps</span><div class="cjf-chips" data-set="temps">
            ${CJF_TEMPS.map(t => `<button class="cjf-chip" data-val="${t.k}">${t.nom}</button>`).join('')}
        </div></div>
        <div class="cjf-set-row"><span class="cjf-set-lbl">Verbes</span><div class="cjf-chips" data-set="groupes">
            ${CJF_GROUPES.map(g => `<button class="cjf-chip" data-val="${g.k}">${g.nom}</button>`).join('')}
        </div></div>
        <div class="cjf-set-row"><span class="cjf-set-lbl">Personnes</span><div class="cjf-chips" data-set="pers">
            ${CJF_PERS.map(x => `<button class="cjf-chip" data-val="${x.p}">${x.lbl}</button>`).join('')}
        </div></div>
        <div class="cjf-set-row"><span class="cjf-set-lbl">Série</span>
            <div class="cjf-chips" data-set="nb">
                ${[5, 10, 15, 20].map(n => `<button class="cjf-chip" data-val="${n}">${n} questions</button>`).join('')}
            </div>
            <div class="cjf-chips" data-set="duree">
                ${[10, 15, 20, 30, 45].map(n => `<button class="cjf-chip" data-val="${n}">${n} s</button>`).join('')}
            </div>
        </div>
        <div class="cjf-set-row"><span class="cjf-set-lbl">Réponses</span><div class="cjf-chips" data-set="reveal">
            <button class="cjf-chip" data-val="each">après chaque question</button>
            <button class="cjf-chip" data-val="end">toutes à la fin (correction)</button>
        </div></div>
        <div class="cjf-set-hint">Les réglages servent aux deux modes. Au moins un choix par ligne.</div>
    `;
    container.appendChild(settings);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'cjf-stage';
    stage.style.height = Math.round(initH * 0.62) + 'px';
    stage.innerHTML = `<div class="cjf-stage-in">
        <div class="cjf-reels">
            <div class="cjf-reel" data-reel="v" style="--rc:#0284c7"><div class="cjf-reel-head">Verbe</div><div class="cjf-reel-win"><span class="cjf-reel-val">?</span></div><div class="cjf-reel-sub"></div></div>
            <div class="cjf-reel" data-reel="p" style="--rc:#d97706"><div class="cjf-reel-head">Pronom</div><div class="cjf-reel-win"><span class="cjf-reel-val">?</span></div><div class="cjf-reel-sub"></div></div>
            <div class="cjf-reel" data-reel="t" style="--rc:#16a34a"><div class="cjf-reel-head">Temps</div><div class="cjf-reel-win"><span class="cjf-reel-val">?</span></div><div class="cjf-reel-sub"></div></div>
        </div>
        <div class="cjf-ask"></div>
        <div class="cjf-timer"><div class="cjf-timer-bar"><div class="cjf-timer-fill"></div></div><div class="cjf-timer-txt"></div></div>
        <div class="cjf-answer"></div>
        <div class="cjf-legend" style="display:none">
            <span><b style="color:#2563eb">radical</b></span>
            <span><b style="color:#dc2626">terminaison</b></span>
            <span class="cjf-leg-aux"><b style="color:#7c3aed">auxiliaire</b></span>
            <span class="cjf-leg-acc"><b style="color:#ea580c">accord</b></span>
            <span class="cjf-leg-irr"><b style="color:#0f766e">forme irrégulière</b></span>
        </div>
        <div class="cjf-extra"></div>
    </div>`;
    const reelsWrap = stage.querySelector('.cjf-reels');
    const reels = {
        v: stage.querySelector('[data-reel="v"]'),
        p: stage.querySelector('[data-reel="p"]'),
        t: stage.querySelector('[data-reel="t"]')
    };
    const askEl    = stage.querySelector('.cjf-ask');
    const timerEl  = stage.querySelector('.cjf-timer');
    const timerFill = stage.querySelector('.cjf-timer-fill');
    const timerTxt = stage.querySelector('.cjf-timer-txt');
    const answerEl = stage.querySelector('.cjf-answer');
    const legendEl = stage.querySelector('.cjf-legend');
    const extraEl  = stage.querySelector('.cjf-extra');
    container.appendChild(stage);

    // ── Boutons d'action ──────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'cjf-controls';
    actions.style.justifyContent = 'center';
    container.appendChild(actions);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'cjf-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'cjf-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Conjugaison flash</h4>
        <p><b>🎲 Une à une</b> : cliquez sur <b>Tirer au sort</b>. Les trois rouleaux choisissent un verbe, un pronom et un temps.
        Les élèves conjuguent sur l'ardoise, puis cliquez sur <b>Réponse</b>.</p>
        <p>La réponse montre le <b style="color:#2563eb">radical</b> et la <b style="color:#dc2626">terminaison</b>.
        Au passé composé, l'<b style="color:#7c3aed">auxiliaire</b> est en violet et l'<b style="color:#ea580c">accord</b>
        avec être en orange. Les formes qui ne se découpent pas (je suis, ils font…) sont en vert foncé.</p>
        <p><b>📋 Toute la conjugaison</b> affiche le verbe à toutes les personnes pour la correction.</p>
        <p><b>⏱ Série chronométrée</b> : les questions s'enchaînent avec un temps limité. Les réponses
        s'affichent après chaque question, ou toutes à la fin pour une correction collective
        (cliquez sur une ligne pour la dévoiler).</p>
        <p><b>⚙️ Réglages</b> : temps, groupes de verbes, personnes, nombre de questions et durée.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'cjf-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let opts = {
        temps: ['pres', 'imp', 'fut'],
        groupes: ['ea', '1', '2', '3'],
        pers: [0, 1, 2, 3, 4, 5],
        nb: 10,
        duree: 20,
        reveal: 'each'
    };
    let mode = 'single';
    let cur = null;            // question en cours : { v: infinitif, p: personne, pron, t: temps }
    let phase = 'idle';        // idle | spinning | ask | answer | done
    let showTable = false;
    let serie = null;          // { items, idx, remain, paused, shown: [] }
    let spinTimers = [];
    let countdown = null;      // { raf, last }
    let autoNext = null;
    let settingsOpen = false;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Tirage au sort ────────────────────────────────────────────────────
    function pool() {
        return CJF_VERBES.filter(v => opts.groupes.includes(v.g));
    }
    function randItem(prev) {
        const verbs = pool();
        let it, guard = 0;
        do {
            const v = verbs[Math.floor(Math.random() * verbs.length)];
            const per = CJF_PERS.filter(x => opts.pers.includes(x.p));
            const P = per[Math.floor(Math.random() * per.length)];
            const pron = P.pron[Math.floor(Math.random() * P.pron.length)];
            const t = opts.temps[Math.floor(Math.random() * opts.temps.length)];
            it = { v: v.inf, p: P.p, pron, t };
        } while (prev && guard++ < 20 && it.v === prev.v && it.t === prev.t && it.p === prev.p);
        return it;
    }

    // ── Rouleaux ──────────────────────────────────────────────────────────
    function setReel(key, val, sub) {
        const el = reels[key].querySelector('.cjf-reel-val');
        el.textContent = val;
        reels[key].querySelector('.cjf-reel-sub').textContent = sub || '';
        fitReel(el);
    }
    // Réduit la taille du mot s'il ne tient pas dans son rouleau
    function fitReel(el) {
        el.style.fontSize = '';
        if (!el.clientWidth) return;
        let size = parseFloat(getComputedStyle(el).fontSize);
        let guard = 0;
        while (el.scrollWidth > el.clientWidth + 1 && size > 10 && guard++ < 40) {
            size *= 0.92;
            el.style.fontSize = size + 'px';
        }
    }
    function groupLabel(inf) {
        const v = _cjfFindVerb(inf);
        return v.g === 'ea' ? 'auxiliaire' : (v.g === '1' ? '1er groupe' : v.g + 'e groupe');
    }
    function showItem(it) {
        if (!it) {
            ['v', 'p', 't'].forEach(k => setReel(k, '?', ''));
            return;
        }
        setReel('v', it.v, groupLabel(it.v));
        setReel('p', it.pron, '');
        setReel('t', CJF_TEMPS_NOM[it.t], '');
    }
    function clearSpin() {
        spinTimers.forEach(t => clearTimeout(t));
        spinTimers = [];
        Object.values(reels).forEach(r => r.classList.remove('spinning'));
    }

    // Les trois rouleaux défilent puis s'arrêtent l'un après l'autre
    function spin(it, done) {
        clearSpin();
        phase = 'spinning';
        const verbs = pool();
        const lists = {
            v: () => verbs[Math.floor(Math.random() * verbs.length)].inf,
            p: () => { const per = CJF_PERS.filter(x => opts.pers.includes(x.p)); const P = per[Math.floor(Math.random() * per.length)]; return P.pron[Math.floor(Math.random() * P.pron.length)]; },
            t: () => CJF_TEMPS_NOM[opts.temps[Math.floor(Math.random() * opts.temps.length)]]
        };
        const stops = { v: 900, p: 1300, t: 1700 };
        const finals = { v: it.v, p: it.pron, t: CJF_TEMPS_NOM[it.t] };
        const subs = { v: groupLabel(it.v), p: '', t: '' };
        const t0 = performance.now();
        Object.keys(reels).forEach(k => {
            const r = reels[k];
            r.classList.remove('stopped');
            r.classList.add('spinning');
            r.querySelector('.cjf-reel-sub').textContent = '';
            const tick = () => {
                const el = performance.now() - t0;
                if (el >= stops[k]) {
                    r.classList.remove('spinning');
                    setReel(k, finals[k], subs[k]);
                    void r.offsetWidth;
                    r.classList.add('stopped');
                    if (k === 't') { spinTimers = []; done(); }
                    return;
                }
                const valEl = r.querySelector('.cjf-reel-val');
                valEl.textContent = lists[k]();
                fitReel(valEl);
                // ralentit en approchant de l'arrêt
                const delay = 45 + 160 * Math.pow(el / stops[k], 2);
                spinTimers.push(setTimeout(tick, delay));
            };
            tick();
        });
        renderActions();
        renderStage();
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function answerHTML(it) {
        return _cjfAnswerHTML(_cjfFindVerb(it.v), it.t, it.p, it.pron);
    }
    function legendFor(it) {
        const parts = _cjfConj(_cjfFindVerb(it.v), it.t, it.p, it.pron);
        legendEl.querySelector('.cjf-leg-aux').style.display = parts.some(x => x.c === 'aux') ? '' : 'none';
        legendEl.querySelector('.cjf-leg-acc').style.display = parts.some(x => x.c === 'acc') ? '' : 'none';
        legendEl.querySelector('.cjf-leg-irr').style.display = parts.some(x => x.c === 'irr') ? '' : 'none';
    }
    function tableHTML(it) {
        const v = _cjfFindVerb(it.v);
        const rows = [0, 1, 2, 3, 4, 5].map(p => {
            const pron = ['je', 'tu', 'il', 'nous', 'vous', 'ils'][p];
            const parts = _cjfConj(v, it.t, p, pron);
            const first = _cjfText(parts);
            const lbl = (p === 0 && /^[aeéèêiîoôuyh]/i.test(first)) ? 'j’' : CJF_TABLE_PRON[p];
            const body = parts.map(x => x.c ? `<span class="cjf-${x.c}">${x.t}</span>` : x.t).join('');
            return `<tr class="${p === it.p ? 'cur' : ''}"><td>${lbl}</td><td>${body}</td></tr>`;
        }).join('');
        return `<table class="cjf-table">${rows}</table>`;
    }
    function questionHTML(it) {
        return `<span class="cjf-q-v">${it.v}</span> · <span class="cjf-q-p">${it.pron}</span> · <span class="cjf-q-t">${CJF_TEMPS_NOM[it.t]}</span>`;
    }

    function renderStage() {
        const inSerie = mode === 'serie' && serie;
        const done = inSerie && phase === 'done';
        reelsWrap.style.display = done ? 'none' : '';
        timerEl.classList.toggle('show', inSerie && phase === 'ask');
        answerEl.classList.remove('show');
        legendEl.style.display = 'none';
        extraEl.innerHTML = '';
        if (done) {
            askEl.textContent = opts.reveal === 'end' ? '📝 Correction de la série : cliquez sur une ligne pour voir la réponse' : '🏁 Série terminée !';
            answerEl.innerHTML = '';
            const rows = serie.items.map((it, i) => {
                const shown = opts.reveal === 'each' || serie.shown.includes(i);
                return `<div class="cjf-corr-row" data-row="${i}">
                    <span class="cjf-corr-num">${i + 1}.</span>
                    <span class="cjf-corr-q">${questionHTML(it)}</span>
                    <span class="cjf-corr-a">${shown ? answerHTML(it) : '<span class="cjf-corr-hidden">👁 cliquer pour voir</span>'}</span>
                </div>`;
            }).join('');
            extraEl.innerHTML = `<div class="cjf-corr">${rows}</div>`;
            return;
        }
        if (!cur) {
            showItem(null);
            askEl.textContent = mode === 'serie' ? 'Lancez la série quand la classe est prête.' : 'Cliquez sur « Tirer au sort » !';
            answerEl.innerHTML = '';
            return;
        }
        if (phase === 'spinning') {
            askEl.textContent = '🎲 …';
            answerEl.innerHTML = '';
            return;
        }
        showItem(cur);
        if (phase === 'ask') {
            askEl.textContent = '✏️ Conjuguez sur l’ardoise !';
            answerEl.innerHTML = '';
        } else if (phase === 'answer') {
            askEl.textContent = '';
            answerEl.innerHTML = answerHTML(cur);
            void answerEl.offsetWidth;
            answerEl.classList.add('show');
            legendFor(cur);
            legendEl.style.display = '';
            if (showTable) extraEl.innerHTML = tableHTML(cur);
        }
    }

    function renderActions() {
        let html = '';
        if (mode === 'single') {
            const spinning = phase === 'spinning';
            html += `<button class="cjf-btn cjf-btn-blue cjf-btn-big" data-act="spin" ${spinning ? 'disabled' : ''}>🎲 Tirer au sort</button>`;
            html += `<button class="cjf-btn cjf-btn-green cjf-btn-big" data-act="answer" ${phase !== 'ask' ? 'disabled' : ''}>👁 Réponse</button>`;
            html += `<button class="cjf-btn cjf-btn-grey cjf-btn-big" data-act="table" ${phase !== 'answer' ? 'disabled' : ''}>${showTable ? '📋 Masquer la conjugaison' : '📋 Toute la conjugaison'}</button>`;
        } else {
            if (!serie || phase === 'done') {
                html += `<button class="cjf-btn cjf-btn-blue cjf-btn-big" data-act="start">▶ Lancer la série (${opts.nb} questions, ${opts.duree} s)</button>`;
                if (serie && phase === 'done' && opts.reveal === 'end') html += `<button class="cjf-btn cjf-btn-green cjf-btn-big" data-act="showall">👁 Tout afficher</button>`;
            } else {
                html += `<button class="cjf-btn cjf-btn-orange cjf-btn-big" data-act="pause" ${phase === 'spinning' ? 'disabled' : ''}>${serie.paused ? '▶ Reprendre' : '⏸ Pause'}</button>`;
                html += `<button class="cjf-btn cjf-btn-grey cjf-btn-big" data-act="next" ${phase === 'spinning' ? 'disabled' : ''}>⏭ Question suivante</button>`;
                html += `<button class="cjf-btn cjf-btn-grey cjf-btn-big" data-act="stop">⏹ Arrêter</button>`;
            }
        }
        actions.innerHTML = html;
    }

    function renderHeader() {
        badge.textContent = mode === 'serie' ? 'Série chronométrée' : 'Une à une';
        controls.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        settings.classList.toggle('show', settingsOpen);
        settings.querySelectorAll('[data-set]').forEach(box => {
            const key = box.dataset.set;
            box.querySelectorAll('[data-val]').forEach(b => {
                const val = (key === 'pers' || key === 'nb' || key === 'duree') ? +b.dataset.val : b.dataset.val;
                const on = Array.isArray(opts[key]) ? opts[key].includes(val) : opts[key] === val;
                b.classList.toggle('active', on);
            });
        });
        if (mode === 'serie' && serie && phase !== 'done') progress.textContent = `Question ${serie.idx + 1} / ${serie.items.length}`;
        else if (mode === 'serie' && serie && phase === 'done') progress.textContent = `${serie.items.length} questions`;
        else progress.textContent = '';
    }

    function renderAll() {
        renderHeader();
        renderStage();
        renderActions();
        fit();
    }

    // Taille du texte proportionnelle à la fenêtre
    function fit() {
        const w = stage.clientWidth || container.clientWidth;
        const h = stage.clientHeight || 300;
        const u = Math.max(4, Math.min(w / 100, h / 32));
        container.style.setProperty('--zu', u + 'px');
        stage.querySelectorAll('.cjf-reel-val').forEach(fitReel);
    }

    // ── Mode « une à une » ────────────────────────────────────────────────
    function doSpin() {
        if (phase === 'spinning') return;
        showTable = false;
        const it = randItem(cur);
        cur = it;
        spin(it, () => {
            phase = 'ask';
            renderAll();
            save();
        });
    }

    // ── Série chronométrée ────────────────────────────────────────────────
    function stopCountdown() {
        if (countdown && countdown.raf) cancelAnimationFrame(countdown.raf);
        countdown = null;
        if (autoNext) { clearTimeout(autoNext); autoNext = null; }
    }
    function updateTimer() {
        const tot = opts.duree;
        const r = Math.max(0, serie.remain);
        timerFill.style.width = (r / tot * 100) + '%';
        timerFill.classList.toggle('warn', r <= Math.min(5, tot / 3));
        timerTxt.textContent = '⏱ ' + Math.ceil(r) + ' s';
    }
    function startCountdown() {
        stopCountdown();
        updateTimer();
        countdown = { last: performance.now(), raf: 0 };
        const loop = (now) => {
            if (!countdown || !document.body.contains(widget)) return;
            const dt = (now - countdown.last) / 1000;
            countdown.last = now;
            if (!serie.paused) serie.remain -= dt;
            updateTimer();
            if (serie.remain <= 0) { countdown = null; timeUp(); return; }
            countdown.raf = requestAnimationFrame(loop);
        };
        countdown.raf = requestAnimationFrame(loop);
    }
    function askSerieItem() {
        cur = serie.items[serie.idx];
        serie.remain = opts.duree;
        serie.paused = false;
        spin(cur, () => {
            phase = 'ask';
            renderAll();
            startCountdown();
            save();
        });
        renderHeader();
    }
    function timeUp() {
        playBeep();
        if (opts.reveal === 'each') {
            phase = 'answer';
            renderAll();
            save();
            autoNext = setTimeout(() => { autoNext = null; if (!serie.paused) nextSerieItem(); }, 4500);
        } else {
            nextSerieItem();
        }
    }
    function nextSerieItem() {
        stopCountdown();
        clearSpin();
        if (!serie) return;
        if (serie.idx + 1 >= serie.items.length) {
            phase = 'done';
            cur = null;
            renderAll();
            save();
            return;
        }
        serie.idx++;
        askSerieItem();
    }
    function startSerie() {
        stopCountdown();
        clearSpin();
        const items = [];
        for (let i = 0; i < opts.nb; i++) items.push(randItem(items[i - 1]));
        serie = { items, idx: 0, remain: opts.duree, paused: false, shown: [] };
        askSerieItem();
    }
    function stopSerie() {
        stopCountdown();
        clearSpin();
        serie = null;
        cur = null;
        phase = 'idle';
        renderAll();
        save();
    }
    function togglePause() {
        if (!serie || phase === 'done') return;
        serie.paused = !serie.paused;
        if (!serie.paused) {
            if (phase === 'ask' && !countdown) startCountdown();
            else if (phase === 'answer' && !autoNext) autoNext = setTimeout(() => { autoNext = null; if (!serie.paused) nextSerieItem(); }, 2500);
        }
        renderActions();
        save();
    }

    // Petit signal sonore à la fin du temps
    let audioCtx = null;
    function unlockAudio() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            if (!audioCtx) audioCtx = new AC();
            if (audioCtx.state === 'suspended') audioCtx.resume();
        } catch (e) {}
    }
    ['pointerdown', 'click', 'keydown'].forEach(evt => widget.addEventListener(evt, unlockAudio, { capture: true, passive: true }));
    function playBeep() {
        try {
            if (!audioCtx) return;
            const t0 = audioCtx.currentTime + 0.02;
            [[880, 0, 0.15], [1175, 0.18, 0.3]].forEach(pp => {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'sine'; o.frequency.value = pp[0];
                g.gain.setValueAtTime(0.35, t0 + pp[1]);
                g.gain.exponentialRampToValueAtTime(0.001, t0 + pp[1] + pp[2]);
                o.start(t0 + pp[1]); o.stop(t0 + pp[1] + pp[2] + 0.05);
            });
        } catch (e) {}
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-mode],[data-val],[data-row]');
        if (!b || !container.contains(b) || b.closest('.cjf-help-popup')) return;
        if (b.dataset.row !== undefined) {
            if (!serie || opts.reveal !== 'end') return;
            const i = +b.dataset.row;
            if (serie.shown.includes(i)) serie.shown = serie.shown.filter(x => x !== i);
            else serie.shown.push(i);
            renderStage();
            save();
            return;
        }
        if (b.dataset.mode) {
            if (b.dataset.mode === mode) return;
            stopCountdown();
            clearSpin();
            mode = b.dataset.mode;
            serie = null;
            cur = null;
            phase = 'idle';
            showTable = false;
            renderAll();
            save();
            return;
        }
        if (b.dataset.val !== undefined) {
            const box = b.closest('[data-set]');
            if (!box) return;
            const key = box.dataset.set;
            const val = (key === 'pers' || key === 'nb' || key === 'duree') ? +b.dataset.val : b.dataset.val;
            if (Array.isArray(opts[key])) {
                if (opts[key].includes(val)) {
                    if (opts[key].length > 1) opts[key] = opts[key].filter(x => x !== val);
                } else opts[key] = opts[key].concat([val]);
            } else {
                opts[key] = val;
            }
            renderHeader();
            renderActions();
            save();
            return;
        }
        switch (b.dataset.act) {
            case 'settings': settingsOpen = !settingsOpen; renderHeader(); requestAnimationFrame(fit); break;
            case 'spin':     doSpin(); break;
            case 'answer':   if (phase === 'ask') { phase = 'answer'; renderAll(); save(); } break;
            case 'table':    showTable = !showTable; renderStage(); renderActions(); save(); break;
            case 'start':    startSerie(); break;
            case 'pause':    togglePause(); break;
            case 'next':     if (serie && phase !== 'spinning') { if (phase === 'ask' && opts.reveal === 'each') { stopCountdown(); phase = 'answer'; renderAll(); save(); } else nextSerieItem(); } break;
            case 'stop':     stopSerie(); break;
            case 'showall':
                if (serie) { serie.shown = serie.items.map((_, i) => i); renderStage(); save(); }
                break;
        }
    });

    // Les clics dans la scène et les réglages ne déplacent pas le widget
    [controls, settings, stage, actions].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

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
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); if (ro) ro.disconnect(); return; }
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
            window._wfMiniBarCollapse(widget, '⚡ Conjugaison flash', {
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
            stage.style.height = Math.round(window.innerHeight * 0.62) + 'px';
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
        stopCountdown();
        clearSpin();
        window.removeEventListener('resize', onWinResize);
        if (ro) ro.disconnect();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    renderAll();
    requestAnimationFrame(() => requestAnimationFrame(fit));

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._cjfGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        opts: JSON.parse(JSON.stringify(opts)),
        mode,
        cur,
        // Pendant le défilement des rouleaux, la question est déjà connue : on la garde « à conjuguer »
        phase: phase === 'spinning' ? 'ask' : phase,
        showTable,
        serie: serie ? { items: serie.items, idx: serie.idx, remain: Math.max(1, serie.remain || opts.duree), shown: serie.shown.slice() } : null,
        settingsOpen,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_cjfIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._cjfSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        // Sur téléphone, le widget reste en plein écran (bouton vert) après une actualisation
        const toPhoneFull = () => {
            if (_cjfIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        const o = d.opts || {};
        const keep = (arr, ok) => Array.isArray(arr) ? arr.filter(ok) : null;
        const temps   = keep(o.temps, x => !!CJF_TEMPS_NOM[x]);
        const groupes = keep(o.groupes, x => CJF_GROUPES.some(g => g.k === x));
        const pers    = keep(o.pers, x => x >= 0 && x <= 5);
        if (temps && temps.length)     opts.temps = temps;
        if (groupes && groupes.length) opts.groupes = groupes;
        if (pers && pers.length)       opts.pers = pers;
        if ([5, 10, 15, 20].includes(o.nb)) opts.nb = o.nb;
        if ([10, 15, 20, 30, 45].includes(o.duree)) opts.duree = o.duree;
        if (o.reveal === 'each' || o.reveal === 'end') opts.reveal = o.reveal;
        mode = d.mode === 'serie' ? 'serie' : 'single';
        const okItem = it => it && CJF_VERBES.some(v => v.inf === it.v) && CJF_TEMPS_NOM[it.t] && it.p >= 0 && it.p <= 5 && typeof it.pron === 'string';
        cur = okItem(d.cur) ? d.cur : null;
        phase = ['idle', 'ask', 'answer', 'done'].includes(d.phase) ? d.phase : 'idle';
        showTable = !!d.showTable;
        settingsOpen = !!d.settingsOpen;
        serie = null;
        if (mode === 'serie' && d.serie && Array.isArray(d.serie.items) && d.serie.items.every(okItem) && d.serie.items.length) {
            serie = {
                items: d.serie.items,
                idx: Math.min(d.serie.idx | 0, d.serie.items.length - 1),
                remain: Math.min(opts.duree, Math.max(1, +d.serie.remain || opts.duree)),
                paused: true,                 // après une actualisation, la série attend « Reprendre »
                shown: Array.isArray(d.serie.shown) ? d.serie.shown.filter(i => Number.isInteger(i)) : []
            };
            if (phase !== 'done') cur = serie.items[serie.idx];
        }
        if (!cur && phase !== 'done') phase = 'idle';
        if (mode === 'serie' && !serie) { phase = 'idle'; cur = null; }
        renderAll();
        if (serie && phase === 'ask') { updateTimer(); startCountdown(); }
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
