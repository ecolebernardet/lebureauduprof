// =========================================================================
// WIDGET CHASSE AU SON — Le Bureau du Prof
// Conscience phonologique (cycle 2) : une série d'images, l'élève touche
// celles où il entend le son choisi, éventuellement à une place donnée
// (au début, au milieu ou à la fin du mot).
//   • choix du son (voyelles, sons complexes, consonnes) et de la place ;
//   • 🔊 sur chaque image pour entendre le mot, consigne lue à voix haute ;
//   • ✓ Vérifier : images trouvées, oubliées ou en trop, mot écrit avec la
//     syllabe du son en couleur et les cases-syllabes (▢▣▢).
//
// Même fenêtre que « Lettres cursives » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
// L'état (son, place, série, réponses, correction, réglages) est restauré
// après actualisation via save-load.js (_csGetData / _csSetData).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

// ── Les sons ──────────────────────────────────────────────────────────────
// k : code dans les transcriptions ; g : graphies courantes ;
// dit : ce que lit la synthèse vocale ; ex : mot exemple
const CS_SONS = [
    { id: 'a',  k: 'a',  api: '[a]',  g: 'a, â',            dit: 'le son a',  ex: 'chat',    type: 'v' },
    { id: 'i',  k: 'i',  api: '[i]',  g: 'i, y',            dit: 'le son i',  ex: 'lit',     type: 'v' },
    { id: 'o',  k: 'o',  api: '[o]',  g: 'o, au, eau',      dit: 'le son o',  ex: 'moto',    type: 'v' },
    { id: 'u',  k: 'u',  api: '[u]',  g: 'ou',              dit: 'le son ou', ex: 'loup',    type: 'v' },
    { id: 'y',  k: 'y',  api: '[y]',  g: 'u',               dit: 'le son u',  ex: 'lune',    type: 'v' },
    { id: 'e',  k: 'e',  api: '[e]',  g: 'é, er, ez',       dit: 'le son é',  ex: 'vélo',    type: 'v' },
    { id: 'E',  k: 'E',  api: '[ɛ]',  g: 'è, ê, ai, ei, e', dit: 'le son è',  ex: 'fraise',  type: 'v' },
    { id: 'O',  k: 'O',  api: '[ɔ̃]',  g: 'on, om',          dit: 'le son on', ex: 'mouton',  type: 'c2' },
    { id: 'A',  k: 'A',  api: '[ɑ̃]',  g: 'an, en, am, em',  dit: 'le son an', ex: 'enfant',  type: 'c2' },
    { id: 'I',  k: 'I',  api: '[ɛ̃]',  g: 'in, ain, ein',    dit: 'le son in', ex: 'lapin',   type: 'c2' },
    { id: 'wa', k: 'wa', api: '[wa]', g: 'oi',              dit: 'le son oi', ex: 'roi',     type: 'c2' },
    { id: 'S',  k: 'S',  api: '[ʃ]',  g: 'ch',              dit: 'le son que l\'on entend au début de chat',     ex: 'chat',    type: 'c' },
    { id: 'Z',  k: 'Z',  api: '[ʒ]',  g: 'j, g, ge',        dit: 'le son que l\'on entend au début de jeu',      ex: 'jeu',     type: 'c' },
    { id: 'f',  k: 'f',  api: '[f]',  g: 'f, ph',           dit: 'le son que l\'on entend au début de feu',      ex: 'feu',     type: 'c' },
    { id: 'v',  k: 'v',  api: '[v]',  g: 'v',               dit: 'le son que l\'on entend au début de vélo',     ex: 'vélo',    type: 'c' },
    { id: 's',  k: 's',  api: '[s]',  g: 's, ss, c, ç',     dit: 'le son que l\'on entend au début de soleil',   ex: 'soleil',  type: 'c' },
    { id: 'z',  k: 'z',  api: '[z]',  g: 'z, s',            dit: 'le son que l\'on entend au début de zèbre',    ex: 'zèbre',   type: 'c' },
    { id: 'l',  k: 'l',  api: '[l]',  g: 'l, ll',           dit: 'le son que l\'on entend au début de lune',     ex: 'lune',    type: 'c' },
    { id: 'r',  k: 'r',  api: '[r]',  g: 'r, rr',           dit: 'le son que l\'on entend au début de robe',     ex: 'robe',    type: 'c' },
    { id: 'm',  k: 'm',  api: '[m]',  g: 'm, mm',           dit: 'le son que l\'on entend au début de main',     ex: 'main',    type: 'c' },
    { id: 'n',  k: 'n',  api: '[n]',  g: 'n, nn',           dit: 'le son que l\'on entend au début de nez',      ex: 'nez',     type: 'c' },
    { id: 'p',  k: 'p',  api: '[p]',  g: 'p',               dit: 'le son que l\'on entend au début de pomme',    ex: 'pomme',   type: 'c' },
    { id: 'b',  k: 'b',  api: '[b]',  g: 'b',               dit: 'le son que l\'on entend au début de bébé',     ex: 'bébé',    type: 'c' },
    { id: 't',  k: 't',  api: '[t]',  g: 't',               dit: 'le son que l\'on entend au début de tomate',   ex: 'tomate',  type: 'c' },
    { id: 'd',  k: 'd',  api: '[d]',  g: 'd',               dit: 'le son que l\'on entend au début de dé',       ex: 'dé',      type: 'c' },
    { id: 'k',  k: 'k',  api: '[k]',  g: 'c, k, qu',        dit: 'le son que l\'on entend au début de koala',    ex: 'koala',   type: 'c' },
    { id: 'g',  k: 'g',  api: '[g]',  g: 'g, gu',           dit: 'le son que l\'on entend au début de gâteau',   ex: 'gâteau',  type: 'c' }
];
const CS_SON = {};
CS_SONS.forEach(s => { CS_SON[s.id] = s; });

