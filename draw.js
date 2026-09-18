// =========================================================================
// DESSIN LIBRE
// =========================================================================
var drawCanvas = null, drawCtx = null, isPainting = false, isDrawMode = false;
var drawCanvasTop = null, drawCtxTop = null; // canvas de premier plan pour strokes épinglés
var strokes = [], currentStroke = null;

// ── Helper : active/désactive un bouton de mode (styles inline + classe CSS pour le thème clair) ──
// Désactive le mode panoramique fond PDF si actif
function _stopBgPanIfActive() {
    if (!window._bgPanModeActive) return;
    if (typeof _togglePdfPanMode === 'function') _togglePdfPanMode();
}

function _setBtnActive(id, active, colorScheme) {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (colorScheme === 'figures') {
        // Bouton figures : bleu doux
        btn.style.borderColor = active ? '#4a90e2' : '#444';
        btn.style.background  = active ? '#1a2a4a' : '#2a2a2e';
        btn.style.color       = active ? '#7ab8f5' : '#aaa';
    } else {
        // Bouton standard (dessin libre, sélection)
        btn.style.borderColor = active ? '#4a90e2' : '#444';
        btn.style.background  = active ? '#1a3550' : '#2a2a2e';
        btn.style.color       = active ? '#fff'    : '#aaa';
    }
    btn.classList.toggle('btn-mode-active', active);
}

// Style de curseur actif : 'size' (défaut) | 'dot' | 'crosshair'
window._drawCursorStyle = window._drawCursorStyle || 'size';

// Opacité du trait (0.0–1.0), modifiable depuis les options avancées
window._drawOpacity = (window._drawOpacity !== undefined) ? window._drawOpacity : 1.0;

// Reconnaissance de forme automatique (désactivée par défaut)
window._drawShapeRecog = window._drawShapeRecog || false;

// Met à jour l'aspect visuel des 3 boutons de curseur
function _updateDrawCursorBtns() {
    const style = window._drawCursorStyle || 'size';
    ['crosshair','dot','size'].forEach(function(s) {
        const btn = document.getElementById('draw-cursor-btn-' + s);
        if (!btn) return;
        if (s === style) {
            btn.style.setProperty('border', '2px solid #4a90e2', 'important');
            btn.style.setProperty('background', '#1a3550', 'important');
            btn.style.setProperty('color', '#fff', 'important');
        } else {
            btn.style.setProperty('border', '2px solid #555', 'important');
            btn.style.setProperty('background', '#2a2a2e', 'important');
            btn.style.setProperty('color', '#aaa', 'important');
        }
    });
}

// Change le style de curseur, met à jour les boutons et applique le curseur
function _setDrawCursorStyle(style) {
    window._drawCursorStyle = style;
    _updateDrawCursorBtns();
    updateDrawCursor();
    // Si on est en mode annotation PDF avec l'outil crayon, mettre à jour le curseur PDF aussi
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode && _pdfAnnotTool === 'pen') {
        const cursor = _pdfCursor('pen');
        if (_pdfAnnotEvTarget) {
            _pdfAnnotEvTarget.style.setProperty('cursor', cursor, 'important');
            _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => {
                if (!el.closest('.editor-toolbar')) el.style.setProperty('cursor', cursor, 'important');
            });
        }
        if (_pdfAnnotCanvas) _pdfAnnotCanvas.style.cursor = cursor;
    }
}

// Génère et applique le curseur selon window._drawCursorStyle
function updateDrawCursor() {
    if (!isDrawMode || !board) return;
    const style = window._drawCursorStyle || 'size';
    const isHighlight = (currentDrawMode === 'highlight');

    if (style === 'crosshair') {
        const cursorVal = isHighlight ? _highlightCursorUrl() : 'crosshair';
        board.style.setProperty('cursor', cursorVal, 'important');
        document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
            w.style.setProperty('cursor', cursorVal, 'important');
        });
        return;
    }

    // Surligneur : toujours la croix jaune quelle que soit le style dot/size
    if (isHighlight) {
        const cursorVal = _highlightCursorUrl();
        board.style.setProperty('cursor', cursorVal, 'important');
        document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
            w.style.setProperty('cursor', cursorVal, 'important');
        });
        return;
    }

    const color = window._drawColor
        || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
        || document.querySelector('#cpick-draw-color .cpick-swatch')?.style?.background
        || '#e84393';

    let svg, hotX = 10, hotY = 10;

    if (style === 'dot') {
        // Point fixe 2px avec cercle gris autour
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">`
            + `<circle cx="10" cy="10" r="8" fill="none" stroke="#999" stroke-width="1.5"/>`
            + `<circle cx="10" cy="10" r="2" fill="${color}"/>`
            + `</svg>`;
    } else {
        // 'size' : point seul dont la taille = épaisseur du trait, sans cercle
        const size = parseInt((document.getElementById('draw-size') || {}).value) || 4;
        const rDot = Math.max(2, Math.min(size / 2, 24));
        const dim  = rDot * 2 + 4;
        const cx   = dim / 2;
        hotX = hotY = cx;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}">`
            + `<circle cx="${cx}" cy="${cx}" r="${rDot}" fill="${color}"/>`
            + `</svg>`;
    }

    const b64 = btoa(svg);
    const cursorVal = `url("data:image/svg+xml;base64,${b64}") ${hotX} ${hotY}, crosshair`;
    board.style.setProperty('cursor', cursorVal, 'important');
    // Forcer le curseur sur les widgets ancrés (leur cursor:move primerait sinon)
    document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
        w.style.setProperty('cursor', cursorVal, 'important');
    });
}

// Curseur surligneur : marqueur vertical, hotspot à la pointe
function _highlightCursorUrl() {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">'
        + '<rect x="11" y="1" width="10" height="6" rx="2" fill="#aaa" stroke="#888" stroke-width="0.8"/>'
        + '<rect x="11" y="6" width="10" height="17" rx="1" fill="#f5c518" stroke="#c8a010" stroke-width="0.8"/>'
        + '<rect x="13" y="7" width="3" height="15" rx="1" fill="#fde96a" opacity="0.6"/>'
        + '<polygon points="11,23 21,23 16,31" fill="#fad84a" stroke="#c8a010" stroke-width="0.8"/>'
        + '<circle cx="16" cy="31" r="1.5" fill="#c8a010"/>'
        + '</svg>';
    return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 16 31, crosshair';
}

function clearDrawCursor() {
    if (board) {
        // Ne pas écraser le curseur texte si le mode placement texte est actif
        if (typeof isTextPlacementMode !== 'undefined' && isTextPlacementMode) return;
        board.style.removeProperty('cursor');
        // Retirer le curseur forcé sur les widgets ancrés
        document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
            w.style.removeProperty('cursor');
        });
    }
}

function initCanvas() {
    if (drawCanvas) return;
    drawCanvas = document.createElement('canvas');
    drawCanvas.id = 'draw-canvas';
    // pointer-events:none : le canvas ne bloque JAMAIS les clics sur toolbar/boutons
    drawCanvas.style.pointerEvents = 'none';
    resizeCanvas();
    board.appendChild(drawCanvas);
    drawCtx = drawCanvas.getContext('2d');

    // Canvas de premier plan pour les strokes épinglés (au-dessus de tout)
    drawCanvasTop = document.createElement('canvas');
    drawCanvasTop.id = 'draw-canvas-top';
    drawCanvasTop.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:11000;';
    drawCanvasTop.width  = drawCanvas.width;
    drawCanvasTop.height = drawCanvas.height;
    board.appendChild(drawCanvasTop);
    drawCtxTop = drawCanvasTop.getContext('2d');
    // Les événements sont captés sur le board (pas le canvas)
    // pour que les éléments position:fixed restent toujours cliquables
    board.addEventListener('mousedown',  _boardDrawMouseDown);
    board.addEventListener('mousemove',  _boardDrawMouseMove);
    board.addEventListener('mouseup',    _boardDrawMouseUp);
    board.addEventListener('mouseleave', _boardDrawMouseLeave);
    board.addEventListener('touchstart', _boardDrawTouchStart, { passive:false });
    board.addEventListener('touchmove',  _boardDrawTouchMove,  { passive:false });
    board.addEventListener('touchend',   _boardDrawTouchEnd);
    board.addEventListener('contextmenu', _boardDrawContextMenu);
    // Pointer events pour stylet (plus fiables que mouse events sur Firefox/tablette)
    board.addEventListener('pointerdown', _boardDrawPointerDown);
    board.addEventListener('pointerup',   _boardDrawPointerUp);
    // pointermove dédié au dessin stylet (latence réduite, contourne le filtre souris)
    board.addEventListener('pointermove', _boardDrawPointerMove);
    document.getElementById('draw-size').addEventListener('input', function() {
        document.getElementById('draw-size-label').textContent = this.value;
        if (isDrawMode && window._drawCursorStyle === 'size') updateDrawCursor();
    });
    // Initialiser window._drawColor depuis la couleur de la swatch si pas encore défini
    if (!window._drawColor) {
        const swatch = document.querySelector('#cpick-draw-color .cpick-swatch');
        if (swatch && swatch.style.background) window._drawColor = swatch.style.background;
    }
    const opSlider = document.getElementById('shape-recog-opacity');
    if (opSlider) opSlider.addEventListener('input', function() {
        document.getElementById('shape-recog-opacity-val').textContent = this.value + '%';
    });
}

function resizeCanvas() {
    if (!drawCanvas) return;
    drawCanvas.width = board.offsetWidth; drawCanvas.height = board.offsetHeight;
    if (drawCanvasTop) { drawCanvasTop.width = drawCanvas.width; drawCanvasTop.height = drawCanvas.height; }
    redrawStrokes();
}

function getPos(e) {
    const rect = board.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// Proxy board → dessin/gomme (le canvas a pointer-events:none)
// Tolérance de déplacement pour le clic droit (utile avec stylet sur tablette)
var _rightClickDownX = null, _rightClickDownY = null;
var _rightClickPending = false;   // un appui bouton droit est en cours
var _rightClickDone = false;      // basculement déjà effectué (évite double-trigger)
var _RIGHT_CLICK_TOLERANCE = 60;  // px — large pour stylet

var _pdfAnnotToolBeforeEraser = null; // outil mémorisé avant le clic droit en mode PDF
var _pdfAnnotDrawModeBeforeEraser = null; // drawMode mémorisé (pour les figures)

function _doToggleEraserDraw() {
    if (_pdfAnnotMode) {
        // En mode annotation PDF : toggle gomme ↔ outil précédent
        if (_pdfAnnotTool === 'eraser') {
            // Revenir à l'outil d'avant
            const prevTool = _pdfAnnotToolBeforeEraser || 'pen';
            const prevDrawMode = _pdfAnnotDrawModeBeforeEraser;
            _pdfAnnotToolBeforeEraser = null;
            _pdfAnnotDrawModeBeforeEraser = null;
            setPdfAnnotTool(prevTool);
            // Restaurer le mode figure si nécessaire
            if (prevTool === 'figure' && prevDrawMode && FIGURE_MODES.includes(prevDrawMode)) {
                currentDrawMode = prevDrawMode;
            }
            // Effacer le cercle aperçu de la gomme
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api && api.redrawAnnotations) api.redrawAnnotations();
        } else {
            // Mémoriser l'outil et le drawMode courants
            _pdfAnnotToolBeforeEraser = _pdfAnnotTool;
            _pdfAnnotDrawModeBeforeEraser = currentDrawMode;
            setPdfAnnotTool('eraser');
        }
        return;
    }
    if (isEraserMode) {
        stopEraserMode();
        isDrawMode = true;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    } else {
        toggleEraserMode();
    }
}

function _tryRightClickToggle(clientX, clientY) {
    if (!_rightClickPending) return false;
    if (!isDrawMode && !isEraserMode && !_pdfAnnotMode) return false;
    const dx = clientX - _rightClickDownX;
    const dy = clientY - _rightClickDownY;
    if (Math.hypot(dx, dy) <= _RIGHT_CLICK_TOLERANCE) {
        if (!_rightClickDone) {
            _rightClickDone = true;
            _doToggleEraserDraw();
        }
        return true;
    }
    return false;
}

// Pointer events — source la plus fiable pour stylet sous Firefox
function _boardDrawPointerDown(e) {
    if (e.button !== 2) return;
    _rightClickDownX = e.clientX;
    _rightClickDownY = e.clientY;
    _rightClickPending = true;
    _rightClickDone = false;
}
function _boardDrawPointerUp(e) {
    if (e.button !== 2) return;
    _tryRightClickToggle(e.clientX, e.clientY);
    _rightClickPending = false;
}
// pointermove : gère le dessin libre et le surligneur via pointer events
// (getCoalescedEvents récupère tous les points intermédiaires = trait plus fluide)
function _boardDrawPointerMove(e) {
    if (_pdfAnnotMode) return;  // dessin stylet PDF géré par _pdfAnnotPointerMove
    // Ne traiter que les stylets et le touch — la souris est gérée par mousemove
    if (e.pointerType === 'mouse') return;
    if (!isPainting || !isDrawMode || isEraserMode || !currentStroke) return;
    if (FIGURE_MODES.includes(currentDrawMode)) return; // géré par mousemove
    // Utiliser les coalesced events si disponibles (Firefox/Chrome stylet)
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ce of events) {
        paint(ce);
    }
}

// contextmenu — fallback si pointer events n'ont pas déclenché le toggle
function _boardDrawContextMenu(e) {
    // Laisser les image widgets et stickers gérer leur propre menu contextuel
    if (e.target && e.target.closest && (
        e.target.closest('.widget[data-image-widget="true"]') ||
        e.target.closest('.widget[data-sticker-widget="true"]')
    )) return;
    if (!isDrawMode && !isEraserMode && !_pdfAnnotMode) return;
    e.preventDefault();
    if (!_rightClickDone) {
        _doToggleEraserDraw();
    }
    _rightClickPending = false;
    _rightClickDone = false;
    _rightClickDownX = null;
    _rightClickDownY = null;
}

function _boardDrawMouseDown(e)  {
    if (e.button === 2) return;
    if (window._bgPanModeActive) return;
    if (_pdfAnnotMode) return;
    if (isDrawMode)   { startPaint(e); return; }
    if (isEraserMode) { startErase(e); return; }
}
function _boardDrawMouseUp(e) {
    if (e.button === 2) return;
    if (_pdfAnnotMode) return;
    if (isDrawMode && FIGURE_MODES.includes(currentDrawMode)) return;
    if (isDrawMode) endPaint(); else if (isEraserMode) endErase();
}
function _boardDrawMouseMove(e)  {
    if (window._bgPanModeActive) return;
    if (_pdfAnnotMode) return;
    if (isDrawMode)   { if (currentDrawMode === 'free' || currentDrawMode === 'highlight') updateDrawCursor(); paint(e); return; }
    if (isEraserMode) { onEraserMouseMove(e); return; }
}
function _boardDrawMouseLeave(e) {
    if (isDrawMode && FIGURE_MODES.includes(currentDrawMode)) {
        // Ne pas terminer la figure si la souris sort du board — on attend le mouseup
        return;
    }
    if (isDrawMode) endPaint(); else if (isEraserMode) { endErase(); redrawStrokes(); }
}
function _boardDrawTouchStart(e) {
    if (window._bgPanModeActive) return;
    if (_pdfAnnotMode) return; // le touch est géré par _pdfAnnotPointerDown en mode PDF
    if (!isDrawMode && !isEraserMode) return;
    e.preventDefault();
    if (isEraserMode) { snapshotNow(); isErasing = true; eraseAt(getPos(e.touches[0])); }
    else startPaint(e.touches[0]);
}
function _boardDrawTouchMove(e) {
    if (_pdfAnnotMode) return;
    if (!isDrawMode && !isEraserMode) return;
    e.preventDefault();
    // Si le pointermove stylet est actif (isPainting + pen pointerType), ne pas doubler
    if (isPainting && isDrawMode && !isEraserMode && e.touches[0] && e.touches[0].touchType === 'stylus') return;
    if (isEraserMode) { if (isErasing) eraseAt(getPos(e.touches[0])); }
    else paint(e.touches[0]);
}
function _boardDrawTouchEnd(e) {
    if (_pdfAnnotMode) return;
    if (isDrawMode && FIGURE_MODES.includes(currentDrawMode) && e.changedTouches && e.changedTouches[0]) {
        _figureEnd = getPos(e.changedTouches[0]);
        _segmentEnd = _figureEnd;
    }
    if (isEraserMode) endErase(); else endPaint();
}

function startPaint(e) {
    if (!isDrawMode || isEraserMode) return;    isPainting = true;
    // Réinitialiser le lissage pour ce nouveau trait
    const startPos = getPos(e);
    _smoothPts  = [startPos];
    _smoothLast = startPos;
    const _isHighlight = (currentDrawMode === 'highlight');
    currentStroke = {
        points: [getPos(e)],
        color: (window._drawColor || cpickGetValue('draw-color') || document.querySelector('#cpick-draw-color .cpick-swatch')?.style?.background || '#e84393'),
        size: parseInt(document.getElementById('draw-size').value),
        opacity: (window._drawOpacity !== undefined ? window._drawOpacity : 1.0)
    };
    if (_isHighlight) currentStroke.highlight = true;
    if (currentDrawMode === 'shape' || window._drawShapeRecog) _lastStrokePoints = [...currentStroke.points];
    if (FIGURE_MODES.includes(currentDrawMode)) {
        _figureStart = getPos(e); _figureEnd = null;
        _segmentStart = _figureStart; // compat
        const onDocUp = (ev) => {
            document.removeEventListener('mouseup', onDocUp);
            _figureEnd = getPos(ev); _segmentEnd = _figureEnd;
            endPaint();
        };
        document.addEventListener('mouseup', onDocUp);
    }
    if (currentDrawMode === 'text') clearTimeout(_hwRecogTimer);

    // Pointer capture sur le board pour ne manquer aucun pointermove (stylet)
    // uniquement si l'événement est un PointerEvent (pas un TouchEvent ou MouseEvent)
    if (e.pointerId !== undefined && !FIGURE_MODES.includes(currentDrawMode) && board.setPointerCapture) {
        try { board.setPointerCapture(e.pointerId); } catch(_) {}
    }
}

// RAF throttle pour paint() — on accumule les points entre deux frames
var _paintRafId = null;
var _paintPendingPos = null;

// SMOOTH_ALPHA : lissage IIR léger sur la position du stylet (anti-jitter)
// Valeur par défaut 1.0 = quasi brut (∿10). Ajustable dans la toolbar.
var SMOOTH_ALPHA = 1.0;
var _smoothPts   = [];
var _smoothLast  = null;

function paint(e) {
    if (!isPainting || !isDrawMode || isEraserMode || !currentStroke) return;
    if (FIGURE_MODES.includes(currentDrawMode)) {
        if (!_figureStart) return;
        const cur = getPos(e);
        _paintPendingPos = cur;
        if (_paintRafId) return;
        _paintRafId = requestAnimationFrame(() => {
            _paintRafId = null;
            if (!_paintPendingPos || !currentStroke) return;
            const pos = _paintPendingPos; _paintPendingPos = null;
            const pts = _buildFigurePoints(currentDrawMode, _figureStart, pos);
            if (currentDrawMode === 'cercle' && pts) {
                const crossPts = _buildCrossPoints(_figureStart, currentStroke.size);
                redrawStrokes({ ...currentStroke, points: pts, _figure: true }, { ...currentStroke, points: crossPts, _figure: true });
            } else if (pts) {
                redrawStrokes({ ...currentStroke, points: pts, _figure: true });
            } else if (['heart','star','arrow'].includes(currentDrawMode) && _figureStart) {
                const A = _figureStart;
                const bboxPts = [
                    { x: Math.min(A.x,pos.x), y: Math.min(A.y,pos.y) },
                    { x: Math.max(A.x,pos.x), y: Math.min(A.y,pos.y) },
                    { x: Math.max(A.x,pos.x), y: Math.max(A.y,pos.y) },
                    { x: Math.min(A.x,pos.x), y: Math.max(A.y,pos.y) },
                    { x: Math.min(A.x,pos.x), y: Math.min(A.y,pos.y) },
                ];
                redrawStrokes({ ...currentStroke, points: bboxPts, _dashed: true });
            }
        });
        return;
    }
    const rawPos = getPos(e);

    // Filtre IIR léger (anti-jitter stylet)
    const smoothed = {
        x: _smoothLast.x + SMOOTH_ALPHA * (rawPos.x - _smoothLast.x),
        y: _smoothLast.y + SMOOTH_ALPHA * (rawPos.y - _smoothLast.y)
    };
    _smoothLast = smoothed;
    _smoothPts.push(smoothed);
    currentStroke.points.push(rawPos);
    if (currentDrawMode === 'shape' || window._drawShapeRecog) _lastStrokePoints = [...currentStroke.points];

    // Dessin incrémental simple (lineTo) — aucune latence, trait visible immédiatement
    // Le rendu Bézier s'applique uniquement à la sauvegarde finale (drawStroke)
    const n = _smoothPts.length;
    if (n < 2 || !drawCtx) return;
    const prev = _smoothPts[n - 2];
    const cur2 = _smoothPts[n - 1];

    if (currentDrawMode === 'highlight') {
        if (!drawCtxTop) return;
        drawCtxTop.clearRect(0, 0, drawCanvasTop.width, drawCanvasTop.height);
        if (_smoothPts.length < 2) return;
        _drawHighlightPath(drawCtxTop, _smoothPts, Math.max(currentStroke.size * 6, 24), currentStroke.color);
    } else {
        drawCtx.save();
        drawCtx.beginPath();
        drawCtx.lineCap  = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.strokeStyle = currentStroke.color;
        drawCtx.lineWidth   = currentStroke.size;
        drawCtx.globalAlpha = (currentStroke.opacity !== undefined ? currentStroke.opacity : 1.0);
        drawCtx.moveTo(prev.x, prev.y);
        drawCtx.lineTo(cur2.x, cur2.y);
        drawCtx.stroke();
        drawCtx.restore();
    }
}

