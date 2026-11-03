// =========================================================================
// WIDGET ŒUVRE D'ART DU JOUR — Le Bureau du Prof
// =========================================================================
// Un tableau célèbre (libre de droits) chaque jour, pour l'histoire des arts
// et les rituels du matin. Dans le style des widgets « Dictionnaire » et
// « QR code » :
//   - grande image de l'œuvre (chargée depuis Wikipédia / Wikimedia Commons)
//   - 1) « J'observe » : trois questions à révéler une à une
//   - 2) « Je découvre » : le cartel (titre, artiste, date, technique, lieu,
//        mouvement, période) et un « Le savais-tu ? »
//   - ◀ ▶ œuvre précédente / suivante, 📅 revenir à l'œuvre du jour, 🎲 au hasard
//   - 📚 sommaire : la liste des œuvres par période (recherche, filtres)
//        pour choisir celle sur laquelle on veut travailler
//   - 👁 mode projection (ou clic sur l'image) : l'œuvre seule, en grand
//   - A− / A+ : taille du texte ; ? : aide
//   - déplacement en tirant la barre de titre, redimensionnement libre
//   - boutons fenêtre jaune (réduire) / vert (plein écran board) / rouge (fermer)
//   - restauré après l'actualisation du tableau (s'il suivait « l'œuvre du
//     jour », il passe tout seul à celle du nouveau jour)
//
// Les images viennent de Wikipédia (connexion internet nécessaire). Sans
// connexion, le cartel et les questions restent disponibles.
//
// Utilisation : createWidget('oeuvre-art-du-jour')
// Le template #template-oeuvre-art-du-jour est injecté dans le DOM par ce fichier.
// Sauvegarde : window.oadGetData(widget) / window.oadSetData(widget, data)
// (appelés par save-load.js)
// =========================================================================

const _OAD_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _OAD_LS_IMG = 'lbdp-oeuvre-du-jour-images';

/* ── Les œuvres ─────────────────────────────────────────────────────
   t : titre · a : artiste · d : date · tech : technique · m : lieu de conservation
   mv : mouvement · per : période (programme d'histoire des arts)
   fr / en : titre de l'article Wikipédia (français / anglais) pour l'image
             ('' = article à ne pas utiliser, par ex. un homonyme)
   img : (facultatif) nom exact d'un fichier Wikimedia Commons, prioritaire
   q : trois questions pour observer · s : le savais-tu ?                  */
