// =========================================================================
// TOOLBAR TEXTE — Le Bureau du Prof
// Fonctions extraites de index.html
//
// Dépendances globales attendues (définies dans index.html) :
//   currentActiveWidget, savedSelection
//   snapshotNow(), saveBoard(), createWidget()
//   applyTransparency()  (définie dans widgets.js)
//   stopDrawing(), stopShapeToolbar()  (définies dans draw.js / shapes.js)
// =========================================================================

// =========================================================================
// FORMATAGE TEXTE
// =========================================================================
function format(cmd, val=null) { document.execCommand(cmd, false, val); saveBoard(); }

function formatFontSize(size) {
    const sel = window.getSelection(); if (!sel || sel.rangeCount===0) return;
    document.execCommand("fontSize", false, "7");
    Array.from(document.getElementsByTagName("font")).forEach(f => {
        if (f.size === "7") { f.removeAttribute("size"); f.style.fontSize = size + "px"; }
    });
    saveBoard();
}

function formatFontFamily(font) {
    document.execCommand('fontName', false, font);
    const sel = window.getSelection();
    if (sel.anchorNode) sel.anchorNode.parentElement.style.fontFamily = font;
    saveBoard();
}


function openTextToolbar(widget) {
    currentActiveWidget = widget;
    const tb = document.getElementById('global-toolbar');
    tb.style.display = 'flex';
    syncFontSizeGlobal();
    syncLineHeightGlobal();
    const opacity = parseFloat(widget.dataset.bgOpacity ?? 1);
    const slider = document.getElementById('widget-bg-opacity');
    const label  = document.getElementById('widget-bg-opacity-val');
    if (slider) { slider.value = Math.round(opacity * 100); }
    if (label)  { label.textContent = Math.round(opacity * 100) + '%'; }
    // Synchroniser le swatch fond widget sans déclencher l'action métier
    const bgColor = widget.dataset.bgColor || '#ffffff';
    if (typeof _cpickValues !== 'undefined') {
        _cpickValues['widget-bg'] = bgColor;
        const swatchBg = document.querySelector('#cpick-widget-bg .cpick-swatch');
        if (swatchBg) swatchBg.style.background = bgColor;
    }
    // Synchroniser le bouton animation
    const currentAnim = widget.dataset.animation || 'none';
    const animBtn = document.getElementById('anim-picker-btn');
    if (animBtn) {
        animBtn.innerHTML = (typeof ANIM_LABELS !== 'undefined' ? ANIM_LABELS[currentAnim] : null) || '✨<br>Anim';
        animBtn.style.color = currentAnim !== 'none' ? '#6aaee8' : '';
        animBtn.style.borderColor = currentAnim !== 'none' ? '#6aaee8' : '';
    }
}

// =========================================================================
// BARRE TEXTE GLOBALE
// =========================================================================
let isTextPlacementMode = false;
let _textIgnoreNextBoardClick = false;

const _TEXT_MODE_DISABLED_BTNS = ['draw-free-btn','draw-highlight-btn','eraser-btn','draw-figures-btn','draw-select-btn','pdf-annot-mode-btn'];

function _disableDrawBtns() {
    _TEXT_MODE_DISABLED_BTNS.forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        b.style.opacity = '0.3';
        b.style.pointerEvents = 'none';
        b._textModeDisabled = true;
        // Intercepter le clic pour sortir du mode texte puis déclencher l'action
        b._textModeClickHandler = function(e) {
            e.stopImmediatePropagation();
            closeGlobalToolbar();
            setTimeout(() => b.click(), 10);
        };
        b.addEventListener('click', b._textModeClickHandler, true);
        // Rendre cliquable malgré pointerEvents:none via un overlay
        b.style.pointerEvents = 'auto';
    });
}

function _enableDrawBtns() {
    _TEXT_MODE_DISABLED_BTNS.forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        b.style.opacity = '';
        b.style.pointerEvents = '';
        b._textModeDisabled = false;
        if (b._textModeClickHandler) {
            b.removeEventListener('click', b._textModeClickHandler, true);
            b._textModeClickHandler = null;
        }
    });
}

function toggleGlobalToolbar() {
    const boardEl = document.getElementById('board');
    const btn = document.getElementById('pdf-text-btn');
    if (!isTextPlacementMode) {
        isTextPlacementMode = true;
        // Stopper le mode dessin sans fermer la toolbar
        if (typeof stopDrawing_keepToolbar === 'function') stopDrawing_keepToolbar();
        if (typeof stopEraserMode === 'function') stopEraserMode();
        if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
        // Appliquer curseur texte après clearDrawCursor
        setTimeout(() => { boardEl.style.setProperty('cursor', 'text', 'important'); }, 0);
        // Désactiver les autres boutons
        _disableDrawBtns();
        if (btn) { btn.style.setProperty('background', '#7ab8f5', 'important'); btn.style.setProperty('color', '#000', 'important'); btn.style.setProperty('border-color', '#7ab8f5', 'important'); }
    } else {
        closeGlobalToolbar();
    }
}

