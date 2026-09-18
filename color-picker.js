// =========================================================================
// COLOR PICKER CUSTOM — Le Bureau du Prof
// Mini sélecteur de couleur réutilisable (grille + hex + native)
//
// Dépendances globales attendues (définies dans index.html / toolbar-text.js) :
//   savedSelection, currentActiveWidget
//   applyTextColor(), applyHighlightColor(), changeWidgetBgGlobal()
//
// Usage HTML :
//   <div class="cpick-wrap" id="cpick-MON_ID">
//     <div class="cpick-swatch" style="background:#fff;" onclick="cpickOpen('MON_ID', this)"></div>
//     <div class="cpick-popup" id="cpick-pop-MON_ID"></div>
//   </div>
//
// Fermeture : gérée dans le listener mousedown principal de index.html
//   → document.querySelectorAll('.cpick-popup.open').forEach(p => p.classList.remove('open'))
// =========================================================================

const CPICK_COLORS = [
    // neutres      rouge       orange      jaune       vert        bleu        violet
    '#000000', '#4a0000', '#4a1a00', '#4a4000', '#003a00', '#00204a', '#2d004a',
    '#333333', '#7f0000', '#7a3300', '#6b6000', '#005200', '#003580', '#4b0082',
    '#666666', '#c0392b', '#c0590a', '#c09000', '#1a7a1a', '#1a56b0', '#6a1aad',
    '#999999', '#e74c3c', '#e67e22', '#e6c000', '#27ae60', '#2980b9', '#8e44ad',
    '#bbbbbb', '#f08080', '#f0a060', '#f0d060', '#6abf6a', '#6aaee8', '#b06ad4',
    '#ffffff', '#ffd5d5', '#ffe5cc', '#fff5cc', '#ccffcc', '#cce5ff', '#eeccff',
];

// État courant par picker id
const _cpickValues = {};

// Valeurs par défaut pour certains pickers
_cpickValues['fig-fill-color'] = '#ffffff';

function cpickInit(id, initialValue) {
    _cpickValues[id] = initialValue || '#000000';
    const pop = document.getElementById('cpick-pop-' + id);
    if (!pop || pop.dataset.built) return;
    pop.dataset.built = '1';

    // Grille de couleurs
    const grid = document.createElement('div');
    grid.className = 'cpick-grid';
    CPICK_COLORS.forEach(c => {
        const cell = document.createElement('div');
        cell.className = 'cpick-color';
        cell.style.background = c;
        cell.dataset.color = c;
        cell.title = c;
        cell.onclick = () => cpickSet(id, c);
        grid.appendChild(cell);
    });
    pop.appendChild(grid);

    // Ligne hex + native
    const row = document.createElement('div');
    row.className = 'cpick-hex-row';

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'cpick-hex';
    hexInput.id = 'cpick-hex-' + id;
    hexInput.value = initialValue || '#000000';
    hexInput.maxLength = 7;
    hexInput.oninput = () => {
        const v = hexInput.value;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) cpickSet(id, v, false);
    };

    const native = document.createElement('input');
    native.type = 'color';
    native.className = 'cpick-native';
    native.id = 'cpick-native-' + id;
    native.value = initialValue || '#000000';
    native.title = 'Choisir une couleur personnalisée';
    native.oninput = () => cpickSet(id, native.value);

    row.appendChild(hexInput);
    row.appendChild(native);
    pop.appendChild(row);
}

