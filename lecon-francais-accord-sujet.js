// =========================================================================
// LEÇON « L'ACCORD SUJET-VERBE » — Le Bureau du Prof
// Leçons + atelier (on change le sujet, sa place, le verbe : l'accord suit)
// + exercices corrigés. Même cadre que « Les nombres décimaux ».
// Les phrases reprennent la banque du jeu « Le sujet commande ! ».
//
// 📖 Leçons : la règle et la recherche du sujet, le sujet long ou éloigné,
//    le sujet inversé, plusieurs sujets, les pièges (pronoms compléments,
//    « on », « qui »), les terminaisons qu'on n'entend pas.
// 🛠️ Atelier : un verbe, un sujet, une place (juste avant, éloigné, après) :
//    la phrase se recompose, une flèche relie le sujet au verbe, la
//    terminaison s'éclaire et la méthode s'affiche pas à pas.
// ✏️ Exercices : 🎯 choisir la bonne forme, 🔎 trouver le sujet,
//    🔁 remplacer par un pronom, ✍️ écrire le verbe, 🖍️ juste ou faux ?
//
// Ouverture : createWidget('accord-sujet')  ou  createAccordSujetWidget()
// Sauvegarde : w._asvGetData()  /  createAccordSujetWidget(données)
//   (branché dans save-load.js : champ asvData)
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
    if (!document.getElementById('accord-sujet-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'accord-sujet-cursors-style';
        _cs.textContent = [
            '.widget[data-type="accord-sujet"] .asv-header :not(button):not(button *):not(select):not(input) { cursor: inherit !important; }',
            '.widget[data-type="accord-sujet"] .drag-handle, .widget[data-type="accord-sujet"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="accord-sujet"] .drag-handle:active, .widget[data-type="accord-sujet"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            '.widget[data-type="accord-sujet"] .asv-container.wf-fullboard .asv-header, .widget[data-type="accord-sujet"] .asv-container.wf-fullboard .asv-header:active,',
            '.widget.phone-fs[data-type="accord-sujet"] .asv-header, .widget.phone-fs[data-type="accord-sujet"] .asv-header:active { cursor: default !important; }',
            '.widget[data-type="accord-sujet"] button:not(:disabled), .widget[data-type="accord-sujet"] button:not(:disabled) *, .widget[data-type="accord-sujet"] select,',
            '.widget[data-type="accord-sujet"] .widget-menu-handle, .widget[data-type="accord-sujet"] .widget-pin-handle,',
            '.widget[data-type="accord-sujet"] .widget-back-handle, .widget[data-type="accord-sujet"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="accord-sujet"] button:disabled, .widget[data-type="accord-sujet"] button:disabled * { cursor: default !important; }',
            '.widget[data-type="accord-sujet"]:has(.asv-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    'use strict';

    const TYPE = 'accord-sujet';

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

    // ── CSS (préfixe asv-) ─────────────────────────────────────────────────
    if (!document.getElementById('asv-style')) {
        const s = document.createElement('style');
        s.id = 'asv-style';
        s.textContent = `
.widget[data-type="accord-sujet"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.asv-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --ce:#e07b2a; --c1:#0891b2; --c2:#7c3aed; --c3:#D63384;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.asv-container input { user-select:text; -webkit-user-select:text; }
.asv-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:600px), (max-height:500px) and (pointer:coarse) {
    .asv-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .asv-tab-lbl { display:none; }
    .asv-title { font-size:17px !important; }
    .asv-lesson { flex-direction:column; }
    .asv-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .asv-gbtn { flex:1 1 auto; text-align:center !important; }
    .asv-srow > .l { min-width:0 !important; width:100%; }
}
.asv-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.asv-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.asv-tabs { display:flex; gap:6px; margin-left:12px; }
.asv-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.asv-tab:hover { background:rgba(255,255,255,.1); }
.asv-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.asv-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.asv-icon-btn:hover { background:rgba(255,255,255,.28); }
.asv-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Couleurs : partie entière, virgule, dixièmes, centièmes, millièmes */
.asv-ce { color:var(--ce); } .asv-k1 { color:var(--c1); } .asv-k2 { color:var(--c2); } .asv-k3 { color:var(--c3); }
.asv-virg { color:var(--rouge); font-weight:900; }
.asv-num { font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; white-space:nowrap; letter-spacing:.02em; }
.asv-words { font-weight:800; line-height:1.5; }
.asv-frac { display:inline-flex; flex-direction:column; align-items:stretch; text-align:center; vertical-align:middle; line-height:1.05; margin:0 3px;
    font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; }
.asv-frac > span { padding:0 4px; }
.asv-frac > span:first-child { padding-bottom:.06em; }
/* Dénominateur : un peu d'espace sous la barre de fraction */
.asv-frac > span + span { border-top:2.5px solid currentColor; padding-top:.16em; }

/* ── Tableau de numération ── */
.asv-twrap { overflow-x:auto; display:flex; justify-content:center; padding:2px; }
.asv-table { --cw:54px; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.asv-table th, .asv-table td { text-align:center; padding:0; }
.asv-table .kh { color:#fff; font-weight:900; font-size:calc(var(--cw) * .27); padding:5px 6px; letter-spacing:.3px; white-space:nowrap; }
.asv-table .kh.ke { background:var(--ce); } .asv-table .kh.kd { background:linear-gradient(90deg,var(--c1),var(--c2),var(--c3)); }
.asv-table .ch { font-weight:900; font-size:calc(var(--cw) * .3); padding:3px 2px; width:var(--cw); }
.asv-table .ch.kd { font-size:calc(var(--cw) * .2); width:calc(var(--cw) * 1.3); }
.asv-table .ch.ke, .asv-table td.ke { background:#fdf0e5; color:var(--ce); }
.asv-table .ch.k1, .asv-table td.k1 { background:#e6f7fb; color:var(--c1); }
.asv-table .ch.k2, .asv-table td.k2 { background:#f3edff; color:var(--c2); }
.asv-table .ch.k3, .asv-table td.k3 { background:#fdeaf3; color:var(--c3); }
.asv-table td { height:calc(var(--cw) * 1.15); font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .78); font-weight:700; color:var(--encre) !important;
    border-top:2px solid rgba(0,0,0,.06); }
.asv-table .vh, .asv-table .virg { width:calc(var(--cw) * .32); background:#fff; }
/* La virgule : même police, même taille et même alignement que les chiffres, pour être posée sur leur ligne */
.asv-table td.virg { color:var(--rouge) !important; font-size:calc(var(--cw) * .78); vertical-align:middle; line-height:normal; }
.asv-table .dim { opacity:.3; }
.asv-table .hlc { box-shadow:inset 0 0 0 4px #ff4f5e; background:#ffe9eb !important; }
.asv-table td.click:hover { filter:brightness(.95); }
.asv-table td.ed { padding:3px; }
.asv-table td input { width:100%; height:100%; box-sizing:border-box; border:2px dashed #c7bca6; border-radius:8px; background:#fff; text-align:center;
    font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .7); font-weight:700; color:#3949AB; outline:none; padding:0; }
.asv-table td input:focus { border:3px solid var(--violet); background:#f3efff; }
.asv-table td input.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.asv-table td input.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.asv-table.small { --cw:40px; }

/* ── Dessins (bande unité, quadrillage, droite graduée) ── */
.asv-fig { display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:flex-end; }
.asv-fig figure { margin:0; display:flex; flex-direction:column; align-items:center; gap:4px; }
.asv-fig figcaption { font-weight:800; font-size:15px; text-align:center; }
.asv-svg { display:block; max-width:100%; height:auto; }
.asv-line { width:100%; max-width:680px; margin:0 auto; }

/* ── Leçons ── */
.asv-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.asv-side { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.asv-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.asv-gbtn:hover { transform:translateX(2px); }
.asv-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.asv-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.asv-ltitle h2 { margin:0; font-size:32px; font-weight:900; }
.asv-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.55; }
.asv-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.asv-box ul, .asv-box ol { margin:4px 0 0; padding-left:22px; }
.asv-what { background:#f1edff; border:2px solid #c8bbf5; }
.asv-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.asv-memo { background:#fff6d6; border:2px solid #f3d36b; }
.asv-trap { background:#ffecee; border:2px solid #f6a7b0; }
.asv-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.asv-big { font-size:22px; }
.asv-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.asv-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.asv-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.asv-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.asv-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.asv-btn:disabled { opacity:.45; }
.asv-steps { display:flex; flex-direction:column; gap:6px; }
.asv-step { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:6px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.asv-step > span:last-child { flex:1; min-width:0; }
.asv-step .n { background:var(--encre); color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:900; flex-shrink:0; }
.asv-ftable { border-collapse:collapse; margin:4px auto 0; font-size:20px; }
.asv-ftable td { padding:4px 14px; border-bottom:1px dashed #e3d8c3; text-align:center; }
.asv-ftable td.w { font-size:14px; font-weight:800; color:#6a6380; text-align:left; }

/* ── Explorer ── */
.asv-ex { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.asv-bar { display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
.asv-in { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:26px; font-weight:700; padding:4px 12px; width:220px; max-width:100%; box-sizing:border-box;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; text-align:center; }
.asv-in:focus { border-color:var(--violet); }
.asv-panel { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 14px; }
.asv-panel h4 { margin:0 0 6px; font-size:15px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.asv-read { font-size:22px; text-align:center; }
.asv-dec { display:flex; flex-direction:column; gap:4px; font-size:21px; }
.asv-dec .row { display:flex; flex-direction:column; gap:0; padding:3px 0; border-bottom:1px dashed #eee4d2; }
.asv-dec .row:last-child { border-bottom:none; }
.asv-dec .lbl { font-size:12px; font-weight:900; color:#9a8f7a; text-transform:uppercase; }
.asv-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:8px 14px; font-weight:700; text-align:center; font-size:17px; }
.asv-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.asv-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.asv-hint { font-size:12.5px; color:#6a6380; }

/* ── Exercices ── */
.asv-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.asv-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.asv-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.asv-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.asv-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.asv-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.asv-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.asv-pill.score { background:var(--vert); font-size:16px; }
.asv-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.asv-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 400px)),1fr)); }
.asv-grid.one { grid-template-columns:1fr; }
.asv-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .3); min-width:0; }
.asv-q.ok { border-color:var(--vert); background:#f3fcf7; }
.asv-q.ko { border-color:var(--rouge); background:#fff5f6; }
.asv-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.asv-n { font-weight:900; color:#9a8f7a; }
.asv-qmain { text-align:center; font-size:var(--f); line-height:1.5; }
.asv-qwords { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
.asv-ans { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .9); font-weight:700; padding:2px 10px; width:100%; max-width:260px; box-sizing:border-box;
    border:2px dashed #b9abef; border-radius:12px; outline:none; color:#3949AB; background:#fff; text-align:center; align-self:center; }
.asv-ans.mini { width:auto; max-width:none; font-size:calc(var(--f) * .72); padding:0 6px; border-radius:8px; vertical-align:baseline; }
/* Case à remplir dans une fraction (numérateur) ou entre deux nombres : largeur adaptée */
.asv-ans.mini { width:calc(var(--f) * 3.6); }
.asv-frac .asv-ans.mini { width:calc(var(--f) * 2.4); margin-bottom:.1em; }
.asv-ans:focus { border:3px solid var(--violet); background:#f3efff; }
.asv-ans.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.asv-ans.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.asv-cmp { display:flex; align-items:center; justify-content:center; gap:calc(var(--f) * .4); flex-wrap:wrap; font-size:var(--f); }
.asv-sign { border:2px solid #d9cdb6; background:#fff; border-radius:12px; min-width:calc(var(--f) * 1.5); padding:0 8px; font:inherit; font-weight:900; font-size:calc(var(--f) * .8);
    color:var(--encre); touch-action:manipulation; line-height:1.4; }
.asv-sign.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.asv-sign.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.asv-sign.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.asv-pool, .asv-order { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; align-items:center; min-height:calc(var(--f) * 1.5); }
.asv-order { background:#faf6ee; border:2px dashed #d9cdb6; border-radius:12px; padding:4px 8px; }
.asv-rk { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:0 12px; font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700;
    font-size:calc(var(--f) * .8); color:var(--encre); touch-action:manipulation; line-height:1.4; }
.asv-rk.used { opacity:.25; }
.asv-rk.in { border-color:var(--violet); background:#f3efff; }
.asv-lt { font-weight:900; font-size:calc(var(--f) * .7); color:#9a8f7a; }
.asv-why { font-size:14px; color:#5a5470; text-align:center; line-height:1.45; }
.asv-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:asv-fall 1.6s ease-in forwards; }
@keyframes asv-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.asv-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.asv-help.show { display:block; }
.asv-help h4 { margin:0 0 6px; font-size:15px; }
.asv-help p { margin:0 0 6px; }
.asv-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.asv-container:hover .asv-resize { opacity:1; }
.asv-container.wf-fullboard .asv-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="accord-sujet"], .asv-container, .asv-container * { cursor:default !important; }
.asv-container .asv-header { cursor:grab !important; }
.asv-container .asv-header:active { cursor:grabbing !important; }
.asv-container button, .asv-container [data-act] { cursor:pointer !important; }
.asv-container button:disabled { cursor:default !important; }
.asv-container input { cursor:text !important; }
.asv-container .asv-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // ── CSS propre à l'accord sujet-verbe ────────────────────────────────
    if (!document.getElementById('asv-style2')) {
        const s2 = document.createElement('style');
        s2.id = 'asv-style2';
        s2.textContent = `
.asv-container { --sj:#1f6fd1; --vb:#e0464f; }
.asv-title { background:none !important; border:none !important; box-shadow:none !important; border-radius:0 !important; padding:0 !important; margin:0; }
/* Phrase avec flèche sujet → verbe */
.asv-sentwrap { position:relative; padding-top:38px; text-align:center; }
.asv-sentwrap.small { padding-top:30px; }
.asv-arrow { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
.asv-sent { font-size:26px; font-weight:800; line-height:1.9; }
.asv-sentwrap.big .asv-sent { font-size:34px; }
.asv-s { color:var(--sj); border-bottom:4px solid var(--sj); padding:0 2px; border-radius:2px; }
.asv-v { color:var(--vb); border-bottom:4px solid var(--vb); padding:0 2px; border-radius:2px; }
.asv-v b { background:#ffe1e3; border-radius:5px; padding:0 2px; }
.asv-noyau { text-decoration:underline wavy var(--sj); text-underline-offset:7px; }
/* Mot qui n'est pas le sujet (barré dans les exemples) */
.asv-xw { color:#9a8f7a; text-decoration:line-through 2px #c9bfae; }
.asv-blank { display:inline-block; min-width:2.6em; border-bottom:3px dashed #b9abef; color:#6C4FD8; }
.asv-tag { display:inline-block; font-size:12px; font-weight:900; color:#fff; border-radius:999px; padding:1px 8px; vertical-align:middle; }
.asv-tag.s { background:var(--sj); } .asv-tag.v { background:var(--vb); }
.asv-conj { border-collapse:separate; border-spacing:0; background:#fff; border-radius:12px; overflow:hidden; margin:0 auto; font-size:19px; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.asv-conj td { padding:4px 16px; border-bottom:1px solid #f0e8d8; }
.asv-conj td:first-child { color:var(--sj); font-weight:900; text-align:right; }
.asv-conj td:last-child { font-weight:800; }
.asv-conj td:last-child b { color:var(--vb); }
.asv-conj tr.on td { background:#fff2b3; }
.asv-conj th { background:var(--encre); color:#fff; padding:5px 12px; font-size:14px; }
.asv-tables { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
.asv-chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.asv-chips > .l { font-weight:900; font-size:13px; min-width:130px; }
.asv-chips > .l.asv-gl { font-weight:800; color:#6a6380; padding-left:12px; box-sizing:border-box; }
@media (max-width:600px), (max-height:500px) and (pointer:coarse) { .asv-chips > .l { width:100%; min-width:0; } .asv-sentwrap.big .asv-sent { font-size:26px; } }
.asv-chip:disabled { opacity:.35; }
/* Exercices */
.asv-qsent { text-align:center; font-size:calc(var(--f) * .8); font-weight:800; line-height:1.7; }
.asv-inf { color:#6a6380; font-weight:800; font-size:.8em; }
.asv-opts { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.asv-opt { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:2px 14px; font:inherit; font-weight:800; font-size:calc(var(--f) * .65);
    color:var(--encre); touch-action:manipulation; line-height:1.5; }
.asv-opt.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.asv-opt.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.asv-opt.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.asv-tok { display:inline-block; border-radius:8px; padding:0 4px; margin:1px 0; touch-action:manipulation; border:2px solid transparent; }
.asv-tok.w:hover { background:#f1edff; }
.asv-tok.sel { background:#dbe9ff; border-color:var(--sj); color:var(--sj); }
.asv-tok.good { background:#e2f7ec; border-color:var(--vert); color:#178a4b; }
.asv-tok.bad { background:#ffe9eb; border-color:var(--rouge); color:#c0293a; }
.asv-tok.miss { border-color:var(--vert); border-style:dashed; }
`;
        document.head.appendChild(s2);
    }

    // =====================================================================
    // OUTILS
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    const norm = t => String(t == null ? '' : t).trim().toLowerCase().replace(/[’`]/g, '\'').replace(/\s+/g, ' ');
    const PRONOUNS = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'];

    // =====================================================================
    // BANQUE DE PHRASES (reprise du jeu « Le sujet commande ! »)
    // { t: phrase avec ___, s: sujet, p: pronom, g: bonne forme, w: [intrus],
    //   i: infinitif, n: remarque }
    // =====================================================================
    const B = (t, s, p, g, w1, w2, i, n) => ({ t, s, p, g, w: [w1, w2], i, n: n || '' });
    const BANK = {
        1: [
            B('Le chat ___ sur le canapé.', 'Le chat', 'il', 'dort', 'dorment', 'dors', 'dormir'),
            B('Les oiseaux ___ dans le ciel.', 'Les oiseaux', 'ils', 'volent', 'vole', 'voles', 'voler'),
            B('Nous ___ une cabane.', 'Nous', 'nous', 'construisons', 'construisez', 'construisent', 'construire'),
            B('Tu ___ ton goûter.', 'Tu', 'tu', 'manges', 'mange', 'mangent', 'manger'),
            B('Ma sœur ___ de la guitare.', 'Ma sœur', 'elle', 'joue', 'jouent', 'joues', 'jouer'),
            B('Vous ___ très vite.', 'Vous', 'vous', 'courez', 'courons', 'court', 'courir'),
            B('Les filles ___ une chanson.', 'Les filles', 'elles', 'chantent', 'chante', 'chantes', 'chanter'),
            B('Je ___ un livre.', 'Je', 'je', 'lis', 'lit', 'lisent', 'lire'),
            B('Le maître ___ la leçon.', 'Le maître', 'il', 'explique', 'expliquent', 'expliques', 'expliquer'),
            B('Les élèves ___ en silence.', 'Les élèves', 'ils', 'travaillent', 'travaille', 'travailles', 'travailler'),
            B('Paul ___ son vélo.', 'Paul', 'il', 'répare', 'réparent', 'répares', 'réparer'),
            B('Mes parents ___ au marché.', 'Mes parents', 'ils', 'vont', 'va', 'vas', 'aller'),
            B('Le bébé ___ dans son lit.', 'Le bébé', 'il', 'pleure', 'pleurent', 'pleures', 'pleurer'),
            B('On ___ au ballon.', 'On', 'il', 'joue', 'jouent', 'jouons', 'jouer', '« On » se conjugue comme « il ».'),
            B('Les fleurs ___ au printemps.', 'Les fleurs', 'elles', 'poussent', 'pousse', 'pousses', 'pousser'),
            B('Le vent ___ fort.', 'Le vent', 'il', 'souffle', 'soufflent', 'souffles', 'souffler')
        ],
        2: [
            B('Les enfants du quartier ___ dans la cour.', 'Les enfants du quartier', 'ils', 'jouent', 'joue', 'jouons', 'jouer', 'Ce sont les enfants qui jouent, pas le quartier !'),
            B('Le chien de mes voisins ___ toute la nuit.', 'Le chien de mes voisins', 'il', 'aboie', 'aboient', 'aboies', 'aboyer', 'Qui aboie ? Le chien, pas les voisins !'),
            B('Léa et Tom ___ leurs devoirs.', 'Léa et Tom', 'ils', 'font', 'fait', 'faisons', 'faire', 'Deux sujets : Léa et Tom, c\'est « ils ».'),
            B('Toi et moi ___ les meilleurs amis.', 'Toi et moi', 'nous', 'sommes', 'êtes', 'sont', 'être', '« Toi et moi », c\'est « nous ».'),
            B('La maîtresse des CM2 ___ une sortie.', 'La maîtresse des CM2', 'elle', 'organise', 'organisent', 'organises', 'organiser', 'Qui organise ? La maîtresse, pas les CM2 !'),
            B('Les feuilles de l\'arbre ___ en automne.', 'Les feuilles de l\'arbre', 'elles', 'tombent', 'tombe', 'tombes', 'tomber', 'Ce sont les feuilles qui tombent, pas l\'arbre !'),
            B('Mon frère et toi ___ au même club.', 'Mon frère et toi', 'vous', 'allez', 'vont', 'allons', 'aller', '« Toi » + quelqu\'un d\'autre, c\'est « vous ».'),
            B('Le panier de pommes ___ sur la table.', 'Le panier de pommes', 'il', 'est', 'sont', 'es', 'être', 'C\'est le panier qui est sur la table : un seul panier !'),
            B('Les élèves de la classe ___ la sortie.', 'Les élèves de la classe', 'ils', 'attendent', 'attend', 'attends', 'attendre', 'Ce sont les élèves qui attendent, pas la classe !'),
            B('Le cri des mouettes ___ les touristes.', 'Le cri des mouettes', 'il', 'réveille', 'réveillent', 'réveilles', 'réveiller', 'Qu\'est-ce qui réveille ? Le cri, pas les mouettes !'),
            B('Ma cousine et moi ___ à la piscine.', 'Ma cousine et moi', 'nous', 'nageons', 'nagent', 'nagez', 'nager', '« Moi » + quelqu\'un d\'autre, c\'est « nous ».'),
            B('Les jouets de mon petit frère ___ partout.', 'Les jouets de mon petit frère', 'ils', 'traînent', 'traîne', 'traînes', 'traîner', 'Ce sont les jouets qui traînent, pas le frère !'),
            B('Le bouquet de roses ___ bon.', 'Le bouquet de roses', 'il', 'sent', 'sentent', 'sens', 'sentir', 'Un seul bouquet, même s\'il y a plusieurs roses !'),
            B('Le chat et le chien ___ ensemble.', 'Le chat et le chien', 'ils', 'dorment', 'dort', 'dors', 'dormir', 'Deux sujets : le chat et le chien, c\'est « ils ».'),
            B('La voiture de mes grands-parents ___ en panne.', 'La voiture de mes grands-parents', 'elle', 'tombe', 'tombent', 'tombes', 'tomber', 'C\'est la voiture qui tombe en panne : une seule voiture !'),
            B('Les crayons de Julie ___ cassés.', 'Les crayons de Julie', 'ils', 'sont', 'est', 'es', 'être', 'Ce sont les crayons qui sont cassés, pas Julie !')
        ],
        3: [
            B('Dans la forêt ___ les loups.', 'les loups', 'ils', 'hurlent', 'hurle', 'hurlez', 'hurler', 'Le sujet est placé après le verbe : qui hurle ? Les loups.'),
            B('Les enfants les ___ souvent.', 'Les enfants', 'ils', 'regardent', 'regarde', 'regardes', 'regarder', '« les » devant le verbe n\'est pas le sujet : c\'est un pronom complément.'),
            B('Mes amis, je les ___ chaque jour.', 'je', 'je', 'vois', 'voient', 'voit', 'voir', 'Qui voit ? « je ». « les » remplace « mes amis » : ce n\'est pas le sujet.'),
            B('C\'est moi qui ___ la porte.', 'qui', 'je', 'ferme', 'fermes', 'ferment', 'fermer', '« qui » remplace « moi » : le verbe se conjugue avec « je ».'),
            B('C\'est toi qui ___ le gagnant.', 'qui', 'tu', 'es', 'est', 'êtes', 'être', '« qui » remplace « toi » : le verbe se conjugue avec « tu ».'),
            B('Les voitures que je vois ___ rouges.', 'Les voitures', 'elles', 'sont', 'suis', 'est', 'être', 'Ce sont les voitures qui sont rouges, pas « je » !'),
            B('Sur la branche ___ deux moineaux.', 'deux moineaux', 'ils', 'chantent', 'chante', 'chantes', 'chanter', 'Le sujet est placé après le verbe : qui chante ? Deux moineaux.'),
            B('Le livre que mes amis m\'ont prêté ___ passionnant.', 'Le livre', 'il', 'est', 'sont', 'es', 'être', 'Qu\'est-ce qui est passionnant ? Le livre, pas mes amis !'),
            B('Où ___ tes parents ?', 'tes parents', 'ils', 'habitent', 'habite', 'habites', 'habiter', 'Dans une question, le sujet peut être après le verbe.'),
            B('Mes sœurs, souvent, me ___ des histoires.', 'Mes sœurs', 'elles', 'racontent', 'raconte', 'racontes', 'raconter', '« me » n\'est pas le sujet : qui raconte ? Mes sœurs.'),
            B('Les élèves, après la récréation, ___ en classe.', 'Les élèves', 'ils', 'rentrent', 'rentre', 'rentres', 'rentrer', 'Le sujet est loin du verbe : qui rentre ? Les élèves.'),
            B('Les gâteaux que prépare ma grand-mère ___ délicieux.', 'Les gâteaux', 'ils', 'sont', 'est', 'es', 'être', 'Qu\'est-ce qui est délicieux ? Les gâteaux, pas la grand-mère !'),
            B('Au loin ___ le tonnerre.', 'le tonnerre', 'il', 'gronde', 'grondent', 'grondes', 'gronder', 'Le sujet est placé après le verbe : qu\'est-ce qui gronde ? Le tonnerre.'),
            B('Toi qui ___ si bien, aide-moi !', 'qui', 'tu', 'dessines', 'dessine', 'dessinent', 'dessiner', '« qui » remplace « toi » : le verbe se conjugue avec « tu ».'),
            B('Les chiens que Pierre promène ___ sages.', 'Les chiens', 'ils', 'sont', 'est', 'es', 'être', 'Qui est sage ? Les chiens, pas Pierre !'),
            B('Que ___ les enfants ?', 'les enfants', 'ils', 'veulent', 'veut', 'veux', 'vouloir', 'Dans une question, le sujet peut être après le verbe.')
        ]
    };

    // Découpage d'une phrase en mots (les apostrophes et traits d'union restent dans le mot)
    const WORD = 'A-Za-zÀ-ÖØ-öø-ÿœŒæÆ0-9';
    const TOK_RE = new RegExp(`[${WORD}]+(?:['’][${WORD}]+)*(?:-[${WORD}]+)*|[^\\s${WORD}]`, 'g');
    const tokens = t => t.match(TOK_RE) || [];
    const isWord = t => new RegExp(`[${WORD}]`).test(t);
    const filled = e => e.t.replace('___', e.g);
    // Position du sujet dans la phrase complète : [début, fin] (indices de mots)
    function subjectRange(e) {
        const T = tokens(filled(e)).map(x => x.toLowerCase()), S = tokens(e.s).map(x => x.toLowerCase());
        for (let i = 0; i + S.length <= T.length; i++) {
            if (S.every((w, j) => T[i + j] === w)) return [i, i + S.length - 1];
        }
        return null;
    }

    // =====================================================================
    // ATELIER : verbes conjugués au présent et sujets possibles
    // =====================================================================
    const PERS = ['je', 'tu', 'il / elle / on', 'nous', 'vous', 'ils / elles'];
    const VERBS = [
        { i: 'chanter', f: ['chante', 'chantes', 'chante', 'chantons', 'chantez', 'chantent'], c: 'une chanson', inv: 'Dans l\'arbre {V} {S}.' },
        { i: 'dormir',  f: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], c: 'sous la tente', inv: 'Sous la tente {V} {S}.' },
        { i: 'finir',   f: ['finis', 'finis', 'finit', 'finissons', 'finissez', 'finissent'], c: 'le puzzle', inv: 'Bientôt {V} {S}.' },
        { i: 'être',    f: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], c: 'dans le jardin', inv: 'Où {V} {S} ?' },
        { i: 'avoir',   f: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], c: 'un vélo rouge', inv: 'Quel âge {V} {S} ?' },
        { i: 'aller',   f: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], c: 'à la piscine', inv: 'Où {V} {S} ?' },
        { i: 'faire',   f: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], c: 'un gâteau', inv: 'Que {V} {S} ?' },
        { i: 'prendre', f: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], c: 'le bus', inv: 'Quel bus {V} {S} ?' }
    ];
    // k : pro (pronom), nom, long (groupe long), plus (plusieurs sujets) ; p : personne 0 à 5 ;
    // r : pronom de remplacement ; n : nom noyau ; x : nom piège dans le groupe ; prop : nom propre (majuscule gardée)
    const SUBJ = [
        { t: 'Je', k: 'pro', p: 0, r: 'je' }, { t: 'Tu', k: 'pro', p: 1, r: 'tu' }, { t: 'Il', k: 'pro', p: 2, r: 'il' },
        { t: 'Elle', k: 'pro', p: 2, r: 'elle' }, { t: 'On', k: 'pro', p: 2, r: 'on' }, { t: 'Nous', k: 'pro', p: 3, r: 'nous' },
        { t: 'Vous', k: 'pro', p: 4, r: 'vous' }, { t: 'Ils', k: 'pro', p: 5, r: 'ils' }, { t: 'Elles', k: 'pro', p: 5, r: 'elles' },
        { t: 'Le chat', k: 'nom', p: 2, r: 'il' }, { t: 'Ma sœur', k: 'nom', p: 2, r: 'elle' },
        { t: 'Les enfants', k: 'nom', p: 5, r: 'ils' }, { t: 'Mes amies', k: 'nom', p: 5, r: 'elles' },
        { t: 'Le chien de mes voisins', k: 'long', p: 2, r: 'il', n: 'chien', x: 'voisins' },
        { t: 'Les enfants du quartier', k: 'long', p: 5, r: 'ils', n: 'enfants', x: 'quartier' },
        { t: 'Le bouquet de roses', k: 'long', p: 2, r: 'il', n: 'bouquet', x: 'roses' },
        { t: 'Les élèves de la classe', k: 'long', p: 5, r: 'ils', n: 'élèves', x: 'classe' },
        { t: 'Léa et Tom', k: 'plus', p: 5, r: 'ils', prop: true },
        { t: 'Toi et moi', k: 'plus', p: 3, r: 'nous' },
        { t: 'Ton frère et toi', k: 'plus', p: 4, r: 'vous' }
    ];
    const SGROUPS = [['pro', 'Pronoms'], ['nom', 'Noms'], ['long', 'Groupes longs'], ['plus', 'Plusieurs sujets']];
    const PLACES = [['proche', 'Juste avant le verbe'], ['loin', 'Éloigné du verbe'], ['inverse', 'Après le verbe']];
    // Terminaison à éclairer selon la personne
    const ENDS = [['ai', 'e', 's', 'x'], ['es', 's', 'x'], ['e', 't', 'd', 'a'], ['ons', 'es'], ['ez', 'es'], ['ent', 'ont']];
    function verbHtml(form, p) {
        const end = ENDS[p].find(e => form.endsWith(e) && form.length > e.length);
        return end ? esc(form.slice(0, -end.length)) + '<b>' + esc(end) + '</b>' : '<b>' + esc(form) + '</b>';
    }
    const startsVowel = w => /^[aeiouyhàâéèêëîïôûü]/i.test(w);

    // Mini-balisage pour les phrases des leçons :
    //   [sujet] · {verbe|terminaison} · *noyau* (dans le sujet) · ~mot piège~
    function mark(src) {
        return esc(src)
            .replace(/\*([^*]+)\*/g, '<span class="asv-noyau">$1</span>')
            .replace(/~([^~]+)~/g, '<span class="asv-xw">$1</span>')
            .replace(/\[([^\]]+)\]/g, '<span class="asv-s">$1</span>')
            .replace(/\{([^|}]+)\|([^}]*)\}/g, (m, f, e) => `<span class="asv-v">${e && f.endsWith(e) ? f.slice(0, -e.length) + '<b>' + e + '</b>' : f}</span>`);
    }
    const sent = (src, cls) => `<div class="asv-sentwrap ${cls || ''}"><svg class="asv-arrow"></svg><div class="asv-sent">${mark(src)}</div></div>`;
    function conjTable(v, on, title) {
        return `<table class="asv-conj"><tr><th colspan="2">${esc(title || v.i)}</th></tr>${v.f.map((f, p) => `<tr class="${on === p ? 'on' : ''}"><td>${esc(PERS[p])}</td><td>${verbHtml(f, p)}</td></tr>`).join('')}</table>`;
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
        { id: 'regle',    label: '🧭 La règle',              color: '#1f6fd1' },
        { id: 'loin',     label: '📏 Sujet long, éloigné',    color: '#059669' },
        { id: 'inverse',  label: '🔄 Sujet inversé',          color: '#e07b2a' },
        { id: 'plusieurs',label: '👥 Plusieurs sujets',       color: '#7c3aed' },
        { id: 'pieges',   label: '🪤 Les pièges',             color: '#D63384' },
        { id: 'entendre', label: '👂 On ne l\'entend pas !',  color: '#6C4FD8' }
    ];
    const EXT = {
        choisir:  { label: '🎯 Choisir la forme',  color: '#1f6fd1' },
        sujet:    { label: '🔎 Trouver le sujet',  color: '#059669' },
        pronom:   { label: '🔁 Le bon pronom',     color: '#e07b2a' },
        ecrire:   { label: '✍️ Écrire le verbe',   color: '#7c3aed' },
        corriger: { label: '🖍️ Juste ou faux ?',   color: '#D63384' }
    };
    const LEVELS = {
        1: { label: '😊 Sujet proche',   color: '#2FBF71', hint: 'le sujet est juste avant le verbe' },
        2: { label: '😐 Sujet long',     color: '#F2994A', hint: 'groupe sujet long, plusieurs sujets' },
        3: { label: '😤 Sujet piégé',    color: '#EB5757', hint: 'sujet inversé, éloigné, « qui », pronom complément' }
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'regle',
            exp: { v: 0, s: 11, place: 'proche' },
            ex: { type: 'choisir', level: 1, n: 8 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // EXERCICES : génération et correction (fonctions pures, testables)
    // =====================================================================
    function bankFor(type, lvl) {
        let list = BANK[lvl].map((e, k) => ({ lvl, k }));
        // Pour « le bon pronom », on écarte les sujets qui sont déjà des pronoms et « qui »
        if (type === 'pronom') list = list.filter(r => { const s = norm(BANK[r.lvl][r.k].s); return PRONOUNS.indexOf(s) === -1 && s !== 'qui'; });
        return list;
    }
    function genQuestions(type, lvl, n) {
        const base = bankFor(type, lvl), out = [];
        let pool = [];
        while (out.length < n) {
            if (!pool.length) pool = shuffle(base);
            const r = pool.pop(), q = { lvl: r.lvl, k: r.k };
            const e = BANK[r.lvl][r.k];
            if (type === 'choisir') q.opts = shuffle([e.g].concat(e.w));
            if (type === 'corriger') { q.ok = Math.random() < .45; q.shown = q.ok ? e.g : e.w[0]; }
            out.push(q);
        }
        return out;
    }
    const entryOf = q => BANK[q.lvl][q.k];
    function isRightQ(type, q, a) {
        const e = entryOf(q);
        if (type === 'choisir') return a === e.g;
        if (type === 'ecrire') return norm(a) === norm(e.g);
        if (type === 'pronom') return a === e.p;
        if (type === 'sujet') {
            const R = subjectRange(e);
            if (!R || !Array.isArray(a)) return false;
            const want = []; for (let i = R[0]; i <= R[1]; i++) want.push(i);
            const got = a.slice().sort((x, y) => x - y);
            return got.length === want.length && got.every((x, i) => x === want[i]);
        }
        // corriger : { j: 'ok' | 'ko', t: correction }
        if (!a || !a.j) return false;
        if (q.ok) return a.j === 'ok';
        return a.j === 'ko' && norm(a.t) === norm(e.g);
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createAccordSujetWidget = function (saved) {
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
        container.className = 'asv-container';
        container.innerHTML = `
            <div class="asv-header">
                <span class="asv-title">🚂 L'accord sujet-verbe</span>
                <div class="asv-tabs">
                    <button class="asv-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="asv-tab-lbl">Leçons</span></button>
                    <button class="asv-tab" data-act="tab" data-tab="exp"><span>🛠️</span><span class="asv-tab-lbl">Atelier</span></button>
                    <button class="asv-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="asv-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="asv-icon-btn" data-act="sound" title="Son"></button>
                    <button class="asv-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="asv-body"></div>
            <div class="asv-help">
                <h4>💡 Comment utiliser cette leçon ?</h4>
                <p><b>📖 Leçons</b> — La règle et la méthode pour trouver le sujet, le sujet long ou éloigné du verbe, le sujet placé après le verbe, plusieurs sujets, les pièges (« les », « leur », « on », « qui »), et les terminaisons qu'on n'entend pas.</p>
                <p><b>🛠️ Atelier</b> — Choisis un verbe, un sujet et la place du sujet : la phrase se recompose, la flèche relie le <span style="color:#1f6fd1;font-weight:900">sujet</span> au <span style="color:#e0464f;font-weight:900">verbe</span>, et la terminaison s'éclaire. La méthode s'affiche pas à pas.</p>
                <p><b>✏️ Exercices</b> — Choisir la bonne forme, trouver le sujet (touche ses mots), le remplacer par un pronom, écrire le verbe, dire si l'accord est juste ou faux. Puis <b>👁 Correction</b> avec le score.</p>
                <p>Les phrases viennent du jeu « Le sujet commande ! », avec les mêmes 3 niveaux.</p>
            </div>
            <div class="asv-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.asv-body');
        const help = container.querySelector('.asv-help');
        const resizeHandle = container.querySelector('.asv-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        if (!EXT[S.ex.type]) S.ex.type = 'choisir';
        if (S.run && (!EXT[S.run.type] || !Array.isArray(S.run.qs) || S.run.qs.some(q => !BANK[q.lvl] || !BANK[q.lvl][q.k]))) S.run = null;
        if (!VERBS[S.exp.v]) S.exp.v = 0;
        if (!SUBJ[S.exp.s]) S.exp.s = 11;
        let msg = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        const CH = VERBS[0];
        function renderRegle() {
            return `<div class="asv-ltitle"><h2 style="color:#1f6fd1">🧭 Le sujet commande le verbe</h2></div>
                <div class="asv-box asv-what"><b class="t">🔤 La règle</b>Le verbe <b>s'accorde avec son sujet</b> : sa terminaison change selon que le sujet est au <b>singulier</b> ou au <b>pluriel</b>, et selon la <b>personne</b> (je, tu, il…).</div>
                ${sent('[Le chat] {dort|t} sur le canapé.')}
                ${sent('[Les chats] {dorment|ent} sur le canapé.')}
                <div class="asv-box asv-test"><b class="t">🔎 Comment trouver le sujet ?</b></div>
                <div class="asv-steps">
                    <div class="asv-step"><span class="n">1</span><span>Je trouve le <span class="asv-tag v">verbe</span> : c'est le mot qui change quand je change de temps (aujourd'hui, hier, demain).</span></div>
                    <div class="asv-step"><span class="n">2</span><span>Je pose la question <b>« Qui est-ce qui… ? »</b> ou <b>« Qu'est-ce qui… ? »</b> devant le verbe : <i>Qui est-ce qui dort ?</i> → <b style="color:#1f6fd1">le chat</b>.</span></div>
                    <div class="asv-step"><span class="n">3</span><span>Je vérifie en encadrant : <b>« C'est… qui »</b> : <i>C'est le chat qui dort.</i></span></div>
                    <div class="asv-step"><span class="n">4</span><span>Je remplace le sujet par un <b>pronom</b> (il, elle, ils, elles…) : <i>le chat → il</i>. Je conjugue le verbe avec ce pronom.</span></div>
                </div>
                <div class="asv-box asv-memo"><b class="t">🧠 Pour retenir : les terminaisons au présent</b>
                    <div class="asv-tables" style="margin-top:6px">${conjTable(CH, null, 'chanter (1er groupe)')}${conjTable(VERBS[2], null, 'finir (2e groupe)')}</div></div>
                <div class="asv-box asv-trap"><b class="t">⚠️ Attention</b>Avec <b>ils</b> ou <b>elles</b>, le verbe se termine presque toujours par <b>-nt</b> : ils chant<b>ent</b>, elles fin<b>issent</b>, ils s<b>ont</b>, elles v<b>ont</b>.</div>
                <div><button class="asv-btn go" data-act="practice" data-v="choisir" data-l="1">✏️ S'entraîner : choisir la forme</button> <button class="asv-btn alt" data-act="tab" data-tab="exp">🛠️ Essayer dans l'atelier</button></div>`;
        }
        function renderLoin() {
            return `<div class="asv-ltitle"><h2 style="color:#059669">📏 Le sujet long ou éloigné du verbe</h2></div>
                <div class="asv-box asv-what"><b class="t">🔤 Le groupe sujet</b>Le sujet peut être un <b>groupe de plusieurs mots</b>. Le verbe s'accorde avec le <b>nom principal</b> du groupe (le <span class="asv-noyau">noyau</span>), pas avec le nom qui est juste à côté du verbe.</div>
                ${sent('[Les *enfants* du ~quartier~] {jouent|ent} dans la cour.')}
                ${sent('[Le *chien* de mes ~voisins~] {aboie|e} toute la nuit.')}
                <div class="asv-box asv-tool">Qui joue ? Les <b>enfants</b> (pas le quartier) → <b>ils</b> jouent. Qui aboie ? Le <b>chien</b> (pas les voisins) → <b>il</b> aboie.</div>
                <div class="asv-box asv-test"><b class="t">🔎 Des mots entre le sujet et le verbe</b>Des mots peuvent se glisser entre le sujet et le verbe. Ils ne changent rien à l'accord.</div>
                ${sent('[Les élèves], ~après la récréation~, {rentrent|ent} en classe.')}
                ${sent('[Les voitures] ~que je vois~ {sont|ont} rouges.')}
                <div class="asv-box asv-memo"><b class="t">🧠 Pour retenir</b>Je pose toujours la question <b>« Qui est-ce qui… ? »</b> et je cherche le <b>nom principal</b> du groupe. Les mots entre virgules ne sont pas le sujet.</div>
                <div class="asv-box asv-trap"><b class="t">⚠️ Le piège</b>Le nom le plus proche du verbe n'est pas forcément le sujet ! Dans <i>Le bouquet de roses sent bon</i>, il y a un seul bouquet : le verbe est au singulier.</div>
                <div><button class="asv-btn go" data-act="practice" data-v="sujet" data-l="2">✏️ S'entraîner : trouver le sujet</button> <button class="asv-btn alt" data-act="exp-set" data-s="13" data-place="loin">🛠️ Essayer dans l'atelier</button></div>`;
        }
        function renderInverse() {
            return `<div class="asv-ltitle"><h2 style="color:#e07b2a">🔄 Le sujet placé après le verbe</h2></div>
                <div class="asv-box asv-what"><b class="t">🔤 Le sujet inversé</b>Parfois, le sujet est placé <b>après</b> le verbe. Le verbe s'accorde quand même avec lui !</div>
                <div class="asv-box asv-test"><b class="t">🔎 Dans une phrase qui commence par un lieu ou un moment</b></div>
                ${sent('Dans la forêt {hurlent|ent} [les loups].')}
                ${sent('Au loin {gronde|e} [le tonnerre].')}
                <div class="asv-box asv-test"><b class="t">🔎 Dans une question</b></div>
                ${sent('Où {habitent|ent} [tes parents] ?')}
                <div class="asv-box asv-test"><b class="t">🔎 Dans un dialogue</b></div>
                ${sent('« Venez vite ! » {crient|ent} [les enfants].')}
                <div class="asv-box asv-memo"><b class="t">🧠 Pour retenir</b>Je pose la question <b>« Qui est-ce qui… ? »</b>, même si le sujet est après le verbe : <i>Qui est-ce qui hurle ?</i> → <b>les loups</b> → <b>ils</b> hurlent.</div>
                <div class="asv-box asv-trap"><b class="t">⚠️ Attention</b>Le mot juste avant le verbe (<i>forêt</i>, <i>loin</i>, <i>Où</i>) n'est pas le sujet.</div>
                <div><button class="asv-btn go" data-act="practice" data-v="choisir" data-l="3">✏️ S'entraîner : niveau piégé</button> <button class="asv-btn alt" data-act="exp-set" data-s="11" data-place="inverse">🛠️ Essayer dans l'atelier</button></div>`;
        }
        function renderPlusieurs() {
            const rows = [['Léa et Tom', 'ils', 'font'], ['Ma sœur et ma cousine', 'elles', 'chantent'], ['Toi et moi', 'nous', 'sommes'], ['Ma cousine et moi', 'nous', 'nageons'], ['Mon frère et toi', 'vous', 'allez'], ['Toi et lui', 'vous', 'êtes']];
            return `<div class="asv-ltitle"><h2 style="color:#7c3aed">👥 Plusieurs sujets pour un verbe</h2></div>
                <div class="asv-box asv-what"><b class="t">🔤 La règle</b>Quand un verbe a <b>plusieurs sujets</b> (reliés par <i>et</i>), il se met au <b>pluriel</b>.</div>
                ${sent('[Le chat et le chien] {dorment|ent} ensemble.')}
                ${sent('[Léa et Tom] {font|ont} leurs devoirs.')}
                <div class="asv-box asv-memo"><b class="t">🧠 Pour retenir : quel pronom ?</b>
                    <ul><li>s'il y a <b>moi</b> dans le groupe → <b>nous</b></li><li>s'il y a <b>toi</b> (et pas moi) → <b>vous</b></li><li>sinon → <b>ils</b> (ou <b>elles</b> si ce sont toutes des filles)</li></ul></div>
                <table class="asv-conj"><tr><th>Sujets</th><th>Pronom</th></tr>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])} <b>${esc(r[2])}</b></td></tr>`).join('')}</table>
                <div class="asv-box asv-trap"><b class="t">⚠️ Attention</b>Une fille et un garçon ensemble : c'est <b>ils</b>. <i>Léa et Tom font</i> → <i>ils font</i>.</div>
                <div><button class="asv-btn go" data-act="practice" data-v="pronom" data-l="2">✏️ S'entraîner : le bon pronom</button> <button class="asv-btn alt" data-act="exp-set" data-s="18" data-place="proche">🛠️ Essayer dans l'atelier</button></div>`;
        }
        function renderPieges() {
            return `<div class="asv-ltitle"><h2 style="color:#D63384">🪤 Les pièges</h2></div>
                <div class="asv-box asv-what"><b class="t">🔤 Les petits mots devant le verbe</b><b>le, la, les, l', leur, me, te, nous, vous, se</b> peuvent se placer devant le verbe. Ce ne sont <b>pas</b> des sujets : ce sont des pronoms compléments.</div>
                ${sent('[Les enfants] ~les~ {regardent|ent} souvent.')}
                ${sent('[Je] ~leur~ {parle|e} doucement.')}
                ${sent('[Mes sœurs], souvent, ~me~ {racontent|ent} des histoires.')}
                <div class="asv-box asv-tool">Qui regarde ? <b>Les enfants</b> → ils regard<b>ent</b>. Qui parle ? <b>Je</b> → je parl<b>e</b> (pas « parlent », même si « leur » veut dire plusieurs personnes).</div>
                <div class="asv-box asv-test"><b class="t">🔎 « On »</b>« On » se conjugue toujours comme <b>il</b> : <i>on joue, on va, on est</i>.</div>
                ${sent('[On] {joue|e} au ballon.')}
                <div class="asv-box asv-test"><b class="t">🔎 « Qui »</b>Après <i>c'est moi qui</i>, <i>c'est toi qui</i>…, le verbe s'accorde avec <b>moi</b>, <b>toi</b>… : « qui » prend leur personne.</div>
                ${sent('C\'est moi [qui] {ferme|e} la porte.')}
                ${sent('C\'est toi [qui] {es|s} le gagnant.')}
                <div class="asv-box asv-memo"><b class="t">🧠 Pour retenir</b>Je ne me fie pas au mot juste devant le verbe : je pose toujours la question <b>« Qui est-ce qui… ? »</b>.</div>
                <div><button class="asv-btn go" data-act="practice" data-v="corriger" data-l="3">✏️ S'entraîner : juste ou faux ?</button></div>`;
        }
        function renderEntendre() {
            return `<div class="asv-ltitle"><h2 style="color:#6C4FD8">👂 Les terminaisons qu'on n'entend pas</h2></div>
                <div class="asv-box asv-what"><b class="t">🔤 À l'oral, souvent pareil</b>Beaucoup de terminaisons ne s'entendent pas : <i>il chante</i> et <i>ils chantent</i> se prononcent de la même façon. Il faut donc <b>réfléchir au sujet</b> pour bien écrire.</div>
                ${sent('[Le maître] {explique|e} la leçon.')}
                ${sent('[Les maîtres] {expliquent|ent} la leçon.')}
                <div class="asv-box asv-tool"><b>e</b> · <b>es</b> · <b>e</b> · <b>ent</b> : on entend le même son, mais on écrit 4 terminaisons différentes : je chant<b>e</b>, tu chant<b>es</b>, il chant<b>e</b>, ils chant<b>ent</b>.</div>
                <div class="asv-box asv-memo"><b class="t">🧠 Pour retenir : quatre verbes très utilisés</b>
                    <div class="asv-tables" style="margin-top:6px">${conjTable(VERBS[3], null, 'être')}${conjTable(VERBS[4], null, 'avoir')}${conjTable(VERBS[5], null, 'aller')}${conjTable(VERBS[6], null, 'faire')}</div></div>
                <div class="asv-box asv-trap"><b class="t">⚠️ Attention</b>Le <b>-ent</b> de « ils chantent » ne se prononce jamais. Mais il faut toujours l'écrire !</div>
                <div><button class="asv-btn go" data-act="practice" data-v="ecrire" data-l="1">✏️ S'entraîner : écrire le verbe</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="asv-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { regle: renderRegle, loin: renderLoin, inverse: renderInverse, plusieurs: renderPlusieurs, pieges: renderPieges, entendre: renderEntendre }[S.lesson] || renderRegle;
            return `<div class="asv-lesson"><div class="asv-side">${side}</div><div class="asv-main">${main()}</div></div>`;
        }

        // =================================================================
        // RENDU : ATELIER
        // =================================================================
        // Construit la phrase de l'atelier (texte avec balisage) et ses éléments
        function buildExp() {
            const E = S.exp, v = VERBS[E.v], s = SUBJ[E.s], form = v.f[s.p];
            let st = s.t;
            if (s.k === 'long') st = st.replace(new RegExp('(^|\\s)(' + s.n + ')(?=\\s|$)'), '$1*$2*').replace(new RegExp('(\\s)(' + s.x + ')$'), '$1~$2~');
            const V = `{${form}|}`;
            let src;
            if (E.place === 'inverse') {
                const low = s.prop ? st : st.charAt(0).toLowerCase() + st.slice(1);
                src = v.inv.replace('{V}', '\u0001').replace('{S}', `[${low}]`);
            } else if (E.place === 'loin') {
                src = `[${st}], chaque matin, \u0001 ${v.c}.`;
            } else if (s.p === 0 && startsVowel(form)) {
                src = `[J']\u0001 ${v.c}.`;
            } else src = `[${st}] \u0001 ${v.c}.`;
            return { v, s, form, src: cap(src), V };
        }
        function renderExp() {
            const E = S.exp, X = buildExp(), v = X.v, s = X.s;
            const sentHtml = mark(X.src).replace('\u0001', `<span class="asv-v">${verbHtml(X.form, s.p)}</span>`);
            const proOff = E.place !== 'proche';
            let h = `<div class="asv-ex">`;
            h += `<div class="asv-panel" style="display:flex;flex-direction:column;gap:8px">
                <div class="asv-chips"><span class="l">1. Le verbe</span>${VERBS.map((x, i) => `<button class="asv-chip ${E.v === i ? 'on' : ''}" style="--c:#e0464f" data-act="exp-v" data-v="${i}">${esc(x.i)}</button>`).join('')}</div>
                <div class="asv-chips"><span class="l">2. La place du sujet</span>${PLACES.map(([k, l]) => `<button class="asv-chip ${E.place === k ? 'on' : ''}" style="--c:#6C4FD8" data-act="exp-place" data-v="${k}">${l}</button>`).join('')}</div>
                <div class="asv-chips"><span class="l">3. Le sujet</span>${proOff ? '<span class="asv-hint">Les pronoms ne s\'utilisent ici que juste avant le verbe.</span>' : ''}</div>
                ${SGROUPS.map(([k, l]) => `<div class="asv-chips"><span class="l asv-gl">${l}</span>${SUBJ.map((x, i) => x.k !== k ? '' : `<button class="asv-chip ${E.s === i ? 'on' : ''}" style="--c:#1f6fd1" data-act="exp-s" data-v="${i}"${k === 'pro' && proOff ? ' disabled' : ''}>${esc(x.t)}</button>`).join('')}</div>`).join('')}
                <div style="display:flex;gap:8px;justify-content:center"><button class="asv-btn alt small" data-act="exp-rnd">🎲 Au hasard</button>${canSpeak ? `<button class="asv-btn alt small" data-act="say">🔊 Écouter</button>` : ''}</div>
            </div>`;
            h += `<div class="asv-panel"><div class="asv-sentwrap big"><svg class="asv-arrow"></svg><div class="asv-sent">${sentHtml}</div></div></div>`;
            // La méthode pas à pas
            const q3 = v.f[2];
            const qWho = `Qui est-ce qui ${q3.match(/^[aeiouyhé]/i) ? '' : ''}${q3} ?`;
            const subjTxt = s.p === 0 && E.place === 'proche' && startsVowel(X.form) ? 'J\'' : s.t;
            h += `<div class="asv-steps">
                <div class="asv-step"><span class="n">1</span><span>Le verbe est <b style="color:#e0464f">${esc(X.form)}</b> (verbe <i>${esc(v.i)}</i>). Je pose la question : <b>${esc(qWho)}</b></span></div>
                <div class="asv-step"><span class="n">2</span><span>Réponse : <b style="color:#1f6fd1">${esc(E.place === 'inverse' && !s.prop ? s.t.charAt(0).toLowerCase() + s.t.slice(1) : subjTxt)}</b>${s.k === 'long' ? ` : le nom principal est <b>${esc(s.n)}</b> (pas « ${esc(s.x)} »)` : ''}${E.place === 'inverse' ? ' : le sujet est placé après le verbe' : ''}${E.place === 'loin' ? ' : « chaque matin » n\'est pas le sujet' : ''}.</span></div>
                <div class="asv-step"><span class="n">3</span><span>Je le remplace par un pronom : <b>${esc(s.t)}</b> → <b>${esc(s.r)}</b>${s.r === 'on' ? ' (comme « il »)' : ''}.</span></div>
                <div class="asv-step"><span class="n">4</span><span>Avec <b>${esc(s.r)}</b>, le verbe <i>${esc(v.i)}</i> s'écrit <span class="asv-v">${verbHtml(X.form, s.p)}</span>.</span></div>
            </div>`;
            h += `<div class="asv-tables">${conjTable(v, s.p, v.i + ' au présent')}</div>`;
            const tip = s.k === 'plus' ? 'Plusieurs sujets : le verbe se met au pluriel.' : s.r === 'on' ? '« On » se conjugue toujours comme « il ».' : s.p === 0 && startsVowel(X.form) && E.place === 'proche' ? 'Devant une voyelle, « je » devient « j\' ».' : '';
            if (tip) h += `<div class="asv-info">💡 ${esc(tip)}</div>`;
            return h + `</div>`;
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
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="asv-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="asv-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="asv-settings">`;
            h += `<div class="asv-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            h += `<div class="asv-srow"><span class="l">2. Niveau</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}<span class="asv-hint">${LEVELS[ex.level].hint}</span></div>`;
            h += `<div class="asv-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="asv-srow"><span class="l">Taille du texte</span><button class="asv-btn alt small" data-act="font" data-d="-2">A−</button><button class="asv-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="asv-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="asv-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="asv-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function card(R, i, inner, title) {
            let cls = '', mk = '';
            if (R.corrected) { const ok = isRight(R, i); cls = ok ? 'ok' : 'ko'; mk = ok ? '✅' : '❌'; }
            return `<div class="asv-q ${cls}"><div class="asv-qtop"><span class="asv-n">${i + 1})</span>${title}<span style="margin-left:auto">${mk}</span></div>${inner}</div>`;
        }
        const mkc = (R, i) => R.corrected ? (isRight(R, i) ? ' ok' : ' ko') : '';
        const why = (R, i, html) => R.corrected && !isRight(R, i) ? `<div class="asv-why">${html}</div>` : '';
        const noteOf = e => e.n ? ` <br><i>${esc(e.n)}</i>` : '';
        // Phrase avec le sujet en bleu et le verbe (ou un trou) en rouge
        function sentenceHtml(e, verbHtmlStr) {
            const parts = e.t.split('___');
            let html = esc(parts[0]) + verbHtmlStr + esc(parts[1] || '');
            return html;
        }
        function withSubject(e, verbStr) {
            // Met le sujet en évidence dans la phrase complète
            const R = subjectRange(e);
            // On retrouve les mots en sautant le trou (qui compte pour un mot)
            let out = '', src = e.t.replace('___', '\u0002'), pos = 0;
            const toks = [];
            src.replace(new RegExp(`[${WORD}\u0002]+(?:['’][${WORD}]+)*(?:-[${WORD}]+)*|[^\\s${WORD}\u0002]`, 'g'), (m, off) => { toks.push({ m, off }); return m; });
            toks.forEach((t, i) => {
                out += esc(src.slice(pos, t.off));
                const w = t.m === '\u0002' ? verbStr : esc(t.m);
                out += R && i >= R[0] && i <= R[1] ? `<span class="asv-s">${w}</span>` : w;
                pos = t.off + t.m.length;
            });
            return out + esc(src.slice(pos));
        }
        function renderQuestions(R) {
            const T = R.type;
            if (T === 'choisir') return `<div class="asv-grid">` + R.qs.map((q, i) => {
                const e = entryOf(q), a = R.ans[i];
                const btns = q.opts.map(o => {
                    let c = a === o ? 'on' : '';
                    if (R.corrected) c = o === e.g ? 'good' : (a === o ? 'bad' : '');
                    return `<button class="asv-opt ${c}"${R.corrected ? '' : ` data-act="pick" data-i="${i}" data-v="${esc(o)}"`}>${esc(o)}</button>`;
                }).join('');
                const h = `<div class="asv-qsent">${sentenceHtml(e, `<span class="asv-blank">${a && !R.corrected ? esc(a) : R.corrected ? `<span class="asv-v">${esc(e.g)}</span>` : '…'}</span>`)}</div><div class="asv-opts">${btns}</div>` + why(R, i, `Le sujet est <b style="color:#1f6fd1">${esc(e.s)}</b> (${esc(e.p)}).${noteOf(e)}`);
                return card(R, i, h, 'Choisis la bonne forme du verbe');
            }).join('') + `</div>`;
            if (T === 'ecrire') return `<div class="asv-grid">` + R.qs.map((q, i) => {
                const e = entryOf(q), a = R.ans[i] || '';
                const inp = `<input class="asv-ans mini${mkc(R, i)}" data-in="ans" data-i="${i}" value="${esc(a)}" autocomplete="off" autocapitalize="off" spellcheck="false"${R.corrected ? ' disabled' : ''} placeholder="…">`;
                const h = `<div class="asv-qsent">${sentenceHtml(e, inp)}</div><div style="text-align:center" class="asv-inf">(${esc(e.i)}, au présent)</div>` + why(R, i, `✔ <b style="color:#e0464f">${esc(e.g)}</b> : le sujet est <b style="color:#1f6fd1">${esc(e.s)}</b> (${esc(e.p)}).${noteOf(e)}`);
                return card(R, i, h, 'Écris le verbe au présent');
            }).join('') + `</div>`;
            if (T === 'pronom') return `<div class="asv-grid">` + R.qs.map((q, i) => {
                const e = entryOf(q), a = R.ans[i];
                const btns = ['il', 'elle', 'ils', 'elles', 'nous', 'vous'].map(o => {
                    let c = a === o ? 'on' : '';
                    if (R.corrected) c = o === e.p ? 'good' : (a === o ? 'bad' : '');
                    return `<button class="asv-opt ${c}"${R.corrected ? '' : ` data-act="pick" data-i="${i}" data-v="${o}"`}>${o}</button>`;
                }).join('');
                const h = `<div class="asv-qsent">${withSubject(e, `<span class="asv-v">${esc(e.g)}</span>`)}</div><div class="asv-opts">${btns}</div>` + why(R, i, `<b style="color:#1f6fd1">${esc(e.s)}</b> → <b>${esc(e.p)}</b> ${esc(e.g)}.${noteOf(e)}`);
                return card(R, i, h, 'Par quel pronom remplacer le sujet (en bleu) ?');
            }).join('') + `</div>`;
            if (T === 'sujet') return `<div class="asv-grid one">` + R.qs.map((q, i) => {
                const e = entryOf(q), a = Array.isArray(R.ans[i]) ? R.ans[i] : [], Rg = subjectRange(e);
                const toks = tokens(filled(e));
                const verbIdx = tokens(e.t.split('___')[0]).length;
                let h = toks.map((t, j) => {
                    if (!isWord(t)) return `<span>${esc(t)}</span>`;
                    const inS = Rg && j >= Rg[0] && j <= Rg[1], sel = a.indexOf(j) !== -1;
                    let c = sel ? 'sel' : '';
                    if (R.corrected) c = sel ? (inS ? 'good' : 'bad') : (inS ? 'miss' : '');
                    const isV = j === verbIdx;
                    return `<span class="asv-tok w ${c}"${R.corrected ? '' : ` data-act="tok" data-i="${i}" data-v="${j}"`}${isV ? ' style="color:#e0464f"' : ''}>${esc(t)}</span>`;
                }).join(' ').replace(/ (<span>[,.!?;:»)]<\/span>)/g, '$1').replace(/(<span>[«(]<\/span>) /g, '$1');
                h = `<div class="asv-qsent">${h}</div>` + why(R, i, `Le sujet est <b style="color:#1f6fd1">${esc(e.s)}</b>.${noteOf(e)}`);
                return card(R, i, h, `Touche tous les mots du sujet du verbe <b style="color:#e0464f">${esc(e.g)}</b>`);
            }).join('') + `</div>`;
            // Juste ou faux ?
            return `<div class="asv-grid">` + R.qs.map((q, i) => {
                const e = entryOf(q), a = R.ans[i] || {};
                const good = q.ok;
                const b = (k, lbl) => {
                    let c = a.j === k ? 'on' : '';
                    if (R.corrected) c = (k === 'ok') === good ? 'good' : (a.j === k ? 'bad' : '');
                    return `<button class="asv-opt ${c}"${R.corrected ? '' : ` data-act="judge" data-i="${i}" data-v="${k}"`}>${lbl}</button>`;
                };
                let h = `<div class="asv-qsent">${sentenceHtml(e, `<span class="asv-v">${esc(q.shown)}</span>`)}</div><div class="asv-opts">${b('ok', '✔ Juste')}${b('ko', '✘ Faux')}</div>`;
                if (a.j === 'ko') h += `<div style="text-align:center">Correction : <input class="asv-ans mini${R.corrected && !good ? (norm(a.t) === norm(e.g) ? ' ok' : ' ko') : ''}" data-in="cor" data-i="${i}" value="${esc(a.t || '')}" autocomplete="off" autocapitalize="off" spellcheck="false"${R.corrected ? ' disabled' : ''} placeholder="${esc(e.i)}"></div>`;
                h += why(R, i, good ? `L'accord était juste : <b style="color:#1f6fd1">${esc(e.s)}</b> ${esc(e.g)}.` : `Il fallait écrire <b style="color:#e0464f">${esc(e.g)}</b> : le sujet est <b style="color:#1f6fd1">${esc(e.s)}</b> (${esc(e.p)}).${noteOf(e)}`);
                return card(R, i, h, 'L\'accord du verbe est-il juste ?');
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="asv-topbar"><span class="asv-pill">${EXT[R.type].label} · ${R.qs.length} questions</span>
                ${sc ? `<span class="asv-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="asv-actions">
                <button class="asv-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="asv-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="asv-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="asv-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="asv-info">Choisis l'exercice et le niveau, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        // ── Flèches sujet → verbe (dessinées après l'affichage) ──
        function drawArrows() {
            body.querySelectorAll('.asv-sentwrap').forEach(wrap => {
                const svg = wrap.querySelector('.asv-arrow'), s = wrap.querySelector('.asv-s'), v = wrap.querySelector('.asv-v');
                if (!svg) return;
                if (!s || !v || !wrap.offsetWidth) { svg.innerHTML = ''; return; }
                const pos = el => { let x = 0, y = 0, n = el; while (n && n !== wrap) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: el.offsetWidth }; };
                const a = pos(s), b = pos(v);
                const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2, y1 = a.y + 2, y2 = b.y - 1;
                const top = Math.min(y1, y2) - Math.min(30, 14 + Math.abs(x2 - x1) / 8);
                const id = 'asvh' + Math.random().toString(36).slice(2, 8);
                svg.setAttribute('viewBox', `0 0 ${wrap.offsetWidth} ${wrap.offsetHeight}`);
                svg.innerHTML = `<defs><marker id="${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#e0464f"/></marker></defs>
                    <path d="M${x1} ${y1} C ${x1} ${top}, ${x2} ${top}, ${x2} ${y2}" fill="none" stroke="#1f6fd1" stroke-width="3" stroke-dasharray="7 5" stroke-linecap="round" marker-end="url(#${id})"/>`;
            });
        }

        function render() {
            container.querySelectorAll('.asv-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : S.tab === 'exp' ? renderExp() : renderLesson();
            body.scrollTop = top;
            drawArrows();
        }
        if (typeof ResizeObserver === 'function') new ResizeObserver(() => drawArrows()).observe(body);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawArrows);

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'asv-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }
        function setPlace(pl) {
            const E = S.exp;
            E.place = pl;
            if (pl !== 'proche' && SUBJ[E.s].k === 'pro') E.s = 11;   // un pronom ne peut pas s'éloigner ni s'inverser ici
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run, ex = S.ex, E = S.exp;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🚂 L\'accord sujet-verbe', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); render(); return;
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
                // Atelier
                case 'exp-set': S.tab = 'exp'; E.s = +el.dataset.s; setPlace(el.dataset.place); body.scrollTop = 0; break;
                case 'exp-v': E.v = +el.dataset.v; sfx('pop'); break;
                case 'exp-s': E.s = +el.dataset.v; sfx('pop'); break;
                case 'exp-place': setPlace(el.dataset.v); sfx('pop'); break;
                case 'exp-rnd': {
                    E.v = Math.floor(Math.random() * VERBS.length);
                    E.place = pick(['proche', 'proche', 'loin', 'inverse']);
                    const ok = SUBJ.map((x, i) => i).filter(i => E.place === 'proche' || SUBJ[i].k !== 'pro');
                    E.s = pick(ok); sfx('pop'); break;
                }
                case 'say': { const X = buildExp(); speak(X.src.replace(/[\[\]*~]/g, '').replace('\u0001', X.form).replace(/\{[^}]*\}/g, '')); return; }
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
                case 'judge': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, cur = Object.assign({}, R.ans[i] || {});
                    cur.j = el.dataset.v; R.ans[i] = cur; sfx('pop'); break;
                }
                case 'tok': {
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
            if (e.target.closest('.asv-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.asv-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // ── Saisie dans les champs (sans tout redessiner) ──
        container.addEventListener('input', e => {
            const t = e.target, R = S.run;
            if (!R) return;
            if (t.dataset.in === 'ans') { R.ans[+t.dataset.i] = t.value; saveSoon(); }
            else if (t.dataset.in === 'cor') { const i = +t.dataset.i; R.ans[i] = Object.assign({}, R.ans[i] || {}, { t: t.value }); saveSoon(); }
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
            const up = () => { resizeHandle.removeEventListener('pointermove', mv); resizeHandle.removeEventListener('pointerup', up); save(); drawArrows(); };
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
        widget._asvGetData = function () {
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
            drawArrows();
            save();
        }));
        return widget;
    };

    // Accès au moteur (tests)
    window._asvEngine = { BANK, VERBS, SUBJ, tokens, subjectRange, genQuestions, isRightQ, verbHtml, norm };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createAccordSujetWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