function closeGlobalToolbar() {
    document.getElementById('global-toolbar').style.display = 'none';
    const boardEl = document.getElementById('board');
    boardEl.style.removeProperty('cursor');
    isTextPlacementMode = false;
    _enableDrawBtns();
    const btn = document.getElementById('pdf-text-btn');
    if (btn) { btn.style.removeProperty('background'); btn.style.removeProperty('color'); btn.style.removeProperty('border-color'); btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; btn.style.borderColor = '#444'; }
    if (currentActiveWidget) {
        const ed = currentActiveWidget.querySelector('.editor-content');
        if (ed) { ed.contentEditable = 'false'; ed.style.cursor = ''; ed.style.userSelect = 'none'; }
        currentActiveWidget.style.cursor = '';
        currentActiveWidget = null;
    }
}

document.getElementById('board').addEventListener('click', function(e) {
    if (!isTextPlacementMode) {
        if (e.target.id === 'board') {
            const tb = document.getElementById('global-toolbar');
            if (tb && tb.style.display !== 'none') closeGlobalToolbar();
        }
        return;
    }

    // Clic dans un widget → ignorer
    if (e.target.closest('.widget')) return;

    // Clic après blur → ignorer
    if (_textIgnoreNextBoardClick) {
        _textIgnoreNextBoardClick = false;
        return;
    }

    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const widget = createWidget('text', x + 'px', y + 'px');

    // Supprimer la croix de déplacement
    const dragHandle = widget.querySelector('.drag-handle');
    if (dragHandle) dragHandle.remove();

    // Retirer les boutons épingler et envoyer derrière
    const pinHandle = widget.querySelector('.widget-pin-handle');
    if (pinHandle) pinHandle.remove();
    const backHandle = widget.querySelector('.widget-back-handle');
    if (backHandle) backHandle.remove();

    // Ajouter un bouton d'ancrage qui fusionne le texte dans le canvas de dessin
    const actionBar = widget.querySelector('.widget-action-bar');
    if (actionBar) {
        const anchorHandle = document.createElement('div');
        anchorHandle.className = 'widget-anchor-handle';
        anchorHandle.title = 'Ancrer le texte sur le fond (devient un dessin)';
        anchorHandle.textContent = '⚓';
        anchorHandle.style.cursor = 'pointer';
        anchorHandle.onmousedown = function(e) { e.stopPropagation(); e.preventDefault(); };
        anchorHandle.ontouchstart = function(e) { e.stopPropagation(); };
        anchorHandle.onclick = function(e) {
            e.stopPropagation();
            // Récupérer le texte et les styles du widget
            const ed = widget.querySelector('.editor-content');
            if (!ed) return;
            const text = ed.innerText || '';
            if (!text.trim()) { widget.remove(); return; }

            // Coordonnées du contenu dans le board
            const boardEl = document.getElementById('board');
            const boardRect = boardEl.getBoundingClientRect();
            const edRect = ed.getBoundingClientRect();
            const bxCSS = edRect.left - boardRect.left + 10;
            const byCSS = edRect.top  - boardRect.top + 17;

            // Déterminer le ratio canvas/board pour compenser le DPR ou tout autre scale
            // On cherche le canvas de dessin actif (fond PDF ou canvas draw normal)
            let canvasScaleX = 1, canvasScaleY = 1;
            const activeCanvas = boardEl.querySelector('#_bg-annot-canvas')
                              || boardEl.querySelector('canvas.draw-canvas')
                              || boardEl.querySelector('canvas');
            if (activeCanvas) {
                const cssW = activeCanvas.offsetWidth  || boardEl.offsetWidth;
                const cssH = activeCanvas.offsetHeight || boardEl.offsetHeight;
                if (cssW > 0) canvasScaleX = activeCanvas.width  / cssW;
                if (cssH > 0) canvasScaleY = activeCanvas.height / cssH;
            }
            const bx = bxCSS * canvasScaleX;
            const by = byCSS * canvasScaleY;

            // Taille et couleur du texte
            const cs = window.getComputedStyle(ed);
            const fontSizeCSS = parseFloat(cs.fontSize) || 28;
            // Appliquer le même ratio que les coordonnées pour que la taille reste cohérente
            const fontSize = fontSizeCSS * canvasScaleX;
            const color = cs.color || '#111111';
            const fontFamily = cs.fontFamily || "'Segoe UI', sans-serif";

            // Ajouter un stroke par caractère pour permettre l'effacement partiel à la gomme
            if (typeof strokes !== 'undefined' && typeof redrawStrokes === 'function') {
                if (typeof snapshotNow === 'function') snapshotNow();

                // Canvas temporaire pour mesurer les largeurs de caractères
                const measCanvas = document.createElement('canvas');
                const measCtx = measCanvas.getContext('2d');
                measCtx.font = `${fontSize}px ${fontFamily}`;

                // Traiter le texte ligne par ligne (gestion des retours à la ligne)
                const lineHeight = fontSize * 1.3;
                const lines = text.split('\n');

                lines.forEach((line, lineIndex) => {
                    const lineY = by + lineIndex * lineHeight;
                    let cursorX = bx;

                    // Un stroke par caractère sur cette ligne
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        const charWidth = measCtx.measureText(char).width;

                        // Ignorer les espaces (pas de stroke, juste avancer le curseur)
                        if (char !== ' ') {
                            strokes.push({
                                type: 'text',
                                text: char,
                                x: cursorX,
                                y: lineY,
                                size: fontSize,
                                color,
                                fontFamily,
                                points: [{ x: cursorX, y: lineY }, { x: cursorX + charWidth, y: lineY + fontSize }]
                            });
                        }
                        cursorX += charWidth;
                    }
                });

                redrawStrokes();
                if (typeof saveBoard === 'function') saveBoard();
            }
            widget.remove();
        };
        anchorHandle.insertBefore = undefined; // nettoyage
        actionBar.insertBefore(anchorHandle, actionBar.firstChild);
    }

    // Corriger la position : mesurer l'offset réel après rendu
    setTimeout(() => {
        const content2 = widget.querySelector('.editor-content');
        if (content2) {
            const widgetRect  = widget.getBoundingClientRect();
            const contentRect = content2.getBoundingClientRect();
            const boardRect   = document.getElementById('board').getBoundingClientRect();
            const offsetY = contentRect.top  - boardRect.top  - y;
            const offsetX = contentRect.left - boardRect.left - x;
            if (offsetY !== 0) widget.style.top  = (parseFloat(widget.style.top)  - offsetY - 30) + 'px';
            if (offsetX !== 0) widget.style.left = (parseFloat(widget.style.left) - offsetX) + 'px';
        }
    }, 30);

    // Fond transparent automatique
    widget.style.background = 'transparent';
    widget.style.boxShadow  = 'none';
    widget.dataset.bgOpacity = '0';
    widget.dataset.bgColor   = 'transparent';
    const container = widget.querySelector('.editor-container');
    if (container) { container.style.background = 'transparent'; container.style.boxShadow = 'none'; }
    const content = widget.querySelector('.editor-content');
    if (content) {
        content.style.background = 'transparent';
        // Appliquer la couleur courante de la toolbar draw
        const drawColor = window._drawColor
            || (document.querySelector('#cpick-draw-color .cpick-swatch')?.style?.background)
            || '#111111';
        content.style.color = drawColor;
        // Appliquer la taille de texte sélectionnée
        const fontSize = window._textWidgetSize
            || parseInt(document.getElementById('text-size-label')?.textContent) || 24;
        content.style.fontSize = fontSize + 'px';
    }

    // Rester en mode placement
    const self = this;
    setTimeout(() => { self.style.setProperty('cursor', 'text', 'important'); }, 0);
    window._nextTextOpenCreate = false;

    // Au blur : stopper dessin + supprimer si vide + bloquer prochain clic board
    if (content) {
        content.addEventListener('blur', function _onBlur() {
            content.removeEventListener('blur', _onBlur);
            if (typeof stopDrawing_keepToolbar === 'function') stopDrawing_keepToolbar();
            _textIgnoreNextBoardClick = true;
            setTimeout(() => {
                const boardEl = document.getElementById('board');
                if (boardEl && isTextPlacementMode) boardEl.style.setProperty('cursor', 'text', 'important');
                const txt  = content.innerText || '';
                const html = content.innerHTML.replace(/<br\s*\/?>/gi, '').trim();
                if (!txt.trim() && !html) widget.remove();
                setTimeout(() => { _textIgnoreNextBoardClick = false; }, 400);
            }, 50);
        });
    }

    setTimeout(() => {
        if (widget._enterEditMode) widget._enterEditMode();
        openTextToolbar(widget);
        if (content) content.focus();
    }, 20);
    saveBoard();
});