function endPaint() {
    if (!isPainting || !currentStroke) return;
    isPainting = false;
    // Annuler tout RAF en attente
    if (_paintRafId) { cancelAnimationFrame(_paintRafId); _paintRafId = null; }
    _paintPendingPos = null;
    // Vider l'overlay surligneur (drawCtxTop) si utilisé pendant le dessin
    if (currentStroke.highlight && drawCtxTop && drawCanvasTop) {
        drawCtxTop.clearRect(0, 0, drawCanvasTop.width, drawCanvasTop.height);
    }
    // Remplacer les points bruts par les points lissés pour que le trait final soit propre
    if (_smoothPts.length >= 2 && !FIGURE_MODES.includes(currentDrawMode)) {
        currentStroke.points = [..._smoothPts];
    }
    _smoothPts  = [];
    _smoothLast = null;
    if (FIGURE_MODES.includes(currentDrawMode) && _figureStart) {
        const endPt = _figureEnd || _figureStart;

        // Formes complexes (cœur, étoile, flèche) : créer directement le widget depuis la bbox A→B
        if (['heart','star','arrow'].includes(currentDrawMode)) {
            const A = { ..._figureStart }, B = { ...endPt };
            const strokeSize = currentStroke.size;
            const strokeColor = currentStroke.color;
            _figureStart = null; _figureEnd = null; _segmentStart = null; _segmentEnd = null;
            currentStroke = null;
            const minX = Math.min(A.x, B.x), minY = Math.min(A.y, B.y);
            const bw = Math.max(20, Math.abs(B.x - A.x));
            const bh = Math.max(20, Math.abs(B.y - A.y));
            const fill = _getFigFillOpts();
            const fillColor   = fill.enabled ? fill.color  : 'none';
            const fillOpacity = fill.enabled ? fill.opacity : 0;
            const w = createShapeWidget(currentDrawMode, strokeColor, fillColor, fillOpacity,
                bw, bh, minX+'px', minY+'px', false, strokeSize);
            if (w) { const wrap = w.querySelector('.shape-svg-wrap'); if (wrap) wrap.classList.add('no-pad'); }
            const cur = buildBoardJSON();
            if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack=[]; updateUndoRedoBtns(); }
            saveBoard(true);
            redrawStrokes();
            return;
        }
        const pts   = _buildFigurePoints(currentDrawMode, _figureStart, endPt);
        const center = { ..._figureStart };
        const strokeSize = currentStroke.size;
        _figureStart = null; _figureEnd = null; _segmentStart = null; _segmentEnd = null;
        if (pts && pts.length >= 2) {
            if (['cercle','carre','rectangle','losange','triangle','right-triangle',
                 'equilateral-triangle','scalene-triangle','parallelo',
                 'pentagon','hexagon','octagon','ovale'].includes(currentDrawMode)) {
                // Figures fermées → widget redimensionnable avec fond éventuel
                const fill = _getFigFillOpts();
                const strokeColor = currentStroke.color;
                // Bounding box des points pour positionner/dimensionner le widget
                let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
                pts.forEach(p=>{if(p.x<minX)minX=p.x;if(p.y<minY)minY=p.y;if(p.x>maxX)maxX=p.x;if(p.y>maxY)maxY=p.y;});
                // Expand bbox by sw/2 on each side so the widget matches the preview
                // (stroke is centered on the path, so half overflows outside the point coords)
                const _swHalf = strokeSize / 2;
                minX -= _swHalf; minY -= _swHalf; maxX += _swHalf; maxY += _swHalf;
                const bw = Math.max(4, maxX - minX);
                const bh = Math.max(4, maxY - minY);
                const modeToShape = {
                    'cercle':'circle','carre':'square','rectangle':'rectangle','losange':'diamond',
                    'triangle':'triangle','right-triangle':'right-triangle',
                    'equilateral-triangle':'equilateral-triangle','scalene-triangle':'scalene-triangle',
                    'parallelo':'parallelogram','pentagon':'pentagon','hexagon':'hexagon',
                    'octagon':'octagon','ovale':'ellipse',
                    'heart':'heart','star':'star','arrow':'arrow'
                };
                const shapeId = modeToShape[currentDrawMode] || currentDrawMode;
                const fillColor   = fill.enabled ? fill.color  : 'none';
                const fillOpacity = fill.enabled ? fill.opacity : 0;
                const w = createShapeWidget(shapeId, strokeColor, fillColor, fillOpacity,
                    bw, bh, minX+'px', minY+'px', false, strokeSize);
                // Supprimer le padding du shape-svg-wrap pour que le SVG
                // se positionne exactement là où la figure a été dessinée
                if (w) {
                    const wrap = w.querySelector('.shape-svg-wrap');
                    if (wrap) wrap.classList.add('no-pad');
                }
                const cur = buildBoardJSON();
                if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack=[]; updateUndoRedoBtns(); }
                saveBoard(true);
            } else {
                // Figures non fermées (segment) → stroke canvas classique
                strokes.push({ ...currentStroke, points: pts, _figure: true });
                const cur = buildBoardJSON();
                if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack=[]; updateUndoRedoBtns(); }
                saveBoard(true);
            }
        }
        currentStroke = null; redrawStrokes();
        return;
    }
    // Tap stylet = point unique ou micro-mouvement parasite → enregistrer comme dot (cercle plein)
    // On considère comme un dot tout geste dont tous les points restent dans un rayon de 4px
    // autour du premier point. Cela évite qu'un mousemove fantôme empêche le point de s'afficher.
    (function() {
        const pts = currentStroke.points;
        if (pts.length >= 1) {
            const origin = pts[0];
            const isDot = pts.every(p => Math.hypot(p.x - origin.x, p.y - origin.y) <= 4);
            if (isDot) {
                currentStroke.dot = true;
                currentStroke.points = [origin, { ...origin }]; // besoin d'au moins 2 pts pour le stockage
            }
        }
    })();
    if (currentStroke.points.length > 1) {
        if (currentDrawMode === 'shape') {
            currentStroke = null;
            redrawStrokes();
            recognizeAndReplaceShape({ points: _lastStrokePoints, color: (cpickGetValue('draw-color') || '#e84393'), size: parseInt(document.getElementById('draw-size').value) });
            _lastStrokePoints = null;
            return;
        }
        // Reconnaissance de forme automatique (mode libre uniquement)
        if (window._drawShapeRecog && currentDrawMode === 'free' && _lastStrokePoints && _lastStrokePoints.length > 3) {
            const _recogStroke = { points: _lastStrokePoints, color: currentStroke.color, size: currentStroke.size };
            currentStroke = null;
            _lastStrokePoints = null;
            redrawStrokes();
            recognizeAndReplaceShape(_recogStroke);
            return;
        }
        strokes.push(currentStroke);
        const cur = buildBoardJSON();
        if (cur) {
            undoStack.push(cur);
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            redoStack = [];
            updateUndoRedoBtns();
        }
        saveBoard(true);
    }
    currentStroke = null; redrawStrokes();
}

var _lastStrokePoints = null;
var _segmentStart = null;  // conservé pour compat (alias _figureStart pour mode segment)
var _segmentEnd   = null;  // conservé pour compat
var _figureStart  = null;  // point de départ pour tous les modes figure
var _figureEnd    = null;  // point de relâchement

const FIGURE_MODES = ['segment','simple-arrow','carre','rectangle','cercle','ovale','parallelo','losange','triangle','right-triangle','equilateral-triangle','scalene-triangle','pentagon','hexagon','octagon','heart','star','arrow'];

// Construit les points d'une petite croix centrée sur un point (pour le centre du cercle)
function _buildCrossPoints(center, strokeSize) {
    const arm = Math.max(6, strokeSize * 2.5);
    return [
        { x: center.x - arm, y: center.y },
        { x: center.x + arm, y: center.y },
        { x: center.x,       y: center.y }, // retour au centre
        { x: center.x,       y: center.y - arm },
        { x: center.x,       y: center.y + arm }
    ];
}

// Construit les points d'une figure géométrique entre deux points (drag)
function _buildFigurePoints(mode, A, B) {
    const dx = B.x - A.x, dy = B.y - A.y;
    if (Math.hypot(dx, dy) < 3) return null;

    if (mode === 'segment') {
        return [A, B];
    }

    if (mode === 'simple-arrow') {
        // Segment de A vers B avec pointe de flèche ouverte en B
        const len = Math.hypot(dx, dy);
        const arrowLen = Math.max(12, Math.min(len * 0.3, 40)); // longueur des branches
        const arrowAngle = Math.PI / 6; // 30°
        const angle = Math.atan2(dy, dx); // direction du segment
        // Les deux branches de la pointe
        const p1 = {
            x: B.x - arrowLen * Math.cos(angle - arrowAngle),
            y: B.y - arrowLen * Math.sin(angle - arrowAngle)
        };
        const p2 = {
            x: B.x - arrowLen * Math.cos(angle + arrowAngle),
            y: B.y - arrowLen * Math.sin(angle + arrowAngle)
        };
        // Tracé : A → B (segment), puis retour pour la pointe p1 → B → p2
        return [A, B, p1, B, p2];
    }

    if (mode === 'rectangle') {
        // A = sommet haut-gauche, B = sommet bas-droit
        return [
            { x: A.x, y: A.y }, { x: B.x, y: A.y },
            { x: B.x, y: B.y }, { x: A.x, y: B.y },
            { x: A.x, y: A.y }
        ];
    }

    if (mode === 'carre') {
        // Côté = min(|dx|, |dy|), conserve le signe du drag
        const side = Math.min(Math.abs(dx), Math.abs(dy));
        const sx = Math.sign(dx) * side, sy = Math.sign(dy) * side;
        return [
            { x: A.x,      y: A.y      },
            { x: A.x + sx, y: A.y      },
            { x: A.x + sx, y: A.y + sy },
            { x: A.x,      y: A.y + sy },
            { x: A.x,      y: A.y      }
        ];
    }

    if (mode === 'cercle') {
        // A = centre, rayon = distance A→B
        const r = Math.hypot(dx, dy);
        const steps = Math.max(60, Math.round(2 * Math.PI * r / 3));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 2 * Math.PI;
            pts.push({ x: A.x + Math.cos(a) * r, y: A.y + Math.sin(a) * r });
        }
        return pts;
    }

    if (mode === 'ovale') {
        // A = coin haut-gauche, B = coin bas-droit → ellipse inscrite
        const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
        const rx = Math.abs(dx) / 2, ry = Math.abs(dy) / 2;
        const steps = Math.max(60, Math.round(2 * Math.PI * Math.max(rx, ry) / 3));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 2 * Math.PI;
            pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
        }
        return pts;
    }

    if (mode === 'parallelo') {
        const w = dx, h = dy;
        // Le shear est toujours positif dans le sens du drag (abs),
        // le côté haut est décalé vers la droite, le côté bas vers la gauche
        const shear = Math.abs(w) * 0.25 * Math.sign(w);
        return [
            { x: A.x + shear,      y: A.y     },
            { x: A.x + w,          y: A.y     },
            { x: A.x + w - shear,  y: A.y + h },
            { x: A.x,              y: A.y + h },
            { x: A.x + shear,      y: A.y     }
        ];
    }

    if (mode === 'losange') {
        // Centre = milieu de A→B, demi-diagonales = dx/2 et dy/2
        const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
        return [
            { x: cx,      y: A.y  },  // sommet haut
            { x: B.x,     y: cy   },  // sommet droite
            { x: cx,      y: B.y  },  // sommet bas
            { x: A.x,     y: cy   },  // sommet gauche
            { x: cx,      y: A.y  }   // fermeture
        ];
    }

    if (mode === 'triangle') {
        // Triangle isocèle : A = sommet haut-centre, B = coin bas-droit
        const cx = (A.x + B.x) / 2;
        return [
            { x: cx,   y: A.y },
            { x: B.x,  y: B.y },
            { x: A.x,  y: B.y },
            { x: cx,   y: A.y }
        ];
    }

    if (mode === 'right-triangle') {
        // Triangle rectangle : angle droit en A
        return [
            { x: A.x, y: A.y },
            { x: B.x, y: B.y },
            { x: A.x, y: B.y },
            { x: A.x, y: A.y }
        ];
    }

    if (mode === 'equilateral-triangle') {
        // Triangle équilatéral : A = sommet haut-centre, largeur = |dx|
        const side = Math.abs(dx);
        const h3 = side * Math.sqrt(3) / 2 * Math.sign(dy || 1);
        const cx = (A.x + B.x) / 2;
        return [
            { x: cx,            y: A.y      },
            { x: cx + side / 2, y: A.y + h3 },
            { x: cx - side / 2, y: A.y + h3 },
            { x: cx,            y: A.y      }
        ];
    }

    if (mode === 'scalene-triangle') {
        // Triangle quelconque : 3 sommets à positions distinctes
        return [
            { x: A.x + dx * 0.15, y: B.y },
            { x: A.x + dx * 0.72, y: A.y },
            { x: B.x,             y: B.y },
            { x: A.x + dx * 0.15, y: B.y }
        ];
    }

    if (mode === 'pentagon' || mode === 'hexagon' || mode === 'octagon') {
        const n = mode === 'pentagon' ? 5 : mode === 'hexagon' ? 6 : 8;
        const cx = A.x, cy = A.y;
        const rx = Math.abs(dx), ry = Math.abs(dy);
        const pts = [];
        for (let i = 0; i <= n; i++) {
            const a = (2 * Math.PI / n) * i - Math.PI / 2;
            pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
        }
        return pts;
    }

    return null;
}

// =========================================================================
// FOND COLORÉ DES FIGURES — helpers
// =========================================================================

// Active/désactive le slider d'opacité selon l'état de la checkbox
function figFillToggle() {
    const enabled = document.getElementById('fig-fill-enabled')?.checked;
    const row     = document.getElementById('fig-fill-opacity-row');
    const swatch  = document.getElementById('fig-fill-swatch');
    if (row)    row.style.display    = enabled ? 'flex' : 'none';
    if (swatch) swatch.style.opacity = enabled ? '1'   : '0.4';
    // Forcer la valeur du slider après affichage (corrige le bug de rendu
    // sur les sliders qui étaient dans un display:none au chargement)
    if (enabled && row) {
        const slider = document.getElementById('fig-fill-opacity');
        const label  = document.getElementById('fig-fill-opacity-val');
        if (slider) {
            // Forcer à 100 si jamais initialisé (attribut value HTML pas encore appliqué)
            if (!slider._initialized) {
                slider.value = 100;
                slider._initialized = true;
                if (label) label.textContent = '100%';
            } else {
                // Réassigner pour forcer le navigateur à repositionner le curseur
                slider.value = slider.value;
            }
        }
    }
}

// Retourne { enabled, color, opacity } depuis les contrôles du sous-menu
function _getFigFillOpts() {
    const enabled = document.getElementById('fig-fill-enabled')?.checked ?? false;
    const color   = (typeof cpickGetValue === 'function' ? cpickGetValue('fig-fill-color') : null)
                    || document.querySelector('#cpick-fig-fill-color .cpick-swatch')?.style?.background
                    || '#ffffff';
    const opacity = enabled
        ? (parseInt(document.getElementById('fig-fill-opacity')?.value ?? 100) / 100)
        : 0;
    return { enabled, color, opacity };
}


var _hwRecogTimer = null;
var _hwPendingStrokes = []; // traits en attente de reconnaissance
var _hwRecognizedText = '';
var _hwBBox = null; // bounding box des traits manuscrits en cours

function scheduleHandwritingRecognition() {
    clearTimeout(_hwRecogTimer);
    _hwRecogTimer = setTimeout(() => {
        triggerHandwritingRecognition();
    }, 2000);
}

function cancelHandwritingRecognition() {
    clearTimeout(_hwRecogTimer);
    // Nettoyer le panneau preview si visible
    const preview = document.getElementById('handwriting-preview');
    if (preview) { preview.style.display = 'none'; preview._positioned = false; }
}

function triggerHandwritingRecognition() {
    // Collecter tous les traits textMode
    const hwStrokes = strokes.filter(s => s.textMode);
    if (hwStrokes.length === 0) return;

    // Calculer la bounding box globale
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    hwStrokes.forEach(s => s.points.forEach(p => {
        if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y;
        if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y;
    }));
    const pad = 20;
    minX = Math.max(0, minX-pad); minY = Math.max(0, minY-pad);
    maxX = Math.min(drawCanvas.width,  maxX+pad);
    maxY = Math.min(drawCanvas.height, maxY+pad);
    _hwBBox = { x: minX, y: minY, w: maxX-minX, h: maxY-minY };

    // Afficher le panneau avec état de chargement
    showHandwritingPreview('', true, minX, minY, maxX-minX, maxY-minY);

    // OCR avec Tesseract.js (traitement local, pas d'API externe)
    callAnthropicOCR(null).then(text => {
        _hwRecognizedText = text && text.trim() ? text : '?';
        showHandwritingPreview(_hwRecognizedText, false, minX, minY, maxX-minX, maxY-minY);
    }).catch(err => {
        console.error('OCR error:', err);
        showHandwritingPreview('⚠️ ' + (err.message || 'Erreur'), false, minX, minY, maxX-minX, maxY-minY);
    });
}

// =========================================================================
// MYSCRIPT iink — Reconnaissance d'écriture manuscrite
// =========================================================================

function saveMyScriptKeys() {
    const appKey  = (document.getElementById('hw-appkey-input')?.value  || '').trim();
    const hmacKey = (document.getElementById('hw-hmackey-input')?.value || '').trim();
    localStorage.setItem('ms_app_key',  appKey);
    localStorage.setItem('ms_hmac_key', hmacKey);
    const status = document.getElementById('hw-apikey-status');
    if (status) {
        const ok = appKey.length > 8 && hmacKey.length > 8;
        status.textContent = ok ? '✓' : '●';
        status.style.color  = ok ? '#4caf50' : '#888';
    }
}

function getMyScriptKeys() {
    return {
        appKey:  localStorage.getItem('ms_app_key')  || '',
        hmacKey: localStorage.getItem('ms_hmac_key') || ''
    };
}

// Remplir les champs au chargement
window.addEventListener('load', () => {
    const { appKey, hmacKey } = getMyScriptKeys();
    const ai = document.getElementById('hw-appkey-input');
    const hi = document.getElementById('hw-hmackey-input');
    if (ai && appKey)  { ai.value  = appKey; }
    if (hi && hmacKey) { hi.value = hmacKey; }
    if (appKey || hmacKey) saveMyScriptKeys();
});

// Calcul HMAC-SHA512 pour l'authentification MyScript
async function computeHmac(appKey, hmacKey, body) {
    const enc = new TextEncoder();
    const keyData = enc.encode(appKey + hmacKey);
    const msgData = enc.encode(body);
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convertir nos strokes en format MyScript iink (JIIX)
function buildMyScriptStrokePayload() {
    const hwStrokes = strokes.filter(s => s.textMode);
    const minX = _hwBBox ? _hwBBox.x : 0;
    const minY = _hwBBox ? _hwBBox.y : 0;

    const strokeList = hwStrokes.map((s, idx) => {
        const xs = s.points.map(p => Math.round(p.x - minX));
        const ys = s.points.map(p => Math.round(p.y - minY));
        // Timestamps artificiels espacés de 20ms par point
        const ts = s.points.map((_, i) => idx * 1000 + i * 20);
        return { x: xs, y: ys, t: ts };
    });

    const w = _hwBBox ? Math.ceil(_hwBBox.w) : 800;
    const h = _hwBBox ? Math.ceil(_hwBBox.h) : 400;

    return {
        configuration: {
            lang: 'fr_FR',
            export: { 'image-resolution': 96 }
        },
        contentType: 'Text',
        conversionState: 'DIGITAL_EDIT',
        height: h,
        width: w,
        strokeGroups: [{ strokes: strokeList }]
    };
}

async function callAnthropicOCR(_unused) {
    // Lire les clés depuis les champs EN PRIORITÉ, puis depuis localStorage
    const appKeyInput  = (document.getElementById('hw-appkey-input')?.value  || '').trim();
    const hmacKeyInput = (document.getElementById('hw-hmackey-input')?.value || '').trim();
    const appKey  = appKeyInput  || localStorage.getItem('ms_app_key')  || '';
    const hmacKey = hmacKeyInput || localStorage.getItem('ms_hmac_key') || '';

    if (!appKey || !hmacKey) {
        throw new Error('Clés MyScript manquantes — saisissez-les dans le panneau (mode ✍️ Écriture)');
    }

    // Sauvegarder si pas encore fait
    if (appKey)  localStorage.setItem('ms_app_key',  appKey);
    if (hmacKey) localStorage.setItem('ms_hmac_key', hmacKey);

    const payload = buildMyScriptStrokePayload();
    const bodyStr = JSON.stringify(payload);
    const hmac = await computeHmac(appKey, hmacKey, bodyStr);

    const resp = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json,application/vnd.myscript.jiix',
            'applicationKey': appKey,
            'hmac': hmac
        },
        body: bodyStr
    });

    if (!resp.ok) {
        const txt = await resp.text().catch(() => resp.status);
        throw new Error('MyScript API: ' + txt);
    }

    const result = await resp.json();
    const text = result?.label || result?.exports?.['text/plain'] || '';
    return text.trim() || '?';
}

function showHandwritingPreview(text, loading, bx, by, bw, bh) {
    const preview = document.getElementById('handwriting-preview');
    const textEl  = document.getElementById('handwriting-recognized-text');
    const loadEl  = document.getElementById('handwriting-loading');
    const convertBtn = document.getElementById('handwriting-convert-btn');

    if (loading) {
        textEl.textContent = '';
        loadEl.style.display = 'block';
        if (convertBtn) convertBtn.style.display = 'none';
    } else {
        textEl.textContent = text;
        loadEl.style.display = 'none';
        if (convertBtn) convertBtn.style.display = 'inline-block';
    }

    // Positionner le panneau au-dessus de la zone dessinée (seulement à la 1ère fois)
    if (preview.style.display === 'none' || !preview._positioned) {
        const boardRect = board.getBoundingClientRect();
        const panelX = boardRect.left + bx;
        const panelY = boardRect.top  + by;
        const maxLeft = window.innerWidth - 540;
        const maxTop  = window.innerHeight - 220;
        preview.style.left = Math.max(10, Math.min(panelX, maxLeft)) + 'px';
        preview.style.top  = Math.max(10, Math.min(panelY - 150, maxTop)) + 'px';
        preview._positioned = true;
    }
    preview.style.display = 'block';

    // Init drag si pas encore fait
    if (!preview._dragInited) {
        preview._dragInited = true;
        const header = document.getElementById('handwriting-preview-header');
        function startPanelDrag(clientX, clientY) {
            let ox = clientX - preview.offsetLeft;
            let oy = clientY - preview.offsetTop;
            function onMove(ev) {
                preview.style.left = Math.max(0, ev.clientX - ox) + 'px';
                preview.style.top  = Math.max(0, ev.clientY - oy) + 'px';
            }
            function onEnd() {
                header.removeEventListener('pointermove',   onMove);
                header.removeEventListener('pointerup',     onEnd);
                header.removeEventListener('pointercancel', onEnd);
            }
            header.addEventListener('pointermove',   onMove);
            header.addEventListener('pointerup',     onEnd);
            header.addEventListener('pointercancel', onEnd);
        }
        header.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            header.setPointerCapture(e.pointerId);
            startPanelDrag(e.clientX, e.clientY);
        });
    }
}

