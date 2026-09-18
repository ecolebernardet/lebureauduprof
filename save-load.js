// =========================================================================
// SAUVEGARDE / CHARGEMENT
// =========================================================================
function getInnerHTMLNormalized(widget) {
    const factor = 1920 / window.innerWidth;
    const clone = widget.cloneNode(true);
    clone.querySelectorAll('*').forEach(el => {
        if (!el.style?.fontSize) return;
        const m = el.style.fontSize.match(/^([\d.]+)px$/);
        if (m) el.style.fontSize = (parseFloat(m[1]) * factor) + 'px';
    });
    if (clone.style?.fontSize) {
        const m = clone.style.fontSize.match(/^([\d.]+)px$/);
        if (m) clone.style.fontSize = (parseFloat(m[1]) * factor) + 'px';
    }
    const agendaList = clone.querySelector('.agenda-list');
    if (agendaList) {
        // Nettoyer les <hr> corrompus avant sauvegarde
        agendaList.querySelectorAll('.agenda-time, .agenda-text').forEach(el => {
            const hrs = el.querySelectorAll('hr');
            if (hrs.length > 0) {
                const isTime = el.classList.contains('agenda-time');
                hrs.forEach(hr => hr.remove());
                if (!el.textContent.trim()) {
                    el.textContent = isTime ? '─────' : '───────────';
                }
            }
        });
    }
    const content    = clone.querySelector('.editor-content');
    return agendaList ? agendaList.innerHTML : (content ? content.innerHTML : null);
}

function getEditorStyleNormalized(widget, refWidth = 1920) {
    const editor = widget.querySelector('.editor-content');
    if (!editor) return null;
    const cs = window.getComputedStyle(editor);
    const curW = window.innerWidth || refWidth;
    const factor = refWidth / curW;
    const fontSizePx = parseFloat(cs.fontSize);
    return {
        fontFamily: cs.fontFamily || '',
        fontSizePx: Number.isFinite(fontSizePx) ? +(fontSizePx * factor).toFixed(2) : null,
        color:      cs.color || '',
        lineHeight: editor.style.lineHeight ? parseFloat(editor.style.lineHeight) : null,
        marginTop:  editor.style.marginTop  || null
    };
}

function applyEditorStyleFromConfig(widget, style) {
    if (!style) return;
    const editor = widget.querySelector('.editor-content');
    if (!editor) return;
    if (style.fontFamily) editor.style.fontFamily = style.fontFamily;
    if (style.color) editor.style.color = style.color;
    if (style.fontSizePx) editor.style.fontSize = style.fontSizePx + 'px';
    if (style.lineHeight) {
        editor.style.lineHeight = style.lineHeight;
        editor.dataset.lineHeightBase = style.lineHeight;
    }
    if (style.marginTop) editor.style.marginTop = style.marginTop;
}

