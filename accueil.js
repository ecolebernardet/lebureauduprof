// =========================================================================
// ÉCRAN D'ACCUEIL — Le Bureau du Prof
// -------------------------------------------------------------------------
// À l'ouverture de l'application, si le tableau est vide, une carte
// d'accueil s'affiche au centre :
//   - « Bonjour ! / Bonsoir ! », l'heure et la date en grand
//   - 8 grandes tuiles vers les panneaux (mêmes icônes et couleurs que
//     les onglets latéraux) + 2 actions rapides (Dessiner, Écrire)
//   - sous l'heure, quatre boutons : « Aide » (modale d'aide),
//     « Contact » (formulaire de contact, openContactForm, dans contact.js),
//     « À propos » (fenêtre À propos, openAboutModal, dans a-propos.js) et
//     « Partager » (partagerBureauDuProf, dans partage.js)
//   - un badge avec le numéro de version à côté du titre (version.js,
//     window.APP_VERSION ; cliquable : ouvre la fenêtre « À propos »)
//   - une astuce tirée au hasard
//   - en bas, un lien « Mentions légales » (openMentionsLegales, dans
//     mentions-legales.js)
// Elle peut aussi être rouverte à tout moment par openAccueil() (pastille
// « ? » → Accueil), même si le tableau n'est pas vide ou si « Ne plus
// afficher » est coché.
//   - un bandeau « Merci à nos soutiens » avec les noms de donateurs.js ;
//     tant que la liste est vide, un appel au soutien avec le lien Tipeee
//     (DONATEURS_LIEN) le remplace — rien du tout s'il n'y a pas de lien
// Elle disparaît dès qu'on commence à travailler : clic sur une tuile,
// clic sur un onglet latéral (ou Alt+1…9), ajout d'un widget, ouverture
// de la barre Dessin, clic sur le tableau, mode présentation, touche Échap
// ou bouton ✕.
// « Ne plus afficher » la désactive définitivement (localStorage).
//
// Installation : <script src="accueil.js"></script> en fin de index.html,
// précédé de <script src="donateurs.js"></script> pour les donateurs.
// Pour la retirer : supprimer cette ligne (le CSS est injecté par ce fichier).
// =========================================================================
(function () {
    if (window.location.search.indexOf('mode=pagegarde') !== -1) return;

    var HIDE_KEY = 'accueilMasque';          // « Ne plus afficher »

    // Affichage automatique au démarrage ? (l'ouverture à la demande,
    // openAccueil(), reste toujours possible depuis la pastille « ? »)
    var autoShow = true;
    try { if (localStorage.getItem(HIDE_KEY) === '1') autoShow = false; } catch (e) {}

    // Lancement direct d'un outil par l'adresse (?ouvrir=minuteur…) :
    // pas d'écran d'accueil, l'outil demandé s'affiche tout de suite.
    if (window._lancementDirect || /[?&]ouvrir=/.test(window.location.search)) autoShow = false;

    // ── Icônes : identiques à celles des onglets latéraux ────────────────
    var ICO = {
        jeux:    '<path d="M6.5 7h11a4.5 4.5 0 0 1 4.3 5.8l-1.2 4a2.6 2.6 0 0 1-4.5.9L14.5 16h-5l-1.6 1.7a2.6 2.6 0 0 1-4.5-.9l-1.2-4A4.5 4.5 0 0 1 6.5 7z"/><path d="M7.5 10v3M6 11.5h3"/><circle cx="15.5" cy="10.5" r=".6"/><circle cx="17.5" cy="12.5" r=".6"/>',
        act:     '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r=".8"/><circle cx="15.5" cy="8.5" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="8.5" cy="15.5" r=".8"/><circle cx="15.5" cy="15.5" r=".8"/>',
        outils:  '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/><path d="M10 13v2h4v-2"/>',
        widgets: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
        visuels: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 15.5l-4.5-4.5L6 19"/>',
        lecons:  '<path d="M12 6.5C10.4 5.3 8.2 4.8 4 5v13c4.2-.2 6.4.3 8 1.5 1.6-1.2 3.8-1.7 8-1.5V5c-4.2-.2-6.4.3-8 1.5z"/><path d="M12 6.5v13"/>',
        ecran:   '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
        tableaux:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        crayon:  '<path d="M4 20l1.2-4.8L15.6 4.8a2.3 2.3 0 0 1 3.3 0l.3.3a2.3 2.3 0 0 1 0 3.3L8.8 18.8z"/><path d="M13.8 6.6l3.6 3.6"/>',
        texte:   '<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>',
        pdf:     '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14.5l2 2 4-4.5"/>',
        bulle:   '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14.5h4.5"/>',
        aide:    '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17h.01"/>',
        info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
        partage: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'
    };
    function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + '</svg>'; }

    // Tuiles : [icône, libellé, sous-titre, couleur, fonction appelée]
    var TILES = [
        ['jeux',     'Jeux',         'Battles, maths, français…', '#9b6cf0', 'toggleJeuxPanel'],
        ['lecons',   'Leçons',       'Leçons et entraînements',    '#14a3a0', 'toggleLessonsPanel'],
        ['act',      'Activités',    'Rituels, manipulations…',    '#f39c12', 'toggleActivitiesPanel'],
        ['outils',   'Outils',       'Classe, bruit, minuteur…',   '#2ecc71', 'toggleToolsPanel'],
        ['widgets',  'Widgets',      'PDF, date, météo, texte…',   '#4a90e2', 'toggleWidgetsPanel'],
        ['visuels',  'Visuels',      'Stickers et images',         '#e84393', 'toggleStickerPanel'],
        ['tableaux', 'Mes tableaux', 'Ouvrir ou créer',            '#7d8899', 'toggleProjectsPanel'],
        ['ecran',    'Écran',        'Fond, thème, capture',       '#7d8899', 'toggleDisplayPanel']
    ];

    var ASTUCES = [
        'Clic droit (ou appui long) sur le tableau : menu rapide pour coller, ouvrir un PDF, un minuteur…',
        'Glissez un PDF ou une image directement sur le tableau pour l\'ouvrir.',
        'Sur un PDF, le bouton ✏️ permet d\'écrire, surligner et ajouter du texte, puis 💾 l\'enregistre avec vos annotations.',
        'Alt+1 à Alt+9 ouvrent les onglets, Alt+0 la barre Dessin, Échap ferme les panneaux.',
        'Onglet « Leçons » : leçons et exercices corrigés que les élèves peuvent suivre seuls.',
        'Ctrl+C / Ctrl+V copient des widgets d\'un tableau à l\'autre.',
        'Le mode « Présenter » masque tous les outils pour projeter en plein écran.',
        'Panneau Écran : changez le fond (Séyès, tableau vert, tableaux de numération…).'
    ];

    // ── CSS ──────────────────────────────────────────────────────────────
    var CSS = [
        '#accueil{position:fixed;inset:0;z-index:14500;display:flex;align-items:center;justify-content:center;',
        '  padding:24px 24px 24px 84px;box-sizing:border-box;pointer-events:none;',
        '  font-family:"Nunito","Segoe UI",system-ui,sans-serif;}',
        '#accueil.acc-hide{opacity:0;transition:opacity .35s ease;}',
        '#accueil.acc-hide .acc-card{transform:translateY(12px) scale(.98);transition:transform .35s ease;}',
        '.acc-card{pointer-events:auto;position:relative;width:min(880px,100%);max-height:calc(100vh - 48px);overflow:auto;',
        '  box-sizing:border-box;padding:26px 28px 18px;border-radius:26px;',
        '  background:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.7);',
        '  -webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);',
        '  box-shadow:0 24px 60px rgba(20,15,40,.35),0 2px 6px rgba(20,15,40,.12);color:#2a2440;',
        '  animation:acc-in .55s cubic-bezier(.2,.8,.2,1) both;}',
        '@keyframes acc-in{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}',
        '@keyframes acc-tile{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
        /* Fermer */
        '.acc-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:none;',
        '  background:rgba(42,36,64,.07);color:#5c5870;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;',
        '  transition:background .15s,transform .12s;}',
        '.acc-close:hover{background:rgba(42,36,64,.14);transform:scale(1.08);}',
        /* En-tête : salutation + heure */
        '.acc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-right:40px;margin-bottom:18px;}',
        '.acc-hello{font-size:15px;font-weight:700;color:#7b4fe0;letter-spacing:.3px;margin:0 0 2px;}',
        '.acc-title{font-size:30px;font-weight:900;margin:0;line-height:1.1;letter-spacing:-.3px;}',
        '.acc-brand{display:flex;align-items:center;gap:14px;}',
        '.acc-ver{display:inline-block;vertical-align:middle;margin-left:8px;padding:2px 9px;border-radius:999px;border:none;cursor:pointer;',
        '  font:inherit;font-size:12px;font-weight:800;letter-spacing:0;line-height:1.5;',
        '  background:rgba(74,144,226,.14);color:#2f6fc4;transition:filter .15s;}',
        '.acc-ver:hover{filter:brightness(.95);}',
        'body:not(.menu-light) .acc-ver{background:rgba(74,144,226,.22);color:#9cc6f5;}',
        '.acc-logo{height:68px;width:auto;max-width:150px;flex-shrink:0;object-fit:contain;border-radius:14px;',
        '  background:#fff;box-shadow:0 4px 14px rgba(40,30,70,.18);}',
        '.acc-time{text-align:right;flex-shrink:0;}',
        '.acc-intro{font-size:14px;line-height:1.5;color:#4a4660;margin:12px 0 0;max-width:470px;}',
        '.acc-intro b{color:#2a2440;}',
        '.acc-pdf{display:flex;align-items:center;gap:14px;margin:0 0 14px;padding:12px 14px;border-radius:16px;',
        '  background:linear-gradient(120deg,#fff1f0,#fff8ee);border:1px solid #f6cfc9;}',
        '.acc-pdf-ico{width:44px;height:44px;flex-shrink:0;border-radius:12px;display:flex;align-items:center;justify-content:center;',
        '  background:linear-gradient(135deg,#e5484d,#c0392b);box-shadow:0 4px 10px rgba(229,72,77,.35);}',
        '.acc-pdf-ico svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}',
        '.acc-pdf-txt{flex:1;min-width:0;font-size:13px;line-height:1.4;color:#5c4a48;}',
        '.acc-pdf-txt strong{display:block;font-size:15px;color:#2a2440;margin-bottom:1px;}',
        '.acc-pdf-btn{flex-shrink:0;border:none;border-radius:999px;padding:9px 16px;cursor:pointer;font:inherit;font-size:13px;font-weight:800;',
        '  color:#fff;background:linear-gradient(120deg,#e5484d,#c0392b);box-shadow:0 4px 12px rgba(229,72,77,.3);',
        '  transition:transform .12s,filter .15s;touch-action:manipulation;}',
        '.acc-pdf-btn:hover{transform:translateY(-2px);filter:brightness(1.06);}',
        '.acc-points{display:flex;flex-wrap:wrap;gap:6px;margin:-6px 0 14px;padding:0;list-style:none;}',
        '.acc-points li{white-space:nowrap;}',
        '.acc-points li{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(123,79,224,.09);color:#5f3cc4;}',
        '.acc-clock{font-size:44px;font-weight:900;line-height:1;letter-spacing:-1px;font-variant-numeric:tabular-nums;',
        '  background:linear-gradient(120deg,#4a90e2,#9b6cf0);-webkit-background-clip:text;background-clip:text;color:transparent;}',
        '.acc-date{font-size:14px;font-weight:700;color:#6b6880;margin-top:4px;}',
        '.acc-date::first-letter{text-transform:uppercase;}',
        '.acc-help{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 14px;border-radius:999px;cursor:pointer;',
        '  font:inherit;font-size:13px;font-weight:800;color:#fff;border:none;',
        '  background:linear-gradient(120deg,#f5a623,#e8890c);box-shadow:0 4px 12px rgba(232,137,12,.35);',
        '  transition:transform .12s,filter .15s;touch-action:manipulation;white-space:nowrap;}',
        '.acc-help:hover{transform:translateY(-2px);filter:brightness(1.06);}',
        '.acc-help.acc-contact{background:linear-gradient(120deg,#4a90e2,#3a74c4);box-shadow:0 4px 12px rgba(74,144,226,.35);}',
        '.acc-help.acc-about{background:linear-gradient(120deg,#9b6cf0,#7b4fe0);box-shadow:0 4px 12px rgba(123,79,224,.35);}',
        '.acc-help.acc-share{background:linear-gradient(120deg,#2ecc71,#1fa85a);box-shadow:0 4px 12px rgba(46,204,113,.35);}',
        '.acc-time-btns{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px;margin-top:10px;}',
        '.acc-time-btns .acc-help{margin-top:0;}',
        '.acc-help svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
        /* Tuiles */
        '.acc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}',
        '.acc-tile{--c:#4a90e2;display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;cursor:pointer;text-align:left;',
        '  background:#fff;border:1px solid color-mix(in srgb,var(--c) 22%,#e6e4ee);font:inherit;color:inherit;',
        '  box-shadow:0 1px 3px rgba(40,30,70,.07);animation:acc-tile .45s cubic-bezier(.2,.8,.2,1) both;',
        '  transition:transform .16s cubic-bezier(.3,.7,.4,1.3),box-shadow .16s,border-color .16s;touch-action:manipulation;}',
        '.acc-tile:hover,.acc-tile:focus-visible{transform:translateY(-3px);border-color:var(--c);',
        '  box-shadow:0 10px 22px color-mix(in srgb,var(--c) 28%,transparent);outline:none;}',
        '.acc-tile:active{transform:scale(.97);}',
        '.acc-ico{width:46px;height:46px;flex-shrink:0;border-radius:13px;display:flex;align-items:center;justify-content:center;',
        '  background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000));',
        '  box-shadow:0 4px 10px color-mix(in srgb,var(--c) 35%,transparent);}',
        '.acc-ico svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}',
        '.acc-ico svg circle{fill:#fff;}',
        '.acc-lbl{font-size:16px;font-weight:800;line-height:1.15;}',
        '.acc-sub{display:block;font-size:11.5px;color:#7a768c;margin-top:2px;line-height:1.2;}',
        /* Actions rapides */
        '.acc-quick{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;}',
        '.acc-btn{flex:1;min-width:150px;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 14px;',
        '  border-radius:999px;border:none;cursor:pointer;font:inherit;font-size:14px;font-weight:800;color:#fff;',
        '  background:linear-gradient(120deg,#4a90e2,#3a74c4);box-shadow:0 4px 12px rgba(74,144,226,.35);',
        '  transition:transform .12s,filter .15s;touch-action:manipulation;}',
        '.acc-btn.acc-btn-text{background:linear-gradient(120deg,#9b6cf0,#7b4fe0);box-shadow:0 4px 12px rgba(123,79,224,.35);}',
        '.acc-btn.alt{background:#fff;color:#2a2440;border:1px solid #e4e2ec;box-shadow:0 1px 3px rgba(40,30,70,.07);}',
        '.acc-btn:hover{transform:translateY(-2px);filter:brightness(1.05);}',
        '.acc-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
        /* Bandeau des donateurs (affiché seulement s'il y a au moins un nom) */
        '.acc-merci{display:flex;align-items:center;gap:10px;margin-top:14px;padding:8px 12px;border-radius:14px;',
        '  background:linear-gradient(120deg,#fff0f5,#f4efff);border:1px solid #f0d4e4;font-size:13px;}',
        '.acc-merci-lbl{flex-shrink:0;font-weight:800;color:#d6336c;white-space:nowrap;}',
        '.acc-merci-txt{flex:1;min-width:0;color:#4a3d66;line-height:1.35;}',
        '.acc-merci-txt b{color:#d6336c;}',
        'body:not(.menu-light) .acc-merci-txt{color:#e3dcf2;} body:not(.menu-light) .acc-merci-txt b{color:#ff8fb8;}',
        '.acc-merci-view{flex:1;min-width:0;overflow:hidden;',
        '  -webkit-mask-image:linear-gradient(90deg,transparent,#000 18px,#000 calc(100% - 18px),transparent);',
        '  mask-image:linear-gradient(90deg,transparent,#000 18px,#000 calc(100% - 18px),transparent);}',
        '.acc-merci-track{display:inline-flex;white-space:nowrap;font-weight:700;color:#4a3d66;padding:0 18px;}',
        '.acc-merci-track.acc-defile{padding:0;animation:acc-defile var(--d,30s) linear infinite;}',
        '.acc-merci-view:hover .acc-merci-track{animation-play-state:paused;}',
        '.acc-merci-grp{display:inline-flex;}',
        '.acc-merci-nom::after{content:"·";margin:0 10px;color:#d6336c;opacity:.6;}',
        '.acc-merci-track:not(.acc-defile) .acc-merci-nom:last-child::after{content:none;}',
        '@keyframes acc-defile{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
        '.acc-merci-lien{flex-shrink:0;font-size:12px;font-weight:800;color:#fff;text-decoration:none;white-space:nowrap;',
        '  padding:5px 12px;border-radius:999px;background:linear-gradient(120deg,#e84393,#d6336c);',
        '  box-shadow:0 3px 10px rgba(214,51,108,.3);transition:transform .12s,filter .15s;}',
        '.acc-merci-lien:hover{transform:translateY(-1px);filter:brightness(1.06);}',
        'body:not(.menu-light) .acc-merci{background:linear-gradient(120deg,#35202c,#2a2238);border-color:#4a2d3e;}',
        'body:not(.menu-light) .acc-merci-lbl{color:#ff8fb8;}',
        'body:not(.menu-light) .acc-merci-track{color:#e3dcf2;}',
        /* Pied : astuce + ne plus afficher */
        '.acc-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:12px;',
        '  border-top:1px solid rgba(42,36,64,.08);font-size:12px;color:#6b6880;}',
        '.acc-tip{display:flex;gap:8px;align-items:flex-start;line-height:1.35;}',
        '.acc-tip b{color:#d69e00;flex-shrink:0;}',
        '.acc-never{display:flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;user-select:none;}',
        '.acc-foot-r{display:flex;align-items:center;gap:14px;flex-shrink:0;}',
        '.acc-legal{border:none;background:none;padding:0;cursor:pointer;font:inherit;font-size:12px;color:inherit;',
        '  text-decoration:underline;text-underline-offset:2px;white-space:nowrap;}',
        '.acc-legal:hover{color:#2f6fc4;}',
        'body:not(.menu-light) .acc-legal:hover{color:#9cc6f5;}',
        '.acc-never input{accent-color:#7b4fe0;width:15px;height:15px;margin:0;cursor:pointer;}',
        /* Mode sombre */
        'body:not(.menu-light) .acc-card{background:rgba(24,22,34,.86);border-color:rgba(255,255,255,.08);color:#ecebf3;}',
        'body:not(.menu-light) .acc-close{background:rgba(255,255,255,.08);color:#ccc;}',
        'body:not(.menu-light) .acc-hello{color:#b79bff;}',
        'body:not(.menu-light) .acc-date,body:not(.menu-light) .acc-foot{color:#a9a6b8;}',
        'body:not(.menu-light) .acc-tile,body:not(.menu-light) .acc-btn.alt{background:#24212f;border-color:#34303f;color:#ecebf3;}',
        'body:not(.menu-light) .acc-sub{color:#9a97aa;}',
        'body:not(.menu-light) .acc-intro{color:#c9c6d6;} body:not(.menu-light) .acc-intro b{color:#fff;}',
        'body:not(.menu-light) .acc-pdf{background:linear-gradient(120deg,#3a1f24,#33261c);border-color:#5a2f33;}',
        'body:not(.menu-light) .acc-pdf-txt{color:#d9c4c2;} body:not(.menu-light) .acc-pdf-txt strong{color:#fff;}',
        'body:not(.menu-light) .acc-points li{background:rgba(183,155,255,.14);color:#cbb8ff;}',
        'body:not(.menu-light) .acc-foot{border-top-color:rgba(255,255,255,.08);}',
        /* Masqué en mode présentation (l'ouverture d'un panneau ferme l'accueil, voir build()) */
        'body.presentation-mode #accueil{display:none;}',
        /* Écrans moyens */
        '@media (max-width:900px){.acc-grid{grid-template-columns:repeat(2,1fr);}}',
        /* Téléphone : carte compactée pour tenir sur l'écran sans défilement */
        '@media (max-width:768px),(max-height:500px) and (pointer:coarse){',
        '  #accueil{padding:8px 8px 8px 48px;}',
        '  .acc-card{padding:12px 12px 10px;border-radius:18px;max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);}',
        '  .acc-close{top:8px;right:8px;width:30px;height:30px;font-size:14px;}',
        '  .acc-head{flex-direction:column;align-items:stretch;gap:6px;margin-bottom:8px;padding-right:34px;}',
        '  .acc-brand{gap:8px;} .acc-logo{height:36px;border-radius:8px;}',
        '  .acc-hello{font-size:12px;margin:0;} .acc-title{font-size:18px;}',
        '  .acc-ver{font-size:10.5px;padding:1px 7px;margin-left:6px;}',
        '  .acc-intro{display:none;} .acc-points{display:none;}',
        '  .acc-time{text-align:left;display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;}',
        '  .acc-clock{font-size:24px;} .acc-date{font-size:12px;margin-top:0;}',
        '  .acc-help{margin-top:0;padding:5px 10px;font-size:12px;} .acc-help svg{width:14px;height:14px;}',
        '  .acc-time-btns{margin-top:0;justify-content:flex-start;}',
        /* Bandeau PDF : on garde le titre et le bouton, sans la description */
        '  .acc-pdf{gap:8px;padding:8px;margin-bottom:8px;border-radius:12px;}',
        '  .acc-pdf-ico{width:30px;height:30px;border-radius:9px;} .acc-pdf-ico svg{width:17px;height:17px;}',
        '  .acc-pdf-txt{font-size:0;line-height:1.2;} .acc-pdf-txt strong{font-size:13px;margin:0;}',
        '  .acc-pdf-btn{padding:7px 12px;font-size:12px;}',
        /* Tuiles : 3 colonnes, icône au-dessus du libellé */
        '  .acc-grid{grid-template-columns:repeat(4,1fr);gap:6px;}',
        '  .acc-tile{flex-direction:column;justify-content:center;text-align:center;padding:8px 4px;gap:4px;border-radius:12px;}',
        '  .acc-ico{width:32px;height:32px;border-radius:9px;} .acc-ico svg{width:18px;height:18px;}',
        '  .acc-lbl{font-size:12px;} .acc-sub{display:none;}',
        '  .acc-quick{margin-top:8px;gap:6px;flex-wrap:nowrap;}',
        '  .acc-btn{min-width:0;font-size:12px;padding:8px 6px;gap:6px;} .acc-btn svg{width:15px;height:15px;}',
        '  .acc-tip{display:none;} .acc-foot{justify-content:flex-end;margin-top:8px;padding-top:6px;font-size:11px;}',
        '  .acc-merci{margin-top:8px;padding:5px 8px;gap:6px;font-size:11.5px;border-radius:10px;}',
        '  .acc-merci-lien{padding:4px 9px;font-size:11px;}',
        '}',
        /* Téléphone en paysage (écran bas) : tout sur une ligne quand c'est possible */
        '@media (max-height:500px) and (pointer:coarse) and (min-width:560px){',
        '  .acc-head{flex-direction:row;align-items:center;justify-content:space-between;}',
        '  .acc-time{justify-content:flex-end;}',
        '  .acc-grid{grid-template-columns:repeat(8,1fr);}',
        '}',
        '@media (prefers-reduced-motion:reduce){.acc-card,.acc-tile{animation:none;}#accueil.acc-hide{transition:none;}',
        '  .acc-merci-view{-webkit-mask-image:none;mask-image:none;}',
        '  .acc-merci-track,.acc-merci-track.acc-defile{animation:none;white-space:normal;flex-wrap:wrap;padding:0;}',
        '  .acc-merci-grp{flex-wrap:wrap;}}'
    ].join('\n');

    // ── Construction ─────────────────────────────────────────────────────
    var root = null, clockTimer = null, observer = null, tbObserver = null;
    var autoDone = false;      // l'affichage automatique n'a lieu qu'une fois
    var manuel = false;        // accueil ouvert à la demande (pastille « ? »)

    function boardIsEmpty() {
        var b = document.getElementById('board');
        if (!b) return false;
        if (b.querySelector('.widget, .shape-widget')) return false;
        try { if (typeof strokes !== 'undefined' && strokes && strokes.length) return false; } catch (e) {}
        return true;
    }

    // Lit directement le tableau enregistré, sans attendre que board.js
    // l'ait restauré à l'écran : s'il contient des widgets, pas d'accueil.
    function savedBoardHasWidgets() {
        try {
            var raw = localStorage.getItem('profBoardConfig');
            if (!raw) return false;
            var parsed = JSON.parse(raw);
            var list = Array.isArray(parsed) ? parsed : ((parsed && parsed.widgets) || []);
            return list.length > 0;
        } catch (e) { return false; }
    }

    // ── Donateurs (liste définie dans donateurs.js) ──────────────────────
    function escHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function listeDonateurs() {
        var l = window.DONATEURS;
        if (!Array.isArray(l)) return [];
        return l.map(function (n) { return String(n == null ? '' : n).trim(); })
                .filter(function (n) { return n.length > 0; });
    }
    function bandeauDonateurs() {
        var noms = listeDonateurs();
        var lien = String(window.DONATEURS_LIEN || '').trim();
        var lienOk = /^https?:\/\//i.test(lien);
        var bouton = lienOk
            ? '<a class="acc-merci-lien" href="' + escHtml(lien) + '" target="_blank" rel="noopener">Soutenir</a>'
            : '';
        if (!noms.length) {
            // Aucun donateur : appel au soutien (seulement si un lien Tipeee est indiqué)
            if (!lienOk) return '';
            return '<div class="acc-merci acc-merci-appel">' +
                '<span class="acc-merci-lbl">❤️</span>' +
                '<span class="acc-merci-txt">Le Bureau du Prof est <b>gratuit</b> : vous pouvez le soutenir sur Tipeee.</span>' +
                bouton + '</div>';
        }
        var html = '<div class="acc-merci" aria-label="Merci à nos soutiens">' +
            '<span class="acc-merci-lbl">❤️ Merci à nos soutiens</span>' +
            '<div class="acc-merci-view"><div class="acc-merci-track"><span class="acc-merci-grp">' +
            noms.map(function (n) { return '<span class="acc-merci-nom">' + escHtml(n) + '</span>'; }).join('') +
            '</span></div></div>';
        return html + bouton + '</div>';
    }
    // Si les noms ne tiennent pas sur la ligne, ils défilent en boucle
    // (la liste est doublée pour que la boucle soit continue).
    function activerDefilement() {
        var view = root && root.querySelector('.acc-merci-view');
        if (!view) return;
        var track = view.querySelector('.acc-merci-track');
        if (track.scrollWidth <= view.clientWidth + 1) return;
        var grp = track.querySelector('.acc-merci-grp');
        var copie = grp.cloneNode(true);
        copie.setAttribute('aria-hidden', 'true');
        track.appendChild(copie);
        track.classList.add('acc-defile');
        // Vitesse constante (≈ 40 px/s), quel que soit le nombre de noms
        track.style.setProperty('--d', Math.max(12, Math.round(grp.offsetWidth / 40)) + 's');
    }

    function updateClock() {
        if (!root) return;
        var now = new Date();
        var h = now.getHours();
        root.querySelector('.acc-hello').textContent = (h >= 18 || h < 5) ? 'Bonsoir !' : 'Bonjour !';
        root.querySelector('.acc-clock').textContent =
            String(h).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        root.querySelector('.acc-date').textContent =
            now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    function build() {
        if (!document.getElementById('accueil-style')) {
            var style = document.createElement('style');
            style.id = 'accueil-style';
            style.textContent = CSS;
            document.head.appendChild(style);
        }

        var tiles = TILES.map(function (t, i) {
            return '<button type="button" class="acc-tile" data-fn="' + t[4] + '" style="--c:' + t[3] +
                   ';animation-delay:' + (0.12 + i * 0.05).toFixed(2) + 's">' +
                   '<span class="acc-ico">' + svg(t[0]) + '</span>' +
                   '<span><span class="acc-lbl">' + t[1] + '</span><span class="acc-sub">' + t[2] + '</span></span>' +
                   '</button>';
        }).join('');

        // Numéro de version (version.js)
        var version = String(window.APP_VERSION || '').trim();
        var badgeVersion = version
            ? '<button type="button" class="acc-ver" data-act="version" title="Version ' + escHtml(version) + ' — À propos">v' + escHtml(version) + '</button>'
            : '';

        root = document.createElement('div');
        root.id = 'accueil';
        root.innerHTML =
            '<div class="acc-card" role="dialog" aria-label="Accueil">' +
              '<button type="button" class="acc-close" title="Fermer (Échap)" aria-label="Fermer">✕</button>' +
              '<div class="acc-head">' +
                '<div><div class="acc-brand">' +
                  '<img class="acc-logo" src="pics/logo-le-bureau-du-prof4.jpg" alt="Logo Le Bureau du Prof" onerror="this.remove()">' +
                  '<div><p class="acc-hello">Bonjour !</p><h1 class="acc-title">Le Bureau du Prof' + badgeVersion + '</h1></div>' +
                '</div>' +
                  '<p class="acc-intro">Votre <b>tableau blanc numérique</b> pour la classe : écrivez, dessinez, projetez vos documents ' +
                  'et lancez en un clic des <b>jeux</b>, des <b>leçons</b>, des <b>activités</b> et des <b>outils</b> pensés pour l\'école, au TBI, au VPI ou sur ordinateur.</p>' +
                '</div>' +
                '<div class="acc-time"><div class="acc-clock">--:--</div><div class="acc-date"></div>' +
                  '<div class="acc-time-btns">' +
                    '<button type="button" class="acc-help" data-act="help" title="Ouvrir l\'aide">' + svg('aide') + 'Aide</button>' +
                    '<button type="button" class="acc-help acc-contact" data-act="contact" title="Contacter l\'auteur du site">' + svg('bulle') + 'Contact</button>' +
                    '<button type="button" class="acc-help acc-about" data-act="about" title="Version, données et crédits">' + svg('info') + 'À propos</button>' +
                    '<button type="button" class="acc-help acc-share" data-act="share" title="Faire connaître le Bureau du Prof à un collègue">' + svg('partage') + 'Partager</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<ul class="acc-points"><li>Gratuit</li><li>Sans compte</li><li>Tableaux enregistrés sur cet appareil</li><li>Fonctionne à la souris, au stylet et au doigt</li></ul>' +
              '<div class="acc-pdf">' +
                '<span class="acc-pdf-ico">' + svg('pdf') + '</span>' +
                '<span class="acc-pdf-txt"><strong>Projetez et annotez vos PDF</strong>' +
                  'Fiches, manuels, exercices : affichez-les en grand, écrivez et surlignez dessus, puis enregistrez le PDF annoté. ' +
                  'Vous pouvez aussi glisser un fichier directement sur le tableau.</span>' +
                '<button type="button" class="acc-pdf-btn" data-act="pdf">Ouvrir un PDF</button>' +
              '</div>' +
              '<div class="acc-grid">' + tiles + '</div>' +
              '<div class="acc-quick">' +
                '<button type="button" class="acc-btn" data-act="draw">' + svg('crayon') + 'Dessiner au tableau</button>' +
                '<button type="button" class="acc-btn acc-btn-text" data-act="text">' + svg('texte') + 'Écrire un texte</button>' +
              '</div>' +
              bandeauDonateurs() +
              '<div class="acc-foot">' +
                '<div class="acc-tip"><b>💡 Astuce</b><span>' + ASTUCES[Math.floor(Math.random() * ASTUCES.length)] + '</span></div>' +
                '<div class="acc-foot-r">' +
                  '<button type="button" class="acc-legal" data-act="mentions">Mentions légales</button>' +
                  '<label class="acc-never"><input type="checkbox"> Ne plus afficher</label>' +
                '</div>' +
              '</div>' +
            '</div>';
        document.body.appendChild(root);
        activerDefilement();

        updateClock();
        clockTimer = setInterval(updateClock, 10000);

        // Tuiles → panneaux
        root.querySelectorAll('.acc-tile').forEach(function (b) {
            b.addEventListener('click', function () {
                var fn = window[b.dataset.fn];
                hide();
                if (typeof fn === 'function') fn();
            });
        });
        // Actions rapides
        root.querySelector('[data-act="draw"]').addEventListener('click', function () {
            hide();
            if (typeof openMmPanel === 'function') openMmPanel('draw');
        });
        root.querySelector('[data-act="pdf"]').addEventListener('click', function () {
            hide();
            if (typeof createWidget !== 'function') return;
            var w = createWidget('pdf');
            // Ouvre directement le sélecteur de fichier du widget
            var input = w && w.querySelector('input[type="file"]');
            if (input) input.click();
        });
        root.querySelector('[data-act="text"]').addEventListener('click', function () {
            hide();
            window._nextTextOpenCreate = true;
            if (typeof createWidget === 'function') createWidget('text');
        });
        root.querySelector('[data-act="help"]').addEventListener('click', function () {
            hide();
            if (typeof openHelpModal === 'function') openHelpModal();
        });
        root.querySelector('[data-act="contact"]').addEventListener('click', function () {
            hide();
            if (typeof openContactForm === 'function') openContactForm();
        });
        root.querySelector('[data-act="about"]').addEventListener('click', function () {
            hide();
            if (typeof openAboutModal === 'function') openAboutModal();
        });
        root.querySelector('[data-act="share"]').addEventListener('click', function () {
            hide();
            if (typeof partagerBureauDuProf === 'function') partagerBureauDuProf();
        });
        root.querySelector('[data-act="mentions"]').addEventListener('click', function () {
            hide();
            if (typeof openMentionsLegales === 'function') openMentionsLegales();
        });
        var verBtn = root.querySelector('[data-act="version"]');
        if (verBtn) verBtn.addEventListener('click', function () {
            hide();
            if (typeof openAboutModal === 'function') openAboutModal();
        });
        root.querySelector('.acc-close').addEventListener('click', hide);
        // La case reflète le réglage actuel (utile quand on rouvre l'accueil à la demande)
        var never = root.querySelector('.acc-never input');
        try { never.checked = localStorage.getItem(HIDE_KEY) === '1'; } catch (e) {}
        never.addEventListener('change', function (e) {
            try {
                if (e.target.checked) localStorage.setItem(HIDE_KEY, '1');
                else localStorage.removeItem(HIDE_KEY);
            } catch (err) {}
        });

        // Disparaît dès qu'on commence à travailler
        var b = document.getElementById('board');
        if (b) {
            observer = new MutationObserver(function (muts) {
                if (manuel) {
                    // Ouvert à la demande : le tableau peut déjà contenir des
                    // éléments ; on ne ferme que si un nouvel élément apparaît.
                    var ajout = muts.some(function (m) { return m.addedNodes && m.addedNodes.length; });
                    if (ajout) hide();
                } else if (!boardIsEmpty()) hide();
            });
            observer.observe(b, { childList: true });
            b.addEventListener('pointerdown', hide, { once: true });
        }
        var tb = document.getElementById('draw-toolbar');
        if (tb && !tbObserver) {
            tbObserver = new MutationObserver(function () {
                if (tb.style.display && tb.style.display !== 'none') hide();
            });
            tbObserver.observe(tb, { attributes: true, attributeFilter: ['style'] });
        }
        document.addEventListener('keydown', onKey);

        // Un onglet latéral (ou Alt+1…9, qui simulent un clic) ferme aussi l'accueil
        var tabs = document.getElementById('side-tabs');
        if (tabs) tabs.addEventListener('click', hide);
    }

    function onKey(e) { if (e.key === 'Escape') hide(); }

    function hide() {
        if (!root || root.classList.contains('acc-hide')) return;
        root.classList.add('acc-hide');
        clearInterval(clockTimer);
        if (observer) observer.disconnect();
        document.removeEventListener('keydown', onKey);
        var b = document.getElementById('board');
        if (b) b.removeEventListener('pointerdown', hide);
        var r = root;
        root = null;                                        // permet de le rouvrir
        setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 380);
    }
    window.hideAccueil = hide;

    // Ouverture à la demande (pastille « ? » → Accueil), même si le
    // tableau contient déjà des éléments ou si « Ne plus afficher » est coché.
    function openAccueil() {
        if (root) return;                                   // déjà affiché
        autoDone = true;
        manuel = true;
        build();
    }
    window.openAccueil = openAccueil;

    function tryShow() {
        if (!autoShow || autoDone || root) return;          // déjà affiché ou déjà fermé
        if (document.body.classList.contains('presentation-mode')) return;
        if (boardIsEmpty()) { autoDone = true; manuel = false; build(); }
    }

    // 1) Affichage rapide : dès que la page est construite, sans attendre le
    //    chargement de toutes les images des panneaux (événement « load »),
    //    mais seulement si le tableau enregistré ne contient aucun widget.
    document.addEventListener('DOMContentLoaded', function () {
        if (!autoShow || savedBoardHasWidgets()) return;    // on laisse l'étape 2 décider
        setTimeout(tryShow, 600);
    });

    // 2) Vérification finale, une fois le tableau entièrement restauré
    //    (board.js termine environ 1 s après « load ») :
    //    - si l'accueil est affiché mais que quelque chose est apparu
    //      (dessins, widgets restaurés tardivement…), on le referme ;
    //    - s'il n'a pas encore été affiché et que le tableau est vide
    //      (ex. tableau enregistré contenant des éléments qui ne
    //      s'affichent pas comme des widgets), on l'affiche maintenant.
    window.addEventListener('load', function () {
        setTimeout(function () {
            if (root) { if (!manuel && !boardIsEmpty()) hide(); }
            else tryShow();
        }, 1200);
    });
})();
