// =========================================================================
// MEDIA WIDGETS — Le Bureau du Prof
// PDF (via PDF.js), Fenêtre Web (iframe), YouTube
// =========================================================================

// Templates HTML : voir index.html (template-iframe, template-youtube, template-pdf)

// =========================================================================
// PDF WIDGET (rendu via PDF.js — pas d'iframe, pas d'ouverture navigateur)
// =========================================================================

// PDF WIDGET (rendu via PDF.js — pas d'iframe, pas d'ouverture navigateur)
// =========================================================================

// Charger PDF.js : en priorité en local (fonctionne hors-ligne),
// avec repli automatique sur le CDN si les fichiers locaux sont absents.
const PDFJS_LOCAL_LIB    = 'pdf.min.js';
const PDFJS_LOCAL_WORKER = 'pdf.worker.min.js';
const PDFJS_CDN_LIB    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_CDN_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// =========================================================================
// ROUTEUR DE COLLAGE (Ctrl+V) POUR LES WIDGETS PDF
// -------------------------------------------------------------------------
// Le board a ses propres raccourcis de collage (image → nouveau widget image,
// widget copié → duplication). Quand un widget PDF est « actif », le collage
// doit lui revenir EXCLUSIVEMENT.
// Installé dès le chargement de ce fichier, en phase de CAPTURE sur window :
// c'est le tout premier endroit où passent les événements, avant le board.
// Widget PDF actif = visible ET (dernier clic dedans OU souris au-dessus OU focus dedans).
// =========================================================================
const _pdfPasteRouter = (() => {
    const entries = new Map();          // container → callback(blob image)
    let lastDownTarget = null;          // cible du dernier clic / toucher
    let hoverTarget    = null;          // élément actuellement sous la souris

    const widgetOf = (c) => (c.closest && c.closest('.widget')) || c;

    function isVisible(c) {
        if (!c.isConnected) return false;
        const w = widgetOf(c);
        if (!w.getClientRects().length || !c.getClientRects().length) return false;   // display:none
        if (getComputedStyle(w).visibility === 'hidden') return false;
        const ec = c.closest('.editor-container');
        if (ec && ec.classList.contains('pdf-fs-hidden')) return false;
        return true;
    }
    const inside = (el, c) => !!el && el.nodeType === 1 && widgetOf(c).contains(el);

    function activeEntry() {
        const ae = document.activeElement;
        let byHover = null, byFocus = null;
        for (const [c, cb] of entries) {
            if (!isVisible(c)) continue;
            if (inside(lastDownTarget, c)) return { c, cb };            // priorité : dernier clic
            if (!byFocus && ae && ae !== document.body && inside(ae, c)) byFocus = { c, cb };
            if (!byHover && inside(hoverTarget, c)) byHover = { c, cb };
        }
        return byFocus || byHover;
    }

    const isEditable = (t) => !!t && t.nodeType === 1 &&
        (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

    function onPaste(e) {
        const a = activeEntry();
        if (!a) return;                                   // pas de PDF actif → le board gère
        e.stopImmediatePropagation();                     // le board ne voit jamais ce collage
        // Champ de saisie DU widget (n° de page, texte…) : collage natif
        if (isEditable(e.target) && inside(e.target, a.c)) return;
        e.preventDefault();
        const cd = e.clipboardData || window.clipboardData;
        let blob = null;
        const items = Array.from((cd && cd.items) || []);
        const it = items.find(x => x.kind === 'file' && x.type.startsWith('image/'));
        if (it) blob = it.getAsFile();
        if (!blob && cd && cd.files && cd.files.length) {
            blob = Array.from(cd.files).find(f => f.type.startsWith('image/')) || null;
        }
        if (blob) a.cb(blob);
    }
    // Ctrl+V / Cmd+V : cachés au board (pas de preventDefault → le 'paste' natif a toujours lieu)
    function onKey(e) {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        if ((e.key || '').toLowerCase() !== 'v' && e.code !== 'KeyV') return;
        if (!activeEntry()) return;
        e.stopImmediatePropagation();
    }
    const onDown = (e) => { lastDownTarget = e.target; };
    const onOver = (e) => { hoverTarget = e.target; };

    window.addEventListener('paste',       onPaste, true);
    window.addEventListener('keydown',     onKey,   true);
    window.addEventListener('keyup',       onKey,   true);
    window.addEventListener('keypress',    onKey,   true);
    window.addEventListener('pointerdown', onDown,  true);
    window.addEventListener('mousedown',   onDown,  true);
    window.addEventListener('touchstart',  onDown,  { capture: true, passive: true });
    window.addEventListener('pointerover', onOver,  true);
    window.addEventListener('mouseover',   onOver,  true);

    return {
        register(container, cb) { entries.set(container, cb); },   // remplace l'ancien (rechargement du PDF)
        unregister(container)   { entries.delete(container); }
    };
})();

function _ensurePdfJs(cb) {
    if (window.pdfjsLib) { cb(); return; }

    const s = document.createElement('script');
    let triedFallback = false;

    const onLoaded = (workerSrc) => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        cb();
    };

    s.onload = () => onLoaded(PDFJS_LOCAL_LIB === s.getAttribute('src') ? PDFJS_LOCAL_WORKER : PDFJS_CDN_WORKER);

    s.onerror = () => {
        if (triedFallback) {
            console.error('PDF.js : échec de chargement (local et CDN indisponibles).');
            return;
        }
        triedFallback = true;
        // Le fichier local n'existe pas ou n'a pas pu être chargé → on tente le CDN
        s.src = PDFJS_CDN_LIB;
    };

    // On tente d'abord la copie locale (même dossier que index.html)
    s.src = PDFJS_LOCAL_LIB;
    document.head.appendChild(s);
}

// ── Support stylet VPI pour les boutons : ajoute pointerup pen en plus du click ──
// À appeler sur tout bouton qui n'a que onclick (toolbar wf-btn, onglets PDF, etc.)
function _addPenClick(el, fn) {
    if (!el || el._penClickAttached) return;
    el._penClickAttached = true;
    el.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
        if (el._penClickBusy) return; // anti-double
        el._penClickBusy = true;
        setTimeout(() => el._penClickBusy = false, 300);
        e.preventDefault();
        e.stopPropagation();
        fn(e);
    });
    // Feedback visuel immédiat au pointerdown (le :active CSS ne se déclenche pas toujours avec stylet)
    el.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
        el.style.transform = 'scale(0.92)';
        el.style.filter    = 'brightness(0.82)';
    });
    el.addEventListener('pointerleave', () => {
        el.style.transform = '';
        el.style.filter    = '';
    });
    el.addEventListener('pointerup', () => {
        el.style.transform = '';
        el.style.filter    = '';
    }, { capture: false });
}

// Attache _addPenClick à tous les wf-btn d'un container PDF (toolbar)
function _attachPenSupportToPdfToolbar(container) {
    if (!container) return;
    // wf-btn (min, max, close)
    container.querySelectorAll('.wf-btn').forEach(btn => {
        _addPenClick(btn, () => btn.click());
    });
    // Bouton annotation ✏️
    const annotBtn = container.querySelector('.pdf-annot-widget-btn');
    if (annotBtn) _addPenClick(annotBtn, () => annotBtn.click());
    // Bouton export 💾
    const exportBtn = container.querySelector('.pdf-export-btn');
    if (exportBtn) _addPenClick(exportBtn, () => exportBtn.click());
    // Bouton fond d'écran 🖼️
    const wallpaperBtn = container.querySelector('.pdf-wallpaper-btn');
    if (wallpaperBtn) _addPenClick(wallpaperBtn, () => wallpaperBtn.click());
    // Bouton coller image 🖼️➕
    const pasteImgBtn = container.querySelector('.pdf-paste-img-btn');
    if (pasteImgBtn) _addPenClick(pasteImgBtn, () => pasteImgBtn.click());
    // Bouton zoom page entière
    const zoomPageBtn2 = container.querySelector('.pdf-zoom-page');
    if (zoomPageBtn2) _addPenClick(zoomPageBtn2, () => zoomPageBtn2.click());
    // Boutons nav ◀ ▶ : gérés directement dans reattach() avec _penHandled, pas besoin de _addPenClick ici
    // Bouton "Ouvrir un PDF" label
    const openLabel = container.querySelector('.pdf-placeholder label');
    if (openLabel) _addPenClick(openLabel, () => openLabel.querySelector('input')?.click());
}

function loadPdfWidget(input) {
    const file = input.files[0]; if (!file) return;
    const widget = input.closest('.widget');
    const container = input.closest('.editor-container');
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        if (!widget.dataset.pdfId) {
            widget.dataset.pdfId = 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        }
        const pdfId = widget.dataset.pdfId;
        widget.dataset.pdfName = file.name;
        _showPdfInWidget(container, base64, file.name);
        pdfStorage.set(pdfId, base64).then(() => saveBoard());
    };
    reader.readAsDataURL(file);
}

