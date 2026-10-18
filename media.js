// =========================================================================
// PLEIN ÉCRAN (commun aux widgets média) + EXPORT PDF ANNOTÉ
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

// ── Plein écran board pour widgets YouTube & iframe ───────────────────────
function toggleMediaBoardFullscreen(container) {
    const widget = container.closest('.widget');
    if (container.classList.contains('wf-media-fullboard')) {
        container.classList.remove('wf-media-fullboard');
        if (widget) widget.style.zIndex = container._savedWidgetZ || '';
        container.style.width  = container._savedW  || '';
        container.style.height = container._savedH  || '';
        container._savedW = container._savedH = container._savedWidgetZ = null;
    } else {
        container._savedW = container.style.width  || container.offsetWidth  + 'px';
        container._savedH = container.style.height || container.offsetHeight + 'px';
        if (widget) { container._savedWidgetZ = widget.style.zIndex; widget.style.zIndex = '9999'; }
        container.classList.add('wf-media-fullboard');
    }
    if (typeof saveBoard === 'function') saveBoard();
}

// ── Réduire / déplier widgets YouTube & iframe ────────────────────────────
function toggleMediaCollapse(container) {
    const widget = container.closest('.widget');
    if (!widget) return;
    const isCollapsed = widget.dataset.mediaCollapsed === 'true';

    if (isCollapsed) {
        // ── DÉPLIER ──
        widget.style.width        = widget.dataset.mediaSavedW    || '550px';
        widget.style.height       = widget.dataset.mediaSavedH    || '400px';
        widget.style.top          = widget.dataset.mediaSavedTop  || widget.style.top;
        widget.style.left         = widget.dataset.mediaSavedLeft || widget.style.left;
        widget.style.zIndex       = '';
        widget.style.background   = '';
        widget.style.borderRadius = '';
        widget.style.border       = '';
        widget.style.overflow     = '';
        widget.style.padding      = '';

        const widgetContent = widget.querySelector('.widget-content');
        if (widgetContent) { widgetContent.style.padding = ''; widgetContent.style.background = ''; widgetContent.style.borderRadius = ''; }

        container.style.cssText = '';

        const toolbar = container.querySelector('.editor-toolbar');
        if (toolbar) toolbar.style.display = '';
        const iframe  = container.querySelector('iframe');
        if (iframe)   iframe.style.display = '';
        const ytLib   = container.querySelector('.yt-library');
        if (ytLib)    ytLib.style.display = '';

        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');

        const miniBar = widget.querySelector('.media-mini-bar');
        if (miniBar) miniBar.remove();

        const curW  = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        widget.dataset.leftPercent    = (widget.offsetLeft / curW)  * 100;
        widget.dataset.topPercent     = (widget.offsetTop  / curVH) * 100;
        widget.dataset.mediaCollapsed = 'false';

    } else {
        // ── PLIER ──
        widget.dataset.mediaSavedTop  = widget.style.top;
        widget.dataset.mediaSavedLeft = widget.style.left;
        widget.dataset.mediaSavedW    = container.offsetWidth  + 'px';
        widget.dataset.mediaSavedH    = container.offsetHeight + 'px';

        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
        const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
            w !== widget && (w.dataset.mediaCollapsed === 'true' || w.dataset.outilsCollapsed === 'true')
        );
        const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

        widget.style.top          = MARGIN_TOP + 'px';
        widget.style.left         = occupiedX  + 'px';
        widget.style.width        = COLLAPSED_W + 'px';
        widget.style.height       = COLLAPSED_H + 'px';
        widget.style.zIndex       = '9000';
        widget.style.background   = '#2a2a3e';
        widget.style.borderRadius = '8px';
        widget.style.border       = 'none';
        widget.style.overflow     = 'hidden';
        widget.style.padding      = '0';

        const widgetContent = widget.querySelector('.widget-content');
        if (widgetContent) { widgetContent.style.padding = '0'; widgetContent.style.background = 'transparent'; widgetContent.style.borderRadius = '0'; }

        container.style.width = COLLAPSED_W + 'px'; container.style.height = COLLAPSED_H + 'px';
        container.style.overflow = 'hidden'; container.style.borderRadius = '8px';
        container.style.background = '#2a2a3e'; container.style.border = 'none';
        container.style.padding = '0'; container.style.margin = '0';

        const toolbar = container.querySelector('.editor-toolbar');
        if (toolbar) toolbar.style.display = 'none';
        const iframe  = container.querySelector('iframe');
        if (iframe)   iframe.style.display = 'none';
        const ytLib   = container.querySelector('.yt-library');
        if (ytLib)    ytLib.style.display = 'none';

        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');

        const isYt  = !!container.querySelector('iframe.yt-player');
        const icon  = isYt ? '🎬' : '💻';
        const label = isYt ? 'YouTube' : 'Fenêtre Web';

        const miniBar = document.createElement('div');
        miniBar.className = 'media-mini-bar';
        miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

        const iconEl = document.createElement('span');
        iconEl.textContent = icon;
        iconEl.style.cssText = 'font-size:16px;flex-shrink:0;pointer-events:none;';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

        const expandBtn = document.createElement('button');
        expandBtn.title = 'Déplier';
        expandBtn.textContent = '▲';
        expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
        expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
        expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
        expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); toggleMediaCollapse(container); });

        miniBar.append(iconEl, labelEl, expandBtn);
        widget.appendChild(miniBar);

        miniBar.addEventListener('pointerdown', e => {
            if (e.target === expandBtn || expandBtn.contains(e.target)) return;
            e.stopPropagation(); e.preventDefault();
            miniBar.setPointerCapture(e.pointerId);
            const startX = e.clientX - widget.offsetLeft;
            const startY = e.clientY - widget.offsetTop;
            const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
            const onUp   = () => {
                miniBar.removeEventListener('pointermove', onMove);
                miniBar.removeEventListener('pointerup',   onUp);
                const curW  = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            miniBar.addEventListener('pointermove', onMove);
            miniBar.addEventListener('pointerup',   onUp);
        });

        const curW  = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        widget.dataset.leftPercent    = (widget.offsetLeft / curW)  * 100;
        widget.dataset.topPercent     = (widget.offsetTop  / curVH) * 100;
        widget.dataset.mediaCollapsed = 'true';
    }

    if (typeof saveBoard === 'function') saveBoard();
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
                        // Remplissage pot de peinture : image à charger avant de la dessiner
                        if (stroke.tool === 'fill') {
                            if (!stroke.src) continue;
                            const fimg = await new Promise(res => {
                                const im = new Image();
                                im.onload = () => res(im);
                                im.onerror = () => res(null);
                                im.src = stroke.src;
                            });
                            if (fimg) annotCtx.drawImage(fimg, stroke.nx * W, stroke.ny * H, stroke.nw * W, stroke.nh * H);
                            continue;
                        }
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
    // Crayon de couleur (rendu draw.js)
    if (stroke.tool === 'crayon' && typeof crayonDrawPoints === 'function') {
        const ptsPx = stroke.pts.map(p => fromN(p.x, p.y));
        crayonDrawPoints(ctx, null, ptsPx, stroke.color, sizeScaled, stroke.seed,
            stroke.dot || stroke.pts.length === 1, W / 600);
        return;
    }
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