function buildBoardState() {
    const curW = window.innerWidth, curVH = virtualH(curW);
    const widgets = [];
    // DEBUG
    try {
        const allWidgets = document.querySelectorAll('.widget');
        const pdfInDom = [...allWidgets].filter(w => w.dataset.type === 'pdf').map(w => ({ pdfId: w.dataset.pdfId, pdfName: w.dataset.pdfName }));
        const logs = JSON.parse(localStorage.getItem('_pdfDebugLog') || '[]');
        logs.push({ t: Date.now(), stack: 'BUILD_STATE', pdfs: pdfInDom });
        if (logs.length > 30) logs.shift();
        localStorage.setItem('_pdfDebugLog', JSON.stringify(logs));
    } catch(e) {}
    document.querySelectorAll('.widget').forEach(w => {
        const iframe = w.querySelector('iframe');
        const c = w.querySelector('.editor-container');
        const html = getInnerHTMLNormalized(w);
        const isTextLike = w.dataset.type === 'text' || w.dataset.type === 'homework';
        let wP = 0, hP = 0, lP = 0, tP = 0;
        // Pour un PDF réduit : utiliser les dimensions/position d'ORIGINE (pas les valeurs réduites)
        const _collapsed = c && c.dataset.collapsed === 'true';
        // Pour un PDF en plein écran board : utiliser les dimensions/position d'ORIGINE sauvegardées
        const _fullboard = c && c.classList.contains('wf-pdf-fullboard');
        // Pour le widget défi calme : largeur du .dc-container (pas de .editor-container)
        if (w.dataset.type === 'deficalme') {
            const dc = w.querySelector('.dc-container');
            wP = dc ? (dc.offsetWidth  / curW)  * 100 : 0;
            hP = 0; // hauteur auto (aspect-ratio)
            lP = (w.offsetLeft / curW)  * 100;
            tP = (w.offsetTop  / curVH) * 100;
            Object.assign(w.dataset, { widthPercent: wP, contentHPercent: 0, leftPercent: lP, topPercent: tP });
        } else if (w.dataset.type === 'sondage') {
            const sc = w.querySelector('.snd-container');
            wP = sc ? (sc.offsetWidth  / curW)  * 100 : 0;
            hP = sc ? (sc.offsetHeight / curVH) * 100 : 0;
            lP = (w.offsetLeft / curW)  * 100;
            tP = (w.offsetTop  / curVH) * 100;
            Object.assign(w.dataset, { widthPercent: wP, contentHPercent: hP, leftPercent: lP, topPercent: tP });
        } else if (w.dataset.type === 'couleurs') {
            const cc = w.querySelector('.clr-container');
            wP = cc ? (cc.offsetWidth  / curW)  * 100 : 0;
            hP = cc ? (cc.offsetHeight / curVH) * 100 : 0;
            lP = (w.offsetLeft / curW)  * 100;
            tP = (w.offsetTop  / curVH) * 100;
            Object.assign(w.dataset, { widthPercent: wP, contentHPercent: hP, leftPercent: lP, topPercent: tP });
        } else if (w.dataset.type === 'musique-clavier') {
            const mk = w.querySelector('.mk-container');
            wP = mk ? (mk.offsetWidth  / curW)  * 100 : 0;
            hP = mk ? (mk.offsetHeight / curVH) * 100 : 0;
            lP = (w.offsetLeft / curW)  * 100;
            tP = (w.offsetTop  / curVH) * 100;
            Object.assign(w.dataset, { widthPercent: wP, contentHPercent: hP, leftPercent: lP, topPercent: tP });
        } else if (_collapsed) {
            const _savedWpx    = parseFloat(c.dataset.savedW);
            const _savedHpx    = parseFloat(c.dataset.savedH);
            const _savedTopPx  = parseFloat(c.dataset.savedTop);
            const _savedLeftPx = parseFloat(c.dataset.savedLeft);
            if (!isNaN(_savedWpx))  wP = (_savedWpx / curW) * 100;
            if (!isNaN(_savedHpx))  hP = ((_savedHpx - getToolbarHeight(c)) / curVH) * 100;
            lP = !isNaN(_savedLeftPx) ? (_savedLeftPx / curW) * 100 : (w.offsetLeft / curW) * 100;
            tP = !isNaN(_savedTopPx)  ? (_savedTopPx  / curVH) * 100 : (w.offsetTop  / curVH) * 100;
        } else if (_fullboard) {
            // pfSavedW/H sont les dimensions du container avant le plein écran
            const _savedWpx    = parseFloat(c.dataset.pfSavedW);
            const _savedHpx    = parseFloat(c.dataset.pfSavedH);
            // pfSavedWTop/WLeft sont les positions du widget avant le plein écran
            const _savedTopPx  = parseFloat(c.dataset.pfSavedWTop);
            const _savedLeftPx = parseFloat(c.dataset.pfSavedWLeft);
            if (!isNaN(_savedWpx))  wP = (_savedWpx / curW) * 100;
            if (!isNaN(_savedHpx))  hP = ((_savedHpx - getToolbarHeight(c)) / curVH) * 100;
            lP = !isNaN(_savedLeftPx) ? (_savedLeftPx / curW) * 100 : (w.offsetLeft / curW) * 100;
            tP = !isNaN(_savedTopPx)  ? (_savedTopPx  / curVH) * 100 : (w.offsetTop  / curVH) * 100;
        } else {
            if (c) { wP = (c.offsetWidth / curW) * 100; hP = ((c.offsetHeight - getToolbarHeight(c)) / curVH) * 100; }
            lP = (w.offsetLeft / curW) * 100;
            tP = (w.offsetTop  / curVH) * 100;
        }
        if (w.dataset.type !== 'deficalme' && w.dataset.type !== 'sondage' && w.dataset.type !== 'couleurs' && w.dataset.type !== 'musique-clavier') {
            Object.assign(w.dataset, { widthPercent: wP, contentHPercent: hP, leftPercent: lP, topPercent: tP });
        }
        // Données propres aux stickers
        let stickerUrl = null, stickerEmoji = null, stickerSize = null;
        if (w.dataset.type === 'sticker') {
            const sImg = w.querySelector('img');
            const sEmoji = w.querySelector('[data-sticker-type="emoji"]');
            if (sImg) stickerUrl = sImg.src;
            if (sEmoji) stickerEmoji = sEmoji.textContent;
            stickerSize = { w: w.offsetWidth, h: w.offsetHeight };
        }
        // Données propres au widget monnaie
        let monnaieData = null;
        if (w.dataset.type === 'monnaie') {
            const mc = w.querySelector('.monnaie-container');
            const mz = w.querySelector('.monnaie-items');
            monnaieData = {
                containerW: mc ? mc.offsetWidth  : null,
                itemsH:     mz ? mz.offsetHeight : null,
                level:      w.dataset.monnaieLevel || 'facile'
            };
        }
        // Données propres au widget tableau de numération
        let tableauNumData = null;
        if (w.dataset.type === 'tableau-num' && typeof w._tnumGetData === 'function') {
            tableauNumData = w._tnumGetData();
        }
        // Données propres au widget horloge
        let horlogeData = null;
        if (w.dataset.type === 'horloge' && typeof w._hrlgGetData === 'function') {
            horlogeData = {
                ...w._hrlgGetData(),
                widgetW: w.offsetWidth
            };
        }
        // Données propres au widget sondage
        let sondageData = null;
        if (w.dataset.type === 'sondage' && typeof w._sndGetData === 'function') {
            sondageData = w._sndGetData();
        }
        // Données propres au widget couleurs
        let clrData = null;
        if (w.dataset.type === 'couleurs' && typeof w._clrGetData === 'function') {
            clrData = w._clrGetData();
        }
        // Données propres au widget solide 3D
        let s3dW = 0, s3dH = 0;
        if (w.dataset.type === 'solide3d') {
            s3dW = w.offsetWidth;
            s3dH = w.offsetHeight;
        }
        // Données propres au widget conjugaison
        let conjData = null;
        if (w.dataset.type === 'conjugaison') {
            const cc = w.querySelector('.conj-container');
            const cg = w.querySelector('.conj-grid');
            conjData = {
                containerW: cc ? cc.offsetWidth : null,
                gridH: cg ? (parseInt(cg.style.height) || null) : null
            };
        }
        // Données propres au widget heure
        let heureData = null;
        if (w.dataset.type === 'heure') {
            const hc = w.querySelector('.heure-container');
            const hz = w.querySelector('.heure-clocks-zone');
            heureData = {
                containerW: hc ? hc.offsetWidth  : null,
                clocksZoneH: hz ? hz.offsetHeight : null,
                level:      w.dataset.heureLevel || 'facile',
                mode:       w.dataset.heureMode  || 'lecture'
            };
        }
        // Données propres au widget écriture séyès
        let seyesData = null;
        if (w.dataset.type === 'seyes' || w.dataset.subtype === 'seyes') {
            const sc = w.querySelector('.seyes-container');
            const se = w.querySelector('.seyes-editor');
            const wa = w.querySelector('.seyes-writing-area');
            const sm = w.querySelector('.seyes-editor-marge');
            seyesData = {
                containerW:   sc ? sc.offsetWidth  : null,
                containerH:   sc ? sc.offsetHeight : null,
                editorHTML:   se ? se.innerHTML     : '',
                margeHTML:    sm ? sm.innerHTML     : '',
                fontSize:     se ? se.style.fontSize   : null,
                lineHeight:   se ? se.style.lineHeight  : null,
                paddingTop:   se ? se.style.paddingTop  : null,
                fontFamily:   se ? se.style.fontFamily  : null,
                color:        se ? se.style.color       : null,
                fullboard:    sc ? sc.classList.contains('wf-fullboard') : true
            };
        }
        // Données propres au widget plan
        let planData = null;
        if (w.dataset.type === 'plan') {
            const pc = w.querySelector('.plan-container');
            planData = {
                containerW: pc ? pc.offsetWidth  : null,
                containerH: pc ? pc.offsetHeight : null,
                items: w._planData ? JSON.stringify(w._planData) : null
            };
        }
        // Données propres au widget emploi du temps
        let edtData = null;
        if (w.dataset.type === 'edt') {
            const ec = w.querySelector('.edt-container');
            edtData = {
                containerW: ec ? ec.offsetWidth  : null,
                containerH: ec ? ec.offsetHeight : null,
                data: w._edtData ? JSON.stringify(w._edtData) : null
            };
        }
        // Données propres au widget conversion
        let convData = null;
        if (w.dataset.type === 'conversion' && typeof w._convGetData === 'function') {
            convData = w._convGetData();
        }
        // Données propres au widget fractions
        let fracData = null;
        if (w.dataset.type === 'fractions' && typeof w._fracGetData === 'function') {
            fracData = w._fracGetData();
        }
        // Données propres au widget dé
        let deData = null;
        if (w.dataset.type === 'de') {
            deData = {
                faces:   w.dataset.deFaces   || '6',
                history: w.dataset.deHistory || '[]'
            };
        }
        // Données propres au widget calendrier
        let calData = null;
        if (w.dataset.type === 'calendrier') {
            calData = {
                calId:    w.dataset.calId    || null,
                calState: w._calState ? JSON.stringify(w._calState) : null
            };
        }
        // Données propres au widget reproduction quadrillage
        let rqData = null;
        if (w.dataset.type === 'repro-quadrillage' && typeof w._rqGetData === 'function') {
            rqData = w._rqGetData();
        }
        // Données propres au widget symétrie axiale
        let saData = null;
        if (w.dataset.type === 'symetrie-axiale' && typeof w._saGetData === 'function') {
            saData = w._saGetData();
        }
        // Données propres au widget mots mêlés
        let mmData = null;
        if (w.dataset.type === 'motsmeles' && typeof w._mmGetData === 'function') {
            mmData = w._mmGetData();
        }
        // Données propres au widget droite numérique
        let dnData = null;
        if ((w.dataset.type === 'droite-num' || w.dataset.subtype === 'droite-num') && typeof w._dnGetData === 'function') {
            dnData = w._dnGetData();
        }
        // Données propres au widget nombres en chiffres/lettres
        let nclData = null;
        if (w.dataset.type === 'nombres-chiffres-lettres' && typeof w._nclGetData === 'function') {
            nclData = w._nclGetData();
        }
        widgets.push({
			type: w.dataset.subtype === 'seyes' ? 'seyes' : w.dataset.subtype === 'droite-num' ? 'droite-num' : w.dataset.type, topPercent: tP, leftPercent: lP, widthPercent: wP, contentHPercent: hP,
			html, content: html, iframeSrc: iframe?.src || null,
			transparent: w.dataset.transparent === "true",
			bgColor: w.dataset.bgColor || "#ffffff",
			bgOpacity: parseFloat(w.dataset.bgOpacity ?? 1),
			editorStyle: isTextLike ? getEditorStyleNormalized(w, 1920) : null,
			pinned: w.dataset.pinned === "true",
			background: w.dataset.background === "true",
			groupId: w.dataset.groupId || null,
			meteoCity: w.dataset.meteoCity || null,
			stickerUrl, stickerEmoji, stickerSize,
			isImageWidget: w.dataset.imageWidget === 'true',
			imgOpacity: w.dataset.imgOpacity || null,
			flipX: w.dataset.flipX || null,
			flipY: w.dataset.flipY || null,
			anchored: w.dataset.anchored === 'true' || null,
			transform: w.style.transform || null,
			pdfId: w.dataset.pdfId || null,
			pdfName: w.dataset.pdfName || null,
			pdfCollapsed: w.querySelector('.editor-container[data-collapsed="true"]') ? true : false,
			// Pour un PDF réduit : sauvegarder position/taille d'ORIGINE en % (pas les valeurs réduites)
			pdfSavedWPct:    (() => { const c = w.querySelector('.editor-container[data-collapsed="true"]'); if (!c) return null; const px = parseFloat(c.dataset.savedW); return isNaN(px) ? null : (px / curW) * 100; })(),
			pdfSavedHPct:    (() => { const c = w.querySelector('.editor-container[data-collapsed="true"]'); if (!c) return null; const px = parseFloat(c.dataset.savedH); return isNaN(px) ? null : (px / curVH) * 100; })(),
			pdfSavedTopPct:  (() => { const c = w.querySelector('.editor-container[data-collapsed="true"]'); if (!c) return null; const px = parseFloat(c.dataset.savedTop); return isNaN(px) ? null : (px / curVH) * 100; })(),
			pdfSavedLeftPct: (() => { const c = w.querySelector('.editor-container[data-collapsed="true"]'); if (!c) return null; const px = parseFloat(c.dataset.savedLeft); return isNaN(px) ? null : (px / curW) * 100; })(),
			animation: w.dataset.animation || null,
			monnaieData,
			planData,
			edtData,
			heureData,
			conjData,
			tableauNumData,
			horlogeData,
			sondageData,
			clrData,
			s3dW, s3dH,
			seyesData,
			convData,
			fracData,
			deData,
			calData,
			rqData,
			saData,
			mmData,
			dnData,
			nclData
		});
    });
    const shapes = [];
    document.querySelectorAll('.shape-widget').forEach(w => {
        const svg = w.querySelector('svg');
        if (!svg) return;
        const lP = (w.offsetLeft / curW) * 100;
        const tP = (w.offsetTop  / curVH) * 100;
        const wP = (parseFloat(svg.getAttribute('width') || 150) / curW) * 100;
        const hP = (parseFloat(svg.getAttribute('height') || 150) / curVH) * 100;
        w.dataset.leftPercent = lP; w.dataset.topPercent = tP;
        w.dataset.wPercent = wP; w.dataset.hPercent = hP;
        shapes.push({
            shapeType: w.dataset.shapeType, strokeColor: w.dataset.strokeColor,
            fillColor: w.dataset.fillColor, fillOpacity: w.dataset.fillOpacity,
            strokeWidth: parseInt(w.dataset.strokeWidth || 4),
            leftPercent: lP, topPercent: tP, wPercent: wP, hPercent: hP,
            transform: w.style.transform || '', pinned: w.dataset.pinned === "true",
            background: w.dataset.background === "true",
            groupId: w.dataset.groupId || null,
            flipX: parseFloat(w.dataset.flipX || 1),
            flipY: parseFloat(w.dataset.flipY || 1)
        });
    });
    return { widgets, shapes, refWidth: 1920, background: localStorage.getItem('boardBackground') || 'none', strokes: strokes || [] };
}

