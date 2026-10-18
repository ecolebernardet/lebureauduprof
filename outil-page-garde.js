// =========================================================================
// WIDGET PAGE DE GARDE — Le Bureau du Prof  v4
// Ouvre une fenêtre flottante (style widget-seyes) contenant page-garde.html
// dans une iframe. Toute la puissance du bureau est disponible à l'intérieur,
// contraint au format A4 portrait.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard(),
//   window._wfMiniBarCollapse
// =========================================================================

(function () {

// ── CSS (injecté une seule fois) ──────────────────────────────────────────
if (!document.getElementById('wpg-v4-style')) {
    const s = document.createElement('style');
    s.id = 'wpg-v4-style';
    s.textContent = `
/* Boutons macOS */
.wpg4-btns { display:flex!important; gap:5px!important; align-items:center!important; flex-shrink:0!important; margin-left:auto!important; }
.wpg4-btn  { width:13px!important; height:13px!important; border-radius:50%!important; border:none!important;
    cursor:pointer!important; display:flex!important; align-items:center!important;
    justify-content:center!important; font-size:0!important; padding:0!important;
    transition:filter .15s, transform .1s!important; flex-shrink:0!important; }
.wpg4-btn:hover  { filter:brightness(0.82)!important; transform:scale(1.15)!important; }
.wpg4-btn:active { transform:scale(0.92)!important; }
.wpg4-btn-min   { background:#febc2e!important; }
.wpg4-btn-max   { background:#28c840!important; }
.wpg4-btn-close { background:#ff5f57!important; }
.wpg4-btns:hover .wpg4-btn::after { font-size:8px!important; font-weight:900!important; color:rgba(0,0,0,0.5)!important; }
.wpg4-btns:hover .wpg4-btn-min::after   { content:'−'!important; }
.wpg4-btns:hover .wpg4-btn-max::after   { content:'⤢'!important; font-size:7px!important; }
.wpg4-btns:hover .wpg4-btn-close::after { content:'×'!important; font-size:10px!important; }

/* Container */
.wpg4-container {
    display:flex!important;
    flex-direction:column!important;
    background:#2a2a3e!important;
    border:1.5px solid #555!important;
    border-radius:6px!important;
    box-shadow:0 4px 28px rgba(0,0,0,0.5)!important;
    overflow:hidden!important;
    box-sizing:border-box!important;
}
.wpg4-container.wpg4-fullboard {
    position:fixed!important; inset:0!important;
    width:100%!important; height:100%!important;
    z-index:9999!important; border-radius:0!important;
}

/* Header */
.wpg4-header {
    display:flex!important;
    flex-direction:row!important;
    align-items:center!important;
    gap:8px!important;
    padding:6px 10px!important;
    background:#2a2a3e!important;
    border-bottom:1px solid #444!important;
    cursor:move!important;
    flex-shrink:0!important;
    min-height:40px!important;
    box-sizing:border-box!important;
}
.wpg4-title {
    font-size:12px!important; font-weight:700!important; color:#ccc!important;
    white-space:nowrap!important; flex-shrink:0!important; pointer-events:none!important;
}
.wpg4-sep {
    width:1px!important; height:18px!important; background:#555!important;
    flex-shrink:0!important; margin:0 4px!important; align-self:center!important;
}

/* iframe */
.wpg4-iframe-wrap {
    flex:1!important;
    position:relative!important;
    overflow:hidden!important;
    min-height:0!important;
}
.wpg4-iframe-wrap iframe {
    width:100%!important;
    height:100%!important;
    border:none!important;
    display:block!important;
}

/* Poignée resize */
.wpg4-resize {
    position:absolute!important; right:0!important; bottom:0!important;
    width:18px!important; height:18px!important; cursor:se-resize!important;
    background:linear-gradient(135deg,transparent 50%,#7a7aaa 50%)!important;
    border-radius:0 0 4px 0!important; z-index:10!important;
    opacity:0.5!important; transition:opacity .2s!important;
}
.wpg4-resize:hover { opacity:1!important; }
    `;
    document.head.appendChild(s);
}

// ── _wfMiniBarCollapse (réutilise si déjà défini) ─────────────────────────
if (!window._wfMiniBarCollapse) {
    window._wfMiniBarCollapse = function(widget, label, opts) {
        const CW = 300, CH = 50, GAP = 10, MT = 8;
        const onExpand = opts && opts.onExpand;
        widget.dataset.wfMiniSavedTop  = widget.style.top;
        widget.dataset.wfMiniSavedLeft = widget.style.left;
        widget.dataset.wfMiniSavedW    = widget.style.width  || '';
        widget.dataset.wfMiniSavedH    = widget.style.height || '';
        const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
            w !== widget && w.querySelector('.wf-mini-bar'));
        const ox = others.reduce((mx, w) => Math.max(mx, w.offsetLeft + CW + GAP), MT);
        Object.assign(widget.style, { top:'8px', left:ox+'px', width:CW+'px', height:CH+'px',
            zIndex:'9000', background:'#2a2a3e', borderRadius:'8px', border:'none', overflow:'hidden', padding:'0' });
        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
            .forEach(el => el.style.display = 'none');
        const miniBar = document.createElement('div');
        miniBar.className = 'wf-mini-bar';
        miniBar.style.cssText = `position:absolute;top:0;left:0;right:0;height:${CH}px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;`;
        const lbl = document.createElement('span');
        lbl.textContent = label;
        lbl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
        const expBtn = document.createElement('button');
        expBtn.textContent = '▲';
        expBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;';
        expBtn.addEventListener('pointerdown', e => e.stopPropagation());
        expBtn.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            widget.style.top    = widget.dataset.wfMiniSavedTop  || widget.style.top;
            widget.style.left   = widget.dataset.wfMiniSavedLeft || widget.style.left;
            widget.style.width  = widget.dataset.wfMiniSavedW    || '';
            widget.style.height = widget.dataset.wfMiniSavedH    || '';
            ['zIndex','background','borderRadius','border','overflow','padding'].forEach(p => widget.style[p] = '');
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                .forEach(el => el.style.display = '');
            miniBar.remove();
            if (onExpand) onExpand();
            if (typeof saveBoard === 'function') saveBoard();
        });
        miniBar.appendChild(lbl); miniBar.appendChild(expBtn); widget.appendChild(miniBar);
        miniBar.addEventListener('pointerdown', e => {
            if (e.target === expBtn || expBtn.contains(e.target)) return;
            e.stopPropagation(); e.preventDefault();
            miniBar.setPointerCapture(e.pointerId);
            const sx = e.clientX - widget.offsetLeft, sy = e.clientY - widget.offsetTop;
            const mv = ev => { widget.style.left = Math.max(0,ev.clientX-sx)+'px'; widget.style.top = Math.max(0,ev.clientY-sy)+'px'; };
            const up = () => { miniBar.removeEventListener('pointermove',mv); miniBar.removeEventListener('pointerup',up); if(typeof saveBoard==='function')saveBoard(); };
            miniBar.addEventListener('pointermove', mv); miniBar.addEventListener('pointerup', up);
        });
        if (typeof saveBoard === 'function') saveBoard();
    };
}

