// =========================================================================
// WIDGET YOUTUBE
// =========================================================================
// Modèle HTML du widget (anciennement dans index.html), ajouté au document
// dès le chargement du script pour que createWidget('youtube') le trouve.
document.body.insertAdjacentHTML('beforeend', `
<template id="template-youtube">
    <div class="editor-container" style="height:420px;width:660px;">
        <div class="editor-toolbar" style="flex-wrap:wrap;gap:4px;padding:4px 35px;">
            <!-- Onglets -->
            <button class="yt-tab-btn active" onclick="ytSwitchTab(this,'url')" title="Coller une URL">🔗 URL</button>
            <button class="yt-tab-btn" onclick="ytSwitchTab(this,'search')" title="Rechercher une vidéo">🔍 Recherche</button>
            <!-- Barre URL -->
            <div class="yt-url-bar" style="display:flex;flex:1;gap:4px;min-width:0;">
                <input type="text" class="yt-url-input" placeholder="Collez le lien YouTube ici…" style="flex-grow:1;" onchange="loadYoutube(this)" onkeydown="if(event.key==='Enter')loadYoutube(this)">
                <button onmousedown="event.stopPropagation()" onclick="loadYoutube(this.previousElementSibling)" title="Lancer la vidéo">▶</button>
            </div>
            <!-- Barre Recherche -->
            <div class="yt-search-bar" style="display:none;flex:1;gap:4px;min-width:0;">
                <input type="text" class="yt-search-input" placeholder="Rechercher sur YouTube…" style="flex-grow:1;" onkeydown="if(event.key==='Enter')ytSearchNewTab(this.closest('.editor-container'))">
                <button onclick="ytSearchNewTab(this.closest('.editor-container'))" title="Ouvrir la recherche dans un nouvel onglet">🔍 Ouvrir YouTube</button>
            </div>
            <!-- Boutons droite -->
            <button class="yt-fav-btn" onclick="ytToggleFav(this)" title="Ajouter à la bibliothèque">♥</button>
            <button onclick="ytToggleLibrary(this)" title="Ma bibliothèque">📚</button>
            <button onclick="toggleYoutubeView(this,'none')" title="Mode Audio">🔊</button>
            <button onclick="toggleYoutubeView(this,'flex')" title="Mode Vidéo">📺</button>
            <button onclick="toggleFullScreen(this.closest('.editor-container'))" title="Plein écran navigateur">⛶</button>
            <button onclick="toggleTransparency(this)" title="Fond transparent"><span class="icon-transparency"></span></button>
            <div class="wf-btns">
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <!-- Bibliothèque -->
        <div class="yt-library">
            <div class="yt-library-toolbar">
                <input type="text" class="yt-lib-filter" placeholder="Filtrer par titre ou tag…" oninput="ytRenderLibrary(this.closest('.editor-container'))" onkeydown="event.stopPropagation()" onmousedown="event.stopPropagation()" onclick="event.stopPropagation()">
                <button onmousedown="event.stopPropagation()" onclick="ytImportLibrary(this)" title="Importer un fichier JSON">⬆ Importer</button>
                <button onmousedown="event.stopPropagation()" onclick="ytExportLibrary()" title="Exporter la bibliothèque">⬇ Exporter</button>
            </div>
            <div class="yt-lib-grid"></div>
        </div>
        <!-- Lecteur -->
        <iframe class="yt-player" src="" style="flex-grow:1;border:none;background:#000;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe>
    </div>
</template>
`);

// ── YouTube : correctif « erreur 153 » ────────────────────────────
// YouTube refuse désormais certaines vidéos intégrées (erreur 153 « erreur de
// configuration du lecteur vidéo ») quand l'iframe n'envoie pas d'en-tête
// Referer identifiant le site qui l'intègre. Les vidéos dont l'auteur a
// restreint l'intégration sont les premières touchées, d'où le fait que
// « certaines » vidéos seulement échouent. On force donc une politique
// de référent compatible et on passe le paramètre origin.
const _YT_REFERRER_POLICY = 'strict-origin-when-cross-origin';
const _YT_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';

