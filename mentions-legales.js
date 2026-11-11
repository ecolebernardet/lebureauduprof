// =========================================================================
// FENÊTRE « MENTIONS LÉGALES ET DONNÉES » — Le Bureau du Prof
// -------------------------------------------------------------------------
// Mentions légales (éditeur, hébergeur), politique de confidentialité
// (données personnelles, mesure d'audience, services extérieurs, droits)
// et bouton « Effacer mes données de cet appareil ».
// Ouverture : openMentionsLegales()  (pastille « ? », écran d'accueil,
//             fenêtre « À propos », aide, formulaire « Contact »)
// Fermeture : closeMentionsLegales(), bouton ✕, « Fermer », clic sur le
//             fond grisé ou touche Échap.
//
// Le TEXTE de la fenêtre est écrit directement dans index.html (bloc
// <div id="ml-overlay" … hidden>), juste avant la balise de ce script :
// c'est là qu'il faut le modifier (hébergeur, statistiques, services
// extérieurs, date de mise à jour). Ce fichier n'apporte que le style
// et le fonctionnement.
//
// Installation : <script src="mentions-legales.js"></script> dans index.html,
// APRÈS le bloc <div id="ml-overlay">.
// =========================================================================
(function () {

    // ── CSS (même style que « À propos » et « Contact ») ────────────────
    var CSS = [
        '#ml-overlay {',
        '    position: fixed; inset: 0; z-index: 70000;',
        '    display: none; align-items: center; justify-content: center;',
        '    background: rgba(10, 10, 20, 0.55); padding: 16px; box-sizing: border-box;',
        '}',
        '#ml-overlay.open { display: flex; }',
        '#ml-box {',
        '    width: 100%; max-width: 620px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box;',
        '    background: #1c1a26; color: #ecebf3; border: 1px solid #2c2838; border-radius: 18px;',
        '    box-shadow: 0 18px 50px rgba(0,0,0,0.5);',
        "    font-family: 'Quicksand', 'Nunito', sans-serif;",
        '}',
        '#ml-head {',
        '    position: sticky; top: 0; z-index: 1;',
        '    display: flex; align-items: center; justify-content: space-between; gap: 10px;',
        '    padding: 12px 16px; color: #fff; border-radius: 18px 18px 0 0;',
        '    background: linear-gradient(120deg, #4a90e2 0%, #2f6fc4 100%);',
        '}',
        '#ml-head h3 { margin: 0; font-size: 18px; font-weight: 800; }',
        '#ml-close {',
        '    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;',
        '    background: rgba(255,255,255,0.2); color: #fff; font-size: 15px;',
        '    display: flex; align-items: center; justify-content: center;',
        '}',
        '#ml-close:hover { background: rgba(255,255,255,0.35); }',
        '#ml-body { padding: 14px 18px 18px; font-size: 13.5px; line-height: 1.55; }',
        '#ml-body .ml-intro { margin: 0 0 6px; color: #b9b6c8; }',
        '#ml-body h4 { margin: 16px 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #8fb8ea; }',
        '#ml-body p, #ml-body ul { margin: 0 0 6px; color: #d5d3df; }',
        '#ml-body ul { padding-left: 18px; }',
        '#ml-body li { margin: 3px 0; }',
        '#ml-body a { color: #7ab8f5; }',
        '#ml-body .ml-card { padding: 10px 12px; border-radius: 12px; background: #24212f; border: 1px solid #34303f; margin: 4px 0 6px; }',
        '#ml-body .ml-card p { margin: 0; }',
        '#ml-body .ml-maj { margin-top: 14px; font-size: 12px; color: #8a8698; text-align: center; }',
        /* Effacer mes données */
        '#ml-body .ml-erase { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px;',
        '    background: linear-gradient(120deg, #3a1f24, #33261c); border: 1px solid #5a2f33; margin: 4px 0 6px; }',
        '#ml-body .ml-erase p { flex: 1; margin: 0; }',
        '#ml-erase-btn { flex-shrink: 0; padding: 8px 14px; border-radius: 999px; border: none; cursor: pointer; white-space: nowrap;',
        '    font-weight: 800; font-size: 13px; color: #fff; font-family: inherit !important;',
        '    background: linear-gradient(120deg, #e5484d, #c0392b); }',
        '#ml-erase-btn.ml-confirm { background: #fff; color: #c0392b; }',
        '#ml-body .ml-actions { display: flex; gap: 8px; margin-top: 14px; }',
        '#ml-body .ml-actions button {',
        '    flex: 1; padding: 9px; border-radius: 10px; cursor: pointer; font-weight: 800; font-size: 13px;',
        '    font-family: inherit !important; border: 1px solid #34303f; background: #24212f; color: #ecebf3;',
        '}',
        '#ml-body .ml-actions button.ml-primary { background: #4a90e2; border-color: #4a90e2; color: #fff; }',
        /* Mode clair */
        'body.menu-light #ml-box { background: #f5f4f8; color: #2a2440; border-color: #dddbe6; box-shadow: 0 18px 50px rgba(0,0,0,0.25); }',
        'body.menu-light #ml-body .ml-intro { color: #5c5870; }',
        'body.menu-light #ml-body h4 { color: #2f6fc4; }',
        'body.menu-light #ml-body p, body.menu-light #ml-body ul { color: #3a3650; }',
        'body.menu-light #ml-body a { color: #2f6fc4; }',
        'body.menu-light #ml-body .ml-card { background: #fff; border-color: #e4e2ec; }',
        'body.menu-light #ml-body .ml-erase { background: linear-gradient(120deg, #fff1f0, #fff8ee); border-color: #f6cfc9; }',
        'body.menu-light #ml-body .ml-actions button { background: #fff; border-color: #e4e2ec; color: #2a2440; }',
        'body.menu-light #ml-body .ml-actions button.ml-primary { background: #4a90e2; border-color: #4a90e2; color: #fff; }',
        /* Téléphone (même condition que style-phone.css) */
        '@media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {',
        '    #ml-overlay { padding: 0; }',
        '    #ml-box { max-height: calc(100vh - 16px); max-height: calc(100dvh - 16px); overscroll-behavior: contain; }',
        '    #ml-close { width: 40px; height: 40px; font-size: 17px; }',
        '    #ml-body { padding: 12px 16px 16px; font-size: 14px; }',
        '    #ml-body .ml-actions button, #ml-erase-btn { min-height: 44px; }',
        '}',
        '@media (max-width: 600px) {',
        '    #ml-overlay { align-items: flex-end; }',
        '    #ml-box { max-width: 100%; border-radius: 20px 20px 0 0; padding-bottom: env(safe-area-inset-bottom); }',
        '    #ml-head { border-radius: 20px 20px 0 0; }',
        '    #ml-body .ml-erase { flex-direction: column; align-items: stretch; }',
        '}'
    ].join('\n');

    // ── Injection ────────────────────────────────────────────────────────
    var style = document.createElement('style');
    style.id = 'mentions-legales-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    // Le texte (HTML) est écrit directement dans index.html (bloc
    // <div id="ml-overlay">), pour être lisible sans JavaScript.
    if (!document.getElementById('ml-overlay')) return;

    // ── Ouverture / fermeture ────────────────────────────────────────────
    var overlay  = document.getElementById('ml-overlay');
    var eraseBtn = document.getElementById('ml-erase-btn');
    var lastFocus = null, eraseTimer = null;

    function resetErase() {
        clearTimeout(eraseTimer);
        eraseBtn.classList.remove('ml-confirm');
        eraseBtn.textContent = '🗑️ Effacer';
    }

    function openMentionsLegales() {
        lastFocus = document.activeElement;
        resetErase();
        overlay.hidden = false;
        overlay.classList.add('open');
        document.getElementById('ml-box').scrollTop = 0;
        setTimeout(function () { document.getElementById('ml-close').focus(); }, 50);
    }
    function closeMentionsLegales() {
        overlay.classList.remove('open');
        overlay.hidden = true;
        resetErase();
        if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus(); } catch (e) {} }
    }
    window.openMentionsLegales  = openMentionsLegales;
    window.closeMentionsLegales = closeMentionsLegales;

    document.getElementById('ml-close').addEventListener('click', closeMentionsLegales);
    // Clic sur le fond grisé : ferme la fenêtre
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeMentionsLegales(); });
    // « Contacter l'auteur », lien « formulaire Contact » et « Fermer »
    overlay.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ml]');
        if (!b) return;
        e.preventDefault();
        closeMentionsLegales();
        if (b.dataset.ml === 'contact' && typeof openContactForm === 'function') openContactForm();
    });
    // Les touches ne déclenchent pas les raccourcis du tableau ; Échap ferme la fenêtre
    overlay.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); closeMentionsLegales(); }
    });

    // ── Effacer mes données : deux clics (pas de boîte confirm(), qui
    //    bloquerait le navigateur au TBI) ─────────────────────────────────
    eraseBtn.addEventListener('click', function () {
        if (!eraseBtn.classList.contains('ml-confirm')) {
            eraseBtn.classList.add('ml-confirm');
            eraseBtn.textContent = 'Confirmer l\'effacement';
            eraseTimer = setTimeout(resetErase, 5000);   // annulé si pas de 2e clic
            return;
        }
        resetErase();
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
        // Le tableau peut se réenregistrer en quittant la page : on laisse
        // une consigne lue tout en haut d'index.html, qui efface à nouveau
        // avant que le tableau ne soit restauré.
        try { sessionStorage.setItem('ml-effacer', '1'); } catch (e) {}
        location.reload();
    });
})();
