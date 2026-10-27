// =========================================================================
// WIDGET DICTÉE FLASH — Le Bureau du Prof
// Un mot ou une phrase s'affiche quelques secondes (3 à 10 s) puis disparaît.
// Les élèves écrivent sur l'ardoise, puis on dévoile la correction en
// surlignant les difficultés :
//   [ ]  son ou difficulté d'orthographe (eau, ain, ç, homophones…)
//   { }  lettre muette (le cha{t})
//   ( )  accord (des chat(s) noir(s))
// Listes classées par niveau et par son / notion, et listes personnelles
// (« Mes listes », gardées dans le navigateur).
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

    if (document.getElementById('dcf-style')) return;
    const s = document.createElement('style');
    s.id = 'dcf-style';
    s.textContent = `
        .widget[data-type="dictee-flash"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .dcf-container {
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
        .dcf-container input, .dcf-container textarea, .dcf-container select { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .dcf-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; user-select: none; }
        .dcf-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.3px; pointer-events: none; }
        .dcf-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.3px; background: #fce7f3; color: #9d174d; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Réduit / plein écran */
        .dcf-container.wf-minimized > *:not(.dcf-header) { display: none !important; }
        .dcf-container.wf-minimized { gap: 0; }
        .dcf-container.wf-fullboard {
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
            .dcf-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .dcf-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .dcf-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .dcf-btn:active { transform: scale(0.96); }
        .dcf-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .dcf-btn-blue  { background: #4a90e2; color: white; }
        .dcf-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .dcf-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .dcf-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .dcf-btn-green { background: #28a745; color: white; }
        .dcf-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .dcf-btn-red   { background: #fff0f0; color: #b91c1c; border: 1px solid #f3c4c4; }
        .dcf-btn-big { font-size: 14px; padding: 8px 18px; border-radius: 10px; }
        .dcf-chips { display: flex; gap: 4px; flex-wrap: wrap; }
        .dcf-chip {
            padding: 4px 9px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            color: #666;
            transition: background .15s;
        }
        .dcf-chip:hover { background: #e0e0e0; }
        .dcf-chip.active { background: #fce7f3; color: #9d174d; border-color: #f5b5d5; }
        .dcf-lbl { font-size: 11px; font-weight: 800; color: #6b7280; }
        .dcf-select {
            padding: 5px 8px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            background: #fff;
            max-width: 100%;
            min-width: 220px;
            flex: 1;
            cursor: pointer;
        }
        .dcf-nav-label { font-size: 12px; font-weight: 800; color: #6b7280; min-width: 64px; text-align: center; }

        /* Éditeur de listes */
        .dcf-editor {
            display: none;
            flex-direction: column;
            gap: 6px;
            padding: 8px 10px;
            background: #fffbea;
            border: 1px solid #f3e1a0;
            border-radius: 10px;
        }
        .dcf-editor.show { display: flex; }
        .dcf-editor input {
            padding: 5px 8px;
            border: 1px solid #e0cf8a;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            outline: none;
        }
        .dcf-editor textarea {
            min-height: 110px;
            padding: 6px 8px;
            border: 1px solid #e0cf8a;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.4;
            resize: vertical;
            outline: none;
        }
        .dcf-editor-hint { font-size: 11px; color: #6b4b00; line-height: 1.4; }
        .dcf-editor-hint code { background: #fff; border: 1px solid #f3e1a0; border-radius: 4px; padding: 0 4px; font-weight: 700; }

        /* Scène */
        .dcf-stage {
            position: relative;
            display: flex;
            flex-direction: column;
            padding: calc(var(--zu) * 1.4) 14px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: auto;
        }
        .dcf-stage-in {
            margin: auto;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: calc(var(--zu) * 1.4);
        }
        .dcf-text {
            font-family: 'Andika', 'Nunito', 'Segoe UI', sans-serif;
            font-weight: 700;
            color: #1f2937;
            text-align: center;
            line-height: 1.35;
            max-width: 100%;
            overflow-wrap: break-word;
        }
        .dcf-text.cursive { font-family: 'BelleAllureGS', 'Andika', cursive; font-weight: 400; line-height: 1.6; }
        .dcf-text.show { animation: dcfIn .25s ease-out; }
        .dcf-placeholder { font-size: max(16px, calc(var(--zu) * 3)); font-weight: 800; color: #9ca3af; text-align: center; }
        .dcf-placeholder.write { color: #0369a1; }
        .dcf-count { font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: max(40px, calc(var(--zu) * 12)); font-weight: 900; color: #db2777; animation: dcfPulse .6s ease-out; }
        @keyframes dcfIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
        @keyframes dcfPulse { 0% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

        /* Surlignage des difficultés */
        .dcf-son  { background: #fef08a; color: #854d0e; border-radius: .12em; padding: 0 .04em; box-shadow: 0 .06em 0 #eab308; }
        .dcf-muet { background: #e0e7ff; color: #4338ca; border-radius: .12em; padding: 0 .04em; outline: .05em dashed #6366f1; outline-offset: -.02em; }
        .dcf-acc  { background: #fed7aa; color: #c2410c; border-radius: .12em; padding: 0 .04em; box-shadow: 0 .06em 0 #f97316; }
        .dcf-legend { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; font-size: max(11px, calc(var(--zu) * 1.4)); font-weight: 800; }
        .dcf-legend span { padding: 2px 8px; border-radius: 6px; }
        .dcf-notes { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; max-width: 100%; }
        .dcf-note {
            font-size: max(12px, calc(var(--zu) * 1.6));
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            background: #fff;
            border: 1.5px solid var(--nc);
            color: #374151;
        }
        .dcf-note b { color: var(--nc); }

        /* Barre de temps */
        .dcf-timer { width: min(100%, calc(var(--zu) * 70)); height: max(8px, calc(var(--zu) * 0.9)); background: #e5e7eb; border-radius: 99px; overflow: hidden; display: none; }
        .dcf-timer.show { display: block; }
        .dcf-timer-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #ec4899, #f472b6); border-radius: 99px; }

        .dcf-actions { justify-content: center; }

        /* Aide */
        .dcf-help-btn {
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
        .dcf-help-btn:hover { background: #e0e0e0; color: #333; }
        .dcf-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 330px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .dcf-help-popup.show { display: block; }
        .dcf-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .dcf-help-popup p { margin: 0 0 6px; }
        .dcf-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement */
        .dcf-resize-handle {
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
        .dcf-container:hover .dcf-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Types de difficultés ──────────────────────────────────────────────────
const DCF_KINDS = {
    son:  { open: '[', close: ']', nom: 'son ou difficulté', ico: '🟨', c: '#ca8a04', bg: '#fef08a', fg: '#854d0e' },
    muet: { open: '{', close: '}', nom: 'lettre muette',     ico: '🔇', c: '#6366f1', bg: '#e0e7ff', fg: '#4338ca' },
    acc:  { open: '(', close: ')', nom: 'accord',            ico: '🔗', c: '#f97316', bg: '#fed7aa', fg: '#c2410c' }
};

const DCF_NIVEAUX = ['CP-CE1', 'CE1-CE2', 'CE2-CM', 'CM'];

// ── Listes ────────────────────────────────────────────────────────────────
// [ ] son ou difficulté · { } lettre muette · ( ) accord
const DCF_LISTES = [
    { id: 'muettes1', cat: 'Lettres muettes', niv: 'CP-CE1', nom: 'Lettres muettes en fin de mot', items: [
        'le cha{t}', 'un lou{p}', 'une souri{s}', 'le ri{z}', 'un gran{d} li{t}', 'du siro{p}',
        'un enfan{t}', 'le do{s}', 'un tapi{s}', 'le boi{s}', 'il est peti{t}', 'un ban{c}'
    ] },
    { id: 'muettes2', cat: 'Lettres muettes', niv: 'CE2-CM', nom: 'Lettres muettes : penser à un mot de la même famille', items: [
        'un cham{p}', 'le lai{t}', 'un poin{g}', 'le sau{t}', 'un repa{s}', 'le galo{p}',
        'il est blon{d}', 'un harico{t}', 'le ven{t}', 'le bor{d}', 'un dra{p}', 'l\'{h}iver', 'un {h}ibou', 'en auto{m}ne'
    ] },
    { id: 'son-o', cat: 'Sons', niv: 'CP-CE1', nom: 'Le son [o] : o, au, eau', items: [
        'un vél[o]', 'un chap[eau]', 'une [au]to', 'un bat[eau]', 'un cad[eau]', 'il fait ch[au]{d}',
        'une ép[au]le', 'un r[o]b[o]{t}', 'la p[eau]', 'un ois[eau]', 'j[au]ne', 'un ch[â]t[eau]'
    ] },
    { id: 'son-an', cat: 'Sons', niv: 'CE1-CE2', nom: 'Le son [an] : an, en, am, em', items: [
        'un [en]f[an]{t}', 'la l[am]pe', 'une j[am]be', 'le v[en]{t}', 'la ch[am]bre', 'le t[em]{ps}',
        'dim[an]che', 'la t[en]te', 'le m[en]ton', 'une ch[an]son', '[en]s[em]ble', 'une [an]tenne'
    ] },
    { id: 'son-in', cat: 'Sons', niv: 'CE1-CE2', nom: 'Le son [in] : in, ain, ein, im', items: [
        'un lap[in]', 'le p[ain]', 'la m[ain]', 'un sap[in]', 'la p[ein]ture', '[im]portant',
        'un tr[ain]', 'le jard[in]', 'un dess[in]', 'c[in]q', 'il est pl[ein]', 'dem[ain]'
    ] },
    { id: 'son-e', cat: 'Sons', niv: 'CE1-CE2', nom: 'Le son [é] : é, er, ez, ai, et', items: [
        'la cl[é]', 'l\'[é]t[é]', 'le boulang[er]', 'le n[ez]', 'un roch[er]', 'vous chant[ez]',
        'un jou[et]', 'un ball[et]', 'j\'[ai] mang[é]', 'le pi[e]{d}', 'le dîn[er]', 'un d[é]'
    ] },
    { id: 'son-s', cat: 'Sons', niv: 'CE1-CE2', nom: 'Le son [s] : s, ss, c, ç, sc', items: [
        'une [s]ouri{s}', 'un poi[ss]on', 'la cla[ss]e', 'un gar[ç]on', 'une le[ç]on', 'le [c]iel',
        'une ra[c]ine', 'la pi[sc]ine', 'il re[ç]oi{t}', 'une bro[ss]e', 'le [c]inéma', 'un ma[ç]on'
    ] },
    { id: 'son-g', cat: 'Sons', niv: 'CE1-CE2', nom: 'Les sons [g] et [j] : g, ge, gu', items: [
        'un [g]âteau', 'une [g]irafe', 'un pi[ge]on', 'la [gu]itare', 'une ba[gu]e', 'le [g]enou',
        'nous man[ge]ons', 'une lan[gu]e', 'un ma[g]asin', 'une [g]omme', 'la [g]are', 'un [gu]ide'
    ] },
    { id: 'acc-gn', cat: 'Accords', niv: 'CE2-CM', nom: 'Accords dans le groupe nominal', items: [
        'des chat(s) noir(s)', 'les petit(es) fille(s)', 'une robe vert(e)', 'des cheva(ux)',
        'les grand(es) maison(s)', 'des journ(aux)', 'des yeux bleu(s)', 'une amie gentil(le)',
        'des jeu(x)', 'des chou(x)', 'les beau(x) bateau(x)', 'une histoire amusant(e)'
    ] },
    { id: 'acc-sv', cat: 'Accords', niv: 'CE2-CM', nom: 'Accord du verbe avec le sujet', items: [
        'Les oiseaux chant(ent).', 'Tu regard(es) la mer.', 'Nous fin(issons) le travail.', 'Vous all(ez) à l\'école.',
        'Elles prenn(ent) le bus.', 'Le chien et le chat dorm(ent).', 'Mes amis arriv(ent) demain.',
        'Je li(s) un livre.', 'On mang(e) à midi.', 'Les enfants jou(ent) dans la cour.'
    ] },
    { id: 'homo', cat: 'Homophones', niv: 'CE2-CM', nom: 'Homophones : a / à, et / est, son / sont, on / ont', items: [
        'Il [a] mangé [à] midi.', 'Le chat [et] le chien.', 'Il [est] grand [et] fort.', 'Ils [ont] faim.',
        '[On] [a] gagné !', '[Son] frère [et] sa sœur [sont] là.', 'Elle [est] [à] la plage.',
        '[On] va [à] la piscine.', 'Tu as un vélo [et] un ballon.', 'Mes amis [sont] partis avec [son] chien.'
    ] },
    { id: 'phr1', cat: 'Phrases', niv: 'CE1-CE2', nom: 'Phrases courtes', items: [
        'Le peti{t} cha{t} boi{t} son lai{t}.', 'Il fai{t} b[eau] aujourd\'hui.', 'Les enfan{t}(s) jou(ent) dans la cour.',
        'Le chien cour{t} dans le jard[in].', 'Ma s[œu]r li{t} une {h}istoire.', 'Les oiseau(x) chant(ent) le matin.',
        'Papa me{t} du p[ain] sur la table.', 'Le tr[ain] arrive à la gare.'
    ] },
    { id: 'phr2', cat: 'Phrases', niv: 'CM', nom: 'Phrases avec accords', items: [
        'Les petit(es) fille(s) chant(ent) une chanson.', 'Mes cousin(es) sont arrivé(es) hier.',
        'Les vieux arbre(s) du jard[in] sont tombé(s).', 'Tu {h}abite(s) dans une grande maison.',
        'Les feuille(s) jaune(s) tomb(ent) en auto{m}ne.', 'Nous avons mangé des fraise(s) délicieuse(s).',
        'Elles sont parti(es) en vacances.'
    ] }
];

const DCF_STORE_KEY = 'dictee-flash-mes-listes';
const DCF_DUREES = [3, 4, 5, 6, 8, 10];

function _dcfEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Découpe une ligne marquée en morceaux { t, k } (k = null, son, muet, acc)
function _dcfParse(line) {
    const segs = [];
    let cur = '', kind = null;
    const closeOf = {};
    Object.keys(DCF_KINDS).forEach(k => { closeOf[DCF_KINDS[k].open] = k; });
    for (const ch of String(line)) {
        if (!kind && closeOf[ch]) {
            if (cur) segs.push({ t: cur, k: null });
            cur = ''; kind = closeOf[ch];
        } else if (kind && ch === DCF_KINDS[kind].close) {
            if (cur) segs.push({ t: cur, k: kind });
            cur = ''; kind = null;
        } else {
            cur += ch;
        }
    }
    if (cur) segs.push({ t: cur, k: kind });
    return segs;
}
function _dcfPlain(line) { return _dcfParse(line).map(s => s.t).join(''); }

// Notes de correction : pour chaque difficulté, le mot qui la contient
function _dcfNotes(line) {
    const segs = _dcfParse(line);
    const plain = segs.map(s => s.t).join('');
    const isL = c => /[A-Za-zÀ-ÖØ-öø-ÿœŒæÆ-]/.test(c);
    const notes = [];
    let pos = 0;
    segs.forEach(sg => {
        if (sg.k) {
            let a = pos, b = pos + sg.t.length;
            while (a > 0 && isL(plain[a - 1])) a--;
            while (b < plain.length && isL(plain[b])) b++;
            const word = plain.slice(a, b);
            const key = sg.k + '|' + sg.t + '|' + word;
            if (!notes.some(n => n.key === key)) notes.push({ key, k: sg.k, t: sg.t, word: word || sg.t });
        }
        pos += sg.t.length;
    });
    return notes;
}

function _dcfLoadMes() {
    try {
        const a = JSON.parse(localStorage.getItem(DCF_STORE_KEY) || '[]');
        return Array.isArray(a) ? a.filter(l => l && l.id && Array.isArray(l.items)) : [];
    } catch (e) { return []; }
}
function _dcfSaveMes(list) {
    try { localStorage.setItem(DCF_STORE_KEY, JSON.stringify(list)); } catch (e) {}
}

// Téléphone (même détection que les autres jeux et activités)
function _dcfIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createDicteeFlashWidget() {
    snapshotNow();
    const fpos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'dictee-flash';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:100px; top:${fpos.y}px; overflow:visible; flex-direction:row;`;
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
    container.className = 'dcf-container';

    // Taille initiale : 75 % de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'dcf-header';
    header.innerHTML = `
        <span class="dcf-title">✍️ Dictée flash</span>
        <span class="dcf-badge"></span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.dcf-badge');
    container.appendChild(header);

    // ── Choix de la liste ─────────────────────────────────────────────────
    const listRow = document.createElement('div');
    listRow.className = 'dcf-controls';
    listRow.innerHTML = `
        <span class="dcf-lbl">Niveau</span>
        <div class="dcf-chips" data-role="niv">
            <button class="dcf-chip" data-niv="">Tous</button>
            ${DCF_NIVEAUX.map(n => `<button class="dcf-chip" data-niv="${n}">${n}</button>`).join('')}
        </div>
        <select class="dcf-select" title="Choisir une liste (par son ou par notion)"></select>
        <button class="dcf-btn dcf-btn-grey" data-act="edit" title="Créer ou modifier une liste personnelle">✏️ Mes listes</button>
    `;
    const select = listRow.querySelector('.dcf-select');
    const editBtn = listRow.querySelector('[data-act="edit"]');
    container.appendChild(listRow);

    // ── Réglages d'affichage ──────────────────────────────────────────────
    const setRow = document.createElement('div');
    setRow.className = 'dcf-controls';
    setRow.innerHTML = `
        <span class="dcf-lbl">Affichage</span>
        <div class="dcf-chips" data-role="duree">
            ${DCF_DUREES.map(d => `<button class="dcf-chip" data-duree="${d}">${d} s</button>`).join('')}
        </div>
        <div class="dcf-chips" data-role="font">
            <button class="dcf-chip" data-font="script" title="Écriture script">Script</button>
            <button class="dcf-chip" data-font="cursive" title="Écriture cursive">Cursive</button>
        </div>
        <div class="dcf-chips">
            <button class="dcf-chip" data-toggle="countdown" title="Compter 3, 2, 1 avant d'afficher">3-2-1</button>
            <button class="dcf-chip" data-toggle="random" title="Mélanger l'ordre de la liste">🔀 Au hasard</button>
        </div>
        <div style="margin-left:auto;display:flex;gap:4px;align-items:center">
            <button class="dcf-btn dcf-btn-grey" data-act="prev" title="Précédent">◀</button>
            <span class="dcf-nav-label"></span>
            <button class="dcf-btn dcf-btn-grey" data-act="next" title="Suivant">▶</button>
        </div>
    `;
    const navLabel = setRow.querySelector('.dcf-nav-label');
    const prevBtn = setRow.querySelector('[data-act="prev"]');
    const nextBtn = setRow.querySelector('[data-act="next"]');
    container.appendChild(setRow);

    // ── Éditeur de « Mes listes » ─────────────────────────────────────────
    const editor = document.createElement('div');
    editor.className = 'dcf-editor';
    editor.innerHTML = `
        <div class="dcf-controls">
            <span class="dcf-lbl">Nom de la liste</span>
            <input type="text" data-role="ed-name" maxlength="60" placeholder="Ex. : Mots de la semaine" style="flex:1;min-width:160px">
        </div>
        <textarea data-role="ed-items" spellcheck="true" placeholder="Un mot ou une phrase par ligne, par exemple :
