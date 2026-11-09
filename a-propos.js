// =========================================================================
// FENÊTRE « À PROPOS » — Le Bureau du Prof
// -------------------------------------------------------------------------
// Version de l'application, vos données, crédits.
// Ouverture : openAboutModal()  (pastille « ? », écran d'accueil, aide)
// Fermeture : closeAboutModal(), bouton ✕, « Fermer », clic sur le fond
//             grisé ou touche Échap.
//
// Le numéro de version est défini ici (APP_VERSION) et exposé dans
// window.APP_VERSION : la modale d'aide (help-modal.js) le lit aussi.
//
// Installation : <script src="a-propos.js"></script> dans index.html
// (le CSS et le HTML sont injectés par ce fichier).
// =========================================================================
(function () {

    // ── Numéro de version : à modifier ici ───────────────────────────────
    var APP_VERSION = '4.3';
    window.APP_VERSION = APP_VERSION;

    // ── CSS (même style que le formulaire « Remarques ») ─────────────────
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
        /* Mode clair */
        'body.menu-light #about-box { background: #f5f4f8; color: #2a2440; border-color: #dddbe6; box-shadow: 0 18px 50px rgba(0,0,0,0.25); }',
        'body.menu-light #about-body .ab-hero { border-bottom-color: #dddbe6; }',
        'body.menu-light #about-body .ab-author { color: #5c5870; }',
        'body.menu-light #about-body .ab-version { background: #e3eefb; color: #2f6fc4; }',
        'body.menu-light #about-body h4 { color: #2f6fc4; }',
        'body.menu-light #about-body p, body.menu-light #about-body ul { color: #3a3650; }',
        'body.menu-light #about-body a { color: #2f6fc4; }',
        'body.menu-light #about-body .ab-actions button { background: #fff; border-color: #e4e2ec; color: #2a2440; }',
        'body.menu-light #about-body .ab-actions button.ab-primary { background: #4a90e2; border-color: #4a90e2; color: #fff; }'
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

              '<h4>Vos données</h4>' +
              '<ul>' +
                '<li><strong>Aucune donnée personnelle n\'est stockée sur un serveur.</strong> Vos tableaux, listes de classe, prénoms d\'élèves et réglages restent dans votre navigateur, sur cet appareil.</li>' +
                '<li>Pensez à exporter vos tableaux (panneau « Tableaux ») pour en garder une copie : vider les données du navigateur les efface.</li>' +
                '<li>La fréquentation du site est mesurée avec Google Analytics et GoatCounter.</li>' +
                '<li>Certains widgets font appel à des services extérieurs quand vous les utilisez (YouTube, Google Maps, Qwant Junior…). Le formulaire « Remarques » passe par Web3Forms : seul ce que vous choisissez d\'y écrire est envoyé.</li>' +
              '</ul>' +

              '<h4>Crédits</h4>' +
              '<ul>' +
                '<li>Polices : Nunito, Quicksand, Andika, Baloo et OpenDyslexic (licence SIL Open Font License), Marelle, Belle Allure GS, KG Perfect Penmanship et MDI école (selon les conditions de leurs auteurs).</li>' +
                '<li>Émojis animés : Noto Emoji, Google.</li>' +
              '</ul>' +

              '<div class="ab-actions">' +
                '<button type="button" data-about="remarques">💬 Envoyer une remarque</button>' +
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
    // Boutons « Envoyer une remarque » et « Fermer »
    overlay.addEventListener('click', function (e) {
        var b = e.target.closest('[data-about]');
        if (!b) return;
        closeAboutModal();
        if (b.dataset.about === 'remarques' && typeof openContactForm === 'function') openContactForm();
    });
    // Les touches ne déclenchent pas les raccourcis du tableau ; Échap ferme la fenêtre
    overlay.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); closeAboutModal(); }
    });
})();
