// =========================================================================
// FOND D'ÉCRAN
// =========================================================================

// Injection du CSS des vignettes de prévisualisation
(function () {
    const style = document.createElement('style');
    style.textContent = `
        .bg-thumb { width: 100%; height: 50px; border-radius: 6px; border: 1px solid #999; cursor: pointer; background-size: cover; background-position: center; transition: 0.2s; }
        .bg-thumb:hover { transform: scale(1.05); border-color: var(--primary-color); }
        .bg-thumb-seyes {
            background-color: #fffef5;
            background-image:
                repeating-linear-gradient(to bottom,
                    transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%,
                    transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%,
                    transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%,
                    transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%
                ),
                repeating-linear-gradient(to right, #9aadbe 0px, #9aadbe 1px, transparent 1px, transparent 100%);
            background-size: auto 32px, 32px auto;
        }
        .bg-thumb-seyes-white {
            background-color: #ffffff;
            background-image:
                repeating-linear-gradient(to bottom,
                    transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%,
                    transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%,
                    transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%,
                    transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%
                ),
                repeating-linear-gradient(to right, #9aadbe 0px, #9aadbe 1px, transparent 1px, transparent 100%);
            background-size: auto 32px, 32px auto;
        }
        .bg-thumb-lignes {
            background-color: #fffef5;
            background-image: repeating-linear-gradient(to bottom,
                transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%);
            background-size: auto 16px;
        }
        .bg-thumb-grands {
            background-color: #fffef5;
            background-image:
                repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%),
                repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%);
            background-size: 25px 25px;
        }
        .bg-thumb-petits {
            background-color: #ffffff;
            background-image:
                repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%),
                repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%);
            background-size: 10px 10px;
        }
        .bg-thumb-ardoise-lignes {
            background-color: #2f3542;
            background-image: repeating-linear-gradient(to bottom,
                transparent 0%, transparent calc(100% - 1px), rgba(255,255,255,0.15) calc(100% - 1px), rgba(255,255,255,0.15) 100%);
            background-size: auto 16px;
        }
        .bg-thumb-papier-pointe {
            background-color: #ffffff;
            background-image: radial-gradient(circle, #888 1.5px, transparent 1.5px);
            background-size: 10px 10px;
        }
        .bg-thumb-seyes-marge {
            background-color: #fffef5;
            background-image:
                linear-gradient(to right, transparent 0px, transparent 19px, #e05050 19px, #e05050 21px, transparent 21px),
                repeating-linear-gradient(to bottom,
                    transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%,
                    transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%,
                    transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%,
                    transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%
                ),
                linear-gradient(to right, #fffef5 0px, #fffef5 19px, transparent 19px),
                repeating-linear-gradient(to right, #c8d8eb 0px, #c8d8eb 1px, transparent 1px, transparent 100%);
            background-size: 100% 100%, auto 32px, 100% 100%, 32px auto;
            background-position: top left, top left, top left, 21px top;
        }
    `;
    document.head.appendChild(style);
})();

// Fonds Séyès et carreaux — CSS gradient purs (fiables cross-browser, pas de data URI)

/**
 * Génère un SVG data URI pour une ligne verticale pixel-perfect.
 * La ligne est à x=0.5 dans une tuile de `size`px de large.
 * Évite les artefacts sub-pixel des repeating-linear-gradient.
 */
function _svgVertical(size, color) {
    const s = Math.round(size);
    const c = encodeURIComponent(color);
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${s}' height='1'%3E%3Cline x1='0.5' y1='0' x2='0.5' y2='1' stroke='${c}' stroke-width='1'/%3E%3C/svg%3E")`;
}

const PRESET_BACKGROUNDS = {
    // Séyès jaune paille — stops en % : 3 interlignes (25/50/75%) + 1 grande ligne (100%)
    'seyes': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            _svgVertical(64, '#9aadbe')
        ].join(', '),
        backgroundSize: 'auto 64px, 64px 1px',
    },
    // Séyès clair avec marge
    'seyes-marge': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'linear-gradient(to right, transparent 0px, transparent 254px, #e05050 254px, #e05050 256px, transparent 256px)',
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            'linear-gradient(to right, #fffef5 0px, #fffef5 254px, transparent 254px)',
            _svgVertical(64, '#c8d8eb')
        ].join(', '),
        backgroundSize: '100% 100%, auto 64px, 100% 100%, 64px 1px',
        backgroundPosition: 'top left, top left, top left, 256px top',
    },
    // Séyès blanc
    'seyes-white': {
        backgroundColor: '#ffffff',
        backgroundImage: [
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            _svgVertical(64, '#9aadbe')
        ].join(', '),
        backgroundSize: 'auto 64px, 64px 1px',
    },
    // Grands carreaux
    'grands-carreaux': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%)',
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%)'
        ].join(', '),
        backgroundSize: '40px 40px',
    },
    // Petits carreaux
    'petits-carreaux': {
        backgroundColor: '#ffffff',
        backgroundImage: [
            'repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%)',
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%)'
        ].join(', '),
        backgroundSize: '16px 16px',
    },
    // Lignes simples
    'lignes-simples': {
        backgroundColor: '#fffef5',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%)',
        backgroundSize: 'auto 32px',
    },
    // Ardoise avec lignes blanches
    'ardoise': {
        backgroundColor: '#2f3542',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(255,255,255,0.15) calc(100% - 1px), rgba(255,255,255,0.15) 100%)',
        backgroundSize: 'auto 32px',
    },
    // Papier pointé
    'papier-pointe': {
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #6a8aaa 1px, transparent 1px)',
        backgroundSize: '32px 32px',
    },
};

/**
 * Applique un fond d'écran au tableau.
 * @param {string} value - Clé d'un preset, couleur CSS (#hex / rgb), URL d'image, ou 'none'.
 */
