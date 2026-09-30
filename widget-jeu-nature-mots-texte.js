// =========================================================================
// WIDGET « CHASSE AUX MOTS » — Nature des mots dans un texte
// Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-nature-mots-texte'.
// Design repris de widget-jeu-tables-multi.js (redimensionnement libre,
// barre d'édition avec aide, réduire, plein écran board, fermer).
//
// Les élèves lisent un court texte (4 à 5 lignes) et cliquent sur les mots
// selon leur nature : déterminants, noms, adjectifs, verbes, pronoms,
// mots invariables. Chaque mot trouvé est surligné avec la couleur de sa
// nature et reçoit son symbole (inspiré des symboles grammaticaux Montessori).
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-nature-mots-texte.js"></script>
//
//   2. Ajouter une carte dans le panneau Activités (rubrique français) :
//      <div class="act-card" onclick="createWidget('jeu-nature-mots-texte');toggleActivitiesPanel()">
//          ...
//      </div>
//
// 💾 Restauration après actualisation : save-load.js appelle
//    widget._jnmtGetData() à la sauvegarde et pose
//    window._jnmtNextPendingData avant createWidget() à la restauration.
// =========================================================================

(function () {

    const WIDGET_TYPE = 'jeu-nature-mots-texte';
    const WIDGET_LABEL = '🔎 Chasse aux mots';

    // ── Fonction utilitaire mini-barre collapse (injectée une seule fois, partagée) ──
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w => w !== widget && w.querySelector('.wf-mini-bar'));
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
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
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('pointerup', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // ── CSS boutons fenêtre (injecté une seule fois, partagé) ────────────
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

    // =========================================================================
    // NATURES GRAMMATICALES (couleurs + symboles inspirés de Montessori)
    // =========================================================================
    const NATURES = [
        { k: 'n', label: 'Noms', pen: 'Noms',             plural: 'noms',             one: 'nom',            art: 'un nom',            color: '#1f2937', hl: 'rgba(100,116,139,0.30)', text: '#0f172a' },
        { k: 'd', label: 'Déterminants', pen: 'Déterminants',     plural: 'déterminants',     one: 'déterminant',    art: 'un déterminant',    color: '#0ea5e9', hl: 'rgba(56,189,248,0.38)',  text: '#075985' },
        { k: 'a', label: 'Adjectifs', pen: 'Adjectifs',        plural: 'adjectifs',        one: 'adjectif',       art: 'un adjectif',       color: '#1d4ed8', hl: 'rgba(59,130,246,0.32)',  text: '#1e3a8a' },
        { k: 'v', label: 'Verbes', pen: 'Verbes',           plural: 'verbes',           one: 'verbe',          art: 'un verbe',          color: '#dc2626', hl: 'rgba(248,113,113,0.40)', text: '#991b1b' },
        { k: 'p', label: 'Pronoms', pen: 'Pronoms',          plural: 'pronoms',          one: 'pronom',         art: 'un pronom',         color: '#9333ea', hl: 'rgba(192,132,252,0.40)', text: '#6b21a8' },
        { k: 'i', label: 'Mots invariables', pen: 'Invariables', plural: 'mots invariables', one: 'mot invariable', art: 'un mot invariable', color: '#16a34a', hl: 'rgba(74,222,128,0.42)',  text: '#166534' },
    ];
    const NAT = {};
    NATURES.forEach(n => NAT[n.k] = n);

    // Symboles SVG (grand triangle noir = nom, petit triangle bleu clair =
    // déterminant, triangle bleu foncé = adjectif, rond rouge = verbe,
    // triangle violet élancé = pronom, pont vert = mot invariable)
    function symbolSVG(k, extraClass) {
        const c = NAT[k].color;
        const cls = 'jnmt-svg jnmt-svg-' + k + (extraClass ? ' ' + extraClass : '');
        switch (k) {
            case 'n': return `<svg class="${cls}" viewBox="0 0 20 18" aria-hidden="true"><polygon points="10,1 19,17 1,17" fill="${c}"/></svg>`;
            case 'd': return `<svg class="${cls}" viewBox="0 0 20 18" aria-hidden="true"><polygon points="10,1 19,17 1,17" fill="${c}"/></svg>`;
            case 'a': return `<svg class="${cls}" viewBox="0 0 20 18" aria-hidden="true"><polygon points="10,1 19,17 1,17" fill="${c}"/></svg>`;
            case 'v': return `<svg class="${cls}" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="${c}"/></svg>`;
            case 'p': return `<svg class="${cls}" viewBox="0 0 14 20" aria-hidden="true"><polygon points="7,0 13.5,19 0.5,19" fill="${c}"/></svg>`;
            case 'i': return `<svg class="${cls}" viewBox="0 0 22 14" aria-hidden="true"><path d="M1 13 A10 10 0 0 1 21 13 L16 13 A5 5 0 0 0 6 13 Z" fill="${c}"/></svg>`;
        }
        return '';
    }

    // =========================================================================
    // SONS (synthétisés avec Web Audio : aucun fichier à charger)
    // =========================================================================
    const SFX = (function () {
        let ctx = null;
        function ac() {
            if (!ctx) {
                const C = window.AudioContext || window.webkitAudioContext;
                if (!C) return null;
                try { ctx = new C(); } catch (e) { return null; }
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        }
        // Note simple avec enveloppe (attaque courte, extinction douce)
        function tone(freq, t0, dur, type, vol, slideTo) {
            const c = ac(); if (!c) return;
            const t = c.currentTime + (t0 || 0);
            const o = c.createOscillator(), g = c.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(c.destination);
            o.start(t); o.stop(t + dur + 0.02);
        }
        // Petit souffle (bruit filtré) : trait de feutre, « whoosh »
        function swish(t0, dur, from, to, vol) {
            const c = ac(); if (!c) return;
            const t = c.currentTime + (t0 || 0);
            const len = Math.max(1, Math.floor(c.sampleRate * dur));
            const buf = c.createBuffer(1, len, c.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
            const src = c.createBufferSource(); src.buffer = buf;
            const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
            f.frequency.setValueAtTime(from, t);
            f.frequency.exponentialRampToValueAtTime(to, t + dur);
            const g = c.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol || 0.12, t + dur * 0.3);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(f); f.connect(g); g.connect(c.destination);
            src.start(t); src.stop(t + dur + 0.02);
        }
        const semi = (f, n) => f * Math.pow(2, n / 12);
        return {
            unlock() { ac(); },
            // Bonne réponse : « pling » qui monte avec la série
            correct(streak) {
                const base = semi(660, Math.min(streak || 0, 10));
                swish(0, 0.12, 2500, 5000, 0.05);
                tone(base, 0, 0.12, 'triangle', 0.16);
                tone(semi(base, 7), 0.07, 0.2, 'sine', 0.14);
            },
            wrong() {
                tone(240, 0, 0.22, 'square', 0.05, 150);
                tone(180, 0.09, 0.24, 'triangle', 0.12, 110);
            },
            pen() {
                swish(0, 0.08, 1800, 3500, 0.06);
                tone(1320, 0, 0.06, 'sine', 0.06, 1760);
            },
            combo(streak) {
                const base = semi(784, Math.min(streak, 8));
                [0, 4, 7, 12].forEach((n, i) => tone(semi(base, n), i * 0.05, 0.12, 'square', 0.04));
            },
            natureDone() {
                [0, 4, 7, 12].forEach((n, i) => tone(semi(523, n), i * 0.09, 0.22, 'triangle', 0.16));
                tone(semi(523, 16), 0.36, 0.35, 'sine', 0.12);
            },
            win() {
                const mel = [[0, 0.12], [4, 0.12], [7, 0.12], [12, 0.24], [7, 0.12], [12, 0.45]];
                let t = 0;
                mel.forEach(([n, d]) => { tone(semi(523, n), t, d + 0.08, 'triangle', 0.16); tone(semi(523, n - 12), t, d + 0.08, 'sine', 0.08); t += d; });
                swish(t, 0.5, 3000, 8000, 0.05);
            },
            star(i) { tone(semi(988, i * 4), 0, 0.3, 'sine', 0.14); tone(semi(1976, i * 4), 0.02, 0.2, 'triangle', 0.05); },
            hint() { [0, 7, 12, 19].forEach((n, i) => tone(semi(1318, n), i * 0.06, 0.14, 'sine', 0.07)); },
            start() { swish(0, 0.35, 400, 2400, 0.1); tone(523, 0.1, 0.12, 'triangle', 0.12); tone(784, 0.2, 0.2, 'triangle', 0.12); },
            pause() { tone(660, 0, 0.12, 'sine', 0.1); tone(440, 0.1, 0.18, 'sine', 0.1); },
            reveal() { swish(0, 0.4, 600, 3000, 0.07); tone(392, 0, 0.3, 'sine', 0.08, 784); },
        };
    })();

    // =========================================================================
    // TEXTES (4 à 5 lignes). Syntaxe : mot|nature, ponctuation seule.
    //   d = déterminant, n = nom, a = adjectif, v = verbe,
    //   p = pronom, i = mot invariable (adverbe, préposition, conjonction)
    // Un mot se terminant par une apostrophe (l', j', d', s'…) est collé au
    // mot suivant.
    // =========================================================================
    const TEXTS_SRC = [
        // ── CE1 - CE2 ─────────────────────────────────────────────────────
        { id: 'chat-lea', level: 'facile', title: 'Le chat de Léa', src:
            "Le|d petit|a chat|n de|i Léa|n dort|v sur|i le|d canapé|n bleu|a . " +
            "Soudain|i , il|p entend|v un|d bruit|n étrange|a dans|i la|d cuisine|n . " +
            "Il|p saute|v vite|i et|i court|v vers|i la|d porte|n . " +
            "Une|d souris|n grise|a mange|v un|d morceau|n de|i fromage|n ! " +
            "Le|d chat|n la|p regarde|v , mais|i il|p ne|i bouge|v pas|i ." },
        { id: 'plage', level: 'facile', title: 'À la plage', src:
            "Ce|d matin|n , Tom|n et|i sa|d sœur|n vont|v à|i la|d plage|n . " +
            "Le|d soleil|n brille|v dans|i le|d ciel|n bleu|a . " +
            "Ils|p construisent|v un|d grand|a château|n de|i sable|n . " +
            "Une|d vague|n arrive|v doucement|i et|i elle|p emporte|v la|d tour|n . " +
            "Les|d enfants|n rient|v très|i fort|i !" },
        { id: 'jardin', level: 'facile', title: 'Le jardin de Mamie', src:
            "Mamie|n a|v un|d joli|a jardin|n derrière|i sa|d maison|n . " +
            "Elle|p plante|v des|d tomates|n rouges|a et|i des|d salades|n vertes|a . " +
            "Chaque|d matin|n , nous|p arrosons|v les|d fleurs|n avec|i elle|p . " +
            "Un|d gros|a escargot|n grimpe|v lentement|i sur|i le|d mur|n . " +
            "Nous|p le|p posons|v sous|i les|d feuilles|n ." },
        { id: 'anniversaire', level: 'facile', title: "L'anniversaire", src:
            "Aujourd'hui|i , c'|p est|v l'|d anniversaire|n de|i Hugo|n . " +
            "Ses|d amis|n arrivent|v avec|i des|d cadeaux|n colorés|a . " +
            "Sa|d maman|n apporte|v un|d énorme|a gâteau|n au|d chocolat|n . " +
            "Hugo|n souffle|v les|d huit|d bougies|n d'|i un|d seul|a coup|n ! " +
            "Ensuite|i , les|d enfants|n jouent|v dans|i le|d salon|n ." },
        { id: 'neige', level: 'facile', title: 'La neige', src:
            "Cette|d nuit|n , la|d neige|n est|v tombée|v sur|i le|d village|n . " +
            "Les|d toits|n et|i les|d arbres|n sont|v blancs|a . " +
            "Paul|n met|v son|d bonnet|n et|i ses|d gants|n chauds|a . " +
            "Il|p fabrique|v un|d bonhomme|n avec|i une|d carotte|n orange|a . " +
            "Puis|i , il|p lance|v des|d boules|n à|i son|d chien|n ." },
        { id: 'dragon', level: 'facile', title: 'Le dragon gourmand', src:
            "Un|d dragon|n vert|a vivait|v dans|i une|d grotte|n sombre|a . " +
            "Il|p aimait|v les|d chansons|n et|i les|d gâteaux|n . " +
            "Un|d jour|n , une|d princesse|n courageuse|a entra|v dans|i sa|d grotte|n . " +
            "Le|d dragon|n lui|p offrit|v une|d tarte|n aux|d pommes|n . " +
            "Depuis|i , ils|p partagent|v leurs|d desserts|n ." },

        // ── CM1 - CM2 ─────────────────────────────────────────────────────
        { id: 'tempete', level: 'confirme', title: 'La tempête', src:
            "Le|d vent|n soufflait|v violemment|i sur|i la|d petite|a île|n . " +
            "Les|d pêcheurs|n inquiets|a observaient|v les|d vagues|n immenses|a . " +
            "Soudain|i , un|d éclair|n aveuglant|a déchira|v le|d ciel|n noir|a . " +
            "Les|d enfants|n se|p réfugièrent|v dans|i leur|d vieille|a cabane|n . " +
            "Ils|p attendirent|v calmement|i le|d retour|n du|d soleil|n ." },
        { id: 'musee', level: 'confirme', title: 'La sortie au musée', src:
            "Notre|d classe|n a|v visité|v un|d musée|n étonnant|a . " +
            "Nous|p avons|v admiré|v des|d squelettes|n de|i dinosaures|n gigantesques|a . " +
            "Le|d guide|n nous|p expliquait|v leur|d histoire|n avec|i passion|n . " +
            "Lucas|n posait|v des|d questions|n très|i curieuses|a . " +
            "Nous|p reviendrons|v bientôt|i !" },
        { id: 'marche', level: 'confirme', title: 'Le marché du samedi', src:
            "Chaque|d samedi|n , mon|d grand-père|n m'|p emmène|v au|d marché|n . " +
            "Nous|p achetons|v des|d fruits|n frais|a et|i du|d pain|n croustillant|a . " +
            "Le|d fromager|n nous|p fait|v goûter|v un|d délicieux|a comté|n . " +
            "Ensuite|i , nous|p rentrons|v lentement|i par|i le|d parc|n . " +
            "Ma|d grand-mère|n nous|p attend|v déjà|i pour|i le|d repas|n ." },
        { id: 'astronaute', level: 'confirme', title: "L'astronaute", src:
            "L'|d astronaute|n flottait|v doucement|i dans|i la|d station|n spatiale|a . " +
            "Par|i le|d hublot|n , elle|p voyait|v la|d Terre|n bleue|a . " +
            "Chaque|d jour|n , elle|p réalisait|v des|d expériences|n scientifiques|a . " +
            "Le|d soir|n , elle|p écrivait|v à|i ses|d enfants|n qui|p l'|p attendaient|v . " +
            "Elle|p reviendra|v bientôt|i sur|i notre|d planète|n ." },
        { id: 'renard', level: 'confirme', title: 'Le renard rusé', src:
            "Un|d corbeau|n noir|a tenait|v un|d fromage|n dans|i son|d bec|n . " +
            "Un|d renard|n rusé|a passait|v sous|i l'|d arbre|n . " +
            "Il|p complimenta|v l'|d oiseau|n sur|i son|d magnifique|a plumage|n . " +
            "Le|d corbeau|n ouvrit|v son|d large|a bec|n et|i il|p chanta|v . " +
            "Le|d fromage|n tomba|v , et|i le|d renard|n le|p dévora|v aussitôt|i !" },
        { id: 'automne', level: 'confirme', title: 'La forêt en automne', src:
            "En|i automne|n , la|d forêt|n change|v de|i couleur|n . " +
            "Les|d feuilles|n jaunes|a et|i rouges|a tombent|v sur|i le|d sol|n humide|a . " +
            "Les|d écureuils|n cachent|v des|d noisettes|n sous|i les|d racines|n . " +
            "Nous|p ramassons|v des|d champignons|n , mais|i nous|p ne|i les|p mangeons|v pas|i . " +
            "Le|d soir|n , une|d chouette|n hulule|v tristement|i ." },
    ];

    function parseText(src) {
        return src.trim().split(/\s+/).map(t => {
            const m = t.match(/^(.+)\|([dnavpi])$/);
            return m ? { w: m[1], n: m[2] } : { w: t, n: null };
        });
    }
    const TEXTS = TEXTS_SRC.map(t => ({ id: t.id, level: t.level, title: t.title, tokens: parseText(t.src) }));
    const TEXT_BY_ID = {};
    TEXTS.forEach(t => TEXT_BY_ID[t.id] = t);

    // ── CSS spécifique au widget ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-nature-mots-texte-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-nature-mots-texte-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-nature-mots-texte"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jnmt-container {
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
            width: 900px;
            height: 640px;
            min-width: 420px;
            min-height: 360px;
        }

        /* ── État plein écran ── */
        .jnmt-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }
        .jnmt-container.wf-fullboard.jnmt-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jnmt-header {
            display: flex; align-items: center; gap: 8px;
            cursor: move; user-select: none; flex-shrink: 0;
        }
        .jnmt-title {
            font-size: 13px; font-weight: 800; color: #374151;
            letter-spacing: 0.3px; pointer-events: none; white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jnmt-params-btn, .jnmt-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .jnmt-params-btn:hover, .jnmt-help-btn:hover, .jnmt-sound-btn:hover { background: #e0e0e0; color: #333; }
        .jnmt-sound-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            font-size: 11px; cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0; padding: 0; transition: background .15s;
        }
        .jnmt-sound-btn.off { opacity: 0.55; }
        .jnmt-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .jnmt-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; max-height: calc(100% - 60px); overflow-y: auto;
            font-size: 11px; color: #444; z-index: 30; line-height: 1.6;
            user-select: text;
        }
        .jnmt-help-popup.show { display: block; }
        .jnmt-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .jnmt-help-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 10px; margin: 4px 0 10px; }
        .jnmt-help-legend span { display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .jnmt-help-legend svg { width: 14px; height: 14px; flex-shrink: 0; }

        /* ── Panneau paramètres ── */
        .jnmt-params-panel {
            background: #f8f9fa; border: 1px solid #e5e7eb;
            border-radius: 10px; padding: 10px 14px;
            display: none; flex-direction: column; gap: 8px; flex-shrink: 0;
        }
        .jnmt-params-panel.show { display: flex; }
        .jnmt-params-title { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px; }
        .jnmt-params-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .jnmt-nat-check {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 10px 4px 8px; border-radius: 20px;
            border: 1.5px solid var(--nc, #999); background: white;
            color: var(--nc, #333); cursor: pointer;
            font-size: 11px; font-weight: 700;
            transition: opacity .15s, background .15s; user-select: none;
        }
        .jnmt-nat-check svg { width: 12px; height: 12px; }
        .jnmt-nat-check:not(.checked) { opacity: 0.35; border-style: dashed; }
        .jnmt-nat-check:hover { opacity: 1; }
        .jnmt-params-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .jnmt-params-row label { font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap; }
        .jnmt-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white;
        }
        .jnmt-select:focus { border-color: #4a90e2; }
        .jnmt-inline-check { display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .jnmt-inline-check input { cursor: pointer; margin: 0; }

        /* ── HUD ── */
        .jnmt-hud {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            font-size: 14px; font-weight: 800; color: #374151;
            flex-shrink: 0; padding: 0 2px;
        }
        .jnmt-score { color: #2e7d32; white-space: nowrap; }
        .jnmt-score { display: inline-block; }
        .jnmt-score.bump { animation: jnmt-bump .35s cubic-bezier(.3,1.8,.5,1); }
        .jnmt-combo {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 2px 12px; border-radius: 14px;
            background: #f3f4f6; color: #9ca3af; font-size: 13px;
            transition: background .2s, color .2s; white-space: nowrap;
        }
        .jnmt-combo.hot { background: linear-gradient(90deg, #fb923c, #f43f5e); color: #fff; box-shadow: 0 2px 8px rgba(244,63,94,0.35); }
        .jnmt-combo.bump { animation: jnmt-bump .4s cubic-bezier(.3,1.8,.5,1); }
        .jnmt-hud-right { display: flex; gap: 14px; white-space: nowrap; }
        .jnmt-timer { font-variant-numeric: tabular-nums; }
        .jnmt-errors { color: #b91c1c; font-variant-numeric: tabular-nums; }

        /* ── Trousse de surligneurs ── */
        .jnmt-pens {
            display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0;
            padding: 8px 8px 6px;
            background: repeating-linear-gradient(135deg, #f3ecdf 0 10px, #efe6d6 10px 20px);
            border: 1.5px solid #e2d5bd; border-radius: 12px;
        }
        .jnmt-pens.nudge { animation: jnmt-nudge .45s ease; }
        .jnmt-pen-wrap {
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.22));
            transition: transform .15s ease, filter .15s ease, opacity .2s;
        }
        .jnmt-pen-wrap.sel {
            transform: translateY(-4px) scale(1.06);
            filter: drop-shadow(0 5px 6px rgba(0,0,0,0.30));
        }
        .jnmt-pen-wrap.locked { opacity: 0.35; }
        .jnmt-pen-wrap.done { opacity: 0.55; }
        .jnmt-pen {
            --pc: #333;
            position: relative;
            display: flex; align-items: center; gap: 5px;
            height: var(--jnmt-pen-h, 34px);
            padding: 0 19px 0 10px;
            border: none; border-radius: 9px 0 0 9px;
            background: var(--pc); color: #fff;
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-weight: 800; font-size: var(--jnmt-pen-fs, 12px);
            cursor: pointer;
            clip-path: polygon(0 0, calc(100% - 14px) 0, calc(100% - 14px) 18%, 100% 42%, 100% 58%, calc(100% - 14px) 82%, calc(100% - 14px) 100%, 0 100%);
            touch-action: manipulation;
        }
        /* capuchon */
        .jnmt-pen::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 7px;
            background: rgba(0,0,0,0.22);
        }
        /* reflet du corps du feutre */
        .jnmt-pen::after {
            content: ''; position: absolute; left: 9px; right: 18px; top: 4px; height: 3px;
            border-radius: 3px; background: rgba(255,255,255,0.28);
        }
        .jnmt-pen:disabled { cursor: default; }
        .jnmt-pen-sym {
            width: 18px; height: 18px; border-radius: 50%;
            background: #fff; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .jnmt-pen-sym svg { width: 12px; height: 12px; }
        .jnmt-pen-count {
            opacity: 0.85; font-size: 0.9em; font-variant-numeric: tabular-nums;
            margin-left: 1px;
        }

        /* ── Bandeau mission ── */
        .jnmt-mission {
            display: flex; align-items: center; gap: 12px; flex-shrink: 0;
            font-size: var(--jnmt-mission-fs, 15px); font-weight: 800; color: #374151;
            min-height: 26px;
        }
        .jnmt-mission-text { display: flex; align-items: center; gap: 8px; flex: 0 1 auto; min-width: 0; }
        .jnmt-mission-text > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .jnmt-mission-text svg { width: 1.05em; height: 1.05em; flex-shrink: 0; display: block; }
        .jnmt-mission-text b { color: var(--mc, #374151); }
        .jnmt-mission.flash .jnmt-mission-text { transform-origin: left center; animation: jnmt-mission-in .45s ease; }
        .jnmt-progress {
            flex: 1; height: 12px; min-width: 60px; border-radius: 8px;
            background: #eef0f3; overflow: hidden; border: 1px solid #e2e5ea;
        }
        .jnmt-progress-fill {
            height: 100%; width: 0%; background-color: var(--mc, #4a90e2);
            background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 7px, transparent 7px 14px);
            background-size: 20px 20px;
            border-radius: 8px; transition: width .35s cubic-bezier(.3,1.4,.5,1);
            animation: jnmt-stripes .8s linear infinite;
        }
        .jnmt-progress-label { font-variant-numeric: tabular-nums; white-space: nowrap; color: #6b7280; font-size: 0.9em; }

        /* ── Page de cahier ── */
        .jnmt-paper {
            flex: 1; min-height: 140px; position: relative;
            border-radius: 12px; background: #fffdf8;
            border: 1.5px solid #e7dcc3;
            box-shadow: 0 2px 0 #eadfc6;
            overflow: hidden;
        }
        .jnmt-paper::before {
            content: ''; position: absolute; top: 0; bottom: 0; left: 40px; width: 2px;
            background: #f3a6a6; z-index: 1; pointer-events: none;
        }
        /* Morceaux de ruban adhésif décoratifs */
        .jnmt-tape {
            position: absolute; top: 6px; width: 78px; height: 20px; z-index: 2; pointer-events: none;
            background: repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 6px, transparent 6px 12px), var(--tp, #fcd34d);
            opacity: 0.75; box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        .jnmt-tape-l { left: -18px; transform: rotate(-35deg); --tp: #f9a8d4; }
        .jnmt-tape-r { right: -18px; transform: rotate(35deg); --tp: #86efac; }
        .jnmt-paper-title {
            font-family: 'Andika', 'Lexend', 'Century Gothic', 'Segoe UI', system-ui, sans-serif;
            font-size: calc(var(--jnmt-fs, 24px) * 0.78); font-weight: 800;
            color: #c2410c; padding-top: 0.55em;
            text-decoration: underline wavy #fdba74; text-decoration-thickness: 2px; text-underline-offset: 0.3em;
        }
        .jnmt-paper-title.pop { animation: jnmt-title-in .5s cubic-bezier(.3,1.5,.5,1); }
        .jnmt-scroll {
            position: absolute; inset: 0; overflow: auto;
            padding: 0 22px 18px 58px; box-sizing: border-box; scrollbar-width: thin;
        }
        .jnmt-text {
            font-family: 'Andika', 'Lexend', 'Century Gothic', 'Segoe UI', system-ui, sans-serif;
            font-size: var(--jnmt-fs, 24px);
            line-height: 2.4;
            color: #1f2937;
            background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(2.4em - 1px), #cfdcf2 calc(2.4em - 1px), #cfdcf2 2.4em);
            background-origin: content-box;
            background-position: 0 -0.74em;
            padding-top: 0.35em;
            padding-right: 70px;
            box-sizing: border-box;
            min-height: 100%;
        }
        .jnmt-grp { white-space: nowrap; }
        .jnmt-w {
            position: relative; display: inline-block;
            line-height: 1.3; padding: 0 0.07em; border-radius: 5px;
            cursor: pointer; transition: background-color .15s, transform .12s;
        }
        .jnmt-text.playing .jnmt-w:not(.found) { cursor: var(--jnmt-cursor, pointer); }
        .jnmt-text.playing .jnmt-w:not(.found):hover { background-color: var(--jnmt-hover, rgba(250,204,21,0.30)); transform: translateY(-2px); }
        .jnmt-text:not(.playing) .jnmt-w { cursor: default; }
        .jnmt-w.found {
            cursor: default;
            color: var(--wt);
            background-image: linear-gradient(100deg, transparent 0, var(--whl) 4%, var(--whl) 96%, transparent 100%);
            background-size: 100% 62%;
            background-position: 0 85%;
            background-repeat: no-repeat;
        }
        .jnmt-w.found.revealed {
            background-image: none;
            text-decoration: underline dashed var(--wc);
            text-decoration-thickness: 2px;
            text-underline-offset: 0.18em;
        }
        .jnmt-w.just-found { animation: jnmt-pop .42s cubic-bezier(.3,1.6,.5,1), jnmt-draw .38s ease-out; }
        .jnmt-sym {
            position: absolute; left: 50%; top: -0.62em;
            transform: translateX(-50%);
            line-height: 0; pointer-events: none;
        }
        .jnmt-sym svg { display: block; }
        .jnmt-sym .jnmt-svg-n { width: 0.62em; height: 0.56em; }
        .jnmt-sym .jnmt-svg-d { width: 0.36em; height: 0.32em; }
        .jnmt-sym .jnmt-svg-a { width: 0.48em; height: 0.43em; }
        .jnmt-sym .jnmt-svg-v { width: 0.46em; height: 0.46em; }
        .jnmt-sym .jnmt-svg-p { width: 0.34em; height: 0.48em; }
        .jnmt-sym .jnmt-svg-i { width: 0.56em; height: 0.36em; }
        .jnmt-w.just-found .jnmt-sym { animation: jnmt-sym-drop .45s cubic-bezier(.3,1.6,.5,1); }
        .jnmt-w.wrong { animation: jnmt-shake .38s ease; background-color: rgba(239,68,68,0.18); }
        .jnmt-w.hint { animation: jnmt-hint 1s ease-in-out 3; }

        /* Bulle « C'est un … » après une erreur */
        .jnmt-bubble {
            position: absolute; left: 50%; bottom: calc(100% + 0.5em);
            transform: translateX(-50%);
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: max(11px, 0.46em); font-weight: 800; line-height: 1.2;
            color: #fff; background: var(--bc, #374151);
            padding: 4px 9px; border-radius: 10px; white-space: nowrap;
            pointer-events: none; z-index: 5;
            animation: jnmt-bubble 1.8s ease forwards;
        }
        .jnmt-bubble::after {
            content: ''; position: absolute; left: 50%; top: 100%;
            transform: translateX(-50%);
            border: 5px solid transparent; border-top-color: var(--bc, #374151);
        }

        /* Points qui s'envolent depuis le mot */
        .jnmt-float {
            position: absolute; z-index: 6; pointer-events: none;
            font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 900;
            font-size: max(14px, calc(var(--jnmt-fs, 24px) * 0.6));
            color: var(--fc, #16a34a);
            text-shadow: 0 2px 0 #fff, 0 0 6px #fff;
            transform: translate(-50%, -50%);
            animation: jnmt-float 1s ease-out forwards; white-space: nowrap;
        }
        /* Étincelles (bonne réponse) */
        .jnmt-spark {
            position: absolute; pointer-events: none; z-index: 4;
            font-size: var(--sz, 14px); line-height: 1; color: var(--sc, #f59e0b);
            transform: translate(-50%, -50%);
            animation: jnmt-spark .6s ease-out forwards;
        }
        /* Confettis (texte terminé) */
        .jnmt-confetti {
            position: absolute; top: -14px; width: 9px; height: 14px;
            border-radius: 2px; pointer-events: none; z-index: 8;
            animation: jnmt-fall var(--dur, 1.8s) cubic-bezier(.25,.6,.45,1) forwards;
        }
        /* Toast (nature terminée) */
        .jnmt-toast {
            position: absolute; left: 50%; top: 12px; transform: translateX(-50%);
            background: var(--tc, #16a34a); color: #fff;
            font-weight: 800; font-size: 14px;
            padding: 7px 16px; border-radius: 20px; white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9; pointer-events: none;
            animation: jnmt-toast 1.9s ease forwards;
        }

        /* ── Mascotte « Loupio » ── */
        .jnmt-mascot {
            position: absolute; right: 10px; bottom: 8px; width: 74px; height: 82px;
            z-index: 11; pointer-events: none;
        }
        .jnmt-mascot svg { width: 100%; height: 100%; overflow: visible; }
        .jnmt-mascot .m-body { transform-origin: 50% 90%; transform-box: fill-box; animation: jnmt-idle 2.8s ease-in-out infinite; }
        .jnmt-mascot .m-eyes, .jnmt-mascot .m-mouth, .jnmt-mascot .m-zzz { display: none; }
        .jnmt-mascot.mood-idle  .m-eyes-open,  .jnmt-mascot.mood-idle  .m-mouth-smile { display: inline; }
        .jnmt-mascot.mood-happy .m-eyes-happy, .jnmt-mascot.mood-happy .m-mouth-big   { display: inline; }
        .jnmt-mascot.mood-cheer .m-eyes-happy, .jnmt-mascot.mood-cheer .m-mouth-big   { display: inline; }
        .jnmt-mascot.mood-sad   .m-eyes-open,  .jnmt-mascot.mood-sad   .m-mouth-o     { display: inline; }
        .jnmt-mascot.mood-think .m-eyes-open,  .jnmt-mascot.mood-think .m-mouth-flat  { display: inline; }
        .jnmt-mascot.mood-sleep .m-eyes-closed, .jnmt-mascot.mood-sleep .m-mouth-smile, .jnmt-mascot.mood-sleep .m-zzz { display: inline; }
        .jnmt-mascot.mood-idle .m-eyes-open { transform-box: fill-box; transform-origin: center; animation: jnmt-blink 4s infinite; }
        .jnmt-mascot.mood-happy .m-body { animation: jnmt-hop .45s ease; }
        .jnmt-mascot.mood-cheer .m-body { animation: jnmt-cheer .6s ease-in-out infinite; }
        .jnmt-mascot.mood-sad .m-body   { animation: jnmt-wobble .5s ease; }
        .jnmt-mascot.mood-think .m-body { animation: jnmt-tilt 1.2s ease-in-out infinite; }
        .jnmt-mascot.mood-sleep .m-body { animation: jnmt-breathe 3s ease-in-out infinite; }
        .jnmt-mascot .m-zzz text { animation: jnmt-zzz 2.4s ease-in-out infinite; }
        .jnmt-masc-bubble {
            position: absolute; right: 64px; bottom: 60px;
            background: #fff; color: #374151; border: 2px solid var(--mbc, #f59e0b);
            font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 800; font-size: 13px;
            padding: 5px 11px; border-radius: 14px 14px 4px 14px; white-space: nowrap;
            box-shadow: 0 3px 8px rgba(0,0,0,0.12);
            opacity: 0; transform: translateY(6px) scale(0.85); transform-origin: right bottom;
            transition: opacity .2s, transform .25s cubic-bezier(.3,1.6,.5,1);
        }
        .jnmt-masc-bubble.show { opacity: 1; transform: translateY(0) scale(1); }

        /* ── Overlay démarrage / pause / fin ── */
        .jnmt-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px; background: rgba(255,253,248,0.9);
            backdrop-filter: blur(2px); z-index: 10;
            text-align: center; padding: 10px;
        }
        .jnmt-overlay.hidden { display: none; }
        .jnmt-overlay-card {
            display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        /* Fin de texte : carte compacte en bas, le texte colorié reste visible */
        .jnmt-overlay.end {
            background: transparent; backdrop-filter: none;
            justify-content: flex-end; padding-bottom: 14px; pointer-events: none;
        }
        .jnmt-overlay.end .jnmt-overlay-card {
            pointer-events: auto; background: #fff; border-radius: 14px;
            padding: 12px 20px 14px; border: 1.5px solid #e7dcc3;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            animation: jnmt-card-up .4s cubic-bezier(.3,1.4,.5,1);
        }
        .jnmt-overlay.end .jnmt-stars { font-size: 34px; }
        .jnmt-paper.ended .jnmt-scroll { padding-bottom: 190px; }
        .jnmt-overlay.end .jnmt-overlay-title { font-size: 17px; }
        .jnmt-overlay-title { font-size: 20px; font-weight: 800; color: #374151; }
        .jnmt-overlay-sub { font-size: 13px; color: #6b7280; max-width: 480px; line-height: 1.5; }
        .jnmt-overlay-natures { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
        .jnmt-overlay-natures span {
            display: flex; align-items: center; gap: 5px;
            padding: 3px 9px; border-radius: 14px; background: white;
            border: 1.5px solid var(--nc); color: var(--nc);
            font-size: 11px; font-weight: 800;
        }
        .jnmt-overlay-natures svg { width: 11px; height: 11px; }
        .jnmt-stars { display: none; gap: 8px; font-size: 42px; line-height: 1; }
        .jnmt-stars.show { display: flex; }
        .jnmt-star { color: #e5e7eb; transform: scale(0.4); opacity: 0; animation: jnmt-star-in .45s cubic-bezier(.3,1.7,.5,1) forwards; }
        .jnmt-star.on { color: #fbbf24; text-shadow: 0 2px 0 #d97706; }
        .jnmt-overlay-btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .jnmt-start-btn, .jnmt-second-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            font-size: 14px; font-weight: 800; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jnmt-start-btn { background: #4a90e2; color: white; }
        .jnmt-start-btn:hover { background: #357abd; }
        .jnmt-second-btn { background: #e5e7eb; color: #374151; }
        .jnmt-second-btn:hover { background: #d1d5db; }
        .jnmt-second-btn.hidden { display: none; }
        .jnmt-start-btn:active, .jnmt-second-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jnmt-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0; }
        .jnmt-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s; color: white;
        }
        .jnmt-btn:active { transform: scale(0.96); }
        .jnmt-btn:disabled { opacity: 0.45; cursor: default; }
        .jnmt-btn-reset { background: #6b7280; } .jnmt-btn-reset:hover { background: #4b5563; }
        .jnmt-btn-pause { background: #4a90e2; } .jnmt-btn-pause:hover { background: #357abd; }
        .jnmt-btn-next  { background: #0d9488; } .jnmt-btn-next:hover  { background: #0f766e; }
        .jnmt-btn-hint  { background: #f59e0b; } .jnmt-btn-hint:hover  { background: #d97706; }
        .jnmt-btn-sol   { background: #a855f7; } .jnmt-btn-sol:hover   { background: #9333ea; }
        .jnmt-controls-spacer { flex: 1; }

        /* ── Poignée resize ── */
        .jnmt-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 12;
        }
        .jnmt-container:hover .jnmt-resize-handle { opacity: 1; }
        .jnmt-container.wf-fullboard .jnmt-resize-handle { display: none; }

        /* ── Animations ── */
        @keyframes jnmt-pop {
            0% { transform: scale(1); } 45% { transform: scale(1.22); } 100% { transform: scale(1); }
        }
        @keyframes jnmt-mission-in {
            0% { transform: translateX(-10px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes jnmt-bump { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        @keyframes jnmt-stripes { from { background-position: 0 0; } to { background-position: 20px 0; } }
        @keyframes jnmt-draw { from { background-size: 0% 62%; } to { background-size: 100% 62%; } }
        @keyframes jnmt-title-in { 0% { transform: translateY(-10px) rotate(-3deg); opacity: 0; } 100% { transform: none; opacity: 1; } }
        @keyframes jnmt-float {
            0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
            20% { transform: translate(-50%, -90%) scale(1.15); opacity: 1; }
            100% { transform: translate(-50%, -260%) scale(1); opacity: 0; }
        }
        @keyframes jnmt-idle { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-4px) rotate(2deg); } }
        @keyframes jnmt-hop { 0%,100% { transform: translateY(0) scale(1); } 40% { transform: translateY(-14px) scale(1.06, 0.96); } }
        @keyframes jnmt-cheer { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-12px) rotate(8deg); } }
        @keyframes jnmt-wobble { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes jnmt-tilt { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
        @keyframes jnmt-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04, 0.97); } }
        @keyframes jnmt-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes jnmt-zzz { 0% { opacity: 0; transform: translate(0, 4px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(8px, -14px); } }
        @keyframes jnmt-card-up {
            0% { transform: translateY(30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes jnmt-sym-drop {
            0% { transform: translate(-50%, -0.9em) scale(0.2); opacity: 0; }
            100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes jnmt-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        @keyframes jnmt-nudge {
            0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); }
        }
        @keyframes jnmt-hint {
            0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); background-color: transparent; }
            50% { box-shadow: 0 0 0 4px rgba(245,158,11,0.55); background-color: rgba(253,230,138,0.7); }
        }
        @keyframes jnmt-bubble {
            0% { opacity: 0; transform: translate(-50%, 6px) scale(0.8); }
            12% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -4px); }
        }
        @keyframes jnmt-spark {
            0% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes jnmt-fall {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translate(var(--dx), var(--fall, 420px)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes jnmt-toast {
            0% { opacity: 0; transform: translate(-50%, -10px) scale(0.9); }
            12% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -6px); }
        }
        @keyframes jnmt-star-in {
            0% { transform: scale(0.3) rotate(-30deg); opacity: 0; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
            .jnmt-w.just-found, .jnmt-w.just-found .jnmt-sym, .jnmt-w.wrong, .jnmt-w.hint,
            .jnmt-spark, .jnmt-confetti, .jnmt-star, .jnmt-pens.nudge, .jnmt-float, .jnmt-mascot .m-body, .jnmt-progress-fill, .jnmt-mission.flash .jnmt-mission-text {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-nature-mots-texte';
    if (!document.getElementById(TEMPLATE_ID)) {
        const legend = NATURES.map(n => `<span style="color:${n.color}">${symbolSVG(n.k)} ${n.label}</span>`).join('');
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jnmt-container">

  <!-- En-tête -->
  <div class="jnmt-header">
    <span class="jnmt-title">${WIDGET_LABEL}</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jnmt-sound-btn"  title="Couper / remettre le son">🔊</button>
      <button class="jnmt-params-btn" title="Paramètres">⚙</button>
      <button class="jnmt-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jnmt-params-panel">
    <div class="jnmt-params-title">Natures à chercher :</div>
    <div class="jnmt-params-grid"></div>
    <div class="jnmt-params-row">
      <label>Mode de jeu :</label>
      <select class="jnmt-select jnmt-mode-select">
        <option value="mission" selected>🎯 Missions (une nature après l'autre)</option>
        <option value="libre">🖍️ Surligneurs (toutes les natures en même temps)</option>
      </select>
    </div>
    <div class="jnmt-params-row">
      <label>Textes :</label>
      <select class="jnmt-select jnmt-level-select">
        <option value="tous" selected>📚 Tous les textes</option>
        <option value="facile">🌱 CE1 - CE2</option>
        <option value="confirme">🌳 CM1 - CM2</option>
      </select>
      <label class="jnmt-inline-check" style="margin-left:8px">
        <input type="checkbox" class="jnmt-shownat-check" checked>
        Montrer la nature du mot en cas d'erreur
      </label>
    </div>
  </div>

  <!-- HUD -->
  <div class="jnmt-hud">
    <span class="jnmt-score">⭐ Score : 0</span>
    <span class="jnmt-combo" title="Bonnes réponses d'affilée">🔥 Série : 0</span>
    <span class="jnmt-hud-right">
      <span class="jnmt-errors">❌ 0</span>
      <span class="jnmt-timer">⏱️ 00:00</span>
    </span>
  </div>

  <!-- Trousse de surligneurs -->
  <div class="jnmt-pens"></div>

  <!-- Bandeau mission -->
  <div class="jnmt-mission">
    <span class="jnmt-mission-text"></span>
    <div class="jnmt-progress"><div class="jnmt-progress-fill"></div></div>
    <span class="jnmt-progress-label"></span>
  </div>

  <!-- Page de cahier -->
  <div class="jnmt-paper">
    <span class="jnmt-tape jnmt-tape-l"></span><span class="jnmt-tape jnmt-tape-r"></span>
    <div class="jnmt-scroll"><div class="jnmt-paper-title"></div><div class="jnmt-text"></div></div>
    <div class="jnmt-mascot mood-idle">
      <div class="jnmt-masc-bubble"></div>
      <svg viewBox="0 0 100 110" aria-hidden="true"><g class="m-body">
        <rect x="63" y="70" width="14" height="38" rx="7" transform="rotate(-40 70 89)" fill="#a16207"/>
        <rect x="63" y="70" width="14" height="10" rx="4" transform="rotate(-40 70 89)" fill="#78350f"/>
        <circle cx="44" cy="44" r="37" fill="#e0f2fe" stroke="#f59e0b" stroke-width="8"/>
        <ellipse cx="27" cy="25" rx="10" ry="5" fill="#fff" opacity="0.85" transform="rotate(-35 27 25)"/>
        <circle cx="24" cy="55" r="5.5" fill="#fda4af" opacity="0.75"/>
        <circle cx="64" cy="55" r="5.5" fill="#fda4af" opacity="0.75"/>
        <g class="m-eyes m-eyes-open"><circle cx="33" cy="43" r="5.5" fill="#1f2937"/><circle cx="55" cy="43" r="5.5" fill="#1f2937"/><circle cx="35" cy="41" r="1.8" fill="#fff"/><circle cx="57" cy="41" r="1.8" fill="#fff"/></g>
        <g class="m-eyes m-eyes-happy" fill="none" stroke="#1f2937" stroke-width="3.5" stroke-linecap="round"><path d="M27 45 Q33 36 39 45"/><path d="M49 45 Q55 36 61 45"/></g>
        <g class="m-eyes m-eyes-closed" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"><path d="M28 43 Q33 47 38 43"/><path d="M50 43 Q55 47 60 43"/></g>
        <path class="m-mouth m-mouth-smile" d="M37 56 Q44 63 51 56" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
        <path class="m-mouth m-mouth-big" d="M35 54 Q44 71 53 54 Z" fill="#b91c1c" stroke="#1f2937" stroke-width="2.5" stroke-linejoin="round"/>
        <ellipse class="m-mouth m-mouth-o" cx="44" cy="60" rx="4.5" ry="5.5" fill="#7f1d1d"/>
        <path class="m-mouth m-mouth-flat" d="M38 59 L50 58" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
        <g class="m-zzz" fill="#6366f1" font-family="Segoe UI, sans-serif" font-weight="900"><text x="72" y="16" font-size="14">z</text><text x="82" y="6" font-size="10" style="animation-delay:.8s">z</text></g>
      </g></svg>
    </div>
    <div class="jnmt-overlay"><div class="jnmt-overlay-card">
      <div class="jnmt-overlay-title">${WIDGET_LABEL}</div>
      <div class="jnmt-stars"></div>
      <div class="jnmt-overlay-sub">Clique sur les mots du texte selon leur nature !</div>
      <div class="jnmt-overlay-natures"></div>
      <div class="jnmt-overlay-btns">
        <button class="jnmt-start-btn">▶ Commencer</button>
        <button class="jnmt-second-btn hidden">🔁 Refaire ce texte</button>
      </div>
    </div></div>
  </div>

  <!-- Contrôles -->
  <div class="jnmt-controls">
    <button class="jnmt-btn jnmt-btn-reset">🔄 Réinitialiser</button>
    <button class="jnmt-btn jnmt-btn-pause">⏸ Pause</button>
    <button class="jnmt-btn jnmt-btn-next">⏭ Autre texte</button>
    <span class="jnmt-controls-spacer"></span>
    <button class="jnmt-btn jnmt-btn-hint">💡 Indice</button>
    <button class="jnmt-btn jnmt-btn-sol">👁 Solution</button>
  </div>

  <!-- Popup aide -->
  <div class="jnmt-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Un court texte s'affiche sur une page de cahier. Clique sur les mots qui correspondent à la nature demandée. Chaque mot trouvé est surligné avec la couleur de sa nature et reçoit son symbole au-dessus.</p>
    <div class="jnmt-help-legend">${legend}</div>
    <p style="margin:0 0 6px"><b>🎯 Missions</b> — Les natures sont proposées l'une après l'autre (d'abord les noms, puis les déterminants…).</p>
    <p style="margin:0 0 10px"><b>🖍️ Surligneurs</b> — Toutes les natures sont cherchées en même temps : choisis d'abord un surligneur dans la trousse, puis clique sur les mots.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⭐ Les points</p>
    <p style="margin:0 0 10px">Un bon mot rapporte 10 points. 🔥 À partir de 3 bonnes réponses d'affilée, chaque mot rapporte 5 points de plus ! Une erreur coûte 2 points et remet la série à zéro, un indice coûte 5 points. Un texte réussi sans erreur rapporte 20 points de bonus. À la fin du texte, tu gagnes de 1 à 3 étoiles selon tes erreurs. Loupio 🔎, la loupe, t'encourage pendant la partie.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Natures à chercher</b> — Coche ou décoche les natures travaillées.</p>
    <p style="margin:0 0 6px"><b>Textes</b> — Choisis des textes pour le CE1-CE2, le CM1-CM2, ou tous.</p>
    <p style="margin:0 0 10px"><b>Montrer la nature</b> — Après une erreur, une bulle indique la vraie nature du mot cliqué.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">💡 Indice fait clignoter un mot à trouver. 👁 Solution révèle les mots restants (en pointillés, sans points). ⏭ Autre texte change de texte. 🔄 Réinitialiser remet le score à zéro. 🔊 coupe ou remet le son.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jnmt-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuNatureMotsTexteWidget = function (widget) {

        // Données en attente de restauration (posées par save-load.js)
        const pending = window._jnmtNextPendingData || null;
        window._jnmtNextPendingData = null;

        const container    = widget.querySelector('.jnmt-container');
        const paramsBtn    = widget.querySelector('.jnmt-params-btn');
        const paramsPanel  = widget.querySelector('.jnmt-params-panel');
        const paramsGrid   = widget.querySelector('.jnmt-params-grid');
        const modeSelect   = widget.querySelector('.jnmt-mode-select');
        const levelSelect  = widget.querySelector('.jnmt-level-select');
        const showNatCheck = widget.querySelector('.jnmt-shownat-check');
        const helpBtn      = widget.querySelector('.jnmt-help-btn');
        const helpPopup    = widget.querySelector('.jnmt-help-popup');
        const resizeHandle = widget.querySelector('.jnmt-resize-handle');
        const scoreEl      = widget.querySelector('.jnmt-score');
        const textNameEl   = widget.querySelector('.jnmt-paper-title');
        const comboEl      = widget.querySelector('.jnmt-combo');
        const soundBtn     = widget.querySelector('.jnmt-sound-btn');
        const mascotEl     = widget.querySelector('.jnmt-mascot');
        const mascBubble   = widget.querySelector('.jnmt-masc-bubble');
        const errorsEl     = widget.querySelector('.jnmt-errors');
        const timerEl      = widget.querySelector('.jnmt-timer');
        const pensEl       = widget.querySelector('.jnmt-pens');
        const missionEl    = widget.querySelector('.jnmt-mission');
        const missionText  = widget.querySelector('.jnmt-mission-text');
        const progressFill = widget.querySelector('.jnmt-progress-fill');
        const progressLbl  = widget.querySelector('.jnmt-progress-label');
        const paper        = widget.querySelector('.jnmt-paper');
        const scrollEl     = widget.querySelector('.jnmt-scroll');
        const textEl       = widget.querySelector('.jnmt-text');
        const overlay      = widget.querySelector('.jnmt-overlay');
        const overlayTitle = widget.querySelector('.jnmt-overlay-title');
        const overlaySub   = widget.querySelector('.jnmt-overlay-sub');
        const overlayNats  = widget.querySelector('.jnmt-overlay-natures');
        const starsEl      = widget.querySelector('.jnmt-stars');
        const startBtn     = widget.querySelector('.jnmt-start-btn');
        const secondBtn    = widget.querySelector('.jnmt-second-btn');
        const resetBtn     = widget.querySelector('.jnmt-btn-reset');
        const pauseBtn     = widget.querySelector('.jnmt-btn-pause');
        const nextBtn      = widget.querySelector('.jnmt-btn-next');
        const hintBtn      = widget.querySelector('.jnmt-btn-hint');
        const solBtn       = widget.querySelector('.jnmt-btn-sol');

        // ── Réglages ─────────────────────────────────────────────────────
        const settings = {
            natures: NATURES.map(n => n.k),
            mode: 'mission',
            level: 'tous',
            showNature: true,
            sound: true,
        };

        // ── État du jeu ──────────────────────────────────────────────────
        let text        = null;       // texte courant { id, title, tokens }
        let found       = new Map();  // index du token → 'ok' | 'rev'
        let errors      = 0;
        let hints       = 0;
        let score       = 0;
        let textPoints  = 0;          // points gagnés sur le texte courant
        let elapsedMs   = 0;
        let missionIdx  = 0;
        let selectedPen = null;       // mode libre
        let running     = false;
        let paused      = true;
        let done        = false;
        let played      = [];         // ids déjà joués (pour ne pas répéter)
        let destroyed   = false;
        let overlayAction = 'start';  // 'start' | 'resume' | 'next'
        let streak      = 0;          // bonnes réponses d'affilée
        let bestStreak  = 0;          // meilleure série sur le texte courant

        // ── Helper tap stylet (pointer-safe) ────────────────────────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (Math.sqrt(dx*dx + dy*dy) < 12 && eu.type === 'pointerup') {
                        eu.stopPropagation();
                        handler(eu);
                    }
                }
                el.addEventListener('pointerup',     onUp);
                el.addEventListener('pointercancel', onUp);
            });
        }

        // ── Sauvegarde différée (évite de saturer l'historique) ──────────
        let _persistTimer = null;
        function persist() {
            clearTimeout(_persistTimer);
            _persistTimer = setTimeout(() => {
                if (!destroyed && document.body.contains(widget) && typeof saveBoard === 'function') saveBoard();
            }, 700);
        }

        function vH(w) { return typeof virtualH === 'function' ? virtualH(w) : window.innerHeight; }

        // ── Son ──────────────────────────────────────────────────────────
        function play(name, arg) {
            if (!settings.sound || destroyed) return;
            try { SFX[name](arg); } catch (e) { /* audio indisponible */ }
        }
        function syncSoundBtn() {
            soundBtn.textContent = settings.sound ? '🔊' : '🔇';
            soundBtn.classList.toggle('off', !settings.sound);
        }
        makeTap(soundBtn, () => {
            settings.sound = !settings.sound;
            syncSoundBtn();
            if (settings.sound) { SFX.unlock(); play('pen'); }
            persist();
        });

        // ── Mascotte « Loupio » ──────────────────────────────────────────
        let _moodTimer = null, _bubbleTimer = null;
        const PRAISES = ['Bravo !', 'Bien vu !', 'Super !', 'Exact !', 'Génial !', 'Oui !', 'Top !', 'Excellent !'];
        const OOPS    = ['Oups…', 'Presque !', 'Regarde bien…', 'Réfléchis…', 'Pas celui-là !'];
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function baseMood() {
            if (done) return 'cheer';
            if (running && paused) return 'sleep';
            return 'idle';
        }
        function setMood(mood, msg, color, ms) {
            clearTimeout(_moodTimer);
            mascotEl.className = 'jnmt-mascot mood-' + mood;
            if (msg) say(msg, color, ms);
            if (ms) _moodTimer = setTimeout(() => { if (!destroyed) mascotEl.className = 'jnmt-mascot mood-' + baseMood(); }, ms);
        }
        function say(msg, color, ms) {
            clearTimeout(_bubbleTimer);
            mascBubble.textContent = msg;
            mascBubble.style.setProperty('--mbc', color || '#f59e0b');
            mascBubble.classList.add('show');
            _bubbleTimer = setTimeout(() => mascBubble.classList.remove('show'), ms || 1400);
        }

        // Curseur « feutre » de la couleur de la nature recherchée
        function penCursor(color) {
            const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>` +
                `<g transform='rotate(45 16 16)'><rect x='11' y='1' width='10' height='20' rx='3' fill='${color}' stroke='white' stroke-width='1.5'/>` +
                `<rect x='11' y='1' width='10' height='6' rx='2' fill='black' opacity='0.25'/>` +
                `<polygon points='12,21 20,21 17.5,29 14.5,29' fill='${color}' stroke='white' stroke-width='1.2'/></g></svg>`;
            return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 5 27, pointer`;
        }

        // =====================================================================
        // PARAMÈTRES
        // =====================================================================
        const natChecks = {};
        NATURES.forEach(n => {
            const label = document.createElement('label');
            label.className = 'jnmt-nat-check checked';
            label.style.setProperty('--nc', n.color);
            label.innerHTML = symbolSVG(n.k) + ' ' + n.label;
            label.addEventListener('pointerdown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                const isOn = settings.natures.includes(n.k);
                if (isOn && settings.natures.length === 1) {
                    // Il faut au moins une nature
                    label.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 250 });
                    return;
                }
                settings.natures = isOn
                    ? settings.natures.filter(k => k !== n.k)
                    : NATURES.map(x => x.k).filter(k => k === n.k || settings.natures.includes(k));
                syncParamsUI();
                restartCurrentText(false);
            });
            natChecks[n.k] = label;
            paramsGrid.appendChild(label);
        });

        function syncParamsUI() {
            NATURES.forEach(n => natChecks[n.k].classList.toggle('checked', settings.natures.includes(n.k)));
            modeSelect.value = settings.mode;
            levelSelect.value = settings.level;
            showNatCheck.checked = settings.showNature;
            syncSoundBtn();
        }

        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        [modeSelect, levelSelect, showNatCheck].forEach(el => el.addEventListener('pointerdown', (e) => e.stopPropagation()));
        modeSelect.addEventListener('change', () => {
            settings.mode = modeSelect.value;
            restartCurrentText(false);
        });
        levelSelect.addEventListener('change', () => {
            settings.level = levelSelect.value;
            if (!text || (settings.level !== 'tous' && text.level !== settings.level)) {
                loadText(pickNextTextId(), false);
            } else {
                persist();
            }
        });
        showNatCheck.addEventListener('change', () => {
            settings.showNature = showNatCheck.checked;
            persist();
        });

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        helpPopup.addEventListener('pointerdown', (e) => e.stopPropagation());
        const _docPointerDown = (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
        };
        document.addEventListener('pointerdown', _docPointerDown);

        // ── Taille de police adaptative ───────────────────────────────────
        function applyFontScale() {
            const w = container.offsetWidth  || 900;
            const h = container.offsetHeight || 640;
            const fs = Math.max(16, Math.min(46, Math.round(Math.min(25 * w / 900, 25 * h / 640))));
            const penFs = Math.max(10, Math.min(15, Math.round(11 * w / 900)));
            const penH  = Math.max(28, Math.min(42, Math.round(32 * w / 900)));
            const misFs = Math.max(13, Math.min(20, Math.round(15 * w / 900)));
            container.style.setProperty('--jnmt-fs', fs + 'px');
            container.style.setProperty('--jnmt-pen-fs', penFs + 'px');
            container.style.setProperty('--jnmt-pen-h', penH + 'px');
            container.style.setProperty('--jnmt-mission-fs', misFs + 'px');
        }

        // =====================================================================
        // BOUTONS FENÊTRE
        // =====================================================================
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null, _isMax = false;

        function collapseWidget() {
            pauseGame();
            if (_isMax) {
                _isMax = false;
                container.classList.remove('wf-fullboard');
                container.classList.remove('jnmt-mobile');
                if (_savedW) container.style.width  = _savedW;
                if (_savedH) container.style.height = _savedH;
                applyFontScale();
            }
            window._wfMiniBarCollapse(widget, WIDGET_LABEL, { onExpand: applyFontScale });
        }

        if (wfMin) makeTap(wfMin, collapseWidget);
        if (wfMax) {
            makeTap(wfMax, () => {
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    _savedH = container.style.height;
                    if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                        container.classList.add('jnmt-mobile');
                    }
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jnmt-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                applyFontScale();
                persist();
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                destroy();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Resize 2D ────────────────────────────────────────────────────
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            function onMove(ev) {
                container.style.width  = Math.max(420, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(360, startH + ev.clientY - startY) + 'px';
                applyFontScale();
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup',   onEnd);
                if (typeof saveBoard === 'function') saveBoard();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup',   onEnd);
        });

        // =====================================================================
        // SAUVEGARDE / RESTAURATION (appelé par save-load.js)
        // =====================================================================
        widget._jnmtGetData = function () {
            const curW = window.innerWidth, curVH = vH(curW);
            const wPx = _isMax ? parseFloat(_savedW) : container.offsetWidth;
            const hPx = _isMax ? parseFloat(_savedH) : container.offsetHeight;
            const collapsed = !!widget.querySelector('.wf-mini-bar');
            const data = {
                containerWPct: wPx > 0 ? (wPx / curW) * 100 : null,
                containerHPct: hPx > 0 ? (hPx / curVH) * 100 : null,
                isMax: _isMax,
                collapsed,
                settings: {
                    natures: settings.natures.slice(),
                    mode: settings.mode,
                    level: settings.level,
                    showNature: settings.showNature,
                    sound: settings.sound,
                },
                game: {
                    textId: text ? text.id : null,
                    found: Array.from(found.entries()),
                    errors, hints, score, textPoints, elapsedMs,
                    missionIdx, selectedPen, done, streak, bestStreak,
                    started: running || done,
                    played: played.slice(),
                },
            };
            if (collapsed) {
                const l = parseFloat(widget.dataset.wfMiniSavedLeft);
                const t = parseFloat(widget.dataset.wfMiniSavedTop);
                if (!isNaN(l)) data.origLeftPct = (l / curW) * 100;
                if (!isNaN(t)) data.origTopPct  = (t / curVH) * 100;
            }
            return data;
        };

        function restoreGameState(g) {
            const t = g && TEXT_BY_ID[g.textId];
            if (!t) { loadText(pickNextTextId(), false); return; }
            text = t;
            found = new Map(Array.isArray(g.found) ? g.found.filter(e => Array.isArray(e) && t.tokens[e[0]] && t.tokens[e[0]].n) : []);
            errors = g.errors || 0;
            hints = g.hints || 0;
            score = g.score || 0;
            textPoints = g.textPoints || 0;
            elapsedMs = g.elapsedMs || 0;
            missionIdx = g.missionIdx || 0;
            selectedPen = g.selectedPen || null;
            done = !!g.done;
            streak = g.streak || 0;
            bestStreak = g.bestStreak || 0;
            played = Array.isArray(g.played) ? g.played.filter(id => TEXT_BY_ID[id]) : [];
            if (!played.includes(t.id)) played.push(t.id);
            renderText();
            // Recalage de la mission sur les mots réellement trouvés
            const order = missionOrder();
            while (missionIdx < order.length && remaining(order[missionIdx]) === 0) missionIdx++;
            if (missionIdx >= order.length) missionIdx = Math.max(0, order.length - 1);
            if (selectedPen && !settings.natures.includes(selectedPen)) selectedPen = null;
            running = false; paused = true;
            refreshAll();
            if (done) {
                showEndOverlay(false);
            } else if (g.started) {
                showOverlay('resume');
                setMood('sleep', 'Zzz… 💤', '#6366f1');
            } else {
                showOverlay('start');
            }
        }

        // =====================================================================
        // LOGIQUE DU JEU
        // =====================================================================

        function formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const ss = (totalSec % 60).toString().padStart(2, '0');
            return mm + ':' + ss;
        }

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function textPool() {
            return TEXTS.filter(t => settings.level === 'tous' || t.level === settings.level);
        }

        function pickNextTextId() {
            const pool = textPool();
            let candidates = pool.filter(t => !played.includes(t.id) && (!text || t.id !== text.id));
            if (candidates.length === 0) {
                // Tous les textes ont été joués : on recommence le tour
                played = played.filter(id => !pool.some(t => t.id === id));
                candidates = pool.filter(t => !text || t.id !== text.id);
                if (candidates.length === 0) candidates = pool;
            }
            return candidates[randInt(0, candidates.length - 1)].id;
        }

        // Nombre total de mots d'une nature dans le texte
        function total(k) {
            if (!text) return 0;
            return text.tokens.reduce((acc, tk) => acc + (tk.n === k ? 1 : 0), 0);
        }
        function foundCount(k) {
            let c = 0;
            found.forEach((_, i) => { if (text.tokens[i].n === k) c++; });
            return c;
        }
        function remaining(k) { return total(k) - foundCount(k); }

        // Natures actives présentes dans le texte, dans l'ordre pédagogique
        function missionOrder() {
            return NATURES.map(n => n.k).filter(k => settings.natures.includes(k) && total(k) > 0);
        }

        function activePen() {
            if (settings.mode === 'mission') {
                const order = missionOrder();
                return order[missionIdx] || null;
            }
            return selectedPen;
        }

        function allDone() {
            return missionOrder().every(k => remaining(k) === 0);
        }

        // ── Rendu du texte ───────────────────────────────────────────────
        function renderText() {
            textEl.innerHTML = '';
            if (!text) return;
            const toks = text.tokens;
            const groups = [];
            let cur = null;
            toks.forEach((tk, i) => {
                const glued = i > 0 && (toks[i - 1].w.endsWith("'") || /^[.,)…]$/.test(tk.w) || /^[!?;:]$/.test(tk.w));
                if (!cur || !glued) { cur = []; groups.push(cur); }
                cur.push(i);
            });
            groups.forEach((g, gi) => {
                if (gi > 0) textEl.appendChild(document.createTextNode(' '));
                const grp = document.createElement('span');
                grp.className = 'jnmt-grp';
                g.forEach(i => {
                    const tk = toks[i];
                    if (tk.n) {
                        const w = document.createElement('span');
                        w.className = 'jnmt-w';
                        w.dataset.i = i;
                        w.textContent = tk.w;
                        grp.appendChild(w);
                    } else {
                        const p = document.createElement('span');
                        p.className = 'jnmt-punct';
                        p.textContent = (/^[!?;:]$/.test(tk.w) ? '\u202F' : '') + tk.w;
                        grp.appendChild(p);
                    }
                });
                textEl.appendChild(grp);
            });
            found.forEach((kind, i) => decorateFound(i, kind, false));
            scrollEl.scrollTop = 0;
        }

        function wordEl(i) { return textEl.querySelector('.jnmt-w[data-i="' + i + '"]'); }

        function decorateFound(i, kind, animate) {
            const el = wordEl(i);
            if (!el) return;
            const nat = NAT[text.tokens[i].n];
            el.classList.add('found');
            el.classList.toggle('revealed', kind === 'rev');
            el.style.setProperty('--wt', nat.text);
            el.style.setProperty('--whl', nat.hl);
            el.style.setProperty('--wc', nat.color);
            el.title = nat.one.charAt(0).toUpperCase() + nat.one.slice(1);
            if (!el.querySelector('.jnmt-sym')) {
                const sym = document.createElement('span');
                sym.className = 'jnmt-sym';
                sym.innerHTML = symbolSVG(nat.k);
                el.appendChild(sym);
            }
            if (animate) {
                el.classList.remove('just-found');
                void el.offsetWidth;
                el.classList.add('just-found');
                setTimeout(() => el.classList.remove('just-found'), 500);
            }
        }

        // ── Trousse de surligneurs ───────────────────────────────────────
        function renderPens() {
            pensEl.innerHTML = '';
            const order = missionOrder();
            const current = activePen();
            order.forEach(k => {
                const nat = NAT[k];
                const tot = total(k), fc = foundCount(k);
                const wrap = document.createElement('div');
                wrap.className = 'jnmt-pen-wrap';
                const isDone = fc >= tot;
                if (k === current && !done) wrap.classList.add('sel');
                if (isDone) wrap.classList.add('done');
                else if (settings.mode === 'mission' && k !== current) wrap.classList.add('locked');
                const btn = document.createElement('button');
                btn.className = 'jnmt-pen';
                btn.style.setProperty('--pc', nat.color);
                btn.title = nat.label;
                btn.innerHTML = `<span class="jnmt-pen-sym">${symbolSVG(k)}</span><span>${nat.pen}</span><span class="jnmt-pen-count">${isDone ? '✓' : fc + '/' + tot}</span>`;
                if (settings.mode === 'libre' && !isDone) {
                    makeTap(btn, () => {
                        if (done) return;
                        selectedPen = (selectedPen === k) ? null : k;
                        play('pen');
                        if (selectedPen) say('Cherche les ' + nat.plural + ' !', nat.color, 1300);
                        refreshAll();
                        persist();
                    });
                } else {
                    btn.disabled = true;
                    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
                }
                wrap.appendChild(btn);
                pensEl.appendChild(wrap);
            });
        }

        // ── Bandeau de mission + barre de progression ──────────────────
        function renderMission(flash) {
            const pen = activePen();
            if (done) {
                missionText.innerHTML = '<span>🏆 Texte terminé, bravo !</span>';
                missionEl.style.setProperty('--mc', '#16a34a');
                progressFill.style.width = '100%';
                progressLbl.textContent = '';
            } else if (!pen) {
                const order = missionOrder();
                const tot = order.reduce((a, k) => a + total(k), 0);
                const fc  = order.reduce((a, k) => a + foundCount(k), 0);
                missionText.innerHTML = '<span>🖍️ Choisis un surligneur, puis clique sur les mots</span>';
                missionEl.style.setProperty('--mc', '#4a90e2');
                progressFill.style.width = (tot ? (fc / tot) * 100 : 0) + '%';
                progressLbl.textContent = fc + ' / ' + tot + ' mots';
            } else {
                const nat = NAT[pen];
                const tot = total(pen), fc = foundCount(pen);
                const prefix = settings.mode === 'mission' ? 'Mission : trouve ' : 'Surligne ';
                const what = tot > 1 ? `les <b>${tot} ${nat.plural}</b>` : `le seul <b>${nat.one}</b>`;
                missionText.innerHTML = symbolSVG(pen) + '<span>' + prefix + what + '</span>';
                missionEl.style.setProperty('--mc', nat.color);
                progressFill.style.width = (tot ? (fc / tot) * 100 : 0) + '%';
                progressLbl.textContent = fc + ' / ' + tot;
            }
            if (flash) {
                missionEl.classList.remove('flash');
                void missionEl.offsetWidth;
                missionEl.classList.add('flash');
            }
        }

        function updateHUD() {
            scoreEl.textContent = '⭐ Score : ' + score;
            textNameEl.textContent = text ? text.title : '';
            comboEl.textContent = '🔥 Série : ' + streak + (streak >= 3 ? '  (+5)' : '');
            comboEl.classList.toggle('hot', streak >= 3);
            errorsEl.textContent = '❌ ' + errors;
            errorsEl.title = errors + ' erreur' + (errors > 1 ? 's' : '');
            updateTimerDisplay();
        }

        function updateTimerDisplay() {
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }

        function updateControls() {
            const playing = running && !paused && !done;
            textEl.classList.toggle('playing', playing);
            pauseBtn.textContent = (running && paused && !done) ? '▶ Reprendre' : '⏸ Pause';
            pauseBtn.disabled = done;
            hintBtn.disabled = !playing;
            solBtn.disabled = !playing;
        }

        function refreshAll(flash) {
            const pen = activePen();
            if (pen) {
                textEl.style.setProperty('--jnmt-cursor', penCursor(NAT[pen].color));
                textEl.style.setProperty('--jnmt-hover', NAT[pen].hl);
            } else {
                textEl.style.removeProperty('--jnmt-cursor');
                textEl.style.removeProperty('--jnmt-hover');
            }
            renderPens();
            renderMission(flash);
            updateHUD();
            updateControls();
        }

        // ── Effets visuels ───────────────────────────────────────────────
        function posInScroll(el) {
            const sr = scrollEl.getBoundingClientRect();
            const r  = el.getBoundingClientRect();
            return {
                x: r.left + r.width / 2 - sr.left + scrollEl.scrollLeft,
                y: r.top + r.height / 2 - sr.top + scrollEl.scrollTop,
            };
        }

        function sparkBurst(el, color) {
            const { x, y } = posInScroll(el);
            const chars = ['★', '✦', '●', '★', '✦', '★', '●', '✦'];
            chars.forEach((ch, idx) => {
                const s = document.createElement('span');
                s.className = 'jnmt-spark';
                s.textContent = ch;
                const ang = (Math.PI * 2 * idx / chars.length) + (Math.random() * 0.6 - 0.3);
                const dist = 28 + Math.random() * 26;
                s.style.left = x + 'px';
                s.style.top  = y + 'px';
                s.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
                s.style.setProperty('--dy', Math.round(Math.sin(ang) * dist) + 'px');
                s.style.setProperty('--rot', randInt(-180, 180) + 'deg');
                s.style.setProperty('--sz', randInt(10, 18) + 'px');
                s.style.setProperty('--sc', idx % 2 ? '#fbbf24' : color);
                scrollEl.appendChild(s);
                setTimeout(() => s.remove(), 650);
            });
        }

        function floatPoints(el, txt, color) {
            const { x, y } = posInScroll(el);
            const f = document.createElement('span');
            f.className = 'jnmt-float';
            f.textContent = txt;
            f.style.left = x + 'px';
            f.style.top = y + 'px';
            f.style.setProperty('--fc', color);
            scrollEl.appendChild(f);
            setTimeout(() => f.remove(), 1050);
        }

        function bump(el) {
            el.classList.remove('bump');
            void el.offsetWidth;
            el.classList.add('bump');
        }

        function showBubble(el, nat) {
            el.querySelectorAll('.jnmt-bubble').forEach(b => b.remove());
            const b = document.createElement('span');
            b.className = 'jnmt-bubble';
            b.style.setProperty('--bc', nat.color);
            b.textContent = "C'est " + nat.art + ' !';
            el.appendChild(b);
            setTimeout(() => b.remove(), 1850);
        }

        function showToast(msg, color) {
            paper.querySelectorAll('.jnmt-toast').forEach(t => t.remove());
            const t = document.createElement('div');
            t.className = 'jnmt-toast';
            t.style.setProperty('--tc', color);
            t.textContent = msg;
            paper.appendChild(t);
            setTimeout(() => t.remove(), 1950);
        }

        function confettiRain() {
            const colors = NATURES.map(n => n.color).concat(['#fbbf24', '#f472b6']);
            const w = paper.clientWidth || 600;
            const h = paper.clientHeight || 400;
            for (let i = 0; i < 46; i++) {
                const c = document.createElement('div');
                c.className = 'jnmt-confetti';
                c.style.left = randInt(0, w) + 'px';
                c.style.background = colors[i % colors.length];
                c.style.setProperty('--dx', randInt(-80, 80) + 'px');
                c.style.setProperty('--rot', randInt(-540, 540) + 'deg');
                c.style.setProperty('--fall', (h + 30) + 'px');
                c.style.setProperty('--dur', (1.3 + Math.random() * 1.1).toFixed(2) + 's');
                c.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
                paper.appendChild(c);
                setTimeout(() => c.remove(), 3000);
            }
        }

        // ── Clic sur un mot ──────────────────────────────────────────────
        let _tapWord = null, _tapX = 0, _tapY = 0, _tapPid = null;
        paper.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); // on ne déplace pas le widget en cliquant dans le texte
            const w = e.target.closest && e.target.closest('.jnmt-w');
            _tapWord = w; _tapX = e.clientX; _tapY = e.clientY; _tapPid = e.pointerId;
        });
        paper.addEventListener('pointerup', (e) => {
            if (e.pointerId !== _tapPid) return;
            const w = _tapWord;
            _tapWord = null;
            if (!w) return;
            const dx = e.clientX - _tapX, dy = e.clientY - _tapY;
            if (Math.sqrt(dx*dx + dy*dy) >= 12) return;
            const target = e.target.closest && e.target.closest('.jnmt-w');
            if (target !== w) return;
            onWordTap(parseInt(w.dataset.i, 10), w);
        });

        function onWordTap(i, el) {
            if (!running || paused || done || !text) return;
            if (found.has(i)) return;
            const tk = text.tokens[i];
            const pen = activePen();
            if (!pen) {
                pensEl.classList.remove('nudge');
                void pensEl.offsetWidth;
                pensEl.classList.add('nudge');
                showToast('Choisis d\'abord un surligneur 🖍️', '#4a90e2');
                setMood('think', 'Prends un feutre !', '#4a90e2', 1500);
                play('wrong');
                return;
            }
            if (tk.n === pen) {
                found.set(i, 'ok');
                streak++;
                if (streak > bestStreak) bestStreak = streak;
                const pts = 10 + (streak >= 3 ? 5 : 0);
                score += pts; textPoints += pts;
                decorateFound(i, 'ok', true);
                sparkBurst(el, NAT[pen].color);
                floatPoints(el, '+' + pts, NAT[pen].color);
                bump(scoreEl);
                if (streak >= 3) {
                    bump(comboEl);
                    if (streak === 3 || streak % 5 === 0) {
                        play('combo', streak);
                        setMood('happy', 'Série ×' + streak + ' ! 🔥', '#f43f5e', 1300);
                    } else {
                        play('correct', streak);
                        setMood('happy', pick(PRAISES), NAT[pen].color, 1000);
                    }
                } else {
                    play('correct', streak);
                    setMood('happy', pick(PRAISES), NAT[pen].color, 1000);
                }
                afterProgress(pen);
            } else {
                errors++;
                streak = 0;
                play('wrong');
                setMood('sad', pick(OOPS), '#ef4444', 1200);
                const loss = Math.min(2, score);
                score -= loss; textPoints -= loss;
                if (loss) floatPoints(el, '−' + loss, '#dc2626');
                el.classList.remove('wrong');
                void el.offsetWidth;
                el.classList.add('wrong');
                setTimeout(() => el.classList.remove('wrong'), 420);
                if (settings.showNature) showBubble(el, NAT[tk.n]);
                refreshAll();
            }
            persist();
        }

        // Après un mot trouvé (ou révélé) : nature terminée ? texte terminé ?
        function afterProgress(pen) {
            if (remaining(pen) === 0) {
                if (allDone()) {
                    refreshAll();
                    finishText();
                    return;
                }
                const nat = NAT[pen];
                showToast('Bravo ! Tous les ' + nat.plural + ' sont trouvés 🎉', nat.color);
                play('natureDone');
                setMood('cheer', 'Nature terminée ! 🎉', nat.color, 1600);
                if (settings.mode === 'mission') {
                    const order = missionOrder();
                    while (missionIdx < order.length && remaining(order[missionIdx]) === 0) missionIdx++;
                    refreshAll(true);
                    return;
                }
                selectedPen = null;
            }
            refreshAll();
        }

        function computeStars() {
            const revealed = Array.from(found.values()).some(v => v === 'rev');
            if (revealed) return 1;
            const weight = errors + hints * 0.5;
            if (weight === 0) return 3;
            if (weight <= 3) return 2;
            return 1;
        }

        function finishText() {
            done = true;
            running = false;
            paused = true;
            const revealed = Array.from(found.values()).some(v => v === 'rev');
            if (errors === 0 && hints === 0 && !revealed) { score += 20; textPoints += 20; }
            refreshAll();
            confettiRain();
            play('win');
            setMood('cheer', 'Texte terminé ! 🏆', '#16a34a', 0);
            persist();
            setTimeout(() => { if (!destroyed && done) showEndOverlay(true); }, 1100);
        }

        // ── Overlays ─────────────────────────────────────────────────────
        function naturesChipsHTML() {
            return missionOrder().map(k => {
                const n = NAT[k];
                return `<span style="--nc:${n.color}">${symbolSVG(k)} ${n.label} : ${total(k)}</span>`;
            }).join('');
        }

        function showOverlay(kind) {
            overlayAction = kind;
            overlay.classList.remove('end');
            paper.classList.remove('ended');
            starsEl.classList.remove('show');
            starsEl.innerHTML = '';
            secondBtn.classList.add('hidden');
            overlayNats.innerHTML = naturesChipsHTML();
            if (kind === 'start') {
                overlayTitle.textContent = '📄 ' + (text ? text.title : WIDGET_LABEL);
                overlaySub.textContent = settings.mode === 'mission'
                    ? 'Lis le texte, puis trouve les mots nature par nature. Voici ce qu\'il faut chercher :'
                    : 'Choisis un surligneur dans la trousse, puis clique sur les mots de cette nature. Voici ce qu\'il faut chercher :';
                startBtn.textContent = '▶ Commencer';
            } else if (kind === 'resume') {
                overlayTitle.textContent = '⏸ En pause';
                overlaySub.textContent = 'Clique sur Reprendre pour continuer la chasse aux mots.';
                overlayNats.innerHTML = '';
                startBtn.textContent = '▶ Reprendre';
            }
            overlay.classList.remove('hidden');
            updateControls();
        }

        function showEndOverlay(animate) {
            overlayAction = 'next';
            const stars = computeStars();
            starsEl.innerHTML = '';
            for (let s = 0; s < 3; s++) {
                const st = document.createElement('span');
                st.className = 'jnmt-star' + (s < stars ? ' on' : '');
                st.textContent = '★';
                st.style.animationDelay = animate ? (0.15 + s * 0.22) + 's' : '0s';
                starsEl.appendChild(st);
                if (animate && s < stars) setTimeout(() => play('star', s), 150 + s * 220);
            }
            starsEl.classList.add('show');
            overlayNats.innerHTML = '';
            const titles = ['', '👍 Texte terminé !', '👏 Très bien !', '🏆 Parfait !'];
            overlayTitle.textContent = titles[stars];
            const pts = textPoints >= 0 ? '+' + textPoints : String(textPoints);
            overlaySub.textContent = 'Erreurs : ' + errors + ' — Meilleure série : ' + bestStreak + ' 🔥 — Temps : ' + formatTime(elapsedMs) + ' — ' + pts + ' points';
            startBtn.textContent = '▶ Texte suivant';
            secondBtn.classList.remove('hidden');
            overlay.classList.add('end');
            paper.classList.add('ended');
            overlay.classList.remove('hidden');
            setMood('cheer', stars === 3 ? 'Parfait ! ⭐⭐⭐' : 'Bravo ! 👏', '#f59e0b', 0);
            updateControls();
        }

        function hideOverlay() { overlay.classList.add('hidden'); overlay.classList.remove('end'); paper.classList.remove('ended'); }

        // ── Cycle de partie ──────────────────────────────────────────────
        function loadText(id, autoStart) {
            text = TEXT_BY_ID[id] || TEXTS[0];
            if (!played.includes(text.id)) played.push(text.id);
            found = new Map();
            errors = 0; hints = 0; textPoints = 0; elapsedMs = 0;
            missionIdx = 0; selectedPen = null; done = false;
            streak = 0; bestStreak = 0;
            renderText();
            textNameEl.classList.remove('pop');
            void textNameEl.offsetWidth;
            textNameEl.classList.add('pop');
            if (autoStart) {
                running = true; paused = false;
                hideOverlay();
                play('start');
                setMood('idle', 'Nouveau texte ! C\'est parti 🔎', '#f59e0b', 1500);
            } else {
                running = false; paused = true;
                showOverlay('start');
                setMood('idle', 'Prêt ? 🔎', '#f59e0b', 1500);
            }
            refreshAll(true);
            persist();
        }

        // Rejoue le texte courant (changement de réglages ou « Refaire »)
        function restartCurrentText(autoStart) {
            if (!text) { loadText(pickNextTextId(), autoStart); return; }
            if (textPoints > 0 && !done) { score = Math.max(0, score - textPoints); }
            loadText(text.id, autoStart);
        }

        function startGame() {
            if (done) return;
            running = true;
            paused = false;
            hideOverlay();
            paramsPanel.classList.remove('show');
            paramsBtn.classList.remove('active');
            SFX.unlock();
            play('start');
            const p0 = activePen();
            setMood('happy', p0 ? 'Cherche les ' + NAT[p0].plural + ' !' : 'Choisis un feutre !', p0 ? NAT[p0].color : '#4a90e2', 1400);
            refreshAll();
            persist();
        }

        function pauseGame() {
            if (!running || paused || done) return;
            paused = true;
            showOverlay('resume');
            play('pause');
            setMood('sleep', 'Zzz… 💤', '#6366f1');
            persist();
        }

        function togglePause() {
            if (done) return;
            if (!running || paused) startGame();
            else pauseGame();
        }

        function resetGame() {
            score = 0;
            played = [];
            loadText(text ? text.id : pickNextTextId(), false);
        }

        makeTap(startBtn, () => {
            if (overlayAction === 'next') loadText(pickNextTextId(), true);
            else startGame();
        });
        makeTap(secondBtn, () => {
            if (text) loadText(text.id, true);
        });
        makeTap(pauseBtn, togglePause);
        makeTap(resetBtn, resetGame);
        makeTap(nextBtn, () => {
            const wasPlaying = running && !paused && !done;
            if (!done && textPoints > 0) score = Math.max(0, score - textPoints);
            loadText(pickNextTextId(), wasPlaying);
        });

        // ── Indice : fait clignoter un mot restant de la nature active ──
        makeTap(hintBtn, () => {
            if (!running || paused || done) return;
            const pen = activePen();
            const cands = [];
            text.tokens.forEach((tk, i) => {
                if (found.has(i) || !tk.n) return;
                if (pen ? tk.n === pen : settings.natures.includes(tk.n)) cands.push(i);
            });
            if (!cands.length) return;
            const i = cands[randInt(0, cands.length - 1)];
            const el = wordEl(i);
            if (!el) return;
            hints++;
            play('hint');
            setMood('think', 'Regarde là… 💡', '#f59e0b', 1500);
            const loss = Math.min(5, score);
            score -= loss; textPoints -= loss;
            el.classList.remove('hint');
            void el.offsetWidth;
            el.classList.add('hint');
            setTimeout(() => el.classList.remove('hint'), 3100);
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            if (!pen) showToast('Indice : c\'est ' + NAT[text.tokens[i].n].art, NAT[text.tokens[i].n].color);
            updateHUD();
            persist();
        });

        // ── Solution : révèle les mots restants de la nature active ─────
        makeTap(solBtn, () => {
            if (!running || paused || done) return;
            const pen = activePen();
            const targets = pen ? [pen] : missionOrder();
            text.tokens.forEach((tk, i) => {
                if (!found.has(i) && targets.includes(tk.n)) {
                    found.set(i, 'rev');
                    streak = 0;
                    decorateFound(i, 'rev', true);
                }
            });
            play('reveal');
            if (pen) afterProgress(pen);
            else if (allDone()) { refreshAll(); finishText(); }
            else refreshAll();
            persist();
        });

        // ── Chrono ───────────────────────────────────────────────────────
        let _lastTick = null;
        const _timerId = setInterval(() => {
            if (destroyed) return;
            const now = performance.now();
            if (running && !paused && !done) {
                if (_lastTick !== null) elapsedMs += now - _lastTick;
                _lastTick = now;
                updateTimerDisplay();
            } else {
                _lastTick = null;
            }
        }, 250);

        function destroy() {
            if (destroyed) return;
            destroyed = true;
            running = false; paused = true;
            clearInterval(_timerId);
            clearTimeout(_persistTimer);
            clearTimeout(_moodTimer);
            clearTimeout(_bubbleTimer);
            document.removeEventListener('pointerdown', _docPointerDown);
        }

        // ── Init ─────────────────────────────────────────────────────────
        if (pending && pending.settings) {
            const ps = pending.settings;
            if (Array.isArray(ps.natures)) {
                const valid = NATURES.map(n => n.k).filter(k => ps.natures.includes(k));
                if (valid.length) settings.natures = valid;
            }
            if (ps.mode === 'mission' || ps.mode === 'libre') settings.mode = ps.mode;
            if (['tous', 'facile', 'confirme'].includes(ps.level)) settings.level = ps.level;
            if (typeof ps.showNature === 'boolean') settings.showNature = ps.showNature;
            if (typeof ps.sound === 'boolean') settings.sound = ps.sound;
        }
        syncParamsUI();

        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (destroyed) return;
            const curW  = window.innerWidth;
            const curVH = vH(curW);
            const isMobile = typeof isMobileBoardMode === 'function' && isMobileBoardMode();

            if (pending) {
                // ── Restauration après actualisation du board ──
                if (pending.containerWPct > 0) container.style.width  = Math.max(420, (pending.containerWPct / 100) * curW)  + 'px';
                if (pending.containerHPct > 0) container.style.height = Math.max(360, (pending.containerHPct / 100) * curVH) + 'px';
                if (!container.style.width)  container.style.width  = '900px';
                if (!container.style.height) container.style.height = '640px';
                _savedW = container.style.width;
                _savedH = container.style.height;
                if (pending.isMax || isMobile) {
                    if (isMobile) container.classList.add('jnmt-mobile');
                    _isMax = true;
                    container.classList.add('wf-fullboard');
                }
            } else if (isMobile) {
                const wPct = parseFloat(widget.dataset.widthPercent);
                const hPct = parseFloat(widget.dataset.contentHPercent);
                if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
                if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
                if (!container.style.height) container.style.height = '560px';
                _savedW = container.style.width;
                _savedH = container.style.height;
                container.classList.add('jnmt-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            } else {
                // Nouveau widget sur PC : 100px du bord gauche, 900×640px
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
                container.style.width  = '900px';
                container.style.height = '640px';
                _savedW = container.style.width;
                _savedH = container.style.height;
            }

            applyFontScale();

            if (pending && pending.game) {
                restoreGameState(pending.game);
            } else {
                loadText(pickNextTextId(), false);
                paramsPanel.classList.add('show');
                paramsBtn.classList.add('active');
            }

            // Widget réduit au moment de la sauvegarde : on le réduit à nouveau
            if (pending && pending.collapsed) {
                if (pending.origLeftPct != null) widget.style.left = (pending.origLeftPct / 100) * curW  + 'px';
                if (pending.origTopPct  != null) widget.style.top  = (pending.origTopPct  / 100) * curVH + 'px';
                if (_isMax) {
                    _isMax = false;
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jnmt-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                    applyFontScale();
                }
                window._wfMiniBarCollapse(widget, WIDGET_LABEL, { onExpand: applyFontScale });
            }
        }));

        // ── Recalcul de la police si la fenêtre change de taille ────────
        const _ro = (typeof ResizeObserver === 'function') ? new ResizeObserver(() => applyFontScale()) : null;
        if (_ro) _ro.observe(container);

        // ── Nettoyage si le widget est retiré du DOM autrement que via wfClose ──
        const _observer = new MutationObserver(() => {
            if (!document.body.contains(widget)) {
                destroy();
                if (_ro) _ro.disconnect();
                _observer.disconnect();
            }
        });
        _observer.observe(document.body, { childList: true, subtree: true });
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function wrapCreateWidget(orig) {
        return function (type) {
            var widget = orig.apply(this, arguments);
            if (type === WIDGET_TYPE && widget) initJeuNatureMotsTexteWidget(widget);
            return widget;
        };
    }
    if (typeof window.createWidget === 'function') {
        window.createWidget = wrapCreateWidget(window.createWidget);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof window.createWidget === 'function') {
                window.createWidget = wrapCreateWidget(window.createWidget);
            }
        });
    }

})();