function convertHandwritingToWidget() {
    // Lire le texte potentiellement édité par l'utilisateur dans le panneau
    const editedEl = document.getElementById('handwriting-recognized-text');
    if (editedEl) _hwRecognizedText = editedEl.textContent.trim();
    if (!_hwRecognizedText || !_hwBBox) return;

    const preview = document.getElementById('handwriting-preview');
    if (preview) { preview.style.display = 'none'; preview._positioned = false; }

    // Créer un widget texte à l'emplacement du dessin
    snapshotNow();
    const widget = createWidget('text', _hwBBox.x + 'px', _hwBBox.y + 'px', false);
    const editor = widget.querySelector('.editor-content');
    if (editor) {
        editor.style.fontFamily = "'BelleAllureGS', cursive";
        editor.style.fontSize   = '52px';
        editor.innerHTML = `<span style="font-family:'BelleAllureGS', cursive;font-size:52px;">${_hwRecognizedText.replace(/\n/g, '<br>')}</span>`;
    }

    // Supprimer les traits manuscrits du canvas
    strokes = strokes.filter(s => !s.textMode);
    redrawStrokes();

    // Snapshot final avec le widget texte
    const cur = buildBoardJSON();
    if (cur) {
        undoStack.push(cur);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack = [];
        updateUndoRedoBtns();
        localStorage.setItem('profBoardConfig', cur);
    }

    _hwRecognizedText = '';
    _hwBBox = null;
}

function discardHandwriting() {
    const preview = document.getElementById('handwriting-preview');
    if (preview) { preview.style.display = 'none'; preview._positioned = false; }
    _hwRecognizedText = '';
    _hwBBox = null;
    // Garder les traits tels quels
}

function redrawStrokes(extra = null, extra2 = null) {
    if (!drawCtx) return;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    if (drawCtxTop) drawCtxTop.clearRect(0, 0, drawCanvasTop.width, drawCanvasTop.height);

    strokes.forEach(s => {
        const ctx = (s.pinned && drawCtxTop) ? drawCtxTop : drawCtx;
        drawStroke(s, false, ctx);
    });
    if (extra) drawStroke(extra, false, drawCtx);
    if (extra2) drawStroke(extra2, false, drawCtx);
    selectedStrokes.forEach(s => {
        const ctx = (s.pinned && drawCtxTop) ? drawCtxTop : drawCtx;
        drawStroke(s, true, ctx);
    });
}

/**
 * Rescale tous les strokes quand le fond PDF change d'échelle ou de position.
 * Appelée depuis background.js via window.rescaleStrokesForPdfBg().
 *
 * Paramètres : état AVANT et APRÈS le changement
 *   oldW/newW   : largeur du fond en % du board (ex: 100, 80)
 *   oldPosX/Y   : position background-position en % (ex: 50, 0)
 *   newPosX/Y   : nouvelle position
 *   bgRatio     : hauteur/largeur native de l'image (ex: 1.414 pour A4)
 */
window.rescaleStrokesForPdfBg = function(oldW, newW, oldPosX, oldPosY, newPosX, newPosY, bgRatio) {
    if (!board) return;
    const boardW = board.offsetWidth;
    const boardH = board.offsetHeight;

    // Zone du fond AVANT (en px canvas)
    const oldImgW = boardW * oldW / 100;
    const oldImgH = oldImgW * bgRatio;
    const oldOffX = (boardW - oldImgW) * (oldPosX / 100);
    const oldOffY = (boardH - oldImgH) * (oldPosY / 100);

    // Zone du fond APRÈS (en px canvas)
    const newImgW = boardW * newW / 100;
    const newImgH = newImgW * bgRatio;
    const newOffX = (boardW - newImgW) * (newPosX / 100);
    const newOffY = (boardH - newImgH) * (newPosY / 100);

    // Transforme un point : board coords → fond relatif → nouvelles board coords
    function transformPt(p) {
        // 1. Coordonnées relatives au fond (0-1)
        const rx = (p.x - oldOffX) / oldImgW;
        const ry = (p.y - oldOffY) / oldImgH;
        // 2. Nouvelles coordonnées board
        return {
            x: rx * newImgW + newOffX,
            y: ry * newImgH + newOffY
        };
    }

    strokes.forEach(s => {
        if (s.points) {
            s.points = s.points.map(transformPt);
        }
        // Stroke texte ancré
        if (s.type === 'text') {
            const np = transformPt({ x: s.x, y: s.y });
            s.x = np.x;
            s.y = np.y;
            // Rescaler la taille de police proportionnellement
            s.size = s.size * (newImgW / oldImgW);
            // Mettre à jour points[] factices aussi
            if (s.points) s.points = s.points.map(transformPt);
        }
    });

    // Rescaler aussi les shape-widgets (cercles, rectangles, triangles…)
    // qui sont des éléments DOM positionnés en px dans le board
    document.querySelectorAll('.shape-widget').forEach(w => {
        const wLeft   = parseFloat(w.style.left);
        const wTop    = parseFloat(w.style.top);
        // Lire les dimensions depuis le SVG interne (source de vérité pour les shape-widgets)
        const svg     = w.querySelector('svg');
        const svgW    = svg ? parseFloat(svg.getAttribute('width'))  : 0;
        const svgH    = svg ? parseFloat(svg.getAttribute('height')) : 0;
        const wWidth  = svgW || parseFloat(w.style.width)  || w.offsetWidth;
        const wHeight = svgH || parseFloat(w.style.height) || w.offsetHeight;
        if (isNaN(wLeft) || isNaN(wTop) || !wWidth || !wHeight) return;

        // Transformer le coin haut-gauche et le coin bas-droit
        const np  = transformPt({ x: wLeft,          y: wTop });
        const nbr = transformPt({ x: wLeft + wWidth,  y: wTop + wHeight });
        const newW = nbr.x - np.x;
        const newH = nbr.y - np.y;

        // Mettre à jour la position CSS
        w.style.left = np.x + 'px';
        w.style.top  = np.y + 'px';

        // Mettre à jour le SVG (source de vérité pour la taille visuelle)
        if (svg) {
            svg.setAttribute('width',   newW);
            svg.setAttribute('height',  newH);
            svg.setAttribute('viewBox', `0 0 ${newW} ${newH}`);
            // Reconstruire le contenu SVG si buildShapeSVG est disponible
            if (typeof buildShapeSVG === 'function') {
                const shapeId = w.dataset.shapeType;
                const sc = w.dataset.strokeColor;
                const fc = w.dataset.fillColor;
                const fo = parseFloat(w.dataset.fillOpacity) || 0;
                const sw = parseInt(w.dataset.strokeWidth)   || 4;
                svg.innerHTML = buildShapeSVG(shapeId, newW, newH, sc, fc, fo, sw);
            }
        }

        // Mettre à jour les data-percent pour la cohérence
        const curW  = board.offsetWidth;
        const curVH = board.offsetHeight;
        w.dataset.wPercent = (newW / curW)  * 100;
        w.dataset.hPercent = (newH / curVH) * 100;
        w.dataset.leftPercent = (np.x / curW)  * 100;
        w.dataset.topPercent  = (np.y / curVH) * 100;
    });

    redrawStrokes();
};


// Dessine le surligneur : stroke épais butt, en ignorant les points parasites
// du début et de la fin (micro-mouvements avant/après la direction principale).
function _drawHighlightPath(ctx, pts, lw, color) {
    if (pts.length < 2) return;
    const half = lw / 2;

    // Trouver le premier point où le déplacement cumulé dépasse un demi-rayon
    // → on "saute" les micro-mouvements initiaux parasites
    function skipStart(pts, threshold) {
        let cum = 0;
        for (let i = 1; i < pts.length; i++) {
            cum += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
            if (cum >= threshold) return i - 1; // on commence un segment avant
        }
        return 0;
    }
    function skipEnd(pts, threshold) {
        let cum = 0;
        for (let i = pts.length - 2; i >= 0; i--) {
            cum += Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
            if (cum >= threshold) return i + 1;
        }
        return pts.length - 1;
    }

    const threshold = half * 0.5; // seuil = quart de l'épaisseur
    const si = skipStart(pts, threshold);
    const ei = skipEnd(pts, threshold);

    // Ancrer le début sur le premier point brut (position exacte du clic),
    // mais orienter la coupe selon la direction du segment stable
    const startPt = pts[0];
    const endPt   = pts[pts.length - 1];
    const stablePts = [startPt, ...pts.slice(si + 1, ei), endPt];

    ctx.save();
    ctx.beginPath();
    ctx.lineCap  = 'butt';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth   = lw;
    ctx.globalAlpha = 0.4;
    ctx.globalCompositeOperation = 'multiply';
    ctx.moveTo(stablePts[0].x, stablePts[0].y);
    for (let i = 1; i < stablePts.length; i++) {
        ctx.lineTo(stablePts[i].x, stablePts[i].y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawStroke(stroke, highlight = false, ctx = drawCtx) {
    // Stroke texte ancré (créé depuis un widget texte)
    if (stroke.type === 'text') {
        ctx.save();
        ctx.font = `${stroke.size}px ${stroke.fontFamily || "'Segoe UI', sans-serif"}`;
        ctx.fillStyle = highlight ? '#4a90e2' : stroke.color;
        ctx.textBaseline = 'top';
        const lines = (stroke.text || '').split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, stroke.x, stroke.y + i * stroke.size * 1.3);
        });
        ctx.restore();
        return;
    }
    if (!stroke.points || stroke.points.length < 2) return;
    // Tap unique → cercle plein
    if (stroke.dot) {
        const p = stroke.points[0];
        const r = stroke.size / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = highlight ? '#4a90e2' : stroke.color;
        if (stroke.highlight) { ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'multiply'; }
        ctx.fill();
        ctx.restore();
        return;
    }

    // Helper : Bézier quadratique pour les traits libres, lineTo pour les figures (angles droits)
    function bezierPath(pts) {
        ctx.moveTo(pts[0].x, pts[0].y);
        if (stroke._figure || stroke._dashed) {
            // Figures géométriques : segments droits pour garder les angles nets
            pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        } else if (pts.length === 2) {
            ctx.lineTo(pts[1].x, pts[1].y);
        } else {
            for (let i = 1; i < pts.length - 1; i++) {
                // Tension réduite : ancrage à 25% au lieu de 50%
                // → courbes plus fidèles au tracé, moins "surlissées"
                const mx = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.25;
                const my = pts[i].y + (pts[i + 1].y - pts[i].y) * 0.25;
                ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
            }
            ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        }
    }

    // Mode surligneur : trait semi-transparent, effet fluo
    if (stroke.highlight) {
        _drawHighlightPath(ctx, stroke.points, Math.max(stroke.size * 6, 24), stroke.color);
        ctx.restore();
        return;
    }
    ctx.save();
    ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = highlight ? '#4a90e2' : stroke.color;
    ctx.lineWidth   = highlight ? stroke.size + 6 : stroke.size;
    const _strokeAlpha = (stroke.opacity !== undefined ? stroke.opacity : 1.0);
    ctx.globalAlpha = highlight ? 0.5 : _strokeAlpha;
    if (stroke._dashed) { ctx.setLineDash([6, 4]); ctx.globalAlpha = Math.min(_strokeAlpha, 0.5); }
    bezierPath(stroke.points);
    ctx.stroke();
    if (stroke._dashed) ctx.setLineDash([]);
    ctx.restore();
    if (highlight) {
        ctx.save(); ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.size;
        bezierPath(stroke.points);
        ctx.stroke(); ctx.restore();
    }
}

// =========================================================================
// MODES DESSIN
// =========================================================================
var currentDrawMode = 'free'; // 'free' | 'highlight' | 'shape' | 'text'

function setDrawMode(mode) {
    // Si on est en mode annotation PDF et qu'on clique sur le surligneur,
    // on bascule l'outil PDF highlighter au lieu de changer le mode dessin
    if (mode === 'highlight' && typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('highlighter');
        return;
    }
    // En mode annotation PDF, cœur/étoile/flèche créent des widgets sur le board
    // et ne fonctionnent pas sur le canvas PDF → bloquer silencieusement
    if (['heart','star','arrow'].includes(mode) && typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        return;
    }
    // Désactiver la gomme si elle est active
    if (isEraserMode) stopEraserMode();
    // Recliqué sur le mode déjà actif → retour en dessin libre
    // (pas en mode annotation PDF où on reste sur la figure choisie)
    if (mode === currentDrawMode && mode !== 'free'
        && !(typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode && FIGURE_MODES.includes(mode))) {
        mode = 'free';
    }
    currentDrawMode = mode;
    // Bouton dessin libre — styles inline directs pour cohérence
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        if (mode === 'free') {
            freeBtn.style.borderColor = '#4a90e2';
            freeBtn.style.background  = '#1a3550';
            freeBtn.style.color       = '#fff';
            freeBtn.classList.add('btn-mode-active');
        } else {
            freeBtn.style.borderColor = '#444';
            freeBtn.style.background  = '#2a2a2e';
            freeBtn.style.color       = '#aaa';
            freeBtn.classList.remove('btn-mode-active');
        }
    }
    // Bouton surligneur — styles inline directs pour cohérence
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        if (mode === 'highlight') {
            hlBtn.style.borderColor = '#f5c518';
            hlBtn.style.background  = '#2a2200';
            hlBtn.style.color       = '#f5c518';
            hlBtn.classList.add('btn-mode-active');
        } else {
            hlBtn.style.borderColor = '#444';
            hlBtn.style.background  = '#2a2a2e';
            hlBtn.style.color       = '#aaa';
            hlBtn.classList.remove('btn-mode-active');
        }
    }    // Fermer le sous-menu figures si on choisit un mode non-figure (sauf si on choisit une figure)
    if (!FIGURE_MODES.includes(mode)) {
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        _setBtnActive('draw-figures-btn', false, 'figures');
    }
    // Boutons de modes figure
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (!btn) return;
        if (m === mode) {
            btn.style.borderColor = '#4a90e2';
            btn.style.background  = '#1a3550';
            btn.style.color       = '#fff';
            btn.style.boxShadow   = '0 0 8px rgba(74,144,226,0.7)';
            btn.querySelectorAll('svg *').forEach(el => el.style.setProperty('stroke','#7ab8f5','important'));
        } else {
            btn.style.borderColor = '#444';
            btn.style.background  = '#2a2a2e';
            btn.style.color       = '#aaa';
            btn.style.boxShadow   = 'none';
            btn.querySelectorAll('svg *').forEach(el => el.style.removeProperty('stroke'));
        }
    });
    const shapeOpts = document.getElementById('shape-recog-options');
    const shapeHint = document.getElementById('shape-recog-hint');
    if (mode === 'shape') {
        if (shapeOpts) shapeOpts.style.display = 'flex';
        if (shapeHint) shapeHint.style.display = 'block';
    } else {
        if (shapeOpts) shapeOpts.style.display = 'none';
        if (shapeHint) shapeHint.style.display = 'none';
    }
    // Curseur : figures → curseur SVG partagé, mode libre → curseur point
    // En mode annotation PDF, draw.js gère le curseur — ne pas toucher is-segment-mode
    if (board && !_pdfAnnotMode) {
        if (FIGURE_MODES.includes(mode)) {
            board.classList.add('is-segment-mode');
            const cursorVal = _figureCursorUrl();
            board.style.setProperty('cursor', cursorVal, 'important');
            document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
                w.style.setProperty('cursor', cursorVal, 'important');
            });
        } else {
            board.classList.remove('is-segment-mode');
            board.style.removeProperty('cursor');
            document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
                w.style.removeProperty('cursor');
            });
        }
    }
    // Si on choisit un mode figure alors qu'on était en mode sélection, réactiver le dessin
    if (FIGURE_MODES.includes(mode) && !isDrawMode) {
        isDrawMode = true;
        isPainting = false;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    // Idem pour le mode dessin libre
    if ((mode === 'free' || mode === 'highlight') && !isDrawMode) {
        isDrawMode = true;
        isPainting = false;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    // Appliquer le curseur point si on est en mode libre ou surligneur
    if (mode === 'free' || mode === 'highlight') updateDrawCursor();
    // Fermer la toolbar géométrie (shapes.js) si un mode figure dessin est activé
    if (FIGURE_MODES.includes(mode)) {
        if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    }
    // Désactiver le bouton sélection
    _setBtnActive('draw-select-btn', false);
    // Si mode libre ou surligneur, fermer les deux sous-menus
    if (mode === 'free' || mode === 'highlight') {
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        _setBtnActive('draw-figures-btn', false, 'figures');
        if (typeof closeGeoSubmenu === 'function') closeGeoSubmenu();
    }
    // En mode annotation PDF avec un mode figure : mettre à jour les sous-boutons
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode && FIGURE_MODES.includes(mode)) {
        if (typeof _updatePdfToolBtns === 'function') _updatePdfToolBtns();
    }
}

function activatePencil() {
    _stopBgPanIfActive();
    // En mode annotation PDF : déléguer à setPdfAnnotTool
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('pen');
        return;
    }
    currentDrawMode = 'free';
    _setBtnActive('draw-figures-btn', false, 'figures');
    const figSubA = document.getElementById('figures-submenu');
    if (figSubA) { figSubA.classList.remove('open'); figSubA.style.display = 'none'; }
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; btn.style.boxShadow = 'none'; btn.querySelectorAll('svg *').forEach(el => el.style.removeProperty('stroke')); }
    });
    // Bouton crayon actif
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        freeBtn.style.borderColor = '#4a90e2';
        freeBtn.style.background  = '#1a3550';
        freeBtn.style.color       = '#fff';
        freeBtn.classList.add('btn-mode-active');
    }
    // Bouton surligneur inactif
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        hlBtn.style.borderColor = '#444';
        hlBtn.style.background  = '#2a2a2e';
        hlBtn.style.color       = '#aaa';
        hlBtn.classList.remove('btn-mode-active');
    }
    // Bouton sélection inactif
    _setBtnActive('draw-select-btn', false);
    clearSelection();
    if (isEraserMode) stopEraserMode();
    if (!isDrawMode) {
        isDrawMode = true;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    updateDrawCursor();
}

function activateHighlighter() {
    _stopBgPanIfActive();
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('highlighter');
        return;
    }
    currentDrawMode = 'highlight';
    // Bouton surligneur actif
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        hlBtn.style.borderColor = '#f5c518';
        hlBtn.style.background  = '#2a2200';
        hlBtn.style.color       = '#f5c518';
        hlBtn.classList.add('btn-mode-active');
    }
    // Bouton crayon inactif
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        freeBtn.style.borderColor = '#444';
        freeBtn.style.background  = '#2a2a2e';
        freeBtn.style.color       = '#aaa';
        freeBtn.classList.remove('btn-mode-active');
    }
    // Bouton figures inactif
    _setBtnActive('draw-figures-btn', false, 'figures');
    _setBtnActive('draw-select-btn', false);
    clearSelection();
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    if (isEraserMode) stopEraserMode();
    if (!isDrawMode) {
        isDrawMode = true;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    updateDrawCursor();
}

function toggleDrawToolbar() {
    const tb = document.getElementById('draw-toolbar');
    if (isDrawMode) { stopDrawing(); return; }
    stopEraserMode();
    if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    initCanvas(); enableDrawing();
    setDrawMode('free');
    // Valeurs par défaut à l'ouverture
    const _ds = document.getElementById('draw-size');
    const _dsl = document.getElementById('draw-size-label');
    if (_ds) { _ds.value = 2; if (_dsl) _dsl.textContent = 2; }
    const _es = document.getElementById('eraser-size');
    const _esl = document.getElementById('eraser-size-label');
    if (_es) { _es.value = 15; if (_esl) _esl.textContent = 15; }
    if (tb) {
        tb.classList.remove('horizontal');
        tb.style.width  = '';
        tb.style.bottom = 'auto';
        tb.style.right  = 'auto';
        tb.style.display = 'block';
        tb.style.borderColor = '#4a90e2'; // mode board par défaut
        // Positionner à droite, centré verticalement
        requestAnimationFrame(function() {
            const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
            tb.style.left = (window.innerWidth - tb.offsetWidth - scrollbarW - 12) + 'px';
            tb.style.top  = Math.max(10, (window.innerHeight - tb.offsetHeight) / 2) + 'px';
        });
    }
}
function enableDrawing() {
    isDrawMode = true;
    if (drawCanvas) drawCanvas.classList.remove('inactive');
    board.classList.add('is-drawing');
    updateDrawCursor();
    clearSelection();
    // Mettre à jour l'apparence du bouton sélection
    _setBtnActive('draw-select-btn', false);
    // Réinitialiser le bouton figures
    _setBtnActive('draw-figures-btn', false, 'figures');
}

