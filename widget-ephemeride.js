/* ═══════════════════════════════════════════════════════════════════
   widget-ephemeride.js — Widget « Éphéméride »
   Le Bureau du Prof

   Affiche, façon bloc éphéméride à feuilles détachables :
   - la date du jour (chiffre rouge le dimanche et les jours fériés)
   - la fête du jour (calendrier des saints français)
   - les jours fériés / événements du jour + le prochain jour férié
   - le lever et le coucher du soleil, la durée du jour et sa variation
   - la phase de la lune
   - la saison en cours et le compte à rebours vers la suivante
   - un dicton
   - le numéro de semaine et le jour de l'année

   Barre du haut :
   - boutons fenêtre jaune (réduire), vert (plein écran), rouge (fermer),
     identiques à ceux du widget Défi calme
   - champ « date » pour afficher n'importe quel jour (‹ › pour passer au
     jour précédent / suivant, ⟲ pour revenir à aujourd'hui)

   Utilisation : createWidget('ephemeride')
   Le template #template-ephemeride est injecté dans le DOM par ce fichier.
   Les réglages sont stockés dans l'attribut data-cfg de .ephem-root,
   donc ils sont conservés avec le board. Le contenu se recalcule tout
   seul (au chargement du board et au changement de jour).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── Villes proposées ─────────────────────────────────────────── */
    const CITIES = {
        chambery:   { name: 'Chambéry',   lat: 45.566, lon: 5.921 },
        annecy:     { name: 'Annecy',     lat: 45.899, lon: 6.129 },
        grenoble:   { name: 'Grenoble',   lat: 45.188, lon: 5.724 },
        lyon:       { name: 'Lyon',       lat: 45.764, lon: 4.836 },
        paris:      { name: 'Paris',      lat: 48.857, lon: 2.352 },
        lille:      { name: 'Lille',      lat: 50.629, lon: 3.057 },
        strasbourg: { name: 'Strasbourg', lat: 48.573, lon: 7.752 },
        rennes:     { name: 'Rennes',     lat: 48.117, lon: -1.678 },
        nantes:     { name: 'Nantes',     lat: 47.218, lon: -1.554 },
        bordeaux:   { name: 'Bordeaux',   lat: 44.838, lon: -0.579 },
        toulouse:   { name: 'Toulouse',   lat: 43.605, lon: 1.444 },
        marseille:  { name: 'Marseille',  lat: 43.297, lon: 5.370 },
        nice:       { name: 'Nice',       lat: 43.710, lon: 7.262 }
    };

    const SECTIONS = [
        ['fete',    'Fête du jour'],
        ['events',  'Jours fériés et événements'],
        ['soleil',  'Lever et coucher du soleil'],
        ['lune',    'Phase de la lune'],
        ['saison',  'Saison'],
        ['dicton',  'Dicton'],
        ['numeros', 'Semaine et jour de l\'année']
    ];

    const DEFAULT_CFG = {
        city: 'chambery',
        show: { fete: true, events: true, soleil: true, lune: true, saison: true, dicton: true, numeros: true }
    };

    /* ── Calendrier des fêtes (saints) — index [mois][jour-1] ─────── */
    const FETES = [
        ['Marie, Mère de Dieu','Basile','Geneviève','Odilon','Édouard','Mélaine','Raymond','Lucien','Alix','Guillaume','Pauline','Tatiana','Yvette','Nina','Rémi','Marcel','Roseline','Prisca','Marius','Sébastien','Agnès','Vincent','Barnard','François de Sales','Conversion de Paul','Paule','Angèle','Thomas d\'Aquin','Gildas','Martine','Marcelle'],
        ['Ella','Présentation du Seigneur','Blaise','Véronique','Agathe','Gaston','Eugénie','Jacqueline','Apolline','Arnaud','Notre-Dame de Lourdes','Félix','Béatrice','Valentin','Claude','Julienne','Alexis','Bernadette','Gabin','Aimée','Pierre Damien','Isabelle','Lazare','Modeste','Roméo','Nestor','Honorine','Romain','Auguste'],
        ['Aubin','Charles le Bon','Guénolé','Casimir','Olive','Colette','Félicité','Jean de Dieu','Françoise','Vivien','Rosine','Justine','Rodrigue','Mathilde','Louise','Bénédicte','Patrice','Cyrille','Joseph','Herbert','Clémence','Léa','Victorien','Catherine de Suède','Annonciation','Larissa','Habib','Gontran','Gwladys','Amédée','Benjamin'],
        ['Hugues','Sandrine','Richard','Isidore','Irène','Marcellin','Jean-Baptiste de la Salle','Julie','Gautier','Fulbert','Stanislas','Jules','Ida','Maxime','Paterne','Benoît-Joseph','Anicet','Parfait','Emma','Odette','Anselme','Alexandre','Georges','Fidèle','Marc','Alida','Zita','Valérie','Catherine de Sienne','Robert'],
        ['Joseph, artisan','Boris','Philippe et Jacques','Sylvain','Judith','Prudence','Gisèle','Désiré','Pacôme','Solange','Estelle','Achille','Rolande','Matthias','Denise','Honoré','Pascal','Éric','Yves','Bernardin','Constantin','Émile','Didier','Donatien','Sophie','Bérenger','Augustin de Cantorbéry','Germain','Aymar','Ferdinand','Visitation de Marie'],
        ['Justin','Blandine','Kévin','Clotilde','Igor','Norbert','Gilbert','Médard','Diane','Landry','Barnabé','Guy','Antoine de Padoue','Élisée','Germaine','Jean-François Régis','Hervé','Léonce','Romuald','Silvère','Rodolphe','Alban','Audrey','Jean-Baptiste','Prosper','Anthelme','Fernand','Irénée','Pierre et Paul','Martial'],
        ['Thierry','Martinien','Thomas','Florent','Antoine-Marie','Mariette','Raoul','Thibaut','Amandine','Ulrich','Benoît','Olivier','Henri et Joël','Camille','Donald','Notre-Dame du Mont-Carmel','Charlotte','Frédéric','Arsène','Marina','Victor','Marie-Madeleine','Brigitte','Christine','Jacques','Anne et Joachim','Nathalie','Samson','Marthe','Juliette','Ignace de Loyola'],
        ['Alphonse','Julien Eymard','Lydie','Jean-Marie Vianney','Abel','Transfiguration','Gaétan','Dominique','Amour','Laurent','Claire','Clarisse','Hippolyte','Évrard','Marie','Armel','Hyacinthe','Hélène','Jean Eudes','Bernard','Christophe','Fabrice','Rose de Lima','Barthélemy','Louis','Natacha','Monique','Augustin','Sabine','Fiacre','Aristide'],
        ['Gilles','Ingrid','Grégoire','Rosalie','Raïssa','Bertrand','Reine','Adrien','Alain','Inès','Adelphe','Apollinaire','Aimé','Croix glorieuse','Roland','Édith','Renaud','Nadège','Émilie','Davy','Matthieu','Maurice','Constant','Thècle','Hermann','Côme et Damien','Vincent de Paul','Venceslas','Michel, Gabriel et Raphaël','Jérôme'],
        ['Thérèse de l\'Enfant-Jésus','Léger','Gérard','François d\'Assise','Fleur','Bruno','Serge','Pélagie','Denis','Ghislain','Firmin','Wilfried','Géraud','Juste','Thérèse d\'Avila','Edwige','Baudouin','Luc','René','Adeline','Céline','Élodie','Jean de Capistran','Florentin','Crépin','Dimitri','Émeline','Simon et Jude','Narcisse','Bienvenue','Quentin'],
        ['Tous les saints','Commémoration des défunts','Hubert','Charles','Sylvie','Bertille','Carine','Geoffroy','Théodore','Léon','Martin','Christian','Brice','Sidoine','Albert','Marguerite','Élisabeth','Aude','Tanguy','Edmond','Présentation de Marie','Cécile','Clément','Flora','Catherine','Delphine','Séverin','Jacques de la Marche','Saturnin','André'],
        ['Florence','Viviane','François-Xavier','Barbara','Gérald','Nicolas','Ambroise','Immaculée Conception','Pierre Fourier','Romaric','Daniel','Jeanne-Françoise de Chantal','Lucie','Odile','Ninon','Alice','Gaël','Gatien','Urbain','Théophile','Pierre Canisius','Françoise-Xavière','Armand','Adèle','Noël','Étienne','Jean','Saints Innocents','David','Roger','Sylvestre']
    ];

    /* ── Dictons ──────────────────────────────────────────────────── */
    const DICTONS_JOUR = {
        '1-22':  'À la Saint-Vincent, l\'hiver s\'en va ou se reprend.',
        '2-2':   'À la Chandeleur, l\'hiver se meurt ou prend vigueur.',
        '4-23':  'À la Saint-Georges, sème ton orge.',
        '4-25':  'À la Saint-Marc, s\'il tombe de l\'eau, il n\'y aura pas de fruits à couteau.',
        '6-8':   'Quand il pleut à la Saint-Médard, il pleut quarante jours plus tard.',
        '9-29':  'À la Saint-Michel, la chaleur remonte au ciel.',
        '11-11': 'À la Saint-Martin, bois le vin et laisse l\'eau au moulin.',
        '11-25': 'À la Sainte-Catherine, tout bois prend racine.',
        '12-13': 'À la Sainte-Luce, les jours croissent du saut d\'une puce.'
    };
    const DICTONS_MOIS = [
        ['Janvier d\'eau chiche fait le paysan riche.', 'En janvier, la gelée fait de l\'eau le lendemain.'],
        ['Février, entre tous les mois, le plus court et le moins courtois.', 'Neige de février, de l\'eau pour le blé.'],
        ['Quand mars se déguise en été, avril prend ses habits fourrés.', 'Mars venteux, avril pluvieux, font le mai gai et gracieux.'],
        ['En avril, ne te découvre pas d\'un fil ; en mai, fais ce qu\'il te plaît.', 'Avril a trente jours ; s\'il pleuvait trente et un, ça ne ferait de mal à aucun.'],
        ['Petite pluie de mai rend tout le monde gai.', 'Mai frileux, an langoureux.'],
        ['Juin bien fleuri, vrai paradis.', 'En juin, trop de pluie, le jardinier s\'ennuie.'],
        ['Juillet sans orage, famine au village.', 'En juillet, la chaleur fait mûrir les blés.'],
        ['Quand il pleut en août, il pleut miel et bon moût.', 'Août mûrit, septembre vendange.'],
        ['Septembre se nomme le mai de l\'automne.', 'En septembre, si tu es prudent, achète grains et vêtements.'],
        ['En octobre, qui ne fume rien ne récolte rien.', 'Octobre en bruine, hiver en ruine.'],
        ['Brouillard de novembre, l\'hiver sera tendre.', 'En novembre, s\'il tonne, l\'année sera bonne.'],
        ['Décembre de froid trop chiche ne fait pas le paysan riche.', 'Neige de décembre, bonne pour la terre.']
    ];

    const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const MOIS_COURT = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
    const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

    /* ── Outils de dates ─────────────────────────────────────────── */
    const DAY = 86400000;
    const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const daysBetween = (a, b) => Math.round((midnight(b) - midnight(a)) / DAY);
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const dayOfYear = d => daysBetween(new Date(d.getFullYear(), 0, 1), d) + 1;
    const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const pad = n => String(n).padStart(2, '0');
    const hhmm = d => pad(d.getHours()) + ' h ' + pad(d.getMinutes());
    const toInputDate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

    // Lit une valeur « AAAA-MM-JJ » (champ date) ; null si invalide ou hors limites
    function parseInputDate(v) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
        if (!m) return null;
        const y = +m[1], mo = +m[2] - 1, d = +m[3];
        if (y < 1900 || y > 2200) return null;
        const date = new Date(y, mo, d);
        if (date.getMonth() !== mo || date.getDate() !== d) return null;
        return date;
    }

    function isoWeek(d) {
        const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dn = t.getUTCDay() || 7;
        t.setUTCDate(t.getUTCDate() + 4 - dn);
        const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
        return Math.ceil(((t - y0) / DAY + 1) / 7);
    }

    // Dimanche de Pâques (algorithme de Meeus / Butcher)
    function easter(y) {
        const a = y % 19, b = Math.floor(y / 100), c = y % 100;
        const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4), k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(y, month - 1, day);
    }

    function lastSunday(y, m) { // m : 0-11
        const d = new Date(y, m + 1, 0);
        return addDays(d, -d.getDay());
    }
    function nthSunday(y, m, n) {
        const d = new Date(y, m, 1);
        return addDays(d, ((7 - d.getDay()) % 7) + 7 * (n - 1));
    }

    // Liste des jours fériés et événements d'une année
    function yearEvents(y) {
        const p = easter(y);
        const pentecote = addDays(p, 49);
        let fmeres = lastSunday(y, 4);
        if (sameDay(fmeres, pentecote)) fmeres = addDays(fmeres, 7);
        return [
            { d: new Date(y, 0, 1),   t: 'Jour de l\'An',         ferie: true,  ico: '🎆' },
            { d: new Date(y, 0, 6),   t: 'Épiphanie, place à la galette !', ico: '👑' },
            { d: new Date(y, 1, 2),   t: 'Chandeleur, jour des crêpes', ico: '🥞' },
            { d: addDays(p, -47),     t: 'Mardi gras',             ico: '🎭' },
            { d: lastSunday(y, 2),    t: 'Passage à l\'heure d\'été (+1 h)', ico: '⏰' },
            { d: new Date(y, 3, 1),   t: 'Poisson d\'avril',       ico: '🐟' },
            { d: p,                   t: 'Pâques',                 ico: '🥚' },
            { d: addDays(p, 1),       t: 'Lundi de Pâques',        ferie: true,  ico: '🐣' },
            { d: new Date(y, 4, 1),   t: 'Fête du Travail',        ferie: true,  ico: '🌿' },
            { d: new Date(y, 4, 8),   t: 'Victoire de 1945',       ferie: true,  ico: '🇫🇷' },
            { d: addDays(p, 39),      t: 'Ascension',              ferie: true,  ico: '⛪' },
            { d: pentecote,           t: 'Pentecôte',              ico: '🕊️' },
            { d: addDays(p, 50),      t: 'Lundi de Pentecôte',     ferie: true,  ico: '🕊️' },
            { d: fmeres,              t: 'Fête des mères',         ico: '💐' },
            { d: nthSunday(y, 5, 3),  t: 'Fête des pères',         ico: '👔' },
            { d: new Date(y, 5, 21),  t: 'Fête de la musique',     ico: '🎵' },
            { d: new Date(y, 6, 14),  t: 'Fête nationale',         ferie: true,  ico: '🎇' },
            { d: new Date(y, 7, 15),  t: 'Assomption',             ferie: true,  ico: '⛪' },
            { d: lastSunday(y, 9),    t: 'Passage à l\'heure d\'hiver (−1 h)', ico: '⏰' },
            { d: new Date(y, 10, 1),  t: 'Toussaint',              ferie: true,  ico: '🕯️' },
            { d: new Date(y, 10, 11), t: 'Armistice de 1918',      ferie: true,  ico: '🎖️' },
            { d: new Date(y, 11, 25), t: 'Noël',                   ferie: true,  ico: '🎄' }
        ];
    }

    /* ── Soleil (algorithme de l'Almanac for Computers, ±2 min) ─── */
    const rad = Math.PI / 180;
    function sunEvent(date, lat, lon, rising) {
        const N = dayOfYear(date);
        const lngHour = lon / 15;
        const t = N + ((rising ? 6 : 18) - lngHour) / 24;
        const M = 0.9856 * t - 3.289;
        let L = M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634;
        L = ((L % 360) + 360) % 360;
        let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad;
        RA = ((RA % 360) + 360) % 360;
        RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
        RA /= 15;
        const sinDec = 0.39782 * Math.sin(L * rad);
        const cosDec = Math.cos(Math.asin(sinDec));
        const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
        if (cosH > 1 || cosH < -1) return null;
        let H = rising ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad;
        H /= 15;
        const T = H + RA - 0.06571 * t - 6.622;
        const UT = ((T - lngHour) % 24 + 24) % 24;
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + UT * 3600000);
    }
    function sunInfo(date, lat, lon) {
        const lever = sunEvent(date, lat, lon, true);
        const coucher = sunEvent(date, lat, lon, false);
        if (!lever || !coucher) return null;
        return { lever, coucher, duree: Math.round((coucher - lever) / 60000) };
    }

    /* ── Lune ─────────────────────────────────────────────────────── */
    const SYNODIC = 29.530588853;
    const PHASES = [
        ['🌑', 'Nouvelle lune'], ['🌒', 'Premier croissant'], ['🌓', 'Premier quartier'], ['🌔', 'Lune gibbeuse croissante'],
        ['🌕', 'Pleine lune'], ['🌖', 'Lune gibbeuse décroissante'], ['🌗', 'Dernier quartier'], ['🌘', 'Dernier croissant']
    ];
    function moonInfo(date) {
        const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
        const jd = noon.getTime() / DAY + 2440587.5;
        let age = (jd - 2451550.1) % SYNODIC;
        if (age < 0) age += SYNODIC;
        const idx = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
        const illum = Math.round((1 - Math.cos(2 * Math.PI * age / SYNODIC)) / 2 * 100);
        let toFull = (SYNODIC / 2 - age + SYNODIC) % SYNODIC;
        let toNew = SYNODIC - age;
        return { ico: PHASES[idx][0], nom: PHASES[idx][1], illum, idx, toFull: Math.round(toFull), toNew: Math.round(toNew) };
    }

    /* ── Saisons (équinoxes et solstices, formules de Meeus) ────── */
    function jdeToDate(jde) { return new Date((jde - 2440587.5) * DAY); }
    function seasonDates(y) {
        const Y = (y - 2000) / 1000;
        return [
            { key: 'printemps', nom: 'Printemps', ico: '🌸', evt: 'équinoxe de printemps',
              d: jdeToDate(2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y ** 3 - 0.00057 * Y ** 4) },
            { key: 'ete', nom: 'Été', ico: '☀️', evt: 'solstice d\'été',
              d: jdeToDate(2451716.56767 + 365241.62603 * Y + 0.00325 * Y * Y + 0.00888 * Y ** 3 - 0.00030 * Y ** 4) },
            { key: 'automne', nom: 'Automne', ico: '🍂', evt: 'équinoxe d\'automne',
              d: jdeToDate(2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y ** 3 + 0.00078 * Y ** 4) },
            { key: 'hiver', nom: 'Hiver', ico: '❄️', evt: 'solstice d\'hiver',
              d: jdeToDate(2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y ** 3 + 0.00032 * Y ** 4) }
        ];
    }
    function seasonInfo(date) {
        const y = date.getFullYear();
        const all = [...seasonDates(y - 1), ...seasonDates(y), ...seasonDates(y + 1)];
        const today = midnight(date);
        let cur = null, next = null;
        for (const s of all) {
            if (midnight(s.d) <= today) cur = s;
            else if (!next) next = s;
        }
        return { cur, next, joursRestants: daysBetween(today, next.d), aujourdhui: sameDay(cur.d, date) };
    }

    /* ── Config ───────────────────────────────────────────────────── */
    function getCfg(root) {
        let cfg;
        try { cfg = JSON.parse(root.getAttribute('data-cfg') || '{}'); } catch (e) { cfg = {}; }
        cfg = Object.assign({}, DEFAULT_CFG, cfg);
        cfg.show = Object.assign({}, DEFAULT_CFG.show, cfg.show || {});
        return cfg;
    }
    function setCfg(root, cfg) {
        root.setAttribute('data-cfg', JSON.stringify(cfg));
        render(root);
        if (typeof saveBoard === 'function') saveBoard();
    }
    function getPlace(cfg) {
        if (cfg.city === 'perso' && isFinite(cfg.lat) && isFinite(cfg.lon)) {
            return { name: cfg.persoName || 'Ma ville', lat: +cfg.lat, lon: +cfg.lon };
        }
        return CITIES[cfg.city] || CITIES.chambery;
    }

    /* ── Date affichée (aujourd'hui par défaut) ────────────────────── */
    // La date choisie est gardée dans l'attribut data-sel-date de .ephem-root.
    // Sans cet attribut, le widget suit le jour courant.
    function getSelDate(root) {
        return parseInputDate(root.getAttribute('data-sel-date')) || midnight(new Date());
    }
    function setSelDate(root, d) {
        if (!d || sameDay(d, new Date())) root.removeAttribute('data-sel-date');
        else root.setAttribute('data-sel-date', toInputDate(d));
        renderSheet(root);
    }

    /* ── Rendu ────────────────────────────────────────────────────── */
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function fmtDuree(min) {
        return Math.floor(min / 60) + ' h ' + pad(min % 60);
    }

    function row(ico, main, sub) {
        return '<div class="ephem-row"><span class="ephem-ico" aria-hidden="true">' + ico + '</span>' +
               '<div class="ephem-txt"><div class="ephem-main">' + main + '</div>' +
               (sub ? '<div class="ephem-sub">' + sub + '</div>' : '') + '</div></div>';
    }

    function buildSheet(cfg, now) {
        const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
        const events = yearEvents(y).concat(yearEvents(y + 1));
        const todays = events.filter(e => sameDay(e.d, now));
        const ferie = todays.some(e => e.ferie);
        const rouge = now.getDay() === 0 || ferie;
        const place = getPlace(cfg);
        let html = '';

        /* En-tête : le chiffre du jour */
        html += '<div class="ephem-head">' +
                  '<div class="ephem-month">' + MOIS[m] + ' ' + y + '</div>' +
                  '<div class="ephem-num' + (rouge ? ' is-red' : '') + '">' + d + '</div>' +
                  '<div class="ephem-wday' + (rouge ? ' is-red' : '') + '">' + JOURS[now.getDay()] + '</div>' +
                '</div>';

        html += '<div class="ephem-perf" aria-hidden="true"></div><div class="ephem-body">';

        if (cfg.show.fete) {
            html += row('🎉', 'Bonne fête ' + esc(FETES[m][d - 1]) + '&nbsp;!');
        }

        if (cfg.show.events) {
            todays.forEach(e => {
                html += row(e.ico, esc(e.t), e.ferie ? 'Jour férié' : '');
            });
            const nextF = events.find(e => e.ferie && midnight(e.d) > midnight(now));
            if (nextF) {
                const n = daysBetween(now, nextF.d);
                html += row('📅', 'Prochain jour férié&nbsp;: ' + esc(nextF.t),
                    (n === 1 ? 'demain' : 'dans ' + n + ' jours') + ', le ' + JOURS[nextF.d.getDay()] + ' ' + nextF.d.getDate() + ' ' + MOIS[nextF.d.getMonth()]);
            }
        }

        if (cfg.show.soleil) {
            const s = sunInfo(now, place.lat, place.lon);
            const hier = sunInfo(addDays(now, -1), place.lat, place.lon);
            if (s) {
                let varTxt = '';
                if (hier) {
                    const dv = s.duree - hier.duree;
                    if (dv > 0) varTxt = ', ' + dv + ' min de plus qu\'hier';
                    else if (dv < 0) varTxt = ', ' + (-dv) + ' min de moins qu\'hier';
                    else varTxt = ', comme hier';
                }
                html += row('🌅', 'Lever ' + hhmm(s.lever) + ' &nbsp;·&nbsp; coucher ' + hhmm(s.coucher),
                    'Jour de ' + fmtDuree(s.duree) + varTxt + ' (' + esc(place.name) + ')');
            }
        }

        if (cfg.show.lune) {
            const l = moonInfo(now);
            let sub = 'Éclairée à ' + l.illum + '&nbsp;%';
            if (l.idx !== 4) sub += ', pleine lune ' + (l.toFull <= 1 ? 'demain' : 'dans ' + l.toFull + ' jours');
            else sub += ', nouvelle lune dans ' + l.toNew + ' jours';
            html += row(l.ico, l.nom, sub);
        }

        if (cfg.show.saison) {
            const s = seasonInfo(now);
            const main = s.aujourdhui ? 'C\'est le jour de l\'' + s.cur.evt + '&nbsp;!' : s.cur.nom;
            const nd = s.next.d;
            html += row(s.cur.ico, main,
                s.next.nom + ' dans ' + s.joursRestants + ' jour' + (s.joursRestants > 1 ? 's' : '') +
                ' (' + nd.getDate() + ' ' + MOIS_COURT[nd.getMonth()] + ')');
        }

        if (cfg.show.dicton) {
            const dj = DICTONS_JOUR[(m + 1) + '-' + d];
            const dm = DICTONS_MOIS[m][d % DICTONS_MOIS[m].length];
            html += '<blockquote class="ephem-dicton">' + esc(dj || dm) + '</blockquote>';
        }

        if (cfg.show.numeros) {
            const doy = dayOfYear(now);
            const tot = isLeap(y) ? 366 : 365;
            html += '<div class="ephem-foot">Semaine ' + isoWeek(now) + '<span>' + doy + 'e jour de l\'année, encore ' + (tot - doy) + '</span></div>';
        }

        html += '</div>';
        return html;
    }

    function buildSettings(cfg) {
        let opts = '';
        for (const k in CITIES) opts += '<option value="' + k + '"' + (cfg.city === k ? ' selected' : '') + '>' + CITIES[k].name + '</option>';
        opts += '<option value="perso"' + (cfg.city === 'perso' ? ' selected' : '') + '>Autre lieu…</option>';

        let checks = '';
        SECTIONS.forEach(([k, lbl]) => {
            checks += '<label class="ephem-chk"><input type="checkbox" data-ephem-show="' + k + '"' + (cfg.show[k] ? ' checked' : '') + '> ' + lbl + '</label>';
        });

        const perso = cfg.city === 'perso';
        return '<div class="ephem-settings" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()">' +
            '<div class="ephem-set-title">Réglages de l\'éphéméride</div>' +
            '<label class="ephem-lbl">Lieu (pour le soleil)' +
              '<select data-ephem-city>' + opts + '</select></label>' +
            '<div class="ephem-perso"' + (perso ? '' : ' hidden') + '>' +
              '<input type="text" data-ephem-pname placeholder="Nom du lieu" value="' + esc(cfg.persoName || '') + '">' +
              '<input type="number" step="0.001" data-ephem-lat placeholder="Latitude (45.57)" value="' + (cfg.lat ?? '') + '">' +
              '<input type="number" step="0.001" data-ephem-lon placeholder="Longitude (5.92)" value="' + (cfg.lon ?? '') + '">' +
            '</div>' +
            '<div class="ephem-lbl">Rubriques affichées</div>' + checks +
            '<button type="button" class="ephem-done" data-ephem-action="close">Terminé</button>' +
        '</div>';
    }

    // Empêche le déplacement du widget quand on clique sur un contrôle
    const STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

    function buildBar(sel, full) {
        const isToday = sameDay(sel, new Date());
        return '<div class="ephem-bar">' +
            '<button type="button" class="ephem-gear" data-ephem-action="toggle" title="Réglages" aria-label="Réglages"' + STOP + '>⚙</button>' +
            '<div class="ephem-datebox"' + STOP + '>' +
                '<button type="button" class="ephem-nav" data-ephem-action="prev" title="Jour précédent" aria-label="Jour précédent">‹</button>' +
                '<input type="date" class="ephem-date" data-ephem-date value="' + toInputDate(sel) + '" min="1900-01-01" max="2200-12-31" title="Choisir un jour" aria-label="Choisir un jour">' +
                '<button type="button" class="ephem-nav" data-ephem-action="next" title="Jour suivant" aria-label="Jour suivant">›</button>' +
                '<button type="button" class="ephem-today' + (isToday ? ' is-hidden' : '') + '" data-ephem-action="today" title="Revenir à aujourd\'hui" aria-label="Revenir à aujourd\'hui">⟲</button>' +
            '</div>' +
            '<div class="wf-btns"' + STOP + '>' +
                '<button type="button" class="wf-btn wf-btn-min" data-ephem-action="wf-min" title="Réduire" aria-label="Réduire"></button>' +
                '<button type="button" class="wf-btn wf-btn-max" data-ephem-action="wf-max" title="' + (full ? 'Quitter le plein écran' : 'Plein écran') + '" aria-label="Plein écran"></button>' +
                '<button type="button" class="wf-btn wf-btn-close" data-ephem-action="wf-close" title="Fermer" aria-label="Fermer"></button>' +
            '</div>' +
        '</div>';
    }

    function render(root) {
        const cfg = getCfg(root);
        const sel = getSelDate(root);
        const open = root.classList.contains('ephem-open');
        root.innerHTML =
            buildBar(sel, root.classList.contains('ephem-full')) +
            '<div class="ephem-sheet">' + buildSheet(cfg, sel) + '</div>' +
            (open ? buildSettings(cfg) : '');
        root.setAttribute('data-day', new Date().toDateString());
        watchSize(root);
        fitSheet(root);
    }

    /* ── Ajustement automatique : tout doit tenir sans scroller ──────
       On cherche (par dichotomie) le plus grand facteur --ep-k ≤ 1 pour
       lequel le contenu de la feuille tient dans sa hauteur. Le grand
       chiffre du jour se réduit moitié moins vite que le texte. ────── */
    const K_MIN = 0.45;
    function fitSheet(root) {
        const body = root.querySelector('.ephem-body');
        if (!body || !root.offsetWidth || !root.offsetHeight) return;
        const sheet = root.querySelector('.ephem-sheet');
        const fits = k => {
            root.style.setProperty('--ep-k', k.toFixed(3));
            root.style.setProperty('--ep-kh', ((1 + k) / 2).toFixed(3));
            return body.scrollHeight <= body.clientHeight && sheet.scrollHeight <= sheet.clientHeight;
        };
        if (fits(1)) return;
        let lo = K_MIN, hi = 1;
        if (!fits(lo)) return; // cas extrême : on garde le plus petit facteur (le scroll reste possible)
        for (let i = 0; i < 8; i++) {
            const mid = (lo + hi) / 2;
            if (fits(mid)) lo = mid; else hi = mid;
        }
        fits(lo);
    }

    // Recalcule l'ajustement quand la taille change (redimensionnement, plein écran)
    const sized = new WeakSet();
    const ro = typeof ResizeObserver === 'function'
        ? new ResizeObserver(entries => entries.forEach(en => fitSheet(en.target)))
        : null;
    function watchSize(root) {
        if (!ro || sized.has(root)) return;
        sized.add(root);
        ro.observe(root);
    }

    // Met à jour seulement la feuille (sans recréer le champ date en cours de saisie)
    function renderSheet(root) {
        const sheet = root.querySelector('.ephem-sheet');
        if (!sheet) { render(root); return; }
        const sel = getSelDate(root);
        sheet.innerHTML = buildSheet(getCfg(root), sel);
        const inp = root.querySelector('[data-ephem-date]');
        if (inp && document.activeElement !== inp) inp.value = toInputDate(sel);
        const t = root.querySelector('[data-ephem-action="today"]');
        if (t) t.classList.toggle('is-hidden', sameDay(sel, new Date()));
        fitSheet(root);
    }

    /* ── Boutons fenêtre : réduire / plein écran / fermer ───────────── */
    function toggleFull(root, force) {
        const full = force !== undefined ? force : !root.classList.contains('ephem-full');
        root.classList.toggle('ephem-full', full);
        const widget = root.closest('.widget');
        if (widget) widget.classList.toggle('ephem-is-full', full);
        const b = root.querySelector('[data-ephem-action="wf-max"]');
        if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    }

    function minimizeWidget(root) {
        const widget = root.closest('.widget');
        if (!widget || typeof window._wfMiniBarCollapse !== 'function') return;
        if (root.classList.contains('ephem-full')) toggleFull(root, false);
        root.classList.remove('ephem-open');
        const box = root.closest('.editor-container') || root;
        box.style.visibility = 'hidden'; // la feuille ne doit pas passer par-dessus la mini-barre
        window._wfMiniBarCollapse(widget, '📅 Éphéméride', {
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

    function renderAll(onlyIfDayChanged) {
        const today = new Date().toDateString();
        document.querySelectorAll('.ephem-root').forEach(r => {
            if (!onlyIfDayChanged || r.getAttribute('data-day') !== today) render(r);
        });
    }

    /* ── Événements (délégués : survivent à la sauvegarde/restauration) ── */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-ephem-action]');
        if (!btn) return;
        const root = btn.closest('.ephem-root');
        if (!root) return;
        e.stopPropagation();
        const act = btn.getAttribute('data-ephem-action');
        if (act === 'wf-min')   { minimizeWidget(root); return; }
        if (act === 'wf-max')   { toggleFull(root); return; }
        if (act === 'wf-close') { closeWidget(root); return; }
        if (act === 'prev' || act === 'next') { setSelDate(root, addDays(getSelDate(root), act === 'prev' ? -1 : 1)); return; }
        if (act === 'today')    { setSelDate(root, null); return; }
        if (act === 'toggle') root.classList.toggle('ephem-open');
        if (act === 'close') root.classList.remove('ephem-open');
        render(root);
    }, true);

    document.addEventListener('change', function (e) {
        const root = e.target.closest && e.target.closest('.ephem-root');
        if (!root) return;
        const t = e.target;
        if (t.hasAttribute('data-ephem-date')) {
            const d = parseInputDate(t.value);
            if (d) setSelDate(root, d);
            return;
        }
        const cfg = getCfg(root);
        if (t.hasAttribute('data-ephem-show')) cfg.show[t.getAttribute('data-ephem-show')] = t.checked;
        else if (t.hasAttribute('data-ephem-city')) cfg.city = t.value;
        else if (t.hasAttribute('data-ephem-pname')) cfg.persoName = t.value.trim();
        else if (t.hasAttribute('data-ephem-lat')) cfg.lat = parseFloat(t.value);
        else if (t.hasAttribute('data-ephem-lon')) cfg.lon = parseFloat(t.value);
        else return;
        setCfg(root, cfg);
    });

    // Échap : quitter le plein écran (déclaré avant le blocage ci-dessous)
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.ephem-root.ephem-full').forEach(r => toggleFull(r, false));
    }, true);

    // Empêche les raccourcis clavier du board pendant la saisie (réglages, champ date)
    document.addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('.ephem-settings, .ephem-bar')) e.stopPropagation();
    }, true);

    /* ── Redimensionnement proportionnel ──────────────────────────
       La poignée du board (.custom-resize-handle) est interceptée pour
       ce widget : la hauteur suit toujours la largeur (rapport 2:3,
       celui du format d'origine 320 × 480). ──────────────────────── */
    const RATIO = 480 / 320;
    const MIN_W = 200, MAX_W = 2400;

    function ephemBox(widget) {
        const root = widget.querySelector('.ephem-root');
        return root ? (root.closest('.editor-container') || root) : null;
    }

    // Écarts entre le widget et la feuille (si le widget a une taille en px)
    function widgetExtra(widget, box) {
        return {
            w: /px$/.test(widget.style.width)  ? widget.offsetWidth  - box.offsetWidth  : null,
            h: /px$/.test(widget.style.height) ? widget.offsetHeight - box.offsetHeight : null
        };
    }

    function applySize(widget, box, w, extra) {
        w = Math.round(Math.min(MAX_W, Math.max(MIN_W, w)));
        const h = Math.round(w * RATIO);
        box.style.width = w + 'px';
        box.style.height = h + 'px';
        if (extra.w !== null) widget.style.width  = (w + extra.w) + 'px';
        if (extra.h !== null) widget.style.height = (h + extra.h) + 'px';
    }

    function startResize(e, widget) {
        const box = ephemBox(widget);
        if (!box) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const w0 = box.offsetWidth;
        const extra = widgetExtra(widget, box);
        const x0 = e.clientX, y0 = e.clientY;
        const move = ev => {
            // déplacement projeté sur la diagonale : largeur et hauteur bougent ensemble
            const dx = ev.clientX - x0, dy = ev.clientY - y0;
            applySize(widget, box, w0 + (dx + dy / RATIO) / 2, extra);
        };
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
        if (!widget || !widget.querySelector('.ephem-root')) return;
        if (widget.classList.contains('ephem-is-full') || widget.querySelector('.wf-mini-bar')) return;
        if (e.type === 'pointerdown') { startResize(e, widget); return; }
        // on bloque aussi mousedown / touchstart pour que le redimensionnement libre du board ne démarre pas
        e.stopPropagation(); e.stopImmediatePropagation();
        if (e.cancelable) e.preventDefault();
    }
    ['pointerdown', 'mousedown', 'touchstart'].forEach(t =>
        document.addEventListener(t, onResizeDown, { capture: true, passive: false }));

    // Corrige un widget déjà enregistré avec des proportions différentes
    function fixRatio(root) {
        requestAnimationFrame(() => {
            const widget = root.closest('.widget');
            if (!widget || widget.querySelector('.wf-mini-bar') || root.classList.contains('ephem-full')) return;
            const box = ephemBox(widget);
            if (!box || !box.offsetWidth) return;
            if (Math.abs(box.offsetHeight - box.offsetWidth * RATIO) > 2) {
                applySize(widget, box, box.offsetWidth, widgetExtra(widget, box));
            }
        });
    }

    /* ── Hydratation : nouveaux widgets et boards rechargés ──────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        const roots = node.matches('.ephem-root') ? [node] : Array.from(node.querySelectorAll('.ephem-root'));
        roots.forEach(r => { render(r); fixRatio(r); });
    }
    const mo = new MutationObserver(muts => {
        for (const m of muts) m.addedNodes.forEach(n => {
            if (n instanceof Element && (n.matches('.widget, .ephem-root') || n.querySelector('.ephem-root'))) {
                // on ne ré-hydrate pas pour nos propres mises à jour internes
                if (n.closest('.ephem-root') && !n.matches('.ephem-root')) return;
                hydrate(n);
            }
        });
    });

    /* ── Template et styles ───────────────────────────────────────── */
    function injectTemplate() {
        if (document.getElementById('template-ephemeride')) return;
        const tpl = document.createElement('template');
        tpl.id = 'template-ephemeride';
        tpl.innerHTML =
            '<div class="editor-container" style="width:320px;height:480px;">' +
                '<div class="ephem-root" data-cfg=\'' + JSON.stringify(DEFAULT_CFG) + '\'></div>' +
            '</div>';
        document.body.appendChild(tpl);
    }

    function injectStyles() {
        if (document.getElementById('ephem-styles')) return;
        const st = document.createElement('style');
        st.id = 'ephem-styles';
        st.textContent = `
.ephem-root{
  --ep-paper:#fdfcf8; --ep-ink:#23201c; --ep-soft:#6b645a; --ep-red:#c8102e;
  --ep-line:#d9d2c3;
  container-type:inline-size; position:relative; width:100%; height:100%;
  box-sizing:border-box; background:var(--ep-paper);
  display:flex; flex-direction:column; overflow:hidden;
  font-family:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",serif;
  color:var(--ep-ink); user-select:none;
}
.ephem-bar{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1.5cqw;
  padding:2cqw 2.5cqw 0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.ephem-bar .wf-btns{justify-self:end}
.ephem-datebox{display:flex;align-items:center;gap:.8cqw}
.ephem-nav,.ephem-today{border:0;background:none;color:var(--ep-soft);cursor:pointer;padding:0 1cqw;
  font-size:max(13px,5cqw);line-height:1;border-radius:4px}
.ephem-today{font-size:max(12px,4.2cqw)}
.ephem-today.is-hidden{visibility:hidden}
.ephem-nav:hover,.ephem-today:hover{color:var(--ep-ink);background:#f1ece1}
.ephem-date{font:inherit;font-size:max(11px,3.6cqw);color:var(--ep-ink);background:transparent;color-scheme:light;
  border:1px solid var(--ep-line);border-radius:4px;padding:.4cqw 1cqw;cursor:pointer;user-select:auto}
.ephem-date:hover{border-color:#b3aa9b}
.ephem-gear{justify-self:start;border:0;background:none;color:#b3aa9b;
  font-size:5.2cqw;line-height:1;cursor:pointer;padding:1cqw;border-radius:4px}
.ephem-gear:hover,.ephem-gear:focus-visible{color:var(--ep-ink);outline:1px solid var(--ep-line)}
.ephem-bar :focus-visible{outline:2px solid var(--ep-red);outline-offset:1px}
.ephem-sheet{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.ephem-head{text-align:center;padding:calc(1cqw * var(--ep-kh,1)) 4cqw calc(2cqw * var(--ep-kh,1));flex:none;line-height:1.15}
.ephem-month{font-size:calc(5cqw * var(--ep-kh,1));letter-spacing:.04em;color:var(--ep-soft);font-style:italic}
.ephem-num{font-family:Rockwell,"Roboto Slab","Clarendon","Bookman Old Style",Georgia,serif;font-weight:800;
  font-size:calc(34cqw * var(--ep-kh,1));line-height:.95;letter-spacing:-.03em;font-variant-numeric:lining-nums}
.ephem-wday{font-size:calc(7.5cqw * var(--ep-kh,1));font-weight:600;margin-top:-.5cqw}
.ephem-wday::first-letter{text-transform:uppercase}
.ephem-num.is-red,.ephem-wday.is-red{color:var(--ep-red)}
.ephem-perf{flex:none;height:0;margin:0 3cqw;border-top:2px dotted var(--ep-line)}
/* Tailles en em : tout le corps suit le facteur --ep-k calculé par fitSheet() */
.ephem-body{flex:1;min-height:0;overflow-y:auto;padding:.58em 5cqw .7em;font-size:calc(4.3cqw * var(--ep-k,1));line-height:1.35}
.ephem-row{display:flex;gap:.7em;align-items:flex-start;padding:.37em 0}
.ephem-row + .ephem-row{border-top:1px solid #efe9dd}
.ephem-ico{flex:none;width:1.3em;text-align:center;font-size:1.25em;line-height:1.1}
.ephem-main{font-weight:600}
.ephem-sub{color:var(--ep-soft);font-size:.86em}
.ephem-dicton{margin:.58em 0 .23em;padding:.47em .7em;border-left:3px solid var(--ep-red);font-style:italic;
  color:#3d3830;background:#f6f2e8}
.ephem-foot{display:flex;justify-content:space-between;gap:.47em;flex-wrap:wrap;margin-top:.47em;padding-top:.47em;
  border-top:1px solid var(--ep-line);font-size:.82em;color:var(--ep-soft)}
.ephem-settings{position:absolute;inset:0;z-index:4;background:#fff;padding:4cqw 5cqw;overflow-y:auto;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:max(12px,3.8cqw);color:#222;user-select:auto}
.ephem-set-title{font-weight:700;font-size:1.1em;margin-bottom:3cqw}
.ephem-lbl{display:block;font-weight:600;margin:3cqw 0 1.5cqw}
.ephem-settings select,.ephem-settings input[type=text],.ephem-settings input[type=number]{display:block;width:100%;box-sizing:border-box;
  margin-top:1.2cqw;padding:5px 6px;font:inherit;border:1px solid #bbb;border-radius:4px;background:#fff;color:#222}
.ephem-perso{display:grid;gap:4px}
.ephem-perso[hidden]{display:none}
.ephem-chk{display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer}
.ephem-done{margin-top:4cqw;width:100%;padding:7px;border:0;border-radius:4px;background:var(--ep-ink);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.ephem-done:focus-visible,.ephem-settings :focus-visible{outline:2px solid var(--ep-red);outline-offset:1px}
/* Plein écran : la feuille garde ses proportions et occupe toute la hauteur */
.ephem-root.ephem-full{position:fixed;z-index:9999;top:0;bottom:0;left:50%;transform:translateX(-50%);
  width:min(100vw,66.7vh);height:100vh;box-shadow:0 0 0 100vmax rgba(35,32,28,.88)}
.widget.ephem-is-full > .drag-handle,
.widget.ephem-is-full > .widget-rotate-handle,
.widget.ephem-is-full > .widget-action-bar,
.widget.ephem-is-full > .widget-ctx-menu,
.widget.ephem-is-full > .custom-resize-handle{display:none !important}
@media print{.ephem-bar,.ephem-settings{display:none}}
`;
        document.head.appendChild(st);
    }

    /* ── Code partagé avec le widget Défi calme (boutons fenêtre +
          mini-barre « Réduire »). Chaque bloc n'est installé qu'une fois,
          quel que soit le widget chargé en premier. ─────────────────── */
    function installSharedWindowButtons() {
        // ── Mini-barre collapse (partagée avec les autres widgets) ─────────────────
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

        // ── Boutons fenêtre (CSS partagé) ──────────────────────────────────────────
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
            document.fonts.ready.then(() => document.querySelectorAll('.ephem-root').forEach(fitSheet));
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Accès public (tests / autres scripts)
    window.renderEphemerides = () => renderAll(false);

    // Sauvegarde / chargement (utilisés par save-load.js)
    // On ne sauvegarde que les réglages : la date choisie reste temporaire
    // et le widget revient au jour courant au rechargement.
    window.ephemGetData = function (widget) {
        const root = widget && widget.querySelector('.ephem-root');
        return root ? { cfg: getCfg(root) } : null;
    };
    window.ephemSetData = function (widget, data) {
        const root = widget && widget.querySelector('.ephem-root');
        if (!root || !data || !data.cfg) return;
        root.setAttribute('data-cfg', JSON.stringify(data.cfg));
        render(root);
    };
})();
