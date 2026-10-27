// =========================================================================
// ACTIVITÉ « LES CONVERSIONS » (leçons + exercices) — Le Bureau du Prof
// Type : 'conversion-lecon'
//
// 📖 Leçons (avec animations pas à pas dans le tableau de conversion) :
//    🧭 Le tableau de conversion · 🔢 Convertir un nombre entier
//    🔸 Convertir un nombre à virgule · ⬛ Les aires · 🎬 Mon exemple
//    Méthode animée : 1) j'écris le nombre (SANS la virgule) en plaçant le
//    chiffre des unités dans la colonne de l'unité donnée ; 2) je repère la
//    colonne de l'unité demandée ; 3) je complète avec des 0 si besoin ;
//    4) la virgule se place juste après le chiffre de cette colonne.
// ✏️ Exercices :
//    🧮 Dans le tableau : l'élève place lui-même (colonne des unités,
//       colonne demandée, zéros), puis écrit le résultat. Étoiles et bilan.
//    ✍️ Écrire le résultat : série corrigée, avec « 🎬 Voir dans le tableau ».
//    🔍 Choisir la bonne réponse : QCM corrigé (erreurs de virgule classiques).
//
// Ouverture : createWidget('conversion-lecon') ou createConversionLeconWidget()
// Sauvegarde : w._cvlGetData()  /  createConversionLeconWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'conversion-lecon';

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

    // ── CSS (préfixe cvl-) ────────────────────────────────────────────────
    if (!document.getElementById('cvl-style')) {
        const s = document.createElement('style');
        s.id = 'cvl-style';
        s.textContent = `
.widget[data-type="conversion-lecon"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.cvl-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --bleu:#2F80ED; --orange:#F2994A; --creme:#FFF8EC; --tc:#6C4FD8;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.cvl-container input, .cvl-container select { user-select:text; -webkit-user-select:text; }
.cvl-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .cvl-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .widget:has(.cvl-container.wf-fullboard) { z-index:9999 !important; }
    .cvl-tab-lbl { display:none; }
    .cvl-title { font-size:17px !important; }
    .cvl-lesson { flex-direction:column; }
    .cvl-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .cvl-gbtn { flex:1 1 auto; text-align:center !important; }
    .cvl-srow > .l { min-width:0 !important; width:100%; }
    .cvl-ltitle h2 { font-size:24px !important; }
}
.cvl-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.cvl-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.cvl-tabs { display:flex; gap:6px; margin-left:12px; }
.cvl-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.cvl-tab:hover { background:rgba(255,255,255,.1); }
.cvl-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.cvl-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.cvl-icon-btn:hover { background:rgba(255,255,255,.28); }
.cvl-body { flex:1; min-height:0; overflow:auto; position:relative; container-type:inline-size; }

/* ── Leçons ── */
.cvl-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.cvl-side { width:210px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.cvl-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.cvl-gbtn:hover { transform:translateX(2px); }
.cvl-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.cvl-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; --tf:clamp(18px, 3.4vw, 34px); }
.cvl-ltitle h2 { margin:0; font-size:32px; font-weight:900; color:var(--tc); }
.cvl-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.cvl-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.cvl-box ol, .cvl-box ul { margin:4px 0 0; padding-left:22px; }
.cvl-box li { margin:2px 0; }
.cvl-what { background:#f1edff; border:2px solid #c8bbf5; }
.cvl-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.cvl-memo { background:#fff6d6; border:2px solid #f3d36b; }
.cvl-trap { background:#ffecee; border:2px solid #f6a7b0; }
.cvl-key  { background:#fff1dc; border:3px solid var(--orange); font-size:17px; }
.cvl-key b.t { font-size:18px; color:#b85a00; }
.cvl-num { font-family:'MarelleBaton','Nunito',sans-serif; font-size:1.35em; font-weight:700; }
.cvl-strike { position:relative; display:inline-block; color:var(--rouge); text-decoration:none; opacity:.75; }
/* Virgule barrée d'une croix (le trait habituel passerait au-dessus de la virgule) */
.cvl-strike::after { content:''; position:absolute; left:-.14em; right:-.14em; top:auto; bottom:-.12em; height:.5em; pointer-events:none;
    background:linear-gradient(to top right, transparent 42%, var(--rouge) 42%, var(--rouge) 58%, transparent 58%),
               linear-gradient(to bottom right, transparent 42%, var(--rouge) 42%, var(--rouge) 58%, transparent 58%); }
.cvl-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.cvl-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.cvl-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.cvl-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.cvl-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.cvl-btn:disabled { opacity:.45; }
.cvl-chips { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.cvl-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.cvl-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.cvl-hint { font-size:12.5px; color:#6a6380; }

/* ── Tableau de conversion ── */
.cvl-tw { overflow-x:auto; padding:6px 2px 10px; }
.cvl-table { border-collapse:collapse; width:100%; table-layout:fixed; background:#fff; font-family:'MarelleBaton','Nunito',sans-serif; }
.cvl-table th { background:#f1edff; color:var(--encre); font-weight:900; font-size:calc(var(--tf) * .62); padding:.3em 0; border:2px solid #d9cdb6;
    transition:background .3s, color .3s; font-family:'Nunito','Segoe UI',sans-serif; }
.cvl-table td { height:calc(var(--tf) * 1.85); border:2px solid #d9cdb6; text-align:center; font-size:var(--tf); position:relative; padding:0;
    transition:background .3s; }
.cvl-table.aires td { font-size:calc(var(--tf) * .8); }
.cvl-table.aires td.sub-l { border-right:1px dashed #e3d8c3; }
.cvl-table.aires td.sub-r { border-left:1px dashed #e3d8c3; }
.cvl-table .hl-from { background:#fff1dc; }
.cvl-table th.hl-from { background:var(--orange); color:#fff; }
.cvl-table .hl-to { background:#dff6ea; }
.cvl-table th.hl-to { background:var(--vert); color:#fff; }
.cvl-table .bad { background:#ffe1e4 !important; animation:cvl-shake .45s; }
.cvl-table.click td:hover { box-shadow:inset 0 0 0 3px #b9abef; }
.cvl-table td.miss { box-shadow:inset 0 0 0 3px var(--rouge); animation:cvl-pulse 1s infinite; }
.cvl-table.static td { height:auto; padding:.25em 0; font-family:'Nunito','Segoe UI',sans-serif; font-size:calc(var(--tf) * .45); }
.cvl-table.static td.pre { font-weight:900; color:#6a6380; }
.cvl-table.static .main { background:#fff1dc; }
.cvl-table.static th.main { background:var(--orange); color:#fff; }
.cvl-d { display:inline-block; font-weight:700; color:var(--encre); line-height:1; }
.cvl-d.u { color:#b85a00; text-decoration:underline 3px var(--orange); text-underline-offset:4px; }
.cvl-d.zero { color:#d4387a; }
.cvl-d.zero.ko { color:var(--rouge); text-decoration:line-through 3px; }
.cvl-d.new { animation:cvl-drop .55s both; }
/* La virgule est calée sur la ligne de base des chiffres (milieu de la case), à cheval sur le trait de droite */
.cvl-comma { position:absolute; right:-.22em; top:calc(50% - .62em); font-size:1.35em; font-weight:900; color:var(--rouge); z-index:2; line-height:1; pointer-events:none; text-shadow:0 0 3px #fff, 0 0 3px #fff; }
.cvl-comma.new { animation:cvl-comma .9s both; }
@keyframes cvl-drop { 0% { transform:translateY(-1.3em) scale(.5); opacity:0; } 70% { transform:translateY(.08em) scale(1.12); opacity:1; } 100% { transform:none; opacity:1; } }
@keyframes cvl-comma { 0% { transform:translateY(-2.2em) scale(2.2); opacity:0; } 55% { transform:translateY(.1em) scale(1); opacity:1; } 75% { transform:translateY(-.15em); } 100% { transform:none; opacity:1; } }
@keyframes cvl-shake { 0%,100% { transform:none; } 25% { transform:translateX(-4px); } 75% { transform:translateX(4px); } }
@keyframes cvl-pulse { 50% { box-shadow:inset 0 0 0 3px #ffb3bb; } }
@keyframes cvl-pop { 0% { transform:scale(.4); opacity:0; } 70% { transform:scale(1.15); } 100% { transform:none; opacity:1; } }
.cvl-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12.5px; color:#6a6380; justify-content:center; }
.cvl-legend i { display:inline-block; width:12px; height:12px; border-radius:3px; vertical-align:-1px; margin-right:4px; }

/* ── Démonstration animée ── */
.cvl-demo { background:#fff; border:3px solid var(--tc); border-radius:18px; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
.cvl-conv { text-align:center; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--tf) * 1.05); font-weight:700; }
.cvl-conv .q { color:#b3abc4; }
.cvl-conv .res { color:#178a4b; background:#e2f7ec; border-radius:10px; padding:0 .25em; display:inline-block; }
.cvl-conv .res.new { animation:cvl-pop .6s both; }
.cvl-say { border-radius:14px; padding:8px 14px; font-size:16px; line-height:1.5; text-align:center; background:#f1edff; border:2px solid #c8bbf5; min-height:2.6em; }
.cvl-say.good { background:#e2f7ec; border-color:#8fd8b0; }
.cvl-say.bad { background:#ffe9eb; border-color:#f6a7b0; }
.cvl-say.new { animation:cvl-pop .35s both; }
.cvl-dctrl { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; align-items:center; }
.cvl-steps { display:flex; gap:4px; }
.cvl-dot { width:12px; height:12px; border-radius:50%; background:#e3d8c3; }
.cvl-dot.done { background:var(--violet); } .cvl-dot.cur { background:var(--orange); box-shadow:0 0 0 3px #ffd9b3; }
.cvl-atl { display:flex; flex-wrap:wrap; gap:8px 12px; align-items:center; background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:10px 12px; }
.cvl-atl label { font-weight:900; font-size:14px; display:flex; gap:6px; align-items:center; }
.cvl-atl input, .cvl-atl select { font:inherit; font-size:17px; font-weight:800; padding:4px 8px; border:2px solid #d9cdb6; border-radius:10px; color:var(--encre); background:#fff; }
.cvl-atl input { width:110px; font-family:'MarelleBaton','Nunito',sans-serif; }

/* ── Exercices ── */
.cvl-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; }
.cvl-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.cvl-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.cvl-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.cvl-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.cvl-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.cvl-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.cvl-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.cvl-pill.score { background:var(--vert); font-size:16px; }
.cvl-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; align-items:center; }
.cvl-dots { display:flex; gap:4px; flex-wrap:wrap; }
.cvl-qdot { width:13px; height:13px; border-radius:50%; background:#e3d8c3; }
.cvl-qdot.good { background:var(--vert); } .cvl-qdot.meh { background:#FFB020; } .cvl-qdot.cur { background:var(--violet); box-shadow:0 0 0 3px #cfc3f7; }
.cvl-write { display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--tf) * .9); font-weight:700; }
.cvl-tin, .cvl-in { box-sizing:border-box; border:none; border-bottom:3px solid #d9cdb6; background:#fff; font:inherit; font-family:'MarelleBaton','Nunito',sans-serif;
    font-weight:700; color:#3949AB; outline:none; padding:2px 6px; border-radius:6px 6px 0 0; text-align:center; }
.cvl-tin { width:6em; font-size:1em; }
.cvl-tin:focus, .cvl-in:focus { border-bottom-color:var(--violet); background:#f7f3ff; }
.cvl-grid { --gap:calc(var(--f) * .5); display:grid; gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 2 * var(--gap)) / 3), min(100%, 270px)),1fr)); }
.cvl-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(0,0,0,.08); }
.cvl-q.ok { border-color:var(--vert); background:#f3fcf7; }
.cvl-q.ko { border-color:var(--rouge); background:#fff5f6; }
.cvl-qtop { display:flex; gap:6px; align-items:center; margin-bottom:4px; font-size:14px; font-weight:800; color:#6a6380; }
.cvl-qnum { font-weight:900; color:#7b7393; }
.cvl-qline { display:flex; gap:6px; align-items:center; justify-content:center; flex-wrap:wrap; font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .85); font-weight:700; }
.cvl-in { width:5.2em; font-size:1em; }
.cvl-in.ok { color:#178a4b; border-bottom-color:var(--vert); }
.cvl-in.ko { color:var(--rouge); border-bottom-color:var(--rouge); }
.cvl-in:disabled { opacity:1; -webkit-text-fill-color:currentColor; }
.cvl-sol { font-family:'MarelleBaton','Nunito',sans-serif; font-size:calc(var(--f) * .7); color:#178a4b; font-weight:700; text-align:center; margin-top:4px; }
.cvl-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top:6px; }
.cvl-choice { border:2px solid #d9cdb6; background:#fff; border-radius:999px; padding:3px 12px; font:inherit; font-family:'MarelleBaton','Nunito',sans-serif;
    font-weight:700; font-size:calc(var(--f) * .65); color:var(--encre); touch-action:manipulation; }
.cvl-choice.on { background:var(--violet); border-color:var(--violet); color:#fff; }
.cvl-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.cvl-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.cvl-view { display:block; margin:6px auto 0; border:none; background:#f1edff; color:#4a34a3; border-radius:999px; padding:3px 12px; font:inherit; font-weight:900; font-size:13px; }
.cvl-final { text-align:center; display:flex; flex-direction:column; gap:8px; align-items:center; }
.cvl-final .medal { font-size:60px; }

/* ── Fenêtre « Voir dans le tableau » ── */
.cvl-ov { display:none; position:absolute; inset:0; z-index:38; background:rgba(22,16,43,.45); align-items:center; justify-content:center; padding:14px; box-sizing:border-box; }
.cvl-ov.show { display:flex; }
.cvl-ovbox { background:var(--creme); border:3px solid var(--encre); border-radius:18px; width:min(860px, 100%); max-height:100%; overflow:auto; padding:12px; box-sizing:border-box;
    display:flex; flex-direction:column; gap:8px; --tf:clamp(18px, 3.2vw, 32px); }
.cvl-ovhead { display:flex; align-items:center; gap:8px; font-weight:900; font-size:16px; }

.cvl-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:cvl-fall 1.6s ease-in forwards; }
@keyframes cvl-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.cvl-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.cvl-help.show { display:block; }
.cvl-help h4 { margin:0 0 6px; font-size:15px; }
.cvl-help p { margin:0 0 6px; }
.cvl-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.cvl-container:hover .cvl-resize { opacity:1; }
.cvl-container.wf-fullboard .cvl-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="conversion-lecon"], .cvl-container, .cvl-container * { cursor:default !important; }
.cvl-container .cvl-header { cursor:grab !important; }
.cvl-container .cvl-header:active { cursor:grabbing !important; }
.cvl-container button, .cvl-container button *, .cvl-container [data-act], .cvl-container [data-act] *, .cvl-container select, .cvl-container option { cursor:pointer !important; }
.cvl-container button:disabled, .cvl-container button:disabled * { cursor:default !important; }
.cvl-container input:not(:disabled) { cursor:text !important; }
.cvl-container .cvl-resize { cursor:se-resize !important; }
@media (prefers-reduced-motion: reduce) { .cvl-container *, .cvl-container *::before { animation-duration:.01s !important; animation-delay:0s !important; } }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES
    // =====================================================================
    const UNITS = {
        longueurs:   ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'],
        masses:      ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'],
        contenances: ['kL', 'hL', 'daL', 'L', 'dL', 'cL', 'mL'],
        aires:       ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²']
    };
    const MES = {
        longueurs:   { label: '📏 Longueurs',   color: '#2F80ED' },
        masses:      { label: '⚖️ Masses',      color: '#9B51E0' },
        contenances: { label: '🧴 Contenances', color: '#14a3a0' },
        aires:       { label: '⬛ Aires',        color: '#F2994A' },
        mix:         { label: '🎲 Mélange',      color: '#2A1F4A' }
    };
    const LEVELS = { 1: { label: '😊 Facile', color: '#2FBF71' }, 2: { label: '😐 Moyen', color: '#F2994A' }, 3: { label: '😤 Difficile', color: '#EB5757' } };
    const LESSONS = [
        { id: 'tableau', label: '🧭 Le tableau',          color: '#2F80ED' },
        { id: 'entier',  label: '🔢 Nombre entier',       color: '#2FBF71' },
        { id: 'virgule', label: '🔸 Nombre à virgule',    color: '#F2994A' },
        { id: 'aires',   label: '⬛ Les aires',           color: '#9B51E0' },
        { id: 'atelier', label: '🎬 Mon exemple',         color: '#EB5757' }
    ];
    // Exemples animés des leçons (f, to = rang de l'unité dans UNITS)
    const EX = {
        entier: [
            { t: 'longueurs',   v: '4',    f: 3, to: 5 },  // 4 m = 400 cm
            { t: 'masses',      v: '2500', f: 3, to: 0 },  // 2 500 g = 2,5 kg
            { t: 'contenances', v: '37',   f: 4, to: 3 },  // 37 dL = 3,7 L
            { t: 'longueurs',   v: '7',    f: 3, to: 0 }   // 7 m = 0,007 km
        ],
        virgule: [
            { t: 'longueurs',   v: '3,25', f: 3, to: 5 },  // 325 cm
            { t: 'masses',      v: '1,8',  f: 0, to: 3 },  // 1 800 g
            { t: 'contenances', v: '45,6', f: 5, to: 3 },  // 0,456 L
            { t: 'longueurs',   v: '0,5',  f: 0, to: 3 },  // 500 m
            { t: 'longueurs',   v: '12,7', f: 5, to: 6 }   // 127 mm
        ],
        aires: [
            { t: 'aires', v: '3',   f: 3, to: 4 },         // 300 dm²
            { t: 'aires', v: '2,5', f: 4, to: 5 },         // 250 cm²
            { t: 'aires', v: '450', f: 5, to: 4 }          // 4,5 dm²
        ]
    };

    // ── Utilitaires ───────────────────────────────────────────────────────
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = a => a[Math.floor(Math.random() * a.length)];
    // Espace fine entre les milliers (à partir de 4 chiffres)
    function fmt(s) {
        s = String(s);
        const parts = s.split(',');
        const i = parts[0].length >= 4 ? parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F') : parts[0];
        return parts.length > 1 ? i + ',' + parts[1] : i;
    }
    // Forme « propre » d'un nombre : sans espaces, sans 0 inutiles
    function canon(s) {
        s = String(s == null ? '' : s).replace(/[\s\u202F\u00A0]/g, '').replace('.', ',');
        if (!/^\d*(,\d*)?$/.test(s) || !/\d/.test(s)) return null;
        let [i, d = ''] = s.split(',');
        i = i.replace(/^0+/, '') || '0';
        d = d.replace(/0+$/, '');
        return d ? i + ',' + d : i;
    }

    // =====================================================================
    // MOTEUR : placement d'une conversion dans le tableau
    // Le tableau a 7 unités (14 cases pour les aires : 2 cases par unité).
    // Le chiffre des unités du nombre va dans la case de droite de l'unité.
    // =====================================================================
    function plan(q) {
        const k = q.t === 'aires' ? 2 : 1, N = 7 * k;
        const raw = String(q.v == null ? '' : q.v).replace(/[\s\u202F\u00A0]/g, '').replace('.', ',');
        if (!/^\d+(,\d+)?$/.test(raw)) return { err: 'Écris un nombre, par exemple 3,25.' };
        let [ip, dp = ''] = raw.split(',');
        ip = ip.replace(/^0+(?=\d)/, '');
        const f = +q.f, to = +q.to;
        if (f === to) return { err: 'Choisis deux unités différentes.' };
        const cf = f * k + k - 1, ct = to * k + k - 1;
        const first = cf - ip.length + 1, last = cf + dp.length;
        if (first < 0 || last > N - 1) return { err: 'Ce nombre ne tient pas dans le tableau : choisis un nombre plus court ou d\'autres unités.' };
        const digits = (ip + dp).split('').map((d, j) => ({ c: first + j, d }));
        const start = Math.min(first, ct), end = Math.max(last, ct);
        const map = {};
        digits.forEach(x => { map[x.c] = x.d; });
        const zeros = [];
        let intS = '', decS = '';
        for (let c = start; c <= end; c++) {
            if (map[c] === undefined) zeros.push(c);
            const d = map[c] !== undefined ? map[c] : '0';
            if (c <= ct) intS += d; else decS += d;
        }
        // Les zéros sont ajoutés en partant des chiffres vers la colonne demandée
        if (ct < first) zeros.reverse();
        const intT = intS.replace(/^0+(?=\d)/, ''), decT = decS.replace(/0+$/, '');
        return {
            k, N, f, to, cf, ct, ip, dp, digits, zeros, first, last,
            zerosLeft: ct < first, commaTable: end > ct,
            result: decT ? intT + ',' + decT : intT,
            lead: intT.length < intS.length, trail: decT.length < decS.length,
            ud: ip[ip.length - 1], raw: dp ? ip + ',' + dp : ip
        };
    }
    function stepsOf(p) {
        return ['start', 'from', 'digits', 'to'].concat(p.zeros.length ? ['zeros'] : []).concat(['comma', 'result']);
    }
    const struck = p => p.dp ? `${esc(p.ip)}<s class="cvl-strike">,</s>${esc(p.dp)}` : esc(fmt(p.raw));

    // Phrase d'explication pour chaque étape de l'animation
    function narr(name, q, p) {
        const U = UNITS[q.t], uf = U[q.f], ut = U[q.to], aires = q.t === 'aires';
        const caseDroite = aires ? ' (dans la <b>case de droite</b> : pour les aires, il y a 2 cases par unité)' : '';
        switch (name) {
            case 'start':
                return `Je dois convertir <b>${fmt(p.raw)} ${uf}</b> en <b>${ut}</b>. J'utilise le tableau de conversion.`;
            case 'from':
                return p.dp
                    ? `Le nombre a une virgule. Le <b>chiffre des unités</b> est celui <b>juste avant la virgule</b> : c'est le <b>${p.ud}</b>. Il ira dans la colonne de l'unité donnée : <b>${uf}</b>${caseDroite}.`
                    : `Le <b>chiffre des unités</b> de ${fmt(p.raw)} est le dernier chiffre : le <b>${p.ud}</b>. Il ira dans la colonne de l'unité donnée : <b>${uf}</b>${caseDroite}.`;
            case 'digits':
                return p.dp
                    ? `J'écris le nombre <b>sans la virgule</b> : <b>${p.digits.map(x => x.d).join(' ')}</b>, un chiffre par case, en plaçant le <b>${p.ud}</b> dans la colonne <b>${uf}</b>.`
                    : `J'écris <b>${p.digits.map(x => x.d).join(' ')}</b> dans le tableau, un chiffre par case : le <b>${p.ud}</b> est dans la colonne <b>${uf}</b>.`;
            case 'to':
                return `L'unité demandée est le <b>${ut}</b> : je repère sa colonne. C'est là que sera le <b>chiffre des unités du résultat</b>.`;
            case 'zeros':
                return p.zerosLeft
                    ? `La colonne <b>${ut}</b> est vide : je complète avec des <b>0</b> depuis mes chiffres jusqu'à la colonne <b>${ut}</b> (elle comprise).`
                    : `Il y a des cases vides jusqu'à la colonne <b>${ut}</b> : je les complète avec des <b>0</b>.`;
            case 'comma':
                return p.commaTable
                    ? `Le chiffre des unités du résultat est dans la colonne <b>${ut}</b>${aires ? ' (case de droite)' : ''} : je place la <b>virgule juste après</b>.`
                    : `Le dernier chiffre est dans la colonne <b>${ut}</b> : c'est le chiffre des unités. Il n'y a rien après : <b>pas besoin de virgule</b> !`;
            case 'result': {
                let n = '';
                if (p.lead) n += ' Les 0 placés au début ne servent à rien : on ne les écrit pas.';
                if (p.trail) n += ' Les 0 à la fin, après la virgule, ne servent à rien : on ne les écrit pas.';
                return `Je lis le nombre jusqu'à la colonne <b>${ut}</b> : <b>${fmt(p.raw)} ${uf} = ${fmt(p.result)} ${ut}</b> 🎉${n}`;
            }
        }
        return '';
    }

    // Tableau HTML
    // o : { from, to, digits, dNew, zeros:[cols], zNew, zNewCol, zMarks:{col:'ko'|'miss'}, comma, cNew, click, bad }
    function tableHtml(t, p, o) {
        const U = UNITS[t], k = t === 'aires' ? 2 : 1, N = 7 * k;
        const hl = u => (o.from && u === p.f ? ' hl-from' : '') + (o.to && u === p.to ? ' hl-to' : '') + (o.bad === u ? ' bad' : '');
        let h = `<div class="cvl-tw"><table class="cvl-table${o.click ? ' click' : ''}${k === 2 ? ' aires' : ''}"><tr>`;
        U.forEach((u, i) => {
            h += `<th${k === 2 ? ' colspan="2"' : ''} class="${hl(i)}"${o.click ? ` data-act="tcell" data-c="${i * k + k - 1}"` : ''}>${u}</th>`;
        });
        h += '</tr><tr>';
        const dmap = {};
        if (o.digits) p.digits.forEach((x, j) => { dmap[x.c] = { d: x.d, j }; });
        const zl = o.zeros || [];
        for (let c = 0; c < N; c++) {
            const u = Math.floor(c / k);
            let cls = 'cvl-c' + hl(u) + (k === 2 ? (c % 2 === 0 ? ' sub-l' : ' sub-r') : '');
            let inner = '';
            const zi = zl.indexOf(c);
            if (dmap[c]) {
                inner = `<span class="cvl-d${c === p.cf ? ' u' : ''}${o.dNew ? ' new' : ''}" style="animation-delay:${(dmap[c].j * 0.25).toFixed(2)}s">${dmap[c].d}</span>`;
            } else if (zi !== -1) {
                const mk = (o.zMarks && o.zMarks[c]) || '';
                const isNew = o.zNew || o.zNewCol === c;
                inner = `<span class="cvl-d zero ${mk}${isNew ? ' new' : ''}" style="animation-delay:${o.zNew ? (zi * 0.25).toFixed(2) : 0}s">0</span>`;
            } else if (o.zMarks && o.zMarks[c] === 'miss') cls += ' miss';
            if (o.comma && c === p.ct && p.commaTable) inner += `<span class="cvl-comma${o.cNew ? ' new' : ''}">,</span>`;
            h += `<td class="${cls}"${o.click ? ` data-act="tcell" data-c="${c}"` : ''}>${inner}</td>`;
        }
        return h + '</tr></table></div>';
    }
    const LEGEND = `<div class="cvl-legend"><span><i style="background:#F2994A"></i>unité donnée</span><span><i style="background:#2FBF71"></i>unité demandée</span>
        <span><b style="color:#b85a00;text-decoration:underline">5</b> chiffre des unités</span><span><b style="color:#d4387a">0</b> zéro ajouté</span><span><b style="color:#FF4F5E">,</b> virgule</span></div>`;

    // Lecture à voix haute (sons courts, Web Audio)
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
        good:  () => { tone(1046, 0, 0.12); tone(1568, 0.09, 0.22); },
        meh:   () => { tone(660, 0, 0.12); tone(784, 0.1, 0.18); },
        bad:   () => { tone(220, 0, 0.18, 'square', 0.05); tone(170, 0.16, 0.25, 'square', 0.05); },
        pop:   () => tone(880, 0, 0.06, 'sine', 0.05),
        comma: () => { tone(1320, 0, 0.08, 'sine', 0.07); tone(990, 0.08, 0.12, 'sine', 0.06); },
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    // =====================================================================
    // GÉNÉRATION DES EXERCICES
    // facile : entiers, vers une unité plus petite (on ajoute des 0)
    // moyen  : entiers, dans les deux sens (la virgule peut apparaître)
    // difficile : nombres à virgule, dans les deux sens
    // (moyen et difficile contiennent 20 % de questions du niveau inférieur)
    // =====================================================================
    function genQ(t, level, used) {
        for (let tries = 0; tries < 300; tries++) {
            let d = level;
            const r = Math.random();
            if (level === 2 && r < 0.2) d = 1;
            if (level === 3 && r < 0.2) d = 2;
            const maxGap = t === 'aires' ? 2 : (d === 1 ? 3 : d === 2 ? 2 : 4);
            let f, to, v;
            if (d === 1) {
                f = rand(0, 5); to = rand(f + 1, Math.min(f + maxGap, 6));
                v = String(rand(1, 95));
            } else {
                f = rand(0, 6); to = rand(0, 6);
                if (f === to || Math.abs(f - to) > maxGap) continue;
                if (d === 2) v = String(to < f ? rand(2, 999) : rand(1, 95));
                else {
                    let ds = '';
                    const nd = Math.random() < 0.5 ? 1 : 2;
                    for (let i = 0; i < nd; i++) ds += rand(0, 9);
                    ds = ds.replace(/0+$/, '') || String(rand(1, 9));
                    v = rand(0, 99) + ',' + ds;
                }
            }
            const q = { t, v, f, to };
            const p = plan(q);
            if (p.err || p.result === '0' || p.result.replace(',', '').length > 8) continue;
            const key = t + v + f + '-' + to;
            if (used && used.has(key) && tries < 250) continue;
            if (used) used.add(key);
            return q;
        }
        return { t, v: '5', f: 3, to: 5 };
    }
    function qcmOpts(q) {
        const right = plan(q).result, c = new Set();
        [-2, -1, 1, 2].forEach(dt => {
            const to2 = q.to + dt;
            if (to2 < 0 || to2 > 6 || to2 === q.f) return;
            const p2 = plan(Object.assign({}, q, { to: to2 }));
            if (!p2.err) c.add(p2.result);
        });
        c.add(canon(q.v));               // erreur classique : recopier le nombre
        c.delete(right);
        return shuffle(shuffle(Array.from(c)).slice(0, 3).concat([right]));
    }

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'tableau', tabType: 'longueurs',
            les: { entier: { ex: 0, step: 0 }, virgule: { ex: 0, step: 0 }, aires: { ex: 0, step: 0 } },
            atl: { t: 'longueurs', v: '3,25', f: 3, to: 5, cur: null, step: 0 },
            ex: { type: 'tableau', mes: 'longueurs', level: 1, nt: 6, nq: 8 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createConversionLeconWidget = function (saved) {
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
        container.className = 'cvl-container';
        container.innerHTML = `
            <div class="cvl-header">
                <span class="cvl-title">📐 Les conversions</span>
                <div class="cvl-tabs">
                    <button class="cvl-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="cvl-tab-lbl">Leçons</span></button>
                    <button class="cvl-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="cvl-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="cvl-icon-btn" data-act="sound" title="Son"></button>
                    <button class="cvl-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="cvl-body"></div>
            <div class="cvl-ov"></div>
            <div class="cvl-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — Le tableau de conversion, puis la méthode pour convertir un nombre entier, un nombre à virgule et une aire. Chaque méthode est <b>animée pas à pas</b> dans le tableau : <b>▶ Lecture</b> déroule l'animation, <b>Étape suivante ⏭</b> avance à votre rythme. Choisissez un autre exemple avec les étiquettes au-dessus, ou créez le vôtre dans <b>🎬 Mon exemple</b>.</p>
                <p>⚠️ <b>Nombre à virgule</b> : on écrit le nombre <b>sans la virgule</b>, en plaçant le <b>chiffre des unités</b> (celui juste avant la virgule) dans la colonne de l'unité donnée.</p>
                <p><b>✏️ Exercices</b> — Trois types :</p>
                <p>🧮 <b>Dans le tableau</b> : l'élève touche la colonne du chiffre des unités, puis la colonne demandée, ajoute les 0 nécessaires en touchant les cases vides, puis écrit le résultat. Étoiles et bilan à la fin.</p>
                <p>✍️ <b>Écrire le résultat</b> et 🔍 <b>Choisir la bonne réponse</b> : une série, puis <b>👁 Correction</b> avec le score. <b>🎬 Voir dans le tableau</b> rejoue la méthode animée pour chaque question.</p>
            </div>
            <div class="cvl-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.cvl-body');
        const help = container.querySelector('.cvl-help');
        const ov = container.querySelector('.cvl-ov');
        const resizeHandle = container.querySelector('.cvl-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
            if (!LESSONS.some(l => l.id === S.lesson)) S.lesson = 'tableau';
        }
        let msg = '', playT = null, lastDemoKey = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // DÉMONSTRATION ANIMÉE (leçons, « Mon exemple », « Voir dans le tableau »)
        // =================================================================
        function demoCtx() {
            const R = S.run;
            if (S.tab === 'train' && R && R.view != null && R.qs && R.qs[R.view]) return { q: R.qs[R.view], holder: R, key: 'vstep' };
            if (S.tab === 'lecon') {
                if (S.lesson === 'atelier') return S.atl.cur ? { q: S.atl.cur, holder: S.atl, key: 'step' } : null;
                const L = S.les[S.lesson];
                if (L && EX[S.lesson]) return { q: EX[S.lesson][L.ex] || EX[S.lesson][0], holder: L, key: 'step' };
            }
            return null;
        }
        function demoHtml(q, step) {
            const p = plan(q);
            if (p.err) return `<div class="cvl-msg">⚠️ ${p.err}</div>`;
            const st = stepsOf(p);
            step = Math.max(0, Math.min(step || 0, st.length - 1));
            const key = JSON.stringify(q) + '#' + step;
            const anim = key !== lastDemoKey;
            lastDemoKey = key;
            const at = n => st.indexOf(n) !== -1 && step >= st.indexOf(n);
            const now = n => anim && st[step] === n;
            const U = UNITS[q.t];
            const table = tableHtml(q.t, p, {
                from: at('from'), to: at('to'), digits: at('digits'), dNew: now('digits'),
                zeros: at('zeros') ? p.zeros : [], zNew: now('zeros'),
                comma: at('comma'), cNew: now('comma')
            });
            const res = at('result') ? `<b class="res${now('result') ? ' new' : ''}">${fmt(p.result)}</b>` : '<b class="q">?</b>';
            const numH = at('digits') && p.dp ? struck(p) : esc(fmt(p.raw));
            const dots = st.map((_, i) => `<span class="cvl-dot ${i < step ? 'done' : i === step ? 'cur' : ''}"></span>`).join('');
            const last = step >= st.length - 1;
            return `<div class="cvl-demo">
                <div class="cvl-conv">${numH} ${U[q.f]} = ${res} ${U[q.to]}</div>
                ${table}
                <div class="cvl-say ${st[step] === 'result' ? 'good' : ''}${anim ? ' new' : ''}">${narr(st[step], q, p)}</div>
                <div class="cvl-dctrl">
                    <button class="cvl-btn alt small" data-act="dprev" ${step === 0 ? 'disabled' : ''} title="Étape précédente">⏮</button>
                    <button class="cvl-btn small" data-act="dplay">${playT ? '⏸ Pause' : (last ? '↺ Rejouer' : '▶ Lecture')}</button>
                    <button class="cvl-btn go small" data-act="dnext" ${last ? 'disabled' : ''}>Étape suivante ⏭</button>
                    <span class="cvl-steps" title="Étape ${step + 1} sur ${st.length}">${dots}</span>
                    <button class="cvl-btn alt small" data-act="dreset" title="Recommencer">↺</button>
                </div>
                ${LEGEND}
            </div>`;
        }
        function stepSfx(q, step) {
            const p = plan(q);
            if (p.err) return;
            const n = stepsOf(p)[step];
            if (n === 'digits' || n === 'zeros' || n === 'from' || n === 'to') sfx('pop');
            else if (n === 'comma') sfx(p.commaTable ? 'comma' : 'pop');
            else if (n === 'result') sfx('good');
        }
        function demoMove(d) {
            const ctx = demoCtx();
            if (!ctx) return false;
            const p = plan(ctx.q);
            if (p.err) return false;
            const n = stepsOf(p).length;
            const ns = Math.max(0, Math.min(n - 1, (ctx.holder[ctx.key] || 0) + d));
            if (ns === ctx.holder[ctx.key]) return false;
            ctx.holder[ctx.key] = ns;
            if (d > 0) stepSfx(ctx.q, ns);
            return true;
        }
        function stopPlay() { if (playT) { clearInterval(playT); playT = null; } }
        function startPlay() {
            stopPlay();
            const ctx = demoCtx();
            if (!ctx) return;
            const p = plan(ctx.q);
            if (p.err) return;
            if ((ctx.holder[ctx.key] || 0) >= stepsOf(p).length - 1) { ctx.holder[ctx.key] = 0; lastDemoKey = ''; }
            playT = setInterval(() => {
                if (!widget.isConnected) { stopPlay(); return; }
                const moved = demoMove(1);
                const c = demoCtx();
                const pp = c && plan(c.q);
                if (!moved || !c || pp.err || c.holder[c.key] >= stepsOf(pp).length - 1) stopPlay();
                render(); saveSoon();
            }, 2300);
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function exChips(id) {
            const L = S.les[id];
            return `<div class="cvl-chips"><span class="cvl-hint" style="font-weight:800">Exemples :</span>${EX[id].map((e, i) => {
                const U = UNITS[e.t];
                return `<button class="cvl-chip ${L.ex === i ? 'on' : ''}" style="--c:#2A1F4A" data-act="lex" data-i="${i}">${fmt(e.v)} ${U[e.f]} ➜ ${U[e.to]}</button>`;
            }).join('')}</div>`;
        }
        function lessonDemo(id) {
            const L = S.les[id];
            return exChips(id) + demoHtml(EX[id][L.ex] || EX[id][0], L.step);
        }
        function renderTableauL() {
            const t = S.tabType, U = UNITS[t], b = U[3];
            const pre = ['kilo', 'hecto', 'déca', 'unité', 'déci', 'centi', 'milli'];
            const val = ['1 000', '100', '10', '1', '0,1', '0,01', '0,001'];
            const chips = ['longueurs', 'masses', 'contenances'].map(k =>
                `<button class="cvl-chip ${t === k ? 'on' : ''}" style="--c:${MES[k].color}" data-act="ttype" data-v="${k}">${MES[k].label}</button>`).join('');
            const base = t === 'longueurs' ? 'le mètre (m)' : t === 'masses' ? 'le gramme (g)' : 'le litre (L)';
            return `<div class="cvl-ltitle"><h2 style="color:#2F80ED">🧭 Le tableau de conversion</h2></div>
                <div class="cvl-chips">${chips}</div>
                <div class="cvl-box cvl-what"><b class="t">🔤 À quoi sert-il ?</b>Le tableau de conversion sert à <b>changer d'unité</b> sans se tromper. L'unité principale est ${base} : elle est au milieu. Chaque colonne est une unité, rangée de la plus grande (à gauche) à la plus petite (à droite).</div>
                <div class="cvl-tw"><table class="cvl-table static"><tr>${U.map((u, i) => `<th class="${i === 3 ? 'main' : ''}">${u}</th>`).join('')}</tr>
                    <tr>${pre.map((x, i) => `<td class="pre ${i === 3 ? 'main' : ''}">${x}</td>`).join('')}</tr>
                    <tr>${val.map((x, i) => `<td class="${i === 3 ? 'main' : ''}">${x} ${b}</td>`).join('')}</tr></table></div>
                <div class="cvl-box cvl-test"><b class="t">🔎 Comment lire le tableau ?</b><ul>
                    <li>Quand je passe d'une colonne à <b>sa voisine de droite</b>, l'unité est <b>10 fois plus petite</b> : 1 ${b} = 10 ${U[4]} = 100 ${U[5]} = 1&nbsp;000 ${U[6]}.</li>
                    <li>Vers la <b>gauche</b>, l'unité est 10 fois plus grande : 1 ${U[0]} = 10 ${U[1]} = 100 ${U[2]} = 1&nbsp;000 ${b}.</li>
                    <li>Le préfixe donne la valeur : <b>kilo</b> = 1&nbsp;000, <b>hecto</b> = 100, <b>déca</b> = 10, <b>déci</b> = un dixième, <b>centi</b> = un centième, <b>milli</b> = un millième.</li></ul></div>
                <div class="cvl-box cvl-memo"><b class="t">🧠 Pour retenir</b><b>Un seul chiffre par case !</b> Et le <b>chiffre des unités</b> du nombre se place toujours dans la colonne de l'unité donnée.</div>
                <div class="cvl-box cvl-trap"><b class="t">⚠️ Attention au piège</b><b>dam</b> (décamètre, 10 m) et <b>dm</b> (décimètre, 0,1 m) se ressemblent : déca = 10 fois plus grand, déci = 10 fois plus petit.</div>
                <div class="cvl-chips"><button class="cvl-btn" data-act="lesson" data-g="entier">Voir la méthode ➜</button>
                    <button class="cvl-btn go" data-act="practice" data-v="qcm" data-l="1" data-m="${t}">✏️ S'entraîner</button></div>`;
        }
        function methodBox() {
            return `<div class="cvl-box cvl-test"><b class="t">🔧 La méthode en 4 étapes</b><ol>
                <li>J'écris le nombre dans le tableau : le <b>chiffre des unités</b> va dans la colonne de l'<b>unité donnée</b>. Un chiffre par case.</li>
                <li>Je repère la colonne de l'<b>unité demandée</b>.</li>
                <li>Si des cases sont vides jusqu'à cette colonne, je les complète avec des <b>0</b>.</li>
                <li>Le chiffre de la colonne demandée devient le chiffre des unités : je place la <b>virgule juste après</b> (s'il y a des chiffres après).</li></ol></div>`;
        }
        function renderEntierL() {
            return `<div class="cvl-ltitle"><h2 style="color:#2FBF71">🔢 Convertir un nombre entier</h2></div>
                ${methodBox()}
                ${lessonDemo('entier')}
                <div class="cvl-box cvl-memo"><b class="t">🧠 Pour retenir</b>Vers une unité <b>plus petite</b> (vers la droite), le nombre devient <b>plus grand</b> : on ajoute souvent des 0 (4 m = 400 cm). Vers une unité <b>plus grande</b> (vers la gauche), le nombre devient <b>plus petit</b> : une virgule apparaît (37 dL = 3,7 L).</div>
                <div class="cvl-box cvl-trap"><b class="t">⚠️ Attention au piège</b>Le chiffre des unités d'un nombre entier est son <b>dernier chiffre</b> (le 0 de 2 500 !). C'est lui qui va dans la colonne de l'unité donnée, pas le premier chiffre.</div>
                <div><button class="cvl-btn go" data-act="practice" data-v="tableau" data-l="2">✏️ S'entraîner dans le tableau</button></div>`;
        }
        function renderVirguleL() {
            return `<div class="cvl-ltitle"><h2 style="color:#F2994A">🔸 Convertir un nombre à virgule</h2></div>
                <div class="cvl-box cvl-key"><b class="t">⚠️ Le plus important</b>Quand le nombre a une virgule, <b>j'écris d'abord le nombre SANS la virgule</b> dans le tableau,
                    en plaçant le <b>chiffre des unités</b> (celui <b>juste avant la virgule</b>) dans la colonne de l'<b>unité donnée</b>.
                    <div style="text-align:center;margin-top:6px"><span class="cvl-num">3<s class="cvl-strike">,</s>25 m</span> ➜ le chiffre des unités est <b>3</b> ➜ le <b>3</b> va dans la colonne <b>m</b>, puis 2 et 5 dans les colonnes suivantes.</div></div>
                ${lessonDemo('virgule')}
                ${methodBox()}
                <div class="cvl-box cvl-memo"><b class="t">🧠 Pour retenir</b>La virgule de départ disparaît : une <b>nouvelle virgule</b> se place juste après la colonne de l'unité demandée. Les 0 inutiles au début ou à la fin (après la virgule) ne s'écrivent pas.</div>
                <div class="cvl-box cvl-trap"><b class="t">⚠️ Attention au piège</b>Ne mets jamais la virgule dans une case du tableau, et ne place pas le <b>premier</b> chiffre dans la colonne de l'unité : c'est le chiffre <b>juste avant la virgule</b> (dans 45,6 cL, c'est le <b>5</b> qui va dans la colonne cL).</div>
                <div><button class="cvl-btn go" data-act="practice" data-v="tableau" data-l="3">✏️ S'entraîner dans le tableau</button></div>`;
        }
        function renderAiresL() {
            return `<div class="cvl-ltitle"><h2 style="color:#9B51E0">⬛ Les aires</h2></div>
                <div class="cvl-box cvl-what"><b class="t">🔤 Deux cases par unité</b>Pour les aires (m², cm²…), chaque unité a <b>deux cases</b> dans le tableau. D'une unité à sa voisine, on multiplie (ou divise) par <b>100</b> et non par 10 : <b>1 m² = 100 dm²</b>.</div>
                <div class="cvl-box cvl-test"><b class="t">🔧 Même méthode, avec une règle en plus</b>Le chiffre des unités se place dans la <b>case de droite</b> de la colonne de l'unité donnée. Ensuite : un chiffre par case, des 0 si besoin jusqu'à la <b>case de droite</b> de l'unité demandée, et la virgule juste après.</div>
                ${lessonDemo('aires')}
                <div class="cvl-box cvl-trap"><b class="t">⚠️ Attention au piège</b>1 m² ≠ 10 dm² ! Un carré de 1 m de côté contient 10 × 10 = <b>100</b> carrés de 1 dm de côté.</div>
                <div><button class="cvl-btn go" data-act="practice" data-v="tableau" data-l="2" data-m="aires">✏️ S'entraîner avec les aires</button></div>`;
        }
        function renderAtelierL() {
            const A = S.atl, U = UNITS[A.t];
            const opts = sel => U.map((u, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${u}</option>`).join('');
            const chips = ['longueurs', 'masses', 'contenances', 'aires'].map(k =>
                `<button class="cvl-chip ${A.t === k ? 'on' : ''}" style="--c:${MES[k].color}" data-act="atype" data-v="${k}">${MES[k].label}</button>`).join('');
            return `<div class="cvl-ltitle"><h2 style="color:#EB5757">🎬 Mon exemple</h2></div>
                <div class="cvl-box cvl-what">Choisis ta propre conversion : la méthode s'anime dans le tableau, étape par étape.</div>
                <div class="cvl-chips">${chips}</div>
                <div class="cvl-atl">
                    <label>Nombre <input class="cvl-atl-v" value="${esc(A.v)}" inputmode="decimal" autocomplete="off" spellcheck="false"></label>
                    <label><select data-f="f">${opts(+A.f)}</select></label>
                    <label>en <select data-f="to">${opts(+A.to)}</select></label>
                    <button class="cvl-btn go small" data-act="aplay">🎬 Animer</button>
                </div>
                ${A.cur ? demoHtml(A.cur, A.step) : `<div class="cvl-info">Écris un nombre, choisis les unités puis clique sur <b>🎬 Animer</b>.</div>`}`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="cvl-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = S.lesson === 'entier' ? renderEntierL() : S.lesson === 'virgule' ? renderVirguleL()
                : S.lesson === 'aires' ? renderAiresL() : S.lesson === 'atelier' ? renderAtelierL() : renderTableauL();
            const tc = (LESSONS.find(l => l.id === S.lesson) || LESSONS[0]).color;
            return `<div class="cvl-lesson" style="--tc:${tc}"><div class="cvl-side">${side}</div><div class="cvl-main">${main}</div></div>`;
        }

        // =================================================================
        // EXERCICES
        // =================================================================
        function genRun() {
            const ex = S.ex;
            const used = new Set();
            const n = ex.type === 'tableau' ? ex.nt : ex.nq;
            const qs = [];
            for (let i = 0; i < n; i++) {
                const t = ex.mes === 'mix' ? pick(['longueurs', 'masses', 'contenances']) : ex.mes;
                qs.push(genQ(t, ex.level, used));
            }
            if (ex.type === 'tableau') {
                const R = { type: 'tableau', qs, qi: 0, results: [], stars: 0, view: null, vstep: 0 };
                loadQ(R);
                S.run = R;
            } else if (ex.type === 'qcm') {
                qs.forEach(q => { q.opts = qcmOpts(q); });
                S.run = { type: 'qcm', qs, ans: [], corrected: false, view: null, vstep: 0 };
            } else {
                S.run = { type: 'ecrire', qs, ans: [], corrected: false, view: null, vstep: 0 };
            }
            stopPlay();
            return '';
        }
        function loadQ(R) {
            const q = R.qs[R.qi], p = plan(q);
            R.phase = 'unit'; R.errors = 0; R.hints = 0; R.uz = []; R.zm = null; R.inp = ''; R.anim = null; R.bad = null; R.lastZ = null;
            R.say = { mood: '', html: `🦉 Question ${R.qi + 1} sur ${R.qs.length}. Le chiffre des unités de <b>${fmt(p.raw)}</b> est le <b>${p.ud}</b>${p.dp ? ' (juste avant la virgule)' : ''}. <b>Touche la colonne</b> où tu l'écris.` };
        }
        function tNext(R) {
            if (R.qi >= R.qs.length - 1) {
                R.phase = 'final';
                const max = R.qs.length * 3;
                R.medal = R.stars >= max - 2 ? '🥇' : R.stars >= Math.round(max * 0.6) ? '🥈' : '🥉';
                sfx('win'); if (R.medal === '🥇') party();
            } else { R.qi++; loadQ(R); }
        }
        function tWon(R, p) {
            const st = R.errors === 0 && R.hints === 0 ? 3 : R.errors + R.hints <= 2 ? 2 : 1;
            R.stars += st; R.results[R.qi] = st === 3 ? 'good' : 'meh'; R.phase = 'won'; R.anim = 'result';
            const q = R.qs[R.qi], U = UNITS[q.t];
            R.say = { mood: 'good', html: `🎉 ${pick(['Bravo', 'Parfait', 'Super', 'Excellent', 'Génial'])} ! <b>${fmt(p.raw)} ${U[q.f]} = ${fmt(p.result)} ${U[q.to]}</b> ${'⭐'.repeat(st)}` };
            sfx('good'); if (st === 3) party();
        }
        function afterZeros(R, p, q) {
            const ut = UNITS[q.t][q.to];
            R.phase = 'write'; R.anim = 'comma'; R.zm = null;
            R.say = { mood: '', html: (p.commaTable
                ? `✅ Le chiffre des unités du résultat est dans la colonne <b>${ut}</b> : la <b>virgule</b> se place juste après.`
                : `✅ Le dernier chiffre est dans la colonne <b>${ut}</b> : <b>pas de virgule</b>.`) + ` Lis le nombre et <b>écris le résultat</b>.` };
            sfx(p.commaTable ? 'comma' : 'pop');
        }
        function tCell(R, c) {
            const q = R.qs[R.qi], p = plan(q), U = UNITS[q.t];
            const u = Math.floor(c / p.k);
            if (R.phase === 'unit') {
                if (u === q.f) {
                    R.phase = 'to'; R.anim = 'digits';
                    R.say = { mood: 'good', html: `👍 Oui, colonne <b>${U[q.f]}</b> ! ${p.dp ? `J'écris le nombre <b>sans la virgule</b> : ${p.digits.map(x => x.d).join(' ')}. ` : ''}Maintenant, <b>touche la colonne de l'unité demandée</b> (${U[q.to]}).` };
                    sfx('pop');
                } else {
                    R.errors++; R.bad = u;
                    R.say = { mood: 'bad', html: R.errors >= 2
                        ? `🤔 Le nombre est en <b>${U[q.f]}</b> : son chiffre des unités va dans la colonne <b>${U[q.f]}</b>.`
                        : `🤔 Pas cette colonne. Regarde l'<b>unité écrite après le nombre</b>.` };
                    sfx('bad');
                }
            } else if (R.phase === 'to') {
                if (u === q.to) {
                    R.phase = 'zeros'; R.uz = [];
                    R.say = { mood: '', html: `👍 Bien ! Faut-il ajouter des <b>0</b> jusqu'à la colonne <b>${U[q.to]}</b> ? <b>Touche les cases vides</b> à remplir avec un 0, puis clique sur <b>✔ Valider les zéros</b>. (S'il n'en faut pas, valide directement.)` };
                    sfx('pop');
                } else {
                    R.errors++; R.bad = u;
                    R.say = { mood: 'bad', html: `🤔 On convertit en <b>${U[q.to]}</b> : cherche cette colonne dans le tableau.` };
                    sfx('bad');
                }
            } else if (R.phase === 'zeros') {
                if (p.digits.some(x => x.c === c)) return;
                const i = R.uz.indexOf(c);
                if (i === -1) { R.uz.push(c); R.lastZ = c; } else R.uz.splice(i, 1);
                R.zm = null; sfx('pop');
            }
        }
        function tZerosCheck(R) {
            const q = R.qs[R.qi], p = plan(q), U = UNITS[q.t];
            const need = p.zeros, have = R.uz;
            const extra = have.filter(c => need.indexOf(c) === -1), miss = need.filter(c => have.indexOf(c) === -1);
            if (!extra.length && !miss.length) { R.uz = need.slice(); afterZeros(R, p, q); return; }
            R.errors++;
            R.zm = {};
            extra.forEach(c => { R.zm[c] = 'ko'; });
            miss.forEach(c => { R.zm[c] = 'miss'; });
            let h;
            if (!need.length) h = `🤔 Ici, il n'y a <b>aucun 0 à ajouter</b> : la colonne <b>${U[q.to]}</b> contient déjà un chiffre. Retire les 0 barrés.`;
            else if (extra.length && !miss.length) h = `🤔 Trop de 0 ! On ne complète que les cases vides <b>entre tes chiffres et la colonne ${U[q.to]}</b>. Retire les 0 barrés.`;
            else h = `🤔 Il manque des 0 : toutes les cases vides entre tes chiffres et la colonne <b>${U[q.to]}</b> (elle comprise) doivent être remplies. Les cases en rouge sont à compléter.`;
            R.say = { mood: 'bad', html: h };
            sfx('bad');
        }
        function tCheck(R) {
            const q = R.qs[R.qi], p = plan(q);
            const a = canon(R.inp);
            if (a === null) { R.say = { mood: 'bad', html: '✋ Écris un nombre (avec une virgule si besoin).' }; return; }
            if (a === p.result) { tWon(R, p); return; }
            R.errors++;
            let tip = 'Lis les chiffres du tableau de gauche à droite <b>jusqu\'à la virgule</b>, puis ceux qui sont après.';
            if (a === canon(q.v)) tip = 'Tu as recopié le nombre de départ : il change quand on change d\'unité !';
            else if (a.replace(',', '') === p.result.replace(',', '')) tip = 'Les chiffres sont bons, mais pas la place de la <b>virgule</b> : elle est juste après la colonne demandée.';
            R.say = { mood: 'bad', html: `🤔 Pas encore. ${tip}` };
            sfx('bad');
        }
        function tHint(R) {
            const q = R.qs[R.qi], p = plan(q);
            R.hints++;
            if (R.phase === 'unit') { tCell(R, p.cf); R.say.html = '💡 ' + R.say.html; }
            else if (R.phase === 'to') { tCell(R, p.ct); R.say.html = '💡 ' + R.say.html; }
            else if (R.phase === 'zeros') { R.uz = p.zeros.slice(); afterZeros(R, p, q); R.zfix = true; R.say.html = '💡 Voici les 0 nécessaires. ' + R.say.html; }
            else if (R.phase === 'write') { R.inp = p.result; R.say = { mood: '', html: `💡 Le résultat est <b>${fmt(p.result)}</b> : clique sur ✔ Vérifier.` }; }
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="cvl-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="cvl-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="cvl-settings">`;
            h += `<div class="cvl-srow"><span class="l">1. Exercice</span>${ch('etype', 'tableau', ex.type === 'tableau', '🧮 Dans le tableau')}${ch('etype', 'ecrire', ex.type === 'ecrire', '✍️ Écrire le résultat')}${ch('etype', 'qcm', ex.type === 'qcm', '🔍 Choisir la bonne réponse')}</div>`;
            h += `<div class="cvl-srow"><span class="l">2. Mesures</span>${Object.keys(MES).map(k => ch('emes', k, ex.mes === k, MES[k].label, MES[k].color)).join('')}</div>`;
            h += `<div class="cvl-srow"><span class="l">3. Niveau</span>${[1, 2, 3].map(l => ch('elevel', l, ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}
                <span class="cvl-hint">${ex.level === 1 ? 'Nombres entiers, vers une unité plus petite (ajout de 0).' : ex.level === 2 ? 'Nombres entiers, dans les deux sens (la virgule peut apparaître).' : 'Nombres à virgule, dans les deux sens.'}</span></div>`;
            if (ex.type === 'tableau') h += `<div class="cvl-srow"><span class="l">Nombre de questions</span>${[4, 6, 8].map(n => ch('ent', n, ex.nt === n, String(n))).join('')}</div>`;
            else h += `<div class="cvl-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('enq', n, ex.nq === n, String(n))).join('')}</div>`;
            h += `<div class="cvl-srow"><span class="l">Taille du texte</span><button class="cvl-btn alt small" data-act="font" data-d="-2">A−</button><button class="cvl-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="cvl-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="cvl-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="cvl-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        function renderTableauRun(R) {
            const dots = R.qs.map((_, i) => `<span class="cvl-qdot ${R.results[i] || (i === R.qi && R.phase !== 'final' ? 'cur' : '')}"></span>`).join('');
            let h = `<div class="cvl-topbar"><span class="cvl-pill">🧮 ${R.phase === 'final' ? 'Série terminée' : `Question ${R.qi + 1} / ${R.qs.length}`}</span><div class="cvl-dots">${dots}</div><span class="cvl-pill">⭐ ${R.stars}</span></div>`;
            if (R.phase === 'final') {
                const max = R.qs.length * 3;
                const title = R.medal === '🥇' ? 'As des conversions !' : R.medal === '🥈' ? 'Très beau travail !' : 'Série terminée !';
                return h + `<div class="cvl-final"><div class="medal">${R.medal}</div><div style="font-size:26px;font-weight:900">${title}</div>
                    <div style="font-size:18px;font-weight:800">${R.stars} ⭐ sur ${max}</div>
                    <button class="cvl-btn go" data-act="regen">🔄 Nouvelle série</button></div>`;
            }
            const q = R.qs[R.qi], p = plan(q), U = UNITS[q.t], ph = R.phase;
            const afterUnit = ph !== 'unit';
            const showTo = ['zeros', 'write', 'won'].indexOf(ph) !== -1;
            const done = ph === 'write' || ph === 'won';
            const numH = afterUnit && p.dp ? struck(p) : esc(fmt(p.raw));
            const res = ph === 'won' ? `<b class="res new">${fmt(p.result)}</b>` : '<b class="q">?</b>';
            h += `<div class="cvl-conv">${numH} ${U[q.f]} = ${res} ${U[q.to]}</div>`;
            h += `<div class="cvl-say ${R.say ? R.say.mood : ''} new">${R.say ? R.say.html : ''}</div>`;
            h += tableHtml(q.t, p, {
                from: afterUnit, to: showTo, digits: afterUnit, dNew: R.anim === 'digits',
                zeros: ph === 'zeros' ? R.uz : (done ? p.zeros : []), zNew: !!R.zfix, zNewCol: R.lastZ, zMarks: R.zm,
                comma: done, cNew: R.anim === 'comma', click: ['unit', 'to', 'zeros'].indexOf(ph) !== -1, bad: R.bad
            });
            R.anim = null; R.bad = null; R.lastZ = null; R.zfix = false;   // les animations ne se rejouent pas au prochain affichage
            let a = '';
            if (ph === 'unit' || ph === 'to') a = `<button class="cvl-btn alt" data-act="thint">💡 Aide</button><button class="cvl-btn alt" data-act="tskip">⏭ Passer</button>`;
            else if (ph === 'zeros') a = `<button class="cvl-btn go" data-act="tzval">✔ Valider les zéros</button><button class="cvl-btn alt" data-act="tzclear">🧹 Effacer les 0</button><button class="cvl-btn alt" data-act="thint">💡 Aide</button><button class="cvl-btn alt" data-act="tskip">⏭ Passer</button>`;
            else if (ph === 'write') a = `<div class="cvl-write">${numH} ${U[q.f]} = <input class="cvl-tin" value="${esc(R.inp)}" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="?"> ${U[q.to]}</div>
                <button class="cvl-btn go" data-act="tcheck">✔ Vérifier</button><button class="cvl-btn alt" data-act="thint">💡 Aide</button>`;
            else if (ph === 'won') a = `<button class="cvl-btn go" data-act="tnext">${R.qi >= R.qs.length - 1 ? '🏁 Voir le bilan' : 'Question suivante ➜'}</button>
                <button class="cvl-btn alt" data-act="view" data-i="${R.qi}">🎬 Revoir l'animation</button>`;
            h += `<div class="cvl-actions">${a}</div>`;
            return h;
        }
        function scoreOf(R) {
            if (R.type === 'qcm') return { ok: R.qs.filter((q, i) => R.ans[i] === plan(q).result).length, n: R.qs.length };
            return { ok: R.qs.filter((q, i) => canon(R.ans[i]) === plan(q).result).length, n: R.qs.length };
        }
        function renderSerie(R) {
            const sc = R.corrected ? scoreOf(R) : null;
            const title = R.type === 'qcm' ? '🔍 Choisir la bonne réponse' : '✍️ Écrire le résultat';
            let h = `<div class="cvl-topbar"><span class="cvl-pill">${title} · ${R.qs.length} questions</span>
                ${sc ? `<span class="cvl-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="cvl-actions">
                <button class="cvl-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="cvl-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="cvl-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div><div class="cvl-grid">`;
            R.qs.forEach((q, i) => {
                const p = plan(q), U = UNITS[q.t];
                const a = R.ans[i];
                let cls = '', mark = '', sol = '';
                const ok = R.type === 'qcm' ? a === p.result : canon(a) === p.result;
                if (R.corrected) { cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌'; }
                h += `<div class="cvl-q ${cls}"><div class="cvl-qtop"><span class="cvl-qnum">${i + 1})</span>${MES[q.t].label}<span style="margin-left:auto">${mark}</span></div>`;
                if (R.type === 'qcm') {
                    h += `<div class="cvl-qline">${fmt(p.raw)} ${U[q.f]} = <b style="color:#9aa7bf">?</b> ${U[q.to]}</div><div class="cvl-choices">` +
                        (q.opts || []).map(o => {
                            let c = a === o ? 'on' : '';
                            if (R.corrected) c = o === p.result ? 'good' : (a === o ? 'bad' : '');
                            return `<button class="cvl-choice ${c}" data-act="ans" data-i="${i}" data-v="${o}">${fmt(o)} ${U[q.to]}</button>`;
                        }).join('') + `</div>`;
                } else {
                    if (R.corrected && !ok) sol = `<div class="cvl-sol">→ ${fmt(p.raw)} ${U[q.f]} = ${fmt(p.result)} ${U[q.to]}</div>`;
                    h += `<div class="cvl-qline">${fmt(p.raw)} ${U[q.f]} = <input class="cvl-in ${cls}" data-i="${i}" value="${esc(a || '')}" inputmode="decimal" placeholder="…" autocomplete="off" spellcheck="false" ${R.corrected ? 'disabled' : ''}> ${U[q.to]}</div>${sol}`;
                }
                if (R.corrected) h += `<button class="cvl-view" data-act="view" data-i="${i}">🎬 Voir dans le tableau</button>`;
                h += `</div>`;
            });
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="cvl-train">${renderSettings()}`;
            if (S.run) {
                h += `<div style="--f:${S.font}px;--tf:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
                h += S.run.type === 'tableau' ? renderTableauRun(S.run) : renderSerie(S.run);
                h += `</div>`;
            } else if (!S.settingsOpen || !msg) h += `<div class="cvl-info">Choisis l'exercice et ses réglages, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }
        function renderOverlay() {
            const R = S.run;
            if (S.tab === 'train' && R && R.view != null && R.qs && R.qs[R.view]) {
                ov.innerHTML = `<div class="cvl-ovbox"><div class="cvl-ovhead">🎬 Question ${R.view + 1} dans le tableau
                    <button class="cvl-btn alt small" style="margin-left:auto" data-act="vclose">✖ Fermer</button></div>
                    ${demoHtml(R.qs[R.view], R.vstep)}</div>`;
                ov.classList.add('show');
            } else {
                ov.classList.remove('show');
                ov.innerHTML = '';
            }
        }

        function render() {
            container.querySelectorAll('.cvl-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : renderLesson();
            body.scrollTop = top;
            renderOverlay();
        }
        function focusWrite() {
            if (_isPhone()) return;
            const inp = body.querySelector('.cvl-tin');
            if (inp) try { inp.focus({ preventScroll: true }); } catch (e) {}
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'cvl-confetti';
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
            if (['dplay', 'dnext', 'dprev', 'sound', 'help'].indexOf(a) === -1) stopPlay();
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '📐 Les conversions', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'ttype': S.tabType = el.dataset.v; break;
                case 'lex': {
                    const L = S.les[S.lesson];
                    if (L) { L.ex = +el.dataset.i; L.step = 0; }
                    break;
                }
                // Démonstration animée
                case 'dnext': stopPlay(); demoMove(1); break;
                case 'dprev': stopPlay(); demoMove(-1); break;
                case 'dreset': { const c = demoCtx(); if (c) { c.holder[c.key] = 0; lastDemoKey = ''; } break; }
                case 'dplay': if (playT) stopPlay(); else startPlay(); break;
                // Mon exemple
                case 'atype': S.atl.t = el.dataset.v; S.atl.f = 3; S.atl.to = 5; S.atl.cur = null; S.atl.step = 0; break;
                case 'aplay': {
                    const inp = body.querySelector('.cvl-atl-v');
                    if (inp) S.atl.v = inp.value;
                    S.atl.cur = { t: S.atl.t, v: S.atl.v, f: +S.atl.f, to: +S.atl.to };
                    S.atl.step = 0; lastDemoKey = '';
                    if (!plan(S.atl.cur).err) startPlay();
                    break;
                }
                // Exercices : réglages
                case 'practice':
                    ex.type = el.dataset.v;
                    if (el.dataset.l) ex.level = +el.dataset.l;
                    ex.mes = el.dataset.m || (ex.mes === 'aires' ? 'longueurs' : ex.mes);
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'etype': ex.type = el.dataset.v; msg = ''; break;
                case 'emes': ex.mes = el.dataset.v; break;
                case 'elevel': ex.level = +el.dataset.v; break;
                case 'ent': ex.nt = +el.dataset.v; break;
                case 'enq': ex.nq = +el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                // Série (écrire / QCM)
                case 'clear':
                    if (!R || R.type === 'tableau') return;
                    R.ans = []; R.corrected = false; R.view = null;
                    break;
                case 'correct': {
                    if (!R || R.type === 'tableau') return;
                    R.corrected = !R.corrected; R.view = null;
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
                case 'view': if (!R) return; R.view = +el.dataset.i; R.vstep = 0; lastDemoKey = ''; break;
                case 'vclose': if (!R) return; R.view = null; break;
                // Dans le tableau
                case 'tcell': if (R && R.type === 'tableau') tCell(R, +el.dataset.c); else return; break;
                case 'tzval': if (R && R.type === 'tableau' && R.phase === 'zeros') tZerosCheck(R); break;
                case 'tzclear': if (R && R.type === 'tableau' && R.phase === 'zeros') { R.uz = []; R.zm = null; } break;
                case 'tcheck': {
                    if (!R || R.type !== 'tableau' || R.phase !== 'write') return;
                    const inp = body.querySelector('.cvl-tin');
                    if (inp) R.inp = inp.value;
                    tCheck(R);
                    break;
                }
                case 'thint': if (R && R.type === 'tableau') tHint(R); break;
                case 'tskip': {
                    if (!R || R.type !== 'tableau') return;
                    const q = R.qs[R.qi], p = plan(q), U = UNITS[q.t];
                    R.results[R.qi] = 'meh';
                    const sol = `⏭ La réponse était : <b>${fmt(p.raw)} ${U[q.f]} = ${fmt(p.result)} ${U[q.to]}</b>`;
                    tNext(R);
                    if (R.phase === 'unit') R.say.html = sol + '<br>' + R.say.html;
                    break;
                }
                case 'tnext': if (R && R.type === 'tableau') tNext(R); break;
                default: return;
            }
            render(); save();
            if (R && R.type === 'tableau' && R.phase === 'write' && (a === 'tzval' || a === 'thint')) focusWrite();
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
            if (!e.target.closest('.cvl-help') && !e.target.closest('[data-act="help"]')) help.classList.remove('show');
            // Seule la barre de titre (hors boutons) sert à déplacer le widget
            if (e.target.closest('.cvl-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.cvl-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Saisie (sans tout redessiner)
        container.addEventListener('input', e => {
            const t = e.target, R = S.run;
            if (t.classList.contains('cvl-in') && R) { R.ans[+t.dataset.i] = t.value; saveSoon(); }
            else if (t.classList.contains('cvl-tin') && R) { R.inp = t.value; saveSoon(); }
            else if (t.classList.contains('cvl-atl-v')) { S.atl.v = t.value; saveSoon(); }
        });
        container.addEventListener('change', e => {
            const t = e.target;
            if (t.tagName === 'SELECT' && t.dataset.f) { S.atl[t.dataset.f] = +t.value; save(); }
        });
        container.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const t = e.target;
            if (t.classList.contains('cvl-tin')) { e.preventDefault(); act('tcheck'); focusWrite(); }
            else if (t.classList.contains('cvl-atl-v')) { e.preventDefault(); act('aplay'); }
            else if (t.classList.contains('cvl-in')) {
                e.preventDefault();
                const ins = Array.from(body.querySelectorAll('.cvl-in:not([disabled])'));
                const next = ins[ins.indexOf(t) + 1];
                if (next) next.focus(); else t.blur();
            }
        });

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
        widget._cvlGetData = function () {
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
            if (type === TYPE) return window.createConversionLeconWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
