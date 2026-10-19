// =========================================================================
// WIDGET YOUTUBE — Le Bureau du Prof
// =========================================================================
// Interface inspirée du widget « Lecteur vidéo » :
//   - une seule barre intelligente : on colle un lien → la vidéo se lance
//     tout de suite ; on tape des mots → « Chercher » ouvre YouTube dans un
//     nouvel onglet. Bouton ✕ pour vider la barre.
//   - écran d'accueil quand aucune vidéo n'est chargée (Coller le lien,
//     Ma bibliothèque, Chercher), glisser-déposer d'un lien sur le widget
//   - liens acceptés : watch?v=, youtu.be/, shorts/, live/, embed/ ;
//     le moment de départ (t=90, t=1m30s) est respecté
//   - modes 📺 Vidéo / 🎵 Audio (sélecteur) ; le mode audio affiche une
//     petite barre de lecture : miniature, titre, lecture / pause, −10 / +10,
//     muet, barre de progression cliquable
//   - fond transparent : la barre devient translucide puis s'efface ; un clic
//     sur le widget la fait réapparaître
//   - bibliothèque (♡ / 📚) : vignettes, filtre, tags cliquables, tag
//     modifiable (🏷), vidéo en cours mise en avant, import (fusion sans
//     doublon) / export JSON
//   - boutons fenêtre jaune / vert / rouge inchangés
//
// Les widgets enregistrés avec l'ancienne interface sont mis à jour
// automatiquement au chargement du tableau (vidéo et mode conservés).
// =========================================================================

// Empêche le déplacement du widget quand on clique sur un contrôle
const _YT_STOP = ' onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()"';

// ── YouTube : correctif « erreur 153 » ────────────────────────────
// YouTube refuse désormais certaines vidéos intégrées (erreur 153 « erreur de
// configuration du lecteur vidéo ») quand l'iframe n'envoie pas d'en-tête
// Referer identifiant le site qui l'intègre. Les vidéos dont l'auteur a
// restreint l'intégration sont les premières touchées, d'où le fait que
// « certaines » vidéos seulement échouent. On force donc une politique
// de référent compatible et on passe le paramètre origin.
const _YT_REFERRER_POLICY = 'strict-origin-when-cross-origin';
const _YT_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';

// Modèle HTML du widget, ajouté au document dès le chargement du script
// pour que createWidget('youtube') le trouve.
document.body.insertAdjacentHTML('beforeend', `
<template id="template-youtube">
    <div class="editor-container yt-v2 yt-empty" data-yt-mode="video" style="height:420px;width:660px;">
        <div class="yt-bar editor-toolbar">
            <div class="yt-field"${_YT_STOP}>
                <span class="yt-field-ico">🔗</span>
                <input type="text" class="yt-url-input" spellcheck="false" autocomplete="off"
                       placeholder="Colle un lien YouTube… ou tape des mots pour chercher"
                       onkeydown="ytInputKey(event,this)" oninput="ytInputChanged(this)" onpaste="ytInputPaste(this)">
                <button type="button" class="yt-clear" data-yt-action="clear" title="Vider la barre" aria-label="Vider la barre">✕</button>
                <button type="button" class="yt-go" data-yt-action="go" title="Lancer la vidéo">▶<span class="yt-go-lbl"> Lire</span></button>
            </div>
            <button type="button" class="yt-ib yt-fav-btn" data-yt-action="fav" title="Ajouter à ma bibliothèque" aria-label="Ajouter à ma bibliothèque"${_YT_STOP}>♡</button>
            <button type="button" class="yt-ib yt-lib-btn" data-yt-action="library" title="Ma bibliothèque" aria-label="Ma bibliothèque"${_YT_STOP}>📚</button>
            <div class="yt-seg" role="group" aria-label="Mode d'affichage"${_YT_STOP}>
                <button type="button" class="yt-seg-btn is-on" data-yt-action="mode-video" title="Mode vidéo">📺<span class="yt-lbl"> Vidéo</span></button>
                <button type="button" class="yt-seg-btn" data-yt-action="mode-audio" title="Mode audio : le son seul, dans une petite barre">🎵<span class="yt-lbl"> Audio</span></button>
            </div>
            <button type="button" class="yt-ib yt-transp" onclick="toggleTransparency(this)" title="Fond transparent" aria-label="Fond transparent"${_YT_STOP}><span class="icon-transparency"></span></button>
            <button type="button" class="yt-ib yt-sm-hide" onclick="toggleFullScreen(this.closest('.editor-container'))" title="Projeter sur tout l'écran" aria-label="Projeter"${_YT_STOP}>⛶</button>
            <div class="wf-btns"${_YT_STOP}>
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <div class="yt-stage">
            <!-- Lecteur -->
            <iframe class="yt-player" referrerpolicy="${_YT_REFERRER_POLICY}" allow="${_YT_ALLOW}" allowfullscreen></iframe>
            <!-- Mode audio -->
            <div class="yt-audio"${_YT_STOP}>
                <img class="yt-a-thumb" alt="">
                <div class="yt-a-main">
                    <div class="yt-a-title">Vidéo YouTube</div>
                    <div class="yt-a-seek" data-yt-action="aseek" title="Aller à ce moment"><div class="yt-a-track"><div class="yt-a-fill"></div></div></div>
                    <div class="yt-a-time">— / —</div>
                </div>
                <div class="yt-a-btns">
                    <button type="button" class="yt-cb yt-a-skip" data-yt-action="aback" title="Reculer de 10 secondes">−10</button>
                    <button type="button" class="yt-cb yt-a-play" data-yt-action="aplay" title="Lecture">▶</button>
                    <button type="button" class="yt-cb yt-a-skip" data-yt-action="afwd" title="Avancer de 10 secondes">+10</button>
                    <button type="button" class="yt-cb yt-a-mute" data-yt-action="amute" title="Couper le son">🔊</button>
                </div>
            </div>
            <!-- Accueil (aucune vidéo) -->
            <div class="yt-msg"${_YT_STOP}>
                <div class="yt-msg-box">
                    <div class="yt-bigico">📺</div>
                    <div class="yt-title">Lecteur YouTube</div>
                    <div>Colle le lien d'une vidéo dans la barre du haut, ou glisse-le ici.</div>
                    <div class="yt-msg-btns">
                        <button type="button" class="yt-btn" data-yt-action="paste">📋 Coller le lien</button>
                        <button type="button" class="yt-btn yt-btn-2" data-yt-action="library">📚 Ma bibliothèque</button>
                        <button type="button" class="yt-btn yt-btn-2" data-yt-action="search">🔍 Chercher sur YouTube</button>
                    </div>
                    <div class="yt-hint">Liens acceptés : youtube.com/watch?v=…, youtu.be/…, Shorts.<br>Un lien avec « t=90 » démarre la vidéo à 1 min 30.</div>
                </div>
                <div class="yt-msg-mini">🎵 Colle un lien YouTube dans la barre du haut pour l'écouter.</div>
            </div>
            <!-- Bibliothèque -->
            <div class="yt-library"${_YT_STOP}>
                <div class="yt-lib-head">
                    <div class="yt-lib-h">📚 Ma bibliothèque <span class="yt-lib-count"></span></div>
                    <button type="button" class="yt-ib yt-lib-close" data-yt-action="library-close" title="Fermer la bibliothèque" aria-label="Fermer">✕</button>
                </div>
                <div class="yt-library-toolbar">
                    <input type="text" class="yt-lib-filter" placeholder="Filtrer par titre ou tag…" oninput="ytRenderLibrary(this.closest('.editor-container'))" onkeydown="ytFilterKey(event,this)">
                    <button type="button" onclick="ytImportLibrary(this)" title="Ajouter les vidéos d'un fichier JSON">⬆ Importer</button>
                    <button type="button" onclick="ytExportLibrary(this)" title="Enregistrer la bibliothèque dans un fichier JSON">⬇ Exporter</button>
                </div>
                <div class="yt-lib-tags"></div>
                <div class="yt-lib-grid"></div>
            </div>
            <div class="yt-flash"></div>
        </div>
    </div>
</template>
`);

