// =========================================================================
// WIDGET MOTS ALPHABÉTIQUES — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'mots-alpha'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-mots-alpha.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('mots-alpha');closeMainMenu()">
//          <span class="mm-ico">🔤</span>Ordre Alphabétique
//      </div>
// =========================================================================

(function () {

    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w => w !== widget && w.querySelector('.wf-mini-bar'));
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
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
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // ── CSS injecté une seule fois ────────────────────────────────────────
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

    if (!document.getElementById('widget-mots-alpha-style')) {
        const s = document.createElement('style');
        s.id = 'widget-mots-alpha-style';
        s.textContent = `
        /* ── Widget transparent comme monnaie ── */
        .widget[data-type="mots-alpha"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .alpha-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
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
            /* height libre, fixée par JS via resize */
        }

        /* La zone de dépôt s'étire pour occuper l'espace supplémentaire ;
           la zone des mots à classer garde une hauteur liée à son contenu */
        .alpha-pool-zone {
            flex: 0 0 auto;
            min-height: 46px;
        }
        .alpha-drop-zone {
            flex: 1;
            min-height: 46px;
        }

        /* ── En-tête ── */
        .alpha-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .alpha-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }

        /* ── État réduit alpha ── */
        .alpha-container.wf-minimized > *:not(.alpha-header) { display: none !important; }
        .alpha-container.wf-minimized { gap: 0; }

        /* ── État plein écran board alpha ── */
        .alpha-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 40px !important;
        }

        /* ── État plein écran, adapté au téléphone ──
           Les onglets latéraux (Jeux, Activités, etc. — voir
           style-phone.css) débordent d'environ 33px sur le bord gauche
           de l'écran même en fullboard ; on garde une marge suffisante
           pour ne pas les recouvrir, et on tient compte des zones sûres
           (encoche / barre d'accueil) et de la barre du bas de l'app. */
        .alpha-container.wf-fullboard.jti-mobile {
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }
        .alpha-level-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .alpha-level-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .alpha-level-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .alpha-level-badge.difficile { background: #f8d7da; color: #842029; }

        /* ── Badge numéro de liste ── */
        .alpha-list-badge {
            font-size: 10px;
            font-weight: 700;
            color: #6b7280;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            padding: 2px 8px;
            white-space: nowrap;
            pointer-events: none;
        }

        /* ── Sélecteur de liste ── */
        .alpha-list-select-wrap {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .alpha-list-label {
            font-size: 10px;
            font-weight: 700;
            color: #666;
        }
        .alpha-list-select {
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 700;
            color: #374151;
            cursor: pointer;
            max-width: 110px;
        }
        .alpha-list-select:hover { background: #e0e0e0; }

        /* ── Contrôles ── */
        .alpha-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .alpha-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .alpha-btn:active { transform: scale(0.96); }
        .alpha-btn-new   { background: #4a90e2; color: white; }
        .alpha-btn-new:hover   { background: #357abd; }
        .alpha-btn-check { background: #4a90e2; color: white; margin-left: 30px; }
        .alpha-btn-check:hover { background: #357abd; }
        .alpha-btn-show  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .alpha-btn-show:hover  { background: #e0e0e0; }
        .alpha-btn-show.revealed { background: #28a745; color: white; border-color: #28a745; }

        /* ── Boutons niveau ── */
        .alpha-level-btns { display: flex; gap: 4px; margin-left: auto; }
        .alpha-lvl-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd;
            background: #f5f5f5; font-size: 10px; font-weight: 700;
            cursor: pointer; color: #666; transition: background .15s;
        }
        .alpha-lvl-btn:hover { background: #e0e0e0; }
        .alpha-lvl-btn.active-facile    { background: #d4edda; color: #1a7a3a; border-color: #a3d4b0; }
        .alpha-lvl-btn.active-moyen     { background: #fff3cd; color: #8a5c00; border-color: #ffd97a; }
        .alpha-lvl-btn.active-difficile { background: #f8d7da; color: #842029; border-color: #f5a8ae; }

        /* ── Zone des mots mélangés ── */
        .alpha-pool-zone {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            justify-content: center;
            align-content: center;
            transition: background .15s, border-color .15s;
        }
        .alpha-pool-zone.drag-over { background: #f0f0f0; border-color: #9ca3af; }

        /* ── Zone réponse : grille fixe 6 colonnes, 1 seule ligne qui occupe toute la hauteur ── */
        .alpha-drop-zone {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: 1fr;
            gap: 6px;
            padding: 8px;
            background: #f0f7ff;
            border: 1.5px dashed #93c5fd;
            border-radius: 10px;
            transition: background .15s, border-color .15s;
        }
        .alpha-drop-zone.drag-over { background: #dbeafe; border-color: #3b82f6; border-style: solid; }

        /* ── Slot individuel : remplit toute la hauteur de sa ligne ── */
        .alpha-answer-slot {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 4px 4px 6px;
            border-radius: 8px;
            background: white;
            border: 1.5px dashed #bfdbfe;
            transition: background .15s, border-color .15s;
            min-height: 40px;
            box-sizing: border-box;
            overflow: hidden;
        }
        .alpha-answer-slot.drag-over-slot {
            background: #dbeafe;
            border-color: #3b82f6;
            border-style: solid;
        }
        .alpha-slot-num {
            font-size: 9px;
            font-weight: 800;
            color: #93c5fd;
            line-height: 1;
            flex-shrink: 0;
        }

        /* ── Étiquette mot — taille fixée par JS via --alpha-fs ── */
        .alpha-word-card {
            padding: 0.35em 0.8em;
            border-radius: 6px;
            font-size: var(--alpha-fs, 13px);
            font-weight: 700;
            cursor: grab;
            user-select: none;
            background: white;
            border: 1.5px solid #d1d5db;
            color: #374151;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            white-space: nowrap;
            transition: box-shadow .12s, border-color .12s;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .alpha-word-card:hover { border-color: #f59e0b; box-shadow: 0 3px 8px rgba(245,158,11,0.2); }
        .alpha-word-card.is-dragging { opacity: 0.3; }
        .alpha-word-card.correct { border-color: #28a745; background: #f0fff4; color: #1a7a3a; cursor: default; }
        .alpha-word-card.wrong   { border-color: #dc3545; background: #fff5f5; color: #9c1c28; animation: alpha-shake 0.35s ease; }

        /* ── Fantôme drag ── */
        .alpha-drag-ghost {
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            padding: 0.35em 0.8em;
            border-radius: 6px;
            font-weight: 700;
            background: #f59e0b;
            color: white;
            border: 1.5px solid #d97706;
            box-shadow: 0 6px 18px rgba(245,158,11,0.45);
            transform: translate(-50%, -50%) rotate(2deg);
            white-space: nowrap;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Zone résultat ── */
        .alpha-result-zone {
            display: flex; align-items: center; gap: 8px;
            min-height: 28px; flex-wrap: wrap;
        }
        .alpha-result-text {
            font-size: 22px; font-weight: 800; color: #28a745;
            opacity: 0; transition: opacity .3s;
        }
        .alpha-result-text.show { opacity: 1; }
        .alpha-correction-text {
            font-size: 11px; color: #374151;
            background: #f8f9fa; border: 1px solid #e5e7eb;
            border-radius: 7px; padding: 4px 10px;
            display: none; flex: 1; line-height: 1.5;
        }
        .alpha-correction-text.show { display: block; }

        /* ── Bouton aide ── */
        .alpha-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .alpha-help-btn:hover { background: #e0e0e0; color: #333; }

        /* ── Popup aide ── */
        .alpha-help-popup {
            display: none; position: absolute;
            top: 36px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 260px;
            font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .alpha-help-popup.show { display: block; }
        .alpha-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .alpha-help-popup .help-level {
            margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;
        }
        .alpha-help-popup .help-level:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .alpha-help-badge {
            display: inline-block; font-size: 9px; font-weight: 700;
            padding: 1px 6px; border-radius: 10px; text-transform: uppercase;
            margin-right: 4px; vertical-align: middle;
        }
        .alpha-help-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .alpha-help-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .alpha-help-badge.difficile { background: #f8d7da; color: #842029; }

        /* ── Consigne ── */
        .alpha-consigne { font-size: 11px; color: #888; font-style: italic; }

        /* ── Poignée resize ── */
        .alpha-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .alpha-container:hover .alpha-resize-handle { opacity: 1; }

        @keyframes alpha-shake {
            0%,100% { transform: translateX(0); }
            25%      { transform: translateX(-4px); }
            75%      { transform: translateX(4px); }
        }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-mots-alpha';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="alpha-container">

  <!-- En-tête -->
  <div class="alpha-header">
    <span class="alpha-title">🔤 L'ordre alphabétique</span>
    <span class="alpha-level-badge facile">😊 Facile</span>
    <span class="alpha-list-badge">📋 Liste 1/20</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="alpha-help-btn" title="Aide sur les niveaux">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="alpha-controls">
    <button class="alpha-btn alpha-btn-new">🔄 Nouveau</button>
    <button class="alpha-btn alpha-btn-show">👁 Voir la correction</button>
    <div class="alpha-list-select-wrap">
      <label class="alpha-list-label">📋 Liste</label>
      <select class="alpha-list-select"></select>
    </div>
    <div class="alpha-level-btns">
      <button class="alpha-lvl-btn active-facile" data-level="1">😊 Facile</button>
      <button class="alpha-lvl-btn"               data-level="2">😐 Moyen</button>
      <button class="alpha-lvl-btn"               data-level="3">😤 Difficile</button>
    </div>
  </div>

  <!-- Mots à classer -->
  <div class="alpha-consigne">Glisse les mots dans les cases pour les classer par ordre alphabétique :</div>
  <div class="alpha-pool-zone"></div>

  <!-- Cases de réponse -->
  <div class="alpha-drop-zone"></div>

  <!-- Résultat + vérification -->
  <div class="alpha-result-zone">
    <button class="alpha-btn alpha-btn-check">✔ Vérifier</button>
    <span class="alpha-result-text"></span>
    <div class="alpha-correction-text"></div>
  </div>

  <!-- Popup aide -->
  <div class="alpha-help-popup">
    <h4>💡 Les niveaux de jeu</h4>
    <div class="help-level">
      <span class="alpha-help-badge facile">😊 Facile</span><br>
      Les 6 mots commencent par des lettres différentes.<br>
      Il suffit de regarder la 1ère lettre.
    </div>
    <div class="help-level">
      <span class="alpha-help-badge moyen">😐 Moyen</span><br>
      Les 6 mots partagent la même initiale.<br>
      Il faut regarder la 2e ou 3e lettre.
    </div>
    <div class="help-level">
      <span class="alpha-help-badge difficile">😤 Difficile</span><br>
      Les mots partagent les 3 premières lettres.<br>
      La différence est à la 4e ou 5e lettre.
    </div>
  </div>

  <!-- Poignée resize -->
  <div class="alpha-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // BANQUES DE MOTS PAR NIVEAU
    // =========================================================================

    // Niveau facile : 20 listes numérotées de 6 mots, tous d'initiales différentes
    const WORDS_LVL1_GROUPS = [
        ['avion','banane','cerise','datte','étoile','forêt'],
        ['girafe','hibou','iris','jardin','lune','mouton'],
        ['neige','orange','papillon','renard','savane','tulipe'],
        ['univers','vague','wagon','xylophone','yacht','zèbre'],
        ['arbre','bateau','cheval','dauphin','écureuil','fusée'],
        ['gâteau','herbe','image','jungle','lapin','maison'],
        ['nuage','ourson','puma','ruche','sable','tigre'],
        ['koala','quiche','valise','robot','soleil','tortue'],
        ['ananas','ballon','canard','dessin','éléphant','fleur'],
        ['guitare','hérisson','insecte','jouet','livre','marmotte'],
        ['nid','oiseau','plume','queue','sapin','trompette'],
        ['usine','volcan','wombat','xénon','yourte','zircon'],
        ['armoire','biscuit','citron','domino','escargot','fraise'],
        ['grenouille','hutte','île','jonquille','lampe','montagne'],
        ['noisette','orage','panda','radis','souris','tambour'],
        ['kangourou','quartier','uniforme','verre','week-end','zéphyr'],
        ['abeille','brosse','coccinelle','drapeau','épée','feuille'],
        ['genou','hache','ketchup','licorne','melon','navire'],
        ['ombre','poire','requin','sirène','toboggan','vélo'],
        ['gorille','journal','kiwi','moto','plage','train'],
    ];

    // Niveau moyen : 20 listes numérotées, 6 mots partageant la même initiale
    const WORDS_LVL2_GROUPS = [
        ['balcon','bateau','bison','bleu','bonbon','brevet'],
        ['cabane','cactus','canard','castor','cerise','coton'],
        ['daim','datte','décor','dessin','dîner','domino'],
        ['fable','facile','famille','faucon','feuille','forêt'],
        ['galère','garçon','gâteau','genou','girafe','gorille'],
        ['jardin','jasmin','jeton','joli','jouet','jungle'],
        ['labyrinthe','lacet','lagon','lampe','lapin','larme'],
        ['machine','madame','maison','maman','manche','marché'],
        ['nappe','natation','navire','neige','nénuphar','nœud'],
        ['palais','panda','papier','paquet','pardon','pastel'],
        ['radis','ragot','raison','rampe','rapide','rasoir'],
        ['sabot','sable','safari','salade','sanglier','sapin'],
        ['tabac','tablier','tacite','taille','talon','tambour'],
        ['valeur','valise','vampire','vapeur','varié','vase'],
        ['wagon','walrus','wapiti','warcraft','wasabi','wombat'],
        ['abeille','acacia','agneau','aigle','ananas','armoire'],
        ['écharpe','éléphant','émotion','épée','escalier','étoile'],
        ['habit','herbe','hibou','horloge','humain','hyène'],
        ['objet','oiseau','ombre','orage','ourson','olive'],
        ['idée','île','image','igloo','insecte','iris'],
    ];

    // Niveau difficile : 20 listes numérotées, 6 mots partageant les 3 premières lettres
    const WORDS_LVL3_GROUPS = [
        ['abricot','abrité','abreuver','abrupt','abréviation','abricotier'],
        ['charmant','charnière','charbon','charpente','charrue','chartreuse'],
        ['complet','complice','compliment','complot','composer','comprendre'],
        ['courber','courbure','coureur','courir','couronne','courroie'],
        ['drapeau','draper','drastique','dragon','dragée','dragueur'],
        ['escalier','escargot','escorte','esclave','escroc','espace'],
        ['fabricant','fabriquer','fabuleux','fabriquer','fable','fabrication'],
        ['flambeau','flamber','flamme','flambant','flamboyant','flambée'],
        ['glorieux','gloire','global','glissement','glouton','gloussement'],
        ['marché','mardi','marée','marginal','marina','marionnette'],
        ['partir','partout','partage','partenaire','parterre','participe'],
        ['planche','planète','planifier','planton','plantation','planquer'],
        ['premier','prendre','prénom','présent','presque','prêter'],
        ['serveur','service','servile','servant','servante','serviette'],
        ['trancher','tranche','transit','transporter','transaction','transparent'],
        ['garçon','garage','garantie','garder','gare','gardien'],
        ['poupée','poulain','poulet','poumon','poupe','pouce'],
        ['cheval','chemin','chemise','chercher','cheveu','chèvre'],
        ['classe','clair','clairière','clameur','clapier','claquer'],
        ['montagne','monde','monnaie','montage','montre','monument'],
    ];

    // =========================================================================
    // UTILITAIRES
    // =========================================================================

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    const GROUPS_BY_LEVEL = {
        1: WORDS_LVL1_GROUPS,
        2: WORDS_LVL2_GROUPS,
        3: WORDS_LVL3_GROUPS,
    };
    const LISTS_PER_LEVEL = 20;

    // listIndex : index 0-based de la liste voulue, ou null/undefined pour un tirage aléatoire
    // Retourne { words, listIndex } pour pouvoir afficher le numéro de liste utilisé
    function pickWords(level, listIndex) {
        const groups = GROUPS_BY_LEVEL[level];
        const idx = (listIndex === null || listIndex === undefined || isNaN(listIndex))
            ? Math.floor(Math.random() * groups.length)
            : Math.max(0, Math.min(groups.length - 1, listIndex));
        const group = groups[idx];
        return { words: shuffle(group).slice(0, 6), listIndex: idx };
    }

    function sortAlpha(words) {
        return words.slice().sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }

    const LEVEL_INFO = {
        1: { key: 'facile',    label: '😊 Facile',    badgeClass: 'facile'    },
        2: { key: 'moyen',     label: '😐 Moyen',     badgeClass: 'moyen'     },
        3: { key: 'difficile', label: '😤 Difficile', badgeClass: 'difficile' },
    };

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initMotsAlphaWidget = function (widget) {

        const container    = widget.querySelector('.alpha-container');
        const badge        = widget.querySelector('.alpha-level-badge');
        const newBtn       = widget.querySelector('.alpha-btn-new');
        const showBtn      = widget.querySelector('.alpha-btn-show');
        const checkBtn     = widget.querySelector('.alpha-btn-check');
        const lvlBtns      = widget.querySelectorAll('.alpha-lvl-btn');
        const wordsPool    = widget.querySelector('.alpha-pool-zone');
        const dropZone     = widget.querySelector('.alpha-drop-zone');
        const resultText   = widget.querySelector('.alpha-result-text');
        const corrText     = widget.querySelector('.alpha-correction-text');
        const helpBtn      = widget.querySelector('.alpha-help-btn');
        const helpPopup    = widget.querySelector('.alpha-help-popup');
        const resizeHandle = widget.querySelector('.alpha-resize-handle');
        const listSelect   = widget.querySelector('.alpha-list-select');
        const listBadge    = widget.querySelector('.alpha-list-badge');

        let currentLevel     = 1;
        let currentWords     = [];
        let solutionOrder    = [];
        let correctionShown  = false;
        let currentListIndex = null;
        // Mémorise la liste choisie (ou 'random') séparément pour chaque niveau
        const selectByLevel  = { 1: 'random', 2: 'random', 3: 'random' };

        // ── Remplit le sélecteur de liste (1 à 20 + Aléatoire) ────────────
        if (listSelect) {
            let optsHtml = '<option value="random">🎲 Aléatoire</option>';
            for (let i = 0; i < LISTS_PER_LEVEL; i++) {
                optsHtml += '<option value="' + i + '">Liste ' + (i + 1) + '</option>';
            }
            listSelect.innerHTML = optsHtml;
            listSelect.addEventListener('click', (e) => e.stopPropagation());
            listSelect.addEventListener('change', () => {
                selectByLevel[currentLevel] = listSelect.value;
                newGame();
            });
        }

        // ── Affiche le numéro de la liste utilisée ────────────────────────
        function updateListBadge() {
            if (listBadge && currentListIndex !== null) {
                listBadge.textContent = '📋 Liste ' + (currentListIndex + 1) + '/' + LISTS_PER_LEVEL;
            }
        }

        // ── Taille de police de référence (à 540px de large) ─────────────
        const BASE_W   = 540;
        const BASE_FS  = 13;   // px à BASE_W
        const MIN_FS   = 9;
        const MAX_FS   = 28;

        // ── Recalcule la font-size des étiquettes selon la largeur ────────
        function applyCardScale() {
            const w  = container.offsetWidth || BASE_W;
            // Scale proportionnel à la largeur du widget
            let fs = Math.max(MIN_FS, Math.min(MAX_FS, Math.round(BASE_FS * w / BASE_W)));
            container.style.setProperty('--alpha-fs', fs + 'px');
            container.style.setProperty('--alpha-ghost-fs', fs + 'px');

            // Vérifie que le mot le plus long tient bien dans une case de la zone
            // de dépôt (6 colonnes de largeur égale) ; sinon on réduit la police.
            const slot = dropZone.querySelector('.alpha-answer-slot');
            if (slot) {
                const slotStyle = getComputedStyle(slot);
                const slotContentWidth = slot.clientWidth
                    - parseFloat(slotStyle.paddingLeft || 0) - parseFloat(slotStyle.paddingRight || 0);

                let maxCardWidth = 0;
                widget.querySelectorAll('.alpha-word-card').forEach(c => {
                    maxCardWidth = Math.max(maxCardWidth, c.scrollWidth);
                });

                if (maxCardWidth > 0 && slotContentWidth > 0 && maxCardWidth > slotContentWidth) {
                    const ratio = slotContentWidth / maxCardWidth;
                    fs = Math.max(MIN_FS, Math.floor(fs * ratio * 0.95));
                    container.style.setProperty('--alpha-fs', fs + 'px');
                    container.style.setProperty('--alpha-ghost-fs', fs + 'px');
                }
            }
        }

        // ── Changement de niveau ─────────────────────────────────────────
        function setLevel(level) {
            currentLevel = level;
            const info = LEVEL_INFO[level];
            badge.className = 'alpha-level-badge ' + info.badgeClass;
            badge.textContent = info.label;
            lvlBtns.forEach(b => {
                b.className = 'alpha-lvl-btn';
                if (parseInt(b.dataset.level) === level) b.classList.add('active-' + info.key);
            });
            if (listSelect) listSelect.value = selectByLevel[level];
            newGame();
        }

        lvlBtns.forEach(btn => {
            btn.addEventListener('click', () => setLevel(parseInt(btn.dataset.level)));
        });

        // ── Nouvelle partie ──────────────────────────────────────────────
        function newGame() {
            correctionShown = false;
            showBtn.textContent = '👁 Voir la correction';
            showBtn.classList.remove('revealed');
            resultText.textContent = '';
            resultText.classList.remove('show');
            corrText.textContent = '';
            corrText.classList.remove('show');

            const requested  = selectByLevel[currentLevel];
            const listIndex  = (requested === 'random') ? null : parseInt(requested, 10);
            const result     = pickWords(currentLevel, listIndex);
            currentWords     = result.words;
            currentListIndex = result.listIndex;
            solutionOrder = sortAlpha(currentWords);
            renderPool(shuffle(currentWords));
            renderDropZone();
            updateListBadge();
            applyCardScale();
        }

        // ── Rendu pool ───────────────────────────────────────────────────
        function renderPool(words) {
            wordsPool.innerHTML = '';
            words.forEach(w => wordsPool.appendChild(makeCard(w)));
        }

        // ── Rendu drop-zone (6 slots, 1 ligne garantie par grid CSS) ─────
        function renderDropZone() {
            dropZone.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const slot = document.createElement('div');
                slot.className = 'alpha-answer-slot';
                slot.dataset.slotIndex = i;
                const num = document.createElement('span');
                num.className = 'alpha-slot-num';
                num.textContent = i + 1;
                slot.appendChild(num);
                dropZone.appendChild(slot);
            }
        }

        // ── Créer une étiquette ──────────────────────────────────────────
        function makeCard(word) {
            const card = document.createElement('div');
            card.className = 'alpha-word-card';
            card.textContent = word;
            card.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                startDrag(card, e.clientX, e.clientY);
            });
            card.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                startDrag(card, e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: false });
            return card;
        }

        // ── Drag souris maison ───────────────────────────────────────────
        function startDrag(card, startX, startY) {
            const originSlot = card.closest('.alpha-answer-slot') || null;

            const ghost = document.createElement('div');
            ghost.className = 'alpha-drag-ghost';
            ghost.textContent = card.textContent;
            const fs = getComputedStyle(container).getPropertyValue('--alpha-fs').trim() || '13px';
            ghost.style.fontSize = fs;
            ghost.style.left = startX + 'px';
            ghost.style.top  = startY + 'px';
            document.body.appendChild(ghost);

            card.classList.add('is-dragging');
            dropZone.classList.add('drag-over');
            wordsPool.classList.add('drag-over');

            function onMove(e) {
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                ghost.style.left = cx + 'px';
                ghost.style.top  = cy + 'px';
                dropZone.querySelectorAll('.alpha-answer-slot').forEach(s => s.classList.remove('drag-over-slot'));
                const el   = document.elementFromPoint(cx, cy);
                const slot = el && el.closest('.alpha-answer-slot');
                if (slot) slot.classList.add('drag-over-slot');
            }

            function onUp(e) {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend',  onUp);
                ghost.remove();
                card.classList.remove('is-dragging');
                dropZone.classList.remove('drag-over');
                wordsPool.classList.remove('drag-over');
                dropZone.querySelectorAll('.alpha-answer-slot').forEach(s => s.classList.remove('drag-over-slot'));

                const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
                const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
                const el         = document.elementFromPoint(cx, cy);
                const targetSlot = el && el.closest('.alpha-answer-slot');
                const targetPool = el && el.closest('.alpha-pool-zone');

                if (targetSlot) {
                    const existing = targetSlot.querySelector('.alpha-word-card');
                    if (originSlot) {
                        if (existing) originSlot.appendChild(existing);
                    } else {
                        if (existing) wordsPool.appendChild(existing);
                    }
                    targetSlot.appendChild(card);
                } else if (targetPool) {
                    if (originSlot) wordsPool.appendChild(card);
                } else {
                    if (originSlot) originSlot.appendChild(card);
                }
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend',  onUp);
        }

        // ── Vérifier ─────────────────────────────────────────────────────
        function checkAnswer() {
            const slots = dropZone.querySelectorAll('.alpha-answer-slot');
            const playerOrder = [];
            slots.forEach(slot => {
                const card = slot.querySelector('.alpha-word-card');
                if (card) playerOrder.push(card.textContent);
            });

            if (playerOrder.length < 6 || wordsPool.querySelector('.alpha-word-card')) {
                resultText.textContent = '⚠️ Place tous les mots !';
                resultText.style.color = '#e67e22';
                resultText.classList.add('show');
                corrText.classList.remove('show');
                return;
            }

            const isCorrect = playerOrder.every((w, i) =>
                w.toLowerCase() === solutionOrder[i].toLowerCase()
            );

            corrText.classList.remove('show');
            if (isCorrect) {
                resultText.textContent = '✅ Bravo !';
                resultText.style.color = '#28a745';
                resultText.classList.add('show');
                slots.forEach(slot => {
                    const card = slot.querySelector('.alpha-word-card');
                    if (card) { card.classList.remove('wrong'); card.classList.add('correct'); }
                });
            } else {
                resultText.textContent = '❌ Essaie encore !';
                resultText.style.color = '#dc3545';
                resultText.classList.add('show');
                slots.forEach((slot, i) => {
                    const card = slot.querySelector('.alpha-word-card');
                    if (card) {
                        card.classList.remove('correct', 'wrong');
                        card.classList.add(
                            card.textContent.toLowerCase() === solutionOrder[i]?.toLowerCase()
                                ? 'correct' : 'wrong'
                        );
                    }
                });
            }
        }

        // ── Voir / cacher la correction ───────────────────────────────────
        function toggleCorrection() {
            if (!correctionShown) {
                correctionShown = true;
                corrText.textContent = '📋 Ordre : ' + solutionOrder.join(' → ');
                corrText.classList.add('show');
                showBtn.textContent = '🙈 Cacher';
                showBtn.classList.add('revealed');
            } else {
                correctionShown = false;
                corrText.classList.remove('show');
                showBtn.textContent = '👁 Voir la correction';
                showBtn.classList.remove('revealed');
            }
        }

        // ── Aide ─────────────────────────────────────────────────────────
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('show'));

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null;
        let _isMin = false, _isMax = false;

        if (wfMin) {
            wfMin.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMax) wfMax.click();
                window._wfMiniBarCollapse(widget, "🔤 L'ordre alphabétique", {
                    onExpand: applyCardScale
                });
            });
        }

        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMin) { _isMin = false; container.classList.remove('wf-minimized'); }
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    _savedH = container.style.height;
                    if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                        container.classList.add('jti-mobile');
                    }
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jti-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                applyCardScale();
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

        // ── Events boutons ────────────────────────────────────────────────
        newBtn.addEventListener('click',   newGame);
        showBtn.addEventListener('click',  toggleCorrection);
        checkBtn.addEventListener('click', checkAnswer);

        // ── Resize 2D ────────────────────────────────────────────────────
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth;
            const startH = container.offsetHeight;

            document.onmousemove = (ev) => {
                const newW = Math.max(320, startW + ev.clientX - startX);
                const newH = Math.max(200, startH + ev.clientY - startY);
                container.style.width  = newW + 'px';
                container.style.height = newH + 'px';
                applyCardScale();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                if (typeof saveBoard === 'function') saveBoard();
            };
        });
        resizeHandle.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation();
            const t0 = e.touches[0];
            const startX = t0.clientX, startY = t0.clientY;
            const startW = container.offsetWidth;
            const startH = container.offsetHeight;
            function onMove(ev) {
                const t = ev.touches[0];
                const newW = Math.max(320, startW + t.clientX - startX);
                const newH = Math.max(200, startH + t.clientY - startY);
                container.style.width  = newW + 'px';
                container.style.height = newH + 'px';
                applyCardScale();
            }
            function onEnd() {
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend',  onEnd);
                if (typeof saveBoard === 'function') saveBoard();
            }
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend',  onEnd);
        }, { passive: false });

        // ── Init ──────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            setLevel(1);
            // Sur téléphone, ouvrir directement en plein écran board (le
            // widget n'a pas de taille par défaut adaptée à un petit écran).
            // Sur PC, il garde sa taille normale, comme avant.
            if (typeof isMobileBoardMode === 'function' && isMobileBoardMode() && wfMax) {
                wfMax.click();
            } else {
                // Le widget s'ouvre à 100px du bord gauche du board.
                const curW = window.innerWidth;
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }
            applyCardScale();
        }));
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'mots-alpha') initMotsAlphaWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'mots-alpha') initMotsAlphaWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