function formatGlobal(cmd, val=null) {
    if (!currentActiveWidget) return;
    if (savedSelection) { const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection); savedSelection=null; }
    document.execCommand(cmd, false, val); saveBoard();
}

function formatFontSizeGlobal(size) {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;

    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    // ── Approche : appliquer fontSize sur TOUS les éléments de l'éditeur
    // qui sont (au moins partiellement) dans la sélection
    const range = sel.getRangeAt(0);

    // Cas simple : toute la sélection est dans un seul nœud texte
    // → on le wrappe dans un span
    if (range.commonAncestorContainer.nodeType === 3) {
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        range.surroundContents(span);
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedSelection = newRange.cloneRange();
        saveBoard();
        return;
    }

    // Cas général : sélection multi-éléments
    // On applique directement fontSize sur tous les descendants de l'ancêtre commun
    // qui intersectent la sélection
    const ancestor = range.commonAncestorContainer;
    const allElements = ancestor.querySelectorAll ? 
        [...ancestor.querySelectorAll('*')] : [];
    
    // Aussi traiter l'ancêtre lui-même si c'est un élément
    if (ancestor.nodeType === 1) allElements.unshift(ancestor);

    allElements.forEach(el => {
        if (range.intersectsNode(el)) {
            el.style.fontSize = size + 'px';
        }
    });

    // Traiter les nœuds texte nus directement dans l'ancêtre
    [...ancestor.childNodes].forEach(node => {
        if (node.nodeType === 3 && node.textContent.trim() && range.intersectsNode(node)) {
            const span = document.createElement('span');
            span.style.fontSize = size + 'px';
            node.parentNode.insertBefore(span, node);
            span.appendChild(node);
        }
    });

    // Maintenir la sélection
    try {
        const newRange = document.createRange();
        newRange.setStart(range.startContainer, range.startOffset);
        newRange.setEnd(range.endContainer, range.endOffset);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedSelection = newRange.cloneRange();
    } catch(e) {}

    saveBoard();
}

