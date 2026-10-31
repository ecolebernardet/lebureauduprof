// =========================================================================
// WIDGET L'INTRUS — Le Bureau du Prof
// Rituel de vocabulaire : cinq mots dont un n'appartient pas à la catégorie.
//   🏷️ nature   🧺 champ lexical   🌳 famille de mots   👂 son
// La classe trouve l'intrus (clic sur l'étiquette choisie) et justifie son
// choix (à l'oral, ou justification tapée par l'enseignant). La correction
// montre l'intrus, le point commun des autres mots et l'explication.
// Indice facultatif (le type de catégorie), lecture à voix haute des mots
// (utile pour les sons), minuteur et score de la série.
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

    if (document.getElementById('itr-style')) return;
    const s = document.createElement('style');
    s.id = 'itr-style';
    s.textContent = `
        .widget[data-type="intrus"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .itr-container {
            --itr-fs: 34px;
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
        .itr-container input, .itr-container select { user-select: text; -webkit-user-select: text; font-family: inherit; }

        /* En-tête */
        .itr-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .itr-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .itr-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #fce7f3; color: #9d174d; }

        /* Réduit / plein écran */
        .itr-container.wf-minimized > *:not(.itr-header) { display: none !important; }
        .itr-container.wf-minimized { gap: 0; }
        .itr-container.wf-fullboard {
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
            .itr-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .itr-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .itr-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .itr-btn:active { transform: scale(0.96); }
        .itr-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .itr-btn-blue  { background: #4a90e2; color: #fff; }
        .itr-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .itr-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .itr-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .itr-btn-green { background: #28a745; color: #fff; }
        .itr-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .itr-btn-yellow { background: #fff7d6; color: #8a6100; border: 1px solid #f1dc94; }
        .itr-btn-yellow:hover:not(:disabled) { background: #fdeeb0; }
        .itr-btn-big { font-size: 13px; padding: 7px 16px; }
        .itr-btn.on { background: #fce7f3; color: #9d174d; border-color: #f9a8d4; }
        .itr-level-btns { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
        .itr-level-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd; background: #f5f5f5;
            font-size: 10px; font-weight: 700; cursor: pointer; color: #666;
        }
        .itr-level-btn:hover { background: #e0e0e0; }
        .itr-level-btn.active { background: #fce7f3; color: #9d174d; border-color: #f9a8d4; }
        .itr-score { font-size: 12px; font-weight: 700; color: #6b7280; }

        /* Réglages */
        .itr-settings {
            display: none; gap: 8px 14px; flex-wrap: wrap; align-items: center;
            padding: 8px 10px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
            font-size: 12px; color: #374151;
        }
        .itr-settings.show { display: flex; }
        .itr-settings b { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .4px; }
        .itr-chip {
            padding: 4px 10px; border-radius: 20px; border: 2px solid #e5e7eb; background: #fff;
            font-size: 12px; font-weight: 700; cursor: pointer; color: #9ca3af;
        }
        .itr-chip.on { border-color: var(--cc); color: var(--cc); background: var(--cl); }
        .itr-settings select { padding: 3px 6px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; }

        /* Scène */
        .itr-stage {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: .45em; padding: 12px 16px;
            background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 12px;
            box-sizing: border-box; flex-shrink: 0; overflow: hidden;
            font-size: var(--itr-fs);
        }
        .itr-question { font-size: .5em; font-weight: 800; color: #6b7280; text-align: center; }
        .itr-hint {
            display: inline-flex; align-items: center; gap: .35em;
            font-size: .46em; font-weight: 800; padding: .2em .8em; border-radius: 1em;
            background: var(--cl); color: var(--cc); border: .08em solid var(--cc);
        }
        .itr-words { display: flex; flex-wrap: wrap; justify-content: center; gap: .4em .5em; }
        .itr-card {
            position: relative;
            display: inline-flex; align-items: center; gap: .25em;
            padding: .2em .65em; border-radius: .4em;
            background: #fff; border: .07em solid #d1d5db;
            box-shadow: 0 .06em .2em rgba(0,0,0,.12);
            font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; color: #1f2937;
            cursor: pointer; transition: transform .12s, box-shadow .12s, border-color .15s, background .15s;
        }
        .itr-card:hover { transform: translateY(-.05em); box-shadow: 0 .12em .35em rgba(0,0,0,.18); }
        .itr-card.chosen { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 .08em #2563eb; }
        .itr-card .itr-speak {
            font-size: .45em; border: none; background: #f3f4f6; border-radius: 50%;
            width: 1.8em; height: 1.8em; cursor: pointer; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; padding: 0;
        }
        .itr-card .itr-speak:hover { background: #e5e7eb; }
        .itr-card .itr-tag {
            position: absolute; left: 50%; top: -.9em; transform: translateX(-50%);
            font-size: .32em; font-weight: 800; padding: .1em .55em; border-radius: 1em; white-space: nowrap;
            color: #fff; pointer-events: none;
        }
        .itr-card.is-intrus { border-color: #dc2626; background: #fef2f2; color: #991b1b; animation: itrShake .5s ease-out; }
        .itr-card.is-intrus .itr-tag { background: #dc2626; }
        .itr-card.is-member { border-color: #86efac; background: #f0fdf4; color: #166534; opacity: .9; }
        .itr-card.is-member .itr-tag { background: #16a34a; }
        @keyframes itrShake { 0%,100% { transform: none; } 20% { transform: translateX(-.08em) rotate(-2deg); } 40% { transform: translateX(.08em) rotate(2deg); } 60% { transform: translateX(-.05em); } 80% { transform: translateX(.05em); } }
        .itr-empty { font-size: 17px; color: #9ca3af; font-weight: 600; text-align: center; }

        /* Justification + minuteur */
        .itr-answer-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .itr-input { flex: 1; min-width: 220px; padding: 7px 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; outline: none; }
        .itr-input:focus { border-color: #4a90e2; }
        .itr-timer { display: none; align-items: center; gap: 8px; }
        .itr-timer.show { display: flex; }
        .itr-timer-bar { flex: 1; height: 10px; border-radius: 6px; background: #e5e7eb; overflow: hidden; min-width: 120px; }
        .itr-timer-fill { height: 100%; width: 100%; background: #22c55e; transition: width .25s linear, background .3s; }
        .itr-timer-txt { font-size: 13px; font-weight: 800; color: #374151; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; }
        .itr-timer.over .itr-timer-txt { color: #dc2626; animation: itrBlink .8s ease-in-out infinite; }
        @keyframes itrBlink { 50% { opacity: .3; } }

        /* Correction */
        .itr-corr {
            display: none; padding: 10px 14px; border-radius: 12px;
            background: #f0fff4; border: 1px solid #b7e4c7; color: #14532d;
            font-size: 17px; line-height: 1.45; animation: itrFade .35s ease-out;
        }
        .itr-corr.show { display: block; }
        .itr-corr .itr-type { display: inline-block; font-size: 12px; font-weight: 800; padding: 1px 9px; border-radius: 12px; margin-bottom: 4px; background: var(--cl); color: var(--cc); }
        .itr-corr .itr-res { font-weight: 800; margin-top: 4px; }
        .itr-corr .itr-res.ok { color: #15803d; }
        .itr-corr .itr-res.ko { color: #b91c1c; }
        .itr-corr .itr-just { font-size: 15px; color: #374151; margin-top: 4px; }
        @keyframes itrFade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }

        /* Aide */
        .itr-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .itr-help-btn:hover { background: #e0e0e0; color: #333; }
        .itr-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 330px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .itr-help-popup.show { display: block; }
        .itr-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .itr-help-popup p { margin: 0 0 6px; }
        .itr-help-popup p:last-child { margin-bottom: 0; }

        .itr-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .itr-container:hover .itr-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Catégories ────────────────────────────────────────────────────────────
const ITR_TYPES = {
    nat: { nom: 'Nature',          ico: '🏷️', c: '#9333ea', l: '#f3e8ff', indice: 'Regarde la nature des mots (nom, verbe, adjectif…).' },
    lex: { nom: 'Champ lexical',   ico: '🧺', c: '#0e7490', l: '#cffafe', indice: 'Cherche le thème commun à ces mots.' },
    fam: { nom: 'Famille de mots', ico: '🌳', c: '#15803d', l: '#dcfce7', indice: 'Cherche le radical commun : attention aux mots qui se ressemblent !' },
    son: { nom: 'Son',             ico: '👂', c: '#b45309', l: '#fef3c7', indice: 'Prononce les mots à voix haute et écoute bien.' }
};
const ITR_LEVELS = {
    '1': { label: 'Niveau 1', titre: 'Niveau 1 : catégories courantes' },
    '2': { label: 'Niveau 2', titre: 'Niveau 2 : pièges et catégories plus fines' }
};

// ── Banque ────────────────────────────────────────────────────────────────
// [ type, "mot1|mot2|mot3|mot4|mot5", position de l'intrus (0 à 4),
//   point commun des autres mots, explication de l'intrus ]
const ITR_BANQUE = {
    '1': [
        ['nat', "chat|table|courir|maison|vélo", 2, "Ce sont des noms.", "« courir » est un verbe : on peut le conjuguer (je cours)."],
        ['nat', "grand|petit|joli|manger|rouge", 3, "Ce sont des adjectifs : ils précisent un nom.", "« manger » est un verbe."],
        ['nat', "chanter|danser|sauter|bonheur|lire", 3, "Ce sont des verbes à l'infinitif.", "« bonheur » est un nom : on peut dire « le bonheur »."],
        ['nat', "le|une|des|mon|chien", 4, "Ce sont des déterminants.", "« chien » est un nom."],
        ['nat', "il|elle|nous|ils|vert", 4, "Ce sont des pronoms personnels.", "« vert » est un adjectif."],
        ['nat', "vite|lentement|souvent|beau|hier", 3, "Ce sont des mots invariables (des adverbes).", "« beau » est un adjectif : il s'accorde (belle, beaux)."],
        ['nat', "pomme|poire|sucré|fraise|prune", 2, "Ce sont des noms (de fruits).", "« sucré » est un adjectif."],
        ['nat', "finir|grandir|rougir|jardin|choisir", 3, "Ce sont des verbes à l'infinitif.", "« jardin » est un nom."],
        ['lex', "mer|plage|vague|sable|forêt", 4, "Ces mots parlent de la mer et de la plage.", "« forêt » n'appartient pas au thème de la mer."],
        ['lex', "école|cahier|cartable|maître|tracteur", 4, "Ces mots parlent de l'école.", "« tracteur » appartient au thème de la ferme."],
        ['lex', "pluie|neige|orage|soleil|fourchette", 4, "Ces mots parlent de la météo.", "« fourchette » appartient au thème du repas."],
        ['lex', "médecin|hôpital|malade|piqûre|ballon", 4, "Ces mots parlent de la santé.", "« ballon » appartient au thème du jeu ou du sport."],
        ['lex', "ferme|vache|tracteur|foin|fusée", 4, "Ces mots parlent de la ferme.", "« fusée » appartient au thème de l'espace."],
        ['lex', "cuisine|casserole|recette|four|sapin", 4, "Ces mots parlent de la cuisine.", "« sapin » appartient au thème de la forêt (ou de Noël)."],
        ['lex', "football|but|ballon|arbitre|piano", 4, "Ces mots parlent du football.", "« piano » appartient au thème de la musique."],
        ['lex', "château|chevalier|donjon|armure|ordinateur", 4, "Ces mots parlent du Moyen Âge.", "« ordinateur » n'existait pas au Moyen Âge."],
        ['fam', "dent|dentiste|dentifrice|dentier|danse", 4, "Ces mots sont de la famille de « dent ».", "« danse » se prononce presque pareil, mais n'a rien à voir avec les dents."],
        ['fam', "terre|terrain|enterrer|terrasse|tête", 4, "Ces mots sont de la famille de « terre ».", "« tête » commence comme « terre », mais n'a pas le même radical."],
        ['fam', "fleur|fleuriste|fleurir|fleuri|flèche", 4, "Ces mots sont de la famille de « fleur ».", "« flèche » commence par « fl », mais n'a aucun rapport avec les fleurs."],
        ['fam', "lait|laitier|laitage|allaiter|laid", 4, "Ces mots sont de la famille de « lait ».", "« laid » se prononce comme « lait », mais veut dire « pas beau » : c'est un homophone."],
        ['fam', "jardin|jardinier|jardinage|jardiner|jambe", 4, "Ces mots sont de la famille de « jardin ».", "« jambe » commence par « ja », mais n'a pas le même radical."],
        ['fam', "chant|chanter|chanteur|chanson|champ", 4, "Ces mots sont de la famille de « chanter ».", "« champ » se prononce comme « chant », mais désigne un terrain cultivé."],
        ['fam', "mer|marin|marée|maritime|maire", 4, "Ces mots sont de la famille de « mer ».", "« maire » se prononce comme « mer », mais désigne la personne qui dirige la commune."],
        ['fam', "froid|froideur|refroidir|froidement|fromage", 4, "Ces mots sont de la famille de « froid ».", "« fromage » commence par « fro », mais n'a pas le même radical."],
        ['son', "pain|main|lapin|matin|lune", 4, "On entend le son [in] (in, ain…).", "Dans « lune », on n'entend pas le son [in]."],
        ['son', "loup|roue|genou|hibou|bulle", 4, "On entend le son [ou].", "Dans « bulle », on entend le son [u], pas [ou]."],
        ['son', "bateau|chapeau|vélo|gâteau|cheval", 4, "On entend le son [o] (o, eau…).", "Dans « cheval », on n'entend pas le son [o]."],
        ['son', "chat|chien|vache|mouche|singe", 4, "On entend le son [ch].", "Dans « singe », on entend le son [j], pas [ch]."],
        ['son', "maman|vent|enfant|lampe|pomme", 4, "On entend le son [an] (an, en, am…).", "Dans « pomme », on entend [o], pas [an]."],
        ['son', "roi|noix|oiseau|étoile|mouton", 4, "On entend le son [wa] (oi).", "Dans « mouton », il n'y a pas le son [wa]."],
        ['son', "citron|cerise|cinéma|cil|carotte", 4, "La lettre c se prononce [s] (devant e et i).", "Dans « carotte », le c se prononce [k], car il est devant un a."],
        ['son', "girafe|genou|gilet|gymnase|gâteau", 4, "La lettre g se prononce [j] (devant e, i et y).", "Dans « gâteau », le g se prononce [g], car il est devant un a."],
        ['nat', "maison|voiture|arbre|soleil|dormir", 4, "Ce sont des noms.", "« dormir » est un verbe : on peut le conjuguer (je dors)."],
        ['nat', "parler|écrire|jouer|courir|bleu", 4, "Ce sont des verbes à l'infinitif.", "« bleu » est un adjectif de couleur."],
        ['nat', "gros|long|chaud|froid|crayon", 4, "Ce sont des adjectifs.", "« crayon » est un nom : on peut dire « un crayon »."],
        ['nat', "la|les|un|ce|chat", 4, "Ce sont des déterminants.", "« chat » est un nom."],
        ['nat', "je|tu|vous|elles|livre", 4, "Ce sont des pronoms personnels.", "« livre » est un nom."],
        ['nat', "hier|demain|toujours|ici|maison", 4, "Ce sont des mots invariables (des adverbes).", "« maison » est un nom."],
        ['nat', "lapin|souris|tortue|renard|nager", 4, "Ce sont des noms d'animaux.", "« nager » est un verbe."],
        ['nat', "joli|méchant|gentil|triste|chanter", 4, "Ce sont des adjectifs.", "« chanter » est un verbe."],
        ['nat', "boire|manger|dormir|marcher|pantalon", 4, "Ce sont des verbes à l'infinitif.", "« pantalon » est un nom."],
        ['nat', "ma|ta|sa|nos|petit", 4, "Ce sont des déterminants possessifs.", "« petit » est un adjectif."],
        ['nat', "rouge|bleu|vert|jaune|peindre", 4, "Ce sont des adjectifs de couleur.", "« peindre » est un verbe."],
        ['nat', "école|classe|élève|cahier|lire", 4, "Ce sont des noms.", "« lire » est un verbe."],
        ['nat', "sauter|tomber|glisser|rire|lourd", 4, "Ce sont des verbes à l'infinitif.", "« lourd » est un adjectif."],
        ['nat', "beau|nouveau|vieux|grand|vieillir", 4, "Ce sont des adjectifs.", "« vieillir » est un verbe (je vieillis)."],
        ['nat', "ces|cette|cet|ce|ici", 4, "Ce sont des déterminants démonstratifs.", "« ici » est un mot invariable (un adverbe de lieu)."],
        ['nat', "lui|eux|moi|toi|mon", 4, "Ce sont des pronoms personnels.", "« mon » est un déterminant possessif."],
        ['nat', "bientôt|tard|tôt|vite|tarte", 4, "Ce sont des mots invariables (des adverbes).", "« tarte » est un nom."],
        ['nat', "vache|cochon|poule|mouton|brouter", 4, "Ce sont des noms d'animaux.", "« brouter » est un verbe."],
        ['nat', "propre|sale|mouillé|sec|laver", 4, "Ce sont des adjectifs.", "« laver » est un verbe."],
        ['nat', "pleurer|crier|chanter|rire|cri", 4, "Ce sont des verbes à l'infinitif.", "« cri » est un nom : on dit « un cri »."],
        ['nat', "du|des|au|aux|avec", 4, "Ce sont des déterminants (des articles).", "« avec » est une préposition (un mot invariable)."],
        ['nat', "fort|faible|rapide|lent|force", 4, "Ce sont des adjectifs.", "« force » est un nom : on dit « la force »."],
        ['nat', "ballon|poupée|toupie|jouet|jouer", 4, "Ce sont des noms de jouets.", "« jouer » est un verbe."],
        ['nat', "ouvrir|fermer|entrer|sortir|porte", 4, "Ce sont des verbes à l'infinitif.", "« porte » est ici un nom : on dit « la porte »."],
        ['nat', "heureux|content|joyeux|ravi|joie", 4, "Ce sont des adjectifs.", "« joie » est un nom."],
        ['nat', "un|deux|cinq|dix|quart", 4, "Ce sont des déterminants numéraux (des nombres).", "« quart » est un nom : on dit « un quart »."],
        ['nat', "et|ou|mais|donc|bien", 4, "Ce sont des conjonctions de coordination (mais, ou, et, donc, or, ni, car).", "« bien » est un adverbe."],
        ['nat', "grandir|maigrir|grossir|rougir|grand", 4, "Ce sont des verbes du 2e groupe.", "« grand » est un adjectif."],
        ['lex', "cheval|selle|galop|écurie|avion", 4, "Ces mots parlent du cheval et de l'équitation.", "« avion » appartient au thème des transports aériens."],
        ['lex', "hiver|neige|luge|bonnet|maillot de bain", 4, "Ces mots parlent de l'hiver.", "« maillot de bain » appartient au thème de l'été et de la plage."],
        ['lex', "plage|parasol|seau|pelle|moufle", 4, "Ces mots parlent de la plage.", "« moufle » appartient au thème de l'hiver."],
        ['lex', "forêt|arbre|écureuil|champignon|requin", 4, "Ces mots parlent de la forêt.", "« requin » appartient au thème de la mer."],
        ['lex', "cirque|clown|jongleur|chapiteau|tondeuse", 4, "Ces mots parlent du cirque.", "« tondeuse » appartient au thème du jardin."],
        ['lex', "anniversaire|bougie|gâteau|cadeau|cartable", 4, "Ces mots parlent de l'anniversaire.", "« cartable » appartient au thème de l'école."],
        ['lex', "boulangerie|pain|croissant|baguette|marteau", 4, "Ces mots parlent de la boulangerie.", "« marteau » appartient au thème du bricolage."],
        ['lex', "espace|étoile|planète|fusée|carotte", 4, "Ces mots parlent de l'espace.", "« carotte » appartient au thème des légumes."],
        ['lex', "bricolage|marteau|clou|scie|confiture", 4, "Ces mots parlent du bricolage.", "« confiture » appartient au thème du petit-déjeuner."],
        ['lex', "jardin|râteau|arrosoir|graine|télévision", 4, "Ces mots parlent du jardinage.", "« télévision » appartient au thème de la maison et des écrans."],
        ['lex', "musique|guitare|tambour|chanson|chaussette", 4, "Ces mots parlent de la musique.", "« chaussette » appartient au thème des vêtements."],
        ['lex', "lit|oreiller|couverture|pyjama|vélo", 4, "Ces mots parlent du sommeil.", "« vélo » appartient au thème des transports ou du sport."],
        ['lex', "pirate|bateau|trésor|perroquet|tracteur", 4, "Ces mots parlent des pirates.", "« tracteur » appartient au thème de la ferme."],
        ['lex', "sorcière|balai|chaudron|potion|bicyclette", 4, "Ces mots parlent des sorcières.", "« bicyclette » appartient au thème des transports."],
        ['lex', "dinosaure|fossile|squelette|préhistoire|téléphone", 4, "Ces mots parlent des dinosaures et des fossiles.", "« téléphone » est un objet moderne."],
        ['lex', "pantalon|jupe|manteau|chemise|pinceau", 4, "Ces mots parlent des vêtements.", "« pinceau » appartient au thème de la peinture."],
        ['lex', "corps|bras|jambe|tête|lampe", 4, "Ces mots parlent du corps humain.", "« lampe » est un objet de la maison."],
        ['lex', "carotte|poireau|haricot|courgette|banane", 4, "Ce sont des légumes.", "« banane » est un fruit."],
        ['lex', "pomme|cerise|abricot|raisin|épinard", 4, "Ce sont des fruits.", "« épinard » est un légume."],
        ['lex', "piscine|nager|maillot|plongeoir|ski", 4, "Ces mots parlent de la piscine et de la natation.", "« ski » appartient au thème de la montagne et de la neige."],
        ['lex', "bibliothèque|livre|lecture|emprunter|râteau", 4, "Ces mots parlent de la bibliothèque et de la lecture.", "« râteau » appartient au thème du jardin."],
        ['lex', "route|voiture|feu rouge|panneau|baleine", 4, "Ces mots parlent de la route.", "« baleine » appartient au thème de la mer."],
        ['lex', "Noël|sapin|guirlande|cadeau|citrouille", 4, "Ces mots parlent de Noël.", "« citrouille » évoque plutôt Halloween ou l'automne."],
        ['lex', "manège|barbe à papa|grande roue|auto-tamponneuse|tableau", 4, "Ces mots parlent de la fête foraine.", "« tableau » appartient au thème de l'école."],
        ['lex', "police|gendarme|sirène|enquête|tutu", 4, "Ces mots parlent de la police.", "« tutu » appartient au thème de la danse."],
        ['lex', "dauphin|baleine|requin|poulpe|écureuil", 4, "Ce sont des animaux de la mer.", "« écureuil » vit dans les arbres de la forêt."],
        ['lex', "poule|cochon|vache|canard|lion", 4, "Ce sont des animaux de la ferme.", "« lion » est un animal sauvage de la savane."],
        ['lex', "rouge|bleu|vert|violet|carré", 4, "Ce sont des couleurs.", "« carré » est une forme géométrique."],
        ['fam', "fruit|fruitier|fruitière|fruité|frite", 4, "Ces mots sont de la famille de « fruit ».", "« frite » commence par « fr », mais n'a rien à voir avec les fruits."],
        ['fam', "sel|salé|saler|salière|sale", 4, "Ces mots sont de la famille de « sel ».", "« sale » ressemble à « salé », mais veut dire « pas propre »."],
        ['fam', "glace|glacier|glacé|glaçon|glisser", 4, "Ces mots sont de la famille de « glace ».", "« glisser » commence par « gl », mais n'a pas le même radical."],
        ['fam', "neige|neiger|enneigé|déneiger|nager", 4, "Ces mots sont de la famille de « neige ».", "« nager » ressemble à « neiger », mais veut dire « se déplacer dans l'eau »."],
        ['fam', "bois|boisé|boiserie|reboiser|boire", 4, "Ces mots sont de la famille de « bois ».", "« boire » ressemble à « bois » (je bois), mais ce n'est pas le même mot."],
        ['fam', "coiffer|coiffeur|coiffure|décoiffer|coffre", 4, "Ces mots sont de la famille de « coiffer ».", "« coffre » ressemble à « coiffe », mais n'a pas le même radical."],
        ['fam', "peur|peureux|apeuré|peureusement|pêcheur", 4, "Ces mots sont de la famille de « peur ».", "« pêcheur » vient de « pêcher » (attraper des poissons)."],
        ['fam', "sable|sablé|sablier|ensablé|table", 4, "Ces mots sont de la famille de « sable ».", "« table » rime avec « sable », mais n'a pas le même radical."],
        ['fam', "chaud|chaleur|réchauffer|chauffage|chausson", 4, "Ces mots sont de la famille de « chaud ».", "« chausson » vient de « chausser » (mettre des chaussures)."],
        ['fam', "pluie|pluvieux|parapluie|pleuvoir|plume", 4, "Ces mots sont de la famille de « pluie ».", "« plume » commence par « plu », mais n'a rien à voir avec la pluie."],
        ['fam', "jour|journée|journal|bonjour|jouet", 4, "Ces mots sont de la famille de « jour ».", "« jouet » vient de « jouer », pas de « jour »."],
        ['fam', "soleil|ensoleillé|parasol|solaire|sommeil", 4, "Ces mots sont de la famille de « soleil » (sol = soleil en latin).", "« sommeil » rime avec « soleil », mais veut dire « le fait de dormir »."],
        ['fam', "tête|têtu|entêté|casse-tête|tétine", 4, "Ces mots sont de la famille de « tête ».", "« tétine » vient de « téter » (boire au sein ou au biberon)."],
        ['fam', "écrire|écriture|écrivain|réécrire|écureuil", 4, "Ces mots sont de la famille de « écrire ».", "« écureuil » commence par « écr », mais c'est un animal."],
        ['fam', "rire|sourire|rieur|rieuse|rivière", 4, "Ces mots sont de la famille de « rire ».", "« rivière » commence par « ri », mais n'a pas le même radical."],
        ['fam', "bras|brassard|embrasser|brasse|brosse", 4, "Ces mots sont de la famille de « bras » (embrasser = prendre dans ses bras).", "« brosse » ressemble à « brasse », mais n'a pas le même radical."],
        ['fam', "lent|lentement|lenteur|ralentir|lentille", 4, "Ces mots sont de la famille de « lent ».", "« lentille » commence par « lent », mais c'est une graine qui se mange."],
        ['fam', "vol|voler|envol|survoler|volume", 4, "Ces mots sont de la famille de « voler » (dans les airs).", "« volume » commence par « vol », mais n'a pas le même radical."],
        ['fam', "dos|dossier|adosser|dossard|dose", 4, "Ces mots sont de la famille de « dos ».", "« dose » commence par « dos », mais veut dire « une quantité »."],
        ['fam', "cheval|chevalier|chevaucher|chevalet|cheveu", 4, "Ces mots sont de la famille de « cheval ».", "« cheveu » commence par « chev », mais n'a rien à voir avec le cheval."],
        ['fam', "clou|clouer|déclouer|clouté|clown", 4, "Ces mots sont de la famille de « clou ».", "« clown » commence par « clo », mais c'est un mot anglais."],
        ['fam', "plume|plumage|plumer|plumeau|pluie", 4, "Ces mots sont de la famille de « plume ».", "« pluie » commence par « plu », mais n'a pas le même radical."],
        ['fam', "gris|grisâtre|grisaille|grisonner|griffe", 4, "Ces mots sont de la famille de « gris ».", "« griffe » commence par « gri », mais n'a pas le même radical."],
        ['fam', "tard|retard|tardif|attarder|tarte", 4, "Ces mots sont de la famille de « tard ».", "« tarte » commence par « tar », mais c'est un gâteau."],
        ['fam', "poisson|poissonnier|poissonnerie|poissonneux|poison", 4, "Ces mots sont de la famille de « poisson ».", "« poison » ressemble à « poisson », mais c'est un produit dangereux : un seul s, et on entend [z]."],
        ['fam', "jeu|jouer|joueur|jouet|joue", 4, "Ces mots sont de la famille de « jeu ».", "« joue » désigne une partie du visage."],
        ['fam', "vert|verdure|verdâtre|reverdir|verre", 4, "Ces mots sont de la famille de « vert ».", "« verre » se prononce comme « vert », mais c'est la matière transparente (ou un récipient)."],
        ['fam', "nom|nommer|prénom|surnom|nombre", 4, "Ces mots sont de la famille de « nom ».", "« nombre » commence par « nom », mais désigne une quantité."],
        ['son', "été|nez|chanter|clé|tête", 4, "On entend le son [é] (é, ez, er).", "Dans « tête », on entend le son [è]."],
        ['son', "lit|nid|riz|souris|dos", 4, "On entend le son [i].", "Dans « dos », on entend le son [o]."],
        ['son', "lune|plume|tortue|mur|loup", 4, "On entend le son [u].", "Dans « loup », on entend le son [ou]."],
        ['son', "bonbon|maison|pont|ballon|banane", 4, "On entend le son [on].", "Dans « banane », on n'entend pas le son [on]."],
        ['son', "sapin|lapin|timbre|peinture|copine", 4, "On entend le son [in] (in, im, ein).", "Dans « copine », le n est suivi d'un e : on entend [i] puis [n]."],
        ['son', "poire|voiture|bois|toit|pomme", 4, "On entend le son [wa] (oi).", "Dans « pomme », on n'entend pas le son [wa]."],
        ['son', "feu|cheveu|deux|bleu|doux", 4, "On entend le son [eu].", "Dans « doux », on entend le son [ou]."],
        ['son', "chocolat|chèvre|cheminée|douche|joue", 4, "On entend le son [ch].", "Dans « joue », on entend le son [j]."],
        ['son', "jupe|jardin|pyjama|bougie|cheval", 4, "On entend le son [j] (j, g).", "Dans « cheval », on entend le son [ch]."],
        ['son', "fée|feu|café|girafe|vache", 4, "On entend le son [f].", "Dans « vache », on entend [v], pas [f]."],
        ['son', "vélo|cave|avion|lavabo|fusée", 4, "On entend le son [v].", "Dans « fusée », on entend [f], pas [v]."],
        ['son', "papa|pomme|pied|soupe|bébé", 4, "On entend le son [p].", "Dans « bébé », on entend [b], pas [p]."],
        ['son', "robe|banane|bonbon|bébé|poule", 4, "On entend le son [b].", "Dans « poule », on entend [p], pas [b]."],
        ['son', "tasse|tomate|tapis|patte|dent", 4, "On entend le son [t].", "Dans « dent », on entend [d] ; le t final est muet."],
        ['son', "dé|dame|radis|salade|tarte", 4, "On entend le son [d].", "Dans « tarte », on entend [t], pas [d]."],
        ['son', "rat|roue|arbre|carotte|lune", 4, "On entend le son [r].", "Dans « lune », on n'entend pas le son [r]."],
        ['son', "lune|lit|ballon|vélo|ours", 4, "On entend le son [l].", "Dans « ours », on n'entend pas le son [l]."],
        ['son', "maman|mouton|pomme|plume|nuage", 4, "On entend le son [m].", "Dans « nuage », on entend [n], pas [m]."],
        ['son', "nuage|navire|banane|lune|mouton", 4, "On entend le son [n].", "Dans « mouton », le n fait partie du son [on] : on n'entend pas [n]."],
        ['son', "montagne|araignée|peigne|ligne|neige", 4, "On entend le son [gn].", "Dans « neige », on n'entend pas le son [gn]."],
        ['son', "canard|copain|cube|cœur|cygne", 4, "La lettre c se prononce [k] (devant a, o, u…).", "Dans « cygne », le c est devant un y : il se prononce [s]."],
        ['son', "garçon|leçon|maçon|reçu|cousin", 4, "On entend le son [s] écrit ç.", "Dans « cousin », le s entre deux voyelles se prononce [z]."],
        ['son', "gare|gomme|guitare|bague|genou", 4, "On entend le son [g] (g, gu).", "Dans « genou », le g est devant un e : il se prononce [j]."],
        ['son', "mouche|poule|hibou|chou|bus", 4, "On entend le son [ou].", "Dans « bus », on entend le son [u]."],
        ['son', "rocher|boulanger|nez|assez|mer", 4, "On entend le son [é] à la fin (er, ez).", "Dans « mer », on entend [è] suivi du r."],
        ['son', "chambre|jambe|camp|lampe|chameau", 4, "On entend le son [an] (am, an).", "Dans « chameau », on n'entend pas le son [an]."],
        ['son', "chaud|jaune|auto|château|chou", 4, "On entend le son [o] (au, eau).", "Dans « chou », on entend le son [ou]."],
        ['son', "chaise|fraise|lait|tête|fée", 4, "On entend le son [è] (ai, ê).", "Dans « fée », on entend le son [é]."]
    ],
    '2': [
        ['nat', "rapidement|doucement|calmement|joyeusement|jument", 4, "Ce sont des adverbes en -ment : ils sont invariables.", "« jument » finit aussi par -ment, mais c'est un nom (la femelle du cheval)."],
        ['nat', "courageux|heureux|curieux|généreux|ceux", 4, "Ce sont des adjectifs.", "« ceux » est un pronom démonstratif (ceux qui…)."],
        ['nat', "pour|avec|dans|sans|joli", 4, "Ce sont des prépositions (des mots invariables).", "« joli » est un adjectif."],
        ['nat', "mais|ou|et|donc|sous", 4, "Ce sont des conjonctions de coordination (mais, ou, et, donc, or, ni, car).", "« sous » est une préposition."],
        ['nat', "cette|chaque|plusieurs|leurs|lui", 4, "Ce sont des déterminants.", "« lui » est un pronom personnel."],
        ['nat', "partir|venir|courir|sourire|soupir", 4, "Ce sont des verbes à l'infinitif.", "« soupir » finit par -ir, mais c'est un nom (un soupir)."],
        ['nat', "danseuse|chanteuse|joyeuse|coiffeuse|vendeuse", 2, "Ce sont des noms de métiers ou d'activités.", "« joyeuse » est un adjectif : c'est le féminin de « joyeux »."],
        ['nat', "lentement|souvent|toujours|jamais|lent", 4, "Ce sont des adverbes (des mots invariables).", "« lent » est un adjectif : il s'accorde (lente, lents)."],
        ['lex', "volcan|lave|cratère|éruption|glacier", 4, "Ces mots parlent des volcans.", "« glacier » appartient au thème de la montagne et de la glace."],
        ['lex', "théâtre|scène|rideau|acteur|stéthoscope", 4, "Ces mots parlent du théâtre.", "« stéthoscope » est l'instrument du médecin."],
        ['lex', "astronaute|fusée|planète|orbite|sous-marin", 4, "Ces mots parlent de l'espace.", "« sous-marin » appartient au thème de la mer."],
        ['lex', "tristesse|chagrin|larme|mélancolie|fou rire", 4, "Ces mots parlent de la tristesse.", "« fou rire » exprime au contraire la joie."],
        ['lex', "préhistoire|silex|grotte|mammouth|imprimerie", 4, "Ces mots parlent de la Préhistoire.", "« imprimerie » apparaît bien plus tard, à la Renaissance."],
        ['lex', "justice|tribunal|juge|avocat|pâtissier", 4, "Ces mots parlent de la justice.", "« pâtissier » appartient au thème de la cuisine."],
        ['lex', "montagne|sommet|altitude|piolet|palmier", 4, "Ces mots parlent de la montagne.", "« palmier » évoque plutôt les pays chauds et la plage."],
        ['lex', "musique|partition|orchestre|mélodie|pinceau", 4, "Ces mots parlent de la musique.", "« pinceau » appartient au thème de la peinture."],
        ['fam', "lune|lunaire|alunir|lundi|lutin", 4, "Ces mots sont de la famille de « lune » (lundi = le jour de la lune).", "« lutin » commence par « lu », mais n'a rien à voir avec la lune."],
        ['fam', "mer|marin|marine|amerrir|merci", 4, "Ces mots sont de la famille de « mer ».", "« merci » commence par « mer », mais n'a pas le même radical."],
        ['fam', "vent|venter|ventilateur|éventail|ventre", 4, "Ces mots sont de la famille de « vent ».", "« ventre » contient « vent », mais désigne une partie du corps."],
        ['fam', "grand|grandeur|agrandir|grandir|grange", 4, "Ces mots sont de la famille de « grand ».", "« grange » ressemble à « grand », mais désigne un bâtiment de ferme."],
        ['fam', "ami|amitié|amical|amicalement|amiral", 4, "Ces mots sont de la famille de « ami ».", "« amiral » commence par « ami », mais c'est le chef d'une flotte de navires."],
        ['fam', "long|longueur|allonger|longer|loge", 4, "Ces mots sont de la famille de « long ».", "« loge » commence par « lo », mais n'a pas le même radical."],
        ['fam', "pied|piéton|piétiner|trépied|pierre", 4, "Ces mots sont de la famille de « pied ».", "« pierre » commence par « pi », mais n'a pas le même radical."],
        ['fam', "dent|dentaire|édenté|dentition|dense", 4, "Ces mots sont de la famille de « dent ».", "« dense » se prononce presque comme « dent », mais veut dire « épais, serré »."],
        ['son', "lait|forêt|neige|mère|lilas", 4, "On entend le son [è] (ai, ê, ei, è).", "Dans « lilas », on n'entend pas le son [è]."],
        ['son', "coq|kiwi|quatre|chorale|chaise", 4, "On entend le son [k] (c, k, qu, ch).", "Dans « chaise », « ch » se prononce [ch], alors que dans « chorale » il se prononce [k]."],
        ['son', "photo|phare|téléphone|éléphant|parapluie", 4, "On entend le son [f], écrit « ph ».", "Dans « parapluie », on n'entend pas le son [f]."],
        ['son', "fille|soleil|abeille|caillou|ville", 4, "On entend le son [ill] (ill, il).", "Dans « ville », « ll » se prononce [l] : on n'entend pas [ill]."],
        ['son', "ombre|pont|bonbon|nombre|bonne", 4, "On entend le son [on].", "Dans « bonne », on entend [o] : le « n » est doublé et suivi d'un e."],
        ['son', "tente|lent|camp|temps|semaine", 4, "On entend le son [an] (en, an, am, em).", "Dans « semaine », on n'entend pas le son [an]."],
        ['son', "rose|maison|cousin|oiseau|poisson", 4, "Le s entre deux voyelles se prononce [z].", "Dans « poisson », le s est doublé : on entend [s]."],
        ['son', "auto|seau|dos|haut|pou", 4, "On entend le son [o] (au, eau, o).", "Dans « pou », on entend le son [ou]."],
        ['nat', "sous|sur|vers|chez|souvent", 4, "Ce sont des prépositions (des mots invariables).", "« souvent » est un adverbe."],
        ['nat', "celui|celle|ceux|celles|cette", 4, "Ce sont des pronoms démonstratifs.", "« cette » est un déterminant démonstratif : il est toujours suivi d'un nom."],
        ['nat', "me|te|se|nous|mes", 4, "Ce sont des pronoms personnels.", "« mes » est un déterminant possessif."],
        ['nat', "vraiment|gentiment|poliment|rapidement|aliment", 4, "Ce sont des adverbes en -ment.", "« aliment » finit aussi par -ment, mais c'est un nom (un aliment)."],
        ['nat', "aimable|lavable|capable|agréable|érable", 4, "Ce sont des adjectifs en -able.", "« érable » finit aussi par -able, mais c'est un nom d'arbre."],
        ['nat', "jeter|marcher|garder|parler|léger", 4, "Ce sont des verbes à l'infinitif.", "« léger » finit par -er, mais c'est un adjectif."],
        ['nat', "bonté|beauté|fierté|liberté|habité", 4, "Ce sont des noms en -té.", "« habité » est un participe passé (ou un adjectif) : une maison habitée."],
        ['nat', "malgré|pendant|parmi|selon|plutôt", 4, "Ce sont des prépositions.", "« plutôt » est un adverbe."],
        ['nat', "car|or|ni|donc|lorsque", 4, "Ce sont des conjonctions de coordination.", "« lorsque » est une conjonction de subordination : elle introduit une proposition subordonnée."],
        ['nat', "notre|votre|leur|nos|nôtre", 4, "Ce sont des déterminants possessifs.", "« nôtre » (avec un accent) est un pronom possessif : le nôtre."],
        ['nat', "quel|quelle|quels|quelles|qui", 4, "Ce sont des déterminants interrogatifs ou exclamatifs.", "« qui » est un pronom (interrogatif ou relatif)."],
        ['nat', "dormeur|chanteur|nageur|danseur|meilleur", 4, "Ce sont des noms en -eur.", "« meilleur » est un adjectif."],
        ['nat', "aujourd'hui|maintenant|autrefois|jadis|ancien", 4, "Ce sont des adverbes de temps.", "« ancien » est un adjectif : il s'accorde (anciennes)."],
        ['nat', "blancheur|douceur|lenteur|chaleur|majeur", 4, "Ce sont des noms en -eur.", "« majeur » est un adjectif (une personne majeure)."],
        ['nat', "épaisse|grosse|basse|lasse|caresse", 4, "Ce sont des adjectifs au féminin.", "« caresse » est un nom (ou le verbe caresser conjugué)."],
        ['nat', "chaudement|fortement|vivement|bruyamment|logement", 4, "Ce sont des adverbes.", "« logement » est un nom (un logement)."],
        ['nat', "crier|plier|nier|oublier|premier", 4, "Ce sont des verbes à l'infinitif.", "« premier » finit par -ier, mais c'est un adjectif."],
        ['nat', "vous|nous|eux|lui|vos", 4, "Ce sont des pronoms personnels.", "« vos » est un déterminant possessif."],
        ['nat', "ici|là|ailleurs|partout|lieu", 4, "Ce sont des adverbes de lieu.", "« lieu » est un nom (un lieu)."],
        ['nat', "finesse|tendresse|vitesse|sagesse|épaisse", 4, "Ce sont des noms en -esse.", "« épaisse » est un adjectif (le féminin de « épais »)."],
        ['nat', "fini|parti|choisi|grandi|tapis", 4, "Ce sont des participes passés.", "« tapis » est un nom."],
        ['nat', "quand|comme|si|puisque|aussi", 4, "Ce sont des conjonctions de subordination.", "« aussi » est un adverbe."],
        ['nat', "aucun|chaque|certains|plusieurs|souvent", 4, "Ce sont des déterminants indéfinis.", "« souvent » est un adverbe."],
        ['nat', "pourquoi|comment|combien|où|pour", 4, "Ce sont des mots interrogatifs (des adverbes).", "« pour » est une préposition."],
        ['nat', "naviguer|voguer|fatiguer|distinguer|langue", 4, "Ce sont des verbes à l'infinitif.", "« langue » est un nom."],
        ['nat', "mince|maigre|svelte|fin|minceur", 4, "Ce sont des adjectifs.", "« minceur » est un nom."],
        ['nat', "dont|que|qui|lequel|donc", 4, "Ce sont des pronoms relatifs.", "« donc » est une conjonction de coordination."],
        ['nat', "heureusement|malheureusement|évidemment|seulement|sentiment", 4, "Ce sont des adverbes.", "« sentiment » est un nom."],
        ['lex', "pharaon|pyramide|momie|hiéroglyphe|chevalier", 4, "Ces mots parlent de l'Égypte ancienne.", "« chevalier » appartient au thème du Moyen Âge."],
        ['lex', "Bastille|révolutionnaire|tiers état|sans-culotte|pharaon", 4, "Ces mots parlent de la Révolution française.", "« pharaon » appartient au thème de l'Égypte ancienne."],
        ['lex', "gladiateur|légion|empereur|aqueduc|astronaute", 4, "Ces mots parlent de la Rome antique.", "« astronaute » appartient au thème de l'espace."],
        ['lex', "abysses|corail|marée|récif|dune", 4, "Ces mots parlent de l'océan.", "« dune » appartient au thème du désert."],
        ['lex', "dune|oasis|chameau|mirage|banquise", 4, "Ces mots parlent du désert.", "« banquise » appartient au thème des pôles."],
        ['lex', "banquise|igloo|ours polaire|iceberg|cactus", 4, "Ces mots parlent des régions polaires.", "« cactus » pousse dans le désert."],
        ['lex', "estomac|intestin|œsophage|salive|poumon", 4, "Ces mots parlent de la digestion.", "« poumon » appartient au thème de la respiration."],
        ['lex', "poumon|souffle|inspirer|bronches|fémur", 4, "Ces mots parlent de la respiration.", "« fémur » est un os : il appartient au thème du squelette."],
        ['lex', "pile|ampoule|interrupteur|circuit|boussole", 4, "Ces mots parlent de l'électricité.", "« boussole » appartient au thème de l'orientation."],
        ['lex', "anticyclone|averse|bourrasque|éclaircie|sablier", 4, "Ces mots parlent de la météo.", "« sablier » sert à mesurer le temps qui passe."],
        ['lex', "palette|chevalet|pinceau|toile|violon", 4, "Ces mots parlent de la peinture.", "« violon » appartient au thème de la musique."],
        ['lex', "réalisateur|caméra|tournage|scénario|tracteur", 4, "Ces mots parlent du cinéma.", "« tracteur » appartient au thème de la ferme."],
        ['lex', "grue|béton|chantier|échafaudage|gondole", 4, "Ces mots parlent de la construction.", "« gondole » est un bateau de Venise."],
        ['lex', "pétale|tige|étamine|pistil|nageoire", 4, "Ces mots parlent de la fleur.", "« nageoire » appartient au thème des poissons."],
        ['lex', "nageoire|écaille|branchies|arête|plume", 4, "Ces mots parlent des poissons.", "« plume » appartient au thème des oiseaux."],
        ['lex', "plume|bec|aile|nid|sabot", 4, "Ces mots parlent des oiseaux.", "« sabot » est le pied du cheval (ou une chaussure en bois)."],
        ['lex', "meringue|éclair|chantilly|pâte feuilletée|perceuse", 4, "Ces mots parlent de la pâtisserie.", "« perceuse » appartient au thème du bricolage."],
        ['lex', "fureur|rage|irritation|exaspération|sérénité", 4, "Ces mots parlent de la colère.", "« sérénité » exprime au contraire le calme."],
        ['lex', "frayeur|effroi|angoisse|panique|allégresse", 4, "Ces mots parlent de la peur.", "« allégresse » exprime au contraire une grande joie."],
        ['lex', "allégresse|gaieté|bonheur|euphorie|chagrin", 4, "Ces mots parlent de la joie.", "« chagrin » exprime au contraire la tristesse."],
        ['lex', "voile|gouvernail|ancre|hublot|guidon", 4, "Ces mots parlent du bateau.", "« guidon » appartient au thème du vélo."],
        ['lex', "guidon|pédale|selle|chaîne|hublot", 4, "Ces mots parlent du vélo.", "« hublot » est une petite fenêtre de bateau ou d'avion."],
        ['lex', "auteur|chapitre|couverture|éditeur|stade", 4, "Ces mots parlent du livre.", "« stade » appartient au thème du sport."],
        ['lex', "sprint|haie|javelot|relais|raquette", 4, "Ces mots parlent de l'athlétisme.", "« raquette » appartient au thème du tennis (ou du badminton)."],
        ['lex', "raquette|filet|service|balle|panier", 4, "Ces mots parlent du tennis.", "« panier » appartient au thème du basket."],
        ['lex', "semer|labourer|récolter|moissonner|naviguer", 4, "Ces mots parlent de l'agriculture.", "« naviguer » appartient au thème de la mer et des bateaux."],
        ['lex', "seconde|minute|heure|siècle|kilomètre", 4, "Ces mots parlent de la mesure du temps.", "« kilomètre » est une mesure de longueur."],
        ['lex', "plaine|plateau|colline|vallée|tempête", 4, "Ces mots parlent du relief.", "« tempête » appartient au thème de la météo."],
        ['fam', "faim|affamé|famine|affamer|fameux", 4, "Ces mots sont de la famille de « faim ».", "« fameux » veut dire « célèbre » : il vient d'un autre mot, « fama » (la renommée)."],
        ['fam', "son|sonner|sonnerie|sonore|sonde", 4, "Ces mots sont de la famille de « son » (le bruit).", "« sonde » commence par « son », mais n'a pas le même radical."],
        ['fam', "roche|rocher|rocheux|rocaille|brioche", 4, "Ces mots sont de la famille de « roche ».", "« brioche » finit par « oche », mais c'est un gâteau."],
        ['fam', "voir|revoir|prévoir|entrevoir|devoir", 4, "Ces mots sont de la famille de « voir ».", "« devoir » finit par « voir », mais n'a rien à voir avec la vue."],
        ['fam', "nager|nageur|nage|nageoire|navet", 4, "Ces mots sont de la famille de « nager ».", "« navet » commence par « na », mais c'est un légume."],
        ['fam', "coudre|couture|couturière|découdre|coude", 4, "Ces mots sont de la famille de « coudre ».", "« coude » ressemble à « coudre », mais c'est une partie du bras."],
        ['fam', "porter|porteur|transporter|apporter|portrait", 4, "Ces mots sont de la famille de « porter ».", "« portrait » commence par « port », mais vient de « portraire » (dessiner)."],
        ['fam', "montre|montrer|démontrer|démonstration|montagne", 4, "Ces mots sont de la famille de « montrer » (une montre montre l'heure).", "« montagne » commence comme « montre », mais vient de « mont » (une grande élévation de terrain)."],
        ['fam', "pays|paysan|paysage|dépaysé|payer", 4, "Ces mots sont de la famille de « pays ».", "« payer » ressemble à « pays », mais veut dire « donner de l'argent »."],
        ['fam', "courir|course|coureur|parcours|courage", 4, "Ces mots sont de la famille de « courir ».", "« courage » commence par « cour », mais vient de « cœur »."],
        ['fam', "fer|ferrer|ferraille|ferronnier|fermer", 4, "Ces mots sont de la famille de « fer ».", "« fermer » commence par « fer », mais n'a rien à voir avec le métal."],
        ['fam', "mur|muraille|murer|emmurer|mûr", 4, "Ces mots sont de la famille de « mur ».", "« mûr » (avec un accent) veut dire « prêt à être mangé » : c'est un homophone."],
        ['fam', "sang|saigner|sanguin|ensanglanté|sangle", 4, "Ces mots sont de la famille de « sang ».", "« sangle » commence par « sang », mais c'est une bande de tissu ou de cuir."],
        ['fam', "œil|œillère|œillade|clin d'œil|œuf", 4, "Ces mots sont de la famille de « œil ».", "« œuf » commence par « œ », mais n'a pas le même radical."],
        ['fam', "dessin|dessiner|dessinateur|dessinatrice|dessert", 4, "Ces mots sont de la famille de « dessin ».", "« dessert » commence par « dess », mais c'est la fin du repas."],
        ['fam', "mère|maternel|maternité|materner|matelas", 4, "Ces mots sont de la famille de « mère » (mater en latin).", "« matelas » commence par « mat », mais n'a pas le même radical."],
        ['fam', "père|paternel|paternité|paternellement|patin", 4, "Ces mots sont de la famille de « père » (pater en latin).", "« patin » commence par « pat », mais n'a pas le même radical."],
        ['fam', "ciel|céleste|arc-en-ciel|gratte-ciel|cil", 4, "Ces mots sont de la famille de « ciel ».", "« cil » ressemble à « ciel », mais désigne un poil de la paupière."],
        ['fam', "corps|corporel|corpulent|corset|corbeau", 4, "Ces mots sont de la famille de « corps ».", "« corbeau » commence par « cor », mais c'est un oiseau."],
        ['fam', "loi|légal|légalité|illégal|légume", 4, "Ces mots sont de la famille de « loi » (lex, legis en latin).", "« légume » commence par « lég », mais n'a pas le même radical."],
        ['fam', "chat|chaton|chatte|chatière|château", 4, "Ces mots sont de la famille de « chat ».", "« château » commence par « chat », mais vient du latin castellum."],
        ['fam', "bain|baigner|baignoire|baignade|bague", 4, "Ces mots sont de la famille de « bain ».", "« bague » commence par « ba », mais c'est un bijou."],
        ['fam', "vieux|vieillir|vieillesse|vieillard|veille", 4, "Ces mots sont de la famille de « vieux ».", "« veille » vient de « veiller » (rester éveillé)."],
        ['fam', "arbre|arbuste|arboricole|arboriculteur|arbitre", 4, "Ces mots sont de la famille de « arbre ».", "« arbitre » commence par « arb », mais désigne celui qui fait respecter les règles."],
        ['fam', "doux|douceur|adoucir|doucement|douche", 4, "Ces mots sont de la famille de « doux ».", "« douche » commence par « dou », mais n'a pas le même radical."],
        ['fam', "main|manuel|manucure|manier|manteau", 4, "Ces mots sont de la famille de « main » (manus en latin).", "« manteau » commence par « man », mais c'est un vêtement."],
        ['fam', "nouveau|nouveauté|renouveler|nouvelle|nouille", 4, "Ces mots sont de la famille de « nouveau ».", "« nouille » commence par « nou », mais ce sont des pâtes."],
        ['fam', "or|doré|dorure|orfèvre|orage", 4, "Ces mots sont de la famille de « or » (le métal).", "« orage » commence par « or », mais vient d'un autre mot (aura, le vent)."],
        ['son', "addition|multiplication|nation|potion|question", 4, "Les lettres « ti » se prononcent [si].", "Dans « question », on entend [t] : on dit [kes-tion]."],
        ['son', "pigeon|nageoire|orangeade|bougeoir|guêpe", 4, "« ge » se prononce [j] devant a ou o.", "Dans « guêpe », « gu » se prononce [g]."],
        ['son', "guêpe|guitare|bague|langue|gilet", 4, "On entend le son [g] (g, gu).", "Dans « gilet », le g devant i se prononce [j]."],
        ['son', "timbre|daim|frein|faim|ami", 4, "On entend le son [in] (im, aim, ein).", "Dans « ami », on entend [a], [m] et [i], mais pas [in]."],
        ['son', "emporter|temps|membre|ensemble|semer", 4, "On entend le son [an] écrit em ou en.", "Dans « semer », on n'entend pas le son [an]."],
        ['son', "taxi|boxe|index|extra|exemple", 4, "La lettre x se prononce [ks].", "Dans « exemple », le x se prononce [gz]."],
        ['son', "deuxième|sixième|dixième|dix-neuf|taxi", 4, "La lettre x se prononce [z].", "Dans « taxi », le x se prononce [ks]."],
        ['son', "jouet|bonnet|poulet|robinet|nez", 4, "Le « et » final se prononce [è].", "Dans « nez », on entend [é]."],
        ['son', "crayon|noyau|tuyau|voyage|cygne", 4, "Le y placé entre deux voyelles vaut deux i (crayon se lit cray-ion).", "Dans « cygne », le y n'est pas entre deux voyelles : il se prononce simplement [i]."],
        ['son', "travail|corail|éventail|portail|pareil", 4, "On entend le son [aille] (ail).", "Dans « pareil », on entend le son [eille]."],
        ['son', "soleil|réveil|orteil|sommeil|cercueil", 4, "On entend le son [eille] (eil).", "Dans « cercueil », on entend le son [euille]."],
        ['son', "point|coin|loin|foin|pion", 4, "On entend le son [oin].", "Dans « pion », on entend le son [on]."],
        ['son', "nombre|pompier|tomber|ombrelle|pomme", 4, "On entend le son [on] écrit om (devant b et p).", "Dans « pomme », on entend [o] : om est suivi d'un m, pas d'un b ou d'un p."],
        ['son', "lampe|jambe|tempête|chambre|cane", 4, "On entend le son [an] écrit am ou em (devant b et p).", "Dans « cane », on entend [a] puis [n] : pas de son [an]."],
        ['son', "piscine|science|scène|descendre|escargot", 4, "« sc » se prononce [s] devant e et i.", "Dans « escargot », « sc » est devant un a : on entend [sk]."],
        ['son', "shampoing|short|schéma|hache|chorale", 4, "On entend le son [ch] (sh, sch, ch).", "Dans « chorale », « ch » se prononce [k]."],
        ['son', "jeu|feu|nœud|vœu|loup", 4, "On entend le son [eu] (eu, œu).", "Dans « loup », on entend le son [ou]."],
        ['son', "chat|lit|riz|loup|bus", 4, "La dernière lettre est muette (on ne l'entend pas).", "Dans « bus », on entend le s final."],
        ['son', "pied|clef|nez|aller|fer", 4, "On entend le son [é] à la fin, et la dernière lettre est muette.", "Dans « fer », on entend [è] et le r final se prononce."],
        ['son', "compagnon|champignon|baignoire|oignon|piano", 4, "On entend le son [gn].", "Dans « piano », on entend [n] puis [i] : pas de son [gn]."],
        ['son', "flûte|sûr|mûr|plume|loup", 4, "On entend le son [u].", "Dans « loup », on entend le son [ou]."],
        ['son', "fruit|puits|nuit|bruit|fouine", 4, "On entend le son [ui].", "Dans « fouine », on entend [oui] : le son n'est pas le même."],
        ['son', "poêle|moelle|voyage|bois|boule", 4, "On entend le son [wa] (oi, oê, oe, oy).", "Dans « boule », on entend le son [ou]."],
        ['son', "hôpital|côte|rôti|dôme|boue", 4, "On entend le son [o] écrit ô.", "Dans « boue », on entend le son [ou]."],
        ['son', "accident|accent|vaccin|succès|accord", 4, "« cc » se prononce [ks] devant e et i.", "Dans « accord », « cc » est devant un o : on entend [k]."],
        ['son', "tasse|glaçon|ciel|potion|poison", 4, "On entend le son [s] (ss, ç, c, t).", "Dans « poison », le s entre deux voyelles se prononce [z]."],
        ['son', "jeudi|bougie|geai|pigeon|guidon", 4, "On entend le son [j] (j, g, ge).", "Dans « guidon », « gu » se prononce [g]."],
        ['son', "paon|faon|taon|Jean|lion", 4, "On entend le son [an] (aon, ean).", "Dans « lion », on entend le son [on]."]
    ]
};

// ── Outils ────────────────────────────────────────────────────────────────
function _itrEsc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _itrItem(lv, i) {
    const a = (ITR_BANQUE[lv] || [])[i];
    if (!a) return null;
    return { type: a[0], words: a[1].split('|'), intrus: a[2], commun: a[3], pourquoi: a[4] };
}
// Séries déjà vues, par niveau, gardées dans le navigateur :
// « Nouvelle série » propose d'abord celles qui n'ont jamais été vues.
const ITR_SEEN_KEY = 'itr-series-vues';
function _itrLoadSeen() {
    try { const o = JSON.parse(localStorage.getItem(ITR_SEEN_KEY) || '{}'); return (o && typeof o === 'object') ? o : {}; }
    catch (e) { return {}; }
}
function _itrSaveSeen(o) { try { localStorage.setItem(ITR_SEEN_KEY, JSON.stringify(o)); } catch (e) {} }
function _itrIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
function _itrSpeak(word) {
    try {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'fr-FR';
        u.rate = 0.85;
        const v = window.speechSynthesis.getVoices().find(x => /^fr/i.test(x.lang));
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

// ── Création du widget ────────────────────────────────────────────────────
function createIntrusWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'intrus';
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
    container.className = 'itr-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'itr-header';
    header.innerHTML = `
        <span class="itr-title">🕵️ L'intrus</span>
        <span class="itr-badge">Niveau 1</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.itr-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'itr-row';
    controls.innerHTML = `
        <button class="itr-btn itr-btn-green itr-btn-big" data-act="draw" title="Une nouvelle série de mots">🎲 Nouvelle série</button>
        <button class="itr-btn itr-btn-yellow" data-act="hint" title="Afficher le type de catégorie">💡 Indice</button>
        <button class="itr-btn itr-btn-grey" data-act="settings" title="Choisir les catégories et le minuteur">⚙️ Réglages</button>
        <span class="itr-score"></span>
        <div class="itr-level-btns">
            ${Object.keys(ITR_LEVELS).map(k => `<button class="itr-level-btn" data-level="${k}" title="${ITR_LEVELS[k].titre}">${ITR_LEVELS[k].label}</button>`).join('')}
        </div>
    `;
    const hintBtn     = controls.querySelector('[data-act="hint"]');
    const settingsBtn = controls.querySelector('[data-act="settings"]');
    const scoreEl     = controls.querySelector('.itr-score');
    container.appendChild(controls);

    // ── Réglages ──────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'itr-settings';
    settings.innerHTML = `
        <b>Catégories</b>
        ${Object.keys(ITR_TYPES).map(k => `<button class="itr-chip" data-type="${k}" style="--cc:${ITR_TYPES[k].c};--cl:${ITR_TYPES[k].l}">${ITR_TYPES[k].ico} ${ITR_TYPES[k].nom}</button>`).join('')}
        <b>Minuteur</b>
        <select data-role="timer">
            <option value="0">Sans</option>
            <option value="30">30 s</option>
            <option value="60">1 min</option>
            <option value="90">1 min 30</option>
        </select>
        <button class="itr-btn itr-btn-grey" data-act="reset-score" title="Remettre le score de la série à zéro">↺ Score à zéro</button>
    `;
    const timerSel = settings.querySelector('[data-role="timer"]');
    container.appendChild(settings);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'itr-stage';
    stage.style.height = Math.round(initH * 0.42) + 'px';
    container.appendChild(stage);

    // ── Justification + correction ────────────────────────────────────────
    const answerRow = document.createElement('div');
    answerRow.className = 'itr-answer-row';
    answerRow.innerHTML = `
        <input class="itr-input" type="text" maxlength="200" placeholder="Justification de la classe (facultatif) : « C'est l'intrus parce que… »" spellcheck="true" autocomplete="off">
        <button class="itr-btn itr-btn-blue itr-btn-big" data-act="correct">✅ Correction</button>
        <button class="itr-btn itr-btn-grey" data-act="hide">🙈 Cacher</button>
    `;
    const input   = answerRow.querySelector('.itr-input');
    const corrBtn = answerRow.querySelector('[data-act="correct"]');
    const hideBtn = answerRow.querySelector('[data-act="hide"]');
    container.appendChild(answerRow);

    const timerEl = document.createElement('div');
    timerEl.className = 'itr-timer';
    timerEl.innerHTML = `<span>⏱️</span><div class="itr-timer-bar"><div class="itr-timer-fill"></div></div><span class="itr-timer-txt"></span>`;
    const timerFill = timerEl.querySelector('.itr-timer-fill');
    const timerTxt  = timerEl.querySelector('.itr-timer-txt');
    container.appendChild(timerEl);

    const corr = document.createElement('div');
    corr.className = 'itr-corr';
    container.appendChild(corr);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'itr-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'itr-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 L'intrus</h4>
        <p><b>🎲 Nouvelle série</b> affiche cinq mots : quatre ont un point commun (même <b>nature</b>,
        même <b>champ lexical</b>, même <b>famille</b> ou même <b>son</b>), le cinquième est l'intrus.</p>
        <p>La classe choisit l'intrus : cliquez sur l'étiquette choisie (elle passe en bleu). Elle doit
        ensuite <b>justifier</b> son choix : à l'oral, ou tapée dans le champ.</p>
        <p><b>💡 Indice</b> révèle le type de catégorie. Le bouton 🔊 d'une étiquette lit le mot à voix haute
        (pratique pour les intrus de sons).</p>
        <p><b>✅ Correction</b> montre l'intrus, le point commun des autres mots et l'explication.
        Le score de la série compte les intrus trouvés.</p>
        <p>Il y a 144 séries par niveau : <b>🎲 Nouvelle série</b> propose d'abord celles qui n'ont jamais été
        vues (mémorisées dans ce navigateur), puis recommence un tour.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'itr-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let level = '1';
    let idx = -1;            // série en cours dans la banque du niveau
    let shown = [];          // ordre d'affichage (indices des mots)
    let chosen = -1;         // indice (dans la série) du mot choisi par la classe
    let hint = false;
    let revealed = false;
    let found = 0, played = 0;
    let types = { nat: true, lex: true, fam: true, son: true };
        let timerDur = 0, timerEnd = 0, timerIv = null;
    let showSettings = false;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function item() { return idx >= 0 ? _itrItem(level, idx) : null; }
    const canSpeak = !!window.speechSynthesis;

    // ── Tirage ────────────────────────────────────────────────────────────
    function draw() {
        const bank = ITR_BANQUE[level] || [];
        let pool = bank.map((a, i) => i).filter(i => types[bank[i][0]]);
        if (!pool.length) pool = bank.map((a, i) => i);
        // D'abord les séries jamais vues ; quand tout a été vu, on recommence un tour
        const seen = _itrLoadSeen();
        let vues = Array.isArray(seen[level]) ? seen[level] : [];
        let fresh = pool.filter(i => !vues.includes(i) && i !== idx);
        if (!fresh.length) {
            vues = vues.filter(i => !pool.includes(i));
            fresh = pool.filter(i => i !== idx);
        }
        if (!fresh.length) fresh = pool;
        idx = fresh[Math.floor(Math.random() * fresh.length)];
        vues.push(idx);
        seen[level] = vues;
        _itrSaveSeen(seen);
        const n = _itrItem(level, idx).words.length;
        shown = Array.from({ length: n }, (_, k) => k);
        for (let k = n - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [shown[k], shown[j]] = [shown[j], shown[k]];
        }
        chosen = -1; hint = false; revealed = false;
        input.value = '';
        renderAll();
        startTimer();
        save();
    }

    // ── Minuteur ──────────────────────────────────────────────────────────
    function stopTimer() { if (timerIv) { clearInterval(timerIv); timerIv = null; } }
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
    function renderStage() {
        stage.innerHTML = '';
        const it = item();
        if (!it) {
            stage.innerHTML = '<div class="itr-empty">Cliquez sur <b>🎲 Nouvelle série</b> pour afficher cinq mots… dont un intrus !</div>';
            return;
        }
        const t = ITR_TYPES[it.type];
        const q = document.createElement('div');
        q.className = 'itr-question';
        q.textContent = revealed ? 'Voici l\'intrus !' : 'Quel mot est l\'intrus ? Justifie ton choix.';
        stage.appendChild(q);
        if (hint || revealed) {
            const h = document.createElement('div');
            h.className = 'itr-hint';
            h.style.setProperty('--cc', t.c);
            h.style.setProperty('--cl', t.l);
            h.innerHTML = `${t.ico} ${t.nom}` + (revealed ? '' : ` · <span style="font-weight:600">${t.indice}</span>`);
            stage.appendChild(h);
        }
        const wrap = document.createElement('div');
        wrap.className = 'itr-words';
        shown.forEach(k => {
            const c = document.createElement('div');
            c.className = 'itr-card';
            c.dataset.k = k;
            if (chosen === k) c.classList.add('chosen');
            if (revealed) c.classList.add(k === it.intrus ? 'is-intrus' : 'is-member');
            const w = document.createElement('span');
            w.textContent = it.words[k];
            c.appendChild(w);
            if (canSpeak) {
                const sp = document.createElement('button');
                sp.className = 'itr-speak';
                sp.dataset.speak = k;
                sp.title = 'Écouter le mot';
                sp.textContent = '🔊';
                c.appendChild(sp);
            }
            if (revealed) {
                const tag = document.createElement('span');
                tag.className = 'itr-tag';
                tag.textContent = k === it.intrus ? '✗ Intrus' : '✓';
                c.appendChild(tag);
            } else if (chosen === k) {
                const tag = document.createElement('span');
                tag.className = 'itr-tag';
                tag.style.background = '#2563eb';
                tag.textContent = 'Choix de la classe';
                c.appendChild(tag);
            }
            wrap.appendChild(c);
        });
        stage.appendChild(wrap);
    }

    function renderCorr() {
        const it = item();
        if (!revealed || !it) { corr.classList.remove('show'); corr.innerHTML = ''; return; }
        const t = ITR_TYPES[it.type];
        let html = `<span class="itr-type" style="--cc:${t.c};--cl:${t.l}">${t.ico} ${t.nom}</span>` +
            `<div>🕵️ L'intrus est <b>« ${_itrEsc(it.words[it.intrus])} »</b>.</div>` +
            `<div>✅ <b>Point commun des autres mots :</b> ${_itrEsc(it.commun)}</div>` +
            `<div>❓ <b>Pourquoi c'est l'intrus :</b> ${_itrEsc(it.pourquoi)}</div>`;
        if (chosen >= 0) {
            html += chosen === it.intrus
                ? `<div class="itr-res ok">✓ La classe a trouvé l'intrus, bravo !</div>`
                : `<div class="itr-res ko">✗ La classe avait choisi « ${_itrEsc(it.words[chosen])} » : ce mot fait partie de la catégorie.</div>`;
        }
        const j = input.value.trim();
        if (j) html += `<div class="itr-just">✍️ <b>Justification de la classe :</b> « ${_itrEsc(j)} » — comparez-la avec l'explication.</div>`;
        corr.innerHTML = html;
        corr.classList.add('show');
    }

    function renderHeader() {
        badge.textContent = ITR_LEVELS[level].label;
        controls.querySelectorAll('.itr-level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
        scoreEl.textContent = played ? `🏅 Intrus trouvés : ${found} / ${played}` : '';
        hintBtn.disabled = idx < 0 || hint || revealed;
        settingsBtn.classList.toggle('on', showSettings);
        settings.classList.toggle('show', showSettings);
        settings.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('on', !!types[b.dataset.type]));
        timerSel.value = String(timerDur);
        corrBtn.disabled = idx < 0 || revealed;
        hideBtn.disabled = !revealed;
    }

    function renderAll() {
        renderHeader();
        renderStage();
        renderCorr();
        requestAnimationFrame(fit);
    }

    // ── Taille du texte selon la place disponible ─────────────────────────
    function fit() {
        const sw = stage.clientWidth - 32, sh = stage.clientHeight - 24;
        if (sw <= 0 || sh <= 0) return;
        let size = Math.max(16, Math.min(sh / 3, sw / 14, 72));
        container.style.setProperty('--itr-fs', size + 'px');
        let guard = 0;
        while ((stage.scrollHeight > stage.clientHeight + 1 || stage.scrollWidth > stage.clientWidth + 1) && size > 13 && guard++ < 80) {
            size *= 0.93;
            container.style.setProperty('--itr-fs', size + 'px');
        }
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    stage.addEventListener('click', (e) => {
        e.stopPropagation();
        const it = item();
        if (!it) return;
        const sp = e.target.closest('[data-speak]');
        if (sp) { _itrSpeak(it.words[+sp.dataset.speak]); return; }
        const c = e.target.closest('.itr-card');
        if (!c || revealed) return;
        const k = +c.dataset.k;
        chosen = chosen === k ? -1 : k;
        renderStage();
        requestAnimationFrame(fit);
        save();
    });

    function correct() {
        const it = item();
        if (!it || revealed) return;
        revealed = true;
        played++;
        if (chosen === it.intrus) found++;
        stopTimer();
        renderAll();
        save();
    }

    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-level],[data-type]');
        if (!b || !container.contains(b) || stage.contains(b)) return;
        if (b.dataset.type) {
            const k = b.dataset.type;
            types[k] = !types[k];
            if (!Object.values(types).some(Boolean)) types[k] = true;   // au moins une catégorie
            renderHeader(); save(); return;
        }
        if (b.dataset.level) {
            if (b.dataset.level === level) return;
            level = b.dataset.level;
            idx = -1; shown = []; chosen = -1; hint = false; revealed = false;
            input.value = '';
            stopTimer(); timerEl.classList.remove('show');
            renderAll(); save(); return;
        }
        switch (b.dataset.act) {
            case 'draw':        draw(); break;
            case 'hint':        hint = true; renderAll(); save(); break;
            case 'settings':    showSettings = !showSettings; renderAll(); save(); break;
            case 'reset-score': found = 0; played = 0; renderHeader(); save(); break;
            case 'correct':     correct(); break;
            case 'hide':        revealed = false; renderAll(); save(); break;
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
        if (e.key === 'Enter') correct();
    });
    input.addEventListener('click', (e) => { e.stopPropagation(); input.focus(); });
    input.addEventListener('change', save);

    [stage, settings, answerRow, corr, timerEl].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre (largeur + hauteur de la zone des mots) ───
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
            window._wfMiniBarCollapse(widget, '🕵️ L\'intrus', { onExpand: () => requestAnimationFrame(fit) });
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

    widget._itrGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        level, idx, shown: shown.slice(), chosen, hint, revealed,
        found, played,
        just: input.value,
        types: Object.assign({}, types),
        timer: timerDur,
        showSettings,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_itrIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._itrSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_itrIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        level = ITR_LEVELS[d.level] ? String(d.level) : '1';
        const it = Number.isInteger(d.idx) ? _itrItem(level, d.idx) : null;
        if (it) {
            idx = d.idx;
            const n = it.words.length;
            const okShown = Array.isArray(d.shown) && d.shown.length === n && d.shown.every(k => Number.isInteger(k) && k >= 0 && k < n);
            shown = okShown ? d.shown.slice() : Array.from({ length: n }, (_, k) => k);
            chosen = (Number.isInteger(d.chosen) && d.chosen >= 0 && d.chosen < n) ? d.chosen : -1;
            hint = !!d.hint;
            revealed = !!d.revealed;
        } else {
            idx = -1; shown = []; chosen = -1; hint = false; revealed = false;
        }
        found  = parseInt(d.found, 10)  || 0;
        played = parseInt(d.played, 10) || 0;
        input.value = d.just || '';
        if (d.types) Object.keys(types).forEach(k => { if (typeof d.types[k] === 'boolean') types[k] = d.types[k]; });
        if (!Object.values(types).some(Boolean)) types.nat = true;
        timerDur = [0, 30, 60, 90].includes(d.timer) ? d.timer : 0;
        showSettings = !!d.showSettings;
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(fit, 250);
    };

    saveBoard();
    return widget;
}
