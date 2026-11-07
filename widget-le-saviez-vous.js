// =========================================================================
// WIDGET LE SAVIEZ-VOUS ? — Le Bureau du Prof
// =========================================================================
// Une anecdote scientifique ou historique par jour, sur le modèle des
// widgets « Devinettes » et « Citations » :
//   - 📅 l'anecdote du jour (elle change toute seule chaque jour)
//   - 🎲 une anecdote au hasard
//   - 📚 sommaire : toutes les anecdotes par thème (recherche, filtres)
//        pour choisir celle dont on veut parler (questions seules, sans
//        les réponses, pour ne rien dévoiler à la classe)
//   - d'abord une question pour faire réfléchir la classe, puis
//     « Révéler » : la réponse et l'explication
//   - 6 thèmes : animaux, corps humain, espace, Terre et nature,
//     histoire, sciences et inventions (à choisir dans les réglages)
//   - « Mes anecdotes » : ajouter ses propres anecdotes
//   - 🔊 lire à voix haute, A− / A+ taille du texte, ? aide
//   - déplacement en tirant la barre de titre, redimensionnement libre
//   - boutons fenêtre jaune (réduire) / vert (plein écran board) / rouge (fermer)
//   - restauré après l'actualisation du tableau
//
// Utilisation : createWidget('le-saviez-vous')
// Le template #template-le-saviez-vous est injecté dans le DOM par ce fichier.
// Sauvegarde : window.lsvGetData(widget) / window.lsvSetData(widget, data)
// (appelés par save-load.js)
// =========================================================================

const _LSV_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _LSV_KEYS = ' onkeydown="event.stopPropagation()" onkeyup="event.stopPropagation()" onkeypress="event.stopPropagation()" onpaste="event.stopPropagation()"';

const LSV_CATS = {
    animaux:  { n: 'Animaux',               i: '🐾', col: '#e67e22' },
    corps:    { n: 'Corps humain',          i: '🫀', col: '#e74c3c' },
    espace:   { n: 'Espace',                i: '🚀', col: '#6c5ce7' },
    terre:    { n: 'Terre et nature',       i: '🌍', col: '#27ae60' },
    histoire: { n: 'Histoire',              i: '🏛️', col: '#b9770e' },
    sciences: { n: 'Sciences et inventions', i: '💡', col: '#2e86de' }
};

/* ── Les anecdotes ──────────────────────────────────────────────────
   c : thème · q : question pour faire réfléchir · a : réponse courte
   e : explication                                                      */