const OAD_WORKS = [
    { id: 'joconde', t: 'La Joconde', a: 'Léonard de Vinci', d: 'vers 1503-1519', tech: 'Huile sur panneau de bois', m: 'Musée du Louvre, Paris', mv: 'Renaissance', per: 'Temps modernes',
      fr: 'La Joconde', en: 'Mona Lisa',
      q: ['Où se trouve la femme ? Que vois-tu derrière elle ?', 'Décris son visage. Que penses-tu de son sourire ?', 'Où sont placées ses mains ? Comment se tient-elle ?'],
      s: 'Elle a été volée au Louvre en 1911 et retrouvée deux ans plus tard en Italie ! Aujourd’hui, elle est protégée par une vitre blindée.' },
    { id: 'nuit-etoilee', t: 'La Nuit étoilée', a: 'Vincent van Gogh', d: '1889', tech: 'Huile sur toile', m: 'Museum of Modern Art (MoMA), New York', mv: 'Postimpressionnisme', per: 'XIXe siècle',
      fr: 'La Nuit étoilée', en: 'The Starry Night',
      q: ['Que vois-tu dans le ciel ? Comment le peintre l’a-t-il représenté ?', 'Quel est le grand arbre sombre au premier plan ? À quoi te fait-il penser ?', 'Quelles couleurs dominent ? Quelle impression donnent-elles ?'],
      s: 'Van Gogh l’a peinte de mémoire, depuis sa chambre de l’hôpital de Saint-Rémy-de-Provence. Le village au pied des collines est en partie imaginé.' },
    { id: 'jeune-fille-perle', t: 'La Jeune Fille à la perle', a: 'Johannes Vermeer', d: 'vers 1665', tech: 'Huile sur toile', m: 'Mauritshuis, La Haye (Pays-Bas)', mv: 'Siècle d’or hollandais', per: 'Temps modernes',
      fr: 'La Jeune Fille à la perle', en: 'Girl with a Pearl Earring',
      q: ['Que porte la jeune fille sur la tête ?', 'D’où vient la lumière ? Quelles parties du tableau éclaire-t-elle ?', 'Que semble-t-elle faire ? À ton avis, que va-t-elle dire ?'],
      s: 'Ce n’est sans doute pas le portrait d’une vraie personne mais une « tronie », une figure imaginaire. On la surnomme parfois « la Joconde du Nord ».' },
    { id: 'impression', t: 'Impression, soleil levant', a: 'Claude Monet', d: '1872', tech: 'Huile sur toile', m: 'Musée Marmottan Monet, Paris', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'Impression, soleil levant', en: 'Impression, Sunrise',
      q: ['Quel moment de la journée est représenté ? Comment le sais-tu ?', 'Que vois-tu sur l’eau ?', 'Les formes sont-elles précises ou floues ? Pourquoi, à ton avis ?'],
      s: 'C’est ce tableau qui a donné son nom à l’impressionnisme : un critique s’en est moqué en disant que ce n’étaient que des « impressions ».' },
    { id: 'liberte', t: 'La Liberté guidant le peuple', a: 'Eugène Delacroix', d: '1830', tech: 'Huile sur toile', m: 'Musée du Louvre, Paris', mv: 'Romantisme', per: 'XIXe siècle',
      fr: 'La Liberté guidant le peuple', en: 'Liberty Leading the People',
      q: ['Qui est la femme au centre ? Que tient-elle dans ses mains ?', 'Quels personnages l’entourent ? Sont-ils tous habillés de la même façon ?', 'Quelle forme dessine le groupe de personnages ? Vers où avancent-ils ?'],
      s: 'Le tableau évoque les « Trois Glorieuses », la révolution de juillet 1830 à Paris. La femme est une allégorie : elle représente la Liberté.' },
    { id: 'radeau-meduse', t: 'Le Radeau de La Méduse', a: 'Théodore Géricault', d: '1818-1819', tech: 'Huile sur toile', m: 'Musée du Louvre, Paris', mv: 'Romantisme', per: 'XIXe siècle',
      fr: 'Le Radeau de La Méduse', en: 'The Raft of the Medusa',
      q: ['Où se trouvent les personnages ? Que leur est-il arrivé ?', 'Que fait l’homme tout en haut, à droite ? Que cherche-t-il ?', 'Quelle forme dessine le groupe de personnages ?'],
      s: 'Le tableau raconte un vrai naufrage, celui de la frégate La Méduse en 1816. Il est immense : plus de 7 mètres de large !' },
    { id: 'cri', t: 'Le Cri', a: 'Edvard Munch', d: '1893', tech: 'Tempera et pastel sur carton', m: 'Galerie nationale, Oslo (Norvège)', mv: 'Expressionnisme', per: 'XIXe siècle',
      fr: 'Le Cri', en: 'The Scream',
      q: ['Décris le personnage au premier plan. Quelle émotion exprime-t-il ?', 'Quelles couleurs le peintre a-t-il choisies pour le ciel ?', 'Que font les deux personnages au fond, sur le pont ?'],
      s: 'Munch a raconté avoir ressenti « un cri infini traversant la nature » pendant une promenade au coucher du soleil.' },
    { id: 'grande-vague', t: 'La Grande Vague de Kanagawa', a: 'Katsushika Hokusai', d: 'vers 1830-1831', tech: 'Estampe (gravure sur bois)', m: 'Plusieurs exemplaires (dont la Bibliothèque nationale de France)', mv: 'Ukiyo-e (art japonais)', per: 'XIXe siècle',
      fr: 'La Grande Vague de Kanagawa', en: 'The Great Wave off Kanagawa',
      q: ['Que vois-tu au premier plan ? Que ressens-tu face à cette vague ?', 'Trouve la montagne. Est-elle grande ou petite dans l’image ?', 'Que font les hommes dans les barques ?'],
      s: 'C’est une estampe : elle a été imprimée à des milliers d’exemplaires. La montagne au fond est le mont Fuji, le plus haut sommet du Japon.' },
    { id: 'glaneuses', t: 'Des glaneuses', a: 'Jean-François Millet', d: '1857', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Réalisme', per: 'XIXe siècle',
      fr: 'Des glaneuses', en: 'The Gleaners',
      q: ['Que font les trois femmes ?', 'Que vois-tu au loin, à l’arrière-plan ? Quelle différence avec le premier plan ?', 'Quelles couleurs le peintre utilise-t-il ?'],
      s: 'Glaner, c’est ramasser les épis de blé oubliés après la moisson. C’était autorisé aux personnes les plus pauvres.' },
    { id: 'moulin-galette', t: 'Bal du moulin de la Galette', a: 'Pierre-Auguste Renoir', d: '1876', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'Bal du moulin de la Galette', en: 'Bal du moulin de la Galette',
      q: ['Où se passe la scène ? Que font les personnages ?', 'Observe les taches de lumière : où les vois-tu ?', 'Quelle ambiance se dégage du tableau ?'],
      s: 'Le Moulin de la Galette était une guinguette de Montmartre, à Paris, où l’on venait danser le dimanche après-midi.' },
    { id: 'grande-jatte', t: 'Un dimanche après-midi à l’Île de la Grande Jatte', a: 'Georges Seurat', d: '1884-1886', tech: 'Huile sur toile', m: 'Art Institute of Chicago (États-Unis)', mv: 'Néo-impressionnisme (pointillisme)', per: 'XIXe siècle',
      fr: 'Un dimanche après-midi à l\'Île de la Grande Jatte', en: 'A Sunday Afternoon on the Island of La Grande Jatte',
      q: ['Approche-toi : comment le tableau est-il peint ?', 'Que font les personnes sur l’île ?', 'Cherche les animaux cachés dans le tableau.'],
      s: 'Seurat a peint avec de minuscules points de couleur pure posés côte à côte : c’est le pointillisme. Il lui a fallu deux ans.' },
    { id: 'menines', t: 'Les Ménines', a: 'Diego Vélasquez', d: '1656', tech: 'Huile sur toile', m: 'Musée du Prado, Madrid (Espagne)', mv: 'Baroque (Siècle d’or espagnol)', per: 'Temps modernes',
      fr: 'Les Ménines', en: 'Las Meninas',
      q: ['Qui est la petite fille au centre ? Qui l’entoure ?', 'Trouve le peintre dans le tableau : que fait-il ?', 'Observe le miroir au fond de la pièce : qui s’y reflète ?'],
      s: 'Le miroir montre le roi et la reine d’Espagne : ils se tiennent là où nous sommes, devant le tableau !' },
    { id: 'tour-babel', t: 'La Tour de Babel', a: 'Pieter Bruegel l’Ancien', d: '1563', tech: 'Huile sur panneau de bois', m: 'Kunsthistorisches Museum, Vienne (Autriche)', mv: 'Renaissance flamande', per: 'Temps modernes',
      fr: 'La Tour de Babel (Bruegel)', en: 'The Tower of Babel (Bruegel)',
      q: ['Décris la tour. Est-elle terminée ?', 'Cherche les ouvriers : que font-ils ?', 'Que se passe-t-il en bas à gauche ?'],
      s: 'Le tableau illustre un récit de la Bible : les hommes voulaient construire une tour assez haute pour toucher le ciel.' },
    { id: 'chasseurs-neige', t: 'Les Chasseurs dans la neige', a: 'Pieter Bruegel l’Ancien', d: '1565', tech: 'Huile sur panneau de bois', m: 'Kunsthistorisches Museum, Vienne (Autriche)', mv: 'Renaissance flamande', per: 'Temps modernes',
      fr: 'Les Chasseurs dans la neige', en: 'The Hunters in the Snow',
      q: ['Quelle saison est représentée ? Comment le sais-tu ?', 'Que rapportent les chasseurs et leurs chiens ? Ont-ils eu de la chance ?', 'Que font les personnages en bas, sur la glace ?'],
      s: 'Ce tableau faisait partie d’une série sur les moments de l’année. Il montre le cœur de l’hiver.' },
    { id: 'sacre-napoleon', t: 'Le Sacre de Napoléon', a: 'Jacques-Louis David', d: '1805-1807', tech: 'Huile sur toile', m: 'Musée du Louvre, Paris', mv: 'Néoclassicisme', per: 'XIXe siècle',
      fr: 'Le Sacre de Napoléon', en: 'The Coronation of Napoleon',
      q: ['Que fait Napoléon ? Qui est agenouillé devant lui ?', 'Où se passe la scène ?', 'Comment les personnages sont-ils habillés ? Combien peux-tu en compter ?'],
      s: 'La cérémonie a eu lieu à Notre-Dame de Paris le 2 décembre 1804. Le tableau mesure presque 10 mètres de large !' },
    { id: 'dentelliere', t: 'La Dentellière', a: 'Johannes Vermeer', d: 'vers 1669-1670', tech: 'Huile sur toile', m: 'Musée du Louvre, Paris', mv: 'Siècle d’or hollandais', per: 'Temps modernes',
      fr: 'La Dentellière (Vermeer)', en: 'The Lacemaker (Vermeer)',
      q: ['Que fait la jeune femme ? Semble-t-elle concentrée ?', 'Quels objets vois-tu au premier plan ?', 'À ton avis, le tableau est-il grand ou petit ?'],
      s: 'C’est l’un des plus petits tableaux de Vermeer : 24 cm sur 21 cm, à peine plus grand qu’une feuille de cahier !' },
    { id: 'ronde-nuit', t: 'La Ronde de nuit', a: 'Rembrandt', d: '1642', tech: 'Huile sur toile', m: 'Rijksmuseum, Amsterdam (Pays-Bas)', mv: 'Siècle d’or hollandais', per: 'Temps modernes',
      fr: 'La Ronde de nuit', en: 'The Night Watch',
      q: ['Qui sont les deux hommes au premier plan ? Comment sont-ils habillés ?', 'D’où vient la lumière ? Qui éclaire-t-elle ?', 'Trouve la petite fille lumineuse : que vois-tu à sa ceinture ?'],
      s: 'Malgré son nom, la scène se passe de jour ! Le vernis avait tellement noirci avec le temps qu’on a cru que c’était la nuit.' },
    { id: 'angelus', t: 'L’Angélus', a: 'Jean-François Millet', d: '1857-1859', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Réalisme', per: 'XIXe siècle',
      fr: 'L\'Angélus (Millet)', en: 'The Angelus (painting)',
      q: ['Que font l’homme et la femme ?', 'Quel moment de la journée est représenté ?', 'Que vois-tu au loin, à l’horizon ?'],
      s: 'L’angélus est une prière. Au loin, la cloche de l’église sonne : les paysans s’arrêtent de travailler pour prier.' },
    { id: 'coquelicots', t: 'Les Coquelicots', a: 'Claude Monet', d: '1873', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: '', en: 'The Poppy Field near Argenteuil',
      q: ['Quelle saison est représentée ?', 'Cherche les deux couples de personnages : que font-ils ?', 'Comment Monet a-t-il peint les coquelicots ?'],
      s: 'La femme à l’ombrelle et l’enfant sont sans doute Camille, l’épouse de Monet, et leur fils Jean.' },
    { id: 'dejeuner-canotiers', t: 'Le Déjeuner des canotiers', a: 'Pierre-Auguste Renoir', d: '1880-1881', tech: 'Huile sur toile', m: 'Phillips Collection, Washington (États-Unis)', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'Le Déjeuner des canotiers', en: 'Luncheon of the Boating Party',
      q: ['Où se passe la scène ?', 'Que font les personnages ? Que vois-tu sur la table ?', 'Trouve le petit chien : qui s’occupe de lui ?'],
      s: 'La jeune femme au petit chien est Aline Charigot, qui deviendra l’épouse de Renoir.' },
    { id: 'raboteurs', t: 'Les Raboteurs de parquet', a: 'Gustave Caillebotte', d: '1875', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Réalisme / Impressionnisme', per: 'XIXe siècle',
      fr: 'Les Raboteurs de parquet', en: 'The Floor Scrapers',
      q: ['Que font les trois hommes ?', 'D’où vient la lumière ?', 'Quels outils et quels objets vois-tu sur le parquet ?'],
      s: 'Le tableau a été refusé au Salon officiel : on trouvait le sujet trop « vulgaire ». Il montre pourtant simplement des ouvriers au travail.' },
    { id: 'rue-paris-pluie', t: 'Rue de Paris, temps de pluie', a: 'Gustave Caillebotte', d: '1877', tech: 'Huile sur toile', m: 'Art Institute of Chicago (États-Unis)', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'Rue de Paris, temps de pluie', en: 'Paris Street; Rainy Day',
      q: ['Quel temps fait-il ? Comment le sais-tu ?', 'Comment sont habillés les passants ? À quelle époque sommes-nous ?', 'Observe le lampadaire : comment partage-t-il le tableau ?'],
      s: 'La scène se passe à Paris, près de la gare Saint-Lazare, dans les nouveaux quartiers aux larges avenues construits par le baron Haussmann.' },
    { id: 'vertumne', t: 'Vertumne', a: 'Giuseppe Arcimboldo', d: 'vers 1590-1591', tech: 'Huile sur bois', m: 'Château de Skokloster (Suède)', mv: 'Maniérisme', per: 'Temps modernes',
      fr: 'Vertumne (Arcimboldo)', en: 'Vertumnus (Arcimboldo)',
      q: ['Que vois-tu de loin ? Et de près ?', 'Quels fruits, légumes et fleurs reconnais-tu ?', 'Avec quoi le peintre a-t-il fait les yeux, le nez et la bouche ?'],
      s: 'C’est le portrait de l’empereur Rodolphe II, représenté en Vertumne, le dieu romain des saisons et des jardins.' },
    { id: 'fifre', t: 'Le Fifre', a: 'Édouard Manet', d: '1866', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Réalisme', per: 'XIXe siècle',
      fr: '', en: 'The Fifer',
      q: ['Qui est représenté ? Que fait-il ?', 'Décris le fond du tableau. Que remarques-tu ?', 'Quelles couleurs vives vois-tu sur son uniforme ?'],
      s: 'Manet s’est inspiré des peintres espagnols comme Vélasquez. Le Salon a refusé ce tableau en 1866.' },
    { id: 'tricheur', t: 'Le Tricheur à l’as de carreau', a: 'Georges de La Tour', d: 'vers 1636-1638', tech: 'Huile sur toile', m: 'Musée du Louvre, Paris', mv: 'Baroque', per: 'Temps modernes',
      fr: 'Le Tricheur à l\'as de carreau', en: 'The Cheat with the Ace of Diamonds',
      q: ['Combien de personnages sont autour de la table ? Que font-ils ?', 'Observe les regards : qui regarde qui ?', 'Où l’homme de gauche cache-t-il une carte ?'],
      s: 'Le jeune homme richement habillé, à droite, est la victime : les trois autres s’entendent pour le tromper et lui prendre son argent.' },
    { id: 'dame-hermine', t: 'La Dame à l’hermine', a: 'Léonard de Vinci', d: 'vers 1489-1491', tech: 'Huile sur panneau de bois', m: 'Musée national, Cracovie (Pologne)', mv: 'Renaissance', per: 'Temps modernes',
      fr: 'La Dame à l\'hermine', en: 'Lady with an Ermine',
      q: ['Quel animal la jeune femme tient-elle dans ses bras ?', 'Décris ses mains. Que remarques-tu ?', 'Vers où regarde-t-elle ?'],
      s: 'La jeune femme s’appelle Cecilia Gallerani. À l’époque, l’hermine était un symbole de pureté.' },
    { id: 'arnolfini', t: 'Les Époux Arnolfini', a: 'Jan van Eyck', d: '1434', tech: 'Huile sur panneau de chêne', m: 'National Gallery, Londres', mv: 'Primitifs flamands', per: 'Moyen Âge',
      fr: 'Les Époux Arnolfini', en: 'Arnolfini Portrait',
      q: ['Qui sont les deux personnages ? Comment sont-ils habillés ?', 'Trouve le miroir rond au fond : que reflète-t-il ?', 'Quels objets et quel animal vois-tu dans la pièce ?'],
      s: 'Au-dessus du miroir, le peintre a écrit en latin : « Jan van Eyck était ici, 1434 ». Il se reflète peut-être lui-même dans le miroir.' },
    { id: 'danseuses-bleues', t: 'Danseuses bleues', a: 'Edgar Degas', d: 'vers 1890', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'Danseuses bleues', en: 'Blue Dancers',
      q: ['Que font les danseuses ? Sont-elles sur scène ou dans les coulisses ?', 'Les formes sont-elles précises ? Comment Degas les a-t-il peintes ?', 'Quelle couleur domine ?'],
      s: 'Degas a peint et dessiné les danseuses de l’Opéra de Paris plus de 1 500 fois !' },
    { id: 'classe-danse', t: 'La Classe de danse', a: 'Edgar Degas', d: '1873-1876', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'La Classe de danse (Degas)', en: 'The Dance Class (Degas)',
      q: ['Qui est l’homme au bâton ? Que fait-il ?', 'Que font les danseuses qui attendent ?', 'Observe le sol et les murs de la salle : que remarques-tu ?'],
      s: 'Le professeur est Jules Perrot, un célèbre maître de ballet. La salle est celle de l’ancien Opéra de Paris.' },
    { id: 'baiser-klimt', t: 'Le Baiser', a: 'Gustav Klimt', d: '1907-1908', tech: 'Huile et feuilles d’or sur toile', m: 'Palais du Belvédère, Vienne (Autriche)', mv: 'Art nouveau (Sécession viennoise)', per: 'XXe siècle',
      fr: 'Le Baiser (Klimt)', en: 'The Kiss (Klimt)',
      q: ['Que font les deux personnages ? Où sont-ils ?', 'Quelle matière brillante le peintre a-t-il utilisée ?', 'Compare les motifs des deux vêtements : quelles formes vois-tu ?'],
      s: 'Klimt a utilisé de vraies feuilles d’or. Son père était graveur sur or.' },
    { id: 'broadway', t: 'Broadway Boogie-Woogie', a: 'Piet Mondrian', d: '1942-1943', tech: 'Huile sur toile', m: 'Museum of Modern Art (MoMA), New York', mv: 'Art abstrait (néoplasticisme)', per: 'XXe siècle',
      fr: 'Broadway Boogie-Woogie', en: 'Broadway Boogie Woogie',
      q: ['Quelles couleurs vois-tu ?', 'Quelles formes ? Y a-t-il des lignes courbes ?', 'Le titre parle d’une rue de New York et d’une musique. Que peut évoquer le tableau ?'],
      s: 'Mondrian s’est inspiré du plan des rues de New York, de ses taxis jaunes et du boogie-woogie, une musique très rythmée.' },
    { id: 'senecio', t: 'Senecio', a: 'Paul Klee', d: '1922', tech: 'Huile sur gaze collée sur carton', m: 'Kunstmuseum, Bâle (Suisse)', mv: 'Art moderne', per: 'XXe siècle',
      fr: 'Senecio (Klee)', en: 'Senecio (Klee)',
      q: ['Que vois-tu : un visage ? un masque ?', 'Quelles formes géométriques le composent ?', 'Quelle émotion exprime ce visage ?'],
      s: 'Paul Klee était aussi musicien (violoniste). Il a enseigné au Bauhaus, une célèbre école d’art et d’architecture en Allemagne.' },
    { id: 'arearea', t: 'Arearea', a: 'Paul Gauguin', d: '1892', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Postimpressionnisme (synthétisme)', per: 'XIXe siècle',
      fr: 'Arearea', en: 'Arearea',
      q: ['Où se passe la scène ?', 'De quelle couleur est le chien ? Est-ce réaliste ?', 'Que font les personnages au fond ?'],
      s: '« Arearea » veut dire « amusement » en tahitien. Gauguin a peint ce tableau à Tahiti, une île du Pacifique.' },
    { id: 'surpris', t: 'Surpris ! (Tigre dans une tempête tropicale)', a: 'Henri Rousseau, dit le Douanier Rousseau', d: '1891', tech: 'Huile sur toile', m: 'National Gallery, Londres', mv: 'Art naïf', per: 'XIXe siècle',
      fr: 'Surpris !', en: 'Tiger in a Tropical Storm',
      q: ['Quel animal vois-tu ? Que lui arrive-t-il ?', 'Quel temps fait-il ? Comment le sais-tu ?', 'Combien de verts différents trouves-tu ?'],
      s: 'Rousseau n’est jamais allé dans la jungle : il s’inspirait des serres du Jardin des Plantes, à Paris !' },
    { id: 'gare-saint-lazare', t: 'La Gare Saint-Lazare', a: 'Claude Monet', d: '1877', tech: 'Huile sur toile', m: 'Musée d’Orsay, Paris', mv: 'Impressionnisme', per: 'XIXe siècle',
      fr: 'La Gare Saint-Lazare (Monet)', en: 'La Gare Saint-Lazare',
      q: ['Où se passe la scène ?', 'Que sort de la locomotive ? Comment est-ce peint ?', 'Quelle impression le peintre veut-il donner ?'],
      s: 'Monet a peint une douzaine de tableaux de cette gare. On raconte que le chef de gare faisait chauffer les locomotives pour lui !' },
    { id: 'pluie-vapeur', t: 'Pluie, vapeur et vitesse', a: 'William Turner', d: '1844', tech: 'Huile sur toile', m: 'National Gallery, Londres', mv: 'Romantisme', per: 'XIXe siècle',
      fr: 'Pluie, vapeur et vitesse', en: 'Rain, Steam and Speed – The Great Western Railway',
      q: ['Que vois-tu arriver vers nous ?', 'Que représentent les tourbillons de couleur ?', 'Cherche le petit lièvre qui court devant le train !'],
      s: 'Turner a peint la toute nouvelle ligne de chemin de fer Great Western, en Angleterre. À l’époque, le train était une invention récente et impressionnante.' },
    { id: 'voyageur', t: 'Le Voyageur contemplant une mer de nuages', a: 'Caspar David Friedrich', d: 'vers 1818', tech: 'Huile sur toile', m: 'Kunsthalle, Hambourg (Allemagne)', mv: 'Romantisme', per: 'XIXe siècle',
      fr: 'Le Voyageur contemplant une mer de nuages', en: 'Wanderer above the Sea of Fog',
      q: ['Où est l’homme ? Que regarde-t-il ?', 'Que vois-tu en dessous de lui ?', 'Pourquoi, à ton avis, ne voit-on pas son visage ?'],
      s: 'Le personnage est vu de dos : on peut facilement se mettre à sa place et contempler le paysage avec lui.' },
    { id: 'ecole-athenes', t: 'L’École d’Athènes', a: 'Raphaël', d: '1509-1511', tech: 'Fresque', m: 'Musées du Vatican, Rome', mv: 'Renaissance', per: 'Temps modernes',
      fr: 'L\'École d\'Athènes', en: 'The School of Athens',
      q: ['Combien de personnages vois-tu ? Que font-ils ?', 'Qui sont les deux hommes au centre ? Que montrent leurs mains ?', 'Décris le bâtiment. À quoi ressemble-t-il ?'],
      s: 'C’est une fresque : elle est peinte directement sur le mur, sur un enduit encore frais. On y voit les grands savants de l’Antiquité, comme Platon et Aristote.' },
    { id: 'ambassadeurs', t: 'Les Ambassadeurs', a: 'Hans Holbein le Jeune', d: '1533', tech: 'Huile sur panneau de chêne', m: 'National Gallery, Londres', mv: 'Renaissance', per: 'Temps modernes',
      fr: 'Les Ambassadeurs (Holbein)', en: 'The Ambassadors (Holbein)',
      q: ['Comment sont habillés les deux hommes ?', 'Quels objets vois-tu sur l’étagère entre eux ?', 'Quelle forme étrange vois-tu en bas ? Regarde-la très en biais !'],
      s: 'La forme étrange est un crâne déformé : c’est une anamorphose. On le reconnaît en regardant le tableau de côté.' },
    { id: 'jeux-enfants', t: 'Jeux d’enfants', a: 'Pieter Bruegel l’Ancien', d: '1560', tech: 'Huile sur panneau de bois', m: 'Kunsthistorisches Museum, Vienne (Autriche)', mv: 'Renaissance flamande', per: 'Temps modernes',
      fr: 'Jeux d\'enfants (Bruegel)', en: 'Children\'s Games (Bruegel)',
      q: ['Combien de jeux différents peux-tu trouver ?', 'Lesquels connais-tu encore aujourd’hui ?', 'Où se passe la scène ?'],
      s: 'Les spécialistes ont compté plus de 80 jeux différents dans ce tableau !' },
    { id: 'terrasse-cafe', t: 'Terrasse du café le soir', a: 'Vincent van Gogh', d: '1888', tech: 'Huile sur toile', m: 'Musée Kröller-Müller, Otterlo (Pays-Bas)', mv: 'Postimpressionnisme', per: 'XIXe siècle',
      fr: 'Terrasse du café le soir', en: 'Café Terrace at Night',
      q: ['Quel moment de la journée est représenté ?', 'Quelles couleurs vives vois-tu ? Lesquelles s’opposent ?', 'Que vois-tu dans le ciel ?'],
      s: 'Van Gogh a peint ce tableau à Arles, directement sur place, le soir. Le café existe toujours !' },
    { id: 'composition-8', t: 'Composition VIII', a: 'Vassily Kandinsky', d: '1923', tech: 'Huile sur toile', m: 'Musée Solomon R. Guggenheim, New York', mv: 'Art abstrait', per: 'XXe siècle',
      fr: 'Composition VIII', en: 'Composition VIII',
      q: ['Quelles formes géométriques reconnais-tu ?', 'Le tableau représente-t-il quelque chose de réel ?', 'Si ce tableau était une musique, comment serait-elle ?'],
      s: 'Kandinsky est l’un des inventeurs de l’art abstrait. Il disait « entendre » les couleurs comme des sons.' },
    { id: 'chambre-arles', t: 'La Chambre à Arles', a: 'Vincent van Gogh', d: '1888', tech: 'Huile sur toile', m: 'Musée Van Gogh, Amsterdam (Pays-Bas)', mv: 'Postimpressionnisme', per: 'XIXe siècle',
      fr: 'La Chambre à Arles', en: 'Bedroom in Arles',
      q: ['Quels meubles et quels objets vois-tu ?', 'Quelles couleurs dominent ?', 'Les murs et le sol sont-ils bien droits ? Que remarques-tu ?'],
      s: 'Van Gogh a peint trois versions de sa chambre. Il voulait que ce tableau donne une impression de repos.' },
    { id: 'tournesols', t: 'Les Tournesols', a: 'Vincent van Gogh', d: '1888', tech: 'Huile sur toile', m: 'National Gallery, Londres', mv: 'Postimpressionnisme', per: 'XIXe siècle',
      fr: 'Les Tournesols', en: 'Sunflowers (Van Gogh series)',
      q: ['Combien de fleurs comptes-tu ? Sont-elles toutes pareilles ?', 'Combien de jaunes différents vois-tu ?', 'Certaines fleurs sont-elles fanées ?'],
      s: 'Van Gogh a peint ces tournesols pour décorer la chambre de son ami, le peintre Paul Gauguin, qui venait habiter chez lui à Arles.' }
];

