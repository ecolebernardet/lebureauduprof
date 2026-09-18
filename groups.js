// =========================================================================
// GROUPEMENT DE WIDGETS
// =========================================================================
let groupCounter = 0;

function mergeWidgets() {
    const totalItems = selectedWidgets.length + selectedStrokes.length;
    if (totalItems < 2) return;
    snapshotNow();
    groupCounter++;
    const groupId = 'grp-' + Date.now() + '-' + groupCounter;
    selectedWidgets.forEach(w => {
        const existingGroup = w.dataset.groupId;
        if (existingGroup && existingGroup !== groupId) {
            document.querySelectorAll(`.widget[data-group-id="${existingGroup}"], .shape-widget[data-group-id="${existingGroup}"]`).forEach(m => {
                m.dataset.groupId = groupId;
            });
            strokes.filter(s => s.groupId === existingGroup).forEach(s => { s.groupId = groupId; });
        }
        w.dataset.groupId = groupId;
    });
    selectedStrokes.forEach(s => {
        const existingGroup = s.groupId;
        if (existingGroup && existingGroup !== groupId) {
            document.querySelectorAll(`.widget[data-group-id="${existingGroup}"], .shape-widget[data-group-id="${existingGroup}"]`).forEach(m => {
                m.dataset.groupId = groupId;
            });
            strokes.filter(st => st.groupId === existingGroup).forEach(st => { st.groupId = groupId; });
        }
        s.groupId = groupId;
    });
    updateSelectionOverlay();
    saveBoard();
}

