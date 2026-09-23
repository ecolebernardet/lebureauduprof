// =========================================================================
// COLLER UNE IMAGE DEPUIS LE PRESSE-PAPIER — Le Bureau du Prof
//
// Problème résolu : un Ctrl+V déclenchait DEUX collages
//   - l'image du presse-papier système (ce fichier),
//   - le dernier widget copié en interne sur le bureau (pasteWidgets…).
//
// Règle appliquée : seul le DERNIER objet copié est collé.
//   • Copie interne (Ctrl+C / Ctrl+X / bouton 📋 sur le bureau)
//       → on mémorise l'heure : _lastBoardCopyTime
//   • Copie externe (autre appli, capture d'écran, Impr. écran…)
//       → impossible à voir directement, mais pour copier ailleurs
//         la fenêtre perd le focus (blur) : _lastExternalCopyTime
//   • Au Ctrl+V :
//       - copie interne plus récente → on ignore l'image système,
//         le collage interne se fait normalement ;
//       - copie externe plus récente → on bloque le collage interne ;
//         si le presse-papier contient une image on la colle, sinon
//         on relance le collage interne (rien n'est perdu).
//
// Tous les écouteurs sont en phase de CAPTURE sur window : ils passent
// avant ceux déclarés sur document par les autres scripts.
//
// Dépendances globales (définies dans stickers.js / widgets.js) :
//   findFreePosition(), board, makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

(function () {
    // Au chargement, aucune copie interne : une image déjà présente
    // dans le presse-papier est considérée comme la plus récente.
    window._lastBoardCopyTime    = 0;
    window._lastExternalCopyTime = Date.now();

    let _externalWins = false; // décision prise au keydown Ctrl+V
    let _replaying    = false; // vrai pendant la relance du collage interne

    function isTyping() {
        const a = document.activeElement;
        return !!(a && (a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'));
    }

    function isShortcut(e, letter) {
        return (e.ctrlKey || e.metaKey) && !e.altKey &&
               ((e.key && e.key.toLowerCase() === letter) || e.code === 'Key' + letter.toUpperCase());
    }

    function markBoardCopy() {
        window._lastBoardCopyTime = Date.now();
    }

    // ── 1. Détection des copies INTERNES ─────────────────────────────────
    window.addEventListener('keydown', (e) => {
        if (isTyping()) return;
        if (isShortcut(e, 'c') || isShortcut(e, 'x')) markBoardCopy();
    }, true);

    window.addEventListener('copy', () => { if (!isTyping()) markBoardCopy(); }, true);
    window.addEventListener('cut',  () => { if (!isTyping()) markBoardCopy(); }, true);

    // Bouton 📋 de la barre de sélection (copySelectedWidgets)
    function wrapCopyFunction() {
        if (typeof window.copySelectedWidgets === 'function' && !window.copySelectedWidgets._bdpWrapped) {
            const original = window.copySelectedWidgets;
            const wrapped = function () { markBoardCopy(); return original.apply(this, arguments); };
            wrapped._bdpWrapped = true;
            window.copySelectedWidgets = wrapped;
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrapCopyFunction);
    else wrapCopyFunction();
    window.addEventListener('load', wrapCopyFunction);

    // ── 2. Détection des copies EXTERNES ─────────────────────────────────
    window.addEventListener('blur', () => {
        // Un clic dans une iframe du bureau (YouTube, carte…) fait aussi
        // perdre le focus à la fenêtre : on ne le compte pas.
        setTimeout(() => {
            const a = document.activeElement;
            if (a && a.tagName === 'IFRAME') return;
            window._lastExternalCopyTime = Date.now();
        }, 0);
    });

    // Touche Impr. écran (copie une capture sans quitter la fenêtre)
    window.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') window._lastExternalCopyTime = Date.now();
    }, true);

    // ── 3. Ctrl+V : décider qui colle ────────────────────────────────────
    window.addEventListener('keydown', (e) => {
        if (_replaying) return;           // relance volontaire : on laisse passer
        if (isTyping()) return;
        if (!isShortcut(e, 'v')) return;

        _externalWins = window._lastExternalCopyTime > window._lastBoardCopyTime;

        // La copie externe est la plus récente : on empêche le collage
        // interne déclenché au keydown (on ne fait PAS preventDefault,
        // pour que l'événement paste natif ait bien lieu).
        if (_externalWins) e.stopImmediatePropagation();
    }, true);

    window.addEventListener('paste', (e) => {
        if (isTyping()) return;

        const items = e.clipboardData && e.clipboardData.items;
        let imageItem = null;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith('image/')) imageItem = item;
            }
        }

        // Copie interne plus récente → l'image système est une vieille copie :
        // on ne la colle pas et on laisse le collage interne se faire.
        if (!_externalWins) return;

        _externalWins = false;

        if (!imageItem) {
            // Copie externe sans image (du texte par ex.) : rien à coller
            // ici, on relance donc le collage interne qu'on avait bloqué.
            replayInternalPaste();
            return;
        }

        // Copie externe avec image : on colle UNIQUEMENT l'image.
        e.preventDefault();
        e.stopImmediatePropagation(); // bloque tout autre gestionnaire paste

        // Une fois collée, l'image devient « la dernière chose collée » :
        // un Ctrl+V suivant la recolle, tant qu'on ne copie rien sur le bureau.
        const file = imageItem.getAsFile();
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const tmpImg = new Image();
            tmpImg.onload  = () => _insertPastedImage(dataUrl, tmpImg.naturalWidth, tmpImg.naturalHeight);
            tmpImg.onerror = () => _insertPastedImage(dataUrl, 300, 300);
            tmpImg.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }, true);

    function replayInternalPaste() {
        _replaying = true;
        try {
            const target = document.activeElement || document.body;
            target.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'v', code: 'KeyV', ctrlKey: true, bubbles: true, cancelable: true
            }));
        } finally {
            _replaying = false;
        }
    }
})();


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