function cpickOpen(id, swatchEl) {
    // Initialiser si pas encore fait
    const initialColor = swatchEl.style.background || '#000000';
    cpickInit(id, _cpickValues[id] || initialColor);

    const pop = document.getElementById('cpick-pop-' + id);
    if (!pop) return;

    // Fermer tous les autres
    document.querySelectorAll('.cpick-popup.open').forEach(p => {
        if (p !== pop) p.classList.remove('open');
    });

    if (pop.classList.contains('open')) {
        pop.classList.remove('open');
        return;
    }

    // Restaurer la sélection texte AVANT d'afficher (pour qu'elle reste visible)
    if ((id === 'text-color' || id === 'highlight-color') && savedSelection) {
        try {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        } catch(e) {}
    }

    // Afficher d'abord pour avoir les vraies dimensions
    pop.classList.add('open');

    // Positionner après rendu (hauteur réelle disponible)
    requestAnimationFrame(() => {
        const rect = swatchEl.getBoundingClientRect();
        let top  = rect.top - pop.offsetHeight - 8;
        let left = rect.left;

        if (top < 8) top = rect.bottom + 8;
        if (left + 198 > window.innerWidth - 8) left = window.innerWidth - 206;
        if (left < 8) left = 8;

        pop.style.top  = top + 'px';
        pop.style.left = left + 'px';
    });

    // Mettre à jour la sélection courante dans la grille
    pop.querySelectorAll('.cpick-color').forEach(c => {
        c.classList.toggle('selected', c.dataset.color.toLowerCase() === (_cpickValues[id] || '').toLowerCase());
    });
    const hexEl = document.getElementById('cpick-hex-' + id);
    if (hexEl) hexEl.value = _cpickValues[id] || '';
    const nativeEl = document.getElementById('cpick-native-' + id);
    if (nativeEl) nativeEl.value = _cpickValues[id] || '#000000';
}

function cpickSet(id, color, closeAfter = true) {
    _cpickValues[id] = color;

    // Mettre à jour le swatch
    const wrap = document.getElementById('cpick-' + id);
    if (wrap) {
        const swatch = wrap.querySelector('.cpick-swatch');
        if (swatch) swatch.style.background = color;
    }

    // Sync hex & native
    const hexEl = document.getElementById('cpick-hex-' + id);
    if (hexEl) hexEl.value = color;
    const nativeEl = document.getElementById('cpick-native-' + id);
    if (nativeEl) nativeEl.value = color;

    // Mettre à jour la sélection dans la grille
    const pop = document.getElementById('cpick-pop-' + id);
    if (pop) pop.querySelectorAll('.cpick-color').forEach(c =>
        c.classList.toggle('selected', c.dataset.color.toLowerCase() === color.toLowerCase())
    );

    // Déclencher l'action métier selon l'id
    cpickDispatch(id, color);

    if (closeAfter && id !== 'text-color' && id !== 'highlight-color') {
        if (pop) pop.classList.remove('open');
        if (id === 'board-bg') {
            document.querySelectorAll('.cpick-active').forEach(p => p.classList.remove('cpick-active'));
        }
    }
}

function cpickDispatch(id, color) {
    if (id === 'draw-color') {
        window._drawColor = color;
    } else if (id === 'shape-recog-fill') {
        window._shapeRecogFill = color;
    } else if (id === 'shape-stroke-color') {
        window._shapeStrokeColor = color;
        if (typeof applyShapeEdit === 'function') applyShapeEdit();
    } else if (id === 'shape-fill-color') {
        window._shapeFillColor = color;
        if (typeof applyShapeEdit === 'function') applyShapeEdit();
    } else if (id === 'edit-stroke-color') {
        if (typeof applyShapeEdit === 'function') applyShapeEdit();
    } else if (id === 'edit-fill-color') {
        if (typeof applyShapeEdit === 'function') applyShapeEdit();
    } else if (id === 'text-color') {
        if (savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
            // Ne pas remettre à null : on veut pouvoir changer de couleur plusieurs fois
        }
        applyTextColor(color);
    } else if (id === 'highlight-color') {
        if (savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        }
        applyHighlightColor(color);
    } else if (id === 'widget-bg') {
        if (currentActiveWidget) changeWidgetBgGlobal(null, color);
    } else if (id === 'board-bg') {
        applyBackground(color);
        saveBg(color);
    }
}

// Helper pour lire la couleur courante d'un picker
function cpickGetValue(id) {
    return _cpickValues[id] || null;
}