// ── Banque d'images ───────────────────────────────────────────────────────
// emoji | mot | syllabes orales | syllabes écrites (même nombre)
// Codes des sons : a i o (o/ɔ) u (ou) y (u) e (é) E (è) 2 (eu) @ (e muet)
//   O (on) A (an) I (in) — p b t d k g f v s z S (ch) Z (j) l r m n N (gn)
//   j (yod : ill, y) w (oi = wa)
const CS_MOTS_SRC = [
    '🏍️|moto|mo.to|mo.to',           '🐇|lapin|la.pI|la.pin',          '🚲|vélo|ve.lo|vé.lo',
    '🤖|robot|ro.bo|ro.bot',          '🎂|gâteau|ga.to|gâ.teau',        '⛵|bateau|ba.to|ba.teau',
    '🏰|château|Sa.to|châ.teau',      '🎁|cadeau|ka.do|ca.deau',        '🎩|chapeau|Sa.po|cha.peau',
    '🎹|piano|pja.no|pia.no',         '📻|radio|ra.djo|ra.dio',         '🦴|os|os|os',
    '🌹|rose|roz|rose',               '🍎|pomme|pom|pomme',             '🍊|orange|o.rAZ|o.range',
    '👂|oreille|o.rEj|o.reille',      '💻|ordinateur|or.di.na.t2r|or.di.na.teur',
    '🐨|koala|ko.a.la|ko.a.la',       '🐊|crocodile|kro.ko.dil|cro.co.dile',
    '🐌|escargot|Es.kar.go|es.car.got', '🦉|hibou|i.bu|hi.bou',         '🐺|loup|lu|loup',
    '🐔|poule|pul|poule',             '🐭|souris|su.ri|sou.ris',        '🐑|mouton|mu.tO|mou.ton',
    '👄|bouche|buS|bouche',           '🚿|douche|duS|douche',           '🐢|tortue|tor.ty|tor.tue',
    '🌙|lune|lyn|lune',               '🌷|tulipe|ty.lip|tu.lipe',       '🚌|bus|bys|bus',
    '🚀|fusée|fy.ze|fu.sée',          '☁️|nuage|ny.aZ|nu.age',          '🛏️|lit|li|lit',
    '🍚|riz|ri|riz',                  '🍕|pizza|pid.za|piz.za',         '🍋|citron|si.trO|ci.tron',
    '🍒|cerise|s@.riz|ce.rise',       '🦒|girafe|Zi.raf|gi.rafe',       '🦁|lion|ljO|lion',
    '🐝|abeille|a.bEj|a.beille',      '🍍|ananas|a.na.nas|a.na.nas',    '✈️|avion|a.vjO|a.vion',
    '🌳|arbre|arbr|arbre',            '🍌|banane|ba.nan|ba.nane',       '🐱|chat|Sa|chat',
    '👜|sac|sak|sac',                 '🦆|canard|ka.nar|ca.nard',       '🐼|panda|pA.da|pan.da',
    '🐴|cheval|S@.val|che.val',       '⚽|ballon|ba.lO|bal.lon',        '🍬|bonbon|bO.bO|bon.bon',
    '🏠|maison|mE.zO|mai.son',        '🐷|cochon|ko.SO|co.chon',        '🐟|poisson|pwa.sO|pois.son',
    '🌉|pont|pO|pont',                '🐉|dragon|dra.gO|dra.gon',       '🚚|camion|ka.mjO|ca.mion',
    '🍄|champignon|SA.pi.NO|cham.pi.gnon', '🎻|violon|vjo.lO|vio.lon',
    '🐘|éléphant|e.le.fA|é.lé.phant', '🧒|enfant|A.fA|en.fant',         '🦷|dent|dA|dent',
    '🧤|gant|gA|gant',                '⛺|tente|tAt|tente',             '💡|ampoule|A.pul|am.poule',
    '🐍|serpent|sEr.pA|ser.pent',     '🦘|kangourou|kA.gu.ru|kan.gou.rou', '👖|pantalon|pA.ta.lO|pan.ta.lon',
    '🎄|sapin|sa.pI|sa.pin',          '🍞|pain|pI|pain',                '✋|main|mI|main',
    '🚆|train|trI|train',             '🍇|raisin|rE.zI|rai.sin',        '🐬|dauphin|do.fI|dau.phin',
    '🐥|poussin|pu.sI|pous.sin',      '🦈|requin|r@.kI|re.quin',        '🐦|oiseau|wa.zo|oi.seau',
    '🤴|roi|rwa|roi',                 '⭐|étoile|e.twal|é.toile',       '🍐|poire|pwar|poire',
    '🍴|fourchette|fur.SEt|four.chette', '👟|chaussure|So.syr|chaus.sure', '🐶|chien|SjI|chien',
    '🍫|chocolat|So.ko.la|cho.co.lat', '🔔|cloche|kloS|cloche',         '🐮|vache|vaS|vache',
    '👔|chemise|S@.miz|che.mise',     '🪓|hache|aS|hache',              '🥋|judo|Zy.do|ju.do',
    '🦵|jambe|ZAb|jambe',             '📰|journal|Zur.nal|jour.nal',    '🧀|fromage|fro.maZ|fro.mage',
    '🏖️|plage|plaZ|plage',            '🕯️|bougie|bu.Zi|bou.gie',        '🎮|jeu|Z2|jeu',
    '🌸|fleur|fl2r|fleur',            '🔥|feu|f2|feu',                  '🧚|fée|fe|fée',
    '🍓|fraise|frEz|fraise',          '🐜|fourmi|fur.mi|four.mi',       '☕|café|ka.fe|ca.fé',
    '🌋|volcan|vol.kA|vol.can',       '🧳|valise|va.liz|va.lise',       '🚗|voiture|vwa.tyr|voi.ture',
    '📖|livre|livr|livre',            '🥗|salade|sa.lad|sa.lade',       '☀️|soleil|so.lEj|so.leil',
    '🧜|sirène|si.rEn|si.rène',       '🐒|singe|sIZ|singe',             '🐻|ours|urs|ours',
    '🌵|cactus|kak.tys|cac.tus',      '🍦|glace|glas|glace',            '🦓|zèbre|zEbr|zèbre',
    '🦎|lézard|le.zar|lé.zard',       '✂️|ciseaux|si.zo|ci.seaux',      '🥛|lait|lE|lait',
    '🔍|loupe|lup|loupe',             '👓|lunettes|ly.nEt|lu.nettes',   '🥣|bol|bol|bol',
    '🐀|rat|ra|rat',                  '🦊|renard|r@.nar|re.nard',       '👗|robe|rob|robe',
    '🥁|tambour|tA.bur|tam.bour',     '🌊|mer|mEr|mer',                 '⌚|montre|mOtr|montre',
    '👨|homme|om|homme',              '👃|nez|ne|nez',                  '❄️|neige|nEZ|neige',
    '🦶|pied|pje|pied',               '🦋|papillon|pa.pi.jO|pa.pil.lon', '🍲|soupe|sup|soupe',
    '👶|bébé|be.be|bé.bé',            '🍅|tomate|to.mat|to.mate',       '🐅|tigre|tigr|tigre',
    '📺|télé|te.le|té.lé',            '🥕|carotte|ka.rot|ca.rotte',     '🥔|patate|pa.tat|pa.tate',
    '🎲|dé|de|dé',                    '🦕|dinosaure|di.no.zor|di.no.saure', '🥝|kiwi|ki.wi|ki.wi',
    '🐓|coq|kok|coq',                 '🦍|gorille|go.rij|go.rille',     '🎸|guitare|gi.tar|gui.tare',
    '🐸|grenouille|gr@.nuj|gre.nouille', '🐙|pieuvre|pj2vr|pieuvre',   '🦀|crabe|krab|crabe',
    '🐁|souris|su.ri|sou.ris',        '🧁|gâteau|ga.to|gâ.teau',
    '🎈|ballon|ba.lO|bal.lon',        '🪁|cerf-volant|sEr.vo.lA|cerf.vo.lant',
    '🛶|canoë|ka.no.e|ca.no.ë',       '🚂|locomotive|lo.ko.mo.tiv|lo.co.mo.tive',
    '🚁|hélicoptère|e.li.kop.tEr|é.li.cop.tère', '🚜|tracteur|trak.t2r|trac.teur',
    '🚒|camion|ka.mjO|ca.mion',       '🧸|nounours|nu.nurs|nou.nours',  '🪀|yoyo|jo.jo|yo.yo',
    '🎺|trompette|trO.pEt|trom.pette', '🥖|baguette|ba.gEt|ba.guette',  '🍉|pastèque|pas.tEk|pas.tèque',
    '🌽|maïs|ma.is|ma.ïs',            '🥚|œuf|2f|œuf',                  '🍯|miel|mjEl|miel',
    '🐞|coccinelle|kok.si.nEl|coc.ci.nelle', '🦔|hérisson|e.ri.sO|hé.ris.son', '🐧|pingouin|pI.gwI|pin.gouin',
    '🦜|perroquet|pE.ro.kE|per.ro.quet', '🐿️|écureuil|e.ky.r2j|é.cu.reuil', '🐋|baleine|ba.lEn|ba.leine',
    '🦩|flamant|fla.mA|fla.mant',     '🦇|chauve-souris|Sov.su.ri|chauve.sou.ris',
    '🌈|arc-en-ciel|ar.kA.sjEl|arc.en.ciel', '🌻|tournesol|tur.n@.sol|tour.ne.sol',
    '🔑|clé|kle|clé',                 '🔨|marteau|mar.to|mar.teau',     '✏️|crayon|krE.jO|cra.yon',
    '📏|règle|rEgl|règle',            '🧦|chaussette|So.sEt|chaus.sette', '🧣|écharpe|e.Sarp|é.charpe',
    '👑|couronne|ku.ron|cou.ronne',   '🪑|chaise|SEz|chaise',
    '🕷️|araignée|a.rE.Ne|a.rai.gnée', '🐐|chèvre|SEvr|chèvre',        '🦌|cerf|sEr|cerf',
    '0️⃣|zéro|ze.ro|zé.ro',            '🪞|miroir|mi.rwar|mi.roir',      '🪵|bois|bwa|bois',
    '3️⃣|trois|trwa|trois',            '🧅|oignon|o.NO|oi.gnon',         '🍷|verre|vEr|verre'
];
const CS_MOTS = (() => {
    const seen = new Set();
    const out = [];
    CS_MOTS_SRC.forEach(line => {
        const p = line.split('|');
        if (p.length !== 4 || seen.has(p[1])) return;
        let phon = p[2].split('.'), orth = p[3].split('.');
        if (phon.length !== orth.length) { phon = [phon.join('')]; orth = [orth.join('')]; }
        seen.add(p[1]);
        out.push({ e: p[0], w: p[1], ph: phon, or: orth });
    });
    return out;
})();
const CS_MOT = {};
CS_MOTS.forEach(m => { CS_MOT[m.w] = m; });