function buildBoardJSON() {
    try { return JSON.stringify(buildBoardState()); } catch(e) { return null; }
}

function saveBoard() {
    if (isInitialLoading || isRestoringState) return;
    const json = JSON.stringify(buildBoardState());
    // DEBUG : tracer les sauvegardes PDF dans localStorage
    try {
        const parsed = JSON.parse(json);
        const pdfWidgets = parsed.widgets.filter(w => w.type === 'pdf');
        const stack = new Error().stack.split('\n')[2]?.trim() || '?';
        const logs = JSON.parse(localStorage.getItem('_pdfDebugLog') || '[]');
        logs.push({ t: Date.now(), stack, pdfs: pdfWidgets.map(w => ({ pdfId: w.pdfId, pdfName: w.pdfName, w: Math.round(w.widthPercent), h: Math.round(w.contentHPercent) })) });
        if (logs.length > 20) logs.shift();
        localStorage.setItem('_pdfDebugLog', JSON.stringify(logs));
    } catch(e) {}
    localStorage.setItem('profBoardConfig', json);
    // Mettre à jour la scène courante
    if (scenes && scenes.length > 0) {
        scenes[currentScene].config     = json;
        scenes[currentScene].background = localStorage.getItem('boardBackground') || 'none';
        saveScenesMeta();
    }
    scheduleSaveSnapshot();
}

