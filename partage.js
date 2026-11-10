// =========================================================================
// PARTAGE — Le Bureau du Prof
// -------------------------------------------------------------------------
// Petite fenêtre « Faire connaître le Bureau du Prof » :
//   - un message tout prêt (modifiable) avec le lien du site
//   - boutons : Copier, E-mail, WhatsApp, Facebook, et « Autres… »
//     (partage natif du téléphone / de l'ordinateur, s'il existe)
// Ouverture : partagerBureauDuProf()  (écran d'accueil, À propos, Aide,
//             Contact)
// Fermeture : bouton ✕, « Fermer », clic sur le fond grisé ou Échap.
//
// Pour changer le texte ou l'adresse : modifier PARTAGE_URL et
// PARTAGE_MESSAGE ci-dessous.
//
// Installation : <script src="partage.js"></script> dans index.html
// (le CSS et le HTML sont injectés par ce fichier).
// =========================================================================
(function () {

    // ── Texte partagé : à modifier ici ───────────────────────────────────
    var PARTAGE_URL   = 'https://lebureauduprof.fr/';
    var PARTAGE_TITRE = 'Le Bureau du Prof';
    var PARTAGE_MESSAGE =
        'Je te conseille Le Bureau du Prof : un tableau blanc numérique gratuit, ' +
        'sans pub et sans compte, pour le TBI, le VPI ou l\'ordinateur. ' +
        'Jeux, leçons, activités, outils de classe, annotation de PDF… ' +
        'Tout est prêt à projeter !';

    // ── Icônes ───────────────────────────────────────────────────────────
    var ICO = {
        copier: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
        mail:   '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
        wa:     '<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.5z"/><path d="M9 8.5c.3 2.6 2.4 5 5.5 6l1.3-1.3-1.8-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-1.8z"/>',
        fb:     '<path d="M14 21v-7.5h2.6l.4-3H14V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9v2.3H8.5v3H11V21"/>',
        autre:  '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'
    };
    function svg(k) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + '</svg>';
    }

    // ── CSS (même style que « À propos » et « Contact ») ────────────────
    var CSS = [
        '#partage-overlay {',
        '    position: fixed; inset: 0; z-index: 71000;',
        '    display: none; align-items: center; justify-content: center;',
        '    background: rgba(10, 10, 20, 0.55); padding: 16px; box-sizing: border-box;',
        '}',
        '#partage-overlay.open { display: flex; }',
        '#partage-box {',
        '    width: 100%; max-width: 440px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box;',
        '    background: #1c1a26; color: #ecebf3; border: 1px solid #2c2838; border-radius: 18px;',
        '    box-shadow: 0 18px 50px rgba(0,0,0,0.5);',
        "    font-family: 'Quicksand', 'Nunito', sans-serif;",
        '}',
        '#partage-head {',
        '    display: flex; align-items: center; justify-content: space-between; gap: 10px;',
        '    padding: 12px 16px; color: #fff; border-radius: 18px 18px 0 0;',
        '    background: linear-gradient(120deg, #2ecc71 0%, #1fa85a 100%);',
        '}',
        '#partage-head h3 { margin: 0; font-size: 18px; font-weight: 800; }',
        '#partage-close {',
        '    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;',
        '    background: rgba(255,255,255,0.22); color: #fff; font-size: 15px;',
        '    display: flex; align-items: center; justify-content: center;',
        '}',
        '#partage-close:hover { background: rgba(255,255,255,0.38); }',
        '#partage-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; }',
        '#partage-body .pt-intro { margin: 0; font-size: 13px; line-height: 1.45; color: #b9b6c8; }',
        '#partage-texte {',
        '    box-sizing: border-box; width: 100%; min-height: 108px; resize: vertical;',
        '    background: #24212f; color: #ecebf3; border: 1px solid #34303f; border-radius: 10px;',
        '    padding: 9px 11px; font-size: 13.5px; line-height: 1.45; font-family: inherit !important; outline: none;',
        '}',
        '#partage-texte:focus { border-color: #2ecc71; box-shadow: 0 0 0 3px rgba(46,204,113,0.25); }',
        '#partage-btns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }',
        '#partage-btns .pt-autre { grid-column: 1 / -1; }',
        '@media (max-width: 420px) { #partage-btns { grid-template-columns: 1fr 1fr; } #partage-btns .pt-fb { grid-column: 1 / -1; } }',
        '#partage-btns button {',
        '    display: flex; align-items: center; justify-content: center; gap: 8px;',
        '    padding: 10px; border-radius: 12px; cursor: pointer; font-weight: 800; font-size: 13.5px;',
        '    font-family: inherit !important; border: 1px solid #34303f; background: #24212f; color: #ecebf3;',
        '    transition: transform .12s, filter .15s; touch-action: manipulation;',
        '}',
        '#partage-btns button:hover { transform: translateY(-1px); filter: brightness(1.12); }',
        '#partage-btns button svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }',
        '#partage-btns .pt-copier { grid-column: 1 / -1; background: #2ecc71; border-color: #2ecc71; color: #fff; }',
        '#partage-btns .pt-wa { color: #25d366; }',
        '#partage-btns .pt-fb { color: #4b8df8; }',
        '#partage-btns .pt-autre[hidden] { display: none; }',
        '#partage-status { min-height: 18px; font-size: 13px; font-weight: 700; text-align: center; color: #4fd18b; }',
        '#partage-status.err { color: #ff8a8a; }',
        /* Mode clair */
        'body.menu-light #partage-box { background: #f5f4f8; color: #2a2440; border-color: #dddbe6; box-shadow: 0 18px 50px rgba(0,0,0,0.25); }',
        'body.menu-light #partage-body .pt-intro { color: #5c5870; }',
        'body.menu-light #partage-texte { background: #fff; color: #2a2440; border-color: #e4e2ec; }',
        'body.menu-light #partage-btns button { background: #fff; border-color: #e4e2ec; color: #2a2440; }',
        'body.menu-light #partage-btns .pt-copier { background: #2ecc71; border-color: #2ecc71; color: #fff; }',
        'body.menu-light #partage-btns .pt-wa { color: #1a9e4b; }',
        'body.menu-light #partage-btns .pt-fb { color: #1f6fe0; }',
        'body.menu-light #partage-status { color: #1e8a4c; } body.menu-light #partage-status.err { color: #d33a3f; }'
    ].join('\n');

    // ── Contenu ──────────────────────────────────────────────────────────
    var HTML =
        '<div id="partage-overlay" role="dialog" aria-modal="true" aria-labelledby="partage-title">' +
          '<div id="partage-box">' +
            '<div id="partage-head">' +
              '<h3 id="partage-title">📣 Faire connaître le Bureau du Prof</h3>' +
              '<button type="button" id="partage-close" title="Fermer" aria-label="Fermer">✕</button>' +
            '</div>' +
            '<div id="partage-body">' +
              '<p class="pt-intro">Le site vous plaît ? Le meilleur moyen de l\'aider, c\'est d\'en parler à vos collègues. ' +
                'Voici un message tout prêt, que vous pouvez modifier :</p>' +
              '<textarea id="partage-texte" aria-label="Message à partager"></textarea>' +
              '<div id="partage-btns">' +
                '<button type="button" class="pt-copier" data-pt="copier">' + svg('copier') + 'Copier le message et le lien</button>' +
                '<button type="button" data-pt="mail">' + svg('mail') + 'E-mail</button>' +
                '<button type="button" class="pt-wa" data-pt="wa">' + svg('wa') + 'WhatsApp</button>' +
                '<button type="button" class="pt-fb" data-pt="fb">' + svg('fb') + 'Facebook</button>' +
                '<button type="button" class="pt-autre" data-pt="autre" hidden>' + svg('autre') + 'Autres…</button>' +
              '</div>' +
              '<div id="partage-status" aria-live="polite"></div>' +
            '</div>' +
          '</div>' +
        '</div>';

    // ── Injection ────────────────────────────────────────────────────────
    var style = document.createElement('style');
    style.id = 'partage-style';
    style.textContent = CSS;
    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', HTML);

    var overlay = document.getElementById('partage-overlay');
    var texte   = document.getElementById('partage-texte');
    var status  = document.getElementById('partage-status');
    var lastFocus = null, statusTimer = null;

    // Partage natif (téléphone, tablette, certains ordinateurs)
    if (navigator.share) overlay.querySelector('[data-pt="autre"]').hidden = false;

    function setStatus(t, err) {
        status.textContent = t || '';
        status.className = err ? 'err' : '';
        clearTimeout(statusTimer);
        if (t) statusTimer = setTimeout(function () { status.textContent = ''; }, 3500);
    }

    // Message complet : texte (éventuellement modifié) + lien s'il n'y est plus
    function messageComplet() {
        var t = texte.value.trim();
        return t.indexOf(PARTAGE_URL) === -1 ? (t + '\n' + PARTAGE_URL) : t;
    }

    function ouvrirLien(url) {
        var w = window.open(url, '_blank', 'noopener');
        if (!w && url.indexOf('mailto:') !== 0) location.href = url;
    }

    function copier(txt) {
        function secours() {
            var ta = document.createElement('textarea');
            ta.value = txt;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            return ok;
        }
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(txt).then(function () { return true; }, secours);
        }
        return Promise.resolve(secours());
    }

    function partagerBureauDuProf() {
        lastFocus = document.activeElement;
        if (!texte.value.trim()) texte.value = PARTAGE_MESSAGE + '\n' + PARTAGE_URL;
        setStatus('');
        overlay.classList.add('open');
        setTimeout(function () { overlay.querySelector('.pt-copier').focus(); }, 50);
    }
    function fermerPartage() {
        overlay.classList.remove('open');
        if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus(); } catch (e) {} }
    }
    window.partagerBureauDuProf = partagerBureauDuProf;
    window.fermerPartage = fermerPartage;

    // ── Actions ──────────────────────────────────────────────────────────
    overlay.querySelector('#partage-btns').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pt]');
        if (!b) return;
        var msg = messageComplet();
        switch (b.dataset.pt) {
            case 'copier':
                copier(msg).then(function (ok) {
                    setStatus(ok ? '✅ Copié ! Collez-le où vous voulez (Ctrl+V).'
                                 : 'La copie a échoué : sélectionnez le texte et faites Ctrl+C.', !ok);
                    if (!ok) { texte.focus(); texte.select(); }
                });
                break;
            case 'mail':
                location.href = 'mailto:?subject=' + encodeURIComponent('Un outil gratuit pour la classe : ' + PARTAGE_TITRE) +
                                '&body=' + encodeURIComponent(msg);
                break;
            case 'wa':
                ouvrirLien('https://wa.me/?text=' + encodeURIComponent(msg));
                break;
            case 'fb':
                // Facebook n'accepte pas de texte pré-rempli : on copie le message
                // pour pouvoir le coller dans la publication.
                copier(msg).then(function (ok) {
                    if (ok) setStatus('Message copié : collez-le dans votre publication Facebook.');
                });
                ouvrirLien('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(PARTAGE_URL));
                break;
            case 'autre':
                if (!navigator.share) return;
                navigator.share({ title: PARTAGE_TITRE, text: texte.value.trim().replace(PARTAGE_URL, '').trim(), url: PARTAGE_URL })
                    .catch(function () {});
                break;
        }
    });

    document.getElementById('partage-close').addEventListener('click', fermerPartage);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) fermerPartage(); });
    // Les touches tapées ici ne déclenchent pas les raccourcis du tableau ; Échap ferme
    overlay.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); fermerPartage(); }
    });
    ['keyup', 'keypress', 'paste', 'copy', 'cut'].forEach(function (evt) {
        overlay.addEventListener(evt, function (e) { e.stopPropagation(); });
    });
})();
