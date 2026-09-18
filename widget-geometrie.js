// =========================================================================
// WIDGET GÉOMÉTRIE — Le Bureau du Prof
// Barre flottante avec Règle, Équerre et Compas
// Les outils sont draggables/pivotables sur le tableau et peuvent tracer.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> :
//      <script src="widget-geometrie.js"></script>
//
//   2. Ajouter dans le sous-menu Outils :
//      <div class="mm-sub-item" onclick="toggleGeoToolbar();closeMainMenu()">
//          <span class="mm-ico">📐</span>&nbsp;&nbsp;Géométrie
//      </div>
// =========================================================================

(function () {

// ── CSS ──────────────────────────────────────────────────────────────────
const STYLE = `
/* ── Barre flottante géométrie (au-dessus de la barre dessin) ── */
#geo-toolbar {
    position: fixed;
    bottom: 80px;
    left: 140px;
    background: #1F1F21;
    border-radius: 12px;
    display: none;
    padding: 7px 15px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
    z-index: 13000;
    border: 1px solid #554466;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
#geo-toolbar.open { display: flex; }
.geo-label {
    background: #1F1F21;
    color: #a78bfa;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    line-height: 1;
    white-space: nowrap;
}
.geo-sep { width:1px; height:30px; background:#444; }
.geo-tool-btn {
    cursor: pointer;
    background: #2a2a36;
    color: #eee;
    border: 1px solid #555;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
    line-height: 1.3;
}
.geo-tool-btn:hover { background: #3a3a4a; border-color: #7ab8f5; }
.geo-tool-btn.active { background: #1a3a5a; border-color: #6aaee8; color: #6aaee8; }
.geo-tool-btn .ico { font-size: 18px; }
.geo-tool-btn .ico svg { display: block; width: 18px; height: 18px; }
.geo-close-btn {
    margin-left: auto;
    background: #6c757d;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    font-size: 13px;
}

/* ── Outils SVG sur le tableau ── */
.geo-tool-overlay {
    position: absolute;
    z-index: 9500;
    cursor: move;
    user-select: none;
    touch-action: none;
}
.geo-tool-overlay:active { cursor: grabbing; }
.geo-tool-overlay.geo-selected { filter: drop-shadow(0 0 6px rgba(106,174,232,0.8)); }
.geo-tool-overlay button { cursor: pointer; }
.geo-tool-overlay svg [data-nodrag="true"] { cursor: pointer !important; }
.geo-tool-overlay svg [data-nodrag="true"] * { cursor: pointer !important; }
/* Mine du compas : curseur crayon */
.geo-tool-overlay svg [data-mine="true"],
.geo-tool-overlay svg [data-mine="true"] * { cursor: crosshair !important; }
.geo-rot-handle { cursor: pointer !important; }

/* Poignée rotation */
.geo-rot-handle {
    position: absolute;
    width: 20px; height: 20px;
    background: #6aaee8;
    border-radius: 50%;
    border: 2px solid #fff;
    cursor: pointer;
    z-index: 2;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    color: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

/* Bouton tracer sur l'outil */
.geo-trace-btn {
    position: absolute;
    background: #a78bfa;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer !important;
    z-index: 3;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: background 0.15s;
}
.geo-trace-btn:hover { background: #7c3aed; cursor: pointer !important; }

/* Bouton fermer l'outil */
.geo-close-tool {
    position: absolute;
    background: #e74c3c;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 18px; height: 18px;
    font-size: 10px;
    cursor: pointer;
    z-index: 3;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Compas : curseur rayon */
.geo-compass-radius-wrap {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 3;
    background: rgba(26,26,34,0.85);
    border-radius: 6px;
    padding: 3px 7px;
    border: 1px solid #555;
    font-size: 10px;
    color: #ccc;
    white-space: nowrap;
}
.geo-compass-radius-wrap input[type=range] {
    width: 70px;
    accent-color: #a78bfa;
    cursor: pointer !important;
}
`;

if (!document.getElementById('geo-style')) {
    const s = document.createElement('style');
    s.id = 'geo-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
}

// ── Barre flottante ───────────────────────────────────────────────────────
const bar = document.createElement('div');
bar.id = 'geo-toolbar';
bar.innerHTML = `
    <span style="color:#a78bfa;font-size:11px;font-weight:700;white-space:nowrap;">📐 Outils géométrie</span>
    <div class="geo-sep"></div>
    <button class="geo-tool-btn" id="geo-btn-regle"   onclick="geoSpawnTool('regle')">
        <span class="ico">📏</span><span>Règle</span>
    </button>
    <button class="geo-tool-btn" id="geo-btn-equerre" onclick="geoSpawnTool('equerre')">
        <span class="ico">📐</span><span>Équerre</span>
    </button>
    <button class="geo-tool-btn" id="geo-btn-compas"  onclick="geoSpawnTool('compas')">
        <span class="ico">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <!-- Poignée -->
                <circle cx="11.8" cy="2.6" r="1.2" fill="#e0a94a"/>
                <line x1="11.8" y1="3.8" x2="11.8" y2="5.4" stroke="#e0a94a" stroke-width="1.6" stroke-linecap="round"/>
                <!-- Charnière -->
                <circle cx="11.8" cy="6.2" r="1.8" fill="#d5d5d5"/>
                <!-- Branche gauche + pointe métallique -->
                <line x1="11.8" y1="7.6" x2="7.2" y2="20.1" stroke="#c2c2c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polygon points="6.1,20.1 8.3,20.1 7.2,22.7" fill="#e6e6e6"/>
                <!-- Branche droite (coude) + mine -->
                <line x1="11.8" y1="7.6" x2="15.1" y2="15.4" stroke="#c2c2c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="15.1" y1="15.4" x2="16.6" y2="20.1" stroke="#c2c2c2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="16.6" cy="20.1" r="1.3" fill="#e74c3c"/>
            </svg>
        </span>
        <span>Compas</span>
    </button>
`;
document.body.appendChild(bar);

// ── API publique ──────────────────────────────────────────────────────────
window.toggleGeoToolbar = function () {
    bar.classList.toggle('open');
    _updateGeoPdfBadge();
};
window.closeGeoToolbar = function () {
    bar.classList.remove('open');
    const btn = document.getElementById('geo-draw-btn');
    if (btn) {
        btn.style.background = '#2a2a36';
        btn.style.borderColor = '#555';
        btn.classList.remove('btn-mode-active');
    }
};

// Alias utilisé par draw.js pour fermer ce sous-menu
window.closeGeoSubmenu = window.closeGeoToolbar;

// Appelé depuis le bouton dans la barre dessin
window.toggleGeoFromDrawBar = function () {
    const btn = document.getElementById('geo-draw-btn');
    const isOpen = bar.classList.contains('open');
    if (isOpen) {
        bar.classList.remove('open');
        if (btn) { btn.style.background = '#2a2a36'; btn.style.borderColor = '#555'; btn.classList.remove('btn-mode-active'); }
    } else {
        // Fermer le sous-menu figures géométriques avant d'ouvrir celui-ci
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        if (typeof _setBtnActive === 'function') {
            _setBtnActive('draw-figures-btn', false, 'figures');
            _setBtnActive('draw-select-btn', false);
            _setBtnActive('draw-free-btn', false);
        } else {
            const figBtn = document.getElementById('draw-figures-btn');
            if (figBtn) { figBtn.style.borderColor = '#444'; figBtn.style.background = '#2a2a2e'; figBtn.style.color = '#aaa'; }
            const selBtn = document.getElementById('draw-select-btn');
            if (selBtn) { selBtn.style.borderColor = '#444'; selBtn.style.background = '#2a2a2e'; selBtn.style.color = '#aaa'; }
            const freeBtn = document.getElementById('draw-free-btn');
            if (freeBtn) { freeBtn.style.borderColor = '#444'; freeBtn.style.background = '#2a2a2e'; freeBtn.style.color = '#aaa'; }
        }
        bar.classList.add('open');
        if (btn) { btn.style.background = '#1a2a4a'; btn.style.borderColor = '#a78bfa'; btn.classList.add('btn-mode-active'); }
        _updateGeoPdfBadge();
    }
};

// ── Badge PDF dans la barre géo ───────────────────────────────────────────
// Affiche un indicateur "📄 Tracé sur PDF" quand le mode annotation PDF est actif
function _updateGeoPdfBadge() {
    let badge = document.getElementById('geo-pdf-badge');
    const inPdfMode = !!window._pdfAnnotMode;
    if (inPdfMode && bar.classList.contains('open')) {
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'geo-pdf-badge';
            badge.style.cssText = `
                display:flex; align-items:center; gap:4px;
                background:#1a3a20; color:#5ddd7e;
                border:1px solid #3dbb5e; border-radius:7px;
                padding:3px 8px; font-size:10px; font-weight:700;
                white-space:nowrap; pointer-events:none;
                animation: geo-badge-in 0.2s ease;
            `;
            badge.textContent = '📄 Tracé sur PDF actif';
            bar.appendChild(badge);
        }
    } else if (badge) {
        badge.remove();
    }
}

// ── Utilitaire : tracer sur le canvas de dessin ───────────────────────────
function getDrawCanvas() {
    return document.getElementById('draw-canvas');
}

function getDrawColor() {
    // Lire la couleur active du crayon (même logique que draw.js)
    if (window._drawColor) return window._drawColor;
    if (typeof cpickGetValue === 'function') {
        const c = cpickGetValue('draw-color');
        if (c) return c;
    }
    const swatch = document.querySelector('#cpick-draw-color .cpick-swatch');
    if (swatch && swatch.style.background) return swatch.style.background;
    const native = document.getElementById('cpick-native-draw-color');
    if (native) return native.value;
    return '#222222';
}

function getDrawSize() {
    const el = document.getElementById('draw-size');
    return el ? parseInt(el.value) || 3 : 3;
}

function traceOnCanvas(pointsList) {
    // pointsList : tableau de tableaux [{x,y}] — un tableau par trait
    // ── Mode annotation PDF : tracer sur le canvas d'annotation ─────────────
    if (window._pdfAnnotMode && window._pdfAnnotWidget) {
        _traceOnPdfCanvas(pointsList);
        return;
    }

    // ── Mode board normal ────────────────────────────────────────────────────
    const color = getDrawColor();
    const size  = getDrawSize();

    if (typeof window.strokes !== 'undefined' && typeof window.redrawStrokes === 'function') {
        pointsList.forEach(function (pts) {
            if (pts.length < 2) return;
            window.strokes.push({ points: pts, color: color, size: size });
        });
        window.redrawStrokes();
        if (typeof saveBoard === 'function') saveBoard();
        return;
    }

    // Fallback : tracer directement sur le canvas sans passer par strokes
    const canvas = getDrawCanvas();
    if (!canvas) { alert('Canvas de dessin non disponible.'); return; }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    pointsList.forEach(function (pts) {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
        ctx.stroke();
    });
    ctx.restore();
    if (typeof saveBoard === 'function') saveBoard();
}

// ── Tracé sur le canvas d'annotation PDF ─────────────────────────────────
// Convertit les points board (px relatifs au board) en pixels canvas PDF
// internes, puis pousse chaque trait via addFigureStroke() de l'API.
function _traceOnPdfCanvas(pointsList) {
    const api = window._pdfAnnotWidget && window._pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    const annotCanvas = api.getAnnotCanvas ? api.getAnnotCanvas() : null;
    if (!annotCanvas) return;

    // Rect CSS du canvas d'annotation dans le viewport
    const canvasRect = annotCanvas.getBoundingClientRect();
    // Rect du board dans le viewport
    // Les points geo sont normalement relatifs au board.
    // En mode plein écran (overlay fixed), les overlays sont dans le body :
    // getOverlayTransform() retourne des coords viewport → origin = {0,0}.
    // On détecte via la présence d'un overlay fixed.
    const hasFixedOverlay = !!document.querySelector('.geo-tool-overlay[data-geo-fixed="true"]');
    const boardEl = document.getElementById('board');
    const boardRect = (!hasFixedOverlay && boardEl)
        ? boardEl.getBoundingClientRect()
        : { left: 0, top: 0 };

    // Ratio px CSS → px canvas interne (tient compte du zoom PDF et du devicePixelRatio)
    const scaleX = annotCanvas.width  / canvasRect.width;
    const scaleY = annotCanvas.height / canvasRect.height;

    const color = getDrawColor();
    const size  = getDrawSize();

    pointsList.forEach(function (pts) {
        if (pts.length < 2) return;

        // board px → viewport px → CSS canvas px → canvas interne px
        const pxPts = pts.map(function (p) {
            const vx = boardRect.left + p.x;   // px viewport
            const vy = boardRect.top  + p.y;
            const cx = vx - canvasRect.left;    // px CSS dans le canvas
            const cy = vy - canvasRect.top;
            return { x: cx * scaleX, y: cy * scaleY }; // px canvas interne
        });

        // Ne garder que les points visibles dans le canvas (avec une marge)
        const W = annotCanvas.width, H = annotCanvas.height;
        const MARGIN = Math.max(size * scaleX * 4, 20);
        const visible = pxPts.filter(p =>
            p.x >= -MARGIN && p.x <= W + MARGIN &&
            p.y >= -MARGIN && p.y <= H + MARGIN
        );
        if (visible.length < 2) return;

        // addFigureStroke attend des pixels canvas internes (toNorm() est appelé dedans)
        if (typeof api.addFigureStroke === 'function') {
            api.addFigureStroke(color, size, visible, null, 0);
        } else {
            // Fallback : dessin direct si l'API n'est pas disponible
            _traceDirectOnPdfCanvas(annotCanvas, visible, color, size);
        }
    });

    // Déclencher la sauvegarde PDF
    if (typeof window.saveBoard === 'function') window.saveBoard();
}

// Fallback dessin direct sur le canvas PDF (sans sauvegarde dans annotLayers)
function _traceDirectOnPdfCanvas(annotCanvas, pxPts, color, size) {
    const ctx = annotCanvas.getContext('2d');
    if (!ctx || pxPts.length < 2) return;
    // Adapter l'épaisseur au scale du canvas (comme le fait pdf-viewer.js)
    const sizeScaled = size * annotCanvas.width / 600;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = sizeScaled;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(pxPts[0].x, pxPts[0].y);
    pxPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();
}

// ── Spawn d'un outil ─────────────────────────────────────────────────────
window.geoSpawnTool = function (type) {
    const board = document.getElementById('board');
    if (!board) return;

    // Centrer dans le viewport (cx/cy toujours en coordonnées board-relatives)
    const bRect = board.getBoundingClientRect();
    const cx = (window.innerWidth  / 2) - bRect.left;
    const cy = (window.innerHeight / 2) - bRect.top;

    if      (type === 'regle')   spawnRegle(board, cx, cy);
    else if (type === 'equerre') spawnEquerre(board, cx, cy);
    else if (type === 'compas')  spawnCompas(board, cx, cy);

    // ── Mode plein écran PDF : l'overlay est dans le board (position:absolute,
    //    z-index:9500) mais le widget PDF est en position:fixed z-index:9999 →
    //    l'overlay est invisible. On le sort du board, on le passe en fixed
    //    sur le body avec un z-index supérieur au widget PDF.
    const pdfFullboard = document.querySelector('.editor-container.wf-pdf-fullboard');
    if (pdfFullboard) {
        const overlays = board.querySelectorAll('.geo-tool-overlay');
        const overlay  = overlays[overlays.length - 1];
        if (overlay) {
            // Position actuelle en coordonnées board → convertir en viewport
            const oLeft = parseFloat(overlay.style.left || 0);
            const oTop  = parseFloat(overlay.style.top  || 0);
            board.removeChild(overlay);
            overlay.style.position = 'fixed';
            overlay.style.left     = (bRect.left + oLeft) + 'px';
            overlay.style.top      = (bRect.top  + oTop)  + 'px';
            overlay.style.zIndex   = '10000';
            overlay.dataset.geoFixed = 'true';
            document.body.appendChild(overlay);

            // Pour le compas : plus de ctrlBar externe à repositionner
            // if (type === 'compas' && typeof overlay._repositionBar === 'function') {
            //     overlay._repositionBar();
            // }
        }
    }
};

// ── Helpers drag + rotate ────────────────────────────────────────────────
function makeDraggableGeo(overlay, onDragEnd) {
    function startGeoDrag(clientX, clientY) {
        // En mode fixed (parent = body), la référence est le viewport (left:0,top:0).
        // En mode board (parent = #board), la référence est le coin haut-gauche du board.
        const isFixed = overlay.dataset.geoFixed === 'true' || overlay.style.position === 'fixed';
        const parent  = isFixed ? null : overlay.parentElement;
        const bRect   = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
        const startX  = clientX - bRect.left - parseFloat(overlay.style.left || 0);
        const startY  = clientY - bRect.top  - parseFloat(overlay.style.top  || 0);
        overlay.classList.add('geo-selected');
        overlay.style.cursor = 'grabbing';

        function onMove(ev) {
            if (ev.pointerType === 'mouse' && ev.type === 'pointermove') return; // déjà géré par mousemove
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
            overlay.style.left = (cx - bRect.left - startX) + 'px';
            overlay.style.top  = (cy - bRect.top  - startY) + 'px';
            if (onDragEnd) onDragEnd(); // repositionne la barre en temps réel
        }
        function onEnd(ev) {
            if (ev && ev.type === 'pointerup' && ev.pointerType === 'mouse') return; // déjà géré par mouseup
            overlay.style.cursor = 'move';
            document.removeEventListener('mousemove',    onMove);
            document.removeEventListener('mouseup',      onEnd);
            document.removeEventListener('touchmove',    onMove);
            document.removeEventListener('touchend',     onEnd);
            document.removeEventListener('pointermove',  onMove);
            document.removeEventListener('pointerup',    onEnd);
            document.removeEventListener('pointercancel',onEnd);
            if (onDragEnd) onDragEnd();
        }
        document.addEventListener('mousemove',    onMove);
        document.addEventListener('mouseup',      onEnd);
        document.addEventListener('touchmove',    onMove, { passive: false });
        document.addEventListener('touchend',     onEnd);
        document.addEventListener('pointermove',  onMove);
        document.addEventListener('pointerup',    onEnd);
        document.addEventListener('pointercancel',onEnd);
    }

    overlay.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('geo-rot-handle') ||
            e.target.classList.contains('geo-trace-btn')  ||
            e.target.classList.contains('geo-close-tool') ||
            e.target.tagName === 'INPUT' ||
            e.target.dataset.nodrag === 'true' ||
            (e.target.parentElement && e.target.parentElement.dataset.nodrag === 'true')) return;
        e.preventDefault(); e.stopPropagation();
        startGeoDrag(e.clientX, e.clientY);
    });
    // Stylet/touch : démarrer le drag et bloquer draw.js sur le corps de l'outil
    overlay.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return; // déjà géré par mousedown
        // Laisser les éléments avec leurs propres listeners gérer l'event
        if (e.target && e.target.dataset && e.target.dataset.nodrag === 'true') return;
        if (e.target && e.target.parentElement && e.target.parentElement.dataset &&
            e.target.parentElement.dataset.nodrag === 'true') return;
        if (e.target && (e.target.classList.contains('geo-rot-handle') ||
            e.target.classList.contains('geo-trace-btn')  ||
            e.target.classList.contains('geo-close-tool') ||
            e.target.tagName === 'INPUT')) return;
        // Corps de l'outil : démarrer le drag et bloquer draw.js
        e.stopPropagation();
        e.preventDefault();
        startGeoDrag(e.clientX, e.clientY);
    });
    overlay.addEventListener('touchstart', function (e) {
        if (e.target.classList.contains('geo-rot-handle') ||
            e.target.classList.contains('geo-trace-btn')  ||
            e.target.classList.contains('geo-close-tool') ||
            e.target.tagName === 'INPUT' ||
            e.target.dataset.nodrag === 'true' ||
            (e.target.parentElement && e.target.parentElement.dataset.nodrag === 'true')) return;
        e.preventDefault(); e.stopPropagation();
        startGeoDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
}

function makeRotatableGeo(overlay, rotHandle, pivotFn) {
    rotHandle.ondblclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        overlay.style.transform = '';
        overlay.dataset.angle = '0';
    };

    function startGeoRotate(clientX, clientY) {
        const rect = overlay.getBoundingClientRect();
        let cx, cy;
        if (pivotFn) {
            // pivotFn() retourne {x, y} en coordonnées locales de l'overlay (px depuis le coin haut-gauche)
            // On convertit en coordonnées écran en tenant compte du scale éventuel
            const scaleX = rect.width  / overlay.offsetWidth;
            const scaleY = rect.height / overlay.offsetHeight;
            const piv = pivotFn();
            cx = rect.left + piv.x * scaleX;
            cy = rect.top  + piv.y * scaleY;
        } else {
            cx = rect.left + rect.width  / 2;
            cy = rect.top  + rect.height / 2;
        }
        // Appliquer le transform-origin au pivot voulu
        if (pivotFn) {
            const piv = pivotFn();
            overlay.style.transformOrigin = `${piv.x}px ${piv.y}px`;
        } else {
            overlay.style.transformOrigin = '';
        }
        const startAngle = Math.atan2(clientY - cy, clientX - cx);
        const startRot   = parseFloat(overlay.dataset.angle || 0);
        const indicator  = document.getElementById('rotation-indicator');

        function onMove(ev) {
            const px = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const py = ev.touches ? ev.touches[0].clientY : ev.clientY;
            const newRot = startRot + (Math.atan2(py - cy, px - cx) - startAngle) * 180 / Math.PI;
            const snapped = geoSnapRotation(newRot);
            overlay.style.transform = `rotate(${snapped}deg)`;
            overlay.dataset.angle = snapped;
            if (indicator) {
                const deg = Math.round(((snapped % 360) + 360) % 360);
                const rotDeg = document.getElementById('rot-deg');
                if (rotDeg) rotDeg.textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = px + 16 + 'px';
                indicator.style.top  = py + 'px';
                const hint = indicator.querySelector('.rot-reset-hint');
                if (hint) hint.style.display = (deg === 0) ? 'none' : 'inline';
            }
        }
        function onEnd() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            document.onmousemove = null;
            document.onmouseup   = null;
            const ind = document.getElementById('rotation-indicator');
            if (ind) ind.style.display = 'none';
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }

    rotHandle.onmousedown = function (e) {
        e.preventDefault(); e.stopPropagation();
        startGeoRotate(e.clientX, e.clientY);
    };
    rotHandle.addEventListener('touchstart', function (e) {
        e.preventDefault(); e.stopPropagation();
        startGeoRotate(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
}

function geoSnapRotation(deg) {
    const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    const norm = ((deg % 360) + 360) % 360;
    for (const s of snaps) {
        if (Math.abs(norm - s) < 2) return s === 360 ? 0 : s;
    }
    return deg;
}

// ── Helper : rend un bouton cliquable au toucher même quand le parent
//    appelle preventDefault() sur touchstart ────────────────────────────────
function addTouchClick(btn, handler) {
    btn.addEventListener('touchend', function (e) {
        e.stopPropagation();
        e.preventDefault();
        handler(e);
    }, { passive: false });
}

// ── Obtenir la transformation monde d'un overlay ─────────────────────────
function getOverlayTransform(overlay) {
    const x = parseFloat(overlay.style.left || 0);
    const y = parseFloat(overlay.style.top  || 0);
    // Lire l'angle depuis style.transform (cohérent avec makeRotatableGeo)
    const m = overlay.style.transform && overlay.style.transform.match(/rotate\(([-\d.]+)deg\)/);
    const angle = m ? parseFloat(m[1]) * Math.PI / 180 : 0;
    // Respecter le transform-origin si défini (ex: équerre pivote sur son angle droit)
    let cx, cy;
    if (overlay.style.transformOrigin && overlay.style.transformOrigin !== '') {
        const parts = overlay.style.transformOrigin.split(' ');
        cx = x + parseFloat(parts[0]);
        cy = y + parseFloat(parts[1]);
    } else {
        cx = x + overlay.offsetWidth  / 2;
        cy = y + overlay.offsetHeight / 2;
    }
    return { x, y, angle, cx, cy };
}

// Rotation d'un point autour d'un centre
function rotatePoint(px, py, cx, cy, angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return {
        x: cos * (px - cx) - sin * (py - cy) + cx,
        y: sin * (px - cx) + cos * (py - cy) + cy
    };
}

// ── RÈGLE ─────────────────────────────────────────────────────────────────
function spawnRegle(board, cx, cy) {
    const PAD    = 20;    // espace avant le 0 et après la fin
    const CM_UNIT = 40;   // px par cm
    const TENTH   = CM_UNIT / 10;
    const H       = 60;
    const BTN_H   = 32;
    const TOTAL_H = H + BTN_H;
    const MIN_CM_W = 80;  // longueur utile minimale (2cm)
    const MAX_CM_W = 2000;

    // Longueur utile courante (mutable)
    let cmW = 800; // 20cm par défaut

    // Largeur totale = longueur utile + 2 paddings
    function totalW() { return cmW + 2 * PAD; }

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - totalW()/2}px; top:${cy - TOTAL_H/2}px; width:${totalW()}px; height:${TOTAL_H}px;`;

    // ── SVG règle ──
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', totalW());
    svg.setAttribute('height', H);
    svg.style.cssText = 'display:block; position:absolute; top:0; left:0; pointer-events:none;';

    // Fond
    const rectBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectBg.setAttribute('x', 0); rectBg.setAttribute('y', 0);
    rectBg.setAttribute('width', totalW()); rectBg.setAttribute('height', H);
    rectBg.setAttribute('rx', 4);
    rectBg.setAttribute('fill', 'rgba(255,245,180,0.95)');
    rectBg.setAttribute('stroke', '#b8860b'); rectBg.setAttribute('stroke-width', '1.5');
    svg.appendChild(rectBg);

    // Groupes graduations (reconstruits au resize)
    let grpCm = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let grpPx = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(grpCm);
    svg.appendChild(grpPx);

    let _regleMode = 'cm';

    function buildGradCm(w) {
        while (grpCm.firstChild) grpCm.removeChild(grpCm.firstChild);
        for (let t10 = 0; t10 <= w / TENTH; t10++) {
            const x = PAD + t10 * TENTH;
            if (x > PAD + w + 1) break;
            const isUnit = t10 % 10 === 0;
            const isHalf = t10 % 5  === 0 && !isUnit;
            const tickH  = isUnit ? 22 : (isHalf ? 13 : 7);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x); line.setAttribute('y1', 0);
            line.setAttribute('x2', x); line.setAttribute('y2', tickH);
            line.setAttribute('stroke', '#7a5c00');
            line.setAttribute('stroke-width', isUnit ? '1.5' : '0.6');
            grpCm.appendChild(line);
            if (isUnit) {
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', x); txt.setAttribute('y', 36);
                txt.setAttribute('text-anchor', 'middle');
                txt.setAttribute('font-size', '10'); txt.setAttribute('fill', '#7a5c00');
                txt.setAttribute('font-family', 'monospace');
                txt.textContent = t10 / 10;
                grpCm.appendChild(txt);
            }
        }
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', PAD + w - 4); lbl.setAttribute('y', 12);
        lbl.setAttribute('text-anchor', 'end');
        lbl.setAttribute('font-size', '9'); lbl.setAttribute('font-weight', 'bold');
        lbl.setAttribute('fill', '#7a5c00'); lbl.setAttribute('font-family', 'monospace');
        lbl.textContent = 'cm';
        grpCm.appendChild(lbl);
    }

    function buildGradPx(w) {
        while (grpPx.firstChild) grpPx.removeChild(grpPx.firstChild);
        for (let i = 0; i * 10 <= w; i++) {
            const pxVal = i * 10;
            const x     = PAD + pxVal;
            if (x > PAD + w + 1) break;
            const is100 = pxVal % 100 === 0;
            const is50  = pxVal % 50  === 0 && !is100;
            const tickH = is100 ? 22 : (is50 ? 13 : 7);
            const line  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x); line.setAttribute('y1', 0);
            line.setAttribute('x2', x); line.setAttribute('y2', tickH);
            line.setAttribute('stroke', '#1a4a7a');
            line.setAttribute('stroke-width', is100 ? '1.5' : (is50 ? '0.9' : '0.5'));
            grpPx.appendChild(line);
            if (is100) {
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', x); txt.setAttribute('y', 36);
                txt.setAttribute('text-anchor', 'middle');
                txt.setAttribute('font-size', '10'); txt.setAttribute('fill', '#1a4a7a');
                txt.setAttribute('font-family', 'monospace');
                txt.textContent = pxVal;
                grpPx.appendChild(txt);
            }
        }
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', PAD + w - 4); lbl.setAttribute('y', 12);
        lbl.setAttribute('text-anchor', 'end');
        lbl.setAttribute('font-size', '9'); lbl.setAttribute('font-weight', 'bold');
        lbl.setAttribute('fill', '#1a4a7a'); lbl.setAttribute('font-family', 'monospace');
        lbl.textContent = 'px';
        grpPx.appendChild(lbl);
    }

    // Construire les graduations initiales
    buildGradCm(cmW);
    buildGradPx(cmW);
    grpPx.style.display = 'none';

    // ── Bande de boutons SOUS la règle ───────────────────────────────────
    const btnBar = document.createElement('div');
    btnBar.style.cssText = `
        position:absolute; top:${H}px; left:0; width:${totalW()}px; height:${BTN_H}px;
        display:flex; align-items:center; justify-content:center; gap:8px;
        background:rgba(26,26,34,0.82); border-radius:0 0 8px 8px;
        border:1px solid #554466; border-top:none;
        box-sizing:border-box; padding:0 8px;
        pointer-events:auto;
    `;

    // Bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `position:relative; width:20px; height:20px; font-size:13px;
        border-radius:50%; background:#e74c3c; color:#fff; border:none;
        cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;`;
    closeBtn.onmousedown = e => e.stopPropagation();
    closeBtn.onclick     = e => { e.stopPropagation(); overlay.remove(); };
    addTouchClick(closeBtn, () => { overlay.remove(); });

    // Poignée rotation
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `position:relative; width:22px; height:22px; font-size:12px;
        border-radius:50%; background:#6aaee8; color:#fff; border:2px solid #fff;
        cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);`;

    // Bouton tracer
    const traceBtn = document.createElement('button');
    traceBtn.className = 'geo-trace-btn';
    traceBtn.textContent = '✏️ Tracer la ligne';
    traceBtn.style.cssText = 'position:relative; cursor:pointer !important; flex-shrink:0; font-size:11px; padding:3px 8px;';
    traceBtn.onmousedown = e => e.stopPropagation();
    traceBtn.onclick = function (e) {
        e.stopPropagation();
        const t = getOverlayTransform(overlay);
        const ox = parseFloat(overlay.style.left || 0);
        const oy = parseFloat(overlay.style.top  || 0);
        // Le bord traceur est le bord supérieur de la règle (y = oy)
        const p1 = rotatePoint(ox + PAD,       oy, t.cx, t.cy, t.angle);
        const p2 = rotatePoint(ox + PAD + cmW, oy, t.cx, t.cy, t.angle);
        const pts = [];
        const steps = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
        for (let i = 0; i <= steps; i++) {
            pts.push({ x: p1.x + (p2.x - p1.x) * i / steps,
                       y: p1.y + (p2.y - p1.y) * i / steps });
        }
        traceOnCanvas([pts]);
    };
    addTouchClick(traceBtn, function() { traceBtn.onclick({ stopPropagation: ()=>{} }); });

    // Bouton toggle cm ↔ px
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'geo-trace-btn';
    toggleBtn.textContent = 'px';
    toggleBtn.title = 'Basculer cm / px';
    toggleBtn.style.cssText = `position:relative; cursor:pointer !important; flex-shrink:0;
        font-size:11px; padding:3px 10px; background:#1a4a7a; border-color:#6aaee8; color:#7ab8f5;`;
    toggleBtn.onmousedown = e => e.stopPropagation();
    toggleBtn.onclick = function(e) {
        e.stopPropagation();
        _regleMode = _regleMode === 'cm' ? 'px' : 'cm';
        const isCm = _regleMode === 'cm';
        grpCm.style.display = isCm ? '' : 'none';
        grpPx.style.display = isCm ? 'none' : '';
        rectBg.setAttribute('fill', isCm ? 'rgba(255,245,180,0.95)' : 'rgba(210,235,255,0.95)');
        rectBg.setAttribute('stroke', isCm ? '#b8860b' : '#2a6aaa');
        toggleBtn.textContent = isCm ? 'px' : 'cm';
        toggleBtn.style.background    = isCm ? '#1a4a7a' : '#3a2a00';
        toggleBtn.style.borderColor   = isCm ? '#6aaee8' : '#b8860b';
        toggleBtn.style.color         = isCm ? '#7ab8f5' : '#f0c040';
    };
    addTouchClick(toggleBtn, function() { toggleBtn.onclick({ stopPropagation: ()=>{} }); });

    btnBar.appendChild(closeBtn);
    btnBar.appendChild(rotH);
    btnBar.appendChild(toggleBtn);
    btnBar.appendChild(traceBtn);

    // ── Poignée de redimensionnement (droite) ─────────────────────────────
    // Positionnée au centre-droit de la partie règle (SVG), en dehors du btnBar
    const resizeHandle = document.createElement('div');
    resizeHandle.title = 'Redimensionner la règle';
    resizeHandle.style.cssText = `
        position:absolute;
        right:-10px; top:${H/2 - 14}px;
        width:20px; height:28px;
        background:#f0c040;
        border:2px solid #b8860b;
        border-radius:5px;
        cursor:ew-resize;
        z-index:5;
        display:flex; align-items:center; justify-content:center;
        font-size:11px; color:#7a5c00; font-weight:bold;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        user-select:none; touch-action:none;
    `;
    resizeHandle.textContent = '⟺';

    // ── Fonction de mise à jour globale du layout au resize ───────────────
    function applyResize(newCmW) {
        cmW = Math.max(MIN_CM_W, Math.min(MAX_CM_W, newCmW));
        const W = totalW();
        // Overlay
        overlay.style.width = W + 'px';
        // SVG
        svg.setAttribute('width', W);
        rectBg.setAttribute('width', W);
        // Reconstruire les graduations
        buildGradCm(cmW);
        buildGradPx(cmW);
        // Réappliquer la visibilité du mode courant
        grpCm.style.display = _regleMode === 'cm' ? '' : 'none';
        grpPx.style.display = _regleMode === 'px' ? '' : 'none';
        // Barre de boutons
        btnBar.style.width = W + 'px';
    }

    // ── Drag resize (mouse) ───────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', function(e) {
        e.stopPropagation(); e.preventDefault();
        const startX   = e.clientX;
        const startCmW = cmW;
        // Tenir compte de la rotation de l'overlay pour projeter le déplacement
        const angleRad = parseFloat(overlay.dataset.angle || 0) * Math.PI / 180;

        function onMove(ev) {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            // Projeter dx/dy sur l'axe de la règle (direction = angle courant)
            const projected = dx * Math.cos(angleRad) + dy * Math.sin(angleRad);
            applyResize(startCmW + projected);
        }
        const startY = e.clientY;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', function up() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', up);
        });
    });

    // ── Drag resize (touch) ───────────────────────────────────────────────
    resizeHandle.addEventListener('touchstart', function(e) {
        e.stopPropagation(); e.preventDefault();
        const t0       = e.touches[0];
        const startX   = t0.clientX;
        const startY   = t0.clientY;
        const startCmW = cmW;
        const angleRad = parseFloat(overlay.dataset.angle || 0) * Math.PI / 180;

        function onMove(ev) {
            ev.preventDefault();
            const t = ev.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            const projected = dx * Math.cos(angleRad) + dy * Math.sin(angleRad);
            applyResize(startCmW + projected);
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', function up() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', up);
        });
    }, { passive: false });

    overlay.appendChild(svg);
    overlay.appendChild(btnBar);
    overlay.appendChild(resizeHandle);
    board.appendChild(overlay);

    makeDraggableGeo(overlay, null);
    makeRotatableGeo(overlay, rotH);
}

