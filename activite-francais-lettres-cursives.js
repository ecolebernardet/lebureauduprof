// =========================================================================
// WIDGET LETTRES CURSIVES — Le Bureau du Prof
// Apprendre le geste de l'écriture cursive (cycle 2) sur un lignage Seyès agrandi :
//   👀 Observer     : la lettre se trace pas à pas (point de départ numéroté,
//                     flèches de sens, consigne de chaque étape, lecture à voix haute).
//   ✏️ S'entraîner : l'élève repasse au stylet ou au doigt sur des modèles
//                     (repasser, pointillés, point de départ seul, sans aide),
//                     puis « Vérifier » donne des étoiles et des conseils
//                     (point de départ, sens du tracé).
//
// Même fenêtre que « L'atelier de phrases » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone : ouverture directe en plein écran (bouton vert).
// L'état (lettre, onglet, réglages, tracés de l'élève, étoiles) est restauré
// après actualisation via save-load.js (_lcGetData / _lcSetData).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// =========================================================================

// ── Modèles des lettres cursives ──────────────────────────────────────────
// Unité : 1 interligne Seyès. Ligne d'écriture : y = 0, 1re ligne : y = −1,
// 2e ligne : y = −2, 3e ligne : y = −3. Sous la ligne : y = +1, +2, +3.
// Les tracés sont écrits droits et affichés droits (LC_SLANT = 0).
// Chaque étape : { d: tracé (commence par M), t: consigne, lift: lever le crayon avant }
const LC_LETTRES = {
    a: { w: 1.75, cat: 'p', steps: [
        { d: 'M1.0 -0.82 C0.92 -1.02 0.55 -1.05 0.33 -0.82 C0.08 -0.55 0.12 -0.02 0.48 -0.02', t: 'Je pars sous la 1re ligne et je fais un rond en tournant vers la gauche.' },
        { d: 'M0.48 -0.02 C0.78 -0.02 0.95 -0.5 1.05 -1', t: 'Je remonte jusqu\'à la 1re ligne pour fermer le rond.' },
        { d: 'M1.05 -1 C1.0 -0.6 0.97 -0.3 1.03 -0.13 C1.12 0.04 1.4 0.0 1.72 -0.35', t: 'Je redescends tout droit et j\'attache.' }
    ]},
    b: { w: 1.9, cat: 'h', steps: [
        { d: 'M0 0 C0.45 -0.2 1.05 -1.7 1.08 -2.45', t: 'Je monte en biais vers la 3e ligne.' },
        { d: 'M1.08 -2.45 C1.1 -2.92 0.85 -3.05 0.7 -2.9 C0.52 -2.7 0.5 -1.5 0.52 -0.4', t: 'Je fais une grande boucle vers la gauche et je redescends tout droit.' },
        { d: 'M0.52 -0.4 C0.54 0.0 0.85 0.02 1.05 -0.08 C1.35 -0.25 1.45 -0.8 1.28 -0.97', t: 'Je touche la ligne et je remonte en arrondi jusqu\'à la 1re ligne.' },
        { d: 'M1.28 -0.97 C1.18 -1.05 1.05 -0.95 1.15 -0.87 C1.32 -0.78 1.62 -0.85 1.9 -0.95', t: 'Je fais un petit nœud et j\'attache en haut.' }
    ]},
    c: { w: 1.45, cat: 'p', steps: [
        { d: 'M0.92 -0.8 C1.0 -0.95 0.9 -1.05 0.72 -1.02 C0.38 -0.98 0.1 -0.62 0.15 -0.3 C0.2 0.0 0.5 0.03 0.75 -0.06', t: 'Je fais un petit crochet, puis un arrondi en tournant vers la gauche.' },
        { d: 'M0.75 -0.06 C0.98 -0.13 1.18 -0.25 1.42 -0.4', t: 'Je ne ferme pas : je repars vers la droite et j\'attache.' }
    ]},
    d: { w: 1.8, cat: 'h', steps: [
        { d: 'M1.0 -0.82 C0.92 -1.02 0.55 -1.05 0.33 -0.82 C0.08 -0.55 0.12 -0.02 0.48 -0.02', t: 'Je pars sous la 1re ligne et je fais un rond en tournant vers la gauche.' },
        { d: 'M0.48 -0.02 C0.8 -0.02 0.98 -0.6 1.06 -1.1 C1.1 -1.4 1.13 -1.75 1.15 -2', t: 'Je remonte tout droit jusqu\'à la 2e ligne.' },
        { d: 'M1.15 -2 C1.12 -1.4 1.05 -0.6 1.07 -0.2 C1.1 0.03 1.45 0.02 1.78 -0.35', t: 'Je redescends sur le même trait et j\'attache.' }
    ]},
    e: { w: 1.4, cat: 'p', steps: [
        { d: 'M0 0 C0.4 0 0.95 -0.35 1.0 -0.7', t: 'Je monte en biais vers la 1re ligne.' },
        { d: 'M1.0 -0.7 C1.03 -0.95 0.85 -1.05 0.68 -0.98 C0.42 -0.88 0.3 -0.5 0.38 -0.25', t: 'Je fais une petite boucle en tournant vers la gauche.' },
        { d: 'M0.38 -0.25 C0.48 0.02 0.95 0.05 1.38 -0.35', t: 'Je redescends sur la ligne et j\'attache.' }
    ]},
    f: { w: 1.55, cat: 'hb', steps: [
        { d: 'M0 0 C0.45 -0.2 1.05 -1.7 1.08 -2.45', t: 'Je monte en biais vers la 3e ligne.' },
        { d: 'M1.08 -2.45 C1.1 -2.92 0.85 -3.05 0.7 -2.9 C0.52 -2.7 0.52 -1 0.52 0', t: 'Je fais une grande boucle vers la gauche et je redescends jusqu\'à la ligne.' },
        { d: 'M0.52 0 C0.52 0.7 0.52 1.39 0.52 1.71', t: 'Je continue tout droit sous la ligne.' },
        { d: 'M0.52 1.71 C0.52 2.06 0.95 2.09 1.0 1.78 C1.05 1.26 0.85 0.35 0.55 0.01', t: 'Je fais une boucle vers la droite et je remonte jusqu\'à la ligne.' },
        { d: 'M0.55 0.01 C0.85 0.03 1.22 -0.1 1.55 -0.35', t: 'J\'attache.' }
    ]},
    g: { w: 1.7, cat: 'b', steps: [
        { d: 'M1.0 -0.82 C0.92 -1.02 0.55 -1.05 0.33 -0.82 C0.08 -0.55 0.12 -0.02 0.48 -0.02', t: 'Je pars sous la 1re ligne et je fais un rond en tournant vers la gauche.' },
        { d: 'M0.48 -0.02 C0.78 -0.02 0.95 -0.5 1.05 -1', t: 'Je remonte jusqu\'à la 1re ligne pour fermer le rond.' },
        { d: 'M1.05 -1 C1.03 -0.2 1.0 1.08 0.98 1.63', t: 'Je descends tout droit sous la ligne.' },
        { d: 'M0.98 1.63 C0.96 2.02 0.5 2.11 0.4 1.86 C0.3 1.6 0.7 0.88 1.0 0.41 C1.15 0.17 1.4 -0.15 1.7 -0.35', t: 'Je fais une boucle vers la gauche et je remonte pour attacher.' }
    ]},
    h: { w: 1.95, cat: 'h', steps: [
        { d: 'M0 0 C0.45 -0.2 1.05 -1.7 1.08 -2.45', t: 'Je monte en biais vers la 3e ligne.' },
        { d: 'M1.08 -2.45 C1.1 -2.92 0.85 -3.05 0.7 -2.9 C0.52 -2.7 0.5 -1.6 0.5 0', t: 'Je fais une grande boucle vers la gauche et je redescends jusqu\'à la ligne.' },
        { d: 'M0.5 0 C0.6 -0.55 0.88 -1.0 1.15 -1.0 C1.4 -1.0 1.38 -0.55 1.35 -0.25', t: 'Je remonte sur le trait et je fais un pont.' },
        { d: 'M1.35 -0.25 C1.33 0.02 1.62 0.03 1.95 -0.35', t: 'Je redescends et j\'attache.' }
    ]},
    i: { w: 1.45, cat: 'p', steps: [
        { d: 'M0 0 C0.35 -0.05 0.65 -0.55 0.78 -1', t: 'Je monte en biais jusqu\'à la 1re ligne.' },
        { d: 'M0.78 -1 C0.76 -0.65 0.73 -0.4 0.75 -0.22 C0.78 0.03 1.1 0.03 1.45 -0.35', t: 'Je redescends tout droit et j\'attache.' },
        { d: 'M0.8 -1.62 L0.84 -1.58', t: 'Je lève le crayon et je mets le point.', lift: true }
    ]},
    j: { w: 1.5, cat: 'b', steps: [
        { d: 'M0 0 C0.35 -0.05 0.65 -0.55 0.78 -1', t: 'Je monte en biais jusqu\'à la 1re ligne.' },
        { d: 'M0.78 -1 C0.76 0 0.73 1.08 0.72 1.63', t: 'Je descends tout droit sous la ligne.' },
        { d: 'M0.72 1.63 C0.7 2.02 0.24 2.11 0.14 1.86 C0.04 1.6 0.44 0.88 0.74 0.41 C0.89 0.17 1.14 -0.15 1.5 -0.35', t: 'Je fais une boucle vers la gauche et je remonte pour attacher.' },
        { d: 'M0.8 -1.62 L0.84 -1.58', t: 'Je lève le crayon et je mets le point.', lift: true }
    ]},
    k: { w: 1.95, cat: 'h', steps: [
        { d: 'M0 0 C0.45 -0.2 1.05 -1.7 1.08 -2.45', t: 'Je monte en biais vers la 3e ligne.' },
        { d: 'M1.08 -2.45 C1.1 -2.92 0.85 -3.05 0.7 -2.9 C0.52 -2.7 0.5 -1.6 0.5 0', t: 'Je fais une grande boucle vers la gauche et je redescends jusqu\'à la ligne.' },
        { d: 'M0.5 0 C0.6 -0.55 0.9 -1.02 1.18 -1.0 C1.45 -0.98 1.42 -0.62 1.15 -0.55 C1.02 -0.52 0.92 -0.52 0.88 -0.55', t: 'Je remonte sur le trait et je fais une petite boucle.' },
        { d: 'M0.88 -0.55 C1.15 -0.48 1.25 -0.25 1.3 -0.12 C1.38 0.03 1.65 0.02 1.95 -0.35', t: 'Je redescends en biais et j\'attache.' }
    ]},
    l: { w: 1.5, cat: 'h', steps: [
        { d: 'M0 0 C0.45 -0.2 1.05 -1.7 1.08 -2.45', t: 'Je monte en biais vers la 3e ligne.' },
        { d: 'M1.08 -2.45 C1.1 -2.92 0.85 -3.05 0.7 -2.9 C0.52 -2.7 0.5 -1.6 0.52 -0.6', t: 'Je fais une grande boucle vers la gauche et je redescends tout droit.' },
        { d: 'M0.52 -0.6 C0.54 -0.1 0.65 0.03 0.9 0.0 C1.1 -0.04 1.3 -0.2 1.5 -0.35', t: 'J\'arrive sur la ligne et j\'attache.' }
    ]},
    m: { w: 2.65, cat: 'p', steps: [
        { d: 'M0.02 -0.45 C0.06 -0.72 0.22 -0.98 0.4 -0.98 C0.5 -0.98 0.52 -0.85 0.5 -0.65', t: 'Je pars entre la ligne et la 1re ligne et je fais un petit crochet jusqu\'à la 1re ligne.' },
        { d: 'M0.5 -0.65 L0.48 0', t: 'Je descends tout droit jusqu\'à la ligne.' },
        { d: 'M0.48 0 C0.55 -0.6 0.8 -1.0 1.05 -1.0 C1.3 -1.0 1.28 -0.6 1.27 0', t: 'Je remonte sur le trait et je fais un premier pont.' },
        { d: 'M1.27 0 C1.34 -0.6 1.6 -1.0 1.85 -1.0 C2.1 -1.0 2.08 -0.6 2.07 -0.25', t: 'Je remonte encore et je fais un 2e pont.' },
        { d: 'M2.07 -0.25 C2.05 0.02 2.32 0.03 2.65 -0.3', t: 'Je redescends et j\'attache.' }
    ]},
    n: { w: 1.85, cat: 'p', steps: [
        { d: 'M0.02 -0.45 C0.06 -0.72 0.22 -0.98 0.4 -0.98 C0.5 -0.98 0.52 -0.85 0.5 -0.65', t: 'Je pars entre la ligne et la 1re ligne et je fais un petit crochet jusqu\'à la 1re ligne.' },
        { d: 'M0.5 -0.65 L0.48 0', t: 'Je descends tout droit jusqu\'à la ligne.' },
        { d: 'M0.48 0 C0.55 -0.6 0.82 -1.0 1.1 -1.0 C1.35 -1.0 1.33 -0.6 1.3 -0.25', t: 'Je remonte sur le trait et je fais un pont.' },
        { d: 'M1.3 -0.25 C1.28 0.02 1.55 0.03 1.85 -0.3', t: 'Je redescends et j\'attache.' }
    ]},
    o: { w: 1.65, cat: 'p', steps: [
        { d: 'M0.9 -0.98 C0.55 -1.05 0.18 -0.8 0.18 -0.42 C0.18 -0.08 0.5 0.04 0.75 -0.15 C0.98 -0.35 1.05 -0.85 0.9 -0.98', t: 'Je pars de la 1re ligne et je fais un rond vers la gauche, bien fermé.' },
        { d: 'M0.9 -0.98 C0.8 -1.05 0.75 -0.88 0.92 -0.86 C1.15 -0.84 1.4 -0.88 1.65 -0.95', t: 'Je fais un petit nœud et j\'attache en haut.' }
    ]},
    p: { w: 1.7, cat: 'b', steps: [
        { d: 'M0 0 C0.15 -0.2 0.3 -0.75 0.5 -1.08', t: 'Je pars de la ligne et je monte en biais un peu au-dessus de la 1re ligne.' },
        { d: 'M0.5 -1.08 C0.52 -0.4 0.52 1.03 0.52 2', t: 'Je descends tout droit jusqu\'à la 2e ligne sous la ligne.' },
        { d: 'M0.52 2 L0.53 -0.5', t: 'Je remonte sur le même trait.' },
        { d: 'M0.53 -0.5 C0.6 -0.85 0.75 -1.02 0.92 -1.02 C1.15 -1.02 1.22 -0.7 1.22 -0.35', t: 'Je fais un pont.' },
        { d: 'M1.22 -0.35 C1.22 -0.05 1.45 0.0 1.7 -0.25', t: 'Je redescends et j\'attache.' }
    ]},
    q: { w: 1.3, cat: 'b', steps: [
        { d: 'M1.0 -0.82 C0.92 -1.02 0.55 -1.05 0.33 -0.82 C0.08 -0.55 0.12 -0.02 0.48 -0.02', t: 'Je pars sous la 1re ligne et je fais un rond en tournant vers la gauche.' },
        { d: 'M0.48 -0.02 C0.78 -0.02 0.95 -0.5 1.05 -1', t: 'Je remonte jusqu\'à la 1re ligne pour fermer le rond.' },
        { d: 'M1.05 -1 C1.04 0 1.03 1.1 1.03 2', t: 'Je descends tout droit jusqu\'à la 2e ligne sous la ligne.' }
    ]},
    r: { w: 1.25, cat: 'p', steps: [
        { d: 'M0 -0.34 C0.06 -0.4 0.08 -0.6 0.1 -0.7 C0.11 -0.82 0.12 -0.92 0.13 -1.02', t: 'Je pars entre la ligne et la 1re ligne et je monte jusqu\'à la 1re ligne.' },
        { d: 'M0.13 -1.02 L0.6 -1.02 C0.7 -1.02 0.77 -0.95 0.78 -0.8', t: 'Je trace un petit plat sur la 1re ligne.' },
        { d: 'M0.78 -0.8 L0.78 -0.2 C0.79 -0.05 0.87 0.0 0.98 0.0 C1.08 0.0 1.16 -0.05 1.22 -0.12', t: 'Je descends tout droit et j\'attache.' }
    ]},
    s: { w: 1.15, cat: 'p', steps: [
        { d: 'M0 0 C0.25 -0.25 0.5 -0.85 0.6 -1.25', t: 'Je pars de la ligne et je monte en biais un peu au-dessus de la 1re ligne.' },
        { d: 'M0.6 -1.25 C0.75 -0.9 1.08 -0.6 1.02 -0.3 C0.96 0.0 0.5 0.05 0.12 -0.12', t: 'Je redescends en faisant un ventre et je reviens fermer sur le trait.' }
    ]},
    t: { w: 1.5, cat: 'h', steps: [
        { d: 'M0 0 C0.35 -0.15 0.62 -1.1 0.75 -2', t: 'Je monte en biais jusqu\'à la 2e ligne.' },
        { d: 'M0.75 -2 C0.73 -1.3 0.7 -0.6 0.72 -0.25 C0.75 0.03 1.1 0.03 1.5 -0.35', t: 'Je redescends sur le même trait et j\'attache.' },
        { d: 'M0.3 -1.05 L1.2 -1.05', t: 'Je lève le crayon et je fais la barre sur la 1re ligne.', lift: true }
    ]},
    u: { w: 2.15, cat: 'p', steps: [
        { d: 'M0 0 C0.35 -0.05 0.65 -0.55 0.78 -1', t: 'Je monte en biais jusqu\'à la 1re ligne.' },
        { d: 'M0.78 -1 C0.72 -0.55 0.7 -0.05 1.02 -0.02 C1.32 0 1.45 -0.6 1.5 -1', t: 'Je redescends, je tourne et je remonte jusqu\'à la 1re ligne.' },
        { d: 'M1.5 -1 C1.48 -0.65 1.45 -0.4 1.47 -0.22 C1.5 0.03 1.82 0.03 2.15 -0.35', t: 'Je redescends tout droit et j\'attache.' }
    ]},
    v: { w: 1.7, cat: 'p', steps: [
        { d: 'M0.02 -0.45 C0.06 -0.72 0.22 -0.98 0.4 -0.98 C0.52 -0.98 0.54 -0.8 0.52 -0.55', t: 'Je pars entre la ligne et la 1re ligne et je fais un petit crochet jusqu\'à la 1re ligne.' },
        { d: 'M0.52 -0.55 C0.5 -0.2 0.6 0.0 0.8 0.0 C1.05 0.0 1.2 -0.5 1.2 -1.0', t: 'Je descends, je tourne et je remonte jusqu\'à la 1re ligne.' },
        { d: 'M1.2 -1.0 C1.12 -1.06 1.03 -0.95 1.13 -0.88 C1.3 -0.8 1.5 -0.85 1.7 -0.95', t: 'Je fais un petit nœud et j\'attache en haut.' }
    ]},
    w: { w: 2.4, cat: 'p', steps: [
        { d: 'M0.02 -0.45 C0.06 -0.72 0.22 -0.98 0.4 -0.98 C0.52 -0.98 0.54 -0.8 0.52 -0.55', t: 'Je pars entre la ligne et la 1re ligne et je fais un petit crochet jusqu\'à la 1re ligne.' },
        { d: 'M0.52 -0.55 C0.5 -0.2 0.58 0.0 0.78 0.0 C1.0 0.0 1.15 -0.5 1.17 -0.95', t: 'Je descends, je tourne et je remonte jusqu\'à la 1re ligne.' },
        { d: 'M1.17 -0.95 C1.15 -0.5 1.2 0.0 1.45 0.0 C1.7 0.0 1.85 -0.5 1.88 -1.0', t: 'Je redescends, je tourne et je remonte encore.' },
        { d: 'M1.88 -1.0 C1.8 -1.06 1.71 -0.95 1.81 -0.88 C1.98 -0.8 2.2 -0.85 2.4 -0.95', t: 'Je fais un petit nœud et j\'attache en haut.' }
    ]},
    x: { w: 1.6, cat: 'p', steps: [
        { d: 'M0.02 -0.45 C0.06 -0.72 0.22 -0.98 0.42 -0.98 C0.68 -0.98 0.75 -0.7 0.75 -0.5', t: 'Je pars entre la ligne et la 1re ligne, je fais un petit crochet et je tourne vers la droite.' },
        { d: 'M0.75 -0.5 C0.75 -0.2 0.88 0.0 1.1 0.0 C1.3 0.0 1.45 -0.15 1.6 -0.3', t: 'Je redescends en arrondi et j\'attache.' },
        { d: 'M1.15 -0.92 C0.92 -0.88 0.75 -0.72 0.75 -0.5 C0.75 -0.25 0.6 -0.02 0.38 0.0', t: 'Je lève le crayon et je fais un arrondi qui croise le premier trait.', lift: true }
    ]},
    y: { w: 2.15, cat: 'b', steps: [
        { d: 'M0 0 C0.35 -0.05 0.65 -0.55 0.78 -1', t: 'Je monte en biais jusqu\'à la 1re ligne.' },
        { d: 'M0.78 -1 C0.72 -0.55 0.7 -0.05 1.02 -0.02 C1.32 0 1.45 -0.6 1.5 -1', t: 'Je redescends, je tourne et je remonte jusqu\'à la 1re ligne.' },
        { d: 'M1.5 -1 C1.48 0 1.45 1.08 1.43 1.63', t: 'Je descends tout droit sous la ligne.' },
        { d: 'M1.43 1.63 C1.41 2.02 0.95 2.11 0.85 1.86 C0.75 1.6 1.15 0.88 1.45 0.41 C1.6 0.17 1.85 -0.15 2.15 -0.35', t: 'Je fais une boucle vers la gauche et je remonte pour attacher.' }
    ]},
    z: { w: 1.2, cat: 'b', steps: [
        { d: 'M0 -0.64 C0.03 -0.75 0.06 -0.9 0.09 -1.0', t: 'Je pars entre la ligne et la 1re ligne et je monte jusqu\'à la 1re ligne.' },
        { d: 'M0.09 -1.0 L0.7 -1.0 C0.78 -1.0 0.81 -0.94 0.81 -0.85 C0.81 -0.72 0.78 -0.64 0.74 -0.58', t: 'Je trace le haut tout droit sur la 1re ligne et je tourne.' },
        { d: 'M0.74 -0.58 L0.3 0.02', t: 'Je descends en biais vers la gauche jusqu\'à la ligne.' },
        { d: 'M0.3 0.02 L0.6 0.03 C0.72 0.04 0.82 0.12 0.87 0.31 C0.92 0.52 0.93 0.9 0.92 1.39 C0.91 1.74 0.8 2 0.57 2', t: 'Je repars vers la droite et je descends tout droit sous la ligne.' },
        { d: 'M0.57 2 C0.3 2 0.2 1.74 0.22 1.39 C0.24 0.97 0.45 0.62 0.7 0.4 C0.85 0.28 1.0 0.15 1.16 0.07', t: 'Je remonte en arrondi, je croise le trait et j\'attache.' }
    ]}
};