function toggleFiguresSubmenu(fromMainBtn) {
    // Détecter automatiquement si appelé depuis le bouton principal ou un sous-bouton
    // (sans modifier le HTML : on inspecte l'event global si fromMainBtn non fourni)
    if (fromMainBtn === undefined && typeof event !== 'undefined' && event && event.currentTarget) {
        fromMainBtn = (event.currentTarget.id === 'draw-figures-btn');
    }
    _stopBgPanIfActive();
    // En mode annotation PDF : activer l'outil figure ET ouvrir/fermer le sous-menu
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        const sub = document.getElementById('figures-submenu');
        const isOpen = sub && sub.classList.contains('open');
        if (isOpen && !fromMainBtn) {
            // Appelé depuis un bouton du sous-menu → ne pas fermer
            return;
        }
        if (isOpen) {
            // Appelé depuis le bouton principal figures → fermer, mais garder le bouton actif
            sub.classList.remove('open');
            sub.style.display = 'none';
            _updatePdfToolBtns(); // maintient le bouton figures coloré
        } else {
            setPdfAnnotTool('figure');
            // Sélectionner automatiquement le segment si aucun mode figure n'est actif
            if (!FIGURE_MODES.includes(currentDrawMode) || currentDrawMode === 'free') {
                setDrawMode('segment');
            }
            if (!sub) return;
            sub.classList.add('open');
            sub.style.display = 'flex';
            if (typeof _positionSubmenuNextToDrawbar === 'function') {
                requestAnimationFrame(function() { _positionSubmenuNextToDrawbar(sub); });
            }
            _updatePdfToolBtns(); // colore le bon sous-bouton figure
            // Initialiser la couleur de fond et l'opacité par défaut, afficher le slider
            const fillSwatch = document.querySelector('#cpick-fig-fill-color .cpick-swatch');
            if (fillSwatch && !fillSwatch.style.background) {
                fillSwatch.style.background = '#ffffff';
                if (typeof cpickDispatch === 'function') cpickDispatch('fig-fill-color', '#ffffff');
            }
            const fillOpacitySlider = document.getElementById('fig-fill-opacity');
            if (fillOpacitySlider && (!fillOpacitySlider.value || fillOpacitySlider.value == '0')) {
                fillOpacitySlider.value = 100;
                const fillOpacityVal = document.getElementById('fig-fill-opacity-val');
                if (fillOpacityVal) fillOpacityVal.textContent = '100%';
            }
            figFillToggle();
        }
        return;
    }
    // Désactiver la gomme si elle est active
    if (isEraserMode) stopEraserMode();
    const sub = document.getElementById('figures-submenu');
    const btn = document.getElementById('draw-figures-btn');
    if (!sub) return;
    const isOpen = sub.classList.contains('open');
    // Fermer le sous-menu géométrie compact si ouvert
    const geoCompact = document.getElementById('geo-submenu-compact');
    if (geoCompact) geoCompact.style.display = 'none';
    if (!isOpen && typeof closeGeoSubmenu === 'function') closeGeoSubmenu();
    sub.classList.toggle('open');
    sub.style.display = sub.classList.contains('open') ? 'flex' : 'none';
    // Repositionner à côté de la draw-toolbar
    if (sub.classList.contains('open') && typeof _positionSubmenuNextToDrawbar === 'function') {
        requestAnimationFrame(function() { _positionSubmenuNextToDrawbar(sub); });
    }
    // À l'ouverture : synchroniser l'affichage du slider d'opacité et initialiser la couleur par défaut
    if (sub.classList.contains('open')) {
        const fillSwatch = document.querySelector('#cpick-fig-fill-color .cpick-swatch');
        if (fillSwatch && !fillSwatch.style.background) {
            fillSwatch.style.background = '#ffffff';
            if (typeof cpickDispatch === 'function') cpickDispatch('fig-fill-color', '#ffffff');
        }
        const fillOpacitySlider = document.getElementById('fig-fill-opacity');
        if (fillOpacitySlider && (!fillOpacitySlider.value || fillOpacitySlider.value == '0')) {
            fillOpacitySlider.value = 100;
            const fillOpacityVal = document.getElementById('fig-fill-opacity-val');
            if (fillOpacityVal) fillOpacityVal.textContent = '100%';
        }
        figFillToggle();
    }
    if (btn) {
        // Le bouton reste actif (surbrillance) si le sous-menu est ouvert OU si un mode figure est actif
        const figureActive = FIGURE_MODES.includes(currentDrawMode);
        _setBtnActive('draw-figures-btn', !isOpen || figureActive, 'figures');
    }
}

function toggleSelectMode() {
    _stopBgPanIfActive();
    if (!isDrawMode && !isEraserMode) {
        // Déjà en mode sélection → repasser en dessin libre
        initCanvas(); enableDrawing();
        setDrawMode('free');
        return;
    }
    // stopEraserMode remet isDrawMode=true et is-drawing → on appelle d'abord,
    // puis on écrase ses effets pour finir proprement en mode sélection
    stopEraserMode();
    // Passer en mode sélection : désactiver le dessin mais garder la toolbar
    isDrawMode = false;
    isPainting = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    board.classList.remove('is-segment-mode');
    clearDrawCursor();
    // Fermer le sous-menu figures
    const figSub = document.getElementById('figures-submenu');
    if (figSub) figSub.classList.remove('open');
    // Fermer le sous-menu géométrie (règle/équerre/compas)
    if (typeof closeGeoSubmenu === 'function') closeGeoSubmenu();
    // Mettre à jour tous les boutons de mode
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; btn.style.boxShadow = 'none'; btn.querySelectorAll('svg *').forEach(el => el.style.removeProperty('stroke')); }
    });
    _setBtnActive('draw-figures-btn', false, 'figures');
    _setBtnActive('draw-free-btn', false);
    const hlBtnSel = document.getElementById('draw-highlight-btn');
    if (hlBtnSel) { hlBtnSel.style.borderColor='#444'; hlBtnSel.style.background='#2a2a2e'; hlBtnSel.style.color='#aaa'; hlBtnSel.classList.remove('btn-mode-active'); }
    _setBtnActive('draw-select-btn', true);
}
// ── Mode placement texte sur le board depuis la toolbar draw ─────────────
var _boardTextPlacementActive = false;

function _startBoardTextPlacement() {
    // Si déjà en mode annotation fond avec outil texte → désactiver
    if (_pdfAnnotMode && typeof _bgAnnotActive !== 'undefined' && _bgAnnotActive && _pdfAnnotTool === 'text') {
        if (typeof _toggleBgAnnotMode === 'function') _toggleBgAnnotMode();
        return;
    }
    // Activer le mode annotation sur le fond si pas encore actif
    if (typeof _toggleBgAnnotMode === 'function') {
        if (typeof _bgAnnotActive === 'undefined' || !_bgAnnotActive) {
            _toggleBgAnnotMode();
        }
    }
    // Passer en outil texte
    if (typeof setPdfAnnotTool === 'function') {
        setPdfAnnotTool('text');
    }
}

function stopDrawing() {
    isDrawMode = false;
    isPainting = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    board.classList.remove('is-segment-mode');
    clearDrawCursor();
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    if (typeof _closeGeoSubmenu === 'function') _closeGeoSubmenu();
    cancelHandwritingRecognition();
    stopEraserMode();
    // Repasser en mode sélection (curseur + bouton actif)
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; btn.style.boxShadow = 'none'; btn.querySelectorAll('svg *').forEach(el => el.style.removeProperty('stroke')); }
    });
    _setBtnActive('draw-figures-btn', false, 'figures');
    _setBtnActive('draw-free-btn', false);
    _setBtnActive('draw-select-btn', true);
    const tb = document.getElementById('draw-toolbar');
    if (tb) tb.style.display = 'none';
    if (typeof _updateDrawFabBtn === 'function') _updateDrawFabBtn();
}
function clearCanvas() {
    // Forcer le snapshot sans la garde de déduplication pour s'assurer que
    // TOUS les strokes actuels sont bien sauvegardés avant l'effacement.
    // snapshotNow() peut ignorer le snapshot si le JSON est identique au
    // dernier, ce qui peut arriver si des strokes ont été ajoutés sans
    // déclencher de snapshot intermédiaire.
    if (!isInitialLoading && !isRestoringState) {
        clearTimeout(_pendingSnapshotTimer);
        const cur = buildBoardJSON();
        if (cur) {
            undoStack.push(cur);
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            redoStack = [];
            updateUndoRedoBtns();
        }
    }
    strokes = []; selectedStrokes = []; redrawStrokes();
    // Supprimer aussi les shape-widgets créés depuis la draw-toolbar (classe no-pad)
    document.querySelectorAll('.shape-widget').forEach(w => {
        if (w.querySelector('.shape-svg-wrap.no-pad')) w.remove();
    });
    saveBoard();
}

// =========================================================================
// RECONNAISSANCE DE FORMES
// =========================================================================

function recognizeAndReplaceShape(stroke) {
    if (!stroke || stroke.points.length < 4) return false;
    const pts = stroke.points;

    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    pts.forEach(p => {
        if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y;
        if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y;
    });
    const w = maxX - minX, h = maxY - minY;
    if (w < 10 && h < 10) return false;

    const strokeColor = cpickGetValue('draw-color') || '#e84393';
    const strokeWidth = parseInt(document.getElementById('draw-size').value);
    const fillColor   = cpickGetValue('shape-recog-fill') || '#4a90e2';
    const _opacityEl  = document.getElementById('shape-recog-opacity');
    const fillOpacity = _opacityEl ? parseInt(_opacityEl.value) / 100 : 0.5;

    const firstPt = pts[0], lastPt = pts[pts.length-1];
    const closeDist = Math.hypot(firstPt.x-lastPt.x, firstPt.y-lastPt.y);
    const diagLen   = Math.hypot(w, h);
    const isClosed  = closeDist < diagLen * 0.35;

    // ── Reconnaissance ligne droite (forme ouverte) ──
    // Simplifier le tracé : si on obtient 2 points, c'est une ligne
    if (!isClosed) {
		const lineLen = Math.hypot(lastPt.x - firstPt.x, lastPt.y - firstPt.y);
		let maxDev = 0;
		for (const p of pts) {
			maxDev = Math.max(maxDev, perpendicularDist(p, firstPt, lastPt));
		}
		const threshold = Math.max(3, lineLen * 0.03);
		if (maxDev <= threshold && lineLen > 15) {
			const lineStroke = {
				points: [firstPt, lastPt],
				color:  strokeColor,
				size:   strokeWidth,
				opacity: stroke.opacity !== undefined ? stroke.opacity : 1.0
			};
			strokes.push(lineStroke);
			const cur = buildBoardJSON();
			if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack=[]; updateUndoRedoBtns(); }
			saveBoard(); redrawStrokes();
			return true;
		}
		strokes.push({ ...stroke, recognized: false });
		const cur = buildBoardJSON();
		if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack=[]; updateUndoRedoBtns(); }
		saveBoard(); redrawStrokes();
		return false;
	}

    const cx = (minX+maxX)/2, cy = (minY+maxY)/2;
    const radii  = pts.map(p => Math.hypot(p.x-cx, p.y-cy));
    const avgR   = radii.reduce((a,b)=>a+b,0)/radii.length;
    const stdDev = Math.sqrt(radii.reduce((a,v)=>a+(v-avgR)**2,0)/radii.length);
    const cv     = stdDev / avgR; // coefficient de variation — faible = cercle
    const aspect = Math.min(w,h) / Math.max(w,h);

    // ── Critères améliorés ──
    // Cercle : cv très faible ET aspect proche de 1
    // On exige cv < 0.12 (était 0.20) pour éviter les faux positifs
    const isCircle = cv < 0.12 && aspect > 0.75;

    // Triangle : simplification agressive
    const isTriangle = !isCircle && isLikelyTriangle(pts);

    let shapeId;
    if (isCircle) {
        shapeId = 'circle';
    } else if (isTriangle) {
        shapeId = 'triangle';
    } else {
        // Carré vs rectangle : basé sur l'aspect ratio uniquement
        shapeId = aspect > 0.85 ? 'square' : 'rectangle';
    }

    let svgW = w, svgH = h;
    if (shapeId === 'circle') {
        const side = Math.max(w, h);
        svgW = side; svgH = side;
    }

    createShapeWidget(shapeId, strokeColor, fillColor, fillOpacity, svgW, svgH, minX + 'px', minY + 'px', false, strokeWidth);

    const snapCur = buildBoardJSON();
    if (snapCur) {
        undoStack.push(snapCur);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack = [];
        updateUndoRedoBtns();
        localStorage.setItem('profBoardConfig', snapCur);
    }
    redrawStrokes();
    return true;
}

function isLikelyTriangle(pts) {
    // Simplify and count corners — triangle = 3 corners
    const epsilon = Math.hypot(
        Math.max(...pts.map(p=>p.x)) - Math.min(...pts.map(p=>p.x)),
        Math.max(...pts.map(p=>p.y)) - Math.min(...pts.map(p=>p.y))
    ) * 0.10;
    const simplified = rdpSimplify(pts, epsilon);
    return simplified.length >= 3 && simplified.length <= 5;
}

function rdpSimplify(pts, epsilon) {
    if (pts.length < 3) return pts;
    let maxDist = 0, maxIdx = 0;
    const first = pts[0], last = pts[pts.length-1];
    for (let i=1; i<pts.length-1; i++) {
        const d = perpendicularDist(pts[i], first, last);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon) {
        const left = rdpSimplify(pts.slice(0, maxIdx+1), epsilon);
        const right = rdpSimplify(pts.slice(maxIdx), epsilon);
        return [...left.slice(0,-1), ...right];
    }
    return [first, last];
}

function perpendicularDist(pt, lineA, lineB) {
    const dx = lineB.x - lineA.x, dy = lineB.y - lineA.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return Math.hypot(pt.x - lineA.x, pt.y - lineA.y);
    return Math.abs(dy*pt.x - dx*pt.y + lineB.x*lineA.y - lineB.y*lineA.x) / len;
}



// =========================================================================
// GOMME
// =========================================================================
var isEraserMode = false, isErasing = false;

function toggleEraserMode() {
    _stopBgPanIfActive();
    if (isEraserMode) { stopEraserMode(); return; }
    // En mode annotation PDF : déléguer à setPdfAnnotTool
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('eraser');
        return;
    }
    // Désactiver le mode dessin SANS cacher la draw-toolbar
    isDrawMode = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    cancelHandwritingRecognition();
    isEraserMode = true;
    initCanvas();
    drawCanvas.classList.remove('inactive');
    drawCanvas.classList.add('eraser-mode');
    board.classList.add('is-erasing');
    clearSelection();
    if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    // Taille de gomme par défaut à 15 sur le board
    const _esB = document.getElementById('eraser-size');
    const _eslB = document.getElementById('eraser-size-label');
    const _esl2B = document.getElementById('eraser-size-shapes-label');
    if (_esB) { _esB.value = 15; _esB.dispatchEvent(new Event('input')); }
    if (_eslB) _eslB.textContent = '15';
    if (_esl2B) _esl2B.textContent = '15';
    // Désactiver visuellement crayon et surligneur quand la gomme s'active
    const hlBtnE = document.getElementById('draw-highlight-btn');
    if (hlBtnE) { hlBtnE.style.borderColor='#444'; hlBtnE.style.background='#2a2a2e'; hlBtnE.style.color='#aaa'; hlBtnE.classList.remove('btn-mode-active'); }
    const frBtnE = document.getElementById('draw-free-btn');
    if (frBtnE) { frBtnE.style.borderColor='#444'; frBtnE.style.background='#2a2a2e'; frBtnE.style.color='#aaa'; frBtnE.classList.remove('btn-mode-active'); }
    // Activer visuellement le bouton gomme (même style qu'en mode annotation PDF)
    const eraserBtnE = document.getElementById('eraser-btn');
    if (eraserBtnE) {
        eraserBtnE.style.setProperty('background',   '#f2bbbb', 'important');
        eraserBtnE.style.setProperty('border-color', '#d69090', 'important');
        eraserBtnE.style.setProperty('color',        '#fff',    'important');
        eraserBtnE.style.setProperty('box-shadow',   '0 0 8px #e0555588', 'important');
        eraserBtnE.classList.add('btn-mode-active');
    }
    // Appliquer le curseur gomme SVG sur le board
    _applyEraserCursor();
    // En mode PDF : désactiver visuellement crayon et surligneur
    if (_pdfAnnotMode && typeof _updatePdfToolBtns === 'function') _updatePdfToolBtns();
}

// Réactive visuellement le bouton du mode dessin courant sans modifier currentDrawMode
function _refreshDrawModeBtn(mode) {
    // Bouton dessin libre
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        const on = (mode === 'free');
        freeBtn.style.borderColor = on ? '#4a90e2' : '#444';
        freeBtn.style.background  = on ? '#1a3550' : '#2a2a2e';
        freeBtn.style.color       = on ? '#fff'    : '#aaa';
        freeBtn.classList.toggle('btn-mode-active', on);
    }
    // Bouton surligneur
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        const on = (mode === 'highlight');
        hlBtn.style.borderColor = on ? '#f5c518' : '#444';
        hlBtn.style.background  = on ? '#2a2200' : '#2a2a2e';
        hlBtn.style.color       = on ? '#f5c518' : '#aaa';
        hlBtn.classList.toggle('btn-mode-active', on);
    }
    // Boutons figures
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-' + m + '-btn');
        if (!btn) return;
        const on = (mode === m);
        btn.style.borderColor = on ? '#4a90e2' : '#444';
        btn.style.background  = on ? '#1a3550' : '#2a2a2e';
        btn.style.color       = on ? '#fff'    : '#aaa';
        btn.style.boxShadow   = on ? '0 0 8px rgba(74,144,226,0.7)' : 'none';
        btn.classList.toggle('btn-mode-active', on);
    });
    // Mettre à jour le curseur
    if (FIGURE_MODES.includes(mode)) {
        board.classList.add('is-segment-mode');
        const cursorVal = _figureCursorUrl();
        board.style.setProperty('cursor', cursorVal, 'important');
        document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
            w.style.setProperty('cursor', cursorVal, 'important');
        });
    } else {
        board.classList.remove('is-segment-mode');
        updateDrawCursor();
    }
}

function stopEraserMode() {
    if (!isEraserMode) return;
    isEraserMode = false; isErasing = false;
    if (drawCanvas) {
        drawCanvas.classList.remove('inactive');
        drawCanvas.classList.remove('eraser-mode');
        board.classList.remove('is-erasing');
        board.classList.add('is-drawing');
        redrawStrokes();
    }
    isDrawMode = true;
    if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    // Retirer le curseur gomme SVG
    _clearEraserCursor();
    // Désactiver visuellement le bouton gomme
    const eraserBtnS = document.getElementById('eraser-btn');
    if (eraserBtnS) {
        eraserBtnS.style.removeProperty('background');
        eraserBtnS.style.removeProperty('border-color');
        eraserBtnS.style.removeProperty('color');
        eraserBtnS.style.removeProperty('box-shadow');
        eraserBtnS.style.background  = '#2a2a2e';
        eraserBtnS.style.borderColor = '#444';
        eraserBtnS.style.color       = '#aaa';
        eraserBtnS.classList.remove('btn-mode-active');
    }
    // En mode PDF : réactiver visuellement le bon outil
    if (_pdfAnnotMode && typeof _updatePdfToolBtns === 'function') _updatePdfToolBtns();
    // Réactiver visuellement le bouton du mode dessin courant (sans changer le mode)
    if (!_pdfAnnotMode) _refreshDrawModeBtn(currentDrawMode);
}

function eTouchStart(e) { e.preventDefault(); snapshotNow(); isErasing = true; eraseAt(getPos(e.touches[0])); }
function eTouchMove(e)  { e.preventDefault(); if (isErasing) eraseAt(getPos(e.touches[0])); }

function onEraserMouseMove(e) {
    const pos = getPos(e);
    const r = parseInt(document.getElementById('eraser-size').value);
    if (isErasing) eraseAt(pos);
    else drawEraserPreview(pos, r);
}
function onEraserLeave() { endErase(); redrawStrokes(); _clearEraserCursor(); }
function startErase(e) { if (!isEraserMode) return; snapshotNow(); isErasing = true; eraseAt(getPos(e)); }
function endErase() { if (!isErasing) return; isErasing = false; saveBoard(); }

// =========================================================================
// DÉTECTION FORME SVG ENTIÈREMENT GOMMÉE
// =========================================================================
function isShapeFullyErased(widget) {
    const svg = widget.querySelector('svg');
    if (!svg) return false;
    if (!svg.querySelector('mask.eraser-mask')) return false;
    const svgW = parseFloat(svg.getAttribute('width')) || 100;
    const svgH = parseFloat(svg.getAttribute('height')) || 100;
    const tmpCanvas = document.createElement('canvas');
    const scale = Math.min(1, 200 / Math.max(svgW, svgH));
    tmpCanvas.width  = Math.ceil(svgW * scale);
    tmpCanvas.height = Math.ceil(svgH * scale);
    const tmpCtx = tmpCanvas.getContext('2d');
    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('width',  tmpCanvas.width);
    svgClone.setAttribute('height', tmpCanvas.height);
    svgClone.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    const svgStr = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
            tmpCtx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const data = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 5) { resolve(false); return; }
            }
            resolve(true);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
        img.src = url;
    });
}

async function removeFullyErasedShapes() {
    const shapeWidgets = [...document.querySelectorAll('.shape-widget')];
    const toRemove = [];
    for (const widget of shapeWidgets) {
        const erased = await isShapeFullyErased(widget);
        if (erased) toRemove.push(widget);
    }
    if (toRemove.length > 0) {
        toRemove.forEach(w => w.remove());
        saveBoard();
    }
}

function eraseAt(pos) {
    const r = parseInt(document.getElementById('eraser-size').value);
    const NS = 'http://www.w3.org/2000/svg';

    // Densifie un stroke en interpolant des points tous les `step` px sur chaque segment
    // Nécessaire pour les figures géométriques qui n'ont que quelques points extrêmes
    function densify(pts, step) {
        if (pts.length < 2) return pts;
        const out = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const A = pts[i], B = pts[i + 1];
            const dist = Math.hypot(B.x - A.x, B.y - A.y);
            const n = Math.floor(dist / step);
            for (let j = 1; j <= n; j++) {
                const t = j / (n + 1);
                out.push({ x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) });
            }
            out.push(B);
        }
        return out;
    }

    const newStrokes = [];
    strokes.forEach(stroke => {
        // Strokes texte : supprimer si la gomme touche la bounding box du texte
        if (stroke.type === 'text') {
            if (!drawCtx) { newStrokes.push(stroke); return; }
            drawCtx.save();
            drawCtx.font = `${stroke.size}px ${stroke.fontFamily || "'Segoe UI', sans-serif"}`;
            const lines = (stroke.text || '').split('\n');
            const textW = Math.max(...lines.map(l => drawCtx.measureText(l).width));
            const textH = lines.length * stroke.size * 1.3;
            drawCtx.restore();
            const inX = pos.x >= stroke.x - r && pos.x <= stroke.x + textW + r;
            const inY = pos.y >= stroke.y - r && pos.y <= stroke.y + textH + r;
            if (inX && inY) return; // supprimer ce stroke texte
            newStrokes.push(stroke);
            return;
        }
        // Densifier à un pas de 4px pour que la gomme puisse couper n'importe où
        const pts = densify(stroke.points, 4);
        let current = [];
        for (let i = 0; i < pts.length; i++) {
            if (Math.hypot(pts[i].x - pos.x, pts[i].y - pos.y) <= r) {
                if (current.length >= 2) newStrokes.push({ ...stroke, points: current });
                current = [];
            } else {
                current.push(pts[i]);
            }
        }
        if (current.length >= 2) newStrokes.push({ ...stroke, points: current });
    });
    strokes = newStrokes;

    let shapesModified = false;
    document.querySelectorAll('.shape-widget').forEach(widget => {
        const svg = widget.querySelector('svg');
        if (!svg) return;
        const bRect = board.getBoundingClientRect();
        const svg2R = svg.getBoundingClientRect();
        const svgX = pos.x - (svg2R.left - bRect.left);
        const svgY = pos.y - (svg2R.top  - bRect.top);
        if (svgX < -r || svgY < -r || svgX > svg2R.width + r || svgY > svg2R.height + r) return;
        let mask = svg.querySelector('mask.eraser-mask');
        if (!mask) {
            const defs = document.createElementNS(NS, 'defs');
            mask = document.createElementNS(NS, 'mask');
            mask.setAttribute('class', 'eraser-mask');
            mask.setAttribute('id', 'em-' + Math.random().toString(36).slice(2));
            const bg = document.createElementNS(NS, 'rect');
            bg.setAttribute('x', '-500'); bg.setAttribute('y', '-500');
            bg.setAttribute('width', '9999'); bg.setAttribute('height', '9999');
            bg.setAttribute('fill', 'white');
            mask.appendChild(bg); defs.appendChild(mask);
            svg.insertBefore(defs, svg.firstChild);
            const g = document.createElementNS(NS, 'g');
            g.setAttribute('mask', 'url(#' + mask.id + ')');
            const toMove = [...svg.childNodes].filter(n => n !== defs);
            toMove.forEach(n => g.appendChild(n));
            svg.appendChild(g);
        }
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', svgX); circle.setAttribute('cy', svgY);
        circle.setAttribute('r', r); circle.setAttribute('fill', 'black');
        mask.appendChild(circle);
        shapesModified = true;
    });
    drawEraserPreview(pos, r);
    if (shapesModified) {
        clearTimeout(eraseAt._checkTimer);
        eraseAt._checkTimer = setTimeout(() => {
            removeFullyErasedShapes();
        }, 150);
    }
}