// ── ÉQUERRE ───────────────────────────────────────────────────────────────
function spawnEquerre(board, cx, cy) {
    const CAT = 300;
    const W = CAT + 20, H = CAT + 20;
    const OVW = W + 40, OVH = H + 40;

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - OVW/2}px; top:${cy - OVH/2}px; width:${OVW}px; height:${OVH}px;`;

    // ── SVG équerre ──
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', OVW);
    svg.setAttribute('height', OVH);
    svg.style.cssText = 'display:block; position:absolute; top:0; left:0; pointer-events:none;';

    const OX = 15, OY = H + 5;

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', `${OX},${OY} ${OX + CAT},${OY} ${OX},${OY - CAT}`);
    poly.setAttribute('fill', 'rgba(180,230,255,0.88)');
    poly.setAttribute('stroke', '#1a6eab'); poly.setAttribute('stroke-width', '2');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(poly);

    const sq = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    sq.setAttribute('points', `${OX + 14},${OY} ${OX + 14},${OY - 14} ${OX},${OY - 14}`);
    sq.setAttribute('fill', 'none');
    sq.setAttribute('stroke', '#1a6eab'); sq.setAttribute('stroke-width', '1.5');
    svg.appendChild(sq);

    function addAngle(x, y, txt) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', x); el.setAttribute('y', y);
        el.setAttribute('font-size', '11'); el.setAttribute('fill', '#1a6eab');
        el.setAttribute('font-weight', 'bold');
        el.textContent = txt; svg.appendChild(el);
    }
    addAngle(OX + CAT - 52, OY - 10,      '45°');
    addAngle(OX + 12,       OY - CAT + 46, '45°');
    addAngle(OX + 18,       OY - 18,       '90°');

    // ── Boutons intégrés dans l'équerre ──────────────────────────────────────
    // Fermer + Rotation : colonne verticale dans le coin haut gauche du triangle
    //   sous le label 45° du haut (OX+12, OY-CAT+46) → on part de y≈OY-CAT+60
    // Boutons tracer : ligne horizontale le long de la base, à l'intérieur

    // Bouton fermer — dans le triangle, sous le 45° du haut
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `position:absolute; left:${OX + 20}px; top:${OY - CAT + 60}px;
        width:22px; height:22px; font-size:13px;
        border-radius:50%; background:#e74c3c; color:#fff; border:none;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 4px rgba(0,0,0,0.4); z-index:4;`;
    closeBtn.onmousedown = e => e.stopPropagation();
    closeBtn.onclick     = e => { e.stopPropagation(); overlay.remove(); };
    addTouchClick(closeBtn, () => { overlay.remove(); });

    // Poignée rotation — juste sous le bouton fermer
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `position:absolute; left:${OX + 18}px; top:${OY - CAT + 88}px;
        width:26px; height:26px; font-size:13px;
        border-radius:50%; background:#6aaee8; color:#fff; border:2px solid #fff;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.5); z-index:4;`;

    // Boutons tracer — ligne horizontale le long de la base, à l'intérieur
    const traceBtnBar = document.createElement('div');
    traceBtnBar.style.cssText = `
        position:absolute; left:${OX + 30}px; top:${OY - 26}px;
        display:flex; align-items:center; gap:6px;
        pointer-events:auto; z-index:4;
    `;

    function makeTraceBtnInline(label, drawFn) {
        const b = document.createElement('button');
        b.className = 'geo-trace-btn';
        b.textContent = label;
        b.style.cssText = 'position:relative; cursor:pointer !important; flex-shrink:0; font-size:10px; padding:3px 7px;';
        b.onmousedown = e => e.stopPropagation();
        b.onclick = e => { e.stopPropagation(); drawFn(); };
        addTouchClick(b, drawFn);
        return b;
    }

    function makeLine(ax, ay, bx, by) {
        const t = getOverlayTransform(overlay);
        const p1 = rotatePoint(ax, ay, t.cx, t.cy, t.angle);
        const p2 = rotatePoint(bx, by, t.cx, t.cy, t.angle);
        const pts = [];
        const steps = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
        for (let i = 0; i <= steps; i++) {
            pts.push({ x: p1.x + (p2.x - p1.x) * i / steps,
                       y: p1.y + (p2.y - p1.y) * i / steps });
        }
        return pts;
    }

    const ox = () => parseFloat(overlay.style.left || 0);
    const oy = () => parseFloat(overlay.style.top  || 0);

    traceBtnBar.appendChild(makeTraceBtnInline('✏️ Base', () => {
        traceOnCanvas([makeLine(ox() + OX, oy() + OY, ox() + OX + CAT, oy() + OY)]);
    }));
    traceBtnBar.appendChild(makeTraceBtnInline('✏️ Côté', () => {
        traceOnCanvas([makeLine(ox() + OX, oy() + OY, ox() + OX, oy() + OY - CAT)]);
    }));
    traceBtnBar.appendChild(makeTraceBtnInline('📐 Angle droit', () => {
        traceOnCanvas([
            makeLine(ox() + OX, oy() + OY, ox() + OX + CAT, oy() + OY),
            makeLine(ox() + OX, oy() + OY, ox() + OX,       oy() + OY - CAT)
        ]);
    }));

    overlay.appendChild(svg);
    overlay.appendChild(closeBtn);
    overlay.appendChild(rotH);
    overlay.appendChild(traceBtnBar);
    board.appendChild(overlay);

    // Le sommet angle droit est à (OX, OY) dans l'overlay
    const equPivotFn = () => ({ x: OX, y: OY });
    overlay.style.transformOrigin = `${OX}px ${OY}px`;

    makeDraggableGeo(overlay, null);
    makeRotatableGeo(overlay, rotH, equPivotFn);
}