// ── PATCH save/restore pour éviter "Type inconnu" ─────────────────────────
// (géré aussi dans index.html via le script inline final,
//  ce bloc est un fallback si widget-page-garde.js est chargé avant)
(function() {
    function tryPatch() {
        if (typeof restoreBoardFromJSON !== 'function') { setTimeout(tryPatch, 200); return; }
        if (restoreBoardFromJSON._wpg4Patched) return;
        const _orig = restoreBoardFromJSON;
        window.restoreBoardFromJSON = function(json) {
            try {
                const parsed = JSON.parse(json);
                const data   = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                const pgs    = data.filter(w => w.type === 'page-garde');
                if (!pgs.length) return _orig(json);
                const filtered = Array.isArray(parsed)
                    ? parsed.filter(w => w.type !== 'page-garde')
                    : Object.assign({}, parsed, { widgets: data.filter(w => w.type !== 'page-garde') });
                _orig(JSON.stringify(filtered));
                setTimeout(() => {
                    const curW  = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    pgs.forEach(d => {
                        const w = window.createPageGardeWidget();
                        if (!w) return;
                        w.style.left = ((d.leftPercent||0)/100*curW) + 'px';
                        w.style.top  = ((d.topPercent||0)/100*curVH) + 'px';
                        // Restaurer les dimensions du container
                        const c = w.querySelector('.wpg4-container');
                        if (c && d.pgW) c.style.width  = d.pgW + 'px';
                        if (c && d.pgH) c.style.height = d.pgH + 'px';
                    });
                }, 200);
            } catch(e) { _orig(json); }
        };
        window.restoreBoardFromJSON._wpg4Patched = true;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(tryPatch, 100));
    } else {
        setTimeout(tryPatch, 100);
    }
})();

