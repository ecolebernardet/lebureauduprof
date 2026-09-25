// =========================================================================
// WIDGET LE MOT LE PLUS LONG — Le Bureau du Prof
// Tirage de 9 lettres (consonne ou voyelle au choix), puis recherche du
// mot le plus long formé avec ces lettres. Le widget propose la solution.
// Règles : pluriels et féminins acceptés ; verbes conjugués, mots
// étrangers, noms propres et onomatopées interdits (infinitifs acceptés).
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
        .widget[data-type="mot-long"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ml-container {
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
        .ml-container input {
            user-select: text;
            -webkit-user-select: text;
            font-family: inherit;
        }

        /* En-tête */
        .ml-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .ml-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .ml-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #e8eefc;
            color: #2f4f9e;
        }

        /* Réduit / plein écran */
        .ml-container.wf-minimized > *:not(.ml-header) { display: none !important; }
        .ml-container.wf-minimized { gap: 0; }
        .ml-container.wf-fullboard {
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
        .ml-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .ml-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .ml-btn:active { transform: scale(0.96); }
        .ml-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .ml-btn-new { background: #4a90e2; color: white; }
        .ml-btn-new:hover { background: #357abd; }
        .ml-btn-auto { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .ml-btn-auto:hover:not(:disabled) { background: #e0e0e0; }
        .ml-btn-answer { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .ml-btn-answer:hover:not(:disabled) { background: #e0e0e0; }
        .ml-btn-answer.revealed { background: #28a745; color: white; border-color: #28a745; }

        .ml-timer-btns { display: flex; gap: 4px; margin-left: auto; }
        .ml-timer-btn {
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
        .ml-timer-btn:hover { background: #e0e0e0; }
        .ml-timer-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Barre de tirage */
        .ml-draw-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            min-height: 40px;
        }
        .ml-draw-btn {
            padding: 8px 22px;
            border-radius: 10px;
            border: none;
            font-size: 15px;
            font-weight: 800;
            cursor: pointer;
            color: white;
            box-shadow: 0 3px 0 rgba(0,0,0,0.18);
            transition: transform .08s, box-shadow .08s, filter .15s;
        }
        .ml-draw-btn:hover { filter: brightness(1.07); }
        .ml-draw-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.18); }
        .ml-draw-btn.voyelle  { background: #d9534f; }
        .ml-draw-btn.consonne { background: #3b6fd4; }
        .ml-draw-info { font-size: 12px; color: #6b7280; font-weight: 600; min-width: 90px; text-align: center; }
        .ml-chrono {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: 26px;
            font-weight: 800;
            color: #374151;
            font-variant-numeric: tabular-nums;
        }
        .ml-chrono.urgent { color: #dc3545; }
        .ml-chrono.over   { color: #dc3545; font-size: 20px; }

        /* Zone lettres */
        .ml-tiles {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            height: 150px;
            padding: 8px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
            flex-shrink: 0;
            overflow: hidden;
        }
        .ml-tile {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12%;
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-weight: 900;
            line-height: 1;
            box-sizing: border-box;
            transition: opacity .15s, transform .15s;
        }
        .ml-tile.empty {
            border: 2px dashed #cbd5e1;
            color: #cbd5e1;
            background: transparent;
        }
        .ml-tile.full {
            background: linear-gradient(160deg, #fffaf0 0%, #f3e4c6 100%);
            border: 1px solid #d8c29a;
            box-shadow: 0 3px 0 #c9ae7e, 0 5px 10px rgba(0,0,0,0.12);
            cursor: pointer;
            animation: mlPop .22s ease-out;
        }
        .ml-tile.full.v { color: #c0392b; }
        .ml-tile.full.c { color: #2c4f9e; }
        .ml-tile.full:hover { transform: translateY(-2px); }
        .ml-tile.used { opacity: .28; transform: none; }
        @keyframes mlPop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Réponse */
        .ml-answer-zone {
            min-height: 28px;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        .ml-answer-label { font-size: 20px; color: #888; }
        .ml-answer-input {
            font-family: 'Nunito', 'Segoe UI', sans-serif !important;
            width: 350px;
            padding: 5px 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 40px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            outline: none;
            transition: border-color .2s;
        }
        .ml-answer-input:focus { border-color: #4a90e2; }
        .ml-answer-input.correct { border-color: #28a745; background: #f0fff4; color: #1a7a3a; }
        .ml-answer-input.wrong   { border-color: #dc3545; background: #fff5f5; color: #9c1c28; }
        .ml-answer-input.unknown { border-color: #e0a800; background: #fffbea; color: #8a5c00; }
        .ml-small-btn {
            padding: 5px 10px;
            border-radius: 8px;
            border: 1px solid #ddd;
            font-size: 25px;
            font-weight: 700;
            cursor: pointer;
            background: #f5f5f5;
            color: #555;
        }
        .ml-small-btn:hover { background: #e0e0e0; }
        .ml-check-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            background: #4a90e2;
            color: white;
            transition: background .15s;
        }
        .ml-check-btn:hover { background: #357abd; }
        .ml-feedback {
            font-size: 18px;
            font-weight: 700;
            opacity: 0;
            transition: opacity .3s;
        }
        .ml-feedback.show { opacity: 1; }
        .ml-feedback.ok      { color: #1a7a3a; }
        .ml-feedback.ko      { color: #9c1c28; }
        .ml-feedback.unknown { color: #8a5c00; }

        /* Solution */
        .ml-solution {
            display: none;
            padding: 8px 12px;
            background: #f0fff4;
            border: 1px solid #b7e4c7;
            border-radius: 10px;
            color: #1a5c32;
            font-size: 18px;
            line-height: 1.5;
        }
        .ml-solution.show { display: block; }
        .ml-solution .ml-sol-best {
            font-family: 'Nunito', 'Segoe UI', sans-serif;
            font-size: 35px;
            font-weight: 900;
            color: #28a745;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-right: 10px;
        }
        .ml-solution .ml-sol-others { color: #2f6b45; }
        .ml-solution .ml-sol-next { color: #6b7280; font-size: 15px; margin-top: 2px; }
        .ml-solution .ml-sol-def {
            font-size: 22px;
            color: #2f4f3a;
            margin: 2px 0 4px;
            padding-left: 8px;
            border-left: 3px solid #b7e4c7;
        }
        .ml-solution .ml-sol-def .ml-def-lemma { color: #6b7280; font-size: 12px; }
        .ml-solution .ml-sol-def.loading { color: #9ca3af; font-style: italic; }

        /* Aide */
        .ml-help-btn {
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
        .ml-help-btn:hover { background: #e0e0e0; color: #333; }
        .ml-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 300px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .ml-help-popup.show { display: block; }
        .ml-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .ml-help-popup p { margin: 0 0 6px; }
        .ml-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .ml-resize-handle {
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
        .ml-container:hover .ml-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données lettres ───────────────────────────────────────────────────────
// Pondérations inspirées de la fréquence des lettres en français.
const ML_VOYELLES  = { A: 9, E: 15, I: 8, O: 6, U: 6, Y: 1 };
const ML_CONSONNES = { B: 2, C: 3, D: 3, F: 2, G: 2, H: 2, J: 1, K: 0.5, L: 5, M: 3,
                       N: 6, P: 3, Q: 1, R: 6, S: 7, T: 6, V: 2, W: 0.5, X: 1, Z: 1 };
const ML_MAX_REPEAT = 3; // une même lettre au plus 3 fois
const ML_RARES = 'JKQWXYZ'; // au plus 1 fois

const ML_TIMERS = {
    0:  'Sans chrono',
    30: 'Chrono 30 s',
    60: 'Chrono 60 s'
};

// ── Dictionnaire intégré ──────────────────────────────────────────────────
// Noms, adjectifs (masculin, féminin, pluriels), infinitifs et mots
// invariables. Aucune forme conjuguée, aucun mot étranger ni onomatopée.
const ML_DICO_RAW = `abaisser abandon abandons abattoir abattoirs abattre abeille abeilles aboiement abondance abondant abondante
abondants abonné abonnés abord abords aboyer abri abricot abricots abris abriter absence absences absent
absente absentes absents absolu absolue absolues absolus absorber abstrait abstraite abstraits absurde
absurdes absurdité académie académies accent accents accepter accident accidents accolade accolades accord
accorder accords accordéon accroc accrocher accrocs accueil accueils accuser accès achat achats acheter
achever acier aciers acrobate acrobates acrobatie acteur acteurs actif actifs action actions active actives
activité activités actrice actrices actualité addition additions adieu adieux adjectif adjectifs adjoint
adjoints admirer adoption adoptions adorable adorables adorateur adorer adresse adresses adroit adroite
adroites adroits adulte adultes affaire affaires affamé affamée affamées affamés affection affiche affiches
affirmer agaçant agaçante agaçantes agaçants agence agences agenda agendas agent agents agile agiles agilité
agilités agir agitation agiter agité agitée agitées agités agneau agneaux agrafe agrafes agréable agréables
agrément agréments aide aider aides aigle aigles aigre aigres aigreur aigreurs aigu aiguille aiguilles
aiguillon aigus aiguë aiguës ail aile ailes ailier ailiers ailleurs ails aimable aimables aimant aimanter
aimants aimer aimé aimée aimées aimés aine aines ainsi air aire aires airs aisance aisances aisé aisée aisées
aisés ajout ajouter ajouts alarme alarmes album albums alcool alcools alerte alerter alertes algue algues
alibi alibis aliment aliments aliter allaiter alliance alliances allié alliés allongé allongée allongées
allongés allumer allumette allure allures allée allées alors alouette alouettes aloès alphabet alphabets
alpiniste alterner altitude altitudes alto altos alène alènes amande amandes amant amants amarre amarrer
amarres amateur amateurs ambition ambitions ambre ambres ambulance amende amender amendes amener amenuiser
amer amers ami amibe amibes amical amicale amicales amicaux amie amies amiral amiraux amis amitié amitiés
amorce amorces amour amoureuse amoureux amours ample amples ampleur ampleurs ampoule ampoules amusant amusante
amusantes amusants amusement amuser amusette amusettes amère amères analyse analyses ananas anatomie anatomies
ancien ancienne anciennes anciens ancre ancres ancêtre ancêtres andouille anecdote anecdotes ange anges
anglais anglaise anglaises angle angles anguille anguilles animal animateur animation animaux animer animé
animée animées animés anis anneau anneaux annonce annoncer annonces annoter annuel annuelle annuelles annuels
année années anomalie anomalies anonyme anonymes anorak anoraks anse anses antenne antennes antilope antilopes
antique antiques antiquité antre antres anxieuse anxieuses anxieux anxiété anxiétés aorte aortes apaiser
apaisé apaisée apaisées apaisés appareil appareils appel appeler appels applaudir appliqué appliquée appliqués
apporter apprendre apprenti apprentis approcher appui appuis appuyer appétit appétits apéritif apéritifs
apôtre apôtres aquarelle aquarium aquariums araignée araignées arbitre arbitres arbre arbres arbuste arbustes
arc arcade arcades arche archer archers arches arcs ardent ardente ardentes ardents ardeur ardeurs ardoise
ardoises ardoisé ardoisée ardoisées ardoisés argent argents argenté argentée argentées argentés argile argiles
argot argots argument arguments aria arias aride arides aridité aridités armature armatures arme armement
armements armes armoire armoires armure armures armé armée armées armés arome aromes arpenteur arracher
arranger arrimer arriver arrivée arrivées arrière arrières arrondi arrondie arrondies arrondis arrosage
arrosages arroser arrosoir arrosoirs arrêt arrêter arrêts arsenal arsenaux art artichaut article articles
articuler artifice artifices artisan artisanal artisane artisanes artisans artiste artistes arts artère
artères arène arènes arête arêtes arôme arômes ascenseur ascension aspect aspects asperge asperges aspic
aspics assainir assaut assauts assemblée asseoir assez assiduité assiette assiettes assis assise assises
assistant assister associé associés assoiffé assoiffée assoiffés assoupli assouplie assouplis assurance assuré
assurée assurées assurés astre astres astronome astucieux atelier ateliers atlas atome atomes atout atouts
atroce atroces attachant attacher attaquer atteindre attelage attelages attendre attentat attentats attente
attenter attentes attentif attentifs attention attentive attirer attiser attitude attitudes attrait attraits
attraper attristé attristée attristés aubaine aubaines aube auberge auberges aubergine aubes aubépine
aubépines audace audaces audacieux audible audibles audition auditions augmenter aulne aulnes aumône aumônes
aurifère aurifères aurore aurores auréole auréoles aussitôt austère austères austérité autant autel autels
auteur auteurs auto autocar autocars automne automnes autorité autorités autoroute autos autrefois autrement
autruche autruches auvent auvents avalanche avaler avance avancer avances avant avantage avantages avants
avare avares avarice avarices avenir avenirs aventure aventures avenue avenues averse averses aversion
aversions avertir aveugle aveugles aviateur aviateurs aviation aviations avide avides avidité avidités avion
avions aviron avirons avis aviser avocat avocats avoine avoines avoir avouer avril avrils avènement axe axes
azote azotes azur azurs aération aérations aérer aéroport aéroports aîné aînée aînées aînés badaud badauds
bagage bagages bagarre bagarres bague bagues baguette baguettes baie baies baignade baignades baigner
baignoire bail bain bains baiser baisers baisser balade balades baladeur baladeurs balafre balafres balai
balais balance balancer balances balayer balayette balayeur balayeurs balcon balcons baleine baleines
baleinier balise baliser balises balle ballerine balles ballet ballets ballon ballons banal banale banales
banals banane bananes banc bancal bancale bancales bancals bancs bande banderole bandes bandit bandits
banlieue banlieues bannir bannière bannières banque banques banquet banquets banquette banquier banquiers
baobab baobabs baptême baptêmes baraque baraques barbe barbes barde bardes baril barils bariolé bariolée
bariolées bariolés baromètre baron baronne baronnes baronnet baronnets barons barque barques barrage barrages
barre barreau barreaux barres barricade barrière barrières bas basalte basaltes base bases basilic basilics
basse basses bassesse bassesses bassin bassine bassines bassins bastion bastions bataille batailles bataillon
bateau bateaux batelier bateliers batiste batistes batterie batteries batteur batteurs baudet baudets baume
baumes baux bavard bavardage bavarde bavarder bavardes bavards bavette bavettes bazar bazars beau beaucoup
beauté beautés beaux bec becs beignet beignets belette belettes belle belles bercail bercails berceau berceaux
bercer berge berger bergers berges bergère bergères berline berlines besace besaces besoin besoins betterave
beurre beurres biais bibelot bibelots biberon biberons biche biches bicorne bicornes bidon bidons bien
bienfait bienfaits biens bientôt bienvenue bijou bijoutier bijoux bilan bilans billard billards bille billes
billet billets biner binette binettes biologie biologies biscuit biscuits bise bises bison bisons bisou bisous
bistrot bistrots bitume bitumes bizarre bizarres blafard blafarde blafardes blafards blague blagues blaireau
blaireaux blanc blanche blanches blancheur blancs blason blasons blesser blessure blessures blessé blessée
blessées blessés bleu bleue bleues bleuet bleuets bleus blinder bloc blocage blocages blocs blond blonde
blondes blondeur blondeurs blonds blouse blouses blouson blousons blé blés blême blêmes boa boas bobine
bobines bocage bocages bocal bocaux boeuf boeufs bohème bohèmes boire bois boiserie boiseries boisson boissons
boisé boisée boisées boisés boite boites boiteux bol bolide bolides bols bombe bombes bon bonbon bonbonne
bonbonnes bonbons bond bondir bonds bonheur bonheurs bonhomme bonne bonnes bonnet bonnetier bonnets bons
bonsoir bonsoirs bonté bontés bord border bordereau bords bordure bordures bordée bordées borne bornes borné
bornée bornées bornés boréal boréaux bosquet bosquets bosse bosses bossu bossue bossues bossus botanique
botaniste botte bottes bottine bottines boucanier bouche boucher boucherie bouchers bouches bouchon bouchons
boucle boucles bouclé bouclée bouclées bouclés bouder boudin boudins boudoir boudoirs boue boues bouffon
bouffons bougeoir bougeoirs bouger bougie bougies bouillant bouillir bouillon bouillons boulanger boule
bouleau bouleaux boules boulet boulets boulevard bouquet bouquetin bouquets bourdon bourdons bourg bourgeon
bourgeons bourgs bourreau bourreaux bourru bourrue bourrues bourrus bourse bourses bousculer boussole
boussoles bout boutade boutades bouteille boutique boutiques bouton boutonner boutons bouts bouée bouées bovin
bovins boxeur boxeurs boîte boîtes bracelet bracelets brader braire brancard brancards branche branches
brandir bras brasier brasiers brasserie bravade bravades bravoure bravoures brebis bref brefs bretelle
bretelles brevet brevets bricolage bricoleur brigade brigades brigand brigands brillance brillant brillante
brillants briller brin brindille brins brioche brioches brique briques briquet briquets brise briser brises
brisé brisée brisées brisés brochet brochets brochette brochure brochures broderie broderies bronze bronzer
bronzes bronzé bronzée bronzées bronzés brosse brosser brosses brouette brouettes brouillon brugnon brugnons
bruit bruits brume brumes brumeuse brumeuses brumeux brun brune brunes bruns brusque brusques brut brutal
brutale brutales brutalité brutaux brute brutes bruts bruyant bruyante bruyantes bruyants bruyère bruyères
brève brèves brûlant brûlante brûlantes brûlants brûler brûlure brûlures buffet buffets buisson buissons bulle
bulles bulletin bulletins buraliste bure bureau bureaux bures buse buses but butin butins buts buvard buvards
buvette buvettes bâtiment bâtiments bâtir bâton bâtons béant béante béantes béants béatitude bébé bébés
bécasse bécasses bélier béliers bénigne bénignes bénin bénins bénéfice bénéfices bénévole bénévoles béquille
béquilles bétail bétails bêche bêches bêler bête bêtes bêtise bêtises bûche bûches cabane cabanes cabine
cabines cabinet cabinets cabriole cabrioles cacao cacaos cachalot cachalots cacher cachet cachets cachette
cachettes cachot cachots cadavre cadavres cadeau cadeaux cadenas cadet cadets cadran cadrans cadre cadres
cafetière café cafés cage cages cahier cahiers cahot cahots caille cailles caillou cailloux caisse caisses
caissette caissier caissiers calamité calamités calciné calcinée calcinées calcinés calcul calculer calculs
calepin calepins calice calices calme calmer calmes calorie calories calot calots camarade camarades camelot
camelots camion camions camomille camp campagne campagnes camper camps camée camées caméléon caméléons
canaille canailles canal canapé canapés canard canards canari canaris canasson canassons canaux cancre cancres
candeur candeurs candidat candidate candidats caneton canetons caniche caniches canicule canicules canif
canifs canine canines canne cannelle cannelles cannes canon canons canot canoter canots canoë canoës cantate
cantates cantine cantines canton cantons capable capables capacité capacités cape capes capitaine capitale
capitales caporal caporaux capote capotes caprice caprices capsule capsules captivant captivité capuche
capuches caqueter carabine carabines caractère carafe carafes caramel caramels carat carats caravane caravanes
caravelle carder cardinal cardinaux caresse caresser caresses cargaison carie caries carillon carillons
cariste caristes carnaval carnavals carnet carnets carnivore carotte carottes carpe carpes carpette carpettes
carreau carreaux carrefour carreler carrière carrières carrosse carrosses carré carrée carrées carrés cartable
cartables carte cartes carton cartons cartouche carène carènes cascade cascades case caserne casernes cases
casier casiers casque casques casquette casser casserole cassette cassettes cassis castel castels castor
castors catalogue cauchemar cause causer causes caution cautions cavalier cavaliers cavalière cave caverne
cavernes caves cavité cavités ceinture ceintures ceinturon cellier celliers cellule cellules cendre cendres
cendré cendrée cendrées cendrés centaine centaines centaure centaures central centrale centrales centraux
centre centres cercle cercles cercueil cercueils cerf cerfs cerise cerises cerisier cerisiers cerne cerner
cernes certain certaine certaines certains certitude cerveau cerveaux chagrin chagrins chaise chaises chaland
chalands chalet chalets chaleur chaleurs chalumeau chambre chambres chameau chameaux chamois champ champion
champions champs chance chances chanceuse chanceux chandail chandails chandelle change changes chanoine
chanoines chanson chansons chant chantant chantante chantants chanter chanteur chanteurs chanteuse chantier
chantiers chantilly chants chaos chaparder chapeau chapeaux chapelet chapelets chapelle chapelles chapiteau
chapitre chapitres charade charades charbon charbons chardon chardons charge charger charges chariot chariots
charité charités charlatan charmant charmante charmants charme charmer charmes charnier charniers charnière
charnu charnue charnues charnus charpente charrette charrue charrues chasse chasser chasses chasseur chasseurs
chat chaton chatons chats chaud chaude chaudes chaudière chaudron chaudrons chauds chauffer chauffeur
chaumière chaussure chaussée chaussées chauve chauves chaîne chaînes chef chefs chemin cheminot cheminots
chemins cheminée cheminées chemise chemises chenal chenaux chenil chenille chenilles chenils cher chercher
chers cheval chevalet chevalets chevalier chevaux chevelu chevelue chevelues chevelure chevelus cheveu cheveux
chevreau chevreaux chevreuil chic chics chien chienne chiennes chiens chiffon chiffons chiffre chiffres chimie
chimies chimiste chimistes chimère chimères chiner chinois chinoise chinoises chiot chiots chocolat chocolats
choeur choeurs choisir choix chorale chorales chose choses chou chouchou chouchous chouette chouettes choux
choyer chrétien chrétiens chuchoter chute chutes châtaigne château châteaux chèque chèques chère chères chèvre
chèvres chétif chétifs chétive chétives chêne chênes cible cibles cidre cidres ciel ciels cierge cierges
cigale cigales cigare cigares cigarette cigogne cigognes cil cils cime ciment ciments cimes cimetière cintrer
cintré cintrée cintrées cintrés cinéma cinémas cirage cirages circuit circuits circuler cirque cirques ciré
cirée cirées cirés ciseau ciseaux citadelle citadin citadine citadines citadins citation citations citer
citerne citernes citoyen citoyenne citoyens citron citrons cité cités civette civettes civil civile civiles
civils civière civières clair claire claires clairière clairon clairons clairs clarté clartés classe classer
classes classique clavier claviers clef clefs client clients climat climats clinique cliniques cloche clocher
clochers cloches cloison cloisons clou clouer clous clown clowns clé clément clémente clémentes cléments clés
clôture clôtures cobaye cobayes cocher cochers cochon cochonnet cochons cocotier cocotiers code codes coeur
coeurs coffre coffres cognac cognacs coiffer coiffeur coiffeurs coiffeuse coiffure coiffures coin coing coings
coins col colimaçon colis collation colle coller colles collier colliers colline collines collège collèges
collègue collègues colombe colombes colonel colonels colonie colonies colonne colonnes coloriage colorier
coloré colorée colorées colorés colosse colosses cols colère colères combat combats combattre combien commande
commander commandes commencer comment commerce commerces commode commodes commun commune communes communs
compagnie compagnon comparer compas complet complets compliqué complète complètes compléter compote compotes
compte compter comptes compteur compteurs comptoir comptoirs comtesse comtesses comète comètes comédie
comédien comédiens comédies concert concerts concierge concombre concours concret concrets concrète concrètes
condition conduire confiance confiant confiante confiants confiture conflit conflits confondre confort
conforts confus confuse confuses congé congés connaître conquête conquêtes conseil conseils conserve conserves
console consoles consonne consonnes constant constante constants conte content contente contentes contents
contenu contenus conter contes continent continu continue continuer continues continus contraire contrat
contrats contrôle contrôles copain copains copie copier copies copine copines coq coqs coquelet coquelets
coquille coquilles corail coraux corbeau corbeaux corde cordes cordon cordons coriace coriaces coriandre corne
cornemuse cornes cornet cornets cornette cornettes cornichon cornu cornue cornues cornus corolle corolles
corps correct correcte correctes corrects corridor corridors corriger corsaire corsaires cortège cortèges
corvée corvées costaud costaude costaudes costauds costume costumes coter cotillon cotillons coton cotonnade
cotonneux cotons cou couard couards couche coucher couches couchette coude coudes coudre couler couleur
couleurs coulisse coulisses couloir couloirs coulée coulées coup coupable coupables coupe couper coupes couple
couples coups cour courage courages courageux courant courante courantes courants courbe courber courbes
coureur coureurs courir couronne couronnes courrier courriers cours course courses coursier coursiers court
courte courtes courtois courtoise courts cous cousin cousine cousines cousins coussin coussins couteau
couteaux coutume coutumes couture coutures couturier couvent couvents couvercle couvert couverte couvertes
couverts couvrir coûteuse coûteuses coûteux crabe crabes craie craies craindre crainte craintes cramoisi
cramoisie cramoisis crampe crampes cran crans crapaud crapauds crasse crasses cratère cratères cravate
cravates crayon crayons cresson cressons creuse creuses creuset creusets creux crever crevette crevettes cri
crier crinière crinières crinoline cris cristal cristaux critique critiques crochet crochets crocodile croire
croiser croisière croissant croix croquer croquette croûte croûtes cru cruauté cruautés crue cruel cruelle
cruelles cruels crues crus crâne crâner crânes crèche crèches crème crèmes créatif créatifs création créations
créative créatives créature créatures crédit crédits crédule crédules créer crénelure crénelé crénelée
crénelées crénelés crépine crépines crétin crétins crêpe crêpes crête crêtes cube cubes cueillir cuillère
cuillères cuir cuirasse cuirasser cuirasses cuire cuirs cuisine cuisiner cuisines cuisinier cuisse cuisses
cuisson cuissons cuistot cuistots cuit cuite cuites cuits cuivre cuivres cuivré cuivrée cuivrées cuivrés
culotte culottes cultivé cultivée cultivées cultivés culture cultures cure curer cures curieuse curieuses
curieux curiosité curé curés cuve cuves cuvette cuvettes cuvée cuvées cycliste cyclistes cyclone cyclones
cygne cygnes câble câbles câlin câline câlines câlins cèdre cèdres céder céleri céleris céleste célestes
célèbre célèbres célébrité célérité célérités céréale céréales cérémonie césure césures côte côtelette côtes
côtier côtiers côté côtés dahlia dahlias daigner dais dalle dalles dame damer dames danger dangereux dangers
danse danser danses danseur danseurs danseuse danseuses dard dards darne darnes date dater dates datte dattes
dauphin dauphins davantage debout deboute deboutes debouts dedans degré degrés dehors demain demande demander
demandes demeure demeures denier deniers denrée denrées dense denses dent dentaire dentaires dentelle
dentelles dentelé dentelée dentelées dentelés dentier dentiers dentiste dentistes dents dernier derniers
dernière dernières descendre descente descentes dessein desseins dessert desserts dessin dessiner dessins
dessous dessus destin destins destinée destinées dette dettes deuil deuils devant devants devenir deviner
devinette devise devises devoir devoirs diable diables diadème diadèmes dialogue dialogues diamant diamants
diapason diapasons dictateur diction dictions dictée dictées dieu dieux difficile digne dignes digue digues
dilater diligence diluer dimanche dimanches dimension dinde dindes dindon dindons diner diners dinette
dinettes dinosaure diplôme diplômes dire direct directe directes directeur direction directs diriger discours
discret discrets discrète discrètes discuter dispute disputes disque disques disserter distance distances
distant distante distantes distants distrait distraite distraits divan divans divers diverse diverses divin
divine divines divinité divinités divins diète diètes docile dociles docteur docteurs doctrine doctrines
document documents doigt doigts domaine domaines domicile domiciles domino dominos dompteur dompteurs don
donjon donjons donner dons dorade dorades dormir dortoir dortoirs dorure dorures doré dorée dorées dorés dos
dossier dossiers dot doter dots douane douanes douanier douaniers doubler douce doucement douces douceur
douceurs douche douches douleur douleurs doute douter doutes douve douves doux douzaine douzaines dragon
dragons dragée dragées drain drains drap drapeau drapeaux draps dresser drille drilles droit droite droites
droits droiture droitures drôle drôles dune dunes dur durable durables durant durcir dure durer dures dureté
duretés durillon durillons durs durée durées duvet duvets débarras débat débats débit débits déborder débris
début débuts décembre décembres décider décidé décidée décidées décidés décision décisions déclarer décor
décors découper découvrir décrire défaut défauts défendre défense défenses déguster dégât dégâts déjeuner
déjeuners déjà délai délais délicat délicate délicates délicats délice délices délicieux délire délires déluge
déluges délégué délégués démarche démarches démolir démon démons déménager dénoter départ départs dépasser
dépense dépenser dépenses déplacer déposer député députés déranger dérapage dérapages dérouler désastre
désastres désert déserte désertes déserts désespoir désir désirer désirs désolé désolée désolées désolés
désordre désordres désormais détail détaillé détaillée détaillés détails détective détenir détenteur détenu
détenue détenues détenus détester détourner détresse détresses dévorer dîme dîmes dîner dîners eau eaux
effacer effet effets effort efforts effrayant effrayer embarras embrasser embuscade emmener empereur empereurs
empire empires emploi emplois employer employé employée employées employés emporter emprunt emprunter emprunts
encens enchanté enchantée enchantés enchère enchères enclos encolure encolures encre encres encrier encriers
endormi endormie endormies endormir endormis endroit endroits enduit enduits enfance enfances enfant enfants
enfer enfermer enfers enfiler enfin engin engins engrenage enjeu enjeux enlever ennemi ennemis ennui ennuis
ennuyer enquête enquêtes enragé enragée enragées enragés enrouler enseigne enseigner enseignes ensemble
ensembles ensuite entasser entendre entente ententes enterrer entier entiers entière entières entonner
entonnoir entorse entorses entourer entrain entrains entrepôt entrepôts entrer entretien entrée entrées entêté
entêtée entêtées entêtés envahir enveloppe envie envies environ envol envols envoyer ermitage ermitages ermite
ermites errer erreur erreurs escadre escadres escalade escalades escale escales escalier escaliers escargot
escargots esclave esclaves escrime escrimes espace espaces espadon espadons espagnol espagnole espagnols
espion espionne espionnes espions espoir espoirs esprit esprits espèce espèces espérance espérer esquimau
esquimaux essai essaim essaims essais essayer essence essences essentiel essor essors essuyer est estimer
estomac estomacs estrade estrades ests européen européens exact exacte exactes exacts examen examens examiner
excellent excessif excessifs excessive excuse excuses exemple exemples exercice exercices exigence exigences
exil exils exister expliquer exploit exploits exprès exquis exquise exquises extrémité fable fables fabricant
fabriquer fabuleuse fabuleux face faces facile faciles facilité facilités facteur facteurs factrice factrices
faible faibles faillite faillites faim faims faire faisan faisans falaise falaises fameuse fameuses fameux
familier familiers familière famille familles fanal fanaux faner fanfare fanfares fantaisie fantôme fantômes
farandole farceur farceurs farcir fardeau fardeaux farine farines farouche farouches fatal fatale fatales
fatals fatigue fatiguer fatigues fatigué fatiguée fatiguées fatigués faucon faucons fausse fausses faute
fautes fauteuil fauteuils fautif fautifs fautive fautives fauve fauves faux favorable favori favoris favorite
favorites façade façades faîte faîtes faïence faïences femme femmes fenaison fenaisons fenouil fenouils fente
fentes fenêtre fenêtres fer ferme fermer fermes fermeture fermier fermiers fermière fermières ferraille ferrer
ferrure ferrures fers fertile fertiles festin festins festival festivals festivité feston festons feu
feuillage feuille feuilles feutre feutres feux fiancé fiancée fiancées fiancés ficelle ficelles fidèle fidèles
fidélité fidélités fiel fiels fier fiers figure figures figé figée figées figés fil filature filatures file
filer files filet filets fille filles filleul filleule filleules filleuls film films fils fin final finale
finales finals fine fines finesse finesses finir fins fiole fioles fixe fixes fière fières fièvre fièvres
flacon flacons flairer flamant flamants flambeau flambeaux flamme flammes flan flanc flancs flans flaque
flaques flatteur flatteurs flatteuse fleur fleuret fleurets fleuri fleurie fleuries fleurir fleuris fleuriste
fleurs fleuve fleuves flexible flexibles flocon flocons flore flores florin florins flot flots flotter
flottille fluide fluides fluor fluors flânerie flâneries flèche flèches flûte flûtes foin foins foire foires
fois folie folies folklore folklores folle folles fond fondateur fonder fondre fonds fondu fondue fondues
fondus fontaine fontaines fonte fontes forain forains force forces forer forestier forge forger forgeron
forgerons forges forme former formes formule formules fort forte fortes fortin fortins forts fortune fortunes
forçat forçats forêt forêts fosse fosses fossile fossiles fossé fossés fou foudre foudres fouet fouets fougère
fougères fouille fouilles fouine fouines foulard foulards foule foules foulée foulées four fourche fourches
fourmi fourmis fourneau fourneaux fournir fourreau fourreaux fourrière fourrure fourrures fours fous foyer
foyers fracas fraction fractions fragile fragiles fragment fragments frais fraise fraises framboise franc
franche franches franchise francs français française frapper fraîche fraîches fraîcheur fredaine fredaines
frein freins frelon frelons fresque fresques friandise frileuse frileuses frileux fripon fripons frisson
frissons frisé frisée frisées frisés frite frites friture fritures froid froide froides froideur froideurs
froids froissé froissée froissées froissés fromage fromager fromagers fromages fronde frondes front frontière
fronts frotter fruit fruitier fruitiers fruits frère frères frégate frégates fréquence fréquent fréquente
fréquents fréter frêne frênes fugace fugaces fugitif fugitifs fuir fumier fumiers fumée fumées furet furets
fureur fureurs furieuse furieuses furieux fusain fusains fuser fusil fusils fusée fusées futaie futaies futur
future futures futurs futé futée futées futés fâcher fâché fâchée fâchées fâchés fève fèves fécond féconde
fécondes fécondité féconds fée féerie féeries fées félicité félicités féminin féminins féroce féroces février
févriers fêlé fêlée fêlées fêlés fêtard fêtards fête fêter fêtes fût fûts gagner gai gaie gaies gaieté gaietés
gais galant galante galantes galants galerie galeries galet galets galette galettes galopin galopins gamelle
gamelles gamin gamine gamines gamins gamme gammes gant gants garage garages garantie garanties garde garder
gardes gardien gardienne gardiens gare garenne garennes garer gares garnir garnison garnisons garrot garrots
garçon garçons gaspiller gauche gauches gaule gaules gazelle gazelles gazon gazonné gazonnée gazonnées
gazonnés gazons gaîté gaîtés geler gelé gelée gelées gelés gencive gencives gendarme gendarmes gendre gendres
genièvre genièvres genou genoux genre genres gens gentil gentille gentilles gentils gentiment gerbe gerbes
germe germes geste gestes gibier gibiers gilet gilets girafe girafes gitan gitans givré givrée givrées givrés
glace glaces glacial glaciale glaciales glaciaux glacé glacée glacées glacés glaise glaises gland glands
glaneur glaneurs glas glaçon glaçons glissade glissades glissant glissante glissants glisser global globale
globales globaux globe globes globule globules gloire gloires glorieuse glorieux glycine glycines gnome gnomes
gobelet gobelets golfe golfes gomme gommes gondole gondoles gonfler gonflé gonflée gonflées gonflés gorge
gorges gorgée gorgées gorille gorilles gouache gouaches goudron goudrons gouffre gouffres goujon goujons
goulot goulots gourde gourdes gourmand gourmande gourmands gousse gousses goutte gouttes gouttière goéland
goélands goût goûter goûts gracieuse gracieux gradin gradins grain graine graines grains grammaire grand
grande grandes grandeur grandeurs grandir grands grange granges granit granite granites granits granuleux
grappe grappes gras grasse grasses gratitude gratter gratuit gratuite gratuites gratuits grave graves gravier
graviers gravir gravure gravures greffe greffes grenade grenades grenadier grenier greniers griffe griffer
griffes grille grilles grillon grillons grimace grimaces grimoire grimoires grimper grincheux griotte griottes
gris grisaille grise grises grogner gronder gros grosse grosses grossesse grossier grossiers grossir grossière
grotte grottes groupe groupes grue grues gruyère gruyères grâce grâces grès grêle grêles guenon guenons guerre
guerres guerrier guerriers guetter guetteur guetteurs guichet guichets guide guider guides guirlande guise
guises guitare guitares guépard guépards guérir guêpe guêpes gymnase gymnases gâteau gâteaux géant géante
géantes géants génial géniale géniales géniaux génie génies général généraux généreuse généreux géomètre
géomètres géométrie gérer gêner gîte gîtes habile habiles habileté habiletés habiller habit habitant habitants
habiter habits habitude habitudes habituel habituels hache haches haie haies halage halages haleine haleines
halte haltes haltère haltères hamac hamacs hameau hameaux hamster hamsters hanche hanches hangar hangars
hanneton hannetons hanter hardi hardie hardies hardis hareng harengs hargneuse hargneux haricot haricots
harmonie harmonies harnais harpe harpes harpon harpons hasard hasards hase hases haut hautain hautaine
hautaines hautains haute hautes hauteur hauteurs hauts herbe herbes herbier herbiers herbivore heure heures
heureuse heureuses heureux heurt heurts hibou hiboux hideuse hideuses hideux hier histoire histoires historien
hiver hivers hochet hochets hommage hommages homme hommes hongrois honneur honneurs honnête honnêtes honorable
honte hontes horaire horaires horizon horizons horloge horloger horlogers horloges horreur horreurs horrible
horribles hostile hostiles hotte hottes houle houles houx hublot hublots huile huiler huiles huissier
huissiers humain humaine humaines humains humanité humanités humble humbles humeur humeurs humide humides
humidité humidités humour humours hune hunes hurlement hurler hutte huttes huître huîtres hygiène hygiènes
hymne hymnes hypothèse hélice hélices hérisson hérissons héritage héritages hériter héritier héritiers héron
hérons héros héroïne héroïnes hérésie hérésies hésiter hêtre hêtres hôpital hôpitaux hôtel hôtels hôtesse
hôtesses ici icône icônes identique idiot idiots idole idoles idéal idéale idéales idéaux idée idées ignorance
ignorant ignorante ignorants ignorer illusion illusions illustre illustres image images imaginer imbécile
imbéciles imiter immense immenses immensité immeuble immeubles immobile immobiles impatient impoli impolie
impolies impolis important imprudent incendie incendies incertain incident incidents inconnu inconnue
inconnues inconnus indien indienne indiennes indiens indigne indignes industrie infini infinie infinies
infinis infirmier inné innée innées innés inodore inodores inonder inquiet inquiets inquiète inquiètes insecte
insectes insensé insensée insensées insensés insister insolent insolente insolents instant instants instaurer
instinct instincts instruit instruite instruits insérer intense intenses intention interner intrigue intrigues
intrus intuition intérieur intérêt intérêts inutile inutiles inventer inventeur invention invisible inviter
invité invités iris irriter irrité irritée irritées irrités isard isards isoler isolé isolée isolées isolés
italien italienne italiens ivoire ivoires ivraie ivraies ivre ivres ivresse ivresses jachère jachères jadis
jaguar jaguars jaillir jalouse jalouses jalousie jalousies jaloux jamais jambe jambes jambon jambons jante
jantes jardin jardinage jardiner jardinier jardins jarret jarrets jars jasmin jasmins jaune jaunes javelot
javelots jeter jeton jetons jetée jetées jeu jeudi jeudis jeune jeunes jeunesse jeunesses jeux joaillier joie
joies joli jolie jolies jolis jongleur jongleurs jonquille joue jouer joues jouet jouets joueur joueurs
joueuse joueuses jour journal journaux journée journées jours joute joutes joyeuse joyeuses joyeux jubilé
jubilés juge juger juges juillet juillets juin juins jumeau jumeaux jumelle jumelles jument juments jungle
jungles jupe jupes jupon jupons jurer juriste juristes jury jurys jus juste justement justes justice justices
kangourou kilo kilomètre kilos kiosque kiosques labeur labeurs lac lacet lacets lacs lacté lactée lactées
lactés lai laid laide laides laids lainage lainages laine laines laineuse laineuses laineux lais laisse
laisser laisses lait laitage laitages laitier laitiers laiton laitons laits laitue laitues lambeau lambeaux
lame lamenter lames lampe lampes lampion lampions lance lancement lancer lances lancinant landau landaus lande
landes langage langages langouste langue langues lanière lanières lanterne lanternes lapereau lapereaux lapin
lapins larcin larcins larder lardon lardons large larges largeur largeurs larme larmes larron larrons larve
larves las lassant lassante lassantes lassants lasse lasser lasses latin latine latines latins latitude
latitudes latrine latrines latte lattes laurier lauriers lauréat lauréats lavabo lavabos lavage lavages
lavande lavandes laver lavoir lavoirs layette layettes lecteur lecteurs lecture lectures lendemain lent lente
lentement lentes lenteur lenteurs lents lessive lessives lest lests lettre lettres lettré lettrée lettrées
lettrés lever levier leviers leçon leçons liaison liaisons liane lianes liant liants libellule liberté
libertés libraire libraires librairie libre libres libéral libérale libérales libéraux libérer lice lices
licorne licornes lien liens lier lierre lierres lieu lieue lieues lieux ligne lignes lilas limace limaces
limaçon limaçons lime limer limes limite limites limité limitée limitées limités limonade limonades linge
linges linotte linottes linéaire linéaires lion lionceau lionceaux lionne lionnes lions liqueur liqueurs
liquide liquides lire lires liseron liserons lisse lisser lisses liste listes lit litanie litanies litière
litières litre litres lits littoral littoraux livraison livre livrer livres livret livrets lièvre lièvres
local locale locales locataire locaux logement logements loger logique logiques logis loi loin lointain
lointaine lointains loir loirs lois loisir loisirs long longitude longs longtemps longue longues longueur
longueurs losange losanges lot loterie loteries lotion lotions lots lotus louange louanges louer loup loupe
louper loupes loups lourd lourde lourdes lourds loutre loutres louve louves louveteau loyal loyale loyales
loyauté loyautés loyaux lucarne lucarnes lucide lucides lueur lueurs luge luges luisant luisante luisantes
luisants lumignon lumignons luminaire lumineuse lumineux lumière lumières lunaire lunaires lunaison lunaisons
lundi lundis lune lunes lunette lunettes luron lurons lustre lustrer lustres lutin lutins lutrin lutrins lutte
lutter luttes lutteur lutteurs luxe luxes lycée lycées lâcher lèvre lèvres légende légendes léger légers
légume légumes légère légères léser lévrier lévriers lézard lézards macaron macarons machine machines madame
madeleine magasin magasins magazine magazines magicien magiciens magie magies magique magiques magnolia
magnolias maigre maigres maigreur maigreurs maigrir maillot maillots main mains maire maires mairie mairies
maison maisons majesté majestés majeur majeure majeures majeurs majorité majorités mal malade malades maladie
maladies maladroit malaise malaises malchance malgré malheur malheurs malice malices maligne malignes malin
malins malle malles mallette mallettes malpoli malpolie malpolies malpolis maman mamans mammifère manade
manades manche manches manchot manchots mandarine manette manettes mangeoire manger mangers mangue mangues
maniaque maniaques manie manies manivelle manière manières mannequin manoir manoirs manquer mante manteau
manteaux mantes manuscrit manège manèges maquereau maquette maquettes marabout marabouts marais marathon
marathons marbre marbres marbrier marbriers marbré marbrée marbrées marbrés marchand marchande marchands
marche marcher marches marché marchés mardi mardis mare marelle marelles mares margarine mari mariage mariages
marier marin marine marines marins maris marmelade marmite marmites marmiton marmitons marmot marmots marmotte
marmottes marque marques marquis marquise marquises marraine marraines marron marrons mars marteau marteaux
martinet martinets martyr martyrs marécage marécages maréchal maréchaux marée marées mascarade mascotte
mascottes masque masques masse masses massue massues masure masures matelas matelot matelote matelotes
matelots mater maternel maternels matin matins matinée matinées matière matières matou matous maturité
maturités mausolée mausolées mauvais mauvaise mauvaises mauve mauves maux maçon maçons maître maîtres
maîtresse meilleur meilleure meilleurs melon melons membrane membranes membre membres menace menaces mendiant
mendiants mener mensonge mensonges mental mentale mentales mentaux menteur menteurs menteuse menteuses menthe
menthes mentir menton mentons menu menuisier menus mer merci mercis mercredi mercredis meringue meringues
merlan merlans merle merles mers merveille mesdames message messager messagers messages messieurs mesure
mesurer mesures mettre meuble meubles meunier meuniers meunière meunières meurtre meurtres meute meutes
miauler microbe microbes midi midis miel miels miette miettes mignon mignonne mignonnes mignons migration
milan milans milieu milieux militaire militant militants mille milles millier milliers million millions mimosa
mimosas mince minces mine miner minerai minerais mines minet minets minette minettes ministre ministres
minorité minorités minuit minuits minuscule minute minutes minéral minérale minérales minéraux mirabelle
miracle miracles mirage mirages mirer miroir miroirs missile missiles mission missions misère misères
misérable mite mites mobile mobiles mobilier mobiliers mode moderne modernes modes modeste modestes modestie
modesties moduler modèle modèles moelle moelles moelleuse moelleux moineau moineaux moire moires moisir
moisson moissons moitié moitiés molaire molaires molle molles mollet mollets mollusque moment moments monarque
monarques monastère monde mondes monnaie monnaies monologue monsieur monstre monstres mont montagne montagnes
montant montants monter montre montrer montres monts monument monuments moquerie moqueries moquette moquettes
moralité moralités morceau morceaux mordre morsure morsures mort mortel mortelle mortelles mortels mortier
mortiers morts morue morues mosaïque mosaïques mosquée mosquées mot motard motards moteur moteurs motif motifs
moto motos mots motte mottes mou mouche mouches mouchoir mouchoirs moudre mouette mouettes mouffette moufle
moufles mouillé mouillée mouillées mouillés moule moules moulin moulins mourant mourante mourantes mourants
mourir mouron mourons mous mousse mousses moustache moustique moutarde moutardes mouton moutons mouvement
moyen moyens muet muets muette muettes muguet muguets muletier muletiers mulot mulots munition munitions mur
muraille murailles muret murets murmure murmures murs muscade muscades muscle muscles musette musettes
musicien musiciens musique musiques musée musées mutation mutations muter mutin mutins myrtille myrtilles
mystère mystères mythe mythes mâchoire mâchoires mâle mâles mât mâts mère mères mètre mètres méandre méandres
mécanique mécanisme méchant méchante méchantes méchants médaille médailles médaillon médecin médecine
médecines médecins médiateur médiocre médiocres méduse méduses mélange mélanger mélanges mélisse mélisses
mélodie mélodies mémoire mémoires ménage ménagerie ménages méridien méridiens mérinos mérite mériter mérites
mésange mésanges métal métaux méthode méthodes métier métiers métro métros météore météores météorite mûr mûre
mûres mûrir mûrs nacre nacres nage nager nages nageur nageurs naguère naine naines naissance nappe nappes
narine narines narrateur narration narrer nasal nasale nasales nasaux natal natale natales natals natation
natations natte natter nattes nature naturel naturelle naturels natures naufrage naufrages navet navets
navette navettes navire navires naître naïf naïfe naïfes naïfs naïveté naïvetés nectar nectarine nectars neige
neiger neiges neigeuse neigeuses neigeux nerf nerfs nerveuse nerveuses nerveux nervure nervures net nets nette
nettes nettoyer neuf neufs neutre neutres neuve neuves neveu neveux nez nid nids nitrate nitrates niveau
niveaux niveler nièce nièces noble nobles noblesse noblesses noce noces nocif nocifs nocive nocives nocturne
nocturnes noeud noeuds noir noirceur noirceurs noircir noire noires noirs noisette noisettes noix nom nomade
nomades nombre nombres nombreuse nombreux nommer noms nord nords noria norias normal normale normales normaux
nostalgie notable notables notaire notaires notation notations note noter notes notion notions notoire
notoires nouer nounou nounous nourrir nouveau nouveauté nouveaux nouvelle nouvelles novembre novembres noyer
nu nuage nuages nuageuse nuageuses nuageux nuance nuances nudité nudités nue nues nuire nuisance nuisances
nuit nuits nul nulle nulles nuls numéro numéros nus nuée nuées néant néants nécessité négligent négociant
nénuphar nénuphars néon néons oasis objectif objectifs objet objets obliger obole oboles obscur obscure
obscures obscurité obscurs observer obstacle obstacles obstiné obstinée obstinées obstinés obtenir obéir
obéissant obélisque occasion occasions occuper occupé occupée occupées occupés ocre ocres octobre octobres
océan océans odeur odeurs odorant odorante odorantes odorants oeil oeillet oeillets oeuf oeufs oeuvre oeuvres
offense offenses office offices officiel officiels offrande offrandes offrir ogive ogives ogre ogres oie oies
oignon oignons oindre oiseau oiseaux oiseleur oiseleurs oisif oisifs oisive oisives olive olives olivette
olivettes olivier oliviers olivâtre olivâtres ombragé ombragée ombragées ombragés ombre ombrelle ombrelles
ombres omelette omelettes oncle oncles onde ondes ondine ondines ondée ondées ongle ongles onéreuse onéreuses
onéreux opale opales opaque opaques opinion opinions opération or orage orages oral orale orales orange
orangeade oranger orangerie orangers oranges orateur orateurs oratoire oratoires oraux orchestre orchidée
orchidées ordinaire ordre ordres ordure ordures oreille oreiller oreillers oreilles orfèvre orfèvres organe
organes orgue orgueil orgueils orgues orient orienter orients original originale originaux origine origines
orme ormes ornement ornements orner ornière ornières orné ornée ornées ornés orphelin orpheline orphelins ors
orteil orteils ortie orties orée orées os oser osier osiers ossature ossatures osseuse osseuses osseux otage
otages otarie otaries otite otites ouate ouates oublier oublié oubliée oubliées oubliés ouest ouests ouistiti
ouistitis ouragan ouragans ourlet ourlets ours ourse ourses outarde outardes outil outils ouvert ouverte
ouvertes ouverts ouverture ouvrage ouvrages ouvreuse ouvreuses ouvrier ouvriers ouvrir ouvrière ouvrières
ovale ovales pagaie pagaies page pages paillasse paille pailles paillette pain pains paire paires paisible
paisibles palais paletot paletots palette palettes palier paliers palissade palmarès palmier palmiers palourde
palourdes pancarte pancartes panier paniers panne panneau panneaux pannes panorama panoramas panse pansement
panses pantalon pantalons panthère panthères pantin pantins pantoufle paon paons papa papas papeterie papetier
papetiers papier papiers papillon papillons paquet paquets parachute parade parades paradis parapluie parasol
parasols paravent paravents paraître parc parchemin parcs pardessus pardon pardonner pardons pareil pareille
pareilles pareils parent parents parer paresse paresses paresseux parfait parfaite parfaites parfaits parfois
parfum parfums pari parier paris parler parloir parloirs paroisse paroisses parole paroles parquet parquets
parrain parrains parsemer part partager parterre parterres partie parties partir partition partout parts pas
passage passager passagers passages passagère passer passion passions passoire passoires passé passés pastel
pastels pastille pastilles pastèque pastèques paternel paternels paternité patience patiences patient patiente
patientes patients patiner patineur patineurs patinoire patois patrie patries patron patronne patronnes
patrons patte pattes paume paumes paupière paupières pause pauses pauvre pauvres pavillon pavillons pavé pavés
payer pays paysage paysages paysan paysans peau peaux peigne peigner peignes peignoir peignoirs peindre peine
peines peint peinte peintes peintre peintres peints peinture peintures peiné peinée peinées peinés pelle
pelles pelote pelotes pelouse pelouses penché penchée penchées penchés pendant penderie penderies pendule
pendules penser pensif pensifs pension pensions pensive pensives pensée pensées pente pentes percer perceuse
perceuses perche perches perdition perdre perdreau perdreaux perdrix perdu perdue perdues perdus perle perles
perlé perlée perlées perlés permanent permettre perron perrons perroquet perruque perruques persienne persil
persils personne personnes perte pertes pervenche peser peste pestes petit petite petites petits peuplade
peuplades peuple peuples peuplier peupliers peur peureuse peureuses peureux peurs phalène phalènes pharaon
pharaons phare phares pharmacie photo photos phrase phrases phénomène pianiste pianistes piano pianos pichet
pichets pied pieds pierre pierres pierrot pierrots pieuse pieuses pieuvre pieuvres pieux pigeon pigeons pile
piles pilier piliers pillage pillages piller pilon pilons pilote piloter pilotes pilule pilules pimbêche
pimbêches pin pince pinceau pinceaux pinces pingouin pingouins pins pinson pinsons pinte pintes pioche pioches
piolet piolets pionnier pionniers pipe pipelette pipes piquant piquante piquantes piquants pique piquer piques
piquet piquets piqûre piqûres pirate pirates pire pires pirogue pirogues piscine piscines pistache pistaches
piste pistes pistil pistils pistolet pistolets piston pistons pitié pitiés pitre pitres pièce pièces piège
pièges piéton piétons placard placards place placement placer places plafond plafonds plage plages plaie
plaies plaindre plaine plaines plainte plaintes plaire plaisir plaisirs plan planche plancher planchers
planches planer plans plante planter plantes planète planètes plaque plaques plat platane platanes plate
plateau plateaux plates platine platines plats plein pleine pleines pleins pleur pleurer pleurs pleuvoir pli
plier plis plissé plissée plissées plissés plomb plombier plombiers plombs plonger plongeur plongeurs pluie
pluies plumage plumages plume plumeau plumeaux plumer plumes plumier plumiers plusieurs pluvieuse pluvieux
plâtre plâtres plénitude pneu pneus poche poches pochette pochettes poids poignard poignards poignée poignées
poil poils poing poings point pointe pointes pointillé points pointu pointue pointues pointure pointures
pointus poinçon poinçons poire poireau poireaux poires pois poison poisons poisson poissons poitrine poitrines
poivre poivres poivron poivrons polaire polaires poli police polices polie polies polir polis politesse
politique pollen pollens pollution pommade pommades pomme pommes pommier pommiers pompe pomper pompes pompier
pompiers pompon pompons pont ponton pontons ponts populaire porc porcelet porcelets porche porches porcs port
portail portails porte porter portes porteur porteurs portion portions portière portières portrait portraits
ports poser possible possibles posséder poste poster postes posture postures pot potable potables potage
potager potagers potages poteau poteaux potence potences poterie poteries potier potiers potine potines
potiron potirons pots pou poubelle poubelles pouce pouces poudre poudres poulain poulains poularde poulardes
poule poules poulet poulets poumon poumons poupon poupons poupée poupées pourboire pourpre pourpres pourquoi
pourri pourrie pourries pourris poursuite pourtant pousser poussette poussin poussins poussière poutre poutres
pouvoir pouvoirs poux poème poèmes poète poètes poésie poésies poêle poêles prairie prairies pratique
pratiques premier premiers première premières prendre presque pression pressions prestige prestiges preuve
preuves prier prieur prieurs prieuré prieurés primeur primeurs primevère prince princes princesse principal
principe principes printemps priorité priorités prison prisons privé privée privées privés prix prière prières
problème problèmes prochain prochaine prochains procureur prodige prodiges produire produit produits prof
profit profiter profits profond profonde profondes profonds profs programme progrès projet projets promenade
promener promeneur promesse promesses promettre prononcer prophète prophètes proposer propre propres propreté
propretés propriété protéger proverbe proverbes province provinces provision prudence prudences prudent
prudente prudentes prudents prune prunelle prunelles prunes pré précieuse précieux précipice précis précise
précises prédateur préface préfaces préférer prélat prélats prénom prénoms préparer prés présence présences
présent présente présenter présentes présents président prétexte prétextes prévenir prêt prête prêter prêtes
prêtre prêtres prêts public publicité publics publique publiques puce puces pudeur pudeurs puiser puisque
puissance puits pull pulls puma pumas punir punition punitions pupitre pupitres pur pure pures purin purins
purs purée purées pyjama pyjamas pyramide pyramides pâle pâles pâlir pâte pâtes pâteuse pâteuses pâteux
pâtissier pâtre pâtres pâturage pâturages pâtée pâtées pèlerin pèlerins père pères pélican pélicans péniche
péniches péninsule pénombre pénombres pépin pépins pépite pépites péril périls période périodes pétale pétales
pétard pétards pétillant pétrin pétrins pétrir pétrole pétroles pétunia pétunias pêche pêcher pêches pêcheur
pêcheurs pôle pôles quai quais qualité qualités quantité quantités quartier quartiers querelle querelles
question questions queue queues quiche quiches quille quilles quintal quintaux quitter quotidien quête quêtes
rabot rabots racaille racailles race races racine racines raconter racé racée racées racés radar radars rade
radeau radeaux rades radiateur radio radios radis rafale rafales rage rages raideur raideurs raie raies
rainette rainettes rainure rainures raisin raisins raison raisons rallonge rallonges ramage ramages ramasser
rame rameau rameaux rames ramoneur ramoneurs rampe rampes rancune rancunes randonnée rang ranger rangs rangée
rangées rançon rançons rapace rapaces rapide rapides rapidité rapidités rapière rapières rappeler rapport
rapports raquette raquettes rare rarement rares rasade rasades raser rasoir rasoirs rassasié rassasiée
rassasiés rassurant rassurer rat rateau rateaux rater ration rations rats rature ratures rauque rauques ravi
ravie ravies ravin ravine ravines ravins ravis rayer rayon rayons rayure rayures rayé rayée rayées rayés
rebelle rebelles rebord rebords rebut rebuts recette recettes recevoir recherche record records recrue recrues
rectangle recteur recteurs recueil recueils redingote reflet reflets refuge refuges refuser regain regains
regard regarder regards regret regrets reine reines relater relation relations relier religieux religion
religions reliure reliures remarque remarquer remarques remercier remorque remorques rempart remparts
remplacer rempli remplie remplies remplir remplis remuer remède remèdes renard renards rencontre rendement
rendez rendre renfort renforts renier renne rennes renommée renommées renouée renouées rente renter rentes
rentrer rentrée rentrées repaire repaires repas repasser repos reposer reposé reposée reposées reposés
reproche reproches reptile reptiles repu repue repues repus repère repères requin requins respect respects
respirer ressort ressortir ressorts ressource reste rester restes retard retards retenir retenter retirer
retour retourner retours retraite retraites retraité retraités retrouver revanche revanches revenir revue
revues rhume rhumes riche riches richesse richesses ricochet ricochets ride rideau rideaux rider rides ridé
ridée ridées ridés rieur rieurs rieuse rieuses rigide rigides rigolade rigolades rigolo rigolos rigolote
rigolotes rigueur rigueurs rime rimer rimes rincer riposte riposter ripostes rire ris rite rites rituel
rituelle rituelles rituels rivage rivages rival rivalité rivalités rivaux rive rives rivet rivets rivière
rivières rixe rixes riz robe robes robinet robinets robot robots robuste robustes roc rocaille rocailles roche
rocher rochers roches rocheuse rocheuses rocheux rocs rodéo rodéos roi rois roitelet roitelets roman romance
romances romancier romans ronce ronces rond ronde rondelle rondelles rondes ronds ronger rongeur rongeurs rose
roseau roseaux roseraie roseraies roses rosette rosettes rosier rosiers rossignol rosé rosée rosées rosés
rotation rotations roter rotin rotins rotule rotules roture rotures roue roues rouet rouets rouge rouges
rougir rouille rouiller rouilles rouillé rouillée rouillées rouillés rouleau rouleaux rouler roulotte
roulottes rousse rousses rousseur rousseurs route routes routine routines roux royal royale royales royaume
royaumes royaux ruade ruades ruban rubans rubis ruche ruches rude rudes rudesse rudesses rue ruelle ruelles
rues rugir ruine ruiner ruines ruisseau ruisseaux rumeur rumeurs ruminant ruminants rupture ruptures rural
rurale rurales ruraux ruse ruser ruses rustique rustiques rusé rusée rusées rusés rythme rythmes râle râles
râteau râteaux règle règles réaction réactions réaliser réaliste réalistes rébellion récent récente récentes
récents récipient récit récits récolte récolter récoltes réconfort réduction réel réelle réelles réels
réflexion réfléchir région régions régner régulier réguliers régulière réparer réplique répliques répondre
réponse réponses répéter réseau réseaux réserve réserves réservoir résidence résine résines résolu résolue
résolues résolus rétention rétine rétines réunion réunions réunir réussir réussite réussites réveil réveiller
réveils révolte révoltes révérence rêve rêver rêves rêveur rêveurs rêveuse rêveuses rôdeur rôdeurs rôti rôtir
rôtis sable sables sablier sabliers sabot sabotier sabotiers sabots sabre sabres sac sacoche sacoches
sacrifice sacré sacrée sacrées sacrés sacs safran safrans sage sages sagesse sagesses saignant saignante
saignants saignée saignées sain saine saines sains saint sainte saintes saints saison saisons salade salades
saladier saladiers salaire salaires sale saler sales salin saline salines salins salir salière salières salle
salles salon salons salopette saluer salut saluts salé salée salées salés samedi samedis sandale sandales sang
sanglant sanglante sanglants sanglier sangliers sanglot sanglots sangs sanie sanies sanitaire santon santons
santé santés saper sapeur sapeurs sapin sapins sarcasme sarcasmes sardine sardines sarment sarments satellite
satin satins satire satires saturé saturée saturées saturés sauce sauces saucisse saucisses saucisson saule
saules saumon saumons saumure saumures saut sauter sauterie sauteries sauteur sauteurs sauts sauvage sauvages
sauver sauvetage sauveur sauveurs savane savanes savant savante savantes savants saveur saveurs savoir savon
savons scarabée scarabées sceller sceptre sceptres scie science sciences scierie scieries scies scion scions
scolaire scolaires scorie scories sculpteur sculpture scène scènes seau seaux sec secouer secours secret
secrets secrète secrètes secs seiche seiches seigle seigles seigneur seigneurs sein seins sel sels semaine
semaines semelle semelles semence semences semer semeur semeurs sens sensation sensible sensibles sensé sensée
sensées sensés sentier sentiers sentiment sentine sentines sentir septembre serein sereine sereines sereins
sergent sergents serin seringue seringues serins sermon sermons serpe serpent serpentin serpents serpes serre
serrer serres serrure serrures serré serrée serrées serrés sertir servante servantes serveur serveurs serveuse
serveuses service services serviette servir seuil seuils seul seulement seulle seulles seuls sieste siestes
siffler sifflet sifflets signal signature signaux signe signer signes silence silences sillon sillons silo
silos simple simples sincère sincères singe singes sinus sire sires sirocco siroccos sirop sirops sirène
sirènes site sites situation siècle siècles siège sièges ski skis sobriété sobriétés société sociétés soda
sodas soeur soeurs sofa sofas soie soies soif soifs soigner soin soins soir soirs soirée soirées soldat
soldats sole soleil soleils soles solide solides solitaire solitude solitudes soluble solubles solution
solutions sombre sombres somme sommeil sommeils sommelier sommes sommet sommets son sonate sonates sondage
sondages sonder songe songes sonner sonnet sonnets sonnette sonnettes sonore sonores sons sorbet sorbets
sorcier sorciers sorcière sorcières sornette sornettes sort sorte sortes sortie sorties sortir sorts sosie
sosies sot sots sotte sottes sou souci soucis soucoupe soucoupes soudain soudaine soudaines soudains souffle
souffler souffles souffrir souhaiter soulever soulier souliers soupe soupes soupière soupières souple souples
souplesse source sources sourcil sourcils sourd sourde sourdes sourds souriant souriante souriants sourire
sourires souris sous soute soutenir soutenu soutenue soutenues soutenus soutes souvenir souvenirs souvent
souverain spacieuse spacieux spectacle spirale spirales splendeur splendide sport sportif sportifs sportive
sportives sports squelette stade stades station stations statue statues stature statures stratégie strident
stridente stridents structure stuc stucs studio studios stupeur stupeurs stupide stupides style styles stylo
stylos stère stères stérile stériles suaire suaires sublime sublimes subtil subtile subtiles subtilité subtils
succès sucer sucre sucrer sucrerie sucreries sucres sucrier sucriers sucrière sucrières sucré sucrée sucrées
sucrés sud suds suer sueur sueurs suffisant suffrage suffrages suie suies suite suites suivant suivante
suivantes suivants suivre sujet sujets sultan sultans superbe superbes supplice supplices supérieur sureau
sureaux surface surfaces surin surins surpris surprise surprises surtout suspense suspenses syllabe syllabes
symbole symboles sympathie symphonie syndicat syndicats système systèmes sèche sèches séance séances sécher
sécurité sécurités sédiment sédiments séjour séjours sélection sénat sénateur sénateurs sénats séparer série
séries sérieuse sérieuses sérieux sévère sévères sûr sûre sûres sûrs tabac tabacs table tableau tableaux
tables tablier tabliers tabouret tabourets tacheron tacherons tacheté tachetée tachetées tachetés tactique
tactiques taie taies taille tailler tailles tailleur tailleurs taillis taire talent talents talisman talismans
talon talons talus tambour tambourin tambours tamis tanin tanins tanière tanières tanner tannerie tanneries
tanné tannée tannées tannés tante tantes tantinet tantinets tantôt taon taons tapage tapages taper tapis
tapissier taquin taquins tarder tardif tardifs tardive tardives tarentule tarif tarifs tarir tarot tarots
tarte tartes tartine tartiner tartines tartre tartres tas tasse tasses tatouage tatouages tatoué tatouée
tatouées tatoués taupe taupes taureau taureaux taverne tavernes taxi taxis technique teindre teinte teinter
teintes teinture teintures tellement temple temples temps tempête tempêtes tenaille tenailles tendance
tendances tendre tendres tendresse tenir tentation tentative tente tenter tentes tenue tenues terminal
terminaux terminer terne ternes terrain terrains terrasse terrasses terre terrer terres terreur terreurs
terreuse terreuses terreux terrible terribles terrier terriers terrine terrines terroir terroirs tertre
tertres tesson tessons texte textes thon thons thé théière théières théorie théories thés théâtre théâtres
tiare tiares tige tiges tigre tigres tilleul tilleuls timbre timbres timide timides tirer tiret tirets tiroir
tiroirs tisane tisanes tison tisons tisser tisserand tissu tissus titane titanes titre titrer titres tiède
tièdes tiédir toboggan toboggans toile toiles toilette toilettes toison toisons toit toits toiture toitures
tolérance tolérer tomate tomates tombe tombeau tombeaux tomber tombes tombola tombolas tonalité tonalités
tondre tonique toniques tonneau tonneaux tonnelle tonnelles tonnerre tonnerres tonte tontes torchon torchons
tordu tordue tordues tordus torrent torrents torse torses tortue tortues tortueuse tortueux torturer total
totale totales totalité totalités totaux totem totems toucan toucans toucher toujours toupie toupies tour
tourelle tourelles touriste touristes tourment tourments tournage tournages tourner tournesol tournoi tournois
tours tourte tourteau tourteaux tourtes tousser toutefois toux tracer tracteur tracteurs tradition tragédie
tragédies trahir trahison trahisons train trains trait traite traiter traites traiteur traiteurs traits trajet
trajets trame trames tranche trancher tranches transport trappe trappes trapèze trapèzes travail travaux
traverser traversin traversée travée travées traîneau traîneaux traîner traître traîtres trembler tremper
tremplin tremplins triangle triangles tribal tribale tribales tribaux tribu tribunal tribunaux tribus tricher
tricheur tricheurs tricolore tricot tricoter tricots trier trieur trieurs trimestre trinité trinités trinquer
triomphe triomphes triste tristes tristesse triton tritons trognon trognons trompe tromper trompes trompette
tronc troncs trop troquer trotteur trotteurs trottoir trottoirs trou troublé troublée troublées troublés
troupe troupeau troupeaux troupes trous trousse trousseau trousses trouver troué trouée trouées troués troène
troènes truand truands truelle truelles truie truies truite truites trésor trésorier trésors trêve trêves
trône trônes tuba tubas tuer tuile tuiles tulipe tulipes tulle tulles tunique tuniques tunnel tunnels turban
turbans turbulent tuteur tuteurs tutoyer tutrice tutrices tutu tutus tuyau tuyaux tympan tympans tyran tyrans
tâche tâches télescope téléphone témoin témoins témérité témérités ténor ténors ténu ténue ténues ténus
ténèbres tétard tétards tétine tétines tête têtes têtu têtue têtues têtus unanimité uniforme uniformes union
unions unique uniques unité unités univers urbain urbaine urbaines urbains urgence urgences urgent urgente
urgentes urgents urine urines urinoir urinoirs usager usagers user usine usines ustensile usure usures usé
usée usées usés utile utiles utiliser utilité utilités utérus vacances vacarme vacarmes vaccin vaccins vache
vaches vagabond vagabonds vague vagues vaillance vaillant vaillante vaillants vain vaincre vaine vaines
vainqueur vains vairon vairons vaisseau vaisseaux vaisselle valet valets valeur valeurs valide valides valise
valises vallon vallons vallée vallées valoir valse valser valses vandale vandales vanille vanilles vaniteuse
vaniteux vanité vanités vanne vannerie vanneries vannes vanter vapeur vapeurs vareuse vareuses varier variété
variétés vaste vastes vaurien vauriens vautour vautours veau veaux vedette vedettes veille veiller veilles
veilleuse veillée veillées veine veines velours velouté veloutée veloutées veloutés vendange vendanges vendeur
vendeurs vendeuse vendeuses vendre vendredi vendredis vengeance venin venins venir vent vente ventes ventre
ventres ventru ventrue ventrues ventrus vents ver verdure verdures verger vergers verglas vermine vermines
vernir vernis verre verres verrou verrous verrue verrues vers versant versants verser vert verte vertes
vertical verticale verticaux vertige vertiges verts vertu vertus vessie vessies veste vestes vestiaire
vestibule vestige vestiges veuve veuves viaduc viaducs viande viandes vibration vicomte vicomtes victime
victimes victoire victoires vide vider vides vie vieillard vieille vieilles vielle vielles vierge vierges vies
vieux vif vifs vigie vigies vigilance vigne vigneron vignerons vignes vignoble vignobles vilain vilaine
vilaines vilains village villages ville villes vin vinaigre vinaigres vins viole violent violente violentes
violents violes violet violets violette violettes violon violons vipère vipères virage virages virer virgule
virgules visage visages viser visible visibles vision visions visite visiter visites visiteur visiteurs vital
vitale vitales vitamine vitamines vitaux vitesse vitesses vitrail vitraux vitre vitres vitrine vitrines
vivacité vivacités vivant vivante vivantes vivants vive vives vivier viviers vivre voeu voeux voie voies voile
voiler voiles voilette voilettes voilier voiliers voilé voilée voilées voilés voir voirie voiries voisin
voisine voisines voisins voiture voitures voix vol volaille volailles volant volante volantes volants volcan
volcans voler volet volets volière volières volonté volontés vols voltige voltiges volume volumes volupté
voluptés vorace voraces vote voter votes vouloir voyage voyager voyages voyageur voyageurs voyelle voyelles
vrai vraie vraies vraiment vrais vrille vrilles vue vues vulgaire vulgaires vulgarité végétal végétale
végétales végétaux véhicule véhicules vélo vélodrome vélos vénéneuse vénéneux vénérable vénérie vénéries
véranda vérandas véritable vérité vérités vétille vétilles vétéran vétérans vêtement vêtements vêtir wagon
wagons yeux zone zones zoo zoos zèbre zèbres zéro zéros âge âges âme âmes âne ânes âtre âtres ère ères ébahi
ébahie ébahies ébahis ébauche ébauches ébréché ébréchée ébréchées ébréchés ébène ébènes écaille écailles écart
écarts échange échanges écharpe écharpes échelle échelles écho échos éclair éclairer éclaireur éclairs éclairé
éclairée éclairées éclairés éclat éclater éclats éclipse éclipses école écoles écolier écoliers écolière
écolières économe économes économie économies écorce écorces écorchure écorner écoute écouter écoutes écran
écrans écraser écrevisse écrier écrin écrins écrire écriture écritures écrivain écrivains écureuil écureuils
écurie écuries édifice édifices éditer éditeur éditeurs édition éditions éducation égal égale égales égaliser
égalité égalités égarer égaré égarée égarées égarés égaux église églises égout égouts égérie égéries élaguer
élan élancé élancée élancées élancés élans élastique électeur électeurs élection élections élevage élevages
élever éleveur éleveurs éleveuse éleveuses élevé élevée élevées élevés élire élite élites éloge éloges éloigné
éloignée éloignées éloignés élu élue élues élus élève élèves élégance élégances élégant élégante élégantes
élégants élément éléments éléphant éléphants émail émaux émeraude émeraudes émetteur émetteurs émettre émeute
émeutes émietter émir émirs émission émissions émotion émotions émouvant émouvante émouvants ému émue émues
émus énergie énergies énergique énervé énervée énervées énervés énigme énigmes énoncer énorme énormes épais
épaisse épaisses épargne épargnes épatant épatante épatantes épatants épaule épaules épeler épervier éperviers
épi épice épicerie épiceries épices épicier épiciers épicé épicée épicées épicés épidémie épidémies épilogue
épilogues épinard épinards épine épines épis épisode épisodes éplucher éponge éponges épopée épopées époque
époques épreuve épreuves épuisé épuisée épuisées épuisés épée épées équateur équateurs équilibre équipe
équipes équitable érosion érosions éruption éruptions étable étables étage étages étagère étagères étai étain
étains étais étalage étalages étaler étalon étalons étang étangs étape étapes état états étau étaux éteindre
étendu étendue étendues étendus éternel éternelle éternels éther éthers étiage étiages étiquette étirer étoffe
étoffes étoile étoiles étoilé étoilée étoilées étoilés étole étoles étonnant étonnante étonnants étonner
étoupe étoupes étourdi étourdie étourdies étourdis étourneau étrange étranger étrangers étranges étrangère
étrenne étrennes étrier étriers étroit étroite étroites étroits étude études étudiant étudiante étudiants
étudier étui étuis été étés évadé évadée évadées évadés évaluer évasion évasions éventail éventails évidence
évidences évier éviers éviter événement être êtres île îles îlot îlots ôter`;

let _mlDico = null; // [{ w: 'étoile', n: 'ETOILE' }, ...]

function _mlNorm(str) {
    return (str || '')
        .replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().replace(/[^A-Z]/g, '');
}

function _mlGetDico() {
    if (_mlDico) return _mlDico;
    const seen = new Set();
    _mlDico = [];
    ML_DICO_RAW.split(/\s+/).forEach(w => {
        if (!w) return;
        const n = _mlNorm(w);
        const key = w + '|' + n;
        if (n.length < 2 || n.length > 9 || seen.has(key)) return;
        seen.add(key);
        _mlDico.push({ w, n });
        _mlWikiCache.set(w, { ok: true }); // mots intégrés : déjà validés
    });
    return _mlDico;
}

function _mlCounts(str) {
    const c = new Array(26).fill(0);
    for (const ch of str) c[ch.charCodeAt(0) - 65]++;
    return c;
}

function _mlFits(word, counts) {
    const c = counts.slice();
    for (const ch of word) {
        const i = ch.charCodeAt(0) - 65;
        if (--c[i] < 0) return false;
    }
    return true;
}

// Renvoie les mots faisables triés du plus long au plus court
function _mlSolve(letters) {
    const counts = _mlCounts(letters.join(''));
    const found = new Map(); // forme normalisée -> liste des graphies
    for (const { w, n } of _mlGetDico()) {
        if (n.length > letters.length) continue;
        if (!_mlFits(n, counts)) continue;
        if (!found.has(n)) found.set(n, []);
        const arr = found.get(n);
        if (!arr.includes(w)) arr.push(w);
    }
    return Array.from(found.entries())
        .map(([n, ws]) => ({ n, w: ws.join(' / ') }))
        .sort((a, b) => b.n.length - a.n.length || a.n.localeCompare(b.n));
}

// Tire une lettre pondérée en respectant les limites de répétition
function _mlDrawLetter(pool, current) {
    const entries = Object.entries(pool).filter(([l]) => {
        const nb = current.filter(x => x === l).length;
        if (ML_RARES.includes(l)) return nb < 1;
        return nb < ML_MAX_REPEAT;
    });
    const total = entries.reduce((s, [, p]) => s + p, 0);
    let r = Math.random() * total;
    for (const [l, p] of entries) {
        r -= p;
        if (r <= 0) return l;
    }
    return entries[entries.length - 1][0];
}

// ── Dictionnaire externe (en ligne) ───────────────────────────────────────
// 1) Liste de ~336 000 mots français (toutes formes) : sert à trouver les
//    mots candidats formables avec le tirage.
// 2) Wiktionnaire (API) : vérifie la nature de chaque candidat pour écarter
//    les verbes conjugués, noms propres, onomatopées et mots non français.
// En cas d'absence de connexion, le dictionnaire intégré prend le relais.
const ML_EXT_LIST_URLS = [
    'https://cdn.jsdelivr.net/npm/an-array-of-french-words@2.0.0/index.json',
    'https://unpkg.com/an-array-of-french-words@2.0.0/index.json'
];
const ML_WIKI_API  = 'https://fr.wiktionary.org/w/api.php';
const ML_WIKI_PAGE = 'https://fr.wiktionary.org/wiki/';

let _mlExtPromise = null;           // Promise<Map(forme normalisée -> [graphies])> ou null
const _mlWikiCache = new Map();     // graphie -> { ok: bool, reason: string }

function _mlLoadExternal() {
    if (_mlExtPromise) return _mlExtPromise;
    _mlExtPromise = (async () => {
        for (const url of ML_EXT_LIST_URLS) {
            try {
                const r = await fetch(url);
                if (!r.ok) continue;
                const arr = await r.json();
                if (!Array.isArray(arr)) continue;
                const map = new Map();
                const add = (w, n) => {
                    let g = map.get(n);
                    if (!g) map.set(n, g = []);
                    if (!g.includes(w)) g.push(w);
                };
                const re = /^[a-zàâäçéèêëîïôöùûüÿœæ]+$/;
                for (const w of arr) {
                    if (typeof w !== 'string' || !re.test(w)) continue;
                    const n = _mlNorm(w);
                    if (n.length < 2 || n.length > 9) continue;
                    add(w, n);
                }
                // On ajoute aussi le dictionnaire intégré (mots déjà validés)
                for (const { w, n } of _mlGetDico()) add(w, n);
                return map;
            } catch (e) { /* on essaie l'URL suivante */ }
        }
        return null;
    })().then(m => { if (!m) _mlExtPromise = null; return m; }); // nouvel essai plus tard si échec
    return _mlExtPromise;
}

// Analyse le wikicode d'une page du Wiktionnaire
function _mlClassify(text) {
    if (!text) return { ok: false, reason: 'absent' };
    const start = text.search(/==\s*\{\{langue\|fr\}\}\s*==/);
    if (start < 0) return { ok: false, reason: 'etranger' };
    let sect = text.slice(start + 10);
    const end = sect.search(/\n==\s*\{\{langue\|/);
    if (end >= 0) sect = sect.slice(0, end);

    const types = [];
    const re = /\{\{S\|([^|}]+)\|fr(\|[^}]*)?\}\}/g;
    let m;
    while ((m = re.exec(sect))) {
        types.push({ t: m[1].trim().toLowerCase(), flex: /flexion/.test(m[2] || '') });
    }
    if (!types.length) return { ok: false, reason: 'absent' };

    const accepted = ({ t, flex }) => {
        if (t === 'verbe') return !flex;                       // infinitif seulement
        if (/propre|prénom|famille/.test(t)) return false;     // noms propres
        return /^(nom|adj|adv|prép|conj|pron|art)/.test(t);    // noms, adjectifs, etc.
    };
    if (types.some(accepted)) return { ok: true };
    if (types.some(x => x.t === 'verbe')) return { ok: false, reason: 'conjugue' };
    if (types.some(x => /onomat|interj/.test(x.t))) return { ok: false, reason: 'onomatopee' };
    if (types.some(x => /propre|prénom|famille/.test(x.t))) return { ok: false, reason: 'propre' };
    return { ok: false, reason: 'autre' };
}

// ── Définition rapide (Wiktionnaire) ──────────────────────────────────────
const _mlDefCache = new Map(); // mot -> { def, lemma } | null

async function _mlWikiText(title) {
    const url = ML_WIKI_API + '?action=query&format=json&formatversion=2&origin=*' +
        '&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(title);
    const r = await fetch(url);
    if (!r.ok) throw new Error('Wiktionnaire indisponible');
    const data = await r.json();
    const p = data.query && data.query.pages && data.query.pages[0];
    const rev = p && !p.missing && p.revisions && p.revisions[0];
    return (rev && rev.slots && rev.slots.main && rev.slots.main.content) || '';
}

// Transforme une ligne de wikicode en texte lisible
function _mlCleanWiki(str) {
    let t = str;
    t = t.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<[^>]+>/g, '');
    for (let i = 0; i < 3; i++) {
        t = t.replace(/\{\{(?:lien|l|w|ws)\|([^|{}]+)[^{}]*\}\}/g, '$1');
        t = t.replace(/\{\{term\|([^|{}]+)[^{}]*\}\}/g, '($1)');
        t = t.replace(/\{\{([^|{}]+)\|fr[^{}]*\}\}/g, (m, x) => '(' + x.charAt(0).toUpperCase() + x.slice(1) + ')');
        t = t.replace(/\{\{[^{}]*\}\}/g, '');
    }
    t = t.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1');
    t = t.replace(/'{2,}/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ');
    t = t.replace(/^\s*[:;,.]\s*/, '').trim();
    return t;
}

// Première définition française d'un mot (nom, adjectif, infinitif…)
function _mlExtractDef(text) {
    const start = text.search(/==\s*\{\{langue\|fr\}\}\s*==/);
    if (start < 0) return null;
    let sect = text.slice(start + 10);
    const end = sect.search(/\n==\s*\{\{langue\|/);
    if (end >= 0) sect = sect.slice(0, end);
    const re = /\{\{S\|([^|}]+)\|fr(\|[^}]*)?\}\}/g;
    let m, from = -1;
    while ((m = re.exec(sect))) {
        const t = m[1].trim().toLowerCase(), flex = /flexion/.test(m[2] || '');
        if (t === 'verbe' ? !flex : (/^(nom|adj|adv|prép|conj|pron|art)/.test(t) && !/propre|prénom|famille/.test(t))) {
            from = m.index; break;
        }
    }
    if (from < 0) return null;
    const lines = sect.slice(from).split('\n');
    for (const line of lines.slice(1)) {
        if (/^={3,}/.test(line)) break;
        if (/^#(?![*:#])/.test(line)) {
            const def = _mlCleanWiki(line.replace(/^#\s*/, ''));
            if (def.length > 2) return def;
        }
    }
    return null;
}

async function _mlGetDefinition(word) {
    if (_mlDefCache.has(word)) return _mlDefCache.get(word);
    let def = _mlExtractDef(await _mlWikiText(word));
    let lemma = null;
    // « Pluriel de étoile. » → on va chercher la définition de « étoile »
    const fm = def && def.match(/^(?:(?:pluriel|féminin|masculin|singulier)[^.]*?) de ([a-zàâäçéèêëîïôöùûüÿœæ]+)\.?$/i);
    if (fm) {
        lemma = { form: def.replace(/\.$/, ''), word: fm[1] };
        const d2 = _mlExtractDef(await _mlWikiText(fm[1]));
        def = d2 || def;
    }
    if (def && def.length > 180) def = def.slice(0, 177).replace(/\s+\S*$/, '') + '…';
    const res = def ? { def, lemma } : null;
    _mlDefCache.set(word, res);
    return res;
}

async function _mlWikiFetch(batch) {
    const url = ML_WIKI_API + '?action=query&format=json&formatversion=2&origin=*' +
        '&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(batch.join('|'));
    const r = await fetch(url);
    if (!r.ok) throw new Error('Wiktionnaire indisponible');
    const data = await r.json();
    const q = data.query || {};
    const back = {};
    (q.normalized || []).forEach(x => { back[x.to] = x.from; });
    (q.pages || []).forEach(p => {
        const title = back[p.title] || p.title;
        if (p.missing) { _mlWikiCache.set(title, { ok: false, reason: 'absent' }); return; }
        const rev = p.revisions && p.revisions[0];
        const txt = rev && rev.slots && rev.slots.main && rev.slots.main.content;
        if (typeof txt === 'string') _mlWikiCache.set(title, _mlClassify(txt));
    });
}

// Vérifie une liste de graphies (avec cache). Lève une erreur si hors ligne.
async function _mlWikiCheck(words) {
    const todo = [...new Set(words)].filter(w => !_mlWikiCache.has(w));
    for (let i = 0; i < todo.length; i += 20) await _mlWikiFetch(todo.slice(i, i + 20));
    // Pages non renvoyées (réponse trop volumineuse) : une par une
    for (const w of todo.filter(w => !_mlWikiCache.has(w))) {
        await _mlWikiFetch([w]);
        if (!_mlWikiCache.has(w)) _mlWikiCache.set(w, { ok: false, reason: 'absent' });
    }
    return words.map(w => _mlWikiCache.get(w));
}

// Recherche des meilleurs mots avec le dictionnaire externe.
// Renvoie null si la liste de mots n'a pas pu être chargée.
async function _mlSolveExternal(letters) {
    const map = await _mlLoadExternal();
    if (!map) return null;
    const counts = _mlCounts(letters.join(''));
    const byLen = new Map();
    for (const [n, ws] of map) {
        if (n.length > letters.length || !_mlFits(n, counts)) continue;
        if (!byLen.has(n.length)) byLen.set(n.length, []);
        byLen.get(n.length).push({ n, ws });
    }
    const lens = [...byLen.keys()].sort((a, b) => b - a);
    const result = [];
    let bestLen = 0;
    for (const L of lens) {
        // Les mots déjà connus comme valides passent en premier
        const known = g => g.ws.some(w => (_mlWikiCache.get(w) || {}).ok);
        const groups = byLen.get(L).sort((a, b) => known(b) - known(a)).slice(0, bestLen ? 40 : 80);
        await _mlWikiCheck(groups.flatMap(g => g.ws));
        const valid = groups
            .map(g => ({ n: g.n, ws: g.ws.filter(w => (_mlWikiCache.get(w) || {}).ok) }))
            .filter(g => g.ws.length);
        valid.forEach(g => result.push({ n: g.n, w: g.ws.join(' / '), link: g.ws[0] }));
        if (valid.length && !bestLen) { bestLen = L; continue; }
        if (bestLen) break; // on a aussi la longueur juste en dessous
    }
    return result.sort((a, b) => b.n.length - a.n.length || a.n.localeCompare(b.n));
}

// Vérifie le mot proposé par l'élève.
// { ok: true, w } | { ok: false, reason } | { ok: null } (vérification impossible)
async function _mlCheckWord(typed, n) {
    let cands = [];
    try {
        const map = await _mlLoadExternal();
        if (map && map.get(n)) cands = map.get(n).slice();
    } catch (e) { /* hors ligne */ }
    _mlGetDico().forEach(d => { if (d.n === n && !cands.includes(d.w)) cands.push(d.w); });
    const raw = (typed || '').trim().toLowerCase();
    if (!cands.length && raw) cands = [raw];
    try {
        await _mlWikiCheck(cands);
    } catch (e) {
        const local = _mlGetDico().find(d => d.n === n);
        return local ? { ok: true, w: local.w } : { ok: null };
    }
    const good = cands.find(w => (_mlWikiCache.get(w) || {}).ok);
    if (good) return { ok: true, w: good };
    const reasons = cands.map(w => (_mlWikiCache.get(w) || {}).reason);
    for (const r of ['conjugue', 'onomatopee', 'propre', 'etranger', 'autre']) {
        if (reasons.includes(r)) return { ok: false, reason: r };
    }
    return { ok: false, reason: 'absent' };
}

// ── Création du widget ────────────────────────────────────────────────────
function createMotLePlusLongWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'mot-long';
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
    container.className = 'ml-container';

    // Taille initiale : 75% de la largeur de la page, format 16/9
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // En-tête
    const header = document.createElement('div');
    header.className = 'ml-header';
    header.innerHTML = `
        <span class="ml-title">🔤 Le mot le plus long</span>
        <span class="ml-badge">Sans chrono</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.ml-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'ml-controls';
    controls.innerHTML = `
        <button class="ml-btn ml-btn-new">🔄 Nouveau tirage</button>
        <button class="ml-btn ml-btn-auto">🎲 Tirage au hasard</button>
        <button class="ml-btn ml-btn-answer">👁 Voir la solution</button>
        <div class="ml-timer-btns">
            <button class="ml-timer-btn active" data-timer="0">∞ Sans chrono</button>
            <button class="ml-timer-btn" data-timer="30">⏱ 30 s</button>
            <button class="ml-timer-btn" data-timer="60">⏱ 60 s</button>
        </div>
    `;
    const newBtn  = controls.querySelector('.ml-btn-new');
    const autoBtn = controls.querySelector('.ml-btn-auto');
    const showBtn = controls.querySelector('.ml-btn-answer');
    container.appendChild(controls);

    // Barre de tirage (voyelle / consonne) ou chrono
    const drawBar = document.createElement('div');
    drawBar.className = 'ml-draw-bar';
    drawBar.innerHTML = `
        <button class="ml-draw-btn voyelle">Voyelle</button>
        <span class="ml-draw-info"></span>
        <button class="ml-draw-btn consonne">Consonne</button>
        <span class="ml-chrono" style="display:none"></span>
    `;
    const voyBtn   = drawBar.querySelector('.voyelle');
    const consBtn  = drawBar.querySelector('.consonne');
    const drawInfo = drawBar.querySelector('.ml-draw-info');
    const chronoEl = drawBar.querySelector('.ml-chrono');
    container.appendChild(drawBar);

    // Zone des lettres
    const tilesZone = document.createElement('div');
    tilesZone.className = 'ml-tiles';
    tilesZone.style.height = Math.round(initH * 0.32) + 'px';
    container.appendChild(tilesZone);

    // Zone réponse
    const answerZone = document.createElement('div');
    answerZone.className = 'ml-answer-zone';
    answerZone.innerHTML = `
        <span class="ml-answer-label">Ton mot :</span>
        <input class="ml-answer-input" type="text" maxlength="12" placeholder="…" spellcheck="false" autocomplete="off">
        <button class="ml-small-btn ml-erase-btn" title="Effacer">⌫</button>
        <button class="ml-check-btn">✓ Vérifier</button>
        <span class="ml-feedback"></span>
    `;
    const answerInput = answerZone.querySelector('.ml-answer-input');
    const eraseBtn    = answerZone.querySelector('.ml-erase-btn');
    const checkBtn    = answerZone.querySelector('.ml-check-btn');
    const feedback    = answerZone.querySelector('.ml-feedback');

    // Zone solution
    const solutionZone = document.createElement('div');
    solutionZone.className = 'ml-solution';

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ml-help-btn';
    helpBtn.title = 'Règles du jeu';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ml-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Règles du mot le plus long</h4>
        <p>Choisis 9 lettres une par une en cliquant sur <b>Voyelle</b> ou <b>Consonne</b>
        (ou utilise <b>Tirage au hasard</b>).</p>
        <p>Trouve le mot le plus long possible avec ces lettres. Chaque lettre ne sert qu'une fois.
        Les accents ne comptent pas (E = É = È = Ê).</p>
        <p>✅ Acceptés : noms, adjectifs, infinitifs, mots invariables, pluriels et féminins.</p>
        <p>❌ Interdits : verbes conjugués, mots étrangers, noms propres, onomatopées.</p>
        <p>Clique sur les lettres pour écrire ton mot, puis sur <b>Vérifier</b>.
        Le bouton <b>Voir la solution</b> affiche le ou les mots gagnants.</p>
        <p style="color:#888">Dictionnaire : liste de 336 000 mots français, vérifiés avec le
        Wiktionnaire (connexion internet nécessaire). Hors ligne, le widget utilise son
        dictionnaire intégré de 9 000 mots courants. Clique sur un mot de la solution
        pour voir sa définition.</p>
    `;
    container.appendChild(helpPopup);

    container.appendChild(answerZone);
    container.appendChild(solutionZone);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ml-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let letters = [];          // lettres tirées
    let timerMode = 0;         // 0, 30 ou 60
    let chronoId = null;
    let chronoLeft = 0;
    let solutions = null;      // résultat de _mlSolve
    let solutionRevealed = false;
    let searchToken = 0;       // invalide les recherches d'un ancien tirage
    let searchPromise = Promise.resolve();
    let dicoSource = 'ext';    // 'ext' (en ligne) ou 'local' (intégré)

    const BASE_TILES_H = Math.round(initH * 0.32);

    function isVowel(l) { return l in ML_VOYELLES; }

    // ── Taille des tuiles selon la place disponible ───────────────────────
    function applyTileSize() {
        const zw = tilesZone.clientWidth  || initW - 32;
        const zh = tilesZone.clientHeight || BASE_TILES_H;
        const gap = Math.max(4, Math.round(zw * 0.008));
        tilesZone.style.gap = gap + 'px';
        const byW = (zw - 16 - gap * 8) / 9;
        const byH = (zh - 16) * 0.92;
        const size = Math.max(24, Math.floor(Math.min(byW, byH)));
        tilesZone.querySelectorAll('.ml-tile').forEach(t => {
            t.style.width    = size + 'px';
            t.style.height   = size + 'px';
            t.style.fontSize = Math.round(size * 0.62) + 'px';
        });
    }

    // ── Rendu des tuiles ──────────────────────────────────────────────────
    function renderTiles() {
        tilesZone.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const t = document.createElement('div');
            const l = letters[i];
            if (l) {
                t.className = 'ml-tile full ' + (isVowel(l) ? 'v' : 'c');
                t.textContent = l;
                t.dataset.idx = i;
                t.title = 'Ajouter cette lettre à ton mot';
                t.addEventListener('mousedown', (e) => e.stopPropagation());
                t.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (t.classList.contains('used')) return;
                    answerInput.value += l;
                    onInputChange();
                });
            } else {
                t.className = 'ml-tile empty';
                t.textContent = '?';
            }
            tilesZone.appendChild(t);
        }
        applyTileSize();
        markUsedTiles();
    }

    // Grise les tuiles déjà utilisées dans le mot saisi
    function markUsedTiles() {
        const typed = _mlNorm(answerInput.value).split('');
        const tiles = Array.from(tilesZone.querySelectorAll('.ml-tile.full'));
        tiles.forEach(t => t.classList.remove('used'));
        typed.forEach(ch => {
            const t = tiles.find(x => !x.classList.contains('used') && x.textContent === ch);
            if (t) t.classList.add('used');
        });
    }

    // ── Barre de tirage ───────────────────────────────────────────────────
    function updateDrawBar() {
        const done = letters.length >= 9;
        voyBtn.style.display  = done ? 'none' : '';
        consBtn.style.display = done ? 'none' : '';
        drawInfo.style.display = done ? 'none' : '';
        drawInfo.textContent = `Lettre ${letters.length + 1} / 9`;
        chronoEl.style.display = (done && timerMode > 0) ? '' : 'none';
        showBtn.disabled = !done;
        autoBtn.disabled = done;
    }

    function addLetter(kind) {
        if (letters.length >= 9) return;
        const pool = kind === 'v' ? ML_VOYELLES : ML_CONSONNES;
        letters.push(_mlDrawLetter(pool, letters));
        renderTiles();
        updateDrawBar();
        if (letters.length === 9) onDrawComplete();
    }

    function autoDraw() {
        // Entre 3 et 5 voyelles, le reste en consonnes, dans le désordre
        const remaining = 9 - letters.length;
        const vowelsHave = letters.filter(isVowel).length;
        let vowelsTarget = 3 + Math.floor(Math.random() * 3);
        let needV = Math.max(0, Math.min(remaining, vowelsTarget - vowelsHave));
        const kinds = [];
        for (let i = 0; i < remaining; i++) kinds.push(i < needV ? 'v' : 'c');
        kinds.sort(() => Math.random() - 0.5);
        kinds.forEach(k => {
            const pool = k === 'v' ? ML_VOYELLES : ML_CONSONNES;
            letters.push(_mlDrawLetter(pool, letters));
        });
        renderTiles();
        updateDrawBar();
        onDrawComplete();
    }

    function onDrawComplete() {
        searchSolutions();
        startChrono();
        saveBoard();
    }

    // ── Sons ──────────────────────────────────────────────────────────────
    // Un seul contexte audio, "déverrouillé" lors d'une interaction de
    // l'utilisateur (obligatoire sur tablette / Safari / Chrome), puis
    // réutilisé quand le chrono se termine.
    let mlAudioCtx = null;
    function getAudioCtx() {
        if (!mlAudioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            mlAudioCtx = new AC();
        }
        return mlAudioCtx;
    }
    function unlockAudio() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();
            // Son silencieux pour débloquer l'audio (iOS)
            const buf = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buf; src.connect(ctx.destination); src.start(0);
        } catch (e) {}
    }
    ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(evt => {
        widget.addEventListener(evt, unlockAudio, { capture: true, passive: true });
    });

    function playBeep() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const schedule = () => {
                const t0 = ctx.currentTime + 0.02;
                [[880,0,0.18],[880,0.22,0.18],[1318,0.44,0.4]].forEach(function (p) {
                    var osc = ctx.createOscillator(), gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = p[0]; osc.type = 'sine';
                    gain.gain.setValueAtTime(0.5, t0 + p[1]);
                    gain.gain.exponentialRampToValueAtTime(0.001, t0 + p[1] + p[2]);
                    osc.start(t0 + p[1]);
                    osc.stop(t0 + p[1] + p[2] + 0.05);
                });
            };
            if (ctx.state === 'suspended') ctx.resume().then(schedule).catch(() => {});
            else schedule();
        } catch (e) {}
    }

    // ── Chronomètre ───────────────────────────────────────────────────────
    function stopChrono() {
        if (chronoId) { clearInterval(chronoId); chronoId = null; }
    }
    function startChrono() {
        stopChrono();
        if (!timerMode || letters.length < 9) return;
        chronoLeft = timerMode;
        chronoEl.className = 'ml-chrono';
        chronoEl.textContent = '⏱ ' + chronoLeft + ' s';
        chronoEl.style.display = '';
        chronoId = setInterval(() => {
            if (!document.body.contains(widget)) { stopChrono(); return; }
            chronoLeft--;
            if (chronoLeft <= 0) {
                stopChrono();
                chronoEl.className = 'ml-chrono over';
                chronoEl.textContent = '⏰ Temps écoulé !';
                playBeep();
            } else {
                chronoEl.textContent = '⏱ ' + chronoLeft + ' s';
                if (chronoLeft <= 5) chronoEl.classList.add('urgent');
            }
        }, 1000);
    }

    // ── Recherche de la solution ──────────────────────────────────────────
    function searchSolutions() {
        const token = ++searchToken;
        solutions = null;
        solutionZone.innerHTML = '<span>🔎 Recherche de la meilleure solution dans le dictionnaire…</span>';
        searchPromise = (async () => {
            let res = null, src = 'ext';
            try { res = await _mlSolveExternal(letters); } catch (e) { res = null; }
            if (!res) { res = _mlSolve(letters); src = 'local'; }
            if (token !== searchToken) return;
            solutions = res;
            dicoSource = src;
            buildSolution();
        })();
        return searchPromise;
    }

    function makeWordLink(label, word, cls) {
        const a = document.createElement('a');
        a.href = ML_WIKI_PAGE + encodeURIComponent(word);
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = 'Voir la définition sur le Wiktionnaire';
        a.textContent = label;
        a.style.color = 'inherit';
        a.style.textDecoration = 'none';
        if (cls) a.className = cls;
        a.addEventListener('mousedown', (e) => e.stopPropagation());
        a.addEventListener('click', (e) => e.stopPropagation());
        return a;
    }
    function appendWordList(el, list) {
        list.forEach((sol, i) => {
            if (i) el.appendChild(document.createTextNode(', '));
            el.appendChild(makeWordLink(sol.w, sol.link || sol.w.split(' / ')[0]));
        });
    }

    // ── Solution ──────────────────────────────────────────────────────────
    function buildSolution() {
        solutionZone.innerHTML = '';
        if (!solutions || !solutions.length) {
            solutionZone.innerHTML = `<span>Aucun mot trouvé avec ces lettres dans le dictionnaire.</span>`;
            return;
        }
        const maxLen = solutions[0].n.length;
        const best = solutions.filter(s => s.n.length === maxLen);
        const next = solutions.filter(s => s.n.length === maxLen - 1).slice(0, 12);

        const bestEl = document.createElement('div');
        bestEl.appendChild(makeWordLink(best[0].w, best[0].link || best[0].w.split(' / ')[0], 'ml-sol-best'));
        const info = document.createElement('span');
        info.textContent = `${maxLen} lettres`;
        info.style.fontWeight = '700';
        bestEl.appendChild(info);
        solutionZone.appendChild(bestEl);

        // Définition rapide du mot gagnant
        const defWord = best[0].link || best[0].w.split(' / ')[0];
        const defEl = document.createElement('div');
        defEl.className = 'ml-sol-def loading';
        defEl.textContent = '📖 Recherche de la définition…';
        solutionZone.appendChild(defEl);
        const defToken = searchToken;
        _mlGetDefinition(defWord).then(res => {
            if (defToken !== searchToken) return;
            defEl.classList.remove('loading');
            defEl.textContent = '';
            if (!res) { defEl.textContent = '📖 Pas de définition trouvée.'; defEl.classList.add('loading'); return; }
            if (res.lemma) {
                const l = document.createElement('span');
                l.className = 'ml-def-lemma';
                l.textContent = `(${res.lemma.form.charAt(0).toLowerCase() + res.lemma.form.slice(1)}) `;
                defEl.appendChild(l);
            }
            defEl.appendChild(document.createTextNode('📖 ' + res.def));
        }).catch(() => {
            if (defToken !== searchToken) return;
            defEl.textContent = '📖 Définition indisponible (pas de connexion).';
        });

        if (best.length > 1) {
            const others = document.createElement('div');
            others.className = 'ml-sol-others';
            others.appendChild(document.createTextNode('Autres mots de ' + maxLen + ' lettres : '));
            appendWordList(others, best.slice(1, 16));
            if (best.length > 16) others.appendChild(document.createTextNode('…'));
            solutionZone.appendChild(others);
        }
        if (next.length) {
            const n = document.createElement('div');
            n.className = 'ml-sol-next';
            n.appendChild(document.createTextNode(`En ${maxLen - 1} lettres : `));
            appendWordList(n, next);
            solutionZone.appendChild(n);
        }
        const src = document.createElement('div');
        src.className = 'ml-sol-next';
        src.style.fontStyle = 'italic';
        src.textContent = dicoSource === 'ext'
            ? '📚 Mots vérifiés avec le Wiktionnaire'
            : '📴 Hors ligne : solution tirée du dictionnaire intégré (9 000 mots)';
        solutionZone.appendChild(src);
    }

    function hideSolution() {
        solutionRevealed = false;
        solutionZone.classList.remove('show');
        showBtn.textContent = '👁 Voir la solution';
        showBtn.classList.remove('revealed');
    }

    function toggleSolution() {
        if (letters.length < 9) return;
        if (!solutionRevealed) {
            solutionRevealed = true;
            stopChrono();
            solutionZone.classList.add('show');
            showBtn.textContent = '🙈 Cacher';
            showBtn.classList.add('revealed');
        } else {
            hideSolution();
        }
    }

    // ── Vérification du mot proposé ───────────────────────────────────────
    function setFeedback(text, cls) {
        feedback.textContent = text;
        feedback.className = 'ml-feedback show ' + cls;
    }
    function clearFeedback() {
        feedback.textContent = '';
        feedback.className = 'ml-feedback';
        answerInput.className = 'ml-answer-input';
    }

    const ML_REASONS = {
        conjugue:   '❌ C\'est une forme de verbe conjugué : interdit !',
        onomatopee: '❌ Onomatopée ou interjection : interdit !',
        propre:     '❌ C\'est un nom propre : interdit !',
        etranger:   '❌ Ce n\'est pas un mot français (mot étranger ?).',
        autre:      '❌ Ce mot n\'est pas accepté (ni nom, ni adjectif, ni infinitif…).',
        absent:     '❌ Mot introuvable dans le dictionnaire (attention aux accents).'
    };

    async function checkAnswer() {
        const n = _mlNorm(answerInput.value);
        if (!n) return;
        if (letters.length < 9) {
            setFeedback('Termine d\'abord le tirage des 9 lettres.', 'unknown');
            return;
        }
        if (!_mlFits(n, _mlCounts(letters.join('')))) {
            answerInput.className = 'ml-answer-input wrong';
            setFeedback('❌ Ce mot utilise des lettres qui ne sont pas dans le tirage.', 'ko');
            return;
        }
        const token = searchToken;
        const typed = answerInput.value;
        answerInput.className = 'ml-answer-input';
        setFeedback('🔎 Vérification dans le dictionnaire…', 'unknown');
        const res = await _mlCheckWord(typed, n);
        await searchPromise;
        if (token !== searchToken || _mlNorm(answerInput.value) !== n) return;

        if (res.ok === null) {
            answerInput.className = 'ml-answer-input unknown';
            setFeedback(`❓ ${n.length} lettres — vérification impossible sans connexion. À l'enseignant de juger !`, 'unknown');
            return;
        }
        if (!res.ok) {
            answerInput.className = 'ml-answer-input wrong';
            setFeedback(ML_REASONS[res.reason] || ML_REASONS.absent, 'ko');
            return;
        }
        answerInput.className = 'ml-answer-input correct';
        const maxLen = solutions && solutions.length ? solutions[0].n.length : 0;
        if (n.length > maxLen) {
            setFeedback(`🏆 Extraordinaire ! « ${res.w} », ${n.length} lettres : encore mieux que ma solution !`, 'ok');
        } else if (n.length === maxLen) {
            setFeedback(`🏆 Bravo ! « ${res.w} », ${n.length} lettres : c'est le mot le plus long possible !`, 'ok');
        } else {
            setFeedback(`✅ « ${res.w} » est valide (${n.length} lettres). On pouvait trouver ${maxLen} lettres…`, 'ok');
        }
    }

    function onInputChange() {
        clearFeedback();
        markUsedTiles();
    }

    // ── Nouveau tirage ────────────────────────────────────────────────────
    function newGame() {
        stopChrono();
        searchToken++;
        letters = [];
        solutions = null;
        answerInput.value = '';
        clearFeedback();
        hideSolution();
        solutionZone.innerHTML = '';
        chronoEl.textContent = '';
        renderTiles();
        updateDrawBar();
        saveBoard();
    }

    // ── Mode chrono ───────────────────────────────────────────────────────
    function setTimer(sec) {
        timerMode = sec;
        widget.dataset.mlTimer = sec;
        badge.textContent = ML_TIMERS[sec] || 'Sans chrono';
        container.querySelectorAll('.ml-timer-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.timer) === sec);
        });
        if (letters.length === 9 && !solutionRevealed) startChrono();
        else if (!sec) stopChrono();
        updateDrawBar();
        saveBoard();
    }

    // ── Event listeners ───────────────────────────────────────────────────
    newBtn.addEventListener('click', newGame);
    autoBtn.addEventListener('click', autoDraw);
    showBtn.addEventListener('click', toggleSolution);
    voyBtn.addEventListener('click', () => addLetter('v'));
    consBtn.addEventListener('click', () => addLetter('c'));
    checkBtn.addEventListener('click', checkAnswer);
    eraseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        answerInput.value = answerInput.value.slice(0, -1);
        onInputChange();
    });
    answerInput.addEventListener('input', onInputChange);
    answerInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') checkAnswer();
    });
    answerInput.addEventListener('mousedown', (e) => e.stopPropagation());
    answerInput.addEventListener('click', (e) => { e.stopPropagation(); answerInput.focus(); });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));
    container.querySelectorAll('.ml-timer-btn').forEach(btn => {
        btn.addEventListener('click', () => setTimer(parseInt(btn.dataset.timer)));
    });

    // Resize 2D (largeur + hauteur de la zone de lettres)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = tilesZone.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(380, startW + ev.clientX - startX) + 'px';
            tilesZone.style.height = Math.max(60,  startH + ev.clientY - startY) + 'px';
            applyTileSize();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = tilesZone.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width  = Math.max(380, startW + t.clientX - startX) + 'px';
            tilesZone.style.height = Math.max(60,  startH + t.clientY - startY) + 'px';
            applyTileSize();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '🔤 Le mot le plus long', {
            onExpand: () => applyTileSize()
        });
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = tilesZone.style.height;
            container.classList.add('wf-fullboard');
            tilesZone.style.height = Math.round(window.innerHeight * 0.38) + 'px';
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) tilesZone.style.height = _savedH;
        }
        requestAnimationFrame(applyTileSize);
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        stopChrono();
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

    renderTiles();
    updateDrawBar();
    requestAnimationFrame(() => requestAnimationFrame(applyTileSize));

    // Préchargement du dictionnaire externe pendant le tirage
    _mlLoadExternal();

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._mlGetData = () => ({
        containerW: container.offsetWidth,
        tilesH:     tilesZone.offsetHeight,
        letters:    letters.slice(),
        timer:      timerMode
    });
    widget._mlSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width  = d.containerW + 'px';
        if (d.tilesH)     tilesZone.style.height = d.tilesH + 'px';
        if (typeof d.timer === 'number') {
            timerMode = d.timer;
            widget.dataset.mlTimer = d.timer;
            badge.textContent = ML_TIMERS[d.timer] || 'Sans chrono';
            container.querySelectorAll('.ml-timer-btn').forEach(b => {
                b.classList.toggle('active', parseInt(b.dataset.timer) === d.timer);
            });
        }
        if (Array.isArray(d.letters)) {
            letters = d.letters.filter(l => /^[A-Z]$/.test(l)).slice(0, 9);
            renderTiles();
            updateDrawBar();
            if (letters.length === 9) {
                searchSolutions();
                // Pas de relance du chrono à la restauration
                chronoEl.style.display = 'none';
            }
        }
        requestAnimationFrame(applyTileSize);
    };

    saveBoard();
    return widget;
}
