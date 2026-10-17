// =========================================================================
// ÉCRAN D'ACCUEIL — Le Bureau du Prof
// -------------------------------------------------------------------------
// À l'ouverture de l'application, si le tableau est vide, une carte
// d'accueil s'affiche au centre :
//   - « Bonjour ! / Bonsoir ! », l'heure et la date en grand
//   - 6 grandes tuiles vers les panneaux (mêmes icônes et couleurs que
//     les onglets latéraux) + 2 actions rapides (Dessiner, Écrire)
//   - un bouton « Mode d'emploi » sous l'heure, qui ouvre la modale d'aide
//   - une astuce tirée au hasard
// Elle disparaît dès qu'on commence à travailler : clic sur une tuile,
// ajout d'un widget, ouverture de la barre Dessin, clic sur le tableau,
// mode présentation, touche Échap ou bouton ✕.
// « Ne plus afficher » la désactive définitivement (localStorage).
//
// Installation : <script src="accueil.js"></script> en fin de index.html.
// Pour la retirer : supprimer cette ligne (le CSS est injecté par ce fichier).
// =========================================================================
(function () {
    if (window.location.search.indexOf('mode=pagegarde') !== -1) return;

    var HIDE_KEY = 'accueilMasque';          // « Ne plus afficher »
    try { if (localStorage.getItem(HIDE_KEY) === '1') return; } catch (e) {}

    // ── Icônes : identiques à celles des onglets latéraux ────────────────
    var ICO = {
        jeux:    '<path d="M6.5 7h11a4.5 4.5 0 0 1 4.3 5.8l-1.2 4a2.6 2.6 0 0 1-4.5.9L14.5 16h-5l-1.6 1.7a2.6 2.6 0 0 1-4.5-.9l-1.2-4A4.5 4.5 0 0 1 6.5 7z"/><path d="M7.5 10v3M6 11.5h3"/><circle cx="15.5" cy="10.5" r=".6"/><circle cx="17.5" cy="12.5" r=".6"/>',
        act:     '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r=".8"/><circle cx="15.5" cy="8.5" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="8.5" cy="15.5" r=".8"/><circle cx="15.5" cy="15.5" r=".8"/>',
        outils:  '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/><path d="M10 13v2h4v-2"/>',
        widgets: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
        visuels: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 15.5l-4.5-4.5L6 19"/>',
        tableaux:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        crayon:  '<path d="M4 20l1.2-4.8L15.6 4.8a2.3 2.3 0 0 1 3.3 0l.3.3a2.3 2.3 0 0 1 0 3.3L8.8 18.8z"/><path d="M13.8 6.6l3.6 3.6"/>',
        texte:   '<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>',
        pdf:     '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14.5l2 2 4-4.5"/>',
        aide:    '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17h.01"/>'
    };
    function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + '</svg>'; }

    // Tuiles : [icône, libellé, sous-titre, couleur, fonction appelée]
    var TILES = [
        ['jeux',     'Jeux',         'Battles, maths, français…', '#9b6cf0', 'toggleJeuxPanel'],
        ['act',      'Activités',    'Pour faire classe',          '#f39c12', 'toggleActivitiesPanel'],
        ['outils',   'Outils',       'Classe, bruit, minuteur…',   '#2ecc71', 'toggleToolsPanel'],
        ['widgets',  'Widgets',      'PDF, date, météo, texte…',   '#4a90e2', 'toggleWidgetsPanel'],
        ['visuels',  'Visuels',      'Stickers et images',         '#e84393', 'toggleStickerPanel'],
        ['tableaux', 'Mes tableaux', 'Ouvrir ou créer',            '#7d8899', 'toggleProjectsPanel']
    ];

    var ASTUCES = [
        'Clic droit (ou appui long) sur le tableau : menu rapide pour coller, ouvrir un PDF, un minuteur…',
        'Glissez un PDF ou une image directement sur le tableau pour l\'ouvrir.',
        'Sur un PDF, le bouton ✏️ permet d\'écrire, surligner et ajouter du texte, puis 💾 l\'enregistre avec vos annotations.',
        'Alt+1 à Alt+8 ouvrent les onglets, Alt+9 la barre Dessin, Échap ferme les panneaux.',
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
        '.acc-card{pointer-events:auto;position:relative;width:min(800px,100%);max-height:calc(100vh - 48px);overflow:auto;',
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
        '.acc-help svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
        /* Tuiles */
        '.acc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}',
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
        /* Pied : astuce + ne plus afficher */
        '.acc-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:12px;',
        '  border-top:1px solid rgba(42,36,64,.08);font-size:12px;color:#6b6880;}',
        '.acc-tip{display:flex;gap:8px;align-items:flex-start;line-height:1.35;}',
        '.acc-tip b{color:#d69e00;flex-shrink:0;}',
        '.acc-never{display:flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;user-select:none;}',
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
        /* Masqué en présentation et quand un panneau est ouvert */
        'body.presentation-mode #accueil{display:none;}',
        /* Écrans moyens */
        '@media (max-width:900px){.acc-grid{grid-template-columns:repeat(2,1fr);}}',
        /* Téléphone */
        '@media (max-width:768px),(max-height:500px) and (pointer:coarse){',
        '  #accueil{padding:12px 10px 12px 52px;}',
        '  .acc-card{padding:16px 14px 12px;border-radius:20px;max-height:calc(100vh - 24px);}',
        '  .acc-head{flex-direction:column;align-items:flex-start;gap:6px;margin-bottom:12px;}',
        '  .acc-time{text-align:left;}',
        '  .acc-title{font-size:22px;} .acc-clock{font-size:30px;}',
        '  .acc-brand{gap:10px;} .acc-logo{height:46px;border-radius:10px;}',
        '  .acc-intro{font-size:12.5px;} .acc-points{display:none;}',
        '  .acc-pdf{flex-wrap:wrap;gap:10px;padding:10px;} .acc-pdf-ico{width:36px;height:36px;} .acc-pdf-txt{font-size:12px;}',
        '  .acc-pdf-btn{width:100%;}',
        '  .acc-grid{grid-template-columns:repeat(2,1fr);gap:8px;}',
        '  .acc-tile{padding:10px;gap:8px;} .acc-ico{width:36px;height:36px;border-radius:10px;}',
        '  .acc-ico svg{width:20px;height:20px;} .acc-lbl{font-size:13px;} .acc-sub{display:none;}',
        '  .acc-btn{min-width:0;font-size:13px;padding:10px;}',
        '  .acc-tip{display:none;} .acc-foot{justify-content:flex-end;}',
        '}',
        '@media (prefers-reduced-motion:reduce){.acc-card,.acc-tile{animation:none;}#accueil.acc-hide{transition:none;}}'
    ].join('\n');

    // ── Construction ─────────────────────────────────────────────────────
    var root = null, clockTimer = null, observer = null;

    function boardIsEmpty() {
        var b = document.getElementById('board');
        if (!b) return false;
        if (b.querySelector('.widget, .shape-widget')) return false;
        try { if (typeof strokes !== 'undefined' && strokes && strokes.length) return false; } catch (e) {}
        return true;
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
        var style = document.createElement('style');
        style.id = 'accueil-style';
        style.textContent = CSS;
        document.head.appendChild(style);

        var tiles = TILES.map(function (t, i) {
            return '<button type="button" class="acc-tile" data-fn="' + t[4] + '" style="--c:' + t[3] +
                   ';animation-delay:' + (0.12 + i * 0.05).toFixed(2) + 's">' +
                   '<span class="acc-ico">' + svg(t[0]) + '</span>' +
                   '<span><span class="acc-lbl">' + t[1] + '</span><span class="acc-sub">' + t[2] + '</span></span>' +
                   '</button>';
        }).join('');

        root = document.createElement('div');
        root.id = 'accueil';
        root.innerHTML =
            '<div class="acc-card" role="dialog" aria-label="Accueil">' +
              '<button type="button" class="acc-close" title="Fermer (Échap)" aria-label="Fermer">✕</button>' +
              '<div class="acc-head">' +
                '<div><div class="acc-brand">' +
                  '<img class="acc-logo" src="pics/logo-le-bureau-du-prof.jpg" alt="Logo Le Bureau du Prof" onerror="this.remove()">' +
                  '<div><p class="acc-hello">Bonjour !</p><h1 class="acc-title">Le Bureau du Prof</h1></div>' +
                '</div>' +
                  '<p class="acc-intro">Votre <b>tableau blanc numérique</b> pour la classe : écrivez, dessinez, projetez vos documents ' +
                  'et lancez en un clic des <b>jeux</b>, des <b>activités</b> et des <b>outils</b> pensés pour l\'école, au TBI, au VPI ou sur ordinateur.</p>' +
                '</div>' +
                '<div class="acc-time"><div class="acc-clock">--:--</div><div class="acc-date"></div>' +
                  '<button type="button" class="acc-help" data-act="help">' + svg('aide') + 'Mode d\'emploi</button>' +
                '</div>' +
              '</div>' +
              '<ul class="acc-points"><li>Gratuit</li><li>Sans compte</li><li>Tableaux enregistrés sur cet appareil</li><li>Fonctionne au stylet et au doigt</li></ul>' +
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
              '<div class="acc-foot">' +
                '<div class="acc-tip"><b>💡 Astuce</b><span>' + ASTUCES[Math.floor(Math.random() * ASTUCES.length)] + '</span></div>' +
                '<label class="acc-never"><input type="checkbox"> Ne plus afficher</label>' +
              '</div>' +
            '</div>';
        document.body.appendChild(root);

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
        root.querySelector('.acc-close').addEventListener('click', hide);
        root.querySelector('.acc-never input').addEventListener('change', function (e) {
            try {
                if (e.target.checked) localStorage.setItem(HIDE_KEY, '1');
                else localStorage.removeItem(HIDE_KEY);
            } catch (err) {}
        });

        // Disparaît dès qu'on commence à travailler
        var b = document.getElementById('board');
        if (b) {
            observer = new MutationObserver(function () { if (!boardIsEmpty()) hide(); });
            observer.observe(b, { childList: true });
            b.addEventListener('pointerdown', hide, { once: true });
        }
        var tb = document.getElementById('draw-toolbar');
        if (tb) new MutationObserver(function () {
            if (tb.style.display && tb.style.display !== 'none') hide();
        }).observe(tb, { attributes: true, attributeFilter: ['style'] });
        document.addEventListener('keydown', onKey);
    }

    function onKey(e) { if (e.key === 'Escape') hide(); }

    function hide() {
        if (!root || root.classList.contains('acc-hide')) return;
        root.classList.add('acc-hide');
        clearInterval(clockTimer);
        if (observer) observer.disconnect();
        document.removeEventListener('keydown', onKey);
        var r = root;
        setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 380);
    }
    window.hideAccueil = hide;

    // Affichage une fois le tableau restauré (board.js termine son
    // chargement environ 1 s après window.onload)
    window.addEventListener('load', function () {
        setTimeout(function () {
            if (document.body.classList.contains('presentation-mode')) return;
            if (boardIsEmpty()) build();
        }, 1200);
    });
})();