function loadBoard() {
    const raw = localStorage.getItem('profBoardConfig');
    // DEBUG : logger ce qu'on est sur le point de charger
    try {
        const logs = JSON.parse(localStorage.getItem('_pdfDebugLog') || '[]');
        if (raw) {
            const parsed = JSON.parse(raw);
            const pdfWidgets = parsed.widgets ? parsed.widgets.filter(w => w.type === 'pdf') : [];
            logs.push({ t: Date.now(), stack: 'LOAD', pdfs: pdfWidgets.map(w => ({ pdfId: w.pdfId, pdfName: w.pdfName, w: Math.round(w.widthPercent), h: Math.round(w.contentHPercent) })) });
        } else {
            logs.push({ t: Date.now(), stack: 'LOAD', pdfs: 'PAS DE CONFIG' });
        }
        localStorage.setItem('_pdfDebugLog', JSON.stringify(logs));
    } catch(e) {}
    if (raw) {
        // localStorage contient une sauvegarde → on la charge, fin de l'histoire
        restoreBoardFromJSON(raw);
    } else {
        // localStorage vide = première visite → tableau vierge avec fond par défaut
        const defaultBg = 'url(fonds/fond-lebureauduprof-defaut01.jpeg)';
        const defaultState = { widgets: [], shapes: [], strokes: [], refWidth: 1920, background: defaultBg };
        const json = JSON.stringify(defaultState);
        localStorage.setItem('profBoardConfig', json);
        applyBackground(defaultBg);
        localStorage.setItem('boardBackground', defaultBg);
        restoreBoardFromJSON(json);
    }
}

