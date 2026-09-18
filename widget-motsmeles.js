// =========================================================================
// WIDGET MOTS MÊLÉS — Le Bureau du Prof
// Génère une grille de mots mêlés interactive et jouable directement
// sur le tableau.
//
// Algorithme inspiré de gene_motsmeles.html
// Design : même structure que widget-repro-quadrillage.js
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS (injecté une seule fois) ──────────────────────────────────────────
(function () {

    // Boutons fenêtre macOS (partagés avec widget-repro-quadrillage)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
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
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');
            const miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top          = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left         = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width        = widget.dataset.wfMiniSavedW    || '';
                widget.style.height       = widget.dataset.wfMiniSavedH    || '';
                widget.style.zIndex       = '';
                widget.style.background   = '';
                widget.style.borderRadius = '';
                widget.style.border       = '';
                widget.style.display      = '';
                widget.style.overflow     = '';
                widget.style.padding      = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
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
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    if (document.getElementById('mm-style')) return;
    const s = document.createElement('style');
    s.id = 'mm-style';
    s.textContent = `
        /* ── Widget wrapper ── */
        .widget[data-type="motsmeles"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .mm-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 12px 14px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 800px;
        }

        /* ── En-tête ── */
        .mm-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .mm-title {
            font-size: 15px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            flex: 1;
			margin-bottom: 20px;
        }

        /* ── Zone de configuration ── */
        .mm-setup {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .mm-field-label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.4px;
			margin-top: 40px;
            margin-bottom: 15px;
        }
        .mm-input {
            width: 100%;
            border: 1.5px solid #d1d5db;
            border-radius: 8px;
            padding: 6px 9px;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            background: #f9fafb;
            outline: none;
            box-sizing: border-box;
        }
        .mm-input:focus { border-color: #3b82f6; background: #fff; }
        textarea.mm-input { resize: vertical; min-height: 60px; font-family: inherit; }
        select.mm-input { cursor: pointer; }

        .mm-row { display: flex; gap: 8px; align-items: flex-end; }
        .mm-row > div { flex: 1; }

        /* ── Barre d'outils (zone jeu) ── */
        .mm-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            background: #f3f4f6;
            border-radius: 10px;
            padding: 6px 8px;
        }
        .mm-tool-btn {
            padding: 5px 10px;
            border-radius: 8px;
            border: 1.5px solid #e5e7eb;
            background: #fff;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background .12s, border-color .12s, transform .1s;
            flex-shrink: 0;
        }
        .mm-tool-btn:hover { background: #e5e7eb; }
        .mm-tool-btn:active { transform: scale(0.93); }
        .mm-tool-btn.active {
            background: #3b82f6;
            border-color: #2563eb;
            color: #fff;
        }
        .mm-toolbar-sep {
            width: 1px; height: 22px;
            background: #d1d5db;
            margin: 0 2px;
            flex-shrink: 0;
        }

        /* ── Grille ── */
        .mm-grid-zone {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px;
            overflow: hidden;
            position: relative;
            min-height: 80px;
            flex-shrink: 0;
        }
        .mm-grid {
            display: grid;
            gap: 2px;
            position: relative;
            z-index: 1;
        }
        .mm-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 14px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
            user-select: none;
            position: relative;
            z-index: 1;
        }
        .mm-cell.selected {
            background: transparent;
            border-color: #e5e7eb;
            color: #1e3a5f;
        }
        .mm-cell.correct {
            background: transparent;
            border-color: #e5e7eb;
            color: #1e3a5f;
        }
        .mm-correction-canvas, .mm-play-canvas {
            position: absolute;
            top: 0; left: 0;
            pointer-events: none;
            z-index: 3;
        }

        /* ── Liste des mots ── */
        .mm-words-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            padding: 6px 8px;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            min-height: 30px;
        }
        .mm-word-chip {
            font-size: 11px;
            font-weight: 700;
            background: #e5e7eb;
            color: #374151;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            transition: all 0.3s;
        }
        .mm-word-chip.found {
            color: #fff;
            text-decoration: line-through;
            opacity: 0.75;
        }

        /* ── Actions ── */
        .mm-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
			margin-top: 60px;
        }
        .mm-action-btn {
            padding: 5px 11px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .mm-action-btn:active { transform: scale(0.96); }
        .mm-btn-generate { background: #3b82f6; color: white; }
        .mm-btn-generate:hover { background: #2563eb; }
        .mm-btn-back { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .mm-btn-back:hover { background: #e0e0e0; }
        .mm-btn-reveal { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .mm-btn-reveal:hover { background: #e0e0e0; }
        .mm-btn-pdf { background: #3b82f6; color: white; }
        .mm-btn-pdf:hover { background: #2563eb; }
        .mm-btn-save-json { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .mm-btn-save-json:hover { background: #e0e0e0; }
        .mm-btn-load-json { background: #f0f0f0; color: #333; border: 1px solid #ddd; cursor: pointer; }
        .mm-btn-load-json:hover { background: #e0e0e0; }
        .mm-word-count {
            font-size: 10px;
            font-weight: 700;
            color: #6b7280;
            margin-left: auto;
        }

        /* ── Bouton aide ── */
        .mm-help-btn {
            width: 22px; height: 22px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .mm-help-btn:hover { background: #e0e0e0; color: #333; }
        .mm-help-popup {
            display: none;
            position: absolute;
            top: 40px; right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 270px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.6;
        }
        .mm-help-popup.show { display: block; }
        .mm-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .mm-help-section { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .mm-help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

        /* ── Fullboard ── */
        .mm-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        /* ── Resize handle ── */
        .mm-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .mm-container:hover .mm-resize-handle { opacity: 1; }

        /* ── Thème selector ── */
        .mm-theme-select { font-size: 13px; }

        /* ── Victoire ── */
        .mm-victory-banner {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, #10b981, #3b82f6);
            color: white;
            font-weight: 800;
            font-size: 13px;
            border-radius: 8px;
            padding: 8px 12px;
            text-align: center;
        }
        .mm-victory-banner.show { display: flex; }
    `;
    document.head.appendChild(s);
})();

