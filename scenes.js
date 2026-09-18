// =========================================================================
// SCÈNES — version simplifiée (1 scène = 1 projet)
// On conserve la structure scenes[] / currentScene pour compatibilité
// avec loadScene() et saveCurrentSceneData() utilisés par projects.js
// =========================================================================

var scenes       = [];  // toujours 1 seul élément : [{ id, name, config, background }]
var currentScene = 0;

function scenesInit() {
    const saved = localStorage.getItem('profScenes');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            scenes       = parsed.scenes       || [];
            currentScene = 0;
        } catch(e) { scenes = []; }
    }
    if (scenes.length === 0) {
        const existing = localStorage.getItem('profBoardConfig');
        const bg       = localStorage.getItem('boardBackground') || 'none';
        scenes.push({ id: Date.now(), name: 'Tableau 1', config: existing || null, background: bg });
        saveScenesMeta();
    }
    // Tronquer à 1 scène si migration incomplète
    if (scenes.length > 1) scenes = [scenes[0]];
    currentScene = 0;
}

function saveScenesMeta() {
    localStorage.setItem('profScenes', JSON.stringify({ scenes, currentScene: 0 }));
}

function saveCurrentSceneData() {
    if (scenes.length === 0) return;
    if (typeof isRestoringState !== 'undefined' && isRestoringState) return;
    scenes[0].config     = buildBoardJSON();
    scenes[0].background = localStorage.getItem('boardBackground') || 'none';
    saveScenesMeta();
}

function loadScene(index) {
    const scene = scenes[0];
    if (!scene) return;
    document.querySelectorAll('.widget').forEach(w => w.remove());
    document.querySelectorAll('.shape-widget').forEach(w => w.remove());
    strokes = []; if (drawCtx) redrawStrokes();
    clearSelection();
    undoStack = []; redoStack = []; updateUndoRedoBtns();
    const bg = scene.background || 'none';
    applyBackground(bg);
    localStorage.setItem('boardBackground', bg);
    if (scene.config) {
        localStorage.setItem('profBoardConfig', scene.config);
        _lastW = window.innerWidth;
        restoreBoardFromJSON(scene.config);
        setTimeout(() => {
            const cur = buildBoardJSON();
            if (cur) { undoStack = [cur]; updateUndoRedoBtns(); }
        }, 1200);
    } else {
        localStorage.removeItem('profBoardConfig');
    }
}

// Stub vide — plus de barre de scènes à afficher
function renderScenesBar() {}

function selectAllText(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
}
