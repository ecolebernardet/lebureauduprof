// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (bloc partagé, défini une seule fois pour tous les widgets)
if (!window._wfPhoneAutoMax) {
    window._wfPhoneAutoMax = function (widget, open, isOpen, setKey, launchOnly) {
        var phone = false;
        if (typeof isMobileBoardMode === 'function') { try { phone = !!isMobileBoardMode(); } catch (e) {} }
        if (!phone && window.matchMedia) phone = window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches;
        if (!phone) return;
        if (launchOnly && !(typeof window._wfLastLaunch === 'number' && Date.now() - window._wfLastLaunch <= 2500)) return;
        var restored = false, auto = false;
        if (setKey && typeof widget[setKey] === 'function') {
            var orig = widget[setKey];
            widget[setKey] = function () {
                restored = true;
                if (auto && isOpen()) open();
                auto = false;
                return orig.apply(this, arguments);
            };
        }
        requestAnimationFrame(function () {
            if (restored || isOpen() || !widget.isConnected) return;
            auto = true;
            open();
        });
    };
}

// =========================================================================
// WIDGET HISTOIRE — LE CHÂTEAU FORT — Le Bureau du Prof
// Dessin interactif d'un château fort du Moyen Âge :
//   - Vue extérieure : donjon, courtine, tours, créneaux, chemin de ronde,
//     mâchicoulis, archères, porte fortifiée, herse, pont-levis, douves,
//     échauguette, barbacane.
//   - Vue intérieure (en coupe) : basse-cour, écuries, forge, puits, four,
//     potager, chapelle, cuisine, et les étages du donjon (cellier, réserve
//     d'armes, salle des gardes, grande salle, chambre, sommet, escalier à vis,
//     latrines, hourds, porte haute).
// Clic sur un élément → son nom et sa fiche (rôle + « Le savais-tu ? »).
// Options : afficher / cacher les noms, mode devinette (noms cachés « ? »),
//   jeu « Retrouve… » (l'élève doit cliquer sur l'élément demandé).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
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
                e.stopPropagation();
                e.preventDefault();
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
                e.stopPropagation();
                e.preventDefault();
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

    // CSS partagé boutons fenêtre (injecté une seule fois)
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

    if (document.getElementById('ch-style')) return;
    const s = document.createElement('style');
    s.id = 'ch-style';
    s.textContent = `
        .widget[data-type="histoire-chateau-fort"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ch-container {
            --chfs: 14px;
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
        }

        /* En-tête */
        .ch-header {
            display: flex; align-items: center; justify-content: space-between;
            gap: 8px; cursor: move; user-select: none;
        }
        .ch-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.3px; pointer-events: none; }
        .ch-badge {
            font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
            letter-spacing: 0.3px; background: #ece7df; color: #5b4a36;
        }

        /* Réduit / plein écran */
        .ch-container.wf-minimized > *:not(.ch-header) { display: none !important; }
        .ch-container.wf-minimized { gap: 0; }
        .ch-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ch-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .ch-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .ch-btn {
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #f0f0f0; color: #333; font-size: 11px; font-weight: 700;
            cursor: pointer; transition: background .15s, transform .1s, opacity .15s;
        }
        .ch-btn:hover { background: #e0e0e0; }
        .ch-btn:active { transform: scale(0.96); }
        .ch-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .ch-btn.on:hover { background: #357abd; }
        .ch-btn.off-dim { opacity: .45; }
        .ch-btn-quiz.on { background: #e67e22; border-color: #e67e22; }
        .ch-btn-quiz.on:hover { background: #cf6d17; }

        .ch-views { display: flex; gap: 4px; margin-right: 6px; }
        .ch-view-btn {
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #f5f5f5; font-size: 11px; font-weight: 800; cursor: pointer;
            color: #666; transition: background .15s;
        }
        .ch-view-btn:hover { background: #e0e0e0; }
        .ch-view-btn.active { background: #f3ead9; color: #6b4a1f; border-color: #d9c39a; }

        /* Barre du jeu */
        .ch-quiz {
            display: none; align-items: center; gap: 8px; flex-wrap: wrap;
            padding: 8px 12px; border-radius: 10px;
            background: #fff4e6; border: 1.5px solid #f5c48a; color: #7a3f06;
            font-size: calc(var(--chfs) * 1.05); font-weight: 600;
        }
        .ch-quiz.show { display: flex; }
        .ch-quiz .ch-q-ask { flex: 1; min-width: 200px; }
        .ch-quiz .ch-q-ask b { color: #c2410c; font-size: 1.15em; }
        .ch-quiz .ch-q-fb { width: 100%; font-size: .9em; font-weight: 700; min-height: 1.2em; }
        .ch-quiz .ch-q-fb.ok { color: #15803d; }
        .ch-quiz .ch-q-fb.ko { color: #b91c1c; }
        .ch-quiz .ch-q-score { font-size: .9em; color: #9a5b14; white-space: nowrap; }
        .ch-q-btn {
            padding: 4px 10px; border-radius: 7px; border: 1px solid #f0b46f;
            background: #fff; color: #9a4b0a; font-size: 11px; font-weight: 700; cursor: pointer;
        }
        .ch-q-btn:hover { background: #ffe8cc; }

        /* Dessin + fiche */
        .ch-main { display: flex; flex-direction: column; gap: 10px; }
        .ch-stage {
            position: relative; width: 100%;
            border-radius: 12px; overflow: hidden;
            border: 1px solid #e5e7eb; background: #e8f6fc;
        }
        .ch-svg { display: block; width: 100%; height: auto; touch-action: manipulation; }
        .ch-svg.fade { animation: chFade .35s ease; }
        @keyframes chFade { from { opacity: 0; } to { opacity: 1; } }

        .ch-svg .ch-part { cursor: pointer; transition: filter .15s; }
        .ch-svg .ch-part:hover { filter: brightness(1.13); }
        .ch-svg .ch-part.sel { filter: drop-shadow(0 0 4px #ffd400) drop-shadow(0 0 3px #ffb000) brightness(1.12); }
        .ch-svg .ch-part.ok  { filter: drop-shadow(0 0 5px #22c55e) drop-shadow(0 0 4px #22c55e); }
        .ch-svg .ch-part.ko  { filter: drop-shadow(0 0 5px #ef4444) drop-shadow(0 0 4px #ef4444); }
        .ch-svg .ch-part.hint{ filter: drop-shadow(0 0 5px #3b82f6) drop-shadow(0 0 4px #3b82f6); }

        .ch-svg .ch-leaders { pointer-events: none; }
        .ch-svg .ch-leaders line { stroke: #1f2937; stroke-width: 1.6; }
        .ch-svg .ch-leaders circle { fill: #fff; stroke: #1f2937; stroke-width: 1.6; }
        .ch-svg .ch-lbl { cursor: pointer; }
        .ch-svg .ch-lbl rect { fill: #fff; stroke: #374151; stroke-width: 1.5; }
        .ch-svg .ch-lbl text { font: 700 15px "Segoe UI", system-ui, sans-serif; fill: #1f2937; pointer-events: none; }
        .ch-svg .ch-lbl:hover rect { fill: #f3f4f6; }
        .ch-svg .ch-lbl.q rect { fill: #fde68a; stroke: #b45309; }
        .ch-svg .ch-lbl.q text { fill: #92400e; }
        .ch-svg .ch-lbl.sel rect { fill: #fff7cc; stroke: #d97706; stroke-width: 2.5; }
        .ch-svg .ch-lbl.found rect { fill: #dcfce7; stroke: #16a34a; }

        .ch-detail {
            padding: 10px 14px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-left: 6px solid #b08a4f;
            border-radius: 10px;
            color: #374151;
            line-height: 1.45;
            font-size: var(--chfs);
        }
        .ch-detail.hidden { display: none; }
        .ch-detail h4 { margin: 0 0 4px; font-weight: 900; font-size: 1.35em; color: #6b4a1f; }
        .ch-detail p { margin: 0 0 8px; }
        .ch-detail .ch-fact {
            padding: 6px 10px; border-radius: 8px;
            background: #fff8e1; border: 1px dashed #e6c46a; color: #6b5310;
            margin-bottom: 6px;
        }
        .ch-detail .ch-hint { color: #6b7280; }
        .ch-enter {
            margin-top: 4px;
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #8b5a2b; color: #fff; font-size: 12px; font-weight: 800; cursor: pointer;
        }
        .ch-enter:hover { background: #734820; }

        .ch-container.wf-fullboard .ch-main { flex-direction: row; align-items: flex-start; }
        .ch-container.wf-fullboard .ch-stage { flex: 1; min-width: 0; }
        .ch-container.wf-fullboard .ch-svg { height: calc(100vh - 150px); }
        .ch-container.wf-fullboard .ch-detail { width: 340px; flex-shrink: 0; }
        @media (max-width: 900px) {
            .ch-container.wf-fullboard .ch-main { flex-direction: column; }
            .ch-container.wf-fullboard .ch-svg { height: auto; }
            .ch-container.wf-fullboard .ch-detail { width: auto; }
        }

        /* Aide */
        .ch-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5; color: #666;
            font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: background .15s;
        }
        .ch-help-btn:hover { background: #e0e0e0; color: #333; }
        .ch-help-popup {
            display: none; position: absolute; top: 36px; right: 10px;
            background: #fff; border: 1px solid #ddd; border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ch-help-popup.show { display: block; }
        .ch-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .ch-help-popup p { margin: 0 0 6px; }
        .ch-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .ch-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .ch-container:hover .ch-resize-handle { opacity: 1; }
        .ch-container.wf-fullboard .ch-resize-handle { display: none; }

        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="histoire-chateau-fort"], .ch-container, .ch-container * { cursor: default !important; }
        .ch-container .ch-header, .ch-container .ch-header * { cursor: grab !important; }
        .ch-container .ch-header:active, .ch-container .ch-header:active * { cursor: grabbing !important; }
        .ch-container button, .ch-container button *, .ch-container .ch-header button,
        .ch-container .ch-header button *,
        .ch-container .ch-svg .ch-part, .ch-container .ch-svg .ch-part *,
        .ch-container .ch-svg .ch-lbl, .ch-container .ch-svg .ch-lbl * { cursor: pointer !important; }
        .ch-container button:disabled, .ch-container button:disabled * { cursor: default !important; }
        .ch-container input { cursor: text !important; }
        .ch-container .ch-resize-handle { cursor: se-resize !important; }
    
        /* ── Barre du haut : même style que les tables de multiplication ── */
        .ch-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ch-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ch-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .ch-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .ch-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .ch-help-popup { top: 56px; }
        .ch-container.wf-fullboard .ch-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ch-container.wf-fullboard .ch-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .ch-title { font-size: 17px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Données : les éléments du château ─────────────────────────────────────
// name : étiquette ; q : formulation pour le jeu ; (lx, ly) centre de l'étiquette ;
// (ax, ay) point désigné ; enter : propose d'entrer dans le château.
const CH_DATA = {
    ext: [
        { id: 'donjon', name: 'Donjon', q: 'le donjon', lx: 690, ly: 40, ax: 588, ay: 100, enter: true,
          desc: "C'est la tour principale, la plus haute et la plus solide du château. Le seigneur et sa famille y habitent. En cas d'attaque, c'est le dernier refuge : si les ennemis ont franchi les murailles, on s'y enferme pour résister.",
          fact: "Ses murs peuvent mesurer plus de 3 mètres d'épaisseur ! Pour plus de sécurité, on y entre souvent par une porte située à l'étage." },
        { id: 'courtine', name: 'Courtine', q: 'la courtine (la muraille)', lx: 330, ly: 420, ax: 330, ay: 456,
          desc: "C'est le grand mur épais et haut qui relie les tours entre elles et entoure le château. On l'appelle aussi la muraille ou le rempart. Elle protège tout ce qui se trouve à l'intérieur.",
          fact: "Les premiers châteaux, vers l'an 1000, étaient en bois, bâtis sur une butte de terre (la motte). Les châteaux en pierre se sont multipliés ensuite, car le bois brûle facilement." },
        { id: 'tours', name: 'Tours', q: 'une tour', lx: 55, ly: 300, ax: 122, ay: 300,
          desc: "Les tours sont placées le long de la muraille et aux angles. Elles dépassent du mur : depuis leur sommet et leurs archères, les soldats peuvent tirer sur les ennemis qui s'approchent du pied de la courtine.",
          fact: "Les tours rondes résistent mieux que les tours carrées : les projectiles ricochent dessus et il n'y a pas d'angle fragile à démolir." },
        { id: 'creneaux', name: 'Créneaux', q: 'les créneaux', lx: 690, ly: 150, ax: 731, ay: 218,
          desc: "En haut du mur, on voit une alternance de parties pleines, les merlons, et d'ouvertures, les créneaux. Les soldats tirent par les créneaux puis se cachent derrière les merlons pour se protéger.",
          fact: "L'expression « monter au créneau » veut dire s'engager pour défendre une idée, comme un soldat qui monte se battre en haut des murailles !" },
        { id: 'chemin-ronde', name: 'Chemin de ronde', q: 'le chemin de ronde', lx: 290, ly: 115, ax: 290, ay: 240,
          desc: "C'est le passage étroit en haut de la muraille, derrière les créneaux. Les gardes y marchent pour surveiller les environs, de jour comme de nuit.",
          fact: "Le mot « ronde » vient de là : les gardes faisaient le tour du château pour vérifier que tout allait bien." },
        { id: 'machicoulis', name: 'Mâchicoulis', q: 'les mâchicoulis', lx: 55, ly: 200, ax: 112, ay: 196,
          desc: "C'est une galerie de pierre qui avance au sommet des murs, avec des ouvertures dans le sol. Par ces trous, les défenseurs lâchent des pierres ou de l'eau bouillante sur les ennemis qui attaquent le pied du mur.",
          fact: "On parle souvent d'huile bouillante, mais l'huile coûtait très cher : on utilisait surtout des pierres, de l'eau chaude ou du sable brûlant." },
        { id: 'archeres', name: 'Archères', q: 'une archère (meurtrière)', lx: 55, ly: 380, ax: 177, ay: 380,
          desc: "Ce sont des fentes très étroites dans les murs. Elles permettent aux archers et aux arbalétriers de tirer sur l'ennemi sans être touchés. On les appelle aussi des meurtrières.",
          fact: "Étroites à l'extérieur, elles s'élargissent vers l'intérieur pour que le tireur puisse viser dans plusieurs directions." },
        { id: 'porte', name: 'Porte fortifiée', q: 'la porte fortifiée', lx: 670, ly: 290, ax: 574, ay: 300, enter: true,
          desc: "L'entrée est le point faible du château : elle est donc très protégée. On l'appelle le châtelet d'entrée. Elle est défendue par un pont-levis, une herse, de lourdes portes en bois et des mâchicoulis.",
          fact: "Dans le passage, des trous au plafond (les assommoirs) permettaient de bombarder les ennemis coincés entre deux herses." },
        { id: 'herse', name: 'Herse', q: 'la herse', lx: 670, ly: 425, ax: 520, ay: 415,
          desc: "C'est une grille en bois épais renforcée de fer, terminée par des pointes. Elle coulisse de haut en bas pour fermer très vite l'entrée du château.",
          fact: "On la remonte grâce à un treuil caché au-dessus de la porte. Pour la fermer en urgence, il suffit de la lâcher !" },
        { id: 'pont-levis', name: 'Pont-levis', q: 'le pont-levis', lx: 720, ly: 565, ax: 546, ay: 525,
          desc: "C'est un pont mobile qui passe au-dessus des douves. Grâce à des chaînes, on le relève pour empêcher l'ennemi d'entrer. Relevé, il bouche aussi l'entrée comme une porte supplémentaire.",
          fact: "« Levis » vient du verbe « lever » : c'est un pont que l'on lève." },
        { id: 'douves', name: 'Douves', q: 'les douves', lx: 945, ly: 505, ax: 870, ay: 505,
          desc: "Ce sont les fossés creusés autour du château, souvent remplis d'eau. Ils empêchent les ennemis d'approcher des murs avec leurs échelles, leurs tours d'assaut ou leurs béliers.",
          fact: "Tous les fossés n'étaient pas remplis d'eau : beaucoup étaient secs mais très profonds, parfois garnis de pieux." },
        { id: 'echauguette', name: 'Échauguette', q: "l'échauguette", lx: 330, ly: 55, ax: 360, ay: 172,
          desc: "C'est une petite tourelle accrochée en haut d'un mur. Un guetteur s'y abrite pour surveiller les alentours et le pied de la muraille.",
          fact: "Le mot vient de l'ancien français « eschargaite », qui voulait dire la garde, la sentinelle." },
        { id: 'barbacane', name: 'Barbacane', q: 'la barbacane', lx: 270, ly: 570, ax: 375, ay: 572,
          desc: "C'est un petit ouvrage fortifié construit devant la porte, de l'autre côté des douves. C'est une première défense : les ennemis doivent la prendre avant de pouvoir atteindre l'entrée.",
          fact: "Elle oblige les attaquants à se serrer dans un passage étroit, où les défenseurs peuvent les viser facilement." }
    ],
    int: [
        { id: 'rempart', name: 'Rempart et chemin de ronde', q: 'le rempart et son chemin de ronde', lx: 115, ly: 190, ax: 40, ay: 240,
          desc: "Ici, le mur est dessiné « en coupe », comme si on l'avait tranché : on voit son épaisseur et, tout en haut, le chemin de ronde où marche un garde, protégé par les créneaux.",
          fact: "On montait sur le chemin de ronde par des escaliers de pierre ou des échelles depuis la cour." },
        { id: 'basse-cour', name: 'Basse-cour', q: 'la basse-cour', lx: 170, ly: 528, ax: 170, ay: 464,
          desc: "C'est la grande cour à l'intérieur de l'enceinte. On y trouve les bâtiments utiles à la vie du château : écuries, forge, four, puits, potager… En cas de danger, les paysans des environs viennent s'y réfugier avec leurs bêtes.",
          fact: "Aujourd'hui, une « basse-cour » est l'endroit où l'on élève les poules et les canards : le mot vient de là !" },
        { id: 'ecuries', name: 'Écuries', q: 'les écuries', lx: 130, ly: 340, ax: 130, ay: 376,
          desc: "C'est le bâtiment où l'on loge et soigne les chevaux du seigneur et de ses chevaliers.",
          fact: "Un cheval de guerre, le destrier, coûtait une fortune : c'était un véritable trésor." },
        { id: 'forge', name: 'Forge', q: 'la forge', lx: 232, ly: 305, ax: 231, ay: 384,
          desc: "C'est l'atelier du forgeron. Il fabrique et répare les armes, les armures, les fers à cheval et les outils.",
          fact: "Le forgeron chauffe le fer au rouge dans le foyer, puis le frappe sur l'enclume avec son marteau pour lui donner sa forme." },
        { id: 'puits', name: 'Puits', q: 'le puits', lx: 296, ly: 528, ax: 296, ay: 458,
          desc: "Le puits fournit l'eau du château. Il est indispensable pendant un siège, quand plus personne ne peut sortir.",
          fact: "Certains puits de châteaux sont profonds de plusieurs dizaines de mètres pour atteindre l'eau !" },
        { id: 'four', name: 'Four à pain', q: 'le four à pain', lx: 358, ly: 345, ax: 356, ay: 414,
          desc: "On y cuit le pain, qui est la base de la nourriture de tout le monde au Moyen Âge.",
          fact: "Les paysans devaient souvent cuire leur pain dans le four du seigneur et payer une taxe pour cela : on l'appelle une « banalité »." },
        { id: 'potager', name: 'Potager', q: 'le potager', lx: 423, ly: 528, ax: 423, ay: 452,
          desc: "C'est le jardin où l'on cultive les légumes (choux, poireaux, fèves, navets…) et les herbes pour la cuisine et pour soigner.",
          fact: "Pas de pommes de terre ni de tomates au Moyen Âge : elles viennent d'Amérique, découverte en 1492 !" },
        { id: 'chapelle', name: 'Chapelle', q: 'la chapelle', lx: 525, ly: 205, ax: 525, ay: 250,
          desc: "C'est la petite église du château. Le seigneur, sa famille et les habitants y prient et y assistent à la messe.",
          fact: "La religion tient une place très importante au Moyen Âge : le château a souvent son propre prêtre, le chapelain." },
        { id: 'cuisine', name: 'Cuisine', q: 'la cuisine', lx: 620, ly: 240, ax: 621, ay: 366,
          desc: "On y prépare les repas du château. Elle est souvent construite à part, pour éviter qu'un incendie ne se propage aux autres bâtiments.",
          fact: "On cuisine dans une immense cheminée : les viandes rôtissent à la broche et les soupes cuisent dans de grands chaudrons." },
        { id: 'porte-haute', name: 'Porte du donjon', q: 'la porte du donjon', lx: 645, ly: 300, ax: 742, ay: 358,
          desc: "L'entrée du donjon n'est pas au rez-de-chaussée mais à l'étage. On y monte par un escalier en bois que l'on peut retirer ou détruire en cas d'attaque.",
          fact: "Ainsi, même si les ennemis sont dans la cour, ils ne peuvent pas entrer facilement dans le donjon." },
        { id: 'sommet', name: 'Sommet du donjon', q: 'le sommet du donjon', lx: 640, ly: 62, ax: 790, ay: 84,
          desc: "C'est le point le plus haut du château. Un guetteur y surveille les alentours et donne l'alerte s'il voit arriver des ennemis.",
          fact: "Par temps clair, on pouvait voir arriver une armée de très loin et prévenir tout le château à temps." },
        { id: 'hourds', name: 'Hourds', q: 'les hourds', lx: 640, ly: 115, ax: 716, ay: 99,
          desc: "Ce sont des galeries en bois que l'on installe en haut des murs en temps de guerre. Par des trous dans le plancher, on tire ou on lâche des pierres sur l'ennemi au pied du mur.",
          fact: "Le bois des hourds pouvait prendre feu : on les a ensuite remplacés par des mâchicoulis en pierre." },
        { id: 'latrines', name: 'Latrines', q: 'les latrines (les toilettes)', lx: 640, ly: 170, ax: 720, ay: 166,
          desc: "Ce sont les toilettes du château ! C'est une petite pièce en avancée sur le mur : tout tombe directement à l'extérieur, dans le fossé.",
          fact: "On les appelait aussi « retraits » ou « garde-robe »." },
        { id: 'chambre', name: 'Chambre du seigneur', q: 'la chambre du seigneur', lx: 828, ly: 120, ax: 828, ay: 120,
          desc: "C'est la chambre où dort la famille du seigneur. Le lit est entouré de rideaux pour garder la chaleur, car le donjon est froid.",
          fact: "Il y a peu de meubles : un lit, et des coffres pour ranger les vêtements et les objets précieux." },
        { id: 'grande-salle', name: 'Grande salle', q: 'la grande salle', lx: 828, ly: 220, ax: 828, ay: 220,
          desc: "C'est la pièce la plus importante du donjon. Le seigneur y reçoit ses invités, y donne des banquets et y rend la justice. Une grande cheminée la chauffe.",
          fact: "Les murs sont ornés de tapisseries : elles décorent et protègent aussi du froid des pierres." },
        { id: 'gardes', name: 'Salle des gardes', q: 'la salle des gardes', lx: 828, ly: 320, ax: 828, ay: 320,
          desc: "Les soldats chargés de protéger le donjon s'y tiennent, prêts à défendre l'entrée qui se trouve à cet étage.",
          fact: "Les soldats se relayaient jour et nuit pour monter la garde." },
        { id: 'reserves', name: "Réserve d'armes", q: "la réserve d'armes", lx: 828, ly: 402, ax: 828, ay: 402,
          desc: "Le rez-de-chaussée du donjon n'a pas de porte vers l'extérieur. On y range en sécurité les armes, les boucliers, les flèches et une partie des provisions.",
          fact: "Sans porte au rez-de-chaussée, impossible pour l'ennemi d'enfoncer l'entrée avec un bélier !" },
        { id: 'cellier', name: 'Cellier', q: 'le cellier', lx: 828, ly: 490, ax: 828, ay: 490,
          desc: "C'est la cave sous le donjon, où il fait frais. On y garde le vin, le grain, la viande salée… de quoi tenir longtemps en cas de siège.",
          fact: "Un siège pouvait durer des mois : un château bien approvisionné pouvait résister très longtemps." },
        { id: 'escalier', name: 'Escalier à vis', q: "l'escalier à vis", lx: 900, ly: 585, ax: 916, ay: 548,
          desc: "C'est l'escalier en colimaçon, construit dans l'épaisseur du mur, qui relie tous les étages du donjon, de la cave au sommet.",
          fact: "Étroit et tournant, il est facile à défendre : un seul soldat peut y bloquer le passage." }
    ]
};

// ── Utilitaires ───────────────────────────────────────────────────────────
function _chEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let _chCtx = null;
function _chTextW(txt, size, weight) {
    if (!_chCtx) _chCtx = document.createElement('canvas').getContext('2d');
    _chCtx.font = (weight || 400) + ' ' + size + 'px "Segoe UI", system-ui, sans-serif';
    return _chCtx.measureText(txt).width;
}

// Tap compatible souris, doigt et stylet (TBI) : on renvoie la cible du pointerdown.
function _chBindTap(el, fn) {
    const TOL = 20;
    let lastAt = 0;
    const fire = (t) => {
        const now = Date.now();
        if (now - lastAt < 450) return;
        lastAt = now;
        fn(t);
    };
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    el.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button > 0) return;
        e.stopPropagation();
        const pid = e.pointerId, x0 = e.clientX, y0 = e.clientY, tgt = e.target;
        const cleanup = () => {
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('pointercancel', cleanup, true);
        };
        const onUp = (ev) => {
            if (ev.pointerId !== pid) return;
            cleanup();
            if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > TOL) return;
            fire(tgt);
        };
        window.addEventListener('pointerup', onUp, true);
        window.addEventListener('pointercancel', cleanup, true);
    });
    el.addEventListener('click', (e) => { e.stopPropagation(); fire(e.target); });
}

function _chShuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── Briques de dessin ─────────────────────────────────────────────────────
function _chMerlons(x1, x2, y, h, mw, gap, fill) {
    const n = Math.max(1, Math.floor((x2 - x1 + gap) / (mw + gap)));
    const used = n * mw + (n - 1) * gap, off = (x2 - x1 - used) / 2;
    let s = '';
    for (let i = 0; i < n; i++) {
        s += `<rect x="${(x1 + off + i * (mw + gap)).toFixed(1)}" y="${y}" width="${mw}" height="${h}" fill="${fill}" stroke="#8a7c63" stroke-width="1.5"/>`;
    }
    return s;
}

function _chPerson(x, y, col, o) {
    o = o || {};
    let s = '';
    if (o.spear) s += `<line x1="${x + 10}" y1="${y - 48}" x2="${x + 10}" y2="${y}" stroke="#6b4a2b" stroke-width="2"/>`
        + `<path d="M${x + 7} ${y - 48} L${x + 10} ${y - 56} L${x + 13} ${y - 48} Z" fill="#9aa5ad"/>`;
    s += `<rect x="${x - 6}" y="${y - 11}" width="5" height="11" fill="#4a3b2c"/><rect x="${x + 1}" y="${y - 11}" width="5" height="11" fill="#4a3b2c"/>`;
    s += `<path d="M${x - 7} ${y - 27} H${x + 7} L${x + 9} ${y - 10} H${x - 9} Z" fill="${col}"/>`;
    s += `<circle cx="${x}" cy="${y - 33}" r="6" fill="#f1c9a0"/>`;
    if (o.helmet) s += `<path d="M${x - 7} ${y - 34} A7 7 0 0 1 ${x + 7} ${y - 34} Z" fill="#8e9aa3"/>`;
    if (o.crown) s += `<path d="M${x - 6} ${y - 38} L${x - 6} ${y - 45} L${x - 3} ${y - 41} L${x} ${y - 46} L${x + 3} ${y - 41} L${x + 6} ${y - 45} L${x + 6} ${y - 38} Z" fill="#e0b52a"/>`;
    if (o.hennin) s += `<path d="M${x - 5} ${y - 37} L${x + 10} ${y - 58} L${x + 5} ${y - 36} Z" fill="#d24d8a"/>`;
    return s;
}

function _chCloud(cx, cy, k) {
    return `<g fill="#fff" opacity=".85"><ellipse cx="${cx}" cy="${cy}" rx="${40 * k}" ry="${13 * k}"/>`
        + `<ellipse cx="${cx - 12 * k}" cy="${cy - 9 * k}" rx="${18 * k}" ry="${13 * k}"/>`
        + `<ellipse cx="${cx + 12 * k}" cy="${cy - 11 * k}" rx="${20 * k}" ry="${15 * k}"/></g>`;
}

function _chDefs(u) {
    return `<defs>
        <linearGradient id="${u}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#e8f6fc"/></linearGradient>
        <linearGradient id="${u}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f93b8"/><stop offset="1" stop-color="#2f6f94"/></linearGradient>
        <linearGradient id="${u}-round" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".45" stop-color="#000" stop-opacity="0"/>
            <stop offset=".6" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
        <linearGradient id="${u}-roof" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e2a1f"/><stop offset=".5" stop-color="#a8442f"/><stop offset="1" stop-color="#6e2a1f"/></linearGradient>
        <linearGradient id="${u}-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b6fd8"/><stop offset=".5" stop-color="#c0392b"/><stop offset="1" stop-color="#e6b422"/></linearGradient>
        <radialGradient id="${u}-fire" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#ff9a1f"/><stop offset="1" stop-color="#d9480f"/></radialGradient>
        <pattern id="${u}-stone" width="40" height="20" patternUnits="userSpaceOnUse">
            <rect width="40" height="20" fill="#c2b49b"/>
            <path d="M0 0H40M0 10H40M20 0V10M0 10V20M40 10V20" stroke="#a89a80" stroke-width="1.2" fill="none"/>
        </pattern>
        <pattern id="${u}-wood" width="12" height="60" patternUnits="userSpaceOnUse">
            <rect width="12" height="60" fill="#9a6a3a"/><path d="M12 0V60" stroke="#6e4723" stroke-width="1.5"/>
        </pattern>
        <clipPath id="${u}-gate"><path d="M465 485 V412 A35 35 0 0 1 535 412 V485 Z"/></clipPath>
    </defs>`;
}

// ── Vue extérieure ────────────────────────────────────────────────────────
function _chExtSVG(u) {
    const S = `url(#${u}-stone)`, R = `url(#${u}-round)`, ROOF = `url(#${u}-roof)`;
    const tower = (cx) => `
        <path d="M${cx - 66} 490 L${cx - 60} 455 H${cx + 60} L${cx + 66} 490 Z" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
        <rect x="${cx - 60}" y="196" width="120" height="270" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
        <rect x="${cx - 60}" y="196" width="120" height="270" fill="${R}"/>
        <rect x="${cx - 72}" y="160" width="144" height="30" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
        <rect x="${cx - 72}" y="160" width="144" height="30" fill="${R}"/>
        <path d="M${cx - 80} 162 L${cx} 62 L${cx + 80} 162 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="2"/>
        <path d="M${cx} 62 L${cx - 40} 162 M${cx} 62 L${cx + 40} 162 M${cx} 62 V162" stroke="#5a2118" stroke-opacity=".35" stroke-width="1.5"/>
        <line x1="${cx}" y1="62" x2="${cx}" y2="44" stroke="#555" stroke-width="2"/><circle cx="${cx}" cy="44" r="3" fill="#c9a227"/>`;
    const corbels = (x1, x2, y) => {
        let s = `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="8" fill="#2b231b"/>`;
        for (let x = x1; x + 10 <= x2 + 0.5; x += 20) {
            s += `<path d="M${x} ${y} h10 v6 l-3 12 h-4 l-3 -12 z" fill="#b5a78e" stroke="#8a7c63" stroke-width="1"/>`;
        }
        return s;
    };
    const arch = (x, y) => `<rect x="${x - 14}" y="${y - 26}" width="28" height="52" fill="#000" fill-opacity="0"/>`
        + `<rect x="${x - 2.5}" y="${y - 22}" width="5" height="44" rx="2" fill="#2b231b"/>`
        + `<rect x="${x - 9}" y="${y - 2.5}" width="18" height="5" rx="2" fill="#2b231b"/>`;
    const guard = (x) => `<circle cx="${x}" cy="234" r="6" fill="#f1c9a0"/>`
        + `<path d="M${x - 7} 233 A7 7 0 0 1 ${x + 7} 233 Z" fill="#8e9aa3"/>`
        + `<line x1="${x + 8}" y1="250" x2="${x + 8}" y2="204" stroke="#6b4a2b" stroke-width="2"/>`
        + `<path d="M${x + 5} 205 L${x + 8} 197 L${x + 11} 205 Z" fill="#9aa5ad"/>`;
    let waves = '';
    for (let x = 20; x < 1000; x += 70) waves += `<path d="M${x} ${500 + (x % 3) * 6} q10 -5 20 0 t20 0" stroke="#d6eef8" stroke-width="2" fill="none" opacity=".7"/>`;
    let herse = `<rect x="465" y="377" width="70" height="72" fill="#000" fill-opacity="0"/><g clip-path="url(#${u}-gate)">`;
    for (let x = 470; x <= 530; x += 10) herse += `<line x1="${x}" y1="370" x2="${x}" y2="442" stroke="#5b4a36" stroke-width="4"/>`;
    for (let y = 386; y <= 436; y += 12) herse += `<line x1="460" y1="${y}" x2="540" y2="${y}" stroke="#5b4a36" stroke-width="4"/>`;
    for (let x = 470; x <= 530; x += 10) herse += `<path d="M${x - 3} 442 L${x} 452 L${x + 3} 442 Z" fill="#6f6f6f"/>`;
    herse += '</g>';
    let planks = '';
    for (let k = 1; k < 5; k++) {
        const y = 485 + k * 10, dx = k * 2.6;
        planks += `<line x1="${465 - dx}" y1="${y}" x2="${535 + dx}" y2="${y}" stroke="#5e3b1a" stroke-width="1.5"/>`;
    }

    return `${_chDefs(u)}
    <rect width="1000" height="600" fill="url(#${u}-sky)"/>
    ${_chCloud(85, 45, 1)}${_chCloud(905, 40, .9)}
    <path d="M0 430 Q150 360 300 410 T600 400 T1000 395 V600 H0 Z" fill="#9cc77f"/>
    <rect y="430" width="1000" height="170" fill="#86b96a"/>
    <rect x="445" y="528" width="110" height="72" fill="#b89a6a"/>
    <g class="ch-parts">
        <g class="ch-part" data-id="donjon">
            <rect x="410" y="72" width="180" height="190" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            ${_chMerlons(404, 596, 50, 24, 20, 12, S)}
            <rect x="462" y="104" width="16" height="30" rx="8" fill="#3a2f25"/>
            <rect x="522" y="104" width="16" height="30" rx="8" fill="#3a2f25"/>
            <line x1="500" y1="50" x2="500" y2="8" stroke="#555" stroke-width="3"/>
            <path d="M500 10 L542 19 L500 29 Z" fill="#c0392b"/>
        </g>
        <g class="ch-part" data-id="courtine">
            <rect x="200" y="250" width="600" height="235" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            <rect x="200" y="468" width="600" height="17" fill="#a3947a"/>
        </g>
        <g class="ch-part" data-id="chemin-ronde">
            <rect x="200" y="232" width="600" height="20" fill="#d8ccb4" stroke="#8a7c63" stroke-width="1.5"/>
            ${guard(290)}${guard(710)}
        </g>
        <g class="ch-part" data-id="creneaux">${_chMerlons(200, 800, 216, 36, 24, 18, S)}</g>
        <g class="ch-part" data-id="tours">${tower(180)}${tower(820)}</g>
        <g class="ch-part" data-id="echauguette">
            <path d="M342 262 H378 L360 290 Z" fill="#b5a78e" stroke="#8a7c63" stroke-width="1.5"/>
            <rect x="344" y="206" width="32" height="56" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <rect x="344" y="206" width="32" height="56" fill="${R}"/>
            <path d="M338 208 L360 170 L382 208 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.5"/>
            <rect x="357" y="222" width="6" height="18" rx="2" fill="#2b231b"/>
        </g>
        <g class="ch-part" data-id="porte">
            <rect x="425" y="214" width="150" height="271" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            <rect x="418" y="186" width="164" height="28" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            ${_chMerlons(418, 582, 168, 18, 16, 12, S)}
            <path d="M465 485 V412 A35 35 0 0 1 535 412 V485 Z" fill="#241c15"/>
            <path d="M486 282 h28 v16 q0 16 -14 22 q-14 -6 -14 -22 z" fill="#2f5d9e" stroke="#c9a227" stroke-width="2"/>
            <path d="M500 287 v26 M490 298 h20" stroke="#e0b52a" stroke-width="3"/>
            <rect x="451" y="362" width="8" height="12" fill="#1a140f"/>
            <rect x="541" y="362" width="8" height="12" fill="#1a140f"/>
        </g>
        <g class="ch-part" data-id="herse">${herse}</g>
        <g class="ch-part" data-id="machicoulis">
            ${corbels(110, 250, 190)}${corbels(750, 890, 190)}${corbels(420, 580, 214)}
        </g>
        <g class="ch-part" data-id="archeres">
            ${arch(180, 280)}${arch(180, 380)}${arch(820, 280)}${arch(820, 380)}${arch(300, 340)}${arch(700, 360)}
        </g>
        <g class="ch-part" data-id="douves">
            <rect x="0" y="478" width="1000" height="50" fill="url(#${u}-water)"/>
            <path d="M0 528 H1000" stroke="#5f8f4e" stroke-width="3"/>
            ${waves}
        </g>
        <g class="ch-part" data-id="pont-levis">
            <path d="M465 485 L535 485 L548 535 L452 535 Z" fill="#8a5a2b" stroke="#5e3b1a" stroke-width="2"/>
            ${planks}
            <line x1="455" y1="372" x2="453" y2="533" stroke="#444" stroke-width="3" stroke-dasharray="4 2"/>
            <line x1="545" y1="372" x2="547" y2="533" stroke="#444" stroke-width="3" stroke-dasharray="4 2"/>
        </g>
        <g class="ch-part" data-id="barbacane">
            <rect x="372" y="548" width="88" height="52" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            ${_chMerlons(372, 460, 534, 14, 14, 10, S)}
            <rect x="540" y="548" width="88" height="52" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            ${_chMerlons(540, 628, 534, 14, 14, 10, S)}
            <rect x="400" y="566" width="5" height="22" rx="2" fill="#2b231b"/>
            <rect x="595" y="566" width="5" height="22" rx="2" fill="#2b231b"/>
        </g>
    </g>
    <g class="ch-labels"></g>`;
}

