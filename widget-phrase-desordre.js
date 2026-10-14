// =========================================================================
// WIDGET « PHRASE EN DÉSORDRE » (activité) — Le Bureau du Prof
// Panneau « Activités » › rubrique « Activités de français »
//
// Graphisme repris du widget Nature grammaticale (carte blanche, en-tête,
// paramètres ⚙, aide ?, réduire / plein écran / fermer, redimensionnement
// libre) et fonctionnement repris du jeu « Phrase en désordre ».
//
// Les mots d'une phrase sont mélangés : l'élève les remet dans l'ordre
// (clic ou glisser-déposer). Le prof peut choisir le niveau, activer ou non
// les indices (majuscule + point), ou saisir ses propres phrases.
//
// Ouverture   : createWidget('phrase-desordre')  ou  createPhraseDesordreWidget()
// Sauvegarde  : widget._pdsGetData()  (appelé par save-load.js → pdsData)
// Restauration: createPhraseDesordreWidget(pdsData)
// =========================================================================

(function () {

    // ── Mini-barre collapse (partagée avec les autres widgets) ─────────────
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
            expandBtn.addEventListener('pointerup', (e) => {
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

    // ── Boutons fenêtre (CSS partagé) ──────────────────────────────────────
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

    // ── CSS du widget (préfixe pds-) ───────────────────────────────────────
    if (!document.getElementById('widget-phrase-desordre-style')) {
        const s = document.createElement('style');
        s.id = 'widget-phrase-desordre-style';
        s.textContent = `
        .widget[data-type="phrase-desordre"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .pds-container {
            --pds-fs: 15px;
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
            min-width: 400px;
            min-height: 300px;
            outline: none;
        }
        .pds-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── En-tête ── */
        .pds-header {
            display: flex; align-items: center; gap: 8px;
            cursor: move; user-select: none; flex-shrink: 0;
        }
        .pds-title {
            font-size: 13px; font-weight: 800; color: #374151;
            letter-spacing: 0.3px; pointer-events: none; white-space: nowrap;
        }
        .pds-round-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 13px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0; padding: 0;
            transition: background .15s;
        }
        .pds-round-btn:hover { background: #e0e0e0; color: #333; }
        .pds-round-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .pds-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 330px; max-height: calc(100% - 60px); overflow-y: auto;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
            user-select: text;
        }
        .pds-help-popup.show { display: block; }
        .pds-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .pds-help-popup p { margin: 0 0 6px; }
        .pds-help-popup .pds-help-sub { margin: 0 0 8px; font-weight: 700; color: #374151; }

        /* ── Panneau paramètres ── */
        .pds-params-panel {
            background: #f8f9fa; border: 1px solid #e5e7eb;
            border-radius: 10px; padding: 10px 14px;
            display: none; flex-direction: column; gap: 8px; flex-shrink: 0;
        }
        .pds-params-panel.show { display: flex; }
        .pds-params-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .pds-params-title { font-size: 11px; font-weight: 700; color: #374151; min-width: 62px; }
        .pds-pill {
            display: flex; align-items: center; gap: 5px;
            padding: 4px 10px; border-radius: 20px;
            border: 1.5px solid transparent; cursor: pointer;
            font-size: 11px; font-weight: 600; font-family: inherit;
            transition: all .15s; user-select: none; opacity: 0.45;
        }
        .pds-pill:hover { opacity: 1; }
        .pds-pill.checked { border-color: currentColor; opacity: 1; }
        .pds-pill[data-level="1"] { background: #e8f5e9; color: #2e7d32; }
        .pds-pill[data-level="2"] { background: #fff3e0; color: #e65100; }
        .pds-pill[data-level="3"] { background: #fce4ec; color: #880e4f; }
        .pds-pill[data-clues]     { background: #e0f0ff; color: #1565c0; }
        .pds-pill[data-src]       { background: #f3e5f5; color: #6a1b9a; }
        .pds-custom-section {
            border-top: 1px solid #e5e7eb; padding-top: 8px;
            display: flex; flex-direction: column; gap: 6px;
        }
        .pds-custom-hint { font-size: 10px; color: #9ca3af; font-style: italic; }
        .pds-custom-text {
            width: 100%; box-sizing: border-box; min-height: 70px; resize: vertical;
            padding: 6px 10px; border-radius: 7px; border: 1px solid #d1d5db;
            font-size: 12px; font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; transition: border-color .15s; user-select: text;
        }
        .pds-custom-text:focus { border-color: #4a90e2; }
        .pds-apply-btn {
            padding: 5px 14px; border-radius: 7px; border: none;
            background: #4a90e2; color: white; font-size: 11px;
            font-weight: 700; cursor: pointer; transition: background .15s;
            white-space: nowrap; align-self: flex-start;
        }
        .pds-apply-btn:hover { background: #357abd; }

        /* ── Ligne d'infos (progression + score) ── */
        .pds-info {
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex-shrink: 0;
            font-size: 12px; font-weight: 700; color: #374151;
        }
        .pds-counter { white-space: nowrap; }
        .pds-dots { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
        .pds-dot { width: 11px; height: 11px; border-radius: 50%; background: #e5e7eb; }
        .pds-dot.good { background: #2f8f48; }
        .pds-dot.meh  { background: #f59e0b; }
        .pds-dot.current { background: #bfdbfe; box-shadow: 0 0 0 2px #4a90e2; }
        .pds-chips { margin-left: auto; display: flex; gap: 6px; }
        .pds-chip {
            background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 20px;
            padding: 2px 10px; font-size: 12px; font-weight: 800; color: #374151; white-space: nowrap;
        }
        .pds-chip.hot { background: #ffedd5; border-color: #fdba74; color: #9a3412; }

        /* ── Zone de travail ── */
        .pds-stage {
            flex: 1; min-height: 0; overflow: auto;
            display: flex; flex-direction: column; gap: 8px;
        }
        .pds-zone-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.5px; flex-shrink: 0;
        }
        .pds-zone-label.line-lbl { color: #92400e; }
        .pds-zone-label.pool-lbl { color: #1565c0; }
        .pds-line {
            display: flex; flex-wrap: wrap; gap: 8px; align-items: center; align-content: flex-start;
            padding: 12px; background: #fffbea; border: 1.5px solid #fde68a;
            border-radius: 10px; min-height: calc(var(--pds-fs) * 3.4); flex-shrink: 0;
            transition: background .15s, border-color .15s;
        }
        .pds-line.over { background: #fff3c4; border-color: #f59e0b; }
        .pds-pool {
            display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
            align-items: center; align-content: flex-start;
            padding: 12px; background: #f5faff; border: 1.5px dashed #90caf9;
            border-radius: 10px; min-height: calc(var(--pds-fs) * 3.4); flex: 1;
            transition: background .15s;
        }
        .pds-pool.over { background: #e8f0fb; }
        .pds-empty {
            font-size: calc(var(--pds-fs) * 0.8); color: #9ca3af; font-style: italic; font-weight: 600;
        }

        /* Étiquettes-mots */
        .pds-word {
            position: relative;
            padding: 0.3em 0.75em; border-radius: 6px;
            font-size: calc(var(--pds-fs) * 1.25); font-weight: 700; line-height: 1.2;
            cursor: grab; user-select: none; touch-action: none;
            background: white; border: 1.5px solid #d1d5db; color: #374151;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10); white-space: nowrap;
            transition: opacity .2s, border-color .12s, box-shadow .12s, background .2s;
        }
        .pds-word:hover { border-color: #f59e0b; box-shadow: 0 3px 8px rgba(245,158,11,0.2); }
        .pds-word.punct { background: #fef3c7; color: #92400e; border-color: #fcd34d; min-width: 1.2em; text-align: center; }
        .pds-word.cap::first-letter { color: #d02f6e; }
        .pds-word.locked { cursor: default; border-style: dashed; }
        .pds-word.locked::after {
            content: '📌'; position: absolute; top: -0.7em; right: -0.45em; font-size: 0.6em;
        }
        .pds-word.is-dragging { opacity: 0.25; }
        .pds-word.ok  { border: 3px solid #2f8f48 !important; background: #f0fdf4; }
        .pds-word.ko  { border: 3px solid #d92323 !important; background: #fef2f2; animation: pds-shake .5s ease; }
        .pds-word.hinted { box-shadow: 0 0 0 3px #f59e0b; }
        @keyframes pds-in { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pds-word.in { animation: pds-in .18s ease-out; }
        @keyframes pds-shake {
            0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); }
        }
        .pds-caret {
            width: 4px; height: calc(var(--pds-fs) * 1.9); border-radius: 2px;
            background: #4a90e2; box-shadow: 0 0 6px #4a90e2; flex-shrink: 0;
        }
        .pds-drag-ghost {
            position: fixed; pointer-events: none; z-index: 99999;
            padding: 0.3em 0.9em; border-radius: 6px; font-weight: 700;
            background: #f59e0b; color: white; border: 1.5px solid #d97706;
            box-shadow: 0 6px 18px rgba(245,158,11,0.45);
            transform: translate(-50%, -50%) rotate(2deg);
            white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .pds-stage.done .pds-word { cursor: default; }

        /* ── Message ── */
        .pds-msg {
            flex-shrink: 0; padding: 7px 12px; border-radius: 8px;
            background: #f8f9fa; border-left: 4px solid #4a90e2;
            font-size: calc(var(--pds-fs) * 0.85); font-weight: 600; color: #374151; line-height: 1.4;
            min-height: 1.4em;
        }
        .pds-msg.good { background: #f0fdf4; border-left-color: #2f8f48; }
        .pds-msg.bad  { background: #fef2f2; border-left-color: #d92323; }
        .pds-msg b { font-weight: 800; }

        /* ── Contrôles ── */
        .pds-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0; }
        .pds-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;
            transition: background .15s, transform .1s, opacity .15s;
            background: #e5e7eb; color: #374151;
        }
        .pds-btn:hover { background: #d1d5db; }
        .pds-btn:active { transform: scale(0.96); }
        .pds-btn:disabled { opacity: 0.45; cursor: default; }
        .pds-btn-reset { background: #6b7280; color: white; }
        .pds-btn-reset:hover { background: #4b5563; }
        .pds-btn-check { background: #4a90e2; color: white; }
        .pds-btn-check:hover { background: #357abd; }
        .pds-btn-next  { background: #2f8f48; color: white; }
        .pds-btn-next:hover { background: #237038; }
        .pds-stars { font-size: 18px; letter-spacing: 2px; }

        /* ── Poignée resize ── */
        .pds-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
            touch-action: none;
        }
        .pds-container:hover .pds-resize-handle { opacity: 1; }
        .pds-container.wf-fullboard .pds-resize-handle { display: none; }

        @media (prefers-reduced-motion: reduce) {
            .pds-container *, .pds-container *::before, .pds-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // PHRASES — un seul ordre correct ; un autre ordre juste est donné après « | »
    // =========================================================================
    const PDS_SENTENCES = {
        1: [
            'Le chien court vite.', 'Ma sœur lit un livre.', 'Papa prépare le repas.', 'Les oiseaux chantent le matin.',
            'Tom mange une pomme.', 'La maîtresse écrit au tableau.', 'Le soleil brille fort.', 'Nous jouons au ballon.',
            'Mon chat aime le lait.', 'Les enfants rient beaucoup.', 'Léa dessine une maison.', 'Le bébé dort bien.',
            'Le lapin mange une carotte.', 'Maman chante une chanson.', 'Le train arrive en gare.', 'Les fleurs sont jolies.',
            'Je range ma chambre.', 'Le poisson nage vite.', 'Il fait très beau.', 'Tu as un joli vélo.',
        ],
        2: [
            'Le petit chien joue dans la cour.', 'Où as-tu caché le trésor ?', 'Quelle belle journée d\'été !',
            'La grenouille saute dans la mare.', 'Mon grand frère joue du piano.', 'Veux-tu venir jouer avec moi ?',
            'Le boulanger vend du pain frais.', 'Les vaches mangent l\'herbe du pré.', 'Attention au chien méchant !',
            'Julie a perdu sa trousse rouge.', 'Le pompier éteint un grand feu.', 'Pourquoi le ciel est-il bleu ?',
            'Les feuilles tombent en automne.', 'Mon oncle habite dans une grande ville.',
            'Nous partons à la mer demain.|Nous partons demain à la mer.',
            'Les élèves écoutent la maîtresse attentivement.|Les élèves écoutent attentivement la maîtresse.',
            'Mes parents regardent un film ce soir.', 'Quel gâteau délicieux !', 'As-tu fini ton dessin ?',
        ],
        3: [
            'Le vieux marin raconte des histoires de pirates.',
            'Les petits oiseaux construisent leur nid dans le grand arbre.',
            'Mon cousin a reçu un vélo pour son anniversaire.',
            'La sorcière prépare une potion magique dans son chaudron.|La sorcière prépare une potion dans son chaudron magique.',
            'Est-ce que tu as fini tes devoirs de mathématiques ?',
            'Les astronautes ont marché sur la lune.',
            'Ma grand-mère prépare une délicieuse tarte aux pommes.',
            'Nous avons visité un château très ancien.',
            'Quel magnifique arc-en-ciel apparaît dans le ciel !',
            'Le facteur apporte une lettre à mes voisins.',
            'Les dauphins nagent rapidement dans la mer bleue.|Les dauphins nagent dans la mer bleue rapidement.',
            'Combien de bonbons as-tu mangés ce matin ?',
            'Le petit prince habite sur une planète lointaine.',
            'Mon chien adore courir après les pigeons du parc.',
            'Les pompiers sont arrivés très vite sur place.',
            'Mes amis et moi construisons une cabane dans la forêt.',
            'La maîtresse nous lit une histoire chaque matin.',
            'Pourquoi les feuilles des arbres tombent-elles en automne ?',
        ],
    };
    const PROPER = ['Tom', 'Léa', 'Julie', 'Léo'];
    const PUNCT = ['.', '!', '?', '…'];
    const LEVEL_LABELS = { 1: '😊 Facile', 2: '😐 Moyen', 3: '😤 Difficile' };
    const ROUND_SIZE = 8;
    const LABEL = '🔀 Phrase en désordre';

    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    // « Où as-tu caché le trésor ? » → ['Où', 'as-tu', 'caché', 'le', 'trésor', '?']
    function tokenize(sentence) {
        const s = String(sentence).trim().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
        const m = s.match(/^(.*?)\s*([.!?…])$/);
        if (m && m[1]) return m[1].split(' ').filter(Boolean).concat([m[2]]);
        return s.split(' ').filter(Boolean);
    }
    function joinTokens(tokens) {
        return tokens.join(' ').replace(/ ([.…])/g, '$1').replace(/ ([!?])/g, ' $1');
    }
    // Lignes saisies par le prof → phrases utilisables (au moins 2 étiquettes)
    function parseCustom(text) {
        return String(text || '').split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l && l.split('|').every(v => tokenize(v).length >= 2));
    }

    // ── Lecture à voix haute ───────────────────────────────────────────────
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function speak(text) {
        if (!canSpeak) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'fr-FR'; u.rate = 0.85;
            const v = window.speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang));
            if (v) u.voice = v;
            window.speechSynthesis.speak(u);
        } catch (e) { /* lecture indisponible */ }
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createPhraseDesordreWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'phrase-desordre';
        widget.dataset.transparent = 'true';
        widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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

        const container = document.createElement('div');
        container.className = 'pds-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="pds-header">
            <span class="pds-title">${LABEL}</span>
            <div class="wf-btns" style="margin-left:auto">
              <button class="pds-round-btn" data-role="params" title="Paramètres">⚙</button>
              <button class="pds-round-btn" data-role="help" title="Aide" style="font-size:12px">?</button>
              <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
              <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
              <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
            </div>
          </div>

          <div class="pds-params-panel">
            <div class="pds-params-row">
              <span class="pds-params-title">Niveau :</span>
              <button class="pds-pill checked" data-level="1">😊 Facile</button>
              <button class="pds-pill" data-level="2">😐 Moyen</button>
              <button class="pds-pill" data-level="3">😤 Difficile</button>
            </div>
            <div class="pds-params-row">
              <span class="pds-params-title">Indices :</span>
              <button class="pds-pill checked" data-clues="on">🔎 Avec indices</button>
              <button class="pds-pill" data-clues="off">🙈 Sans indices</button>
            </div>
            <div class="pds-params-row">
              <span class="pds-params-title">Phrases :</span>
              <button class="pds-pill checked" data-src="bank">📚 Banque du widget</button>
              <button class="pds-pill" data-src="custom">✍️ Mes phrases</button>
            </div>
            <div class="pds-custom-section">
              <div class="pds-params-title">✍️ Mes phrases (une par ligne) :</div>
              <div class="pds-custom-hint">Exemple : « Le chat dort sur le canapé. » — Si un autre ordre est aussi juste, ajoutez-le après une barre « | ».</div>
              <textarea class="pds-custom-text" placeholder="Le chat dort sur le canapé.&#10;Où vas-tu ce matin ?"></textarea>
              <button class="pds-apply-btn">Valider mes phrases</button>
            </div>
          </div>

          <div class="pds-info">
            <span class="pds-counter"></span>
            <div class="pds-dots"></div>
            <div class="pds-chips">
              <span class="pds-chip" data-role="streak" title="Phrases réussies du premier coup d'affilée">🔥 0</span>
              <span class="pds-chip" data-role="score" title="Points">⭐ 0</span>
            </div>
          </div>

          <div class="pds-stage">
            <div class="pds-zone-label line-lbl">✏️ Ma phrase</div>
            <div class="pds-line"></div>
            <div class="pds-zone-label pool-lbl">🧺 Les mots en désordre</div>
            <div class="pds-pool"></div>
          </div>

          <div class="pds-msg"></div>

          <div class="pds-controls">
            <button class="pds-btn pds-btn-reset" data-act="reset">🔄 Recommencer</button>
            <button class="pds-btn pds-btn-check" data-act="check">✔ Vérifier</button>
            <button class="pds-btn pds-btn-next"  data-act="next" style="display:none">Phrase suivante ▶</button>
            <button class="pds-btn" data-act="hint">💡 Indice</button>
            <button class="pds-btn" data-act="listen">🔊 Écouter</button>
            <button class="pds-btn" data-act="clear">↩ Tout enlever</button>
            <button class="pds-btn" data-act="skip">⏭ Passer</button>
            <span class="pds-stars"></span>
          </div>

          <div class="pds-help-popup">
            <h4>💡 Comment utiliser ce widget ?</h4>
            <p class="pds-help-sub">⚙ Le bouton Paramètres</p>
            <p><b>Niveau</b> — <i>Facile</i> : phrases courtes, le premier mot et le point sont déjà placés 📌. <i>Moyen</i> : questions et exclamations. <i>Difficile</i> : phrases longues.</p>
            <p><b>Indices</b> — Avec indices, le premier mot garde sa <b>majuscule</b> et le <b>point</b> (. ! ?) est donné. Sans indices, la majuscule et le point disparaissent.</p>
            <p><b>✍️ Mes phrases</b> — Écrivez vos propres phrases, une par ligne, puis cliquez sur <b>Valider mes phrases</b>. Si un autre ordre est aussi correct, écrivez-le après une barre « | ». Choisissez <b>📚 Banque du widget</b> pour revenir aux phrases intégrées.</p>
            <p class="pds-help-sub" style="margin-top:10px">🎮 Comment jouer ?</p>
            <p>Les mots d'une phrase sont mélangés. <b>Clique</b> sur un mot pour l'ajouter à la phrase, clique sur un mot de la phrase pour le retirer. Tu peux aussi <b>faire glisser</b> les mots pour les ranger où tu veux.</p>
            <p>Clique sur <b>✔ Vérifier</b> (ou touche Entrée) : les mots bien placés s'entourent en vert, les autres en rouge.</p>
            <p>💡 <b>Indice</b> place le bon mot suivant, 🔊 <b>Écouter</b> lit la phrase à voix haute. ⭐⭐⭐ si tu réussis du premier coup sans aide.</p>
            <p style="margin:0;font-style:italic;color:#888">Le widget se redimensionne avec la poignée en bas à droite.</p>
          </div>

          <div class="pds-resize-handle"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const paramsBtn   = $('[data-role="params"]');
        const paramsPanel = $('.pds-params-panel');
        const helpBtn     = $('[data-role="help"]');
        const helpPopup   = $('.pds-help-popup');
        const customText  = $('.pds-custom-text');
        const applyBtn    = $('.pds-apply-btn');
        const counterEl   = $('.pds-counter');
        const dotsEl      = $('.pds-dots');
        const streakEl    = $('[data-role="streak"]');
        const scoreEl     = $('[data-role="score"]');
        const stage       = $('.pds-stage');
        const lineEl      = $('.pds-line');
        const poolEl      = $('.pds-pool');
        const msg         = $('.pds-msg');
        const starsEl     = $('.pds-stars');
        const resizeHandle = $('.pds-resize-handle');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let level = 1, clues = true, useCustom = false, customRaw = '';
        let queue = [], qi = 0, results = [];
        let answers = [];            // ordres acceptés (listes de textes)
        let tokens = [];             // { id, text, punct, locked }
        let line = [], pool = [];    // ids
        let errors = 0, hints = 0;
        let score = 0, streak = 0, roundStars = 0, lastStars = 0;
        let phase = 'play';          // 'play' | 'won' | 'final'

        const persist = () => { if (typeof saveBoard === 'function') saveBoard(); };

        // ── Helper tap stylet (pointer-safe), comme Nature grammaticale ────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (eu.type === 'pointerup' && Math.sqrt(dx * dx + dy * dy) < 12) {
                        eu.stopPropagation();
                        if (!el.disabled) handler(eu);
                    }
                }
                el.addEventListener('pointerup',     onUp);
                el.addEventListener('pointercancel', onUp);
            });
            el.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        // ── Taille de police proportionnelle ───────────────────────────────
        function applyFontScale() {
            const w  = container.offsetWidth || 800;
            const fs = Math.max(12, Math.min(34, Math.round(15 * w / 800)));
            container.style.setProperty('--pds-fs', fs + 'px');
        }

        // ── Affichages ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'pds-msg' + (mood ? ' ' + mood : '');
        }
        function updateInfo() {
            const total = queue.length;
            counterEl.textContent = phase === 'final'
                ? `Partie terminée (${total} phrase${total > 1 ? 's' : ''})`
                : `Phrase ${Math.min(qi + 1, total)} / ${total}`;
            dotsEl.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const d = document.createElement('span');
                d.className = 'pds-dot' + (results[i] ? ' ' + results[i] : '') + (i === qi && !results[i] && phase !== 'final' ? ' current' : '');
                dotsEl.appendChild(d);
            }
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
        }
        function updateButtons() {
            const playing = phase === 'play';
            btn('check').style.display = playing ? '' : 'none';
            btn('next').style.display  = playing ? 'none' : '';
            btn('next').textContent = phase === 'final' ? '🔄 Nouvelle partie'
                : (qi >= queue.length - 1 ? '🏁 Fin de la partie' : 'Phrase suivante ▶');
            btn('check').disabled  = pool.length > 0;
            ['hint', 'clear', 'skip'].forEach(a => btn(a).disabled = !playing);
            btn('listen').style.display = canSpeak ? '' : 'none';
            btn('listen').disabled = phase === 'final';
            starsEl.textContent = phase === 'won' ? '⭐'.repeat(lastStars) + '☆'.repeat(3 - lastStars) : '';
        }
        const tok = (id) => tokens.find(t => t.id === id);
        function wordEl(t, where) {
            const el = document.createElement('div');
            el.className = 'pds-word' + (t.punct ? ' punct' : '') + (t.locked ? ' locked' : '')
                + (clues && !t.punct && /^[A-ZÀ-ÖØ-Þ]/.test(t.text) ? ' cap' : '');
            el.textContent = t.text;
            el.dataset.id = t.id;
            el.dataset.where = where;
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                if (!t.locked) startDrag(e, t, el);
            });
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            return el;
        }
        function render(justId) {
            lineEl.innerHTML = '';
            poolEl.innerHTML = '';
            if (phase === 'final') {
                lineEl.innerHTML = '<span class="pds-empty">Partie terminée 🎉</span>';
                poolEl.innerHTML = '<span class="pds-empty">Clique sur « Nouvelle partie » pour rejouer.</span>';
                updateButtons(); updateInfo();
                return;
            }
            if (!line.length) lineEl.innerHTML = '<span class="pds-empty">Clique sur les mots dans l\'ordre pour écrire ta phrase…</span>';
            line.forEach(id => { const el = wordEl(tok(id), 'line'); if (id === justId) el.classList.add('in'); if (phase === 'won') el.classList.add('ok'); lineEl.appendChild(el); });
            if (!pool.length) poolEl.innerHTML = phase === 'won'
                ? '<span class="pds-empty">Bravo ! 🎉</span>'
                : '<span class="pds-empty">Tous les mots sont placés : clique sur ✔ Vérifier !</span>';
            pool.forEach(id => { const el = wordEl(tok(id), 'pool'); if (id === justId) el.classList.add('in'); poolEl.appendChild(el); });
            stage.classList.toggle('done', phase !== 'play');
            updateButtons();
            updateInfo();
        }

        // ── Déplacements ───────────────────────────────────────────────────
        function lockBounds() {
            const first = line.length && tok(line[0]).locked ? 1 : 0;
            const last = line.length > 1 && tok(line[line.length - 1]).locked ? line.length - 1 : line.length;
            return [first, last];
        }
        function putInLine(id, at) {
            pool = pool.filter(x => x !== id);
            line = line.filter(x => x !== id);
            const [lo, hi] = lockBounds();
            if (at === undefined || at > hi) at = hi;
            if (at < lo) at = lo;
            line.splice(at, 0, id);
        }
        function putInPool(id) {
            line = line.filter(x => x !== id);
            if (!pool.includes(id)) pool.push(id);
        }
        function clearMarks() { container.querySelectorAll('.pds-word.ok, .pds-word.ko').forEach(el => el.classList.remove('ok', 'ko')); }

        // Glisser-déposer (ou simple clic)
        function startDrag(e, t, el) {
            if (phase !== 'play') return;
            e.preventDefault();
            container.focus({ preventScroll: true });
            const sx = e.clientX, sy = e.clientY;
            let ghost = null, caret = null, target = null;
            const from = el.dataset.where;
            const onMove = (ev) => {
                if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
                    ghost = document.createElement('div');
                    ghost.className = 'pds-drag-ghost';
                    ghost.textContent = t.text;
                    ghost.style.fontSize = getComputedStyle(el).fontSize;
                    document.body.appendChild(ghost);
                    el.classList.add('is-dragging');
                    caret = document.createElement('div');
                    caret.className = 'pds-caret';
                }
                if (!ghost) return;
                ghost.style.left = ev.clientX + 'px';
                ghost.style.top = ev.clientY + 'px';
                const hit = document.elementFromPoint(ev.clientX, ev.clientY);
                const inLine = hit && hit.closest('.pds-line') === lineEl;
                const inPool = hit && hit.closest('.pds-pool') === poolEl;
                lineEl.classList.toggle('over', !!inLine);
                poolEl.classList.toggle('over', !!inPool);
                if (caret.parentNode) caret.remove();
                target = null;
                if (inLine) {
                    const els = Array.from(lineEl.querySelectorAll('.pds-word')).filter(w => w !== el);
                    let idx = els.length, before = null;
                    for (let i = 0; i < els.length; i++) {
                        const r = els[i].getBoundingClientRect();
                        const sameRow = ev.clientY >= r.top - 8 && ev.clientY <= r.bottom + 8;
                        if ((sameRow && ev.clientX < r.left + r.width / 2) || ev.clientY < r.top - 8) { idx = i; before = els[i]; break; }
                    }
                    target = { zone: 'line', at: idx, ids: els.map(w => w.dataset.id) };
                    if (before) lineEl.insertBefore(caret, before); else lineEl.appendChild(caret);
                } else if (inPool) target = { zone: 'pool' };
            };
            const onUp = (ev) => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                document.removeEventListener('pointercancel', onUp);
                lineEl.classList.remove('over'); poolEl.classList.remove('over');
                clearMarks();
                if (!ghost) {
                    if (ev.type === 'pointercancel') return;
                    // Simple clic : aller-retour entre la réserve et la phrase
                    if (from === 'pool') putInLine(t.id); else putInPool(t.id);
                    render(t.id); persist();
                    return;
                }
                ghost.remove();
                if (caret && caret.parentNode) caret.remove();
                if (target && target.zone === 'line') {
                    line = line.filter(x => x !== t.id);
                    pool = pool.filter(x => x !== t.id);
                    const anchorId = target.ids[target.at];
                    const at = anchorId ? line.indexOf(anchorId) : line.length;
                    putInLine(t.id, at < 0 ? undefined : at);
                } else if (target && target.zone === 'pool') {
                    putInPool(t.id);
                }
                render(t.id); persist();
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onUp);
        }

        // ── Nouvelle phrase ────────────────────────────────────────────────
        function buildSentence() {
            const raw = queue[qi];
            answers = raw.split('|').map(v => {
                let tk = tokenize(v);
                if (!clues) {
                    tk = tk.filter(x => !PUNCT.includes(x));
                    if (!PROPER.includes(tk[0])) tk[0] = tk[0].charAt(0).toLowerCase() + tk[0].slice(1);
                }
                return tk;
            });
            tokens = answers[0].map((text, i) => ({ id: 'w' + i, text, punct: PUNCT.includes(text), locked: false }));
        }
        function loadSentence() {
            buildSentence();
            line = []; pool = [];
            if (level === 1 && clues && tokens.length > 2) {
                tokens[0].locked = true;
                line = [tokens[0].id];
                const last = tokens[tokens.length - 1];
                if (last.punct) { last.locked = true; line.push(last.id); }
            }
            const rest = tokens.filter(t => !line.includes(t.id)).map(t => t.id);
            let mixed, tries = 0;
            do { mixed = shuffle(rest); tries++; } while (rest.length > 1 && mixed.join() === rest.join() && tries < 20);
            pool = mixed;
            errors = 0; hints = 0; phase = 'play'; lastStars = 0;
            render();
            const n = queue.length;
            say(level === 1 && clues && tokens.length > 2
                ? `🦉 Phrase ${qi + 1} sur ${n}. Le premier mot${tokens[tokens.length - 1].locked ? ' et le point sont' : ' est'} déjà placé${tokens[tokens.length - 1].locked ? 's' : ''} 📌 : range les autres mots !`
                : clues
                    ? `🦉 Phrase ${qi + 1} sur ${n}. Cherche le mot avec une <b>majuscule</b> pour commencer, et garde le <b>point</b> pour la fin !`
                    : `🦉 Phrase ${qi + 1} sur ${n}. Sans indices : lis bien tous les mots avant de commencer.`);
        }
        function newRound() {
            if (useCustom) {
                const list = parseCustom(customRaw);
                if (list.length) queue = list.slice();
                else { useCustom = false; syncPills(); }
            }
            if (!useCustom) queue = shuffle(PDS_SENTENCES[level]).slice(0, ROUND_SIZE);
            qi = 0; results = []; roundStars = 0;
            loadSentence();
            persist();
        }

        // ── Vérification ───────────────────────────────────────────────────
        function currentTexts() { return line.map(id => tok(id).text); }
        function check() {
            if (phase !== 'play' || pool.length) return;
            const cur = currentTexts();
            const match = answers.find(a => a.join('\u0001') === cur.join('\u0001'));
            if (match) return win(match);
            errors++;
            streak = 0;
            const best = answers.map(a => ({ a, n: a.filter((w, i) => cur[i] === w).length })).sort((x, y) => y.n - x.n)[0].a;
            lineEl.querySelectorAll('.pds-word').forEach((el, i) => el.classList.add(cur[i] === best[i] ? 'ok' : 'ko'));
            const nGood = best.filter((w, i) => cur[i] === w).length;
            let tip = '';
            if (clues && cur[0] !== best[0]) tip = ' Le premier mot doit avoir une <b>majuscule</b>.';
            else if (clues && PUNCT.includes(best[best.length - 1]) && cur[cur.length - 1] !== best[best.length - 1]) tip = ' Le <b>point</b> se met toujours à la fin.';
            else if (errors >= 2) tip = ' Lis ta phrase à voix basse : est-ce qu\'elle veut dire quelque chose ?';
            say(`🤔 Pas encore ! <b>${nGood}</b> mot${nGood > 1 ? 's' : ''} sur ${best.length} ${nGood > 1 ? 'sont' : 'est'} à la bonne place (en vert).${tip}${errors >= 3 ? ' Besoin d\'aide ? Essaie 💡.' : ''}`, 'bad');
            updateInfo();
            persist();
        }
        function win(ans) {
            const st = errors === 0 && hints === 0 ? 3 : errors + hints <= 2 ? 2 : 1;
            const perfect = st === 3;
            streak = perfect ? streak + 1 : 0;
            const pts = st * 10 + (streak >= 3 ? 5 : 0);
            score += pts; roundStars += st; lastStars = st;
            results[qi] = perfect ? 'good' : 'meh';
            phase = 'won';
            render();
            say(`🎉 ${rnd(['Bravo', 'Parfait', 'Super', 'Excellent', 'Génial'])} ! « <b>${esc(joinTokens(ans))}</b> » +${pts} points${streak >= 3 ? ' 🔥' : ''}`, 'good');
            persist();
        }
        function finalScreen() {
            const max = queue.length * 3;
            const medal = roundStars >= max - 2 ? '🥇' : roundStars >= Math.round(max * 0.6) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'As de la phrase !' : medal === '🥈' ? 'Très beau travail !' : 'Partie terminée !';
            phase = 'final';
            render();
            say(`${medal} <b>${title}</b> ${roundStars} ⭐ sur ${max} · ${score} points.`, 'good');
            persist();
        }
        function next() {
            if (canSpeak) window.speechSynthesis.cancel();
            if (phase === 'final') { newRound(); return; }
            if (qi >= queue.length - 1) finalScreen();
            else { qi++; loadSentence(); persist(); }
        }

        // ── Aides ──────────────────────────────────────────────────────────
        function giveHint() {
            if (phase !== 'play') return;
            clearMarks();
            const ans = answers[0];
            const cur = currentTexts();
            let i = 0;
            while (i < ans.length && cur[i] === ans[i]) i++;
            if (i >= ans.length) { say('💡 Ta phrase est déjà dans le bon ordre : clique sur ✔ Vérifier !'); return; }
            const all = pool.concat(line.slice(i));
            const id = all.find(x => tok(x).text === ans[i] && !tok(x).locked);
            if (!id) return;
            hints++;
            line.slice(i).forEach(x => { if (!tok(x).locked) putInPool(x); });
            putInLine(id, i);
            render(id);
            const el = lineEl.querySelector(`[data-id="${id}"]`);
            if (el) el.classList.add('hinted');
            say(`💡 Le mot n°${i + 1} est « <b>${esc(ans[i])}</b> ».`);
            persist();
        }

        makeTap(btn('check'), check);
        makeTap(btn('next'), next);
        makeTap(btn('hint'), giveHint);
        makeTap(btn('listen'), () => {
            if (phase === 'final') return;
            if (phase === 'play') hints++;
            speak(joinTokens(answers[0]));
            if (phase === 'play') say('🔊 Écoute bien la phrase, puis range les mots dans le même ordre.');
            persist();
        });
        makeTap(btn('clear'), () => {
            if (phase !== 'play') return;
            line.slice().forEach(id => { if (!tok(id).locked) putInPool(id); });
            clearMarks(); render(); persist();
        });
        makeTap(btn('skip'), () => {
            if (phase !== 'play') return;
            results[qi] = 'meh'; streak = 0;
            const sol = `⏭ La phrase était : « <b>${esc(joinTokens(answers[0]))}</b> »`;
            if (qi >= queue.length - 1) { finalScreen(); say(sol + '<br>' + msg.innerHTML, 'good'); }
            else { qi++; loadSentence(); say(sol); }
            persist();
        });
        makeTap(btn('reset'), () => { streak = 0; newRound(); });

        // ── Paramètres ─────────────────────────────────────────────────────
        function syncPills() {
            container.querySelectorAll('.pds-pill[data-level]').forEach(p => p.classList.toggle('checked', +p.dataset.level === level));
            container.querySelectorAll('.pds-pill[data-clues]').forEach(p => p.classList.toggle('checked', (p.dataset.clues === 'on') === clues));
            container.querySelectorAll('.pds-pill[data-src]').forEach(p => p.classList.toggle('checked', (p.dataset.src === 'custom') === useCustom));
        }
        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        paramsPanel.addEventListener('mousedown', (e) => e.stopPropagation());
        container.querySelectorAll('.pds-pill[data-level]').forEach(p => makeTap(p, () => {
            level = +p.dataset.level || 1; streak = 0; syncPills(); newRound();
        }));
        container.querySelectorAll('.pds-pill[data-clues]').forEach(p => makeTap(p, () => {
            clues = p.dataset.clues === 'on'; streak = 0; syncPills(); newRound();
        }));
        container.querySelectorAll('.pds-pill[data-src]').forEach(p => makeTap(p, () => {
            const wantCustom = p.dataset.src === 'custom';
            if (wantCustom) {
                customRaw = customText.value;
                if (!parseCustom(customRaw).length) {
                    say('✍️ Écris d\'abord tes phrases (une par ligne, au moins 2 mots) dans le cadre « Mes phrases ».', 'bad');
                    customText.focus();
                    return;
                }
            }
            useCustom = wantCustom; streak = 0; syncPills(); newRound();
        }));
        customText.addEventListener('pointerdown', (e) => e.stopPropagation());
        customText.addEventListener('mousedown', (e) => e.stopPropagation());
        customText.addEventListener('keydown', (e) => e.stopPropagation());
        customText.addEventListener('input', () => { customRaw = customText.value; persist(); });
        makeTap(applyBtn, () => {
            customRaw = customText.value;
            const list = parseCustom(customRaw);
            if (!list.length) {
                say('✍️ Aucune phrase valable : écris une phrase par ligne, avec au moins 2 mots.', 'bad');
                return;
            }
            useCustom = true; streak = 0; syncPills(); newRound();
            say(`✅ ${list.length} phrase${list.length > 1 ? 's' : ''} enregistrée${list.length > 1 ? 's' : ''}. ` + msg.innerHTML, 'good');
        });

        // ── Aide ───────────────────────────────────────────────────────────
        makeTap(helpBtn, () => helpPopup.classList.toggle('show'));
        helpPopup.addEventListener('pointerdown', (e) => e.stopPropagation());
        const closeHelp = (e) => {
            if (!widget.isConnected) { document.removeEventListener('pointerdown', closeHelp); return; }
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
        };
        document.addEventListener('pointerdown', closeHelp);

        // ── Clavier : Entrée = vérifier / suivant, Retour arrière = retirer ──
        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT') return;
            if (e.key === 'Enter') {
                e.preventDefault();
                if (phase === 'play') check(); else next();
            } else if (e.key === 'Backspace' && phase === 'play') {
                e.preventDefault(); e.stopPropagation();
                const [lo, hi] = lockBounds();
                if (hi > lo) { putInPool(line[hi - 1]); render(); persist(); }
            }
        };
        document.addEventListener('keydown', onKey);

        // ── Boutons fenêtre ────────────────────────────────────────────────
        const wfMin = $('[data-role="wf-min"]'), wfMax = $('[data-role="wf-max"]'), wfClose = $('[data-role="wf-close"]');
        let _savedW = null, _savedH = null, _isMax = false;
        function setMax(on) {
            if (on === _isMax) return;
            _isMax = on;
            if (_isMax) {
                _savedW = container.style.width;
                _savedH = container.style.height;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                container.style.width  = _savedW || '';
                container.style.height = _savedH || '';
            }
            applyFontScale();
            container.focus({ preventScroll: true });
        }
        makeTap(wfMin, () => {
            if (_isMax) setMax(false);
            window._wfMiniBarCollapse(widget, LABEL, { onExpand: applyFontScale });
        });
        makeTap(wfMax, () => { setMax(!_isMax); persist(); });
        makeTap(wfClose, () => {
            if (canSpeak) window.speechSynthesis.cancel();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            persist();
        });
        const onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', onWinResize); return; }
            if (_isMax) applyFontScale();
        };
        window.addEventListener('resize', onWinResize);

        // ── Redimensionnement libre (largeur + hauteur) ────────────────────
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            function onMove(ev) {
                container.style.width  = Math.max(400, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(300, startH + ev.clientY - startY) + 'px';
                applyFontScale();
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup',   onEnd);
                resizeHandle.removeEventListener('pointercancel', onEnd);
                persist();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup',   onEnd);
            resizeHandle.addEventListener('pointercancel', onEnd);
        });

        // ── Sauvegarde / restauration ──────────────────────────────────────
        widget._pdsGetData = function () {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            // Dimensions « normales » (hors plein écran)
            let wPx, hPx;
            if (_isMax) { wPx = parseFloat(_savedW) || 0; hPx = parseFloat(_savedH) || 0; }
            else { wPx = parseFloat(container.style.width) || 0; hPx = parseFloat(container.style.height) || 0; }
            return {
                level, clues, useCustom, customText: customRaw,
                queue: queue.slice(), qi, results: results.slice(),
                score, streak, roundStars, lastStars,
                line: line.slice(), pool: pool.slice(), errors, hints, phase,
                wPct: wPx ? (wPx / curW) * 100 : 0,
                hPct: hPx ? (hPx / curVH) * 100 : 0,
                fullboard: _isMax,
                mini: !!widget.querySelector('.wf-mini-bar'),
            };
        };

        function applySaved(d) {
            level = [1, 2, 3].includes(+d.level) ? +d.level : 1;
            clues = d.clues !== false;
            customRaw = typeof d.customText === 'string' ? d.customText : '';
            customText.value = customRaw;
            useCustom = !!d.useCustom && parseCustom(customRaw).length > 0;
            syncPills();
            const q = Array.isArray(d.queue) ? d.queue.filter(s => typeof s === 'string' && tokenize(s.split('|')[0]).length >= 2) : [];
            if (!q.length) { newRound(); return; }
            queue = q;
            qi = Math.max(0, Math.min(queue.length - 1, +d.qi || 0));
            results = Array.isArray(d.results) ? d.results.slice(0, queue.length) : [];
            score = +d.score || 0; streak = +d.streak || 0; roundStars = +d.roundStars || 0;
            if (d.phase === 'final') {
                buildSentence(); line = []; pool = [];
                finalScreen();
                return;
            }
            loadSentence();
            // Remettre les étiquettes à leur place si l'état est cohérent
            const ids = tokens.map(t => t.id).sort().join();
            const sl = Array.isArray(d.line) ? d.line : [], sp = Array.isArray(d.pool) ? d.pool : [];
            if (sl.concat(sp).slice().sort().join() === ids) {
                const lockedIds = tokens.filter(t => t.locked).map(t => t.id);
                const lockedOk = lockedIds.every(id => sl.includes(id))
                    && (!lockedIds.length || sl[0] === lockedIds[0])
                    && (lockedIds.length < 2 || sl[sl.length - 1] === lockedIds[1]);
                if (lockedOk) { line = sl.slice(); pool = sp.slice(); }
            }
            errors = +d.errors || 0; hints = +d.hints || 0;
            if (d.phase === 'won') {
                phase = 'won'; lastStars = +d.lastStars || 1;
                const ans = answers.find(a => a.join('\u0001') === currentTexts().join('\u0001'));
                if (!ans) { line = tokens.map(t => t.id); pool = []; }
                render();
                say(`🎉 Phrase réussie : « <b>${esc(joinTokens(answers[0]))}</b> »`, 'good');
            } else {
                render();
                if (line.some(id => !tok(id).locked)) say('🦉 On reprend là où tu t\'étais arrêté. Continue !');
            }
        }

        // ── Interactions avec le board ─────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.closest && e.target.closest('button, textarea, input, select, .pds-stage, .pds-resize-handle, .pds-help-popup, .pds-params-panel')) {
                e.stopPropagation();
                if (!e.target.closest('textarea, input, select')) container.focus({ preventScroll: true });
                return;
            }
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus({ preventScroll: true });
            if (typeof positionActionBar === 'function') positionActionBar(widget);
        }
        widget.addEventListener('mousedown', _onWidgetDown);
        widget.addEventListener('pointerdown', _onWidgetDown);

        board.appendChild(widget);
        if (!restoring && typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        // État initial (avant le premier affichage)
        if (restoring && savedData.queue) applySaved(savedData);
        else newRound();

        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            if (restoring) {
                if (savedData.wPct > 0) container.style.width  = (savedData.wPct / 100) * curW  + 'px';
                if (savedData.hPct > 0) container.style.height = (savedData.hPct / 100) * curVH + 'px';
            }
            applyFontScale();
            if (restoring && savedData.fullboard) setMax(true);
            else if (!restoring && typeof isMobileBoardMode === 'function' && isMobileBoardMode()) setMax(true);
            if (!restoring) {
                // Le widget s'ouvre à 100px du bord gauche du board
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
                container.focus({ preventScroll: true });
            }
            if (restoring && savedData.mini && !widget.querySelector('.wf-mini-bar')) {
                window._wfMiniBarCollapse(widget, LABEL, { onExpand: applyFontScale });
            }
        }));

        if (!restoring) persist();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            if (type === 'phrase-desordre') return window.createPhraseDesordreWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'phrase-desordre') return window.createPhraseDesordreWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
