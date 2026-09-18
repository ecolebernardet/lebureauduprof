// =========================================================================
// Fonction commune de drag toolbar : souris + touch + stylet (pointer events)
    function _addToolbarDrag(handle, bar, onSave, drawMode) {
        function startDrag(clientX, clientY, pointerId) {
            handle.style.cursor = 'grabbing';
            const rect = bar.getBoundingClientRect();
            let offX = clientX - rect.left, offY = clientY - rect.top;

            function onMove(ev) {
                const cx = ev.clientX, cy = ev.clientY;
                if (drawMode) {
                    const THRESH = 80;
                    const goH = cy < THRESH || cy > window.innerHeight - THRESH;
                    if (goH !== bar.classList.contains('horizontal')) {
                        bar.classList.toggle('horizontal', goH);
                        void bar.offsetHeight;
                        offY = bar.offsetHeight / 2;
                        offX = Math.min(offX, bar.offsetWidth / 2);
                    }
                }
                const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
                let l = Math.max(0, Math.min(cx - offX, window.innerWidth  - bar.offsetWidth  - Math.max(scrollbarW, 12)));
                let t = Math.max(0, Math.min(cy - offY, window.innerHeight - bar.offsetHeight));
                bar.style.left = l + 'px'; bar.style.top = t + 'px';
                bar.style.bottom = 'auto'; bar.style.right = 'auto';
            }
            function onUp() {
                handle.style.cursor = 'grab';
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup',   onUp);
                handle.removeEventListener('pointercancel', onUp);
                if (onSave) onSave();
            }
            handle.setPointerCapture(pointerId);
            handle.addEventListener('pointermove',   onMove);
            handle.addEventListener('pointerup',     onUp);
            handle.addEventListener('pointercancel', onUp);
        }

        handle.addEventListener('pointerdown', function(e) {
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            startDrag(e.clientX, e.clientY, e.pointerId);
        });
    }

// =========================================================================
// WIDGET PDF — PLIER / DÉPLIER
// =========================================================================
// =========================================================================
// PLEIN ÉCRAN BOARD — PDF (occupe le board sans F11)
// =========================================================================
// =========================================================================
// PDF PLEIN ÉCRAN BOARD — Système d'onglets multi-PDF
// =========================================================================

// Retourne ou crée la barre d'onglets
function _getPdfTabBar() {
    let bar = document.getElementById('pdf-fs-tabbar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'pdf-fs-tabbar';
        bar.style.display = 'none';
        document.body.appendChild(bar);
    }
    return bar;
}

// Retourne tous les containers PDF actuellement en plein écran board
function _getPdfFsContainers() {
    return Array.from(document.querySelectorAll('.editor-container.wf-pdf-fullboard'));
}