function restoreBoardFromJSON(json) {
    // Bloquer saveBoard() pendant toute la restauration (y compris les setTimeout 50ms)
    isRestoringState = true;
    const parsed = JSON.parse(json);
    const data = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
    const refW = parsed.refWidth || 1920;
    // Restaurer les traits canvas (y compris tableau vide pour effacer le canvas)
    if (parsed.strokes !== undefined) {
        strokes = parsed.strokes;
        if (strokes.length > 0 && !drawCanvas) {
            initCanvas();
            drawCanvas.classList.add('inactive');
        }
        setTimeout(() => redrawStrokes(), 100);
    }
    const curW = window.innerWidth, curVH = virtualH(curW);
    // Compter les widgets non-stickers pour savoir quand tous les setTimeout(50ms) sont terminés
    const nonStickerCount = data.filter(w => w.type !== 'sticker').length;
    let restoredCount = 0;
    // Compteur de PDFs en attente — bloque saveBoard() dans togglePdfCollapse
    const _pdfCount = data.filter(w => w.type === 'pdf' && w.pdfId).length;
    let _pdfResolvingCount = _pdfCount;
    window._pdfRestoring = _pdfCount > 0;
    data.forEach(w => {
        // Restauration spéciale des stickers (pas de template HTML)
        if (w.type === 'sticker') {
            const curWW = window.innerWidth, curVVH = virtualH(curWW);
            const lx = (w.leftPercent / 100) * curWW;
            const ty = (w.topPercent  / 100) * curVVH;

            // Widget image avancé (avec poignée resize, flip, lock)
            if (w.isImageWidget && w.stickerUrl && typeof _doInsertImageWidget === 'function') {
                const szw = (w.stickerSize && w.stickerSize.w) ? w.stickerSize.w : 130;
                const szh = (w.stickerSize && w.stickerSize.h) ? w.stickerSize.h : 130;
                const iw = _doInsertImageWidget(w.stickerUrl, '', szw, szh, { left: lx, top: ty, skipFreePos: true });
                if (iw) {
                    if (w.transform)  iw.style.transform = w.transform;
                    if (w.flipX)      iw.dataset.flipX = w.flipX;
                    if (w.flipY)      iw.dataset.flipY = w.flipY;
                    if (w.imgOpacity) iw.dataset.imgOpacity = w.imgOpacity;
                    if (w.pinned)     bringToFront(iw, true);
                    if (w.background) { iw.style.zIndex = 1; iw.dataset.background = 'true'; }
                    if (w.groupId)    iw.dataset.groupId = w.groupId;
                    // Réappliquer le flip si nécessaire
                    const flipImg = iw.querySelector('img');
                    if (flipImg) {
                        const sx = parseFloat(w.flipX || 1), sy = parseFloat(w.flipY || 1);
                        if (sx !== 1 || sy !== 1) flipImg.style.transform = `scale(${sx}, ${sy})`;
                    }
                    // Restaurer l'état ancré
                    if (w.anchored && typeof _applyAnchorState === 'function') {
                        iw.dataset.anchored = 'true';
                        _applyAnchorState(iw, true);
                    }
                }
                return;
            }
            const sw = document.createElement('div');
            sw.className = 'widget';
            sw.dataset.type = 'sticker';
            sw.dataset.transparent = 'true';
            sw.tabIndex = 0;
            const HANDLES = '<div class="drag-handle" title="Déplacer">✥</div>'
                + '<div class="widget-rotate-handle" title="Faire pivoter">↻</div>'
                + '<div class="widget-action-bar">'
                + '<div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest(\'.widget,.shape-widget\'))" title="Menu">☰</div>'
                + '<div class="widget-pin-handle" onclick="togglePin(this.closest(\'.widget\'))" title="Épingler">📌</div>'
                + '<div class="widget-back-handle" onclick="sendToBack(this.closest(\'.widget\'))" title="Envoyer derrière">🔽</div>'
                + '<div class="widget-close-handle" onclick="snapshotNow();this.closest(\'.widget\').remove();saveBoard();" title="Fermer">×</div>'
                + '</div>'
                + '<div class="widget-ctx-menu"></div>';
            if (w.stickerEmoji) {
                const sz = (w.stickerSize && w.stickerSize.w) ? w.stickerSize.w : 100;
                sw.style.cssText = `left:${lx}px;top:${ty}px;width:${sz}px;height:${sz}px;min-height:0!important;overflow:visible;flex-direction:row;flex-shrink:0;`;
                sw.style.setProperty('--sticker-h', sz + 'px');
                const econtent = document.createElement('div');
                econtent.dataset.stickerType = 'emoji';
                econtent.style.cssText = `position:absolute;top:0;left:0;width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(sz*0.62)}px;line-height:1;user-select:none;pointer-events:none;`;
                econtent.textContent = w.stickerEmoji;
                sw.innerHTML = HANDLES;
                sw.appendChild(econtent);
            } else if (w.stickerUrl) {
                const szw = (w.stickerSize && w.stickerSize.w) ? w.stickerSize.w : 130;
                const szh = (w.stickerSize && w.stickerSize.h) ? w.stickerSize.h : 130;
                sw.style.cssText = `left:${lx}px;top:${ty}px;width:${szw}px;height:${szh}px;overflow:visible;flex-direction:row;`;
                sw.style.setProperty('--sticker-h', szh + 'px');
                const simg = document.createElement('img');
                simg.src = w.stickerUrl;
                simg.alt = '';
                simg.draggable = false;
                simg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;padding:6px;box-sizing:border-box;';
                sw.innerHTML = HANDLES;
                sw.appendChild(simg);
            } else {
                return; // sticker sans données valides, on ignore
            }
            if (w.transform) sw.style.transform = w.transform;
            if (w.pinned)    bringToFront(sw, true);
            if (w.background) { sw.style.zIndex = 1; sw.dataset.background = 'true'; }
            if (w.groupId)   sw.dataset.groupId = w.groupId;
            sw.tabIndex = 0;
            sw.addEventListener('mousedown', () => {
                bringToFront(sw);
                sw.focus();
                if (typeof positionActionBar === 'function') positionActionBar(sw);
            });
            board.appendChild(sw);
            makeDraggable(sw);
            makeDraggableRotate(sw);
            _addStickerResizeHandle(sw, 40);
            return; // widget sticker traité, on passe au suivant
        }
        let widget;
        if (w.type === 'deficalme') {
            widget = createDeficalmeWidget();
            // Restaurer la largeur proportionnellement à l'écran courant
            if (w.widthPercent > 0) {
                const dc = widget.querySelector('.dc-container');
                if (dc) dc.style.width = (w.widthPercent / 100) * curW + 'px';
            }
        } else if (w.type === 'monnaie') {
            widget = createMonnaieWidget();
            // Restaurer les dimensions sauvegardées
            if (w.monnaieData) {
                const mc = widget.querySelector('.monnaie-container');
                const mz = widget.querySelector('.monnaie-items');
                if (mc && w.monnaieData.containerW) mc.style.width   = w.monnaieData.containerW + 'px';
                if (mz && w.monnaieData.itemsH)     mz.style.height  = w.monnaieData.itemsH     + 'px';
                // Restaurer le niveau
                if (w.monnaieData.level && widget._setLevel) widget._setLevel(w.monnaieData.level);
            }
        } else if (w.type === 'tableau-num') {
            widget = createTableauNumWidget();
            if (w.tableauNumData && typeof widget._tnumSetData === 'function') {
                widget._tnumSetData(w.tableauNumData);
            }
        } else if (w.type === 'conjugaison') {
            widget = createConjugaisonWidget();
            if (w.conjData) {
                const cc = widget.querySelector('.conj-container');
                const cg = widget.querySelector('.conj-grid');
                if (cc && w.conjData.containerW) cc.style.width = w.conjData.containerW + 'px';
                if (cg && w.conjData.gridH)      cg.style.height = w.conjData.gridH + 'px';
            }
        } else if (w.type === 'heure') {
            widget = createHeureWidget();
            if (w.heureData) {
                const hc = widget.querySelector('.heure-container');
                const hz = widget.querySelector('.heure-clocks-zone');
                if (hc && w.heureData.containerW)  hc.style.width  = w.heureData.containerW  + 'px';
                if (hz && w.heureData.clocksZoneH) hz.style.height = w.heureData.clocksZoneH + 'px';
                if (w.heureData.level && widget._setLevel) widget._setLevel(w.heureData.level);
                if (w.heureData.mode  && widget._setMode)  widget._setMode(w.heureData.mode);
            }
        } else if (w.type === 'horloge') {
            widget = createHorlogeWidget();
            if (w.horlogeData && typeof widget._hrlgSetData === 'function') {
                widget._hrlgSetData(w.horlogeData);
            }
        } else if (w.type === 'sondage') {
            widget = createSondageWidget();
            if (w.sondageData && typeof widget._sndSetData === 'function') {
                widget._sndSetData(w.sondageData);
            }
            const sc = widget.querySelector('.snd-container');
            if (sc && w.sondageData) {
                if (w.sondageData.fullboard) {
                    sc.classList.add('snd-fullboard');
                } else {
                    if (w.sondageData.containerW) sc.style.width  = w.sondageData.containerW + 'px';
                    if (w.sondageData.containerH) sc.style.height = w.sondageData.containerH + 'px';
                }
            }
        } else if (w.type === 'couleurs') {
            widget = createCouleursWidget();
            if (w.clrData && typeof widget._clrSetData === 'function') {
                widget._clrSetData(w.clrData);
            }
            const cc = widget.querySelector('.clr-container');
            if (cc && w.clrData) {
                if (w.clrData.fullboard) {
                    cc.classList.add('clr-fullboard');
                } else {
                    if (w.clrData.containerW) cc.style.width  = (w.clrData.containerW / (w._refW || 1920)) * curW + 'px';
                }
            }
            // Restaurer dimensions en % si pas de clrData
            if (!w.clrData && cc) {
                if (w.widthPercent  > 0) cc.style.width  = (w.widthPercent  / 100) * curW  + 'px';
                if (w.contentHPercent > 0) cc.style.height = (w.contentHPercent / 100) * curVH + 'px';
            }
        } else if (w.type === 'solide3d') {
            widget = createSolide3DWidget();
            if (w.s3dW > 0) widget.style.width  = w.s3dW + 'px';
            if (w.s3dH > 0) widget.style.height = w.s3dH + 'px';
        } else if (w.type === 'plan') {
            widget = createPlanWidget();
            // Restaurer les dimensions sauvegardées
            if (w.planData) {
                const pc = widget.querySelector('.plan-container');
                if (pc && w.planData.containerW) pc.style.width  = w.planData.containerW + 'px';
                if (pc && w.planData.containerH) pc.style.height = w.planData.containerH + 'px';
                // Restaurer les éléments du plan
                if (w.planData.items && widget._setPlanData) {
                    try { widget._setPlanData(JSON.parse(w.planData.items)); } catch(e) {}
                }
            }
        } else if (w.type === 'edt') {
            widget = createEdtWidget();
            // Restaurer les dimensions sauvegardées
            if (w.edtData) {
                const ec = widget.querySelector('.edt-container');
                if (ec && w.edtData.containerW) ec.style.width  = w.edtData.containerW + 'px';
                if (ec && w.edtData.containerH) ec.style.height = w.edtData.containerH + 'px';
                // Restaurer les jours / cours / couleurs
                if (w.edtData.data && widget._setEdtData) {
                    try { widget._setEdtData(JSON.parse(w.edtData.data)); } catch(e) {}
                }
            }
        } else if (w.type === 'seyes') {
            widget = createSeyesWidget();
            if (w.seyesData) {
                const sc = widget.querySelector('.seyes-container');
                const se = widget.querySelector('.seyes-editor');
                const sm = widget.querySelector('.seyes-editor-marge');
                const isFullboard = w.seyesData.fullboard !== false; // true par défaut
                // Restaurer dimensions seulement si PAS en fullboard
                if (!isFullboard) {
                    sc.classList.remove('wf-fullboard');
                    if (sc && w.seyesData.containerW) sc.style.width  = w.seyesData.containerW + 'px';
                    if (sc && w.seyesData.containerH) sc.style.height = w.seyesData.containerH + 'px';
                }
                // S'assurer que la classe fullboard est bien présente si nécessaire
                if (isFullboard && sc) sc.classList.add('wf-fullboard');
                if (se) {
                    if (w.seyesData.fontSize)   se.style.fontSize   = w.seyesData.fontSize;
                    if (w.seyesData.lineHeight)  se.style.lineHeight = w.seyesData.lineHeight;
                    if (w.seyesData.paddingTop)  se.style.paddingTop = w.seyesData.paddingTop;
                    if (w.seyesData.fontFamily)  se.style.fontFamily = w.seyesData.fontFamily;
                    if (w.seyesData.color)       se.style.color      = w.seyesData.color;
                    if (w.seyesData.editorHTML)  se.innerHTML        = w.seyesData.editorHTML;
                }
                if (sm && w.seyesData.margeHTML) {
                    sm.innerHTML = w.seyesData.margeHTML;
                    sm.classList.add('active');
                }
                if (w.seyesData.fontSize && sm) {
                    sm.style.fontSize   = w.seyesData.fontSize;
                    sm.style.lineHeight = w.seyesData.lineHeight;
                    sm.style.paddingTop = w.seyesData.paddingTop;
                }
                // (fond séyès géré par CSS sur .seyes-writing-area)
            }
        } else if (w.type === 'conversion') {
            widget = createConversionWidget();
            if (w.convData && typeof widget._convSetData === 'function') {
                widget._convSetData(w.convData);
            }
        } else if (w.type === 'fractions') {
            widget = createWidget('fractions', '100px', '100px', false);
            if (w.fracData && typeof widget._fracSetData === 'function') {
                // _fracSetData est appelé après le requestAnimationFrame d'init
                const _fracDataToRestore = w.fracData;
                setTimeout(() => {
                    if (typeof widget._fracSetData === 'function') {
                        widget._fracSetData(_fracDataToRestore);
                    }
                    // Restaurer dimensions
                    const fc = widget.querySelector('.frac-container');
                    if (fc && _fracDataToRestore.containerW) fc.style.width  = (_fracDataToRestore.containerW / (w._refW || 1920)) * curW + 'px';
                    if (fc && _fracDataToRestore.containerH) fc.style.height = (_fracDataToRestore.containerH / (w._refW || 1920)) * window.innerHeight + 'px';
                    if (_fracDataToRestore.fullboard && fc) fc.classList.add('wf-fullboard');
                }, 80);
            }
        } else if (w.type === 'de') {
            // Les données deFaces et deHistory sont stockées dans les dataset
            // initDeWidget les lira automatiquement lors de son initialisation
            widget = createWidget('de', '100px', '100px', false);
            if (w.deData) {
                widget.dataset.deFaces   = w.deData.faces   || '6';
                widget.dataset.deHistory = w.deData.history || '[]';
            }
        } else if (w.type === 'calendrier') {
            // Widget calendrier : créé et initialisé par widget-calendrier.js
            if (typeof createCalendrierWidget === 'function') {
                widget = createCalendrierWidget();
                // Restaurer le calId d'origine (clé IndexedDB)
                if (w.calData && w.calData.calId) widget.dataset.calId = w.calData.calId;
                // Restaurer état + événements (IndexedDB prime sur le JSON du board)
                if (w.calData && w.calData.calState && typeof _calRestoreData === 'function') {
                    _calRestoreData(widget, w.calData.calState);
                }
            } else {
                widget = createWidget(w.type, '100px', '100px', false);
            }
        } else if (w.type === 'repro-quadrillage') {
            if (typeof createReproQuadrillageWidget === 'function') {
                widget = createReproQuadrillageWidget(w.rqData || null);
            } else {
                widget = createWidget(w.type, '100px', '100px', false);
            }
        } else if (w.type === 'symetrie-axiale') {
            if (typeof createSymetrieAxialeWidget === 'function') {
                widget = createSymetrieAxialeWidget(w.saData || null);
            } else {
                widget = createWidget(w.type, '100px', '100px', false);
            }
        } else if (w.type === 'motsmeles') {
            if (typeof createMotsMelesWidget === 'function') {
                widget = createMotsMelesWidget(w.mmData || null);
            } else {
                widget = createWidget(w.type, '100px', '100px', false);
            }
        } else if (w.type === 'droite-num') {
            // Passer dnData via initDroiteNumWidget(widget, savedData) grâce au hook
            // On crée d'abord un widget fantôme pour récupérer la référence,
            // puis on y pose _dnPendingData avant que le hook appelle initDroiteNumWidget.
            // Comme createWidget est synchrone et appelle initDroiteNumWidget en interne,
            // on pose la donnée sur window._dnNextPendingData et le hook la consomme.
            if (w.dnData) window._dnNextPendingData = w.dnData;
            widget = createWidget('droite-num', '100px', '100px', false);
            window._dnNextPendingData = null;
            // Restaurer dimensions après le rAF d'init (120ms pour laisser le rAF se terminer)
            if (w.dnData) {
                const _dnDataToRestore = w.dnData;
                setTimeout(() => {
                    const dn = widget.querySelector('.dn-container');
                    if (dn && !_dnDataToRestore.fullboard) {
                        if (_dnDataToRestore.containerW) dn.style.width  = (_dnDataToRestore.containerW / (w._refW || 1920)) * curW + 'px';
                        if (_dnDataToRestore.containerH) dn.style.height = _dnDataToRestore.containerH + 'px';
                    }
                    if (dn && _dnDataToRestore.fullboard) dn.classList.add('wf-fullboard');
                }, 120);
            }
        } else if (w.type === 'musique-clavier') {
            widget = createWidget('musique-clavier', '100px', '100px', false);
            // Les dimensions sont restaurées via widthPercent/contentHPercent et l'init du widget
        } else if (w.type === 'nombres-chiffres-lettres') {
            if (typeof createNombresLettresWidget === 'function') {
                widget = createNombresLettresWidget(w.nclData || null);
            } else {
                widget = createWidget(w.type, '100px', '100px', false);
            }
        } else {
            widget = createWidget(w.type, '100px', '100px', false);
        }
        const c = widget.querySelector('.editor-container');
        const hP = w.contentHPercent !== undefined ? w.contentHPercent : w.heightPercent;
        Object.assign(widget.dataset, { widthPercent: w.widthPercent || 0, contentHPercent: hP || 0, leftPercent: w.leftPercent ?? 0, topPercent: w.topPercent ?? 0 });
        if (w.meteoCity) widget.dataset.meteoCity = w.meteoCity;
        // Poser pdfId/pdfName immédiatement (pas dans setTimeout) pour que saveBoard() les trouve toujours
        if (w.type === 'pdf' && w.pdfId) {
            widget.dataset.pdfId  = w.pdfId;
            if (w.pdfName) widget.dataset.pdfName = w.pdfName;
        }
        if (c) {
            if (w.widthPercent > 0) c.style.width = (w.widthPercent / 100) * curW + 'px';
            if (hP > 0) c.style.height = ((hP / 100) * curVH) + getToolbarHeight(c) + 'px';
        }
        widget.style.left = (w.leftPercent / 100) * curW + 'px';
        widget.style.top  = (w.topPercent  / 100) * curVH + 'px';
        // Appliquer transparence et fond immédiatement pour éviter le flash
        if (w.transparent) {
            applyTransparency(widget, true);
        } else if (w.bgColor) {
            widget.dataset.bgColor = w.bgColor;
            if (w.bgOpacity !== undefined && w.bgOpacity !== 1) {
                const rgb = hexToRgb(w.bgColor);
                if (rgb) {
                    const newBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${w.bgOpacity})`;
                    widget.style.background = newBg;
                    const wc = widget.querySelector('.widget-content');
                    if (wc) wc.style.background = newBg;
                    const c2 = widget.querySelector('.editor-container');
                    if (c2) c2.style.background = newBg;
                    widget.dataset.bgOpacity = w.bgOpacity;
                } else {
                    widget.style.background = w.bgColor;
                    const wc = widget.querySelector('.widget-content');
                    if (wc) wc.style.background = w.bgColor;
                    const c2 = widget.querySelector('.editor-container');
                    if (c2) c2.style.background = w.bgColor;
                }
            } else {
                widget.style.background = w.bgColor;
                const wc = widget.querySelector('.widget-content');
                if (wc) wc.style.background = w.bgColor;
                const c2 = widget.querySelector('.editor-container');
                if (c2) c2.style.background = w.bgColor;
                widget.dataset.bgOpacity = 1;
            }
        }
        if (w.background) { widget.style.zIndex = 1; widget.dataset.background = "true"; }
        else if (w.pinned) bringToFront(widget, true);
        if (w.groupId) widget.dataset.groupId = w.groupId;
        // Restaurer l'animation si elle existe
        if (w.animation) {
            widget.dataset.animation = w.animation;
            const cssAnims = ['blink','bounce','swing','pendulum','fade','shimmer','zoompulse'];
            cssAnims.forEach(a => widget.classList.remove('anim-' + a));
            if (cssAnims.includes(w.animation)) {
                widget.classList.add('anim-' + w.animation);
            } else {
                setTimeout(() => {
                    if (w.animation === 'rainbow'    && typeof _rainbowStart    === 'function') _rainbowStart(widget);
                    if (w.animation === 'fire'       && typeof _fireStart       === 'function') _fireStart(widget);
                    if (w.animation === 'wave'       && typeof _waveStart       === 'function') _waveStart(widget);
                    if (w.animation === 'twinkle'    && typeof _twinkleStart    === 'function') _twinkleStart(widget);
                    if (w.animation === 'rain'       && typeof _rainStart       === 'function') _rainStart(widget);
                    if (w.animation === 'typewriter' && typeof _typewriterStart === 'function') _typewriterStart(widget);
                }, 150);
            }
        }

        // Widgets texte/devoirs : démarrer en mode non-éditable (drag par défaut)
        if (w.type === 'text' || w.type === 'homework') {
            const ed = widget.querySelector('.editor-content');
            if (ed) {
                ed.contentEditable = 'false';
                ed.style.cursor = 'grab';
                ed.style.userSelect = 'none';
            }
            widget.style.cursor = 'grab';
        }

        setTimeout(() => {
            const editor = widget.querySelector('.editor-content');
            const agenda = widget.querySelector('.agenda-list');
            const htmlContent = w.html ?? w.content ?? null;
            if (htmlContent) {
                if (agenda) {
                    agenda.innerHTML = htmlContent;
                    // Nettoyer les <hr> injectés par le navigateur dans les contenteditable
                    // (les tirets "-----" sont parfois parsés en <hr> lors de la sérialisation)
                    agenda.querySelectorAll('.agenda-time, .agenda-text').forEach(el => {
                        const hrs = el.querySelectorAll('hr');
                        if (hrs.length > 0) {
                            const isTime = el.classList.contains('agenda-time');
                            hrs.forEach(hr => hr.remove());
                            if (!el.textContent.trim()) {
                                el.textContent = isTime ? '─────' : '───────────';
                            }
                        }
                    });
                    agenda.querySelectorAll('.agenda-item').forEach(attachAgendaItemEvents);
                }
                else if (editor) { editor.innerHTML = htmlContent; }
            }
            const iframe = widget.querySelector('iframe');
            if (w.iframeSrc && iframe) iframe.src = w.iframeSrc;
            if (w.type === 'carte' && typeof _carteApplyBackgroundState === 'function') {
                _carteApplyBackgroundState(widget);
            }
            // Restaurer le PDF depuis IndexedDB si disponible
            if (w.type === 'pdf' && w.pdfId) {
                const _pdfContainer = widget.querySelector('.editor-container');
                const _pdfCollapsed  = w.pdfCollapsed;
                const _pdfSavedWPct   = w.pdfSavedWPct   || null;
                const _pdfSavedHPct   = w.pdfSavedHPct   || null;
                const _pdfSavedTopPct  = w.pdfSavedTopPct  || null;
                const _pdfSavedLeftPct = w.pdfSavedLeftPct || null;
                const _pdfName     = w.pdfName || '';
                pdfStorage.get(w.pdfId).then(base64 => {
                    if (base64 && _pdfContainer) {
                        if (_pdfCollapsed) {
                            const _rW = window.innerWidth, _rVH = virtualH(_rW);
                            if (_pdfSavedWPct)    _pdfContainer.dataset.savedW    = ((_pdfSavedWPct   / 100) * _rW)  + 'px';
                            if (_pdfSavedHPct)    _pdfContainer.dataset.savedH    = ((_pdfSavedHPct   / 100) * _rVH) + 'px';
                            if (_pdfSavedTopPct)  _pdfContainer.dataset.savedTop  = ((_pdfSavedTopPct  / 100) * _rVH) + 'px';
                            if (_pdfSavedLeftPct) _pdfContainer.dataset.savedLeft = ((_pdfSavedLeftPct / 100) * _rW)  + 'px';
                            _pdfContainer.dataset.collapsed = 'false';
                            const cw = _pdfContainer.querySelector('.pdf-canvas-wrap');
                            if (cw) cw.dataset.neverRendered = 'true';
                            togglePdfCollapse(_pdfContainer);
                        } else {
                            _showPdfInWidget(_pdfContainer, base64, _pdfName);
                        }
                    }
                }).finally(() => {
                    _pdfResolvingCount--;
                    if (_pdfResolvingCount <= 0) window._pdfRestoring = false;
                });
            }
            applyEditorStyleFromConfig(widget, w.editorStyle);
            scaleFontSizesFromRef(widget, refW);
            restoredCount++;
            if (restoredCount >= nonStickerCount) {
                isRestoringState = false;
            }
        }, 50);
    });
    // Si aucun widget non-sticker, libérer immédiatement
    if (nonStickerCount === 0) {
        isRestoringState = false;
    }
    if (parsed.shapes) {
        parsed.shapes.forEach(s => {
            const curW2 = window.innerWidth, curVH2 = virtualH(curW2);
            const sw = (s.wPercent / 100) * curW2, sh = (s.hPercent / 100) * curVH2;
            const lx = (s.leftPercent / 100) * curW2, ty = (s.topPercent / 100) * curVH2;
            const w2 = createShapeWidget(s.shapeType, s.strokeColor, s.fillColor, s.fillOpacity, sw, sh, lx + 'px', ty + 'px', false, s.strokeWidth || 4);
            if (s.transform) w2.style.transform = s.transform;
            if (s.flipX !== undefined) w2.dataset.flipX = s.flipX;
            if (s.flipY !== undefined) w2.dataset.flipY = s.flipY;
            const fsx = parseFloat(s.flipX || 1), fsy = parseFloat(s.flipY || 1);
            if (fsx !== 1 || fsy !== 1) {
                const svg2 = w2.querySelector('svg');
                if (svg2) {
                    svg2.style.transformBox    = 'fill-box';
                    svg2.style.transformOrigin = 'center center';
                    svg2.style.transform       = `scale(${fsx}, ${fsy})`;
                }
            }
            if (s.background) { w2.style.zIndex = 1; w2.dataset.background = "true"; }
            else if (s.pinned) bringToFront(w2, true);
            if (s.groupId) w2.dataset.groupId = s.groupId;
            w2.dataset.leftPercent = s.leftPercent; w2.dataset.topPercent = s.topPercent;
            w2.dataset.wPercent = s.wPercent; w2.dataset.hPercent = s.hPercent;
        });
    }
}

async function exportConfig() {
    // Sauvegarder l'état courant d'abord
    const curId = getCurrentProjectId();
    let projectName = 'projet';
    if (curId) {
        try {
            const cur = await dbGet(curId);
            if (cur) {
                projectName = cur.name || 'projet';
                await saveProjectToDB(cur.name);
                // Relire après sauvegarde pour avoir l'état le plus récent
                const updated = await dbGet(curId);
                const exportData = {
                    _type:    'prof-bureau-single-project',
                    _version: 1,
                    exportedAt: Date.now(),
                    project:  updated
                };
                const safeName = projectName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_\-]/g, '');
                const date = new Date().toISOString().split('T')[0];
                const a = document.createElement('a');
                a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
                a.download = `lebureauduprof_${safeName}_${date}.json`;
                document.body.appendChild(a); a.click(); a.remove();
                return;
            }
        } catch(e) {}
    }
    // Fallback : pas de projet en cours, exporter les scènes courantes
    saveCurrentSceneData();
    const exportData = {
        _type:    'prof-bureau-single-project',
        _version: 1,
        exportedAt: Date.now(),
        project: { id: null, name: 'projet', scenes, currentScene, updatedAt: Date.now() }
    };
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
    a.download = `lebureauduprof_projet_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove();
}

function importConfig(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // ── Nouveau format : projet unique ────────────────────────────
            if (data._type === 'prof-bureau-single-project' && data.project) {
                const p = data.project;

                // Sauvegarder le projet courant EN PREMIER, avant toute modale
                // (évite qu'une sauvegarde auto ne corrompe la config pendant les await)
                const curId = getCurrentProjectId();
                if (curId) {
                    try { const cur = await dbGet(curId); await saveProjectToDB(cur?.name || 'Sans titre'); } catch(err) {}
                }

                // Chercher un projet existant avec le même nom
                const allProjects = await dbGetAll();
                const existing = allProjects.find(proj => proj.name === p.name);

                let targetId;
                if (existing) {
                    const choice = await modalConfirm(
                        'Tableau déjà existant',
                        `Un tableau nommé "${p.name}" existe déjà.\n\nConfirmer pour remplacer, Annuler pour importer comme copie.`
                    );
                    if (choice) {
                        targetId = existing.id;
                    } else {
                        targetId = 'proj_' + Date.now();
                        p.name = p.name + ' (copie)';
                    }
                } else {
                    targetId = 'proj_' + Date.now();
                }

                // Bloquer les sauvegardes auto pendant l'écriture en DB
                // pour éviter que saveBoard() écrase la config importée
                isRestoringState = true;
                const imported = { ...p, id: targetId, updatedAt: Date.now() };
                await dbPut(imported);
                isRestoringState = false;

                const project = await loadProjectFromDB(targetId);
                if (project) _updateProjectTitle(project.name);
                event.target.value = '';
                return;
            }

            // ── Format "tout exporter" reçu par erreur ────────────────────
            if (data._type === 'prof-bureau-all-projects') {
                await modalAlert('Import impossible', 'Ce fichier contient tous vos tableaux.\n\nUtilisez "Tout importer" dans le panneau Tableaux pour le restaurer.', 'warning');
                event.target.value = ''; return;
            }

            // ── Ancien format multi-scènes → éclater en projets séparés ──
            if (data.scenes && Array.isArray(data.scenes)) {
                const sceneList = data.scenes;
                const baseName  = 'Projet importé';
                if (sceneList.length === 1) {
                    // Une seule scène : charger directement
                    scenes = [sceneList[0]];
                    currentScene = 0;
                    saveScenesMeta();
                    loadScene(0);
                } else {
                    // Plusieurs scènes → créer un projet par scène
                    const curId = getCurrentProjectId();
                    if (curId) {
                        try { const cur = await dbGet(curId); await saveProjectToDB(cur?.name || 'Sans titre'); } catch(err) {}
                    }
                    let firstId = null;
                    for (let i = 0; i < sceneList.length; i++) {
                        const sc = sceneList[i];
                        const newId = 'proj_' + Date.now() + '_' + i;
                        if (!firstId) firstId = newId;
                        await dbPut({
                            id: newId,
                            name: baseName + (sceneList.length > 1 ? ' — ' + (sc.name || 'Tableau ' + (i + 1)) : ''),
                            scenes: [{ id: sc.id || Date.now(), name: sc.name || 'Tableau 1', config: sc.config || null, background: sc.background || 'none' }],
                            currentScene: 0,
                            updatedAt: Date.now() + i,
                        });
                    }
                    if (firstId) {
                        const project = await loadProjectFromDB(firstId);
                        if (project) _updateProjectTitle(project.name);
                    }
                    await modalAlert('Import réussi', `${sceneList.length} tableaux importés avec succès.`, 'success');
                }
                event.target.value = ''; return;
            }

            // ── Très ancien format mono-scène ─────────────────────────────
            snapshotNow();
            document.querySelectorAll('.widget').forEach(w => w.remove());
            document.querySelectorAll('.shape-widget').forEach(w => w.remove());
            applyBackground(data.background || 'none');
            saveBg(data.background || 'none');
            const json = JSON.stringify(data);
            localStorage.setItem('profBoardConfig', json);
            scenes[0].config = json;
            saveScenesMeta();
            restoreBoardFromJSON(json);
            event.target.value = '';
        } catch(err) { showAlert('⚠️', 'Erreur d\'importation', err.message); }
    };
    reader.readAsText(file);
}

function clearBoard() { document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
function confirmClearBoard() {
    snapshotNow();
    document.querySelectorAll('.widget').forEach(w => w.remove());
    document.querySelectorAll('.shape-widget').forEach(w => w.remove());
    // Effacer aussi les traits de dessin
    if (typeof strokes !== 'undefined') strokes = [];
    if (typeof selectedStrokes !== 'undefined') selectedStrokes = [];
    if (typeof redrawStrokes === 'function') redrawStrokes();
    saveBoard(); closeModal();
}


// updateClock / updateDateTime → widgets-datetime.js