const LC_CATS = {
    p:  { nom: 'Petites lettres',          c: '#2563eb', l: '#dbeafe' },
    h:  { nom: 'Lettres qui montent',      c: '#16a34a', l: '#dcfce7' },
    b:  { nom: 'Lettres qui descendent',   c: '#dc2626', l: '#fee2e2' },
    hb: { nom: 'Monte et descend',         c: '#9333ea', l: '#f3e8ff' }
};
const LC_KEYS = Object.keys(LC_LETTRES);
const LC_SLANT = 0;                              // inclinaison en degrés (0 = écriture droite, sans italique)
const LC_SKEW = Math.tan(LC_SLANT * Math.PI / 180);
const LC_ZOOMS = {                               // marge visible autour de la lettre (en interlignes)
    grand:  { lbl: 'A', fs: 15, titre: 'Grand : la lettre remplit le cahier', pad: 0.75, minTop: -1.85, minBot: 0.95 },
    moyen:  { lbl: 'A', fs: 12, titre: 'Moyen', pad: 1.6, minTop: -2.6, minBot: 1.6 },
    cahier: { lbl: 'A', fs: 9,  titre: 'Cahier : toutes les lignes, de la 3e au-dessus à la 3e en dessous', full: true }
};
const LC_SPEEDS = { lent: 1.1, normal: 2.0, rapide: 3.6 };   // interlignes par seconde
const LC_AIDES = {
    repasser:   { lbl: 'Repasser',          titre: 'Les lettres sont dessinées en gris : on repasse dessus' },
    pointilles: { lbl: 'Pointillés',        titre: 'Les lettres sont en pointillés' },
    depart:     { lbl: 'Point de départ',   titre: 'Seul le point de départ est indiqué' },
    seul:       { lbl: 'Sans aide',         titre: 'Aucune aide : seulement le modèle au début de la ligne' }
};
const LC_INKS = ['#1d4ed8', '#111827', '#15803d', '#dc2626'];
const LC_NS = 'http://www.w3.org/2000/svg';

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('lc-style')) return;
    const s = document.createElement('style');
    s.id = 'lc-style';
    s.textContent = `
        .widget[data-type="lettres-cursives"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .lc-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 9px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            -webkit-user-select: none;
            overflow: hidden;
        }

        .lc-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: move; }
        .lc-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .lc-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #e0e7ff; color: #3730a3; }

        .lc-container.wf-minimized > *:not(.lc-header) { display: none !important; }
        .lc-container.wf-minimized { gap: 0; }
        .lc-container.wf-fullboard {
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
            .lc-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        .lc-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .lc-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s, box-shadow .15s;
        }
        .lc-btn:active { transform: scale(0.96); }
        .lc-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .lc-btn-blue  { background: #4a90e2; color: #fff; }
        .lc-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .lc-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .lc-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .lc-btn-green { background: #28a745; color: #fff; }
        .lc-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .lc-btn.on    { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }

        /* Onglets */
        .lc-tabs { display: flex; gap: 4px; background: #f3f4f6; border-radius: 10px; padding: 3px; }
        .lc-tab {
            padding: 6px 14px; border-radius: 8px; border: none; background: transparent;
            font-size: 13px; font-weight: 800; color: #6b7280; cursor: pointer;
        }
        .lc-tab.active { background: #fff; color: #1e3a8a; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        /* Choix de la lettre */
        .lc-letters { display: flex; gap: 3px; flex-wrap: wrap; align-items: center; flex: 1; min-width: 0; }
        .lc-lt {
            min-width: 30px; height: 34px; padding: 0 4px; border-radius: 7px;
            border: 1px solid #e5e7eb; border-bottom: 3px solid var(--cc);
            background: #fff; cursor: pointer; position: relative;
            font-family: 'BelleAllureGS', 'MDI', 'Segoe Script', cursive; font-size: 20px; line-height: 1;
            color: #1f2937; display: flex; align-items: center; justify-content: center;
        }
        .lc-lt:hover { background: var(--cl); }
        .lc-lt.active { background: var(--cl); border-color: var(--cc); box-shadow: 0 0 0 2px var(--cc); }
        .lc-lt .lc-lt-star { position: absolute; top: -6px; right: -5px; font-size: 10px; line-height: 1; font-family: sans-serif; }

        .lc-tools {
            display: flex; gap: 5px; flex-wrap: wrap; align-items: center;
            padding: 6px; background: #fafafa; border: 1px solid #eee; border-radius: 10px;
        }
        .lc-sep { width: 1px; height: 22px; background: #ddd; margin: 0 3px; }
        .lc-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .lc-seg { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .lc-seg button {
            padding: 5px 9px; border: none; background: #f5f5f5; font-size: 11px; font-weight: 700;
            color: #555; cursor: pointer; border-right: 1px solid #ddd;
        }
        .lc-seg button:last-child { border-right: none; }
        .lc-seg button.active { background: #e0e7ff; color: #3730a3; }
        .lc-ink {
            width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
            box-shadow: 0 0 0 1px #ccc; padding: 0;
        }
        .lc-ink.active { box-shadow: 0 0 0 2px #111827; }

        /* Scène */
        .lc-stage {
            position: relative; flex-shrink: 0; box-sizing: border-box;
            background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;
        }
        .lc-stage svg { display: block; width: 100%; height: 100%; touch-action: none; }
        .lc-stage.lc-draw svg { cursor: crosshair; }
        .lc-script {
            position: absolute; top: 8px; right: 10px; pointer-events: none;
            display: flex; align-items: baseline; gap: 10px;
            background: rgba(255,255,255,.88); border-radius: 10px; padding: 2px 10px;
            border: 1px solid #e5e7eb;
        }
        .lc-script .s1 { font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 800; font-size: 28px; color: #374151; }
        .lc-script .s2 { font-family: 'BelleAllureGS', 'MDI', 'Segoe Script', cursive; font-size: 30px; color: #1e3a8a; }
        .lc-script .s3 { font-size: 11px; color: #6b7280; font-weight: 700; }

        /* Consigne / commentaire */
        .lc-info {
            padding: 8px 12px; border-radius: 10px; font-size: 17px; line-height: 1.4; min-height: 26px;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
            display: flex; align-items: center; gap: 10px;
        }
        .lc-info.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .lc-info.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .lc-info .lc-num {
            flex-shrink: 0; min-width: 28px; height: 28px; border-radius: 14px; background: #f97316; color: #fff;
            font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; padding: 0 6px;
        }
        .lc-info .lc-txt { flex: 1; }
        .lc-say {
            flex-shrink: 0; border: 1px solid #ddd; background: #fff; border-radius: 8px; cursor: pointer;
            font-size: 15px; padding: 2px 7px;
        }
        .lc-say:hover { background: #f0f0f0; }
        .lc-container.wf-fullboard .lc-info { font-size: 22px; }
        .lc-container.wf-fullboard .lc-lt { min-width: 38px; height: 42px; font-size: 26px; }

        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .lc-container .lc-letters {
                order: 5; flex: 1 1 100%; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
                padding: 7px 2px 3px; scrollbar-width: thin; -webkit-overflow-scrolling: touch;
            }
            .lc-container .lc-lt, .lc-container.wf-fullboard .lc-lt { flex-shrink: 0; min-width: 34px; height: 36px; font-size: 22px; }
            .lc-container .lc-tabs { flex: 1; }
            .lc-container .lc-tab { flex: 1; padding: 6px 8px; }
            .lc-container .lc-tools { gap: 4px; padding: 4px; }
            .lc-container .lc-btn { padding: 4px 8px; }
            .lc-container .lc-sep { display: none; }
            .lc-container .lc-legend { display: none; }
            .lc-container .lc-info, .lc-container.wf-fullboard .lc-info { font-size: 15px; padding: 6px 10px; }
            .lc-container .lc-script { display: none !important; }
        }
        .lc-legend { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: #4b5563; align-items: center; }
        .lc-legend span { display: inline-flex; align-items: center; gap: 4px; }
        .lc-legend i { width: 12px; height: 4px; border-radius: 2px; display: inline-block; }

        /* Aide */
        .lc-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lc-help-btn:hover { background: #e0e0e0; color: #333; }
        .lc-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .lc-help-popup.show { display: block; }
        .lc-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .lc-help-popup p { margin: 0 0 6px; }
        .lc-help-popup p:last-child { margin-bottom: 0; }

        .lc-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .lc-container:hover .lc-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Outils ────────────────────────────────────────────────────────────────
function _lcIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
function _lcEl(tag, attrs, parent) {
    const el = document.createElementNS(LC_NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(el);
    return el;
}
function _lcStart(d) {
    const m = d.match(/^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
}
// Point d'une lettre (repère droit) → repère de la scène (lettre penchée, décalée de ox)
function _lcTx(ox, x, y) { return [ox + x - LC_SKEW * y, y]; }

// Mesures des tracés (longueurs, points échantillonnés), calculées une fois par lettre
let _lcMeasureSvg = null;
const _lcGeomCache = {};
function _lcGeom(k) {
    if (_lcGeomCache[k]) return _lcGeomCache[k];
    if (!_lcMeasureSvg) {
        _lcMeasureSvg = document.createElementNS(LC_NS, 'svg');
        _lcMeasureSvg.setAttribute('width', '10');
        _lcMeasureSvg.setAttribute('height', '10');
        _lcMeasureSvg.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
        document.body.appendChild(_lcMeasureSvg);
    }
    const L = LC_LETTRES[k];
    const segs = L.steps.map(st => {
        const p = _lcEl('path', { d: st.d }, _lcMeasureSvg);
        let len = 0;
        try { len = p.getTotalLength(); } catch (e) {}
        const pts = [];
        const n = Math.max(2, Math.ceil(len / 0.06));
        for (let i = 0; i <= n; i++) {
            try { const q = p.getPointAtLength(len * i / n); pts.push([q.x, q.y]); } catch (e) {}
        }
        p.remove();
        return { len: Math.max(len, 0.02), pts, lift: !!st.lift, start: _lcStart(st.d) };
    });
    // Regroupe les étapes en « traits » (sans lever le crayon)
    const strokes = [];
    segs.forEach((sg, i) => {
        if (i === 0 || sg.lift) strokes.push({ segs: [], start: sg.start });
        strokes[strokes.length - 1].segs.push(i);
    });
    strokes.forEach(st => {
        st.pts = [];
        st.segs.forEach(i => { st.pts = st.pts.concat(segs[i].pts); });
        st.end = st.pts[st.pts.length - 1] || st.start;
    });
    let minY = 0, maxY = 0;
    segs.forEach(sg => sg.pts.forEach(p => { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }));
    return (_lcGeomCache[k] = { segs, strokes, minY, maxY });
}

// Parole (synthèse vocale du navigateur)
function _lcSpeak(text, onEnd) {
    const done = () => { if (onEnd) { const f = onEnd; onEnd = null; f(); } };
    try {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { done(); return; }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/1re/g, 'première').replace(/2e/g, 'deuxième').replace(/3e/g, 'troisième'));
        u.lang = 'fr-FR';
        u.rate = 0.9;
        const v = (window.speechSynthesis.getVoices() || []).find(x => /^fr/i.test(x.lang));
        if (v) u.voice = v;
        u.onend = done;
        u.onerror = done;
        window.speechSynthesis.speak(u);
        setTimeout(done, 1500 + text.length * 110);   // sécurité si onend ne vient pas
    } catch (e) { done(); }
}
function _lcStopSpeak() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }

// ── Création du widget ────────────────────────────────────────────────────
function createLettresCursivesWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'lettres-cursives';
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
    container.className = 'lc-container';
    const initW = Math.round(window.innerWidth * 0.75);
    const initH = Math.round(initW * 9 / 16);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'lc-header';
    header.innerHTML = `
        <span class="lc-title">✍️ Lettres cursives</span>
        <span class="lc-badge">Observer</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.lc-badge');
    container.appendChild(header);

    // ── Onglets + choix de la lettre ──────────────────────────────────────
    const topRow = document.createElement('div');
    topRow.className = 'lc-row';
    topRow.innerHTML = `
        <div class="lc-tabs">
            <button class="lc-tab" data-tab="observe" title="Voir comment la lettre se trace">👀 Observer</button>
            <button class="lc-tab" data-tab="practice" title="Écrire la lettre au stylet ou au doigt">✏️ S'entraîner</button>
        </div>
        <button class="lc-btn lc-btn-grey" data-act="prev" title="Lettre précédente">◀</button>
        <div class="lc-letters">
            ${LC_KEYS.map(k => `<button class="lc-lt" data-letter="${k}" title="${LC_CATS[LC_LETTRES[k].cat].nom}" style="--cc:${LC_CATS[LC_LETTRES[k].cat].c};--cl:${LC_CATS[LC_LETTRES[k].cat].l}">${k}<span class="lc-lt-star"></span></button>`).join('')}
        </div>
        <button class="lc-btn lc-btn-grey" data-act="next" title="Lettre suivante">▶</button>
    `;
    container.appendChild(topRow);

    // ── Barre « Observer » ────────────────────────────────────────────────
    const obsTools = document.createElement('div');
    obsTools.className = 'lc-tools';
    obsTools.innerHTML = `
        <button class="lc-btn lc-btn-green" data-act="play" title="Tracer toute la lettre">▶ Tracer</button>
        <button class="lc-btn lc-btn-blue" data-act="step" title="Tracer l'étape suivante seulement">⏭ Étape suivante</button>
        <button class="lc-btn lc-btn-grey" data-act="restart" title="Effacer et revenir au point de départ">⟲ Recommencer</button>
        <span class="lc-sep"></span>
        <span class="lc-lbl">Vitesse</span>
        <div class="lc-seg" data-group="speed">
            <button data-speed="lent" title="Lent">🐢</button>
            <button data-speed="normal" title="Normal">🚶</button>
            <button data-speed="rapide" title="Rapide">🐇</button>
        </div>
        <span class="lc-sep"></span>
        <button class="lc-btn lc-btn-grey" data-act="toggle-voice" title="Lire chaque étape à voix haute pendant le tracé">🔊 Voix</button>
        <button class="lc-btn lc-btn-grey" data-act="toggle-arrows" title="Afficher ou masquer les flèches de sens">➜ Flèches</button>
        <button class="lc-btn lc-btn-grey" data-act="toggle-nums" title="Numéroter les lignes du cahier">🔢 Lignes</button>
        <span class="lc-sep"></span>
        <span class="lc-lbl">Taille</span>
        <div class="lc-seg" data-group="zoom">
            ${Object.keys(LC_ZOOMS).map(k => `<button data-zoom="${k}" title="${LC_ZOOMS[k].titre}" style="font-size:${LC_ZOOMS[k].fs}px;padding-top:2px;padding-bottom:2px;min-width:28px">${LC_ZOOMS[k].lbl}</button>`).join('')}
        </div>
    `;
    container.appendChild(obsTools);

    // ── Barre « S'entraîner » ─────────────────────────────────────────────
    const prTools = document.createElement('div');
    prTools.className = 'lc-tools';
    prTools.innerHTML = `
        <span class="lc-lbl">Aide</span>
        <div class="lc-seg" data-group="aide">
            ${Object.keys(LC_AIDES).map(k => `<button data-aide="${k}" title="${LC_AIDES[k].titre}">${LC_AIDES[k].lbl}</button>`).join('')}
        </div>
        <span class="lc-sep"></span>
        ${LC_INKS.map((c, i) => `<button class="lc-ink" data-ink="${i}" style="background:${c}" title="Couleur du crayon"></button>`).join('')}
        <span class="lc-sep"></span>
        <button class="lc-btn lc-btn-grey" data-act="undo-ink" title="Effacer le dernier trait">↩ Dernier trait</button>
        <button class="lc-btn lc-btn-grey" data-act="clear-ink" title="Effacer toute la ligne">🧽 Tout effacer</button>
        <button class="lc-btn lc-btn-green" data-act="check" title="Comparer l'écriture avec le modèle">⭐ Vérifier</button>
        <button class="lc-btn lc-btn-grey" data-act="toggle-nums" title="Numéroter les lignes du cahier">🔢 Lignes</button>
        <span class="lc-sep"></span>
        <span class="lc-lbl">Taille</span>
        <div class="lc-seg" data-group="zoom">
            ${Object.keys(LC_ZOOMS).map(k => `<button data-zoom="${k}" title="${LC_ZOOMS[k].titre}" style="font-size:${LC_ZOOMS[k].fs}px;padding-top:2px;padding-bottom:2px;min-width:28px">${LC_ZOOMS[k].lbl}</button>`).join('')}
        </div>
    `;
    container.appendChild(prTools);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'lc-stage';
    stage.style.height = Math.round(initH * 0.62) + 'px';
    const svg = document.createElementNS(LC_NS, 'svg');
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    stage.appendChild(svg);
    const scriptBox = document.createElement('div');
    scriptBox.className = 'lc-script';
    stage.appendChild(scriptBox);
    container.appendChild(stage);

    // ── Consigne / commentaire ────────────────────────────────────────────
    const info = document.createElement('div');
    info.className = 'lc-info';
    container.appendChild(info);

    const legend = document.createElement('div');
    legend.className = 'lc-legend';
    legend.innerHTML = Object.keys(LC_CATS).map(k => `<span><i style="background:${LC_CATS[k].c}"></i>${LC_CATS[k].nom}</span>`).join('') +
        `<span style="margin-left:auto">● point de départ &nbsp; ➜ sens du tracé</span>`;
    container.appendChild(legend);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'lc-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'lc-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Lettres cursives</h4>
        <p>Choisissez une lettre. La couleur sous chaque lettre indique sa famille : <b>petites lettres</b> (1 interligne),
        <b>lettres qui montent</b> (jusqu'à la 2e ou la 3e ligne), <b>lettres qui descendent</b> de 2 interlignes sous la ligne.</p>
        <p><b>👀 Observer</b> : <b>▶ Tracer</b> dessine toute la lettre ; <b>⏭ Étape suivante</b> la dessine morceau par morceau
        avec la consigne (« Je monte en biais… »). Le <b>point vert numéroté</b> montre où poser le crayon, les <b>flèches</b> le sens.
        <b>🔊 Voix</b> lit chaque étape (ou cliquez sur 🔊 à côté de la consigne). <b>🔢 Lignes</b> numérote les lignes du cahier.</p>
        <p><b>✏️ S'entraîner</b> : l'élève écrit au stylet, au doigt ou à la souris. La première lettre est le modèle ; les suivantes
        sont à <b>repasser</b>, en <b>pointillés</b>, avec le <b>point de départ</b> seul ou <b>sans aide</b>.
        Si un stylet est utilisé, les appuis du doigt sont ignorés.</p>
        <p><b>⭐ Vérifier</b> compare chaque lettre écrite au modèle : 1 à 3 étoiles, avec un conseil sur le point de départ et le sens.
        La meilleure note de chaque lettre s'affiche sur le bouton de la lettre.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'lc-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let letter = 'a';
    let tab = 'observe';
    let speed = 'normal';
    let voice = false;
    let showArrows = true;
    let showNums = true;
    let zoomObs = 'grand', zoomPr = 'moyen';   // taille du cahier dans chaque onglet
    let aide = 'repasser';
    let inkIdx = 0;
    let inkByLetter = {};          // { a: [ {c, pts:[[x,y]…]} … ] }
    let stars = {};                // meilleure note par lettre
    let checkRes = null;           // résultat de « Vérifier » (lettre courante)
    // Animation (Observer)
    let done = -1;                 // nombre d'étapes entièrement tracées (−1 = lettre complète affichée au repos)
    let partial = 0;               // avancement de l'étape en cours (0..1)
    let playing = false;
    let animToken = 0;
    let curStepTxt = null;         // { n, t }
    // Rendu
    let VW = 12, VT = -3.8, VH = 7.6;
    let els = null;                // références des éléments SVG de la scène

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    function L() { return LC_LETTRES[letter]; }
    function nSteps() { return L().steps.length; }
    function ink() { return inkByLetter[letter] || (inkByLetter[letter] = []); }

    // ── Rendu de la scène ─────────────────────────────────────────────────
    function computeViewBox() {
        const cw = stage.clientWidth || 600, ch = stage.clientHeight || 300;
        const z = LC_ZOOMS[tab === 'observe' ? zoomObs : zoomPr], geo = _lcGeom(letter);
        let top = -3.8, bot = 3.8;
        if (!z.full) {
            top = Math.max(-3.8, Math.min(z.minTop, geo.minY - z.pad));
            bot = Math.min(3.8, Math.max(z.minBot, geo.maxY + z.pad));
        }
        VT = top; VH = bot - top;
        VW = Math.max(4, VH * cw / ch);
        svg.setAttribute('viewBox', `0 ${VT} ${VW} ${VH}`);
    }

    function drawSeyes(g) {
        for (let y = -4; y <= 4; y++) {
            const heavy = (y % 4 === 0);
            _lcEl('line', {
                x1: 0, x2: VW, y1: y, y2: y,
                stroke: heavy ? '#7b8ae0' : '#c3cbf2',
                'stroke-width': heavy ? 0.045 : 0.025
            }, g);
        }
        for (let x = 4; x < VW; x += 4) {
            _lcEl('line', { x1: x, x2: x, y1: -4, y2: 4, stroke: '#f2b8c6', 'stroke-width': 0.025 }, g);
        }
        if (showNums) {
            for (let y = 1; y <= 3; y++) {
                [[-y, '#4f5bb5'], [y, '#a3abd9']].forEach(([yy, col]) => {
                    const t = _lcEl('text', {
                        x: 0.12, y: yy - 0.16, 'font-size': Math.max(0.3, VH * 0.055), fill: col,
                        'font-family': 'Nunito, Segoe UI, sans-serif', 'font-weight': 800
                    }, g);
                    t.textContent = y;
                });
            }
            const b = _lcEl('path', { d: 'M0.1 -0.16 L0.34 0 L0.1 0.16 Z', fill: '#4f5bb5' }, g);
            b.setAttribute('opacity', '0.8');
        }
    }

    // Flèche de sens au milieu d'un tracé (repère de la lettre)
    function arrowAt(pathEl, len, g, color, size) {
        const at = len * 0.55, e = Math.min(0.04, len * 0.05);
        let p0, p1, pm;
        try {
            pm = pathEl.getPointAtLength(at);
            p0 = pathEl.getPointAtLength(Math.max(0, at - e));
            p1 = pathEl.getPointAtLength(Math.min(len, at + e));
        } catch (er) { return; }
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
        const s = size || 0.17;
        _lcEl('path', {
            d: `M${s} 0 L${-s * 0.8} ${-s * 0.75} L${-s * 0.35} 0 L${-s * 0.8} ${s * 0.75} Z`,
            fill: color, transform: `translate(${pm.x} ${pm.y}) rotate(${ang})`
        }, g);
    }

    function startDot(g, x, y, n, r) {
        r = r || 0.17;
        _lcEl('circle', { cx: x, cy: y, r, fill: '#16a34a', stroke: '#fff', 'stroke-width': 0.035 }, g);
        const t = _lcEl('text', {
            x, y: y + r * 0.42, 'font-size': r * 1.25, fill: '#fff', 'text-anchor': 'middle',
            'font-family': 'Nunito, Segoe UI, sans-serif', 'font-weight': 900
        }, g);
        t.textContent = n;
    }

    // Lettre dans un groupe penché ; style : 'model' | 'ghost' | 'dotted' | 'none'
    function letterGroup(parent, ox, style, opts) {
        opts = opts || {};
        const g = _lcEl('g', { transform: `translate(${ox} 0) skewX(${-LC_SLANT})` }, parent);
        const paths = [];
        if (style !== 'none') {
            L().steps.forEach(st => {
                const a = {
                    d: st.d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
                };
                if (style === 'model')  Object.assign(a, { stroke: '#1e3a8a', 'stroke-width': 0.13 });
                if (style === 'ghost')  Object.assign(a, { stroke: '#d5dbe6', 'stroke-width': 0.3 });
                if (style === 'dotted') Object.assign(a, { stroke: '#94a3b8', 'stroke-width': 0.09, 'stroke-dasharray': '0.01 0.16' });
                paths.push(_lcEl('path', a, g));
            });
        }
        if (opts.arrows) {
            const ga = _lcEl('g', {}, g);
            const geo = _lcGeom(letter);
            L().steps.forEach((st, i) => {
                const p = paths[i] || _lcEl('path', { d: st.d, fill: 'none', stroke: 'none' }, g);
                if (geo.segs[i].len > 0.3) arrowAt(p, geo.segs[i].len, ga, opts.arrowColor || '#f97316', opts.arrowSize);
            });
        }
        if (opts.dots) {
            _lcGeom(letter).strokes.forEach((st, i) => startDot(g, st.start[0], st.start[1], i + 1, opts.dotR));
        }
        return { g, paths };
    }

    function renderStage() {
        computeViewBox();
        svg.innerHTML = '';
        stage.classList.toggle('lc-draw', tab === 'practice');
        drawSeyes(_lcEl('g', {}, svg));
        if (tab === 'observe') renderObserve(); else renderPractice();
    }

    // ── Observer ──────────────────────────────────────────────────────────
    function observeOx() { return (VW - L().w) / 2; }

    function renderObserve() {
        const ox = observeOx();
        const geo = _lcGeom(letter);
        letterGroup(svg, ox, 'ghost');
        const anim = _lcEl('g', { transform: `translate(${ox} 0) skewX(${-LC_SLANT})` }, svg);
        const segEls = L().steps.map((st, i) => _lcEl('path', {
            d: st.d, fill: 'none', stroke: '#1e3a8a', 'stroke-width': 0.14,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round',
            'stroke-dasharray': `${geo.segs[i].len + 0.01} ${geo.segs[i].len + 1}`,
            'stroke-dashoffset': geo.segs[i].len + 0.01
        }, anim));
        const deco = letterGroup(svg, ox, 'none', { arrows: showArrows, dots: true, dotR: 0.2, arrowSize: 0.19 });
        const pen = _lcEl('g', { transform: `translate(${ox} 0) skewX(${-LC_SLANT})` }, svg);
        const tip = _lcEl('circle', { r: 0.11, fill: '#ef4444', stroke: '#fff', 'stroke-width': 0.03, opacity: 0 }, pen);
        els = { segEls, tip, deco };
        applyProgress();
        scriptBox.style.display = '';
        scriptBox.innerHTML = `<span class="s1">${letter}</span><span class="s2">${letter}</span><span class="s3">${LC_CATS[L().cat].nom.toLowerCase()}</span>`;
    }

    function applyProgress() {
        if (!els || tab !== 'observe') return;
        const geo = _lcGeom(letter);
        const full = done < 0;
        els.segEls.forEach((p, i) => {
            const len = geo.segs[i].len + 0.01;
            let f = full || i < done ? 1 : (i === done ? partial : 0);
            p.setAttribute('stroke-dashoffset', String(len * (1 - f)));
        });
        if (!full && playing && done < nSteps()) {
            const p = els.segEls[done];
            try {
                const q = p.getPointAtLength(geo.segs[done].len * partial);
                els.tip.setAttribute('cx', q.x);
                els.tip.setAttribute('cy', q.y);
                els.tip.setAttribute('opacity', 1);
            } catch (e) {}
        } else {
            els.tip.setAttribute('opacity', 0);
        }
    }

    function stopAnim() {
        animToken++;
        playing = false;
        _lcStopSpeak();
    }

    function animateStep(i, token) {
        return new Promise(resolve => {
            const len = _lcGeom(letter).segs[i].len;
            const dur = Math.max(350, len / LC_SPEEDS[speed] * 1000);
            let voiceDone = !voice, drawDone = false;
            const finish = () => { if (voiceDone && drawDone) resolve(); };
            showStepInfo(i);
            if (voice) _lcSpeak(L().steps[i].t, () => { voiceDone = true; finish(); });
            const t0 = performance.now();
            done = i; partial = 0;
            const tick = (now) => {
                if (token !== animToken) { resolve(); return; }
                partial = Math.min(1, (now - t0) / dur);
                applyProgress();
                if (partial < 1) requestAnimationFrame(tick);
                else { done = i + 1; partial = 0; drawDone = true; applyProgress(); finish(); }
            };
            requestAnimationFrame(tick);
        });
    }
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function play(onlyOne) {
        if (tab !== 'observe') return;
        if (playing) {           // un clic sur ▶ pendant le tracé : pause
            stopAnim();
            renderObserveToolbar();
            applyProgress();
            return;
        }
        if (done < 0 || done >= nSteps()) { done = 0; partial = 0; }
        stopAnim();
        const token = animToken;
        playing = true;
        renderObserveToolbar();
        let first = true;
        while (token === animToken && done < nSteps()) {
            if (!first && L().steps[done].lift) { applyProgress(); await wait(450); }
            if (token !== animToken) break;
            await animateStep(done, token);
            first = false;
            if (onlyOne) break;
            if (token === animToken && done < nSteps()) await wait(voice ? 150 : 120);
        }
        if (token === animToken) {
            playing = false;
            if (done >= nSteps() && !onlyOne) showDoneInfo();
            else if (done >= nSteps()) showDoneInfo(true);
            applyProgress();
            renderObserveToolbar();
            save();
        }
    }
    function restart() {
        stopAnim();
        done = 0; partial = 0;
        curStepTxt = null;
        applyProgress();
        showStartInfo();
        renderObserveToolbar();
        save();
    }

    function renderObserveToolbar() {
        const playBtn = obsTools.querySelector('[data-act="play"]');
        playBtn.textContent = playing ? '⏸ Pause' : (done >= 0 && done < nSteps() && done > 0 ? '▶ Continuer' : '▶ Tracer');
        obsTools.querySelector('[data-act="step"]').disabled = playing;
        obsTools.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', b.dataset.speed === speed));
        obsTools.querySelector('[data-act="toggle-voice"]').classList.toggle('on', voice);
        obsTools.querySelector('[data-act="toggle-arrows"]').classList.toggle('on', showArrows);
    }

    // ── Consigne ──────────────────────────────────────────────────────────
    function setInfo(cls, num, html, sayText) {
        info.className = 'lc-info' + (cls ? ' ' + cls : '');
        info.innerHTML = (num ? `<span class="lc-num">${num}</span>` : '') + `<span class="lc-txt">${html}</span>` +
            (sayText ? `<button class="lc-say" data-say="1" title="Lire à voix haute">🔊</button>` : '');
        info._say = sayText || null;
    }
    function showStepInfo(i) {
        curStepTxt = { n: i };
        const st = L().steps[i];
        setInfo('', `${i + 1}/${nSteps()}`, st.t, st.t);
    }
    function showStartInfo() {
        const st = L().steps[0];
        const p = _lcStart(st.d);
        const where = p[1] >= -0.05 ? 'sur la ligne d\'écriture'
            : (p[1] > -0.7 ? 'entre la ligne d\'écriture et la 1re ligne' : 'juste sous la 1re ligne');
        const t = `Je pose mon crayon sur le point vert ①, ${where}.`;
        setInfo('', '', `${t} Clique sur <b>▶ Tracer</b> ou <b>⏭ Étape suivante</b>.`, t);
    }
    function showDoneInfo(stepMode) {
        curStepTxt = null;
        const nb = _lcGeom(letter).strokes.length;
        const t = nb > 1
            ? `La lettre « ${letter} » est finie : ${nb} traits, je lève le crayon ${nb - 1} fois.`
            : `La lettre « ${letter} » est finie : je l'écris sans lever le crayon.`;
        setInfo('ok', '✓', t + (stepMode ? '' : ' À toi de l\'écrire dans <b>✏️ S\'entraîner</b> !'), t);
    }
    function showIntroInfo() {
        const t = `Regarde comment on écrit la lettre « ${letter} ».`;
        setInfo('', '', `👀 ${t} Clique sur <b>▶ Tracer</b> ou sur <b>⏭ Étape suivante</b>.`, t);
    }
    function showPracticeInfo() {
        if (checkRes) { setInfo(checkRes.cls, '', checkRes.html, checkRes.say); return; }
        const t = 'Écris la lettre sur chaque modèle, en partant du point vert.';
        setInfo('', '', `✏️ ${t} Puis clique sur <b>⭐ Vérifier</b>.`, t);
    }

    // ── S'entraîner ───────────────────────────────────────────────────────
    function practiceLayout() {
        const adv = L().w + 1.05;
        const x0 = 1.0;
        const n = Math.max(1, Math.floor((VW - x0 - L().w - 0.5) / adv) + 1);
        const ox = [];
        for (let k = 0; k < n; k++) ox.push(x0 + k * adv);
        return { adv, ox };
    }

    function renderPractice() {
        els = null;
        scriptBox.style.display = 'none';
        const lay = practiceLayout();
        lay.ox.forEach((ox, k) => {
            if (k === 0) { letterGroup(svg, ox, 'model', { arrows: true, dots: true, dotR: 0.15, arrowSize: 0.15 }); return; }
            const style = aide === 'repasser' ? 'ghost' : (aide === 'pointilles' ? 'dotted' : 'none');
            letterGroup(svg, ox, style, { dots: aide !== 'seul', dotR: 0.13 });
        });
        // Étoiles de « Vérifier »
        if (checkRes && checkRes.per) {
            checkRes.per.forEach(r => {
                if (r.k >= lay.ox.length || r.stars == null) return;
                const t = _lcEl('text', {
                    x: lay.ox[r.k] + L().w / 2 + 0.3, y: VT + VH * 0.09, 'font-size': VH * 0.075, 'text-anchor': 'middle',
                    'font-family': 'Segoe UI Emoji, Apple Color Emoji, sans-serif'
                }, svg);
                t.textContent = '★★★'.slice(0, r.stars) + '☆☆☆'.slice(0, 3 - r.stars);
                t.setAttribute('fill', r.stars >= 2 ? '#f59e0b' : '#9ca3af');
            });
        }
        const gi = _lcEl('g', {}, svg);
        ink().forEach(s => drawInkStroke(gi, s));
        els = { inkG: gi };
    }

    function inkPathD(pts) {
        if (!pts.length) return '';
        if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]} l0.001 0`;
        let d = `M${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
            d += ` Q${pts[i][0]} ${pts[i][1]} ${mx.toFixed(3)} ${my.toFixed(3)}`;
        }
        const l = pts[pts.length - 1];
        d += ` L${l[0]} ${l[1]}`;
        return d;
    }
    function drawInkStroke(g, s) {
        const p = _lcEl('path', {
            d: inkPathD(s.pts), fill: 'none', stroke: s.c || LC_INKS[0], 'stroke-width': 0.15,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, g);
        return p;
    }

    // Dessin au stylet / doigt / souris
    let cur = null, penSeen = false;
    function svgPt(e) {
        const m = svg.getScreenCTM();
        if (!m) return null;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const q = pt.matrixTransform(m.inverse());
        return [Math.round(q.x * 1000) / 1000, Math.round(q.y * 1000) / 1000];
    }
    svg.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (tab !== 'practice' || cur) return;
        if (e.pointerType === 'pen') penSeen = true;
        else if (e.pointerType === 'touch' && penSeen) return;   // la main posée sur l'écran
        if (e.button > 0) return;
        e.preventDefault();
        const p = svgPt(e);
        if (!p || !els || !els.inkG) return;
        try { svg.setPointerCapture(e.pointerId); } catch (er) {}
        cur = { pid: e.pointerId, s: { c: LC_INKS[inkIdx], pts: [p] } };
        cur.el = drawInkStroke(els.inkG, cur.s);
    });
    svg.addEventListener('pointermove', (e) => {
        if (!cur || e.pointerId !== cur.pid) return;
        e.preventDefault();
        const evs = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
        evs.forEach(ev => {
            const p = svgPt(ev);
            if (!p) return;
            const l = cur.s.pts[cur.s.pts.length - 1];
            if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= 0.025) cur.s.pts.push(p);
        });
        cur.el.setAttribute('d', inkPathD(cur.s.pts));
    });
    function endStroke(e) {
        if (!cur || e.pointerId !== cur.pid) return;
        const s = cur.s;
        cur = null;
        ink().push(s);
        if (checkRes) { checkRes = null; renderStage(); showPracticeInfo(); }
        save();
    }
    svg.addEventListener('pointerup', endStroke);
    svg.addEventListener('pointercancel', endStroke);

    function undoInk() {
        if (!ink().length) return;
        ink().pop();
        checkRes = null;
        renderStage();
        showPracticeInfo();
        save();
    }
    function clearInk() {
        inkByLetter[letter] = [];
        checkRes = null;
        renderStage();
        showPracticeInfo();
        save();
    }

    // ── Vérifier ──────────────────────────────────────────────────────────
    function densify(pts) {
        const out = [];
        for (let i = 0; i < pts.length; i++) {
            if (i > 0) {
                const a = pts[i - 1], b = pts[i];
                const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
                const n = Math.floor(d / 0.07);
                for (let j = 1; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
            }
            out.push(pts[i]);
        }
        return out;
    }
    function minDist(p, arr) {
        let m = Infinity;
        for (let i = 0; i < arr.length; i++) {
            const dx = arr[i][0] - p[0], dy = arr[i][1] - p[1];
            const d = dx * dx + dy * dy;
            if (d < m) m = d;
        }
        return Math.sqrt(m);
    }
    function check() {
        const lay = practiceLayout();
        const geo = _lcGeom(letter);
        const strokesInk = ink().filter(s => s.pts.length);
        if (!strokesInk.length) {
            checkRes = { cls: 'warn', html: '✏️ Écris d\'abord la lettre sur les modèles, puis clique sur <b>⭐ Vérifier</b>.', say: 'Écris d\'abord la lettre sur les modèles.' };
            showPracticeInfo();
            return;
        }
        // Répartit les traits entre les modèles (selon le centre du trait)
        const groups = lay.ox.map(() => []);
        strokesInk.forEach(s => {
            const cx = s.pts.reduce((a, p) => a + p[0], 0) / s.pts.length;
            let best = 0, bd = Infinity;
            lay.ox.forEach((ox, k) => {
                const c = ox + L().w / 2 + 0.25;
                const d = Math.abs(cx - c);
                if (d < bd) { bd = d; best = k; }
            });
            if (bd < lay.adv * 0.75) groups[best].push(s);
        });
        const per = [];
        let badStart = 0, badDir = 0, tooBig = 0;
        groups.forEach((gs, k) => {
            if (!gs.length) return;
            const ox = lay.ox[k];
            const model = [];
            geo.segs.forEach(sg => sg.pts.forEach(p => model.push(_lcTx(ox, p[0], p[1]))));
            const inkPts = [];
            gs.forEach(s => densify(s.pts).forEach(p => inkPts.push(p)));
            const TOL = 0.22;
            const cov = model.filter(p => minDist(p, inkPts) <= TOL).length / model.length;
            const prec = inkPts.filter(p => minDist(p, model) <= TOL * 1.4).length / inkPts.length;
            const score = Math.min(cov, 0.65 * cov + 0.35 * prec) * (0.55 + 0.45 * prec);
            if (window._lcDebug) console.log('lc', k, cov.toFixed(2), prec.toFixed(2), score.toFixed(2));
            const st = score >= 0.85 ? 3 : score >= 0.65 ? 2 : score >= 0.4 ? 1 : 0;
            // Point de départ et sens du premier trait
            const s0 = gs[0].pts, mS = _lcTx(ox, geo.strokes[0].start[0], geo.strokes[0].start[1]);
            const mE = _lcTx(ox, geo.strokes[0].end[0], geo.strokes[0].end[1]);
            const a = s0[0], z = s0[s0.length - 1];
            const startOk = Math.hypot(a[0] - mS[0], a[1] - mS[1]) <= 0.55;
            const dirOk = Math.hypot(a[0] - mS[0], a[1] - mS[1]) + Math.hypot(z[0] - mE[0], z[1] - mE[1])
                       <= Math.hypot(a[0] - mE[0], a[1] - mE[1]) + Math.hypot(z[0] - mS[0], z[1] - mS[1]);
            if (!startOk) badStart++;
            if (!dirOk) badDir++;
            if (prec < 0.6 && cov > 0.6) tooBig++;
            per.push({ k, stars: st, score, startOk, dirOk });
        });
        if (!per.length) {
            checkRes = { cls: 'warn', html: '✏️ Écris la lettre bien sur les modèles.', say: 'Écris la lettre bien sur les modèles.' };
            showPracticeInfo();
            return;
        }
        const best = Math.max(...per.map(r => r.stars));
        const moy = per.reduce((a, r) => a + r.stars, 0) / per.length;
        stars[letter] = Math.max(stars[letter] || 0, best);
        let msg, cls;
        if (moy >= 2.5)      { msg = '🌟 Bravo ! Tes lettres sont très bien formées.'; cls = 'ok'; }
        else if (moy >= 1.5) { msg = '👍 C\'est bien ! Continue à suivre le modèle.'; cls = 'ok'; }
        else if (moy >= 0.7) { msg = '💪 Tu y es presque : suis bien les traits du modèle.'; cls = 'warn'; }
        else                 { msg = '🔁 Regarde encore le modèle dans 👀 Observer, puis réessaie.'; cls = 'warn'; }
        const tips = [];
        if (badDir) tips.push('Attention au <b>sens</b> : suis les flèches.');
        else if (badStart) tips.push('Pense à partir du <b>point vert</b>.');
        if (tooBig && !badDir) tips.push('Reste bien entre les lignes.');
        const html = msg + (tips.length ? ' ' + tips.join(' ') : '') + ` <span style="opacity:.7">(${per.length} lettre${per.length > 1 ? 's' : ''} vérifiée${per.length > 1 ? 's' : ''})</span>`;
        checkRes = { cls, html, say: html.replace(/<[^>]+>/g, '').replace(/\(.*\)/, ''), per };
        renderLetters();
        renderStage();
        showPracticeInfo();
        save();
    }

    // ── En-têtes / barres ─────────────────────────────────────────────────
    function renderLetters() {
        const strip = topRow.querySelector('.lc-letters');
        topRow.querySelectorAll('.lc-lt').forEach(b => {
            b.classList.toggle('active', b.dataset.letter === letter);
            if (b.dataset.letter === letter && strip.scrollWidth > strip.clientWidth + 2) {
                const l = b.offsetLeft - strip.offsetLeft, r = l + b.offsetWidth;
                if (l < strip.scrollLeft || r > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = l - strip.clientWidth / 2 + b.offsetWidth / 2;
            }
            const n = stars[b.dataset.letter] || 0;
            b.querySelector('.lc-lt-star').textContent = n >= 3 ? '⭐' : (n === 2 ? '★' : '');
            b.querySelector('.lc-lt-star').style.color = n === 2 ? '#f59e0b' : '';
        });
    }
    function renderBars() {
        topRow.querySelectorAll('.lc-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        badge.textContent = tab === 'observe' ? 'Observer' : 'S\'entraîner';
        obsTools.style.display = tab === 'observe' ? '' : 'none';
        prTools.style.display = tab === 'practice' ? '' : 'none';
        prTools.querySelectorAll('[data-aide]').forEach(b => b.classList.toggle('active', b.dataset.aide === aide));
        prTools.querySelectorAll('[data-ink]').forEach(b => b.classList.toggle('active', +b.dataset.ink === inkIdx));
        container.querySelectorAll('[data-act="toggle-nums"]').forEach(b => b.classList.toggle('on', showNums));
        obsTools.querySelectorAll('[data-zoom]').forEach(b => b.classList.toggle('active', b.dataset.zoom === zoomObs));
        prTools.querySelectorAll('[data-zoom]').forEach(b => b.classList.toggle('active', b.dataset.zoom === zoomPr));
        renderObserveToolbar();
        renderLetters();
    }
    function renderAll() {
        renderBars();
        renderStage();
        if (tab === 'practice') showPracticeInfo();
        else if (playing && curStepTxt) showStepInfo(curStepTxt.n);
        else if (done < 0) showIntroInfo();
        else if (done >= nSteps()) showDoneInfo(true);
        else if (done === 0) showStartInfo();
        else showStepInfo(done - 1);
    }

    function selectLetter(k) {
        if (!LC_LETTRES[k]) return;
        stopAnim();
        letter = k;
        checkRes = null;
        curStepTxt = null;
        if (tab === 'observe') { done = 0; partial = 0; }
        else done = -1;
        renderAll();
        if (tab === 'observe') { showStartInfo(); setTimeout(() => { if (letter === k && tab === 'observe' && done === 0 && !playing) play(); }, 350); }
        save();
    }
    function setTab(t) {
        if (t === tab) return;
        stopAnim();
        tab = t;
        if (tab === 'observe') { done = -1; partial = 0; }
        checkRes = null;
        renderAll();
        save();
    }

    // ── Boutons ───────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-tab],[data-letter],[data-speed],[data-aide],[data-ink],[data-say],[data-zoom]');
        if (!b || !container.contains(b)) return;
        e.stopPropagation();
        if (b.dataset.say) { if (info._say) _lcSpeak(info._say); return; }
        if (b.dataset.tab) { setTab(b.dataset.tab); return; }
        if (b.dataset.letter) { selectLetter(b.dataset.letter); return; }
        if (b.dataset.zoom) { if (tab === 'observe') zoomObs = b.dataset.zoom; else zoomPr = b.dataset.zoom; checkRes = null; renderBars(); renderStage(); if (tab === 'practice') showPracticeInfo(); save(); return; }
        if (b.dataset.speed) { speed = b.dataset.speed; renderObserveToolbar(); save(); return; }
        if (b.dataset.aide) { aide = b.dataset.aide; checkRes = null; renderBars(); renderStage(); showPracticeInfo(); save(); return; }
        if (b.dataset.ink !== undefined) { inkIdx = +b.dataset.ink; renderBars(); save(); return; }
        const i = LC_KEYS.indexOf(letter);
        switch (b.dataset.act) {
            case 'prev': selectLetter(LC_KEYS[(i - 1 + LC_KEYS.length) % LC_KEYS.length]); break;
            case 'next': selectLetter(LC_KEYS[(i + 1) % LC_KEYS.length]); break;
            case 'play': play(false); break;
            case 'step':
                if (done < 0 || done >= nSteps()) { done = 0; partial = 0; applyProgress(); }
                play(true);
                break;
            case 'restart': restart(); break;
            case 'toggle-voice': voice = !voice; if (!voice) _lcStopSpeak(); renderObserveToolbar(); save(); break;
            case 'toggle-arrows': showArrows = !showArrows; renderObserveToolbar(); renderStage(); save(); break;
            case 'toggle-nums': showNums = !showNums; renderBars(); renderStage(); save(); break;
            case 'undo-ink': undoInk(); break;
            case 'clear-ink': clearInk(); break;
            case 'check': check(); break;
        }
    });

    // Les zones de travail ne déplacent pas le widget
    [stage, topRow, obsTools, prTools, info, legend].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Clavier : flèches pour changer de lettre, espace pour tracer
    widget.addEventListener('keydown', (e) => {
        const tg = e.target.tagName;
        if (tg === 'INPUT' || tg === 'TEXTAREA') return;
        const i = LC_KEYS.indexOf(letter);
        if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); selectLetter(LC_KEYS[(i + 1) % LC_KEYS.length]); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); selectLetter(LC_KEYS[(i - 1 + LC_KEYS.length) % LC_KEYS.length]); }
        else if (e.key === ' ' && tab === 'observe') { e.preventDefault(); e.stopPropagation(); play(false); }
        else if (/^[a-z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.stopPropagation(); selectLetter(e.key); }
    });

    // ── Redimensionnement libre (largeur + hauteur du cahier) ─────────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(480, startW + x - x0) + 'px';
            stage.style.height    = Math.max(160, startH + y - y0) + 'px';
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

    // La scène se redessine quand sa taille change (le dessin en cours est conservé)
    let _lastSize = '';
    function onStageResize() {
        if (!document.body.contains(widget)) return;
        const sz = stage.clientWidth + 'x' + stage.clientHeight;
        if (sz === _lastSize || !stage.clientWidth || !stage.clientHeight) return;
        _lastSize = sz;
        if (cur) return;
        renderStage();
    }
    let _ro = null;
    if (typeof ResizeObserver === 'function') { _ro = new ResizeObserver(onStageResize); _ro.observe(stage); }
    function onWinResize() {
        if (!document.body.contains(widget)) { window.removeEventListener('resize', onWinResize); if (_ro) _ro.disconnect(); stopAnim(); return; }
        if (_isMax) fitFullHeight();
        onStageResize();
    }
    window.addEventListener('resize', onWinResize);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    // En plein écran, le cahier prend toute la hauteur restante
    function fitFullHeight() {
        const others = [header, topRow, tab === 'observe' ? obsTools : prTools, info, legend]
            .reduce((a, el) => a + (el.offsetHeight || 0), 0);
        const avail = window.innerHeight - others - 9 * 5 - 30;
        stage.style.height = Math.max(160, Math.round(avail)) + 'px';
    }

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '✍️ Lettres cursives', { onExpand: () => requestAnimationFrame(onStageResize) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(onStageResize);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = stage.style.height;
            container.classList.add('wf-fullboard');
            requestAnimationFrame(fitFullHeight);
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
        }
        requestAnimationFrame(onStageResize);
        save();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        stopAnim();
        window.removeEventListener('resize', onWinResize);
        if (_ro) _ro.disconnect();
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

    done = -1;
    renderAll();
    _lastSize = stage.clientWidth + 'x' + stage.clientHeight;

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    function inkForSave() {
        // Arrondi à 2 décimales, limité pour ne pas alourdir la sauvegarde
        const out = {};
        let budget = 8000;
        [letter].concat(Object.keys(inkByLetter).filter(k => k !== letter)).forEach(k => {
            const list = inkByLetter[k];
            if (!list || !list.length || budget <= 0) return;
            const ss = [];
            list.forEach(s => {
                if (budget <= 0) return;
                const pts = s.pts.map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
                budget -= pts.length;
                ss.push({ c: LC_INKS.indexOf(s.c), p: pts });
            });
            if (ss.length) out[k] = ss;
        });
        return out;
    }

    widget._lcGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        letter, tab, speed, voice, showArrows, showNums, zoomObs, zoomPr, aide, inkIdx,
        stars: Object.assign({}, stars),
        ink: inkForSave(),
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone, ouverture directe en plein écran (bouton vert)
    if (_lcIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._lcSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_lcIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        stopAnim();
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        if (LC_LETTRES[d.letter]) letter = d.letter;
        if (d.tab === 'observe' || d.tab === 'practice') tab = d.tab;
        if (LC_SPEEDS[d.speed]) speed = d.speed;
        if (typeof d.voice === 'boolean') voice = d.voice;
        if (typeof d.showArrows === 'boolean') showArrows = d.showArrows;
        if (typeof d.showNums === 'boolean') showNums = d.showNums;
        if (LC_AIDES[d.aide]) aide = d.aide;
        if (LC_ZOOMS[d.zoomObs]) zoomObs = d.zoomObs;
        if (LC_ZOOMS[d.zoomPr])  zoomPr  = d.zoomPr;
        if (Number.isInteger(d.inkIdx) && LC_INKS[d.inkIdx]) inkIdx = d.inkIdx;
        stars = {};
        if (d.stars && typeof d.stars === 'object') Object.keys(d.stars).forEach(k => { if (LC_LETTRES[k]) stars[k] = Math.max(0, Math.min(3, +d.stars[k] || 0)); });
        inkByLetter = {};
        if (d.ink && typeof d.ink === 'object') {
            Object.keys(d.ink).forEach(k => {
                if (!LC_LETTRES[k] || !Array.isArray(d.ink[k])) return;
                inkByLetter[k] = d.ink[k]
                    .filter(s => s && Array.isArray(s.p) && s.p.length)
                    .map(s => ({ c: LC_INKS[s.c] || LC_INKS[0], pts: s.p.filter(p => Array.isArray(p) && p.length === 2).map(p => [+p[0], +p[1]]) }));
            });
        }
        checkRes = null;
        curStepTxt = null;
        done = -1; partial = 0;
        renderAll();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(onStageResize, 250);
    };

    saveBoard();
    return widget;
}