// Reconstruit la barre d'onglets à partir des PDFs en cours
function _refreshPdfTabBar() {
    const bar = _getPdfTabBar();
    const containers = _getPdfFsContainers();

    if (containers.length < 2) {
        // 0 ou 1 PDF en plein écran → pas de barre d'onglets
        bar.style.display = 'none';
        bar.innerHTML = '';
        // Retirer la classe tabbed de tous
        containers.forEach(c => {
            c.classList.remove('pdf-fs-tabbed');
            const w = c.closest('.widget');
            if (w) w.classList.remove('wf-pdf-widget-tabbed');
        });
        return;
    }

    bar.style.display = 'flex';

    // Bloquer TOUS les pointerdown stylet/touch sur la barre (même sur l'espace vide)
    // pour qu'ils n'atteignent jamais le board en dessous
    if (!bar._penDownBlocked) {
        bar._penDownBlocked = true;
        bar.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.stopPropagation();
            e.preventDefault();
        });
    }

    // Reconstruire les onglets
    bar.innerHTML = '';
    containers.forEach((c, i) => {
        const widget = c.closest('.widget');
        const filename = (widget && widget.dataset.pdfName) || c.querySelector('.pdf-filename')?.textContent || ('PDF ' + (i + 1));
        const isActive = !c.classList.contains('pdf-fs-hidden');

        const tab = document.createElement('div');
        tab.className = 'pdf-fs-tab' + (isActive ? ' active' : '');
        tab.dataset.idx = i;
        tab.innerHTML = `
            <span class="tab-label" title="${filename}">📄 ${filename}</span>
            <button class="tab-wf-btn tab-wf-btn-max"  title="Quitter le plein écran pour ce PDF"></button>
            <button class="tab-wf-btn tab-wf-btn-close" title="Fermer ce PDF"></button>
        `;

        // Clic sur l'onglet → activer ce PDF
        tab.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('tab-wf-btn')) return;
            e.stopPropagation();
            _activatePdfFsTab(c);
        });
        tab.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('tab-wf-btn')) return;
            e.preventDefault();
            e.stopPropagation();
            _activatePdfFsTab(c);
        });
        // Support stylet : capture le pointeur dès le pointerdown pour que
        // le board ne reçoive jamais l'événement (setPointerCapture est la seule
        // méthode fiable sur tablettes VPI / Wacom)
        tab.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.stopPropagation();
            e.preventDefault();
            try { tab.setPointerCapture(e.pointerId); } catch(_) {}
            tab._penPointerId = e.pointerId;
        });
        tab.addEventListener('pointerup', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.preventDefault();
            e.stopPropagation();
            try { tab.releasePointerCapture(e.pointerId); } catch(_) {}
            if (e.target.classList.contains('tab-wf-btn')) return;
            if (tab._tabPenBusy) return;
            tab._tabPenBusy = true;
            setTimeout(() => { tab._tabPenBusy = false; }, 300);
            _activatePdfFsTab(c);
        });
        tab.addEventListener('pointercancel', (e) => {
            try { tab.releasePointerCapture(e.pointerId); } catch(_) {}
        });

        // Bouton vert → quitter le plein écran pour ce PDF
        const btnMax = tab.querySelector('.tab-wf-btn-max');
        const _doBtnMax = () => togglePdfBoardFullscreen(c);
        btnMax.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.stopPropagation(); e.preventDefault();
            try { btnMax.setPointerCapture(e.pointerId); } catch(_) {}
        });
        btnMax.addEventListener('pointerup', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.preventDefault(); e.stopPropagation();
            try { btnMax.releasePointerCapture(e.pointerId); } catch(_) {}
            if (btnMax._penBusy) return;
            btnMax._penBusy = true; btnMax._penTime = Date.now();
            setTimeout(() => { btnMax._penBusy = false; }, 600);
            _doBtnMax();
        });
        btnMax.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btnMax._penTime && Date.now() - btnMax._penTime < 700) return;
            _doBtnMax();
        });
        btnMax.addEventListener('pointercancel', (e) => {
            try { btnMax.releasePointerCapture(e.pointerId); } catch(_) {}
        });

        // Bouton rouge → fermer le PDF (supprimer le widget)
        const btnClose = tab.querySelector('.tab-wf-btn-close');
        const _doBtnClose = () => {
            const w = c.closest('.widget');
            const wasActive = !c.classList.contains('pdf-fs-hidden');
            _exitFsOne(c);
            if (w) {
                snapshotNow();
                if (w.dataset.pdfId) localStorage.removeItem(w.dataset.pdfId);
                window._pdfFsManualClose = true;
                w.remove();
                window._pdfFsManualClose = false;
                saveBoard();
            }
            if (wasActive) {
                const remaining = _getPdfFsContainers();
                if (remaining.length > 0) { _activatePdfFsTab(remaining[0]); return; }
            }
            _refreshPdfTabBar();
        };
        btnClose.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.stopPropagation(); e.preventDefault();
            try { btnClose.setPointerCapture(e.pointerId); } catch(_) {}
        });
        btnClose.addEventListener('pointerup', (e) => {
            if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
            e.preventDefault(); e.stopPropagation();
            try { btnClose.releasePointerCapture(e.pointerId); } catch(_) {}
            if (btnClose._penBusy) return;
            btnClose._penBusy = true; btnClose._penTime = Date.now();
            setTimeout(() => { btnClose._penBusy = false; }, 600);
            _doBtnClose();
        });
        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btnClose._penTime && Date.now() - btnClose._penTime < 700) return;
            _doBtnClose();
        });
        btnClose.addEventListener('pointercancel', (e) => {
            try { btnClose.releasePointerCapture(e.pointerId); } catch(_) {}
        });

        bar.appendChild(tab);

        // Appliquer la classe tabbed pour le décalage
        c.classList.add('pdf-fs-tabbed');
        if (widget) widget.classList.add('wf-pdf-widget-tabbed');
    });

    // Espaceur poussant le bouton "Tout quitter" à droite
    const spacer = document.createElement('div');
    spacer.style.cssText = 'flex:1;min-width:8px;';
    bar.appendChild(spacer);

    // Bouton "Tout quitter"
    const exitAllBtn = document.createElement('button');
    exitAllBtn.id = 'pdf-fs-exit-all';
    exitAllBtn.title = 'Quitter le plein écran pour tous les PDFs';
    exitAllBtn.textContent = '✕ Tout quitter';
    const _doExitAll = () => {
        _getPdfFsContainers().slice().forEach(c => _exitFsOne(c));
        _refreshPdfTabBar();
    };
    exitAllBtn.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
        e.stopPropagation(); e.preventDefault();
        try { exitAllBtn.setPointerCapture(e.pointerId); } catch(_) {}
    });
    exitAllBtn.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
        e.preventDefault(); e.stopPropagation();
        try { exitAllBtn.releasePointerCapture(e.pointerId); } catch(_) {}
        if (exitAllBtn._penBusy) return;
        exitAllBtn._penBusy = true; exitAllBtn._penTime = Date.now();
        setTimeout(() => { exitAllBtn._penBusy = false; }, 600);
        _doExitAll();
    });
    exitAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (exitAllBtn._penTime && Date.now() - exitAllBtn._penTime < 700) return;
        _doExitAll();
    });
    exitAllBtn.addEventListener('pointercancel', (e) => {
        try { exitAllBtn.releasePointerCapture(e.pointerId); } catch(_) {}
    });
    bar.appendChild(exitAllBtn);
}

