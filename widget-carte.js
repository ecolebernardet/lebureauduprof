// =========================================================================
// WIDGET CARTE (Google Maps)
// =========================================================================
// Modèle HTML du widget (anciennement dans index.html), ajouté au document
// dès le chargement du script pour que createWidget('carte') le trouve.
document.body.insertAdjacentHTML('beforeend', `
<template id="template-carte">
    <div class="editor-container" style="height:800px;width:1000px;" data-carte-zoom="18">
        <button class="exit-fs-btn" onclick="document.exitFullscreen()">✖ Quitter Plein Écran</button>
        <div class="editor-toolbar" style="flex-wrap:wrap;gap:4px;">
            <span style="font-size:12px;font-weight:700;color:#555;pointer-events:none;white-space:nowrap;">🗺️ Google Maps</span>
            <button class="carte-preset-btn active" onclick="carteSetPreset(this,'chambery')" title="Chambéry">📍 Chambéry</button>
            <button class="carte-preset-btn" onclick="carteSetPreset(this,'france')" title="France entière">🇫🇷 France</button>
            <button class="carte-preset-btn" onclick="carteSetPreset(this,'monde')" title="Monde">🌍 Monde</button>
            <input type="text" class="carte-address-input" placeholder="Adresse ou lieu..." value="HVGX+8GJ Chambéry" style="flex-grow:1;min-width:120px;" onchange="loadCarteAddress(this)" onkeydown="if(event.key==='Enter')loadCarteAddress(this)">
            <button onclick="carteZoom(this,-1)" title="Zoom arrière">➖</button>
            <button onclick="carteZoom(this,1)" title="Zoom avant">➕</button>
            <button class="carte-wallpaper-btn" onclick="carteToggleWallpaper(this)" title="Occuper tout le fond du board (vue live, derrière les autres widgets)">🖼️</button>
            <button onclick="toggleFullScreen(this.closest('.editor-container'))" title="Plein écran navigateur">⛶</button>
            <div class="wf-btns">
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <iframe class="carte-frame" src="https://www.google.com/maps?q=HVGX%2B8GJ+Chamb%C3%A9ry&z=18&t=k&output=embed" style="flex-grow:1;border:none;background:white;" allow="fullscreen"></iframe>
    </div>
</template>
`);

// ── Widget Carte (Google Maps, vue satellite) ───────────────────────
const CARTE_PRESETS = {
    chambery: { address: 'HVGX+8GJ Chambéry', zoom: 18 },
    france:   { address: 'France',            zoom: 6  },
    monde:    { address: '0,0',               zoom: 2  }
};

function carteSetPreset(btn, key) {
    const container = btn.closest('.editor-container');
    const preset = CARTE_PRESETS[key];
    if (!preset || !container) return;
    container.querySelectorAll('.carte-preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = container.querySelector('.carte-address-input');
    if (input) input.value = preset.address;
    container.dataset.carteZoom = preset.zoom;
    if (input) loadCarteAddress(input);
}

function loadCarteAddress(input) {
    const container = input.closest('.editor-container');
    const iframe = container.querySelector('iframe.carte-frame');
    const address = input.value.trim();
    const q = address ? encodeURIComponent(address) : 'France';
    const zoom = container.dataset.carteZoom || 18;
    if (iframe) iframe.src = `https://www.google.com/maps?q=${q}&z=${zoom}&t=k&output=embed`;
    saveBoard();
}

function carteZoom(btn, delta) {
    const container = btn.closest('.editor-container');
    let zoom = parseInt(container.dataset.carteZoom || '18', 10);
    zoom = Math.min(21, Math.max(1, zoom + delta));
    container.dataset.carteZoom = zoom;
    const input = container.querySelector('.carte-address-input');
    if (input) loadCarteAddress(input);
}

// « Fond d'écran » pour la carte : contrairement au PDF (qui peut capturer sa
// page en image via <canvas> et l'envoyer à applyBackground()), la carte est
// une <iframe> cross-origin (google.com) — son contenu ne peut PAS être capturé
// en image par sécurité navigateur (canvas "tainted"). On simule donc l'effet
// en agrandissant la carte pour couvrir tout le board, en l'envoyant derrière
// les autres widgets et en désactivant ses clics : visuellement un fond
// d'écran, mais ça reste une iframe Google Maps vivante, pas une image figée.
function carteToggleWallpaper(btn) {
    const widget = btn.closest('.widget');
    if (!widget) return;
    const container = widget.querySelector('.editor-container');
    const iframe = widget.querySelector('iframe.carte-frame');
    snapshotNow();

    if (widget.dataset.carteWallpaper === 'true') {
        // Restaurer la taille/position précédentes
        widget.dataset.carteWallpaper = 'false';
        btn.classList.remove('active');
        const saved = widget._carteWallpaperSaved;
        widget.style.left = saved ? saved.left : widget.style.left;
        widget.style.top  = saved ? saved.top  : widget.style.top;
        if (container) {
            container.style.width  = saved ? saved.w : container.style.width;
            container.style.height = saved ? saved.h : container.style.height;
        }
        widget.dataset.background = 'false';
        widgetZCounter++;
        widget.style.zIndex = widgetZCounter;
        if (iframe) iframe.style.pointerEvents = '';
    } else {
        // Mémoriser la taille/position actuelles pour pouvoir revenir en arrière
        widget._carteWallpaperSaved = {
            left: widget.style.left,
            top:  widget.style.top,
            w: container ? container.style.width  : '',
            h: container ? container.style.height : ''
        };
        const curW  = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        const tb    = (container && typeof getToolbarHeight === 'function') ? getToolbarHeight(container) : 0;
        widget.style.left = '0px';
        widget.style.top  = '0px';
        if (container) {
            container.style.width  = curW + 'px';
            container.style.height = (curVH + tb) + 'px';
        }
        widget.dataset.carteWallpaper = 'true';
        widget.dataset.pinned = 'false';
        widget.classList.remove('pinned');
        widget.dataset.background = 'true';
        widget.style.zIndex = 1;
        if (iframe) iframe.style.pointerEvents = 'none';
        btn.classList.add('active');
    }
    saveBoard();
}

// Envoyer/rappeler la carte derrière les autres widgets (sans changer sa taille).
// Contrairement au PDF (rendu sur <canvas>), la carte est une <iframe> : même
// avec un z-index bas, une iframe reste cliquable par-dessus les autres widgets
// (elle capte les événements souris indépendamment de l'empilement visuel).
// sendToBack() neutralise donc aussi ses interactions tant qu'elle est en fond.
function _carteApplyBackgroundState(widget) {
    const iframe = widget.querySelector('iframe.carte-frame');
    if (iframe) iframe.style.pointerEvents = widget.dataset.background === 'true' ? 'none' : '';
}