// Image SVG gomme pré-chargée pour drawEraserPreview (évite le délai async Blob/Image)
var _eraserSpongeImg = (function() {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16">'
        + '<rect x="1" y="2" width="20" height="12" rx="2" fill="#ddd" stroke="#888" stroke-width="1.2"/>'
        + '<rect x="1" y="2" width="9" height="12" rx="2" fill="#ffb3b3" stroke="#888" stroke-width="1.2"/>'
        + '<line x1="1" y1="8" x2="21" y2="8" stroke="#aaa" stroke-width="0.8"/>'
        + '</svg>';
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
    return img;
})();

function drawEraserPreview(pos, r) {
    if (!drawCtx) return;
    redrawStrokes();
    // Masquer le curseur natif pour laisser place au dessin canvas
    if (board) board.style.setProperty('cursor', 'none', 'important');
    drawCtx.save();
    // Cercle pointillé (rayon d'effacement)
    drawCtx.beginPath();
    drawCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    drawCtx.strokeStyle = 'rgba(60,60,60,0.7)';
    drawCtx.lineWidth = 1.5;
    drawCtx.setLineDash([4, 3]);
    drawCtx.stroke();
    drawCtx.setLineDash([]);
    // SVG gomme centré
    if (_eraserSpongeImg.complete) {
        drawCtx.drawImage(_eraserSpongeImg, pos.x - 11, pos.y - 8);
    }
    drawCtx.restore();
}

function _applyEraserCursor() {
    if (board) board.style.setProperty('cursor', 'none', 'important');
    document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
        w.style.setProperty('cursor', 'none', 'important');
    });
}

function _clearEraserCursor() {
    if (board) board.style.removeProperty('cursor');
    document.querySelectorAll('.widget[data-anchored="true"]').forEach(w => {
        w.style.removeProperty('cursor');
    });
}

// =========================================================================
// SÉLECTION
// =========================================================================
var selectedWidgets = [], selectedStrokes = [];
var selectionRect = null;
var isSelectingRect = false, selectStartX = 0, selectStartY = 0;
var mouseDownClientX = 0, mouseDownClientY = 0;
var moveStartX = 0, moveStartY = 0;
var widgetMoveOrigins = [], strokeMoveOrigins = [];
var rotateCenterX = 0, rotateCenterY = 0, rotateStartAngle = 0;
var rotateOrigWidgetTransforms = [], rotateOrigStrokePoints = [];

function initSelectionRect() {
    if (selectionRect) return;
    selectionRect = document.createElement('div');
    selectionRect.id = 'selection-rect';
    board.appendChild(selectionRect);
}

// Hit-test manuel pour trouver un .widget ou .shape-widget sous un point (x, y) écran.
// Nécessaire parce que les SVG des shape-widgets ont pointer-events:none :
// avec le stylet, e.target pointe sur l'élément derrière le widget, pas sur le widget lui-même.
function _findWidgetAtPoint(clientX, clientY) {
    // elementsFromPoint retourne tous les éléments empilés sous le point, du plus haut au plus bas
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
        const w = el.closest('.widget, .shape-widget');
        if (w) return w;
    }
    return null;
}

function initBoardSelection() {
    initSelectionRect();
    board.addEventListener('mousedown', onBoardMouseDown);
    // Stylet (pointerType pen) et touch non capturés par mousedown
    board.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return; // déjà géré par mousedown
        if (isDrawMode || isEraserMode) return;
        if (e.button !== 0) return;

        // Le SVG des shape-widgets a pointer-events:none, donc e.target peut
        // pointer sur le board ou le canvas au lieu du widget.
        // On fait un hit-test manuel en cherchant le widget le plus proche
        // parmi tous les éléments sous le stylet.
        let target = e.target;
        const realTarget = _findWidgetAtPoint(e.clientX, e.clientY) || target;

        if (realTarget.closest('.geo-tool-overlay')) return;
        if (realTarget.closest('button, a, input, select, textarea, .widget-action-bar, .widget-ctx-menu, #selection-controls, #toolbar-container, #shape-edit-panel')) return;
        e.preventDefault();
        // Construire un event synthétique avec le bon target
        const synth = {
            clientX: e.clientX,
            clientY: e.clientY,
            target:  realTarget,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            button:  0,
        };
        onBoardMouseDown(synth);
    });
    board.addEventListener('touchstart', (e) => {
        if (isDrawMode || isEraserMode) return; // géré par _boardDrawTouchStart
        if (e.touches.length !== 1) return;     // ignorer le multi-touch
        const t = e.touches[0];
        const target = t.target;
        // Laisser les overlays géométriques gérer leur propre touch
        if (target.closest('.geo-tool-overlay')) return;
        // Ne pas bloquer les clics sur les boutons interactifs (barre d'action, menus...)
        if (target.closest('button, a, input, select, textarea, .widget-action-bar, .widget-ctx-menu, #selection-controls, #toolbar-container, #shape-edit-panel')) return;
        // Empêcher scroll/zoom du navigateur pendant la sélection ou le drag
        e.preventDefault();
        // Construire un événement synthétique compatible avec onBoardMouseDown
        const synth = {
            clientX: t.clientX,
            clientY: t.clientY,
            target:  target,
            ctrlKey: false,
            metaKey: false,
        };
        onBoardMouseDown(synth);
    }, { passive: false });
}

function onBoardMouseDown(e) {
    if (window._bgPanModeActive) return;
    if (document.body.classList.contains('presentation-mode')) return;
    if (isDrawMode || isEraserMode) return;
    const target = e.target || e.srcElement;
    if (target.closest('#selection-controls')) return;
    if (target.closest('#toolbar-container')) return;
    if (target.closest('.widget-ctx-menu')) return;
    if (target.closest('#shape-edit-panel')) return;

    // Fermer le menu widgets si ouvert
    document.getElementById('tools-menu')?.classList.remove('active');

    mouseDownClientX = e.clientX;
    mouseDownClientY = e.clientY;

    const widget = target.closest('.widget, .shape-widget');

    if (widget) {
        // Ne pas sélectionner les images ancrées
        if (widget.dataset.anchored === 'true') return;
        const gid = widget.dataset.groupId;
        // Membres DOM du groupe (widgets + shape-widgets)
        const domMembers = gid
            ? [...document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`)]
            : [widget];
        // Membres traits canvas du groupe
        const strokeMembers = gid ? strokes.filter(s => s.groupId === gid) : [];

        if (e.ctrlKey || e.metaKey) {
            const allDomSelected    = domMembers.every(m => selectedWidgets.includes(m));
            const allStrokeSel      = strokeMembers.every(s => selectedStrokes.includes(s));
            const allAlreadySelected = allDomSelected && allStrokeSel;
            if (allAlreadySelected) {
                domMembers.forEach(m => { selectedWidgets = selectedWidgets.filter(w => w !== m); m.classList.remove('selected'); });
                selectedStrokes = selectedStrokes.filter(s => !strokeMembers.includes(s));
            } else {
                domMembers.forEach(m => { if (!selectedWidgets.includes(m)) { selectedWidgets.push(m); m.classList.add('selected'); } });
                strokeMembers.forEach(s => { if (!selectedStrokes.includes(s)) selectedStrokes.push(s); });
            }
        } else {
            const allDomSelected    = domMembers.every(m => selectedWidgets.includes(m));
            const allStrokeSel      = strokeMembers.every(s => selectedStrokes.includes(s));
            const allAlreadySelected = allDomSelected && allStrokeSel
                && selectedWidgets.length === domMembers.length
                && selectedStrokes.length === strokeMembers.length;
            if (!allAlreadySelected) {
                clearSelection();
                domMembers.forEach(m => { selectedWidgets.push(m); m.classList.add('selected'); });
                strokeMembers.forEach(s => selectedStrokes.push(s));
            }
        }
        if (drawCtx) redrawStrokes();
        updateSelectionOverlay();
        return;
    }

    const pos = getBoardPos(e);

    const hitStroke = findStrokeAt(pos.x, pos.y);
	if (hitStroke) {
		const gid = hitStroke.groupId;
		const groupStrokes  = gid ? strokes.filter(s => s.groupId === gid) : [hitStroke];
		const groupWidgets  = gid
			? [...document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`)]
			: [];

		if (e.ctrlKey || e.metaKey) {
			const allInSel = groupStrokes.every(s => selectedStrokes.includes(s))
						  && groupWidgets.every(w => selectedWidgets.includes(w));
			if (allInSel) {
				selectedStrokes = selectedStrokes.filter(s => !groupStrokes.includes(s));
				groupWidgets.forEach(w => { selectedWidgets = selectedWidgets.filter(x => x !== w); w.classList.remove('selected'); });
			} else {
				groupStrokes.forEach(s => { if (!selectedStrokes.includes(s)) selectedStrokes.push(s); });
				groupWidgets.forEach(w => { if (!selectedWidgets.includes(w)) { selectedWidgets.push(w); w.classList.add('selected'); } });
			}
			if (drawCtx) redrawStrokes();
			updateSelectionOverlay();
			return;
		}

		// Sélection exclusive
		const allInSel = groupStrokes.every(s => selectedStrokes.includes(s))
					  && groupWidgets.every(w => selectedWidgets.includes(w))
					  && selectedStrokes.length === groupStrokes.length
					  && selectedWidgets.length === groupWidgets.length;
		if (!allInSel) {
			clearSelection();
			groupStrokes.forEach(s => selectedStrokes.push(s));
			groupWidgets.forEach(w => { selectedWidgets.push(w); w.classList.add('selected'); });
		}
		if (drawCtx) redrawStrokes();
		updateSelectionOverlay();

		// --- DRAG DIRECT sur le trait (sans poignée) ---
		snapshotNow();
		const dragStart = { x: pos.x, y: pos.y };
		widgetMoveOrigins = selectedWidgets.map(w => ({ widget: w, origLeft: w.offsetLeft, origTop: w.offsetTop }));
		strokeMoveOrigins = selectedStrokes.map(s => ({ stroke: s, origPoints: s.points.map(p => ({...p})) }));
		let hasMoved = false;

		const onStrokeDragMove = (ev) => {
			const p = getBoardPos(ev);
			const dx = p.x - dragStart.x, dy = p.y - dragStart.y;
			if (!hasMoved && Math.hypot(dx, dy) < 4) return;
			hasMoved = true;
			if (drawCanvas) drawCanvas.style.zIndex = 13000;
			widgetMoveOrigins.forEach(({ widget, origLeft, origTop }) => {
				widget.style.left = (origLeft + dx) + 'px';
				widget.style.top  = (origTop  + dy) + 'px';
			});
			strokeMoveOrigins.forEach(({ stroke, origPoints }) => {
				stroke.points = origPoints.map(p2 => ({ x: p2.x + dx, y: p2.y + dy }));
			});
			if (drawCtx) redrawStrokes();
			updateSelectionOverlay();
		};

		const onStrokeDragEnd = () => {
			document.removeEventListener('pointermove', onStrokeDragMove);
			document.removeEventListener('pointerup',   onStrokeDragEnd);
			document.removeEventListener('pointercancel', onStrokeDragEnd);
			if (drawCanvas) drawCanvas.style.zIndex = '';
			if (hasMoved) {
				const curW = window.innerWidth, curVH = virtualH(curW);
				selectedWidgets.forEach(w => {
					w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
					w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
				});
				saveBoard();
			}
			updateSelectionOverlay();
		};

		document.addEventListener('pointermove', onStrokeDragMove);
		document.addEventListener('pointerup',   onStrokeDragEnd);
		document.addEventListener('pointercancel', onStrokeDragEnd);
		return;
	}

    clearSelection();
    isSelectingRect = true;
    selectStartX = pos.x;
    selectStartY = pos.y;
    selectionRect.style.cssText = `display:block;left:${pos.x}px;top:${pos.y}px;width:0;height:0;`;

    const onMove = (ev) => {
        if (!isSelectingRect) return;
        const p = getBoardPos(ev);
        const x = Math.min(p.x, selectStartX), y = Math.min(p.y, selectStartY);
        Object.assign(selectionRect.style, {
            left: x+'px', top: y+'px',
            width: Math.abs(p.x - selectStartX)+'px',
            height: Math.abs(p.y - selectStartY)+'px'
        });
    };

    const onUp = (ev) => {
        document.removeEventListener('pointermove',   onMove);
        document.removeEventListener('pointerup',     onUp);
        document.removeEventListener('pointercancel', onUp);
        if (!isSelectingRect) return;
        isSelectingRect = false;

        const src = ev;
        const dx = Math.abs(src.clientX - mouseDownClientX);
        const dy = Math.abs(src.clientY - mouseDownClientY);

        if (dx < 5 && dy < 5) {
            clearSelection();
            return;
        }

        const pos2 = getBoardPos({ clientX: src.clientX, clientY: src.clientY });
        const rx = Math.min(pos2.x, selectStartX), ry = Math.min(pos2.y, selectStartY);
        const rw = Math.abs(pos2.x - selectStartX), rh = Math.abs(pos2.y - selectStartY);
        const br = board.getBoundingClientRect();

        document.querySelectorAll('.widget, .shape-widget').forEach(w => {
            // Ne pas sélectionner les images ancrées
            if (w.dataset.anchored === 'true') return;
            const r = w.getBoundingClientRect();
            const wl = r.left - br.left, wt = r.top - br.top;
            if (wl < rx+rw && wl+r.width > rx && wt < ry+rh && wt+r.height > ry) {
                selectedWidgets.push(w);
                w.classList.add('selected');
            }
        });

        if (strokes) {
            strokes.forEach(s => {
                if (s.points.some(p => p.x >= rx && p.x <= rx+rw && p.y >= ry && p.y <= ry+rh))
                    selectedStrokes.push(s);
            });
        }

        if (drawCtx) redrawStrokes();
        updateSelectionOverlay();
        if (selectionRect) selectionRect.style.display = 'none';
    };

    document.addEventListener('pointermove',   onMove);
    document.addEventListener('pointerup',     onUp);
    document.addEventListener('pointercancel', onUp);
}

function clearSelection() {
    selectedWidgets = selectedWidgets.filter(w => document.body.contains(w));
    selectedWidgets.forEach(w => w.classList.remove('selected'));
    selectedWidgets = []; selectedStrokes = [];
    if (drawCtx) redrawStrokes();
    document.getElementById('selection-controls').style.display = 'none';
    if (selectionRect) selectionRect.style.display = 'none';
    board.classList.remove('single-select');
    board.classList.remove('multi-select');
}


// =========================================================================
// MODE ANNOTATION PDF
// =========================================================================
// État global
var _pdfAnnotMode     = false;  // mode actif ?
var _pdfAnnotWidget   = null;   // widget PDF cible
var _pdfAnnotCanvas   = null;   // canvas d'annotations (référence, pour les events)
var _pdfAnnotEvTarget = null;   // élément sur lequel les events draw.js sont attachés
var _pdfAnnotTool     = 'pen';  // 'pen' | 'highlighter' | 'text' | 'eraser' | 'pan'
var _pdfAnnotPainting = false;
var _pdfPrevTool      = 'pen';  // outil mémorisé avant de passer en pan

// ── Outils boutons PDF extras dans la toolbar ──────────────────────────────

// Boutons supplémentaires (surligneur, texte, annuler, effacer) affichés
// uniquement quand le mode est actif.
var _PDF_EXTRA_BTNS = ['pdf-pan-btn'];

function _dtClearAction() {
    if (_pdfAnnotMode) {
        pdfAnnotClear();
    } else {
        clearCanvas();
    }
}

function _showPdfExtraBtns(show) {
    _PDF_EXTRA_BTNS.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.style.display = show ? 'flex' : 'none';
    });
    // Adapter le titre du bouton effacer selon le contexte
    const clearBtn = document.getElementById('dt-clear-btn');
    if (clearBtn) {
        clearBtn.title = show ? 'Effacer toutes les annotations PDF' : 'Effacer tout le dessin';
    }
}

// Met à jour l'aspect visuel des boutons outil PDF
// ── Curseurs SVG pour le mode annotation PDF ─────────────────────────────

// Curseur SVG partagé pour les figures (board + PDF)
function _figureCursorUrl() {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">'
        + '<line x1="11" y1="0" x2="11" y2="22" stroke="#aaa" stroke-width="1.5"/>'
        + '<line x1="0" y1="11" x2="22" y2="11" stroke="#aaa" stroke-width="1.5"/>'
        + '<circle cx="11" cy="11" r="2" fill="#aaa"/>'
        + '<polygon points="14,14 21,14 14,21" fill="#7a9abf" stroke="#4a6a8a" stroke-width="1"/>'
        + '</svg>';
    return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 11 11, crosshair';
}

function _pdfCursor(tool) {
    let svg;
    if (tool === 'pan') {
        return 'grab';
    }
    if (tool === 'pen') {
        // Utiliser le même style de curseur que le board (dot / size / crosshair)
        const style = window._drawCursorStyle || 'size';
        if (style === 'crosshair') return 'crosshair';
        const color = window._drawColor
            || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
            || document.querySelector('#cpick-draw-color .cpick-swatch')?.style?.background
            || '#e84393';
        if (style === 'dot') {
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
                + '<circle cx="10" cy="10" r="8" fill="none" stroke="#999" stroke-width="1.5"/>'
                + '<circle cx="10" cy="10" r="2" fill="' + color + '"/>'
                + '</svg>';
            return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 10 10, crosshair';
        }
        // style === 'size'
        const size = parseInt((document.getElementById('draw-size') || {}).value) || 4;
        const rDot = Math.max(2, Math.min(size / 2, 24));
        const dim  = rDot * 2 + 4;
        const cx   = dim / 2;
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + dim + '" height="' + dim + '">'
            + '<circle cx="' + cx + '" cy="' + cx + '" r="' + rDot + '" fill="' + color + '"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") ' + cx + ' ' + cx + ', crosshair';
    }
    if (tool === 'highlighter') {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">'
            + '<rect x="11" y="1" width="10" height="6" rx="2" fill="#aaa" stroke="#888" stroke-width="0.8"/>'
            + '<rect x="11" y="6" width="10" height="17" rx="1" fill="#f5c518" stroke="#c8a010" stroke-width="0.8"/>'
            + '<rect x="13" y="7" width="3" height="15" rx="1" fill="#fde96a" opacity="0.6"/>'
            + '<polygon points="11,23 21,23 16,31" fill="#fad84a" stroke="#c8a010" stroke-width="0.8"/>'
            + '<circle cx="16" cy="31" r="1.5" fill="#c8a010"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 16 31, crosshair';
    }
    if (tool === 'eraser') {
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16">'
            + '<rect x="1" y="2" width="20" height="12" rx="2" fill="#ddd" stroke="#888" stroke-width="1.2"/>'
            + '<rect x="1" y="2" width="9" height="12" rx="2" fill="#ffb3b3" stroke="#888" stroke-width="1.2"/>'
            + '<line x1="1" y1="8" x2="21" y2="8" stroke="#aaa" stroke-width="0.8"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 11 8, cell';
    }
    if (tool === 'figure') {
        return _figureCursorUrl();
    }
    if (tool === 'text') {
        return 'text';
    }
    return 'crosshair';
}

// Active un outil PDF et désactive tous les autres — point d'entrée unique
function setPdfAnnotTool(tool) {
    if (!_pdfAnnotMode) return;

    // Bascule : recliqué sur le même outil → retour au crayon
    // (sauf pour 'figure' qui est géré par toggleFiguresSubmenu)
    if (_pdfAnnotTool === tool && tool !== 'figure') tool = 'pen';

    _pdfAnnotTool = tool;

    // Désélectionner toute figure sélectionnée au changement d'outil
    _pdfFigSelectedIndex  = -1;
    _pdfFigLastClickTime  = 0;
    _pdfFigLastClickIndex = -1;

    // Gérer isEraserMode manuellement (sans appeler stopEraserMode qui
    // déclenche _updatePdfToolBtns trop tôt avec le mauvais outil)
    if (tool === 'eraser') {
        isEraserMode = true;
        isErasing = false;
        if (drawCanvas) { drawCanvas.classList.remove('inactive'); drawCanvas.classList.add('eraser-mode'); }
        board.classList.add('is-erasing');
        if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    } else if (isEraserMode) {
        isEraserMode = false;
        isErasing = false;
        if (drawCanvas) { drawCanvas.classList.remove('eraser-mode'); board.classList.remove('is-erasing'); }
        if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    }

    // Désactiver le mode figure si on passe sur autre chose
    if (tool !== 'figure') {
        currentDrawMode = 'free';
        _setBtnActive('draw-figures-btn', false, 'figures');
        const figSub = document.getElementById('figures-submenu');
        if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    }

    // Appliquer le curseur SVG
    const cursor = _pdfCursor(tool);
    if (_pdfAnnotEvTarget) {
        _pdfAnnotEvTarget.style.setProperty('cursor', cursor, 'important');
        // Forcer le curseur sur tous les enfants du widget pour éviter les overrides CSS
        _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => {
            el.style.setProperty('cursor', cursor, 'important');
        });
    }
    if (_pdfAnnotCanvas)   _pdfAnnotCanvas.style.cursor = cursor;
    // Retirer le mode segment si on quitte les figures
    if (tool !== 'figure') {
        board.classList.remove('is-segment-mode');
        clearDrawCursor();
    }

    _updatePdfToolBtns();
}

