// =========================================================================
// WIDGET LA PHRASE DU JOUR — Le Bureau du Prof
// Une phrase projetée que la classe analyse ensemble :
//   - un clic sur un mot le colore selon sa nature (outil choisi dans la barre),
//     (déterminant, nom, adjectif, verbe, pronom, mot invariable),
//   - les fonctions se soulignent : verbe conjugué en rouge, sujet en bleu,
//     COD, COI, complément circonstanciel (CC) et attribut du sujet,
//   - la correction s'affiche étape par étape (verbe, infinitif et temps,
//     sujet, compléments, puis les natures par familles), avec ✓ / ✗.
// L'enseignant peut aussi écrire sa propre phrase et enregistrer son corrigé
// (« Mes phrases », gardées dans le navigateur).
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

    if (document.getElementById('pdj-style')) return;
    const s = document.createElement('style');
    s.id = 'pdj-style';
    s.textContent = `
        .widget[data-type="phrase-du-jour"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .pdj-container {
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
        .pdj-container input, .pdj-container select {
            user-select: text;
            -webkit-user-select: text;
            font-family: inherit;
        }

        /* En-tête */
        .pdj-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .pdj-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .pdj-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #efe8fb;
            color: #5b3a9e;
        }

        /* Réduit / plein écran */
        .pdj-container.wf-minimized > *:not(.pdj-header) { display: none !important; }
        .pdj-container.wf-minimized { gap: 0; }
        .pdj-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        /* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .pdj-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles (navigation + niveaux) */
        .pdj-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .pdj-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .pdj-btn:active { transform: scale(0.96); }
        .pdj-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .pdj-btn-blue  { background: #4a90e2; color: white; }
        .pdj-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .pdj-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .pdj-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .pdj-btn-green { background: #28a745; color: white; }
        .pdj-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .pdj-btn-red   { background: #fff0f0; color: #b91c1c; border: 1px solid #f3c4c4; }
        .pdj-btn-red:hover:not(:disabled)   { background: #fde2e2; }
        .pdj-nav-label {
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            min-width: 84px;
            text-align: center;
        }
        .pdj-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .pdj-level-btn {
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
        .pdj-level-btn:hover { background: #e0e0e0; }
        .pdj-level-btn.active { background: #efe8fb; color: #5b3a9e; border-color: #d3c2f2; }

        /* Saisie d'une phrase perso */
        .pdj-custom-row { display: none; gap: 6px; align-items: center; flex-wrap: wrap; }
        .pdj-custom-row.show { display: flex; }
        .pdj-custom-input {
            flex: 1;
            min-width: 200px;
            padding: 6px 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
        }
        .pdj-custom-input:focus { border-color: #4a90e2; }

        /* Bandeau « enregistrer le corrigé » */
        .pdj-hint {
            display: none;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            font-size: 12px;
            color: #6b4b00;
            background: #fffbea;
            border: 1px solid #f3e1a0;
            border-radius: 8px;
            padding: 6px 10px;
        }
        .pdj-hint.show { display: flex; }
        .pdj-hint input, .pdj-hint select {
            padding: 3px 6px;
            border: 1px solid #e0cf8a;
            border-radius: 6px;
            font-size: 12px;
            outline: none;
            background: #fff;
        }
        .pdj-hint input { width: 120px; }

        /* Barre d'outils d'analyse */
        .pdj-tools {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            align-items: center;
            padding: 6px;
            background: #fafafa;
            border: 1px solid #eee;
            border-radius: 10px;
        }
        .pdj-tool {
            padding: 5px 10px;
            border-radius: 8px;
            border: 2px solid transparent;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            background: var(--tl, #f0f0f0);
            color: var(--tc, #333);
            transition: transform .1s, border-color .15s, box-shadow .15s;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .pdj-tool:hover { transform: translateY(-1px); }
        .pdj-tool.active {
            border-color: var(--tc, #333);
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            transform: scale(1.06);
        }
        .pdj-tool-line { background: #fff; border-color: #e3e3e3; color: #333; }
        .pdj-tool-line .pdj-line {
            display: inline-block;
            width: 18px;
            height: 0;
            border-bottom: 3px solid var(--tc);
        }
        .pdj-tool-line[data-tool="fn:ATT"] .pdj-line { border-bottom-style: dotted; border-bottom-width: 4px; }
        .pdj-tool-line[data-tool="fn:V"] .pdj-line {
            width: 14px;
            height: 9px;
            border: 2px solid var(--tc);
            border-radius: 2px;
        }
        .pdj-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }

        /* Zone de la phrase */
        .pdj-zone {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 16px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: hidden;
        }
        .pdj-phrase {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-weight: 800;
            color: #1f2937;
            line-height: 2.35;
            text-align: center;
            max-width: 100%;
        }
        .pdj-empty { font-size: 16px; color: #9ca3af; font-weight: 600; text-align: center; }
        .pdj-w {
            position: relative;
            padding: 0 .08em;
            border-radius: .15em;
            cursor: pointer;
            transition: background .15s;
        }
        .pdj-w:hover { outline: 2px dashed rgba(74,144,226,.45); outline-offset: 1px; }
        .pdj-w.punct { cursor: default; }
        .pdj-w.punct:hover { outline: none; }
        .pdj-w[data-lbl]::before {
            content: attr(data-lbl);
            position: absolute;
            left: 50%;
            top: -.95em;
            transform: translateX(-50%);
            font-size: .3em;
            font-weight: 800;
            padding: .08em .4em;
            border-radius: .5em;
            background: var(--nc);
            color: #fff;
            white-space: nowrap;
            line-height: 1.3;
            pointer-events: none;
        }
        .pdj-w[data-ok]::after {
            position: absolute;
            right: -.3em;
            bottom: -.05em;
            font-size: .3em;
            width: 1.45em;
            height: 1.45em;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            line-height: 1;
            pointer-events: none;
        }
        .pdj-w[data-ok="1"]::after { content: '✓'; background: #16a34a; }
        .pdj-w[data-ok="0"]::after { content: '✗'; background: #dc2626; }
        .pdj-w.punct { padding: 0; }
        /* Soulignements des fonctions : même bordure sur les mots et les espaces, pour un trait continu */
        .pdj-u-S   { border-bottom: .09em solid  #dc2626; }   /* sujet : rouge */
        .pdj-u-ATT { border-bottom: .11em dotted #dc2626; }   /* attribut : pointillé rouge */
        .pdj-u-COD { border-bottom: .09em solid  #2563eb; }   /* COD : bleu */
        .pdj-u-COI { border-bottom: .09em solid  #16a34a; }   /* COI : vert */
        .pdj-u-CC  { border-bottom: .09em solid  #111827; }   /* CC : noir */
        .pdj-w[class*="pdj-u-"] { border-radius: .15em .15em 0 0; }
        /* Verbe conjugué : encadré en rouge (un seul cadre autour du groupe, ex. « a distribué ») */
        .pdj-u-V { border-top: .07em solid #dc2626; border-bottom: .07em solid #dc2626; }
        .pdj-w.pdj-u-V { border-radius: 0; }
        .pdj-w.pdj-u-V.pdj-g-start { border-left:  .07em solid #dc2626; border-top-left-radius: .18em;  border-bottom-left-radius: .18em; }
        .pdj-w.pdj-u-V.pdj-g-end   { border-right: .07em solid #dc2626; border-top-right-radius: .18em; border-bottom-right-radius: .18em; }
        /* Petite étiquette de fonction sous le premier mot du groupe */
        .pdj-fnlbl {
            position: absolute;
            left: 0;
            top: 100%;
            margin-top: .14em;
            font-size: .26em;
            font-weight: 800;
            padding: .05em .4em;
            border-radius: .45em;
            color: #fff;
            white-space: nowrap;
            line-height: 1.3;
            pointer-events: none;
        }
        .pdj-w.pdj-flash { animation: pdjFlash .7s ease-out; }
        @keyframes pdjFlash { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }

        /* Correction */
        .pdj-corr-bar { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .pdj-corr {
            display: none;
            padding: 8px 12px;
            background: #f0fff4;
            border: 1px solid #b7e4c7;
            border-radius: 10px;
            color: #1a5c32;
            font-size: 17px;
            line-height: 1.45;
        }
        .pdj-corr.show { display: block; }
        .pdj-step { margin: 2px 0; animation: pdjFade .35s ease-out; }
        .pdj-step b { color: #14532d; }
        .pdj-fb-ok { color: #15803d; font-weight: 700; font-size: .85em; }
        .pdj-fb-ko { color: #b91c1c; font-weight: 700; font-size: .85em; }
        .pdj-score {
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #b7e4c7;
            font-weight: 800;
            color: #14532d;
        }
        @keyframes pdjFade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Aide */
        .pdj-help-btn {
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
        .pdj-help-btn:hover { background: #e0e0e0; color: #333; }
        .pdj-help-popup {
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
        .pdj-help-popup.show { display: block; }
        .pdj-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .pdj-help-popup p { margin: 0 0 6px; }
        .pdj-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement */
        .pdj-resize-handle {
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
        .pdj-container:hover .pdj-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Natures ───────────────────────────────────────────────────────────────
// Les adverbes, prépositions, conjonctions et interjections sont regroupés
// dans « Mot invariable ».
const PDJ_NATURES = [
    { k: 'D',  nom: 'Déterminant',    pl: 'Déterminants',     lbl: 'Dét.',  c: '#2563eb', l: '#dbeafe' },
    { k: 'N',  nom: 'Nom',            pl: 'Noms',             lbl: 'Nom',   c: '#dc2626', l: '#fee2e2' },
    { k: 'A',  nom: 'Adjectif',       pl: 'Adjectifs',        lbl: 'Adj.',  c: '#16a34a', l: '#dcfce7' },
    { k: 'V',  nom: 'Verbe',          pl: 'Verbes',           lbl: 'Verbe', c: '#9333ea', l: '#f3e8ff' },
    { k: 'PR', nom: 'Pronom',         pl: 'Pronoms',          lbl: 'Pron.', c: '#d97706', l: '#fef3c7' },
    { k: 'I',  nom: 'Mot invariable', pl: 'Mots invariables', lbl: 'Inv.',  c: '#475569', l: '#e2e8f0',
      aide: 'adverbe, préposition, conjonction ou interjection' }
];
const PDJ_NAT = {};
PDJ_NATURES.forEach(n => { PDJ_NAT[n.k] = n; });
// Anciens codes (adverbe, préposition, conjonction, interjection) → mot invariable
const PDJ_NAT_ALIAS = { ADV: 'I', P: 'I', C: 'I', INT: 'I' };
function _pdjNormNat(k) { return k ? (PDJ_NAT_ALIAS[k] || k) : null; }

// Étapes de correction des natures (par familles)
const PDJ_NAT_STEPS = [
    ['D', 'N'],
    ['A', 'PR'],
    ['V', 'I']
];

// ── Fonctions ─────────────────────────────────────────────────────────────
const PDJ_FONCTIONS = [
    { k: 'V',   nom: 'Verbe conjugué', lbl: 'Verbe',    c: '#dc2626', titre: 'Encadrer le verbe conjugué en rouge' },
    { k: 'S',   nom: 'Sujet',          lbl: 'Sujet',    c: '#dc2626', titre: 'Souligner le sujet en rouge' },
    { k: 'COD', nom: 'COD',            lbl: 'COD',      c: '#2563eb', titre: 'Souligner le complément d\'objet direct en bleu' },
    { k: 'COI', nom: 'COI',            lbl: 'COI',      c: '#16a34a', titre: 'Souligner le complément d\'objet indirect en vert' },
    { k: 'CC',  nom: 'CC',             lbl: 'CC',       c: '#111827', titre: 'Souligner le complément circonstanciel en noir' },
    { k: 'ATT', nom: 'Attribut',       lbl: 'Attribut', c: '#dc2626', titre: 'Souligner l\'attribut du sujet en pointillé rouge' }
];
const PDJ_FN = {};
PDJ_FONCTIONS.forEach(f => { PDJ_FN[f.k] = f; });
const PDJ_COMPL = ['COD', 'COI', 'CC', 'ATT'];
const PDJ_COMPL_LONG = {
    COD: 'complément d\'objet direct',
    COI: 'complément d\'objet indirect',
    CC:  'complément circonstanciel',
    ATT: 'attribut du sujet'
};

const PDJ_TEMPS = ['présent', 'imparfait', 'futur', 'passé composé', 'passé simple'];

const PDJ_LEVELS = {
    '1':     { label: 'Niveau 1',    titre: 'Niveau 1 : présent, phrases simples' },
    '2':     { label: 'Niveau 2',    titre: 'Niveau 2 : autres temps, sujet inversé' },
    '3':     { label: 'Niveau 3',    titre: 'Niveau 3 : passé simple, phrases plus longues' },
    'perso': { label: 'Mes phrases', titre: 'Mes phrases' }
};

const PDJ_STORE_KEY = 'pdj-mes-phrases';

// ── Banque de phrases ─────────────────────────────────────────────────────
// Écriture : mot:NATURE (D, N, A, V, PR, I = mot invariable).
// Groupes : [ ... ] = sujet, { ... } = verbe conjugué,
//           COD[ ... ], COI[ ... ], CC[ ... ], ATT[ ... ] = compléments.
// Un signe de ponctuation n'a pas de nature. Un mot finissant par ' est collé
// au suivant (l', d'…).
const PDJ_BANQUE = {
    '1': [
        ['[Le:D chat:N] {dort:V} CC[sur:I le:D canapé:N] .', 'dormir', 'présent'],
        ['[Mes:D cousins:N] {jouent:V} CC[dans:I le:D jardin:N] .', 'jouer', 'présent'],
        ['[La:D petite:A fille:N] {mange:V} COD[une:D pomme:N rouge:A] .', 'manger', 'présent'],
        ['[Tom:N] {lit:V} COD[un:D livre:N passionnant:A] .', 'lire', 'présent'],
        ['[Les:D oiseaux:N] {chantent:V} CC[le:D matin:N] .', 'chanter', 'présent'],
        ['[Nous:PR] {préparons:V} COD[un:D gâteau:N] .', 'préparer', 'présent'],
        ['[Le:D boulanger:N] {vend:V} COD[du:D pain:N frais:A] .', 'vendre', 'présent'],
        ['[Ma:D sœur:N] {regarde:V} COD[la:D lune:N] .', 'regarder', 'présent'],
        ['[Le:D chien:N] {court:V} CC[vite:I] .', 'courir', 'présent'],
        ['[Les:D enfants:N] {traversent:V} COD[la:D rue:N] CC[prudemment:I] .', 'traverser', 'présent'],
        ['[Vous:PR] {chantez:V} COD[une:D jolie:A chanson:N] .', 'chanter', 'présent'],
        ['[Le:D vent:N] {souffle:V} CC[fort:I] .', 'souffler', 'présent'],
        ['[Le:D ciel:N] {est:V} ATT[bleu:A] .', 'être', 'présent'],
        ['[Léa:N] {parle:V} COI[à:I sa:D grand-mère:N] .', 'parler', 'présent']
    ],
    '2': [
        ['CC[Demain:I] , [nous:PR] {partirons:V} CC[en:I vacances:N] .', 'partir', 'futur'],
        ['[Les:D élèves:N] {écoutaient:V} CC[attentivement:I] COD[la:D maîtresse:N] .', 'écouter', 'imparfait'],
        ['CC[Dans:I la:D forêt:N] , [un:D renard:N roux:A] {chassait:V} .', 'chasser', 'imparfait'],
        ['[Le:D facteur:N] {a:V distribué:V} COD[les:D lettres:N] .', 'distribuer', 'passé composé'],
        ['[Pierre:N et:I Julie:N] {construisent:V} COD[une:D cabane:N] .', 'construire', 'présent'],
        ['[Elle:PR] {range:V} COD[sa:D chambre:N et:I ses:D jouets:N] .', 'ranger', 'présent'],
        ['CC[Chaque:D soir:N] , [mon:D grand-père:N] {raconte:V} COD[une:D histoire:N] .', 'raconter', 'présent'],
        ['[Le:D gros:A camion:N] {transportera:V} COD[du:D sable:N] .', 'transporter', 'futur'],
        ['[Tu:PR] {as:V oublié:V} COD[ton:D cahier:N] .', 'oublier', 'passé composé'],
        ['CC[Sous:I le:D pont:N] {coule:V} [une:D rivière:N] .', 'couler', 'présent'],
        ['[Les:D vieilles:A maisons:N] {étaient:V} ATT[très:I belles:A] .', 'être', 'imparfait'],
        ['[Mon:D frère:N] COD[la:PR] {regarde:V} CC[attentivement:I] .', 'regarder', 'présent'],
        ['[Le:D chien:N] {obéit:V} COI[à:I son:D maître:N] .', 'obéir', 'présent'],
        ['Oh:I ! [Le:D bébé:N] {dort:V} CC[paisiblement:I] .', 'dormir', 'présent']
    ],
    '3': [
        ['CC[En:I automne:N] , [les:D hirondelles:N] {partent:V} CC[vers:I l\':D Afrique:N] .', 'partir', 'présent'],
        ['[Le:D chevalier:N courageux:A] {combattit:V} COD[le:D dragon:N] .', 'combattre', 'passé simple'],
        ['[Les:D explorateurs:N] {découvrirent:V} COD[une:D île:N mystérieuse:A] .', 'découvrir', 'passé simple'],
        ['CC[Soudain:I] , [un:D bruit:N étrange:A] {retentissait:V} CC[dans:I la:D maison:N] .', 'retentir', 'imparfait'],
        ['[Le:D jardinier:N] {arrose:V} COD[les:D fleurs:N] CC[avec:I soin:N] .', 'arroser', 'présent'],
        ['[Ma:D voisine:N et:I son:D chien:N] se:PR {promènent:V} CC[sur:I la:D plage:N] .', 'se promener', 'présent'],
        ['[Nous:PR] {avons:V visité:V} COD[un:D musée:N magnifique:A] .', 'visiter', 'passé composé'],
        ['CC[Dans:I le:D ciel:N] {brillaient:V} [des:D milliers:N d\':I étoiles:N] .', 'briller', 'imparfait'],
        ['[Le:D peintre:N] {mélangeait:V} CC[lentement:I] COD[ses:D couleurs:N vives:A] .', 'mélanger', 'imparfait'],
        ['[Les:D pompiers:N] {éteignirent:V} CC[rapidement:I] COD[l\':D incendie:N] .', 'éteindre', 'passé simple'],
        ['[On:PR] {entendra:V} CC[bientôt:I] COD[le:D tonnerre:N] .', 'entendre', 'futur'],
        ['[Cette:D vieille:A horloge:N] {sonne:V} CC[chaque:D heure:N] .', 'sonner', 'présent'],
        ['[Mes:D parents:N] {semblaient:V} ATT[fatigués:A] CC[après:I le:D voyage:N] .', 'sembler', 'imparfait'],
        ['[Julie:N] {a:V téléphoné:V} COI[à:I ses:D cousins:N] CC[hier:I] .', 'téléphoner', 'passé composé']
    ]
};

// Transforme une phrase codée en { tokens, sol }
// sol.nat[i] = nature du mot i, sol.fn[i] = fonction du groupe auquel il appartient
function _pdjParse(code, inf, temps) {
    const tokens = [];
    const sol = { nat: [], fn: [], inf: inf || '', temps: temps || '' };
    let curFn = null;
    code.trim().split(/\s+/).forEach(raw => {
        let s = raw, m;
        for (;;) {
            if (s[0] === '[')      { curFn = 'S'; s = s.slice(1); }
            else if (s[0] === '{') { curFn = 'V'; s = s.slice(1); }
            else if ((m = s.match(/^(COD|COI|CC|ATT)\[/))) { curFn = m[1]; s = s.slice(m[0].length); }
            else break;
        }
        let close = false;
        while (s.length && /[\]}]$/.test(s)) { close = true; s = s.slice(0, -1); }
        const c = s.lastIndexOf(':');
        const i = tokens.length;
        if (c > 0) {
            const t = s.slice(0, c);
            tokens.push({ t, p: false, glue: /'$/.test(t) });
            sol.nat[i] = _pdjNormNat(s.slice(c + 1));
            sol.fn[i]  = curFn;
        } else {
            tokens.push({ t: s, p: true, glue: false });
            sol.nat[i] = null;
            sol.fn[i]  = null;
        }
        if (close) curFn = null;
    });
    return { tokens, sol };
}

// Met un corrigé enregistré avec une ancienne version au format actuel
// (natures regroupées, soulignements verbe / sujet → fonctions)
function _pdjNormSol(sol, n) {
    if (!sol) return null;
    const nat = [], fn = [];
    for (let i = 0; i < n; i++) {
        nat[i] = _pdjNormNat(sol.nat ? sol.nat[i] : null);
        fn[i]  = Array.isArray(sol.fn) ? (sol.fn[i] || null) : null;
    }
    if (!Array.isArray(sol.fn)) {
        (sol.sujet || []).forEach(i => { if (i < n) fn[i] = 'S'; });
        (sol.verbe || []).forEach(i => { if (i < n) fn[i] = 'V'; });
    }
    return { nat, fn, inf: sol.inf || '', temps: sol.temps || '' };
}

// Découpe une phrase tapée par l'enseignant
function _pdjTokenize(text) {
    const t = (text || '')
        .replace(/[’`]/g, "'")
        .replace(/([.,!?;:…()«»"])/g, ' $1 ')
        .replace(/'/g, "' ")
        .trim();
    if (!t) return [];
    return t.split(/\s+/).map(w => {
        const p = /^[.,!?;:…()«»"]+$/.test(w);
        return { t: w, p, glue: !p && /'$/.test(w) };
    });
}

let _pdjParsed = null;
function _pdjBanque(level) {
    if (!_pdjParsed) {
        _pdjParsed = {};
        Object.keys(PDJ_BANQUE).forEach(lv => {
            _pdjParsed[lv] = PDJ_BANQUE[lv].map(a => _pdjParse(a[0], a[1], a[2]));
        });
    }
    return _pdjParsed[level] || [];
}

function _pdjLoadMes() {
    try {
        const a = JSON.parse(localStorage.getItem(PDJ_STORE_KEY) || '[]');
        if (!Array.isArray(a)) return [];
        return a.filter(p => p && Array.isArray(p.tokens))
                .map(p => ({ tokens: p.tokens, sol: _pdjNormSol(p.sol, p.tokens.length) }));
    } catch (e) { return []; }
}
function _pdjSaveMes(list) {
    try { localStorage.setItem(PDJ_STORE_KEY, JSON.stringify(list)); } catch (e) {}
}

function _pdjDayOfYear() {
    const d = new Date();
    return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
}

// Téléphone (même détection que les autres jeux et activités)
function _pdjIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createPhraseDuJourWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'phrase-du-jour';
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
    container.className = 'pdj-container';

    // Taille initiale : 75 % de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'pdj-header';
    header.innerHTML = `
        <span class="pdj-title">📝 La phrase du jour</span>
        <span class="pdj-badge">Niveau 1</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.pdj-badge');
    container.appendChild(header);

    // ── Contrôles : navigation, phrase du jour, hasard, ma phrase, niveaux ──
    const controls = document.createElement('div');
    controls.className = 'pdj-controls';
    controls.innerHTML = `
        <button class="pdj-btn pdj-btn-grey" data-act="prev" title="Phrase précédente">◀</button>
        <span class="pdj-nav-label"></span>
        <button class="pdj-btn pdj-btn-grey" data-act="next" title="Phrase suivante">▶</button>
        <button class="pdj-btn pdj-btn-blue" data-act="today" title="La phrase choisie pour aujourd'hui">📅 Phrase du jour</button>
        <button class="pdj-btn pdj-btn-grey" data-act="random">🎲 Au hasard</button>
        <button class="pdj-btn pdj-btn-grey" data-act="custom" title="Écrire votre propre phrase">✏️ Ma phrase</button>
        <button class="pdj-btn pdj-btn-red" data-act="delete" title="Supprimer cette phrase de « Mes phrases »" style="display:none">🗑 Supprimer</button>
        <div class="pdj-level-btns">
            <button class="pdj-level-btn" data-level="1" title="${PDJ_LEVELS['1'].titre}">Niveau 1</button>
            <button class="pdj-level-btn" data-level="2" title="${PDJ_LEVELS['2'].titre}">Niveau 2</button>
            <button class="pdj-level-btn" data-level="3" title="${PDJ_LEVELS['3'].titre}">Niveau 3</button>
            <button class="pdj-level-btn" data-level="perso" title="Les phrases que vous avez écrites">⭐ Mes phrases</button>
        </div>
    `;
    const navLabel = controls.querySelector('.pdj-nav-label');
    const prevBtn  = controls.querySelector('[data-act="prev"]');
    const nextBtn  = controls.querySelector('[data-act="next"]');
    const delBtn   = controls.querySelector('[data-act="delete"]');
    container.appendChild(controls);

    // ── Saisie d'une phrase perso ─────────────────────────────────────────
    const customRow = document.createElement('div');
    customRow.className = 'pdj-custom-row';
    customRow.innerHTML = `
        <input class="pdj-custom-input" type="text" maxlength="200" placeholder="Écrivez votre phrase, par exemple : Le petit chat noir dort au soleil." spellcheck="true" autocomplete="off">
        <button class="pdj-btn pdj-btn-blue" data-act="custom-ok">✓ Afficher</button>
        <button class="pdj-btn pdj-btn-grey" data-act="custom-cancel">Annuler</button>
    `;
    const customInput = customRow.querySelector('.pdj-custom-input');
    container.appendChild(customRow);

    // ── Bandeau « enregistrer le corrigé » (phrase perso en cours) ────────
    const hint = document.createElement('div');
    hint.className = 'pdj-hint';
    hint.innerHTML = `
        <span>✏️ Analysez la phrase (natures, verbe, sujet), puis enregistrez-la comme corrigé.</span>
        <label>Infinitif <input type="text" data-role="inf" placeholder="facultatif" autocomplete="off"></label>
        <label>Temps
            <select data-role="temps">
                <option value="">—</option>
                ${PDJ_TEMPS.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
        </label>
        <button class="pdj-btn pdj-btn-green" data-act="save-sol">💾 Enregistrer le corrigé</button>
    `;
    const hintInf   = hint.querySelector('[data-role="inf"]');
    const hintTemps = hint.querySelector('[data-role="temps"]');
    container.appendChild(hint);

    // ── Barre d'outils d'analyse ──────────────────────────────────────────
    const tools = document.createElement('div');
    tools.className = 'pdj-tools';
    tools.innerHTML =
        PDJ_NATURES.map(n =>
            `<button class="pdj-tool" data-tool="${n.k}" style="--tc:${n.c};--tl:${n.l}" title="Colorer en ${n.nom.toLowerCase()}${n.aide ? ' (' + n.aide + ')' : ''}">${n.nom}</button>`
        ).join('') +
        `<span class="pdj-sep"></span>` +
        PDJ_FONCTIONS.map(f =>
            `<button class="pdj-tool pdj-tool-line" data-tool="fn:${f.k}" style="--tc:${f.c}" title="${f.titre}"><span class="pdj-line"></span>${f.nom}</button>`
        ).join('') +
        `<button class="pdj-tool pdj-tool-line" data-tool="gomme" style="--tc:#6b7280" title="Effacer les marques d'un mot">🧽 Gomme</button>
         <span class="pdj-sep"></span>
         <button class="pdj-btn pdj-btn-grey" data-act="clear" title="Effacer toutes les marques">🧹 Tout effacer</button>`;
    container.appendChild(tools);

    // ── Zone de la phrase ─────────────────────────────────────────────────
    const zone = document.createElement('div');
    zone.className = 'pdj-zone';
    zone.style.height = Math.round(initH * 0.36) + 'px';
    const phraseEl = document.createElement('div');
    phraseEl.className = 'pdj-phrase';
    zone.appendChild(phraseEl);
    container.appendChild(zone);

    // ── Correction ────────────────────────────────────────────────────────
    const corrBar = document.createElement('div');
    corrBar.className = 'pdj-corr-bar';
    corrBar.innerHTML = `
        <button class="pdj-btn pdj-btn-green" data-act="step">▶ Correction</button>
        <button class="pdj-btn pdj-btn-grey" data-act="all">⏭ Tout corriger</button>
        <button class="pdj-btn pdj-btn-grey" data-act="hide">🙈 Cacher la correction</button>
    `;
    const stepBtn = corrBar.querySelector('[data-act="step"]');
    const allBtn  = corrBar.querySelector('[data-act="all"]');
    const hideBtn = corrBar.querySelector('[data-act="hide"]');
    container.appendChild(corrBar);

    const corrPanel = document.createElement('div');
    corrPanel.className = 'pdj-corr';
    container.appendChild(corrPanel);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'pdj-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'pdj-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La phrase du jour</h4>
        <p><b>Natures</b> : choisissez un outil (<b>Nom</b>, <b>Verbe</b>, <b>Mot invariable</b>…), puis
        cliquez sur les mots pour les colorer. Un nouveau clic avec le même outil retire la couleur.
        <b>Mot invariable</b> regroupe les adverbes, prépositions, conjonctions et interjections.</p>
        <p><b>Fonctions</b> : le <b>verbe conjugué</b> est encadré en rouge, le <b>sujet</b> souligné en rouge,
        l'<b>attribut</b> en pointillé rouge, le <b>COD</b> en bleu, le <b>COI</b> en vert et les
        <b>CC</b> (compléments circonstanciels) en noir. Cliquez sur chaque mot du groupe. La <b>Gomme</b> efface les marques d'un mot.</p>
        <p><b>▶ Correction</b> dévoile la correction étape par étape : le verbe, son infinitif et son temps,
        le sujet, les compléments, puis les natures par familles. Chaque mot reçoit ✓ ou ✗ selon la réponse de la classe.</p>
        <p><b>📅 Phrase du jour</b> choisit une phrase différente chaque jour. Les niveaux vont du présent
        (niveau 1) au passé simple et aux sujets inversés (niveaux 2 et 3).</p>
        <p><b>✏️ Ma phrase</b> : écrivez votre phrase, analysez-la vous-même puis cliquez sur
        <b>Enregistrer le corrigé</b>. Elle est rangée dans <b>⭐ Mes phrases</b> (dans ce navigateur).</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'pdj-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let level = '1';
    let idx = 0;
    let cur = null;          // { tokens, sol } (sol = null pour une phrase perso non corrigée)
    let isDraft = false;     // phrase perso en cours d'écriture du corrigé
    let marks = { nat: {}, fn: {} };   // réponses de la classe : nature et fonction par mot
    let step = 0;            // nombre d'étapes de correction dévoilées
    let tool = 'N';
    let mesPhrases = _pdjLoadMes();

    function getList(lv) {
        return lv === 'perso' ? mesPhrases : _pdjBanque(lv);
    }

    function resetMarks() {
        marks = { nat: {}, fn: {} };
        step = 0;
    }

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Choix de la phrase ────────────────────────────────────────────────
    function loadPhrase(lv, i, keep) {
        level = String(lv);
        const list = getList(level);
        isDraft = false;
        if (!list.length) {
            cur = null; idx = 0;
        } else {
            const n = list.length;
            idx = ((i % n) + n) % n;
            cur = list[idx];
        }
        if (!keep) resetMarks();
        renderAll();
    }

    // ── Outils pour la correction ─────────────────────────────────────────
    // Groupes consécutifs d'une même fonction (la ponctuation coupe les groupes)
    function groupsOf(fnArr, codes) {
        const groups = [];
        let g = null;
        cur.tokens.forEach((t, i) => {
            const f = t.p ? null : fnArr[i];
            if (!f || !codes.includes(f)) { g = null; return; }
            if (g && g.fn === f && g.last === i - 1) { g.idx.push(i); g.last = i; return; }
            g = { fn: f, idx: [i], last: i };
            groups.push(g);
        });
        return groups;
    }
    function wordsOf(list) {
        return list.slice().sort((a, b) => a - b).map(i => cur.tokens[i].t).join(' ').replace(/' /g, "'");
    }
    function solFnArr() { return cur.sol.fn; }
    function markFnArr() { return cur.tokens.map((t, i) => marks.fn[i] || null); }
    // Compare les fonctions de la classe et du corrigé pour une liste de codes.
    // Renvoie null si la classe n'a rien souligné dans ces fonctions.
    function compareFn(codes) {
        const sf = solFnArr(), mf = markFnArr();
        if (!mf.some(f => f && codes.includes(f))) return null;
        let ok = 0, tot = 0;
        cur.tokens.forEach((t, i) => {
            if (t.p) return;
            const a = sf[i] && codes.includes(sf[i]) ? sf[i] : null;
            const b = mf[i] && codes.includes(mf[i]) ? mf[i] : null;
            if (!a && !b) return;
            tot++;
            if (a === b) ok++;
        });
        return { ok, tot };
    }

    function getSteps() {
        if (!cur || !cur.sol) return [];
        const sol = cur.sol;
        const has = k => sol.fn.some(f => f === k);
        const steps = [];
        if (has('V')) steps.push({ id: 'verbe', fns: ['V'] });
        if (sol.inf || sol.temps) steps.push({ id: 'infos' });
        if (has('S')) steps.push({ id: 'sujet', fns: ['S'] });
        if (has('V') || has('S') || PDJ_COMPL.some(has)) steps.push({ id: 'comp', fns: PDJ_COMPL });
        PDJ_NAT_STEPS.forEach((nats, k) => {
            const present = nats.filter(n => sol.nat.some(x => x === n));
            if (present.length) steps.push({ id: 'nat' + k, nats: present });
        });
        return steps;
    }

    function revealedInfo() {
        const steps = getSteps();
        const done = steps.slice(0, step);
        const ids = new Set(done.map(s => s.id));
        const nats = new Set(), fns = new Set();
        done.forEach(s => {
            if (s.nats) s.nats.forEach(n => nats.add(n));
            if (s.fns)  s.fns.forEach(f => fns.add(f));
        });
        return { steps, ids, nats, fns };
    }

    // ── Rendu de la phrase ────────────────────────────────────────────────
    let lastRevealed = new Set();

    function renderPhrase(flashNew) {
        phraseEl.innerHTML = '';
        if (!cur) {
            const e = document.createElement('div');
            e.className = 'pdj-empty';
            e.textContent = level === 'perso'
                ? 'Aucune phrase enregistrée : cliquez sur ✏️ Ma phrase pour en écrire une.'
                : 'Aucune phrase.';
            phraseEl.appendChild(e);
            return;
        }
        const sol = cur.sol;
        const rev = revealedInfo();
        const nowRevealed = new Set();

        // Fonction affichée pour chaque mot : celle du corrigé si elle est dévoilée,
        // sinon celle de la classe (effacée si sa catégorie est déjà corrigée)
        const fnShown = cur.tokens.map((t, i) => {
            if (t.p) return null;
            const sv = sol ? sol.fn[i] : null;
            const m  = marks.fn[i] || null;
            if (sv && rev.fns.has(sv)) { nowRevealed.add(i); return sv; }
            if (m && rev.fns.has(m)) return null;
            return m;
        });

        cur.tokens.forEach((tok, i) => {
            // Espace avant le mot
            if (i > 0) {
                const prev = cur.tokens[i - 1];
                const noSpace = prev.glue || (tok.p && /^[.,…)]$/.test(tok.t)) || prev.t === '(';
                if (!noSpace) {
                    const gap = document.createElement('span');
                    gap.textContent = ' ';
                    if (fnShown[i - 1] && fnShown[i - 1] === fnShown[i]) gap.className = 'pdj-u-' + fnShown[i];
                    phraseEl.appendChild(gap);
                }
            }

            const w = document.createElement('span');
            w.className = 'pdj-w';
            w.textContent = tok.t;
            if (tok.p) {
                w.classList.add('punct');
                phraseEl.appendChild(w);
                return;
            }
            w.dataset.i = i;

            // Fonction : soulignement + étiquette sous le premier mot du groupe
            const f = fnShown[i];
            if (f && PDJ_FN[f]) {
                w.classList.add('pdj-u-' + f);
                const prevFn = (i > 0 && !cur.tokens[i - 1].p) ? fnShown[i - 1] : null;
                const nextFn = (i + 1 < cur.tokens.length && !cur.tokens[i + 1].p) ? fnShown[i + 1] : null;
                if (prevFn !== f) w.classList.add('pdj-g-start');
                if (nextFn !== f) w.classList.add('pdj-g-end');
                if (prevFn !== f) {
                    const lb = document.createElement('span');
                    lb.className = 'pdj-fnlbl';
                    lb.textContent = PDJ_FN[f].lbl;
                    lb.style.background = PDJ_FN[f].c;
                    w.appendChild(lb);
                }
            }

            // Nature affichée : celle de la correction si sa famille est dévoilée
            const solN = sol ? sol.nat[i] : null;
            const mine = marks.nat[i];
            let shown = mine;
            if (solN && rev.nats.has(solN)) {
                shown = solN;
                nowRevealed.add(i);
                if (mine) w.dataset.ok = mine === solN ? '1' : '0';
            }
            if (shown && PDJ_NAT[shown]) {
                const n = PDJ_NAT[shown];
                w.style.setProperty('--nc', n.c);
                w.style.background = n.l;
                w.style.color = n.c;
                w.dataset.lbl = n.lbl;
            }
            if (flashNew && nowRevealed.has(i) && !lastRevealed.has(i)) w.classList.add('pdj-flash');
            phraseEl.appendChild(w);
        });
        lastRevealed = nowRevealed;
    }

    // ── Rendu de la correction ────────────────────────────────────────────
    function feedback(ok, msgOk, msgKo) {
        return ok
            ? ` <span class="pdj-fb-ok">✓ ${msgOk}</span>`
            : ` <span class="pdj-fb-ko">✗ ${msgKo}</span>`;
    }
    function fnFeedback(codes) {
        const r = compareFn(codes);
        if (!r) return '';
        if (r.ok === r.tot) return feedback(true, 'bien trouvé !', '');
        return feedback(false, '', `${r.ok} / ${r.tot} mots bien soulignés`);
    }
    function fnName(k) {
        return `<span style="color:${PDJ_FN[k].c}"><b>${PDJ_FN[k].lbl}</b></span>`;
    }

    function renderCorr() {
        const steps = getSteps();
        const hasSol = !!(cur && cur.sol && steps.length);
        stepBtn.disabled = !hasSol || step >= steps.length;
        allBtn.disabled  = !hasSol || step >= steps.length;
        hideBtn.disabled = step === 0;
        if (!hasSol) {
            stepBtn.textContent = isDraft ? '▶ Correction (enregistrez d\'abord le corrigé)' : '▶ Correction';
        } else if (step >= steps.length) {
            stepBtn.textContent = '✅ Correction terminée';
        } else {
            stepBtn.textContent = `▶ Correction : étape ${step + 1} / ${steps.length}`;
        }

        if (!hasSol || step === 0) {
            corrPanel.classList.remove('show');
            corrPanel.innerHTML = '';
            return;
        }
        const sol = cur.sol;
        let html = '';
        steps.slice(0, step).forEach(s => {
            if (s.id === 'verbe') {
                const g = groupsOf(sol.fn, ['V']).map(x => '« ' + wordsOf(x.idx) + ' »').join(' et ');
                html += `<div class="pdj-step">🟥 <b>Le verbe conjugué</b> (encadré en rouge) <b>:</b> ${g}${fnFeedback(['V'])}</div>`;
            } else if (s.id === 'infos') {
                const parts = [];
                if (sol.inf)   parts.push(`<b>Infinitif :</b> ${sol.inf}`);
                if (sol.temps) parts.push(`<b>Temps :</b> ${sol.temps}`);
                html += `<div class="pdj-step">📘 ${parts.join(' — ')}</div>`;
            } else if (s.id === 'sujet') {
                const g = groupsOf(sol.fn, ['S']).map(x => '« ' + wordsOf(x.idx) + ' »').join(' et ');
                html += `<div class="pdj-step">🔴 <b>Le sujet</b> (souligné en rouge) <b>:</b> ${g} : c'est lui qui commande l'accord du verbe.${fnFeedback(['S'])}</div>`;
            } else if (s.id === 'comp') {
                const gs = groupsOf(sol.fn, PDJ_COMPL);
                if (!gs.length) {
                    html += `<div class="pdj-step">🧩 <b>Les compléments :</b> pas de COD, de COI, de CC ni d'attribut dans cette phrase.${fnFeedback(PDJ_COMPL)}</div>`;
                } else {
                    const lines = gs.map(x => `${fnName(x.fn)} <span style="font-size:.85em;color:#4b5563">(${PDJ_COMPL_LONG[x.fn]})</span> : « ${wordsOf(x.idx)} »`);
                    html += `<div class="pdj-step">🧩 <b>Les compléments :</b> ${lines.join(' &nbsp;·&nbsp; ')}${fnFeedback(PDJ_COMPL)}</div>`;
                }
            } else if (s.nats) {
                const lines = s.nats.map(k => {
                    const ws = [];
                    sol.nat.forEach((n, i) => { if (n === k) ws.push('« ' + cur.tokens[i].t + ' »'); });
                    return `<span style="color:${PDJ_NAT[k].c}"><b>${PDJ_NAT[k].pl} :</b></span> ${ws.join(', ')}`;
                });
                let ok = 0, tot = 0;
                sol.nat.forEach((n, i) => {
                    if (n && s.nats.includes(n) && marks.nat[i]) { tot++; if (marks.nat[i] === n) ok++; }
                });
                html += `<div class="pdj-step">🏷️ ${lines.join(' &nbsp;·&nbsp; ')}`;
                if (tot) html += feedback(ok === tot, `${ok} / ${tot}`, `${ok} / ${tot} mots justes`);
                html += `</div>`;
            }
        });
        if (step >= steps.length) {
            let ok = 0, total = 0;
            sol.nat.forEach((n, i) => {
                if (!n) return;
                total++;
                if (marks.nat[i] === n) ok++;
            });
            const bits = [];
            if (total && Object.keys(marks.nat).length) bits.push(`${ok} / ${total} natures justes`);
            const allFn = PDJ_FONCTIONS.map(f => f.k);
            const r = compareFn(allFn);
            if (r) bits.push(`${r.ok} / ${r.tot} mots bien soulignés`);
            if (bits.length) html += `<div class="pdj-score">🏅 Bilan : ${bits.join(' · ')}</div>`;
            else html += `<div class="pdj-score">✅ Correction terminée</div>`;
        }
        corrPanel.innerHTML = html;
        corrPanel.classList.add('show');
    }

    // ── Rendu général ─────────────────────────────────────────────────────
    function renderHeader() {
        const list = getList(level);
        if (isDraft) navLabel.textContent = 'Nouvelle phrase';
        else if (!cur) navLabel.textContent = 'Aucune phrase';
        else navLabel.textContent = `Phrase ${idx + 1} / ${list.length}`;
        prevBtn.disabled = isDraft || list.length < 2;
        nextBtn.disabled = isDraft || list.length < 2;
        badge.textContent = isDraft ? 'Ma phrase' : PDJ_LEVELS[level].label;
        controls.querySelectorAll('.pdj-level-btn').forEach(b => {
            b.classList.toggle('active', !isDraft && b.dataset.level === level);
        });
        delBtn.style.display = (level === 'perso' && !isDraft && cur) ? '' : 'none';
        hint.classList.toggle('show', isDraft);
        tools.querySelectorAll('.pdj-tool').forEach(b => {
            b.classList.toggle('active', b.dataset.tool === tool);
        });
    }

    function renderAll(flashNew) {
        renderHeader();
        renderPhrase(flashNew);
        renderCorr();
        requestAnimationFrame(fitPhrase);
    }

    // ── Taille de la phrase selon la place disponible ─────────────────────
    function fitPhrase() {
        const zw = zone.clientWidth - 32;
        const zh = zone.clientHeight - 16;
        if (zw <= 0 || zh <= 0) return;
        if (!cur) { phraseEl.style.fontSize = ''; return; }
        let size = Math.max(16, Math.min(zh * 0.42, zw * 0.12));
        phraseEl.style.fontSize = size + 'px';
        let guard = 0;
        while ((phraseEl.scrollHeight > zh || phraseEl.scrollWidth > zw) && size > 14 && guard++ < 80) {
            size *= 0.93;
            phraseEl.style.fontSize = size + 'px';
        }
    }

    // ── Clic sur un mot ───────────────────────────────────────────────────
    function isValidTool(t) {
        return !!(PDJ_NAT[t] || t === 'gomme' || (/^fn:/.test(t) && PDJ_FN[t.slice(3)]));
    }
    function applyTool(i) {
        if (!cur || cur.tokens[i].p) return;
        if (PDJ_NAT[tool]) {
            if (marks.nat[i] === tool) delete marks.nat[i];
            else marks.nat[i] = tool;
        } else if (/^fn:/.test(tool)) {
            const f = tool.slice(3);
            if (marks.fn[i] === f) delete marks.fn[i];
            else marks.fn[i] = f;
        } else if (tool === 'gomme') {
            delete marks.nat[i];
            delete marks.fn[i];
        }
        renderPhrase(false);
        renderCorr();
        requestAnimationFrame(fitPhrase);
        save();
    }

    phraseEl.addEventListener('click', (e) => {
        const w = e.target.closest('.pdj-w');
        if (!w || w.dataset.i === undefined) return;
        e.stopPropagation();
        applyTool(parseInt(w.dataset.i, 10));
    });

    // Les clics dans la phrase, les outils et les champs ne déplacent pas le widget
    [zone, tools, customRow, hint, corrBar, corrPanel].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    // ── Phrase perso ──────────────────────────────────────────────────────
    function openCustom() {
        customRow.classList.add('show');
        customInput.value = '';
        setTimeout(() => customInput.focus(), 30);
    }
    function closeCustom() {
        customRow.classList.remove('show');
    }
    function validateCustom() {
        const tokens = _pdjTokenize(customInput.value);
        if (!tokens.some(t => !t.p)) { customInput.focus(); return; }
        cur = { tokens, sol: null };
        isDraft = true;
        hintInf.value = '';
        hintTemps.value = '';
        resetMarks();
        closeCustom();
        renderAll();
        save();
    }
    function saveSolution() {
        if (!isDraft || !cur) return;
        const sol = {
            nat:   cur.tokens.map((t, i) => t.p ? null : (marks.nat[i] || null)),
            fn:    cur.tokens.map((t, i) => t.p ? null : (marks.fn[i] || null)),
            inf:   hintInf.value.trim(),
            temps: hintTemps.value
        };
        mesPhrases = _pdjLoadMes();
        mesPhrases.push({ tokens: cur.tokens, sol });
        _pdjSaveMes(mesPhrases);
        loadPhrase('perso', mesPhrases.length - 1);
        save();
    }
    async function deleteCurrent() {
        if (level !== 'perso' || !cur || isDraft) return;
        let ok;
        if (typeof modalConfirm === 'function') ok = await modalConfirm('Supprimer cette phrase ?', 'Elle sera retirée de « Mes phrases ».');
        else ok = window.confirm('Supprimer cette phrase de « Mes phrases » ?');
        if (!ok) return;
        mesPhrases = _pdjLoadMes();
        mesPhrases.splice(idx, 1);
        _pdjSaveMes(mesPhrases);
        loadPhrase('perso', Math.max(0, idx - 1));
        save();
    }

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-level],[data-tool]');
        if (!b || !container.contains(b)) return;
        if (b.dataset.tool) {
            tool = b.dataset.tool;
            renderHeader();
            save();
            return;
        }
        if (b.dataset.level) {
            mesPhrases = _pdjLoadMes();
            closeCustom();
            loadPhrase(b.dataset.level, b.dataset.level === level && !isDraft ? idx : 0);
            save();
            return;
        }
        switch (b.dataset.act) {
            case 'prev':   loadPhrase(level, idx - 1); save(); break;
            case 'next':   loadPhrase(level, idx + 1); save(); break;
            case 'today': {
                const lv = (level === 'perso' && !mesPhrases.length) || isDraft ? '1' : level;
                const n = getList(lv).length || 1;
                loadPhrase(lv, _pdjDayOfYear() % n);
                save();
                break;
            }
            case 'random': {
                const lv = isDraft ? '1' : level;
                const n = getList(lv).length;
                if (n > 1) {
                    let r;
                    do { r = Math.floor(Math.random() * n); } while (r === idx && lv === level);
                    loadPhrase(lv, r);
                } else loadPhrase(lv, 0);
                save();
                break;
            }
            case 'custom':        openCustom(); break;
            case 'custom-ok':     validateCustom(); break;
            case 'custom-cancel': closeCustom(); break;
            case 'save-sol':      saveSolution(); break;
            case 'delete':        deleteCurrent(); break;
            case 'clear':
                marks = { nat: {}, fn: {} };
                renderAll();
                save();
                break;
            case 'step': {
                const steps = getSteps();
                if (step < steps.length) { step++; renderAll(true); save(); }
                break;
            }
            case 'all': {
                step = getSteps().length;
                renderAll(true);
                save();
                break;
            }
            case 'hide':
                step = 0;
                renderAll();
                save();
                break;
        }
    });

    // Champs texte : le clavier ne doit pas agir sur le tableau
    [customInput, hintInf].forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                if (inp === customInput) validateCustom();
                else saveSolution();
            }
            if (e.key === 'Escape' && inp === customInput) closeCustom();
        });
        inp.addEventListener('click', (e) => { e.stopPropagation(); inp.focus(); });
    });
    hintTemps.addEventListener('keydown', (e) => e.stopPropagation());

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la zone de la phrase) ──
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = zone.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(420, startW + ev.clientX - startX) + 'px';
            zone.style.height     = Math.max(70,  startH + ev.clientY - startY) + 'px';
            fitPhrase();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = zone.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width = Math.max(420, startW + t.clientX - startX) + 'px';
            zone.style.height     = Math.max(70,  startH + t.clientY - startY) + 'px';
            fitPhrase();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); return; }
        fitPhrase();
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
            window._wfMiniBarCollapse(widget, '📝 La phrase du jour', {
                onExpand: () => requestAnimationFrame(fitPhrase)
            });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(fitPhrase);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = zone.style.height;
            container.classList.add('wf-fullboard');
            zone.style.height = Math.round(window.innerHeight * 0.42) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) zone.style.height = _savedH;
        }
        requestAnimationFrame(fitPhrase);
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

    // Au départ : la phrase du jour du niveau 1
    loadPhrase('1', _pdjDayOfYear() % _pdjBanque('1').length);

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._pdjGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        zoneH:      _isMax ? (parseFloat(_savedH) || zone.offsetHeight)     : zone.offsetHeight,
        level, idx,
        draft:  isDraft && cur ? { tokens: cur.tokens, inf: hintInf.value, temps: hintTemps.value } : null,
        marks:  { nat: Object.assign({}, marks.nat), fn: Object.assign({}, marks.fn) },
        step, tool,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    // (si le widget est restauré ensuite via _pdjSetData, on referme ce plein écran automatique)
    if (_pdjIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._pdjSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        // Sur téléphone, le widget reste en plein écran (bouton vert) après une actualisation
        const toPhoneFull = () => {
            if (_pdjIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.zoneH)      zone.style.height     = d.zoneH + 'px';
        // Anciens noms d'outils : 'verbe' / 'sujet' et natures regroupées
        let t = d.tool === 'verbe' ? 'fn:V' : d.tool === 'sujet' ? 'fn:S' : _pdjNormNat(d.tool);
        if (t && isValidTool(t)) tool = t;
        mesPhrases = _pdjLoadMes();
        const lv = PDJ_LEVELS[d.level] ? String(d.level) : '1';
        loadPhrase(lv, parseInt(d.idx, 10) || 0);
        if (d.draft && Array.isArray(d.draft.tokens)) {
            cur = { tokens: d.draft.tokens, sol: null };
            isDraft = true;
            hintInf.value   = d.draft.inf || '';
            hintTemps.value = d.draft.temps || '';
        }
        if (d.marks) {
            const nat = {}, fn = {};
            Object.keys(d.marks.nat || {}).forEach(k => {
                const v = _pdjNormNat(d.marks.nat[k]);
                if (PDJ_NAT[v]) nat[k] = v;
            });
            Object.keys(d.marks.fn || {}).forEach(k => {
                if (PDJ_FN[d.marks.fn[k]]) fn[k] = d.marks.fn[k];
            });
            // Ancienne sauvegarde : soulignements verbe / sujet
            (d.marks.sujet || []).forEach(i => { fn[i] = 'S'; });
            (d.marks.verbe || []).forEach(i => { fn[i] = 'V'; });
            marks = { nat, fn };
        }
        step = Math.min(parseInt(d.step, 10) || 0, getSteps().length);
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        // Après la restauration du tableau (mise à l'échelle des polices), on réajuste la phrase
        setTimeout(fitPhrase, 250);
    };

    saveBoard();
    return widget;
}