function _showPdfInWidget(container, base64OrUrl, filename) {
    const placeholder   = container.querySelector('.pdf-placeholder');
    const nameSpan      = container.querySelector('.pdf-filename');
    const navBar        = container.querySelector('.pdf-nav');
    const zoomBar       = container.querySelector('.pdf-zoom-bar');

    if (placeholder) placeholder.style.display = 'none';
    if (navBar)      navBar.style.display = 'flex';
    if (zoomBar)     zoomBar.style.display = 'flex';
    const zoomFitBtn = container.querySelector('.pdf-zoom-fit');
    if (zoomFitBtn)  zoomFitBtn.style.display = 'inline-flex';
    const zoomPageBtn = container.querySelector('.pdf-zoom-page');
    if (zoomPageBtn) zoomPageBtn.style.display = 'inline-flex';
    const exportBtn = container.querySelector('.pdf-export-btn');
    if (exportBtn)   exportBtn.style.display = 'inline-flex';
    const wallpaperBtn = container.querySelector('.pdf-wallpaper-btn');
    if (wallpaperBtn) wallpaperBtn.style.display = 'inline-flex';
    const annotBtn = container.querySelector('.pdf-annot-widget-btn');
    if (annotBtn)    annotBtn.style.display = 'inline-flex';
    const pasteImgBtn2 = container.querySelector('.pdf-paste-img-btn');
    if (pasteImgBtn2) pasteImgBtn2.style.display = 'inline-flex';
    if (nameSpan && filename) { nameSpan.textContent = filename; nameSpan.title = filename; }
    // Support stylet VPI sur tous les boutons de la toolbar PDF
    _attachPenSupportToPdfToolbar(container.closest('.editor-container') || container);

    // ── Cloner le canvasWrap pour supprimer tous les listeners accumulés ──
    // (évite la fuite de listeners à chaque rechargement/switch de PDF)
    let canvasWrap = container.querySelector('.pdf-canvas-wrap');
    if (canvasWrap) {
        const newWrap = canvasWrap.cloneNode(true);
        canvasWrap.parentNode.replaceChild(newWrap, canvasWrap);
        canvasWrap = newWrap;
    }
    const pdfCanvas   = canvasWrap ? canvasWrap.querySelector('.pdf-canvas')    : container.querySelector('.pdf-canvas');
    const annotCanvas = canvasWrap ? canvasWrap.querySelector('.pdf-annot-canvas') : container.querySelector('.pdf-annot-canvas');

    if (canvasWrap)  canvasWrap.style.display = 'block';
    // Curseur main par défaut sur le conteneur (pas sur annotCanvas qui a pointer-events:none)
    if (canvasWrap)  canvasWrap.style.cursor = 'grab';

    // ── Drag-to-scroll natif (quand le mode annotation draw.js n'est pas actif) ──
    let _dragScrolling = false, _dragStartX = 0, _dragStartY = 0, _dragScrollLeft = 0, _dragScrollTop = 0;
    canvasWrap.addEventListener('mousedown', e => {
        if (window._pdfAnnotMode) return; // draw.js gère le pan
        if (e.button !== 0) return;
        _dragScrolling = true;
        _dragStartX = e.clientX;
        _dragStartY = e.clientY;
        _dragScrollLeft = canvasWrap.scrollLeft;
        _dragScrollTop  = canvasWrap.scrollTop;
        canvasWrap.style.cursor = 'grabbing';
        e.preventDefault();
    });
    canvasWrap.addEventListener('mousemove', e => {
        if (!_dragScrolling) return;
        canvasWrap.scrollLeft = _dragScrollLeft - (e.clientX - _dragStartX);
        canvasWrap.scrollTop  = _dragScrollTop  - (e.clientY - _dragStartY);
    });
    const _endDrag = () => {
        if (!_dragScrolling) return;
        _dragScrolling = false;
        canvasWrap.style.cursor = window._pdfAnnotMode ? '' : 'grab';
    };
    canvasWrap.addEventListener('mouseup',    _endDrag);
    canvasWrap.addEventListener('mouseleave', _endDrag);
    // Supprimer les boutons overlay si l'utilisateur scrolle (position désynchronisée)
    canvasWrap.addEventListener('scroll', () => {
        ['_annot-delete-btn','_annot-resize-btn','_annot-rotate-btn','_annot-lock-btn'].forEach(id => {
            const el = document.getElementById(id); if (el) el.remove();
        });
    });

    // ── Drag-to-scroll tactile (hors mode annotation) ──
    canvasWrap.addEventListener('touchstart', e => {
        if (window._pdfAnnotMode) return; // draw.js gère le pan en mode annotation
        if (e.touches.length !== 1) return;
        _dragScrolling = true;
        _dragStartX = e.touches[0].clientX;
        _dragStartY = e.touches[0].clientY;
        _dragScrollLeft = canvasWrap.scrollLeft;
        _dragScrollTop  = canvasWrap.scrollTop;
    }, { passive: true });
    canvasWrap.addEventListener('touchmove', e => {
        if (!_dragScrolling || window._pdfAnnotMode) return;
        if (e.touches.length !== 1) return;
        canvasWrap.scrollLeft = _dragScrollLeft - (e.touches[0].clientX - _dragStartX);
        canvasWrap.scrollTop  = _dragScrollTop  - (e.touches[0].clientY - _dragStartY);
        e.preventDefault();
    }, { passive: false });
    canvasWrap.addEventListener('touchend', _endDrag);
    canvasWrap.addEventListener('touchcancel', _endDrag);

    function base64ToUint8Array(b64) {
        const raw = atob(b64.split(',')[1]);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    }

    _ensurePdfJs(() => {
        // ── Détruire l'ancien document PDF.js pour libérer mémoire/workers ──
        if (container._currentPdfDoc) {
            try { container._currentPdfDoc.destroy(); } catch(_) {}
            container._currentPdfDoc = null;
        }

        const data = base64ToUint8Array(base64OrUrl);
        pdfjsLib.getDocument({ data }).promise.then(pdfDoc => {
            // Mémoriser pour pouvoir détruire lors du prochain chargement
            container._currentPdfDoc = pdfDoc;

            // ── État ────────────────────────────────────────────────────────
            let currentPage = 1;
            const totalPages = pdfDoc.numPages;
            let zoomScale = null; // null = fit-to-width
            const ZOOM_STEP = 0.2, ZOOM_MIN = 0.3, ZOOM_MAX = 5;
            let _currentRenderScale = 1; // scale effectif du dernier renderPage (mis à jour à chaque rendu)

            // Annotations : restaurer les couches existantes si ce PDF a déjà été affiché
            // (évite de perdre les annotations lors d'un rechargement/switch)
            const annotLayers = container._savedAnnotLayers || {};
            container._savedAnnotLayers = annotLayers; // référence vivante → toujours à jour
            function getLayer(p) {
                if (!annotLayers[p]) annotLayers[p] = { strokes: [] };
                return annotLayers[p];
            }

            // ── Persistance : clé annotations (déclarée tôt pour la closure _ensurePdfJs) ──
            // Basée sur container car widget n'est pas encore défini ici
            var _annotKey = null;
            var _saveAnnotations = function() {}; // sera redéfinie plus bas
            (function() {
                var w = container.closest('.widget');
                if (w && w.dataset && w.dataset.pdfId) {
                    _annotKey = w.dataset.pdfId + '_annots';
                }
            })();

            // ── Rendu PDF ────────────────────────────────────────────────────
            let renderTask = null;
            function fitScale(page) {
                const vp0 = page.getViewport({ scale: 1 });
                return (canvasWrap.clientWidth - 24) / vp0.width;
            }

            function fitPageScale(page) {
                const vp0 = page.getViewport({ scale: 1 });
                return (canvasWrap.clientHeight - 24) / vp0.height;
            }

            function renderPage(num) {
                _invalidateSnapshot(); // le canvas va être redimensionné → snapshot obsolète
                pdfDoc.getPage(num).then(page => {
                    const scale = zoomScale ?? fitScale(page);
                    _currentRenderScale = scale;
                    const dpr = window.devicePixelRatio || 1;
                    const viewport = page.getViewport({ scale: scale * dpr });
                    // Taille physique du canvas (haute résolution)
                    pdfCanvas.width  = viewport.width;
                    pdfCanvas.height = viewport.height;
                    // Taille CSS = taille logique (sans DPR) → rendu net sur écrans HiDPI
                    pdfCanvas.style.width  = (viewport.width  / dpr) + 'px';
                    pdfCanvas.style.height = (viewport.height / dpr) + 'px';
                    // Le canvas d'annotation garde la même taille logique (les coords sont normalisées)
                    annotCanvas.width  = viewport.width;
                    annotCanvas.height = viewport.height;
                    annotCanvas.style.width  = (viewport.width  / dpr) + 'px';
                    annotCanvas.style.height = (viewport.height / dpr) + 'px';

                    // Centrage : margin auto quand le canvas est plus petit que le wrap,
                    // margin:8px (pas de centrage) quand il déborde → scroll gauche/droite natif
                    const canvasCssW = viewport.width / dpr;
                    const marginVal = canvasCssW <= canvasWrap.clientWidth ? '8px auto' : '8px';
                    pdfCanvas.style.display = 'block';
                    pdfCanvas.style.margin  = marginVal;
                    // annotCanvas : positionné en absolute par rapport au canvasStack (position:relative)
                    // sa position doit suivre le pdfCanvas (qui peut être centré ou non)
                    annotCanvas.style.display  = 'block';
                    annotCanvas.style.position = 'absolute';
                    annotCanvas.style.top  = '0';
                    annotCanvas.style.left = '0';
                    annotCanvas.style.margin = '0';
                    // Synchroniser left de l'annotCanvas avec le margin-left du pdfCanvas après layout
                    requestAnimationFrame(() => {
                        annotCanvas.style.left = pdfCanvas.offsetLeft + 'px';
                        annotCanvas.style.top  = pdfCanvas.offsetTop  + 'px';
                    });

                    // Mettre à jour label zoom
                    const zoomLabel = container.querySelector('.pdf-zoom-label');
                    if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + '%';

                    // Mettre à jour le menu déroulant
                    const pageInput2 = container.querySelector('.pdf-page-input');
                    if (pageInput2) pageInput2.value = num;
                    if (container._updatePageBtn) container._updatePageBtn(num);

                    const ctx = pdfCanvas.getContext('2d');
                    if (renderTask) renderTask.cancel();
                    renderTask = page.render({ canvasContext: ctx, viewport });
                    renderTask.promise.then(() => {
                        renderTask = null;
                        redrawAnnotations(num);
                    }).catch(() => {});
                });
            }

            // ── Annotations ───────────────────────────────────────────────
            // Les coordonnées sont stockées en espace NORMALISÉ (0-1 relatif au canvas à scale=1).
            // Au dessin, on les multiplie par la taille courante du canvas → elles suivent le zoom.
            const actx = annotCanvas.getContext('2d');
            let activeTool = 'pen';
            let isDrawing  = false;
            let currentStrokeAnnot = null;
            // Images des remplissages pot de peinture (hors des strokes → sauvegarde JSON propre)
            const _annotFillCache = new Map();

            // Convertit un point canvas-pixels → normalisé [0-1]
            function toNorm(px, py) {
                return { x: px / annotCanvas.width, y: py / annotCanvas.height };
            }
            // Convertit normalisé → pixels courants du canvas
            function fromNorm(nx, ny) {
                return { x: nx * annotCanvas.width, y: ny * annotCanvas.height };
            }

            // Snapshot ImageData du canvas annoté (strokes validés uniquement, sans le stroke en cours)
            // Utilisé pour éviter de tout redessiner à chaque point lors du tracé en temps réel.
            let _annotSnapshot = null;

            // Invalide le snapshot (à appeler dès qu'on modifie layer.strokes)
            function _invalidateSnapshot() { _annotSnapshot = null; }

            // Construit le snapshot à partir des strokes validés de la page
            function _buildSnapshot(pageNum) {
                actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                const layer = getLayer(pageNum);
                if (layer._snapshot) {
                    actx.putImageData(layer._snapshot, 0, 0);
                }
                for (const stroke of layer.strokes) {
                    drawStroke(actx, stroke);
                }
                _annotSnapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
            }

            // Redessiner toutes les annotations de la page (avec le zoom courant)
            function redrawAnnotations(pageNum) {
                _invalidateSnapshot();
                actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                // Supprimer tous les boutons overlay de figure s'ils existent
                _removeAnnotFigureHandles();
                const layer = getLayer(pageNum);
                // Restaurer le snapshot s'il existe (après effacement)
                if (layer._snapshot) {
                    actx.putImageData(layer._snapshot, 0, 0);
                }
                for (const stroke of layer.strokes) {
                    drawStroke(actx, stroke);
                }
                // Recaler la couche HTML des images collées (sélection / déplacement / redimensionnement)
                if (typeof container._pdfImgSync === 'function') container._pdfImgSync();
            }

            // ── Bouton ✕ overlay pour supprimer une annotation sélectionnée ──
            function _removeAnnotDeleteBtn() {
                const existing = document.getElementById('_annot-delete-btn');
                if (existing) existing.remove();
            }

            // Supprime tous les boutons overlay de figure
            function _removeAnnotFigureHandles() {
                ['_annot-delete-btn','_annot-resize-btn','_annot-rotate-btn','_annot-lock-btn'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                });
            }

            // Crée un bouton overlay rond positionné à (canvasPx, canvasPy)
            function _makeAnnotHandle(id, canvasPx, canvasPy, bg, title, symbol, onMouseDown, onClick) {
                const existing = document.getElementById(id);
                if (existing) existing.remove();
                const rect   = annotCanvas.getBoundingClientRect();
                const scaleX = rect.width  / annotCanvas.width;
                const scaleY = rect.height / annotCanvas.height;
                const screenX = rect.left + canvasPx * scaleX;
                const screenY = rect.top  + canvasPy * scaleY;
                const btn = document.createElement('div');
                btn.id = id;
                btn.title = title;
                btn.style.cssText = `
                    position: fixed;
                    left: ${screenX - 10}px;
                    top:  ${screenY - 10}px;
                    width: 20px; height: 20px;
                    background: ${bg};
                    border: 2px solid #fff;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: ${id === '_annot-resize-btn' ? 'nwse-resize' : id === '_annot-rotate-btn' ? 'grab' : 'pointer'};
                    z-index: 99999;
                    font-size: 11px; font-weight: 700;
                    color: #fff;
                    line-height: 1;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                    user-select: none;
                    pointer-events: auto;
                    transition: transform 0.1s;
                `;
                btn.textContent = symbol;
                btn.onmouseenter = () => btn.style.transform = 'scale(1.2)';
                btn.onmouseleave = () => btn.style.transform = 'scale(1)';
                btn.onmousedown  = (e) => { e.stopPropagation(); e.preventDefault(); if (onMouseDown) onMouseDown(e); };
                // Stylet : pointerdown arrive avant mousedown — on l'intercepte aussi
                // Stylet : pointerdown avant mousedown
                btn.onpointerdown = (e) => {
                    e.stopPropagation(); e.preventDefault();
                    if (onMouseDown) onMouseDown(e);
                };
                btn.onclick      = (e) => { e.stopPropagation(); e.preventDefault(); if (onClick) onClick(e); };
                document.body.appendChild(btn);
                return btn;
            }

            // canvasPx, canvasPy : coordonnées en pixels canvas (haut-droit du cadre)
            function _showAnnotDeleteBtn(canvasPx, canvasPy, onDelete) {
                _removeAnnotDeleteBtn();
                _makeAnnotHandle('_annot-delete-btn', canvasPx, canvasPy,
                    '#ff4757', 'Supprimer', '✕',
                    null,
                    onDelete
                );
            }

            // Affiche les 2 boutons overlay pour une figure sélectionnée (supprimer + ancrer)
            // bbox : { x, y, w, h } en pixels canvas
            function _showAnnotFigureHandles(index, bbox) {
                _removeAnnotFigureHandles();
                const { x, y, w, h } = bbox;

                // ✕ haut-droit : supprimer
                _makeAnnotHandle('_annot-delete-btn', x + w, y,
                    '#ff4757', 'Supprimer', '✕',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes.splice(index, 1);
                        redrawAnnotations(currentPage);
                    }
                );

                // 🔒 haut-gauche : ancrer (verrouiller)
                _makeAnnotHandle('_annot-lock-btn', x, y,
                    '#e67e22', 'Ancrer la figure (ne plus pouvoir la sélectionner)', '🔒',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes[index] = { ...layer2.strokes[index], locked: true };
                        redrawAnnotations(currentPage);
                    }
                );
            }

            // Affiche les boutons overlay pour une image sélectionnée
            // bbox : { x, y, w, h } en pixels canvas
            function _showAnnotImageHandles(index, bbox) {
                _removeAnnotFigureHandles();
                const { x, y, w, h } = bbox;

                // ✕ haut-droit : supprimer
                _makeAnnotHandle('_annot-delete-btn', x + w, y,
                    '#ff4757', 'Supprimer l\'image', '✕',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes.splice(index, 1);
                        _removeAnnotFigureHandles();
                        redrawAnnotations(currentPage);
                        try { _saveAnnotations(); } catch(e) {}
                    }
                );

                // ⤡ bas-droit : redimensionner
                _makeAnnotHandle('_annot-resize-btn', x + w, y + h,
                    '#27ae60', 'Redimensionner l\'image', '⤡',
                    (e) => {
                        // Drag resize
                        const layer2 = getLayer(currentPage);
                        const s = layer2.strokes[index];
                        if (!s || s.tool !== 'image') return;
                        const startPx = { x: e.clientX, y: e.clientY };
                        const origNW  = s.nw;
                        const origNH  = s.nh;
                        const origX   = fromNorm(s.nx, s.ny);

                        function onResizeMove(em) {
                            const rect = annotCanvas.getBoundingClientRect();
                            const scaleX = annotCanvas.width  / rect.width;
                            const scaleY = annotCanvas.height / rect.height;
                            const dx = (em.clientX - startPx.x) * scaleX;
                            const dy = (em.clientY - startPx.y) * scaleY;
                            // Taille minimum 20px canvas
                            const newW = Math.max(20, origX.x + (origNW * annotCanvas.width) - origX.x + dx);
                            const newH = Math.max(20, origX.y + (origNH * annotCanvas.width) - origX.y + dy);
                            layer2.strokes[index] = { ...s, nw: newW / annotCanvas.width, nh: newH / annotCanvas.width };
                            s.nw = layer2.strokes[index].nw;
                            s.nh = layer2.strokes[index].nh;
                            if (_annotSnapshot) {
                                actx.putImageData(_annotSnapshot, 0, 0);
                                drawStroke(actx, layer2.strokes[index]);
                            } else {
                                redrawAnnotations(currentPage);
                            }
                            // Mettre à jour la poignée resize
                            const np = fromNorm(layer2.strokes[index].nx, layer2.strokes[index].ny);
                            const nw2 = layer2.strokes[index].nw * annotCanvas.width;
                            const nh2 = layer2.strokes[index].nh * annotCanvas.width;
                            const resBtn = document.getElementById('_annot-resize-btn');
                            if (resBtn) {
                                const rectC = annotCanvas.getBoundingClientRect();
                                const sxC = rectC.width / annotCanvas.width;
                                const syC = rectC.height / annotCanvas.height;
                                resBtn.style.left = (rectC.left + (np.x + nw2) * sxC - 10) + 'px';
                                resBtn.style.top  = (rectC.top  + (np.y + nh2) * syC - 10) + 'px';
                            }
                        }
                        function onResizeUp() {
                            document.removeEventListener('pointermove', onResizeMove);
                            document.removeEventListener('pointerup',   onResizeUp);
                            const layer3 = getLayer(currentPage);
                            if (!layer3.history) layer3.history = [];
                            layer3.history.push([...layer3.strokes]);
                            if (layer3.history.length > 30) layer3.history.shift();
                            _invalidateSnapshot();
                            redrawAnnotations(currentPage);
                            try { _saveAnnotations(); } catch(e) {}
                        }
                        document.addEventListener('pointermove', onResizeMove);
                        document.addEventListener('pointerup',   onResizeUp);
                    },
                    null
                );
            }

            // Trouve une image sous le curseur (px, py en pixels canvas)
            function _findImageStrokeAt(px, py) {
                const layer = getLayer(currentPage);
                const HIT_PAD = 6;
                for (let i = layer.strokes.length - 1; i >= 0; i--) {
                    const s = layer.strokes[i];
                    if (s.tool !== 'image') continue;
                    const pos = fromNorm(s.nx, s.ny);
                    const pw  = s.nw * annotCanvas.width;
                    const ph  = s.nh * annotCanvas.width;
                    if (px >= pos.x - HIT_PAD && px <= pos.x + pw + HIT_PAD &&
                        py >= pos.y - HIT_PAD && py <= pos.y + ph + HIT_PAD) {
                        return { index: i, stroke: s };
                    }
                }
                return null;
            }
            // opts : { _deleteAt: {px,py}, _rotateAt: {px,py} } en pixels canvas
            function _showAnnotTextHandles(index, opts) {
                _removeAnnotFigureHandles();
                const del = opts._deleteAt;
                const rot = opts._rotateAt;

                // ✕ haut-droit : supprimer
                _makeAnnotHandle('_annot-delete-btn', del.px, del.py,
                    '#ff4757', 'Supprimer', '✕',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes.splice(index, 1);
                        redrawAnnotations(currentPage);
                    }
                );

                // ↻ bas-gauche : rotation
                _makeAnnotHandle('_annot-rotate-btn', rot.px, rot.py,
                    '#8e44ad', 'Faire pivoter', '↻',
                    (e) => {
                        if (typeof window._pdfTextRotateStart === 'function') {
                            window._pdfTextRotateStart(index, e);
                        }
                    },
                    null
                );
            }

            function drawStroke(ctx, stroke) {
                // Épaisseur proportionnelle à la taille courante du canvas
                const canvasW = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const sizeScaled = stroke.size * canvasW / displayW; // normalisé par la largeur d'affichage CSS

                // ── Remplissage pot de peinture (draw.js : fillPdfAt) ─────────────────
                // nx, ny, nw, nh normalisés sur la largeur / hauteur du canvas
                if (stroke.tool === 'fill') {
                    if (!stroke.src) return;
                    let fimg = _annotFillCache.get(stroke.src);
                    if (!fimg) {
                        fimg = new Image();
                        fimg.onload = () => redrawAnnotations(currentPage);
                        fimg.src = stroke.src;
                        _annotFillCache.set(stroke.src, fimg);
                    }
                    if (fimg instanceof HTMLImageElement && !(fimg.complete && fimg.naturalWidth)) return;
                    const pos = fromNorm(stroke.nx, stroke.ny);
                    ctx.save();
                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.imageSmoothingEnabled = true;
                    ctx.drawImage(fimg, pos.x, pos.y, stroke.nw * canvasW, stroke.nh * annotCanvas.height);
                    ctx.restore();
                    return;
                }

                // ── Image collée ──────────────────────────────────────────────────────
                if (stroke.tool === 'image') {
                    if (!stroke.src) return;
                    // Récupérer (ou créer) l'objet Image mis en cache sur le stroke
                    if (!stroke._img) {
                        const img = new Image();
                        img.src = stroke.src;
                        stroke._img = img;
                    }
                    const img = stroke._img;
                    const pos = fromNorm(stroke.nx, stroke.ny);
                    // nw/nh : dimensions normalisées (relatives à la largeur du canvas à scale=1)
                    const pw = stroke.nw * canvasW;
                    const ph = stroke.nh * canvasW;
                    const drawIt = () => {
                        ctx.save();
                        ctx.drawImage(img, pos.x, pos.y, pw, ph);
                        // Cadre de sélection si demandé
                        if (stroke._selected) {
                            ctx.strokeStyle = '#4a90e2';
                            ctx.lineWidth   = 2 * canvasW / 600;
                            ctx.setLineDash([5, 3]);
                            ctx.strokeRect(pos.x - 2, pos.y - 2, pw + 4, ph + 4);
                            ctx.setLineDash([]);
                            const r = 5 * canvasW / 600;
                            ctx.fillStyle = '#4a90e2';
                            [[pos.x-2,pos.y-2],[pos.x+pw+2,pos.y-2],[pos.x-2,pos.y+ph+2],[pos.x+pw+2,pos.y+ph+2]].forEach(([bx,by]) => {
                                ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI*2); ctx.fill();
                            });
                        }
                        ctx.restore();
                    };
                    if (img.complete && img.naturalWidth > 0) {
                        drawIt();
                    } else {
                        img.onload = () => {
                            // Redessiner la page une fois l'image chargée
                            redrawAnnotations(currentPage);
                        };
                    }
                    return;
                }

                if (stroke.tool === 'text') {
                    const pos = fromNorm(stroke.nx, stroke.ny);
                    ctx.save();
                    const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * canvasW / 600);
                    ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                    ctx.fillStyle = stroke.color;
                    ctx.textBaseline = 'top';
                    // Appliquer la rotation autour du centre du texte si elle existe
                    if (stroke.rotation) {
                        const lines = (stroke.text || '').split('\n');
                        ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                        const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
                        const textH = lines.length * fontSize * 1.3;
                        const cx = pos.x + textW / 2;
                        const cy = pos.y + textH / 2;
                        ctx.translate(cx, cy);
                        ctx.rotate(stroke.rotation);
                        ctx.translate(-cx, -cy);
                    }
                    const lines = (stroke.text || '').split('\n');
                    lines.forEach((line, i) => {
                        ctx.fillText(line, pos.x, pos.y + i * fontSize * 1.3);
                    });
                    ctx.restore();
                    return;
                }
                if (!stroke.pts || stroke.pts.length < 1) return;
                ctx.save();
                if (stroke.tool === 'figure') {
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth = stroke.size * canvasW / displayW;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    stroke.pts.forEach((p, i) => {
                        const cp = fromNorm(p.x, p.y);
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
                    ctx.restore();
                    return;
                } else if (stroke.tool === 'highlighter') {
                    // Rendu final : même logique que le mode libre (butt + skipStart/skipEnd)
                    // Math.max(..., 24 * ratio) reproduit le minimum 24px CSS du mode libre
                    const _hlRatio = canvasW / displayW;
                    const lw = Math.max(sizeScaled * 6, 24 * _hlRatio);
                    const half = lw / 2;
                    const threshold = half * 0.5;
                    const pxPts = stroke.pts.map(p => fromNorm(p.x, p.y));
                    function _hlSkipStart(ps, thr) {
                        let cum = 0;
                        for (let i = 1; i < ps.length; i++) {
                            cum += Math.hypot(ps[i].x - ps[i-1].x, ps[i].y - ps[i-1].y);
                            if (cum >= thr) return i - 1;
                        }
                        return 0;
                    }
                    function _hlSkipEnd(ps, thr) {
                        let cum = 0;
                        for (let i = ps.length - 2; i >= 0; i--) {
                            cum += Math.hypot(ps[i+1].x - ps[i].x, ps[i+1].y - ps[i].y);
                            if (cum >= thr) return i + 1;
                        }
                        return ps.length - 1;
                    }
                    const si = _hlSkipStart(pxPts, threshold);
                    const ei = _hlSkipEnd(pxPts, threshold);
                    const stablePts = [pxPts[0], ...pxPts.slice(si + 1, ei), pxPts[pxPts.length - 1]];
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineCap  = 'butt';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth   = lw;
                    ctx.globalAlpha = 0.35;
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.moveTo(stablePts[0].x, stablePts[0].y);
                    for (let i = 1; i < stablePts.length; i++) ctx.lineTo(stablePts[i].x, stablePts[i].y);
                    ctx.stroke();
                    ctx.restore();
                    return;
                } else if (stroke.tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.lineWidth = sizeScaled * 2; // size = rayon → diameter
                } else {
                    ctx.lineWidth = sizeScaled;
                }
                ctx.strokeStyle = stroke.color;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                const p0 = fromNorm(stroke.pts[0].x, stroke.pts[0].y);
                // Cas dot (tap simple sans mouvement) : dessiner un cercle plein
                if (stroke.dot || stroke.pts.length === 1) {
                    const r = sizeScaled / 2;
                    ctx.arc(p0.x, p0.y, Math.max(r, 1), 0, Math.PI * 2);
                    ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
                    ctx.fill();
                    ctx.restore();
                    return;
                }
                ctx.moveTo(p0.x, p0.y);
                if (stroke.pts.length === 2) {
                    const p1 = fromNorm(stroke.pts[1].x, stroke.pts[1].y);
                    ctx.lineTo(p1.x, p1.y);
                } else {
                    for (let i = 1; i < stroke.pts.length - 1; i++) {
                        const pi  = fromNorm(stroke.pts[i].x,     stroke.pts[i].y);
                        const pi1 = fromNorm(stroke.pts[i+1].x, stroke.pts[i+1].y);
                        const mx = pi.x + (pi1.x - pi.x) * 0.25;
                        const my = pi.y + (pi1.y - pi.y) * 0.25;
                        ctx.quadraticCurveTo(pi.x, pi.y, mx, my);
                    }
                    const last = fromNorm(stroke.pts[stroke.pts.length-1].x, stroke.pts[stroke.pts.length-1].y);
                    ctx.lineTo(last.x, last.y);
                }
                ctx.stroke();
                ctx.restore();
            }

            // Retourne la position en pixels canvas (tient compte du CSS scaling si le canvas est affiché plus petit)
            function getCanvasPx(e) {
                const rect = annotCanvas.getBoundingClientRect();
                const scaleX = annotCanvas.width  / rect.width;
                const scaleY = annotCanvas.height / rect.height;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
            }

            // ── Barre annotations – sélection outil ──────────────────────
            const toolBtns = container.querySelectorAll('.pdf-tool-btn');
            function updateToolUI() {
                toolBtns.forEach(b => {
                    b.style.background = b.dataset.tool === activeTool ? '#4a90e2' : '#fff';
                    b.style.color      = b.dataset.tool === activeTool ? 'white' : '';
                });
                annotCanvas.style.cursor =
                    activeTool === 'eraser' ? 'cell' :
                    activeTool === 'text'   ? 'text' : 'crosshair';
            }
            toolBtns.forEach(b => {
                b.addEventListener('click', () => {
                    activeTool = b.dataset.tool;
                    updateToolUI();
                });
            });
            updateToolUI();

            // ── Events dessin ─────────────────────────────────────────────
            function onPointerDown(e) {
                if (e.button !== undefined && e.button !== 0) return;
                // Ne dessiner que si le mode annotation PDF est actif
                if (!window._pdfAnnotMode) return;
                // En mode annotation PDF, draw.js gère tout via api.startStroke/continueStroke
                // → ce handler local causerait un double dessin, on le désactive
                if (typeof _pdfAnnotTool !== 'undefined') return;
                e.preventDefault();
                const color = window._drawColor
                    || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
                    || (document.querySelector('#cpick-draw-color .cpick-swatch') && document.querySelector('#cpick-draw-color .cpick-swatch').style.background)
                    || '#111111';
                // Si la gomme draw est active, forcer l'outil eraser et utiliser eraser-size
                const tool = (window.isEraserMode) ? 'eraser'
                           : (typeof _pdfAnnotTool !== 'undefined' && window._pdfAnnotMode) ? _pdfAnnotTool
                           : activeTool;
                const sizeElId = (tool === 'eraser') ? 'eraser-size' : 'draw-size';
                const sizeEl = document.getElementById(sizeElId);
                const _rawSize = sizeEl ? (parseInt(sizeEl.value) || 4) : 4;
                const size = (tool === 'text') ? Math.max(_rawSize, 8) : _rawSize; // taille min 8 pour le texte
                const px = getCanvasPx(e);
                const norm = toNorm(px.x, px.y);

                if (tool === 'text') {
                    // Éditeur inline positionné au clic
                    const canvasW    = annotCanvas.width;
                    const rect       = annotCanvas.getBoundingClientRect();
                    const fontSizePx = Math.round(6 * Math.pow(1.12, size) * rect.width / 600);
                    const clientX    = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY    = e.touches ? e.touches[0].clientY : e.clientY;

                    if (typeof _showPdfInlineTextEditor === 'function') {
                        _showPdfInlineTextEditor({
                            clientX, clientY, color, size, fontSizePx,
                            onValidate(textVal) {
                                if (!textVal.trim()) return;
                                const stroke = { tool: 'text', color, size, text: textVal, nx: norm.x, ny: norm.y };
                                getLayer(currentPage).strokes.push(stroke);
                                redrawAnnotations(currentPage);
                            }
                        });
                    } else {
                        const textVal = prompt('Texte à ajouter :');
                        if (!textVal) return;
                        const stroke = { tool: 'text', color, size, text: textVal, nx: norm.x, ny: norm.y };
                        getLayer(currentPage).strokes.push(stroke);
                        redrawAnnotations(currentPage);
                    }
                    return;
                }

                isDrawing = true;
                // Construire le snapshot des strokes validés avant de commencer à dessiner
                // → onPointerMove pourra restaurer ce snapshot au lieu de tout redessiner
                _buildSnapshot(currentPage);
                // Stocker pts en normalisé dès le départ
                currentStrokeAnnot = { tool: tool, color, size, pts: [norm] };
            }

            function onPointerMove(e) {
                if (!isDrawing || !currentStrokeAnnot) return;
                if (!window._pdfAnnotMode) return;
                // En mode annotation PDF, draw.js gère tout via api.continueStroke
                if (typeof _pdfAnnotTool !== 'undefined') return;
                e.preventDefault();
                const px   = getCanvasPx(e);
                const norm = toNorm(px.x, px.y);
                currentStrokeAnnot.pts.push(norm);
                // Mettre à jour couleur/taille depuis draw-toolbar en temps réel
                const color = window._drawColor
                    || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
                    || currentStrokeAnnot.color;
                const sizeEl = document.getElementById('draw-size');
                const size = sizeEl ? (parseInt(sizeEl.value) || currentStrokeAnnot.size) : currentStrokeAnnot.size;
                currentStrokeAnnot.color = color;
                currentStrokeAnnot.size  = size;
                if (window.isEraserMode) {
                    currentStrokeAnnot.tool = 'eraser';
                } else if (typeof _pdfAnnotTool !== 'undefined' && window._pdfAnnotMode) {
                    currentStrokeAnnot.tool = _pdfAnnotTool;
                }

                // Dessin temps réel : convertir les 2 derniers points en pixels courants
                const pts = currentStrokeAnnot.pts;
                const canvasW = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const sizeScaled = currentStrokeAnnot.size * canvasW / displayW;

                if (currentStrokeAnnot.tool === 'highlighter') {
                    // Même logique que le mode libre : restaurer le snapshot puis
                    // redessiner le chemin complet — évite l'accumulation de couches
                    // semi-transparentes et corrige le débordement gauche/droite.
                    if (_annotSnapshot) actx.putImageData(_annotSnapshot, 0, 0);
                    else actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);

                    if (pts.length >= 2) {
                        const pxPts = pts.map(p => fromNorm(p.x, p.y));
                        const lw = Math.max(sizeScaled * 6, 24 * (canvasW / displayW));
                        const half = lw / 2;
                        const threshold = half * 0.5;

                        // Sauter les micro-mouvements parasites en début/fin
                        function _skipStart(ps, thr) {
                            let cum = 0;
                            for (let i = 1; i < ps.length; i++) {
                                cum += Math.hypot(ps[i].x - ps[i-1].x, ps[i].y - ps[i-1].y);
                                if (cum >= thr) return i - 1;
                            }
                            return 0;
                        }
                        function _skipEnd(ps, thr) {
                            let cum = 0;
                            for (let i = ps.length - 2; i >= 0; i--) {
                                cum += Math.hypot(ps[i+1].x - ps[i].x, ps[i+1].y - ps[i].y);
                                if (cum >= thr) return i + 1;
                            }
                            return ps.length - 1;
                        }

                        const si = _skipStart(pxPts, threshold);
                        const ei = _skipEnd(pxPts, threshold);
                        const stablePts = [pxPts[0], ...pxPts.slice(si + 1, ei), pxPts[pxPts.length - 1]];

                        actx.save();
                        actx.beginPath();
                        actx.lineCap  = 'butt';
                        actx.lineJoin = 'round';
                        actx.strokeStyle = currentStrokeAnnot.color;
                        actx.lineWidth   = lw;
                        actx.globalAlpha = 0.35;
                        actx.globalCompositeOperation = 'multiply';
                        actx.moveTo(stablePts[0].x, stablePts[0].y);
                        for (let i = 1; i < stablePts.length; i++) {
                            actx.lineTo(stablePts[i].x, stablePts[i].y);
                        }
                        actx.stroke();
                        actx.restore();
                    }
                } else {
                    const prev = fromNorm(pts[pts.length - 2].x, pts[pts.length - 2].y);
                    const cur  = fromNorm(pts[pts.length - 1].x, pts[pts.length - 1].y);

                    actx.save();
                    if (currentStrokeAnnot.tool === 'eraser') {
                        actx.globalCompositeOperation = 'destination-out';
                        actx.lineWidth = sizeScaled * 2;
                    } else {
                        actx.lineWidth = sizeScaled;
                    }
                    actx.strokeStyle = currentStrokeAnnot.color;
                    actx.lineCap = 'round';
                    actx.lineJoin = 'round';
                    actx.beginPath();
                    actx.moveTo(prev.x, prev.y);
                    actx.lineTo(cur.x, cur.y);
                    actx.stroke();
                    actx.restore();
                }
            }

            function onPointerUp(e) {
                if (!isDrawing) return;
                // En mode annotation PDF, draw.js gère la fin du trait via api.endStroke
                if (window._pdfAnnotMode && typeof _pdfAnnotTool !== 'undefined') return;
                isDrawing = false;
                if (currentStrokeAnnot && currentStrokeAnnot.pts.length > 0) {
                    getLayer(currentPage).strokes.push(currentStrokeAnnot);
                    redrawAnnotations(currentPage); // redessiner proprement
                }
                currentStrokeAnnot = null;
            }

            // annotCanvas transparent aux événements par défaut — draw.js le réactive en mode annotation
            annotCanvas.style.pointerEvents = 'none';
            // annotCanvas transparent aux événements par défaut — draw.js le réactive en mode annotation
            annotCanvas.style.pointerEvents = 'none';
            // annotCanvas transparent aux événements par défaut — draw.js le réactive en mode annotation
            annotCanvas.style.pointerEvents = 'none';
            annotCanvas.addEventListener('mousedown',  onPointerDown);
            annotCanvas.addEventListener('mousemove',  onPointerMove);
            annotCanvas.addEventListener('mouseup',    onPointerUp);
            annotCanvas.addEventListener('mouseleave', onPointerUp);
            annotCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
            annotCanvas.addEventListener('touchmove',  onPointerMove, { passive: false });
            annotCanvas.addEventListener('touchend',   onPointerUp);

            // ── Undo / Clear ──────────────────────────────────────────────
            const undoBtn  = container.querySelector('.pdf-annot-undo');
            const clearBtn = container.querySelector('.pdf-annot-clear');
            if (undoBtn) {
                const newUndo = undoBtn.cloneNode(true);
                undoBtn.parentNode.replaceChild(newUndo, undoBtn);
                newUndo.addEventListener('click', () => {
                    const layer = getLayer(currentPage);
                    if (layer.strokes.length > 0) {
                        layer.strokes.pop();
                        redrawAnnotations(currentPage);
                    }
                });
            }
            if (clearBtn) {
                const newClear = clearBtn.cloneNode(true);
                clearBtn.parentNode.replaceChild(newClear, clearBtn);
                newClear.addEventListener('click', () => {
                    if (!confirm('Effacer toutes les annotations de cette page ?')) return;
                    getLayer(currentPage).strokes = [];
                    redrawAnnotations(currentPage);
                });
            }

            // Ctrl+Z dans le widget
            container.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    const layer = getLayer(currentPage);
                    if (layer.strokes.length > 0) { layer.strokes.pop(); redrawAnnotations(currentPage); }
                }
            });

            // ── Zoom ──────────────────────────────────────────────────────
            const btnZoomIn  = container.querySelector('.pdf-zoom-in');
            const btnZoomOut = container.querySelector('.pdf-zoom-out');
            const btnZoomFit = container.querySelector('.pdf-zoom-fit');

            function applyZoom(newScale) {
                zoomScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale));
                renderPage(currentPage);
            }

            // Cloner pour éviter doublons
            function reattach(sel, fn) {
                const el = container.querySelector(sel);
                if (!el) return;
                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);
                // Garde anti-double : un seul déclenchement par geste (stylet ou touch)
                clone._lastFired = 0;
                function _fireFn(e) {
                    const now = Date.now();
                    if (now - clone._lastFired < 400) return;
                    clone._lastFired = now;
                    fn(e);
                }
                clone.addEventListener('click', (e) => {
                    // Ignorer le click synthétique généré après pointerup stylet/touch
                    if (e.pointerType === 'pen' || e.pointerType === 'touch') return;
                    if (Date.now() - clone._lastFired < 400) return;
                    clone._lastFired = Date.now();
                    fn(e);
                });
                clone.addEventListener('pointerup', (e) => {
                    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                        e.preventDefault();
                        _fireFn(e);
                    }
                });
            }

            // Zoom continu : démarre au pointerdown, accélère après quelques steps, s'arrête au pointerup
            function _attachContinuousZoom(sel, direction) {
                const el = container.querySelector(sel);
                if (!el) return;
                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);

                let _holdTimeout = null;
                let _active = false;
                let _stepCount = 0;

                function _doZoom() {
                    if (!_active) return;
                    pdfDoc.getPage(currentPage).then(p => {
                        if (!_active) return;
                        const base = zoomScale ?? fitScale(p);
                        applyZoom(base + direction * ZOOM_STEP);
                        _stepCount++;
                        // Accélérer progressivement
                        const delay = _stepCount > 10 ? 40 : _stepCount > 5 ? 70 : 120;
                        _holdTimeout = setTimeout(_doZoom, delay);
                    });
                }

                function _start(e) {
                    e.preventDefault();
                    if (_active) return;
                    _active = true;
                    _stepCount = 0;
                    _doZoom();
                }

                function _stop() {
                    _active = false;
                    if (_holdTimeout) { clearTimeout(_holdTimeout); _holdTimeout = null; }
                }

                clone.addEventListener('pointerdown', _start);
                clone.addEventListener('pointerup',    _stop);
                clone.addEventListener('pointerleave', _stop);
                clone.addEventListener('pointercancel', _stop);
                clone.addEventListener('click', e => e.stopImmediatePropagation());
            }

            _attachContinuousZoom('.pdf-zoom-in',  +1);
            _attachContinuousZoom('.pdf-zoom-out', -1);
            reattach('.pdf-zoom-fit', () => {
                zoomScale = null;
                renderPage(currentPage);
            });
            reattach('.pdf-zoom-page', () => {
                pdfDoc.getPage(currentPage).then(p => {
                    zoomScale = fitPageScale(p);
                    renderPage(currentPage);
                });
            });

            // Zoom molette (Ctrl+molette ou Shift+molette)
            canvasWrap.addEventListener('wheel', e => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return;
                e.preventDefault();
                pdfDoc.getPage(currentPage).then(p => {
                    const base = zoomScale ?? fitScale(p);
                    applyZoom(base + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
                });
            }, { passive: false });

            // ── Navigation pages : input numérique + select déroulant + flèches ──
            const pageInput = container.querySelector('.pdf-page-input');
            if (pageInput) {
                pageInput.max = totalPages;
                pageInput.value = currentPage;
                pageInput.addEventListener('change', () => {
                    let p = parseInt(pageInput.value);
                    if (isNaN(p)) p = 1;
                    p = Math.max(1, Math.min(totalPages, p));
                    pageInput.value = p;
                    if (container._updatePageBtn) container._updatePageBtn(p);
                    currentPage = p;
                    renderPage(currentPage);
                });
                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { pageInput.blur(); }
                });
                pageInput.addEventListener('focus', () => {
                    pageInput.select();
                });
            }
            const pageSelect2 = container.querySelector('.pdf-page-select');
            if (pageSelect2) {
                // ── Menu custom positionné sur body (évite overflow:hidden du parent) ──
                const customBtn = document.createElement('button');
                customBtn.style.cssText = 'font-size:12px;border:none;background:transparent;cursor:pointer;padding:1px 6px;outline:none;min-width:44px;text-align:center;touch-action:manipulation;user-select:none;';
                customBtn.textContent = currentPage + ' / ' + totalPages;
                pageSelect2.replaceWith(customBtn);

                const customMenu = document.createElement('div');
                customMenu.style.cssText = 'display:none;position:fixed;z-index:999999;background:#fff;border:1px solid #ccc;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.25);max-height:240px;overflow-y:auto;min-width:90px;';
                document.body.appendChild(customMenu);

                const buildMenu = () => {
                    customMenu.innerHTML = '';
                    for (let i = 1; i <= totalPages; i++) {
                        const item = document.createElement('div');
                        item.textContent = i + ' / ' + totalPages;
                        item.style.cssText = 'padding:7px 16px;cursor:pointer;font-size:13px;white-space:nowrap;touch-action:manipulation;user-select:none;' + (i === currentPage ? 'background:#e8f0fe;font-weight:bold;' : '');
                        const selectPage = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            currentPage = i;
                            customBtn.textContent = i + ' / ' + totalPages;
                            if (pageInput) pageInput.value = i;
                            customMenu.style.display = 'none';
                            renderPage(currentPage);
                        };
                        item.addEventListener('pointerdown', selectPage);
                        customMenu.appendChild(item);
                    }
                };

                const openMenu = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    buildMenu();
                    const rect = customBtn.getBoundingClientRect();
                    customMenu.style.display = 'block';
                    // Positionner sous le bouton
                    const menuH = Math.min(totalPages * 33, 240);
                    const spaceBelow = window.innerHeight - rect.bottom;
                    if (spaceBelow < menuH && rect.top > menuH) {
                        customMenu.style.top = (rect.top - menuH) + 'px';
                    } else {
                        customMenu.style.top = rect.bottom + 'px';
                    }
                    customMenu.style.left = rect.left + 'px';
                    // Scroller jusqu'à la page courante
                    const cur = customMenu.children[currentPage - 1];
                    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'nearest' }), 0);
                };

                customBtn.addEventListener('pointerdown', openMenu);

                // Fermer si on appuie ailleurs
                document.addEventListener('pointerdown', (e) => {
                    if (e.target !== customBtn && !customMenu.contains(e.target)) {
                        customMenu.style.display = 'none';
                    }
                });

                container._updatePageBtn = (page) => {
                    customBtn.textContent = page + ' / ' + totalPages;
                };
            }

            reattach('.pdf-prev', () => {
                if (currentPage > 1) { currentPage--; renderPage(currentPage); }
            });
            reattach('.pdf-next', () => {
                if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
            });

            // ── Bouton "Fond d'écran" : rendu complet de la page courante en haute résolution ──
            reattach('.pdf-wallpaper-btn', () => {
                pdfDoc.getPage(currentPage).then(page => {
                    // Calcul de l'échelle : on cible la hauteur réelle de l'écran en pixels physiques
                    // pour que la page A4 remplisse exactement le fond sans flou
                    const dpr = window.devicePixelRatio || 1;
                    const vp0 = page.getViewport({ scale: 1 });
                    // Échelle pour que la hauteur de la page == hauteur écran physique
                    const scaleH = (screen.height * dpr) / vp0.height;
                    // Échelle pour que la largeur de la page == largeur écran physique
                    const scaleW = (screen.width  * dpr) / vp0.width;
                    // On prend le max pour couvrir l'écran dans les deux dimensions (contain = min)
                    const renderScale = Math.max(scaleH, scaleW);

                    const viewport = page.getViewport({ scale: renderScale });

                    // Canvas offscreen — page complète, indépendant du zoom/scroll du widget
                    const offCanvas = document.createElement('canvas');
                    offCanvas.width  = Math.round(viewport.width);
                    offCanvas.height = Math.round(viewport.height);
                    const offCtx = offCanvas.getContext('2d');

                    const renderTask2 = page.render({ canvasContext: offCtx, viewport });
                    renderTask2.promise.then(() => {
                        // Fusionner les annotations si présentes (rééchantillonnées à la bonne taille)
                        const layer = getLayer(currentPage);
                        if (layer && layer.strokes && layer.strokes.length > 0) {
                            const _origW = annotCanvas.width;
                            Object.defineProperty(annotCanvas, 'width', { value: offCanvas.width, configurable: true });
                            for (const stroke of layer.strokes) {
                                drawStroke(offCtx, stroke);
                            }
                            Object.defineProperty(annotCanvas, 'width', { value: _origW, configurable: true });
                        }

                        // Export en JPEG (meilleure compression, qualité suffisante pour un fond)
                        const dataUrl = offCanvas.toDataURL('image/jpeg', 0.92);
                        const bgValue = `url(${dataUrl})`;

                        // Stocker le ratio natif h/w pour que background.js puisse
                        // calculer la hauteur à n'importe quelle échelle
                        window._pdfBgNativeRatio = offCanvas.height / offCanvas.width;
                        localStorage.setItem('boardPdfBgRatio', window._pdfBgNativeRatio);

                        // Appliquer via applyBackground puis forcer 100% largeur (format feuille A4)
                        const board = document.getElementById('board');
                        if (typeof applyBackground === 'function') applyBackground(bgValue);
                        if (board) {
                            board.style.backgroundSize     = '100% auto';
                            board.style.backgroundPosition = 'top center';
                            board.style.backgroundRepeat   = 'no-repeat';
                            board.style.backgroundColor    = '#fff';
                        }
                        // La hauteur du board est gérée par _applyBoardHeightForPdf()
                        if (typeof saveBg === 'function') saveBg(bgValue);

                        // Activer le slider de largeur PDF
                        if (typeof activatePdfWallpaperSlider === 'function') {
                            activatePdfWallpaperSlider(100);
                        }

                        // Feedback visuel
                        const btn = container.querySelector('.pdf-wallpaper-btn');
                        if (btn) {
                            const orig = btn.textContent;
                            btn.textContent = '✓';
                            btn.style.color = '#4caf50';
                            setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1200);
                        }
                    }).catch(err => {
                        console.error('Wallpaper render error:', err);
                    });
                });
            });

            renderPage(currentPage);

            // ── Collage d'image sur le PDF ────────────────────────────────────────
            // Insère une image (base64) au centre du canvas visible
            function _insertImageOnPdf(dataUrl) {
                const img = new Image();
                img.onload = () => {
                    // Taille par défaut : 1/3 de la largeur du canvas, ratio conservé
                    const defaultW = annotCanvas.width / 3;
                    const ratio    = img.naturalHeight / img.naturalWidth;
                    const defaultH = defaultW * ratio;
                    // Centrer dans la zone visible du canvasWrap
                    const wrapRect   = canvasWrap.getBoundingClientRect();
                    const canvasRect = annotCanvas.getBoundingClientRect();
                    const scaleX = annotCanvas.width  / canvasRect.width;
                    const scaleY = annotCanvas.height / canvasRect.height;
                    const visLeft   = Math.max(0, (wrapRect.left  - canvasRect.left)  * scaleX);
                    const visTop    = Math.max(0, (wrapRect.top   - canvasRect.top)   * scaleY);
                    const visRight  = Math.min(annotCanvas.width,  (wrapRect.right  - canvasRect.left) * scaleX);
                    const visBottom = Math.min(annotCanvas.height, (wrapRect.bottom - canvasRect.top)  * scaleY);
                    const cx = (visLeft + visRight)  / 2;
                    const cy = (visTop  + visBottom) / 2;
                    const px = cx - defaultW / 2;
                    const py = cy - defaultH / 2;
                    const norm = toNorm(px, py);
                    const stroke = {
                        tool: 'image',
                        src:  dataUrl,
                        nx:   norm.x,
                        ny:   norm.y,
                        nw:   defaultW / annotCanvas.width,
                        nh:   defaultH / annotCanvas.width,
                        size: 1, color: 'transparent'
                    };
                    const layer = getLayer(currentPage);
                    if (!layer.history) layer.history = [];
                    layer.redoHistory = [];
                    layer.history.push([...layer.strokes]);
                    if (layer.history.length > 30) layer.history.shift();
                    layer.strokes.push(stroke);
                    _invalidateSnapshot();
                    redrawAnnotations(currentPage);
                    try { _saveAnnotations(); } catch(e) {}
                    // Image tout juste collée : sélectionnée (cadre + poignées) → déplaçable immédiatement
                    if (typeof container._pdfImgSelect === 'function') container._pdfImgSelect(stroke);
                };
                img.src = dataUrl;
            }

            // Bouton "Coller image" dans la toolbar
            const pasteImgBtnEl = container.querySelector('.pdf-paste-img-btn');
            if (pasteImgBtnEl && !pasteImgBtnEl._imgSetup) {
                pasteImgBtnEl._imgSetup = true;
                const fileInput = document.createElement('input');
                fileInput.type   = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                container.appendChild(fileInput);
                fileInput.addEventListener('change', () => {
                    const file = fileInput.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => _insertImageOnPdf(ev.target.result);
                    reader.readAsDataURL(file);
                    fileInput.value = '';
                });
                pasteImgBtnEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fileInput.click();
                });
            }

            // ── Ctrl+V (presse-papiers) quand le widget PDF est actif ─────────────
            // Géré par le routeur global _pdfPasteRouter (en tête de fichier) : il intercepte
            // le collage AVANT le board et le donne exclusivement au widget PDF actif.
            _pdfPasteRouter.register(container, (blob) => {
                const reader = new FileReader();
                reader.onload = (ev) => _insertImageOnPdf(ev.target.result);
                reader.readAsDataURL(blob);
            });

            // ── Sélection / déplacement / resize d'image (clic sur annotCanvas) ───
            let _imgDragIndex   = -1;
            let _imgDragStartPx = null;
            let _imgDragOrigNorm = null;

            annotCanvas.addEventListener('pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                // Ne gérer que si le mode annotation est actif
                if (!window._pdfAnnotMode) return;
                const px  = getCanvasPx(e);
                const hit = _findImageStrokeAt(px.x, px.y);
                const layer = getLayer(currentPage);
                if (!hit) {
                    if (_imgDragIndex >= 0) {
                        if (layer.strokes[_imgDragIndex]) layer.strokes[_imgDragIndex]._selected = false;
                        _imgDragIndex   = -1;
                        _removeAnnotFigureHandles();
                        redrawAnnotations(currentPage);
                    }
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                layer.strokes.forEach(s => { if (s.tool === 'image') s._selected = false; });
                hit.stroke._selected = true;
                _imgDragIndex     = hit.index;
                _imgDragStartPx   = px;
                _imgDragOrigNorm  = { nx: hit.stroke.nx, ny: hit.stroke.ny };
                // Snapshot sans l'image draggée
                actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                if (layer._snapshot) actx.putImageData(layer._snapshot, 0, 0);
                layer.strokes.forEach((s, i) => { if (i !== _imgDragIndex) drawStroke(actx, s); });
                _annotSnapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                drawStroke(actx, hit.stroke);
                const pos = fromNorm(hit.stroke.nx, hit.stroke.ny);
                const pw  = hit.stroke.nw * annotCanvas.width;
                const ph  = hit.stroke.nh * annotCanvas.width;
                _showAnnotImageHandles(_imgDragIndex, { x: pos.x, y: pos.y, w: pw, h: ph });
            }, { capture: true });

            annotCanvas.addEventListener('pointermove', (e) => {
                if (_imgDragIndex < 0 || !_imgDragStartPx) return;
                const px  = getCanvasPx(e);
                const dx  = (px.x - _imgDragStartPx.x) / annotCanvas.width;
                const dy  = (px.y - _imgDragStartPx.y) / annotCanvas.height;
                const layer = getLayer(currentPage);
                const s   = layer.strokes[_imgDragIndex];
                if (!s) return;
                s.nx = _imgDragOrigNorm.nx + dx;
                s.ny = _imgDragOrigNorm.ny + dy;
                if (_annotSnapshot) { actx.putImageData(_annotSnapshot, 0, 0); drawStroke(actx, s); }
                // Déplacer les boutons overlay
                const pos = fromNorm(s.nx, s.ny);
                const pw  = s.nw * annotCanvas.width;
                const ph  = s.nh * annotCanvas.width;
                const rect = annotCanvas.getBoundingClientRect();
                const sx = rect.width  / annotCanvas.width;
                const sy = rect.height / annotCanvas.height;
                const moveBtn = (id, cpx, cpy) => {
                    const btn = document.getElementById(id);
                    if (btn) { btn.style.left = (rect.left + cpx * sx - 10) + 'px'; btn.style.top = (rect.top + cpy * sy - 10) + 'px'; }
                };
                moveBtn('_annot-delete-btn', pos.x + pw, pos.y);
                moveBtn('_annot-resize-btn', pos.x + pw, pos.y + ph);
            }, { capture: true });

            annotCanvas.addEventListener('pointerup', (e) => {
                if (_imgDragIndex < 0) return;
                const layer = getLayer(currentPage);
                if (!layer.history) layer.history = [];
                layer.history.push([...layer.strokes]);
                if (layer.history.length > 30) layer.history.shift();
                _invalidateSnapshot();
                _imgDragIndex   = -1;
                _imgDragStartPx = null;
                redrawAnnotations(currentPage);
                try { _saveAnnotations(); } catch(_) {}
            }, { capture: true });

            // ── Images collées : couche HTML interactive (hors mode annotation) ──
            // annotCanvas a pointer-events:none tant que le mode annotation n'est pas actif :
            // les images collées (dessinées sur le canvas) n'étaient donc ni cliquables ni déplaçables.
            // On superpose au canvas une couche transparente contenant une « zone de prise » par image :
            // • glisser l'image = la déplacer ;
            // • clic = cadre bleu + poignée ronde (bas-droite, redimensionne, ratio conservé) + ✕ (supprimer) ;
            // • Suppr / Retour arrière supprime l'image sélectionnée ; clic ailleurs = désélection.
            // En mode annotation (crayon…), la couche laisse passer les événements pour pouvoir dessiner sur l'image.
            if (!document.getElementById('pdf-img-layer-style')) {
                const st = document.createElement('style');
                st.id = 'pdf-img-layer-style';
                st.textContent = `
                    .pdf-img-layer { position:absolute; pointer-events:none; z-index:5; }
                    .pdf-img-layer .pdf-img-hit {
                        position:absolute; pointer-events:auto; cursor:move;
                        touch-action:none; user-select:none; -webkit-user-select:none;
                    }
                    .pdf-img-layer.pdf-img-layer--off .pdf-img-hit,
                    .pdf-img-layer.pdf-img-layer--off .pdf-img-frame { display:none !important; }
                    .pdf-img-layer .pdf-img-frame {
                        position:absolute; display:none; pointer-events:none;
                        border:2px solid #4a90d9; border-radius:2px; box-sizing:border-box;
                    }
                    .pdf-img-layer .pdf-img-handle {
                        position:absolute; right:-9px; bottom:-9px; width:18px; height:18px;
                        background:#4a90d9; border:2px solid #fff; border-radius:50%;
                        box-sizing:border-box; box-shadow:0 1px 3px rgba(0,0,0,.35);
                        cursor:nwse-resize; pointer-events:auto; touch-action:none;
                    }
                    .pdf-img-layer .pdf-img-del {
                        position:absolute; right:-10px; top:-10px; width:20px; height:20px;
                        background:#ff4757; color:#fff; border:2px solid #fff; border-radius:50%;
                        box-sizing:border-box; box-shadow:0 1px 3px rgba(0,0,0,.35);
                        display:flex; align-items:center; justify-content:center;
                        font:700 11px/1 sans-serif; cursor:pointer; pointer-events:auto;
                        user-select:none; -webkit-user-select:none;
                    }
                `;
                document.head.appendChild(st);
            }

            // canvasWrap est cloné à chaque chargement : retirer une éventuelle ancienne couche (sans listeners)
            (annotCanvas.parentNode || canvasWrap).querySelectorAll(':scope > .pdf-img-layer').forEach(el => el.remove());
            const imgLayer = document.createElement('div');
            imgLayer.className = 'pdf-img-layer';
            const imgHits  = document.createElement('div');   // conteneur des zones de prise
            const imgFrame = document.createElement('div');
            imgFrame.className = 'pdf-img-frame';
            const imgHandle = document.createElement('div');
            imgHandle.className = 'pdf-img-handle';
            imgHandle.title = 'Redimensionner';
            const imgDel = document.createElement('div');
            imgDel.className = 'pdf-img-del';
            imgDel.title = "Supprimer l'image";
            imgDel.textContent = '✕';
            imgFrame.append(imgHandle, imgDel);
            imgLayer.append(imgHits, imgFrame);
            annotCanvas.insertAdjacentElement('afterend', imgLayer);

            let _pdfSelImg = null;   // stroke image sélectionné (référence objet)
            let _pdfImgBusy = false; // déplacement / redimensionnement en cours

            // Échelles : pixels canvas → px CSS (k) ; px CSS → px écran (widget éventuellement zoomé)
            const _cssK    = () => (annotCanvas.offsetWidth / (annotCanvas.width || 1)) || 1;
            const _screenK = () => (annotCanvas.getBoundingClientRect().width / (annotCanvas.offsetWidth || 1)) || 1;

            // Rectangle CSS (dans la couche) d'un stroke image
            function _imgCssRect(s) {
                const k = _cssK();
                const W = annotCanvas.width, H = annotCanvas.height;
                return { x: s.nx * W * k, y: s.ny * H * k, w: s.nw * W * k, h: s.nh * W * k };
            }
            function _placeEl(el, r) {
                el.style.left   = r.x + 'px';
                el.style.top    = r.y + 'px';
                el.style.width  = r.w + 'px';
                el.style.height = r.h + 'px';
            }
            function _imgModeOff() { return !!window._pdfAnnotMode; }

            function _pdfImgUpdateFrame() {
                const layer = getLayer(currentPage);
                if (!_pdfSelImg || layer.strokes.indexOf(_pdfSelImg) < 0) {
                    _pdfSelImg = null;
                    imgFrame.style.display = 'none';
                    return;
                }
                _placeEl(imgFrame, _imgCssRect(_pdfSelImg));
                imgFrame.style.display = 'block';
            }

            // Reconstruit les zones de prise (appelé à chaque redrawAnnotations)
            function _pdfImgSync() {
                if (!imgLayer.isConnected) return;
                imgLayer.style.left   = annotCanvas.offsetLeft + 'px';
                imgLayer.style.top    = annotCanvas.offsetTop  + 'px';
                imgLayer.style.width  = annotCanvas.offsetWidth  + 'px';
                imgLayer.style.height = annotCanvas.offsetHeight + 'px';
                imgLayer.classList.toggle('pdf-img-layer--off', _imgModeOff());
                if (_pdfImgBusy) return;
                imgHits.textContent = '';
                const layer = getLayer(currentPage);
                layer.strokes.forEach(s => {
                    if (s.tool !== 'image') return;
                    const hit = document.createElement('div');
                    hit.className = 'pdf-img-hit';
                    hit._stroke = s;
                    _placeEl(hit, _imgCssRect(s));
                    imgHits.appendChild(hit);
                });
                _pdfImgUpdateFrame();
            }
            container._pdfImgSync = _pdfImgSync;
            // Le 1er rendu repositionne annotCanvas dans un requestAnimationFrame → recaler ensuite
            requestAnimationFrame(() => requestAnimationFrame(_pdfImgSync));

            function _pdfImgSelect(s) {
                _pdfSelImg = s;
                _pdfImgSync();
            }
            container._pdfImgSelect = _pdfImgSelect;
            function _pdfImgDeselect() {
                if (!_pdfSelImg) return;
                _pdfSelImg = null;
                imgFrame.style.display = 'none';
            }

            function _pdfImgDelete() {
                const layer = getLayer(currentPage);
                const i = layer.strokes.indexOf(_pdfSelImg);
                if (i < 0) return;
                if (!layer.history) layer.history = [];
                layer.history.push([...layer.strokes]);
                if (layer.history.length > 30) layer.history.shift();
                layer.strokes.splice(i, 1);
                _pdfSelImg = null;
                redrawAnnotations(currentPage);
                try { _saveAnnotations(); } catch(_) {}
            }

            // Prépare un geste (déplacement / resize) : copie du stroke (préserve l'historique)
            // + snapshot du canvas sans l'image → rendu fluide pendant le geste
            function _pdfImgBeginGesture(s) {
                const layer = getLayer(currentPage);
                const i = layer.strokes.indexOf(s);
                if (i < 0) return null;
                if (!layer.history) layer.history = [];
                layer.history.push([...layer.strokes]);
                if (layer.history.length > 30) layer.history.shift();
                const copy = { ...s };
                delete copy._selected;
                layer.strokes[i] = copy;
                Array.from(imgHits.children).forEach(h => { if (h._stroke === s) h._stroke = copy; });
                actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                if (layer._snapshot) actx.putImageData(layer._snapshot, 0, 0);
                layer.strokes.forEach((st, j) => { if (j !== i) drawStroke(actx, st); });
                _annotSnapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                drawStroke(actx, copy);
                _pdfImgBusy = true;
                _pdfSelImg = copy;
                return copy;
            }
            function _pdfImgPaint(s) {
                if (_annotSnapshot) actx.putImageData(_annotSnapshot, 0, 0);
                drawStroke(actx, s);
                _pdfImgUpdateFrame();
            }
            function _pdfImgEndGesture(changed) {
                _pdfImgBusy = false;
                const layer = getLayer(currentPage);
                if (!changed && layer.history && layer.history.length) layer.history.pop(); // simple clic : rien à annuler
                _invalidateSnapshot();
                redrawAnnotations(currentPage);
                if (changed) { try { _saveAnnotations(); } catch(_) {} }
            }

            // Empêcher le drag-scroll du canvasWrap / le déplacement du widget
            ['mousedown', 'touchstart'].forEach(t => imgLayer.addEventListener(t, (e) => {
                if (e.target.closest('.pdf-img-hit, .pdf-img-handle, .pdf-img-del')) e.stopPropagation();
            }, { passive: true }));

            // Déplacement (glisser une image)
            imgHits.addEventListener('pointerdown', (e) => {
                const hit = e.target.closest('.pdf-img-hit');
                if (!hit || !hit._stroke || e.button > 0) return;
                e.preventDefault();
                e.stopPropagation();
                const s = _pdfImgBeginGesture(hit._stroke);
                if (!s) return;
                _pdfImgUpdateFrame();
                const sk = _screenK();
                const cssW = annotCanvas.offsetWidth || 1, cssH = annotCanvas.offsetHeight || 1;
                const startX = e.clientX, startY = e.clientY;
                const nx0 = s.nx, ny0 = s.ny;
                const maxNx = Math.max(0, 1 - s.nw);
                const maxNy = Math.max(0, 1 - s.nh * annotCanvas.width / (annotCanvas.height || 1));
                let moved = false;
                try { hit.setPointerCapture(e.pointerId); } catch(_) {}

                const onMove = (ev) => {
                    const dx = (ev.clientX - startX) / sk, dy = (ev.clientY - startY) / sk;
                    if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return; // simple clic
                    moved = true;
                    s.nx = Math.min(maxNx, Math.max(0, nx0 + dx / cssW));
                    s.ny = Math.min(maxNy, Math.max(0, ny0 + dy / cssH));
                    _placeEl(hit, _imgCssRect(s));
                    _pdfImgPaint(s);
                };
                const onUp = (ev) => {
                    hit.removeEventListener('pointermove', onMove);
                    hit.removeEventListener('pointerup', onUp);
                    hit.removeEventListener('pointercancel', onUp);
                    try { hit.releasePointerCapture(ev.pointerId); } catch(_) {}
                    _pdfImgEndGesture(moved);
                };
                hit.addEventListener('pointermove', onMove);
                hit.addEventListener('pointerup', onUp);
                hit.addEventListener('pointercancel', onUp);
            });

            // Redimensionnement (poignée ronde bas-droite, ratio conservé)
            imgHandle.addEventListener('pointerdown', (e) => {
                if (!_pdfSelImg || e.button > 0) return;
                e.preventDefault();
                e.stopPropagation();
                const s = _pdfImgBeginGesture(_pdfSelImg);
                if (!s) return;
                const sk = _screenK();
                const k  = _cssK();
                const W  = annotCanvas.width;
                const startX = e.clientX, startY = e.clientY;
                const startW = s.nw * W * k, startH = s.nh * W * k;     // px CSS
                const r = (s.nw / s.nh) || 1;                           // largeur / hauteur
                const maxW = Math.max(20, annotCanvas.offsetWidth - s.nx * W * k);
                let changed = false;
                try { imgHandle.setPointerCapture(e.pointerId); } catch(_) {}

                const onMove = (ev) => {
                    const dx = (ev.clientX - startX) / sk, dy = (ev.clientY - startY) / sk;
                    let wNew = ((startW + dx) + (startH + dy) * r) / 2;
                    wNew = Math.max(20, Math.min(maxW, wNew));
                    s.nw = wNew / k / W;
                    s.nh = s.nw / r;
                    changed = true;
                    const hit = Array.from(imgHits.children).find(h => h._stroke === s);
                    if (hit) _placeEl(hit, _imgCssRect(s));
                    _pdfImgPaint(s);
                };
                const onUp = (ev) => {
                    imgHandle.removeEventListener('pointermove', onMove);
                    imgHandle.removeEventListener('pointerup', onUp);
                    imgHandle.removeEventListener('pointercancel', onUp);
                    try { imgHandle.releasePointerCapture(ev.pointerId); } catch(_) {}
                    _pdfImgEndGesture(changed);
                };
                imgHandle.addEventListener('pointermove', onMove);
                imgHandle.addEventListener('pointerup', onUp);
                imgHandle.addEventListener('pointercancel', onUp);
            });

            // ✕ : supprimer
            imgDel.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
            imgDel.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); _pdfImgDelete(); });

            // Clic ailleurs → désélection ; Suppr / Retour arrière → suppression
            // (listeners document : on retire ceux d'un chargement précédent de ce widget)
            if (container._pdfImgDocDown) document.removeEventListener('pointerdown', container._pdfImgDocDown, true);
            if (container._pdfImgDocKey)  document.removeEventListener('keydown',     container._pdfImgDocKey);
            container._pdfImgDocDown = (e) => {
                if (!_pdfSelImg) return;
                if (e.target.closest && e.target.closest('.pdf-img-hit, .pdf-img-frame')) return;
                _pdfImgDeselect();
            };
            container._pdfImgDocKey = (e) => {
                if (!_pdfSelImg || !imgLayer.isConnected) return;
                if (e.key !== 'Delete' && e.key !== 'Backspace') return;
                const t = e.target;
                if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
                e.preventDefault();
                _pdfImgDelete();
            };
            document.addEventListener('pointerdown', container._pdfImgDocDown, true);
            document.addEventListener('keydown',     container._pdfImgDocKey);

            // Entrée / sortie du mode annotation : draw.js modifie le style de annotCanvas
            const _pdfImgCheckMode = () => {
                const off = _imgModeOff();
                imgLayer.classList.toggle('pdf-img-layer--off', off);
                if (off) _pdfImgDeselect();
            };
            new MutationObserver(() => { _pdfImgCheckMode(); setTimeout(_pdfImgCheckMode, 0); }).observe(annotCanvas, { attributes: true, attributeFilter: ['style', 'class'] });

            // Restaurer les annotations sauvegardées (après le 1er rendu)
            if (_annotKey && typeof pdfStorage !== 'undefined' && !container._annotRestored) {
                container._annotRestored = true;
                pdfStorage.get(_annotKey).then(raw => {
                    if (!raw) return;
                    try {
                        const saved = JSON.parse(raw);
                        let changed = false;
                        for (const [p, layer] of Object.entries(saved)) {
                            if (layer && Array.isArray(layer.strokes) && layer.strokes.length > 0) {
                                annotLayers[p] = { strokes: layer.strokes };
                                changed = true;
                            }
                        }
                        if (changed) redrawAnnotations(currentPage);
                    } catch(e) {}
                }).catch(() => {});
            }

            // ── ResizeObserver : maintenir le fit-to-width si zoomScale === null ──
            if (typeof ResizeObserver !== 'undefined') {
                let _resizeTimer = null;
                let _lastWrapWidth = canvasWrap.clientWidth;

                const _resizeObs = new ResizeObserver(() => {
                    if (zoomScale !== null) return;

                    const newWidth = canvasWrap.clientWidth;
                    if (newWidth === _lastWrapWidth) return;

                    // Re-rendu différé (une fois le resize terminé)
                    if (_resizeTimer) clearTimeout(_resizeTimer);
                    _resizeTimer = setTimeout(() => {
                        _resizeTimer = null;
                        _lastWrapWidth = canvasWrap.clientWidth;
                        renderPage(currentPage);
                    }, 150);
                });
                _resizeObs.observe(canvasWrap);
            }

            // ── API publique pour draw.js (mode annotation via draw-toolbar) ──
            // Exposée sur le widget DOM pour que draw.js puisse y accéder.
            const widget = container.closest('.widget');

            // ── Persistance annotations : implémentation réelle de _saveAnnotations ──
            _saveAnnotations = function() {
                try {
                    if (!_annotKey || typeof pdfStorage === 'undefined') return;
                    var toSave = {};
                    for (var p in annotLayers) {
                        if (annotLayers[p] && Array.isArray(annotLayers[p].strokes)) {
                            // Nettoyer les propriétés non-sérialisables des strokes image
                            toSave[p] = {
                                strokes: annotLayers[p].strokes.map(s => {
                                    if (s.tool !== 'image') return s;
                                    const { _img, _selected, ...clean } = s;
                                    return clean;
                                })
                            };
                        }
                    }
                    pdfStorage.set(_annotKey, JSON.stringify(toSave));
                } catch(e) {}
            };

            if (widget) {
                widget._pdfAnnotAPI = {
                    // Démarre un trait
                    startStroke(color, size, tool, px, py) {
                        const norm = toNorm(px, py);
                        currentStrokeAnnot = { tool, color, size, pts: [norm] };
                        isDrawing = true;
                        // Snapshot des strokes validés → continueStroke restaure ce snapshot
                        // au lieu de tout redessiner à chaque point (critique sur gros PDF)
                        _buildSnapshot(currentPage);
                    },
                    // Continue le trait en cours (dessin temps réel + accumule les points)
                    continueStroke(color, size, tool, px, py) {
                        if (!isDrawing || !currentStrokeAnnot) return;
                        const norm = toNorm(px, py);
                        const pts  = currentStrokeAnnot.pts;
                        const prev = pts[pts.length - 1];
                        pts.push(norm);
                        currentStrokeAnnot.color = color;
                        currentStrokeAnnot.size  = size;
                        currentStrokeAnnot.tool  = tool;

                        const canvasW    = annotCanvas.width;
                        const displayW   = annotCanvas.getBoundingClientRect().width || 600;
                        const sizeScaled = size * canvasW / displayW;

                        if (tool === 'highlighter') {
                            // Surligneur : dessin incrémental (comme le crayon) pour minimiser
                            // la latence sur stylet/vidéoprojecteur interactif.
                            // On utilise globalCompositeOperation='source-atop' sur un canvas
                            // temporaire pour éviter l'accumulation de semi-transparence.
                            // Tous les 20 points on repart du snapshot pour corriger les artefacts.
                            if (pts.length >= 2) {
                                const lw = Math.max(sizeScaled * 6, 24 * (canvasW / displayW));
                                // Toutes les 20 pts : redessiner depuis le snapshot pour nettoyer
                                // (très rare, minimise la latence tout en gardant un rendu propre)
                                if (pts.length % 20 === 0) {
                                    if (_annotSnapshot) actx.putImageData(_annotSnapshot, 0, 0);
                                    else actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                                    const pxPts = pts.map(p => fromNorm(p.x, p.y));
                                    actx.save();
                                    actx.beginPath();
                                    actx.lineCap  = 'butt';
                                    actx.lineJoin = 'round';
                                    actx.strokeStyle = color;
                                    actx.lineWidth   = lw;
                                    actx.globalAlpha = 0.35;
                                    actx.globalCompositeOperation = 'multiply';
                                    actx.moveTo(pxPts[0].x, pxPts[0].y);
                                    for (let i = 1; i < pxPts.length; i++) actx.lineTo(pxPts[i].x, pxPts[i].y);
                                    actx.stroke();
                                    actx.restore();
                                } else {
                                    // Dessin incrémental : seulement le nouveau segment
                                    const pPrev = fromNorm(prev.x, prev.y);
                                    const pCur  = fromNorm(norm.x, norm.y);
                                    actx.save();
                                    actx.beginPath();
                                    actx.lineCap  = 'round';
                                    actx.lineJoin = 'round';
                                    actx.strokeStyle = color;
                                    actx.lineWidth   = lw;
                                    actx.globalAlpha = 0.35;
                                    actx.globalCompositeOperation = 'multiply';
                                    actx.moveTo(pPrev.x, pPrev.y);
                                    actx.lineTo(pCur.x, pCur.y);
                                    actx.stroke();
                                    actx.restore();
                                }
                            }
                        } else {
                            // Dessin incrémental pour pen/eraser : on ne trace que le nouveau segment
                            actx.save();
                            if (tool === 'eraser') {
                                actx.globalCompositeOperation = 'destination-out';
                                actx.lineWidth = sizeScaled * 2;
                                actx.lineCap   = 'round';
                            } else {
                                actx.lineWidth = sizeScaled;
                                actx.lineCap   = 'round';
                            }
                            actx.strokeStyle = color;
                            actx.lineJoin    = 'round';
                            actx.beginPath();
                            const pPrev = fromNorm(prev.x, prev.y);
                            const pCur  = fromNorm(norm.x, norm.y);
                            actx.moveTo(pPrev.x, pPrev.y);
                            actx.lineTo(pCur.x,  pCur.y);
                            actx.stroke();
                            actx.restore();
                        }
                    },
                    // Termine le trait et le sauvegarde dans annotLayers
                    endStroke() {
                        if (!isDrawing || !currentStrokeAnnot) return;
                        isDrawing = false;
                        if (currentStrokeAnnot.pts.length > 0) {
                            // Un seul point = tap simple → marquer comme dot (point plein)
                            if (currentStrokeAnnot.pts.length === 1) {
                                currentStrokeAnnot.dot = true;
                            }
                            const layer = getLayer(currentPage);
                            if (!layer.history) layer.history = [];
                            layer.redoHistory = []; // vider redo à chaque nouvelle action
                            layer.history.push([...layer.strokes]);
                            if (layer.history.length > 30) layer.history.shift();
                            layer.strokes.push(currentStrokeAnnot);
                        }
                        currentStrokeAnnot = null;
                        redrawAnnotations(currentPage);
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Annuler le dernier stroke
                    undo() {
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        if (!layer.redoHistory) layer.redoHistory = [];
                        if (layer.history.length > 0) {
                            layer.redoHistory.push([...layer.strokes]);
                            layer.strokes = layer.history.pop();
                            redrawAnnotations(currentPage);
                        } else if (layer.strokes.length > 0) {
                            layer.redoHistory.push([...layer.strokes]);
                            layer.strokes.pop();
                            redrawAnnotations(currentPage);
                        }
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Refaire le dernier stroke annulé
                    redo() {
                        const layer = getLayer(currentPage);
                        if (!layer.redoHistory) layer.redoHistory = [];
                        if (layer.redoHistory.length > 0) {
                            if (!layer.history) layer.history = [];
                            layer.history.push([...layer.strokes]);
                            layer.strokes = layer.redoHistory.pop();
                            redrawAnnotations(currentPage);
                        }
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Effacer toutes les annotations de la page courante
                    clear() {
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        if (layer.strokes.length > 0) {
                            layer.history.push([...layer.strokes]);
                        }
                        layer.strokes = [];
                        redrawAnnotations(currentPage);
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Accès au canvas pour récupérer les coordonnées
                    getAnnotCanvas() { return annotCanvas; },
                    getPdfDoc()      { return pdfDoc; },
                    getTotalPages()  { return totalPages; },
                    getAnnotLayers() { return annotLayers; },
                    drawStrokeOn(ctx, stroke, cw) {
                        // Redessine un stroke sur un contexte externe (pour export)
                        const savedW = annotCanvas.width;
                        // Remplacer temporairement la largeur de référence
                        const origW = annotCanvas.width;
                        // drawStroke utilise annotCanvas.width directement
                        // On passe ctx + on patch temporairement annotCanvas.width
                        const _orig = annotCanvas.width;
                        Object.defineProperty(annotCanvas, 'width', { value: cw, configurable: true });
                        drawStroke(ctx, stroke);
                        Object.defineProperty(annotCanvas, 'width', { value: _orig, configurable: true });
                    },
                    // Ajouter un texte (stocké dans annotLayers, survit au zoom/changement de page)
                    addTextStroke(text, color, size, px, py) {
                        const norm = toNorm(px, py);
                        const stroke = { tool: 'text', color, size, text: text, nx: norm.x, ny: norm.y };
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes.push(stroke);
                        redrawAnnotations(currentPage);
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Preview d'une figure en cours de tracé (sans sauvegarder)
                    previewFigure(color, size, pts, fillColor, fillOpacity) {
                        redrawAnnotations(currentPage);
                        const canvasW = annotCanvas.width;
                        const displayW = annotCanvas.getBoundingClientRect().width || 600;
                        const sizeScaled = size * canvasW / displayW;
                        actx.save();
                        actx.strokeStyle = color;
                        actx.lineWidth = sizeScaled;
                        actx.lineCap = 'round';
                        actx.lineJoin = 'round';
                        actx.setLineDash([6, 4]);
                        actx.globalAlpha = 0.7;
                        actx.beginPath();
                        pts.forEach((p, i) => {
                            i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y);
                        });
                        // Remplissage preview si défini
                        if (fillColor && fillOpacity > 0) {
                            actx.save();
                            actx.globalAlpha = fillOpacity * 0.7; // légèrement transparent en preview
                            actx.fillStyle = fillColor;
                            actx.setLineDash([]);
                            actx.fill();
                            actx.restore();
                            actx.setLineDash([6, 4]);
                        }
                        actx.stroke();
                        actx.setLineDash([]);
                        actx.restore();
                    },
                    // Ajouter un remplissage pot de peinture (x, y, w, h en pixels canvas)
                    addFillStroke(src, x, y, w, h, color) {
                        const stroke = {
                            tool: 'fill', color: color || '#000000', size: 1, src,
                            nx: x / annotCanvas.width,  ny: y / annotCanvas.height,
                            nw: w / annotCanvas.width,  nh: h / annotCanvas.height
                        };
                        // Image déjà prête : dessin immédiat, sans attendre le chargement
                        const pre = new Image();
                        pre.src = src;
                        _annotFillCache.set(src, pre);
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes.push(stroke);
                        if (pre.complete && pre.naturalWidth) redrawAnnotations(currentPage);
                        else pre.onload = () => redrawAnnotations(currentPage);
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Ajouter une figure (stockée en normalisé dans annotLayers)
                    addFigureStroke(color, size, pts, fillColor, fillOpacity) {
                        const normPts = pts.map(p => toNorm(p.x, p.y));
                        const stroke = { tool: 'figure', color, size, pts: normPts };
                        if (fillColor && fillOpacity > 0) {
                            stroke.fillColor   = fillColor;
                            stroke.fillOpacity = fillOpacity;
                        }
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes.push(stroke);
                        redrawAnnotations(currentPage);
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Prévisualisation du cercle gomme
                    previewEraser(px, py, r) {
                        // Restaurer le snapshot si disponible, sinon full redraw
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                        } else {
                            actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                            const layer2 = getLayer(currentPage);
                            if (layer2._snapshot) actx.putImageData(layer2._snapshot, 0, 0);
                            for (const s of layer2.strokes) drawStroke(actx, s);
                        }
                        // Si effacement en cours, redessiner le trait d'effacement accumulé
                        if (isDrawing && currentStrokeAnnot && currentStrokeAnnot.tool === 'eraser' && currentStrokeAnnot.pts.length > 1) {
                            const canvasW2 = annotCanvas.width;
                            const displayW2 = annotCanvas.getBoundingClientRect().width || 600;
                            actx.save();
                            actx.globalCompositeOperation = 'destination-out';
                            actx.lineWidth = currentStrokeAnnot.size * canvasW2 / displayW2 * 2;
                            actx.lineCap = 'round';
                            actx.lineJoin = 'round';
                            actx.beginPath();
                            const p0 = fromNorm(currentStrokeAnnot.pts[0].x, currentStrokeAnnot.pts[0].y);
                            actx.moveTo(p0.x, p0.y);
                            for (let i = 1; i < currentStrokeAnnot.pts.length; i++) {
                                const p = fromNorm(currentStrokeAnnot.pts[i].x, currentStrokeAnnot.pts[i].y);
                                actx.lineTo(p.x, p.y);
                            }
                            actx.stroke();
                            actx.restore();
                        }
                        // Dessiner le cercle preview
                        const canvasW = annotCanvas.width;
                        const displayW = annotCanvas.getBoundingClientRect().width || 600;
                        const rScaled = r * canvasW / displayW;
                        actx.save();
                        actx.globalCompositeOperation = 'source-over';
                        actx.beginPath();
                        actx.arc(px, py, rScaled, 0, Math.PI * 2);
                        actx.strokeStyle = 'rgba(80,80,80,0.9)';
                        actx.lineWidth = 1.5;
                        actx.setLineDash([4, 3]);
                        actx.stroke();
                        actx.beginPath();
                        actx.arc(px, py, 2, 0, Math.PI * 2);
                        actx.fillStyle = 'rgba(80,80,80,0.7)';
                        actx.fill();
                        actx.restore();
                    },
                    // Redessiner les annotations (efface les previews)
                    redrawAnnotations() {
                        redrawAnnotations(currentPage);
                    },
                    // Effacement direct pixel par pixel (en temps réel)
                    eraseAt(px, py, r) {
                        const canvasW = annotCanvas.width;
                        const displayW = annotCanvas.getBoundingClientRect().width || 600;
                        const rScaled = r * canvasW / displayW;
                        actx.save();
                        actx.globalCompositeOperation = 'destination-out';
                        actx.beginPath();
                        actx.arc(px, py, rScaled, 0, Math.PI * 2);
                        actx.fill();
                        actx.restore();
                    },
                    // Sauvegarder l'état après effacement (snapshot du canvas → annotLayers)
                    saveEraserSnapshot() {
                        // Stocker le canvas entier comme stroke spécial 'snapshot'
                        const layer = getLayer(currentPage);
                        const imgData = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                        layer._snapshot = imgData;
                        // Nettoyer les strokes normaux car le snapshot les inclut
                        layer.strokes = [];
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // Déplacer un stroke texte en temps réel (pendant le drag)
                    // Dessiner un cadre de sélection autour d'un stroke texte
                    drawTextSelection(index) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'text') return;
                        // Utiliser le snapshot si disponible (drag en cours)
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, s);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                        const canvasW  = annotCanvas.width;
                        const pos      = fromNorm(s.nx, s.ny);
                        const fontSize = Math.round(6 * Math.pow(1.12, s.size) * canvasW / 600);
                        actx.save();
                        actx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                        const lines = (s.text || '').split('\n');
                        const textW = Math.max(...lines.map(l => actx.measureText(l).width));
                        actx.restore();
                        const textH = lines.length * fontSize * 1.3;
                        const pad = 4 * canvasW / 600;
                        // Si le texte est pivoté, dessiner le cadre pivoté aussi
                        const rot = s.rotation || 0;
                        const cx = pos.x + textW / 2;
                        const cy = pos.y + textH / 2;
                        const x = pos.x - pad;
                        const y = pos.y - pad;
                        const w = textW + pad * 2;
                        const h = textH + pad * 2;
                        actx.save();
                        if (rot) {
                            actx.translate(cx, cy);
                            actx.rotate(rot);
                            actx.translate(-cx, -cy);
                        }
                        actx.strokeStyle = '#4a90e2';
                        actx.lineWidth   = 2 * canvasW / 600;
                        actx.setLineDash([5, 3]);
                        actx.strokeRect(x, y, w, h);
                        const r = 4 * canvasW / 600;
                        actx.fillStyle = '#4a90e2';
                        [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([bx,by]) => {
                            actx.beginPath();
                            actx.arc(bx, by, r, 0, Math.PI*2);
                            actx.fill();
                        });
                        actx.restore();
                        // Boutons overlay : ✕ haut-droit, ↻ bas-gauche
                        // Calculer les coins réels après rotation pour positionner les boutons
                        const corners = [[x+w, y], [x, y+h]];
                        const rotatedCorners = corners.map(([bx, by]) => {
                            if (!rot) return [bx, by];
                            const dx = bx - cx, dy = by - cy;
                            return [cx + dx * Math.cos(rot) - dy * Math.sin(rot),
                                    cy + dx * Math.sin(rot) + dy * Math.cos(rot)];
                        });
                        _showAnnotTextHandles(index, {
                            x: rotatedCorners[0][0], y: rotatedCorners[0][1],
                            w: 0, h: 0,
                            // On passe directement les positions des coins
                            _deleteAt:  { px: rotatedCorners[0][0], py: rotatedCorners[0][1] },
                            _rotateAt:  { px: rotatedCorners[1][0], py: rotatedCorners[1][1] }
                        });
                    },
                    moveTextStroke(index, px, py) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        const norm = toNorm(px, py);
                        layer.strokes[index] = { ...layer.strokes[index], nx: norm.x, ny: norm.y };
                        // Pendant le drag, on utilise le snapshot si disponible
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, layer.strokes[index]);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                    },
                    // Sauvegarder la position finale après drag (ajoute à l'historique)
                    saveTextMove(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        _invalidateSnapshot(); // strokes validés ont changé
                        try { _saveAnnotations(); } catch(e) {}
                    },

                    // Fait pivoter un texte (angle absolu en radians)
                    rotateTextStroke(index, angle) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        layer.strokes[index] = { ...layer.strokes[index], rotation: angle };
                        // Pendant la rotation, snapshot + redessiner juste ce stroke
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, layer.strokes[index]);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                    },

                    // Sauvegarde dans l'historique après rotation texte
                    saveTextTransform(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        _invalidateSnapshot(); // strokes validés ont changé
                        try { _saveAnnotations(); } catch(e) {}
                    },
                    // px, py : coordonnées canvas pixels ; retourne le stroke trouvé ou null
                    findTextStrokeAt(px, py) {
                        const layer = getLayer(currentPage);
                        const canvasW = annotCanvas.width;
                        // Parcourir en sens inverse pour prendre le stroke le plus en avant
                        for (let i = layer.strokes.length - 1; i >= 0; i--) {
                            const s = layer.strokes[i];
                            if (s.tool !== 'text') continue;
                            const pos      = fromNorm(s.nx, s.ny);
                            const fontSize = Math.round(6 * Math.pow(1.12, s.size) * canvasW / 600);
                            actx.save();
                            actx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                            const metrics = actx.measureText(s.text || '');
                            actx.restore();
                            const x0 = pos.x;
                            const y0 = pos.y;
                            const x1 = pos.x + metrics.width;
                            const y1 = pos.y + fontSize * 1.3;
                            // Zone de hit élargie de 6px
                            if (px >= x0 - 6 && px <= x1 + 6 && py >= y0 - 6 && py <= y1 + 6) {
                                return { index: i, stroke: s };
                            }
                        }
                        return null;
                    },
                    // Mettre à jour le texte d'un stroke existant
                    updateTextStroke(index, newText, newSize, newColor) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes[index] = {
                            ...layer.strokes[index],
                            text: newText,
                            ...(newSize  !== undefined ? { size:  newSize  } : {}),
                            ...(newColor !== undefined ? { color: newColor } : {})
                        };
                        redrawAnnotations(currentPage);
                    },

                    // ── Sélection / déplacement des figures ──────────────────
                    // Trouve la figure sous le curseur (px, py en pixels canvas)
                    findFigureStrokeAt(px, py) {
                        const layer = getLayer(currentPage);
                        const canvasW = annotCanvas.width;
                        const HIT_PAD = 8 * canvasW / 600;
                        for (let i = layer.strokes.length - 1; i >= 0; i--) {
                            const s = layer.strokes[i];
                            if (s.tool !== 'figure' || !s.pts || s.pts.length < 2) continue;
                            if (s.locked) continue; // figure ancrée : invisible à la sélection
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            s.pts.forEach(p => {
                                const cp = fromNorm(p.x, p.y);
                                if (cp.x < minX) minX = cp.x;
                                if (cp.y < minY) minY = cp.y;
                                if (cp.x > maxX) maxX = cp.x;
                                if (cp.y > maxY) maxY = cp.y;
                            });
                            if (px >= minX - HIT_PAD && px <= maxX + HIT_PAD &&
                                py >= minY - HIT_PAD && py <= maxY + HIT_PAD) {
                                return { index: i, stroke: s, bbox: { minX, minY, maxX, maxY } };
                            }
                        }
                        return null;
                    },

                    // Dessine un cadre de sélection autour d'une figure
                    drawFigureSelection(index) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure' || !s.pts) return;
                        // Utiliser le snapshot de drag si disponible (évite un full redraw)
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, s);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                        const canvasW = annotCanvas.width;
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        s.pts.forEach(p => {
                            const cp = fromNorm(p.x, p.y);
                            if (cp.x < minX) minX = cp.x;
                            if (cp.y < minY) minY = cp.y;
                            if (cp.x > maxX) maxX = cp.x;
                            if (cp.y > maxY) maxY = cp.y;
                        });
                        const pad = 6 * canvasW / 600;
                        const x = minX - pad, y = minY - pad;
                        const w = (maxX - minX) + pad * 2;
                        const h = (maxY - minY) + pad * 2;
                        actx.save();
                        actx.strokeStyle = '#4a90e2';
                        actx.lineWidth   = 2 * canvasW / 600;
                        actx.setLineDash([5, 3]);
                        actx.strokeRect(x, y, w, h);
                        const r = 4 * canvasW / 600;
                        actx.fillStyle = '#4a90e2';
                        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
                            actx.beginPath();
                            actx.arc(cx, cy, r, 0, Math.PI * 2);
                            actx.fill();
                        });
                        actx.restore();
                        // Boutons overlay : ✕ haut-droit, ⤡ bas-droit, ↻ bas-gauche
                        _showAnnotFigureHandles(index, { x, y, w, h });
                    },

                    // Prépare un drag de figure : construit un snapshot sans la figure draggée
                    // → moveFigureStroke / drawFigureSelection utilisent ce snapshot pendant le drag
                    startDragFigure(index) {
                        const layer = getLayer(currentPage);
                        actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                        if (layer._snapshot) actx.putImageData(layer._snapshot, 0, 0);
                        layer.strokes.forEach((s, i) => { if (i !== index) drawStroke(actx, s); });
                        _annotSnapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                    },

                    // Prépare un drag de texte : snapshot sans le texte draggé
                    startDragText(index) {
                        const layer = getLayer(currentPage);
                        actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                        if (layer._snapshot) actx.putImageData(layer._snapshot, 0, 0);
                        layer.strokes.forEach((s, i) => { if (i !== index) drawStroke(actx, s); });
                        _annotSnapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                    },

                    // Déplace une figure (delta en pixels canvas normalisés)
                    moveFigureStroke(index, dnx, dny) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure') return;
                        layer.strokes[index] = {
                            ...s,
                            pts: s.pts.map(p => ({ x: p.x + dnx, y: p.y + dny }))
                        };
                        // Pendant le drag, snapshot (sans la figure) + redessiner la figure déplacée
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, layer.strokes[index]);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                    },

                    // Sauvegarde le déplacement dans l'historique
                    saveFigureMove(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        _invalidateSnapshot(); // strokes validés ont changé
                        try { _saveAnnotations(); } catch(e) {}
                    },

                    // Redimensionne une figure : scaleX/scaleY absolus depuis les pts d'origine
                    // origPts : tableau des pts normalisés au moment du début du drag
                    resizeFigureStroke(index, scaleX, scaleY, origPts) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure') return;
                        const pts = origPts || s.pts;
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        pts.forEach(p => {
                            if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                            if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                        });
                        const cx = (minX + maxX) / 2;
                        const cy = (minY + maxY) / 2;
                        layer.strokes[index] = {
                            ...s,
                            pts: pts.map(p => ({
                                x: cx + (p.x - cx) * scaleX,
                                y: cy + (p.y - cy) * scaleY
                            }))
                        };
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, layer.strokes[index]);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                    },

                    // Fait pivoter une figure d'un angle absolu autour de son centre d'origine
                    // origPts : pts normalisés capturés au début du drag
                    rotateFigureStroke(index, absAngle, origPts) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure') return;
                        const pts = origPts || s.pts;
                        // Travailler en pixels canvas pour que la rotation soit isométrique
                        const pxPts = pts.map(p => fromNorm(p.x, p.y));
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        pxPts.forEach(p => {
                            if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                            if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                        });
                        const cx = (minX + maxX) / 2;
                        const cy = (minY + maxY) / 2;
                        const cos = Math.cos(absAngle);
                        const sin = Math.sin(absAngle);
                        layer.strokes[index] = {
                            ...s,
                            pts: pxPts.map(p => {
                                const dx = p.x - cx, dy = p.y - cy;
                                return toNorm(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
                            })
                        };
                        if (_annotSnapshot) {
                            actx.putImageData(_annotSnapshot, 0, 0);
                            drawStroke(actx, layer.strokes[index]);
                        } else {
                            redrawAnnotations(currentPage);
                        }
                    },

                    // Sauvegarde dans l'historique (après resize ou rotate terminé)
                    saveFigureTransform(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        _invalidateSnapshot(); // strokes validés ont changé
                        try { _saveAnnotations(); } catch(e) {}
                    },

                    // Ajouter une image collée (dataUrl) à la position normalisée
                    addImageStroke(dataUrl) {
                        _insertImageOnPdf(dataUrl);
                    },

                    // Trouver une image sous le curseur (px, py pixels canvas)
                    findImageStrokeAt(px, py) {
                        return _findImageStrokeAt(px, py);
                    }
                };
            }

        }).catch(err => {
            console.error('PDF.js erreur :', err);
            if (canvasWrap) canvasWrap.innerHTML = '<p style="color:red;padding:16px;">Impossible de lire ce PDF.</p>';
        });
    });
}