const CS_POS = {
    tout:   { lbl: 'Partout',   titre: 'Le son peut être n\'importe où dans le mot', dit: '' },
    debut:  { lbl: 'Au début',  titre: 'Le son est au début du mot (1re syllabe)',   dit: ' au début du mot' },
    milieu: { lbl: 'Au milieu', titre: 'Le son est au milieu du mot',                 dit: ' au milieu du mot' },
    fin:    { lbl: 'À la fin',  titre: 'Le son est à la fin du mot (dernière syllabe)', dit: ' à la fin du mot' }
};
const CS_NBS = [6, 8, 12];

// Où le son apparaît-il dans le mot ? → { debut, milieu, fin, syl:[indices] }
// Mot de plusieurs syllabes : 1re syllabe = début, dernière = fin, autres = milieu.
// Mot d'une syllabe : 1er son = début, dernier son = fin, sinon milieu.
function _csWhere(mot, sonId) {
    const son = CS_SON[sonId];
    const k = son.k;
    const res = { debut: false, milieu: false, fin: false, syl: [] };
    const find = (s) => {
        const out = [];
        for (let i = 0; i <= s.length - k.length; i++) {
            if (s.substr(i, k.length) !== k) continue;
            if (k === 'a' && s[i - 1] === 'w') continue;   // le « a » de « oi » ne compte pas
            out.push(i);
        }
        return out;
    };
    const n = mot.ph.length;
    mot.ph.forEach((syl, si) => {
        const at = find(syl);
        if (!at.length) return;
        res.syl.push(si);
        if (n > 1) {
            if (si === 0) res.debut = true;
            else if (si === n - 1) res.fin = true;
            else res.milieu = true;
        } else {
            at.forEach(i => {
                if (i === 0) res.debut = true;
                else if (i + k.length >= syl.length) res.fin = true;
                else res.milieu = true;
            });
        }
    });
    return res;
}
function _csHas(mot, sonId, pos) {
    const w = _csWhere(mot, sonId);
    if (!w.syl.length) return false;
    return pos === 'tout' ? true : !!w[pos];
}
function _csShuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function _csEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _csIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
function _csSpeak(text) {
    try {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'fr-FR';
        u.rate = 0.85;
        const v = (window.speechSynthesis.getVoices() || []).find(x => /^fr/i.test(x.lang));
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('cs-style')) return;
    const s = document.createElement('style');
    s.id = 'cs-style';
    s.textContent = `
        .widget[data-type="chasse-son"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .cs-container {
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
            -webkit-user-select: none;
            overflow: hidden;
        }
        .cs-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .cs-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .cs-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #fef3c7; color: #92400e; }

        .cs-container.wf-minimized > *:not(.cs-header) { display: none !important; }
        .cs-container.wf-minimized { gap: 0; }
        .cs-container.wf-fullboard {
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
            .cs-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
            .cs-container .cs-sep { display: none; }
            .cs-container .cs-tools { gap: 4px; padding: 4px; }
            .cs-container .cs-btn { padding: 4px 8px; }
            .cs-container .cs-consigne, .cs-container.wf-fullboard .cs-consigne { font-size: 15px; padding: 6px 8px; gap: 8px; flex-wrap: nowrap; }
            .cs-container .cs-consigne .cs-txt { min-width: 0; }
            .cs-container .cs-son { font-size: 1.3em; padding: 3px 8px; }
            .cs-container .cs-say { font-size: 17px; padding: 2px 6px; }
            .cs-container .cs-info, .cs-container.wf-fullboard .cs-info { font-size: 14px; padding: 6px 10px; }
            .cs-container .cs-grid { gap: 7px; }
        }

        .cs-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .cs-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .cs-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .cs-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .cs-btn:active { transform: scale(0.96); }
        .cs-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .cs-btn-blue  { background: #4a90e2; color: #fff; }
        .cs-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .cs-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .cs-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .cs-btn-green { background: #28a745; color: #fff; }
        .cs-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .cs-btn.on    { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .cs-seg { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .cs-seg button {
            padding: 5px 9px; border: none; background: #f5f5f5; font-size: 11px; font-weight: 700;
            color: #555; cursor: pointer; border-right: 1px solid #ddd;
        }
        .cs-seg button:last-child { border-right: none; }
        .cs-seg button.active { background: #fef3c7; color: #92400e; }
        .cs-select {
            padding: 4px 6px; border-radius: 8px; border: 1px solid #ddd; background: #fff;
            font-size: 12px; font-weight: 700; color: #374151; cursor: pointer; max-width: 230px;
        }

        /* Consigne */
        .cs-consigne {
            display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
            padding: 8px 12px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a;
            font-size: 18px; color: #78350f; line-height: 1.35;
        }
        .cs-son {
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 900; font-size: 1.6em; line-height: 1;
            background: #f59e0b; color: #fff; border-radius: 12px; padding: 4px 12px; flex-shrink: 0;
        }
        .cs-son small { display: block; font-size: .38em; font-weight: 700; opacity: .9; text-align: center; margin-top: 2px; }
        .cs-consigne .cs-txt { flex: 1; min-width: 180px; }
        .cs-train { display: inline-flex; gap: 3px; vertical-align: middle; margin-left: 6px; }
        .cs-train i { width: 16px; height: 16px; border-radius: 3px; border: 2px solid #b45309; display: inline-block; box-sizing: border-box; }
        .cs-train i.on { background: #f59e0b; border-color: #b45309; }
        .cs-say {
            flex-shrink: 0; border: 1px solid #fcd34d; background: #fff; border-radius: 10px; cursor: pointer;
            font-size: 20px; padding: 3px 9px;
        }
        .cs-say:hover { background: #fef3c7; }

        /* Images */
        .cs-grid-wrap { position: relative; flex-shrink: 0; overflow: hidden; }
        .cs-grid {
            --cs: 120px;
            display: grid; gap: 10px; justify-content: center; align-content: center;
            height: 100%; box-sizing: border-box; padding: 4px;
        }
        .cs-card {
            width: var(--cs); height: var(--cs); box-sizing: border-box;
            border-radius: calc(var(--cs) * .12); border: 3px solid #e5e7eb; background: #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,.08);
            position: relative; cursor: pointer; overflow: hidden;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: transform .12s, border-color .15s, box-shadow .15s, background .15s;
            touch-action: manipulation;
        }
        .cs-card:hover { transform: translateY(-2px); box-shadow: 0 5px 12px rgba(0,0,0,.12); }
        .cs-card:active { transform: scale(.97); }
        .cs-emo {
            font-size: calc(var(--cs) * .5); line-height: 1.1;
            font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
            pointer-events: none;
        }
        .cs-word {
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; color: #374151;
            font-size: max(11px, calc(var(--cs) * .13)); line-height: 1.15; margin-top: 2px; pointer-events: none;
            white-space: nowrap;
        }
        .cs-word.long { font-size: max(10px, calc(var(--cs) * .1)); }
        .cs-word .hl { color: #dc2626; background: #fee2e2; border-radius: 4px; padding: 0 1px; }
        .cs-word .sep { color: #cbd5e1; font-weight: 400; }
        .cs-boxes { display: flex; gap: 3px; margin-top: 3px; pointer-events: none; }
        .cs-boxes i {
            width: max(9px, calc(var(--cs) * .1)); height: max(9px, calc(var(--cs) * .1));
            border: 2px solid #9ca3af; border-radius: 3px; box-sizing: border-box; display: block;
        }
        .cs-boxes i.on { background: #ef4444; border-color: #b91c1c; }
        .cs-card .cs-play {
            position: absolute; top: 4px; right: 4px; border: none; background: rgba(255,255,255,.9);
            border-radius: 50%; width: max(24px, calc(var(--cs) * .22)); height: max(24px, calc(var(--cs) * .22));
            font-size: max(12px, calc(var(--cs) * .12)); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.2);
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .cs-card .cs-mark {
            position: absolute; top: 4px; left: 6px; font-size: max(16px, calc(var(--cs) * .18)); line-height: 1;
            pointer-events: none; font-weight: 900;
        }
        .cs-card.sel { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 0 0 3px #fde68a; }
        .cs-card.ok   { border-color: #16a34a; background: #f0fdf4; box-shadow: 0 0 0 3px #bbf7d0; }
        .cs-card.ko   { border-color: #dc2626; background: #fef2f2; box-shadow: 0 0 0 3px #fecaca; }
        .cs-card.miss { border-color: #f59e0b; border-style: dashed; background: #fff; }
        .cs-card.no   { opacity: .55; }
        .cs-card.ok .cs-mark   { color: #16a34a; }
        .cs-card.ko .cs-mark   { color: #dc2626; }
        .cs-card.miss .cs-mark { color: #d97706; }
        .cs-flash { animation: csFlash .5s ease-out; }
        @keyframes csFlash { 40% { transform: scale(1.07); } }

        .cs-empty { font-size: 15px; color: #9ca3af; font-weight: 600; text-align: center; padding: 30px; }

        /* Résultat */
        .cs-info {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4; min-height: 24px;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
        }
        .cs-info.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .cs-info.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .cs-container.wf-fullboard .cs-consigne { font-size: 22px; }
        .cs-container.wf-fullboard .cs-info { font-size: 19px; }

        /* Aide */
        .cs-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cs-help-btn:hover { background: #e0e0e0; color: #333; }
        .cs-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .cs-help-popup.show { display: block; }
        .cs-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .cs-help-popup p { margin: 0 0 6px; }
        .cs-help-popup p:last-child { margin-bottom: 0; }

        .cs-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .cs-container:hover .cs-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Création du widget ────────────────────────────────────────────────────
function createChasseSonWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'chasse-son';
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
    container.className = 'cs-container';
    const initW = Math.round(window.innerWidth * 0.7);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'cs-header';
    header.innerHTML = `
        <span class="cs-title">👂 Chasse au son</span>
        <span class="cs-badge">[o]</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.cs-badge');
    container.appendChild(header);

    // ── Réglages ──────────────────────────────────────────────────────────
    const groupe = (t, lbl) => `<optgroup label="${lbl}">` + CS_SONS.filter(s => s.type === t)
        .map(s => `<option value="${s.id}">${s.api}  ${s.g}  (${s.ex})</option>`).join('') + '</optgroup>';
    const tools = document.createElement('div');
    tools.className = 'cs-tools';
    tools.innerHTML = `
        <span class="cs-lbl">Son</span>
        <select class="cs-select" data-role="son" title="Le son à chercher">
            ${groupe('v', 'Voyelles')}${groupe('c2', 'Sons complexes')}${groupe('c', 'Consonnes')}
        </select>
        <span class="cs-sep"></span>
        <div class="cs-seg" data-group="pos">
            ${Object.keys(CS_POS).map(k => `<button data-pos="${k}" title="${CS_POS[k].titre}">${CS_POS[k].lbl}</button>`).join('')}
        </div>
        <span class="cs-sep"></span>
        <span class="cs-lbl">Images</span>
        <div class="cs-seg" data-group="nb">
            ${CS_NBS.map(n => `<button data-nb="${n}">${n}</button>`).join('')}
        </div>
        <span class="cs-sep"></span>
        <button class="cs-btn cs-btn-grey" data-act="toggle-words" title="Écrire le mot sous chaque image">🔤 Mots</button>
        <button class="cs-btn cs-btn-grey" data-act="toggle-tap" title="Dire le mot quand on touche l'image">🔊 Au toucher</button>
    `;
    const sonSel = tools.querySelector('[data-role="son"]');
    container.appendChild(tools);

    // ── Consigne ──────────────────────────────────────────────────────────
    const consigne = document.createElement('div');
    consigne.className = 'cs-consigne';
    container.appendChild(consigne);

    // ── Images ────────────────────────────────────────────────────────────
    const gridWrap = document.createElement('div');
    gridWrap.className = 'cs-grid-wrap';
    gridWrap.style.height = Math.round(initH * 0.62) + 'px';
    const grid = document.createElement('div');
    grid.className = 'cs-grid';
    gridWrap.appendChild(grid);
    container.appendChild(gridWrap);

    // ── Boutons de jeu ────────────────────────────────────────────────────
    const play = document.createElement('div');
    play.className = 'cs-tools';
    play.innerHTML = `
        <button class="cs-btn cs-btn-green" data-act="check" title="Corriger">✓ Vérifier</button>
        <button class="cs-btn cs-btn-blue" data-act="new" title="Tirer de nouvelles images">🎲 Nouvelle série</button>
        <button class="cs-btn cs-btn-grey" data-act="replay" title="Effacer les réponses et rejouer la même série">↺ Rejouer</button>
        <button class="cs-btn cs-btn-grey" data-act="say-all" title="Dire tous les mots, l'un après l'autre">🔊 Tous les mots</button>
        <button class="cs-btn cs-btn-grey" data-act="reveal" title="Montrer la solution sans compter les points">👁 Solution</button>
    `;
    container.appendChild(play);

    const info = document.createElement('div');
    info.className = 'cs-info';
    container.appendChild(info);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'cs-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'cs-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Chasse au son</h4>
        <p>Choisissez le <b>son</b> (voyelles, sons complexes comme [ɔ̃] « on » ou [wa] « oi », consonnes) et sa
        <b>place</b> : partout, au début, au milieu ou à la fin du mot. Les cases ▢▣▢ de la consigne montrent la place.</p>
        <p>L'élève <b>touche les images</b> où il entend le son (elles se colorent en jaune). Le petit <b>🔊</b> de
        chaque image dit le mot ; <b>🔊 Au toucher</b> le dit aussi quand on touche l'image.
        <b>🔤 Mots</b> écrit les mots sous les images (à masquer pour un travail uniquement oral).</p>
        <p><b>✓ Vérifier</b> : ✓ vert = bien trouvée, ✗ rouge = le son n'y est pas (ou pas à cette place),
        pointillés orange = image oubliée. Le mot s'écrit avec la <b>syllabe du son en rouge</b> et les cases-syllabes.</p>
        <p>Place du son : dans un mot de plusieurs syllabes, <b>début</b> = 1re syllabe, <b>fin</b> = dernière syllabe,
        <b>milieu</b> = entre les deux. Dans un mot d'une seule syllabe, on regarde si le son est le premier ou le dernier entendu.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'cs-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let son = 'o';
    let place = 'tout';
    let nb = 8;
    let showWords = false;
    let sayOnTap = true;
    let serie = [];          // mots (clés de CS_MOT)
    let sel = new Set();     // indices touchés
    let checked = false;     // correction affichée
    let revealed = false;    // solution montrée (sans points)
    let lastMsg = null;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Tirage d'une série ────────────────────────────────────────────────
    function newSerie() {
        const targets = _csShuffle(CS_MOTS.filter(m => _csHas(m, son, place)));
        const elsewhere = place === 'tout' ? [] : _csShuffle(CS_MOTS.filter(m => _csHas(m, son, 'tout') && !_csHas(m, son, place)));
        const none = _csShuffle(CS_MOTS.filter(m => !_csHas(m, son, 'tout')));
        // Pas deux fois le même emoji (ex. deux souris)
        const usedE = new Set();
        const take = (list, n) => {
            const out = [];
            for (const m of list) {
                if (out.length >= n) break;
                if (usedE.has(m.e) || usedE.has(m.w)) continue;
                usedE.add(m.e); usedE.add(m.w);
                out.push(m);
            }
            return out;
        };
        const want = Math.max(1, Math.round(nb * (0.35 + Math.random() * 0.25)));
        const t = take(targets, want);
        const restN = nb - t.length;
        const e = take(elsewhere, Math.min(elsewhere.length, Math.round(restN * 0.5)));
        const d = take(none, nb - t.length - e.length);
        serie = _csShuffle(t.concat(e, d)).map(m => m.w);
        sel = new Set();
        checked = false;
        revealed = false;
        lastMsg = null;
        renderAll();
        save();
    }
    function replay() {
        sel = new Set();
        checked = false;
        revealed = false;
        lastMsg = null;
        renderAll();
        save();
    }

    // ── Consigne ──────────────────────────────────────────────────────────
    function trainHTML() {
        if (place === 'tout') return '';
        const on = place === 'debut' ? 0 : (place === 'milieu' ? 1 : 2);
        return `<span class="cs-train" title="${CS_POS[place].titre}">${[0, 1, 2].map(i => `<i class="${i === on ? 'on' : ''}"></i>`).join('')}</span>`;
    }
    function consigneDite() {
        const s = CS_SON[son];
        return `Touche les images où tu entends ${s.dit}${CS_POS[place].dit}.`;
    }
    function renderConsigne() {
        const s = CS_SON[son];
        const where = place === 'tout' ? '' : ` <b>${CS_POS[place].lbl.toLowerCase()}</b> du mot${trainHTML()}`;
        consigne.innerHTML = `
            <span class="cs-son">${_csEsc(s.api)}<small>${_csEsc(s.g)}</small></span>
            <span class="cs-txt">Touche les images où tu entends <b>${_csEsc(s.api)}</b>, comme dans « ${_csEsc(s.ex)} »${where}.</span>
            <button class="cs-say" data-act="say-consigne" title="Lire la consigne">🔊</button>
        `;
        badge.textContent = s.api + (place === 'tout' ? '' : ' · ' + CS_POS[place].lbl.toLowerCase());
    }

    // ── Cartes ────────────────────────────────────────────────────────────
    function wordHTML(m, hl) {
        const w = hl ? _csWhere(m, son) : null;
        const sylOn = (si) => {
            if (!w) return false;
            if (!w.syl.includes(si)) return false;
            if (place === 'tout' || m.or.length === 1) return true;
            const n = m.or.length;
            const p = si === 0 ? 'debut' : (si === n - 1 ? 'fin' : 'milieu');
            return p === place;
        };
        if (!hl) return _csEsc(m.w);
        return m.or.map((o, si) => `<span class="${sylOn(si) ? 'hl' : ''}">${_csEsc(o)}</span>`)
            .join('<span class="sep">·</span>');
    }
    function boxesHTML(m) {
        const w = _csWhere(m, son);
        return `<span class="cs-boxes">${m.ph.map((x, si) => `<i class="${w.syl.includes(si) ? 'on' : ''}"></i>`).join('')}</span>`;
    }

    function renderGrid() {
        grid.innerHTML = '';
        if (!serie.length) {
            grid.innerHTML = '<div class="cs-empty">Aucune image : cliquez sur 🎲 Nouvelle série.</div>';
            return;
        }
        const show = checked || revealed;
        serie.forEach((key, i) => {
            const m = CS_MOT[key];
            if (!m) return;
            const good = _csHas(m, son, place);
            const c = document.createElement('div');
            c.className = 'cs-card';
            c.dataset.i = i;
            let mark = '';
            if (show) {
                const s = sel.has(i);
                if (checked) {
                    if (good && s)        { c.classList.add('ok');   mark = '✓'; }
                    else if (!good && s)  { c.classList.add('ko');   mark = '✗'; }
                    else if (good && !s)  { c.classList.add('miss'); mark = '!'; }
                    else                    c.classList.add('no');
                } else {
                    if (good) { c.classList.add('ok'); mark = '✓'; } else c.classList.add('no');
                }
            } else if (sel.has(i)) {
                c.classList.add('sel');
                mark = '✋';
            }
            const hasSon = _csHas(m, son, 'tout');
            c.innerHTML = `
                <span class="cs-mark">${mark}</span>
                <button class="cs-play" data-play="${i}" title="Écouter le mot">🔊</button>
                <span class="cs-emo">${m.e}</span>
                ${(showWords || show) ? `<span class="cs-word${m.w.length > 9 ? ' long' : ''}">${wordHTML(m, show && hasSon)}</span>` : ''}
                ${show && hasSon ? boxesHTML(m) : ''}
            `;
            c.title = m.w;
            grid.appendChild(c);
        });
        requestAnimationFrame(fit);
    }

    // Taille des cartes : la plus grande possible dans la zone
    function fit() {
        const W = gridWrap.clientWidth - 10, H = gridWrap.clientHeight - 10;
        const n = Math.max(1, serie.length);
        if (W <= 0 || H <= 0) return;
        const gap = 10;
        let best = { cols: 1, size: 0 };
        for (let cols = 1; cols <= n; cols++) {
            const rows = Math.ceil(n / cols);
            const size = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows);
            if (size > best.size) best = { cols, size };
        }
        const size = Math.max(60, Math.min(260, Math.floor(best.size)));
        grid.style.setProperty('--cs', size + 'px');
        grid.style.gridTemplateColumns = `repeat(${best.cols}, ${size}px)`;
    }

    function setInfo(cls, html) {
        info.className = 'cs-info' + (cls ? ' ' + cls : '');
        info.innerHTML = html;
    }
    function renderInfo() {
        if (lastMsg) { setInfo(lastMsg.cls, lastMsg.html); return; }
        const avail = CS_MOTS.filter(m => _csHas(m, son, place)).length;
        if (avail < 2) {
            setInfo('warn', `⚠️ Peu d'images contiennent ${_csEsc(CS_SON[son].api)} ${place === 'tout' ? '' : CS_POS[place].lbl.toLowerCase() + ' du mot'} : essayez une autre place.`);
            return;
        }
        setInfo('', sel.size
            ? `✋ ${sel.size} image${sel.size > 1 ? 's' : ''} choisie${sel.size > 1 ? 's' : ''}. Quand tu as fini, clique sur <b>✓ Vérifier</b>.`
            : '👆 Touche une image pour la choisir, touche-la encore pour l\'enlever. Le 🔊 dit le mot.');
    }

    function renderBars() {
        sonSel.value = son;
        tools.querySelectorAll('[data-pos]').forEach(b => b.classList.toggle('active', b.dataset.pos === place));
        tools.querySelectorAll('[data-nb]').forEach(b => b.classList.toggle('active', +b.dataset.nb === nb));
        tools.querySelector('[data-act="toggle-words"]').classList.toggle('on', showWords);
        tools.querySelector('[data-act="toggle-tap"]').classList.toggle('on', sayOnTap);
        play.querySelector('[data-act="check"]').disabled = checked || revealed || !serie.length;
        play.querySelector('[data-act="reveal"]').disabled = checked || revealed || !serie.length;
        play.querySelector('[data-act="replay"]').disabled = !sel.size && !checked && !revealed;
    }
    function renderAll() {
        renderConsigne();
        renderBars();
        renderGrid();
        renderInfo();
        if (_isMax) requestAnimationFrame(fitFullHeight);
    }

    // ── Correction ────────────────────────────────────────────────────────
    function check() {
        if (!serie.length || checked) return;
        let ok = 0, ko = 0, miss = 0, total = 0;
        serie.forEach((key, i) => {
            const good = _csHas(CS_MOT[key], son, place);
            if (good) total++;
            if (good && sel.has(i)) ok++;
            else if (!good && sel.has(i)) ko++;
            else if (good) miss++;
        });
        checked = true;
        const err = ko + miss;
        let cls = 'ok', html;
        if (!err) html = `🌟 Bravo ! Tu as trouvé ${total > 1 ? 'les ' + total + ' images' : 'l\'image'} sans te tromper.`;
        else if (err === 1) html = `👍 Presque ! ${ok} sur ${total} trouvée${ok > 1 ? 's' : ''}.`;
        else { cls = 'warn'; html = `💪 ${ok} sur ${total} trouvée${ok > 1 ? 's' : ''}.`; }
        const det = [];
        if (miss) det.push(`<b>${miss}</b> oubliée${miss > 1 ? 's' : ''} (pointillés)`);
        if (ko) det.push(`<b>${ko}</b> en trop (✗)`);
        if (det.length) html += ' ' + det.join(', ') + '. Écoute bien les mots et regarde la syllabe en rouge.';
        lastMsg = { cls, html };
        renderAll();
        save();
    }
    function reveal() {
        if (!serie.length || checked) return;
        revealed = true;
        lastMsg = { cls: '', html: '👁 Voici les images où l\'on entend le son. Clique sur <b>↺ Rejouer</b> pour recommencer.' };
        renderAll();
        save();
    }

    let sayTimer = null;
    function sayAll() {
        clearTimeout(sayTimer);
        let i = 0;
        const cards = () => grid.querySelectorAll('.cs-card');
        const next = () => {
            if (!document.body.contains(widget) || i >= serie.length) return;
            const c = cards()[i];
            if (c) { c.classList.remove('cs-flash'); void c.offsetWidth; c.classList.add('cs-flash'); }
            _csSpeak(CS_MOT[serie[i]].w);
            i++;
            sayTimer = setTimeout(next, 1300);
        };
        next();
    }

    // ── Événements ────────────────────────────────────────────────────────
    grid.addEventListener('click', (e) => {
        e.stopPropagation();
        const pb = e.target.closest('[data-play]');
        if (pb) { _csSpeak(CS_MOT[serie[+pb.dataset.play]].w); return; }
        const c = e.target.closest('.cs-card');
        if (!c) return;
        const i = +c.dataset.i;
        if (sayOnTap) _csSpeak(CS_MOT[serie[i]].w);
        if (checked || revealed) return;
        if (sel.has(i)) sel.delete(i); else sel.add(i);
        lastMsg = null;
        c.classList.toggle('sel', sel.has(i));
        c.querySelector('.cs-mark').textContent = sel.has(i) ? '✋' : '';
        renderBars();
        renderInfo();
        save();
    });

    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-pos],[data-nb]');
        if (!b || !container.contains(b) || grid.contains(b)) return;
        e.stopPropagation();
        if (b.dataset.pos) { place = b.dataset.pos; newSerie(); return; }
        if (b.dataset.nb)  { nb = +b.dataset.nb; newSerie(); return; }
        switch (b.dataset.act) {
            case 'check': check(); break;
            case 'new': newSerie(); break;
            case 'replay': replay(); break;
            case 'reveal': reveal(); break;
            case 'say-all': sayAll(); break;
            case 'say-consigne': _csSpeak(consigneDite()); break;
            case 'toggle-words': showWords = !showWords; renderBars(); renderGrid(); save(); break;
            case 'toggle-tap': sayOnTap = !sayOnTap; renderBars(); save(); break;
        }
    });
    sonSel.addEventListener('change', () => { son = sonSel.value; newSerie(); });
    sonSel.addEventListener('mousedown', (e) => e.stopPropagation());

    // Les zones de travail ne déplacent pas le widget
    [tools, consigne, gridWrap, play, info].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la zone d'images) ───
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = gridWrap.offsetHeight;
        return (x, y) => {
            container.style.width  = Math.max(420, startW + x - x0) + 'px';
            gridWrap.style.height  = Math.max(150, startH + y - y0) + 'px';
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

    let _ro = null;
    if (typeof ResizeObserver === 'function') { _ro = new ResizeObserver(() => fit()); _ro.observe(gridWrap); }
    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); if (_ro) _ro.disconnect(); clearTimeout(sayTimer); return; }
        if (_isMax) fitFullHeight();
        fit();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    function fitFullHeight() {
        const others = [header, tools, consigne, play, info].reduce((a, el) => a + (el.offsetHeight || 0), 0);
        const avail = window.innerHeight - others - 9 * 5 - 30;
        gridWrap.style.height = Math.max(150, Math.round(avail)) + 'px';
        fit();
    }

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '👂 Chasse au son', { onExpand: () => requestAnimationFrame(fit) });
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
            _savedH = gridWrap.style.height;
            container.classList.add('wf-fullboard');
            requestAnimationFrame(fitFullHeight);
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) gridWrap.style.height = _savedH;
        }
        requestAnimationFrame(fit);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(sayTimer);
        window.removeEventListener('resize', onWinResize);
        if (_ro) _ro.disconnect();
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

    newSerie();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._csGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        gridH:      _isMax ? (parseFloat(_savedH) || gridWrap.offsetHeight) : gridWrap.offsetHeight,
        son, place, nb, showWords, sayOnTap,
        serie: serie.slice(),
        sel: [...sel],
        checked, revealed,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_csIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._csSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_csIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.gridH)      gridWrap.style.height = d.gridH + 'px';
        if (CS_SON[d.son]) son = d.son;
        if (CS_POS[d.place]) place = d.place;
        if (CS_NBS.includes(+d.nb)) nb = +d.nb;
        if (typeof d.showWords === 'boolean') showWords = d.showWords;
        if (typeof d.sayOnTap === 'boolean') sayOnTap = d.sayOnTap;
        const s = Array.isArray(d.serie) ? d.serie.filter(k => CS_MOT[k]) : [];
        if (s.length) {
            serie = s;
            sel = new Set((Array.isArray(d.sel) ? d.sel : []).map(Number).filter(i => i >= 0 && i < serie.length));
            checked = !!d.checked;
            revealed = !checked && !!d.revealed;
            lastMsg = null;
            if (checked) { checked = false; check(); }
            else if (revealed) { revealed = false; reveal(); }
            else renderAll();
        } else {
            newSerie();
        }
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
