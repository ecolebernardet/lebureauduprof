// ══════════════════════════════════════════════════════════════════
//  widget-solide3d.js  —  Solides 3D interactifs (cube, pyramide…)
//  Rendu via Canvas 2D + projection perspective corrigée
// ══════════════════════════════════════════════════════════════════

function createSolide3DWidget() {

    // ── CSS (injecté une seule fois) ──────────────────────────────
    if (!document.getElementById('s3d-style')) {
        const s = document.createElement('style');
        s.id = 's3d-style';
        s.textContent = `
        .widget[data-type="solide3d"] {
            cursor: move;
            overflow: visible !important;
        }
        .s3d-container {
            display: flex;
            flex-direction: column;
            background: #0f1923;
            border-radius: 14px;
            border: 1px solid #1e3a50;
            box-shadow: 0 4px 24px rgba(0,0,0,.5);
            font-family: 'Nunito', sans-serif;
            min-width: 240px;
            user-select: none;
            height: 100%;
            box-sizing: border-box;
        }
        .s3d-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 8px 12px;
            background: #162535;
            border-bottom: 1px solid #1e3a50;
            border-radius: 14px 14px 0 0;
            cursor: move;
            user-select: none;
            flex-wrap: wrap;
            flex-shrink: 0;
        }
        .s3d-title {
            font-size: 13px;
            font-weight: 700;
            color: #7ec8e3;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            flex-shrink: 0;
        }
        .s3d-shape-btns {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }
        .s3d-shape-btn {
            background: #1e3a50;
            border: 1px solid #2a5470;
            color: #7ec8e3;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 11px;
            cursor: pointer;
            font-family: inherit;
            transition: background 0.15s, color 0.15s;
        }
        .s3d-shape-btn:hover { background: #2a5470; }
        .s3d-shape-btn.active {
            background: #0e7fa8;
            border-color: #0ea5d0;
            color: #fff;
        }
        .s3d-canvas-wrap {
            position: relative;
            flex: 1;
            min-height: 100px;
            overflow: hidden;
        }
        .s3d-canvas {
            display: block;
            width: 100%;
            height: 100%;
            cursor: grab;
            touch-action: none;
        }
        .s3d-canvas:active { cursor: grabbing; }
        .s3d-hint {
            position: absolute;
            bottom: 6px;
            left: 0; right: 0;
            text-align: center;
            font-size: 9px;
            color: #2a5060;
            pointer-events: none;
        }
        .s3d-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px 10px;
            gap: 8px;
            flex-wrap: wrap;
            flex-shrink: 0;
        }
        .s3d-ctrl-group {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .s3d-label {
            font-size: 10px;
            color: #4a8aa8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .s3d-btn {
            background: #162535;
            border: 1px solid #2a5470;
            color: #7ec8e3;
            border-radius: 6px;
            padding: 3px 9px;
            font-size: 11px;
            cursor: pointer;
            font-family: inherit;
            transition: background 0.15s;
        }
        .s3d-btn:hover { background: #1e3a50; }
        .s3d-toggle {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 10px;
            color: #4a8aa8;
            cursor: pointer;
        }
        .s3d-toggle input[type=checkbox] { accent-color: #0e7fa8; cursor: pointer; }
        /* Slider de zoom */
        .s3d-zoom-row {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 12px 8px;
            flex-shrink: 0;
        }
        .s3d-zoom-row .s3d-label { min-width: 32px; }
        .s3d-zoom-slider {
            flex: 1;
            accent-color: #0e7fa8;
            cursor: pointer;
        }
        .s3d-zoom-val {
            font-size: 10px;
            color: #4a8aa8;
            min-width: 28px;
            text-align: right;
        }
        /* ── Mode clair ── */
        body.menu-light .s3d-container {
            background: #f0f4f8;
            border-color: #c0d4e8;
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        body.menu-light .s3d-header {
            background: #ddeaf6;
            border-bottom-color: #b8d0e8;
        }
        body.menu-light .s3d-title { color: #1a6a99; }
        body.menu-light .s3d-shape-btn {
            background: #e2edf8;
            border-color: #b0cce4;
            color: #1a6a99;
        }
        body.menu-light .s3d-shape-btn:hover { background: #c8dff0; }
        body.menu-light .s3d-shape-btn.active {
            background: #1a87bb;
            border-color: #1a87bb;
            color: #fff;
        }
        body.menu-light .s3d-hint { color: #8aafcc; }
        body.menu-light .s3d-label { color: #2a7aa8; }
        body.menu-light .s3d-zoom-val { color: #2a7aa8; }

        body.menu-light .s3d-btn {
            background: #e2edf8;
            border-color: #b0cce4;
            color: #1a6a99;
        }
        body.menu-light .s3d-btn:hover { background: #c8dff0; }
        body.menu-light .s3d-toggle { color: #2a7aa8; }
        body.menu-light .s3d-zoom-slider { accent-color: #1a87bb; }
        body.menu-light .s3d-resize-handle svg line { stroke: #1a6a99; }
        /* Poignée de redimensionnement */
        .s3d-resize-handle {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 18px;
            height: 18px;
            cursor: se-resize;
            z-index: 10;
            opacity: 0.45;
            transition: opacity 0.15s;
        }
        .s3d-resize-handle:hover { opacity: 1; }
        .s3d-resize-handle svg { display: block; }
        /* Plein écran board */
        .s3d-container.s3d-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
        }
        `;
        document.head.appendChild(s);
    }

    // ── Créer le widget DOM ───────────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'solide3d';
    widget.tabIndex = 0;

    const pos = typeof findFreePosition === 'function' ? findFreePosition(300, 420) : { x: 200, y: 100 };
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left   = '100px';
    widget.style.top    = pos.y + 'px';
    widget.style.width  = '450px';
    widget.style.height = '630px';

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget, .shape-widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget, .shape-widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="
                (function(w){
                    snapshotNow();
                    closeCtxMenuAll();
                    w.remove();
                    saveBoard();
                })(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
        <div class="widget-content" style="height:100%;box-sizing:border-box;position:relative;">
            <div class="s3d-container">
                <div class="s3d-header">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;min-width:0;">
                        <span class="s3d-title">Solide 3D</span>
                        <div class="s3d-shape-btns">
                            <button class="s3d-shape-btn active" data-shape="cube">Cube</button>
                            <button class="s3d-shape-btn" data-shape="parallelepiped">Pavé droit</button>
                            <button class="s3d-shape-btn" data-shape="prism3">Prisme △</button>
                            <button class="s3d-shape-btn" data-shape="prism6">Prisme ⬡</button>
                            <button class="s3d-shape-btn" data-shape="tetrahedron">Tétraèdre</button>
                            <button class="s3d-shape-btn" data-shape="octahedron">Octaèdre</button>
                            <button class="s3d-shape-btn" data-shape="pyramid">Pyramide</button>
							<button class="s3d-shape-btn" data-shape="cylinder">Cylindre</button>
                            <button class="s3d-shape-btn" data-shape="cone">Cône</button>
                            <button class="s3d-shape-btn" data-shape="sphere">Sphère</button>
                        </div>
                    </div>
                    <div class="wf-btns" style="flex-shrink:0;">
                        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                    </div>
                </div>
                <div class="s3d-canvas-wrap">
                    <canvas class="s3d-canvas"></canvas>
                    <div class="s3d-hint">Cliquer-glisser pour tourner</div>
                </div>
                <div class="s3d-zoom-row">
                    <span class="s3d-label">Zoom</span>
                    <input type="range" class="s3d-zoom-slider" min="20" max="150" value="90">
                    <span class="s3d-zoom-val">90%</span>
                </div>
                <div class="s3d-controls">
                    <div class="s3d-ctrl-group">
                        <label class="s3d-toggle">
                            <input type="checkbox" class="s3d-aretes-chk" checked>
                            Arêtes
                        </label>
                        <label class="s3d-toggle">
                            <input type="checkbox" class="s3d-anim-chk">
                            Auto-rotation
                        </label>
                    </div>
                    <button class="s3d-btn s3d-reset-btn">↺ Réinitialiser</button>
                </div>
            </div>
            <!-- Poignée de redimensionnement -->
            <div class="s3d-resize-handle" title="Redimensionner">
                <svg width="18" height="18" viewBox="0 0 18 18">
                    <line x1="4"  y1="15" x2="15" y2="4"  stroke="#7ec8e3" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="9"  y1="15" x2="15" y2="9"  stroke="#7ec8e3" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="14" y1="15" x2="15" y2="14" stroke="#7ec8e3" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </div>
        </div>`;

    const board = document.getElementById('board');
    board.appendChild(widget);
    if (typeof bringToFront        === 'function') bringToFront(widget);
    if (typeof makeDraggable       === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    // ── Moteur 3D ─────────────────────────────────────────────────
    _initSolide3D(widget);

    // ── Boutons wf (réduire / plein écran / fermer) ───────────────
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const s3dContainer = widget.querySelector('.s3d-container');
    let _isMax = false;

    if (wfMin) {
        wfMin.addEventListener('click', e => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            const content = widget.querySelector('.widget-content');
            if (typeof window._wfMiniBarCollapse === 'function') {
                if (content) content.style.display = 'none';
                window._wfMiniBarCollapse(widget, '🧊 Solide 3D', {
                    onExpand: () => { if (content) content.style.display = ''; }
                });
            }
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', e => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                s3dContainer.classList.add('s3d-fullboard');
            } else {
                s3dContainer.classList.remove('s3d-fullboard');
            }
        });
    }
    if (wfClose) {
        wfClose.addEventListener('click', e => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // Sauvegarder les dimensions pour la restauration
    widget.dataset.s3dW = '300';
    widget.dataset.s3dH = '420';

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}

// Fonction de restauration appelée par save-load.js
function createSolide3DWidgetFromSave(savedW, savedH) {
    const widget = createSolide3DWidget();
    if (savedW > 0) widget.style.width  = savedW + 'px';
    if (savedH > 0) widget.style.height = savedH + 'px';
    return widget;
}


// ─────────────────────────────────────────────────────────────────
//  Moteur de rendu 3D (projection orthographique + éclairage diffus doux)
//  • Canvas net sur écrans haute densité (devicePixelRatio)
//  • Animation indépendante de la fréquence d'affichage (delta-temps)
//  • Faces ombrées en douceur, sans liserés entre faces
//  • Cylindre / cône lisses (128 segments) avec contours de silhouette
//  • Sphère à silhouette parfaite (dégradé radial) + grille sur l'hémisphère visible
//  • Inertie légère après un cliquer-glisser
// ─────────────────────────────────────────────────────────────────
function _initSolide3D(widget) {

    const canvasWrap = widget.querySelector('.s3d-canvas-wrap');
    const canvas     = widget.querySelector('.s3d-canvas');
    const ctx        = canvas.getContext('2d');

    // ── État ──────────────────────────────────────────────────────
    let rotX = 30 * Math.PI / 180;
    let rotY = 45 * Math.PI / 180;
    let rotZ = 0;
    let zoom = parseInt(widget.querySelector('.s3d-zoom-slider').value) / 100;
    let showEdges  = true;
    let autoRotate = false;
    let currentShape = 'cube';
    let animId = null;
    let lastT  = 0;
    let velX = 0, velY = 0;          // vitesse d'inertie (rad/s)
    let dragging = false;

    // Dimensions logiques (px CSS) + densité de pixels de l'écran
    let cssW = 0, cssH = 0, dpr = 1;

    // ── Palette adoucie (tons moins saturés que l'original) ───────
    const C = {
        bleu:   '#5f9fc9',
        rose:   '#d48aaa',
        jaune:  '#e2c86c',
        vert:   '#6fb78f',
        violet: '#9a88cf',
        rouge:  '#d47a70',
        orange: '#e09d6a',
        cyan:   '#6dbcc4',
        indigo: '#6f86c6',
    };
    const FACE_PALETTES = {
        cube:          [C.bleu, C.rose, C.jaune, C.vert, C.violet, C.rouge],
        parallelepiped:[C.bleu, C.rose, C.jaune, C.vert, C.violet, C.rouge],
        tetrahedron:   [C.bleu, C.rose, C.jaune, C.vert],
        octahedron:    [C.indigo, C.rose, C.jaune, C.vert, C.violet, C.rouge, C.orange, C.cyan],
        pyramid:       [C.vert, C.bleu, C.rose, C.jaune, C.violet],
        prism3:        [C.indigo, C.vert, C.rose, C.jaune, C.violet],
        prism6:        [C.indigo, C.vert, C.rose, C.jaune, C.violet, C.rouge, C.orange, C.cyan],
        cylinder:      [C.bleu],
        cone:          [C.rose],
        sphere:        [C.bleu],
    };
    const ROUND_BASE_COLORS = { cylinder: [C.vert, C.violet], cone: [C.orange] };

    function getFaceColor(shape, faceIndex) {
        const pal = FACE_PALETTES[shape] || [C.bleu];
        return pal[faceIndex % pal.length];
    }

    // ── Taille du canvas (net sur écrans Retina / HiDPI) ──────────
    function syncCanvasSize() {
        const W = canvasWrap.clientWidth, H = canvasWrap.clientHeight;
        if (W <= 0 || H <= 0) return;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        const pw = Math.round(W * r), ph = Math.round(H * r);
        cssW = W; cssH = H; dpr = r;
        if (canvas.width !== pw || canvas.height !== ph) {
            canvas.width = pw; canvas.height = ph;
        }
    }

    // Redessin unique au prochain frame (regroupe les événements rapprochés)
    let drawPending = false;
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => { syncCanvasSize(); requestDraw(); });
        ro.observe(canvasWrap);
    }
    // Changement de thème clair/sombre → redessiner
    const themeObs = new MutationObserver(requestDraw);
    themeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ── Géométrie : normales explicites ───────────────────────────
    // Tous les solides sont inscrits dans la sphère de rayon 1.
    const S3  = 1 / Math.sqrt(3);
    const SEG = 128;   // segments des solides de révolution
    const SHAPES = {
        cube: () => {
            const r = S3;
            const v = [[-r,-r,-r],[r,-r,-r],[r,r,-r],[-r,r,-r],[-r,-r,r],[r,-r,r],[r,r,r],[-r,r,r]];
            return {vertices:v, faces:[
                {idx:[0,3,2,1],n:[0,0,-1]},{idx:[4,5,6,7],n:[0,0,1]},
                {idx:[0,1,5,4],n:[0,-1,0]},{idx:[3,7,6,2],n:[0,1,0]},
                {idx:[0,4,7,3],n:[-1,0,0]},{idx:[1,2,6,5],n:[1,0,0]},
            ]};
        },
        parallelepiped: () => {
            const a = 0.8111, b = 0.4867, c = 0.3244;
            const v = [
                [-a,-b,-c],[a,-b,-c],[a,b,-c],[-a,b,-c],
                [-a,-b, c],[a,-b, c],[a,b, c],[-a,b, c],
            ];
            return {vertices:v, faces:[
                {idx:[0,3,2,1],n:[0,0,-1]},{idx:[4,5,6,7],n:[0,0,1]},
                {idx:[0,1,5,4],n:[0,-1,0]},{idx:[3,7,6,2],n:[0,1,0]},
                {idx:[0,4,7,3],n:[-1,0,0]},{idx:[1,2,6,5],n:[1,0,0]},
            ]};
        },
        tetrahedron: () => {
            const s = Math.sqrt(8/9), a0 = Math.PI/2, a1 = a0 + 2*Math.PI/3, a2 = a0 + 4*Math.PI/3;
            const v = [[0,1,0],[s*Math.cos(a0),-1/3,s*Math.sin(a0)],[s*Math.cos(a1),-1/3,s*Math.sin(a1)],[s*Math.cos(a2),-1/3,s*Math.sin(a2)]];
            const fn = (...is) => centroidNormal(v, is);
            return {vertices:v, faces:[{idx:[0,1,2],n:fn(0,1,2)},{idx:[0,2,3],n:fn(0,2,3)},{idx:[0,3,1],n:fn(0,3,1)},{idx:[1,3,2],n:fn(1,3,2)}]};
        },
        octahedron: () => {
            const v = [[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
            const fn = (...is) => centroidNormal(v, is);
            return {vertices:v, faces:[
                {idx:[0,4,2],n:fn(0,4,2)},{idx:[0,2,5],n:fn(0,2,5)},{idx:[0,5,3],n:fn(0,5,3)},{idx:[0,3,4],n:fn(0,3,4)},
                {idx:[1,2,4],n:fn(1,2,4)},{idx:[1,5,2],n:fn(1,5,2)},{idx:[1,3,5],n:fn(1,3,5)},{idx:[1,4,3],n:fn(1,4,3)},
            ]};
        },
        pyramid: () => {
            const r = S3;
            const v = [[-r,-r,-r],[r,-r,-r],[r,-r,r],[-r,-r,r],[0,1,0]];
            const pv = (a,b,c) => {
                const ax=b[0]-a[0], ay=b[1]-a[1], az=b[2]-a[2];
                const bx=c[0]-a[0], by=c[1]-a[1], bz=c[2]-a[2];
                const nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx;
                const l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
                return [nx/l, ny/l, nz/l];
            };
            return {vertices:v, faces:[
                {idx:[0,1,2,3], n:[0,-1,0]},
                {idx:[0,4,1],   n:pv(v[0],v[4],v[1])},
                {idx:[1,4,2],   n:pv(v[1],v[4],v[2])},
                {idx:[2,4,3],   n:pv(v[2],v[4],v[3])},
                {idx:[3,4,0],   n:pv(v[3],v[4],v[0])},
            ]};
        },
        prism3: () => {
            const h = 0.75, R = Math.sqrt(1 - h*h);
            const a0 = Math.PI/2, a1 = a0 + 2*Math.PI/3, a2 = a0 + 4*Math.PI/3;
            const v = [
                [R*Math.cos(a0), -h, R*Math.sin(a0)],
                [R*Math.cos(a1), -h, R*Math.sin(a1)],
                [R*Math.cos(a2), -h, R*Math.sin(a2)],
                [R*Math.cos(a0),  h, R*Math.sin(a0)],
                [R*Math.cos(a1),  h, R*Math.sin(a1)],
                [R*Math.cos(a2),  h, R*Math.sin(a2)],
            ];
            const fn = (...is) => centroidNormal(v, is);
            return {vertices:v, faces:[
                {idx:[0,1,2],   n:[0,-1,0]},
                {idx:[5,4,3],   n:[0, 1,0]},
                {idx:[3,4,1,0], n:fn(3,4,1,0)},
                {idx:[4,5,2,1], n:fn(4,5,2,1)},
                {idx:[5,3,0,2], n:fn(5,3,0,2)},
            ]};
        },
        prism6: () => {
            const h = 0.6, R = Math.sqrt(1 - h*h);
            const v = [];
            for (let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;v.push([R*Math.cos(a),-h,R*Math.sin(a)]);}
            for (let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;v.push([R*Math.cos(a), h,R*Math.sin(a)]);}
            const fn = (...is) => centroidNormal(v, is);
            const faces = [
                {idx:[0,1,2,3,4,5],   n:[0,-1,0]},
                {idx:[11,10,9,8,7,6], n:[0, 1,0]},
            ];
            for (let i=0;i<6;i++){const j=(i+1)%6;faces.push({idx:[i+6,j+6,j,i],n:fn(i+6,j+6,j,i)});}
            return {vertices:v, faces};
        },
        cylinder: () => {
            const N = SEG, h = 0.7, R = Math.sqrt(1 - h*h);
            const v = [];
            for (let i=0;i<N;i++){const a=2*Math.PI*i/N;v.push([R*Math.cos(a),-h,R*Math.sin(a)]);}
            for (let i=0;i<N;i++){const a=2*Math.PI*i/N;v.push([R*Math.cos(a), h,R*Math.sin(a)]);}
            const faces = [];
            for (let i=0;i<N;i++){
                const j=(i+1)%N, a=(i+0.5)*2*Math.PI/N;
                faces.push({idx:[i,j,j+N,i+N], n:[Math.cos(a),0,Math.sin(a)]});
            }
            return {vertices:v, faces, isRound:true, N, R, h, type:'cylinder'};
        },
        cone: () => {
            const N = SEG, h = 0.7, R = Math.sqrt(1 - h*h);
            const sY = R/Math.sqrt(R*R+4*h*h), sR = 2*h/Math.sqrt(R*R+4*h*h);
            const v = [];
            for (let i=0;i<N;i++){const a=2*Math.PI*i/N;v.push([R*Math.cos(a),-h,R*Math.sin(a)]);}
            v.push([0,h,0]); // apex
            const faces = [];
            for (let i=0;i<N;i++){
                const j=(i+1)%N, a=(i+0.5)*2*Math.PI/N;
                faces.push({idx:[i,j,N], n:[sR*Math.cos(a),sY,sR*Math.sin(a)]});
            }
            return {vertices:v, faces, isRound:true, N, R, h, type:'cone'};
        },
        sphere: () => ({vertices:[], faces:[], isSphere:true}),
    };

    function centroidNormal(v, is) {
        let cx=0, cy=0, cz=0;
        for (const i of is) { cx+=v[i][0]; cy+=v[i][1]; cz+=v[i][2]; }
        const l = Math.sqrt(cx*cx+cy*cy+cz*cz) || 1;
        return [cx/l, cy/l, cz/l];
    }

    // Géométrie calculée une seule fois par forme
    const shapeCache = {};
    function getShape(name) {
        return shapeCache[name] || (shapeCache[name] = SHAPES[name]());
    }

    // ── Rotation (cos/sin calculés une fois par image) ────────────
    let cX=1, sX=0, cY=1, sY=0;
    function updateRot() {
        cX = Math.cos(rotX); sX = Math.sin(rotX);
        cY = Math.cos(rotY); sY = Math.sin(rotY);
    }
    function applyRot(v) {
        const y1 = cX*v[1] - sX*v[2], z1 = sX*v[1] + cX*v[2];
        return [cY*v[0] + sY*z1, y1, -sY*v[0] + cY*z1];
    }

    // ── Projection orthographique (échelle fixe → pas de zoom parasite)
    function scale() { return Math.min(cssW, cssH) * 0.46 * zoom; }
    function project(v) {
        const sc = scale();
        return [cssW/2 + v[0]*sc, cssH/2 - v[1]*sc];
    }

    // ── Éclairage doux (ambiant + diffus) ─────────────────────────
    const Lraw = [0.5, 0.8, 0.5], Llen = Math.hypot(...Lraw);
    const L = Lraw.map(x => x/Llen);
    const AMB = 0.64, DIF = 0.40;     // luminosité entre 0.64 et 1.04
    function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
    const rgbCache = {};
    function hexToRgb(h) {
        return rgbCache[h] || (rgbCache[h] = [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]);
    }
    function colorAt(hex, f) {
        const [r,g,b] = hexToRgb(hex);
        if (f <= 1) return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
        const w = Math.min(1, f - 1);   // au-delà de 1 : léger éclaircissement vers le blanc
        return `rgb(${Math.round(r+(255-r)*w)},${Math.round(g+(255-g)*w)},${Math.round(b+(255-b)*w)})`;
    }
    function shade(hex, n) {
        return colorAt(hex, AMB + DIF * Math.max(0, dot(n, L)));
    }

    // Remplit un polygone + trait de même couleur (supprime les liserés
    // d'anticrénelage visibles entre faces adjacentes pendant la rotation)
    function fillPoly(pts, color) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k=1;k<pts.length;k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function edgeStyle(isLight, alpha) {
        return isLight ? `rgba(20,40,60,${alpha*0.85})` : `rgba(235,245,255,${alpha})`;
    }

    // ── Rendu ─────────────────────────────────────────────────────
    function draw() {
        syncCanvasSize();
        const W = cssW, H = cssH;
        if (W <= 0 || H <= 0) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.lineJoin = 'round';
        ctx.lineCap  = 'round';

        const isLight = document.body.classList.contains('menu-light');
        const bg = ctx.createRadialGradient(W/2, H/2, 8, W/2, H/2, Math.max(W,H)*0.7);
        if (isLight) { bg.addColorStop(0,'#ddeaf6'); bg.addColorStop(1,'#c4d8ee'); }
        else         { bg.addColorStop(0,'#152535'); bg.addColorStop(1,'#080f18'); }
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        updateRot();
        const shape = getShape(currentShape);

        if (shape.isSphere) { drawSphere(isLight); return; }

        const {vertices, faces} = shape;
        const P  = vertices.map(v => project(applyRot(v)));
        const RN = faces.map(f => applyRot(f.n));          // normales tournées

        // ── Solides de révolution ──
        if (shape.isRound) { drawRound(shape, P, RN, isLight); return; }

        // ── Polyèdres (convexes → élimination des faces arrière suffit) ──
        for (let fi=0; fi<faces.length; fi++) {
            if (RN[fi][2] <= 1e-6) continue;
            fillPoly(faces[fi].idx.map(i => P[i]), shade(getFaceColor(currentShape, fi), RN[fi]));
        }

        if (showEdges) {
            const edgeMap = new Map();
            for (let fi=0; fi<faces.length; fi++) {
                const vis = RN[fi][2] > 1e-6;
                const idx = faces[fi].idx;
                for (let k=0;k<idx.length;k++) {
                    const a = idx[k], b = idx[(k+1)%idx.length];
                    const key = a<b ? a*1000+b : b*1000+a;
                    const e = edgeMap.get(key) || {a, b, vis:0};
                    if (vis) e.vis++;
                    edgeMap.set(key, e);
                }
            }
            // Épaisseur uniforme → plus de « saut » d'épaisseur quand une face bascule
            ctx.strokeStyle = edgeStyle(isLight, 0.55);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (const e of edgeMap.values()) {
                if (e.vis === 0) continue;
                ctx.moveTo(P[e.a][0], P[e.a][1]);
                ctx.lineTo(P[e.b][0], P[e.b][1]);
            }
            ctx.stroke();
        }
    }

    // ── Cylindre / cône ───────────────────────────────────────────
    function drawRound(shape, P, RN, isLight) {
        const {N, type, faces} = shape;
        const baseColors = ROUND_BASE_COLORS[type] || [C.vert];
        const sideColor  = getFaceColor(type, 0);

        const caps = [{off:0, rn:applyRot([0,-1,0]), color:baseColors[0]}];
        if (type === 'cylinder') caps.push({off:N, rn:applyRot([0,1,0]), color:baseColors[1 % baseColors.length]});

        // Bases visibles
        for (const cap of caps) {
            if (cap.rn[2] <= 1e-6) continue;
            fillPoly(P.slice(cap.off, cap.off + N), shade(cap.color, cap.rn));
        }
        // Surface latérale : bandes fines ombrées individuellement → rendu lisse
        for (let i=0;i<N;i++) {
            if (RN[i][2] <= 1e-6) continue;
            fillPoly(faces[i].idx.map(k => P[k]), shade(sideColor, RN[i]));
        }

        if (!showEdges) return;
        ctx.strokeStyle = edgeStyle(isLight, 0.55);
        ctx.lineWidth = 1.6;
        ctx.beginPath();

        // Cercles des bases : en entier si la base est visible,
        // sinon seulement l'arc avant (bord de la surface latérale visible)
        for (const cap of caps) {
            const capVis = cap.rn[2] > 1e-6;
            let pen = false;
            for (let i=0;i<N;i++) {
                const drawSeg = capVis || RN[i][2] > 1e-6;
                const p0 = P[cap.off + i], p1 = P[cap.off + (i+1)%N];
                if (drawSeg) {
                    if (!pen) { ctx.moveTo(p0[0], p0[1]); pen = true; }
                    ctx.lineTo(p1[0], p1[1]);
                } else pen = false;
            }
        }
        // Génératrices de silhouette (contour latéral)
        for (let i=0;i<N;i++) {
            const prev = (i - 1 + N) % N;
            if ((RN[prev][2] > 1e-6) !== (RN[i][2] > 1e-6)) {
                const top = type === 'cylinder' ? P[i + N] : P[N];
                ctx.moveTo(P[i][0], P[i][1]);
                ctx.lineTo(top[0], top[1]);
            }
        }
        ctx.stroke();
    }

    // ── Sphère ────────────────────────────────────────────────────
    function drawSphere(isLight) {
        const r  = scale();
        const cx = cssW/2, cy = cssH/2;
        const base = getFaceColor('sphere', 0);

        // Corps : dégradé radial centré sur le point le plus éclairé
        const hx = cx + L[0]*r*0.5, hy = cy - L[1]*r*0.5;
        const g = ctx.createRadialGradient(hx, hy, r*0.02, cx, cy, r);
        g.addColorStop(0.00, colorAt(base, 1.10));
        g.addColorStop(0.45, colorAt(base, 0.92));
        g.addColorStop(0.85, colorAt(base, 0.72));
        g.addColorStop(1.00, colorAt(base, 0.62));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2*Math.PI);
        ctx.fillStyle = g;
        ctx.fill();

        const NLat = 12, NLon = 24, NS = 96;

        // Bandes de latitude alternées (léger voile) → la rotation reste lisible
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2*Math.PI);
        ctx.clip();
        // Chaque morceau de bande est découpé en 3D sur le plan z = 0 :
        // seule la partie située sur l'hémisphère visible est dessinée,
        // jamais celle de l'arrière (qui transparaissait près du bord).
        const sph = (p, t) => applyRot([Math.cos(p)*Math.cos(t), Math.sin(p), Math.cos(p)*Math.sin(t)]);
        const clipFront = (poly) => {
            const out = [];
            for (let k=0;k<poly.length;k++) {
                const a = poly[k], b = poly[(k+1)%poly.length];
                const ia = a[2] >= 0, ib = b[2] >= 0;
                if (ia) out.push(a);
                if (ia !== ib) {
                    const u = a[2] / (a[2] - b[2]);
                    out.push([a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, 0]);
                }
            }
            return out;
        };
        const LON_SEG = 96, LAT_SUB = 3;   // découpage fin → bords bien ronds
        ctx.beginPath();
        for (let lat=1; lat<NLat; lat+=2) {
            for (let s=0; s<LAT_SUB; s++) {
                const phi0 = Math.PI*((lat + s/LAT_SUB)/NLat - 0.5);
                const phi1 = Math.PI*((lat + (s+1)/LAT_SUB)/NLat - 0.5);
                for (let lon=0; lon<LON_SEG; lon++) {
                    const th0 = 2*Math.PI*lon/LON_SEG, th1 = 2*Math.PI*(lon+1)/LON_SEG;
                    const poly = clipFront([sph(phi0,th0), sph(phi0,th1), sph(phi1,th1), sph(phi1,th0)]);
                    if (poly.length < 3) continue;
                    const q = poly.map(project);
                    ctx.moveTo(q[0][0], q[0][1]);
                    for (let k=1;k<q.length;k++) ctx.lineTo(q[k][0], q[k][1]);
                    ctx.closePath();
                }
            }
        }
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.10)' : 'rgba(10,30,50,0.10)';
        ctx.fill();
        ctx.restore();

        if (!showEdges) return;

        // Grille : parallèles + méridiens, uniquement sur l'hémisphère visible
        ctx.strokeStyle = edgeStyle(isLight, 0.28);
        ctx.lineWidth = 1;
        ctx.beginPath();
        const traceCurve = (fn) => {
            let pen = false;
            for (let k=0;k<=NS;k++) {
                const p = applyRot(fn(k/NS));
                if (p[2] >= 0) {
                    const s = project(p);
                    if (!pen) { ctx.moveTo(s[0], s[1]); pen = true; }
                    else ctx.lineTo(s[0], s[1]);
                } else pen = false;
            }
        };
        for (let lat=1; lat<NLat; lat++) {
            const phi = Math.PI*(lat/NLat - 0.5), cp = Math.cos(phi), sp = Math.sin(phi);
            traceCurve(t => [cp*Math.cos(2*Math.PI*t), sp, cp*Math.sin(2*Math.PI*t)]);
        }
        for (let lon=0; lon<NLon; lon++) {
            const th = 2*Math.PI*lon/NLon, ct = Math.cos(th), st = Math.sin(th);
            traceCurve(t => { const phi = Math.PI*(t - 0.5); return [Math.cos(phi)*ct, Math.sin(phi), Math.cos(phi)*st]; });
        }
        ctx.stroke();

        // Contour
        ctx.strokeStyle = edgeStyle(isLight, 0.55);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2*Math.PI);
        ctx.stroke();
    }

    // ── Boucle d'animation (delta-temps → vitesse constante) ──────
    const AUTO_SPEED_Y = 0.72, AUTO_SPEED_X = 0.30;   // rad/s
    function loop(t) {
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1/60;
        lastT = t;
        if (autoRotate) { rotY += AUTO_SPEED_Y*dt; rotX += AUTO_SPEED_X*dt; }
        if (!dragging && (velX || velY)) {
            rotX += velX*dt; rotY += velY*dt;
            const k = Math.exp(-dt*3.5);
            velX *= k; velY *= k;
            if (Math.abs(velX) < 0.03 && Math.abs(velY) < 0.03) { velX = 0; velY = 0; }
        }
        draw();
        if (autoRotate || velX || velY) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() {
        if (animId) return;
        lastT = 0;
        animId = requestAnimationFrame(loop);
    }

    // ── Interaction : rotation par drag (+ inertie) ───────────────
    canvas.addEventListener('mousedown', e => { e.stopPropagation(); });

    let lastX = 0, lastY = 0, lastMoveT = 0;
    const DRAG_K = 0.01;

    canvas.addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        dragging = true;
        velX = velY = 0;
        lastX = e.clientX; lastY = e.clientY;
        lastMoveT = performance.now();
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        rotY += dx * DRAG_K;
        rotX += dy * DRAG_K;
        const now = performance.now();
        const dts = Math.max(8, now - lastMoveT) / 1000;
        velY = 0.6*velY + 0.4*(dx*DRAG_K/dts);
        velX = 0.6*velX + 0.4*(dy*DRAG_K/dts);
        lastMoveT = now;
        lastX = e.clientX; lastY = e.clientY;
        requestDraw();
    });
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        // Pas d'élan si le pointeur était immobile au relâchement
        if (performance.now() - lastMoveT > 80) { velX = velY = 0; }
        const MAXV = 6;
        velX = Math.max(-MAXV, Math.min(MAXV, velX));
        velY = Math.max(-MAXV, Math.min(MAXV, velY));
        if (velX || velY) startLoop();
    }
    canvas.addEventListener('pointerup',     endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    // ── Slider de zoom ────────────────────────────────────────────
    const zoomSlider = widget.querySelector('.s3d-zoom-slider');
    const zoomVal    = widget.querySelector('.s3d-zoom-val');
    const ZOOM_MIN = parseInt(zoomSlider.min) / 100, ZOOM_MAX = parseInt(zoomSlider.max) / 100;
    zoomSlider.addEventListener('input', e => {
        e.stopPropagation();
        zoom = parseInt(e.target.value) / 100;
        zoomVal.textContent = e.target.value + '%';
        requestDraw();
    });
    zoomSlider.addEventListener('mousedown', e => e.stopPropagation());
    zoomSlider.addEventListener('pointerdown', e => e.stopPropagation());

    // ── Molette → zoom (même plage que le slider) ─────────────────
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        zoom *= e.deltaY > 0 ? 0.92 : 1.09;
        zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
        const pct = Math.round(zoom * 100);
        zoomSlider.value    = pct;
        zoomVal.textContent = pct + '%';
        requestDraw();
    }, { passive: false });

    // ── Redimensionnement via poignée ─────────────────────────────
    const resizeHandle = widget.querySelector('.s3d-resize-handle');
    if (resizeHandle) {
        let rsz = false, rW0, rH0, rMX0, rMY0;

        resizeHandle.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            rsz = true;
            rW0 = widget.offsetWidth;  rH0 = widget.offsetHeight;
            rMX0 = e.clientX;          rMY0 = e.clientY;
            resizeHandle.setPointerCapture(e.pointerId);
        });
        resizeHandle.addEventListener('pointermove', e => {
            if (!rsz) return;
            widget.style.width  = Math.max(240, rW0 + e.clientX - rMX0) + 'px';
            widget.style.height = Math.max(280, rH0 + e.clientY - rMY0) + 'px';
            requestDraw();
        });
        resizeHandle.addEventListener('pointerup', () => {
            rsz = false;
            if (typeof saveBoard === 'function') saveBoard();
        });
        resizeHandle.addEventListener('pointercancel', () => { rsz = false; });
    }

    // ── Boutons de forme ──────────────────────────────────────────
    widget.querySelectorAll('.s3d-shape-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            widget.querySelectorAll('.s3d-shape-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentShape = btn.dataset.shape;
            rotX = 30*Math.PI/180; rotY = 45*Math.PI/180; rotZ = 0;
            velX = velY = 0;
            requestDraw();
        });
    });

    // ── Cases à cocher ────────────────────────────────────────────
    widget.querySelector('.s3d-aretes-chk').addEventListener('change', function() {
        showEdges = this.checked; requestDraw();
    });
    widget.querySelector('.s3d-anim-chk').addEventListener('change', function() {
        autoRotate = this.checked;
        if (autoRotate) startLoop();
    });

    // ── Réinitialiser ─────────────────────────────────────────────
    const ZOOM_DEFAULT = parseInt(zoomSlider.value);
    widget.querySelector('.s3d-reset-btn').addEventListener('click', e => {
        e.stopPropagation();
        rotX = 30*Math.PI/180; rotY = 45*Math.PI/180; rotZ = 0;
        velX = velY = 0;
        zoom = ZOOM_DEFAULT / 100;
        zoomSlider.value    = ZOOM_DEFAULT;
        zoomVal.textContent = ZOOM_DEFAULT + '%';
        requestDraw();
    });

    // ── Lancement ─────────────────────────────────────────────────
    requestDraw();

    // Nettoyage à la suppression du widget
    const obs = new MutationObserver(() => {
        if (!document.contains(widget)) {
            if (animId) cancelAnimationFrame(animId);
            animId = null; autoRotate = false; velX = velY = 0;
            if (ro) ro.disconnect();
            themeObs.disconnect();
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}
