// =========================================================================
// LEÇON « LES NOMBRES DÉCIMAUX » — Le Bureau du Prof
// Leçons + explorateur (tableau de numération, bande unité, quadrillage,
// droite graduée) + exercices corrigés. Même cadre que « Les grands nombres ».
//
// 📖 Leçons : les dixièmes (bande unité découpée en 10), les centièmes et les
//    millièmes, de la fraction décimale au nombre à virgule, le tableau de
//    numération et la lecture, comparer, ranger / encadrer / intercaler.
// 🔍 Explorer : un nombre décimal dans le tableau, lu de deux façons, dessiné
//    (unités, dixièmes, centièmes), placé sur la droite graduée avec un zoom,
//    et écrit de 5 façons ; on touche une colonne pour voir le chiffre et le
//    nombre de dixièmes, de centièmes…
// ✏️ Exercices : 🔁 fractions décimales, 📋 dans le tableau, 🧩 décomposer,
//    📏 droite graduée, ⚖️ comparer, 📈 ranger, 🎯 intercaler.
//
// Ouverture : createWidget('nombres-decimaux')  ou  createNombresDecimauxWidget()
// Sauvegarde : w._dcGetData()  /  createNombresDecimauxWidget(données)
//   (branché dans save-load.js : champ dcData, comme ndData pour les grands nombres)
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
    if (!document.getElementById('nombres-decimaux-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'nombres-decimaux-cursors-style';
        _cs.textContent = [
            '.widget[data-type="nombres-decimaux"] .deci-header :not(button):not(button *):not(select):not(input) { cursor: inherit !important; }',
            '.widget[data-type="nombres-decimaux"] .drag-handle, .widget[data-type="nombres-decimaux"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="nombres-decimaux"] .drag-handle:active, .widget[data-type="nombres-decimaux"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            '.widget[data-type="nombres-decimaux"] .deci-container.wf-fullboard .deci-header, .widget[data-type="nombres-decimaux"] .deci-container.wf-fullboard .deci-header:active,',
            '.widget.phone-fs[data-type="nombres-decimaux"] .deci-header, .widget.phone-fs[data-type="nombres-decimaux"] .deci-header:active { cursor: default !important; }',
            '.widget[data-type="nombres-decimaux"] button:not(:disabled), .widget[data-type="nombres-decimaux"] button:not(:disabled) *, .widget[data-type="nombres-decimaux"] select,',
            '.widget[data-type="nombres-decimaux"] .widget-menu-handle, .widget[data-type="nombres-decimaux"] .widget-pin-handle,',
            '.widget[data-type="nombres-decimaux"] .widget-back-handle, .widget[data-type="nombres-decimaux"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="nombres-decimaux"] button:disabled, .widget[data-type="nombres-decimaux"] button:disabled * { cursor: default !important; }',
            '.widget[data-type="nombres-decimaux"]:has(.deci-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    'use strict';

    const TYPE = 'nombres-decimaux';

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


    // ── CSS (préfixe deci-) ─────────────────────────────────────────────────
    if (!document.getElementById('deci-style')) {
        const s = document.createElement('style');
        s.id = 'deci-style';
        s.textContent = `
.widget[data-type="nombres-decimaux"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.deci-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --ce:#e07b2a; --c1:#0891b2; --c2:#7c3aed; --c3:#D63384;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.deci-container input { user-select:text; -webkit-user-select:text; }
.deci-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:600px), (max-height:500px) and (pointer:coarse) {
    .deci-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .deci-tab-lbl { display:none; }
    .deci-title { font-size:17px !important; }
    .deci-lesson { flex-direction:column; }
    .deci-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .deci-gbtn { flex:1 1 auto; text-align:center !important; }
    .deci-srow > .l { min-width:0 !important; width:100%; }
}
.deci-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.deci-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.deci-tabs { display:flex; gap:6px; margin-left:12px; }
.deci-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.deci-tab:hover { background:rgba(255,255,255,.1); }
.deci-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.deci-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.deci-icon-btn:hover { background:rgba(255,255,255,.28); }
.deci-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Couleurs : partie entière, virgule, dixièmes, centièmes, millièmes */
.deci-ce { color:var(--ce); } .deci-k1 { color:var(--c1); } .deci-k2 { color:var(--c2); } .deci-k3 { color:var(--c3); }
.deci-virg { color:var(--rouge); font-weight:900; }
.deci-num { font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; white-space:nowrap; letter-spacing:.02em; }
.deci-words { font-weight:800; line-height:1.5; }
.deci-frac { display:inline-flex; flex-direction:column; align-items:stretch; text-align:center; vertical-align:middle; line-height:1.05; margin:0 3px;
    font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; }
.deci-frac > span { padding:0 4px; }
.deci-frac > span:first-child { padding-bottom:.06em; }
/* Dénominateur : un peu d'espace sous la barre de fraction */
.deci-frac > span + span { border-top:2.5px solid currentColor; padding-top:.16em; }

/* ── Tableau de numération ── */
.deci-twrap { overflow-x:auto; display:flex; justify-content:center; padding:2px; }
.deci-table { --cw:54px; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.deci-table th, .deci-table td { text-align:center; padding:0; }
.deci-table .kh { color:#fff; font-weight:900; font-size:calc(var(--cw) * .27); padding:5px 6px; letter-spacing:.3px; white-space:nowrap; }
.deci-table .kh.ke { background:var(--ce); } .deci-table .kh.kd { background:linear-gradient(90deg,var(--c1),var(--c2),var(--c3)); }
.deci-table .ch { font-weight:900; font-size:calc(var(--cw) * .3); padding:3px 2px; width:var(--cw); }
.deci-table .ch.kd { font-size:calc(var(--cw) * .2); width:calc(var(--cw) * 1.3); }
.deci-table .ch.ke, .deci-table td.ke { background:#fdf0e5; color:var(--ce); }
.deci-table .ch.k1, .deci-table td.k1 { background:#e6f7fb; color:var(--c1); }
.deci-table .ch.k2, .deci-table td.k2 { background:#f3edff; color:var(--c2); }
.deci-table .ch.k3, .deci-table td.k3 { background:#fdeaf3; color:var(--c3); }
.deci-table td { height:calc(var(--cw) * 1.15); font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .78); font-weight:700; color:var(--encre) !important;
    border-top:2px solid rgba(0,0,0,.06); }
.deci-table .vh, .deci-table .virg { width:calc(var(--cw) * .32); background:#fff; }
/* La virgule : même police, même taille et même alignement que les chiffres, pour être posée sur leur ligne */
.deci-table td.virg { color:var(--rouge) !important; font-size:calc(var(--cw) * .78); vertical-align:middle; line-height:normal; }
.deci-table .dim { opacity:.3; }
.deci-table .hlc { box-shadow:inset 0 0 0 4px #ff4f5e; background:#ffe9eb !important; }
.deci-table td.click:hover { filter:brightness(.95); }
.deci-table td.ed { padding:3px; }
.deci-table td input { width:100%; height:100%; box-sizing:border-box; border:2px dashed #c7bca6; border-radius:8px; background:#fff; text-align:center;
    font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .7); font-weight:700; color:#3949AB; outline:none; padding:0; }
.deci-table td input:focus { border:3px solid var(--violet); background:#f3efff; }
.deci-table td input.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.deci-table td input.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.deci-table.small { --cw:40px; }

/* ── Dessins (bande unité, quadrillage, droite graduée) ── */
.deci-fig { display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:flex-end; }
.deci-fig figure { margin:0; display:flex; flex-direction:column; align-items:center; gap:4px; }
.deci-fig figcaption { font-weight:800; font-size:15px; text-align:center; }
.deci-svg { display:block; max-width:100%; height:auto; }
.deci-line { width:100%; max-width:680px; margin:0 auto; }

/* ── Leçons ── */
.deci-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.deci-side { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.deci-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.deci-gbtn:hover { transform:translateX(2px); }
.deci-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.deci-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.deci-ltitle h2 { margin:0; font-size:32px; font-weight:900; }
.deci-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.55; }
.deci-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.deci-box ul, .deci-box ol { margin:4px 0 0; padding-left:22px; }
.deci-what { background:#f1edff; border:2px solid #c8bbf5; }
.deci-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.deci-memo { background:#fff6d6; border:2px solid #f3d36b; }
.deci-trap { background:#ffecee; border:2px solid #f6a7b0; }
.deci-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.deci-big { font-size:22px; }
.deci-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.deci-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.deci-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.deci-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.deci-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.deci-btn:disabled { opacity:.45; }
.deci-steps { display:flex; flex-direction:column; gap:6px; }
.deci-step { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:6px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.deci-step > span:last-child { flex:1; min-width:0; }
.deci-step .n { background:var(--encre); color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:900; flex-shrink:0; }
.deci-ftable { border-collapse:collapse; margin:4px auto 0; font-size:20px; }
.deci-ftable td { padding:4px 14px; border-bottom:1px dashed #e3d8c3; text-align:center; }
.deci-ftable td.w { font-size:14px; font-weight:800; color:#6a6380; text-align:left; }

/* ── Explorer ── */
.deci-ex { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.deci-bar { display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
.deci-in { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:26px; font-weight:700; padding:4px 12px; width:220px; max-width:100%; box-sizing:border-box;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; text-align:center; }
.deci-in:focus { border-color:var(--violet); }
.deci-panel { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 14px; }
.deci-panel h4 { margin:0 0 6px; font-size:15px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.deci-read { font-size:22px; text-align:center; }
.deci-dec { display:flex; flex-direction:column; gap:4px; font-size:21px; }
.deci-dec .row { display:flex; flex-direction:column; gap:0; padding:3px 0; border-bottom:1px dashed #eee4d2; }
.deci-dec .row:last-child { border-bottom:none; }
.deci-dec .lbl { font-size:12px; font-weight:900; color:#9a8f7a; text-transform:uppercase; }
.deci-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:8px 14px; font-weight:700; text-align:center; font-size:17px; }
.deci-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.deci-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.deci-hint { font-size:12.5px; color:#6a6380; }

/* ── Exercices ── */
.deci-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.deci-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.deci-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.deci-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.deci-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.deci-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.deci-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.deci-pill.score { background:var(--vert); font-size:16px; }
.deci-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.deci-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 400px)),1fr)); }
.deci-grid.one { grid-template-columns:1fr; }
.deci-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .3); min-width:0; }
.deci-q.ok { border-color:var(--vert); background:#f3fcf7; }
.deci-q.ko { border-color:var(--rouge); background:#fff5f6; }
.deci-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.deci-n { font-weight:900; color:#9a8f7a; }
.deci-qmain { text-align:center; font-size:var(--f); line-height:1.5; }
.deci-qwords { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
.deci-ans { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .9); font-weight:700; padding:2px 10px; width:100%; max-width:260px; box-sizing:border-box;
    border:2px dashed #b9abef; border-radius:12px; outline:none; color:#3949AB; background:#fff; text-align:center; align-self:center; }
.deci-ans.mini { width:auto; max-width:none; font-size:calc(var(--f) * .72); padding:0 6px; border-radius:8px; vertical-align:baseline; }
/* Case à remplir dans une fraction (numérateur) ou entre deux nombres : largeur adaptée */
.deci-ans.mini { width:calc(var(--f) * 3.6); }
.deci-frac .deci-ans.mini { width:calc(var(--f) * 2.4); margin-bottom:.1em; }
.deci-ans:focus { border:3px solid var(--violet); background:#f3efff; }
.deci-ans.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.deci-ans.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.deci-cmp { display:flex; align-items:center; justify-content:center; gap:calc(var(--f) * .4); flex-wrap:wrap; font-size:var(--f); }
.deci-sign { border:2px solid #d9cdb6; background:#fff; border-radius:12px; min-width:calc(var(--f) * 1.5); padding:0 8px; font:inherit; font-weight:900; font-size:calc(var(--f) * .8);
    color:var(--encre); touch-action:manipulation; line-height:1.4; }
.deci-sign.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.deci-sign.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.deci-sign.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.deci-pool, .deci-order { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; align-items:center; min-height:calc(var(--f) * 1.5); }
.deci-order { background:#faf6ee; border:2px dashed #d9cdb6; border-radius:12px; padding:4px 8px; }
.deci-rk { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:0 12px; font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700;
    font-size:calc(var(--f) * .8); color:var(--encre); touch-action:manipulation; line-height:1.4; }
.deci-rk.used { opacity:.25; }
.deci-rk.in { border-color:var(--violet); background:#f3efff; }
.deci-lt { font-weight:900; font-size:calc(var(--f) * .7); color:#9a8f7a; }
.deci-why { font-size:14px; color:#5a5470; text-align:center; line-height:1.45; }
.deci-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:deci-fall 1.6s ease-in forwards; }
@keyframes deci-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.deci-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.deci-help.show { display:block; }
.deci-help h4 { margin:0 0 6px; font-size:15px; }
.deci-help p { margin:0 0 6px; }
.deci-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.deci-container:hover .deci-resize { opacity:1; }
.deci-container.wf-fullboard .deci-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="nombres-decimaux"], .deci-container, .deci-container * { cursor:default !important; }
.deci-container .deci-header { cursor:grab !important; }
.deci-container .deci-header:active { cursor:grabbing !important; }
.deci-container button, .deci-container [data-act] { cursor:pointer !important; }
.deci-container button:disabled { cursor:default !important; }
.deci-container input { cursor:text !important; }
.deci-container .deci-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // OUTILS : nombres décimaux
    // Un nombre décimal = { m, p } : m = valeur en millièmes (entier, donc
    // aucun arrondi), p = nombre de chiffres affichés après la virgule (0 à 3).
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const SP = ' ';
    const P10 = [1, 10, 100, 1000];

    const intOf = x => Math.floor(x.m / 1000);
    const decDigits = x => String(x.m % 1000).padStart(3, '0').slice(0, x.p);
    const fmtInt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, SP);
    const fmtD = x => fmtInt(intOf(x)) + (x.p ? ',' + decDigits(x) : '');
    // Plus petit nombre de décimales pour écrire une valeur
    const minP = m => m % 1000 === 0 ? 0 : m % 100 === 0 ? 1 : m % 10 === 0 ? 2 : 3;
    const fromM = m => ({ m, p: minP(m) });
    const numer = x => Math.round(x.m / P10[3 - x.p]);           // 3,47 → 347
    const fracPart = x => +decDigits(x) || 0;                       // 3,47 → 47
    // Chiffre à la position q : 2 = centaines … 0 = unités, -1 = dixièmes, -2, -3
    function digitAt(x, q) {
        if (q >= 0) { const n = intOf(x); if (q > 0 && n < P10[q]) return null; return Math.floor(n / P10[q]) % 10; }
        const k = -q; if (k > x.p) return null;
        return +String(x.m % 1000).padStart(3, '0')[k - 1];
    }
    // Lecture d'une saisie : « 3,45 », « 3.45 », « 3,450 » (zéros inutiles acceptés)
    function parseD(str) {
        let s = String(str == null ? '' : str).replace(/[\s  ]/g, '').replace(/\./g, ',');
        if (!/^\d*(,\d*)?$/.test(s) || !/\d/.test(s)) return null;
        let parts = s.split(','), a = parts[0], b = (parts[1] || '').replace(/0+$/, '');
        if (b.length > 3) return null;
        const n = +(a || '0');
        if (n > 999999) return null;
        return { m: n * 1000 + +(b.padEnd(3, '0')), p: b.length };
    }

    const COLN = { 2: 'centaines', 1: 'dizaines', 0: 'unités', '-1': 'dixièmes', '-2': 'centièmes', '-3': 'millièmes' };
    const COLS = { 2: 'centaine', 1: 'dizaine', 0: 'unité', '-1': 'dixième', '-2': 'centième', '-3': 'millième' };
    const colName = (q, n) => (n === 1 ? COLS : COLN)[q];
    const DEN_NAME = ['', 'dixième', 'centième', 'millième'];
    const colCls = q => q >= 0 ? 'ke' : 'k' + (-q);

    // ── Mots-nombres (orthographe : traits d'union partout) ──
    const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const TEENS = { 10: 'dix', 11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze', 16: 'seize' };
    const TENS = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
    function two(n, last) {
        if (n <= 0) return [];
        if (n < 10) return [UNITS[n]];
        if (TEENS[n]) return [TEENS[n]];
        if (n < 20) return ['dix', UNITS[n - 10]];
        const t = Math.floor(n / 10), u = n % 10;
        if (t === 7) return u === 1 ? ['soixante', 'et', 'onze'] : ['soixante'].concat(two(10 + u, last));
        if (t === 8) return u === 0 ? ['quatre', last ? 'vingts' : 'vingt'] : ['quatre', 'vingt'].concat(two(u, last));
        if (t === 9) return ['quatre', 'vingt'].concat(two(10 + u, last));
        if (u === 0) return [TENS[t]];
        if (u === 1) return [TENS[t], 'et', 'un'];
        return [TENS[t]].concat(two(u, last));
    }
    function three(n, last) {
        const h = Math.floor(n / 100), r = n % 100, out = [];
        if (h === 1) out.push('cent');
        else if (h > 1) out.push(UNITS[h], r === 0 && last ? 'cents' : 'cent');
        return out.concat(two(r, last));
    }
    function wordsInt(n) {
        n = Math.floor(n);
        if (n === 0) return 'zéro';
        const th = Math.floor(n / 1000), r = n % 1000, parts = [];
        if (th) parts.push(th === 1 ? 'mille' : three(th, false).join('-') + '-mille');
        if (r) parts.push(three(r, true).join('-'));
        return parts.join('-');
    }
    // « trois virgule zéro cinq »
    function readVirgule(x) {
        if (!x.p) return wordsInt(intOf(x));
        const d = decDigits(x), z = d.match(/^0*/)[0].length, rest = d.slice(z);
        const w = Array(z).fill('zéro');
        if (rest) w.push(wordsInt(+rest));
        return wordsInt(intOf(x)) + ' virgule ' + w.join(' ');
    }
    // « trois unités et cinq centièmes »
    function readUnits(x) {
        const n = intOf(x), f = fracPart(x), out = [];
        // « unité » est féminin : une unité, vingt-et-une unités
        if (n) out.push(wordsInt(n).replace(/(^|-)un$/, '$1une') + ' unité' + (n > 1 ? 's' : ''));
        if (x.p && f) out.push(wordsInt(f) + ' ' + DEN_NAME[x.p] + (f > 1 ? 's' : ''));
        return out.length ? out.join(' et ') : 'zéro';
    }

    // ── Affichage ──
    function numHtml(x) {
        const d = decDigits(x);
        return `<span class="deci-num"><span class="deci-ce">${fmtInt(intOf(x))}</span>${x.p ? '<span class="deci-virg">,</span>' + d.split('').map((c, i) => `<span class="deci-k${i + 1}">${c}</span>`).join('') : ''}</span>`;
    }
    const fracHtml = (n, d, cls) => `<span class="deci-frac${cls ? ' ' + cls : ''}"><span>${n}</span><span>${d}</span></span>`;
    const decTerm = k => '0,' + '0'.repeat(k - 1);   // 0,0… devant le chiffre

    // Écritures d'un nombre : additive, fractions, mots
    function decAdd(x) {
        const out = [], n = intOf(x);
        if (n) out.push(`<span class="deci-ce">${fmtInt(n)}</span>`);
        for (let k = 1; k <= x.p; k++) { const d = digitAt(x, -k); if (d) out.push(`<span class="deci-k${k}">${decTerm(k)}${d}</span>`); }
        return out.join(' + ') || '0';
    }
    function decFracs(x) {
        const out = [], n = intOf(x);
        if (n) out.push(`<span class="deci-ce">${fmtInt(n)}</span>`);
        for (let k = 1; k <= x.p; k++) { const d = digitAt(x, -k); if (d) out.push(fracHtml(d, P10[k], 'deci-k' + k)); }
        return out.join(' + ') || '0';
    }
    function decNames(x) {
        const out = [], n = intOf(x);
        if (n) out.push(`<span class="deci-ce">${fmtInt(n)} unité${n > 1 ? 's' : ''}</span>`);
        for (let k = 1; k <= x.p; k++) { const d = digitAt(x, -k); if (d) out.push(`<span class="deci-k${k}">${d} ${colName(-k, d)}</span>`); }
        return out.join(' + ') || 'zéro';
    }
    const decMix = x => (intOf(x) ? `<span class="deci-ce">${fmtInt(intOf(x))}</span> + ` : '') + fracHtml(fracPart(x), P10[x.p]);

    // ── Nombres au hasard selon le niveau ──
    // 1 : dixièmes (0 à 20) · 2 : centièmes (0 à 99) · 3 : millièmes (0 à 999)
    function genDec(lvl, o) {
        o = o || {};
        const p = o.p != null ? o.p : (lvl === 1 ? 1 : lvl === 2 ? (Math.random() < .25 ? 1 : 2) : (Math.random() < .3 ? rnd(1, 2) : 3));
        const intMax = o.intMax != null ? o.intMax : (lvl === 1 ? 20 : lvl === 2 ? 99 : 999);
        const n = o.int != null ? o.int : (Math.random() < .18 ? 0 : rnd(1, intMax));
        let d = '';
        for (let i = 0; i < p; i++) d += (i === p - 1) ? rnd(1, 9) : (Math.random() < .25 ? 0 : rnd(1, 9));
        return { m: n * 1000 + +(d.padEnd(3, '0')), p };
    }
    const intMaxOf = lvl => lvl === 1 ? 20 : lvl === 2 ? 99 : 999;

    // =====================================================================
    // DESSINS (SVG)
    // =====================================================================
    const COL = { e: '#e07b2a', 1: '#0891b2', 2: '#7c3aed', 3: '#D63384', ink: '#2A1F4A' };
    // Bande unité découpée en 10 : « filled » parts coloriées
    function bandSvg(filled, opts) {
        opts = opts || {};
        const W = opts.w || 460, H = 54, pw = W / 10, color = opts.color || COL[1];
        let r = `<svg class="deci-svg" viewBox="-14 -2 ${W + 28} ${H + (opts.ticks ? 26 : 4)}" width="${W + 28}">`;
        for (let i = 0; i < 10; i++) r += `<rect x="${i * pw}" y="0" width="${pw}" height="${H}" fill="${i < filled ? color : '#fff'}" fill-opacity="${i < filled ? .85 : 1}" stroke="${COL.ink}" stroke-width="1.5"/>`;
        r += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${COL.ink}" stroke-width="3" rx="2"/>`;
        if (opts.ticks) for (let i = 0; i <= 10; i++) r += `<text x="${i * pw}" y="${H + 20}" text-anchor="middle" font-size="13" font-weight="800" fill="#6a6380">${i === 0 ? '0' : i === 10 ? '1' : ''}</text>`;
        return r + '</svg>';
    }
    // Quadrillage 10 × 10 = 1 unité : « tenths » colonnes pleines, puis « hundredths » carreaux
    function gridSvg(tenths, hundredths, opts) {
        opts = opts || {};
        const c = opts.cell || 16, W = c * 10, full = opts.full;
        let r = `<svg class="deci-svg" viewBox="-2 -2 ${W + 4} ${W + 4}" width="${W + 4}">`;
        for (let col = 0; col < 10; col++) for (let row = 0; row < 10; row++) {
            let f = '#fff';
            if (full) f = COL.e;
            else if (col < tenths) f = COL[1];
            else if (col === tenths && row < hundredths) f = COL[2];
            r += `<rect x="${col * c}" y="${row * c}" width="${c}" height="${c}" fill="${f}" fill-opacity="${f === '#fff' ? 1 : .85}" stroke="#b8aecb" stroke-width=".8"/>`;
        }
        for (let col = 1; col < 10; col++) r += `<line x1="${col * c}" y1="0" x2="${col * c}" y2="${W}" stroke="${COL.ink}" stroke-width="1.2"/>`;
        r += `<rect x="0" y="0" width="${W}" height="${W}" fill="none" stroke="${COL.ink}" stroke-width="3" rx="2"/>`;
        return r + '</svg>';
    }
    // Droite graduée : de start, « ticks » graduations de « step » millièmes
    //   o.points : [{ m, label, color, ask }] ; o.hi : [i, j] segment surligné
    function lineSvg(o) {
        const W = 640, X0 = 30, X1 = W - 30, N = o.ticks || 10, Y = 52;
        const xOf = m => X0 + (m - o.start) / (o.step * N) * (X1 - X0);
        let r = `<svg class="deci-svg deci-line" viewBox="0 0 ${W} 92">`;
        if (o.hi) r += `<rect x="${xOf(o.start + o.hi[0] * o.step)}" y="${Y - 9}" width="${xOf(o.start + o.hi[1] * o.step) - xOf(o.start + o.hi[0] * o.step)}" height="18" fill="#FFC933" fill-opacity=".55" rx="3"/>`;
        r += `<line x1="${X0 - 18}" y1="${Y}" x2="${X1 + 18}" y2="${Y}" stroke="${COL.ink}" stroke-width="3"/>`;
        r += `<polygon points="${X1 + 24},${Y} ${X1 + 14},${Y - 6} ${X1 + 14},${Y + 6}" fill="${COL.ink}"/>`;
        for (let i = 0; i <= N; i++) {
            const x = X0 + i * (X1 - X0) / N, big = i === 0 || i === N || (N === 10 && i === 5);
            r += `<line x1="${x}" y1="${Y - (big ? 13 : 8)}" x2="${x}" y2="${Y + (big ? 13 : 8)}" stroke="${COL.ink}" stroke-width="${big ? 3 : 1.8}"/>`;
        }
        (o.labels || []).forEach(([i, t]) => {
            const x = X0 + i * (X1 - X0) / N;
            r += `<text x="${x}" y="${Y + 34}" text-anchor="middle" font-size="18" font-weight="900" fill="${COL.ink}" font-family="Nunito,sans-serif">${esc(t)}</text>`;
        });
        (o.points || []).forEach(pt => {
            const x = xOf(pt.m), col = pt.color || '#FF4F5E';
            r += `<path d="M${x} ${Y - 6} L${x - 8} ${Y - 22} L${x + 8} ${Y - 22} Z" fill="${col}"/>`;
            if (pt.label) r += `<text x="${x}" y="${Y - 28}" text-anchor="middle" font-size="17" font-weight="900" fill="${col}" font-family="Nunito,sans-serif">${esc(pt.label)}</text>`;
        });
        return r + '</svg>';
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
    // TABLEAU DE NUMÉRATION
    //   opts.IC / opts.DC : colonnes de la partie entière / décimale
    //   opts.hlP : colonne surlignée ; opts.click : colonnes cliquables
    //   opts.edit : { q, vals, marks, lock } cases à remplir
    // =====================================================================
    function tableHtml(x, opts) {
        opts = opts || {};
        const IC = Math.max(opts.IC || 1, x ? String(intOf(x)).length : 1), DC = opts.DC || 3;
        const pos = [];
        for (let q = IC - 1; q >= 0; q--) pos.push(q);
        pos.push('v');
        for (let k = 1; k <= DC; k++) pos.push(-k);
        let r1 = `<tr><th class="kh ke" colspan="${IC}">Partie entière</th><th class="vh"></th><th class="kh kd" colspan="${DC}">Partie décimale</th></tr>`;
        let r2 = '<tr>', r3 = '<tr>';
        pos.forEach(q => {
            if (q === 'v') { r2 += '<th class="vh"></th>'; r3 += '<td class="virg">,</td>'; return; }
            const cc = colCls(q), dec = q < 0;
            r2 += `<th class="ch ${cc}${dec ? ' kd' : ''}" title="${colName(q)}">${dec ? colName(q) : ['u', 'd', 'c'][q]}</th>`;
            if (opts.edit) {
                const v = opts.edit.vals[q] || '';
                const mk = opts.edit.marks ? (opts.edit.marks[q] || '') : '';
                r3 += `<td class="${cc} ed"><input class="deci-cell ${mk}" data-q="${opts.edit.q}" data-p="${q}" maxlength="1" inputmode="numeric" autocomplete="off" value="${esc(v)}"${opts.edit.lock ? ' disabled' : ''}></td>`;
            } else {
                const d = digitAt(x, q);
                const hl = opts.hlP === q ? ' hlc' : '';
                const dim = d === null ? ' dim' : '';
                r3 += `<td class="${cc}${hl}${dim}${opts.click ? ' click' : ''}"${opts.click ? ` data-act="col" data-p="${q}"` : ''}>${d === null ? '' : d}</td>`;
            }
        });
        return `<div class="deci-twrap"><table class="deci-table${opts.small ? ' small' : ''}"><thead>${r1}${r2}</tr></thead><tbody>${r3}</tr></tbody></table></div>`;
    }

    // =====================================================================
    // LEÇONS, EXERCICES, NIVEAUX
    // =====================================================================
    const LESSONS = [
        { id: 'dixiemes',  label: '📏 Les dixièmes',            color: '#0891b2' },
        { id: 'centiemes', label: '🟪 Centièmes, millièmes',     color: '#7c3aed' },
        { id: 'fractions', label: '🔁 Fraction → virgule',       color: '#e07b2a' },
        { id: 'tableau',   label: '📋 Le tableau, la lecture',   color: '#059669' },
        { id: 'comparer',  label: '⚖️ Comparer',                 color: '#D63384' },
        { id: 'ranger',    label: '📈 Ranger, intercaler',       color: '#6C4FD8' }
    ];
    const EXT = {
        fraction:   { label: '🔁 Fractions décimales', color: '#0891b2' },
        tableau:    { label: '📋 Dans le tableau',     color: '#e07b2a' },
        decomp:     { label: '🧩 Décomposer',          color: '#7c3aed' },
        droite:     { label: '📏 Droite graduée',      color: '#059669' },
        comparer:   { label: '⚖️ Comparer',            color: '#D63384' },
        ranger:     { label: '📈 Ranger',              color: '#6C4FD8' },
        intercaler: { label: '🎯 Intercaler',          color: '#EB5757' }
    };
    const LEVELS = {
        1: { label: '😊 Dixièmes',  color: '#2FBF71', hint: '1 chiffre après la virgule' },
        2: { label: '😐 Centièmes', color: '#F2994A', hint: 'jusqu\'à 2 chiffres après la virgule' },
        3: { label: '😤 Millièmes', color: '#EB5757', hint: 'jusqu\'à 3 chiffres après la virgule' }
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'dixiemes',
            exp: { s: '3,47', q: null, dlvl: 2 },
            ex: { type: 'fraction', level: 1, n: 8 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // EXERCICES : génération (fonctions pures, testables)
    // =====================================================================
    function genFraction(lvl) {
        const x = genDec(lvl, { intMax: lvl === 1 ? 9 : lvl === 2 ? 20 : 30 });
        return { x, mode: Math.random() < .5 ? 'f2d' : 'd2f' };
    }
    function genTableau(lvl) {
        const x = genDec(lvl);
        const from = pick(lvl === 1 ? ['n', 'w', 'f'] : ['n', 'w', 'f', 'v']);
        return { x, from, IC: lvl === 3 ? 3 : 2, DC: lvl === 1 ? 2 : 3 };
    }
    function genDecomp(lvl) {
        const forms = lvl === 1 ? ['names', 'add', 'frac'] : ['names', 'add', 'frac', 'mix', 'regroup'];
        let form = pick(forms);
        let x = genDec(lvl, { intMax: lvl === 1 ? 20 : 99 });
        if (form === 'regroup') {
            x = genDec(lvl, { intMax: 9, p: lvl === 2 ? 2 : rnd(2, 3), int: rnd(1, 9) });
            if (x.p === 3 && Math.random() < .5) x = genDec(lvl, { intMax: 9, p: 2, int: rnd(1, 9) });
        }
        const n = intOf(x);
        const terms = [];
        if (form === 'names') {
            if (n) terms.push(`<span class="deci-ce">${n} unité${n > 1 ? 's' : ''}</span>`);
            for (let k = 1; k <= x.p; k++) { const d = digitAt(x, -k); if (d) terms.push(`<span class="deci-k${k}">${d} ${colName(-k, d)}</span>`); }
            const t = lvl >= 2 && Math.random() < .4 ? shuffle(terms) : terms;
            return { x, form, html: t.length > 1 ? t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1] : t[0] };
        }
        if (form === 'add' || form === 'frac') {
            if (n) terms.push(`<span class="deci-ce">${n}</span>`);
            for (let k = 1; k <= x.p; k++) {
                const d = digitAt(x, -k);
                if (d) terms.push(form === 'add' ? `<span class="deci-k${k}">${decTerm(k)}${d}</span>` : fracHtml(d, P10[k], 'deci-k' + k));
            }
            const t = lvl >= 2 && Math.random() < .35 ? shuffle(terms) : terms;
            return { x, form, html: t.join(' + ') };
        }
        if (form === 'mix') return { x, form, html: decMix(x) };
        // regroup : 34 dixièmes et 7 centièmes = 3,47
        if (x.p === 2) return { x, form, html: `<span class="deci-k1">${Math.floor(x.m / 100)} dixièmes</span> et <span class="deci-k2">${digitAt(x, -2)} centième${digitAt(x, -2) > 1 ? 's' : ''}</span>` };
        return { x, form, html: `<span class="deci-k2">${Math.floor(x.m / 10)} centièmes</span> et <span class="deci-k3">${digitAt(x, -3)} millième${digitAt(x, -3) > 1 ? 's' : ''}</span>` };
    }
    function genDroite(lvl) {
        const n = rnd(0, 15), k = rnd(1, 9);
        let start, step;
        if (lvl === 1) { start = n * 1000; step = 100; }
        else if (lvl === 2) { start = n * 1000 + rnd(0, 9) * 100; step = 10; }
        else { start = n * 1000 + rnd(0, 99) * 10; step = 1; }
        return { start, step, k, ans: start + k * step };
    }
    function genCmp(lvl) {
        for (let t = 0; t < 50; t++) {
            const r = Math.random();
            let a, b;
            if (lvl >= 2 && r < .15) {
                a = genDec(lvl, { p: rnd(1, lvl === 2 ? 1 : 2) });
                b = { m: a.m, p: a.p + 1 };                          // 3,5 et 3,50
            } else if (r < .35) {
                a = genDec(lvl); b = genDec(lvl);
                if (intOf(a) === intOf(b)) continue;
            } else {
                const n = rnd(0, intMaxOf(lvl));
                if (lvl === 1) { a = genDec(1, { int: n }); b = genDec(1, { int: n }); }
                else {
                    // Piège : le nombre le plus long n'est pas le plus grand (3,7 et 3,45)
                    const d1 = rnd(2, 9);
                    a = { m: n * 1000 + d1 * 100, p: 1 };
                    const pb = lvl === 2 ? 2 : rnd(2, 3);
                    b = genDec(lvl, { int: n, p: pb });
                    // On garde les centièmes (et millièmes) tirés, le dernier chiffre n'est jamais 0
                    b = { m: n * 1000 + rnd(0, d1 - 1) * 100 + (b.m % 100), p: pb };
                }
                if (a.m === b.m) continue;
            }
            return Math.random() < .5 ? { a, b } : { a: b, b: a };
        }
        return { a: { m: 3700, p: 1 }, b: { m: 3450, p: 2 } };
    }
    function genRanger(lvl) {
        const k = lvl === 1 ? 4 : 5, base = rnd(lvl === 1 ? 1 : 1, lvl === 1 ? 15 : 30);
        const vals = [], seen = new Set();
        for (let t = 0; vals.length < k && t < 200; t++) {
            const p = lvl === 1 ? 1 : rnd(1, lvl);
            const n = Math.random() < (lvl === 1 ? .35 : .2) ? base + pick([-1, 1]) : base;
            const x = genDec(lvl, { int: n, p });
            if (seen.has(x.m)) continue;
            seen.add(x.m); vals.push(x);
        }
        return { vals: shuffle(vals), dir: lvl === 1 && Math.random() < .6 ? 'asc' : pick(['asc', 'desc']) };
    }
    function genIntercaler(lvl) {
        const n = rnd(0, 20);
        let a, b;
        if (lvl === 1) {
            if (Math.random() < .5) { a = { m: n * 1000, p: 0 }; b = { m: (n + 1) * 1000, p: 0 }; }
            else { const d = rnd(1, 6); a = { m: n * 1000 + d * 100, p: 1 }; b = { m: a.m + rnd(2, 3) * 100, p: 1 }; }
        } else if (lvl === 2) {
            const d = rnd(1, 8); a = { m: n * 1000 + d * 100, p: 1 }; b = { m: a.m + 100, p: 1 };
        } else {
            const d = rnd(1, 9) * 10 + rnd(1, 8); a = { m: n * 1000 + d * 10, p: 2 }; b = { m: a.m + 10, p: 2 };
        }
        return { a, b };
    }
    function genQuestion(type, lvl) {
        switch (type) {
            case 'fraction':   return genFraction(lvl);
            case 'tableau':    return genTableau(lvl);
            case 'decomp':     return genDecomp(lvl);
            case 'droite':     return genDroite(lvl);
            case 'comparer':   return genCmp(lvl);
            case 'ranger':     return genRanger(lvl);
            default:           return genIntercaler(lvl);
        }
    }
    const signOf = (a, b) => a.m < b.m ? '<' : a.m > b.m ? '>' : '=';
    // Cases attendues dans le tableau : { q: [réponses acceptées] }
    function tableExpected(q) {
        const out = {}, x = q.x;
        for (let p = q.IC - 1; p >= 0; p--) { const d = digitAt(x, p); out[p] = d === null ? [''] : [String(d)]; }
        for (let k = 1; k <= q.DC; k++) { const d = digitAt(x, -k); out[-k] = d === null ? ['', '0'] : [String(d)]; }
        return out;
    }
    function isRightQ(type, q, a) {
        if (type === 'fraction') {
            if (q.mode === 'f2d') { const v = parseD(a); return !!v && v.m === q.x.m; }
            const s = String(a || '').replace(/\s/g, '');
            return /^\d+$/.test(s) && +s === numer(q.x);
        }
        if (type === 'tableau') {
            const E = tableExpected(q), v = a || {};
            return Object.keys(E).every(p => E[p].indexOf(v[p] || '') !== -1);
        }
        if (type === 'decomp') { const v = parseD(a); return !!v && v.m === q.x.m; }
        if (type === 'droite') { const v = parseD(a); return !!v && v.m === q.ans; }
        if (type === 'comparer') return a === signOf(q.a, q.b);
        if (type === 'ranger') {
            if (!Array.isArray(a) || a.length !== q.vals.length) return false;
            for (let i = 1; i < a.length; i++) {
                const u = q.vals[a[i - 1]].m, w = q.vals[a[i]].m;
                if (q.dir === 'asc' ? u >= w : u <= w) return false;
            }
            return true;
        }
        const v = parseD(a);
        return !!v && v.m > q.a.m && v.m < q.b.m;
    }
    const sortedVals = q => q.vals.slice().sort((u, w) => q.dir === 'asc' ? u.m - w.m : w.m - u.m);

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createNombresDecimauxWidget = function (saved) {
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
        container.className = 'deci-container';
        container.innerHTML = `
            <div class="deci-header">
                <span class="deci-title">🔟 Les nombres décimaux</span>
                <div class="deci-tabs">
                    <button class="deci-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="deci-tab-lbl">Leçons</span></button>
                    <button class="deci-tab" data-act="tab" data-tab="exp"><span>🔍</span><span class="deci-tab-lbl">Explorer</span></button>
                    <button class="deci-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="deci-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="deci-icon-btn" data-act="sound" title="Son"></button>
                    <button class="deci-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="deci-body"></div>
            <div class="deci-help">
                <h4>💡 Comment utiliser cette leçon ?</h4>
                <p><b>📖 Leçons</b> — Les dixièmes avec la bande unité découpée en 10, les centièmes et les millièmes avec le quadrillage, le passage de la fraction décimale au nombre à virgule, le tableau de numération et la lecture, comparer, ranger, encadrer et intercaler.</p>
                <p><b>🔍 Explorer</b> — Écris un nombre décimal (ou 🎲) : il se place dans le tableau, il est lu de deux façons, dessiné, placé sur la droite graduée (avec un zoom) et écrit de 5 façons. Touche une colonne du tableau pour connaître le chiffre et le nombre de dixièmes, de centièmes…</p>
                <p><b>✏️ Exercices</b> — Fractions décimales, placer dans le tableau, décomposer, lire sur la droite graduée, comparer, ranger, intercaler. Puis <b>👁 Correction</b> avec le score.</p>
                <p><b>Couleurs</b> : <span style="color:#e07b2a;font-weight:900">partie entière</span>, <span style="color:#FF4F5E;font-weight:900">virgule</span>, <span style="color:#0891b2;font-weight:900">dixièmes</span>, <span style="color:#7c3aed;font-weight:900">centièmes</span>, <span style="color:#D63384;font-weight:900">millièmes</span>.</p>
                <p>Les réponses peuvent s'écrire avec une virgule ou un point (3,45 ou 3.45). Un zéro inutile à la fin est accepté (3,50 = 3,5).</p>
            </div>
            <div class="deci-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.deci-body');
        const help = container.querySelector('.deci-help');
        const resizeHandle = container.querySelector('.deci-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        if (!EXT[S.ex.type]) S.ex.type = 'fraction';
        if (S.run && !EXT[S.run.type]) S.run = null;
        let msg = '', expMsg = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };
        const D = s => parseD(s);

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function renderDixiemes() {
            return `<div class="deci-ltitle"><h2 style="color:#0891b2">📏 Les dixièmes</h2></div>
                <div class="deci-box deci-what"><b class="t">🔤 Partager l'unité en 10</b>On prend une bande qui vaut <b>1 unité</b> et on la partage en <b>10 parts égales</b>.
                    Chaque part est <b class="deci-k1">un dixième</b> de l'unité. On l'écrit ${fracHtml(1, 10, 'deci-k1')} ou <b class="deci-num">0<span class="deci-virg">,</span><span class="deci-k1">1</span></b>.</div>
                <div class="deci-fig"><figure>${bandSvg(3, { ticks: true })}<figcaption>3 parts sur 10 : <span class="deci-k1">3 dixièmes</span> = ${fracHtml(3, 10, 'deci-k1')} = ${numHtml({ m: 300, p: 1 })}</figcaption></figure></div>
                <div class="deci-box deci-test"><b class="t">🔎 Plus d'une unité</b>Une bande entière et 4 dixièmes d'une autre bande :</div>
                <div class="deci-fig">
                    <figure>${bandSvg(10, { w: 300, color: COL.e })}<figcaption class="deci-ce">1 unité</figcaption></figure>
                    <figure>${bandSvg(4, { w: 300 })}<figcaption class="deci-k1">4 dixièmes</figcaption></figure>
                </div>
                <div class="deci-box deci-tool deci-big" style="text-align:center">1 unité et 4 dixièmes = ${fracHtml(14, 10)} = ${numHtml({ m: 1400, p: 1 })}</div>
                <div class="deci-box deci-memo"><b class="t">🧠 Pour retenir</b><b>10 dixièmes = 1 unité</b>. Le chiffre juste après la virgule est le <b class="deci-k1">chiffre des dixièmes</b>.<br>
                    Un dixième est <b>10 fois plus petit</b> que l'unité.</div>
                <div class="deci-box deci-trap"><b class="t">⚠️ Attention</b>${numHtml({ m: 300, p: 1 })} n'est pas 3 ! C'est 3 dixièmes : <b>moins d'une unité</b>. Il faut 10 dixièmes pour faire une unité.</div>
                <div><button class="deci-btn go" data-act="practice" data-v="fraction" data-l="1">✏️ S'entraîner : fractions décimales</button> <button class="deci-btn alt" data-act="exp-n" data-v="1,4">🔍 Explorer 1,4</button></div>`;
        }
        function renderCentiemes() {
            return `<div class="deci-ltitle"><h2 style="color:#7c3aed">🟪 Les centièmes et les millièmes</h2></div>
                <div class="deci-box deci-what"><b class="t">🔤 Partager encore en 10</b>On partage <b>chaque dixième en 10</b> : l'unité est alors partagée en <b>100 parts égales</b>.
                    Chaque petit carreau est <b class="deci-k2">un centième</b> : ${fracHtml(1, 100, 'deci-k2')} = <b class="deci-num">0<span class="deci-virg">,</span><span class="deci-k1">0</span><span class="deci-k2">1</span></b>.</div>
                <div class="deci-fig">
                    <figure>${gridSvg(0, 0)}<figcaption>1 unité = 100 centièmes</figcaption></figure>
                    <figure>${gridSvg(2, 7)}<figcaption><span class="deci-k1">2 dixièmes</span> et <span class="deci-k2">7 centièmes</span><br>= ${fracHtml(27, 100)} = ${numHtml({ m: 270, p: 2 })}</figcaption></figure>
                </div>
                <div class="deci-box deci-memo"><b class="t">🧠 Pour retenir</b><b>10 centièmes = 1 dixième</b> · <b>100 centièmes = 1 unité</b>.<br>
                    En partageant un centième en 10, on obtient <b class="deci-k3">un millième</b> : ${fracHtml(1, 1000, 'deci-k3')} = <b class="deci-num">0<span class="deci-virg">,</span><span class="deci-k1">0</span><span class="deci-k2">0</span><span class="deci-k3">1</span></b>. 10 millièmes = 1 centième.</div>
                <div class="deci-box deci-test"><b class="t">🔎 Même quantité, deux écritures</b>5 colonnes de 10 carreaux : c'est 5 dixièmes, ou 50 centièmes.</div>
                <div class="deci-fig">
                    <figure>${gridSvg(5, 0)}<figcaption>${numHtml({ m: 500, p: 1 })} = ${numHtml({ m: 500, p: 2 })}</figcaption></figure>
                    <figure>${gridSvg(0, 5)}<figcaption>${numHtml({ m: 50, p: 2 })} : seulement 5 centièmes !</figcaption></figure>
                </div>
                <div class="deci-box deci-trap"><b class="t">⚠️ Attention</b>${numHtml({ m: 500, p: 1 })} = ${numHtml({ m: 500, p: 2 })} (le zéro à la fin ne change rien), mais ${numHtml({ m: 50, p: 2 })} est <b>10 fois plus petit</b> : le zéro est juste après la virgule.</div>
                <div><button class="deci-btn go" data-act="practice" data-v="decomp" data-l="2">✏️ S'entraîner : décomposer</button> <button class="deci-btn alt" data-act="exp-n" data-v="0,27">🔍 Explorer 0,27</button></div>`;
        }
        function renderFractions() {
            const ex = [[7, 10], [23, 10], [5, 100], [125, 100], [3, 1000], [2045, 1000]];
            const row = ([n, d]) => { const p = String(d).length - 1, x = { m: n * P10[3 - p], p }; return `<tr><td>${fracHtml(n, d)}</td><td>=</td><td>${numHtml(x)}</td><td class="w">${esc(readUnits(x))}</td></tr>`; };
            return `<div class="deci-ltitle"><h2 style="color:#e07b2a">🔁 De la fraction décimale au nombre à virgule</h2></div>
                <div class="deci-box deci-what"><b class="t">🔤 Une fraction décimale</b>C'est une fraction dont le dénominateur est <b>10, 100, 1 000…</b> Elle s'écrit aussi avec une virgule.</div>
                <div class="deci-box deci-tool deci-big" style="text-align:center">${fracHtml(347, 100)} = ${fracHtml(300, 100)} + ${fracHtml(47, 100)} = <span class="deci-ce">3</span> + ${fracHtml(47, 100)} = ${numHtml({ m: 3470, p: 2 })}</div>
                <div class="deci-steps">
                    <div class="deci-step"><span class="n">1</span><span>Je lis la fraction : ${fracHtml(347, 100)}, c'est <b>347 centièmes</b>.</span></div>
                    <div class="deci-step"><span class="n">2</span><span>Le dernier chiffre (<b class="deci-k2">7</b>) est donc le chiffre des <b class="deci-k2">centièmes</b>.</span></div>
                    <div class="deci-step"><span class="n">3</span><span>100 a <b>2 zéros</b> → il y a <b>2 chiffres après la virgule</b> : ${numHtml({ m: 3470, p: 2 })}.</span></div>
                </div>
                <table class="deci-ftable">${ex.map(row).join('')}</table>
                <div class="deci-box deci-memo"><b class="t">🧠 Pour retenir</b>Il y a <b>autant de chiffres après la virgule que de zéros au dénominateur</b> : ${fracHtml('…', 10)} → 1 chiffre, ${fracHtml('…', 100)} → 2 chiffres, ${fracHtml('…', 1000)} → 3 chiffres.</div>
                <div class="deci-box deci-trap"><b class="t">⚠️ Le piège</b>${fracHtml(5, 100)} ne s'écrit pas 0,5 ! Il faut 2 chiffres après la virgule : ${numHtml({ m: 50, p: 2 })}. Je complète avec un <b>0</b>.</div>
                <div><button class="deci-btn go" data-act="practice" data-v="fraction">✏️ S'entraîner : fractions décimales</button></div>`;
        }
        function renderTableau() {
            const x = { m: 305470, p: 2 }, y = { m: 2030, p: 2 };
            return `<div class="deci-ltitle"><h2 style="color:#059669">📋 Le tableau de numération et la lecture</h2></div>
                <div class="deci-box deci-what"><b class="t">🔤 Deux parties</b>La <b>virgule</b> sépare la <b class="deci-ce">partie entière</b> (les unités, dizaines, centaines…) de la <b>partie décimale</b> (<span class="deci-k1">dixièmes</span>, <span class="deci-k2">centièmes</span>, <span class="deci-k3">millièmes</span>).</div>
                ${tableHtml(x, { IC: 3, DC: 3 })}
                <div class="deci-box deci-tool"><b class="t">🔤 Lire ${numHtml(x)} de deux façons</b>
                    <ul><li><b>${esc(readVirgule(x))}</b></li><li><b>${esc(readUnits(x))}</b></li></ul></div>
                <div class="deci-box deci-memo"><b class="t">🧠 Pour retenir</b>Comme pour les entiers, chaque colonne vaut <b>10 fois plus</b> que la colonne à sa droite : 10 millièmes = 1 centième, 10 centièmes = 1 dixième, 10 dixièmes = 1 unité.<br>
                    Le premier chiffre après la virgule est celui des <b class="deci-k1">dixièmes</b> (et non des dizaines !).</div>
                <div class="deci-box deci-trap"><b class="t">⚠️ Les zéros</b>${numHtml({ m: 2300, p: 2 })} = ${numHtml({ m: 2300, p: 1 })} : un zéro <b>à la fin</b> de la partie décimale ne change rien.
                    Mais ${numHtml(y)} n'est pas égal à ${numHtml({ m: 2300, p: 1 })} : ici le 0 est le chiffre des dixièmes, il faut le garder.</div>
                <div><button class="deci-btn go" data-act="practice" data-v="tableau">✏️ S'entraîner : le tableau</button> <button class="deci-btn alt" data-act="exp-n" data-v="305,47">🔍 Explorer 305,47</button></div>`;
        }
        function renderComparer() {
            const a = { m: 3700, p: 1 }, b = { m: 3450, p: 2 };
            return `<div class="deci-ltitle"><h2 style="color:#D63384">⚖️ Comparer deux nombres décimaux</h2></div>
                <div class="deci-steps">
                    <div class="deci-step"><span class="n">1</span><span>Je compare d'abord les <b class="deci-ce">parties entières</b>. ${numHtml({ m: 12500, p: 1 })} > ${numHtml({ m: 9870, p: 2 })} car 12 > 9.</span></div>
                    <div class="deci-step"><span class="n">2</span><span>Si elles sont égales, je compare les <b class="deci-k1">dixièmes</b>.</span></div>
                    <div class="deci-step"><span class="n">3</span><span>Si les dixièmes sont égaux, je compare les <b class="deci-k2">centièmes</b>, puis les <b class="deci-k3">millièmes</b>…</span></div>
                </div>
                <div class="deci-box deci-tool deci-big" style="text-align:center">Comparer ${numHtml(a)} et ${numHtml(b)} : même partie entière (3), puis <b class="deci-k1">7 dixièmes</b> > <b class="deci-k1">4 dixièmes</b><br>donc ${numHtml(a)} > ${numHtml(b)}</div>
                ${lineSvg({ start: 3000, step: 100, labels: [[0, '3'], [5, '3,5'], [10, '4']], points: [{ m: a.m, label: '3,7', color: '#D63384' }, { m: b.m, label: '3,45', color: '#7c3aed' }] })}
                <div class="deci-box deci-trap"><b class="t">⚠️ Le grand piège</b>Le nombre qui a le plus de chiffres n'est <b>pas forcément le plus grand</b> ! 3,45 a plus de chiffres, mais 3,7 est plus grand.
                    Astuce : j'écris le même nombre de chiffres après la virgule : <b>3,70</b> et <b>3,45</b>. 70 centièmes > 45 centièmes.</div>
                <div class="deci-box deci-memo"><b class="t">🧠 Pour retenir</b>Sur une droite graduée, le plus grand nombre est le plus <b>à droite</b>.</div>
                <div><button class="deci-btn go" data-act="practice" data-v="comparer">✏️ S'entraîner : comparer</button></div>`;
        }
        function renderRanger() {
            return `<div class="deci-ltitle"><h2 style="color:#6C4FD8">📈 Ranger, encadrer, intercaler</h2></div>
                <div class="deci-box deci-what"><b class="t">🔤 Ranger</b>Ranger dans l'ordre <b>croissant</b>, c'est du plus petit au plus grand (avec &lt;). Dans l'ordre <b>décroissant</b>, du plus grand au plus petit (avec &gt;).<br>
                    <span class="deci-big">${numHtml({ m: 3050, p: 2 })} &lt; ${numHtml({ m: 3400, p: 1 })} &lt; ${numHtml({ m: 3450, p: 2 })} &lt; ${numHtml({ m: 3500, p: 1 })}</span></div>
                <div class="deci-box deci-test"><b class="t">🔎 Encadrer 3,47</b>
                    <ul><li>à l'unité : <b>3 &lt; 3,47 &lt; 4</b></li><li>au dixième : <b>3,4 &lt; 3,47 &lt; 3,5</b></li></ul></div>
                <div class="deci-box deci-what"><b class="t">🔍 Intercaler : zoomer sur la droite</b>Entre <b>3,4</b> et <b>3,5</b>, il n'y a pas d'autre dixième… mais si je partage ce petit morceau en 10, je trouve des <b class="deci-k2">centièmes</b> : 3,41 ; 3,42 ; … ; 3,49.</div>
                ${lineSvg({ start: 3000, step: 100, labels: [[0, '3'], [4, '3,4'], [5, '3,5'], [10, '4']], hi: [4, 5] })}
                ${lineSvg({ start: 3400, step: 10, labels: [[0, '3,4'], [5, '3,45'], [10, '3,5']], points: [{ m: 3470, label: '3,47', color: '#7c3aed' }] })}
                <div class="deci-box deci-memo"><b class="t">🧠 Pour retenir</b>Entre deux nombres décimaux, on peut <b>toujours</b> trouver un autre nombre décimal : il suffit d'ajouter un chiffre de plus après la virgule.</div>
                <div><button class="deci-btn go" data-act="practice" data-v="ranger">✏️ Ranger</button> <button class="deci-btn go" data-act="practice" data-v="intercaler" data-l="2">✏️ Intercaler</button> <button class="deci-btn alt" data-act="practice" data-v="droite">📏 Droite graduée</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="deci-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { dixiemes: renderDixiemes, centiemes: renderCentiemes, fractions: renderFractions, tableau: renderTableau, comparer: renderComparer, ranger: renderRanger }[S.lesson] || renderDixiemes;
            return `<div class="deci-lesson"><div class="deci-side">${side}</div><div class="deci-main">${main()}</div></div>`;
        }

        // =================================================================
        // RENDU : EXPLORER
        // =================================================================
        function renderExp() {
            const E = S.exp, x = D(E.s) || { m: 3470, p: 2 }, n = intOf(x);
            let h = `<div class="deci-ex">`;
            h += `<div class="deci-bar">
                <input class="deci-in" value="${esc(fmtD(x))}" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="Ex. : 3,47">
                <button class="deci-btn small" data-act="exp-set">✔ Placer</button>
                <button class="deci-btn alt small" data-act="exp-rnd" title="Un nombre au hasard">🎲</button>
                ${[1, 2, 3].map(l => `<button class="deci-chip ${E.dlvl === l ? 'on' : ''}" style="--c:${LEVELS[l].color}" data-act="exp-lvl" data-v="${l}">${LEVELS[l].label}</button>`).join('')}
            </div>`;
            if (expMsg) h += `<div class="deci-msg">⚠️ ${esc(expMsg)}</div>`;
            h += tableHtml(x, { IC: 2, DC: 3, hlP: E.q, click: true });
            h += `<div class="deci-panel"><h4>🔤 Se lit ${canSpeak ? `<button class="deci-btn alt small" data-act="say">🔊 Écouter</button>` : ''}</h4>
                <div class="deci-read deci-words">${esc(readVirgule(x))}</div>
                <div class="deci-read deci-words" style="font-size:18px;color:#5a5470">ou : ${esc(readUnits(x))}</div></div>`;
            if (E.q !== null && E.q !== undefined && digitAt(x, E.q) !== null) {
                const d = digitAt(x, E.q), cnt = Math.floor(x.m / P10[3 + Math.min(E.q, 0)] / (E.q > 0 ? P10[E.q] : 1));
                h += `<div class="deci-info">🎯 Le <b>chiffre des ${colName(E.q)}</b> est <b style="color:#FF4F5E">${d}</b>. Le <b>nombre de ${colName(E.q)}</b> est <b class="deci-num" style="color:#FF4F5E">${fmtInt(cnt)}</b>
                    ${E.q < 0 ? `<br><span style="font-size:14px">car ${esc(fmtD(x))} = ${fmtInt(cnt)} ${colName(E.q, cnt)}${x.m - cnt * P10[3 + E.q] ? ' et un reste plus petit' : ''}.</span>` : ''}</div>`;
            } else h += `<div class="deci-hint" style="text-align:center">👆 Touche une colonne du tableau pour connaître le chiffre et le nombre de dixièmes, de centièmes…</div>`;
            // Dessin
            const t = digitAt(x, -1) || 0, c = digitAt(x, -2) || 0, mi = digitAt(x, -3) || 0;
            let fig = '';
            const shown = Math.min(n, 3);
            for (let i = 0; i < shown; i++) fig += `<figure>${gridSvg(0, 0, { full: true, cell: 11 })}<figcaption class="deci-ce">1 unité</figcaption></figure>`;
            if (n > 3) fig += `<figure><div style="font-size:26px;font-weight:900;color:#e07b2a;padding:40px 6px">+ ${fmtInt(n - 3)} unités</div></figure>`;
            if (x.m % 1000) fig += `<figure>${gridSvg(t, c, { cell: 11 })}<figcaption>${t ? `<span class="deci-k1">${t} dixième${t > 1 ? 's' : ''}</span>` : ''}${t && c ? ' et ' : ''}${c ? `<span class="deci-k2">${c} centième${c > 1 ? 's' : ''}</span>` : ''}</figcaption></figure>`;
            h += `<div class="deci-panel"><h4>🖼️ Voir la quantité</h4><div class="deci-fig">${fig || '<div class="deci-hint">0 : rien à dessiner.</div>'}</div>
                ${mi ? `<div class="deci-hint" style="text-align:center;margin-top:4px">+ <b class="deci-k3">${mi} millième${mi > 1 ? 's' : ''}</b> : trop petits pour être dessinés (il faudrait couper un carreau en 10).</div>` : ''}</div>`;
            // Droite graduée + zoom
            let lines = lineSvg({ start: n * 1000, step: 100, labels: [[0, fmtInt(n)], [10, fmtInt(n + 1)]], points: [{ m: x.m, label: fmtD(x) }], hi: x.p >= 2 ? [t, t + 1] : null });
            if (x.p >= 2) {
                const st = n * 1000 + t * 100;
                lines += `<div class="deci-hint" style="text-align:center">🔍 Zoom sur le morceau entre ${esc(fmtD(fromM(st)))} et ${esc(fmtD(fromM(st + 100)))} :</div>`;
                lines += lineSvg({ start: st, step: 10, labels: [[0, fmtD({ m: st, p: 1 })], [10, fmtD(fromM(st + 100))]], points: [{ m: x.m, label: fmtD(x), color: '#7c3aed' }] });
            }
            h += `<div class="deci-panel"><h4>📏 Sur la droite graduée</h4>${lines}</div>`;
            if (x.m > 0) h += `<div class="deci-panel deci-dec"><h4>🧩 Écritures de ${numHtml(x)}</h4>
                ${x.p ? `<div class="row"><span class="lbl">Fraction décimale</span><span>${numHtml(x)} = ${fracHtml(numer(x), P10[x.p])}</span></div>
                <div class="row"><span class="lbl">Partie entière + fraction</span><span>${numHtml(x)} = ${decMix(x)}</span></div>` : ''}
                <div class="row"><span class="lbl">Avec les valeurs</span><span class="deci-num">${numHtml(x)} = ${decAdd(x)}</span></div>
                <div class="row"><span class="lbl">Avec des fractions</span><span>${numHtml(x)} = ${decFracs(x)}</span></div>
                <div class="row"><span class="lbl">Avec les mots</span><span style="font-weight:800">${decNames(x)}</span></div></div>`;
            return h + `</div>`;
        }
        function setExp(raw) {
            const x = parseD(raw);
            if (!x) { expMsg = 'Écris un nombre décimal, par exemple 3,47 (3 chiffres au plus après la virgule).'; return false; }
            if (intOf(x) > 99) { expMsg = 'Pour bien voir les dessins, la partie entière va jusqu\'à 99.'; return false; }
            expMsg = ''; S.exp.s = fmtD(x).replace(/ /g, '');
            if (S.exp.q !== null && digitAt(x, S.exp.q) === null) S.exp.q = null;
            return true;
        }

        // =================================================================
        // EXERCICES
        // =================================================================
        function genRun() {
            const ex = S.ex, qs = [];
            for (let i = 0; i < ex.n; i++) qs.push(genQuestion(ex.type, ex.level));
            S.run = { type: ex.type, qs, ans: [], corrected: false };
            return '';
        }
        const isRight = (R, i) => isRightQ(R.type, R.qs[i], R.ans[i]);
        const scoreOf = R => ({ ok: R.qs.filter((q, i) => isRight(R, i)).length, n: R.qs.length });

        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="deci-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="deci-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="deci-settings">`;
            h += `<div class="deci-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            h += `<div class="deci-srow"><span class="l">2. Nombres</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}<span class="deci-hint">${LEVELS[ex.level].hint}</span></div>`;
            h += `<div class="deci-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="deci-srow"><span class="l">Taille du texte</span><button class="deci-btn alt small" data-act="font" data-d="-2">A−</button><button class="deci-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="deci-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="deci-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="deci-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function card(R, i, inner, title) {
            let cls = '', mark = '';
            if (R.corrected) { const ok = isRight(R, i); cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌'; }
            return `<div class="deci-q ${cls}"><div class="deci-qtop"><span class="deci-n">${i + 1})</span>${title}<span style="margin-left:auto">${mark}</span></div>${inner}</div>`;
        }
        const mk = (R, i) => R.corrected ? (isRight(R, i) ? ' ok' : ' ko') : '';
        function ansInput(R, i, extra, mode) {
            const a = R.ans[i] || '';
            return `<input class="deci-ans${mk(R, i)}${extra || ''}" data-in="ans" data-i="${i}" value="${esc(a)}" inputmode="${mode || 'decimal'}" autocomplete="off" spellcheck="false"${R.corrected ? ' disabled' : ''} placeholder="…">`;
        }
        const why = (R, i, html) => R.corrected && !isRight(R, i) ? `<div class="deci-why">✔ ${html}</div>` : '';
        function renderQuestions(R) {
            const T = R.type;
            if (T === 'fraction') return `<div class="deci-grid">` + R.qs.map((q, i) => {
                let h;
                if (q.mode === 'f2d') {
                    h = `<div class="deci-qmain">${fracHtml(numer(q.x), P10[q.x.p])} =</div>${ansInput(R, i)}` + why(R, i, numHtml(q.x));
                    return card(R, i, h, 'Écris avec une virgule');
                }
                h = `<div class="deci-qmain">${numHtml(q.x)} = <span class="deci-frac"><span>${ansInput(R, i, ' mini', 'numeric')}</span><span>${P10[q.x.p]}</span></span></div>` + why(R, i, fracHtml(numer(q.x), P10[q.x.p]));
                return card(R, i, h, 'Complète la fraction décimale');
            }).join('') + `</div>`;
            if (T === 'tableau') return `<div class="deci-grid one">` + R.qs.map((q, i) => {
                const a = R.ans[i] || {};
                let marks = null;
                if (R.corrected) { marks = {}; const E = tableExpected(q); Object.keys(E).forEach(p => { marks[p] = E[p].indexOf(a[p] || '') !== -1 ? (E[p][0] ? 'ok' : '') : 'ko'; }); }
                let h = q.from === 'n' ? `<div class="deci-qmain">${numHtml(q.x)}</div>`
                    : q.from === 'w' ? `<div class="deci-qwords">${esc(readUnits(q.x))}</div>`
                    : q.from === 'v' ? `<div class="deci-qwords">${esc(readVirgule(q.x))}</div>`
                    : `<div class="deci-qmain">${fracHtml(numer(q.x), P10[q.x.p])}</div>`;
                h += tableHtml(null, { IC: q.IC, DC: q.DC, small: true, edit: { q: i, vals: a, marks, lock: R.corrected } });
                h += why(R, i, numHtml(q.x));
                return card(R, i, h, 'Place ce nombre dans le tableau (un chiffre par case)');
            }).join('') + `</div>`;
            if (T === 'decomp') return `<div class="deci-grid">` + R.qs.map((q, i) => {
                const h = `<div class="deci-qmain" style="font-size:calc(var(--f) * .72);font-weight:800">${q.html} =</div>${ansInput(R, i)}` + why(R, i, numHtml(q.x));
                return card(R, i, h, 'Quel est ce nombre ?');
            }).join('') + `</div>`;
            if (T === 'droite') return `<div class="deci-grid one">` + R.qs.map((q, i) => {
                const lab = m => fmtD(fromM(m)).replace(/ /g, ' ');
                const pts = [{ m: q.ans, label: R.corrected ? lab(q.ans) : '?', color: R.corrected ? (isRight(R, i) ? '#2FBF71' : '#FF4F5E') : '#6C4FD8' }];
                const h = lineSvg({ start: q.start, step: q.step, labels: [[0, lab(q.start)], [10, lab(q.start + 10 * q.step)]], points: pts }) + ansInput(R, i);
                return card(R, i, h, 'Quel nombre est repéré par la flèche ?');
            }).join('') + `</div>`;
            if (T === 'comparer') return `<div class="deci-grid">` + R.qs.map((q, i) => {
                const a = R.ans[i], good = signOf(q.a, q.b);
                const btn = s => {
                    let c = a === s ? 'on' : '';
                    if (R.corrected) c = s === good ? 'good' : (a === s ? 'bad' : '');
                    return `<button class="deci-sign ${c}"${R.corrected ? '' : ` data-act="cmp" data-i="${i}" data-v="${s === '<' ? 'lt' : s === '>' ? 'gt' : 'eq'}"`}>${esc(s)}</button>`;
                };
                const h = `<div class="deci-cmp">${numHtml(q.a)} ${btn('<')}${btn('=')}${btn('>')} ${numHtml(q.b)}</div>`;
                return card(R, i, h, 'Choisis le bon signe');
            }).join('') + `</div>`;
            if (T === 'ranger') return `<div class="deci-grid one">` + R.qs.map((q, i) => {
                const a = Array.isArray(R.ans[i]) ? R.ans[i] : [];
                const sym = q.dir === 'asc' ? '&lt;' : '&gt;';
                const pool = q.vals.map((v, j) => `<button class="deci-rk ${a.indexOf(j) !== -1 ? 'used' : ''}"${R.corrected || a.indexOf(j) !== -1 ? ' disabled' : ` data-act="rk" data-i="${i}" data-v="${j}"`}>${numHtml(v)}</button>`).join('');
                const order = a.length ? a.map((j, n) => `${n ? `<span class="deci-lt">${sym}</span>` : ''}<button class="deci-rk in"${R.corrected ? ' disabled' : ` data-act="rk-del" data-i="${i}" data-v="${n}"`}>${numHtml(q.vals[j])}</button>`).join('')
                    : `<span class="deci-hint">Touche les nombres dans l'ordre ${q.dir === 'asc' ? 'croissant (du plus petit au plus grand)' : 'décroissant (du plus grand au plus petit)'}.</span>`;
                const h = `<div class="deci-pool">${pool}</div><div class="deci-order">${order}</div>` + why(R, i, sortedVals(q).map(v => numHtml(v)).join(` ${sym} `));
                return card(R, i, h, q.dir === 'asc' ? 'Range dans l\'ordre croissant' : 'Range dans l\'ordre décroissant');
            }).join('') + `</div>`;
            // Intercaler
            return `<div class="deci-grid">` + R.qs.map((q, i) => {
                const h = `<div class="deci-cmp">${numHtml(q.a)} <span class="deci-lt">&lt;</span> ${ansInput(R, i, ' mini')} <span class="deci-lt">&lt;</span> ${numHtml(q.b)}</div>`
                    + why(R, i, `par exemple ${numHtml(fromM((q.a.m + q.b.m) / 2))}`);
                return card(R, i, h, 'Trouve un nombre compris entre les deux');
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="deci-topbar"><span class="deci-pill">${EXT[R.type].label} · ${R.qs.length} questions</span>
                ${sc ? `<span class="deci-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="deci-actions">
                <button class="deci-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="deci-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="deci-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="deci-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="deci-info">Choisis l'exercice et les nombres, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.deci-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
                c.className = 'deci-confetti';
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
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🔟 Les nombres décimaux', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (canSpeak) window.speechSynthesis.cancel();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'practice':
                    ex.type = el.dataset.v; if (el.dataset.l) ex.level = +el.dataset.l;
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                // Explorer
                case 'exp-n': setExp(el.dataset.v); S.tab = 'exp'; E.q = null; body.scrollTop = 0; break;
                case 'exp-set': { const inp = body.querySelector('.deci-in'); if (inp) setExp(inp.value); sfx('pop'); break; }
                case 'exp-rnd': setExp(fmtD(genDec(E.dlvl, { intMax: E.dlvl === 1 ? 20 : 99 }))); E.q = null; sfx('pop'); break;
                case 'exp-lvl': E.dlvl = +el.dataset.v; setExp(fmtD(genDec(E.dlvl, { intMax: E.dlvl === 1 ? 20 : 99 }))); E.q = null; break;
                case 'col': { const p = +el.dataset.p; E.q = E.q === p ? null : p; sfx('pop'); break; }
                case 'say': { const x = D(E.s); if (x) speak(readVirgule(x)); return; }
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
                case 'cmp': if (!R || R.corrected) return; R.ans[+el.dataset.i] = { lt: '<', gt: '>', eq: '=' }[el.dataset.v]; sfx('pop'); break;
                case 'rk': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, j = +el.dataset.v, cur = Array.isArray(R.ans[i]) ? R.ans[i].slice() : [];
                    if (cur.indexOf(j) === -1) cur.push(j);
                    R.ans[i] = cur; sfx('pop'); break;
                }
                case 'rk-del': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, cur = Array.isArray(R.ans[i]) ? R.ans[i].slice() : [];
                    cur.splice(+el.dataset.v, 1); R.ans[i] = cur; break;
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
            if (e.target.closest('.deci-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.deci-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // ── Saisie dans les champs (sans tout redessiner) ──
        container.addEventListener('input', e => {
            const t = e.target, R = S.run;
            if (t.classList.contains('deci-cell') && R) {
                const v = t.value.replace(/\D/g, '').slice(-1);
                t.value = v;
                const i = +t.dataset.q, p = +t.dataset.p;
                R.ans[i] = Object.assign({}, R.ans[i] || {});
                R.ans[i][p] = v;
                // Case suivante (vers la droite, en sautant la virgule)
                if (v) { const next = body.querySelector(`.deci-cell[data-q="${i}"][data-p="${p - 1}"]`); if (next) next.focus(); }
                saveSoon();
            } else if (t.dataset.in === 'ans' && R) {
                R.ans[+t.dataset.i] = t.value; saveSoon();
            }
        });
        container.addEventListener('keydown', e => {
            const t = e.target;
            if (t.tagName === 'INPUT') e.stopPropagation();   // le tableau ne doit pas réagir aux touches
            if (e.key === 'Enter' && t.classList.contains('deci-in')) { e.preventDefault(); act('exp-set', t); }
            if (t.classList.contains('deci-cell')) {
                const i = +t.dataset.q, p = +t.dataset.p;
                const go = d => { const n = body.querySelector(`.deci-cell[data-q="${i}"][data-p="${p + d}"]`); if (n) { e.preventDefault(); n.focus(); n.select(); } };
                if (e.key === 'ArrowRight') go(-1);
                else if (e.key === 'ArrowLeft') go(1);
                else if (e.key === 'Backspace' && !t.value) go(1);
            }
        });
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
            if (!container.offsetWidth) return;              // widget réduit ou pas encore affiché
            savedW = (container.offsetWidth / window.innerWidth) * 100;
            savedH = (container.offsetHeight / vh()) * 100;
        }
        new MutationObserver(memoSize).observe(container, { attributes: true, attributeFilter: ['style', 'class'] });
        widget._dcGetData = function () {
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
    window._dcEngine = { parseD, fmtD, readVirgule, readUnits, wordsInt, genDec, genQuestion, isRightQ, tableExpected, signOf, numer, digitAt, fromM, sortedVals };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createNombresDecimauxWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
