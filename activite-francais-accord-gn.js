// =========================================================================
// ACTIVITÉ « LA CHAÎNE D'ACCORDS DANS LE GROUPE NOMINAL » — Le Bureau du Prof
// Leçons + chaîne interactive + exercices corrigés (présentation de « La phrase »).
//
// 📖 Leçons : le groupe nominal et le nom chef, le féminin, le pluriel, les pièges.
// 🔗 La chaîne : un groupe nominal sur un tableau noir. On change le genre et le
//    nombre du nom : tous les mots qui s'accordent changent, les flèches partent
//    du nom vers le déterminant et les adjectifs. Marque du féminin en rose,
//    marque du pluriel en bleu. On peut construire son propre groupe nominal.
// ✏️ Exercices :
//    🔗 La chaîne : toucher les mots qui s'accordent avec le nom.
//    ✍️ Accorde : réécrire le groupe nominal au genre / nombre demandé.
//    🕵️ L'erreur : trouver le mot mal accordé.
//    🏷️ Genre et nombre : masculin / féminin, singulier / pluriel ?
//
// Ouverture : createWidget('accord-gn')  ou  createAccordGNWidget()
// Sauvegarde : w._agGetData()  /  createAccordGNWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'accord-gn';

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

    // ── CSS (préfixe ag-) ─────────────────────────────────────────────────
    if (!document.getElementById('ag-style')) {
        const s = document.createElement('style');
        s.id = 'ag-style';
        s.textContent = `
.widget[data-type="accord-gn"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.ag-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --cf:#D63384; --cp:#1E6FD9; --cdet:#7B5CE0; --cnom:#C98A00; --cadj:#1E9C55;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.ag-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .ag-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .ag-tab-lbl { display:none; }
    .ag-title { font-size:17px !important; }
    .ag-lesson { flex-direction:column; }
    .ag-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .ag-gbtn { flex:1 1 auto; text-align:center !important; }
    .ag-srow > .l { min-width:0 !important; width:100%; }
    .ag-board { --bf:30px !important; }
}
.ag-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.ag-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.ag-tabs { display:flex; gap:6px; margin-left:12px; }
.ag-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.ag-tab:hover { background:rgba(255,255,255,.1); }
.ag-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.ag-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.ag-icon-btn:hover { background:rgba(255,255,255,.28); }
.ag-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Marques d'accord */
.ag-f { color:var(--cf); font-weight:900; }
.ag-p { color:var(--cp); font-weight:900; }
.ag-fp { color:#8E3FD0; font-weight:900; }
.ag-w { font-family:'MDI',cursive; }
.ag-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:14px; font-weight:800; }
.ag-legend span::before { content:''; display:inline-block; width:12px; height:12px; border-radius:3px; margin-right:5px; vertical-align:-1px; background:currentColor; }

/* ── Tableau noir (chaîne) ── */
.ag-board { --bf:44px; position:relative; border-radius:18px; padding:14px 16px 12px; color:#f4f1e8;
    background:radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.07), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(0,0,0,.18), transparent 55%), #2E5B45;
    border:8px solid #8a5a33; box-shadow:inset 0 0 30px rgba(0,0,0,.35), 0 4px 0 #5e3a1e; }
.ag-board .ag-f { color:#FF9CCB; } .ag-board .ag-p { color:#8FD3FF; } .ag-board .ag-fp { color:#D9A8FF; }
.ag-arrows { position:relative; padding-top:calc(var(--bf) * 1.9); }
.ag-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
.ag-svg path.ln { fill:none; stroke:rgba(255,248,220,.85); stroke-width:3; stroke-linecap:round; }
.ag-svg path.hd { fill:rgba(255,248,220,.9); }
.ag-svg.anim path.ln { animation:ag-draw .7s ease-out both; }
.ag-svg.anim path.hd { animation:ag-head .7s ease-out both; }
@keyframes ag-draw { from { stroke-dashoffset:var(--len); } to { stroke-dashoffset:0; } }
@keyframes ag-head { 0%, 70% { opacity:0; } 100% { opacity:1; } }
.ag-row { display:flex; justify-content:center; align-items:flex-end; gap:calc(var(--bf) * .45); flex-wrap:wrap; row-gap:calc(var(--bf) * 1.6); }
.ag-tok { display:flex; flex-direction:column; align-items:center; gap:4px; }
.ag-tok .w { font-family:'MDI',cursive; font-size:var(--bf); line-height:1.1; padding:0 .08em; border-radius:8px; white-space:nowrap; position:relative; }
.ag-tok .r { font-size:calc(var(--bf) * .3); font-weight:900; letter-spacing:.5px; text-transform:uppercase; padding:1px 8px; border-radius:999px; white-space:nowrap; }
.ag-tok.det .r { background:#c9b6ff; color:#2a1f4a; }
.ag-tok.nom .r { background:#ffd86b; color:#2a1f4a; }
.ag-tok.adj .r { background:#9be59b; color:#173d22; }
.ag-tok.et .r { background:rgba(255,255,255,.18); color:#e8e4d8; }
.ag-tok.et .w { opacity:.6; }
.ag-tok.nom .w { text-decoration:underline; text-decoration-thickness:3px; text-underline-offset:6px; text-decoration-color:#ffd86b; }
.ag-crown { position:absolute; left:50%; top:calc(var(--bf) * -.62); transform:translateX(-50%); font-size:calc(var(--bf) * .5); line-height:1; }
.ag-tok.flip .w { animation:ag-flip .55s ease-out; }
@keyframes ag-flip { 0% { transform:rotateX(90deg); opacity:.2; } 100% { transform:rotateX(0); opacity:1; } }
.ag-board.small { --bf:30px; padding:10px 12px 8px; border-width:6px; }
.ag-board .gnlbl { text-align:center; font-weight:900; font-size:15px; color:#ffd86b; margin-top:10px; letter-spacing:.3px; }

/* ── Leçons ── */
.ag-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.ag-side { width:210px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.ag-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.ag-gbtn:hover { transform:translateX(2px); }
.ag-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.ag-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.ag-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.ag-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.ag-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.ag-box ul, .ag-box ol { margin:4px 0 0; padding-left:22px; }
.ag-what { background:#f1edff; border:2px solid #c8bbf5; }
.ag-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.ag-memo { background:#fff6d6; border:2px solid #f3d36b; }
.ag-trap { background:#ffecee; border:2px solid #f6a7b0; }
.ag-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.ag-ex { font-family:'MDI',cursive; font-size:21px; line-height:1.55; }
.ag-table { width:100%; border-collapse:separate; border-spacing:0 4px; font-size:15px; }
.ag-table td { background:#fff; padding:5px 10px; border-top:2px solid #eee4d2; border-bottom:2px solid #eee4d2; }
.ag-table td:first-child { border-left:2px solid #eee4d2; border-radius:10px 0 0 10px; font-weight:900; white-space:nowrap; }
.ag-table td:last-child { border-right:2px solid #eee4d2; border-radius:0 10px 10px 0; }
.ag-table .ag-ex { font-size:19px; }
.ag-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.ag-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.ag-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.ag-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.ag-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.ag-btn:disabled { opacity:.45; }

/* ── Chaîne interactive ── */
.ag-lab { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.ag-ctrl { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; align-items:center; }
.ag-seg { display:flex; background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:4px; gap:4px; }
.ag-seg button { border:none; background:transparent; border-radius:12px; padding:9px 16px; font:inherit; font-weight:900; font-size:17px; color:var(--encre); touch-action:manipulation; }
.ag-seg button.on.m { background:#e8f0ff; color:#2a1f4a; box-shadow:inset 0 0 0 2px #9db7f0; }
.ag-seg button.on.f { background:var(--cf); color:#fff; }
.ag-seg button.on.s { background:#efe9db; color:#2a1f4a; box-shadow:inset 0 0 0 2px #cdbf9f; }
.ag-seg button.on.p { background:var(--cp); color:#fff; }
.ag-explain { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 14px; font-size:15px; line-height:1.55; }
.ag-explain ul { margin:4px 0 0; padding-left:20px; }
.ag-explain .note { margin-top:6px; background:#fff6d6; border-radius:10px; padding:5px 10px; font-weight:700; }
.ag-builder { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
.ag-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.ag-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.ag-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.ag-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.ag-chip.dim { opacity:.35; }
.ag-hint { font-size:12.5px; color:#6a6380; }

/* ── Exercices ── */
.ag-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.ag-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.ag-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.ag-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.ag-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.ag-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.ag-pill.score { background:var(--vert); font-size:16px; }
.ag-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.ag-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 380px)),1fr)); }
.ag-grid.one { grid-template-columns:1fr; }
.ag-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .3); }
.ag-q.ok { border-color:var(--vert); background:#f3fcf7; }
.ag-q.ko { border-color:var(--rouge); background:#fff5f6; }
.ag-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.ag-num { font-weight:900; color:#9a8f7a; }
.ag-sent { font-family:'MDI',cursive; font-size:var(--f); line-height:1.7; text-align:center; }
.ag-word { display:inline-block; padding:0 .12em; margin:0 .02em; border-radius:8px; border-bottom:3px solid transparent; touch-action:manipulation; }
.ag-word.click:hover { background:#f3efff; }
.ag-word.sel { background:#efe8ff; border-bottom-color:var(--violet); }
.ag-word.chief { font-weight:700; text-decoration:underline; text-decoration-color:#e8b400; text-decoration-thickness:3px; text-underline-offset:5px; }
.ag-word.good { background:#dcf5e7; border-bottom-color:var(--vert); }
.ag-word.bad { background:#ffe1e5; border-bottom-color:var(--rouge); }
.ag-word.miss { background:#fff2c2; border-bottom:3px dashed #e8b400; }
.ag-word .fix { font-family:'Nunito',sans-serif; font-size:.5em; font-weight:900; color:var(--vert); display:block; line-height:1; margin-top:-2px; text-align:center; }
.ag-consigne { text-align:center; font-weight:900; font-size:calc(var(--f) * .55); }
.ag-src { text-align:center; font-family:'MDI',cursive; font-size:calc(var(--f) * .85); color:#5a5470; }
.ag-cols { display:flex; justify-content:center; align-items:flex-start; gap:calc(var(--f) * .3); flex-wrap:wrap; }
.ag-col { display:flex; flex-direction:column; gap:5px; align-items:stretch; }
.ag-col.fixed { justify-content:flex-start; padding-top:4px; }
.ag-opt { border:2px solid #d9cdb6; background:#fff; border-radius:10px; padding:2px 10px; font-family:'MDI',cursive; font-size:calc(var(--f) * .72); color:var(--encre); touch-action:manipulation; }
.ag-opt.on { border-color:var(--violet); background:var(--violet); color:#fff; }
.ag-opt.good { border-color:var(--vert); background:var(--vert); color:#fff; }
.ag-opt.bad { border-color:var(--rouge); background:var(--rouge); color:#fff; }
.ag-opt.want { border:2px dashed var(--vert); }
.ag-col .ro { font-family:'MDI',cursive; font-size:calc(var(--f) * .72); color:#9a8f7a; padding:4px 6px; }
.ag-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.ag-choice { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 12px; font:inherit; font-weight:900; font-size:calc(var(--f) * .5);
    color:var(--encre); touch-action:manipulation; }
.ag-choice.on { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; }
.ag-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.ag-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.ag-why { font-size:13.5px; color:#5a5470; text-align:center; line-height:1.4; }
.ag-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:ag-fall 1.6s ease-in forwards; }
@keyframes ag-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.ag-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.ag-help.show { display:block; }
.ag-help h4 { margin:0 0 6px; font-size:15px; }
.ag-help p { margin:0 0 6px; }
.ag-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.ag-container:hover .ag-resize { opacity:1; }
.ag-container.wf-fullboard .ag-resize { display:none; }
@media (prefers-reduced-motion: reduce) { .ag-svg.anim path, .ag-tok.flip .w { animation:none !important; } }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="accord-gn"], .ag-container, .ag-container * { cursor:default !important; }
.ag-container .ag-header { cursor:grab !important; }
.ag-container .ag-header:active { cursor:grabbing !important; }
.ag-container button, .ag-container [data-act] { cursor:pointer !important; }
.ag-container button:disabled { cursor:default !important; }
.ag-container .ag-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // OUTILS
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const VOW = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;
    function lcp(a, b) { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
    const GN_LBL = { ms: 'masculin singulier', fs: 'féminin singulier', mp: 'masculin pluriel', fp: 'féminin pluriel' };
    const COMBOS = ['ms', 'fs', 'mp', 'fp'];

    // =====================================================================
    // LEXIQUE
    //   Adjectifs : [masculin, tags, position (pre = avant le nom), niveau, groupe de sens]
    //   tags : P personne, A animal, O objet, V véhicule, F aliment, T texte/histoire
    // =====================================================================
    const ADJ_RAW = [
        ['petit', 'PAOVF', 'pre', 1, 's'], ['grand', 'PAOV', 'pre', 1, 's'], ['joli', 'AOVT', 'pre', 1, ''], ['jeune', 'PA', 'pre', 1, 'a'],
        ['gros', 'AOF', 'pre', 2, 's'], ['bon', 'PF', 'pre', 2, 'k'], ['beau', 'PAOVT', 'pre', 3, ''], ['vieux', 'PAOV', 'pre', 3, 'a'],
        ['nouveau', 'POVT', 'pre', 3, 'a'], ['long', 'OVT', 'pre', 3, 's'],
        ['noir', 'AOV', 'post', 1, 'c'], ['vert', 'OVF', 'post', 1, 'c'], ['bleu', 'OV', 'post', 1, 'c'], ['rouge', 'OVF', 'post', 1, 'c'], ['jaune', 'OVF', 'post', 1, 'c'],
        ['rapide', 'AV', 'post', 1, ''], ['content', 'PA', 'post', 1, 'm'], ['méchant', 'PA', 'post', 1, 'k'], ['gourmand', 'PA', 'post', 1, ''],
        ['fatigué', 'PA', 'post', 1, 'm'], ['sage', 'PA', 'post', 1, 'k'], ['drôle', 'PAT', 'post', 1, ''], ['magnifique', 'PAOVT', 'post', 1, ''],
        ['calme', 'PA', 'post', 1, 'm'], ['triste', 'PAT', 'post', 1, 'm'],
        ['gris', 'AOV', 'post', 2, 'c'], ['heureux', 'PA', 'post', 2, 'm'], ['peureux', 'PA', 'post', 2, 'k'], ['courageux', 'PA', 'post', 2, 'k'],
        ['sportif', 'P', 'post', 2, ''], ['neuf', 'OV', 'post', 2, 'a'], ['léger', 'OV', 'post', 2, ''], ['fier', 'PA', 'post', 2, 'm'], ['mignon', 'PA', 'post', 2, 'k'],
        ['blanc', 'AOV', 'post', 3, 'c'], ['doux', 'PAF', 'post', 3, ''], ['roux', 'PA', 'post', 3, 'c'], ['frais', 'F', 'post', 3, 'a'],
        ['génial', 'POT', 'post', 3, ''], ['original', 'OT', 'post', 3, ''], ['spécial', 'OF', 'post', 3, ''], ['cruel', 'PA', 'post', 3, 'k'], ['gentil', 'PA', 'post', 3, 'k']
    ];
    const ADJ_IRR = { beau: 'belle', nouveau: 'nouvelle', vieux: 'vieille', doux: 'douce', roux: 'rousse', long: 'longue', frais: 'fraîche', blanc: 'blanche', gros: 'grosse', gentil: 'gentille' };
    const ADJ_BEFORE_VOWEL = { beau: 'bel', nouveau: 'nouvel', vieux: 'vieil' };
    function femAdj(ms) {
        if (ADJ_IRR[ms]) return [ADJ_IRR[ms], ms === 'gros' || ms === 'gentil' ? 'dbl' : 'irr'];
        if (/é$/.test(ms)) return [ms + 'e', 'plus'];
        if (/e$/.test(ms)) return [ms, 'e'];
        if (/eux$/.test(ms)) return [ms.slice(0, -1) + 'se', 'eux'];
        if (/er$/.test(ms)) return [ms.slice(0, -2) + 'ère', 'er'];
        if (/f$/.test(ms)) return [ms.slice(0, -1) + 've', 'f'];
        if (/(el|en|on)$/.test(ms)) return [ms + ms.slice(-1) + 'e', 'dbl'];
        return [ms + 'e', 'plus'];
    }
    function plurAdj(ms) {
        if (/[sx]$/.test(ms)) return [ms, 'sx'];
        if (/eau$/.test(ms)) return [ms + 'x', 'x'];
        if (/al$/.test(ms)) return [ms.slice(0, -2) + 'aux', 'al'];
        return [ms + 's', 'plus'];
    }
    const ADJ = ADJ_RAW.map(([ms, tags, pos, lvl, grp], i) => {
        const [fs, rf] = femAdj(ms), [mp, rp] = plurAdj(ms);
        return { i, ms, fs, mp, fp: fs + 's', rf, rp, tags, pos, lvl, grp };
    });

    //   Noms : { m, f } (deux genres) ou { w, g } (un seul genre) ; t = tag ; l = niveau
    const NOUN_RAW = [
        // Personnes
        { m: 'ami', f: 'amie', t: 'P', l: 1 }, { m: 'voisin', f: 'voisine', t: 'P', l: 1 }, { m: 'cousin', f: 'cousine', t: 'P', l: 1 },
        { m: 'marchand', f: 'marchande', t: 'P', l: 1 }, { m: 'élève', f: 'élève', t: 'P', l: 2 }, { m: 'enfant', f: 'enfant', t: 'P', l: 2 },
        { m: 'chanteur', f: 'chanteuse', t: 'P', l: 2 }, { m: 'danseur', f: 'danseuse', t: 'P', l: 2 }, { m: 'boulanger', f: 'boulangère', t: 'P', l: 2 },
        { m: 'fermier', f: 'fermière', t: 'P', l: 2 }, { m: 'musicien', f: 'musicienne', t: 'P', l: 2 }, { m: 'champion', f: 'championne', t: 'P', l: 2 },
        { m: 'acteur', f: 'actrice', t: 'P', l: 3 }, { m: 'directeur', f: 'directrice', t: 'P', l: 3 }, { m: 'prince', f: 'princesse', t: 'P', l: 3 },
        { m: 'roi', f: 'reine', t: 'P', l: 3 }, { m: 'maître', f: 'maîtresse', t: 'P', l: 3 },
        // Animaux
        { m: 'lapin', f: 'lapine', t: 'A', l: 1 }, { m: 'éléphant', f: 'éléphante', t: 'A', l: 1 }, { m: 'chat', f: 'chatte', t: 'A', l: 2 },
        { m: 'chien', f: 'chienne', t: 'A', l: 2 }, { m: 'lion', f: 'lionne', t: 'A', l: 2 }, { m: 'loup', f: 'louve', t: 'A', l: 2 },
        { m: 'ours', f: 'ourse', t: 'A', l: 3 }, { m: 'tigre', f: 'tigresse', t: 'A', l: 3 }, { m: 'cheval', f: 'jument', t: 'A', l: 3 },
        { w: 'papillon', g: 'm', t: 'A', l: 1 }, { w: 'escargot', g: 'm', t: 'A', l: 1 }, { w: 'tortue', g: 'f', t: 'A', l: 1 }, { w: 'abeille', g: 'f', t: 'A', l: 1 },
        { w: 'oiseau', g: 'm', t: 'A', l: 3 }, { w: 'souris', g: 'f', t: 'A', l: 3 },
        // Objets
        { w: 'cahier', g: 'm', t: 'O', l: 1 }, { w: 'livre', g: 'm', t: 'O', l: 1 }, { w: 'crayon', g: 'm', t: 'O', l: 1 }, { w: 'ballon', g: 'm', t: 'O', l: 1 },
        { w: 'arbre', g: 'm', t: 'O', l: 1 }, { w: 'jeu', g: 'm', t: 'O', l: 3 }, { w: 'cadeau', g: 'm', t: 'O', l: 3 }, { w: 'bijou', g: 'm', t: 'O', l: 3 },
        { w: 'château', g: 'm', t: 'O', l: 3 }, { w: 'nez', g: 'm', t: 'P_', l: 9 },
        { w: 'maison', g: 'f', t: 'O', l: 1 }, { w: 'fleur', g: 'f', t: 'O', l: 1 }, { w: 'robe', g: 'f', t: 'O', l: 1 }, { w: 'chaise', g: 'f', t: 'O', l: 1 },
        { w: 'trousse', g: 'f', t: 'O', l: 1 }, { w: 'étoile', g: 'f', t: 'O', l: 1 }, { w: 'école', g: 'f', t: 'O', l: 1 }, { w: 'montagne', g: 'f', t: 'O', l: 1 },
        // Véhicules
        { w: 'vélo', g: 'm', t: 'V', l: 1 }, { w: 'avion', g: 'm', t: 'V', l: 1 }, { w: 'bateau', g: 'm', t: 'V', l: 3 },
        { w: 'voiture', g: 'f', t: 'V', l: 1 }, { w: 'fusée', g: 'f', t: 'V', l: 1 }, { w: 'moto', g: 'f', t: 'V', l: 1 },
        // Aliments
        { w: 'gâteau', g: 'm', t: 'F', l: 3 }, { w: 'fruit', g: 'm', t: 'F', l: 1 }, { w: 'pomme', g: 'f', t: 'F', l: 1 }, { w: 'tarte', g: 'f', t: 'F', l: 1 },
        // Histoires
        { w: 'journal', g: 'm', t: 'T', l: 3 }, { w: 'conte', g: 'm', t: 'T', l: 1 }, { w: 'histoire', g: 'f', t: 'T', l: 1 }, { w: 'chanson', g: 'f', t: 'T', l: 1 }
    ].filter(n => n.l < 9);
    const OU_X = ['bijou', 'caillou', 'chou', 'genou', 'hibou', 'joujou', 'pou'];
    function plurNoun(w) {
        if (/[sxz]$/.test(w)) return [w, 'sx'];
        if (/(eau|eu)$/.test(w)) return [w + 'x', 'x'];
        if (/al$/.test(w)) return [w.slice(0, -2) + 'aux', 'al'];
        if (OU_X.indexOf(w) !== -1) return [w + 'x', 'ou'];
        return [w + 's', 'plus'];
    }
    function femNounRule(m, f) {
        if (m === f) return 'same';
        if (f === m + 'e') return 'plus';
        if (/er$/.test(m) && f === m.slice(0, -2) + 'ère') return 'er';
        if (/teur$/.test(m) && f === m.slice(0, -3) + 'rice') return 'teur';
        if (/eur$/.test(m) && f === m.slice(0, -1) + 'se') return 'eur';
        if (f === m + m.slice(-1) + 'e') return 'dbl';
        if (/[fp]$/.test(m) && f === m.slice(0, -1) + 've') return 'f';
        if (f === m.replace(/e$/, '') + 'esse') return 'esse';
        return 'diff';
    }
    const NOUN = NOUN_RAW.map((n, i) => {
        const o = { i, t: n.t, l: n.l };
        if (n.m) {
            o.ms = n.m; o.fs = n.f; o.two = true;
            [o.mp, o.rpm] = plurNoun(n.m); [o.fp, o.rpf] = plurNoun(n.f);
            o.rf = femNounRule(n.m, n.f);
        } else {
            o.two = false; o.g = n.g;
            o.ms = n.g === 'm' ? n.w : null; o.fs = n.g === 'f' ? n.w : null;
            const [pl, rp] = plurNoun(n.w);
            if (n.g === 'm') { o.mp = pl; o.rpm = rp; } else { o.fp = pl; o.rpf = rp; }
        }
        o.lemma = o.ms || o.fs;
        return o;
    });
    const DETS = {
        def:   { label: 'le / la / les',     ms: 'le',  fs: 'la',    mp: 'les', fp: 'les' },
        indef: { label: 'un / une / des',    ms: 'un',  fs: 'une',   mp: 'des', fp: 'des' },
        dem:   { label: 'ce / cette / ces',  ms: 'ce',  fs: 'cette', mp: 'ces', fp: 'ces' },
        poss:  { label: 'mon / ma / mes',    ms: 'mon', fs: 'ma',    mp: 'mes', fp: 'mes' }
    };

    const RULES = {
        af: { e: 'il se termine déjà par <b>-e</b> : il ne change pas au féminin', plus: 'on ajoute <b>-e</b>', eux: '<b>-eux</b> devient <b>-euse</b>', er: '<b>-er</b> devient <b>-ère</b>',
              f: '<b>-f</b> devient <b>-ve</b>', dbl: 'on double la consonne finale et on ajoute <b>-e</b>', irr: 'féminin irrégulier, à connaître par cœur' },
        ap: { plus: 'on ajoute <b>-s</b>', sx: 'il se termine déjà par <b>-s</b> ou <b>-x</b> : il ne change pas', x: '<b>-eau</b> prend un <b>-x</b>', al: '<b>-al</b> devient <b>-aux</b>' },
        nf: { same: 'même mot au masculin et au féminin : seul le déterminant change', plus: 'on ajoute <b>-e</b>', er: '<b>-er</b> devient <b>-ère</b>', eur: '<b>-eur</b> devient <b>-euse</b>',
              teur: '<b>-teur</b> devient <b>-trice</b>', dbl: 'on double la consonne finale et on ajoute <b>-e</b>', f: 'la dernière lettre devient <b>-ve</b>', esse: 'on ajoute <b>-esse</b>', diff: 'au féminin, c\'est un autre mot' },
        np: { plus: 'on ajoute <b>-s</b>', sx: 'il se termine déjà par <b>-s</b>, <b>-x</b> ou <b>-z</b> : il ne change pas', x: '<b>-eau</b> / <b>-eu</b> prend un <b>-x</b>', al: '<b>-al</b> devient <b>-aux</b>', ou: 'c\'est un des 7 mots en <b>-ou</b> qui prennent un <b>-x</b>' }
    };

    // =====================================================================
    // MOTEUR : groupe nominal → mots accordés
    //   gn = { det, pre, noun, post:[...], g:'m'|'f', n:'s'|'p' }
    // =====================================================================
    function nounForm(N, g, n) { return N[g + n] || null; }
    function adjForm(A, g, n) { return A[g + n]; }
    function tokens(gn, g, n) {
        g = g || gn.g; n = n || gn.n;
        const N = NOUN[gn.noun];
        const T = [];
        T.push({ role: 'det', det: gn.det });
        if (gn.pre !== null && gn.pre !== undefined) T.push({ role: 'adj', a: gn.pre });
        T.push({ role: 'nom', noun: gn.noun });
        (gn.post || []).forEach((a, k) => { if (k > 0) T.push({ role: 'et' }); T.push({ role: 'adj', a }); });
        T.forEach(t => {
            if (t.role === 'det') t.form = DETS[t.det][g + n];
            else if (t.role === 'adj') { t.form = adjForm(ADJ[t.a], g, n); t.base = ADJ[t.a].ms; }
            else if (t.role === 'nom') { t.form = nounForm(N, g, n); t.base = N.lemma; }
            else t.form = 'et';
        });
        // Élisions et formes devant voyelle
        for (let k = 0; k < T.length - 1; k++) {
            const t = T[k], nx = T[k + 1];
            if (!t.form || !nx.form) continue;
            const v = VOW.test(nx.form);
            if (t.role === 'det' && n === 's' && v) {
                if (t.det === 'def') { t.form = 'l\''; t.note = 'elide'; }
                else if (t.det === 'dem' && g === 'm') { t.form = 'cet'; t.note = 'cet'; }
                else if (t.det === 'poss' && g === 'f') { t.form = 'mon'; t.note = 'mon'; }
            }
            if (t.role === 'det' && n === 'p' && t.det === 'indef' && nx.role === 'adj') { t.form = 'de'; t.note = 'de'; }
            if (t.role === 'adj' && nx.role === 'nom' && g === 'm' && n === 's' && v && ADJ_BEFORE_VOWEL[ADJ[t.a].ms]) { t.form = ADJ_BEFORE_VOWEL[ADJ[t.a].ms]; t.note = 'bel'; }
        }
        T.forEach((t, k) => { t.k = k; });
        return T;
    }
    const gnText = (gn, g, n) => tokens(gn, g, n).map(t => t.form).join(' ').replace(/' /g, '\'');

    // Découpe d'un mot : [partie commune, marque du féminin, marque du pluriel]
    function segs(t, g, n) {
        if (t.role === 'det') return [[t.form, n === 'p' ? 'p' : (g === 'f' && !t.note ? 'f' : '')]];
        if (t.role === 'et' || t.note === 'bel') return [[t.form, '']];
        const W = t.role === 'nom' ? NOUN[t.noun] : ADJ[t.a];
        const ms = W.ms || W.fs, sing = W[g + 's'] || ms;
        const form = t.form;
        let C = '', rest = form;
        if (n === 'p') {
            let cut = lcp(sing, form);
            if (/al$/.test(sing) && /aux$/.test(form)) cut = form.length - 3;
            C = form.slice(cut); rest = form.slice(0, cut);
        }
        let A = rest, B = '';
        if (g === 'f' && W.ms && W.fs && W.ms !== W.fs) {
            const cut2 = lcp(W.ms, rest);
            A = rest.slice(0, cut2); B = rest.slice(cut2);
        }
        return [[A, ''], [B, 'f'], [C, 'p']].filter(x => x[0]);
    }
    function segHtml(t, g, n) {
        return segs(t, g, n).map(([s, c]) => c ? `<span class="ag-${c}">${esc(s)}</span>` : esc(s)).join('');
    }

    // Pour chaque mot : avec quels genres / nombres sa forme est-elle possible ?
    function compat(gn, idx, form) {
        const out = [];
        COMBOS.forEach(c => {
            if (!NOUN[gn.noun][c]) return;
            const T = tokens(gn, c[0], c[1]);
            if (T[idx].form === form) out.push(c);
        });
        return out;
    }
    function ambiguity(gn, g, n, skip) {
        // Combinaisons compatibles avec tous les mots (sauf « skip »)
        const T = tokens(gn, g, n);
        let set = COMBOS.filter(c => !!NOUN[gn.noun][c]);
        T.forEach((t, k) => {
            if (k === skip || t.role === 'et') return;
            const cp = compat(gn, k, t.form);
            set = set.filter(c => cp.indexOf(c) !== -1);
        });
        return set;
    }

    // ── Génération d'un groupe nominal ──
    function adjOk(A, N, lvl) { return A.tags.indexOf(N.t) !== -1 && A.lvl <= lvl; }
    function genGN(lvl, opt) {
        opt = opt || {};
        for (let tries = 0; tries < 400; tries++) {
            let pool = NOUN.filter(N => N.l <= lvl && (!opt.two || N.two));
            if (lvl >= 2 && Math.random() < .5) { const hard = pool.filter(N => N.l === lvl); if (hard.length) pool = hard; }
            const N = pick(pool);
            const nAdj = lvl === 1 ? 1 : lvl === 2 ? (Math.random() < .5 ? 1 : 2) : 2;
            const cands = ADJ.filter(A => adjOk(A, N, lvl));
            const chosen = [];
            for (const A of shuffle(cands)) {
                if (chosen.length >= nAdj) break;
                if (chosen.some(B => B.grp && B.grp === A.grp)) continue;
                if (A.pos === 'pre' && chosen.some(B => B.pos === 'pre')) continue;
                chosen.push(A);
            }
            if (chosen.length < nAdj) continue;
            if (lvl >= 2 && !chosen.some(A => A.lvl >= 2) && N.l < 2 && Math.random() < .7) continue;
            const pre = chosen.find(A => A.pos === 'pre');
            const post = chosen.filter(A => A.pos === 'post').map(A => A.i);
            let det = pick(['def', 'indef', 'dem', 'poss']);
            if (pre && det === 'indef') det = 'def';
            const combos = COMBOS.filter(c => N[c]);
            const c = opt.combo && N[opt.combo] ? opt.combo : pick(combos);
            const gn = { det, pre: pre ? pre.i : null, noun: N.i, post, g: c[0], n: c[1] };
            if (opt.unambiguous && ambiguity(gn, gn.g, gn.n).length !== 1) continue;
            return gn;
        }
        return { det: 'def', pre: ADJ.findIndex(a => a.ms === 'petit'), noun: NOUN.findIndex(n => n.ms === 'chat'), post: [ADJ.findIndex(a => a.ms === 'noir')], g: 'm', n: 's' };
    }

    // Formes « fausses » plausibles (erreurs fréquentes)
    function naiveForms(t) {
        const out = [];
        // Erreurs vraisemblables seulement : « beaus », « génials », « blance », « gentile », « chate », « chevals »…
        if (t.role === 'adj') {
            const A = ADJ[t.a];
            if (!/[sx]$/.test(A.ms)) out.push(A.ms + 's');
            if (!/[ex]$/.test(A.ms) && A.ms + 'e' !== A.fs) out.push(A.ms + 'e', A.ms + 'es');
        } else if (t.role === 'nom') {
            const N = NOUN[t.noun];
            if (N.ms && !/[sxz]$/.test(N.ms)) out.push(N.ms + 's');
            if (N.two && N.ms !== N.fs && !/e$/.test(N.ms) && N.ms + 'e' !== N.fs) out.push(N.ms + 'e', N.ms + 'es');
        }
        return out;
    }
    function optionsFor(gn, t, onlyReal) {
        let opts = [];
        COMBOS.forEach(c => { if (NOUN[gn.noun][c]) { const T = tokens(gn, c[0], c[1]); opts.push(T[t.k].form); } });
        if (!onlyReal) opts = opts.concat(naiveForms(t));
        return opts.filter((v, i, a) => v && a.indexOf(v) === i);
    }

    // Phrases pour les exercices : le groupe nominal est complément (pas d'accord du verbe)
    const FRAMES = [
        'Je regarde {GN} dans la cour.', 'Lina dessine {GN} sur son cahier.', 'Nous cherchons {GN} près de la rivière.',
        'Tom a vu {GN} au marché.', 'Maman photographie {GN} dans le parc.', 'Les enfants admirent {GN} depuis la fenêtre.',
        'Le maître montre {GN} à la classe.', 'Hugo imagine {GN} pendant la nuit.', 'Mes cousins aiment {GN} de mon voisin.'
    ];
    function frameTokens(frame, gn) {
        const [a, b] = frame.split('{GN}');
        const words = s => s.trim() ? s.trim().split(/\s+/) : [];
        const out = [];
        words(a).forEach(w => out.push({ txt: w, gk: -1 }));
        tokens(gn).forEach(t => out.push({ txt: t.form, gk: t.k }));
        words(b).forEach(w => {
            const m = w.match(/^(.*?)([.,!?]?)$/);
            out.push({ txt: m[1], gk: -1 });
            if (m[2]) out.push({ txt: m[2], gk: -2 });
        });
        return out;
    }

    // =====================================================================
    // SONS / VOIX
    // =====================================================================
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function speak(text) {
        if (!canSpeak) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'fr-FR'; u.rate = 0.9;
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
        chain: () => [660, 784, 988].forEach((f, i) => tone(f, 0.08 * i, 0.12, 'sine', 0.06)),
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    // =====================================================================
    // TABLEAU NOIR : rendu d'une chaîne + flèches
    // =====================================================================
    const ROLE_LBL = { det: 'déterminant', nom: 'nom', adj: 'adjectif', et: 'ne s\'accorde pas' };
    function boardHtml(gn, opts) {
        opts = opts || {};
        const T = tokens(gn);
        const toks = T.map(t => {
            const chief = t.role === 'nom';
            const link = t.role === 'det' || t.role === 'adj';
            return `<div class="ag-tok ${t.role}${opts.flip && t.role !== 'et' ? ' flip' : ''}"><span class="w"${chief ? ' data-chief="1"' : ''}${link ? ' data-link="1"' : ''}>${chief ? '<span class="ag-crown">👑</span>' : ''}${segHtml(t, gn.g, gn.n)}</span><span class="r">${ROLE_LBL[t.role]}${chief ? ' chef' : ''}</span></div>`;
        }).join('');
        return `<div class="ag-board${opts.small ? ' small' : ''}"><div class="ag-arrows"><svg class="ag-svg${opts.anim ? ' anim' : ''}"></svg><div class="ag-row">${toks}</div></div>
            ${opts.label ? `<div class="gnlbl">${opts.label}</div>` : ''}</div>`;
    }
    function drawArrows(scope) {
        scope.querySelectorAll('.ag-arrows').forEach(box => {
            const svg = box.querySelector('.ag-svg');
            const chief = box.querySelector('[data-chief]');
            if (!svg || !chief) return;
            const br = box.getBoundingClientRect();
            if (!br.width) return;
            const scale = box.offsetWidth ? br.width / box.offsetWidth : 1;
            const P = el => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - br.left) / scale, y: (r.top - br.top) / scale, l: (r.left - br.left) / scale, r: (r.right - br.left) / scale }; };
            const c = P(chief);
            const fs = parseFloat(getComputedStyle(box.closest('.ag-board') || box).getPropertyValue('--bf')) || 40;
            let h = '';
            box.querySelectorAll('[data-link]').forEach((el, i) => {
                const t = P(el);
                const dir = t.x < c.x ? -1 : 1;
                const half = (c.r - c.l) / 2;
                const x1 = c.x + dir * Math.min(half - 4, Math.max(half * .62, fs * .35)), y1 = c.y + fs * .08;
                const x2 = t.x, y2 = t.y + fs * .02;
                const dx = Math.abs(x2 - x1);
                const top = Math.min(y1, y2) - Math.min(fs * 1.55, 18 + dx * .28);
                const d = `M${x1.toFixed(1)},${y1.toFixed(1)} C${x1.toFixed(1)},${top.toFixed(1)} ${x2.toFixed(1)},${top.toFixed(1)} ${x2.toFixed(1)},${(y2 - 9).toFixed(1)}`;
                const len = Math.round(dx * 1.3 + (y1 - top) * 2 + 20);
                const delay = (i * .12).toFixed(2);
                h += `<path class="ln" d="${d}" style="stroke-dasharray:${len};--len:${len}px;animation-delay:${delay}s"/>`;
                h += `<path class="hd" d="M${(x2 - 7).toFixed(1)},${(y2 - 13).toFixed(1)} L${(x2 + 7).toFixed(1)},${(y2 - 13).toFixed(1)} L${x2.toFixed(1)},${(y2 - 1).toFixed(1)} Z" style="animation-delay:${delay}s"/>`;
            });
            svg.innerHTML = h;
        });
    }

    // Explications mot par mot
    function explain(gn) {
        const g = gn.g, n = gn.n, T = tokens(gn);
        const N = NOUN[gn.noun];
        const lines = [], notes = [];
        T.forEach(t => {
            if (t.role === 'det') {
                lines.push(`<b>${esc(t.form)}</b> : déterminant ${n === 'p' ? 'pluriel' : GN_LBL[g + n]}${n === 'p' ? ' (le même au masculin et au féminin)' : ''}.`);
                if (t.note === 'elide') notes.push(`Devant une voyelle, <b>le</b> et <b>la</b> deviennent <b>l'</b>.`);
                if (t.note === 'cet') notes.push(`Devant une voyelle, <b>ce</b> devient <b>cet</b> : cet ${esc(T[t.k + 1].form)}.`);
                if (t.note === 'mon') notes.push(`Devant une voyelle, on dit <b>mon</b> même au féminin : mon ${esc(T[t.k + 1].form)}.`);
                if (t.note === 'de') notes.push(`Devant un adjectif au pluriel, <b>des</b> devient <b>de</b> : de ${esc(T[t.k + 1].form)}…`);
            } else if (t.role === 'nom') {
                let s = `<b>${esc(t.form)}</b> : c'est le <b>nom chef</b>, il est <b>${GN_LBL[g + n]}</b>.`;
                const r = [];
                if (g === 'f' && N.two) r.push(`féminin : ${RULES.nf[N.rf]}`);
                if (n === 'p') r.push(`pluriel : ${RULES.np[g === 'f' ? N.rpf : N.rpm]}`);
                if (r.length) s += ' ' + r.join(' ; ') + '.';
                lines.push(s);
            } else if (t.role === 'adj') {
                const A = ADJ[t.a];
                if (t.note === 'bel') { lines.push(`<b>${esc(t.form)}</b> : ${esc(A.ms)} devient <b>${esc(t.form)}</b> devant un nom masculin qui commence par une voyelle.`); return; }
                if (g === 'm' && n === 's') { lines.push(`<b>${esc(t.form)}</b> : adjectif masculin singulier, on écrit le mot de base.`); return; }
                const r = [];
                if (g === 'f') r.push(`féminin : ${RULES.af[A.rf]}`);
                if (n === 'p') r.push(g === 'f' ? 'pluriel : on ajoute <b>-s</b> au féminin' : `pluriel : ${RULES.ap[A.rp]}`);
                lines.push(`${esc(A.ms)} → <b>${esc(t.form)}</b> : ${r.join(' ; ')}.`);
            } else lines.push(`<b>et</b> relie les deux adjectifs : il <b>ne s'accorde pas</b>.`);
        });
        return { lines, notes };
    }

    // =====================================================================
    // LEÇONS
    // =====================================================================
    const LESSONS = [
        { id: 'gn',      label: '👑 Le nom chef',       color: '#C98A00' },
        { id: 'chaine',  label: '🔗 La chaîne',         color: '#6C4FD8' },
        { id: 'feminin', label: '♀ Le féminin',         color: '#D63384' },
        { id: 'pluriel', label: '➕ Le pluriel',         color: '#1E6FD9' },
        { id: 'pieges',  label: '⚠️ Les pièges',        color: '#E8862A' }
    ];
    const EXT = {
        chaine:  { label: '🔗 La chaîne',      color: '#6C4FD8' },
        accorde: { label: '✍️ Accorde',        color: '#22A35A' },
        erreur:  { label: '🕵️ L\'erreur',      color: '#E8862A' },
        genre:   { label: '🏷️ Genre et nombre', color: '#D63384' }
    };
    const LEVELS = { 1: { label: '😊 Facile', color: '#2FBF71' }, 2: { label: '😐 Moyen', color: '#F2994A' }, 3: { label: '😤 Difficile', color: '#EB5757' } };
    const findN = w => NOUN.findIndex(N => N.ms === w || N.fs === w);
    const findA = w => ADJ.findIndex(A => A.ms === w);
    const mkGN = (det, pre, noun, post, c) => ({ det, pre: pre ? findA(pre) : null, noun: findN(noun), post: (post || []).map(findA), g: c[0], n: c[1] });

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'gn',
            lab: mkGN('def', 'petit', 'chat', ['noir'], 'ms'),
            labMsg: '', builder: false,
            ex: { type: 'chaine', level: 1, n: 8, mode: 'mix' },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createAccordGNWidget = function (saved) {
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
        container.className = 'ag-container';
        container.innerHTML = `
            <div class="ag-header">
                <span class="ag-title">🔗 La chaîne d'accords</span>
                <div class="ag-tabs">
                    <button class="ag-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="ag-tab-lbl">Leçons</span></button>
                    <button class="ag-tab" data-act="tab" data-tab="lab"><span>🔗</span><span class="ag-tab-lbl">La chaîne</span></button>
                    <button class="ag-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="ag-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="ag-icon-btn" data-act="sound" title="Son"></button>
                    <button class="ag-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="ag-body"></div>
            <div class="ag-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — Le nom chef, la chaîne d'accords, le féminin, le pluriel et les pièges. Marque du <b style="color:#D63384">féminin</b> en rose, marque du <b style="color:#1E6FD9">pluriel</b> en bleu.</p>
                <p><b>🔗 La chaîne</b> — Un groupe nominal sur le tableau noir. Change le <b>genre</b> (masculin / féminin) et le <b>nombre</b> (singulier / pluriel) du nom : les flèches montrent tous les mots qui changent avec lui. <b>🎲</b> donne un autre groupe, <b>✏️ Construire</b> permet de choisir le déterminant, le nom et les adjectifs.</p>
                <p><b>✏️ Exercices</b> — 🔗 toucher les mots qui s'accordent avec le nom, ✍️ accorder le groupe nominal, 🕵️ trouver le mot mal accordé, 🏷️ trouver le genre et le nombre. Puis <b>👁 Correction</b> avec le score.</p>
            </div>
            <div class="ag-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.ag-body');
        const help = container.querySelector('.ag-help');
        const resizeHandle = container.querySelector('.ag-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k]) && k !== 'lab') S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        if (!S.lab || !NOUN[S.lab.noun]) S.lab = defaultState().lab;
        let msg = '', flip = false;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        const LEG = `<div class="ag-legend"><span style="color:#D63384">marque du féminin</span><span style="color:#1E6FD9">marque du pluriel</span></div>`;
        // Petit exemple coloré (sans tableau)
        function ex(gn) { const T = tokens(gn); return `<span class="ag-w">${T.map(t => segHtml(t, gn.g, gn.n)).join(' ').replace(/' /g, '\'')}</span>`; }
        const E = (det, pre, noun, post, c) => ex(mkGN(det, pre, noun, post, c));
        function renderGN() {
            const g1 = mkGN('def', 'petit', 'chat', ['noir'], 'ms');
            return `<div class="ag-ltitle"><h2 style="color:#C98A00">👑 Le groupe nominal et son nom chef</h2></div>
                <div class="ag-box ag-what"><b class="t">🔤 Le groupe nominal</b>Un <b>groupe nominal</b> (GN) est un groupe de mots construit autour d'un <b>nom</b>. Le nom est le <b>chef</b> du groupe.
                    Il est accompagné d'un <b>déterminant</b> et parfois d'un ou plusieurs <b>adjectifs</b>.</div>
                ${boardHtml(g1, { small: true, label: 'le chat est masculin singulier' })}
                <div class="ag-box ag-test"><b class="t">🔎 Le nom chef donne son genre et son nombre</b><ul>
                    <li>Le <b>genre</b> : <b>masculin</b> (on peut dire <i>un</i> ou <i>le</i>) ou <b>féminin</b> (on peut dire <i>une</i> ou <i>la</i>).</li>
                    <li>Le <b>nombre</b> : <b>singulier</b> (un seul) ou <b>pluriel</b> (plusieurs).</li>
                    <li>Le déterminant et les adjectifs prennent le même genre et le même nombre que le nom : <b>ils s'accordent</b> avec lui.</li></ul>
                    <div class="ag-ex">${E('def', 'petit', 'chat', ['noir'], 'ms')} → ${E('def', 'petit', 'chat', ['noir'], 'fs')} → ${E('def', 'petit', 'chat', ['noir'], 'fp')}</div>${LEG}</div>
                <div class="ag-box ag-memo"><b class="t">🧠 Pour retenir</b>Le nom <b>commande</b>, le déterminant et les adjectifs <b>obéissent</b> ! 👑</div>
                <div class="ag-box ag-trap"><b class="t">⚠️ Attention</b>Le genre d'un objet ne se choisit pas : <i>une table</i> est toujours féminin, <i>un vélo</i> toujours masculin. Pour les personnes et les animaux, le nom change souvent : <span class="ag-ex">${E('indef', '', 'chien', [], 'ms')} / ${E('indef', '', 'chien', [], 'fs')}</span>.</div>
                <div><button class="ag-btn go" data-act="tab" data-tab="lab">🔗 Essayer sur le tableau</button> <button class="ag-btn alt" data-act="practice" data-v="genre">🏷️ S'entraîner : genre et nombre</button></div>`;
        }
        function renderChaine() {
            const g1 = mkGN('def', 'petit', 'souris', ['gris'], 'fp');
            const g2 = mkGN('indef', '', 'chat', ['noir', 'gourmand'], 'fs');
            return `<div class="ag-ltitle"><h2 style="color:#6C4FD8">🔗 La chaîne d'accords</h2></div>
                <div class="ag-box ag-what"><b class="t">🔤 Qu'est-ce que la chaîne d'accords ?</b>Tous les mots qui s'accordent avec le nom forment une <b>chaîne</b>. Si le nom change de genre ou de nombre, <b>toute la chaîne change</b>. Les flèches partent du nom chef.</div>
                ${boardHtml(g1, { small: true, label: 'souris : féminin pluriel' })}
                ${boardHtml(g2, { small: true, label: 'chatte : féminin singulier' })}
                <div class="ag-box ag-test"><b class="t">🔧 La méthode en 3 étapes</b><ol>
                    <li>Je trouve le <b>nom chef</b> du groupe. 👑</li>
                    <li>Je cherche son <b>genre</b> (masculin ou féminin) et son <b>nombre</b> (singulier ou pluriel).</li>
                    <li>Je suis les flèches : j'accorde le <b>déterminant</b> et <b>chaque adjectif</b>, même s'ils sont loin du nom.</li></ol></div>
                <div class="ag-box ag-memo"><b class="t">🧠 Pour retenir</b>Quand il y a deux adjectifs, <b>les deux</b> s'accordent. Le petit mot <b>et</b>, lui, ne s'accorde jamais.</div>
                <div class="ag-box ag-trap"><b class="t">⚠️ On n'entend pas toujours l'accord</b><span class="ag-ex">${E('def', 'joli', 'ami', [], 'ms')} · ${E('def', 'joli', 'ami', [], 'fs')} · ${E('def', 'joli', 'ami', [], 'mp')} · ${E('def', 'joli', 'ami', [], 'fp')}</span> : on entend presque la même chose ! Il faut <b>réfléchir</b>, pas écouter.</div>
                <div><button class="ag-btn go" data-act="tab" data-tab="lab">🔗 Jouer avec la chaîne</button> <button class="ag-btn alt" data-act="practice" data-v="chaine">✏️ S'entraîner</button></div>`;
        }
        function renderFeminin() {
            const row = (rule, exs) => `<tr><td>${rule}</td><td class="ag-ex">${exs}</td></tr>`;
            const F = (w, lst) => lst.map(x => { const A = ADJ[findA(x)]; return A ? ex({ det: 'def', pre: null, noun: findN(w), post: [A.i], g: 'f', n: 's' }) : ''; }).join(', ');
            const adj = (ms) => { const A = ADJ[findA(ms)]; return `${esc(A.ms)} → ${segHtml({ role: 'adj', a: A.i, form: A.fs }, 'f', 's')}`; };
            const noun = (m) => { const N = NOUN[findN(m)]; return `${esc(N.ms)} → ${segHtml({ role: 'nom', noun: N.i, form: N.fs }, 'f', 's')}`; };
            return `<div class="ag-ltitle"><h2 style="color:#D63384">♀ Le féminin des noms et des adjectifs</h2></div>
                <div class="ag-box ag-what"><b class="t">🔤 La règle générale</b>Au féminin, on ajoute souvent un <b>-e</b> : <span class="ag-ex">${adj('petit')}, ${adj('grand')}, ${noun('ami')}, ${noun('voisin')}</span></div>
                <table class="ag-table"><tbody>
                    ${row('déjà un -e', `${adj('rouge')}, ${adj('jeune')}, ${noun('élève')}`)}
                    ${row('-er → -ère', `${adj('léger')}, ${adj('fier')}, ${noun('boulanger')}`)}
                    ${row('-eux → -euse', `${adj('heureux')}, ${adj('peureux')}`)}
                    ${row('-eur → -euse', `${noun('chanteur')}, ${noun('danseur')}`)}
                    ${row('-teur → -trice', `${noun('acteur')}, ${noun('directeur')}`)}
                    ${row('-f → -ve', `${adj('sportif')}, ${adj('neuf')}, ${noun('loup')}`)}
                    ${row('consonne doublée', `${adj('cruel')}, ${adj('mignon')}, ${adj('gentil')}, ${noun('chien')}, ${noun('chat')}, ${noun('lion')}`)}
                    ${row('-esse', `${noun('prince')}, ${noun('tigre')}, ${noun('maître')}`)}
                    ${row('irréguliers', `${adj('beau')}, ${adj('vieux')}, ${adj('blanc')}, ${adj('doux')}, ${adj('long')}, ${adj('frais')}`)}
                    ${row('un autre mot', `${noun('roi')}, ${noun('cheval')}`)}
                </tbody></table>
                <div class="ag-box ag-memo"><b class="t">🧠 Pour retenir</b>Pour trouver le féminin d'un adjectif, je le mets après <b>une</b> : <i>un chat <b>blanc</b> → une chatte <b>blanche</b></i>. La lettre muette du masculin s'entend souvent au féminin : <i>gris → grise</i>, <i>petit → petite</i>.</div>
                <div><button class="ag-btn go" data-act="practice" data-v="accorde">✍️ S'entraîner : accorde</button></div>`;
        }
        function renderPluriel() {
            const row = (rule, exs) => `<tr><td>${rule}</td><td class="ag-ex">${exs}</td></tr>`;
            const adj = (ms, g) => { const A = ADJ[findA(ms)]; g = g || 'm'; return `${esc(A[g + 's'])} → ${segHtml({ role: 'adj', a: A.i, form: A[g + 'p'] }, g, 'p')}`; };
            const noun = (w) => { const N = NOUN[findN(w)]; const g = N.ms ? 'm' : 'f'; return `${esc(N[g + 's'])} → ${segHtml({ role: 'nom', noun: N.i, form: N[g + 'p'] }, g, 'p')}`; };
            return `<div class="ag-ltitle"><h2 style="color:#1E6FD9">➕ Le pluriel des noms et des adjectifs</h2></div>
                <div class="ag-box ag-what"><b class="t">🔤 La règle générale</b>Au pluriel, on ajoute souvent un <b>-s</b> : <span class="ag-ex">${noun('chat')}, ${adj('petit')}, ${noun('maison')}, ${adj('vert')}</span></div>
                <table class="ag-table"><tbody>
                    ${row('-s, -x, -z : pas de changement', `${noun('souris')}, ${noun('ours')}, ${adj('gris')}, ${adj('heureux')}, ${adj('vieux')}`)}
                    ${row('-eau, -eu → -x', `${noun('gâteau')}, ${noun('bateau')}, ${noun('jeu')}, ${adj('beau')}, ${adj('nouveau')}`)}
                    ${row('-al → -aux', `${noun('journal')}, ${noun('cheval')}, ${adj('génial')}, ${adj('spécial')}`)}
                    ${row('7 mots en -ou → -x', `${noun('bijou')} — et caillou, chou, genou, hibou, joujou, pou`)}
                    ${row('féminin pluriel', `${adj('petit', 'f')}, ${adj('heureux', 'f')}, ${adj('beau', 'f')}, ${adj('génial', 'f')}`)}
                </tbody></table>
                <div class="ag-box ag-memo"><b class="t">🧠 Pour retenir</b>Au <b>féminin pluriel</b>, c'est toujours facile : le féminin + <b>-s</b> (<i>belle → belles</i>, <i>génial<b>e</b> → géniales</i>).</div>
                <div class="ag-box ag-trap"><b class="t">⚠️ Attention</b><i>bleu</i> est une exception : des yeux <b>bleus</b>. Le déterminant aide à repérer le pluriel : <b>les, des, ces, mes, plusieurs, deux</b>…</div>
                <div><button class="ag-btn go" data-act="practice" data-v="accorde">✍️ S'entraîner : accorde</button></div>`;
        }
        function renderPieges() {
            return `<div class="ag-ltitle"><h2 style="color:#E8862A">⚠️ Les pièges de l'accord</h2></div>
                <div class="ag-box ag-trap"><b class="t">1. L'adjectif loin du nom</b>Il y a parfois un adjectif <b>avant</b> le nom et un autre <b>après</b> : les deux s'accordent. <span class="ag-ex">${E('def', 'petit', 'souris', ['gris'], 'fp')}</span></div>
                <div class="ag-box ag-trap"><b class="t">2. Le complément du nom ne s'accorde pas</b>Dans <span class="ag-ex">des robe<span class="ag-p">s</span> de princesse</span>, le nom chef est <b>robes</b>. <i>de princesse</i> est un complément : il ne change pas. <span class="ag-ex">les jouet<span class="ag-p">s</span> de mon frère</span></div>
                <div class="ag-box ag-trap"><b class="t">3. Devant une voyelle</b><span class="ag-ex">${E('def', '', 'ami', [], 'fs')} · ${E('dem', '', 'arbre', [], 'ms')} · ${E('poss', '', 'école', [], 'fs')} · ${E('indef', 'beau', 'avion', [], 'ms')} · ${E('indef', 'vieux', 'ami', [], 'ms')} · ${E('indef', 'nouveau', 'élève', [], 'ms')}</span></div>
                <div class="ag-box ag-trap"><b class="t">4. « des » devient « de » devant un adjectif</b><span class="ag-ex">des fleurs → ${E('indef', 'joli', 'fleur', [], 'fp')}</span></div>
                <div class="ag-box ag-trap"><b class="t">5. Un masculin + un féminin</b>Si un adjectif va avec un nom masculin <b>et</b> un nom féminin, il se met au <b>masculin pluriel</b> : <span class="ag-ex">un pantalon et une veste noir<span class="ag-p">s</span></span></div>
                <div class="ag-box ag-memo"><b class="t">🧠 Pour retenir</b>Je ne me fie pas à mon oreille : je cherche le nom chef 👑, puis je <b>suis les flèches</b>.</div>
                <div><button class="ag-btn go" data-act="practice" data-v="erreur">🕵️ S'entraîner : l'erreur</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="ag-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { gn: renderGN, chaine: renderChaine, feminin: renderFeminin, pluriel: renderPluriel, pieges: renderPieges }[S.lesson]();
            return `<div class="ag-lesson"><div class="ag-side">${side}</div><div class="ag-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : LA CHAÎNE (tableau interactif)
        // =================================================================
        function renderLab() {
            const L = S.lab, N = NOUN[L.noun];
            let h = `<div class="ag-lab">`;
            h += `<div class="ag-ctrl">
                <div class="ag-seg"><button class="m ${L.g === 'm' ? 'on' : ''}" data-act="lg" data-v="m">♂ masculin</button><button class="f ${L.g === 'f' ? 'on' : ''}" data-act="lg" data-v="f">♀ féminin</button></div>
                <div class="ag-seg"><button class="s ${L.n === 's' ? 'on' : ''}" data-act="ln" data-v="s">● singulier</button><button class="p ${L.n === 'p' ? 'on' : ''}" data-act="ln" data-v="p">●●● pluriel</button></div>
                <button class="ag-btn alt small" data-act="lrandom" title="Un autre groupe nominal">🎲 Autre groupe</button>
                <button class="ag-btn alt small" data-act="builder">✏️ ${S.builder ? 'Fermer' : 'Construire'}</button>
                ${canSpeak ? `<button class="ag-btn alt small" data-act="lsay">🔊</button>` : ''}
            </div>`;
            h += boardHtml(L, { anim: flip, flip, label: `👑 ${esc(nounForm(N, L.g, L.n))} : ${GN_LBL[L.g + L.n]}` });
            if (S.builder) h += renderBuilder();
            const ex = explain(L);
            h += `<div class="ag-explain">${S.labMsg ? `<div class="note" style="margin:0 0 6px">${S.labMsg}</div>` : ''}<ul>${ex.lines.map(l => `<li>${l}</li>`).join('')}</ul>${ex.notes.map(n => `<div class="note">💡 ${n}</div>`).join('')}<div style="margin-top:6px">${LEG}</div></div>`;
            return h + `</div>`;
        }
        function renderBuilder() {
            const L = S.lab, N = NOUN[L.noun];
            const ch = (act, v, on, lbl, col, dim) => `<button class="ag-chip ${on ? 'on' : ''} ${dim ? 'dim' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="ag-builder">`;
            h += `<div class="ag-srow"><span class="l">Déterminant</span>${Object.keys(DETS).map(k => ch('bdet', k, L.det === k, DETS[k].label, '#7B5CE0')).join('')}</div>`;
            const groups = [['P', '👧 Personnes'], ['A', '🐾 Animaux'], ['O', '📦 Objets'], ['V', '🚲 Véhicules'], ['F', '🍎 Aliments'], ['T', '📖 Histoires']];
            groups.forEach(([t, lbl]) => {
                h += `<div class="ag-srow"><span class="l">${lbl}</span>${NOUN.filter(x => x.t === t).map(x => ch('bnoun', x.i, L.noun === x.i, esc(x.two ? (x.ms === x.fs ? x.ms : x.ms + ' / ' + x.fs) : x.lemma), '#C98A00')).join('')}</div>`;
            });
            const adjs = ADJ.filter(A => A.tags.indexOf(N.t) !== -1);
            h += `<div class="ag-srow"><span class="l">Adjectifs avant</span>${adjs.filter(A => A.pos === 'pre').map(A => ch('badj', A.i, L.pre === A.i, esc(A.ms), '#1E9C55')).join('')}</div>`;
            h += `<div class="ag-srow"><span class="l">Adjectifs après</span>${adjs.filter(A => A.pos === 'post').map(A => ch('badj', A.i, L.post.indexOf(A.i) !== -1, esc(A.ms), '#1E9C55')).join('')}</div>`;
            h += `<div class="ag-hint">Un adjectif au plus avant le nom, deux au plus après. Seuls les adjectifs qui vont avec ce nom sont proposés.</div>`;
            return h + `</div>`;
        }
        function labSwitchGender(g) {
            const L = S.lab, N = NOUN[L.noun];
            if (N.two) { L.g = g; S.labMsg = ''; return; }
            if (N.g === g) return;
            // Le genre d'un nom d'objet ne change pas : on prend un autre nom
            const cands = NOUN.filter(x => !x.two && x.g === g && x.t === N.t);
            if (!cands.length) { S.labMsg = `Le nom « ${esc(N.lemma)} » est toujours ${N.g === 'm' ? 'masculin' : 'féminin'}.`; return; }
            const M = pick(cands);
            S.labMsg = `🔁 Le nom « <b>${esc(N.lemma)}</b> » est toujours ${N.g === 'm' ? 'masculin' : 'féminin'} : on ne peut pas changer son genre. Pour passer au ${g === 'm' ? 'masculin' : 'féminin'}, je change de nom : « <b>${esc(M.lemma)}</b> ».`;
            L.noun = M.i; L.g = g;
        }
        function labRandom() {
            const gn = genGN(pick([1, 2, 3]));
            S.lab = gn; S.labMsg = '';
        }

        // =================================================================
        // EXERCICES : génération
        // =================================================================
        function genRun() {
            const ex = S.ex, lvl = ex.level, n = ex.n;
            const qs = [];
            let guard = 0;
            const frames = lvl === 3 ? FRAMES : FRAMES.slice(0, 8);
            while (qs.length < n && guard++ < 500) {
                if (ex.type === 'chaine') {
                    const gn = genGN(lvl);
                    qs.push({ gn, frame: pick(frames), hide: lvl === 3 });
                } else if (ex.type === 'accorde') {
                    let mode = ex.mode === 'mix' ? pick(['g', 'n', 'gn']) : ex.mode;
                    const gn = genGN(lvl, { two: mode !== 'n' });
                    const N = NOUN[gn.noun];
                    let tg = gn.g, tn = gn.n;
                    if (mode !== 'n') tg = gn.g === 'm' ? 'f' : 'm';
                    if (mode !== 'g') tn = gn.n === 's' ? 'p' : 's';
                    if (!N[tg + tn]) continue;
                    const T = tokens(gn);
                    const opts = T.map(t => {
                        if (t.role === 'et') return null;
                        const real = optionsFor(gn, t, true);
                        const fake = shuffle(optionsFor(gn, t).filter(f => real.indexOf(f) === -1));
                        return real.concat(fake).slice(0, Math.max(real.length, lvl === 1 ? 3 : 4));
                    });
                    // On s'assure que la bonne forme et la forme de départ sont proposées
                    const TT = tokens(gn, tg, tn);
                    opts.forEach((o, k) => {
                        if (!o) return;
                        [TT[k].form, T[k].form].forEach(f => { if (o.indexOf(f) === -1) { o.pop(); o.push(f); } });
                        o.sort((a, b) => a.localeCompare(b, 'fr'));
                    });
                    qs.push({ gn, tg, tn, mode, opts });
                } else if (ex.type === 'erreur') {
                    const gn = genGN(lvl, { unambiguous: true });
                    const T = tokens(gn);
                    const cand = shuffle(T.filter(t => t.role === 'adj' || t.role === 'det' || (lvl === 3 && t.role === 'nom' && NOUN[gn.noun].two)));
                    let made = null;
                    for (const t of cand) {
                        if (ambiguity(gn, gn.g, gn.n, t.k).length !== 1) continue;
                        const ok = f => f !== t.form && compat(gn, t.k, f).indexOf(gn.g + gn.n) === -1;
                        const real = shuffle(optionsFor(gn, t, true).filter(ok)), fake = shuffle(optionsFor(gn, t).filter(f => ok(f) && real.indexOf(f) === -1));
                        const wrongs = Math.random() < .75 || !fake.length ? real.concat(fake) : fake.concat(real);
                        if (wrongs.length) { made = { k: t.k, wrong: wrongs[0] }; break; }
                    }
                    if (!made) continue;
                    qs.push({ gn, frame: pick(frames), wk: made.k, wrong: made.wrong });
                } else {
                    const gn = genGN(lvl, { unambiguous: true });
                    qs.push({ gn });
                }
            }
            if (!qs.length) return 'Aucune question disponible.';
            S.run = { type: ex.type, qs, ans: ex.type === 'accorde' ? qs.map(q => tokens(q.gn).map(t => t.form)) : [], corrected: false };
            return '';
        }
        function chainSet(q) {
            const s = [];
            tokens(q.gn).forEach(t => { if (t.role === 'det' || t.role === 'adj' || (q.hide && t.role === 'nom')) s.push(t.k); });
            return s;
        }
        function isRight(R, q, i) {
            const a = R.ans[i];
            if (R.type === 'chaine') { const s = chainSet(q), m = a || []; return s.length === m.length && s.every(k => m.indexOf(k) !== -1); }
            if (R.type === 'accorde') { const TT = tokens(q.gn, q.tg, q.tn); return TT.every((t, k) => t.role === 'et' || a[k] === t.form); }
            if (R.type === 'erreur') return a === q.wk;
            return a === q.gn.g + q.gn.n;
        }
        const scoreOf = R => ({ ok: R.qs.filter((q, i) => isRight(R, q, i)).length, n: R.qs.length });

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="ag-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="ag-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="ag-settings">`;
            h += `<div class="ag-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            h += `<div class="ag-srow"><span class="l">2. Niveau</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}
                <span class="ag-hint">${ex.level === 1 ? '1 adjectif, accords réguliers' : ex.level === 2 ? '1 ou 2 adjectifs, -eux, -er, -f, consonne doublée…' : '2 adjectifs, mots irréguliers, -al, -eau, -s / -x'}${ex.type === 'chaine' && ex.level === 3 ? ' — le nom chef n\'est pas indiqué' : ''}</span></div>`;
            if (ex.type === 'accorde') h += `<div class="ag-srow"><span class="l">Transformation</span>${ch('mode', 'n', ex.mode === 'n', 'changer le nombre')}${ch('mode', 'g', ex.mode === 'g', 'changer le genre')}${ch('mode', 'gn', ex.mode === 'gn', 'changer les deux')}${ch('mode', 'mix', ex.mode === 'mix', '🎲 mélange')}</div>`;
            h += `<div class="ag-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="ag-srow"><span class="l">Taille du texte</span><button class="ag-btn alt small" data-act="font" data-d="-2">A−</button><button class="ag-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="ag-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="ag-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="ag-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function card(R, i, inner, title) {
            let cls = '', mark = '';
            if (R.corrected) { const ok = isRight(R, R.qs[i], i); cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌'; }
            return `<div class="ag-q ${cls}"><div class="ag-qtop"><span class="ag-num">${i + 1})</span>${title}<span style="margin-left:auto">${mark}</span></div>${inner}</div>`;
        }
        function sentenceHtml(words, wordHtml) {
            let h = '';
            words.forEach((w, j) => {
                if (w.gk === -2) { h += `<span style="margin-left:-.14em">${esc(w.txt)}</span>`; return; }
                const nx = words[j + 1];
                const glue = /'$/.test(w.txt) ? '' : (nx && nx.gk === -2 ? '' : ' ');
                h += wordHtml(w, j) + glue;
            });
            return h;
        }
        function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
        function renderQuestions(R) {
            if (R.type === 'chaine') {
                return `<div class="ag-grid one">` + R.qs.map((q, i) => {
                    const words = frameTokens(q.frame, q.gn), T = tokens(q.gn);
                    const set = chainSet(q), mine = R.ans[i] || [];
                    const inner = sentenceHtml(words, (w, j) => {
                        let cls = 'ag-word';
                        const gk = w.gk;
                        const isChief = gk >= 0 && T[gk].role === 'nom';
                        if (isChief && !q.hide) cls += ' chief';
                        const selected = gk >= 0 ? mine.indexOf(gk) !== -1 : mine.indexOf('f' + j) !== -1;
                        if (!R.corrected) { cls += ' click'; if (selected) cls += ' sel'; }
                        else {
                            const inSet = gk >= 0 && set.indexOf(gk) !== -1;
                            if (selected && inSet) cls += ' good'; else if (selected) cls += ' bad'; else if (inSet) cls += ' miss';
                            if (isChief && q.hide && !selected) cls += ' chief';
                        }
                        const key = gk >= 0 ? gk : 'f' + j;
                        const txt = j === 0 ? cap(w.txt) : w.txt;
                        return `<span class="${cls}"${R.corrected || (isChief && !q.hide) ? '' : ` data-act="tw" data-i="${i}" data-k="${key}"`}>${esc(txt)}</span>`;
                    });
                    let h = `<div class="ag-sent">${inner}</div>`;
                    if (R.corrected) h += `<div class="ag-why">🔗 Le nom chef est <b>${esc(T.find(t => t.role === 'nom').form)}</b> (${GN_LBL[q.gn.g + q.gn.n]}). Il commande : ${T.filter(t => t.role === 'det' || t.role === 'adj').map(t => '<b>' + esc(t.form) + '</b>').join(', ')}.</div>`;
                    return card(R, i, h, q.hide ? 'Touche le nom chef et tous les mots qui s\'accordent avec lui' : 'Touche les mots qui s\'accordent avec le nom souligné');
                }).join('') + `</div>`;
            }
            if (R.type === 'accorde') {
                return `<div class="ag-grid">` + R.qs.map((q, i) => {
                    const T = tokens(q.gn), TT = tokens(q.gn, q.tg, q.tn), a = R.ans[i] || [];
                    const what = q.mode === 'n' ? (q.tn === 'p' ? 'au <b>pluriel</b>' : 'au <b>singulier</b>') : q.mode === 'g' ? (q.tg === 'f' ? 'au <b>féminin</b>' : 'au <b>masculin</b>') : `au <b>${GN_LBL[q.tg + q.tn]}</b>`;
                    let h = `<div class="ag-src">${esc(gnText(q.gn))}</div><div class="ag-consigne">⬇ Écris-le ${what}</div><div class="ag-cols">`;
                    T.forEach((t, k) => {
                        if (t.role === 'et') { h += `<div class="ag-col fixed"><span class="ro">et</span></div>`; return; }
                        h += `<div class="ag-col">` + q.opts[k].map(f => {
                            let c = a[k] === f ? 'on' : '';
                            if (R.corrected) c = f === TT[k].form ? (a[k] === f ? 'good' : 'want') : (a[k] === f ? 'bad' : '');
                            return `<button class="ag-opt ${c}"${R.corrected ? '' : ` data-act="opt" data-i="${i}" data-k="${k}" data-v="${esc(f)}"`}>${esc(f)}</button>`;
                        }).join('') + `</div>`;
                    });
                    h += `</div>`;
                    if (R.corrected) h += `<div class="ag-why">✔ <span class="ag-w" style="font-size:1.25em">${TT.map(t => segHtml(t, q.tg, q.tn)).join(' ').replace(/' /g, '\'')}</span></div>`;
                    return card(R, i, h, 'Accorde le groupe nominal');
                }).join('') + `</div>`;
            }
            if (R.type === 'erreur') {
                return `<div class="ag-grid one">` + R.qs.map((q, i) => {
                    const words = frameTokens(q.frame, q.gn);
                    const a = R.ans[i];
                    const inner = sentenceHtml(words, (w, j) => {
                        const gk = w.gk;
                        let txt = gk === q.wk ? q.wrong : w.txt;
                        if (j === 0) txt = cap(txt);
                        let cls = 'ag-word';
                        const key = gk >= 0 ? gk : 'f' + j;
                        if (!R.corrected) { cls += ' click'; if (String(a) === String(key)) cls += ' sel'; }
                        else {
                            if (gk === q.wk) cls += String(a) === String(key) ? ' good' : ' miss';
                            else if (String(a) === String(key)) cls += ' bad';
                        }
                        const fix = R.corrected && gk === q.wk ? `<span class="fix">${esc(w.txt)}</span>` : '';
                        return `<span class="${cls}"${R.corrected ? '' : ` data-act="err" data-i="${i}" data-k="${key}"`}>${esc(txt)}${fix}</span>`;
                    });
                    let h = `<div class="ag-sent">${inner}</div>`;
                    if (R.corrected) {
                        const T = tokens(q.gn);
                        h += `<div class="ag-why">🕵️ Le nom chef <b>${esc(T.find(t => t.role === 'nom').form)}</b> est ${GN_LBL[q.gn.g + q.gn.n]} : il fallait écrire <b>${esc(T[q.wk].form)}</b> et non « ${esc(q.wrong)} ».</div>`;
                    }
                    return card(R, i, h, 'Touche le mot mal accordé');
                }).join('') + `</div>`;
            }
            // Genre et nombre
            const COL = { ms: '#1E6FD9', fs: '#D63384', mp: '#1E6FD9', fp: '#D63384' };
            return `<div class="ag-grid">` + R.qs.map((q, i) => {
                const a = R.ans[i], good = q.gn.g + q.gn.n;
                const btns = COMBOS.map(c => {
                    let cls = a === c ? 'on' : '';
                    if (R.corrected) cls = c === good ? 'good' : (a === c ? 'bad' : '');
                    return `<button class="ag-choice ${cls}" style="--c:${COL[c]}"${R.corrected ? '' : ` data-act="gnc" data-i="${i}" data-v="${c}"`}>${GN_LBL[c]}</button>`;
                }).join('');
                let h = `<div class="ag-sent">${esc(gnText(q.gn))}</div><div class="ag-choices">${btns}</div>`;
                if (R.corrected) {
                    const T = tokens(q.gn);
                    h += `<div class="ag-why">🏷️ <span class="ag-w" style="font-size:1.2em">${T.map(t => segHtml(t, q.gn.g, q.gn.n)).join(' ').replace(/' /g, '\'')}</span> : le nom <b>${esc(T.find(t => t.role === 'nom').form)}</b> est ${GN_LBL[good]}.</div>`;
                }
                return card(R, i, h, 'Quel est le genre et le nombre de ce groupe nominal ?');
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="ag-topbar"><span class="ag-pill">${EXT[R.type].label} · ${R.qs.length} questions</span>
                ${sc ? `<span class="ag-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="ag-actions">
                <button class="ag-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="ag-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="ag-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="ag-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="ag-info">Choisis l'exercice et le niveau, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.ag-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : S.tab === 'lab' ? renderLab() : renderLesson();
            body.scrollTop = top;
            flip = false;
            requestAnimationFrame(() => drawArrows(body));
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'ag-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run, ex = S.ex, L = S.lab;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🔗 La chaîne d\'accords', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); requestAnimationFrame(() => drawArrows(body)); return;
                case 'close':
                    if (canSpeak) window.speechSynthesis.cancel();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; if (S.tab === 'lab') flip = true; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'practice':
                    ex.type = el.dataset.v; S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                // Chaîne
                case 'lg': if (L.g === el.dataset.v) return; labSwitchGender(el.dataset.v); flip = true; sfx('chain'); break;
                case 'ln': if (L.n === el.dataset.v) return; L.n = el.dataset.v; S.labMsg = ''; flip = true; sfx('chain'); break;
                case 'lrandom': labRandom(); flip = true; sfx('pop'); break;
                case 'builder': S.builder = !S.builder; break;
                case 'lsay': speak(gnText(L)); return;
                case 'bdet': L.det = el.dataset.v; flip = true; break;
                case 'bnoun': {
                    const N = NOUN[+el.dataset.v];
                    L.noun = N.i; S.labMsg = '';
                    if (!N.two) L.g = N.g;
                    if (L.pre !== null && ADJ[L.pre].tags.indexOf(N.t) === -1) L.pre = null;
                    L.post = L.post.filter(i => ADJ[i].tags.indexOf(N.t) !== -1);
                    flip = true; sfx('pop');
                    break;
                }
                case 'badj': {
                    const A = ADJ[+el.dataset.v];
                    if (A.pos === 'pre') L.pre = L.pre === A.i ? null : A.i;
                    else if (L.post.indexOf(A.i) !== -1) L.post = L.post.filter(i => i !== A.i);
                    else { L.post.push(A.i); if (L.post.length > 2) L.post.shift(); }
                    flip = true; sfx('pop');
                    break;
                }
                // Exercices
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'level': ex.level = +el.dataset.v; break;
                case 'mode': ex.mode = el.dataset.v; break;
                case 'n': ex.n = +el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'clear':
                    if (!R) return;
                    R.ans = R.type === 'accorde' ? R.qs.map(q => tokens(q.gn).map(t => t.form)) : [];
                    R.corrected = false;
                    break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected;
                    if (R.corrected) {
                        const sc = scoreOf(R);
                        if (sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'tw': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, k = /^f/.test(el.dataset.k) ? el.dataset.k : +el.dataset.k;
                    const m = (R.ans[i] || []).slice();
                    const p = m.indexOf(k);
                    if (p !== -1) m.splice(p, 1); else m.push(k);
                    R.ans[i] = m; sfx('pop');
                    break;
                }
                case 'opt': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i;
                    R.ans[i] = (R.ans[i] || []).slice();
                    R.ans[i][+el.dataset.k] = el.dataset.v; sfx('pop');
                    break;
                }
                case 'err': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, k = /^f/.test(el.dataset.k) ? el.dataset.k : +el.dataset.k;
                    R.ans[i] = R.ans[i] === k ? undefined : k; sfx('pop');
                    break;
                }
                case 'gnc':
                    if (!R || R.corrected) return;
                    R.ans[+el.dataset.i] = el.dataset.v; sfx('pop');
                    break;
                default: return;
            }
            render(); save();
        }

        // ── Événements : souris, stylet et tactile ──
        // Le « pointerup » agit tout de suite ; le « click » qui le suit est ignoré.
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
            // Seule la barre de titre (hors boutons) sert à déplacer le widget
            if (e.target.closest('.ag-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.ag-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });
        document.addEventListener('pointerdown', function closeHelp(e) {
            if (!widget.isConnected) { document.removeEventListener('pointerdown', closeHelp, true); return; }
            if (help.classList.contains('show') && !help.contains(e.target) && !e.target.closest('[data-act="help"]')) help.classList.remove('show');
        }, true);

        // ── Redimensionnement (les flèches suivent) ──
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
        if (typeof ResizeObserver === 'function') {
            let raf = 0;
            new ResizeObserver(() => {
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    body.querySelectorAll('.ag-svg.anim').forEach(s => s.classList.remove('anim'));
                    drawArrows(body);
                });
            }).observe(body);
        }

        // ── Sauvegarde (taille hors plein écran mémorisée) ──
        const vh = () => typeof virtualH === 'function' ? virtualH(window.innerWidth) : window.innerHeight;
        let savedW = 0, savedH = 0;
        function memoSize() {
            if (container.classList.contains('wf-fullboard')) return;
            savedW = (container.offsetWidth / window.innerWidth) * 100;
            savedH = (container.offsetHeight / vh()) * 100;
        }
        new MutationObserver(memoSize).observe(container, { attributes: true, attributeFilter: ['style', 'class'] });
        widget._agGetData = function () {
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
            drawArrows(body);
            save();
        }));
        return widget;
    };

    // Accès au moteur (tests)
    window._agEngine = { ADJ, NOUN, DETS, tokens, gnText, genGN, ambiguity, compat, optionsFor, segs };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createAccordGNWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