document.body.insertAdjacentHTML('beforeend', `
<template id="template-oeuvre-art-du-jour">
    <div class="editor-container oad-w" style="height:560px;width:900px;">
        <div class="oad-bar editor-toolbar" title="Glisser pour déplacer">
            <span class="oad-bar-title">🖼️ Œuvre d’art du jour</span>
            <div class="oad-tools"${_OAD_STOP}>
                <button type="button" class="oad-ib" data-oad-action="prev" title="Œuvre précédente">◀</button>
                <button type="button" class="oad-ib oad-ib-today" data-oad-action="today" title="Revenir à l’œuvre du jour">📅</button>
                <button type="button" class="oad-ib" data-oad-action="next" title="Œuvre suivante">▶</button>
                <button type="button" class="oad-ib" data-oad-action="random" title="Une œuvre au hasard">🎲</button>
                <button type="button" class="oad-ib oad-ib-toc" data-oad-action="toc" title="Sommaire : choisir une œuvre">📚</button>
                <span class="oad-sep"></span>
                <button type="button" class="oad-ib" data-oad-action="present" title="Mode projection : l’œuvre seule">👁</button>
                <button type="button" class="oad-ib" data-oad-action="font-down" title="Texte plus petit">A−</button>
                <button type="button" class="oad-ib" data-oad-action="font-up" title="Texte plus grand">A+</button>
                <button type="button" class="oad-ib oad-ib-help" data-oad-action="help" title="Aide">?</button>
            </div>
            <div class="wf-btns"${_OAD_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"           onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="oad-stage"${_OAD_STOP}>
            <div class="oad-art" data-oad-action="present" title="Cliquer pour voir l’œuvre en grand">
                <div class="oad-art-inner"></div>
                <div class="oad-credit"></div>
            </div>
            <div class="oad-panel"></div>
            <div class="oad-flash"></div>
        </div>
        <div class="oad-toc" hidden${_OAD_STOP}>
            <div class="oad-toc-card">
                <div class="oad-toc-head">
                    <span>📚 Sommaire des œuvres</span>
                    <button type="button" class="oad-ib" data-oad-action="toc-close" title="Fermer le sommaire">✕</button>
                </div>
                <div class="oad-toc-search">
                    <span class="oad-toc-ico">🔍</span>
                    <input type="text" class="oad-toc-input" spellcheck="false" autocomplete="off"
                           placeholder="Chercher un titre, un artiste, un musée…"
                           onkeydown="oadTocKey(event,this)" onkeyup="event.stopPropagation()" onkeypress="event.stopPropagation()"
                           onpaste="event.stopPropagation()" oninput="oadTocFilter(this)">
                </div>
                <div class="oad-toc-pers"></div>
                <div class="oad-toc-list"></div>
            </div>
        </div>
        <div class="oad-help" hidden${_OAD_STOP}>
            <div class="oad-help-card">
                <div class="oad-help-head">
                    <span>❓ Comment utiliser l’œuvre du jour</span>
                    <button type="button" class="oad-ib" data-oad-action="help-close" title="Fermer l'aide">✕</button>
                </div>
                <ul class="oad-help-list">
                    <li><b>Chaque jour, une nouvelle œuvre</b> s’affiche toute seule : idéal pour le rituel du matin.</li>
                    <li><b>1. J’observe :</b> on regarde d’abord l’œuvre sans rien savoir. Les questions apparaissent une par une avec le bouton <b>Question suivante</b>.</li>
                    <li><b>2. Je découvre :</b> le bouton <b>Découvrir l’œuvre</b> révèle le cartel (titre, artiste, date, technique, musée, mouvement) et une anecdote.</li>
                    <li><b>👁 ou clic sur l’image :</b> l’œuvre seule, en grand, pour bien l’observer. Clique à nouveau pour revenir.</li>
                    <li><b>◀ ▶ :</b> œuvre précédente ou suivante. <b>📅</b> revient à l’œuvre du jour. <b>🎲</b> en tire une au hasard.</li>
                    <li><b>📚 Sommaire :</b> la liste de toutes les œuvres, classées par période. Cherche un titre ou un artiste, filtre par période, puis clique sur l’œuvre de ton choix.</li>
                    <li><b>A− / A+ :</b> rend le texte plus petit ou plus grand pour la projection.</li>
                    <li><b>Fenêtre :</b> tire la barre du haut pour déplacer le widget, le coin pour l’agrandir. Bouton jaune : réduire, vert : plein écran, rouge : fermer.</li>
                </ul>
                <div class="oad-help-note">Toutes les œuvres sont dans le domaine public. Les images viennent de Wikipédia et Wikimedia Commons (connexion internet nécessaire). Sans connexion, le cartel et les questions restent disponibles.</div>
            </div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _oadEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function _oadLsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function _oadLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function _oadSave() { if (typeof saveBoard === 'function') try { saveBoard(); } catch (e) {} }
const _oadById = id => OAD_WORKS.find(w => w.id === id) || null;

function _oadFlash(c, text, ms) {
    const f = c && c.querySelector('.oad-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 2000);
}
function _oadLaunch(c, url) {
    const api = window.electronAPI;
    if (api && typeof api.openExternal === 'function') { api.openExternal(url); return; }
    let w = null;
    try { w = window.open(url, '_blank'); } catch (e) {}
    if (!w) _oadFlash(c, '⚠ Le navigateur a bloqué l’ouverture : autorise les fenêtres pour ce site.', 4000);
}

/* ── L'œuvre du jour ───────────────────────────────────────────────
   Un numéro de jour (heure locale) et un pas premier avec le nombre
   d'œuvres : chaque œuvre revient une fois par cycle, et deux jours
   qui se suivent ne montrent pas deux œuvres voisines dans la liste. */
function _oadDayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function _oadDayNumber(d) {
    d = d || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}
function _oadStep(n) {
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    for (let s = 17; s < 17 + n; s++) if (gcd(s, n) === 1) return s % n || 1;
    return 1;
}
function _oadTodayIndex() {
    const n = OAD_WORKS.length;
    return ((_oadDayNumber() * _oadStep(n)) % n + n) % n;
}
function _oadDateLabel() {
    try {
        const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (e) { return ''; }
}

/* ── État du widget ─────────────────────────────────────────────── */
function _oadState(c) {
    if (!c._oad) c._oad = { follow: true, id: OAD_WORKS[_oadTodayIndex()].id, day: _oadDayKey(), qn: 1, revealed: false, fs: 1, present: false };
    return c._oad;
}
function _oadCurrent(c) {
    const st = _oadState(c);
    if (st.follow) {
        const today = OAD_WORKS[_oadTodayIndex()];
        if (st.id !== today.id || st.day !== _oadDayKey()) {
            st.id = today.id; st.day = _oadDayKey(); st.qn = 1; st.revealed = false;
        }
    }
    return _oadById(st.id) || OAD_WORKS[0];
}
function _oadGo(c, id, follow) {
    const st = _oadState(c);
    st.follow = !!follow;
    st.id = id; st.day = _oadDayKey(); st.qn = 1; st.revealed = false;
    _oadRender(c);
    _oadSave();
}

/* ── Image depuis Wikipédia ────────────────────────────────────────
   1) article français  2) article anglais  3) recherche sur Wikipédia
   L'adresse trouvée est gardée dans ce navigateur pour les fois suivantes. */
const _oadImgCache = {};
function _oadApi(lang, params) {
    const url = 'https://' + lang + '.wikipedia.org/w/api.php?' +
        new URLSearchParams(Object.assign({ action: 'query', format: 'json', formatversion: '2', origin: '*' }, params)).toString();
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .finally(() => { if (timer) clearTimeout(timer); });
}
function _oadPickPage(j) {
    const pages = j && j.query && j.query.pages;
    if (!pages || !pages.length) return null;
    const p = pages.find(pg => pg.thumbnail && pg.thumbnail.source);
    return p ? { u: p.thumbnail.source, page: p.fullurl || '' } : null;
}
// Signature des sources d'une œuvre : si on corrige ses titres, l'ancienne
// image mémorisée est oubliée et on va chercher la bonne.
const _oadSig = w => [w.img || '', w.fr || '', w.en || ''].join('|');
async function _oadFindImage(w) {
    const sig = _oadSig(w);
    if (_oadImgCache[w.id] && _oadImgCache[w.id].k === sig) return _oadImgCache[w.id];
    const stored = _oadLsGet(_OAD_LS_IMG, {});
    if (stored && stored[w.id] && stored[w.id].u && stored[w.id].k === sig) return (_oadImgCache[w.id] = stored[w.id]);
    if (w.img) {
        const hit = { u: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(w.img.replace(/ /g, '_')) + '?width=1400',
                      page: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(w.img.replace(/ /g, '_')), k: sig };
        return (_oadImgCache[w.id] = hit);
    }
    const base = { prop: 'pageimages|info', piprop: 'thumbnail', pithumbsize: '1400', inprop: 'url', redirects: '1' };
    const tries = [
        () => w.fr && _oadApi('fr', Object.assign({ titles: w.fr }, base)),
        () => w.en && _oadApi('en', Object.assign({ titles: w.en }, base)),
        () => _oadApi('fr', Object.assign({ generator: 'search', gsrsearch: w.t + ' ' + w.a, gsrlimit: '1', gsrnamespace: '0' }, base))
    ];
    let lastErr = null;
    for (const t of tries) {
        try {
            const j = await t();
            const hit = j && _oadPickPage(j);
            if (hit) {
                hit.k = sig;
                _oadImgCache[w.id] = hit;
                const all = _oadLsGet(_OAD_LS_IMG, {}) || {};
                all[w.id] = hit;
                _oadLsSet(_OAD_LS_IMG, all);
                return hit;
            }
        } catch (e) { lastErr = e; }
    }
    if (lastErr) throw lastErr;
    return null;
}
function _oadWikiLink(w, hit) {
    return (hit && hit.page) || ('https://fr.wikipedia.org/wiki/' + encodeURIComponent((w.fr || w.t).replace(/ /g, '_')));
}

/* ── Affichage ──────────────────────────────────────────────────── */
function _oadRenderArt(c, w) {
    const inner = c.querySelector('.oad-art-inner'), credit = c.querySelector('.oad-credit');
    if (!inner) return;
    const req = c._oadImgReq = (c._oadImgReq || 0) + 1;
    inner.innerHTML = '<div class="oad-art-msg"><div class="oad-spin"></div><div>Chargement de l’œuvre…</div></div>';
    if (credit) credit.textContent = '';
    _oadFindImage(w).then(hit => {
        if (req !== c._oadImgReq) return;
        if (!hit) throw new Error('none');
        const img = new Image();
        img.className = 'oad-img';
        img.alt = w.t + ' — ' + w.a;
        img.draggable = false;
        img.decoding = 'async';
        img.onload = () => {
            if (req !== c._oadImgReq) return;
            inner.innerHTML = '';
            inner.appendChild(img);
            if (credit) credit.innerHTML = `Image : Wikimedia Commons (domaine public) · <span class="oad-link" data-oad-action="wiki">En savoir plus ↗</span>`;
        };
        img.onerror = () => {
            if (req !== c._oadImgReq) return;
            // L'adresse gardée ne marche plus : on l'oublie pour la prochaine fois
            delete _oadImgCache[w.id];
            const all = _oadLsGet(_OAD_LS_IMG, {}) || {};
            delete all[w.id]; _oadLsSet(_OAD_LS_IMG, all);
            _oadArtFallback(c, w);
        };
        img.src = hit.u;
    }).catch(() => { if (req === c._oadImgReq) _oadArtFallback(c, w); });
}
function _oadArtFallback(c, w) {
    const inner = c.querySelector('.oad-art-inner'), credit = c.querySelector('.oad-credit');
    if (!inner) return;
    const off = navigator.onLine === false;
    inner.innerHTML = `<div class="oad-art-msg">
        <div class="oad-art-ico">🖼️</div>
        <div class="oad-art-t">${off ? 'Pas de connexion internet' : 'Image indisponible'}</div>
        <div class="oad-art-s">${off ? 'L’image de l’œuvre a besoin d’internet. Le cartel et les questions restent disponibles.' : 'L’image n’a pas pu être chargée.'}</div>
        <div class="oad-art-btns">
            <button type="button" class="oad-btn" data-oad-action="retry">↻ Réessayer</button>
            <button type="button" class="oad-btn oad-btn-ghost" data-oad-action="wiki">Voir sur Wikipédia ↗</button>
        </div></div>`;
    if (credit) credit.textContent = '';
}
function _oadRenderPanel(c, w) {
    const panel = c.querySelector('.oad-panel');
    if (!panel) return;
    const st = _oadState(c);
    const qn = Math.max(1, Math.min(w.q.length, st.qn || 1));
    const qs = w.q.map((q, i) =>
        `<li class="oad-q${i < qn ? ' is-on' : ''}"><span class="oad-q-n">${i + 1}</span><span class="oad-q-t">${_oadEsc(q)}</span></li>`).join('');
    const dateBadge = st.follow
        ? `<span class="oad-day">📅 ${_oadEsc(_oadDateLabel())}</span>`
        : `<span class="oad-day oad-day-off">Œuvre ${OAD_WORKS.indexOf(w) + 1} sur ${OAD_WORKS.length}</span>`;
    panel.innerHTML = `
        <div class="oad-head">${dateBadge}<span class="oad-per">${_oadEsc(w.per)}</span></div>
        <section class="oad-sec">
            <div class="oad-sec-t">👀 1. J’observe</div>
            <ol class="oad-qs">${qs}</ol>
            ${qn < w.q.length ? '<button type="button" class="oad-btn oad-btn-soft" data-oad-action="q-next">Question suivante ▾</button>' : ''}
        </section>
        <section class="oad-sec">
            <div class="oad-sec-t">🔎 2. Je découvre</div>
            ${st.revealed ? `
            <div class="oad-cartel">
                <div class="oad-title">${_oadEsc(w.t)}</div>
                <div class="oad-artist">${_oadEsc(w.a)}</div>
                <dl class="oad-dl">
                    <dt>Date</dt><dd>${_oadEsc(w.d)}</dd>
                    <dt>Technique</dt><dd>${_oadEsc(w.tech)}</dd>
                    <dt>Où la voir ?</dt><dd>${_oadEsc(w.m)}</dd>
                    <dt>Mouvement</dt><dd>${_oadEsc(w.mv)}</dd>
                </dl>
            </div>
            <div class="oad-fact"><b>💡 Le savais-tu ?</b> ${_oadEsc(w.s)}</div>
            <button type="button" class="oad-btn oad-btn-ghost oad-hide" data-oad-action="hide">Cacher le cartel</button>`
            : `<div class="oad-mystery">Qui a peint cette œuvre ? Quand ? Fais des hypothèses avant de découvrir la réponse !</div>
               <button type="button" class="oad-btn" data-oad-action="reveal">✨ Découvrir l’œuvre</button>`}
        </section>`;
}
function _oadRender(c) {
    const w = _oadCurrent(c);
    const st = _oadState(c);
    if (c._oadShown !== w.id) { c._oadShown = w.id; _oadRenderArt(c, w); }
    _oadRenderPanel(c, w);
    c.classList.toggle('is-present', !!st.present);
    c.style.setProperty('--oad-fs', st.fs || 1);
    const pb = c.querySelector('.oad-tools [data-oad-action="present"]');
    if (pb) { pb.classList.toggle('is-on', !!st.present); pb.title = st.present ? 'Afficher les questions et le cartel' : 'Mode projection : l’œuvre seule'; }
    const tb = c.querySelector('[data-oad-action="today"]');
    if (tb) tb.classList.toggle('is-on', !!st.follow);
    const art = c.querySelector('.oad-art');
    if (art) art.title = st.present ? 'Cliquer pour revenir aux questions' : 'Cliquer pour voir l’œuvre en grand';
}

/* ── Sommaire des œuvres ─────────────────────────────────────────── */
const _OAD_PERIODS = ['Moyen Âge', 'Temps modernes', 'XIXe siècle', 'XXe siècle'];
const _oadFold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').toLowerCase();
function _oadThumb(w) {
    const hit = _oadImgCache[w.id] || (_oadLsGet(_OAD_LS_IMG, {}) || {})[w.id];
    if (hit && hit.u && hit.k === _oadSig(w)) return `<span class="oad-toc-th"><img src="${_oadEsc(hit.u)}" alt="" loading="lazy" draggable="false" onerror="this.parentElement.classList.add('is-empty');this.remove()"></span>`;
    return '<span class="oad-toc-th is-empty"></span>';
}
function _oadRenderToc(c) {
    const box = c.querySelector('.oad-toc-list'), pers = c.querySelector('.oad-toc-pers');
    if (!box || !pers) return;
    const st = _oadState(c);
    const cur = _oadCurrent(c), todayId = OAD_WORKS[_oadTodayIndex()].id;
    const input = c.querySelector('.oad-toc-input');
    const q = _oadFold(input ? input.value.trim() : '');
    const per = c._oadTocPer || '';
    const counts = {};
    OAD_WORKS.forEach(w => { counts[w.per] = (counts[w.per] || 0) + 1; });
    pers.innerHTML = [['', 'Toutes', OAD_WORKS.length]].concat(_OAD_PERIODS.filter(p => counts[p]).map(p => [p, p, counts[p]]))
        .map(([k, n, nb]) => `<button type="button" class="oad-chip${per === k ? ' is-on' : ''}" data-oad-action="toc-per" data-p="${_oadEsc(k)}">${_oadEsc(n)} <span class="oad-chip-n">${nb}</span></button>`).join('');
    const match = w => (!per || w.per === per) &&
        (!q || _oadFold([w.t, w.a, w.d, w.m, w.mv, w.tech].join(' ')).indexOf(q) !== -1);
    let html = '', total = 0;
    _OAD_PERIODS.forEach(p => {
        const year = w => { const m = String(w.d).match(/\d{4}/); return m ? +m[0] : 0; };
        const list = OAD_WORKS.filter(w => w.per === p && match(w)).sort((a, b) => year(a) - year(b));
        if (!list.length) return;
        total += list.length;
        html += `<div class="oad-toc-grp">${_oadEsc(p)} <span>(${list.length})</span></div>` + list.map(w => {
            const badges = (w.id === todayId ? '<span class="oad-badge oad-badge-day">Œuvre du jour</span>' : '') +
                           (w.id === cur.id ? '<span class="oad-badge oad-badge-cur">Affichée</span>' : '');
            return `<div class="oad-toc-it${w.id === cur.id ? ' is-cur' : ''}" role="button" tabindex="0" data-oad-action="toc-pick" data-id="${_oadEsc(w.id)}" title="Travailler sur « ${_oadEsc(w.t)} »">
                ${_oadThumb(w)}
                <span class="oad-toc-txt"><span class="oad-toc-t">${_oadEsc(w.t)}</span>
                <span class="oad-toc-a">${_oadEsc(w.a)} · ${_oadEsc(w.d)}</span></span>
                <span class="oad-toc-b">${badges}</span></div>`;
        }).join('');
    });
    box.innerHTML = total ? html
        : '<div class="oad-toc-empty">Aucune œuvre ne correspond à ta recherche.</div>';
}
function _oadTocOpen(c, open) {
    const t = c.querySelector('.oad-toc');
    if (!t) return;
    t.hidden = open === undefined ? !t.hidden : !open;
    const b = c.querySelector('.oad-tools [data-oad-action="toc"]');
    if (b) b.classList.toggle('is-on', !t.hidden);
    if (t.hidden) return;
    const h = c.querySelector('.oad-help');
    if (h) h.hidden = true;
    _oadRenderToc(c);
    const cur = t.querySelector('.oad-toc-it.is-cur');
    if (cur) cur.scrollIntoView({ block: 'center' });
    const input = c.querySelector('.oad-toc-input');
    // Pas de clavier qui s'ouvre tout seul sur tablette / téléphone
    if (input && !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
        try { input.focus({ preventScroll: true }); } catch (e) {}
    }
}
function oadTocFilter(input) {
    const c = input.closest('.oad-w');
    if (c) _oadRenderToc(c);
}
function oadTocKey(e, input) {
    e.stopPropagation();                        // pas de raccourcis du tableau pendant la saisie
    const c = input.closest('.oad-w');
    if (!c) return;
    if (e.key === 'Escape') { e.preventDefault(); _oadTocOpen(c, false); }
    else if (e.key === 'Enter') {
        e.preventDefault();
        const first = c.querySelector('.oad-toc-it');
        if (first) { _oadGo(c, first.getAttribute('data-id'), false); _oadTocOpen(c, false); }
    }
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-oad-action]');
    if (!btn) return;
    const c = btn.closest('.oad-w');
    if (!c) return;
    const st = _oadState(c);
    const w = _oadCurrent(c);
    const n = OAD_WORKS.length, i = OAD_WORKS.indexOf(w);
    const act = btn.getAttribute('data-oad-action');
    // Un clic sur un bouton à l'intérieur de l'image ne doit pas basculer le mode projection
    if (act === 'present' && btn.classList.contains('oad-art') && e.target.closest('button, .oad-link')) return;
    switch (act) {
        case 'prev':   _oadGo(c, OAD_WORKS[(i - 1 + n) % n].id, false); break;
        case 'next':   _oadGo(c, OAD_WORKS[(i + 1) % n].id, false); break;
        case 'today':
            _oadGo(c, OAD_WORKS[_oadTodayIndex()].id, true);
            _oadFlash(c, '📅 Œuvre du jour');
            break;
        case 'random': {
            let j = i;
            while (n > 1 && j === i) j = Math.floor(Math.random() * n);
            _oadGo(c, OAD_WORKS[j].id, false);
            break;
        }
        case 'present':
            st.present = !st.present;
            _oadRender(c); _oadSave();
            break;
        case 'q-next':
            st.qn = Math.min(w.q.length, (st.qn || 1) + 1);
            _oadRenderPanel(c, w); _oadSave();
            break;
        case 'reveal':
            st.revealed = true; st.qn = w.q.length;
            _oadRenderPanel(c, w); _oadSave();
            break;
        case 'hide':
            st.revealed = false;
            _oadRenderPanel(c, w); _oadSave();
            break;
        case 'retry':
            c._oadShown = null; _oadRender(c);
            break;
        case 'wiki':
            e.stopPropagation();
            _oadLaunch(c, _oadWikiLink(w, _oadImgCache[w.id]));
            break;
        case 'font-down':
            st.fs = Math.max(0.8, Math.round(((st.fs || 1) - 0.1) * 10) / 10);
            c.style.setProperty('--oad-fs', st.fs); _oadSave();
            break;
        case 'font-up':
            st.fs = Math.min(1.8, Math.round(((st.fs || 1) + 0.1) * 10) / 10);
            c.style.setProperty('--oad-fs', st.fs); _oadSave();
            break;
        case 'toc':       _oadTocOpen(c); break;
        case 'toc-close': _oadTocOpen(c, false); break;
        case 'toc-per':
            c._oadTocPer = btn.getAttribute('data-p') || '';
            _oadRenderToc(c);
            break;
        case 'toc-pick': {
            const id = btn.getAttribute('data-id');
            if (!_oadById(id)) break;
            if (id === OAD_WORKS[_oadTodayIndex()].id) _oadGo(c, id, true);   // on retrouve l'œuvre du jour
            else _oadGo(c, id, false);
            _oadTocOpen(c, false);
            _oadFlash(c, '🖼️ ' + _oadById(id).t);
            break;
        }
        case 'help': {
            const h = c.querySelector('.oad-help');
            if (h) h.hidden = !h.hidden;
            if (h && !h.hidden) _oadTocOpen(c, false);
            break;
        }
        case 'help-close': { const h = c.querySelector('.oad-help'); if (h) h.hidden = true; break; }
    }
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.oad-w .oad-help:not([hidden])').forEach(h => { h.hidden = true; });
    document.querySelectorAll('.oad-w .oad-toc:not([hidden])').forEach(t => _oadTocOpen(t.closest('.oad-w'), false));
}, true);
document.addEventListener('keydown', e => {
    if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.closest) return;
    const it = e.target.closest('.oad-w .oad-toc-it');
    if (!it) return;
    e.preventDefault(); e.stopPropagation();
    it.click();
});

/* ── Déplacement du widget en tirant la barre de titre ───────────── */
function _oadDragStart(e) {
    const bar = e.currentTarget, c = bar.closest('.oad-w');
    if (!c || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest('button, .wf-btns, .oad-tools, input')) return;
    e.stopPropagation();                                    // le tableau ne gère pas ce glisser
    if (c.classList.contains('wf-media-fullboard')) return; // pas de déplacement en plein écran
    e.preventDefault();
    const w = c.closest('.widget') || c;
    const cs = getComputedStyle(w);
    if (cs.position === 'static') w.style.position = 'absolute';
    const r = w.getBoundingClientRect();
    const sx = (w.offsetWidth && r.width / w.offsetWidth) || 1;
    const sy = (w.offsetHeight && r.height / w.offsetHeight) || 1;
    const L0 = parseFloat(cs.left) || w.offsetLeft || 0, T0 = parseFloat(cs.top) || w.offsetTop || 0;
    const X0 = e.clientX, Y0 = e.clientY;
    let moved = false;
    try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    bar.classList.add('is-dragging');
    const move = ev => {
        const dx = (ev.clientX - X0) / sx, dy = (ev.clientY - Y0) / sy;
        if (!moved) {
            if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
            moved = true;
            if (typeof snapshotNow === 'function') try { snapshotNow(); } catch (err) {}
        }
        w.style.left = (L0 + dx) + 'px';
        w.style.top = (T0 + dy) + 'px';
    };
    const end = () => {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', end);
        bar.removeEventListener('pointercancel', end);
        bar.classList.remove('is-dragging');
        if (moved) _oadSave();
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
}
function _oadBindDrag(c) {
    const bar = c.querySelector('.oad-bar');
    if (!bar || bar._oadDrag) return;
    bar._oadDrag = true;
    bar.addEventListener('pointerdown', _oadDragStart);
    ['mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, ev => {
        if (!ev.target.closest('button, .wf-btns')) ev.stopPropagation();
    }));
}

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _oadInit(c) {
    if (!c || c._oadInited || !c.classList.contains('oad-w')) return;
    c._oadInited = true;
    const bar = c.querySelector('.oad-bar');
    if (bar) { bar.classList.add('editor-toolbar'); bar.title = 'Glisser pour déplacer'; }
    const help = c.querySelector('.oad-help');
    if (help) help.hidden = true;
    const toc = c.querySelector('.oad-toc');
    if (toc) toc.hidden = true;
    c._oadShown = null;
    _oadBindDrag(c);
    _oadRender(c);
    new MutationObserver(() => _oadFitFullboard(c)).observe(c, { attributes: true, attributeFilter: ['class'] });
    _oadFitFullboard(c);
}
// Passage à minuit (ou retour sur l'onglet le lendemain) : nouvelle œuvre du jour
setInterval(() => {
    document.querySelectorAll('.oad-w').forEach(c => {
        const st = c._oad;
        if (st && st.follow && st.day !== _oadDayKey()) { _oadRender(c); _oadSave(); }
    });
}, 60000);

/* ── Plein écran sur téléphone : laisser la place des onglets À GAUCHE ──
   Même principe que les widgets Qwant Junior, Dictionnaire et QR code. */
const _OAD_PHONE_Q = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';
const _OAD_TABS_W = 40;
const _OAD_FS_PROPS = ['position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'max-width', 'max-height', 'margin', 'transform'];
function _oadIsPhone() {
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia(_OAD_PHONE_Q).matches);
}
function _oadFitFullboard(c) {
    const on = c.classList.contains('wf-media-fullboard') && _oadIsPhone();
    if (!on) { _oadUnfit(c); return; }
    if (c._oadFsBusy) return;
    c._oadFsBusy = true;
    if (!c._oadFsFitted) {
        c._oadFsSaved = {};
        _OAD_FS_PROPS.forEach(p => { c._oadFsSaved[p] = [c.style.getPropertyValue(p), c.style.getPropertyPriority(p)]; });
    }
    c._oadFsMine = c._oadFsMine || {};
    const set = (p, v) => { c.style.setProperty(p, v, 'important'); c._oadFsMine[p] = c.style.getPropertyValue(p); };
    const vw = window.innerWidth, vh = window.innerHeight;
    set('position', 'fixed'); set('inset', 'auto'); set('margin', '0'); set('transform', 'none');
    set('top', '0px'); set('left', _OAD_TABS_W + 'px');
    set('right', 'auto'); set('bottom', 'auto');
    set('width', (vw - _OAD_TABS_W) + 'px'); set('height', vh + 'px');
    set('max-width', 'none'); set('max-height', 'none');
    c._oadFsFitted = true;
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
        const sx = r.width / (vw - _OAD_TABS_W), sy = r.height / vh;
        const left = _OAD_TABS_W + (_OAD_TABS_W - r.left) / sx;
        const top  = (0 - r.top) / sy;
        if (Math.abs(r.left - _OAD_TABS_W) > 1 || Math.abs(sx - 1) > 0.01) {
            set('left', left + 'px');
            set('width', ((vw - _OAD_TABS_W) / sx) + 'px');
        }
        if (Math.abs(r.top) > 1 || Math.abs(sy - 1) > 0.01) {
            set('top', top + 'px');
            set('height', (vh / sy) + 'px');
        }
    }
    c._oadFsBusy = false;
}
function _oadUnfit(c) {
    if (!c._oadFsFitted) return;
    const saved = c._oadFsSaved || {}, mine = c._oadFsMine || {};
    _OAD_FS_PROPS.forEach(p => {
        if (!(p in mine) || c.style.getPropertyValue(p) !== mine[p]) return;
        const v = saved[p];
        if (v && v[0]) c.style.setProperty(p, v[0], v[1]); else c.style.removeProperty(p);
    });
    c._oadFsFitted = false; c._oadFsMine = {}; c._oadFsSaved = null;
}
window.addEventListener('resize', () => document.querySelectorAll('.oad-w.wf-media-fullboard').forEach(c => {
    _oadUnfit(c);
    _oadFitFullboard(c);
}));

function _oadScan(n) {
    if (!n || n.nodeType !== 1) return;
    if (n.matches('.oad-w')) _oadInit(n);
    else if (n.querySelectorAll) n.querySelectorAll('.oad-w').forEach(_oadInit);
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.closest && n.closest('.oad-stage, .oad-bar, .oad-help, .oad-toc')) return;
    _oadScan(n);
}))).observe(document.body, { childList: true, subtree: true });

/* ── Sauvegarde / restauration (appelées par save-load.js) ──────── */
window.oadGetData = function (widget) {
    const c = widget && widget.querySelector('.oad-w');
    if (!c) return null;
    const st = _oadState(c);
    return { follow: !!st.follow, id: st.id, day: st.day, qn: st.qn || 1, revealed: !!st.revealed, fs: st.fs || 1, present: !!st.present };
};
window.oadSetData = function (widget, d) {
    const c = widget && widget.querySelector('.oad-w');
    if (!c || !d) return;
    const st = _oadState(c);
    st.follow   = d.follow !== false;
    st.id       = _oadById(d.id) ? d.id : st.id;
    st.day      = typeof d.day === 'string' ? d.day : _oadDayKey();
    st.qn       = Math.max(1, parseInt(d.qn, 10) || 1);
    st.revealed = !!d.revealed;
    st.fs       = Math.max(0.8, Math.min(1.8, +d.fs || 1));
    st.present  = !!d.present;
    // Nouveau jour : _oadCurrent() passe à la nouvelle œuvre et remet questions / cartel à zéro
    if (!c._oadInited) _oadInit(c);
    else { c._oadShown = null; _oadRender(c); }
};

window.createOeuvreArtDuJourWidget = function () {
    return typeof createWidget === 'function' ? createWidget('oeuvre-art-du-jour') : null;
};

/* ── Styles ─────────────────────────────────────────────────────── */
(function () {
    if (document.getElementById('oad-styles')) return;
    const st = document.createElement('style');
    st.id = 'oad-styles';
    st.textContent = `
.editor-container.oad-w{
  --oad-accent:#c8892b; --oad-fs:1;
  container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.oad-w button{font-family:inherit}
.oad-w :focus-visible{outline:2px solid var(--oad-accent);outline-offset:2px}
/* Barre du haut */
.oad-w .oad-bar{flex:none;position:relative;z-index:10;height:40px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.oad-w .oad-bar-title{flex:1;min-width:0;font-weight:700;font-size:13px;color:#e6e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oad-w .oad-tools{flex:none;display:flex;align-items:center;gap:2px;margin-right:4px}
.oad-w .oad-sep{width:1px;height:18px;background:#3a3a46;margin:0 4px}
.oad-w .oad-ib{flex:none;min-width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#9a9aa6;
  font-size:13px;font-weight:800;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.oad-w .oad-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.oad-w .oad-ib.is-on{background:rgba(200,137,43,.32);color:#fff}
.oad-w .oad-ib-help{width:26px;min-width:26px;height:26px;border-radius:50%;background:rgba(200,137,43,.25);color:#f3cf8f;margin-left:2px}
.oad-w .oad-ib-help:hover{background:var(--oad-accent);color:#fff}
/* Zone principale : l'œuvre à gauche, le panneau à droite */
.oad-w .oad-stage{position:relative;flex:1;min-height:0;display:flex;background:#141418}
.oad-w .oad-art{position:relative;flex:1 1 58%;min-width:0;min-height:0;display:flex;flex-direction:column;
  background:radial-gradient(ellipse at 50% 40%,#34302a 0%,#1a1916 70%)}
.oad-w .oad-art-inner{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:18px 18px 6px;box-sizing:border-box}
.oad-w .oad-img{max-width:100%;max-height:100%;object-fit:contain;display:block;box-shadow:0 0 0 6px #2b2620,0 0 0 9px #8a6a3a,0 14px 34px rgba(0,0,0,.6);border-radius:1px}
.oad-w .oad-credit{flex:none;min-height:22px;padding:2px 10px 6px;text-align:center;font-size:10.5px;color:#8f887b}
.oad-w .oad-link{color:#e2b56a;text-decoration:underline}
.oad-w .oad-art-msg{text-align:center;color:#d8d2c4;max-width:340px;font-size:13px}
.oad-w .oad-art-ico{font-size:46px;line-height:1;margin-bottom:8px}
.oad-w .oad-art-t{font-size:17px;font-weight:800;color:#fff}
.oad-w .oad-art-s{margin-top:6px;color:#b7af9f;line-height:1.4}
.oad-w .oad-art-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
.oad-w .oad-spin{width:34px;height:34px;margin:0 auto 12px;border-radius:50%;border:4px solid rgba(255,255,255,.15);border-top-color:var(--oad-accent);animation:oad-spin .8s linear infinite}
@keyframes oad-spin{to{transform:rotate(360deg)}}
.oad-w .oad-panel{flex:0 0 42%;max-width:440px;min-width:0;overflow:auto;box-sizing:border-box;padding:14px 16px 16px;
  background:#fbf7ee;color:#2a2a33;font-size:calc(14px * var(--oad-fs));line-height:1.45;-webkit-overflow-scrolling:touch}
.oad-w.is-present .oad-panel{display:none}
.oad-w.is-present .oad-art-inner{padding:14px}
.oad-w .oad-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;margin-bottom:10px}
.oad-w .oad-day{font-weight:800;color:#5a4a2a;font-size:.92em}
.oad-w .oad-day-off{color:#8a7d66;font-weight:700}
.oad-w .oad-per{display:inline-block;padding:2px 10px;border-radius:99px;background:#efe3c8;color:#7a5a1e;font-weight:800;font-size:.78em}
.oad-w .oad-sec{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 1px 4px rgba(60,40,10,.08);margin-bottom:10px}
.oad-w .oad-sec-t{font-weight:900;color:#3a2e1a;margin-bottom:8px;font-size:1.02em}
.oad-w .oad-qs{list-style:none;margin:0;padding:0}
.oad-w .oad-q{display:none;gap:8px;align-items:flex-start;margin:6px 0}
.oad-w .oad-q.is-on{display:flex;animation:oad-in .25s ease}
@keyframes oad-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.oad-w .oad-q-n{flex:none;width:1.6em;height:1.6em;border-radius:50%;background:var(--oad-accent);color:#fff;font-weight:900;font-size:.85em;
  display:inline-flex;align-items:center;justify-content:center;margin-top:.05em}
.oad-w .oad-q-t{flex:1;min-width:0}
.oad-w .oad-btn{height:34px;border:0;border-radius:99px;padding:0 16px;background:var(--oad-accent);color:#fff;font-size:13px;font-weight:800;margin-top:6px}
.oad-w .oad-btn:hover{filter:brightness(1.08)}
.oad-w .oad-btn-soft{background:#f6ead3;color:#7a5a1e}
.oad-w .oad-btn-ghost{background:#eef0f4;color:#3d4a66}
.oad-w .oad-art .oad-btn-ghost{background:rgba(255,255,255,.14);color:#fff}
.oad-w .oad-mystery{color:#6b6252;font-style:italic;font-size:.95em}
.oad-w .oad-cartel{border-left:4px solid var(--oad-accent);padding:2px 0 2px 12px}
.oad-w .oad-title{font-size:1.3em;font-weight:900;color:#1f1a10;line-height:1.2}
.oad-w .oad-artist{font-weight:700;color:#7a5a1e;margin-top:2px}
.oad-w .oad-dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:10px 0 0;font-size:.92em}
.oad-w .oad-dl dt{color:#8a7d66;font-weight:700}
.oad-w .oad-dl dd{margin:0;color:#2a2a33}
.oad-w .oad-fact{margin-top:12px;padding:9px 12px;border-radius:10px;background:#fff6dd;color:#4a3d22;font-size:.93em}
.oad-w .oad-hide{height:28px;font-size:12px;padding:0 12px}
/* Sommaire */
.oad-w .oad-toc{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:stretch;justify-content:center;
  padding:12px;box-sizing:border-box;background:rgba(10,10,20,.6)}
.oad-w .oad-toc[hidden]{display:none}
.oad-w .oad-toc-card{width:100%;max-width:640px;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;background:#fbf7ee;color:#2a2a33;
  border-radius:16px;padding:12px 14px 10px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.oad-w .oad-toc-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;font-size:15px;color:#3a2e1a;margin-bottom:8px}
.oad-w .oad-toc-head .oad-ib{color:#666}
.oad-w .oad-toc-head .oad-ib:hover{background:#eee;color:#222}
.oad-w .oad-toc-search{flex:none;display:flex;align-items:center;height:38px;box-sizing:border-box;padding:0 12px;background:#fff;border:2px solid #e8dcc2;border-radius:99px}
.oad-w .oad-toc-search:focus-within{border-color:var(--oad-accent)}
.oad-w .oad-toc-ico{flex:none;font-size:14px;margin-right:8px}
.oad-w .oad-toc-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#222;font:inherit;font-size:14px;padding:0;
  user-select:text;-webkit-user-select:text}
.oad-w .oad-toc-pers{flex:none;display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 6px}
.oad-w .oad-chip{height:28px;border:0;border-radius:99px;padding:0 11px;background:#efe3c8;color:#7a5a1e;font-size:12px;font-weight:800}
.oad-w .oad-chip:hover{filter:brightness(.97)}
.oad-w .oad-chip.is-on{background:var(--oad-accent);color:#fff}
.oad-w .oad-chip-n{opacity:.7;font-weight:700}
.oad-w .oad-toc-list{flex:1;min-height:0;overflow:auto;margin:0 -6px;padding:0 6px 4px;-webkit-overflow-scrolling:touch}
.oad-w .oad-toc-grp{position:sticky;top:0;z-index:1;background:#fbf7ee;padding:8px 2px 4px;font-weight:900;color:#7a5a1e;font-size:13px}
.oad-w .oad-toc-grp span{opacity:.6}
.oad-w .oad-toc-it{display:flex;align-items:center;gap:10px;padding:6px 8px;margin:2px 0;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(60,40,10,.06)}
.oad-w .oad-toc-it:hover,.oad-w .oad-toc-it:focus-visible{background:#fff4dc}
.oad-w .oad-toc-it.is-cur{box-shadow:inset 0 0 0 2px var(--oad-accent)}
.oad-w .oad-toc-th{flex:none;width:44px;height:36px;border-radius:5px;overflow:hidden;background:#2b2620;display:flex;align-items:center;justify-content:center}
.oad-w .oad-toc-th img{width:100%;height:100%;object-fit:cover;display:block}
.oad-w .oad-toc-th.is-empty::before{content:"🖼️";font-size:16px;opacity:.75}
.oad-w .oad-toc-txt{flex:1;min-width:0;display:flex;flex-direction:column}
.oad-w .oad-toc-t{font-weight:800;color:#1f1a10;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oad-w .oad-toc-a{color:#7a6d55;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oad-w .oad-toc-b{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.oad-w .oad-badge{padding:1px 8px;border-radius:99px;font-size:10.5px;font-weight:800;white-space:nowrap}
.oad-w .oad-badge-day{background:#fff0c9;color:#8a5a00}
.oad-w .oad-badge-cur{background:var(--oad-accent);color:#fff}
.oad-w .oad-toc-empty{padding:24px 8px;text-align:center;color:#8a7d66;font-style:italic}
/* Aide */
.oad-w .oad-help{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:flex-start;justify-content:center;
  padding:14px;box-sizing:border-box;overflow:auto;background:rgba(10,10,20,.6)}
.oad-w .oad-help[hidden]{display:none}
.oad-w .oad-help-card{width:100%;max-width:560px;box-sizing:border-box;background:#fffdf7;color:#2a2a33;border-radius:16px;padding:12px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.oad-w .oad-help-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:15px;color:#1f2a44;margin-bottom:6px}
.oad-w .oad-help-head .oad-ib{color:#666}
.oad-w .oad-help-head .oad-ib:hover{background:#eee;color:#222}
.oad-w .oad-help-list{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
.oad-w .oad-help-list li{margin:4px 0}
.oad-w .oad-help-note{margin-top:10px;padding:8px 10px;border-radius:10px;background:#fff3d9;color:#6b4a12;font-size:12px}
/* Curseurs */
.editor-container.oad-w,.editor-container.oad-w *{cursor:default!important}
.oad-w .oad-stage,.oad-w .oad-stage *,.oad-w .oad-bar-title,.oad-w .oad-help,.oad-w .oad-toc-card{user-select:none;-webkit-user-select:none}
.oad-w .oad-toc-input{user-select:text!important;-webkit-user-select:text!important}
.editor-container.oad-w .oad-bar,.editor-container.oad-w .oad-bar .oad-bar-title{cursor:grab!important;touch-action:none}
.editor-container.oad-w .oad-bar.is-dragging,.editor-container.oad-w .oad-bar.is-dragging *{cursor:grabbing!important}
.editor-container.oad-w.wf-media-fullboard .oad-bar,.editor-container.oad-w.wf-media-fullboard .oad-bar-title{cursor:default!important}
.editor-container.oad-w button,.editor-container.oad-w button *,.editor-container.oad-w .oad-link,
.editor-container.oad-w .oad-toc-it,.editor-container.oad-w .oad-toc-it *{cursor:pointer!important}
.editor-container.oad-w .oad-toc-input{cursor:text!important}
.editor-container.oad-w .oad-art,.editor-container.oad-w .oad-art .oad-img{cursor:zoom-in!important}
.editor-container.oad-w.is-present .oad-art,.editor-container.oad-w.is-present .oad-art .oad-img{cursor:zoom-out!important}
/* Message temporaire */
.oad-w .oad-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:13;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.oad-w .oad-flash.is-on{opacity:1}
/* Widget étroit / téléphone : l'œuvre en haut, le panneau en dessous */
@container (max-width: 640px){
  .oad-w .oad-stage{flex-direction:column}
  .oad-w .oad-art{flex:0 0 52%}
  .oad-w.is-present .oad-art{flex:1 1 auto}
  .oad-w .oad-panel{flex:1 1 auto;max-width:none;padding:10px 12px 12px}
  .oad-w .oad-art-inner{padding:12px 12px 4px}
  .oad-w .oad-bar-title{font-size:0}
  .oad-w .oad-bar-title::before{content:"🖼️";font-size:15px}
}
@container (max-width: 400px){
  .oad-w .oad-sep,.oad-w [data-oad-action="font-down"],.oad-w [data-oad-action="font-up"],.oad-w .oad-tools [data-oad-action="random"]{display:none}
  .oad-w .oad-toc{padding:6px}
  .oad-w .oad-toc-card{padding:10px 10px 8px;border-radius:12px}
  .oad-w .oad-ib{min-width:26px;padding:0 4px}
}
@media print{ .oad-w .oad-bar{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_oadScan(document.body);
