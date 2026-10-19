// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// open()   : bascule le plein écran du widget ; isOpen() : vrai s'il est en plein écran.
// setKey   : nom de la fonction de restauration (widget._xxSetData) : si le widget est
//            restauré depuis une sauvegarde, le plein écran automatique est annulé.
// launchOnly : n'ouvrir que si le widget vient d'être lancé depuis un panneau.
if (!window._wfPhoneAutoMax) {
    window._wfPhoneAutoMax = function (widget, open, isOpen, setKey, launchOnly) {
        var phone = false;
        if (typeof isMobileBoardMode === 'function') { try { phone = !!isMobileBoardMode(); } catch (e) {} }
        if (!phone && window.matchMedia) phone = window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches;
        if (!phone) return;
        if (launchOnly && !(typeof window._wfLastLaunch === 'number' && Date.now() - window._wfLastLaunch <= 2500)) return;
        var restored = false, auto = false;
        if (setKey && typeof widget[setKey] === 'function') {
            var orig = widget[setKey];
            widget[setKey] = function () {
                restored = true;
                if (auto && isOpen()) open();
                auto = false;
                return orig.apply(this, arguments);
            };
        }
        requestAnimationFrame(function () {
            if (restored || isOpen() || !widget.isConnected) return;
            auto = true;
            open();
        });
    };
}