// Met à jour l'aspect visuel des 5 boutons — source de vérité : _pdfAnnotTool
function _updatePdfToolBtns() {
    const tool = _pdfAnnotTool;  // _pdfAnnotTool est toujours à jour avant cet appel

    // Helper : active ou désactive un bouton avec couleur donnée
    function _setBtn(id, active, activeColor) {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (active) {
            btn.style.setProperty('background',    activeColor || '#1a3550', 'important');
            btn.style.setProperty('border-color',  activeColor ? activeColor.replace(/[^,]+\)/, '1)') : '#4a90e2', 'important');
            btn.style.setProperty('color',         '#fff', 'important');
            btn.style.setProperty('box-shadow',    `0 0 8px ${activeColor || '#4a90e2'}88`, 'important');
            btn.classList.add('btn-mode-active');
        } else {
            btn.style.removeProperty('background');
            btn.style.removeProperty('border-color');
            btn.style.removeProperty('color');
            btn.style.removeProperty('box-shadow');
            btn.style.background  = '#2a2a2e';
            btn.style.borderColor = '#444';
            btn.style.color       = '#aaa';
            btn.style.boxShadow   = 'none';
            btn.classList.remove('btn-mode-active');
        }
    }

    _setBtn('pdf-pan-btn',        tool === 'pan',         '#c8a000');
    _setBtn('draw-free-btn',      tool === 'pen',         '#1a3550');
    _setBtn('draw-highlight-btn', tool === 'highlighter', '#2a2200');
    _setBtn('eraser-btn',         tool === 'eraser',      '#c0392b');
    _setBtn('draw-figures-btn',   tool === 'figure',      '#1a2a4a');
    _setBtn('pdf-text-btn',       tool === 'text',        '#1a3a2a');

    // Mettre à jour les boutons du sous-menu figures (figure active = currentDrawMode)
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-' + m + '-btn');
        if (!btn) return;
        const isActive = (tool === 'figure') && (m === currentDrawMode);
        if (isActive) {
            btn.style.setProperty('background',   '#1a3550', 'important');
            btn.style.setProperty('border-color', '#4a90e2', 'important');
            btn.style.setProperty('color',        '#fff',    'important');
            btn.style.setProperty('box-shadow',   '0 0 8px rgba(74,144,226,0.7)', 'important');
            btn.querySelectorAll('svg *').forEach(el => el.style.setProperty('stroke', '#7ab8f5', 'important'));
        } else {
            btn.style.removeProperty('background');
            btn.style.removeProperty('border-color');
            btn.style.removeProperty('color');
            btn.style.removeProperty('box-shadow');
            btn.style.background  = '#2a2a2e';
            btn.style.borderColor = '#444';
            btn.style.color       = '#aaa';
            btn.style.boxShadow   = 'none';
            btn.querySelectorAll('svg *').forEach(el => el.style.removeProperty('stroke'));
        }
    });

    // Curseur sur le widget cible (sauf la toolbar qui garde son curseur grab)
    const cursor = _pdfCursor(tool);
    if (_pdfAnnotEvTarget) {
        _pdfAnnotEvTarget.style.setProperty('cursor', cursor, 'important');
        _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => {
            if (el.closest('.editor-toolbar')) {
                // La toolbar garde grab, ses boutons gardent pointer
                if (el.matches('button, label, input, select, a')) {
                    el.style.setProperty('cursor', 'pointer', 'important');
                } else {
                    el.style.setProperty('cursor', 'grab', 'important');
                }
            } else {
                el.style.setProperty('cursor', cursor, 'important');
            }
        });
    }
    if (_pdfAnnotCanvas)   _pdfAnnotCanvas.style.cursor = cursor;
}

// ── Sélection du widget PDF cible ─────────────────────────────────────────

function _findActivePdfWidget() {
    const pdfs = [...document.querySelectorAll('.widget[data-type="pdf"]')];
    if (pdfs.length === 0) return null;
    const loaded = pdfs.filter(w => {
        const wrap = w.querySelector('.pdf-canvas-wrap');
        return wrap && wrap.style.display !== 'none';
    });
    if (loaded.length === 0) return null;
    return loaded.reduce((best, w) => {
        return parseInt(w.style.zIndex || 0) >= parseInt(best.style.zIndex || 0) ? w : best;
    });
}

// ── Détacher uniquement les listeners du widget courant (sans reset UI) ───────
function _detachPdfAnnotListeners() {
    if (_pdfAnnotEvTarget) {
        _pdfAnnotEvTarget.removeEventListener('mousedown',   _pdfAnnotMouseDown);
        _pdfAnnotEvTarget.removeEventListener('mousemove',   _pdfAnnotMouseMove);
        _pdfAnnotEvTarget.removeEventListener('mouseup',     _pdfAnnotMouseUp);
        _pdfAnnotEvTarget.removeEventListener('mouseleave',  _pdfAnnotMouseLeave);
        _pdfAnnotEvTarget.removeEventListener('contextmenu', _pdfAnnotContextMenu);
        _pdfAnnotEvTarget.removeEventListener('touchstart',  _pdfAnnotTouchStart);
        _pdfAnnotEvTarget.removeEventListener('touchmove',   _pdfAnnotTouchMove);
        _pdfAnnotEvTarget.removeEventListener('touchend',    _pdfAnnotTouchEnd);
        _pdfAnnotEvTarget.removeEventListener('pointerdown',   _pdfAnnotPointerDown);
        _pdfAnnotEvTarget.removeEventListener('pointerup',     _pdfAnnotPointerUp);
        _pdfAnnotEvTarget.removeEventListener('pointermove',   _pdfAnnotPointerMove);
        _pdfAnnotEvTarget.removeEventListener('pointercancel', _pdfAnnotPointerCancel);
        const _pdfCanvasStop = _pdfAnnotWidget && _pdfAnnotWidget.querySelector('.pdf-canvas');
        if (_pdfCanvasStop) _pdfCanvasStop.removeEventListener('contextmenu', _pdfAnnotContextMenu, true);
        // Effacer tous les curseurs inline forcés sur le widget et ses enfants
        _pdfAnnotEvTarget.style.cursor = '';
        _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.cursor = '');
        _pdfAnnotEvTarget = null;
    }
    if (_pdfAnnotWidget) {
        _pdfAnnotWidget.classList.remove('pdf-annot-target');
        const wrap = _pdfAnnotWidget.querySelector('.pdf-canvas-wrap');
        if (wrap) wrap.style.cursor = 'grab';
    }
    if (_pdfAnnotCanvas) {
        _pdfAnnotCanvas.style.pointerEvents = 'none';
        _pdfAnnotCanvas.style.cursor = '';
    }
    _pdfAnnotWidget   = null;
    _pdfAnnotCanvas   = null;
    _pdfAnnotPainting = false;
}

// ── Activer / désactiver le mode ──────────────────────────────────────────

function togglePdfAnnotMode() {
    if (_pdfAnnotMode) {
        _stopPdfAnnotMode();
    } else {
        _startPdfAnnotMode();
    }
}

function _startPdfAnnotModeOn(targetWidget) {
    // Démarrer le mode annotation sur un widget spécifique
    const origFind = _findActivePdfWidget;
    // Patch temporaire : forcer le widget cible
    window.__forcedPdfTarget = targetWidget;
    _startPdfAnnotMode();
    window.__forcedPdfTarget = null;
}

function _startPdfAnnotMode() {
    const target = window.__forcedPdfTarget || _findActivePdfWidget();
    if (!target) {
        _showPdfAnnotToast('⚠️ Ouvrez d\'abord un PDF dans un widget');
        return;
    }
    const annotCanvas = target.querySelector('.pdf-annot-canvas');
    if (!annotCanvas) {
        _showPdfAnnotToast('⚠️ Canvas d\'annotation introuvable');
        return;
    }

    // Si déjà en mode annotation sur un AUTRE widget : détacher les anciens listeners
    // sans réinitialiser l'UI (on reste en mode annotation, on change juste de cible)
    const _switching = _pdfAnnotMode && _pdfAnnotWidget !== target;
    const _prevTool  = _pdfAnnotTool; // conserver l'outil lors d'un switch
    if (_switching) {
        _detachPdfAnnotListeners();
    }

    // Désactiver le dessin sur le board pendant le mode annotation PDF
    if (isEraserMode) stopEraserMode();
    if (isDrawMode) stopDrawing_keepToolbar();

    _pdfAnnotMode   = true;
    _pdfAnnotWidget = target;
    _pdfAnnotCanvas = annotCanvas;
    _pdfAnnotTool   = _switching ? _prevTool : 'pen'; // conserver l'outil si switch, sinon pen

    // Griser les boutons cœur/étoile/flèche (incompatibles avec l'annotation PDF)
    ['draw-mode-heart-btn','draw-mode-star-btn','draw-mode-arrow-btn'].forEach(id => {
        const b = document.getElementById(id);
        if (b) { b.style.opacity = '0.3'; b.style.pointerEvents = 'none'; b.title += ' (non disponible en annotation PDF)'; }
    });

    // Marquer le widget cible
    target.classList.add('pdf-annot-target');

    // Désactiver les pointer-events du canvas d'annotation pour que les listeners
    // natifs de media.js ne se déclenchent plus (ils utilisent #e74c3c par défaut).
    // draw.js écoute sur le board qui capture les événements à la place.
    annotCanvas.style.pointerEvents = 'none';

    // Désactiver aussi les listeners natifs via l'API si disponible
    const api0 = target._pdfAnnotAPI;
    if (api0 && api0.detachNativeEvents) api0.detachNativeEvents();

    // (le bouton pdf-annot-mode-btn est désormais le toggle auto-bascule, pas un indicateur de mode)

    // Afficher les boutons extras
    _showPdfExtraBtns(true);
    _updatePdfToolBtns();
    // Masquer les boutons inutiles en mode annotation PDF
    const selBtn = document.getElementById('draw-select-btn');
    if (selBtn) selBtn.style.display = 'none';
    // Le bouton géo reste visible : les outils géo peuvent tracer sur le PDF
    const geoBtn = document.getElementById('geo-draw-btn');
    if (geoBtn) {
        geoBtn.style.display = '';
        geoBtn.title = 'Outils géométriques (tracé sur PDF)';
    }

    // Mettre pointerEvents:none sur le canvas pour bloquer les handlers natifs de media.js.
    _pdfAnnotCanvas.style.pointerEvents = 'none';

    // Attacher les événements sur le widget parent
    _pdfAnnotEvTarget = target;
    _pdfAnnotEvTarget.addEventListener('mousedown',   _pdfAnnotMouseDown);
    _pdfAnnotEvTarget.addEventListener('mousemove',   _pdfAnnotMouseMove);
    _pdfAnnotEvTarget.addEventListener('mouseup',     _pdfAnnotMouseUp);
    _pdfAnnotEvTarget.addEventListener('mouseleave',  _pdfAnnotMouseLeave);
    _pdfAnnotEvTarget.addEventListener('contextmenu', _pdfAnnotContextMenu);
    _pdfAnnotEvTarget.addEventListener('touchstart',  _pdfAnnotTouchStart, { passive: false });
    _pdfAnnotEvTarget.addEventListener('touchmove',   _pdfAnnotTouchMove,  { passive: false });
    _pdfAnnotEvTarget.addEventListener('touchend',    _pdfAnnotTouchEnd);
    // Pointer events : clic droit + dessin stylet/touch sur le widget PDF
    _pdfAnnotEvTarget.addEventListener('pointerdown',   _pdfAnnotPointerDown);
    _pdfAnnotEvTarget.addEventListener('pointerup',     _pdfAnnotPointerUp);
    _pdfAnnotEvTarget.addEventListener('pointermove',   _pdfAnnotPointerMove, { passive: false });
    _pdfAnnotEvTarget.addEventListener('pointercancel', _pdfAnnotPointerCancel);
    // Attacher aussi le contextmenu sur le pdfCanvas (capture phase)
    const _pdfCanvas = _pdfAnnotWidget && _pdfAnnotWidget.querySelector('.pdf-canvas');
    if (_pdfCanvas) _pdfCanvas.addEventListener('contextmenu', _pdfAnnotContextMenu, true);

    // Appliquer le curseur SVG dès l'ouverture (outil par défaut : pen)
    const initCursor = _pdfCursor(_pdfAnnotTool);
    _pdfAnnotEvTarget.style.setProperty('cursor', initCursor, 'important');
    _pdfAnnotCanvas.style.cursor = initCursor;
    // Retirer le curseur grab du canvasWrap — draw.js gère maintenant le curseur
    const wrapAtStart = target.querySelector('.pdf-canvas-wrap');
    if (wrapAtStart) wrapAtStart.style.cursor = '';

    // Taille de gomme par défaut à 15 en mode annotation PDF (seulement à la première activation)
    if (!_switching) {
        const _es = document.getElementById('eraser-size');
        const _esl = document.getElementById('eraser-size-label');
        const _esl2 = document.getElementById('eraser-size-shapes-label');
        if (_es) { _es.value = 15; _es.dispatchEvent(new Event('input')); }
        if (_esl) _esl.textContent = '15';
        if (_esl2) _esl2.textContent = '15';
        _showPdfAnnotToast('✏️ Mode annotation PDF actif — cliquez sur le PDF pour annoter');
    }

    // Forcer le bon curseur sur tous les enfants du nouveau widget
    _updatePdfToolBtns();
    _updateDrawModeIndicator(true);
}

function _stopPdfAnnotMode() {
    if (!_pdfAnnotMode) return;

    // Supprimer les boutons overlay d'annotation s'ils sont affichés
    ['_annot-delete-btn','_annot-resize-btn','_annot-rotate-btn','_annot-lock-btn'].forEach(id => {
        const el = document.getElementById(id); if (el) el.remove();
    });

    // Détacher les listeners et nettoyer le widget (met _pdfAnnotWidget/Canvas/EvTarget à null)
    _detachPdfAnnotListeners();

    // Nettoyer les drags resize/rotate en cours
    if (_pdfRotateText) {
        document.removeEventListener('mousemove', _pdfTextRotateMove);
        document.removeEventListener('mouseup',   _pdfTextRotateEnd);
        _pdfRotateText = null;
    }

    _pdfAnnotMode = false;

    // Réactiver les boutons cœur/étoile/flèche
    ['draw-mode-heart-btn','draw-mode-star-btn','draw-mode-arrow-btn'].forEach(id => {
        const b = document.getElementById(id);
        if (b) {
            b.style.opacity = '';
            b.style.pointerEvents = '';
            b.title = b.title.replace(' (non disponible en annotation PDF)', '');
        }
    });

    // Repasser en mode sélection (pas en mode dessin)
    isDrawMode = true; // toggleSelectMode attend isDrawMode=true pour basculer
    toggleSelectMode();

    // (indicateur de mode géré par _updateDrawModeIndicator)

    // Réinitialiser le bouton main (pan)
    const panBtn = document.getElementById('pdf-pan-btn');
    if (panBtn) {
        panBtn.style.borderColor = '#444';
        panBtn.style.background  = '#2a2a2e';
        panBtn.style.color       = '#aaa';
        panBtn.style.boxShadow   = 'none';
    }
    _pdfPanLastX = null; _pdfPanLastY = null;    // Réinitialiser le bouton surligneur partagé
    const hlBtn = document.getElementById('draw-highlight-btn');    if (hlBtn) {
        hlBtn.style.borderColor = '#444';
        hlBtn.style.background  = '#2a2a2e';
        hlBtn.style.color       = '#aaa';
        hlBtn.classList.remove('btn-mode-active');
    }
    // Réinitialiser le bouton texte
    const textBtn = document.getElementById('pdf-text-btn');
    if (textBtn) {
        textBtn.style.borderColor = '#444';
        textBtn.style.background  = '#2a2a2e';
        textBtn.style.color       = '#aaa';
        textBtn.style.boxShadow   = 'none';
        textBtn.style.fontSize    = '13px';
    }

    // Cacher boutons extras
    _showPdfExtraBtns(false);
    // Réafficher les boutons masqués
    const selBtnStop = document.getElementById('draw-select-btn');
    if (selBtnStop) selBtnStop.style.display = '';
    const geoBtnStop = document.getElementById('geo-draw-btn');
    if (geoBtnStop) { geoBtnStop.style.display = ''; geoBtnStop.title = 'Outils géométriques'; }
    _updateDrawModeIndicator(false);
}

// Variante de stopDrawing qui ne cache pas la toolbar (pour basculer depuis draw mode)
function stopDrawing_keepToolbar() {
    isDrawMode = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    board.classList.remove('is-segment-mode');
    clearDrawCursor();
    cancelHandwritingRecognition();
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    if (typeof _closeGeoSubmenu === 'function') _closeGeoSubmenu();
}

// ── Coordonnées relatives au canvas d'annotations ─────────────────────────

function _getPdfAnnotPos(e) {
    const rect = _pdfAnnotCanvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    // Tenir compte du ratio canvas CSS vs canvas interne
    const scaleX = _pdfAnnotCanvas.width  / rect.width;
    const scaleY = _pdfAnnotCanvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top)  * scaleY
    };
}

// ── Undo / Clear — délèguent à l'API de media.js ──────────────────────────

function pdfAnnotUndo() {
    if (!_pdfAnnotMode) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api) api.undo();
}

function pdfAnnotRedo() {
    if (!_pdfAnnotMode) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api && api.redo) api.redo();
}

function pdfAnnotClear() {
    if (!_pdfAnnotMode) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api) api.clear();
}

// ── Helpers : couleur + taille depuis la draw-toolbar ─────────────────────

function _pdfAnnotGetColor() {
    // window._drawColor est mis à jour par cpickDispatch à chaque changement de couleur
    if (window._drawColor) return window._drawColor;
    // Fallback : lire via cpickGetValue
    if (typeof cpickGetValue === 'function') {
        const c = cpickGetValue('draw-color');
        if (c) return c;
    }
    // Fallback : couleur de fond de la swatch (mise à jour par _setDrawColor et cpickSet)
    const swatch = document.querySelector('#cpick-draw-color .cpick-swatch');
    if (swatch) {
        const bg = swatch.style.background || swatch.style.backgroundColor;
        if (bg && bg !== '') return bg;
    }
    return '#111111';
}

function _pdfAnnotGetSize() {
    if (isEraserMode) return parseInt(document.getElementById('eraser-size').value) || 20;
    return parseInt(document.getElementById('draw-size').value) || 4;
}

// Récupère l'outil effectif : 'pen' | 'highlighter' | 'eraser' | 'text'
// (la gomme PDF utilise eraser-size mais reste 'eraser' côté tool)
function _pdfAnnotEffectiveTool() {
    return _pdfAnnotTool;
}

// ── Coordonnées en pixels canvas (tient compte du CSS scaling) ────────────
// Délègue au canvas exposé par l'API de media.js

function _getPdfAnnotPos(e) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    const canvas = api ? api.getAnnotCanvas() : _pdfAnnotCanvas;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top)  * scaleY
    };
}

var _pdfPanLastY = null;
var _pdfPanLastX = null;

// ── Dessin — tout passe par l'API de media.js ─────────────────────────────

var _pdfFigureStart = null; // point de départ pour les figures PDF
var _pdfDragText = null;    // { index, stroke, startPos } lors d'un drag de texte
var _pdfDragFigure = null;  // { index, stroke, startPos, startNx, startNy } lors d'un drag de figure
// Tracking double-clic pour la sélection de figures (simple clic = nouveau trait)
var _pdfFigLastClickTime  = 0;
var _pdfFigLastClickPos   = null;
var _pdfFigLastClickIndex = -1;
var _pdfFigSelectedIndex  = -1; // index de la figure actuellement sélectionnée (-1 = aucune)
// ── Snap magnétique sur les angles cardinaux (0°, 90°, 180°, 270°) ────────
const _SNAP_ANGLES_RAD = [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI];
const _SNAP_THRESHOLD  = 5 * Math.PI / 180; // ±5°

function _snapAngle(angle) {
    let a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    for (const snap of _SNAP_ANGLES_RAD) {
        if (Math.abs(a - snap) < _SNAP_THRESHOLD) return snap === 2 * Math.PI ? 0 : snap;
    }
    return angle;
}

var _pdfRotateText = null; // { index, startAngle, cx, cy (pixels canvas normalisés) }

// ── Appelé par le bouton overlay ↻ sur un texte ──────────────────────────
window._pdfTextRotateStart = function(index, e) {
    if (!_pdfAnnotWidget) return;
    const api = _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;
    const canvas = api.getAnnotCanvas();
    if (!canvas) return;
    const annotLayers = api.getAnnotLayers();
    const currentPageNum = Object.keys(annotLayers).find(p =>
        annotLayers[p] && annotLayers[p].strokes && annotLayers[p].strokes[index] &&
        annotLayers[p].strokes[index].tool === 'text'
    );
    if (!currentPageNum) return;
    const s = annotLayers[currentPageNum].strokes[index];
    const cw = canvas.width, ch = canvas.height;
    // Centre du texte en pixels canvas
    const fontSize = Math.round(6 * Math.pow(1.12, s.size) * cw / 600);
    const tmpCtx = canvas.getContext('2d');
    tmpCtx.font = `${fontSize}px 'Segoe UI', sans-serif`;
    const lines = (s.text || '').split('\n');
    const textW = Math.max(...lines.map(l => tmpCtx.measureText(l).width));
    const textH = lines.length * fontSize * 1.3;
    const pxX = s.nx * cw + textW / 2;
    const pxY = s.ny * ch + textH / 2;
    const rect = canvas.getBoundingClientRect();
    const centerScreenX = rect.left + (pxX / cw) * rect.width;
    const centerScreenY = rect.top  + (pxY / ch) * rect.height;
    const baseAngle = s.rotation || 0;
    const mouseAngle = Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX);
    _pdfRotateText = { index, centerScreenX, centerScreenY, baseAngle, mouseAngle };
    document.addEventListener('mousemove',   _pdfTextRotateMove);
    document.addEventListener('mouseup',     _pdfTextRotateEnd);
    document.addEventListener('pointermove', _pdfTextRotateMove);
    document.addEventListener('pointerup',   _pdfTextRotateEnd);
    document.addEventListener('pointercancel', _pdfTextRotateEnd);
};

function _pdfTextRotateMove(e) {
    if (!_pdfRotateText) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api || !api.rotateTextStroke) return;
    const currentAngle = Math.atan2(
        e.clientY - _pdfRotateText.centerScreenY,
        e.clientX - _pdfRotateText.centerScreenX
    );
    const rawAngle = _pdfRotateText.baseAngle + (currentAngle - _pdfRotateText.mouseAngle);
    const snapped = _snapAngle(rawAngle);
    api.rotateTextStroke(_pdfRotateText.index, snapped);
    if (api.drawTextSelection) api.drawTextSelection(_pdfRotateText.index);
}

