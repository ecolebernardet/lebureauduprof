// =========================================================================
// PLEIN ÉCRAN, YOUTUBE, IFRAME
// =========================================================================
let _fsEl = null, _fsW = '', _fsH = '', _fsWidgetW = '', _fsWidgetH = '';

function toggleFullScreen(el) {
    if (!document.fullscreenElement) {
        _fsEl = el;
        _fsW  = el.style.width  || el.offsetWidth  + 'px';
        _fsH  = el.style.height || el.offsetHeight + 'px';
        const widget = el.closest('.widget');
        if (widget) {
            _fsWidgetW = widget.style.width  || '';
            _fsWidgetH = widget.style.height || '';
            // Snapshot complet pour restauration dans index.html fullscreenchange
            const wStyle = {};
            ['width','height','top','left','right','bottom','transform',
             'maxWidth','maxHeight','minWidth','minHeight','position'].forEach(function(p) {
                wStyle[p] = widget.style[p] || '';
            });
            window._fsWidgetSnapshot = { widget: widget, container: el, cW: _fsW, cH: _fsH, wStyle: wStyle };
        }
        el.requestFullscreen().catch(function(err) { console.log(err); });
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener('fullscreenchange', function() {
    // La restauration complète est gérée dans index.html via window._fsWidgetSnapshot
    // On remet juste _fsEl à null ici
    if (!document.fullscreenElement) {
        _fsEl = null;
    }
});
function loadIframe(input) {
    const iframe = input.closest('.editor-container').querySelector('iframe');
    let url = input.value.trim();
    if (url && !url.startsWith('http')) url = 'https://' + url;
    iframe.src = url; saveBoard();
}
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

function loadYoutube(input) {
    const container = input.closest('.editor-container');
    const iframe = container.querySelector('iframe.yt-player');
    let url = input.value.trim();
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;
    if (videoId && window.electronAPI && typeof window.electronAPI.openYoutube === 'function') {
        window.electronAPI.openYoutube(videoId);
    } else {
        iframe.src = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1` : url;
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
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
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

// =========================================================================
// EXPORT PDF AVEC ANNOTATIONS
// =========================================================================
async function _exportPdfWithAnnotations(container) {
    const widget = container.closest('.widget');
    if (!widget || !widget._pdfAnnotAPI) {
        alert('Aucun PDF chargé dans ce widget.');
        return;
    }
    const api = widget._pdfAnnotAPI;
    const pdfDoc = api.getPdfDoc();
    const totalPages = api.getTotalPages();
    const annotLayers = api.getAnnotLayers();
    if (!pdfDoc) { alert('PDF non disponible.'); return; }

    // Charger pdf-lib si pas encore chargé
    if (!window.PDFLib) {
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }
    const { PDFDocument } = window.PDFLib;

    // Récupérer le PDF original depuis IndexedDB
    // → les pages sans annotation conservent leurs vecteurs/polices natifs
    const pdfId = widget.dataset.pdfId;
    let originalPdfBytes = null;
    if (pdfId && typeof pdfStorage !== 'undefined') {
        try {
            const b64 = await pdfStorage.get(pdfId);
            if (b64) {
                const raw = atob(b64.includes(',') ? b64.split(',')[1] : b64);
                originalPdfBytes = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) originalPdfBytes[i] = raw.charCodeAt(i);
            }
        } catch(e) {}
    }

    const btn = container.querySelector('.pdf-export-btn');
    if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

    try {
        // PDF.js rend à 72 px/pt (scale=1).
        // SCALE=4 → ~288 dpi sur A4, qualité proche de l'original vectoriel.
        const SCALE = 4;

        let outDoc;
        let srcPages = null;

        if (originalPdfBytes) {
            // Partir du PDF original : les pages sans annotation restent vectorielles
            outDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
            srcPages = outDoc.getPages();
        } else {
            outDoc = await PDFDocument.create();
        }

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const layer = annotLayers[pageNum];
            const hasAnnotations = layer && (
                (layer.strokes && layer.strokes.length > 0) || layer._snapshot
            );

            // Page sans annotation + PDF original dispo → on la laisse intacte (qualité native)
            if (!hasAnnotations && srcPages) continue;

            const page     = await pdfDoc.getPage(pageNum);
            const vp1      = page.getViewport({ scale: 1 });   // dimensions en pt
            const viewport = page.getViewport({ scale: SCALE });
            const W = Math.round(viewport.width);
            const H = Math.round(viewport.height);

            // Rendre la page PDF à haute résolution
            const pdfCanvas = document.createElement('canvas');
            pdfCanvas.width = W; pdfCanvas.height = H;
            const pdfCtx = pdfCanvas.getContext('2d');
            pdfCtx.fillStyle = '#ffffff';
            pdfCtx.fillRect(0, 0, W, H);
            await page.render({ canvasContext: pdfCtx, viewport }).promise;

            // Dessiner les annotations par-dessus
            if (hasAnnotations) {
                const annotCanvas2 = document.createElement('canvas');
                annotCanvas2.width = W; annotCanvas2.height = H;
                const annotCtx = annotCanvas2.getContext('2d');

                if (layer._snapshot) {
                    const tmpC = document.createElement('canvas');
                    tmpC.width  = layer._snapshot.width;
                    tmpC.height = layer._snapshot.height;
                    tmpC.getContext('2d').putImageData(layer._snapshot, 0, 0);
                    annotCtx.drawImage(tmpC, 0, 0, W, H);
                }
                if (layer.strokes) {
                    for (const stroke of layer.strokes) {
                        _drawStrokeScaled(annotCtx, stroke, W, H);
                    }
                }
                pdfCtx.drawImage(annotCanvas2, 0, 0);
            }

            // PNG sans perte → pas d'artefacts de compression
            const pngBytes = await new Promise((res, rej) => {
                pdfCanvas.toBlob(blob => {
                    if (!blob) { rej(new Error('toBlob échoué page ' + pageNum)); return; }
                    blob.arrayBuffer().then(res).catch(rej);
                }, 'image/png');
            });

            const pngImage = await outDoc.embedPng(pngBytes);

            if (srcPages) {
                // Remplacer le contenu de la page existante (préserve les métadonnées)
                const libPage = srcPages[pageNum - 1];
                libPage.drawImage(pngImage, { x: 0, y: 0, width: vp1.width, height: vp1.height });
            } else {
                const newPage = outDoc.addPage([vp1.width, vp1.height]);
                newPage.drawImage(pngImage, { x: 0, y: 0, width: vp1.width, height: vp1.height });
            }
        }

        const pdfName = (widget.dataset.pdfName || 'document').replace(/\.pdf$/i, '');
        const outBytes = await outDoc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = pdfName + '_annoté.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);

    } catch(err) {
        console.error('[Export PDF]', err);
        alert('Erreur lors de l\'export : ' + err.message);
    } finally {
        if (btn) { btn.textContent = '💾'; btn.disabled = false; }
    }
}

// Dessine un stroke sur un contexte externe avec W/H comme référence
function _drawStrokeScaled(ctx, stroke, W, H) {
    if (!stroke) return;
    function fromN(nx, ny) { return { x: nx * W, y: ny * H }; }

    if (stroke.tool === 'text') {
        const pos = fromN(stroke.nx, stroke.ny);
        const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * W / 600);
        ctx.save();
        ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = stroke.color;
        ctx.textBaseline = 'top';
        const lines = (stroke.text || '').split('\n');
        if (stroke.rotation) {
            const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
            const textH = lines.length * fontSize * 1.3;
            const cx = pos.x + textW / 2, cy = pos.y + textH / 2;
            ctx.translate(cx, cy);
            ctx.rotate(stroke.rotation);
            ctx.translate(-cx, -cy);
        }
        lines.forEach((line, i) => ctx.fillText(line, pos.x, pos.y + i * fontSize * 1.3));
        ctx.restore();
        return;
    }
    if (!stroke.pts || stroke.pts.length < 1) return;
    const sizeScaled = stroke.size * W / 600;
    ctx.save();
    if (stroke.tool === 'figure') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = sizeScaled;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        stroke.pts.forEach((p, i) => {
            const cp = fromN(p.x, p.y);
            i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
        });
        // Remplissage si défini
        if (stroke.fillColor && stroke.fillOpacity > 0) {
            ctx.save();
            ctx.globalAlpha = stroke.fillOpacity;
            ctx.fillStyle = stroke.fillColor;
            ctx.fill();
            ctx.restore();
        }
        ctx.stroke();
        ctx.restore(); return;
    }
    if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = sizeScaled * 5;
    } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = sizeScaled * 2;
    } else {
        ctx.lineWidth = sizeScaled;
    }
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (stroke.dot) {
        const p0 = fromN(stroke.pts[0].x, stroke.pts[0].y);
        ctx.beginPath();
        ctx.arc(p0.x, p0.y, Math.max(sizeScaled / 2, 1), 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        ctx.restore(); return;
    }
    ctx.beginPath();
    const p0 = fromN(stroke.pts[0].x, stroke.pts[0].y);
    ctx.moveTo(p0.x, p0.y);
    if (stroke.pts.length === 2) {
        const p1 = fromN(stroke.pts[1].x, stroke.pts[1].y);
        ctx.lineTo(p1.x, p1.y);
    } else {
        for (let i = 1; i < stroke.pts.length - 1; i++) {
            const pi  = fromN(stroke.pts[i].x,     stroke.pts[i].y);
            const pi1 = fromN(stroke.pts[i+1].x, stroke.pts[i+1].y);
            const mx = pi.x + (pi1.x - pi.x) * 0.25;
            const my = pi.y + (pi1.y - pi.y) * 0.25;
            ctx.quadraticCurveTo(pi.x, pi.y, mx, my);
        }
        const last = fromN(stroke.pts[stroke.pts.length-1].x, stroke.pts[stroke.pts.length-1].y);
        ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
    ctx.restore();
}