function ungroupWidgets() {
    if (selectedWidgets.length === 0 && selectedStrokes.length === 0) return;
    snapshotNow();
    const groupIds = new Set([
        ...selectedWidgets.map(w => w.dataset.groupId),
        ...selectedStrokes.map(s => s.groupId)
    ].filter(Boolean));
    groupIds.forEach(gid => {
        document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`).forEach(w => {
            delete w.dataset.groupId;
        });
        strokes.filter(s => s.groupId === gid).forEach(s => { delete s.groupId; });
    });
    clearSelection();
    saveBoard();
}

// =========================================================================
// FUSION : convertir la sélection en une seule image PNG aplatie
// =========================================================================
async function fuseWidgets() {
    const totalItems = selectedWidgets.length + selectedStrokes.length;
    if (totalItems < 2) return;

    // Capturer immédiatement les listes avant tout await
    const widgetsToFuse  = [...selectedWidgets];
    const strokestoFuse  = [...selectedStrokes];

    // 1. Calculer la bounding box de tout ce qui est sélectionné
    const br = board.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    widgetsToFuse.forEach(w => {
        const r = w.getBoundingClientRect();
        minX = Math.min(minX, r.left - br.left);
        minY = Math.min(minY, r.top  - br.top);
        maxX = Math.max(maxX, r.right  - br.left);
        maxY = Math.max(maxY, r.bottom - br.top);
    });
    strokestoFuse.forEach(s => {
        const pad = (s.size || 4) / 2 + 2;
        s.points.forEach(p => {
            minX = Math.min(minX, p.x - pad); minY = Math.min(minY, p.y - pad);
            maxX = Math.max(maxX, p.x + pad); maxY = Math.max(maxY, p.y + pad);
        });
    });

    const PAD = 8;
    minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD);
    maxX = Math.min(board.offsetWidth,  maxX + PAD);
    maxY = Math.min(board.offsetHeight, maxY + PAD);

    const w = Math.ceil(maxX - minX);
    const h = Math.ceil(maxY - minY);
    if (w < 4 || h < 4) return;

    // 2. Créer un canvas de fusion
    const fuseCanvas = document.createElement('canvas');
    fuseCanvas.width  = w;
    fuseCanvas.height = h;
    const ctx = fuseCanvas.getContext('2d');

    // 3. Dessiner les widgets via html2canvas (si dispo) ou fallback
    const widgetsToDraw = [...widgetsToFuse].sort((a, b) =>
        (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0)
    );

    async function _ensureHtml2canvas() {
        if (window.html2canvas) return true;
        return new Promise(resolve => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload  = () => resolve(true);
            s.onerror = () => resolve(false);
            document.head.appendChild(s);
        });
    }

    const h2cAvail = await _ensureHtml2canvas();

    // Injecter une feuille de style temporaire qui écrase TOUS les états visuels d'UI
    const tmpStyle = document.createElement('style');
    tmpStyle.textContent = `
        .drag-handle, .widget-rotate-handle, .widget-action-bar,
        .widget-close-handle, .widget-pin-handle, .widget-back-handle,
        .widget-menu-handle, .shape-resize-handle, .resize-lock-btn,
        .flip-h-btn, .flip-v-btn, .widget-ctx-menu,
        #selection-controls, #sc-ctx-menu
            { opacity: 0 !important; visibility: hidden !important; display: none !important; }
        .widget, .widget:focus, .widget:focus-within,
        .widget.selected, .shape-widget, .shape-widget:focus,
        .shape-widget:focus-within, .shape-widget.selected
            { outline: none !important; border-color: transparent !important; box-shadow: none !important; }
    `;
    document.head.appendChild(tmpStyle);

    // Blur le focus actif pour effacer les pseudo-états :focus-within
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }

    // Forcer aussi inline sur les widgets sélectionnés (au cas où html2canvas lit le style inline)
    const hiddenEls = [];
    widgetsToFuse.forEach(wEl => {
        hiddenEls.push({ el: wEl, outline: wEl.style.outline, boxShadow: wEl.style.boxShadow, border: wEl.style.border });
        wEl.style.outline   = 'none';
        wEl.style.boxShadow = 'none';
        wEl.style.border    = 'none';
    });

    if (h2cAvail) {
        for (const wEl of widgetsToDraw) {
            try {
                const rect = wEl.getBoundingClientRect();
                const wX = rect.left - br.left - minX;
                const wY = rect.top  - br.top  - minY;

                // Pour les stickers/images : dessiner l'img directement (src est une data URL)
                const imgEl = wEl.querySelector('img');
                if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
                    ctx.drawImage(imgEl, wX, wY, rect.width, rect.height);
                } else {
                    const wCanvas = await html2canvas(wEl, {
                        backgroundColor: null,
                        useCORS: true,
                        scale: 1,
                        logging: false,
                        ignoreElements: (el) => {
                            return el.classList.contains('drag-handle')
                                || el.classList.contains('widget-rotate-handle')
                                || el.classList.contains('widget-action-bar')
                                || el.classList.contains('widget-close-handle')
                                || el.classList.contains('widget-pin-handle')
                                || el.classList.contains('widget-back-handle')
                                || el.classList.contains('widget-menu-handle')
                                || el.classList.contains('shape-resize-handle')
                                || el.classList.contains('resize-lock-btn')
                                || el.classList.contains('flip-h-btn')
                                || el.classList.contains('flip-v-btn')
                                || el.classList.contains('widget-ctx-menu')
                                || el.id === 'selection-controls'
                                || el.id === 'sc-ctx-menu';
                        }
                    });
                    ctx.drawImage(wCanvas, wX, wY);
                }
            } catch(err) {
                console.warn('fuseWidgets error:', err);
            }
        }
    } else {
        // Fallback : rectangle coloré avec le nom du type
        widgetsToDraw.forEach(wEl => {
            const rect = wEl.getBoundingClientRect();
            const wX = rect.left - br.left - minX;
            const wY = rect.top  - br.top  - minY;
            const wW = rect.width, wH = rect.height;
            ctx.fillStyle = 'rgba(200,220,255,0.7)';
            ctx.fillRect(wX, wY, wW, wH);
            ctx.strokeStyle = '#4a90e2';
            ctx.lineWidth = 1;
            ctx.strokeRect(wX, wY, wW, wH);
        });
    }

    // 4. Dessiner les traits sélectionnés par-dessus
    strokestoFuse.forEach(s => {
        if (!s.points || s.points.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.lineCap   = 'round';
        ctx.lineJoin  = 'round';
        ctx.strokeStyle = s.color;
        ctx.lineWidth   = s.size;
        ctx.moveTo(s.points[0].x - minX, s.points[0].y - minY);
        s.points.forEach(p => ctx.lineTo(p.x - minX, p.y - minY));
        ctx.stroke();
        ctx.restore();
    });

    // Retirer la feuille de style temporaire et restaurer les styles inline
    tmpStyle.remove();
    hiddenEls.forEach(({ el, outline, boxShadow, border }) => {
        el.style.outline   = outline   || '';
        el.style.boxShadow = boxShadow || '';
        el.style.border    = border    || '';
    });

    // 5. Obtenir le data URL
    const dataUrl = fuseCanvas.toDataURL('image/png');

    // 6. Snapshot undo avant de modifier
    snapshotNow();

    // 7. Supprimer les éléments originaux
    widgetsToFuse.forEach(wEl => wEl.remove());
    strokes = strokes.filter(s => !strokestoFuse.includes(s));
    selectedStrokes = [];
    selectedWidgets = [];
    if (drawCtx) redrawStrokes();
    document.getElementById('selection-controls').style.display = 'none';

    // 8. Créer un widget sticker (image) à la même position
    const fusedWidget = document.createElement('div');
    fusedWidget.className = 'widget';
    fusedWidget.dataset.type = 'sticker';
    fusedWidget.dataset.transparent = 'true';
    fusedWidget.style.cssText = `left:${minX}px; top:${minY}px; width:${w}px; height:${h}px; overflow:visible; flex-direction:row;`;
    fusedWidget.style.setProperty('--sticker-h', h + 'px');
    fusedWidget.tabIndex = 0;

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Fusion';
    img.draggable = false;
    img.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;';

    fusedWidget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
    `;
    fusedWidget.appendChild(img);

    fusedWidget.addEventListener('mousedown', () => {
        bringToFront(fusedWidget);
        fusedWidget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(fusedWidget);
    });

    board.appendChild(fusedWidget);
    bringToFront(fusedWidget);
    makeDraggable(fusedWidget);
    makeDraggableRotate(fusedWidget);
    if (typeof _addStickerResizeHandle === 'function') _addStickerResizeHandle(fusedWidget, 40);

    // Mettre à jour les % pour la sauvegarde
    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
    fusedWidget.dataset.leftPercent = (minX / curW) * 100;
    fusedWidget.dataset.topPercent  = (minY / curVH) * 100;
    fusedWidget.dataset.stickerUrl  = dataUrl;

    saveBoard();
}

function initSelectionControls() {
    function _startScMove(clientX, clientY) {
        snapshotNow();
        const pos = getBoardPos({ clientX, clientY });
        moveStartX = pos.x; moveStartY = pos.y;
        widgetMoveOrigins = selectedWidgets.map(w => ({ widget: w, origLeft: w.offsetLeft, origTop: w.offsetTop }));
        strokeMoveOrigins = selectedStrokes.map(s => ({ stroke: s, origPoints: s.points.map(p => ({...p})) }));

        const overlays = [];
        document.querySelectorAll('.widget iframe, .widget embed').forEach(el => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;inset:0;z-index:9999;background:transparent;';
            el.parentElement.style.position = 'relative';
            el.parentElement.appendChild(overlay);
            overlays.push(overlay);
        });

        const onMoveEnd_patched = () => {
            document.removeEventListener('mousemove', onMoveMove);
            document.removeEventListener('mouseup', onMoveEnd_patched);
            document.removeEventListener('touchmove', onMoveMoveTouch);
            document.removeEventListener('touchend', onMoveEnd_patched);
            overlays.forEach(o => o.remove());
            const curW = window.innerWidth, curVH = virtualH(curW);
            selectedWidgets.forEach(w => {
                w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
                w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
            });
            saveBoard(); updateSelectionOverlay();
        };
        function onMoveMoveTouch(ev) { onMoveMove({ clientX: ev.touches[0].clientX, clientY: ev.touches[0].clientY }); }

        document.addEventListener('mousemove', onMoveMove);
        document.addEventListener('mouseup', onMoveEnd_patched);
        document.addEventListener('touchmove', onMoveMoveTouch, { passive: false });
        document.addEventListener('touchend', onMoveEnd_patched);
    }

    document.getElementById('sc-move-btn').onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        _startScMove(e.clientX, e.clientY);
    };
    document.getElementById('sc-move-btn').addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        _startScMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.getElementById('sc-rotate-btn').ondblclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        selectedWidgets.forEach(w => {
            if (w.dataset.preRotLeft !== undefined) {
                w.style.left      = w.dataset.preRotLeft;
                w.style.top       = w.dataset.preRotTop;
                w.style.transform = w.dataset.preRotTransform || '';
                delete w.dataset.preRotLeft;
                delete w.dataset.preRotTop;
                delete w.dataset.preRotTransform;
            } else {
                w.style.transform = '';
            }
        });
        hideRotationIndicator();
        saveBoard(); updateSelectionOverlay();
    };

    function _startScRotate(clientX, clientY) {
        snapshotNow();
        selectedWidgets.forEach(w => {
            if (w.dataset.preRotLeft === undefined) {
                w.dataset.preRotLeft      = w.style.left;
                w.dataset.preRotTop       = w.style.top;
                w.dataset.preRotTransform = w.style.transform || '';
            }
        });
        const center = getSelectionCenter();
        rotateCenterX = center.x; rotateCenterY = center.y;
        const br = board.getBoundingClientRect();
        rotateStartAngle = Math.atan2(clientY - br.top - rotateCenterY, clientX - br.left - rotateCenterX);
        rotateOrigWidgetTransforms = selectedWidgets.map(w => ({ widget: w, origLeft: w.offsetLeft, origTop: w.offsetTop, origRot: getCurrentRotation(w) }));
        rotateOrigStrokePoints = selectedStrokes.map(s => ({ stroke: s, origPoints: s.points.map(p => ({...p})) }));
        const indicator = document.getElementById('rotation-indicator');

        function onMove(cx, cy) {
            const br2 = board.getBoundingClientRect();
            const angle = Math.atan2(cy - br2.top - rotateCenterY, cx - br2.left - rotateCenterX);
            const delta = (angle - rotateStartAngle) * 180 / Math.PI;
            rotateOrigWidgetTransforms.forEach(({ widget, origLeft, origTop, origRot }) => {
                const cx2 = origLeft + widget.offsetWidth/2  - rotateCenterX;
                const cy2 = origTop  + widget.offsetHeight/2 - rotateCenterY;
                const rad = delta * Math.PI / 180;
                widget.style.left      = (rotateCenterX + cx2*Math.cos(rad) - cy2*Math.sin(rad) - widget.offsetWidth/2)  + 'px';
                widget.style.top       = (rotateCenterY + cx2*Math.sin(rad) + cy2*Math.cos(rad) - widget.offsetHeight/2) + 'px';
                widget.style.transform = `rotate(${snapRotation(origRot + delta)}deg)`;
            });
            rotateOrigStrokePoints.forEach(({ stroke, origPoints }) => {
                const rad = delta * Math.PI / 180;
                stroke.points = origPoints.map(p => ({
                    x: rotateCenterX + (p.x-rotateCenterX)*Math.cos(rad) - (p.y-rotateCenterY)*Math.sin(rad),
                    y: rotateCenterY + (p.x-rotateCenterX)*Math.sin(rad) + (p.y-rotateCenterY)*Math.cos(rad)
                }));
            });
            if (indicator && rotateOrigWidgetTransforms.length > 0) {
                const deg = Math.round(((snapRotation(rotateOrigWidgetTransforms[0].origRot + delta) % 360) + 360) % 360);
                document.getElementById('rot-deg').textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = cx + 'px';
                indicator.style.top  = cy + 'px';
                indicator.querySelector('.rot-reset-hint').style.display = deg === 0 ? 'none' : 'inline';
            }
            if (drawCtx) redrawStrokes(); updateSelectionOverlay();
        }
        function onMouseMove(ev) { onMove(ev.clientX, ev.clientY); }
        function onTouchMove(ev) { onMove(ev.touches[0].clientX, ev.touches[0].clientY); }
        const onUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onUp);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend',  onUp);
            hideRotationIndicator();
            saveBoard(); updateSelectionOverlay();
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup',   onUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend',  onUp);
    }

    document.getElementById('sc-rotate-btn').onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        _startScRotate(e.clientX, e.clientY);
    };
    document.getElementById('sc-rotate-btn').addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        _startScRotate(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.getElementById('sc-delete-btn').onclick = (e) => {
        e.stopPropagation();
        snapshotNow();
        selectedWidgets.forEach(w => { w.classList.remove('selected'); w.remove(); });
        selectedWidgets = [];
        strokes = strokes.filter(s => !selectedStrokes.includes(s));
        selectedStrokes = [];
        if (drawCtx) redrawStrokes();
        document.getElementById('selection-controls').style.display = 'none';
        saveBoard();
    };
    document.getElementById('sc-pin-btn').onclick = (e) => {
        e.stopPropagation();
        snapshotNow();
        selectedWidgets.forEach(w => togglePin(w));
        // Pour les strokes : toggler le flag pinned et redessiner sur le bon canvas
        if (typeof selectedStrokes !== 'undefined' && selectedStrokes.length > 0) {
            const allPinned = selectedStrokes.every(s => s.pinned);
            selectedStrokes.forEach(s => { s.pinned = !allPinned; });
            if (typeof redrawStrokes === 'function') redrawStrokes();
        }
        // Retirer background des strokes quand on épingle
        if (typeof selectedStrokes !== 'undefined') {
            selectedStrokes.forEach(s => { s.background = false; });
        }
        // Mettre à jour l'apparence des boutons
        const pinBtn = document.getElementById('sc-pin-btn');
        const strokesPinned = typeof selectedStrokes !== 'undefined' && selectedStrokes.length > 0 && selectedStrokes.every(s => s.pinned);
        const widgetsPinned = selectedWidgets.length > 0 && selectedWidgets.every(w => w.dataset.pinned === 'true');
        pinBtn.classList.toggle('pinned', strokesPinned || widgetsPinned);
        document.getElementById('sc-back-btn').classList.remove('background');
        saveBoard();
    };
    document.getElementById('sc-back-btn').onclick = (e) => {
        e.stopPropagation();
        selectedWidgets.forEach(w => sendToBack(w));
        // Pour les strokes : toggler le flag background (et retirer pinned)
        if (typeof selectedStrokes !== 'undefined' && selectedStrokes.length > 0) {
            const allBackground = selectedStrokes.every(s => s.background);
            selectedStrokes.forEach(s => {
                s.background = !allBackground;
                s.pinned = false;
            });
            if (typeof redrawStrokes === 'function') redrawStrokes();
        }
        const widgetsBackground = selectedWidgets.length > 0 && selectedWidgets.every(w => w.dataset.background === 'true');
        const strokesBackground = typeof selectedStrokes !== 'undefined' && selectedStrokes.length > 0 && selectedStrokes.every(s => s.background);
        document.getElementById('sc-pin-btn').classList.remove('pinned');
        document.getElementById('sc-back-btn').classList.toggle('background', widgetsBackground || strokesBackground);
        saveBoard();
    };
    document.getElementById('sc-menu-btn').onclick = (e) => {
        e.stopPropagation();
        const menu = document.getElementById('sc-ctx-menu');
        const isOpen = menu.classList.contains('open');
        if (isOpen) { menu.classList.remove('open'); return; }
        buildScCtxMenu(menu);
        menu.classList.add('open');
        // Positionner au-dessus du bouton
        const r = document.getElementById('sc-menu-btn').getBoundingClientRect();
        menu.style.top  = '0px'; // temporaire pour mesurer
        menu.style.left = r.left + 'px';
        requestAnimationFrame(() => {
            const mh = menu.offsetHeight;
            menu.style.top = (r.top - mh - 6) + 'px';
            const mr = menu.getBoundingClientRect();
            if (mr.right > window.innerWidth - 8)
                menu.style.left = (window.innerWidth - mr.width - 8) + 'px';
            if (mr.top < 8)
                menu.style.top = (r.bottom + 6) + 'px'; // fallback en dessous si pas de place
        });
    };
    // Bouton verrou de l'overlay groupe
    const scLockBtn = document.getElementById('sc-lock-btn');
    // Boutons symétrie de l'overlay groupe
    const scFlipH = document.getElementById('sc-flip-h-btn');
    const scFlipV = document.getElementById('sc-flip-v-btn');
    if (scLockBtn) {
        scLockBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        scLockBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
        scLockBtn.addEventListener('click', e => {
            e.stopPropagation();
            const locked = scLockBtn.classList.toggle('locked');
            scLockBtn.textContent = locked ? '🔒' : '🔓';
        });
    }
    if (scFlipH) {
        scFlipH.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        scFlipH.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
        scFlipH.addEventListener('click', e => {
            e.stopPropagation(); snapshotNow();
            selectedWidgets.forEach(w => flipWidget(w, 'h'));
            flipStrokes(selectedStrokes, 'h');
            saveBoard();
        });
    }
    if (scFlipV) {
        scFlipV.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        scFlipV.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
        scFlipV.addEventListener('click', e => {
            e.stopPropagation(); snapshotNow();
            selectedWidgets.forEach(w => flipWidget(w, 'v'));
            flipStrokes(selectedStrokes, 'v');
            saveBoard();
        });
    }

    function _startScResize(clientX, clientY) {
        const totalSel = selectedWidgets.length + selectedStrokes.length;
        if (totalSel < 1) return;
        snapshotNow();
        const br = board.getBoundingClientRect();
        let bMinX=Infinity, bMinY=Infinity, bMaxX=-Infinity, bMaxY=-Infinity;
        selectedWidgets.forEach(w => {
            const r = w.getBoundingClientRect();
            const l = r.left - br.left, t = r.top - br.top;
            const rr = r.right - br.left, rb = r.bottom - br.top;
            if (l  < bMinX) bMinX = l;  if (t  < bMinY) bMinY = t;
            if (rr > bMaxX) bMaxX = rr; if (rb > bMaxY) bMaxY = rb;
        });
        selectedStrokes.forEach(s => s.points.forEach(p => {
            if (p.x < bMinX) bMinX = p.x; if (p.y < bMinY) bMinY = p.y;
            if (p.x > bMaxX) bMaxX = p.x; if (p.y > bMaxY) bMaxY = p.y;
        }));
        const origBoxW = bMaxX - bMinX, origBoxH = bMaxY - bMinY;
        if (origBoxW < 1 || origBoxH < 1) return;
        const boxRatio = origBoxH / origBoxW;
        const startClientX = clientX, startClientY = clientY;
        const widgetOrigins = selectedWidgets.map(w => {
            const r = w.getBoundingClientRect();
            const wL = r.left  - br.left, wT = r.top    - br.top;
            const c = w.querySelector('.editor-container');
            const svg = w.querySelector('svg');
            return {
                widget: w,
                relL: (wL - bMinX) / origBoxW,
                relT: (wT - bMinY) / origBoxH,
                container: c,
                origCW: c   ? c.offsetWidth  : 0,
                origCH: c   ? c.offsetHeight : 0,
                svg: svg,
                origSW: svg ? parseFloat(svg.getAttribute('width')  || svg.getBoundingClientRect().width)  : 0,
                origSH: svg ? parseFloat(svg.getAttribute('height') || svg.getBoundingClientRect().height) : 0,
            };
        });
        const strokeOrigins = selectedStrokes.map(s => ({
            stroke: s,
            origPoints: s.points.map(p => ({ x: p.x, y: p.y }))
        }));
        function applyResize(cx, cy, isProportional) {
            const proportional = isProportional || (scLockBtn && scLockBtn.classList.contains('locked'));
            const newBoxW = Math.max(20, origBoxW + cx - startClientX);
            const newBoxH = proportional ? Math.max(20, newBoxW * boxRatio)
                                         : Math.max(20, origBoxH + cy - startClientY);
            const scaleX = newBoxW / origBoxW, scaleY = newBoxH / origBoxH;
            widgetOrigins.forEach(({ widget, relL, relT, container, origCW, origCH, svg, origSW, origSH }) => {
                widget.style.left = (bMinX + relL * newBoxW) + 'px';
                widget.style.top  = (bMinY + relT * newBoxH) + 'px';
                if (container && origCW > 0) {
                    container.style.width  = (origCW * scaleX) + 'px';
                    container.style.height = (origCH * scaleY) + 'px';
                }
                if (svg && origSW > 0) {
                    const newSW = origSW * scaleX, newSH = origSH * scaleY;
                    svg.setAttribute('width', newSW); svg.setAttribute('height', newSH);
                    widget.style.width = newSW + 'px'; widget.style.height = newSH + 'px';
                }
            });
            strokeOrigins.forEach(({ stroke, origPoints }) => {
                stroke.points = origPoints.map(p => ({
                    x: bMinX + (p.x - bMinX) * scaleX,
                    y: bMinY + (p.y - bMinY) * scaleY
                }));
            });
            if (drawCtx) redrawStrokes();
            updateSelectionOverlay();
        }
        function onMouseMove(ev) { applyResize(ev.clientX, ev.clientY, ev.shiftKey); }
        function onTouchMove(ev) { applyResize(ev.touches[0].clientX, ev.touches[0].clientY, false); }
        const onUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onUp);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend',  onUp);
            const curW = window.innerWidth, curVH = virtualH(curW);
            selectedWidgets.forEach(w => {
                w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
                w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
                const c = w.querySelector('.editor-container');
                if (c) {
                    w.dataset.widthPercent    = (c.offsetWidth  / curW) * 100;
                    w.dataset.contentHPercent = (c.offsetHeight / curVH) * 100;
                }
            });
            saveBoard();
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup',   onUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend',  onUp);
    }

    document.getElementById('sc-resize-btn').onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        _startScResize(e.clientX, e.clientY);
    };
    document.getElementById('sc-resize-btn').addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        _startScResize(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.getElementById('sc-merge-btn').onclick = (e) => {
        e.stopPropagation();
        mergeWidgets();
    };
    const fusionBtn = document.getElementById('sc-fuse-btn');
    if (fusionBtn) {
        fusionBtn.onclick = (e) => {
            e.stopPropagation();
            fuseWidgets();
        };
    }
    document.getElementById('sc-ungroup-btn').onclick = (e) => {
        e.stopPropagation();
        const groupIds = new Set([
            ...selectedWidgets.map(w => w.dataset.groupId),
            ...selectedStrokes.map(s => s.groupId)
        ].filter(Boolean));
        if (groupIds.size === 0) return;
        snapshotNow();
        groupIds.forEach(gid => {
            document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`).forEach(w => {
                delete w.dataset.groupId;
            });
            strokes.filter(s => s.groupId === gid).forEach(s => { delete s.groupId; });
        });
        clearSelection();
        saveBoard();
    };
}

function buildScCtxMenu(menu) {
    menu.innerHTML = '';
    const addBtn = (label, fn) => {
        const b = document.createElement('button');
        b.innerHTML = label;
        b.onmousedown = ev => ev.stopPropagation();
        b.onclick = () => { menu.classList.remove('open'); fn(); };
        menu.appendChild(b);
    };
    const addSep = () => menu.appendChild(document.createElement('hr'));

    addBtn('⧉ Dupliquer', () => {
        snapshotNow();
        const toClone = [...selectedWidgets];
        // Dupliquer aussi les tracés sélectionnés
        const strokesToDup = typeof selectedStrokes !== 'undefined' ? [...selectedStrokes] : [];
        clearSelection();
        toClone.forEach(w => {
            if (w.classList.contains('shape-widget')) cloneShapeWidget(w);
            else cloneWidget(w);
        });
        // Dupliquer les strokes : copie décalée de 20px
        if (strokesToDup.length > 0 && typeof strokes !== 'undefined') {
            strokesToDup.forEach(s => {
                const copy = {
                    ...s,
                    points: s.points.map(p => ({ x: p.x + 20, y: p.y + 20 }))
                };
                strokes.push(copy);
            });
            if (typeof redrawStrokes === 'function') redrawStrokes();
            saveBoard();
        }
    });
    const hasGroup = selectedWidgets.some(w => w.dataset.groupId);
    if (hasGroup) {
        const groupIds = new Set(selectedWidgets.map(w => w.dataset.groupId).filter(Boolean));
        addSep();
        addBtn('⛓️‍💥 Dissocier le groupe', () => {
            snapshotNow();
            groupIds.forEach(gid => {
                document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`).forEach(w => {
                    delete w.dataset.groupId;
                });
            });
            clearSelection();
            saveBoard();
        });
    }
}