/* ── Outils ─────────────────────────────────────────────────────── */
const _ytEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function _ytFmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    t = Math.floor(t);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    const p = n => String(n).padStart(2, '0');
    return h ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s);
}
const _ytSave = () => { if (typeof saveBoard === 'function') saveBoard(); };
const _ytIsId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
const _ytThumb = id => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
const _ytHasElectron = () => !!(window.electronAPI && typeof window.electronAPI.openYoutube === 'function');

// Reconnaît un lien YouTube et son moment de départ éventuel
function _ytParse(text) {
    text = String(text || '').trim();
    if (!text) return null;
    const m = text.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!m) return null;
    let start = 0;
    const t = text.match(/[?&#](?:t|start)=([0-9hms]+)/);
    if (t) {
        const v = t[1];
        if (/^\d+$/.test(v)) start = +v;
        else {
            const h = /(\d+)h/.exec(v), mi = /(\d+)m/.exec(v), s = /(\d+)s/.exec(v);
            start = (h ? +h[1] * 3600 : 0) + (mi ? +mi[1] * 60 : 0) + (s ? +s[1] : 0);
        }
    }
    return { id: m[1], start };
}

function _ytEmbedUrl(videoId, start) {
    let u = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;
    if (start > 0) u += `&start=${Math.floor(start)}`;
    if (/^https?:$/.test(location.protocol)) u += `&origin=${encodeURIComponent(location.origin)}`;
    return u;
}

// Prépare l'iframe (politique de référent + permissions). Doit être appelé
// AVANT d'affecter src : la politique n'est prise en compte qu'au chargement.
function _ytPrepareIframe(iframe) {
    if (!iframe) return false;
    let changed = false;
    if (iframe.getAttribute('referrerpolicy') !== _YT_REFERRER_POLICY) {
        iframe.setAttribute('referrerpolicy', _YT_REFERRER_POLICY);
        changed = true;
    }
    if (!iframe.getAttribute('allow')) iframe.setAttribute('allow', _YT_ALLOW);
    iframe.setAttribute('allowfullscreen', '');
    return changed;
}

function _ytSetVideo(iframe, videoId, start) {
    _ytPrepareIframe(iframe);
    iframe.src = _ytEmbedUrl(videoId, start || 0);
}

// Petit message temporaire en haut de la vidéo
function _ytFlash(c, text, ms) {
    const f = c && c.querySelector('.yt-flash');
    if (!f) return;
    f.textContent = text;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    clearTimeout(f._t);
    f._t = setTimeout(() => f.classList.remove('is-on'), ms || 1800);
}

// Signale une saisie à corriger dans la barre du haut
function _ytInputNudge(c, msg) {
    const field = c.querySelector('.yt-field');
    const input = c.querySelector('.yt-url-input');
    if (field) {
        field.classList.remove('is-bad'); void field.offsetWidth; field.classList.add('is-bad');
        clearTimeout(field._t);
        field._t = setTimeout(() => field.classList.remove('is-bad'), 1200);
    }
    if (msg) _ytFlash(c, msg, 2400);
    if (input) try { input.focus({ preventScroll: true }); } catch (e) {}
}

/* ── Titres des vidéos ──────────────────────────────────────────── */
const _ytTitleCache = {};
async function _ytFetchTitle(id) {
    if (_ytTitleCache[id]) return _ytTitleCache[id];
    const lib = _ytLibrary.find(v => v.id === id);
    if (lib && lib.title && lib.title !== id) return lib.title;
    try {
        const url = 'https://www.youtube.com/watch?v=' + id;
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.title) { _ytTitleCache[id] = data.title; return data.title; }
    } catch (e) {}
    return null;
}
function _ytLoadTitle(c, id) {
    _ytFetchTitle(id).then(t => {
        if (!t || c.getAttribute('data-yt-id') !== id) return;
        c.setAttribute('data-yt-title', t);
        const f = c.querySelector('iframe.yt-player');
        if (f) f.title = t;
        _ytAudioUI(c);
    });
}

/* ── Lancement d'une vidéo ──────────────────────────────────────── */
function _ytPlay(c, id, start) {
    if (!c || !_ytIsId(id)) return;
    const iframe = c.querySelector('iframe.yt-player');
    c.setAttribute('data-yt-id', id);
    c.removeAttribute('data-yt-title');
    if (_ytHasElectron()) {
        window.electronAPI.openYoutube(id);
        _ytFlash(c, '▶ Vidéo ouverte dans une fenêtre à part');
    } else if (iframe) {
        iframe._yt = {};
        _ytSetVideo(iframe, id, start);
        c.classList.remove('yt-empty');
    }
    const input = c.querySelector('.yt-url-input');
    if (input) {
        const link = 'https://youtu.be/' + id + (start > 0 ? '?t=' + Math.floor(start) : '');
        input.value = link;
        input.setAttribute('value', link);
        if (c.classList.contains('yt-v2')) ytInputChanged(input);
        try { input.blur(); } catch (e) {}
    }
    if (c.classList.contains('yt-v2')) _ytLibOpen(c, false);
    else { const lib = c.querySelector('.yt-library'); if (lib) lib.classList.remove('open'); }
    _ytLoadTitle(c, id);
    _ytRefreshFav(c);
    _ytAudioUI(c);
    _ytSave();
}

function _ytSearch(c, query) {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
    _ytFlash(c, '🔍 Recherche ouverte dans un nouvel onglet : copie le lien de la vidéo choisie, puis colle-le ici.', 5000);
}

function _ytPasteClipboard(c) {
    const input = c.querySelector('.yt-url-input');
    const fail = () => { if (input) input.focus(); _ytFlash(c, 'Fais Ctrl+V (ou ⌘V) dans la barre du haut', 2600); };
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') { fail(); return; }
    navigator.clipboard.readText().then(t => {
        t = String(t || '').trim();
        if (!_ytParse(t)) { _ytInputNudge(c, 'Le presse-papiers ne contient pas de lien YouTube'); return; }
        input.value = t;
        loadYoutube(input);
    }).catch(fail);
}

// Fonction historique (appelée aussi par l'ancienne interface)
function loadYoutube(input) {
    const c = input && input.closest('.editor-container');
    if (!c) return;
    const text = input.value.trim();
    const p = _ytParse(text);
    if (p) { _ytPlay(c, p.id, p.start); return; }
    if (c.classList.contains('yt-v2')) {
        if (text) _ytSearch(c, text);
        else _ytInputNudge(c, 'Colle d’abord un lien YouTube');
        return;
    }
    const iframe = c.querySelector('iframe.yt-player');
    if (iframe) { _ytPrepareIframe(iframe); iframe.src = text; }
    _ytSave();
}

