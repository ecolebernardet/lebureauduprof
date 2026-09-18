// =========================================================================
// WIDGETS — Le Bureau du Prof
// Fonctions extraites de index.html
//
// Dépendances globales attendues (définies dans index.html) :
//   board, isInitialLoading, isRestoringState, isDrawMode, isEraserMode
//   currentActiveWidget, virtualH(), scaleFontSizesBy()
//   snapshotNow(), saveBoard(), updateClock()
//   openTextToolbar(), syncFontSizeGlobal()
//   initTimeWidget(), initDateWidget(), initMeteoWidget()
//   cloneShapeWidget(), openShapeEditPanel(), closeShapeEditPanel()
// =========================================================================


// =========================================================================
// Z-INDEX — premier plan / épinglage / arrière-plan
// =========================================================================
let widgetZCounter = 1000;
let pinnedZCounter = 10000;

function bringToFront(widget, pin = false) {
    if (pin) {
        pinnedZCounter++;
        widget.style.zIndex = pinnedZCounter;
        widget.dataset.pinned = "true";
        widget.classList.add('pinned');
    } else {
        if (widget.dataset.pinned === "true") return;
        if (widget.dataset.background === "true") return;
        widgetZCounter++;
        widget.style.zIndex = widgetZCounter;
    }
}

function togglePin(widget) {
    snapshotNow();
    if (widget.dataset.pinned === "true") {
        widget.dataset.pinned = "false";
        widget.classList.remove('pinned');
        widgetZCounter++;
        widget.style.zIndex = widgetZCounter;
    } else {
        widget.dataset.background = "false";
        bringToFront(widget, true);
    }
    saveBoard();
}

function sendToBack(widget) {
    snapshotNow();
    if (widget.dataset.background === "true") {
        // Déjà en arrière-plan → on annule
        widget.dataset.background = "false";
        widgetZCounter++;
        widget.style.zIndex = widgetZCounter;
    } else {
        widget.style.zIndex = 1;
        widget.dataset.pinned = "false";
        widget.classList.remove('pinned');
        widget.dataset.background = "true";
    }
    // Widget carte (iframe) : une iframe reste cliquable même derrière les
    // autres widgets (z-index seul ne suffit pas), on neutralise ses clics
    // tant qu'elle est en fond.
    if (widget.dataset.type === 'carte' && typeof _carteApplyBackgroundState === 'function') {
        _carteApplyBackgroundState(widget);
    }
    saveBoard();
}


// =========================================================================
// COULEURS UTILITAIRES
// =========================================================================
function hexToRgb(hex) {
    // Gère aussi les couleurs rgb() / rgba() déjà existantes
    const rgbMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


// =========================================================================
// FOND / TRANSPARENCE
// =========================================================================
function applyTransparency(widget, isT) {
    const c = widget.querySelector('.editor-container');
    widget.dataset.transparent = isT;
    const wc = widget.querySelector('.widget-content');
    if (isT) {
        widget.style.background = 'transparent';
        widget.style.boxShadow  = 'none';
        widget.style.border     = 'none';
        if (wc) wc.style.background = 'transparent';
        if (c)  c.style.background  = 'transparent';
        widget.dataset.bgOpacity = 0;
        const slider = document.getElementById('widget-bg-opacity');
        const label  = document.getElementById('widget-bg-opacity-val');
        if (slider) slider.value = 0;
        if (label)  label.textContent = '0%';
    } else {
        const bg = widget.dataset.bgColor || '#ffffff';
        // Si l'opacité était à 0 (mise par le bouton transparent), on la remet à 1
        if (parseFloat(widget.dataset.bgOpacity) === 0) widget.dataset.bgOpacity = 1;
        const opacity = parseFloat(widget.dataset.bgOpacity ?? 1);
        let finalBg = bg;
        if (opacity < 1) {
            const rgb = hexToRgb(bg);
            if (rgb) finalBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        }
        widget.style.background = finalBg;
        widget.style.boxShadow  = '';
        widget.style.border     = '';
        if (wc) wc.style.background = finalBg;
        if (c) c.style.background = finalBg;
        const slider = document.getElementById('widget-bg-opacity');
        const label  = document.getElementById('widget-bg-opacity-val');
        if (slider) slider.value = Math.round(opacity * 100);
        if (label)  label.textContent = Math.round(opacity * 100) + '%';
    }
}

function changeWidgetBg(input, color) {
    const widget = input.closest('.widget');
    snapshotNow();
    widget.dataset.bgColor = color;
    applyTransparency(widget, false);
    saveBoard();
}

function toggleTransparency(btn) {
    const widget = btn.closest('.widget');
    snapshotNow();
    applyTransparency(widget, widget.dataset.transparent !== "true");
    saveBoard();
}

function applyWidgetBgOpacity(value) {
    if (!currentActiveWidget) return;
    const c = currentActiveWidget.querySelector('.editor-container');
    if (!c) return;
    const opacity = parseInt(value) / 100;
    const slider = document.getElementById('widget-bg-opacity');
    if (slider) slider.value = value;
    document.getElementById('widget-bg-opacity-val').textContent = value + '%';
    const currentBg = currentActiveWidget.dataset.bgColor || '#ffffff';
    const rgb = hexToRgb(currentBg);
    if (!rgb) return;
    const newBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    currentActiveWidget.style.background = newBg;
    const wc = currentActiveWidget.querySelector('.widget-content');
    if (wc) wc.style.background = newBg;
    c.style.background = newBg;
    currentActiveWidget.dataset.bgOpacity = opacity;
    saveBoard();
}


// =========================================================================
// MENU CONTEXTUEL (bouton ☰ par widget)
// =========================================================================
function closeCtxMenuAll() {
    document.querySelectorAll('.widget-ctx-menu.open').forEach(m => m.classList.remove('open'));
}

document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.widget-ctx-menu') && !e.target.closest('.widget-menu-handle')) closeCtxMenuAll();
    if (!e.target.closest('#shape-edit-panel') && !e.target.closest('.shape-widget')) {
        if (typeof closeShapeEditPanel === 'function') closeShapeEditPanel();
    }
    if (!e.target.closest('#sc-ctx-menu') && !e.target.closest('#sc-menu-btn')) {
        const m = document.getElementById('sc-ctx-menu');
        if (m) m.classList.remove('open');
    }
});

function toggleCtxMenu(btn) {
    const widget = btn.closest('.widget, .shape-widget');
    const menu   = widget.querySelector('.widget-ctx-menu');
    if (!menu) return;
    const wasOpen = menu.classList.contains('open');
    closeCtxMenuAll();
    if (wasOpen) return;
    buildCtxMenu(menu, widget);
    menu.classList.add('open');
}

