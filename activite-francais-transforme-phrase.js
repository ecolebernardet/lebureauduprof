// =========================================================================
// WIDGET TRANSFORME LA PHRASE — Le Bureau du Prof
// Rituel de grammaire : une phrase de départ et une contrainte tirée au sort
//   ⏳ changer de temps (futur, imparfait, passé composé)
//   👥 passer le sujet au pluriel (ou au singulier)
//   🚫 mettre la phrase à la forme négative
//   🔁 remplacer le sujet par un pronom
// La classe transforme la phrase (sur l'ardoise, ou proposition tapée par
// l'enseignant), puis la correction s'affiche avec les mots qui ont changé
// surlignés et un petit rappel de la règle. Minuteur facultatif.
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

    if (document.getElementById('tfp-style')) return;
    const s = document.createElement('style');
    s.id = 'tfp-style';
    s.textContent = `
        .widget[data-type="transforme-phrase"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: default;
        }
        .tfp-container {
            --tfp-fs: 34px;
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
        .tfp-container input, .tfp-container select { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .tfp-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: grab; }
        .tfp-header:active { cursor: grabbing; }
        .tfp-container.wf-fullboard .tfp-header { cursor: default; }
        .tfp-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .tfp-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #e0e7ff; color: #3730a3; }

        /* Réduit / plein écran */
        .tfp-container.wf-minimized > *:not(.tfp-header) { display: none !important; }
        .tfp-container.wf-minimized { gap: 0; }
        .tfp-container.wf-fullboard {
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
            .tfp-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .tfp-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .tfp-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .tfp-btn:active { transform: scale(0.96); }
        .tfp-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .tfp-btn-blue  { background: #4a90e2; color: #fff; }
        .tfp-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .tfp-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .tfp-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .tfp-btn-green { background: #28a745; color: #fff; }
        .tfp-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .tfp-btn-big { font-size: 13px; padding: 7px 16px; }
        .tfp-btn.on { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
        .tfp-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .tfp-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .tfp-level-btn:hover { background: #e0e0e0; }
        .tfp-level-btn.active { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
        .tfp-count { font-size: 12px; font-weight: 700; color: #6b7280; }

        /* Réglages */
        .tfp-settings {
            display: none; gap: 8px 14px; flex-wrap: wrap; align-items: center;
            padding: 8px 10px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
            font-size: 12px; color: #374151;
        }
        .tfp-settings.show { display: flex; }
        .tfp-settings b { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .4px; }
        .tfp-chip {
            padding: 4px 10px; border-radius: 20px; border: 2px solid #e5e7eb; background: #fff;
            font-size: 12px; font-weight: 700; cursor: pointer; color: #9ca3af;
        }
        .tfp-chip.on { border-color: var(--cc, #4a90e2); color: var(--cc, #4a90e2); background: var(--cl, #eef5ff); }
        .tfp-settings select { padding: 3px 6px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; }

        /* Phrase de départ et contrainte */
        .tfp-stage {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: .35em; padding: 10px 16px;
            background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 12px;
            box-sizing: border-box; flex-shrink: 0; overflow: hidden;
        }
        .tfp-phrase {
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; color: #1f2937;
            font-size: var(--tfp-fs); line-height: 1.25; text-align: center;
        }
        .tfp-empty { font-size: 17px; color: #9ca3af; font-weight: 600; text-align: center; }
        .tfp-arrow { font-size: calc(var(--tfp-fs) * .55); color: #9ca3af; line-height: 1; }
        .tfp-card {
            display: inline-flex; align-items: center; gap: .45em;
            padding: .35em .9em; border-radius: .6em;
            background: var(--cl); color: var(--cc); border: .1em solid var(--cc);
            font-size: calc(var(--tfp-fs) * .62); font-weight: 700; text-align: center;
            box-shadow: 0 .1em .3em rgba(0,0,0,.1);
        }
        .tfp-card b { font-weight: 900; text-transform: uppercase; }
        .tfp-card .ico { font-size: 1.3em; }
        .tfp-card.rolling { animation: tfpRoll .12s linear infinite; }
        .tfp-card.landed { animation: tfpLand .45s ease-out; }
        @keyframes tfpRoll { 0% { transform: translateY(-2px); } 50% { transform: translateY(2px); } 100% { transform: translateY(-2px); } }
        @keyframes tfpLand { 0% { transform: scale(.6); opacity: .3; } 60% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }

        /* Proposition de la classe + minuteur */
        .tfp-answer-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .tfp-input {
            flex: 1; min-width: 220px; padding: 7px 10px; border: 2px solid #ddd; border-radius: 8px;
            font-size: 16px; outline: none;
        }
        .tfp-input:focus { border-color: #4a90e2; }
        .tfp-timer { display: none; align-items: center; gap: 8px; }
        .tfp-timer.show { display: flex; }
        .tfp-timer-bar { flex: 1; height: 10px; border-radius: 6px; background: #e5e7eb; overflow: hidden; min-width: 120px; }
        .tfp-timer-fill { height: 100%; width: 100%; background: #22c55e; transition: width .25s linear, background .3s; }
        .tfp-timer-txt { font-size: 13px; font-weight: 800; color: #374151; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; }
        .tfp-timer.over .tfp-timer-txt { color: #dc2626; animation: tfpBlink .8s ease-in-out infinite; }
        @keyframes tfpBlink { 50% { opacity: .3; } }

        /* Correction */
        .tfp-corr {
            display: none; padding: 10px 14px; border-radius: 12px;
            background: #f0fff4; border: 1px solid #b7e4c7; color: #14532d;
            animation: tfpFade .35s ease-out;
        }
        .tfp-corr.show { display: block; }
        .tfp-corr-phrase {
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; color: #14532d;
            font-size: calc(var(--tfp-fs) * .85); line-height: 1.3; text-align: center; margin: 2px 0 6px;
        }
        .tfp-corr-phrase mark { background: #fde68a; color: inherit; padding: 0 .12em; border-radius: .18em; }
        .tfp-tip { font-size: 15px; line-height: 1.45; color: #1f4d33; }
        .tfp-class { font-size: 15px; font-weight: 700; margin-top: 6px; }
        .tfp-class.ok { color: #15803d; }
        .tfp-class.ko { color: #b91c1c; }
        @keyframes tfpFade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Aide */
        .tfp-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tfp-help-btn:hover { background: #e0e0e0; color: #333; }
        .tfp-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 330px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .tfp-help-popup.show { display: block; }
        .tfp-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .tfp-help-popup p { margin: 0 0 6px; }
        .tfp-help-popup p:last-child { margin-bottom: 0; }

        .tfp-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .tfp-container:hover .tfp-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Contraintes ───────────────────────────────────────────────────────────
const TFP_TYPES = {
    temps:  { nom: 'Changer de temps',     ico: '⏳', c: '#2563eb', l: '#dbeafe' },
    nombre: { nom: 'Singulier / pluriel',  ico: '👥', c: '#15803d', l: '#dcfce7' },
    neg:    { nom: 'Forme négative',       ico: '🚫', c: '#dc2626', l: '#fee2e2' },
    pronom: { nom: 'Sujet → pronom',       ico: '🔁', c: '#c2410c', l: '#ffedd5' }
};
const TFP_TENSES = {
    fut: { nom: 'futur' },
    imp: { nom: 'imparfait' },
    pc:  { nom: 'passé composé' }
};
const TFP_LEVELS = {
    '1': { label: 'Niveau 1', titre: 'Niveau 1 : phrases courtes, verbes fréquents' },
    '2': { label: 'Niveau 2', titre: 'Niveau 2 : verbes du 3e groupe, groupes nominaux plus longs' }
};

// ── Banque de phrases ─────────────────────────────────────────────────────
// p : phrase de départ (au présent), v : verbe, n : nombre du sujet (s / p),
// fut, imp, pc : la phrase au futur, à l'imparfait, au passé composé,
// pl : le sujet passé au pluriel (ou au singulier si n = p),
// neg : la forme négative, pr : le sujet remplacé par un pronom.
const TFP_BANQUE = {
    '1': [
        { p: "Le chat dort sur le canapé.", v: "dormir", n: "s",
          fut: "Le chat dormira sur le canapé.", imp: "Le chat dormait sur le canapé.", pc: "Le chat a dormi sur le canapé.",
          pl: "Les chats dorment sur le canapé.", neg: "Le chat ne dort pas sur le canapé.", pr: "Il dort sur le canapé." },
        { p: "La petite fille regarde les étoiles.", v: "regarder", n: "s",
          fut: "La petite fille regardera les étoiles.", imp: "La petite fille regardait les étoiles.", pc: "La petite fille a regardé les étoiles.",
          pl: "Les petites filles regardent les étoiles.", neg: "La petite fille ne regarde pas les étoiles.", pr: "Elle regarde les étoiles." },
        { p: "Mon frère joue au football.", v: "jouer", n: "s",
          fut: "Mon frère jouera au football.", imp: "Mon frère jouait au football.", pc: "Mon frère a joué au football.",
          pl: "Mes frères jouent au football.", neg: "Mon frère ne joue pas au football.", pr: "Il joue au football." },
        { p: "Le maître explique la leçon.", v: "expliquer", n: "s",
          fut: "Le maître expliquera la leçon.", imp: "Le maître expliquait la leçon.", pc: "Le maître a expliqué la leçon.",
          pl: "Les maîtres expliquent la leçon.", neg: "Le maître n'explique pas la leçon.", pr: "Il explique la leçon." },
        { p: "Les enfants chantent dans la chorale.", v: "chanter", n: "p",
          fut: "Les enfants chanteront dans la chorale.", imp: "Les enfants chantaient dans la chorale.", pc: "Les enfants ont chanté dans la chorale.",
          pl: "L'enfant chante dans la chorale.", neg: "Les enfants ne chantent pas dans la chorale.", pr: "Ils chantent dans la chorale." },
        { p: "Le bébé pleure la nuit.", v: "pleurer", n: "s",
          fut: "Le bébé pleurera la nuit.", imp: "Le bébé pleurait la nuit.", pc: "Le bébé a pleuré la nuit.",
          pl: "Les bébés pleurent la nuit.", neg: "Le bébé ne pleure pas la nuit.", pr: "Il pleure la nuit." },
        { p: "Ma voisine arrose les fleurs.", v: "arroser", n: "s",
          fut: "Ma voisine arrosera les fleurs.", imp: "Ma voisine arrosait les fleurs.", pc: "Ma voisine a arrosé les fleurs.",
          pl: "Mes voisines arrosent les fleurs.", neg: "Ma voisine n'arrose pas les fleurs.", pr: "Elle arrose les fleurs." },
        { p: "Le train arrive en gare.", v: "arriver", n: "s",
          fut: "Le train arrivera en gare.", imp: "Le train arrivait en gare.", pc: "Le train est arrivé en gare.",
          pl: "Les trains arrivent en gare.", neg: "Le train n'arrive pas en gare.", pr: "Il arrive en gare." },
        { p: "La maîtresse est contente.", v: "être", n: "s",
          fut: "La maîtresse sera contente.", imp: "La maîtresse était contente.", pc: "La maîtresse a été contente.",
          pl: "Les maîtresses sont contentes.", neg: "La maîtresse n'est pas contente.", pr: "Elle est contente." },
        { p: "Le chien a soif.", v: "avoir", n: "s",
          fut: "Le chien aura soif.", imp: "Le chien avait soif.", pc: "Le chien a eu soif.",
          pl: "Les chiens ont soif.", neg: "Le chien n'a pas soif.", pr: "Il a soif." },
        { p: "Mon cousin habite à Lyon.", v: "habiter", n: "s",
          fut: "Mon cousin habitera à Lyon.", imp: "Mon cousin habitait à Lyon.", pc: "Mon cousin a habité à Lyon.",
          pl: "Mes cousins habitent à Lyon.", neg: "Mon cousin n'habite pas à Lyon.", pr: "Il habite à Lyon." },
        { p: "La fermière nourrit les poules.", v: "nourrir", n: "s",
          fut: "La fermière nourrira les poules.", imp: "La fermière nourrissait les poules.", pc: "La fermière a nourri les poules.",
          pl: "Les fermières nourrissent les poules.", neg: "La fermière ne nourrit pas les poules.", pr: "Elle nourrit les poules." },
        { p: "L'oiseau vole au-dessus du lac.", v: "voler", n: "s",
          fut: "L'oiseau volera au-dessus du lac.", imp: "L'oiseau volait au-dessus du lac.", pc: "L'oiseau a volé au-dessus du lac.",
          pl: "Les oiseaux volent au-dessus du lac.", neg: "L'oiseau ne vole pas au-dessus du lac.", pr: "Il vole au-dessus du lac." },
        { p: "Le garçon finit l'exercice.", v: "finir", n: "s",
          fut: "Le garçon finira l'exercice.", imp: "Le garçon finissait l'exercice.", pc: "Le garçon a fini l'exercice.",
          pl: "Les garçons finissent l'exercice.", neg: "Le garçon ne finit pas l'exercice.", pr: "Il finit l'exercice." },
        { p: "Les élèves rangent la classe.", v: "ranger", n: "p",
          fut: "Les élèves rangeront la classe.", imp: "Les élèves rangeaient la classe.", pc: "Les élèves ont rangé la classe.",
          pl: "L'élève range la classe.", neg: "Les élèves ne rangent pas la classe.", pr: "Ils rangent la classe." },
        { p: "Ma sœur va à la piscine.", v: "aller", n: "s",
          fut: "Ma sœur ira à la piscine.", imp: "Ma sœur allait à la piscine.", pc: "Ma sœur est allée à la piscine.",
          pl: "Mes sœurs vont à la piscine.", neg: "Ma sœur ne va pas à la piscine.", pr: "Elle va à la piscine." },
        { p: "Le lapin saute dans l'herbe.", v: "sauter", n: "s",
          fut: "Le lapin sautera dans l'herbe.", imp: "Le lapin sautait dans l'herbe.", pc: "Le lapin a sauté dans l'herbe.",
          pl: "Les lapins sautent dans l'herbe.", neg: "Le lapin ne saute pas dans l'herbe.", pr: "Il saute dans l'herbe." },
        { p: "Les filles dansent sur la scène.", v: "danser", n: "p",
          fut: "Les filles danseront sur la scène.", imp: "Les filles dansaient sur la scène.", pc: "Les filles ont dansé sur la scène.",
          pl: "La fille danse sur la scène.", neg: "Les filles ne dansent pas sur la scène.", pr: "Elles dansent sur la scène." },
        { p: "Le boulanger prépare le pain.", v: "préparer", n: "s",
          fut: "Le boulanger préparera le pain.", imp: "Le boulanger préparait le pain.", pc: "Le boulanger a préparé le pain.",
          pl: "Les boulangers préparent le pain.", neg: "Le boulanger ne prépare pas le pain.", pr: "Il prépare le pain." },
        { p: "La voiture roule vite.", v: "rouler", n: "s",
          fut: "La voiture roulera vite.", imp: "La voiture roulait vite.", pc: "La voiture a roulé vite.",
          pl: "Les voitures roulent vite.", neg: "La voiture ne roule pas vite.", pr: "Elle roule vite." }
    ],
    '2': [
        { p: "Le petit garçon prend le bus.", v: "prendre", n: "s",
          fut: "Le petit garçon prendra le bus.", imp: "Le petit garçon prenait le bus.", pc: "Le petit garçon a pris le bus.",
          pl: "Les petits garçons prennent le bus.", neg: "Le petit garçon ne prend pas le bus.", pr: "Il prend le bus." },
        { p: "La jeune fille part en voyage.", v: "partir", n: "s",
          fut: "La jeune fille partira en voyage.", imp: "La jeune fille partait en voyage.", pc: "La jeune fille est partie en voyage.",
          pl: "Les jeunes filles partent en voyage.", neg: "La jeune fille ne part pas en voyage.", pr: "Elle part en voyage." },
        { p: "Le vieux pêcheur voit la mer.", v: "voir", n: "s",
          fut: "Le vieux pêcheur verra la mer.", imp: "Le vieux pêcheur voyait la mer.", pc: "Le vieux pêcheur a vu la mer.",
          pl: "Les vieux pêcheurs voient la mer.", neg: "Le vieux pêcheur ne voit pas la mer.", pr: "Il voit la mer." },
        { p: "Mon amie fait les courses.", v: "faire", n: "s",
          fut: "Mon amie fera les courses.", imp: "Mon amie faisait les courses.", pc: "Mon amie a fait les courses.",
          pl: "Mes amies font les courses.", neg: "Mon amie ne fait pas les courses.", pr: "Elle fait les courses." },
        { p: "Le chevalier courageux combat le dragon.", v: "combattre", n: "s",
          fut: "Le chevalier courageux combattra le dragon.", imp: "Le chevalier courageux combattait le dragon.", pc: "Le chevalier courageux a combattu le dragon.",
          pl: "Les chevaliers courageux combattent le dragon.", neg: "Le chevalier courageux ne combat pas le dragon.", pr: "Il combat le dragon." },
        { p: "L'élève attentive écoute la consigne.", v: "écouter", n: "s",
          fut: "L'élève attentive écoutera la consigne.", imp: "L'élève attentive écoutait la consigne.", pc: "L'élève attentive a écouté la consigne.",
          pl: "Les élèves attentives écoutent la consigne.", neg: "L'élève attentive n'écoute pas la consigne.", pr: "Elle écoute la consigne." },
        { p: "Le jardinier cueille les tomates mûres.", v: "cueillir", n: "s",
          fut: "Le jardinier cueillera les tomates mûres.", imp: "Le jardinier cueillait les tomates mûres.", pc: "Le jardinier a cueilli les tomates mûres.",
          pl: "Les jardiniers cueillent les tomates mûres.", neg: "Le jardinier ne cueille pas les tomates mûres.", pr: "Il cueille les tomates mûres." },
        { p: "La chanteuse célèbre vient au concert.", v: "venir", n: "s",
          fut: "La chanteuse célèbre viendra au concert.", imp: "La chanteuse célèbre venait au concert.", pc: "La chanteuse célèbre est venue au concert.",
          pl: "Les chanteuses célèbres viennent au concert.", neg: "La chanteuse célèbre ne vient pas au concert.", pr: "Elle vient au concert." },
        { p: "Le loup affamé sort de la forêt.", v: "sortir", n: "s",
          fut: "Le loup affamé sortira de la forêt.", imp: "Le loup affamé sortait de la forêt.", pc: "Le loup affamé est sorti de la forêt.",
          pl: "Les loups affamés sortent de la forêt.", neg: "Le loup affamé ne sort pas de la forêt.", pr: "Il sort de la forêt." },
        { p: "Mon oncle lit le journal.", v: "lire", n: "s",
          fut: "Mon oncle lira le journal.", imp: "Mon oncle lisait le journal.", pc: "Mon oncle a lu le journal.",
          pl: "Mes oncles lisent le journal.", neg: "Mon oncle ne lit pas le journal.", pr: "Il lit le journal." },
        { p: "La maîtresse écrit la date au tableau.", v: "écrire", n: "s",
          fut: "La maîtresse écrira la date au tableau.", imp: "La maîtresse écrivait la date au tableau.", pc: "La maîtresse a écrit la date au tableau.",
          pl: "Les maîtresses écrivent la date au tableau.", neg: "La maîtresse n'écrit pas la date au tableau.", pr: "Elle écrit la date au tableau." },
        { p: "Le cheval blanc boit à la rivière.", v: "boire", n: "s",
          fut: "Le cheval blanc boira à la rivière.", imp: "Le cheval blanc buvait à la rivière.", pc: "Le cheval blanc a bu à la rivière.",
          pl: "Les chevaux blancs boivent à la rivière.", neg: "Le cheval blanc ne boit pas à la rivière.", pr: "Il boit à la rivière." },
        { p: "L'enfant peut sortir dans la cour.", v: "pouvoir", n: "s",
          fut: "L'enfant pourra sortir dans la cour.", imp: "L'enfant pouvait sortir dans la cour.", pc: "L'enfant a pu sortir dans la cour.",
          pl: "Les enfants peuvent sortir dans la cour.", neg: "L'enfant ne peut pas sortir dans la cour.", pr: "Il peut sortir dans la cour." },
        { p: "Le skieur descend la piste noire.", v: "descendre", n: "s",
          fut: "Le skieur descendra la piste noire.", imp: "Le skieur descendait la piste noire.", pc: "Le skieur a descendu la piste noire.",
          pl: "Les skieurs descendent la piste noire.", neg: "Le skieur ne descend pas la piste noire.", pr: "Il descend la piste noire." },
        { p: "La mouette blanche survole le port.", v: "survoler", n: "s",
          fut: "La mouette blanche survolera le port.", imp: "La mouette blanche survolait le port.", pc: "La mouette blanche a survolé le port.",
          pl: "Les mouettes blanches survolent le port.", neg: "La mouette blanche ne survole pas le port.", pr: "Elle survole le port." },
        { p: "Les touristes visitent le vieux château.", v: "visiter", n: "p",
          fut: "Les touristes visiteront le vieux château.", imp: "Les touristes visitaient le vieux château.", pc: "Les touristes ont visité le vieux château.",
          pl: "Le touriste visite le vieux château.", neg: "Les touristes ne visitent pas le vieux château.", pr: "Ils visitent le vieux château." },
        { p: "Les hirondelles reviennent au printemps.", v: "revenir", n: "p",
          fut: "Les hirondelles reviendront au printemps.", imp: "Les hirondelles revenaient au printemps.", pc: "Les hirondelles sont revenues au printemps.",
          pl: "L'hirondelle revient au printemps.", neg: "Les hirondelles ne reviennent pas au printemps.", pr: "Elles reviennent au printemps." },
        { p: "Le médecin soigne le malade.", v: "soigner", n: "s",
          fut: "Le médecin soignera le malade.", imp: "Le médecin soignait le malade.", pc: "Le médecin a soigné le malade.",
          pl: "Les médecins soignent le malade.", neg: "Le médecin ne soigne pas le malade.", pr: "Il soigne le malade." },
        { p: "La méchante sorcière prépare la potion magique.", v: "préparer", n: "s",
          fut: "La méchante sorcière préparera la potion magique.", imp: "La méchante sorcière préparait la potion magique.", pc: "La méchante sorcière a préparé la potion magique.",
          pl: "Les méchantes sorcières préparent la potion magique.", neg: "La méchante sorcière ne prépare pas la potion magique.", pr: "Elle prépare la potion magique." },
        { p: "Le nouveau directeur dit bonjour aux élèves.", v: "dire", n: "s",
          fut: "Le nouveau directeur dira bonjour aux élèves.", imp: "Le nouveau directeur disait bonjour aux élèves.", pc: "Le nouveau directeur a dit bonjour aux élèves.",
          pl: "Les nouveaux directeurs disent bonjour aux élèves.", neg: "Le nouveau directeur ne dit pas bonjour aux élèves.", pr: "Il dit bonjour aux élèves." }
    ]
};

// ── Outils ────────────────────────────────────────────────────────────────
function _tfpEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Découpe en mots pour comparer : « l'oiseau » donne « l' » + « oiseau », la ponctuation est à part
function _tfpWords(s) {
    return String(s || '').replace(/[’`]/g, "'").replace(/([.,!?;:])/g, ' $1').replace(/'/g, "' ").trim().split(/\s+/).filter(Boolean);
}
function _tfpNorm(s) {
    return _tfpWords(s).map(w => w.toLowerCase()).filter(w => !/^[.,!?;:]$/.test(w)).join(' ');
}
// Surligne dans b les mots qui ne sont pas dans a (plus longue sous-suite commune)
function _tfpDiffHTML(a, b) {
    const A = _tfpWords(a), B = _tfpWords(b);
    const al = A.map(w => w.toLowerCase()), bl = B.map(w => w.toLowerCase());
    const n = A.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
        L[i][j] = al[i] === bl[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
    const keep = new Array(m).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) {
        if (al[i] === bl[j]) { keep[j] = true; i++; j++; }
        else if (L[i + 1][j] >= L[i][j + 1]) i++;
        else j++;
    }
    let out = '';
    B.forEach((w, k) => {
        const punct = /^[.,!?;:]$/.test(w);
        if (k > 0 && !/'$/.test(B[k - 1]) && !(punct && w !== '!' && w !== '?' && w !== ';' && w !== ':')) out += ' ';
        const t = _tfpEsc(w);
        out += (keep[k] || punct) ? t : '<mark>' + t + '</mark>';
    });
    return out.replace(/<\/mark><mark>/g, '').replace(/<\/mark> <mark>/g, ' ');
}
function _tfpIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

// ── Création du widget ────────────────────────────────────────────────────
function createTransformePhraseWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'transforme-phrase';
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
    container.className = 'tfp-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'tfp-header';
    header.innerHTML = `
        <span class="tfp-title">🔄 Transforme la phrase</span>
        <span class="tfp-badge">Niveau 1</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.tfp-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'tfp-row';
    controls.innerHTML = `
        <button class="tfp-btn tfp-btn-green tfp-btn-big" data-act="draw" title="Une nouvelle phrase et une contrainte au hasard">🎲 Nouvelle transformation</button>
        <button class="tfp-btn tfp-btn-grey" data-act="other" title="Garder la phrase, tirer une autre contrainte">🔁 Autre contrainte</button>
        <button class="tfp-btn tfp-btn-grey" data-act="settings" title="Choisir les contraintes, les temps et le minuteur">⚙️ Réglages</button>
        <span class="tfp-count"></span>
        <div class="tfp-level-btns">
            ${Object.keys(TFP_LEVELS).map(k => `<button class="tfp-level-btn" data-level="${k}" title="${TFP_LEVELS[k].titre}">${TFP_LEVELS[k].label}</button>`).join('')}
        </div>
    `;
    const otherBtn    = controls.querySelector('[data-act="other"]');
    const settingsBtn = controls.querySelector('[data-act="settings"]');
    const countEl     = controls.querySelector('.tfp-count');
    container.appendChild(controls);

    // ── Réglages ──────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'tfp-settings';
    settings.innerHTML = `
        <b>Contraintes</b>
        ${Object.keys(TFP_TYPES).map(k => `<button class="tfp-chip" data-type="${k}" style="--cc:${TFP_TYPES[k].c};--cl:${TFP_TYPES[k].l}">${TFP_TYPES[k].ico} ${TFP_TYPES[k].nom}</button>`).join('')}
        <b>Temps</b>
        ${Object.keys(TFP_TENSES).map(k => `<button class="tfp-chip" data-tense="${k}" style="--cc:#2563eb;--cl:#dbeafe">${TFP_TENSES[k].nom}</button>`).join('')}
        <b>Minuteur</b>
        <select data-role="timer">
            <option value="0">Sans</option>
            <option value="30">30 s</option>
            <option value="60">1 min</option>
            <option value="90">1 min 30</option>
            <option value="120">2 min</option>
        </select>
    `;
    const timerSel = settings.querySelector('[data-role="timer"]');
    container.appendChild(settings);

    // ── Phrase de départ et contrainte ────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'tfp-stage';
    stage.style.height = Math.round(initH * 0.42) + 'px';
    container.appendChild(stage);

    // ── Proposition de la classe + minuteur ──────────────────────────────
    const answerRow = document.createElement('div');
    answerRow.className = 'tfp-answer-row';
    answerRow.innerHTML = `
        <input class="tfp-input" type="text" maxlength="200" placeholder="Proposition de la classe (facultatif) : tapez-la ici avant la correction" spellcheck="false" autocomplete="off">
        <button class="tfp-btn tfp-btn-blue tfp-btn-big" data-act="correct">✅ Correction</button>
        <button class="tfp-btn tfp-btn-grey" data-act="hide">🙈 Cacher</button>
    `;
    const input   = answerRow.querySelector('.tfp-input');
    const corrBtn = answerRow.querySelector('[data-act="correct"]');
    const hideBtn = answerRow.querySelector('[data-act="hide"]');
    container.appendChild(answerRow);

    const timerEl = document.createElement('div');
    timerEl.className = 'tfp-timer';
    timerEl.innerHTML = `<span>⏱️</span><div class="tfp-timer-bar"><div class="tfp-timer-fill"></div></div><span class="tfp-timer-txt"></span>`;
    const timerFill = timerEl.querySelector('.tfp-timer-fill');
    const timerTxt  = timerEl.querySelector('.tfp-timer-txt');
    container.appendChild(timerEl);

    // ── Correction ────────────────────────────────────────────────────────
    const corr = document.createElement('div');
    corr.className = 'tfp-corr';
    container.appendChild(corr);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'tfp-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'tfp-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Transforme la phrase</h4>
        <p><b>🎲 Nouvelle transformation</b> tire au sort une phrase et une contrainte : changer de temps,
        passer le sujet au pluriel (ou au singulier), mettre à la forme négative ou remplacer le sujet par un pronom.</p>
        <p>La classe écrit la phrase transformée sur l'ardoise. Vous pouvez taper une proposition dans le champ :
        elle sera comparée à la correction.</p>
        <p><b>✅ Correction</b> affiche la bonne phrase : les mots qui ont changé sont <mark>surlignés</mark>,
        avec un rappel de la règle.</p>
        <p><b>🔁 Autre contrainte</b> garde la même phrase. Dans <b>⚙️ Réglages</b>, choisissez les contraintes,
        les temps travaillés et un minuteur.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'tfp-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let level = '1';
    let idx = -1;              // phrase en cours (-1 : aucune)
    let cons = null;           // { type, tense }
    let revealed = false;
    let count = 0;
    let types  = { temps: true, nombre: true, neg: true, pronom: true };
    let tenses = { fut: true, imp: true, pc: true };
    let timerDur = 0, timerEnd = 0, timerIv = null;
    let showSettings = false;
    let rolling = false;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function list() { return TFP_BANQUE[level] || []; }
    function cur() { return idx >= 0 ? list()[idx] : null; }

    // ── Tirage ────────────────────────────────────────────────────────────
    function availableConstraints() {
        const a = [];
        if (types.temps) Object.keys(tenses).forEach(t => { if (tenses[t]) a.push({ type: 'temps', tense: t }); });
        ['nombre', 'neg', 'pronom'].forEach(k => { if (types[k]) a.push({ type: k }); });
        return a.length ? a : [{ type: 'neg' }];
    }
    function sameCons(a, b) { return a && b && a.type === b.type && (a.tense || '') === (b.tense || ''); }
    function pickConstraint(avoid) {
        const a = availableConstraints();
        const pool = a.length > 1 ? a.filter(c => !sameCons(c, avoid)) : a;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    function answerOf(p, c) {
        if (!p || !c) return '';
        if (c.type === 'temps') return p[c.tense];
        if (c.type === 'nombre') return p.pl;
        if (c.type === 'neg') return p.neg;
        return p.pr;
    }

    function draw(keepPhrase) {
        const n = list().length;
        if (!keepPhrase || idx < 0) {
            let r = Math.floor(Math.random() * n);
            if (n > 1) while (r === idx) r = Math.floor(Math.random() * n);
            idx = r;
        }
        const target = pickConstraint(keepPhrase ? cons : null);
        revealed = false;
        input.value = '';
        count++;
        rollTo(target);
    }

    // Petite animation : la carte de contrainte « roule » avant de s'arrêter
    function rollTo(target) {
        const all = availableConstraints();
        rolling = true;
        let k = 0;
        const steps = 9;
        renderAll();
        const card = stage.querySelector('.tfp-card');
        function tick() {
            if (k < steps) {
                const c = all[Math.floor(Math.random() * all.length)];
                paintCard(card, c, true);
                k++;
                setTimeout(tick, 70 + k * 12);
            } else {
                rolling = false;
                cons = target;
                renderAll(true);
                startTimer();
                save();
            }
        }
        tick();
    }

    // ── Minuteur ──────────────────────────────────────────────────────────
    function stopTimer() {
        if (timerIv) { clearInterval(timerIv); timerIv = null; }
    }
    function startTimer() {
        stopTimer();
        if (!timerDur) { timerEl.classList.remove('show'); return; }
        timerEnd = Date.now() + timerDur * 1000;
        timerEl.classList.add('show');
        timerEl.classList.remove('over');
        updTimer();
        timerIv = setInterval(updTimer, 250);
    }
    function updTimer() {
        if (!document.body.contains(widget)) { stopTimer(); return; }
        const left = Math.max(0, timerEnd - Date.now());
        const ratio = left / (timerDur * 1000);
        timerFill.style.width = (ratio * 100) + '%';
        timerFill.style.background = ratio > .5 ? '#22c55e' : ratio > .2 ? '#f59e0b' : '#ef4444';
        const sec = Math.ceil(left / 1000);
        timerTxt.textContent = left > 0 ? (Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')) : 'Fini !';
        if (left <= 0) { timerEl.classList.add('over'); stopTimer(); }
    }

    // ── Rendu ─────────────────────────────────────────────────────────────
    function consText(c, p) {
        if (!c) return '';
        if (c.type === 'temps')  return `Mets la phrase au <b>${TFP_TENSES[c.tense].nom}</b>.`;
        if (c.type === 'nombre') return p && p.n === 'p'
            ? 'Mets le sujet au <b>singulier</b> et fais les accords.'
            : 'Mets le sujet au <b>pluriel</b> et fais les accords.';
        if (c.type === 'neg')    return 'Mets la phrase à la <b>forme négative</b>.';
        return 'Remplace le sujet par un <b>pronom personnel</b>.';
    }
    function paintCard(card, c, isRolling) {
        const t = TFP_TYPES[c.type];
        card.style.setProperty('--cc', t.c);
        card.style.setProperty('--cl', t.l);
        card.innerHTML = `<span class="ico">${t.ico}</span><span>${consText(c, cur())}</span>`;
        card.classList.toggle('rolling', !!isRolling);
    }

    function renderStage(landed) {
        stage.innerHTML = '';
        const p = cur();
        if (!p) {
            stage.innerHTML = '<div class="tfp-empty">Cliquez sur <b>🎲 Nouvelle transformation</b> pour tirer une phrase et une contrainte.</div>';
            return;
        }
        const ph = document.createElement('div');
        ph.className = 'tfp-phrase';
        ph.textContent = p.p;
        const arrow = document.createElement('div');
        arrow.className = 'tfp-arrow';
        arrow.textContent = '⬇';
        const card = document.createElement('div');
        card.className = 'tfp-card' + (landed ? ' landed' : '');
        stage.appendChild(ph);
        stage.appendChild(arrow);
        stage.appendChild(card);
        if (cons || rolling) paintCard(card, cons || availableConstraints()[0], rolling);
    }

    function tipOf(p, c) {
        const verbe = `Verbe : <b>${_tfpEsc(p.v)}</b>.`;
        if (c.type === 'temps') {
            if (c.tense === 'fut') return `⏳ ${verbe} Au <b>futur</b>, on ajoute les terminaisons -ai, -as, -a, -ons, -ez, -ont (le plus souvent à l'infinitif). Attention aux verbes irréguliers (être → sera, aller → ira, voir → verra…).`;
            if (c.tense === 'imp') return `⏳ ${verbe} À l'<b>imparfait</b>, on part du radical du verbe conjugué avec « nous » au présent et on ajoute -ais, -ais, -ait, -ions, -iez, -aient.`;
            const etre = /\b(est|sont)\b/.test(p.pc) && !/\b(est|sont)\b/.test(p.p);
            return `⏳ ${verbe} Le <b>passé composé</b> = l'auxiliaire <b>avoir</b> ou <b>être</b> au présent + le <b>participe passé</b>.` +
                (etre ? ' Avec l\'auxiliaire <b>être</b>, le participe passé s\'accorde avec le sujet.' : '');
        }
        if (c.type === 'nombre') return '👥 Quand le sujet change de nombre, tout le groupe nominal s\'accorde (déterminant, nom, adjectif) et le <b>verbe</b> s\'accorde avec son sujet.';
        if (c.type === 'neg') return '🚫 La négation <b>encadre le verbe conjugué</b> : ne … pas. Devant une voyelle ou un h muet, « ne » devient « n\' ».';
        return '🔁 Le pronom personnel remplace <b>tout le groupe sujet</b> (il, elle, ils, elles) ; le verbe garde la même terminaison.';
    }

    function renderCorr() {
        const p = cur();
        if (!revealed || !p || !cons) { corr.classList.remove('show'); corr.innerHTML = ''; return; }
        const ans = answerOf(p, cons);
        let html = `<div class="tfp-corr-phrase">${_tfpDiffHTML(p.p, ans)}</div><div class="tfp-tip">${tipOf(p, cons)}</div>`;
        const prop = input.value.trim();
        if (prop) {
            const ok = _tfpNorm(prop) === _tfpNorm(ans);
            html += ok
                ? `<div class="tfp-class ok">✓ La proposition de la classe est juste, bravo !</div>`
                : `<div class="tfp-class ko">✗ La proposition de la classe : « ${_tfpEsc(prop)} ». Comparez-la avec la correction (les mots surlignés).</div>`;
        }
        corr.innerHTML = html;
        corr.classList.add('show');
    }

    function renderHeader() {
        badge.textContent = TFP_LEVELS[level].label;
        controls.querySelectorAll('.tfp-level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
        countEl.textContent = count ? `Transformation n° ${count}` : '';
        otherBtn.disabled = idx < 0 || rolling;
        settingsBtn.classList.toggle('on', showSettings);
        settings.classList.toggle('show', showSettings);
        settings.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('on', !!types[b.dataset.type]));
        settings.querySelectorAll('[data-tense]').forEach(b => {
            b.classList.toggle('on', !!tenses[b.dataset.tense]);
            b.style.opacity = types.temps ? '' : '.4';
        });
        timerSel.value = String(timerDur);
        corrBtn.disabled = !cons || rolling || idx < 0;
        hideBtn.disabled = !revealed;
    }

    function renderAll(landed) {
        renderHeader();
        renderStage(landed);
        renderCorr();
        requestAnimationFrame(fit);
    }

    // ── Taille du texte selon la place disponible ─────────────────────────
    function fit() {
        const sw = stage.clientWidth - 32, sh = stage.clientHeight - 20;
        if (sw <= 0 || sh <= 0) return;
        let size = Math.max(16, Math.min(sh / 3.2, sw / 18, 70));
        container.style.setProperty('--tfp-fs', size + 'px');
        let guard = 0;
        while ((stage.scrollHeight > stage.clientHeight + 1 || stage.scrollWidth > stage.clientWidth + 1) && size > 13 && guard++ < 80) {
            size *= 0.93;
            container.style.setProperty('--tfp-fs', size + 'px');
        }
    }

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-level],[data-type],[data-tense]');
        if (!b || !container.contains(b) || rolling) return;
        if (b.dataset.type) {
            const k = b.dataset.type;
            types[k] = !types[k];
            if (!Object.values(types).some(Boolean)) types[k] = true;   // au moins une contrainte
            renderHeader(); save(); return;
        }
        if (b.dataset.tense) {
            const k = b.dataset.tense;
            tenses[k] = !tenses[k];
            if (!Object.values(tenses).some(Boolean)) tenses[k] = true; // au moins un temps
            renderHeader(); save(); return;
        }
        if (b.dataset.level) {
            if (b.dataset.level === level) return;
            level = b.dataset.level;
            idx = -1; cons = null; revealed = false; input.value = '';
            stopTimer(); timerEl.classList.remove('show');
            renderAll(); save(); return;
        }
        switch (b.dataset.act) {
            case 'draw':     draw(false); break;
            case 'other':    draw(true); break;
            case 'settings': showSettings = !showSettings; renderAll(); save(); break;
            case 'correct':
                if (!cons) break;
                revealed = true;
                stopTimer();
                renderAll(); save();
                break;
            case 'hide':
                revealed = false;
                renderAll(); save();
                break;
        }
    });

    timerSel.addEventListener('change', () => {
        timerDur = parseInt(timerSel.value, 10) || 0;
        if (!timerDur) { stopTimer(); timerEl.classList.remove('show'); }
        save();
    });
    timerSel.addEventListener('keydown', (e) => e.stopPropagation());

    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && cons && !rolling) { revealed = true; stopTimer(); renderAll(); save(); }
    });
    input.addEventListener('click', (e) => { e.stopPropagation(); input.focus(); });
    input.addEventListener('change', save);

    [stage, settings, answerRow, corr, timerEl].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la zone de la phrase) ──
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(110, startH + y - y0) + 'px';
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
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); stopTimer(); return; }
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
            window._wfMiniBarCollapse(widget, '🔄 Transforme la phrase', { onExpand: () => requestAnimationFrame(fit) });
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
        stopTimer();
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

    renderAll();

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._tfpGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        level, idx,
        cons: rolling ? null : cons,
        revealed, count,
        prop: input.value,
        types: Object.assign({}, types),
        tenses: Object.assign({}, tenses),
        timer: timerDur,
        showSettings,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_tfpIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._tfpSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_tfpIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        level = TFP_LEVELS[d.level] ? String(d.level) : '1';
        const n = list().length;
        idx = (Number.isInteger(d.idx) && d.idx >= 0 && d.idx < n) ? d.idx : -1;
        cons = null;
        if (idx >= 0 && d.cons && TFP_TYPES[d.cons.type] && (d.cons.type !== 'temps' || TFP_TENSES[d.cons.tense])) {
            cons = { type: d.cons.type };
            if (d.cons.type === 'temps') cons.tense = d.cons.tense;
        }
        revealed = !!(d.revealed && cons);
        count = parseInt(d.count, 10) || 0;
        input.value = d.prop || '';
        if (d.types)  Object.keys(types).forEach(k => { if (typeof d.types[k] === 'boolean') types[k] = d.types[k]; });
        if (d.tenses) Object.keys(tenses).forEach(k => { if (typeof d.tenses[k] === 'boolean') tenses[k] = d.tenses[k]; });
        if (!Object.values(types).some(Boolean)) types.neg = true;
        if (!Object.values(tenses).some(Boolean)) tenses.fut = true;
        timerDur = [0, 30, 60, 90, 120].includes(d.timer) ? d.timer : 0;
        showSettings = !!d.showSettings;
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
