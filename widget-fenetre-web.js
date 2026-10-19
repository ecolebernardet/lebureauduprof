// =========================================================================
// WIDGET FENÊTRE WEB (iframe) — Le Bureau du Prof
// =========================================================================
// Interface harmonisée avec les widgets « Lecteur vidéo » et « YouTube » :
//   - une seule barre intelligente : on colle une adresse → la page s'ouvre
//     tout de suite ; on tape des mots → « Chercher » ouvre la recherche
//     dans un nouvel onglet. Bouton ✕ pour vider la barre.
//   - ⟳ recharger, ⌂ revenir à l'accueil, ↗ ouvrir la page dans un onglet,
//     zoom − / + (pratique au tableau), plein écran, boutons fenêtre
//   - écran d'accueil : coller une adresse, sites récents, ★ mes sites
//     (enregistrés dans ce navigateur), glisser-déposer d'un lien
//   - adresses converties automatiquement pour pouvoir être affichées :
//     YouTube, Google Docs / Slides / Sheets / Drive, Vimeo
//   - bandeau d'aide si la page reste blanche (certains sites refusent
//     d'être affichés dans une fenêtre) avec « Ouvrir dans un onglet »
//
// Les fenêtres enregistrées avec l'ancienne interface sont mises à jour
// automatiquement au chargement du tableau (l'adresse est conservée).
// =========================================================================

const _FW_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';
const _FW_ZOOMS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const _FW_LS_RECENT = 'lbdp-fenetre-web-recents';
const _FW_LS_FAV = 'lbdp-fenetre-web-favoris';