/* ── Barre de saisie ────────────────────────────────────────────── */
function ytInputKey(e, input) {
    e.stopPropagation();                       // pas de raccourcis du tableau pendant la saisie
    if (e.key === 'Enter') { e.preventDefault(); loadYoutube(input); }
    else if (e.key === 'Escape') { input.blur(); }
}
function ytInputChanged(input) {
    const c = input.closest('.yt-v2');
    if (!c) return;
    const v = input.value.trim();
    const search = !!v && !_ytParse(v);
    const go = c.querySelector('.yt-go');
    if (go) {
        go.classList.toggle('is-search', search);
        go.innerHTML = search ? '🔍<span class="yt-go-lbl"> Chercher</span>' : '▶<span class="yt-go-lbl"> Lire</span>';
        go.title = search ? 'Chercher sur YouTube (nouvel onglet)' : 'Lancer la vidéo';
    }
    const ico = c.querySelector('.yt-field-ico');
    if (ico) ico.textContent = search ? '🔍' : '🔗';
    const field = c.querySelector('.yt-field');
    if (field) { field.classList.toggle('has-text', !!v); field.classList.remove('is-bad'); }
}
// Un lien collé se lance tout seul
function ytInputPaste(input) {
    setTimeout(() => {
        ytInputChanged(input);
        if (_ytParse(input.value)) loadYoutube(input);
    }, 0);
}

/* ── Modes vidéo / audio ────────────────────────────────────────── */
function _ytSegUI(c) {
    const audio = c.getAttribute('data-yt-mode') === 'audio';
    c.querySelectorAll('.yt-seg-btn').forEach(b => {
        const on = b.getAttribute('data-yt-action') === (audio ? 'mode-audio' : 'mode-video');
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}
function ytSetMode(c, mode) {
    if (!c) return;
    const audio = mode === 'audio';
    if (audio && !c.classList.contains('yt-audio-mode')) {
        const h = c.offsetHeight;
        if (h > 160) c.style.setProperty('--yt-h', h + 'px');   // hauteur reprise pour la bibliothèque
    }
    c.setAttribute('data-yt-mode', audio ? 'audio' : 'video');
    c.classList.toggle('yt-audio-mode', audio);
    _ytSegUI(c);
    _ytAudioUI(c);
    _ytSave();
}
// Fonction historique : display 'none' = audio, 'flex' = vidéo
function toggleYoutubeView(btn, display) {
    const c = btn.closest('.editor-container');
    if (c.classList.contains('yt-v2')) { ytSetMode(c, display === 'none' ? 'audio' : 'video'); return; }
    c.querySelector('iframe.yt-player').style.display = display;
    c.style.height = display === 'none' ? '50px' : '';
    _ytSave();
}

/* ── Pilotage du lecteur (mode audio) ───────────────────────────────
   Le lecteur intégré (enablejsapi=1) accepte des commandes par
   postMessage et renvoie son état : lecture, moment, durée, titre. */
function _ytCmd(iframe, func, args) {
    try {
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [], id: 1, channel: 'widget' }), '*');
        }
    } catch (e) {}
}
function _ytListen(iframe) {
    clearInterval(iframe._ytListenT);
    iframe._ytGotInfo = false;
    let n = 0;
    const send = () => {
        n++;
        if (iframe._ytGotInfo || n > 20 || !iframe.isConnected) { clearInterval(iframe._ytListenT); return; }
        try { iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {}
    };
    iframe._ytListenT = setInterval(send, 400);
    send();
}
window.addEventListener('message', e => {
    if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(e.origin || '')) return;
    let d;
    try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!d || !d.event) return;
    const iframe = Array.from(document.querySelectorAll('iframe.yt-player')).find(f => f.contentWindow === e.source);
    if (!iframe) return;
    iframe._ytGotInfo = true;
    const p = iframe._yt || (iframe._yt = {});
    if (d.event === 'onStateChange' && typeof d.info === 'number') p.state = d.info;
    if (d.event === 'infoDelivery' && d.info) {
        const info = d.info;
        if ('playerState' in info) p.state = info.playerState;
        if ('currentTime' in info) { p.time = info.currentTime; p.at = Date.now(); }
        if ('duration' in info && info.duration) p.dur = info.duration;
        if ('muted' in info) p.muted = !!info.muted;
        if (info.videoData && info.videoData.title) p.title = info.videoData.title;
    }
    const c = iframe.closest('.editor-container');
    if (c && p.title && !c.getAttribute('data-yt-title')) c.setAttribute('data-yt-title', p.title);
    _ytAudioUI(c);
});
// Moment de lecture estimé (entre deux messages du lecteur)
function _ytNow(p) {
    if (!p || p.time == null) return null;
    let t = p.time;
    if (p.state === 1 && p.at) t += (Date.now() - p.at) / 1000;
    return p.dur ? Math.min(p.dur, t) : t;
}
function _ytAudioUI(c) {
    if (!c || !c.classList.contains('yt-audio-mode')) return;
    const box = c.querySelector('.yt-audio');
    if (!box) return;
    const iframe = c.querySelector('iframe.yt-player');
    const p = (iframe && iframe._yt) || {};
    const id = c.getAttribute('data-yt-id');
    const img = box.querySelector('.yt-a-thumb');
    const th = id ? _ytThumb(id) : '';
    if (img && (img.getAttribute('src') || '') !== th) { if (th) img.setAttribute('src', th); else img.removeAttribute('src'); }
    const title = p.title || c.getAttribute('data-yt-title') || 'Vidéo YouTube';
    const tEl = box.querySelector('.yt-a-title');
    if (tEl && tEl.textContent !== title) { tEl.textContent = title; tEl.title = title; }
    const playing = p.state === 1 || p.state === 3;
    box.classList.toggle('is-playing', playing);
    const play = box.querySelector('.yt-a-play');
    if (play) { play.textContent = playing ? '❚❚' : '▶'; play.title = playing ? 'Pause' : 'Lecture'; }
    const now = _ytNow(p), dur = p.dur || 0;
    const fill = box.querySelector('.yt-a-fill');
    if (fill) fill.style.width = (dur && now != null ? Math.min(100, now / dur * 100) : 0) + '%';
    const time = box.querySelector('.yt-a-time');
    if (time) time.textContent = now == null ? '— / —' : _ytFmt(now) + ' / ' + _ytFmt(dur);
    const mute = box.querySelector('.yt-a-mute');
    if (mute) { mute.textContent = p.muted ? '🔇' : '🔊'; mute.title = p.muted ? 'Remettre le son' : 'Couper le son'; }
}
setInterval(() => document.querySelectorAll('.yt-v2.yt-audio-mode:not(.yt-empty)').forEach(_ytAudioUI), 500);