const LSV_FACTS = [
    // 🐾 Animaux
    { id: 'pieuvre-coeurs', c: 'animaux', q: 'Combien de cœurs a une pieuvre ?', a: 'Trois !', e: 'Deux cœurs envoient le sang vers les branchies pour qu’il se charge en oxygène, le troisième l’envoie dans le reste du corps. En plus, son sang est bleu !' },
    { id: 'flamant-rose', c: 'animaux', q: 'Les flamants roses naissent-ils roses ?', a: 'Non, ils naissent gris clair.', e: 'Ils deviennent roses grâce à ce qu’ils mangent : de petites crevettes et des algues qui contiennent un colorant naturel.' },
    { id: 'cheval-debout', c: 'animaux', q: 'Quel animal peut dormir debout sans tomber ?', a: 'Le cheval.', e: 'Un système de tendons « verrouille » ses pattes. Mais pour le sommeil profond, il doit quand même se coucher.' },
    { id: 'girafe-langue', c: 'animaux', q: 'De quelle couleur est la langue d’une girafe ?', a: 'Bleu foncé, presque violette.', e: 'Elle mesure environ 45 cm. Sa couleur sombre la protégerait des coups de soleil pendant que la girafe mange les feuilles des arbres.' },
    { id: 'escargot-dents', c: 'animaux', q: 'Les escargots ont-ils des dents ?', a: 'Oui, des milliers !', e: 'Elles sont minuscules et rangées sur une sorte de langue râpeuse, la radula, qui lui sert à gratter les feuilles.' },
    { id: 'colibri', c: 'animaux', q: 'Quel oiseau est capable de voler en marche arrière ?', a: 'Le colibri.', e: 'Ses ailes battent jusqu’à 50 fois par seconde ou plus. Il peut aussi faire du « sur-place » devant une fleur pour boire son nectar.' },
    { id: 'dauphin-sommeil', c: 'animaux', q: 'Comment dorment les dauphins ?', a: 'Avec une moitié du cerveau à la fois.', e: 'Pendant qu’une moitié se repose, l’autre reste éveillée pour remonter respirer à la surface et surveiller les dangers.' },
    { id: 'guepard', c: 'animaux', q: 'Quel est l’animal terrestre le plus rapide ?', a: 'Le guépard.', e: 'Il peut dépasser 100 km/h, mais seulement pendant quelques secondes : il s’épuise très vite.' },
    { id: 'baleine-bleue', c: 'animaux', q: 'Quel est le plus grand animal ayant jamais vécu sur Terre ?', a: 'La baleine bleue.', e: 'Elle peut mesurer environ 30 mètres de long : plus grande que tous les dinosaures connus ! Elle se nourrit pourtant de minuscules crevettes, le krill.' },
    { id: 'vache-estomac', c: 'animaux', q: 'Est-il vrai que la vache a quatre estomacs ?', a: 'Presque : elle a un estomac à quatre poches.', e: 'L’herbe passe d’une poche à l’autre. La vache la fait même remonter dans sa bouche pour la mâcher une deuxième fois : elle rumine.' },
    { id: 'koala', c: 'animaux', q: 'Combien d’heures par jour un koala peut-il dormir ?', a: 'Jusqu’à 18 à 20 heures !', e: 'Il ne mange que des feuilles d’eucalyptus, qui donnent très peu d’énergie. Il économise donc ses forces en dormant.' },
    { id: 'manchot-papa', c: 'animaux', q: 'Chez les manchots empereurs, qui garde l’œuf au chaud ?', a: 'Le papa.', e: 'Il le garde sur ses pattes, sous un repli de peau, pendant environ deux mois, au milieu de l’hiver antarctique, sans rien manger.' },
    { id: 'etoile-mer', c: 'animaux', q: 'Une étoile de mer a-t-elle un cerveau ?', a: 'Non !', e: 'Elle a un réseau de nerfs dans tout le corps. Et si elle perd un bras, elle peut le faire repousser.' },
    { id: 'chauve-souris', c: 'animaux', q: 'Quels sont les seuls mammifères capables de vraiment voler ?', a: 'Les chauves-souris.', e: 'Pour se repérer dans le noir, elles poussent des cris très aigus et écoutent l’écho qui revient : c’est l’écholocation.' },
    { id: 'cameleon', c: 'animaux', q: 'Quelle longueur peut atteindre la langue d’un caméléon ?', a: 'Jusqu’à deux fois la longueur de son corps !', e: 'Il la projette en une fraction de seconde pour attraper un insecte avec le bout collant.' },
    { id: 'fourmi-force', c: 'animaux', q: 'Une fourmi peut-elle soulever plus lourd qu’elle ?', a: 'Oui, de 10 à 50 fois son propre poids !', e: 'Pour un enfant, ce serait comme soulever une voiture. Les petits animaux sont très forts par rapport à leur taille.' },
    { id: 'araignee-insecte', c: 'animaux', q: 'L’araignée est-elle un insecte ?', a: 'Non, c’est un arachnide.', e: 'Les insectes ont 6 pattes. Les araignées en ont 8 et leur corps n’est pas fait des mêmes parties.' },
    { id: 'papillon-gout', c: 'animaux', q: 'Avec quoi les papillons goûtent-ils ?', a: 'Avec leurs pattes !', e: 'Leurs pattes portent des capteurs de goût : en se posant sur une feuille, la femelle sait si elle peut y pondre ses œufs.' },
    { id: 'pingouin-manchot', c: 'animaux', q: 'Quelle est la différence entre un pingouin et un manchot ?', a: 'Le pingouin vole, le manchot non.', e: 'Les pingouins vivent au nord, près de l’Arctique. Les manchots vivent dans l’hémisphère Sud et nagent très bien, mais ne volent pas.' },
    { id: 'abeille-vie', c: 'animaux', q: 'Combien de temps vit une abeille ouvrière en été ?', a: 'Environ 5 à 6 semaines.', e: 'Elle travaille sans arrêt : nettoyer la ruche, nourrir les larves, puis butiner. La reine, elle, peut vivre plusieurs années.' },
    // 🫀 Corps humain
    { id: 'os-206', c: 'corps', q: 'Combien d’os y a-t-il dans le corps d’un adulte ?', a: '206.', e: 'Un bébé en a environ 300 ! En grandissant, certains os se soudent entre eux, par exemple ceux du crâne.' },
    { id: 'etrier', c: 'corps', q: 'Où se trouve le plus petit os du corps ?', a: 'Dans l’oreille.', e: 'Il s’appelle l’étrier et mesure environ 3 millimètres. Il aide à transmettre les sons jusqu’à l’intérieur de l’oreille.' },
    { id: 'coeur-battements', c: 'corps', q: 'Combien de fois ton cœur bat-il en une journée ?', a: 'Environ 100 000 fois !', e: 'Il ne s’arrête jamais, même quand tu dors. C’est un muscle qui pompe le sang dans tout le corps.' },
    { id: 'empreintes', c: 'corps', q: 'Deux vrais jumeaux ont-ils les mêmes empreintes digitales ?', a: 'Non !', e: 'Les empreintes se forment avant la naissance et sont uniques pour chaque personne, même pour des jumeaux identiques.' },
    { id: 'cligner', c: 'corps', q: 'Combien de fois clignes-tu des yeux par minute ?', a: 'Environ 15 à 20 fois.', e: 'Cela nettoie et humidifie tes yeux. Devant un écran, on cligne beaucoup moins : les yeux se fatiguent plus vite.' },
    { id: 'peau-organe', c: 'corps', q: 'Quel est le plus grand organe du corps humain ?', a: 'La peau.', e: 'Étalée, la peau d’un adulte couvrirait environ 2 mètres carrés. Elle nous protège et se renouvelle sans cesse.' },
    { id: 'ongles', c: 'corps', q: 'Quels ongles poussent le plus vite : ceux des mains ou des pieds ?', a: 'Ceux des mains.', e: 'Ils poussent d’environ 3 millimètres par mois, deux à trois fois plus vite que ceux des pieds.' },
    { id: 'cerveau-energie', c: 'corps', q: 'Quelle part de l’énergie du corps le cerveau utilise-t-il ?', a: 'Environ un cinquième (20 %) !', e: 'Il ne pèse pourtant qu’environ 1,4 kg chez l’adulte. Réfléchir, ça consomme beaucoup d’énergie !' },
    { id: 'vaisseaux', c: 'corps', q: 'Quelle longueur feraient tous tes vaisseaux sanguins mis bout à bout ?', a: 'Environ 100 000 kilomètres !', e: 'Cela ferait plus de deux fois le tour de la Terre. La plupart sont de minuscules vaisseaux, les capillaires.' },
    { id: 'rotule-bebe', c: 'corps', q: 'Les bébés ont-ils des rotules aux genoux ?', a: 'Pas encore en os !', e: 'À la naissance, leurs rotules sont en cartilage, une matière souple. Elles deviennent des os vers l’âge de 3 à 5 ans.' },
    { id: 'papilles', c: 'corps', q: 'Les petits capteurs de goût de ta langue durent-ils toute la vie ?', a: 'Non, ils se renouvellent toutes les une à deux semaines.', e: 'Ces capteurs, cachés dans les papilles, permettent de sentir le sucré, le salé, l’acide, l’amer…' },
    { id: 'estomac-acide', c: 'corps', q: 'Pourquoi l’estomac ne se digère-t-il pas lui-même ?', a: 'Grâce à une couche de mucus protecteur.', e: 'L’estomac fabrique un liquide très acide pour digérer les aliments. Une couche gluante, renouvelée sans cesse, protège sa paroi.' },
    // 🚀 Espace
    { id: 'venus-jour', c: 'espace', q: 'Sur quelle planète une journée dure-t-elle plus longtemps qu’une année ?', a: 'Sur Vénus.', e: 'Vénus tourne très lentement sur elle-même : un tour prend 243 jours terrestres, alors qu’elle fait le tour du Soleil en 225 jours.' },
    { id: 'soleil-8min', c: 'espace', q: 'Combien de temps la lumière du Soleil met-elle pour arriver jusqu’à nous ?', a: 'Environ 8 minutes.', e: 'Elle parcourt près de 150 millions de kilomètres. Quand tu regardes le Soleil (jamais directement !), tu le vois tel qu’il était il y a 8 minutes.' },
    { id: 'traces-lune', c: 'espace', q: 'Les traces de pas des astronautes sont-elles encore sur la Lune ?', a: 'Oui !', e: 'Sur la Lune, il n’y a ni vent ni pluie pour les effacer. Elles pourraient rester là pendant des millions d’années.' },
    { id: 'jupiter', c: 'espace', q: 'Combien de Terres pourraient tenir dans Jupiter ?', a: 'Plus de 1 300 !', e: 'Jupiter est la plus grande planète du système solaire. C’est une géante faite surtout de gaz.' },
    { id: 'saturne-flotte', c: 'espace', q: 'Quelle planète pourrait flotter dans une baignoire géante ?', a: 'Saturne !', e: 'Elle est énorme mais très légère pour sa taille : elle est moins dense que l’eau.' },
    { id: 'soleil-taille', c: 'espace', q: 'Combien de Terres pourraient tenir dans le Soleil ?', a: 'Environ 1,3 million !', e: 'Le Soleil est une étoile, une énorme boule de gaz très chaude. C’est pourtant une étoile de taille moyenne.' },
    { id: 'mars-rouge', c: 'espace', q: 'Pourquoi la planète Mars est-elle rouge ?', a: 'À cause de la rouille !', e: 'Son sol contient beaucoup de fer qui a rouillé : c’est de l’oxyde de fer, comme sur un vieux clou.' },
    { id: 'espace-son', c: 'espace', q: 'Peut-on entendre une explosion dans l’espace ?', a: 'Non, l’espace est silencieux.', e: 'Le son a besoin d’air (ou d’eau…) pour voyager. Dans le vide de l’espace, il n’y a rien pour le transporter.' },
    { id: 'iss-soleil', c: 'espace', q: 'Combien de levers de soleil voient les astronautes de la Station spatiale chaque jour ?', a: 'Environ 16 !', e: 'La Station spatiale internationale fait le tour de la Terre en à peu près 90 minutes.' },
    { id: 'armstrong', c: 'espace', q: 'Qui a été le premier humain à marcher sur la Lune ?', a: 'Neil Armstrong, en 1969.', e: 'Il a dit : « C’est un petit pas pour l’homme, mais un bond de géant pour l’humanité. »' },
    { id: 'olympus-mons', c: 'espace', q: 'Où se trouve le plus grand volcan du système solaire ?', a: 'Sur Mars.', e: 'Il s’appelle Olympus Mons et mesure environ 22 km de haut : plus de deux fois la hauteur du mont Everest !' },
    // 🌍 Terre et nature
    { id: 'everest', c: 'terre', q: 'Quelle est la hauteur du mont Everest ?', a: '8 849 mètres.', e: 'C’est le plus haut sommet du monde, dans l’Himalaya, à la frontière entre le Népal et la Chine.' },
    { id: 'desert-antarctique', c: 'terre', q: 'Quel est le plus grand désert du monde ?', a: 'L’Antarctique !', e: 'Un désert est un endroit où il ne tombe presque pas de pluie ni de neige. Ce n’est pas forcément chaud.' },
    { id: 'arbre-vieux', c: 'terre', q: 'Quel âge a l’un des plus vieux arbres vivants du monde ?', a: 'Environ 4 800 ans !', e: 'C’est un pin des montagnes de Californie, surnommé « Mathusalem ». Il poussait déjà quand les pyramides d’Égypte ont été construites.' },
    { id: 'foudre-chaleur', c: 'terre', q: 'La foudre est-elle plus chaude que la surface du Soleil ?', a: 'Oui, environ 5 fois plus !', e: 'Un éclair peut atteindre 30 000 °C pendant un très court instant. La surface du Soleil est à environ 5 500 °C.' },
    { id: 'orage-distance', c: 'terre', q: 'Comment savoir à quelle distance se trouve un orage ?', a: 'En comptant les secondes entre l’éclair et le tonnerre.', e: 'La lumière arrive presque tout de suite, le son plus lentement. Environ 3 secondes = 1 kilomètre.' },
    { id: 'eau-terre', c: 'terre', q: 'Quelle part de la surface de la Terre est couverte d’eau ?', a: 'Environ 71 %.', e: 'Mais près de 97 % de cette eau est salée. L’eau douce que nous buvons est donc précieuse.' },
    { id: 'flocon', c: 'terre', q: 'Combien de branches a un flocon de neige ?', a: 'Six.', e: 'C’est dû à la façon dont les petites molécules d’eau s’accrochent entre elles en gelant. Chaque flocon a pourtant une forme unique.' },
    { id: 'pacifique', c: 'terre', q: 'Quel est le plus grand océan du monde ?', a: 'L’océan Pacifique.', e: 'Il est si grand que tous les continents réunis pourraient y tenir !' },
    { id: 'bambou', c: 'terre', q: 'De combien certains bambous peuvent-ils pousser en un jour ?', a: 'Jusqu’à presque 1 mètre !', e: 'Certaines espèces de bambou font partie des plantes qui poussent le plus vite au monde.' },
    { id: 'arc-en-ciel', c: 'terre', q: 'Où doit se trouver le Soleil pour qu’on voie un arc-en-ciel ?', a: 'Dans notre dos.', e: 'La lumière du Soleil entre dans les gouttes de pluie et s’y sépare en couleurs, comme dans un prisme.' },
    { id: 'terre-vitesse', c: 'terre', q: 'À quelle vitesse la Terre tourne-t-elle sur elle-même à l’équateur ?', a: 'Environ 1 670 km/h !', e: 'Nous ne le sentons pas car nous tournons avec elle, comme dans un avion qui vole bien droit.' },
    { id: 'tomate-fruit', c: 'terre', q: 'La tomate est-elle un fruit ou un légume ?', a: 'Un fruit, pour les botanistes !', e: 'Un fruit est la partie de la plante qui contient les graines. En cuisine, on la range pourtant avec les légumes.' },
    { id: 'fraise', c: 'terre', q: 'Où sont les vrais fruits d’une fraise ?', a: 'Ce sont les petits grains sur sa peau !', e: 'Chaque petit grain, appelé akène, est un vrai fruit. La partie rouge et sucrée est un « faux fruit ».' },
    // 🏛️ Histoire
    { id: 'tour-eiffel', c: 'histoire', q: 'La tour Eiffel devait-elle rester pour toujours ?', a: 'Non, elle devait être démontée au bout de 20 ans.', e: 'Construite pour l’Exposition universelle de 1889, elle a été sauvée car elle servait d’antenne pour la radio.' },
    { id: 'eiffel-ete', c: 'histoire', q: 'La tour Eiffel est-elle plus haute en été ?', a: 'Oui, d’environ 15 centimètres !', e: 'Avec la chaleur, le métal se dilate, c’est-à-dire qu’il s’allonge un peu. En hiver, il se rétracte.' },
    { id: 'pyramide', c: 'histoire', q: 'Pendant combien de temps la Grande Pyramide a-t-elle été le plus haut monument du monde ?', a: 'Environ 3 800 ans !', e: 'Elle a été construite en Égypte il y a environ 4 500 ans, pour le pharaon Khéops.' },
    { id: 'lascaux', c: 'histoire', q: 'Qui a découvert la grotte de Lascaux en 1940 ?', a: 'Quatre adolescents… et un chien !', e: 'Le chien, qui s’appelait Robot, serait tombé dans un trou. Les jeunes ont découvert des peintures vieilles d’environ 18 000 ans.' },
    { id: 'charlemagne', c: 'histoire', q: 'Charlemagne a-t-il inventé l’école ?', a: 'Non, c’est une légende !', e: 'Des écoles existaient bien avant lui. Mais il a encouragé leur création, surtout dans les églises et les monastères.' },
    { id: 'napoleon-taille', c: 'histoire', q: 'Napoléon était-il vraiment petit ?', a: 'Non, pas pour son époque.', e: 'Il mesurait environ 1,69 m, une taille normale au début des années 1800. Sa réputation vient en partie des caricatures anglaises.' },
    { id: 'montgolfiere', c: 'histoire', q: 'Qui ont été les premiers passagers d’une montgolfière ?', a: 'Un mouton, un canard et un coq !', e: 'C’était à Versailles, en septembre 1783. Deux mois plus tard, deux hommes ont fait le premier vol humain au-dessus de Paris.' },
    { id: 'vikings-cornes', c: 'histoire', q: 'Les Vikings portaient-ils des casques à cornes ?', a: 'Non !', e: 'Cette image vient de costumes de théâtre et d’opéra du XIXe siècle. Leurs casques étaient simples et sans cornes.' },
    { id: 'colomb-indiens', c: 'histoire', q: 'Pourquoi Christophe Colomb a-t-il appelé les habitants de l’Amérique des « Indiens » ?', a: 'Il croyait être arrivé en Inde !', e: 'En 1492, il cherchait une nouvelle route vers l’Asie en naviguant vers l’ouest. Il ne savait pas qu’un continent se trouvait sur son chemin.' },
    { id: 'muraille-lune', c: 'histoire', q: 'Voit-on la Grande Muraille de Chine depuis la Lune ?', a: 'Non, c’est une idée fausse.', e: 'Elle est très longue mais assez étroite. Depuis la Lune, on ne peut pas la distinguer à l’œil nu.' },
    { id: 'cacao-monnaie', c: 'histoire', q: 'À quoi servaient les fèves de cacao chez les Aztèques ?', a: 'De monnaie, pour payer !', e: 'Ils buvaient aussi le cacao en boisson épicée et amère, bien différente de notre chocolat sucré.' },
    { id: 'jeux-olympiques', c: 'histoire', q: 'Où ont eu lieu les premiers Jeux olympiques ?', a: 'À Olympie, en Grèce, il y a environ 2 800 ans.', e: 'Les Jeux modernes ont été relancés en 1896 à Athènes, grâce au Français Pierre de Coubertin.' },
    { id: 'toutankhamon', c: 'histoire', q: 'À quel âge Toutankhamon est-il devenu pharaon ?', a: 'Vers 9 ans !', e: 'Sa tombe, pleine de trésors, a été découverte presque intacte en 1922 par l’archéologue Howard Carter.' },
    { id: 'romains-linge', c: 'histoire', q: 'Avec quoi les Romains lavaient-ils parfois leurs vêtements ?', a: 'Avec de l’urine !', e: 'L’urine contient de l’ammoniac, qui aide à enlever les taches. Des récipients étaient même installés dans les rues pour la récolter.' },
    // 💡 Sciences et inventions
    { id: 'post-it', c: 'sciences', q: 'Comment les Post-it ont-ils été inventés ?', a: 'Grâce à une colle « ratée » !', e: 'Un chimiste avait fabriqué une colle qui collait mal. Un collègue a eu l’idée de s’en servir pour des marque-pages repositionnables.' },
    { id: 'micro-ondes', c: 'sciences', q: 'Comment a-t-on découvert le four à micro-ondes ?', a: 'Grâce à une barre chocolatée fondue !', e: 'Un ingénieur qui travaillait près d’un appareil à ondes a remarqué que le chocolat dans sa poche avait fondu.' },
    { id: 'braille', c: 'sciences', q: 'Quel âge avait Louis Braille quand il a inventé son alphabet ?', a: '15 ans !', e: 'Aveugle depuis l’enfance, il a inventé une écriture faite de points en relief, qu’on lit avec le bout des doigts.' },
    { id: 'pasteur', c: 'sciences', q: 'Contre quelle maladie Louis Pasteur a-t-il mis au point un vaccin en 1885 ?', a: 'La rage.', e: 'Il l’a utilisé pour soigner un jeune garçon, Joseph Meister, mordu par un chien enragé. L’enfant a survécu.' },
    { id: 'ordinateur', c: 'sciences', q: 'Combien pesait l’un des premiers ordinateurs ?', a: 'Environ 30 tonnes !', e: 'Construit en 1946 aux États-Unis, il remplissait une grande salle. Un téléphone d’aujourd’hui est des milliers de fois plus puissant.' },
    { id: 'miel', c: 'sciences', q: 'Le miel peut-il se périmer ?', a: 'Presque jamais !', e: 'Bien fermé, il se conserve très longtemps : on a retrouvé du miel encore mangeable dans des tombes de l’Égypte ancienne.' },
    { id: 'son-vitesse', c: 'sciences', q: 'Le son va-t-il plus vite dans l’air ou dans l’eau ?', a: 'Dans l’eau, environ 4 fois plus vite.', e: 'Dans l’air, le son parcourt environ 340 mètres par seconde ; dans l’eau, environ 1 500 mètres par seconde.' },
    { id: 'eau-montagne', c: 'sciences', q: 'L’eau bout-elle toujours à 100 °C ?', a: 'Non, en montagne elle bout plus tôt.', e: 'Plus on monte, moins l’air appuie sur l’eau. Au sommet de l’Everest, elle bout vers 70 °C : les pâtes y cuisent mal !' },
    { id: 'stylo-bille', c: 'sciences', q: 'Qui a inventé le stylo à bille ?', a: 'László Bíró, un journaliste hongrois.', e: 'Dans les années 1930, il voulait un stylo qui sèche vite, comme l’encre des journaux. En 1950, le Français Marcel Bich l’a rendu très populaire.' },
    { id: 'imprimerie', c: 'sciences', q: 'Qui a inventé l’imprimerie en Europe ?', a: 'Gutenberg, vers 1450.', e: 'Avant lui, les livres étaient recopiés à la main. Grâce à ses lettres en métal mobiles, on a pu fabriquer beaucoup de livres plus vite.' },
    { id: 'mot-long', c: 'sciences', q: 'Quel est l’un des plus longs mots de la langue française ?', a: '« Anticonstitutionnellement » : 25 lettres !', e: 'Il veut dire « d’une manière contraire à la Constitution ». Essaie de l’écrire sans te tromper !' }
];