// ── Vue intérieure (en coupe) ─────────────────────────────────────────────
function _chIntSVG(u) {
    const S = `url(#${u}-stone)`, ROOF = `url(#${u}-roof)`, WOOD = `url(#${u}-wood)`, FIRE = `url(#${u}-fire)`;
    const smoke = (x, y) => `<g fill="#9a9a9a" opacity=".45"><circle cx="${x}" cy="${y}" r="6"/><circle cx="${x + 6}" cy="${y - 12}" r="8"/><circle cx="${x - 2}" cy="${y - 26}" r="9"/></g>`;
    const barrel = (x, y) => `<rect x="${x}" y="${y - 34}" width="26" height="34" rx="8" fill="#9b6a3a" stroke="#5e3b1a" stroke-width="1.5"/>`
        + `<path d="M${x + 1} ${y - 25} H${x + 25} M${x + 1} ${y - 9} H${x + 25}" stroke="#4a4a4a" stroke-width="2"/>`;
    const shield = (x, y, c) => `<path d="M${x - 9} ${y - 12} h18 v8 q0 12 -9 18 q-9 -6 -9 -18 z" fill="${c}" stroke="#c9a227" stroke-width="1.5"/>`;
    let stair = `<rect x="902" y="108" width="28" height="447" fill="#cbbd9f" stroke="#9a8b70" stroke-width="1.5"/>`;
    let pts = [];
    for (let y = 112, k = 0; y <= 552; y += 10, k++) pts.push((k % 2 ? 930 : 902) + ',' + y);
    stair += `<polyline points="${pts.join(' ')}" fill="none" stroke="#8a7c63" stroke-width="2"/>`
        + `<line x1="916" y1="108" x2="916" y2="555" stroke="#7a6f5c" stroke-width="3"/>`;
    let steps = '';
    for (let k = 0; k < 8; k++) steps += `<rect x="${672 + k * 8.5}" y="${470 - (k + 1) * 11}" width="11" height="4" fill="#a8743f"/>`;
    let plants = '';
    for (let x = 400; x <= 446; x += 9) plants += `<circle cx="${x}" cy="448" r="4.5" fill="#4f8f3a"/><circle cx="${x + 4}" cy="444" r="3" fill="#6aa84f"/>`;
    let strata = '';
    for (let y = 500; y < 600; y += 28) strata += `<path d="M0 ${y} Q250 ${y - 8} 500 ${y} T1000 ${y}" stroke="#7a5c3e" stroke-width="2" fill="none" opacity=".6"/>`;
    const beams = [100, 200, 300, 382, 470].map(y => `<rect x="758" y="${y}" width="174" height="8" fill="#7a5230"/>`).join('');
    const room = (y, h, fill) => `<rect x="758" y="${y}" width="174" height="${h}" fill="${fill}"/>`;

    return `${_chDefs(u)}
    <rect width="1000" height="600" fill="url(#${u}-sky)"/>
    <circle cx="300" cy="70" r="26" fill="#ffd76a"/>
    ${_chCloud(150, 75, .9)}${_chCloud(440, 60, 1)}
    <path d="M0 470 Q200 400 450 455 T1000 440 V470 H0 Z" fill="#9cc77f"/>
    <rect y="462" width="1000" height="10" fill="#7fb069"/>
    <rect y="470" width="1000" height="130" fill="#8b6b4a"/>
    ${strata}
    <rect x="455" y="335" width="16" height="135" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
    <rect x="455" y="320" width="16" height="15" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
    <rect x="740" y="100" width="210" height="465" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
    <rect x="740" y="68" width="18" height="32" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
    <rect x="932" y="68" width="18" height="32" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
    <g class="ch-parts">
        <g class="ch-part" data-id="rempart">
            <rect x="12" y="250" width="58" height="240" fill="${S}" stroke="#8a7c63" stroke-width="2"/>
            <rect x="12" y="222" width="16" height="28" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <rect x="12" y="246" width="58" height="6" fill="#d8ccb4"/>
            ${_chPerson(48, 246, '#3f6e8c', { helmet: true, spear: true })}
        </g>
        <g class="ch-part" data-id="basse-cour">
            <rect x="70" y="456" width="385" height="16" fill="#c9ab7b"/>
            <ellipse cx="245" cy="462" rx="6" ry="4" fill="#fff"/><circle cx="250" cy="458" r="2.5" fill="#fff"/>
            <ellipse cx="262" cy="465" rx="6" ry="4" fill="#e9d8b0"/><circle cx="267" cy="461" r="2.5" fill="#e9d8b0"/>
        </g>
        <g class="ch-part" data-id="ecuries">
            <rect x="82" y="398" width="96" height="60" fill="${WOOD}" stroke="#5e3b1a" stroke-width="1.5"/>
            <path d="M74 400 L186 400 L166 374 L94 374 Z" fill="#c9a25a" stroke="#8a6a2a" stroke-width="1.5"/>
            <rect x="92" y="415" width="34" height="43" fill="#3a2a1c"/><rect x="134" y="415" width="34" height="43" fill="#3a2a1c"/>
            <path d="M100 440 q4 -16 16 -18 q6 2 4 8 l-8 4 l-2 6 z" fill="#7a4a25"/>
            <path d="M142 440 q4 -16 16 -18 q6 2 4 8 l-8 4 l-2 6 z" fill="#4a3020"/>
            <rect x="92" y="440" width="34" height="18" fill="#8b5a2b"/><rect x="134" y="440" width="34" height="18" fill="#8b5a2b"/>
        </g>
        <g class="ch-part" data-id="forge">
            ${smoke(252, 352)}
            <rect x="246" y="362" width="12" height="34" fill="#8a7c63"/>
            <rect x="196" y="405" width="70" height="53" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M188 407 L274 407 L231 382 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.5"/>
            <rect x="204" y="422" width="28" height="36" fill="#2a1d14"/>
            <path d="M210 458 q4 -14 8 -8 q2 -10 6 -4 q4 6 2 12 z" fill="${FIRE}"/>
            <path d="M240 446 h20 l-4 5 h-4 v5 h6 v2 h-16 v-2 h6 v-5 h-4 z" fill="#333"/>
        </g>
        <g class="ch-part" data-id="puits">
            <line x1="284" y1="398" x2="284" y2="432" stroke="#6b4a2b" stroke-width="3"/>
            <line x1="308" y1="398" x2="308" y2="432" stroke="#6b4a2b" stroke-width="3"/>
            <path d="M278 400 L314 400 L296 386 Z" fill="#8b5a2b"/>
            <line x1="284" y1="406" x2="308" y2="406" stroke="#6b4a2b" stroke-width="2"/>
            <line x1="296" y1="406" x2="296" y2="418" stroke="#777" stroke-width="1.5"/>
            <rect x="292" y="418" width="8" height="8" fill="#8b5a2b"/>
            <rect x="280" y="430" width="32" height="28" rx="4" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
        </g>
        <g class="ch-part" data-id="four">
            <rect x="370" y="404" width="8" height="18" fill="#8a6a4a"/>
            <path d="M326 458 V438 Q356 398 386 438 V458 Z" fill="#c9a27a" stroke="#8a6a4a" stroke-width="2"/>
            <path d="M343 458 V446 Q356 432 369 446 V458 Z" fill="#2a1d14"/>
            <path d="M350 458 q3 -10 6 -6 q2 -7 5 -2 q2 5 1 8 z" fill="${FIRE}"/>
        </g>
        <g class="ch-part" data-id="potager">
            <rect x="396" y="452" width="54" height="8" fill="#6b4a2b"/>
            ${plants}
        </g>
        <g class="ch-part" data-id="chapelle">
            <rect x="480" y="342" width="90" height="128" fill="#e3d7bf" stroke="#9a8b70" stroke-width="2"/>
            <path d="M472 344 L578 344 L525 302 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.5"/>
            <rect x="513" y="268" width="24" height="40" fill="#e3d7bf" stroke="#9a8b70" stroke-width="1.5"/>
            <rect x="519" y="278" width="12" height="16" rx="6" fill="#2b231b"/>
            <path d="M521 292 q4 -10 8 0 z" fill="#e0b52a"/>
            <path d="M509 270 L541 270 L525 246 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.5"/>
            <line x1="525" y1="246" x2="525" y2="230" stroke="#c9a227" stroke-width="3"/>
            <line x1="519" y1="236" x2="531" y2="236" stroke="#c9a227" stroke-width="3"/>
            <rect x="512" y="372" width="26" height="42" rx="13" fill="url(#${u}-glass)" stroke="#555" stroke-width="1.5"/>
            <path d="M513 470 V452 A12 12 0 0 1 537 452 V470 Z" fill="#5e3b1a"/>
        </g>
        <g class="ch-part" data-id="cuisine">
            ${smoke(599, 342)}
            <rect x="592" y="350" width="14" height="34" fill="#8a7c63"/>
            <rect x="584" y="392" width="74" height="78" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M576 394 L666 394 L621 364 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.5"/>
            <rect x="600" y="430" width="22" height="40" fill="#3a2a1c"/>
            <rect x="632" y="410" width="16" height="16" fill="#ffcf6b" stroke="#8a7c63"/>
        </g>
        <g class="ch-part" data-id="cellier">
            ${room(478, 77, '#d9c7a5')}
            ${barrel(768, 555)}${barrel(798, 555)}${barrel(783, 521)}
            <ellipse cx="850" cy="545" rx="14" ry="10" fill="#d8c59b" stroke="#a8956b"/>
            <ellipse cx="878" cy="545" rx="14" ry="10" fill="#d8c59b" stroke="#a8956b"/>
            <ellipse cx="864" cy="530" rx="13" ry="9" fill="#e2d1a8" stroke="#a8956b"/>
        </g>
        <g class="ch-part" data-id="reserves">
            ${room(390, 80, '#efe0c2')}
            ${shield(782, 432, '#2f5d9e')}${shield(808, 432, '#b03a3a')}
            <line x1="835" y1="470" x2="852" y2="412" stroke="#6b4a2b" stroke-width="2.5"/>
            <line x1="845" y1="470" x2="864" y2="414" stroke="#6b4a2b" stroke-width="2.5"/>
            <ellipse cx="882" cy="458" rx="12" ry="11" fill="#d8c59b" stroke="#a8956b"/>
            <ellipse cx="790" cy="462" rx="14" ry="8" fill="#d8c59b" stroke="#a8956b"/>
        </g>
        <g class="ch-part" data-id="gardes">
            ${room(308, 74, '#f3e6cc')}
            ${_chPerson(792, 382, '#6d7b85', { helmet: true, spear: true })}
            ${_chPerson(842, 382, '#8e3b3b', { helmet: true, spear: true })}
            <rect x="868" y="368" width="28" height="14" fill="#8a5a2b"/>
        </g>
        <g class="ch-part" data-id="grande-salle">
            ${room(208, 92, '#f3e6cc')}
            <rect x="770" y="238" width="54" height="34" fill="#3d5a99" stroke="#c9a227" stroke-width="2"/>
            <path d="M780 255 l17 -10 l17 10 l-17 10 z" fill="none" stroke="#e0b52a" stroke-width="1.5"/>
            <path d="M852 240 h44 v14 l-8 12 h-28 l-8 -12 z" fill="#b5a78e" stroke="#8a7c63" stroke-width="1.5"/>
            <rect x="860" y="266" width="28" height="34" fill="#2a1d14"/>
            <path d="M866 300 q4 -16 8 -8 q3 -12 7 -2 q3 8 1 10 z" fill="${FIRE}"/>
            ${_chPerson(790, 300, '#2f5d9e', { crown: true })}
            ${_chPerson(818, 300, '#8e44ad', { hennin: true })}
            <rect x="772" y="276" width="66" height="6" fill="#8a5a2b"/>
            <rect x="776" y="282" width="4" height="18" fill="#6b4423"/><rect x="830" y="282" width="4" height="18" fill="#6b4423"/>
            <rect x="802" y="268" width="5" height="8" fill="#e0b52a"/>
        </g>
        <g class="ch-part" data-id="chambre">
            ${room(108, 92, '#f6ead2')}
            <rect x="768" y="138" width="76" height="8" fill="#7a2a2a"/>
            <line x1="772" y1="146" x2="772" y2="196" stroke="#6b4423" stroke-width="3"/>
            <line x1="840" y1="146" x2="840" y2="196" stroke="#6b4423" stroke-width="3"/>
            <rect x="774" y="146" width="8" height="32" fill="#a33a3a"/><rect x="830" y="146" width="8" height="32" fill="#a33a3a"/>
            <rect x="772" y="182" width="68" height="14" fill="#8a5a2b"/>
            <rect x="776" y="174" width="60" height="10" fill="#c94b4b"/>
            <rect x="782" y="168" width="14" height="8" rx="3" fill="#f2e8d5"/>
            <rect x="856" y="182" width="36" height="18" fill="#7a5230" stroke="#4a3020"/>
            <path d="M856 188 H892 M866 182 V200 M882 182 V200" stroke="#3a3a3a" stroke-width="1.5"/>
        </g>
        ${beams}
        <g class="ch-part" data-id="escalier">${stair}</g>
        <g class="ch-part" data-id="sommet">
            <rect x="758" y="60" width="174" height="40" fill="#fff" fill-opacity=".18"/>
            ${_chPerson(845, 100, '#3f6e8c', { helmet: true, spear: true })}
            <line x1="941" y1="68" x2="941" y2="28" stroke="#555" stroke-width="2.5"/>
            <path d="M941 30 L975 37 L941 45 Z" fill="#c0392b"/>
        </g>
        <g class="ch-part" data-id="hourds">
            <path d="M712 86 L740 72 L740 86 Z" fill="${ROOF}"/>
            <rect x="716" y="84" width="24" height="30" fill="${WOOD}" stroke="#5e3b1a" stroke-width="1.5"/>
            <line x1="716" y1="114" x2="740" y2="132" stroke="#5e3b1a" stroke-width="3"/>
            <path d="M978 86 L950 72 L950 86 Z" fill="${ROOF}"/>
            <rect x="950" y="84" width="24" height="30" fill="${WOOD}" stroke="#5e3b1a" stroke-width="1.5"/>
            <line x1="974" y1="114" x2="950" y2="132" stroke="#5e3b1a" stroke-width="3"/>
        </g>
        <g class="ch-part" data-id="latrines">
            <path d="M716 152 L740 142 L740 150 Z" fill="${ROOF}"/>
            <rect x="720" y="150" width="20" height="30" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M720 180 L740 180 L740 196 Z" fill="#b5a78e" stroke="#8a7c63" stroke-width="1"/>
            <rect x="724" y="176" width="12" height="4" fill="#2b231b"/>
        </g>
        <g class="ch-part" data-id="porte-haute">
            <line x1="672" y1="470" x2="742" y2="382" stroke="#5e3b1a" stroke-width="4"/>
            ${steps}
            <line x1="700" y1="436" x2="700" y2="470" stroke="#5e3b1a" stroke-width="3"/>
            <line x1="672" y1="440" x2="740" y2="352" stroke="#8b5a2b" stroke-width="2"/>
            <rect x="726" y="380" width="16" height="4" fill="#8b5a2b"/>
            <path d="M740 382 V344 A9 9 0 0 1 758 344 V382 Z" fill="#3a2a1c"/>
        </g>
    </g>
    <g class="ch-labels"></g>`;
}