// Active un PDF (le rend visible), cache les autres
function _activatePdfFsTab(targetContainer) {
    const containers = _getPdfFsContainers();
    containers.forEach(c => {
        const widget = c.closest('.widget');
        if (c === targetContainer) {
            c.classList.remove('pdf-fs-hidden');
            c.style.display = '';
            if (widget) { widget.style.display = ''; widget.style.visibility = 'visible'; }
        } else {
            c.classList.add('pdf-fs-hidden');
            c.style.display = 'none';
            if (widget) { widget.style.visibility = 'hidden'; widget.style.display = 'none'; }
        }
    });
    // Quand on change d'onglet, toujours repasser en mode déplacer/scroller
    // (ne pas ré-activer le mode crayon sur le nouveau widget)
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode &&
        typeof _stopPdfAnnotMode === 'function') {
        _stopPdfAnnotMode();
    }
    _refreshPdfTabBar();
}

// Restaure UN container hors plein écran SANS toucher à la tabbar
// (à appeler en batch ; appeler _refreshPdfTabBar() après)
function _exitFsOne(container) {
    const widget = container.closest('.widget');
    container.classList.remove('wf-pdf-fullboard');
    container.classList.remove('pdf-fs-tabbed');
    container.classList.remove('pdf-fs-hidden');
    container.style.display    = '';
    container.style.width      = container.dataset.pfSavedW || '';
    container.style.height     = container.dataset.pfSavedH || '';
    if (widget) {
        widget.classList.remove('wf-pdf-widget-tabbed');
        widget.style.position   = container.dataset.pfSavedWPos  || '';
        widget.style.top        = container.dataset.pfSavedWTop  || '';
        widget.style.left       = container.dataset.pfSavedWLeft || '';
        widget.style.zIndex     = container.dataset.pfSavedWZ    || '';
        widget.style.width      = '';
        widget.style.height     = '';
        widget.style.display    = '';
        widget.style.visibility = '';
    }
}