function onMoveMove(e) {
    const pos = getBoardPos(e);
    const dx = pos.x - moveStartX, dy = pos.y - moveStartY;
    widgetMoveOrigins.forEach(({ widget, origLeft, origTop }) => {
        widget.style.left = (origLeft + dx) + 'px'; widget.style.top = (origTop + dy) + 'px';
    });
    strokeMoveOrigins.forEach(({ stroke, origPoints }) => {
        stroke.points = origPoints.map(p => ({ x: p.x + dx, y: p.y + dy }));
    });
    if (drawCtx) redrawStrokes(); updateSelectionOverlay();
}

function onMoveEnd() {
    document.removeEventListener('mousemove', onMoveMove);
    document.removeEventListener('mouseup',   onMoveEnd);
    const curW = window.innerWidth, curVH = virtualH(curW);
    selectedWidgets.forEach(w => {
        w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
        w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
    });
    saveBoard(); updateSelectionOverlay();
}

function getSelectionCenter() {
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    const br = board.getBoundingClientRect();
    selectedWidgets.forEach(w => {
        const r = w.getBoundingClientRect();
        minX=Math.min(minX,r.left-br.left); minY=Math.min(minY,r.top-br.top);
        maxX=Math.max(maxX,r.right-br.left); maxY=Math.max(maxY,r.bottom-br.top);
    });
    selectedStrokes.forEach(s => s.points.forEach(p => {
        minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y);
    }));
    return { x:(minX+maxX)/2, y:(minY+maxY)/2 };
}

