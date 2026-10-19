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
   widget-citations.js — Widget « Citations »
   Le Bureau du Prof

   Affiche une citation adaptée aux élèves de fin de primaire (CM1-CM2) :
   - la citation en grand, avec son auteur (et l'œuvre quand on la connaît)
   - le thème de la citation (apprendre, effort, respect, confiance,
     nature, imagination, bonheur)
   - un bouton « Qu'est-ce que ça veut dire ? » qui dévoile une
     explication simple, pour lancer la discussion avec la classe
   - option « devinette » : l'auteur est caché, on le révèle d'un clic

   Barre du haut :
   - ⚙ réglages : mode (citation du jour / au hasard), thèmes affichés,
     auteur visible ou caché, citations personnelles de l'enseignant
   - ‹ 🎲 › pour passer d'une citation à l'autre ou en tirer une au hasard,
     ⟲ pour revenir à la citation du jour
   - boutons fenêtre jaune (réduire), vert (plein écran), rouge (fermer),
     identiques à ceux de l'éphéméride

   140 citations, une par jour de classe de l'année.
   Mode « citation du jour » : la citation change chaque jour du lundi au
   vendredi (pas le week-end) et toutes les citations passent avant qu'une
   même citation revienne.

   Utilisation : createWidget('citations')
   Le template #template-citations est injecté dans le DOM par ce fichier.
   Les réglages sont stockés dans l'attribut data-cfg de .cit-root et
   sauvegardés avec le board (voir citGetData / citSetData, save-load.js).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Thèmes ───────────────────────────────────────────────────── */
    const THEMES = {
        apprendre:   { nom: 'Apprendre et réfléchir', ico: '📚', c: '#2f6fb5' },
        effort:      { nom: 'Effort et persévérance', ico: '💪', c: '#d9822b' },
        respect:     { nom: 'Amitié et respect',      ico: '🤝', c: '#2e9e6a' },
        confiance:   { nom: 'Confiance en soi',       ico: '🌟', c: '#b8901a' },
        nature:      { nom: 'Nature et planète',      ico: '🌳', c: '#4f8f3a' },
        imagination: { nom: 'Imagination et lecture', ico: '🚀', c: '#7b5cc4' },
        bonheur:     { nom: 'Bonheur et gentillesse', ico: '😊', c: '#d6456b' },
        perso:       { nom: 'Mes citations',          ico: '✏️', c: '#5a5f6b' }
    };
    const THEME_KEYS = ['apprendre', 'effort', 'respect', 'confiance', 'nature', 'imagination', 'bonheur'];

    /* ── Citations ────────────────────────────────────────────────────
       t : texte, a : auteur, s : œuvre ou source (facultatif),
       th : thème, e : explication pour les élèves                       */
    const CITATIONS = [
        /* Apprendre et réfléchir */
        { th: 'apprendre', t: 'Ce que l’on conçoit bien s’énonce clairement.', a: 'Nicolas Boileau', s: 'L’Art poétique',
          e: 'Quand on a vraiment compris quelque chose, on arrive à l’expliquer simplement. Si on n’y arrive pas, c’est peut-être qu’il faut encore y réfléchir.' },
        { th: 'apprendre', t: 'Tout ce que je sais, c’est que je ne sais rien.', a: 'Socrate',
          e: 'Même un grand savant reconnaît qu’il lui reste beaucoup à apprendre. Savoir qu’on ne sait pas tout, c’est le début de la curiosité.' },
        { th: 'apprendre', t: 'L’erreur est humaine.', a: 'Proverbe latin',
          e: 'Tout le monde se trompe, même les adultes. Une erreur n’est pas grave : elle aide à comprendre et à progresser.' },
        { th: 'apprendre', t: 'Apprendre sans réfléchir est vain ; réfléchir sans apprendre est dangereux.', a: 'Confucius',
          e: 'Apprendre par cœur sans comprendre ne sert pas à grand-chose. Et donner son avis sans rien connaître du sujet peut nous faire dire des bêtises. Il faut les deux !' },
        { th: 'apprendre', t: 'Un enfant, un enseignant, un livre et un stylo peuvent changer le monde.', a: 'Malala Yousafzai', s: 'discours à l’ONU, 2013',
          e: 'Malala s’est battue pour que toutes les filles puissent aller à l’école. Pour elle, apprendre à lire et à écrire donne le pouvoir d’améliorer le monde.' },
        { th: 'apprendre', t: 'L’éducation est l’arme la plus puissante pour changer le monde.', a: 'Nelson Mandela',
          e: 'Nelson Mandela pensait que l’école permet de mieux comprendre les autres, de lutter contre l’injustice et de construire un avenir meilleur, sans violence.' },
        { th: 'apprendre', t: 'La lecture est à l’esprit ce que l’exercice est au corps.', a: 'Joseph Addison',
          e: 'Le sport rend le corps plus fort. De la même façon, lire fait travailler notre cerveau : on apprend des mots, des idées, des histoires.' },
        { th: 'apprendre', t: 'Celui qui pose une question risque d’avoir l’air bête cinq minutes. Celui qui n’en pose pas restera bête toute sa vie.', a: 'Proverbe chinois',
          e: 'Il ne faut pas avoir honte de poser des questions. C’est en demandant qu’on comprend ce qu’on ne savait pas.' },
        { th: 'apprendre', t: 'Mieux vaut une tête bien faite qu’une tête bien pleine.', a: 'D’après Montaigne', s: 'Essais',
          e: 'Ce qui compte, ce n’est pas d’entasser plein de connaissances, mais de savoir réfléchir, comprendre et utiliser ce qu’on a appris.' },
        { th: 'apprendre', t: 'On apprend à tout âge.', a: 'Proverbe',
          e: 'Il n’est jamais trop tôt ni trop tard pour apprendre. Les adultes aussi continuent à découvrir de nouvelles choses toute leur vie.' },
        { th: 'apprendre', t: 'Le doute est le commencement de la sagesse.', a: 'Attribuée à Aristote',
          e: 'Se poser des questions avant de croire quelque chose aide à mieux comprendre et à ne pas se laisser tromper, par exemple par une fausse information.' },
        { th: 'apprendre', t: 'Dis-moi et j’oublie, enseigne-moi et je me souviens, implique-moi et j’apprends.', a: 'Attribuée à Benjamin Franklin',
          e: 'On retient beaucoup mieux ce qu’on fait soi-même (manipuler, chercher, essayer) que ce qu’on écoute seulement.' },
        { th: 'apprendre', t: 'Ce que tu sais, sache que tu le sais ; ce que tu ne sais pas, sache que tu ne le sais pas : c’est là savoir véritablement.', a: 'Confucius', s: 'Entretiens',
          e: 'Être honnête avec soi-même, c’est reconnaître ce qu’on a compris et ce qu’on n’a pas encore compris. C’est comme ça qu’on sait quoi travailler.' },
        { th: 'apprendre', t: 'L’expérience est le nom que chacun donne à ses erreurs.', a: 'Oscar Wilde', s: 'L’Éventail de Lady Windermere',
          e: 'Quand les adultes parlent de leur « expérience », ils parlent souvent de tout ce qu’ils ont appris en se trompant. Les erreurs nous rendent plus savants.' },
        { th: 'apprendre', t: 'Une personne qui n’a jamais commis d’erreur n’a jamais tenté d’innover.', a: 'Attribuée à Albert Einstein',
          e: '« Innover », c’est essayer quelque chose de nouveau. Quand on essaie du nouveau, on se trompe forcément un peu : c’est normal et c’est utile.' },
        { th: 'apprendre', t: 'L’esprit n’est pas un vase qu’on remplit, mais un feu qu’on allume.', a: 'D’après Plutarque',
          e: 'Apprendre, ce n’est pas seulement entasser des connaissances dans sa tête : c’est allumer en soi l’envie de comprendre et de découvrir.' },
        { th: 'apprendre', t: 'Enseigner, c’est apprendre deux fois.', a: 'Joseph Joubert',
          e: 'Quand on explique quelque chose à un camarade, on doit bien le comprendre soi-même. Aider les autres, c’est aussi apprendre mieux.' },
        { th: 'apprendre', t: 'La nuit porte conseil.', a: 'Proverbe',
          e: 'Avant de prendre une décision importante, il est souvent sage d’attendre un peu et d’y repenser à tête reposée, le lendemain.' },
        { th: 'apprendre', t: 'Les paroles s’envolent, les écrits restent.', a: 'Proverbe latin',
          e: 'Ce qu’on dit peut s’oublier, mais ce qu’on écrit reste. C’est pour cela qu’on note ses leçons… et qu’il faut réfléchir avant d’écrire un message.' },
        { th: 'apprendre', t: 'Ce n’est pas assez d’avoir l’esprit bon, mais le principal est de l’appliquer bien.', a: 'René Descartes', s: 'Discours de la méthode',
          e: 'Être intelligent ne suffit pas : il faut aussi faire l’effort de réfléchir avec méthode et attention.' },
        { th: 'apprendre', t: 'Celui qui ouvre une porte d’école ferme une prison.', a: 'Attribuée à Victor Hugo',
          e: 'Pour Victor Hugo, l’école donne à chacun la possibilité de choisir sa vie, de comprendre le monde et de ne pas tomber dans la violence.' },

        /* Effort et persévérance */
        { th: 'effort', t: 'Rien ne sert de courir ; il faut partir à point.', a: 'Jean de La Fontaine', s: 'Le Lièvre et la Tortue',
          e: 'Aller vite ne suffit pas : il vaut mieux commencer à temps et avancer régulièrement. La tortue a gagné la course parce qu’elle ne s’est pas arrêtée.' },
        { th: 'effort', t: 'Patience et longueur de temps font plus que force ni que rage.', a: 'Jean de La Fontaine', s: 'Le Lion et le Rat',
          e: 'Se fâcher ou forcer ne règle pas les problèmes. En prenant son temps et en restant calme, on arrive souvent à faire des choses très difficiles.' },
        { th: 'effort', t: 'Aide-toi, le ciel t’aidera.', a: 'Jean de La Fontaine', s: 'Le Chartier embourbé',
          e: 'Au lieu d’attendre que quelqu’un fasse les choses à notre place, il faut d’abord essayer soi-même. Les efforts finissent par payer.' },
        { th: 'effort', t: 'Petit à petit, l’oiseau fait son nid.', a: 'Proverbe',
          e: 'L’oiseau construit son nid brindille après brindille. Pour réussir quelque chose de grand, on avance un petit pas après l’autre.' },
        { th: 'effort', t: 'C’est en forgeant qu’on devient forgeron.', a: 'Proverbe',
          e: 'On devient bon dans quelque chose en le faisant souvent : lire, écrire, faire du vélo ou jouer d’un instrument, c’est l’entraînement qui compte.' },
        { th: 'effort', t: 'Vingt fois sur le métier remettez votre ouvrage.', a: 'Nicolas Boileau', s: 'L’Art poétique',
          e: 'Un beau travail se recommence et s’améliore plusieurs fois. Relire, corriger, refaire : c’est comme ça qu’on progresse.' },
        { th: 'effort', t: 'À cœur vaillant, rien d’impossible.', a: 'Jacques Cœur', s: 'sa devise',
          e: 'Quand on a du courage et de la volonté, on peut réussir des choses qui paraissaient impossibles au départ.' },
        { th: 'effort', t: 'Le génie est fait d’un pour cent d’inspiration et de quatre-vingt-dix-neuf pour cent de transpiration.', a: 'Thomas Edison',
          e: 'Thomas Edison, l’inventeur de l’ampoule électrique, pensait qu’une bonne idée ne suffit pas : la réussite vient surtout du travail et des efforts.' },
        { th: 'effort', t: 'Je n’ai pas échoué. J’ai simplement trouvé dix mille façons qui ne fonctionnent pas.', a: 'Attribuée à Thomas Edison',
          e: 'Chaque essai raté apprend quelque chose. Un échec n’est pas une fin : c’est une étape vers la solution.' },
        { th: 'effort', t: 'Ce n’est pas parce que les choses sont difficiles que nous n’osons pas, c’est parce que nous n’osons pas qu’elles sont difficiles.', a: 'Sénèque',
          e: 'Souvent, une chose paraît difficile parce qu’on a peur d’essayer. Quand on ose se lancer, elle devient plus facile.' },
        { th: 'effort', t: 'Un voyage de mille lieues commence toujours par un premier pas.', a: 'Lao-Tseu',
          e: 'Même le plus grand projet commence par une toute petite action. Le plus important, c’est de commencer.' },
        { th: 'effort', t: 'Notre plus grande gloire n’est pas de ne jamais tomber, mais de nous relever chaque fois que nous tombons.', a: 'Confucius',
          e: 'Tout le monde tombe un jour, au sens propre comme au figuré. Ce qui compte, c’est de ne pas abandonner et de recommencer.' },
        { th: 'effort', t: 'Celui qui déplace la montagne, c’est celui qui commence par enlever les petites pierres.', a: 'Confucius',
          e: 'Une tâche énorme se découpe en petites tâches faciles. En les faisant une par une, on finit par réussir.' },
        { th: 'effort', t: 'Tout est difficile avant d’être facile.', a: 'Thomas Fuller',
          e: 'Au début, apprendre une chose nouvelle est compliqué. Avec de l’entraînement, ce qui était dur devient facile.' },
        { th: 'effort', t: 'Rome ne s’est pas faite en un jour.', a: 'Proverbe',
          e: 'Une grande ville comme Rome a mis des siècles à se construire. Les grandes réussites demandent du temps : il ne faut pas se décourager.' },
        { th: 'effort', t: 'Il faut battre le fer pendant qu’il est chaud.', a: 'Proverbe',
          e: 'Le forgeron travaille le fer quand il est chaud, sinon il durcit. De même, il faut agir au bon moment, quand l’occasion se présente.' },
        { th: 'effort', t: 'Qui veut voyager loin ménage sa monture.', a: 'Jean Racine', s: 'Les Plaideurs',
          e: 'Le cavalier qui veut aller loin ne fatigue pas trop son cheval. Pour réussir sur la durée, il faut garder des forces et ne pas s’épuiser.' },
        { th: 'effort', t: 'Le travail éloigne de nous trois grands maux : l’ennui, le vice et le besoin.', a: 'Voltaire', s: 'Candide',
          e: 'Travailler occupe l’esprit (pas d’ennui), évite de faire des bêtises (le vice) et permet de gagner sa vie (le besoin).' },
        { th: 'effort', t: 'Goutte à goutte, l’eau creuse la pierre.', a: 'Proverbe latin',
          e: 'Une goutte d’eau seule ne fait rien, mais des milliers finissent par creuser la roche. Les petits efforts répétés chaque jour sont très puissants.' },
        { th: 'effort', t: 'Le succès, c’est d’aller d’échec en échec sans perdre son enthousiasme.', a: 'Attribuée à Winston Churchill',
          e: 'Ceux qui réussissent ont souvent échoué de nombreuses fois. Leur secret : garder l’envie et la bonne humeur malgré les ratés.' },
        { th: 'effort', t: 'Il n’y a qu’une façon d’échouer, c’est d’abandonner avant d’avoir réussi.', a: 'Attribuée à Georges Clemenceau',
          e: 'Tant qu’on continue d’essayer, on n’a pas encore perdu. Le vrai échec, c’est d’arrêter trop tôt.' },
        { th: 'effort', t: 'Travaillez, prenez de la peine : c’est le fonds qui manque le moins.', a: 'Jean de La Fontaine', s: 'Le Laboureur et ses Enfants',
          e: 'Dans la fable, le père fait croire à ses fils qu’un trésor est caché dans le champ. En le retournant, ils obtiennent une belle récolte : le vrai trésor, c’était le travail.' },
        { th: 'effort', t: 'Il ne faut pas remettre au lendemain ce que l’on peut faire le jour même.', a: 'Proverbe',
          e: 'Quand on repousse toujours ses tâches, elles s’accumulent et deviennent plus lourdes. Mieux vaut les faire tout de suite.' },
        { th: 'effort', t: 'À vaincre sans péril, on triomphe sans gloire.', a: 'Pierre Corneille', s: 'Le Cid',
          e: 'Une victoire trop facile n’a pas beaucoup de valeur. On est fier de réussir quand on a vraiment dû faire des efforts.' },
        { th: 'effort', t: 'Ce qui vaut la peine d’être fait vaut la peine d’être bien fait.', a: 'Attribuée à Nicolas Poussin',
          e: 'Si on se lance dans un travail, autant le faire avec soin plutôt que de le bâcler.' },

        /* Amitié et respect */
        { th: 'respect', t: 'On a souvent besoin d’un plus petit que soi.', a: 'Jean de La Fontaine', s: 'Le Lion et le Rat',
          e: 'Dans la fable, un petit rat sauve un lion prisonnier d’un filet. Chacun peut aider, quelle que soit sa taille ou sa force : il ne faut mépriser personne.' },
        { th: 'respect', t: 'Il se faut entraider, c’est la loi de nature.', a: 'Jean de La Fontaine', s: 'L’Âne et le Chien',
          e: 'Dans la nature comme dans la classe, on vit mieux quand on s’aide les uns les autres.' },
        { th: 'respect', t: 'Seul, on va plus vite. Ensemble, on va plus loin.', a: 'Proverbe africain',
          e: 'Travailler seul peut sembler plus rapide, mais en groupe on partage les idées et on réussit des choses bien plus grandes.' },
        { th: 'respect', t: 'Tous pour un, un pour tous !', a: 'Alexandre Dumas', s: 'Les Trois Mousquetaires',
          e: 'C’est la devise des mousquetaires : chacun aide le groupe, et le groupe protège chacun. C’est l’esprit d’équipe.' },
        { th: 'respect', t: 'Les hommes naissent et demeurent libres et égaux en droits.', a: 'Déclaration des droits de l’homme et du citoyen', s: 'article 1, 1789',
          e: 'Tous les êtres humains, filles et garçons, ont les mêmes droits dès leur naissance, quelle que soit leur origine.' },
        { th: 'respect', t: 'Ne fais pas à autrui ce que tu ne voudrais pas qu’on te fasse.', a: 'Confucius',
          e: '« Autrui », ce sont les autres. Avant d’agir, on peut se demander : est-ce que j’aimerais qu’on me fasse la même chose ?' },
        { th: 'respect', t: 'La liberté des uns s’arrête là où commence celle des autres.', a: 'Proverbe',
          e: 'On est libre de faire ce qu’on veut… tant que cela ne gêne pas ou ne blesse pas les autres.' },
        { th: 'respect', t: 'La politesse est à l’esprit ce que la grâce est au visage.', a: 'Voltaire',
          e: 'La politesse rend une personne agréable, comme un beau sourire rend un visage joli. Dire bonjour, merci, s’il te plaît, ça fait du bien à tout le monde.' },
        { th: 'respect', t: 'On ne voit bien qu’avec le cœur. L’essentiel est invisible pour les yeux.', a: 'Antoine de Saint-Exupéry', s: 'Le Petit Prince',
          e: 'Ce qui compte vraiment chez quelqu’un, ce n’est pas son apparence, mais sa gentillesse, son amitié, ce qu’il ressent.' },
        { th: 'respect', t: 'Tu deviens responsable pour toujours de ce que tu as apprivoisé.', a: 'Antoine de Saint-Exupéry', s: 'Le Petit Prince',
          e: 'Quand on devient l’ami de quelqu’un ou qu’on adopte un animal, on doit en prendre soin. L’amitié, ça s’entretient.' },
        { th: 'respect', t: 'Un ami, c’est quelqu’un qui vous connaît bien et qui vous aime quand même.', a: 'Attribuée à Elbert Hubbard',
          e: 'Un vrai ami connaît nos qualités et nos défauts, et il reste notre ami. Il nous accepte comme nous sommes.' },
        { th: 'respect', t: 'Il n’y a pas de sot métier, il n’y a que de sottes gens.', a: 'Proverbe',
          e: 'Tous les métiers sont utiles et méritent le respect. Ce qui est bête, c’est de se moquer du travail des autres.' },
        { th: 'respect', t: 'Œil pour œil, et le monde finira aveugle.', a: 'Attribuée à Gandhi',
          e: 'Si chacun se venge, la violence ne s’arrête jamais. Pour régler un conflit, il vaut mieux parler que rendre les coups.' },
        { th: 'respect', t: 'La raison du plus fort est toujours la meilleure.', a: 'Jean de La Fontaine', s: 'Le Loup et l’Agneau',
          e: 'Attention, La Fontaine ne dit pas que c’est juste ! Il montre que le loup gagne seulement parce qu’il est plus fort, et il dénonce cette injustice.' },
        { th: 'respect', t: 'Rira bien qui rira le dernier.', a: 'Proverbe',
          e: 'Celui qui se moque des autres trop vite risque que la situation se retourne contre lui. Mieux vaut ne pas se moquer.' },
        { th: 'respect', t: 'Tel est pris qui croyait prendre.', a: 'Jean de La Fontaine', s: 'Le Rat et l’Huître',
          e: 'Celui qui veut piéger ou tromper quelqu’un finit souvent par tomber lui-même dans le piège.' },
        { th: 'respect', t: 'L’habit ne fait pas le moine.', a: 'Proverbe',
          e: 'Les vêtements ou l’apparence ne disent pas qui est vraiment une personne. Il ne faut pas juger les gens sur leur look.' },
        { th: 'respect', t: 'L’union fait la force.', a: 'Proverbe', s: 'devise de la Belgique',
          e: 'Seul, on est faible ; ensemble, on devient fort. Une classe soudée réussit mieux qu’une classe divisée.' },
        { th: 'respect', t: 'Liberté, Égalité, Fraternité.', a: 'Devise de la République française',
          e: 'Ces trois mots sont écrits sur les écoles et les mairies. Liberté : être libre. Égalité : avoir les mêmes droits. Fraternité : s’entraider comme des frères et sœurs.' },
        { th: 'respect', t: 'La violence est le dernier refuge de l’incompétence.', a: 'Isaac Asimov', s: 'Fondation',
          e: 'Quand on n’arrive plus à trouver de bonnes idées ou de bons mots pour régler un problème, on devient violent. Les solutions intelligentes passent par la parole.' },
        { th: 'respect', t: 'Nous devons apprendre à vivre ensemble comme des frères, sinon nous allons mourir ensemble comme des idiots.', a: 'Martin Luther King', s: 'discours de 1964',
          e: 'Martin Luther King s’est battu pour que les Noirs et les Blancs aient les mêmes droits aux États-Unis. Pour lui, l’humanité n’a pas d’autre choix que de s’entendre.' },
        { th: 'respect', t: 'Chose promise, chose due.', a: 'Proverbe',
          e: 'Quand on a promis quelque chose, on doit le faire. Tenir sa parole, c’est montrer qu’on est digne de confiance.' },
        { th: 'respect', t: 'Le seul moyen d’avoir un ami, c’est d’en être un.', a: 'Ralph Waldo Emerson',
          e: 'Pour avoir des amis, il faut soi-même être un bon ami : gentil, fidèle, à l’écoute.' },
        { th: 'respect', t: 'Nous avons deux oreilles et une seule bouche, pour écouter deux fois plus que nous ne parlons.', a: 'Attribuée à Épictète',
          e: 'Savoir écouter les autres est aussi important que savoir parler. En classe comme ailleurs, on apprend beaucoup en écoutant.' },
        { th: 'respect', t: 'Il faut tourner sept fois sa langue dans sa bouche avant de parler.', a: 'Proverbe',
          e: 'Avant de dire quelque chose, surtout quand on est en colère, il vaut mieux réfléchir pour ne pas blesser quelqu’un.' },
        { th: 'respect', t: 'Rien n’est si contagieux que l’exemple.', a: 'François de La Rochefoucauld', s: 'Maximes',
          e: 'On imite souvent ce que font les autres. Donner le bon exemple, c’est aider les autres à bien se comporter.' },
        { th: 'respect', t: 'Le soleil brille pour tout le monde.', a: 'Proverbe',
          e: 'Certaines choses appartiennent à tous, sans distinction. Chacun a droit à sa place et à sa part de bonheur.' },

        /* Confiance en soi */
        { th: 'confiance', t: 'Sois toi-même, les autres sont déjà pris.', a: 'Attribuée à Oscar Wilde',
          e: 'Chacun est unique. Pas besoin d’imiter les autres : tes goûts et ta personnalité ont de la valeur.' },
        { th: 'confiance', t: 'Ils ne savaient pas que c’était impossible, alors ils l’ont fait.', a: 'Attribuée à Mark Twain',
          e: 'Parfois, c’est la peur de ne pas y arriver qui nous bloque. Ceux qui osent essayer réussissent parfois l’impossible.' },
        { th: 'confiance', t: 'La vie, c’est comme une bicyclette : il faut avancer pour ne pas perdre l’équilibre.', a: 'Albert Einstein', s: 'lettre à son fils, 1930',
          e: 'Quand on s’arrête de pédaler, on tombe. Dans la vie, c’est pareil : il faut continuer à avancer, à apprendre et à essayer.' },
        { th: 'confiance', t: 'Le courage n’est pas l’absence de peur, mais la capacité de la vaincre.', a: 'Attribuée à Nelson Mandela',
          e: 'Être courageux, ce n’est pas ne jamais avoir peur. C’est avoir peur et agir quand même.' },
        { th: 'confiance', t: 'Tout le monde est un génie. Mais si on juge un poisson sur sa capacité à grimper aux arbres, il passera sa vie à croire qu’il est stupide.', a: 'Attribuée à Albert Einstein',
          e: 'Chacun a ses talents : certains sont doués pour dessiner, d’autres pour courir, compter ou écouter. Il ne faut pas se juger seulement sur ce qu’on ne sait pas encore faire.' },
        { th: 'confiance', t: 'Qui ne tente rien n’a rien.', a: 'Proverbe',
          e: 'Si on n’essaie jamais, on est sûr de ne pas réussir. Il faut oser se lancer, même si on a peur de se tromper.' },
        { th: 'confiance', t: 'Tombe sept fois, relève-toi huit.', a: 'Proverbe japonais',
          e: 'Peu importe le nombre de chutes : il faut toujours se relever une fois de plus. C’est ça, la persévérance.' },
        { th: 'confiance', t: 'Vouloir, c’est pouvoir.', a: 'Proverbe',
          e: 'Quand on a vraiment envie de réussir quelque chose, on trouve l’énergie et les moyens d’y arriver.' },
        { th: 'confiance', t: 'Le pessimiste voit la difficulté dans chaque opportunité, l’optimiste voit l’opportunité dans chaque difficulté.', a: 'Attribuée à Winston Churchill',
          e: 'Face au même problème, on peut se dire « c’est trop dur » ou « c’est l’occasion d’apprendre ». La façon de voir les choses change tout.' },
        { th: 'confiance', t: 'Personne ne peut vous faire sentir inférieur sans votre consentement.', a: 'Attribuée à Eleanor Roosevelt',
          e: 'Si quelqu’un se moque de toi, tu n’es pas obligé de le croire. Ta valeur ne dépend pas de ce que disent les moqueurs.' },
        { th: 'confiance', t: 'La fortune sourit aux audacieux.', a: 'D’après Virgile', s: 'Énéide',
          e: 'Ici, « la fortune » veut dire la chance. La chance aide plus souvent ceux qui osent se lancer que ceux qui n’essaient rien.' },
        { th: 'confiance', t: 'Connais-toi toi-même.', a: 'Socrate', s: 'inscription du temple de Delphes',
          e: 'Savoir ce qu’on aime, ce qu’on sait faire et ce qu’on doit encore améliorer aide à faire les bons choix et à progresser.' },
        { th: 'confiance', t: 'Après la pluie, le beau temps.', a: 'Proverbe',
          e: 'Les moments difficiles ne durent pas toujours. Après les soucis, les jours meilleurs reviennent.' },
        { th: 'confiance', t: 'Tant qu’il y a de la vie, il y a de l’espoir.', a: 'Proverbe',
          e: 'Même quand une situation semble mal partie, il ne faut pas perdre espoir : les choses peuvent encore s’arranger.' },
        { th: 'confiance', t: 'Le courage croît en osant et la peur en hésitant.', a: 'Proverbe',
          e: 'Plus on ose, plus on devient courageux. Plus on hésite, plus la peur grandit. Alors, on se lance !' },
        { th: 'confiance', t: 'Mieux vaut allumer une bougie que maudire l’obscurité.', a: 'Proverbe chinois',
          e: 'Au lieu de se plaindre d’un problème, mieux vaut faire un petit geste pour l’améliorer, même modeste.' },
        { th: 'confiance', t: 'Je ne perds jamais. Soit je gagne, soit j’apprends.', a: 'Attribuée à Nelson Mandela',
          e: 'Une défaite n’est pas inutile : elle nous apprend quelque chose pour la prochaine fois.' },
        { th: 'confiance', t: 'Petit poisson deviendra grand.', a: 'Jean de La Fontaine', s: 'Le Petit Poisson et le Pêcheur',
          e: 'Chacun grandit et progresse. Ce qu’on ne sait pas encore faire aujourd’hui, on saura le faire plus tard.' },

        /* Nature et planète */
        { th: 'nature', t: 'Nous n’héritons pas de la Terre de nos parents, nous l’empruntons à nos enfants.', a: 'Proverbe amérindien',
          e: 'La planète ne nous appartient pas : nous devons la laisser en bon état pour ceux qui vivront après nous.' },
        { th: 'nature', t: 'Quand le dernier arbre sera abattu, la dernière rivière polluée, le dernier poisson pêché, alors on s’apercevra que l’argent ne se mange pas.', a: 'Proverbe amérindien',
          e: 'Les richesses de la nature sont plus précieuses que l’argent. Si on les détruit, l’argent ne pourra pas les remplacer.' },
        { th: 'nature', t: 'Rien ne se perd, rien ne se crée, tout se transforme.', a: 'D’après Antoine Lavoisier',
          e: 'Le savant Lavoisier a montré que la matière ne disparaît pas : le bois qui brûle devient fumée et cendres. C’est aussi l’idée du recyclage.' },
        { th: 'nature', t: 'La nature ne fait rien en vain.', a: 'Aristote',
          e: 'Dans la nature, chaque être vivant a un rôle : l’abeille pollinise les fleurs, le ver de terre aère le sol… Tout est utile.' },
        { th: 'nature', t: 'Le meilleur moment pour planter un arbre, c’était il y a vingt ans. Le deuxième meilleur moment, c’est maintenant.', a: 'Proverbe chinois',
          e: 'Il n’est jamais trop tard pour bien faire. Le mieux, c’est de commencer tout de suite.' },
        { th: 'nature', t: 'Regarde profondément dans la nature, et alors tu comprendras tout beaucoup mieux.', a: 'Albert Einstein',
          e: 'En observant la nature avec attention, on apprend énormément : c’est ce que font les scientifiques.' },
        { th: 'nature', t: 'Il faut cultiver notre jardin.', a: 'Voltaire', s: 'Candide',
          e: 'Au lieu de se plaindre, mieux vaut s’occuper de ce qu’on peut améliorer autour de soi, avec patience, comme un jardinier.' },
        { th: 'nature', t: 'C’est une triste chose de penser que la nature parle et que le genre humain n’écoute pas.', a: 'Victor Hugo',
          e: 'La nature nous envoie des signaux (pollution, animaux qui disparaissent…) et il faut apprendre à les écouter pour la protéger.' },
        { th: 'nature', t: 'La Terre n’appartient pas à l’homme, c’est l’homme qui appartient à la Terre.', a: 'Attribuée au chef Seattle',
          e: 'Les humains font partie de la nature, comme les animaux et les plantes. Nous ne sommes pas les propriétaires de la planète.' },
        { th: 'nature', t: 'La Nature est un temple.', a: 'Charles Baudelaire', s: 'Les Fleurs du mal',
          e: 'Pour le poète, la nature est un lieu précieux et mystérieux, qu’on doit respecter comme un endroit sacré.' },
        { th: 'nature', t: 'Les forêts précèdent les peuples, les déserts les suivent.', a: 'Attribuée à Chateaubriand',
          e: 'Là où les humains coupent toutes les forêts, la terre s’abîme et peut devenir un désert. Il faut protéger les arbres.' },
        { th: 'nature', t: 'Notre maison brûle et nous regardons ailleurs.', a: 'Jacques Chirac', s: 'Sommet de la Terre, 2002',
          e: 'La « maison », c’est notre planète. Le président voulait dire que la Terre est en danger (réchauffement, pollution) et qu’on ne réagit pas assez.' },
        { th: 'nature', t: 'Le battement d’ailes d’un papillon au Brésil peut-il provoquer une tornade au Texas ?', a: 'Edward Lorenz', s: 'titre d’une conférence, 1972',
          e: 'Ce savant de la météo a montré qu’un tout petit changement peut avoir de grandes conséquences. On appelle ça « l’effet papillon ».' },
        { th: 'nature', t: 'En avril, ne te découvre pas d’un fil ; en mai, fais ce qu’il te plaît.', a: 'Dicton',
          e: 'En avril, il peut encore faire froid : on garde ses vêtements chauds. En mai, le beau temps est plus sûr.' },
        { th: 'nature', t: 'On ne commande à la nature qu’en lui obéissant.', a: 'Francis Bacon',
          e: 'Pour utiliser la nature (cultiver, construire, soigner), il faut d’abord comprendre et respecter ses lois.' },
        { th: 'nature', t: 'Les petits ruisseaux font les grandes rivières.', a: 'Proverbe',
          e: 'Beaucoup de petites choses ensemble en font une grande. Éteindre la lumière, trier ses déchets : chaque petit geste compte pour la planète.' },
        { th: 'nature', t: 'Penser globalement, agir localement.', a: 'René Dubos',
          e: 'Les problèmes de la planète sont immenses, mais on peut agir près de chez soi : à la maison, à l’école, dans son quartier.' },

        /* Imagination et lecture */
        { th: 'imagination', t: 'L’imagination est plus importante que le savoir.', a: 'Albert Einstein',
          e: 'Connaître des choses, c’est bien. Mais imaginer permet d’inventer ce qui n’existe pas encore : c’est comme ça que naissent les découvertes.' },
        { th: 'imagination', t: 'Tout ce qu’un homme est capable d’imaginer, d’autres hommes seront capables de le réaliser.', a: 'Attribuée à Jules Verne',
          e: 'Jules Verne imaginait des sous-marins et des voyages vers la Lune bien avant qu’ils existent. Les rêves d’aujourd’hui sont les inventions de demain.' },
        { th: 'imagination', t: 'Toutes les grandes personnes ont d’abord été des enfants. Mais peu d’entre elles s’en souviennent.', a: 'Antoine de Saint-Exupéry', s: 'Le Petit Prince',
          e: 'En grandissant, beaucoup d’adultes oublient comment ils voyaient le monde quand ils étaient petits : avec curiosité, imagination et émerveillement.' },
        { th: 'imagination', t: 'Un livre est un ami qui ne trompe jamais.', a: 'René-Charles Guilbert de Pixérécourt',
          e: 'Un livre est toujours là quand on en a besoin : il nous fait voyager, rire ou apprendre, et il ne nous déçoit pas.' },
        { th: 'imagination', t: 'Le monde est un livre, et ceux qui ne voyagent pas n’en lisent qu’une page.', a: 'Attribuée à saint Augustin',
          e: 'Voyager, c’est comme lire un grand livre : chaque pays et chaque rencontre nous apprennent quelque chose de nouveau.' },
        { th: 'imagination', t: 'La Terre est le berceau de l’humanité, mais on ne passe pas sa vie entière dans un berceau.', a: 'Constantin Tsiolkovski',
          e: 'Ce savant russe rêvait d’aller dans l’espace. Pour lui, les humains finiraient par explorer l’univers, comme un enfant qui grandit finit par quitter son berceau.' },
        { th: 'imagination', t: 'La lecture, une porte ouverte sur un monde enchanté.', a: 'Attribuée à François Mauriac',
          e: 'Quand on ouvre un livre, on entre dans un autre monde : on peut découvrir des pays, des époques, des aventures.' },
        { th: 'imagination', t: 'Un homme qui lit en vaut deux.', a: 'Proverbe',
          e: 'La lecture apporte des connaissances, du vocabulaire et des idées. Celui qui lit beaucoup devient plus riche dans sa tête.' },
        { th: 'imagination', t: 'Une maison sans livres est comme un corps sans âme.', a: 'Attribuée à Cicéron',
          e: 'Les livres donnent de la vie à une maison : ils apportent des histoires, des rêves et des savoirs.' },
        { th: 'imagination', t: 'L’art lave notre âme de la poussière du quotidien.', a: 'Attribuée à Pablo Picasso',
          e: 'Regarder un tableau, écouter de la musique ou dessiner fait du bien : ça nous change les idées et nous rend plus légers.' },
        { th: 'imagination', t: 'Tout enfant est un artiste. Le problème, c’est de rester un artiste en grandissant.', a: 'Attribuée à Pablo Picasso',
          e: 'Les enfants dessinent et inventent sans avoir peur du résultat. En grandissant, il faut garder cette liberté de créer.' },
        { th: 'imagination', t: 'On résiste à l’invasion des armées ; on ne résiste pas à l’invasion des idées.', a: 'Victor Hugo', s: 'Histoire d’un crime',
          e: 'On peut arrêter une armée avec des murs, mais une bonne idée se répand partout et finit par changer le monde.' },
        { th: 'imagination', t: 'La musique donne une âme à nos cœurs et des ailes à la pensée.', a: 'Attribuée à Platon',
          e: 'La musique fait naître des émotions et aide l’imagination à voyager, comme si nos pensées pouvaient s’envoler.' },
        { th: 'imagination', t: 'Créer, c’est vivre deux fois.', a: 'Albert Camus', s: 'Le Mythe de Sisyphe',
          e: 'Quand on invente une histoire, un dessin ou une musique, on vit sa propre vie… et aussi celle qu’on imagine.' },
        { th: 'imagination', t: 'La logique vous mènera d’un point A à un point B. L’imagination vous mènera partout.', a: 'Attribuée à Albert Einstein',
          e: 'Le raisonnement aide à résoudre un problème précis. L’imagination, elle, n’a pas de limites : elle permet d’inventer ce qui n’existe pas.' },
        { th: 'imagination', t: 'Ce qui embellit le désert, c’est qu’il cache un puits quelque part.', a: 'Antoine de Saint-Exupéry', s: 'Le Petit Prince',
          e: 'Même dans un endroit vide ou un moment triste, l’espoir d’une belle surprise rend les choses plus belles.' },

        /* Bonheur et gentillesse */
        { th: 'bonheur', t: 'Le bonheur est la seule chose qui se double si on le partage.', a: 'Albert Schweitzer',
          e: 'Quand on partage un gâteau, chacun a une part plus petite. Mais quand on partage sa joie, il y en a encore plus pour tout le monde !' },
        { th: 'bonheur', t: 'Un sourire coûte moins cher que l’électricité, mais donne autant de lumière.', a: 'Abbé Pierre',
          e: 'Sourire ne coûte rien et peut illuminer la journée de quelqu’un. C’est un petit geste qui fait beaucoup de bien.' },
        { th: 'bonheur', t: 'Le rire est le propre de l’homme.', a: 'François Rabelais', s: 'Gargantua',
          e: '« Le propre de », c’est ce qui caractérise quelqu’un. Pour Rabelais, savoir rire est une chose qui rend les humains spéciaux.' },
        { th: 'bonheur', t: 'Il faut rire avant d’être heureux, de peur de mourir sans avoir ri.', a: 'Jean de La Bruyère', s: 'Les Caractères',
          e: 'Il ne faut pas attendre que tout soit parfait pour profiter de la vie. Rire et s’amuser, c’est important dès maintenant.' },
        { th: 'bonheur', t: 'La gentillesse est le langage qu’un sourd peut entendre et qu’un aveugle peut voir.', a: 'Attribuée à Mark Twain',
          e: 'La gentillesse se comprend sans mots : tout le monde peut la ressentir, quelle que soit sa langue ou sa différence.' },
        { th: 'bonheur', t: 'Le sourire que tu envoies revient vers toi.', a: 'Proverbe indien',
          e: 'Quand on est souriant et aimable, les autres ont envie de l’être avec nous aussi.' },
        { th: 'bonheur', t: 'J’ai décidé d’être heureux parce que c’est bon pour la santé.', a: 'Attribuée à Voltaire',
          e: 'Le bonheur dépend aussi un peu de nous : voir le bon côté des choses aide à se sentir bien.' },
        { th: 'bonheur', t: 'Il y a plus de bonheur à donner qu’à recevoir.', a: 'Proverbe',
          e: 'Faire plaisir à quelqu’un, offrir son aide ou un cadeau, rend souvent encore plus heureux que d’en recevoir un.' },
        { th: 'bonheur', t: 'La reconnaissance est la mémoire du cœur.', a: 'Jean-Baptiste Massieu',
          e: 'Être reconnaissant, c’est se souvenir de ce que les autres ont fait pour nous et leur dire merci.' },
        { th: 'bonheur', t: 'Cueille le jour présent.', a: 'Horace', s: 'Odes',
          e: 'En latin, on dit « carpe diem ». Cela veut dire : profite de chaque journée, sans attendre toujours demain pour être heureux.' },
        { th: 'bonheur', t: 'Il y a des fleurs partout pour qui veut bien les voir.', a: 'Henri Matisse',
          e: 'Les belles choses sont souvent autour de nous. Il suffit de prendre le temps de les remarquer.' },
        { th: 'bonheur', t: 'La joie est en tout ; il faut savoir l’extraire.', a: 'Attribuée à Confucius',
          e: 'Même dans une journée ordinaire, il y a toujours un petit moment joyeux à trouver, si on le cherche.' },
        { th: 'bonheur', t: 'Ce n’est pas le bonheur qui rend reconnaissant, c’est la reconnaissance qui rend heureux.', a: 'Attribuée à David Steindl-Rast',
          e: 'En pensant à tout ce qu’on a de bien (sa famille, ses amis, un bon repas), on se sent plus heureux.' },
        { th: 'bonheur', t: 'Les petites attentions font les grandes amitiés.', a: 'Proverbe',
          e: 'Un sourire, un mot gentil, prêter un crayon : ces petits gestes construisent de solides amitiés.' },
        { th: 'bonheur', t: 'Un bienfait n’est jamais perdu.', a: 'Proverbe',
          e: 'Une bonne action finit toujours par porter ses fruits, même si on ne le voit pas tout de suite.' },
        { th: 'bonheur', t: 'On n’est jamais si heureux ni si malheureux qu’on s’imagine.', a: 'François de La Rochefoucauld', s: 'Maximes',
          e: 'Sur le moment, une joie ou une peine paraît immense. Avec un peu de recul, on voit que les choses sont souvent plus simples.' }
    ];

    const DEFAULT_CFG = {
        mode: 'jour',            // 'jour' : citation du jour ; 'hasard' : au hasard
        author: true,            // false : auteur caché (devinette « Qui a dit ça ? »)
        themes: { apprendre: true, effort: true, respect: true, confiance: true, nature: true, imagination: true, bonheur: true },
        perso: '',               // citations de l'enseignant, une par ligne : « Texte — Auteur »
        persoOnly: false         // n'afficher que les citations personnelles
    };

    /* ── Outils ───────────────────────────────────────────────────── */
    const DAY = 86400000;
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    // Numéro du jour, en ne comptant que les jours du lundi au vendredi :
    // la citation du jour ne change pas le week-end (samedi et dimanche
    // affichent déjà celle du lundi suivant).
    // Le 1er janvier 1970 était un jeudi : WEEK donne, pour chaque jour de la
    // semaine à partir du jeudi, s'il s'agit d'un jour ouvré (1) ou non (0).
    const WEEK = [1, 1, 0, 0, 1, 1, 1];
    const dayNum = d => {
        const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
        let count = Math.floor(n / 7) * 5;
        for (let i = 0; i < n % 7; i++) count += WEEK[i];
        return count;
    };

    // Index de la citation du jour : on avance d'un « pas » premier avec n,
    // ainsi toutes les citations passent avant qu'une même citation revienne
    // (140 citations = 140 jours de classe différents).
    function dayIndex(n) {
        if (n <= 1) return 0;
        let step = Math.max(1, Math.round(n * 0.618));
        while (gcd(step, n) !== 1) step++;
        return (dayNum(new Date()) * step) % n;
    }

    // « Texte — Auteur » (tiret long, demi-long ou court entouré d'espaces)
    function parsePerso(str) {
        return String(str || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
            let t = l, a = '';
            const m = /^(.*\S)\s+[—–-]\s+([^—–]+)$/.exec(l);
            if (m) { t = m[1]; a = m[2].trim(); }
            t = t.replace(/^[«"“]\s*/, '').replace(/\s*[»"”]$/, '');
            return { th: 'perso', t, a, e: '' };
        }).filter(q => q.t);
    }

    /* ── Config ───────────────────────────────────────────────────── */
    function getCfg(root) {
        let cfg;
        try { cfg = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) { cfg = {}; }
        cfg = Object.assign({}, DEFAULT_CFG, cfg);
        cfg.themes = Object.assign({}, DEFAULT_CFG.themes, cfg.themes || {});
        return cfg;
    }

    // Liste des citations proposées selon les réglages
    function pool(cfg) {
        const perso = parsePerso(cfg.perso);
        let list = (cfg.persoOnly && perso.length)
            ? perso
            : CITATIONS.filter(q => cfg.themes[q.th] !== false).concat(perso);
        if (!list.length) list = CITATIONS.slice();
        return list;
    }

    const dayQuote = list => list[dayIndex(list.length)];

    // Citation affichée (gardée dans l'attribut data-cur de .cit-root)
    function current(root, cfg, list) {
        const cur = root.getAttribute('data-cur');
        let q = cur ? list.find(x => x.t === cur) : null;
        if (!q) {
            if (cfg.mode === 'hasard') {
                q = list[Math.floor(Math.random() * list.length)];
                root.setAttribute('data-cur', q.t);
            } else {
                q = dayQuote(list);
                root.removeAttribute('data-cur');
            }
        }
        return q;
    }

    function setCur(root, q) {
        const cfg = getCfg(root);
        const list = pool(cfg);
        if (cfg.mode === 'jour' && (!q || q === dayQuote(list))) root.removeAttribute('data-cur');
        else if (q) root.setAttribute('data-cur', q.t);
        // une nouvelle citation repart avec auteur et explication cachés
        root.removeAttribute('data-show-author');
        root.removeAttribute('data-show-explain');
        renderLight(root);
        if (typeof saveBoard === 'function') saveBoard();
    }

    /* ── Rendu ────────────────────────────────────────────────────── */
    // Empêche le déplacement du widget quand on clique sur un contrôle
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

    function buildBar(root, cfg, list, q) {
        const full = root.classList.contains('cit-full');
        const showToday = cfg.mode === 'jour' && q !== dayQuote(list);
        return '<div class="cit-bar">' +
            '<button type="button" class="cit-gear" data-cit-action="toggle" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
            '<div class="cit-navbox"' + STOP + '>' +
                '<button type="button" class="cit-nav" data-cit-action="prev" title="Citation précédente" aria-label="Citation précédente">‹</button>' +
                '<button type="button" class="cit-nav cit-dice" data-cit-action="random" title="Une citation au hasard" aria-label="Une citation au hasard">🎲</button>' +
                '<button type="button" class="cit-nav" data-cit-action="next" title="Citation suivante" aria-label="Citation suivante">›</button>' +
                '<button type="button" class="cit-nav cit-today' + (showToday ? '' : ' is-hidden') + '" data-cit-action="today" title="Revenir à la citation du jour" aria-label="Revenir à la citation du jour">⟲</button>' +
            '</div>' +
            '<div class="wf-btns"' + STOP + '>' +
                '<button type="button" class="wf-btn wf-btn-min" data-cit-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                '<button type="button" class="wf-btn wf-btn-max" data-cit-action="wf-max" title="' + (full ? 'Quitter le plein écran' : 'Plein écran') + '" aria-label="Plein écran"></button>' +
                '<button type="button" class="wf-btn wf-btn-close" data-cit-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
            '</div>' +
        '</div>';
    }

    function buildSheet(root, cfg, list, q) {
        const th = THEMES[q.th] || THEMES.perso;
        const isDay = cfg.mode === 'jour' && q === dayQuote(list);
        const label = isDay ? 'Citation du jour' : (list.indexOf(q) + 1) + ' / ' + list.length;
        const authorShown = cfg.author || root.hasAttribute('data-show-author');
        const explainShown = root.hasAttribute('data-show-explain');

        let html = '<div class="cit-sheet" style="--ct-c:' + th.c + '">' +
            '<div class="cit-top"><span class="cit-chip"><span aria-hidden="true">' + th.ico + '</span>' + esc(th.nom) + '</span>' +
            '<span class="cit-label">' + label + '</span></div>' +
            '<div class="cit-body"><div class="cit-inner">' +
            '<blockquote class="cit-quote"><span class="cit-g">«&nbsp;</span>' + esc(q.t) + '<span class="cit-g">&nbsp;»</span></blockquote>';

        if (q.a && authorShown) {
            html += '<div class="cit-author">— ' + esc(q.a) + (q.s ? ', <i>' + esc(q.s) + '</i>' : '') + '</div>';
        }

        let btns = '';
        if (q.a && !authorShown) btns += '<button type="button" class="cit-btn" data-cit-action="author"' + STOP + '>👤 Qui a dit ça&nbsp;?</button>';
        if (q.e) btns += '<button type="button" class="cit-btn' + (explainShown ? ' is-on' : '') + '" data-cit-action="explain"' + STOP + '>💡 ' +
            (explainShown ? 'Cacher l’explication' : 'Qu’est-ce que ça veut dire&nbsp;?') + '</button>';
        if (btns) html += '<div class="cit-actions">' + btns + '</div>';

        if (q.e && explainShown) html += '<div class="cit-explain">' + esc(q.e) + '</div>';

        html += '</div></div></div>';
        return html;
    }

    function buildSettings(cfg) {
        let checks = '';
        THEME_KEYS.forEach(k => {
            const n = CITATIONS.filter(q => q.th === k).length;
            checks += '<label class="cit-chk"><input type="checkbox" data-cit-theme="' + k + '"' + (cfg.themes[k] ? ' checked' : '') + '> ' +
                THEMES[k].ico + ' ' + THEMES[k].nom + ' <span class="cit-n">(' + n + ')</span></label>';
        });
        return '<div class="cit-settings"' + STOP + '>' +
            '<div class="cit-set-title">Réglages des citations</div>' +
            '<label class="cit-lbl">Choix de la citation' +
              '<select data-cit-mode>' +
                '<option value="jour"' + (cfg.mode === 'jour' ? ' selected' : '') + '>Citation du jour (change chaque jour)</option>' +
                '<option value="hasard"' + (cfg.mode === 'hasard' ? ' selected' : '') + '>Au hasard (garde la citation tirée)</option>' +
              '</select></label>' +
            '<label class="cit-chk cit-chk-main"><input type="checkbox" data-cit-author' + (cfg.author ? ' checked' : '') + '> Afficher l’auteur directement ' +
              '<span class="cit-n">(sinon : devinette « Qui a dit ça ? »)</span></label>' +
            '<div class="cit-lbl">Thèmes proposés</div>' + checks +
            '<label class="cit-lbl">Mes citations <span class="cit-n">— une par ligne, sous la forme : Texte — Auteur</span>' +
              '<textarea data-cit-perso rows="5" placeholder="Dans notre classe, on a le droit de se tromper. — La maîtresse">' + esc(cfg.perso || '') + '</textarea></label>' +
            '<label class="cit-chk"><input type="checkbox" data-cit-persoonly' + (cfg.persoOnly ? ' checked' : '') + '> N’afficher que mes citations</label>' +
            '<button type="button" class="cit-done" data-cit-action="close">Terminé</button>' +
        '</div>';
    }

    function render(root) {
        const cfg = getCfg(root);
        const list = pool(cfg);
        const q = current(root, cfg, list);
        const open = root.classList.contains('cit-open');
        root.innerHTML = buildBar(root, cfg, list, q) + buildSheet(root, cfg, list, q) + (open ? buildSettings(cfg) : '');
        root.setAttribute('data-day', new Date().toDateString());
        watchSize(root);
        fitSheet(root);
    }

    // Met à jour la barre et la feuille sans toucher au panneau de réglages
    function renderLight(root) {
        const bar = root.querySelector('.cit-bar'), sheet = root.querySelector('.cit-sheet');
        if (!bar || !sheet) { render(root); return; }
        const cfg = getCfg(root);
        const list = pool(cfg);
        const q = current(root, cfg, list);
        bar.outerHTML = buildBar(root, cfg, list, q);
        sheet.outerHTML = buildSheet(root, cfg, list, q);
        fitSheet(root);
    }

    function setCfg(root, cfg, light) {
        root.setAttribute('data-cfg', JSON.stringify(cfg));
        if (light) renderLight(root); else render(root);
        if (typeof saveBoard === 'function') saveBoard();
    }

    /* ── Ajustement automatique : la citation doit tenir sans scroller ──
       On cherche (par dichotomie) le plus grand facteur --ct-k ≤ 1 pour
       lequel le contenu tient. Auteur, boutons et explication se réduisent
       moitié moins vite que la citation (--ct-ka). ─────────────────── */
    const K_MIN = 0.3;
    function fitSheet(root) {
        const body = root.querySelector('.cit-body');
        if (!body || !root.offsetWidth || !root.offsetHeight) return;
        const fits = k => {
            root.style.setProperty('--ct-k', k.toFixed(3));
            root.style.setProperty('--ct-ka', ((1 + k) / 2).toFixed(3));
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
        const full = force !== undefined ? force : !root.classList.contains('cit-full');
        root.classList.toggle('cit-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('cit-is-full', full);
        const b = root.querySelector('[data-cit-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    }

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('cit-full')) toggleFull(root, false);
        root.classList.remove('cit-open');
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden'; // la feuille ne doit pas passer par-dessus la mini-barre
        window._wfMiniBarCollapse(widget, '💬 Citation', {
            onExpand: () => { box.style.visibility = ''; render(root); }
        });
    }

    function closeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget) return;
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    }

    // Changement de jour : en mode « citation du jour », on passe à la nouvelle citation
    function renderAll(onlyIfDayChanged) {
        const today = new Date().toDateString();
        document.querySelectorAll('.cit-root').forEach(r => {
            if (onlyIfDayChanged && r.getAttribute('data-day') === today) return;
            if (onlyIfDayChanged && getCfg(r).mode === 'jour') {
                r.removeAttribute('data-cur');
                r.removeAttribute('data-show-author');
                r.removeAttribute('data-show-explain');
            }
            render(r);
        });
    }

    /* ── Événements (délégués : survivent à la sauvegarde/restauration) ── */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-cit-action]');
        if (!btn) return;
        const root = btn.closest('.cit-root');
        if (!root) return;
        e.stopPropagation();
        const act = btn.getAttribute('data-cit-action');
        const cfg = getCfg(root);
        const list = pool(cfg);
        const q = current(root, cfg, list);
        const i = list.indexOf(q);

        if (act === 'wf-min')   { minimizeWidget(root); return; }
        if (act === 'wf-max')   { toggleFull(root); return; }
        if (act === 'wf-close') { closeWidget(root); return; }
        if (act === 'prev')     { setCur(root, list[(i - 1 + list.length) % list.length]); return; }
        if (act === 'next')     { setCur(root, list[(i + 1) % list.length]); return; }
        if (act === 'today')    { setCur(root, null); return; }
        if (act === 'random') {
            let r = q;
            if (list.length > 1) while (r === q) r = list[Math.floor(Math.random() * list.length)];
            setCur(root, r);
            return;
        }
        if (act === 'author')  { root.setAttribute('data-show-author', ''); renderLight(root); return; }
        if (act === 'explain') { root.toggleAttribute('data-show-explain'); renderLight(root); return; }
        if (act === 'toggle') root.classList.toggle('cit-open');
        if (act === 'close') root.classList.remove('cit-open');
        render(root);
    }, true);

    document.addEventListener('change', function (e) {
        const root = e.target.closest && e.target.closest('.cit-root');
        if (!root) return;
        const t = e.target;
        const cfg = getCfg(root);
        if (t.hasAttribute('data-cit-mode')) {
            cfg.mode = t.value === 'hasard' ? 'hasard' : 'jour';
            root.removeAttribute('data-cur');
        }
        else if (t.hasAttribute('data-cit-theme'))  cfg.themes[t.getAttribute('data-cit-theme')] = t.checked;
        else if (t.hasAttribute('data-cit-author')) { cfg.author = t.checked; root.removeAttribute('data-show-author'); }
        else if (t.hasAttribute('data-cit-perso'))  { cfg.perso = t.value; setCfg(root, cfg, true); return; } // sans reconstruire les réglages
        else if (t.hasAttribute('data-cit-persoonly')) cfg.persoOnly = t.checked;
        else return;
        setCfg(root, cfg);
    });

    // Échap : quitter le plein écran
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.cit-root.cit-full').forEach(r => toggleFull(r, false));
    }, true);

    // Empêche les raccourcis clavier du board pendant la saisie dans les réglages
    document.addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('.cit-settings, .cit-bar')) e.stopPropagation();
    }, true);

    /* ── Redimensionnement libre ──────────────────────────────────
       La poignée du board (.custom-resize-handle) est interceptée pour
       ce widget : largeur et hauteur de la carte suivent la souris,
       et la citation se réajuste toute seule. ─────────────────────── */
    const MIN_W = 260, MIN_H = 180, MAX_W = 3000, MAX_H = 2000;

    function citBox(widget) {
        const root = widget.querySelector('.cit-root');
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
        const box = citBox(widget);
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
        if (!widget || !widget.querySelector('.cit-root')) return;
        if (widget.classList.contains('cit-is-full') || widget.querySelector('.wf-mini-bar')) return;
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
        const roots = node.matches('.cit-root') ? [node] : Array.from(node.querySelectorAll('.cit-root'));
        roots.forEach(r => {
            render(r);
            // Sur téléphone, ouverture directe en plein écran (bouton vert) —
            // seulement pour un widget qui vient d'être lancé depuis un panneau
            const w = r.closest('.widget');
            if (w && !w._citAutoMax) {
                w._citAutoMax = true;
                window._wfPhoneAutoMax(w, () => toggleFull(r), () => r.classList.contains('cit-full'), null, true);
            }
        });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) m.addedNodes.forEach(n => {
            if (n instanceof Element && (n.matches('.widget, .cit-root') || n.querySelector('.cit-root'))) {
                // on ne ré-hydrate pas pour nos propres mises à jour internes
                if (n.closest('.cit-root') && !n.matches('.cit-root')) return;
                hydrate(n);
            }
        });
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-citations')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-citations';
        tpl.innerHTML =
            '<div class="editor-container" style="width:520px;height:340px;">' +
                '<div class="cit-root" data-cfg=\'' + JSON.stringify(DEFAULT_CFG) + '\'></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('cit-styles')) return;
        const st = document.createElement('style');
        st.id = 'cit-styles';
        st.textContent = `
.cit-root{
  --ct-paper:#fbf8f1; --ct-ink:#26221d; --ct-soft:#6f675c; --ct-line:#e6dfd0; --ct-c:#2f6fb5;
  container-type:inline-size; position:relative; width:100%; height:100%;
  box-sizing:border-box; background:var(--ct-paper);
  display:flex; flex-direction:column; overflow:hidden;
  font-family:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;
  color:var(--ct-ink); user-select:none;
}
.cit-bar{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.5cqw;
  padding:1.6cqw 2.2cqw 0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.cit-bar .wf-btns{justify-self:end}
.cit-gear{justify-self:start;border:0;background:none;color:#b3aa9b;font-size:max(14px,3.6cqw);line-height:1;
  cursor:pointer;padding:.8cqw;border-radius:5px}
.cit-gear:hover,.cit-gear:focus-visible{color:var(--ct-ink);outline:1px solid var(--ct-line)}
.cit-navbox{display:flex;align-items:center;gap:.6cqw}
.cit-nav{border:0;background:none;color:var(--ct-soft);cursor:pointer;padding:.3cqw 1.2cqw;
  font-size:max(15px,3.8cqw);line-height:1;border-radius:5px}
.cit-dice{font-size:max(13px,3cqw)}
.cit-today{font-size:max(13px,3.2cqw)}
.cit-nav.is-hidden{visibility:hidden}
.cit-nav:hover{color:var(--ct-ink);background:#f1ece1}
.cit-bar :focus-visible{outline:2px solid var(--ct-c);outline-offset:1px}
.cit-sheet{flex:1;min-height:0;display:flex;flex-direction:column;margin:1.4cqw 2.4cqw 2.4cqw;
  background:#fff;border:1px solid var(--ct-line);border-top:max(4px,.9cqw) solid var(--ct-c);
  border-radius:max(6px,1.4cqw);box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}
.cit-top{flex:none;display:flex;justify-content:space-between;align-items:center;gap:2cqw;flex-wrap:wrap;
  padding:1.6cqw 2.6cqw 0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:max(10px,2.5cqw);color:var(--ct-soft)}
.cit-chip{display:inline-flex;align-items:center;gap:.5em;padding:.25em .8em;border-radius:99px;font-weight:700;
  color:var(--ct-c);background:#f3f0e8;background:color-mix(in srgb,var(--ct-c) 12%,#fff)}
.cit-label{font-style:italic;white-space:nowrap}
.cit-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:1.2cqw 5cqw 2.4cqw}
.cit-inner{margin:auto 0;width:100%}
.cit-quote{margin:0;text-align:center;font-weight:500;line-height:1.28;text-wrap:balance;
  font-size:calc(6.4cqw * var(--ct-k,1))}
.cit-g{color:var(--ct-c);font-weight:700}
.cit-author{margin-top:.7em;text-align:right;color:var(--ct-soft);font-size:calc(3.5cqw * var(--ct-ka,1))}
.cit-author i{color:var(--ct-soft)}
.cit-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:.6em;margin-top:1.2em;
  font-size:calc(2.9cqw * var(--ct-ka,1))}
.cit-btn{font:inherit;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:1em;
  border:1px solid var(--ct-line);background:#faf7f0;color:var(--ct-ink);border-radius:99px;
  padding:.4em 1em;cursor:pointer;line-height:1.2}
.cit-btn:hover{border-color:var(--ct-c);color:var(--ct-c)}
.cit-btn.is-on{background:var(--ct-c);border-color:var(--ct-c);color:#fff}
.cit-btn:focus-visible{outline:2px solid var(--ct-c);outline-offset:1px}
.cit-explain{margin-top:.9em;padding:.7em 1em;border-left:4px solid var(--ct-c);border-radius:0 8px 8px 0;
  background:#f6f2e8;background:color-mix(in srgb,var(--ct-c) 8%,#fff);
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.45;text-align:left;
  font-size:calc(3.3cqw * var(--ct-ka,1))}
.cit-settings{position:absolute;inset:0;z-index:4;background:#fff;padding:3cqw 4cqw;overflow-y:auto;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:max(12px,2.8cqw);color:#222;user-select:auto}
.cit-set-title{font-weight:700;font-size:1.15em;margin-bottom:2cqw}
.cit-lbl{display:block;font-weight:600;margin:2.4cqw 0 1cqw}
.cit-n{font-weight:400;color:#888;font-size:.92em}
.cit-settings select,.cit-settings textarea{display:block;width:100%;box-sizing:border-box;margin-top:1cqw;
  padding:5px 6px;font:inherit;font-weight:400;border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.cit-settings textarea{resize:vertical;min-height:5em}
.cit-chk{display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer}
.cit-chk-main{margin-top:2cqw}
.cit-done{margin-top:3cqw;width:100%;padding:7px;border:0;border-radius:4px;background:var(--ct-ink);color:#fff;
  font:inherit;font-weight:600;cursor:pointer}
.cit-settings :focus-visible{outline:2px solid var(--ct-c);outline-offset:1px}
/* Plein écran : la carte occupe tout l'écran */
.cit-root.cit-full{position:fixed;z-index:9999;inset:0;width:auto;height:auto}
/* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux (comme le Taquin) */
@media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
  .cit-root.cit-full{left:40px;height:100vh;height:100dvh}
}
.widget.cit-is-full > .drag-handle,
.widget.cit-is-full > .widget-rotate-handle,
.widget.cit-is-full > .widget-action-bar,
.widget.cit-is-full > .widget-ctx-menu,
.widget.cit-is-full > .custom-resize-handle{display:none !important}
@media print{.cit-bar,.cit-settings,.cit-actions{display:none}}
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
            document.fonts.ready.then(() => document.querySelectorAll('.cit-root').forEach(fitSheet));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Accès public (tests / autres scripts)
    window.renderCitations = () => renderAll(false);
    window.CITATIONS_ELEVES = CITATIONS;

    // Sauvegarde / chargement (utilisés par save-load.js)
    // On sauvegarde les réglages, et la citation affichée en mode « au hasard ».
    // En mode « citation du jour », le widget revient à la citation du jour au rechargement.
    window.citGetData = function (widget) {
        const root = widget && widget.querySelector('.cit-root');
        if (!root) return null;
        const cfg = getCfg(root);
        return { cfg, cur: cfg.mode === 'hasard' ? (root.getAttribute('data-cur') || null) : null };
    };
    window.citSetData = function (widget, data) {
        const root = widget && widget.querySelector('.cit-root');
        if (!root || !data || !data.cfg) return;
        root.setAttribute('data-cfg', JSON.stringify(data.cfg));
        if (data.cur) root.setAttribute('data-cur', data.cur);
        else root.removeAttribute('data-cur');
        render(root);
    };
})();