document.body.insertAdjacentHTML('beforeend', `
<template id="template-le-saviez-vous">
    <div class="editor-container lsv-w" style="height:460px;width:640px;">
        <div class="lsv-bar editor-toolbar" title="Glisser pour déplacer">
            <span class="lsv-bar-title">💡 Le saviez-vous ?</span>
            <div class="lsv-tools"${_LSV_STOP}>
                <button type="button" class="lsv-ib" data-lsv-action="today" title="L’anecdote du jour">📅</button>
                <button type="button" class="lsv-ib" data-lsv-action="random" title="Une anecdote au hasard">🎲</button>
                <button type="button" class="lsv-ib" data-lsv-action="toc" title="Sommaire : choisir une anecdote">📚</button>
                <span class="lsv-sep"></span>
                <button type="button" class="lsv-ib" data-lsv-action="speak" title="Lire à voix haute">🔊</button>
                <button type="button" class="lsv-ib" data-lsv-action="font-down" title="Texte plus petit">A−</button>
                <button type="button" class="lsv-ib" data-lsv-action="font-up" title="Texte plus grand">A+</button>
                <button type="button" class="lsv-ib" data-lsv-action="settings" title="Réglages et mes anecdotes">⚙</button>
                <button type="button" class="lsv-ib lsv-ib-help" data-lsv-action="help" title="Aide">?</button>
            </div>
            <div class="wf-btns"${_LSV_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"           onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="lsv-stage"${_LSV_STOP}>
            <div class="lsv-card"></div>
            <div class="lsv-flash"></div>
        </div>
        <div class="lsv-panel lsv-settings" hidden${_LSV_STOP}>
            <div class="lsv-panel-card">
                <div class="lsv-panel-head">
                    <span>⚙ Réglages</span>
                    <button type="button" class="lsv-ib" data-lsv-action="settings-close" title="Fermer les réglages">✕</button>
                </div>
                <div class="lsv-row-t">Thèmes des anecdotes</div>
                <div class="lsv-cats"></div>
                <label class="lsv-check"><input type="checkbox" class="lsv-opt-answer" data-lsv-change="answer"> Afficher la réponse tout de suite (sans question)</label>
                <label class="lsv-check"><input type="checkbox" class="lsv-opt-custom" data-lsv-change="custom"> Inclure mes anecdotes dans l’anecdote du jour et le hasard</label>
                <div class="lsv-row-t">✏️ Mes anecdotes</div>
                <div class="lsv-form">
                    <select class="lsv-f-cat" title="Thème"></select>
                    <input type="text" class="lsv-f-q" maxlength="160" placeholder="La question (ex. : Combien de pattes a une araignée ?)"${_LSV_KEYS}>
                    <input type="text" class="lsv-f-a" maxlength="120" placeholder="La réponse (ex. : Huit !)"${_LSV_KEYS}>
                    <textarea class="lsv-f-e" maxlength="400" rows="2" placeholder="L’explication (facultatif)"${_LSV_KEYS}></textarea>
                    <button type="button" class="lsv-btn" data-lsv-action="custom-add">➕ Ajouter</button>
                </div>
                <div class="lsv-mine"></div>
            </div>
        </div>
        <div class="lsv-toc" hidden${_LSV_STOP}>
            <div class="lsv-toc-card">
                <div class="lsv-toc-head">
                    <span>📚 Sommaire des anecdotes</span>
                    <button type="button" class="lsv-ib" data-lsv-action="toc-close" title="Fermer le sommaire">✕</button>
                </div>
                <div class="lsv-toc-search">
                    <span class="lsv-toc-ico">🔍</span>
                    <input type="text" class="lsv-toc-input" spellcheck="false" autocomplete="off"
                           placeholder="Chercher un mot : pieuvre, Lune, Napoléon…"
                           onkeydown="lsvTocKey(event,this)" onkeyup="event.stopPropagation()" onkeypress="event.stopPropagation()"
                           onpaste="event.stopPropagation()" oninput="lsvTocFilter(this)">
                </div>
                <div class="lsv-toc-cats"></div>
                <div class="lsv-toc-list"></div>
            </div>
        </div>
        <div class="lsv-panel lsv-help" hidden${_LSV_STOP}>
            <div class="lsv-panel-card">
                <div class="lsv-panel-head">
                    <span>❓ Comment utiliser « Le saviez-vous ? »</span>
                    <button type="button" class="lsv-ib" data-lsv-action="help-close" title="Fermer l'aide">✕</button>
                </div>
                <ul class="lsv-help-list">
                    <li><b>📅 L’anecdote du jour :</b> elle change toute seule chaque jour. Idéal pour le rituel du matin.</li>
                    <li><b>🎲 Au hasard :</b> une autre anecdote, quand on en veut encore !</li>
                    <li><b>📚 Sommaire :</b> toutes les anecdotes, classées par thème. Cherche un mot, filtre par thème, puis clique sur celle de ton choix. Seules les questions sont affichées : les réponses restent secrètes !</li>
                    <li><b>La question d’abord :</b> laisse la classe réfléchir et faire des hypothèses, puis clique sur <b>Révéler</b> pour la réponse et l’explication.</li>
                    <li><b>🔊 Lire :</b> fait lire la question (et la réponse si elle est affichée) par l’ordinateur.</li>
                    <li><b>A− / A+ :</b> rend le texte plus petit ou plus grand pour la projection.</li>
                    <li><b>⚙ Réglages :</b> choisis les thèmes, affiche directement la réponse, ou ajoute <b>tes propres anecdotes</b>.</li>
                    <li><b>Fenêtre :</b> tire la barre du haut pour déplacer le widget, le coin pour l’agrandir. Bouton jaune : réduire, vert : plein écran, rouge : fermer.</li>
                </ul>
                <div class="lsv-help-note">${LSV_FACTS.length} anecdotes sont proposées dans 6 thèmes : animaux, corps humain, espace, Terre et nature, histoire, sciences et inventions.</div>
            </div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _lsvEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function _lsvSave() { if (typeof saveBoard === 'function') try { saveBoard(); } catch (e) {} }
function _lsvFlash(c, text, ms) {
    const f = c && c.querySelector('.lsv-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 2000);
}
function _lsvDayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function _lsvDayNumber(d) {
    d = d || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}
function _lsvDateLabel() {
    try {
        const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (e) { return ''; }
}

/* ── État du widget ─────────────────────────────────────────────── */
function _lsvState(c) {
    if (!c._lsv) c._lsv = { mode: 'jour', id: '', day: _lsvDayKey(), revealed: false, cats: Object.keys(LSV_CATS),
                            showAnswer: false, useCustom: true, custom: [], fs: 1 };
    return c._lsv;
}
// Les anecdotes proposées : thèmes choisis + (éventuellement) mes anecdotes
function _lsvPool(c) {
    const st = _lsvState(c);
    const cats = st.cats && st.cats.length ? st.cats : Object.keys(LSV_CATS);
    let pool = LSV_FACTS.filter(f => cats.indexOf(f.c) !== -1);
    if (st.useCustom) pool = pool.concat(st.custom.filter(f => cats.indexOf(f.c) !== -1));
    return pool.length ? pool : LSV_FACTS.slice();
}
function _lsvFind(c, id) {
    const st = _lsvState(c);
    return LSV_FACTS.find(f => f.id === id) || st.custom.find(f => f.id === id) || null;
}
// L'anecdote du jour : un numéro de jour et un pas premier avec la taille de
// la liste, pour parcourir toutes les anecdotes avant d'en revoir une.
function _lsvTodayFact(c) {
    const pool = _lsvPool(c), n = pool.length;
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    let step = 1;
    for (let s = 23; s < 23 + n; s++) if (gcd(s, n) === 1) { step = s % n || 1; break; }
    return pool[((_lsvDayNumber() * step) % n + n) % n];
}
function _lsvCurrent(c) {
    const st = _lsvState(c);
    if (st.mode === 'jour') {
        const f = _lsvTodayFact(c);
        if (st.id !== f.id || st.day !== _lsvDayKey()) { st.id = f.id; st.day = _lsvDayKey(); st.revealed = false; }
        return f;
    }
    return _lsvFind(c, st.id) || _lsvTodayFact(c);
}

/* ── Affichage ──────────────────────────────────────────────────── */
function _lsvRender(c) {
    const card = c.querySelector('.lsv-card');
    if (!card) return;
    const st = _lsvState(c);
    const f = _lsvCurrent(c);
    const cat = LSV_CATS[f.c] || LSV_CATS.sciences;
    const open = st.revealed || st.showAnswer;
    c.style.setProperty('--lsv-fs', st.fs || 1);
    c.style.setProperty('--lsv-cat', cat.col);
    card.innerHTML = `
        <div class="lsv-top">
            <span class="lsv-cat">${cat.i} ${_lsvEsc(cat.n)}</span>
            <span class="lsv-when">${st.mode === 'jour' ? '📅 ' + _lsvEsc(_lsvDateLabel()) : st.mode === 'choix' ? '📚 Choisie dans le sommaire' : '🎲 Au hasard'}${f.mine ? ' · ✏️ Mon anecdote' : ''}</span>
        </div>
        <div class="lsv-body">
            <div class="lsv-kicker">Le saviez-vous ?</div>
            <div class="lsv-q">${_lsvEsc(f.q)}</div>
            ${open ? `
            <div class="lsv-ans">
                <div class="lsv-a">${_lsvEsc(f.a)}</div>
                ${f.e ? `<div class="lsv-e">${_lsvEsc(f.e)}</div>` : ''}
            </div>
            ${st.showAnswer ? '' : '<button type="button" class="lsv-btn lsv-btn-ghost lsv-hide" data-lsv-action="hide">Cacher la réponse</button>'}`
            : `<div class="lsv-think">🤔 Qu’en pensez-vous ? Faites des hypothèses…</div>
               <button type="button" class="lsv-btn lsv-reveal" data-lsv-action="reveal">✨ Révéler la réponse</button>`}
        </div>`;
    const tb = c.querySelector('.lsv-tools [data-lsv-action="today"]');
    if (tb) tb.classList.toggle('is-on', st.mode === 'jour');
}
function _lsvRenderSettings(c) {
    const st = _lsvState(c);
    const box = c.querySelector('.lsv-cats');
    if (box) box.innerHTML = Object.keys(LSV_CATS).map(k => {
        const on = st.cats.indexOf(k) !== -1;
        const nb = LSV_FACTS.filter(f => f.c === k).length + st.custom.filter(f => f.c === k).length;
        return `<button type="button" class="lsv-chip${on ? ' is-on' : ''}" data-lsv-action="cat" data-k="${k}" style="--cc:${LSV_CATS[k].col}" aria-pressed="${on}">${LSV_CATS[k].i} ${_lsvEsc(LSV_CATS[k].n)} <span>${nb}</span></button>`;
    }).join('');
    const oa = c.querySelector('.lsv-opt-answer'); if (oa) oa.checked = !!st.showAnswer;
    const oc = c.querySelector('.lsv-opt-custom'); if (oc) oc.checked = !!st.useCustom;
    const sel = c.querySelector('.lsv-f-cat');
    if (sel && !sel.options.length) sel.innerHTML = Object.keys(LSV_CATS).map(k => `<option value="${k}">${LSV_CATS[k].i} ${_lsvEsc(LSV_CATS[k].n)}</option>`).join('');
    const mine = c.querySelector('.lsv-mine');
    if (mine) mine.innerHTML = st.custom.length
        ? st.custom.map(f => `<div class="lsv-mi"><span class="lsv-mi-c">${(LSV_CATS[f.c] || LSV_CATS.sciences).i}</span>
              <span class="lsv-mi-t" data-lsv-action="show-mine" data-id="${_lsvEsc(f.id)}" title="Afficher cette anecdote"><b>${_lsvEsc(f.q)}</b> — ${_lsvEsc(f.a)}</span>
              <button type="button" class="lsv-mi-x" data-lsv-action="custom-del" data-id="${_lsvEsc(f.id)}" title="Supprimer" aria-label="Supprimer">✕</button></div>`).join('')
        : '<div class="lsv-mine-empty">Aucune anecdote ajoutée pour l’instant.</div>';
}
function _lsvPanel(c, which, force) {
    const p = c.querySelector('.lsv-' + which), other = c.querySelector(which === 'help' ? '.lsv-settings' : '.lsv-help');
    if (!p) return;
    p.hidden = force === undefined ? !p.hidden : !force;
    if (!p.hidden && other) other.hidden = true;
    if (!p.hidden) _lsvTocOpen(c, false);
    if (!p.hidden && which === 'settings') _lsvRenderSettings(c);
    const b = c.querySelector('.lsv-tools [data-lsv-action="settings"]');
    if (b) b.classList.toggle('is-on', !c.querySelector('.lsv-settings').hidden);
}

function _lsvSpeak(c) {
    if (!('speechSynthesis' in window)) { _lsvFlash(c, '🔇 La lecture à voix haute n’est pas disponible ici'); return; }
    const st = _lsvState(c), f = _lsvCurrent(c);
    let txt = 'Le saviez-vous ? ' + f.q;
    if (st.revealed || st.showAnswer) txt += ' ' + f.a + (f.e ? ' ' + f.e : '');
    try {
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }   // second clic = arrêter
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'fr-FR'; u.rate = 0.92;
        const fr = speechSynthesis.getVoices().find(v => /^fr(-|_|$)/i.test(v.lang));
        if (fr) u.voice = fr;
        speechSynthesis.speak(u);
    } catch (e) { _lsvFlash(c, '🔇 Lecture impossible'); }
}

/* ── Sommaire des anecdotes ──────────────────────────────────────── */
const _lsvFold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').toLowerCase();
function _lsvRenderToc(c) {
    const box = c.querySelector('.lsv-toc-list'), chips = c.querySelector('.lsv-toc-cats');
    if (!box || !chips) return;
    const st = _lsvState(c);
    const cur = _lsvCurrent(c), todayId = _lsvTodayFact(c).id;
    const input = c.querySelector('.lsv-toc-input');
    const q = _lsvFold(input ? input.value.trim() : '');
    const flt = c._lsvTocCat || '';
    const all = LSV_FACTS.concat(st.custom);
    const counts = {};
    all.forEach(f => { counts[f.c] = (counts[f.c] || 0) + 1; });
    const chipList = [['', '📋', 'Tous', all.length]]
        .concat(Object.keys(LSV_CATS).filter(k => counts[k]).map(k => [k, LSV_CATS[k].i, LSV_CATS[k].n, counts[k]]));
    if (st.custom.length) chipList.push(['mine', '✏️', 'Mes anecdotes', st.custom.length]);
    chips.innerHTML = chipList.map(([k, i, n, nb]) =>
        `<button type="button" class="lsv-tchip${flt === k ? ' is-on' : ''}" data-lsv-action="toc-cat" data-k="${k}"${LSV_CATS[k] ? ` style="--cc:${LSV_CATS[k].col}"` : ''}>${i} ${_lsvEsc(n)} <span>${nb}</span></button>`).join('');
    // La recherche porte aussi sur la réponse et l'explication (utile au maître), mais seules les questions s'affichent
    const match = f => (!flt || (flt === 'mine' ? !!f.mine : f.c === flt)) &&
        (!q || _lsvFold([f.q, f.a, f.e].join(' ')).indexOf(q) !== -1);
    const item = f => {
        const cat = LSV_CATS[f.c] || LSV_CATS.sciences;
        const off = st.cats.indexOf(f.c) === -1 || (f.mine && !st.useCustom);
        const badges = (f.id === todayId && !off ? '<span class="lsv-badge lsv-badge-day">Du jour</span>' : '') +
                       (f.id === cur.id ? '<span class="lsv-badge lsv-badge-cur">Affichée</span>' : '');
        return `<div class="lsv-toc-it${f.id === cur.id ? ' is-cur' : ''}" role="button" tabindex="0" data-lsv-action="toc-pick" data-id="${_lsvEsc(f.id)}" style="--cc:${cat.col}" title="Afficher cette anecdote">
            <span class="lsv-toc-dot">${f.mine ? '✏️' : cat.i}</span>
            <span class="lsv-toc-t">${_lsvEsc(f.q)}</span>
            <span class="lsv-toc-b">${badges}</span></div>`;
    };
    let html = '', total = 0;
    Object.keys(LSV_CATS).forEach(k => {
        const list = LSV_FACTS.filter(f => f.c === k && match(f));
        if (!list.length) return;
        total += list.length;
        const off = st.cats.indexOf(k) === -1;
        html += `<div class="lsv-toc-grp" style="--cc:${LSV_CATS[k].col}">${LSV_CATS[k].i} ${_lsvEsc(LSV_CATS[k].n)} <span>(${list.length})</span>` +
                (off ? '<em>thème désactivé dans les réglages</em>' : '') + '</div>' + list.map(item).join('');
    });
    const mine = st.custom.filter(match);
    if (mine.length) {
        total += mine.length;
        html += `<div class="lsv-toc-grp" style="--cc:#8a6400">✏️ Mes anecdotes <span>(${mine.length})</span></div>` + mine.map(item).join('');
    }
    box.innerHTML = total ? html : '<div class="lsv-toc-empty">Aucune anecdote ne correspond à ta recherche.</div>';
}
function _lsvTocOpen(c, open) {
    const t = c.querySelector('.lsv-toc');
    if (!t) return;
    t.hidden = open === undefined ? !t.hidden : !open;
    const b = c.querySelector('.lsv-tools [data-lsv-action="toc"]');
    if (b) b.classList.toggle('is-on', !t.hidden);
    if (t.hidden) return;
    c.querySelectorAll('.lsv-panel').forEach(p => { p.hidden = true; });
    const sb = c.querySelector('.lsv-tools [data-lsv-action="settings"]');
    if (sb) sb.classList.remove('is-on');
    _lsvRenderToc(c);
    const cur = t.querySelector('.lsv-toc-it.is-cur');
    if (cur) cur.scrollIntoView({ block: 'center' });
    const input = c.querySelector('.lsv-toc-input');
    // Pas de clavier qui s'ouvre tout seul sur tablette / téléphone
    if (input && !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
        try { input.focus({ preventScroll: true }); } catch (e) {}
    }
}
function _lsvPick(c, id) {
    const st = _lsvState(c), f = _lsvFind(c, id);
    if (!f) return;
    // L'anecdote du jour choisie dans le sommaire : on repasse en mode « du jour »
    if (id === _lsvTodayFact(c).id) { st.mode = 'jour'; st.id = ''; }
    else { st.mode = 'choix'; st.id = id; }
    st.revealed = false;
    _lsvTocOpen(c, false);
    _lsvRender(c); _lsvSave();
}
function lsvTocFilter(input) {
    const c = input.closest('.lsv-w');
    if (c) _lsvRenderToc(c);
}
function lsvTocKey(e, input) {
    e.stopPropagation();                        // pas de raccourcis du tableau pendant la saisie
    const c = input.closest('.lsv-w');
    if (!c) return;
    if (e.key === 'Escape') { e.preventDefault(); _lsvTocOpen(c, false); }
    else if (e.key === 'Enter') {
        e.preventDefault();
        const first = c.querySelector('.lsv-toc-it');
        if (first) _lsvPick(c, first.getAttribute('data-id'));
    }
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-lsv-action]');
    if (!btn) return;
    const c = btn.closest('.lsv-w');
    if (!c) return;
    const st = _lsvState(c);
    switch (btn.getAttribute('data-lsv-action')) {
        case 'today':
            st.mode = 'jour'; st.id = ''; st.revealed = false;
            _lsvRender(c); _lsvSave();
            _lsvFlash(c, '📅 Anecdote du jour');
            break;
        case 'random': {
            const pool = _lsvPool(c), cur = _lsvCurrent(c);
            let f = cur;
            for (let k = 0; k < 20 && pool.length > 1 && f.id === cur.id; k++) f = pool[Math.floor(Math.random() * pool.length)];
            st.mode = 'hasard'; st.id = f.id; st.revealed = false;
            _lsvRender(c); _lsvSave();
            break;
        }
        case 'toc':       _lsvTocOpen(c); break;
        case 'toc-close': _lsvTocOpen(c, false); break;
        case 'toc-cat':   c._lsvTocCat = btn.getAttribute('data-k') || ''; _lsvRenderToc(c); break;
        case 'toc-pick':  _lsvPick(c, btn.getAttribute('data-id')); break;
        case 'reveal': st.revealed = true;  _lsvRender(c); _lsvSave(); break;
        case 'hide':   st.revealed = false; _lsvRender(c); _lsvSave(); break;
        case 'speak':  _lsvSpeak(c); break;
        case 'font-down':
            st.fs = Math.max(0.7, Math.round(((st.fs || 1) - 0.1) * 10) / 10);
            c.style.setProperty('--lsv-fs', st.fs); _lsvSave();
            break;
        case 'font-up':
            st.fs = Math.min(2, Math.round(((st.fs || 1) + 0.1) * 10) / 10);
            c.style.setProperty('--lsv-fs', st.fs); _lsvSave();
            break;
        case 'settings':       _lsvPanel(c, 'settings'); break;
        case 'settings-close': _lsvPanel(c, 'settings', false); break;
        case 'help':           _lsvPanel(c, 'help'); break;
        case 'help-close':     _lsvPanel(c, 'help', false); break;
        case 'cat': {
            const k = btn.getAttribute('data-k');
            const i = st.cats.indexOf(k);
            if (i !== -1) {
                if (st.cats.length === 1) { _lsvFlash(c, 'Garde au moins un thème'); break; }
                st.cats.splice(i, 1);
            } else st.cats.push(k);
            _lsvRenderSettings(c); _lsvRender(c); _lsvSave();
            break;
        }
        case 'custom-add': {
            const q = c.querySelector('.lsv-f-q'), a = c.querySelector('.lsv-f-a'), ex = c.querySelector('.lsv-f-e'), sel = c.querySelector('.lsv-f-cat');
            const qv = q.value.trim(), av = a.value.trim();
            if (!qv || !av) { _lsvFlash(c, 'Écris au moins la question et la réponse'); (qv ? a : q).focus(); break; }
            const f = { id: 'mine-' + Date.now().toString(36), c: sel.value || 'sciences', q: qv, a: av, e: ex.value.trim(), mine: true };
            st.custom.push(f);
            if (st.cats.indexOf(f.c) === -1) st.cats.push(f.c);
            q.value = a.value = ex.value = '';
            st.mode = 'hasard'; st.id = f.id; st.revealed = false;
            _lsvRenderSettings(c); _lsvRender(c); _lsvSave();
            _lsvFlash(c, '✅ Anecdote ajoutée');
            break;
        }
        case 'custom-del': {
            const id = btn.getAttribute('data-id');
            st.custom = st.custom.filter(f => f.id !== id);
            if (st.id === id) { st.mode = 'jour'; st.id = ''; st.revealed = false; }
            _lsvRenderSettings(c); _lsvRender(c); _lsvSave();
            break;
        }
        case 'show-mine':
            st.mode = 'choix'; st.id = btn.getAttribute('data-id'); st.revealed = false;
            _lsvPanel(c, 'settings', false);
            _lsvRender(c); _lsvSave();
            break;
    }
});
document.addEventListener('change', e => {
    const el = e.target.closest && e.target.closest('[data-lsv-change]');
    if (!el) return;
    const c = el.closest('.lsv-w');
    if (!c) return;
    const st = _lsvState(c);
    if (el.getAttribute('data-lsv-change') === 'answer') st.showAnswer = el.checked;
    else st.useCustom = el.checked;
    _lsvRender(c); _lsvSave();
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.lsv-w .lsv-panel:not([hidden])').forEach(p => _lsvPanel(p.closest('.lsv-w'), p.classList.contains('lsv-help') ? 'help' : 'settings', false));
    document.querySelectorAll('.lsv-w .lsv-toc:not([hidden])').forEach(t => _lsvTocOpen(t.closest('.lsv-w'), false));
}, true);
document.addEventListener('keydown', e => {
    if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.closest) return;
    const it = e.target.closest('.lsv-w .lsv-toc-it');
    if (!it) return;
    e.preventDefault(); e.stopPropagation();
    it.click();
});

/* ── Déplacement du widget en tirant la barre de titre ───────────── */
function _lsvDragStart(e) {
    const bar = e.currentTarget, c = bar.closest('.lsv-w');
    if (!c || (e.button !== undefined && e.button !== 0)) return;
    if (e.target.closest('button, .wf-btns, .lsv-tools, input')) return;
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
        if (moved) _lsvSave();
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
}
function _lsvBindDrag(c) {
    const bar = c.querySelector('.lsv-bar');
    if (!bar || bar._lsvDrag) return;
    bar._lsvDrag = true;
    bar.addEventListener('pointerdown', _lsvDragStart);
    ['mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, ev => {
        if (!ev.target.closest('button, .wf-btns')) ev.stopPropagation();
    }));
}

/* ── Mise en route des widgets (nouveaux ou restaurés) ───────────── */
function _lsvInit(c) {
    if (!c || c._lsvInited || !c.classList.contains('lsv-w')) return;
    c._lsvInited = true;
    const bar = c.querySelector('.lsv-bar');
    if (bar) { bar.classList.add('editor-toolbar'); bar.title = 'Glisser pour déplacer'; }
    c.querySelectorAll('.lsv-panel, .lsv-toc').forEach(p => { p.hidden = true; });
    _lsvBindDrag(c);
    _lsvRender(c);
    new MutationObserver(() => _lsvFitFullboard(c)).observe(c, { attributes: true, attributeFilter: ['class'] });
    _lsvFitFullboard(c);
    _lsvPhoneAutoFullboard(c);
}

/* ── Sur téléphone : le widget s'ouvre directement en plein écran board
      (comme un appui sur le bouton vert), à la place du plein écran
      téléphone générique (.phone-fs) posé par index.html ─────────── */
function _lsvDropPhoneFs(c) {
    const w = c.closest('.widget');
    if (!w || !w.classList.contains('phone-fs')) return;
    w.classList.remove('phone-fs');
    // Plus aucun autre widget en plein écran téléphone : on retire le bouton ⤡ et l'état du body
    if (!document.querySelector('.widget.phone-fs')) {
        document.querySelectorAll('.phone-fs-exit').forEach(b => b.remove());
        document.body.classList.remove('has-phone-fs');
    }
}
function _lsvPhoneAutoFullboard(c) {
    if (c._lsvAutoFs) return;
    c._lsvAutoFs = true;
    // On attend que createWidget / la restauration aient fini de placer le widget
    setTimeout(() => {
        if (!c.isConnected || !_lsvIsPhoneOrTablet()) return;
        if (!c.classList.contains('wf-media-fullboard')) {
            if (typeof toggleMediaBoardFullscreen === 'function') toggleMediaBoardFullscreen(c);
            else c.classList.add('wf-media-fullboard');
        }
        _lsvDropPhoneFs(c);
        _lsvFitFullboard(c);
        // Si le script téléphone repose .phone-fs plus tard, le plein écran board reste prioritaire
        const w = c.closest('.widget');
        if (w && !w._lsvPfsObs) {
            w._lsvPfsObs = true;
            new MutationObserver(() => {
                if (c.classList.contains('wf-media-fullboard') && _lsvIsPhone()) _lsvDropPhoneFs(c);
            }).observe(w, { attributes: true, attributeFilter: ['class'] });
        }
    }, 60);
}
// Passage à minuit : nouvelle anecdote du jour
setInterval(() => {
    document.querySelectorAll('.lsv-w').forEach(c => {
        const st = c._lsv;
        if (st && st.mode === 'jour' && st.day !== _lsvDayKey()) { _lsvRender(c); _lsvSave(); }
    });
}, 60000);

/* ── Plein écran (bouton vert) sur téléphone : laisser la place des onglets à gauche ── */
const _LSV_PHONE_Q = '(max-width: 768px), (max-height: 500px) and (pointer: coarse)';
const _LSV_TABS_W = 40;
const _LSV_FS_PROPS = ['position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'max-width', 'max-height', 'margin', 'transform'];
// Téléphone OU tablette (ouverture automatique en plein écran)
function _lsvIsPhoneOrTablet() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    if (typeof window.isPhoneScreen === 'function' && window.isPhoneScreen()) return true;
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}
function _lsvIsPhone() {
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia(_LSV_PHONE_Q).matches);
}
function _lsvFitFullboard(c) {
    const on = c.classList.contains('wf-media-fullboard') && _lsvIsPhone();
    if (!on) { _lsvUnfit(c); return; }
    if (c._lsvFsBusy) return;
    c._lsvFsBusy = true;
    if (!c._lsvFsFitted) {
        c._lsvFsSaved = {};
        _LSV_FS_PROPS.forEach(p => { c._lsvFsSaved[p] = [c.style.getPropertyValue(p), c.style.getPropertyPriority(p)]; });
    }
    c._lsvFsMine = c._lsvFsMine || {};
    const set = (p, v) => { c.style.setProperty(p, v, 'important'); c._lsvFsMine[p] = c.style.getPropertyValue(p); };
    const vw = window.innerWidth, vh = window.innerHeight;
    set('position', 'fixed'); set('inset', 'auto'); set('margin', '0'); set('transform', 'none');
    set('top', '0px'); set('left', _LSV_TABS_W + 'px');
    set('right', 'auto'); set('bottom', 'auto');
    set('width', (vw - _LSV_TABS_W) + 'px'); set('height', vh + 'px');
    set('max-width', 'none'); set('max-height', 'none');
    c._lsvFsFitted = true;
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
        const sx = r.width / (vw - _LSV_TABS_W), sy = r.height / vh;
        if (Math.abs(r.left - _LSV_TABS_W) > 1 || Math.abs(sx - 1) > 0.01) {
            set('left', (_LSV_TABS_W + (_LSV_TABS_W - r.left) / sx) + 'px');
            set('width', ((vw - _LSV_TABS_W) / sx) + 'px');
        }
        if (Math.abs(r.top) > 1 || Math.abs(sy - 1) > 0.01) {
            set('top', ((0 - r.top) / sy) + 'px');
            set('height', (vh / sy) + 'px');
        }
    }
    c._lsvFsBusy = false;
}
function _lsvUnfit(c) {
    if (!c._lsvFsFitted) return;
    const saved = c._lsvFsSaved || {}, mine = c._lsvFsMine || {};
    _LSV_FS_PROPS.forEach(p => {
        if (!(p in mine) || c.style.getPropertyValue(p) !== mine[p]) return;
        const v = saved[p];
        if (v && v[0]) c.style.setProperty(p, v[0], v[1]); else c.style.removeProperty(p);
    });
    c._lsvFsFitted = false; c._lsvFsMine = {}; c._lsvFsSaved = null;
}
window.addEventListener('resize', () => document.querySelectorAll('.lsv-w.wf-media-fullboard').forEach(c => { _lsvUnfit(c); _lsvFitFullboard(c); }));

function _lsvScan(n) {
    if (!n || n.nodeType !== 1) return;
    if (n.matches('.lsv-w')) _lsvInit(n);
    else if (n.querySelectorAll) n.querySelectorAll('.lsv-w').forEach(_lsvInit);
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.closest && n.closest('.lsv-stage, .lsv-bar, .lsv-panel, .lsv-toc')) return;
    _lsvScan(n);
}))).observe(document.body, { childList: true, subtree: true });

/* ── Sauvegarde / restauration (appelées par save-load.js) ──────── */
window.lsvGetData = function (widget) {
    const c = widget && widget.querySelector('.lsv-w');
    if (!c) return null;
    const st = _lsvState(c);
    return { mode: st.mode, id: st.id, day: st.day, revealed: !!st.revealed, cats: st.cats.slice(),
             showAnswer: !!st.showAnswer, useCustom: !!st.useCustom, custom: st.custom.map(f => Object.assign({}, f)), fs: st.fs || 1 };
};
window.lsvSetData = function (widget, d) {
    const c = widget && widget.querySelector('.lsv-w');
    if (!c || !d) return;
    const st = _lsvState(c);
    st.mode       = d.mode === 'hasard' || d.mode === 'choix' ? d.mode : 'jour';
    st.id         = typeof d.id === 'string' ? d.id : '';
    st.day        = typeof d.day === 'string' ? d.day : _lsvDayKey();
    st.revealed   = !!d.revealed;
    st.cats       = Array.isArray(d.cats) ? d.cats.filter(k => LSV_CATS[k]) : Object.keys(LSV_CATS);
    if (!st.cats.length) st.cats = Object.keys(LSV_CATS);
    st.showAnswer = !!d.showAnswer;
    st.useCustom  = d.useCustom !== false;
    st.custom     = Array.isArray(d.custom) ? d.custom
        .filter(f => f && typeof f.q === 'string' && typeof f.a === 'string')
        .map(f => ({ id: String(f.id || ('mine-' + Math.random().toString(36).slice(2))), c: LSV_CATS[f.c] ? f.c : 'sciences',
                     q: f.q, a: f.a, e: typeof f.e === 'string' ? f.e : '', mine: true })) : [];
    st.fs         = Math.max(0.7, Math.min(2, +d.fs || 1));
    // Nouveau jour en mode « du jour » : _lsvCurrent() passe à la nouvelle anecdote
    if (!c._lsvInited) _lsvInit(c); else _lsvRender(c);
};

window.createLeSaviezVousWidget = function () {
    return typeof createWidget === 'function' ? createWidget('le-saviez-vous') : null;
};

/* ── Styles ─────────────────────────────────────────────────────── */
(function () {
    if (document.getElementById('lsv-styles')) return;
    const st = document.createElement('style');
    st.id = 'lsv-styles';
    st.textContent = `
.editor-container.lsv-w{
  --lsv-accent:#f5b301; --lsv-cat:#2e86de; --lsv-fs:1;
  container-type:size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.lsv-w button,.lsv-w select,.lsv-w input,.lsv-w textarea{font-family:inherit}
.lsv-w :focus-visible{outline:2px solid var(--lsv-accent);outline-offset:2px}
/* Barre du haut */
.lsv-w .lsv-bar{flex:none;position:relative;z-index:10;height:40px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;background:#232329;border-bottom:1px solid #2f2f37;visibility:visible;opacity:1;user-select:none;-webkit-user-select:none}
.lsv-w .lsv-bar-title{flex:1;min-width:0;font-weight:700;font-size:13px;color:#e6e6ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsv-w .lsv-tools{flex:none;display:flex;align-items:center;gap:2px;margin-right:4px}
.lsv-w .lsv-sep{width:1px;height:18px;background:#3a3a46;margin:0 4px}
.lsv-w .lsv-ib{flex:none;min-width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#9a9aa6;
  font-size:13px;font-weight:800;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.lsv-w .lsv-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.lsv-w .lsv-ib.is-on{background:rgba(245,179,1,.28);color:#fff}
.lsv-w .lsv-ib-help{width:26px;min-width:26px;height:26px;border-radius:50%;background:rgba(245,179,1,.22);color:#ffd970;margin-left:2px}
.lsv-w .lsv-ib-help:hover{background:var(--lsv-accent);color:#222}
/* Zone principale */
.lsv-w .lsv-stage{position:relative;flex:1;min-height:0;display:flex;align-items:stretch;justify-content:center;padding:14px;box-sizing:border-box;overflow:auto;
  background:radial-gradient(circle at 10% 10%,color-mix(in srgb,var(--lsv-cat) 45%,transparent),transparent 50%),radial-gradient(circle at 92% 95%,rgba(245,179,1,.30),transparent 50%),#1b1c26}
.lsv-w .lsv-card{width:100%;max-width:900px;margin:auto;box-sizing:border-box;display:flex;flex-direction:column;background:#fffdf6;color:#2a2a33;
  border-radius:20px;box-shadow:0 12px 30px rgba(0,0,0,.4);overflow:hidden;font-size:calc(clamp(13px,2.6cqw,22px) * var(--lsv-fs))}
.lsv-w .lsv-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;padding:.7em 1.1em;background:var(--lsv-cat);color:#fff}
.lsv-w .lsv-cat{font-weight:900;font-size:.85em}
.lsv-w .lsv-when{font-weight:700;font-size:.75em;opacity:.92}
.lsv-w .lsv-body{padding:1em 1.3em 1.2em;text-align:center}
.lsv-w .lsv-kicker{display:inline-block;padding:.15em .8em;border-radius:99px;background:#fff3c4;color:#8a6400;font-weight:900;font-size:.72em;letter-spacing:.3px;text-transform:uppercase}
.lsv-w .lsv-q{margin:.5em auto 0;max-width:30em;font-size:1.45em;font-weight:900;line-height:1.25;color:#1f2a44}
.lsv-w .lsv-think{margin-top:.8em;color:#7a7a88;font-style:italic;font-size:.9em}
.lsv-w .lsv-ans{margin:.9em auto 0;max-width:34em;animation:lsv-in .3s ease}
@keyframes lsv-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.lsv-w .lsv-a{display:inline-block;padding:.35em .9em;border-radius:14px;background:color-mix(in srgb,var(--lsv-cat) 15%,#fff);
  color:color-mix(in srgb,var(--lsv-cat) 75%,#000);border:2px solid color-mix(in srgb,var(--lsv-cat) 35%,#fff);
  font-size:1.3em;font-weight:900;line-height:1.25}
.lsv-w .lsv-e{margin-top:.7em;color:#3d3d48;line-height:1.5;font-size:.95em}
.lsv-w .lsv-btn{height:2.3em;min-height:32px;border:0;border-radius:99px;padding:0 1.2em;background:var(--lsv-accent);color:#2a2000;font-size:.85em;font-weight:900;margin-top:.9em;
  box-shadow:0 4px 12px rgba(245,179,1,.35)}
.lsv-w .lsv-btn:hover{filter:brightness(1.05)}
.lsv-w .lsv-btn-ghost{background:#eef0f4;color:#3d4a66;box-shadow:none;font-size:.7em;height:2.2em}
/* Sommaire */
.lsv-w .lsv-toc{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:stretch;justify-content:center;
  padding:12px;box-sizing:border-box;background:rgba(10,10,20,.6)}
.lsv-w .lsv-toc[hidden]{display:none}
.lsv-w .lsv-toc-card{width:100%;max-width:640px;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;background:#fffdf6;color:#2a2a33;
  border-radius:16px;padding:12px 14px 10px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.lsv-w .lsv-toc-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;font-size:15px;color:#1f2a44;margin-bottom:8px}
.lsv-w .lsv-toc-head .lsv-ib{color:#666}
.lsv-w .lsv-toc-head .lsv-ib:hover{background:#eee;color:#222}
.lsv-w .lsv-toc-search{flex:none;display:flex;align-items:center;height:38px;box-sizing:border-box;padding:0 12px;background:#fff;border:2px solid #ebe3c9;border-radius:99px}
.lsv-w .lsv-toc-search:focus-within{border-color:#d49a00}
.lsv-w .lsv-toc-ico{flex:none;font-size:14px;margin-right:8px}
.lsv-w .lsv-toc-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#222;font:inherit;font-size:14px;padding:0;
  user-select:text!important;-webkit-user-select:text!important}
.lsv-w .lsv-toc-cats{flex:none;display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 6px}
.lsv-w .lsv-tchip{height:28px;border:2px solid #e3dfd2;border-radius:99px;padding:0 10px;background:#fff;color:#5a5a66;font-size:12px;font-weight:800}
.lsv-w .lsv-tchip span{opacity:.6;font-weight:700}
.lsv-w .lsv-tchip.is-on{border-color:var(--cc,#d49a00);background:var(--cc,#d49a00);color:#fff}
.lsv-w .lsv-toc-list{flex:1;min-height:0;overflow:auto;margin:0 -6px;padding:0 6px 4px;-webkit-overflow-scrolling:touch}
.lsv-w .lsv-toc-grp{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;background:#fffdf6;padding:8px 2px 4px;
  font-weight:900;color:color-mix(in srgb,var(--cc) 80%,#000);font-size:13px}
.lsv-w .lsv-toc-grp span{opacity:.6}
.lsv-w .lsv-toc-grp em{font-weight:600;font-size:11px;color:#8a8a96;font-style:italic}
.lsv-w .lsv-toc-it{display:flex;align-items:center;gap:10px;padding:7px 8px 7px 10px;margin:2px 0;border-radius:10px;background:#fff;
  border-left:4px solid var(--cc);box-shadow:0 1px 2px rgba(60,40,10,.06)}
.lsv-w .lsv-toc-it:hover,.lsv-w .lsv-toc-it:focus-visible{background:#fff7dc}
.lsv-w .lsv-toc-it.is-cur{box-shadow:inset 0 0 0 2px var(--cc)}
.lsv-w .lsv-toc-dot{flex:none;font-size:14px}
.lsv-w .lsv-toc-t{flex:1;min-width:0;font-weight:700;color:#1f2a44;font-size:13.5px;line-height:1.3}
.lsv-w .lsv-toc-b{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.lsv-w .lsv-badge{padding:1px 8px;border-radius:99px;font-size:10.5px;font-weight:800;white-space:nowrap}
.lsv-w .lsv-badge-day{background:#fff0c9;color:#8a5a00}
.lsv-w .lsv-badge-cur{background:#d49a00;color:#fff}
.lsv-w .lsv-toc-empty{padding:24px 8px;text-align:center;color:#8a8a96;font-style:italic}
/* Panneaux Réglages et Aide */
.lsv-w .lsv-panel{position:absolute;left:0;right:0;top:40px;bottom:0;z-index:14;display:flex;align-items:flex-start;justify-content:center;
  padding:12px;box-sizing:border-box;overflow:auto;background:rgba(10,10,20,.6)}
.lsv-w .lsv-panel[hidden]{display:none}
.lsv-w .lsv-panel-card{width:100%;max-width:560px;box-sizing:border-box;background:#fffdf7;color:#2a2a33;border-radius:16px;padding:12px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.lsv-w .lsv-panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:15px;color:#1f2a44;margin-bottom:6px}
.lsv-w .lsv-panel-head .lsv-ib{color:#666}
.lsv-w .lsv-panel-head .lsv-ib:hover{background:#eee;color:#222}
.lsv-w .lsv-row-t{margin:12px 0 6px;font-weight:800;font-size:13px;color:#1f2a44}
.lsv-w .lsv-cats{display:flex;flex-wrap:wrap;gap:6px}
.lsv-w .lsv-chip{height:30px;border:2px solid #e3dfd2;border-radius:99px;padding:0 11px;background:#fff;color:#5a5a66;font-size:12.5px;font-weight:800}
.lsv-w .lsv-chip span{opacity:.6;font-weight:700}
.lsv-w .lsv-chip.is-on{border-color:var(--cc);background:var(--cc);color:#fff}
.lsv-w .lsv-check{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;color:#3d3d48}
.lsv-w .lsv-check input{width:17px;height:17px;accent-color:#d49a00}
.lsv-w .lsv-form{display:grid;grid-template-columns:1fr;gap:6px}
.lsv-w .lsv-form select,.lsv-w .lsv-form input,.lsv-w .lsv-form textarea{width:100%;box-sizing:border-box;border:2px solid #e3dfd2;border-radius:10px;padding:7px 10px;
  font-size:13.5px;color:#222;background:#fff;outline:0;user-select:text;-webkit-user-select:text}
.lsv-w .lsv-form textarea{resize:vertical;min-height:44px}
.lsv-w .lsv-form select:focus,.lsv-w .lsv-form input:focus,.lsv-w .lsv-form textarea:focus{border-color:#d49a00}
.lsv-w .lsv-form .lsv-btn{justify-self:start;margin-top:2px;font-size:13px;height:34px}
.lsv-w .lsv-mine{margin-top:10px;display:flex;flex-direction:column;gap:4px}
.lsv-w .lsv-mi{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border-radius:10px;background:#f6f2e6;font-size:13px}
.lsv-w .lsv-mi-c{flex:none}
.lsv-w .lsv-mi-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#3d3d48}
.lsv-w .lsv-mi-t:hover{text-decoration:underline}
.lsv-w .lsv-mi-x{flex:none;width:26px;height:26px;border:0;border-radius:50%;background:transparent;color:#999;font-size:11px;padding:0}
.lsv-w .lsv-mi-x:hover{background:#c0392b;color:#fff}
.lsv-w .lsv-mine-empty{color:#8a8a96;font-style:italic;font-size:12.5px}
.lsv-w .lsv-help-list{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
.lsv-w .lsv-help-list li{margin:4px 0}
.lsv-w .lsv-help-note{margin-top:10px;padding:8px 10px;border-radius:10px;background:#fff3c4;color:#6b5000;font-size:12px}
/* Curseurs */
.editor-container.lsv-w,.editor-container.lsv-w *{cursor:default!important}
.lsv-w .lsv-stage,.lsv-w .lsv-stage *,.lsv-w .lsv-bar-title{user-select:none;-webkit-user-select:none}
.editor-container.lsv-w .lsv-bar,.editor-container.lsv-w .lsv-bar .lsv-bar-title{cursor:grab!important;touch-action:none}
.editor-container.lsv-w .lsv-bar.is-dragging,.editor-container.lsv-w .lsv-bar.is-dragging *{cursor:grabbing!important}
.editor-container.lsv-w.wf-media-fullboard .lsv-bar,.editor-container.lsv-w.wf-media-fullboard .lsv-bar-title{cursor:default!important}
.editor-container.lsv-w .lsv-bar:active,.editor-container.lsv-w .lsv-bar:active .lsv-bar-title{cursor:grabbing!important}
.editor-container.lsv-w.wf-media-fullboard .lsv-bar:active,.editor-container.lsv-w.wf-media-fullboard .lsv-bar:active .lsv-bar-title{cursor:default!important}
.editor-container.lsv-w button,.editor-container.lsv-w button *,.editor-container.lsv-w .lsv-mi-t,.editor-container.lsv-w .lsv-mi-t *,
.editor-container.lsv-w .lsv-toc-it,.editor-container.lsv-w .lsv-toc-it *,
.editor-container.lsv-w select,.editor-container.lsv-w label,.editor-container.lsv-w input[type=checkbox]{cursor:pointer!important}
.editor-container.lsv-w input[type=text],.editor-container.lsv-w textarea{cursor:text!important}
/* Message temporaire */
.lsv-w .lsv-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:13;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.lsv-w .lsv-flash.is-on{opacity:1}
/* Widget étroit */
@container (max-width: 460px){
  .lsv-w .lsv-bar-title{font-size:0}
  .lsv-w .lsv-bar-title::before{content:"💡";font-size:15px}
  .lsv-w .lsv-stage{padding:8px}
  .lsv-w .lsv-card{border-radius:14px;font-size:calc(14px * var(--lsv-fs))}
}
@container (max-width: 360px){
  .lsv-w .lsv-sep,.lsv-w [data-lsv-action="font-down"],.lsv-w [data-lsv-action="font-up"]{display:none}
  .lsv-w .lsv-toc{padding:6px}
  .lsv-w .lsv-toc-card{padding:10px 10px 8px;border-radius:12px}
  .lsv-w .lsv-ib{min-width:26px;padding:0 4px}
}
@media print{ .lsv-w .lsv-bar{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets déjà présents au chargement du script.
_lsvScan(document.body);