function togglePdfBoardFullscreen(container) {
    if (!container) return;
    const widget = container.closest('.widget');
    const isMax = container.classList.contains('wf-pdf-fullboard');

    if (isMax) {
        // ── Sortir du plein écran (ce PDF uniquement) ──────────────────
        _exitFsOne(container);

        // Si d'autres PDFs sont encore en fullscreen, s'assurer qu'il y en a un visible
        const remaining = _getPdfFsContainers();
        if (remaining.length > 0) {
            const visible = remaining.find(c => !c.classList.contains('pdf-fs-hidden'));
            if (!visible) _activatePdfFsTab(remaining[0]);
            else _refreshPdfTabBar();
        } else {
            _refreshPdfTabBar();
        }

    } else {
        // ── Mettre en plein écran ──────────────────────────────────────
        // Fonction interne : passer UN container en fullscreen sans récursion
        function _enterFs(c) {
            const w = c.closest('.widget');
            c.dataset.pfSavedW    = c.style.width  || c.offsetWidth  + 'px';
            c.dataset.pfSavedH    = c.style.height || c.offsetHeight + 'px';
            if (w) {
                c.dataset.pfSavedWPos  = w.style.position || '';
                c.dataset.pfSavedWTop  = w.style.top      || '';
                c.dataset.pfSavedWLeft = w.style.left     || '';
                c.dataset.pfSavedWZ    = w.style.zIndex   || '';
                w.style.position   = 'fixed';
                w.style.top        = '0';
                w.style.left       = '0';
                w.style.width      = '100%';
                w.style.height     = '100%';
                w.style.zIndex     = '9999';
            }
            c.classList.add('wf-pdf-fullboard');
        }

        // Passer ce container en fullscreen
        _enterFs(container);

        // Passer AUSSI tous les autres widgets PDF (non encore en fullscreen) en fullscreen
        const allPdfContainers = Array.from(
            document.querySelectorAll('.widget[data-type="pdf"] .editor-container')
        ).filter(c => c !== container && !c.classList.contains('wf-pdf-fullboard'));

        allPdfContainers.forEach(c => _enterFs(c));

        // Activer l'onglet du PDF qu'on vient d'ouvrir, cacher les autres
        _activatePdfFsTab(container);
    }
}