function _pdfTextRotateEnd() {
    if (!_pdfRotateText) return;
    document.removeEventListener('mousemove',   _pdfTextRotateMove);
    document.removeEventListener('mouseup',     _pdfTextRotateEnd);
    document.removeEventListener('pointermove', _pdfTextRotateMove);
    document.removeEventListener('pointerup',   _pdfTextRotateEnd);
    document.removeEventListener('pointercancel', _pdfTextRotateEnd);
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api && api.saveTextTransform) api.saveTextTransform(_pdfRotateText.index);
    if (api && api.drawTextSelection) api.drawTextSelection(_pdfRotateText.index);
    _pdfRotateText = null;
}

function _pdfAnnotStartStroke(e) {
    const tool = _pdfAnnotEffectiveTool();

    // Effacer tout cadre de sélection de figure résiduel si on commence une nouvelle action
    if (!_pdfDragFigure) {
        const _apiDesel = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (_apiDesel && _apiDesel.redrawAnnotations) _apiDesel.redrawAnnotations();
    }

    if (tool === 'text') {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        const pos = _getPdfAnnotPos(e);
        const found = api && api.findTextStrokeAt ? api.findTextStrokeAt(pos.x, pos.y) : null;

        if (found) {
            if (_pdfSelectedText && _pdfSelectedText.index === found.index) {
                // Texte déjà sélectionné + clic dessus → préparer drag ou édition
                const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
                const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
                _pdfDragText = { index: found.index, stroke: found.stroke, startPos: pos, startClientX: clientX, startClientY: clientY, moved: false };
                _pdfAnnotPainting = true;
                // Préparer le snapshot sans le texte (optimisation gros PDF)
                if (api && api.startDragText) api.startDragText(found.index);
                if (_pdfAnnotEvTarget) {
                _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
                _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', 'grabbing', 'important'));
            }
            } else {
                // Nouveau texte cliqué → sélectionner
                _pdfAnnotSelectText(e);
            }
            return;
        }

        // Clic dans le vide → désélectionner et créer nouveau texte
        _pdfAnnotDeselect();
        _pdfAnnotInsertText(e);
        return;
    }

    // Mode pan : enregistrer le point de départ
    if (tool === 'pan') {
        const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        _pdfPanLastX = clientX;
        _pdfPanLastY = clientY;
        _pdfAnnotPainting = true;
        if (_pdfAnnotEvTarget) {
                _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
                _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', 'grabbing', 'important'));
            }
        return;
    }

    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    const pos = _getPdfAnnotPos(e);

    // Mode figure : sélection uniquement sur double-clic (évite de sélectionner
    // accidentellement la figure qu'on vient de tracer quand on enchaîne les traits)
    if (FIGURE_MODES.includes(currentDrawMode) && tool !== 'eraser') {
        const found = api.findFigureStrokeAt ? api.findFigureStrokeAt(pos.x, pos.y) : null;
        if (found) {
            const now = Date.now();
            const dx = pos.x - (_pdfFigLastClickPos ? _pdfFigLastClickPos.x : Infinity);
            const dy = pos.y - (_pdfFigLastClickPos ? _pdfFigLastClickPos.y : Infinity);
            const isDoubleClick = (now - _pdfFigLastClickTime < 350)
                && Math.hypot(dx, dy) < 20
                && _pdfFigLastClickIndex === found.index;
            // Aussi accepter un clic sur une figure déjà sélectionnée (pour la déplacer)
            const isAlreadySelected = _pdfFigSelectedIndex === found.index;

            _pdfFigLastClickTime  = now;
            _pdfFigLastClickPos   = pos;
            _pdfFigLastClickIndex = found.index;

            if (isDoubleClick || isAlreadySelected) {
                // Double-clic (ou clic sur figure déjà sélectionnée) → déplacer
                if (isDoubleClick) _pdfFigLastClickTime = 0; // reset pour éviter triple-clic
                _pdfFigSelectedIndex = found.index; // mémoriser la sélection
                const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
                const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
                _pdfDragFigure = {
                    index: found.index,
                    stroke: found.stroke,
                    startPos: pos,
                    startClientX: clientX,
                    startClientY: clientY,
                    moved: false
                };
                _pdfAnnotPainting = true;
                if (api.startDragFigure) api.startDragFigure(found.index);
                api.drawFigureSelection(found.index);
                if (_pdfAnnotEvTarget) {
                    _pdfAnnotEvTarget.style.setProperty('cursor', 'grab', 'important');
                    _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', 'grab', 'important'));
                }
                return;
            } else {
                // Premier clic sur figure non sélectionnée : ignorer et dessiner un nouveau trait
                _pdfFigSelectedIndex = -1;
                _pdfFigureStart = pos;
                _pdfAnnotPainting = true;
                return;
            }
        }
        // Pas de figure sous le curseur → dessiner une nouvelle figure + désélectionner
        _pdfFigLastClickTime  = 0;
        _pdfFigLastClickPos   = null;
        _pdfFigLastClickIndex = -1;
        _pdfFigSelectedIndex  = -1;
        _pdfFigureStart = pos;
        _pdfAnnotPainting = true;
        return;
    }

    _pdfAnnotPainting = true;
    const eraserSize = tool === 'eraser' ? (parseInt((document.getElementById('eraser-size') || {}).value) || 20) : null;
    api.startStroke(_pdfAnnotGetColor(), eraserSize !== null ? eraserSize : _pdfAnnotGetSize(), tool, pos.x, pos.y);
}

// RAF throttle pour les annotations PDF
var _pdfPaintRafId = null;
var _pdfPaintPendingE = null;

function _pdfAnnotContinueStroke(e) {
    if (!_pdfAnnotPainting) return;
    const tool = _pdfAnnotEffectiveTool();

    // Drag d'un texte existant
    if (_pdfDragText) {
        const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
        const dx = clientX - _pdfDragText.startClientX;
        const dy = clientY - _pdfDragText.startClientY;
        if (!_pdfDragText.moved && Math.sqrt(dx*dx + dy*dy) > 5) {
            _pdfDragText.moved = true;
            if (_pdfAnnotEvTarget) {
                _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
                _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', 'grabbing', 'important'));
            }
        }
        if (_pdfDragText.moved) {
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api) {
                const pos = _getPdfAnnotPos(e);
                api.moveTextStroke(_pdfDragText.index, pos.x, pos.y);
            }
        }
        return;
    }

    // Drag d'une figure existante
    if (_pdfDragFigure) {
        const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
        const dx = clientX - _pdfDragFigure.startClientX;
        const dy = clientY - _pdfDragFigure.startClientY;
        if (!_pdfDragFigure.moved && Math.sqrt(dx*dx + dy*dy) > 5) {
            _pdfDragFigure.moved = true;
            if (_pdfAnnotEvTarget) {
                _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
                _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', 'grabbing', 'important'));
            }
        }
        if (_pdfDragFigure.moved) {
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api && api.moveFigureStroke) {
                const annotCanvas = api.getAnnotCanvas();
                const cw = annotCanvas ? annotCanvas.width  : 600;
                const ch = annotCanvas ? annotCanvas.height : 800;
                // Convertir le delta client en delta normalisé
                const rect = annotCanvas ? annotCanvas.getBoundingClientRect() : { width: cw, height: ch };
                const scaleX = cw / rect.width;
                const scaleY = ch / rect.height;
                const pos = _getPdfAnnotPos(e);
                const dnx = (pos.x - _pdfDragFigure.startPos.x) / cw;
                const dny = (pos.y - _pdfDragFigure.startPos.y) / ch;
                // Recalculer toujours depuis la position d'origine en stockant l'offset cumulé
                api.moveFigureStroke(_pdfDragFigure.index, dnx, dny);
                // Redessiner la sélection par-dessus
                api.drawFigureSelection(_pdfDragFigure.index);
                // Remettre startPos à jour pour un delta incrémental
                _pdfDragFigure.startPos = pos;
            }
        }
        return;
    }

    if (tool === 'text') return;

    // Mode pan : scroller le conteneur PDF
    if (tool === 'pan') {
        const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        if (_pdfPanLastX !== null && _pdfAnnotWidget) {
            const dx = clientX - _pdfPanLastX;
            const dy = clientY - _pdfPanLastY;
            const wrap = _pdfAnnotWidget.querySelector('.pdf-canvas-wrap');
            if (wrap) {
                wrap.scrollLeft -= dx;
                wrap.scrollTop  -= dy;
            }
        }
        _pdfPanLastX = clientX;
        _pdfPanLastY = clientY;
        return;
    }

    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    const pos = _getPdfAnnotPos(e);

    // Mode figure : preview en temps réel (sauf si gomme active)
    if (FIGURE_MODES.includes(currentDrawMode) && _pdfFigureStart && tool !== 'eraser') {
        const pts = _buildFigurePoints(currentDrawMode, _pdfFigureStart, pos);
        if (pts) {
            const fill = _getFigFillOpts();
            api.previewFigure(
                _pdfAnnotGetColor(), _pdfAnnotGetSize(), pts,
                fill.enabled ? fill.color  : null,
                fill.enabled ? fill.opacity : 0
            );
        }
        return;
    }

    const eraserSize2 = tool === 'eraser' ? (parseInt((document.getElementById('eraser-size') || {}).value) || 20) : null;

    // Dessin direct sans RAF throttle pour pen et highlighter (latence minimale, comme le board)
    // Les coalesced events sont récupérés en amont dans _pdfAnnotPointerMove
    api.continueStroke(_pdfAnnotGetColor(), eraserSize2 !== null ? eraserSize2 : _pdfAnnotGetSize(), tool, pos.x, pos.y);
}

function _pdfAnnotEndStroke(e) {
    if (!_pdfAnnotPainting) return;
    _pdfAnnotPainting = false;
    // Annuler tout RAF en attente
    if (_pdfPaintRafId) { cancelAnimationFrame(_pdfPaintRafId); _pdfPaintRafId = null; }
    _pdfPaintPendingE = null;

    // Fin du drag texte
    if (_pdfDragText) {
        if (!_pdfDragText.moved) {
            // Pas de mouvement sur texte sélectionné → ouvrir l'éditeur
            const api2 = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            const found2 = api2 && api2.findTextStrokeAt ? api2.findTextStrokeAt(_pdfDragText.startPos.x, _pdfDragText.startPos.y) : null;
            if (found2) {
                _pdfAnnotDeselect();
                _pdfAnnotOpenEditorForStroke(e, found2);
            }
        } else {
            // Drag terminé → sauvegarder
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api && api.saveTextMove) api.saveTextMove(_pdfDragText.index);
        }
        _pdfDragText = null;
        if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', _pdfCursor(_pdfAnnotTool), 'important');
        return;
    }

    // Fin du drag figure
    if (_pdfDragFigure) {
        if (_pdfDragFigure.moved) {
            // Drag terminé → sauvegarder dans l'historique, garder la sélection active
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api && api.saveFigureMove) api.saveFigureMove(_pdfDragFigure.index);
            // Redessiner avec le cadre de sélection (figure reste sélectionnée)
            if (api && api.drawFigureSelection) api.drawFigureSelection(_pdfDragFigure.index);
            _pdfFigSelectedIndex = _pdfDragFigure.index;
        } else {
            // Pas de mouvement → afficher le cadre de sélection, rester sélectionné
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api && api.drawFigureSelection) api.drawFigureSelection(_pdfDragFigure.index);
            _pdfFigSelectedIndex = _pdfDragFigure.index;
        }
        _pdfDragFigure = null;
        // Restaurer le curseur figure (croix+figure) sur le widget et tous ses enfants
        const figCursor = _pdfCursor(_pdfAnnotTool);
        if (_pdfAnnotEvTarget) {
            _pdfAnnotEvTarget.style.setProperty('cursor', figCursor, 'important');
            _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', figCursor, 'important'));
        }
        if (_pdfAnnotCanvas) _pdfAnnotCanvas.style.cursor = figCursor;
        return;
    }
    if (_pdfAnnotTool === 'pan') {
        _pdfPanLastX = null;
        _pdfPanLastY = null;
        if (_pdfAnnotEvTarget) {
            _pdfAnnotEvTarget.style.setProperty('cursor', 'grab', 'important');
            _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => el.style.setProperty('cursor', 'grab', 'important'));
        }
        return;
    }

    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    // Mode figure : dessiner la figure finale (sauf si gomme active)
    if (FIGURE_MODES.includes(currentDrawMode) && _pdfFigureStart && e && !isEraserMode) {
        const pos = _getPdfAnnotPos(e);
        const pts = _buildFigurePoints(currentDrawMode, _pdfFigureStart, pos);
        _pdfFigureStart = null;
        _pdfFigSelectedIndex = -1; // désélectionner après avoir dessiné un nouveau trait
        if (pts && pts.length >= 2) {
            const fill = _getFigFillOpts();
            api.addFigureStroke(
                _pdfAnnotGetColor(), _pdfAnnotGetSize(), pts,
                fill.enabled ? fill.color   : null,
                fill.enabled ? fill.opacity  : 0
            );
        }
        return;
    }
    _pdfFigureStart = null;
    _pdfFigureStart = null;
    api.endStroke();
}

// ── Insertion / édition de texte inline ──────────────────────────────────

function _pdfAnnotInsertText(e) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;
    const canvas = api.getAnnotCanvas();
    if (!canvas) return;

    const pos     = _getPdfAnnotPos(e);
    const color   = _pdfAnnotGetColor();
    const size    = Math.max(_pdfAnnotGetSize(), 8); // taille min 8 pour le texte
    const rect       = canvas.getBoundingClientRect();
    const fontSizePx = Math.round(6 * Math.pow(1.12, size) * rect.width / 600);
    // Convertir pos (coordonnées canvas) en coordonnées écran pour positionner l'éditeur
    const scaleX = rect.width  / canvas.width;
    const scaleY = rect.height / canvas.height;
    const screenX = rect.left + pos.x * scaleX;
    const screenY = rect.top  + pos.y * scaleY;

    _showPdfInlineTextEditor({
        clientX: screenX, clientY: screenY, color, size, fontSizePx,
        onValidate(text, finalSize, finalColor) {
            if (!text.trim()) return;
            if (api.addTextStroke) api.addTextStroke(text, finalColor ?? color, finalSize ?? size, pos.x + 5 * scaleX, pos.y - 0.01305 * canvas.height);
        }
    });
}

function _pdfAnnotOpenEditorForStroke(e, found) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;
    const { index, stroke } = found;
    const canvas     = api.getAnnotCanvas();
    const rect       = canvas.getBoundingClientRect();
    const fontSizePx = Math.round(6 * Math.pow(1.12, stroke.size) * rect.width / 600);
    const screenX    = rect.left + stroke.nx * rect.width;
    const screenY    = rect.top  + stroke.ny * rect.height;
    _showPdfInlineTextEditor({
        clientX: screenX, clientY: screenY,
        color: stroke.color, size: stroke.size, fontSizePx,
        initialText: stroke.text || '',
        onValidate(newText, finalSize, finalColor) {
            if (!newText.trim()) return;
            api.updateTextStroke(index, newText, finalSize ?? stroke.size, finalColor ?? stroke.color);
        }
    });
}

// ── Sélection d'un texte existant (clic droit) ───────────────────────────
var _pdfSelectedText = null; // { index, stroke }
var _pdfSelectColorInterval = null;

function _pdfAnnotSelectText(e) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api || !api.findTextStrokeAt) return;
    const pos   = _getPdfAnnotPos(e);
    const found = api.findTextStrokeAt(pos.x, pos.y);

    // Clic droit ailleurs → désélectionner
    if (!found) {
        _pdfAnnotDeselect();
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Sélectionner ce stroke
    _pdfSelectedText = { index: found.index, stroke: { ...found.stroke } };

    // Synchroniser le color picker ET le slider de taille avec le stroke
    window._drawColor = found.stroke.color;
    if (typeof cpickSet === 'function') cpickSet('draw-color', found.stroke.color, true);
    const drawSizeEl = document.getElementById('draw-size');
    const drawSizeLabelEl = document.getElementById('draw-size-label');
    if (drawSizeEl) { drawSizeEl.value = found.stroke.size; drawSizeEl.dispatchEvent(new Event('input')); }
    if (drawSizeLabelEl) drawSizeLabelEl.textContent = found.stroke.size;

    // Dessiner le cadre de sélection
    api.drawTextSelection(found.index);

    // Surveiller les changements de couleur et de taille du picker
    if (_pdfSelectColorInterval) clearInterval(_pdfSelectColorInterval);
    let lastPickerColor = found.stroke.color;
    let lastPickerSize  = found.stroke.size;
    _pdfSelectColorInterval = setInterval(() => {
        if (!_pdfSelectedText) { clearInterval(_pdfSelectColorInterval); return; }
        const pickerColor = _pdfAnnotGetColor();
        const pickerSize  = _pdfAnnotGetSize();
        let changed = false;
        if (pickerColor && pickerColor !== lastPickerColor) {
            lastPickerColor = pickerColor;
            _pdfSelectedText.stroke.color = pickerColor;
            changed = true;
        }
        if (pickerSize && pickerSize !== lastPickerSize) {
            lastPickerSize = pickerSize;
            _pdfSelectedText.stroke.size = pickerSize;
            changed = true;
        }
        if (changed) {
            api.updateTextStroke(_pdfSelectedText.index,
                _pdfSelectedText.stroke.text,
                _pdfSelectedText.stroke.size,
                _pdfSelectedText.stroke.color);
            api.drawTextSelection(_pdfSelectedText.index);
        }
    }, 100);
}

function _pdfAnnotDeselect() {
    if (_pdfSelectColorInterval) { clearInterval(_pdfSelectColorInterval); _pdfSelectColorInterval = null; }
    if (_pdfSelectedText) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.redrawAnnotations) api.redrawAnnotations();
    }
    _pdfSelectedText = null;
}

function _pdfAnnotRightClick(e) {
    e.preventDefault();
    _pdfAnnotSelectText(e);
}