function adjustFontSize(delta) {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;

    // Restaurer la sélection sauvegardée (onmousedown du bouton)
    if (savedSelection) {
        try { const s = window.getSelection(); s.removeAllRanges(); s.addRange(savedSelection); } catch(e) {}
    }

    // Si toujours pas de sélection → sélectionner tout le contenu de l'éditeur
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.removeAllRanges();
        sel.addRange(range);
        savedSelection = range.cloneRange();
    }

    // Lire la taille courante depuis le nœud ancre
    let currentSize = 40;
    if (sel.anchorNode) {
        const el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
        if (el) currentSize = parseInt(window.getComputedStyle(el).fontSize) || 40;
    }
    const newSize = Math.max(8, Math.min(200, currentSize + delta));
    formatFontSizeGlobal(newSize);
    const label = document.getElementById('font-size-label');
    if (label) label.textContent = newSize + 'px';
}

function saveCurrentSelection() {
    const sel = window.getSelection();
    return (sel && sel.rangeCount>0) ? sel.getRangeAt(0).cloneRange() : null;
}

function formatFontFamilyGlobal(font) {
    if (!currentActiveWidget) return;
    document.execCommand('fontName', false, font);
    const sel = window.getSelection();
    if (sel.anchorNode) sel.anchorNode.parentElement.style.fontFamily = font;
    saveBoard();
}

function toggleBgOpacityGlobal() {
    if (!currentActiveWidget) return;
    snapshotNow();
    const current = parseFloat(currentActiveWidget.dataset.bgOpacity ?? 1);
    const newOpacity = current > 0 ? 0 : 1;
    currentActiveWidget.dataset.bgOpacity = newOpacity;
    applyWidgetBgOpacity(Math.round(newOpacity * 100));
}

function changeWidgetBgGlobal(input, color) {
    if (!currentActiveWidget) return;
    snapshotNow();
    currentActiveWidget.dataset.bgColor = color;
    applyTransparency(currentActiveWidget, false);
    // Garder _cpickValues en sync pour que le swatch reste à jour
    if (typeof _cpickValues !== 'undefined') _cpickValues['widget-bg'] = color;
    saveBoard();
}



function applyTextColor(color) {
    if (!currentActiveWidget) return;
    if (savedSelection) { const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection); savedSelection=null; }
    document.execCommand('foreColor', false, color); saveBoard();
}

function applyHighlightColor(color) {
    if (!currentActiveWidget) return;
    if (savedSelection) { const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection); savedSelection=null; }
    document.execCommand('backColor', false, color); saveBoard();
}

function syncFontSizeGlobal() {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;
    const el = editor.querySelector('[style*="font-size"]') || editor.firstElementChild || editor;
    const size = parseInt(window.getComputedStyle(el).fontSize) || 40;
    const label = document.getElementById('font-size-label');
    if (label) label.textContent = size + 'px';
}

function syncLineHeightGlobal() {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;
    const lh = parseFloat(editor.style.lineHeight) || 1.2;
    // Mémoriser la valeur de base si pas encore fait (premier réglage)
    if (!editor.dataset.lineHeightBase) {
        editor.dataset.lineHeightBase = lh;
    }
    const label = document.getElementById('line-height-label');
    if (label) label.textContent = lh.toFixed(2);
}

function adjustLineHeight(delta) {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;
    const current = parseFloat(editor.style.lineHeight) || 1.2;
    const next = Math.max(0.5, Math.min(5.0, Math.round((current + delta) * 100) / 100));
    editor.style.lineHeight = next;
    // Compenser le déplacement de la 1ère ligne
    const fontSize = parseFloat(window.getComputedStyle(editor).fontSize) || 40;
    const baseLineHeight = parseFloat(editor.dataset.lineHeightBase) || 1.0;
    const compensation = -((next - baseLineHeight) * fontSize) / 2;
    editor.style.marginTop = compensation.toFixed(2) + 'px';
    const label = document.getElementById('line-height-label');
    if (label) label.textContent = next.toFixed(2);
    saveBoard();
}