function _ytAudioAction(c, act, e) {
    if (c.classList.contains('yt-empty')) { _ytInputNudge(c, 'Colle d’abord un lien YouTube'); return; }
    const iframe = c.querySelector('iframe.yt-player');
    if (!iframe) return;
    const p = iframe._yt || (iframe._yt = {});
    if (act === 'aplay') {
        const playing = p.state === 1 || p.state === 3;
        _ytCmd(iframe, playing ? 'pauseVideo' : 'playVideo');
        if (p.time != null) { p.time = _ytNow(p); p.at = Date.now(); }
        p.state = playing ? 2 : 1;
    } else if (act === 'amute') {
        _ytCmd(iframe, p.muted ? 'unMute' : 'mute');
        p.muted = !p.muted;
    } else {
        let t;
        if (act === 'aseek') {
            if (!p.dur) return;
            const tr = c.querySelector('.yt-a-track').getBoundingClientRect();
            t = Math.max(0, Math.min(1, (e.clientX - tr.left) / (tr.width || 1))) * p.dur;
        } else {
            const now = _ytNow(p);
            if (now == null) { _ytFlash(c, 'Lance d’abord la lecture'); return; }
            t = now + (act === 'afwd' ? 10 : -10);
        }
        t = Math.max(0, p.dur ? Math.min(p.dur - 0.5, t) : t);
        _ytCmd(iframe, 'seekTo', [t, true]);
        p.time = t; p.at = Date.now();
    }
    _ytAudioUI(c);
}