// Modèle HTML du widget, ajouté au document dès le chargement du script
// pour que createWidget('iframe') le trouve.
document.body.insertAdjacentHTML('beforeend', `
<template id="template-iframe">
    <div class="editor-container fw-v2 fw-empty" data-fw-zoom="1" style="height:400px;width:550px;">
        <button class="exit-fs-btn" onclick="document.exitFullscreen()">✖ Quitter Plein Écran</button>
        <div class="fw-bar editor-toolbar">
            <button type="button" class="fw-ib fw-sm-hide" data-fw-action="home" title="Accueil" aria-label="Accueil"${_FW_STOP}>⌂</button>
            <button type="button" class="fw-ib" data-fw-action="reload" title="Recharger la page" aria-label="Recharger"${_FW_STOP}>⟳</button>
            <div class="fw-field"${_FW_STOP}>
                <span class="fw-field-ico">🌐</span>
                <input type="text" class="fw-url-input" spellcheck="false" autocomplete="off"
                       placeholder="Colle une adresse… ou tape des mots pour chercher"
                       onkeydown="fwInputKey(event,this)" oninput="fwInputChanged(this)" onpaste="fwInputPaste(this)" onfocus="this.select()">
                <button type="button" class="fw-clear" data-fw-action="clear" title="Vider la barre" aria-label="Vider la barre">✕</button>
                <button type="button" class="fw-go" data-fw-action="go" title="Ouvrir la page">➜<span class="fw-go-lbl"> Ouvrir</span></button>
            </div>
            <button type="button" class="fw-ib fw-fav-btn" data-fw-action="fav" title="Ajouter à mes sites" aria-label="Ajouter à mes sites"${_FW_STOP}>☆</button>
            <div class="fw-zoom fw-sm-hide"${_FW_STOP}>
                <button type="button" data-fw-action="zoom-out" title="Rapetisser la page" aria-label="Rapetisser">−</button>
                <button type="button" class="fw-zoom-val" data-fw-action="zoom-reset" title="Taille normale">100 %</button>
                <button type="button" data-fw-action="zoom-in" title="Agrandir la page" aria-label="Agrandir">+</button>
            </div>
            <button type="button" class="fw-ib fw-sm-hide" data-fw-action="newtab" title="Ouvrir la page dans un nouvel onglet" aria-label="Ouvrir dans un onglet"${_FW_STOP}>↗</button>
            <button type="button" class="fw-ib fw-sm-hide" onclick="toggleFullScreen(this.closest('.editor-container'))" title="Projeter sur tout l'écran" aria-label="Projeter"${_FW_STOP}>⛶</button>
            <div class="wf-btns"${_FW_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
            <div class="fw-progress"></div>
        </div>
        <div class="fw-stage">
            <iframe class="fw-frame" src="" allow="microphone; camera; display-capture; autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
            <!-- Page blanche ? -->
            <div class="fw-help"${_FW_STOP}>
                <span>La page reste blanche ? Certains sites refusent d'être affichés dans une fenêtre.</span>
                <button type="button" data-fw-action="newtab">↗ Ouvrir dans un onglet</button>
                <button type="button" class="fw-help-x" data-fw-action="help-close" title="Masquer" aria-label="Masquer">✕</button>
            </div>
            <!-- Accueil -->
            <div class="fw-msg"${_FW_STOP}>
                <div class="fw-msg-box">
                    <div class="fw-bigico">🌐</div>
                    <div class="fw-title">Fenêtre web</div>
                    <div>Colle l'adresse d'une page dans la barre du haut, ou glisse un lien ici.</div>
                    <div class="fw-msg-btns">
                        <button type="button" class="fw-btn" data-fw-action="paste">📋 Coller l'adresse</button>
                    </div>
                    <div class="fw-list fw-favs"></div>
                    <div class="fw-list fw-recents"></div>
                    <div class="fw-hint">Les liens YouTube, Google Docs, Slides, Sheets et Vimeo sont adaptés automatiquement.<br>Certains sites (Google, Wikipédia…) refusent d'être affichés ici : ils s'ouvrent alors dans un onglet.</div>
                </div>
            </div>
            <div class="fw-flash"></div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _fwEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _fwSave = () => { if (typeof saveBoard === 'function') saveBoard(); };
function _fwLsGet(k) { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function _fwLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function _fwHost(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }
function _fwFavicon(url) { try { return 'https://www.google.com/s2/favicons?sz=32&domain=' + new URL(url).hostname; } catch (e) { return ''; } }

// Une saisie ressemble-t-elle à une adresse ?
function _fwLooksLikeUrl(t) {
    t = String(t || '').trim();
    if (!t || /\s/.test(t)) return false;
    if (/^(https?|file):\/\//i.test(t)) return true;
    if (/^localhost(:\d+)?(\/|$)/i.test(t)) return true;
    if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(t)) return true;
    return /^[^\/\s]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(t);
}
function _fwNormalize(t) {
    t = String(t || '').trim();
    if (!t) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = 'https://' + t;
    return t;
}

// Adapte les adresses connues pour qu'elles puissent s'afficher dans une fenêtre
function _fwEmbeddable(url) {
    let u;
    try { u = new URL(url); } catch (e) { return url; }
    const h = u.hostname.replace(/^(www|m)\./, '');
    // YouTube
    let yt = null;
    if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
        if (u.pathname === '/watch') yt = u.searchParams.get('v');
        else { const m = u.pathname.match(/^\/(?:shorts|live|embed)\/([a-zA-Z0-9_-]{11})/); if (m) yt = m[1]; }
    } else if (h === 'youtu.be') yt = u.pathname.slice(1, 12);
    if (yt && /^[a-zA-Z0-9_-]{11}$/.test(yt)) {
        let e = 'https://www.youtube-nocookie.com/embed/' + yt + '?rel=0&playsinline=1';
        const t = u.searchParams.get('t') || u.searchParams.get('start');
        if (t && /^\d+s?$/.test(t)) e += '&start=' + parseInt(t, 10);
        return e;
    }
    // Vimeo
    if (h === 'vimeo.com') { const m = u.pathname.match(/^\/(\d+)/); if (m) return 'https://player.vimeo.com/video/' + m[1]; }
    // Google Docs / Slides / Sheets / Drive
    if (h === 'docs.google.com') {
        const m = u.pathname.match(/^(\/(?:document|presentation|spreadsheets)\/d\/[^\/]+)\/(edit|view)?/);
        if (m) {
            if (u.pathname.startsWith('/presentation')) return 'https://docs.google.com' + m[1] + '/embed?start=false&loop=false';
            return 'https://docs.google.com' + m[1] + '/preview';
        }
    }
    if (h === 'drive.google.com') {
        const m = u.pathname.match(/^\/file\/d\/([^\/]+)/);
        if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
    }
    return url;
}

// Sites connus pour refuser l'affichage dans une fenêtre
const _FW_BLOCKED = /(^|\.)(google\.[a-z.]+|wikipedia\.org|facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|github\.com|amazon\.[a-z.]+|chatgpt\.com|openai\.com|claude\.ai|pronote\.net|index-education\.net|ecoledirecte\.com)$/i;
function _fwIsBlocked(url) {
    try {
        const u = new URL(url);
        if (u.hostname === 'docs.google.com' || u.hostname === 'drive.google.com' || u.hostname === 'www.google.com' && u.pathname.startsWith('/maps/embed')) return false;
        return _FW_BLOCKED.test(u.hostname);
    } catch (e) { return false; }
}

// Petit message temporaire
function _fwFlash(c, text, ms) {
    const f = c && c.querySelector('.fw-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 1800);
}
function _fwNudge(c, msg) {
    const field = c.querySelector('.fw-field');
    if (field) {
        field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad');
        clearTimeout(field._t);
        field._t = setTimeout(() => field.classList.remove('is-bad'), 1200);
    }
    if (msg) _fwFlash(c, msg, 2400);
    const input = c.querySelector('.fw-url-input');
    if (input) try { input.focus({ preventScroll: true }); } catch (e) {}
}

/* ── Adresse courante ───────────────────────────────────────────── */
const _fwFrame = c => c.querySelector('iframe.fw-frame') || c.querySelector('iframe');
function _fwUrl(c) {
    const a = c.getAttribute('data-fw-url');
    if (a) return a;
    const f = _fwFrame(c);
    const s = f ? (f.getAttribute('src') || '') : '';
    return s && s !== 'about:blank' ? s : '';
}
function _fwSetInput(c, url) {
    const input = c.querySelector('.fw-url-input');
    if (!input) return;
    input.value = url || '';
    if (url) input.setAttribute('value', url); else input.removeAttribute('value');
    fwInputChanged(input);
}

/* ── Ouverture d'une page ───────────────────────────────────────── */
function _fwOpen(c, url) {
    url = _fwNormalize(url);
    if (!url) return;
    if (/^javascript:/i.test(url)) { _fwNudge(c, 'Adresse non autorisée'); return; }
    if (_fwIsBlocked(url)) {
        window.open(url, '_blank', 'noopener');
        _fwFlash(c, '↗ Ce site refuse d’être affiché ici : il s’ouvre dans un nouvel onglet.', 3800);
        _fwSetInput(c, url);
        return;
    }
    const frame = _fwFrame(c);
    const src = _fwEmbeddable(url);
    c.setAttribute('data-fw-url', url);
    c.classList.remove('fw-empty');
    _fwSetInput(c, url);
    _fwHelp(c, false);
    _fwLoading(c, true);
    frame.src = src;
    try { c.querySelector('.fw-url-input').blur(); } catch (e) {}
    _fwAddRecent(url);
    _fwRefreshFav(c);
    _fwSave();
}

function _fwSearch(c, q) {
    window.open('https://www.qwant.com/?q=' + encodeURIComponent(q), '_blank', 'noopener');
    _fwFlash(c, '🔍 Recherche ouverte dans un nouvel onglet : copie l’adresse de la page choisie, puis colle-la ici.', 5000);
}

function _fwHome(c) {
    const frame = _fwFrame(c);
    if (frame) frame.src = 'about:blank';
    c.removeAttribute('data-fw-url');
    c.classList.add('fw-empty');
    _fwSetInput(c, '');
    _fwHelp(c, false);
    _fwLoading(c, false);
    _fwRenderHome(c);
    _fwRefreshFav(c);
    _fwSave();
}

function _fwReload(c) {
    const url = _fwUrl(c);
    if (!url) { _fwNudge(c, 'Colle d’abord une adresse'); return; }
    const frame = _fwFrame(c);
    _fwLoading(c, true);
    _fwHelp(c, false);
    const src = frame.getAttribute('src');
    frame.src = 'about:blank';
    setTimeout(() => { frame.src = src || _fwEmbeddable(url); }, 30);
}

function _fwPasteClipboard(c) {
    const input = c.querySelector('.fw-url-input');
    const fail = () => { if (input) input.focus(); _fwFlash(c, 'Fais Ctrl+V (ou ⌘V) dans la barre du haut', 2600); };
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') { fail(); return; }
    navigator.clipboard.readText().then(t => {
        t = String(t || '').trim();
        if (!_fwLooksLikeUrl(t)) { _fwNudge(c, 'Le presse-papiers ne contient pas d’adresse web'); return; }
        _fwOpen(c, t);
    }).catch(fail);
}

// Fonction historique (appelée aussi par l'ancienne interface)
function loadIframe(input) {
    const c = input && input.closest('.editor-container');
    if (!c) return;
    const t = input.value.trim();
    if (c.classList.contains('fw-v2')) {
        if (!t) { _fwNudge(c, 'Colle d’abord une adresse'); return; }
        if (_fwLooksLikeUrl(t)) _fwOpen(c, t); else _fwSearch(c, t);
        return;
    }
    const iframe = c.querySelector('iframe');
    let url = t;
    if (url && !url.startsWith('http')) url = 'https://' + url;
    iframe.src = url; _fwSave();
}

/* ── Chargement : barre de progression et aide « page blanche » ──── */
function _fwLoading(c, on) {
    c.classList.toggle('fw-loading', !!on);
    clearTimeout(c._fwLoadT);
    if (on) c._fwLoadT = setTimeout(() => c.classList.remove('fw-loading'), 15000);
}
function _fwHelp(c, on) {
    clearTimeout(c._fwHelpT);
    const h = c.querySelector('.fw-help');
    if (h) h.classList.toggle('is-on', !!on);
}
function _fwOnFrameLoad(c) {
    _fwLoading(c, false);
    if (c.classList.contains('fw-empty')) return;
    // On ne peut pas savoir si un site a refusé de s'afficher : on propose
    // discrètement l'ouverture dans un onglet, puis le bandeau s'efface.
    _fwHelp(c, true);
    c._fwHelpT = setTimeout(() => _fwHelp(c, false), 7000);
}

/* ── Zoom ───────────────────────────────────────────────────────── */
function _fwApplyZoom(c) {
    let z = parseFloat(c.getAttribute('data-fw-zoom'));
    if (!isFinite(z) || z <= 0) z = 1;
    const frame = _fwFrame(c);
    if (frame) {
        if (z === 1) { frame.style.width = ''; frame.style.height = ''; frame.style.transform = ''; }
        else {
            frame.style.width = (100 / z) + '%';
            frame.style.height = (100 / z) + '%';
            frame.style.transform = 'scale(' + z + ')';
        }
    }
    const v = c.querySelector('.fw-zoom-val');
    if (v) v.textContent = Math.round(z * 100) + ' %';
}
function _fwZoom(c, dir) {
    let z = parseFloat(c.getAttribute('data-fw-zoom')) || 1;
    if (dir === 0) z = 1;
    else {
        let i = _FW_ZOOMS.findIndex(v => v >= z - 0.001);
        if (i < 0) i = _FW_ZOOMS.length - 1;
        if (_FW_ZOOMS[i] > z + 0.001 && dir < 0) i++;
        i = Math.max(0, Math.min(_FW_ZOOMS.length - 1, i + dir));
        z = _FW_ZOOMS[i];
    }
    c.setAttribute('data-fw-zoom', z);
    _fwApplyZoom(c);
    _fwFlash(c, 'Taille ' + Math.round(z * 100) + ' %', 1000);
    _fwSave();
}

/* ── Sites récents et mes sites (gardés dans ce navigateur) ──────── */
function _fwAddRecent(url) {
    const list = _fwLsGet(_FW_LS_RECENT).filter(u => u !== url);
    list.unshift(url);
    _fwLsSet(_FW_LS_RECENT, list.slice(0, 6));
}
function _fwRefreshFav(c) {
    const b = c.querySelector('.fw-fav-btn');
    if (!b) return;
    const url = _fwUrl(c);
    const saved = !!url && _fwLsGet(_FW_LS_FAV).some(f => f.url === url);
    b.classList.toggle('saved', saved);
    b.textContent = saved ? '★' : '☆';
    b.title = saved ? 'Retirer de mes sites' : 'Ajouter à mes sites';
}
function _fwToggleFav(c) {
    const url = _fwUrl(c);
    if (!url) { _fwNudge(c, 'Ouvre d’abord une page pour l’ajouter à tes sites'); return; }
    let favs = _fwLsGet(_FW_LS_FAV);
    if (favs.some(f => f.url === url)) {
        favs = favs.filter(f => f.url !== url);
        _fwFlash(c, 'Retirée de tes sites');
    } else {
        const name = prompt('Nom de ce site :', _fwHost(url));
        if (name === null) return;
        favs.push({ url, name: name.trim() || _fwHost(url) });
        _fwFlash(c, '★ Ajoutée à tes sites (visibles sur l’accueil ⌂)', 2600);
    }
    _fwLsSet(_FW_LS_FAV, favs);
    document.querySelectorAll('.fw-v2').forEach(x => { _fwRefreshFav(x); _fwRenderHome(x); });
}
function _fwRenderHome(c) {
    const favBox = c.querySelector('.fw-favs'), recBox = c.querySelector('.fw-recents');
    if (!favBox || !recBox) return;
    const favs = _fwLsGet(_FW_LS_FAV);
    const favUrls = favs.map(f => f.url);
    const recents = _fwLsGet(_FW_LS_RECENT).filter(u => favUrls.indexOf(u) === -1).slice(0, 4);
    const chip = (url, name, del) =>
        `<span class="fw-chip" data-fw-action="open-url" data-url="${_fwEsc(url)}" title="${_fwEsc(url)}">` +
        `<img src="${_fwEsc(_fwFavicon(url))}" alt="" onerror="this.remove()">` +
        `<span class="fw-chip-l">${_fwEsc(name)}</span>` +
        (del ? `<button type="button" class="fw-chip-x" data-fw-action="${del}" data-url="${_fwEsc(url)}" title="Retirer" aria-label="Retirer">✕</button>` : '') +
        `</span>`;
    favBox.innerHTML = favs.length
        ? '<div class="fw-list-h">★ Mes sites</div><div class="fw-chips">' + favs.map(f => chip(f.url, f.name, 'fav-del')).join('') + '</div>' : '';
    recBox.innerHTML = recents.length
        ? '<div class="fw-list-h">🕘 Récents</div><div class="fw-chips">' + recents.map(u => chip(u, _fwHost(u), 'recent-del')).join('') + '</div>' : '';
}

/* ── Barre de saisie ────────────────────────────────────────────── */
function fwInputKey(e, input) {
    e.stopPropagation();                       // pas de raccourcis du tableau pendant la saisie
    if (e.key === 'Enter') { e.preventDefault(); loadIframe(input); }
    else if (e.key === 'Escape') { const c = input.closest('.editor-container'); _fwSetInput(c, _fwUrl(c)); input.blur(); }
}
function fwInputChanged(input) {
    const c = input.closest('.fw-v2');
    if (!c) return;
    const v = input.value.trim();
    const search = !!v && !_fwLooksLikeUrl(v);
    const go = c.querySelector('.fw-go');
    if (go) {
        go.classList.toggle('is-search', search);
        go.innerHTML = search ? '🔍<span class="fw-go-lbl"> Chercher</span>' : '➜<span class="fw-go-lbl"> Ouvrir</span>';
        go.title = search ? 'Chercher sur le web (nouvel onglet)' : 'Ouvrir la page';
    }
    const ico = c.querySelector('.fw-field-ico');
    if (ico) ico.textContent = search ? '🔍' : (/^https:/i.test(v) || !v ? '🌐' : '🌐');
    const field = c.querySelector('.fw-field');
    if (field) { field.classList.toggle('has-text', !!v); field.classList.remove('is-bad'); }
}
// Une adresse collée s'ouvre toute seule
function fwInputPaste(input) {
    setTimeout(() => {
        fwInputChanged(input);
        if (_fwLooksLikeUrl(input.value)) loadIframe(input);
    }, 0);
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-fw-action]');
    if (!btn) return;
    const c = btn.closest('.fw-v2');
    if (!c) return;
    const act = btn.getAttribute('data-fw-action');
    const input = c.querySelector('.fw-url-input');
    switch (act) {
        case 'go':         loadIframe(input); break;
        case 'clear':      _fwSetInput(c, ''); input.focus(); break;
        case 'paste':      _fwPasteClipboard(c); break;
        case 'home':       _fwHome(c); break;
        case 'reload':     _fwReload(c); break;
        case 'newtab': {
            const url = _fwUrl(c) || (_fwLooksLikeUrl(input.value) ? _fwNormalize(input.value) : '');
            if (!url) { _fwNudge(c, 'Colle d’abord une adresse'); break; }
            window.open(url, '_blank', 'noopener');
            break;
        }
        case 'help-close': _fwHelp(c, false); break;
        case 'fav':        _fwToggleFav(c); break;
        case 'zoom-in':    _fwZoom(c, 1); break;
        case 'zoom-out':   _fwZoom(c, -1); break;
        case 'zoom-reset': _fwZoom(c, 0); break;
        case 'open-url':   _fwOpen(c, btn.getAttribute('data-url')); break;
        case 'fav-del': {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            _fwLsSet(_FW_LS_FAV, _fwLsGet(_FW_LS_FAV).filter(f => f.url !== url));
            document.querySelectorAll('.fw-v2').forEach(x => { _fwRefreshFav(x); _fwRenderHome(x); });
            break;
        }
        case 'recent-del': {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            _fwLsSet(_FW_LS_RECENT, _fwLsGet(_FW_LS_RECENT).filter(u => u !== url));
            document.querySelectorAll('.fw-v2').forEach(_fwRenderHome);
            break;
        }
    }
});

/* ── Glisser-déposer d'un lien sur le widget ───────────────────────
   (les fichiers ne sont pas interceptés : ils restent pour le tableau) */
function _fwDragTarget(e) {
    const c = e.target.closest && e.target.closest('.fw-v2');
    if (!c || !e.dataTransfer) return null;
    const types = Array.from(e.dataTransfer.types || []);
    if (types.indexOf('Files') !== -1) return null;
    if (types.indexOf('text/uri-list') === -1 && types.indexOf('text/plain') === -1) return null;
    return c;
}
document.addEventListener('dragover', e => {
    const c = _fwDragTarget(e);
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    c.classList.add('fw-drag');
    clearTimeout(c._fwDragT);
    c._fwDragT = setTimeout(() => c.classList.remove('fw-drag'), 250);
});
document.addEventListener('drop', e => {
    const c = _fwDragTarget(e);
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    c.classList.remove('fw-drag');
    const raw = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '';
    const line = (raw.split(/\r?\n/).find(l => l && l[0] !== '#') || '').trim();
    if (!_fwLooksLikeUrl(line)) { _fwNudge(c, 'Ce n’est pas une adresse web'); return; }
    _fwOpen(c, line);
});

/* ── Mise à jour des widgets : nouveaux, restaurés, ancienne interface ── */
function _fwUpgrade(c) {
    const tpl = document.getElementById('template-iframe');
    const fresh = tpl && tpl.content.querySelector('.editor-container.fw-v2');
    if (!fresh) return;
    const old = c.querySelector('iframe');
    const src = old ? (old.getAttribute('src') || '') : '';
    if (!c.style.width) c.style.width = '550px';
    if (!c.style.height) c.style.height = '400px';
    c.innerHTML = fresh.innerHTML;
    c.classList.add('fw-v2');
    c.setAttribute('data-fw-zoom', '1');
    if (src && src !== 'about:blank') {
        c.setAttribute('data-fw-url', src);
        c.querySelector('iframe.fw-frame').setAttribute('src', src);
    }
}

function _fwInit(c) {
    if (!c || c._fwInited) return;
    if (!c.classList.contains('fw-v2')) _fwUpgrade(c);
    if (!c.classList.contains('fw-v2')) return;
    c._fwInited = true;
    // La classe editor-toolbar permet au tableau de déplacer / réduire le widget par sa barre
    const bar = c.querySelector('.fw-bar');
    if (bar) bar.classList.add('editor-toolbar');
    const frame = _fwFrame(c);
    const url = _fwUrl(c);
    c.classList.toggle('fw-empty', !url);
    c.classList.remove('fw-drag', 'fw-loading');
    _fwHelp(c, false);
    const fl = c.querySelector('.fw-flash');
    if (fl) fl.classList.remove('is-on');
    if (frame) frame.addEventListener('load', () => _fwOnFrameLoad(c));
    _fwSetInput(c, url);
    _fwApplyZoom(c);
    _fwRenderHome(c);
    _fwRefreshFav(c);
}

// Repère les conteneurs « fenêtre web » (nouveaux ou de l'ancienne interface)
function _fwScan(node) {
    if (!node || node.nodeType !== 1) return;
    const list = [];
    if (node.matches('.widget[data-type="iframe"]')) list.push(node);
    node.querySelectorAll && node.querySelectorAll('.widget[data-type="iframe"]').forEach(w => list.push(w));
    list.forEach(w => { const c = w.querySelector('.editor-container'); if (c) _fwInit(c); });
    if (node.matches('.fw-v2')) _fwInit(node);
    else node.querySelectorAll && node.querySelectorAll('.fw-v2').forEach(_fwInit);
}

new MutationObserver(muts => {
    for (const m of muts) m.addedNodes.forEach(n => {
        if (n.nodeType !== 1 || (n.closest && n.closest('.fw-stage, .fw-bar'))) return;
        _fwScan(n);
    });
}).observe(document.body, { childList: true, subtree: true });

/* ── Styles ─────────────────────────────────────────────────────── */
(function _fwStyles() {
    if (document.getElementById('fw-v2-styles')) return;
    const st = document.createElement('style');
    st.id = 'fw-v2-styles';
    st.textContent = `
.editor-container.fw-v2{
  container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.fw-v2 button{font-family:inherit}
.fw-v2 :focus-visible{outline:2px solid #4a90e2;outline-offset:1px}
/* Barre du haut */
.fw-v2 .fw-bar{flex:none;position:relative;z-index:10;height:44px;min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:5px;
  padding:0 10px;visibility:visible;opacity:1;background:#232329;border-bottom:1px solid #2f2f37}
.fw-v2 .fw-progress{position:absolute;left:0;bottom:-1px;height:2px;width:0;background:#4a90e2;opacity:0;pointer-events:none}
.fw-v2.fw-loading .fw-progress{opacity:1;animation:fw-load 2.5s ease-out forwards}
@keyframes fw-load{from{width:0}to{width:85%}}
.fw-v2 .fw-field{flex:1;min-width:90px;display:flex;align-items:center;height:30px;box-sizing:border-box;padding:0 3px 0 10px;
  background:#2f2f38;border:1px solid #3a3a44;border-radius:99px;transition:border-color .15s,background .15s}
.fw-v2 .fw-field:focus-within{border-color:#4a90e2;background:#26262e}
.fw-v2.fw-drag .fw-field{border-color:#4a90e2;border-style:dashed}
.fw-v2 .fw-field.is-bad{border-color:#ff5f57;animation:fw-shake .3s}
@keyframes fw-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.fw-v2 .fw-field-ico{flex:none;font-size:12px;opacity:.75;margin-right:6px}
.fw-v2 .fw-url-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:13px;padding:0}
.fw-v2 .fw-url-input::placeholder{color:#8d8d99}
.fw-v2 .fw-clear{display:none;flex:none;width:22px;height:22px;border:0;border-radius:50%;background:transparent;color:#8d8d99;
  font-size:11px;cursor:pointer;align-items:center;justify-content:center;padding:0;margin-right:2px}
.fw-v2 .fw-clear:hover{background:rgba(255,255,255,.12);color:#fff}
.fw-v2 .fw-field.has-text .fw-clear{display:inline-flex}
.fw-v2 .fw-go{flex:none;height:24px;border:0;border-radius:99px;background:#4a90e2;color:#fff;font-size:12px;font-weight:600;
  padding:0 12px;cursor:pointer;white-space:nowrap}
.fw-v2 .fw-go:hover{background:#3b7fd0}
.fw-v2 .fw-go.is-search{background:#7b61d9}
.fw-v2 .fw-go.is-search:hover{background:#6a50c8}
.fw-v2 .fw-ib{flex:none;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#cfcfd6;
  font-size:16px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.fw-v2 .fw-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.fw-v2 .fw-fav-btn{font-size:17px}
.fw-v2 .fw-fav-btn.saved{color:#ffd54a}
.fw-v2 .fw-zoom{flex:none;display:inline-flex;align-items:center;background:#2f2f38;border-radius:99px;padding:2px}
.fw-v2 .fw-zoom button{height:26px;min-width:26px;border:0;border-radius:99px;background:transparent;color:#cfcfd6;font-size:15px;cursor:pointer;padding:0 6px}
.fw-v2 .fw-zoom button:hover{background:rgba(255,255,255,.12);color:#fff}
.fw-v2 .fw-zoom .fw-zoom-val{font-size:11px;min-width:44px;font-variant-numeric:tabular-nums}
@container (max-width: 620px){ .fw-v2 .fw-zoom{display:none} }
@container (max-width: 480px){ .fw-v2 .fw-sm-hide{display:none !important} .fw-v2 .fw-go-lbl{display:none} .fw-v2 .fw-bar{gap:3px;padding:0 6px} }
/* Zone de la page */
.fw-v2 .fw-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:#fff}
.fw-v2 .fw-frame{position:absolute;left:0;top:0;width:100%;height:100%;border:0;display:block;background:#fff;transform-origin:0 0}
.fw-v2.fw-empty .fw-frame{visibility:hidden}
/* Bandeau « page blanche » */
.fw-v2 .fw-help{position:absolute;left:10px;right:10px;bottom:10px;z-index:4;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  padding:7px 8px 7px 12px;border-radius:10px;background:rgba(24,24,30,.92);color:#e6e6ea;font-size:12px;
  box-shadow:0 4px 16px rgba(0,0,0,.35);opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .25s,transform .25s}
.fw-v2 .fw-help.is-on{opacity:1;transform:none;pointer-events:auto}
.fw-v2 .fw-help span{flex:1;min-width:160px}
.fw-v2 .fw-help button{flex:none;height:26px;border:0;border-radius:99px;background:#4a90e2;color:#fff;font-size:12px;font-weight:600;padding:0 12px;cursor:pointer}
.fw-v2 .fw-help button:hover{background:#3b7fd0}
.fw-v2 .fw-help .fw-help-x{width:26px;padding:0;background:transparent;color:#9a9aa6}
.fw-v2 .fw-help .fw-help-x:hover{background:rgba(255,255,255,.12);color:#fff}
/* Accueil */
.fw-v2 .fw-msg{position:absolute;inset:0;z-index:3;display:none;align-items:center;justify-content:center;text-align:center;
  padding:16px;overflow:auto;background:radial-gradient(circle at 50% 35%,#24243a,#111114 70%);color:#e6e6ea;line-height:1.45}
.fw-v2.fw-empty .fw-msg{display:flex}
.fw-v2 .fw-msg-box{max-width:480px;margin:auto}
.fw-v2 .fw-bigico{font-size:42px;line-height:1;margin-bottom:8px}
.fw-v2 .fw-title{font-weight:700;font-size:16px;margin-bottom:4px}
.fw-v2 .fw-msg-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
.fw-v2 .fw-btn{padding:9px 16px;border:0;border-radius:99px;background:#4a90e2;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.fw-v2 .fw-btn:hover{background:#3b7fd0}
.fw-v2 .fw-list:empty{display:none}
.fw-v2 .fw-list{margin-top:14px}
.fw-v2 .fw-list-h{font-size:12px;font-weight:600;color:#9a9aa6;margin-bottom:6px}
.fw-v2 .fw-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.fw-v2 .fw-chip{display:inline-flex;align-items:center;gap:6px;max-width:200px;height:30px;box-sizing:border-box;padding:0 4px 0 10px;
  border-radius:99px;background:rgba(255,255,255,.09);color:#e6e6ea;cursor:pointer;transition:background .12s}
.fw-v2 .fw-chip:hover{background:rgba(255,255,255,.17);color:#fff}
.fw-v2 .fw-chip img{width:16px;height:16px;border-radius:3px;flex:none}
.fw-v2 .fw-chip-l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;padding-right:6px}
.fw-v2 .fw-chip-x{flex:none;width:22px;height:22px;border:0;border-radius:50%;background:transparent;color:#8d8d99;font-size:10px;cursor:pointer;
  display:none;align-items:center;justify-content:center;padding:0}
.fw-v2 .fw-chip:hover .fw-chip-x{display:inline-flex}
.fw-v2 .fw-chip-x:hover{background:#c0392b;color:#fff}
@media (hover: none){ .fw-v2 .fw-chip-x{display:inline-flex} }
.fw-v2 .fw-hint{font-size:12px;color:#9a9aa6;margin-top:14px}
.fw-v2.fw-drag .fw-stage::after{content:'Dépose le lien ici';position:absolute;inset:8px;z-index:12;display:flex;align-items:center;justify-content:center;
  border:3px dashed #4a90e2;border-radius:10px;background:rgba(74,144,226,.18);color:#fff;font-weight:700;font-size:15px;pointer-events:none}
/* Message temporaire */
.fw-v2 .fw-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;line-height:1.35;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.fw-v2 .fw-flash.is-on{opacity:1}
/* Plein écran navigateur */
.fw-v2:fullscreen{width:100% !important;height:100% !important}
@media print{ .fw-v2 .fw-bar,.fw-v2 .fw-help{display:none} }
`;
    document.head.appendChild(st);
})();

// Fenêtres web déjà présentes au chargement du script.
_fwScan(document.body);