le cha{t}
un chap[eau]
des chat(s) noir(s)"></textarea>
        <div class="dcf-editor-hint">Un mot ou une phrase par ligne. Pour surligner les difficultés à la correction :
            <code>[eau]</code> son ou difficulté, <code>{t}</code> lettre muette, <code>(s)</code> accord.</div>
        <div class="dcf-controls">
            <button class="dcf-btn dcf-btn-green" data-act="ed-save">💾 Enregistrer la liste</button>
            <button class="dcf-btn dcf-btn-grey" data-act="ed-new">＋ Nouvelle liste</button>
            <button class="dcf-btn dcf-btn-red" data-act="ed-del">🗑 Supprimer</button>
            <button class="dcf-btn dcf-btn-grey" data-act="ed-close" style="margin-left:auto">Fermer</button>
        </div>
    `;
    const edName = editor.querySelector('[data-role="ed-name"]');
    const edItems = editor.querySelector('[data-role="ed-items"]');
    const edDel = editor.querySelector('[data-act="ed-del"]');
    container.appendChild(editor);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'dcf-stage';
    stage.style.height = Math.round(initH * 0.52) + 'px';
    stage.innerHTML = `<div class="dcf-stage-in">
        <div class="dcf-main"></div>
        <div class="dcf-timer"><div class="dcf-timer-fill"></div></div>
        <div class="dcf-legend"></div>
        <div class="dcf-notes"></div>
    </div>`;
    const mainEl   = stage.querySelector('.dcf-main');
    const timerEl  = stage.querySelector('.dcf-timer');
    const timerFill = stage.querySelector('.dcf-timer-fill');
    const legendEl = stage.querySelector('.dcf-legend');
    const notesEl  = stage.querySelector('.dcf-notes');
    container.appendChild(stage);

    const actions = document.createElement('div');
    actions.className = 'dcf-controls dcf-actions';
    container.appendChild(actions);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'dcf-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'dcf-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Dictée flash</h4>
        <p>Choisissez une liste (par <b>niveau</b>, puis par <b>son</b> ou par <b>notion</b>) et la <b>durée d'affichage</b>.</p>
        <p><b>👁 Afficher</b> : le mot ou la phrase apparaît (après un décompte 3-2-1 si activé), puis disparaît.
        Les élèves écrivent sur l'ardoise. <b>🔁 Revoir</b> le montre une nouvelle fois si besoin.</p>
        <p><b>✅ Correction</b> : les difficultés sont surlignées :
        <span style="background:#fef08a;color:#854d0e;padding:0 3px;border-radius:3px">son ou difficulté</span>,
        <span style="background:#e0e7ff;color:#4338ca;padding:0 3px;border-radius:3px">lettre muette</span>,
        <span style="background:#fed7aa;color:#c2410c;padding:0 3px;border-radius:3px">accord</span>.</p>
        <p><b>✏️ Mes listes</b> : écrivez vos propres mots (un par ligne). Marquez les difficultés avec
        <b>[ ]</b> pour un son, <b>{ }</b> pour une lettre muette, <b>( )</b> pour un accord.
        Exemple : <b>le cha{t}</b>, <b>un chap[eau]</b>, <b>des chat(s) noir(s)</b>.</p>
        <p><b>Script / Cursive</b> change l'écriture du mot affiché.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'dcf-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let niv = '';                 // filtre de niveau ('' = tous)
    let listId = DCF_LISTES[0].id;
    let order = [];               // ordre de passage (indices des éléments)
    let pos = 0;                  // position dans « order »
    let duree = 5;
    let font = 'script';
    let countdownOn = true;
    let random = false;
    let phase = 'ready';          // ready | countdown | showing | hidden | correction
    let revoir = 0;               // nombre de fois où l'on a revu l'élément
    let timers = [];
    let raf = null;
    let mes = _dcfLoadMes();
    let editingId = null;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    function allLists() {
        return DCF_LISTES.concat(mes.map(l => Object.assign({ cat: 'Mes listes', niv: '', perso: true }, l)));
    }
    function getList(id) {
        return allLists().find(l => l.id === id) || null;
    }
    function curList() {
        return getList(listId) || DCF_LISTES[0];
    }
    function curItem() {
        const l = curList();
        if (!l.items.length) return null;
        const i = order[pos];
        return l.items[i !== undefined ? i : 0] || null;
    }

    function buildOrder(keepPos) {
        const n = curList().items.length;
        order = Array.from({ length: n }, (_, i) => i);
        if (random) {
            for (let i = n - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [order[i], order[j]] = [order[j], order[i]];
            }
        }
        if (!keepPos) pos = 0;
        if (pos >= n) pos = 0;
    }

    function stopTimers() {
        timers.forEach(t => clearTimeout(t));
        timers = [];
        if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function renderSelect() {
        const groups = {};
        allLists().forEach(l => {
            if (niv && !l.perso && l.niv !== niv) return;
            (groups[l.cat] = groups[l.cat] || []).push(l);
        });
        let html = '';
        Object.keys(groups).forEach(cat => {
            html += `<optgroup label="${_dcfEsc(cat === 'Mes listes' ? '⭐ Mes listes' : cat)}">`;
            groups[cat].forEach(l => {
                html += `<option value="${_dcfEsc(l.id)}">${_dcfEsc(l.nom)}${l.niv ? ' (' + l.niv + ')' : ''} — ${l.items.length}</option>`;
            });
            html += `</optgroup>`;
        });
        select.innerHTML = html;
        // La liste choisie n'est plus visible avec ce filtre : on prend la première
        if (!Array.from(select.options).some(o => o.value === listId) && select.options.length) {
            listId = select.options[0].value;
            buildOrder(false);
            phase = 'ready';
        }
        select.value = listId;
    }

    function textHTML(line, withMarks) {
        return _dcfParse(line).map(sg => {
            const t = _dcfEsc(sg.t);
            return withMarks && sg.k ? `<span class="dcf-${sg.k}">${t}</span>` : t;
        }).join('');
    }

    function renderStage() {
        const item = curItem();
        timerEl.classList.toggle('show', phase === 'showing');
        legendEl.innerHTML = '';
        notesEl.innerHTML = '';
        if (!item) {
            mainEl.innerHTML = `<div class="dcf-placeholder">Cette liste est vide.</div>`;
            return;
        }
        if (phase === 'ready') {
            mainEl.innerHTML = `<div class="dcf-placeholder">👀 Prêts ? Regardez bien l'écran…</div>`;
        } else if (phase === 'countdown') {
            // géré par showCount()
        } else if (phase === 'showing') {
            mainEl.innerHTML = `<div class="dcf-text show ${font === 'cursive' ? 'cursive' : ''}">${textHTML(item, false)}</div>`;
        } else if (phase === 'hidden') {
            mainEl.innerHTML = `<div class="dcf-placeholder write">✏️ À vous d'écrire sur l'ardoise !</div>`;
        } else if (phase === 'correction') {
            mainEl.innerHTML = `<div class="dcf-text show ${font === 'cursive' ? 'cursive' : ''}">${textHTML(item, true)}</div>`;
            const notes = _dcfNotes(item);
            const kinds = [...new Set(notes.map(n => n.k))];
            legendEl.innerHTML = kinds.map(k => `<span style="background:${DCF_KINDS[k].bg};color:${DCF_KINDS[k].fg}">${DCF_KINDS[k].ico} ${DCF_KINDS[k].nom}</span>`).join('');
            notesEl.innerHTML = notes.map(n => {
                const K = DCF_KINDS[n.k];
                const what = n.k === 'muet' ? `<b>${_dcfEsc(n.t)}</b> muet${n.t.length > 1 ? 's' : ''}`
                           : n.k === 'acc'  ? `accord <b>-${_dcfEsc(n.t)}</b>`
                           : `<b>${_dcfEsc(n.t)}</b>`;
                return `<span class="dcf-note" style="--nc:${K.c}">${K.ico} ${what} dans « ${_dcfEsc(n.word)} »</span>`;
            }).join('');
        }
        fitText();
    }

    function renderActions() {
        let html = '';
        const label = `${duree} s`;
        if (phase === 'ready') {
            html += `<button class="dcf-btn dcf-btn-blue dcf-btn-big" data-act="show">👁 Afficher (${label})</button>`;
        } else if (phase === 'countdown' || phase === 'showing') {
            html += `<button class="dcf-btn dcf-btn-blue dcf-btn-big" disabled>👁 Regardez bien…</button>`;
        } else if (phase === 'hidden') {
            html += `<button class="dcf-btn dcf-btn-grey dcf-btn-big" data-act="show">🔁 Revoir${revoir ? ' (' + revoir + ')' : ''}</button>`;
            html += `<button class="dcf-btn dcf-btn-green dcf-btn-big" data-act="correct">✅ Correction</button>`;
        } else if (phase === 'correction') {
            html += `<button class="dcf-btn dcf-btn-blue dcf-btn-big" data-act="next-item">▶ Mot suivant</button>`;
            html += `<button class="dcf-btn dcf-btn-grey dcf-btn-big" data-act="show">🔁 Revoir sans surlignage</button>`;
        }
        actions.innerHTML = html;
    }

    function renderHeader() {
        const l = curList();
        badge.textContent = l.nom;
        badge.title = l.nom;
        listRow.querySelectorAll('[data-niv]').forEach(b => b.classList.toggle('active', b.dataset.niv === niv));
        setRow.querySelectorAll('[data-duree]').forEach(b => b.classList.toggle('active', +b.dataset.duree === duree));
        setRow.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === font));
        setRow.querySelector('[data-toggle="countdown"]').classList.toggle('active', countdownOn);
        setRow.querySelector('[data-toggle="random"]').classList.toggle('active', random);
        const n = l.items.length;
        navLabel.textContent = n ? `${pos + 1} / ${n}` : '0 / 0';
        const moving = phase === 'countdown' || phase === 'showing';
        prevBtn.disabled = moving || n < 2;
        nextBtn.disabled = moving || n < 2;
        editBtn.classList.toggle('dcf-btn-blue', editor.classList.contains('show'));
    }

    function renderAll() {
        renderSelect();
        renderHeader();
        renderStage();
        renderActions();
        fit();
    }

    // Taille du texte : la plus grande possible dans la scène
    function fitText() {
        const t = mainEl.querySelector('.dcf-text');
        if (!t) return;
        const W = stage.clientWidth - 28;
        const cs = getComputedStyle(stage);
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const gap = parseFloat(getComputedStyle(stage.firstElementChild).rowGap) || 0;
        const extra = phase === 'correction'
            ? legendEl.offsetHeight + notesEl.offsetHeight + 3 * gap
            : (phase === 'showing' ? timerEl.offsetHeight + 3 * gap : 3 * gap);
        const H = stage.clientHeight - pad - extra - 10;
        if (W <= 0 || H <= 0) return;
        const len = t.textContent.length;
        let size = Math.max(20, Math.min(H * 0.6, W * (len < 12 ? 0.11 : 0.08)));
        t.style.fontSize = size + 'px';
        let guard = 0;
        while ((t.scrollHeight > H || t.scrollWidth > W) && size > 16 && guard++ < 60) {
            size *= 0.92;
            t.style.fontSize = size + 'px';
        }
    }
    function fit() {
        const w = stage.clientWidth || container.clientWidth;
        const h = stage.clientHeight || 300;
        const u = Math.max(4, Math.min(w / 100, h / 30));
        container.style.setProperty('--zu', u + 'px');
        fitText();
    }

    // ── Déroulement ───────────────────────────────────────────────────────
    function showCount(n) {
        mainEl.innerHTML = `<div class="dcf-count">${n}</div>`;
    }
    function startShow() {
        if (!curItem()) return;
        stopTimers();
        if (phase === 'hidden' || phase === 'correction') revoir++;
        const reveal = () => {
            phase = 'showing';
            renderAll();
            const t0 = performance.now(), dur = duree * 1000;
            const loop = (now) => {
                const r = Math.max(0, 1 - (now - t0) / dur);
                timerFill.style.width = (r * 100) + '%';
                if (r > 0) raf = requestAnimationFrame(loop);
                else { raf = null; hideNow(); }
            };
            raf = requestAnimationFrame(loop);
        };
        if (countdownOn) {
            phase = 'countdown';
            renderHeader(); renderActions();
            timerEl.classList.remove('show'); legendEl.innerHTML = ''; notesEl.innerHTML = '';
            [3, 2, 1].forEach((n, i) => timers.push(setTimeout(() => showCount(n), i * 700)));
            timers.push(setTimeout(reveal, 2100));
        } else {
            reveal();
        }
    }
    function hideNow() {
        stopTimers();
        phase = 'hidden';
        renderAll();
        save();
    }
    function goTo(newPos) {
        const n = curList().items.length;
        if (!n) return;
        stopTimers();
        pos = ((newPos % n) + n) % n;
        phase = 'ready';
        revoir = 0;
        renderAll();
        save();
    }

    // ── Éditeur ───────────────────────────────────────────────────────────
    function openEditor(id) {
        mes = _dcfLoadMes();
        const l = id ? mes.find(x => x.id === id) : null;
        editingId = l ? l.id : null;
        edName.value = l ? l.nom : '';
        edItems.value = l ? l.items.join('\n') : '';
        edDel.style.display = l ? '' : 'none';
        editor.classList.add('show');
        renderHeader();
        setTimeout(() => (l ? edItems : edName).focus(), 30);
    }
    function closeEditor() {
        editor.classList.remove('show');
        renderHeader();
        requestAnimationFrame(fit);
    }
    function saveEditor() {
        const items = edItems.value.split('\n').map(x => x.trim()).filter(Boolean);
        if (!items.length) { edItems.focus(); return; }
        const nom = edName.value.trim() || 'Ma liste';
        mes = _dcfLoadMes();
        if (editingId && mes.some(x => x.id === editingId)) {
            const l = mes.find(x => x.id === editingId);
            l.nom = nom; l.items = items;
        } else {
            editingId = 'perso-' + Date.now();
            mes.push({ id: editingId, nom, items });
        }
        _dcfSaveMes(mes);
        listId = editingId;
        niv = '';
        buildOrder(false);
        phase = 'ready';
        revoir = 0;
        closeEditor();
        renderAll();
        save();
    }
    async function deleteEditor() {
        if (!editingId) return;
        let ok;
        if (typeof modalConfirm === 'function') ok = await modalConfirm('Supprimer cette liste ?', 'Elle sera retirée de « Mes listes ».');
        else ok = window.confirm('Supprimer cette liste ?');
        if (!ok) return;
        mes = _dcfLoadMes().filter(x => x.id !== editingId);
        _dcfSaveMes(mes);
        if (listId === editingId) { listId = DCF_LISTES[0].id; buildOrder(false); phase = 'ready'; }
        editingId = null;
        closeEditor();
        renderAll();
        save();
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-niv],[data-duree],[data-font],[data-toggle]');
        if (!b || !container.contains(b) || b.closest('.dcf-help-popup')) return;
        if (b.dataset.niv !== undefined) {
            niv = b.dataset.niv;
            renderAll();
            save();
            return;
        }
        if (b.dataset.duree) { duree = +b.dataset.duree; renderHeader(); renderActions(); save(); return; }
        if (b.dataset.font) { font = b.dataset.font; renderStage(); renderHeader(); save(); return; }
        if (b.dataset.toggle === 'countdown') { countdownOn = !countdownOn; renderHeader(); save(); return; }
        if (b.dataset.toggle === 'random') {
            if (phase === 'countdown' || phase === 'showing') return;
            random = !random;
            buildOrder(false);
            phase = 'ready'; revoir = 0;
            renderAll();
            save();
            return;
        }
        switch (b.dataset.act) {
            case 'show':      startShow(); break;
            case 'correct':   stopTimers(); phase = 'correction'; renderAll(); save(); break;
            case 'next-item': goTo(pos + 1); break;
            case 'prev':      goTo(pos - 1); break;
            case 'next':      goTo(pos + 1); break;
            case 'edit':
                if (editor.classList.contains('show')) closeEditor();
                else openEditor(curList().perso ? listId : null);
                break;
            case 'ed-save':  saveEditor(); break;
            case 'ed-new':   openEditor(null); break;
            case 'ed-del':   deleteEditor(); break;
            case 'ed-close': closeEditor(); break;
        }
    });

    select.addEventListener('change', () => {
        stopTimers();
        listId = select.value;
        buildOrder(false);
        phase = 'ready';
        revoir = 0;
        if (editor.classList.contains('show')) {
            if (curList().perso) openEditor(listId); else closeEditor();
        }
        renderAll();
        save();
    });

    // Les champs : le clavier ne doit pas agir sur le tableau
    [edName, edItems, select].forEach(el => {
        el.addEventListener('keydown', (e) => e.stopPropagation());
        el.addEventListener('click', (e) => e.stopPropagation());
    });

    // Les clics dans les réglages et la scène ne déplacent pas le widget
    [listRow, setRow, editor, stage, actions].forEach(el => {
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
            stage.style.height    = Math.max(160, startH + ev.clientY - startY) + 'px';
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
            stage.style.height    = Math.max(160, startH + t.clientY - startY) + 'px';
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
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitText());

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
            window._wfMiniBarCollapse(widget, '✍️ Dictée flash', {
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
            stage.style.height = Math.round(window.innerHeight * 0.55) + 'px';
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
        stopTimers();
        window.removeEventListener('resize', onWinResize);
        if (ro) ro.disconnect();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    buildOrder(false);
    renderAll();
    requestAnimationFrame(() => requestAnimationFrame(fit));

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._dcfGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        niv, listId, order: order.slice(), pos, duree, font, countdownOn, random,
        // Pendant le décompte ou l'affichage, on repart de « prêt »
        phase: (phase === 'countdown' || phase === 'showing') ? 'ready' : phase,
        revoir,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_dcfIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._dcfSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        // Sur téléphone, le widget reste en plein écran (bouton vert) après une actualisation
        const toPhoneFull = () => {
            if (_dcfIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        mes = _dcfLoadMes();
        niv = DCF_NIVEAUX.includes(d.niv) ? d.niv : '';
        listId = getList(d.listId) ? d.listId : DCF_LISTES[0].id;
        if (DCF_DUREES.includes(d.duree)) duree = d.duree;
        font = d.font === 'cursive' ? 'cursive' : 'script';
        countdownOn = d.countdownOn !== false;
        random = !!d.random;
        const n = curList().items.length;
        if (Array.isArray(d.order) && d.order.length === n && d.order.every(i => Number.isInteger(i) && i >= 0 && i < n)) {
            order = d.order.slice();
        } else {
            buildOrder(false);
        }
        pos = Math.min(Math.max(0, d.pos | 0), Math.max(0, n - 1));
        phase = ['ready', 'hidden', 'correction'].includes(d.phase) ? d.phase : 'ready';
        revoir = d.revoir | 0;
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