function togglePdfCollapse(container) {
    if (!container) return;
    const widget = container.closest('.widget');
    if (!widget) return;
    const isCollapsed = container.dataset.collapsed === 'true';

    if (isCollapsed) {
        // ── DÉPLIER ──────────────────────────────────────────────────────
        // Restaurer la position et taille d'origine
        widget.style.top          = container.dataset.savedTop  || widget.style.top;
        widget.style.left         = container.dataset.savedLeft || widget.style.left;
        widget.style.width        = '';
        widget.style.height       = '';
        widget.style.zIndex       = '';
        widget.style.background   = '';
        widget.style.borderRadius = '';
        widget.style.border       = '';
        widget.style.display      = '';
        widget.style.overflow     = '';
        widget.style.padding      = '';

        // Restaurer le widget-content
        const widgetContent = widget.querySelector('.widget-content');
        if (widgetContent) {
            widgetContent.style.padding      = '';
            widgetContent.style.background   = '';
            widgetContent.style.borderRadius = '';
        }

        // Restaurer l'editor-container
        container.style.width        = container.dataset.savedW  || '600px';
        container.style.height       = container.dataset.savedH  || '500px';
        container.style.overflow     = '';
        container.style.borderRadius = '';
        container.style.background   = '';
        container.style.border       = '';
        container.style.padding      = '';
        container.style.margin       = '';
        container.style.position     = '';

        // Réafficher les éléments cachés
        container.querySelector('.editor-toolbar').style.display = '';
        const placeholder = container.querySelector('.pdf-placeholder');
        const canvasWrap  = container.querySelector('.pdf-canvas-wrap');
        if (placeholder) placeholder.style.display = placeholder.dataset.wasVisible === 'false' ? 'none' : '';
        if (canvasWrap && canvasWrap.dataset.wasVisible === 'true') canvasWrap.style.display = 'block';

        // Si le PDF n'a jamais été rendu (restauration depuis état réduit), le charger maintenant
        if (canvasWrap && canvasWrap.dataset.neverRendered === 'true') {
            delete canvasWrap.dataset.neverRendered;
            const pdfId = widget.dataset.pdfId;
            const pdfName = widget.dataset.pdfName || '';
            if (pdfId) {
                pdfStorage.get(pdfId).then(base64 => {
                    if (base64 && typeof _showPdfInWidget === 'function') {
                        _showPdfInWidget(container, base64, pdfName);
                    }
                });
            }
        }

        // Supprimer la mini-barre
        const miniBar = widget.querySelector('.pdf-mini-bar');
        if (miniBar) miniBar.remove();

        // Restaurer les poignées widget
        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');

        // Mettre à jour dataset leftPercent/topPercent
        const curW = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

        container.dataset.collapsed = 'false';

    } else {
        // ── PLIER ────────────────────────────────────────────────────────
        // Sauvegarder position et taille
        container.dataset.savedTop  = widget.style.top;
        container.dataset.savedLeft = widget.style.left;
        container.dataset.savedW    = container.offsetWidth  + 'px';
        container.dataset.savedH    = container.offsetHeight + 'px';

        // Calculer la position X : ranger à la suite des autres widgets repliés
        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
        const others = Array.from(document.querySelectorAll('.widget[data-type="pdf"]'))
            .filter(w => w !== widget && w.querySelector('.editor-container[data-collapsed="true"]'));
        const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

        // Positionner le widget en haut du bureau
        widget.style.top          = MARGIN_TOP + 'px';
        widget.style.left         = occupiedX + 'px';
        widget.style.width        = COLLAPSED_W + 'px';
        widget.style.height       = COLLAPSED_H + 'px';
        widget.style.zIndex       = '9000';
        widget.style.background   = '#2a2a3e';
        widget.style.borderRadius = '8px';
        widget.style.border       = 'none';
        widget.style.display      = 'block';
        widget.style.overflow     = 'hidden';
        widget.style.padding      = '0';

        // Neutraliser le widget-content (padding:10px responsable des marges)
        const widgetContent = widget.querySelector('.widget-content');
        if (widgetContent) {
            widgetContent.style.padding      = '0';
            widgetContent.style.background   = 'transparent';
            widgetContent.style.borderRadius = '0';
        }

        // Réduire l'editor-container
        container.style.width        = COLLAPSED_W + 'px';
        container.style.height       = COLLAPSED_H + 'px';
        container.style.overflow     = 'hidden';
        container.style.borderRadius = '8px';
        container.style.background   = '#2a2a3e';
        container.style.border       = 'none';
        container.style.padding      = '0';
        container.style.margin       = '0';
        container.style.position     = 'relative';

        // Cacher la toolbar normale et le contenu
        container.querySelector('.editor-toolbar').style.display = 'none';
        const placeholder = container.querySelector('.pdf-placeholder');
        const canvasWrap  = container.querySelector('.pdf-canvas-wrap');
        if (canvasWrap) canvasWrap.dataset.wasVisible = (canvasWrap.style.display !== 'none') ? 'true' : 'false';
        if (placeholder) placeholder.dataset.wasVisible = (placeholder.style.display !== 'none') ? 'true' : 'false';
        if (placeholder) placeholder.style.display = 'none';
        if (canvasWrap)  canvasWrap.style.display = 'none';

        // Cacher les poignées widget
        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');

        // Créer la mini-barre
        const pdfName = widget.dataset.pdfName || 'PDF';
        const shortName = pdfName.replace(/\.pdf$/i, '');
        const miniBar = document.createElement('div');
        miniBar.className = 'pdf-mini-bar';
        miniBar.style.cssText = 'position:absolute;top:0;left:0;display:flex;align-items:center;justify-content:space-between;width:' + COLLAPSED_W + 'px;height:' + COLLAPSED_H + 'px;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
        miniBar.innerHTML =
            '<span style="font-size:16px;flex-shrink:0;">📄</span>' +
            '<span style="font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + pdfName + '">' + shortName + '</span>' +
            '<button class="pdf-expand-btn" title="Déplier" style="flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;touch-action:manipulation;">▲</button>';
        // Attacher le bouton déplier
        const expandBtn = miniBar.querySelector('.pdf-expand-btn');
        expandBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePdfCollapse(container); });
        expandBtn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); togglePdfCollapse(container); }, { passive: false });
        widget.appendChild(miniBar);

        // Rendre la mini-barre draggable (pointer events)
        miniBar.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button')) return;
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            miniBar.setPointerCapture(e.pointerId);
            const startX = e.clientX - widget.offsetLeft;
            const startY = e.clientY - widget.offsetTop;
            function onMove(ev) {
                widget.style.left = Math.max(0, ev.clientX - startX) + 'px';
                widget.style.top  = Math.max(0, ev.clientY - startY) + 'px';
            }
            function onUp() {
                miniBar.removeEventListener('pointermove', onMove);
                miniBar.removeEventListener('pointerup',   onUp);
                miniBar.removeEventListener('pointercancel', onUp);
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            }
            miniBar.addEventListener('pointermove', onMove);
            miniBar.addEventListener('pointerup',   onUp);
            miniBar.addEventListener('pointercancel', onUp);
        });

        // Mettre à jour dataset
        const curW = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

        container.dataset.collapsed = 'true';
    }

    if (typeof saveBoard === 'function' && !window._pdfRestoring) saveBoard();
}