// Clic long sur les boutons interligne
var _lhRepeatTimer = null;
var _lhRepeatInterval = null;

function startLHRepeat(delta) {
    adjustLineHeight(delta);
    _lhRepeatTimer = setTimeout(() => {
        _lhRepeatInterval = setInterval(() => adjustLineHeight(delta), 80);
    }, 400);
}

function stopLHRepeat() {
    clearTimeout(_lhRepeatTimer);
    clearInterval(_lhRepeatInterval);
    _lhRepeatTimer = null;
    _lhRepeatInterval = null;
}

function applyFontSizeOnBlur(input) {
    const size = parseInt(input.value);
    if (isNaN(size) || size < 8) { input.value = 8; return; }
    if (size > 100) { input.value = 100; return; }
    // savedSelection est déjà restauré dans formatFontSizeGlobal
    formatFontSizeGlobal(size);
}

document.addEventListener('click', (e) => {
    // Clic simple : fermer la toolbar si on clique en dehors, mais ne pas l'ouvrir
    const widget = e.target.closest('.widget');
    const isTextOrHomework = widget && (widget.dataset.type==='text' || widget.dataset.type==='homework');
    if (!e.target.closest('#global-toolbar') && !e.target.closest('#toolbar-toggle-btn') && !isTextOrHomework) {
        if (currentActiveWidget) { currentActiveWidget=null; document.getElementById('global-toolbar').style.display='none'; }
    }
});

document.addEventListener('dblclick', (e) => {
    // Double-clic sur widget texte : ouvrir la toolbar
    const widget = e.target.closest('.widget');
    const isTextOrHomework = widget && (widget.dataset.type==='text' || widget.dataset.type==='homework');
    if (isTextOrHomework) { currentActiveWidget=widget; document.getElementById('global-toolbar').style.display='flex'; syncFontSizeGlobal(); syncLineHeightGlobal(); }
});

// =========================================================================
// ANIMATIONS WIDGET TEXTE
// =========================================================================
const ANIM_CLASSES = ['anim-blink','anim-bounce','anim-swing','anim-pendulum','anim-fade','anim-shimmer','anim-zoompulse'];

// ── Timers JS pour les animations qui nécessitent de forcer les styles inline ──
const _animTimers = new WeakMap();

function _animStopJS(widget) {
    const id = _animTimers.get(widget);
    if (id) clearTimeout(id);
    _animTimers.delete(widget);
    // Nettoyer les styles forcés
    const editor = widget.querySelector('.editor-content');
    if (editor) {
        editor.style.removeProperty('color');
        editor.querySelectorAll('*').forEach(el => el.style.removeProperty('color'));
        // Nettoyer les spans de vague/scintillement
        if (editor.dataset.waveWrapped || editor.dataset.twinkleWrapped) {
            editor.innerHTML = editor.dataset.originalHtml || editor.innerHTML;
            delete editor.dataset.waveWrapped;
            delete editor.dataset.twinkleWrapped;
            delete editor.dataset.originalHtml;
        }
    }
}

// ── Arc-en-ciel ──
const RAINBOW_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
function _rainbowStart(widget) {
    if (_animTimers.has(widget)) return;
    let step = 0;
    const editor = widget.querySelector('.editor-content');
    if (!editor) return;
    function tick() {
        const color = RAINBOW_COLORS[step % RAINBOW_COLORS.length];
        editor.style.setProperty('color', color, 'important');
        editor.querySelectorAll('*').forEach(el => el.style.setProperty('color', color, 'important'));
        step++;
        _animTimers.set(widget, setTimeout(tick, 220));
    }
    tick();
}

// ── Chaud/Froid ──
const HEATCOLD_COLORS = ['#e74c3c','#e67e22','#e8a020','#3498db','#2980b9','#1a6aa8'];
function _heatcoldStart(widget) {
    if (_animTimers.has(widget)) return;
    let step = 0;
    const editor = widget.querySelector('.editor-content');
    if (!editor) return;
    function tick() {
        const color = HEATCOLD_COLORS[step % HEATCOLD_COLORS.length];
        editor.style.setProperty('color', color, 'important');
        editor.querySelectorAll('*').forEach(el => el.style.setProperty('color', color, 'important'));
        step++;
        _animTimers.set(widget, setTimeout(tick, 400));
    }
    tick();
}

