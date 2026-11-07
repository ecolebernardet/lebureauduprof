// =========================================================================
// LEÇON « LES FIGURES PLANES » — Le Bureau du Prof
// Leçons + arbre de tri interactif + exercices corrigés.
// Même cadre que « Les nombres décimaux ».
//
// 📖 Leçons : les polygones et leur vocabulaire, le codage, les triangles,
//    les quadrilatères (carré, rectangle, losange, parallélogramme), les
//    familles de quadrilatères (le carré est un rectangle ET un losange),
//    lire un arbre de tri.
// 🌳 Trier : des figures tournées au hasard, avec leur codage, à faire
//    descendre dans un arbre de tri (polygones, triangles ou quadrilatères)
//    en répondant aux questions de chaque branche.
// ✏️ Exercices : 🏷️ nommer, 🔎 chercher les figures d'une famille,
//    🔢 compter (côtés, sommets, angles droits, diagonales), ✔ vrai ou faux.
//
// Ouverture : createWidget('figures-planes')  ou  createFiguresPlanesWidget()
// Sauvegarde : w._fgpGetData()  /  createFiguresPlanesWidget(données)
//   (branché dans save-load.js : champ fgpData)
// =========================================================================

(function () {

    // ── Plein écran automatique (bouton vert) sur téléphone ET tablette ────
    // Partagé par les jeux. Mêmes conditions que board.js et style-phone.css
    // (window.PHONE_MEDIA_QUERY / window.TABLET_MEDIA_QUERY) :
    //   • téléphone (portrait ou paysage) ;
    //   • tablette tactile (iPad, iPad mini, tablette Android).
    // Ordinateur et TBI à la souris/au stylet : ouverture normale en fenêtre.
    if (!window._jeuWantsFullboard) {
        window._jeuWantsFullboard = function () {
            try {
                if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) return true;
                if (typeof isTabletBoardMode === 'function' && isTabletBoardMode()) return true;
                if (typeof isPhoneScreen === 'function' && isPhoneScreen()) return true;
                if (!window.matchMedia) return false;
                var phoneQ  = window.PHONE_MEDIA_QUERY  || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)';
                var tabletQ = window.TABLET_MEDIA_QUERY || '(pointer: coarse) and (min-width: 601px) and (min-height: 501px)';
                if (window.matchMedia(phoneQ).matches || window.matchMedia(tabletQ).matches) return true;
            } catch (e) {}
            return false;
        };
    }

    // ── Curseurs : flèche par défaut, main sur la barre du haut (elle déplace
    //    le widget), doigt sur tout ce qui se clique
    if (!document.getElementById('figures-planes-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'figures-planes-cursors-style';
        _cs.textContent = [
            '.widget[data-type="figures-planes"] .fgp-header :not(button):not(button *):not(select):not(input) { cursor: inherit !important; }',
            '.widget[data-type="figures-planes"] .drag-handle, .widget[data-type="figures-planes"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="figures-planes"] .drag-handle:active, .widget[data-type="figures-planes"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            '.widget[data-type="figures-planes"] .fgp-container.wf-fullboard .fgp-header, .widget[data-type="figures-planes"] .fgp-container.wf-fullboard .fgp-header:active,',
            '.widget.phone-fs[data-type="figures-planes"] .fgp-header, .widget.phone-fs[data-type="figures-planes"] .fgp-header:active { cursor: default !important; }',
            '.widget[data-type="figures-planes"] button:not(:disabled), .widget[data-type="figures-planes"] button:not(:disabled) *, .widget[data-type="figures-planes"] select,',
            '.widget[data-type="figures-planes"] .widget-menu-handle, .widget[data-type="figures-planes"] .widget-pin-handle,',
            '.widget[data-type="figures-planes"] .widget-back-handle, .widget[data-type="figures-planes"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="figures-planes"] button:disabled, .widget[data-type="figures-planes"] button:disabled * { cursor: default !important; }',
            '.widget[data-type="figures-planes"]:has(.fgp-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    'use strict';

    const TYPE = 'figures-planes';

    // ── Barre réduite (bouton jaune), si aucun autre fichier ne l'a définie ──
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function (widget, label, opts) {
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
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');
            const miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:grab;user-select:none;gap:6px;z-index:1;';
            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown', e => e.stopPropagation());
            expandBtn.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', e => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId); miniBar.style.cursor = 'grabbing';
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp); miniBar.style.cursor = 'grab';
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

    // ── Boutons fenêtre (CSS partagé) ─────────────────────────────────────
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
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }`;
        document.head.appendChild(ws);
    }

    // ── CSS (préfixe fgp-) ─────────────────────────────────────────────────
    if (!document.getElementById('fgp-style')) {
        const s = document.createElement('style');
        s.id = 'fgp-style';
        s.textContent = `
.widget[data-type="figures-planes"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.fgp-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --ce:#e07b2a; --c1:#0891b2; --c2:#7c3aed; --c3:#D63384;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.fgp-container input { user-select:text; -webkit-user-select:text; }
.fgp-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:600px), (max-height:500px) and (pointer:coarse) {
    .fgp-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .fgp-tab-lbl { display:none; }
    .fgp-title { font-size:17px !important; }
    .fgp-lesson { flex-direction:column; }
    .fgp-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .fgp-gbtn { flex:1 1 auto; text-align:center !important; }
    .fgp-srow > .l { min-width:0 !important; width:100%; }
}
.fgp-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.fgp-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.fgp-tabs { display:flex; gap:6px; margin-left:12px; }
.fgp-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.fgp-tab:hover { background:rgba(255,255,255,.1); }
.fgp-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.fgp-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.fgp-icon-btn:hover { background:rgba(255,255,255,.28); }
.fgp-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Couleurs : partie entière, virgule, dixièmes, centièmes, millièmes */
.fgp-ce { color:var(--ce); } .fgp-k1 { color:var(--c1); } .fgp-k2 { color:var(--c2); } .fgp-k3 { color:var(--c3); }
.fgp-virg { color:var(--rouge); font-weight:900; }
.fgp-num { font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; white-space:nowrap; letter-spacing:.02em; }
.fgp-words { font-weight:800; line-height:1.5; }
.fgp-frac { display:inline-flex; flex-direction:column; align-items:stretch; text-align:center; vertical-align:middle; line-height:1.05; margin:0 3px;
    font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; }
.fgp-frac > span { padding:0 4px; }
.fgp-frac > span:first-child { padding-bottom:.06em; }
/* Dénominateur : un peu d'espace sous la barre de fraction */
.fgp-frac > span + span { border-top:2.5px solid currentColor; padding-top:.16em; }

/* ── Tableau de numération ── */
.fgp-twrap { overflow-x:auto; display:flex; justify-content:center; padding:2px; }
.fgp-table { --cw:54px; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.fgp-table th, .fgp-table td { text-align:center; padding:0; }
.fgp-table .kh { color:#fff; font-weight:900; font-size:calc(var(--cw) * .27); padding:5px 6px; letter-spacing:.3px; white-space:nowrap; }
.fgp-table .kh.ke { background:var(--ce); } .fgp-table .kh.kd { background:linear-gradient(90deg,var(--c1),var(--c2),var(--c3)); }
.fgp-table .ch { font-weight:900; font-size:calc(var(--cw) * .3); padding:3px 2px; width:var(--cw); }
.fgp-table .ch.kd { font-size:calc(var(--cw) * .2); width:calc(var(--cw) * 1.3); }
.fgp-table .ch.ke, .fgp-table td.ke { background:#fdf0e5; color:var(--ce); }
.fgp-table .ch.k1, .fgp-table td.k1 { background:#e6f7fb; color:var(--c1); }
.fgp-table .ch.k2, .fgp-table td.k2 { background:#f3edff; color:var(--c2); }
.fgp-table .ch.k3, .fgp-table td.k3 { background:#fdeaf3; color:var(--c3); }
.fgp-table td { height:calc(var(--cw) * 1.15); font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .78); font-weight:700; color:var(--encre) !important;
    border-top:2px solid rgba(0,0,0,.06); }
.fgp-table .vh, .fgp-table .virg { width:calc(var(--cw) * .32); background:#fff; }
/* La virgule : même police, même taille et même alignement que les chiffres, pour être posée sur leur ligne */
.fgp-table td.virg { color:var(--rouge) !important; font-size:calc(var(--cw) * .78); vertical-align:middle; line-height:normal; }
.fgp-table .dim { opacity:.3; }
.fgp-table .hlc { box-shadow:inset 0 0 0 4px #ff4f5e; background:#ffe9eb !important; }
.fgp-table td.click:hover { filter:brightness(.95); }
.fgp-table td.ed { padding:3px; }
.fgp-table td input { width:100%; height:100%; box-sizing:border-box; border:2px dashed #c7bca6; border-radius:8px; background:#fff; text-align:center;
    font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .7); font-weight:700; color:#3949AB; outline:none; padding:0; }
.fgp-table td input:focus { border:3px solid var(--violet); background:#f3efff; }
.fgp-table td input.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.fgp-table td input.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.fgp-table.small { --cw:40px; }

/* ── Dessins (bande unité, quadrillage, droite graduée) ── */
.fgp-fig { display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:flex-end; }
.fgp-fig figure { margin:0; display:flex; flex-direction:column; align-items:center; gap:4px; }
.fgp-fig figcaption { font-weight:800; font-size:15px; text-align:center; }
.fgp-svg { display:block; max-width:100%; height:auto; }
.fgp-line { width:100%; max-width:680px; margin:0 auto; }

/* ── Leçons ── */
.fgp-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.fgp-side { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.fgp-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.fgp-gbtn:hover { transform:translateX(2px); }
.fgp-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.fgp-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.fgp-ltitle h2 { margin:0; font-size:32px; font-weight:900; }
.fgp-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.55; }
.fgp-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.fgp-box ul, .fgp-box ol { margin:4px 0 0; padding-left:22px; }
.fgp-what { background:#f1edff; border:2px solid #c8bbf5; }
.fgp-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.fgp-memo { background:#fff6d6; border:2px solid #f3d36b; }
.fgp-trap { background:#ffecee; border:2px solid #f6a7b0; }
.fgp-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.fgp-big { font-size:22px; }
.fgp-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.fgp-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.fgp-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.fgp-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.fgp-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.fgp-btn:disabled { opacity:.45; }
.fgp-steps { display:flex; flex-direction:column; gap:6px; }
.fgp-step { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:6px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.fgp-step > span:last-child { flex:1; min-width:0; }
.fgp-step .n { background:var(--encre); color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:900; flex-shrink:0; }
.fgp-ftable { border-collapse:collapse; margin:4px auto 0; font-size:20px; }
.fgp-ftable td { padding:4px 14px; border-bottom:1px dashed #e3d8c3; text-align:center; }
.fgp-ftable td.w { font-size:14px; font-weight:800; color:#6a6380; text-align:left; }

/* ── Explorer ── */
.fgp-ex { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.fgp-bar { display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
.fgp-in { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:26px; font-weight:700; padding:4px 12px; width:220px; max-width:100%; box-sizing:border-box;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; text-align:center; }
.fgp-in:focus { border-color:var(--violet); }
.fgp-panel { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 14px; }
.fgp-panel h4 { margin:0 0 6px; font-size:15px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.fgp-read { font-size:22px; text-align:center; }
.fgp-dec { display:flex; flex-direction:column; gap:4px; font-size:21px; }
.fgp-dec .row { display:flex; flex-direction:column; gap:0; padding:3px 0; border-bottom:1px dashed #eee4d2; }
.fgp-dec .row:last-child { border-bottom:none; }
.fgp-dec .lbl { font-size:12px; font-weight:900; color:#9a8f7a; text-transform:uppercase; }
.fgp-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:8px 14px; font-weight:700; text-align:center; font-size:17px; }
.fgp-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.fgp-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.fgp-hint { font-size:12.5px; color:#6a6380; }

/* ── Exercices ── */
.fgp-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.fgp-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.fgp-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fgp-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.fgp-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.fgp-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.fgp-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.fgp-pill.score { background:var(--vert); font-size:16px; }
.fgp-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.fgp-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 400px)),1fr)); }
.fgp-grid.one { grid-template-columns:1fr; }
.fgp-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .3); min-width:0; }
.fgp-q.ok { border-color:var(--vert); background:#f3fcf7; }
.fgp-q.ko { border-color:var(--rouge); background:#fff5f6; }
.fgp-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.fgp-n { font-weight:900; color:#9a8f7a; }
.fgp-qmain { text-align:center; font-size:var(--f); line-height:1.5; }
.fgp-qwords { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
.fgp-ans { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .9); font-weight:700; padding:2px 10px; width:100%; max-width:260px; box-sizing:border-box;
    border:2px dashed #b9abef; border-radius:12px; outline:none; color:#3949AB; background:#fff; text-align:center; align-self:center; }
.fgp-ans.mini { width:auto; max-width:none; font-size:calc(var(--f) * .72); padding:0 6px; border-radius:8px; vertical-align:baseline; }
/* Case à remplir dans une fraction (numérateur) ou entre deux nombres : largeur adaptée */
.fgp-ans.mini { width:calc(var(--f) * 3.6); }
.fgp-frac .fgp-ans.mini { width:calc(var(--f) * 2.4); margin-bottom:.1em; }
.fgp-ans:focus { border:3px solid var(--violet); background:#f3efff; }
.fgp-ans.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.fgp-ans.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.fgp-cmp { display:flex; align-items:center; justify-content:center; gap:calc(var(--f) * .4); flex-wrap:wrap; font-size:var(--f); }
.fgp-sign { border:2px solid #d9cdb6; background:#fff; border-radius:12px; min-width:calc(var(--f) * 1.5); padding:0 8px; font:inherit; font-weight:900; font-size:calc(var(--f) * .8);
    color:var(--encre); touch-action:manipulation; line-height:1.4; }
.fgp-sign.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.fgp-sign.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.fgp-sign.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.fgp-pool, .fgp-order { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; align-items:center; min-height:calc(var(--f) * 1.5); }
.fgp-order { background:#faf6ee; border:2px dashed #d9cdb6; border-radius:12px; padding:4px 8px; }
.fgp-rk { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:0 12px; font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700;
    font-size:calc(var(--f) * .8); color:var(--encre); touch-action:manipulation; line-height:1.4; }
.fgp-rk.used { opacity:.25; }
.fgp-rk.in { border-color:var(--violet); background:#f3efff; }
.fgp-lt { font-weight:900; font-size:calc(var(--f) * .7); color:#9a8f7a; }
.fgp-why { font-size:14px; color:#5a5470; text-align:center; line-height:1.45; }
.fgp-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:fgp-fall 1.6s ease-in forwards; }
@keyframes fgp-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.fgp-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.fgp-help.show { display:block; }
.fgp-help h4 { margin:0 0 6px; font-size:15px; }
.fgp-help p { margin:0 0 6px; }
.fgp-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.fgp-container:hover .fgp-resize { opacity:1; }
.fgp-container.wf-fullboard .fgp-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="figures-planes"], .fgp-container, .fgp-container * { cursor:default !important; }
.fgp-container .fgp-header { cursor:grab !important; }
.fgp-container .fgp-header:active { cursor:grabbing !important; }
.fgp-container button, .fgp-container [data-act] { cursor:pointer !important; }
.fgp-container button:disabled { cursor:default !important; }
.fgp-container input { cursor:text !important; }
.fgp-container .fgp-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // ── CSS propre aux figures planes ────────────────────────────────────
    if (!document.getElementById('fgp-style2')) {
        const s2 = document.createElement('style');
        s2.id = 'fgp-style2';
        s2.textContent = `
.fgp-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; }
.fgp-shape { display:block; width:100%; height:auto; }
/* Cartes de figures (leçons) */
.fgp-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; }
.fgp-card { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:8px 10px; display:flex; flex-direction:column; align-items:center; gap:4px; text-align:center; }
.fgp-card .fs { width:110px; }
.fgp-card h5 { margin:0; font-size:16px; font-weight:900; }
.fgp-card ul { margin:0; padding-left:18px; text-align:left; font-size:13.5px; line-height:1.45; align-self:stretch; }
.fgp-card.no { border-style:dashed; opacity:.85; }
.fgp-ptab { border-collapse:separate; border-spacing:0; background:#fff; border-radius:12px; overflow:hidden; margin:0 auto; font-size:14.5px; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.fgp-ptab th { background:var(--encre); color:#fff; padding:6px 10px; font-size:13.5px; }
.fgp-ptab td { padding:5px 10px; border-bottom:1px solid #f0e8d8; text-align:center; font-weight:800; }
.fgp-ptab td:first-child { text-align:left; }
.fgp-ptab .y { color:#178a4b; } .fgp-ptab .n { color:#c9bfae; }
/* Arbre de tri */
.fgp-sort { display:flex; gap:12px; padding:12px 14px 16px; align-items:flex-start; }
.fgp-left { width:270px; flex-shrink:0; display:flex; flex-direction:column; gap:10px; }
.fgp-right { flex:1; min-width:0; overflow-x:auto; }
.fgp-tray { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.fgp-fb { border:2px solid #e3d8c3; background:#fff; border-radius:12px; padding:3px; touch-action:manipulation; aspect-ratio:1; }
.fgp-fb:hover { border-color:#b9abef; }
.fgp-fb.on { border-color:var(--violet); box-shadow:0 0 0 3px #d9cffb; }
.fgp-fb.ok { border-color:var(--vert); background:#f3fcf7; }
.fgp-fb.ko { border-color:var(--rouge); background:#fff5f6; }
.fgp-fb.miss { border-color:var(--vert); border-style:dashed; }
.fgp-fb.empty { visibility:hidden; }
.fgp-quest { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px; display:flex; flex-direction:column; gap:8px; align-items:center; text-align:center; }
.fgp-quest .big { width:150px; }
.fgp-quest .q { font-size:18px; font-weight:900; }
.fgp-ansbar { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.fgp-ansbtn { border:none; border-radius:12px; padding:8px 18px; font:inherit; font-weight:900; font-size:17px; background:var(--violet); color:#fff;
    box-shadow:0 4px 0 #4a34a3; touch-action:manipulation; }
.fgp-ansbtn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.fgp-fb2 { font-size:14px; font-weight:800; border-radius:12px; padding:6px 10px; }
.fgp-fb2.good { background:#e2f7ec; color:#178a4b; } .fgp-fb2.bad { background:#ffe9eb; color:#c0293a; }
.fgp-tree { display:flex; justify-content:center; min-width:min-content; padding:4px 4px 8px; }
.fgp-tn { display:flex; flex-direction:column; align-items:center; }
.fgp-node { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:5px 8px; font-weight:900; font-size:12.5px; max-width:128px; text-align:center; line-height:1.3; }
.fgp-node.leaf { background:#f1edff; border-color:#c8bbf5; min-width:84px; }
.fgp-node.path { border-color:var(--violet); background:#efeaff; }
.fgp-node.cur { border-color:#FFC933; background:#fff6d6; box-shadow:0 0 0 4px #ffe58a; animation:fgp-pulse 1.2s ease-in-out infinite; }
.fgp-node.leaf.hit { border-color:var(--vert); background:#e2f7ec; }
@keyframes fgp-pulse { 50% { box-shadow:0 0 0 7px #fff0b8; } }
.fgp-bin { display:flex; flex-wrap:wrap; gap:2px; justify-content:center; margin-top:4px; min-height:4px; }
.fgp-bin .fs { width:30px; }
.fgp-kids { display:flex; justify-content:center; position:relative; padding-top:16px; }
.fgp-kids::before { content:''; position:absolute; top:0; left:50%; height:16px; border-left:2px solid #c9bfae; }
.fgp-kid { position:relative; padding:16px 2px 0; display:flex; flex-direction:column; align-items:center; }
.fgp-kid::before, .fgp-kid::after { content:''; position:absolute; top:0; right:50%; width:50%; height:16px; border-top:2px solid #c9bfae; }
.fgp-kid::after { right:auto; left:50%; border-left:2px solid #c9bfae; }
.fgp-kid:only-child::before { display:none; }
.fgp-kid:only-child::after { border-top:none; }
.fgp-kid:first-child::before, .fgp-kid:last-child::after { border-top:none; }
.fgp-kid:last-child::before { border-right:2px solid #c9bfae; border-radius:0 6px 0 0; }
.fgp-kid:first-child::after { border-radius:6px 0 0 0; }
.fgp-edge { font-size:12px; font-weight:900; color:#6a6380; background:#faf6ee; border-radius:999px; padding:0 7px; margin-bottom:4px; position:relative; z-index:1; }
.fgp-edge.path { background:var(--violet); color:#fff; }
/* Exercices */
.fgp-qfig { width:calc(var(--f) * 5.2); max-width:100%; align-self:center; }
.fgp-opts { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.fgp-opt { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:2px 12px; font:inherit; font-weight:800; font-size:calc(var(--f) * .55);
    color:var(--encre); touch-action:manipulation; line-height:1.5; }
.fgp-opt.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.fgp-opt.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.fgp-opt.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.fgp-fgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.fgp-stmt { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
@media (max-width:600px), (max-height:500px) and (pointer:coarse) {
    .fgp-sort { flex-direction:column; align-items:stretch; }
    .fgp-left { width:auto; }
    .fgp-fgrid { grid-template-columns:repeat(3,1fr); }
}
`;
        document.head.appendChild(s2);
    }

    // =====================================================================
    // OUTILS
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr, R) { R = R || Math.random; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const between = (R, a, b) => a + R() * (b - a);
    // Générateur pseudo-aléatoire reproductible (figures des leçons toujours identiques)
    function seeded(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

    // =====================================================================
    // LES FIGURES : propriétés de chaque sorte
    //   n : nombre de côtés (0 = pas un polygone) ; right : angles droits ;
    //   eq4 : 4 côtés égaux ; eq3 : 3 côtés égaux ; eq2 : au moins 2 côtés égaux ;
    //   par : côtés opposés parallèles ; fam : famille (pour la couleur)
    // =====================================================================
    const K = {
        carre:           { name: 'carré',                     n: 4, right: 4, eq4: true,  par: true,  fam: 'q' },
        rectangle:       { name: 'rectangle',                 n: 4, right: 4, eq4: false, par: true,  fam: 'q' },
        losange:         { name: 'losange',                   n: 4, right: 0, eq4: true,  par: true,  fam: 'q' },
        parallelogramme: { name: 'parallélogramme',           n: 4, right: 0, eq4: false, par: true,  fam: 'q' },
        quad:            { name: 'quadrilatère quelconque',   n: 4, right: 0, eq4: false, par: false, fam: 'q' },
        tri_equi:        { name: 'triangle équilatéral',      n: 3, right: 0, eq3: true,  eq2: true,  fam: 't' },
        tri_iso:         { name: 'triangle isocèle',          n: 3, right: 0, eq3: false, eq2: true,  fam: 't' },
        tri_rect:        { name: 'triangle rectangle',        n: 3, right: 1, eq3: false, eq2: false, fam: 't' },
        tri_rect_iso:    { name: 'triangle rectangle isocèle',n: 3, right: 1, eq3: false, eq2: true,  fam: 't' },
        tri_quel:        { name: 'triangle quelconque',       n: 3, right: 0, eq3: false, eq2: false, fam: 't' },
        penta:           { name: 'pentagone',                 n: 5, right: 0, fam: 'p' },
        hexa:            { name: 'hexagone',                  n: 6, right: 0, fam: 'p' },
        octo:            { name: 'octogone',                  n: 8, right: 0, fam: 'p' },
        cercle:          { name: 'cercle',                    n: 0, right: 0, fam: 'x' },
        ouverte:         { name: 'ligne brisée ouverte',      n: 0, right: 0, fam: 'x' },
        courbe:          { name: 'figure avec un côté courbe',n: 0, right: 0, fam: 'x' }
    };
    const FILL = { q: '#d9ecff', t: '#ffe8cc', p: '#e2f7ec', x: '#f1edff' };
    // Nom simple (niveau 1)
    function shortName(k) {
        const p = K[k];
        if (k === 'carre' || k === 'rectangle') return p.name;
        if (p.n === 3) return 'triangle';
        if (p.n === 4) return 'quadrilatère';
        if (p.n === 0) return 'pas un polygone';
        return p.name;
    }

    // ── Fabrication d'une figure (points avant rotation) ──
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    function angleAt(P, i) {
        const n = P.length, A = P[(i + n - 1) % n], B = P[i], C = P[(i + 1) % n];
        const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]];
        return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))))) * 180 / Math.PI;
    }
    const sides = P => P.map((p, i) => dist(p, P[(i + 1) % P.length]));
    function noSpecial(P) {
        // Ni côtés presque égaux, ni angle presque droit, ni côtés opposés presque parallèles
        const S = sides(P);
        for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) if (Math.abs(S[i] - S[j]) / Math.max(S[i], S[j]) < .14) return false;
        for (let i = 0; i < P.length; i++) { const a = angleAt(P, i); if (Math.abs(a - 90) < 12 || a < 28) return false; }
        if (P.length === 4) {
            const dir = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
            const par = (i, j) => { let d = Math.abs(dir(P[i], P[(i + 1) % 4]) - dir(P[j], P[(j + 1) % 4])) % Math.PI; d = Math.min(d, Math.PI - d); return d < .17; };
            if (par(0, 2) || par(1, 3)) return false;
        }
        return true;
    }
    function regular(n, r, rot0) { const P = []; for (let i = 0; i < n; i++) { const a = rot0 + i * 2 * Math.PI / n; P.push([r * Math.cos(a), r * Math.sin(a)]); } return P; }
    // Renvoie { kind, pts, eq: [[côtés égaux]…], ra: [sommets à angle droit], open, circle, curve }
    function baseFig(kind, R) {
        const all = n => [Array.from({ length: n }, (_, i) => i)];
        switch (kind) {
            case 'carre': return { pts: [[0, 0], [60, 0], [60, 60], [0, 60]], eq: all(4), ra: [0, 1, 2, 3] };
            case 'rectangle': { const L = between(R, 70, 82), l = between(R, 34, 46); return { pts: [[0, 0], [L, 0], [L, l], [0, l]], eq: [[0, 2], [1, 3]], ra: [0, 1, 2, 3] }; }
            case 'losange': { const w = between(R, 34, 42), h = between(R, 18, 25); return { pts: [[w, 0], [0, h], [-w, 0], [0, -h]], eq: all(4), ra: [] }; }
            case 'parallelogramme': {
                for (let t = 0; t < 50; t++) {
                    const L = between(R, 52, 70), h = between(R, 28, 40), d = between(R, 16, 30);
                    if (Math.abs(Math.hypot(d, h) - L) / L > .18) return { pts: [[0, 0], [L, 0], [L + d, h], [d, h]], eq: [[0, 2], [1, 3]], ra: [] };
                }
                return { pts: [[0, 0], [64, 0], [88, 34], [24, 34]], eq: [[0, 2], [1, 3]], ra: [] };
            }
            case 'quad': {
                for (let t = 0; t < 3000; t++) {
                    const a0 = between(R, 0, .6), P = [0, 1, 2, 3].map(i => { const a = a0 + i * Math.PI / 2 + between(R, -.45, .45), r = between(R, 26, 44); return [r * Math.cos(a), r * Math.sin(a)]; });
                    if (noSpecial(P) && P.every((p, i) => angleAt(P, i) < 165)) return { pts: P, eq: [], ra: [] };
                }
                return { pts: [[0, 0], [67, 2], [32, 42], [11, 35]], eq: [], ra: [] };   // secours : angles 71°, 51°, 113°, 126°, côtés tous différents
            }
            case 'tri_equi': return { pts: regular(3, 38, -Math.PI / 2), eq: all(3), ra: [] };
            case 'tri_iso': {
                let a;
                do { a = between(R, 30, 115); } while (Math.abs(a - 60) < 12 || Math.abs(a - 90) < 12);
                const s = 58 * Math.sin(a * Math.PI / 360), c = 58 * Math.cos(a * Math.PI / 360);
                return { pts: [[0, 0], [-s, c], [s, c]], eq: [[0, 2]], ra: [] };
            }
            case 'tri_rect': { let a, b; do { a = between(R, 40, 75); b = between(R, 30, 62); } while (Math.abs(a - b) / Math.max(a, b) < .25); return { pts: [[0, 0], [a, 0], [0, b]], eq: [], ra: [0] }; }
            case 'tri_rect_iso': return { pts: [[0, 0], [56, 0], [0, 56]], eq: [[0, 2]], ra: [0] };
            case 'tri_quel': {
                // On tire les angles en A et en B (le 3e angle s'en déduit), puis on construit le triangle
                for (let t = 0; t < 3000; t++) {
                    const a = between(R, 30, 118), b = between(R, 30, 118), c = 180 - a - b, rad = Math.PI / 180;
                    if (c < 30) continue;
                    const L = 70, AC = L * Math.sin(b * rad) / Math.sin(c * rad);
                    const P = [[0, 0], [L, 0], [AC * Math.cos(a * rad), AC * Math.sin(a * rad)]];
                    if (noSpecial(P)) return { pts: P, eq: [], ra: [] };
                }
                return { pts: [[0, 0], [80, 0], [50, 30]], eq: [], ra: [] };   // secours : angles 31°, 45°, 104°, côtés 80, 42, 58
            }
            case 'penta': return { pts: regular(5, 38, -Math.PI / 2), eq: all(5), ra: [] };
            case 'hexa': return { pts: regular(6, 38, 0), eq: all(6), ra: [] };
            case 'octo': return { pts: regular(8, 38, Math.PI / 8), eq: all(8), ra: [] };
            case 'cercle': return { circle: true, pts: [], eq: [], ra: [] };
            case 'ouverte': return { open: true, pts: [[0, 30], [22, 0], [44, 34], [66, 4], [80, 40]], eq: [], ra: [] };
            default: return { curve: true, pts: [[0, 0], [70, 0]], eq: [], ra: [] };   // courbe : un segment + un demi-cercle
        }
    }
    // Figure prête à dessiner : tournée de « rot » degrés (au hasard si absent), centrée dans 0..100
    function makeFig(kind, R, rot) {
        R = R || Math.random;
        const f = baseFig(kind, R);
        const th = (rot != null ? rot : between(R, 0, 360)) * Math.PI / 180;
        const turn = p => [p[0] * Math.cos(th) - p[1] * Math.sin(th), p[0] * Math.sin(th) + p[1] * Math.cos(th)];
        let P = f.pts.map(turn);
        if (f.circle) return { kind, circle: true, pts: [], eq: [], ra: [] };
        // Points utilisés pour le cadrage (le demi-cercle est échantillonné)
        let box = P.slice();
        if (f.curve) {
            const A = P[0], B = P[1], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], r = dist(A, B) / 2;
            const a0 = Math.atan2(A[1] - M[1], A[0] - M[0]);
            for (let i = 0; i <= 16; i++) { const a = a0 - i * Math.PI / 16; box.push([M[0] + r * Math.cos(a), M[1] + r * Math.sin(a)]); }
        }
        const xs = box.map(p => p[0]), ys = box.map(p => p[1]);
        const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
        const k = 70 / Math.max(w, h, 1), cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
        P = P.map(p => [Math.round((50 + (p[0] - cx) * k) * 10) / 10, Math.round((50 + (p[1] - cy) * k) * 10) / 10]);
        return { kind, pts: P, eq: f.eq, ra: f.ra, open: !!f.open, curve: !!f.curve };
    }

    // ── Dessin SVG d'une figure, avec son codage ──
    function figSvg(f, opts) {
        opts = opts || {};
        const p = K[f.kind], ink = '#2A1F4A', fill = FILL[p.fam];
        let r = `<svg class="fgp-shape" viewBox="0 0 100 100" aria-label="${esc(p.name)}">`;
        if (f.circle) return r + `<circle cx="50" cy="50" r="35" fill="${fill}" stroke="${ink}" stroke-width="2.4"/>${opts.center ? '<circle cx="50" cy="50" r="1.6" fill="#2A1F4A"/>' : ''}</svg>`;
        const P = f.pts, pt = q => q[0] + ' ' + q[1];
        if (f.open) return r + `<polyline points="${P.map(q => q.join(',')).join(' ')}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>${P.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="1.8" fill="${ink}"/>`).join('')}</svg>`;
        if (f.curve) {
            const rad = dist(P[0], P[1]) / 2;
            return r + `<path d="M${pt(P[0])} L${pt(P[1])} A ${rad} ${rad} 0 0 1 ${pt(P[0])} Z" fill="${fill}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
        }
        r += `<polygon points="${P.map(q => q.join(',')).join(' ')}" fill="${fill}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
        if (opts.diag && P.length >= 4) {
            for (let i = 0; i < P.length; i++) for (let j = i + 2; j < P.length; j++) {
                if (i === 0 && j === P.length - 1) continue;
                r += `<line x1="${P[i][0]}" y1="${P[i][1]}" x2="${P[j][0]}" y2="${P[j][1]}" stroke="#6C4FD8" stroke-width="1.6" stroke-dasharray="4 3"/>`;
            }
        }
        if (opts.codage !== false) {
            // Angles droits : un petit carré
            f.ra.forEach(i => {
                const n = P.length, B = P[i], A = P[(i + n - 1) % n], C = P[(i + 1) % n];
                const u = [(A[0] - B[0]) / dist(A, B), (A[1] - B[1]) / dist(A, B)], v = [(C[0] - B[0]) / dist(C, B), (C[1] - B[1]) / dist(C, B)], s = 6.5;
                r += `<polyline points="${B[0] + u[0] * s},${B[1] + u[1] * s} ${B[0] + (u[0] + v[0]) * s},${B[1] + (u[1] + v[1]) * s} ${B[0] + v[0] * s},${B[1] + v[1] * s}" fill="none" stroke="#0891b2" stroke-width="2"/>`;
            });
            // Côtés de même longueur : autant de petits traits que le numéro du groupe
            f.eq.forEach((g, gi) => g.forEach(i => {
                const A = P[i], B = P[(i + 1) % P.length], L = dist(A, B), d = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], nr = [-d[1], d[0]];
                const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
                for (let j = 0; j <= gi; j++) {
                    const off = (j - gi / 2) * 2.8, C = [M[0] + d[0] * off, M[1] + d[1] * off];
                    r += `<line x1="${C[0] + nr[0] * 3.6}" y1="${C[1] + nr[1] * 3.6}" x2="${C[0] - nr[0] * 3.6}" y2="${C[1] - nr[1] * 3.6}" stroke="#D63384" stroke-width="2" stroke-linecap="round"/>`;
                }
            }));
        }
        if (opts.labels) {
            // Lettres des sommets, un peu à l'extérieur
            const cx = P.reduce((s, q) => s + q[0], 0) / P.length, cy = P.reduce((s, q) => s + q[1], 0) / P.length;
            P.forEach((q, i) => { const dx = q[0] - cx, dy = q[1] - cy, l = Math.hypot(dx, dy) || 1; r += `<text x="${q[0] + dx / l * 7}" y="${q[1] + dy / l * 7 + 3}" text-anchor="middle" font-size="9" font-weight="900" fill="${ink}" font-family="Nunito,sans-serif">${'ABCDEFGH'[i]}</text>`; });
        }
        return r + '</svg>';
    }
    const figHtml = (f, cls, opts) => `<div class="fs ${cls || ''}">${figSvg(f, opts)}</div>`;

    // =====================================================================
    // ARBRES DE TRI
    // Un nœud question : { q, hint, f(kind) → étiquette de branche, kids: [[étiquette, nœud]] }
    // Une feuille : { leaf: 'nom' }
    // =====================================================================
    const L = t => ({ leaf: t });
    const TREES = {
        poly: { label: '🔷 Polygones', root: {
            q: 'Est-ce un polygone ?', hint: 'Un polygone est une figure fermée dont tous les côtés sont des segments (des lignes droites).',
            f: k => K[k].n ? 'oui' : 'non',
            kids: [['non', L('Pas un polygone')], ['oui', {
                q: 'Combien a-t-il de côtés ?', hint: 'Compte les côtés, ou les sommets : il y en a autant.',
                f: k => String(K[k].n),
                kids: [['3', L('Triangle')], ['4', L('Quadrilatère')], ['5', L('Pentagone')], ['6', L('Hexagone')], ['8', L('Octogone')]]
            }]]
        }},
        tri: { label: '🔺 Triangles', root: {
            q: 'A-t-il un angle droit ?', hint: 'Cherche le petit carré bleu : c\'est le codage d\'un angle droit.',
            f: k => K[k].right ? 'oui' : 'non',
            kids: [['oui', {
                q: 'A-t-il 2 côtés égaux ?', hint: 'Les côtés égaux portent les mêmes petits traits roses.',
                f: k => K[k].eq2 ? 'oui' : 'non',
                kids: [['oui', L('Triangle rectangle isocèle')], ['non', L('Triangle rectangle')]]
            }], ['non', {
                q: 'A-t-il 3 côtés égaux ?', hint: 'Regarde les petits traits roses sur les côtés.',
                f: k => K[k].eq3 ? 'oui' : 'non',
                kids: [['oui', L('Triangle équilatéral')], ['non', {
                    q: 'A-t-il 2 côtés égaux ?', hint: 'Les côtés égaux portent les mêmes petits traits roses.',
                    f: k => K[k].eq2 ? 'oui' : 'non',
                    kids: [['oui', L('Triangle isocèle')], ['non', L('Triangle quelconque')]]
                }]]
            }]]
        }},
        quad: { label: '🟦 Quadrilatères', root: {
            q: 'A-t-il 4 angles droits ?', hint: 'Cherche les petits carrés bleus aux sommets : il en faut 4.',
            f: k => K[k].right === 4 ? 'oui' : 'non',
            kids: [['oui', {
                q: 'A-t-il 4 côtés égaux ?', hint: 'Regarde les petits traits roses : sont-ils tous pareils ?',
                f: k => K[k].eq4 ? 'oui' : 'non',
                kids: [['oui', L('Carré')], ['non', L('Rectangle')]]
            }], ['non', {
                q: 'A-t-il 4 côtés égaux ?', hint: 'Regarde les petits traits roses : sont-ils tous pareils ?',
                f: k => K[k].eq4 ? 'oui' : 'non',
                kids: [['oui', L('Losange')], ['non', {
                    q: 'Ses côtés opposés sont-ils parallèles et égaux ?', hint: 'Côtés opposés égaux : ils portent les mêmes traits (1 trait avec 1 trait, 2 avec 2).',
                    f: k => K[k].par ? 'oui' : 'non',
                    kids: [['oui', L('Parallélogramme')], ['non', L('Quadrilatère quelconque')]]
                }]]
            }]]
        }}
    };
    // Numérote les nœuds (n0, n1…) pour les retrouver
    Object.keys(TREES).forEach(t => {
        let c = 0;
        (function walk(n) { n.id = t + (c++); if (n.kids) n.kids.forEach(k => walk(k[1])); })(TREES[t].root);
    });
    function nodeById(tree, id) {
        let out = null;
        (function walk(n) { if (n.id === id) out = n; if (!out && n.kids) n.kids.forEach(k => walk(k[1])); })(TREES[tree].root);
        return out;
    }
    // Chemin attendu pour une figure : [{ node, label }] jusqu'à la feuille
    function expectedPath(tree, kind) {
        const out = []; let n = TREES[tree].root;
        while (n && !n.leaf) { const lab = n.f(kind), k = n.kids.find(x => x[0] === lab); out.push({ node: n, label: lab }); n = k ? k[1] : null; }
        return { steps: out, leaf: n };
    }
    const TREE_KINDS = {
        poly: { must: ['tri_quel', 'carre', 'penta', 'hexa', 'cercle', 'ouverte'], more: ['tri_iso', 'rectangle', 'losange', 'octo', 'courbe', 'quad', 'tri_rect'] },
        tri:  { must: ['tri_equi', 'tri_iso', 'tri_rect', 'tri_rect_iso', 'tri_quel'], more: ['tri_equi', 'tri_iso', 'tri_rect', 'tri_rect_iso', 'tri_quel'] },
        quad: { must: ['carre', 'rectangle', 'losange', 'parallelogramme', 'quad'], more: ['carre', 'rectangle', 'losange', 'parallelogramme', 'quad'] }
    };
    function genSortFigs(tree) {
        const T = TREE_KINDS[tree], kinds = T.must.slice();
        const more = shuffle(T.more);
        while (kinds.length < 8) kinds.push(more[(kinds.length) % more.length]);
        return shuffle(kinds).map(k => makeFig(k));
    }

    // =====================================================================
    // SONS / VOIX
    // =====================================================================
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function speak(text) {
        if (!canSpeak) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text.replace(/-/g, ' '));
            u.lang = 'fr-FR'; u.rate = 0.85;
            const v = window.speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang));
            if (v) u.voice = v;
            window.speechSynthesis.speak(u);
        } catch (e) {}
    }
    let _ctx = null;
    function tone(f, st, d, type, vol) {
        try {
            if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
            const t0 = _ctx.currentTime + st, o = _ctx.createOscillator(), g = _ctx.createGain();
            o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t0);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
            o.connect(g); g.connect(_ctx.destination); o.start(t0); o.stop(t0 + d + 0.05);
        } catch (e) {}
    }
    const SFX = {
        good: () => { tone(1046, 0, 0.12); tone(1568, 0.09, 0.22); },
        meh:  () => { tone(660, 0, 0.12); tone(784, 0.1, 0.18); },
        pop:  () => tone(880, 0, 0.06, 'sine', 0.05),
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };


    // =====================================================================
    // LEÇONS, EXERCICES, NIVEAUX
    // =====================================================================
    const LESSONS = [
        { id: 'polygones', label: '🔷 Les polygones',        color: '#059669' },
        { id: 'codage',    label: '📐 Le codage',            color: '#0891b2' },
        { id: 'triangles', label: '🔺 Les triangles',        color: '#e07b2a' },
        { id: 'quadri',    label: '🟦 Les quadrilatères',    color: '#1f6fd1' },
        { id: 'familles',  label: '👨‍👩‍👧 Les familles',        color: '#7c3aed' },
        { id: 'arbre',     label: '🌳 Trier avec un arbre',  color: '#D63384' }
    ];
    const EXT = {
        nom:      { label: '🏷️ Nommer',            color: '#059669' },
        chercher: { label: '🔎 Chercher',           color: '#1f6fd1' },
        compter:  { label: '🔢 Compter',            color: '#e07b2a' },
        vraifaux: { label: '✔ Vrai ou faux ?',      color: '#D63384' }
    };
    const LEVELS = {
        1: { label: '😊 Polygones',        color: '#2FBF71', hint: 'triangle, quadrilatère, carré, rectangle, pentagone…' },
        2: { label: '😐 Triangles et losange', color: '#F2994A', hint: 'triangles particuliers, losange, angles droits' },
        3: { label: '😤 Familles',         color: '#EB5757', hint: 'le carré est un rectangle et un losange, parallélogramme' }
    };

    // ── Exercices : figures et questions (fonctions pures, testables) ──
    const NOM_KINDS = {
        1: ['carre', 'rectangle', 'quad', 'tri_equi', 'tri_iso', 'tri_rect', 'tri_quel', 'penta', 'hexa', 'octo'],
        2: ['carre', 'rectangle', 'losange', 'quad', 'tri_equi', 'tri_iso', 'tri_rect', 'tri_quel'],
        3: ['carre', 'rectangle', 'losange', 'parallelogramme', 'quad', 'tri_equi', 'tri_iso', 'tri_rect', 'tri_rect_iso', 'tri_quel']
    };
    const nameFor = (k, lvl) => lvl === 1 ? shortName(k) : K[k].name;
    function nameOptions(k, lvl) {
        let pool;
        if (lvl === 1) pool = ['triangle', 'quadrilatère', 'carré', 'rectangle', 'pentagone', 'hexagone', 'octogone'];
        else if (K[k].n === 3) pool = NOM_KINDS[lvl].filter(x => K[x].n === 3).map(x => K[x].name);
        else pool = NOM_KINDS[lvl].filter(x => K[x].n === 4).map(x => K[x].name);
        const good = nameFor(k, lvl);
        // Au niveau 1, pour un carré on évite « rectangle » et « quadrilatère » (vrais aussi) : on garde des intrus nets
        const avoid = lvl === 1 && k === 'carre' ? ['rectangle', 'quadrilatère'] : lvl === 1 && k === 'rectangle' ? ['quadrilatère'] : [];
        const others = shuffle(pool.filter(x => x !== good && avoid.indexOf(x) === -1)).slice(0, 3);
        return shuffle([good].concat(others));
    }
    const CATS = {
        triangle:        { lbl: 'triangles',              f: k => K[k].n === 3 },
        quadri:          { lbl: 'quadrilatères',          f: k => K[k].n === 4 },
        polygone:        { lbl: 'polygones',              f: k => K[k].n > 0 },
        carre:           { lbl: 'carrés',                 f: k => k === 'carre' },
        rectangle:       { lbl: 'rectangles',             f: k => K[k].n === 4 && K[k].right === 4 },
        losange:         { lbl: 'losanges',               f: k => K[k].n === 4 && !!K[k].eq4 },
        parallelogramme: { lbl: 'parallélogrammes',       f: k => K[k].n === 4 && !!K[k].par },
        tri_rect:        { lbl: 'triangles rectangles',   f: k => K[k].n === 3 && K[k].right === 1 },
        tri_iso:         { lbl: 'triangles isocèles',     f: k => K[k].n === 3 && !!K[k].eq2 },
        tri_equi:        { lbl: 'triangles équilatéraux', f: k => k === 'tri_equi' }
    };
    const CH_CATS = { 1: ['triangle', 'quadri', 'polygone', 'carre'], 2: ['rectangle', 'losange', 'tri_rect', 'tri_iso', 'tri_equi'], 3: ['rectangle', 'losange', 'parallelogramme', 'tri_iso', 'tri_rect'] };
    const CH_POOL = {
        1: ['carre', 'rectangle', 'quad', 'tri_equi', 'tri_iso', 'tri_rect', 'tri_quel', 'penta', 'hexa', 'octo', 'cercle', 'ouverte', 'courbe'],
        2: ['carre', 'rectangle', 'losange', 'quad', 'tri_equi', 'tri_iso', 'tri_rect', 'tri_quel', 'penta', 'hexa'],
        3: Object.keys(K).filter(k => K[k].n === 3 || K[k].n === 4)
    };
    // Niveau 2 : on écarte les cas « pièges » (un carré quand on cherche les rectangles…)
    const CH_EXCL = { rectangle: ['carre'], losange: ['carre'], tri_iso: ['tri_equi', 'tri_rect_iso'], tri_rect: ['tri_rect_iso'] };
    // Niveau 3 : on met au moins un piège
    const CH_TRAP = { rectangle: 'carre', losange: 'carre', parallelogramme: pick.bind(null, ['carre', 'rectangle', 'losange']), tri_iso: 'tri_equi', tri_rect: 'tri_rect_iso' };
    function genChercher(lvl) {
        const cat = pick(CH_CATS[lvl]), C = CATS[cat], N = lvl === 1 ? 6 : 8;
        let pool = CH_POOL[lvl].slice();
        if (lvl === 2 && CH_EXCL[cat]) pool = pool.filter(k => CH_EXCL[cat].indexOf(k) === -1);
        const yes = pool.filter(C.f), no = pool.filter(k => !C.f(k));
        const nYes = 2 + Math.floor(Math.random() * 2);
        const kinds = [];
        if (lvl === 3 && CH_TRAP[cat]) kinds.push(typeof CH_TRAP[cat] === 'function' ? CH_TRAP[cat]() : CH_TRAP[cat]);
        while (kinds.length < nYes) kinds.push(pick(yes));
        while (kinds.length < N) kinds.push(pick(no));
        return { cat, figs: shuffle(kinds).map(k => makeFig(k)) };
    }
    const COMPTE = {
        cotes:   { q: 'Combien cette figure a-t-elle de côtés ?',        f: k => K[k].n },
        sommets: { q: 'Combien cette figure a-t-elle de sommets ?',      f: k => K[k].n },
        droits:  { q: 'Combien cette figure a-t-elle d\'angles droits ?', f: k => K[k].right },
        diag:    { q: 'Combien cette figure a-t-elle de diagonales ?',   f: k => K[k].n * (K[k].n - 3) / 2 }
    };
    function genCompter(lvl) {
        let what, kinds;
        if (lvl === 1) { what = pick(['cotes', 'sommets']); kinds = ['tri_quel', 'tri_iso', 'carre', 'rectangle', 'quad', 'penta', 'hexa', 'octo']; }
        else if (lvl === 2) { what = pick(['droits', 'droits', 'cotes']); kinds = ['carre', 'rectangle', 'losange', 'quad', 'tri_rect', 'tri_iso', 'tri_equi', 'hexa']; }
        else { what = pick(['diag', 'droits']); kinds = what === 'diag' ? ['carre', 'rectangle', 'losange', 'parallelogramme', 'quad', 'penta', 'hexa'] : ['carre', 'rectangle', 'losange', 'parallelogramme', 'tri_rect', 'tri_rect_iso', 'tri_iso']; }
        const k = pick(kinds);
        return { what, fig: makeFig(k), ans: COMPTE[what].f(k) };
    }
    const VF = {
        1: [
            ['Un triangle a 3 côtés.', 'V', 'Un triangle a 3 côtés, 3 sommets et 3 angles.'],
            ['Un cercle est un polygone.', 'F', 'Le cercle n\'a pas de côtés droits : ce n\'est pas un polygone.'],
            ['Un carré a 4 côtés égaux.', 'V', 'Ses 4 côtés ont la même longueur.'],
            ['Un rectangle a toujours 4 côtés égaux.', 'F', 'Un rectangle a ses côtés opposés égaux deux à deux.'],
            ['Un rectangle a 4 angles droits.', 'V', 'Ses 4 angles sont droits.'],
            ['Un hexagone a 5 côtés.', 'F', 'Un hexagone a 6 côtés ; c\'est le pentagone qui en a 5.'],
            ['Un pentagone a 5 sommets.', 'V', 'Un polygone a autant de sommets que de côtés.'],
            ['Une ligne brisée ouverte est un polygone.', 'F', 'Un polygone est une figure fermée.'],
            ['Un quadrilatère a 4 côtés.', 'V', '« quadri » veut dire quatre.'],
            ['Un octogone a 8 côtés.', 'V', '« octo » veut dire huit, comme les 8 bras de la pieuvre (octopus).']
        ],
        2: [
            ['Un losange a 4 côtés égaux.', 'V', 'C\'est ce qui définit le losange.'],
            ['Un losange a toujours 4 angles droits.', 'F', 'Seul le losange qui est un carré a des angles droits.'],
            ['Un triangle isocèle a 2 côtés égaux.', 'V', '« iso » veut dire égal.'],
            ['Un triangle équilatéral a 3 côtés égaux.', 'V', 'Ses 3 côtés ont la même longueur, et ses 3 angles sont égaux.'],
            ['Un triangle rectangle a 2 angles droits.', 'F', 'Un triangle ne peut avoir qu\'un seul angle droit.'],
            ['Les diagonales d\'un rectangle ont la même longueur.', 'V', 'C\'est une propriété du rectangle.'],
            ['Les diagonales d\'un losange se coupent en angle droit.', 'V', 'Elles sont perpendiculaires.'],
            ['Un triangle peut avoir 3 angles droits.', 'F', 'Un triangle a au plus un angle droit.'],
            ['Les côtés opposés d\'un rectangle sont parallèles.', 'V', 'Ils ne se croiseront jamais, même prolongés.'],
            ['Un carré a 4 angles droits.', 'V', 'Comme le rectangle.']
        ],
        3: [
            ['Un carré est un rectangle.', 'V', 'Il a 4 angles droits : c\'est un rectangle particulier.'],
            ['Un carré est un losange.', 'V', 'Il a 4 côtés égaux : c\'est un losange particulier.'],
            ['Un rectangle est toujours un carré.', 'F', 'Il faudrait en plus 4 côtés égaux.'],
            ['Un losange est un parallélogramme.', 'V', 'Ses côtés opposés sont parallèles.'],
            ['Un triangle équilatéral est aussi isocèle.', 'V', 'Il a 3 côtés égaux, donc il en a bien 2 égaux.'],
            ['Un triangle rectangle peut être isocèle.', 'V', 'C\'est le triangle rectangle isocèle : la moitié d\'un carré.'],
            ['Un losange qui a un angle droit est un carré.', 'V', 'Avec un angle droit, tous ses angles sont droits.'],
            ['Un rectangle qui a 4 côtés égaux est un carré.', 'V', '4 angles droits et 4 côtés égaux : c\'est un carré.'],
            ['Tous les quadrilatères ont des diagonales de même longueur.', 'F', 'C\'est vrai pour le rectangle et le carré, pas pour le losange.'],
            ['Un parallélogramme a toujours un angle droit.', 'F', 'Seuls le rectangle et le carré en ont.'],
            ['Un triangle équilatéral peut avoir un angle droit.', 'F', 'Ses 3 angles sont égaux : ils mesurent 60° chacun.']
        ]
    };
    function genQuestions(type, lvl, n) {
        const out = [];
        let vfPool = [];
        for (let i = 0; i < n; i++) {
            if (type === 'nom') { const k = pick(NOM_KINDS[lvl]); out.push({ fig: makeFig(k), ans: nameFor(k, lvl), opts: nameOptions(k, lvl) }); }
            else if (type === 'chercher') out.push(genChercher(lvl));
            else if (type === 'compter') out.push(genCompter(lvl));
            else { if (!vfPool.length) vfPool = shuffle(VF[lvl].map((x, j) => j)); out.push({ lvl, j: vfPool.pop() }); }
        }
        return out;
    }
    const membersOf = q => q.figs.map((f, i) => CATS[q.cat].f(f.kind) ? i : -1).filter(i => i !== -1);
    function isRightQ(type, q, a) {
        if (type === 'nom') return a === q.ans;
        if (type === 'compter') return String(a == null ? '' : a).trim() !== '' && +String(a).trim() === q.ans;
        if (type === 'vraifaux') return a === VF[q.lvl][q.j][1];
        const want = membersOf(q), got = Array.isArray(a) ? a.slice().sort((x, y) => x - y) : [];
        return got.length === want.length && got.every((x, i) => x === want[i]);
    }

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'polygones',
            sort: null,
            ex: { type: 'nom', level: 1, n: 8 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }
    function newSort(tree, codage) { return { tree, figs: genSortFigs(tree), placed: {}, cur: null, path: [], err: 0, fb: null, codage: codage !== false }; }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createFiguresPlanesWidget = function (saved) {
        const restored = !!saved;
        if (!restored && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = TYPE;
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
            <div class="widget-ctx-menu"></div>`;

        const container = document.createElement('div');
        container.className = 'fgp-container';
        container.innerHTML = `
            <div class="fgp-header">
                <span class="fgp-title">🔷 Les figures planes</span>
                <div class="fgp-tabs">
                    <button class="fgp-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="fgp-tab-lbl">Leçons</span></button>
                    <button class="fgp-tab" data-act="tab" data-tab="sort"><span>🌳</span><span class="fgp-tab-lbl">Trier</span></button>
                    <button class="fgp-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="fgp-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="fgp-icon-btn" data-act="sound" title="Son"></button>
                    <button class="fgp-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="fgp-body"></div>
            <div class="fgp-help">
                <h4>💡 Comment utiliser cette leçon ?</h4>
                <p><b>📖 Leçons</b> — Les polygones et leur vocabulaire (côté, sommet, angle, diagonale), le codage, les triangles, les quadrilatères, les familles (un carré est à la fois un rectangle et un losange), et comment lire un arbre de tri.</p>
                <p><b>🌳 Trier</b> — Choisis un arbre (polygones, triangles ou quadrilatères). Touche une figure, puis réponds aux questions de l'arbre : elle descend jusqu'à son nom. Les figures sont tournées au hasard : un carré posé sur la pointe reste un carré !</p>
                <p><b>Le codage</b> : les <span style="color:#D63384;font-weight:900">petits traits</span> montrent les côtés de même longueur (même nombre de traits = même longueur), le <span style="color:#0891b2;font-weight:900">petit carré</span> montre un angle droit.</p>
                <p><b>✏️ Exercices</b> — Nommer une figure, chercher toutes les figures d'une famille, compter (côtés, sommets, angles droits, diagonales), vrai ou faux. Puis <b>👁 Correction</b> avec le score.</p>
            </div>
            <div class="fgp-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.fgp-body');
        const help = container.querySelector('.fgp-help');
        const resizeHandle = container.querySelector('.fgp-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        if (!EXT[S.ex.type]) S.ex.type = 'nom';
        if (S.run && !EXT[S.run.type]) S.run = null;
        if (!S.sort || !TREES[S.sort.tree] || !Array.isArray(S.sort.figs)) S.sort = newSort('quad');
        let msg = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        const F = (k, rot, seed) => makeFig(k, seeded(seed || 7), rot || 0);
        const card = (f, title, items, cls, opts) => `<div class="fgp-card ${cls || ''}">${figHtml(f, '', opts)}<h5>${title}</h5>${items && items.length ? `<ul>${items.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}</div>`;
        function renderPolygones() {
            const pen = F('penta', 0);
            return `<div class="fgp-ltitle"><h2 style="color:#059669">🔷 Les polygones</h2></div>
                <div class="fgp-box fgp-what"><b class="t">🔤 Qu'est-ce qu'un polygone ?</b>Un <b>polygone</b> est une figure plane <b>fermée</b>, dont tous les côtés sont des <b>segments</b> (des lignes droites).</div>
                <div class="fgp-fig"><figure style="width:230px">${figHtml(pen, '', { labels: true, diag: true })}</figure>
                    <div class="fgp-box fgp-tool" style="flex:1;min-width:240px"><b class="t">🔎 Le vocabulaire</b><ul>
                        <li>Les <b>côtés</b> : les segments [AB], [BC], [CD], [DE], [EA].</li>
                        <li>Les <b>sommets</b> : les points A, B, C, D, E, là où deux côtés se rejoignent.</li>
                        <li>Les <b>angles</b> : un à chaque sommet.</li>
                        <li>Les <b>diagonales</b> (en pointillés) : elles relient deux sommets qui ne se suivent pas.</li></ul></div></div>
                <div class="fgp-box fgp-test"><b class="t">🔎 Le nom dépend du nombre de côtés</b></div>
                <div class="fgp-cards">
                    ${card(F('tri_quel', 0, 3), 'Triangle', ['3 côtés', '3 sommets'])}
                    ${card(F('quad', 0, 5), 'Quadrilatère', ['4 côtés', '4 sommets'])}
                    ${card(F('penta', 0), 'Pentagone', ['5 côtés', '5 sommets'])}
                    ${card(F('hexa', 0), 'Hexagone', ['6 côtés', '6 sommets'])}
                    ${card(F('octo', 0), 'Octogone', ['8 côtés', '8 sommets'])}
                </div>
                <div class="fgp-box fgp-trap"><b class="t">⚠️ Ce ne sont pas des polygones</b></div>
                <div class="fgp-cards">
                    ${card(F('cercle'), 'Le cercle', ['pas de côtés droits'], 'no')}
                    ${card(F('ouverte', 0), 'Une ligne ouverte', ['la figure n\'est pas fermée'], 'no')}
                    ${card(F('courbe', 0), 'Un côté courbe', ['un des côtés n\'est pas droit'], 'no')}
                </div>
                <div class="fgp-box fgp-memo"><b class="t">🧠 Pour retenir</b>Un polygone a <b>autant de sommets que de côtés</b>. Les noms viennent du grec et du latin : <i>tri</i> = 3, <i>quadri</i> = 4, <i>penta</i> = 5, <i>hexa</i> = 6, <i>octo</i> = 8.</div>
                <div><button class="fgp-btn go" data-act="practice" data-v="nom" data-l="1">✏️ S'entraîner : nommer</button> <button class="fgp-btn alt" data-act="sort-go" data-v="poly">🌳 Trier des polygones</button></div>`;
        }
        function renderCodage() {
            const par = `<svg class="fgp-shape" viewBox="0 0 100 60"><line x1="8" y1="18" x2="92" y2="10" stroke="#2A1F4A" stroke-width="2.6"/><line x1="8" y1="46" x2="92" y2="38" stroke="#2A1F4A" stroke-width="2.6"/></svg>`;
            const perp = `<svg class="fgp-shape" viewBox="0 0 100 60"><line x1="10" y1="48" x2="90" y2="48" stroke="#2A1F4A" stroke-width="2.6"/><line x1="40" y1="6" x2="40" y2="56" stroke="#2A1F4A" stroke-width="2.6"/><polyline points="40,40 48,40 48,48" fill="none" stroke="#0891b2" stroke-width="2"/></svg>`;
            return `<div class="fgp-ltitle"><h2 style="color:#0891b2">📐 Le codage d'une figure</h2></div>
                <div class="fgp-box fgp-what"><b class="t">🔤 Des signes sur la figure</b>On ne se fie pas à ses yeux : on <b>code</b> la figure pour donner ses propriétés.<ul>
                    <li><span style="color:#D63384;font-weight:900">Les petits traits</span> : les côtés qui ont le <b>même nombre de traits</b> ont la <b>même longueur</b>.</li>
                    <li><span style="color:#0891b2;font-weight:900">Le petit carré</span> : l'angle est un <b>angle droit</b>.</li></ul></div>
                <div class="fgp-cards">
                    ${card(F('rectangle', 0, 11), 'Un rectangle codé', ['1 trait : les 2 grands côtés sont égaux', '2 traits : les 2 petits côtés sont égaux', '4 petits carrés : 4 angles droits'])}
                    ${card(F('tri_iso', 0, 4), 'Un triangle codé', ['1 trait sur 2 côtés : ils sont égaux', 'pas de petit carré : pas d\'angle droit'])}
                    ${card(F('carre', 30), 'Un carré « sur la pointe »', ['4 côtés égaux, 4 angles droits', 'il est tourné, mais c\'est toujours un carré !'])}
                </div>
                <div class="fgp-box fgp-test"><b class="t">🔎 Vérifier avec les instruments</b>Pour les <b>longueurs</b> : la règle graduée ou le compas. Pour les <b>angles droits</b> : l'équerre.</div>
                <div class="fgp-box fgp-tool"><b class="t">🔤 Deux mots à connaître</b>
                    <div class="fgp-fig" style="margin-top:6px"><figure style="width:200px">${par}<figcaption>Droites <b>parallèles</b> : elles ne se coupent jamais.</figcaption></figure>
                    <figure style="width:200px">${perp}<figcaption>Droites <b>perpendiculaires</b> : elles se coupent en formant un angle droit.</figcaption></figure></div></div>
                <div class="fgp-box fgp-trap"><b class="t">⚠️ Attention</b>Une figure peut avoir <b>l'air</b> d'un carré sans en être un. Sans codage, on vérifie toujours avec les instruments.</div>
                <div><button class="fgp-btn go" data-act="practice" data-v="compter" data-l="2">✏️ S'entraîner : compter les angles droits</button></div>`;
        }
        function renderTriangles() {
            return `<div class="fgp-ltitle"><h2 style="color:#e07b2a">🔺 Les triangles</h2></div>
                <div class="fgp-box fgp-what"><b class="t">🔤 Le triangle</b>Un triangle est un polygone à <b>3 côtés</b>, <b>3 sommets</b> et <b>3 angles</b>. Certains triangles ont un nom particulier.</div>
                <div class="fgp-cards">
                    ${card(F('tri_iso', 0, 4), 'Triangle isocèle', ['<b>2 côtés égaux</b>', 'les 2 angles à la base sont égaux'])}
                    ${card(F('tri_equi', 0), 'Triangle équilatéral', ['<b>3 côtés égaux</b>', '3 angles égaux'])}
                    ${card(F('tri_rect', 0, 9), 'Triangle rectangle', ['<b>1 angle droit</b>'])}
                    ${card(F('tri_rect_iso', 0), 'Triangle rectangle isocèle', ['1 angle droit', 'et 2 côtés égaux', 'c\'est la moitié d\'un carré'])}
                    ${card(F('tri_quel', 0, 3), 'Triangle quelconque', ['aucune propriété particulière'])}
                </div>
                <div class="fgp-box fgp-memo"><b class="t">🧠 Pour retenir</b><i>iso</i> veut dire « égal » (2 côtés égaux) ; <i>équi</i> aussi (tous les côtés égaux) ; <i>rectangle</i>, c'est « avec un angle droit ».</div>
                <div class="fgp-box fgp-trap"><b class="t">⚠️ Attention</b>Un triangle ne peut avoir <b>qu'un seul angle droit</b>. Et un triangle équilatéral a aussi 2 côtés égaux : c'est un triangle isocèle particulier.</div>
                <div><button class="fgp-btn go" data-act="sort-go" data-v="tri">🌳 Trier des triangles</button> <button class="fgp-btn alt" data-act="practice" data-v="chercher" data-l="2">✏️ S'entraîner : chercher</button></div>`;
        }
        function renderQuadri() {
            const rows = [
                ['4 côtés égaux', 1, 0, 1, 0],
                ['Côtés opposés égaux', 1, 1, 1, 1],
                ['Côtés opposés parallèles', 1, 1, 1, 1],
                ['4 angles droits', 1, 1, 0, 0],
                ['Diagonales de même longueur', 1, 1, 0, 0],
                ['Diagonales perpendiculaires', 1, 0, 1, 0],
                ['Diagonales qui se coupent en leur milieu', 1, 1, 1, 1]
            ];
            const yn = v => v ? '<td class="y">✔</td>' : '<td class="n">✘</td>';
            return `<div class="fgp-ltitle"><h2 style="color:#1f6fd1">🟦 Les quadrilatères</h2></div>
                <div class="fgp-box fgp-what"><b class="t">🔤 Le quadrilatère</b>Un quadrilatère est un polygone à <b>4 côtés</b>. Il a <b>2 diagonales</b> (en pointillés). Certains ont un nom particulier.</div>
                <div class="fgp-cards">
                    ${card(F('carre', 0), 'Carré', ['4 côtés égaux', '4 angles droits'], '', { diag: true })}
                    ${card(F('rectangle', 0, 11), 'Rectangle', ['côtés opposés égaux', '4 angles droits'], '', { diag: true })}
                    ${card(F('losange', 0, 6), 'Losange', ['4 côtés égaux', 'pas forcément d\'angle droit'], '', { diag: true })}
                    ${card(F('parallelogramme', 0, 8), 'Parallélogramme', ['côtés opposés parallèles', 'et égaux'], '', { diag: true })}
                    ${card(F('quad', 0, 5), 'Quadrilatère quelconque', ['aucune propriété particulière'], '', { diag: true })}
                </div>
                <table class="fgp-ptab"><tr><th></th><th>Carré</th><th>Rectangle</th><th>Losange</th><th>Parallélogramme</th></tr>
                    ${rows.map(r => `<tr><td>${r[0]}</td>${yn(r[1])}${yn(r[2])}${yn(r[3])}${yn(r[4])}</tr>`).join('')}</table>
                <div class="fgp-box fgp-memo"><b class="t">🧠 Pour retenir</b>Rectangle → <b>4 angles droits</b>. Losange → <b>4 côtés égaux</b>. Carré → <b>les deux à la fois</b>.</div>
                <div><button class="fgp-btn go" data-act="sort-go" data-v="quad">🌳 Trier des quadrilatères</button> <button class="fgp-btn alt" data-act="practice" data-v="nom" data-l="2">✏️ S'entraîner : nommer</button></div>`;
        }
        function vennSvg() {
            const sub = (k, x, y, w, rot, seed) => figSvg(F(k, rot, seed)).replace('<svg class="fgp-shape"', `<svg x="${x}" y="${y}" width="${w}" height="${w}"`);
            return `<svg class="fgp-shape" viewBox="0 0 640 330" style="max-width:640px;margin:0 auto">
                <ellipse cx="320" cy="170" rx="305" ry="150" fill="#fff6d6" stroke="#e0b100" stroke-width="3"/>
                <text x="320" y="303" text-anchor="middle" font-size="17" font-weight="900" fill="#9a7400" font-family="Nunito,sans-serif">Parallélogrammes</text>
                <ellipse cx="248" cy="185" rx="150" ry="105" fill="#d9ecff" fill-opacity=".75" stroke="#1f6fd1" stroke-width="3"/>
                <ellipse cx="392" cy="185" rx="150" ry="105" fill="#f1edff" fill-opacity=".75" stroke="#7c3aed" stroke-width="3"/>
                <text x="170" y="150" text-anchor="middle" font-size="18" font-weight="900" fill="#1f6fd1" font-family="Nunito,sans-serif">Rectangles</text>
                <text x="470" y="150" text-anchor="middle" font-size="18" font-weight="900" fill="#7c3aed" font-family="Nunito,sans-serif">Losanges</text>
                <text x="320" y="128" text-anchor="middle" font-size="17" font-weight="900" fill="#2A1F4A" font-family="Nunito,sans-serif">Carrés</text>
                ${sub('rectangle', 120, 140, 90, 0, 11)}${sub('losange', 440, 140, 90, 0, 6)}${sub('carre', 280, 140, 80, 0)}
                ${sub('parallelogramme', 27, 157, 56, 0, 8)}${sub('parallelogramme', 557, 157, 56, 180, 8)}
            </svg>`;
        }
        function renderFamilles() {
            return `<div class="fgp-ltitle"><h2 style="color:#7c3aed">👨‍👩‍👧 Les familles de quadrilatères</h2></div>
                <div class="fgp-box fgp-what"><b class="t">🔤 Une figure peut avoir plusieurs noms</b>Comme un chat est aussi un animal, un <b>carré</b> est aussi un <b>rectangle</b> (il a 4 angles droits) et aussi un <b>losange</b> (il a 4 côtés égaux).</div>
                ${vennSvg()}
                <div class="fgp-steps">
                    <div class="fgp-step"><span class="n">1</span><span>Le <b>carré</b> est à la fois un <b>rectangle</b> et un <b>losange</b> : il est dans les deux familles.</span></div>
                    <div class="fgp-step"><span class="n">2</span><span>Les rectangles et les losanges sont des <b>parallélogrammes</b> : leurs côtés opposés sont parallèles.</span></div>
                    <div class="fgp-step"><span class="n">3</span><span>Pour nommer une figure, on choisit le <b>nom le plus précis</b> : un carré, on l'appelle « carré ».</span></div>
                </div>
                <div class="fgp-box fgp-trap"><b class="t">⚠️ Attention</b>Ça ne marche pas dans l'autre sens : un rectangle n'est <b>pas toujours</b> un carré, et un losange n'est <b>pas toujours</b> un carré.</div>
                <div class="fgp-box fgp-memo"><b class="t">🧠 Pour retenir</b>Même chose pour les triangles : un triangle <b>équilatéral</b> est aussi <b>isocèle</b>, et un triangle peut être à la fois <b>rectangle et isocèle</b>.</div>
                <div><button class="fgp-btn go" data-act="practice" data-v="vraifaux" data-l="3">✏️ S'entraîner : vrai ou faux ?</button> <button class="fgp-btn alt" data-act="practice" data-v="chercher" data-l="3">✏️ Chercher les pièges</button></div>`;
        }
        function renderArbreLecon() {
            const ex = F('rectangle', 0, 11), P = expectedPath('quad', 'rectangle');
            const on = new Set(P.steps.map(s => s.node.id).concat([P.leaf.id]));
            return `<div class="fgp-ltitle"><h2 style="color:#D63384">🌳 Trier avec un arbre</h2></div>
                <div class="fgp-box fgp-what"><b class="t">🔤 Un arbre de tri</b>On part du haut et on répond à chaque question par <b>oui</b> ou par <b>non</b>. On suit la branche de la réponse, jusqu'à arriver au <b>nom</b> de la figure, tout en bas.</div>
                <div class="fgp-fig"><figure style="width:130px">${figHtml(ex)}<figcaption>Quelle est cette figure ?</figcaption></figure></div>
                ${treeHtml('quad', { on, hit: P.leaf.id })}
                <div class="fgp-steps">
                    ${P.steps.map((s, i) => `<div class="fgp-step"><span class="n">${i + 1}</span><span>${esc(s.node.q)} → <b>${esc(s.label)}</b></span></div>`).join('')}
                    <div class="fgp-step"><span class="n">✔</span><span>C'est un <b>${esc(P.leaf.leaf.toLowerCase())}</b>.</span></div>
                </div>
                <div class="fgp-box fgp-memo"><b class="t">🧠 Pour retenir</b>Je lis le <b>codage</b> pour répondre : les petits carrés pour les angles droits, les petits traits pour les côtés égaux.</div>
                <div><button class="fgp-btn go" data-act="tab" data-tab="sort">🌳 À moi de trier !</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="fgp-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { polygones: renderPolygones, codage: renderCodage, triangles: renderTriangles, quadri: renderQuadri, familles: renderFamilles, arbre: renderArbreLecon }[S.lesson] || renderPolygones;
            return `<div class="fgp-lesson"><div class="fgp-side">${side}</div><div class="fgp-main">${main()}</div></div>`;
        }

        // =================================================================
        // RENDU : L'ARBRE DE TRI
        //   o.on : nœuds du chemin suivi ; o.cur : question en cours ;
        //   o.hit : feuille atteinte ; o.bins : { idFeuille: [figures] }
        // =================================================================
        function treeHtml(tree, o) {
            o = o || {};
            const on = o.on || new Set();
            function node(n) {
                let cls = n.leaf ? 'leaf' : 'q';
                if (on.has(n.id)) cls += ' path';
                if (o.cur === n.id) cls += ' cur';
                if (o.hit === n.id) cls += ' hit';
                const bin = n.leaf && o.bins && o.bins[n.id] ? `<div class="fgp-bin">${o.bins[n.id].map(f => figHtml(f, '', { codage: o.codage })).join('')}</div>` : '';
                const kids = n.kids ? `<div class="fgp-kids">${n.kids.map(([lab, ch]) => `<div class="fgp-kid"><span class="fgp-edge ${on.has(ch.id) ? 'path' : ''}">${esc(lab)}</span>${node(ch)}</div>`).join('')}</div>` : '';
                return `<div class="fgp-tn"><div class="fgp-node ${cls}">${esc(n.leaf || n.q)}${bin}</div>${kids}</div>`;
            }
            return `<div class="fgp-tree">${node(TREES[tree].root)}</div>`;
        }
        function renderSort() {
            const T = S.sort, figs = T.figs;
            const placedN = Object.keys(T.placed).length, done = placedN === figs.length;
            const bins = {};
            Object.keys(T.placed).forEach(i => { (bins[T.placed[i]] = bins[T.placed[i]] || []).push(figs[i]); });
            const on = new Set(T.path);
            const curId = T.cur !== null && T.path.length ? T.path[T.path.length - 1] : null;
            let left = `<div class="fgp-settings">
                <div class="fgp-srow">${Object.keys(TREES).map(t => `<button class="fgp-chip ${T.tree === t ? 'on' : ''}" style="--c:#D63384" data-act="sort-tree" data-v="${t}">${TREES[t].label}</button>`).join('')}</div>
                <div class="fgp-srow"><button class="fgp-chip ${T.codage ? 'on' : ''}" style="--c:#0891b2" data-act="sort-codage">📐 Codage ${T.codage ? 'affiché' : 'caché'}</button>
                <button class="fgp-btn alt small" data-act="sort-new">🔄 Nouvelles figures</button></div></div>`;
            left += `<div class="fgp-tray">${figs.map((f, i) => `<button class="fgp-fb ${T.placed[i] !== undefined ? 'empty' : ''} ${T.cur === i ? 'on' : ''}" data-act="sort-pick" data-v="${i}" title="Trier cette figure"${T.placed[i] !== undefined ? ' disabled' : ''}>${figSvg(f, { codage: T.codage })}</button>`).join('')}</div>`;
            if (T.cur !== null) {
                const n = nodeById(T.tree, curId);
                left += `<div class="fgp-quest"><div class="big">${figSvg(figs[T.cur], { codage: T.codage })}</div>
                    <div class="q">${esc(n.q)}</div>
                    <div class="fgp-ansbar">${n.kids.map(([lab]) => `<button class="fgp-ansbtn" data-act="sort-ans" data-v="${esc(lab)}">${esc(lab)}</button>`).join('')}</div></div>`;
            } else if (done) {
                left += `<div class="fgp-quest"><div class="q">🎉 Toutes les figures sont triées !</div><div>${T.err ? `${T.err} erreur${T.err > 1 ? 's' : ''} en chemin.` : 'Sans aucune erreur, bravo !'}</div>
                    <button class="fgp-btn go" data-act="sort-new">🔄 Nouvelles figures</button></div>`;
            } else left += `<div class="fgp-quest"><div class="q">👆 Touche une figure</div><div>Elle va descendre dans l'arbre : réponds aux questions pour trouver son nom.</div></div>`;
            if (T.fb) left += `<div class="fgp-fb2 ${T.fb.ok ? 'good' : 'bad'}">${T.fb.html}</div>`;
            if (!T.codage) left += `<div class="fgp-hint">Sans le codage, observe bien… ou vérifie avec la règle et l'équerre !</div>`;
            const right = `<div class="fgp-panel">${treeHtml(T.tree, { on, cur: curId, bins, codage: T.codage, hit: T.lastLeaf })}</div>`;
            return `<div class="fgp-sort"><div class="fgp-left">${left}</div><div class="fgp-right">${right}</div></div>`;
        }
        function sortAnswer(lab) {
            const T = S.sort;
            if (T.cur === null) return;
            const f = T.figs[T.cur], n = nodeById(T.tree, T.path[T.path.length - 1]);
            const good = n.f(f.kind);
            if (lab !== good) {
                T.err++;
                T.fb = { ok: false, html: `✘ Pas tout à fait. 💡 ${esc(n.hint)}` };
                sfx('meh');
                return;
            }
            const child = n.kids.find(k => k[0] === lab)[1];
            T.path.push(child.id);
            if (child.leaf) {
                const P = expectedPath(T.tree, f.kind);
                T.placed[T.cur] = child.id;
                T.lastLeaf = child.id;
                T.fb = { ok: true, html: `✔ C'est un <b>${esc(child.leaf.toLowerCase())}</b>${P.steps.length ? ' : ' + P.steps.map(s => esc(s.node.q.replace(/ \?$/, '')) + ' → ' + esc(s.label)).join(' · ') : ''}.` };
                if (child.leaf === 'Pas un polygone') T.fb.html = `✔ Ce n'est <b>pas un polygone</b> : ${esc(K[f.kind].name)}.`;
                T.cur = null; T.path = [];
                if (Object.keys(T.placed).length === T.figs.length) { sfx('win'); party(); } else sfx('good');
            } else { T.fb = null; sfx('pop'); }
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function genRun() {
            const ex = S.ex;
            S.run = { type: ex.type, qs: genQuestions(ex.type, ex.level, ex.n), ans: [], corrected: false };
            return '';
        }
        const isRight = (R, i) => isRightQ(R.type, R.qs[i], R.ans[i]);
        const scoreOf = R => ({ ok: R.qs.filter((q, i) => isRight(R, i)).length, n: R.qs.length });

        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="fgp-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="fgp-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="fgp-settings">`;
            h += `<div class="fgp-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            h += `<div class="fgp-srow"><span class="l">2. Niveau</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}<span class="fgp-hint">${LEVELS[ex.level].hint}</span></div>`;
            h += `<div class="fgp-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="fgp-srow"><span class="l">Taille du texte</span><button class="fgp-btn alt small" data-act="font" data-d="-2">A−</button><button class="fgp-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="fgp-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="fgp-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="fgp-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function qcard(R, i, inner, title) {
            let cls = '', mk = '';
            if (R.corrected) { const ok = isRight(R, i); cls = ok ? 'ok' : 'ko'; mk = ok ? '✅' : '❌'; }
            return `<div class="fgp-q ${cls}"><div class="fgp-qtop"><span class="fgp-n">${i + 1})</span>${title}<span style="margin-left:auto">${mk}</span></div>${inner}</div>`;
        }
        const why = (R, i, html) => R.corrected && !isRight(R, i) ? `<div class="fgp-why">${html}</div>` : '';
        function optBtns(R, i, opts, good, act) {
            const a = R.ans[i];
            return `<div class="fgp-opts">${opts.map(o => {
                let c = a === o ? 'on' : '';
                if (R.corrected) c = o === good ? 'good' : (a === o ? 'bad' : '');
                return `<button class="fgp-opt ${c}"${R.corrected ? '' : ` data-act="${act || 'pick'}" data-i="${i}" data-v="${esc(o)}"`}>${esc(o)}</button>`;
            }).join('')}</div>`;
        }
        function renderQuestions(R) {
            const T = R.type;
            if (T === 'nom') return `<div class="fgp-grid">` + R.qs.map((q, i) => {
                const h = `<div class="fgp-qfig">${figSvg(q.fig)}</div>${optBtns(R, i, q.opts, q.ans)}` + why(R, i, `C'est un <b>${esc(q.ans)}</b>.`);
                return qcard(R, i, h, 'Quel est le nom le plus précis de cette figure ?');
            }).join('') + `</div>`;
            if (T === 'compter') return `<div class="fgp-grid">` + R.qs.map((q, i) => {
                const a = R.ans[i] || '';
                const mk = R.corrected ? (isRight(R, i) ? ' ok' : ' ko') : '';
                const h = `<div class="fgp-qfig">${figSvg(q.fig)}</div><input class="fgp-ans${mk}" data-in="ans" data-i="${i}" value="${esc(a)}" inputmode="numeric" autocomplete="off"${R.corrected ? ' disabled' : ''} placeholder="…" style="max-width:120px">`
                    + why(R, i, `Réponse : <b>${q.ans}</b>${q.what === 'droits' ? ' (compte les petits carrés bleus)' : q.what === 'diag' ? ' (une diagonale relie deux sommets qui ne se suivent pas)' : ''}.`);
                return qcard(R, i, h, esc(COMPTE[q.what].q));
            }).join('') + `</div>`;
            if (T === 'vraifaux') return `<div class="fgp-grid">` + R.qs.map((q, i) => {
                const s = VF[q.lvl][q.j], a = R.ans[i];
                const btn = (v, lbl) => {
                    let c = a === v ? 'on' : '';
                    if (R.corrected) c = v === s[1] ? 'good' : (a === v ? 'bad' : '');
                    return `<button class="fgp-opt ${c}"${R.corrected ? '' : ` data-act="pick" data-i="${i}" data-v="${v}"`}>${lbl}</button>`;
                };
                const h = `<div class="fgp-stmt">${esc(s[0])}</div><div class="fgp-opts">${btn('V', '✔ Vrai')}${btn('F', '✘ Faux')}</div>` + (R.corrected ? `<div class="fgp-why">${s[1] === 'V' ? 'Vrai' : 'Faux'} : ${esc(s[2])}</div>` : '');
                return qcard(R, i, h, 'Vrai ou faux ?');
            }).join('') + `</div>`;
            // Chercher
            return `<div class="fgp-grid one">` + R.qs.map((q, i) => {
                const a = Array.isArray(R.ans[i]) ? R.ans[i] : [], want = membersOf(q);
                const h = `<div class="fgp-fgrid">${q.figs.map((f, j) => {
                    const sel = a.indexOf(j) !== -1, isM = want.indexOf(j) !== -1;
                    let c = sel ? 'on' : '';
                    if (R.corrected) c = sel ? (isM ? 'ok' : 'ko') : (isM ? 'miss' : '');
                    return `<button class="fgp-fb ${c}"${R.corrected ? ' disabled' : ` data-act="tick" data-i="${i}" data-v="${j}"`}>${figSvg(f)}</button>`;
                }).join('')}</div>` + why(R, i, `Il y avait <b>${want.length}</b> ${esc(CATS[q.cat].lbl)} (encadrés en vert).${q.figs.some((f, j) => want.indexOf(j) !== -1 && ((q.cat === 'rectangle' || q.cat === 'losange' || q.cat === 'parallelogramme') && f.kind === 'carre')) ? ' N\'oublie pas : le carré en fait partie !' : ''}`);
                return qcard(R, i, h, `Touche tous les <b>${esc(CATS[q.cat].lbl)}</b>`);
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="fgp-topbar"><span class="fgp-pill">${EXT[R.type].label} · ${R.qs.length} questions</span>
                ${sc ? `<span class="fgp-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="fgp-actions">
                <button class="fgp-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="fgp-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="fgp-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="fgp-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="fgp-info">Choisis l'exercice et le niveau, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.fgp-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : S.tab === 'sort' ? renderSort() : renderLesson();
            body.scrollTop = top;
            // Arbre plus large que l'écran : on le fait défiler jusqu'à la question en cours (ou la dernière feuille atteinte)
            const right = body.querySelector('.fgp-right'), target = right && (right.querySelector('.fgp-node.cur') || right.querySelector('.fgp-node.hit'));
            if (right && right.scrollWidth > right.clientWidth) {
                const t = target || right.querySelector('.fgp-node');
                const r1 = right.getBoundingClientRect(), r2 = t.getBoundingClientRect();
                right.scrollLeft += (r2.left + r2.width / 2) - (r1.left + r1.width / 2);
            }
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'fgp-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run, ex = S.ex, T = S.sort;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🔷 Les figures planes', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'practice':
                    ex.type = el.dataset.v; if (el.dataset.l) ex.level = +el.dataset.l;
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                // Arbre de tri
                case 'sort-go': S.sort = newSort(el.dataset.v, T.codage); S.tab = 'sort'; body.scrollTop = 0; break;
                case 'sort-tree': S.sort = newSort(el.dataset.v, T.codage); sfx('pop'); break;
                case 'sort-new': S.sort = newSort(T.tree, T.codage); sfx('pop'); break;
                case 'sort-codage': T.codage = !T.codage; break;
                case 'sort-pick': {
                    const i = +el.dataset.v;
                    if (T.placed[i] !== undefined) return;
                    T.cur = T.cur === i ? null : i; T.path = T.cur === null ? [] : [TREES[T.tree].root.id]; T.fb = null; T.lastLeaf = null; sfx('pop'); break;
                }
                case 'sort-ans': sortAnswer(el.dataset.v); break;
                // Exercices
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'level': ex.level = +el.dataset.v; break;
                case 'n': ex.n = +el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'clear': if (!R) return; R.ans = []; R.corrected = false; break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected;
                    if (R.corrected) {
                        const sc = scoreOf(R);
                        if (sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'pick': if (!R || R.corrected) return; R.ans[+el.dataset.i] = el.dataset.v; sfx('pop'); break;
                case 'tick': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, j = +el.dataset.v, cur = Array.isArray(R.ans[i]) ? R.ans[i].slice() : [];
                    const k = cur.indexOf(j);
                    if (k === -1) cur.push(j); else cur.splice(k, 1);
                    R.ans[i] = cur; sfx('pop'); break;
                }
                default: return;
            }
            render(); save();
        }

        // ── Événements : souris, stylet et tactile ──
        let lastUp = 0;
        function onTap(e) {
            const el = e.target.closest && e.target.closest('[data-act]');
            if (e.type === 'click') {
                if (Date.now() - lastUp < 700) { e.stopPropagation(); e.preventDefault(); return; }
            } else if (e.button > 0) return;
            if (!el || !container.contains(el) || el.disabled) return;
            e.stopPropagation(); e.preventDefault();
            if (e.type === 'pointerup') lastUp = Date.now();
            act(el.dataset.act, el);
        }
        container.addEventListener('pointerup', onTap);
        container.addEventListener('click', onTap);
        function onDown(e) {
            if (typeof bringToFront === 'function') bringToFront(widget);
            if (e.target.closest('.fgp-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.fgp-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        container.addEventListener('input', e => {
            const t = e.target, R = S.run;
            if (R && t.dataset.in === 'ans') { R.ans[+t.dataset.i] = t.value.replace(/\D/g, ''); if (t.value !== R.ans[+t.dataset.i]) t.value = R.ans[+t.dataset.i]; saveSoon(); }
        });
        container.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') e.stopPropagation(); });
        ['keyup', 'keypress', 'paste', 'copy', 'cut'].forEach(evt => container.addEventListener(evt, e => { if (e.target.tagName === 'INPUT') e.stopPropagation(); }));
        document.addEventListener('pointerdown', function closeHelp(e) {
            if (!widget.isConnected) { document.removeEventListener('pointerdown', closeHelp, true); return; }
            if (help.classList.contains('show') && !help.contains(e.target) && !e.target.closest('[data-act="help"]')) help.classList.remove('show');
        }, true);

        // ── Redimensionnement libre ──
        resizeHandle.addEventListener('pointerdown', e => {
            e.stopPropagation(); e.preventDefault();
            resizeHandle.setPointerCapture(e.pointerId);
            const sx = e.clientX, sy = e.clientY, sw = container.offsetWidth, sh = container.offsetHeight;
            const mv = ev => {
                container.style.width = Math.max(480, sw + ev.clientX - sx) + 'px';
                container.style.height = Math.max(400, sh + ev.clientY - sy) + 'px';
            };
            const up = () => { resizeHandle.removeEventListener('pointermove', mv); resizeHandle.removeEventListener('pointerup', up); save(); };
            resizeHandle.addEventListener('pointermove', mv);
            resizeHandle.addEventListener('pointerup', up);
        });

        // ── Sauvegarde (taille hors plein écran mémorisée) ──
        const vh = () => typeof virtualH === 'function' ? virtualH(window.innerWidth) : window.innerHeight;
        let savedW = 0, savedH = 0;
        function memoSize() {
            if (container.classList.contains('wf-fullboard')) return;
            if (!container.offsetWidth) return;
            savedW = (container.offsetWidth / window.innerWidth) * 100;
            savedH = (container.offsetHeight / vh()) * 100;
        }
        new MutationObserver(memoSize).observe(container, { attributes: true, attributeFilter: ['style', 'class'] });
        widget._fgpGetData = function () {
            memoSize();
            return { state: JSON.parse(JSON.stringify(S)), wPct: savedW, hPct: savedH, fullboard: container.classList.contains('wf-fullboard') };
        };

        // ── Mise en place ──
        const board = document.getElementById('board') || document.body;
        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function' && !restored) clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        if (restored && saved.wPct > 0) container.style.width = (saved.wPct / 100) * window.innerWidth + 'px';
        if (restored && saved.hPct > 0) container.style.height = (saved.hPct / 100) * vh() + 'px';
        render();

        requestAnimationFrame(() => requestAnimationFrame(() => {
            memoSize();
            if (restored) {
                if (saved.fullboard) container.classList.add('wf-fullboard');
            } else if (window._jeuWantsFullboard()) {
                // Sur téléphone et tablette : ouverture directe en plein écran (bouton vert)
                container.classList.add('wf-fullboard');
            } else {
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / window.innerWidth) * 100;
            }
            save();
        }));
        return widget;
    };

    // Accès au moteur (tests)
    window._fgpEngine = { K, makeFig, figSvg, TREES, expectedPath, nodeById, genSortFigs, genQuestions, isRightQ, membersOf, CATS, VF, angleAt, sides };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createFiguresPlanesWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