// ── Thèmes prédéfinis (repris de gene_motsmeles.html) ─────────────────────
const MM_THEMES = {
    animaux: "Lion, Tigre, Elephant, Girafe, Zebre, Singe, Kangourou, Panda, Renard, Loup, Ours, Lapin",
    ecole: "Crayon, Cahier, Gomme, Stylo, Maitre, Classe, Bureau, Ardoise, Ecole, Livre, Cartable, Regle",
    corps: "Tete, Epaule, Genou, Pied, Main, Bras, Jambe, Doigt, Ventre, Dos, Bouche, Nez",
    noel: "Sapin, Cadeau, Lutin, Traineau, Etoile, Boule, Guirlande, Flocon, Neige, Hotte, Renne",
    fruits: "Pomme, Banane, Fraise, Orange, Poire, Cerise, Raisin, Ananas, Melon, Peche, Kiwi, Citron",
    pays: "France, Italie, Espagne, Belgique, Suisse, Monaco, Allemagne, Canada, Japon, Bresil, Maroc",
    sports: "Football, Basket, Tennis, Judo, Natation, Rugby, Karate, Escrime, Boxe, Danse, Yoga, Ski",
    musique: "Piano, Guitare, Violon, Flute, Trompette, Batterie, Harpe, Saxophone, Tambour",
    espace: "Soleil, Lune, Terre, Mars, Jupiter, Saturne, Planete, Etoile, Galaxie, Comete, Fusee, Astronaute",
    couleurs: "Rouge, Bleu, Vert, Jaune, Orange, Violet, Marron, Rose, Blanc, Noir, Gris, Beige",
    voiture: "Volant, Roue, Vitesse, Pedale, Frein, Porte, Siege, Coffre, Moteur, Embrayage",
    cuisine: "Poêle, Casserole, Couteau, Four, Mixeur, Tablier, Recette, Assiette, Cuillere, Fourchette",
    metiers: "Docteur, Pompier, Policier, Boulanger, Avocat, Pilote, Facteur, Artiste, Juge, Marin",
    vetements: "Pantalon, Chemise, Robe, Jupe, Veste, Bonnet, Echarpe, Gants, Chaussette, Chaussure",
    maison: "Cuisine, Salon, Chambre, Jardin, Fenetre, Escalier, Toiture, Garage, Balcon, Entree",
    meteo: "Soleil, Nuage, Pluie, Orage, Eclair, Tempete, Brouillard, Neige, Ouragan, Arcenciel",
    insectes: "Abeille, Fourmi, Mouche, Papillon, Grillon, Cafard, Cigale, Guêpe, Libellule, Luciole",
    ocean: "Baleine, Requin, Dauphin, Tortue, Pieuvre, Corail, Algue, Meduse, Crevette, Etoile",
    geometrie: "Carre, Cercle, Triangle, Losange, Ovale, Cube, Sphere, Pyramide, Angle, Droite"
};

const MM_DIFFICULTY_DIRECTIONS = {
    easy: () => Math.random() < 0.5 ? [0, 1] : [1, 0],
    hard: () => {
        const r = Math.random();
        if (r < 0.33) return [0, 1];
        if (r < 0.66) return [1, 0];
        return [1, 1];
    },
    expert: () => {
        const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
        return dirs[Math.floor(Math.random() * dirs.length)];
    }
};

// ── Palette de couleurs pour les mots trouvés ────────────────────────────
const MM_WORD_COLORS = [
    '#3b82f6', // bleu
    '#10b981', // vert émeraude
    '#f59e0b', // ambre
    '#ef4444', // rouge
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // rose
    '#14b8a6', // teal
    '#6366f1', // indigo
    '#84cc16', // lime
    '#a855f7', // pourpre
];

