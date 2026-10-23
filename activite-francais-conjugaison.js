// =========================================================================
// ACTIVITÉ « LA CONJUGAISON » — Le Bureau du Prof
// (remplace l'ancien test « Conjugaison Flash » : même type 'conjugaison')
// Leçons + exercices corrigés sur 5 temps :
//   présent · imparfait · futur simple · passé simple · passé composé
//
// 📖 Leçons : les groupes de verbes (avec un conjugueur), puis une leçon par
//    temps (quand l'utiliser, comment le former, tableaux de conjugaison
//    par groupe avec les terminaisons en couleur, astuce, piège).
// ✏️ Exercices : on choisit le(s) temps, puis soit des groupes de verbes
//    (verbes proposés au hasard), soit ses propres verbes. Deux types :
//    questions mélangées ou « conjuguer tout le verbe ». Bouton Correction.
//
// Ouverture : createWidget('conjugaison')  ou  createConjugaisonWidget()
// Sauvegarde : w._c2GetData()  /  createConjugaisonWidget(données)
// Les tableaux sauvegardés avec l'ancien type 'conjugaison2' s'ouvrent aussi.
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'conjugaison';

    function _isPhone() {
        if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }

    // ── Barre réduite (bouton jaune), si aucun autre fichier ne l'a définie ──
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

    // ── CSS (préfixe c2-) ─────────────────────────────────────────────────
    if (!document.getElementById('c2-style')) {
        const s = document.createElement('style');
        s.id = 'c2-style';
        s.textContent = `
.widget[data-type="conjugaison"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.c2-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.c2-container input, .c2-container textarea { user-select:text; -webkit-user-select:text; }
.c2-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .c2-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .c2-tab-lbl { display:none; }
    .c2-title { font-size:17px !important; }
    .c2-lesson { flex-direction:column; }
    .c2-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .c2-gbtn { flex:1 1 auto; text-align:center !important; }
    .c2-srow > .l { min-width:0 !important; width:100%; }
    .c2-mine-row { flex-direction:column; }
}
.c2-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); cursor:move; flex-shrink:0; flex-wrap:wrap; }
.c2-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.c2-tabs { display:flex; gap:6px; margin-left:12px; }
.c2-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; cursor:pointer; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.c2-tab:hover { background:rgba(255,255,255,.1); }
.c2-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.c2-icon-btn { width:26px; height:26px; border-radius:50%; border:none; cursor:pointer; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.c2-icon-btn:hover { background:rgba(255,255,255,.28); }
.c2-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* ── Leçons ── */
.c2-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.c2-side { width:180px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.c2-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); cursor:pointer; text-align:left; touch-action:manipulation; transition:transform .1s; }
.c2-gbtn:hover { transform:translateX(2px); }
.c2-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.c2-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.c2-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.c2-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.c2-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.c2-box ul { margin:4px 0 0; padding-left:20px; font-family:'Andika','Nunito',sans-serif; }
.c2-when { background:#e8f4ff; border:2px solid #a9d1f5; }
.c2-how  { background:#f1edff; border:2px solid #c8bbf5; }
.c2-memo { background:#fff6d6; border:2px solid #f3d36b; }
.c2-trap { background:#ffecee; border:2px solid #f6a7b0; }
.c2-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.c2-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px; }
.c2-card { background:#fff; border-radius:16px; border:3px solid var(--c); padding:8px 12px 10px; display:flex; flex-direction:column; gap:6px; box-shadow:0 4px 0 rgba(0,0,0,.06); }
.c2-card-h { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:20px; font-family:'Andika','Nunito',sans-serif; }
.c2-gtag { background:var(--c); color:#fff; border-radius:999px; padding:2px 10px; font-size:12px; font-weight:900; font-family:'Nunito',sans-serif; }
.c2-rule { font-size:13.5px; line-height:1.4; background:#f7f4ee; border-radius:9px; padding:5px 8px; color:#4a4360; }
.c2-gtext { font-size:14px; line-height:1.45; }
.c2-tbl { width:100%; border-collapse:collapse; font-family:'Andika','Nunito',sans-serif; font-size:17px; }
.c2-tbl td { padding:2px 4px; border-bottom:1px dashed #eee6d6; }
.c2-tbl tr:last-child td { border-bottom:none; }
.c2-tp { color:#8a8199; }
.c2-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px; cursor:pointer;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.c2-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.c2-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.c2-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.c2-btn.alt.on { background:var(--encre); color:var(--or); border-color:var(--encre); }
.c2-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.c2-conj-bar { display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin:8px 0; }
.c2-conj-in { font:inherit; font-size:18px; font-weight:800; padding:6px 10px; border:2px solid #8fd8b0; border-radius:10px; width:200px; max-width:100%; outline:none; background:#fff; color:var(--encre); }
.c2-conj-in:focus { border-color:var(--vert); }
.c2-conj-info { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
.c2-conj-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:8px; }
.c2-mini { background:#fff; border-radius:10px; overflow:hidden; border:1px solid #d7eadf; }
.c2-mini-h { color:#fff; font-weight:900; font-size:13px; padding:3px 8px; }
.c2-mini .c2-tbl { font-size:15px; }

/* ── Exercices ── */
.c2-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.c2-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.c2-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.c2-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.c2-srow .sub { display:inline-flex; gap:6px; align-items:center; flex-wrap:wrap; margin-left:10px; font-weight:900; font-size:13px; }
.c2-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    cursor:pointer; color:var(--encre); touch-action:manipulation; }
.c2-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.c2-pool { font-size:12.5px; line-height:1.5; color:#6a6380; background:#faf7f0; border-radius:10px; padding:6px 10px; font-family:'Andika','Nunito',sans-serif; }
.c2-mine-row { align-items:stretch; }
.c2-mine { flex:1 1 260px; min-height:120px; resize:vertical; font:inherit; font-size:16px; font-family:'Andika','Nunito',sans-serif; padding:8px 10px;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; }
.c2-mine:focus { border-color:var(--violet); }
.c2-mine-side { flex:1 1 240px; display:flex; flex-direction:column; gap:6px; }
.c2-mine-side .btns { display:flex; gap:6px; flex-wrap:wrap; }
.c2-detect { display:flex; flex-wrap:wrap; gap:5px; }
.c2-vchip { border-radius:999px; padding:2px 9px; font-size:12.5px; font-weight:800; color:#fff; background:var(--c); }
.c2-vchip.bad { background:#fff; color:var(--rouge); border:2px solid var(--rouge); }
.c2-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.c2-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.c2-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.c2-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.c2-pill.score { background:var(--vert); font-size:16px; }
.c2-badge { color:#fff; border-radius:999px; padding:2px 10px; font-size:12.5px; font-weight:900; white-space:nowrap; }
.c2-ends { background:#fff; border:2px dashed #c8bbf5; border-radius:14px; padding:8px 12px; display:flex; flex-direction:column; gap:5px; font-size:14px; line-height:1.45; }
.c2-endrow { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
/* 4 colonnes (moins si la fenêtre est étroite), espacement modéré */
.c2-grid { --gap:calc(var(--f) * .55); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 3 * var(--gap)) / 4), min(100%, 230px)),1fr)); }
.c2-grid.full { grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 3 * var(--gap)) / 4), min(100%, 260px)),1fr)); }
.c2-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .4) calc(var(--f) * .6) calc(var(--f) * .5); box-shadow:0 3px 0 rgba(42,31,74,.08); }
.c2-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px; font-size:14px; }
.c2-num { font-weight:900; color:#9a8f7a; }
.c2-verb { font-weight:900; font-family:'MDI',cursive; font-size:18px; }
.c2-verb small { font-weight:800; font-size:11.5px; color:#8a8199; font-family:'Nunito',sans-serif; }
.c2-cscore { margin-left:auto; font-weight:900; }
.c2-line { display:flex; align-items:baseline; gap:8px; font-size:var(--f); font-family:'MDI',cursive; line-height:1.45; }
.c2-grid.full .c2-line + .c2-line, .c2-grid.full .c2-sol + .c2-line { margin-top:calc(var(--f) * .2); }
.c2-pron { font-weight:700; white-space:nowrap; font-family:'MDI',cursive; }
.c2-in { flex:1; min-width:0; border:none; border-bottom:3px solid #d9cdb6; background:transparent; font:inherit; font-family:'MDI',cursive; font-weight:800;
    color:#3949AB; padding:0 4px; outline:none; border-radius:6px 6px 0 0; }
.c2-in:focus { border-bottom-color:var(--violet); background:#f6f2ff; }
.c2-in.ok { color:#178a4b; border-bottom-color:var(--vert); background:#e2f7ec; }
.c2-in.ko { color:var(--rouge); border-bottom-color:var(--rouge); background:#ffe9eb; }
.c2-in:disabled { opacity:1; -webkit-text-fill-color:currentColor; cursor:default; }
.c2-mark { font-size:calc(var(--f) * .7); }
.c2-sol { font-family:'MDI',cursive; font-size:calc(var(--f) * .72); color:#178a4b; font-weight:800; padding-left:calc(var(--f) * 2.4); }
.c2-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.c2-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:c2-fall 1.6s ease-in forwards; }
@keyframes c2-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.c2-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:400px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.c2-help.show { display:block; }
.c2-help h4 { margin:0 0 6px; font-size:15px; }
.c2-help p { margin:0 0 6px; }
.c2-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:se-resize; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.c2-container:hover .c2-resize { opacity:1; }
.c2-container.wf-fullboard .c2-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="conjugaison"], .c2-container, .c2-container * { cursor:default !important; }
.c2-container .c2-header { cursor:grab !important; }
.c2-container .c2-header:active { cursor:grabbing !important; }
/* Le doigt qui clique sur tout ce qui est cliquable */
.c2-container button, .c2-container select, .c2-container [data-act],
.c2-container .c2-header button { cursor:pointer !important; }
.c2-container button:disabled { cursor:default !important; }
.c2-container input, .c2-container textarea { cursor:text !important; }
.c2-container input:disabled { cursor:default !important; }
.c2-container .c2-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES : GROUPES ET TEMPS
    // =====================================================================
    const GRP_ORDER = ['aux', 'g1', 'g2', 'g3'];
    const GRP = {
        aux: { label: 'être et avoir', short: 'auxiliaire', color: '#5B6B7A' },
        g1:  { label: '1er groupe',    short: '1er gr.',    color: '#2F80ED' },
        g2:  { label: '2e groupe',     short: '2e gr.',     color: '#27AE60' },
        g3:  { label: '3e groupe',     short: '3e gr.',     color: '#EB5757' }
    };
    const POOL = {
        aux: ['être', 'avoir'],
        g1: ['chanter', 'jouer', 'parler', 'manger', 'danser', 'regarder', 'aimer', 'marcher', 'écouter', 'travailler',
             'commencer', 'nager', 'crier', 'arriver', 'tomber', 'rester', 'entrer', 'appeler', 'acheter', 'ranger'],
        g2: ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'obéir', 'réfléchir', 'rougir', 'applaudir', 'bâtir',
             'nourrir', 'ralentir', 'agir', 'punir'],
        g3: ['aller', 'faire', 'dire', 'voir', 'venir', 'prendre', 'pouvoir', 'vouloir', 'savoir', 'devoir', 'mettre',
             'partir', 'sortir', 'dormir', 'lire', 'écrire', 'boire', 'courir', 'tenir', 'recevoir', 'croire', 'vivre',
             'connaître', 'entendre', 'attendre', 'répondre', 'ouvrir', 'offrir', 'devenir', 'revenir', 'descendre',
             'vendre', 'peindre', 'construire']
    };
    const SAMPLES = {
        g1: 'chanter\njouer\nmanger\ncommencer\nparler\nregarder',
        g2: 'finir\nchoisir\ngrandir\nréussir\nobéir',
        g3: 'aller\nfaire\nprendre\nvenir\nvoir\npouvoir',
        freq: 'être\navoir\naller\nfaire\ndire\nprendre\nvenir\npouvoir'
    };
    const gc = g => `<b style="color:${GRP[g].color}">${GRP[g].short}</b>`;

    const TENSES = [
        {
            id: 'present', label: 'Le présent', short: 'Présent', ico: '⏰', color: '#0E9AA7',
            when: `Il exprime une action qui se passe <b>maintenant</b>, une <b>habitude</b> ou une <b>vérité</b> toujours vraie.`,
            ex: [`En ce moment, je <b>lis</b> un livre.`, `Le mercredi, nous <b>jouons</b> au foot.`, `La Terre <b>tourne</b> autour du Soleil.`],
            how: `On ajoute une <b>terminaison</b> au <b>radical</b> du verbe. Les terminaisons changent selon le <b>groupe</b> du verbe.`,
            rules: {
                aux: `À apprendre par cœur : ce sont les verbes les plus utilisés !`,
                g1: `Terminaisons : <b>e, es, e, ons, ez, ent</b>`,
                g2: `Terminaisons : <b>is, is, it, issons, issez, issent</b>`,
                g3: `Le plus souvent : <b>s, s, t</b> (ou <b>d</b>), <b>ons, ez, ent</b>. Parfois x, x, t (je peux, je veux) ou e, es, e (j'ouvre). Le radical peut changer : je prends, nous prenons.`
            },
            samples: { aux: ['être', 'avoir'], g1: ['chanter'], g2: ['finir'], g3: ['prendre', 'aller'] },
            ends: `${gc('g1')} e, es, e, ons, ez, ent · ${gc('g2')} is, is, it, issons, issez, issent · ${gc('g3')} s, s, t (ou d), ons, ez, ent — parfois x, x, t`,
            memo: `Avec <b>tu</b>, le verbe se termine presque toujours par <b>s</b> (tu chantes, tu finis, tu prends). Avec <b>nous</b> → <b>-ons</b> ; avec <b>vous</b> → <b>-ez</b> (sauf vous êtes, vous faites, vous dites).`,
            trap: `Verbes en <b>-cer</b> et <b>-ger</b> : nous commen<b>ç</b>ons, nous mang<b>e</b>ons. Et <b>-ent</b> ne se prononce pas : ils chant<b>ent</b>.`
        },
        {
            id: 'imparfait', label: 'L\'imparfait', short: 'Imparfait', ico: '🕰️', color: '#9B51E0',
            when: `Il exprime une action passée qui <b>dure</b>, une <b>habitude</b> dans le passé, ou sert à <b>décrire</b> (le décor, les personnages).`,
            ex: [`Quand j'étais petit, je <b>jouais</b> aux billes.`, `Autrefois, les enfants <b>allaient</b> à l'école à pied.`, `Il <b>faisait</b> beau et les oiseaux <b>chantaient</b>.`],
            how: `Pour <b>tous les verbes</b>, on prend le radical de <b>nous</b> au présent (nous <u>finiss</u>ons, nous <u>pren</u>ons) et on ajoute les mêmes terminaisons : <b>ais, ais, ait, ions, iez, aient</b>.`,
            rules: {
                aux: `Radicaux : j'<b>ét</b>ais, j'<b>av</b>ais.`,
                g1: `nous chant<u>ons</u> → je chant<b>ais</b>`,
                g2: `nous fin<u>issons</u> → je fin<b>iss</b>ais`,
                g3: `nous <u>fais</u>ons → je fais<b>ais</b> ; nous <u>pren</u>ons → je pren<b>ais</b>`
            },
            samples: { aux: ['être', 'avoir'], g1: ['chanter'], g2: ['finir'], g3: ['faire'] },
            ends: `Tous les verbes : <b>ais, ais, ait, ions, iez, aient</b> (sur le radical de « nous » au présent)`,
            memo: `Bonne nouvelle : à l'imparfait, <b>tous les verbes</b> ont les mêmes terminaisons !`,
            trap: `Nous cri<b>ions</b>, vous cri<b>iez</b> : deux i ! Et je mang<b>e</b>ais, je commen<b>ç</b>ais.`
        },
        {
            id: 'futur', label: 'Le futur simple', short: 'Futur', ico: '🚀', color: '#F2994A',
            when: `Il exprime une action qui se passera <b>plus tard</b>, dans l'avenir.`,
            ex: [`Demain, il <b>pleuvra</b>.`, `L'an prochain, nous <b>irons</b> au collège.`, `Je te <b>téléphonerai</b> ce soir.`],
            how: `Pour <b>tous les verbes</b>, les terminaisons sont : <b>ai, as, a, ons, ez, ont</b>. On les ajoute en général à l'<b>infinitif</b> : chanter → je chanter<b>ai</b>. Juste avant la terminaison, on entend toujours le son <b>[r]</b>.`,
            rules: {
                aux: `Radicaux à apprendre : je <b>ser</b>ai, j'<b>aur</b>ai.`,
                g1: `infinitif + terminaison : je jouer<b>ai</b>`,
                g2: `infinitif + terminaison : je finir<b>ai</b>`,
                g3: `Souvent l'infinitif sans le e final (prendre → je prendr<b>ai</b>), mais beaucoup de radicaux sont à apprendre : j'irai, je ferai, je verrai, je pourrai, je viendrai…`
            },
            samples: { aux: ['être', 'avoir'], g1: ['jouer'], g2: ['finir'], g3: ['aller', 'voir'] },
            ends: `Tous les verbes : <b>ai, as, a, ons, ez, ont</b> après le r (je chanterai, je finirai, je prendrai)`,
            memo: `Les terminaisons du futur ressemblent au verbe <b>avoir</b> au présent : j'<b>ai</b>, tu <b>as</b>, il <b>a</b>, nous (av)<b>ons</b>, vous (av)<b>ez</b>, ils <b>ont</b> !`,
            trap: `N'oublie pas le <b>e</b> de l'infinitif qu'on n'entend pas : je jou<b>e</b>rai, je cri<b>e</b>rai, je remerci<b>e</b>rai.`
        },
        {
            id: 'ps', label: 'Le passé simple', short: 'Passé simple', ico: '📜', color: '#C2185B',
            when: `Il exprime une action passée <b>courte</b> et <b>terminée</b>. On le trouve surtout dans les <b>récits</b> (contes, romans), souvent à côté de l'imparfait.`,
            ex: [`Soudain, le loup <b>sortit</b> du bois.`, `Le prince <b>arriva</b> et <b>frappa</b> à la porte.`, `Ils <b>furent</b> très heureux.`],
            how: `On l'emploie surtout à la <b>3e personne</b> (il, elle, ils, elles). Il existe <b>4 familles</b> de terminaisons : en <b>a</b> (il chanta), en <b>i</b> (il finit), en <b>u</b> (il voulut) et en <b>in</b> (il vint).`,
            rules: {
                aux: `Famille en <b>u</b> : il <b>fut</b>, ils <b>furent</b> ; il <b>eut</b>, ils <b>eurent</b>.`,
                g1: `Famille en <b>a</b> : ai, as, a, âmes, âtes, èrent (aller aussi : il alla)`,
                g2: `Famille en <b>i</b> : is, is, it, îmes, îtes, irent`,
                g3: `Famille en <b>i</b> (il prit, il fit, il dit), en <b>u</b> (il voulut, il put, il lut) ou en <b>in</b> (il vint, il tint)`
            },
            samples: { aux: ['être', 'avoir'], g1: ['chanter'], g2: ['finir'], g3: ['prendre', 'vouloir', 'venir'] },
            ends: `${gc('g1')} ai, as, a, âmes, âtes, èrent · ${gc('g2')} is, is, it, îmes, îtes, irent · ${gc('g3')} is… / us… / ins…`,
            memo: `À retenir surtout : il chant<b>a</b> / ils chant<b>èrent</b> · il fin<b>it</b> / ils fin<b>irent</b> · il f<b>ut</b> / ils f<b>urent</b> · il <b>eut</b> / ils <b>eurent</b>.`,
            trap: `Au 1er groupe, <b>il chanta</b> s'écrit sans t ! Et nous chant<b>â</b>mes, vous chant<b>â</b>tes prennent un accent circonflexe.`
        },
        {
            id: 'pc', label: 'Le passé composé', short: 'Passé composé', ico: '🔗', color: '#3949AB',
            when: `Il exprime une action <b>passée</b> et <b>terminée</b>. On l'utilise beaucoup quand on raconte à l'oral ou dans la vie de tous les jours.`,
            ex: [`Hier, j'<b>ai mangé</b> une pizza.`, `Ce matin, nous <b>sommes partis</b> tôt.`, `Elle <b>a fini</b> son dessin.`],
            how: `C'est un temps <b>composé de deux mots</b> : l'auxiliaire <b>avoir</b> ou <b>être</b> conjugué au <b>présent</b> + le <b>participe passé</b> du verbe.`,
            rules: {
                aux: `Avec l'auxiliaire avoir : j'ai <b>été</b>, j'ai <b>eu</b>.`,
                g1: `Participe passé en <b>é</b> : j'ai chant<b>é</b>`,
                g2: `Participe passé en <b>i</b> : j'ai fin<b>i</b>`,
                g3: `Participe passé en <b>u</b>, <b>i</b>, <b>is</b>, <b>it</b>… : j'ai v<b>u</b>, j'ai pr<b>is</b>, j'ai d<b>it</b>`
            },
            samples: { aux: ['être', 'avoir'], g1: ['chanter', 'arriver'], g2: ['finir'], g3: ['prendre', 'aller'] },
            ends: `<b>avoir</b> ou <b>être</b> au présent + participe passé (${gc('g1')} é · ${gc('g2')} i · ${gc('g3')} u, i, is, it…)`,
            memo: `Avec <b>être</b>, le participe passé s'accorde avec le sujet : elle est allé<b>e</b>, ils sont parti<b>s</b>, elles sont venu<b>es</b>. Verbes avec être : aller, venir, arriver, partir, entrer, sortir, monter, descendre, tomber, rester, naître, mourir, devenir, revenir…`,
            trap: `J'ai chant<b>é</b> ou j'ai chant<b>er</b> ? Remplace par <b>vendu</b> : « j'ai vendu » marche → c'est <b>é</b> !`
        }
    ];
    const T = {}; TENSES.forEach(t => { T[t.id] = t; });

    // =====================================================================
    // MOTEUR DE CONJUGAISON
    // =====================================================================
    const E = {
        pres1: ['e', 'es', 'e', 'ons', 'ez', 'ent'],
        pres2: ['is', 'is', 'it', 'issons', 'issez', 'issent'],
        imp:   ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
        fut:   ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
        ps: {
            'a':  ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
            'i':  ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
            'u':  ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
            'in': ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent']
        }
    };
    const AUX_FORMS = { a: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], e: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'] };

    // [présent, radical imparfait, radical futur, passé simple (radical|famille), participe, auxiliaire, groupe]
    const IRR = {
        'être':     ['suis es est sommes êtes sont', 'ét', 'ser', 'f|u', 'été', 'a', 'aux'],
        'avoir':    ['ai as a avons avez ont', 'av', 'aur', 'e|u', 'eu', 'a', 'aux'],
        'aller':    ['vais vas va allons allez vont', 'all', 'ir', 'all|a', 'allé', 'e'],
        'faire':    ['fais fais fait faisons faites font', 'fais', 'fer', 'f|i', 'fait', 'a'],
        'dire':     ['dis dis dit disons dites disent', 'dis', 'dir', 'd|i', 'dit', 'a'],
        'voir':     ['vois vois voit voyons voyez voient', 'voy', 'verr', 'v|i', 'vu', 'a'],
        'venir':    ['viens viens vient venons venez viennent', 'ven', 'viendr', 'v|in', 'venu', 'e'],
        'tenir':    ['tiens tiens tient tenons tenez tiennent', 'ten', 'tiendr', 't|in', 'tenu', 'a'],
        'prendre':  ['prends prends prend prenons prenez prennent', 'pren', 'prendr', 'pr|i', 'pris', 'a'],
        'pouvoir':  ['peux peux peut pouvons pouvez peuvent', 'pouv', 'pourr', 'p|u', 'pu', 'a'],
        'vouloir':  ['veux veux veut voulons voulez veulent', 'voul', 'voudr', 'voul|u', 'voulu', 'a'],
        'savoir':   ['sais sais sait savons savez savent', 'sav', 'saur', 's|u', 'su', 'a'],
        'devoir':   ['dois dois doit devons devez doivent', 'dev', 'devr', 'd|u', 'dû', 'a'],
        'cevoir':   ['çois çois çoit cevons cevez çoivent', 'cev', 'cevr', 'ç|u', 'çu', 'a'],
        'mettre':   ['mets mets met mettons mettez mettent', 'mett', 'mettr', 'm|i', 'mis', 'a'],
        'battre':   ['bats bats bat battons battez battent', 'batt', 'battr', 'batt|i', 'battu', 'a'],
        'partir':   ['pars pars part partons partez partent', 'part', 'partir', 'part|i', 'parti', 'e'],
        'sortir':   ['sors sors sort sortons sortez sortent', 'sort', 'sortir', 'sort|i', 'sorti', 'e'],
        'dormir':   ['dors dors dort dormons dormez dorment', 'dorm', 'dormir', 'dorm|i', 'dormi', 'a'],
        'servir':   ['sers sers sert servons servez servent', 'serv', 'servir', 'serv|i', 'servi', 'a'],
        'sentir':   ['sens sens sent sentons sentez sentent', 'sent', 'sentir', 'sent|i', 'senti', 'a'],
        'mentir':   ['mens mens ment mentons mentez mentent', 'ment', 'mentir', 'ment|i', 'menti', 'a'],
        'courir':   ['cours cours court courons courez courent', 'cour', 'courr', 'cour|u', 'couru', 'a'],
        'mourir':   ['meurs meurs meurt mourons mourez meurent', 'mour', 'mourr', 'mour|u', 'mort', 'e'],
        'fuir':     ['fuis fuis fuit fuyons fuyez fuient', 'fuy', 'fuir', 'fu|i', 'fui', 'a'],
        'cueillir': ['cueille cueilles cueille cueillons cueillez cueillent', 'cueill', 'cueiller', 'cueill|i', 'cueilli', 'a'],
        'ouvrir':   ['ouvre ouvres ouvre ouvrons ouvrez ouvrent', 'ouvr', 'ouvrir', 'ouvr|i', 'ouvert', 'a'],
        'couvrir':  ['couvre couvres couvre couvrons couvrez couvrent', 'couvr', 'couvrir', 'couvr|i', 'couvert', 'a'],
        'offrir':   ['offre offres offre offrons offrez offrent', 'offr', 'offrir', 'offr|i', 'offert', 'a'],
        'souffrir': ['souffre souffres souffre souffrons souffrez souffrent', 'souffr', 'souffrir', 'souffr|i', 'souffert', 'a'],
        'lire':     ['lis lis lit lisons lisez lisent', 'lis', 'lir', 'l|u', 'lu', 'a'],
        'écrire':   ['écris écris écrit écrivons écrivez écrivent', 'écriv', 'écrir', 'écriv|i', 'écrit', 'a'],
        'crire':    ['cris cris crit crivons crivez crivent', 'criv', 'crir', 'criv|i', 'crit', 'a'],
        'rire':     ['ris ris rit rions riez rient', 'ri', 'rir', 'r|i', 'ri', 'a'],
        'boire':    ['bois bois boit buvons buvez boivent', 'buv', 'boir', 'b|u', 'bu', 'a'],
        'croire':   ['crois crois croit croyons croyez croient', 'croy', 'croir', 'cr|u', 'cru', 'a'],
        'vivre':    ['vis vis vit vivons vivez vivent', 'viv', 'vivr', 'véc|u', 'vécu', 'a'],
        'suivre':   ['suis suis suit suivons suivez suivent', 'suiv', 'suivr', 'suiv|i', 'suivi', 'a'],
        'naître':   ['nais nais naît naissons naissez naissent', 'naiss', 'naîtr', 'naqu|i', 'né', 'e']
    };
    const HIDDEN = new Set(['cevoir', 'crire']);              // bases internes (recevoir, décrire…)
    const IRR_KEYS = Object.keys(IRR).sort((a, b) => b.length - a.length);
    const PREFIXES = new Set(['re', 'ré', 'r', 'res', 'ren', 'de', 'dé', 'des', 'com', 'con', 'ap', 'appar', 'aper', 'sur', 'sou', 'sous',
        'per', 'pro', 'pré', 'ad', 'ob', 'main', 'entre', 'entr', 'dis', 'em', 'en', 'ent', 'in', 'ins', 'pres', 'trans', 'par', 'inter',
        'contre', 'mé', 'é', 'a', 'ab', 'ac', 'se', 'satis', 'pour']);
    const NOT_DERIVED = new Set(['prédire', 'contredire', 'interdire', 'médire', 'maudire', 'prévoir', 'pourvoir', 'répartir', 'assortir', 'impartir',
        'connaître', 'connaitre', 'reconnaître', 'reconnaitre', 'méconnaître', 'méconnaitre']);
    const AUX_A_OVERRIDE = new Set(['prévenir', 'convenir', 'subvenir', 'contrevenir', 'circonvenir']);
    const AUX_E_SET = new Set(['arriver', 'entrer', 'rentrer', 'monter', 'remonter', 'tomber', 'retomber', 'rester', 'retourner',
        'descendre', 'redescendre', 'décéder', 'apparaître', 'apparaitre']);
    const H_ASP = new Set(['hurler', 'hacher', 'haïr', 'hisser', 'heurter', 'hausser', 'hanter', 'harceler', 'hérisser', 'huer', 'hâter', 'hennir']);
    const DOUBLE = new Set(['appeler', 'rappeler', 'jeter', 'rejeter', 'projeter', 'épeler', 'renouveler', 'ficeler', 'étinceler']);
    const GRAVE = new Set(['acheter', 'racheter', 'lever', 'enlever', 'soulever', 'élever', 'relever', 'mener', 'amener', 'emmener',
        'promener', 'ramener', 'peser', 'geler', 'dégeler', 'congeler', 'semer', 'achever', 'crever', 'haleter', 'modeler', 'peler', 'harceler']);
    const NV = 'aeiouyéèêàâîïôû';
    const RE_E_CONS = new RegExp('e([^' + NV + ']+)$');
    const RE_EA_CONS = new RegExp('é([^' + NV + ']+)$');

    function normVerb(raw) {
        return String(raw || '').toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    }
    function specFromIrr(e, pre) {
        const [pres, imp, fut, ps, pp, aux, g] = e;
        const [psS, psT] = ps.split('|');
        return { g: g || 'g3', pres: pres.split(' ').map(x => pre + x), imp: pre + imp, fut: pre + fut, ps: [pre + psS, psT], pp: [pre + pp], aux };
    }

    const _cache = {};
    function verbInfo(raw) {
        const v = normVerb(raw);
        if (!Object.prototype.hasOwnProperty.call(_cache, v)) _cache[v] = _resolve(v);
        return _cache[v];
    }
    function _resolve(v) {
        if (!v || !/^[a-zàâäéèêëîïôöûùüç' -]+$/.test(v)) return null;
        if (/^(se |s')/.test(v)) return { err: 'pronominal' };
        let spec = null;
        if (IRR[v] && !HIDDEN.has(v)) spec = specFromIrr(IRR[v], '');
        if (!spec && !NOT_DERIVED.has(v)) {
            for (const k of IRR_KEYS) {
                if (v.length > k.length && v.endsWith(k) && PREFIXES.has(v.slice(0, -k.length)) && IRR[k][6] !== 'aux') {
                    spec = specFromIrr(IRR[k], v.slice(0, -k.length));
                    break;
                }
            }
        }
        if (!spec && /(endre|andre|ondre|erdre|ordre)$/.test(v)) {            // vendre, attendre, répondre, perdre…
            const b = v.slice(0, -2);
            spec = { g: 'g3', pres: [b + 's', b + 's', b, b + 'ons', b + 'ez', b + 'ent'], imp: b, fut: v.slice(0, -1), ps: [b, 'i'], pp: [b + 'u'], aux: 'a' };
        }
        if (!spec && /[eao]indre$/.test(v)) {                                  // peindre, craindre, joindre
            const b = v.slice(0, -5);
            spec = { g: 'g3', pres: [b + 'ins', b + 'ins', b + 'int', b + 'ignons', b + 'ignez', b + 'ignent'], imp: b + 'ign', fut: v.slice(0, -1), ps: [b + 'ign', 'i'], pp: [b + 'int'], aux: 'a' };
        }
        if (!spec && /uire$/.test(v) && !/^(re)?(luire|nuire)$/.test(v)) {   // conduire, construire…
            const b = v.slice(0, -2);
            spec = { g: 'g3', pres: [b + 's', b + 's', b + 't', b + 'sons', b + 'sez', b + 'sent'], imp: b + 's', fut: v.slice(0, -1), ps: [b + 's', 'i'], pp: [b + 't'], aux: 'a' };
        }
        if (!spec && /a[îi]tre$/.test(v)) {                                    // connaître, paraître…
            const b = v.slice(0, -5);
            spec = { g: 'g3', pres: [b + 'ais', b + 'ais', b + 'aît', b + 'aissons', b + 'aissez', b + 'aissent'], imp: b + 'aiss', fut: b + 'aîtr', ps: [b, 'u'], pp: [b + 'u'], aux: 'a', aitre: true };
        }
        if (spec) {
            if (AUX_E_SET.has(v)) spec.aux = 'e';
            if (AUX_A_OVERRIDE.has(v)) spec.aux = 'a';
            spec.v = v;
            return spec;
        }
        if (/er$/.test(v) && v.length > 2) return { g: 'g1', g1: true, v, aux: AUX_E_SET.has(v) ? 'e' : 'a', pp: [v.slice(0, -2) + 'é'] };
        if (/ir$/.test(v) && v.length > 2) {
            const r = v.slice(0, -2);
            return { g: 'g2', v, pres: E.pres2.map(x => r + x), imp: r + 'iss', fut: v, ps: [r, 'i'], pp: [r + 'i'], aux: 'a', guess: !POOL.g2.includes(v) };
        }
        return null;
    }

    // 1er groupe : -cer, -ger, -yer, appeler / acheter / préférer…
    function cg(s, end) {
        if (/^[aoâ]/.test(end)) {
            if (/c$/.test(s)) return s.slice(0, -1) + 'ç' + end;
            if (/g$/.test(s)) return s + 'e' + end;
        }
        return s + end;
    }
    function muteStems(v, rad) {
        if (DOUBLE.has(v)) return [rad + rad.slice(-1)];
        if (GRAVE.has(v)) return [rad.replace(RE_E_CONS, 'è$1')];
        if (/[ou]y$/.test(rad)) return [rad.slice(0, -1) + 'i'];
        if (/ay$/.test(rad)) return [rad.slice(0, -1) + 'i', rad];
        if (RE_EA_CONS.test(rad)) return [rad.replace(RE_EA_CONS, 'è$1')];
        return [rad];
    }
    function g1Forms(v, t, p) {
        const rad = v.slice(0, -2);
        if (t === 'present') {
            const stems = [0, 1, 2, 5].includes(p) ? muteStems(v, rad) : [rad];
            return stems.map(s => cg(s, E.pres1[p]));
        }
        if (t === 'imparfait') return [cg(rad, E.imp[p])];
        if (t === 'ps') return [cg(rad, E.ps.a[p])];
        // futur
        let stems;
        if (/^r?envoyer$/.test(v)) stems = [v.replace(/oyer$/, 'err')];
        else if (!DOUBLE.has(v) && !GRAVE.has(v) && RE_EA_CONS.test(rad)) stems = [rad + 'er', muteStems(v, rad)[0] + 'er'];
        else stems = muteStems(v, rad).map(s => s + 'er');
        return stems.map(s => s + E.fut[p]);
    }
    function simpleForms(sp, t, p) {
        if (sp.g1) return g1Forms(sp.v, t, p);
        if (t === 'present') return [sp.pres[p]];
        if (t === 'imparfait') return [sp.imp + E.imp[p]];
        if (t === 'futur') return [sp.fut + E.fut[p]];
        return [sp.ps[0] + E.ps[sp.ps[1]][p]];
    }
    // Formes acceptées + forme affichée. gen : 'm' / 'f' (pour il/elle, ils/elles)
    function conj(v, t, p, gen) {
        const sp = verbInfo(v);
        if (!sp || sp.err) return null;
        if (t !== 'pc') { const f = simpleForms(sp, t, p); return { forms: f, display: f.join(' ou '), sp }; }
        const aux = AUX_FORMS[sp.aux][p], pp = sp.pp[0];
        if (sp.aux === 'a') return { forms: [aux + ' ' + pp], display: aux + ' ' + pp, sp };
        let forms, disp;
        if (p <= 1)       { forms = [pp, pp + 'e']; disp = pp + '(e)'; }
        else if (p === 2) { forms = [gen === 'f' ? pp + 'e' : pp]; disp = forms[0]; }
        else if (p === 3) { forms = [pp + 's', pp + 'es']; disp = pp + '(e)s'; }
        else if (p === 4) { forms = [pp, pp + 'e', pp + 's', pp + 'es']; disp = pp + '(e)(s)'; }
        else              { forms = [gen === 'f' ? pp + 'es' : pp + 's']; disp = forms[0]; }
        return { forms: forms.map(x => aux + ' ' + x), display: aux + ' ' + disp, sp };
    }
    function pron(p, gen, first, v) {
        if (p === 0) {
            const el = /^[aeiouyâàäéèêëîïôöûùü]/i.test(first) || (/^h/i.test(first) && !H_ASP.has(v));
            return el ? "j'" : 'je';
        }
        return ['je', 'tu', gen === 'f' ? 'elle' : 'il', 'nous', 'vous', gen === 'f' ? 'elles' : 'ils'][p];
    }
    function normAns(s) {
        return String(s || '').toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim()
            .replace(/[.!]+$/, '').replace(/^(j'|je |tu |il |elle |on |nous |vous |ils |elles )/, '').trim();
    }
    function isRight(q, val) {
        const c = conj(q.v, q.t, q.p, q.gen);
        const a = normAns(val);
        if (!c || !a) return false;
        return c.forms.some(f => f === a || (c.sp.aitre && f.replace(/î/g, 'i') === a.replace(/î/g, 'i')));
    }

    // ── Mise en couleur des terminaisons (leçons) ─────────────────────────
    const PRES_G3 = [['s', 'x', 'e'], ['s', 'x', 'es'], ['t', 'd', 'e'], ['ons'], ['ez', 'es'], ['ent', 'nt']];
    function endCands(t, g, p) {
        if (t === 'present') return g === 'g1' ? [E.pres1[p]] : g === 'g2' ? [E.pres2[p]] : PRES_G3[p];
        if (t === 'imparfait') return [E.imp[p]];
        if (t === 'futur') return [E.fut[p]];
        if (t === 'ps') return ['a', 'i', 'u', 'in'].map(k => E.ps[k][p]);
        return [];
    }
    function hl(form, t, g, p, col) {
        if (g === 'aux') return `<b style="color:${col}">${esc(form)}</b>`;
        const c = endCands(t, g, p).filter(e => form.endsWith(e) && form.length > e.length).sort((a, b) => b.length - a.length)[0];
        if (!c) return esc(form);
        return esc(form.slice(0, -c.length)) + `<b style="color:${col}">${esc(c)}</b>`;
    }
    function conjTable(v, t, col) {
        const sp = verbInfo(v);
        if (!sp || sp.err) return '';
        let rows = '';
        for (let p = 0; p < 6; p++) {
            const c = conj(v, t, p, 'm');
            const pr = pron(p, 'm', c.forms[0], sp.v);
            let cell;
            if (t === 'pc') {
                const d = c.display, i = d.indexOf(' ');
                cell = `<b style="color:${col}">${esc(d.slice(0, i))}</b> ${esc(d.slice(i + 1))}`;
            } else {
                cell = c.forms.map(f => hl(f, t, sp.g, p, col)).join(' <small style="color:#9a8f7a">ou</small> ');
            }
            rows += `<tr><td><span class="c2-tp">${pr}</span>${pr.endsWith("'") ? '' : ' '}${cell}</td></tr>`;
        }
        return `<table class="c2-tbl">${rows}</table>`;
    }

    // ── Utilitaires ───────────────────────────────────────────────────────
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function rr(items, n) { const out = []; while (out.length < n) out.push(...shuffle(items)); return out.slice(0, n); }
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    function parseMine(text) {
        const seen = new Set(), out = [];
        String(text || '').split(/[\n,;]+/).map(normVerb).filter(Boolean).forEach(v => {
            if (seen.has(v)) return;
            seen.add(v);
            out.push({ v, info: verbInfo(v) });
        });
        return out;
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
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'groupes', conj: 'chanter',
            ex: { tenses: ['present'], groups: ['g1'], mode: 'auto', mine: '', type: 'flash', n: 10, nv: 2, ps3: true },
            font: 26, sound: true, settingsOpen: true, showEnds: false,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createConjugaisonWidget = function (saved) {
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
        container.className = 'c2-container';
        container.innerHTML = `
            <div class="c2-header">
                <span class="c2-title">✏️ La conjugaison</span>
                <div class="c2-tabs">
                    <button class="c2-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="c2-tab-lbl">Leçons</span></button>
                    <button class="c2-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="c2-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="c2-icon-btn" data-act="sound" title="Son"></button>
                    <button class="c2-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="c2-body"></div>
            <div class="c2-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — « Les groupes » explique les 3 groupes de verbes et propose un <b>conjugueur</b> : on écrit un verbe et on voit son groupe et sa conjugaison aux 5 temps. Chaque temps a sa leçon : quand l'utiliser, comment le former, des tableaux avec les <b>terminaisons en couleur</b>, une astuce et un piège.</p>
                <p><b>✏️ Exercices</b> — 1. Choisis un ou plusieurs <b>temps</b>. 2. Choisis les <b>groupes de verbes</b> (les verbes sont alors tirés au hasard) ou écris <b>tes propres verbes</b>. 3. Choisis le type d'exercice : <b>questions mélangées</b> ou <b>conjuguer tout le verbe</b>. Puis ▶ Générer.</p>
                <p>Les élèves écrivent seulement la forme du verbe (ex. : « chantais », « ai mangé »). <b>👁 Correction</b> colorie les réponses et donne la bonne forme. <b>📋 Terminaisons</b> affiche un rappel.</p>
                <p>Passé composé avec être : pour « je », « tu », « nous », « vous », l'accord au masculin ou au féminin est accepté.</p>
                <p>Au passé simple, on peut limiter les questions à la 3e personne (il, elle, ils, elles), comme au cycle 3.</p>
            </div>
            <div class="c2-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.c2-body');
        const help = container.querySelector('.c2-help');
        const resizeHandle = container.querySelector('.c2-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let msg = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // ── Génération d'une série ──
        function genRun() {
            const ex = S.ex;
            const tenses = TENSES.map(t => t.id).filter(id => ex.tenses.includes(id));
            if (!tenses.length) return 'Choisis au moins un temps de conjugaison.';
            let verbs;
            if (ex.mode === 'mine') {
                verbs = parseMine(ex.mine).filter(x => x.info && !x.info.err).map(x => x.v);
                if (!verbs.length) return 'Écris au moins un verbe à l\'infinitif que je connais (un par ligne).';
            } else {
                verbs = [];
                GRP_ORDER.forEach(g => { if (ex.groups.includes(g)) verbs.push(...POOL[g]); });
                if (!verbs.length) return 'Choisis au moins un groupe de verbes.';
            }
            const persFor = t => (t === 'ps' && ex.ps3) ? [2, 5] : [0, 1, 2, 3, 4, 5];
            const gen = p => (p === 2 || p === 5) ? (Math.random() < 0.5 ? 'm' : 'f') : 'm';
            const qs = [];
            if (ex.type === 'full') {
                const N = ex.nv, vs = rr(verbs, N), ts = rr(tenses, N);
                vs.forEach((v, k) => persFor(ts[k]).forEach(p => qs.push({ v, t: ts[k], p, gen: gen(p), c: k })));
            } else {
                const N = ex.n, vs = shuffle(rr(verbs, N)), ts = shuffle(rr(tenses, N));
                const bag = {}, seen = new Set();
                for (let i = 0; i < N; i++) {
                    const t = ts[i];
                    let p, tries = 0;
                    do {
                        if (!bag[t] || !bag[t].length) bag[t] = shuffle(persFor(t));
                        p = bag[t].pop(); tries++;
                    } while (seen.has(vs[i] + '|' + t + '|' + p) && tries < 8);
                    seen.add(vs[i] + '|' + t + '|' + p);
                    qs.push({ v: vs[i], t, p, gen: gen(p) });
                }
            }
            S.run = { type: ex.type, qs, ans: [], corrected: false };
            return '';
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function conjToolHtml(raw) {
            const v = normVerb(raw);
            if (!v) return '';
            const sp = verbInfo(v);
            if (!sp) return `<div class="c2-msg">Je ne connais pas « ${esc(v)} ». Vérifie que le verbe est bien écrit à l'infinitif.</div>`;
            if (sp.err) return `<div class="c2-msg">Les verbes pronominaux (se laver, s'habiller…) ne sont pas encore pris en charge : écris le verbe sans « se ».</div>`;
            const G = GRP[sp.g];
            const note = sp.guess ? ` <small style="color:#9a8f7a">(si on dit « nous …issons »)</small>` : '';
            return `<div class="c2-conj-info"><span class="c2-badge" style="background:${G.color}">${G.label}</span>${note}
                <span>Passé composé avec <b>${sp.aux === 'e' ? 'être' : 'avoir'}</b></span></div>
                <div class="c2-conj-grid">${TENSES.map(t => `<div class="c2-mini"><div class="c2-mini-h" style="background:${t.color}">${t.ico} ${t.label}</div>${conjTable(v, t.id, t.color)}</div>`).join('')}</div>`;
        }
        function renderGroupsLesson() {
            const card = (g, txt, ex) => `<div class="c2-card" style="--c:${GRP[g].color}">
                <div class="c2-card-h"><span class="c2-gtag">${GRP[g].label}</span></div>
                <div class="c2-gtext">${txt}</div><div class="c2-rule">${ex}</div></div>`;
            return `<div class="c2-ltitle"><h2>🧩 Les groupes de verbes</h2></div>
                <div class="c2-box c2-how"><b class="t">🔤 L'infinitif, le radical et la terminaison</b>Dans le dictionnaire, un verbe est écrit à l'<b>infinitif</b> : chanter, finir, prendre… Quand on le conjugue, il a un <b>radical</b> (chant-) et une <b>terminaison</b> (-ais, -ons…) qui change selon la <b>personne</b> et le <b>temps</b>. Pour bien conjuguer, il faut connaître le <b>groupe</b> du verbe.</div>
                <div class="c2-cards">
                    ${card('aux', `Être et avoir sont des verbes du 3e groupe. Ce sont aussi les deux <b>auxiliaires</b> : ils aident à former les temps composés (j'<b>ai</b> mangé, je <b>suis</b> parti). Ils sont à part et s'apprennent par cœur.`, `être, avoir`)}
                    ${card('g1', `Tous les verbes en <b>-er</b> (sauf <b>aller</b>). C'est le groupe le plus grand et le plus régulier.`, `chanter, jouer, manger, aimer, parler…`)}
                    ${card('g2', `Les verbes en <b>-ir</b> qui font <b>-issons</b> avec « nous ».`, `finir → nous fin<b>iss</b>ons · choisir, grandir, obéir…`)}
                    ${card('g3', `Tous les autres : les verbes en <b>-ir</b> sans -issons (partir → nous partons), en <b>-re</b>, en <b>-oir</b>, et le verbe <b>aller</b>.`, `prendre, faire, voir, pouvoir, venir, aller…`)}
                </div>
                <div class="c2-box c2-memo"><b class="t">🧠 Pour retenir</b>Pour un verbe en -ir, je dis « nous … » : nous fin<b>issons</b> → 2e groupe ; nous part<b>ons</b> → 3e groupe.</div>
                <div class="c2-box c2-trap"><b class="t">⚠️ Attention au piège</b><b>aller</b> se termine par -er… mais il est du <b>3e groupe</b> : je vais, j'irai !</div>
                <div class="c2-box c2-tool"><b class="t">🔍 Le conjugueur</b>Écris un verbe à l'infinitif pour voir son groupe et sa conjugaison aux 5 temps.
                    <div class="c2-conj-bar">
                        <input class="c2-conj-in" value="${esc(S.conj)}" placeholder="ex. : chanter" autocomplete="off" spellcheck="false" autocapitalize="off">
                        ${['être', 'chanter', 'finir', 'aller', 'prendre', 'venir'].map(v => `<button class="c2-btn alt small" data-act="conjpick" data-v="${v}">${v}</button>`).join('')}
                    </div>
                    <div class="c2-conj-res">${conjToolHtml(S.conj)}</div>
                </div>`;
        }
        function renderTenseLesson(id) {
            const d = T[id];
            let cards = '';
            GRP_ORDER.forEach(g => {
                (d.samples[g] || []).forEach((v, k) => {
                    cards += `<div class="c2-card" style="--c:${GRP[g].color}">
                        <div class="c2-card-h"><span class="c2-gtag">${GRP[g].label}</span><b>${esc(v)}</b></div>
                        ${k === 0 ? `<div class="c2-rule">${d.rules[g]}</div>` : ''}
                        ${conjTable(v, id, d.color)}</div>`;
                });
            });
            return `<div class="c2-ltitle"><h2 style="color:${d.color}">${d.ico} ${d.label}</h2></div>
                <div class="c2-box c2-when"><b class="t">🕰️ Quand l'utiliser ?</b>${d.when}<ul>${d.ex.map(x => `<li>${x}</li>`).join('')}</ul></div>
                <div class="c2-box c2-how"><b class="t">🔧 Comment le former ?</b>${d.how}</div>
                <div class="c2-cards">${cards}</div>
                <div class="c2-box c2-memo"><b class="t">🧠 Pour retenir</b>${d.memo}</div>
                <div class="c2-box c2-trap"><b class="t">⚠️ Attention au piège</b>${d.trap}</div>
                <div><button class="c2-btn go" data-act="practice" data-t="${id}">✏️ S'entraîner : ${d.label.toLowerCase()}</button></div>`;
        }
        function renderLesson() {
            const side = `<button class="c2-gbtn ${S.lesson === 'groupes' ? 'active' : ''}" style="--c:#6C4FD8" data-act="lesson" data-g="groupes">🧩 Les groupes</button>` +
                TENSES.map(t => `<button class="c2-gbtn ${S.lesson === t.id ? 'active' : ''}" style="--c:${t.color}" data-act="lesson" data-g="${t.id}">${t.ico} ${t.short}</button>`).join('');
            const main = (S.lesson === 'groupes' || !T[S.lesson]) ? renderGroupsLesson() : renderTenseLesson(S.lesson);
            return `<div class="c2-lesson"><div class="c2-side">${side}</div><div class="c2-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function detectHtml() {
            const list = parseMine(S.ex.mine);
            if (!list.length) return `<span style="font-size:12.5px;color:#9a8f7a">Les verbes reconnus s'afficheront ici avec leur groupe.</span>`;
            return list.map(x => {
                if (!x.info) return `<span class="c2-vchip bad" title="Verbe inconnu : il sera ignoré">${esc(x.v)} ❓</span>`;
                if (x.info.err) return `<span class="c2-vchip bad" title="Verbe pronominal : non pris en charge">${esc(x.v)} ❓</span>`;
                return `<span class="c2-vchip" style="--c:${GRP[x.info.g].color}">${esc(x.v)} · ${GRP[x.info.g].short}${x.info.guess ? ' ?' : ''}</span>`;
            }).join('');
        }
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="c2-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="c2-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="c2-settings">`;
            h += `<div class="c2-srow"><span class="l">1. Temps</span>${TENSES.map(t => ch('tense', t.id, ex.tenses.includes(t.id), t.ico + ' ' + t.short, t.color)).join('')}</div>`;
            h += `<div class="c2-srow"><span class="l">2. Verbes</span>${ch('mode', 'auto', ex.mode === 'auto', '🎲 Proposés au hasard')}${ch('mode', 'mine', ex.mode === 'mine', '✍️ Choisis par moi')}</div>`;
            if (ex.mode === 'auto') {
                h += `<div class="c2-srow"><span class="l">Groupes travaillés</span>${GRP_ORDER.map(g => ch('grp', g, ex.groups.includes(g), GRP[g].label, GRP[g].color)).join('')}</div>`;
                const list = GRP_ORDER.filter(g => ex.groups.includes(g)).map(g => POOL[g].map(v => `<span style="color:${GRP[g].color}">${v}</span>`).join(', ')).join(' · ');
                h += `<div class="c2-pool">${list ? '<b>Verbes possibles :</b> ' + list : 'Aucun groupe choisi.'}</div>`;
            } else {
                h += `<div class="c2-srow c2-mine-row">
                    <textarea class="c2-mine" placeholder="Un verbe à l'infinitif par ligne (ou séparés par des virgules)…" spellcheck="false" autocapitalize="off">${esc(ex.mine)}</textarea>
                    <div class="c2-mine-side">
                        <div class="btns">
                            <button class="c2-btn alt small" data-act="sample" data-v="g1">Exemples 1er gr.</button>
                            <button class="c2-btn alt small" data-act="sample" data-v="g2">Exemples 2e gr.</button>
                            <button class="c2-btn alt small" data-act="sample" data-v="g3">Exemples 3e gr.</button>
                            <button class="c2-btn alt small" data-act="sample" data-v="freq">Verbes fréquents</button>
                        </div>
                        <div class="c2-detect">${detectHtml()}</div>
                    </div></div>`;
            }
            h += `<div class="c2-srow"><span class="l">3. Exercice</span>${ch('type', 'flash', ex.type === 'flash', '⚡ Questions mélangées')}${ch('type', 'full', ex.type === 'full', '📋 Conjuguer tout le verbe')}
                <span class="sub">${ex.type === 'flash'
                    ? 'Questions : ' + [5, 10, 15, 20].map(n => ch('n', n, ex.n === n, String(n))).join('')
                    : 'Verbes : ' + [1, 2, 3, 4, 6].map(n => ch('nv', n, ex.nv === n, String(n))).join('')}</span></div>`;
            if (ex.tenses.includes('ps')) {
                h += `<div class="c2-srow"><span class="l">Passé simple</span>${ch('ps3', '1', ex.ps3, 'il, elle, ils, elles seulement')}${ch('ps3', '0', !ex.ps3, 'toutes les personnes')}</div>`;
            }
            h += `<div class="c2-srow"><span class="l">Taille du texte</span><button class="c2-btn alt small" data-act="font" data-d="-2">A−</button><button class="c2-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="c2-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="c2-btn go small" data-act="gen">▶ Générer les exercices</button></div>`;
            if (msg) h += `<div class="c2-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        function lineHtml(q, i, capital) {
            const R = S.run;
            const c = conj(q.v, q.t, q.p, q.gen);
            if (!c) return '';
            let pr = pron(q.p, q.gen, c.forms[0], c.sp.v);
            if (capital) pr = cap(pr);
            const val = R.ans[i] || '';
            let cls = '', after = '', sol = '';
            if (R.corrected) {
                const ok = isRight(q, val);
                cls = ok ? 'ok' : 'ko';
                after = `<span class="c2-mark">${ok ? '✅' : '❌'}</span>`;
                if (!ok) sol = `<div class="c2-sol">→ ${esc(pr)}${pr.endsWith("'") ? '' : ' '}${esc(c.display)}</div>`;
            }
            return `<div class="c2-line"><span class="c2-pron">${esc(pr)}</span><input class="c2-in ${cls}" data-i="${i}" value="${esc(val)}" placeholder="…"
                autocomplete="off" spellcheck="false" autocapitalize="off" ${R.corrected ? 'disabled' : ''}>${after}</div>${sol}`;
        }
        function renderRun() {
            const R = S.run, N = R.qs.length;
            const tensesInRun = TENSES.filter(t => R.qs.some(q => q.t === t.id));
            const score = R.corrected ? R.qs.filter((q, i) => isRight(q, R.ans[i])).length : 0;
            const nCards = R.type === 'full' ? new Set(R.qs.map(q => q.c)).size : N;
            let h = `<div class="c2-topbar">
                <span class="c2-pill">${R.type === 'full' ? nCards + ' verbe' + (nCards > 1 ? 's' : '') + ' à conjuguer' : N + ' questions'}</span>
                ${tensesInRun.map(t => `<span class="c2-badge" style="background:${t.color}">${t.short}</span>`).join('')}
                ${R.corrected ? `<span class="c2-pill score">${score >= N * 0.9 ? '🏆' : score >= N * 0.6 ? '🎉' : '💪'} ${score} / ${N}</span>` : ''}
            </div>
            <div class="c2-actions">
                <button class="c2-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="c2-btn alt ${S.showEnds ? 'on' : ''}" data-act="ends">📋 Terminaisons</button>
                <button class="c2-btn alt" data-act="clear">🧹 Effacer les réponses</button>
                <button class="c2-btn alt" data-act="regen">🔄 Nouvelles questions</button>
            </div>`;
            if (S.showEnds) {
                h += `<div class="c2-ends">${tensesInRun.map(t => `<div class="c2-endrow"><span class="c2-badge" style="background:${t.color}">${t.short}</span><span>${t.ends}</span></div>`).join('')}</div>`;
            }
            const vlabel = q => { const sp = verbInfo(q.v); return `<span class="c2-verb">${esc(q.v)} <small style="color:${GRP[sp.g].color}">${GRP[sp.g].short}</small></span>`; };
            if (R.type === 'full') {
                const groups = [];
                R.qs.forEach((q, i) => { if (!groups[q.c]) groups[q.c] = []; groups[q.c].push(i); });
                h += `<div class="c2-grid full" style="--f:${S.font}px">` + groups.map(idx => {
                    const q0 = R.qs[idx[0]], t = T[q0.t];
                    const sc = R.corrected ? `<span class="c2-cscore">${idx.filter(i => isRight(R.qs[i], R.ans[i])).length} / ${idx.length}</span>` : '';
                    return `<div class="c2-q"><div class="c2-qtop"><span class="c2-badge" style="background:${t.color}">${t.short}</span>${vlabel(q0)}${sc}</div>
                        ${idx.map(i => lineHtml(R.qs[i], i, false)).join('')}</div>`;
                }).join('') + `</div>`;
            } else {
                h += `<div class="c2-grid" style="--f:${S.font}px">` + R.qs.map((q, i) => {
                    const t = T[q.t];
                    return `<div class="c2-q"><div class="c2-qtop"><span class="c2-num">${i + 1})</span><span class="c2-badge" style="background:${t.color}">${t.short}</span>${vlabel(q)}</div>${lineHtml(q, i, true)}</div>`;
                }).join('') + `</div>`;
            }
            return h;
        }
        function renderTrain() {
            let h = `<div class="c2-train">${renderSettings()}`;
            if (S.run && S.run.qs && S.run.qs.length) h += renderRun();
            else if (!S.settingsOpen || !msg) h += `<div class="c2-info">Choisis le temps, les verbes et le type d'exercice, puis clique sur <b>▶ Générer les exercices</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.c2-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
                c.className = 'c2-confetti';
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
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '✏️ La conjugaison', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'conjpick': S.conj = el.dataset.v; break;
                case 'practice':
                    ex.tenses = [el.dataset.t]; S.tab = 'train'; S.settingsOpen = true; S.run = null; msg = ''; body.scrollTop = 0; break;
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'tense': toggleIn(ex.tenses, el.dataset.v); msg = ''; break;
                case 'grp': toggleIn(ex.groups, el.dataset.v); msg = ''; break;
                case 'mode': ex.mode = el.dataset.v; msg = ''; break;
                case 'sample': ex.mode = 'mine'; ex.mine = SAMPLES[el.dataset.v] || ''; msg = ''; break;
                case 'type': ex.type = el.dataset.v; break;
                case 'n': ex.n = +el.dataset.v; break;
                case 'nv': ex.nv = +el.dataset.v; break;
                case 'ps3': ex.ps3 = el.dataset.v === '1'; break;
                case 'font': S.font = Math.max(16, Math.min(48, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; }
                    else S.settingsOpen = true;
                    break;
                case 'ends': S.showEnds = !S.showEnds; break;
                case 'clear': if (R) { R.ans = []; R.corrected = false; } break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected;
                    if (R.corrected) {
                        const N = R.qs.length, sc = R.qs.filter((q, i) => isRight(q, R.ans[i])).length;
                        if (sc >= N * 0.8) { sfx('win'); party(); } else sfx(sc >= N * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                default: return;
            }
            render(); save();
        }

        // ── Événements : souris, stylet et tactile (dédoublonnés) ──
        let lastTap = 0;
        function onTap(e) {
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
            if (e.target.closest('.c2-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.c2-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Saisie : réponses, verbes du prof, conjugueur (sans tout redessiner)
        container.addEventListener('input', e => {
            const t = e.target;
            if (t.classList.contains('c2-in') && S.run) {
                S.run.ans[+t.dataset.i] = t.value; saveSoon();
            } else if (t.classList.contains('c2-mine')) {
                S.ex.mine = t.value;
                const d = body.querySelector('.c2-detect'); if (d) d.innerHTML = detectHtml();
                saveSoon();
            } else if (t.classList.contains('c2-conj-in')) {
                S.conj = t.value;
                const r = body.querySelector('.c2-conj-res'); if (r) r.innerHTML = conjToolHtml(S.conj);
                saveSoon();
            }
        });
        container.addEventListener('keydown', e => {
            if (e.key !== 'Enter' || !e.target.classList.contains('c2-in')) return;
            e.preventDefault();
            const ins = Array.from(body.querySelectorAll('.c2-in:not([disabled])'));
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
        widget._c2GetData = function () {
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

    window.createConjugaison2Widget = window.createConjugaisonWidget;   // ancien nom

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE || type === 'conjugaison2') return window.createConjugaisonWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