function buildCtxMenu(menu, widget) {
    const isShape = widget.classList.contains('shape-widget');
    menu.innerHTML = '';
    addCtxBtn(menu, '⧉ Dupliquer', () => {
        closeCtxMenuAll();
        if (isShape) cloneShapeWidget(widget);
        else cloneWidget(widget);
    });
    if (isShape) {
        addCtxBtn(menu, '🎨 Modifier', () => {
            closeCtxMenuAll();
            openShapeEditPanel(widget);
        });
    }
}

function addCtxBtn(menu, label, fn) {
    const btn = document.createElement('button');
    btn.innerHTML = label;
    btn.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    btn.addEventListener('click', fn);
    menu.appendChild(btn);
}


// =========================================================================
// PLACEMENT AUTO (évite les chevauchements)
// =========================================================================
function findFreePosition(widgetW, widgetH) {
    const curW = window.innerWidth, curVH = virtualH(curW);
    const W = widgetW || 320, H = widgetH || 180;
    const MARGIN = 20, STEP_X = Math.max(W, 200), STEP_Y = Math.max(H, 150);
    const occupied = Array.from(document.querySelectorAll('.widget, .shape-widget')).map(w => ({
        left: w.offsetLeft, top: w.offsetTop,
        right: w.offsetLeft + w.offsetWidth, bottom: w.offsetTop + w.offsetHeight
    }));
    // Départ : centre haut du board
    const startX = Math.round((curW - W) / 2);
    // Cherche d'abord en partant du centre, puis vers la droite, puis vers la gauche
    for (let y = MARGIN; y < curVH - H; y += STEP_Y) {
        for (let dx = 0; dx < curW; dx += STEP_X) {
            for (const dir of [0, 1, -1]) {
                const x = startX + dir * dx;
                if (x < MARGIN || x + W > curW - MARGIN) continue;
                const overlaps = occupied.some(r => x < r.right + MARGIN && x + W > r.left && y < r.bottom + MARGIN && y + H > r.top);
                if (!overlaps) return { x, y };
            }
        }
    }
    // Fallback : décalage en cascade si tout est occupé
    const count = document.querySelectorAll('.widget, .shape-widget').length;
    return { x: startX, y: (MARGIN + count * 30) % (curVH - H) };
}

// Appelé après insertion dans le DOM quand la taille du widget n'est pas connue à l'avance.
// Centre le widget horizontalement en haut du board.
function snapWidgetToTopRight(widget) {
    requestAnimationFrame(() => {
        // Le widget s'ouvre à 100px du bord gauche du board.
        widget.style.left = '100px';
        widget.style.top  = '20px';
    });
}

// Empêche un widget de dépasser du bord droit du board après rendu.
function clampWidgetToBoardRight(widget) {
    requestAnimationFrame(() => {
        const curW = window.innerWidth;
        const wLeft = widget.offsetLeft;
        const wW    = widget.offsetWidth;
        if (wLeft + wW > curW) {
            widget.style.left = Math.max(0, curW - wW) + 'px';
        }
    });
}


// =========================================================================
// BARRE D'ACTION COMPACTE — widgets < 136px de large
// =========================================================================

// Mise à jour globale de tous les widgets après un resize
function _updateAllActionBarsCompact() {
    document.querySelectorAll('.widget, .shape-widget').forEach(w => _updateActionBarCompact(w));
}
// Écouter mouseup global (fin de resize ou drag)
document.addEventListener('mouseup', () => {
    requestAnimationFrame(_updateAllActionBarsCompact);
    requestAnimationFrame(_updateScActionBarCompact);
});

// Barre d'action compacte pour #selection-controls (dessins & figures)
function _updateScActionBarCompact() {
    const sc = document.getElementById('selection-controls');
    if (!sc || sc.style.display === 'none') return;
    const w = sc.offsetWidth;
    // 5 boutons visibles × 32px + 4 gaps × 4px = ~176px nécessaires
    const BTN = 32, GAP = 4, N = 5;
    const needed = N * BTN + (N - 1) * GAP; // 176px
    const compact = w > 0 && w < needed + 20;
    const bar = document.getElementById('sc-action-bar');
    if (!bar) return;
    bar.style.gap = compact ? '2px' : '';
    bar.querySelectorAll('.sc-btn').forEach(btn => {
        btn.style.width      = compact ? '20px' : '';
        btn.style.height     = compact ? '20px' : '';
        btn.style.fontSize   = compact ? '10px' : '';
        btn.style.borderRadius = compact ? '4px' : '';
    });
}
// Observer les changements de taille de #selection-controls
document.addEventListener('DOMContentLoaded', () => {
    const sc = document.getElementById('selection-controls');
    if (sc && typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => _updateScActionBarCompact()).observe(sc);
    }
});

function _updateActionBarCompact(widget) {
    const bar = widget.querySelector('.widget-action-bar');
    if (!bar) return;
    // Pour les shapes : taille dans l'attribut width du SVG
    // Pour les widgets : taille via editor-container ou offsetWidth
    const svg = widget.querySelector('.shape-svg-wrap svg');
    const ec  = widget.querySelector('.editor-container');
    const w   = svg
        ? (parseFloat(svg.getAttribute('width')) || widget.offsetWidth)
        : (ec ? ec.offsetWidth : widget.offsetWidth);
    const BTN_NORMAL = 26, GAP_NORMAL = 4, N = 4;
    const barNeeded = N * BTN_NORMAL + (N - 1) * GAP_NORMAL; // 116px
    const compact = w > 0 && w < barNeeded + 20; // +20px de marge
    bar.style.gap = compact ? '2px' : '';
    bar.querySelectorAll('.widget-close-handle,.widget-pin-handle,.widget-back-handle,.widget-menu-handle').forEach(btn => {
        btn.style.width        = compact ? '18px' : '';
        btn.style.height       = compact ? '18px' : '';
        btn.style.fontSize     = compact ? '10px' : '';
        btn.style.borderRadius = compact ? '4px'  : '';
    });
}

