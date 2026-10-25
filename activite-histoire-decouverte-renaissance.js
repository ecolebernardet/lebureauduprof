// =========================================================================
// ACTIVITÉ — LES GRANDES DÉCOUVERTES ET LA RENAISSANCE (XVe – XVIe siècles)
// -------------------------------------------------------------------------
// Widget autonome (type « histoire-renaissance »), en 7 onglets :
//   1. Pourquoi partir ?   — épices, or, Ottomans, religion… + carte des routes
//   2. Les navires         — la caravelle interactive et les instruments
//   3. Les voyages         — carte animée : Dias, Colomb, Vasco de Gama,
//                            Magellan-Elcano, Cartier
//   4. Le monde change     — échanges Amérique / Ancien Monde (+ jeu de tri)
//                            et conséquences des découvertes
//   5. La Renaissance      — imprimerie (atelier), humanisme, artistes,
//                            perspective (manipulable), François Ier…
//   6. Frise               — 1440 – 1560, dates masquables
//   7. Quiz                — 14 questions corrigées
//
// Intégration :
//   - index.html : <script src="activite-histoire-decouverte-renaissance.js">
//                  + carte dans le panneau Activités (section HGS)
//                  + type 'histoire-renaissance' dans EXCLUDED_TYPES
//                    (sur téléphone, le widget gère son propre plein écran)
//   - save-load.js : renaissanceData via widget._drnGetData / _drnSetData
// =========================================================================
(function () {
    'use strict';

    var TYPE   = 'histoire-renaissance';
    var BASE_W = 1000;      // largeur de référence (font-size = 16px)
    var DEF_W  = 1000;
    var DEF_H  = 640;
    var MIN_W  = 560;
    var MIN_H  = 380;

    // ─────────────────────────────────────────────────────────────────────
    // OUTILS
    // ─────────────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }
    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function range(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }

    // Projection équirectangulaire : carte de 1000 × 500 unités
    // (longitude « continue » acceptée : -215 = 145° Est vu depuis l'ouest)
    function PX(lon) { return (lon + 180) / 360 * 1000; }
    function PY(lat) { return (90 - lat) / 180 * 500; }
    function pts(list) {
        return list.map(function (p) { return PX(p[0]).toFixed(1) + ',' + PY(p[1]).toFixed(1); }).join(' ');
    }
    function wrapX(x) { return ((x % 1000) + 1000) % 1000; }

    // ─────────────────────────────────────────────────────────────────────
    // CONTINENTS (tracé simplifié, suffisant pour l'école)
    // ─────────────────────────────────────────────────────────────────────
    var LANDS = [
        // Amérique du Nord
        [[-168,66],[-162,70],[-140,70],[-125,72],[-95,72],[-80,73],[-65,62],[-60,55],[-57,52],[-57,51.3],[-60,50.3],[-64,50.2],[-66.5,49.8],[-69.5,48.4],[-71.3,47],[-73.5,45.6],[-73.4,45.3],[-71,46.6],[-68.5,48.3],[-66,49.2],[-64.2,48.9],[-64.8,47.8],[-65,47],[-61,45.6],[-60,45.8],[-63,44.6],[-66,43.8],[-70,43],[-70,41.8],[-74,40.5],[-76,37],[-76,35],[-81,31],[-80,26],[-82,26],[-84,30],[-90,30],[-97,27],[-97,22],[-94,18],[-90,21],[-87,21],[-88,16],[-84,11],[-80,9],[-78,8],[-80,7],[-85,10],[-92,15],[-105,20],[-110,24],[-112,30],[-115,30],[-117,33],[-121,35],[-124,40],[-124,48],[-130,55],[-138,59],[-150,61],[-158,57],[-165,60],[-168,66]],
        // Terre-Neuve
        [[-59.5,47.6],[-53,46.6],[-52.7,48.5],[-55.3,51.4],[-56.8,51.2],[-58.5,49],[-59.5,47.6]],
        // Groenland
        [[-50,60],[-42,60],[-20,70],[-18,80],[-40,83],[-60,82],[-70,78],[-55,70],[-50,60]],
        // Islande
        [[-24,65.5],[-14,66.3],[-14,64.5],[-22,63.4]],
        // Cuba, Hispaniola
        [[-85,22],[-80,23.2],[-74.2,20.2],[-77.5,19.9],[-81,21.6]],
        [[-74.4,19.8],[-69.5,19.7],[-68.4,18.5],[-74.4,18.3]],
        // Amérique du Sud
        [[-78,8],[-72,12],[-63,11],[-55,6],[-50,1],[-44,-2],[-35,-5],[-35,-9],[-39,-15],[-41,-22],[-48,-26],[-53,-33],[-58,-38],[-62,-40],[-65,-45],[-68,-50],[-69,-55],[-73,-53],[-75,-46],[-73,-37],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,0],[-78,2],[-77,7],[-78,8]],
        // Eurasie
        [[-9,43],[-9,37],[-6,36],[-2,37],[0,39],[3,42],[6,43],[9,44],[12,42],[16,38],[18,40],[13,45],[19,42],[23,38],[26,40],[29,41],[36,36],[35,33],[34,31],[34,28],[39,22],[43,13],[45,13],[52,16],[57,19],[59,22],[57,25],[62,25],[67,24],[72,21],[73,16],[77,8],[80,10],[80,15],[86,20],[90,22],[92,21],[94,17],[98,16],[98,8],[100,4],[104,1],[103,8],[100,13],[105,10],[109,12],[107,17],[106,20],[110,21],[117,23],[121,28],[122,31],[119,35],[122,37],[121,40],[125,40],[129,35],[129,40],[135,43],[141,48],[140,53],[135,55],[143,59],[155,59],[163,62],[160,60],[156,51],[162,56],[170,60],[178,64],[180,66],[180,69],[170,70],[160,70],[140,72],[130,71],[113,74],[105,77],[95,76],[80,73],[70,73],[68,68],[60,69],[52,68],[44,68],[40,66],[33,69],[25,71],[16,69],[11,64],[5,62],[5,58],[8,58],[11,59],[13,55],[18,58],[18,62],[22,65],[25,65],[22,60],[28,60],[23,58],[21,55],[14,54],[10,54],[8,57],[8,54],[4,52],[2,51],[-2,48],[-4,48],[-1,46],[-2,43],[-9,43]],
        // Grande-Bretagne, Irlande
        [[-5,50],[1,51],[2,53],[0,54],[-2,56],[-2,58],[-5,58],[-6,56],[-5,55],[-3,54],[-4,52],[-5,50]],
        [[-10,52],[-6,52],[-6,55],[-8,55],[-10,54]],
        // Afrique
        [[-6,36],[-1,35],[10,37],[11,33],[20,31],[25,32],[32,31],[33,28],[36,22],[38,18],[43,12],[51,12],[51,10],[48,5],[40,-3],[39,-8],[40,-15],[35,-22],[33,-28],[27,-34],[20,-35],[18,-32],[15,-27],[12,-18],[13,-10],[9,-1],[9,4],[4,6],[-4,5],[-8,4],[-13,8],[-17,14],[-17,21],[-13,27],[-10,30],[-9,32],[-6,36]],
        // Madagascar
        [[44,-25],[47,-25],[50,-15],[49,-12],[44,-16]],
        // Japon
        [[130,31],[135,34],[140,36],[142,40],[140,42],[139,38],[133,35]],
        // Philippines, Indonésie, Nouvelle-Guinée
        [[120,18],[122,18],[124,10],[126,7],[122,7],[120,14]],
        [[95,5],[98,4],[106,-6],[103,-5]],
        [[109,1],[117,7],[119,1],[116,-4],[110,-3]],
        [[106,-6],[114,-7],[114,-8.5],[106,-7.5]],
        [[131,-1],[141,-3],[150,-10],[143,-9],[138,-8]],
        // Australie, Nouvelle-Zélande
        [[114,-22],[122,-18],[130,-12],[136,-12],[137,-16],[142,-11],[146,-19],[153,-25],[151,-34],[146,-39],[140,-38],[135,-35],[130,-31],[118,-35],[115,-34],[114,-22]],
        [[172,-35],[175,-37],[178,-38],[174,-42],[167,-46],[171,-41]]
    ];
    var SEAS_INNER = [
        [[28,41],[28,44],[30,46],[34,46],[37,47],[39,45],[41,42],[36,41],[31,41]],  // mer Noire
        [[47,45],[50,47],[53,45],[54,40],[53,37],[50,37],[49,40]]                    // mer Caspienne
    ];

    // Dessin de la carte (fond, graticule, terres) dans une vue donnée
    function mapBaseSVG(opts) {
        var s = '';
        s += '<rect x="-500" y="-100" width="2000" height="700" fill="url(#drn-sea-' + opts.id + ')"/>';
        // graticule
        s += '<g class="drn-grid">';
        for (var lon = -150; lon <= 180; lon += 30) s += '<line x1="' + PX(lon) + '" y1="0" x2="' + PX(lon) + '" y2="500"/>';
        for (var lat = -60; lat <= 60; lat += 30) s += '<line x1="0" y1="' + PY(lat) + '" x2="1000" y2="' + PY(lat) + '"/>';
        s += '</g>';
        s += '<line class="drn-equator" x1="0" y1="' + PY(0) + '" x2="1000" y2="' + PY(0) + '"/>';
        // terres
        s += '<g class="drn-land">';
        LANDS.forEach(function (l) { s += '<polygon points="' + pts(l) + '"/>'; });
        s += '</g><g class="drn-inner-sea">';
        SEAS_INNER.forEach(function (l) { s += '<polygon points="' + pts(l) + '"/>'; });
        s += '</g>';
        return s;
    }
    function mapDefs(id) {
        return '<defs><radialGradient id="drn-sea-' + id + '" cx="50%" cy="45%" r="75%">' +
            '<stop offset="0" stop-color="#cfe2e2"/><stop offset="1" stop-color="#9fc0c7"/></radialGradient></defs>';
    }
    function compassRose(x, y, r) {
        return '<g class="drn-rose" transform="translate(' + x + ',' + y + ')">' +
            '<circle r="' + r + '" fill="none" stroke="#7a5b2e" stroke-width="1"/>' +
            '<polygon points="0,' + (-r * 1.25) + ' ' + (r * 0.22) + ',0 0,' + (r * 1.25) + ' ' + (-r * 0.22) + ',0" fill="#7a5b2e"/>' +
            '<polygon points="' + (-r * 1.25) + ',0 0,' + (r * 0.22) + ' ' + (r * 1.25) + ',0 0,' + (-r * 0.22) + '" fill="#b8955a"/>' +
            '<text y="' + (-r * 1.4) + '" text-anchor="middle" font-size="' + (r * 0.75) + '" fill="#5a4020" font-weight="700">N</text></g>';
    }

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — POURQUOI PARTIR ?
    // ─────────────────────────────────────────────────────────────────────
    var REASONS = [
        { ico: '🌶️', title: 'Les épices', short: 'Poivre, cannelle, girofle, muscade…',
          text: 'Au XV<sup>e</sup> siècle, les Européens adorent les épices : elles donnent du goût aux plats, servent à conserver la viande et à fabriquer des remèdes. Elles viennent de très loin (Inde, îles Moluques) et coûtent extrêmement cher. Celui qui trouvera une route directe vers l’Asie deviendra très riche.' },
        { ico: '🏰', title: 'Une route bloquée', short: 'Les Ottomans prennent Constantinople (1453)',
          text: 'Jusque-là, les épices arrivaient en Europe par de longues routes terrestres et par la mer Méditerranée. En 1453, les Turcs ottomans prennent Constantinople : ils contrôlent ces routes et font payer très cher le passage. Venise garde le reste du commerce. Les Portugais et les Espagnols cherchent donc un autre chemin… par l’océan.' },
        { ico: '💰', title: 'L’or et la richesse', short: 'Trouver de l’or et de nouvelles terres',
          text: 'Les rois veulent agrandir leur royaume et remplir leurs caisses. Les marchands et les marins espèrent trouver de l’or, de l’argent et des produits rares à revendre.' },
        { ico: '✝️', title: 'La religion', short: 'Répandre le christianisme',
          text: 'Les rois chrétiens d’Espagne et du Portugal veulent convertir les peuples qu’ils rencontreront au christianisme. Le pape soutient ces expéditions.' },
        { ico: '🧭', title: 'Des progrès techniques', short: 'Caravelle, boussole, astrolabe, cartes',
          text: 'De nouveaux bateaux (la caravelle), de meilleurs instruments (boussole, astrolabe) et des cartes plus précises permettent enfin de s’aventurer loin des côtes, en plein océan.' },
        { ico: '🌍', title: 'La curiosité', short: 'La Terre est ronde : on peut en faire le tour',
          text: 'Les savants savent depuis l’Antiquité que la Terre est ronde. Certains, comme Christophe Colomb, pensent qu’en allant toujours vers l’ouest, on arrivera en Asie. Mais ils se trompent sur la taille de la Terre… et ignorent qu’un continent se trouve sur leur chemin !' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — LA CARAVELLE
    // ─────────────────────────────────────────────────────────────────────
    var SHIP_PARTS = [
        { n: 1, x: 300, y: 290, title: 'La coque',
          text: 'La caravelle est un petit navire (20 à 30 mètres de long), léger et rapide. Elle ne transporte qu’une vingtaine de marins, mais elle se manœuvre facilement et peut s’approcher des côtes sans s’échouer.' },
        { n: 2, x: 200, y: 158, title: 'Les voiles carrées',
          text: 'Les grandes voiles carrées attrapent bien le vent quand il souffle dans le dos du bateau : elles servent à aller vite en haute mer. Les voiles portugaises portent la croix rouge de l’ordre du Christ.' },
        { n: 3, x: 428, y: 168, title: 'La voile latine',
          text: 'La voile triangulaire, dite « latine », est la grande nouveauté : grâce à elle, la caravelle peut avancer même quand le vent vient de côté, et presque remonter contre le vent. Indispensable pour revenir d’un long voyage !' },
        { n: 4, x: 545, y: 290, title: 'Le gouvernail d’étambot',
          text: 'Fixé à l’arrière, dans l’axe du bateau, ce gouvernail est bien plus précis que l’ancienne grande rame placée sur le côté. On le manœuvre avec une barre depuis le pont.' },
        { n: 5, x: 480, y: 222, title: 'Le château arrière',
          text: 'C’est la partie surélevée à l’arrière. Le capitaine y loge et y range ses cartes et ses instruments. De là-haut, il surveille l’équipage et la route.' },
        { n: 6, x: 300, y: 58, title: 'La hune (le nid-de-pie)',
          text: 'En haut du grand mât, un marin, la vigie, guette l’horizon. C’est lui qui crie « Terre ! » quand il aperçoit une côte. Le 12 octobre 1492, c’est un marin de la Pinta qui voit le premier l’Amérique.' },
        { n: 7, x: 200, y: 300, title: 'La cale et la vie à bord',
          text: 'Dans la cale, on stocke les vivres : biscuits de mer, viande salée, eau, vin, fromage. Au bout de quelques semaines, l’eau croupit et les biscuits sont pleins de vers. Sans fruits ni légumes frais, les marins tombent malades du scorbut : leurs gencives saignent et beaucoup en meurent.' }
    ];
    var INSTRUMENTS = [
        { id: 'boussole', title: 'La boussole',
          text: 'Son aiguille aimantée indique toujours le nord. Inventée en Chine, elle permet de garder le cap même quand le ciel est couvert.',
          svg: '<circle cx="40" cy="40" r="30" fill="#f4e9cf" stroke="#6b4b22" stroke-width="4"/><circle cx="40" cy="40" r="23" fill="none" stroke="#b8955a" stroke-width="1.5"/><polygon points="40,16 45,40 40,64 35,40" fill="#a63b2a"/><polygon points="40,40 45,40 40,64 35,40" fill="#3c4a5c"/><circle cx="40" cy="40" r="3" fill="#6b4b22"/><text x="40" y="13" font-size="9" text-anchor="middle" fill="#6b4b22" font-weight="700">N</text>' },
        { id: 'astrolabe', title: 'L’astrolabe',
          text: 'Il mesure la hauteur du Soleil à midi ou de l’étoile Polaire la nuit. Avec ce calcul, le pilote connaît sa latitude, c’est-à-dire à quelle distance il se trouve au nord ou au sud de l’équateur.',
          svg: '<circle cx="40" cy="42" r="28" fill="#d9a441" stroke="#7a5214" stroke-width="3"/><circle cx="40" cy="42" r="19" fill="none" stroke="#7a5214" stroke-width="1.5"/><line x1="16" y1="42" x2="64" y2="42" stroke="#7a5214" stroke-width="1.5"/><line x1="40" y1="18" x2="40" y2="66" stroke="#7a5214" stroke-width="1.5"/><line x1="22" y1="26" x2="58" y2="58" stroke="#3a2808" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="10" r="5" fill="none" stroke="#7a5214" stroke-width="3"/>' },
        { id: 'sablier', title: 'Le sablier et le loch',
          text: 'Le sablier mesure le temps qui passe. Le loch est une planchette attachée à une corde à nœuds qu’on jette à l’eau : en comptant les nœuds qui défilent pendant un tour de sablier, on connaît la vitesse du bateau. On parle encore aujourd’hui de « nœuds » pour la vitesse des navires !',
          svg: '<rect x="22" y="8" width="36" height="6" rx="2" fill="#7a5214"/><rect x="22" y="66" width="36" height="6" rx="2" fill="#7a5214"/><path d="M27 14 L53 14 L42 40 L53 66 L27 66 L38 40 Z" fill="#e8f1f3" stroke="#7a5214" stroke-width="2"/><path d="M32 20 L48 20 L41 37 L39 37 Z" fill="#d9a441"/><path d="M30 64 L50 64 L42 52 L38 52 Z" fill="#d9a441"/><line x1="40" y1="38" x2="40" y2="52" stroke="#d9a441" stroke-width="1.5"/>' },
        { id: 'portulan', title: 'Le portulan',
          text: 'C’est une carte marine qui dessine précisément les côtes et les ports. Elle est couverte de lignes qui partent de roses des vents : elles indiquent les directions à suivre. Les cartes sont des secrets d’État, très bien gardés !',
          svg: '<path d="M8 14 Q40 6 72 14 L72 66 Q40 74 8 66 Z" fill="#f1e2bd" stroke="#7a5214" stroke-width="2.5"/><path d="M14 30 Q24 24 30 34 Q36 46 46 40 Q56 34 62 44" fill="none" stroke="#7a5214" stroke-width="2"/><g stroke="#a63b2a" stroke-width="0.8" opacity=".8"><line x1="40" y1="40" x2="10" y2="20"/><line x1="40" y1="40" x2="70" y2="18"/><line x1="40" y1="40" x2="12" y2="62"/><line x1="40" y1="40" x2="70" y2="64"/><line x1="40" y1="40" x2="40" y2="10"/><line x1="40" y1="40" x2="40" y2="70"/></g><circle cx="40" cy="40" r="4" fill="#a63b2a"/>' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — LES VOYAGES
    // ─────────────────────────────────────────────────────────────────────
    var VOYAGES = [
        {
            id: 'dias', short: 'Dias', name: 'Bartolomeu Dias', country: 'Portugal', flag: '🇵🇹', years: '1487 – 1488', color: '#2f7d4f',
            intro: 'Le roi du Portugal veut atteindre l’Inde en contournant l’Afrique. Bartolomeu Dias part avec trois navires pour trouver la pointe sud du continent.',
            route: [[-9.1,38.7],[-15.5,28],[-20,20],[-19,12],[-10,2],[2,-8],[8,-20],[12,-28],[16,-34.5],[18.5,-35.6],[22,-35],[27,-34.3]],
            stops: [
                { i: 0,  place: 'Lisbonne', date: 'août 1487', text: 'Départ de Lisbonne avec trois navires. Les Portugais longent les côtes de l’Afrique depuis des dizaines d’années, toujours un peu plus loin.' },
                { i: 9,  place: 'Cap de Bonne-Espérance', date: 'début 1488', text: 'Une terrible tempête pousse les navires au large pendant 13 jours. Quand elle se calme, Dias a dépassé sans le voir le sud de l’Afrique ! Il l’appelle « cap des Tempêtes ». Le roi le renommera « cap de Bonne-Espérance » : l’espoir d’atteindre l’Inde.' },
                { i: 11, place: 'Rio do Infante', date: 'mars 1488', text: 'La côte remonte vers le nord-est : la route de l’Inde est ouverte ! Mais l’équipage, épuisé, refuse d’aller plus loin. Dias doit faire demi-tour. Il rentre à Lisbonne en décembre 1488.' }
            ]
        },
        {
            id: 'colomb', short: 'Colomb', name: 'Christophe Colomb', country: 'Espagne', flag: '🇪🇸', years: '1492', color: '#b8372a',
            intro: 'Christophe Colomb, un marin né à Gênes, est persuadé qu’on peut atteindre les Indes en naviguant vers l’ouest. Les Rois catholiques d’Espagne, Isabelle et Ferdinand, acceptent de financer son voyage.',
            route: [[-6.9,37.2],[-12,33],[-17.5,28.1],[-28,28],[-40,27.5],[-55,26],[-68,24.8],[-74.5,24.1],[-76,22.5],[-77.5,21.6],[-75,20.6],[-72,20.1],[-70.5,19.9]],
            stops: [
                { i: 0,  place: 'Palos', date: '3 août 1492', text: 'Départ du port de Palos, en Espagne, avec trois navires : la Santa María, la Pinta et la Niña. Environ 90 hommes sont à bord.' },
                { i: 2,  place: 'Îles Canaries', date: 'septembre 1492', text: 'Dernière escale pour réparer et faire le plein de vivres. Puis c’est le grand saut dans l’inconnu : plus de cinq semaines sans voir la terre. Les marins ont peur et menacent de se révolter.' },
                { i: 7,  place: 'Guanahani', date: '12 octobre 1492', text: '« Terre ! » Colomb débarque sur une île des Bahamas qu’il appelle San Salvador. Il croit être arrivé en Asie, près des Indes : il appelle donc les habitants les « Indiens ». En réalité, il vient d’atteindre un continent inconnu des Européens : l’Amérique.' },
                { i: 9,  place: 'Cuba', date: 'octobre 1492', text: 'Colomb explore la côte de Cuba. Il cherche l’or et le palais de l’empereur de Chine… qu’il ne trouvera jamais.' },
                { i: 12, place: 'Hispaniola', date: 'décembre 1492', text: 'La Santa María s’échoue le soir de Noël. Colomb laisse 39 hommes sur l’île et rentre en Espagne, où il est accueilli en héros. Il fera quatre voyages et mourra en 1506 sans savoir qu’il avait découvert un nouveau continent.' }
            ]
        },
        {
            id: 'gama', short: 'Vasco de Gama', name: 'Vasco de Gama', country: 'Portugal', flag: '🇵🇹', years: '1497 – 1498', color: '#2a6fa8',
            intro: 'Dix ans après Dias, le roi du Portugal envoie Vasco de Gama jusqu’en Inde, en contournant l’Afrique, pour rapporter des épices.',
            route: [[-9.1,38.7],[-15.5,28],[-23,15],[-28,0],[-28,-15],[-18,-30],[0,-37],[18.5,-35.6],[27,-33.8],[33,-27.5],[38,-20],[41,-15],[40.5,-8],[40.6,-3.2],[50,2],[62,8],[72,11],[75.8,11.25]],
            stops: [
                { i: 0,  place: 'Lisbonne', date: '8 juillet 1497', text: 'Départ de Lisbonne avec quatre navires et environ 170 hommes.' },
                { i: 4,  place: 'Océan Atlantique', date: 'août – novembre 1497', text: 'Pour éviter les vents contraires le long de l’Afrique, Vasco de Gama fait un immense détour en plein océan : plus de trois mois sans voir la terre, un record pour l’époque.' },
                { i: 7,  place: 'Cap de Bonne-Espérance', date: 'novembre 1497', text: 'La flotte passe le cap trouvé par Dias, puis remonte la côte est de l’Afrique, où des marchands arabes commercent déjà avec l’Inde.' },
                { i: 13, place: 'Malindi', date: 'avril 1498', text: 'Dans ce port d’Afrique de l’Est, Vasco de Gama trouve un pilote qui connaît l’océan Indien et les vents de la mousson. Il va le guider jusqu’en Inde.' },
                { i: 17, place: 'Calicut (Inde)', date: '20 mai 1498', text: 'Arrivée en Inde ! La route maritime des épices est ouverte. Au retour, en 1499, plus de la moitié des marins sont morts, surtout du scorbut. Mais les épices rapportées valent une fortune : Lisbonne devient une des villes les plus riches d’Europe.' }
            ]
        },
        {
            id: 'magellan', short: 'Magellan', name: 'Magellan et Elcano', country: 'Espagne', flag: '🇪🇸', years: '1519 – 1522', color: '#7b4fa8',
            intro: 'Fernand de Magellan, un Portugais au service du roi d’Espagne, veut atteindre les îles aux épices (les Moluques) par l’ouest, en passant au sud de l’Amérique. Il part avec cinq navires et environ 240 hommes.',
            route: [[-6.4,36.8],[-16.3,28.3],[-22,12],[-28,0],[-34,-8],[-43.2,-22.9],[-56,-35],[-63,-42],[-67.7,-49.3],[-68.4,-52.4],[-71,-53.5],[-74.5,-52.7],[-78,-45],[-82,-33],[-100,-20],[-130,-8],[-160,5],[-195,12],[-215.2,13.4],[-236.1,10.3],[-237,6],[-232.6,0.8],[-235,-9],[-245,-15],[-270,-25],[-300,-33],[-320,-37],[-341.5,-35.6],[-350,-28],[-355,-15],[-365,0],[-383,15],[-379,26],[-366.4,36.8]],
            stops: [
                { i: 0,  place: 'Sanlúcar (Espagne)', date: '20 septembre 1519', text: 'Départ de cinq navires : la Trinidad, la San Antonio, la Concepción, la Victoria et la Santiago.' },
                { i: 5,  place: 'Rio de Janeiro', date: 'décembre 1519', text: 'Escale sur les côtes du Brésil. Puis la flotte descend vers le sud en cherchant un passage vers l’autre océan.' },
                { i: 8,  place: 'San Julián', date: 'hiver 1520', text: 'Pendant l’hiver austral, il fait très froid. Une partie de l’équipage se révolte ; Magellan écrase la mutinerie. La Santiago fait naufrage.' },
                { i: 10, place: 'Détroit de Magellan', date: 'octobre – novembre 1520', text: 'Magellan trouve enfin le passage, un détroit étroit et dangereux qui porte aujourd’hui son nom. Il faut 38 jours pour le traverser. La San Antonio en profite pour déserter et rentre en Espagne.' },
                { i: 11, place: 'Océan Pacifique', date: 'novembre 1520', text: 'L’océan est si calme que Magellan l’appelle « Pacifique ». Mais il est immense : plus de trois mois de traversée. Les marins mangent le cuir des voiles et des rats ; beaucoup meurent du scorbut.' },
                { i: 18, place: 'Guam', date: 'mars 1521', text: 'Enfin une île ! Les survivants peuvent manger des fruits frais et boire de l’eau.' },
                { i: 19, place: 'Philippines', date: '27 avril 1521', text: 'Magellan veut imposer son autorité aux habitants de l’île de Mactan. Il est tué au combat par les guerriers du chef Lapu-Lapu. Juan Sebastián Elcano prend la tête de l’expédition.' },
                { i: 21, place: 'Îles Moluques', date: 'novembre 1521', text: 'Les îles aux épices sont atteintes ! Les cales se remplissent de clous de girofle. Il ne reste plus que deux navires ; seule la Victoria rentrera par l’ouest.' },
                { i: 27, place: 'Cap de Bonne-Espérance', date: 'mai 1522', text: 'La Victoria traverse l’océan Indien et contourne l’Afrique, en évitant les Portugais, ennemis de l’Espagne.' },
                { i: 33, place: 'Sanlúcar', date: '6 septembre 1522', text: 'Retour en Espagne, trois ans après le départ. Seuls 18 hommes sur environ 240 sont rentrés, à bord de la Victoria. Ils ont fait le premier tour du monde : c’est la preuve que la Terre est ronde et que les océans communiquent.' }
            ]
        },
        {
            id: 'cartier', short: 'Cartier', name: 'Jacques Cartier', country: 'France', flag: '🇫🇷', years: '1534 – 1535', color: '#c8952e',
            intro: 'Le roi de France François Ier ne veut pas laisser le monde à l’Espagne et au Portugal. Il envoie Jacques Cartier, un marin de Saint-Malo, chercher un passage vers l’Asie… et de l’or.',
            route: [[-2,48.65],[-8,49],[-20,51],[-35,52],[-50,52.2],[-55.8,51.7],[-58.5,50.9],[-62,49.9],[-64.3,49.5],[-66.5,49.5],[-69,48.2],[-71.2,46.85],[-73.5,45.45]],
            stops: [
                { i: 0,  place: 'Saint-Malo', date: '20 avril 1534', text: 'Départ de Saint-Malo, en Bretagne, avec deux navires et 61 hommes.' },
                { i: 5,  place: 'Terre-Neuve', date: 'mai 1534', text: 'Après seulement vingt jours de traversée, Cartier atteint Terre-Neuve, où des pêcheurs européens viennent déjà pêcher la morue.' },
                { i: 8,  place: 'Gaspé', date: 'juillet 1534', text: 'Cartier rencontre les Iroquoiens du chef Donnacona et plante une grande croix pour prendre possession du pays au nom du roi de France.' },
                { i: 11, place: 'Stadaconé (Québec)', date: 'septembre 1535', text: 'Lors de son deuxième voyage, Cartier remonte le fleuve Saint-Laurent. Les habitants parlent de leur « kanata », c’est-à-dire leur village : c’est l’origine du mot « Canada ».' },
                { i: 12, place: 'Hochelaga (Montréal)', date: 'octobre 1535', text: 'Des rapides empêchent d’aller plus loin : ce n’est pas le passage vers la Chine. L’hiver suivant est terrible ; les Iroquoiens soignent les marins atteints du scorbut avec une tisane d’écorce. La France ne s’installera vraiment au Canada qu’en 1608, avec Champlain.' }
            ]
        }
    ];
    var SPEEDS = [{ k: 'lent', label: 'Lent', v: 55 }, { k: 'normal', label: 'Normal', v: 110 }, { k: 'rapide', label: 'Rapide', v: 230 }];

    // Calculs de longueur (coordonnées continues) d'une route
    VOYAGES.forEach(function (v) {
        v.P = v.route.map(function (p) { return [PX(p[0]), PY(p[1])]; });
        v.cum = [0];
        for (var i = 1; i < v.P.length; i++) {
            var dx = v.P[i][0] - v.P[i - 1][0], dy = v.P[i][1] - v.P[i - 1][1];
            v.cum.push(v.cum[i - 1] + Math.sqrt(dx * dx + dy * dy));
        }
        v.len = v.cum[v.cum.length - 1];
    });

    // Points d'une route jusqu'à la distance d (coordonnées continues)
    function routeUpTo(v, d) {
        var out = [v.P[0]];
        for (var i = 1; i < v.P.length; i++) {
            if (v.cum[i] <= d) { out.push(v.P[i]); continue; }
            var seg = v.cum[i] - v.cum[i - 1];
            var t = seg ? (d - v.cum[i - 1]) / seg : 0;
            out.push([v.P[i - 1][0] + (v.P[i][0] - v.P[i - 1][0]) * t, v.P[i - 1][1] + (v.P[i][1] - v.P[i - 1][1]) * t]);
            break;
        }
        return out;
    }
    // Ligne brisée → attribut « d », coupée au passage du bord de la carte
    function polyD(list) {
        var d = '', prev = null;
        list.forEach(function (p) {
            var x = wrapX(p[0]);
            if (prev === null || Math.abs(x - prev) > 500) d += 'M' + x.toFixed(1) + ',' + p[1].toFixed(1);
            else d += 'L' + x.toFixed(1) + ',' + p[1].toFixed(1);
            prev = x;
        });
        return d;
    }

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — LE MONDE CHANGE
    // ─────────────────────────────────────────────────────────────────────
    var EXCHANGES = [
        { e: '🥔', n: 'La pomme de terre', s: 'A', t: 'Cultivée dans les Andes par les Incas. En France, elle ne deviendra populaire qu’au XVIII<sup>e</sup> siècle, grâce à Parmentier.' },
        { e: '🍅', n: 'La tomate', s: 'A', t: 'Venue du Mexique. Les Européens l’ont d’abord crue toxique et l’utilisaient comme plante décorative !' },
        { e: '🌽', n: 'Le maïs', s: 'A', t: 'La plante principale des Aztèques et des Mayas. Elle se répand vite en Europe, en Afrique et en Asie.' },
        { e: '🍫', n: 'Le cacao', s: 'A', t: 'Les Aztèques en faisaient une boisson amère et épicée. Les Européens y ajoutent du sucre : le chocolat est né.' },
        { e: '🌶️', n: 'Le piment', s: 'A', t: 'Originaire d’Amérique, il est devenu indispensable dans les cuisines d’Asie et d’Afrique.' },
        { e: '🦃', n: 'La dinde', s: 'A', t: 'Un oiseau d’Amérique, élevé par les Aztèques. On l’a appelée « poule d’Inde », d’où le mot « dinde ».' },
        { e: '🍍', n: 'L’ananas', s: 'A', t: 'Un fruit d’Amérique du Sud, très rare et très cher en Europe : on le louait pour décorer les tables de fête !' },
        { e: '🥜', n: 'La cacahuète', s: 'A', t: 'Cultivée en Amérique du Sud depuis des milliers d’années.' },
        { e: '💰', n: 'L’or et l’argent', s: 'A', t: 'Les mines d’Amérique, comme celle de Potosí, envoient des tonnes d’argent vers l’Espagne. Les mineurs amérindiens y travaillent de force.' },
        { e: '🐎', n: 'Le cheval', s: 'M', t: 'Il n’y avait plus de chevaux en Amérique. Les Amérindiens, d’abord terrifiés, deviendront plus tard d’excellents cavaliers.' },
        { e: '🐄', n: 'La vache', s: 'M', t: 'Avec les moutons et les cochons, les vaches arrivent en Amérique sur les navires européens.' },
        { e: '🐖', n: 'Le cochon', s: 'M', t: 'Les conquistadors emmènent des troupeaux de cochons pour se nourrir pendant leurs expéditions.' },
        { e: '🌾', n: 'Le blé', s: 'M', t: 'Les Européens apportent leurs céréales pour faire du pain comme chez eux.' },
        { e: '🍬', n: 'La canne à sucre', s: 'M', t: 'Plantée au Brésil et dans les Antilles, elle donne naissance à d’immenses plantations… où l’on fera travailler des esclaves africains.' },
        { e: '🍊', n: 'L’orange', s: 'M', t: 'Les agrumes (oranges, citrons) traversent l’Atlantique avec les colons espagnols.' },
        { e: '🦠', n: 'Les maladies', s: 'M', t: 'La variole, la rougeole ou la grippe sont inconnues en Amérique. Les Amérindiens ne sont pas protégés contre elles : elles provoquent des millions de morts.' },
        { e: '⛪', n: 'Le christianisme', s: 'M', t: 'Les missionnaires convertissent, souvent de force, les peuples d’Amérique.' },
        { e: '🗣️', n: 'L’espagnol et le portugais', s: 'M', t: 'Aujourd’hui encore, on parle espagnol dans la plus grande partie de l’Amérique latine, et portugais au Brésil.' }
    ];
    var CONSEQUENCES = [
        { ico: '🗺️', title: 'Une nouvelle image du monde', text: 'Les cartes changent : un « Nouveau Monde » apparaît entre l’Europe et l’Asie, et l’on découvre l’immensité de l’océan Pacifique. En 1507, un cartographe donne au nouveau continent le nom d’« Amérique », en l’honneur du navigateur Amerigo Vespucci.' },
        { ico: '📜', title: 'Le partage du monde', text: 'En 1494, au traité de Tordesillas, l’Espagne et le Portugal se partagent les terres à découvrir : une ligne est tracée dans l’Atlantique. À l’ouest pour l’Espagne, à l’est pour le Portugal (c’est pourquoi on parle portugais au Brésil). Le roi de France François Ier, exclu, demande à voir « le testament d’Adam » qui l’écarterait du partage !' },
        { ico: '⚔️', title: 'La conquête', text: 'Des conquérants espagnols, les conquistadors, s’emparent de grands empires : Hernán Cortés renverse l’empire aztèque au Mexique (1521), Francisco Pizarro l’empire inca au Pérou (1533). Ils sont peu nombreux, mais ont des chevaux, des armes en acier, des canons… et des alliés amérindiens.' },
        { ico: '💔', title: 'Le drame des Amérindiens', text: 'Les guerres, le travail forcé dans les mines et les plantations et surtout les maladies venues d’Europe font mourir une très grande partie des Amérindiens en un siècle. Quelques Européens, comme le moine Bartolomé de Las Casas, dénoncent ces violences.' },
        { ico: '⛓️', title: 'Le début de la traite', text: 'Pour remplacer les Amérindiens dans les plantations et les mines, les Européens achètent en Afrique des femmes, des hommes et des enfants réduits en esclavage et les déportent en Amérique. Cette traite commence au XVI<sup>e</sup> siècle et durera plus de trois siècles : plus de 12 millions d’Africains seront déportés.' },
        { ico: '⚓', title: 'L’Europe s’enrichit', text: 'L’or, l’argent, le sucre et les épices font la fortune de l’Espagne, du Portugal, puis de toute l’Europe. Le grand commerce quitte la Méditerranée pour l’océan Atlantique : Lisbonne, Séville et Anvers deviennent de très grands ports.' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — LA RENAISSANCE
    // ─────────────────────────────────────────────────────────────────────
    var RENAISSANCE = [
        { id: 'quoi', title: 'Une « re-naissance »', date: 'XV<sup>e</sup> – XVI<sup>e</sup> siècles', c: '#c8952e',
          ico: '<circle cx="40" cy="40" r="14" fill="#f2c14e"/><g stroke="#f2c14e" stroke-width="4" stroke-linecap="round"><line x1="40" y1="8" x2="40" y2="18"/><line x1="40" y1="62" x2="40" y2="72"/><line x1="8" y1="40" x2="18" y2="40"/><line x1="62" y1="40" x2="72" y2="40"/><line x1="17" y1="17" x2="24" y2="24"/><line x1="56" y1="56" x2="63" y2="63"/><line x1="17" y1="63" x2="24" y2="56"/><line x1="56" y1="24" x2="63" y2="17"/></g><path d="M8 72 L72 72" stroke="#7a5214" stroke-width="3"/>',
          text: 'La Renaissance commence en Italie, dans des villes riches comme Florence, au XV<sup>e</sup> siècle, puis gagne toute l’Europe. Les artistes et les savants redécouvrent l’Antiquité grecque et romaine : ses statues, ses monuments, ses livres. Ils ont l’impression de faire « renaître » une civilisation brillante, après le Moyen Âge.' },
        { id: 'imprimerie', title: 'L’imprimerie', date: 'vers 1450', c: '#3c4a5c',
          ico: '<rect x="14" y="10" width="52" height="10" rx="2" fill="#6b4b22"/><rect x="36" y="20" width="8" height="18" fill="#8a6a3a"/><rect x="18" y="38" width="44" height="8" rx="2" fill="#6b4b22"/><rect x="10" y="50" width="60" height="18" rx="2" fill="#f4e9cf" stroke="#6b4b22" stroke-width="2"/><g fill="#3c4a5c"><rect x="16" y="55" width="6" height="8"/><rect x="25" y="55" width="6" height="8"/><rect x="34" y="55" width="6" height="8"/><rect x="43" y="55" width="6" height="8"/><rect x="52" y="55" width="6" height="8"/></g>',
          text: 'Vers 1450, à Mayence (en Allemagne), Gutenberg met au point l’imprimerie à caractères mobiles : de petites lettres en métal qu’on assemble pour former les pages, qu’on encre, puis qu’on presse sur le papier. Avant, chaque livre était recopié à la main, ce qui prenait des mois. Désormais, on imprime des centaines d’exemplaires : les livres sont moins chers et les idées circulent beaucoup plus vite.',
          extra: 'imprimerie' },
        { id: 'humanisme', title: 'L’humanisme', date: 'XVI<sup>e</sup> siècle', c: '#2f7d4f',
          ico: '<path d="M14 18 Q40 10 40 22 Q40 10 66 18 L66 62 Q40 54 40 66 Q40 54 14 62 Z" fill="#f4e9cf" stroke="#2f7d4f" stroke-width="2.5"/><line x1="40" y1="22" x2="40" y2="66" stroke="#2f7d4f" stroke-width="2"/><g stroke="#2f7d4f" stroke-width="1.5" opacity=".7"><line x1="20" y1="28" x2="34" y2="26"/><line x1="20" y1="35" x2="34" y2="33"/><line x1="20" y1="42" x2="34" y2="40"/><line x1="46" y1="26" x2="60" y2="28"/><line x1="46" y1="33" x2="60" y2="35"/><line x1="46" y1="40" x2="60" y2="42"/></g>',
          text: 'Les humanistes, comme Érasme ou François Rabelais, sont des savants qui étudient les textes anciens en latin, en grec et en hébreu. Ils placent l’être humain au centre de leurs réflexions et pensent que l’éducation rend les hommes meilleurs. En 1530, François Ier crée le Collège royal (l’actuel Collège de France) pour enseigner ces langues anciennes.' },
        { id: 'vinci', title: 'Léonard de Vinci', date: '1452 – 1519', c: '#a63b2a',
          ico: '<path d="M40 44 L8 26 Q20 34 18 44 Q26 40 32 48 Z" fill="#e8d7a8" stroke="#7a5214" stroke-width="2"/><path d="M40 44 L72 26 Q60 34 62 44 Q54 40 48 48 Z" fill="#e8d7a8" stroke="#7a5214" stroke-width="2"/><g stroke="#7a5214" stroke-width="1"><line x1="40" y1="44" x2="14" y2="30"/><line x1="40" y1="44" x2="20" y2="38"/><line x1="40" y1="44" x2="66" y2="30"/><line x1="40" y1="44" x2="60" y2="38"/></g><circle cx="40" cy="46" r="5" fill="#a63b2a"/><line x1="40" y1="51" x2="40" y2="66" stroke="#7a5214" stroke-width="2"/>',
          text: 'Léonard de Vinci est un génie aux mille talents : peintre (il peint la Joconde vers 1503), ingénieur, inventeur, architecte, musicien… Dans ses carnets, il dessine des machines volantes, des engins de guerre, le corps humain. Âgé, il est invité en France par François Ier et s’installe au Clos Lucé, près du château d’Amboise, où il meurt en 1519. C’est pour cela que la Joconde est aujourd’hui au musée du Louvre.' },
        { id: 'michelange', title: 'Michel-Ange', date: '1475 – 1564', c: '#5b6b7a',
          ico: '<rect x="22" y="62" width="36" height="8" rx="2" fill="#8a8f98"/><path d="M30 62 L30 34 Q30 22 40 22 Q50 22 50 34 L50 62 Z" fill="#dfe2e6" stroke="#8a8f98" stroke-width="2"/><circle cx="40" cy="16" r="8" fill="#dfe2e6" stroke="#8a8f98" stroke-width="2"/><path d="M56 12 L68 24" stroke="#6b4b22" stroke-width="4" stroke-linecap="round"/><path d="M52 16 L58 10" stroke="#3c4a5c" stroke-width="3"/>',
          text: 'Sculpteur, peintre et architecte italien, Michel-Ange sculpte la célèbre statue de David à Florence et peint le plafond de la chapelle Sixtine, au Vatican, pendant quatre ans, allongé sur un échafaudage. Comme les sculpteurs de l’Antiquité, il cherche à représenter le corps humain de façon parfaite.' },
        { id: 'perspective', title: 'La perspective', date: 'XV<sup>e</sup> siècle', c: '#7b4fa8',
          ico: '<rect x="8" y="10" width="64" height="60" fill="#f4e9cf" stroke="#7b4fa8" stroke-width="2"/><g stroke="#7b4fa8" stroke-width="1.5"><line x1="40" y1="34" x2="8" y2="70"/><line x1="40" y1="34" x2="72" y2="70"/><line x1="40" y1="34" x2="24" y2="70"/><line x1="40" y1="34" x2="56" y2="70"/><line x1="22" y1="54" x2="58" y2="54"/><line x1="15" y1="62" x2="65" y2="62"/><line x1="29" y1="47" x2="51" y2="47"/></g><circle cx="40" cy="34" r="3" fill="#a63b2a"/>',
          text: 'Les peintres de la Renaissance inventent la perspective : un moyen de donner l’illusion de la profondeur sur une surface plate. Toutes les lignes qui s’éloignent se rejoignent en un même point, le point de fuite. Essaie : déplace le point rouge et regarde le carrelage changer !',
          extra: 'perspective' },
        { id: 'francois', title: 'François I<sup>er</sup>', date: 'roi de 1515 à 1547', c: '#1d3a5c',
          ico: '<path d="M14 58 L18 24 L30 40 L40 18 L50 40 L62 24 L66 58 Z" fill="#d9a441" stroke="#7a5214" stroke-width="2.5" stroke-linejoin="round"/><rect x="14" y="58" width="52" height="10" rx="2" fill="#c8952e" stroke="#7a5214" stroke-width="2"/><circle cx="40" cy="48" r="4" fill="#a63b2a"/><circle cx="26" cy="50" r="3" fill="#2a6fa8"/><circle cx="54" cy="50" r="3" fill="#2a6fa8"/>',
          text: 'Devenu roi en 1515, l’année de sa victoire à Marignan, en Italie, François I<sup>er</sup> est émerveillé par l’art italien. Il fait venir des artistes en France, dont Léonard de Vinci, et protège les écrivains et les savants : on dit qu’il est un « mécène ». En 1539, par l’ordonnance de Villers-Cotterêts, il impose le français à la place du latin dans les actes officiels.' },
        { id: 'chambord', title: 'Les châteaux de la Loire', date: 'Chambord, à partir de 1519', c: '#2a6fa8',
          ico: '<rect x="12" y="40" width="56" height="28" fill="#f4e9cf" stroke="#3c4a5c" stroke-width="2"/><rect x="30" y="26" width="20" height="14" fill="#f4e9cf" stroke="#3c4a5c" stroke-width="2"/><path d="M28 26 L40 12 L52 26 Z" fill="#3c4a5c"/><path d="M10 40 L18 30 L26 40 Z" fill="#3c4a5c"/><path d="M54 40 L62 30 L70 40 Z" fill="#3c4a5c"/><g fill="#2a6fa8"><rect x="18" y="46" width="6" height="8"/><rect x="30" y="46" width="6" height="8"/><rect x="44" y="46" width="6" height="8"/><rect x="56" y="46" width="6" height="8"/><rect x="37" y="30" width="6" height="7"/></g><rect x="36" y="58" width="8" height="10" fill="#6b4b22"/>',
          text: 'Les châteaux ne servent plus à se défendre : ce sont des châteaux de plaisance, faits pour vivre confortablement et montrer sa richesse. Ils ont de grandes fenêtres, des décorations inspirées de l’Antiquité et de beaux jardins. Chambord, voulu par François I<sup>er</sup>, possède un célèbre escalier à double révolution : deux personnes peuvent le monter en même temps sans jamais se croiser !' },
        { id: 'sciences', title: 'Les sciences', date: 'Copernic, 1543', c: '#c45a8a',
          ico: '<circle cx="40" cy="40" r="10" fill="#f2c14e"/><ellipse cx="40" cy="40" rx="30" ry="12" fill="none" stroke="#c45a8a" stroke-width="2"/><circle cx="68" cy="44" r="5" fill="#2a6fa8"/><ellipse cx="40" cy="40" rx="20" ry="7" fill="none" stroke="#c45a8a" stroke-width="1.5" opacity=".6"/><circle cx="22" cy="35" r="3" fill="#a63b2a"/>',
          text: 'Les savants observent et expérimentent au lieu de croire seulement ce que disent les livres anciens. En 1543, l’astronome Nicolas Copernic affirme que c’est la Terre qui tourne autour du Soleil, et non l’inverse. La même année, le médecin Vésale publie un grand livre sur l’anatomie du corps humain.' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — FRISE
    // ─────────────────────────────────────────────────────────────────────
    var FR_Y0 = 1440, FR_Y1 = 1560;
    var CAT = {
        dec: { label: 'Grandes découvertes', c: '#2a6fa8' },
        ren: { label: 'Renaissance', c: '#c8952e' },
        fr:  { label: 'Royaume de France', c: '#a63b2a' }
    };
    var FRISE = [
        { y: 1450, cat: 'ren', s: 'Imprimerie de Gutenberg', lvl: 1,  t: 'L’imprimerie de Gutenberg', d: 'Vers 1450, Gutenberg invente l’imprimerie à caractères mobiles. Les livres se multiplient.' },
        { y: 1453, cat: 'dec', s: 'Prise de Constantinople', lvl: -1, t: 'Prise de Constantinople', d: 'Les Turcs ottomans s’emparent de Constantinople. Les routes des épices vers l’Asie sont plus difficiles pour les Européens.' },
        { y: 1488, cat: 'dec', s: 'Dias : cap de Bonne-Espérance', lvl: -1, t: 'Dias passe le cap de Bonne-Espérance', d: 'Bartolomeu Dias est le premier Européen à contourner le sud de l’Afrique.' },
        { y: 1492, cat: 'dec', s: 'Colomb atteint l’Amérique', lvl: -2, t: 'Colomb atteint l’Amérique', d: 'Le 12 octobre 1492, Christophe Colomb débarque aux Bahamas. Cette date marque traditionnellement la fin du Moyen Âge et le début des Temps modernes.' },
        { y: 1494, cat: 'dec', s: 'Traité de Tordesillas', lvl: -3, t: 'Traité de Tordesillas', d: 'L’Espagne et le Portugal se partagent le monde à découvrir.' },
        { y: 1498, cat: 'dec', s: 'Vasco de Gama en Inde', lvl: -1, t: 'Vasco de Gama arrive en Inde', d: 'La route maritime des épices par le sud de l’Afrique est ouverte.' },
        { y: 1503, cat: 'ren', s: 'Vinci peint la Joconde', lvl: 2,  t: 'Léonard de Vinci peint la Joconde', d: 'Léonard de Vinci commence ce portrait vers 1503. Il le gardera avec lui toute sa vie, jusqu’en France.' },
        { y: 1507, cat: 'dec', s: 'Le nom « Amérique »', lvl: -2, t: 'Le mot « Amérique »', d: 'Le nom « Amérique » apparaît pour la première fois sur une carte, en l’honneur d’Amerigo Vespucci.' },
        { y: 1515, cat: 'fr', s: 'François Ier roi · Marignan', lvl: 1,  t: 'François Ier, roi — Marignan', d: 'François Ier devient roi de France et remporte la bataille de Marignan, en Italie.' },
        { y: 1519, cat: 'ren', s: 'Mort de Vinci · Chambord', lvl: 3,  t: 'Mort de Léonard de Vinci, début de Chambord', d: 'Léonard de Vinci meurt à Amboise. François Ier fait commencer la construction du château de Chambord.' },
        { y: 1519, cat: 'dec', s: 'Départ de Magellan', lvl: -1, t: 'Départ de Magellan', d: 'Magellan quitte l’Espagne avec cinq navires.' },
        { y: 1521, cat: 'dec', s: 'Cortés et les Aztèques', lvl: -3, t: 'Cortés conquiert l’empire aztèque', d: 'Hernán Cortés s’empare de Tenochtitlan, la capitale aztèque (aujourd’hui Mexico).' },
        { y: 1522, cat: 'dec', s: 'Premier tour du monde', lvl: -2, t: 'Premier tour du monde', d: 'La Victoria rentre en Espagne avec 18 survivants, menés par Elcano.' },
        { y: 1534, cat: 'dec', s: 'Cartier au Canada', lvl: -1, t: 'Jacques Cartier au Canada', d: 'Envoyé par François Ier, Jacques Cartier explore le golfe du Saint-Laurent.' },
        { y: 1539, cat: 'fr', s: 'Villers-Cotterêts', lvl: 1,  t: 'Ordonnance de Villers-Cotterêts', d: 'Le français remplace le latin dans les documents officiels du royaume.' },
        { y: 1543, cat: 'ren', s: 'Copernic et le Soleil', lvl: 2,  t: 'Copernic : la Terre tourne autour du Soleil', d: 'Nicolas Copernic publie son livre : le Soleil, et non la Terre, est au centre.' },
        { y: 1547, cat: 'fr', s: 'Mort de François Ier', lvl: 3,  t: 'Mort de François Ier', d: 'Son fils Henri II lui succède.' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // DONNÉES — QUIZ
    // ─────────────────────────────────────────────────────────────────────
    var QUIZ = [
        { q: 'Qui atteint l’Amérique en 1492 ?', o: ['Christophe Colomb', 'Vasco de Gama', 'Jacques Cartier', 'Magellan'], a: 0,
          x: 'Christophe Colomb débarque aux Bahamas le 12 octobre 1492, en croyant être arrivé en Asie.' },
        { q: 'Que cherchaient surtout les navigateurs en Asie ?', o: ['Des épices', 'Du blé', 'Des chevaux', 'Du charbon'], a: 0,
          x: 'Les épices (poivre, cannelle, girofle…) valaient une fortune en Europe.' },
        { q: 'Quel navigateur ouvre la route maritime vers l’Inde en contournant l’Afrique ?', o: ['Vasco de Gama', 'Christophe Colomb', 'Jacques Cartier', 'Amerigo Vespucci'], a: 0,
          x: 'Vasco de Gama arrive à Calicut, en Inde, en mai 1498.' },
        { q: 'Grâce à quoi la caravelle peut-elle avancer même quand le vent vient de côté ?', o: ['Sa voile latine (triangulaire)', 'Ses rames', 'Son ancre', 'Sa grande cale'], a: 0,
          x: 'La voile latine permet de naviguer avec un vent de côté, et presque contre le vent.' },
        { q: 'À quoi sert l’astrolabe ?', o: ['À calculer sa latitude grâce au Soleil ou aux étoiles', 'À mesurer la profondeur de la mer', 'À indiquer le nord', 'À mesurer la vitesse du bateau'], a: 0,
          x: 'En mesurant la hauteur du Soleil ou de l’étoile Polaire, on sait à quelle distance on est de l’équateur.' },
        { q: 'Quelle expédition réalise le premier tour du monde ?', o: ['Celle de Magellan, terminée par Elcano', 'Celle de Christophe Colomb', 'Celle de Bartolomeu Dias', 'Celle de Jacques Cartier'], a: 0,
          x: 'Magellan meurt aux Philippines en 1521 ; Elcano ramène la Victoria en Espagne en 1522.' },
        { q: 'Quel explorateur, envoyé par François Ier, explore le Canada ?', o: ['Jacques Cartier', 'Vasco de Gama', 'Hernán Cortés', 'Bartolomeu Dias'], a: 0,
          x: 'Jacques Cartier, de Saint-Malo, explore le golfe et le fleuve Saint-Laurent en 1534 et 1535.' },
        { q: 'Qui invente l’imprimerie à caractères mobiles en Europe, vers 1450 ?', o: ['Gutenberg', 'Léonard de Vinci', 'Copernic', 'Michel-Ange'], a: 0,
          x: 'Gutenberg, à Mayence. Les livres deviennent moins chers et les idées circulent plus vite.' },
        { q: 'Quel grand artiste italien finit sa vie en France, invité par François Ier ?', o: ['Léonard de Vinci', 'Michel-Ange', 'Gutenberg', 'Érasme'], a: 0,
          x: 'Léonard de Vinci meurt en 1519 au Clos Lucé, près d’Amboise.' },
        { q: 'Quel château de la Loire François Ier fait-il construire ?', o: ['Chambord', 'Versailles', 'Le château fort de Carcassonne', 'Le château de Vaux-le-Vicomte'], a: 0,
          x: 'Chambord, commencé en 1519, avec son escalier à double révolution. Versailles sera construit plus tard, par Louis XIV.' },
        { q: 'Lequel de ces aliments vient d’Amérique ?', o: ['La tomate', 'Le blé', 'Le riz', 'Le poivre'], a: 0,
          x: 'La tomate vient du Mexique. Le blé était déjà cultivé en Europe, le riz et le poivre viennent d’Asie.' },
        { q: 'Que veut dire le mot « Renaissance » ?', o: ['On fait « renaître » l’art et les savoirs de l’Antiquité', 'Les rois naissent une seconde fois', 'On reconstruit les châteaux forts', 'On redécouvre l’Amérique'], a: 0,
          x: 'Les artistes et les savants s’inspirent de la Grèce et de la Rome antiques.' },
        { q: 'Pourquoi tant d’Amérindiens meurent-ils après l’arrivée des Européens ?', o: ['À cause des maladies venues d’Europe, des guerres et du travail forcé', 'À cause d’une grande famine naturelle', 'À cause des volcans', 'Ils partent vivre en Europe'], a: 0,
          x: 'La variole, la rougeole ou la grippe étaient inconnues en Amérique ; s’y ajoutent les violences de la conquête.' },
        { q: 'Quelle date marque traditionnellement le début des Temps modernes ?', o: ['1492', '1515', '1789', '1453'], a: 0,
          x: '1492, l’arrivée de Colomb en Amérique. Certains historiens choisissent aussi 1453, la prise de Constantinople.' }
    ];

    var TABS = [
        { k: 'pourquoi',    label: 'Pourquoi partir ?' },
        { k: 'navires',     label: 'Les navires' },
        { k: 'voyages',     label: 'Les voyages' },
        { k: 'monde',       label: 'Le monde change' },
        { k: 'renaissance', label: 'La Renaissance' },
        { k: 'frise',       label: 'Frise' },
        { k: 'quiz',        label: 'Quiz' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // CSS (injecté une seule fois)
    // ─────────────────────────────────────────────────────────────────────
    function injectCss() {
        if (document.getElementById('drn-style')) return;
        var css = `
.widget[data-type="histoire-renaissance"] { background: transparent !important; border-radius: 16px; }
.drn-container {
    --ink:#2b2118; --paper:#f8f1e1; --paper2:#efe2c3; --line:#d9c79f;
    --navy:#1d3a5c; --gold:#c8952e; --red:#a63b2a;
    position: relative; display: flex; flex-direction: column; box-sizing: border-box;
    width: ${DEF_W}px; height: ${DEF_H}px; font-size: 16px;
    background: var(--paper); color: var(--ink);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 10px 34px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.25);
    font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; line-height: 1.35;
    user-select: none; -webkit-user-select: none; touch-action: manipulation;
}
.drn-container *, .drn-container *::before, .drn-container *::after { box-sizing: border-box; }
.drn-container.drn-fullboard {
    position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important;
    z-index: 9999 !important; border-radius: 0 !important; padding-left: 60px;
    box-shadow: none !important;
}
@media (max-width: 768px) { .drn-container.drn-fullboard { padding-left: 0; } }
.drn-container.drn-collapsed { height: auto !important; }
.drn-container.drn-collapsed .drn-body, .drn-container.drn-collapsed .drn-tabs,
.drn-container.drn-collapsed .drn-resize { display: none !important; }

/* En-tête */
.drn-head { flex-shrink: 0; background: linear-gradient(120deg, #1d3a5c, #26527a 60%, #1d3a5c); color: #fff;
    border-bottom: .2em solid var(--gold); }
.drn-headrow { display: flex; align-items: center; gap: .7em; padding: .45em .8em .35em; }
.drn-logo { width: 2.1em; height: 2.1em; flex-shrink: 0; }
.drn-titles { flex: 1; min-width: 0; }
.drn-t1 { font-size: 1.12em; font-weight: 800; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.drn-t2 { font-size: .72em; opacity: .75; font-weight: 600; }
.drn-head .wf-btns { gap: .5em; }
.drn-tabs { display: flex; gap: .25em; padding: 0 .6em; overflow-x: auto; scrollbar-width: none; }
.drn-tabs::-webkit-scrollbar { display: none; }
.drn-tab { all: unset; cursor: pointer; flex-shrink: 0; padding: .42em .85em .5em; font-size: .82em; font-weight: 700;
    color: rgba(255,255,255,.72); border-radius: .6em .6em 0 0; transition: background .15s, color .15s; }
.drn-tab:hover { background: rgba(255,255,255,.1); color: #fff; }
.drn-tab.on { background: var(--paper); color: var(--navy); }
.drn-tab:focus-visible { outline: 2px solid var(--gold); }

/* Corps */
.drn-body { flex: 1; min-height: 0; position: relative; overflow: hidden; }
.drn-pane { position: absolute; inset: 0; overflow: auto; padding: .9em 1em 1em; display: none; }
.drn-pane.on { display: block; }
.drn-pane::-webkit-scrollbar { width: .5em; }
.drn-pane::-webkit-scrollbar-thumb { background: rgba(122,82,20,.35); border-radius: .3em; }
.drn-h { font-size: 1.05em; font-weight: 800; color: var(--navy); margin: 0 0 .5em; display: flex; align-items: center; gap: .4em; }
.drn-h small { font-weight: 600; color: #7a6a52; font-size: .78em; }
.drn-p { font-size: .9em; margin: 0 0 .6em; }
.drn-btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: .35em; padding: .38em .8em;
    border-radius: .55em; background: #fff; border: 1px solid var(--line); font-size: .82em; font-weight: 700; color: var(--ink);
    transition: background .15s, border-color .15s, transform .08s; }
.drn-btn:hover { border-color: var(--gold); background: #fffaf0; }
.drn-btn:active { transform: scale(.96); }
.drn-btn.prim { background: var(--navy); color: #fff; border-color: var(--navy); }
.drn-btn.prim:hover { background: #26527a; }
.drn-btn.on { background: var(--gold); color: #fff; border-color: var(--gold); }
.drn-btn[disabled] { opacity: .4; pointer-events: none; }
.drn-card { background: #fff; border: 1px solid var(--line); border-radius: .8em; padding: .7em .8em;
    box-shadow: 0 1px 3px rgba(80,60,20,.08); }
.drn-info { background: #fffaf0; border: 1px solid var(--line); border-left: .3em solid var(--gold);
    border-radius: .6em; padding: .65em .85em; font-size: .9em; }
.drn-info b.drn-it { display: block; color: var(--navy); font-size: 1.05em; margin-bottom: .2em; }
.drn-info .drn-meta { font-size: .8em; color: #7a6a52; font-weight: 700; margin-bottom: .25em; }

/* Carte */
.drn-map { width: 100%; height: auto; display: block; border-radius: .6em; border: 2px solid #b8955a;
    background: #b6d0d6; }
.drn-grid line { stroke: rgba(255,255,255,.35); stroke-width: .6; }
.drn-equator { stroke: rgba(166,59,42,.5); stroke-width: .8; stroke-dasharray: 4 3; }
.drn-land polygon { fill: #ead9ab; stroke: #a8895a; stroke-width: .7; stroke-linejoin: round; }
.drn-inner-sea polygon { fill: #b9d3d9; stroke: #a8895a; stroke-width: .5; }
.drn-ocean { font-style: italic; fill: #4f7480; font-weight: 700; letter-spacing: .08em; }
.drn-cont { fill: #8a6a3a; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; opacity: .65; }
.drn-place circle { stroke: #fff; stroke-width: 1; }
.drn-place text { font-weight: 800; paint-order: stroke; stroke: rgba(255,250,235,.9); stroke-width: 2.6px; fill: #2b2118; }

/* Pourquoi */
.drn-why { display: grid; grid-template-columns: 1fr 1.15fr; gap: 1em; align-items: start; }
.drn-why-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .55em; }
.drn-why-card { cursor: pointer; display: flex; gap: .55em; align-items: center; padding: .55em .65em;
    background: #fff; border: 1px solid var(--line); border-radius: .7em; transition: border-color .15s, transform .12s, box-shadow .15s; }
.drn-why-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 .4em .9em rgba(120,80,20,.15); }
.drn-why-card.on { border-color: var(--navy); background: #eef3f8; box-shadow: inset .3em 0 0 var(--navy); }
.drn-why-card .e { font-size: 1.6em; flex-shrink: 0; }
.drn-why-card b { display: block; font-size: .9em; color: var(--navy); }
.drn-why-card span { display: block; font-size: .72em; color: #6b5a40; line-height: 1.2; }
.drn-legend { display: flex; flex-wrap: wrap; gap: .3em .9em; font-size: .75em; margin-top: .4em; color: #5a4a30; }
.drn-legend i { display: inline-block; width: 1.8em; height: 0; border-top: .22em solid; vertical-align: middle; margin-right: .35em; }
.drn-legend i.dash { border-top-style: dashed; }

/* Navires */
.drn-ship-wrap { display: grid; grid-template-columns: 1.35fr 1fr; gap: 1em; align-items: start; }
.drn-ship-svg { width: 100%; height: auto; display: block; border-radius: .7em; border: 2px solid #b8955a;
    background: linear-gradient(#cfe4ec, #e8f2f4 70%); }
.drn-hot { cursor: pointer; }
.drn-hot circle { fill: var(--red); stroke: #fff; stroke-width: 2.5; transition: transform .15s; transform-box: fill-box; transform-origin: center; }
.drn-hot text { fill: #fff; font-weight: 800; font-size: 15px; pointer-events: none; }
.drn-hot:hover circle { transform: scale(1.18); }
.drn-hot.on circle { fill: var(--navy); }
.drn-hot.seen:not(.on) circle { fill: #c97b6c; }
@keyframes drn-pulse { 0%,100% { opacity: .9; r: 15; } 50% { opacity: 0; r: 24; } }
.drn-hot .ring { fill: none; stroke: var(--red); stroke-width: 2; animation: drn-pulse 2s infinite; }
.drn-hot.seen .ring { display: none; }
.drn-parts-list { display: flex; flex-wrap: wrap; gap: .3em; margin-bottom: .6em; }
.drn-chip { all: unset; cursor: pointer; font-size: .76em; font-weight: 700; padding: .25em .6em; border-radius: 1em;
    background: #fff; border: 1px solid var(--line); }
.drn-chip:hover { border-color: var(--gold); }
.drn-chip.on { background: var(--navy); color: #fff; border-color: var(--navy); }
.drn-instr { display: grid; grid-template-columns: repeat(4, 1fr); gap: .55em; margin-top: .8em; }
.drn-instr-card { cursor: pointer; text-align: center; padding: .4em .3em .5em; background: #fff; border: 1px solid var(--line);
    border-radius: .7em; transition: border-color .15s, transform .12s; }
.drn-instr-card:hover { border-color: var(--gold); transform: translateY(-2px); }
.drn-instr-card.on { border-color: var(--navy); background: #eef3f8; }
.drn-instr-card svg { width: 3.4em; height: 3.4em; display: block; margin: 0 auto .15em; }
.drn-instr-card b { font-size: .78em; color: var(--navy); }
@keyframes drn-rock { 0%,100% { transform: rotate(-1.2deg) translateY(0); } 50% { transform: rotate(1.2deg) translateY(3px); } }
.drn-ship-rock { animation: drn-rock 4s ease-in-out infinite; transform-origin: 300px 300px; }
@media (prefers-reduced-motion: reduce) { .drn-ship-rock, .drn-hot .ring { animation: none; } }

/* Voyages */
.drn-voy { display: grid; grid-template-columns: 13.5em 1fr; gap: .8em; align-items: start; }
.drn-explist { display: flex; flex-direction: column; gap: .35em; }
.drn-exp { cursor: pointer; display: flex; align-items: center; gap: .5em; padding: .45em .55em; background: #fff;
    border: 1px solid var(--line); border-left: .35em solid var(--c); border-radius: .6em; transition: background .15s, transform .12s; }
.drn-exp:hover { transform: translateX(2px); background: #fffaf0; }
.drn-exp.on { background: color-mix(in srgb, var(--c) 14%, #fff); border-color: var(--c); }
.drn-exp .f { font-size: 1.3em; }
.drn-exp b { display: block; font-size: .85em; line-height: 1.15; }
.drn-exp span { display: block; font-size: .72em; color: #6b5a40; }
.drn-ctrl { display: flex; flex-wrap: wrap; gap: .35em; align-items: center; margin: .55em 0; }
.drn-ctrl .lbl { font-size: .74em; font-weight: 700; color: #6b5a40; margin-left: .3em; }
.drn-steps { display: flex; flex-wrap: wrap; gap: .25em; margin: 0 0 .5em; }
.drn-step { all: unset; cursor: pointer; font-size: .72em; font-weight: 700; padding: .2em .5em; border-radius: .8em;
    background: #fff; border: 1px solid var(--line); color: #7a6a52; }
.drn-step.done { color: var(--ink); border-color: var(--c); }
.drn-step.on { background: var(--c); color: #fff; border-color: var(--c); }
.drn-ship-ic path { stroke-linejoin: round; }

/* Le monde change */
.drn-exch { display: grid; grid-template-columns: 1fr 11em 1fr; gap: .7em; align-items: stretch; }
.drn-side { background: #fff; border: 1px solid var(--line); border-radius: .8em; padding: .55em .6em; }
.drn-side h4 { margin: 0 0 .45em; font-size: .86em; color: var(--navy); text-align: center; }
.drn-side.am { border-top: .3em solid #2f7d4f; }
.drn-side.om { border-top: .3em solid #2a6fa8; }
.drn-items { display: flex; flex-wrap: wrap; gap: .3em; justify-content: center; min-height: 3em; }
.drn-item { cursor: pointer; display: inline-flex; align-items: center; gap: .3em; padding: .22em .55em .22em .35em;
    border-radius: 1em; background: #f8f1e1; border: 1px solid var(--line); font-size: .78em; font-weight: 700; transition: transform .12s, border-color .15s; }
.drn-item:hover { border-color: var(--gold); transform: translateY(-1px); }
.drn-item.on { background: var(--navy); color: #fff; border-color: var(--navy); }
.drn-item .e { font-size: 1.35em; }
@keyframes drn-pop { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
.drn-item.new { animation: drn-pop .35s ease; }
.drn-mid { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .35em; text-align: center; }
.drn-arrow { width: 100%; height: 2.6em; }
.drn-mid small { font-size: .7em; color: #6b5a40; font-weight: 700; }
.drn-game { text-align: center; }
.drn-game .big { font-size: 3em; line-height: 1; }
.drn-game .nm { font-size: .9em; font-weight: 800; margin: .15em 0 .4em; }
.drn-game .btns { display: flex; flex-direction: column; gap: .3em; }
.drn-game .btns .drn-btn { justify-content: center; }
.drn-fb { font-size: .8em; font-weight: 700; min-height: 1.3em; margin-top: .3em; }
.drn-fb.ok { color: #2f7d4f; } .drn-fb.ko { color: var(--red); }
.drn-cons { display: grid; grid-template-columns: repeat(3, 1fr); gap: .55em; align-items: start; }
.drn-con { cursor: pointer; background: #fff; border: 1px solid var(--line); border-radius: .75em; padding: .55em .7em;
    transition: border-color .15s, box-shadow .15s; }
.drn-con:hover { border-color: var(--gold); }
.drn-con .hd { display: flex; align-items: center; gap: .45em; font-weight: 800; font-size: .86em; color: var(--navy); }
.drn-con .hd .e { font-size: 1.4em; }
.drn-con .hd .chev { margin-left: auto; font-size: .8em; color: #a08a60; transition: transform .2s; }
.drn-con .tx { display: none; font-size: .8em; margin-top: .4em; }
.drn-con.open { border-color: var(--navy); box-shadow: 0 .3em .9em rgba(29,58,92,.12); }
.drn-con.open .tx { display: block; }
.drn-con.open .chev { transform: rotate(180deg); }

/* Renaissance */
.drn-rgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(10.5em, 1fr)); gap: .6em; }
.drn-rcard { cursor: pointer; text-align: center; background: #fff; border: 1px solid var(--line); border-radius: .85em;
    padding: .55em .5em .6em; border-top: .3em solid var(--c); transition: transform .14s, box-shadow .15s; }
.drn-rcard:hover { transform: translateY(-3px); box-shadow: 0 .6em 1.2em rgba(120,80,20,.16); }
.drn-rcard svg { width: 4em; height: 4em; display: block; margin: 0 auto .2em; }
.drn-rcard b { display: block; font-size: .88em; color: var(--navy); }
.drn-rcard span { display: block; font-size: .7em; color: #7a6a52; font-weight: 700; }
.drn-detail { display: grid; grid-template-columns: 9em 1fr; gap: 1em; align-items: start; }
.drn-detail .ico { background: #fff; border: 1px solid var(--line); border-radius: 1em; padding: .6em; border-top: .35em solid var(--c); }
.drn-detail .ico svg { width: 100%; height: auto; display: block; }
.drn-detail h3 { margin: 0 0 .1em; color: var(--navy); font-size: 1.2em; }
.drn-detail .dt { font-size: .8em; font-weight: 800; color: var(--c); margin-bottom: .5em; }
.drn-detail .tx { font-size: .92em; }
.drn-extra { margin-top: .8em; }
.drn-press { display: flex; flex-wrap: wrap; gap: .8em; align-items: center; }
.drn-press input { font: inherit; font-size: .9em; padding: .35em .6em; border-radius: .5em; border: 1px solid var(--line);
    width: 11em; text-transform: uppercase; user-select: text; -webkit-user-select: text; }
.drn-type { display: inline-flex; gap: .12em; padding: .35em; background: #3a3a3a; border-radius: .4em; min-height: 2.6em; min-width: 3em; }
.drn-type span { display: inline-flex; align-items: center; justify-content: center; width: 1.45em; height: 1.9em;
    background: linear-gradient(#9aa3ad, #6d7680); color: #1d1d1d; font-family: Georgia, 'Times New Roman', serif; font-weight: 700;
    border-radius: .15em; transform: scaleX(-1); font-size: 1em; box-shadow: inset 0 -.15em 0 rgba(0,0,0,.25); }
.drn-paper { display: inline-flex; align-items: center; min-height: 2.6em; min-width: 8em; padding: .35em .8em;
    background: #fffdf6; border: 1px solid var(--line); font-family: Georgia, 'Times New Roman', serif; font-weight: 700;
    font-size: 1.15em; letter-spacing: .08em; box-shadow: 0 .2em .5em rgba(0,0,0,.08); }
@keyframes drn-print { 0% { opacity: 0; filter: blur(2px); transform: translateY(-.4em); } 100% { opacity: 1; filter: none; transform: none; } }
.drn-paper.printed span { animation: drn-print .5s ease both; }
.drn-persp { width: 100%; max-width: 30em; height: auto; display: block; border-radius: .6em; border: 2px solid #b8955a; touch-action: none; }
.drn-vp { cursor: grab; }

/* Frise */
.drn-frise { width: 100%; height: auto; display: block; }
.drn-fev { cursor: pointer; }
.drn-fev rect { transition: filter .15s; }
.drn-fev:hover rect { filter: brightness(1.12); }
.drn-fev.on rect { stroke: #2b2118; stroke-width: 2; }
.drn-fev text { font-size: 10.5px; font-weight: 700; fill: #fff; pointer-events: none; }
.drn-hide-dates .drn-fyear { visibility: hidden; }

/* Quiz */
.drn-quiz { max-width: 40em; margin: 0 auto; }
.drn-qhead { display: flex; justify-content: space-between; align-items: center; font-size: .82em; font-weight: 800; color: #6b5a40; margin-bottom: .4em; }
.drn-qbar { height: .45em; background: var(--paper2); border-radius: .3em; overflow: hidden; margin-bottom: .8em; }
.drn-qbar i { display: block; height: 100%; background: var(--gold); transition: width .3s; }
.drn-q { font-size: 1.12em; font-weight: 800; color: var(--navy); margin-bottom: .7em; }
.drn-opts { display: grid; grid-template-columns: 1fr 1fr; gap: .5em; }
.drn-opt { all: unset; cursor: pointer; padding: .7em .8em; border-radius: .7em; background: #fff; border: 2px solid var(--line);
    font-size: .92em; font-weight: 700; transition: border-color .15s, background .15s; }
.drn-opt:hover { border-color: var(--gold); }
.drn-opt.ok { background: #e3f3e8; border-color: #2f7d4f; color: #1d5a35; }
.drn-opt.ko { background: #f8e3df; border-color: var(--red); color: #7a2618; }
.drn-opt.dim { opacity: .55; }
.drn-qx { margin-top: .7em; }
.drn-qnav { display: flex; justify-content: flex-end; margin-top: .7em; }
.drn-score { text-align: center; padding: 1em; }
.drn-score .big { font-size: 3em; font-weight: 900; color: var(--navy); }

/* Poignée de redimensionnement */
.drn-resize { position: absolute; right: 0; bottom: 0; width: 1.3em; height: 1.3em; cursor: nwse-resize; z-index: 5; touch-action: none;
    background: linear-gradient(135deg, transparent 50%, rgba(122,82,20,.55) 50%); border-radius: 0 0 14px 0; }
.drn-container.drn-fullboard .drn-resize { display: none; }

/* ── Curseurs ──────────────────────────────────────────────────────────
   Flèche partout par défaut (y compris sur les textes et les cartes),
   main qui pointe sur ce qui se clique, main qui attrape sur ce qui se
   déplace (barre de titre, point de fuite), main fermée pendant le glisser. */
.drn-container, .drn-container * { cursor: default; }
.drn-container .drn-tab, .drn-container .drn-btn, .drn-container .wf-btn,
.drn-container .drn-why-card, .drn-container .drn-why-card *,
.drn-container .drn-hot, .drn-container .drn-hot *,
.drn-container .drn-chip, .drn-container .drn-instr-card, .drn-container .drn-instr-card *,
.drn-container .drn-exp, .drn-container .drn-exp *,
.drn-container .drn-step, .drn-container .drn-item, .drn-container .drn-item *,
.drn-container .drn-con, .drn-container .drn-con *,
.drn-container .drn-rcard, .drn-container .drn-rcard *,
.drn-container .drn-fev, .drn-container .drn-fev *,
.drn-container .drn-opt:not([disabled]) { cursor: pointer; }
.drn-container .drn-btn[disabled], .drn-container .drn-opt[disabled] { cursor: default; }
.drn-container .drn-press input { cursor: text; }
.drn-container .drn-headrow, .drn-container .drn-headrow .drn-titles,
.drn-container .drn-headrow .drn-titles *, .drn-container .drn-headrow .drn-logo,
.drn-container .drn-headrow .drn-logo * { cursor: grab; }
.drn-container .drn-persp, .drn-container .drn-persp * { cursor: grab; }
.drn-container .drn-resize { cursor: nwse-resize; }
.drn-container.drn-fullboard .drn-headrow, .drn-container.drn-fullboard .drn-headrow *,
.widget[data-anchored="true"] .drn-container .drn-headrow, .widget[data-anchored="true"] .drn-container .drn-headrow * { cursor: default; }
.drn-container.drn-fullboard .drn-headrow .wf-btn, .widget[data-anchored="true"] .drn-container .drn-headrow .wf-btn { cursor: pointer; }
.drn-container.drn-grabbing, .drn-container.drn-grabbing * { cursor: grabbing !important; }

/* Mise en page étroite */
.drn-narrow .drn-why, .drn-narrow .drn-ship-wrap, .drn-narrow .drn-voy { grid-template-columns: 1fr; }
.drn-narrow .drn-cons { grid-template-columns: 1fr 1fr; }
.drn-narrow .drn-exch { grid-template-columns: 1fr; }
.drn-narrow .drn-arrow { display: none; }
.drn-narrow .drn-explist { flex-direction: row; flex-wrap: wrap; }
.drn-narrow .drn-exp { flex: 1 1 12em; }
.drn-narrow .drn-detail { grid-template-columns: 6em 1fr; }
.drn-narrow .drn-opts { grid-template-columns: 1fr; }
.drn-narrow .drn-instr { grid-template-columns: repeat(2, 1fr); }
`;
        var st = document.createElement('style');
        st.id = 'drn-style';
        st.textContent = css;
        document.head.appendChild(st);
    }

    // ─────────────────────────────────────────────────────────────────────
    // HTML DES ONGLETS
    // ─────────────────────────────────────────────────────────────────────
    var LOGO = '<svg class="drn-logo" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#f8f1e1" stroke="#c8952e" stroke-width="2"/>' +
        '<path d="M8 27 L32 27 L29 32 L11 32 Z" fill="#7a4a22"/><line x1="20" y1="27" x2="20" y2="8" stroke="#5a3a18" stroke-width="1.6"/>' +
        '<path d="M14 10 Q20 8 26 10 L26 21 Q20 23 14 21 Z" fill="#fff" stroke="#c9b48a" stroke-width=".8"/><path d="M20 12 v7 M17 15.5 h6" stroke="#a63b2a" stroke-width="1.6"/>' +
        '<path d="M6 34 Q11 31 16 34 T26 34 T36 34" fill="none" stroke="#2a6fa8" stroke-width="1.5"/></svg>';

    function paneWhy() {
        var s = '<div class="drn-why"><div>';
        s += '<div class="drn-h">🧭 Pourquoi partir si loin ? <small>Clique sur une raison</small></div>';
        s += '<div class="drn-why-cards">';
        REASONS.forEach(function (r, i) {
            s += '<div class="drn-why-card" data-why="' + i + '"><span class="e">' + r.ico + '</span><div><b>' + r.title + '</b><span>' + r.short + '</span></div></div>';
        });
        s += '</div><div class="drn-info drn-why-info" style="margin-top:.7em"></div></div>';
        s += '<div><div class="drn-h">🗺️ Les routes des épices vers 1450</div>' + whyMapSVG() +
            '<div class="drn-legend"><span><i style="border-color:#8a5a2b"></i>Route terrestre (caravanes)</span>' +
            '<span><i style="border-color:#2a6fa8"></i>Route maritime des marchands arabes et vénitiens</span>' +
            '<span><i class="dash" style="border-color:#a63b2a"></i>Le rêve des Portugais : contourner l’Afrique</span></div></div></div>';
        return s;
    }
    function whyMapSVG() {
        var s = '<svg class="drn-map" viewBox="440 80 450 285">' + mapDefs('why') + mapBaseSVG({ id: 'why' });
        function line(list, col, w, dash) {
            return '<polyline points="' + pts(list) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
        }
        // empire ottoman (zone approximative)
        s += '<polygon points="' + pts([[19,42],[23,38],[26,40],[29,41],[36,36],[35,33],[34,31],[36,32],[40,37],[44,39],[42,42],[36,42],[29,44],[22,45]]) + '" fill="rgba(166,59,42,.25)" stroke="#a63b2a" stroke-width=".8" stroke-dasharray="2 1.5"/>';
        s += line([[109,34],[95,40],[80,41],[67,39.6],[58,37],[51,35.7],[44.4,33.3],[38,37],[29,41]], '#8a5a2b', 1.6);
        s += line([[127.4,-1],[115,-4],[102,2.5],[95,6],[80,7],[75.8,11.2],[65,14],[52,13],[45,12.8],[43,13.5],[39,20],[34.5,27.5],[32.5,30]], '#2a6fa8', 1.6);
        s += line([[32.5,30],[29.9,31.2]], '#8a5a2b', 1.6);
        s += line([[29.9,31.2],[25,34.2],[19,38],[18.6,40.5],[13,44.5],[12.3,45.4]], '#2a6fa8', 1.6);
        s += line([[29,41],[25.5,39],[23,36.5],[19,38]], '#2a6fa8', 1.6);
        s += line([[-9.1,38.7],[-16,28],[-19,12],[-10,2],[4,-12],[12,-28],[18.5,-36],[33,-28],[41,-15],[40,-4],[55,6],[75.8,11.2]], '#a63b2a', 1.4, '4 3');
        function place(lon, lat, t, dx, dy, c) {
            return '<g class="drn-place"><circle cx="' + PX(lon) + '" cy="' + PY(lat) + '" r="2.4" fill="' + (c || '#2b2118') + '"/>' +
                '<text x="' + (PX(lon) + (dx || 4)) + '" y="' + (PY(lat) + (dy || 3)) + '" font-size="8.5">' + t + '</text></g>';
        }
        s += place(12.3, 45.4, 'Venise', -24, -4);
        s += place(29, 41, 'Constantinople', 3, -4, '#a63b2a');
        s += place(29.9, 31.2, 'Alexandrie', -38, 8);
        s += place(-9.1, 38.7, 'Lisbonne', 3, -3);
        s += place(75.8, 11.2, 'Calicut', 3, 3);
        s += place(127.4, -1, 'Moluques', -14, 10);
        s += place(109, 34, 'Chine', 3, -4);
        s += '<text x="' + PX(35.5) + '" y="' + PY(37.6) + '" font-size="7" fill="#a63b2a" font-weight="800">Empire ottoman</text>';
        s += '<text class="drn-ocean" x="' + PX(73) + '" y="' + PY(-12) + '" font-size="10">Océan Indien</text>';
        s += '<text class="drn-ocean" x="' + PX(-19) + '" y="' + PY(-5) + '" font-size="9">Océan</text><text class="drn-ocean" x="' + PX(-19) + '" y="' + (PY(-5) + 11) + '" font-size="9">Atlantique</text>';
        s += '<text class="drn-cont" x="' + PX(16) + '" y="' + PY(4) + '" font-size="11">Afrique</text>';
        s += '<text class="drn-cont" x="' + PX(5) + '" y="' + PY(52) + '" font-size="11">Europe</text>';
        s += '<text class="drn-cont" x="' + PX(88) + '" y="' + PY(48) + '" font-size="12">Asie</text>';
        s += compassRose(PX(132), PY(28), 9);
        s += '</svg>';
        return s;
    }

    function shipSVG() {
        var s = '<svg class="drn-ship-svg" viewBox="0 0 600 400" aria-label="Une caravelle">';
        s += '<circle cx="520" cy="70" r="30" fill="#f6d77a" opacity=".8"/>';
        s += '<g class="drn-ship-rock">';
        // mâts
        s += '<line x1="200" y1="250" x2="200" y2="70" stroke="#5a3a18" stroke-width="7"/>';
        s += '<line x1="300" y1="250" x2="300" y2="40" stroke="#5a3a18" stroke-width="8"/>';
        s += '<line x1="420" y1="245" x2="420" y2="100" stroke="#5a3a18" stroke-width="6"/>';
        // voiles carrées
        s += '<line x1="150" y1="100" x2="250" y2="100" stroke="#5a3a18" stroke-width="5"/>';
        s += '<path d="M155,104 Q200,96 245,104 Q252,160 244,208 Q200,222 156,208 Q148,160 155,104 Z" fill="#f6eedb" stroke="#bfa77a" stroke-width="2"/>';
        s += '<path d="M200,128 v60 M176,158 h48" stroke="#a63b2a" stroke-width="9"/>';
        s += '<line x1="240" y1="78" x2="360" y2="78" stroke="#5a3a18" stroke-width="5"/>';
        s += '<path d="M245,82 Q300,73 355,82 Q364,150 354,214 Q300,230 246,214 Q236,150 245,82 Z" fill="#f6eedb" stroke="#bfa77a" stroke-width="2"/>';
        s += '<path d="M300,112 v76 M270,150 h60" stroke="#a63b2a" stroke-width="11"/>';
        // voile latine
        s += '<line x1="368" y1="224" x2="470" y2="74" stroke="#5a3a18" stroke-width="5"/>';
        s += '<path d="M372,220 L466,80 Q470,160 448,226 Z" fill="#f6eedb" stroke="#bfa77a" stroke-width="2"/>';
        // hune
        s += '<path d="M282,52 L318,52 L314,68 L286,68 Z" fill="#7a4a22" stroke="#4a2c10" stroke-width="2"/>';
        // drapeaux
        s += '<path d="M300,40 L300,22 L330,28 L300,34" fill="#a63b2a"/><path d="M200,70 L200,56 L222,61 L200,66" fill="#c8952e"/><path d="M420,100 L420,88 L438,93 L420,97" fill="#2a6fa8"/>';
        // cordages
        s += '<g stroke="#6b5434" stroke-width="1.3" opacity=".7"><line x1="300" y1="45" x2="90" y2="244"/><line x1="300" y1="45" x2="520" y2="236"/><line x1="200" y1="72" x2="60" y2="226"/><line x1="420" y1="102" x2="535" y2="232"/></g>';
        // beaupré
        s += '<line x1="95" y1="246" x2="40" y2="220" stroke="#5a3a18" stroke-width="6"/>';
        // château arrière
        s += '<path d="M430,244 L534,236 L530,202 L440,207 Z" fill="#9a6532" stroke="#4a2c10" stroke-width="2.5"/>';
        s += '<g fill="#4a2c10"><rect x="452" y="214" width="10" height="10" rx="2"/><rect x="474" y="213" width="10" height="10" rx="2"/><rect x="496" y="211" width="10" height="10" rx="2"/></g>';
        // coque
        s += '<path d="M70,248 L540,236 Q534,296 482,322 L140,326 Q95,302 70,248 Z" fill="#8b5a2b" stroke="#4a2c10" stroke-width="3"/>';
        s += '<g stroke="#5e3a17" stroke-width="2" fill="none" opacity=".8"><path d="M82,268 Q300,262 532,256"/><path d="M98,288 Q300,284 522,278"/><path d="M118,306 Q300,304 500,300"/></g>';
        s += '<g fill="#3a220c"><circle cx="170" cy="262" r="4.5"/><circle cx="240" cy="260" r="4.5"/><circle cx="310" cy="258" r="4.5"/><circle cx="380" cy="256" r="4.5"/></g>';
        // gouvernail
        s += '<path d="M532,246 L556,252 L548,322 L520,318 Z" fill="#6b4220" stroke="#3a220c" stroke-width="2.5"/>';
        // ancre
        s += '<path d="M110,262 v22 M102,278 q8,10 16,0" stroke="#3c4a5c" stroke-width="3" fill="none"/>';
        s += '</g>';
        // mer
        s += '<path d="M0,318 Q37,306 75,318 T150,318 T225,318 T300,318 T375,318 T450,318 T525,318 T600,318 L600,400 L0,400 Z" fill="#2a6fa8" opacity=".85"/>';
        s += '<path d="M0,334 Q37,324 75,334 T150,334 T225,334 T300,334 T375,334 T450,334 T525,334 T600,334 L600,400 L0,400 Z" fill="#1d4f7a"/>';
        // points cliquables
        SHIP_PARTS.forEach(function (p, i) {
            s += '<g class="drn-hot" data-part="' + i + '"><circle class="ring" cx="' + p.x + '" cy="' + p.y + '" r="15"/>' +
                '<circle cx="' + p.x + '" cy="' + p.y + '" r="15"/><text x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + p.n + '</text></g>';
        });
        s += '</svg>';
        return s;
    }
    function paneShips() {
        var s = '<div class="drn-ship-wrap"><div>';
        s += '<div class="drn-h">⛵ La caravelle <small>Clique sur les numéros</small></div>' + shipSVG();
        s += '<div class="drn-h" style="margin-top:.8em">🧭 Les instruments de navigation</div><div class="drn-instr">';
        INSTRUMENTS.forEach(function (it, i) {
            s += '<div class="drn-instr-card" data-instr="' + i + '"><svg viewBox="0 0 80 80">' + it.svg + '</svg><b>' + it.title + '</b></div>';
        });
        s += '</div></div><div><div class="drn-parts-list">';
        SHIP_PARTS.forEach(function (p, i) { s += '<button class="drn-chip" data-part="' + i + '">' + p.n + '. ' + p.title + '</button>'; });
        s += '</div><div class="drn-info drn-ship-info"></div></div></div>';
        return s;
    }

    function voyMapSVG() {
        var s = '<svg class="drn-map drn-voymap" viewBox="0 30 1000 390">' + mapDefs('voy') + mapBaseSVG({ id: 'voy' });
        s += '<text class="drn-ocean" x="' + PX(-42) + '" y="' + PY(34) + '" font-size="13" text-anchor="middle">Océan</text><text class="drn-ocean" x="' + PX(-42) + '" y="' + (PY(34) + 15) + '" font-size="13" text-anchor="middle">Atlantique</text>';
        s += '<text class="drn-ocean" x="' + PX(-135) + '" y="' + PY(5) + '" font-size="14" text-anchor="middle">Océan Pacifique</text>';
        s += '<text class="drn-ocean" x="' + PX(78) + '" y="' + PY(-22) + '" font-size="13" text-anchor="middle">Océan Indien</text>';
        s += '<text class="drn-cont" x="' + PX(-100) + '" y="' + PY(50) + '" font-size="15" text-anchor="middle">Amérique</text>';
        s += '<text class="drn-cont" x="' + PX(18) + '" y="' + PY(53) + '" font-size="13" text-anchor="middle">Europe</text>';
        s += '<text class="drn-cont" x="' + PX(20) + '" y="' + PY(8) + '" font-size="15" text-anchor="middle">Afrique</text>';
        s += '<text class="drn-cont" x="' + PX(95) + '" y="' + PY(52) + '" font-size="16" text-anchor="middle">Asie</text>';
        s += '<text class="drn-cont" x="' + PX(133) + '" y="' + PY(-26) + '" font-size="11" text-anchor="middle">Océanie</text>';
        s += '<text x="' + PX(-178) + '" y="' + (PY(0) - 3) + '" font-size="8" fill="#a63b2a" font-weight="700">équateur</text>';
        s += compassRose(PX(-160), PY(-42), 13);
        s += '<g class="drn-routes-all"></g><g class="drn-route-ghost"></g><g class="drn-route-done"></g><g class="drn-places"></g>';
        s += '<g class="drn-ship-ic" style="display:none"><g class="drn-ship-flip">' +
            '<path d="M-11,0 L11,0 L8,5 L-8,5 Z" fill="#6b3f1d" stroke="#3a220c" stroke-width=".8"/>' +
            '<line x1="0" y1="0" x2="0" y2="-17" stroke="#3a220c" stroke-width="1.4"/>' +
            '<path d="M-7,-15 Q0,-17 7,-15 L7,-3 Q0,-1 -7,-3 Z" fill="#fff" stroke="#8a7a5a" stroke-width=".7"/>' +
            '<path d="M0,-13 v8 M-3,-9 h6" stroke="#a63b2a" stroke-width="1.3"/></g></g>';
        s += '</svg>';
        return s;
    }
    function paneVoy() {
        var s = '<div class="drn-voy"><div><div class="drn-h">⚓ Les navigateurs</div><div class="drn-explist">';
        VOYAGES.forEach(function (v, i) {
            s += '<div class="drn-exp" data-exp="' + i + '" style="--c:' + v.color + '"><span class="f">' + v.flag + '</span><div><b>' + v.name + '</b><span>' + v.years + ' · ' + v.country + '</span></div></div>';
        });
        s += '<div class="drn-exp" data-exp="all" style="--c:#7a6a52"><span class="f">🌍</span><div><b>Tous les voyages</b><span>Vue d’ensemble</span></div></div>';
        s += '</div></div><div>' + voyMapSVG();
        s += '<div class="drn-ctrl"><button class="drn-btn prim drn-play">▶ Lancer le voyage</button>' +
            '<button class="drn-btn drn-restart">⏮ Recommencer</button><button class="drn-btn drn-full">⏭ Tout le trajet</button>' +
            '<span class="lbl">Vitesse :</span>';
        SPEEDS.forEach(function (sp) { s += '<button class="drn-btn drn-speed" data-speed="' + sp.k + '">' + sp.label + '</button>'; });
        s += '</div><div class="drn-steps"></div><div class="drn-info drn-voy-info"></div></div></div>';
        return s;
    }

    function paneMonde() {
        var s = '<div class="drn-h">🔄 Les grands échanges <small>Ce qui traverse l’Atlantique après 1492</small></div>';
        s += '<div class="drn-ctrl" style="margin-top:0"><button class="drn-btn drn-exmode" data-mode="voir">👀 Découvrir</button>' +
            '<button class="drn-btn drn-exmode" data-mode="jeu">🎲 Jeu : d’où ça vient ?</button></div>';
        s += '<div class="drn-exch"><div class="drn-side am"><h4>🌎 Venus d’Amérique<br><small>vers l’Europe, l’Afrique et l’Asie</small></h4><div class="drn-items" data-side="A"></div></div>';
        s += '<div class="drn-mid"></div>';
        s += '<div class="drn-side om"><h4>🌍 Venus de l’« Ancien Monde »<br><small>(Europe, Afrique, Asie) vers l’Amérique</small></h4><div class="drn-items" data-side="M"></div></div></div>';
        s += '<div class="drn-info drn-ex-info" style="margin-top:.6em"></div>';
        s += '<div class="drn-h" style="margin-top:1em">🌐 Les conséquences des découvertes <small>Clique pour lire</small></div><div class="drn-cons">';
        CONSEQUENCES.forEach(function (c, i) {
            s += '<div class="drn-con" data-con="' + i + '"><div class="hd"><span class="e">' + c.ico + '</span>' + c.title + '<span class="chev">▼</span></div><div class="tx">' + c.text + '</div></div>';
        });
        s += '</div>';
        return s;
    }

    function paneRen() {
        var s = '<div class="drn-rhome"><div class="drn-h">🎨 La Renaissance <small>Clique sur une carte</small></div><div class="drn-rgrid">';
        RENAISSANCE.forEach(function (r, i) {
            s += '<div class="drn-rcard" data-ren="' + i + '" style="--c:' + r.c + '"><svg viewBox="0 0 80 80">' + r.ico + '</svg><b>' + r.title + '</b><span>' + r.date + '</span></div>';
        });
        s += '</div></div><div class="drn-rdetail" style="display:none"></div>';
        return s;
    }

    function friseSVG() {
        var X0 = 40, X1 = 955, BH = 28, LH = 38, BAND = 30;
        function X(y) { return X0 + (y - FR_Y0) / (FR_Y1 - FR_Y0) * (X1 - X0); }
        // Répartition automatique des étiquettes en couloirs, au-dessus (Renaissance,
        // royaume de France) et au-dessous (Grandes découvertes), sans chevauchement
        var lanes = { up: [], down: [] };
        var items = FRISE.map(function (e, i) {
            var label = e.s || e.t;
            var w = Math.min(230, 20 + label.length * 5.9);
            var x = X(e.y);
            return { e: e, i: i, label: label, w: w, x: x, bx: Math.max(4, Math.min(996 - w, x - w / 2)), side: e.cat === 'dec' ? 'down' : 'up' };
        });
        items.slice().sort(function (a, b) { return a.x - b.x; }).forEach(function (it) {
            var L = lanes[it.side], k = 0;
            while (k < L.length && L[k] > it.bx - 6) k++;
            L[k] = it.bx + it.w;
            it.lane = k;
        });
        var nUp = lanes.up.length, nDown = lanes.down.length;
        var AY = 16 + nUp * LH + 24 + BAND / 2;
        var H = AY + BAND / 2 + 24 + nDown * LH + 6;
        var top = AY - BAND / 2, bot = AY + BAND / 2;
        var s = '<svg class="drn-frise" viewBox="0 0 1000 ' + H + '">';
        // périodes
        s += '<rect x="' + X0 + '" y="' + top + '" width="' + (X(1492) - X0) + '" height="' + BAND + '" fill="#8a7a5a"/>';
        s += '<rect x="' + X(1492) + '" y="' + top + '" width="' + (X1 - X(1492)) + '" height="' + BAND + '" fill="#2a6fa8"/>';
        s += '<polygon points="' + X1 + ',' + (top - 4) + ' ' + (X1 + 22) + ',' + AY + ' ' + X1 + ',' + (bot + 4) + '" fill="#2a6fa8"/>';
        s += '<text x="' + (X0 + 10) + '" y="' + (AY + 5) + '" font-size="13" font-weight="800" fill="#fff">Fin du Moyen Âge</text>';
        s += '<text x="' + (X1 - 8) + '" y="' + (AY + 5) + '" text-anchor="end" font-size="13" font-weight="800" fill="#fff">Les Temps modernes</text>';
        // graduations
        for (var y = FR_Y0; y <= FR_Y1; y += 10) {
            s += '<line x1="' + X(y) + '" y1="' + top + '" x2="' + X(y) + '" y2="' + (top + 6) + '" stroke="rgba(255,255,255,.6)" stroke-width="1"/>';
            s += '<line x1="' + X(y) + '" y1="' + (bot - 6) + '" x2="' + X(y) + '" y2="' + bot + '" stroke="rgba(255,255,255,.6)" stroke-width="1"/>';
        }
        // années repères sous la bande, en petit
        for (var y2 = FR_Y0; y2 <= FR_Y1; y2 += 20) {
            s += '<text class="drn-fyear" x="' + X(y2) + '" y="' + (top - 5) + '" text-anchor="middle" font-size="9" fill="#9a8a6a" font-weight="800">' + y2 + '</text>';
        }
        // événements : d'abord tous les traits, puis les étiquettes par-dessus
        items.forEach(function (it) {
            var c = CAT[it.e.cat].c, up = it.side === 'up';
            it.by = up ? top - 24 - BH - it.lane * LH : bot + 24 + it.lane * LH;
            var dotY = up ? top : bot;
            s += '<line x1="' + it.x + '" y1="' + dotY + '" x2="' + it.x + '" y2="' + (up ? it.by + BH : it.by) + '" stroke="' + c + '" stroke-width="1.6" opacity=".8"/>';
            s += '<circle cx="' + it.x + '" cy="' + dotY + '" r="4.5" fill="#fff" stroke="' + c + '" stroke-width="2.5"/>';
        });
        items.forEach(function (it) {
            var e = it.e, c = CAT[e.cat].c, by = it.by;
            s += '<g class="drn-fev" data-fev="' + it.i + '">';
            s += '<rect x="' + it.bx + '" y="' + by + '" width="' + it.w + '" height="' + BH + '" rx="7" fill="' + c + '"/>';
            s += '<text class="drn-fyear" x="' + (it.bx + it.w / 2) + '" y="' + (by + 11) + '" text-anchor="middle" style="font-size:10px;font-weight:900">' + e.y + '</text>';
            s += '<text x="' + (it.bx + it.w / 2) + '" y="' + (by + 23) + '" text-anchor="middle">' + esc(it.label) + '</text>';
            s += '</g>';
        });
        s += '</svg>';
        return s;
    }
    function paneFrise() {
        var s = '<div class="drn-h">📅 La frise des découvertes et de la Renaissance <small>Clique sur un événement</small></div>';
        s += '<div class="drn-ctrl" style="margin-top:0"><button class="drn-btn drn-hidedates">🙈 Masquer les dates</button>';
        Object.keys(CAT).forEach(function (k) {
            s += '<span class="lbl" style="display:inline-flex;align-items:center;gap:.3em"><i style="display:inline-block;width:.9em;height:.9em;border-radius:.2em;background:' + CAT[k].c + '"></i>' + CAT[k].label + '</span>';
        });
        s += '</div>' + friseSVG() + '<div class="drn-info drn-fr-info"></div>';
        return s;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CRÉATION DU WIDGET
    // ─────────────────────────────────────────────────────────────────────
    function createDecouvertesRenaissanceWidget(saved) {
        injectCss();
        var board = document.getElementById('board');
        if (!board) return null;
        var restoring = !!saved;
        if (!restoring && typeof snapshotNow === 'function') { try { snapshotNow(); } catch (e) {} }

        var widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = TYPE;
        widget.tabIndex = 0;

        var tabsHtml = TABS.map(function (t) { return '<button class="drn-tab" data-tab="' + t.k + '">' + t.label + '</button>'; }).join('');
        widget.innerHTML =
            '<div class="drag-handle" title="Déplacer">✥</div>' +
            '<div class="widget-rotate-handle" title="Faire pivoter">↻</div>' +
            '<div class="widget-action-bar">' +
                '<div class="widget-menu-handle" title="Menu">☰</div>' +
                '<div class="widget-pin-handle" title="Épingler">📌</div>' +
                '<div class="widget-back-handle" title="Envoyer derrière">🔽</div>' +
                '<div class="widget-close-handle" title="Fermer">×</div>' +
            '</div>' +
            '<div class="widget-ctx-menu"></div>' +
            '<div class="drn-container">' +
                '<div class="drn-head"><div class="drn-headrow">' + LOGO +
                    '<div class="drn-titles"><div class="drn-t1">Les Grandes découvertes et la Renaissance</div><div class="drn-t2">XV<sup>e</sup> – XVI<sup>e</sup> siècles · de 1450 à 1550 environ</div></div>' +
                    '<div class="wf-btns"><button class="wf-btn wf-btn-min" title="Réduire"></button><button class="wf-btn wf-btn-max" title="Plein écran"></button><button class="wf-btn wf-btn-close" title="Fermer"></button></div>' +
                '</div><div class="drn-tabs" role="tablist">' + tabsHtml + '</div></div>' +
                '<div class="drn-body">' +
                    '<section class="drn-pane" data-pane="pourquoi">' + paneWhy() + '</section>' +
                    '<section class="drn-pane" data-pane="navires">' + paneShips() + '</section>' +
                    '<section class="drn-pane" data-pane="voyages">' + paneVoy() + '</section>' +
                    '<section class="drn-pane" data-pane="monde">' + paneMonde() + '</section>' +
                    '<section class="drn-pane" data-pane="renaissance">' + paneRen() + '</section>' +
                    '<section class="drn-pane" data-pane="frise">' + paneFrise() + '</section>' +
                    '<section class="drn-pane" data-pane="quiz"><div class="drn-quiz"></div></section>' +
                '</div>' +
                '<div class="drn-resize" title="Redimensionner"></div>' +
            '</div>';

        var C = widget.querySelector('.drn-container');
        function q(sel) { return C.querySelector(sel); }
        function qa(sel) { return Array.prototype.slice.call(C.querySelectorAll(sel)); }

        // ── État ───────────────────────────────────────────────────────────
        var st = {
            tab: 'pourquoi', why: 0, part: -1, instr: -1, exp: 2, speed: 'normal',
            exMode: 'voir', ex: { order: null, idx: 0, placed: [], score: 0, tries: 0 }, exSel: -1,
            con: [], ren: -1, frHide: false, fev: 3,
            quiz: null, seenParts: []
        };
        var anim = { d: 0, playing: false, raf: 0, last: 0, pauseUntil: 0, stopIdx: 0 };

        // ── Boutons de la barre d'action (mêmes fonctions que les autres widgets) ──
        widget.querySelector('.widget-menu-handle').addEventListener('click', function () { if (typeof toggleCtxMenu === 'function') toggleCtxMenu(widget); });
        widget.querySelector('.widget-pin-handle').addEventListener('click', function () { if (typeof togglePin === 'function') togglePin(widget); });
        widget.querySelector('.widget-back-handle').addEventListener('click', function () { if (typeof sendToBack === 'function') sendToBack(widget); });
        widget.querySelector('.widget-close-handle').addEventListener('click', closeWidget);

        function save() { if (typeof saveBoard === 'function') { try { saveBoard(); } catch (e) {} } }
        function closeWidget() {
            stopAnim();
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (e) {} }
            if (ro) ro.disconnect();
            widget.remove();
            save();
        }

        // ── Taille / police proportionnelle ────────────────────────────────
        function updateScale() {
            var w = C.clientWidth || DEF_W;
            var fs = Math.max(9, Math.min(26, 16 * w / BASE_W));
            C.style.fontSize = fs.toFixed(2) + 'px';
            C.classList.toggle('drn-narrow', w < 760 || (C.classList.contains('drn-fullboard') && w / fs < 50));
        }
        var ro = null;
        if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(updateScale); ro.observe(C); }

        // ── Isolation des événements : le tableau ne doit pas déplacer le widget
        //    quand on clique à l'intérieur (cartes, boutons, curseurs…) ────────
        ['pointerdown', 'mousedown', 'touchstart'].forEach(function (evt) {
            C.addEventListener(evt, function (e) {
                e.stopPropagation();
                if (evt === 'pointerdown' && typeof bringToFront === 'function') { try { bringToFront(widget); } catch (err) {} }
            }, evt === 'touchstart' ? { passive: true } : false);
        });
        C.addEventListener('keydown', function (e) { if (e.target.tagName === 'INPUT') e.stopPropagation(); });

        // ── Déplacement par la barre de titre ─────────────────────────────
        var headRow = q('.drn-headrow');
        headRow.addEventListener('pointerdown', function (e) {
            if (e.target.closest('.wf-btns, button')) return;
            if (C.classList.contains('drn-fullboard') || widget.dataset.anchored === 'true') return;
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            widget.focus({ preventScroll: true });
            var sx = e.clientX, sy = e.clientY, ox = widget.offsetLeft, oy = widget.offsetTop, moved = false;
            function mv(ev) {
                var dx = ev.clientX - sx, dy = ev.clientY - sy;
                if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
                if (!moved) { moved = true; C.classList.add('drn-grabbing'); if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} } }
                widget.style.left = (ox + dx) + 'px';
                widget.style.top = Math.max(0, oy + dy) + 'px';
                if (typeof positionActionBar === 'function') { try { positionActionBar(widget); } catch (er) {} }
            }
            function up() {
                document.removeEventListener('pointermove', mv);
                document.removeEventListener('pointerup', up);
                document.removeEventListener('pointercancel', up);
                C.classList.remove('drn-grabbing');
                if (moved) { storePercents(); save(); }
            }
            document.addEventListener('pointermove', mv);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', up);
        });
        function storePercents() {
            var curW = window.innerWidth, curVH = (typeof virtualH === 'function') ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent = (widget.offsetTop / curVH) * 100;
        }

        // ── Redimensionnement ──────────────────────────────────────────────
        q('.drn-resize').addEventListener('pointerdown', function (e) {
            e.preventDefault(); e.stopPropagation();
            var sx = e.clientX, sy = e.clientY, sw = C.offsetWidth, sh = C.offsetHeight;
            if (typeof snapshotNow === 'function') { try { snapshotNow(); } catch (er) {} }
            function mv(ev) {
                C.style.width = Math.max(MIN_W, sw + ev.clientX - sx) + 'px';
                C.style.height = Math.max(MIN_H, sh + ev.clientY - sy) + 'px';
            }
            function up() {
                document.removeEventListener('pointermove', mv);
                document.removeEventListener('pointerup', up);
                document.removeEventListener('pointercancel', up);
                save();
            }
            document.addEventListener('pointermove', mv);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', up);
        });

        // ── Boutons fenêtre ────────────────────────────────────────────────
        q('.wf-btn-close').addEventListener('click', closeWidget);
        q('.wf-btn-max').addEventListener('click', function () { setFullboard(!C.classList.contains('drn-fullboard')); save(); });
        q('.wf-btn-min').addEventListener('click', function () {
            if (C.classList.contains('drn-fullboard')) setFullboard(false);
            C.classList.toggle('drn-collapsed');
            if (C.classList.contains('drn-collapsed')) stopAnim();
            save();
        });
        function setFullboard(on) {
            C.classList.toggle('drn-fullboard', on);
            if (on) C.classList.remove('drn-collapsed');
            q('.wf-btn-max').title = on ? 'Quitter le plein écran' : 'Plein écran';
            requestAnimationFrame(updateScale);
        }

        // ── Onglets ────────────────────────────────────────────────────────
        function showTab(k) {
            if (!TABS.some(function (t) { return t.k === k; })) k = 'pourquoi';
            if (st.tab === 'voyages' && k !== 'voyages') stopAnim();
            st.tab = k;
            qa('.drn-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === k); b.setAttribute('aria-selected', b.dataset.tab === k); });
            qa('.drn-pane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === k); });
            if (k === 'quiz') renderQuiz();
        }
        qa('.drn-tab').forEach(function (b) {
            b.addEventListener('click', function () { showTab(b.dataset.tab); save(); });
        });

        // ═════════════ 1. POURQUOI PARTIR ═════════════
        function renderWhy() {
            qa('.drn-why-card').forEach(function (c) { c.classList.toggle('on', +c.dataset.why === st.why); });
            var r = REASONS[st.why];
            q('.drn-why-info').innerHTML = '<b class="drn-it">' + r.ico + ' ' + r.title + '</b>' + r.text;
        }
        qa('.drn-why-card').forEach(function (c) {
            c.addEventListener('click', function () { st.why = +c.dataset.why; renderWhy(); save(); });
        });

        // ═════════════ 2. LES NAVIRES ═════════════
        function renderShip() {
            qa('.drn-hot').forEach(function (h) {
                var i = +h.dataset.part;
                h.classList.toggle('on', i === st.part);
                h.classList.toggle('seen', st.seenParts.indexOf(i) !== -1);
            });
            qa('.drn-chip').forEach(function (h) { h.classList.toggle('on', +h.dataset.part === st.part); });
            qa('.drn-instr-card').forEach(function (h) { h.classList.toggle('on', +h.dataset.instr === st.instr); });
            var box = q('.drn-ship-info');
            if (st.part >= 0) {
                var p = SHIP_PARTS[st.part];
                box.innerHTML = '<b class="drn-it">' + p.n + '. ' + p.title + '</b>' + p.text;
            } else if (st.instr >= 0) {
                var it = INSTRUMENTS[st.instr];
                box.innerHTML = '<b class="drn-it">' + it.title + '</b>' + it.text;
            } else {
                box.innerHTML = '<b class="drn-it">La caravelle</b>Inventée par les Portugais au XV<sup>e</sup> siècle, la caravelle est le navire des Grandes découvertes. Elle mélange des techniques venues de la Méditerranée, de l’Europe du Nord et du monde arabe. Clique sur les numéros pour découvrir ses secrets, puis sur les instruments qui aident les marins à se repérer.';
            }
        }
        function pickPart(i) {
            st.part = i; st.instr = -1;
            if (st.seenParts.indexOf(i) === -1) st.seenParts.push(i);
            renderShip(); save();
        }
        qa('.drn-hot, .drn-chip').forEach(function (h) { h.addEventListener('click', function () { pickPart(+h.dataset.part); }); });
        qa('.drn-instr-card').forEach(function (h) {
            h.addEventListener('click', function () { st.instr = +h.dataset.instr; st.part = -1; renderShip(); save(); });
        });

        // ═════════════ 3. LES VOYAGES ═════════════
        var vmap = q('.drn-voymap');
        var gAll = vmap.querySelector('.drn-routes-all'), gGhost = vmap.querySelector('.drn-route-ghost'),
            gDone = vmap.querySelector('.drn-route-done'), gPlaces = vmap.querySelector('.drn-places'),
            ship = vmap.querySelector('.drn-ship-ic'), shipFlip = vmap.querySelector('.drn-ship-flip');
        var NS = 'http://www.w3.org/2000/svg';

        function svgEl(tag, attrs, parent) {
            var e = document.createElementNS(NS, tag);
            for (var k in attrs) e.setAttribute(k, attrs[k]);
            if (parent) parent.appendChild(e);
            return e;
        }
        function speedVal() {
            for (var i = 0; i < SPEEDS.length; i++) if (SPEEDS[i].k === st.speed) return SPEEDS[i].v;
            return 110;
        }
        function curVoy() { return st.exp === 'all' ? null : VOYAGES[st.exp]; }
        // Index de la dernière étape atteinte pour une distance donnée
        function stopReached(v, d) {
            var k = -1;
            v.stops.forEach(function (s, i) { if (v.cum[s.i] <= d + 0.01) k = i; });
            return k;
        }
        function drawPlaces(v, d) {
            gPlaces.innerHTML = '';
            var boxes = [];   // rectangles des étiquettes déjà posées
            function free(b) {
                return b.x0 > 2 && b.x1 < 998 && boxes.every(function (o) { return b.x1 < o.x0 || b.x0 > o.x1 || b.y1 < o.y0 || b.y0 > o.y1; });
            }
            // la dernière étape atteinte est prioritaire : étiquettes posées de la plus récente à la plus ancienne
            var list = v.stops.map(function (s, i) { return { s: s, i: i }; }).filter(function (o) { return v.cum[o.s.i] <= d + 0.01; }).reverse();
            list.forEach(function (o) {
                var s = o.s, x = wrapX(v.P[s.i][0]), y = v.P[s.i][1];
                var g = svgEl('g', { 'class': 'drn-place' }, gPlaces);
                svgEl('circle', { cx: x, cy: y, r: 3.6, fill: v.color }, g);
                var w = s.place.length * 5.6 + 4, h = 11;
                var tries = [[6, -5, 'start'], [6, 12, 'start'], [-6, -5, 'end'], [-6, 12, 'end'], [6, 3, 'start'], [-6, 3, 'end']];
                for (var k = 0; k < tries.length; k++) {
                    var tx = x + tries[k][0], ty = y + tries[k][1], anc = tries[k][2];
                    var b = { x0: anc === 'end' ? tx - w : tx, x1: anc === 'end' ? tx : tx + w, y0: ty - h + 2, y1: ty + 2 };
                    if (free(b)) {
                        boxes.push(b);
                        var t = svgEl('text', { x: tx, y: ty, 'font-size': 10.5, 'text-anchor': anc }, g);
                        t.textContent = s.place;
                        break;
                    }
                }
            });
        }
        function placeShip(v, d) {
            var line = routeUpTo(v, d), p = line[line.length - 1], prev = line.length > 1 ? line[line.length - 2] : v.P[1];
            var dir = p[0] - prev[0];
            ship.style.display = '';
            ship.setAttribute('transform', 'translate(' + wrapX(p[0]).toFixed(1) + ',' + p[1].toFixed(1) + ') scale(1.15)');
            shipFlip.setAttribute('transform', dir < -0.01 ? 'scale(-1,1)' : '');
            gDone.innerHTML = '';
            svgEl('path', { d: polyD(line), fill: 'none', stroke: v.color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gDone);
        }
        function renderVoyInfo() {
            var box = q('.drn-voy-info'), steps = q('.drn-steps');
            if (st.exp === 'all') {
                steps.innerHTML = '';
                box.innerHTML = '<b class="drn-it">🌍 En moins de 50 ans, le monde s’agrandit</b>' +
                    'Entre 1488 et 1535, les marins portugais, espagnols et français partent sur tous les océans. Pour la première fois, les Européens découvrent l’Amérique, font le tour de l’Afrique et le tour de la Terre. Clique sur un navigateur pour suivre son voyage étape par étape.';
                return;
            }
            var v = curVoy(), k = stopReached(v, anim.d);
            steps.style.setProperty('--c', v.color);
            steps.innerHTML = v.stops.map(function (s, i) {
                return '<button class="drn-step' + (i <= k ? ' done' : '') + (i === k ? ' on' : '') + '" data-stop="' + i + '" style="--c:' + v.color + '">' + (i + 1) + '. ' + s.place + '</button>';
            }).join('');
            qa('.drn-step').forEach(function (b) {
                b.addEventListener('click', function () { stopAnim(); goStop(+b.dataset.stop); });
            });
            if (k < 0 || anim.d < 0.01 && !anim.playing) {
                box.innerHTML = '<b class="drn-it">' + v.flag + ' ' + v.name + '</b><div class="drn-meta">' + v.years + ' · au service : ' + v.country + '</div>' + v.intro;
            } else {
                var s = v.stops[k];
                box.innerHTML = '<b class="drn-it">' + v.flag + ' ' + s.place + '</b><div class="drn-meta">' + s.date + ' · ' + v.name + '</div>' + s.text;
            }
        }
        function goStop(i) {
            var v = curVoy(); if (!v) return;
            anim.d = v.cum[v.stops[i].i];
            anim.stopIdx = i + 1;
            drawVoyage();
        }
        function drawVoyage() {
            gAll.innerHTML = ''; gGhost.innerHTML = ''; gDone.innerHTML = ''; gPlaces.innerHTML = '';
            qa('.drn-exp').forEach(function (e) { e.classList.toggle('on', String(e.dataset.exp) === String(st.exp)); });
            var isAll = st.exp === 'all';
            qa('.drn-play, .drn-restart, .drn-full').forEach(function (b) { b.disabled = isAll; });
            if (isAll) {
                ship.style.display = 'none';
                VOYAGES.forEach(function (v) {
                    svgEl('path', { d: polyD(v.P), fill: 'none', stroke: v.color, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .9 }, gAll);
                    var last = v.P[v.P.length - 1], end = v.stops[v.stops.length - 1];
                    var g = svgEl('g', { 'class': 'drn-place' }, gPlaces);
                    var pt = v.id === 'magellan' ? v.P[v.stops[6].i] : last;
                    svgEl('circle', { cx: wrapX(pt[0]), cy: pt[1], r: 4, fill: v.color }, g);
                    var t = svgEl('text', { x: wrapX(pt[0]) + 6, y: pt[1] + 4, 'font-size': 10.5 }, g);
                    t.textContent = v.id === 'magellan' ? 'Magellan, tué ici en 1521' : v.short + ' · ' + v.years.split(' – ')[0];
                    if (end && v.id === 'magellan') {
                        var g2 = svgEl('g', { 'class': 'drn-place' }, gPlaces);
                        svgEl('circle', { cx: wrapX(last[0]), cy: last[1], r: 4, fill: v.color }, g2);
                    }
                });
                renderVoyInfo();
                updatePlayBtn();
                return;
            }
            var v = curVoy();
            svgEl('path', { d: polyD(v.P), fill: 'none', stroke: v.color, 'stroke-width': 2, 'stroke-dasharray': '5 4', opacity: .45, 'stroke-linecap': 'round' }, gGhost);
            placeShip(v, anim.d);
            drawPlaces(v, anim.d);
            renderVoyInfo();
            updatePlayBtn();
        }
        function updatePlayBtn() {
            var b = q('.drn-play'), v = curVoy();
            qa('.drn-speed').forEach(function (sp) { sp.classList.toggle('on', sp.dataset.speed === st.speed); });
            if (!v) { b.textContent = '▶ Lancer le voyage'; return; }
            if (anim.playing) b.textContent = '⏸ Pause';
            else if (anim.d >= v.len - 0.01) b.textContent = '🔁 Revoir le voyage';
            else if (anim.d > 0.01) b.textContent = '▶ Continuer';
            else b.textContent = '▶ Lancer le voyage';
        }
        function stopAnim() {
            anim.playing = false;
            if (anim.raf) cancelAnimationFrame(anim.raf);
            anim.raf = 0;
            if (st.tab === 'voyages' || q('.drn-play')) updatePlayBtn();
        }
        function startAnim() {
            var v = curVoy(); if (!v) return;
            if (anim.d >= v.len - 0.01) { anim.d = 0; anim.stopIdx = 0; }
            // étape suivante à atteindre
            anim.stopIdx = 0;
            while (anim.stopIdx < v.stops.length && v.cum[v.stops[anim.stopIdx].i] <= anim.d + 0.01) anim.stopIdx++;
            anim.playing = true; anim.last = 0; anim.pauseUntil = 0;
            updatePlayBtn();
            if (anim.d < 0.01) { renderVoyInfo(); anim.pauseUntil = performance.now() + 1600; drawVoyage(); }
            anim.raf = requestAnimationFrame(tick);
        }
        function tick(now) {
            if (!anim.playing) return;
            if (!widget.isConnected) { stopAnim(); return; }
            var v = curVoy(); if (!v) { stopAnim(); return; }
            if (!anim.last) anim.last = now;
            var dt = Math.min(0.1, (now - anim.last) / 1000);
            anim.last = now;
            if (now < anim.pauseUntil) { anim.raf = requestAnimationFrame(tick); return; }
            var target = anim.stopIdx < v.stops.length ? v.cum[v.stops[anim.stopIdx].i] : v.len;
            anim.d = Math.min(target, anim.d + speedVal() * dt);
            placeShip(v, anim.d);
            if (anim.d >= target - 0.001) {
                anim.stopIdx++;
                drawPlaces(v, anim.d);
                renderVoyInfo();
                anim.pauseUntil = now + 2600 * 110 / Math.max(55, speedVal());
                if (anim.d >= v.len - 0.01) { anim.playing = false; updatePlayBtn(); return; }
            }
            anim.raf = requestAnimationFrame(tick);
        }
        qa('.drn-exp').forEach(function (e) {
            e.addEventListener('click', function () {
                stopAnim();
                st.exp = e.dataset.exp === 'all' ? 'all' : +e.dataset.exp;
                anim.d = 0; anim.stopIdx = 0;
                drawVoyage(); save();
            });
        });
        q('.drn-play').addEventListener('click', function () { if (anim.playing) stopAnim(); else startAnim(); });
        q('.drn-restart').addEventListener('click', function () { stopAnim(); anim.d = 0; anim.stopIdx = 0; drawVoyage(); });
        q('.drn-full').addEventListener('click', function () {
            var v = curVoy(); if (!v) return;
            stopAnim(); anim.d = v.len; drawVoyage();
        });
        qa('.drn-speed').forEach(function (b) {
            b.addEventListener('click', function () { st.speed = b.dataset.speed; updatePlayBtn(); save(); });
        });

        // ═════════════ 4. LE MONDE CHANGE ═════════════
        function exItemHtml(i, isNew) {
            var it = EXCHANGES[i];
            return '<span class="drn-item' + (st.exSel === i ? ' on' : '') + (isNew ? ' new' : '') + '" data-ex="' + i + '"><span class="e">' + it.e + '</span>' + it.n + '</span>';
        }
        function newExGame() {
            st.ex = { order: shuffle(range(EXCHANGES.length)), idx: 0, placed: [], score: 0, tries: 0 };
        }
        function renderMonde(lastNew, feedback) {
            qa('.drn-exmode').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === st.exMode); });
            var A = q('.drn-items[data-side="A"]'), M = q('.drn-items[data-side="M"]'), mid = q('.drn-mid');
            var info = q('.drn-ex-info');
            var arrows = '<svg class="drn-arrow" viewBox="0 0 120 34"><path d="M8 11 H104" stroke="#2f7d4f" stroke-width="4"/><path d="M98 3 L112 11 L98 19" fill="none" stroke="#2f7d4f" stroke-width="4" stroke-linejoin="round"/>' +
                '<path d="M112 26 H16" stroke="#2a6fa8" stroke-width="4"/><path d="M22 18 L8 26 L22 34" fill="none" stroke="#2a6fa8" stroke-width="4" stroke-linejoin="round"/></svg>';
            if (st.exMode === 'voir') {
                A.innerHTML = EXCHANGES.map(function (it, i) { return it.s === 'A' ? exItemHtml(i) : ''; }).join('');
                M.innerHTML = EXCHANGES.map(function (it, i) { return it.s === 'M' ? exItemHtml(i) : ''; }).join('');
                mid.innerHTML = arrows + '<small>Océan Atlantique</small>';
                if (st.exSel >= 0) {
                    var it = EXCHANGES[st.exSel];
                    info.innerHTML = '<b class="drn-it">' + it.e + ' ' + it.n + '</b>' + it.t;
                } else {
                    info.innerHTML = '<b class="drn-it">Un échange dans les deux sens</b>Après 1492, plantes, animaux, objets, idées… et maladies traversent l’océan dans les deux sens. Notre alimentation en a été transformée : avant Colomb, pas de frites, de chocolat ni de sauce tomate en Europe ! Clique sur un élément pour en savoir plus.';
                }
            } else {
                if (!st.ex.order) newExGame();
                var g = st.ex;
                A.innerHTML = g.placed.filter(function (i) { return EXCHANGES[i].s === 'A'; }).map(function (i) { return exItemHtml(i, i === lastNew); }).join('');
                M.innerHTML = g.placed.filter(function (i) { return EXCHANGES[i].s === 'M'; }).map(function (i) { return exItemHtml(i, i === lastNew); }).join('');
                if (g.idx < g.order.length) {
                    var cur = EXCHANGES[g.order[g.idx]];
                    mid.innerHTML = '<div class="drn-game"><div class="big">' + cur.e + '</div><div class="nm">' + cur.n + '</div>' +
                        '<div class="btns"><button class="drn-btn drn-ans" data-ans="A">◀ Amérique</button><button class="drn-btn drn-ans" data-ans="M">Ancien Monde ▶</button></div>' +
                        '<div class="drn-fb ' + (feedback ? feedback.cls : '') + '">' + (feedback ? feedback.txt : '') + '</div>' +
                        '<small>' + g.idx + ' / ' + g.order.length + ' · ' + g.score + ' bonne' + (g.score > 1 ? 's' : '') + ' réponse' + (g.score > 1 ? 's' : '') + '</small></div>';
                    qa('.drn-ans').forEach(function (b) { b.addEventListener('click', function () { answerEx(b.dataset.ans); }); });
                } else {
                    mid.innerHTML = '<div class="drn-game"><div class="big">🏆</div><div class="nm">' + g.score + ' / ' + g.order.length + ' du premier coup</div>' +
                        '<button class="drn-btn prim drn-exagain">🔁 Rejouer</button></div>';
                    q('.drn-exagain').addEventListener('click', function () { newExGame(); st.exSel = -1; renderMonde(); save(); });
                }
                if (st.exSel >= 0 && g.placed.indexOf(st.exSel) !== -1) {
                    var it2 = EXCHANGES[st.exSel];
                    info.innerHTML = '<b class="drn-it">' + it2.e + ' ' + it2.n + '</b>' + it2.t;
                } else {
                    info.innerHTML = '<b class="drn-it">🎲 D’où vient-il ?</b>Pour chaque produit, choisis s’il est venu d’Amérique vers l’Europe, ou de l’« Ancien Monde » (Europe, Afrique, Asie) vers l’Amérique.';
                }
            }
            qa('.drn-item').forEach(function (el) {
                el.addEventListener('click', function () { st.exSel = +el.dataset.ex; renderMonde(); });
            });
        }
        function answerEx(side) {
            var g = st.ex, i = g.order[g.idx], it = EXCHANGES[i];
            if (it.s === side) {
                if (g.tries === 0) g.score++;
                g.tries = 0; g.idx++; g.placed.push(i); st.exSel = i;
                renderMonde(i, { cls: 'ok', txt: '✔ Bravo !' });
            } else {
                g.tries++;
                renderMonde(null, { cls: 'ko', txt: '✘ Non… essaie l’autre côté !' });
            }
            save();
        }
        qa('.drn-exmode').forEach(function (b) {
            b.addEventListener('click', function () { st.exMode = b.dataset.mode; st.exSel = -1; if (st.exMode === 'jeu' && !st.ex.order) newExGame(); renderMonde(); save(); });
        });
        function renderCons() {
            qa('.drn-con').forEach(function (c) { c.classList.toggle('open', st.con.indexOf(+c.dataset.con) !== -1); });
        }
        qa('.drn-con').forEach(function (c) {
            c.addEventListener('click', function () {
                var i = +c.dataset.con, k = st.con.indexOf(i);
                if (k === -1) st.con.push(i); else st.con.splice(k, 1);
                renderCons(); save();
            });
        });

        // ═════════════ 5. LA RENAISSANCE ═════════════
        function renderRen() {
            var home = q('.drn-rhome'), det = q('.drn-rdetail');
            if (st.ren < 0) { home.style.display = ''; det.style.display = 'none'; det.innerHTML = ''; return; }
            var r = RENAISSANCE[st.ren];
            home.style.display = 'none'; det.style.display = '';
            var prev = (st.ren + RENAISSANCE.length - 1) % RENAISSANCE.length, next = (st.ren + 1) % RENAISSANCE.length;
            det.innerHTML = '<div class="drn-ctrl" style="margin-top:0"><button class="drn-btn drn-rback">◀ Toutes les cartes</button>' +
                '<span style="flex:1"></span><button class="drn-btn drn-rnav" data-to="' + prev + '">‹ Précédente</button>' +
                '<button class="drn-btn drn-rnav" data-to="' + next + '">Suivante ›</button></div>' +
                '<div class="drn-detail" style="--c:' + r.c + '"><div class="ico"><svg viewBox="0 0 80 80">' + r.ico + '</svg></div>' +
                '<div><h3>' + r.title + '</h3><div class="dt">' + r.date + '</div><div class="tx">' + r.text + '</div>' +
                '<div class="drn-extra"></div></div></div>';
            q('.drn-rback').addEventListener('click', function () { st.ren = -1; renderRen(); save(); });
            qa('.drn-rnav').forEach(function (b) { b.addEventListener('click', function () { st.ren = +b.dataset.to; renderRen(); save(); }); });
            if (r.extra === 'imprimerie') buildPress(q('.drn-extra'));
            if (r.extra === 'perspective') buildPerspective(q('.drn-extra'));
        }
        qa('.drn-rcard').forEach(function (c) { c.addEventListener('click', function () { st.ren = +c.dataset.ren; renderRen(); save(); }); });

        // Atelier de l'imprimeur : les caractères sont gravés à l'envers !
        function buildPress(box) {
            box.innerHTML = '<div class="drn-card"><div class="drn-h" style="font-size:.95em">🖨️ À toi d’imprimer !</div>' +
                '<p class="drn-p">Sur les caractères en métal, les lettres sont gravées <b>à l’envers</b>, comme dans un miroir. Une fois pressées sur le papier, elles apparaissent à l’endroit. Tape un mot :</p>' +
                '<div class="drn-press"><input type="text" maxlength="12" value="RENAISSANCE" aria-label="Mot à imprimer">' +
                '<div><div style="font-size:.7em;font-weight:800;color:#7a6a52;margin-bottom:.2em">Les caractères</div><div class="drn-type"></div></div>' +
                '<button class="drn-btn prim drn-doprint">⬇ Presser</button>' +
                '<div><div style="font-size:.7em;font-weight:800;color:#7a6a52;margin-bottom:.2em">La feuille imprimée</div><div class="drn-paper"></div></div></div></div>';
            var inp = box.querySelector('input'), type = box.querySelector('.drn-type'), paper = box.querySelector('.drn-paper');
            function compose() {
                var w = inp.value.toUpperCase().replace(/[^A-ZÀ-ÖØ-Ý0-9 ]/g, '').slice(0, 12);
                // Dans le composteur, le mot se lit de droite à gauche et chaque lettre est inversée
                type.innerHTML = w.split('').reverse().map(function (ch) { return '<span>' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>'; }).join('');
                paper.classList.remove('printed');
                paper.innerHTML = '';
            }
            inp.addEventListener('input', compose);
            box.querySelector('.drn-doprint').addEventListener('click', function () {
                var w = inp.value.toUpperCase().replace(/[^A-ZÀ-ÖØ-Ý0-9 ]/g, '').slice(0, 12);
                paper.innerHTML = w.split('').map(function (ch, i) { return '<span style="animation-delay:' + (i * 0.05) + 's">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>'; }).join('');
                paper.classList.remove('printed'); void paper.offsetWidth; paper.classList.add('printed');
            });
            compose();
        }

        // Perspective : un carrelage dont on déplace le point de fuite
        function buildPerspective(box) {
            box.innerHTML = '<div class="drn-card"><div class="drn-h" style="font-size:.95em">📐 Le point de fuite <small>Fais glisser le point rouge</small></div>' +
                '<svg class="drn-persp" viewBox="0 0 400 260"></svg></div>';
            var svg = box.querySelector('svg');
            var vp = { x: 200, y: 92 };
            function draw() {
                var s = '<rect x="0" y="0" width="400" height="260" fill="#f4e9cf"/>';
                s += '<rect x="0" y="0" width="400" height="' + vp.y + '" fill="#cfe2e8"/>';
                s += '<line x1="0" y1="' + vp.y + '" x2="400" y2="' + vp.y + '" stroke="#7a6a52" stroke-width="1" stroke-dasharray="4 3"/>';
                // carrelage
                var N = 8, rows = 7, bottom = 260;
                for (var r = 0; r < rows; r++) {
                    for (var c = 0; c < N; c++) {
                        var t0 = Math.pow(r / rows, 1.6), t1 = Math.pow((r + 1) / rows, 1.6);
                        function P(cc, t) {
                            var bx = cc / N * 400;
                            var y = bottom - (bottom - vp.y) * (1 - 1 / (1 + t * 3)) * 1.33;
                            var k = (bottom - y) / (bottom - vp.y);
                            return [bx + (vp.x - bx) * k, y];
                        }
                        var a = P(c, t0), b = P(c + 1, t0), d = P(c + 1, t1), e = P(c, t1);
                        s += '<polygon points="' + [a, b, d, e].map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="' + ((r + c) % 2 ? '#3c4a5c' : '#f8f1e1') + '"/>';
                    }
                }
                // lignes de fuite
                for (var c2 = 0; c2 <= N; c2++) {
                    s += '<line x1="' + (c2 / N * 400) + '" y1="260" x2="' + vp.x + '" y2="' + vp.y + '" stroke="#a63b2a" stroke-width=".8" opacity=".55"/>';
                }
                s += '<g class="drn-vp"><circle cx="' + vp.x + '" cy="' + vp.y + '" r="14" fill="rgba(166,59,42,.18)"/><circle cx="' + vp.x + '" cy="' + vp.y + '" r="7" fill="#a63b2a" stroke="#fff" stroke-width="2"/></g>';
                s += '<text x="8" y="16" font-size="11" font-weight="800" fill="#2b2118">Ligne d’horizon</text>';
                svg.innerHTML = s;
            }
            function toLocal(e) {
                var r = svg.getBoundingClientRect();
                return { x: (e.clientX - r.left) / r.width * 400, y: (e.clientY - r.top) / r.height * 260 };
            }
            var dragging = false;
            svg.addEventListener('pointerdown', function (e) {
                dragging = true; C.classList.add('drn-grabbing'); try { svg.setPointerCapture(e.pointerId); } catch (er) {}
                var p = toLocal(e); vp.x = Math.max(10, Math.min(390, p.x)); vp.y = Math.max(30, Math.min(180, p.y)); draw();
            });
            svg.addEventListener('pointermove', function (e) {
                if (!dragging) return;
                var p = toLocal(e); vp.x = Math.max(10, Math.min(390, p.x)); vp.y = Math.max(30, Math.min(180, p.y)); draw();
            });
            svg.addEventListener('pointerup', function () { dragging = false; C.classList.remove('drn-grabbing'); });
            svg.addEventListener('pointercancel', function () { dragging = false; C.classList.remove('drn-grabbing'); });
            draw();
        }

        // ═════════════ 6. FRISE ═════════════
        function renderFrise() {
            q('.drn-frise').classList.toggle('drn-hide-dates', st.frHide);
            q('.drn-hidedates').textContent = st.frHide ? '👁 Afficher les dates' : '🙈 Masquer les dates';
            q('.drn-hidedates').classList.toggle('on', st.frHide);
            qa('.drn-fev').forEach(function (g) { g.classList.toggle('on', +g.dataset.fev === st.fev); });
            var e = FRISE[st.fev], box = q('.drn-fr-info');
            if (!e) { box.innerHTML = ''; return; }
            box.style.borderLeftColor = CAT[e.cat].c;
            box.innerHTML = '<b class="drn-it">' + (st.frHide ? '???' : e.y) + ' — ' + esc(e.t) + '</b><div class="drn-meta">' + CAT[e.cat].label + '</div>' + e.d;
        }
        qa('.drn-fev').forEach(function (g) { g.addEventListener('click', function () { st.fev = +g.dataset.fev; renderFrise(); save(); }); });
        q('.drn-hidedates').addEventListener('click', function () { st.frHide = !st.frHide; renderFrise(); save(); });

        // ═════════════ 7. QUIZ ═════════════
        function newQuiz() {
            st.quiz = {
                order: shuffle(range(QUIZ.length)),
                perm: QUIZ.map(function (qq) { return shuffle(range(qq.o.length)); }),
                idx: 0, score: 0, choice: -1
            };
        }
        function renderQuiz() {
            if (!st.quiz) newQuiz();
            var z = st.quiz, box = q('.drn-quiz');
            var n = z.order.length;
            if (z.idx >= n) {
                var pct = z.score / n, msg = pct === 1 ? 'Parfait ! Tu es un véritable explorateur ! 🧭' : pct >= 0.7 ? 'Très bien ! Tu as bien retenu la leçon. ⛵' : pct >= 0.4 ? 'Pas mal ! Relis les onglets et retente ta chance. 📜' : 'Courage ! Explore les onglets puis recommence. ⚓';
                box.innerHTML = '<div class="drn-score"><div class="big">' + z.score + ' / ' + n + '</div><p class="drn-p" style="font-size:1.05em;font-weight:700">' + msg + '</p>' +
                    '<button class="drn-btn prim drn-qagain">🔁 Recommencer le quiz</button></div>';
                box.querySelector('.drn-qagain').addEventListener('click', function () { newQuiz(); renderQuiz(); save(); });
                return;
            }
            var qi = z.order[z.idx], Q = QUIZ[qi], perm = z.perm[qi], answered = z.choice >= 0;
            var s = '<div class="drn-qhead"><span>Question ' + (z.idx + 1) + ' / ' + n + '</span><span>Score : ' + z.score + '</span></div>' +
                '<div class="drn-qbar"><i style="width:' + (z.idx / n * 100) + '%"></i></div>' +
                '<div class="drn-q">' + Q.q + '</div><div class="drn-opts">';
            perm.forEach(function (oi) {
                var cls = '';
                if (answered) {
                    if (oi === Q.a) cls = ' ok';
                    else if (oi === z.choice) cls = ' ko';
                    else cls = ' dim';
                }
                s += '<button class="drn-opt' + cls + '" data-opt="' + oi + '"' + (answered ? ' disabled' : '') + '>' + Q.o[oi] + '</button>';
            });
            s += '</div>';
            if (answered) {
                s += '<div class="drn-info drn-qx" style="border-left-color:' + (z.choice === Q.a ? '#2f7d4f' : '#a63b2a') + '"><b class="drn-it">' + (z.choice === Q.a ? '✔ Bonne réponse !' : '✘ Ce n’est pas ça.') + '</b>' + Q.x + '</div>' +
                    '<div class="drn-qnav"><button class="drn-btn prim drn-qnext">' + (z.idx + 1 < n ? 'Question suivante ▶' : 'Voir mon score 🏆') + '</button></div>';
            }
            box.innerHTML = s;
            qa('.drn-opt').forEach(function (b) {
                b.addEventListener('click', function () {
                    if (z.choice >= 0) return;
                    z.choice = +b.dataset.opt;
                    if (z.choice === Q.a) z.score++;
                    renderQuiz(); save();
                });
            });
            var nx = box.querySelector('.drn-qnext');
            if (nx) nx.addEventListener('click', function () { z.idx++; z.choice = -1; renderQuiz(); save(); });
        }

        // ── Sauvegarde / restauration ──────────────────────────────────────
        widget._drnGetData = function () {
            var full = C.classList.contains('drn-fullboard');
            return {
                tab: st.tab, why: st.why, part: st.part, instr: st.instr, seenParts: st.seenParts.slice(),
                exp: st.exp, speed: st.speed,
                exMode: st.exMode, ex: st.ex, con: st.con.slice(),
                ren: st.ren, frHide: st.frHide, fev: st.fev, quiz: st.quiz,
                w: full ? (C.dataset.prevW ? +C.dataset.prevW : DEF_W) : C.offsetWidth,
                h: C.classList.contains('drn-collapsed') ? (+C.dataset.prevH || DEF_H) : (full ? (C.dataset.prevH ? +C.dataset.prevH : DEF_H) : C.offsetHeight),
                refW: window.innerWidth,
                fullboard: full,
                collapsed: C.classList.contains('drn-collapsed')
            };
        };
        widget._drnSetData = function (d) {
            if (!d || typeof d !== 'object') return;
            if (typeof d.why === 'number' && REASONS[d.why]) st.why = d.why;
            if (typeof d.part === 'number' && d.part < SHIP_PARTS.length) st.part = d.part;
            if (typeof d.instr === 'number' && d.instr < INSTRUMENTS.length) st.instr = d.instr;
            if (Array.isArray(d.seenParts)) st.seenParts = d.seenParts.filter(function (i) { return SHIP_PARTS[i]; });
            if (d.exp === 'all' || (typeof d.exp === 'number' && VOYAGES[d.exp])) st.exp = d.exp;
            if (d.speed && SPEEDS.some(function (s) { return s.k === d.speed; })) st.speed = d.speed;
            if (d.exMode === 'voir' || d.exMode === 'jeu') st.exMode = d.exMode;
            if (d.ex && Array.isArray(d.ex.order) && d.ex.order.length === EXCHANGES.length) st.ex = d.ex;
            if (Array.isArray(d.con)) st.con = d.con.filter(function (i) { return CONSEQUENCES[i]; });
            if (typeof d.ren === 'number' && d.ren < RENAISSANCE.length) st.ren = d.ren;
            st.frHide = !!d.frHide;
            if (typeof d.fev === 'number' && FRISE[d.fev]) st.fev = d.fev;
            if (d.quiz && Array.isArray(d.quiz.order) && d.quiz.order.length === QUIZ.length && Array.isArray(d.quiz.perm)) st.quiz = d.quiz;
            if (d.w && d.h) {
                var k = d.refW ? window.innerWidth / d.refW : 1;
                var w = Math.max(MIN_W, Math.round(d.w * k)), h = Math.max(MIN_H, Math.round(d.h * k));
                C.style.width = w + 'px'; C.style.height = h + 'px';
                C.dataset.prevW = w; C.dataset.prevH = h;
            }
            renderAll();
            showTab(d.tab || 'pourquoi');
            if (d.collapsed) C.classList.add('drn-collapsed');
            if (d.fullboard) setFullboard(true);
        };
        // Garder en mémoire la taille « normale » (pour le plein écran / la réduction)
        function rememberSize() {
            if (!C.classList.contains('drn-fullboard') && !C.classList.contains('drn-collapsed')) {
                C.dataset.prevW = C.offsetWidth; C.dataset.prevH = C.offsetHeight;
            }
        }
        q('.wf-btn-max').addEventListener('pointerdown', rememberSize, true);
        q('.wf-btn-min').addEventListener('pointerdown', rememberSize, true);

        function renderAll() {
            renderWhy(); renderShip(); drawVoyage(); renderMonde(); renderCons(); renderRen(); renderFrise();
        }

        // ── Mise en place ──────────────────────────────────────────────────
        board.appendChild(widget);
        if (typeof makeDraggable === 'function') { try { makeDraggable(widget); } catch (e) {} }
        if (typeof makeDraggableRotate === 'function') { try { makeDraggableRotate(widget); } catch (e) {} }

        if (!restoring) {
            // Taille adaptée à l'écran, position centrée dans la partie visible
            var vw = window.innerWidth, vh = window.innerHeight;
            var w0 = Math.min(DEF_W, vw - 120), h0 = Math.min(DEF_H, Math.round(w0 * DEF_H / DEF_W), vh - 80);
            w0 = Math.max(Math.min(MIN_W, vw - 20), w0); h0 = Math.max(Math.min(MIN_H, vh - 20), h0);
            C.style.width = w0 + 'px'; C.style.height = h0 + 'px';
            var scrollTop = (document.scrollingElement && document.scrollingElement.scrollTop) || window.scrollY || 0;
            widget.style.left = Math.max(66, Math.round((vw - w0) / 2)) + 'px';
            widget.style.top = Math.max(10, Math.round(scrollTop + (vh - h0) / 2)) + 'px';
            renderAll();
            showTab('pourquoi');
        } else {
            C.style.width = DEF_W + 'px'; C.style.height = DEF_H + 'px';
            if (saved && !saved._restored) widget._drnSetData(saved);
            else { renderAll(); showTab('pourquoi'); }
        }
        updateScale();
        if (typeof bringToFront === 'function') { try { bringToFront(widget); } catch (e) {} }
        storePercents();

        if (!restoring) {
            // Sur téléphone, ouverture directe en plein écran
            var phone = typeof window.isPhoneScreen === 'function' && window.isPhoneScreen();
            if (phone && Date.now() - (window._wfLastLaunch || 0) < 2500) setFullboard(true);
            try { widget.focus({ preventScroll: true }); } catch (e) {}
            save();
        }
        return widget;
    }

    window.createDecouvertesRenaissanceWidget = createDecouvertesRenaissanceWidget;
})();