function updateSelectionOverlay() {
    // Exclure les widgets ancrés de la sélection
    selectedWidgets = selectedWidgets.filter(w => {
        if (w.dataset.anchored === 'true') {
            w.classList.remove('selected');
            return false;
        }
        return true;
    });
    const has = selectedWidgets.length > 0 || selectedStrokes.length > 0;
    const ctrl = document.getElementById('selection-controls');
    if (!has) {
        ctrl.style.display = 'none';
        board.classList.remove('single-select');
        board.classList.remove('multi-select');
        return;
    }

    // Si un seul widget sélectionné avec groupId → étendre la sélection à tout le groupe
    if (selectedWidgets.length === 1 && selectedStrokes.length === 0 && selectedWidgets[0].dataset.groupId) {
        const gid = selectedWidgets[0].dataset.groupId;
        const allMembers = Array.from(document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`));
        if (allMembers.length > 1) {
            document.querySelectorAll('.widget.selected, .shape-widget.selected').forEach(w => w.classList.remove('selected'));
            selectedWidgets = allMembers;
            allMembers.forEach(w => w.classList.add('selected'));
        }
    }

    // Widget seul SANS groupe → poignées natives bleues, pas d'overlay
    if (selectedWidgets.length === 1 && selectedStrokes.length === 0 && !selectedWidgets[0].dataset.groupId) {
        board.classList.add('single-select');
        board.classList.remove('multi-select');
        ctrl.style.display = 'none';
        if (typeof positionActionBar === 'function') positionActionBar(selectedWidgets[0]);
        return;
    }

    board.classList.remove('single-select');
    board.classList.add('multi-select');

    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    const br = board.getBoundingClientRect();
    selectedWidgets.forEach(w => {
        const r = w.getBoundingClientRect();
        minX=Math.min(minX,r.left-br.left); minY=Math.min(minY,r.top-br.top);
        maxX=Math.max(maxX,r.right-br.left); maxY=Math.max(maxY,r.bottom-br.top);
    });
    selectedStrokes.forEach(s => {
        const pad = (s.size||4)/2;
        s.points.forEach(p => {
            minX=Math.min(minX,p.x-pad); minY=Math.min(minY,p.y-pad);
            maxX=Math.max(maxX,p.x+pad); maxY=Math.max(maxY,p.y+pad);
        });
    });
    ctrl.style.display = 'block';
    ctrl.style.left   = minX + 'px'; ctrl.style.top    = minY + 'px';
    ctrl.style.width  = (maxX - minX) + 'px'; ctrl.style.height = (maxY - minY) + 'px';

    // Positionner la barre d'action au-dessus si trop proche du bas
    const scActionBar = document.getElementById('sc-action-bar');
    if (scActionBar) {
        const boardH = board.offsetHeight;
        if (boardH - maxY < 55) scActionBar.classList.add('above');
        else                    scActionBar.classList.remove('above');
    }

    const resizeBtnO  = document.getElementById('sc-resize-btn');
    const scLockBtnO  = document.getElementById('sc-lock-btn');
    const scFlipHO    = document.getElementById('sc-flip-h-btn');
    const scFlipVO    = document.getElementById('sc-flip-v-btn');
    const mergeBtn    = document.getElementById('sc-merge-btn');
    const ungroupBtn  = document.getElementById('sc-ungroup-btn');
    if (resizeBtnO)  resizeBtnO.style.display  = '';
    if (scLockBtnO)  scLockBtnO.style.display  = 'flex';
    if (scFlipHO)    scFlipHO.style.display    = 'flex';
    if (scFlipVO)    scFlipVO.style.display    = 'flex';

    // Synchroniser l'état visuel des boutons épingler et envoyer derrière
    const pinBtn  = document.getElementById('sc-pin-btn');
    const backBtn = document.getElementById('sc-back-btn');
    if (pinBtn) {
        const strokesPinned = typeof selectedStrokes !== 'undefined' && selectedStrokes.length > 0 && selectedStrokes.every(s => s.pinned);
        const widgetsPinned = selectedWidgets.length > 0 && selectedWidgets.every(w => w.dataset.pinned === 'true');
        pinBtn.classList.toggle('pinned', strokesPinned || widgetsPinned);
    }
    if (backBtn) {
        const widgetsBackground = selectedWidgets.length > 0 && selectedWidgets.every(w => w.dataset.background === 'true');
        const strokesBackground = typeof selectedStrokes !== 'undefined' && selectedStrokes.length > 0 && selectedStrokes.every(s => s.background);
        backBtn.classList.toggle('background', widgetsBackground || strokesBackground);
    }

    if (mergeBtn && ungroupBtn) {
        const fuseBtn    = document.getElementById('sc-fuse-btn');
        const totalSel  = selectedWidgets.length + selectedStrokes.length;
        const multi     = totalSel >= 2;
        const allGroupIds = [
            ...selectedWidgets.map(w => w.dataset.groupId),
            ...selectedStrokes.map(s => s.groupId)
        ].filter(Boolean);
        const groupIdSet   = new Set(allGroupIds);
        const allSameGroup = groupIdSet.size === 1 && allGroupIds.length === totalSel;

        if (allSameGroup) {
            mergeBtn.style.display   = 'none';
            ungroupBtn.style.display = 'flex';
            if (fuseBtn) fuseBtn.style.display = 'none';
        } else if (multi) {
            mergeBtn.style.display   = 'flex';
            ungroupBtn.style.display = 'none';
            if (fuseBtn) fuseBtn.style.display = 'flex';
        } else {
            mergeBtn.style.display   = 'none';
            ungroupBtn.style.display = 'none';
            if (fuseBtn) fuseBtn.style.display = 'none';
        }
    }
}

function getBoardPos(e) {
    const r = board.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function findStrokeAt(x, y) {
    for (let i = strokes.length - 1; i >= 0; i--) {
        const s = strokes[i], tol = s.size / 2 + 5;
        for (let j = 1; j < s.points.length; j++) {
            if (distToSegment(x, y, s.points[j-1], s.points[j]) <= tol) return s;
        }
    }
    return null;
}

function distToSegment(px, py, a, b) {
    const dx = b.x-a.x, dy = b.y-a.y, lenSq = dx*dx + dy*dy;
    if (lenSq === 0) return Math.hypot(px-a.x, py-a.y);
    const t = Math.max(0, Math.min(1, ((px-a.x)*dx + (py-a.y)*dy) / lenSq));
    return Math.hypot(px - (a.x + t*dx), py - (a.y + t*dy));
}
