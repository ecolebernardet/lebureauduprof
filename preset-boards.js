// =========================================================================
// TABLEAUX ENREGISTRÉS EN DUR
// =========================================================================

const PRESET_BOARDS = {

    'tableau-vierge': {
        label:      'Tableau vierge',
        icon:       '🌑',
        background: '#274a61',
        description: 'Fond bleu nuit, aucun widget',

        build() {
            return {
                widgets:  [],
                shapes:   [],
                strokes:  [],
                refWidth: 1920,
                background: '#274a61'
            };
        }
    },

    'seyes-cursif': {
        label:       'Séyès cursif',
        icon:        '✍️',
        background:  'seyes-marge',
        description: 'Fond Séyès avec marge — police Belle Allure taille 37, interligne 1.73',

        build() {
            const refW  = 1920;
            const refVH = 937;
            const leftPx = 261;
            const topPx  = 0;
            const leftPercent     = (leftPx / refW)  * 100;
            const topPercent      = (topPx  / refVH) * 100;
            const widthPercent    = ((refW - leftPx - 20) / refW) * 100;
            const contentHPercent = ((refVH - 80) / refVH) * 100;

            const widget = {
                type:             'text',
                topPercent,
                leftPercent,
                widthPercent,
                contentHPercent,
                html:             '',
                content:          '',
                transparent:      true,
                bgColor:          '#ffffff',
                bgOpacity:        0,
                editorStyle: {
                    fontFamily: "'BelleAllureGS', cursive",
                    fontSizePx: 37,
                    color:      'rgb(30, 30, 30)',
                    lineHeight: 1.73,
                    marginTop:  '12px'
                },
                pinned:    false,
                background: false,
                groupId:   null,
                transform: null,
                animation: null,
            };

            return {
                widgets:  [widget],
                shapes:   [],
                strokes:  [],
                refWidth: refW,
                background: 'seyes-marge'
            };
        },

        editorSetup(editor) {
            editor.style.lineHeight = '1.73';
            editor.style.marginTop  = '12px';
            editor.dataset.lineHeightBase = '1.73';
        }
    }

};

/**
 * Charge un tableau preset dans une nouvelle scène du projet courant.
 * La scène active est conservée, le preset s'ouvre dans un nouvel onglet.
 */
async function loadPresetBoard(key) {
    const preset = PRESET_BOARDS[key];
    if (!preset) return;

    closeMainMenu();

    // Construire le contenu du preset
    const state = preset.build();
    const json  = JSON.stringify(state);

    // Créer une nouvelle scène dans le projet courant (sans copier l'existant)
    if (typeof scenes !== 'undefined' && typeof saveCurrentSceneData === 'function') {
        if (scenes.length >= MAX_SCENES) {
            alert(`Vous avez atteint le nombre maximum de tableaux (${MAX_SCENES}).`);
            return;
        }

        // Sauvegarder l'état de la scène courante avant de partir
        saveCurrentSceneData();

        // Ajouter une nouvelle scène vierge avec le contenu du preset
        scenes.push({
            id:         Date.now(),
            name:       preset.label,
            config:     json,
            background: preset.background
        });
        currentScene = scenes.length - 1;
        saveScenesMeta();
    }

    // Vider le bureau
    document.querySelectorAll('.widget, .shape-widget').forEach(w => w.remove());
    if (typeof strokes !== 'undefined') strokes = [];
    if (typeof drawCtx !== 'undefined' && drawCtx && typeof redrawStrokes === 'function') redrawStrokes();
    if (typeof clearSelection === 'function') clearSelection();
    if (typeof undoStack !== 'undefined') { undoStack = []; redoStack = []; }
    if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns();

    // Appliquer le fond
    if (typeof applyBackground === 'function') applyBackground(preset.background);
    localStorage.setItem('boardBackground', preset.background);

    // Forcer le scale du lignage à 100% si c'est une réglure
    if (typeof RULING_PRESETS !== 'undefined' && RULING_PRESETS.includes(preset.background)) {
        localStorage.setItem('boardBgScale', '1');
        if (typeof applyBgScale === 'function') applyBgScale(1);
        const slider = document.getElementById('bg-scale-slider');
        if (slider) slider.value = 100;
        const scaleLabel = document.getElementById('bg-scale-label');
        if (scaleLabel) scaleLabel.textContent = '100%';
    }

    // Restaurer le contenu du preset
    if (typeof restoreBoardFromJSON === 'function') {
        restoreBoardFromJSON(json);
    }

    // Mettre à jour la barre de scènes
    if (typeof renderScenesBar === 'function') renderScenesBar();

    // Après restauration : styles spécifiques et ouverture en édition
    setTimeout(() => {
        const widget = document.querySelector('.widget[data-type="text"]');
        if (!widget) return;

        const editor = widget.querySelector('.editor-content');
        if (editor) {
            if (preset.editorSetup) preset.editorSetup(editor);

            editor.contentEditable  = 'true';
            editor.style.cursor     = 'text';
            editor.style.userSelect = 'auto';
            widget.style.cursor     = 'auto';

            editor.focus();
            const range = document.createRange();
            range.setStart(editor, 0);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }

        if (typeof openTextToolbar === 'function') openTextToolbar(widget);

    }, 200);
}
