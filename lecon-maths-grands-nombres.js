// =========================================================================
// ACTIVITÉ « LIRE, ÉCRIRE ET DÉCOMPOSER LES GRANDS NOMBRES » — Le Bureau du Prof
// Leçons + explorateur avec le tableau de numération + exercices corrigés.
// Inspirée du « Tableau de numération » (couleurs des classes, police MarelleBaton)
// et de « Nombres en chiffres / lettres » (écriture des nombres en lettres).
//
// 📖 Leçons : les classes du tableau, lire un grand nombre, l'écrire en chiffres,
//    le décomposer, « chiffre des… » et « nombre de… ».
// 🔢 Explorer : un nombre dans le tableau, lu en lettres (pas à pas, classe par
//    classe), ses 4 décompositions ; on touche une colonne pour voir le chiffre
//    et le nombre de dizaines, centaines…
// ✏️ Exercices : 🔤 lire (QCM), ✍️ écrire en chiffres, 📋 placer dans le tableau,
//    🧩 décomposer / recomposer, 🎯 chiffre des… / nombre de…
//
// Ouverture : createWidget('nombre-decomp')  ou  createNombreDecompWidget()
// Sauvegarde : w._ndGetData()  /  createNombreDecompWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'nombre-decomp';

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

    // ── CSS (préfixe nd-) ─────────────────────────────────────────────────
    if (!document.getElementById('nd-style')) {
        const s = document.createElement('style');
        s.id = 'nd-style';
        s.textContent = `
.widget[data-type="nombre-decomp"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.nd-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --k3:#7c3aed; --k2:#0891b2; --k1:#059669; --k0:#e07b2a;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.nd-container input { user-select:text; -webkit-user-select:text; }
.nd-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .nd-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .nd-tab-lbl { display:none; }
    .nd-title { font-size:17px !important; }
    .nd-lesson { flex-direction:column; }
    .nd-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .nd-gbtn { flex:1 1 auto; text-align:center !important; }
    .nd-srow > .l { min-width:0 !important; width:100%; }
}
.nd-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.nd-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.nd-tabs { display:flex; gap:6px; margin-left:12px; }
.nd-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.nd-tab:hover { background:rgba(255,255,255,.1); }
.nd-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.nd-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.nd-icon-btn:hover { background:rgba(255,255,255,.28); }
.nd-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Couleurs des classes */
.nd-c3 { color:var(--k3); } .nd-c2 { color:var(--k2); } .nd-c1 { color:var(--k1); } .nd-c0 { color:var(--k0); }
.nd-num { font-family:'MarelleBaton','Nunito',sans-serif; font-weight:700; white-space:nowrap; letter-spacing:.02em; }
.nd-words { font-weight:800; line-height:1.5; }
.nd-words span.cur { background:#fff2b3; border-radius:6px; box-shadow:0 0 0 3px #fff2b3; }

/* ── Tableau de numération ── */
.nd-twrap { overflow-x:auto; display:flex; justify-content:center; padding:2px; }
.nd-table { --cw:54px; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 0 rgba(0,0,0,.06); }
.nd-table th, .nd-table td { text-align:center; padding:0; }
.nd-table .kh { color:#fff; font-weight:900; font-size:calc(var(--cw) * .27); padding:5px 6px; letter-spacing:.3px; white-space:nowrap; }
.nd-table .kh.k3 { background:var(--k3); } .nd-table .kh.k2 { background:var(--k2); } .nd-table .kh.k1 { background:var(--k1); } .nd-table .kh.k0 { background:var(--k0); }
.nd-table .ch { font-weight:900; font-size:calc(var(--cw) * .3); padding:3px 0; width:var(--cw); }
.nd-table .ch.k3, .nd-table td.k3 { background:#f3edff; color:var(--k3); }
.nd-table .ch.k2, .nd-table td.k2 { background:#e6f7fb; color:var(--k2); }
.nd-table .ch.k1, .nd-table td.k1 { background:#e7f7f1; color:var(--k1); }
.nd-table .ch.k0, .nd-table td.k0 { background:#fdf0e5; color:var(--k0); }
.nd-table td { height:calc(var(--cw) * 1.15); font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .78); font-weight:700; color:var(--encre) !important;
    border-top:2px solid rgba(0,0,0,.06); }
.nd-table .sep { border-left:3px solid var(--encre); }
.nd-table .dim { opacity:.28; }
.nd-table .hlk { box-shadow:inset 0 0 0 3px #ffc933; background:#fff8d8 !important; }
.nd-table .hlc { box-shadow:inset 0 0 0 4px #ff4f5e; background:#ffe9eb !important; }
.nd-table td.click:hover { filter:brightness(.95); }
.nd-table td.ed { padding:3px; }
.nd-table td input { width:100%; height:100%; box-sizing:border-box; border:2px dashed #c7bca6; border-radius:8px; background:#fff; text-align:center;
    font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--cw) * .7); font-weight:700; color:#3949AB; outline:none; padding:0; }
.nd-table td input:focus { border:3px solid var(--violet); background:#f3efff; }
.nd-table td input.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.nd-table td input.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.nd-table.small { --cw:38px; }

/* ── Leçons ── */
.nd-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.nd-side { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.nd-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.nd-gbtn:hover { transform:translateX(2px); }
.nd-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.nd-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.nd-ltitle h2 { margin:0; font-size:32px; font-weight:900; }
.nd-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.55; }
.nd-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.nd-box ul, .nd-box ol { margin:4px 0 0; padding-left:22px; }
.nd-what { background:#f1edff; border:2px solid #c8bbf5; }
.nd-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.nd-memo { background:#fff6d6; border:2px solid #f3d36b; }
.nd-trap { background:#ffecee; border:2px solid #f6a7b0; }
.nd-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.nd-big { font-size:22px; }
.nd-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.nd-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.nd-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.nd-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.nd-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.nd-btn:disabled { opacity:.45; }
.nd-steps { display:flex; flex-direction:column; gap:6px; }
.nd-step { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:6px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.nd-step > span:last-child { flex:1; min-width:0; }
.nd-step .n { background:var(--encre); color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:900; flex-shrink:0; }

/* ── Explorer ── */
.nd-ex { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.nd-bar { display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
.nd-in { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:26px; font-weight:700; padding:4px 12px; width:260px; max-width:100%; box-sizing:border-box;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; text-align:center; }
.nd-in:focus { border-color:var(--violet); }
.nd-panel { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 14px; }
.nd-panel h4 { margin:0 0 6px; font-size:15px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.nd-read { font-size:24px; text-align:center; }
.nd-dec { display:flex; flex-direction:column; gap:4px; font-size:19px; }
.nd-dec .row { display:flex; flex-direction:column; gap:0; padding:3px 0; border-bottom:1px dashed #eee4d2; }
.nd-dec .row:last-child { border-bottom:none; }
.nd-dec .nd-num { white-space:normal; line-height:1.45; }
.nd-dec .lbl { font-size:12px; font-weight:900; color:#9a8f7a; text-transform:uppercase; }
.nd-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:8px 14px; font-weight:700; text-align:center; font-size:17px; }
.nd-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.nd-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.nd-hint { font-size:12.5px; color:#6a6380; }

/* ── Exercices ── */
.nd-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.nd-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.nd-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.nd-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.nd-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.nd-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.nd-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.nd-pill.score { background:var(--vert); font-size:16px; }
.nd-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.nd-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 400px)),1fr)); }
.nd-grid.one { grid-template-columns:1fr; }
.nd-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .3); min-width:0; }
.nd-q.ok { border-color:var(--vert); background:#f3fcf7; }
.nd-q.ko { border-color:var(--rouge); background:#fff5f6; }
.nd-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.nd-n { font-weight:900; color:#9a8f7a; }
.nd-qmain { text-align:center; font-size:var(--f); }
.nd-qwords { text-align:center; font-size:calc(var(--f) * .72); font-weight:800; line-height:1.4; }
.nd-ans { font:inherit; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .9); font-weight:700; padding:2px 10px; width:100%; max-width:340px; box-sizing:border-box;
    border:2px dashed #b9abef; border-radius:12px; outline:none; color:#3949AB; background:#fff; text-align:center; align-self:center; }
.nd-ans.mini { width:auto; max-width:none; font-size:calc(var(--f) * .72); padding:0 6px; border-radius:8px; vertical-align:baseline; }
.nd-ans:focus { border:3px solid var(--violet); background:#f3efff; }
.nd-ans.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.nd-ans.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.nd-decq .nd-num, .nd-decq.nd-num { white-space:normal; }
.nd-decq { text-align:center; font-size:calc(var(--f) * .72); line-height:1.9; }
.nd-choices { display:flex; flex-direction:column; gap:6px; }
.nd-choice { border:2px solid #d9cdb6; background:#fff; border-radius:12px; padding:6px 12px; font:inherit; font-weight:800; font-size:calc(var(--f) * .55);
    color:var(--encre); touch-action:manipulation; text-align:left; line-height:1.35; }
.nd-choice.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.nd-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.nd-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.nd-why { font-size:14px; color:#5a5470; text-align:center; line-height:1.45; }
.nd-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:nd-fall 1.6s ease-in forwards; }
@keyframes nd-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.nd-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.nd-help.show { display:block; }
.nd-help h4 { margin:0 0 6px; font-size:15px; }
.nd-help p { margin:0 0 6px; }
.nd-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.nd-container:hover .nd-resize { opacity:1; }
.nd-container.wf-fullboard .nd-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="nombre-decomp"], .nd-container, .nd-container * { cursor:default !important; }
.nd-container .nd-header { cursor:grab !important; }
.nd-container .nd-header:active { cursor:grabbing !important; }
.nd-container button, .nd-container [data-act] { cursor:pointer !important; }
.nd-container button:disabled { cursor:default !important; }
.nd-container input { cursor:text !important; }
.nd-container .nd-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // OUTILS : nombres
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const SP = ' ';   // espace insécable entre les classes
    // Les nombres sont gardés en texte (jusqu'à 12 chiffres) pour éviter les arrondis
    const clean = s => String(s || '').replace(/[\s  .]/g, '').replace(/^0+(?=\d)/, '');
    const fmt = s => { s = clean(s); return s.replace(/\B(?=(\d{3})+(?!\d))/g, SP); };
    const dAt = (s, p) => { const i = s.length - 1 - p; return i >= 0 ? +s[i] : null; };
    const val = s => +clean(s);
    const pow10 = p => '1' + '0'.repeat(p);

    const KNAME = ['unités', 'mille', 'millions', 'milliards'];
    const KLBL = ['classe des unités', 'classe des mille', 'classe des millions', 'classe des milliards'];
    const RANK_N = ['unités', 'dizaines', 'centaines'];
    const RANK_S = ['unité', 'dizaine', 'centaine'];
    const KSUF = ['', ' de mille', ' de millions', ' de milliards'];
    const posName = (p, sing) => (sing ? RANK_S : RANK_N)[p % 3] + KSUF[Math.floor(p / 3)];
    // « nombre de dizaines », « nombre d'unités de mille »
    const deName = p => (/^u/.test(posName(p)) ? 'd\'' : 'de ') + posName(p);
    const posShort = p => ['u', 'd', 'c'][p % 3];
    // Découpe en classes : [unités, mille, millions, milliards] (nombres de 0 à 999)
    function classes(s) { s = clean(s); const out = []; for (let i = s.length; i > 0; i -= 3) out.push(+s.slice(Math.max(0, i - 3), i)); return out; }

    // ── Écriture en lettres (règles de « Nombres en chiffres / lettres ») ──
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
    // « last » : le groupe n'est pas suivi de « mille » (cent et vingt peuvent prendre un s)
    function three(n, last) {
        const h = Math.floor(n / 100), r = n % 100;
        const hund = [], rest = two(r, last);
        if (h === 1) hund.push('cent');
        else if (h > 1) hund.push(UNITS[h], r === 0 && last ? 'cents' : 'cent');
        return { hund, rest };
    }
    // Orthographe : traits d'union entre tous les mots (rectifications de 1990), toujours utilisée ici
    function joinGroup(g, rect) {
        const all = g.hund.concat(g.rest);
        if (rect) return all.join('-');
        let r = '';
        g.rest.forEach((w, i) => { r += i === 0 ? w : ((w === 'et' || g.rest[i - 1] === 'et') ? ' ' : '-') + w; });
        return g.hund.concat(r ? [r] : []).join(' ');
    }
    // Renvoie les morceaux par classe : [{ k, txt }] du plus grand au plus petit
    function wordParts(s, rect) {
        s = clean(s);
        if (!s || +s === 0) return [{ k: 0, txt: 'zéro' }];
        const K = classes(s), parts = [];
        for (let k = K.length - 1; k >= 0; k--) {
            const n = K[k];
            if (!n) continue;
            if (k === 1) {
                const t = n === 1 ? 'mille' : joinGroup(three(n, false), rect) + (rect ? '-' : ' ') + 'mille';
                parts.push({ k, txt: t });
            } else if (k >= 2) {
                // Règle simplifiée pour le CM2 : cent et vingt ne prennent pas de s devant million / milliard
                parts.push({ k, txt: joinGroup(three(n, false), rect) + (rect ? '-' : ' ') + (k === 2 ? 'million' : 'milliard') + (n > 1 ? 's' : '') });
            } else parts.push({ k, txt: joinGroup(three(n, true), rect) });
        }
        return parts;
    }
    function words(s, rect) {
        const P = wordParts(s, rect);
        let out = '';
        P.forEach((p, i) => {
            if (i === 0) { out = p.txt; return; }
            // En orthographe rectifiée, « mille » se lie au reste par un trait d'union
            out += (rect ? '-' : ' ') + p.txt;
        });
        return out;
    }
    function wordsHtml(s, rect, cur) {
        const P = wordParts(s, rect);
        return P.map((p, i) => {
            const sep = i === 0 ? '' : (rect ? '-' : ' ');
            return `${sep}<span class="nd-c${p.k}${cur === p.k ? ' cur' : ''}">${esc(p.txt)}</span>`;
        }).join('');
    }
    // Nombre coloré par classe
    function numHtml(s) {
        s = clean(s); const K = Math.ceil(s.length / 3);
        const grp = fmt(s).split(SP);
        return `<span class="nd-num">${grp.map((g, i) => `<span class="nd-c${K - 1 - i}">${g}</span>`).join(SP)}</span>`;
    }

    // ── Décompositions ──
    function nonZero(s) { const out = []; for (let p = s.length - 1; p >= 0; p--) { const d = dAt(s, p); if (d) out.push({ p, d }); } return out; }
    const kOf = p => Math.floor(p / 3);
    function decAdd(s) { return nonZero(clean(s)).map(({ p, d }) => `<span class="nd-c${kOf(p)}">${fmt(d + '0'.repeat(p))}</span>`).join(' + '); }
    function decMul(s) { return nonZero(clean(s)).map(({ p, d }) => p === 0 ? `<span class="nd-c0">${d}</span>` : `<span class="nd-c${kOf(p)}">(${d} × ${fmt(pow10(p))})</span>`).join(' + '); }
    function decCls(s) {
        const K = classes(s), out = [];
        for (let k = K.length - 1; k >= 0; k--) if (K[k]) out.push(k === 0 ? `<span class="nd-c0">${K[k]}</span>` : `<span class="nd-c${k}">(${K[k]} × ${fmt(pow10(3 * k))})</span>`);
        return out.join(' + ');
    }
    function decNames(s) { return nonZero(clean(s)).map(({ p, d }) => `<span class="nd-c${kOf(p)}">${d} ${posName(p, d === 1)}</span>`).join(' + '); }

    // ── Nombres au hasard selon le niveau ──
    function genNum(lvl) {
        const len = lvl === 1 ? rnd(4, 6) : lvl === 2 ? rnd(7, 9) : rnd(10, 12);
        const pz = lvl === 1 ? .22 : lvl === 2 ? .3 : .35;
        let s = String(rnd(1, 9));
        for (let i = 1; i < len; i++) s += Math.random() < pz ? '0' : String(rnd(1, 9));
        // Parfois une classe entière de zéros (2 040 000 517)
        if (lvl >= 2 && Math.random() < .25) {
            const K = Math.ceil(len / 3), k = rnd(1, K - 2 >= 1 ? K - 2 : 1);
            if (k < K - 1) { const a = s.split(''); for (let p = 3 * k; p < 3 * k + 3; p++) a[a.length - 1 - p] = '0'; s = a.join(''); }
        }
        return s;
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
    // RENDU DU TABLEAU DE NUMÉRATION
    //   opts.K : nombre de classes affichées ; opts.hlK : classe surlignée ;
    //   opts.hlP : colonne surlignée ; opts.click : colonnes cliquables ;
    //   opts.edit : { q, vals, marks } cases à remplir ; opts.zeros : afficher les 0 de tête
    // =====================================================================
    function tableHtml(s, opts) {
        opts = opts || {};
        s = clean(s);
        const K = Math.max(opts.K || 1, Math.ceil(s.length / 3));
        let r1 = '<tr>', r2 = '<tr>', r3 = '<tr>';
        for (let k = K - 1; k >= 0; k--) {
            const dim = opts.hlK !== undefined && opts.hlK !== null && opts.hlK !== k ? ' dim' : '';
            r1 += `<th class="kh k${k}${k < K - 1 ? ' sep' : ''}${dim}" colspan="3">${KLBL[k]}</th>`;
            for (let j = 2; j >= 0; j--) {
                const p = 3 * k + j;
                const first = j === 2 && k < K - 1 ? ' sep' : '';
                const hl = (opts.hlK === k ? ' hlk' : '') + (opts.hlP === p ? ' hlc' : '');
                r2 += `<th class="ch k${k}${first}${dim}" title="${posName(p)}">${posShort(p)}</th>`;
                if (opts.edit) {
                    const v = opts.edit.vals[p] || '';
                    const mk = opts.edit.marks ? (opts.edit.marks[p] || '') : '';
                    r3 += `<td class="k${k} ed${first}"><input class="nd-cell ${mk}" data-q="${opts.edit.q}" data-p="${p}" maxlength="1" inputmode="numeric" autocomplete="off" value="${esc(v)}"${opts.edit.lock ? ' disabled' : ''}></td>`;
                } else {
                    const d = dAt(s, p);
                    const txt = d === null ? (opts.zeros ? '0' : '') : d;
                    r3 += `<td class="k${k}${first}${hl}${dim}${opts.click ? ' click' : ''}"${opts.click ? ` data-act="col" data-p="${p}"` : ''}>${txt}</td>`;
                }
            }
        }
        return `<div class="nd-twrap"><table class="nd-table${opts.small ? ' small' : ''}"><thead>${r1}</tr>${r2}</tr></thead><tbody>${r3}</tr></tbody></table></div>`;
    }

    // =====================================================================
    // LEÇONS
    // =====================================================================
    const LESSONS = [
        { id: 'classes', label: '📋 Le tableau',         color: '#e07b2a' },
        { id: 'lire',    label: '🔤 Lire un nombre',      color: '#059669' },
        { id: 'ecrire',  label: '✍️ Écrire en chiffres',  color: '#0891b2' },
        { id: 'decomp',  label: '🧩 Décomposer',          color: '#7c3aed' },
        { id: 'chiffre', label: '🎯 Chiffre ou nombre ?', color: '#D63384' },
        { id: 'lettres', label: '✏️ Les mots-nombres',    color: '#6C4FD8' }
    ];
    const EXT = {
        lire:    { label: '🔤 Lire',             color: '#059669' },
        ecrire:  { label: '✍️ Écrire en chiffres', color: '#0891b2' },
        tableau: { label: '📋 Dans le tableau',  color: '#e07b2a' },
        decomp:  { label: '🧩 Décomposer',       color: '#7c3aed' },
        chiffre: { label: '🎯 Chiffre / nombre', color: '#D63384' }
    };
    const LEVELS = { 1: { label: '😊 Milliers', color: '#2FBF71', hint: 'jusqu\'à 999 999' }, 2: { label: '😐 Millions', color: '#F2994A', hint: 'jusqu\'à 999 999 999' }, 3: { label: '😤 Milliards', color: '#EB5757', hint: 'jusqu\'à 999 999 999 999' } };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'classes',
            exp: { n: '35407260', p: null, step: -1, dlvl: 2 },
            ex: { type: 'lire', level: 1, n: 8 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createNombreDecompWidget = function (saved) {
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
        container.className = 'nd-container';
        container.innerHTML = `
            <div class="nd-header">
                <span class="nd-title">🔢 Les grands nombres</span>
                <div class="nd-tabs">
                    <button class="nd-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="nd-tab-lbl">Leçons</span></button>
                    <button class="nd-tab" data-act="tab" data-tab="exp"><span>🔢</span><span class="nd-tab-lbl">Explorer</span></button>
                    <button class="nd-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="nd-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="nd-icon-btn" data-act="sound" title="Son"></button>
                    <button class="nd-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="nd-body"></div>
            <div class="nd-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — Le tableau de numération et ses classes, lire un grand nombre, l'écrire en chiffres, le décomposer, « chiffre des… » et « nombre de… », les mots-nombres. Chaque classe a sa couleur, comme dans le Tableau de numération.</p>
                <p><b>🔢 Explorer</b> — Écris un nombre (ou 🎲) : il se place dans le tableau, il est écrit en lettres et décomposé de 4 façons. <b>▶ Lire pas à pas</b> lit le nombre classe par classe. Touche une colonne du tableau pour connaître le chiffre et le nombre de dizaines, de centaines…</p>
                <p><b>✏️ Exercices</b> — Lire (choisir la bonne écriture en lettres), écrire en chiffres, placer dans le tableau, décomposer / recomposer, chiffre des… / nombre de… Puis <b>👁 Correction</b> avec le score.</p>
                <p><b>Orthographe</b> : les mots du nombre sont tous reliés par un trait d'union (<i>deux-mille-deux-cent-vingt-trois</i>).</p>
            </div>
            <div class="nd-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.nd-body');
        const help = container.querySelector('.nd-help');
        const resizeHandle = container.querySelector('.nd-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let msg = '', expMsg = '', readT = null;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };
        const W = s => words(s, true);

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        const N1 = '35407260', N2 = '3048205';
        function renderClasses() {
            return `<div class="nd-ltitle"><h2 style="color:#e07b2a">📋 Le tableau de numération</h2></div>
                <div class="nd-box nd-what"><b class="t">🔤 Les classes</b>Pour lire un grand nombre, on regroupe ses chiffres <b>par 3, en partant de la droite</b>. Chaque groupe de 3 chiffres est une <b>classe</b> :
                    <span class="nd-c0"><b>classe des unités</b></span>, <span class="nd-c1"><b>classe des mille</b></span>, <span class="nd-c2"><b>classe des millions</b></span>, <span class="nd-c3"><b>classe des milliards</b></span>.
                    Dans chaque classe, il y a les <b>centaines (c)</b>, les <b>dizaines (d)</b> et les <b>unités (u)</b>.</div>
                ${tableHtml('205418372951', { K: 4 })}
                <div class="nd-box nd-test"><b class="t">🔎 Bien écrire un grand nombre</b>On laisse un <b>petit espace</b> entre les classes : on écrit <span class="nd-big">${numHtml('205418372951')}</span> et pas 205418372951.</div>
                <div class="nd-box nd-memo"><b class="t">🧠 Pour retenir</b>10 unités = 1 dizaine · 10 dizaines = 1 centaine · 10 centaines = 1 unité de mille · 1 000 mille = 1 million · 1 000 millions = 1 milliard.<br>
                    Chaque colonne vaut <b>10 fois plus</b> que la colonne à sa droite.</div>
                <div class="nd-box nd-trap"><b class="t">⚠️ Attention</b>Une classe se lit toujours de la même façon : <b>centaines, dizaines, unités</b>. Seul le <b>nom de la classe</b> change (mille, millions, milliards).</div>
                <div><button class="nd-btn go" data-act="tab" data-tab="exp">🔢 Explorer avec un nombre</button> <button class="nd-btn alt" data-act="practice" data-v="tableau">📋 S'entraîner</button></div>`;
        }
        function renderLire() {
            const P = wordParts(N1, true);
            const K = classes(N1);
            const steps = [
                `Je sépare le nombre en classes, en partant de la droite : <span class="nd-big">${numHtml(N1)}</span>`,
                ...P.map(p => `Je lis la <span class="nd-c${p.k}"><b>${KLBL[p.k]}</b></span> : <b>${K[p.k]}</b> → <span class="nd-c${p.k}"><b>${esc(p.txt)}</b></span>`),
                `Je mets tout ensemble : <span class="nd-words">${wordsHtml(N1, true)}</span>`
            ];
            return `<div class="nd-ltitle"><h2 style="color:#059669">🔤 Lire un grand nombre</h2></div>
                <div class="nd-box nd-what"><b class="t">🔤 La méthode</b>On lit le nombre <b>classe par classe, de gauche à droite</b>. On lit chaque classe comme un nombre de 1 à 999, puis on dit le <b>nom de la classe</b> : milliards, millions, mille. On ne dit jamais « unités ».</div>
                ${tableHtml(N1, { K: 3 })}
                <div class="nd-steps">${steps.map((t, i) => `<div class="nd-step"><span class="n">${i + 1}</span><span>${t}</span></div>`).join('')}</div>
                <div class="nd-box nd-trap"><b class="t">⚠️ Les classes de zéros</b>Si une classe ne contient que des zéros, on ne la lit pas : <span class="nd-big">${numHtml('7000045')}</span> se lit <b class="nd-words">${wordsHtml('7000045', true)}</b>.</div>
                <div class="nd-box nd-memo"><b class="t">🧠 Pour retenir</b>Je repère les espaces : chaque espace me dit où s'arrête une classe.</div>
                <div><button class="nd-btn go" data-act="practice" data-v="lire">✏️ S'entraîner : lire</button> <button class="nd-btn alt" data-act="exp-n" data-v="${N1}">▶ Lire pas à pas dans l'Explorer</button></div>`;
        }
        function renderEcrire() {
            const n = '12008340';
            return `<div class="nd-ltitle"><h2 style="color:#0891b2">✍️ Écrire un nombre en chiffres</h2></div>
                <div class="nd-box nd-what"><b class="t">🔤 La méthode</b>Je cherche les mots <b class="nd-c3">milliards</b>, <b class="nd-c2">millions</b> et <b class="nd-c1">mille</b> : ils me disent dans quelle classe ranger chaque morceau. Puis je place chaque morceau dans sa classe du tableau.</div>
                <div class="nd-box nd-tool nd-big" style="text-align:center"><span class="nd-words">${wordsHtml(n, true)}</span></div>
                <div class="nd-steps">
                    <div class="nd-step"><span class="n">1</span><span><span class="nd-c2"><b>${esc(wordParts(n, true)[0].txt)}</b></span> → j'écris <b>12</b> dans la classe des millions.</span></div>
                    <div class="nd-step"><span class="n">2</span><span><span class="nd-c1"><b>${esc(wordParts(n, true)[1].txt)}</b></span> → j'écris <b>8</b> dans la classe des mille, à la place des unités : <b>008</b>.</span></div>
                    <div class="nd-step"><span class="n">3</span><span><span class="nd-c0"><b>${esc(wordParts(n, true)[2].txt)}</b></span> → j'écris <b>340</b> dans la classe des unités.</span></div>
                    <div class="nd-step"><span class="n">4</span><span>Les cases vides au milieu du nombre se remplissent avec des <b>0</b> : <span class="nd-big">${numHtml(n)}</span></span></div>
                </div>
                ${tableHtml(n, { K: 3 })}
                <div class="nd-box nd-memo"><b class="t">🧠 Pour retenir</b>Chaque classe a <b>toujours 3 chiffres</b>, sauf la première à gauche. Si un morceau est plus petit, je complète avec des 0 devant : ${esc(W('8000'))} → <b>008</b>.</div>
                <div class="nd-box nd-trap"><b class="t">⚠️ Le piège des zéros</b>« ${esc(W('2000005'))} » ne s'écrit pas 25 ! C'est <span class="nd-big">${numHtml('2000005')}</span> : il faut des zéros dans les classes et les colonnes vides.</div>
                <div><button class="nd-btn go" data-act="practice" data-v="ecrire">✏️ S'entraîner : écrire en chiffres</button></div>`;
        }
        function renderDecomp() {
            return `<div class="nd-ltitle"><h2 style="color:#7c3aed">🧩 Décomposer un nombre</h2></div>
                <div class="nd-box nd-what"><b class="t">🔤 Décomposer</b>Décomposer un nombre, c'est l'écrire comme une <b>somme</b> en montrant la valeur de chaque chiffre selon sa place dans le tableau.</div>
                ${tableHtml(N2, { K: 3 })}
                <div class="nd-panel nd-dec">
                    <div class="row"><span class="lbl">Avec les valeurs</span><span class="nd-num">${fmt(N2)} = ${decAdd(N2)}</span></div>
                    <div class="row"><span class="lbl">Avec ×</span><span class="nd-num">${fmt(N2)} = ${decMul(N2)}</span></div>
                    <div class="row"><span class="lbl">Par classes</span><span class="nd-num">${fmt(N2)} = ${decCls(N2)}</span></div>
                    <div class="row"><span class="lbl">Avec les mots</span><span style="font-weight:800">${fmt(N2)} = ${decNames(N2)}</span></div>
                </div>
                <div class="nd-box nd-memo"><b class="t">🧠 Pour retenir</b>Le chiffre <b>4</b> est dans la colonne des dizaines de mille : il vaut <b>4 × 10 000 = 40 000</b>. Un chiffre vaut plus ou moins selon sa <b>place</b>.</div>
                <div class="nd-box nd-trap"><b class="t">⚠️ Les zéros</b>On n'écrit pas les zéros dans la décomposition (0 × 100 000 = 0). Mais attention quand on <b>recompose</b> : il faut remettre les 0 dans les colonnes vides !
                    <span class="nd-num nd-big">5 000 000 + 30 000 + 6 = ${numHtml('5030006')}</span></div>
                <div><button class="nd-btn go" data-act="practice" data-v="decomp">✏️ S'entraîner : décomposer</button></div>`;
        }
        function renderChiffre() {
            const n = '4582619';
            return `<div class="nd-ltitle"><h2 style="color:#D63384">🎯 Chiffre des… ou nombre de… ?</h2></div>
                <div class="nd-box nd-what"><b class="t">🔤 Deux questions différentes</b><ul>
                    <li>Le <b>chiffre des centaines</b>, c'est <b>un seul chiffre</b> : celui de la colonne des centaines.</li>
                    <li>Le <b>nombre de centaines</b>, c'est <b>tout ce qu'il y a à gauche</b>, jusqu'à la colonne des centaines comprise : on compte combien de centaines il y a en tout.</li></ul></div>
                ${tableHtml(n, { K: 3, hlP: 2 })}
                <div class="nd-box nd-tool nd-big">Dans <span class="nd-num">${fmt(n)}</span> :<br>
                    · le <b>chiffre</b> des centaines est <b style="color:#FF4F5E">6</b> ;<br>
                    · le <b>nombre</b> de centaines est <b class="nd-num" style="color:#FF4F5E">45 826</b> (car 4 582 619 = 45 826 centaines + 19).</div>
                <div class="nd-box nd-memo"><b class="t">🧠 Pour retenir</b>Pour trouver le <b>nombre de</b> …, je cache tous les chiffres à droite de la colonne et je lis ce qui reste.</div>
                <div class="nd-box nd-test"><b class="t">🔎 Encore un exemple</b>Dans <span class="nd-num">${fmt(n)}</span>, le chiffre des unités de mille est <b>2</b>, le nombre de milliers est <b class="nd-num">4 582</b>, le nombre de dizaines de mille est <b>458</b>.</div>
                <div><button class="nd-btn go" data-act="practice" data-v="chiffre">✏️ S'entraîner</button> <button class="nd-btn alt" data-act="tab" data-tab="exp">🔢 Essayer dans l'Explorer</button></div>`;
        }
        function renderLettres() {
            const ex = ['21', '71', '80', '83', '200', '203', '280000', '200000000', '1000', '1001000'];
            return `<div class="nd-ltitle"><h2 style="color:#6C4FD8">✏️ Les mots-nombres</h2></div>
                <div class="nd-box nd-what"><b class="t">🔤 Les mots à connaître</b>Avec seulement quelques mots, on écrit tous les nombres :
                    <i>un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze, douze, treize, quatorze, quinze, seize, vingt, trente, quarante, cinquante, soixante, cent, mille</i> — et les noms <i>million</i> et <i>milliard</i>.</div>
                <div class="nd-box nd-test"><b class="t">🔎 Les traits d'union</b>
                    On met un <b>trait d'union entre tous les mots</b> du nombre, y compris « et », « mille », « millions » et « milliards ».
                    <ul>${ex.map(n => `<li><span class="nd-num">${fmt(n)}</span> : <b>${esc(W(n))}</b></li>`).join('')}</ul></div>
                <div class="nd-box nd-memo"><b class="t">🧠 Pour retenir</b><b>mille</b> ne prend jamais de s. <b>cent</b> et <b>vingt</b> prennent un s quand ils sont multipliés et qu'ils terminent le nombre (deux-cent<b>s</b>, quatre-vingt<b>s</b>), mais pas quand un autre mot les suit (deux-cent-mille, deux-cent-millions, quatre-vingt-trois).
                    <b>million</b> et <b>milliard</b> prennent un s au pluriel (deux-million<b>s</b>).</div>
                <div><button class="nd-btn go" data-act="practice" data-v="lire">✏️ S'entraîner : lire</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="nd-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { classes: renderClasses, lire: renderLire, ecrire: renderEcrire, decomp: renderDecomp, chiffre: renderChiffre, lettres: renderLettres }[S.lesson]();
            return `<div class="nd-lesson"><div class="nd-side">${side}</div><div class="nd-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXPLORER
        // =================================================================
        function renderExp() {
            const E = S.exp, n = clean(E.n) || '0';
            const P = wordParts(n, true);
            const K = Math.max(2, Math.ceil(n.length / 3));
            const curK = E.step >= 0 && P[E.step] ? P[E.step].k : null;
            let h = `<div class="nd-ex">`;
            h += `<div class="nd-bar">
                <input class="nd-in" value="${esc(fmt(n))}" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="Écris un nombre">
                <button class="nd-btn small" data-act="exp-set">✔ Placer</button>
                <button class="nd-btn alt small" data-act="exp-rnd" title="Un nombre au hasard">🎲</button>
                ${[1, 2, 3].map(l => `<button class="nd-chip ${E.dlvl === l ? 'on' : ''}" style="--c:${LEVELS[l].color}" data-act="exp-lvl" data-v="${l}">${LEVELS[l].label}</button>`).join('')}
            </div>`;
            if (expMsg) h += `<div class="nd-msg">⚠️ ${esc(expMsg)}</div>`;
            h += tableHtml(n, { K, hlK: curK, hlP: E.p, click: true });
            h += `<div class="nd-panel"><h4>🔤 En lettres
                    <button class="nd-btn alt small" data-act="read-step">${E.step >= 0 && E.step < P.length - 1 ? '▶ Classe suivante' : '▶ Lire pas à pas'}</button>
                    ${canSpeak ? `<button class="nd-btn alt small" data-act="say">🔊 Écouter</button>` : ''}
                    <span style="flex:1"></span></h4>
                <div class="nd-read nd-words">${E.step >= 0 ? P.slice(0, E.step + 1).map((p, i) => `${i ? (true ? '-' : ' ') : ''}<span class="nd-c${p.k}${i === E.step ? ' cur' : ''}">${esc(p.txt)}</span>`).join('') + (E.step < P.length - 1 ? ' <span style="color:#c3b9a5">…</span>' : '') : wordsHtml(n, true)}</div>
                ${E.step >= 0 && P[E.step] ? `<div class="nd-hint" style="text-align:center;margin-top:4px">${KLBL[P[E.step].k]} : <b>${classes(n)[P[E.step].k]}</b> → « ${esc(P[E.step].txt)} »</div>` : ''}</div>`;
            if (E.p !== null && E.p !== undefined && E.p < n.length) {
                const d = dAt(n, E.p), nb = n.slice(0, n.length - E.p);
                h += `<div class="nd-info">🎯 Le <b>chiffre des ${posName(E.p)}</b> est <b style="color:#FF4F5E">${d}</b>. Le <b>nombre ${deName(E.p)}</b> est <b class="nd-num" style="color:#FF4F5E">${fmt(nb)}</b>.</div>`;
            } else h += `<div class="nd-hint" style="text-align:center">👆 Touche une colonne du tableau pour connaître le chiffre et le nombre de dizaines, de centaines…</div>`;
            if (+n > 0) h += `<div class="nd-panel nd-dec"><h4>🧩 Décompositions</h4>
                <div class="row"><span class="lbl">Avec les valeurs</span><span class="nd-num">${fmt(n)} = ${decAdd(n)}</span></div>
                <div class="row"><span class="lbl">Avec ×</span><span class="nd-num">${fmt(n)} = ${decMul(n)}</span></div>
                <div class="row"><span class="lbl">Par classes</span><span class="nd-num">${fmt(n)} = ${decCls(n)}</span></div>
                <div class="row"><span class="lbl">Avec les mots</span><span style="font-weight:800">${decNames(n)}</span></div></div>`;
            return h + `</div>`;
        }
        function setExpNumber(raw) {
            const n = clean(raw);
            if (!/^\d+$/.test(n)) { expMsg = 'Écris un nombre avec des chiffres seulement.'; return false; }
            if (n.length > 12) { expMsg = 'Le tableau va jusqu\'aux centaines de milliards (12 chiffres au plus).'; return false; }
            expMsg = ''; S.exp.n = n; S.exp.step = -1; if (S.exp.p !== null && S.exp.p >= n.length) S.exp.p = null;
            return true;
        }

        // =================================================================
        // EXERCICES : génération
        // =================================================================
        function lireOptions(n) {
            // Bonne réponse + 2 erreurs vraisemblables (zéro oublié, chiffres inversés, mauvaise classe)
            const good = W(n), out = new Set([good]);
            const muts = [];
            const a = n.split('');
            // un zéro en moins / en plus
            const zi = a.findIndex((c, i) => i > 0 && c === '0');
            if (zi > 0) muts.push(a.slice(0, zi).concat(a.slice(zi + 1)).join(''));
            muts.push(n.slice(0, -1) + '0' + n.slice(-1));
            // deux chiffres voisins inversés
            for (let t = 0; t < 4; t++) { const i = rnd(0, a.length - 2); if (a[i] !== a[i + 1] && !(i === 0 && a[1] === '0')) { const b = a.slice(); [b[i], b[i + 1]] = [b[i + 1], b[i]]; muts.push(b.join('')); break; } }
            // classe décalée
            muts.push(n.slice(0, -3) || n);
            shuffle(muts).forEach(m => { if (out.size < 3 && /^[1-9]\d*$/.test(m) && m !== n) out.add(W(m)); });
            while (out.size < 3) out.add(W(String(+n + rnd(1, 9) * Math.pow(10, rnd(0, n.length - 2)))));
            return shuffle(Array.from(out));
        }
        function genRun() {
            const ex = S.ex, lvl = ex.level, N = ex.n;
            const qs = [];
            for (let i = 0; i < N; i++) {
                const n = genNum(lvl);
                if (ex.type === 'lire') qs.push({ n, opts: lireOptions(n) });
                else if (ex.type === 'ecrire') qs.push({ n });
                else if (ex.type === 'tableau') qs.push({ n, K: lvl + 1, from: Math.random() < .5 ? 'w' : 'd' });
                else if (ex.type === 'decomp') {
                    const mode = pick(['trouve', 'trouve', 'complete']);
                    const form = pick(lvl === 1 ? ['add', 'mul', 'names'] : ['add', 'mul', 'names', 'cls']);
                    const q = { n, mode, form, blanks: [] };
                    const idx = termsOf(q).map((t, j) => j);
                    if (mode === 'complete') q.blanks = shuffle(idx).slice(0, Math.min(idx.length, lvl === 1 ? 1 : 2));
                    // Au niveau 2 et 3, les termes peuvent être dans le désordre
                    q.order = mode === 'trouve' && lvl >= 2 && Math.random() < .5 ? shuffle(idx) : idx;
                    qs.push(q);
                } else {
                    const p = rnd(1, n.length - 1), kind = Math.random() < .5 ? 'chiffre' : 'nombre';
                    qs.push({ n, p, kind });
                }
            }
            S.run = { type: ex.type, qs, ans: [], corrected: false };
            return '';
        }
        // Réponse attendue pour chaque question (texte de chiffres)
        function expected(R, q) {
            if (R.type === 'lire') return W(q.n);
            if (R.type === 'ecrire' || R.type === 'tableau') return q.n;
            if (R.type === 'chiffre') return q.kind === 'chiffre' ? String(dAt(q.n, q.p)) : clean(q.n.slice(0, q.n.length - q.p));
            if (R.type === 'decomp') return q.mode === 'trouve' ? q.n : null;
            return null;
        }
        // Termes de la décomposition (pour « complète »)
        function termsOf(q) {
            const T = nonZero(q.n);
            if (q.form === 'cls') {
                const K = classes(q.n), out = [];
                for (let k = K.length - 1; k >= 0; k--) if (K[k]) out.push({ k, d: K[k], p: 3 * k });
                return out;
            }
            return T.map(t => ({ k: kOf(t.p), d: t.d, p: t.p }));
        }
        function blankExpected(q, t) {
            // Ce que l'élève doit écrire dans le trou
            if (q.form === 'add') return fmt(t.d + '0'.repeat(t.p));
            if (q.form === 'names') return String(t.d);
            return String(t.d);   // mul / cls : le multiplicateur
        }
        function isRight(R, q, i) {
            const a = R.ans[i];
            if (R.type === 'lire') return a === expected(R, q);
            if (R.type === 'tableau') {
                const v = a || {};
                for (let p = 0; p < 3 * q.K; p++) {
                    const want = p < q.n.length ? String(dAt(q.n, p)) : '';
                    if ((v[p] || '') !== want) return false;
                }
                return true;
            }
            if (R.type === 'decomp' && q.mode === 'complete') {
                const T = termsOf(q), v = a || {};
                return q.blanks.every(j => clean(v[j]) === clean(blankExpected(q, T[j])));
            }
            return clean(a) === clean(expected(R, q)) && clean(a) !== '';
        }
        const scoreOf = R => ({ ok: R.qs.filter((q, i) => isRight(R, q, i)).length, n: R.qs.length });

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="nd-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="nd-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="nd-settings">`;
            h += `<div class="nd-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            h += `<div class="nd-srow"><span class="l">2. Nombres</span>${[1, 2, 3].map(l => ch('level', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}<span class="nd-hint">${LEVELS[ex.level].hint}</span></div>`;
            h += `<div class="nd-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="nd-srow"><span class="l">Taille du texte</span><button class="nd-btn alt small" data-act="font" data-d="-2">A−</button><button class="nd-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="nd-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="nd-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="nd-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function card(R, i, inner, title) {
            let cls = '', mark = '';
            if (R.corrected) { const ok = isRight(R, R.qs[i], i); cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌'; }
            return `<div class="nd-q ${cls}"><div class="nd-qtop"><span class="nd-n">${i + 1})</span>${title}<span style="margin-left:auto">${mark}</span></div>${inner}</div>`;
        }
        const mk = (R, q, i) => R.corrected ? (isRight(R, q, i) ? ' ok' : ' ko') : '';
        function ansInput(R, i, extra) {
            const a = R.ans[i] || '';
            return `<input class="nd-ans${mk(R, R.qs[i], i)}${extra || ''}" data-in="ans" data-i="${i}" value="${esc(a)}" inputmode="numeric" autocomplete="off" spellcheck="false"${R.corrected ? ' disabled' : ''} placeholder="…">`;
        }
        function renderQuestions(R) {
            if (R.type === 'lire') {
                return `<div class="nd-grid">` + R.qs.map((q, i) => {
                    const a = R.ans[i], good = expected(R, q);
                    const btns = q.opts.map(o => {
                        let c = a === o ? 'on' : '';
                        if (R.corrected) c = o === good ? 'good' : (a === o ? 'bad' : '');
                        return `<button class="nd-choice ${c}"${R.corrected ? '' : ` data-act="pick" data-i="${i}" data-v="${esc(o)}"`}>${esc(o)}</button>`;
                    }).join('');
                    return card(R, i, `<div class="nd-qmain">${numHtml(q.n)}</div><div class="nd-choices">${btns}</div>`, 'Comment se lit ce nombre ?');
                }).join('') + `</div>`;
            }
            if (R.type === 'ecrire') {
                return `<div class="nd-grid">` + R.qs.map((q, i) => {
                    let h = `<div class="nd-qwords">${esc(W(q.n))}</div>${ansInput(R, i)}`;
                    if (R.corrected && !isRight(R, q, i)) h += `<div class="nd-why">✔ ${numHtml(q.n)}</div>`;
                    return card(R, i, h, 'Écris ce nombre en chiffres');
                }).join('') + `</div>`;
            }
            if (R.type === 'tableau') {
                return `<div class="nd-grid one">` + R.qs.map((q, i) => {
                    const a = R.ans[i] || {};
                    let marks = null;
                    if (R.corrected) { marks = {}; for (let p = 0; p < 3 * q.K; p++) { const want = p < q.n.length ? String(dAt(q.n, p)) : ''; marks[p] = (a[p] || '') === want ? (want ? 'ok' : '') : 'ko'; } }
                    let h = q.from === 'w' ? `<div class="nd-qwords">${esc(W(q.n))}</div>` : `<div class="nd-qmain">${numHtml(q.n)}</div>`;
                    h += tableHtml('', { K: q.K, small: true, edit: { q: i, vals: a, marks, lock: R.corrected } });
                    return card(R, i, h, 'Place ce nombre dans le tableau (un chiffre par case)');
                }).join('') + `</div>`;
            }
            if (R.type === 'decomp') {
                return `<div class="nd-grid one">` + R.qs.map((q, i) => {
                    const T = termsOf(q);
                    const term = (t, j) => {
                        if (q.mode === 'complete' && q.blanks.indexOf(j) !== -1) {
                            const v = (R.ans[i] || {})[j] || '';
                            const ok = R.corrected ? (clean(v) === clean(blankExpected(q, t)) ? ' ok' : ' ko') : '';
                            const inp = `<input class="nd-ans mini${ok}" data-in="blank" data-i="${i}" data-j="${j}" value="${esc(v)}" size="${q.form === 'add' ? 9 : 3}" inputmode="numeric" autocomplete="off"${R.corrected ? ' disabled' : ''}>`;
                            if (q.form === 'add') return inp;
                            if (q.form === 'names') return `${inp} ${posName(t.p, t.d === 1)}`;
                            return t.p === 0 ? inp : `(${inp} × ${fmt(pow10(t.p))})`;
                        }
                        if (q.form === 'add') return `<span class="nd-c${t.k}">${fmt(t.d + '0'.repeat(t.p))}</span>`;
                        if (q.form === 'names') return `<span class="nd-c${t.k}">${t.d} ${posName(t.p, t.d === 1)}</span>`;
                        return t.p === 0 ? `<span class="nd-c0">${t.d}</span>` : `<span class="nd-c${t.k}">(${t.d} × ${fmt(pow10(t.p))})</span>`;
                    };
                    let h;
                    if (q.mode === 'trouve') {
                        const ord = q.order.filter(j => j < T.length);
                        h = `<div class="nd-decq ${q.form === 'names' ? '' : 'nd-num'}">${ord.map(j => term(T[j], j)).join(' + ')} =</div>${ansInput(R, i)}`;
                        if (R.corrected && !isRight(R, q, i)) h += `<div class="nd-why">✔ ${numHtml(q.n)}</div>`;
                    } else {
                        h = `<div class="nd-decq ${q.form === 'names' ? '' : 'nd-num'}"><span class="nd-num">${fmt(q.n)}</span> = ${T.map((t, j) => term(t, j)).join(' + ')}</div>`;
                        if (R.corrected && !isRight(R, q, i)) h += `<div class="nd-why">✔ ${q.blanks.map(j => `<b>${esc(blankExpected(q, T[j]))}</b>`).join(' · ')}</div>`;
                    }
                    return card(R, i, h, q.mode === 'trouve' ? 'Quel est ce nombre ?' : 'Complète la décomposition');
                }).join('') + `</div>`;
            }
            // Chiffre / nombre
            return `<div class="nd-grid">` + R.qs.map((q, i) => {
                let h = `<div class="nd-qmain">${numHtml(q.n)}</div><div class="nd-qwords">Quel est le <b>${q.kind === 'chiffre' ? 'chiffre des ' + posName(q.p) : 'nombre ' + deName(q.p)}</b>\u00A0?</div>${ansInput(R, i)}`;
                if (R.corrected) h += `<div class="nd-why">${q.kind === 'chiffre' ? `Le chiffre des ${posName(q.p)} est <b>${dAt(q.n, q.p)}</b>.` : `Le nombre ${deName(q.p)} est <b class="nd-num">${fmt(q.n.slice(0, q.n.length - q.p))}</b> : on lit tout ce qui est à gauche, jusqu'à cette colonne.`}</div>`;
                return card(R, i, h, q.kind === 'chiffre' ? 'Le chiffre des…' : 'Le nombre de…');
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="nd-topbar"><span class="nd-pill">${EXT[R.type].label} · ${R.qs.length} questions</span>
                ${sc ? `<span class="nd-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="nd-actions">
                <button class="nd-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="nd-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="nd-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="nd-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="nd-info">Choisis l'exercice et la taille des nombres, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.nd-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
                c.className = 'nd-confetti';
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
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🔢 Les grands nombres', { onExpand: render });
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
                // Explorer
                case 'exp-n': setExpNumber(el.dataset.v); S.tab = 'exp'; E.step = -1; body.scrollTop = 0; break;
                case 'exp-set': { const inp = body.querySelector('.nd-in'); if (inp) setExpNumber(inp.value); sfx('pop'); break; }
                case 'exp-rnd': setExpNumber(genNum(E.dlvl)); E.p = null; sfx('pop'); break;
                case 'exp-lvl': E.dlvl = +el.dataset.v; setExpNumber(genNum(E.dlvl)); E.p = null; break;
                case 'col': { const p = +el.dataset.p; E.p = E.p === p ? null : p; sfx('pop'); break; }
                case 'read-step': {
                    const P = wordParts(E.n, true);
                    E.step = E.step >= P.length - 1 ? 0 : E.step + 1;
                    if (S.sound && P[E.step]) speak(P[E.step].txt);
                    break;
                }
                case 'say': speak(W(E.n)); return;
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
            if (e.target.closest('.nd-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.nd-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // ── Saisie dans les champs (sans tout redessiner) ──
        container.addEventListener('input', e => {
            const t = e.target, R = S.run;
            if (t.classList.contains('nd-cell') && R) {
                let v = t.value.replace(/\D/g, '').slice(-1);
                t.value = v;
                const i = +t.dataset.q, p = +t.dataset.p;
                R.ans[i] = Object.assign({}, R.ans[i] || {});
                R.ans[i][p] = v;
                // Case suivante (vers la droite)
                if (v) { const next = body.querySelector(`.nd-cell[data-q="${i}"][data-p="${p - 1}"]`); if (next) next.focus(); }
                saveSoon();
            } else if (t.dataset.in === 'ans' && R) {
                R.ans[+t.dataset.i] = t.value; saveSoon();
            } else if (t.dataset.in === 'blank' && R) {
                const i = +t.dataset.i; R.ans[i] = Object.assign({}, R.ans[i] || {}); R.ans[i][+t.dataset.j] = t.value; saveSoon();
            }
        });
        // Mise en forme avec les espaces quand on quitte le champ
        container.addEventListener('focusout', e => {
            const t = e.target;
            if (t.dataset && t.dataset.in === 'ans' && /^\d[\d\s ]*$/.test(t.value.trim()) && clean(t.value).length > 3) {
                t.value = fmt(t.value); if (S.run) S.run.ans[+t.dataset.i] = t.value;
            }
        });
        container.addEventListener('keydown', e => {
            const t = e.target;
            if (t.tagName === 'INPUT') e.stopPropagation();   // le tableau ne doit pas réagir aux touches
            if (e.key === 'Enter' && t.classList.contains('nd-in')) { e.preventDefault(); act('exp-set', t); }
            if (t.classList.contains('nd-cell')) {
                const i = +t.dataset.q, p = +t.dataset.p;
                const go = d => { const n = body.querySelector(`.nd-cell[data-q="${i}"][data-p="${p + d}"]`); if (n) { e.preventDefault(); n.focus(); n.select(); } };
                if (e.key === 'ArrowRight') go(-1);
                else if (e.key === 'ArrowLeft') go(1);
                else if (e.key === 'Backspace' && !t.value) go(1);
            }
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
        widget._ndGetData = function () {
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

    // Accès au moteur (tests)
    window._ndEngine = { words, wordParts, classes, genNum, fmt, clean };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createNombreDecompWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
