// =========================================================================
// ACTIVITÉ « LA PHRASE » — Le Bureau du Prof
// (remplace « Phrase en désordre » : même type 'phrase-desordre', donc les
//  tableaux déjà sauvegardés et save-load.js continuent de fonctionner)
// Leçons + exercices corrigés (même présentation que « La conjugaison »).
//
// 📖 Leçons : qu'est-ce qu'une phrase (dont phrase verbale / non verbale),
//    les 3 types de phrases, les formes (affirmative / négative, exclamative),
//    la phrase simple / complexe.
// ✏️ Exercices :
//    🔀 Phrase en désordre : remettre les mots dans l'ordre (toucher ou
//       glisser), indices, écoute, passer, série de phrases avec étoiles.
//    🏷️ Types de phrases : déclarative, interrogative, impérative.
//    ➖ Formes de phrases : affirmative ou négative, exclamative ou non,
//       ou transformer une phrase (forme négative / affirmative).
// Terminologie grammaticale actuelle : 3 types (déclaratif, interrogatif,
// impératif) ; « exclamative » est une FORME, comme « négative ».
//    ✂️ Simple ou complexe : compter les verbes conjugués.
//
// Ouverture : createWidget('phrase-desordre')  ou  createPhraseWidget()
// Sauvegarde : w._pdsGetData()  /  createPhraseWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'phrase-desordre';

    function _isPhone() {
        if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }

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
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
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
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
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

    // ── CSS (préfixe p2-) ─────────────────────────────────────────────────
    if (!document.getElementById('p2-style')) {
        const s = document.createElement('style');
        s.id = 'p2-style';
        s.textContent = `
.widget[data-type="phrase-desordre"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.p2-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.p2-container input, .p2-container textarea { user-select:text; -webkit-user-select:text; }
.p2-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .p2-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .p2-tab-lbl { display:none; }
    .p2-title { font-size:17px !important; }
    .p2-lesson { flex-direction:column; }
    .p2-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .p2-gbtn { flex:1 1 auto; text-align:center !important; }
    .p2-srow > .l { min-width:0 !important; width:100%; }
}
.p2-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.p2-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.p2-tabs { display:flex; gap:6px; margin-left:12px; }
.p2-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.p2-tab:hover { background:rgba(255,255,255,.1); }
.p2-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.p2-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.p2-icon-btn:hover { background:rgba(255,255,255,.28); }
.p2-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* ── Leçons ── */
.p2-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.p2-side { width:200px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.p2-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.p2-gbtn:hover { transform:translateX(2px); }
.p2-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.p2-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.p2-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.p2-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.p2-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.p2-box ul { margin:4px 0 0; padding-left:20px; }
.p2-what { background:#f1edff; border:2px solid #c8bbf5; }
.p2-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.p2-memo { background:#fff6d6; border:2px solid #f3d36b; }
.p2-trap { background:#ffecee; border:2px solid #f6a7b0; }
.p2-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.p2-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
.p2-card { background:#fff; border-radius:14px; border:3px solid var(--c); padding:8px 12px; display:flex; flex-direction:column; gap:4px; }
.p2-card-h { font-weight:900; color:var(--c); font-size:16px; }
.p2-card .d { font-size:14px; line-height:1.4; color:#4a4360; }
.p2-ex { font-family:'MDI',cursive; font-size:21px; line-height:1.5; }
.p2-ex b.neg { color:#EB5757; }
.p2-ex b.vb { color:#27AE60; border-bottom:3px solid #27AE60; }
.p2-ex .no { color:#c0293a; }
.p2-ex .yes { color:#178a4b; }
.p2-big-punct { font-size:30px; font-weight:900; color:var(--c); }
.p2-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.p2-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.p2-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.p2-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.p2-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.p2-btn:disabled { opacity:.45; }

/* ── Exercices ── */
.p2-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.p2-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.p2-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.p2-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.p2-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.p2-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.p2-hint { font-size:12.5px; color:#6a6380; }
.p2-mine { width:100%; box-sizing:border-box; min-height:110px; resize:vertical; font:inherit; font-size:19px; font-family:'MDI',cursive; padding:8px 10px;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; }
.p2-mine:focus { border-color:var(--violet); }
.p2-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.p2-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.p2-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.p2-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.p2-pill.score { background:var(--vert); font-size:16px; }
.p2-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.p2-dots { display:flex; gap:4px; flex-wrap:wrap; }
.p2-dot { width:13px; height:13px; border-radius:50%; background:#e3d8c3; }
.p2-dot.good { background:var(--vert); } .p2-dot.meh { background:#FFB020; } .p2-dot.cur { background:var(--violet); box-shadow:0 0 0 3px #cfc3f7; }
/* Phrase en désordre */
.p2-zone { display:flex; flex-wrap:wrap; gap:calc(var(--f) * .35); justify-content:center; align-items:center; padding:calc(var(--f) * .5);
    border-radius:16px; min-height:calc(var(--f) * 2.4); }
.p2-zone.line { background:#fff; border:3px dashed #c8bbf5; }
.p2-zone.line.won { border:3px solid var(--vert); background:#f3fcf7; }
.p2-zone.pool { background:#faf7f0; border:2px solid #e3d8c3; }
.p2-zone.drop { border-color:var(--violet); background:#f6f2ff; }
.p2-zlabel { font-size:13px; font-weight:900; color:#9a8f7a; text-align:center; margin-bottom:-6px; }
.p2-w { font-family:'MDI',cursive; font-size:var(--f); font-weight:700; line-height:1.2; background:#fff; border:2px solid #d1c6ad; border-radius:10px;
    padding:.1em .45em; touch-action:none; box-shadow:0 3px 0 rgba(42,31,74,.12); white-space:nowrap; }
.p2-w.punct { min-width:1em; text-align:center; background:#fff6d6; }
.p2-w.locked { background:#ece6ff; border-color:#c8bbf5; box-shadow:none; }
.p2-w.ok { border-color:var(--vert); background:#e2f7ec; color:#178a4b; }
.p2-w.ko { border-color:var(--rouge); background:#ffe9eb; color:#c0293a; }
.p2-w.hinted { border-color:#f3d36b; box-shadow:0 0 0 4px #ffe9a8; }
.p2-w.dragging { opacity:.3; }
.p2-say { border-radius:14px; padding:8px 14px; font-size:16px; line-height:1.5; text-align:center; background:#f1edff; border:2px solid #c8bbf5; }
.p2-say.good { background:#e2f7ec; border-color:#8fd8b0; }
.p2-say.bad { background:#ffe9eb; border-color:#f6a7b0; }
.p2-final { text-align:center; display:flex; flex-direction:column; gap:8px; align-items:center; }
.p2-final .medal { font-size:60px; }
.p2-ghost { position:fixed; z-index:99999; pointer-events:none; transform:translate(-50%,-50%) rotate(2deg); font-family:'MDI',cursive; font-weight:700;
    background:var(--violet); color:#fff; border-radius:10px; padding:.1em .45em; box-shadow:0 8px 20px rgba(60,40,140,.35); white-space:nowrap; }
/* Questions */
.p2-grid { --gap:calc(var(--f) * .55); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 2 * var(--gap)) / 3), min(100%, 280px)),1fr)); }
.p2-grid.wide { grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 340px)),1fr)); }
.p2-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .4) calc(var(--f) * .6) calc(var(--f) * .5); box-shadow:0 3px 0 rgba(42,31,74,.08); }
.p2-q.ok { border-color:var(--vert); background:#f3fcf7; }
.p2-q.ko { border-color:var(--rouge); background:#fff5f6; }
.p2-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px; font-size:14px; font-weight:800; color:#5a5470; }
.p2-num { font-weight:900; color:#9a8f7a; }
.p2-qsent { font-family:'MDI',cursive; font-size:calc(var(--f) * .85); line-height:1.5; text-align:center; margin-bottom:calc(var(--f) * .3); }
.p2-qsent b.vb { color:#27AE60; border-bottom:3px solid #27AE60; }
.p2-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.p2-choice { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:3px 10px; font:inherit; font-weight:900; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.p2-choice.on { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; }
.p2-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.p2-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.p2-in { width:100%; box-sizing:border-box; border:none; border-bottom:3px solid #d9cdb6; background:transparent; font:inherit; font-family:'MDI',cursive;
    font-size:calc(var(--f) * .8); font-weight:700; color:#3949AB; outline:none; padding:2px 4px; border-radius:6px 6px 0 0; }
.p2-in:focus { border-bottom-color:var(--violet); background:#f6f2ff; }
.p2-in.ok { color:#178a4b; border-bottom-color:var(--vert); }
.p2-in.ko { color:var(--rouge); border-bottom-color:var(--rouge); }
.p2-in:disabled { opacity:1; -webkit-text-fill-color:currentColor; }
.p2-sol { font-family:'MDI',cursive; font-size:calc(var(--f) * .7); color:#178a4b; font-weight:700; text-align:center; margin-top:4px; }
.p2-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:p2-fall 1.6s ease-in forwards; }
@keyframes p2-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.p2-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:400px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.p2-help.show { display:block; }
.p2-help h4 { margin:0 0 6px; font-size:15px; }
.p2-help p { margin:0 0 6px; }
.p2-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.p2-container:hover .p2-resize { opacity:1; }
.p2-container.wf-fullboard .p2-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="phrase-desordre"], .p2-container, .p2-container * { cursor:default !important; }
.p2-container .p2-header { cursor:grab !important; }
.p2-container .p2-header:active { cursor:grabbing !important; }
/* Le doigt qui clique sur tout ce qui est cliquable */
.p2-container button, .p2-container [data-act], .p2-container .p2-w[data-i]:not(.locked),
.p2-container .p2-header button { cursor:pointer !important; }
.p2-container .p2-zone, .p2-container button:disabled { cursor:default !important; }
.p2-container input, .p2-container textarea { cursor:text !important; }
.p2-container input:disabled { cursor:default !important; }
.p2-container .p2-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES
    // =====================================================================
    // Phrases en désordre — un autre ordre juste peut être donné après « | »
    const SENT = {
        1: [
            'Le chien court vite.', 'Ma sœur lit un livre.', 'Papa prépare le repas.', 'Les oiseaux chantent le matin.',
            'Tom mange une pomme.', 'La maîtresse écrit au tableau.', 'Le soleil brille fort.', 'Nous jouons au ballon.',
            'Mon chat aime le lait.', 'Les enfants rient beaucoup.', 'Léa dessine une maison.', 'Le bébé dort bien.',
            'Le lapin mange une carotte.', 'Maman chante une chanson.', 'Le train arrive en gare.', 'Les fleurs sont jolies.',
            'Je range ma chambre.', 'Le poisson nage vite.', 'Il fait très beau.', 'Tu as un joli vélo.'
        ],
        2: [
            'Le petit chien joue dans la cour.', 'Où as-tu caché le trésor ?', 'Quelle belle journée d\'été !',
            'La grenouille saute dans la mare.', 'Mon grand frère joue du piano.', 'Veux-tu venir jouer avec moi ?',
            'Le boulanger vend du pain frais.', 'Les vaches mangent l\'herbe du pré.', 'Attention au chien méchant !',
            'Julie a perdu sa trousse rouge.', 'Le pompier éteint un grand feu.', 'Pourquoi le ciel est-il bleu ?',
            'Les feuilles tombent en automne.', 'Mon oncle habite dans une grande ville.',
            'Nous partons à la mer demain.|Nous partons demain à la mer.',
            'Les élèves écoutent la maîtresse attentivement.|Les élèves écoutent attentivement la maîtresse.',
            'Mes parents regardent un film ce soir.', 'Quel gâteau délicieux !', 'As-tu fini ton dessin ?'
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
            'Pourquoi les feuilles des arbres tombent-elles en automne ?'
        ]
    };
    const PROPER = ['Tom', 'Léa', 'Julie', 'Léo'];
    const PUNCT = ['.', '!', '?', '…'];
    const LEVELS = { 1: { label: '😊 Facile', color: '#2FBF71' }, 2: { label: '😐 Moyen', color: '#F2994A' }, 3: { label: '😤 Difficile', color: '#EB5757' } };

    // Types de phrases
    const TYPES = {
        decl: { label: 'Déclarative',   color: '#2F80ED', punct: '. ou !',   role: 'Elle <b>donne une information</b>, raconte ou décrit.' },
        inter:{ label: 'Interrogative', color: '#9B51E0', punct: '?',        role: 'Elle <b>pose une question</b>.' },
        imp:  { label: 'Impérative',    color: '#27AE60', punct: '. ou !',   role: 'Elle <b>donne un ordre</b> ou un conseil. Le verbe est à l\'impératif, sans sujet.' }
    };
    const TYPE_ORDER = ['decl', 'inter', 'imp'];
    const TYPE_BANK = {
        decl: ['Le chat dort sur le canapé.', 'Nous partons en vacances demain.', 'Il pleut depuis ce matin.', 'Mon frère a dix ans.',
               'La neige tombe doucement.', 'Les élèves lisent en silence.', 'Le boulanger se lève très tôt.', 'Paris est la capitale de la France.',
               'Comme il fait chaud aujourd\'hui !', 'Ce dessin est magnifique !', 'Tu as beaucoup grandi !'],
        inter: ['As-tu fini tes devoirs ?', 'Où habite ta grand-mère ?', 'Est-ce que tu viens avec nous ?', 'Quelle heure est-il ?',
                'Pourquoi le ciel est-il bleu ?', 'Qui a mangé le gâteau ?', 'Combien de frères as-tu ?', 'Aimes-tu les épinards ?'],
        imp: ['Range ta chambre.', 'Fermez la porte, s\'il vous plaît.', 'Viens ici tout de suite !', 'Écoutez bien la consigne.',
              'Prends ton manteau.', 'Ne cours pas dans le couloir !', 'Mangeons ensemble.', 'Lève le doigt pour parler.']
    };

    // Forme affirmative / négative : [affirmative, négative]
    const FORME_PAIRS = [
        ['Le chat dort.', 'Le chat ne dort pas.'],
        ['Il aime les épinards.', 'Il n\'aime pas les épinards.'],
        ['Nous allons à la piscine.', 'Nous n\'allons pas à la piscine.'],
        ['Tu regardes la télévision.', 'Tu ne regardes pas la télévision.'],
        ['Léa est malade.', 'Léa n\'est pas malade.'],
        ['Les oiseaux chantent.', 'Les oiseaux ne chantent pas.'],
        ['J\'aime le chocolat.', 'Je n\'aime pas le chocolat.'],
        ['Mon frère joue au football.', 'Mon frère ne joue pas au football.'],
        ['Vous êtes en retard.', 'Vous n\'êtes pas en retard.'],
        ['Elle écoute la musique.', 'Elle n\'écoute pas la musique.'],
        ['Le magasin ouvre le dimanche.', 'Le magasin n\'ouvre pas le dimanche.'],
        ['Il fait froid.', 'Il ne fait pas froid.'],
        ['Les enfants sont sages.', 'Les enfants ne sont pas sages.'],
        ['Je connais cette chanson.', 'Je ne connais pas cette chanson.'],
        ['Tom a faim.', 'Tom n\'a pas faim.'],
        ['Nous habitons à Lyon.', 'Nous n\'habitons pas à Lyon.']
    ];
    // Forme exclamative / non exclamative
    const EXCL_YES = ['Quel beau château !', 'Comme il fait chaud aujourd\'hui !', 'Quelle belle surprise !', 'Que ce gâteau est bon !',
        'Ce dessin est magnifique !', 'Viens ici tout de suite !', 'Ne cours pas dans le couloir !', 'Comme tu as grandi !', 'Quel orage terrible !', 'Il ne fait pas beau !'];
    const EXCL_NO = ['Le chat dort sur le canapé.', 'Il fait chaud aujourd\'hui.', 'As-tu fini tes devoirs ?', 'Range ta chambre.',
        'Ce dessin est joli.', 'Où habite ta grand-mère ?', 'Prends ton manteau.', 'Il ne fait pas beau.', 'Tu as grandi.', 'Nous partons demain.'];
    const FORME_EXTRA_NEG = ['Il ne pleut jamais ici.', 'Je ne vois personne.', 'Elle ne mange plus de bonbons.', 'Il n\'y a rien dans la boîte.', 'Nous ne sortons jamais le soir.'];

    // Phrases simples / complexes : les verbes conjugués sont entre crochets
    const SC_BANK = {
        simple: ['Le chat [dort] sur le canapé.', 'Les élèves [écoutent] la maîtresse.', 'Demain, nous [irons] au cinéma.',
                 'Mon père [répare] son vélo dans le garage.', 'Les feuilles [tombent] en automne.', 'Ma petite sœur [dessine] un grand soleil jaune.',
                 'Le train [arrive] en gare à huit heures.', 'Pendant la récréation, les enfants [jouent] au ballon.', 'Je [veux] jouer dehors.',
                 'Hier, nous [avons visité] un musée.'],
        complexe: ['Le chien [aboie] et le chat [s\'enfuit].', 'Quand il [pleut], je [reste] à la maison.', 'Je [pense] que tu [as] raison.',
                   'Le garçon qui [court] [est] mon frère.', 'Il [prend] son sac, [ouvre] la porte et [sort].', 'Nous [mangerons] dehors s\'il [fait] beau.',
                   'Elle [chante] pendant qu\'il [joue] du piano.', 'Le livre que je [lis] [est] passionnant.', 'Les oiseaux [chantent] quand le soleil [se lève].',
                   'Tom [a mangé] parce qu\'il [avait] faim.']
    };

    const LESSONS = [
        { id: 'phrase', label: '🧩 La phrase',          color: '#6C4FD8' },
        { id: 'types',  label: '🔣 Les types',          color: '#2F80ED' },
        { id: 'forme',  label: '➖ Les formes',          color: '#EB5757' },
        { id: 'simple', label: '✂️ Simple ou complexe', color: '#27AE60' }
    ];

    // ── Utilitaires ───────────────────────────────────────────────────────
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    function tokenize(sentence) {
        const s = String(sentence).trim().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
        const m = s.match(/^(.*?)\s*([.!?…])$/);
        if (m && m[1]) return m[1].split(' ').filter(Boolean).concat([m[2]]);
        return s.split(' ').filter(Boolean);
    }
    function joinTokens(tokens) { return tokens.join(' ').replace(/ ([.…])/g, '$1').replace(/ ([!?])/g, ' $1'); }
    function parseCustom(text) {
        return String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && l.split('|').every(v => tokenize(v).length >= 2));
    }
    // Verbes entre crochets → surlignés
    const verbsHtml = s => esc(s).replace(/\[([^\]]+)\]/g, '<b class="vb">$1</b>');
    const plainVerbs = s => s.replace(/[\[\]]/g, '');
    const countVerbs = s => (s.match(/\[/g) || []).length;
    // Mots de la négation en couleur
    const negHtml = s => esc(s).replace(/\b(ne|n'|pas|jamais|plus|rien|personne)\b/gi, '<b class="neg">$1</b>');
    function normSent(s) {
        return String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/\s*'\s*/g, "'").replace(/\s+/g, ' ').replace(/\s*([.!?…,])\s*/g, '$1').replace(/[.!?…]+$/, '').trim();
    }

    // Lecture à voix haute
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
        } catch (e) {}
    }

    // Sons courts (Web Audio, sans fichier)
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
        bad:  () => { tone(220, 0, 0.18, 'square', 0.05); tone(170, 0.16, 0.25, 'square', 0.05); },
        pop:  () => tone(880, 0, 0.06, 'sine', 0.05),
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'phrase',
            ex: { type: 'desordre', level: 1, dmode: 'auto', mine: '', clues: true, nd: 8,
                  types: TYPE_ORDER.slice(), nt: 8, fmode: 'recog', fdir: 'neg', nf: 6, ns: 6 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createPhraseWidget = function (saved) {
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
        container.className = 'p2-container';
        container.innerHTML = `
            <div class="p2-header">
                <span class="p2-title">✍️ La phrase</span>
                <div class="p2-tabs">
                    <button class="p2-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="p2-tab-lbl">Leçons</span></button>
                    <button class="p2-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="p2-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="p2-icon-btn" data-act="sound" title="Son"></button>
                    <button class="p2-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="p2-body"></div>
            <div class="p2-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — Ce qu'est une phrase (avec la phrase verbale et non verbale), les 3 types de phrases, les formes (affirmative, négative, exclamative) et la phrase simple ou complexe. Chaque leçon a des exemples, une astuce, un piège et un bouton pour s'entraîner.</p>
                <p><b>✏️ Exercices</b> — Quatre types :</p>
                <p>🔀 <b>Phrase en désordre</b> : touche les mots dans l'ordre (ou glisse-les) pour reconstruire la phrase, puis <b>✔ Vérifier</b>. Touche un mot de la phrase pour le renvoyer en bas. <b>💡 Indice</b> place le mot suivant, <b>🔊 Écouter</b> lit la phrase. Les indices (majuscule + point) peuvent être retirés. Tu peux aussi écrire <b>tes propres phrases</b> (une par ligne ; un autre ordre correct après « | »).</p>
                <p>🏷️ <b>Types de phrases</b>, ➖ <b>Formes de phrases</b> (affirmative ou négative, exclamative ou non, transformer) et ✂️ <b>Simple ou complexe</b> : une série de questions, puis <b>👁 Correction</b> avec le score.</p>
            </div>
            <div class="p2-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.p2-body');
        const help = container.querySelector('.p2-help');
        const resizeHandle = container.querySelector('.p2-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        } else if (saved && saved.level) {
            // Ancienne sauvegarde « Phrase en désordre » : on reprend ses réglages
            S.ex.level = [1, 2, 3].includes(+saved.level) ? +saved.level : 1;
            S.ex.clues = saved.clues !== false;
            if (typeof saved.customText === 'string') S.ex.mine = saved.customText;
            if (saved.useCustom && parseCustom(S.ex.mine).length) S.ex.dmode = 'mine';
            S.tab = 'train';
        }
        let msg = '', sel = null;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // PHRASE EN DÉSORDRE
        // =================================================================
        function loadSentence(R) {
            const raw = R.queue[R.qi];
            R.answers = raw.split('|').map(v => {
                let tk = tokenize(v);
                if (!R.clues) {
                    tk = tk.filter(x => !PUNCT.includes(x));
                    if (!PROPER.includes(tk[0])) tk[0] = tk[0].charAt(0).toLowerCase() + tk[0].slice(1);
                }
                return tk;
            });
            R.toks = R.answers[0].map(t => ({ t, punct: PUNCT.includes(t), locked: false }));
            R.line = [];
            if (R.level === 1 && R.clues && R.toks.length > 2) {
                R.toks[0].locked = true; R.line = [0];
                const last = R.toks.length - 1;
                if (R.toks[last].punct) { R.toks[last].locked = true; R.line.push(last); }
            }
            const rest = R.toks.map((_, i) => i).filter(i => !R.line.includes(i));
            let mixed, tries = 0;
            do { mixed = shuffle(rest); tries++; } while (rest.length > 1 && mixed.join() === rest.join() && tries < 20);
            R.pool = mixed;
            R.errors = 0; R.hints = 0; R.marks = null; R.hinted = null; R.phase = 'play';
            const n = R.queue.length;
            R.say = { mood: '', html: R.level === 1 && R.clues && R.toks.length > 2
                ? `🦉 Phrase ${R.qi + 1} sur ${n}. Le premier mot${R.toks[R.toks.length - 1].locked ? ' et le point sont déjà placés' : ' est déjà placé'} 📌 : range les autres mots !`
                : R.clues ? `🦉 Phrase ${R.qi + 1} sur ${n}. Cherche le mot avec une <b>majuscule</b> pour commencer, et garde le <b>point</b> pour la fin !`
                          : `🦉 Phrase ${R.qi + 1} sur ${n}. Sans indices : lis bien tous les mots avant de commencer.` };
        }
        const curTexts = R => R.line.map(i => R.toks[i].t);
        function putInLine(R, id, at) {
            R.pool = R.pool.filter(x => x !== id);
            R.line = R.line.filter(x => x !== id);
            if (at === undefined || at > R.line.length) at = R.line.length;
            // Ne jamais placer un mot après le point verrouillé, ni avant le 1er mot verrouillé
            const li = R.line.length - 1;
            if (li >= 0 && R.toks[R.line[li]].locked && R.toks[R.line[li]].punct && at > li) at = li;
            if (R.line.length && R.toks[R.line[0]].locked && at < 1) at = 1;
            R.line.splice(at, 0, id);
        }
        function putInPool(R, id) {
            if (R.toks[id].locked) return;
            R.line = R.line.filter(x => x !== id);
            if (!R.pool.includes(id)) R.pool.push(id);
        }
        function dCheck(R) {
            if (R.phase !== 'play') return;
            if (R.pool.length) { R.say = { mood: 'bad', html: '✋ Place d\'abord tous les mots dans la phrase.' }; return; }
            const cur = curTexts(R);
            const match = R.answers.find(a => a.join('\u0001') === cur.join('\u0001'));
            if (match) {
                const st = R.errors === 0 && R.hints === 0 ? 3 : R.errors + R.hints <= 2 ? 2 : 1;
                R.stars += st; R.results[R.qi] = st === 3 ? 'good' : 'meh'; R.phase = 'won'; R.marks = null;
                R.say = { mood: 'good', html: `🎉 ${pick(['Bravo', 'Parfait', 'Super', 'Excellent', 'Génial'])} ! « <b>${esc(joinTokens(match))}</b> » ${'⭐'.repeat(st)}` };
                sfx('good'); if (st === 3) party();
                return;
            }
            R.errors++;
            const best = R.answers.map(a => ({ a, n: a.filter((w, i) => cur[i] === w).length })).sort((x, y) => y.n - x.n)[0].a;
            R.marks = cur.map((w, i) => w === best[i] ? 'ok' : 'ko');
            const nGood = best.filter((w, i) => cur[i] === w).length;
            let tip = '';
            if (R.clues && cur[0] !== best[0]) tip = ' Le premier mot doit avoir une <b>majuscule</b>.';
            else if (R.clues && PUNCT.includes(best[best.length - 1]) && cur[cur.length - 1] !== best[best.length - 1]) tip = ' Le <b>point</b> se met toujours à la fin.';
            else if (R.errors >= 2) tip = ' Lis ta phrase à voix basse : est-ce qu\'elle veut dire quelque chose ?';
            R.say = { mood: 'bad', html: `🤔 Pas encore ! <b>${nGood}</b> mot${nGood > 1 ? 's' : ''} sur ${best.length} ${nGood > 1 ? 'sont' : 'est'} à la bonne place (en vert).${tip}${R.errors >= 3 ? ' Besoin d\'aide ? Essaie 💡.' : ''}` };
            sfx('bad');
        }
        function dHint(R) {
            if (R.phase !== 'play') return;
            R.marks = null;
            const ans = R.answers[0], cur = curTexts(R);
            let i = 0;
            while (i < ans.length && cur[i] === ans[i]) i++;
            if (i >= ans.length) { R.say = { mood: '', html: '💡 Ta phrase est déjà dans le bon ordre : clique sur ✔ Vérifier !' }; return; }
            const all = R.pool.concat(R.line.slice(i));
            const id = all.find(x => R.toks[x].t === ans[i] && !R.toks[x].locked);
            if (id === undefined) return;
            R.hints++;
            R.line.slice(i).forEach(x => { if (!R.toks[x].locked) putInPool(R, x); });
            putInLine(R, id, i);
            R.hinted = id;
            R.say = { mood: '', html: `💡 Le mot n°${i + 1} est « <b>${esc(ans[i])}</b> ».` };
        }
        function dNext(R) {
            if (canSpeak) window.speechSynthesis.cancel();
            if (R.qi >= R.queue.length - 1) {
                R.phase = 'final';
                const max = R.queue.length * 3;
                const medal = R.stars >= max - 2 ? '🥇' : R.stars >= Math.round(max * 0.6) ? '🥈' : '🥉';
                R.medal = medal;
                sfx('win'); if (medal === '🥇') party();
            } else { R.qi++; loadSentence(R); }
        }

        // ── Génération d'un exercice ──
        function genRun() {
            const ex = S.ex;
            if (ex.type === 'desordre') {
                let queue;
                if (ex.dmode === 'mine') {
                    queue = parseCustom(ex.mine).slice(0, 20);
                    if (!queue.length) return 'Écris au moins une phrase (une par ligne, au moins 2 mots).';
                } else queue = shuffle(SENT[ex.level]).slice(0, ex.nd);
                const R = { type: 'desordre', queue, qi: 0, results: [], stars: 0, clues: ex.clues, level: ex.dmode === 'mine' ? 0 : ex.level };
                loadSentence(R);
                S.run = R;
            } else if (ex.type === 'types') {
                const kinds = TYPE_ORDER.filter(k => ex.types.includes(k));
                if (kinds.length < 2) return 'Choisis au moins 2 types de phrases.';
                const plan = [];
                while (plan.length < ex.nt) plan.push(...shuffle(kinds));
                const used = {};
                const qs = plan.slice(0, ex.nt).map(k => {
                    used[k] = used[k] || shuffle(TYPE_BANK[k]);
                    return { s: used[k].pop() || pick(TYPE_BANK[k]), ans: k };
                });
                S.run = { type: 'types', kinds, qs: shuffle(qs), ans: [], corrected: false };
            } else if (ex.type === 'forme') {
                const pairs = shuffle(FORME_PAIRS);
                let qs;
                if (ex.fmode === 'recog' || ex.fmode === 'excl') {
                    const negs = shuffle(FORME_EXTRA_NEG);
                    qs = [];
                    for (let i = 0; i < ex.nf; i++) {
                        const p = pairs[i % pairs.length];
                        const isNeg = i % 2 === 1;
                        qs.push(isNeg ? { s: (i % 4 === 3 && negs.length) ? negs.pop() : p[1], ans: 'neg' } : { s: p[0], ans: 'aff' });
                    }
                    qs = shuffle(qs);
                } else {
                    qs = pairs.slice(0, ex.nf).map(p => {
                        const dir = ex.fdir === 'mix' ? pick(['neg', 'aff']) : ex.fdir;
                        return dir === 'neg' ? { s: p[0], ans: p[1], dir } : { s: p[1], ans: p[0], dir };
                    });
                }
                if (ex.fmode === 'excl') {
                    const yes = shuffle(EXCL_YES), no = shuffle(EXCL_NO);
                    qs = [];
                    for (let i = 0; i < ex.nf; i++) qs.push(i % 2 ? { s: yes.pop() || pick(EXCL_YES), ans: 'excl' } : { s: no.pop() || pick(EXCL_NO), ans: 'nonexcl' });
                    qs = shuffle(qs);
                }
                S.run = { type: 'forme', mode: ex.fmode, qs, ans: [], corrected: false };
            } else {
                const plan = [];
                while (plan.length < ex.ns) plan.push(...shuffle(['simple', 'complexe']));
                const used = { simple: shuffle(SC_BANK.simple), complexe: shuffle(SC_BANK.complexe) };
                const qs = plan.slice(0, ex.ns).map(k => ({ s: used[k].pop() || pick(SC_BANK[k]), ans: k }));
                S.run = { type: 'simple', qs: shuffle(qs), ans: [], corrected: false };
            }
            sel = null;
            return '';
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function renderPhrase() {
            return `<div class="p2-ltitle"><h2 style="color:#6C4FD8">🧩 Qu'est-ce qu'une phrase ?</h2></div>
                <div class="p2-box p2-what"><b class="t">🔤 La phrase</b>Une phrase est une suite de mots <b>rangés dans un ordre qui a du sens</b>. À l'écrit, elle commence par une <b>majuscule</b> et se termine par un <b>point</b> ( . ? ! … ).</div>
                <div class="p2-cards">
                    <div class="p2-card" style="--c:#2FBF71"><div class="p2-card-h">✅ C'est une phrase</div><div class="p2-ex yes">Le chien court dans le jardin.</div><div class="d">Les mots sont dans l'ordre, il y a une majuscule et un point.</div></div>
                    <div class="p2-card" style="--c:#EB5757"><div class="p2-card-h">❌ Ce n'est pas une phrase</div><div class="p2-ex no">jardin le court chien dans</div><div class="d">Les mots sont en désordre : ça ne veut rien dire.</div></div>
                    <div class="p2-card" style="--c:#F2994A"><div class="p2-card-h">⚠️ Il manque quelque chose</div><div class="p2-ex no">le chien court dans le jardin</div><div class="d">Le sens est bon, mais il manque la majuscule et le point.</div></div>
                </div>
                <div class="p2-box p2-test"><b class="t">🔎 Phrase verbale ou non verbale ?</b>
                    <ul><li>La <b>phrase verbale</b> est construite autour d'un <b>verbe conjugué</b> : <span class="p2-ex">Le chien <b class="vb">court</b>.</span></li>
                    <li>La <b>phrase non verbale</b> n'a <b>pas de verbe conjugué</b> : <span class="p2-ex">Attention au chien ! · Quelle belle journée ! · Défense de fumer.</span></li></ul></div>
                <div class="p2-box p2-memo"><b class="t">🧠 Pour retenir</b>Une phrase = <b>du sens</b> + une <b>majuscule</b> au début + un <b>point</b> à la fin.</div>
                <div class="p2-box p2-trap"><b class="t">⚠️ Attention au piège</b>Une <b>ligne</b> n'est pas une phrase ! Une phrase peut tenir sur plusieurs lignes, et une ligne peut contenir plusieurs phrases. Pour compter les phrases, je cherche les majuscules et les points.</div>
                <div><button class="p2-btn go" data-act="practice" data-v="desordre">✏️ S'entraîner : la phrase en désordre</button></div>`;
        }
        function renderTypes() {
            return `<div class="p2-ltitle"><h2 style="color:#2F80ED">🔣 Les 3 types de phrases</h2></div>
                <div class="p2-box p2-what"><b class="t">🔤 Pourquoi des types ?</b>On ne fait pas une phrase toujours pour la même raison : pour <b>informer</b>, pour <b>questionner</b> ou pour <b>donner un ordre</b>. C'est le <b>type</b> de la phrase : il y en a <b>3</b>. Toute phrase a un type, et un seul.</div>
                <div class="p2-cards">${TYPE_ORDER.map(k => {
                    const T = TYPES[k];
                    return `<div class="p2-card" style="--c:${T.color}"><div class="p2-card-h">${T.label} <span class="p2-big-punct">${T.punct}</span></div><div class="d">${T.role}</div>
                        <div class="p2-ex">${TYPE_BANK[k].slice(0, 3).map(esc).join('<br>')}</div></div>`;
                }).join('')}</div>
                <div class="p2-box p2-test"><b class="t">🔎 Les mots qui aident</b><ul>
                    <li><b>Interrogative</b> : est-ce que, qui, où, quand, comment, pourquoi, combien, quel… ou le sujet après le verbe (<i>As-tu…</i>).</li>
                    <li><b>Impérative</b> : le verbe est au début, <b>sans sujet</b> (<i>Range ta chambre.</i>).</li></ul></div>
                <div class="p2-box p2-memo"><b class="t">🧠 Pour retenir</b>Je me demande à quoi sert la phrase : <b>informer</b> (déclarative), <b>questionner</b> (interrogative) ou <b>ordonner</b> (impérative) ?</div>
                <div class="p2-box p2-trap"><b class="t">⚠️ Attention au piège</b>Le <b>!</b> ne donne pas le type : il montre la <b>forme exclamative</b>. <i>« Comme il fait chaud ! »</i> donne une information : c'est une phrase <b>déclarative</b> (à la forme exclamative). <i>« Viens ici tout de suite ! »</i> donne un ordre : c'est une phrase <b>impérative</b> (à la forme exclamative).</div>
                <div><button class="p2-btn go" data-act="practice" data-v="types">✏️ S'entraîner : les types de phrases</button></div>`;
        }
        function renderForme() {
            const ex = FORME_PAIRS.slice(0, 3).map(p => `<div class="p2-ex">${esc(p[0])} ➜ ${negHtml(p[1])}</div>`).join('');
            return `<div class="p2-ltitle"><h2 style="color:#EB5757">➖ Les formes de phrases</h2></div>
                <div class="p2-box p2-what"><b class="t">🔤 Type et forme</b>Chaque phrase a un <b>type</b> (déclarative, interrogative ou impérative). En plus, elle a des <b>formes</b> : elle est <b>affirmative</b> ou <b>négative</b>, et elle peut être <b>exclamative</b>.</div>
                <div class="p2-cards">
                    <div class="p2-card" style="--c:#2F80ED"><div class="p2-card-h">Affirmative</div><div class="d">Elle dit que quelque chose <b>est</b> ou <b>se fait</b>.</div><div class="p2-ex">Le chat dort.</div></div>
                    <div class="p2-card" style="--c:#EB5757"><div class="p2-card-h">Négative</div><div class="d">Elle dit le <b>contraire</b> : elle contient une <b>négation</b> en deux mots.</div><div class="p2-ex">${negHtml('Le chat ne dort pas.')}</div></div>
                    <div class="p2-card" style="--c:#F2994A"><div class="p2-card-h">Exclamative <span class="p2-big-punct">!</span></div><div class="d">Elle <b>exprime un sentiment</b> : la joie, la surprise, la colère, l'admiration… Elle se termine par un <b>point d'exclamation</b>.</div><div class="p2-ex">Comme le chat dort bien !</div></div>
                </div>
                <div class="p2-box p2-test"><b class="t">🔧 Comment passer à la forme négative ?</b>J'entoure le <b>verbe conjugué</b> avec <b>ne … pas</b> :${ex}
                    <div style="margin-top:4px">Autres négations : ${negHtml('ne … jamais')}, ${negHtml('ne … plus')}, ${negHtml('ne … rien')}, ${negHtml('ne … personne')}.</div></div>
                <div class="p2-box p2-test"><b class="t">❗ Comment reconnaître la forme exclamative ?</b>Elle se termine par <b>!</b> et commence souvent par <b>quel, quelle, comme, que, ce que</b> : <span class="p2-ex">Quel beau château ! · Que ce gâteau est bon !</span></div>
                <div class="p2-box p2-tool"><b class="t">🧩 Les formes se combinent avec les types</b>
                    <div class="p2-ex">Il fait beau. <span class="p2-hint">➜ déclarative, affirmative</span></div>
                    <div class="p2-ex">Comme il fait beau ! <span class="p2-hint">➜ déclarative, affirmative, exclamative</span></div>
                    <div class="p2-ex">${negHtml('Il ne fait pas beau !')} <span class="p2-hint">➜ déclarative, négative, exclamative</span></div>
                    <div class="p2-ex">${negHtml('Ne cours pas !')} <span class="p2-hint">➜ impérative, négative, exclamative</span></div></div>
                <div class="p2-box p2-memo"><b class="t">🧠 Pour retenir</b>Devant une <b>voyelle</b> ou un <b>h muet</b>, <b>ne</b> devient <b>n'</b> : <i>il n'aime pas, je n'habite pas ici</i>.</div>
                <div class="p2-box p2-trap"><b class="t">⚠️ Attention au piège</b>À l'oral, on oublie souvent le <b>ne</b> (« je sais pas »). À l'écrit, il ne faut <b>jamais</b> l'oublier : <i>je <b>ne</b> sais <b>pas</b></i>.</div>
                <div><button class="p2-btn go" data-act="practice" data-v="forme">✏️ S'entraîner : les formes de phrases</button></div>`;
        }
        function renderSimple() {
            return `<div class="p2-ltitle"><h2 style="color:#27AE60">✂️ Phrase simple ou complexe ?</h2></div>
                <div class="p2-box p2-what"><b class="t">🔤 Simple ou complexe</b>Une <b>phrase simple</b> a <b>un seul verbe conjugué</b>. Une <b>phrase complexe</b> a <b>plusieurs verbes conjugués</b> : elle est faite de plusieurs morceaux, appelés <b>propositions</b>.</div>
                <div class="p2-cards">
                    <div class="p2-card" style="--c:#2F80ED"><div class="p2-card-h">Phrases simples (1 verbe)</div><div class="p2-ex">${SC_BANK.simple.slice(0, 3).map(verbsHtml).join('<br>')}</div></div>
                    <div class="p2-card" style="--c:#27AE60"><div class="p2-card-h">Phrases complexes (2 verbes ou plus)</div><div class="p2-ex">${SC_BANK.complexe.slice(0, 3).map(verbsHtml).join('<br>')}</div></div>
                </div>
                <div class="p2-box p2-test"><b class="t">🔧 Comment faire ?</b>Je cherche et je souligne tous les <b>verbes conjugués</b>, puis je les <b>compte</b> : 1 verbe ➜ phrase simple ; 2 verbes ou plus ➜ phrase complexe. Il y a autant de propositions que de verbes conjugués.</div>
                <div class="p2-box p2-memo"><b class="t">🧠 Pour retenir</b>Les propositions peuvent être reliées par une virgule, par <b>et, mais, ou, donc, car</b>, ou par des mots comme <b>qui, que, quand, parce que, si</b>.</div>
                <div class="p2-box p2-trap"><b class="t">⚠️ Attention au piège</b>Un verbe à l'<b>infinitif</b> ne compte pas : <i>Je <b>veux</b> jouer dehors.</i> ➜ un seul verbe conjugué, c'est une phrase simple. Au passé composé, <i>avons visité</i> compte pour <b>un seul</b> verbe.</div>
                <div><button class="p2-btn go" data-act="practice" data-v="simple">✏️ S'entraîner : simple ou complexe</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="p2-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = S.lesson === 'types' ? renderTypes() : S.lesson === 'forme' ? renderForme() : S.lesson === 'simple' ? renderSimple() : renderPhrase();
            return `<div class="p2-lesson"><div class="p2-side">${side}</div><div class="p2-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="p2-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="p2-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="p2-settings">`;
            h += `<div class="p2-srow"><span class="l">1. Exercice</span>${ch('type', 'desordre', ex.type === 'desordre', '🔀 Phrase en désordre')}${ch('type', 'types', ex.type === 'types', '🏷️ Types de phrases')}${ch('type', 'forme', ex.type === 'forme', '➖ Formes de phrases')}${ch('type', 'simple', ex.type === 'simple', '✂️ Simple ou complexe')}</div>`;
            if (ex.type === 'desordre') {
                h += `<div class="p2-srow"><span class="l">2. Phrases</span>${[1, 2, 3].map(l => ch('dlevel', l, ex.dmode === 'auto' && ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}${ch('dmode', 'mine', ex.dmode === 'mine', '✍️ Mes phrases')}</div>`;
                if (ex.dmode === 'mine') {
                    const n = parseCustom(ex.mine).length;
                    h += `<div class="p2-srow" style="flex-direction:column;align-items:stretch">
                        <textarea class="p2-mine" placeholder="Une phrase par ligne. Si un autre ordre est juste, ajoute-le après « | ».&#10;Ex. : Nous partons à la mer demain.|Nous partons demain à la mer." spellcheck="false">${esc(ex.mine)}</textarea>
                        <div class="p2-hint p2-mine-count">${n} phrase${n > 1 ? 's' : ''} utilisable${n > 1 ? 's' : ''}${n > 20 ? ' (les 20 premières seront utilisées)' : ''}</div></div>`;
                } else {
                    h += `<div class="p2-srow"><span class="l">Nombre de phrases</span>${[5, 8, 10].map(n => ch('nd', n, ex.nd === n, String(n))).join('')}</div>`;
                }
                h += `<div class="p2-srow"><span class="l">Indices</span>${ch('clues', '1', ex.clues, '✅ Majuscule et point visibles')}${ch('clues', '0', !ex.clues, '🚫 Sans majuscule ni point')}</div>`;
            } else if (ex.type === 'types') {
                h += `<div class="p2-srow"><span class="l">2. Types travaillés</span>${TYPE_ORDER.map(k => ch('tkind', k, ex.types.includes(k), TYPES[k].label, TYPES[k].color)).join('')}</div>`;
                h += `<div class="p2-srow"><span class="l">Nombre de phrases</span>${[6, 8, 12].map(n => ch('nt', n, ex.nt === n, String(n))).join('')}</div>`;
            } else if (ex.type === 'forme') {
                h += `<div class="p2-srow"><span class="l">2. Consigne</span>${ch('fmode', 'recog', ex.fmode === 'recog', '🔍 Affirmative ou négative ?')}${ch('fmode', 'excl', ex.fmode === 'excl', '❗ Exclamative ou non ?')}${ch('fmode', 'transf', ex.fmode === 'transf', '✏️ Transformer la phrase')}</div>`;
                if (ex.fmode === 'transf') h += `<div class="p2-srow"><span class="l">Sens</span>${ch('fdir', 'neg', ex.fdir === 'neg', 'affirmative ➜ négative')}${ch('fdir', 'aff', ex.fdir === 'aff', 'négative ➜ affirmative')}${ch('fdir', 'mix', ex.fdir === 'mix', '🎲 Mélangé')}</div>`;
                h += `<div class="p2-srow"><span class="l">Nombre de phrases</span>${[4, 6, 8].map(n => ch('nf', n, ex.nf === n, String(n))).join('')}</div>`;
            } else {
                h += `<div class="p2-srow"><span class="l">Nombre de phrases</span>${[4, 6, 8].map(n => ch('ns', n, ex.ns === n, String(n))).join('')}</div>`;
            }
            h += `<div class="p2-srow"><span class="l">Taille du texte</span><button class="p2-btn alt small" data-act="font" data-d="-2">A−</button><button class="p2-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="p2-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="p2-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="p2-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        function renderDesordre(R) {
            const dots = R.queue.map((_, i) => `<span class="p2-dot ${R.results[i] || (i === R.qi && R.phase !== 'final' ? 'cur' : '')}"></span>`).join('');
            let h = `<div class="p2-topbar"><span class="p2-pill">🔀 ${R.phase === 'final' ? 'Série terminée' : `Phrase ${R.qi + 1} / ${R.queue.length}`}</span><div class="p2-dots">${dots}</div><span class="p2-pill">⭐ ${R.stars}</span></div>`;
            if (R.phase === 'final') {
                const max = R.queue.length * 3;
                const title = R.medal === '🥇' ? 'As de la phrase !' : R.medal === '🥈' ? 'Très beau travail !' : 'Série terminée !';
                return h + `<div class="p2-final"><div class="medal">${R.medal}</div><div style="font-size:26px;font-weight:900">${title}</div>
                    <div style="font-size:18px;font-weight:800">${R.stars} ⭐ sur ${max}</div>
                    <button class="p2-btn go" data-act="regen">🔄 Nouvelle série</button></div>`;
            }
            const w = (i, where, k) => {
                const t = R.toks[i];
                let cls = (t.punct ? 'punct ' : '') + (t.locked ? 'locked ' : '');
                if (where === 'line' && R.marks) cls += R.marks[k] + ' ';
                if (R.hinted === i) cls += 'hinted ';
                if (sel === i) cls += 'sel ';
                const lockable = R.phase === 'play' && !t.locked;
                return `<div class="p2-w ${cls}"${lockable ? ` data-i="${i}"` : ''}>${t.locked ? '📌 ' : ''}${esc(t.t)}</div>`;
            };
            h += `<div class="p2-say ${R.say ? R.say.mood : ''}">${R.say ? R.say.html : ''}</div>`;
            h += `<div class="p2-zlabel">Ma phrase</div><div class="p2-zone line ${R.phase === 'won' ? 'won' : ''}" data-zone="line">${R.line.map((i, k) => w(i, 'line', k)).join('') || '<span class="p2-hint">Touche les mots dans l\'ordre…</span>'}</div>`;
            if (R.phase === 'play') h += `<div class="p2-zlabel">Les mots</div><div class="p2-zone pool" data-zone="pool">${R.pool.map(i => w(i, 'pool')).join('') || '<span class="p2-hint">Tous les mots sont placés : vérifie !</span>'}</div>`;
            h += `<div class="p2-actions">` + (R.phase === 'play'
                ? `<button class="p2-btn go" data-act="dcheck" ${R.pool.length ? 'disabled' : ''}>✔ Vérifier</button>
                   <button class="p2-btn alt" data-act="dhint">💡 Indice</button>
                   ${canSpeak ? '<button class="p2-btn alt" data-act="dlisten">🔊 Écouter</button>' : ''}
                   <button class="p2-btn alt" data-act="dclear">🧹 Effacer</button>
                   <button class="p2-btn alt" data-act="dskip">⏭ Passer</button>`
                : `<button class="p2-btn go" data-act="dnext">${R.qi >= R.queue.length - 1 ? '🏁 Voir le bilan' : 'Phrase suivante ➜'}</button>
                   ${canSpeak ? '<button class="p2-btn alt" data-act="dlisten">🔊 Écouter</button>' : ''}`) + `</div>`;
            return h;
        }
        function scoreOf(R) {
            if (R.type === 'forme' && R.mode === 'transf') return { ok: R.qs.filter((q, i) => normSent(R.ans[i]) === normSent(q.ans)).length, n: R.qs.length };
            return { ok: R.qs.filter((q, i) => R.ans[i] === q.ans).length, n: R.qs.length };
        }
        function choiceCard(R, i, q, title, sentHtml, opts) {
            const a = R.ans[i];
            let cls = '', mark = '';
            if (R.corrected) { cls = a === q.ans ? 'ok' : 'ko'; mark = a === q.ans ? '✅' : '❌'; }
            const btns = opts.map(([v, lbl, col]) => {
                let c = a === v ? 'on' : '';
                if (R.corrected) c = v === q.ans ? 'good' : (a === v ? 'bad' : '');
                return `<button class="p2-choice ${c}"${col ? ` style="--c:${col}"` : ''} data-act="ans" data-i="${i}" data-v="${v}">${lbl}</button>`;
            }).join('');
            return `<div class="p2-q ${cls}"><div class="p2-qtop"><span class="p2-num">${i + 1})</span>${title}<span style="margin-left:auto">${mark}</span></div>
                <div class="p2-qsent">${sentHtml}</div><div class="p2-choices">${btns}</div></div>`;
        }
        function renderQuestions(R) {
            if (R.type === 'types') {
                const opts = R.kinds.map(k => [k, TYPES[k].label, TYPES[k].color]);
                return `<div class="p2-grid">` + R.qs.map((q, i) => choiceCard(R, i, q, 'Quel est le type de cette phrase ?', esc(q.s), opts)).join('') + `</div>`;
            }
            if (R.type === 'simple') {
                const opts = [['simple', 'Simple (1 verbe)', '#2F80ED'], ['complexe', 'Complexe (2 verbes ou +)', '#27AE60']];
                return `<div class="p2-grid wide">` + R.qs.map((q, i) => {
                    const sentHtml = R.corrected ? verbsHtml(q.s) + `<div class="p2-hint" style="font-family:Nunito,sans-serif">${countVerbs(q.s)} verbe${countVerbs(q.s) > 1 ? 's' : ''} conjugué${countVerbs(q.s) > 1 ? 's' : ''}</div>` : esc(plainVerbs(q.s));
                    return choiceCard(R, i, q, 'Cette phrase est-elle simple ou complexe ?', sentHtml, opts);
                }).join('') + `</div>`;
            }
            if (R.mode === 'excl') {
                const opts = [['excl', 'Exclamative', '#F2994A'], ['nonexcl', 'Non exclamative', '#6B7A89']];
                return `<div class="p2-grid">` + R.qs.map((q, i) => choiceCard(R, i, q, 'Cette phrase est-elle à la forme exclamative ?', esc(q.s), opts)).join('') + `</div>`;
            }
            if (R.mode === 'recog') {
                const opts = [['aff', 'Affirmative', '#2F80ED'], ['neg', 'Négative', '#EB5757']];
                return `<div class="p2-grid">` + R.qs.map((q, i) => choiceCard(R, i, q, 'Quelle est la forme de cette phrase ?', R.corrected && q.ans === 'neg' ? negHtml(q.s) : esc(q.s), opts)).join('') + `</div>`;
            }
            return `<div class="p2-grid wide">` + R.qs.map((q, i) => {
                const val = R.ans[i] || '';
                let cls = '', mark = '', sol = '';
                if (R.corrected) {
                    const ok = normSent(val) === normSent(q.ans);
                    cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌';
                    if (!ok) sol = `<div class="p2-sol">→ ${q.dir === 'neg' ? negHtml(q.ans) : esc(q.ans)}</div>`;
                }
                return `<div class="p2-q ${cls}"><div class="p2-qtop"><span class="p2-num">${i + 1})</span>Écris cette phrase à la forme <b style="color:${q.dir === 'neg' ? '#EB5757' : '#2F80ED'}">${q.dir === 'neg' ? 'négative' : 'affirmative'}</b><span style="margin-left:auto">${mark}</span></div>
                    <div class="p2-qsent">${esc(q.s)}</div>
                    <input class="p2-in ${cls}" data-i="${i}" value="${esc(val)}" placeholder="…" autocomplete="off" spellcheck="false" ${R.corrected ? 'disabled' : ''}>${sol}</div>`;
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            if (R.type === 'desordre') return h + renderDesordre(R) + `</div>`;
            const sc = R.corrected ? scoreOf(R) : null;
            const title = R.type === 'types' ? '🏷️ Types de phrases' : R.type === 'forme' ? (R.mode === 'recog' ? '➖ Affirmative ou négative ?' : R.mode === 'excl' ? '❗ Exclamative ou non ?' : '➖ Transformer les phrases') : '✂️ Simple ou complexe ?';
            h += `<div class="p2-topbar"><span class="p2-pill">${title} · ${R.qs.length} phrases</span>
                ${sc ? `<span class="p2-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="p2-actions">
                <button class="p2-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="p2-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="p2-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            return h + renderQuestions(R) + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="p2-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!S.settingsOpen || !msg) h += `<div class="p2-info">Choisis l'exercice et ses réglages, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.p2-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : renderLesson();
            body.scrollTop = top;
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'p2-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run, ex = S.ex;
            const toggleIn = (arr, v) => { const i = arr.indexOf(v); if (i === -1) arr.push(v); else arr.splice(i, 1); };
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '✍️ La phrase', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (canSpeak) window.speechSynthesis.cancel();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'practice':
                    ex.type = el.dataset.v; S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'dlevel': ex.level = +el.dataset.v; ex.dmode = 'auto'; msg = ''; break;
                case 'dmode': ex.dmode = el.dataset.v; msg = ''; break;
                case 'nd': ex.nd = +el.dataset.v; break;
                case 'clues': ex.clues = el.dataset.v === '1'; break;
                case 'tkind': toggleIn(ex.types, el.dataset.v); msg = ''; break;
                case 'nt': ex.nt = +el.dataset.v; break;
                case 'fmode': ex.fmode = el.dataset.v; break;
                case 'fdir': ex.fdir = el.dataset.v; break;
                case 'nf': ex.nf = +el.dataset.v; break;
                case 'ns': ex.ns = +el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'clear':
                    if (!R || !R.qs) return;
                    R.ans = []; R.corrected = false;
                    break;
                case 'correct': {
                    if (!R || !R.qs) return;
                    R.corrected = !R.corrected;
                    if (R.corrected) {
                        const sc = scoreOf(R);
                        if (sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'ans':
                    if (!R || R.corrected) return;
                    R.ans[+el.dataset.i] = el.dataset.v; sfx('pop');
                    break;
                // Phrase en désordre
                case 'dcheck': if (R) dCheck(R); break;
                case 'dhint': if (R) { dHint(R); sfx('pop'); } break;
                case 'dlisten':
                    if (!R) return;
                    if (R.phase === 'play') { R.hints++; R.say = { mood: '', html: '🔊 Écoute bien la phrase, puis range les mots dans le même ordre.' }; }
                    speak(joinTokens(R.answers[0]));
                    break;
                case 'dclear':
                    if (!R || R.phase !== 'play') return;
                    R.line.slice().forEach(i => putInPool(R, i)); R.marks = null; R.hinted = null;
                    break;
                case 'dskip': {
                    if (!R || R.phase !== 'play') return;
                    R.results[R.qi] = 'meh';
                    const sol = `⏭ La phrase était : « <b>${esc(joinTokens(R.answers[0]))}</b> »`;
                    dNext(R);
                    if (R.phase === 'play') R.say = { mood: '', html: sol + '<br>' + R.say.html };
                    break;
                }
                case 'dnext': if (R) dNext(R); break;
                default: return;
            }
            render(); save();
        }

        // ── Étiquettes de la phrase en désordre : toucher ou glisser ──
        let drag = null, lastTap = 0;
        function zoneAt(x, y) {
            const el = document.elementFromPoint(x, y);
            if (!el || !container.contains(el)) return null;
            return { zone: el.closest('[data-zone]'), word: el.closest('.p2-w') };
        }
        function dMove(e) {
            if (!drag || e.pointerId !== drag.id) return;
            if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
                drag.moved = true;
                drag.el.classList.add('dragging');
                drag.ghost = document.createElement('div');
                drag.ghost.className = 'p2-ghost';
                drag.ghost.textContent = S.run.toks[drag.i].t;
                drag.ghost.style.fontSize = getComputedStyle(drag.el).fontSize;
                document.body.appendChild(drag.ghost);
            }
            if (!drag.moved) return;
            e.preventDefault();
            drag.ghost.style.left = e.clientX + 'px';
            drag.ghost.style.top = e.clientY + 'px';
            body.querySelectorAll('.p2-zone.drop').forEach(x => x.classList.remove('drop'));
            const t = zoneAt(e.clientX, e.clientY);
            if (t && t.zone) t.zone.classList.add('drop');
        }
        function dUp(e) {
            if (!drag || e.pointerId !== drag.id) return;
            window.removeEventListener('pointermove', dMove);
            window.removeEventListener('pointerup', dUp);
            window.removeEventListener('pointercancel', dUp);
            const d = drag, R = S.run;
            drag = null;
            lastTap = Date.now();
            if (d.ghost) d.ghost.remove();
            if (e.type === 'pointercancel' || !R || R.phase !== 'play') { render(); return; }
            R.marks = null; R.hinted = null;
            if (!d.moved) {
                // Toucher : un mot en bas monte à la fin de la phrase, un mot de la phrase redescend
                if (R.pool.includes(d.i)) putInLine(R, d.i); else putInPool(R, d.i);
                sfx('pop');
            } else {
                const t = zoneAt(e.clientX, e.clientY);
                if (t && t.zone && t.zone.dataset.zone === 'line') {
                    let at;
                    if (t.word && t.word.dataset.i !== undefined && +t.word.dataset.i !== d.i) {
                        const r = t.word.getBoundingClientRect();
                        const target = +t.word.dataset.i;
                        const without = R.line.filter(x => x !== d.i);
                        at = without.indexOf(target) + (e.clientX > r.left + r.width / 2 ? 1 : 0);
                    }
                    putInLine(R, d.i, at);
                    sfx('pop');
                } else if (t && t.zone && t.zone.dataset.zone === 'pool') putInPool(R, d.i);
            }
            render(); save();
        }
        body.addEventListener('pointerdown', e => {
            const w = e.target.closest('.p2-w[data-i]');
            if (!w || !S.run || S.run.type !== 'desordre' || drag) return;
            if (e.button !== undefined && e.button > 0) return;
            e.preventDefault(); e.stopPropagation();
            if (typeof bringToFront === 'function') bringToFront(widget);
            help.classList.remove('show');
            drag = { id: e.pointerId, i: +w.dataset.i, el: w, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
            window.addEventListener('pointermove', dMove, { passive: false });
            window.addEventListener('pointerup', dUp);
            window.addEventListener('pointercancel', dUp);
        });

        // ── Événements : souris, stylet et tactile (dédoublonnés) ──
        function onTap(e) {
            if (drag) return;
            const el = e.target.closest && e.target.closest('[data-act]');
            if (!el || !container.contains(el) || el.disabled) return;
            if (e.type === 'pointerup' && e.button > 0) return;
            e.stopPropagation(); e.preventDefault();
            const now = Date.now();
            if (now - lastTap < 300) return;
            lastTap = now;
            act(el.dataset.act, el);
        }
        container.addEventListener('pointerup', onTap);
        container.addEventListener('click', onTap);
        function onDown(e) {
            if (typeof bringToFront === 'function') bringToFront(widget);
            // Seule la barre de titre (hors boutons) sert à déplacer le widget
            if (e.target.closest('.p2-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.p2-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Saisie (sans tout redessiner)
        container.addEventListener('input', e => {
            const t = e.target;
            if (t.classList.contains('p2-in') && S.run) { S.run.ans[+t.dataset.i] = t.value; saveSoon(); }
            else if (t.classList.contains('p2-mine')) {
                S.ex.mine = t.value;
                const n = parseCustom(t.value).length, c = body.querySelector('.p2-mine-count');
                if (c) c.textContent = `${n} phrase${n > 1 ? 's' : ''} utilisable${n > 1 ? 's' : ''}${n > 20 ? ' (les 20 premières seront utilisées)' : ''}`;
                saveSoon();
            }
        });
        container.addEventListener('keydown', e => {
            if (e.key !== 'Enter' || !e.target.classList.contains('p2-in')) return;
            e.preventDefault();
            const ins = Array.from(body.querySelectorAll('.p2-in:not([disabled])'));
            const next = ins[ins.indexOf(e.target) + 1];
            if (next) next.focus(); else e.target.blur();
        });
        document.addEventListener('pointerdown', function closeHelp(e) {
            if (!widget.isConnected) { document.removeEventListener('pointerdown', closeHelp, true); return; }
            if (help.classList.contains('show') && !help.contains(e.target) && !e.target.closest('[data-act="help"]')) help.classList.remove('show');
        }, true);

        // ── Redimensionnement ──
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
            savedW = (container.offsetWidth / window.innerWidth) * 100;
            savedH = (container.offsetHeight / vh()) * 100;
        }
        new MutationObserver(memoSize).observe(container, { attributes: true, attributeFilter: ['style', 'class'] });
        widget._pdsGetData = function () {
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
            } else if (_isPhone()) {
                // Sur téléphone : ouverture directe en plein écran (bouton vert)
                container.classList.add('wf-fullboard');
            } else {
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / window.innerWidth) * 100;
            }
            save();
        }));
        return widget;
    };
    // Ancien nom, utilisé par save-load.js
    window.createPhraseDesordreWidget = window.createPhraseWidget;

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createPhraseWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