// ── Vague (wave) : chaque lettre animée en décalé ──
function _waveStart(widget) {
    const editor = widget.querySelector('.editor-content');
    if (!editor || editor.dataset.waveWrapped) return;
    editor.dataset.originalHtml = editor.innerHTML;
    editor.dataset.waveWrapped = '1';
    // Découper en spans lettre par lettre
    const text = editor.innerText;
    const style = document.createElement('style');
    style.id = 'wave-style-' + widget.dataset.id;
    let css = '';
    editor.innerHTML = '';
    [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'wave-letter';
        span.style.cssText = `display:inline-block;animation:anim-wave 1s ease-in-out ${(i * 0.08).toFixed(2)}s infinite`;
        span.textContent = ch === ' ' ? '\u00a0' : ch;
        editor.appendChild(span);
        css += `@keyframes anim-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`;
    });
    if (!document.getElementById('wave-style-' + widget.dataset.id)) {
        style.textContent = css;
        document.head.appendChild(style);
    }
    _animTimers.set(widget, 1); // marquer comme actif
}

function _waveStop(widget) {
    const editor = widget.querySelector('.editor-content');
    if (editor && editor.dataset.waveWrapped) {
        editor.innerHTML = editor.dataset.originalHtml || '';
        delete editor.dataset.waveWrapped;
        delete editor.dataset.originalHtml;
    }
    const styleEl = document.getElementById('wave-style-' + widget.dataset.id);
    if (styleEl) styleEl.remove();
    _animTimers.delete(widget);
}

// ── Scintillement : lettres aléatoires changent d'opacité ──
function _twinkleStart(widget) {
    const editor = widget.querySelector('.editor-content');
    if (!editor || editor.dataset.twinkleWrapped) return;
    editor.dataset.originalHtml = editor.innerHTML;
    editor.dataset.twinkleWrapped = '1';
    const text = editor.innerText;
    editor.innerHTML = '';
    [...text].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'twinkle-letter';
        span.style.display = 'inline-block';
        span.textContent = ch === ' ' ? '\u00a0' : ch;
        editor.appendChild(span);
    });
    function flicker() {
        editor.querySelectorAll('.twinkle-letter').forEach(s => {
            s.style.opacity = (Math.random() > 0.15) ? '1' : (Math.random() * 0.3).toFixed(2);
        });
        _animTimers.set(widget, setTimeout(flicker, 150));
    }
    flicker();
}

function _twinkleStop(widget) {
    const id = _animTimers.get(widget);
    if (id && id !== 1) clearTimeout(id);
    _animTimers.delete(widget);
    const editor = widget.querySelector('.editor-content');
    if (editor && editor.dataset.twinkleWrapped) {
        editor.innerHTML = editor.dataset.originalHtml || '';
        delete editor.dataset.twinkleWrapped;
        delete editor.dataset.originalHtml;
    }
}

