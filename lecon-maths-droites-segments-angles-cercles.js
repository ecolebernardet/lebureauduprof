// =========================================================================
// LEÇON « DROITES, SEGMENTS, ANGLES ET CERCLE » — Le Bureau du Prof
// Leçons + manipulation au doigt + exercices corrigés.
// Même cadre que « Les nombres décimaux ».
//
// 📖 Leçons : point, droite, demi-droite, segment et leurs notations, droites
//    parallèles, droites perpendiculaires, les angles (aigu, droit, obtus,
//    plat), le cercle (centre, rayon, diamètre, corde), les instruments.
// ✋ Manipuler : on déplace les points au doigt ou à la souris :
//    une droite, une demi-droite ou un segment ; deux droites (parallèles,
//    perpendiculaires ou sécantes) ; un angle avec l'équerre ; un cercle.
// ✏️ Exercices : ✏️ droite ou segment ?, 📐 les angles, 🛤️ deux droites,
//    ⭕ le cercle, ✔ vrai ou faux.
//
// Ouverture : createWidget('droites-angles')  ou  createDroitesAnglesWidget()
// Sauvegarde : w._dsaGetData()  /  createDroitesAnglesWidget(données)
//   (branché dans save-load.js : champ dsaData)
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
    if (!document.getElementById('droites-angles-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'droites-angles-cursors-style';
        _cs.textContent = [
            '.widget[data-type="droites-angles"] .dsa-header :not(button):not(button *):not(select):not(input) { cursor: inherit !important; }',
            '.widget[data-type="droites-angles"] .drag-handle, .widget[data-type="droites-angles"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="droites-angles"] .drag-handle:active, .widget[data-type="droites-angles"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            '.widget[data-type="droites-angles"] .dsa-container.wf-fullboard .dsa-header, .widget[data-type="droites-angles"] .dsa-container.wf-fullboard .dsa-header:active,',
            '.widget.phone-fs[data-type="droites-angles"] .dsa-header, .widget.phone-fs[data-type="droites-angles"] .dsa-header:active { cursor: default !important; }',
            '.widget[data-type="droites-angles"] button:not(:disabled), .widget[data-type="droites-angles"] button:not(:disabled) *, .widget[data-type="droites-angles"] select,',
            '.widget[data-type="droites-angles"] .widget-menu-handle, .widget[data-type="droites-angles"] .widget-pin-handle,',
            '.widget[data-type="droites-angles"] .widget-back-handle, .widget[data-type="droites-angles"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="droites-angles"] button:disabled, .widget[data-type="droites-angles"] button:disabled * { cursor: default !important; }',
            '.widget[data-type="droites-angles"]:has(.dsa-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    'use strict';

    const TYPE = 'droites-angles';

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

    // ── CSS (préfixe dsa-) ─────────────────────────────────────────────────
    if (!document.getElementById('dsa-style')) {
        const s = document.createElement('style');
        s.id = 'dsa-style';
        s.textContent = `
.widget[data-type="droites-angles"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.dsa-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --ce:#e07b2a; --c1:#0891b2; --c2:#7c3aed; --c3:#D63384;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.dsa-container input { user-select:text; -webkit-user-select:text; }
.dsa-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:600px), (max-height:500px) and (pointer:coarse) {
    .dsa-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .dsa-tab-lbl { display:none; }
    .dsa-title { font-size:17px !important; }
    .dsa-lesson { flex-direction:column; }
    .dsa-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .dsa-gbtn { flex:1 1 auto; text-align:center !important; }
    .dsa-srow > .l { min-width:0 !important; width:100%; }
}
.dsa-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.dsa-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.dsa-tabs { display:flex; gap:6px; margin-left:12px; }
.dsa-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.dsa-tab:hover { background:rgba(255,255,255,.1); }
.dsa-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.dsa-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.dsa-icon-btn:hover { background:rgba(255,255,255,.28); }
.dsa-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Couleurs : partie entière, virgule, dixièmes, centièmes, millièmes */
.dsa-ce { color:var(--ce); } .dsa-k1 { color:var(--c1); } .dsa-k2 { color:var(--c2); } .dsa-k3 { color:var(--c3); }
.dsa-virg { color:var(--rouge); font-weight:900; }
.dsa-num { font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; white-space:nowrap; letter-spacing:.02em; }
.dsa-words { font-weight:800; line-height:1.5; }
.dsa-frac { display:inline-flex; flex-direction:column; align-items:stretch; text-align:center; vertical-align:middle; line-height:1.05; margin:0 3px;
    font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; }
.dsa-frac > span { padding:0 4px; }
.dsa-frac > span:first-child { padding-bottom:.06em; }
/* Dénominateur : un peu d'espace sous la barre de fraction */
.dsa-frac > span + span { border-top:2.5px solid currentColor; padding-top:.16em; }

/* ── Tableau de numération ── */
.dsa-twrap { overflow-x:auto; display:flex; justify-content:center; padding:2px; }
.dsa-table { --cw:54px; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.dsa-table th, .dsa-table td { text-align:center; padding:0; }
.dsa-table .kh { color:#fff; font-weight:900; font-size:calc(var(--cw) * .27); padding:5px 6px; letter-spacing:.3px; white-space:nowrap; }
.dsa-table .kh.ke { background:var(--ce); } .dsa-table .kh.kd { background:linear-gradient(90deg,var(--c1),var(--c2),var(--c3)); }
.dsa-table .ch { font-weight:900; font-size:calc(var(--cw) * .3); padding:3px 2px; width:var(--cw); }
.dsa-table .ch.kd { font-size:calc(var(--cw) * .2); width:calc(var(--cw) * 1.3); }
.dsa-table .ch.ke, .dsa-table td.ke { background:#fdf0e5; color:var(--ce); }
.dsa-table .ch.k1, .dsa-table td.k1 { background:#e6f7fb; color:var(--c1); }
.dsa-table .ch.k2, .dsa-table td.k2 { background:#f3edff; color:var(--c2); }
.dsa-table .ch.k3, .dsa-table td.k3 { background:#fdeaf3; color:var(--c3); }
.dsa-table td { height:calc(var(--cw) * 1.15); font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .78); font-weight:700; color:var(--encre) !important;
    border-top:2px solid rgba(0,0,0,.06); }
.dsa-table .vh, .dsa-table .virg { width:calc(var(--cw) * .32); background:#fff; }
/* La virgule : même police, même taille et même alignement que les chiffres, pour être posée sur leur ligne */
.dsa-table td.virg { color:var(--rouge) !important; font-size:calc(var(--cw) * .78); vertical-align:middle; line-height:normal; }
.dsa-table .dim { opacity:.3; }
.dsa-table .hlc { box-shadow:inset 0 0 0 4px #ff4f5e; background:#ffe9eb !important; }
.dsa-table td.click:hover { filter:brightness(.95); }
.dsa-table td.ed { padding:3px; }
.dsa-table td input { width:100%; height:100%; box-sizing:border-box; border:2px dashed #c7bca6; border-radius:8px; background:#fff; text-align:center;
    font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .7); font-weight:700; color:#3949AB; outline:none; padding:0; }
.dsa-table td input:focus { border:3px solid var(--violet); background:#f3efff; }
.dsa-table td input.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.dsa-table td input.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.dsa-table.small { --cw:40px; }

/* ── Dessins (bande unité, quadrillage, droite graduée) ── */
.dsa-fig { display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:flex-end; }
.dsa-fig figure { margin:0; display:flex; flex-direction:column; align-items:center; gap:4px; }
.dsa-fig figcaption { font-weight:800; font-size:15px; text-align:center; }
.dsa-svg { display:block; max-width:100%; height:auto; }
.dsa-line { width:100%; max-width:680px; margin:0 auto; }

/* ── Leçons ── */
.dsa-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.dsa-side { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.dsa-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.dsa-gbtn:hover { transform:translateX(2px); }
.dsa-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.dsa-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.dsa-ltitle h2 { margin:0; font-size:32px; font-weight:900; }
.dsa-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.55; }
.dsa-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.dsa-box ul, .dsa-box ol { margin:4px 0 0; padding-left:22px; }
.dsa-what { background:#f1edff; border:2px solid #c8bbf5; }
.dsa-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.dsa-memo { background:#fff6d6; border:2px solid #f3d36b; }
.dsa-trap { background:#ffecee; border:2px solid #f6a7b0; }
.dsa-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.dsa-big { font-size:22px; }
.dsa-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.dsa-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.dsa-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.dsa-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.dsa-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.dsa-btn:disabled { opacity:.45; }
.dsa-steps { display:flex; flex-direction:column; gap:6px; }
.dsa-step { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:6px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.dsa-step > span:last-child { flex:1; min-width:0; }
.dsa-step .n { background:var(--encre); color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:900; flex-shrink:0; }
.dsa-ftable { border-collapse:collapse; margin:4px auto 0; font-size:20px; }
.dsa-ftable td { padding:4px 14px; border-bottom:1px dashed #e3d8c3; text-align:center; }
.dsa-ftable td.w { font-size:14px; font-weight:800; color:#6a6380; text-align:left; }

/* ── Explorer ── */
.dsa-ex { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.dsa-bar { display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
.dsa-in { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:26px; font-weight:700; padding:4px 12px; width:220px; max-width:100%; box-sizing:border-box;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; text-align:center; }
.dsa-in:focus { border-color:var(--violet); }
.dsa-panel { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 14px; }
.dsa-panel h4 { margin:0 0 6px; font-size:15px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.dsa-read { font-size:22px; text-align:center; }
.dsa-dec { display:flex; flex-direction:column; gap:4px; font-size:21px; }
.dsa-dec .row { display:flex; flex-direction:column; gap:0; padding:3px 0; border-bottom:1px dashed #eee4d2; }
.dsa-dec .row:last-child { border-bottom:none; }
.dsa-dec .lbl { font-size:12px; font-weight:900; color:#9a8f7a; text-transform:uppercase; }
.dsa-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:8px 14px; font-weight:700; text-align:center; font-size:17px; }
.dsa-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.dsa-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.dsa-hint { font-size:12.5px; color:#6a6380; }

/* ── Exercices ── */
.dsa-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.dsa-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.dsa-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.dsa-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.dsa-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.dsa-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.dsa-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.dsa-pill.score { background:var(--vert); font-size:16px; }
.dsa-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.dsa-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 400px)),1fr)); }
.dsa-grid.one { grid-template-columns:1fr; }
.dsa-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .3); min-width:0; }
.dsa-q.ok { border-color:var(--vert); background:#f3fcf7; }
.dsa-q.ko { border-color:var(--rouge); background:#fff5f6; }
.dsa-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.dsa-n { font-weight:900; color:#9a8f7a; }
.dsa-qmain { text-align:center; font-size:var(--f); line-height:1.5; }
.dsa-qwords { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
.dsa-ans { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .9); font-weight:700; padding:2px 10px; width:100%; max-width:260px; box-sizing:border-box;
    border:2px dashed #b9abef; border-radius:12px; outline:none; color:#3949AB; background:#fff; text-align:center; align-self:center; }
.dsa-ans.mini { width:auto; max-width:none; font-size:calc(var(--f) * .72); padding:0 6px; border-radius:8px; vertical-align:baseline; }
/* Case à remplir dans une fraction (numérateur) ou entre deux nombres : largeur adaptée */
.dsa-ans.mini { width:calc(var(--f) * 3.6); }
.dsa-frac .dsa-ans.mini { width:calc(var(--f) * 2.4); margin-bottom:.1em; }
.dsa-ans:focus { border:3px solid var(--violet); background:#f3efff; }
.dsa-ans.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.dsa-ans.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.dsa-cmp { display:flex; align-items:center; justify-content:center; gap:calc(var(--f) * .4); flex-wrap:wrap; font-size:var(--f); }
.dsa-sign { border:2px solid #d9cdb6; background:#fff; border-radius:12px; min-width:calc(var(--f) * 1.5); padding:0 8px; font:inherit; font-weight:900; font-size:calc(var(--f) * .8);
    color:var(--encre); touch-action:manipulation; line-height:1.4; }
.dsa-sign.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.dsa-sign.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.dsa-sign.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.dsa-pool, .dsa-order { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; align-items:center; min-height:calc(var(--f) * 1.5); }
.dsa-order { background:#faf6ee; border:2px dashed #d9cdb6; border-radius:12px; padding:4px 8px; }
.dsa-rk { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:0 12px; font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700;
    font-size:calc(var(--f) * .8); color:var(--encre); touch-action:manipulation; line-height:1.4; }
.dsa-rk.used { opacity:.25; }
.dsa-rk.in { border-color:var(--violet); background:#f3efff; }
.dsa-lt { font-weight:900; font-size:calc(var(--f) * .7); color:#9a8f7a; }
.dsa-why { font-size:14px; color:#5a5470; text-align:center; line-height:1.45; }
.dsa-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:dsa-fall 1.6s ease-in forwards; }
@keyframes dsa-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.dsa-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.dsa-help.show { display:block; }
.dsa-help h4 { margin:0 0 6px; font-size:15px; }
.dsa-help p { margin:0 0 6px; }
.dsa-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.dsa-container:hover .dsa-resize { opacity:1; }
.dsa-container.wf-fullboard .dsa-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="droites-angles"], .dsa-container, .dsa-container * { cursor:default !important; }
.dsa-container .dsa-header { cursor:grab !important; }
.dsa-container .dsa-header:active { cursor:grabbing !important; }
.dsa-container button, .dsa-container [data-act] { cursor:pointer !important; }
.dsa-container button:disabled { cursor:default !important; }
.dsa-container input { cursor:text !important; }
.dsa-container .dsa-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // ── CSS propre à cette leçon ─────────────────────────────────────────
    if (!document.getElementById('dsa-style2')) {
        const s2 = document.createElement('style');
        s2.id = 'dsa-style2';
        s2.textContent = `
.dsa-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; }
.dsa-draw { display:block; width:100%; height:auto; }
.dsa-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:10px; }
.dsa-card { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:8px 10px; display:flex; flex-direction:column; align-items:center; gap:4px; text-align:center; }
.dsa-card h5 { margin:0; font-size:16px; font-weight:900; }
.dsa-card .nt { font-family:'Nunito',sans-serif; font-weight:900; font-size:18px; color:#6C4FD8; }
.dsa-card p { margin:0; font-size:13.5px; line-height:1.4; }
/* Manipuler */
.dsa-play { padding:12px 14px 16px; display:flex; flex-direction:column; gap:10px; }
.dsa-stage { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:4px; touch-action:none; }
.dsa-stage svg { display:block; width:100%; height:auto; max-height:58vh; touch-action:none; }
.dsa-stage [data-h] { cursor:grab !important; }
.dsa-stage [data-h]:active { cursor:grabbing !important; }
.dsa-res { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:8px 14px; font-weight:800; text-align:center; font-size:18px; line-height:1.45; }
.dsa-res .big { font-size:24px; font-weight:900; }
/* Exercices */
.dsa-qfig { width:100%; max-width:calc(var(--f) * 9); align-self:center; }
.dsa-opts { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.dsa-opt { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:2px 12px; font:inherit; font-weight:800; font-size:calc(var(--f) * .55);
    color:var(--encre); touch-action:manipulation; line-height:1.5; }
.dsa-opt.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.dsa-opt.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.dsa-opt.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.dsa-stmt { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
`;
        document.head.appendChild(s2);
    }

    // =====================================================================
    // OUTILS DE DESSIN
    // Les angles sont en degrés, sens des maths (inverse des aiguilles d'une montre) :
    // la direction a donne le vecteur (cos a, −sin a) dans le repère SVG (y vers le bas).
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const rndi = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const RAD = Math.PI / 180;
    const dirv = a => [Math.cos(a * RAD), -Math.sin(a * RAD)];
    const add = (p, v, k) => [p[0] + v[0] * (k == null ? 1 : k), p[1] + v[1] * (k == null ? 1 : k)];
    const r1 = x => Math.round(x * 10) / 10;
    const P = p => r1(p[0]) + ' ' + r1(p[1]);
    // Direction (en degrés) d'un vecteur du repère SVG
    const angOf = (A, B) => { let a = Math.atan2(-(B[1] - A[1]), B[0] - A[0]) / RAD; return (a + 360) % 360; };
    // Angle entre deux directions, ramené entre 0 et 180
    const between = (a, b) => { let d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };
    // Angle entre deux droites (sans sens), entre 0 et 90
    const lineAngle = (a, b) => { let d = between(a, b); return d > 90 ? 180 - d : d; };
    const fmtNum = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
    const INK = '#2A1F4A', RED = '#FF4F5E', BLUE = '#1f6fd1', VIO = '#6C4FD8', TEAL = '#0891b2';

    // Partie d'une droite (P, direction d) visible dans le cadre b = [x0, y0, x1, y1]
    function tRange(Pt, d, b) {
        let t0 = -1e9, t1 = 1e9;
        [[0, b[0], b[2]], [1, b[1], b[3]]].forEach(([k, lo, hi]) => {
            if (Math.abs(d[k]) < 1e-9) { if (Pt[k] < lo || Pt[k] > hi) { t0 = 1; t1 = 0; } }
            else { let a = (lo - Pt[k]) / d[k], c = (hi - Pt[k]) / d[k]; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); }
        });
        return [t0, t1];
    }
    const line = (A, B, col, w, extra) => `<line x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}" stroke="${col || INK}" stroke-width="${w || 2.4}" stroke-linecap="round"${extra || ''}/>`;
    function fullLine(Pt, a, box, col, w) { const d = dirv(a), [t0, t1] = tRange(Pt, d, box); return t1 > t0 ? line(add(Pt, d, t0), add(Pt, d, t1), col, w) : ''; }
    function rayLine(A, a, box, col, w) { const d = dirv(a), [, t1] = tRange(A, d, box); return t1 > 0 ? line(A, add(A, d, t1), col, w) : ''; }
    // Point marqué d'une croix, avec son nom
    function pt(A, name, opts) {
        opts = opts || {};
        const s = opts.s || 3.2, col = opts.col || INK;
        let r = `<path d="M${r1(A[0] - s)} ${r1(A[1] - s)} L${r1(A[0] + s)} ${r1(A[1] + s)} M${r1(A[0] - s)} ${r1(A[1] + s)} L${r1(A[0] + s)} ${r1(A[1] - s)}" stroke="${col}" stroke-width="${opts.w || 1.8}" stroke-linecap="round"/>`;
        if (name) { const o = opts.off || [0, -7]; r += `<text x="${r1(A[0] + o[0])}" y="${r1(A[1] + o[1])}" text-anchor="middle" font-size="${opts.fs || 10}" font-weight="900" fill="${col}" font-family="Nunito,sans-serif">${esc(name)}</text>`; }
        return r;
    }
    // Petit carré d'angle droit au sommet O, entre les directions a et b
    function rightMark(O, a, b, s, col) {
        const u = dirv(a), v = dirv(b);
        return `<polyline points="${P(add(O, u, s))} ${P(add(add(O, u, s), v, s))} ${P(add(O, v, s))}" fill="none" stroke="${col || TEAL}" stroke-width="1.8"/>`;
    }
    // Arc d'angle au sommet O, de la direction a à la direction b (le plus court chemin)
    function arcMark(O, a, b, r, col, fill) {
        const u = dirv(a), v = dirv(b), A = add(O, u, r), B = add(O, v, r);
        const cross = u[0] * v[1] - u[1] * v[0];
        if (between(a, b) > 179.5) {
            const m = dirv(a + 90 * (cross <= 0 ? 1 : -1)), M = add(O, m, r);
            return `<path d="M${P(A)} A ${r} ${r} 0 0 ${cross <= 0 ? 0 : 1} ${P(M)} A ${r} ${r} 0 0 ${cross <= 0 ? 0 : 1} ${P(B)}" fill="none" stroke="${col}" stroke-width="2"/>`;
        }
        return `<path d="M${P(O)} L${P(A)} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${P(B)} Z" fill="${fill || 'none'}" stroke="none"/><path d="M${P(A)} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${P(B)}" fill="none" stroke="${col}" stroke-width="2"/>`;
    }
    const svgWrap = (w, h, inner) => `<svg class="dsa-draw" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
    function kindOfAngle(d) {
        if (d > 179.5) return { k: 'plat', lbl: 'un angle plat', col: '#7c3aed' };
        if (Math.abs(d - 90) < 0.5) return { k: 'droit', lbl: 'un angle droit', col: TEAL };
        if (d < 90) return { k: 'aigu', lbl: 'un angle aigu', col: '#2FBF71' };
        return { k: 'obtus', lbl: 'un angle obtus', col: '#e07b2a' };
    }

    // ── Dessins des exercices (cadre 160 × 110) ──
    const BOX = [6, 6, 154, 104];
    function drawLineQ(q) {
        const A = q.A, B = q.B, a = angOf(A, B);
        let r = '';
        if (q.kind === 'segment') r += line(A, B, BLUE, 2.6);
        else if (q.kind === 'droite') r += fullLine(A, a, BOX, BLUE, 2.6);
        else { const S = q.from === 'B' ? B : A, T = q.from === 'B' ? A : B; r += rayLine(S, angOf(S, T), BOX, BLUE, 2.6); }
        const n = dirv(a + 90);
        r += pt(A, 'A', { off: [n[0] * 9, n[1] * 9 + 3] }) + pt(B, 'B', { off: [n[0] * 9, n[1] * 9 + 3] });
        return svgWrap(160, 110, r);
    }
    function drawTwoLines(q, codage) {
        let r = fullLine(q.P1, q.a1, BOX, BLUE, 2.4) + fullLine(q.P2, q.a2, BOX, VIO, 2.4);
        if (q.ans === 'perpendiculaires' && codage) r += rightMark(q.P2, q.a1, q.a2, 7);
        // Noms des droites, près d'un bord
        const lab = (Pt, a, name, col) => { const d = dirv(a), [, t1] = tRange(Pt, d, [14, 14, 146, 96]); const E = add(Pt, d, t1 - 4), n = dirv(a + 90); return `<text x="${r1(E[0] + n[0] * 8)}" y="${r1(E[1] + n[1] * 8 + 3)}" text-anchor="middle" font-size="9" font-weight="900" fill="${col}" font-family="Nunito,sans-serif">${name}</text>`; };
        r += lab(q.P1, q.a1, '(d₁)', BLUE) + lab(q.P2, q.a2, '(d₂)', VIO);
        return svgWrap(160, 110, r);
    }
    function drawAngleQ(q) {
        const O = q.O, a = q.a, b = q.a + q.m;
        let r = arcMark(O, a, b, 14, '#e07b2a', '#fff3e0');
        r += line(O, add(O, dirv(a), q.L || 58), INK, 2.6) + line(O, add(O, dirv(b), q.L || 58), INK, 2.6);
        r += pt(O, '', { s: 2.4 });
        return svgWrap(160, 110, r);
    }
    function drawCircleQ(q) {
        const O = [80, 55], R = 38;
        let r = `<circle cx="80" cy="55" r="${R}" fill="#f1edff" fill-opacity=".6" stroke="${INK}" stroke-width="2.4"/>`;
        const A = add(O, dirv(q.a), R);
        if (q.el === 'rayon') r += line(O, A, RED, 3) + pt(A, 'A', { off: [dirv(q.a)[0] * 9, dirv(q.a)[1] * 9 + 3] });
        if (q.el === 'diametre') { const B = add(O, dirv(q.a + 180), R); r += line(A, B, RED, 3) + pt(A, 'A', { off: [dirv(q.a)[0] * 9, dirv(q.a)[1] * 9 + 3] }) + pt(B, 'B', { off: [dirv(q.a + 180)[0] * 9, dirv(q.a + 180)[1] * 9 + 3] }); }
        if (q.el === 'corde') { const B = add(O, dirv(q.a + q.b), R); r += line(A, B, RED, 3) + pt(A, 'A', { off: [dirv(q.a)[0] * 9, dirv(q.a)[1] * 9 + 3] }) + pt(B, 'B', { off: [dirv(q.a + q.b)[0] * 9, dirv(q.a + q.b)[1] * 9 + 3] }); }
        // La lettre O se place à l'opposé du segment rouge, pour ne pas le chevaucher
        const away = q.el === 'diametre' ? dirv(q.a + 90) : q.el === 'corde' ? dirv(q.a + q.b / 2 + 180) : dirv(q.a + 180);
        r += pt(O, 'O', { col: q.el === 'centre' ? RED : INK, s: q.el === 'centre' ? 4 : 3, w: q.el === 'centre' ? 2.6 : 1.8, off: [away[0] * 9, away[1] * 9 + 3] });
        return svgWrap(160, 110, r);
    }

    // =====================================================================
    // EXERCICES : génération et correction (fonctions pures, testables)
    // =====================================================================
    function genLineQ(lvl) {
        // Deux points bien séparés, loin des bords
        let A, B;
        do { A = [rnd(30, 130), rnd(25, 85)]; B = [rnd(30, 130), rnd(25, 85)]; } while (Math.hypot(A[0] - B[0], A[1] - B[1]) < 50);
        const kinds = lvl === 1 ? ['droite', 'segment'] : ['droite', 'segment', 'demi'];
        const kind = pick(kinds), from = kind === 'demi' && lvl === 3 && Math.random() < .5 ? 'B' : 'A';
        const ask = lvl === 1 ? 'nom' : pick(['nom', 'notation']);
        const NAME = { droite: 'une droite', segment: 'un segment', demi: 'une demi-droite' };
        const NOT = { droite: '(AB)', segment: '[AB]', demi: from === 'B' ? '[BA)' : '[AB)' };
        const opts = ask === 'nom' ? kinds.map(k => NAME[k]) : (lvl === 3 ? ['(AB)', '[AB]', '[AB)', '[BA)'] : ['(AB)', '[AB]', '[AB)']);
        return { t: 'ligne', A, B, kind, from, ask, ans: ask === 'nom' ? NAME[kind] : NOT[kind], opts };
    }
    function genAngleQ(lvl) {
        const kinds = lvl === 3 ? ['aigu', 'droit', 'obtus', 'plat'] : ['aigu', 'droit', 'obtus'];
        const k = pick(kinds);
        const R = { 1: { aigu: [20, 60], obtus: [120, 160] }, 2: { aigu: [35, 75], obtus: [105, 150] }, 3: { aigu: [55, 80], obtus: [100, 125] } }[lvl];
        const m = k === 'droit' ? 90 : k === 'plat' ? 180 : Math.round(rnd(R[k][0], R[k][1]));
        const a = Math.round(rnd(0, 360));
        // Sommet placé pour que les deux côtés tiennent dans le cadre
        // Longueur des côtés réduite si l'angle, très ouvert, ne tiendrait pas dans le cadre (160 × 110, marge 8)
        const u = dirv(a), v = dirv(a + m);
        const xs0 = [0, u[0], v[0]], ys0 = [0, u[1], v[1]];
        const wu = Math.max(...xs0) - Math.min(...xs0), hu = Math.max(...ys0) - Math.min(...ys0);
        const L = Math.min(58, 144 / Math.max(wu, .01), 94 / Math.max(hu, .01));
        const xs = xs0.map(x => x * L), ys = ys0.map(y => y * L);
        const O = [80 - (Math.max(...xs) + Math.min(...xs)) / 2, 55 - (Math.max(...ys) + Math.min(...ys)) / 2];
        return { t: 'angle', O, a, m, L, ans: { aigu: 'aigu', droit: 'droit', obtus: 'obtus', plat: 'plat' }[k], opts: kinds };
    }
    function genTwoLinesQ(lvl) {
        const kinds = ['parallèles', 'perpendiculaires', 'ni l\'un ni l\'autre'];
        const ans = pick(kinds), a1 = rnd(0, 180), C = [80, 55], n = dirv(a1 + 90);
        let a2, P2;
        if (ans === 'parallèles') { a2 = a1; P2 = add(C, n, pick([-1, 1]) * rnd(20, 30)); }
        else if (ans === 'perpendiculaires') { a2 = a1 + 90; P2 = add(C, dirv(a1), rnd(-22, 22)); }
        else if (lvl === 3 && Math.random() < .5) {
            // Presque parallèles : elles se couperaient en dehors du dessin
            const off = pick([-1, 1]) * rnd(22, 28), dl = pick([-1, 1]) * rnd(9, 13);
            a2 = a1 + dl; P2 = add(C, n, off);
            return { t: 'deux', P1: C, a1, P2, a2, ans, opts: kinds, near: true };
        } else { a2 = a1 + pick([-1, 1]) * rnd(28, 62); P2 = add(C, dirv(a1), rnd(-22, 22)); }
        return { t: 'deux', P1: C, a1, P2, a2, ans, opts: kinds };
    }
    function genCircleQ(lvl) {
        if (lvl >= 2 && Math.random() < .5) {
            // Calcul : rayon ↔ diamètre
            const toD = Math.random() < .5;
            let v;
            if (lvl === 2) v = toD ? rndi(2, 12) : rndi(2, 12) * 2;
            else v = toD ? rndi(3, 15) + .5 : rndi(5, 25) | 1;
            return { t: 'calc', toD, v, ans: toD ? v * 2 : v / 2 };
        }
        const els = lvl === 3 ? ['centre', 'rayon', 'diametre', 'corde'] : ['centre', 'rayon', 'diametre'];
        const el = pick(els);
        const NAME = { centre: 'le centre', rayon: 'un rayon', diametre: 'un diamètre', corde: 'une corde' };
        return { t: 'cercle', el, a: rnd(0, 360), b: rnd(55, 140), ans: NAME[el], opts: els.map(e => NAME[e]) };
    }
    const VF = {
        1: [
            ['Une droite a deux extrémités.', 'F', 'Une droite est illimitée : elle n\'a pas d\'extrémité, on ne peut pas la mesurer.'],
            ['Un segment est limité par deux points.', 'V', 'Ces deux points sont ses extrémités.'],
            ['Deux droites parallèles ne se coupent jamais.', 'V', 'Même si on les prolonge.'],
            ['Deux droites perpendiculaires forment un angle droit.', 'V', 'C\'est ce qui les définit.'],
            ['Un angle aigu est plus grand qu\'un angle droit.', 'F', 'Il est plus petit qu\'un angle droit.'],
            ['Le centre d\'un cercle est sur le cercle.', 'F', 'Il est au milieu, à l\'intérieur du cercle.'],
            ['On peut mesurer la longueur d\'un segment.', 'V', 'Avec une règle graduée.'],
            ['On trace un cercle avec un compas.', 'V', 'La pointe se pique sur le centre.'],
            ['On vérifie un angle droit avec l\'équerre.', 'V', 'On place l\'angle droit de l\'équerre sur l\'angle.'],
            ['Un angle obtus est plus petit qu\'un angle droit.', 'F', 'Il est plus grand qu\'un angle droit.']
        ],
        2: [
            ['Le diamètre d\'un cercle mesure deux fois le rayon.', 'V', 'Diamètre = rayon + rayon.'],
            ['On peut mesurer la longueur d\'une droite.', 'F', 'Une droite est illimitée : on ne peut pas la mesurer.'],
            ['Deux droites qui se coupent sont toujours perpendiculaires.', 'F', 'Elles sont perpendiculaires seulement si elles forment un angle droit.'],
            ['Tous les rayons d\'un même cercle ont la même longueur.', 'V', 'Tous les points du cercle sont à la même distance du centre.'],
            ['Un diamètre passe par le centre du cercle.', 'V', 'Il relie deux points du cercle en passant par le centre.'],
            ['La notation [AB] désigne un segment.', 'V', 'Les crochets « ferment » le segment en A et en B.'],
            ['La notation (AB) désigne un segment.', 'F', 'Les parenthèses désignent la droite (AB).'],
            ['Un angle droit mesure 90°.', 'V', 'C\'est l\'angle d\'un coin de feuille ou de l\'équerre.'],
            ['Deux droites parallèles restent toujours à la même distance l\'une de l\'autre.', 'V', 'L\'écart entre elles ne change pas.'],
            ['L\'écartement du compas est égal au diamètre du cercle tracé.', 'F', 'Il est égal au rayon.']
        ],
        3: [
            ['Une demi-droite a une seule extrémité.', 'V', 'Elle commence en un point et ne s\'arrête jamais de l\'autre côté.'],
            ['Si les côtés d\'un angle sont plus longs, l\'angle est plus grand.', 'F', 'La grandeur d\'un angle ne dépend que de son ouverture.'],
            ['Deux droites perpendiculaires à une même troisième droite sont parallèles entre elles.', 'V', 'C\'est ainsi qu\'on trace des parallèles avec l\'équerre.'],
            ['Deux droites qui ne se coupent pas sur le dessin sont forcément parallèles.', 'F', 'Il faut les prolonger : elles peuvent se couper plus loin.'],
            ['Un angle plat mesure 180°.', 'V', 'Ses deux côtés forment une droite.'],
            ['Un angle obtus est compris entre un angle droit et un angle plat.', 'V', 'Entre 90° et 180°.'],
            ['Une corde qui passe par le centre est un diamètre.', 'V', 'Le diamètre est la plus longue corde du cercle.'],
            ['Le rayon est la moitié du diamètre.', 'V', 'Rayon = diamètre ÷ 2.'],
            ['Un point A est sur le cercle de centre O si la longueur OA est égale au rayon.', 'V', 'Tous les points du cercle sont à la distance « rayon » du centre.'],
            ['Trois points sont alignés s\'ils sont sur une même droite.', 'V', 'On le vérifie avec la règle.'],
            ['Deux droites parallèles à une même troisième sont perpendiculaires entre elles.', 'F', 'Elles sont parallèles entre elles.']
        ]
    };
    function genQuestions(type, lvl, n) {
        const out = [];
        let pool = [];
        for (let i = 0; i < n; i++) {
            if (type === 'ligne') out.push(genLineQ(lvl));
            else if (type === 'angle') out.push(genAngleQ(lvl));
            else if (type === 'deux') out.push(genTwoLinesQ(lvl));
            else if (type === 'cercle') out.push(genCircleQ(lvl));
            else { if (!pool.length) pool = shuffle(VF[lvl].map((x, j) => j)); out.push({ t: 'vf', lvl, j: pool.pop() }); }
        }
        return out;
    }
    const parseNum = s => { const t = String(s == null ? '' : s).trim().replace(',', '.').replace(/\s/g, ''); return /^\d+(\.\d+)?$/.test(t) ? +t : null; };
    function isRightQ(type, q, a) {
        if (q.t === 'vf') return a === VF[q.lvl][q.j][1];
        if (q.t === 'calc') { const v = parseNum(a); return v !== null && Math.abs(v - q.ans) < 1e-9; }
        return a === q.ans;
    }
    // Pour les tests : géométrie réelle des questions « deux droites »
    function twoLinesTruth(q) {
        const d = lineAngle(q.a1, q.a2);
        if (d < .5) return 'parallèles';
        if (Math.abs(d - 90) < .5) return 'perpendiculaires';
        return 'ni l\'un ni l\'autre';
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
        { id: 'lignes',    label: '✏️ Droite, segment',     color: '#1f6fd1' },
        { id: 'paralleles',label: '🛤️ Droites parallèles',  color: '#059669' },
        { id: 'perp',      label: '➕ Perpendiculaires',     color: '#0891b2' },
        { id: 'angles',    label: '📐 Les angles',           color: '#e07b2a' },
        { id: 'cercle',    label: '⭕ Le cercle',            color: '#7c3aed' },
        { id: 'outils',    label: '🧰 Les instruments',      color: '#D63384' }
    ];
    const EXT = {
        ligne:    { label: '✏️ Droite ou segment ?', color: '#1f6fd1' },
        deux:     { label: '🛤️ Deux droites',        color: '#059669' },
        angle:    { label: '📐 Les angles',          color: '#e07b2a' },
        cercle:   { label: '⭕ Le cercle',           color: '#7c3aed' },
        vraifaux: { label: '✔ Vrai ou faux ?',       color: '#D63384' }
    };
    const LEVELS = {
        1: { label: '😊 Découvrir',   color: '#2FBF71', hint: 'les cas bien nets, avec le codage' },
        2: { label: '😐 S\'entraîner', color: '#F2994A', hint: 'notations, demi-droite, rayon et diamètre à calculer' },
        3: { label: '😤 Expert',      color: '#EB5757', hint: 'angles proches de l\'angle droit, angle plat, corde, pièges' }
    };
    const MODES = [['ligne', '✏️ Droite et segment'], ['deux', '🛤️ Deux droites'], ['angle', '📐 Un angle'], ['cercle', '⭕ Un cercle']];
    const W = 400, H = 260, CM = 40;   // 40 unités du dessin = 1 cm « affiché »

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'lignes',
            exp: { mode: 'ligne', ltype: 'droite', A: [120, 150], B: [270, 105],
                a1: 15, P2: [210, 175], a2: 105, angA: 10, angB: 70, equerre: true,
                O: [200, 130], M: [290, 100], diam: true },
            ex: { type: 'ligne', level: 1, n: 8 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createDroitesAnglesWidget = function (saved) {
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
        container.className = 'dsa-container';
        container.innerHTML = `
            <div class="dsa-header">
                <span class="dsa-title">📐 Droites, angles et cercle</span>
                <div class="dsa-tabs">
                    <button class="dsa-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="dsa-tab-lbl">Leçons</span></button>
                    <button class="dsa-tab" data-act="tab" data-tab="exp"><span>✋</span><span class="dsa-tab-lbl">Manipuler</span></button>
                    <button class="dsa-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="dsa-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="dsa-icon-btn" data-act="sound" title="Son"></button>
                    <button class="dsa-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="dsa-body"></div>
            <div class="dsa-help">
                <h4>💡 Comment utiliser cette leçon ?</h4>
                <p><b>📖 Leçons</b> — Point, droite, demi-droite et segment avec leurs notations, droites parallèles, droites perpendiculaires, les angles (aigu, droit, obtus, plat), le cercle (centre, rayon, diamètre, corde) et les instruments.</p>
                <p><b>✋ Manipuler</b> — Déplace les ronds au doigt, au stylet ou à la souris : la figure change et son nom s'affiche. Les droites « s'aimantent » quand elles deviennent parallèles ou perpendiculaires, l'angle quand il devient droit ou plat. L'équerre aide à comparer un angle avec l'angle droit.</p>
                <p><b>✏️ Exercices</b> — Droite, demi-droite ou segment (et leur notation), deux droites, les angles, le cercle (et le calcul rayon ↔ diamètre), vrai ou faux. Puis <b>👁 Correction</b> avec le score.</p>
            </div>
            <div class="dsa-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.dsa-body');
        const help = container.querySelector('.dsa-help');
        const resizeHandle = container.querySelector('.dsa-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        if (!EXT[S.ex.type]) S.ex.type = 'ligne';
        if (S.run && !EXT[S.run.type]) S.run = null;
        let msg = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        const C = (title, draw, nt, txt) => `<div class="dsa-card">${svgWrap(200, 110, draw)}<h5>${title}</h5>${nt ? `<div class="nt">${nt}</div>` : ''}${txt ? `<p>${txt}</p>` : ''}</div>`;
        const B6 = [4, 4, 196, 106];
        function renderLignes() {
            const A = [60, 70], B = [140, 40], a = angOf(A, B);
            const lab = (X, n) => pt(X, n, { off: [0, 15] });
            return `<div class="dsa-ltitle"><h2 style="color:#1f6fd1">✏️ Point, droite, demi-droite, segment</h2></div>
                <div class="dsa-box dsa-what"><b class="t">🔤 Le point</b>Un point se marque par une <b>croix</b> et se nomme par une <b>lettre majuscule</b> : le point A.</div>
                <div class="dsa-cards">
                    ${C('La droite', fullLine(A, a, B6, BLUE, 2.6) + lab(A, 'A') + lab(B, 'B'), '(AB)', 'Elle est <b>illimitée</b> des deux côtés : elle n\'a pas de fin. On n\'en dessine qu\'un morceau.')}
                    ${C('La demi-droite', rayLine(A, a, B6, BLUE, 2.6) + lab(A, 'A') + lab(B, 'B'), '[AB)', 'Elle <b>commence en A</b> et ne s\'arrête jamais du côté de B.')}
                    ${C('Le segment', line(A, B, BLUE, 2.6) + lab(A, 'A') + lab(B, 'B'), '[AB]', 'Il est <b>limité par A et B</b>, ses extrémités. On peut <b>mesurer</b> sa longueur.')}
                </div>
                <div class="dsa-box dsa-memo"><b class="t">🧠 Pour retenir les notations</b><b>( )</b> : ouvert des deux côtés → droite · <b>[ )</b> : fermé d'un côté → demi-droite · <b>[ ]</b> : fermé des deux côtés → segment.</div>
                <div class="dsa-cards">
                    ${C('Points alignés', fullLine([20, 80], 15, B6, '#c9bfae', 1.4) + [[40, 74.6], [100, 58.5], [160, 42.5]].map((X, i) => pt(X, 'MNP'[i], { off: [0, 15] })).join(''), '', 'M, N et P sont sur une même droite : ils sont <b>alignés</b>. On le vérifie avec la règle.')}
                    ${C('Points non alignés', [[40, 74], [100, 34], [160, 70]].map((X, i) => pt(X, 'RST'[i], { off: [0, 15] })).join(''), '', 'Aucune droite ne passe par R, S et T à la fois.')}
                </div>
                <div class="dsa-box dsa-trap"><b class="t">⚠️ Attention</b>On ne peut <b>pas mesurer une droite</b> : elle est infinie. Seul le segment a une longueur.</div>
                <div><button class="dsa-btn go" data-act="practice" data-v="ligne" data-l="1">✏️ S'entraîner</button> <button class="dsa-btn alt" data-act="exp-mode" data-v="ligne">✋ Manipuler</button></div>`;
        }
        function renderParalleles() {
            const a = 12, P1 = [100, 40], P2 = add(P1, dirv(a - 90), 34);
            let d = fullLine(P1, a, B6, BLUE, 2.4) + fullLine(P2, a, B6, VIO, 2.4);
            [55, 145].forEach(x => { const Q = add(P1, dirv(a), x - 100), R = add(Q, dirv(a - 90), 34); d += line(Q, R, '#e07b2a', 1.6, ' stroke-dasharray="3 2"') + rightMark(Q, a, a - 90, 5); });
            const near = fullLine([100, 38], 6, B6, BLUE, 2.4) + fullLine([100, 78], -6, B6, VIO, 2.4);
            return `<div class="dsa-ltitle"><h2 style="color:#059669">🛤️ Les droites parallèles</h2></div>
                <div class="dsa-box dsa-what"><b class="t">🔤 Définition</b>Deux droites sont <b>parallèles</b> si elles <b>ne se coupent jamais</b>, même quand on les prolonge. L'écart entre elles reste <b>toujours le même</b>.</div>
                <div class="dsa-cards">
                    ${C('Deux droites parallèles', d, '(d₁) // (d₂)', 'L\'écart (en orange) est le même partout.')}
                    ${C('Dans la vie', [0, 1, 2, 3].map(i => line([12, 22 + i * 22], [188, 22 + i * 22], '#7aa7e6', 1.6)).join('') + line([30, 10], [30, 100], '#ff8a80', 1.6), '', 'Les lignes du cahier, les rails d\'un train, les bords d\'une règle…')}
                    ${C('Pas parallèles !', near, '', 'Elles ne se coupent pas sur le dessin… mais en les <b>prolongeant</b>, elles se couperaient : elles ne sont pas parallèles.')}
                </div>
                <div class="dsa-box dsa-test"><b class="t">🔎 Vérifier</b>Avec l'équerre et la règle, on mesure l'écart entre les deux droites <b>à deux endroits différents</b> : il doit être le même.</div>
                <div class="dsa-box dsa-memo"><b class="t">🧠 Pour retenir</b>Le symbole <b>//</b> se lit « est parallèle à » : (d₁) // (d₂).</div>
                <div><button class="dsa-btn go" data-act="practice" data-v="deux" data-l="1">✏️ S'entraîner</button> <button class="dsa-btn alt" data-act="exp-mode" data-v="deux">✋ Manipuler</button></div>`;
        }
        function renderPerp() {
            const I = [100, 58], a = 20;
            const d1 = fullLine(I, a, B6, BLUE, 2.4) + fullLine(I, a + 90, B6, VIO, 2.4) + rightMark(I, a, a + 90, 9);
            const sq = [[60, 85], [150, 85], [60, 15]];
            const eq = `<polygon points="${sq.map(P).join(' ')}" fill="#a78bfa" fill-opacity=".35" stroke="#7c3aed" stroke-width="1.6"/>` + line([20, 85], [190, 85], BLUE, 2.4) + line([60, 104], [60, 6], VIO, 2.4) + rightMark([60, 85], 0, 90, 8);
            const sec = fullLine(I, 0, B6, BLUE, 2.4) + fullLine(I, 55, B6, VIO, 2.4) + arcMark(I, 0, 55, 16, '#e07b2a');
            return `<div class="dsa-ltitle"><h2 style="color:#0891b2">➕ Les droites perpendiculaires</h2></div>
                <div class="dsa-box dsa-what"><b class="t">🔤 Définition</b>Deux droites sont <b>perpendiculaires</b> si elles se coupent en formant un <b>angle droit</b>. On code l'angle droit par un <b>petit carré</b>.</div>
                <div class="dsa-cards">
                    ${C('Deux droites perpendiculaires', d1, '(d₁) ⊥ (d₂)', 'Elles peuvent être penchées : ce qui compte, c\'est l\'angle droit.')}
                    ${C('Vérifier avec l\'équerre', eq, '', 'On place l\'angle droit de l\'équerre au point où les droites se coupent.')}
                    ${C('Sécantes, mais pas perpendiculaires', sec, '', 'Elles se coupent, mais l\'angle n\'est pas droit.')}
                </div>
                <div class="dsa-box dsa-memo"><b class="t">🧠 Pour retenir</b>Deux droites qui se coupent sont <b>sécantes</b>. Si elles forment un angle droit, elles sont <b>perpendiculaires</b> : symbole <b>⊥</b>.</div>
                <div class="dsa-box dsa-trap"><b class="t">⚠️ Attention</b>Des droites perpendiculaires ne sont pas forcément « droite et debout » : on vérifie toujours avec l'équerre.</div>
                <div><button class="dsa-btn go" data-act="practice" data-v="deux" data-l="2">✏️ S'entraîner</button> <button class="dsa-btn alt" data-act="exp-mode" data-v="deux">✋ Manipuler</button></div>`;
        }
        function angleCard(title, m, txt, eq) {
            const O = [m > 170 ? 100 : 60, 85], a = 0, b = m;
            let d = arcMark(O, a, b, 18, '#e07b2a', '#fff3e0');
            if (eq) d = `<polygon points="${P(O)} ${P(add(O, dirv(0), 100))} ${P(add(O, dirv(90), 62))}" fill="#a78bfa" fill-opacity=".28" stroke="#7c3aed" stroke-width="1.2"/>` + d;
            if (m === 90) d += rightMark(O, a, b, 10);
            d += line(O, add(O, dirv(a), m > 170 ? 85 : 120), INK, 2.6) + line(O, add(O, dirv(b), m > 170 ? 85 : 72), INK, 2.6) + pt(O, '', { s: 2.4 });
            return C(title, d, '', txt);
        }
        function renderAngles() {
            const O = [40, 90];
            const voc = arcMark(O, 0, 40, 22, '#e07b2a', '#fff3e0') + line(O, add(O, dirv(0), 140), INK, 2.6) + line(O, add(O, dirv(40), 120), INK, 2.6) + pt(O, 'O', { off: [-8, 4] })
                + `<text x="140" y="104" font-size="10" font-weight="900" fill="#1f6fd1" font-family="Nunito,sans-serif">côté</text><text x="62" y="40" font-size="10" font-weight="900" fill="#1f6fd1" font-family="Nunito,sans-serif">côté</text><text x="22" y="104" font-size="10" font-weight="900" fill="#FF4F5E" font-family="Nunito,sans-serif">sommet</text>`;
            const small = arcMark([30, 90], 0, 50, 14, '#e07b2a', '#fff3e0') + line([30, 90], add([30, 90], dirv(0), 50), INK, 2.4) + line([30, 90], add([30, 90], dirv(50), 50), INK, 2.4)
                + arcMark([110, 90], 0, 50, 14, '#e07b2a', '#fff3e0') + line([110, 90], add([110, 90], dirv(0), 85), INK, 2.4) + line([110, 90], add([110, 90], dirv(50), 95), INK, 2.4);
            return `<div class="dsa-ltitle"><h2 style="color:#e07b2a">📐 Les angles</h2></div>
                <div class="dsa-box dsa-what"><b class="t">🔤 Le vocabulaire</b>Un angle est formé de deux <b>côtés</b> (des demi-droites) qui partent d'un même point : le <b>sommet</b>. On s'intéresse à son <b>ouverture</b>.</div>
                <div class="dsa-cards">${C('Un angle', voc, '', 'Sommet O, deux côtés.')}</div>
                <div class="dsa-box dsa-test"><b class="t">🔎 On compare avec l'angle droit de l'équerre</b> (en violet)</div>
                <div class="dsa-cards">
                    ${angleCard('Angle aigu', 45, '<b>Plus petit</b> qu\'un angle droit : il « rentre » dans l\'équerre.', true)}
                    ${angleCard('Angle droit', 90, 'Il a <b>exactement</b> l\'ouverture de l\'équerre : 90°.', true)}
                    ${angleCard('Angle obtus', 130, '<b>Plus grand</b> qu\'un angle droit : il « dépasse » de l\'équerre.', true)}
                    ${angleCard('Angle plat', 180, 'Ses deux côtés forment une droite : 180°, deux angles droits.')}
                </div>
                <div class="dsa-box dsa-trap"><b class="t">⚠️ Le piège</b>La grandeur d'un angle <b>ne dépend pas de la longueur de ses côtés</b>. Ces deux angles sont égaux :</div>
                <div class="dsa-cards">${C('Deux angles égaux', small, '', 'Même ouverture, côtés plus ou moins longs.')}</div>
                <div><button class="dsa-btn go" data-act="practice" data-v="angle" data-l="1">✏️ S'entraîner</button> <button class="dsa-btn alt" data-act="exp-mode" data-v="angle">✋ Manipuler</button></div>`;
        }
        function renderCercle() {
            const O = [100, 55], R = 42, at = a => add(O, dirv(a), R), lb = (a, n) => pt(at(a), n, { off: [dirv(a)[0] * 10, dirv(a)[1] * 10 + 3] });
            const big = `<circle cx="100" cy="55" r="${R}" fill="#f1edff" fill-opacity=".6" stroke="${INK}" stroke-width="2.4"/>`
                + line(O, at(30), RED, 2.6) + line(at(150), at(330), BLUE, 2.6) + line(at(240), at(305), '#e07b2a', 2.6)
                + pt(O, 'O', { off: [-2, 13] }) + lb(30, 'A') + lb(150, 'B') + lb(330, 'C') + lb(240, 'D') + lb(305, 'E');
            const comp = `<circle cx="100" cy="62" r="38" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 3"/>`
                + line([100, 62], [100, 14], '#9aa3b2', 3) + line([100, 14], [138, 62], '#9aa3b2', 3) + `<circle cx="100" cy="12" r="4" fill="#e0a94a"/>` + pt([100, 62], 'O', { off: [-10, 4] }) + `<circle cx="138" cy="62" r="2.6" fill="#FF4F5E"/>`;
            const disk = `<circle cx="55" cy="55" r="34" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="145" cy="55" r="34" fill="#7c3aed" fill-opacity=".35" stroke="${INK}" stroke-width="1.5"/>`
                + `<text x="55" y="104" text-anchor="middle" font-size="10" font-weight="900" fill="${INK}" font-family="Nunito,sans-serif">cercle</text><text x="145" y="104" text-anchor="middle" font-size="10" font-weight="900" fill="${INK}" font-family="Nunito,sans-serif">disque</text>`;
            return `<div class="dsa-ltitle"><h2 style="color:#7c3aed">⭕ Le cercle</h2></div>
                <div class="dsa-box dsa-what"><b class="t">🔤 Définition</b>Tous les points d'un cercle sont à la <b>même distance</b> d'un point : son <b>centre</b>.</div>
                <div class="dsa-cards">
                    <div class="dsa-card" style="grid-column:span 2">${svgWrap(200, 110, big)}<h5>Le cercle de centre O</h5>
                        <p><b>O</b> : le <b>centre</b> · <b style="color:#FF4F5E">[OA]</b> : un <b>rayon</b> (du centre à un point du cercle)<br>
                        <b style="color:#1f6fd1">[BC]</b> : un <b>diamètre</b> (il passe par le centre) · <b style="color:#e07b2a">[DE]</b> : une <b>corde</b> (elle relie deux points du cercle)</p></div>
                    ${C('Tracer au compas', comp, '', 'La pointe sur le centre, l\'écartement du compas est égal au <b>rayon</b>.')}
                    ${C('Cercle ou disque ?', disk, '', 'Le <b>cercle</b> est la ligne. Le <b>disque</b> est la surface à l\'intérieur.')}
                </div>
                <div class="dsa-box dsa-memo"><b class="t">🧠 Pour retenir</b><b>diamètre = 2 × rayon</b> · <b>rayon = diamètre ÷ 2</b>. Un cercle de rayon 3 cm a un diamètre de 6 cm.</div>
                <div class="dsa-box dsa-trap"><b class="t">⚠️ Attention</b>Le diamètre passe <b>toujours par le centre</b>. Une corde qui ne passe pas par le centre n'est pas un diamètre : elle est plus courte.</div>
                <div><button class="dsa-btn go" data-act="practice" data-v="cercle" data-l="2">✏️ S'entraîner</button> <button class="dsa-btn alt" data-act="exp-mode" data-v="cercle">✋ Manipuler</button></div>`;
        }
        function renderOutils() {
            return `<div class="dsa-ltitle"><h2 style="color:#D63384">🧰 Les instruments de géométrie</h2></div>
                <div class="dsa-cards">
                    <div class="dsa-card"><div style="font-size:46px">📏</div><h5>La règle</h5><p>Tracer des <b>droites</b> et des <b>segments</b>, <b>mesurer</b> une longueur, vérifier que des points sont <b>alignés</b>.</p></div>
                    <div class="dsa-card"><div style="font-size:46px">📐</div><h5>L'équerre</h5><p>Tracer et vérifier des <b>angles droits</b>, des droites <b>perpendiculaires</b> et <b>parallèles</b>.</p></div>
                    <div class="dsa-card"><div style="font-size:46px">🧭</div><h5>Le compas</h5><p>Tracer des <b>cercles</b>, <b>reporter</b> une longueur, comparer des longueurs.</p></div>
                </div>
                <div class="dsa-box dsa-test"><b class="t">🔎 Tracer la perpendiculaire à (d) passant par A</b></div>
                <div class="dsa-steps">
                    <div class="dsa-step"><span class="n">1</span><span>Je pose un côté de l'angle droit de l'équerre <b>le long de la droite (d)</b>.</span></div>
                    <div class="dsa-step"><span class="n">2</span><span>Je fais glisser l'équerre le long de (d) jusqu'à ce que l'autre côté de l'angle droit <b>touche le point A</b>.</span></div>
                    <div class="dsa-step"><span class="n">3</span><span>Je trace le long de ce côté, puis je <b>prolonge</b> avec la règle et je code l'angle droit.</span></div>
                </div>
                <div class="dsa-box dsa-test"><b class="t">🔎 Tracer un cercle de rayon 3 cm</b></div>
                <div class="dsa-steps">
                    <div class="dsa-step"><span class="n">1</span><span>J'écarte le compas de <b>3 cm</b> sur la règle (la pointe sur le 0, la mine sur le 3).</span></div>
                    <div class="dsa-step"><span class="n">2</span><span>Je pique la pointe sur le <b>centre</b>.</span></div>
                    <div class="dsa-step"><span class="n">3</span><span>Je tourne le compas en le tenant par le haut, <b>sans changer l'écartement</b>.</span></div>
                </div>
                <div class="dsa-box dsa-memo"><b class="t">🧠 Pour retenir</b>On ne se fie pas à ses yeux : on <b>vérifie toujours</b> avec les instruments.</div>
                <div><button class="dsa-btn go" data-act="practice" data-v="vraifaux" data-l="1">✏️ S'entraîner : vrai ou faux ?</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="dsa-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { lignes: renderLignes, paralleles: renderParalleles, perp: renderPerp, angles: renderAngles, cercle: renderCercle, outils: renderOutils }[S.lesson] || renderLignes;
            return `<div class="dsa-lesson"><div class="dsa-side">${side}</div><div class="dsa-main">${main()}</div></div>`;
        }

        // =================================================================
        // RENDU : MANIPULER (dessin + résultat, redessinés pendant le glisser)
        // =================================================================
        const HB = [6, 6, W - 6, H - 6];
        const bigHandles = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const handle = (X, id, col) => `<circle data-h="${id}" cx="${r1(X[0])}" cy="${r1(X[1])}" r="${bigHandles() ? 20 : 14}" fill="${col || '#FFC933'}" fill-opacity=".35" stroke="${col || '#e0a800'}" stroke-width="2"/>`;
        const cm = d => fmtNum(d / CM);
        function stageInner() {
            const E = S.exp;
            let g = '', res = '';
            if (E.mode === 'ligne') {
                const a = angOf(E.A, E.B), n = dirv(a + 90), lab = (X, nm) => pt(X, nm, { off: [n[0] * 18, n[1] * 18 + 5], fs: 16, s: 5, w: 2.4 });
                if (E.ltype === 'droite') g += fullLine(E.A, a, HB, BLUE, 3.4);
                else if (E.ltype === 'demi') g += rayLine(E.A, a, HB, BLUE, 3.4);
                else g += line(E.A, E.B, BLUE, 3.4);
                g += lab(E.A, 'A') + lab(E.B, 'B') + handle(E.A, 'A') + handle(E.B, 'B');
                const L = Math.hypot(E.B[0] - E.A[0], E.B[1] - E.A[1]);
                res = E.ltype === 'droite' ? `<span class="big">La droite (AB)</span><br>Elle passe par A et B et ne s'arrête jamais : on ne peut pas la mesurer.`
                    : E.ltype === 'demi' ? `<span class="big">La demi-droite [AB)</span><br>Elle commence en A, passe par B et ne s'arrête jamais de ce côté.`
                    : `<span class="big">Le segment [AB]</span><br>Il est limité par A et B. Sa longueur : <b>environ ${cm(L)} cm</b> (sur ce dessin).`;
            } else if (E.mode === 'deux') {
                const C1 = [200, 130], H1 = add(C1, dirv(E.a1), 120), H2 = add(E.P2, dirv(E.a2), 90);
                g += fullLine(C1, E.a1, HB, BLUE, 3) + fullLine(E.P2, E.a2, HB, VIO, 3);
                const la = lineAngle(E.a1, E.a2);
                if (la < .5) {
                    // Écart mesuré à deux endroits
                    const nrm = dirv(E.a1 + 90), dd = (E.P2[0] - C1[0]) * nrm[0] + (E.P2[1] - C1[1]) * nrm[1];
                    [-80, 80].forEach(t => { const Q = add(C1, dirv(E.a1), t), R = add(Q, nrm, dd); if (Q[0] > 10 && Q[0] < W - 10 && Q[1] > 10 && Q[1] < H - 10) g += line(Q, R, '#e07b2a', 2, ' stroke-dasharray="5 4"'); });
                    res = `<span class="big">(d₁) // (d₂) : elles sont parallèles</span><br>Elles ne se coupent jamais. L'écart entre elles (en orange) est toujours de <b>${cm(Math.abs(dd))} cm</b>.`;
                } else {
                    const d1 = dirv(E.a1), d2 = dirv(E.a2), den = d1[0] * d2[1] - d1[1] * d2[0];
                    const t = ((E.P2[0] - C1[0]) * d2[1] - (E.P2[1] - C1[1]) * d2[0]) / den, I = add(C1, d1, t);
                    const inside = I[0] > 6 && I[0] < W - 6 && I[1] > 6 && I[1] < H - 6;
                    if (Math.abs(la - 90) < .5) {
                        g += rightMark(I, E.a1, E.a2, 14) + pt(I, 'I', { off: [-14, -10], fs: 15, s: 5 });
                        res = `<span class="big">(d₁) ⊥ (d₂) : elles sont perpendiculaires</span><br>Elles se coupent en I en formant un <b>angle droit</b>.`;
                    } else if (inside) {
                        g += pt(I, 'I', { off: [-14, -10], fs: 15, s: 5 });
                        res = `<span class="big">Elles sont sécantes</span><br>Elles se coupent en I, mais l'angle n'est pas droit (environ ${Math.round(la)}°).`;
                    } else res = `<span class="big">Ni parallèles, ni perpendiculaires</span><br>Elles ne se coupent pas sur le dessin… mais elles se couperaient si on les <b>prolongeait</b> !`;
                }
                g += `<text x="${r1(H1[0] + 10)}" y="${r1(H1[1] - 12)}" font-size="15" font-weight="900" fill="${BLUE}" font-family="Nunito,sans-serif">(d₁)</text><text x="${r1(H2[0] + 10)}" y="${r1(H2[1] - 12)}" font-size="15" font-weight="900" fill="${VIO}" font-family="Nunito,sans-serif">(d₂)</text>`;
                g += handle(H1, 'H1', BLUE) + handle(E.P2, 'P2', VIO) + handle(H2, 'H2', VIO);
            } else if (E.mode === 'angle') {
                const O = [200, 140], m = between(E.angA, E.angB), K = kindOfAngle(m);
                // L'équerre se pose sur le côté A, son angle droit tourné du côté où s'ouvre l'angle
                if (E.equerre) { const leg = Math.sin((E.angB - E.angA) * RAD) >= 0 ? 90 : -90; g += `<polygon points="${P(O)} ${P(add(O, dirv(E.angA), 125))} ${P(add(O, dirv(E.angA + leg), 80))}" fill="#a78bfa" fill-opacity=".25" stroke="#7c3aed" stroke-width="1.6" stroke-dasharray="6 4"/>`; }
                g += arcMark(O, E.angA, E.angB, 34, K.col, K.col + '33');
                if (K.k === 'droit') g += rightMark(O, E.angA, E.angB, 22);
                g += line(O, add(O, dirv(E.angA), 120), INK, 3.4) + line(O, add(O, dirv(E.angB), 120), INK, 3.4) + pt(O, 'O', { off: [-16, 20], fs: 16, s: 5 });
                g += handle(add(O, dirv(E.angA), 120), 'RA') + handle(add(O, dirv(E.angB), 120), 'RB');
                res = `<span class="big" style="color:${K.col}">C'est ${K.lbl}</span><br>Il mesure environ <b>${Math.round(m)}°</b>${K.k === 'aigu' ? ' : plus petit qu\'un angle droit.' : K.k === 'obtus' ? ' : plus grand qu\'un angle droit, plus petit qu\'un angle plat.' : K.k === 'droit' ? ' : exactement l\'angle de l\'équerre.' : ' : ses côtés forment une droite.'}`;
            } else {
                const R = Math.hypot(E.M[0] - E.O[0], E.M[1] - E.O[1]), aM = angOf(E.O, E.M), M2 = add(E.O, dirv(aM + 180), R);
                g += `<circle cx="${r1(E.O[0])}" cy="${r1(E.O[1])}" r="${r1(R)}" fill="#f1edff" fill-opacity=".55" stroke="${INK}" stroke-width="3"/>`;
                if (E.diam) g += line(E.M, M2, BLUE, 3.4) + pt(M2, "M'", { off: [dirv(aM + 180)[0] * 20, dirv(aM + 180)[1] * 20 + 5], fs: 15, s: 5 });
                g += line(E.O, E.M, RED, 3.6) + pt(E.O, 'O', { off: [-14, 20], fs: 16, s: 5 }) + pt(E.M, 'M', { off: [dirv(aM)[0] * 20, dirv(aM)[1] * 20 + 5], fs: 15, s: 5 });
                g += handle(E.O, 'O', RED) + handle(E.M, 'M');
                res = `<span class="big">Cercle de centre O</span><br><b style="color:#FF4F5E">rayon [OM]</b> : environ <b>${cm(R)} cm</b>${E.diam ? ` · <b style="color:#1f6fd1">diamètre [MM']</b> : environ <b>${cm(2 * R)} cm</b> (2 × le rayon)` : ''}`;
            }
            return { g, res };
        }
        function renderExp() {
            const E = S.exp, X = stageInner();
            let opts = '';
            if (E.mode === 'ligne') opts = [['droite', 'Droite (AB)'], ['demi', 'Demi-droite [AB)'], ['segment', 'Segment [AB]']].map(([k, l]) => `<button class="dsa-chip ${E.ltype === k ? 'on' : ''}" style="--c:#1f6fd1" data-act="exp-lt" data-v="${k}">${l}</button>`).join('');
            if (E.mode === 'deux') opts = `<button class="dsa-chip" data-act="exp-snap" data-v="par">Rendre parallèles</button><button class="dsa-chip" data-act="exp-snap" data-v="perp">Rendre perpendiculaires</button>`;
            if (E.mode === 'angle') opts = `<button class="dsa-chip ${E.equerre ? 'on' : ''}" style="--c:#7c3aed" data-act="exp-eq">📐 Équerre ${E.equerre ? 'affichée' : 'cachée'}</button>` + [['aigu', 'Aigu'], ['droit', 'Droit'], ['obtus', 'Obtus'], ['plat', 'Plat']].map(([k, l]) => `<button class="dsa-chip" data-act="exp-ang" data-v="${k}">${l}</button>`).join('');
            if (E.mode === 'cercle') opts = `<button class="dsa-chip ${E.diam ? 'on' : ''}" style="--c:#1f6fd1" data-act="exp-diam">Diamètre ${E.diam ? 'affiché' : 'caché'}</button>`;
            return `<div class="dsa-play">
                <div class="dsa-srow" style="justify-content:center">${MODES.map(([k, l]) => `<button class="dsa-chip ${E.mode === k ? 'on' : ''}" style="--c:#D63384" data-act="exp-mode" data-v="${k}">${l}</button>`).join('')}</div>
                <div class="dsa-srow" style="justify-content:center">${opts}</div>
                <div class="dsa-stage"><svg class="dsa-svg" viewBox="0 0 ${W} ${H}">${X.g}</svg></div>
                <div class="dsa-res">${X.res}</div>
                <div class="dsa-hint" style="text-align:center">✋ Déplace les ronds jaunes ou colorés.</div>
            </div>`;
        }
        function redrawStage() {
            const svg = body.querySelector('.dsa-stage svg'), res = body.querySelector('.dsa-res');
            if (!svg) return;
            const X = stageInner();
            svg.innerHTML = X.g; if (res) res.innerHTML = X.res;
        }
        // Glisser les poignées (souris, stylet, doigt)
        let drag = null;
        const clampP = p => [Math.max(14, Math.min(W - 14, p[0])), Math.max(14, Math.min(H - 14, p[1]))];
        function toSvg(svg, e) { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m.inverse()); return clampP([q.x, q.y]); }
        function snapAngle(a, ref, targets) {
            // « aimante » la direction a vers ref + t (t parmi targets) si on est à moins de 4°
            for (const t of targets) for (const k of [0, 180]) { const want = ref + t + k; if (between(a, want) < 4) return ((want % 360) + 360) % 360; }
            return a;
        }
        function applyDrag(h, p) {
            const E = S.exp;
            if (h === 'A' || h === 'B') {
                const other = h === 'A' ? E.B : E.A;
                if (Math.hypot(p[0] - other[0], p[1] - other[1]) > 30) E[h] = p;
            } else if (h === 'H1') { E.a1 = snapAngle(angOf([200, 130], p), E.a2, [0, 90]); }
            else if (h === 'H2') { E.a2 = snapAngle(angOf(E.P2, p), E.a1, [0, 90]); }
            else if (h === 'P2') E.P2 = p;
            else if (h === 'RA') { E.angA = angOf([200, 140], p); }
            else if (h === 'RB') { let a = angOf([200, 140], p); for (const t of [90, -90, 180]) if (between(a, E.angA + t) < 4) a = ((E.angA + t) % 360 + 360) % 360; E.angB = a; }
            else if (h === 'O') { const dx = E.M[0] - E.O[0], dy = E.M[1] - E.O[1]; E.O = p; E.M = clampP([p[0] + dx, p[1] + dy]); }
            else if (h === 'M') { if (Math.hypot(p[0] - E.O[0], p[1] - E.O[1]) > 24) E.M = p; }
        }
        body.addEventListener('pointerdown', e => {
            const h = e.target.closest && e.target.closest('[data-h]');
            if (!h || !body.contains(h)) return;
            const svg = h.ownerSVGElement;
            drag = { h: h.dataset.h, svg, id: e.pointerId };
            try { svg.setPointerCapture(e.pointerId); } catch (err) {}
            e.preventDefault();
        });
        body.addEventListener('pointermove', e => {
            if (!drag || e.pointerId !== drag.id) return;
            const p = toSvg(drag.svg, e);
            if (!p) return;
            applyDrag(drag.h, p); redrawStage();
            e.preventDefault();
        });
        const endDrag = e => { if (!drag || (e && e.pointerId !== drag.id)) return; drag = null; saveSoon(); };
        body.addEventListener('pointerup', endDrag);
        body.addEventListener('pointercancel', endDrag);

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function genRun() {
            const ex = S.ex;
            S.run = { type: ex.type, lvl: ex.level, qs: genQuestions(ex.type, ex.level, ex.n), ans: [], corrected: false };
            return '';
        }
        const isRight = (R, i) => isRightQ(R.type, R.qs[i], R.ans[i]);
        const scoreOf = R => ({ ok: R.qs.filter((q, i) => isRight(R, i)).length, n: R.qs.length });

        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="dsa-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="dsa-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="dsa-settings">`;
            h += `<div class="dsa-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            h += `<div class="dsa-srow"><span class="l">2. Niveau</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}<span class="dsa-hint">${LEVELS[ex.level].hint}</span></div>`;
            h += `<div class="dsa-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="dsa-srow"><span class="l">Taille du texte</span><button class="dsa-btn alt small" data-act="font" data-d="-2">A−</button><button class="dsa-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="dsa-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="dsa-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="dsa-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function qcard(R, i, inner, title) {
            let cls = '', mk = '';
            if (R.corrected) { const ok = isRight(R, i); cls = ok ? 'ok' : 'ko'; mk = ok ? '✅' : '❌'; }
            return `<div class="dsa-q ${cls}"><div class="dsa-qtop"><span class="dsa-n">${i + 1})</span>${title}<span style="margin-left:auto">${mk}</span></div>${inner}</div>`;
        }
        const why = (R, i, html) => R.corrected && !isRight(R, i) ? `<div class="dsa-why">${html}</div>` : '';
        function optBtns(R, i, opts, good, show) {
            const a = R.ans[i];
            return `<div class="dsa-opts">${opts.map(o => {
                let c = a === o ? 'on' : '';
                if (R.corrected) c = o === good ? 'good' : (a === o ? 'bad' : '');
                return `<button class="dsa-opt ${c}"${R.corrected ? '' : ` data-act="pick" data-i="${i}" data-v="${esc(o)}"`}>${esc(show ? show(o) : o)}</button>`;
            }).join('')}</div>`;
        }
        const WHY_LINE = { 'une droite': 'Elle dépasse A et B des deux côtés : c\'est la droite (AB).', 'un segment': 'Elle s\'arrête en A et en B : c\'est le segment [AB].', 'une demi-droite': 'Elle s\'arrête d\'un seul côté : c\'est une demi-droite.' };
        function renderQuestions(R) {
            return `<div class="dsa-grid">` + R.qs.map((q, i) => {
                if (q.t === 'ligne') {
                    const h = `<div class="dsa-qfig">${drawLineQ(q)}</div>${optBtns(R, i, q.opts, q.ans)}` + why(R, i, `C'est <b>${esc(q.ans)}</b>. ${q.ask === 'nom' ? esc(WHY_LINE[q.ans] || '') : '( ) : droite · [ ) : demi-droite (le crochet est du côté où elle commence) · [ ] : segment.'}`);
                    return qcard(R, i, h, q.ask === 'nom' ? 'Cette ligne bleue est…' : 'Quelle est la bonne notation ?');
                }
                if (q.t === 'angle') {
                    const h = `<div class="dsa-qfig">${drawAngleQ(q)}</div>${optBtns(R, i, q.opts, q.ans, o => 'angle ' + o)}` + why(R, i, `C'est un angle <b>${esc(q.ans)}</b> (environ ${q.m}°). Compare avec l'angle droit de l'équerre.`);
                    return qcard(R, i, h, 'Cet angle est…');
                }
                if (q.t === 'deux') {
                    const h = `<div class="dsa-qfig">${drawTwoLines(q, R.lvl === 1)}</div>${optBtns(R, i, q.opts, q.ans)}`
                        + why(R, i, q.ans === 'parallèles' ? 'Elles restent toujours à la même distance : elles sont <b>parallèles</b>.' : q.ans === 'perpendiculaires' ? 'Elles se coupent en formant un <b>angle droit</b> : vérifie avec l\'équerre.' : q.near ? 'Prolonge-les : elles finiraient par se couper. Elles ne sont <b>pas parallèles</b>.' : 'Elles se coupent, mais sans angle droit : elles sont seulement <b>sécantes</b>.');
                    return qcard(R, i, h, 'Les droites (d₁) et (d₂) sont…');
                }
                if (q.t === 'cercle') {
                    const h = `<div class="dsa-qfig">${drawCircleQ(q)}</div>${optBtns(R, i, q.opts, q.ans)}` + why(R, i, `C'est <b>${esc(q.ans)}</b>.`);
                    return qcard(R, i, h, q.el === 'centre' ? 'Le point rouge O est…' : 'Le segment rouge est…');
                }
                if (q.t === 'calc') {
                    const a = R.ans[i] || '', mk = R.corrected ? (isRight(R, i) ? ' ok' : ' ko') : '';
                    const h = `<div class="dsa-stmt">Un cercle a un <b>${q.toD ? 'rayon' : 'diamètre'}</b> de <b>${fmtNum(q.v)} cm</b>.<br>Quel est son <b>${q.toD ? 'diamètre' : 'rayon'}</b> ?</div>
                        <div style="text-align:center"><input class="dsa-ans${mk}" data-in="ans" data-i="${i}" value="${esc(a)}" inputmode="decimal" autocomplete="off"${R.corrected ? ' disabled' : ''} placeholder="…" style="max-width:150px"> <b>cm</b></div>`
                        + why(R, i, `${q.toD ? `Diamètre = 2 × rayon = 2 × ${fmtNum(q.v)}` : `Rayon = diamètre ÷ 2 = ${fmtNum(q.v)} ÷ 2`} = <b>${fmtNum(q.ans)} cm</b>.`);
                    return qcard(R, i, h, 'Rayon et diamètre');
                }
                const s = VF[q.lvl][q.j];
                const h = `<div class="dsa-stmt">${esc(s[0])}</div>${optBtns(R, i, ['V', 'F'], s[1], o => o === 'V' ? '✔ Vrai' : '✘ Faux')}` + (R.corrected ? `<div class="dsa-why">${s[1] === 'V' ? 'Vrai' : 'Faux'} : ${esc(s[2])}</div>` : '');
                return qcard(R, i, h, 'Vrai ou faux ?');
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="dsa-topbar"><span class="dsa-pill">${EXT[R.type].label} · ${R.qs.length} questions</span>
                ${sc ? `<span class="dsa-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="dsa-actions">
                <button class="dsa-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="dsa-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="dsa-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="dsa-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="dsa-info">Choisis l'exercice et le niveau, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.dsa-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : S.tab === 'exp' ? renderExp() : renderLesson();
            body.scrollTop = top;
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'dsa-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run, ex = S.ex, E = S.exp;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '📐 Droites, angles et cercle', { onExpand: render });
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
                // Manipuler
                case 'exp-mode': E.mode = el.dataset.v; S.tab = 'exp'; sfx('pop'); break;
                case 'exp-lt': E.ltype = el.dataset.v; sfx('pop'); break;
                case 'exp-eq': E.equerre = !E.equerre; break;
                case 'exp-diam': E.diam = !E.diam; break;
                case 'exp-snap': E.a2 = el.dataset.v === 'par' ? E.a1 : E.a1 + 90; if (el.dataset.v === 'par' && lineAngle(E.a1, angOf([200, 130], E.P2)) < 5) E.P2 = add([200, 130], dirv(E.a1 + 90), 50); sfx('pop'); break;
                case 'exp-ang': { const m = { aigu: 45, droit: 90, obtus: 130, plat: 180 }[el.dataset.v]; E.angB = (E.angA + m) % 360; sfx('pop'); break; }
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
            if (e.target.closest('.dsa-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.dsa-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        container.addEventListener('input', e => {
            const t = e.target, R = S.run;
            if (R && t.dataset.in === 'ans') { R.ans[+t.dataset.i] = t.value; saveSoon(); }
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
        widget._dsaGetData = function () {
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
    window._dsaEngine = { genQuestions, isRightQ, VF, twoLinesTruth, kindOfAngle, between, lineAngle, angOf, dirv, tRange };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createDroitesAnglesWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
