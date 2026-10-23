// =========================================================================
// ACTIVITÉ « LA NATURE DES MOTS » — Le Bureau du Prof
// Leçons + exercices corrigés (même présentation que « La conjugaison »).
//
// 📖 Leçons : vue d'ensemble (avec une phrase colorée à faire défiler),
//    puis une leçon par nature : déterminant, nom, adjectif qualificatif,
//    verbe, pronom, mots invariables.
// ✏️ Exercices :
//    🏷️ Trier les mots : glisser (ou toucher puis toucher une colonne)
//       chaque mot de la phrase dans la colonne de sa nature.
//    🎯 Trouver la nature : un mot souligné dans une phrase, choisir sa nature.
//    🔍 La chasse aux mots : toucher tous les mots d'une nature donnée.
//    Phrases proposées (déjà corrigées) ou phrase du prof (le prof indique
//    la nature de chaque mot en le touchant). Bouton Correction avec score.
//
// Ouverture : createWidget('nature-gramm')  ou  createNatureGrammWidget()
// Sauvegarde : w._ngGetData()  /  createNatureGrammWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'nature-gramm';

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

    // ── CSS (préfixe n2-) ─────────────────────────────────────────────────
    if (!document.getElementById('n2-style')) {
        const s = document.createElement('style');
        s.id = 'n2-style';
        s.textContent = `
.widget[data-type="nature-gramm"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.n2-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.n2-container input, .n2-container textarea { user-select:text; -webkit-user-select:text; }
.n2-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .n2-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .n2-tab-lbl { display:none; }
    .n2-title { font-size:17px !important; }
    .n2-lesson { flex-direction:column; }
    .n2-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .n2-gbtn { flex:1 1 auto; text-align:center !important; }
    .n2-srow > .l { min-width:0 !important; width:100%; }
    .n2-cols { grid-template-columns:repeat(2, minmax(0,1fr)) !important; }
}
.n2-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.n2-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.n2-tabs { display:flex; gap:6px; margin-left:12px; }
.n2-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.n2-tab:hover { background:rgba(255,255,255,.1); }
.n2-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.n2-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.n2-icon-btn:hover { background:rgba(255,255,255,.28); }
.n2-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* ── Leçons ── */
.n2-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.n2-side { width:190px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.n2-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.n2-gbtn:hover { transform:translateX(2px); }
.n2-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.n2-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.n2-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.n2-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.n2-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.n2-box ul { margin:4px 0 0; padding-left:20px; }
.n2-what { background:#f1edff; border:2px solid #c8bbf5; }
.n2-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.n2-memo { background:#fff6d6; border:2px solid #f3d36b; }
.n2-trap { background:#ffecee; border:2px solid #f6a7b0; }
.n2-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.n2-fam { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
.n2-famcard { background:#fff; border-radius:14px; border:3px solid var(--c); padding:8px 12px; }
.n2-famcard b { color:var(--c); }
.n2-famcard .w { font-family:'MDI',cursive; font-size:20px; line-height:1.4; }
.n2-legend { display:flex; flex-wrap:wrap; gap:8px; }
.n2-ltag { background:var(--c); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; }
.n2-sentence { font-family:'MDI',cursive; font-size:24px; line-height:1.9; }
.n2-sentence .hl { color:var(--c); font-weight:700; border-bottom:4px solid var(--c); }
.n2-demo { display:flex; flex-wrap:wrap; gap:6px 4px; align-items:flex-end; font-family:'MDI',cursive; font-size:28px; margin:8px 0; }
.n2-wl { display:inline-flex; flex-direction:column; align-items:center; border-bottom:5px solid var(--c); padding:0 3px; }
.n2-wl small { font-family:'Nunito',sans-serif; font-size:11px; font-weight:900; color:var(--c); text-transform:uppercase; }
.n2-wl.plain { border-bottom-color:#d9cdb6; }
.n2-wl.plain small { visibility:hidden; }
.n2-punct { font-family:'MDI',cursive; color:#9a8f7a; }
.n2-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.n2-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.n2-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.n2-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.n2-btn.alt.on { background:var(--encre); color:var(--or); border-color:var(--encre); }
.n2-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }

/* ── Exercices ── */
.n2-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.n2-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.n2-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.n2-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.n2-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.n2-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.n2-hint { font-size:12.5px; color:#6a6380; }
.n2-mine { width:100%; box-sizing:border-box; min-height:56px; resize:vertical; font:inherit; font-size:20px; font-family:'MDI',cursive; padding:8px 10px;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; }
.n2-mine:focus { border-color:var(--violet); }
.n2-tagger { display:flex; flex-wrap:wrap; gap:6px; align-items:flex-end; font-family:'MDI',cursive; font-size:22px; }
.n2-tagw { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:10px; padding:2px 8px; display:inline-flex; flex-direction:column; align-items:center;
    font:inherit; color:var(--encre); touch-action:manipulation; }
.n2-tagw small { font-family:'Nunito',sans-serif; font-size:10.5px; font-weight:900; color:var(--c,#b8ad96); text-transform:uppercase; }
.n2-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.n2-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.n2-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.n2-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.n2-pill.score { background:var(--vert); font-size:16px; }
.n2-pill.warn { background:#e67e22; }
.n2-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.n2-consigne { text-align:center; font-weight:800; color:#5a5470; }
/* Trier */
.n2-sent { display:flex; flex-wrap:wrap; gap:calc(var(--f) * .3); justify-content:center; align-items:center; padding:calc(var(--f) * .45);
    background:#fff; border:2px solid #e3d8c3; border-radius:16px; min-height:calc(var(--f) * 2.2); font-family:'MDI',cursive; font-size:var(--f); }
.n2-sent.drop { background:#f6f2ff; border-color:var(--violet); }
.n2-tok { font-family:'MDI',cursive; font-size:var(--f); font-weight:700; line-height:1.2; background:#fff; border:2px solid #d1c6ad; border-radius:10px;
    padding:.1em .45em; touch-action:none; box-shadow:0 3px 0 rgba(42,31,74,.12); white-space:nowrap; }
.n2-tok.sel { border-color:var(--violet); background:#f2eeff; box-shadow:0 0 0 4px #cfc3f7; }
.n2-tok.dragging { opacity:.3; }
.n2-tok.done { opacity:.25; box-shadow:none; border-style:dashed; }
.n2-tok.off { background:transparent; border-color:transparent; box-shadow:none; color:#9a8f7a; font-weight:400; }
.n2-tok.ok { border-color:var(--vert); background:#e2f7ec; color:#178a4b; }
.n2-tok.ko { border-color:var(--rouge); background:#ffe9eb; color:#c0293a; }
.n2-tok.nv { border-color:#b8ad96; background:#f4f1ea; }
.n2-tok .exp { display:block; font-family:'Nunito',sans-serif; font-size:11px; font-weight:900; color:var(--c); text-transform:uppercase; text-align:center; }
.n2-cols { display:grid; gap:calc(var(--f) * .35); }
.n2-col { border:3px solid var(--c); border-radius:14px; background:#fff; display:flex; flex-direction:column; min-height:calc(var(--f) * 5); overflow:hidden; }
.n2-col.drop { box-shadow:0 0 0 4px var(--c); }
.n2-col.target .n2-col-b { background:#f6fff9; }
.n2-col-h { background:var(--c); color:#fff; font-weight:900; font-size:calc(var(--f) * .5); text-align:center; padding:4px; }
.n2-col-b { flex:1; display:flex; flex-direction:column; align-items:center; gap:calc(var(--f) * .25); padding:calc(var(--f) * .3) 4px; }
.n2-ghost { position:fixed; z-index:99999; pointer-events:none; transform:translate(-50%,-50%) rotate(2deg); font-family:'MDI',cursive; font-weight:700;
    background:var(--violet); color:#fff; border-radius:10px; padding:.1em .45em; box-shadow:0 8px 20px rgba(60,40,140,.35); white-space:nowrap; }
/* Trouver / chasse */
.n2-grid { --gap:calc(var(--f) * .55); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 2 * var(--gap)) / 3), min(100%, 280px)),1fr)); }
.n2-grid.hunt { grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 320px)),1fr)); }
.n2-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .4) calc(var(--f) * .6) calc(var(--f) * .5); box-shadow:0 3px 0 rgba(42,31,74,.08); }
.n2-q.ok { border-color:var(--vert); background:#f3fcf7; }
.n2-q.ko { border-color:var(--rouge); background:#fff5f6; }
.n2-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px; font-size:14px; font-weight:800; color:#5a5470; }
.n2-num { font-weight:900; color:#9a8f7a; }
.n2-qsent { font-family:'MDI',cursive; font-size:calc(var(--f) * .85); line-height:1.6; text-align:center; margin-bottom:calc(var(--f) * .3); }
.n2-qsent .target { font-weight:700; color:var(--violet); border-bottom:4px solid var(--violet); padding:0 2px; }
.n2-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.n2-choice { border:2px solid var(--c); background:#fff; border-radius:999px; padding:3px 10px; font:inherit; font-weight:900; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.n2-choice.on { background:var(--c); color:#fff; }
.n2-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.n2-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.n2-hunt-sent { display:flex; flex-wrap:wrap; gap:calc(var(--f) * .2); justify-content:center; align-items:center; font-family:'MDI',cursive; font-size:var(--f); }
.n2-hw { border:2px solid transparent; border-radius:9px; padding:0 .2em; font:inherit; color:var(--encre); background:transparent; touch-action:manipulation; }
.n2-hw:hover { background:#f6f2ff; }
.n2-hw.on { background:var(--c); color:#fff; }
.n2-hw.good { background:var(--vert); color:#fff; }
.n2-hw.bad { background:var(--rouge); color:#fff; }
.n2-hw.miss { border-color:#e67e22; border-style:dashed; color:#c25a00; }
.n2-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:n2-fall 1.6s ease-in forwards; }
@keyframes n2-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.n2-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:400px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.n2-help.show { display:block; }
.n2-help h4 { margin:0 0 6px; font-size:15px; }
.n2-help p { margin:0 0 6px; }
.n2-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.n2-container:hover .n2-resize { opacity:1; }
.n2-container.wf-fullboard .n2-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="nature-gramm"], .n2-container, .n2-container * { cursor:default !important; }
.n2-container .n2-header { cursor:grab !important; }
.n2-container .n2-header:active { cursor:grabbing !important; }
/* Le doigt qui clique sur tout ce qui est cliquable */
.n2-container button, .n2-container select, .n2-container [data-act], .n2-container .n2-tok[data-w],
.n2-container .n2-header button { cursor:pointer !important; }
.n2-container .n2-col, .n2-container .n2-sent, .n2-container button:disabled { cursor:default !important; }
.n2-container input, .n2-container textarea { cursor:text !important; }
.n2-container .n2-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES
    // =====================================================================
    const ORDER = ['det', 'nom', 'adj', 'verbe', 'pron', 'inv'];
    const NAT = {
        det:   { label: 'Déterminant',    plural: 'déterminants',     tous: 'tous les déterminants',     short: 'dét.',   color: '#2F80ED', ico: '🔹' },
        nom:   { label: 'Nom',            plural: 'noms',             tous: 'tous les noms',             short: 'nom',    color: '#EB5757', ico: '🏷️' },
        adj:   { label: 'Adjectif',       plural: 'adjectifs',        tous: 'tous les adjectifs',        short: 'adj.',   color: '#F2994A', ico: '🎨' },
        verbe: { label: 'Verbe',          plural: 'verbes',           tous: 'tous les verbes',           short: 'verbe',  color: '#27AE60', ico: '⚡' },
        pron:  { label: 'Pronom',         plural: 'pronoms',          tous: 'tous les pronoms',          short: 'pron.',  color: '#9B51E0', ico: '👤' },
        inv:   { label: 'Mot invariable', plural: 'mots invariables', tous: 'tous les mots invariables', short: 'invar.', color: '#6B7A89', ico: '🔒' }
    };
    const K = { d: 'det', n: 'nom', a: 'adj', v: 'verbe', p: 'pron', i: 'inv' };

    // Phrases corrigées : mot/nature (d déterminant, n nom, a adjectif, v verbe, p pronom, i invariable)
    const BANK_RAW = [
        'Le/d petit/a chat/n dort/v sur/i le/d canapé/n rouge/a .',
        'Ma/d grande/a sœur/n lit/v un/d livre/n passionnant/a .',
        'Les/d enfants/n jouent/v dans/i la/d cour/n .',
        'Nous/p mangeons/v une/d tarte/n délicieuse/a .',
        'Elle/p chante/v très/i bien/i .',
        'Ce/d vieux/a château/n domine/v la/d vallée/n .',
        'Le/d chien/n aboie/v et/i le/d chat/n miaule/v .',
        'Tu/p regardes/v les/d étoiles/n brillantes/a .',
        'Mon/d frère/n range/v ses/d jouets/n .',
        'Ils/p partiront/v demain/i à/i Paris/n .',
        'Cette/d fleur/n jaune/a pousse/v vite/i .',
        'Je/p prends/v mon/d cartable/n bleu/a .',
        'La/d maîtresse/n explique/v une/d nouvelle/a leçon/n .',
        'Vous/p avez/v un/d joli/a jardin/n .',
        'Le/d boulanger/n prépare/v des/d croissants/n chauds/a .',
        'Un/d oiseau/n bleu/a chante/v sur/i la/d branche/n .',
        'Il/p neige/v souvent/i en/i montagne/n .',
        'Nos/d voisins/n ont/v une/d voiture/n rouge/a .',
        'Le/d soleil/n brille/v mais/i le/d vent/n souffle/v fort/i .',
        'Paul/n et/i Léa/n construisent/v une/d cabane/n .',
        'Cette/d petite/a souris/n grise/a court/v vite/i .',
        'Elles/p écoutent/v une/d belle/a histoire/n .',
        'Le/d facteur/n apporte/v une/d lettre/n importante/a .',
        'Je/p lis/v avec/i mon/d père/n .',
        'Mes/d parents/n achètent/v une/d grande/a maison/n .',
        'Le/d lion/n rugit/v très/i fort/i .',
        'On/p ira/v à/i la/d plage/n cet/d été/n .',
        'Leur/d chat/n noir/a dort/v toujours/i .',
        'La/d neige/n blanche/a recouvre/v les/d toits/n .',
        'Nous/p avons/v planté/v des/d tomates/n rouges/a .',
        'Le/d vent/n froid/a souffle/v sur/i la/d ville/n .',
        'Tu/p dessines/v un/d grand/a bateau/n .',
        'Mon/d ami/n arrive/v bientôt/i .',
        'Les/d élèves/n attentifs/a écoutent/v la/d directrice/n .',
        'Il/p porte/v un/d pull/n chaud/a et/i des/d bottes/n .',
        'Le/d gâteau/n est/v prêt/a : je/p le/p coupe/v .',
        'Le/d petit/a garçon/n mange/v une/d pomme/n verte/a .',
        'Ces/d montagnes/n sont/v très/i hautes/a .',
        'Ma/d tante/n habite/v près/i de/i la/d mer/n .',
        'Nous/p chantons/v ensemble/i .',
        "J'/p aime/v l'/d école/n .",
        'Le/d renard/n rusé/a guette/v les/d poules/n .',
        'Ton/d vélo/n neuf/a roule/v vite/i .',
        'Les/d feuilles/n tombent/v en/i automne/n .'
    ];
    function parseTagged(s) {
        return s.split(' ').map(tok => {
            const m = tok.match(/^(.+)\/([dnavpi])$/);
            return m ? { t: m[1], n: K[m[2]] } : { t: tok, n: null, punct: true };
        });
    }
    const BANK = BANK_RAW.map(parseTagged);

    // Découpe d'une phrase libre (phrase du prof) : espaces + apostrophes
    const APOS_KEEP = new Set(["aujourd'hui", "presqu'île", "quelqu'un", "quelqu'une", "prud'homme"]);
    const isPunct = t => /^[.,;:!?…«»"()\[\]{}\-–—/\\]+$/.test(t);
    function tokenize(phrase) {
        const out = [];
        String(phrase || '').trim().replace(/[’‘]/g, "'").replace(/([.,;:!?…])/g, ' $1 ').split(/\s+/).filter(Boolean).forEach(tok => {
            if (APOS_KEEP.has(tok.toLowerCase())) { out.push(tok); return; }
            tok.split(/(?<=[a-zA-ZÀ-ÿœŒ]')(?=[a-zA-ZÀ-ÿœŒ])/).forEach(p => { if (p) out.push(p); });
        });
        return out.map(t => ({ t, n: null, punct: isPunct(t) }));
    }

    // Leçons
    const LESSONS = {
        det: {
            what: `Le <b>déterminant</b> est un petit mot placé <b>devant le nom</b>. Il annonce le nom et indique son <b>genre</b> (masculin ou féminin) et son <b>nombre</b> (singulier ou pluriel).`,
            tests: [`Il est juste devant un nom (parfois avec un adjectif entre les deux : <i>le petit chat</i>).`,
                    `On peut le remplacer par un autre déterminant : <i>le chat → un chat → mon chat → ce chat</i>.`],
            fam: [['Les articles', 'le, la, l\', les, un, une, des'], ['Les possessifs', 'mon, ton, son, ma, ta, sa, mes, tes, ses, notre, votre, leur, nos, vos, leurs'], ['Les démonstratifs', 'ce, cet, cette, ces']],
            memo: `Le déterminant et le nom vont toujours ensemble : ils forment le <b>groupe nominal</b> (<i>une tarte, ces montagnes</i>).`,
            trap: `<b>le, la, les</b> devant un <b>verbe</b> ne sont pas des déterminants mais des <b>pronoms</b> : <i>le gâteau</i> (déterminant) / <i>je <b>le</b> coupe</i> (pronom).`
        },
        nom: {
            what: `Le <b>nom</b> désigne une <b>personne</b>, un <b>animal</b>, une <b>chose</b>, un <b>lieu</b> ou une <b>idée</b>.`,
            tests: [`On peut mettre un déterminant devant : <i>un chat, la mer, une idée</i>.`,
                    `C'est le mot principal du groupe nominal.`],
            fam: [['Les noms communs', 'un chat, une maison, la neige, la joie'], ['Les noms propres', 'avec une majuscule : Paris, Léa, la Loire, les Alpes']],
            memo: `Si je peux dire « <b>un</b> … » ou « <b>une</b> … » devant le mot, c'est sûrement un nom.`,
            trap: `Un nom n'est pas toujours une chose qu'on peut toucher : <i>la peur, l'amitié, un rêve, l'été</i> sont aussi des noms.`
        },
        adj: {
            what: `L'<b>adjectif qualificatif</b> donne une <b>précision sur le nom</b> : il dit <b>comment</b> il est (sa couleur, sa taille, sa forme, son caractère…).`,
            tests: [`On peut souvent l'enlever : la phrase reste correcte (<i>un chat <s>noir</s> dort</i>).`,
                    `On peut ajouter « très » devant : <i>très noir, très grand</i>.`,
                    `Il s'accorde avec le nom : <i>un chat noir, des chattes noires</i>.`],
            fam: [['Avant le nom', 'un petit chat, une belle histoire, un vieux château'], ['Après le nom', 'un chat noir, une tarte délicieuse'], ['Après le verbe être', 'Le ciel est bleu. Ces montagnes sont hautes.']],
            memo: `Pour trouver l'adjectif, je cherche le nom puis je me demande : « Comment est-il ? »`,
            trap: `L'adjectif peut être <b>loin du nom</b>, après le verbe être : <i>Le gâteau est <b>prêt</b>.</i>`
        },
        verbe: {
            what: `Le <b>verbe</b> indique une <b>action</b> (courir, manger) ou un <b>état</b> (être, sembler). C'est le mot le plus important de la phrase.`,
            tests: [`Il se <b>conjugue</b> : je change le temps de la phrase (<i>aujourd'hui je mange → hier je mangeais → demain je mangerai</i>).`,
                    `On peut l'encadrer par <b>ne … pas</b> : <i>il <b>ne</b> mange <b>pas</b></i>.`,
                    `Il change avec le sujet : <i>je chante, nous chantons</i>.`],
            fam: [['Verbes d\'action', 'courir, manger, chanter, construire'], ['Verbes d\'état', 'être, devenir, sembler, paraître, rester']],
            memo: `Pour trouver le verbe, je change le temps de la phrase : le mot qui change, c'est le verbe !`,
            trap: `Au passé composé, le verbe a <b>deux mots</b> : <i>nous <b>avons planté</b></i>. « avons » et « planté » font tous les deux partie du verbe.`
        },
        pron: {
            what: `Le <b>pronom</b> <b>remplace un nom</b> (ou un groupe nominal) pour ne pas le répéter.`,
            tests: [`On peut le remplacer par un groupe nominal : <i>Léa mange. <b>Elle</b> a faim.</i> (Elle = Léa).`,
                    `Il est souvent juste devant le verbe.`],
            fam: [['Les pronoms personnels sujets', 'je, j\', tu, il, elle, on, nous, vous, ils, elles'], ['Devant le verbe (compléments)', 'me, te, le, la, l\', les, lui, leur, nous, vous']],
            memo: `« Pronom » = « <b>pour un nom</b> » : il prend la place d'un nom.`,
            trap: `<b>le, la, les, leur</b> devant un verbe sont des pronoms : <i>je <b>les</b> regarde</i>. Devant un nom, ce sont des déterminants : <i><b>les</b> étoiles</i>.`
        },
        inv: {
            what: `Les <b>mots invariables</b> ne changent <b>jamais</b> : ils n'ont ni féminin, ni pluriel, et ils ne se conjuguent pas.`,
            tests: [`On ne peut pas les mettre au pluriel ou au féminin.`,
                    `Ce ne sont ni des noms, ni des verbes, ni des déterminants, ni des adjectifs, ni des pronoms.`],
            fam: [['Les prépositions', 'à, de, dans, sur, sous, avec, pour, chez, en, par, vers, près de'], ['Les adverbes', 'très, bien, vite, souvent, toujours, demain, bientôt, ne… pas'], ['Les conjonctions de coordination', 'mais, ou, et, donc, or, ni, car']],
            memo: `Les conjonctions de coordination : « <b>Mais où est donc Ornicar ?</b> » (mais, ou, et, donc, or, ni, car).`,
            trap: `Ne confonds pas <b>et</b> (mot invariable) et <b>est</b> (verbe être) : si je peux dire « était », c'est le verbe.`
        }
    };

    // ── Utilitaires ───────────────────────────────────────────────────────
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    // Assemble une phrase : fn(tok, i) renvoie le HTML d'un mot, espaces gérés (apostrophes, ponctuation)
    function joinSent(toks, fn) {
        return toks.map((tk, i) => {
            const prev = toks[i - 1];
            const sp = i === 0 || (prev && /'$/.test(prev.t)) || /^[.,]$/.test(tk.t) ? '' : ' ';
            return sp + fn(tk, i);
        }).join('');
    }
    function plainSent(toks) { return joinSent(toks, tk => esc(tk.t)); }

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
        pop:  () => tone(880, 0, 0.06, 'sine', 0.05),
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'vue', demo: 0, demoHide: false,
            ex: { type: 'trier', nats: ORDER.slice(), mode: 'auto', mine: 'Le petit chat dort sur le canapé rouge.', mineTags: ['det', 'adj', 'nom', 'verbe', 'inv', 'det', 'nom', 'adj'],
                  nq: 9, nh: 4, target: 'random' },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createNatureGrammWidget = function (saved) {
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
        container.className = 'n2-container';
        container.innerHTML = `
            <div class="n2-header">
                <span class="n2-title">🏷️ La nature des mots</span>
                <div class="n2-tabs">
                    <button class="n2-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="n2-tab-lbl">Leçons</span></button>
                    <button class="n2-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="n2-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="n2-icon-btn" data-act="sound" title="Son"></button>
                    <button class="n2-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="n2-body"></div>
            <div class="n2-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — « Les 6 natures » présente toutes les natures, avec une phrase colorée que l'on peut faire défiler (◀ ▶) et dont on peut cacher les couleurs pour faire chercher la classe. Puis une leçon par nature : ce que c'est, comment le reconnaître, des exemples, une astuce et un piège.</p>
                <p><b>✏️ Exercices</b> — Trois types :</p>
                <p>🏷️ <b>Trier les mots</b> : glisse chaque mot de la phrase dans la colonne de sa nature. Au stylet ou au doigt, on peut aussi <b>toucher un mot puis toucher une colonne</b>. Pour enlever un mot d'une colonne, on le remet dans la phrase.</p>
                <p>🎯 <b>Trouver la nature</b> : un mot est souligné, on choisit sa nature.</p>
                <p>🔍 <b>La chasse aux mots</b> : on touche tous les mots d'une nature (ex. : tous les verbes).</p>
                <p><b>Natures travaillées</b> : ne garde que celles déjà étudiées. Les autres mots sont grisés ou ne sont pas demandés.</p>
                <p><b>✍️ Ma phrase</b> : écris ta phrase, puis touche chaque mot pour indiquer sa nature (chaque toucher passe à la nature suivante). Un mot sans nature n'est pas corrigé.</p>
            </div>
            <div class="n2-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.n2-body');
        const help = container.querySelector('.n2-help');
        const resizeHandle = container.querySelector('.n2-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let msg = '', sel = null;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };
        const active = () => ORDER.filter(k => S.ex.nats.includes(k));

        // Phrase du prof, avec la nature indiquée pour chaque mot
        function mineSentence() {
            const toks = tokenize(S.ex.mine);
            let w = 0;
            toks.forEach(tk => { if (!tk.punct) { tk.n = S.ex.mineTags[w] || null; w++; } });
            return toks;
        }
        function sentences() {
            return S.ex.mode === 'mine' ? [mineSentence()] : BANK;
        }

        // ── Génération d'un exercice ──
        function genRun() {
            const ex = S.ex, nats = active();
            const sents = sentences();
            if (ex.mode === 'mine' && !sents[0].some(t => !t.punct)) return 'Écris d\'abord ta phrase.';
            if (ex.type === 'trier') {
                if (nats.length < 2) return 'Choisis au moins 2 natures.';
                let cand = sents.filter(s => s.filter(t => nats.includes(t.n)).length >= 3);
                if (ex.mode === 'mine') cand = sents;
                if (!cand.length) return 'Aucune phrase ne contient assez de mots de ces natures.';
                const toks = JSON.parse(JSON.stringify(pick(cand)));
                S.run = { type: 'trier', toks, place: {}, corrected: false };
            } else if (ex.type === 'quiz') {
                if (nats.length < 2) return 'Choisis au moins 2 natures.';
                const items = {};
                nats.forEach(k => items[k] = []);
                sents.forEach((s, si) => s.forEach((t, wi) => { if (nats.includes(t.n)) items[t.n].push([si, wi]); }));
                const avail = nats.filter(k => items[k].length);
                if (!avail.length) return ex.mode === 'mine' ? 'Indique la nature des mots de ta phrase (touche chaque mot).' : 'Aucun mot trouvé.';
                const plan = [];
                while (plan.length < ex.nq) plan.push(...shuffle(avail));
                const used = new Set(), qs = [];
                plan.slice(0, ex.nq).forEach(k => {
                    const pool = shuffle(items[k]);
                    const it = pool.find(([si, wi]) => !used.has(si + ':' + wi)) || pool[0];
                    used.add(it[0] + ':' + it[1]);
                    qs.push({ toks: JSON.parse(JSON.stringify(sents[it[0]])), w: it[1], ans: k });
                });
                S.run = { type: 'quiz', qs: ex.mode === 'mine' ? qs : shuffle(qs), ans: [], corrected: false };
            } else {
                if (!nats.length) return 'Choisis au moins une nature.';
                const n = ex.mode === 'mine' ? 1 : ex.nh;
                const cards = [], usedS = new Set();
                for (let c = 0; c < n; c++) {
                    const tgts = ex.target !== 'random' && nats.includes(ex.target) ? [ex.target] : shuffle(nats);
                    let made = false;
                    for (const tg of tgts) {
                        const cand = sents.map((s, si) => si).filter(si => !usedS.has(si) && sents[si].some(t => t.n === tg));
                        if (!cand.length) continue;
                        const si = pick(cand); usedS.add(si);
                        cards.push({ toks: JSON.parse(JSON.stringify(sents[si])), target: tg, picked: [] });
                        made = true; break;
                    }
                    if (!made) break;
                }
                if (!cards.length) return ex.mode === 'mine' ? 'Indique la nature des mots de ta phrase (touche chaque mot).' : 'Aucune phrase trouvée.';
                S.run = { type: 'chasse', cards, corrected: false };
            }
            sel = null;
            return '';
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function examplesFor(k) {
            return BANK.filter(s => s.some(t => t.n === k))
                .sort((a, b) => b.filter(t => t.n === k).length - a.filter(t => t.n === k).length).slice(0, 3);
        }
        function demoHtml() {
            const s = BANK[((S.demo % BANK.length) + BANK.length) % BANK.length];
            return `<div class="n2-demo">` + s.map(tk => tk.punct ? `<span class="n2-punct">${esc(tk.t)}</span>`
                : `<span class="n2-wl ${S.demoHide ? 'plain' : ''}" style="--c:${S.demoHide ? '#d9cdb6' : NAT[tk.n].color}"><span>${esc(tk.t)}</span><small>${NAT[tk.n].short}</small></span>`).join('') + `</div>`;
        }
        function renderOverview() {
            return `<div class="n2-ltitle"><h2 style="color:#6C4FD8">🧩 Les 6 natures</h2></div>
                <div class="n2-box n2-what"><b class="t">🔤 C'est quoi, la nature d'un mot ?</b>Chaque mot appartient à une <b>famille</b> : c'est sa <b>nature</b> (on dit aussi sa « classe grammaticale »). Le dictionnaire l'indique : <i>chat, n. m.</i> (nom masculin). La nature d'un mot ne change pas.</div>
                <div class="n2-legend">${ORDER.map(k => `<button class="n2-ltag" style="--c:${NAT[k].color};border:none" data-act="lesson" data-g="${k}">${NAT[k].ico} ${NAT[k].label}</button>`).join('')}</div>
                <div class="n2-box n2-tool"><b class="t">🎨 Une phrase en couleurs</b>Chaque couleur est une nature. Cache les couleurs pour faire chercher la classe, puis montre-les.
                    ${demoHtml()}
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="n2-btn alt small" data-act="demo" data-d="-1">◀ Phrase précédente</button>
                        <button class="n2-btn alt small" data-act="demo" data-d="1">Phrase suivante ▶</button>
                        <button class="n2-btn alt small" data-act="demo" data-d="r">🎲 Au hasard</button>
                        <button class="n2-btn small ${S.demoHide ? 'go' : 'alt'}" data-act="demohide">${S.demoHide ? '👁 Montrer les natures' : '🙈 Cacher les natures'}</button>
                    </div></div>
                <div class="n2-box n2-memo"><b class="t">🧠 Nature ou fonction ?</b>La <b>nature</b> dit <b>ce qu'est</b> le mot (un nom, un verbe…) : elle ne change pas. La <b>fonction</b> dit le <b>rôle</b> du mot dans la phrase (sujet, complément…) : elle change selon la phrase.</div>
                <div class="n2-box n2-trap"><b class="t">⚠️ Attention au piège</b>Un même petit mot peut avoir deux natures : <i><b>le</b> gâteau</i> (déterminant, devant un nom) / <i>je <b>le</b> coupe</i> (pronom, devant un verbe). Il faut toujours regarder le mot qui suit.</div>
                <div><button class="n2-btn go" data-act="practice" data-v="trier">✏️ S'entraîner : trier les mots</button></div>`;
        }
        function renderNatureLesson(k) {
            const L = LESSONS[k], N = NAT[k];
            const ex = examplesFor(k).map(s => `<div class="n2-sentence">${joinSent(s, tk => tk.n === k ? `<span class="hl" style="--c:${N.color}">${esc(tk.t)}</span>` : esc(tk.t))}</div>`).join('');
            return `<div class="n2-ltitle"><h2 style="color:${N.color}">${N.ico} ${k === 'adj' ? 'L\'adjectif qualificatif' : k === 'inv' ? 'Les mots invariables' : (k === 'verbe' ? 'Le verbe' : k === 'nom' ? 'Le nom' : k === 'det' ? 'Le déterminant' : 'Le pronom')}</h2></div>
                <div class="n2-box n2-what"><b class="t">🔤 C'est quoi ?</b>${L.what}</div>
                <div class="n2-box n2-test"><b class="t">🔎 Comment le reconnaître ?</b><ul>${L.tests.map(t => `<li>${t}</li>`).join('')}</ul></div>
                <div class="n2-fam">${L.fam.map(([t, w]) => `<div class="n2-famcard" style="--c:${N.color}"><b>${t}</b><div class="w">${esc(w)}</div></div>`).join('')}</div>
                <div class="n2-box n2-tool"><b class="t">📝 Dans des phrases</b>${ex}</div>
                <div class="n2-box n2-memo"><b class="t">🧠 Pour retenir</b>${L.memo}</div>
                <div class="n2-box n2-trap"><b class="t">⚠️ Attention au piège</b>${L.trap}</div>
                <div><button class="n2-btn go" data-act="practice" data-v="${k}">✏️ S'entraîner : la chasse aux ${N.plural}</button></div>`;
        }
        function renderLesson() {
            const side = `<button class="n2-gbtn ${S.lesson === 'vue' ? 'active' : ''}" style="--c:#6C4FD8" data-act="lesson" data-g="vue">🧩 Les 6 natures</button>` +
                ORDER.map(k => `<button class="n2-gbtn ${S.lesson === k ? 'active' : ''}" style="--c:${NAT[k].color}" data-act="lesson" data-g="${k}">${NAT[k].ico} ${k === 'adj' ? 'Adjectif' : k === 'inv' ? 'Invariables' : NAT[k].label}</button>`).join('');
            const main = LESSONS[S.lesson] ? renderNatureLesson(S.lesson) : renderOverview();
            return `<div class="n2-lesson"><div class="n2-side">${side}</div><div class="n2-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function taggerHtml() {
            const toks = mineSentence();
            let w = -1;
            return toks.map(tk => {
                if (tk.punct) return `<span class="n2-punct">${esc(tk.t)}</span>`;
                w++;
                const c = tk.n ? NAT[tk.n].color : '';
                return `<button class="n2-tagw" data-act="tag" data-i="${w}"${c ? ` style="--c:${c}"` : ''}><span>${esc(tk.t)}</span><small>${tk.n ? NAT[tk.n].short : '?'}</small></button>`;
            }).join('');
        }
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="n2-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="n2-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="n2-settings">`;
            h += `<div class="n2-srow"><span class="l">1. Exercice</span>${ch('type', 'trier', ex.type === 'trier', '🏷️ Trier les mots')}${ch('type', 'quiz', ex.type === 'quiz', '🎯 Trouver la nature')}${ch('type', 'chasse', ex.type === 'chasse', '🔍 La chasse aux mots')}</div>`;
            h += `<div class="n2-srow"><span class="l">2. Natures travaillées</span>${ORDER.map(k => ch('nat', k, ex.nats.includes(k), NAT[k].ico + ' ' + NAT[k].label, NAT[k].color)).join('')}</div>`;
            h += `<div class="n2-srow"><span class="l">3. Phrases</span>${ch('mode', 'auto', ex.mode === 'auto', '🎲 Proposées (déjà corrigées)')}${ch('mode', 'mine', ex.mode === 'mine', '✍️ Ma phrase')}</div>`;
            if (ex.mode === 'mine') {
                h += `<div class="n2-srow" style="flex-direction:column;align-items:stretch">
                    <textarea class="n2-mine" placeholder="Écris ta phrase ici…" spellcheck="false">${esc(ex.mine)}</textarea>
                    <div class="n2-hint">Touche chaque mot pour indiquer sa nature (chaque toucher passe à la nature suivante). Un mot laissé sur « ? » n'est pas corrigé.</div>
                    <div class="n2-tagger">${taggerHtml()}</div></div>`;
            }
            if (ex.type === 'quiz' && ex.mode === 'auto') h += `<div class="n2-srow"><span class="l">Nombre de questions</span>${[6, 9, 12, 15].map(n => ch('nq', n, ex.nq === n, String(n))).join('')}</div>`;
            if (ex.type === 'chasse') {
                if (ex.mode === 'auto') h += `<div class="n2-srow"><span class="l">Nombre de phrases</span>${[2, 4, 6].map(n => ch('nh', n, ex.nh === n, String(n))).join('')}</div>`;
                h += `<div class="n2-srow"><span class="l">Nature à chercher</span>${ch('target', 'random', ex.target === 'random', '🎲 Au hasard')}${active().map(k => ch('target', k, ex.target === k, NAT[k].label, NAT[k].color)).join('')}</div>`;
            }
            h += `<div class="n2-srow"><span class="l">Taille du texte</span><button class="n2-btn alt small" data-act="font" data-d="-2">A−</button><button class="n2-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="n2-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="n2-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="n2-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        // Indices des mots à classer (exercice « Trier »)
        function trierWords(R) {
            const nats = active();
            const out = [];
            R.toks.forEach((tk, i) => { if (!tk.punct && (!tk.n || nats.includes(tk.n))) out.push(i); });
            return out;
        }
        function scoreOf(R) {
            if (R.type === 'trier') {
                const ws = trierWords(R).filter(i => R.toks[i].n);
                return { ok: ws.filter(i => R.place[i] === R.toks[i].n).length, n: ws.length };
            }
            if (R.type === 'quiz') return { ok: R.qs.filter((q, i) => R.ans[i] === q.ans).length, n: R.qs.length };
            let ok = 0, n = 0;
            R.cards.forEach(c => c.toks.forEach((tk, i) => {
                if (tk.punct || !tk.n) return;
                const want = tk.n === c.target, got = c.picked.includes(i);
                if (want) n++;
                if (want && got) ok++;
                if (!want && got) ok--;                       // un mot touché à tort enlève un point
            }));
            return { ok: Math.max(0, ok), n };
        }
        function renderTrier(R) {
            const nats = active(), ws = trierWords(R);
            const tokHtml = i => {
                const tk = R.toks[i];
                let cls = '', exp = '';
                if (R.corrected) {
                    if (!tk.n) cls = 'nv';
                    else if (R.place[i] === tk.n) cls = 'ok';
                    else { cls = 'ko'; exp = `<span class="exp" style="--c:${NAT[tk.n].color}">${NAT[tk.n].short}</span>`; }
                }
                return `<div class="n2-tok ${sel === i ? 'sel' : ''} ${cls}" data-w="${i}">${esc(tk.t)}${exp}</div>`;
            };
            let h = `<div class="n2-consigne">${R.corrected ? '' : 'Glisse chaque mot dans la colonne de sa nature (ou touche un mot, puis une colonne).'}</div>`;
            h += `<div class="n2-sent" data-act="sent">` + joinSent(R.toks, (tk, i) => {
                if (tk.punct) return `<span class="n2-punct">${esc(tk.t)}</span>`;
                if (!ws.includes(i)) return `<span class="n2-tok off" title="Nature non travaillée">${esc(tk.t)}</span>`;
                if (R.place[i]) return `<span class="n2-tok done">${esc(tk.t)}</span>`;
                return tokHtml(i);
            }) + `</div>`;
            h += `<div class="n2-cols" style="grid-template-columns:repeat(${nats.length}, minmax(0,1fr))">` + nats.map(k =>
                `<div class="n2-col ${sel !== null && !R.corrected ? 'target' : ''}" style="--c:${NAT[k].color}" data-act="col" data-k="${k}">
                    <div class="n2-col-h">${NAT[k].ico} ${k === 'inv' ? 'Invariables' : NAT[k].label}</div>
                    <div class="n2-col-b">${ws.filter(i => R.place[i] === k).map(tokHtml).join('')}</div></div>`).join('') + `</div>`;
            return h;
        }
        function renderQuiz(R) {
            const nats = active();
            return `<div class="n2-grid">` + R.qs.map((q, i) => {
                const a = R.ans[i];
                let cls = '', mark = '';
                if (R.corrected) { cls = a === q.ans ? 'ok' : 'ko'; mark = a === q.ans ? '✅' : '❌'; }
                const btns = nats.map(k => {
                    let c = a === k ? 'on' : '';
                    if (R.corrected) c = k === q.ans ? 'good' : (a === k ? 'bad' : '');
                    return `<button class="n2-choice ${c}" style="--c:${NAT[k].color}" data-act="quiz" data-i="${i}" data-v="${k}">${k === 'inv' ? 'Invariable' : NAT[k].label}</button>`;
                }).join('');
                return `<div class="n2-q ${cls}"><div class="n2-qtop"><span class="n2-num">${i + 1})</span>Quelle est la nature du mot souligné ?<span style="margin-left:auto">${mark}</span></div>
                    <div class="n2-qsent">${joinSent(q.toks, (tk, wi) => wi === q.w ? `<span class="target">${esc(tk.t)}</span>` : esc(tk.t))}</div>
                    <div class="n2-choices">${btns}</div></div>`;
            }).join('') + `</div>`;
        }
        function renderChasse(R) {
            return `<div class="n2-grid hunt">` + R.cards.map((c, ci) => {
                const N = NAT[c.target];
                let cardCls = '', mark = '';
                if (R.corrected) {
                    const good = c.toks.every((tk, i) => tk.punct || !tk.n || ((tk.n === c.target) === c.picked.includes(i)));
                    cardCls = good ? 'ok' : 'ko'; mark = good ? '✅' : '❌';
                }
                const words = joinSent(c.toks, (tk, i) => {
                    if (tk.punct) return `<span class="n2-punct">${esc(tk.t)}</span>`;
                    const got = c.picked.includes(i);
                    let cls = got ? 'on' : '';
                    if (R.corrected && tk.n) {
                        const want = tk.n === c.target;
                        cls = want && got ? 'good' : (!want && got ? 'bad' : (want ? 'miss' : ''));
                    }
                    return `<button class="n2-hw ${cls}" style="--c:${N.color}" data-act="hunt" data-c="${ci}" data-w="${i}">${esc(tk.t)}</button>`;
                });
                return `<div class="n2-q ${cardCls}"><div class="n2-qtop"><span class="n2-num">${ci + 1})</span>Touche ${N.tous.replace(N.plural, `<b style="color:${N.color}">${N.plural}</b>`)}<span style="margin-left:auto">${mark}</span></div>
                    <div class="n2-hunt-sent">${words}</div></div>`;
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            const title = R.type === 'trier' ? '🏷️ Trier les mots de la phrase' : R.type === 'quiz' ? `🎯 ${R.qs.length} mots à reconnaître` : `🔍 La chasse aux mots · ${R.cards.length} phrase${R.cards.length > 1 ? 's' : ''}`;
            const missing = R.type === 'trier' && R.corrected && trierWords(R).some(i => !R.place[i]);
            let h = `<div class="n2-topbar"><span class="n2-pill">${title}</span>
                ${sc ? `<span class="n2-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}
                ${missing ? '<span class="n2-pill warn">⚠️ Des mots ne sont pas classés</span>' : ''}</div>
            <div class="n2-actions">
                <button class="n2-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="n2-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="n2-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += R.type === 'trier' ? renderTrier(R) : R.type === 'quiz' ? renderQuiz(R) : renderChasse(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="n2-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!S.settingsOpen || !msg) h += `<div class="n2-info">Choisis l'exercice et ses réglages, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.n2-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
                c.className = 'n2-confetti';
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
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🏷️ La nature des mots', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.tab = 'lecon'; S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'demo': S.demo = el.dataset.d === 'r' ? Math.floor(Math.random() * BANK.length) : (S.demo + (+el.dataset.d) + BANK.length) % BANK.length; break;
                case 'demohide': S.demoHide = !S.demoHide; break;
                case 'practice': {
                    const v = el.dataset.v;
                    if (v === 'trier') ex.type = 'trier';
                    else { ex.type = 'chasse'; ex.target = v; if (!ex.nats.includes(v)) ex.nats.push(v); ex.mode = 'auto'; }
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                }
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'nat':
                    toggleIn(ex.nats, el.dataset.v); msg = '';
                    if (ex.target !== 'random' && !ex.nats.includes(ex.target)) ex.target = 'random';
                    break;
                case 'mode': ex.mode = el.dataset.v; msg = ''; break;
                case 'tag': {
                    const i = +el.dataset.i, cyc = [null].concat(ORDER);
                    ex.mineTags[i] = cyc[(cyc.indexOf(ex.mineTags[i] || null) + 1) % cyc.length];
                    sfx('pop');
                    break;
                }
                case 'nq': ex.nq = +el.dataset.v; break;
                case 'nh': ex.nh = +el.dataset.v; break;
                case 'target': ex.target = el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'clear':
                    if (!R) return;
                    if (R.type === 'trier') R.place = {};
                    else if (R.type === 'quiz') R.ans = [];
                    else R.cards.forEach(c => { c.picked = []; });
                    R.corrected = false; sel = null;
                    break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected; sel = null;
                    if (R.corrected) {
                        const sc = scoreOf(R);
                        if (sc.n && sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'col':
                    if (!R || R.corrected || sel === null) return;
                    R.place[sel] = el.dataset.k; sel = null; sfx('pop');
                    break;
                case 'sent':
                    if (!R || R.corrected || sel === null) return;
                    delete R.place[sel]; sel = null;
                    break;
                case 'quiz':
                    if (!R || R.corrected) return;
                    R.ans[+el.dataset.i] = el.dataset.v; sfx('pop');
                    break;
                case 'hunt': {
                    if (!R || R.corrected) return;
                    const c = R.cards[+el.dataset.c], w = +el.dataset.w, i = c.picked.indexOf(w);
                    if (i === -1) c.picked.push(w); else c.picked.splice(i, 1);
                    sfx('pop');
                    break;
                }
                default: return;
            }
            render(); save();
        }

        // ── Glisser-déposer des mots (exercice « Trier ») ──
        let drag = null, lastTap = 0;
        function dropTargetAt(x, y) {
            const el = document.elementFromPoint(x, y);
            if (!el || !container.contains(el)) return null;
            return el.closest('.n2-col') || el.closest('.n2-sent');
        }
        function dMove(e) {
            if (!drag || e.pointerId !== drag.id) return;
            if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
                drag.moved = true;
                drag.el.classList.add('dragging');
                drag.ghost = document.createElement('div');
                drag.ghost.className = 'n2-ghost';
                drag.ghost.textContent = S.run.toks[drag.w].t;
                drag.ghost.style.fontSize = getComputedStyle(drag.el).fontSize;
                document.body.appendChild(drag.ghost);
            }
            if (!drag.moved) return;
            e.preventDefault();
            drag.ghost.style.left = e.clientX + 'px';
            drag.ghost.style.top = e.clientY + 'px';
            body.querySelectorAll('.n2-col.drop, .n2-sent.drop').forEach(x => x.classList.remove('drop'));
            const t = dropTargetAt(e.clientX, e.clientY);
            if (t) t.classList.add('drop');
        }
        function dUp(e) {
            if (!drag || e.pointerId !== drag.id) return;
            window.removeEventListener('pointermove', dMove);
            window.removeEventListener('pointerup', dUp);
            window.removeEventListener('pointercancel', dUp);
            const d = drag;
            drag = null;
            lastTap = Date.now();
            if (d.ghost) d.ghost.remove();
            if (e.type === 'pointercancel') { render(); return; }
            if (!d.moved) {
                sel = sel === d.w ? null : d.w;
            } else {
                const t = dropTargetAt(e.clientX, e.clientY);
                if (t && t.classList.contains('n2-col')) { S.run.place[d.w] = t.dataset.k; sfx('pop'); }
                else if (t) delete S.run.place[d.w];
                sel = null;
            }
            render(); save();
        }
        body.addEventListener('pointerdown', e => {
            const tok = e.target.closest('.n2-tok[data-w]');
            if (!tok || !S.run || S.run.type !== 'trier' || S.run.corrected || drag) return;
            if (e.button !== undefined && e.button > 0) return;
            e.preventDefault(); e.stopPropagation();
            if (typeof bringToFront === 'function') bringToFront(widget);
            help.classList.remove('show');
            drag = { id: e.pointerId, w: +tok.dataset.w, el: tok, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
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
            if (e.target.closest('.n2-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.n2-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Saisie de la phrase du prof : on garde les natures des mots inchangés
        container.addEventListener('input', e => {
            const t = e.target;
            if (!t.classList.contains('n2-mine')) return;
            const oldW = tokenize(S.ex.mine).filter(x => !x.punct).map(x => x.t);
            const newW = tokenize(t.value).filter(x => !x.punct).map(x => x.t);
            S.ex.mineTags = newW.map((w, i) => {
                if (oldW[i] === w) return S.ex.mineTags[i] || null;
                const j = oldW.indexOf(w);
                return j >= 0 ? (S.ex.mineTags[j] || null) : null;
            });
            S.ex.mine = t.value;
            const tg = body.querySelector('.n2-tagger'); if (tg) tg.innerHTML = taggerHtml();
            saveSoon();
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
        widget._ngGetData = function () {
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

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createNatureGrammWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
