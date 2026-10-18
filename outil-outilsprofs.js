// =========================================================================
// WIDGET OUTILSPROFS
// =========================================================================
// Modèle HTML du widget (anciennement dans index.html), ajouté au document
// dès le chargement du script pour que createWidget('outilsprofs') le trouve.
document.body.insertAdjacentHTML('beforeend', `
<template id="template-outilsprofs">
    <div class="editor-container outilsprofs-container" style="height:500px;width:800px;">
        <button class="exit-fs-btn" onclick="document.exitFullscreen()">✖ Quitter Plein Écran</button>
        <div class="editor-toolbar" style="display:flex;align-items:center;gap:6px;justify-content:space-between;">
            <span style="font-size:12px;font-weight:700;color:#555;pointer-events:none;">
                <img src="https://outilsprofs.fr/outilsprofs_icone.png" style="width:14px;height:14px;object-fit:contain;border-radius:3px;vertical-align:middle;margin-right:4px;">OutilsProfs
            </span>
            <div style="display:flex;align-items:center;gap:6px;margin-left:auto;">
                <button onclick="toggleFullScreen(this.closest('.editor-container'))" title="Plein écran navigateur" style="font-size:13px;background:none;border:none;cursor:pointer;padding:2px 5px;border-radius:4px;color:#555;" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='none'">⛶</button>
                <div class="wf-btns">
                    <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleOutilsProfsCollapse(this.closest('.outilsprofs-container'))"></button>
                    <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="(function(c){c.classList.toggle('wf-fullboard');})(this.closest('.outilsprofs-container'))"></button>
                    <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
                </div>
            </div>
        </div>
        <iframe src="https://outilsprofs.fr" style="flex-grow:1;border:none;background:white;" allow="microphone;camera;display-capture;autoplay"></iframe>
    </div>
</template>
`);

// ── Widget OutilsProfs — Réduire / Déplier ────────────────────────────────
function toggleOutilsProfsCollapse(container) {
    if (!container) return;
    const widget = container.closest('.widget');
    if (!widget) return;
    // Lire l'état sur le WIDGET (setAttribute → persisté dans le DOM/saveBoard)
    const isCollapsed = widget.dataset.outilsCollapsed === 'true';

    if (isCollapsed) {
        // ── DÉPLIER ──────────────────────────────────────────────────────
        widget.style.top          = widget.dataset.outilsSavedTop  || widget.style.top;
        widget.style.left         = widget.dataset.outilsSavedLeft || widget.style.left;
        widget.style.width        = '';
        widget.style.height       = '';
        widget.style.zIndex       = '';
        widget.style.background   = '';
        widget.style.borderRadius = '';
        widget.style.border       = '';
        widget.style.display      = '';
        widget.style.overflow     = '';
        widget.style.padding      = '';

        const widgetContent = widget.querySelector('.widget-content');
        if (widgetContent) { widgetContent.style.padding = ''; widgetContent.style.background = ''; widgetContent.style.borderRadius = ''; }

        container.style.width        = widget.dataset.outilsSavedW || '800px';
        container.style.height       = widget.dataset.outilsSavedH || '500px';
        container.style.overflow     = '';
        container.style.borderRadius = '';
        container.style.background   = '';
        container.style.border       = '';
        container.style.padding      = '';
        container.style.margin       = '';

        container.querySelector('.editor-toolbar').style.display = '';
        container.querySelector('iframe').style.display = '';

        // Supprimer la mini-barre
        const miniBar = widget.querySelector('.outilsprofs-mini-bar');
        if (miniBar) miniBar.remove();

        // Restaurer les poignées
        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');

        const curW = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

        widget.dataset.outilsCollapsed = 'false';

    } else {
        // ── PLIER ────────────────────────────────────────────────────────
        // Sauvegarder position et taille sur le WIDGET
        widget.dataset.outilsSavedTop  = widget.style.top;
        widget.dataset.outilsSavedLeft = widget.style.left;
        widget.dataset.outilsSavedW    = container.offsetWidth  + 'px';
        widget.dataset.outilsSavedH    = container.offsetHeight + 'px';

        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;

        const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
            w !== widget && w.querySelector('[data-collapsed="true"]')
        );
        const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

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

        const widgetContent = widget.querySelector('.widget-content');
        if (widgetContent) { widgetContent.style.padding = '0'; widgetContent.style.background = 'transparent'; widgetContent.style.borderRadius = '0'; }

        container.style.width        = COLLAPSED_W + 'px';
        container.style.height       = COLLAPSED_H + 'px';
        container.style.overflow     = 'hidden';
        container.style.borderRadius = '8px';
        container.style.background   = '#2a2a3e';
        container.style.border       = 'none';
        container.style.padding      = '0';
        container.style.margin       = '0';

        container.querySelector('.editor-toolbar').style.display = 'none';
        container.querySelector('iframe').style.display = 'none';

        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');

        // Créer la mini-barre
        const miniBar = document.createElement('div');
        miniBar.className = 'outilsprofs-mini-bar';
        miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

        const iconEl = document.createElement('img');
        iconEl.src = 'https://outilsprofs.fr/outilsprofs_icone.png';
        iconEl.style.cssText = 'width:18px;height:18px;object-fit:contain;border-radius:3px;flex-shrink:0;pointer-events:none;';

        const labelEl = document.createElement('span');
        labelEl.textContent = 'OutilsProfs';
        labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

        const expandBtn = document.createElement('button');
        expandBtn.title = 'Déplier';
        expandBtn.textContent = '▲';
        expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
        expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
        expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleOutilsProfsCollapse(widget.querySelector('.outilsprofs-container'));
        });

        miniBar.appendChild(iconEl);
        miniBar.appendChild(labelEl);
        miniBar.appendChild(expandBtn);
        widget.appendChild(miniBar);

        // Mini-barre draggable (seulement sur la zone hors bouton)
        miniBar.addEventListener('pointerdown', (e) => {
            if (e.target === expandBtn || expandBtn.contains(e.target)) return;
            e.stopPropagation();
            e.preventDefault();
            miniBar.setPointerCapture(e.pointerId);
            const startX = e.clientX - widget.offsetLeft;
            const startY = e.clientY - widget.offsetTop;
            const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
            const onUp   = () => {
                miniBar.removeEventListener('pointermove', onMove);
                miniBar.removeEventListener('pointerup', onUp);
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            miniBar.addEventListener('pointermove', onMove);
            miniBar.addEventListener('pointerup', onUp);
        });

        const curW = window.innerWidth;
        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
        widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

        widget.dataset.outilsCollapsed = 'true';
    }

    if (typeof saveBoard === 'function') saveBoard();
}