function applyBackground(value) {
    const board = document.getElementById('board');
    if (!board) return;
    if (!value || value === 'none') {
        board.style.backgroundImage = '';
        board.style.backgroundSize  = '';
        board.style.backgroundColor = '#eef2f5';
    } else if (PRESET_BACKGROUNDS[value]) {
        const p = PRESET_BACKGROUNDS[value];
        board.style.backgroundImage    = p.backgroundImage;
        board.style.backgroundSize     = p.backgroundSize || 'auto';
        board.style.backgroundRepeat   = 'repeat';
        board.style.backgroundPosition = 'top left';
        board.style.backgroundColor    = p.backgroundColor || '';
    } else if (value.startsWith('#') || value.startsWith('rgb')) {
        board.style.backgroundImage = '';
        board.style.backgroundSize  = '';
        board.style.backgroundColor = value;
    } else {
        board.style.backgroundImage    = '';
        board.style.backgroundSize     = '';
        board.style.background         = value;
        if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()
            && !document.body.classList.contains('a4-mode')) {
            // Sur téléphone, le board est vertical (portrait) alors que ces
            // images de fond sont pensées pour un tableau large (paysage).
            // 'cover' remplit toute la hauteur du board au lieu de laisser
            // une bande "100% auto" centrée avec du vide au-dessus/dessous.
            board.style.backgroundSize     = 'cover';
            board.style.backgroundPosition = 'center';
        } else {
            board.style.backgroundSize     = '100% auto';
            board.style.backgroundPosition = 'top center';
        }
        board.style.backgroundRepeat   = 'no-repeat';
    }
}

/**
 * Sauvegarde le fond en localStorage (et crée un snapshot undo).
 * @param {string} value
 */
function saveBg(value) {
    snapshotNow();
    localStorage.setItem('boardBackground', value);
}

/**
 * Gère l'import d'une image locale comme fond d'écran.
 * @param {HTMLInputElement} input
 */
function handleBgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const v = `url(${e.target.result})`;
        applyBackground(v);
        saveBg(v);
    };
    reader.readAsDataURL(file);
}

// Compatibilité : ancienne fonction (désormais sans effet, le bg-submenu est intégré dans le menu Affichage)
function toggleSubMenu(event) { /* bg-submenu intégré dans le menu Affichage */ }

// =========================================================================
// ÉCHELLE DES RÉGLURES
// =========================================================================

var _currentBgKey  = null;  // clé du preset actif
var _bgScaleFactor = 1.0;   // facteur d'échelle courant (0.5 → 2.0)

// Liste des presets "réglures" (ceux qui ont un slider d'échelle)
const RULING_PRESETS = ['seyes', 'seyes-white', 'seyes-marge', 'lignes-simples', 'grands-carreaux', 'petits-carreaux', 'ardoise', 'papier-pointe'];

/**
 * Applique le facteur d'échelle en scalant uniquement les px de backgroundSize.
 * Les gradients étant en %, tout le motif se redimensionne proportionnellement.
 */
function applyBgScale(factor) {
    const board = document.getElementById('board');
    if (!board || !_currentBgKey || !PRESET_BACKGROUNDS[_currentBgKey]) return;
    _bgScaleFactor = factor;
    const p = PRESET_BACKGROUNDS[_currentBgKey];

    if (_currentBgKey === 'seyes-marge') {
        // La marge rouge reste toujours à 255px du bord — seules les lignes scalent
        const m = 254; // position fixe
        const sz = (64 * factor).toFixed(1);
        const layers = [
            `linear-gradient(to right, transparent 0px, transparent ${m}px, #e05050 ${m}px, #e05050 ${m+2}px, transparent ${m+2}px)`,
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            `linear-gradient(to right, #fffef5 0px, #fffef5 ${m}px, transparent ${m}px)`,
            _svgVertical(64 * factor, '#c8d8eb')
        ];
        board.style.backgroundImage    = layers.join(', ');
        board.style.backgroundSize     = `100% 100%, auto ${sz}px, 100% 100%, ${sz}px 1px`;
        board.style.backgroundPosition = `top left, top left, top left, ${m+2}px top`;
    } else if (_currentBgKey === 'seyes' || _currentBgKey === 'seyes-white') {
        // Pour seyes et seyes-white : regénérer le SVG vertical avec la bonne taille
        const sz = (64 * factor).toFixed(1);
        const color = _currentBgKey === 'seyes' ? '#9aadbe' : '#9aadbe';
        board.style.backgroundImage = [
            p.backgroundImage.split(', ').slice(0, -1).join(', '),
            _svgVertical(64 * factor, color)
        ].join(', ');
        board.style.backgroundSize  = `auto ${sz}px, ${sz}px 1px`;
    } else {
        // Pour tous les autres presets : scaler uniquement les px dans backgroundSize
        const scaledSize = p.backgroundSize.replace(/([\d.]+)px/g, (_, n) =>
            (parseFloat(n) * factor).toFixed(1) + 'px'
        );
        board.style.backgroundImage = p.backgroundImage;
        board.style.backgroundSize  = scaledSize;
        if (p.backgroundPosition) board.style.backgroundPosition = p.backgroundPosition;
    }

    localStorage.setItem('boardBgScale', factor);
    _updateScaleLabel(factor);
}

function _updateScaleLabel(factor) {
    const lbl = document.getElementById('bg-scale-label');
    if (lbl) lbl.textContent = Math.round(factor * 100) + '%';
}

/**
 * Crée et injecte le panneau flottant de zoom des réglures.
 */
