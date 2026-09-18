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
//  Moteur de rendu 3D (projection perspective + éclairage Phong simplifié)
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

    // Palette de couleurs par face (une couleur distincte par face, par solide)
    const FACE_PALETTES = {
        cube:          ['#1a9ecc','#e26fa7','#f0e117','#34c77b','#a855f7','#f72b2b'],
        parallelepiped:['#1a9ecc','#e26fa7','#f0e117','#34c77b','#a855f7','#f72b2b'],
        tetrahedron:   ['#1a9ecc','#e26fa7','#f0e117','#34c77b'],
        octahedron:    ['#2041d4','#e26fa7','#f0e117','#34c77b','#a855f7','#f72b2b','#fb923c','#22d3ee'],
        pyramid:       ['#34c77b','#1a9ecc','#e26fa7','#f0e117','#a855f7'],
        prism3:        ['#2041d4','#34c77b','#e26fa7','#f0e117','#a855f7'],
        prism6:        ['#2041d4','#34c77b','#e26fa7','#f0e117','#a855f7','#f72b2b','#fb923c','#22d3ee'],
        cylinder:      ['#1a9ecc'],
        cone:          ['#e26fa7'],
        sphere:        ['#1a9ecc'],
    };
    const ROUND_BASE_COLORS = { cylinder: ['#34c77b','#a855f7'], cone: ['#f5a623'] };

    function getFaceColor(shape, faceIndex) {
        const pal = FACE_PALETTES[shape] || ['#1a9ecc'];
        return pal[faceIndex % pal.length];
    }

    function syncCanvasSize() {
        const W = canvasWrap.clientWidth, H = canvasWrap.clientHeight;
        if (W>0&&H>0&&(canvas.width!==W||canvas.height!==H)){canvas.width=W;canvas.height=H;}
    }
    if (typeof ResizeObserver!=='undefined') {
        const ro=new ResizeObserver(()=>{syncCanvasSize();if(!autoRotate)draw();});
        ro.observe(canvasWrap);
    }

    // ── Géométrie : normales explicites ───────────────────────────
    // Tous les solides sont normalisés pour être inscrits dans la sphère de rayon 1
    // (rayon max = 1) → même taille apparente quelle que soit la forme.
    const S3 = 1/Math.sqrt(3); // cube et pyramide : leurs sommets extrêmes sont à √3
    const SHAPES = {
        cube: ()=>{
            const r=S3; // normalise ±1 → rayon √3 → ×1/√3 donne rayon 1
            const v=[[-r,-r,-r],[r,-r,-r],[r,r,-r],[-r,r,-r],[-r,-r,r],[r,-r,r],[r,r,r],[-r,r,r]];
            return {vertices:v,faces:[
                {idx:[0,3,2,1],n:[0,0,-1]},{idx:[4,5,6,7],n:[0,0,1]},
                {idx:[0,1,5,4],n:[0,-1,0]},{idx:[3,7,6,2],n:[0,1,0]},
                {idx:[0,4,7,3],n:[-1,0,0]},{idx:[1,2,6,5],n:[1,0,0]},
            ]};
        },
        parallelepiped: ()=>{
            // Pavé droit : 3 dimensions distinctes, normalisé sur la sphère unité
            // Proportions 2.5 : 1.5 : 1 → clairement non cubique
            const a=0.8111, b=0.4867, c=0.3244; // rayon max = 1
            const v=[
                [-a,-b,-c],[a,-b,-c],[a,b,-c],[-a,b,-c],
                [-a,-b, c],[a,-b, c],[a,b, c],[-a,b, c],
            ];
            return {vertices:v,faces:[
                {idx:[0,3,2,1],n:[0,0,-1]},{idx:[4,5,6,7],n:[0,0,1]},
                {idx:[0,1,5,4],n:[0,-1,0]},{idx:[3,7,6,2],n:[0,1,0]},
                {idx:[0,4,7,3],n:[-1,0,0]},{idx:[1,2,6,5],n:[1,0,0]},
            ]};
        },
        tetrahedron: ()=>{
            const s=Math.sqrt(8/9),a0=Math.PI/2,a1=a0+2*Math.PI/3,a2=a0+4*Math.PI/3;
            const v=[[0,1,0],[s*Math.cos(a0),-1/3,s*Math.sin(a0)],[s*Math.cos(a1),-1/3,s*Math.sin(a1)],[s*Math.cos(a2),-1/3,s*Math.sin(a2)]];
            const fn=(i,j,k)=>{const cx=(v[i][0]+v[j][0]+v[k][0])/3,cy=(v[i][1]+v[j][1]+v[k][1])/3,cz=(v[i][2]+v[j][2]+v[k][2])/3,l=Math.sqrt(cx*cx+cy*cy+cz*cz)||1;return[cx/l,cy/l,cz/l];};
            return {vertices:v,faces:[{idx:[0,1,2],n:fn(0,1,2)},{idx:[0,2,3],n:fn(0,2,3)},{idx:[0,3,1],n:fn(0,3,1)},{idx:[1,3,2],n:fn(1,3,2)}]};
        },
        octahedron: ()=>{
            const v=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
            const fn=(i,j,k)=>{const cx=(v[i][0]+v[j][0]+v[k][0])/3,cy=(v[i][1]+v[j][1]+v[k][1])/3,cz=(v[i][2]+v[j][2]+v[k][2])/3,l=Math.sqrt(cx*cx+cy*cy+cz*cz)||1;return[cx/l,cy/l,cz/l];};
            return {vertices:v,faces:[
                {idx:[0,4,2],n:fn(0,4,2)},{idx:[0,2,5],n:fn(0,2,5)},{idx:[0,5,3],n:fn(0,5,3)},{idx:[0,3,4],n:fn(0,3,4)},
                {idx:[1,2,4],n:fn(1,2,4)},{idx:[1,5,2],n:fn(1,5,2)},{idx:[1,3,5],n:fn(1,3,5)},{idx:[1,4,3],n:fn(1,4,3)},
            ]};
        },
        pyramid: ()=>{
            const r=S3;
            const v=[[-r,-r,-r],[r,-r,-r],[r,-r,r],[-r,-r,r],[0,1,0]];
            const pv=(a,b,c)=>{
                const ax=b[0]-a[0],ay=b[1]-a[1],az=b[2]-a[2];
                const bx=c[0]-a[0],by=c[1]-a[1],bz=c[2]-a[2];
                const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
                const l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
                return[nx/l,ny/l,nz/l];
            };
            return {vertices:v,faces:[
                {idx:[0,1,2,3], n:[0,-1,0]},
                {idx:[0,4,1],   n:pv(v[0],v[4],v[1])},
                {idx:[1,4,2],   n:pv(v[1],v[4],v[2])},
                {idx:[2,4,3],   n:pv(v[2],v[4],v[3])},
                {idx:[3,4,0],   n:pv(v[3],v[4],v[0])},
            ]};
        },

        prism3: ()=>{
            const h = 0.75;
            const R = Math.sqrt(1 - h*h);
            const a0=Math.PI/2, a1=a0+2*Math.PI/3, a2=a0+4*Math.PI/3;
            const v = [
                [R*Math.cos(a0), -h, R*Math.sin(a0)], // 0 bas-A
                [R*Math.cos(a1), -h, R*Math.sin(a1)], // 1 bas-B
                [R*Math.cos(a2), -h, R*Math.sin(a2)], // 2 bas-C
                [R*Math.cos(a0),  h, R*Math.sin(a0)], // 3 haut-A
                [R*Math.cos(a1),  h, R*Math.sin(a1)], // 4 haut-B
                [R*Math.cos(a2),  h, R*Math.sin(a2)], // 5 haut-C
            ];
            // Normales = barycentre de chaque face normalisé (toujours correct pour convexe centré)
            const fn=(...is)=>{const cx=is.reduce((s,i)=>s+v[i][0],0)/is.length,cy=is.reduce((s,i)=>s+v[i][1],0)/is.length,cz=is.reduce((s,i)=>s+v[i][2],0)/is.length,l=Math.sqrt(cx*cx+cy*cy+cz*cz)||1;return[cx/l,cy/l,cz/l];};
            return {vertices:v, faces:[
                {idx:[0,1,2],   n:[0,-1,0]},            // base bas
                {idx:[5,4,3],   n:[0, 1,0]},            // base haut
                {idx:[3,4,1,0], n:fn(3,4,1,0)},         // face A-B
                {idx:[4,5,2,1], n:fn(4,5,2,1)},         // face B-C
                {idx:[5,3,0,2], n:fn(5,3,0,2)},         // face C-A
            ]};
        },

        prism6: ()=>{
            const h = 0.6;
            const R = Math.sqrt(1 - h*h);
            const v = [];
            for (let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;v.push([R*Math.cos(a),-h,R*Math.sin(a)]);}
            for (let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;v.push([R*Math.cos(a), h,R*Math.sin(a)]);}
            const fn=(...is)=>{const cx=is.reduce((s,i)=>s+v[i][0],0)/is.length,cy=is.reduce((s,i)=>s+v[i][1],0)/is.length,cz=is.reduce((s,i)=>s+v[i][2],0)/is.length,l=Math.sqrt(cx*cx+cy*cy+cz*cz)||1;return[cx/l,cy/l,cz/l];};
            const faces=[
                {idx:[0,1,2,3,4,5], n:[0,-1,0]},
                {idx:[11,10,9,8,7,6], n:[0,1,0]},
            ];
            for(let i=0;i<6;i++){const j=(i+1)%6;faces.push({idx:[i+6,j+6,j,i],n:fn(i+6,j+6,j,i)});}
            return {vertices:v, faces};
        },

        cylinder: ()=>{
            // Le cylindre utilise un rendu spécial (arc Canvas) — marqué isRound
            const N=32, h=0.7, R=Math.sqrt(1-h*h);
            const v=[];
            for(let i=0;i<N;i++){const a=2*Math.PI*i/N;v.push([R*Math.cos(a),-h,R*Math.sin(a)]);}
            for(let i=0;i<N;i++){const a=2*Math.PI*i/N;v.push([R*Math.cos(a), h,R*Math.sin(a)]);}
            const faces=[];
            for(let i=0;i<N;i++){
                const j=(i+1)%N;
                const a=(i+0.5)*2*Math.PI/N;
                faces.push({idx:[i,j,j+N,i+N],n:[Math.cos(a),0,Math.sin(a)]});
            }
            return {vertices:v, faces, isRound:true, R, h, type:'cylinder'};
        },

        cone: ()=>{
            const N=32, h=0.7, R=Math.sqrt(1-h*h);
            const sY=R/Math.sqrt(R*R+4*h*h), sR=2*h/Math.sqrt(R*R+4*h*h);
            const v=[];
            for(let i=0;i<N;i++){const a=2*Math.PI*i/N;v.push([R*Math.cos(a),-h,R*Math.sin(a)]);}
            v.push([0,h,0]); // apex
            const faces=[];
            for(let i=0;i<N;i++){
                const j=(i+1)%N;
                const a=(i+0.5)*2*Math.PI/N;
                faces.push({idx:[i,j,N],n:[sR*Math.cos(a),sY,sR*Math.sin(a)]});
            }
            return {vertices:v, faces, isRound:true, R, h, type:'cone'};
        },

        sphere: ()=>{
            // Rendu par bandes de latitude (isSphere = true)
            // Pas de géométrie à vertices/faces : tout se dessine dans draw()
            return {vertices:[], faces:[], isRound:false, isSphere:true};
        },
    };

    // ── Rotation ──────────────────────────────────────────────────
    function applyRot(v) {
        const cx=Math.cos(rotX),sx=Math.sin(rotX);
        const cy=Math.cos(rotY),sy=Math.sin(rotY);
        const y1=cx*v[1]-sx*v[2], z1=sx*v[1]+cx*v[2];
        const x2=cy*v[0]+sy*z1,   z2=-sy*v[0]+cy*z1;
        return [x2, y1, z2];
    }

    // ── Projection orthographique FIXE ────────────────────────────
    // sc est constant (ne dépend pas de la rotation) → pas de zoom parasite
    function project(v) {
        const W=canvas.width,H=canvas.height;
        const sc=Math.min(W,H)*0.46*zoom;
        return [W/2+v[0]*sc, H/2-v[1]*sc];
    }

    // ── Éclairage ─────────────────────────────────────────────────
    const Lraw=[0.5,0.8,0.5],Llen=Math.sqrt(0.5**2+0.8**2+0.5**2);
    const L=Lraw.map(x=>x/Llen);
    function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
    function hexToRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
    function shadedColor(hex,br){const[r,g,b]=hexToRgb(hex),f=Math.max(0.12,Math.min(1,br));return`rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;}

    // ── Rendu ─────────────────────────────────────────────────────
    function draw() {
        syncCanvasSize();
        const W=canvas.width,H=canvas.height;
        if(W<=0||H<=0) return;
        ctx.clearRect(0,0,W,H);
        const isLight=document.body.classList.contains('menu-light');
        const bg=ctx.createRadialGradient(W/2,H/2,8,W/2,H/2,Math.max(W,H)*0.7);
        if(isLight){bg.addColorStop(0,'#ddeaf6');bg.addColorStop(1,'#c4d8ee');}
        else       {bg.addColorStop(0,'#152535');bg.addColorStop(1,'#080f18');}
        ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

        const shape=SHAPES[currentShape]();
        const {vertices,faces}=shape;
        const T=vertices.map(v=>applyRot(v));
        const P=T.map(v=>project(v));
        const sc=Math.min(W,H)*0.46*zoom;

        // Trace le polygone d'un cercle 3D projeté (128 segments = visuellement parfait)
        function circlePolygon(yVal, R) {
            const N=128;
            const pts=[];
            for(let i=0;i<N;i++){
                const a=2*Math.PI*i/N;
                const p=applyRot([R*Math.cos(a), yVal, R*Math.sin(a)]);
                pts.push([W/2+p[0]*sc, H/2-p[1]*sc]);
            }
            return pts;
        }

        // Pour cylindre/cône : préparer les bases circulaires
        const isRound = shape.isRound || false;
        const isSphere = shape.isSphere || false;

        // ── Rendu sphère ─────────────────────────────────────────────
        if(isSphere){
            const NLat=24, NLon=48;
            const SPHERE_COLORS=['#1a9ecc','#0e7fa8','#2196c8','#1488b0'];
            // Dessiner les fuseaux (patches lat×lon) triés par Z
            const patches=[];
            for(let lat=0;lat<NLat;lat++){
                const phi0=Math.PI*(lat/NLat-0.5);
                const phi1=Math.PI*((lat+1)/NLat-0.5);
                for(let lon=0;lon<NLon;lon++){
                    const th0=2*Math.PI*lon/NLon;
                    const th1=2*Math.PI*(lon+1)/NLon;
                    // 4 coins du patch
                    const c=[
                        [Math.cos(phi0)*Math.cos(th0), Math.sin(phi0), Math.cos(phi0)*Math.sin(th0)],
                        [Math.cos(phi0)*Math.cos(th1), Math.sin(phi0), Math.cos(phi0)*Math.sin(th1)],
                        [Math.cos(phi1)*Math.cos(th1), Math.sin(phi1), Math.cos(phi1)*Math.sin(th1)],
                        [Math.cos(phi1)*Math.cos(th0), Math.sin(phi1), Math.cos(phi1)*Math.sin(th0)],
                    ];
                    const tphi=(phi0+phi1)/2, tth=(th0+th1)/2;
                    const nRaw=[Math.cos(tphi)*Math.cos(tth), Math.sin(tphi), Math.cos(tphi)*Math.sin(tth)];
                    const nr=applyRot(nRaw);
                    if(nr[2]<=0) continue; // face cachée
                    const rpts=c.map(p=>applyRot(p));
                    const zAvg=rpts.reduce((s,p)=>s+p[2],0)/4;
                    const pts2d=rpts.map(p=>project(p));
                    // Éclairage diffus sur la normale
                    const br=Math.max(0.15, dot(nr, L));
                    patches.push({pts2d, zAvg, br, lat});
                }
            }
            patches.sort((a,b)=>a.zAvg-b.zAvg);
            // Passe remplissage
            for(const {pts2d,br,lat} of patches){
                const baseHex=SPHERE_COLORS[lat%SPHERE_COLORS.length];
                ctx.beginPath();
                ctx.moveTo(pts2d[0][0],pts2d[0][1]);
                for(let k=1;k<pts2d.length;k++) ctx.lineTo(pts2d[k][0],pts2d[k][1]);
                ctx.closePath();
                ctx.fillStyle=shadedColor(baseHex,br);
                ctx.fill();
            }
            // Passe arêtes (méridiens + parallèles)
            if(showEdges){
                ctx.strokeStyle=isLight?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.22)';
                ctx.lineWidth=0.7;
                ctx.lineCap='round';
                for(const {pts2d} of patches){
                    ctx.beginPath();
                    ctx.moveTo(pts2d[0][0],pts2d[0][1]);
                    for(let k=1;k<pts2d.length;k++) ctx.lineTo(pts2d[k][0],pts2d[k][1]);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
            return; // rendu terminé pour la sphère
        }
        let roundBases=[];
        if(isRound){
            const {R,h,type}=shape;
            const rnB=applyRot([0,-1,0]);
            roundBases.push({yVal:-h, R, rn:rnB, zVal:applyRot([0,-h,0])[2]});
            if(type==='cylinder'){
                const rnT=applyRot([0,1,0]);
                roundBases.push({yVal:h, R, rn:rnT, zVal:applyRot([0,h,0])[2]});
            }
        }

        // Trier les faces + les bases circulaires par Z moyen
        const items=[];
        for(let fi=0;fi<faces.length;fi++){
            const face=faces[fi];
            const z=face.idx.reduce((s,i)=>s+T[i][2],0)/face.idx.length;
            items.push({type:'poly', face, z, faceIndex:fi});
        }
        for(let bi=0;bi<roundBases.length;bi++){
            const base=roundBases[bi];
            items.push({type:'circle', base, z:base.zVal, faceIndex:bi});
        }
        items.sort((a,b)=>a.z-b.z);

        // Passe 1 : remplissage (couleurs unies, sans éclairage)
        for(const item of items){
            if(item.type==='circle'){
                const {base}=item;
                if(base.rn[2]<=0) continue;
                const pts=circlePolygon(base.yVal, base.R);
                const baseColors=ROUND_BASE_COLORS[currentShape]||['#34c77b'];
                const bColor=baseColors[item.faceIndex%baseColors.length];
                ctx.beginPath();
                ctx.moveTo(pts[0][0],pts[0][1]);
                for(let k=1;k<pts.length;k++) ctx.lineTo(pts[k][0],pts[k][1]);
                ctx.closePath();
                ctx.fillStyle=bColor;
                ctx.fill();
            } else {
                const {face}=item;
                const rn=applyRot(face.n);
                if(rn[2]<=0) continue;
                const fc=getFaceColor(currentShape,item.faceIndex);
                ctx.beginPath();
                ctx.moveTo(P[face.idx[0]][0],P[face.idx[0]][1]);
                for(let k=1;k<face.idx.length;k++) ctx.lineTo(P[face.idx[k]][0],P[face.idx[k]][1]);
                ctx.closePath();
                ctx.fillStyle=fc;
                ctx.fill();
            }
        }

        // Passe 2 : arêtes par-dessus tout
        if(showEdges){
            ctx.lineCap='round'; ctx.lineJoin='round';
            ctx.strokeStyle=isLight?'rgba(0,0,0,0.3)':'rgba(255,255,255,0.4)';

            if(isRound){
                for(const base of roundBases){
                    if(base.rn[2]<=0) continue;
                    const pts=circlePolygon(base.yVal, base.R);
                    ctx.lineWidth=1.8;
                    ctx.beginPath();
                    ctx.moveTo(pts[0][0],pts[0][1]);
                    for(let k=1;k<pts.length;k++) ctx.lineTo(pts[k][0],pts[k][1]);
                    ctx.closePath();
                    ctx.stroke();
                }
            } else {
                // Solides à faces planes : arêtes avec détection silhouette
                const edgeMap=new Map();
                for(const face of faces){
                    const rn=applyRot(face.n);
                    const vis=rn[2]>0;
                    for(let k=0;k<face.idx.length;k++){
                        const a=face.idx[k],b=face.idx[(k+1)%face.idx.length];
                        const key=a<b?`${a}_${b}`:`${b}_${a}`;
                        const e=edgeMap.get(key)||{a,b,vis:0,hid:0};
                        if(vis) e.vis++; else e.hid++;
                        edgeMap.set(key,e);
                    }
                }
                for(const e of edgeMap.values()){
                    if(e.vis===0) continue;
                    ctx.lineWidth=(e.hid>0)?2.0:1.2;
                    ctx.beginPath();
                    ctx.moveTo(P[e.a][0],P[e.a][1]);
                    ctx.lineTo(P[e.b][0],P[e.b][1]);
                    ctx.stroke();
                }
            }
        }
    }
    // ── Boucle d'animation ────────────────────────────────────────
    function loop() {
        if (autoRotate) { rotY += 0.012; rotX += 0.005; }
        draw();
        animId = requestAnimationFrame(loop);
    }

    function startLoop() {
        if (animId) cancelAnimationFrame(animId);
        animId = requestAnimationFrame(loop);
    }

    // ── Interaction : rotation par drag ──────────────────────────
    // Bloquer mousedown ET pointerdown pour empêcher le drag du widget
    canvas.addEventListener('mousedown', e => { e.stopPropagation(); });

    let dragging = false, lastX = 0, lastY = 0;

    canvas.addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        rotY += (e.clientX - lastX) * 0.01;
        rotX += (e.clientY - lastY) * 0.01;
        lastX = e.clientX; lastY = e.clientY;
        if (!autoRotate) draw();
    });
    canvas.addEventListener('pointerup',     () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });

    // ── Slider de zoom ────────────────────────────────────────────
    const zoomSlider = widget.querySelector('.s3d-zoom-slider');
    const zoomVal    = widget.querySelector('.s3d-zoom-val');
    zoomSlider.addEventListener('input', e => {
        e.stopPropagation();
        zoom = parseInt(e.target.value) / 100;
        zoomVal.textContent = e.target.value + '%';
        if (!autoRotate) draw();
    });
    zoomSlider.addEventListener('mousedown', e => e.stopPropagation());
    zoomSlider.addEventListener('pointerdown', e => e.stopPropagation());

    // ── Molette → zoom (met aussi à jour le slider) ───────────────
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        zoom *= e.deltaY > 0 ? 0.92 : 1.09;
        zoom = Math.max(0.20, Math.min(1.0, zoom));
        // Synchroniser le slider
        const pct = Math.round(zoom * 100);
        zoomSlider.value    = pct;
        zoomVal.textContent = pct + '%';
        if (!autoRotate) draw();
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
            syncCanvasSize();
            if (!autoRotate) draw();
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
            rotX=30*Math.PI/180; rotY=45*Math.PI/180; rotZ=0;
            if (!autoRotate) draw();
        });
    });

    // ── Cases à cocher ────────────────────────────────────────────
    widget.querySelector('.s3d-aretes-chk').addEventListener('change', function() {
        showEdges = this.checked; if (!autoRotate) draw();
    });
    widget.querySelector('.s3d-anim-chk').addEventListener('change', function() {
        autoRotate = this.checked;
        if (autoRotate) startLoop();
    });

    // ── Réinitialiser ─────────────────────────────────────────────
    const ZOOM_DEFAULT = parseInt(widget.querySelector('.s3d-zoom-slider').value);
    widget.querySelector('.s3d-reset-btn').addEventListener('click', e => {
        e.stopPropagation();
        rotX=30*Math.PI/180; rotY=45*Math.PI/180; rotZ=0;
        zoom = ZOOM_DEFAULT / 100;
        zoomSlider.value    = ZOOM_DEFAULT;
        zoomVal.textContent = ZOOM_DEFAULT + '%';
        if (!autoRotate) draw();
    });

    // ── Lancement ─────────────────────────────────────────────────
    startLoop();

    // Nettoyage à la suppression du widget
    const obs = new MutationObserver(() => {
        if (!document.contains(widget)) {
            if (animId) cancelAnimationFrame(animId);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}
