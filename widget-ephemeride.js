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

    function render(root) {
        const cfg = getCfg(root);
        const now = new Date();
        const open = root.classList.contains('ephem-open');
        root.innerHTML =
            '<button type="button" class="ephem-gear" data-ephem-action="toggle" title="Réglages" aria-label="Réglages">⚙</button>' +
            '<div class="ephem-sheet">' + buildSheet(cfg, now) + '</div>' +
            (open ? buildSettings(cfg) : '');
        root.setAttribute('data-day', now.toDateString());
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
        if (act === 'toggle') root.classList.toggle('ephem-open');
        if (act === 'close') root.classList.remove('ephem-open');
        render(root);
    }, true);

    document.addEventListener('change', function (e) {
        const root = e.target.closest && e.target.closest('.ephem-root');
        if (!root) return;
        const cfg = getCfg(root);
        const t = e.target;
        if (t.hasAttribute('data-ephem-show')) cfg.show[t.getAttribute('data-ephem-show')] = t.checked;
        else if (t.hasAttribute('data-ephem-city')) cfg.city = t.value;
        else if (t.hasAttribute('data-ephem-pname')) cfg.persoName = t.value.trim();
        else if (t.hasAttribute('data-ephem-lat')) cfg.lat = parseFloat(t.value);
        else if (t.hasAttribute('data-ephem-lon')) cfg.lon = parseFloat(t.value);
        else return;
        setCfg(root, cfg);
    });

    // Empêche les raccourcis clavier du board pendant la saisie dans les réglages
    document.addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('.ephem-settings')) e.stopPropagation();
    }, true);

    /* ── Hydratation : nouveaux widgets et boards rechargés ──────── */
    function hydrate(node) {
        if (!(node instanceof Element)) return;
        if (node.matches('.ephem-root')) render(node);
        node.querySelectorAll && node.querySelectorAll('.ephem-root').forEach(render);
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
.ephem-gear{position:absolute;top:1.2cqw;right:2cqw;z-index:3;border:0;background:none;color:#b3aa9b;
  font-size:5.2cqw;line-height:1;cursor:pointer;padding:1cqw;border-radius:4px}
.ephem-gear:hover,.ephem-gear:focus-visible{color:var(--ep-ink);outline:1px solid var(--ep-line)}
.ephem-sheet{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.ephem-head{text-align:center;padding:3cqw 4cqw 2cqw;flex:none}
.ephem-month{font-size:5cqw;letter-spacing:.04em;color:var(--ep-soft);font-style:italic}
.ephem-num{font-family:Rockwell,"Roboto Slab","Clarendon","Bookman Old Style",Georgia,serif;font-weight:800;
  font-size:34cqw;line-height:.95;letter-spacing:-.03em;font-variant-numeric:lining-nums}
.ephem-wday{font-size:7.5cqw;font-weight:600;margin-top:-.5cqw}
.ephem-wday::first-letter{text-transform:uppercase}
.ephem-num.is-red,.ephem-wday.is-red{color:var(--ep-red)}
.ephem-perf{flex:none;height:0;margin:0 3cqw;border-top:2px dotted var(--ep-line)}
.ephem-body{flex:1;min-height:0;overflow-y:auto;padding:2.5cqw 5cqw 3cqw;font-size:4.3cqw;line-height:1.35}
.ephem-row{display:flex;gap:3cqw;align-items:flex-start;padding:1.6cqw 0}
.ephem-row + .ephem-row{border-top:1px solid #efe9dd}
.ephem-ico{flex:none;width:7cqw;text-align:center;font-size:5.4cqw;line-height:1.1}
.ephem-main{font-weight:600}
.ephem-sub{color:var(--ep-soft);font-size:.86em}
.ephem-dicton{margin:2.5cqw 0 1cqw;padding:2cqw 3cqw;border-left:3px solid var(--ep-red);font-style:italic;
  color:#3d3830;background:#f6f2e8}
.ephem-foot{display:flex;justify-content:space-between;gap:2cqw;flex-wrap:wrap;margin-top:2cqw;padding-top:2cqw;
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
@media print{.ephem-gear,.ephem-settings{display:none}}
`;
        document.head.appendChild(st);
    }

    function init() {
        injectStyles();
        injectTemplate();
        renderAll(false);
        mo.observe(document.body, { childList: true, subtree: true });
        // Changement de jour (board resté ouvert la nuit, ou retour de veille)
        setInterval(() => renderAll(true), 60000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAll(true); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Accès public (tests / autres scripts)
    window.renderEphemerides = () => renderAll(false);
})();