// ── COMPAS ────────────────────────────────────────────────────────────────
function spawnCompas(board, cx, cy) {
    const MAX_R = 400, MIN_R = 20;
    let radius = 100;

    // Dimensions de l'overlay — hauteur augmentée pour la poignée en haut
    const OVW = 460, OVH = 540;
    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - OVW/2}px; top:${cy - 80}px; width:${OVW}px; height:${OVH}px;`;

    // ── SVG compas (occupe tout l'overlay) ───────────────────────────────
    const SVG_W = OVW, SVG_H = OVH;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',  SVG_W);
    svg.setAttribute('height', SVG_H);
    svg.style.cssText = `display:block; position:absolute; top:0; left:0; pointer-events:all;`;

    // Defs : dégradés pour les bras
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    function makeArmGrad(id, col1, col2) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        g.setAttribute('id', id);
        g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
        g.setAttribute('x2', '100%'); g.setAttribute('y2', '0%');
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', '0%');   s1.setAttribute('stop-color', col1);
        const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', col2);
        g.appendChild(s1); g.appendChild(s2);
        return g;
    }
    defs.appendChild(makeArmGrad('grad-arm-left',  '#8a8a9a', '#4a4a5a'));
    defs.appendChild(makeArmGrad('grad-arm-right', '#7a9ab8', '#3a5a78'));
    svg.appendChild(defs);

    // Pivot (centre géométrique) — plus bas pour laisser place à la poignée
    const PIV_X = SVG_W / 2, PIV_Y = 110;
    const ARM_LEN = 200;

    // ── Poignée cylindrique (tenue entre 2 doigts) ───────────────────────
    // Cylindre vertical centré sur PIV_X, de y=GRIP_TOP à y=PIV_Y-14
    const GRIP_W = 14, GRIP_TOP = 40, GRIP_BOT = PIV_Y - 14;
    const gripGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const gripGradDef = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gripGradDef.setAttribute('id', 'grad-grip');
    gripGradDef.setAttribute('x1', '0%'); gripGradDef.setAttribute('y1', '0%');
    gripGradDef.setAttribute('x2', '100%'); gripGradDef.setAttribute('y2', '0%');
    const gs1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#4a5a7a');
    const gs2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    gs2.setAttribute('offset', '50%'); gs2.setAttribute('stop-color', '#8aaad8');
    const gs3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    gs3.setAttribute('offset', '100%'); gs3.setAttribute('stop-color', '#3a4a6a');
    gripGradDef.appendChild(gs1); gripGradDef.appendChild(gs2); gripGradDef.appendChild(gs3);
    defs.appendChild(gripGradDef);

    // Corps cylindre
    const gripBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gripBody.setAttribute('x', PIV_X - GRIP_W/2); gripBody.setAttribute('y', GRIP_TOP);
    gripBody.setAttribute('width', GRIP_W); gripBody.setAttribute('height', GRIP_BOT - GRIP_TOP);
    gripBody.setAttribute('rx', '4');
    gripBody.setAttribute('fill', 'url(#grad-grip)');
    gripBody.setAttribute('stroke', '#2a3a5a'); gripBody.setAttribute('stroke-width', '1');
    gripGroup.appendChild(gripBody);

    // Stries (rainures) sur la poignée
    const STRIPE_COUNT = 7;
    for (let i = 0; i < STRIPE_COUNT; i++) {
        const sy = GRIP_TOP + 8 + i * ((GRIP_BOT - GRIP_TOP - 16) / (STRIPE_COUNT - 1));
        const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stripe.setAttribute('x1', PIV_X - GRIP_W/2 + 2); stripe.setAttribute('y1', sy);
        stripe.setAttribute('x2', PIV_X + GRIP_W/2 - 2); stripe.setAttribute('y2', sy);
        stripe.setAttribute('stroke', 'rgba(0,0,0,0.25)'); stripe.setAttribute('stroke-width', '1.5');
        gripGroup.appendChild(stripe);
    }

    // Capuchon haut de la poignée (demi-ellipse)
    const gripCap = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    gripCap.setAttribute('cx', PIV_X); gripCap.setAttribute('cy', GRIP_TOP);
    gripCap.setAttribute('rx', GRIP_W/2); gripCap.setAttribute('ry', '4');
    gripCap.setAttribute('fill', '#6a7a9a');
    gripCap.setAttribute('stroke', '#2a3a5a'); gripCap.setAttribute('stroke-width', '1');
    gripGroup.appendChild(gripCap);

    // ── Bouton fermer SVG — en haut de la poignée ────────────────────────
    const closeSvgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    closeSvgGroup.setAttribute('data-nodrag', 'true');
    closeSvgGroup.setAttribute('pointer-events', 'all');
    closeSvgGroup.style.cursor = 'pointer';
    const closeSvgBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    closeSvgBg.setAttribute('cx', PIV_X); closeSvgBg.setAttribute('cy', GRIP_TOP - 16);
    closeSvgBg.setAttribute('r', '12');
    closeSvgBg.setAttribute('fill', '#e74c3c');
    closeSvgBg.setAttribute('stroke', '#fff'); closeSvgBg.setAttribute('stroke-width', '1.5');
    closeSvgBg.setAttribute('pointer-events', 'all');
    const closeSvgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    closeSvgTxt.setAttribute('x', PIV_X); closeSvgTxt.setAttribute('y', GRIP_TOP - 11);
    closeSvgTxt.setAttribute('text-anchor', 'middle');
    closeSvgTxt.setAttribute('font-size', '14'); closeSvgTxt.setAttribute('font-weight', 'bold');
    closeSvgTxt.setAttribute('fill', '#fff');
    closeSvgTxt.setAttribute('pointer-events', 'none');
    closeSvgTxt.textContent = '×';
    closeSvgGroup.appendChild(closeSvgBg);
    closeSvgGroup.appendChild(closeSvgTxt);

    // ── Bouton tracer SVG — sous la poignée, au-dessus du pivot ─────────
    const traceSvgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    traceSvgGroup.setAttribute('data-nodrag', 'true');
    traceSvgGroup.setAttribute('pointer-events', 'all');
    traceSvgGroup.style.cursor = 'pointer';
    const traceSvgBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    traceSvgBg.setAttribute('x', PIV_X - 28); traceSvgBg.setAttribute('y', PIV_Y + 18);
    traceSvgBg.setAttribute('width', '56'); traceSvgBg.setAttribute('height', '18');
    traceSvgBg.setAttribute('rx', '5');
    traceSvgBg.setAttribute('fill', '#a78bfa');
    traceSvgBg.setAttribute('stroke', '#7c3aed'); traceSvgBg.setAttribute('stroke-width', '1');
    traceSvgBg.setAttribute('pointer-events', 'all');
    const traceSvgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    traceSvgTxt.setAttribute('x', PIV_X); traceSvgTxt.setAttribute('y', PIV_Y + 30);
    traceSvgTxt.setAttribute('text-anchor', 'middle');
    traceSvgTxt.setAttribute('font-size', '9'); traceSvgTxt.setAttribute('font-weight', 'bold');
    traceSvgTxt.setAttribute('fill', '#fff');
    traceSvgTxt.setAttribute('pointer-events', 'none');
    traceSvgTxt.textContent = '⭕ Tracer';
    traceSvgGroup.appendChild(traceSvgBg);
    traceSvgGroup.appendChild(traceSvgTxt);

    // Éléments SVG (créés vides, positionnés par updateSvg)
    // Cercle preview
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    // Arc tracé en cours (feedback visuel pendant le drag)
    const arcPreview = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Bras gauche (pointe) — polygon pour avoir de l'épaisseur variable
    const armLeftPoly  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    // Bras droit (mine) — polygon
    const armRightPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

    // Pointe métallique : triangle allongé argenté
    const pointeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const pointeBody  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // corps argenté
    const pointeTip   = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // extrémité sombre

    // Mine (feutre/marqueur) : corps cylindrique + cône coloré + halo + pointe cliquable
    const mineGroup    = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mineGroup.setAttribute('data-mine', 'true');
    const mineHalo     = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');  // halo diffus sous la pointe
    const mineBody     = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');  // corps cylindrique métallique
    const mineBodyShine= document.createElementNS('http://www.w3.org/2000/svg', 'polygon');  // reflet clair sur le corps
    const mineCollar   = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');  // collier argenté
    const mineCone     = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');  // cône coloré
    const mineTip      = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   // pointe cliquable

    // Pivot visuel (par-dessus tout)
    const pivCircOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const pivCircInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    // Label rayon (affiché pendant le drag ↔)
    const radiusLabelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    radiusLabelGroup.setAttribute('pointer-events', 'none');
    radiusLabelGroup.style.display = 'none';
    const radiusLabelBg  = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const radiusLabelTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    radiusLabelBg.setAttribute('rx', '5');
    radiusLabelBg.setAttribute('fill', 'rgba(26,26,34,0.92)');
    radiusLabelBg.setAttribute('stroke', '#6aaee8'); radiusLabelBg.setAttribute('stroke-width', '1');
    radiusLabelTxt.setAttribute('text-anchor', 'middle');
    radiusLabelTxt.setAttribute('font-size', '12'); radiusLabelTxt.setAttribute('font-weight', 'bold');
    radiusLabelTxt.setAttribute('fill', '#6aaee8');
    radiusLabelGroup.appendChild(radiusLabelBg);
    radiusLabelGroup.appendChild(radiusLabelTxt);

    // ── Bouton ↔ sur le bras droit (écarter/resserrer) ────────────────────
    // Groupe SVG cliquable positionné au milieu du bras droit
    const spreadBtnGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    spreadBtnGroup.style.cursor = 'pointer';
    const spreadBtnBg   = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const spreadBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    spreadBtnGroup.appendChild(spreadBtnBg);
    spreadBtnGroup.appendChild(spreadBtnText);

    // ── Poignée rotation SVG — pile au pivot (jonction des deux bras) ────
    const rotH = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rotH.setAttribute('data-nodrag', 'true');
    rotH.setAttribute('pointer-events', 'all');
    rotH.style.cursor = 'pointer';
    const rotHBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rotHBg.setAttribute('cx', PIV_X); rotHBg.setAttribute('cy', PIV_Y);
    rotHBg.setAttribute('r', '13');
    rotHBg.setAttribute('fill', '#6aaee8');
    rotHBg.setAttribute('stroke', '#fff'); rotHBg.setAttribute('stroke-width', '2');
    rotHBg.setAttribute('pointer-events', 'all');
    const rotHTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rotHTxt.setAttribute('x', PIV_X); rotHTxt.setAttribute('y', PIV_Y + 5);
    rotHTxt.setAttribute('text-anchor', 'middle');
    rotHTxt.setAttribute('font-size', '14');
    rotHTxt.setAttribute('fill', '#fff');
    rotHTxt.setAttribute('pointer-events', 'none');
    rotHTxt.textContent = '↻';
    rotH.appendChild(rotHBg);
    rotH.appendChild(rotHTxt);

    pointeGroup.appendChild(pointeBody);
    pointeGroup.appendChild(pointeTip);
    mineGroup.appendChild(mineHalo);
    mineGroup.appendChild(mineBody);
    mineGroup.appendChild(mineBodyShine);
    mineGroup.appendChild(mineCollar);
    mineGroup.appendChild(mineCone);
    mineGroup.appendChild(mineTip);

    svg.appendChild(circle);
    svg.appendChild(arcPreview);
    svg.appendChild(armLeftPoly);
    svg.appendChild(armRightPoly);
    svg.appendChild(gripGroup);       // poignée par-dessus les bras
    svg.appendChild(pointeGroup);
    svg.appendChild(mineGroup);
    svg.appendChild(spreadBtnGroup);
    svg.appendChild(pivCircOuter);
    svg.appendChild(pivCircInner);
    svg.appendChild(traceSvgGroup);
    svg.appendChild(rotH);
    svg.appendChild(closeSvgGroup);
    svg.appendChild(radiusLabelGroup); // label rayon par-dessus tout

    // Helper : calcule le polygon d'un bras épais (trapèze)
    // de (x1,y1) vers (x2,y2), largeur w1 à la base, w2 à l'extrémité
    function armPolygon(x1, y1, x2, y2, w1, w2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len; // normale
        return [
            x1 + nx * w1, y1 + ny * w1,
            x1 - nx * w1, y1 - ny * w1,
            x2 - nx * w2, y2 - ny * w2,
            x2 + nx * w2, y2 + ny * w2
        ].join(' ');
    }

    // Helper : triangle orienté vers (tx,ty) depuis (bx,by), largeur w, longueur l
    function tipPolygon(bx, by, tx, ty, w, l) {
        const dx = tx - bx, dy = ty - by;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;
        // base à distance (len-l) depuis bx,by, pointe à (tx,ty)
        const mbx = bx + ux * (len - l), mby = by + uy * (len - l);
        return [
            mbx + nx * w, mby + ny * w,
            mbx - nx * w, mby - ny * w,
            tx, ty
        ].join(' ');
    }

    function updateSvg() {
        const halfAngle = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);

        // Extrémités des bras
        const lx = PIV_X - Math.sin(halfAngle) * ARM_LEN;
        const ly = PIV_Y + Math.cos(halfAngle) * ARM_LEN;
        const rx = PIV_X + Math.sin(halfAngle) * ARM_LEN;
        const ry = PIV_Y + Math.cos(halfAngle) * ARM_LEN;

        // ── Bras gauche (pointe) : s'arrête là où commence le corps argenté (22px avant l'extrémité)
        const dxL = lx - PIV_X, dyL = ly - PIV_Y;
        const lenL = Math.hypot(dxL, dyL) || 1;
        const uxL = dxL / lenL, uyL = dyL / lenL;
        const armLeftEndX = lx - uxL * 22;
        const armLeftEndY = ly - uyL * 22;
        armLeftPoly.setAttribute('points', armPolygon(PIV_X, PIV_Y, armLeftEndX, armLeftEndY, 7, 4));
        armLeftPoly.setAttribute('fill', 'url(#grad-arm-left)');
        armLeftPoly.setAttribute('stroke', '#333'); armLeftPoly.setAttribute('stroke-width', '0.5');

        // (bras droit défini plus bas, après calcul du bodyBase du feutre)

        // ── Bouton ↔ au milieu du bras droit ──────────────────────────────
        const btnMidX = PIV_X + Math.sin(halfAngle) * (ARM_LEN * 0.48);
        const btnMidY = PIV_Y + Math.cos(halfAngle) * (ARM_LEN * 0.48);
        spreadBtnBg.setAttribute('cx', btnMidX); spreadBtnBg.setAttribute('cy', btnMidY);
        spreadBtnBg.setAttribute('r', '11');
        spreadBtnBg.setAttribute('fill', '#2a4a6a');
        spreadBtnBg.setAttribute('stroke', '#6aaee8'); spreadBtnBg.setAttribute('stroke-width', '1.5');
        spreadBtnText.setAttribute('x', btnMidX); spreadBtnText.setAttribute('y', btnMidY + 4);
        spreadBtnText.setAttribute('text-anchor', 'middle');
        spreadBtnText.setAttribute('font-size', '11');
        spreadBtnText.setAttribute('fill', '#7ab8f5');
        spreadBtnText.setAttribute('font-family', 'monospace');
        spreadBtnText.setAttribute('pointer-events', 'none');
        spreadBtnText.textContent = '↔';
        spreadBtnGroup.setAttribute('data-nodrag', 'true');
        spreadBtnBg.setAttribute('pointer-events', 'all');

        // ── Pointe métallique (bras gauche) ──
        // Corps argenté : 20px depuis l'extrémité
        pointeBody.setAttribute('points', tipPolygon(PIV_X, PIV_Y, lx, ly, 4, 22));
        pointeBody.setAttribute('fill', '#c0c0c0');
        pointeBody.setAttribute('stroke', '#888'); pointeBody.setAttribute('stroke-width', '0.5');
        // Extrémité acérée plus sombre (8px)
        pointeTip.setAttribute('points', tipPolygon(PIV_X, PIV_Y, lx, ly, 1.5, 8));
        pointeTip.setAttribute('fill', '#555');

        // ── Feutre / Marqueur (bras droit) ──────────────────────────────────
        const drawColor = getDrawColor();

        // Vecteur unitaire du bras droit
        const dxR = rx - PIV_X, dyR = ry - PIV_Y;
        const lenR = Math.hypot(dxR, dyR) || 1;
        const uxR = dxR / lenR, uyR = dyR / lenR;
        const nxR = -uyR, nyR = uxR;

        const BODY_LEN   = 36;
        const COLLAR_LEN = 6;
        const CONE_LEN   = 18;

        const tipPt    = { x: rx, y: ry };
        const coneBase = { x: rx - uxR * CONE_LEN, y: ry - uyR * CONE_LEN };
        const colBase  = { x: rx - uxR * (CONE_LEN + COLLAR_LEN), y: ry - uyR * (CONE_LEN + COLLAR_LEN) };
        const bodyBase = { x: rx - uxR * (CONE_LEN + COLLAR_LEN + BODY_LEN), y: ry - uyR * (CONE_LEN + COLLAR_LEN + BODY_LEN) };

        // ── Bras droit : s'arrête à bodyBase (le feutre le recouvre en dessous) ──
        armRightPoly.setAttribute('points', armPolygon(PIV_X, PIV_Y, bodyBase.x, bodyBase.y, 7, 5.5));
        armRightPoly.setAttribute('fill', 'url(#grad-arm-right)');
        armRightPoly.setAttribute('stroke', '#333'); armRightPoly.setAttribute('stroke-width', '0.5');

        // Helper trapèze
        function trapeze(p1, p2, nx_, ny_, w1, w2) {
            return [
                p1.x + nx_ * w1, p1.y + ny_ * w1,
                p1.x - nx_ * w1, p1.y - ny_ * w1,
                p2.x - nx_ * w2, p2.y - ny_ * w2,
                p2.x + nx_ * w2, p2.y + ny_ * w2
            ].join(' ');
        }

        // Corps cylindrique gris métallique
        mineBody.setAttribute('points', trapeze(bodyBase, colBase, nxR, nyR, 5.5, 5.5));
        mineBody.setAttribute('fill', '#6a6a7e');
        mineBody.setAttribute('stroke', '#3a3a4a'); mineBody.setAttribute('stroke-width', '0.5');

        mineBodyShine.setAttribute('points', '0,0');
        mineBodyShine.setAttribute('fill', 'none');
        mineBodyShine.setAttribute('stroke', 'none');

        // Collier argenté
        mineCollar.setAttribute('points', trapeze(colBase, coneBase, nxR, nyR, 6.5, 6.5));
        mineCollar.setAttribute('fill', '#b0b8cc');
        mineCollar.setAttribute('stroke', '#7a8090'); mineCollar.setAttribute('stroke-width', '0.5');

        // Cône coloré
        mineCone.setAttribute('points', trapeze(coneBase, tipPt, nxR, nyR, 5.5, 0.5));
        mineCone.setAttribute('fill', drawColor);
        mineCone.setAttribute('stroke', 'none');

        // Halo diffus
        mineHalo.setAttribute('cx', rx); mineHalo.setAttribute('cy', ry);
        mineHalo.setAttribute('rx', '9'); mineHalo.setAttribute('ry', '5');
        const haloAngleDeg = Math.atan2(uyR, uxR) * 180 / Math.PI + 90;
        mineHalo.setAttribute('transform', `rotate(${haloAngleDeg}, ${rx}, ${ry})`);
        mineHalo.setAttribute('fill', drawColor);
        mineHalo.setAttribute('opacity', '0.28');
        mineHalo.setAttribute('stroke', 'none');

        // Pointe cliquable invisible
        mineTip.setAttribute('cx', rx); mineTip.setAttribute('cy', ry);
        mineTip.setAttribute('r', '7');
        mineTip.setAttribute('fill', 'rgba(0,0,0,0)');
        mineTip.setAttribute('stroke', 'none');
        mineTip.style.cursor = 'crosshair';
        mineTip.setAttribute('pointer-events', 'all');
        mineTip.dataset.nodrag = 'true';

        // ── Cercle preview centré sur la pointe ──
        circle.setAttribute('cx', lx); circle.setAttribute('cy', ly);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'rgba(167,139,250,0.45)');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('stroke-dasharray', '7 4');

        // ── Pivot visuel ──
        pivCircOuter.setAttribute('cx', PIV_X); pivCircOuter.setAttribute('cy', PIV_Y);
        pivCircOuter.setAttribute('r', '11');
        pivCircOuter.setAttribute('fill', '#6a6a7a');
        pivCircOuter.setAttribute('stroke', '#222'); pivCircOuter.setAttribute('stroke-width', '1.5');
        pivCircInner.setAttribute('cx', PIV_X); pivCircInner.setAttribute('cy', PIV_Y);
        pivCircInner.setAttribute('r', '5');
        pivCircInner.setAttribute('fill', '#bbb');
        pivCircInner.setAttribute('stroke', '#444'); pivCircInner.setAttribute('stroke-width', '1');

        // Stocker les coords pour le tracé (dans le repère de l'overlay)
        overlay.dataset.pivX   = lx;
        overlay.dataset.pivY   = ly;
        overlay.dataset.mineX  = rx;
        overlay.dataset.mineY  = ry;
        overlay.dataset.radius = radius;
    }

    // ── Bouton fermer SVG ────────────────────────────────────────────────
    closeSvgBg.addEventListener('mousedown',   e => { e.stopPropagation(); e.preventDefault(); });
    closeSvgBg.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); });
    closeSvgGroup.addEventListener('mousedown',   e => { e.stopPropagation(); e.preventDefault(); });
    closeSvgGroup.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); });
    closeSvgGroup.addEventListener('pointerup',   e => { e.stopPropagation(); e.preventDefault(); });
    closeSvgGroup.addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
    addTouchClick(closeSvgGroup, () => overlay.remove());
    // Support stylet : pointerup sur le bouton fermer
    closeSvgGroup.addEventListener('pointerup', function(e) {
        if (e.pointerType === 'pen' || e.pointerType === 'touch') {
            e.stopPropagation(); e.preventDefault();
            overlay.remove();
        }
    });

    // ── Bouton tracer SVG ────────────────────────────────────────────────
    // Annule tout stroke crayon en cours dans draw.js pour éviter qu'un
    // pointerdown stylet sur ce bouton ne génère un trait fantôme.
    function _cancelDrawStroke() {
        if (typeof isPainting !== 'undefined' && isPainting) {
            isPainting = false;
        }
        if (typeof currentStroke !== 'undefined' && currentStroke) {
            currentStroke = null;
        }
    }

    function doTrace() {
        // Annuler le stroke draw.js potentiellement déclenché par le pointerdown stylet
        _cancelDrawStroke();

        const t    = getOverlayTransform(overlay);
        const pivX = parseFloat(overlay.dataset.pivX || 0);
        const pivY = parseFloat(overlay.dataset.pivY || 0);
        const r    = parseFloat(overlay.dataset.radius || radius);
        const ox   = parseFloat(overlay.style.left || 0);
        const oy   = parseFloat(overlay.style.top  || 0);
        const worldPiv = rotatePoint(ox + pivX, oy + pivY, t.cx, t.cy, t.angle);
        const C = 6;
        const cx_ = worldPiv.x, cy_ = worldPiv.y;
        const steps = Math.max(60, Math.round(2 * Math.PI * r / 3));
        const ptsCercle = [];
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 2 * Math.PI;
            ptsCercle.push({ x: cx_ + Math.cos(a) * r, y: cy_ + Math.sin(a) * r });
        }
        const ptsH = [{ x: cx_ - C, y: cy_ }, { x: cx_ + C, y: cy_ }];
        const ptsV = [{ x: cx_, y: cy_ - C }, { x: cx_, y: cy_ + C }];
        traceOnCanvas([ptsCercle, ptsH, ptsV]);
    }
    // Bloquer mousedown ET pointerdown pour que draw.js ne démarre pas de stroke
    traceSvgGroup.addEventListener('mousedown',  e => { e.stopPropagation(); e.preventDefault(); });
    traceSvgGroup.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); });
    // Bloquer pointerup pour éviter qu'un stroke fantôme soit finalisé dans draw.js
    traceSvgGroup.addEventListener('pointerup',  e => { e.stopPropagation(); e.preventDefault(); });
    traceSvgGroup.addEventListener('click', e => { e.stopPropagation(); doTrace(); });
    addTouchClick(traceSvgGroup, doTrace);
    // Support stylet : pointerup sur le groupe SVG déclenche doTrace
    traceSvgGroup.addEventListener('pointerup', function(e) {
        if (e.pointerType === 'pen' || e.pointerType === 'touch') {
            e.stopPropagation(); e.preventDefault();
            doTrace();
        }
    });

    // ── Bouton ↔ : drag horizontal gauche = réduire, droite = agrandir ──────
    let _spreadDragging = false;
    let _spreadStartX   = 0;
    let _spreadStartR   = 0;

    function _showRadiusLabel() {
        // Positionner le label entre les deux extrémités (lx,ly) et (rx,ry)
        const ha  = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);
        const lxL = PIV_X - Math.sin(ha) * ARM_LEN;
        const lyL = PIV_Y + Math.cos(ha) * ARM_LEN;
        const rxL = PIV_X + Math.sin(ha) * ARM_LEN;
        const ryL = PIV_Y + Math.cos(ha) * ARM_LEN;
        const midX = (lxL + rxL) / 2;
        const midY = (lyL + ryL) / 2 + 18;
        const txt  = radius + ' px';
        radiusLabelTxt.textContent = txt;
        const tw = txt.length * 7 + 12;
        radiusLabelBg.setAttribute('x', midX - tw/2); radiusLabelBg.setAttribute('y', midY - 14);
        radiusLabelBg.setAttribute('width', tw); radiusLabelBg.setAttribute('height', 18);
        radiusLabelTxt.setAttribute('x', midX); radiusLabelTxt.setAttribute('y', midY - 2);
        radiusLabelGroup.style.display = '';
    }

    function _startSpreadDrag(clientX) {
        _spreadDragging = true;
        _spreadStartX   = clientX;
        _spreadStartR   = radius;
        spreadBtnBg.setAttribute('fill', '#1a3a5a');
        _showRadiusLabel();

        function onMove(ev) {
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const dx = cx - _spreadStartX;
            const newR = Math.max(MIN_R, Math.min(MAX_R, _spreadStartR + Math.round(dx)));
            if (newR === radius) return;

            const ovLeft = parseFloat(overlay.style.left || 0);
            const ovTop  = parseFloat(overlay.style.top  || 0);
            const haOld  = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);
            const oldLx  = PIV_X - Math.sin(haOld) * ARM_LEN;
            const oldLy  = PIV_Y + Math.cos(haOld) * ARM_LEN;

            radius = newR;

            const haNew = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);
            const newLx = PIV_X - Math.sin(haNew) * ARM_LEN;
            const newLy = PIV_Y + Math.cos(haNew) * ARM_LEN;

            // Décalage de la pointe dans le repère LOCAL (non tourné) de l'overlay
            const dLocalX = oldLx - newLx;
            const dLocalY = oldLy - newLy;

            // L'overlay peut être pivoté (dataset.angle) : ce décalage local doit
            // être converti dans le repère MONDE avant d'être appliqué à left/top,
            // sinon la pointe (le centre du compas) se déplace dès que le compas
            // a déjà tourné.
            const angleRad = parseFloat(overlay.dataset.angle || 0) * Math.PI / 180;
            const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
            const dWorldX = cosA * dLocalX - sinA * dLocalY;
            const dWorldY = sinA * dLocalX + cosA * dLocalY;

            overlay.style.left = (ovLeft + dWorldX) + 'px';
            overlay.style.top  = (ovTop  + dWorldY) + 'px';

            updateSvg();
            _showRadiusLabel(); // mettre à jour le label
        }
        function onEnd() {
            _spreadDragging = false;
            spreadBtnBg.setAttribute('fill', '#2a4a6a');
            radiusLabelGroup.style.display = 'none'; // cacher le label
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }

    spreadBtnGroup.addEventListener('mousedown', function(e) {
        e.stopPropagation(); e.preventDefault();
        _startSpreadDrag(e.clientX);
    });
    spreadBtnGroup.addEventListener('touchstart', function(e) {
        e.stopPropagation(); e.preventDefault();
        _startSpreadDrag(e.touches[0].clientX);
    }, { passive: false });
    spreadBtnGroup.addEventListener('contextmenu', function(e) {
        e.preventDefault(); e.stopPropagation();
    });

    // ── Tracer un arc depuis la mine (mousedown → drag → mouseup) ────────
    mineTip.setAttribute('pointer-events', 'all');
    mineTip.style.cursor = 'crosshair';

    let _arcDrawing = false;
    let _arcLastAngle = 0;
    let _arcStartAngle = 0; // angle de départ du tracé (pour reconstruire l'arc proprement)
    let _arcTotalAngle = 0; // angle accumulé (peut dépasser 2*PI)
    let _arcOverlayAngleStart = 0; // rotation de l'overlay au début du tracé
    let _arcCenterWorld = { x: 0, y: 0 };

    function _getMineTipWorldPos() {
        const t   = getOverlayTransform(overlay);
        const ox  = parseFloat(overlay.style.left || 0);
        const oy  = parseFloat(overlay.style.top  || 0);
        const mx  = parseFloat(overlay.dataset.mineX || 0);
        const my  = parseFloat(overlay.dataset.mineY || 0);
        return rotatePoint(ox + mx, oy + my, t.cx, t.cy, t.angle);
    }
    function _getPivWorldPos() {
        const t   = getOverlayTransform(overlay);
        const ox  = parseFloat(overlay.style.left || 0);
        const oy  = parseFloat(overlay.style.top  || 0);
        const px  = parseFloat(overlay.dataset.pivX || 0);
        const py  = parseFloat(overlay.dataset.pivY || 0);
        return rotatePoint(ox + px, oy + py, t.cx, t.cy, t.angle);
    }

    // Convertit une position client en coordonnées board
    function _clientToBoard(clientX, clientY) {
        const isFixed = overlay.dataset.geoFixed === 'true' || overlay.style.position === 'fixed';
        const bRect   = (!isFixed && board) ? board.getBoundingClientRect() : { left: 0, top: 0 };
        return { x: clientX - bRect.left, y: clientY - bRect.top };
    }

    // Construit un tableau de points pour un arc de centre (cx,cy) rayon r,
    // de startAngle sur totalAngle radians (peut être positif ou négatif)
    function _buildArcPoints(cx, cy, r, startAngle, totalAngle) {
        const steps = Math.max(3, Math.round(Math.abs(r * totalAngle) / 3));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const a = startAngle + totalAngle * (i / steps);
            pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        return pts;
    }

    function _arcToSvgPath(pts) {
        if (pts.length < 2) return '';
        const isFixed = overlay.dataset.geoFixed === 'true' || overlay.style.position === 'fixed';
        const bRect   = (!isFixed && board) ? board.getBoundingClientRect() : { left: 0, top: 0 };
        const ox  = parseFloat(overlay.style.left || 0);
        const oy  = parseFloat(overlay.style.top  || 0);
        const t   = getOverlayTransform(overlay);
        const cx_ = overlay.offsetWidth  / 2;
        const cy_ = overlay.offsetHeight / 2;
        // board coords → local overlay coords → inverse rotate → SVG coords
        const svgPts = pts.map(p => {
            const lx = p.x - ox - bRect.left;
            const ly = p.y - oy - bRect.top;
            const cos = Math.cos(-t.angle), sin = Math.sin(-t.angle);
            return {
                x: cos * (lx - cx_) - sin * (ly - cy_) + cx_,
                y: sin * (lx - cx_) + cos * (ly - cy_) + cy_
            };
        });
        let d = `M ${svgPts[0].x.toFixed(1)} ${svgPts[0].y.toFixed(1)}`;
        svgPts.slice(1).forEach(p => { d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; });
        return d;
    }

    // ── Canvas de preview d'arc (coordonnées board, indépendant de la rotation) ──
    // Créé une seule fois, positionné en absolu sur le board
    const _arcCanvas = document.createElement('canvas');
    _arcCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:9600;';
    _arcCanvas.width  = board.offsetWidth  || window.innerWidth;
    _arcCanvas.height = board.offsetHeight || window.innerHeight;
    const _arcCtx = _arcCanvas.getContext('2d');

    function _arcPreviewDraw(piv, r, startAngle, totalAngle) {
        _arcCtx.clearRect(0, 0, _arcCanvas.width, _arcCanvas.height);
        if (Math.abs(totalAngle) < 0.01) return;
        // Dessiner tous les points accumulés depuis le début du geste
        const steps = Math.max(3, Math.round(Math.abs(r * totalAngle) / 3));
        _arcCtx.save();
        _arcCtx.strokeStyle = getDrawColor();
        _arcCtx.lineWidth   = getDrawSize();
        _arcCtx.lineCap     = 'round';
        _arcCtx.lineJoin    = 'round';
        _arcCtx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const a = startAngle + totalAngle * (i / steps);
            const x = piv.x + Math.cos(a) * r;
            const y = piv.y + Math.sin(a) * r;
            if (i === 0) _arcCtx.moveTo(x, y); else _arcCtx.lineTo(x, y);
        }
        _arcCtx.stroke();
        _arcCtx.restore();
    }

    // Points accumulés au fil du tracé (jamais réduits, même si on revient en arrière)
    let _arcAccumPts = [];

    function _arcPreviewClear() {
        _arcCtx.clearRect(0, 0, _arcCanvas.width, _arcCanvas.height);
    }

    // Dessine une croix de centre sur le canvas de preview
    function _arcDrawCenter(piv_) {
        const C   = 6;
        const color = getDrawColor();
        _arcCtx.save();
        _arcCtx.strokeStyle = color;
        _arcCtx.lineWidth   = Math.max(1, getDrawSize() * 0.7);
        _arcCtx.lineCap     = 'round';
        _arcCtx.globalAlpha = 0.85;
        _arcCtx.beginPath();
        _arcCtx.moveTo(piv_.x - C, piv_.y); _arcCtx.lineTo(piv_.x + C, piv_.y);
        _arcCtx.moveTo(piv_.x, piv_.y - C); _arcCtx.lineTo(piv_.x, piv_.y + C);
        _arcCtx.stroke();
        _arcCtx.restore();
    }

    function _arcMouseDown(e) {
        e.stopPropagation(); e.preventDefault();
        _arcDrawing    = true;
        _arcTotalAngle = 0;
        _arcAccumPts   = [];
        const mine = _getMineTipWorldPos();
        const piv  = _getPivWorldPos();
        _arcCenterWorld = { x: piv.x, y: piv.y };
        _arcLastAngle   = Math.atan2(mine.y - piv.y, mine.x - piv.x);
        _arcStartAngle  = _arcLastAngle;
        _arcOverlayAngleStart = parseFloat(overlay.dataset.angle || 0) * Math.PI / 180;

        // Point de départ
        _arcAccumPts.push({ x: mine.x, y: mine.y });

        // Masquer le cercle preview SVG pendant le tracé
        circle.setAttribute('stroke', 'none');

        // Attacher le canvas de preview au board
        board.appendChild(_arcCanvas);

        // Dessiner le centre immédiatement dès le clic
        _arcDrawCenter({ x: piv.x, y: piv.y });

        document.addEventListener('mousemove', _arcMouseMove);
        document.addEventListener('mouseup',   _arcMouseUp);
        document.addEventListener('touchmove',  _arcTouchMove, { passive: false });
        document.addEventListener('touchend',   _arcTouchEnd);
        document.addEventListener('pointermove', _arcPointerMove);
        document.addEventListener('pointerup',   _arcPointerUp);
        document.addEventListener('pointercancel', _arcPointerUp);
    }

    function _arcUpdate(clientX, clientY) {
        if (!_arcDrawing) return;
        const piv  = _arcCenterWorld;
        const r    = parseFloat(overlay.dataset.radius || radius);
        const board_ = _clientToBoard(clientX, clientY);
        const curAngle = Math.atan2(board_.y - piv.y, board_.x - piv.x);

        // Delta d'angle normalisé entre -PI et PI (suit le sens de rotation)
        let delta = curAngle - _arcLastAngle;
        if (delta >  Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;

        _arcTotalAngle += delta;
        _arcLastAngle   = curAngle;

        // ── Faire tourner le compas : la mine suit le curseur ────────────
        const newOverlayAngle = (_arcOverlayAngleStart + _arcTotalAngle) * 180 / Math.PI;
        overlay.style.transform = `rotate(${newOverlayAngle}deg)`;
        overlay.dataset.angle   = newOverlayAngle;

        // La pointe reste fixe : recalculer la position de l'overlay
        const pivX_local = parseFloat(overlay.dataset.pivX || 0);
        const pivY_local = parseFloat(overlay.dataset.pivY || 0);
        const angleRad = newOverlayAngle * Math.PI / 180;
        const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
        const ow = OVW, oh = OVH;
        const isFixed = overlay.dataset.geoFixed === 'true' || overlay.style.position === 'fixed';
        const bRect   = (!isFixed && board) ? board.getBoundingClientRect() : { left: 0, top: 0 };
        const px = piv.x - bRect.left;
        const py = piv.y - bRect.top;
        const dx = cos * (pivX_local - ow/2) - sin * (pivY_local - oh/2);
        const dy = sin * (pivX_local - ow/2) + cos * (pivY_local - oh/2);
        overlay.style.left = (px - ow/2 - dx) + 'px';
        overlay.style.top  = (py - oh/2 - dy) + 'px';

        // Preview sur canvas : interpoler l'arc entre l'angle précédent et le courant
        // pour éviter les cordes quand la souris va vite
        const prevAngle = _arcLastAngle - delta; // angle juste avant ce delta
        const arcSteps  = Math.max(2, Math.ceil(Math.abs(delta) * r / 4));
        const prev      = _arcAccumPts[_arcAccumPts.length - 1];

        _arcCtx.save();
        _arcCtx.strokeStyle = getDrawColor();
        _arcCtx.lineWidth   = getDrawSize();
        _arcCtx.lineCap     = 'round';
        _arcCtx.lineJoin    = 'round';
        _arcCtx.beginPath();

        if (prev) _arcCtx.moveTo(prev.x, prev.y);

        for (let i = 1; i <= arcSteps; i++) {
            const a  = prevAngle + delta * (i / arcSteps);
            const px_ = piv.x + Math.cos(a) * r;
            const py_ = piv.y + Math.sin(a) * r;
            if (i === 1 && !prev) _arcCtx.moveTo(px_, py_);
            else _arcCtx.lineTo(px_, py_);
            if (i === arcSteps) _arcAccumPts.push({ x: px_, y: py_ });
        }

        _arcCtx.stroke();
        _arcCtx.restore();

        // Redessiner le centre (croix) par-dessus l'arc en cours
        _arcDrawCenter(_arcCenterWorld);
    }

    function _arcMouseMove(e) { _arcUpdate(e.clientX, e.clientY); }
    function _arcTouchMove(e) { e.preventDefault(); _arcUpdate(e.touches[0].clientX, e.touches[0].clientY); }
    function _arcPointerMove(e) {
        // Éviter la double exécution si l'événement mouse/touch est déjà traité
        if (e.pointerType === 'mouse') return;
        _arcUpdate(e.clientX, e.clientY);
    }

    function _arcFinish(clientX, clientY) {
        if (!_arcDrawing) return;
        _arcDrawing = false;

        document.removeEventListener('mousemove', _arcMouseMove);
        document.removeEventListener('mouseup',   _arcMouseUp);
        document.removeEventListener('touchmove',  _arcTouchMove);
        document.removeEventListener('touchend',   _arcTouchEnd);
        document.removeEventListener('pointermove', _arcPointerMove);
        document.removeEventListener('pointerup',   _arcPointerUp);
        document.removeEventListener('pointercancel', _arcPointerUp);

        // Remettre le cercle preview SVG
        circle.setAttribute('stroke', 'rgba(167,139,250,0.45)');
        // Nettoyer et retirer le canvas de preview
        _arcPreviewClear();
        if (_arcCanvas.parentNode) _arcCanvas.parentNode.removeChild(_arcCanvas);

        // Reconstruire l'arc proprement depuis l'angle de départ jusqu'à l'angle total
        // (évite les cordes dues aux allers-retours dans _arcAccumPts)
        if (Math.abs(_arcTotalAngle) > 0.01) {
            const r_     = parseFloat(overlay.dataset.radius || radius);
            const piv_   = _arcCenterWorld;
            const steps  = Math.max(3, Math.round(Math.abs(_arcTotalAngle) * r_ / 3));
            const arcPts = [];
            for (let i = 0; i <= steps; i++) {
                const a = _arcStartAngle + _arcTotalAngle * (i / steps);
                arcPts.push({ x: piv_.x + Math.cos(a) * r_, y: piv_.y + Math.sin(a) * r_ });
            }
            // Ajouter la croix du centre au tracé définitif
            const C = 6;
            const cx_ = piv_.x, cy_ = piv_.y;
            const ptsH = [{ x: cx_ - C, y: cy_ }, { x: cx_ + C, y: cy_ }];
            const ptsV = [{ x: cx_, y: cy_ - C }, { x: cx_, y: cy_ + C }];
            traceOnCanvas([arcPts, ptsH, ptsV]);
        }
        _arcTotalAngle = 0;
        _arcAccumPts   = [];
    }

    function _arcMouseUp(e)  { _arcFinish(e.clientX, e.clientY); }
    function _arcTouchEnd(e) { if (e.changedTouches[0]) _arcFinish(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }
    function _arcPointerUp(e) {
        if (e.pointerType === 'mouse') return;
        _arcFinish(e.clientX, e.clientY);
    }

    // Attacher l'événement mousedown sur la mine via le SVG
    mineTip.addEventListener('mousedown',  _arcMouseDown);
    mineTip.addEventListener('touchstart', function(e) {
        e.stopPropagation(); e.preventDefault();
        const t = e.touches[0];
        _arcMouseDown({ clientX: t.clientX, clientY: t.clientY, stopPropagation: function(){}, preventDefault: function(){} });
    }, { passive: false });
    mineTip.addEventListener('pointerdown', function(e) {
        if (e.pointerType === 'mouse') return; // géré par mousedown
        e.stopPropagation(); e.preventDefault();
        _arcMouseDown(e);
    }, { passive: false });

    overlay.appendChild(svg);
    board.appendChild(overlay);

    updateSvg();
    // Exposer updateSvg pour le refresh couleur depuis cpickDispatch
    overlay._geoUpdateSvg = updateSvg;

    // Pivot de rotation = la pointe du compas (même point que celui gardé fixe
    // lors du redimensionnement), recalculé dynamiquement car sa position
    // locale dépend du rayon courant.
    function _compassPivotLocal() {
        const ha = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);
        return {
            x: PIV_X - Math.sin(ha) * ARM_LEN,
            y: PIV_Y + Math.cos(ha) * ARM_LEN
        };
    }

    // Position actuelle du pivot dans le même repère que overlay.style.left/top
    // (repère board, ou repère écran en mode "fixed").
    // Calcul autonome (n'utilise PAS getOverlayTransform/offsetWidth) pour être
    // rigoureusement cohérent avec _applyLeftTopForPivot, qui utilise les mêmes
    // constantes OVW/OVH — toute divergence entre les deux sources (DOM vs JS)
    // introduirait un petit décalage cumulé entre capture et restauration du pivot.
    function _pivWorldBoard() {
        const ox = parseFloat(overlay.style.left || 0);
        const oy = parseFloat(overlay.style.top  || 0);
        const angleRad = parseFloat(overlay.dataset.angle || 0) * Math.PI / 180;
        const cx = ox + OVW / 2, cy = oy + OVH / 2;
        const loc = _compassPivotLocal();
        return rotatePoint(ox + loc.x, oy + loc.y, cx, cy, angleRad);
    }

    // Repositionne l'overlay (left/top) pour que le pivot local courant
    // coïncide avec pivWorld, pour l'angle donné. On suppose une rotation
    // CSS autour du centre de la boîte (transform-origin par défaut, jamais
    // modifié) — exactement la même hypothèse que le tracé d'arc à la mine,
    // ce qui garantit que les deux mécanismes restent cohérents entre eux.
    function _applyLeftTopForPivot(pivWorld, angleDeg) {
        const loc = _compassPivotLocal();
        const angleRad = angleDeg * Math.PI / 180;
        const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
        const ow = OVW, oh = OVH;
        const dx = cos * (loc.x - ow / 2) - sin * (loc.y - oh / 2);
        const dy = sin * (loc.x - ow / 2) + cos * (loc.y - oh / 2);
        overlay.style.left = (pivWorld.x - ow / 2 - dx) + 'px';
        overlay.style.top  = (pivWorld.y - oh / 2 - dy) + 'px';
    }

    // Double-clic sur la poignée : reset de l'angle en gardant la pointe fixe
    rotH.ondblclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        const pivWorld = _pivWorldBoard();
        overlay.style.transform = '';
        overlay.dataset.angle = '0';
        _applyLeftTopForPivot(pivWorld, 0);
    };

    function _startCompassRotate(clientX, clientY) {
        const pivWorld = _pivWorldBoard();
        const isFixedOv = overlay.dataset.geoFixed === 'true' || overlay.style.position === 'fixed';
        const bRect     = (!isFixedOv && board) ? board.getBoundingClientRect() : { left: 0, top: 0 };
        const pivScreenX = pivWorld.x + bRect.left;
        const pivScreenY = pivWorld.y + bRect.top;

        const startAngle = Math.atan2(clientY - pivScreenY, clientX - pivScreenX);
        const startRot   = parseFloat(overlay.dataset.angle || 0);
        const indicator  = document.getElementById('rotation-indicator');

        function onMove(ev) {
            const px = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const py = ev.touches ? ev.touches[0].clientY : ev.clientY;
            const newRot  = startRot + (Math.atan2(py - pivScreenY, px - pivScreenX) - startAngle) * 180 / Math.PI;
            const snapped = geoSnapRotation(newRot);
            overlay.style.transform = `rotate(${snapped}deg)`;
            overlay.dataset.angle   = snapped;
            _applyLeftTopForPivot(pivWorld, snapped);
            if (indicator) {
                const deg = Math.round(((snapped % 360) + 360) % 360);
                const rotDeg = document.getElementById('rot-deg');
                if (rotDeg) rotDeg.textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = px + 16 + 'px';
                indicator.style.top  = py + 'px';
                const hint = indicator.querySelector('.rot-reset-hint');
                if (hint) hint.style.display = (deg === 0) ? 'none' : 'inline';
            }
        }
        function onEnd() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            const ind = document.getElementById('rotation-indicator');
            if (ind) ind.style.display = 'none';
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }

    rotH.onmousedown = function (e) {
        e.preventDefault(); e.stopPropagation();
        _startCompassRotate(e.clientX, e.clientY);
    };
    rotH.addEventListener('touchstart', function (e) {
        e.preventDefault(); e.stopPropagation();
        _startCompassRotate(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    makeDraggableGeo(overlay, null);
}

// ── Fermer la barre géo quand la barre dessin se ferme ────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const drawToolbar = document.getElementById('draw-toolbar');
    if (drawToolbar) {
        new MutationObserver(function () {
            if (drawToolbar.style.display === 'none') {
                window.closeGeoToolbar();
            }
        }).observe(drawToolbar, { attributes: true, attributeFilter: ['style'] });
    }
});

// ── Rafraîchir la couleur du feutre compas à chaque changement de couleur ─
// On wrappe cpickDispatch (disponible après chargement de color-picker.js)
(function () {
    function _patchCpickForGeo() {
        if (typeof cpickDispatch !== 'function') return;
        const _orig = cpickDispatch;
        cpickDispatch = function (id, color) {
            _orig(id, color);
            if (id === 'draw-color') {
                // Mettre à jour tous les compas ouverts
                document.querySelectorAll('.geo-tool-overlay').forEach(function (ov) {
                    if (typeof ov._geoUpdateSvg === 'function') ov._geoUpdateSvg();
                });
            }
        };
    }
    if (typeof cpickDispatch === 'function') {
        _patchCpickForGeo();
    } else {
        document.addEventListener('DOMContentLoaded', _patchCpickForGeo);
    }
})();

})();