function _initRulingScalePanel() {
    if (document.getElementById('ruling-scale-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'ruling-scale-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 100px;
        z-index: 12000;
        background: rgba(20,20,28,0.35);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0.18;
        transition: opacity 0.25s;
        pointer-events: auto;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    `;
    panel.innerHTML = `
        <span style="font-size:12px;line-height:1; color:#fff;">réglure</span>
        <input type="range" id="bg-scale-slider" min="50" max="250" value="100" step="25"
            style="width:90px;cursor:pointer;accent-color:#7ab8f5;">
        <span id="bg-scale-label" style="color:#fff;font-size:11px;font-weight:600;min-width:34px;text-align:right;">100%</span>
    `;
    panel.addEventListener('mouseenter', () => panel.style.opacity = '1');
    panel.addEventListener('mouseleave', () => panel.style.opacity = '0.18');

    panel.querySelector('#bg-scale-slider').addEventListener('input', function() {
        applyBgScale(parseInt(this.value) / 100);
    });

    document.body.appendChild(panel);
    _updateRulingPanelVisibility();
}

function _updateRulingPanelVisibility() {
    const panel = document.getElementById('ruling-scale-panel');
    if (!panel) return;
    const visible = RULING_PRESETS.includes(_currentBgKey);
    panel.style.display = visible ? 'flex' : 'none';
}

// Patch unique applyBackground : gère réglures ET fond PDF
const _origApplyBackground = applyBackground;
applyBackground = function(value) {
    _origApplyBackground(value);

    // ── Réglures ──
    _currentBgKey = RULING_PRESETS.includes(value) ? value : null;
    if (_currentBgKey) {
        const saved = parseFloat(localStorage.getItem('boardBgScale') || '1');
        _bgScaleFactor = saved;
        const slider = document.getElementById('bg-scale-slider');
        if (slider) slider.value = Math.round(saved * 100);
        applyBgScale(saved);
    }
    _updateRulingPanelVisibility();

    // ── Fond PDF ──
    if (!value || !value.startsWith('url(data:image')) {
        _isPdfWallpaper = false;
        _stopBoardHeightGuard();
        if (typeof _updatePdfWallpaperPanelVisibility === 'function') _updatePdfWallpaperPanelVisibility();
    }
};

// Init au chargement
window.addEventListener('load', () => {
    _initRulingScalePanel();
    _initPdfWallpaperPanel();
    // Restaurer si un preset réglure était actif
    const savedBg = localStorage.getItem('boardBackground');
    if (RULING_PRESETS.includes(savedBg)) {
        _currentBgKey = savedBg;
        const savedScale = parseFloat(localStorage.getItem('boardBgScale') || '1');
        _bgScaleFactor = savedScale;
        const slider = document.getElementById('bg-scale-slider');
        if (slider) slider.value = Math.round(savedScale * 100);
        applyBgScale(savedScale);
        _updateRulingPanelVisibility();
    } else if (!savedBg) {
        // Première ouverture : aucun fond sauvegardé → appliquer le fond par défaut
        const DEFAULT_BG = "url(fonds/fond-lebureauduprof-defaut01.jpeg)";
        applyBackground(DEFAULT_BG);
        localStorage.setItem('boardBackground', DEFAULT_BG);
    }
    // Restaurer le slider PDF si un fond PDF était actif
    if (savedBg && savedBg.startsWith('url(data:image')) {
        _isPdfWallpaper = true;
        const savedW = parseFloat(localStorage.getItem('boardPdfBgWidth') || '100');
        const savedRatio = parseFloat(localStorage.getItem('boardPdfBgRatio'));
        if (savedRatio) window._pdfBgNativeRatio = savedRatio;
        _pdfWallpaperWidth = savedW;

        _applyBoardHeightForPdf();
        setTimeout(() => _applyBoardHeightForPdf(), 100);
        _startBoardHeightGuard();

        // Recalculer la position CSS depuis les pixels absolus sauvegardés
        // (évite le décalage dû au changement de boardH entre sessions)
        const boardEl = document.getElementById('board');
        if (boardEl) {
            const boardW = boardEl.offsetWidth;
            const boardH = boardEl.offsetHeight;
            const imgW   = boardW * savedW / 100;
            const imgH   = imgW * (window._pdfBgNativeRatio || 1);

            const savedOffsetPx = localStorage.getItem('boardPdfBgOffsetPx');
            if (savedOffsetPx) {
                const parts = savedOffsetPx.split(',');
                const offXpx = parseFloat(parts[0]);
                const offYpx = parseFloat(parts[1]);
                // Recalculer les pourcentages CSS pour le board actuel
                const denomX = boardW - imgW;
                const denomY = boardH - imgH;
                _pdfBgPosX = denomX !== 0 ? Math.max(0, Math.min(100, (offXpx / denomX) * 100)) : 50;
                _pdfBgPosY = denomY !== 0 ? Math.max(0, Math.min(100, (offYpx / denomY) * 100)) : 0;
            } else {
                // Fallback : utiliser les pourcentages sauvegardés
                const savedPos = localStorage.getItem('boardPdfBgPos');
                if (savedPos) {
                    const parts = savedPos.split(',');
                    _pdfBgPosX = parseFloat(parts[0]) || 50;
                    _pdfBgPosY = parseFloat(parts[1]) || 0;
                }
            }

            boardEl.style.backgroundSize     = savedW + '% auto';
            boardEl.style.backgroundPosition = _pdfBgPosX + '% ' + _pdfBgPosY + '%';
            boardEl.style.backgroundRepeat   = 'no-repeat';
            boardEl.style.backgroundColor    = '#fff';
        }

        _updatePdfWallpaperPanelVisibility();
        const slider = document.getElementById('pdf-bg-width-slider');
        if (slider) slider.value = savedW;
        const label = document.getElementById('pdf-bg-width-label');
        if (label) label.textContent = Math.round(savedW) + '%';
        // Initialiser style.width/height sur les shape-widgets après restauration
        setTimeout(() => {
            document.querySelectorAll('.shape-widget').forEach(w => {
                if (!w.style.width)  w.style.width  = w.offsetWidth  + 'px';
                if (!w.style.height) w.style.height = w.offsetHeight + 'px';
            });
        }, 500);
    }
});

// =========================================================================
// SLIDER LARGEUR FOND PDF
// =========================================================================

var _isPdfWallpaper    = (function() {
    const savedBg = localStorage.getItem('boardBackground');
    return !!(savedBg && savedBg.startsWith('url(data:image'));
})();
// Initialiser depuis localStorage immédiatement pour que _applyPdfWallpaperWidth
// utilise la bonne valeur de référence dès le premier appel du slider
var _pdfWallpaperWidth = (function() {
    const savedBg = localStorage.getItem('boardBackground');
    if (savedBg && savedBg.startsWith('url(data:image')) {
        const w = parseFloat(localStorage.getItem('boardPdfBgWidth'));
        if (w && !isNaN(w)) return w;
    }
    return 100;
})();
var _pdfBgPosX = (function() {
    const pos = localStorage.getItem('boardPdfBgPos');
    if (pos) { const v = parseFloat(pos.split(',')[0]); if (!isNaN(v)) return v; }
    return 50;
})();
var _pdfBgPosY = (function() {
    const pos = localStorage.getItem('boardPdfBgPos');
    if (pos) { const v = parseFloat(pos.split(',')[1]); if (!isNaN(v)) return v; }
    return 0;
})();
var _pdfPanMode = false;

function _applyBoardHeightForPdf() {
    if (!_isPdfWallpaper) return;
    const bgRatio = window._pdfBgNativeRatio
        || parseFloat(localStorage.getItem('boardPdfBgRatio'));
    if (!bgRatio) return;
    const board = document.getElementById('board');
    if (!board) return;
    const imgW = board.offsetWidth * _pdfWallpaperWidth / 100;
    board.style.height = Math.ceil(imgW * bgRatio) + 'px';
}

var _boardHeightObserver = null;
function _startBoardHeightGuard() {
    if (_boardHeightObserver) return;
    const board = document.getElementById('board');
    if (!board) return;
    _boardHeightObserver = new MutationObserver(function() {
        if (!_isPdfWallpaper) return;
        const bgRatio = window._pdfBgNativeRatio
            || parseFloat(localStorage.getItem('boardPdfBgRatio'));
        if (!bgRatio) return;
        const expected = Math.ceil(board.offsetWidth * _pdfWallpaperWidth / 100 * bgRatio);
        if (Math.abs(parseFloat(board.style.height) - expected) > 2) {
            _boardHeightObserver.disconnect();
            board.style.height = expected + 'px';
            _boardHeightObserver.observe(board, { attributes: true, attributeFilter: ['style'] });
        }
    });
    board.style.position = 'absolute';
    board.style.top = '0';
    _boardHeightObserver.observe(board, { attributes: true, attributeFilter: ['style'] });
    if (typeof updatePresLimitLine === 'function') updatePresLimitLine();
}
function _stopBoardHeightGuard() {
    if (_boardHeightObserver) { _boardHeightObserver.disconnect(); _boardHeightObserver = null; }
    if (typeof updatePresLimitLine === 'function') updatePresLimitLine();
}

if (_isPdfWallpaper) {
    document.addEventListener('DOMContentLoaded', function() {
        _applyBoardHeightForPdf();
        _startBoardHeightGuard();
    });
}

/**
 * Applique la largeur du fond PDF (en %) en conservant la position courante.
 */
function _applyPdfWallpaperWidth(pct) {
    const board = document.getElementById('board');
    if (!board) return;
    const oldW = _pdfWallpaperWidth;
    _pdfWallpaperWidth = pct;
    board.style.backgroundSize     = pct + '% auto';
    board.style.backgroundPosition = _pdfBgPosX + '% ' + _pdfBgPosY + '%';
    localStorage.setItem('boardPdfBgWidth', pct);
    const label = document.getElementById('pdf-bg-width-label');
    if (label) label.textContent = Math.round(pct) + '%';
    // Hauteur board = hauteur image zoomée
    const bgRatio = window._pdfBgNativeRatio
        || parseFloat(localStorage.getItem('boardPdfBgRatio')) || 1;
    const imgW = board.offsetWidth * pct / 100;
    const imgH = Math.ceil(imgW * bgRatio);
    board.style.height = imgH + 'px';
    // Resync canvas annotation
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.getElementById('_bg-annot-canvas');
    if (canvas) {
        const nw = Math.round(board.offsetWidth * dpr);
        const nh = Math.round(imgH * dpr);
        if (canvas.width !== nw || canvas.height !== nh) {
            canvas.width = nw; canvas.height = nh;
            canvas.style.width  = board.offsetWidth + 'px';
            canvas.style.height = imgH + 'px';
            if (window._bgAnnotWidget && window._bgAnnotWidget._pdfAnnotAPI)
                window._bgAnnotWidget._pdfAnnotAPI.redrawAnnotations();
        }
    }
    _savePdfBgOffsetPx(board);
    _rescaleDrawStrokes(oldW, pct, _pdfBgPosX, _pdfBgPosY, _pdfBgPosX, _pdfBgPosY);
}

/**
 * Applique la position du fond PDF.
 */
function _applyPdfBgPosition(x, y) {
    const board = document.getElementById('board');
    if (!board) return;
    const oldX = _pdfBgPosX, oldY = _pdfBgPosY;
    _pdfBgPosX = Math.max(0, Math.min(100, x));
    _pdfBgPosY = Math.max(0, Math.min(100, y));
    board.style.backgroundPosition = _pdfBgPosX + '% ' + _pdfBgPosY + '%';
    localStorage.setItem('boardPdfBgPos', _pdfBgPosX + ',' + _pdfBgPosY);
    _savePdfBgOffsetPx(board);
    _rescaleDrawStrokes(_pdfWallpaperWidth, _pdfWallpaperWidth, oldX, oldY, _pdfBgPosX, _pdfBgPosY);
}

/**
 * Sauvegarde la position du fond en pixels absolus pour un rechargement correct.
 * Les pourcentages CSS dépendent de boardH qui peut changer (mode A4).
 */
function _savePdfBgOffsetPx(board) {
    if (!board) board = document.getElementById('board');
    if (!board) return;
    const boardW = board.offsetWidth;
    const boardH = board.offsetHeight;
    const imgW   = boardW * _pdfWallpaperWidth / 100;
    const bgRatio = window._pdfBgNativeRatio || parseFloat(localStorage.getItem('boardPdfBgRatio')) || 1;
    const imgH   = imgW * bgRatio;
    const offXpx = (boardW - imgW) * (_pdfBgPosX / 100);
    const offYpx = (boardH - imgH) * (_pdfBgPosY / 100);
    localStorage.setItem('boardPdfBgOffsetPx', offXpx + ',' + offYpx);
}

/**
 * Appelle window.rescaleStrokesForPdfBg si un fond PDF est actif.
 */
function _rescaleDrawStrokes(oldW, newW, oldPosX, oldPosY, newPosX, newPosY) {
    if (!_isPdfWallpaper) return;
    const bgRatio = window._pdfBgNativeRatio
        || parseFloat(localStorage.getItem('boardPdfBgRatio'));
    if (!bgRatio) return;
    if (typeof window.rescaleStrokesForPdfBg === 'function') {
        window.rescaleStrokesForPdfBg(oldW, newW, oldPosX, oldPosY, newPosX, newPosY, bgRatio);
    }
}

/**
 * Active / désactive le mode panoramique du fond PDF.
 */
function _togglePdfPanMode() {
    _pdfPanMode = !_pdfPanMode;
    const btn      = document.getElementById('pdf-pan-btn');
    const bgPanBtn = document.getElementById('bg-pan-btn');
    const board    = document.getElementById('board');
    if (_pdfPanMode) {
        // Désactiver le dessin AVANT de setter le flag
        if (typeof isDrawMode !== 'undefined' && isDrawMode) {
            if (typeof toggleSelectMode === 'function') toggleSelectMode();
        } else if (typeof isEraserMode !== 'undefined' && isEraserMode) {
            if (typeof stopEraserMode === 'function') stopEraserMode();
        }
        window._bgPanModeActive = true;
        if (typeof _setBtnActive === 'function') _setBtnActive('draw-select-btn', false);
        if (btn)      { btn.style.background = '#7ab8f5'; btn.style.color = '#000'; btn.title = 'Désactiver le panoramique'; }
        if (bgPanBtn) { bgPanBtn.style.background = '#1a3550'; bgPanBtn.style.borderColor = '#4a90e2'; bgPanBtn.style.color = '#fff'; bgPanBtn.style.boxShadow = '0 0 0 2px #4a90e255'; bgPanBtn.title = 'Désactiver le panoramique'; }
        if (board) board.style.cursor = 'grab';
        _attachPdfPanListeners();
    } else {
        window._bgPanModeActive = false;
        if (btn)      { btn.style.background = 'rgba(255,255,255,0.12)'; btn.style.color = '#fff'; btn.title = 'Déplacer le fond (panoramique)'; }
        if (bgPanBtn) { bgPanBtn.style.background = '#2a2a2e'; bgPanBtn.style.borderColor = '#444'; bgPanBtn.style.color = '#aaa'; bgPanBtn.style.boxShadow = 'none'; bgPanBtn.title = 'Déplacer le fond PDF (panoramique)'; }
        if (board) board.style.cursor = '';
        _detachPdfPanListeners();
        if (typeof activatePencil === 'function') activatePencil();
    }
}

// ── Listeners panoramique ──────────────────────────────────────────────────
var _panDragging = false;
var _panStartX = 0, _panStartY = 0;
var _panStartScrollY = 0;
var _panStartBgPosX = 50;
var _boardTranslateX = 0;

function _panApplyMove(board, dx, dy) {
    // Vertical : scroll natif
    const newY = _panStartScrollY - dy;
    document.body.scrollTop = newY;
    document.documentElement.scrollTop = newY;
    // Horizontal : backgroundPosition (image bouge, annotations restent dans le board)
    const boardW    = board.offsetWidth;
    const imgW      = boardW * _pdfWallpaperWidth / 100;
    const overflowX = imgW - boardW;
    if (overflowX > 0) {
        const startOffX = (_panStartBgPosX / 100) * overflowX;
        const newOffX   = Math.max(0, Math.min(overflowX, startOffX - dx));
        _pdfBgPosX = (newOffX / overflowX) * 100;
    }
    board.style.backgroundPosition = _pdfBgPosX + '% ' + _pdfBgPosY + '%';
}

function _onPanMouseDown(e) {
    if (!_pdfPanMode) return;
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('.widget')) return;
    _panDragging     = true;
    _panStartX       = e.clientX;
    _panStartY       = e.clientY;
    _panStartScrollY = document.body.scrollTop || document.documentElement.scrollTop || 0;
    _panStartBgPosX  = _pdfBgPosX;
    document.getElementById('board').style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
}

function _onPanMouseMove(e) {
    if (!_panDragging) return;
    const board = document.getElementById('board');
    if (!board) return;
    _panApplyMove(board, e.clientX - _panStartX, e.clientY - _panStartY);
}

function _onPanMouseUp() {
    if (!_panDragging) return;
    _panDragging = false;
    const board = document.getElementById('board');
    if (board) board.style.cursor = _pdfPanMode ? 'grab' : '';
    localStorage.setItem('boardPdfBgPos', _pdfBgPosX + ',' + _pdfBgPosY);
    _savePdfBgOffsetPx(board);
}

function _onPanTouchStart(e) {
    if (!_pdfPanMode) return;
    if (e.touches.length !== 1) return;
    if (e.target.closest && e.target.closest('.widget')) return;
    _panDragging     = true;
    _panStartX       = e.touches[0].clientX;
    _panStartY       = e.touches[0].clientY;
    _panStartScrollY = document.body.scrollTop || document.documentElement.scrollTop || 0;
    _panStartBgPosX  = _pdfBgPosX;
    const board = document.getElementById('board');
    if (board) board.style.cursor = 'grabbing';
    e.preventDefault();
}

function _onPanTouchMove(e) {
    if (!_panDragging) return;
    if (e.touches.length !== 1) return;
    const board = document.getElementById('board');
    if (!board) return;
    _panApplyMove(board, e.touches[0].clientX - _panStartX, e.touches[0].clientY - _panStartY);
    e.preventDefault();
}

function _onPanTouchEnd() {
    if (!_panDragging) return;
    _panDragging = false;
    const board = document.getElementById('board');
    if (board) board.style.cursor = _pdfPanMode ? 'grab' : '';
    localStorage.setItem('boardPdfBgPos', _pdfBgPosX + ',' + _pdfBgPosY);
    _savePdfBgOffsetPx(board);
}

function _attachPdfPanListeners() {
    const board = document.getElementById('board');
    if (!board) return;
    board.addEventListener('mousedown', _onPanMouseDown, true);
    window.addEventListener('mousemove', _onPanMouseMove);
    window.addEventListener('mouseup',   _onPanMouseUp);
    board.addEventListener('touchstart', _onPanTouchStart, { capture: true, passive: false });
    board.addEventListener('touchmove',  _onPanTouchMove,  { capture: true, passive: false });
    board.addEventListener('touchend',   _onPanTouchEnd,   true);
    board.addEventListener('touchcancel',_onPanTouchEnd,   true);
}

function _detachPdfPanListeners() {
    const board = document.getElementById('board');
    if (board) {
        board.removeEventListener('mousedown', _onPanMouseDown, true);
        board.removeEventListener('touchstart', _onPanTouchStart, true);
        board.removeEventListener('touchmove',  _onPanTouchMove,  true);
        board.removeEventListener('touchend',   _onPanTouchEnd,   true);
        board.removeEventListener('touchcancel',_onPanTouchEnd,   true);
    }
    window.removeEventListener('mousemove', _onPanMouseMove);
    window.removeEventListener('mouseup',   _onPanMouseUp);
}

/**
 * Crée le panneau flottant de largeur + panoramique du fond PDF.
 */
function _initPdfWallpaperPanel() {
    if (document.getElementById('pdf-wallpaper-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'pdf-wallpaper-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 100px;
        z-index: 12000;
        background: rgba(20,20,28,0.35);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        padding: 8px 14px;
        display: none;
        align-items: center;
        gap: 10px;
        opacity: 0.18;
        transition: opacity 0.25s;
        pointer-events: auto;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    `;
    panel.innerHTML = `
        <span style="font-size:12px;line-height:1;color:#fff;">largeur PDF</span>
        <input type="range" id="pdf-bg-width-slider" min="20" max="200" value="100" step="5"
            style="width:90px;cursor:pointer;accent-color:#7ab8f5;">
        <span id="pdf-bg-width-label" style="color:#fff;font-size:11px;font-weight:600;min-width:34px;text-align:right;">100%</span>
    `;
    panel.addEventListener('mouseenter', () => panel.style.opacity = '1');
    panel.addEventListener('mouseleave', () => panel.style.opacity = '0.18');

    panel.querySelector('#pdf-bg-width-slider').addEventListener('input', function() {
        _applyPdfWallpaperWidth(parseInt(this.value));
    });

    document.body.appendChild(panel);
}

function _updatePdfWallpaperPanelVisibility() {
    const panel = document.getElementById('pdf-wallpaper-panel');
    if (!panel) return;
    panel.style.display = _isPdfWallpaper ? 'flex' : 'none';
    const bgPanBtn = document.getElementById('bg-pan-btn');
    if (bgPanBtn) bgPanBtn.style.display = _isPdfWallpaper ? 'flex' : 'none';
    if (!_isPdfWallpaper && _pdfPanMode) _togglePdfPanMode();
}

/**
 * À appeler depuis pdf-viewer.js après avoir défini un fond PDF.
 */
function activatePdfWallpaperSlider(initialWidth) {
    _isPdfWallpaper    = true;
    _pdfWallpaperWidth = initialWidth || 100;
    _pdfBgPosX = 50;
    _pdfBgPosY = 0;
    localStorage.setItem('boardPdfBgPos', '50,0');
    const slider = document.getElementById('pdf-bg-width-slider');
    if (slider) slider.value = _pdfWallpaperWidth;
    const label = document.getElementById('pdf-bg-width-label');
    if (label) label.textContent = Math.round(_pdfWallpaperWidth) + '%';
    if (_pdfPanMode) _togglePdfPanMode();
    _updatePdfWallpaperPanelVisibility();
    _applyBoardHeightForPdf();
    _startBoardHeightGuard();
    // Sauvegarder l'offset initial en pixels absolus
    _savePdfBgOffsetPx();
    // Initialiser style.width/height sur les shape-widgets existants
    document.querySelectorAll('.shape-widget').forEach(w => {
        if (!w.style.width)  w.style.width  = w.offsetWidth  + 'px';
        if (!w.style.height) w.style.height = w.offsetHeight + 'px';
    });
}

// (patch applyBackground unique en haut du fichier)

// =========================================================================
// ANNOTATION SUR LE FOND D'ÉCRAN PDF
// =========================================================================

var _bgAnnotActive = false;   // mode annotation fond actif
var _bgAnnotWidget = null;    // faux widget exposé à draw.js

/**
 * Crée ou récupère le canvas d'annotation superposé au board.
 */
function _getBgAnnotCanvas() {
    const board = document.getElementById('board');
    if (!board) return null;
    let canvas = document.getElementById('_bg-annot-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = '_bg-annot-canvas';
        canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:5;';
        board.appendChild(canvas);
    }
    const dpr     = window.devicePixelRatio || 1;
    const bgRatio = window._pdfBgNativeRatio
        || parseFloat(localStorage.getItem('boardPdfBgRatio')) || 1;
    const cssW = board.offsetWidth;
    const cssH = Math.ceil(cssW * _pdfWallpaperWidth / 100 * bgRatio);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    if (canvas.width  !== Math.round(cssW * dpr) ||
        canvas.height !== Math.round(cssH * dpr)) {
        canvas.width  = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
    }
    return canvas;
}

/**
 * Crée le faux widget avec _pdfAnnotAPI compatible draw.js.
 */
function _createBgAnnotWidget() {
    const board = document.getElementById('board');
    if (!board) return null;

    // Récupérer ou créer le faux widget conteneur
    let fakeWidget = document.getElementById('_bg-annot-widget');
    if (!fakeWidget) {
        fakeWidget = document.createElement('div');
        fakeWidget.id = '_bg-annot-widget';
        fakeWidget.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:4;background:transparent;';
        // draw.js cherche .pdf-annot-canvas dans le widget
        const annotCanvas = _getBgAnnotCanvas();
        if (annotCanvas) {
            annotCanvas.classList.add('pdf-annot-canvas');
            fakeWidget.appendChild(annotCanvas);
        }
        board.appendChild(fakeWidget);
    } else {
        // Réactiver les pointer-events si le widget existait déjà
        fakeWidget.style.pointerEvents = 'auto';
        // Resynchroniser le canvas au cas où le board aurait changé de taille
        _getBgAnnotCanvas();
    }

    // Construire l'API compatible _pdfAnnotAPI
    const annotCanvas = fakeWidget.querySelector('.pdf-annot-canvas');
    if (!annotCanvas) return null;

    const actx = annotCanvas.getContext('2d');
    const strokes = [];
    const history = [];

    function toNorm(px, py) {
        return { x: px / annotCanvas.width, y: py / annotCanvas.height };
    }
    function fromNorm(nx, ny) {
        return { x: nx * annotCanvas.width, y: ny * annotCanvas.height };
    }

    function drawStroke(ctx, stroke) {
        const canvasW = annotCanvas.width;
        const sizeScaled = stroke.size * canvasW / 600;
        if (stroke.tool === 'text') {
            const pos = fromNorm(stroke.nx, stroke.ny);
            ctx.save();
            const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * canvasW / 600);
            ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
            ctx.fillStyle = stroke.color;
            ctx.textBaseline = 'top';
            if (stroke.rotation) {
                const lines = (stroke.text || '').split('\n');
                const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
                const textH = lines.length * fontSize * 1.3;
                const cx = pos.x + textW / 2, cy = pos.y + textH / 2;
                ctx.translate(cx, cy); ctx.rotate(stroke.rotation); ctx.translate(-cx, -cy);
            }
            (stroke.text || '').split('\n').forEach((line, i) => {
                const fontSize2 = Math.round(6 * Math.pow(1.12, stroke.size) * canvasW / 600);
                ctx.fillText(line, pos.x, pos.y + i * fontSize2 * 1.3);
            });
            ctx.restore();
            return;
        }
        if (!stroke.pts || stroke.pts.length < 1) return;
        ctx.save();
        if (stroke.tool === 'figure') {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size * canvasW / 600;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath();
            stroke.pts.forEach((p, i) => {
                const cp = fromNorm(p.x, p.y);
                i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
            });
            if (stroke.fillColor && stroke.fillOpacity > 0) {
                ctx.save(); ctx.globalAlpha = stroke.fillOpacity;
                ctx.fillStyle = stroke.fillColor; ctx.fill(); ctx.restore();
            }
            ctx.stroke(); ctx.restore(); return;
        } else if (stroke.tool === 'highlighter') {
            ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'multiply';
            ctx.lineWidth = sizeScaled * 5;
        } else if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = sizeScaled * 2;
        } else {
            ctx.lineWidth = sizeScaled;
        }
        ctx.strokeStyle = stroke.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        const p0 = fromNorm(stroke.pts[0].x, stroke.pts[0].y);
        if (stroke.dot || stroke.pts.length === 1) {
            ctx.arc(p0.x, p0.y, Math.max(sizeScaled / 2, 1), 0, Math.PI * 2);
            ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
            ctx.fill(); ctx.restore(); return;
        }
        ctx.moveTo(p0.x, p0.y);
        if (stroke.pts.length === 2) {
            const p1 = fromNorm(stroke.pts[1].x, stroke.pts[1].y);
            ctx.lineTo(p1.x, p1.y);
        } else {
            for (let i = 1; i < stroke.pts.length - 1; i++) {
                const pi  = fromNorm(stroke.pts[i].x,   stroke.pts[i].y);
                const pi1 = fromNorm(stroke.pts[i+1].x, stroke.pts[i+1].y);
                const mx = pi.x + (pi1.x - pi.x) * 0.25;
                const my = pi.y + (pi1.y - pi.y) * 0.25;
                ctx.quadraticCurveTo(pi.x, pi.y, mx, my);
            }
            const last = fromNorm(stroke.pts[stroke.pts.length-1].x, stroke.pts[stroke.pts.length-1].y);
            ctx.lineTo(last.x, last.y);
        }
        ctx.stroke(); ctx.restore();
    }

    function redraw() {
        actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
        strokes.forEach(s => drawStroke(actx, s));
    }

    fakeWidget._pdfAnnotAPI = {
        startStroke(color, size, tool, px, py) {
            const norm = toNorm(px, py);
            fakeWidget._currentStroke = { tool, color, size, pts: [norm] };
        },
        continueStroke(color, size, tool, px, py) {
            if (!fakeWidget._currentStroke) return;
            const norm = toNorm(px, py);
            fakeWidget._currentStroke.pts.push(norm);
            fakeWidget._currentStroke.color = color;
            fakeWidget._currentStroke.size  = size;
            fakeWidget._currentStroke.tool  = tool;
            // Dessin incrémental
            const pts = fakeWidget._currentStroke.pts;
            const prev = pts[pts.length - 2];
            const canvasW = annotCanvas.width;
            const sizeScaled = size * canvasW / 600;
            actx.save();
            if (tool === 'highlighter') {
                actx.globalAlpha = 0.35; actx.globalCompositeOperation = 'multiply';
                actx.lineWidth = sizeScaled * 5; actx.lineCap = 'square';
            } else if (tool === 'eraser') {
                actx.globalCompositeOperation = 'destination-out';
                actx.lineWidth = sizeScaled * 2; actx.lineCap = 'round';
            } else {
                actx.lineWidth = sizeScaled; actx.lineCap = 'round';
            }
            actx.strokeStyle = color; actx.lineJoin = 'round';
            actx.beginPath();
            const pPrev = fromNorm(prev.x, prev.y);
            const pCur  = fromNorm(norm.x, norm.y);
            actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y);
            actx.stroke(); actx.restore();
        },
        endStroke() {
            if (!fakeWidget._currentStroke) return;
            if (fakeWidget._currentStroke.pts.length === 1) fakeWidget._currentStroke.dot = true;
            history.push([...strokes]);
            if (history.length > 30) history.shift();
            strokes.push(fakeWidget._currentStroke);
            fakeWidget._currentStroke = null;
            redraw();
        },
        undo() {
            if (history.length > 0) {
                strokes.length = 0;
                history.pop().forEach(s => strokes.push(s));
            } else if (strokes.length > 0) {
                strokes.pop();
            }
            redraw();
        },
        redo() {},
        clear() { history.push([...strokes]); strokes.length = 0; redraw(); },
        getAnnotCanvas()  { return annotCanvas; },
        getPdfDoc()       { return null; },
        getTotalPages()   { return 1; },
        getAnnotLayers()  { return { 1: { strokes } }; },
        redrawAnnotations() { redraw(); },
        drawStrokeOn(ctx, stroke, cw) { drawStroke(ctx, stroke); },
        addTextStroke(text, color, size, px, py) {
            const norm = toNorm(px, py);
            history.push([...strokes]);
            strokes.push({ tool: 'text', color, size, text, nx: norm.x, ny: norm.y });
            redraw();
        },
        previewFigure(color, size, pts) {
            redraw();
            const canvasW = annotCanvas.width;
            actx.save();
            actx.strokeStyle = color; actx.lineWidth = size * canvasW / 600;
            actx.lineCap = 'round'; actx.lineJoin = 'round';
            actx.setLineDash([6, 4]); actx.globalAlpha = 0.7;
            actx.beginPath();
            pts.forEach((p, i) => i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y));
            actx.stroke(); actx.setLineDash([]); actx.restore();
        },
        addFigureStroke(color, size, pts, fillColor, fillOpacity) {
            const normPts = pts.map(p => toNorm(p.x, p.y));
            const stroke = { tool: 'figure', color, size, pts: normPts };
            if (fillColor && fillOpacity > 0) { stroke.fillColor = fillColor; stroke.fillOpacity = fillOpacity; }
            history.push([...strokes]);
            strokes.push(stroke);
            redraw();
        },
        previewEraser(px, py, r) {
            redraw();
            const canvasW = annotCanvas.width;
            actx.save();
            actx.beginPath();
            actx.arc(px, py, r * canvasW / 600, 0, Math.PI * 2);
            actx.strokeStyle = 'rgba(80,80,80,0.9)'; actx.lineWidth = 1.5;
            actx.setLineDash([4, 3]); actx.stroke(); actx.restore();
        },
        eraseAt(px, py, r) {
            const canvasW = annotCanvas.width;
            actx.save();
            actx.globalCompositeOperation = 'destination-out';
            actx.beginPath();
            actx.arc(px, py, r * canvasW / 600, 0, Math.PI * 2);
            actx.fill(); actx.restore();
        },
        findTextStrokeAt() { return null; },
        findFigureStrokeAt() { return null; },
        moveTextStroke() {}, saveTextMove() {}, rotateTextStroke() {},
        saveTextTransform() {}, updateTextStroke() {}, drawTextSelection() {},
        startDragFigure() {}, moveFigureStroke() {}, saveFigureMove() {},
        resizeFigureStroke() {}, rotateFigureStroke() {}, saveFigureTransform() {},
        startDragText() {}, drawFigureSelection() {},
    };

    return fakeWidget;
}