// Affiche un éditeur de texte inline positionné à (clientX, clientY)
function _showPdfInlineTextEditor({ clientX, clientY, color, size, fontSizePx, initialText = '', onValidate }) {
    // Fermer un éditeur déjà ouvert sans valider
    const existing = document.getElementById('_pdf-inline-text-editor-wrap');
    if (existing) existing.remove();

    // Taille courante (modifiable via +/-)
    let currentSize = size;
    let currentFontPx = fontSizePx;

    // Wrapper positionné à l'endroit du clic
    const wrap = document.createElement('div');
    wrap.id = '_pdf-inline-text-editor-wrap';
    wrap.style.cssText = `
        position: fixed;
        left: ${clientX}px;
        top: ${clientY - fontSizePx - 24}px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 2px;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.22));
    `;

    // Bandeau taille
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        display: flex; align-items: center; gap: 4px;
        background: rgba(40,40,40,0.92); border-radius: 5px;
        padding: 2px 6px; width: fit-content;
        user-select: none;
    `;
    const btnMinus = document.createElement('button');
    btnMinus.textContent = '−';
    btnMinus.style.cssText = 'background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;padding:0 3px;line-height:1;';
    const sizeLabel = document.createElement('span');
    sizeLabel.style.cssText = 'color:#fff;font-size:11px;min-width:22px;text-align:center;';
    sizeLabel.textContent = currentSize;
    const btnPlus = document.createElement('button');
    btnPlus.textContent = '+';
    btnPlus.style.cssText = 'background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;padding:0 3px;line-height:1;';
    toolbar.append(btnMinus, sizeLabel, btnPlus);

    // Zone de texte
    const editor = document.createElement('div');
    editor.id = '_pdf-inline-text-editor';
    editor.contentEditable = 'true';
    editor.spellcheck = false;
    editor.style.cssText = `
        min-width: 80px;
        max-width: 90vw;
        padding: 2px 5px;
        font-size: ${fontSizePx}px;
        font-family: 'Segoe UI', sans-serif;
        color: ${color};
        background: rgba(255,255,255,0.75);
        border: 1.5px dashed ${color};
        border-radius: 3px;
        outline: none;
        white-space: pre-wrap;
        cursor: text;
        line-height: 1.3;
    `;

    wrap.append(toolbar, editor);

    // Mise à jour de la taille
    function updateSize(delta) {
        currentSize = Math.max(1, Math.min(40, currentSize + delta));
        // Recalculer fontSizePx à partir de la même formule que drawStroke
        const canvas = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI && _pdfAnnotWidget._pdfAnnotAPI.getAnnotCanvas();
        const rect = canvas ? canvas.getBoundingClientRect() : { width: 600 };
        currentFontPx = Math.round(6 * Math.pow(1.12, currentSize) * rect.width / 600);
        editor.style.fontSize = currentFontPx + 'px';
        sizeLabel.textContent = currentSize;
    }
    btnMinus.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); ev.preventDefault(); updateSize(-1); editor.focus(); });
    btnPlus.addEventListener('pointerdown',  (ev) => { ev.stopPropagation(); ev.preventDefault(); updateSize(+1); editor.focus(); });

    // Synchronisation couleur depuis le color picker (window._drawColor)
    let currentColor = color;
    let lastPickerColor = _pdfAnnotGetColor(); // valeur picker au moment de l'ouverture
    const colorInterval = setInterval(() => {
        const pickerColor = _pdfAnnotGetColor();
        if (pickerColor && pickerColor !== lastPickerColor) {
            lastPickerColor = pickerColor;
            currentColor = pickerColor;
            editor.style.color = currentColor;
            editor.style.borderColor = currentColor;
            editor.focus();
        }
    }, 100);

    let validated = false;
    function validate() {
        if (validated) return;
        validated = true;
        clearInterval(colorInterval);
        const text = editor.innerText;
        wrap.remove();
        document.removeEventListener('pointerdown', onOutsideClick, true);
        onValidate(text, currentSize, currentColor);
    }
    function cancel() {
        if (validated) return;
        validated = true;
        clearInterval(colorInterval);
        wrap.remove();
        document.removeEventListener('pointerdown', onOutsideClick, true);
    }

    editor.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); validate(); }
        if (ev.key === 'Enter' && ev.shiftKey) { ev.preventDefault(); validate(); }
        // Entrée seule = saut de ligne (comportement naturel du contentEditable)
        if (ev.key === 'Escape') cancel();
        ev.stopPropagation();
    });

    function onOutsideClick(ev) {
        if (wrap.contains(ev.target)) return;
        // Ne pas fermer si on clique sur le color picker draw
        const cpick = document.getElementById('cpick-draw-color');
        const cpickPop = document.getElementById('cpick-pop-draw-color');
        if ((cpick && cpick.contains(ev.target)) || (cpickPop && cpickPop.contains(ev.target))) return;
        document.removeEventListener('pointerdown', onOutsideClick, true);
        ev.stopPropagation();
        ev.preventDefault();
        validate();
    }
    setTimeout(() => {
        document.addEventListener('pointerdown', onOutsideClick, true);
    }, 300);

    wrap.addEventListener('pointerdown', (ev) => {
        if (ev.target !== btnMinus && ev.target !== btnPlus) ev.stopPropagation();
    });

    document.body.appendChild(wrap);
    if (initialText) editor.innerText = initialText;

    requestAnimationFrame(() => {
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    });
}

// ── Gestionnaires d'événements ────────────────────────────────────────────

// Flag : le dernier pointerdown sur le widget PDF venait d'un stylet ou du touch.
// Permet de bloquer le mousedown synthétique que le navigateur génère ensuite,
// qui causerait un double-démarrage du trait.
var _pdfLastPointerWasPen = false;
var _pdfLastStrokeStartTime = 0; // timestamp du dernier _pdfAnnotStartStroke (déduplique touch+pointer)

function _pdfAnnotMouseDown(e)  {
    // Le navigateur génère un mousedown synthétique après chaque pointerdown stylet/touch.
    // On l'ignore : le trait a déjà été démarré dans _pdfAnnotPointerDown.
    if (_pdfLastPointerWasPen) { _pdfLastPointerWasPen = false; return; }
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('button')) return;
    // En mode texte, empêcher le mousedown de voler le focus à l'éditeur inline
    if (_pdfAnnotEffectiveTool() === 'text') e.preventDefault();
    _pdfAnnotStartStroke(e);
}
function _pdfAnnotPointerDown(e) {
    // Clic droit (bouton gomme stylet ou clic droit souris)
    if (e.button === 2) {
        _rightClickDownX = e.clientX;
        _rightClickDownY = e.clientY;
        _rightClickPending = true;
        _rightClickDone = false;
        return;
    }
    // Stylet ou touch (bouton 0) : démarrer le trait directement.
    // Mémoriser le flag pour bloquer le mousedown synthétique suivant.
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
        if (e.target.closest && e.target.closest('button')) return;
        // Ne pas interférer avec les boutons overlay (resize/rotate/delete/lock)
        const _annotBtnIds = ['_annot-delete-btn','_annot-lock-btn'];
        if (_annotBtnIds.some(id => e.target.id === id || (e.target.closest && e.target.closest('#'+id)))) return;
        e.preventDefault();
        _pdfLastPointerWasPen = true;
        _pdfLastStrokeStartTime = Date.now();
        _pdfAnnotStartStroke(e);
    }
}
function _pdfAnnotPointerUp(e) {
    if (e.button === 2) {
        e.preventDefault();
        _tryRightClickToggle(e.clientX, e.clientY);
        _rightClickPending = false;
        return;
    }
    // Stylet ou touch : terminer le trait
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
        e.preventDefault();
        _pdfAnnotEndStroke(e);
    }
}
// Mouvement stylet/touch en mode annotation PDF
function _pdfAnnotPointerMove(e) {
    // Uniquement stylet et touch — la souris est gérée par mousemove
    if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
    // Ne pas interférer avec un resize/rotate en cours (géré par les handlers document)
    if (_pdfRotateText) return;
    if (!_pdfAnnotPainting) return;
    e.preventDefault();
    // Coalesced events pour plus de fluidité (Firefox/Chrome avec stylet)
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ce of events) {
        _pdfAnnotContinueStroke(ce);
    }
    // Preview du cercle gomme
    if (isEraserMode) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.previewEraser) {
            const pos = _getPdfAnnotPos(e);
            const r = parseInt(document.getElementById('eraser-size').value) || 20;
            api.previewEraser(pos.x, pos.y, r);
        }
    }
}
// Annulation du trait (déconnexion stylet, interruption système)
function _pdfAnnotPointerCancel(e) {
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
        _pdfAnnotEndStroke(null);
    }
}
function _pdfAnnotContextMenu(e) {
    e.preventDefault();
    // Clic droit : toggle gomme ↔ outil précédent (sauf en mode texte)
    if (_pdfAnnotTool !== 'text') {
        _doToggleEraserDraw();
    }
}
function _pdfAnnotMouseMove(e)  {
    // Ignorer les mousemove synthétiques générés par le stylet (déjà traités par pointermove)
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    if (_pdfAnnotPainting && e.movementX === 0 && e.movementY === 0) return; // event fantôme
    _pdfAnnotContinueStroke(e);
    // Prévisualisation du cercle gomme — toujours après le dessin/effacement
    if (_pdfAnnotMode && isEraserMode) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api) {
            const pos = _getPdfAnnotPos(e);
            const r = parseInt(document.getElementById('eraser-size').value) || 20;
            api.previewEraser(pos.x, pos.y, r);
        }
    }
    // Curseur adaptatif en mode texte : déplacement sur texte existant, text sinon
    if (!_pdfAnnotPainting && _pdfAnnotEffectiveTool() === 'text' && _pdfAnnotEvTarget) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.findTextStrokeAt) {
            const pos = _getPdfAnnotPos(e);
            const found = api.findTextStrokeAt(pos.x, pos.y);
            const cur = found ? 'move' : 'text';
            _pdfAnnotEvTarget.style.setProperty('cursor', cur, 'important');
            _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => {
                if (!el.closest('.editor-toolbar')) {
                    el.style.setProperty('cursor', cur, 'important');
                }
            });
            if (_pdfAnnotCanvas) _pdfAnnotCanvas.style.setProperty('cursor', cur, 'important');
        }
    }
    // Curseur adaptatif en mode figure : grab uniquement sur figure déjà sélectionnée
    if (!_pdfAnnotPainting && _pdfAnnotEffectiveTool() === 'figure' && _pdfAnnotEvTarget) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.findFigureStrokeAt) {
            const pos = _getPdfAnnotPos(e);
            const found = api.findFigureStrokeAt(pos.x, pos.y);
            // Move uniquement si la figure est déjà sélectionnée (double-clic préalable)
            const cur = (found && _pdfFigSelectedIndex === found.index) ? 'grab' : _pdfCursor('figure');
            _pdfAnnotEvTarget.style.setProperty('cursor', cur, 'important');
            _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => {
                if (!el.closest('.editor-toolbar')) {
                    el.style.setProperty('cursor', cur, 'important');
                }
            });
            if (_pdfAnnotCanvas) _pdfAnnotCanvas.style.setProperty('cursor', cur, 'important');
        }
    }
}
function _pdfAnnotMouseUp(e)    {
    // Ignorer le mouseup synthétique après un pointerup stylet/touch
    if (e.pointerType === 'pen' || e.pointerType === 'touch') return;
    _pdfAnnotEndStroke(e);
}
function _pdfAnnotMouseLeave(e) {
    // Effacer le cercle gomme preview en redessinant les annotations
    if (_pdfAnnotMode && isEraserMode) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.redrawAnnotations) api.redrawAnnotations();
    }
    // Remettre le curseur du mode courant
    if (_pdfAnnotEvTarget) {
        _pdfAnnotEvTarget.style.setProperty('cursor', _pdfCursor(_pdfAnnotEffectiveTool()), 'important');
    }
    _pdfAnnotEndStroke(e);
}

function _pdfAnnotTouchStart(e) {
    // touchstart et pointerdown se déclenchent tous les deux pour le même tap stylet/touch.
    // On ignore touchstart si pointerdown a déjà traité ce tap (même instant ±50ms).
    if (Date.now() - _pdfLastStrokeStartTime < 50) return;
    e.preventDefault();
    if (e.touches.length === 1) {
        _pdfLastStrokeStartTime = Date.now();
        _pdfAnnotStartStroke(e.touches[0]);
    }
}
function _pdfAnnotTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) _pdfAnnotContinueStroke(e.touches[0]);
}
function _pdfAnnotTouchEnd(e) {
    if (e.changedTouches && e.changedTouches[0]) _pdfAnnotEndStroke(e.changedTouches[0]);
    else _pdfAnnotEndStroke(null);
}

// ── Intégration avec stopDrawing ──────────────────────────────────────────
// Quand on ferme la draw-toolbar, on coupe aussi le mode annotation PDF

const _origStopDrawing = stopDrawing;
stopDrawing = function() {
    _origStopDrawing();
    if (_pdfAnnotMode) _stopPdfAnnotMode();
};

// En mode annotation PDF, le bouton ↩ de la toolbar doit annuler
// uniquement la dernière annotation (pas un snapshot global du board)
const _origUndoAction = undoAction;
undoAction = function() {
    if (_pdfAnnotMode) { pdfAnnotUndo(); return; }
    _origUndoAction();
};

const _origRedoAction = redoAction;
redoAction = function() {
    if (_pdfAnnotMode) { pdfAnnotRedo(); return; }
    _origRedoAction();
};


function _updateDrawModeIndicator(isPdf) {
    const dot   = document.getElementById('draw-mode-indicator-dot');
    const label = document.getElementById('draw-mode-indicator-label');
    const tb    = document.getElementById('draw-toolbar');
    if (isPdf) {
        if (dot)   dot.style.background = '#c8a000';
        if (label) { label.style.color = '#c8b84a'; label.textContent = 'PDF'; }
        if (tb)    tb.style.setProperty('border-color', '#c8a000', 'important');
    } else {
        if (dot)   dot.style.background = '#4a90e2';
        if (label) { label.style.color = '#6a9fd8'; label.textContent = 'Board'; }
        if (tb)    tb.style.setProperty('border-color', '#4a90e2', 'important');
    }
}

// ── Toast d'information ───────────────────────────────────────────────────

function _showPdfAnnotToast(msg) {
    let toast = document.getElementById('pdf-annot-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pdf-annot-toast';
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a3a20;color:#5ddd7e;border:1px solid #3dbb5e;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:700;z-index:99999;pointer-events:none;transition:opacity .3s;white-space:nowrap;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-CLICK ANNOTATION : bascule entre mode dessin libre et mode annotation
// PDF au premier clic sur le widget PDF (ou sur le board).
// Le survol prépare silencieusement la cible ; le clic valide la bascule.
// Aller sur la toolbar draw NE déclenche pas de bascule.
// ═══════════════════════════════════════════════════════════════════════════

(function() {
    // true = la bascule auto est active (désactivable si besoin)
    window._autoAnnotHoverEnabled = true;

    // Widget PDF actuellement survolé (null si aucun)
    var _pendingPdfWidget = null;

    // Indique si la souris est au-dessus du board (hors widget PDF)
    var _pendingBoard = false;

    // Indique si la bascule auto est en cours (évite la récursion)
    var _autoSwitching = false;

    // Mémorise le mode dessin libre avant une bascule vers PDF
    var _savedDrawMode = 'free';
    var _savedIsEraser = false;

    // ── Vérifie si la draw-toolbar est actuellement ouverte ──────────────
    function _isDrawToolbarOpen() {
        const tb = document.getElementById('draw-toolbar');
        if (!tb) return false;
        return tb.style.display !== 'none' && tb.style.display !== '';
    }

    // ── Bascule vers le mode annotation PDF sur un widget donné ──────────
    function _switchToPdfAnnot(pdfWidget) {
        if (_autoSwitching) return;
        // Déjà en annotation sur CE widget → rien à faire
        if (_pdfAnnotMode && _pdfAnnotWidget === pdfWidget) return;

        _autoSwitching = true;
        _savedDrawMode = (typeof currentDrawMode !== 'undefined') ? currentDrawMode : 'free';
        _savedIsEraser = !!isEraserMode;
        _startPdfAnnotModeOn(pdfWidget);
        _autoSwitching = false;
    }

    // ── Retour en mode dessin libre sur le board ──────────────────────────
    function _switchToFreeDrawing() {
        if (_autoSwitching) return;
        if (!_pdfAnnotMode) return;

        _autoSwitching = true;
        _stopPdfAnnotMode();

        if (_savedIsEraser) {
            if (!isEraserMode) toggleEraserMode();
        } else {
            isDrawMode = true;
            if (drawCanvas) drawCanvas.classList.remove('inactive');
            board.classList.add('is-drawing');
            if (typeof setDrawMode === 'function' && _savedDrawMode) {
                setDrawMode(_savedDrawMode);
            }
            updateDrawCursor();
        }
        _autoSwitching = false;
    }

    // ── Listener mousedown global : décide si on bascule ─────────────────
    function _onGlobalMouseDown(e) {
        if (!window._autoAnnotHoverEnabled) return;
        if (!_isDrawToolbarOpen()) return;
        // Clic sur la draw-toolbar ou ses enfants → ignorer complètement
        if (e.target && e.target.closest && e.target.closest('#draw-toolbar')) return;
        // Clic sur la barre titre d'un widget (réduire, fermer, plein écran…) → ignorer
        if (e.target && e.target.closest && e.target.closest('.editor-toolbar')) return;
        // Clic sur les UI flottantes (sous-menus, outils géo, toasts…) → ignorer
        if (e.target && e.target.closest && (
            e.target.closest('#geo-submenu')        ||
            e.target.closest('#figures-submenu')    ||
            e.target.closest('.geo-tool-overlay')   ||
            e.target.closest('.geo-toolbar')        ||
            e.target.closest('#geo-toolbar')        ||
            e.target.closest('#pdf-annot-toast')    ||
            e.target.closest('.draw-submenu')
        )) return;

        var switched = false;

        if (_pendingPdfWidget) {
            // Clic sur un widget PDF survolé → passer en mode annotation PDF
            const wrap = _pendingPdfWidget.querySelector('.pdf-canvas-wrap');
            if (wrap && wrap.style.display !== 'none') {
                // Ne basculer que si on N'est pas déjà en annotation sur ce widget
                if (!_pdfAnnotMode || _pdfAnnotWidget !== _pendingPdfWidget) {
                    _switchToPdfAnnot(_pendingPdfWidget);
                    switched = true;
                }
            }
        } else if (_pendingBoard) {
            // Clic sur le board (hors widget PDF) → revenir en mode dessin libre
            if (_pdfAnnotMode) {
                _switchToFreeDrawing();
                switched = true;
            }
        }

        // Si une bascule a eu lieu, avaler l'événement pour qu'aucun handler
        // de dessin ne reçoive ce clic et ne trace un point parasite.
        if (switched) {
            e.stopPropagation();
            e.preventDefault();
            // Avaler aussi le mouseup correspondant
            document.addEventListener('mouseup', function _suppressMouseUp(ev) {
                ev.stopPropagation();
                ev.preventDefault();
                document.removeEventListener('mouseup', _suppressMouseUp, true);
            }, true);
        }
    }

    // ── Listener pointerdown global : même logique pour stylet/touch ──────
    function _onGlobalPointerDown(e) {
        // Ignorer les événements souris (déjà gérés par _onGlobalMouseDown)
        if (e.pointerType === 'mouse') return;
        if (!window._autoAnnotHoverEnabled) return;
        if (!_isDrawToolbarOpen()) return;
        // Mêmes exclusions que mousedown
        if (e.target && e.target.closest && e.target.closest('#draw-toolbar')) return;
        if (e.target && e.target.closest && e.target.closest('.editor-toolbar')) return;
        if (e.target && e.target.closest && (
            e.target.closest('#geo-submenu')        ||
            e.target.closest('#figures-submenu')    ||
            e.target.closest('.geo-tool-overlay')   ||
            e.target.closest('.geo-toolbar')        ||
            e.target.closest('#geo-toolbar')        ||
            e.target.closest('#pdf-annot-toast')    ||
            e.target.closest('.draw-submenu')
        )) return;

        // Pour le stylet, détecter la cible directement (pas de survol préalable)
        const onPdfWidget = e.target && e.target.closest && e.target.closest('.widget[data-type="pdf"]');
        if (onPdfWidget) {
            _pendingPdfWidget = onPdfWidget;
            _pendingBoard = false;
        } else {
            _pendingPdfWidget = null;
            _pendingBoard = true;
        }

        var switched = false;

        if (_pendingPdfWidget) {
            const wrap = _pendingPdfWidget.querySelector('.pdf-canvas-wrap');
            if (wrap && wrap.style.display !== 'none') {
                if (!_pdfAnnotMode || _pdfAnnotWidget !== _pendingPdfWidget) {
                    _switchToPdfAnnot(_pendingPdfWidget);
                    switched = true;
                }
            }
        } else if (_pendingBoard) {
            if (_pdfAnnotMode) {
                _switchToFreeDrawing();
                switched = true;
            }
        }

        if (switched) {
            e.stopPropagation();
            e.preventDefault();
            // Avaler pointermove + pointerup pour qu'aucun trait ne soit tracé
            function _suppressPointerMove(ev) {
                ev.stopPropagation();
                ev.preventDefault();
            }
            function _suppressPointerUp(ev) {
                ev.stopPropagation();
                ev.preventDefault();
                document.removeEventListener('pointermove', _suppressPointerMove, true);
                document.removeEventListener('pointerup',  _suppressPointerUp,   true);
            }
            document.addEventListener('pointermove', _suppressPointerMove, true);
            document.addEventListener('pointerup',   _suppressPointerUp,   true);
        }
    }

    // ── Attache les listeners sur un widget PDF (pointer = souris + stylet + touch) ─
    function _attachHoverToPdfWidget(widget) {
        if (widget._autoAnnotHoverAttached) return;
        widget._autoAnnotHoverAttached = true;

        widget.addEventListener('pointerenter', function() {
            _pendingPdfWidget = widget;
            _pendingBoard = false;
        });

        widget.addEventListener('pointerleave', function(e) {
            // Si on entre dans la toolbar, on neutralise les deux flags
            const related = e.relatedTarget;
            if (related && related.closest && related.closest('#draw-toolbar')) {
                _pendingPdfWidget = null;
                _pendingBoard = false;
                return;
            }
            if (_pendingPdfWidget === widget) _pendingPdfWidget = null;
        });
    }

    // ── Listeners sur le board (hors widgets PDF) ─────────────────────────
    function _attachBoardListeners() {
        const b = document.getElementById('board');
        if (!b) return;

        b.addEventListener('pointerenter', function(e) {
            // Entrer dans le board mais pas dans un widget PDF ni une UI flottante
            if (e.target && e.target.closest && e.target.closest('.widget[data-type="pdf"]')) return;
            if (e.target && e.target.closest && e.target.closest('.geo-tool-overlay')) return;
            _pendingBoard = true;
            _pendingPdfWidget = null;
        });

        // Délégation pointermove : quand le stylet/souris est sur le board
        b.addEventListener('pointermove', function(e) {
            const onPdf = e.target && e.target.closest && e.target.closest('.widget[data-type="pdf"]');
            const onGeo = e.target && e.target.closest && e.target.closest('.geo-tool-overlay');
            if (!onPdf && !onGeo) {
                _pendingBoard = true;
                _pendingPdfWidget = null;
            }
        });

        b.addEventListener('pointerleave', function(e) {
            const related = e.relatedTarget;
            if (related && related.closest && related.closest('#draw-toolbar')) {
                _pendingBoard = false;
                _pendingPdfWidget = null;
                return;
            }
            _pendingBoard = false;
        });
    }

    // ── Attache les listeners sur tous les widgets PDF existants ──────────
    function _attachToAllPdfWidgets() {
        document.querySelectorAll('.widget[data-type="pdf"]').forEach(_attachHoverToPdfWidget);
    }

    // ── Observe les nouveaux widgets PDF ajoutés dynamiquement ───────────
    function _observeNewWidgets() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    if (node.matches && node.matches('.widget[data-type="pdf"]')) {
                        _attachHoverToPdfWidget(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.widget[data-type="pdf"]').forEach(_attachHoverToPdfWidget);
                    }
                });
                // Widget PDF supprimé (bouton fermer) → repasser en mode board si c'était la cible annotée
                mutation.removedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    const wasAnnotTarget = (_pdfAnnotMode && _pdfAnnotWidget && (
                        node === _pdfAnnotWidget || node.contains && node.contains(_pdfAnnotWidget)
                    ));
                    if (wasAnnotTarget) {
                        _switchToFreeDrawing();
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ── Initialisation ────────────────────────────────────────────────────
    function _init() {
        _attachToAllPdfWidgets();
        _attachBoardListeners();
        _observeNewWidgets();
        // Listener global en capture : mousedown (souris) + pointerdown (stylet/touch)
        document.addEventListener('mousedown',   _onGlobalMouseDown, true);
        document.addEventListener('pointerdown', _onGlobalPointerDown, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }
})();

// ── Rafraîchissement curseur lors d'un changement de couleur ─────────────
// cpickDispatch (color-picker.js) met à jour window._drawColor pour 'draw-color'.
// On le wrappe pour rafraîchir le curseur board ET le curseur PDF pen.
(function() {
    function _refreshDrawCursorOnColor() {
        // Board : mode libre ou surligneur
        if (typeof isDrawMode !== 'undefined' && isDrawMode
            && typeof currentDrawMode !== 'undefined'
            && (currentDrawMode === 'free' || currentDrawMode === 'highlight')) {
            updateDrawCursor();
        }
        // PDF annotation : outil pen actif
        if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode
            && typeof _pdfAnnotTool !== 'undefined' && _pdfAnnotTool === 'pen') {
            const cursor = _pdfCursor('pen');
            if (typeof _pdfAnnotEvTarget !== 'undefined' && _pdfAnnotEvTarget) {
                _pdfAnnotEvTarget.style.setProperty('cursor', cursor, 'important');
                _pdfAnnotEvTarget.querySelectorAll('*').forEach(el => {
                    if (!el.closest || !el.closest('.editor-toolbar'))
                        el.style.setProperty('cursor', cursor, 'important');
                });
            }
            if (typeof _pdfAnnotCanvas !== 'undefined' && _pdfAnnotCanvas)
                _pdfAnnotCanvas.style.cursor = cursor;
        }
    }

    // Wrapper appliqué après chargement de color-picker.js
    function _patchCpickDispatch() {
        if (typeof cpickDispatch !== 'function') return;
        const _orig = cpickDispatch;
        cpickDispatch = function(id, color) {
            _orig(id, color);
            if (id === 'draw-color') _refreshDrawCursorOnColor();
        };
    }
    // Tenter immédiatement, puis au DOMContentLoaded si pas encore disponible
    if (typeof cpickDispatch === 'function') {
        _patchCpickDispatch();
    } else {
        document.addEventListener('DOMContentLoaded', _patchCpickDispatch);
    }
})();