// TOOLBARS DÉPLAÇABLES
// =========================================================================
(function() {

    // Shape-toolbar : mémorise position dans localStorage
    function makeShapeDraggable(bar, handle) {
        try {
            const saved = localStorage.getItem('shapeToolbarPos');
            if (saved) {
                const { left, top } = JSON.parse(saved);
                bar.style.left = left + 'px'; bar.style.top = top + 'px';
                bar.style.bottom = 'auto'; bar.style.right = 'auto';
            }
        } catch(e) {}

        _addToolbarDrag(handle, bar, function onSave() {
            try { localStorage.setItem('shapeToolbarPos', JSON.stringify({ left: bar.offsetLeft, top: bar.offsetTop })); } catch(e) {}
        });
    }

    // Draw-toolbar : pas de localStorage, bascule horizontal/vertical selon bord
    function makeDrawDraggable(bar, handle) {
        _addToolbarDrag(handle, bar, null, true); // true = mode draw avec bascule horizontal
    }

    // Bascule automatique en horizontal si la toolbar est trop haute pour l'écran
    function autoOrientDrawToolbar() {
        const bar = document.getElementById('draw-toolbar');
        if (!bar || bar.style.display === 'none') return;
        // Mesurer la hauteur en mode vertical
        const wasHorizontal = bar.classList.contains('horizontal');
        bar.classList.remove('horizontal');
        void bar.offsetHeight; // force reflow
        const toolbarH = bar.scrollHeight;
        const availH = window.innerHeight - 40; // marge de 40px
        if (toolbarH > availH) {
            bar.classList.add('horizontal');
            // Positionner juste à droite des boutons FAB
            const drawFab = document.getElementById('draw-fab-btn');
            if (drawFab) {
                const fabRect = drawFab.getBoundingClientRect();
                bar.style.left   = (fabRect.right + 10) + 'px';
                bar.style.bottom = '20px';
                bar.style.top    = 'auto';
            }
        } else if (wasHorizontal) {
            // Conserver horizontal si l'utilisateur l'avait mis ainsi manuellement
            bar.classList.add('horizontal');
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        const drawBar    = document.getElementById('draw-toolbar');
        const drawHandle = document.getElementById('draw-toolbar-drag-handle');
        if (drawBar && drawHandle) makeDrawDraggable(drawBar, drawHandle);

        // Vérification initiale et à chaque redimensionnement
        autoOrientDrawToolbar();
        window.addEventListener('resize', autoOrientDrawToolbar);

        const shapeBar    = document.getElementById('shape-toolbar');
        const shapeHandle = document.getElementById('shape-toolbar-drag-handle');
        if (shapeBar && shapeHandle) makeShapeDraggable(shapeBar, shapeHandle);

        const textBar    = document.getElementById('global-toolbar');
        const textHandle = document.getElementById('global-toolbar-drag-handle');
        if (textBar && textHandle) makeTextDraggable(textBar, textHandle);
    });

    function makeTextDraggable(bar, handle) {
        try {
            const saved = localStorage.getItem('textToolbarPos');
            if (saved) {
                const { left, top } = JSON.parse(saved);
                bar.style.left = left + 'px'; bar.style.top = top + 'px';
                bar.style.bottom = 'auto'; bar.style.right = 'auto';
            }
        } catch(e) {}
        _addToolbarDrag(handle, bar, function onSave() {
            try { localStorage.setItem('textToolbarPos', JSON.stringify({ left: bar.offsetLeft, top: bar.offsetTop })); } catch(e) {}
        });
    }
})();