function _ytEmbedUrl(videoId) {
    let u = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
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

function _ytSetVideo(iframe, videoId) {
    _ytPrepareIframe(iframe);
    iframe.src = _ytEmbedUrl(videoId);
}

// Widgets restaurés depuis une sauvegarde : leur iframe a déjà un src chargé
// sans la bonne politique → on corrige et on recharge une fois.
function _ytFixRestored(widget) {
    const iframe = widget.querySelector && widget.querySelector('iframe.yt-player');
    if (!iframe) return;
    const changed = _ytPrepareIframe(iframe);
    const m = (iframe.getAttribute('src') || '').match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (changed && m) iframe.src = _ytEmbedUrl(m[1]);
}

function loadYoutube(input) {
    const container = input.closest('.editor-container');
    const iframe = container.querySelector('iframe.yt-player');
    let url = input.value.trim();
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;
    if (videoId && window.electronAPI && typeof window.electronAPI.openYoutube === 'function') {
        window.electronAPI.openYoutube(videoId);
    } else {
        if (videoId) _ytSetVideo(iframe, videoId);
        else { _ytPrepareIframe(iframe); iframe.src = url; }
    }
    saveBoard();
}
function toggleYoutubeView(btn, display) {
    const c = btn.closest('.editor-container');
    c.querySelector('iframe.yt-player').style.display = display;
    c.style.height = display === 'none' ? '50px' : '';
    saveBoard();
}
function ytSwitchTab(btn, tab) {
    const container = btn.closest('.editor-container');
    container.querySelectorAll('.yt-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    container.querySelector('.yt-url-bar').style.display    = tab === 'url'    ? 'flex' : 'none';
    container.querySelector('.yt-search-bar').style.display = tab === 'search' ? 'flex' : 'none';
    if (tab === 'search') container.querySelector('.yt-search-input').focus();
}
function ytSearchNewTab(container) {
    const query = container.querySelector('.yt-search-input').value.trim();
    if (!query) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
}

// ── Bibliothèque YouTube ──────────────────────────────────────────
let _ytLibrary = [];

function _ytCurrentVideoId(container) {
    const src = container.querySelector('iframe.yt-player').src;
    const m = src.match(/embed\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

async function ytToggleFav(btn) {
    const container = btn.closest('.editor-container');
    const videoId = _ytCurrentVideoId(container);
    if (!videoId) { alert('Aucune vidéo chargée.'); return; }
    const existing = _ytLibrary.findIndex(v => v.id === videoId);
    if (existing !== -1) {
        if (!confirm('Retirer cette vidéo de la bibliothèque ?')) return;
        _ytLibrary.splice(existing, 1);
        btn.classList.remove('saved');
        btn.title = 'Ajouter à la bibliothèque';
    } else {
        const tag = prompt('Catégorie / tag (optionnel) :', '') || '';
        btn.textContent = '⏳';
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await res.json();
            _ytLibrary.push({ id: videoId, title: data.title, thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, tag });
        } catch {
            const title = prompt('Titre de la vidéo :', '') || videoId;
            _ytLibrary.push({ id: videoId, title, thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, tag });
        }
        btn.classList.add('saved');
        btn.title = 'Retirer de la bibliothèque';
    }
    btn.textContent = '♥';
    ytRenderLibrary(container);
}

function ytToggleLibrary(btn) {
    const container = btn.closest('.editor-container');
    const lib = container.querySelector('.yt-library');
    lib.classList.toggle('open');
    if (lib.classList.contains('open')) ytRenderLibrary(container);
}

function ytRenderLibrary(container) {
    const filter = (container.querySelector('.yt-lib-filter').value || '').toLowerCase();
    const grid = container.querySelector('.yt-lib-grid');
    const items = _ytLibrary.filter(v =>
        v.title.toLowerCase().includes(filter) || v.tag.toLowerCase().includes(filter)
    );
    if (items.length === 0) {
        grid.innerHTML = '<div class="yt-lib-empty">Bibliothèque vide.<br>Chargez une vidéo puis cliquez sur ♥</div>';
        return;
    }
    grid.innerHTML = items.map((v, i) => `
        <div class="yt-lib-card" onmousedown="event.stopPropagation()" onclick="ytPlayFromLib('${v.id}', this)">
            <img src="${v.thumb}" alt="${v.title.replace(/"/g,'&quot;')}" loading="lazy">
            <button class="yt-lib-del" onclick="event.stopPropagation();ytRemoveFromLib(${_ytLibrary.indexOf(v)},this)" title="Supprimer">×</button>
            <div class="yt-lib-info">
                <div class="yt-lib-title">${v.title}</div>
                ${v.tag ? `<div class="yt-lib-tag">🏷 ${v.tag}</div>` : ''}
            </div>
        </div>`).join('');
    // Marquer le favori actif
    const currentId = _ytCurrentVideoId(container);
    const favBtn = container.querySelector('.yt-fav-btn');
    const isSaved = _ytLibrary.some(v => v.id === currentId);
    favBtn.classList.toggle('saved', isSaved);
    favBtn.title = isSaved ? 'Retirer de la bibliothèque' : 'Ajouter à la bibliothèque';
}

function ytPlayFromLib(videoId, card) {
    const container = card.closest('.editor-container');
    const iframe = container.querySelector('iframe.yt-player');
    if (window.electronAPI && typeof window.electronAPI.openYoutube === 'function') {
        window.electronAPI.openYoutube(videoId);
    } else {
        _ytSetVideo(iframe, videoId);
    }
    container.querySelector('.yt-library').classList.remove('open');
    const favBtn = container.querySelector('.yt-fav-btn');
    favBtn.classList.add('saved');
    favBtn.title = 'Retirer de la bibliothèque';
    saveBoard();
}

function ytRemoveFromLib(index, btn) {
    _ytLibrary.splice(index, 1);
    const container = btn.closest('.editor-container');
    ytRenderLibrary(container);
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
            _ytLibrary = data;
            if (btn) {
                ytRenderLibrary(btn.closest('.editor-container'));
                btn.textContent = '✓ ' + data.length + ' importée(s)';
                setTimeout(() => btn.textContent = '⬆ Importer', 2500);
            }
        } catch {
            if (btn) {
                btn.textContent = '⚠ JSON invalide';
                setTimeout(() => btn.textContent = '⬆ Importer', 2500);
            }
        }
    };
    reader.readAsText(file);
}

function ytExportLibrary() {
    const btns = document.querySelectorAll('.yt-library-toolbar button');
    const btn = Array.from(btns).find(b => b.textContent.includes('Exporter'));
    if (_ytLibrary.length === 0) {
        if (btn) { const t = btn.textContent; btn.textContent = '⚠ Vide'; setTimeout(() => btn.textContent = t, 2000); }
        return;
    }
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(_ytLibrary, null, 2));
    a.download = 'bibliotheque-youtube.json';
    document.body.appendChild(a); a.click(); a.remove();
    if (btn) { const t = btn.textContent; btn.textContent = '✓ Exporté'; setTimeout(() => btn.textContent = t, 2000); }
}

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
        const tb  = widget.querySelector('.editor-toolbar');
        const lib = widget.querySelector('.yt-library');
        // On ne masque pas la barre si la souris est dessus ou si la bibliothèque est ouverte.
        const busy = (tb && tb.matches(':hover')) || (lib && lib.classList.contains('open'));
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
                    if (n.matches('.widget[data-type="youtube"]')) { _ytBarSync(n); _ytFixRestored(n); }
                    else if (n.querySelectorAll) n.querySelectorAll('.widget[data-type="youtube"]').forEach(w => { _ytBarSync(w); _ytFixRestored(w); });
                });
            }
        }
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-transparent'] });
})();

// Widgets YouTube déjà présents au chargement du script.
document.querySelectorAll('.widget[data-type="youtube"]').forEach(_ytFixRestored);