// ─────────────────────────────────────────────────────────────────────────
// createPageGardeWidget
// ─────────────────────────────────────────────────────────────────────────
window.createPageGardeWidget = function() {

    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 60, y: 40 };

    // ── Widget wrapper (standard système) ────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'page-garde';
    widget.dataset.transparent = 'true';
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px;top:${pos.y}px;overflow:visible;flex-direction:row;`;
    widget.tabIndex = 0;
    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle"  onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>`;

    // ── Container ────────────────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'wpg4-container';
    container.style.cssText = 'width:960px;height:720px;';

    // ── Header ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'wpg4-header';

    const title = document.createElement('span');
    title.className = 'wpg4-title';
    title.textContent = '📄 Page de garde';

    const sep = document.createElement('div');
    sep.className = 'wpg4-sep';

    // Hint
    const hint = document.createElement('span');
    hint.style.cssText = 'font-size:10px;color:#666;flex:1;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    hint.textContent = 'Créer des pages de garde pour les cahiers';

    // Boutons macOS
    const btns = document.createElement('div');
    btns.className = 'wpg4-btns';
    const btnMin   = document.createElement('button'); btnMin.className = 'wpg4-btn wpg4-btn-min';   btnMin.title = 'Réduire';
    const btnMax   = document.createElement('button'); btnMax.className = 'wpg4-btn wpg4-btn-max';   btnMax.title = 'Plein écran';
    const btnClose = document.createElement('button'); btnClose.className = 'wpg4-btn wpg4-btn-close'; btnClose.title = 'Fermer';
    btns.append(btnMin, btnMax, btnClose);

    header.append(title, sep, hint, btns);

    // ── iframe ────────────────────────────────────────────────────────────
    const iframeWrap = document.createElement('div');
    iframeWrap.className = 'wpg4-iframe-wrap';

    const iframe = document.createElement('iframe');
    iframe.src = 'page-garde.html';
    iframe.title = 'Page de garde';
    iframe.setAttribute('allowfullscreen', '');
    iframeWrap.appendChild(iframe);

    // ── Poignée resize ────────────────────────────────────────────────────
    const resizeH = document.createElement('div');
    resizeH.className = 'wpg4-resize';
    resizeH.title = 'Redimensionner';

    container.append(header, iframeWrap, resizeH);
    widget.appendChild(container);

    // ─────────────────────────────────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────────────────────────────────

    let _isMax = false;
    [btnMin, btnMax, btnClose].forEach(b => b.addEventListener('mousedown', e => e.stopPropagation()));

    // Plein écran
    btnMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wpg4-fullboard', _isMax);
    });

    // Réduire
    btnMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) btnMax.click();
        const sw = container.offsetWidth+'px', sh = container.offsetHeight+'px';
        widget.style.width = sw; widget.style.height = sh;
        container.style.display = 'none';
        window._wfMiniBarCollapse(widget, '📄 Page de garde', {
            onExpand: () => {
                container.style.display = '';
                container.style.width   = sw;
                container.style.height  = sh;
                widget.style.width      = '';
                widget.style.height     = '';
            }
        });
    });

    // Fermer
    btnClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // Drag header
    header.addEventListener('mousedown', e => {
        if (e.target.closest('.wpg4-btns, .wpg4-btn')) return;
        if (typeof bringToFront === 'function') bringToFront(widget);
    });

    // Focus
    widget.addEventListener('mousedown', () => {
        if (typeof bringToFront === 'function') bringToFront(widget);
    });

    // Resize container — pointer events + setPointerCapture pour ne pas perdre le suivi
    // quand la souris passe sur l'iframe enfant
    resizeH.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        resizeH.setPointerCapture(e.pointerId);
        const sx = e.clientX, sy = e.clientY;
        const sw = container.offsetWidth, sh = container.offsetHeight;
        const onMove = ev => {
            container.style.width  = Math.max(500, sw + ev.clientX - sx) + 'px';
            container.style.height = Math.max(400, sh + ev.clientY - sy) + 'px';
        };
        const onUp = ev => {
            resizeH.releasePointerCapture(ev.pointerId);
            resizeH.removeEventListener('pointermove', onMove);
            resizeH.removeEventListener('pointerup',   onUp);
            resizeH.removeEventListener('pointercancel', onUp);
            if (typeof saveBoard === 'function') saveBoard();
        };
        resizeH.addEventListener('pointermove',   onMove);
        resizeH.addEventListener('pointerup',     onUp);
        resizeH.addEventListener('pointercancel', onUp);
    });
    resizeH.addEventListener('mouseenter', () => resizeH.style.opacity = '1');
    resizeH.addEventListener('mouseleave', () => resizeH.style.opacity = '0.5');

    // Sauvegarder les dimensions du container dans le dataset pour la restauration
    const _saveSize = () => {
        widget.dataset.pgW = container.offsetWidth;
        widget.dataset.pgH = container.offsetHeight;
    };
    document.addEventListener('mouseup', _saveSize);

    // ── Données pour la sauvegarde (dimensions) ───────────────────────────
    // Le contenu de l'iframe est sauvegardé automatiquement dans son propre
    // localStorage (clé "profBoardConfig" de page-garde.html).
    // On sauvegarde uniquement la position et la taille de la fenêtre.

    // ── Insertion dans le board ───────────────────────────────────────────
    const board = document.getElementById('board');
    board.appendChild(widget);
    if (typeof makeDraggable       === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);
    if (typeof bringToFront        === 'function') bringToFront(widget);
    if (typeof saveBoard           === 'function') saveBoard();

    return widget;
};

})();
