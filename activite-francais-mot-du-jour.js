// =========================================================================
// WIDGET LE MOT DU JOUR — Le Bureau du Prof
// Un mot de vocabulaire présenté en 6 volets à ouvrir au fil de la séance :
//   (144 mots par niveau, 3 niveaux : de quoi tenir une année scolaire)
//   1. Définition   2. Nature   3. Famille   4. Synonymes et contraires
//   5. Phrase d'exemple   6. Origine
// - « Ouvrir le volet suivant » dévoile les volets un par un (ou clic sur un volet).
// - « Cacher le mot » transforme le mot en devinette (c _ _ _ _ _ _).
// - Un historique (gardé dans le navigateur) mémorise les mots déjà vus,
//   avec la date, pour les réviser (clic sur un mot, ou « Réviser au hasard »).
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

    if (document.getElementById('mdj-style')) return;
    const s = document.createElement('style');
    s.id = 'mdj-style';
    s.textContent = `
        .widget[data-type="mot-du-jour"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .mdj-container {
            --mdj-fs: 16px;
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
        .mdj-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: grab;
            user-select: none;
        }
        .mdj-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .mdj-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #dff3ef;
            color: #0f766e;
        }

        /* Réduit / plein écran */
        .mdj-container.wf-minimized > *:not(.mdj-header) { display: none !important; }
        .mdj-container.wf-minimized { gap: 0; }
        .mdj-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        .mdj-container.wf-fullboard .mdj-volets,
        .mdj-container.wf-fullboard .mdj-history {
            height: auto !important;
            flex: 1 1 auto;
            min-height: 220px;
        }

        /* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .mdj-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .mdj-controls, .mdj-volets-bar {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .mdj-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .mdj-btn:active { transform: scale(0.96); }
        .mdj-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .mdj-btn-blue  { background: #4a90e2; color: white; }
        .mdj-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .mdj-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .mdj-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .mdj-btn-green { background: #28a745; color: white; }
        .mdj-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .mdj-btn-red   { background: #fff0f0; color: #b91c1c; border: 1px solid #f3c4c4; }
        .mdj-btn-red:hover:not(:disabled)   { background: #fde2e2; }
        .mdj-btn.on { background: #dff3ef; color: #0f766e; border-color: #9fd9cd; }
        .mdj-nav-label {
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            min-width: 70px;
            text-align: center;
        }
        .mdj-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .mdj-level-btn {
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
        .mdj-level-btn:hover { background: #e0e0e0; }
        .mdj-level-btn.active { background: #dff3ef; color: #0f766e; border-color: #9fd9cd; }

        /* Zone du mot */
        .mdj-zone {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 20px;
            background: linear-gradient(180deg, #f8fafc 0%, #eef7f5 100%);
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: hidden;
        }
        .mdj-word {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-weight: 800;
            color: #0f3d3a;
            line-height: 1.15;
            text-align: center;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: .3em;
        }
        .mdj-emoji { font-size: .78em; }
        .mdj-word.is-hidden .mdj-letters { color: #94a3b8; letter-spacing: .08em; }
        .mdj-seen {
            position: absolute;
            top: 6px;
            right: 8px;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            background: #fff7d6;
            color: #8a6100;
            border: 1px solid #f1dc94;
            pointer-events: none;
        }
        .mdj-seen.today { background: #dcfce7; color: #166534; border-color: #a7e3bb; }
        .mdj-empty { font-size: 16px; color: #9ca3af; font-weight: 600; text-align: center; }

        /* Volets */
        .mdj-volets {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 1fr;
            gap: 8px;
            flex-shrink: 0;
            min-height: 0;
        }
        .mdj-container.mdj-narrow .mdj-volets { grid-template-columns: repeat(2, 1fr); }
        .mdj-volet {
            position: relative;
            border-radius: 12px;
            border: 2px solid var(--vc);
            background: var(--vl);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 0;
            transition: transform .15s, box-shadow .15s, background .2s;
        }
        .mdj-volet:not(.open) { cursor: pointer; }
        .mdj-volet:not(.open):hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
        .mdj-volet.open { background: #fff; }
        .mdj-volet-head {
            display: flex;
            align-items: center;
            gap: .4em;
            padding: .3em .6em;
            background: var(--vc);
            color: #fff;
            font-weight: 800;
            font-size: max(11px, calc(var(--mdj-fs) * .78));
            flex-shrink: 0;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .mdj-volet-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.45em;
            height: 1.45em;
            border-radius: 50%;
            background: rgba(255,255,255,.28);
            flex-shrink: 0;
        }
        .mdj-volet-head .mdj-volet-state { margin-left: auto; opacity: .85; font-size: .9em; }
        .mdj-volet-cover {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: .15em;
            color: var(--vc);
            font-weight: 800;
            text-align: center;
            padding: .3em;
        }
        .mdj-volet-cover .ico { font-size: calc(var(--mdj-fs) * 2.1); line-height: 1; }
        .mdj-volet-cover .txt { font-size: max(10px, calc(var(--mdj-fs) * .7)); opacity: .75; }
        .mdj-volet-body {
            display: none;
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: .45em .7em;
            font-size: var(--mdj-fs);
            color: #1f2937;
            line-height: 1.4;
            user-select: text;
            -webkit-user-select: text;
            transform-origin: top center;
        }
        .mdj-volet.open .mdj-volet-cover { display: none; }
        .mdj-volet.open .mdj-volet-body { display: block; }
        .mdj-volet.just-open .mdj-volet-body { animation: mdjOpen .45s ease-out; }
        @keyframes mdjOpen { from { opacity: 0; transform: perspective(600px) rotateX(-60deg); } to { opacity: 1; transform: none; } }

        .mdj-chip {
            display: inline-block;
            padding: .08em .55em;
            margin: .12em .15em;
            border-radius: 1em;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            font-weight: 700;
            font-size: .92em;
        }
        .mdj-chip.fam   { background: #dcfce7; border-color: #a7e3bb; color: #14532d; }
        .mdj-chip.syn   { background: #e0f2fe; border-color: #93c5fd; color: #1e3a8a; }
        .mdj-chip.contr { background: #fee2e2; border-color: #fca5a5; color: #7f1d1d; }
        .mdj-sub { font-weight: 800; font-size: .82em; color: #475569; margin: .15em 0 .05em; }
        .mdj-none { color: #94a3b8; font-style: italic; font-size: .9em; }
        .mdj-nat-main { font-weight: 800; font-size: 1.15em; color: var(--vc); }
        .mdj-nat-help { font-size: .82em; color: #4b5563; margin-top: .3em; }
        .mdj-ex { font-style: italic; }
        .mdj-ex mark { background: #fde68a; color: inherit; padding: 0 .15em; border-radius: .2em; font-weight: 800; font-style: normal; }

        /* Historique */
        .mdj-history {
            display: none;
            flex-direction: column;
            gap: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 8px 10px;
            background: #fafafa;
            overflow: hidden;
            flex-shrink: 0;
            min-height: 0;
            box-sizing: border-box;
        }
        .mdj-history.show { display: flex; }
        .mdj-hist-top { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .mdj-hist-title { font-size: 13px; font-weight: 800; color: #0f3d3a; margin-right: auto; }
        .mdj-hist-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            overflow: auto;
            align-content: flex-start;
            flex: 1;
            min-height: 0;
        }
        .mdj-hist-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 5px 4px 10px;
            border-radius: 20px;
            border: 1px solid #cbd5e1;
            background: #fff;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            color: #0f3d3a;
            transition: background .15s;
        }
        .mdj-hist-item:hover { background: #ecfdf5; }
        .mdj-hist-item small { color: #94a3b8; font-weight: 600; font-size: 11px; }
        .mdj-hist-del {
            border: none;
            background: #f1f5f9;
            color: #64748b;
            width: 18px; height: 18px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 11px;
            line-height: 1;
            padding: 0;
        }
        .mdj-hist-del:hover { background: #fee2e2; color: #b91c1c; }

        /* Aide */
        .mdj-help-btn {
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
        .mdj-help-btn:hover { background: #e0e0e0; color: #333; }
        .mdj-help-popup {
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
        .mdj-help-popup.show { display: block; }
        .mdj-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .mdj-help-popup p { margin: 0 0 6px; }
        .mdj-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement */
        .mdj-resize-handle {
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
        .mdj-container:hover .mdj-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Les 6 volets ──────────────────────────────────────────────────────────
const MDJ_VOLETS = [
    { k: 'def', nom: 'Définition',              ico: '📖', c: '#2563eb', l: '#dbeafe' },
    { k: 'nat', nom: 'Nature',                  ico: '🏷️', c: '#9333ea', l: '#f3e8ff' },
    { k: 'fam', nom: 'Famille',                 ico: '🌳', c: '#16a34a', l: '#dcfce7' },
    { k: 'syn', nom: 'Synonymes et contraires', ico: '↔️', c: '#d97706', l: '#fef3c7' },
    { k: 'ex',  nom: 'Phrase d\'exemple',       ico: '💬', c: '#db2777', l: '#fce7f3' },
    { k: 'ori', nom: 'Origine',                 ico: '🏛️', c: '#475569', l: '#e2e8f0' }
];
const MDJ_VOLET_KEYS = MDJ_VOLETS.map(v => v.k);

const MDJ_LEVELS = {
    '1': { label: 'Niveau 1', titre: 'Niveau 1 : mots courants à enrichir' },
    '2': { label: 'Niveau 2', titre: 'Niveau 2 : mots plus riches' },
    '3': { label: 'Niveau 3', titre: 'Niveau 3 : mots savants' }
};

const MDJ_HIST_KEY = 'mdj-historique';
const MDJ_HIST_MAX = 1000;

// ── Banque de mots ────────────────────────────────────────────────────────
// m : le mot, e : pictogramme, n : nature, d : définition,
// f : famille, s : synonymes, c : contraires,
// x : phrase d'exemple (le mot entre *étoiles* est surligné), o : origine
const MDJ_BANQUE = {
    '1': [
        { m: "courage", e: "🦁", n: "nom masculin",
          d: "Force qui permet d'affronter le danger, la peur ou une difficulté.",
          f: ["courageux", "courageuse", "courageusement", "encourager", "décourager", "encouragement"],
          s: ["bravoure", "audace", "vaillance"], c: ["lâcheté", "peur"],
          x: "Elle a eu le *courage* de dire la vérité à toute la classe.",
          o: "Vient de « cœur » (en latin cor) : autrefois, on pensait que le courage venait du cœur." },
        { m: "trésor", e: "💰", n: "nom masculin",
          d: "Ensemble d'objets précieux (or, bijoux, pièces) cachés ou mis de côté.",
          f: ["trésorier", "trésorière", "trésorerie"],
          s: ["fortune", "richesse", "magot"], c: ["misère", "pauvreté"],
          x: "Les pirates ont enterré leur *trésor* sur une île déserte.",
          o: "Du latin thesaurus, lui-même venu du grec thêsauros, « réserve, lieu où l'on garde des richesses »." },
        { m: "gigantesque", e: "🦕", n: "adjectif",
          d: "Très, très grand ; énorme.",
          f: ["géant", "géante", "gigantisme"],
          s: ["immense", "énorme", "colossal"], c: ["minuscule", "petit"],
          x: "Un arbre *gigantesque* se dressait au milieu de la forêt.",
          o: "Vient de « géant », du grec gigas : les Géants étaient des êtres immenses de la mythologie grecque." },
        { m: "explorer", e: "🧭", n: "verbe (1er groupe)",
          d: "Parcourir un lieu mal connu pour le découvrir et l'étudier.",
          f: ["explorateur", "exploratrice", "exploration", "inexploré"],
          s: ["parcourir", "découvrir", "fouiller"], c: ["délaisser", "ignorer"],
          x: "Les enfants *explorent* le grenier de leur grand-mère.",
          o: "Du latin explorare, « observer attentivement, examiner »." },
        { m: "rapide", e: "🐆", n: "adjectif",
          d: "Qui va vite, ou qui se fait en peu de temps.",
          f: ["rapidement", "rapidité"],
          s: ["vif", "prompt", "véloce"], c: ["lent"],
          x: "Le guépard est l'animal le plus *rapide* sur terre.",
          o: "Du latin rapidus, de rapere, « emporter, saisir vivement »." },
        { m: "bibliothèque", e: "📚", n: "nom féminin",
          d: "Lieu ou meuble où l'on range des livres, et où l'on peut souvent les emprunter.",
          f: ["bibliothécaire", "bibliographie", "bibliophile"],
          s: ["médiathèque"], c: [],
          x: "Je rends mes livres à la *bibliothèque* de l'école.",
          o: "Du grec biblion, « livre », et thêkê, « coffre, armoire » : c'est une « armoire à livres »." },
        { m: "orage", e: "⛈️", n: "nom masculin",
          d: "Mauvais temps avec du tonnerre, des éclairs et souvent de fortes pluies.",
          f: ["orageux", "orageuse"],
          s: ["tempête", "averse"], c: ["accalmie", "beau temps"],
          x: "Un violent *orage* a éclaté pendant la nuit.",
          o: "De l'ancien français ore, « vent », qui vient du latin aura, « souffle d'air »." },
        { m: "malin", e: "🦊", n: "adjectif (féminin : maligne)",
          d: "Qui est intelligent et rusé, qui sait se débrouiller.",
          f: ["maligne", "malice", "malicieux"],
          s: ["rusé", "astucieux", "futé"], c: ["naïf", "sot"],
          x: "Le renard *malin* a trompé le corbeau.",
          o: "Du latin malignus, « méchant » : au début, « malin » voulait dire « mauvais »." },
        { m: "calme", e: "🌊", n: "adjectif",
          d: "Qui est tranquille, sans bruit ni agitation.",
          f: ["calmer", "calmement", "accalmie", "calmant"],
          s: ["tranquille", "paisible", "serein"], c: ["agité", "bruyant", "nerveux"],
          x: "La mer est *calme* ce matin.",
          o: "De l'italien calma, venu du grec kauma, « chaleur brûlante » : le moment de midi où tout s'arrête à cause de la chaleur." },
        { m: "grignoter", e: "🐭", n: "verbe (1er groupe)",
          d: "Manger par petites bouchées, en rongeant.",
          f: ["grignotage", "grignoteur", "grignoteuse"],
          s: ["ronger", "picorer"], c: ["dévorer", "engloutir"],
          x: "La souris *grignote* un morceau de fromage.",
          o: "De l'ancien verbe grigner, « montrer les dents, grincer des dents »." },
        { m: "aventure", e: "🗺️", n: "nom féminin",
          d: "Ce qui arrive d'inattendu, de surprenant ou de dangereux.",
          f: ["aventurier", "aventurière", "aventureux", "s'aventurer", "mésaventure"],
          s: ["péripétie", "épopée"], c: ["routine"],
          x: "Ce voyage en montagne fut une véritable *aventure*.",
          o: "Du latin adventura, « ce qui doit arriver », de advenire, « arriver »." },
        { m: "lumineux", e: "💡", n: "adjectif (féminin : lumineuse)",
          d: "Qui donne de la lumière ou qui en reçoit beaucoup.",
          f: ["lumière", "luminosité", "illuminer", "allumer"],
          s: ["brillant", "éclatant", "clair"], c: ["sombre", "obscur"],
          x: "Notre classe est *lumineuse* grâce à ses grandes fenêtres.",
          o: "Du latin lumen, luminis, « lumière »." },
        { m: "forêt", e: "🌲", n: "nom féminin", d: "Grand espace couvert d'arbres.", f: ["forestier", "forestière", "déforestation", "reboiser"], s: ["bois"], c: ["désert", "clairière"], x: "Nous avons ramassé des châtaignes dans la *forêt*.", o: "Du latin forestis silva, « le bois du dehors », une forêt qui était réservée au roi." },
        { m: "montagne", e: "⛰️", n: "nom féminin", d: "Grande élévation de terrain, beaucoup plus haute qu'une colline.", f: ["montagneux", "montagnard", "monter", "monticule"], s: ["mont", "massif"], c: ["plaine", "vallée"], x: "Le chalet se trouve en haut de la *montagne*.", o: "Du latin populaire montanea, de mons, montis, « mont »." },
        { m: "rivière", e: "🏞️", n: "nom féminin", d: "Cours d'eau qui se jette dans un autre cours d'eau.", f: ["rive", "riverain", "rivage", "arriver"], s: ["cours d'eau", "ruisseau"], c: [], x: "Les canards nagent sur la *rivière*.", o: "Du latin riparia, de ripa, « rive » : au début, le mot désignait le bord de l'eau." },
        { m: "océan", e: "🌊", n: "nom masculin", d: "Immense étendue d'eau salée qui couvre une grande partie de la Terre.", f: ["océanique", "océanographe"], s: ["mer"], c: ["continent"], x: "Le navire a traversé l'*océan* Atlantique.", o: "Du grec Okeanos, le dieu du fleuve immense qui, pour les Grecs, entourait la Terre." },
        { m: "désert", e: "🏜️", n: "nom masculin", d: "Grande région très sèche, où il pleut très peu et où vivent peu d'êtres vivants.", f: ["désertique", "déserter", "désertion"], s: ["étendue aride"], c: ["oasis"], x: "Le chameau traverse le *désert* sous un soleil brûlant.", o: "Du latin desertus, « abandonné »." },
        { m: "volcan", e: "🌋", n: "nom masculin", d: "Montagne d'où peuvent sortir de la lave, des cendres et des gaz brûlants.", f: ["volcanique", "volcanologue"], s: [], c: [], x: "Le *volcan* s'est réveillé après cent ans de sommeil.", o: "De Vulcain (Vulcanus), le dieu romain du feu et des forges." },
        { m: "nuage", e: "☁️", n: "nom masculin", d: "Amas de fines gouttes d'eau ou de glace qui flotte dans le ciel.", f: ["nuageux", "nuageuse", "nuée"], s: ["nuée"], c: ["éclaircie"], x: "Un gros *nuage* noir cache le soleil.", o: "Vient de « nue », ancien mot pour nuage, du latin nubes." },
        { m: "printemps", e: "🌷", n: "nom masculin", d: "Saison qui suit l'hiver, quand la nature se réveille (de fin mars à fin juin).", f: ["printanier", "printanière"], s: ["renouveau"], c: ["automne"], x: "Au *printemps*, les arbres se couvrent de fleurs.", o: "De « prin » (premier) et « temps » : c'est le premier temps, le début de la belle saison." },
        { m: "hiver", e: "❄️", n: "nom masculin", d: "Saison la plus froide de l'année, entre l'automne et le printemps.", f: ["hivernal", "hiverner", "hiberner", "hibernation"], s: ["mauvaise saison"], c: ["été"], x: "En *hiver*, les marmottes dorment dans leur terrier.", o: "Du latin hibernum (tempus), « le temps d'hiver »." },
        { m: "neige", e: "🌨️", n: "nom féminin", d: "Eau gelée qui tombe du ciel en petits flocons blancs.", f: ["neiger", "enneigé", "déneiger", "neigeux"], s: ["poudreuse"], c: [], x: "La *neige* a recouvert toute la cour de récréation.", o: "Du verbe neiger, qui vient du latin nix, nivis, « neige »." },
        { m: "étoile", e: "⭐", n: "nom féminin", d: "Astre qui brille la nuit dans le ciel ; le Soleil est une étoile.", f: ["étoilé", "étoilée", "s'étoiler"], s: ["astre"], c: [], x: "Ce soir, le ciel est rempli d'*étoiles*.", o: "Du latin stella, « étoile »." },
        { m: "planète", e: "🪐", n: "nom féminin", d: "Astre qui tourne autour d'une étoile ; la Terre est une planète.", f: ["planétaire", "planétarium"], s: ["astre"], c: [], x: "Mars est surnommée la *planète* rouge.", o: "Du grec planêtês, « vagabond » : les planètes semblent se promener parmi les étoiles." },
        { m: "jardin", e: "🌻", n: "nom masculin", d: "Terrain où l'on cultive des fleurs, des légumes ou des arbres.", f: ["jardiner", "jardinier", "jardinière", "jardinage"], s: ["potager", "parc"], c: [], x: "Papi cultive des tomates dans son *jardin*.", o: "D'un mot francique qui voulait dire « clôture » : un jardin est un espace entouré." },
        { m: "racine", e: "🌱", n: "nom féminin", d: "Partie de la plante qui pousse dans la terre et la nourrit.", f: ["déraciner", "enraciner", "enracinement"], s: ["souche"], c: [], x: "Les *racines* du chêne s'enfoncent profondément dans le sol.", o: "Du latin radix, radicis, « racine », qui a aussi donné « radis »." },
        { m: "graine", e: "🌰", n: "nom féminin", d: "Petite partie d'une plante qui, une fois semée, donne une nouvelle plante.", f: ["grain", "égrener", "grainetier"], s: ["semence", "pépin"], c: [], x: "J'ai planté une *graine* de tournesol dans un pot.", o: "Du latin grana, pluriel de granum, « grain »." },
        { m: "récolte", e: "🧺", n: "nom féminin", d: "Action de ramasser les produits de la terre ; ce que l'on ramasse.", f: ["récolter", "récoltant"], s: ["moisson", "cueillette"], c: ["semis"], x: "La *récolte* des pommes a lieu en automne.", o: "De l'italien ricolta, « ce qui est recueilli »." },
        { m: "île", e: "🏝️", n: "nom féminin", d: "Terre entourée d'eau de tous les côtés.", f: ["îlot", "insulaire", "presqu'île"], s: ["îlot"], c: ["continent"], x: "Robinson vivait seul sur une *île* déserte.", o: "Du latin insula, « île », qui a aussi donné « insulaire »." },
        { m: "cascade", e: "💦", n: "nom féminin", d: "Chute d'eau qui tombe de rocher en rocher.", f: ["cascader", "cascadeur", "cascadeuse"], s: ["chute d'eau"], c: [], x: "La *cascade* fait un bruit assourdissant.", o: "De l'italien cascata, de cascare, « tomber »." },
        { m: "brouillard", e: "🌫️", n: "nom masculin", d: "Nuage très bas, au ras du sol, qui empêche de voir loin.", f: ["brouiller", "embrouiller", "brouillon"], s: ["brume"], c: [], x: "Avec ce *brouillard*, on ne voit pas le bout de la rue.", o: "Vient du verbe brouiller, « mélanger, rendre trouble »." },
        { m: "tempête", e: "🌪️", n: "nom féminin", d: "Vent très violent, souvent accompagné de pluie.", f: ["tempêter", "tempétueux"], s: ["ouragan", "bourrasque"], c: ["calme"], x: "La *tempête* a arraché les tuiles du toit.", o: "Du latin tempestas, qui voulait d'abord dire « temps », puis « mauvais temps »." },
        { m: "rosée", e: "💧", n: "nom féminin", d: "Fines gouttes d'eau qui se déposent le matin sur l'herbe.", f: ["arroser", "arrosoir", "arrosage"], s: [], c: [], x: "Le matin, l'herbe est couverte de *rosée*.", o: "Du latin ros, roris, « rosée », qui a aussi donné « arroser »." },
        { m: "troupeau", e: "🐑", n: "nom masculin", d: "Groupe d'animaux de la même espèce qui vivent ensemble.", f: ["troupe", "attrouper", "attroupement"], s: ["harde", "meute"], c: [], x: "Le berger rentre son *troupeau* de moutons.", o: "Vient de « troupe », mot d'origine germanique." },
        { m: "nid", e: "🪺", n: "nom masculin", d: "Abri construit par un oiseau pour pondre ses œufs.", f: ["nicher", "nichée", "dénicher", "niche"], s: ["abri"], c: [], x: "Une mésange a fait son *nid* dans le vieux mur.", o: "Du latin nidus, « nid »." },
        { m: "joie", e: "😄", n: "nom féminin", d: "Sentiment de grand bonheur.", f: ["joyeux", "joyeusement", "réjouir", "réjouissance"], s: ["bonheur", "gaieté"], c: ["tristesse", "chagrin"], x: "Les enfants crient de *joie* en voyant la neige.", o: "Du latin gaudia, « réjouissances »." },
        { m: "colère", e: "😠", n: "nom féminin", d: "Fort mécontentement qui pousse parfois à crier ou à s'énerver.", f: ["coléreux", "colérique"], s: ["rage", "fureur"], c: ["calme", "sérénité"], x: "Il est rouge de *colère* car on a cassé son jouet.", o: "Du grec kholê, « bile » : on croyait autrefois que la bile rendait de mauvaise humeur." },
        { m: "tristesse", e: "😢", n: "nom féminin", d: "Sentiment de peine, de chagrin.", f: ["triste", "tristement", "attrister"], s: ["chagrin", "peine", "mélancolie"], c: ["joie", "gaieté"], x: "Elle a quitté sa maison avec *tristesse*.", o: "Vient de « triste », du latin tristis." },
        { m: "timide", e: "😳", n: "adjectif", d: "Qui manque d'assurance, qui a du mal à parler devant les autres.", f: ["timidité", "timidement", "intimider"], s: ["réservé", "craintif"], c: ["audacieux", "effronté"], x: "Le nouvel élève est *timide* : il n'ose pas lever la main.", o: "Du latin timidus, de timere, « craindre »." },
        { m: "fier", e: "🦚", n: "adjectif (féminin : fière)", d: "Qui est content de soi ou de quelqu'un ; parfois, qui se croit supérieur.", f: ["fierté", "fièrement"], s: ["content", "orgueilleux"], c: ["honteux", "humble"], x: "Léo est *fier* de son dessin.", o: "Du latin ferus, « sauvage » : au début, fier voulait dire « farouche »." },
        { m: "jaloux", e: "😒", n: "adjectif (féminin : jalouse)", d: "Qui est malheureux de ce que les autres ont et voudrait l'avoir.", f: ["jalousie", "jalousement", "jalouser"], s: ["envieux"], c: [], x: "Il est *jaloux* du vélo neuf de son frère.", o: "Du latin zelosus, venu du grec zêlos, « ardeur, rivalité »." },
        { m: "surprise", e: "🎁", n: "nom féminin", d: "Ce qui étonne parce qu'on ne s'y attendait pas ; cadeau inattendu.", f: ["surprendre", "surprenant", "surpris"], s: ["étonnement", "stupéfaction"], c: [], x: "Quelle *surprise* de te voir ici !", o: "Vient du verbe surprendre : « prendre par-dessus », prendre à l'improviste." },
        { m: "gentil", e: "😊", n: "adjectif (féminin : gentille)", d: "Qui est aimable, agréable avec les autres.", f: ["gentillesse", "gentiment"], s: ["aimable", "sympathique"], c: ["méchant", "désagréable"], x: "Notre voisine est très *gentille* avec nous.", o: "Du latin gentilis, « de bonne famille » : au Moyen Âge, un gentilhomme était un noble." },
        { m: "généreux", e: "🤲", n: "adjectif (féminin : généreuse)", d: "Qui aime donner, partager avec les autres.", f: ["générosité", "généreusement"], s: ["large", "charitable"], c: ["avare", "égoïste"], x: "C'est *généreux* de partager ton goûter.", o: "Du latin generosus, « de noble naissance »." },
        { m: "patient", e: "🐢", n: "adjectif (féminin : patiente)", d: "Qui sait attendre calmement, sans s'énerver.", f: ["patience", "patiemment", "impatient", "s'impatienter"], s: ["calme", "tolérant"], c: ["impatient", "pressé"], x: "Sois *patient*, ton tour va bientôt arriver.", o: "Du latin patiens, de pati, « supporter, souffrir »." },
        { m: "poli", e: "🎩", n: "adjectif (féminin : polie)", d: "Qui respecte les règles de la politesse.", f: ["politesse", "poliment", "impoli"], s: ["courtois", "aimable"], c: ["impoli", "grossier"], x: "Un enfant *poli* dit bonjour et merci.", o: "Du latin politus, « lisse, poli » : quelqu'un de poli a des manières soignées." },
        { m: "paresseux", e: "🦥", n: "adjectif (féminin : paresseuse)", d: "Qui n'aime pas faire d'efforts.", f: ["paresse", "paresser", "paresseusement"], s: ["fainéant", "flemmard"], c: ["travailleur", "courageux"], x: "Le chat *paresseux* dort toute la journée.", o: "Vient de « paresse », du latin pigritia, « lenteur »." },
        { m: "gourmand", e: "🍰", n: "adjectif (féminin : gourmande)", d: "Qui aime manger de bonnes choses, surtout des sucreries.", f: ["gourmandise"], s: ["friand"], c: ["sobre"], x: "Ce petit *gourmand* a mangé tous les bonbons !", o: "Mot apparu au Moyen Âge, dont l'origine reste mystérieuse." },
        { m: "bavard", e: "🗣️", n: "adjectif (féminin : bavarde)", d: "Qui parle beaucoup, parfois trop.", f: ["bavarder", "bavardage"], s: ["causant", "loquace"], c: ["silencieux", "muet"], x: "Mon perroquet est très *bavard*.", o: "Vient de « bave » : le bavard laisse couler les paroles sans s'arrêter." },
        { m: "grimper", e: "🧗", n: "verbe (1er groupe)", d: "Monter en s'aidant des mains et des pieds.", f: ["grimpeur", "grimpeuse", "grimpette"], s: ["escalader", "monter"], c: ["descendre"], x: "L'écureuil *grimpe* au sommet de l'arbre.", o: "Sans doute une forme de « gripper », « saisir, s'accrocher »." },
        { m: "chuchoter", e: "🤫", n: "verbe (1er groupe)", d: "Parler tout bas, à voix basse.", f: ["chuchotement", "chuchoteur"], s: ["murmurer"], c: ["crier", "hurler"], x: "Les élèves *chuchotent* pour ne pas réveiller le bébé.", o: "Mot qui imite le bruit doux de quelqu'un qui parle à voix basse." },
        { m: "bondir", e: "🐇", n: "verbe (2e groupe)", d: "Faire un saut, s'élancer brusquement.", f: ["bond", "rebondir", "rebond", "bondissant"], s: ["sauter", "s'élancer"], c: [], x: "Le kangourou *bondit* à travers la plaine.", o: "Du latin populaire bombitire, « résonner » : au début, bondir voulait dire « retentir »." },
        { m: "galoper", e: "🐎", n: "verbe (1er groupe)", d: "Courir au galop, très vite, comme un cheval.", f: ["galop", "galopade", "galopin"], s: ["courir", "filer"], c: ["flâner"], x: "Le cheval *galope* dans la prairie.", o: "D'un mot francique qui voulait dire « bien sauter »." },
        { m: "ramper", e: "🐍", n: "verbe (1er groupe)", d: "Avancer en glissant le ventre contre le sol.", f: ["rampe", "rampant"], s: ["se traîner"], c: [], x: "Le serpent *rampe* sous les feuilles.", o: "D'un mot francique qui voulait dire « grimper en s'agrippant »." },
        { m: "construire", e: "🏗️", n: "verbe (3e groupe)", d: "Bâtir, assembler des éléments pour faire quelque chose.", f: ["construction", "constructeur", "reconstruire", "constructif"], s: ["bâtir", "édifier"], c: ["détruire", "démolir"], x: "Les castors *construisent* des barrages.", o: "Du latin construere, « assembler, entasser »." },
        { m: "réparer", e: "🔧", n: "verbe (1er groupe)", d: "Remettre en bon état ce qui était abîmé ou cassé.", f: ["réparation", "réparateur", "irréparable"], s: ["arranger", "raccommoder"], c: ["casser", "abîmer"], x: "Papa *répare* la chaîne de mon vélo.", o: "Du latin reparare, « remettre en état »." },
        { m: "partager", e: "🍕", n: "verbe (1er groupe)", d: "Diviser en plusieurs parts ; donner une partie de ce qu'on a.", f: ["partage", "part", "partie", "partageur"], s: ["répartir", "distribuer"], c: ["garder", "accaparer"], x: "Nous *partageons* le gâteau en huit parts.", o: "Vient de « part », du latin pars, partis." },
        { m: "deviner", e: "🔮", n: "verbe (1er groupe)", d: "Trouver une réponse sans la connaître, par intuition ou en réfléchissant.", f: ["devinette", "devin", "divination"], s: ["découvrir", "trouver"], c: [], x: "Sauras-tu *deviner* ce que je cache dans ma main ?", o: "Du latin divinare, « prédire l'avenir », de divinus, « divin »." },
        { m: "inventer", e: "💡", n: "verbe (1er groupe)", d: "Créer quelque chose qui n'existait pas encore ; imaginer.", f: ["invention", "inventeur", "inventrice", "inventif"], s: ["créer", "imaginer"], c: ["copier", "imiter"], x: "Elle a *inventé* un nouveau jeu pour la récréation.", o: "Du latin invenire, « trouver »." },
        { m: "observer", e: "🔭", n: "verbe (1er groupe)", d: "Regarder avec attention.", f: ["observation", "observateur", "observatoire"], s: ["examiner", "regarder"], c: ["ignorer"], x: "Nous *observons* les fourmis avec une loupe.", o: "Du latin observare, « surveiller, faire attention »." },
        { m: "cueillir", e: "🌸", n: "verbe (3e groupe)", d: "Détacher une fleur ou un fruit de la plante.", f: ["cueillette", "cueilleur", "accueillir", "recueillir"], s: ["ramasser", "récolter"], c: [], x: "Nous avons *cueilli* des fraises des bois.", o: "Du latin colligere, « rassembler »." },
        { m: "voyager", e: "✈️", n: "verbe (1er groupe)", d: "Aller dans un lieu lointain, se déplacer.", f: ["voyage", "voyageur", "voyageuse"], s: ["se déplacer", "parcourir"], c: ["rester", "demeurer"], x: "Cet été, nous allons *voyager* en train.", o: "Vient de « voyage », du latin viaticum, « provisions pour la route » (via veut dire « route »)." },
        { m: "protéger", e: "🛡️", n: "verbe (1er groupe)", d: "Mettre à l'abri d'un danger, défendre.", f: ["protection", "protecteur", "protectrice"], s: ["défendre", "abriter"], c: ["attaquer", "menacer"], x: "Le casque *protège* la tête des cyclistes.", o: "Du latin protegere, « couvrir par-devant »." },
        { m: "remercier", e: "🙏", n: "verbe (1er groupe)", d: "Dire merci à quelqu'un.", f: ["merci", "remerciement"], s: [], c: [], x: "J'ai *remercié* Mamie pour son cadeau.", o: "Vient de « merci », du latin merces, « salaire, récompense »." },
        { m: "dictionnaire", e: "📕", n: "nom masculin", d: "Livre qui donne la liste des mots d'une langue, rangés dans l'ordre alphabétique, avec leur sens.", f: ["diction", "dicter", "dictée"], s: ["lexique"], c: [], x: "Je cherche le sens de ce mot dans le *dictionnaire*.", o: "Du latin dictio, « action de dire, mot »." },
        { m: "alphabet", e: "🔤", n: "nom masculin", d: "Ensemble des lettres d'une langue, rangées dans un ordre précis.", f: ["alphabétique", "analphabète", "alphabétiser"], s: ["abécédaire"], c: [], x: "L'*alphabet* français compte 26 lettres.", o: "Des deux premières lettres de l'alphabet grec : alpha et bêta." },
        { m: "horloge", e: "🕰️", n: "nom féminin", d: "Grand appareil qui indique l'heure.", f: ["horloger", "horlogerie", "horaire"], s: ["pendule"], c: [], x: "L'*horloge* de l'église sonne midi.", o: "Du grec hôrologion, de hôra, « heure », et legein, « dire » : ce qui dit l'heure." },
        { m: "calendrier", e: "📆", n: "nom masculin", d: "Tableau des jours, des semaines et des mois de l'année.", f: ["calendes"], s: ["agenda", "almanach"], c: [], x: "J'ai entouré mon anniversaire sur le *calendrier*.", o: "Du latin calendarium, « registre des dettes », qu'on payait aux calendes, le premier jour du mois chez les Romains." },
        { m: "musée", e: "🖼️", n: "nom masculin", d: "Lieu où l'on expose des œuvres d'art ou des objets anciens.", f: ["muséum", "muse"], s: ["galerie", "exposition"], c: [], x: "Au *musée*, nous avons vu des squelettes de dinosaures.", o: "Du grec mouseion, « temple des Muses », les déesses des arts." },
        { m: "château", e: "🏰", n: "nom masculin", d: "Grande et belle demeure, souvent fortifiée, d'un seigneur ou d'un roi.", f: ["châtelain", "châtelaine"], s: ["palais", "forteresse"], c: ["chaumière"], x: "Le roi vivait dans un immense *château*.", o: "Du latin castellum, « place fortifiée »." },
        { m: "village", e: "🏘️", n: "nom masculin", d: "Petit groupe de maisons à la campagne.", f: ["villageois", "villageoise", "ville"], s: ["hameau", "bourg"], c: ["ville"], x: "Mes grands-parents habitent un petit *village* de montagne.", o: "Du latin villa, « ferme, domaine à la campagne »." },
        { m: "pont", e: "🌉", n: "nom masculin", d: "Construction qui permet de passer au-dessus d'une rivière, d'une route ou d'un ravin.", f: ["ponton", "pontonnier"], s: ["passerelle", "viaduc"], c: [], x: "Le train passe sur le *pont* de pierre.", o: "Du latin pons, pontis, « pont »." },
        { m: "fusée", e: "🚀", n: "nom féminin", d: "Engin très puissant qui s'élance dans le ciel et peut aller dans l'espace.", f: ["fuseau"], s: ["navette spatiale"], c: [], x: "La *fusée* décolle dans un nuage de fumée.", o: "Vient de « fuseau » : la fusée a une forme allongée, comme le fuseau qui servait à filer la laine." },
        { m: "navire", e: "🚢", n: "nom masculin", d: "Grand bateau.", f: ["naval", "navigation", "naviguer", "navigateur"], s: ["bateau", "vaisseau"], c: [], x: "Le *navire* entre dans le port.", o: "Du latin navis, « bateau »." },
        { m: "chemin", e: "🛤️", n: "nom masculin", d: "Petite route, souvent de terre, pour aller d'un endroit à un autre.", f: ["cheminer", "cheminement", "acheminer"], s: ["sentier", "piste"], c: [], x: "Nous suivons le *chemin* qui mène à la cabane.", o: "Du latin populaire camminus, un mot venu de la langue des Gaulois." },
        { m: "énorme", e: "🐘", n: "adjectif", d: "Très gros, très grand.", f: ["énormément", "énormité"], s: ["gigantesque", "immense"], c: ["minuscule", "petit"], x: "Un *énorme* éléphant barrait la route.", o: "Du latin enormis, « qui sort de la règle » (e, « hors de », et norma, « règle »)." },
        { m: "minuscule", e: "🐜", n: "adjectif", d: "Très, très petit.", f: ["diminuer", "minimum", "minime"], s: ["minime", "microscopique"], c: ["énorme", "gigantesque"], x: "Une *minuscule* fourmi transporte une miette.", o: "Du latin minusculus, « assez petit », de minus, « moins »." },
        { m: "ancien", e: "🏺", n: "adjectif (féminin : ancienne)", d: "Qui existe depuis très longtemps ; qui appartient au passé.", f: ["ancienneté", "anciennement"], s: ["vieux", "antique"], c: ["moderne", "récent", "nouveau"], x: "Ce château *ancien* date du Moyen Âge.", o: "Du latin populaire anteanus, de ante, « avant »." },
        { m: "solide", e: "🧱", n: "adjectif", d: "Qui résiste, qui ne se casse pas facilement.", f: ["solidité", "solidement", "consolider", "solidifier"], s: ["résistant", "robuste"], c: ["fragile"], x: "Cette table en chêne est très *solide*.", o: "Du latin solidus, « massif, entier »." },
        { m: "fragile", e: "🥚", n: "adjectif", d: "Qui se casse ou s'abîme facilement.", f: ["fragilité", "fragiliser"], s: ["délicat", "cassant"], c: ["solide", "résistant"], x: "Attention, ce vase en verre est *fragile* !", o: "Du latin fragilis, de frangere, « briser »." },
        { m: "lourd", e: "🏋️", n: "adjectif (féminin : lourde)", d: "Qui pèse beaucoup.", f: ["lourdeur", "lourdement", "alourdir"], s: ["pesant"], c: ["léger"], x: "Mon cartable est trop *lourd* aujourd'hui.", o: "Du latin luridus, « jaunâtre, blême » : le sens a beaucoup changé au fil du temps." },
        { m: "léger", e: "🪶", n: "adjectif (féminin : légère)", d: "Qui ne pèse pas lourd.", f: ["légèreté", "légèrement", "alléger"], s: [], c: ["lourd", "pesant"], x: "Une plume est très *légère*.", o: "Du latin populaire leviarius, de levis, « léger »." },
        { m: "sombre", e: "🌑", n: "adjectif", d: "Où il y a peu de lumière.", f: ["assombrir", "sombrement"], s: ["obscur", "noir"], c: ["clair", "lumineux"], x: "La cave est *sombre* et humide.", o: "Origine discutée : peut-être du latin subumbrare, « mettre à l'ombre »." },
        { m: "silencieux", e: "🤐", n: "adjectif (féminin : silencieuse)", d: "Qui ne fait pas de bruit ; qui ne parle pas.", f: ["silence", "silencieusement"], s: ["calme", "muet"], c: ["bruyant", "bavard"], x: "La bibliothèque est un lieu *silencieux*.", o: "Vient de « silence », du latin silentium." },
        { m: "bruyant", e: "📢", n: "adjectif (féminin : bruyante)", d: "Qui fait beaucoup de bruit.", f: ["bruit", "bruyamment", "bruitage"], s: ["tapageur", "sonore"], c: ["silencieux", "calme"], x: "La cantine est très *bruyante* à midi.", o: "Vient de l'ancien verbe bruire, « faire du bruit »." },
        { m: "délicieux", e: "😋", n: "adjectif (féminin : délicieuse)", d: "Qui a un très bon goût ; très agréable.", f: ["délice", "délicieusement"], s: ["savoureux", "exquis"], c: ["infect", "mauvais"], x: "Ce gâteau au chocolat est *délicieux* !", o: "Du latin deliciosus, de deliciae, « délices »." },
        { m: "étrange", e: "👽", n: "adjectif", d: "Qui est bizarre, surprenant, inhabituel.", f: ["étrangeté", "étrangement", "étranger"], s: ["bizarre", "curieux", "insolite"], c: ["normal", "banal"], x: "Un bruit *étrange* vient du grenier.", o: "Du latin extraneus, « du dehors, étranger »." },
        { m: "mystérieux", e: "🕵️", n: "adjectif (féminin : mystérieuse)", d: "Qui est difficile à comprendre, qui cache un secret.", f: ["mystère", "mystérieusement"], s: ["énigmatique", "secret"], c: ["clair", "évident"], x: "Une lettre *mystérieuse* est arrivée sans nom ni adresse.", o: "Vient de « mystère », du grec mustêrion, « secret »." },
        { m: "magnifique", e: "✨", n: "adjectif", d: "Très beau, splendide.", f: ["magnificence", "magnifiquement", "magnifier"], s: ["splendide", "superbe"], c: ["affreux", "laid"], x: "Du sommet, la vue est *magnifique*.", o: "Du latin magnificus, « qui fait de grandes choses » (magnus veut dire « grand »)." },
        { m: "dangereux", e: "⚠️", n: "adjectif (féminin : dangereuse)", d: "Qui peut faire du mal, qui présente un risque.", f: ["danger", "dangereusement"], s: ["risqué", "périlleux"], c: ["sûr", "inoffensif"], x: "Il est *dangereux* de traverser sans regarder.", o: "Vient de « danger », qui au Moyen Âge voulait dire « pouvoir d'un seigneur » (du latin dominium)." },
        { m: "prudent", e: "🦺", n: "adjectif (féminin : prudente)", d: "Qui fait attention pour éviter les dangers.", f: ["prudence", "prudemment", "imprudent"], s: ["attentif", "vigilant"], c: ["imprudent", "téméraire"], x: "Sois *prudent* sur ton vélo !", o: "Du latin prudens, « qui prévoit, avisé »." },
        { m: "fatigué", e: "😴", n: "adjectif (féminin : fatiguée)", d: "Qui a besoin de se reposer.", f: ["fatigue", "fatiguer", "fatigant", "infatigable"], s: ["épuisé", "las"], c: ["reposé", "en forme"], x: "Après la randonnée, nous étions très *fatigués*.", o: "Du latin fatigare, « épuiser »." },
        { m: "agile", e: "🐒", n: "adjectif", d: "Qui bouge avec facilité et rapidité.", f: ["agilité", "agilement"], s: ["souple", "adroit", "leste"], c: ["maladroit", "lourd"], x: "Le singe *agile* saute de branche en branche.", o: "Du latin agilis, de agere, « agir, pousser »." },
        { m: "immense", e: "🌌", n: "adjectif", d: "Très grand, comme sans limites.", f: ["immensité", "immensément"], s: ["vaste", "gigantesque"], c: ["minuscule", "petit"], x: "Le ciel *immense* est plein d'étoiles.", o: "Du latin immensus, « qu'on ne peut pas mesurer » (in-, « non », et mensus, « mesuré »)." },
        { m: "liberté", e: "🕊️", n: "nom féminin", d: "Possibilité de faire ce que l'on veut, sans être enfermé ni obligé.", f: ["libre", "librement", "libérer", "libération"], s: ["indépendance"], c: ["captivité", "esclavage"], x: "L'oiseau a retrouvé sa *liberté* en sortant de la cage.", o: "Du latin libertas, de liber, « libre »." },
        { m: "amitié", e: "🤗", n: "nom féminin", d: "Sentiment d'affection et de confiance entre amis.", f: ["ami", "amie", "amical", "amicalement"], s: ["camaraderie"], c: ["inimitié", "hostilité"], x: "Une belle *amitié* est née entre Sami et Lou.", o: "Du latin populaire amicitas, de amicus, « ami »." },
        { m: "secret", e: "🔐", n: "nom masculin", d: "Ce que l'on ne doit pas dire aux autres.", f: ["secrète", "secrètement", "secrétaire"], s: ["confidence", "mystère"], c: [], x: "Peux-tu garder un *secret* ?", o: "Du latin secretum, « chose mise à part, cachée »." },
        { m: "souvenir", e: "📸", n: "nom masculin", d: "Ce qui reste dans la mémoire.", f: ["se souvenir", "souvenance"], s: ["mémoire"], c: ["oubli"], x: "Ces vacances à la mer resteront un beau *souvenir*.", o: "Du latin subvenire, « venir à l'esprit »." },
        { m: "récompense", e: "🏆", n: "nom féminin", d: "Ce que l'on reçoit pour un effort ou une bonne action.", f: ["récompenser", "compenser"], s: ["prix", "gratification"], c: ["punition", "sanction"], x: "Le chien reçoit une *récompense* quand il obéit.", o: "Vient du verbe récompenser, du latin compensare, « équilibrer »." },
        { m: "promesse", e: "🤞", n: "nom féminin", d: "Engagement de faire quelque chose.", f: ["promettre", "prometteur"], s: ["serment", "engagement"], c: [], x: "Il a tenu sa *promesse* et il est venu.", o: "Du latin promissa, de promittere, « envoyer en avant, annoncer »." },
        { m: "mensonge", e: "🤥", n: "nom masculin", d: "Ce que l'on dit en sachant que c'est faux.", f: ["mentir", "menteur", "menteuse"], s: ["tromperie", "invention"], c: ["vérité"], x: "Pinocchio voit son nez grandir à chaque *mensonge*.", o: "Du latin mentiri, « mentir »." },
        { m: "vérité", e: "✅", n: "nom féminin", d: "Ce qui est vrai, ce qui correspond à la réalité.", f: ["vrai", "vraiment", "véritable", "vérifier"], s: ["exactitude", "réalité"], c: ["mensonge", "erreur"], x: "Il faut toujours dire la *vérité*.", o: "Du latin veritas, de verus, « vrai »." },
        { m: "rêve", e: "💭", n: "nom masculin", d: "Images et histoires qui viennent à l'esprit pendant le sommeil ; projet que l'on souhaite réaliser.", f: ["rêver", "rêveur", "rêveuse", "rêverie"], s: ["songe", "désir"], c: ["cauchemar", "réalité"], x: "Son *rêve* est de devenir pilote.", o: "Vient de rêver, mot d'origine discutée ; en ancien français, rêver voulait dire « vagabonder »." },
        { m: "cauchemar", e: "😱", n: "nom masculin", d: "Rêve qui fait peur.", f: ["cauchemarder", "cauchemardesque"], s: ["mauvais rêve"], c: ["beau rêve"], x: "Cette nuit, j'ai fait un *cauchemar* plein de monstres.", o: "De l'ancien verbe caucher, « presser », et de mare, mot néerlandais pour « fantôme » : le fantôme qui écrase le dormeur." },
        { m: "fête", e: "🎉", n: "nom féminin", d: "Moment de joie où l'on célèbre quelque chose.", f: ["fêter", "festif", "festivité", "festival"], s: ["célébration", "réjouissance"], c: ["deuil"], x: "Toute la classe prépare la *fête* de l'école.", o: "Du latin festa (dies), « jour de fête »." },
        { m: "spectacle", e: "🎭", n: "nom masculin", d: "Ce que l'on présente au public : pièce de théâtre, concert, cirque…", f: ["spectateur", "spectatrice", "spectaculaire"], s: ["représentation", "show"], c: [], x: "Le *spectacle* de marionnettes a fait rire les petits.", o: "Du latin spectaculum, de spectare, « regarder »." },
        { m: "légende", e: "📜", n: "nom féminin", d: "Histoire merveilleuse, où le vrai se mêle à l'imaginaire ; texte qui explique une image.", f: ["légendaire"], s: ["conte", "mythe"], c: ["réalité"], x: "Selon la *légende*, un dragon vivait dans cette grotte.", o: "Du latin legenda, « ce qui doit être lu »." },
        { m: "énigme", e: "🧩", n: "nom féminin", d: "Question difficile, chose mystérieuse à résoudre.", f: ["énigmatique"], s: ["devinette", "mystère"], c: ["évidence"], x: "Le détective a enfin résolu l'*énigme*.", o: "Du grec ainigma, « parole obscure »." },
        { m: "découverte", e: "🔎", n: "nom féminin", d: "Action de trouver ce qui était inconnu ou caché.", f: ["découvrir", "découvreur"], s: ["trouvaille"], c: [], x: "La *découverte* du trésor a surpris tout le monde.", o: "Vient de découvrir : « enlever ce qui couvre »." },
        { m: "histoire", e: "📗", n: "nom féminin", d: "Récit d'événements vrais ou inventés ; étude du passé.", f: ["historien", "historienne", "historique", "préhistoire"], s: ["récit", "conte"], c: [], x: "Le soir, maman me lit une *histoire*.", o: "Du grec historia, « enquête, recherche »." },
        { m: "sauvage", e: "🐺", n: "adjectif", d: "Qui vit en liberté dans la nature ; qui n'est pas apprivoisé.", f: ["sauvagerie", "sauvagement"], s: ["farouche"], c: ["domestique", "apprivoisé"], x: "Le loup est un animal *sauvage*.", o: "Du latin silvaticus, « de la forêt » (silva)." },
        { m: "glisser", e: "🛷", n: "verbe (1er groupe)", d: "Se déplacer en frottant doucement sur une surface lisse.", f: ["glissade", "glissant", "glissière"], s: ["patiner", "déraper"], c: [], x: "Les enfants *glissent* sur la glace du lac gelé.", o: "D'un ancien mot venu du francique, mélangé avec le verbe « glacer »." },
        { m: "frissonner", e: "🥶", n: "verbe (1er groupe)", d: "Trembler légèrement de froid ou de peur.", f: ["frisson"], s: ["grelotter", "trembler"], c: [], x: "En sortant de la piscine, Lucas *frissonne*.", o: "Vient de « frisson », mot venu du latin et lié au froid (frigere, « avoir froid »)." },
        { m: "décorer", e: "🎄", n: "verbe (1er groupe)", d: "Rendre plus beau en ajoutant des ornements.", f: ["décoration", "décorateur", "décor"], s: ["orner", "embellir"], c: [], x: "Nous *décorons* le sapin avec des guirlandes.", o: "Du latin decorare, de decus, « ornement »." },
        { m: "aboyer", e: "🐕", n: "verbe (1er groupe)", d: "Pousser son cri, en parlant du chien.", f: ["aboiement"], s: ["japper"], c: [], x: "Le chien *aboie* quand le facteur arrive.", o: "Mot qui vient d'une imitation du cri du chien." },
        { m: "dessiner", e: "✏️", n: "verbe (1er groupe)", d: "Représenter quelque chose par des traits.", f: ["dessin", "dessinateur", "dessinatrice"], s: ["tracer", "croquer"], c: [], x: "Sophie *dessine* un cheval dans son carnet.", o: "De l'italien disegnare, « dessiner, faire un projet »." },
        { m: "écouter", e: "👂", n: "verbe (1er groupe)", d: "Faire attention à ce que l'on entend.", f: ["écoute", "écouteur"], s: ["entendre", "prêter l'oreille"], c: ["ignorer"], x: "Les élèves *écoutent* l'histoire en silence.", o: "Du latin auscultare, « écouter attentivement »." },
        { m: "ranger", e: "🧹", n: "verbe (1er groupe)", d: "Mettre chaque chose à sa place.", f: ["rangement", "rang", "déranger", "arranger"], s: ["classer", "ordonner"], c: ["déranger", "mélanger"], x: "Avant de jouer, *range* ta chambre !", o: "Vient de « rang », la ligne où chaque chose a sa place." },
        { m: "saluer", e: "👋", n: "verbe (1er groupe)", d: "Dire bonjour ou au revoir par un mot ou un geste.", f: ["salut", "salutation"], s: ["accueillir"], c: ["ignorer"], x: "Le clown *salue* le public à la fin du spectacle.", o: "Du latin salutare, « souhaiter la santé » (salus veut dire « santé »)." },
        { m: "cabane", e: "🛖", n: "nom féminin", d: "Petite construction simple, souvent en bois.", f: ["cabanon"], s: ["hutte", "abri"], c: ["palais"], x: "Nous avons construit une *cabane* au fond du jardin.", o: "Du provençal cabana, du latin capanna, « hutte »." },
        { m: "abri", e: "⛺", n: "nom masculin", d: "Lieu où l'on est protégé de la pluie, du vent ou d'un danger.", f: ["abriter", "sans-abri"], s: ["refuge", "cachette"], c: [], x: "Pendant l'orage, nous avons trouvé un *abri* sous un rocher.", o: "Vient de l'ancien verbe abrier, « mettre à couvert »." },
        { m: "boulanger", e: "🥖", n: "nom masculin (féminin : boulangère)", d: "Personne qui fabrique et vend du pain.", f: ["boulangère", "boulangerie"], s: [], c: [], x: "Le *boulanger* se lève très tôt pour cuire le pain.", o: "Mot venu du picard ; peut-être parce que le pain avait la forme d'une boule." },
        { m: "pompier", e: "🚒", n: "nom masculin", d: "Personne dont le métier est d'éteindre les incendies et de porter secours.", f: ["pompe", "pomper"], s: ["sapeur-pompier"], c: [], x: "Les *pompiers* ont sauvé le chat coincé dans l'arbre.", o: "Vient de « pompe » : autrefois, les pompiers envoyaient l'eau avec des pompes à bras." },
        { m: "médecin", e: "🩺", n: "nom masculin", d: "Personne qui soigne les malades.", f: ["médecine", "médical", "médicament"], s: ["docteur"], c: [], x: "Le *médecin* écoute mon cœur avec son stéthoscope.", o: "Du latin medicus, « celui qui soigne »." },
        { m: "maladroit", e: "🙈", n: "adjectif (féminin : maladroite)", d: "Qui n'est pas habile de ses mains ou de ses gestes.", f: ["maladresse", "maladroitement", "adroit"], s: ["gauche", "malhabile"], c: ["adroit", "habile"], x: "Ce chiot *maladroit* renverse sa gamelle.", o: "De « mal » et « adroit », qui vient de « à droit », « comme il faut »." },
        { m: "mignon", e: "🐱", n: "adjectif (féminin : mignonne)", d: "Joli et gracieux.", f: ["mignonnet", "mignonnette"], s: ["joli", "adorable"], c: ["laid", "vilain"], x: "Quel *mignon* petit chaton !", o: "Vient sans doute de « mignot », ancien mot qui voulait dire « gracieux »." },
        { m: "propre", e: "🧼", n: "adjectif", d: "Qui n'est pas sale.", f: ["propreté", "proprement", "malpropre"], s: ["net", "impeccable"], c: ["sale"], x: "J'ai mis un tee-shirt *propre*.", o: "Du latin proprius, « qui appartient en propre »." },
        { m: "heureux", e: "😊", n: "adjectif (féminin : heureuse)", d: "Qui ressent de la joie, du bonheur.", f: ["bonheur", "heureusement", "malheureux", "malheur"], s: ["content", "joyeux"], c: ["malheureux", "triste"], x: "Je suis *heureux* de te revoir !", o: "Vient de l'ancien mot « heur », « chance », du latin augurium, « présage »." },
        { m: "peureux", e: "😨", n: "adjectif (féminin : peureuse)", d: "Qui a facilement peur.", f: ["peur", "apeuré", "peureusement"], s: ["craintif", "froussard"], c: ["courageux", "intrépide"], x: "Mon chien est *peureux* : il se cache pendant l'orage.", o: "Vient de « peur », du latin pavor, « effroi »." },
        { m: "sage", e: "🧘", n: "adjectif", d: "Qui est calme et obéissant ; qui réfléchit bien avant d'agir.", f: ["sagesse", "sagement"], s: ["raisonnable", "obéissant"], c: ["turbulent", "insensé"], x: "Les enfants ont été très *sages* pendant le voyage.", o: "Du latin populaire sapius, de sapere, « avoir du goût, être intelligent »." },
        { m: "gaspiller", e: "🗑️", n: "verbe (1er groupe)", d: "Utiliser sans faire attention, en perdant une partie.", f: ["gaspillage", "gaspilleur"], s: ["gâcher", "dilapider"], c: ["économiser", "épargner"], x: "Ne *gaspille* pas l'eau en te brossant les dents !", o: "Mot venu de l'ouest de la France, d'origine incertaine." },
        { m: "économiser", e: "🐷", n: "verbe (1er groupe)", d: "Dépenser moins, mettre de côté.", f: ["économie", "économe", "économique"], s: ["épargner"], c: ["gaspiller", "dépenser"], x: "J'*économise* mon argent de poche pour acheter un livre.", o: "Vient de « économie », du grec oikonomia, « gestion de la maison »." },
        { m: "cuisiner", e: "🍳", n: "verbe (1er groupe)", d: "Préparer des plats à manger.", f: ["cuisine", "cuisinier", "cuisinière", "cuisson"], s: ["préparer", "mitonner"], c: [], x: "Ce soir, nous *cuisinons* une soupe de légumes.", o: "Du latin coquina, « cuisine », de coquere, « cuire »." },
        { m: "jongler", e: "🤹", n: "verbe (1er groupe)", d: "Lancer et rattraper plusieurs objets en les faisant tourner en l'air.", f: ["jongleur", "jongleuse", "jonglerie"], s: [], c: [], x: "Le clown *jongle* avec cinq balles.", o: "Du latin joculari, « plaisanter, s'amuser », de jocus, « jeu »." },
        { m: "bouquet", e: "💐", n: "nom masculin", d: "Fleurs coupées et réunies ensemble.", f: ["bouquetière", "bosquet"], s: ["gerbe"], c: [], x: "J'offre un *bouquet* de tulipes à ma mère.", o: "Vient d'un ancien mot picard qui voulait dire « petit bois »." },
        { m: "pique-nique", e: "🥪", n: "nom masculin", d: "Repas pris en plein air.", f: ["pique-niquer", "pique-niqueur"], s: [], c: [], x: "Nous faisons un *pique-nique* au bord du lac.", o: "De « piquer » (picorer) et de « nique », « petite chose » : on picore un peu de tout." },
        { m: "marché", e: "🍅", n: "nom masculin", d: "Lieu où l'on vend et achète des produits, souvent en plein air.", f: ["marchand", "marchande", "marchandise", "marchander"], s: ["foire"], c: [], x: "Le samedi, nous achetons des fruits au *marché*.", o: "Du latin mercatus, « commerce »." },
        { m: "récréation", e: "🛝", n: "nom féminin", d: "Moment de pause où les élèves peuvent jouer.", f: ["récréatif", "se récréer"], s: ["pause", "détente"], c: [], x: "À la *récréation*, nous jouons à la marelle.", o: "Du latin recreatio, « rétablissement » : on reprend des forces." },
        { m: "tonnerre", e: "⚡", n: "nom masculin", d: "Grand bruit qui accompagne l'éclair pendant un orage.", f: ["tonner", "détoner", "détonation"], s: ["grondement"], c: [], x: "Le *tonnerre* gronde au loin.", o: "Du latin tonitrus, « tonnerre »." },
        { m: "automne", e: "🍂", n: "nom masculin", d: "Saison qui suit l'été et précède l'hiver.", f: ["automnal", "automnale"], s: [], c: ["printemps"], x: "En *automne*, les feuilles tombent des arbres.", o: "Du latin autumnus, « automne »." },
        { m: "ombre", e: "🌳", n: "nom féminin", d: "Zone sombre que forme un objet qui cache la lumière.", f: ["ombrelle", "ombrage", "pénombre"], s: ["obscurité"], c: ["lumière", "clarté"], x: "Le chien s'est couché à l'*ombre* du platane.", o: "Du latin umbra, « ombre »." },
        { m: "glace", e: "🧊", n: "nom féminin", d: "Eau devenue solide à cause du froid ; c'est aussi un miroir ou un dessert glacé.", f: ["glacer", "glacial", "glacier", "glaçon", "verglas"], s: ["gel"], c: [], x: "Le lac est couvert de *glace* en hiver.", o: "Du latin glacia, de glacies, « glace »." },
        { m: "soleil", e: "☀️", n: "nom masculin", d: "Étoile qui éclaire et chauffe la Terre.", f: ["ensoleillé", "ensoleillement", "solaire"], s: ["astre du jour"], c: [], x: "Le *soleil* se lève à l'est.", o: "Du latin populaire soliculus, « petit soleil », de sol, « soleil »." },
        { m: "lune", e: "🌙", n: "nom féminin", d: "Astre qui tourne autour de la Terre et brille la nuit.", f: ["lunaire", "alunir", "lunaison", "lundi"], s: ["satellite"], c: [], x: "Ce soir, la *lune* est pleine et ronde.", o: "Du latin luna ; « lundi » veut dire « le jour de la lune »." },
        { m: "cirque", e: "🎪", n: "nom masculin", d: "Spectacle de clowns, d'acrobates et de jongleurs, sous un grand chapiteau.", f: ["cercle", "circulaire", "circuit"], s: ["chapiteau"], c: [], x: "Au *cirque*, l'acrobate marche sur un fil.", o: "Du latin circus, « cercle » : les jeux avaient lieu sur une piste ronde." }
    ],
    '2': [
        { m: "bienveillant", e: "🤝", n: "adjectif (féminin : bienveillante)",
          d: "Qui veut du bien aux autres, qui est gentil et attentionné.",
          f: ["bienveillance", "malveillant", "malveillance"],
          s: ["gentil", "attentionné", "indulgent"], c: ["malveillant", "méchant"],
          x: "La directrice pose un regard *bienveillant* sur ses élèves.",
          o: "De « bien » et de « veillant », ancienne forme du verbe vouloir : celui qui « veut le bien »." },
        { m: "persévérer", e: "🧗", n: "verbe (1er groupe)",
          d: "Continuer ses efforts malgré les difficultés, ne pas abandonner.",
          f: ["persévérance", "persévérant", "persévérante"],
          s: ["persister", "s'obstiner", "s'acharner"], c: ["abandonner", "renoncer"],
          x: "Il faut *persévérer* pour apprendre à jouer du violon.",
          o: "Du latin perseverare, formé sur severus, « sérieux, rigoureux »." },
        { m: "éphémère", e: "🌈", n: "adjectif",
          d: "Qui ne dure qu'un temps très court.",
          f: ["éphéméride"],
          s: ["passager", "bref", "fugace"], c: ["durable", "éternel"],
          x: "Un arc-en-ciel est un spectacle *éphémère*.",
          o: "Du grec ephêmeros, « qui ne dure qu'un jour » (hêmera veut dire « jour »)." },
        { m: "hésiter", e: "🤔", n: "verbe (1er groupe)",
          d: "Ne pas savoir quoi choisir ou quoi faire.",
          f: ["hésitation", "hésitant", "hésitante"],
          s: ["douter", "balancer", "tergiverser"], c: ["se décider", "trancher"],
          x: "Lina *hésite* entre la glace à la fraise et celle au chocolat.",
          o: "Du latin haesitare, « rester accroché, être arrêté »." },
        { m: "solidaire", e: "🫶", n: "adjectif",
          d: "Qui aide les autres et se sent lié à eux.",
          f: ["solidarité", "solide", "consolider"],
          s: ["uni", "fraternel"], c: ["individualiste", "égoïste"],
          x: "Les élèves de la classe sont *solidaires* les uns des autres.",
          o: "Du latin solidus, « solide, entier » : être solidaire, c'est former un tout avec les autres." },
        { m: "curieux", e: "🔍", n: "adjectif (féminin : curieuse)",
          d: "Qui a envie d'apprendre, de savoir, de découvrir.",
          f: ["curiosité", "curieusement"],
          s: ["intéressé", "attentif"], c: ["indifférent"],
          x: "Ce chaton *curieux* renifle chaque recoin de la maison.",
          o: "Du latin curiosus, « qui prend soin », de cura, « soin »." },
        { m: "frontière", e: "🛂", n: "nom féminin",
          d: "Limite qui sépare deux pays.",
          f: ["front", "frontalier", "frontalière", "affronter"],
          s: ["limite", "lisière"], c: [],
          x: "Nous avons passé la *frontière* entre la France et l'Italie.",
          o: "Vient de « front » : c'était la ligne où deux armées se faisaient face." },
        { m: "métamorphose", e: "🦋", n: "nom féminin",
          d: "Changement complet de forme ou d'aspect.",
          f: ["métamorphoser", "se métamorphoser"],
          s: ["transformation", "mutation"], c: [],
          x: "La chenille devient papillon grâce à une *métamorphose*.",
          o: "Du grec meta, « changement », et morphê, « forme »." },
        { m: "vigilant", e: "👀", n: "adjectif (féminin : vigilante)",
          d: "Qui fait très attention, qui surveille avec soin.",
          f: ["vigilance", "veiller", "veilleur", "surveiller"],
          s: ["attentif", "prudent"], c: ["distrait", "imprudent", "négligent"],
          x: "Le gardien reste *vigilant* toute la nuit.",
          o: "Du latin vigilare, « veiller, rester éveillé »." },
        { m: "autonome", e: "🚲", n: "adjectif",
          d: "Qui sait se débrouiller seul, sans l'aide des autres.",
          f: ["autonomie"],
          s: ["indépendant", "libre"], c: ["dépendant"],
          x: "En CM2, les élèves deviennent de plus en plus *autonomes*.",
          o: "Du grec autos, « soi-même », et nomos, « loi » : celui qui se donne ses propres règles." },
        { m: "sinistre", e: "🏚️", n: "adjectif",
          d: "Qui fait peur, qui annonce un malheur.",
          f: ["sinistré", "sinistrée"],
          s: ["lugubre", "effrayant", "inquiétant"], c: ["joyeux", "gai"],
          x: "Un cri *sinistre* résonna dans le vieux château.",
          o: "Du latin sinister, « gauche » : pour les Romains, ce qui venait de la gauche portait malheur." },
        { m: "humble", e: "🙇", n: "adjectif",
          d: "Qui ne se vante pas, qui reste simple et modeste.",
          f: ["humilité", "humblement", "humilier"],
          s: ["modeste", "simple"], c: ["orgueilleux", "vaniteux", "prétentieux"],
          x: "Malgré sa victoire, la championne est restée *humble*.",
          o: "Du latin humilis, « près du sol », de humus, « la terre »." },
        { m: "abondant", e: "🍇", n: "adjectif (féminin : abondante)", d: "Qui existe en grande quantité.", f: ["abondance", "abonder", "abondamment"], s: ["copieux", "nombreux"], c: ["rare", "insuffisant"], x: "Cette année, la récolte de cerises est *abondante*.", o: "Du latin abundans, de unda, « vague, flot » : qui déborde comme une vague." },
        { m: "accueillir", e: "🏡", n: "verbe (3e groupe)", d: "Recevoir quelqu'un qui arrive.", f: ["accueil", "accueillant", "cueillir", "recueillir"], s: ["recevoir", "héberger"], c: ["chasser", "rejeter"], x: "Nous *accueillons* une nouvelle élève dans la classe.", o: "Du latin populaire accolligere, « rassembler auprès de soi »." },
        { m: "admirer", e: "😍", n: "verbe (1er groupe)", d: "Regarder avec plaisir ce que l'on trouve beau ; avoir beaucoup d'estime pour quelqu'un.", f: ["admiration", "admirable", "admirateur"], s: ["contempler", "apprécier"], c: ["mépriser", "dédaigner"], x: "Les touristes *admirent* le coucher de soleil.", o: "Du latin admirari, « s'étonner »." },
        { m: "ancêtre", e: "👴", n: "nom masculin ou féminin", d: "Personne de la famille qui a vécu bien avant nous.", f: ["ancestral", "ancestrale"], s: ["aïeul"], c: ["descendant"], x: "Mes *ancêtres* étaient des marins bretons.", o: "Du latin antecessor, « celui qui marche devant »." },
        { m: "apaiser", e: "🕊️", n: "verbe (1er groupe)", d: "Rendre calme, faire passer la colère ou la douleur.", f: ["paix", "paisible", "apaisement", "apaisant"], s: ["calmer", "adoucir"], c: ["énerver", "exciter"], x: "La musique douce *apaise* le bébé.", o: "Vient de « paix », du latin pax, pacis." },
        { m: "apprivoiser", e: "🦊", n: "verbe (1er groupe)", d: "Rendre un animal moins sauvage, l'habituer à l'homme.", f: ["apprivoisement", "apprivoisé"], s: ["domestiquer", "dresser"], c: ["effaroucher"], x: "Elle a mis des semaines à *apprivoiser* le chat errant.", o: "Du latin populaire apprivitiare, de privatus, « privé, de la maison »." },
        { m: "astucieux", e: "🧠", n: "adjectif (féminin : astucieuse)", d: "Qui trouve des idées habiles pour se débrouiller.", f: ["astuce", "astucieusement"], s: ["ingénieux", "malin", "futé"], c: ["sot", "maladroit"], x: "Ce bricoleur *astucieux* a fabriqué une étagère avec des cagettes.", o: "Vient de « astuce », du latin astutia, « ruse »." },
        { m: "audace", e: "🦅", n: "nom féminin", d: "Courage qui pousse à oser des choses difficiles ou risquées.", f: ["audacieux", "audacieusement"], s: ["hardiesse", "intrépidité"], c: ["timidité", "prudence"], x: "Il a eu l'*audace* de défier le champion.", o: "Du latin audacia, de audere, « oser »." },
        { m: "bouleverser", e: "🌪️", n: "verbe (1er groupe)", d: "Mettre en grand désordre ; émouvoir très fort.", f: ["bouleversement", "bouleversant"], s: ["chambouler", "émouvoir"], c: ["apaiser"], x: "Cette nouvelle l'a profondément *bouleversé*.", o: "De « boule » et « verser » (renverser) : faire rouler sens dessus dessous." },
        { m: "captiver", e: "🎬", n: "verbe (1er groupe)", d: "Retenir toute l'attention, passionner.", f: ["captivant", "captif", "captivité", "capture"], s: ["fasciner", "passionner"], c: ["ennuyer"], x: "Ce film a *captivé* toute la classe.", o: "Du latin captivare, « faire prisonnier » : on est comme prisonnier de l'histoire." },
        { m: "chaleureux", e: "🔥", n: "adjectif (féminin : chaleureuse)", d: "Qui montre beaucoup de gentillesse et d'amitié.", f: ["chaleur", "chaleureusement", "chaud"], s: ["cordial", "accueillant"], c: ["froid", "distant"], x: "Nous avons reçu un accueil *chaleureux*.", o: "Vient de « chaleur », du latin calor." },
        { m: "coopérer", e: "🤝", n: "verbe (1er groupe)", d: "Travailler ensemble pour atteindre un même but.", f: ["coopération", "coopératif", "coopérative"], s: ["collaborer", "s'entraider"], c: ["rivaliser"], x: "Les élèves *coopèrent* pour construire la maquette.", o: "Du latin cooperari, « travailler avec » (opus veut dire « travail »)." },
        { m: "crépuscule", e: "🌇", n: "nom masculin", d: "Moment où le jour tombe, après le coucher du soleil.", f: ["crépusculaire"], s: ["tombée du jour", "soir"], c: ["aube", "aurore"], x: "Au *crépuscule*, les chauves-souris sortent de la grotte.", o: "Du latin crepusculum, de creper, « obscur »." },
        { m: "débrouillard", e: "🛠️", n: "adjectif (féminin : débrouillarde)", d: "Qui sait se tirer d'affaire tout seul.", f: ["se débrouiller", "débrouillardise", "brouiller"], s: ["ingénieux", "malin"], c: ["maladroit", "empoté"], x: "Ce jeune scout *débrouillard* a monté la tente sans aide.", o: "Vient de « se débrouiller » : démêler ce qui était brouillé." },
        { m: "déluge", e: "🌧️", n: "nom masculin", d: "Pluie très abondante et violente.", f: ["diluvien", "antédiluvien"], s: ["trombe d'eau", "averse"], c: ["sécheresse"], x: "Un vrai *déluge* s'est abattu sur la ville.", o: "Du latin diluvium, « inondation »." },
        { m: "dévorer", e: "🦁", n: "verbe (1er groupe)", d: "Manger avidement ; lire avec passion.", f: ["dévorant", "dévoreur", "vorace"], s: ["engloutir", "avaler"], c: ["grignoter"], x: "Ma sœur *dévore* les romans d'aventures.", o: "Du latin devorare, de vorare, « avaler »." },
        { m: "discret", e: "🤫", n: "adjectif (féminin : discrète)", d: "Qui ne se fait pas remarquer ; qui sait garder un secret.", f: ["discrétion", "discrètement", "indiscret"], s: ["réservé", "effacé"], c: ["indiscret", "bavard", "voyant"], x: "Sois *discret*, c'est une surprise pour maman.", o: "Du latin discretus, « séparé », celui qui sait faire la différence." },
        { m: "distraire", e: "🎈", n: "verbe (3e groupe)", d: "Détourner l'attention ; amuser.", f: ["distraction", "distrait", "distrayant"], s: ["amuser", "divertir"], c: ["ennuyer"], x: "Le bruit dans le couloir *distrait* les élèves.", o: "Du latin distrahere, « tirer en sens contraires »." },
        { m: "docile", e: "🐴", n: "adjectif", d: "Qui obéit facilement.", f: ["docilité", "docilement"], s: ["obéissant", "soumis"], c: ["rebelle", "désobéissant"], x: "Ce poney *docile* convient aux débutants.", o: "Du latin docilis, « qui apprend facilement », de docere, « enseigner »." },
        { m: "effrayer", e: "👻", n: "verbe (1er groupe)", d: "Faire peur.", f: ["effrayant", "effroi", "frayeur"], s: ["épouvanter", "terrifier"], c: ["rassurer"], x: "Le hurlement du loup *effraie* les moutons.", o: "Du latin populaire exfridare, « faire sortir de la paix »." },
        { m: "élégant", e: "👗", n: "adjectif (féminin : élégante)", d: "Habillé ou fait avec goût et raffinement.", f: ["élégance", "élégamment"], s: ["chic", "raffiné", "distingué"], c: ["négligé", "vulgaire"], x: "Pour le mariage, mon oncle porte un costume *élégant*.", o: "Du latin elegans, « qui sait choisir »." },
        { m: "émerveiller", e: "🤩", n: "verbe (1er groupe)", d: "Remplir d'admiration.", f: ["merveille", "merveilleux", "émerveillement"], s: ["éblouir", "enchanter"], c: ["décevoir"], x: "Le feu d'artifice a *émerveillé* les enfants.", o: "Vient de « merveille », du latin mirabilia, « choses étonnantes »." },
        { m: "enthousiasme", e: "🎉", n: "nom masculin", d: "Grande joie et grande envie de faire quelque chose.", f: ["enthousiaste", "enthousiasmer"], s: ["ardeur", "entrain", "passion"], c: ["indifférence", "ennui"], x: "Les élèves ont accueilli la sortie avec *enthousiasme*.", o: "Du grec enthousiasmos, « transport divin » : comme si un dieu nous inspirait." },
        { m: "épuisé", e: "😩", n: "adjectif (féminin : épuisée)", d: "Extrêmement fatigué ; qui n'existe plus en stock.", f: ["épuiser", "épuisement", "inépuisable", "puits"], s: ["exténué", "harassé"], c: ["reposé", "en forme"], x: "Après le marathon, la coureuse était *épuisée*.", o: "Vient de « puits » : épuiser, c'était vider un puits jusqu'au fond." },
        { m: "escalader", e: "🧗", n: "verbe (1er groupe)", d: "Grimper sur quelque chose de haut.", f: ["escalade", "escalier"], s: ["gravir", "grimper"], c: ["descendre", "dévaler"], x: "Les alpinistes *escaladent* la paroi rocheuse.", o: "Du latin scala, « échelle »." },
        { m: "espiègle", e: "😜", n: "adjectif", d: "Vif et malicieux, qui aime faire des farces sans méchanceté.", f: ["espièglerie"], s: ["malicieux", "coquin", "taquin"], c: ["sage", "sérieux"], x: "Ce lutin *espiègle* cache les chaussettes de tout le monde.", o: "Vient de Till Eulenspiegel, personnage farceur d'un vieux livre allemand." },
        { m: "étonner", e: "😲", n: "verbe (1er groupe)", d: "Surprendre quelqu'un.", f: ["étonnement", "étonnant", "étonné"], s: ["surprendre", "stupéfier"], c: [], x: "Sa réponse rapide a *étonné* le maître.", o: "Du latin populaire extonare, « frapper du tonnerre »." },
        { m: "évasion", e: "🏃", n: "nom féminin", d: "Fuite d'un endroit où l'on est enfermé ; moment où l'on s'échappe par l'esprit.", f: ["s'évader", "évadé", "évadée"], s: ["fuite", "échappée"], c: ["capture", "emprisonnement"], x: "Le roman raconte l'*évasion* d'un prisonnier.", o: "Du latin evadere, « sortir, s'échapper »." },
        { m: "exceptionnel", e: "🌟", n: "adjectif (féminin : exceptionnelle)", d: "Qui sort de l'ordinaire, rare.", f: ["exception", "exceptionnellement"], s: ["extraordinaire", "remarquable"], c: ["ordinaire", "banal"], x: "Ce match était *exceptionnel*.", o: "Vient de « exception », du latin exceptio, « action de mettre à part »." },
        { m: "exiger", e: "☝️", n: "verbe (1er groupe)", d: "Demander avec autorité, comme une obligation.", f: ["exigence", "exigeant"], s: ["réclamer", "imposer"], c: ["dispenser", "renoncer"], x: "Le règlement *exige* le silence dans la bibliothèque.", o: "Du latin exigere, « pousser dehors, réclamer »." },
        { m: "fabuleux", e: "🦄", n: "adjectif (féminin : fabuleuse)", d: "Qui appartient aux fables, aux légendes ; extraordinaire.", f: ["fable", "fabuliste", "fabuler"], s: ["légendaire", "merveilleux"], c: ["ordinaire", "réel"], x: "La licorne est un animal *fabuleux*.", o: "Du latin fabulosus, de fabula, « récit »." },
        { m: "farouche", e: "🦌", n: "adjectif", d: "Sauvage, qui fuit quand on s'approche ; très fort (une volonté farouche).", f: ["farouchement", "effaroucher"], s: ["sauvage", "craintif"], c: ["apprivoisé", "sociable"], x: "Ce chat *farouche* se cache dès qu'on entre.", o: "Du latin forasticus, « qui est dehors, étranger »." },
        { m: "festin", e: "🍗", n: "nom masculin", d: "Repas de fête, très copieux.", f: ["fête", "festif", "festoyer"], s: ["banquet", "régal"], c: [], x: "Pour l'anniversaire de Mamie, nous avons préparé un vrai *festin*.", o: "De l'italien festino, « petite fête »." },
        { m: "fidèle", e: "🐕", n: "adjectif", d: "Qui reste attaché, qui ne trahit pas.", f: ["fidélité", "fidèlement", "infidèle"], s: ["loyal", "dévoué"], c: ["infidèle", "traître"], x: "Le chien est le compagnon *fidèle* du berger.", o: "Du latin fidelis, de fides, « confiance, foi »." },
        { m: "flâner", e: "🚶", n: "verbe (1er groupe)", d: "Se promener sans but, en prenant son temps.", f: ["flânerie", "flâneur", "flâneuse"], s: ["se balader", "musarder"], c: ["se dépêcher"], x: "Le dimanche, nous *flânons* dans les rues du vieux village.", o: "D'un mot normand venu des Vikings, qui voulait dire « courir çà et là »." },
        { m: "fraternité", e: "👫", n: "nom féminin", d: "Lien d'affection et d'entraide entre les personnes, comme entre frères et sœurs.", f: ["frère", "fraternel", "fraterniser"], s: ["solidarité", "amitié"], c: ["hostilité", "haine"], x: "La devise de la France est : Liberté, Égalité, *Fraternité*.", o: "Du latin fraternitas, de frater, « frère »." },
        { m: "frémir", e: "😨", n: "verbe (2e groupe)", d: "Trembler légèrement de peur, de froid ou d'émotion ; commencer à bouillir.", f: ["frémissement", "frémissant"], s: ["frissonner", "trembler"], c: [], x: "L'eau *frémit* dans la casserole.", o: "Du latin populaire fremire, de fremere, « gronder »." },
        { m: "fugitif", e: "🚔", n: "nom ou adjectif (féminin : fugitive)", d: "Qui s'est enfui ; qui ne dure pas.", f: ["fuir", "fuite", "fugue", "fuyard"], s: ["fuyard", "évadé"], c: ["prisonnier", "captif"], x: "La police recherche le *fugitif*.", o: "Du latin fugitivus, de fugere, « fuir »." },
        { m: "gratitude", e: "💐", n: "nom féminin", d: "Sentiment de reconnaissance envers quelqu'un qui nous a aidés.", f: ["ingratitude", "ingrat", "gré"], s: ["reconnaissance"], c: ["ingratitude"], x: "Pour montrer leur *gratitude*, les élèves ont écrit une carte à la cantinière.", o: "Du latin gratus, « reconnaissant »." },
        { m: "gouffre", e: "🕳️", n: "nom masculin", d: "Trou très profond dans le sol.", f: ["s'engouffrer", "golfe"], s: ["abîme", "précipice"], c: ["sommet"], x: "Les spéléologues descendent au fond du *gouffre*.", o: "Du grec kolpos, « creux, golfe », passé par le latin." },
        { m: "hardi", e: "⚔️", n: "adjectif (féminin : hardie)", d: "Qui ose, courageux.", f: ["hardiesse", "hardiment", "enhardir"], s: ["audacieux", "intrépide"], c: ["timide", "craintif"], x: "Le *hardi* chevalier entra dans la caverne du dragon.", o: "Vient d'un verbe francique qui voulait dire « rendre dur »." },
        { m: "harmonie", e: "🎶", n: "nom féminin", d: "Accord agréable entre des sons, des couleurs, ou entre des personnes.", f: ["harmonieux", "harmoniser", "harmonica"], s: ["accord", "entente"], c: ["désaccord", "discorde"], x: "Les élèves de la chorale chantent en *harmonie*.", o: "Du grec harmonia, « assemblage, accord »." },
        { m: "héritage", e: "🗝️", n: "nom masculin", d: "Ce que l'on reçoit d'une personne qui est morte ; ce que nous laissent ceux d'avant.", f: ["hériter", "héritier", "héritière", "héréditaire"], s: ["legs", "patrimoine"], c: [], x: "Ce vieux piano est un *héritage* de mon arrière-grand-mère.", o: "Vient de « hériter », du latin hereditare, de heres, « héritier »." },
        { m: "horizon", e: "🌅", n: "nom masculin", d: "Ligne où le ciel semble toucher la terre ou la mer.", f: ["horizontal", "horizontalement"], s: ["lointain"], c: [], x: "Le soleil disparaît à l'*horizon*.", o: "Du grec horizôn, « qui limite »." },
        { m: "hostile", e: "😾", n: "adjectif", d: "Qui se montre ennemi ; difficile pour la vie.", f: ["hostilité"], s: ["ennemi", "agressif"], c: ["amical", "accueillant"], x: "Le désert est un milieu *hostile*.", o: "Du latin hostis, « ennemi »." },
        { m: "imaginer", e: "🌈", n: "verbe (1er groupe)", d: "Se représenter quelque chose dans sa tête ; inventer.", f: ["imagination", "image", "imaginaire", "inimaginable"], s: ["concevoir", "inventer"], c: [], x: "*Imagine* un monde sans voitures !", o: "Du latin imaginari, de imago, « image »." },
        { m: "impatient", e: "⏳", n: "adjectif (féminin : impatiente)", d: "Qui a du mal à attendre.", f: ["impatience", "s'impatienter", "patient"], s: ["pressé", "fébrile"], c: ["patient", "calme"], x: "Les enfants sont *impatients* d'ouvrir leurs cadeaux.", o: "Du latin impatiens, « qui ne supporte pas »." },
        { m: "imprévu", e: "🎲", n: "adjectif ou nom masculin", d: "Qu'on n'avait pas prévu.", f: ["prévoir", "prévision", "imprévisible"], s: ["inattendu", "soudain"], c: ["prévu", "attendu"], x: "Un orage *imprévu* a gâché le pique-nique.", o: "De im-, « non », et « prévu », du verbe prévoir, « voir avant »." },
        { m: "incendie", e: "🧯", n: "nom masculin", d: "Grand feu qui détruit et se propage.", f: ["incendier", "incendiaire"], s: ["feu", "brasier"], c: [], x: "Les pompiers ont maîtrisé l'*incendie* de la forêt.", o: "Du latin incendium, de incendere, « mettre le feu »." },
        { m: "indispensable", e: "🔑", n: "adjectif", d: "Dont on ne peut pas se passer.", f: ["dispenser", "dispense"], s: ["nécessaire", "essentiel", "vital"], c: ["inutile", "superflu"], x: "L'eau est *indispensable* à la vie.", o: "De in-, « non », et « dispensable » : dont on ne peut pas être dispensé." },
        { m: "inquiet", e: "😟", n: "adjectif (féminin : inquiète)", d: "Qui se fait du souci.", f: ["inquiétude", "inquiéter", "inquiétant"], s: ["anxieux", "soucieux"], c: ["serein", "tranquille"], x: "Maman est *inquiète* car il est tard.", o: "Du latin inquietus, « qui n'est pas en repos »." },
        { m: "insolite", e: "👾", n: "adjectif", d: "Étonnant, inhabituel.", f: [], s: ["étrange", "bizarre", "surprenant"], c: ["banal", "habituel"], x: "Un kangourou dans la cour : quelle scène *insolite* !", o: "Du latin insolitus, « inhabituel »." },
        { m: "intrus", e: "🦹", n: "nom masculin (féminin : intruse)", d: "Personne ou chose qui n'est pas à sa place, qui entre sans être invitée.", f: ["intrusion"], s: ["importun"], c: ["invité", "hôte"], x: "Trouve l'*intrus* dans cette liste de mots.", o: "Du latin intrusus, « poussé dedans »." },
        { m: "jaillir", e: "⛲", n: "verbe (2e groupe)", d: "Sortir brusquement et avec force.", f: ["jaillissement", "jaillissant"], s: ["gicler", "surgir"], c: [], x: "L'eau *jaillit* de la fontaine.", o: "Mot d'origine incertaine, peut-être gaulois." },
        { m: "labyrinthe", e: "🌀", n: "nom masculin", d: "Ensemble compliqué de chemins où l'on se perd facilement.", f: ["labyrinthique"], s: ["dédale"], c: [], x: "Thésée a trouvé la sortie du *labyrinthe* grâce au fil d'Ariane.", o: "Du grec laburinthos : selon la légende, le palais du Minotaure en Crète." },
        { m: "lueur", e: "🕯️", n: "nom féminin", d: "Lumière faible.", f: ["luire", "luisant", "lumière"], s: ["clarté", "reflet"], c: ["obscurité"], x: "La *lueur* de la bougie éclaire la pièce.", o: "Du latin lucor, de lucere, « briller »." },
        { m: "majestueux", e: "👑", n: "adjectif (féminin : majestueuse)", d: "Qui a de la grandeur, de la noblesse.", f: ["majesté", "majestueusement"], s: ["imposant", "grandiose"], c: ["insignifiant", "modeste"], x: "Un aigle *majestueux* plane au-dessus des montagnes.", o: "Vient de « majesté », du latin majestas, « grandeur »." },
        { m: "menacer", e: "🌩️", n: "verbe (1er groupe)", d: "Faire peur en annonçant un mal ; être sur le point de se produire.", f: ["menace", "menaçant"], s: ["intimider", "effrayer"], c: ["protéger", "rassurer"], x: "La pluie *menace* de tomber.", o: "Du latin minacia, « menace »." },
        { m: "minutieux", e: "🔬", n: "adjectif (féminin : minutieuse)", d: "Qui fait les choses avec beaucoup de soin, dans les moindres détails.", f: ["minutie", "minutieusement"], s: ["soigneux", "méticuleux"], c: ["négligent"], x: "L'horloger fait un travail *minutieux*.", o: "Vient de « minutie », du latin minutia, « petite parcelle »." },
        { m: "murmurer", e: "🌬️", n: "verbe (1er groupe)", d: "Parler à voix basse ; faire un bruit léger et continu.", f: ["murmure"], s: ["chuchoter"], c: ["crier"], x: "Le ruisseau *murmure* entre les pierres.", o: "Du latin murmurare, mot qui imite le bruit." },
        { m: "naufrage", e: "🛟", n: "nom masculin", d: "Fait pour un bateau de couler.", f: ["naufragé", "naufragée"], s: ["perte"], c: [], x: "Après le *naufrage*, les marins ont nagé jusqu'à l'île.", o: "Du latin naufragium, de navis, « bateau », et frangere, « briser »." },
        { m: "négliger", e: "🙄", n: "verbe (1er groupe)", d: "Ne pas s'occuper de quelque chose, ne pas en prendre soin.", f: ["négligence", "négligent", "négligeable"], s: ["délaisser", "oublier"], c: ["soigner", "s'occuper de"], x: "Ne *néglige* pas tes devoirs !", o: "Du latin negligere, « ne pas s'occuper de »." },
        { m: "orgueil", e: "🦚", n: "nom masculin", d: "Sentiment de se croire supérieur aux autres.", f: ["orgueilleux", "orgueilleusement"], s: ["vanité", "prétention"], c: ["humilité", "modestie"], x: "Par *orgueil*, il refuse d'avouer son erreur.", o: "D'un mot francique qui voulait dire « fierté »." },
        { m: "paisible", e: "🌾", n: "adjectif", d: "Calme, tranquille.", f: ["paix", "paisiblement", "apaiser"], s: ["tranquille", "serein"], c: ["agité", "bruyant"], x: "Le village est *paisible* le dimanche matin.", o: "Vient de « paix », du latin pax." },
        { m: "panique", e: "😱", n: "nom féminin", d: "Peur soudaine et violente qui fait perdre le contrôle.", f: ["paniquer", "paniqué"], s: ["affolement", "terreur"], c: ["calme", "sang-froid"], x: "Quand l'alarme a sonné, il n'y a pas eu de *panique*.", o: "Du dieu grec Pan, qui effrayait les voyageurs dans les bois." },
        { m: "patrimoine", e: "🏛️", n: "nom masculin", d: "Ensemble des richesses (monuments, traditions, nature) héritées du passé.", f: ["patrimonial", "patrie", "paternel"], s: ["héritage", "trésor"], c: [], x: "Ce château fait partie du *patrimoine* de notre région.", o: "Du latin patrimonium, « bien hérité du père »." },
        { m: "pénible", e: "😓", n: "adjectif", d: "Qui demande beaucoup d'efforts ; désagréable.", f: ["peine", "péniblement"], s: ["difficile", "fatigant"], c: ["facile", "agréable"], x: "La montée vers le refuge a été *pénible*.", o: "Vient de « peine », du latin poena, « punition »." },
        { m: "péril", e: "⚠️", n: "nom masculin", d: "Grand danger.", f: ["périlleux", "périlleuse"], s: ["danger", "risque"], c: ["sécurité"], x: "Les sauveteurs ont mis leur vie en *péril*.", o: "Du latin periculum, « essai, danger »." },
        { m: "prodige", e: "🎻", n: "nom masculin", d: "Chose extraordinaire ; enfant aux talents exceptionnels.", f: ["prodigieux", "prodigieusement"], s: ["merveille", "miracle", "génie"], c: ["banalité"], x: "Mozart était un enfant *prodige*.", o: "Du latin prodigium, « signe extraordinaire »." },
        { m: "quiétude", e: "😌", n: "nom féminin", d: "Tranquillité, calme.", f: ["inquiétude", "inquiet"], s: ["calme", "sérénité"], c: ["agitation", "inquiétude"], x: "Le chat dort en toute *quiétude*.", o: "Du latin quietudo, de quies, « repos »." },
        { m: "rayonner", e: "☀️", n: "verbe (1er groupe)", d: "Envoyer des rayons de lumière ; montrer un grand bonheur.", f: ["rayon", "rayonnant", "rayonnement"], s: ["briller", "resplendir"], c: ["s'assombrir"], x: "Le jour de son anniversaire, Léa *rayonne* de joie.", o: "Vient de « rayon », du latin radius, « baguette, rayon »." },
        { m: "redoutable", e: "🦈", n: "adjectif", d: "Qui fait peur ; très dangereux ou très fort.", f: ["redouter", "douter"], s: ["terrible", "dangereux"], c: ["inoffensif"], x: "Le requin blanc est un prédateur *redoutable*.", o: "Vient de « redouter » ; au Moyen Âge, « douter » voulait aussi dire « craindre »." },
        { m: "refuge", e: "🏔️", n: "nom masculin", d: "Lieu où l'on peut se mettre à l'abri.", f: ["se réfugier", "réfugié", "fuir"], s: ["abri", "asile"], c: [], x: "Les randonneurs passent la nuit dans un *refuge* de montagne.", o: "Du latin refugium, de fugere, « fuir »." },
        { m: "remords", e: "😔", n: "nom masculin", d: "Regret douloureux d'avoir mal agi.", f: ["mordre", "morsure"], s: ["regret", "repentir"], c: [], x: "Il a eu des *remords* après avoir menti à son ami.", o: "Du verbe « remordre » : la faute nous « mord » encore et encore." },
        { m: "renoncer", e: "🏳️", n: "verbe (1er groupe)", d: "Abandonner l'idée de faire ou d'avoir quelque chose.", f: ["renoncement", "renonciation"], s: ["abandonner", "se résigner"], c: ["persévérer", "s'obstiner"], x: "À cause de la pluie, nous avons *renoncé* à la promenade.", o: "Du latin renuntiare, « annoncer en retour, refuser »." },
        { m: "repérer", e: "📍", n: "verbe (1er groupe)", d: "Trouver, remarquer, situer précisément.", f: ["repère", "repérage"], s: ["localiser", "apercevoir"], c: ["perdre de vue"], x: "J'ai *repéré* ta maison sur la carte.", o: "Vient de « repère », marque qui sert à retrouver un endroit." },
        { m: "résister", e: "🛡️", n: "verbe (1er groupe)", d: "Tenir bon, ne pas céder.", f: ["résistance", "résistant", "irrésistible"], s: ["tenir bon", "s'opposer"], c: ["céder", "capituler"], x: "Ce pont a *résisté* à la tempête.", o: "Du latin resistere, « s'arrêter, tenir tête »." },
        { m: "rivage", e: "🏖️", n: "nom masculin", d: "Bord de la mer ou d'un lac.", f: ["rive", "riverain", "rivière"], s: ["côte", "littoral"], c: ["large"], x: "Les vagues viennent mourir sur le *rivage*.", o: "Vient de « rive », du latin ripa." },
        { m: "robuste", e: "💪", n: "adjectif", d: "Fort, résistant.", f: ["robustesse"], s: ["solide", "vigoureux"], c: ["fragile", "chétif"], x: "Ce cheval *robuste* tire la charrette sans effort.", o: "Du latin robustus, « fort comme le chêne » (robur)." },
        { m: "scintiller", e: "✨", n: "verbe (1er groupe)", d: "Briller en lançant de petits éclats de lumière.", f: ["scintillement", "scintillant", "étincelle"], s: ["étinceler", "briller"], c: [], x: "Les étoiles *scintillent* dans le ciel d'été.", o: "Du latin scintillare, de scintilla, « étincelle »." },
        { m: "sensible", e: "💗", n: "adjectif", d: "Qui ressent facilement les émotions ; qui réagit au moindre contact.", f: ["sensibilité", "sens", "sensation", "insensible"], s: ["émotif", "délicat"], c: ["insensible", "dur"], x: "Mon petit frère est très *sensible* : il pleure devant les films tristes.", o: "Du latin sensibilis, de sentire, « ressentir »." },
        { m: "silhouette", e: "👤", n: "nom féminin", d: "Forme sombre d'une personne ou d'un objet qui se découpe sur un fond clair.", f: ["silhouetter"], s: ["contour", "ombre"], c: [], x: "On aperçoit la *silhouette* d'un randonneur sur la crête.", o: "Du nom d'Étienne de Silhouette, ministre de Louis XV moqué pour ses économies : on appelait « à la silhouette » les choses faites à moindre frais." },
        { m: "sincère", e: "💬", n: "adjectif", d: "Qui dit ce qu'il pense vraiment.", f: ["sincérité", "sincèrement"], s: ["franc", "honnête"], c: ["hypocrite", "menteur"], x: "Merci pour ta réponse *sincère*.", o: "Du latin sincerus, « pur, sans mélange »." },
        { m: "soulagement", e: "😮‍💨", n: "nom masculin", d: "Bien-être que l'on ressent quand une peine ou une inquiétude disparaît.", f: ["soulager", "léger"], s: ["apaisement", "réconfort"], c: ["angoisse", "inquiétude"], x: "Quel *soulagement* d'avoir retrouvé mon chat !", o: "Vient de « soulager », du latin populaire subleviare, « alléger »." },
        { m: "stratégie", e: "♟️", n: "nom féminin", d: "Plan d'action réfléchi pour atteindre un but.", f: ["stratège", "stratégique"], s: ["tactique", "plan"], c: ["improvisation"], x: "Notre équipe a mis au point une *stratégie* pour gagner.", o: "Du grec stratêgos, « chef d'armée »." },
        { m: "surgir", e: "🐇", n: "verbe (2e groupe)", d: "Apparaître brusquement.", f: ["resurgir", "source"], s: ["apparaître", "jaillir"], c: ["disparaître"], x: "Un lapin a *surgi* d'un buisson.", o: "Du latin surgere, « se lever »." },
        { m: "tenace", e: "🧲", n: "adjectif", d: "Qui ne lâche pas, qui persévère ; qui dure.", f: ["ténacité", "tenir"], s: ["obstiné", "persévérant"], c: ["changeant"], x: "Cette tache est très *tenace* !", o: "Du latin tenax, de tenere, « tenir »." },
        { m: "tourbillon", e: "🌀", n: "nom masculin", d: "Masse d'air ou d'eau qui tourne très vite.", f: ["tourbillonner", "tourbillonnant"], s: ["remous", "tornade"], c: [], x: "Le vent soulève un *tourbillon* de feuilles.", o: "Du latin turbo, « toupie, tourbillon »." },
        { m: "tranquille", e: "🏞️", n: "adjectif", d: "Calme, sans agitation.", f: ["tranquillité", "tranquillement", "tranquilliser"], s: ["paisible", "serein"], c: ["agité", "inquiet"], x: "Laisse le chat *tranquille*, il dort.", o: "Du latin tranquillus, « calme »." },
        { m: "triomphe", e: "🏆", n: "nom masculin", d: "Grande victoire ; immense succès.", f: ["triompher", "triomphal", "triomphant"], s: ["victoire", "succès"], c: ["échec", "défaite"], x: "La pièce de théâtre a été un *triomphe*.", o: "Du latin triumphus : à Rome, le défilé d'un général vainqueur." },
        { m: "tumulte", e: "📣", n: "nom masculin", d: "Grand désordre bruyant.", f: ["tumultueux", "tumultueuse"], s: ["vacarme", "chahut"], c: ["calme", "silence"], x: "La sonnerie s'est perdue dans le *tumulte* de la cour.", o: "Du latin tumultus, « agitation »." },
        { m: "vagabond", e: "🎒", n: "nom ou adjectif (féminin : vagabonde)", d: "Personne qui erre sans domicile ; qui va çà et là.", f: ["vagabonder", "vagabondage"], s: ["errant", "nomade"], c: ["sédentaire"], x: "Le chien *vagabond* a enfin trouvé une famille.", o: "Du latin vagari, « errer »." },
        { m: "vaste", e: "🗺️", n: "adjectif", d: "Très étendu, très grand.", f: ["dévaster", "dévastation"], s: ["immense", "étendu"], c: ["étroit", "restreint"], x: "La Russie est un *vaste* pays.", o: "Du latin vastus, « vide, désert, immense »." },
        { m: "vertige", e: "😵", n: "nom masculin", d: "Sensation que tout tourne ; peur du vide.", f: ["vertigineux", "vertigineuse"], s: ["étourdissement"], c: [], x: "Au sommet de la tour, j'ai eu le *vertige*.", o: "Du latin vertigo, de vertere, « tourner »." },
        { m: "victoire", e: "🥇", n: "nom féminin", d: "Fait de gagner.", f: ["vainqueur", "victorieux", "vaincre", "invincible"], s: ["succès", "triomphe"], c: ["défaite", "échec"], x: "Les supporters fêtent la *victoire* de leur équipe.", o: "Du latin victoria, de vincere, « vaincre »." },
        { m: "vivace", e: "🌿", n: "adjectif", d: "Qui vit longtemps, qui résiste ; qui dure.", f: ["vivacité", "vivre", "survivre"], s: ["résistant", "durable"], c: ["éphémère"], x: "La lavande est une plante *vivace*.", o: "Du latin vivax, « qui vit longtemps »." },
        { m: "volontaire", e: "🙋", n: "adjectif ou nom", d: "Qui agit de lui-même, sans y être obligé ; décidé.", f: ["volonté", "volontairement", "vouloir", "volontiers"], s: ["bénévole", "décidé"], c: ["involontaire", "forcé"], x: "Qui est *volontaire* pour effacer le tableau ?", o: "Du latin voluntarius, de voluntas, « volonté »." },
        { m: "zèle", e: "🐝", n: "nom masculin", d: "Grande ardeur à faire quelque chose.", f: ["zélé", "zélée"], s: ["ardeur", "empressement"], c: ["négligence", "paresse"], x: "Il range la classe avec *zèle*.", o: "Du grec zêlos, « ardeur »." },
        { m: "adroit", e: "🎯", n: "adjectif (féminin : adroite)", d: "Habile de ses mains ou de son corps.", f: ["adresse", "adroitement", "maladroit"], s: ["habile", "agile"], c: ["maladroit", "gauche"], x: "Ce lanceur *adroit* touche toujours la cible.", o: "De « à droit », c'est-à-dire « comme il faut »." },
        { m: "ardu", e: "⛰️", n: "adjectif (féminin : ardue)", d: "Très difficile.", f: [], s: ["difficile", "pénible"], c: ["facile", "aisé"], x: "Ce problème de maths est *ardu*.", o: "Du latin arduus, « escarpé, raide »." },
        { m: "butiner", e: "🌼", n: "verbe (1er groupe)", d: "Aller de fleur en fleur pour récolter le nectar et le pollen.", f: ["butin", "butineuse"], s: [], c: [], x: "Les abeilles *butinent* les fleurs de lavande.", o: "Vient de « butin » : l'abeille récolte son trésor dans les fleurs." },
        { m: "citoyen", e: "🗳️", n: "nom masculin (féminin : citoyenne)", d: "Personne qui fait partie d'un pays, avec des droits et des devoirs.", f: ["citoyenneté", "cité"], s: [], c: [], x: "À 18 ans, chaque *citoyen* peut voter.", o: "Vient de « cité », du latin civitas, « ensemble des citoyens »." },
        { m: "compatir", e: "🫂", n: "verbe (2e groupe)", d: "Partager la peine de quelqu'un.", f: ["compassion", "compatissant"], s: ["s'apitoyer", "consoler"], c: [], x: "Je *compatis* à ta tristesse.", o: "Du latin compati, « souffrir avec »." },
        { m: "contempler", e: "🌄", n: "verbe (1er groupe)", d: "Regarder longuement, avec admiration.", f: ["contemplation", "contemplatif"], s: ["admirer", "observer"], c: ["ignorer"], x: "Nous *contemplons* les vagues depuis la falaise.", o: "Du latin contemplari, « observer attentivement »." },
        { m: "convoiter", e: "🤤", n: "verbe (1er groupe)", d: "Désirer très fort ce que l'on n'a pas.", f: ["convoitise"], s: ["désirer", "envier"], c: ["dédaigner"], x: "Le renard *convoite* le fromage du corbeau.", o: "Du latin populaire cupidietare, de cupiditas, « désir »." },
        { m: "déborder", e: "🥛", n: "verbe (1er groupe)", d: "Couler par-dessus les bords.", f: ["bord", "débordement", "débordant"], s: ["se répandre"], c: [], x: "Après l'orage, la rivière a *débordé*.", o: "De dé- et « bord » : passer par-dessus le bord." },
        { m: "déguster", e: "🍫", n: "verbe (1er groupe)", d: "Goûter avec attention et plaisir.", f: ["dégustation"], s: ["savourer"], c: ["engloutir"], x: "Nous *dégustons* un chocolat chaud au coin du feu.", o: "Du latin degustare, de gustus, « goût »." },
        { m: "écho", e: "📯", n: "nom masculin", d: "Son qui revient après avoir rebondi sur un obstacle.", f: ["échographie"], s: ["résonance"], c: [], x: "Dans la montagne, l'*écho* répète nos cris.", o: "Du grec êkhô ; dans la mythologie, Écho est une nymphe condamnée à répéter les derniers mots qu'elle entend." },
        { m: "ébahi", e: "😮", n: "adjectif (féminin : ébahie)", d: "Très étonné, bouche bée.", f: ["ébahir", "ébahissement"], s: ["stupéfait", "médusé"], c: ["indifférent"], x: "Les enfants restent *ébahis* devant le magicien.", o: "De l'ancien verbe baer, « ouvrir la bouche »." },
        { m: "effleurer", e: "🦋", n: "verbe (1er groupe)", d: "Toucher très légèrement.", f: ["fleur", "effleurement"], s: ["frôler", "caresser"], c: ["appuyer", "heurter"], x: "Le papillon a *effleuré* ma joue.", o: "Vient de « fleur » : au début, c'était enlever la fleur, c'est-à-dire la surface." },
        { m: "émouvoir", e: "🥹", n: "verbe (3e groupe)", d: "Toucher le cœur, provoquer une émotion.", f: ["émotion", "émouvant", "ému", "émotif"], s: ["toucher", "bouleverser"], c: [], x: "Le discours de la maîtresse a *ému* les parents.", o: "Du latin emovere, « mettre en mouvement »." },
        { m: "envoûter", e: "🔮", n: "verbe (1er groupe)", d: "Charmer comme par magie.", f: ["envoûtement", "envoûtant"], s: ["ensorceler", "captiver"], c: [], x: "Cette mélodie *envoûte* le public.", o: "De l'ancien mot vout, « visage, image » : les sorciers fabriquaient une figurine de leur victime." },
        { m: "épopée", e: "🗡️", n: "nom féminin", d: "Long récit d'aventures héroïques ; suite d'événements extraordinaires.", f: ["épique"], s: ["saga", "odyssée"], c: [], x: "Le voyage d'Ulysse est une véritable *épopée*.", o: "Du grec epos, « parole, récit », et poiein, « faire »." },
        { m: "éruption", e: "🌋", n: "nom féminin", d: "Sortie brutale de lave, de cendres et de gaz par un volcan.", f: ["éruptif", "éruptive"], s: ["explosion"], c: [], x: "L'*éruption* du volcan a duré plusieurs jours.", o: "Du latin eruptio, de erumpere, « sortir avec force »." },
        { m: "migration", e: "🦢", n: "nom féminin", d: "Déplacement d'animaux ou de personnes d'une région vers une autre.", f: ["migrer", "migrateur", "émigrer", "immigré"], s: ["déplacement", "exode"], c: ["sédentarité"], x: "La *migration* des cigognes vers l'Afrique commence en août.", o: "Du latin migratio, de migrare, « changer de séjour »." },
        { m: "nocturne", e: "🦉", n: "adjectif", d: "Qui a lieu ou qui vit la nuit.", f: ["nuit", "nuitée"], s: [], c: ["diurne"], x: "La chouette est un oiseau *nocturne*.", o: "Du latin nocturnus, de nox, noctis, « nuit »." },
        { m: "abîmer", e: "💔", n: "verbe (1er groupe)", d: "Endommager, détériorer.", f: ["abîme", "abîmé"], s: ["détériorer", "endommager"], c: ["réparer"], x: "La pluie a *abîmé* mon livre.", o: "Vient de « abîme » : au début, abîmer voulait dire « jeter dans l'abîme »." },
        { m: "entraide", e: "🧑‍🤝‍🧑", n: "nom féminin", d: "Aide que l'on se donne les uns aux autres.", f: ["s'entraider", "aide", "aider"], s: ["solidarité", "coopération"], c: ["individualisme"], x: "Grâce à l'*entraide*, tout le monde a fini l'exercice.", o: "De « entre » et « aide » : s'aider les uns les autres." },
        { m: "respecter", e: "🙏", n: "verbe (1er groupe)", d: "Avoir de la considération pour quelqu'un ou quelque chose ; obéir à une règle.", f: ["respect", "respectueux", "respectable", "irrespectueux"], s: ["honorer", "observer"], c: ["mépriser", "enfreindre"], x: "Il faut *respecter* les règles du jeu.", o: "Du latin respectus, « regard en arrière, égard »." },
        { m: "recueillir", e: "🐈", n: "verbe (3e groupe)", d: "Rassembler ; accueillir quelqu'un qui en a besoin.", f: ["recueil", "cueillir", "recueillement"], s: ["ramasser", "héberger"], c: ["disperser", "abandonner"], x: "La famille a *recueilli* un chaton abandonné.", o: "Du latin recolligere, « rassembler »." },
        { m: "ravissant", e: "🌸", n: "adjectif (féminin : ravissante)", d: "Très joli, charmant.", f: ["ravir", "ravissement"], s: ["charmant", "joli", "adorable"], c: ["affreux", "laid"], x: "Elle porte une *ravissante* robe à fleurs.", o: "Vient de « ravir », qui voulait d'abord dire « enlever de force » : ce qui est ravissant nous transporte." },
        { m: "obstiné", e: "🐐", n: "adjectif (féminin : obstinée)", d: "Qui ne change pas d'avis, qui s'entête.", f: ["obstination", "s'obstiner", "obstinément"], s: ["têtu", "entêté"], c: ["conciliant", "docile"], x: "Cette chèvre *obstinée* refuse d'avancer.", o: "Du latin obstinatus, « résolu, décidé »." },
        { m: "dérober", e: "🦝", n: "verbe (1er groupe)", d: "Voler discrètement.", f: ["dérobade", "se dérober", "à la dérobée"], s: ["voler", "subtiliser"], c: ["rendre", "restituer"], x: "Un raton laveur a *dérobé* nos biscuits.", o: "D'un ancien verbe rober, « voler », d'origine germanique." },
        { m: "éblouir", e: "😎", n: "verbe (2e groupe)", d: "Aveugler par une lumière trop forte ; émerveiller.", f: ["éblouissant", "éblouissement"], s: ["aveugler", "émerveiller"], c: ["décevoir"], x: "Les phares de la voiture m'ont *ébloui*.", o: "Vient d'un ancien mot germanique qui voulait dire « faible » (en parlant des yeux)." },
        { m: "indulgent", e: "🤗", n: "adjectif (féminin : indulgente)", d: "Qui pardonne facilement les fautes.", f: ["indulgence"], s: ["tolérant", "clément"], c: ["sévère", "intransigeant"], x: "Le maître a été *indulgent* avec le retardataire.", o: "Du latin indulgens, « bienveillant »." },
        { m: "rusé", e: "🐈‍⬛", n: "adjectif (féminin : rusée)", d: "Qui sait tromper par des moyens habiles.", f: ["ruse", "ruser"], s: ["malin", "astucieux", "futé"], c: ["naïf", "crédule"], x: "Le chat *rusé* attend que la souris sorte de son trou.", o: "Vient de « ruser », « faire reculer », du latin recusare, « refuser »." },
        { m: "humide", e: "💧", n: "adjectif", d: "Légèrement mouillé, chargé d'eau.", f: ["humidité", "humidifier"], s: ["mouillé", "moite"], c: ["sec"], x: "Le linge est encore *humide*.", o: "Du latin humidus, « mouillé »." },
        { m: "réconforter", e: "☕", n: "verbe (1er groupe)", d: "Redonner du courage, consoler.", f: ["réconfort", "réconfortant", "fort", "conforter"], s: ["consoler", "rassurer"], c: ["décourager", "attrister"], x: "Son amie l'a *réconfortée* après sa chute.", o: "Vient de « fort » : rendre quelqu'un fort à nouveau." },
        { m: "vacarme", e: "🥁", n: "nom masculin", d: "Grand bruit, tapage.", f: [], s: ["tapage", "tintamarre"], c: ["silence"], x: "Les travaux font un *vacarme* insupportable.", o: "Du néerlandais wach arme, « hélas, pauvre de moi ! », un cri de détresse." },
        { m: "conquérir", e: "🏴", n: "verbe (3e groupe)", d: "S'emparer par les armes ; gagner l'affection ou l'admiration.", f: ["conquête", "conquérant", "conquis"], s: ["s'emparer", "séduire"], c: ["perdre"], x: "Les Romains ont *conquis* la Gaule.", o: "Du latin conquirere, « chercher à obtenir »." },
        { m: "pétiller", e: "🥂", n: "verbe (1er groupe)", d: "Faire de petites bulles ou de petites étincelles ; briller de vivacité.", f: ["pétillant", "pétillement"], s: ["crépiter", "briller"], c: [], x: "Ses yeux *pétillent* de malice.", o: "Mot formé pour imiter un petit bruit sec." },
        { m: "rugir", e: "🐯", n: "verbe (2e groupe)", d: "Pousser son cri, en parlant du lion ou du tigre ; crier très fort.", f: ["rugissement"], s: ["hurler", "gronder"], c: [], x: "Le lion *rugit* pour défendre son territoire.", o: "Du latin rugire, « rugir »." }
    ],
    '3': [
        { m: "empathie", e: "💞", n: "nom féminin",
          d: "Capacité à se mettre à la place de quelqu'un et à comprendre ce qu'il ressent.",
          f: ["empathique"],
          s: ["compréhension", "compassion"], c: ["indifférence", "insensibilité"],
          x: "Avec *empathie*, elle a consolé son amie qui pleurait.",
          o: "Du grec en, « dans », et pathos, « ce que l'on ressent »." },
        { m: "ambigu", e: "🌀", n: "adjectif (féminin : ambiguë)",
          d: "Qui peut être compris de plusieurs façons.",
          f: ["ambiguïté"],
          s: ["équivoque", "flou"], c: ["clair", "net", "précis"],
          x: "Sa réponse *ambiguë* ne nous a pas aidés à choisir.",
          o: "Du latin ambiguus, formé avec ambi-, « des deux côtés » : qui hésite entre deux sens." },
        { m: "anachronisme", e: "⏳", n: "nom masculin",
          d: "Erreur qui place quelque chose à une époque où il n'existait pas.",
          f: ["anachronique", "chronologie", "chronomètre"],
          s: ["décalage"], c: [],
          x: "Un chevalier avec un téléphone portable : quel *anachronisme* !",
          o: "Du grec ana, « à rebours », et khronos, « le temps »." },
        { m: "intrépide", e: "🧗", n: "adjectif",
          d: "Qui n'a peur de rien, qui affronte le danger avec courage.",
          f: ["intrépidité"],
          s: ["courageux", "audacieux", "téméraire"], c: ["peureux", "craintif"],
          x: "L'*intrépide* navigatrice a traversé l'océan en solitaire.",
          o: "Du latin in-, « ne… pas », et trepidus, « tremblant, agité par la peur »." },
        { m: "éloquent", e: "🎤", n: "adjectif (féminin : éloquente)",
          d: "Qui parle bien et sait convaincre.",
          f: ["éloquence", "éloquemment", "loquace"],
          s: ["convaincant", "persuasif"], c: ["maladroit", "muet"],
          x: "L'avocate a prononcé un discours *éloquent*.",
          o: "Du latin eloqui, « s'exprimer », formé sur loqui, « parler »." },
        { m: "procrastiner", e: "🛋️", n: "verbe (1er groupe)",
          d: "Remettre sans cesse à plus tard ce que l'on doit faire.",
          f: ["procrastination", "procrastinateur", "procrastinatrice"],
          s: ["différer", "remettre à plus tard"], c: ["agir aussitôt", "s'y mettre"],
          x: "Arrête de *procrastiner* et commence tes devoirs !",
          o: "Du latin procrastinare, « renvoyer au lendemain », formé sur cras, « demain »." },
        { m: "utopie", e: "🏝️", n: "nom féminin",
          d: "Idée d'un monde idéal, qui semble impossible à réaliser.",
          f: ["utopique", "utopiste"],
          s: ["rêve", "chimère", "idéal"], c: ["réalité"],
          x: "Une cour de récréation sans aucune dispute, c'est une *utopie* !",
          o: "Mot inventé par l'Anglais Thomas More en 1516, à partir du grec ou, « non », et topos, « lieu » : le lieu qui n'existe nulle part." },
        { m: "perspicace", e: "🕵️", n: "adjectif",
          d: "Qui comprend vite et remarque ce que les autres ne voient pas.",
          f: ["perspicacité"],
          s: ["clairvoyant", "fin", "sagace"], c: ["naïf", "borné"],
          x: "La détective *perspicace* a vite trouvé le coupable.",
          o: "Du latin perspicax, « qui voit à travers », de perspicere, « regarder à travers »." },
        { m: "inexorable", e: "🌊", n: "adjectif",
          d: "Qu'on ne peut ni arrêter ni empêcher.",
          f: ["inexorablement"],
          s: ["implacable", "inévitable", "inéluctable"], c: ["évitable"],
          x: "La marée montait de façon *inexorable*.",
          o: "Du latin in-, « non », et exorare, « obtenir par des prières » : rien ne peut le faire céder." },
        { m: "philanthrope", e: "🎁", n: "nom masculin ou féminin",
          d: "Personne qui aide les autres sans rien attendre en retour, souvent en donnant de l'argent.",
          f: ["philanthropie", "philanthropique", "misanthrope"],
          s: ["bienfaiteur", "mécène"], c: ["misanthrope", "égoïste"],
          x: "Un *philanthrope* a offert des livres à toutes les écoles du village.",
          o: "Du grec philos, « ami », et anthrôpos, « être humain » : l'ami des humains." },
        { m: "vulnérable", e: "🐣", n: "adjectif",
          d: "Qui peut facilement être blessé ou attaqué.",
          f: ["vulnérabilité", "invulnérable"],
          s: ["fragile", "sans défense"], c: ["invulnérable", "robuste"],
          x: "Les poussins sont *vulnérables* face au renard.",
          o: "Du latin vulnus, vulneris, « blessure »." },
        { m: "nostalgie", e: "📷", n: "nom féminin",
          d: "Regret tendre d'un temps passé ou d'un lieu que l'on a quitté.",
          f: ["nostalgique"],
          s: ["mélancolie", "regret"], c: ["insouciance", "gaieté"],
          x: "Grand-père parle de son enfance avec *nostalgie*.",
          o: "Du grec nostos, « retour », et algos, « douleur » : la douleur de ne pas pouvoir rentrer chez soi." },
        { m: "adversité", e: "🌩️", n: "nom féminin", d: "Situation difficile, malheur qui frappe quelqu'un.", f: ["adversaire", "adverse"], s: ["malheur", "épreuve"], c: ["prospérité", "chance"], x: "Elle a fait preuve de courage face à l'*adversité*.", o: "Du latin adversitas, de adversus, « tourné contre »." },
        { m: "altruisme", e: "💝", n: "nom masculin", d: "Fait de penser aux autres et de vouloir leur bien.", f: ["altruiste"], s: ["générosité", "dévouement"], c: ["égoïsme"], x: "Par *altruisme*, il donne son temps aux plus démunis.", o: "Mot créé au XIXe siècle par Auguste Comte, à partir du latin alter, « l'autre »." },
        { m: "amnésie", e: "🧠", n: "nom féminin", d: "Perte de la mémoire.", f: ["amnésique", "amnistie", "mnémotechnique"], s: ["oubli", "trou de mémoire"], c: ["mémoire"], x: "Après sa chute, le héros du film souffre d'*amnésie*.", o: "Du grec a-, « sans », et mnêsis, « souvenir »." },
        { m: "anecdote", e: "🗨️", n: "nom féminin", d: "Petit récit amusant ou curieux d'un fait vrai.", f: ["anecdotique"], s: ["historiette"], c: [], x: "Grand-mère raconte toujours des *anecdotes* sur son enfance.", o: "Du grec anekdota, « choses inédites, non publiées »." },
        { m: "anonyme", e: "🎭", n: "adjectif", d: "Dont on ne connaît pas le nom.", f: ["anonymat", "anonymement"], s: ["inconnu"], c: ["célèbre", "signé"], x: "Une lettre *anonyme* est arrivée à la mairie.", o: "Du grec an-, « sans », et onoma, « nom »." },
        { m: "apogée", e: "🎢", n: "nom masculin", d: "Le plus haut point, le sommet d'une carrière ou d'une époque.", f: ["périgée"], s: ["sommet", "apothéose"], c: ["déclin"], x: "Sous Louis XIV, la monarchie était à son *apogée*.", o: "Du grec apo, « loin de », et gê, « la Terre » : le point d'une orbite le plus éloigné de la Terre." },
        { m: "arrogant", e: "😤", n: "adjectif (féminin : arrogante)", d: "Qui se croit supérieur et le montre avec mépris.", f: ["arrogance", "arrogamment"], s: ["hautain", "prétentieux"], c: ["modeste", "humble"], x: "Le champion *arrogant* refusait de saluer ses adversaires.", o: "Du latin arrogare, « s'attribuer ce qui ne nous revient pas »." },
        { m: "autodidacte", e: "📚", n: "nom ou adjectif", d: "Personne qui a appris seule, sans professeur.", f: ["didactique"], s: [], c: [], x: "Ce pianiste *autodidacte* n'a jamais pris de cours.", o: "Du grec autos, « soi-même », et didaskein, « enseigner »." },
        { m: "biodiversité", e: "🦜", n: "nom féminin", d: "Ensemble de toutes les espèces vivantes d'un milieu.", f: ["biologie", "biologiste", "diversité", "divers"], s: [], c: [], x: "La forêt amazonienne abrite une *biodiversité* exceptionnelle.", o: "Du grec bios, « vie », et du latin diversitas, « variété »." },
        { m: "cacophonie", e: "🎺", n: "nom féminin", d: "Mélange de sons désagréables.", f: ["cacophonique", "symphonie", "téléphone"], s: ["vacarme", "tintamarre"], c: ["harmonie"], x: "Quand tout le monde parle en même temps, c'est la *cacophonie* !", o: "Du grec kakos, « mauvais », et phônê, « voix, son »." },
        { m: "calligraphie", e: "🖋️", n: "nom féminin", d: "Art de bien former les lettres, de la belle écriture.", f: ["calligraphier", "calligraphe"], s: ["belle écriture"], c: ["gribouillage"], x: "En *calligraphie*, chaque lettre est un petit dessin.", o: "Du grec kallos, « beauté », et graphein, « écrire »." },
        { m: "catastrophe", e: "💥", n: "nom féminin", d: "Événement terrible qui cause de grands dégâts.", f: ["catastrophique", "catastrophé"], s: ["désastre", "drame"], c: [], x: "Le tsunami a été une *catastrophe* pour la région.", o: "Du grec katastrophê, « bouleversement, renversement »." },
        { m: "chimère", e: "🐉", n: "nom féminin", d: "Rêve impossible, idée qui ne se réalisera pas ; monstre imaginaire.", f: ["chimérique"], s: ["illusion", "utopie"], c: ["réalité"], x: "Devenir invisible reste une *chimère*.", o: "De la Chimère, monstre de la mythologie grecque à tête de lion et à queue de serpent." },
        { m: "chronologie", e: "🗓️", n: "nom féminin", d: "Ordre dans lequel les événements se sont produits.", f: ["chronologique", "chronomètre", "anachronisme"], s: ["succession"], c: [], x: "Range ces dates dans l'ordre de la *chronologie*.", o: "Du grec khronos, « temps », et logos, « étude, discours »." },
        { m: "clairvoyant", e: "🔭", n: "adjectif (féminin : clairvoyante)", d: "Qui voit clair, qui comprend bien les situations.", f: ["clairvoyance", "clair", "voir"], s: ["perspicace", "lucide"], c: ["aveugle", "naïf"], x: "Une juge *clairvoyante* a démêlé l'affaire.", o: "De « clair » et « voyant » : qui voit clairement." },
        { m: "clémence", e: "🕊️", n: "nom féminin", d: "Indulgence de celui qui pardonne ; douceur du climat.", f: ["clément", "inclément", "inclémence"], s: ["indulgence", "douceur"], c: ["sévérité", "rigueur"], x: "Le roi fit preuve de *clémence* envers le prisonnier.", o: "Du latin clementia, « douceur, bonté »." },
        { m: "cohésion", e: "🧱", n: "nom féminin", d: "Union solide entre les parties d'un tout ou entre les membres d'un groupe.", f: ["cohérent", "cohérence", "adhérer"], s: ["unité", "solidarité"], c: ["division", "désunion"], x: "La *cohésion* de l'équipe lui a permis de gagner.", o: "Du latin cohaerere, « être attaché ensemble »." },
        { m: "compromis", e: "🤝", n: "nom masculin", d: "Accord où chacun fait un effort et renonce à une partie de ce qu'il voulait.", f: ["promettre", "promesse"], s: ["arrangement", "accord"], c: ["désaccord", "conflit"], x: "Après la dispute, ils ont trouvé un *compromis*.", o: "Du latin compromissum, « engagement réciproque »." },
        { m: "conjecture", e: "🤔", n: "nom féminin", d: "Supposition, idée qu'on se fait sans en être sûr.", f: ["conjecturer"], s: ["hypothèse", "supposition"], c: ["certitude"], x: "Sans preuves, on ne peut faire que des *conjectures*.", o: "Du latin conjectura, « supposition », de conjicere, « jeter ensemble »." },
        { m: "consensus", e: "🙋", n: "nom masculin", d: "Accord de presque tout le monde.", f: ["consentir", "consentement"], s: ["accord", "unanimité"], c: ["désaccord", "division"], x: "Le choix de la sortie a fait *consensus* dans la classe.", o: "Du latin consensus, « accord », de sentire, « sentir, penser »." },
        { m: "contemporain", e: "🏙️", n: "adjectif (féminin : contemporaine)", d: "Qui vit à la même époque ; qui appartient à notre époque.", f: ["temporaire", "temporel"], s: ["moderne", "actuel"], c: ["ancien", "passé"], x: "Ce musée présente de l'art *contemporain*.", o: "Du latin cum, « avec », et tempus, temporis, « temps »." },
        { m: "controverse", e: "💬", n: "nom féminin", d: "Discussion animée où les avis s'opposent.", f: ["controversé", "controversée"], s: ["débat", "polémique"], c: ["accord", "consensus"], x: "La construction du parc a provoqué une *controverse* dans le quartier.", o: "Du latin controversia, de contra, « contre », et vertere, « tourner »." },
        { m: "crédule", e: "🙃", n: "adjectif", d: "Qui croit trop facilement ce qu'on lui dit.", f: ["crédulité", "crédible", "incrédule", "crédit"], s: ["naïf", "candide"], c: ["méfiant", "sceptique"], x: "Il est si *crédule* qu'il a cru que les poules avaient des dents.", o: "Du latin credulus, de credere, « croire »." },
        { m: "démocratie", e: "🗳️", n: "nom féminin", d: "Régime politique où le pouvoir appartient au peuple, qui élit ses représentants.", f: ["démocrate", "démocratique"], s: [], c: ["dictature", "tyrannie"], x: "En *démocratie*, les citoyens votent librement.", o: "Du grec dêmos, « peuple », et kratos, « pouvoir »." },
        { m: "dérisoire", e: "🪙", n: "adjectif", d: "Très faible, ridiculement petit.", f: ["dérision"], s: ["insignifiant", "minime"], c: ["important", "considérable"], x: "Il a vendu son vélo pour une somme *dérisoire*.", o: "Du latin derisorius, « qui fait rire », de ridere, « rire »." },
        { m: "dilemme", e: "⚖️", n: "nom masculin", d: "Situation où l'on doit choisir entre deux solutions aussi difficiles l'une que l'autre.", f: [], s: ["choix", "alternative"], c: [], x: "Rester avec ses amis ou partir en voyage : quel *dilemme* !", o: "Du grec di-, « deux fois », et lêmma, « argument »." },
        { m: "diligent", e: "🐝", n: "adjectif (féminin : diligente)", d: "Qui fait son travail avec soin et rapidité.", f: ["diligence", "diligemment"], s: ["zélé", "appliqué", "prompt"], c: ["négligent", "paresseux"], x: "Cette élève *diligente* rend toujours ses devoirs à temps.", o: "Du latin diligens, « attentif, soigneux »." },
        { m: "discernement", e: "🧐", n: "nom masculin", d: "Capacité à juger avec justesse.", f: ["discerner"], s: ["jugement", "sagesse"], c: ["étourderie", "aveuglement"], x: "Il faut utiliser Internet avec *discernement*.", o: "Vient de « discerner », du latin discernere, « séparer, distinguer »." },
        { m: "éclectique", e: "🎨", n: "adjectif", d: "Qui s'intéresse à des choses très variées.", f: ["éclectisme"], s: ["varié", "ouvert"], c: ["exclusif", "borné"], x: "Mon oncle a des goûts musicaux très *éclectiques*.", o: "Du grec eklegein, « choisir »." },
        { m: "écosystème", e: "🌳", n: "nom masculin", d: "Ensemble formé par un milieu naturel et les êtres vivants qui y vivent.", f: ["écologie", "écologique", "système"], s: ["milieu"], c: [], x: "La mare est un petit *écosystème*.", o: "Du grec oikos, « maison », et sustêma, « ensemble »." },
        { m: "égocentrique", e: "🪞", n: "adjectif", d: "Qui ramène tout à lui-même.", f: ["égocentrisme", "égoïste", "égoïsme"], s: ["égoïste", "nombriliste"], c: ["altruiste", "généreux"], x: "Un ami *égocentrique* ne parle que de lui.", o: "Du latin ego, « moi », et centrum, « centre »." },
        { m: "émancipation", e: "⛓️‍💥", n: "nom féminin", d: "Fait de se libérer d'une autorité, d'une dépendance.", f: ["émanciper", "émancipé"], s: ["libération", "affranchissement"], c: ["asservissement", "dépendance"], x: "L'*émancipation* des femmes leur a donné le droit de vote.", o: "Du latin emancipare : à Rome, faire sortir un fils de l'autorité (manus, « la main ») de son père." },
        { m: "éminent", e: "🎓", n: "adjectif (féminin : éminente)", d: "Remarquable, supérieur aux autres.", f: ["éminence", "éminemment"], s: ["illustre", "remarquable"], c: ["médiocre", "obscur"], x: "Une *éminente* scientifique est venue présenter ses recherches.", o: "Du latin eminens, « qui s'élève au-dessus »." },
        { m: "énigmatique", e: "🗿", n: "adjectif", d: "Mystérieux, difficile à comprendre.", f: ["énigme"], s: ["mystérieux", "sibyllin"], c: ["clair", "évident"], x: "La Joconde a un sourire *énigmatique*.", o: "Vient de « énigme », du grec ainigma, « parole obscure »." },
        { m: "équité", e: "⚖️", n: "nom féminin", d: "Justice, fait de donner à chacun ce qui lui revient.", f: ["équitable", "équitablement", "égal"], s: ["justice", "impartialité"], c: ["injustice", "partialité"], x: "La maîtresse partage les rôles avec *équité*.", o: "Du latin aequitas, « égalité », de aequus, « égal »." },
        { m: "érudit", e: "📜", n: "adjectif ou nom (féminin : érudite)", d: "Qui a de très grandes connaissances.", f: ["érudition"], s: ["savant", "cultivé"], c: ["ignorant", "inculte"], x: "Ce vieil *érudit* connaît l'histoire de chaque pierre du château.", o: "Du latin eruditus, « instruit », de rudis, « grossier » : celui qui n'est plus ignorant." },
        { m: "euphorie", e: "🥳", n: "nom féminin", d: "Sentiment de joie intense.", f: ["euphorique"], s: ["allégresse", "exaltation"], c: ["abattement", "tristesse"], x: "La victoire a plongé le stade dans l'*euphorie*.", o: "Du grec eu, « bien », et pherein, « porter » : le fait de se sentir bien." },
        { m: "exhaustif", e: "📋", n: "adjectif (féminin : exhaustive)", d: "Qui traite d'un sujet de façon complète.", f: ["exhaustivité", "exhaustivement"], s: ["complet", "intégral"], c: ["partiel", "incomplet"], x: "Voici la liste *exhaustive* du matériel à apporter.", o: "De l'anglais exhaustive, du latin exhaurire, « épuiser »." },
        { m: "fébrile", e: "😰", n: "adjectif", d: "Agité, nerveux ; qui a de la fièvre.", f: ["fébrilité", "fièvre", "fiévreux"], s: ["nerveux", "agité"], c: ["calme", "posé"], x: "Avant le spectacle, les acteurs sont *fébriles*.", o: "Du latin febris, « fièvre »." },
        { m: "flegmatique", e: "🧊", n: "adjectif", d: "Qui garde son calme en toutes circonstances.", f: ["flegme"], s: ["imperturbable", "placide"], c: ["nerveux", "émotif"], x: "Même pendant l'orage, le capitaine restait *flegmatique*.", o: "Du grec phlegma, une « humeur » du corps qui, selon les médecins anciens, rendait calme." },
        { m: "fortuit", e: "🍀", n: "adjectif (féminin : fortuite)", d: "Qui arrive par hasard.", f: ["fortuitement"], s: ["accidentel", "imprévu"], c: ["prévu", "voulu"], x: "Notre rencontre au marché était *fortuite*.", o: "Du latin fortuitus, de fors, « hasard »." },
        { m: "hiéroglyphe", e: "🏺", n: "nom masculin", d: "Signe de l'écriture des anciens Égyptiens.", f: ["hiéroglyphique"], s: [], c: [], x: "Champollion a réussi à déchiffrer les *hiéroglyphes* en 1822.", o: "Du grec hieros, « sacré », et gluphein, « graver »." },
        { m: "homonyme", e: "👯", n: "nom masculin", d: "Mot qui se prononce comme un autre mais n'a pas le même sens (ver, verre, vert).", f: ["homonymie", "synonyme", "antonyme"], s: [], c: [], x: "« Mer », « mère » et « maire » sont des *homonymes*.", o: "Du grec homos, « semblable », et onoma, « nom »." },
        { m: "hypothèse", e: "🧪", n: "nom féminin", d: "Idée qu'on propose pour expliquer quelque chose, et qu'il faut vérifier.", f: ["hypothétique", "thèse"], s: ["supposition", "conjecture"], c: ["certitude", "preuve"], x: "Avant l'expérience, chaque groupe écrit son *hypothèse*.", o: "Du grec hupothesis, « ce qu'on pose dessous, base »." },
        { m: "idéaliste", e: "🌠", n: "adjectif ou nom", d: "Qui croit en un monde idéal, parfois sans tenir compte de la réalité.", f: ["idéal", "idéalisme", "idée", "idéaliser"], s: ["rêveur", "utopiste"], c: ["réaliste", "pragmatique"], x: "Ce jeune *idéaliste* veut supprimer la pollution du monde entier.", o: "Vient de « idéal », du grec idea, « forme, idée »." },
        { m: "illusoire", e: "🪄", n: "adjectif", d: "Qui trompe, qui n'est pas réel.", f: ["illusion", "illusionniste", "désillusion"], s: ["trompeur", "vain"], c: ["réel", "véritable"], x: "Espérer finir ce puzzle en une heure est *illusoire*.", o: "Du latin illusorius, de illudere, « se jouer de »." },
        { m: "impartial", e: "🧑‍⚖️", n: "adjectif (féminin : impartiale)", d: "Qui juge sans favoriser personne.", f: ["impartialité", "partial", "parti"], s: ["juste", "neutre", "objectif"], c: ["partial", "injuste"], x: "L'arbitre doit rester *impartial*.", o: "De im-, « non », et « partial » (qui prend parti), du latin pars, « part »." },
        { m: "imperceptible", e: "🔍", n: "adjectif", d: "Qu'on ne peut presque pas voir ou entendre.", f: ["percevoir", "perception", "perceptible"], s: ["invisible", "infime"], c: ["visible", "évident"], x: "Le serpent fit un mouvement *imperceptible*.", o: "Du latin im-, « non », et percipere, « saisir par les sens »." },
        { m: "incandescent", e: "🔥", n: "adjectif (féminin : incandescente)", d: "Qui devient lumineux à cause d'une très forte chaleur.", f: ["incandescence"], s: ["brûlant", "ardent"], c: [], x: "La lave *incandescente* coule le long du volcan.", o: "Du latin incandescere, « devenir blanc de chaleur » (candidus veut dire « blanc »)." },
        { m: "incrédule", e: "🤨", n: "adjectif", d: "Qui a du mal à croire ce qu'on lui dit.", f: ["incrédulité", "crédule", "croire"], s: ["sceptique", "méfiant"], c: ["crédule", "naïf"], x: "Le public, *incrédule*, regardait le magicien faire disparaître l'éléphant.", o: "Du latin incredulus, « qui ne croit pas »." },
        { m: "infaillible", e: "🎯", n: "adjectif", d: "Qui ne peut pas se tromper ou échouer.", f: ["infaillibilité", "faillir"], s: ["sûr", "imparable"], c: ["faillible"], x: "Ma grand-mère a une recette *infaillible* contre le hoquet.", o: "De in-, « non », et « faillir », « se tromper »." },
        { m: "ingénieux", e: "⚙️", n: "adjectif (féminin : ingénieuse)", d: "Qui a de l'imagination pour inventer des solutions.", f: ["ingéniosité", "ingénieur", "génie"], s: ["astucieux", "inventif"], c: ["maladroit", "borné"], x: "Léonard de Vinci était un inventeur *ingénieux*.", o: "Du latin ingeniosus, de ingenium, « talent, intelligence »." },
        { m: "insatiable", e: "🐛", n: "adjectif", d: "Qu'on ne peut jamais rassasier, satisfaire.", f: ["rassasier", "satiété"], s: ["vorace", "avide"], c: ["rassasié", "comblé"], x: "Cette chenille a un appétit *insatiable*.", o: "Du latin in-, « non », et satiare, « rassasier »." },
        { m: "intègre", e: "🧭", n: "adjectif", d: "D'une honnêteté parfaite.", f: ["intégrité", "intégral", "intégrer"], s: ["honnête", "incorruptible"], c: ["malhonnête", "corrompu"], x: "Le juge *intègre* a refusé l'argent qu'on lui offrait.", o: "Du latin integer, « intact, entier »." },
        { m: "lucide", e: "💡", n: "adjectif", d: "Qui voit les choses clairement, telles qu'elles sont.", f: ["lucidité", "lucidement"], s: ["clairvoyant", "réaliste"], c: ["aveugle", "naïf"], x: "Malgré la fatigue, le pilote reste *lucide*.", o: "Du latin lucidus, « clair, lumineux », de lux, « lumière »." },
        { m: "magnanime", e: "🦁", n: "adjectif", d: "Généreux, qui pardonne avec grandeur.", f: ["magnanimité"], s: ["généreux", "clément"], c: ["mesquin", "rancunier"], x: "Le roi *magnanime* gracia ses ennemis.", o: "Du latin magnus, « grand », et animus, « esprit, cœur »." },
        { m: "méticuleux", e: "📏", n: "adjectif (féminin : méticuleuse)", d: "Qui fait attention aux plus petits détails.", f: ["méticulosité"], s: ["minutieux", "soigneux"], c: ["négligent", "brouillon"], x: "L'archéologue *méticuleuse* dégage l'os avec un pinceau.", o: "Du latin meticulosus, « craintif » : on fait attention à tout par peur de se tromper." },
        { m: "monotone", e: "😑", n: "adjectif", d: "Qui ne change pas, et qui ennuie.", f: ["monotonie", "ton"], s: ["ennuyeux", "uniforme"], c: ["varié", "animé"], x: "Le conférencier parlait d'une voix *monotone*.", o: "Du grec monos, « seul », et tonos, « ton » : toujours sur le même ton." },
        { m: "mythologie", e: "🔱", n: "nom féminin", d: "Ensemble des mythes et des légendes d'un peuple.", f: ["mythe", "mythique", "mythologique"], s: ["légendes"], c: [], x: "Dans la *mythologie* grecque, Zeus est le roi des dieux.", o: "Du grec muthos, « récit, légende », et logos, « discours »." },
        { m: "nébuleux", e: "🌫️", n: "adjectif (féminin : nébuleuse)", d: "Couvert de nuages ; confus, pas clair.", f: ["nébuleuse", "nébulosité"], s: ["nuageux", "flou", "obscur"], c: ["clair", "limpide"], x: "Son explication est restée *nébuleuse*.", o: "Du latin nebula, « brouillard »." },
        { m: "nomade", e: "🐪", n: "adjectif ou nom", d: "Qui n'a pas d'habitation fixe et se déplace souvent.", f: ["nomadisme"], s: ["errant", "itinérant"], c: ["sédentaire"], x: "Autrefois, beaucoup de Touaregs vivaient en *nomades* dans le Sahara.", o: "Du grec nomas, « qui fait paître ses troupeaux »." },
        { m: "omniprésent", e: "🌐", n: "adjectif (féminin : omniprésente)", d: "Présent partout.", f: ["omniprésence", "présent"], s: ["universel"], c: ["absent", "rare"], x: "Les écrans sont *omniprésents* dans nos vies.", o: "Du latin omnis, « tout », et praesens, « présent »." },
        { m: "optimiste", e: "🌞", n: "adjectif ou nom", d: "Qui voit le bon côté des choses.", f: ["optimisme"], s: ["confiant", "positif"], c: ["pessimiste"], x: "Même sous la pluie, Zoé reste *optimiste*.", o: "Du latin optimus, « le meilleur »." },
        { m: "pessimiste", e: "🌧️", n: "adjectif ou nom", d: "Qui voit tout en noir, qui pense que les choses vont mal tourner.", f: ["pessimisme"], s: ["défaitiste", "sombre"], c: ["optimiste"], x: "Ne sois pas si *pessimiste*, tu vas réussir !", o: "Du latin pessimus, « le pire »." },
        { m: "palpitant", e: "💓", n: "adjectif (féminin : palpitante)", d: "Très passionnant, qui fait battre le cœur.", f: ["palpiter", "palpitation"], s: ["passionnant", "captivant"], c: ["ennuyeux", "monotone"], x: "Ce roman policier est *palpitant*.", o: "Du latin palpitare, « s'agiter, battre »." },
        { m: "panorama", e: "🏔️", n: "nom masculin", d: "Vaste paysage que l'on voit de tous les côtés depuis un point élevé.", f: ["panoramique"], s: ["vue", "paysage"], c: [], x: "Du haut de la tour, le *panorama* est splendide.", o: "Mot anglais formé sur le grec pan, « tout », et horama, « spectacle »." },
        { m: "paradoxe", e: "🔄", n: "nom masculin", d: "Idée ou situation qui semble contradictoire.", f: ["paradoxal", "paradoxalement"], s: ["contradiction"], c: ["évidence"], x: "C'est un *paradoxe* : plus je me dépêche, plus j'arrive en retard.", o: "Du grec para, « contre », et doxa, « opinion »." },
        { m: "parcimonie", e: "🤏", n: "nom féminin", d: "Fait de donner ou d'utiliser avec une très grande économie.", f: ["parcimonieux", "parcimonieusement"], s: ["économie", "mesure"], c: ["profusion", "gaspillage"], x: "Utilise la colle avec *parcimonie*.", o: "Du latin parcimonia, de parcere, « épargner »." },
        { m: "philosophie", e: "🦉", n: "nom féminin", d: "Réflexion sur les grandes questions de la vie ; manière calme d'accepter les choses.", f: ["philosophe", "philosopher", "philosophique"], s: ["sagesse", "réflexion"], c: [], x: "Il a accepté la défaite avec *philosophie*.", o: "Du grec philos, « ami », et sophia, « sagesse » : l'amour de la sagesse." },
        { m: "polyglotte", e: "🗺️", n: "adjectif ou nom", d: "Qui parle plusieurs langues.", f: ["glossaire"], s: [], c: ["monolingue"], x: "Notre guide est *polyglotte* : elle parle cinq langues.", o: "Du grec polus, « nombreux », et glôtta, « langue »." },
        { m: "précaire", e: "🏚️", n: "adjectif", d: "Qui n'est pas sûr, qui peut s'arrêter à tout moment.", f: ["précarité"], s: ["fragile", "instable"], c: ["stable", "solide"], x: "Cette cabane de branches est un abri *précaire*.", o: "Du latin precarius, « obtenu par la prière » : ce qu'on vous a accordé peut vous être repris." },
        { m: "préhistoire", e: "🦴", n: "nom féminin", d: "Très longue période avant l'invention de l'écriture.", f: ["préhistorique", "histoire", "historien"], s: [], c: ["histoire"], x: "À la *préhistoire*, les humains peignaient sur les parois des grottes.", o: "De pré-, « avant », et « histoire » : l'époque avant l'histoire écrite." },
        { m: "prolifique", e: "🐇", n: "adjectif", d: "Qui se reproduit beaucoup ; qui produit beaucoup d'œuvres.", f: ["proliférer", "prolifération"], s: ["fécond", "productif"], c: ["stérile", "improductif"], x: "Victor Hugo était un écrivain *prolifique*.", o: "Du latin proles, « descendance », et facere, « faire »." },
        { m: "prophétie", e: "🔮", n: "nom féminin", d: "Prédiction de l'avenir.", f: ["prophète", "prophétiser", "prophétique"], s: ["prédiction", "oracle"], c: [], x: "Selon la *prophétie*, un héros viendra sauver le royaume.", o: "Du grec prophêteia, de pro, « devant », et phanai, « dire »." },
        { m: "protagoniste", e: "🎬", n: "nom masculin ou féminin", d: "Personnage principal d'une histoire ; personne qui joue un rôle important.", f: [], s: ["héros", "personnage principal"], c: ["figurant"], x: "Le *protagoniste* du roman est un jeune orphelin.", o: "Du grec prôtos, « premier », et agônistês, « combattant, acteur »." },
        { m: "récalcitrant", e: "🫏", n: "adjectif (féminin : récalcitrante)", d: "Qui résiste, qui refuse d'obéir.", f: [], s: ["rebelle", "rétif", "désobéissant"], c: ["docile", "obéissant"], x: "L'âne *récalcitrant* refusait de traverser le pont.", o: "Du latin recalcitrare, « ruer », de calx, « talon » : donner des coups de talon comme un cheval." },
        { m: "réminiscence", e: "💭", n: "nom féminin", d: "Souvenir vague qui revient à l'esprit.", f: [], s: ["souvenir"], c: ["oubli"], x: "L'odeur des crêpes éveille en lui une *réminiscence* de son enfance.", o: "Du latin reminisci, « se souvenir »." },
        { m: "résilience", e: "🌱", n: "nom féminin", d: "Capacité à surmonter les épreuves et à reprendre le dessus.", f: ["résilient", "résiliente"], s: ["endurance", "ressort"], c: ["fragilité", "abattement"], x: "Après l'incendie, les habitants ont montré une grande *résilience*.", o: "Du latin resilire, « sauter en arrière, rebondir »." },
        { m: "scrupule", e: "🪨", n: "nom masculin", d: "Hésitation qui vient de la peur de mal faire.", f: ["scrupuleux", "scrupuleusement"], s: ["hésitation", "remords"], c: [], x: "Elle a des *scrupules* à manger le dernier biscuit.", o: "Du latin scrupulus, « petit caillou pointu » qui gêne dans la chaussure." },
        { m: "sédentaire", e: "🏡", n: "adjectif", d: "Qui reste au même endroit, qui a une habitation fixe.", f: ["sédentarité", "sédentariser"], s: ["casanier", "fixe"], c: ["nomade"], x: "Les premiers paysans sont devenus *sédentaires*.", o: "Du latin sedentarius, de sedere, « être assis »." },
        { m: "sobriété", e: "💡", n: "nom féminin", d: "Fait de consommer avec modération ; simplicité.", f: ["sobre", "sobrement"], s: ["modération", "simplicité"], c: ["excès", "gaspillage"], x: "La *sobriété* énergétique aide à protéger la planète.", o: "Du latin sobrietas, de sobrius, « qui ne boit pas trop »." },
        { m: "solennel", e: "🎖️", n: "adjectif (féminin : solennelle)", d: "Grave, majestueux, accompagné de cérémonie.", f: ["solennité", "solennellement"], s: ["officiel", "cérémonieux"], c: ["simple", "familier"], x: "Le maire a fait un discours *solennel* le 11 novembre.", o: "Du latin sollemnis, « qui a lieu chaque année », pour une fête religieuse." },
        { m: "sporadique", e: "🌦️", n: "adjectif", d: "Qui arrive de temps en temps, de façon irrégulière.", f: ["sporadiquement"], s: ["occasionnel", "irrégulier"], c: ["régulier", "constant"], x: "La météo annonce des averses *sporadiques*.", o: "Du grec sporadikos, « dispersé », de speirein, « semer »." },
        { m: "stoïque", e: "🗿", n: "adjectif", d: "Qui supporte la douleur ou le malheur avec courage, sans se plaindre.", f: ["stoïcisme", "stoïquement"], s: ["courageux", "impassible"], c: ["plaintif", "douillet"], x: "Malgré sa blessure, le joueur est resté *stoïque*.", o: "Du grec stoa, « portique » : à Athènes, les philosophes stoïciens enseignaient sous un portique." },
        { m: "subtil", e: "🎐", n: "adjectif (féminin : subtile)", d: "Fin, délicat, difficile à percevoir ; ingénieux.", f: ["subtilité", "subtilement"], s: ["fin", "délicat", "raffiné"], c: ["grossier", "lourd"], x: "Ce plat a un goût *subtil* de vanille.", o: "Du latin subtilis, « fin, délié »." },
        { m: "symbiose", e: "🐠", n: "nom féminin", d: "Association de deux êtres vivants qui en tirent tous les deux profit ; entente parfaite.", f: ["symbiotique", "biologie"], s: ["association", "harmonie"], c: [], x: "Le poisson-clown vit en *symbiose* avec l'anémone de mer.", o: "Du grec sun, « avec », et bios, « vie »." },
        { m: "synonyme", e: "🔁", n: "nom masculin", d: "Mot qui a presque le même sens qu'un autre.", f: ["synonymie", "homonyme", "antonyme"], s: ["équivalent"], c: ["antonyme", "contraire"], x: "« Joyeux » est un *synonyme* de « gai ».", o: "Du grec sun, « avec », et onoma, « nom »." },
        { m: "téméraire", e: "🏍️", n: "adjectif", d: "Qui prend des risques sans réfléchir.", f: ["témérité", "témérairement"], s: ["imprudent", "casse-cou"], c: ["prudent", "réfléchi"], x: "Ce cascadeur *téméraire* a sauté au-dessus de dix voitures.", o: "Du latin temerarius, « fait au hasard, irréfléchi »." },
        { m: "tolérance", e: "🌍", n: "nom féminin", d: "Respect des idées et des façons de vivre des autres.", f: ["tolérer", "tolérant", "intolérance", "intolérable"], s: ["respect", "ouverture d'esprit"], c: ["intolérance", "fanatisme"], x: "La *tolérance* permet de vivre ensemble malgré nos différences.", o: "Du latin tolerare, « supporter »." },
        { m: "unanimité", e: "🙌", n: "nom féminin", d: "Accord de tout le monde, sans exception.", f: ["unanime", "unanimement"], s: ["consensus"], c: ["désaccord", "division"], x: "Le projet de sortie a été voté à l'*unanimité*.", o: "Du latin unanimus, « qui a le même esprit » (unus, « un », et animus, « esprit »)." },
        { m: "ubiquité", e: "👥", n: "nom féminin", d: "Fait d'être présent en plusieurs endroits à la fois.", f: [], s: ["omniprésence"], c: [], x: "Je n'ai pas le don d'*ubiquité* : je ne peux pas être à la piscine et au judo en même temps !", o: "Du latin ubique, « partout »." },
        { m: "véhément", e: "📢", n: "adjectif (féminin : véhémente)", d: "Qui s'exprime avec force et passion.", f: ["véhémence", "véhémentement"], s: ["fougueux", "passionné"], c: ["calme", "modéré"], x: "Le capitaine a protesté de façon *véhémente*.", o: "Du latin vehemens, « impétueux »." },
        { m: "vestige", e: "🏛️", n: "nom masculin", d: "Ce qui reste d'une chose disparue.", f: [], s: ["reste", "ruine", "trace"], c: [], x: "On voit encore les *vestiges* d'un aqueduc romain.", o: "Du latin vestigium, « trace de pas »." },
        { m: "zénith", e: "☀️", n: "nom masculin", d: "Point du ciel situé juste au-dessus de nous ; le plus haut point.", f: [], s: ["apogée", "sommet"], c: ["nadir", "déclin"], x: "À midi, en été, le soleil est haut, près du *zénith*.", o: "De l'arabe samt ar-ras, « chemin au-dessus de la tête », mal recopié au Moyen Âge." },
        { m: "abnégation", e: "🙏", n: "nom féminin", d: "Fait de renoncer à ses propres intérêts pour les autres.", f: ["nier", "négation"], s: ["dévouement", "sacrifice"], c: ["égoïsme"], x: "L'infirmière a travaillé toute la nuit avec *abnégation*.", o: "Du latin abnegatio, « refus », de negare, « nier »." },
        { m: "alibi", e: "🕵️", n: "nom masculin", d: "Preuve qu'on était ailleurs au moment d'un crime ; excuse.", f: [], s: ["excuse", "prétexte"], c: [], x: "Le suspect avait un *alibi* : il était au cinéma.", o: "Du latin alibi, « ailleurs »." },
        { m: "ambitieux", e: "🚀", n: "adjectif (féminin : ambitieuse)", d: "Qui veut réussir, atteindre de grands buts.", f: ["ambition", "ambitionner"], s: ["audacieux", "déterminé"], c: ["modeste"], x: "Ce projet *ambitieux* demandera beaucoup de travail.", o: "Du latin ambitio : à Rome, la tournée des candidats qui faisaient le tour (ambire) des électeurs." },
        { m: "antipathique", e: "😒", n: "adjectif", d: "Qui déplaît, que l'on n'aime pas spontanément.", f: ["antipathie", "sympathique", "sympathie"], s: ["désagréable", "déplaisant"], c: ["sympathique", "aimable"], x: "Le méchant du film est vraiment *antipathique*.", o: "Du grec anti, « contre », et pathos, « ce que l'on ressent »." },
        { m: "aquatique", e: "🐬", n: "adjectif", d: "Qui vit dans l'eau ou près de l'eau.", f: ["aquarium", "aqueduc", "aquarelle"], s: [], c: ["terrestre"], x: "La loutre est un mammifère *aquatique*.", o: "Du latin aqua, « eau »." },
        { m: "astronome", e: "🔭", n: "nom masculin ou féminin", d: "Scientifique qui étudie les astres.", f: ["astronomie", "astronomique", "astre", "astronaute"], s: [], c: [], x: "L'*astronome* observe les anneaux de Saturne.", o: "Du grec astron, « astre », et nomos, « loi »." },
        { m: "bénévole", e: "🧤", n: "adjectif ou nom", d: "Qui travaille sans être payé, par choix.", f: ["bénévolat", "bénévolement"], s: ["volontaire"], c: ["rémunéré", "salarié"], x: "Des *bénévoles* nettoient la plage chaque printemps.", o: "Du latin benevolus, « qui veut du bien »." },
        { m: "canicule", e: "🥵", n: "nom féminin", d: "Période de très grande chaleur.", f: ["caniculaire", "canin"], s: ["fournaise", "chaleur torride"], c: ["vague de froid"], x: "Pendant la *canicule*, il faut boire beaucoup d'eau.", o: "Du latin canicula, « petite chienne », nom de l'étoile Sirius, qui se lève avec le soleil en été." },
        { m: "colossal", e: "🗽", n: "adjectif (féminin : colossale)", d: "D'une taille ou d'une force énorme.", f: ["colosse"], s: ["gigantesque", "immense"], c: ["minuscule"], x: "La construction des pyramides a demandé un travail *colossal*.", o: "Vient de « colosse », du grec kolossos, « statue géante », comme le Colosse de Rhodes." },
        { m: "confidence", e: "🤫", n: "nom féminin", d: "Secret que l'on confie à quelqu'un.", f: ["confier", "confident", "confidentiel", "confiance"], s: ["secret", "révélation"], c: [], x: "Ma meilleure amie m'a fait une *confidence*.", o: "Du latin confidentia, « confiance »." },
        { m: "contrefaçon", e: "🏷️", n: "nom féminin", d: "Imitation frauduleuse d'un objet.", f: ["contrefaire", "façon"], s: ["copie", "imitation", "faux"], c: ["original"], x: "Ce sac de marque était une *contrefaçon*.", o: "Vient de « contrefaire », « imiter », du latin contrafacere, « faire contre »." },
        { m: "courtois", e: "🎩", n: "adjectif (féminin : courtoise)", d: "Très poli et aimable.", f: ["courtoisie", "courtoisement", "cour"], s: ["poli", "aimable", "affable"], c: ["impoli", "grossier"], x: "Le chevalier *courtois* salua la dame.", o: "Vient de « cour » : à l'origine, qui a les bonnes manières de la cour du seigneur." },
        { m: "dévouement", e: "❤️", n: "nom masculin", d: "Fait de se consacrer aux autres.", f: ["se dévouer", "dévoué"], s: ["abnégation", "altruisme"], c: ["égoïsme", "indifférence"], x: "Les soignants ont travaillé avec *dévouement*.", o: "Du latin devovere, « consacrer, vouer »." },
        { m: "diurne", e: "🐿️", n: "adjectif", d: "Qui vit ou qui a lieu pendant le jour.", f: ["journée", "journal", "ajourner"], s: [], c: ["nocturne"], x: "L'écureuil est un animal *diurne*.", o: "Du latin diurnus, de dies, « jour » ; « jour » vient lui-même de diurnum." },
        { m: "effervescence", e: "🫧", n: "nom féminin", d: "Bouillonnement de bulles ; agitation joyeuse.", f: ["effervescent", "ferveur"], s: ["agitation", "fébrilité"], c: ["calme"], x: "La veille du spectacle, l'école est en *effervescence*.", o: "Du latin effervescere, « se mettre à bouillir »." },
        { m: "embarcation", e: "🛶", n: "nom féminin", d: "Petit bateau.", f: ["embarquer", "barque", "débarquer"], s: ["barque", "canot"], c: [], x: "Les pêcheurs mettent leur *embarcation* à l'eau.", o: "De l'espagnol embarcación, de barca, « barque »." },
        { m: "équilibre", e: "🤸", n: "nom masculin", d: "Position stable ; juste proportion entre les choses.", f: ["équilibrer", "équilibriste", "déséquilibre"], s: ["stabilité", "harmonie"], c: ["déséquilibre"], x: "L'acrobate garde son *équilibre* sur le fil.", o: "Du latin aequilibrium, de aequus, « égal », et libra, « balance »." },
        { m: "étymologie", e: "📖", n: "nom féminin", d: "Origine et histoire d'un mot.", f: ["étymologique", "étymologiste"], s: ["origine"], c: [], x: "Le volet « Origine » nous fait découvrir l'*étymologie* du mot.", o: "Du grec etumos, « vrai », et logos, « discours » : le vrai sens des mots." },
        { m: "exploit", e: "🏅", n: "nom masculin", d: "Action remarquable, difficile à réaliser.", f: [], s: ["prouesse", "performance"], c: ["échec"], x: "Traverser la Manche à la nage est un véritable *exploit*.", o: "Du latin explicitum, « chose accomplie »." },
        { m: "frugal", e: "🥗", n: "adjectif (féminin : frugale)", d: "Simple et léger (un repas) ; qui se contente de peu.", f: ["frugalité", "frugalement"], s: ["simple", "sobre"], c: ["copieux", "abondant"], x: "Les randonneurs ont pris un repas *frugal*.", o: "Du latin frugalis, de frux, « récolte, fruit »." },
        { m: "gastronomie", e: "🍽️", n: "nom féminin", d: "Art de bien cuisiner et de bien manger.", f: ["gastronome", "gastronomique"], s: ["cuisine"], c: [], x: "La *gastronomie* française est célèbre dans le monde entier.", o: "Du grec gastêr, « ventre », et nomos, « règle »." },
        { m: "hémisphère", e: "🌎", n: "nom masculin", d: "Chacune des deux moitiés de la Terre séparées par l'équateur ; moitié d'une sphère.", f: ["sphère", "sphérique", "atmosphère"], s: ["moitié"], c: [], x: "L'Australie se trouve dans l'*hémisphère* sud.", o: "Du grec hêmi, « demi », et sphaira, « boule »." },
        { m: "hospitalité", e: "🏠", n: "nom féminin", d: "Fait d'accueillir chez soi avec générosité.", f: ["hospitalier", "hôte", "hôpital", "hôtel"], s: ["accueil"], c: ["hostilité"], x: "Merci pour votre *hospitalité* pendant les vacances !", o: "Du latin hospitalitas, de hospes, « hôte »." },
        { m: "inaugurer", e: "✂️", n: "verbe (1er groupe)", d: "Ouvrir officiellement un lieu ; faire quelque chose pour la première fois.", f: ["inauguration", "inaugural"], s: ["ouvrir", "étrenner"], c: ["fermer", "clôturer"], x: "Le maire *inaugure* la nouvelle médiathèque.", o: "Du latin inaugurare, « prendre les augures » : les Romains observaient les oiseaux avant de commencer quelque chose." },
        { m: "intuition", e: "✨", n: "nom féminin", d: "Fait de deviner, de sentir une chose sans raisonner.", f: ["intuitif", "intuitivement"], s: ["pressentiment", "flair"], c: ["raisonnement"], x: "J'ai eu l'*intuition* qu'il allait pleuvoir.", o: "Du latin intueri, « regarder attentivement »." },
        { m: "itinéraire", e: "🧭", n: "nom masculin", d: "Chemin à suivre pour aller d'un lieu à un autre.", f: ["itinérant"], s: ["parcours", "trajet"], c: [], x: "Nous avons préparé l'*itinéraire* de la randonnée.", o: "Du latin iter, itineris, « chemin »." },
        { m: "longévité", e: "🐢", n: "nom féminin", d: "Fait de vivre longtemps.", f: ["long", "longueur"], s: ["durée de vie"], c: ["brièveté"], x: "La tortue est connue pour sa *longévité*.", o: "Du latin longaevitas, de longus, « long », et aevum, « âge »." },
        { m: "météorologie", e: "⛅", n: "nom féminin", d: "Science qui étudie le temps qu'il fait et le prévoit.", f: ["météo", "météorologue", "météore", "météorite"], s: ["météo"], c: [], x: "Grâce à la *météorologie*, on sait qu'il neigera demain.", o: "Du grec meteôra, « choses qui sont en l'air », et logos, « étude »." },
        { m: "microscopique", e: "🦠", n: "adjectif", d: "Si petit qu'on ne peut le voir qu'au microscope.", f: ["microscope", "microbe"], s: ["minuscule", "infime"], c: ["énorme", "gigantesque"], x: "Les bactéries sont des êtres *microscopiques*.", o: "Du grec mikros, « petit », et skopein, « observer »." },
        { m: "orphelin", e: "🧸", n: "nom masculin (féminin : orpheline)", d: "Enfant qui a perdu son père ou sa mère, ou les deux.", f: ["orphelinat"], s: [], c: [], x: "Oliver Twist est un *orphelin* qui vit à Londres.", o: "Du latin orphanus, venu du grec orphanos, « privé de »." },
        { m: "pédagogue", e: "🧑‍🏫", n: "nom masculin ou féminin", d: "Personne qui sait bien enseigner.", f: ["pédagogie", "pédagogique"], s: ["enseignant", "éducateur"], c: [], x: "Notre maître est un excellent *pédagogue*.", o: "Du grec paidagôgos, l'esclave qui conduisait les enfants (pais, paidos) à l'école." },
        { m: "persuasif", e: "🗣️", n: "adjectif (féminin : persuasive)", d: "Qui sait convaincre.", f: ["persuader", "persuasion"], s: ["convaincant", "éloquent"], c: ["peu convaincant"], x: "Avec des arguments *persuasifs*, elle a obtenu une sortie au zoo.", o: "Du latin persuadere, « convaincre »." },
        { m: "photosynthèse", e: "🍃", n: "nom féminin", d: "Fabrication de leur nourriture par les plantes vertes grâce à la lumière du soleil.", f: ["photographie", "synthèse"], s: [], c: [], x: "Grâce à la *photosynthèse*, les feuilles produisent de l'oxygène.", o: "Du grec phôs, phôtos, « lumière », et sunthesis, « assemblage »." },
        { m: "rétrospective", e: "🎞️", n: "nom féminin", d: "Présentation d'événements ou d'œuvres du passé.", f: ["rétrospectif", "spectateur"], s: ["bilan", "récapitulatif"], c: [], x: "Le journal publie une *rétrospective* de l'année.", o: "Du latin retro, « en arrière », et spectare, « regarder »." },
        { m: "souverain", e: "👑", n: "nom ou adjectif (féminin : souveraine)", d: "Roi, reine, personne qui détient le pouvoir suprême.", f: ["souveraineté", "souverainement"], s: ["monarque", "roi"], c: ["sujet"], x: "Le *souverain* reçoit les ambassadeurs dans son palais.", o: "Du latin populaire superanus, de super, « au-dessus »." },
        { m: "témoignage", e: "🎙️", n: "nom masculin", d: "Récit de ce que l'on a vu ou entendu.", f: ["témoin", "témoigner"], s: ["récit", "déclaration"], c: [], x: "Le *témoignage* de la boulangère a aidé l'enquête.", o: "Vient de « témoin », du latin testimonium, « preuve »." },
        { m: "tradition", e: "👑", n: "nom féminin", d: "Habitude ou croyance transmise de génération en génération.", f: ["traditionnel", "traditionnellement"], s: ["coutume", "usage"], c: ["nouveauté", "innovation"], x: "Manger la galette des rois en janvier est une *tradition*.", o: "Du latin traditio, « action de transmettre »." },
        { m: "vocation", e: "🩺", n: "nom féminin", d: "Attirance très forte pour un métier ou une activité.", f: ["voix", "vocal", "vocabulaire", "convoquer"], s: ["appel", "passion"], c: [], x: "Soigner les animaux, c'est sa *vocation*.", o: "Du latin vocatio, « appel », de vocare, « appeler »." }
    ]
};

// ── Outils ────────────────────────────────────────────────────────────────
function _mdjEsc(t) {
    return String(t == null ? '' : t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _mdjToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function _mdjFmtDate(iso) {
    const p = String(iso || '').split('-').map(Number);
    if (p.length !== 3 || !p[0]) return '';
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function _mdjDayOfYear() {
    const d = new Date();
    return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
}
function _mdjLoadHist() {
    try {
        const a = JSON.parse(localStorage.getItem(MDJ_HIST_KEY) || '[]');
        return Array.isArray(a) ? a.filter(h => h && h.m && MDJ_LEVELS[h.lv]) : [];
    } catch (e) { return []; }
}
function _mdjSaveHist(a) {
    try { localStorage.setItem(MDJ_HIST_KEY, JSON.stringify(a.slice(0, MDJ_HIST_MAX))); } catch (e) {}
}
// Mot du jour : le mot déjà étudié aujourd'hui, sinon le premier mot de la liste
// pas encore vu (d'après l'historique). Avec 144 mots par niveau, aucun mot ne
// revient pendant l'année scolaire. Quand tous ont été vus, on reprend le plus ancien.
function _mdjTodayIdx(lv) {
    const l = MDJ_BANQUE[lv] || [];
    if (!l.length) return 0;
    const h = _mdjLoadHist().filter(x => x.lv === lv);
    const today = h.find(x => x.date === _mdjToday());
    if (today) {
        const i = l.findIndex(w => w.m === today.m);
        if (i >= 0) return i;
    }
    const seen = new Set(h.map(x => x.m));
    const next = l.findIndex(w => !seen.has(w.m));
    if (next >= 0) return next;
    for (let k = h.length - 1; k >= 0; k--) {
        const i = l.findIndex(w => w.m === h[k].m);
        if (i >= 0) return i;
    }
    return _mdjDayOfYear() % l.length;
}
function _mdjFindIdx(lv, mot) {
    return (MDJ_BANQUE[lv] || []).findIndex(w => w.m === mot);
}
// Téléphone (même détection que les autres jeux et activités)
function _mdjIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}
// Petite explication de la nature, selon le début de l'intitulé
function _mdjNatHelp(n) {
    const t = String(n || '').toLowerCase();
    if (t.startsWith('nom'))       return 'Un nom désigne une personne, un animal, une chose ou une idée. On peut mettre un déterminant devant.';
    if (t.startsWith('adjectif'))  return 'Un adjectif précise le nom : il donne une qualité. Il s\'accorde avec le nom.';
    if (t.startsWith('verbe'))     return 'Un verbe exprime une action ou un état. Il est donné ici à l\'infinitif et se conjugue.';
    if (t.startsWith('adverbe'))   return 'Un adverbe est un mot invariable qui précise le sens d\'un verbe, d\'un adjectif ou d\'un autre adverbe.';
    return '';
}

// ── Création du widget ────────────────────────────────────────────────────
function createMotDuJourWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'mot-du-jour';
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
    container.className = 'mdj-container';

    // Taille initiale : 75 % de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'mdj-header';
    header.innerHTML = `
        <span class="mdj-title">📖 Le mot du jour</span>
        <span class="mdj-badge">Niveau 1</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.mdj-badge');
    container.appendChild(header);

    // ── Contrôles : navigation, mot du jour, hasard, historique, niveaux ──
    const controls = document.createElement('div');
    controls.className = 'mdj-controls';
    controls.innerHTML = `
        <button class="mdj-btn mdj-btn-grey" data-act="prev" title="Mot précédent">◀</button>
        <span class="mdj-nav-label"></span>
        <button class="mdj-btn mdj-btn-grey" data-act="next" title="Mot suivant">▶</button>
        <button class="mdj-btn mdj-btn-blue" data-act="today" title="Le mot choisi pour aujourd'hui">📅 Mot du jour</button>
        <button class="mdj-btn mdj-btn-grey" data-act="random">🎲 Au hasard</button>
        <button class="mdj-btn mdj-btn-grey" data-act="hist" title="Les mots déjà vus, pour les réviser">📚 Historique</button>
        <div class="mdj-level-btns">
            ${Object.keys(MDJ_LEVELS).map(k =>
                `<button class="mdj-level-btn" data-level="${k}" title="${MDJ_LEVELS[k].titre}">${MDJ_LEVELS[k].label}</button>`
            ).join('')}
        </div>
    `;
    const navLabel = controls.querySelector('.mdj-nav-label');
    const histBtn  = controls.querySelector('[data-act="hist"]');
    container.appendChild(controls);

    // ── Zone du mot ───────────────────────────────────────────────────────
    const zone = document.createElement('div');
    zone.className = 'mdj-zone';
    zone.style.height = Math.round(initH * 0.22) + 'px';
    const wordEl = document.createElement('div');
    wordEl.className = 'mdj-word';
    const seenEl = document.createElement('div');
    seenEl.className = 'mdj-seen';
    zone.appendChild(wordEl);
    zone.appendChild(seenEl);
    container.appendChild(zone);

    // ── Barre des volets ──────────────────────────────────────────────────
    const voletsBar = document.createElement('div');
    voletsBar.className = 'mdj-volets-bar';
    voletsBar.innerHTML = `
        <button class="mdj-btn mdj-btn-green" data-act="next-volet">▶ Ouvrir le volet suivant</button>
        <button class="mdj-btn mdj-btn-grey" data-act="open-all">⏭ Tout ouvrir</button>
        <button class="mdj-btn mdj-btn-grey" data-act="close-all">🙈 Tout refermer</button>
        <button class="mdj-btn mdj-btn-grey" data-act="hide-word" title="Cacher le mot pour le faire deviner à partir des volets">🫣 Cacher le mot</button>
    `;
    const nextVoletBtn = voletsBar.querySelector('[data-act="next-volet"]');
    const openAllBtn   = voletsBar.querySelector('[data-act="open-all"]');
    const closeAllBtn  = voletsBar.querySelector('[data-act="close-all"]');
    const hideWordBtn  = voletsBar.querySelector('[data-act="hide-word"]');
    container.appendChild(voletsBar);

    // ── Les 6 volets ──────────────────────────────────────────────────────
    const volets = document.createElement('div');
    volets.className = 'mdj-volets';
    volets.style.height = Math.round(initH * 0.5) + 'px';
    const voletEls = {};
    MDJ_VOLETS.forEach((v, i) => {
        const el = document.createElement('div');
        el.className = 'mdj-volet';
        el.dataset.volet = v.k;
        el.style.setProperty('--vc', v.c);
        el.style.setProperty('--vl', v.l);
        el.innerHTML = `
            <div class="mdj-volet-head" title="Ouvrir / refermer ce volet">
                <span class="mdj-volet-num">${i + 1}</span><span>${v.ico} ${v.nom}</span><span class="mdj-volet-state"></span>
            </div>
            <div class="mdj-volet-cover"><span class="ico">${v.ico}</span><span class="txt">Cliquer pour ouvrir</span></div>
            <div class="mdj-volet-body"></div>
        `;
        voletEls[v.k] = el;
        volets.appendChild(el);
    });
    container.appendChild(volets);

    // ── Historique ────────────────────────────────────────────────────────
    const history = document.createElement('div');
    history.className = 'mdj-history';
    history.innerHTML = `
        <div class="mdj-hist-top">
            <span class="mdj-hist-title">📚 Mots déjà vus</span>
            <button class="mdj-btn mdj-btn-green" data-act="revise" title="Un mot déjà vu, caché, pour le faire retrouver">🔁 Réviser au hasard</button>
            <button class="mdj-btn mdj-btn-red" data-act="hist-clear">🗑 Vider l'historique</button>
            <button class="mdj-btn mdj-btn-grey" data-act="hist">✖ Fermer</button>
        </div>
        <div class="mdj-hist-list"></div>
    `;
    history.style.height = volets.style.height;
    const histTitle = history.querySelector('.mdj-hist-title');
    const histList  = history.querySelector('.mdj-hist-list');
    const reviseBtn = history.querySelector('[data-act="revise"]');
    const histClearBtn = history.querySelector('[data-act="hist-clear"]');
    container.appendChild(history);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'mdj-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'mdj-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le mot du jour</h4>
        <p>Le mot est présenté en <b>6 volets</b> : définition, nature, famille, synonymes et contraires,
        phrase d'exemple et origine. Ouvrez-les <b>au fil de la séance</b> : clic sur un volet, ou
        <b>▶ Ouvrir le volet suivant</b>. Un clic sur le bandeau coloré d'un volet ouvert le referme.</p>
        <p><b>🫣 Cacher le mot</b> : le mot n'affiche plus que sa première lettre. Les élèves le
        retrouvent grâce aux volets (idéal pour réviser).</p>
        <p><b>📅 Mot du jour</b> propose le premier mot de la liste qui n'a pas encore été étudié :
        avec 144 mots par niveau, aucun mot ne revient pendant l'année scolaire. Le même jour, il redonne
        le mot déjà commencé. Les niveaux vont des mots courants (niveau 1) aux mots savants (niveau 3).</p>
        <p><b>📚 Historique</b> : dès qu'un volet est ouvert, le mot est gardé avec la date (dans ce navigateur).
        Cliquez sur un mot pour le revoir, ou sur <b>🔁 Réviser au hasard</b> pour faire retrouver un mot déjà vu.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'mdj-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let level = '1';
    let idx = 0;
    let cur = null;
    let open = new Set();
    let hidden = false;
    let showHist = false;
    let review = false;   // mot rouvert depuis l'historique

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function list(lv) { return MDJ_BANQUE[lv] || []; }

    // ── Choix du mot ──────────────────────────────────────────────────────
    function loadWord(lv, i, opts) {
        opts = opts || {};
        level = MDJ_LEVELS[lv] ? String(lv) : '1';
        const l = list(level);
        if (!l.length) { cur = null; idx = 0; }
        else {
            const n = l.length;
            idx = ((i % n) + n) % n;
            cur = l[idx];
        }
        open = new Set();
        hidden = !!opts.hidden;
        review = !!opts.review;
        renderAll();
    }

    // ── Historique ────────────────────────────────────────────────────────
    function histEntry() {
        if (!cur) return null;
        return _mdjLoadHist().find(h => h.m === cur.m && h.lv === level) || null;
    }
    function markSeen() {
        if (!cur) return;
        const h = _mdjLoadHist().filter(x => !(x.m === cur.m && x.lv === level));
        h.unshift({ m: cur.m, lv: level, date: _mdjToday() });
        _mdjSaveHist(h);
    }
    function renderHistory() {
        const h = _mdjLoadHist();
        histBtn.textContent = '📚 Historique' + (h.length ? ' (' + h.length + ')' : '');
        histBtn.classList.toggle('on', showHist);
        histTitle.textContent = '📚 Mots déjà vus (' + h.length + ')';
        reviseBtn.disabled = !h.length;
        histClearBtn.disabled = !h.length;
        if (!h.length) {
            histList.innerHTML = '<span class="mdj-none">Aucun mot pour l\'instant : un mot est ajouté dès qu\'un de ses volets est ouvert.</span>';
            return;
        }
        histList.innerHTML = h.map((x, k) => {
            const w = list(x.lv)[_mdjFindIdx(x.lv, x.m)];
            const emo = w ? w.e + ' ' : '';
            return `<span class="mdj-hist-item" data-hist="${k}" title="Revoir ce mot (niveau ${x.lv})">${emo}${_mdjEsc(x.m)} <small>${_mdjFmtDate(x.date)}</small>` +
                   `<button class="mdj-hist-del" data-hist-del="${k}" title="Retirer de l'historique">×</button></span>`;
        }).join('');
    }

    // ── Rendu du mot ──────────────────────────────────────────────────────
    function renderWord() {
        wordEl.innerHTML = '';
        wordEl.classList.toggle('is-hidden', hidden);
        if (!cur) {
            wordEl.innerHTML = '<div class="mdj-empty">Aucun mot.</div>';
            seenEl.style.display = 'none';
            return;
        }
        const emo = document.createElement('span');
        emo.className = 'mdj-emoji';
        emo.textContent = cur.e || '';
        const letters = document.createElement('span');
        letters.className = 'mdj-letters';
        letters.textContent = hidden
            ? cur.m.split('').map((ch, k) => (k === 0 || /[\s'-]/.test(ch)) ? ch : '_').join(' ')
            : cur.m;
        if (cur.e) wordEl.appendChild(emo);
        wordEl.appendChild(letters);

        const h = histEntry();
        if (h) {
            const today = h.date === _mdjToday();
            seenEl.style.display = '';
            seenEl.classList.toggle('today', today);
            seenEl.textContent = today ? '✓ Vu aujourd\'hui' : '👀 Déjà vu le ' + _mdjFmtDate(h.date);
        } else {
            seenEl.style.display = 'none';
        }
    }

    // ── Contenu d'un volet ────────────────────────────────────────────────
    function chips(arr, cls) {
        if (!arr || !arr.length) return '<span class="mdj-none">Pas de mot dans ce cas.</span>';
        return arr.map(t => `<span class="mdj-chip ${cls}">${_mdjEsc(t)}</span>`).join('');
    }
    function voletHTML(k) {
        const w = cur;
        switch (k) {
            case 'def': return _mdjEsc(w.d);
            case 'nat': {
                const help = _mdjNatHelp(w.n);
                return `<div class="mdj-nat-main">${_mdjEsc(w.n)}</div>` + (help ? `<div class="mdj-nat-help">${help}</div>` : '');
            }
            case 'fam': return chips(w.f, 'fam');
            case 'syn':
                return `<div class="mdj-sub">= Synonymes</div>${chips(w.s, 'syn')}` +
                       `<div class="mdj-sub">≠ Contraires</div>${w.c && w.c.length ? chips(w.c, 'contr') : '<span class="mdj-none">Pas de vrai contraire.</span>'}`;
            case 'ex':
                return `<div class="mdj-ex">${_mdjEsc(w.x).replace(/\*([^*]+)\*/g, '<mark>$1</mark>')}</div>`;
            case 'ori': return _mdjEsc(w.o);
        }
        return '';
    }

    let justOpened = null;
    function renderVolets() {
        MDJ_VOLETS.forEach(v => {
            const el = voletEls[v.k];
            const isOpen = !!cur && open.has(v.k);
            el.classList.toggle('open', isOpen);
            el.classList.toggle('just-open', isOpen && justOpened === v.k);
            el.querySelector('.mdj-volet-state').textContent = isOpen ? '▲' : '';
            el.querySelector('.mdj-volet-body').innerHTML = isOpen ? voletHTML(v.k) : '';
        });
        justOpened = null;
        const nb = open.size;
        nextVoletBtn.disabled = !cur || nb >= MDJ_VOLETS.length;
        openAllBtn.disabled   = !cur || nb >= MDJ_VOLETS.length;
        closeAllBtn.disabled  = !cur || nb === 0;
        nextVoletBtn.textContent = !cur ? '▶ Ouvrir le volet suivant'
            : nb >= MDJ_VOLETS.length ? '✅ Tous les volets sont ouverts'
            : `▶ Ouvrir le volet suivant (${nb + 1} / ${MDJ_VOLETS.length})`;
        hideWordBtn.textContent = hidden ? '👁 Montrer le mot' : '🫣 Cacher le mot';
        hideWordBtn.classList.toggle('on', hidden);
    }

    function renderHeader() {
        const l = list(level);
        navLabel.textContent = cur ? `Mot ${idx + 1} / ${l.length}` : 'Aucun mot';
        badge.textContent = review ? 'Révision · ' + MDJ_LEVELS[level].label : MDJ_LEVELS[level].label;
        controls.querySelectorAll('.mdj-level-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.level === level);
        });
        history.classList.toggle('show', showHist);
        volets.style.display    = showHist ? 'none' : '';
        voletsBar.style.display = showHist ? 'none' : '';
    }

    function renderAll() {
        renderHeader();
        renderWord();
        renderVolets();
        renderHistory();
        requestAnimationFrame(fit);
    }

    // ── Tailles selon la place disponible ─────────────────────────────────
    function fit() {
        const cw = container.clientWidth;
        if (!cw) return;
        const narrow = cw < 620;
        container.classList.toggle('mdj-narrow', narrow);
        // Taille du texte des volets
        const gh = volets.clientHeight;
        if (gh > 0) {
            const rows = narrow ? 3 : 2;
            const cols = narrow ? 2 : 3;
            const rowH = (gh - 8 * (rows - 1)) / rows;
            const colW = (cw - 32 - 8 * (cols - 1)) / cols;
            const fs = Math.max(11, Math.min(34, rowH / 6.2, colW / 15));
            container.style.setProperty('--mdj-fs', fs.toFixed(1) + 'px');
        }
        // Taille du mot
        const zw = zone.clientWidth - 40;
        const zh = zone.clientHeight - 16;
        if (zw <= 0 || zh <= 0 || !cur) { wordEl.style.fontSize = ''; return; }
        let size = Math.max(16, Math.min(zh * 0.72, zw * 0.16));
        wordEl.style.fontSize = size + 'px';
        let guard = 0;
        while ((wordEl.scrollWidth > zw || wordEl.scrollHeight > zh) && size > 14 && guard++ < 80) {
            size *= 0.93;
            wordEl.style.fontSize = size + 'px';
        }
    }

    // ── Ouverture des volets ──────────────────────────────────────────────
    function openVolet(k) {
        if (!cur || open.has(k)) return;
        open.add(k);
        justOpened = k;
        markSeen();
        renderWord();
        renderVolets();
        renderHistory();
        requestAnimationFrame(fit);
        save();
    }
    function closeVolet(k) {
        if (!open.has(k)) return;
        open.delete(k);
        renderVolets();
        save();
    }

    volets.addEventListener('click', (e) => {
        const el = e.target.closest('.mdj-volet');
        if (!el) return;
        e.stopPropagation();
        const k = el.dataset.volet;
        if (!open.has(k)) openVolet(k);
        else if (e.target.closest('.mdj-volet-head')) closeVolet(k);
    });

    // Les clics dans les zones de travail ne déplacent pas le widget
    [zone, volets, voletsBar, history].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const del = e.target.closest('[data-hist-del]');
        if (del) {
            e.stopPropagation();
            const h = _mdjLoadHist();
            h.splice(parseInt(del.dataset.histDel, 10), 1);
            _mdjSaveHist(h);
            renderWord();
            renderHistory();
            return;
        }
        const item = e.target.closest('[data-hist]');
        if (item) {
            const x = _mdjLoadHist()[parseInt(item.dataset.hist, 10)];
            if (!x) return;
            const i = _mdjFindIdx(x.lv, x.m);
            if (i < 0) return;
            showHist = false;
            loadWord(x.lv, i, { review: true });
            save();
            return;
        }
        const b = e.target.closest('[data-act],[data-level]');
        if (!b || !container.contains(b) || b.closest('.mdj-volets')) return;
        if (b.dataset.level) {
            showHist = false;
            loadWord(b.dataset.level, b.dataset.level === level ? idx : 0);
            save();
            return;
        }
        switch (b.dataset.act) {
            case 'prev': loadWord(level, idx - 1); save(); break;
            case 'next': loadWord(level, idx + 1); save(); break;
            case 'today': {
                showHist = false;
                loadWord(level, _mdjTodayIdx(level));
                save();
                break;
            }
            case 'random': {
                const n = list(level).length;
                let r = 0;
                if (n > 1) { do { r = Math.floor(Math.random() * n); } while (r === idx); }
                showHist = false;
                loadWord(level, r);
                save();
                break;
            }
            case 'hist':
                showHist = !showHist;
                renderAll();
                save();
                break;
            case 'revise': {
                const h = _mdjLoadHist().filter(x => _mdjFindIdx(x.lv, x.m) >= 0);
                if (!h.length) break;
                let pick = h[Math.floor(Math.random() * h.length)];
                if (h.length > 1 && cur && pick.m === cur.m) pick = h.find(x => x.m !== cur.m) || pick;
                showHist = false;
                loadWord(pick.lv, _mdjFindIdx(pick.lv, pick.m), { hidden: true, review: true });
                save();
                break;
            }
            case 'hist-clear': {
                (async () => {
                    let ok;
                    if (typeof modalConfirm === 'function') ok = await modalConfirm('Vider l\'historique ?', 'Tous les mots déjà vus seront retirés de la liste.');
                    else ok = window.confirm('Vider l\'historique des mots déjà vus ?');
                    if (!ok) return;
                    _mdjSaveHist([]);
                    renderWord();
                    renderHistory();
                })();
                break;
            }
            case 'next-volet': {
                const k = MDJ_VOLET_KEYS.find(x => !open.has(x));
                if (k) openVolet(k);
                break;
            }
            case 'open-all':
                if (!cur) break;
                MDJ_VOLET_KEYS.forEach(k => open.add(k));
                markSeen();
                renderAll();
                save();
                break;
            case 'close-all':
                open = new Set();
                renderVolets();
                save();
                break;
            case 'hide-word':
                hidden = !hidden;
                renderWord();
                renderVolets();
                requestAnimationFrame(fit);
                save();
                break;
        }
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur des volets et du mot) ──
    function setHeights(zh, vh) {
        zone.style.height    = Math.max(60, zh) + 'px';
        volets.style.height  = Math.max(150, vh) + 'px';
        history.style.height = volets.style.height;
    }
    function startResize(x0, y0) {
        const startW = container.offsetWidth;
        const startZ = zone.offsetHeight;
        const startV = (showHist ? history.offsetHeight : volets.offsetHeight) || 200;
        return (x, y) => {
            container.style.width = Math.max(420, startW + x - x0) + 'px';
            const nv = Math.max(150, startV + y - y0);
            setHeights(startZ * nv / startV, nv);
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
            document.removeEventListener('touchend',  onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
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
    let _savedW = null, _savedZ = null, _savedV = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '📖 Le mot du jour', {
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
            _savedZ = zone.style.height;
            _savedV = volets.style.height;
            container.classList.add('wf-fullboard');
            zone.style.height = Math.round(window.innerHeight * 0.2) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedZ) zone.style.height = _savedZ;
            if (_savedV) { volets.style.height = _savedV; history.style.height = _savedV; }
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

    // Au départ : le mot du jour du niveau 1
    loadWord('1', _mdjTodayIdx('1'));

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._mdjGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        zoneH:      _isMax ? (parseFloat(_savedZ) || zone.offsetHeight)     : zone.offsetHeight,
        voletsH:    _isMax ? (parseFloat(_savedV) || parseFloat(volets.style.height) || 0) : (parseFloat(volets.style.height) || 0),
        level, idx,
        mot: cur ? cur.m : null,
        open: Array.from(open),
        hidden, review, showHist,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    // (si le widget est restauré ensuite via _mdjSetData, on referme ce plein écran automatique)
    if (_mdjIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._mdjSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        // Sur téléphone, le widget reste en plein écran (bouton vert) après une actualisation
        const toPhoneFull = () => {
            if (_mdjIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.zoneH || d.voletsH) setHeights(d.zoneH || zone.offsetHeight, d.voletsH || parseFloat(volets.style.height) || 200);
        const lv = MDJ_LEVELS[d.level] ? String(d.level) : '1';
        // On retrouve le mot par son nom (la liste a pu changer), sinon par sa position
        let i = d.mot ? _mdjFindIdx(lv, d.mot) : -1;
        if (i < 0) i = parseInt(d.idx, 10) || 0;
        showHist = !!d.showHist;
        loadWord(lv, i, { hidden: !!d.hidden, review: !!d.review });
        if (Array.isArray(d.open)) {
            open = new Set(d.open.filter(k => MDJ_VOLET_KEYS.includes(k)));
            renderAll();
        }
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        // Après la restauration du tableau (mise à l'échelle des polices), on réajuste
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}

// ── Curseurs : flèche par défaut, main qui attrape sur la barre du haut (déplacement),
//    doigt qui pointe sur tout ce qui est cliquable. ──
(function () {
    if (typeof document === 'undefined' || document.getElementById('curseurs-mot-du-jour')) return;
    const st = document.createElement('style');
    st.id = 'curseurs-mot-du-jour';
    st.textContent = `
.widget[data-type="mot-du-jour"] { cursor: default; }
.widget[data-type="mot-du-jour"] .mdj-header { cursor: grab; }
.widget[data-type="mot-du-jour"] .mdj-header:active { cursor: grabbing; }
.widget[data-type="mot-du-jour"] .wf-fullboard .mdj-header, .widget[data-type="mot-du-jour"] .wf-fullboard .mdj-header:active { cursor: default; }
.widget[data-type="mot-du-jour"] .mdj-header :is(button, select, .wf-btn, [role="button"]) { cursor: pointer; }
:where(.widget[data-type="mot-du-jour"]) :where(button, select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="color"]) { cursor: pointer; }
.widget[data-type="mot-du-jour"] :is(input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"]) { cursor: pointer; }
.widget[data-type="mot-du-jour"] :is(button, select, input, textarea):disabled { cursor: default !important; }
.widget[data-type="mot-du-jour"] .wf-mini-bar { cursor: grab !important; }
.widget[data-type="mot-du-jour"] .wf-mini-bar:active { cursor: grabbing !important; }
.widget[data-type="mot-du-jour"] .wf-mini-bar :is(button, .wf-btn) { cursor: pointer !important; }
.widget[data-type="mot-du-jour"] .mdj-volet.open .mdj-volet-head { cursor: pointer; }
`;
    (document.head || document.documentElement).appendChild(st);
})();
