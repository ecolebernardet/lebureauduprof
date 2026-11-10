// =========================================================================
// FORMULAIRE « CONTACT » — Le Bureau du Prof
// -------------------------------------------------------------------------
// Envoi d'un message à l'auteur (suggestion, bug, merci…) par Web3Forms.
// Ouverture : openContactForm()  (pastille « ? », clic droit, accueil,
//             fenêtre « À propos »)
// Fermeture : closeContactForm(), bouton ✕, clic sur le fond grisé
//             ou touche Échap.
//
// - Les messages arrivent dans la boîte mail liée à la clé Web3Forms.
// - Pour changer de clé : modifier CONTACT_ACCESS_KEY ci-dessous.
// - Le numéro de version (version.js, window.APP_VERSION) est affiché
//   sous le bouton « Envoyer » et joint à chaque message.
// - En bas du formulaire, un lien « Soutenir sur Tipeee » (adresse lue
//   dans donateurs.js, DONATEURS_LIEN, sinon TIPEEE_DEFAUT ci-dessous),
//   puis un bouton « Partager » (partagerBureauDuProf, dans partage.js).
//
// Installation : <script src="contact.js"></script> dans index.html
// (le CSS et le HTML sont injectés par ce fichier).
// =========================================================================
(function () {

    // ── Clé Web3Forms : à modifier ici ───────────────────────────────────
    var CONTACT_ACCESS_KEY = '023db423-3526-40d8-b585-328fc2352ed9';
    var CONTACT_URL = 'https://api.web3forms.com/submit';

    // ── Lien Tipeee : celui de donateurs.js (DONATEURS_LIEN) s'il existe,
    //    sinon cette adresse par défaut ────────────────────────────────────
    var TIPEEE_DEFAUT = 'https://fr.tipeee.com/lebureauduprof/';
    function lienTipeee() {
        var l = String(window.DONATEURS_LIEN || '').trim();
        return /^https?:\/\//i.test(l) ? l : TIPEEE_DEFAUT;
    }

    // ── CSS ──────────────────────────────────────────────────────────────
    var CSS = [
        '#contact-overlay {',
        '    position: fixed; inset: 0; z-index: 70000;',
        '    display: none; align-items: center; justify-content: center;',
        '    background: rgba(10, 10, 20, 0.55);',
        '    padding: 16px; box-sizing: border-box;',
        '    animation: fadeInOverlay .18s ease;',
        '}',
        '#contact-overlay.open { display: flex; }',
        '#contact-box {',
        '    width: 100%; max-width: 460px; max-height: calc(100vh - 32px); overflow-y: auto;',
        '    box-sizing: border-box;',
        '    background: #1c1a26; color: #ecebf3;',
        '    border: 1px solid #2c2838; border-radius: 18px;',
        '    box-shadow: 0 18px 50px rgba(0,0,0,0.5);',
        "    font-family: 'Quicksand', 'Nunito', sans-serif;",
        '    animation: slideUpModal .22s ease;',
        '}',
        '#contact-head {',
        '    display: flex; align-items: center; justify-content: space-between; gap: 10px;',
        '    padding: 12px 16px;',
        '    background: linear-gradient(120deg, #4a90e2 0%, #2f6fc4 100%);',
        '    border-radius: 18px 18px 0 0; color: #fff;',
        '}',
        '#contact-head h3 { margin: 0; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px; }',
        '#contact-close {',
        '    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;',
        '    background: rgba(255,255,255,0.2); color: #fff; font-size: 15px;',
        '    display: flex; align-items: center; justify-content: center; flex-shrink: 0;',
        '}',
        '#contact-close:hover { background: rgba(255,255,255,0.35); }',
        '#contact-form { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; }',
        '#contact-form .ct-intro { margin: 0; font-size: 13px; line-height: 1.4; color: #b9b6c8; }',
        '#contact-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: #c9c6d6; }',
        '#contact-form .ct-opt { font-weight: 400; opacity: .7; }',
        '#contact-form input[type=text],',
        '#contact-form input[type=email],',
        '#contact-form textarea {',
        '    box-sizing: border-box; width: 100%;',
        '    background: #24212f; color: #ecebf3;',
        '    border: 1px solid #34303f; border-radius: 10px;',
        '    padding: 9px 11px; font-size: 14px; font-family: inherit !important; outline: none;',
        '}',
        '#contact-form textarea { min-height: 120px; resize: vertical; }',
        '#contact-form input:focus, #contact-form textarea:focus { border-color: #4a90e2; box-shadow: 0 0 0 3px rgba(74,144,226,0.25); }',
        '#contact-form .ct-row { display: flex; gap: 8px; }',
        '#contact-form .ct-row > label { flex: 1; min-width: 0; }',
        '#contact-types { display: flex; gap: 6px; flex-wrap: wrap; }',
        '#contact-types input { position: absolute; opacity: 0; pointer-events: none; }',
        '#contact-types label {',
        '    flex-direction: row; align-items: center; cursor: pointer;',
        '    padding: 6px 12px; border-radius: 999px; font-size: 12.5px;',
        '    background: #24212f; border: 1px solid #34303f; color: #c9c6d6;',
        '}',
        '#contact-types input:checked + span { color: #fff; }',
        '#contact-types label:has(input:checked) { background: #4a90e2; border-color: #4a90e2; color: #fff; }',
        '#contact-types input:focus-visible + span { outline: 2px solid #4a90e2; outline-offset: 3px; border-radius: 4px; }',
        '#contact-send {',
        '    margin-top: 4px; padding: 11px; border: none; border-radius: 12px; cursor: pointer;',
        '    background: #4a90e2; color: #fff; font-size: 14px; font-weight: 800; font-family: inherit !important;',
        '    box-shadow: 0 4px 12px rgba(74,144,226,0.4);',
        '}',
        '#contact-send:hover { filter: brightness(1.07); }',
        '#contact-send:disabled { opacity: .6; cursor: wait; }',
        '#contact-status { min-height: 18px; font-size: 13px; font-weight: 700; text-align: center; }',
        '#contact-status.ok  { color: #4fd18b; }',
        '#contact-status.err { color: #ff8a8a; }',
        '.ct-honeypot { display: none !important; }',
        '#contact-version { margin-top: -6px; font-size: 11px; text-align: center; color: #8a8698; }',
        '#contact-version:empty { display: none; }',
        /* Soutenir sur Tipeee */
        '#contact-tipeee {',
        '    display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 12px;',
        '    background: linear-gradient(120deg, #35202c, #2a2238); border: 1px solid #4a2d3e;',
        '    font-size: 12.5px; line-height: 1.35; color: #e3dcf2;',
        '}',
        '#contact-tipeee span { flex: 1; min-width: 0; }',
        '#contact-tipeee a {',
        '    flex-shrink: 0; padding: 6px 12px; border-radius: 999px; text-decoration: none; white-space: nowrap;',
        '    font-weight: 800; font-size: 12.5px; color: #fff;',
        '    background: linear-gradient(120deg, #e84393, #d6336c); box-shadow: 0 3px 10px rgba(214,51,108,.3);',
        '}',
        '#contact-tipeee a:hover { filter: brightness(1.06); }',
        'body.menu-light #contact-tipeee { background: linear-gradient(120deg, #fff0f5, #f4efff); border-color: #f0d4e4; color: #4a3d66; }',
        /* Faire connaître (partage.js) */
        '#contact-partage {',
        '    display: flex; align-items: center; gap: 10px; margin-top: -2px; padding: 9px 12px; border-radius: 12px;',
        '    background: linear-gradient(120deg, #1d3328, #1f2a33); border: 1px solid #2c4a3a;',
        '    font-size: 12.5px; line-height: 1.35; color: #e3dcf2;',
        '}',
        '#contact-partage span { flex: 1; min-width: 0; }',
        '#contact-partage-btn {',
        '    flex-shrink: 0; padding: 6px 12px; border-radius: 999px; border: none; cursor: pointer; white-space: nowrap;',
        '    font-weight: 800; font-size: 12.5px; color: #fff; font-family: inherit !important;',
        '    background: linear-gradient(120deg, #2ecc71, #1fa85a); box-shadow: 0 3px 10px rgba(46,204,113,.3);',
        '}',
        '#contact-partage-btn:hover { filter: brightness(1.06); }',
        'body.menu-light #contact-partage { background: linear-gradient(120deg, #ecfbf2, #eef5fb); border-color: #c9ecd7; color: #2f4a3c; }',
        /* Mode clair */
        'body.menu-light #contact-box { background: #f5f4f8; color: #2a2440; border-color: #dddbe6; box-shadow: 0 18px 50px rgba(0,0,0,0.25); }',
        'body.menu-light #contact-form .ct-intro { color: #5c5870; }',
        'body.menu-light #contact-form label { color: #3a3650; }',
        'body.menu-light #contact-form input[type=text],',
        'body.menu-light #contact-form input[type=email],',
        'body.menu-light #contact-form textarea { background: #fff; color: #2a2440; border-color: #e4e2ec; }',
        'body.menu-light #contact-types label { background: #fff; border-color: #e4e2ec; color: #3a3650; }',
        'body.menu-light #contact-types label:has(input:checked) { background: #4a90e2; border-color: #4a90e2; color: #fff; }',
        'body.menu-light #contact-status.ok  { color: #1e8a4c; }',
        'body.menu-light #contact-status.err { color: #d33a3f; }',
        /* Petit écran */
        '@media (max-width: 480px) {',
        '    #contact-form .ct-row { flex-direction: column; }',
        '}'
    ].join('\n');

    // ── Contenu ──────────────────────────────────────────────────────────
    var HTML =
        '<div id="contact-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-title">' +
          '<div id="contact-box">' +
            '<div id="contact-head">' +
              '<h3 id="contact-title">💬 Contact</h3>' +
              '<button type="button" id="contact-close" title="Fermer" aria-label="Fermer">✕</button>' +
            '</div>' +
            '<form id="contact-form" novalidate>' +
              '<p class="ct-intro">Une suggestion, un bug, un mot gentil… Votre message arrive directement à l\'auteur du Bureau du Prof.</p>' +

              '<div id="contact-types" role="radiogroup" aria-label="Type de message">' +
                '<label><input type="radio" name="ct_type" value="Suggestion" checked><span>💡 Suggestion</span></label>' +
                '<label><input type="radio" name="ct_type" value="Bug"><span>🐞 Bug</span></label>' +
                '<label><input type="radio" name="ct_type" value="Remerciement"><span>❤️ Merci</span></label>' +
                '<label><input type="radio" name="ct_type" value="Autre"><span>✉️ Autre</span></label>' +
              '</div>' +

              '<label>Votre message' +
                '<textarea name="message" id="contact-message" required maxlength="5000" placeholder="Écrivez ici…"></textarea>' +
              '</label>' +

              '<div class="ct-row">' +
                '<label>Nom <span class="ct-opt">(facultatif)</span>' +
                  '<input type="text" name="name" id="contact-name" maxlength="100" autocomplete="name">' +
                '</label>' +
                '<label>E-mail <span class="ct-opt">(pour une réponse)</span>' +
                  '<input type="email" name="email" id="contact-email" maxlength="200" autocomplete="email">' +
                '</label>' +
              '</div>' +

              // Piège à robots : invisible pour les humains
              '<input type="checkbox" name="botcheck" class="ct-honeypot" tabindex="-1" autocomplete="off">' +

              '<button type="submit" id="contact-send">Envoyer</button>' +
              '<div id="contact-status" aria-live="polite"></div>' +
              '<div id="contact-version"></div>' +
              '<div id="contact-tipeee">' +
                '<span>Envie d\'aller plus loin ? Votre soutien aide le Bureau du Prof à rester gratuit.</span>' +
                '<a id="contact-tipeee-lien" href="https://fr.tipeee.com/lebureauduprof/" target="_blank" rel="noopener">❤️ Soutenir sur Tipeee</a>' +
              '</div>' +
              '<div id="contact-partage">' +
                '<span>Le site vous plaît ? Faites-le connaître à vos collègues.</span>' +
                '<button type="button" id="contact-partage-btn">📣 Partager</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>';

    // ── Injection ────────────────────────────────────────────────────────
    var style = document.createElement('style');
    style.id = 'contact-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', HTML);

    // ── Ouverture / fermeture ────────────────────────────────────────────
    var overlay = document.getElementById('contact-overlay');
    var form    = document.getElementById('contact-form');
    var status  = document.getElementById('contact-status');
    var sendBtn = document.getElementById('contact-send');
    var lastFocus = null;
    function F(n) { return form.elements[n]; }   // champ du formulaire par son nom

    function setStatus(text, cls) {
        status.textContent = text || '';
        status.className = cls || '';
    }

    function openContactForm() {
        lastFocus = document.activeElement;
        // Mémorise nom / e-mail d'une fois sur l'autre (sur cet appareil uniquement)
        try {
            var saved = JSON.parse(localStorage.getItem('contactIdentity') || '{}');
            if (saved.name  && !F('name').value)  F('name').value  = saved.name;
            if (saved.email && !F('email').value) F('email').value = saved.email;
        } catch (e) {}
        setStatus('');
        sendBtn.disabled = false;
        // Numéro de version (version.js)
        var ver = document.getElementById('contact-version');
        if (ver) ver.textContent = window.APP_VERSION ? 'Le Bureau du Prof · version ' + window.APP_VERSION : '';
        var tip = document.getElementById('contact-tipeee-lien');
        if (tip) tip.href = lienTipeee();
        overlay.classList.add('open');
        setTimeout(function () { document.getElementById('contact-message').focus(); }, 50);
    }

    function closeContactForm() {
        overlay.classList.remove('open');
        if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus(); } catch (e) {} }
    }

    window.openContactForm  = openContactForm;
    window.closeContactForm = closeContactForm;

    document.getElementById('contact-close').addEventListener('click', closeContactForm);
    // « Partager » : ouvre la fenêtre de partage (partage.js) par-dessus le formulaire
    document.getElementById('contact-partage-btn').addEventListener('click', function () {
        if (typeof partagerBureauDuProf === 'function') partagerBureauDuProf();
    });
    // Clic sur le fond grisé : ferme la fenêtre
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeContactForm(); });

    // Les touches tapées dans le formulaire ne déclenchent pas les raccourcis du tableau
    // (Suppr, Ctrl+C/V, Alt+1…). Échap ferme la fenêtre.
    overlay.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); closeContactForm(); }
    });
    ['keyup', 'keypress', 'paste', 'copy', 'cut'].forEach(function (evt) {
        overlay.addEventListener(evt, function (e) { e.stopPropagation(); });
    });

    // ── Envoi ────────────────────────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var message = F('message').value.trim();
        var email   = F('email').value.trim();
        var name    = F('name').value.trim();
        var type    = (form.querySelector('input[name=ct_type]:checked') || {}).value || 'Autre';

        if (!message) {
            setStatus('Merci d\'écrire un message avant d\'envoyer.', 'err');
            F('message').focus();
            return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('L\'adresse e-mail ne semble pas valide.', 'err');
            F('email').focus();
            return;
        }
        if (!navigator.onLine) {
            setStatus('Pas de connexion internet : le message ne peut pas partir pour l\'instant.', 'err');
            return;
        }

        try { localStorage.setItem('contactIdentity', JSON.stringify({ name: name, email: email })); } catch (err) {}

        var payload = {
            access_key: CONTACT_ACCESS_KEY,
            subject:    'Le Bureau du Prof – ' + type,
            from_name:  'Le Bureau du Prof',
            name:       name || 'Anonyme',
            type:       type,
            message:    message,
            version:    window.APP_VERSION || '?',
            page:       location.href,
            navigateur: navigator.userAgent,
            botcheck:   F('botcheck').checked
        };
        if (email) { payload.email = email; payload.replyto = email; }

        sendBtn.disabled = true;
        setStatus('Envoi en cours…', '');

        fetch(CONTACT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (res) {
            if (res && res.success) {
                F('message').value = '';
                setStatus('✅ Merci ! Votre message a bien été envoyé.', 'ok');
                setTimeout(function () {
                    if (overlay.classList.contains('open')) closeContactForm();
                }, 2200);
            } else {
                sendBtn.disabled = false;
                setStatus('L\'envoi a échoué' + (res && res.message ? ' (' + res.message + ')' : '') + '. Réessayez dans un moment.', 'err');
            }
        })
        .catch(function () {
            sendBtn.disabled = false;
            setStatus('L\'envoi a échoué (connexion). Réessayez dans un moment.', 'err');
        });
    });
})();
