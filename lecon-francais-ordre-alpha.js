// =========================================================================
// ACTIVITÉ « L'ORDRE ALPHABÉTIQUE » — Le Bureau du Prof
// Leçons + exercices corrigés (même présentation que « La conjugaison »).
//
// 📖 Leçons : l'alphabet (lettres cliquables), regarder la 1re lettre,
//    même 1re lettre (avec un comparateur de deux mots), le dictionnaire.
// ✏️ Exercices :
//    🔀 Ranger des mots : glisser (ou toucher puis toucher une case) les
//       étiquettes dans l'ordre. Mots proposés (3 niveaux, 20 listes)
//       ou choisis par le prof.
//    🔤 Lettre avant / après / entre deux lettres.
//    📖 Le dictionnaire : le mot est-il avant, sur la page ou après ?
//    Bouton Correction avec score.
//
// Ouverture : createWidget('mots-alpha')  ou  createMotsAlphaWidget()
// Sauvegarde : w._a2GetData()  /  createMotsAlphaWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'mots-alpha';

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

    // ── CSS (préfixe a2-) ─────────────────────────────────────────────────
    if (!document.getElementById('a2-style')) {
        const s = document.createElement('style');
        s.id = 'a2-style';
        s.textContent = `
.widget[data-type="mots-alpha"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.a2-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC; --dec:#E8590C;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.a2-container input, .a2-container textarea { user-select:text; -webkit-user-select:text; }
.a2-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .a2-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .a2-tab-lbl { display:none; }
    .a2-title { font-size:17px !important; }
    .a2-lesson { flex-direction:column; }
    .a2-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .a2-gbtn { flex:1 1 auto; text-align:center !important; }
    .a2-srow > .l { min-width:0 !important; width:100%; }
    .a2-mine-row { flex-direction:column; }
}
.a2-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); cursor:move; flex-shrink:0; flex-wrap:wrap; }
.a2-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.a2-tabs { display:flex; gap:6px; margin-left:12px; }
.a2-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; cursor:pointer; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.a2-tab:hover { background:rgba(255,255,255,.1); }
.a2-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.a2-icon-btn { width:26px; height:26px; border-radius:50%; border:none; cursor:pointer; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.a2-icon-btn:hover { background:rgba(255,255,255,.28); }
.a2-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* ── Leçons ── */
.a2-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.a2-side { width:190px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.a2-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); cursor:pointer; text-align:left; touch-action:manipulation; transition:transform .1s; }
.a2-gbtn:hover { transform:translateX(2px); }
.a2-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.a2-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.a2-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.a2-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.a2-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.a2-how  { background:#f1edff; border:2px solid #c8bbf5; }
.a2-memo { background:#fff6d6; border:2px solid #f3d36b; }
.a2-trap { background:#ffecee; border:2px solid #f6a7b0; }
.a2-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.a2-ex-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:12px; }
.a2-excard { background:#fff; border-radius:16px; border:3px solid var(--c,#c8bbf5); padding:8px 12px 10px; display:flex; flex-direction:column; gap:6px; }
.a2-excard-h { font-weight:900; font-size:13.5px; color:#5a5470; }
.a2-row-words { display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-family:'MDI',cursive; font-size:24px; }
.a2-arrow { color:#b8ad96; font-family:'Nunito',sans-serif; font-size:16px; font-weight:900; }
.a2-w { background:#faf7f0; border:2px solid #e3d8c3; border-radius:10px; padding:1px 10px; }
.a2-w b.dec, b.dec { color:var(--dec); text-decoration:underline; text-decoration-thickness:3px; text-underline-offset:4px; }
.a2-letters { display:grid; grid-template-columns:repeat(13, minmax(0,1fr)); gap:6px; }
.a2-letter { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:6px 0 4px; display:flex; flex-direction:column; align-items:center;
    cursor:pointer; font:inherit; color:var(--encre); touch-action:manipulation; }
.a2-letter .L { font-family:'MDI',cursive; font-size:30px; line-height:1.1; font-weight:700; }
.a2-letter .n { font-size:11px; color:#9a8f7a; font-weight:800; }
.a2-letter.voy { background:#ffecee; border-color:#f6a7b0; }
.a2-letter.sel { background:var(--violet); border-color:var(--violet); color:#fff; transform:scale(1.08); }
.a2-letter.sel .n { color:#e6defc; }
.a2-letter.nb { background:#e2f7ec; border-color:var(--vert); }
.a2-letter-info { text-align:center; font-size:17px; min-height:28px; }
.a2-letter-info .big { font-family:'MDI',cursive; font-size:30px; font-weight:700; color:var(--violet); padding:0 4px; }
.a2-legend { display:flex; gap:12px; flex-wrap:wrap; font-size:13px; font-weight:800; }
.a2-legend span::before { content:''; display:inline-block; width:14px; height:14px; border-radius:4px; margin-right:5px; vertical-align:-2px; background:var(--c); border:2px solid var(--b); }
.a2-cmp-bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:8px 0; }
.a2-cmp-in { font:inherit; font-family:'MDI',cursive; font-size:22px; font-weight:700; padding:4px 10px; border:2px solid #8fd8b0; border-radius:10px; width:190px; max-width:100%; outline:none; background:#fff; color:var(--encre); }
.a2-cmp-in:focus { border-color:var(--vert); }
.a2-cmp-grid { display:inline-grid; gap:4px; margin:6px 0; }
.a2-cmp-cell { width:34px; height:40px; display:flex; align-items:center; justify-content:center; background:#fff; border:2px solid #d7eadf; border-radius:8px;
    font-family:'MDI',cursive; font-size:24px; font-weight:700; }
.a2-cmp-cell.same { background:#f2f2f2; color:#8a8199; }
.a2-cmp-cell.diff { background:#fff1e6; border-color:var(--dec); color:var(--dec); }
.a2-cmp-cell.empty { background:transparent; border-style:dashed; }
.a2-cmp-txt { font-size:15px; line-height:1.5; }
.a2-page { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:8px 14px; max-width:420px; box-shadow:4px 4px 0 #efe6d3; }
.a2-page-h { display:flex; justify-content:space-between; font-family:'MDI',cursive; font-size:22px; font-weight:700; color:var(--violet); border-bottom:2px solid #eee6d6; padding-bottom:4px; margin-bottom:4px; }
.a2-page-l { font-family:'MDI',cursive; font-size:18px; line-height:1.55; color:#5a5470; }
.a2-parts { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.a2-part { border-radius:12px; padding:8px; text-align:center; font-weight:900; color:#fff; }
.a2-part small { display:block; font-weight:700; font-size:13px; opacity:.95; }
.a2-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px; cursor:pointer;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.a2-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.a2-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.a2-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.a2-btn.alt.on { background:var(--encre); color:var(--or); border-color:var(--encre); }
.a2-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }

/* ── Exercices ── */
.a2-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.a2-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.a2-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.a2-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.a2-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    cursor:pointer; color:var(--encre); touch-action:manipulation; }
.a2-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.a2-select { font:inherit; font-weight:800; font-size:13.5px; padding:4px 8px; border-radius:10px; border:2px solid #d9cdb6; background:#fff; color:var(--encre); }
.a2-hint { font-size:12.5px; color:#6a6380; }
.a2-mine-row { align-items:stretch; }
.a2-mine { flex:1 1 260px; min-height:110px; resize:vertical; font:inherit; font-size:18px; font-family:'MDI',cursive; padding:8px 10px;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; }
.a2-mine:focus { border-color:var(--violet); }
.a2-mine-side { flex:1 1 240px; display:flex; flex-direction:column; gap:6px; }
.a2-mine-side .btns { display:flex; gap:6px; flex-wrap:wrap; }
.a2-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.a2-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.a2-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.a2-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.a2-pill.score { background:var(--vert); font-size:16px; }
.a2-pill.warn { background:#e67e22; }
.a2-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.a2-abc { display:flex; flex-wrap:wrap; justify-content:center; gap:3px; background:#fff; border:2px dashed #c8bbf5; border-radius:12px; padding:6px;
    font-family:'MDI',cursive; font-size:calc(var(--f) * .8); font-weight:700; }
.a2-abc span { min-width:1.3em; text-align:center; }
.a2-abc span.voy { color:#d12f3d; }
.a2-consigne { text-align:center; font-weight:800; color:#5a5470; }
/* Ranger */
.a2-pool { min-height:calc(var(--f) * 2.4); display:flex; flex-wrap:wrap; gap:calc(var(--f) * .45); justify-content:center; align-items:center;
    padding:calc(var(--f) * .4); background:#fff; border:2px solid #e3d8c3; border-radius:16px; }
.a2-pool.drop { background:#f6f2ff; border-color:var(--violet); }
.a2-slots { display:grid; gap:calc(var(--f) * .4); }
.a2-slot { min-height:calc(var(--f) * 2.4); border:3px dashed #c8bbf5; border-radius:14px; background:#faf8ff; position:relative;
    display:flex; align-items:center; justify-content:center; padding:calc(var(--f) * .45) 4px calc(var(--f) * .25); box-sizing:border-box; }
.a2-slot.drop { background:#ece6ff; border-style:solid; border-color:var(--violet); }
.a2-slot.target { border-color:var(--vert); }
.a2-slot.ok { border:3px solid var(--vert); background:#e2f7ec; }
.a2-slot.ko { border:3px solid var(--rouge); background:#ffe9eb; }
.a2-slot-n { position:absolute; top:3px; left:8px; font-size:12px; font-weight:900; color:#9d8fd9; }
.a2-card { font-family:'MDI',cursive; font-size:var(--f); font-weight:700; line-height:1.2; background:#fff; border:2px solid #d1c6ad; border-radius:10px;
    padding:.15em .55em; cursor:grab; touch-action:none; box-shadow:0 3px 0 rgba(42,31,74,.12); white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; }
.a2-card.sel { border-color:var(--violet); background:#f2eeff; box-shadow:0 0 0 4px #cfc3f7; }
.a2-card.dragging { opacity:.3; }
.a2-card.locked { cursor:default; }
.a2-ghost { position:fixed; z-index:99999; pointer-events:none; transform:translate(-50%,-50%) rotate(2deg); font-family:'MDI',cursive; font-weight:700;
    background:var(--violet); color:#fff; border-radius:10px; padding:.15em .55em; box-shadow:0 8px 20px rgba(60,40,140,.35); white-space:nowrap; }
.a2-sol { background:#e2f7ec; border:2px solid #8fd8b0; border-radius:14px; padding:8px 12px; }
.a2-sol .a2-row-words { font-size:calc(var(--f) * .8); }
/* Questions (lettres, dictionnaire) */
.a2-grid { --gap:calc(var(--f) * .55); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 3 * var(--gap)) / 4), min(100%, 230px)),1fr)); }
.a2-grid.dico { grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 2 * var(--gap)) / 3), min(100%, 280px)),1fr)); }
.a2-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .4) calc(var(--f) * .6) calc(var(--f) * .5); box-shadow:0 3px 0 rgba(42,31,74,.08); }
.a2-q.ok { border-color:var(--vert); background:#f3fcf7; }
.a2-q.ko { border-color:var(--rouge); background:#fff5f6; }
.a2-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px; font-size:14px; font-weight:800; color:#5a5470; }
.a2-num { font-weight:900; color:#9a8f7a; }
.a2-line { display:flex; align-items:center; gap:10px; justify-content:center; font-family:'MDI',cursive; font-size:var(--f); }
.a2-bigL { min-width:1.4em; text-align:center; background:#f2eeff; border-radius:10px; font-weight:700; color:var(--violet); padding:0 .15em; }
.a2-in { width:1.8em; text-align:center; border:none; border-bottom:3px solid #d9cdb6; background:transparent; font:inherit; font-family:'MDI',cursive;
    font-weight:800; color:#3949AB; outline:none; border-radius:6px 6px 0 0; }
.a2-in:focus { border-bottom-color:var(--violet); background:#f6f2ff; }
.a2-in.ok { color:#178a4b; border-bottom-color:var(--vert); }
.a2-in.ko { color:var(--rouge); border-bottom-color:var(--rouge); }
.a2-in:disabled { opacity:1; -webkit-text-fill-color:currentColor; }
.a2-solq { text-align:center; font-family:'MDI',cursive; font-size:calc(var(--f) * .7); color:#178a4b; font-weight:800; }
.a2-dpage { display:flex; justify-content:space-between; gap:8px; font-family:'MDI',cursive; font-size:calc(var(--f) * .72); color:var(--violet); font-weight:700;
    border-bottom:2px solid #eee6d6; padding-bottom:2px; }
.a2-dword { text-align:center; font-family:'MDI',cursive; font-size:var(--f); font-weight:700; margin:calc(var(--f) * .2) 0; }
.a2-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.a2-choice { border:2px solid #d9cdb6; background:#fff; border-radius:999px; padding:4px 10px; font:inherit; font-weight:900; font-size:14px; cursor:pointer;
    color:var(--encre); touch-action:manipulation; }
.a2-choice.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.a2-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.a2-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.a2-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:a2-fall 1.6s ease-in forwards; }
@keyframes a2-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.a2-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:400px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.a2-help.show { display:block; }
.a2-help h4 { margin:0 0 6px; font-size:15px; }
.a2-help p { margin:0 0 6px; }
.a2-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:se-resize; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.a2-container:hover .a2-resize { opacity:1; }
.a2-container.wf-fullboard .a2-resize { display:none; }
@media (max-width:560px) { .a2-letters { grid-template-columns:repeat(7, minmax(0,1fr)); } }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="mots-alpha"], .a2-container, .a2-container * { cursor:default !important; }
.a2-container .a2-header { cursor:grab !important; }
.a2-container .a2-header:active { cursor:grabbing !important; }
/* Le doigt qui clique sur tout ce qui est cliquable */
/* (y compris ce qu'il y a DANS l'élément : la lettre et son numéro dans une tuile, le texte d'une étiquette…) */
.a2-container button, .a2-container button *, .a2-container select, .a2-container [data-act], .a2-container [data-act] *,
.a2-container .a2-card, .a2-container .a2-card * { cursor:pointer !important; }
.a2-container .a2-slot, .a2-container .a2-pool, .a2-container .a2-slot-n, .a2-container .a2-pool > .a2-hint,
.a2-container button:disabled, .a2-container button:disabled *,
.a2-container .a2-card.locked, .a2-container .a2-card.locked * { cursor:default !important; }
.a2-container input, .a2-container textarea { cursor:text !important; }
.a2-container .a2-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES
    // =====================================================================
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const VOY = 'AEIOUY';

    // 20 listes par niveau, 6 mots par liste
    const BANK = {
        1: [ // initiales toutes différentes
            ['avion', 'banane', 'cerise', 'datte', 'étoile', 'forêt'],
            ['girafe', 'hibou', 'iris', 'jardin', 'lune', 'mouton'],
            ['neige', 'orange', 'papillon', 'renard', 'savane', 'tulipe'],
            ['univers', 'vague', 'wagon', 'xylophone', 'yaourt', 'zèbre'],
            ['arbre', 'bateau', 'cheval', 'dauphin', 'écureuil', 'fusée'],
            ['gâteau', 'herbe', 'image', 'jungle', 'lapin', 'maison'],
            ['nuage', 'ourson', 'puma', 'ruche', 'sable', 'tigre'],
            ['koala', 'quiche', 'valise', 'robot', 'soleil', 'tortue'],
            ['ananas', 'ballon', 'canard', 'dessin', 'éléphant', 'fleur'],
            ['guitare', 'hérisson', 'insecte', 'jouet', 'livre', 'marmotte'],
            ['nid', 'oiseau', 'plume', 'queue', 'sapin', 'trompette'],
            ['usine', 'violon', 'wagon', 'xylophone', 'yacht', 'zoo'],
            ['armoire', 'biscuit', 'citron', 'domino', 'escargot', 'fraise'],
            ['grenouille', 'hutte', 'île', 'jonquille', 'lampe', 'montagne'],
            ['noisette', 'orage', 'panda', 'radis', 'souris', 'tambour'],
            ['kangourou', 'quartier', 'uniforme', 'verre', 'week-end', 'zéro'],
            ['abeille', 'brosse', 'coccinelle', 'drapeau', 'épée', 'feuille'],
            ['genou', 'hache', 'ketchup', 'licorne', 'melon', 'navire'],
            ['ombre', 'poire', 'requin', 'sirène', 'toboggan', 'vélo'],
            ['gorille', 'journal', 'kiwi', 'moto', 'plage', 'train']
        ],
        2: [ // même initiale
            ['balcon', 'bateau', 'bison', 'bleu', 'bonbon', 'brevet'],
            ['cabane', 'cactus', 'canard', 'castor', 'cerise', 'coton'],
            ['daim', 'datte', 'décor', 'dessin', 'dîner', 'domino'],
            ['fable', 'facile', 'famille', 'faucon', 'feuille', 'forêt'],
            ['galette', 'garçon', 'gâteau', 'genou', 'girafe', 'gorille'],
            ['jardin', 'jasmin', 'jeton', 'joli', 'jouet', 'jungle'],
            ['labyrinthe', 'lacet', 'lagon', 'lampe', 'lapin', 'larme'],
            ['machine', 'madame', 'maison', 'maman', 'manche', 'marché'],
            ['nappe', 'natation', 'navire', 'neige', 'nénuphar', 'nuage'],
            ['palais', 'panda', 'papier', 'paquet', 'pardon', 'pastel'],
            ['radis', 'raisin', 'rampe', 'rapide', 'rasoir', 'robot'],
            ['sabot', 'sable', 'safari', 'salade', 'sanglier', 'sapin'],
            ['tableau', 'tablier', 'taille', 'talon', 'tambour', 'tapis'],
            ['valeur', 'valise', 'vampire', 'vapeur', 'vase', 'vélo'],
            ['tomate', 'tonneau', 'torche', 'tortue', 'toucan', 'tournesol'],
            ['abeille', 'acacia', 'agneau', 'aigle', 'ananas', 'armoire'],
            ['écharpe', 'éléphant', 'émotion', 'épée', 'escalier', 'étoile'],
            ['habit', 'herbe', 'hibou', 'horloge', 'humain', 'hyène'],
            ['objet', 'oiseau', 'olive', 'ombre', 'orage', 'ourson'],
            ['idée', 'igloo', 'île', 'image', 'insecte', 'iris']
        ],
        3: [ // mêmes 3 premières lettres
            ['abricot', 'abrité', 'abreuver', 'abrupt', 'abréviation', 'abricotier'],
            ['charmant', 'charnière', 'charbon', 'charpente', 'charrue', 'chariot'],
            ['complet', 'complice', 'compliment', 'complot', 'composer', 'comprendre'],
            ['courber', 'courbure', 'coureur', 'courir', 'couronne', 'courroie'],
            ['drapeau', 'draper', 'dragon', 'dragée', 'drame', 'dramatique'],
            ['escalier', 'escargot', 'escorte', 'escale', 'escrime', 'escabeau'],
            ['fabricant', 'fabriquer', 'fabuleux', 'fable', 'fabrication', 'fabliau'],
            ['flambeau', 'flamber', 'flamme', 'flamant', 'flamboyant', 'flambée'],
            ['glorieux', 'gloire', 'global', 'globe', 'glouton', 'gloussement'],
            ['marché', 'mardi', 'marée', 'marguerite', 'marin', 'marionnette'],
            ['partir', 'partout', 'partage', 'partenaire', 'parterre', 'participe'],
            ['planche', 'planète', 'planifier', 'planeur', 'plantation', 'planquer'],
            ['premier', 'prendre', 'prénom', 'présent', 'presque', 'prêter'],
            ['serveur', 'service', 'serviable', 'servant', 'servante', 'serviette'],
            ['trancher', 'tranche', 'transit', 'transporter', 'tranquille', 'transparent'],
            ['garçon', 'garage', 'garantie', 'garder', 'gare', 'gardien'],
            ['poupée', 'poulain', 'poulet', 'poumon', 'poupe', 'pouce'],
            ['cheval', 'chemin', 'chemise', 'chercher', 'cheveu', 'chèvre'],
            ['classe', 'clair', 'clairière', 'clameur', 'clapier', 'claquer'],
            ['montagne', 'monde', 'monnaie', 'montage', 'montre', 'monument']
        ]
    };
    const LEVELS = {
        1: { label: '😊 Facile', desc: 'les mots ont tous une 1re lettre différente', color: '#2FBF71' },
        2: { label: '😐 Moyen', desc: 'les mots ont la même 1re lettre', color: '#F2994A' },
        3: { label: '😤 Difficile', desc: 'les mots ont les mêmes 3 premières lettres', color: '#EB5757' }
    };
    const SAMPLES = {
        animaux: 'lion\nchat\nzèbre\nhibou\nmouton\nabeille',
        ecole: 'cahier\ncartable\ncrayon\ncolle\ncompas\ncrayonné',
        prenoms: 'Léa\nLucas\nLina\nLouis\nLéo\nLola'
    };

    const LESSONS = [
        { id: 'alphabet', label: '🔤 L\'alphabet',        color: '#6C4FD8' },
        { id: 'regle1',   label: '1️⃣ La 1re lettre',      color: '#2FBF71' },
        { id: 'regle2',   label: '2️⃣ Même 1re lettre',     color: '#F2994A' },
        { id: 'dico',     label: '📖 Le dictionnaire',     color: '#3949AB' }
    ];

    // =====================================================================
    // COMPARAISON DES MOTS
    // =====================================================================
    // Suite des lettres « de base » (sans accent, sans tiret) avec leur position dans le mot
    function baseSeq(w) {
        const out = [];
        Array.from(String(w)).forEach((ch, i) => {
            let b = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
            if (b === 'œ') b = 'oe';
            if (b === 'æ') b = 'ae';
            for (const c of b) if (/[a-z]/.test(c)) out.push({ c, i });
        });
        return out;
    }
    // { k : rang de la 1re lettre différente, d : -1 si a avant b, 1 si après, 0 si pareil, prefix : un mot est le début de l'autre }
    function cmpWords(a, b) {
        const A = baseSeq(a), B = baseSeq(b), n = Math.min(A.length, B.length);
        for (let k = 0; k < n; k++) if (A[k].c !== B[k].c) return { k, d: A[k].c < B[k].c ? -1 : 1, A, B };
        return { k: n, d: A.length === B.length ? 0 : (A.length < B.length ? -1 : 1), prefix: A.length !== B.length, A, B };
    }
    function sortWords(words) {
        return words.slice().sort((x, y) => cmpWords(x, y).d || x.localeCompare(y, 'fr'));
    }
    // Mot avec la lettre « décisive » mise en couleur (k = rang de la lettre)
    function decWord(w, k) {
        const seq = baseSeq(w);
        const idx = seq[k] ? seq[k].i : -1;
        return Array.from(w).map((ch, i) => i === idx ? `<b class="dec">${esc(ch)}</b>` : esc(ch)).join('');
    }
    // Liste triée, chaque mot avec la lettre qui le départage de son voisin
    function sortedRowHtml(words) {
        const s = sortWords(words);
        return `<div class="a2-row-words">` + s.map((w, i) => {
            const k = i > 0 ? cmpWords(s[i - 1], w).k : (s.length > 1 ? cmpWords(w, s[1]).k : 0);
            return (i ? '<span class="a2-arrow">➜</span>' : '') + `<span class="a2-w">${decWord(w, k)}</span>`;
        }).join('') + `</div>`;
    }

    // ── Utilitaires ───────────────────────────────────────────────────────
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function rr(items, n) { const out = []; while (out.length < n) out.push(...shuffle(items)); return out.slice(0, n); }
    const ord = n => n === 1 ? '1re' : n + 'e';
    function parseMine(text) {
        const seen = new Set(), out = [];
        String(text || '').split(/[\n,;]+/).map(w => w.trim().replace(/\s+/g, ' ')).filter(w => baseSeq(w).length).forEach(w => {
            const k = w.toLowerCase();
            if (seen.has(k)) return;
            seen.add(k); out.push(w);
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
        pop:  () => tone(880, 0, 0.06, 'sine', 0.05),
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'alphabet', letter: 'M', cmpA: 'lapin', cmpB: 'lampe',
            ex: { type: 'ranger', mode: 'auto', level: 1, list: 'random', n: 6, mine: '',
                  nq: 8, lk: ['apres', 'avant', 'entre'], lcase: 'maj', nd: 6, dlevel: 2 },
            font: 30, sound: true, settingsOpen: true, showAbc: false,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createMotsAlphaWidget = function (saved) {
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
        container.className = 'a2-container';
        container.innerHTML = `
            <div class="a2-header">
                <span class="a2-title">🔤 L'ordre alphabétique</span>
                <div class="a2-tabs">
                    <button class="a2-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="a2-tab-lbl">Leçons</span></button>
                    <button class="a2-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="a2-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="a2-icon-btn" data-act="sound" title="Son"></button>
                    <button class="a2-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="a2-body"></div>
            <div class="a2-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — L'alphabet (touche une lettre pour voir sa place, la lettre d'avant et celle d'après), puis comment ranger des mots : regarder la 1re lettre, puis la 2e, la 3e… Un <b>comparateur</b> explique lettre par lettre quel mot vient en premier. La dernière leçon montre comment chercher dans le <b>dictionnaire</b>.</p>
                <p><b>✏️ Exercices</b> — Trois types :</p>
                <p>🔀 <b>Ranger des mots</b> : glisse les étiquettes dans les cases numérotées. Au stylet ou au doigt, on peut aussi <b>toucher une étiquette puis toucher une case</b>. Mots proposés (3 niveaux, 20 listes par niveau) ou choisis par toi.</p>
                <p>🔤 <b>Lettre avant / après</b> : retrouver la lettre qui vient juste avant, juste après ou entre deux lettres.</p>
                <p>📖 <b>Le dictionnaire</b> : avec les deux mots repères de la page, dire si le mot est avant, sur la page ou après.</p>
                <p><b>👁 Correction</b> colorie les réponses et donne un score. <b>🔤 Alphabet</b> affiche l'alphabet en aide.</p>
            </div>
            <div class="a2-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.a2-body');
        const help = container.querySelector('.a2-help');
        const resizeHandle = container.querySelector('.a2-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let msg = '', sel = null;          // sel : étiquette touchée (placement au toucher)
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // ── Génération d'un exercice ──
        function genRun() {
            const ex = S.ex;
            if (ex.type === 'ranger') {
                let words, label;
                if (ex.mode === 'mine') {
                    words = parseMine(ex.mine).slice(0, 12);
                    if (words.length < 2) return 'Écris au moins 2 mots (un par ligne).';
                    label = 'Mes mots';
                } else {
                    const lists = BANK[ex.level];
                    const li = ex.list === 'random' ? Math.floor(Math.random() * lists.length) : Math.max(0, Math.min(lists.length - 1, +ex.list));
                    words = shuffle(lists[li]).slice(0, ex.n);
                    label = `${LEVELS[ex.level].label} · Liste ${li + 1}`;
                }
                S.run = { type: 'ranger', words: shuffle(words), slots: words.map(() => null), corrected: false, label };
            } else if (ex.type === 'lettres') {
                const kinds = ['apres', 'avant', 'entre'].filter(k => ex.lk.includes(k));
                if (!kinds.length) return 'Choisis au moins un type de question (après, avant, entre).';
                const plan = rr(kinds, ex.nq), qs = [], seen = new Set();
                plan.forEach(k => {
                    let i, key, tries = 0;
                    do {
                        i = k === 'apres' ? Math.floor(Math.random() * 25) : k === 'avant' ? 1 + Math.floor(Math.random() * 25) : 1 + Math.floor(Math.random() * 24);
                        key = k + i; tries++;
                    } while (seen.has(key) && tries < 20);
                    seen.add(key);
                    if (k === 'apres') qs.push({ k, a: ABC[i], ans: ABC[i + 1] });
                    else if (k === 'avant') qs.push({ k, a: ABC[i], ans: ABC[i - 1] });
                    else qs.push({ k, a: ABC[i - 1], b: ABC[i + 1], ans: ABC[i] });
                });
                S.run = { type: 'lettres', qs, ans: [], corrected: false };
            } else {
                const pool = ex.dlevel === 'mix' ? BANK[2].concat(BANK[3]) : BANK[ex.dlevel];
                const lists = shuffle(pool).slice(0, ex.nd);
                const plan = rr(['avant', 'page', 'apres'], ex.nd);
                const qs = lists.map((l, i) => {
                    const s = sortWords(l), r = plan[i];
                    const w = r === 'avant' ? s[0] : r === 'apres' ? s[5] : s[2 + Math.floor(Math.random() * 2)];
                    return { g1: s[1], g2: s[4], w, ans: r };
                });
                S.run = { type: 'dico', qs, ans: [], corrected: false };
            }
            sel = null;
            return '';
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function cmpToolHtml() {
            const a = S.cmpA.trim(), b = S.cmpB.trim();
            if (!baseSeq(a).length || !baseSeq(b).length) return `<div class="a2-cmp-txt">Écris deux mots pour les comparer.</div>`;
            const r = cmpWords(a, b);
            const n = Math.max(r.A.length, r.B.length);
            const cells = seq => {
                let h = '';
                for (let k = 0; k < n; k++) {
                    const c = seq[k];
                    const cls = !c ? 'empty' : (k < r.k ? 'same' : (k === r.k && !r.prefix ? 'diff' : ''));
                    h += `<div class="a2-cmp-cell ${cls}">${c ? esc(c.c) : ''}</div>`;
                }
                return h;
            };
            const grid = `<div class="a2-cmp-grid" style="grid-template-columns:repeat(${n}, 34px)">${cells(r.A)}${cells(r.B)}</div>`;
            const first = r.d <= 0 ? a : b, second = r.d <= 0 ? b : a;
            let txt;
            if (r.d === 0) txt = `Ces deux mots s'écrivent avec les mêmes lettres : ils se rangent au même endroit.`;
            else if (r.prefix) txt = `Toutes les lettres de « <b>${esc(first)}</b> » sont aussi au début de « ${esc(second)} ». Le mot le plus court vient <b>en premier</b> : <b>${esc(first)}</b> ➜ ${esc(second)}.`;
            else {
                const ca = r.A[r.k].c, cb = r.B[r.k].c;
                const same = r.k ? `Les ${r.k > 1 ? r.k + ' premières lettres sont les mêmes' : 'premières lettres sont les mêmes'} (${r.A.slice(0, r.k).map(x => x.c).join(', ')}). ` : '';
                txt = `${same}À la <b>${ord(r.k + 1)} lettre</b> : <b class="dec">${ca}</b> ou <b class="dec">${cb}</b> ? Dans l'alphabet, <b>${ca < cb ? ca : cb}</b> vient avant <b>${ca < cb ? cb : ca}</b>, donc <b>${esc(first)}</b> vient avant ${esc(second)}.`;
            }
            return grid + `<div class="a2-cmp-txt">${txt}</div>`;
        }
        function letterInfoHtml() {
            const L = S.letter, i = ABC.indexOf(L);
            if (i < 0) return 'Touche une lettre.';
            return `<span class="big">${L}</span> est la <b>${ord(i + 1)}</b> lettre de l'alphabet, c'est une <b>${VOY.includes(L) ? 'voyelle' : 'consonne'}</b>.
                ${i > 0 ? `Juste avant : <span class="big">${ABC[i - 1]}</span>` : `C'est la toute première lettre !`}
                ${i < 25 ? ` · juste après : <span class="big">${ABC[i + 1]}</span>` : ` · c'est la dernière lettre !`}`;
        }
        function renderAlphabet() {
            const i = ABC.indexOf(S.letter);
            const tiles = Array.from(ABC).map((L, k) =>
                `<button class="a2-letter ${VOY.includes(L) ? 'voy' : ''} ${k === i ? 'sel' : ''} ${Math.abs(k - i) === 1 ? 'nb' : ''}" data-act="letter" data-v="${L}"><span class="L">${L}</span><span class="n">${k + 1}</span></button>`).join('');
            return `<div class="a2-ltitle"><h2 style="color:#6C4FD8">🔤 L'alphabet</h2></div>
                <div class="a2-box a2-how"><b class="t">🔤 26 lettres, toujours dans le même ordre</b>L'alphabet français a <b>26 lettres</b> : <b>6 voyelles</b> (a, e, i, o, u, y) et <b>20 consonnes</b>. L'<b>ordre alphabétique</b>, c'est ranger des lettres ou des mots dans l'ordre de l'alphabet, de A à Z.</div>
                <div class="a2-legend"><span style="--c:#ffecee;--b:#f6a7b0">voyelle</span><span style="--c:#fff;--b:#d9cdb6">consonne</span><span style="--c:#e2f7ec;--b:#2FBF71">lettre juste avant / juste après</span></div>
                <div class="a2-letters">${tiles}</div>
                <div class="a2-letter-info">${letterInfoHtml()}</div>
                <div class="a2-box a2-memo"><b class="t">🧠 Pour retenir</b>Pour retrouver une lettre, je récite l'alphabet dans ma tête. Des lettres repères aident : <b>A</b> (1re), <b>M</b> (13e, le milieu), <b>Z</b> (26e, la dernière).</div>
                <div class="a2-box a2-trap"><b class="t">⚠️ Attention au piège</b>Les <b>accents</b> ne changent pas l'ordre : é, è, ê se rangent comme <b>e</b>, ç comme <b>c</b>. Majuscule ou minuscule, c'est la même lettre.</div>
                <div><button class="a2-btn go" data-act="practice" data-v="lettres">✏️ S'entraîner : lettre avant / après</button></div>`;
        }
        function renderRegle1() {
            return `<div class="a2-ltitle"><h2 style="color:#2FBF71">1️⃣ Regarder la 1re lettre</h2></div>
                <div class="a2-box a2-how"><b class="t">🔧 Comment faire ?</b>Pour ranger des mots dans l'ordre alphabétique, je regarde leur <b>1re lettre</b>. Le mot dont la 1re lettre vient en premier dans l'alphabet se place en premier.</div>
                <div class="a2-ex-cards">
                    <div class="a2-excard" style="--c:#2FBF71"><div class="a2-excard-h">Mots en désordre : chat · arbre · éléphant · banane</div>${sortedRowHtml(['chat', 'arbre', 'éléphant', 'banane'])}</div>
                    <div class="a2-excard" style="--c:#2FBF71"><div class="a2-excard-h">Mots en désordre : tigre · lion · ours · zèbre · girafe</div>${sortedRowHtml(['tigre', 'lion', 'ours', 'zèbre', 'girafe'])}</div>
                </div>
                <div class="a2-box a2-memo"><b class="t">🧠 Pour retenir</b>La lettre <b style="color:var(--dec)">en couleur</b> est celle qui décide. A comme <b>a</b>rbre se range avant B comme <b>b</b>anane, parce que A vient avant B dans l'alphabet.</div>
                <div class="a2-box a2-trap"><b class="t">⚠️ Attention au piège</b>« <b>é</b>léphant » se range avec les mots en <b>e</b> : l'accent ne compte pas.</div>
                <div><button class="a2-btn go" data-act="practice" data-v="1">✏️ S'entraîner : niveau facile</button></div>`;
        }
        function renderRegle2() {
            return `<div class="a2-ltitle"><h2 style="color:#F2994A">2️⃣ Même 1re lettre ?</h2></div>
                <div class="a2-box a2-how"><b class="t">🔧 Comment faire ?</b>Si deux mots commencent par la <b>même lettre</b>, je regarde la <b>2e lettre</b>. Si elle est aussi la même, je regarde la <b>3e</b>, et ainsi de suite, jusqu'à trouver une lettre différente.</div>
                <div class="a2-ex-cards">
                    <div class="a2-excard" style="--c:#F2994A"><div class="a2-excard-h">On regarde la 2e lettre</div>${sortedRowHtml(['bus', 'balle', 'biche', 'bébé', 'bonbon'])}</div>
                    <div class="a2-excard" style="--c:#F2994A"><div class="a2-excard-h">On regarde la 3e lettre</div>${sortedRowHtml(['tapis', 'table', 'tasse', 'tambour'])}</div>
                    <div class="a2-excard" style="--c:#F2994A"><div class="a2-excard-h">On regarde la 4e lettre</div>${sortedRowHtml(['chemin', 'cheval', 'chemise', 'cheveu'])}</div>
                </div>
                <div class="a2-box a2-memo"><b class="t">🧠 Pour retenir</b>Je compare les mots <b>lettre par lettre</b>, comme une course : c'est la <b>première lettre différente</b> qui décide.</div>
                <div class="a2-box a2-trap"><b class="t">⚠️ Attention au piège</b>Quand un mot court est le début d'un mot plus long, le mot court vient <b>en premier</b> : mer ➜ merle ➜ merlu ; chat ➜ château.</div>
                <div class="a2-box a2-tool"><b class="t">🔍 Le comparateur</b>Écris deux mots : je t'explique lequel vient en premier.
                    <div class="a2-cmp-bar">
                        <input class="a2-cmp-in" data-k="cmpA" value="${esc(S.cmpA)}" autocomplete="off" spellcheck="false" autocapitalize="off">
                        <b>et</b>
                        <input class="a2-cmp-in" data-k="cmpB" value="${esc(S.cmpB)}" autocomplete="off" spellcheck="false" autocapitalize="off">
                    </div>
                    <div class="a2-cmp-res">${cmpToolHtml()}</div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="a2-btn go" data-act="practice" data-v="2">✏️ S'entraîner : niveau moyen</button><button class="a2-btn go" data-act="practice" data-v="3">✏️ S'entraîner : niveau difficile</button></div>`;
        }
        function renderDicoLesson() {
            return `<div class="a2-ltitle"><h2 style="color:#3949AB">📖 Le dictionnaire</h2></div>
                <div class="a2-box a2-how"><b class="t">🔧 Comment est-il rangé ?</b>Dans le dictionnaire, les mots sont rangés dans l'<b>ordre alphabétique</b>. En haut de chaque page, deux <b>mots repères</b> indiquent le <b>premier</b> et le <b>dernier</b> mot de la page.</div>
                <div class="a2-page"><div class="a2-page-h"><span>lapin</span><span>lune</span></div>
                    <div class="a2-page-l">lapin · lard · large · larme · lavabo · lettre · lion · lire · loup · lune</div></div>
                <div class="a2-box a2-how"><b class="t">🔎 Le mot « loup » est-il sur cette page ?</b>« loup » vient <b>après</b> « lapin » (a avant o) et <b>avant</b> « lune » (o avant u) : il est <b>entre les deux mots repères</b>, donc il est sur la page. « lac » vient avant « lapin » : il faut revenir en arrière. « mouton » vient après « lune » : il faut avancer.</div>
                <div class="a2-box a2-how"><b class="t">📚 Où ouvrir le dictionnaire ?</b>Pour aller plus vite, je pense aux trois parties du dictionnaire :
                    <div class="a2-parts" style="margin-top:6px">
                        <div class="a2-part" style="background:#2FBF71">Au début<small>de A à F</small></div>
                        <div class="a2-part" style="background:#F2994A">Au milieu<small>de G à P</small></div>
                        <div class="a2-part" style="background:#3949AB">À la fin<small>de Q à Z</small></div>
                    </div></div>
                <div class="a2-box a2-memo"><b class="t">🧠 Pour retenir</b>Mon mot vient <b>avant</b> le 1er mot repère ➜ je reviens en arrière. Il vient <b>après</b> le 2e mot repère ➜ j'avance. Il est <b>entre les deux</b> ➜ il est sur la page !</div>
                <div class="a2-box a2-trap"><b class="t">⚠️ Attention au piège</b>Je cherche les verbes à l'<b>infinitif</b> (« mangeait » ➜ manger) et les noms ou adjectifs au <b>masculin singulier</b> (« belles » ➜ beau, « chevaux » ➜ cheval).</div>
                <div><button class="a2-btn go" data-act="practice" data-v="dico">✏️ S'entraîner : le dictionnaire</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="a2-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = S.lesson === 'regle1' ? renderRegle1() : S.lesson === 'regle2' ? renderRegle2() : S.lesson === 'dico' ? renderDicoLesson() : renderAlphabet();
            return `<div class="a2-lesson"><div class="a2-side">${side}</div><div class="a2-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="a2-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="a2-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="a2-settings">`;
            h += `<div class="a2-srow"><span class="l">1. Exercice</span>${ch('type', 'ranger', ex.type === 'ranger', '🔀 Ranger des mots')}${ch('type', 'lettres', ex.type === 'lettres', '🔤 Lettre avant / après')}${ch('type', 'dico', ex.type === 'dico', '📖 Le dictionnaire')}</div>`;
            if (ex.type === 'ranger') {
                h += `<div class="a2-srow"><span class="l">2. Mots</span>${ch('mode', 'auto', ex.mode === 'auto', '🎲 Proposés')}${ch('mode', 'mine', ex.mode === 'mine', '✍️ Choisis par moi')}</div>`;
                if (ex.mode === 'auto') {
                    h += `<div class="a2-srow"><span class="l">Niveau</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}<span class="a2-hint">${LEVELS[ex.level].desc}</span></div>`;
                    h += `<div class="a2-srow"><span class="l">Nombre de mots</span>${[4, 5, 6].map(n => ch('n', n, ex.n === n, String(n))).join('')}
                        <span class="l" style="min-width:0;margin-left:14px">Liste</span>
                        <select class="a2-select a2-list"><option value="random"${ex.list === 'random' ? ' selected' : ''}>🎲 Au hasard</option>${BANK[ex.level].map((_, i) => `<option value="${i}"${String(ex.list) === String(i) ? ' selected' : ''}>Liste ${i + 1}</option>`).join('')}</select></div>`;
                } else {
                    const n = parseMine(ex.mine).length;
                    h += `<div class="a2-srow a2-mine-row">
                        <textarea class="a2-mine" placeholder="Un mot par ligne (ou séparés par des virgules), 12 mots au plus…" spellcheck="false" autocapitalize="off">${esc(ex.mine)}</textarea>
                        <div class="a2-mine-side">
                            <div class="btns">
                                <button class="a2-btn alt small" data-act="sample" data-v="animaux">Exemple : animaux</button>
                                <button class="a2-btn alt small" data-act="sample" data-v="ecole">Exemple : école</button>
                                <button class="a2-btn alt small" data-act="sample" data-v="prenoms">Exemple : prénoms</button>
                            </div>
                            <div class="a2-hint a2-mine-count">${n} mot${n > 1 ? 's' : ''}${n > 12 ? ' (seuls les 12 premiers seront utilisés)' : ''}</div>
                        </div></div>`;
                }
            } else if (ex.type === 'lettres') {
                h += `<div class="a2-srow"><span class="l">2. Questions</span>${ch('lk', 'apres', ex.lk.includes('apres'), 'juste après')}${ch('lk', 'avant', ex.lk.includes('avant'), 'juste avant')}${ch('lk', 'entre', ex.lk.includes('entre'), 'entre deux lettres')}</div>`;
                h += `<div class="a2-srow"><span class="l">Nombre</span>${[4, 8, 12, 16].map(n => ch('nq', n, ex.nq === n, String(n))).join('')}
                    <span class="l" style="min-width:0;margin-left:14px">Lettres</span>${ch('lcase', 'maj', ex.lcase === 'maj', 'MAJUSCULES')}${ch('lcase', 'min', ex.lcase === 'min', 'minuscules')}</div>`;
            } else {
                h += `<div class="a2-srow"><span class="l">2. Mots repères</span>${ch('dlevel', 2, ex.dlevel === 2, '😐 Même 1re lettre', LEVELS[2].color)}${ch('dlevel', 3, ex.dlevel === 3, '😤 Mêmes 3 premières lettres', LEVELS[3].color)}${ch('dlevel', 'mix', ex.dlevel === 'mix', '🎲 Mélangé')}</div>`;
                h += `<div class="a2-srow"><span class="l">Nombre</span>${[3, 6, 9].map(n => ch('nd', n, ex.nd === n, String(n))).join('')}</div>`;
            }
            h += `<div class="a2-srow"><span class="l">Taille du texte</span><button class="a2-btn alt small" data-act="font" data-d="-2">A−</button><button class="a2-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="a2-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="a2-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="a2-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        function scoreOf(R) {
            if (R.type === 'ranger') {
                const sol = sortWords(R.words);
                return { ok: R.slots.filter((wi, s) => wi !== null && R.words[wi].toLowerCase() === sol[s].toLowerCase()).length, n: R.words.length };
            }
            if (R.type === 'lettres') return { ok: R.qs.filter((q, i) => (R.ans[i] || '').trim().toUpperCase() === q.ans).length, n: R.qs.length };
            return { ok: R.qs.filter((q, i) => R.ans[i] === q.ans).length, n: R.qs.length };
        }
        function renderRanger(R) {
            const sol = sortWords(R.words), N = R.words.length;
            const card = wi => `<div class="a2-card ${sel === wi ? 'sel' : ''} ${R.corrected ? 'locked' : ''}" data-w="${wi}">${esc(R.words[wi])}</div>`;
            const pool = R.words.map((_, wi) => wi).filter(wi => !R.slots.includes(wi));
            const cols = N <= 6 ? N : Math.ceil(N / 2);
            let h = `<div class="a2-consigne">${R.corrected ? '' : 'Glisse les mots dans les cases, du 1er au dernier dans l\'ordre alphabétique (ou touche un mot, puis une case).'}</div>`;
            if (!R.corrected || pool.length) h += `<div class="a2-pool" data-act="pool">${pool.map(card).join('') || '<span class="a2-hint">Tous les mots sont placés.</span>'}</div>`;
            h += `<div class="a2-slots" style="grid-template-columns:repeat(${cols}, minmax(0,1fr))">` + R.slots.map((wi, s) => {
                let cls = '';
                if (R.corrected) cls = (wi !== null && R.words[wi].toLowerCase() === sol[s].toLowerCase()) ? 'ok' : 'ko';
                else if (sel !== null) cls = 'target';
                return `<div class="a2-slot ${cls}" data-act="slot" data-s="${s}"><span class="a2-slot-n">${s + 1}</span>${wi !== null ? card(wi) : ''}</div>`;
            }).join('') + `</div>`;
            if (R.corrected) h += `<div class="a2-sol"><b>✅ L'ordre alphabétique</b> <span class="a2-hint">(en couleur : la lettre qui décide)</span>${sortedRowHtml(R.words)}</div>`;
            return h;
        }
        function renderLettres(R) {
            const cs = s => S.ex.lcase === 'min' ? s.toLowerCase() : s;
            return `<div class="a2-grid">` + R.qs.map((q, i) => {
                const val = R.ans[i] || '';
                let cls = '', sol = '', mark = '';
                if (R.corrected) {
                    const ok = val.trim().toUpperCase() === q.ans;
                    cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌';
                    if (!ok) sol = `<div class="a2-solq">→ ${cs(q.ans)}</div>`;
                }
                const inp = `<input class="a2-in ${cls}" data-i="${i}" value="${esc(val)}" maxlength="2" autocomplete="off" spellcheck="false" autocapitalize="off" ${R.corrected ? 'disabled' : ''}>`;
                const L = x => `<span class="a2-bigL">${cs(x)}</span>`;
                const title = q.k === 'apres' ? 'La lettre juste après' : q.k === 'avant' ? 'La lettre juste avant' : 'La lettre entre';
                const line = q.k === 'apres' ? `${L(q.a)}<span class="a2-arrow">➜</span>${inp}` : q.k === 'avant' ? `${inp}<span class="a2-arrow">➜</span>${L(q.a)}` : `${L(q.a)}${inp}${L(q.b)}`;
                return `<div class="a2-q ${cls}"><div class="a2-qtop"><span class="a2-num">${i + 1})</span>${title}<span style="margin-left:auto">${mark}</span></div><div class="a2-line">${line}</div>${sol}</div>`;
            }).join('') + `</div>`;
        }
        function renderDico(R) {
            const CH = [['avant', '⬅ Avant'], ['page', '📖 Sur la page'], ['apres', 'Après ➡']];
            return `<div class="a2-grid dico">` + R.qs.map((q, i) => {
                const a = R.ans[i];
                let cls = '', mark = '';
                if (R.corrected) { cls = a === q.ans ? 'ok' : 'ko'; mark = a === q.ans ? '✅' : '❌'; }
                const btns = CH.map(([v, lbl]) => {
                    let c = a === v ? 'on' : '';
                    if (R.corrected) c = v === q.ans ? 'good' : (a === v ? 'bad' : '');
                    return `<button class="a2-choice ${c}" data-act="dico" data-i="${i}" data-v="${v}">${lbl}</button>`;
                }).join('');
                return `<div class="a2-q ${cls}"><div class="a2-qtop"><span class="a2-num">${i + 1})</span>Mots repères de la page<span style="margin-left:auto">${mark}</span></div>
                    <div class="a2-dpage"><span>${esc(q.g1)}</span><span>…</span><span>${esc(q.g2)}</span></div>
                    <div class="a2-dword">${esc(q.w)}</div><div class="a2-choices">${btns}</div></div>`;
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            const title = R.type === 'ranger' ? `🔀 Ranger ${R.words.length} mots · ${esc(R.label)}` : R.type === 'lettres' ? `🔤 ${R.qs.length} lettres à trouver` : `📖 ${R.qs.length} mots à chercher`;
            const missing = R.type === 'ranger' && R.corrected && R.slots.includes(null);
            let h = `<div class="a2-topbar"><span class="a2-pill">${title}</span>
                ${sc ? `<span class="a2-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}
                ${missing ? '<span class="a2-pill warn">⚠️ Des cases sont vides</span>' : ''}</div>
            <div class="a2-actions">
                <button class="a2-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="a2-btn alt ${S.showAbc ? 'on' : ''}" data-act="abc">🔤 Alphabet</button>
                <button class="a2-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="a2-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            if (S.showAbc) h += `<div class="a2-abc">${Array.from(ABC).map(L => `<span class="${VOY.includes(L) ? 'voy' : ''}">${S.ex.lcase === 'min' && R.type === 'lettres' ? L.toLowerCase() : L}</span>`).join('')}</div>`;
            h += R.type === 'ranger' ? renderRanger(R) : R.type === 'lettres' ? renderLettres(R) : renderDico(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="a2-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!S.settingsOpen || !msg) h += `<div class="a2-info">Choisis l'exercice et ses réglages, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.a2-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
                c.className = 'a2-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Placement des étiquettes (exercice « Ranger ») ──
        function placeWord(wi, s) {
            const R = S.run, from = R.slots.indexOf(wi), existing = R.slots[s];
            R.slots[s] = wi;
            if (from >= 0 && from !== s) R.slots[from] = existing;   // échange
        }
        function toPool(wi) {
            const from = S.run.slots.indexOf(wi);
            if (from >= 0) S.run.slots[from] = null;
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
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🔤 L\'ordre alphabétique', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'letter': S.letter = el.dataset.v; sfx('pop'); break;
                case 'practice': {
                    const v = el.dataset.v;
                    if (v === 'lettres' || v === 'dico') ex.type = v;
                    else { ex.type = 'ranger'; ex.mode = 'auto'; ex.level = +v; ex.list = 'random'; }
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                }
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'mode': ex.mode = el.dataset.v; msg = ''; break;
                case 'level': ex.level = +el.dataset.v; ex.list = 'random'; break;
                case 'n': ex.n = +el.dataset.v; break;
                case 'sample': ex.mode = 'mine'; ex.mine = SAMPLES[el.dataset.v] || ''; msg = ''; break;
                case 'lk': toggleIn(ex.lk, el.dataset.v); msg = ''; break;
                case 'nq': ex.nq = +el.dataset.v; break;
                case 'lcase': ex.lcase = el.dataset.v; break;
                case 'dlevel': ex.dlevel = el.dataset.v === 'mix' ? 'mix' : +el.dataset.v; break;
                case 'nd': ex.nd = +el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'abc': S.showAbc = !S.showAbc; break;
                case 'clear':
                    if (!R) return;
                    if (R.type === 'ranger') { R.slots = R.words.map(() => null); R.words = shuffle(R.words); }
                    else R.ans = [];
                    R.corrected = false; sel = null;
                    break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected; sel = null;
                    if (R.corrected) {
                        const sc = scoreOf(R);
                        if (sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'slot':
                    if (!R || R.corrected || sel === null) return;
                    placeWord(sel, +el.dataset.s); sel = null; sfx('pop');
                    break;
                case 'pool':
                    if (!R || R.corrected || sel === null) return;
                    toPool(sel); sel = null;
                    break;
                case 'dico':
                    if (!R || R.corrected) return;
                    R.ans[+el.dataset.i] = el.dataset.v; sfx('pop');
                    break;
                default: return;
            }
            render(); save();
        }

        // ── Glisser-déposer des étiquettes (souris, doigt, stylet) ──
        let drag = null, lastTap = 0;
        function dropTargetAt(x, y) {
            const el = document.elementFromPoint(x, y);
            if (!el || !container.contains(el)) return null;
            return el.closest('.a2-slot') || el.closest('.a2-pool');
        }
        function dMove(e) {
            if (!drag || e.pointerId !== drag.id) return;
            if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
                drag.moved = true;
                drag.card.classList.add('dragging');
                drag.ghost = document.createElement('div');
                drag.ghost.className = 'a2-ghost';
                drag.ghost.textContent = drag.card.textContent;
                drag.ghost.style.fontSize = getComputedStyle(drag.card).fontSize;
                document.body.appendChild(drag.ghost);
            }
            if (!drag.moved) return;
            e.preventDefault();
            drag.ghost.style.left = e.clientX + 'px';
            drag.ghost.style.top = e.clientY + 'px';
            body.querySelectorAll('.a2-slot.drop, .a2-pool.drop').forEach(x => x.classList.remove('drop'));
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
                sel = sel === d.wi ? null : d.wi;          // touche : sélection
            } else {
                const t = dropTargetAt(e.clientX, e.clientY);
                if (t && t.classList.contains('a2-slot')) { placeWord(d.wi, +t.dataset.s); sfx('pop'); }
                else if (t) toPool(d.wi);
                sel = null;
            }
            render(); save();
        }
        body.addEventListener('pointerdown', e => {
            const card = e.target.closest('.a2-card');
            if (!card || !S.run || S.run.corrected || drag) return;
            if (e.button !== undefined && e.button > 0) return;
            e.preventDefault(); e.stopPropagation();
            if (typeof bringToFront === 'function') bringToFront(widget);
            help.classList.remove('show');
            drag = { id: e.pointerId, wi: +card.dataset.w, card, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
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
            if (e.target.closest('.a2-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.a2-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Saisie (sans tout redessiner)
        container.addEventListener('input', e => {
            const t = e.target;
            if (t.classList.contains('a2-in') && S.run) {
                S.run.ans[+t.dataset.i] = t.value; saveSoon();
                if (t.value.trim()) {                              // une lettre tapée → case suivante
                    const ins = Array.from(body.querySelectorAll('.a2-in:not([disabled])'));
                    const next = ins[ins.indexOf(t) + 1];
                    if (next) next.focus();
                }
            } else if (t.classList.contains('a2-mine')) {
                S.ex.mine = t.value;
                const n = parseMine(t.value).length, c = body.querySelector('.a2-mine-count');
                if (c) c.textContent = `${n} mot${n > 1 ? 's' : ''}${n > 12 ? ' (seuls les 12 premiers seront utilisés)' : ''}`;
                saveSoon();
            } else if (t.classList.contains('a2-cmp-in')) {
                S[t.dataset.k] = t.value;
                const r = body.querySelector('.a2-cmp-res'); if (r) r.innerHTML = cmpToolHtml();
                saveSoon();
            }
        });
        container.addEventListener('change', e => {
            if (e.target.classList.contains('a2-list')) { S.ex.list = e.target.value; save(); }
        });
        container.addEventListener('keydown', e => {
            if (e.key !== 'Enter' || !e.target.classList.contains('a2-in')) return;
            e.preventDefault();
            const ins = Array.from(body.querySelectorAll('.a2-in:not([disabled])'));
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
        widget._a2GetData = function () {
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
            if (type === TYPE) return window.createMotsAlphaWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