// ── Création du widget ────────────────────────────────────────────────────
function createHistoireChateauFortWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = findFreePosition();
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'histoire-chateau-fort';
    widget.dataset.transparent = 'true';
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

    const container = document.createElement('div');
    container.className = 'ch-container';
    const initW = Math.max(480, Math.min(1000, Math.round(window.innerWidth * 0.6)));
    container.style.width = initW + 'px';

    // En-tête
    const header = document.createElement('div');
    header.className = 'ch-header';
    header.innerHTML = `
        <span class="ch-title">🏰 Le château fort</span>
        <span class="ch-badge">Vue extérieure</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.ch-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'ch-controls';
    controls.innerHTML = `
        <div class="ch-views">
            <button class="ch-view-btn active" data-view="ext" title="Le château vu de l'extérieur">🏰 Extérieur</button>
            <button class="ch-view-btn" data-view="int" title="L'intérieur du château, vu en coupe">🔍 Intérieur</button>
        </div>
        <button class="ch-btn ch-btn-names on" title="Afficher / cacher le nom des éléments">🏷 Noms</button>
        <button class="ch-btn ch-btn-guess" title="Les noms sont remplacés par « ? » : clique pour les dévoiler">🙈 Devinette</button>
        <button class="ch-btn ch-btn-quiz" title="Jeu : retrouve l'élément demandé sur le dessin">🎯 Jeu : retrouve…</button>
    `;
    const namesBtn = controls.querySelector('.ch-btn-names');
    const guessBtn = controls.querySelector('.ch-btn-guess');
    const quizBtn  = controls.querySelector('.ch-btn-quiz');
    container.appendChild(controls);

    // Barre du jeu
    const quizBar = document.createElement('div');
    quizBar.className = 'ch-quiz';
    container.appendChild(quizBar);

    // Dessin + fiche
    const main = document.createElement('div');
    main.className = 'ch-main';
    const stage = document.createElement('div');
    stage.className = 'ch-stage';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.setAttribute('class', 'ch-svg');
    stage.appendChild(svg);
    const detail = document.createElement('div');
    detail.className = 'ch-detail';
    main.appendChild(stage);
    main.appendChild(detail);
    container.appendChild(main);

    // Aide
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ch-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ch-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le château fort</h4>
        <p>👆 <b>Clique sur une partie du château</b> (ou sur son étiquette) : elle s'illumine et sa fiche
        apparaît (à quoi elle servait + « Le savais-tu ? »).</p>
        <p>🏰 <b>Extérieur</b> / 🔍 <b>Intérieur</b> : passe de la vue de l'extérieur à la vue
        « en coupe », comme si on avait tranché le château pour voir dedans
        (la cour, les bâtiments et les étages du donjon).</p>
        <p>🏷 <b>Noms</b> : affiche ou cache les étiquettes.</p>
        <p>🙈 <b>Devinette</b> : les noms sont remplacés par « ? ». Fais deviner les élèves,
        puis clique pour dévoiler.</p>
        <p>🎯 <b>Jeu : retrouve…</b> : le widget demande un élément, l'élève doit cliquer dessus.
        Le score compte les éléments trouvés du premier coup.</p>
        <p style="color:#888">Redimensionne le widget avec le coin en bas à droite.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ch-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.ch-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // ── État interne ──────────────────────────────────────────────────────
    const uid = 'ch' + Math.random().toString(36).slice(2, 9);
    let view = 'ext';             // 'ext' | 'int'
    let showLabels = true;
    let guess = false;
    let revealed = { ext: new Set(), int: new Set() };
    let selected = null;          // id de l'élément sélectionné
    let quiz = null;              // { order, i, score, miss, found, done, fb, fbCls }
    let partsG = null, labelsG = null;

    const els = () => CH_DATA[view];
    const elOf = (id) => els().find(e => e.id === id) || null;

    // ── Rendu ─────────────────────────────────────────────────────────────
    function buildSVG(anim) {
        svg.innerHTML = view === 'ext' ? _chExtSVG(uid) : _chIntSVG(uid);
        partsG = svg.querySelector('.ch-parts');
        labelsG = svg.querySelector('.ch-labels');
        if (anim) {
            svg.classList.remove('fade');
            void svg.getBoundingClientRect();
            svg.classList.add('fade');
        }
    }

    function renderLabels() {
        if (!labelsG) return;
        const visible = showLabels || guess || !!quiz;
        if (!visible) { labelsG.innerHTML = ''; return; }
        let lines = '', boxes = '';
        els().forEach(el => {
            let txt, cls = 'ch-lbl';
            if (quiz) {
                if (!quiz.found.has(el.id)) return;
                txt = el.name; cls += ' found';
            } else if (guess && !revealed[view].has(el.id)) {
                txt = '?'; cls += ' q';
            } else {
                if (!showLabels && !guess) return;
                txt = el.name;
            }
            if (!quiz && selected === el.id) cls += ' sel';
            const fsz = 15, h = 24;
            const w = Math.ceil(_chTextW(txt, fsz, 700)) + 16;
            const x = Math.max(2, Math.min(998 - w, el.lx - w / 2));
            const y = Math.max(2, Math.min(598 - h, el.ly - h / 2));
            const px = Math.max(x, Math.min(x + w, el.ax));
            const py = Math.max(y, Math.min(y + h, el.ay));
            if (Math.hypot(px - el.ax, py - el.ay) > 6) {
                lines += `<line x1="${el.ax}" y1="${el.ay}" x2="${px}" y2="${py}"/><circle cx="${el.ax}" cy="${el.ay}" r="3.5"/>`;
            }
            boxes += `<g class="${cls}" data-id="${el.id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`
                + `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle">${_chEsc(txt)}</text></g>`;
        });
        labelsG.innerHTML = `<g class="ch-leaders">${lines}</g>${boxes}`;
    }

    function renderHighlight() {
        if (!partsG) return;
        partsG.querySelectorAll('.ch-part').forEach(p => {
            p.classList.toggle('sel', !quiz && p.dataset.id === selected);
        });
    }

    function renderDetail() {
        if (quiz) { detail.classList.add('hidden'); return; }
        detail.classList.remove('hidden');
        const el = selected ? elOf(selected) : null;
        if (!el || (guess && !revealed[view].has(el.id))) {
            detail.innerHTML = view === 'ext'
                ? `<p class="ch-hint">👆 Clique sur une partie du château pour découvrir son nom et à quoi elle servait.</p>
                   <button class="ch-enter">🔍 Entrer : voir l'intérieur du château</button>`
                : `<p class="ch-hint">🔍 Tu es à l'intérieur ! Le château est dessiné « en coupe » : on voit la cour,
                   ses bâtiments et tous les étages du donjon. Clique sur un élément pour le découvrir.</p>`;
        } else {
            detail.innerHTML = `
                <h4>${_chEsc(el.name)}</h4>
                <p>${_chEsc(el.desc)}</p>
                ${el.fact ? `<div class="ch-fact">💡 <b>Le savais-tu ?</b> ${_chEsc(el.fact)}</div>` : ''}
                ${view === 'ext' && el.enter ? `<button class="ch-enter">🔍 Entrer : voir l'intérieur du château</button>` : ''}
            `;
        }
        const enter = detail.querySelector('.ch-enter');
        if (enter) enter.addEventListener('click', (e) => { e.stopPropagation(); setView('int'); save(); });
    }

    function renderControls() {
        container.querySelectorAll('.ch-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        badge.textContent = view === 'ext' ? 'Vue extérieure' : 'Vue intérieure (en coupe)';
        namesBtn.classList.toggle('on', showLabels);
        namesBtn.classList.toggle('off-dim', guess || !!quiz);
        guessBtn.classList.toggle('on', guess);
        guessBtn.textContent = guess ? '👁 Tout révéler' : '🙈 Devinette';
        quizBtn.classList.toggle('on', !!quiz);
        quizBtn.textContent = quiz ? '✖ Arrêter le jeu' : '🎯 Jeu : retrouve…';
    }

    function renderQuiz() {
        if (!quiz) { quizBar.classList.remove('show'); quizBar.innerHTML = ''; return; }
        quizBar.classList.add('show');
        const n = quiz.order.length;
        if (quiz.done) {
            quizBar.innerHTML = `
                <span class="ch-q-ask">🏆 Terminé ! <b>${quiz.score}</b> élément${quiz.score > 1 ? 's' : ''} trouvé${quiz.score > 1 ? 's' : ''} du premier coup sur ${n}.</span>
                <button class="ch-q-btn" data-act="again">🔁 Rejouer</button>
                <button class="ch-q-btn" data-act="stop">✖ Arrêter</button>`;
        } else {
            const target = elOf(quiz.order[quiz.i]);
            quizBar.innerHTML = `
                <span class="ch-q-ask">🎯 Clique sur : <b>${_chEsc(target.q)}</b></span>
                <span class="ch-q-score">${quiz.i + 1} / ${n} · Score : ${quiz.score}</span>
                <button class="ch-q-btn" data-act="skip">⏭ Montre-moi</button>
                <button class="ch-q-btn" data-act="stop">✖ Arrêter</button>
                <div class="ch-q-fb ${quiz.fbCls || ''}">${quiz.fb || ''}</div>`;
        }
        quizBar.querySelectorAll('.ch-q-btn').forEach(b => {
            b.addEventListener('mousedown', (e) => e.stopPropagation());
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                const act = b.dataset.act;
                if (act === 'stop') stopQuiz();
                else if (act === 'again') startQuiz();
                else if (act === 'skip') quizSkip();
            });
        });
    }

    function update() {
        renderControls();
        renderLabels();
        renderHighlight();
        renderDetail();
        renderQuiz();
    }

    function flash(id, cls) {
        if (!partsG) return;
        partsG.querySelectorAll(`.ch-part[data-id="${id}"]`).forEach(p => {
            p.classList.remove('ok', 'ko', 'hint');
            void p.getBoundingClientRect();
            p.classList.add(cls);
            setTimeout(() => p.classList.remove(cls), 1100);
        });
    }

    // ── Jeu « Retrouve… » ─────────────────────────────────────────────────
    function startQuiz() {
        quiz = {
            order: _chShuffle(els().map(e => e.id)),
            i: 0, score: 0, miss: false, found: new Set(), done: false, fb: '', fbCls: ''
        };
        selected = null;
        update();
    }
    function stopQuiz() { quiz = null; update(); }
    function nextQuestion() {
        quiz.i++;
        quiz.miss = false;
        if (quiz.i >= quiz.order.length) { quiz.done = true; quiz.i = quiz.order.length - 1; }
    }
    function quizPick(id) {
        if (!quiz || quiz.done) return;
        const target = quiz.order[quiz.i];
        if (id === target) {
            if (!quiz.miss) quiz.score++;
            quiz.found.add(id);
            flash(id, 'ok');
            quiz.fb = '✅ Bravo ! C\'est bien ' + elOf(id).q + '.';
            quiz.fbCls = 'ok';
            nextQuestion();
        } else {
            quiz.miss = true;
            flash(id, 'ko');
            quiz.fb = '❌ Non : ça, c\'est ' + elOf(id).q + '. Essaie encore !';
            quiz.fbCls = 'ko';
        }
        renderLabels();
        renderQuiz();
    }
    function quizSkip() {
        if (!quiz || quiz.done) return;
        const target = quiz.order[quiz.i];
        quiz.found.add(target);
        flash(target, 'hint');
        quiz.fb = '👉 Voici ' + elOf(target).q + '.';
        quiz.fbCls = '';
        nextQuestion();
        renderLabels();
        renderQuiz();
    }

    // ── Interactions ──────────────────────────────────────────────────────
    function onPick(id) {
        if (quiz) { quizPick(id); return; }
        if (!id) {
            if (selected) { selected = null; update(); save(); }
            return;
        }
        if (guess && !revealed[view].has(id)) {
            revealed[view].add(id);
            selected = id;
        } else {
            selected = selected === id ? null : id;
        }
        update();
        save();
    }

    function setView(v, noAnim) {
        view = v === 'int' ? 'int' : 'ext';
        selected = null;
        quiz = null;
        buildSVG(!noAnim);
        update();
    }

    _chBindTap(svg, (t) => {
        const hit = t && t.closest ? t.closest('[data-id]') : null;
        onPick(hit ? hit.dataset.id : null);
    });

    container.querySelectorAll('.ch-view-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            if (b.dataset.view !== view) { setView(b.dataset.view); save(); }
        });
    });
    namesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (guess || quiz) return;
        showLabels = !showLabels;
        update(); save();
    });
    guessBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (quiz) quiz = null;
        if (guess) {
            // « Tout révéler » : on sort du mode devinette
            guess = false;
        } else {
            guess = true;
            revealed = { ext: new Set(), int: new Set() };
            selected = null;
        }
        update(); save();
    });
    quizBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (quiz) stopQuiz(); else startQuiz();
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Taille du texte de la fiche selon la largeur du widget
    function updateFont() {
        const W = container.clientWidth || initW;
        const fs = Math.max(12, Math.min(20, W / 62));
        container.style.setProperty('--chfs', fs.toFixed(1) + 'px');
    }
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            updateFont();
        });
        ro.observe(container);
    }

    // Redimensionnement (largeur ; la hauteur suit les proportions du dessin)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startW = container.offsetWidth;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(420, startW + ev.clientX - startX) + 'px';
            updateFont();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.touches[0].clientX, startW = container.offsetWidth;
        function onMove(ev) {
            container.style.width = Math.max(420, startW + ev.touches[0].clientX - startX) + 'px';
            updateFont();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '🏰 Château fort', {
            onExpand: () => requestAnimationFrame(updateFont)
        });
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            container.classList.add('wf-fullboard');
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
        }
        requestAnimationFrame(updateFont);
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        save();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    buildSVG(false);
    update();
    updateFont();

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._chGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        view,
        showLabels,
        guess,
        revealed: { ext: Array.from(revealed.ext), int: Array.from(revealed.int) },
        selected
    });
    widget._chSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = Math.max(420, d.containerW) + 'px';
        view = d.view === 'int' ? 'int' : 'ext';
        showLabels = d.showLabels !== false;
        guess = !!d.guess;
        const okIds = (v, arr) => new Set((Array.isArray(arr) ? arr : []).filter(id => CH_DATA[v].some(e => e.id === id)));
        revealed = { ext: okIds('ext', d.revealed && d.revealed.ext), int: okIds('int', d.revealed && d.revealed.int) };
        quiz = null;
        buildSVG(false);
        selected = (typeof d.selected === 'string' && elOf(d.selected)) ? d.selected : null;
        update();
        requestAnimationFrame(updateFont);
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_chSetData');

    save();
    return widget;
}