// =========================================================================
// POSITIONNEMENT DYNAMIQUE DES SOUS-MENUS À CÔTÉ DE LA DRAW-TOOLBAR
// =========================================================================
function _positionSubmenuNextToDrawbar(submenu) {
    const bar = document.getElementById('draw-toolbar');
    if (!bar || !submenu) return;
    const isH = bar.classList.contains('horizontal');
    const barRect = bar.getBoundingClientRect();
    const gap = 8;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const rightLimit = window.innerWidth - scrollbarW - 12;

    if (isH) {
        // Toolbar horizontale → sous-menu horizontal, au-dessus ou en dessous
        submenu.style.flexDirection = 'row';
        const subRect = submenu.getBoundingClientRect();
        const subW = subRect.width  || submenu.offsetWidth  || 200;
        const subH = subRect.height || submenu.offsetHeight || 50;

        // Au-dessus si toolbar en bas, en dessous si toolbar en haut
        let top;
        if (barRect.top > window.innerHeight / 2) {
            top = barRect.top - subH - gap;
        } else {
            top = barRect.bottom + gap;
        }
        // Horizontalement : centré sur la toolbar, recalé si déborde
        let left = barRect.left + (barRect.width - subW) / 2;
        left = Math.max(0, Math.min(left, rightLimit - subW));

        submenu.style.left     = left + 'px';
        submenu.style.top      = top  + 'px';
    } else {
        // Toolbar verticale → sous-menu vertical, à gauche ou à droite
        submenu.style.flexDirection = 'column';
        const subRect = submenu.getBoundingClientRect();
        const subW = subRect.width  || submenu.offsetWidth  || 56;
        const subH = subRect.height || submenu.offsetHeight || 200;

        let left;
        if (barRect.left + barRect.width / 2 < window.innerWidth / 2) {
            left = barRect.right + gap;
        } else {
            left = barRect.left - subW - gap;
        }
        left = Math.max(0, Math.min(left, rightLimit - subW));

        // Verticalement : centré sur la toolbar
        let top = barRect.top + (barRect.height - subH) / 2;
        top = Math.max(4, Math.min(top, window.innerHeight - subH - 4));

        submenu.style.left = left + 'px';
        submenu.style.top  = top  + 'px';
    }

    submenu.style.bottom   = 'auto';
    submenu.style.right    = 'auto';
    submenu.style.position = 'fixed';
}

// Surcharge de toggleFiguresSubmenu pour repositionner à chaque ouverture
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Patch : observer l'ouverture du figures-submenu pour le repositionner
        const figSub = document.getElementById('figures-submenu');
        if (!figSub) return;
        const obs = new MutationObserver(function() {
            if (figSub.style.display !== 'none' && figSub.classList.contains('open')) {
                // Attendre le prochain frame pour avoir les dimensions réelles
                requestAnimationFrame(function() {
                    _positionSubmenuNextToDrawbar(figSub);
                });
            }
        });
        obs.observe(figSub, { attributes: true, attributeFilter: ['class', 'style'] });
    });
})();

// Sous-menu outils géo — même logique que toggleFiguresSubmenu
function _toggleGeoCompactSubmenu() {
    const sub = document.getElementById('geo-submenu');
    const btn = document.getElementById('geo-draw-btn');
    if (!sub) return;
    const isOpen = sub.style.display === 'flex';
    // Fermer figures-submenu si ouvert
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.style.display = 'none'; figSub.classList.remove('open'); }
    if (isOpen) {
        sub.style.display = 'none';
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = ''; btn.classList.remove('btn-mode-active'); }
    } else {
        sub.style.display = 'flex';
        requestAnimationFrame(function() { _positionSubmenuNextToDrawbar(sub); });
        if (btn) { btn.style.borderColor = '#4a90e2'; btn.style.background = '#0d2a45'; btn.style.color = ''; btn.classList.add('btn-mode-active'); }
    }
}
function _closeGeoSubmenu() {
    const sub = document.getElementById('geo-submenu');
    const btn = document.getElementById('geo-draw-btn');
    if (sub) sub.style.display = 'none';
    if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = ''; btn.classList.remove('btn-mode-active'); }
}
// Fermer le sous-menu géo quand on clique ailleurs
document.addEventListener('mousedown', function(e) {
    const sub = document.getElementById('geo-submenu');
    if (!sub || sub.style.display === 'none') return;
    if (!sub.contains(e.target) && !e.target.closest('#geo-draw-btn')) {
        _closeGeoSubmenu();
    }
});
// Patch closeGeoToolbar pour retirer aussi la classe from-drawtoolbar
document.addEventListener('DOMContentLoaded', function() {
    const origClose = window.closeGeoToolbar;
    if (typeof origClose === 'function') {
        window.closeGeoToolbar = function() {
            origClose();
            const geoBar = document.getElementById('geo-toolbar');
            if (geoBar) geoBar.classList.remove('from-drawtoolbar');
        };
        window.closeGeoSubmenu = window.closeGeoToolbar;
    }
});