// ── Feu : dégradé rouge/orange/jaune animé sur le texte ──
function _fireStart(widget) {
    if (_animTimers.has(widget)) return;
    const FIRE = [
        ['#ff0000','#ff4400','#ff8800'],
        ['#ff2200','#ff6600','#ffaa00'],
        ['#ff4400','#ff8800','#ffcc00'],
        ['#ff6600','#ffaa00','#ffee00'],
        ['#ff4400','#ff7700','#ffbb00'],
        ['#ff1100','#ff5500','#ff9900'],
    ];
    let step = 0;
    const editor = widget.querySelector('.editor-content');
    if (!editor) return;
    function tick() {
        const [c1, c2, c3] = FIRE[step % FIRE.length];
        const grad = `linear-gradient(to top, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
        editor.style.setProperty('background', grad, 'important');
        editor.style.setProperty('-webkit-background-clip', 'text', 'important');
        editor.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
        editor.style.setProperty('background-clip', 'text', 'important');
        editor.querySelectorAll('*').forEach(el => {
            el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
            el.style.setProperty('color', 'transparent', 'important');
        });
        step++;
        _animTimers.set(widget, setTimeout(tick, 120));
    }
    tick();
}

function _fireStop(widget) {
    const id = _animTimers.get(widget);
    if (id) clearTimeout(id);
    _animTimers.delete(widget);
    const editor = widget.querySelector('.editor-content');
    if (editor) {
        editor.style.removeProperty('background');
        editor.style.removeProperty('-webkit-background-clip');
        editor.style.removeProperty('-webkit-text-fill-color');
        editor.style.removeProperty('background-clip');
        editor.querySelectorAll('*').forEach(el => {
            el.style.removeProperty('-webkit-text-fill-color');
            el.style.removeProperty('color');
        });
    }
}

// ── Machine à sous : chaque lettre défile verticalement avant stabilisation ──
function _slotsStart(widget) {
    const editor = widget.querySelector('.editor-content');
    if (!editor || editor.dataset.slotsWrapped) return;
    editor.dataset.originalHtml = editor.innerHTML;
    editor.dataset.slotsWrapped = '1';
    const text = editor.innerText;
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?*#@';

    editor.innerHTML = '';
    const spans = [];
    [...text].forEach(ch => {
        const span = document.createElement('span');
        span.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:middle;';
        span.dataset.target = ch;
        editor.appendChild(span);
        spans.push(span);
    });

    function runSlot(span, delay) {
        const target = span.dataset.target;
        if (target === ' ' || target === '\u00a0') { span.textContent = '\u00a0'; return; }
        let count = 0;
        const maxSteps = 10 + Math.floor(Math.random() * 8);
        function step() {
            if (count < maxSteps) {
                span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
                count++;
                setTimeout(step, 60);
            } else {
                span.textContent = target;
            }
        }
        setTimeout(step, delay);
    }

    function runCycle() {
        spans.forEach((span, i) => runSlot(span, i * 80));
        const totalDelay = spans.length * 80 + 18 * 60 + 800;
        _animTimers.set(widget, setTimeout(runCycle, totalDelay));
    }
    runCycle();
}

function _slotsStop(widget) {
    const id = _animTimers.get(widget);
    if (id && id !== 1) clearTimeout(id);
    _animTimers.delete(widget);
    const editor = widget.querySelector('.editor-content');
    if (editor && editor.dataset.slotsWrapped) {
        editor.innerHTML = editor.dataset.originalHtml || '';
        delete editor.dataset.slotsWrapped;
        delete editor.dataset.originalHtml;
    }
}

// ── Pluie : les lettres tombent depuis le haut une par une en boucle ──
function _rainStart(widget) {
    const editor = widget.querySelector('.editor-content');
    if (!editor || editor.dataset.rainWrapped) return;
    editor.dataset.originalHtml = editor.innerHTML;
    editor.dataset.rainWrapped = '1';
    const text = editor.innerText;

    editor.innerHTML = '';
    const spans = [];
    [...text].forEach(ch => {
        const span = document.createElement('span');
        span.style.cssText = 'display:inline-block;opacity:0;transform:translateY(-20px);transition:none;';
        span.textContent = ch === ' ' ? '\u00a0' : ch;
        editor.appendChild(span);
        spans.push(span);
    });

    function runRain() {
        // Reset toutes les lettres
        spans.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(-20px)'; s.style.transition = 'none'; });
        // Faire tomber une par une
        spans.forEach((span, i) => {
            setTimeout(() => {
                span.style.transition = 'opacity 0.2s ease, transform 0.3s ease';
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            }, i * 80);
        });
        const totalDelay = spans.length * 80 + 400 + 800;
        _animTimers.set(widget, setTimeout(runRain, totalDelay));
    }
    runRain();
}

function _rainStop(widget) {
    const id = _animTimers.get(widget);
    if (id && id !== 1) clearTimeout(id);
    _animTimers.delete(widget);
    const editor = widget.querySelector('.editor-content');
    if (editor && editor.dataset.rainWrapped) {
        editor.innerHTML = editor.dataset.originalHtml || '';
        delete editor.dataset.rainWrapped;
        delete editor.dataset.originalHtml;
    }
}

// ── Typewriter : le texte s'efface puis se retape lettre par lettre en boucle ──
function _typewriterStart(widget) {
    const editor = widget.querySelector('.editor-content');
    if (!editor || editor.dataset.twWrapped) return;
    editor.dataset.originalHtml = editor.innerHTML;
    editor.dataset.twWrapped = '1';
    const fullText = editor.innerText;
    editor.textContent = '';

    function typePhase(i, cb) {
        if (i > fullText.length) { setTimeout(cb, 1000); return; }
        editor.textContent = fullText.slice(0, i);
        _animTimers.set(widget, setTimeout(() => typePhase(i + 1, cb), 80));
    }
    function erasePhase(i, cb) {
        if (i < 0) { setTimeout(cb, 400); return; }
        editor.textContent = fullText.slice(0, i);
        _animTimers.set(widget, setTimeout(() => erasePhase(i - 1, cb), 50));
    }
    function cycle() {
        typePhase(0, () => erasePhase(fullText.length, cycle));
    }
    cycle();
}

function _typewriterStop(widget) {
    const id = _animTimers.get(widget);
    if (id && id !== 1) clearTimeout(id);
    _animTimers.delete(widget);
    const editor = widget.querySelector('.editor-content');
    if (editor && editor.dataset.twWrapped) {
        editor.innerHTML = editor.dataset.originalHtml || '';
        delete editor.dataset.twWrapped;
        delete editor.dataset.originalHtml;
    }
}

// ── Stop toutes animations JS ──
function _stopAllAnimJS(widget) {
    const anim = widget.dataset.animation;
    if (anim === 'rainbow') {
        const id = _animTimers.get(widget);
        if (id) clearTimeout(id);
        _animTimers.delete(widget);
        const editor = widget.querySelector('.editor-content');
        if (editor) {
            editor.style.removeProperty('color');
            editor.querySelectorAll('*').forEach(el => el.style.removeProperty('color'));
        }
    } else if (anim === 'fire')       { _fireStop(widget); }
    else if (anim === 'wave')         { _waveStop(widget); }
    else if (anim === 'twinkle')      { _twinkleStop(widget); }
    else if (anim === 'rain')         { _rainStop(widget); }
    else if (anim === 'typewriter')   { _typewriterStop(widget); }
}

// ── Labels pour le bouton toolbar ──
const ANIM_LABELS = {
    none:'✨<br>Anim', blink:'💡<br>Anim', bounce:'🏀<br>Anim',
    swing:'🎵<br>Anim', pendulum:'🎪<br>Anim', fade:'🌫️<br>Anim',
    shimmer:'🔦<br>Anim', twinkle:'✨<br>Anim', wave:'🌊<br>Anim', zoompulse:'🎯<br>Anim',
    rainbow:'🌈<br>Anim', fire:'🔥<br>Anim',
    rain:'🌧️<br>Anim', typewriter:'🎭<br>Anim'
};

function toggleAnimPicker(btn) {
    const pop = document.getElementById('anim-picker-pop');
    if (!pop) return;
    const isOpen = pop.classList.contains('open');
    document.querySelectorAll('.cpick-popup.open').forEach(p => p.classList.remove('open'));
    if (isOpen) { pop.classList.remove('open'); return; }

    pop.classList.add('open');
    requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();
        let top = rect.top - pop.offsetHeight - 8;
        let left = rect.left;
        if (top < 8) top = rect.bottom + 8;
        if (left + pop.offsetWidth > window.innerWidth - 8) left = window.innerWidth - pop.offsetWidth - 8;
        pop.style.top  = top + 'px';
        pop.style.left = left + 'px';
    });

    const current = currentActiveWidget ? (currentActiveWidget.dataset.animation || 'none') : 'none';
    pop.querySelectorAll('button').forEach(b => {
        const animName = b.onclick?.toString().match(/'([^']+)'/)?.[1];
        b.classList.toggle('active-anim', animName === current);
    });
}

function applyWidgetAnimation(name) {
    if (!currentActiveWidget) return;
    snapshotNow();

    // Stopper toutes les animations JS en cours
    _stopAllAnimJS(currentActiveWidget);

    // Retirer toutes les classes CSS d'animation
    ANIM_CLASSES.forEach(c => currentActiveWidget.classList.remove(c));

    if (name && name !== 'none') {
        currentActiveWidget.dataset.animation = name;
        // Animations CSS pures
        if (['blink','bounce','swing','pendulum','fade','shimmer','zoompulse'].includes(name)) {
            currentActiveWidget.classList.add('anim-' + name);
        }
        // Animations JS
        else if (name === 'rainbow')    _rainbowStart(currentActiveWidget);
        else if (name === 'fire')       _fireStart(currentActiveWidget);
        else if (name === 'wave')       _waveStart(currentActiveWidget);
        else if (name === 'twinkle')    _twinkleStart(currentActiveWidget);
        else if (name === 'rain')       _rainStart(currentActiveWidget);
        else if (name === 'typewriter') _typewriterStart(currentActiveWidget);
    } else {
        delete currentActiveWidget.dataset.animation;
    }

    // Mettre à jour le picker
    const pop = document.getElementById('anim-picker-pop');
    if (pop) pop.querySelectorAll('button').forEach(b => {
        const animName = b.onclick?.toString().match(/'([^']+)'/)?.[1];
        b.classList.toggle('active-anim', animName === (name || 'none'));
    });

    // Mettre à jour le bouton toolbar
    const animBtn = document.getElementById('anim-picker-btn');
    if (animBtn) {
        animBtn.innerHTML = ANIM_LABELS[name] || '✨<br>Anim';
        animBtn.style.color = (name && name !== 'none') ? '#6aaee8' : '';
        animBtn.style.borderColor = (name && name !== 'none') ? '#6aaee8' : '';
    }

    saveBoard();
}

// Fermer le picker anim si on clique en dehors
document.addEventListener('mousedown', (e) => {
    const pop = document.getElementById('anim-picker-pop');
    if (pop && pop.classList.contains('open') &&
        !e.target.closest('#anim-picker-pop') &&
        !e.target.closest('#anim-picker-btn')) {
        pop.classList.remove('open');
    }
});

// =========================================================================
// TOUCHE ENTRÉE → <br> simple (pas de nouveau paragraphe)
// =========================================================================
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const editor = e.target.closest('.editor-content');
    if (!editor) return;
    e.preventDefault();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const br = document.createElement('br');
    range.insertNode(br);
    // Si le <br> est en fin de contenu, ajouter un second <br> pour que
    // le curseur puisse se positionner sur la ligne suivante
    if (!br.nextSibling || (br.nextSibling.nodeType === 3 && br.nextSibling.textContent === '')) {
        const br2 = document.createElement('br');
        br.parentNode.insertBefore(br2, br.nextSibling);
    }
    // Placer le curseur après le premier <br>
    const after = document.createRange();
    after.setStartAfter(br);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    saveBoard();
});