// ── Création du widget ────────────────────────────────────────────────────
function createMotsMelesWidget(savedData) {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'motsmeles';
    widget.dataset.transparent = 'true';
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
    widget.tabIndex = 0;

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
    `;

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'mm-container';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'mm-header';
    header.innerHTML = `
        <span class="mm-title">🔍 Mots Mêlés</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;

    // Bouton aide
    const helpBtn = document.createElement('button');
    helpBtn.className = 'mm-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    header.querySelector('.wf-btns').insertBefore(helpBtn, header.querySelector('.wf-btn-min'));
    container.appendChild(header);

    // ── Popup aide ────────────────────────────────────────────────────────
    const helpPopup = document.createElement('div');
    helpPopup.className = 'mm-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Mode d'emploi</h4>
        <div class="mm-help-section">
            <strong>📝 1. Paramétrage</strong><br>
            Saisissez vos mots séparés par des <b>virgules</b>, choisissez la taille de la grille et la difficulté, puis cliquez sur <b>Générer</b>.
        </div>
        <div class="mm-help-section">
            <strong>🔍 2. Recherche</strong><br>
            Cliquez sur les lettres pour les <b>sélectionner</b>. Cliquez à nouveau pour désélectionner.
        </div>
        <div class="mm-help-section">
            <strong>✅ 3. Validation automatique</strong><br>
            Quand un mot complet est trouvé, il se <b>surligne en couleur</b> et se barre dans la liste. Chaque mot a sa propre couleur.
        </div>
        <div class="mm-help-section">
            <strong>👁️ 4. Correction</strong><br>
            Cliquez sur <b>Correction</b> pour révéler l'emplacement de tous les mots.
        </div>
        <div class="mm-help-section">
            <strong>🔄 Nouvelle grille</strong><br>
            Cliquez sur <b>Mélanger</b> pour générer une nouvelle disposition avec les mêmes mots.
        </div>
        <div class="mm-help-section">
            <strong>💾 Sauvegarder / 📂 Charger</strong><br>
            Depuis les réglages, sauvegardez votre liste de mots dans un fichier <b>.json</b> pour la réutiliser plus tard. Rechargez-la avec le bouton <b>Charger JSON</b>.
        </div>
        <div class="mm-help-section">
            <strong>📄 Exporter en PDF</strong><br>
            Depuis la grille, cliquez sur <b>PDF</b> pour générer une fiche imprimable avec la grille vierge et sa correction sur deux pages.
        </div>
    `;
    container.appendChild(helpPopup);

    // ── Zone de configuration ─────────────────────────────────────────────
    const setupZone = document.createElement('div');
    setupZone.className = 'mm-setup';
    setupZone.innerHTML = `
        <div>
            <div class="mm-field-label">Thématique rapide</div>
            <select class="mm-input mm-theme-select mm-theme-selector">
                <option value="animaux">🐾 Animaux</option>
                <option value="ecole">🏫 École</option>
                <option value="corps">👤 Corps Humain</option>
                <option value="noel">🎄 Noël</option>
                <option value="fruits">🍎 Fruits & Légumes</option>
                <option value="pays">🌍 Pays</option>
                <option value="sports">⚽ Sports</option>
                <option value="musique">🎸 Instruments</option>
                <option value="espace">🚀 Espace</option>
                <option value="couleurs">🎨 Couleurs</option>
                <option value="voiture">🚗 Voiture</option>
                <option value="cuisine">🍳 Cuisine</option>
                <option value="metiers">👷 Métiers</option>
                <option value="vetements">👕 Vêtements</option>
                <option value="maison">🏠 Maison</option>
                <option value="meteo">☁️ Météo</option>
                <option value="insectes">🐝 Insectes</option>
                <option value="ocean">🌊 Océan</option>
                <option value="geometrie">📐 Géométrie</option>
            </select>
        </div>
        <div>
            <div class="mm-field-label">Titre de la grille</div>
            <input type="text" class="mm-input mm-title-input" placeholder="Ex: Les Animaux">
        </div>
        <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <div class="mm-field-label" style="margin-bottom:10;">Liste des mots (séparés par des virgules)</div>
                <span class="mm-word-count">0 MOTS</span>
            </div>
            <textarea class="mm-input mm-words-input" rows="3" placeholder="Lion, Tigre, Elephant..."></textarea>
        </div>
        <div class="mm-row">
            <div>
                <div class="mm-field-label">Taille (max 20)</div>
                <input type="number" class="mm-input mm-size-input" value="10" min="5" max="20" style="text-align:center;">
            </div>
            <div>
                <div class="mm-field-label">Difficulté</div>
                <select class="mm-input mm-diff-select">
                    <option value="easy">Facile (H/V à l'endroit)</option>
                    <option value="hard">Difficile (+ Diagonales)</option>
                    <option value="expert">Expert (Toutes directions)</option>
                </select>
            </div>
        </div>
    `;
    container.appendChild(setupZone);

    // Bouton générer (dans setup)
    const setupActions = document.createElement('div');
    setupActions.className = 'mm-actions';
    setupActions.innerHTML = `
        <label class="mm-action-btn mm-btn-load-json" title="Charger une liste depuis un fichier JSON">
            📂 Charger JSON
            <input type="file" accept=".json,.txt" style="display:none" class="mm-file-input">
        </label>
        <button class="mm-action-btn mm-btn-save-json" title="Sauvegarder la liste dans un fichier JSON">💾 Sauvegarder JSON</button>
        <button class="mm-action-btn mm-btn-generate">🔀 Générer la grille</button>
    `;
    container.appendChild(setupActions);

    // ── Zone de jeu (cachée par défaut) ──────────────────────────────────
    const gameZone = document.createElement('div');
    gameZone.className = 'mm-game';
    gameZone.style.display = 'none';
    gameZone.innerHTML = `
        <div class="mm-toolbar">
            <button class="mm-action-btn mm-btn-back" style="font-size:11px;">⬅ Réglages</button>
            <div class="mm-toolbar-sep"></div>
            <button class="mm-action-btn mm-btn-reveal" style="font-size:11px;">👁️ Correction</button>
            <button class="mm-action-btn" style="background:#f0f0f0;color:#333;border:1px solid #ddd;font-size:11px;" data-role="shuffle">🔄 Mélanger</button>
            <div class="mm-toolbar-sep"></div>
            <button class="mm-action-btn mm-btn-pdf" style="font-size:11px;">📄 PDF</button>
        </div>
        <div class="mm-game-title" style="font-size:13px;font-weight:800;text-align:center;color:#374151;"></div>
        <div class="mm-grid-zone" style="position:relative;">
            <canvas class="mm-play-canvas"></canvas>
            <canvas class="mm-correction-canvas"></canvas>
            <div class="mm-grid"></div>
        </div>
        <div class="mm-words-list"></div>
        <div class="mm-victory-banner">🏆 Bravo ! Tous les mots ont été trouvés !</div>
    `;
    container.appendChild(gameZone);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'mm-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAT INTERNE
    // ══════════════════════════════════════════════════════════════════════
    let _finalGrid   = [];   // tableau 2D d'objets {char, isSolution}
    let _gridSize    = 10;
    let _placedWords = [];   // [{r1,c1,r2,c2,word}]
    let _isRevealed  = false;
    let _cellSize    = 28;
    const GAP        = 2;

    // Raccourcis DOM
    const themeSelector = setupZone.querySelector('.mm-theme-selector');
    const titleInput    = setupZone.querySelector('.mm-title-input');
    const wordsInput    = setupZone.querySelector('.mm-words-input');
    const sizeInput     = setupZone.querySelector('.mm-size-input');
    const diffSelect    = setupZone.querySelector('.mm-diff-select');
    const wordCountEl   = setupZone.querySelector('.mm-word-count');
    const generateBtn   = setupActions.querySelector('.mm-btn-generate');
    const saveJsonBtn   = setupActions.querySelector('.mm-btn-save-json');
    const fileInput     = setupActions.querySelector('.mm-file-input');
    const backBtn       = gameZone.querySelector('.mm-btn-back');
    const revealBtn     = gameZone.querySelector('.mm-btn-reveal');
    const shuffleBtn    = gameZone.querySelector('[data-role="shuffle"]');
    const pdfBtn        = gameZone.querySelector('.mm-btn-pdf');
    const gameTitleEl   = gameZone.querySelector('.mm-game-title');
    const gridEl        = gameZone.querySelector('.mm-grid');
    const canvas        = gameZone.querySelector('.mm-correction-canvas');
    const playCanvas    = gameZone.querySelector('.mm-play-canvas');
    const wordsList     = gameZone.querySelector('.mm-words-list');
    const victoryBanner = gameZone.querySelector('.mm-victory-banner');

    // ── Compteur de mots ──────────────────────────────────────────────────
    function updateWordCount() {
        const count = wordsInput.value.split(',').map(w => w.trim()).filter(w => w.length > 0).length;
        wordCountEl.textContent = count + ' MOTS';
    }
    wordsInput.addEventListener('input', updateWordCount);

    // ── Thème rapide ──────────────────────────────────────────────────────
    themeSelector.addEventListener('change', () => {
        const key = themeSelector.value;
        if (key && MM_THEMES[key]) {
            wordsInput.value = MM_THEMES[key];
            const optText = themeSelector.options[themeSelector.selectedIndex].text;
            titleInput.value = optText.replace(/^[^\s]+\s/, '');
            updateWordCount();
        }
    });

    // ── Algorithme : vérifier placement ───────────────────────────────────
    function canPlace(word, row, col, dr, dc) {
        const lastR = row + (word.length - 1) * dr;
        const lastC = col + (word.length - 1) * dc;
        if (lastR >= _gridSize || lastR < 0 || lastC >= _gridSize || lastC < 0) return false;
        for (let i = 0; i < word.length; i++) {
            const cell = _finalGrid[row + i * dr][col + i * dc];
            if (cell !== '' && cell.char !== word[i]) return false;
        }
        return true;
    }

    // ── Algorithme : placer un mot ────────────────────────────────────────
    function placeWord(word, row, col, dr, dc) {
        for (let i = 0; i < word.length; i++) {
            _finalGrid[row + i * dr][col + i * dc] = { char: word[i], isSolution: true };
        }
        const color = MM_WORD_COLORS[_placedWords.length % MM_WORD_COLORS.length];
        _placedWords.push({
            r1: row, c1: col,
            r2: row + (word.length - 1) * dr,
            c2: col + (word.length - 1) * dc,
            word: word,
            color: color
        });
    }

    // ── Algorithme : remplir les cases vides ──────────────────────────────
    function fillEmpty() {
        for (let r = 0; r < _gridSize; r++) {
            for (let c = 0; c < _gridSize; c++) {
                if (_finalGrid[r][c] === '') {
                    _finalGrid[r][c] = {
                        char: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
                        isSolution: false
                    };
                }
            }
        }
    }

    // ── Génération de la grille ───────────────────────────────────────────
    function generateGrid() {
        const title   = titleInput.value.trim() || 'Mots Mêlés';
        const rawWords = wordsInput.value;
        _gridSize = Math.min(20, Math.max(5, parseInt(sizeInput.value) || 10));
        if (!rawWords.trim()) return;

        const words = rawWords.split(',')
            .map(w => w.trim().toUpperCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // supprimer accents
                .replace(/[^A-Z]/g, ''))
            .filter(w => w.length > 0 && w.length <= _gridSize)
            .sort(() => Math.random() - 0.5);

        _finalGrid   = Array(_gridSize).fill(null).map(() => Array(_gridSize).fill(''));
        _placedWords = [];
        _isRevealed  = false;

        const getDir = MM_DIFFICULTY_DIRECTIONS[diffSelect.value] || MM_DIFFICULTY_DIRECTIONS.easy;
        const placed = [];

        words.forEach(word => {
            let ok = false, tries = 0;
            while (!ok && tries < 200) {
                const [dr, dc] = getDir();
                const row = Math.floor(Math.random() * _gridSize);
                const col = Math.floor(Math.random() * _gridSize);
                if (canPlace(word, row, col, dr, dc)) {
                    placeWord(word, row, col, dr, dc);
                    placed.push(word);
                    ok = true;
                }
                tries++;
            }
        });

        fillEmpty();
        renderGame(title, placed);
    }

    // ── Calcul taille cellule (proportionnel W et H) ──────────────────────
    function computeCellSize() {
        const gridZone = gameZone.querySelector('.mm-grid-zone');
        const padH = 20; // padding top+bottom de mm-grid-zone
        const padW = 20; // padding left+right de mm-grid-zone

        // Largeur disponible
        const availW = (gridZone.clientWidth  || container.clientWidth  - 28) - padW;
        // Hauteur disponible (si la zone a une hauteur explicite définie)
        const zoneH   = gridZone.clientHeight || 0;
        const availH  = zoneH > padH ? zoneH - padH : Infinity;

        const csFromW = Math.floor((availW - (_gridSize - 1) * GAP) / _gridSize);
        const csFromH = availH === Infinity
            ? csFromW
            : Math.floor((availH - (_gridSize - 1) * GAP) / _gridSize);

        return Math.max(12, Math.min(csFromW, csFromH));
    }

    // ── Rendu de la zone de jeu ───────────────────────────────────────────
    function renderGame(title, words) {
        // Basculer vers la zone jeu
        setupZone.style.display  = 'none';
        setupActions.style.display = 'none';
        gameZone.style.display   = '';

        _cellSize = computeCellSize();
        const fontSize = Math.max(9, Math.floor(_cellSize * 0.52));

        // Titre
        gameTitleEl.textContent = title;

        // Grille
        gridEl.style.gridTemplateColumns = `repeat(${_gridSize}, ${_cellSize}px)`;
        gridEl.style.gap = GAP + 'px';
        gridEl.innerHTML = '';
        _finalGrid.flat().forEach((obj, idx) => {
            const cell = document.createElement('div');
            cell.className = 'mm-cell';
            cell.textContent = obj.char;
            cell.dataset.sol = obj.isSolution ? 'true' : 'false';
            cell.dataset.idx = idx;
            cell.style.cssText = `width:${_cellSize}px;height:${_cellSize}px;font-size:${fontSize}px;`;
            cell.addEventListener('click',     (e) => { e.stopPropagation(); toggleCell(cell); });
            cell.addEventListener('pointerup', (e) => { e.stopPropagation(); });
            gridEl.appendChild(cell);
        });

        // Canvas de jeu (surlignages de sélection) — au-dessus des cellules
        playCanvas.style.cssText = `position:absolute;pointer-events:none;z-index:3;top:0;left:0;`;

        // Canvas correction — au-dessus du canvas de jeu
        canvas.style.cssText = `position:absolute;pointer-events:none;z-index:4;top:0;left:0;`;

        // Liste des mots
        const sortedWords = [...words].sort((a, b) => a.localeCompare(b, 'fr'));
        wordsList.innerHTML = sortedWords.map(w =>
            `<span class="mm-word-chip" data-word="${w}">• ${w}</span>`
        ).join('');

        // Réinitialiser bannière victoire
        victoryBanner.classList.remove('show');
        revealBtn.textContent = '👁️ Correction';

        // Vider les canvas
        const ctxP = playCanvas.getContext('2d');
        ctxP.clearRect(0, 0, playCanvas.width, playCanvas.height);
        const ctxC = canvas.getContext('2d');
        ctxC.clearRect(0, 0, canvas.width, canvas.height);

        autoSave();
    }

    // ── Interaction cellule ───────────────────────────────────────────────
    function toggleCell(cell) {
        if (_isRevealed) return;
        if (cell.classList.contains('correct')) return;

        const idx = parseInt(cell.dataset.idx);

        if (cell.classList.contains('selected')) {
            cell.classList.remove('selected');
        } else {
            cell.classList.add('selected');
        }
        // Redessiner le canvas de jeu (couleurs semi-transparentes superposées)
        drawPlayCanvas();
        checkVictory();
    }

    /**
     * Canvas de jeu : dessine un surlignage semi-transparent par mot,
     * pour toutes les cellules de ce mot qui sont sélectionnées ou correctes.
     * Les lettres partagées par 2 mots reçoivent naturellement le mélange
     * des deux couleurs par superposition.
     */
    function drawPlayCanvas() {
        const cells = Array.from(gridEl.querySelectorAll('.mm-cell'));
        if (!cells.length) return;

        const zoneRect  = playCanvas.parentElement.getBoundingClientRect();
        const gridRect  = gridEl.getBoundingClientRect();

        // Caler le canvas exactement sur la grille
        playCanvas.style.left = (gridRect.left - zoneRect.left) + 'px';
        playCanvas.style.top  = (gridRect.top  - zoneRect.top)  + 'px';
        playCanvas.width  = gridRect.width;
        playCanvas.height = gridRect.height;

        const ctx = playCanvas.getContext('2d');
        ctx.clearRect(0, 0, playCanvas.width, playCanvas.height);

        const cell0Rect = cells[0].getBoundingClientRect();
        const realCell  = cell0Rect.width;

        ctx.lineWidth = realCell * 0.78;
        ctx.lineCap   = 'round';

        // Un tracé par mot — seulement si au moins une cellule est active
        _placedWords.forEach(pw => {
            const dr  = pw.r2 === pw.r1 ? 0 : (pw.r2 > pw.r1 ? 1 : -1);
            const dc  = pw.c2 === pw.c1 ? 0 : (pw.c2 > pw.c1 ? 1 : -1);
            const len = Math.max(Math.abs(pw.r2 - pw.r1), Math.abs(pw.c2 - pw.c1)) + 1;

            // Collecter les cellules actives (selected ou correct) de ce mot
            const active = [];
            for (let i = 0; i < len; i++) {
                const nr  = pw.r1 + i * dr;
                const nc  = pw.c1 + i * dc;
                const c   = cells[nr * _gridSize + nc];
                if (c && (c.classList.contains('selected') || c.classList.contains('correct'))) {
                    active.push(c);
                }
            }
            if (!active.length) return;

            // Dessiner un trait continu entre la première et la dernière cellule active
            // du mot (dans l'ordre du mot, pas de l'ordre de clic)
            const first = active[0];
            const last  = active[active.length - 1];
            const r0 = first.getBoundingClientRect();
            const r1 = last.getBoundingClientRect();
            const x1 = r0.left + r0.width  / 2 - gridRect.left;
            const y1 = r0.top  + r0.height / 2 - gridRect.top;
            const x2 = r1.left + r1.width  / 2 - gridRect.left;
            const y2 = r1.top  + r1.height / 2 - gridRect.top;

            ctx.strokeStyle = _hexToRgba(pw.color, 0.45);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
    }

    // Vérifie si la cellule (r,c) fait partie du mot placé pw
    function _cellBelongsTo(r, c, pw) {
        const dr = pw.r2 === pw.r1 ? 0 : (pw.r2 > pw.r1 ? 1 : -1);
        const dc = pw.c2 === pw.c1 ? 0 : (pw.c2 > pw.c1 ? 1 : -1);
        const len = Math.max(Math.abs(pw.r2 - pw.r1), Math.abs(pw.c2 - pw.c1)) + 1;
        for (let i = 0; i < len; i++) {
            if (pw.r1 + i * dr === r && pw.c1 + i * dc === c) return true;
        }
        return false;
    }

    // ── Vérification des mots trouvés ─────────────────────────────────────
    function checkVictory() {
        const cells = Array.from(gridEl.querySelectorAll('.mm-cell'));
        const selectedIdx = cells
            .filter(c => c.classList.contains('selected') || c.classList.contains('correct'))
            .map(c => parseInt(c.dataset.idx));
        const selSet = new Set(selectedIdx);

        _placedWords.forEach(pw => {
            const dr = pw.r2 === pw.r1 ? 0 : (pw.r2 > pw.r1 ? 1 : -1);
            const dc = pw.c2 === pw.c1 ? 0 : (pw.c2 > pw.c1 ? 1 : -1);
            const len = Math.max(Math.abs(pw.r2 - pw.r1), Math.abs(pw.c2 - pw.c1)) + 1;
            let allSelected = true;
            const wordCellsIdx = [];
            for (let i = 0; i < len; i++) {
                const r = pw.r1 + i * dr;
                const c = pw.c1 + i * dc;
                const idx = r * _gridSize + c;
                wordCellsIdx.push(idx);
                if (!selSet.has(idx)) allSelected = false;
            }
            const chip = wordsList.querySelector(`[data-word="${pw.word}"]`);
            if (allSelected) {
                if (chip) {
                    chip.classList.add('found');
                    chip.style.background = pw.color;
                }
                // Passer les cellules en état "correct" (sans couleur CSS inline)
                wordCellsIdx.forEach(idx => {
                    const cell = cells[idx];
                    if (cell) {
                        cell.classList.remove('selected');
                        cell.classList.add('correct');
                        cell.style.background  = '';
                        cell.style.borderColor = '';
                    }
                });
            } else {
                if (chip && chip.classList.contains('found')) {
                    chip.classList.remove('found');
                    chip.style.background = '';
                }
            }
        });

        // Redessiner le canvas de jeu après validation
        drawPlayCanvas();

        // Vérification victoire globale
        const allFound = Array.from(wordsList.querySelectorAll('.mm-word-chip')).every(c => c.classList.contains('found'));
        if (allFound && _placedWords.length > 0) {
            victoryBanner.classList.add('show');
        }

        autoSave();
    }

    // ── Correction ────────────────────────────────────────────────────────
    // Dessine les surlignages en mesurant la position réelle des cellules DOM.
    function drawCorrectionCanvas() {
        const cells   = Array.from(gridEl.querySelectorAll('.mm-cell'));
        if (!cells.length) return;

        // Référence : position du coin haut-gauche de la grille par rapport
        // au conteneur positionné (.mm-grid-zone)
        const zoneRect = canvas.parentElement.getBoundingClientRect();
        const gridRect = gridEl.getBoundingClientRect();

        // Caler et dimensionner le canvas exactement sur la grille
        const offX = gridRect.left - zoneRect.left;
        const offY = gridRect.top  - zoneRect.top;
        canvas.style.left = offX + 'px';
        canvas.style.top  = offY + 'px';
        canvas.width  = gridRect.width;
        canvas.height = gridRect.height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Mesurer une cellule réelle pour avoir cellSize et gap exacts
        const cell0Rect = cells[0].getBoundingClientRect();
        const realCell  = cell0Rect.width;

        ctx.lineWidth = realCell * 0.75;
        ctx.lineCap   = 'round';

        _placedWords.forEach(pw => {
            const c0 = cells[pw.r1 * _gridSize + pw.c1];
            const c1 = cells[pw.r2 * _gridSize + pw.c2];
            if (!c0 || !c1) return;
            const r0 = c0.getBoundingClientRect();
            const r1 = c1.getBoundingClientRect();
            const x1 = r0.left + r0.width  / 2 - gridRect.left;
            const y1 = r0.top  + r0.height / 2 - gridRect.top;
            const x2 = r1.left + r1.width  / 2 - gridRect.left;
            const y2 = r1.top  + r1.height / 2 - gridRect.top;
            // Convertir la couleur hex en rgba avec opacité
            ctx.strokeStyle = _hexToRgba(pw.color || '#3b82f6', 0.55);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
    }

    // Convertit une couleur hex en rgba(r,g,b,a)
    function _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function toggleReveal() {
        _isRevealed = !_isRevealed;

        if (_isRevealed) {
            revealBtn.textContent = '🙈 Cacher';
            drawCorrectionCanvas();
        } else {
            revealBtn.textContent = '👁️ Correction';
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        autoSave();
    }

    // ── getData / setData (pour save-load.js) ─────────────────────────────
    function getData() {
        const cells = Array.from(gridEl.querySelectorAll('.mm-cell'));
        const selectedIdx = cells.filter(c => c.classList.contains('selected')).map(c => parseInt(c.dataset.idx));
        const correctIdx  = cells.filter(c => c.classList.contains('correct')).map(c => parseInt(c.dataset.idx));
        return {
            // Paramètres config
            title:    titleInput.value,
            words:    wordsInput.value,
            gridSize: _gridSize,
            diff:     diffSelect.value,
            // État du jeu
            finalGrid:   _finalGrid,
            placedWords: _placedWords,
            isRevealed:  _isRevealed,
            inGame:      gameZone.style.display !== 'none',
            gameTitle:   gameTitleEl.textContent,
            selectedIdx,
            correctIdx,
            // Dimensions container
            containerW:   container.offsetWidth,
            gridZoneH:    gridZoneEl ? gridZoneEl.offsetHeight : 0
        };
    }

    function setData(d) {
        if (!d) return;
        // Restaurer les champs config
        if (d.title)    titleInput.value  = d.title;
        if (d.words)    wordsInput.value  = d.words;
        if (d.gridSize) sizeInput.value   = d.gridSize;
        if (d.diff)     diffSelect.value  = d.diff;
        updateWordCount();

        if (d.inGame && d.finalGrid && d.finalGrid.length) {
            _finalGrid   = d.finalGrid;
            _gridSize    = d.gridSize || d.finalGrid.length;
            _placedWords = d.placedWords || [];
            _isRevealed  = false;

            // Construire la liste des mots placés pour renderGame
            const wordLabels = _placedWords.map(pw => pw.word).filter(Boolean);
            renderGame(d.gameTitle || d.title || 'Mots Mêlés', wordLabels);

            // Restaurer la sélection (classes uniquement, le canvas peint les couleurs)
            if (d.selectedIdx && d.selectedIdx.length) {
                const cells = Array.from(gridEl.querySelectorAll('.mm-cell'));
                d.selectedIdx.forEach(idx => {
                    if (cells[idx]) cells[idx].classList.add('selected');
                });
            }
            if (d.correctIdx && d.correctIdx.length) {
                const cells = Array.from(gridEl.querySelectorAll('.mm-cell'));
                d.correctIdx.forEach(idx => {
                    if (cells[idx]) {
                        cells[idx].classList.remove('selected');
                        cells[idx].classList.add('correct');
                    }
                });
                // Réappliquer la couleur sur les chips trouvés
                _placedWords.forEach(pw => {
                    const dr = pw.r2 === pw.r1 ? 0 : (pw.r2 > pw.r1 ? 1 : -1);
                    const dc = pw.c2 === pw.c1 ? 0 : (pw.c2 > pw.c1 ? 1 : -1);
                    const len = Math.max(Math.abs(pw.r2 - pw.r1), Math.abs(pw.c2 - pw.c1)) + 1;
                    const allCorrect = Array.from({length: len}, (_, i) => {
                        const idx = (pw.r1 + i * dr) * _gridSize + (pw.c1 + i * dc);
                        const cells2 = Array.from(gridEl.querySelectorAll('.mm-cell'));
                        return cells2[idx] && cells2[idx].classList.contains('correct');
                    }).every(Boolean);
                    if (allCorrect) {
                        const chip = wordsList.querySelector(`[data-word="${pw.word}"]`);
                        if (chip) { chip.classList.add('found'); chip.style.background = pw.color; }
                    }
                });
            }

            // Redessiner le canvas de jeu après restauration
            requestAnimationFrame(() => drawPlayCanvas());

            // Restaurer la correction si elle était affichée
            if (d.isRevealed) requestAnimationFrame(() => { toggleReveal(); });
        }

        // Restaurer largeur container et hauteur de la zone grille
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.gridZoneH && d.gridZoneH > 0) {
            const gz = gameZone.querySelector('.mm-grid-zone');
            if (gz) gz.style.height = d.gridZoneH + 'px';
        }
    }

    // ── Export JSON (sauvegarde liste de mots) ────────────────────────────
    function exportJSON() {
        const title = titleInput.value.trim() || 'motsmeles';
        const data = {
            title: titleInput.value.trim(),
            words: wordsInput.value,
            size:  parseInt(sizeInput.value) || 10,
            diff:  diffSelect.value
        };
        const jsonStr = JSON.stringify(data, null, 2);
        // Nom de fichier
        const clean = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
        const now = new Date();
        const ds = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
        const filename = `lebureauduprof_motsmeles_${clean}_${ds}.json`;

        if (window.Android && window.Android.savePdfFromBase64) {
            const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
            window.Android.savePdfFromBase64(b64, filename);
        } else {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        }
    }

    // ── Import JSON (chargement liste de mots) ────────────────────────────
    function importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.title) titleInput.value = data.title;
                if (data.words) wordsInput.value = data.words;
                if (data.size)  sizeInput.value  = data.size;
                if (data.diff)  diffSelect.value = data.diff;
                updateWordCount();
                // Revenir à la zone de config si on était en jeu
                setupZone.style.display    = '';
                setupActions.style.display = '';
                gameZone.style.display     = 'none';
            } catch(err) {
                alert('Fichier invalide ou corrompu.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    // ── Export PDF (grille vierge + correction) ───────────────────────────
    function exportPDF() {
        if (!_finalGrid.length) return;

        // Charger jsPDF dynamiquement si besoin
        function doExport() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const title  = gameTitleEl.textContent || titleInput.value.trim() || 'Mots Mêlés';
            const words  = _placedWords.map(pw => pw.word)
                .sort((a, b) => a.localeCompare(b, 'fr'));
            const cs     = 8;   // cellSize PDF en mm
            const startX = (210 - (_gridSize * cs)) / 2;
            const startY = 40;

            // ── Page 1 : grille vierge ────────────────────────────────────
            _pdfPage(doc, title, startX, startY, cs, words, false);

            // ── Page 2 : correction ───────────────────────────────────────
            doc.addPage();
            _pdfPage(doc, title + ' (CORRECTION)', startX, startY, cs, words, true);

            // Nom de fichier
            const clean = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
            const now = new Date();
            const ds  = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
            const filename = `lebureauduprof_motsmeles_${clean}_${ds}.pdf`;

            if (window.Android && window.Android.savePdfFromBase64) {
                window.Android.savePdfFromBase64(doc.output('datauristring').split(',')[1], filename);
            } else {
                doc.save(filename);
            }
        }

        if (window.jspdf) {
            doExport();
        } else {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = doExport;
            document.head.appendChild(s);
        }
    }

    function _pdfPage(doc, title, startX, startY, cs, words, showSol) {
        // Titre
        doc.setFont('helvetica', 'bold').setFontSize(18)
           .text(title, 105, 20, { align: 'center' });

        // Traits de correction (opacité 30%)
        if (showSol) {
            doc.setGState(new doc.GState({ opacity: 0.3 }));
            doc.setDrawColor(150, 150, 150);
            doc.setLineCap('round');
            doc.setLineWidth(cs - 4);
            _placedWords.forEach(pw => {
                const x1 = startX + pw.c1 * cs + cs / 2;
                const y1 = startY + pw.r1 * cs + cs / 2;
                const x2 = startX + pw.c2 * cs + cs / 2;
                const y2 = startY + pw.r2 * cs + cs / 2;
                doc.line(x1, y1, x2, y2);
            });
            doc.setGState(new doc.GState({ opacity: 1 }));
        }

        // Cellules de la grille
        _finalGrid.forEach((row, r) => {
            row.forEach((obj, c) => {
                const x = startX + c * cs;
                const y = startY + r * cs;
                doc.setDrawColor(200).setLineWidth(0.1).rect(x, y, cs, cs);
                doc.setTextColor(0).setFont('helvetica', 'bold').setFontSize(11)
                   .text(obj.char, x + cs / 2, y + cs / 2 + 1.5, { align: 'center' });
            });
        });

        // Liste des mots à trouver
        const yList = startY + _gridSize * cs;
        doc.setTextColor(0).setFont('helvetica', 'bold').setFontSize(12)
           .text('Mots à trouver :', startX, yList + 15);
        doc.setFont('helvetica', 'normal').setFontSize(10);
        const nbPerCol = Math.ceil(words.length / 3);
        words.forEach((word, i) => {
            const col = Math.floor(i / nbPerCol);
            const row = i % nbPerCol;
            doc.text('• ' + word, startX + col * 55, yList + 22 + row * 5);
        });
    }

    // ── autoSave ──────────────────────────────────────────────────────────
    function autoSave() {
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Événements ────────────────────────────────────────────────────────

    // Helper : bloquer la propagation sur tous les types d'événements ponctuels
    // (souris, stylet, touch) pour éviter le déclenchement du drag du widget
    function _stopAll(el) {
        ['mousedown','pointerdown','touchstart'].forEach(evt =>
            el.addEventListener(evt, e => { e.stopPropagation(); }, { passive: false })
        );
    }

    // Helper : déclencher une action au tap/clic stylet
    // On utilise pointerup + click pour couvrir tous les cas
    function _onTap(el, fn) {
        el.addEventListener('click',     (e) => { e.stopPropagation(); fn(e); });
        el.addEventListener('pointerup', (e) => { e.stopPropagation(); });
    }

    _stopAll(generateBtn);
    _onTap(generateBtn, () => generateGrid());

    _stopAll(saveJsonBtn);
    _onTap(saveJsonBtn, () => exportJSON());

    fileInput.addEventListener('change', importJSON);
    // empêcher le drag sur le label Charger JSON
    _stopAll(setupActions.querySelector('.mm-btn-load-json'));

    _stopAll(backBtn);
    _onTap(backBtn, () => {
        setupZone.style.display    = '';
        setupActions.style.display = '';
        gameZone.style.display     = 'none';
        autoSave();
    });

    _stopAll(revealBtn);
    _onTap(revealBtn, () => toggleReveal());

    _stopAll(shuffleBtn);
    _onTap(shuffleBtn, () => generateGrid());

    _stopAll(pdfBtn);
    _onTap(pdfBtn, () => exportPDF());

    // Champs de saisie : bloquer la propagation + autoriser focus au stylet
    [titleInput, wordsInput, sizeInput, diffSelect, themeSelector].forEach(el => {
        ['mousedown','pointerdown','touchstart','click'].forEach(evt =>
            el.addEventListener(evt, e => { e.stopPropagation(); }, { passive: false })
        );
        // S'assurer que le focus fonctionne avec le stylet
        el.addEventListener('pointerup', (e) => { e.stopPropagation(); el.focus(); });
    });

    // Aide
    _stopAll(helpBtn);
    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Boutons fenêtre (min/max/close) ───────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _isMax = false;
    let _savedContainerW = null;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '🔍 Mots Mêlés', {});
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedContainerW = container.style.width;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedContainerW) container.style.width = _savedContainerW;
            }
        });
    }
    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // Resize handle — largeur ET hauteur
    const gridZoneEl = gameZone.querySelector('.mm-grid-zone');

    function _doResize(dx, dy) {
        const newW = Math.max(280, _resizeStartW + dx);
        container.style.width = newW + 'px';
        if (gameZone.style.display !== 'none' && _resizeStartGZH > 0) {
            const newGZH = Math.max(80, _resizeStartGZH + dy);
            gridZoneEl.style.height = newGZH + 'px';
        }
    }

    let _resizeStartW = 0, _resizeStartGZH = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        _resizeStartW   = container.offsetWidth;
        _resizeStartGZH = gridZoneEl.offsetHeight;
        const startX = e.clientX, startY = e.clientY;
        document.onmousemove = (ev) => _doResize(ev.clientX - startX, ev.clientY - startY);
        document.onmouseup   = () => { document.onmousemove = null; autoSave(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        _resizeStartW   = container.offsetWidth;
        _resizeStartGZH = gridZoneEl.offsetHeight;
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        function onMove(ev) {
            const t = ev.touches[0];
            _doResize(t.clientX - startX, t.clientY - startY);
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            autoSave();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Focus / bringToFront (souris + stylet)
    function _widgetActivate(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.tagName === 'LABEL') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    }
    widget.addEventListener('mousedown',   _widgetActivate);
    widget.addEventListener('pointerdown', _widgetActivate);

    // ── Rafraîchir la mise en page des cellules après resize ─────────────
    function refreshGridLayout() {
        if (!_finalGrid.length || gameZone.style.display === 'none') return;
        _cellSize = computeCellSize();
        const fontSize = Math.max(9, Math.floor(_cellSize * 0.52));
        const cells = Array.from(gridEl.querySelectorAll('.mm-cell'));
        gridEl.style.gridTemplateColumns = `repeat(${_gridSize}, ${_cellSize}px)`;
        cells.forEach(cell => {
            cell.style.width    = _cellSize + 'px';
            cell.style.height   = _cellSize + 'px';
            cell.style.fontSize = fontSize + 'px';
        });
        if (_isRevealed) {
            requestAnimationFrame(() => drawCorrectionCanvas());
        }
        requestAnimationFrame(() => drawPlayCanvas());
    }

    // Redessiner / recalculer si le widget est redimensionné
    if (typeof ResizeObserver !== 'undefined') {
        const _ro = new ResizeObserver(() => {
            refreshGridLayout();
            if (_isRevealed) requestAnimationFrame(() => drawCorrectionCanvas());
        });
        _ro.observe(container);
    }

    // ── Init ──────────────────────────────────────────────────────────────
    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Exposer getData/setData pour save-load.js
    widget._mmGetData = getData;
    widget._mmSetData = setData;

    // Restaurer ou initialiser
    if (savedData) {
        requestAnimationFrame(() => requestAnimationFrame(() => setData(savedData)));
    }

    saveBoard();
    return widget;
}