/**
 * Active / désactive le mode annotation sur le fond d'écran.
 */
function _toggleBgAnnotMode() {
    const btn = document.getElementById('pdf-bg-annot-btn');
    if (_bgAnnotActive) {
        // Désactiver
        _bgAnnotActive = false;
        if (typeof _stopPdfAnnotMode === 'function') _stopPdfAnnotMode();
        if (btn) { btn.style.background = 'rgba(255,255,255,0.12)'; btn.style.color = '#fff'; }
        // Désactiver pointer-events sur le faux widget
        const fw = document.getElementById('_bg-annot-widget');
        if (fw) fw.style.pointerEvents = 'none';
    } else {
        // Activer
        _bgAnnotActive = true;
        if (btn) { btn.style.background = '#7ab8f5'; btn.style.color = '#000'; }
        _bgAnnotWidget = _createBgAnnotWidget();
        if (!_bgAnnotWidget) return;
        // Ouvrir la toolbar draw si pas déjà ouverte
        const tb = document.getElementById('draw-toolbar');
        if (tb && (tb.style.display === 'none' || tb.style.display === '')) {
            if (typeof toggleDrawToolbar === 'function') toggleDrawToolbar();
        }
        // Lancer le mode annotation PDF sur le faux widget
        if (typeof _startPdfAnnotModeOn === 'function') {
            _startPdfAnnotModeOn(_bgAnnotWidget);
        }
    }
}
