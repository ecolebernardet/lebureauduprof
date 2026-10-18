// =========================================================================
// WIDGET FENÊTRE WEB (iframe)
// =========================================================================
// Modèle HTML du widget (anciennement dans index.html), ajouté au document
// dès le chargement du script pour que createWidget('iframe') le trouve.
document.body.insertAdjacentHTML('beforeend', `
<template id="template-iframe">
    <div class="editor-container" style="height:400px;width:550px;">
        <button class="exit-fs-btn" onclick="document.exitFullscreen()">✖ Quitter Plein Écran</button>
        <div class="editor-toolbar">
            <input type="text" placeholder="Collez l'URL ici..." style="flex-grow:1;" onchange="loadIframe(this)">
            <button onclick="toggleFullScreen(this.closest('.editor-container'))" title="Plein écran navigateur">⛶</button>
            <div class="wf-btns">
                <button class="wf-btn wf-btn-min"   title="Réduire"          onclick="toggleMediaCollapse(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-max"   title="Plein écran board" onclick="toggleMediaBoardFullscreen(this.closest('.editor-container'))"></button>
                <button class="wf-btn wf-btn-close" title="Fermer"            onclick="snapshotNow();this.closest('.widget').remove();saveBoard();"></button>
            </div>
        </div>
        <iframe src="" style="flex-grow:1;border:none;background:white;" allow="microphone;camera;display-capture;autoplay"></iframe>
    </div>
</template>
`);

function loadIframe(input) {
    const iframe = input.closest('.editor-container').querySelector('iframe');
    let url = input.value.trim();
    if (url && !url.startsWith('http')) url = 'https://' + url;
    iframe.src = url; saveBoard();
}
