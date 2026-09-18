// =========================================================================
// COLLER UNE IMAGE DEPUIS LE PRESSE-PAPIER — Le Bureau du Prof
//
// Écoute Ctrl+V / ⌘+V sur le document.
// Si le presse-papier contient une image, elle est insérée sur le bureau
// comme un widget sticker aux dimensions réelles de l'image (avec un max
// de 600px sur le côté le plus grand pour ne pas déborder du board).
//
// Dépendances globales (définies dans stickers.js / widgets.js) :
//   findFreePosition(), board, makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

// =========================================================================
// COLLER UNE IMAGE DEPUIS LE PRESSE-PAPIER — Le Bureau du Prof
//
// Écoute Ctrl+V / ⌘+V via keydown (et non l'événement paste natif).
// Cela permet de contrôler précisément quand on lit le presse-papier,
// et d'éviter que le contenu résiduel du presse-papier Windows soit collé
// lors d'un Ctrl+V destiné à coller un widget ou un dessin.
//
// Dépendances globales (définies dans stickers.js / widgets.js) :
//   findFreePosition(), board, makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

// =========================================================================
// COLLER UNE IMAGE DEPUIS LE PRESSE-PAPIER — Le Bureau du Prof
//
// Écoute l'événement paste natif (Ctrl+V / ⌘+V).
// Ne se déclenche que si le presse-papier contient une image ET aucun
// contenu texte/HTML (pour ne pas interférer avec le collage de widgets
// ou de dessins qui passent par pasteWidgets()).
//
// Dépendances globales (définies dans stickers.js / widgets.js) :
//   findFreePosition(), board, makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

// =========================================================================
// COLLER UNE IMAGE DEPUIS LE PRESSE-PAPIER — Le Bureau du Prof
// =========================================================================

// Timestamp du dernier Ctrl+C sur le bureau (hors champ texte)
window._lastBoardCopyTime = 0;

document.addEventListener('copy', (e) => {
    const active = document.activeElement;
    if (active && (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    window._lastBoardCopyTime = Date.now();
});

document.addEventListener('paste', (e) => {
    const active = document.activeElement;
    if (active && (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

    // Bloquer si un Ctrl+C sur le bureau a eu lieu il y a moins de 3 secondes
    if (Date.now() - window._lastBoardCopyTime < 3000) return;

    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    let imageItem = null;
    for (const item of items) {
        if (item.type.startsWith('image/')) imageItem = item;
    }
    if (!imageItem) return;

    e.preventDefault();

    const file = imageItem.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const tmpImg = new Image();
        tmpImg.onload = () => _insertPastedImage(dataUrl, tmpImg.naturalWidth, tmpImg.naturalHeight);
        tmpImg.onerror = () => _insertPastedImage(dataUrl, 300, 300);
        tmpImg.src = dataUrl;
    };
    reader.readAsDataURL(file);
});


/**
 * Crée un widget sticker sur le board avec les dimensions proportionnelles
 * à l'image réelle, dans la limite de MAX_SIZE pixels sur le plus grand côté.
 */
function _insertPastedImage(dataUrl, naturalW, naturalH) {
    const MAX_SIZE = 600; // px max sur le board

    // Calculer les dimensions en respectant les proportions
    let w = naturalW;
    let h = naturalH;
    if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
    }

    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'sticker';
    widget.dataset.transparent = 'true';
    widget.dataset.imageWidget = 'true';
    widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; width:${w}px; height:${h}px; overflow:visible; flex-direction:row;`;
    widget.style.setProperty('--sticker-h', h + 'px');
    widget.tabIndex = 0;

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Image collée';
    img.draggable = false;
    img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; pointer-events:none; padding:0; box-sizing:border-box;';

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-anchor-handle" onclick="toggleAnchorImage(this.closest('.widget'))" title="Ancrer (rendre insélectionnable)">⚓</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
    `;
    widget.appendChild(img);

    widget.addEventListener('mousedown', () => {
        if (widget.dataset.anchored === 'true') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);
    _addStickerResizeHandle(widget, 40);
    saveBoard();
}