/* ── Anciennes fonctions des onglets URL / Recherche ─────────────── */
function ytSwitchTab(btn, tab) {
    const container = btn.closest('.editor-container');
    container.querySelectorAll('.yt-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const ub = container.querySelector('.yt-url-bar'), sb = container.querySelector('.yt-search-bar');
    if (ub) ub.style.display = tab === 'url' ? 'flex' : 'none';
    if (sb) sb.style.display = tab === 'search' ? 'flex' : 'none';
    const si = container.querySelector('.yt-search-input');
    if (tab === 'search' && si) si.focus();
}
function ytSearchNewTab(container) {
    const el = container.querySelector('.yt-search-input') || container.querySelector('.yt-url-input');
    const query = el ? el.value.trim() : '';
    if (!query) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
}

// ── Bibliothèque YouTube ──────────────────────────────────────────
let _ytLibrary = [];

function _ytCurrentVideoId(container) {
    const id = container.getAttribute('data-yt-id');
    if (_ytIsId(id)) return id;
    const f = container.querySelector('iframe.yt-player');
    const m = (f && f.getAttribute('src') || '').match(/embed\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

function _ytRefreshFav(c) {
    if (!c) return;
    const b = c.querySelector('.yt-fav-btn');
    if (b) {
        const id = _ytCurrentVideoId(c);
        const saved = !!id && _ytLibrary.some(v => v.id === id);
        b.classList.toggle('saved', saved);
        b.textContent = c.classList.contains('yt-v2') ? (saved ? '♥' : '♡') : '♥';
        b.title = saved ? 'Retirer de ma bibliothèque' : 'Ajouter à ma bibliothèque';
    }
    const lb = c.querySelector('.yt-lib-btn');
    if (lb) {
        if (_ytLibrary.length) lb.setAttribute('data-count', _ytLibrary.length > 99 ? '99+' : _ytLibrary.length);
        else lb.removeAttribute('data-count');
    }
}
// La bibliothèque est commune à tous les widgets YouTube
function _ytRefreshAll() {
    document.querySelectorAll('.yt-fav-btn').forEach(b => {
        const c = b.closest('.editor-container');
        if (!c) return;
        _ytRefreshFav(c);
        if (c.querySelector('.yt-library.open')) ytRenderLibrary(c);
    });
}

async function ytToggleFav(btn) {
    const c = btn.closest('.editor-container');
    if (!c) return;
    const id = _ytCurrentVideoId(c);
    if (!id) {
        if (c.classList.contains('yt-v2')) _ytInputNudge(c, 'Lance d’abord une vidéo pour l’ajouter à ta bibliothèque');
        else alert('Aucune vidéo chargée.');
        return;
    }
    const existing = _ytLibrary.findIndex(v => v.id === id);
    if (existing !== -1) {
        if (!confirm('Retirer cette vidéo de ta bibliothèque ?')) return;
        _ytLibrary.splice(existing, 1);
        _ytFlash(c, 'Vidéo retirée de ta bibliothèque');
    } else {
        btn.textContent = '⏳';
        btn.disabled = true;
        let title = await _ytFetchTitle(id);
        btn.disabled = false;
        if (!title) {
            const f = c.querySelector('iframe.yt-player');
            title = c.getAttribute('data-yt-title') || (f && f._yt && f._yt.title) || ('Vidéo ' + id);
        }
        if (!_ytLibrary.some(v => v.id === id)) _ytLibrary.push({ id, title, thumb: _ytThumb(id), tag: '' });
        _ytFlash(c, '♥ Ajoutée à ta bibliothèque — tu peux lui donner un tag 🏷 depuis 📚', 2800);
    }
    _ytRefreshAll();
    _ytSave();
}

function _ytLibOpen(c, force) {
    const lib = c.querySelector('.yt-library');
    if (!lib) return;
    const open = force !== undefined ? !!force : !lib.classList.contains('open');
    lib.classList.toggle('open', open);
    c.classList.toggle('yt-lib-open', open);
    const lb = c.querySelector('.yt-lib-btn');
    if (lb) lb.classList.toggle('is-on', open);
    if (open) {
        ytRenderLibrary(c);
        const f = lib.querySelector('.yt-lib-filter');
        if (f && _ytLibrary.length && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
            try { f.focus({ preventScroll: true }); } catch (e) {}
        }
    }
}
function ytToggleLibrary(btn) {
    const c = btn.closest('.editor-container');
    if (c.classList.contains('yt-v2')) { _ytLibOpen(c); return; }
    const lib = c.querySelector('.yt-library');
    lib.classList.toggle('open');
    if (lib.classList.contains('open')) ytRenderLibrary(c);
}

function ytFilterKey(e, input) {
    e.stopPropagation();
    const c = input.closest('.editor-container');
    if (e.key === 'Escape') { e.preventDefault(); _ytLibOpen(c, false); }
    else if (e.key === 'Enter') {
        e.preventDefault();
        const first = c.querySelector('.yt-lib-grid .yt-card');
        if (first) _ytPlay(c, first.getAttribute('data-id'), 0);
    }
}

function ytRenderLibrary(container) {
    const c = container;
    if (!c) return;
    const grid = c.querySelector('.yt-lib-grid');
    if (!grid) return;
    const fEl = c.querySelector('.yt-lib-filter');
    const filter = (fEl && fEl.value || '').trim().toLowerCase();
    const cur = _ytCurrentVideoId(c);

    const cnt = c.querySelector('.yt-lib-count');
    if (cnt) cnt.textContent = _ytLibrary.length ? '(' + _ytLibrary.length + ')' : '';

    const tagsBox = c.querySelector('.yt-lib-tags');
    if (tagsBox) {
        const tags = [...new Set(_ytLibrary.map(v => String(v.tag || '').trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'fr'));
        tagsBox.innerHTML = tags.length
            ? '<button type="button" class="yt-chip' + (!filter ? ' is-on' : '') + '" data-yt-action="lib-chip" data-tag="">Toutes</button>' +
              tags.map(t => `<button type="button" class="yt-chip${filter === t.toLowerCase() ? ' is-on' : ''}" data-yt-action="lib-chip" data-tag="${_ytEsc(t)}">🏷 ${_ytEsc(t)}</button>`).join('')
            : '';
    }

    const items = _ytLibrary.map((v, i) => ({ v, i })).filter(({ v }) =>
        !filter || String(v.title || '').toLowerCase().includes(filter) || String(v.tag || '').toLowerCase().includes(filter));

    if (!_ytLibrary.length) {
        grid.innerHTML = '<div class="yt-lib-empty"><div class="yt-bigico">📭</div>Ta bibliothèque est vide.<br>Lance une vidéo, puis clique sur ♡ dans la barre du haut pour la ranger ici.</div>';
    } else if (!items.length) {
        grid.innerHTML = '<div class="yt-lib-empty">Aucune vidéo ne correspond à « ' + _ytEsc(filter) + ' ».</div>';
    } else {
        grid.innerHTML = items.map(({ v, i }) => {
            const id = String(v.id || '');
            const title = String(v.title || id);
            const tag = String(v.tag || '').trim();
            const now = id === cur;
            const thumb = v.thumb || _ytThumb(id);
            return `<div class="yt-card${now ? ' is-current' : ''}" data-yt-action="lib-play" data-id="${_ytEsc(id)}" title="${_ytEsc(title)}">
                <div class="yt-card-thumb"><img src="${_ytEsc(thumb)}" alt="" loading="lazy"><span class="yt-card-play">▶</span>${now ? '<span class="yt-card-now">En cours</span>' : ''}</div>
                <div class="yt-card-info"><div class="yt-card-title">${_ytEsc(title)}</div>${tag ? `<div class="yt-card-tag">🏷 ${_ytEsc(tag)}</div>` : ''}</div>
                <div class="yt-card-acts">
                    <button type="button" data-yt-action="lib-tag" data-i="${i}" title="Modifier le tag">🏷</button>
                    <button type="button" class="yt-card-del" data-yt-action="lib-del" data-i="${i}" title="Retirer de la bibliothèque">✕</button>
                </div>
            </div>`;
        }).join('');
    }
    _ytRefreshFav(c);
}

function _ytLibRemove(index, c) {
    const v = _ytLibrary[index];
    if (!v) return;
    _ytLibrary.splice(index, 1);
    _ytFlash(c, 'Retirée : ' + (v.title || v.id));
    _ytRefreshAll();
    _ytSave();
}
function _ytLibEditTag(index, c) {
    const v = _ytLibrary[index];
    if (!v) return;
    const others = [...new Set(_ytLibrary.map(x => String(x.tag || '').trim()).filter(Boolean))];
    const t = prompt('Tag pour « ' + (v.title || v.id) + ' » :' +
        (others.length ? '\n(tags déjà utilisés : ' + others.join(', ') + ')' : '') +
        '\nLaisse vide pour retirer le tag.', v.tag || '');
    if (t === null) return;
    v.tag = t.trim();
    _ytRefreshAll();
    _ytSave();
}

// Fonctions historiques
function ytPlayFromLib(videoId, card) { _ytPlay(card.closest('.editor-container'), videoId, 0); }
function ytRemoveFromLib(index, btn) { _ytLibRemove(index, btn.closest('.editor-container')); }

function _ytBtnMsg(btn, text, orig) {
    if (!btn) return;
    clearTimeout(btn._ytT);
    btn.textContent = text;
    btn._ytT = setTimeout(() => btn.textContent = orig, 2500);
}

let _ytImportBtn = null;
function ytImportLibrary(btn) {
    _ytImportBtn = btn;
    let input = document.getElementById('yt-lib-import-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'yt-lib-import-input';
        input.accept = '.json';
        input.style.display = 'none';
        input.addEventListener('change', ytImportLibraryFromInput);
        document.body.appendChild(input);
    }
    input.click();
}
// Les vidéos du fichier s'ajoutent à la bibliothèque (sans doublon)
function ytImportLibraryFromInput(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const btn = _ytImportBtn;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error();
            let added = 0;
            data.forEach(v => {
                if (!v || !_ytIsId(v.id) || _ytLibrary.some(x => x.id === v.id)) return;
                _ytLibrary.push({ id: v.id, title: String(v.title || v.id), thumb: v.thumb || _ytThumb(v.id), tag: String(v.tag || '') });
                added++;
            });
            _ytRefreshAll();
            _ytSave();
            _ytBtnMsg(btn, '✓ ' + added + ' ajoutée(s)', '⬆ Importer');
        } catch (e) {
            _ytBtnMsg(btn, '⚠ JSON invalide', '⬆ Importer');
        }
    };
    reader.readAsText(file);
}

function ytExportLibrary(btn) {
    if (!btn || !btn.closest) {
        const btns = document.querySelectorAll('.yt-library-toolbar button');
        btn = Array.from(btns).find(b => b.textContent.includes('Exporter'));
    }
    if (_ytLibrary.length === 0) { _ytBtnMsg(btn, '⚠ Vide', '⬇ Exporter'); return; }
    const blob = new Blob([JSON.stringify(_ytLibrary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bibliotheque-youtube.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    _ytBtnMsg(btn, '✓ Exporté', '⬇ Exporter');
}

/* ── Clics (délégués : survivent à la sauvegarde / restauration) ─── */
document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-yt-action]');
    if (!btn) return;
    const c = btn.closest('.yt-v2');
    if (!c) return;
    const act = btn.getAttribute('data-yt-action');
    const input = c.querySelector('.yt-url-input');
    switch (act) {
        case 'go':            loadYoutube(input); break;
        case 'clear':         input.value = ''; input.removeAttribute('value'); ytInputChanged(input); input.focus(); break;
        case 'paste':         _ytPasteClipboard(c); break;
        case 'search': {
            const q = input.value.trim();
            if (q && !_ytParse(q)) _ytSearch(c, q);
            else {
                input.value = ''; ytInputChanged(input); input.focus();
                _ytFlash(c, 'Tape tes mots-clés dans la barre du haut, puis Entrée', 2600);
            }
            break;
        }
        case 'fav':           ytToggleFav(btn); break;
        case 'library':       _ytLibOpen(c); break;
        case 'library-close': _ytLibOpen(c, false); break;
        case 'mode-video':    ytSetMode(c, 'video'); break;
        case 'mode-audio':    ytSetMode(c, 'audio'); break;
        case 'aplay': case 'aback': case 'afwd': case 'amute': case 'aseek':
            _ytAudioAction(c, act, e); break;
        case 'lib-play':      _ytPlay(c, btn.getAttribute('data-id'), 0); break;
        case 'lib-del':       e.stopPropagation(); _ytLibRemove(+btn.getAttribute('data-i'), c); break;
        case 'lib-tag':       e.stopPropagation(); _ytLibEditTag(+btn.getAttribute('data-i'), c); break;
        case 'lib-chip': {
            const f = c.querySelector('.yt-lib-filter');
            const tag = btn.getAttribute('data-tag') || '';
            f.value = (f.value.trim().toLowerCase() === tag.toLowerCase()) ? '' : tag;
            ytRenderLibrary(c);
            break;
        }
    }
});

/* ── Glisser-déposer d'un lien sur le widget ───────────────────────
   (les fichiers ne sont pas interceptés : ils restent pour le tableau) */
function _ytDragText(e) {
    const c = e.target.closest && e.target.closest('.yt-v2');
    if (!c || !e.dataTransfer) return null;
    const types = Array.from(e.dataTransfer.types || []);
    if (types.indexOf('Files') !== -1) return null;
    if (types.indexOf('text/uri-list') === -1 && types.indexOf('text/plain') === -1) return null;
    return c;
}
document.addEventListener('dragover', e => {
    const c = _ytDragText(e);
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    c.classList.add('yt-drag');
    clearTimeout(c._ytDragT);
    c._ytDragT = setTimeout(() => c.classList.remove('yt-drag'), 250);
});
document.addEventListener('drop', e => {
    const c = _ytDragText(e);
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    c.classList.remove('yt-drag');
    const raw = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '';
    const line = raw.split(/\r?\n/).find(l => l && l[0] !== '#') || '';
    const p = _ytParse(line);
    if (!p) { _ytInputNudge(c, 'Ce lien n’est pas une vidéo YouTube'); return; }
    _ytPlay(c, p.id, p.start);
});

/* ── Mise à jour des widgets : nouveaux, restaurés, ancienne interface ── */
// Remplace l'ancienne interface (onglets URL / Recherche) par la nouvelle
function _ytUpgrade(c) {
    const tpl = document.getElementById('template-youtube');
    const fresh = tpl && tpl.content.querySelector('.editor-container.yt-v2');
    if (!fresh) return;
    const old = c.querySelector('iframe.yt-player');
    const src = old ? (old.getAttribute('src') || '') : '';
    const audio = !!old && old.style.display === 'none';
    if (!c.style.width) c.style.width = '660px';
    if (!c.style.height || c.style.height === '50px') c.style.height = '420px';
    c.innerHTML = fresh.innerHTML;
    c.classList.add('yt-v2');
    c.setAttribute('data-yt-mode', audio ? 'audio' : 'video');
    if (/embed\/[a-zA-Z0-9_-]{11}/.test(src)) c.querySelector('iframe.yt-player').setAttribute('src', src);
}

function _ytInit(widget) {
    const c = widget.querySelector && widget.querySelector('.editor-container');
    if (!c) return;
    if (!c.classList.contains('yt-v2')) _ytUpgrade(c);
    if (!c.classList.contains('yt-v2')) return;
    // La classe editor-toolbar permet au tableau de déplacer / réduire le widget par sa barre
    const bar = c.querySelector('.yt-bar');
    if (bar) bar.classList.add('editor-toolbar');
    const iframe = c.querySelector('iframe.yt-player');
    const src = iframe ? (iframe.getAttribute('src') || '') : '';
    const m = src.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) c.setAttribute('data-yt-id', m[1]);
    c.classList.toggle('yt-empty', !m);
    c.classList.toggle('yt-audio-mode', c.getAttribute('data-yt-mode') === 'audio');
    c.classList.remove('yt-drag');
    _ytSegUI(c);
    _ytLibOpen(c, false);
    const fl = c.querySelector('.yt-flash');
    if (fl) fl.classList.remove('is-on');
    if (iframe) {
        if (!iframe._ytBound) {
            iframe._ytBound = true;
            iframe.addEventListener('load', () => { iframe._yt = {}; _ytListen(iframe); });
        }
        // Iframe restaurée sans la bonne politique ou sans pilotage : on la recharge une fois
        const changed = _ytPrepareIframe(iframe);
        if (m && (changed || src.indexOf('enablejsapi=1') === -1)) {
            const st = src.match(/[?&]start=(\d+)/);
            iframe.src = _ytEmbedUrl(m[1], st ? +st[1] : 0);
        }
    }
    const input = c.querySelector('.yt-url-input');
    if (input) ytInputChanged(input);
    _ytRefreshFav(c);
    if (m && !c.getAttribute('data-yt-title')) _ytLoadTitle(c, m[1]);
    _ytBarSync(widget);
    _ytAudioUI(c);
}
// Ancien nom, conservé
function _ytFixRestored(widget) { _ytInit(widget); }

// ── YouTube : en mode « fond transparent », la barre du haut s'efface ──────
// Quelques secondes après l'activation du mode transparent, la barre (URL +
// boutons) disparaît. Un clic sur le widget (y compris dans la vidéo) la fait
// réapparaître, ce qui permet de ressortir du mode transparent.
// Le mode transparent lui-même (toggleTransparency) n'est pas modifié : on
// observe simplement l'attribut data-transparent posé sur le widget.
const YT_BAR_HIDE_DELAY = 4000; // ms avant que la barre s'efface

function _ytIsTransparent(widget) {
    return !!widget && widget.dataset.transparent === 'true';
}

function _ytWidgetOf(node) {
    return (node && node.closest) ? node.closest('.widget[data-type="youtube"]') : null;
}

// (Ré)arme le minuteur d'effacement de la barre.
function _ytBarArm(widget) {
    clearTimeout(widget._ytBarTimer);
    if (!_ytIsTransparent(widget)) return;
    widget._ytBarTimer = setTimeout(() => {
        if (!widget.isConnected || !_ytIsTransparent(widget)) return;
        const tb  = widget.querySelector('.yt-bar, .editor-toolbar');
        const lib = widget.querySelector('.yt-library');
        const inp = widget.querySelector('.yt-url-input');
        // On ne masque pas la barre si la souris est dessus, si on y écrit ou si la bibliothèque est ouverte.
        const busy = (tb && tb.matches(':hover')) || (lib && lib.classList.contains('open')) || (inp && document.activeElement === inp);
        if (busy) { _ytBarArm(widget); return; }
        widget.classList.add('yt-bar-hidden');
    }, YT_BAR_HIDE_DELAY);
}

// Affiche la barre et relance le minuteur.
function _ytBarShow(widget) {
    widget.classList.remove('yt-bar-hidden');
    _ytBarArm(widget);
}

// Synchronise l'état de la barre avec data-transparent.
function _ytBarSync(widget) {
    if (!widget || !widget.classList || !widget.classList.contains('widget')) return;
    if (_ytIsTransparent(widget)) {
        _ytBarArm(widget);
    } else {
        clearTimeout(widget._ytBarTimer);
        widget.classList.remove('yt-bar-hidden');
    }
}

// Clic / clavier / focus dans le widget → la barre réapparaît.
['pointerdown', 'keydown', 'focusin'].forEach(evt => {
    document.addEventListener(evt, e => {
        const w = _ytWidgetOf(e.target);
        if (w && _ytIsTransparent(w)) _ytBarShow(w);
    }, true);
});

// Un clic DANS l'iframe YouTube n'est pas visible par la page (iframe
// cross-origin) : on le détecte via la perte de focus de la fenêtre. On rend
// ensuite le focus à la page pour que le clic suivant soit détecté à son tour.
window.addEventListener('blur', () => {
    setTimeout(() => {
        const ae = document.activeElement;
        if (!ae || ae.tagName !== 'IFRAME') return;
        const w = _ytWidgetOf(ae);
        if (!w || !_ytIsTransparent(w)) return;
        _ytBarShow(w);
        setTimeout(() => {
            if (document.activeElement === ae) {
                try { ae.blur(); window.focus(); } catch (_) {}
            }
        }, 400);
    }, 0);
});

// Surveille l'activation/désactivation du mode transparent et la création de
// widgets YouTube (y compris ceux restaurés depuis une sauvegarde).
(function _ytBarObserve() {
    const root = document.body || document.documentElement;
    new MutationObserver(muts => {
        for (const m of muts) {
            if (m.type === 'attributes') {
                const w = m.target;
                if (w.classList && w.classList.contains('widget') && w.dataset.type === 'youtube') _ytBarSync(w);
            } else {
                m.addedNodes.forEach(n => {
                    if (n.nodeType !== 1) return;
                    if (n.matches('.widget[data-type="youtube"]')) _ytInit(n);
                    else if (n.querySelectorAll) n.querySelectorAll('.widget[data-type="youtube"]').forEach(_ytInit);
                });
            }
        }
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-transparent'] });
})();

/* ── Styles ─────────────────────────────────────────────────────── */
(function _ytStyles() {
    if (document.getElementById('yt-v2-styles')) return;
    const st = document.createElement('style');
    st.id = 'yt-v2-styles';
    st.textContent = `
.editor-container.yt-v2{
  --yt-bar-h:44px; container-type:inline-size; position:relative; display:flex; flex-direction:column;
  overflow:hidden; box-sizing:border-box; padding:0; background:#18181c; color:#eee;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13px;
}
.yt-v2 button{font-family:inherit}
.yt-v2 :focus-visible{outline:2px solid #4a90e2;outline-offset:1px}
/* Barre du haut */
.yt-v2 .yt-bar{flex:none;position:relative;z-index:10;height:var(--yt-bar-h);min-height:0;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  padding:0 10px;visibility:visible;opacity:1;background:#232329;border-bottom:1px solid #2f2f37;transition:opacity .35s,margin-top .35s,background .2s}
.yt-v2 .yt-field{flex:1;min-width:90px;display:flex;align-items:center;height:30px;box-sizing:border-box;padding:0 3px 0 10px;
  background:#2f2f38;border:1px solid #3a3a44;border-radius:99px;transition:border-color .15s,background .15s}
.yt-v2 .yt-field:focus-within{border-color:#4a90e2;background:#26262e}
.yt-v2.yt-drag .yt-field{border-color:#4a90e2;border-style:dashed}
.yt-v2 .yt-field.is-bad{border-color:#ff5f57;animation:yt-shake .3s}
@keyframes yt-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.yt-v2 .yt-field-ico{flex:none;font-size:12px;opacity:.75;margin-right:6px}
.yt-v2 .yt-url-input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:13px;padding:0}
.yt-v2 .yt-url-input::placeholder{color:#8d8d99}
.yt-v2 .yt-clear{display:none;flex:none;width:22px;height:22px;border:0;border-radius:50%;background:transparent;color:#8d8d99;
  font-size:11px;cursor:pointer;align-items:center;justify-content:center;padding:0;margin-right:2px}
.yt-v2 .yt-clear:hover{background:rgba(255,255,255,.12);color:#fff}
.yt-v2 .yt-field.has-text .yt-clear{display:inline-flex}
.yt-v2 .yt-go{flex:none;height:24px;border:0;border-radius:99px;background:#4a90e2;color:#fff;font-size:12px;font-weight:600;
  padding:0 12px;cursor:pointer;white-space:nowrap}
.yt-v2 .yt-go:hover{background:#3b7fd0}
.yt-v2 .yt-go.is-search{background:#7b61d9}
.yt-v2 .yt-go.is-search:hover{background:#6a50c8}
.yt-v2 .yt-ib{flex:none;position:relative;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#cfcfd6;
  font-size:15px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.yt-v2 .yt-ib:hover{background:rgba(255,255,255,.1);color:#fff}
.yt-v2 .yt-ib.is-on{background:rgba(74,144,226,.25);color:#fff}
.yt-v2 .yt-ib:disabled{opacity:.6;cursor:wait}
.yt-v2 .yt-fav-btn{font-size:18px}
.yt-v2 .yt-fav-btn.saved{color:#ff4d6d}
.yt-v2 .yt-lib-btn[data-count]::after{content:attr(data-count);position:absolute;top:1px;right:-1px;min-width:14px;height:14px;padding:0 3px;
  box-sizing:border-box;border-radius:7px;background:#4a90e2;color:#fff;font-size:9px;font-weight:700;line-height:14px;text-align:center}
.yt-v2 .yt-seg{flex:none;display:inline-flex;gap:2px;padding:2px;background:#2f2f38;border-radius:99px}
.yt-v2 .yt-seg-btn{height:26px;border:0;border-radius:99px;background:transparent;color:#aeaeb8;font-size:12px;padding:0 9px;cursor:pointer;white-space:nowrap}
.yt-v2 .yt-seg-btn:hover{color:#fff}
.yt-v2 .yt-seg-btn.is-on{background:#4a90e2;color:#fff;font-weight:600}
@container (max-width: 620px){ .yt-v2 .yt-lbl{display:none} .yt-v2 .yt-seg-btn{padding:0 7px} }
@container (max-width: 480px){ .yt-v2 .yt-sm-hide{display:none !important} .yt-v2 .yt-go-lbl{display:none} .yt-v2 .yt-bar{gap:3px;padding:0 6px} }
/* Zone vidéo */
.yt-v2 .yt-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:#000}
.yt-v2 .yt-player{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#000}
.yt-v2.yt-empty .yt-player{visibility:hidden}
.yt-v2.yt-audio-mode .yt-player{display:none}
/* Accueil */
.yt-v2 .yt-msg{position:absolute;inset:0;z-index:3;display:none;align-items:center;justify-content:center;text-align:center;
  padding:16px;overflow:auto;background:radial-gradient(circle at 50% 35%,#24243a,#111114 70%);color:#e6e6ea;line-height:1.45}
.yt-v2.yt-empty .yt-msg{display:flex}
.yt-v2 .yt-msg-box{max-width:470px}
.yt-v2 .yt-bigico{font-size:42px;line-height:1;margin-bottom:8px}
.yt-v2 .yt-title{font-weight:700;font-size:16px;margin-bottom:4px}
.yt-v2 .yt-msg-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
.yt-v2 .yt-btn{padding:9px 16px;border:0;border-radius:99px;background:#4a90e2;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.yt-v2 .yt-btn:hover{background:#3b7fd0}
.yt-v2 .yt-btn.yt-btn-2{background:rgba(255,255,255,.1);color:#e6e6ea}
.yt-v2 .yt-btn.yt-btn-2:hover{background:rgba(255,255,255,.18);color:#fff}
.yt-v2 .yt-hint{font-size:12px;color:#9a9aa6;margin-top:12px}
.yt-v2 .yt-msg-mini{display:none;font-size:13px;color:#cfcfd6}
.yt-v2.yt-audio-mode .yt-msg{padding:8px 12px}
.yt-v2.yt-audio-mode .yt-msg-box{display:none}
.yt-v2.yt-audio-mode .yt-msg-mini{display:block}
.yt-v2.yt-drag .yt-stage::after{content:'Dépose le lien YouTube ici';position:absolute;inset:8px;z-index:12;display:flex;align-items:center;justify-content:center;
  border:3px dashed #4a90e2;border-radius:10px;background:rgba(74,144,226,.18);color:#fff;font-weight:700;font-size:15px;pointer-events:none}
/* Mode audio */
.yt-v2.yt-audio-mode{height:calc(var(--yt-bar-h) + 76px) !important}
.yt-v2.yt-audio-mode.yt-lib-open{height:var(--yt-h,420px) !important}
.yt-v2 .yt-audio{position:absolute;inset:0;z-index:2;display:none;align-items:center;gap:12px;padding:0 12px;
  background:linear-gradient(90deg,#26223e,#18181c 75%)}
.yt-v2.yt-audio-mode:not(.yt-empty) .yt-audio{display:flex}
.yt-v2 .yt-a-thumb{flex:none;width:84px;height:47px;object-fit:cover;border-radius:6px;background:#000;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.yt-v2 .yt-audio.is-playing .yt-a-thumb{animation:yt-beat 1.4s ease-in-out infinite}
@keyframes yt-beat{50%{transform:scale(1.05)}}
.yt-v2 .yt-a-main{flex:1;min-width:0}
.yt-v2 .yt-a-title{font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yt-v2 .yt-a-seek{height:14px;display:flex;align-items:center;cursor:pointer}
.yt-v2 .yt-a-track{position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.25);transition:height .12s}
.yt-v2 .yt-a-seek:hover .yt-a-track{height:7px}
.yt-v2 .yt-a-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;background:#4a90e2}
.yt-v2 .yt-a-time{font-size:11px;color:#bdbdc6;font-variant-numeric:tabular-nums}
.yt-v2 .yt-a-btns{flex:none;display:flex;align-items:center;gap:2px}
.yt-v2 .yt-cb{height:32px;min-width:32px;border:0;border-radius:8px;background:transparent;color:#fff;font-size:12px;font-weight:600;cursor:pointer;padding:0 6px}
.yt-v2 .yt-cb:hover{background:rgba(255,255,255,.14)}
.yt-v2 .yt-cb.yt-a-play{width:40px;height:40px;border-radius:50%;background:#fff;color:#111;font-size:14px;margin:0 2px}
.yt-v2 .yt-cb.yt-a-play:hover{background:#e6e6e6}
.yt-v2 .yt-cb.yt-a-mute{font-size:15px;font-weight:400}
@container (max-width: 480px){ .yt-v2 .yt-a-thumb,.yt-v2 .yt-a-skip{display:none} }
/* Bibliothèque */
.yt-v2 .yt-library{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;max-height:none;margin:0;padding:0;border:0;
  background:#1d1d23;color:#e6e6ea;overflow:hidden}
.yt-v2 .yt-library.open{display:flex}
.yt-v2 .yt-lib-head{flex:none;display:flex;align-items:center;justify-content:space-between;padding:8px 10px 2px 14px}
.yt-v2 .yt-lib-h{font-weight:700;font-size:15px}
.yt-v2 .yt-lib-count{font-weight:400;color:#8d8d99;font-size:12px}
.yt-v2 .yt-library-toolbar{flex:none;display:flex;align-items:center;gap:6px;padding:6px 12px;margin:0;background:none;border:0}
.yt-v2 .yt-lib-filter{flex:1;min-width:0;height:30px;box-sizing:border-box;padding:0 12px;border:1px solid #3a3a44;border-radius:99px;
  background:#2a2a32;color:#fff;font:inherit;outline:0}
.yt-v2 .yt-lib-filter:focus{border-color:#4a90e2}
.yt-v2 .yt-lib-filter::placeholder{color:#8d8d99}
.yt-v2 .yt-library-toolbar button{flex:none;height:30px;padding:0 11px;border:1px solid #3a3a44;border-radius:99px;background:transparent;
  color:#cfcfd6;font-size:12px;cursor:pointer;white-space:nowrap}
.yt-v2 .yt-library-toolbar button:hover{background:rgba(255,255,255,.08);color:#fff}
@container (max-width: 480px){ .yt-v2 .yt-library-toolbar{flex-wrap:wrap} .yt-v2 .yt-lib-filter{flex-basis:100%} }
.yt-v2 .yt-lib-tags{flex:none;display:flex;flex-wrap:wrap;gap:5px;padding:2px 12px 6px}
.yt-v2 .yt-lib-tags:empty{display:none}
.yt-v2 .yt-chip{border:0;border-radius:99px;background:rgba(255,255,255,.08);color:#cfcfd6;font-size:11px;padding:4px 10px;cursor:pointer}
.yt-v2 .yt-chip:hover{background:rgba(255,255,255,.15);color:#fff}
.yt-v2 .yt-chip.is-on{background:#4a90e2;color:#fff}
.yt-v2 .yt-lib-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));
  gap:10px;padding:6px 12px 12px;align-content:start;background:none}
.yt-v2 .yt-card{position:relative;display:flex;flex-direction:column;border-radius:9px;overflow:hidden;background:#26262e;cursor:pointer;
  transition:transform .12s,box-shadow .12s}
.yt-v2 .yt-card:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.45)}
.yt-v2 .yt-card.is-current{box-shadow:0 0 0 2px #4a90e2}
.yt-v2 .yt-card-thumb{position:relative;aspect-ratio:16/9;background:#000}
.yt-v2 .yt-card-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.yt-v2 .yt-card-play{position:absolute;inset:0;margin:auto;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;
  display:flex;align-items:center;justify-content:center;padding-left:3px;box-sizing:border-box;opacity:0;transition:opacity .12s}
.yt-v2 .yt-card:hover .yt-card-play{opacity:1}
.yt-v2 .yt-card-now{position:absolute;left:6px;top:6px;padding:2px 7px;border-radius:99px;background:#4a90e2;color:#fff;font-size:10px;font-weight:700}
.yt-v2 .yt-card-info{padding:6px 8px 8px}
.yt-v2 .yt-card-title{font-size:12px;font-weight:600;line-height:1.3;color:#f0f0f4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.yt-v2 .yt-card-tag{margin-top:4px;font-size:11px;color:#9cc4f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yt-v2 .yt-card-acts{position:absolute;right:5px;top:5px;display:flex;gap:4px;opacity:0;transition:opacity .12s}
.yt-v2 .yt-card:hover .yt-card-acts{opacity:1}
.yt-v2 .yt-card-acts button{width:24px;height:24px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font-size:11px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;padding:0}
.yt-v2 .yt-card-acts button:hover{background:#4a90e2}
.yt-v2 .yt-card-acts .yt-card-del:hover{background:#c0392b}
.yt-v2 .yt-lib-empty{grid-column:1/-1;text-align:center;color:#9a9aa6;padding:28px 10px;line-height:1.5}
@media (hover: none){ .yt-v2 .yt-card-acts,.yt-v2 .yt-card-play{opacity:1} }
/* Message temporaire */
.yt-v2 .yt-flash{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;max-width:calc(100% - 24px);box-sizing:border-box;
  padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;font-weight:600;line-height:1.35;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
.yt-v2 .yt-flash.is-on{opacity:1}
/* Fond transparent : barre translucide qui s'efface après quelques secondes */
.widget[data-transparent="true"] .yt-v2,
.widget[data-transparent="true"] .yt-v2 .yt-stage{background:transparent}
.widget[data-transparent="true"] .yt-v2 .yt-bar{background:rgba(24,24,30,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom-color:transparent}
.widget[data-transparent="true"] .yt-v2 .yt-msg{background:rgba(16,16,22,.55)}
.widget[data-transparent="true"] .yt-v2 .yt-audio{background:rgba(24,24,30,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.widget[data-transparent="true"] .yt-v2 .yt-transp{background:rgba(74,144,226,.25)}
.widget.yt-bar-hidden .yt-v2 .yt-bar{opacity:0;pointer-events:none;margin-top:calc(-1 * var(--yt-bar-h))}
/* Plein écran navigateur */
.yt-v2:fullscreen{width:100% !important;height:100% !important}
@media print{ .yt-v2 .yt-bar,.yt-v2 .yt-library,.yt-v2 .yt-audio{display:none} }
`;
    document.head.appendChild(st);
})();

// Widgets YouTube déjà présents au chargement du script.
document.querySelectorAll('.widget[data-type="youtube"]').forEach(_ytInit);