// =========================================================================
// CRÉATION DE WIDGET
// =========================================================================
function createWidget(type, x = null, y = null, doSnapshot = true) {
    const _isNewPlacement = (x === null || y === null);
    if (x === null || y === null) {
        if (type === 'pdf') {
            const all = Array.from(document.querySelectorAll('.widget[data-type="pdf"]'));
            if (all.length === 0) {
                // Le PDF sera recentré après rendu via snapWidgetToTopRight
                x = '100px';
                y = '20px';
            } else {
                const last = all[all.length - 1];
                x = '100px';
                y = (last.offsetTop  + 50) + 'px';
            }
        } else if (type === 'carte') {
            x = '100px'; y = '100px';
        } else if (type === 'iframe' || type === 'youtube' || type === 'outilsprofs' || type === 'date' || type === 'time' || type === 'homework' || type === 'agenda') {
            const p = findFreePosition(); x = '100px'; y = p.y + 'px';
        } else {
            const p = findFreePosition(); x = p.x + 'px'; y = p.y + 'px';
        }
    }
    if (doSnapshot && !isInitialLoading && !isRestoringState) snapshotNow();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = type;
    widget.style.left = x; widget.style.top = y;
    widget.tabIndex = 0;

    widget.addEventListener('mousedown', (e) => {
        if (isDrawMode || isEraserMode) return;
        if (widget.dataset.background !== "true") bringToFront(widget);
    });

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget, .shape-widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget, .shape-widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="
                (function(w){
                    snapshotNow();
                    closeCtxMenuAll();
                    if(w.dataset.pdfId) localStorage.removeItem(w.dataset.pdfId);
                    w.remove();
                    saveBoard();
                })(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
        <div class="widget-content"></div>`;

    const contentZone = widget.querySelector('.widget-content');
    const tpl = document.getElementById(`template-${type}`);
    if (tpl && tpl.content) {
        contentZone.appendChild(tpl.content.cloneNode(true));
    } else {
        contentZone.innerHTML = `<div style="padding:10px;color:#b00;font-size:12px;">Type inconnu : <code>${type}</code></div>`;
    }

    board.appendChild(widget);
    bringToFront(widget);

    // Recaler le bord droit si le widget déborde (taille réelle inconnue avant rendu)
    if (_isNewPlacement) clampWidgetToBoardRight(widget);

    // Pour le premier widget PDF, forcer l'alignement coin haut-droit
    if (type === 'pdf' && document.querySelectorAll('.widget[data-type="pdf"]').length === 1) {
        snapWidgetToTopRight(widget);
    }

    // Touche Suppr/Delete = suppression du widget (quand il a le focus)
    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        // Ne pas supprimer si le focus est dans un champ texte éditable
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault();
        e.stopPropagation();
        snapshotNow();
        widget.remove();
        saveBoard();
    });

    makeDraggable(widget);
    makeDraggableRotate(widget);

    if (type === 'agenda') {
        updateClock();
        widget.querySelectorAll('.agenda-item').forEach(attachAgendaItemEvents);
    }



    // Widgets texte / devoirs : mode déplacement par défaut, double-clic pour éditer
    if (type === 'text' || type === 'homework') {
        const editor = widget.querySelector('.editor-content');
        if (editor) {
            editor.contentEditable = 'false';
            editor.style.cursor = 'move';
            editor.style.userSelect = 'none';
        }
        widget.style.cursor = 'move';

        function _enterEditMode() {
            const ed = widget.querySelector('.editor-content');
            if (!ed) return;
            ed.contentEditable = 'true';
            ed.style.cursor = 'text';
            ed.style.userSelect = 'auto';
            widget.style.cursor = 'text';
            ed.focus();
        }
        function _exitEditMode() {
            const ed = widget.querySelector('.editor-content');
            if (!ed) return;
            ed.contentEditable = 'false';
            ed.style.cursor = 'move';
            ed.style.userSelect = 'none';
            widget.style.cursor = 'move';
        }

        // Sortir du mode édition au clic en dehors
        document.addEventListener('mousedown', function onOutsideClick(ev) {
            if (widget.contains(ev.target)) return;
            if (ev.target.closest('#global-toolbar')) return;
            if (ev.target.closest('.cpick-popup')) return;
            if (ev.target.closest('.cpick-wrap')) return;
            _exitEditMode();
        });

        widget._enterEditMode = _enterEditMode;
    }

    // Initialisation des widgets spéciaux
    // Widget youtube : la barre de titre (editor-toolbar) sert de poignée de déplacement
    if (type === 'youtube') {
        // Initialiser les datasets de taille dès la création
        requestAnimationFrame(() => {
            const c = widget.querySelector('.editor-container');
            if (!c) return;
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const tb    = typeof getToolbarHeight === 'function' ? getToolbarHeight(c) : 0;
            if (!widget.dataset.widthPercent    || widget.dataset.widthPercent    === '0') widget.dataset.widthPercent    = (c.offsetWidth  / curW)  * 100;
            if (!widget.dataset.contentHPercent || widget.dataset.contentHPercent === '0') widget.dataset.contentHPercent = ((c.offsetHeight - tb) / curVH) * 100;
            if (!widget.dataset.leftPercent     || widget.dataset.leftPercent     === '0') widget.dataset.leftPercent     = (widget.offsetLeft / curW)  * 100;
            if (!widget.dataset.topPercent      || widget.dataset.topPercent      === '0') widget.dataset.topPercent      = (widget.offsetTop  / curVH) * 100;
        });

        const ytToolbar = widget.querySelector('.editor-toolbar');
        if (ytToolbar) {
            ytToolbar.style.cursor = 'move';
            const _onYtToolbarDown = (e) => {
                if (isDrawMode || isEraserMode) return;
                if (e.target.closest('button, label, input, select, a, .yt-url-bar, .yt-search-bar')) return;
                e.stopPropagation();
                widget.focus();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                startWidgetDrag({ clientX, clientY, target: e.target }, widget);
            };
            ytToolbar.addEventListener('mousedown',  _onYtToolbarDown);
            ytToolbar.addEventListener('touchstart', _onYtToolbarDown, { passive: false });
        }
    }

    // Widget iframe / carte : la barre de titre (editor-toolbar) sert de poignée de déplacement
    if (type === 'iframe' || type === 'carte') {
        // Initialiser les datasets de taille dès la création pour que saveBoard() les retrouve
        requestAnimationFrame(() => {
            const c = widget.querySelector('.editor-container');
            if (!c) return;
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const tb    = typeof getToolbarHeight === 'function' ? getToolbarHeight(c) : 0;
            if (!widget.dataset.widthPercent || widget.dataset.widthPercent === '0') {
                widget.dataset.widthPercent    = (c.offsetWidth  / curW)  * 100;
            }
            if (!widget.dataset.contentHPercent || widget.dataset.contentHPercent === '0') {
                widget.dataset.contentHPercent = ((c.offsetHeight - tb) / curVH) * 100;
            }
            if (!widget.dataset.leftPercent || widget.dataset.leftPercent === '0') {
                widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            }
            if (!widget.dataset.topPercent || widget.dataset.topPercent === '0') {
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            }
        });

        const iframeToolbar = widget.querySelector('.editor-toolbar');
        if (iframeToolbar) {
            iframeToolbar.style.cursor = 'move';
            const _onIframeToolbarDown = (e) => {
                if (isDrawMode || isEraserMode) return;
                // Ignorer les clics sur boutons, labels, inputs, selects
                if (e.target.closest('button, label, input, select, a')) return;
                e.stopPropagation();
                widget.focus();
                iframeToolbar.style.cursor = 'move';
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                startWidgetDrag({ clientX, clientY, target: e.target }, widget);
            };
            const _onIframeToolbarUp = () => { iframeToolbar.style.cursor = 'move'; };
            iframeToolbar.addEventListener('mousedown',  _onIframeToolbarDown);
            iframeToolbar.addEventListener('touchstart', _onIframeToolbarDown, { passive: false });
            iframeToolbar.addEventListener('mouseup',    _onIframeToolbarUp);
        }
    }

    // Widget PDF : la barre de titre (editor-toolbar) sert de poignée de déplacement
    if (type === 'pdf') {
        const pdfToolbar = widget.querySelector('.editor-toolbar');
        if (pdfToolbar) {
            pdfToolbar.style.cursor = 'move';
            pdfToolbar.style.touchAction = 'none'; // empêche le browser de réserver le scroll vertical avant pointermove
            const _onPdfToolbarDown = (e) => {
                if (isDrawMode || isEraserMode) return;
                // Ignorer les clics sur boutons, labels, inputs, selects
                if (e.target.closest('button, label, input, select, a')) return;
                e.stopPropagation();
                widget.focus();
                pdfToolbar.style.cursor = 'move';
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                startWidgetDrag({ clientX, clientY, target: e.target }, widget);
            };
            const _onPdfToolbarUp = () => { pdfToolbar.style.cursor = 'move'; };
            pdfToolbar.addEventListener('mousedown',  _onPdfToolbarDown);
            pdfToolbar.addEventListener('touchstart', _onPdfToolbarDown, { passive: false });
            pdfToolbar.addEventListener('mouseup',    _onPdfToolbarUp);

            // Support stylet (pointerType === 'pen') sur tablettes VPI / Wacom
            // IMPORTANT : on filtre sur 'pen' uniquement.
            // Si on laissait passer 'mouse', mousedown ET pointerdown(mouse) déclencheraient
            // tous les deux startWidgetDrag → deux instances du drag en parallèle → vitesse ×2.
            // Si on laissait passer 'touch', idem avec touchstart.
            pdfToolbar.addEventListener('pointerdown', (e) => {
                if (e.pointerType !== 'pen') return;
                if (isDrawMode || isEraserMode) return;
                if (e.target.closest('button, label, input, select, a')) return;
                e.preventDefault();
                e.stopPropagation();
                widget.focus();
                // Ne pas appeler setPointerCapture ici : startWidgetDrag écoute sur document,
                // et setPointerCapture redirige les pointermove vers l'élément capturé,
                // ce qui empêche document de les recevoir.
                startWidgetDrag({ clientX: e.clientX, clientY: e.clientY, target: e.target }, widget);
            });
        }

        // Si le mode annotation PDF est actif et qu'on clique sur un autre widget PDF,
        // re-basculer automatiquement le mode annotation sur ce widget
        widget.addEventListener('mousedown', (e) => {
            if (typeof _pdfAnnotMode === 'undefined' || !_pdfAnnotMode) return;
            if (window._pdfAnnotWidget === widget) return; // déjà sur ce widget
            // Ne switcher que si on clique sur la zone de contenu (canvas, canvasWrap)
            // et pas sur les boutons, toolbar, labels, inputs
            if (e.target.closest('button, label, input, select, a, .editor-toolbar')) return;
            if (typeof _startPdfAnnotModeOn === 'function') _startPdfAnnotModeOn(widget);
        });
        widget.addEventListener('touchstart', (e) => {
            if (typeof _pdfAnnotMode === 'undefined' || !_pdfAnnotMode) return;
            if (window._pdfAnnotWidget === widget) return;
            if (e.target.closest('button, label, input, select, a, .editor-toolbar')) return;
            if (typeof _startPdfAnnotModeOn === 'function') _startPdfAnnotModeOn(widget);
        }, { passive: true });
    }

    if (type === 'time')  { if (typeof initTimeWidget  === 'function') initTimeWidget(widget); }
    if (type === 'date')  { if (typeof initDateWidget  === 'function') initDateWidget(widget); }
    if (type === 'meteo') { if (typeof initMeteoWidget === 'function') initMeteoWidget(widget); }

    // Widget outilsprofs : la toolbar sert de poignée de déplacement
    if (type === 'outilsprofs') {
        requestAnimationFrame(() => {
            const c = widget.querySelector('.editor-container');
            if (!c) return;
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const tb    = typeof getToolbarHeight === 'function' ? getToolbarHeight(c) : 0;
            if (!widget.dataset.widthPercent    || widget.dataset.widthPercent    === '0') widget.dataset.widthPercent    = (c.offsetWidth  / curW)  * 100;
            if (!widget.dataset.contentHPercent || widget.dataset.contentHPercent === '0') widget.dataset.contentHPercent = ((c.offsetHeight - tb) / curVH) * 100;
            if (!widget.dataset.leftPercent     || widget.dataset.leftPercent     === '0') widget.dataset.leftPercent     = (widget.offsetLeft / curW)  * 100;
            if (!widget.dataset.topPercent      || widget.dataset.topPercent      === '0') widget.dataset.topPercent      = (widget.offsetTop  / curVH) * 100;
        });
        const outilsToolbar = widget.querySelector('.editor-toolbar');
        if (outilsToolbar) {
            outilsToolbar.style.cursor = 'move';
            const _onOutilsToolbarDown = (e) => {
                if (isDrawMode || isEraserMode) return;
                if (e.target.closest('button, label, input, select, a')) return;
                e.stopPropagation();
                widget.focus();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                startWidgetDrag({ clientX, clientY, target: e.target }, widget);
            };
            outilsToolbar.addEventListener('mousedown',  _onOutilsToolbarDown);
            outilsToolbar.addEventListener('touchstart', _onOutilsToolbarDown, { passive: false });
            outilsToolbar.addEventListener('mouseup', () => { outilsToolbar.style.cursor = 'move'; });
        }
    }

    const editor = widget.querySelector('.editor-content');
    if (editor) {
        editor.addEventListener('mouseup', () => {
            if (editor.contentEditable === 'true') { syncFontSize(widget); syncFontSizeGlobal(); }
        });
        editor.addEventListener('keyup', () => {
            if (editor.contentEditable === 'true') { syncFontSize(widget); syncFontSizeGlobal(); }
        });
        // Focus + toolbar uniquement si création explicite depuis le menu
        if (window._nextTextOpenCreate && !isInitialLoading && !isRestoringState) {
            window._nextTextOpenCreate = false;
            setTimeout(() => {
                if (widget._enterEditMode) widget._enterEditMode();
                openTextToolbar(widget);
            }, 30);
        }
    }

    // Mise à l'échelle si résolution ≠ 1920 px de référence
    if (!isInitialLoading && !isRestoringState) {
        const REF_W = 1920, factor = window.innerWidth / REF_W;
        if (Math.abs(factor - 1) > 0.01) {
            scaleFontSizesBy(widget, factor);
            const c = widget.querySelector('.editor-container');
            if (c?.style.width)  c.style.width  = (parseFloat(c.style.width)  * factor) + 'px';
            if (c?.style.height) c.style.height = (parseFloat(c.style.height) * factor) + 'px';
        }
        // Pour les PDFs : ne pas sauvegarder ici — le pdfId n'est pas encore posé,
        // le caller (Electron / drag&drop) appelle saveBoard() après avoir posé pdfId
        if (type !== 'pdf') saveBoard();
    }

    // Focus automatique sur l'éditeur à la création
    if (!isInitialLoading && !isRestoringState) {
        const ed = widget.querySelector('.editor-content');
        if (ed) {
            setTimeout(() => {
                ed.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(ed);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }, 50);
        }
    }

    // Barre d'action compacte : observer le contenu (resize CSS natif sur editor-container)
    if (typeof ResizeObserver !== 'undefined') {
        const _roCompact = new ResizeObserver(() => _updateActionBarCompact(widget));
        // Observer le widget ET son editor-container (resize natif CSS)
        _roCompact.observe(widget);
        const ec = widget.querySelector('.editor-container');
        if (ec) _roCompact.observe(ec);
    }
    // Appel immédiat + différé pour couvrir les widgets restaurés
    requestAnimationFrame(() => _updateActionBarCompact(widget));
    setTimeout(() => _updateActionBarCompact(widget), 200);

    return widget;
}


// =========================================================================
// DÉPLACEMENT (drag & drop)
// =========================================================================
function makeDraggable(elmnt) {
    const handle = elmnt.querySelector('.drag-handle');
    if (handle) {
        handle.style.cursor = 'move';
        handle.onmousedown = (e) => {
            e.stopPropagation();
            elmnt.focus();
            startWidgetDrag(e, elmnt);
        };
        // Stylet
        handle.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            e.stopPropagation(); e.preventDefault();
            elmnt.focus();
            startWidgetDrag(e, elmnt);
        });
        handle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            elmnt.focus();
            startWidgetDrag(e.touches[0], elmnt);
        }, { passive: false });
    }

    const isTextLike = elmnt.dataset.type === 'text' || elmnt.dataset.type === 'homework';

    if (isTextLike) {
        elmnt.addEventListener('mousedown', (e) => {
            if (isDrawMode || isEraserMode) return;
            if (e.target.closest('.drag-handle,.widget-close-handle,.widget-pin-handle,.widget-back-handle,.widget-rotate-handle,.widget-menu-handle,.widget-ctx-menu,.widget-action-bar,.custom-resize-handle')) return;
            if (e.ctrlKey || e.metaKey) return;
            const container = elmnt.querySelector('.editor-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
            }
            const editor = elmnt.querySelector('.editor-content');
            if (editor && editor.contentEditable === 'true') return;
            elmnt._dragPending = { x: e.clientX, y: e.clientY, e };
        });

        elmnt.addEventListener('dblclick', (e) => {
            if (e.target.closest('.drag-handle,.widget-close-handle,.widget-pin-handle,.widget-back-handle,.widget-rotate-handle,.widget-menu-handle,.widget-ctx-menu,.widget-action-bar,.custom-resize-handle')) return;
            elmnt._dragPending = null;
            const editor = elmnt.querySelector('.editor-content');
            if (editor) {
                if (elmnt._enterEditMode) elmnt._enterEditMode();
                else {
                    if (editor.contentEditable !== 'true') {
                        editor.contentEditable = 'true';
                        editor.style.cursor = 'text';
                        editor.style.userSelect = 'auto';
                        elmnt.style.cursor = 'text';
                    }
                    editor.focus();
                }
                const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                if (range) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                if (elmnt.dataset.type === 'text' || elmnt.dataset.type === 'homework') {
                    openTextToolbar(elmnt);
                }
            }
        });

        elmnt.addEventListener('mousemove', (e) => {
            if (!elmnt._dragPending) return;
            const editor = elmnt.querySelector('.editor-content');
            if (editor && editor.contentEditable === 'true') { elmnt._dragPending = null; return; }
            const dx = Math.abs(e.clientX - elmnt._dragPending.x);
            const dy = Math.abs(e.clientY - elmnt._dragPending.y);
            if (dx > 4 || dy > 4) {
                if (editor) {
                    editor.contentEditable = 'false';
                    editor.style.cursor = 'move';
                    editor.style.userSelect = 'none';
                }
                startWidgetDrag(elmnt._dragPending.e, elmnt);
                elmnt._dragPending = null;
            }
        });

        elmnt.addEventListener('mouseup', () => { elmnt._dragPending = null; });

        // Support tactile pour les widgets texte
        elmnt.addEventListener('touchstart', (e) => {
            if (isDrawMode || isEraserMode) return;
            if (e.target.closest('.drag-handle,.widget-close-handle,.widget-pin-handle,.widget-back-handle,.widget-rotate-handle,.widget-menu-handle,.widget-ctx-menu,.widget-action-bar,.custom-resize-handle')) return;
            const editor = elmnt.querySelector('.editor-content');
            if (editor && editor.contentEditable === 'true') return;
            const t = e.touches[0];
            elmnt._dragPending = { x: t.clientX, y: t.clientY, e: t };
        }, { passive: true });

        elmnt.addEventListener('touchmove', (e) => {
            if (!elmnt._dragPending) return;
            const editor = elmnt.querySelector('.editor-content');
            if (editor && editor.contentEditable === 'true') { elmnt._dragPending = null; return; }
            const t = e.touches[0];
            const dx = Math.abs(t.clientX - elmnt._dragPending.x);
            const dy = Math.abs(t.clientY - elmnt._dragPending.y);
            if (dx > 4 || dy > 4) {
                if (editor) {
                    editor.contentEditable = 'false';
                    editor.style.cursor = 'move';
                    editor.style.userSelect = 'none';
                }
                startWidgetDrag(elmnt._dragPending.e, elmnt);
                elmnt._dragPending = null;
            }
        }, { passive: false });

        elmnt.addEventListener('touchend', () => { elmnt._dragPending = null; });

    } else {
        // Curseur move sur les widgets non-texte (sauf types avec leur propre poignée de déplacement)
        const _NO_WIDGET_CURSOR = ['youtube', 'iframe', 'carte', 'pdf', 'outilsprofs'];
        if (!_NO_WIDGET_CURSOR.includes(elmnt.dataset.type)) {
            elmnt.style.cursor = 'move';
        }
        // Sélecteur d'exclusions commun (souris, tactile, stylet)
        const _DRAG_EXCLUDE = '.drag-handle,.widget-close-handle,.widget-pin-handle,.widget-back-handle,.widget-rotate-handle,.widget-menu-handle,.widget-ctx-menu,.widget-action-bar,.custom-resize-handle,.editor-toolbar,.tirage-header,.agenda-time,.agenda-text,.agenda-add-btn,.agenda-row-handle,.agenda-delete-row,.meteo-city,.s3d-canvas,.s3d-resize-handle,.s3d-zoom-slider,' +
            'button,input,select,textarea,label,.ng-params-btn,.ng-help-btn,.ng-nature-check,.ng-params-apply-btn,.ng-btn,.ng-word-token,.ng-placed-word,.ng-rm-btn,.ng-corr-token,.ng-resize-handle,.ng-nature-picker,.wf-btn,' +
            '.de-dice-svg,.de-dice-zone,.de-controls,.de-faces-row,.de-history-row,.de-resize-handle,' +
            '.cpick-wrap,.cpick-popup,.cpick-swatch,.cpick-color-btn,.cpick-palette,.cpick-row,' +
            '.frac-swatch,.frac-color-swatches';

        elmnt.addEventListener('mousedown', (e) => {
            if (isDrawMode || isEraserMode) return;
            if (e.target.closest(_DRAG_EXCLUDE)) return;
            if (e.target.tagName === 'IFRAME' || e.target.tagName === 'EMBED') return;
            if (elmnt.dataset.type === 'pdf' && e.target.closest('.pdf-canvas-wrap')) return;
            const container = elmnt.querySelector('.editor-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return;
            }
            if (e.ctrlKey || e.metaKey) return;
            elmnt.focus();
            startWidgetDrag(e, elmnt);
        });

        // Stylet (pointerType === 'pen') — même logique que mousedown
        elmnt.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            if (isDrawMode || isEraserMode) return;
            if (e.target.closest(_DRAG_EXCLUDE)) return;
            if (e.target.tagName === 'IFRAME' || e.target.tagName === 'EMBED') return;
            if (elmnt.dataset.type === 'pdf' && e.target.closest('.pdf-canvas-wrap')) return;
            e.preventDefault();
            elmnt.focus();
            startWidgetDrag(e, elmnt);
        });

        elmnt.addEventListener('touchstart', (e) => {
            if (isDrawMode || isEraserMode) return;
            if (e.target.closest(_DRAG_EXCLUDE)) return;
            if (e.target.tagName === 'IFRAME' || e.target.tagName === 'EMBED') return;
            if (elmnt.dataset.type === 'pdf' && e.target.closest('.pdf-canvas-wrap')) return;
            elmnt.focus();
            startWidgetDrag(e.touches[0], elmnt);
        }, { passive: false });
    }

    // Poignée de resize custom (touch + stylet + souris) — pour tous les widgets
    makeResizableByHandle(elmnt);
}

// =========================================================================
// RESIZE CUSTOM (touch / stylet / souris)
// Remplace le resize CSS natif qui ne fonctionne pas en tactile/stylet
// =========================================================================
function makeResizableByHandle(elmnt) {
    const container = elmnt.querySelector('.editor-container') || elmnt.querySelector('.hrlg-container') || elmnt.querySelector('.snd-container');
    if (!container) return;

    // Éviter de créer deux poignées
    if (elmnt.querySelector('.custom-resize-handle')) return;

    // La poignée est placée sur le WIDGET (pas sur editor-container qui a overflow:hidden)
    const handle = document.createElement('div');
    handle.className = 'custom-resize-handle';
    handle.title = 'Redimensionner';
    handle.style.cursor = 'se-resize';
    // Pas de style inline : le CSS de index.html contrôle l'apparence et la visibilité au survol

    // Le widget doit être en position relative pour que absolute fonctionne
    if (getComputedStyle(elmnt).position === 'static') {
        elmnt.style.position = 'relative';
    }
    elmnt.appendChild(handle);

    handle.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;

        function onMove(ev) {
            ev.preventDefault();
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            const minW = parseInt(getComputedStyle(container).minWidth) || 180;
            const minH = parseInt(getComputedStyle(container).minHeight) || 70;
            const newW = Math.max(minW, startW + dx);
            container.style.width = newW + 'px';
            // Synchroniser la largeur du widget parent (cadre) avec le contenu
            // elmnt est box-sizing:border-box avec border 2px ; widget-content a padding 10px
            const wContent = elmnt.querySelector('.widget-content');
            const contentPad = wContent ? (parseFloat(getComputedStyle(wContent).paddingLeft) + parseFloat(getComputedStyle(wContent).paddingRight)) : 0;
            const elmntBorder = parseFloat(getComputedStyle(elmnt).borderLeftWidth || 0) + parseFloat(getComputedStyle(elmnt).borderRightWidth || 0);
            elmnt.style.width = (newW + contentPad + elmntBorder) + 'px';
            const newH = Math.max(minH, startH + dy);
            container.style.height = newH + 'px';
        }

        function onUp() {
            handle.removeEventListener('pointermove',   onMove);
            handle.removeEventListener('pointerup',     onUp);
            handle.removeEventListener('pointercancel', onUp);
            // Nettoyer les styles inline pour que le CSS reprenne le contrôle de la visibilité
            handle.style.opacity = '';
            handle.style.pointerEvents = '';
            elmnt.blur();
            if (typeof saveBoard === 'function') saveBoard();
        }

        handle.addEventListener('pointermove',   onMove);
        handle.addEventListener('pointerup',     onUp);
        handle.addEventListener('pointercancel', onUp);
    });
}

function startWidgetDrag(e, elmnt) {
    if (e && e.preventDefault) e.preventDefault();

    // Bloquer le scroll du body pendant le drag (critique pour stylet sur VPI :
    // le navigateur décide de scroller dès le pointerdown selon pointerType=pen,
    // et preventDefault() sur pointermove arrive trop tard)
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = 'none';

    // Si le widget appartient à un groupe, déplacer tous les membres du groupe
    const groupId = elmnt.dataset.groupId;
    const groupMembers = groupId
        ? Array.from(document.querySelectorAll(`.widget[data-group-id="${groupId}"], .shape-widget[data-group-id="${groupId}"]`))
        : [elmnt];

    // Sélectionner tout le groupe dans selectedWidgets pour que le cadre et le resize suivent
    if (groupId && typeof selectedWidgets !== 'undefined') {
        document.querySelectorAll('.widget.selected, .shape-widget.selected').forEach(w => w.classList.remove('selected'));
        selectedWidgets = groupMembers;
        groupMembers.forEach(w => w.classList.add('selected'));
        if (typeof updateSelectionOverlay === 'function') updateSelectionOverlay();
    }

    groupMembers.forEach(w => { if (w.dataset.background !== "true") bringToFront(w); });
    snapshotNow();

    // Overlay transparent sur les iframes pour capturer les événements souris
    const overlays = [];
    document.querySelectorAll('.widget iframe, .widget embed').forEach(el => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;inset:0;z-index:9999;background:transparent;';
        el.parentElement.style.position = 'relative';
        el.parentElement.appendChild(overlay);
        overlays.push(overlay);
    });

    // Approche "offset fixe" (comme widget-calcul) :
    // on calcule une seule fois l'écart entre le pointeur et le coin du widget,
    // puis on positionne en absolu. Cela évite tout cumul d'erreurs et le
    // double-comptage stylet (pointermove parasite juste après pointerdown).
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    // Mémoriser la position initiale de chaque membre du groupe
    const startPositions = groupMembers.map(w => ({
        left: w.offsetLeft,
        top:  w.offsetTop
    }));

    function applyMove(clientX, clientY) {
        const dx = clientX - startClientX;
        const dy = clientY - startClientY;
        groupMembers.forEach((w, i) => {
            w.style.left = (startPositions[i].left + dx) + "px";
            w.style.top  = (startPositions[i].top  + dy) + "px";
        });
        if (typeof updateSelectionOverlay === 'function') updateSelectionOverlay();
    }

    function onPointerMove(ev) {
        ev.preventDefault(); // bloque le scroll du board pendant le drag
        applyMove(ev.clientX, ev.clientY);
    }

    // Fallback touch (navigateurs anciens sans pointer events complets)
    function onTouchMove(ev) {
        if (ev.touches && ev.touches[0]) {
            applyMove(ev.touches[0].clientX, ev.touches[0].clientY);
        }
    }

    function onEnd() {
        document.body.style.touchAction = prevTouchAction; // restaurer le scroll
        document.removeEventListener('pointermove',  onPointerMove);
        document.removeEventListener('pointerup',    onEnd);
        document.removeEventListener('pointercancel',onEnd);
        document.removeEventListener('touchmove',    onTouchMove);
        document.removeEventListener('touchend',     onEnd);
        overlays.forEach(o => o.remove());
        const curW = window.innerWidth, curVH = virtualH(curW);
        groupMembers.forEach(w => {
            w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
            w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
        });
        if (typeof updateSelectionOverlay === 'function') updateSelectionOverlay();
        saveBoard();
    }

    document.addEventListener('pointermove',  onPointerMove, { passive: false });
    document.addEventListener('pointerup',    onEnd);
    document.addEventListener('pointercancel',onEnd);
    document.addEventListener('touchmove',    onTouchMove, { passive: false });
    document.addEventListener('touchend',     onEnd);
}


// =========================================================================
// ROTATION
// =========================================================================
function makeDraggableRotate(elmnt) {
    const handle = elmnt.querySelector('.widget-rotate-handle');
    if (!handle) return;

    handle.style.cursor = 'grab';

    handle.ondblclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        elmnt.style.transform = '';
        hideRotationIndicator();
        saveBoard();
    };

    function startRotate(clientX, clientY) {
        bringToFront(elmnt);
        snapshotNow();
        const rect = elmnt.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const startAngle = Math.atan2(clientY - cy, clientX - cx);
        const startRot   = getCurrentRotation(elmnt);
        const indicator  = document.getElementById('rotation-indicator');

        function onMove(ev) {
            const point = ev.touches ? ev.touches[0] : ev;
            const newRot = startRot + (Math.atan2(point.clientY - cy, point.clientX - cx) - startAngle) * 180 / Math.PI;
            const snapped = snapRotation(newRot);
            elmnt.style.transform = `rotate(${snapped}deg)`;
            if (indicator) {
                const deg = Math.round(((snapped % 360) + 360) % 360);
                document.getElementById('rot-deg').textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = point.clientX + 'px';
                indicator.style.top  = point.clientY + 'px';
                indicator.querySelector('.rot-reset-hint').style.display = (deg === 0) ? 'none' : 'inline';
            }
        }

        function onPointerMove(ev) {
            if (ev.pointerType === 'mouse') return;
            onMove(ev);
        }
        function onPointerEnd(ev) {
            if (ev.pointerType === 'mouse') return;
            onEnd();
        }

        function onEnd() {
            document.removeEventListener('mousemove',    onMove);
            document.removeEventListener('mouseup',      onEnd);
            document.removeEventListener('pointermove',  onPointerMove);
            document.removeEventListener('pointerup',    onPointerEnd);
            document.removeEventListener('pointercancel',onPointerEnd);
            document.removeEventListener('touchmove',    onMove);
            document.removeEventListener('touchend',     onEnd);
            handle.style.cursor = 'grab';
            hideRotationIndicator();
            saveBoard();
        }

        document.addEventListener('mousemove',    onMove);
        document.addEventListener('mouseup',      onEnd);
        document.addEventListener('pointermove',  onPointerMove);
        document.addEventListener('pointerup',    onPointerEnd);
        document.addEventListener('pointercancel',onPointerEnd);
        document.addEventListener('touchmove',    onMove, { passive: false });
        document.addEventListener('touchend',     onEnd);
    }

    handle.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        handle.style.cursor = 'grabbing';
        startRotate(e.clientX, e.clientY);
    };

    // Stylet
    handle.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault(); e.stopPropagation();
        startRotate(e.clientX, e.clientY);
    });

    handle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        startRotate(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
}

function getCurrentRotation(widget) {
    const m = widget.style.transform?.match(/rotate\(([-\d.]+)deg\)/);
    return m ? parseFloat(m[1]) : 0;
}

function snapRotation(deg) {
    const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    const norm = ((deg % 360) + 360) % 360;
    for (const s of snaps) {
        if (Math.abs(norm - s) < 2) return s === 360 ? 0 : s;
    }
    return deg;
}

function hideRotationIndicator() {
    const ind = document.getElementById('rotation-indicator');
    if (ind) ind.style.display = 'none';
}


// =========================================================================
// CLONAGE
// =========================================================================
function cloneWidget(widget) {
    snapshotNow();
    const x = (widget.offsetLeft + 30) + 'px';
    const y = (widget.offsetTop  + 30) + 'px';
    const rot = getCurrentRotation(widget);

    // Cas sticker (image animée ou émoji classique) : clonage direct sans passer par createWidget (pas de template)
    if (widget.dataset.type === 'sticker' && (widget.querySelector('img') || widget.querySelector('[data-sticker-type="emoji"]'))) {
        const srcImg = widget.querySelector('img');
        // Dupliquer le nœud DOM directement
        const clone = widget.cloneNode(true);
        clone.style.left = x;
        clone.style.top  = y;
        // Recréer les listeners (cloneNode ne les copie pas)
        clone.addEventListener('mousedown', () => {
            bringToFront(clone);
            clone.focus();
            if (typeof positionActionBar === 'function') positionActionBar(clone);
        });
        // Supprimer l'ancienne poignée de resize clonée et en créer une neuve
        clone.querySelectorAll('[style*="se-resize"]').forEach(el => el.remove());
        board.appendChild(clone);
        bringToFront(clone);
        makeDraggable(clone);
        makeDraggableRotate(clone);
        if (typeof _addStickerResizeHandle === 'function') _addStickerResizeHandle(clone, 40);
        if (rot) clone.style.transform = `rotate(${rot}deg)`;
        saveBoard();
        return;
    }

    // Widgets avec factory dédiée (pas de template HTML)
    if (widget.dataset.type === 'tableau-num') {
        const newWidget = createTableauNumWidget();
        newWidget.style.left = x; newWidget.style.top = y;
        if (widget._tnumGetData && newWidget._tnumSetData) {
            newWidget._tnumSetData(JSON.parse(JSON.stringify(widget._tnumGetData())));
        }
        const ec = newWidget.querySelector('.editor-container');
        const src = widget.querySelector('.editor-container');
        if (ec && src) { ec.style.width = src.style.width; ec.style.height = src.style.height; }
        if (rot) newWidget.style.transform = `rotate(${rot}deg)`;
        saveBoard();
        return;
    }

    if (widget.dataset.type === 'monnaie' && typeof createMonnaieWidget === 'function') {
        const newWidget = createMonnaieWidget();
        newWidget.style.left = x; newWidget.style.top = y;
        const level = widget.dataset.monnaieLevel || 'facile';
        if (newWidget._setLevel) newWidget._setLevel(level);
        const mc = widget.querySelector('.monnaie-container');
        const nc = newWidget.querySelector('.monnaie-container');
        if (mc && nc) nc.style.width = mc.style.width || mc.offsetWidth + 'px';
        if (rot) newWidget.style.transform = `rotate(${rot}deg)`;
        saveBoard();
        return;
    }

    if (widget.dataset.type === 'conjugaison' && typeof createConjugaisonWidget === 'function') {
        const newWidget = createConjugaisonWidget();
        newWidget.style.left = x; newWidget.style.top = y;
        const cc = widget.querySelector('.conj-container');
        const cg = widget.querySelector('.conj-grid');
        const nc = newWidget.querySelector('.conj-container');
        const ng = newWidget.querySelector('.conj-grid');
        if (cc && nc) nc.style.width = cc.style.width || cc.offsetWidth + 'px';
        if (cg && ng) ng.style.height = cg.style.height || cg.offsetHeight + 'px';
        if (rot) newWidget.style.transform = `rotate(${rot}deg)`;
        saveBoard();
        return;
    }

    if (widget.dataset.type === 'heure' && typeof createHeureWidget === 'function') {
        const newWidget = createHeureWidget();
        newWidget.style.left = x; newWidget.style.top = y;
        const level = widget.dataset.heureLevel || 'facile';
        const mode  = widget.dataset.heureMode  || 'lecture';
        if (newWidget._setMode)  newWidget._setMode(mode);
        if (newWidget._setLevel) newWidget._setLevel(level);
        const hc = widget.querySelector('.heure-container');
        const hz = widget.querySelector('.heure-clocks-zone');
        const nc = newWidget.querySelector('.heure-container');
        const nz = newWidget.querySelector('.heure-clocks-zone');
        if (hc && nc) nc.style.width  = hc.style.width  || hc.offsetWidth  + 'px';
        if (hz && nz) nz.style.height = hz.style.height || hz.offsetHeight + 'px';
        if (rot) newWidget.style.transform = `rotate(${rot}deg)`;
        saveBoard();
        return;
    }

    // Widgets standard avec template HTML
    const newWidget = createWidget(widget.dataset.type, x, y, false);
    const sc = widget.querySelector('.editor-container'), dc = newWidget.querySelector('.editor-container');
    if (sc && dc) {
        dc.style.width  = sc.style.width  || sc.offsetWidth  + 'px';
        dc.style.height = sc.style.height || sc.offsetHeight + 'px';
    }
    const se = widget.querySelector('.editor-content'), de = newWidget.querySelector('.editor-content');
    if (se && de) de.innerHTML = se.innerHTML;
    const sa = widget.querySelector('.agenda-list'), da = newWidget.querySelector('.agenda-list');
    if (sa && da) { da.innerHTML = sa.innerHTML; da.querySelectorAll('.agenda-item').forEach(attachAgendaItemEvents); }
    const si = widget.querySelector('iframe'), di = newWidget.querySelector('iframe');
    if (si && di) di.src = si.src;
    if (rot) newWidget.style.transform = `rotate(${rot}deg)`;
    if (widget.dataset.transparent === "true") applyTransparency(newWidget, true);
    else if (widget.dataset.bgColor) { newWidget.dataset.bgColor = widget.dataset.bgColor; newWidget.style.background = widget.dataset.bgColor; }
    saveBoard();
}


// =========================================================================
// SYNCHRONISATION TAILLE DE POLICE (toolbar locale)
// =========================================================================
function syncFontSize(widget) {
    const toolbar = widget.querySelector('.editor-toolbar');
    if (!toolbar) return;
    const sizeInput = toolbar.querySelector('input[type="number"]');
    if (!sizeInput) return;
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const size = window.getComputedStyle(sel.anchorNode.parentElement).fontSize;
        if (size) sizeInput.value = parseInt(size);
    }
}


// =========================================================================
// AGENDA — lignes drag-and-drop
// =========================================================================
let dragSrcRow = null;

function attachAgendaItemEvents(item) {
    item.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.addEventListener('mouseenter', () => item.draggable = false);
        el.addEventListener('mouseleave', () => item.draggable = true);
        el.addEventListener('input', saveBoard);
    });
    item.addEventListener('dragstart', handleRowDragStart);
    item.addEventListener('dragover',  handleRowDragOver);
    item.addEventListener('dragend',   handleRowDragEnd);
}

function handleRowDragStart(e) {
    dragSrcRow = this;
    this.classList.add('dragging');
}

function handleRowDragOver(e) {
    e.preventDefault();
    if (!dragSrcRow || dragSrcRow === this) return;
    const list = this.parentNode, items = [...list.querySelectorAll('.agenda-item')];
    list.insertBefore(dragSrcRow, items.indexOf(dragSrcRow) < items.indexOf(this) ? this.nextSibling : this);
}

function handleRowDragEnd() {
    this.classList.remove('dragging');
    dragSrcRow = null;
    saveBoard();
}

function addAgendaLine(btn) {
    snapshotNow();
    const list = btn.closest('.agenda-container').querySelector('.agenda-list');
    const item = document.createElement('div');
    item.className = 'agenda-item';
    item.draggable = true;
    item.innerHTML = `<span class="agenda-row-handle">⋮⋮</span><span class="agenda-time" contenteditable="true">--:--</span><div class="agenda-text" contenteditable="true">Nouvelle ligne</div><span class="agenda-delete-row" onclick="deleteAgendaLine(this)" title="Supprimer">×</span>`;
    list.appendChild(item);
    attachAgendaItemEvents(item);
    saveBoard();
}

function deleteAgendaLine(btn) {
    snapshotNow();
    btn.closest('.agenda-item').remove();
    saveBoard();
}


// =========================================================================
// COMPATIBILITÉ — ancien menu
// =========================================================================
function toggleMenu() {
    if (typeof closeMainMenu === 'function') closeMainMenu();
}