/* ═══════════════════════════════════════════════════════════════════
   widget-devinettes.js — Widget « Devinettes »
   Le Bureau du Prof

   Affiche une devinette adaptée aux élèves de fin de primaire (CM1-CM2) :
   - 140 devinettes, une par jour de classe de l'année, réparties en
     6 thèmes : Qui suis-je ?, logique, maths, mots et jeux de mots,
     charades, sciences et nature
   - niveau de difficulté (★ facile, ★★ moyen, ★★★ difficile)
   - bouton « 💡 Indice », puis « 👀 Voir la réponse » avec une
     explication quand la réponse mérite d'être expliquée
   - bouton « ⏱ Réfléchir » : temps de réflexion avec barre qui se
     vide, petit son à la fin, réponse dévoilée automatiquement (option)

   Barre du haut :
   - ⚙ réglages : mode (devinette du jour / au hasard), thèmes et
     niveaux proposés, temps de réflexion, devinettes de l'enseignant
   - ‹ 🎲 › pour passer d'une devinette à l'autre ou en tirer une au
     hasard, ⟲ pour revenir à la devinette du jour
   - boutons fenêtre jaune (réduire), vert (plein écran), rouge (fermer),
     identiques à ceux de l'éphéméride

   Mode « devinette du jour » : la devinette change chaque jour du lundi
   au vendredi (pas le week-end) et toutes les devinettes passent avant
   qu'une même devinette revienne.

   Clavier (souris sur le widget ou plein écran) : I indice, R ou Entrée
   réponse, T temps de réflexion, ← → devinette précédente / suivante,
   F plein écran, Échap pour en sortir.

   Utilisation : createWidget('devinettes')
   Le template #template-devinettes est injecté dans le DOM par ce fichier.
   Les réglages sont stockés dans l'attribut data-cfg de .dv-root et
   sauvegardés avec le board (voir devGetData / devSetData, save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Thèmes ───────────────────────────────────────────────────── */
    const THEMES = {
        quisuisje: { nom: 'Qui suis-je ?',          ico: '🔍', c: '#2f6fb5' },
        logique:   { nom: 'Logique',                ico: '🧠', c: '#7b5cc4' },
        maths:     { nom: 'Maths',                  ico: '🔢', c: '#d9822b' },
        mots:      { nom: 'Mots et jeux de mots',   ico: '🔤', c: '#d6456b' },
        charades:  { nom: 'Charades',               ico: '🎭', c: '#2e9e6a' },
        sciences:  { nom: 'Sciences et nature',     ico: '🌍', c: '#3a8f8f' },
        perso:     { nom: 'Mes devinettes',         ico: '✏️', c: '#5a5f6b' }
    };
    const THEME_KEYS = ['quisuisje', 'logique', 'maths', 'mots', 'charades', 'sciences'];
    const NIVEAUX = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' };

    /* ── Devinettes ───────────────────────────────────────────────────
       th : thème, n : difficulté (1 à 3), q : devinette, r : réponse,
       i : indice (facultatif), e : explication (facultative)            */
    const DEVINETTES = [
        /* ── Qui suis-je ? ── */
        { th: 'quisuisje', n: 1, q: 'J’ai des dents mais je ne mords jamais. Qui suis-je ?', r: 'Un peigne', i: 'On m’utilise le matin devant le miroir.' },
        { th: 'quisuisje', n: 1, q: 'Je suis plein de trous mais je retiens l’eau. Qui suis-je ?', r: 'Une éponge', i: 'On m’utilise pour laver la vaisselle.' },
        { th: 'quisuisje', n: 1, q: 'J’ai des aiguilles mais je ne sais pas coudre. Qui suis-je ?', r: 'Une horloge', i: 'Je fais tic-tac.', e: 'On accepte aussi le hérisson ou le sapin : eux aussi ont des « aiguilles » !' },
        { th: 'quisuisje', n: 1, q: 'Je monte et je descends sans jamais bouger. Qui suis-je ?', r: 'Un escalier', i: 'On me trouve dans les maisons à étage.' },
        { th: 'quisuisje', n: 2, q: 'Plus je sèche, plus je suis mouillée. Qui suis-je ?', r: 'Une serviette', i: 'On m’utilise en sortant de la douche.', e: 'En séchant les autres, elle prend leur eau et devient de plus en plus mouillée.' },
        { th: 'quisuisje', n: 2, q: 'J’ai un lit mais je ne dors jamais, j’ai une bouche mais je ne parle pas. Qui suis-je ?', r: 'Une rivière', i: 'Je coule vers la mer.', e: 'On parle du « lit » d’une rivière (là où coule l’eau) et de son « embouchure » (là où elle se jette dans la mer).' },
        { th: 'quisuisje', n: 2, q: 'Je suis toujours devant toi, mais tu ne peux jamais me voir. Qui suis-je ?', r: 'L’avenir (le futur)', i: 'Je n’existe pas encore.' },
        { th: 'quisuisje', n: 1, q: 'J’ai des feuilles mais je ne suis pas un arbre. Qui suis-je ?', r: 'Un livre (ou un cahier)', i: 'Tu en as dans ton cartable.' },
        { th: 'quisuisje', n: 2, q: 'J’ai un col mais pas de tête, deux manches mais pas de mains. Qui suis-je ?', r: 'Une chemise (ou un pull)', i: 'On me porte sur le dos… et sur les bras.' },
        { th: 'quisuisje', n: 1, q: 'On doit me casser avant de pouvoir m’utiliser. Qui suis-je ?', r: 'Un œuf', i: 'Les poules me pondent.' },
        { th: 'quisuisje', n: 2, q: 'Je réponds dans toutes les langues sans jamais les avoir apprises. Qui suis-je ?', r: 'L’écho', i: 'On m’entend en montagne quand on crie.', e: 'L’écho répète ce qu’on dit, quelle que soit la langue : le son rebondit sur la montagne et revient vers nous.' },
        { th: 'quisuisje', n: 2, q: 'Je disparais dès qu’on prononce mon nom. Qui suis-je ?', r: 'Le silence', i: 'La maîtresse ou le maître me réclame souvent.' },
        { th: 'quisuisje', n: 3, q: 'Je marche à quatre pattes le matin, sur deux pattes à midi et sur trois pattes le soir. Qui suis-je ?', r: 'L’être humain', i: 'Le « matin », le « midi » et le « soir » représentent les âges de la vie.', e: 'C’est l’énigme du Sphinx, dans la mythologie grecque : bébé, on marche à quatre pattes ; adulte, sur deux jambes ; vieillard, avec une canne.' },
        { th: 'quisuisje', n: 3, q: 'Je suis noir quand on m’achète, rouge quand on m’utilise et gris quand on me jette. Qui suis-je ?', r: 'Le charbon', i: 'Autrefois, on me mettait dans le poêle pour chauffer la maison.', e: 'Le charbon est noir, il devient rouge en brûlant, et il ne reste ensuite que des cendres grises.' },
        { th: 'quisuisje', n: 2, q: 'Je vole sans ailes et je pleure sans yeux. Qui suis-je ?', r: 'Un nuage', i: 'Regarde le ciel.', e: 'Le nuage se déplace dans le ciel et ses « larmes », c’est la pluie.' },
        { th: 'quisuisje', n: 2, q: 'Je t’appartiens, mais les autres m’utilisent beaucoup plus que toi. Qui suis-je ?', r: 'Ton prénom', i: 'On t’appelle avec moi.' },
        { th: 'quisuisje', n: 2, q: 'Je peux remplir toute une pièce sans prendre aucune place. Qui suis-je ?', r: 'La lumière', i: 'On m’allume avec un interrupteur.' },
        { th: 'quisuisje', n: 1, q: 'J’ai des touches et des clés, mais je n’ouvre aucune porte. Qui suis-je ?', r: 'Un piano', i: 'Je fais de la musique.', e: 'On accepte aussi le clavier d’ordinateur.' },
        { th: 'quisuisje', n: 1, q: 'Je tombe sans jamais me faire mal. Qui suis-je ?', r: 'La pluie', i: 'Prends ton parapluie !', e: 'On accepte aussi la nuit, qui « tombe » chaque soir.' },
        { th: 'quisuisje', n: 1, q: 'J’ai un chapeau mais pas de tête, un pied mais pas de chaussure. Qui suis-je ?', r: 'Un champignon', i: 'On me cueille en forêt à l’automne.' },
        { th: 'quisuisje', n: 2, q: 'Je grandis quand on me nourrit, et je meurs quand on me donne à boire. Qui suis-je ?', r: 'Le feu', i: 'Les pompiers me combattent.', e: 'On nourrit le feu avec du bois, et l’eau l’éteint.' },
        { th: 'quisuisje', n: 2, q: 'Plus on m’enlève de choses, plus je deviens grand. Qui suis-je ?', r: 'Un trou', i: 'On me creuse avec une pelle.' },
        { th: 'quisuisje', n: 1, q: 'J’ai six pattes, je vis dans une ruche et je fabrique du miel. Qui suis-je ?', r: 'Une abeille', i: 'Je butine les fleurs.' },
        { th: 'quisuisje', n: 1, q: 'Je change de couleur pour me cacher et ma langue est plus longue que mon corps. Qui suis-je ?', r: 'Le caméléon', i: 'Je suis un reptile.' },
        { th: 'quisuisje', n: 1, q: 'Je porte ma maison sur mon dos et je laisse derrière moi une trace qui brille. Qui suis-je ?', r: 'L’escargot', i: 'Je sors quand il pleut.' },
        { th: 'quisuisje', n: 2, q: 'J’ai un œil mais je ne vois rien. Qui suis-je ?', r: 'Une aiguille à coudre', i: 'On passe un fil dans mon « œil ».', e: 'Le petit trou de l’aiguille où l’on passe le fil s’appelle le chas, ou l’œil de l’aiguille.' },
        { th: 'quisuisje', n: 2, q: 'Je te suis partout. Je suis très longue le soir et toute petite à midi. Qui suis-je ?', r: 'Ton ombre', i: 'J’ai besoin du soleil pour exister.', e: 'À midi, le soleil est haut dans le ciel : l’ombre est courte. Le soir, il est bas : l’ombre s’allonge.' },
        { th: 'quisuisje', n: 3, q: 'On me jette quand on a besoin de moi, et on me remonte quand on n’a plus besoin de moi. Qui suis-je ?', r: 'L’ancre d’un bateau', i: 'On me trouve sur les bateaux.', e: 'On jette l’ancre au fond de l’eau pour que le bateau reste en place, puis on la remonte pour repartir.' },
        { th: 'quisuisje', n: 3, q: 'J’ai des villes sans maisons, des forêts sans arbres et des rivières sans eau. Qui suis-je ?', r: 'Une carte de géographie', i: 'On m’affiche au mur de la classe.' },
        { th: 'quisuisje', n: 3, q: 'Je peux faire le tour du monde en restant toujours dans mon coin. Qui suis-je ?', r: 'Un timbre', i: 'On me colle sur une enveloppe.', e: 'Le timbre reste dans le coin de l’enveloppe, qui peut voyager jusqu’à l’autre bout du monde.' },
        { th: 'quisuisje', n: 3, q: 'J’ai des yeux mais je ne vois rien, et je pousse sous la terre. Qui suis-je ?', r: 'Une pomme de terre', i: 'On me mange en frites ou en purée.', e: 'Les petits creux d’où partent les germes de la pomme de terre s’appellent des « yeux ».' },

        /* ── Logique ── */
        { th: 'logique', n: 2, q: 'Un fermier a 17 moutons. Tous s’enfuient sauf 9. Combien lui en reste-t-il ?', r: '9 moutons', i: 'Relis bien le mot « sauf ».', e: '« Tous sauf 9 » veut dire que 9 moutons ne se sont pas enfuis.' },
        { th: 'logique', n: 2, q: 'Le père de Marie a cinq filles : Lala, Lélé, Lili, Lolo… Comment s’appelle la cinquième ?', r: 'Marie', i: 'Relis le début de la phrase.', e: 'Ce n’est pas Lulu : c’est le père de Marie, donc Marie est la cinquième fille !' },
        { th: 'logique', n: 2, q: 'Pendant une course, tu doubles le deuxième. À quelle place es-tu maintenant ?', r: 'Deuxième', i: 'Tu prends la place de celui que tu doubles.', e: 'Beaucoup répondent « premier », mais le premier est toujours devant toi !' },
        { th: 'logique', n: 1, q: 'Qu’est-ce qui est le plus lourd : un kilo de plumes ou un kilo de plomb ?', r: 'Aucun : les deux pèsent un kilo !', i: 'Regarde bien le poids de chacun.', e: 'Le plomb est plus lourd à volume égal, mais un kilo reste un kilo. Les plumes prennent juste beaucoup plus de place.' },
        { th: 'logique', n: 2, q: 'Combien de mois de l’année ont 28 jours ?', r: 'Les 12 mois !', i: 'Février n’est pas le seul…', e: 'Tous les mois ont au moins 28 jours. Février est le seul à n’avoir que 28 (ou 29) jours.' },
        { th: 'logique', n: 1, q: 'Un coq pond un œuf tout en haut d’un toit pointu. De quel côté tombe l’œuf ?', r: 'D’aucun côté : un coq ne pond pas d’œufs !', i: 'Qui pond les œufs dans le poulailler ?' },
        { th: 'logique', n: 2, q: 'Tu entres dans une pièce sombre avec une seule allumette. Il y a une bougie, une lampe à huile et un feu de cheminée. Qu’allumes-tu en premier ?', r: 'L’allumette !', i: 'Avec quoi vas-tu allumer le reste ?' },
        { th: 'logique', n: 3, q: 'Un homme regarde un portrait et dit : « Je n’ai ni frère ni sœur, mais le père de cet homme est le fils de mon père. » Qui est sur le portrait ?', r: 'Son fils', i: 'Qui est « le fils de mon père » quand on n’a ni frère ni sœur ?', e: '« Le fils de mon père », c’est lui-même. Donc le père de l’homme du portrait, c’est lui : le portrait montre son fils.' },
        { th: 'logique', n: 3, q: 'Trois chats attrapent trois souris en trois minutes. Combien faut-il de chats pour attraper 100 souris en 100 minutes ?', r: '3 chats', i: 'Combien de souris un seul chat attrape-t-il en 3 minutes ?', e: 'Chaque chat attrape 1 souris en 3 minutes. Les 3 chats ensemble attrapent donc 1 souris par minute, soit 100 souris en 100 minutes.' },
        { th: 'logique', n: 1, q: 'Qu’est-ce qui monte toujours et ne redescend jamais ?', r: 'Ton âge', i: 'Ça change à chaque anniversaire.' },
        { th: 'logique', n: 3, q: 'Un escargot est au fond d’un puits de 10 mètres. Chaque jour, il monte de 3 mètres. Chaque nuit, il glisse de 2 mètres. En combien de jours sort-il du puits ?', r: 'En 8 jours', i: 'Attention : le dernier jour, il sort avant de glisser !', e: 'Il gagne 1 mètre par jour et nuit. Au bout de 7 jours et 7 nuits, il est à 7 mètres. Le 8e jour, il monte de 3 mètres et atteint 10 mètres : il est sorti !' },
        { th: 'logique', n: 3, q: 'Le médecin te donne 3 comprimés à prendre, un toutes les demi-heures. Combien de temps durent-ils ?', r: 'Une heure', i: 'Tu prends le premier tout de suite.', e: 'Le premier tout de suite, le deuxième 30 minutes après, le troisième 30 minutes plus tard : en tout, une heure.' },
        { th: 'logique', n: 2, q: 'Avant-hier, c’était lundi. Quel jour serons-nous après-demain ?', r: 'Vendredi', i: 'Trouve d’abord quel jour on est aujourd’hui.', e: 'Avant-hier lundi, donc aujourd’hui mercredi, et après-demain vendredi.' },
        { th: 'logique', n: 2, q: 'Un bus part avec 10 passagers. Au premier arrêt, 3 descendent et 5 montent. Au deuxième, 6 descendent et 2 montent. Combien y a-t-il de personnes dans le bus ?', r: '9 personnes : 8 passagers et le chauffeur !', i: 'N’oublie personne…', e: '10 − 3 + 5 − 6 + 2 = 8 passagers. Mais il ne faut pas oublier le chauffeur !' },
        { th: 'logique', n: 2, q: 'Dans une pièce carrée, il y a un chat dans chaque coin. En face de chaque chat, il y a 3 chats. Combien y a-t-il de chats en tout ?', r: '4 chats', i: 'Dessine la pièce.', e: 'Chaque chat voit les 3 autres chats en face de lui : il n’y en a que 4.' },
        { th: 'logique', n: 2, q: 'Un père et son fils ont un accident de vélo. Le fils est emmené à l’hôpital. Le chirurgien s’écrie : « Je ne peux pas l’opérer, c’est mon fils ! » Comment est-ce possible ?', r: 'Le chirurgien est sa mère !', i: 'Qui d’autre peut dire « mon fils » ?', e: 'Cette devinette montre que l’on imagine souvent, sans y penser, qu’un chirurgien est un homme.' },
        { th: 'logique', n: 3, q: 'Combien de fois peut-on enlever 2 de 10 ?', r: 'Une seule fois', i: 'Que devient le nombre 10 après la première fois ?', e: 'Après avoir enlevé 2, on n’enlève plus 2 de 10, mais de 8 !' },
        { th: 'logique', n: 2, q: 'Un garçon tombe d’une échelle de 10 mètres et ne se fait pas mal du tout. Comment est-ce possible ?', r: 'Il est tombé du premier barreau !', i: 'De quelle hauteur est-il tombé ?' },
        { th: 'logique', n: 3, q: 'Paul a deux pièces qui font 3 € en tout. L’une des deux n’est pas une pièce de 1 €. Quelles sont ces pièces ?', r: 'Une pièce de 2 € et une pièce de 1 €', i: 'L’une n’est pas une pièce de 1 €… mais l’autre ?', e: 'C’est la pièce de 2 € qui n’est pas une pièce de 1 €. L’autre, elle, en est une !' },
        { th: 'logique', n: 2, q: 'Les parents de Léa ont trois filles. Chaque fille a un frère. Combien ont-ils d’enfants ?', r: '4 enfants', i: 'Est-ce que chaque fille a un frère différent ?', e: 'Les trois filles ont le même frère : 3 filles + 1 garçon = 4 enfants.' },
        { th: 'logique', n: 1, q: 'Un train électrique roule vers le nord. Le vent souffle vers le sud. De quel côté part la fumée ?', r: 'D’aucun côté : un train électrique ne fait pas de fumée !', i: 'Comment avance un train électrique ?' },
        { th: 'logique', n: 3, q: 'Avant-hier, Tom avait 10 ans. L’année prochaine, il aura 13 ans. Comment est-ce possible ?', r: 'Nous sommes le 1er janvier et Tom est né le 31 décembre.', i: 'Pense à une date de naissance très particulière.', e: 'Le 30 décembre, il avait 10 ans. Le 31, il a eu 11 ans. Le 31 décembre de cette année, il aura 12 ans, et l’année prochaine 13 ans.' },
        { th: 'logique', n: 3, q: 'Un homme habite au 10e étage. Le matin, il prend l’ascenseur pour descendre. Le soir, il prend l’ascenseur jusqu’au 7e étage et finit à pied… sauf les jours de pluie. Pourquoi ?', r: 'Il est petit : il n’atteint que le bouton du 7e étage.', i: 'Qu’a-t-il dans la main les jours de pluie ?', e: 'Les jours de pluie, il a son parapluie : il s’en sert pour appuyer sur le bouton du 10e étage.' },
        { th: 'logique', n: 1, q: 'Quelle heure est-il quand l’horloge sonne treize coups ?', r: 'L’heure de la faire réparer !', i: 'Une horloge sonne au maximum 12 coups.' },
        { th: 'logique', n: 1, q: 'Il y a 3 pommes sur la table. Tu en prends 2. Combien de pommes as-tu ?', r: '2 pommes', i: 'Combien en as-tu dans les mains ?', e: 'Il en reste 1 sur la table, mais toi, tu en as 2 !' },

        /* ── Maths ── */
        { th: 'maths', n: 1, q: 'Quel chiffre devient plus grand quand on le retourne la tête en bas ?', r: 'Le 6 (il devient 9)', i: 'Essaie de dessiner les chiffres à l’envers.' },
        { th: 'maths', n: 2, q: 'Je pense à un nombre. Je le double, puis j’ajoute 4. Je trouve 20. Quel est mon nombre ?', r: '8', i: 'Fais les calculs à l’envers.', e: '20 − 4 = 16, et la moitié de 16, c’est 8.' },
        { th: 'maths', n: 3, q: 'Un stylo et une gomme coûtent 1,10 € ensemble. Le stylo coûte 1 € de plus que la gomme. Combien coûte la gomme ?', r: '5 centimes', i: 'Ce n’est pas 10 centimes !', e: 'Si la gomme coûtait 10 centimes, le stylo coûterait 1,10 € et le total ferait 1,20 €. Avec une gomme à 5 centimes, le stylo coûte 1,05 € : total 1,10 €.' },
        { th: 'maths', n: 3, q: 'Combien de fois écrit-on le chiffre 9 quand on écrit tous les nombres de 1 à 100 ?', r: '20 fois', i: 'Compte les 9 des unités, puis les 9 des dizaines.', e: '10 fois aux unités (9, 19, 29… 99) et 10 fois aux dizaines (90 à 99). Attention, 99 compte deux fois !' },
        { th: 'maths', n: 3, q: 'Comment obtenir 1 000 en additionnant uniquement des nombres écrits avec le chiffre 8, en l’utilisant 8 fois en tout ?', r: '888 + 88 + 8 + 8 + 8 = 1 000', i: 'Commence par le plus grand nombre possible : 888.' },
        { th: 'maths', n: 1, q: 'Quel nombre vient ensuite : 1, 2, 4, 8, 16… ?', r: '32', i: 'Regarde comment on passe d’un nombre au suivant.', e: 'Chaque nombre est le double du précédent.' },
        { th: 'maths', n: 2, q: 'Quel nombre vient ensuite : 1, 1, 2, 3, 5, 8… ?', r: '13', i: 'Additionne deux nombres qui se suivent.', e: 'Chaque nombre est la somme des deux précédents : 5 + 8 = 13. C’est la suite de Fibonacci.' },
        { th: 'maths', n: 3, q: 'Quel nombre vient ensuite : 2, 5, 10, 17, 26… ?', r: '37', i: 'Regarde les écarts entre les nombres.', e: 'On ajoute 3, puis 5, puis 7, puis 9… puis 11 : 26 + 11 = 37.' },
        { th: 'maths', n: 3, q: 'Deux poules pondent deux œufs en deux jours. Combien d’œufs pondent quatre poules en quatre jours ?', r: '8 œufs', i: 'Combien d’œufs pond une seule poule en deux jours ?', e: 'Une poule pond 1 œuf en 2 jours, donc 2 œufs en 4 jours. Quatre poules pondent 4 × 2 = 8 œufs.' },
        { th: 'maths', n: 3, q: 'Un nénuphar double de taille chaque jour. Il recouvre tout l’étang au bout de 30 jours. Quel jour recouvrait-il la moitié de l’étang ?', r: 'Le 29e jour', i: 'Que se passe-t-il entre le 29e et le 30e jour ?', e: 'Comme il double chaque jour, la veille de recouvrir tout l’étang, il en recouvrait la moitié.' },
        { th: 'maths', n: 2, q: 'Combien y a-t-il de carrés dans une grille de 2 cases sur 2 ?', r: '5 carrés', i: 'N’oublie pas le grand carré !', e: '4 petits carrés + 1 grand carré qui les entoure = 5.' },
        { th: 'maths', n: 2, q: 'Quel nombre, multiplié par lui-même, donne 144 ?', r: '12', i: 'Pense à la table de 12.', e: '12 × 12 = 144.' },
        { th: 'maths', n: 1, q: 'Combien de pattes ont 3 poules et 2 chiens ensemble ?', r: '14 pattes', i: 'Une poule a 2 pattes, un chien en a 4.', e: '3 × 2 = 6 et 2 × 4 = 8, donc 6 + 8 = 14.' },
        { th: 'maths', n: 2, q: 'Lucas a 10 ans. Sa sœur a la moitié de son âge. Quand Lucas aura 20 ans, quel âge aura sa sœur ?', r: '15 ans', i: 'La différence d’âge ne change jamais.', e: 'Sa sœur a 5 ans, soit 5 ans de moins que lui. Quand il aura 20 ans, elle en aura 15 (et pas 10 !).' },
        { th: 'maths', n: 2, q: 'Je suis un nombre entre 10 et 20. Je suis pair. Si on additionne mes deux chiffres, on trouve 7. Qui suis-je ?', r: '16', i: 'Mon chiffre des dizaines est 1.', e: '1 + 6 = 7, et 16 est bien pair.' },
        { th: 'maths', n: 3, q: 'Je suis un nombre à deux chiffres. Mon chiffre des dizaines est le double de mon chiffre des unités, et la somme de mes chiffres est 9. Qui suis-je ?', r: '63', i: 'Essaie avec les unités : 1, 2, 3…', e: '6 est le double de 3, et 6 + 3 = 9.' },
        { th: 'maths', n: 2, q: 'Combien y a-t-il de minutes dans une journée ?', r: '1 440 minutes', i: 'Une journée dure 24 heures.', e: '24 × 60 = 1 440.' },
        { th: 'maths', n: 3, q: 'Combien de fois écris-tu le chiffre 1 quand tu écris tous les nombres de 1 à 20 ?', r: '12 fois', i: 'Attention au nombre 11 !', e: '1, 10, 11 (deux fois), 12, 13, 14, 15, 16, 17, 18, 19 : cela fait 12 fois.' },
        { th: 'maths', n: 2, q: 'Combien un cube a-t-il de sommets (de coins) ?', r: '8 sommets', i: '4 en haut et…', e: '4 sommets sur la face du dessus et 4 sur la face du dessous. Un cube a aussi 6 faces et 12 arêtes.' },
        { th: 'maths', n: 3, q: 'Avec seulement 3 allumettes, sans les casser, comment écrire le nombre 4 ?', r: 'En chiffres romains : IV', i: 'Pense aux chiffres des Romains.', e: 'Une allumette pour le I, deux allumettes en V pour le V.' },
        { th: 'maths', n: 2, q: 'Quelle est la moitié de 8 ?', r: '4… ou 0, ou 3 !', i: 'Et si on coupait le chiffre 8 dessiné ?', e: 'En calcul, c’est 4. Mais si on coupe le chiffre 8 en deux horizontalement, on obtient deux 0. Verticalement, on obtient deux 3 !' },
        { th: 'maths', n: 2, q: 'Combien font 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 ?', r: '55', i: 'Additionne le premier et le dernier, puis le deuxième et l’avant-dernier…', e: '1 + 10 = 11, 2 + 9 = 11, 3 + 8 = 11… On a 5 paires de 11 : 5 × 11 = 55. C’est l’astuce du mathématicien Gauss, enfant.' },
        { th: 'maths', n: 1, q: 'Combien y a-t-il de jours dans 5 semaines ?', r: '35 jours', i: 'Une semaine compte 7 jours.', e: '5 × 7 = 35.' },
        { th: 'maths', n: 3, q: 'On trace les deux diagonales d’un carré. Combien de triangles peut-on voir ?', r: '8 triangles', i: 'Il y a des petits triangles… et des grands.', e: '4 petits triangles au centre, et 4 grands triangles formés chacun par une seule diagonale (2 par diagonale).' },

        /* ── Mots et jeux de mots ── */
        { th: 'mots', n: 2, q: 'Je commence la nuit et je finis le matin. Qui suis-je ?', r: 'La lettre N', i: 'Regarde bien comment s’écrivent ces deux mots.', e: 'Le mot « nuit » commence par N, et le mot « matin » finit par N.' },
        { th: 'mots', n: 2, q: 'On me voit une fois dans « minute », deux fois dans « moment », et jamais dans « heure ». Qui suis-je ?', r: 'La lettre M', i: 'Cherche dans les lettres des mots.' },
        { th: 'mots', n: 1, q: 'Quel est le mois le plus court de l’année ?', r: 'Mai : il n’a que 3 lettres !', i: 'Compte les lettres plutôt que les jours.', e: 'Si on compte les jours, c’est février. Mais si on compte les lettres, c’est mai !' },
        { th: 'mots', n: 2, q: 'Quel mot s’écrit toujours mal ?', r: 'Le mot « mal »', i: 'Lis la question au pied de la lettre.' },
        { th: 'mots', n: 2, q: 'Qu’y a-t-il au milieu de Paris ?', r: 'La lettre R', i: 'Il ne s’agit pas d’un monument.', e: 'P-A-R-I-S : la lettre du milieu est le R.' },
        { th: 'mots', n: 1, q: 'Quel est le comble pour un électricien ?', r: 'Ne pas être au courant', i: 'Pense à ce qui passe dans les fils électriques.', e: 'Le courant électrique… et « être au courant », c’est être informé.' },
        { th: 'mots', n: 1, q: 'Quel est le comble pour un jardinier ?', r: 'Raconter des salades', i: 'Que pousse-t-il dans son potager ?', e: '« Raconter des salades », c’est raconter des mensonges.' },
        { th: 'mots', n: 2, q: 'Quel est le comble pour un boulanger ?', r: 'Être dans le pétrin', i: 'Le pétrin est l’endroit où il pétrit sa pâte.', e: '« Être dans le pétrin », c’est avoir de gros ennuis.' },
        { th: 'mots', n: 2, q: 'Quel est le comble pour un cordonnier (celui qui répare les chaussures) ?', r: 'Être mal chaussé', i: 'Il s’occupe des pieds des autres…', e: 'C’est un vieux proverbe : « Les cordonniers sont toujours les plus mal chaussés. » On ne prend pas soin de soi quand on s’occupe des autres.' },
        { th: 'mots', n: 1, q: 'Quel est le comble pour un mathématicien ?', r: 'Avoir des problèmes', i: 'Pense aux exercices de maths.' },
        { th: 'mots', n: 1, q: 'Quel est le comble pour une souris ?', r: 'Avoir un chat dans la gorge', i: 'Quel animal fait peur aux souris ?', e: '« Avoir un chat dans la gorge », c’est avoir la voix enrouée.' },
        { th: 'mots', n: 2, q: 'Je suis un petit bateau qu’on fait avancer avec une pagaie, et mon nom se lit pareil dans les deux sens. Qui suis-je ?', r: 'Un kayak', i: 'K-A-Y-…', e: 'Un mot qui se lit pareil dans les deux sens s’appelle un palindrome.' },
        { th: 'mots', n: 2, q: 'Je suis un appareil qui repère les avions et les voitures trop rapides, et mon nom se lit pareil dans les deux sens. Qui suis-je ?', r: 'Un radar', i: 'R-A-…', e: 'Comme « kayak », « radar » est un palindrome.' },
        { th: 'mots', n: 2, q: 'Mélange les lettres du mot CHIEN pour trouver le nom d’un grand pays.', r: 'La CHINE', i: 'C’est le pays où vivent les pandas géants.', e: 'Un mot formé avec les mêmes lettres qu’un autre mot s’appelle une anagramme.' },
        { th: 'mots', n: 1, q: 'Mélange les lettres du mot RAME pour trouver une petite étendue d’eau où vivent des grenouilles.', r: 'Une MARE', i: 'Le mot commence par M.' },
        { th: 'mots', n: 2, q: 'Quel mot de 6 lettres contient les 5 voyelles A, E, I, O et U ?', r: 'OISEAU', i: 'Il a des ailes.' },
        { th: 'mots', n: 1, q: 'Qu’est-ce qui est jaune et qui attend ?', r: 'Jonathan !', i: 'Écoute bien le son du mot…', e: 'Jaune… attend : « Jaune-attend », ça se prononce comme Jonathan !' },
        { th: 'mots', n: 1, q: 'Quel est l’animal le plus heureux ?', r: 'Le hibou, parce que sa femme est chouette !', i: 'C’est un oiseau de nuit.', e: '« Chouette » veut aussi dire « super ».' },
        { th: 'mots', n: 1, q: 'Quel est le fruit préféré des professeurs d’histoire ?', r: 'Les dattes', i: 'En histoire, on apprend beaucoup de…', e: 'Une datte (le fruit) se prononce comme une date (en histoire).' },
        { th: 'mots', n: 1, q: 'Que dit le chiffre 0 au chiffre 8 ?', r: '« Jolie ceinture ! »', i: 'Regarde la forme du 8.' },
        { th: 'mots', n: 1, q: 'Quelle lettre de l’alphabet peut-on boire ?', r: 'Le T (le thé)', i: 'On la boit chaude, souvent avec un nuage de lait.' },
        { th: 'mots', n: 2, q: 'Qu’est-ce qui se trouve au début de la fin ?', r: 'La lettre F', i: 'Regarde bien le mot « fin ».' },
        { th: 'mots', n: 2, q: 'Pourquoi les vaches ferment-elles les yeux pendant la traite ?', r: 'Pour faire du lait concentré !', i: 'Quand on ferme les yeux, on se…', e: 'Le lait concentré est un lait très épais… et une vache qui ferme les yeux se concentre !' },
        { th: 'mots', n: 1, q: 'Quel est le sport le plus silencieux ?', r: 'Le parachuchute', i: 'On saute d’un avion…', e: 'Para-« chut » : chut, silence !' },

        /* ── Charades ── */
        { th: 'charades', n: 1, q: 'Mon premier miaule. Mon second recouvre tout notre corps. Mon tout se porte sur la tête.', r: 'Un chapeau (chat + peau)', i: 'On le met quand il y a du soleil.' },
        { th: 'charades', n: 1, q: 'Mon premier miaule. Mon second est le contraire de « tard ». Mon tout est la demeure d’un roi.', r: 'Un château (chat + tôt)', i: 'Il a souvent des tours et un pont-levis.' },
        { th: 'charades', n: 1, q: 'Mon premier vit dans les cheveux. Mon second se boit au petit-déjeuner. Mon tout fait cot-cot dans la basse-cour.', r: 'Un poulet (pou + lait)', i: 'Mon premier donne des démangeaisons.' },
        { th: 'charades', n: 2, q: 'Mon premier se met dans les frites. Mon second pousse dans les rizières. Mon tout est un légume.', r: 'Le céleri (sel + riz)', i: 'Mon premier est blanc et salé.' },
        { th: 'charades', n: 2, q: 'Mon premier se mange avec le fromage. Mon second sert à transporter de l’eau. Mon tout sert à peindre.', r: 'Un pinceau (pain + seau)', i: 'Le boulanger fabrique mon premier.' },
        { th: 'charades', n: 3, q: 'Mon premier est un rongeur. Mon second est une recherche, comme celle des chevaliers qui cherchaient le Graal. Mon tout sert à jouer au tennis.', r: 'Une raquette (rat + quête)', i: 'Mon premier a une longue queue.' },
        { th: 'charades', n: 1, q: 'Mon premier est le contraire de « dur ». Mon second est la façon dont on parle (on peut le prendre gentil ou fâché). Mon tout nous donne de la laine.', r: 'Un mouton (mou + ton)', i: 'Mon tout fait « bêê ».' },
        { th: 'charades', n: 1, q: 'Mon premier transporte des voyageurs. Mon second sert à manger dessus. Mon tout se porte sur le dos pour aller à l’école.', r: 'Un cartable (car + table)', i: 'Tu y ranges tes cahiers.' },
        { th: 'charades', n: 2, q: 'Mon premier sert à jouer aux petits chevaux. Mon second est l’abri vitré du jardinier. Mon tout est très sec et plein de sable.', r: 'Le désert (dé + serre)', i: 'Les chameaux y vivent.' },
        { th: 'charades', n: 1, q: 'Mon premier sert à dormir. Mon second est un pronom (comme dans « … a gagné ! »). Mon tout est le roi des animaux.', r: 'Le lion (lit + on)', i: 'Mon tout a une crinière.' },
        { th: 'charades', n: 2, q: 'Mon premier frappe (comme le cœur qui…). Mon second vient du mouton. Mon tout est le plus gros animal du monde.', r: 'La baleine (bat + laine)', i: 'Mon tout vit dans l’océan.' },
        { th: 'charades', n: 2, q: 'Mon premier est une ancienne petite pièce de monnaie. Mon second est ce qu’on fait quand une blague est drôle. Mon tout illumine le visage.', r: 'Un sourire (sou + rire)', i: 'On dit « être sans un … » quand on n’a pas d’argent.' },
        { th: 'charades', n: 1, q: 'Mon premier est un rongeur. Mon second est un nombre qui vient après neuf. Mon tout est un petit légume rouge et blanc.', r: 'Un radis (rat + dix)', i: 'On le mange cru avec du beurre.' },
        { th: 'charades', n: 2, q: 'Mon premier est plein d’eau salée. Mon second veut dire « ici » (comme dans « …-dessous »). Mon tout est un mot poli.', r: 'Merci (mer + ci)', i: 'On le dit quand on reçoit quelque chose.' },
        { th: 'charades', n: 2, q: 'Mon premier est derrière toi. Mon second est une note de musique. Mon troisième veut dire « non » en anglais. Mon tout est un jeu.', r: 'Le domino (dos + mi + no)', i: 'Mon tout a des points noirs sur des pièces blanches.' },
        { th: 'charades', n: 1, q: 'Mon premier sert à cuire les gâteaux. Mon second est une note de musique. Mon tout est un petit insecte travailleur.', r: 'Une fourmi (four + mi)', i: 'Dans la fable, elle n’est pas prêteuse.' },
        { th: 'charades', n: 1, q: 'Mon premier est le féminin de « son ». Mon second est vendu par le boulanger. Mon tout est décoré à Noël.', r: 'Le sapin (sa + pain)', i: 'Mon tout garde ses aiguilles en hiver.' },
        { th: 'charades', n: 2, q: 'Mon premier transporte des voyageurs. Mon second se porte sur le dos du père Noël. Mon tout est un légume orange.', r: 'Une carotte (car + hotte)', i: 'Les lapins l’adorent.' },
        { th: 'charades', n: 2, q: 'Mon premier pousse dans les rizières. Mon second coule du robinet (un verre…). Mon tout se tire devant la fenêtre.', r: 'Un rideau (riz + d’eau)', i: 'Il cache la lumière.' },
        { th: 'charades', n: 1, q: 'Mon premier est le contraire de « haut ». Mon second est le contraire de « tard ». Mon tout flotte sur l’eau.', r: 'Un bateau (bas + tôt)', i: 'Il a parfois des voiles.' },

        /* ── Sciences et nature ── */
        { th: 'sciences', n: 1, q: 'Je suis la seule planète du système solaire où l’on connaît la vie. Qui suis-je ?', r: 'La Terre', i: 'Tu marches sur moi tous les jours.' },
        { th: 'sciences', n: 2, q: 'Je suis l’étoile la plus proche de la Terre. Qui suis-je ?', r: 'Le Soleil', i: 'Il ne faut jamais me regarder directement.', e: 'Le Soleil est une étoile, comme celles qu’on voit la nuit, mais beaucoup plus proche de nous.' },
        { th: 'sciences', n: 1, q: 'J’ai huit pattes, je tisse une toile… et pourtant je ne suis pas un insecte ! Qui suis-je ?', r: 'L’araignée', i: 'Les insectes ont 6 pattes, pas 8.', e: 'Les araignées font partie des arachnides : elles ont 8 pattes, alors que les insectes en ont 6.' },
        { th: 'sciences', n: 2, q: 'Je suis un mammifère, mais je vis dans la mer et je respire par un trou sur le dessus de ma tête. Qui suis-je ?', r: 'Le dauphin', i: 'Je saute hors de l’eau et je suis très joueur.', e: 'Ce trou s’appelle un évent. On accepte aussi la baleine !' },
        { th: 'sciences', n: 1, q: 'Je suis de l’eau qui tombe du ciel en forme de petites étoiles. Qui suis-je ?', r: 'La neige', i: 'Je tombe en hiver.', e: 'Chaque flocon de neige est un cristal de glace à six branches.' },
        { th: 'sciences', n: 1, q: 'Je bats environ 70 fois par minute dans ta poitrine. Qui suis-je ?', r: 'Le cœur', i: 'Pose ta main à gauche de ta poitrine.' },
        { th: 'sciences', n: 2, q: 'Je suis un oiseau, mais je ne vole pas. Je nage très bien et je vis au pôle Sud. Qui suis-je ?', r: 'Le manchot', i: 'On me confond souvent avec le pingouin.', e: 'Le manchot vit au pôle Sud et ne vole pas. Le pingouin, lui, vit au pôle Nord et sait voler.' },
        { th: 'sciences', n: 2, q: 'Solide, je suis de la glace. Liquide, je suis de l’eau. Et quand je suis un gaz, qui suis-je ?', r: 'La vapeur d’eau', i: 'Je m’échappe de la casserole quand l’eau bout.', e: 'L’eau change d’état selon la température : solide, liquide ou gaz.' },
        { th: 'sciences', n: 2, q: 'Je suis le seul mammifère capable de voler. Qui suis-je ?', r: 'La chauve-souris', i: 'Je dors la tête en bas.' },
        { th: 'sciences', n: 2, q: 'Sans moi, les plantes ne pourraient pas fabriquer leur nourriture. Qui suis-je ?', r: 'La lumière du soleil', i: 'Les plantes se tournent vers moi.', e: 'Grâce à la lumière, les feuilles fabriquent leur nourriture : c’est la photosynthèse.' },
        { th: 'sciences', n: 1, q: 'D’abord chenille, je m’enferme dans un cocon et j’en ressors avec des ailes. Qui suis-je ?', r: 'Le papillon', i: 'Je butine les fleurs.', e: 'Ce changement de forme s’appelle la métamorphose.' },
        { th: 'sciences', n: 2, q: 'Je suis invisible, mais sans moi tu ne pourrais pas vivre plus de quelques minutes. Qui suis-je ?', r: 'L’air (et l’oxygène qu’il contient)', i: 'Tu me respires.' },
        { th: 'sciences', n: 1, q: 'Je tourne autour de la Terre et je change de forme chaque nuit. Qui suis-je ?', r: 'La Lune', i: 'Je suis parfois pleine, parfois en croissant.', e: 'La Lune ne change pas vraiment de forme : on voit seulement la partie éclairée par le Soleil.' },
        { th: 'sciences', n: 1, q: 'Je suis un arbre qui garde ses aiguilles même en hiver. Qui suis-je ?', r: 'Le sapin', i: 'On me décore à Noël.', e: 'Le sapin est un conifère : il ne perd pas ses aiguilles en automne.' },
        { th: 'sciences', n: 1, q: 'Je n’ai pas de pattes, je change de peau en grandissant et certains de mes cousins sont venimeux. Qui suis-je ?', r: 'Le serpent', i: 'Je rampe et je siffle.' },
        { th: 'sciences', n: 2, q: 'Je pèse environ 1,4 kg et je commande tout ton corps. Qui suis-je ?', r: 'Le cerveau', i: 'Je suis protégé par ton crâne.' }
    ];

    const DEFAULT_CFG = {
        mode: 'jour',            // 'jour' : devinette du jour ; 'hasard' : au hasard
        themes: { quisuisje: true, logique: true, maths: true, mots: true, charades: true, sciences: true },
        niveaux: { 1: true, 2: true, 3: true },
        timer: 60,               // temps de réflexion en secondes (0 : pas de bouton)
        autoReveal: false,       // dévoiler la réponse à la fin du temps
        sound: true,             // petit son à la fin du temps
        perso: '',               // devinettes de l'enseignant, une par ligne : « Devinette = Réponse = Indice »
        persoOnly: false         // n'afficher que les devinettes personnelles
    };
    const TIMERS = [[0, 'Pas de minuteur'], [30, '30 secondes'], [60, '1 minute'], [120, '2 minutes'], [180, '3 minutes'], [300, '5 minutes']];

    /* ── Outils ───────────────────────────────────────────────────── */
    const DAY = 86400000;
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const fmtTime = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

    // Numéro du jour, en ne comptant que les jours du lundi au vendredi :
    // la devinette du jour ne change pas le week-end.
    // Le 1er janvier 1970 était un jeudi : WEEK donne, pour chaque jour de la
    // semaine à partir du jeudi, s'il s'agit d'un jour ouvré (1) ou non (0).
    const WEEK = [1, 1, 0, 0, 1, 1, 1];
    const dayNum = d => {
        const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
        let count = Math.floor(n / 7) * 5;
        for (let i = 0; i < n % 7; i++) count += WEEK[i];
        return count;
    };

    // Index de la devinette du jour : on avance d'un « pas » premier avec n,
    // ainsi toutes les devinettes passent avant qu'une même devinette revienne.
    // Le décalage de 7 évite d'avoir le même numéro que la citation du jour.
    function dayIndex(n) {
        if (n <= 1) return 0;
        let step = Math.max(1, Math.round(n * 0.382));
        while (gcd(step, n) !== 1) step++;
        return (dayNum(new Date()) * step + 7) % n;
    }

    // « Devinette = Réponse = Indice » (l'indice est facultatif)
    function parsePerso(str) {
        return String(str || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
            const parts = l.split(/\s*=\s*/);
            const q = (parts[0] || '').trim();
            const r = (parts[1] || '').trim();
            const i = parts.slice(2).join(' = ').trim();
            return { th: 'perso', n: 0, q, r: r || '(réponse non indiquée)', i, e: '' };
        }).filter(d => d.q);
    }

    /* ── Config ───────────────────────────────────────────────────── */
    function getCfg(root) {
        let cfg;
        try { cfg = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) { cfg = {}; }
        cfg = Object.assign({}, DEFAULT_CFG, cfg);
        cfg.themes = Object.assign({}, DEFAULT_CFG.themes, cfg.themes || {});
        cfg.niveaux = Object.assign({}, DEFAULT_CFG.niveaux, cfg.niveaux || {});
        cfg.timer = +cfg.timer || 0;
        return cfg;
    }

    // Liste des devinettes proposées selon les réglages
    function pool(cfg) {
        const perso = parsePerso(cfg.perso);
        let list = (cfg.persoOnly && perso.length)
            ? perso
            : DEVINETTES.filter(d => cfg.themes[d.th] !== false && cfg.niveaux[d.n] !== false).concat(perso);
        if (!list.length) list = DEVINETTES.slice();
        return list;
    }

    const dayRiddle = list => list[dayIndex(list.length)];

    // Devinette affichée (gardée dans l'attribut data-cur de .dv-root)
    function current(root, cfg, list) {
        const cur = root.getAttribute('data-cur');
        let d = cur ? list.find(x => x.q === cur) : null;
        if (!d) {
            if (cfg.mode === 'hasard') {
                d = list[Math.floor(Math.random() * list.length)];
                root.setAttribute('data-cur', d.q);
            } else {
                d = dayRiddle(list);
                root.removeAttribute('data-cur');
            }
        }
        return d;
    }

    function setCur(root, d) {
        const cfg = getCfg(root);
        const list = pool(cfg);
        if (cfg.mode === 'jour' && (!d || d === dayRiddle(list))) root.removeAttribute('data-cur');
        else if (d) root.setAttribute('data-cur', d.q);
        // une nouvelle devinette repart avec indice et réponse cachés, et sans minuteur
        root.removeAttribute('data-show-hint');
        root.removeAttribute('data-show-answer');
        stopTimer(root);
        renderLight(root);
        if (typeof saveBoard === 'function') saveBoard();
    }

    /* ── Minuteur de réflexion (en mémoire, pas sauvegardé) ─────────── */
    const RT = new WeakMap();
    function T(root) {
        let t = RT.get(root);
        if (!t) { t = { end: 0, dur: 0, iv: null, done: false }; RT.set(root, t); }
        return t;
    }
    function startTimer(root) {
        const cfg = getCfg(root);
        if (!cfg.timer) return;
        const t = T(root);
        clearInterval(t.iv);
        t.dur = cfg.timer;
        t.end = Date.now() + cfg.timer * 1000;
        t.done = false;
        t.iv = setInterval(() => tickTimer(root), 200);
        renderLight(root);
    }
    function stopTimer(root) {
        const t = T(root);
        clearInterval(t.iv);
        t.iv = null; t.end = 0; t.done = false;
    }
    const timerRunning = root => !!T(root).iv;
    function timerLeft(root) {
        const t = T(root);
        return t.iv ? Math.max(0, Math.ceil((t.end - Date.now()) / 1000)) : 0;
    }
    function tickTimer(root) {
        const t = T(root);
        if (!root.isConnected) { clearInterval(t.iv); return; }
        const leftMs = Math.max(0, t.end - Date.now());
        const bar = root.querySelector('.dv-tbar span');
        const txt = root.querySelector('.dv-ttxt');
        if (bar) bar.style.transform = 'scaleX(' + (leftMs / (t.dur * 1000)).toFixed(4) + ')';
        if (txt) txt.textContent = '⏱ ' + fmtTime(Math.ceil(leftMs / 1000));
        const sheet = root.querySelector('.dv-sheet');
        if (sheet) sheet.classList.toggle('is-hurry', leftMs > 0 && leftMs <= 10000);
        if (leftMs <= 0) {
            clearInterval(t.iv);
            t.iv = null; t.done = true;
            const cfg = getCfg(root);
            if (cfg.sound) beep();
            if (cfg.autoReveal) root.setAttribute('data-show-answer', '');
            renderLight(root);
            const sh = root.querySelector('.dv-sheet');
            if (sh) { sh.classList.remove('is-ring'); void sh.offsetWidth; sh.classList.add('is-ring'); }
        }
    }

    // Petit son de fin (trois notes douces)
    let actx = null;
    function beep() {
        try {
            actx = actx || new (window.AudioContext || window.webkitAudioContext)();
            const t0 = actx.currentTime;
            [660, 880, 1100].forEach((f, k) => {
                const o = actx.createOscillator(), g = actx.createGain();
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(0.0001, t0 + k * 0.18);
                g.gain.exponentialRampToValueAtTime(0.25, t0 + k * 0.18 + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, t0 + k * 0.18 + 0.35);
                o.connect(g); g.connect(actx.destination);
                o.start(t0 + k * 0.18); o.stop(t0 + k * 0.18 + 0.4);
            });
        } catch (e) {}
    }

    /* ── Rendu ────────────────────────────────────────────────────── */
    // Empêche le déplacement du widget quand on clique sur un contrôle
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

    function buildBar(root, cfg, list, d) {
        const full = root.classList.contains('dv-full');
        const showToday = cfg.mode === 'jour' && d !== dayRiddle(list);
        return '<div class="dv-bar">' +
            '<button type="button" class="dv-gear" data-dv-action="toggle" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
            '<div class="dv-navbox"' + STOP + '>' +
                '<button type="button" class="dv-nav" data-dv-action="prev" title="Devinette précédente (←)" aria-label="Devinette précédente">‹</button>' +
                '<button type="button" class="dv-nav dv-dice" data-dv-action="random" title="Une devinette au hasard" aria-label="Une devinette au hasard">🎲</button>' +
                '<button type="button" class="dv-nav" data-dv-action="next" title="Devinette suivante (→)" aria-label="Devinette suivante">›</button>' +
                '<button type="button" class="dv-nav dv-today' + (showToday ? '' : ' is-hidden') + '" data-dv-action="today" title="Revenir à la devinette du jour" aria-label="Revenir à la devinette du jour">⟲</button>' +
            '</div>' +
            '<div class="wf-btns"' + STOP + '>' +
                '<button type="button" class="wf-btn wf-btn-min" data-dv-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                '<button type="button" class="wf-btn wf-btn-max" data-dv-action="wf-max" title="' + (full ? 'Quitter le plein écran' : 'Plein écran') + '" aria-label="Plein écran"></button>' +
                '<button type="button" class="wf-btn wf-btn-close" data-dv-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
            '</div>' +
        '</div>';
    }

    function buildSheet(root, cfg, list, d) {
        const th = THEMES[d.th] || THEMES.perso;
        const isDay = cfg.mode === 'jour' && d === dayRiddle(list);
        const label = isDay ? 'Devinette du jour' : (list.indexOf(d) + 1) + ' / ' + list.length;
        const hintShown = root.hasAttribute('data-show-hint');
        const answerShown = root.hasAttribute('data-show-answer');
        const t = T(root);
        const running = timerRunning(root);
        const stars = d.n ? '<span class="dv-stars" title="' + NIVEAUX[d.n] + '">' + '★'.repeat(d.n) + '<span class="dv-off">' + '★'.repeat(3 - d.n) + '</span></span>' : '';

        let html = '<div class="dv-sheet' + (running && timerLeft(root) <= 10 ? ' is-hurry' : '') + '" style="--dv-c:' + th.c + '">' +
            '<div class="dv-top"><span class="dv-chip"><span aria-hidden="true">' + th.ico + '</span>' + esc(th.nom) + '</span>' +
            stars + '<span class="dv-label">' + label + '</span></div>';

        // Barre du minuteur
        if (running) {
            const leftMs = Math.max(0, t.end - Date.now());
            html += '<div class="dv-tbar"><span style="transform:scaleX(' + (leftMs / (t.dur * 1000)).toFixed(4) + ')"></span></div>';
        }

        html += '<div class="dv-body"><div class="dv-inner">' +
            '<div class="dv-q">' + esc(d.q) + '</div>';

        if (d.i && hintShown && !answerShown) html += '<div class="dv-hint">💡 ' + esc(d.i) + '</div>';

        if (answerShown) {
            html += '<div class="dv-answer"><div class="dv-r">' + esc(d.r) + '</div>' +
                (d.e ? '<div class="dv-e">' + esc(d.e) + '</div>' : '') + '</div>';
        }

        let btns = '';
        if (d.i && !answerShown) {
            btns += '<button type="button" class="dv-btn' + (hintShown ? ' is-on' : '') + '" data-dv-action="hint"' + STOP + '>💡 ' +
                (hintShown ? 'Cacher l’indice' : 'Indice') + '</button>';
        }
        if (cfg.timer && !answerShown) {
            if (running) btns += '<button type="button" class="dv-btn dv-tbtn is-on" data-dv-action="timer-stop"' + STOP + ' title="Arrêter le minuteur"><span class="dv-ttxt">⏱ ' + fmtTime(timerLeft(root)) + '</span> ✕</button>';
            else if (t.done) btns += '<button type="button" class="dv-btn dv-tbtn is-done" data-dv-action="timer"' + STOP + '>⏰ Temps écoulé ! Relancer</button>';
            else btns += '<button type="button" class="dv-btn dv-tbtn" data-dv-action="timer"' + STOP + '>⏱ Réfléchir ' + fmtTime(cfg.timer) + '</button>';
        }
        btns += '<button type="button" class="dv-btn dv-main' + (answerShown ? ' is-on' : '') + '" data-dv-action="answer"' + STOP + '>' +
            (answerShown ? '🙈 Cacher la réponse' : '👀 Voir la réponse') + '</button>';
        html += '<div class="dv-actions">' + btns + '</div>';

        html += '</div></div></div>';
        return html;
    }

    function buildSettings(cfg) {
        let checks = '';
        THEME_KEYS.forEach(k => {
            const n = DEVINETTES.filter(d => d.th === k).length;
            checks += '<label class="dv-chk"><input type="checkbox" data-dv-theme="' + k + '"' + (cfg.themes[k] ? ' checked' : '') + '> ' +
                THEMES[k].ico + ' ' + THEMES[k].nom + ' <span class="dv-n">(' + n + ')</span></label>';
        });
        let lv = '';
        [1, 2, 3].forEach(k => {
            const n = DEVINETTES.filter(d => d.n === k).length;
            lv += '<label class="dv-chk dv-chk-inline"><input type="checkbox" data-dv-niveau="' + k + '"' + (cfg.niveaux[k] ? ' checked' : '') + '> ' +
                '★'.repeat(k) + ' ' + NIVEAUX[k] + ' <span class="dv-n">(' + n + ')</span></label>';
        });
        const tOpts = TIMERS.map(([v, l]) => '<option value="' + v + '"' + (cfg.timer === v ? ' selected' : '') + '>' + l + '</option>').join('');
        return '<div class="dv-settings"' + STOP + '>' +
            '<div class="dv-set-title">Réglages des devinettes</div>' +
            '<label class="dv-lbl">Choix de la devinette' +
              '<select data-dv-mode>' +
                '<option value="jour"' + (cfg.mode === 'jour' ? ' selected' : '') + '>Devinette du jour (change chaque jour de classe)</option>' +
                '<option value="hasard"' + (cfg.mode === 'hasard' ? ' selected' : '') + '>Au hasard (garde la devinette tirée)</option>' +
              '</select></label>' +
            '<div class="dv-lbl">Niveaux proposés</div><div class="dv-row">' + lv + '</div>' +
            '<div class="dv-lbl">Thèmes proposés</div>' + checks +
            '<label class="dv-lbl">Temps de réflexion<select data-dv-timer>' + tOpts + '</select></label>' +
            '<label class="dv-chk"><input type="checkbox" data-dv-autoreveal' + (cfg.autoReveal ? ' checked' : '') + '> Dévoiler la réponse à la fin du temps</label>' +
            '<label class="dv-chk"><input type="checkbox" data-dv-sound' + (cfg.sound ? ' checked' : '') + '> Petit son à la fin du temps</label>' +
            '<label class="dv-lbl">Mes devinettes <span class="dv-n">— une par ligne : Devinette = Réponse = Indice (l’indice est facultatif)</span>' +
              '<textarea data-dv-perso rows="5" placeholder="Je suis le prénom de la maîtresse à l’envers : ENIRAM. = Marine = Lis de droite à gauche.">' + esc(cfg.perso || '') + '</textarea></label>' +
            '<label class="dv-chk"><input type="checkbox" data-dv-persoonly' + (cfg.persoOnly ? ' checked' : '') + '> N’afficher que mes devinettes</label>' +
            '<div class="dv-note">Clavier (souris sur le widget) : I indice · R ou Entrée réponse · T minuteur · ← → devinette précédente / suivante · F plein écran · Échap pour en sortir.</div>' +
            '<button type="button" class="dv-done" data-dv-action="close">Terminé</button>' +
        '</div>';
    }

    function render(root) {
        const cfg = getCfg(root);
        const list = pool(cfg);
        const d = current(root, cfg, list);
        const open = root.classList.contains('dv-open');
        root.innerHTML = buildBar(root, cfg, list, d) + buildSheet(root, cfg, list, d) + (open ? buildSettings(cfg) : '');
        root.setAttribute('data-day', new Date().toDateString());
        watchSize(root);
        fitSheet(root);
    }

    // Met à jour la barre et la feuille sans toucher au panneau de réglages
    function renderLight(root) {
        const bar = root.querySelector('.dv-bar'), sheet = root.querySelector('.dv-sheet');
        if (!bar || !sheet) { render(root); return; }
        const cfg = getCfg(root);
        const list = pool(cfg);
        const d = current(root, cfg, list);
        bar.outerHTML = buildBar(root, cfg, list, d);
        sheet.outerHTML = buildSheet(root, cfg, list, d);
        fitSheet(root);
    }

    function setCfg(root, cfg, light) {
        root.setAttribute('data-cfg', JSON.stringify(cfg));
        if (light) renderLight(root); else render(root);
        if (typeof saveBoard === 'function') saveBoard();
    }

    /* ── Ajustement automatique : tout doit tenir sans scroller ─────
       On cherche (par dichotomie) le plus grand facteur --dv-k ≤ 1 pour
       lequel le contenu tient. Indice, réponse et boutons se réduisent
       moitié moins vite que la devinette (--dv-ka). ─────────────────── */
    const K_MIN = 0.3;
    function fitSheet(root) {
        const body = root.querySelector('.dv-body');
        if (!body || !root.offsetWidth || !root.offsetHeight) return;
        const fits = k => {
            root.style.setProperty('--dv-k', k.toFixed(3));
            root.style.setProperty('--dv-ka', ((1 + k) / 2).toFixed(3));
            return body.scrollHeight <= body.clientHeight + 1 && body.scrollWidth <= body.clientWidth + 1;
        };
        if (fits(1)) return;
        let lo = K_MIN, hi = 1;
        if (!fits(lo)) return; // cas extrême : on garde le plus petit facteur
        for (let i = 0; i < 8; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) lo = mid; else hi = mid;
        }
        fits(lo);
    }

    const sized = new WeakSet();
    const ro = typeof ResizeObserver === 'function'
        ? new ResizeObserver(entries => entries.forEach(en => fitSheet(en.target)))
        : null;
    function watchSize(root) {
        if (!ro || sized.has(root)) return;
        sized.add(root);
        ro.observe(root);
    }

    /* ── Boutons fenêtre : réduire / plein écran / fermer ───────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('dv-full');
        root.classList.toggle('dv-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('dv-is-full', full);
        const b = root.querySelector('[data-dv-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    }

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('dv-full')) toggleFull(root, false);
        root.classList.remove('dv-open');
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden'; // la feuille ne doit pas passer par-dessus la mini-barre
        window._wfMiniBarCollapse(widget, '🧩 Devinette', {
            onExpand: () => { box.style.visibility = ''; render(root); }
        });
    }

    function closeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget) return;
        stopTimer(root);
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    }

    // Changement de jour : en mode « devinette du jour », on passe à la nouvelle devinette
    function renderAll(onlyIfDayChanged) {
        const today = new Date().toDateString();
        document.querySelectorAll('.dv-root').forEach(r => {
            if (onlyIfDayChanged && r.getAttribute('data-day') === today) return;
            if (onlyIfDayChanged && getCfg(r).mode === 'jour') {
                r.removeAttribute('data-cur');
                r.removeAttribute('data-show-hint');
                r.removeAttribute('data-show-answer');
                stopTimer(r);
            }
            render(r);
        });
    }

    /* ── Actions ──────────────────────────────────────────────────── */
    function act(root, a) {
        const cfg = getCfg(root);
        const list = pool(cfg);
        const d = current(root, cfg, list);
        const i = list.indexOf(d);
        switch (a) {
            case 'wf-min':   minimizeWidget(root); return;
            case 'wf-max':   toggleFull(root); return;
            case 'wf-close': closeWidget(root); return;
            case 'prev':     setCur(root, list[(i - 1 + list.length) % list.length]); return;
            case 'next':     setCur(root, list[(i + 1) % list.length]); return;
            case 'today':    setCur(root, null); return;
            case 'random': {
                let r = d;
                if (list.length > 1) while (r === d) r = list[Math.floor(Math.random() * list.length)];
                setCur(root, r);
                return;
            }
            case 'hint':
                if (!d.i) return;
                root.toggleAttribute('data-show-hint');
                renderLight(root);
                return;
            case 'answer':
                root.toggleAttribute('data-show-answer');
                if (root.hasAttribute('data-show-answer')) stopTimer(root);
                renderLight(root);
                return;
            case 'timer':      startTimer(root); return;
            case 'timer-stop': stopTimer(root); renderLight(root); return;
            case 'toggle': root.classList.toggle('dv-open'); break;
            case 'close':  root.classList.remove('dv-open'); break;
        }
        render(root);
    }

    /* ── Événements (délégués : survivent à la sauvegarde/restauration) ── */
    let lastRoot = null;

    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('[data-dv-action]');
        if (!btn) return;
        const root = btn.closest('.dv-root');
        if (!root) return;
        e.stopPropagation();
        lastRoot = root;
        act(root, btn.getAttribute('data-dv-action'));
    }, true);

    document.addEventListener('pointerover', function (e) {
        const r = e.target.closest && e.target.closest('.dv-root');
        if (r) lastRoot = r;
    }, true);

    document.addEventListener('change', function (e) {
        const root = e.target.closest && e.target.closest('.dv-root');
        if (!root) return;
        const t = e.target;
        const cfg = getCfg(root);
        if (t.hasAttribute('data-dv-mode')) {
            cfg.mode = t.value === 'hasard' ? 'hasard' : 'jour';
            root.removeAttribute('data-cur');
        }
        else if (t.hasAttribute('data-dv-theme'))  cfg.themes[t.getAttribute('data-dv-theme')] = t.checked;
        else if (t.hasAttribute('data-dv-niveau')) cfg.niveaux[t.getAttribute('data-dv-niveau')] = t.checked;
        else if (t.hasAttribute('data-dv-timer'))  { cfg.timer = +t.value || 0; stopTimer(root); }
        else if (t.hasAttribute('data-dv-autoreveal')) cfg.autoReveal = t.checked;
        else if (t.hasAttribute('data-dv-sound'))  cfg.sound = t.checked;
        else if (t.hasAttribute('data-dv-perso'))  { cfg.perso = t.value; setCfg(root, cfg, true); return; } // sans reconstruire les réglages
        else if (t.hasAttribute('data-dv-persoonly')) cfg.persoOnly = t.checked;
        else return;
        setCfg(root, cfg);
    });

    /* ── Clavier ──────────────────────────────────────────────────── */
    const isEditable = el => !!(el && el.closest && el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
    function activeRoot() {
        const full = Array.from(document.querySelectorAll('.dv-root.dv-full')).pop();
        if (full) return full;
        const ae = document.activeElement;
        if (ae && ae.closest) {
            const r = ae.closest('.dv-root');
            if (r) return isEditable(ae) ? null : r;
            if (isEditable(ae)) return null;   // saisie en cours ailleurs
        }
        if (lastRoot && lastRoot.isConnected && lastRoot.matches(':hover')) return lastRoot;
        return null;
    }

    document.addEventListener('keydown', function (e) {
        // Saisie dans les réglages : pas de raccourcis du board
        if (e.target.closest && e.target.closest('.dv-settings')) { e.stopPropagation(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const root = activeRoot();
        if (!root || root.classList.contains('dv-open')) return;
        const k = e.key;
        // Entrée ou Espace sur un bouton : c'est le bouton qui agit
        if ((k === 'Enter' || k === ' ') && e.target.closest && e.target.closest('button')) return;
        let a = null;
        if (k === 'i' || k === 'I') a = 'hint';
        else if (k === 'r' || k === 'R' || k === 'Enter') a = 'answer';
        else if (k === 't' || k === 'T') a = timerRunning(root) ? 'timer-stop' : 'timer';
        else if (k === 'ArrowRight') a = 'next';
        else if (k === 'ArrowLeft') a = 'prev';
        else if (k === 'f' || k === 'F') a = 'wf-max';
        else if (k === 'Escape' && root.classList.contains('dv-full')) { toggleFull(root, false); e.preventDefault(); e.stopPropagation(); return; }
        if (!a) return;
        e.preventDefault(); e.stopPropagation();
        act(root, a);
    }, true);

    /* ── Redimensionnement libre ──────────────────────────────────
       La poignée du board (.custom-resize-handle) est interceptée pour
       ce widget : largeur et hauteur de la carte suivent la souris,
       et la devinette se réajuste toute seule. ────────────────────── */
    const MIN_W = 280, MIN_H = 200, MAX_W = 3000, MAX_H = 2000;

    function dvBox(widget) {
        const root = widget.querySelector('.dv-root');
        return root ? (root.closest('.editor-container') || root) : null;
    }
    function widgetExtra(widget, box) {
        return {
            w: /px$/.test(widget.style.width)  ? widget.offsetWidth  - box.offsetWidth  : null,
            h: /px$/.test(widget.style.height) ? widget.offsetHeight - box.offsetHeight : null
        };
    }
    function applySize(widget, box, w, h, extra) {
        w = Math.round(Math.min(MAX_W, Math.max(MIN_W, w)));
        h = Math.round(Math.min(MAX_H, Math.max(MIN_H, h)));
        box.style.width = w + 'px';
        box.style.height = h + 'px';
        if (extra.w !== null) widget.style.width  = (w + extra.w) + 'px';
        if (extra.h !== null) widget.style.height = (h + extra.h) + 'px';
    }
    function startResize(e, widget) {
        const box = dvBox(widget);
        if (!box) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const w0 = box.offsetWidth, h0 = box.offsetHeight;
        const extra = widgetExtra(widget, box);
        const x0 = e.clientX, y0 = e.clientY;
        const move = ev => applySize(widget, box, w0 + ev.clientX - x0, h0 + ev.clientY - y0, extra);
        const up = () => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            document.body.style.cursor = '';
            if (typeof saveBoard === 'function') saveBoard();
        };
        document.body.style.cursor = 'nwse-resize';
        window.addEventListener('pointermove', move, true);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    }
    function onResizeDown(e) {
        const handle = e.target.closest && e.target.closest('.custom-resize-handle');
        if (!handle) return;
        const widget = handle.closest('.widget');
        if (!widget || !widget.querySelector('.dv-root')) return;
        if (widget.classList.contains('dv-is-full') || widget.querySelector('.wf-mini-bar')) return;
        if (e.type === 'pointerdown') { startResize(e, widget); return; }
        // on bloque aussi mousedown / touchstart pour que le redimensionnement du board ne démarre pas
        e.stopPropagation(); e.stopImmediatePropagation();
        if (e.cancelable) e.preventDefault();
    }
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t =>
        document.addEventListener(t, onResizeDown, { capture: true, passive: false }));

    /* ── Hydratation : nouveaux widgets et boards rechargés ──────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        const roots = node.matches('.dv-root') ? [node] : Array.from(node.querySelectorAll('.dv-root'));
        roots.forEach(r => {
            render(r);
            // Sur téléphone, ouverture directe en plein écran (bouton vert) —
            // seulement pour un widget qui vient d'être lancé depuis un panneau
            const w = r.closest('.widget');
            if (w && !w._dvAutoMax) {
                w._dvAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('dv-full'), null, true);
            }
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            m.addedNodes.forEach(n => {
                if (n instanceof Element && (n.matches('.widget, .dv-root') || n.querySelector('.dv-root'))) {
                    // on ne ré-hydrate pas pour nos propres mises à jour internes
                    if (n.closest('.dv-root') && !n.matches('.dv-root')) return;
                    hydrate(n);
                }
            });
            // Widget supprimé : arrêt du minuteur
            m.removedNodes.forEach(n => {
                if (!(n instanceof Element)) return;
                const roots = n.matches('.dv-root') ? [n] : Array.from(n.querySelectorAll('.dv-root'));
                roots.forEach(r => setTimeout(() => { if (!r.isConnected) stopTimer(r); }, 0));
            });
        }
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-devinettes')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-devinettes';
        tpl.innerHTML =
            '<div class="editor-container" style="width:560px;height:370px;">' +
                '<div class="dv-root" data-cfg=\'' + JSON.stringify(DEFAULT_CFG) + '\'></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('dv-styles')) return;
        const st = document.createElement('style');
        st.id = 'dv-styles';
        st.textContent = `
.dv-root{
  --dv-paper:#f6f4fb; --dv-ink:#22202b; --dv-soft:#686475; --dv-line:#e2deec; --dv-c:#2f6fb5;
  container-type:inline-size; position:relative; width:100%; height:100%;
  box-sizing:border-box; background:var(--dv-paper);
  display:flex; flex-direction:column; overflow:hidden;
  font-family:"Trebuchet MS","Segoe UI",system-ui,-apple-system,sans-serif;
  color:var(--dv-ink); user-select:none;
}
.dv-bar{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.5cqw;
  padding:1.6cqw 2.2cqw 0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.dv-bar .wf-btns{justify-self:end}
.dv-gear{justify-self:start;border:0;background:none;color:#aaa4ba;font-size:max(14px,3.6cqw);line-height:1;
  cursor:pointer;padding:.8cqw;border-radius:5px}
.dv-gear:hover,.dv-gear:focus-visible{color:var(--dv-ink);outline:1px solid var(--dv-line)}
.dv-navbox{display:flex;align-items:center;gap:.6cqw}
.dv-nav{border:0;background:none;color:var(--dv-soft);cursor:pointer;padding:.3cqw 1.2cqw;
  font-size:max(15px,3.8cqw);line-height:1;border-radius:5px}
.dv-dice{font-size:max(13px,3cqw)}
.dv-today{font-size:max(13px,3.2cqw)}
.dv-nav.is-hidden{visibility:hidden}
.dv-nav:hover{color:var(--dv-ink);background:#ebe7f3}
.dv-bar :focus-visible{outline:2px solid var(--dv-c);outline-offset:1px}
.dv-sheet{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;margin:1.4cqw 2.4cqw 2.4cqw;
  background:#fff;border:1px solid var(--dv-line);border-top:max(4px,.9cqw) solid var(--dv-c);
  border-radius:max(6px,1.4cqw);box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}
.dv-sheet.is-ring{animation:dv-ring .6s ease 2}
@keyframes dv-ring{25%{transform:rotate(-1deg)}75%{transform:rotate(1deg)}}
.dv-top{flex:none;display:flex;align-items:center;gap:2cqw;flex-wrap:wrap;
  padding:1.6cqw 2.6cqw 0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:max(10px,2.5cqw);color:var(--dv-soft)}
.dv-chip{display:inline-flex;align-items:center;gap:.5em;padding:.25em .8em;border-radius:99px;font-weight:700;
  color:var(--dv-c);background:#eef0f6;background:color-mix(in srgb,var(--dv-c) 12%,#fff)}
.dv-stars{color:#f0a800;letter-spacing:.05em;font-size:1.1em}
.dv-off{color:#ddd8e6}
.dv-label{margin-left:auto;font-style:italic;white-space:nowrap}
.dv-tbar{flex:none;height:max(4px,.8cqw);margin:1.2cqw 2.6cqw 0;border-radius:99px;background:#eceaf2;overflow:hidden}
.dv-tbar span{display:block;height:100%;width:100%;background:var(--dv-c);transform-origin:left;transition:transform .2s linear}
.dv-sheet.is-hurry .dv-tbar span{background:#e0533d}
.dv-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:1.2cqw 5cqw 2.4cqw}
.dv-inner{margin:auto 0;width:100%}
.dv-q{text-align:center;font-weight:700;line-height:1.3;text-wrap:balance;font-size:calc(5.6cqw * var(--dv-k,1))}
.dv-hint{margin:.9em auto 0;max-width:92%;padding:.5em 1em;border-radius:10px;text-align:center;
  background:#fff8dc;border:1px dashed #e8c14a;color:#5c4a00;font-size:calc(3.4cqw * var(--dv-ka,1))}
.dv-answer{margin:.9em auto 0;max-width:95%;padding:.6em 1em;border-radius:12px;text-align:center;
  background:#eef0f6;background:color-mix(in srgb,var(--dv-c) 10%,#fff);border:2px solid var(--dv-c);
  animation:dv-pop .35s cubic-bezier(.2,1.4,.5,1)}
@keyframes dv-pop{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}
.dv-r{font-weight:800;color:var(--dv-c);font-size:calc(5cqw * var(--dv-ka,1));line-height:1.25}
.dv-e{margin-top:.4em;color:var(--dv-ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.45;
  font-size:calc(3cqw * var(--dv-ka,1))}
.dv-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:.6em;margin-top:1.1em;
  font-size:calc(2.9cqw * var(--dv-ka,1))}
.dv-btn{font:inherit;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:1em;
  border:1px solid var(--dv-line);background:#f7f5fb;color:var(--dv-ink);border-radius:99px;
  padding:.45em 1.1em;cursor:pointer;line-height:1.2;white-space:nowrap}
.dv-btn:hover{border-color:var(--dv-c);color:var(--dv-c)}
.dv-btn.is-on{background:var(--dv-c);border-color:var(--dv-c);color:#fff}
.dv-btn.dv-main:not(.is-on){background:var(--dv-c);border-color:var(--dv-c);color:#fff;font-weight:700}
.dv-btn.dv-main:not(.is-on):hover{filter:brightness(1.1)}
.dv-btn.dv-tbtn.is-on{background:#fff;color:var(--dv-c);border-color:var(--dv-c);font-variant-numeric:tabular-nums}
.dv-sheet.is-hurry .dv-btn.dv-tbtn.is-on{color:#e0533d;border-color:#e0533d}
.dv-btn.dv-tbtn.is-done{background:#fdecea;border-color:#e0533d;color:#b03520;font-weight:700}
.dv-btn:focus-visible{outline:2px solid var(--dv-c);outline-offset:1px}
.dv-settings{position:absolute;inset:0;z-index:4;background:#fff;padding:3cqw 4cqw;overflow-y:auto;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:max(12px,2.8cqw);color:#222;user-select:auto}
.dv-set-title{font-weight:700;font-size:1.15em;margin-bottom:2cqw}
.dv-lbl{display:block;font-weight:600;margin:2.4cqw 0 1cqw}
.dv-n{font-weight:400;color:#888;font-size:.92em}
.dv-row{display:flex;flex-wrap:wrap;gap:4px 14px}
.dv-settings select,.dv-settings textarea{display:block;width:100%;box-sizing:border-box;margin-top:1cqw;
  padding:5px 6px;font:inherit;font-weight:400;border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.dv-settings textarea{resize:vertical;min-height:5em}
.dv-chk{display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer}
.dv-chk-inline{display:inline-flex}
.dv-note{margin-top:2.4cqw;font-size:.92em;color:#666;line-height:1.4}
.dv-done{margin-top:3cqw;width:100%;padding:7px;border:0;border-radius:4px;background:var(--dv-ink);color:#fff;
  font:inherit;font-weight:600;cursor:pointer}
.dv-settings :focus-visible{outline:2px solid var(--dv-c);outline-offset:1px}
/* Plein écran : la carte occupe tout l'écran, la barre du haut reste affichée */
.dv-root.dv-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto}
/* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux (comme le Taquin) */
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .dv-root.dv-full{left:40px;height:100vh;height:100dvh}
}
.widget.dv-is-full > .drag-handle,
.widget.dv-is-full > .widget-rotate-handle,
.widget.dv-is-full > .widget-action-bar,
.widget.dv-is-full > .widget-ctx-menu,
.widget.dv-is-full > .custom-resize-handle{display:none !important}
@media print{.dv-bar,.dv-settings,.dv-actions,.dv-tbar{display:none}}
`;
        document.head.appendChild(st);
    }

    /* ── Code partagé avec les autres widgets (boutons fenêtre +
          mini-barre « Réduire »). Chaque bloc n'est installé qu'une fois,
          quel que soit le widget chargé en premier. ─────────────────── */
    function installSharedWindowButtons() {
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
                expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
                expandBtn.addEventListener('click', (e) => {
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
    }

    function init() {
        installSharedWindowButtons();
        injectStyles();
        injectTemplate();
        renderAll(false);
        mo.observe(document.body, { childList: true, subtree: true });
        // Changement de jour (board resté ouvert la nuit, ou retour de veille)
        setInterval(() => renderAll(true), 60000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAll(true); });
        // Les polices changent la hauteur du texte : on réajuste une fois chargées
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => document.querySelectorAll('.dv-root').forEach(fitSheet));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Accès public (tests / autres scripts)
    window.renderDevinettes = () => renderAll(false);
    window.DEVINETTES_ELEVES = DEVINETTES;

    // Sauvegarde / chargement (utilisés par save-load.js)
    // On sauvegarde les réglages, et la devinette affichée en mode « au hasard ».
    // En mode « devinette du jour », le widget revient à la devinette du jour au rechargement.
    window.devGetData = function (widget) {
        const root = widget && widget.querySelector('.dv-root');
        if (!root) return null;
        const cfg = getCfg(root);
        return { cfg, cur: cfg.mode === 'hasard' ? (root.getAttribute('data-cur') || null) : null };
    };
    window.devSetData = function (widget, data) {
        const root = widget && widget.querySelector('.dv-root');
        if (!root || !data || !data.cfg) return;
        root.setAttribute('data-cfg', JSON.stringify(data.cfg));
        if (data.cur) root.setAttribute('data-cur', data.cur);
        else root.removeAttribute('data-cur');
        render(root);
    };
})();
