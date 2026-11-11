// =========================================================================
// FENÊTRE « À PROPOS » — Le Bureau du Prof
// -------------------------------------------------------------------------
// Version de l'application, soutien (Tipeee), vos données, crédits.
// Lien vers « Mentions légales et données » : openMentionsLegales()
// (mentions-legales.js).
// Bouton « Faire connaître » : partagerBureauDuProf() (partage.js).
// Ouverture : openAboutModal()  (pastille « ? », écran d'accueil, aide)
// Fermeture : closeAboutModal(), bouton ✕, « Fermer », clic sur le fond
//             grisé ou touche Échap.
//
// Le numéro de version est défini dans version.js (window.APP_VERSION),
// à charger avant ce fichier.
//
// Installation : <script src="a-propos.js"></script> dans index.html
// (le CSS et le HTML sont injectés par ce fichier).
// =========================================================================
(function () {

    // ── Numéro de version : défini dans version.js ───────────────────────
    var APP_VERSION = String(window.APP_VERSION || '');

    // ── Lien Tipeee : celui de donateurs.js (DONATEURS_LIEN) s'il existe,
    //    sinon cette adresse par défaut ────────────────────────────────────
    var TIPEEE_DEFAUT = 'https://fr.tipeee.com/lebureauduprof/';
    function lienTipeee() {
        var l = String(window.DONATEURS_LIEN || '').trim();
        return /^https?:\/\//i.test(l) ? l : TIPEEE_DEFAUT;
    }

    // ── CSS (même style que le formulaire « Contact ») ──────────────────
    var CSS = [
        '#about-overlay {',
        '    position: fixed; inset: 0; z-index: 70000;',
        '    display: none; align-items: center; justify-content: center;',
        '    background: rgba(10, 10, 20, 0.55); padding: 16px; box-sizing: border-box;',
        '}',
        '#about-overlay.open { display: flex; }',
        '#about-box {',
        '    width: 100%; max-width: 480px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box;',
        '    background: #1c1a26; color: #ecebf3; border: 1px solid #2c2838; border-radius: 18px;',
        '    box-shadow: 0 18px 50px rgba(0,0,0,0.5);',
        "    font-family: 'Quicksand', 'Nunito', sans-serif;",
        '}',
        '#about-head {',
        '    display: flex; align-items: center; justify-content: space-between; gap: 10px;',
        '    padding: 12px 16px; color: #fff; border-radius: 18px 18px 0 0;',
        '    background: linear-gradient(120deg, #4a90e2 0%, #2f6fc4 100%);',
        '}',
        '#about-head h3 { margin: 0; font-size: 18px; font-weight: 800; }',
        '#about-close {',
        '    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;',
        '    background: rgba(255,255,255,0.2); color: #fff; font-size: 15px;',
        '    display: flex; align-items: center; justify-content: center;',
        '}',
        '#about-close:hover { background: rgba(255,255,255,0.35); }',
        '#about-body { padding: 14px 18px 18px; font-size: 13.5px; line-height: 1.5; }',
        '#about-body .ab-hero { text-align: center; padding: 4px 0 12px; border-bottom: 1px solid #2c2838; margin-bottom: 10px; }',
        '#about-body .ab-name { font-size: 20px; font-weight: 800; }',
        '#about-body .ab-version {',
        '    display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 999px;',
        '    background: rgba(74,144,226,0.2); color: #9cc6f5; font-size: 12px; font-weight: 800;',
        '}',
        '#about-body .ab-author { margin-top: 6px; color: #b9b6c8; }',
        '#about-body h4 { margin: 12px 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #8fb8ea; }',
        '#about-body p, #about-body ul { margin: 0 0 6px; color: #d5d3df; }',
        '#about-body ul { padding-left: 18px; }',
        '#about-body li { margin: 2px 0; }',
        '#about-body a { color: #7ab8f5; }',
        '#about-body .ab-actions { display: flex; gap: 8px; margin-top: 14px; }',
        '#about-body .ab-actions button {',
        '    flex: 1; padding: 9px; border-radius: 10px; cursor: pointer; font-weight: 800; font-size: 13px;',
        '    font-family: inherit !important; border: 1px solid #34303f; background: #24212f; color: #ecebf3;',
        '}',
        '#about-body .ab-actions button.ab-primary { background: #4a90e2; border-color: #4a90e2; color: #fff; }',
        '#about-body .ab-actions button.ab-share { background: #2ecc71; border-color: #2ecc71; color: #fff; }',
        'body.menu-light #about-body .ab-actions button.ab-share { background: #2ecc71; border-color: #2ecc71; color: #fff; }',
        /* Soutenir le projet */
        '#about-body .ab-soutien {',
        '    display: flex; align-items: center; gap: 12px; margin: 4px 0 6px; padding: 10px 12px; border-radius: 12px;',
        '    background: linear-gradient(120deg, #35202c, #2a2238); border: 1px solid #4a2d3e;',
        '}',
        '#about-body .ab-soutien p { flex: 1; margin: 0; }',
        '#about-body a.ab-tipeee {',
        '    flex-shrink: 0; padding: 7px 14px; border-radius: 999px; text-decoration: none; white-space: nowrap;',
        '    font-weight: 800; font-size: 13px; color: #fff;',
        '    background: linear-gradient(120deg, #e84393, #d6336c); box-shadow: 0 3px 10px rgba(214,51,108,.3);',
        '}',
        '#about-body a.ab-tipeee:hover { filter: brightness(1.06); }',
        'body.menu-light #about-body .ab-soutien { background: linear-gradient(120deg, #fff0f5, #f4efff); border-color: #f0d4e4; }',
        'body.menu-light #about-body a.ab-tipeee { color: #fff; }',
        /* Mode clair */
        'body.menu-light #about-box { background: #f5f4f8; color: #2a2440; border-color: #dddbe6; box-shadow: 0 18px 50px rgba(0,0,0,0.25); }',
        'body.menu-light #about-body .ab-hero { border-bottom-color: #dddbe6; }',
        'body.menu-light #about-body .ab-author { color: #5c5870; }',
        'body.menu-light #about-body .ab-version { background: #e3eefb; color: #2f6fc4; }',
        'body.menu-light #about-body h4 { color: #2f6fc4; }',
        'body.menu-light #about-body p, body.menu-light #about-body ul { color: #3a3650; }',
        'body.menu-light #about-body a { color: #2f6fc4; }',
        'body.menu-light #about-body .ab-actions button { background: #fff; border-color: #e4e2ec; color: #2a2440; }',
        'body.menu-light #about-body .ab-actions button.ab-primary { background: #4a90e2; border-color: #4a90e2; color: #fff; }',

        /* ── TÉLÉPHONE ─────────────────────────────────────────────────
           Même condition que style-phone.css (et PHONE_MEDIA_QUERY de
           board.js) : à modifier ensemble.
           Portrait : panneau qui monte du bas, pleine largeur.
           Paysage  : fenêtre centrée, compacte, boutons sur une ligne. */
        '@media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {',
        '    #about-overlay { padding: 0; }',
        '    #about-box {',
        '        max-height: calc(100vh - 16px); max-height: calc(100dvh - 16px);',
        '        overscroll-behavior: contain; -webkit-overflow-scrolling: touch;',
        '    }',
        /* En-tête collé en haut quand on fait défiler */
        '    #about-head { position: sticky; top: 0; z-index: 1; padding: 10px 12px 10px 16px; }',
        '    #about-head h3 { font-size: 17px; }',
        '    #about-close { width: 40px; height: 40px; font-size: 17px; }',
        '    #about-body { padding: 12px 16px 16px; font-size: 14px; }',
        '    #about-body .ab-hero { padding: 2px 0 10px; }',
        '    #about-body .ab-name { font-size: 19px; }',
        '    #about-body .ab-author { font-size: 13px; line-height: 1.4; }',
        '    #about-body .ab-author a { display: inline-block; padding: 2px 0; }',
        '    #about-body h4 { margin-top: 14px; }',
        '    #about-body ul { padding-left: 16px; }',
        '    #about-body li { margin: 4px 0; }',
        '    #about-body a.ab-tipeee { display: flex; align-items: center; justify-content: center; min-height: 44px; box-sizing: border-box; }',
        '    #about-body .ab-actions button { min-height: 44px; padding: 8px 6px; line-height: 1.2; }',
        '}',

        /* Portrait (écran étroit) : panneau du bas */
        '@media (max-width: 600px) {',
        '    #about-overlay {',
        '        align-items: flex-end;',
        '        padding-top: env(safe-area-inset-top);',
        '    }',
        '    #about-box {',
        '        max-width: 100%; border-radius: 20px 20px 0 0; border-bottom: none;',
        '        max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px - env(safe-area-inset-top));',
        '        padding-bottom: env(safe-area-inset-bottom);',
        '        animation: ab-slide-up .22s ease-out;',
        '    }',
        '    #about-head { border-radius: 20px 20px 0 0; }',
        /* Soutien : texte au-dessus, bouton Tipeee pleine largeur dessous */
        '    #about-body .ab-soutien { flex-direction: column; align-items: stretch; gap: 10px; }',
        '    #about-body a.ab-tipeee { width: 100%; }',
        /* Boutons : Contacter + Faire connaître côte à côte, Fermer dessous */
        '    #about-body .ab-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }',
        '    #about-body .ab-actions button.ab-primary { grid-column: 1 / -1; }',
        '}',
        '@keyframes ab-slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }',

        /* Paysage (téléphone couché) : fenêtre centrée, marges réduites */
        '@media (min-width: 601px) and (max-height: 500px) and (pointer: coarse) {',
        '    #about-overlay {',
        '        padding: 8px calc(8px + env(safe-area-inset-right)) 8px calc(8px + env(safe-area-inset-left));',
        '    }',
        '    #about-box { max-width: 560px; }',
        '    #about-head { padding-top: 6px; padding-bottom: 6px; }',
        '    #about-body .ab-hero { padding-bottom: 8px; }',
        '    #about-body .ab-actions button { min-height: 40px; }',
        '}',

        '@media (prefers-reduced-motion: reduce) { #about-box { animation: none !important; } }'
    ].join('\n');

    // ── Contenu ──────────────────────────────────────────────────────────
    var HTML =
        '<div id="about-overlay" role="dialog" aria-modal="true" aria-labelledby="about-title">' +
          '<div id="about-box">' +
            '<div id="about-head">' +
              '<h3 id="about-title">ℹ️ À propos</h3>' +
              '<button type="button" id="about-close" title="Fermer" aria-label="Fermer">✕</button>' +
            '</div>' +
            '<div id="about-body">' +
              '<div class="ab-hero">' +
                '<div class="ab-name">Le Bureau du Prof</div>' +
                '<div class="ab-version">Version <span id="about-version"></span></div>' +
                '<div class="ab-author">Conçu par Nicolas BERNARDET · <a href="https://lebureauduprof.fr/" target="_blank" rel="noopener">lebureauduprof.fr</a></div>' +
              '</div>' +

              '<p>Un tableau blanc numérique gratuit pour la classe : jeux, leçons, activités, outils et widgets à projeter au tableau.</p>' +

              '<h4>Soutenir le projet</h4>' +
              '<div class="ab-soutien">' +
                '<p>Le Bureau du Prof est gratuit et sans publicité. Si vous l\'appréciez, vous pouvez soutenir son développement : votre nom apparaîtra sur l\'écran d\'accueil.</p>' +
                '<a class="ab-tipeee" id="about-tipeee" href="https://fr.tipeee.com/lebureauduprof/" target="_blank" rel="noopener">❤️ Soutenir sur Tipeee</a>' +
              '</div>' +

              '<h4>Vos données</h4>' +
              '<ul>' +
                '<li><strong>Aucune donnée personnelle n\'est stockée sur un serveur.</strong> Vos tableaux, listes de classe, prénoms d\'élèves et réglages restent dans votre navigateur, sur cet appareil.</li>' +
                '<li>Pensez à exporter vos tableaux (panneau « Tableaux ») pour en garder une copie : vider les données du navigateur les efface.</li>' +
                '<li>La fréquentation du site est mesurée avec GoatCounter, <strong>sans cookie</strong> et de façon anonyme.</li>' +
                '<li>Certains widgets font appel à des services extérieurs quand vous les utilisez (YouTube, Google Maps, Qwant Junior…). Le formulaire « Contact » passe par Web3Forms : seul ce que vous choisissez d\'y écrire est envoyé.</li>' +
              '</ul>' +
              '<p>Tout le détail, l\'hébergeur et le bouton « Effacer mes données » : <a href="#" data-about="mentions">⚖️ Mentions légales et données</a>.</p>' +

              '<h4>Crédits</h4>' +
              '<ul>' +
                '<li>Polices : Nunito, Quicksand, Andika, Baloo et OpenDyslexic (licence SIL Open Font License), Marelle, Belle Allure GS, KG Perfect Penmanship et MDI école (selon les conditions de leurs auteurs).</li>' +
                '<li>Émojis animés : Noto Emoji, Google.</li>' +
              '</ul>' +

              '<div class="ab-actions">' +
                '<button type="button" data-about="contact">💬 Contacter l\'auteur</button>' +
                '<button type="button" class="ab-share" data-about="share">📣 Faire connaître</button>' +
                '<button type="button" class="ab-primary" data-about="close">Fermer</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

    // ── Injection ────────────────────────────────────────────────────────
    var style = document.createElement('style');
    style.id = 'a-propos-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', HTML);

    var v = document.getElementById('about-version');
    if (v) v.textContent = APP_VERSION;

    // ── Ouverture / fermeture ────────────────────────────────────────────
    var overlay = document.getElementById('about-overlay');
    var lastFocus = null;

    function openAboutModal() {
        lastFocus = document.activeElement;
        var t = document.getElementById('about-tipeee');
        if (t) t.href = lienTipeee();
        if (v) v.textContent = String(window.APP_VERSION || '');
        overlay.classList.add('open');
        setTimeout(function () { document.getElementById('about-close').focus(); }, 50);
    }
    function closeAboutModal() {
        overlay.classList.remove('open');
        if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus(); } catch (e) {} }
    }
    window.openAboutModal  = openAboutModal;
    window.closeAboutModal = closeAboutModal;

    document.getElementById('about-close').addEventListener('click', closeAboutModal);
    // Clic sur le fond grisé : ferme la fenêtre
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeAboutModal(); });
    // Boutons « Contacter l'auteur » et « Fermer »
    overlay.addEventListener('click', function (e) {
        var b = e.target.closest('[data-about]');
        if (!b) return;
        e.preventDefault();
        closeAboutModal();
        if (b.dataset.about === 'contact' && typeof openContactForm === 'function') openContactForm();
        if (b.dataset.about === 'mentions' && typeof openMentionsLegales === 'function') openMentionsLegales();
        if (b.dataset.about === 'share' && typeof partagerBureauDuProf === 'function') partagerBureauDuProf();
    });
    // Les touches ne déclenchent pas les raccourcis du tableau ; Échap ferme la fenêtre
    overlay.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); closeAboutModal(); }
    });
})();
