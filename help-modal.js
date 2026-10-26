// =========================================================================
// MODALE D'AIDE — Le Bureau du Prof
// Vue d'ensemble de toutes les fonctionnalités (sans entrer dans le détail :
// chaque jeu, activité ou outil possède son propre bouton d'aide ❓).
// =========================================================================

(function () {

  // ── Petits générateurs de contenu ─────────────────────────────────────
  const card = (name, desc) =>
    `<div class="hm-card"><div class="hm-card-n">${name}</div>${desc ? `<div class="hm-card-d">${desc}</div>` : ''}</div>`;

  const group = (label, items) =>
    `<div class="hm-group">${label}</div><div class="hm-grid">${items.map(i => card(i[0], i[1])).join('')}</div>`;

  const table = (head, rows) =>
    `<table class="hm-table"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` +
    rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="hm-strong"' : ''}>${c}</td>`).join('')}</tr>`).join('') +
    `</table>`;

  const tip  = (txt) => `<div class="hm-tip">💡 ${txt}</div>`;
  const warn = (txt) => `<div class="hm-tip hm-warn">⚠️ ${txt}</div>`;
  const h2   = (txt) => `<div class="hm-h2">${txt}</div>`;
  const h3   = (txt) => `<div class="hm-h3">${txt}</div>`;
  const p    = (txt) => `<p class="hm-p">${txt}</p>`;
  const section = (id, title, body, visible) =>
    `<div id="${id}" class="help-section"${visible ? ' style="display:block;"' : ''}>${h2(title)}${body}</div>`;

  const nav = (id, label, active) =>
    `<div class="help-nav${active ? ' help-nav-active' : ''}" data-s="${id}" onclick="helpShow(this)">${label}</div>`;
  const navTitle = (txt) => `<div class="hm-nav-title">${txt}</div>`;
  const navSep = `<div class="hm-nav-sep"></div>`;

  // ── Sections ──────────────────────────────────────────────────────────
  const S = [];

  // INTRODUCTION
  S.push(section('h-intro', '🏠 Bienvenue sur Le Bureau du Prof',
    `<img src="pics/logo-le-bureau-du-prof4.jpg" alt="" class="hm-logo" onerror="this.style.display='none'">` +
    p(`Le Bureau du Prof est un <strong>tableau blanc numérique interactif</strong> conçu pour les enseignants, idéal sur <strong>TBI</strong> ou <strong>VPI</strong>.`) +
    p(`Vous pouvez y poser librement des <strong>jeux</strong>, des <strong>leçons et entraînements</strong>, des <strong>activités</strong> de classe, des <strong>outils</strong> de gestion (tirage au sort, minuteur, sonomètre…), des <strong>widgets</strong> (date, météo, devoirs, PDF, YouTube…), des stickers et des images. Vous pouvez aussi <strong>dessiner</strong>, <strong>écrire</strong>, <strong>annoter des PDF</strong>, changer le <strong>fond</strong> du tableau, et tout <strong>sauvegarder</strong>.`) +
    p(`Le tableau respecte un <strong>format 16:9</strong> et s'adapte à la taille de votre écran ou vidéoprojecteur.`) +
    `<p class="hm-p" style="font-size:14px;line-height:1.8;text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid #e5e8ee;">Le Bureau du Prof est un outil <strong>libre</strong> et <strong>gratuit</strong>. </p>
	<p class="hm-p" style="font-size:12px;line-height:1.8;text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid #e5e8ee;">🤓 créé et géré par Nicolas Bernardet - prof d'école à Chambéry (Savoie) 🤓</p>`,
    true));

  // EXPLORER
  S.push(section('h-explorer', '🗺️ Explorer le bureau',
    p(`Tout part des <strong>onglets</strong> alignés sur le bord gauche de l'écran. Un clic ouvre le panneau correspondant ; un nouveau clic, un clic sur le tableau ou <kbd>Échap</kbd> le referme.`) +
    table(['Onglet', 'Contenu', 'Raccourci'], [
      ['🎮 Jeux',      '<em>Côté élève</em> : battles et jeux de maths, de français et divers', '<kbd>Alt+1</kbd>'],
      ['📘 Leçons',    '<em>Côté élève</em> : leçons et entraînements (maths, français, histoire, EMC, géographie, sciences)', '<kbd>Alt+2</kbd>'],
      ['🎲 Activités', '<em>Côté prof</em> : rituels à projeter, manipulations au tableau, arts et musique', '<kbd>Alt+3</kbd>'],
      ['🧰 Outils',    'Gestion de la classe, gestion du bruit, outils divers', '<kbd>Alt+4</kbd>'],
      ['📦 Widgets',   'Médias, temps & météo, organisation', '<kbd>Alt+5</kbd>'],
      ['🖼️ Visuels',   'Stickers animés, émojis classiques et images', '<kbd>Alt+6</kbd>'],
      ['📁 Tableaux',  'Vos tableaux, sauvegarde et import/export', '<kbd>Alt+7</kbd>'],
      ['🖥️ Écran',     'Annuler, thème, laser, A4, capture, fonds d\'écran', '<kbd>Alt+8</kbd>'],
      ['📽️ Présenter', 'Active / désactive le mode présentation', '<kbd>Alt+9</kbd>'],
    ]) +
    p(`Les onglets sont rangés en trois familles, chacune annoncée par un petit titre : <strong>Élèves</strong> (Jeux, Leçons), <strong>Prof</strong> (Activités, Outils, Widgets, Visuels) et <strong>Gestion</strong> (Tableaux, Écran, Présenter).`) +
    h3('✏️ Le bouton Dessiner') +
    p(`En bas à droite, le bouton <strong>Dessiner</strong> (<kbd>Alt+0</kbd>) ouvre la barre de dessin et de figures.`) +
    h3('🖱️ Le menu rapide') +
    p(`<strong>Clic droit</strong> (ou <strong>appui long</strong> au doigt ou au stylet) sur une zone vide du tableau : un mini-menu propose <em>Coller, PDF, Écriture Seyes, Texte, Devoirs à noter, Planning du jour, Minuteur / Chrono</em> et <em>Défi calme</em>.`) +
    h3('📥 Glisser-déposer') +
    p(`Glissez un <strong>fichier PDF</strong> ou une ou plusieurs <strong>images</strong> depuis votre ordinateur directement sur le tableau : ils s'ouvrent aussitôt.`) +
    tip(`Avec la souris, survolez une vignette dans les panneaux Jeux, Leçons et Activités pour voir sa description.`)
  ));

  // JEUX
  S.push(section('h-jeux', '🎮 Jeux',
    p(`Des jeux à utiliser en classe ou à la maison. Chacun s'ouvre comme une fenêtre sur le tableau et possède sa propre aide ❓.`) +
    group('⚔️ Battles (solo ou duel)', [
      ['Battle comparaison', 'Comparer des nombres'],
      ['Battle de calculs', 'Calcul mental'],
      ['Battle décomposition', 'Décomposer les nombres'],
      ['Battle droite graduée', 'Repérer un nombre'],
      ['Battle nombres en lettres', 'Lire et écrire les nombres'],
      ['Battle arrondis / encadrements', 'Arrondir ou encadrer'],
      ['Battle nature des mots', 'Trouver la nature d\'un mot'],
      ['Battle fonctions', 'Trouver la fonction du groupe'],
      ['Battle synonymes / contraires', 'Synonyme ou contraire'],
      ['Battle homophones', 'Choisir le bon homophone'],
      ['Battle orthographe', 'Trouver la bonne orthographe'],
      ['Battle temps des verbes', 'Trouver le temps du verbe'],
    ]) +
    group('🔢 Jeux de maths', [
      ['Multi-ball', 'Tables de multiplication'],
      ['Multi Invaders', 'Détruire le bon vaisseau'],
      ['Multi Pac-Man', 'Aller vers le bon résultat'],
      ['Serpent des tables', 'Guider le serpent'],
      ['Multi Taupes', 'Taper la bonne taupe'],
      ['Multi-Run', 'Sauter sur la bonne plateforme'],
      ['Le Jeu des Nombres', 'Chiffres et lettres'],
      ['La caisse du marchand', 'Rendre la monnaie'],
      ['Tour de calcul', 'Guider les calculs'],
      ['MathMaster', 'Calcul mental chronométré'],
    ]) +
    group('📖 Jeux de français', [
      ['Le train de l\'alphabet', 'Ordre alphabétique'],
      ['Jeu de conjugaison', 'Classer selon le temps'],
      ['Nature-Mots Pac-Man', 'Nature des mots'],
      ['Le mot le plus long', 'Former un long mot'],
      ['La chasse aux homophones', 'Tirer sur le bon homophone'],
      ['Le pendu', 'Deviner le mot mystère'],
      ['Singulier / pluriel express', 'Accords dans le groupe nominal'],
      ['Phrase en désordre', 'Remettre les mots dans l\'ordre'],
      ['Chasse aux mots', 'Surligner selon la nature'],
      ['Mots mêlés', 'Retrouver les mots cachés'],
      ['Le sujet commande', 'Accord sujet-verbe'],
      ['Le tir aux fonctions', 'Fonctions grammaticales'],
      ['Le tir aux natures', 'Natures grammaticales'],
      ['Le correcteur fou', 'Trouver les 5 fautes'],
    ]) +
    group('🧩 Jeux divers', [
      ['Memory', 'Retrouver les paires'],
      ['Sudoku', 'Compléter la grille'],
      ['Tangram', 'Reproduire une figure'],
      ['Simon', 'Mémoriser une suite'],
      ['Rush Hour', 'Libérer la voiture rouge'],
      ['Taquin', 'Remettre les pièces en ordre'],
      ['Reproduction sur quadrillage', 'Reproduire un modèle'],
      ['Pixel art', 'Dessiner case par case'],
      ['Labyrinthe', 'Trouver la sortie'],
      ['Jeu des 7 différences', 'Comparer deux images'],
    ])
  ));

  // LEÇONS ET ENTRAÎNEMENTS
  S.push(section('h-lecons', '📘 Leçons et entraînements',
    p(`Des modules pensés <strong>pour les élèves</strong> : une partie <strong>leçon</strong> pour comprendre, puis des <strong>exercices corrigés</strong> pour s'entraîner. Ils peuvent être suivis seul, en petit groupe ou collectivement au tableau. Chaque module a son propre bouton d'aide ❓.`) +
    group('🔢 Mathématiques', [
      ['Les tables de multiplication', 'Astuces, table de Pythagore, exercices'],
      ['Opérations posées', 'Les 4 opérations, avec les retenues'],
      ['Les grands nombres', 'Lire, écrire, décomposer'],
      ['Tableau de numération', 'Manipuler les nombres'],
      ['Comprendre les fractions', 'Parcours pas à pas'],
    ]) +
    group('📖 Français', [
      ['La phrase', 'Types, formes, phrase simple ou complexe'],
      ['Les fonctions dans la phrase', 'Sujet, COD, COI, compléments…'],
      ['La nature des mots', 'Déterminant, nom, adjectif, verbe…'],
      ['La chaîne d\'accords', 'Accords dans le groupe nominal'],
      ['Les homophones', 'a/à, et/est, son/sont…'],
      ['La conjugaison', '5 temps de l\'indicatif'],
      ['Ordre alphabétique', 'Ranger, chercher dans le dictionnaire'],
      ['Familles de mots', 'Radical, préfixes, suffixes'],
    ]) +
    group('🌍 Histoire, EMC, géographie, sciences', [
      ['La frise historique', 'Les 5 grandes périodes'],
      ['Les rois de France', 'Frise et arbre généalogique'],
      ['Le château fort', 'Extérieur et intérieur'],
      ['La société médiévale', 'Clergé, noblesse, peuple'],
      ['Découvertes et Renaissance', 'Explorateurs, imprimerie…'],
      ['La Révolution française', '1789 – 1799'],
      ['L\'âge industriel', 'Machine à vapeur, usines, villes'],
      ['Symboles de la République', 'Drapeau, devise, Marianne…'],
      ['Le globe terrestre', 'La Terre en 3D'],
      ['Carte du monde', 'Planisphère interactif'],
      ['Carte de l\'Europe', 'Pays, capitales, UE'],
      ['Carte de la France', 'Villes, fleuves, montagnes'],
      ['Carte de la Savoie', 'Massifs, vallées, lacs'],
      ['Le relief de montagne', 'Une montagne en 3D'],
      ['Latitude et longitude', 'Coordonnées géographiques'],
      ['Pays riches, pays pauvres', 'Les richesses dans le monde'],
      ['La Terre en mouvement', 'Jour, nuit, saisons'],
      ['Le système solaire', 'Planètes et tailles'],
      ['Le cycle de l\'eau', 'États de l\'eau'],
      ['Volcans et séismes', 'Éruptions, failles, ondes'],
      ['Les circuits électriques', 'Série, dérivation, défis'],
      ['Le corps humain', 'Squelette, organes, fonctions'],
      ['Les 5 sens', 'De l\'organe au cerveau'],
    ])
  ));

  // ACTIVITÉS
  S.push(section('h-activites', '🎲 Activités en classe',
    p(`Des supports <strong>pour le prof</strong>, à projeter ou à manipuler au tableau avec toute la classe. Chaque activité a son propre bouton d'aide ❓.`) +
    group('⚡ Rituels et projection', [
      ['Calcul mental', 'S\'entraîner'],
      ['Calcul flash', 'Calculs qui défilent'],
      ['Le compte est bon', 'Atteindre une cible'],
      ['Loto des multiplications', 'Mémoriser les tables'],
      ['Nombres en chiffres / lettres', 'Écrire un nombre'],
      ['Monnaie', 'Pièces et billets'],
      ['Heures et durées', 'Lire l\'heure, calculer'],
      ['Conversion', 'Unités de mesure'],
      ['Droite numérique', 'Placer des nombres'],
      ['Le mot le plus long', 'Avec 9 lettres tirées au sort'],
    ]) +
    group('🧮 Manipuler pour comprendre', [
      ['Tableau de numération', 'Manipuler les nombres'],

      ['Horloge interactive', 'Régler les aiguilles'],

      ['Fractions', 'Figures partageables'],
      ['Solides 3D', 'Manipuler en 3D'],
      ['Tracés géométriques', 'Règle, équerre, compas'],
    ]) +
    group('🛠️ Générer des activités', [
      ['Reproduction quadrillage', 'Créer un modèle à reproduire'],
      ['Symétrie axiale', 'Créer une figure et son axe'],
      ['Pixel Art', 'Créer une grille à colorier'],
      ['Mots mêlés', 'Générer une grille'],
    ]) +
    group('🎨 Arts et musique', [
      ['Mélange de couleurs', 'Couleurs primaires'],
      ['Clavier de piano', '3 octaves'],
    ]) +
    tip(`« Le mot le plus long » et « Mots mêlés » existent aussi dans l'onglet Jeux, dans une version à jouer par les élèves.`)
  ));

  // OUTILS
  S.push(section('h-outils', '🧰 Outils',
    p(`Des outils pratiques pour gérer la classe au quotidien.`) +
    group('🚸 Gestion de la classe', [
      ['Liste de classe', 'Saisir les prénoms'],
      ['Liste — Édition', 'Listes d\'élèves en PDF'],
      ['Tirage au sort', 'Tirer un prénom'],
      ['Équipes équilibrées', 'Former des équipes'],
      ['Minuteur & Chrono', 'Gérer le temps'],
      ['Sondage', 'Vote express'],
      ['Plan de la classe', 'Placer les élèves'],
      ['Emploi du temps', 'Organiser la semaine'],
    ]) +
    group('📢 Gestion du bruit', [
      ['Défi Calme Photo', 'Le silence révèle une image'],
      ['Défi Calme Dessin', 'Le silence fait apparaître un dessin'],
      ['Radar de bruit', 'Bruit en temps réel'],
      ['Sonomètre', 'Niveau sonore'],
      ['Les couleurs du bruit', 'L\'écran change de couleur'],
      ['Pause Calme', 'Respiration guidée'],
    ]) +
    group('🪛 Outils divers', [
      ['Écriture Seyes', 'Taper sur un lignage Seyes'],
      ['Cache-écran / Spot', 'Dévoiler ou éclairer une zone'],
      ['Loupe', 'Agrandir une zone'],
      ['Lancer un dé', 'De 2 à 30 faces'],
      ['Calculatrice', 'En grand, avec historique'],
      ['Visualiseur', 'Caméra USB / webcam'],
      ['Structure École', 'Répartition en classes'],
      ['Page de garde', 'Page de cahier illustrée'],
      ['OutilsProfs', 'Outils en ligne outilsprofs.fr'],
    ]) +
    warn(`Les outils de gestion du bruit et le visualiseur demandent l'autorisation d'accès au microphone ou à la caméra dans le navigateur.`)
  ));

  // WIDGETS
  S.push(section('h-widgets', '📦 Widgets',
    p(`Des fenêtres d'information ou de contenu, déplaçables, redimensionnables et pivotables.`) +
    group('📺 Médias & info', [
      ['PDF', 'Afficher et annoter un document'],
      ['Fenêtre Web', 'Intégrer un site'],
      ['YouTube', 'Vidéo ou audio seul, bibliothèque de favoris'],
      ['Carte', 'Google Maps, avec fond d\'écran possible'],
    ]) +
    group('🕒 Temps & météo', [
      ['Date du jour', ''],
      ['Heure actuelle', ''],
      ['Calendrier', 'Annotable'],
      ['Météo locale', ''],
      ['Éphéméride', 'Fête, soleil, lune, saison'],
    ]) +
    group('📋 Organisation & annotation', [
      ['Texte', 'Zone de texte libre'],
      ['Devoirs à noter', ''],
      ['Planning de la journée', 'Lignes éditables et réordonnables'],
    ]) +
    tip(`Les widgets PDF, Web, YouTube et Carte ont un bouton <strong>⛶</strong> pour le plein écran du navigateur.`)
  ));

  // VISUELS
  S.push(section('h-visuels', '🖼️ Visuels',
    p(`L'onglet <strong>Visuels</strong> regroupe trois modes, choisis en haut du panneau :`) +
    table(['Mode', 'Description'], [
      ['🌐 Stickers animés', 'Émojis animés classés par catégories. Nécessite internet.'],
      ['📴 Stickers classiques', 'Émojis fixes, disponibles hors-ligne.'],
      ['🖼️ Images', 'Bibliothèque d\'images à poser sur le tableau.'],
    ]) +
    p(`Un champ de <strong>recherche</strong> filtre les émojis dans toutes les catégories. Vous pouvez aussi <strong>coller</strong> une image (<kbd>Ctrl+V</kbd>) ou la <strong>glisser-déposer</strong> sur le tableau.`) +
    tip(`Sans connexion, le panneau passe en mode classique (badge HORS-LIGNE).`)
  ));

  // CONTRÔLES DES WIDGETS
  S.push(section('h-controles', '🎛️ Manipuler les éléments',
    p(`Cliquez sur un élément pour le sélectionner. Maj+clic ou un lasso permettent d'en sélectionner plusieurs.`) +
    table(['Contrôle', 'Action'], [
      ['✥ Déplacer', 'Glisser pour déplacer'],
      ['↻ Pivoter', 'Rotation avec magnétisme ; double-clic sur l\'indicateur pour revenir à 0°'],
      ['↘ Redimensionner', 'Agrandir / réduire'],
      ['🔓 Proportions', 'Verrouiller les proportions (ou maintenir Maj)'],
      ['↔ ↕ Symétries', 'Retourner horizontalement ou verticalement'],
      ['☰ Menu', 'Options : dupliquer, fond, opacité…'],
      ['📋 Copier', '<kbd>Ctrl+C</kbd>, puis <kbd>Ctrl+V</kbd> pour coller'],
      ['📌 Épingler', 'Garder au premier plan'],
      ['🔽 Arrière-plan', 'Envoyer derrière les autres'],
      ['⊞ Grouper / ⛓️ Dissocier', 'Lier plusieurs éléments (<kbd>Ctrl+G</kbd> / <kbd>Ctrl+Maj+G</kbd>)'],
      ['🖼️ Fusionner', 'Aplatir la sélection en une image (irréversible)'],
      ['× Supprimer', 'Retirer l\'élément'],
    ]) +
    h3('Boutons de fenêtre') +
    p(`Les jeux, activités et widgets de contenu ont trois pastilles : <span class="hm-dot" style="background:#f0c040"></span> <strong>réduire</strong> en mini-barre, <span class="hm-dot" style="background:#3aaa5c"></span> <strong>plein écran</strong> sur le tableau, <span class="hm-dot" style="background:#ff5f56"></span> <strong>fermer</strong>.`) +
    tip(`Une image peut être <strong>ancrée</strong> ⚓ pour écrire par-dessus sans la déplacer.`)
  ));

  // TEXTE
  S.push(section('h-texte', '🖊️ Texte & mise en forme',
    p(`Créez un texte depuis le panneau Widgets, le menu rapide ou le bouton <strong>T</strong> de la barre de dessin. En édition, une <strong>barre de mise en forme</strong> apparaît (déplaçable par sa poignée).`) +
    table(['Contrôle', 'Action'], [
      ['G / I / S', 'Gras, italique, souligné'],
      ['Alignement', 'Gauche, centré, droite'],
      ['Police', 'Polices scolaires : MDI école, Belle Allure, Marelle, OpenDyslexic, Andika…'],
      ['Taille & interligne', 'Boutons − / +'],
      ['Couleurs', 'Couleur du texte, surlignage, fond du widget'],
      ['Opacité du fond', 'Curseur et bouton transparent'],
      ['✨ Animation', 'Rebond, vague, clignotement, arc-en-ciel, feu, pluie, machine à écrire…'],
    ]) +
    tip(`Sélectionnez une partie du texte pour ne modifier que celle-ci.`)
  ));

  // DESSIN
  S.push(section('h-dessin', '✏️ Dessin & figures',
    p(`Le bouton <strong>Dessiner</strong> (<kbd>Alt+0</kbd>) ouvre une barre flottante, déplaçable par sa poignée. Un petit indicateur sous la barre précise si vous dessinez sur le <strong>Board</strong> ou en <strong>Annotation PDF</strong>.`) +
    table(['Outil', 'Rôle'], [
      ['✏️ Crayon', 'Tracé libre (souris, doigt, stylet)'],
      ['🖍️ Surligneur', 'Trait large semi-transparent'],
      ['Crayon de couleur', 'Trait doux et texturé pour colorier'],
      ['🪣 Pot de peinture', 'Colorier une zone fermée'],
      ['T Texte', 'Ajouter un texte, avec sa taille'],
      ['🧽 Gomme', 'Effacer, taille réglable ; clic droit / bouton du stylet pour basculer'],
      ['Couleur & épaisseur', 'Sélecteur complet + 12 couleurs rapides, épaisseur − / +'],
      ['Figures', 'Cercle, carré, triangles, polygones, cœur, étoile, flèches, segment… avec fond et opacité'],
      ['📐 Instruments', 'Règle, équerre et compas posables sur le tableau'],
      ['↖ Sélection', 'Revenir à la sélection sans fermer la barre'],
      ['↩ ↪ 🗑️', 'Annuler, refaire, effacer tout'],
      ['⚙️ Options', 'Lissage, opacité, reconnaissance des formes, style de curseur'],
    ])
  ));

  // PDF
  S.push(section('h-pdf', '📄 PDF',
    p(`Ouvrez un PDF depuis le widget <strong>PDF</strong>, le menu rapide ou par <strong>glisser-déposer</strong> sur le tableau.`) +
    table(['Fonction', 'Description'], [
      ['Navigation', 'Pages précédente / suivante, saisie ou liste des pages'],
      ['Zoom', 'Zoom − / +, adapter à la largeur, page entière'],
      ['✏️ Annoter', 'Ouvre la barre de dessin en mode annotation PDF'],
      ['🤚 Déplacer', 'Faire défiler le PDF sans dessiner'],
      ['💾 Exporter', 'Télécharger le PDF avec ses annotations'],
      ['🖼️ Fond d\'écran', 'Utiliser la page affichée comme fond du tableau'],
    ]) +
    tip(`En mode annotation, les outils et l'annulation n'agissent que sur le PDF. Les annotations sont sauvegardées avec le tableau.`)
  ));

  // TABLEAUX & SAUVEGARDE
  S.push(section('h-tableaux', '📁 Tableaux & sauvegarde',
    p(`L'onglet <strong>Tableaux</strong> liste tous vos tableaux enregistrés dans le navigateur. Cliquez sur l'un d'eux pour l'ouvrir.`) +
    table(['Action', 'Description'], [
      ['＋ Nouveau tableau', 'Créer un tableau vierge'],
      ['📝 Brouillon', 'Un tableau non enregistré ; un point jaune sur l\'onglet le signale, bouton 💾 Enregistrer pour le garder'],
      ['💾 Sauvegarder un tableau', 'Télécharger le tableau courant (.json)'],
      ['📂 Charger un tableau', 'Ouvrir un fichier .json'],
      ['📤 Exporter tous les tableaux', 'Sauvegarde complète en un fichier'],
      ['📥 Importer tous les tableaux', 'Restaurer une sauvegarde complète'],
    ]) +
    p(`Le travail est <strong>sauvegardé automatiquement</strong> dans le navigateur à chaque modification.`) +
    tip(`Exportez régulièrement tous vos tableaux : c'est votre sécurité en cas de changement d'ordinateur ou de navigateur, ou de vidage du cache.`) +
    warn(`Un brouillon non enregistré est perdu si vous ouvrez un autre tableau.`)
  ));

  // ÉCRAN
  S.push(section('h-ecran', '🖥️ Écran',
    p(`L'onglet <strong>Écran</strong> rassemble les réglages d'affichage.`) +
    table(['Rubrique', 'Contenu'], [
      ['↩️ Actions', 'Annuler (<kbd>Ctrl+Z</kbd>), Refaire (<kbd>Ctrl+Y</kbd>), Effacer le tableau, Aide'],
      ['🎨 Thème', 'Menus en mode clair ou sombre'],
      ['🔴 Laser', 'Pointeur rouge bien visible au vidéoprojecteur (<kbd>Échap</kbd> pour l\'arrêter)'],
      ['📄 A4 Portrait', 'Tableau au format d\'une page A4'],
      ['📸 Capture', 'Enregistrer le tableau en JPG, PNG ou PDF'],
      ['🎨 Fond d\'écran', 'Couleurs unies ou personnalisées, réglures (Séyès, lignes, carreaux, ardoise, papier pointé), fonds pratiques (tableaux de numération et de conversion, proportionnalité, Pythagore), images, ou import de votre propre image'],
    ])
  ));

  // PRÉSENTATION
  S.push(section('h-presentation', '📽️ Mode présentation',
    p(`L'onglet <strong>Présenter</strong> (<kbd>Alt+9</kbd>) masque l'interface pour ne laisser que le contenu du tableau, face aux élèves. Son interrupteur indique s'il est actif. Recliquez dessus ou appuyez sur <kbd>Échap</kbd> pour en sortir.`) +
    tip(`Les widgets épinglés 📌 restent visibles et utilisables.`)
  ));

  // TÉLÉPHONE
  S.push(section('h-mobile', '📱 Tablette & téléphone',
    p(`Le Bureau du Prof fonctionne au doigt et au stylet : <strong>appui long</strong> sur le tableau pour le menu rapide, gestes adaptés pour les boutons.`) +
    p(`Sur <strong>téléphone</strong>, les jeux, leçons, activités et outils ouverts depuis un panneau s'affichent en <strong>plein écran</strong> ; le bouton <strong>⤡</strong> permet d'en sortir.`)
  ));

  // RACCOURCIS
  S.push(section('h-raccourcis', '⌨️ Raccourcis clavier',
    table(['Raccourci', 'Action'], [
      ['<kbd>Alt+1</kbd> … <kbd>Alt+9</kbd>', 'Ouvrir / fermer les onglets (Jeux → Présenter)'],
      ['<kbd>Alt+0</kbd>', 'Ouvrir / fermer la barre de dessin'],
      ['<kbd>Échap</kbd>', 'Fermer les panneaux, quitter le mode présentation ou le laser'],
      ['<kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>', 'Annuler / refaire'],
      ['<kbd>Ctrl+C</kbd> / <kbd>Ctrl+V</kbd>', 'Copier / coller des éléments ou une image'],
      ['<kbd>Ctrl+G</kbd> / <kbd>Ctrl+Maj+G</kbd>', 'Grouper / dissocier'],
      ['Clic droit sur le tableau', 'Menu rapide'],
    ])
  ));

  // ── Structure de la modale ────────────────────────────────────────────
  const html = `
<div id="help-modal-overlay">
<div id="help-modal-box">

  <div id="help-modal-header">
    <div>
      <div style="font-size:1.4em;font-weight:800;">📋 Aide — Le Bureau du Prof</div>
      <div style="font-size:0.85em;opacity:0.85;margin-top:4px;">Choisissez une rubrique dans le menu de gauche. Chaque jeu, activité ou outil a aussi sa propre aide ❓.</div>
    </div>
    <button onclick="closeHelpModal()" id="help-modal-close" title="Fermer">×</button>
  </div>

  <div id="help-modal-body">
    <nav id="help-sidebar">
      ${navTitle('Prise en main')}
      ${nav('h-intro', '🏠 Introduction', true)}
      ${nav('h-explorer', '🗺️ Explorer le bureau')}
      ${nav('h-raccourcis', '⌨️ Raccourcis clavier')}
      ${navSep}
      ${navTitle('Contenus')}
      ${nav('h-jeux', '🎮 Jeux')}
      ${nav('h-lecons', '📘 Leçons et entraînements')}
      ${nav('h-activites', '🎲 Activités')}
      ${nav('h-outils', '🧰 Outils')}
      ${nav('h-widgets', '📦 Widgets')}
      ${nav('h-visuels', '🖼️ Visuels')}
      ${navSep}
      ${navTitle('Sur le tableau')}
      ${nav('h-controles', '🎛️ Manipuler les éléments')}
      ${nav('h-texte', '🖊️ Texte & mise en forme')}
      ${nav('h-dessin', '✏️ Dessin & figures')}
      ${nav('h-pdf', '📄 PDF')}
      ${navSep}
      ${navTitle('Système')}
      ${nav('h-tableaux', '📁 Tableaux & sauvegarde')}
      ${nav('h-ecran', '🖥️ Écran')}
      ${nav('h-presentation', '📽️ Mode présentation')}
      ${nav('h-mobile', '📱 Tablette & téléphone')}
    </nav>

    <div id="help-content">
      ${S.join('\n')}
    </div>
  </div>

</div>
</div>`;

  // ── CSS ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Nunito';
      src: url('polices/Nunito-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    #help-modal-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.72);
      z-index: 20010; justify-content: center; align-items: center; padding: 20px;
    }
    #help-modal-overlay * { font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif !important; box-sizing: border-box; }
    #help-modal-box {
      background: #fff; border-radius: 18px; width: 100%; max-width: 920px; max-height: 92vh;
      display: flex; flex-direction: column; box-shadow: 0 24px 80px rgba(0,0,0,0.5); overflow: hidden;
    }
    #help-modal-header {
      background: linear-gradient(135deg,#2B7FFF 0%,#8E51FF 100%); color: white; padding: 22px 28px;
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-shrink: 0;
    }
    #help-modal-close {
      background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 36px; height: 36px;
      color: white; font-size: 20px; cursor: pointer; flex-shrink: 0;
    }
    #help-modal-body { display: flex; flex: 1; overflow: hidden; }
    #help-sidebar {
      width: 230px; flex-shrink: 0; background: #f4f6f9; border-right: 1px solid #e5e8ee;
      overflow-y: auto; padding: 14px 0;
    }
    #help-content { flex: 1; overflow-y: auto; padding: 28px 32px; }
    .hm-nav-title { padding: 4px 16px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #999; }
    .hm-nav-sep { height: 1px; background: #e0e4ea; margin: 8px 18px; }
    .help-nav {
      display: flex; align-items: center; gap: 8px; padding: 9px 18px; cursor: pointer; font-size: 13px;
      color: #444; font-weight: 500; border-left: 3px solid transparent; transition: all 0.15s; user-select: none;
    }
    .help-nav:hover { background: #e8edf5; color: #2B7FFF; }
    .help-nav.help-nav-active { border-left-color: #2B7FFF; background: #e8edf5; color: #2B7FFF; font-weight: 700; }
    .help-section { display: none; }
    .hm-h2 { font-size: 1.2em; font-weight: 800; color: #1a1a2e; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e5e8ee; }
    .hm-h3 { font-size: 0.97em; font-weight: 700; color: #2B7FFF; margin: 16px 0 6px; }
    .hm-p { font-size: 13.5px; color: #444; line-height: 1.65; margin: 0 0 12px; }
    .hm-logo { display: block; max-width: 220px; max-height: 180px; width: auto; height: auto; margin: 0 auto 18px; border-radius: 12px; }
    .hm-img {width: 80%; border-radius: 10px; box-shadow: 0 4px 18px rgba(0,0,0,0.13); display: block; margin: 6px auto 0; }
    .hm-group { font-size: 0.85em; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 8px; }
    .hm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 7px; margin-bottom: 8px; }
    .hm-card { background: #f8f9fb; border: 1px solid #e5e8ee; border-radius: 8px; padding: 8px 11px; }
    .hm-card-n { font-weight: 700; font-size: 12.5px; color: #222; }
    .hm-card-d { font-size: 11.5px; color: #666; margin-top: 2px; }
    .hm-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 14px; }
    .hm-table th { background: #f0f3f9; text-align: left; padding: 7px 12px; font-weight: 700; border-bottom: 2px solid #dde2ea; }
    .hm-table td { padding: 7px 12px; border-bottom: 1px solid #eef0f3; color: #444; vertical-align: top; }
    .hm-table td.hm-strong { font-weight: 700; color: #222; white-space: nowrap; }
    .hm-table tr:last-child td { border-bottom: none; }
    .hm-tip { background: #eef7ff; border-left: 4px solid #2B7FFF; border-radius: 0 8px 8px 0; padding: 10px 14px; font-size: 12.5px; color: #1a4d8f; margin: 10px 0; }
    .hm-tip.hm-warn { background: #fff8e6; border-left-color: #f39c12; color: #7a5000; }
    .hm-dot { display: inline-block; width: 11px; height: 11px; border-radius: 50%; vertical-align: middle; }
    #help-modal-overlay kbd {
      font-size: 11px; background: #eee; border: 1px solid #ccc; border-radius: 3px; padding: 1px 5px; white-space: nowrap;
    }
    #help-sidebar::-webkit-scrollbar { width: 4px; }
    #help-sidebar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
    @media (max-width: 700px) {
      #help-modal-overlay { padding: 0; }
      #help-modal-box { max-height: 100vh; height: 100%; border-radius: 0; }
      #help-modal-body { flex-direction: column; }
      #help-sidebar { width: 100%; max-height: 34vh; border-right: none; border-bottom: 1px solid #e5e8ee; }
      #help-content { padding: 18px; }
      .hm-table td.hm-strong { white-space: normal; }
    }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('help-modal-overlay').addEventListener('mousedown', function (e) {
    if (e.target === this) closeHelpModal();
  });
  document.addEventListener('keydown', function (e) {
    const o = document.getElementById('help-modal-overlay');
    if (e.key === 'Escape' && o && o.style.display === 'flex') closeHelpModal();
  });
})();

// ── Fonctions globales ─────────────────────────────────────────────────────

function openHelpModal() {
  const o = document.getElementById('help-modal-overlay');
  o.style.display = 'flex';
  helpShow(document.querySelector('.help-nav[data-s="h-intro"]'));
}

function helpShow(item) {
  if (!item) return;
  document.querySelectorAll('.help-nav').forEach(i => i.classList.remove('help-nav-active'));
  document.querySelectorAll('.help-section').forEach(s => s.style.display = 'none');
  item.classList.add('help-nav-active');
  const sec = document.getElementById(item.dataset.s);
  if (sec) sec.style.display = 'block';
  const content = document.getElementById('help-content');
  if (content) content.scrollTop = 0;
}

function closeHelpModal() {
  document.getElementById('help-modal-overlay').style.display = 'none';
}
