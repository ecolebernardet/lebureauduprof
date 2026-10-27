// =========================================================================
// ACTIVITÉ « OPÉRATIONS POSÉES » — Le Bureau du Prof
// Leçons animées + exercices corrigés (même présentation que « La phrase »).
//
// 📖 Leçons : addition, soustraction, multiplication, division posées.
//    Chaque leçon a une démonstration animée pas à pas : les chiffres
//    s'écrivent un à un, les retenues « tombent » au-dessus des colonnes,
//    une bulle explique chaque étape (lecture à voix haute possible).
//    Le prof peut poser sa propre opération (ex. « 4572 + 389 »).
// ✏️ Exercices : « l'élève propose, le tableau vérifie ».
//    L'élève touche une case et écrit avec le pavé numérique (ou le clavier),
//    puis ✔ Vérifier colorie les chiffres justes / faux. 💡 Indice remplit la
//    case suivante en expliquant l'étape. 🎬 Correction rejoue l'opération.
//    Séries de 3, 5 ou 8 opérations, étoiles et médaille.
//
// Méthodes : soustraction par compensation (« retenue ») ou par emprunt
// (« cassage ») ; division euclidienne en potence, avec ou sans les
// soustractions intermédiaires.
//
// Ouverture : createWidget('operations-posees')  ou  createOperationsPoseesWidget()
// Sauvegarde : w._opGetData()  /  createOperationsPoseesWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'operations-posees';

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

    // ── CSS (préfixe opp-) ────────────────────────────────────────────────
    if (!document.getElementById('opp-style')) {
        const s = document.createElement('style');
        s.id = 'opp-style';
        s.textContent = `
.widget[data-type="operations-posees"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.opp-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC; --ret:#E23D4F;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.opp-container input, .opp-container textarea { user-select:text; -webkit-user-select:text; }
.opp-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .opp-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .opp-tab-lbl { display:none; }
    .opp-title { font-size:17px !important; }
    .opp-lesson { flex-direction:column; }
    .opp-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .opp-gbtn { flex:1 1 auto; text-align:center !important; }
    .opp-srow > .l { min-width:0 !important; width:100%; }
    .opp-pad { grid-template-columns:repeat(3, 46px) !important; }
    .opp-key { height:46px !important; font-size:20px !important; }
}
.opp-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.opp-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.opp-tabs { display:flex; gap:6px; margin-left:12px; }
.opp-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.opp-tab:hover { background:rgba(255,255,255,.1); }
.opp-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.opp-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.opp-icon-btn:hover { background:rgba(255,255,255,.28); }
.opp-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* ── Leçons ── */
.opp-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.opp-side { width:200px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.opp-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.opp-gbtn:hover { transform:translateX(2px); }
.opp-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.opp-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.opp-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.opp-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.opp-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.opp-box ol, .opp-box ul { margin:4px 0 0; padding-left:22px; }
.opp-what { background:#f1edff; border:2px solid #c8bbf5; }
.opp-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.opp-memo { background:#fff6d6; border:2px solid #f3d36b; }
.opp-trap { background:#ffecee; border:2px solid #f6a7b0; }
.opp-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.opp-r { color:var(--ret); font-weight:900; }
.opp-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.opp-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.opp-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.opp-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.opp-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.opp-btn:disabled { opacity:.45; }

/* ── Démonstration ── */
.opp-demo { background:#fff; border:3px solid var(--c,#c8bbf5); border-radius:18px; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
.opp-demo-top { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.opp-demo-in { flex:1 1 180px; min-width:150px; box-sizing:border-box; font:inherit; font-size:20px; font-weight:800; padding:6px 12px; border:2px solid #d9cdb6;
    border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; }
.opp-demo-in:focus { border-color:var(--violet); }
.opp-say { border-radius:14px; padding:8px 14px; font-size:17px; line-height:1.5; text-align:center; background:#f1edff; border:2px solid #c8bbf5; min-height:28px; }
.opp-say.good { background:#e2f7ec; border-color:#8fd8b0; }
.opp-say.bad { background:#ffe9eb; border-color:#f6a7b0; }
.opp-ctrl { display:flex; gap:6px; justify-content:center; align-items:center; flex-wrap:wrap; }
.opp-stepn { font-weight:900; font-size:14px; color:#6a6380; min-width:90px; text-align:center; }

/* ── Grille de l'opération ── */
.opp-gwrap { display:flex; justify-content:center; padding:8px 4px; overflow:hidden; }
.opp-grid { --cs:52px; display:grid; position:relative; font-family:'Andika','Nunito',sans-serif; flex-shrink:0; }
.opp-tint { border-radius:7px; z-index:0; margin:0 2px; opacity:.85; }
.opp-head { z-index:1; display:flex; align-items:center; justify-content:center; font-size:calc(var(--cs) * .3); font-weight:900; color:#7b7393; font-family:'Nunito',sans-serif; }
.opp-c { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; font-size:calc(var(--cs) * .74); font-weight:800; line-height:1; color:var(--encre); border-radius:8px; }
.opp-c.sol { color:#3949AB; }
.opp-c.pad { color:#b5aec7; }
.opp-sign { font-size:calc(var(--cs) * .7); font-weight:900; color:#5a5470; }
.opp-comma { font-size:calc(var(--cs) * .74); font-weight:900; align-items:flex-end; padding-bottom:calc(var(--cs) * .12); justify-content:center; }
.opp-car { font-size:calc(var(--cs) * .44); color:var(--ret); font-weight:900; align-self:end; }
.opp-car.blue { color:#2F80ED; }
.opp-car.side { align-self:center; font-size:calc(var(--cs) * .46); }
.opp-c.box.mini.side { margin:6px 3px; }
.opp-sidehead { z-index:1; display:flex; align-items:end; justify-content:center; font-size:calc(var(--cs) * .26); font-weight:900; color:var(--ret); font-family:'Nunito',sans-serif; opacity:.75; white-space:nowrap; }
.opp-sidesep { z-index:1; border-left:2px dashed #e3b7bd; justify-self:center; }
.opp-b { position:relative; z-index:3; font-size:calc(var(--cs) * .34); color:var(--ret); font-weight:900; line-height:1; font-family:'Nunito',sans-serif; }
.opp-b.tl { justify-self:start; align-self:center; font-size:calc(var(--cs) * .42); margin:0 0 0 calc(var(--cs) * -.04); }
.opp-b.bc { justify-self:center; align-self:center; font-size:calc(var(--cs) * .38); }
.opp-c.struck { color:#aaa3bd; text-decoration:line-through; text-decoration-thickness:3px; text-decoration-color:var(--ret); }
.opp-c.faded { opacity:.3; }
.opp-line { z-index:2; background:var(--encre); height:4px; align-self:end; border-radius:2px; margin-bottom:-2px; }
.opp-arrow { z-index:2; justify-self:center; width:12px; position:relative; pointer-events:none;
    margin:calc(var(--cs) * .8) 0 calc(var(--cs) * .84); transform-origin:top; }
.opp-arrow::before { content:''; position:absolute; left:5px; top:0; bottom:5px; width:2px; border-radius:1px; background:#8a7fb0; }
.opp-arrow::after { content:''; position:absolute; left:1px; bottom:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid #8a7fb0; }
.opp-arrow.new { animation:opp-grow .6s ease-out; }
@keyframes opp-grow { 0% { transform:scaleY(0); opacity:0; } 100% { transform:scaleY(1); opacity:1; } }
.opp-vline { z-index:2; background:var(--encre); width:4px; justify-self:start; border-radius:2px; margin-left:-2px; }
.opp-c.hl, .opp-b.hl { background:#FFE58A; box-shadow:0 0 0 3px #FFE58A; }
.opp-c.new { animation:opp-pop .45s ease-out; }
.opp-c.new.fall, .opp-b.new { animation:opp-fall .75s cubic-bezier(.3,1.5,.5,1); }
@keyframes opp-pop { 0% { transform:scale(.2); opacity:0; } 70% { transform:scale(1.18); opacity:1; } 100% { transform:scale(1); } }
@keyframes opp-fall { 0% { transform:translateY(-180%); opacity:0; } 60% { opacity:1; } 100% { transform:translateY(0); opacity:1; } }
/* Cases à remplir */
.opp-c.box { margin:3px; border:2px dashed #b9abef; background:#fff; color:#3949AB; }
.opp-c.box.mini { margin:2px 7px; font-size:calc(var(--cs) * .4); border-width:2px; align-self:stretch; }
.opp-c.box.sel { border:3px solid var(--violet); background:#f3efff; box-shadow:0 0 0 4px #ddd3fb; }
.opp-c.box.ok { border:2px solid var(--vert); background:#e2f7ec; color:#178a4b; }
.opp-c.box.ko { border:2px solid var(--rouge); background:#ffe9eb; color:#c0293a; }
.opp-c.box.lock { cursor:default; }
.opp-b.tog { width:calc(var(--cs) * .38); height:calc(var(--cs) * .38); font-size:calc(var(--cs) * .28); border:2px dashed #f0a2ab; border-radius:50%; background:#fff;
    display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
.opp-b.tog.on { border-style:solid; background:#ffe9eb; }
/* Pavé numérique */
.opp-play { display:flex; gap:14px; align-items:flex-start; justify-content:center; flex-wrap:wrap; }
.opp-play > .opp-gwrap { flex:1 1 320px; min-width:0; }
.opp-pad { display:grid; grid-template-columns:repeat(3, 58px); gap:8px; padding:10px; background:#fff; border:2px solid #e3d8c3; border-radius:16px; flex-shrink:0; }
.opp-key { height:58px; border:none; border-radius:12px; background:#f1edff; color:var(--encre); font:inherit; font-size:26px; font-weight:900;
    box-shadow:0 3px 0 #cfc3f7; touch-action:manipulation; font-family:'Andika','Nunito',sans-serif; }
.opp-key:active { transform:translateY(2px); box-shadow:0 1px 0 #cfc3f7; }
.opp-key.fn { background:#fff6d6; box-shadow:0 3px 0 #f3d36b; font-size:20px; }
.opp-key:disabled { opacity:.4; }

/* ── Exercices ── */
.opp-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.opp-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.opp-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.opp-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.opp-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.opp-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.opp-hint { font-size:12.5px; color:#6a6380; }
.opp-mine { width:100%; box-sizing:border-box; min-height:100px; resize:vertical; font:inherit; font-size:18px; font-weight:700; padding:8px 10px;
    border:2px solid #d9cdb6; border-radius:12px; outline:none; color:var(--encre); background:#fffdf8; }
.opp-mine:focus { border-color:var(--violet); }
.opp-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.opp-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.opp-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.opp-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.opp-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.opp-dots { display:flex; gap:4px; flex-wrap:wrap; }
.opp-dot { width:13px; height:13px; border-radius:50%; background:#e3d8c3; }
.opp-dot.good { background:var(--vert); } .opp-dot.meh { background:#FFB020; } .opp-dot.cur { background:var(--violet); box-shadow:0 0 0 3px #cfc3f7; }
.opp-final { text-align:center; display:flex; flex-direction:column; gap:8px; align-items:center; }
.opp-final .medal { font-size:60px; }
.opp-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:opp-conf 1.6s ease-in forwards; }
@keyframes opp-conf { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.opp-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.opp-help.show { display:block; }
.opp-help h4 { margin:0 0 6px; font-size:15px; }
.opp-help p { margin:0 0 6px; }
.opp-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.opp-container:hover .opp-resize { opacity:1; }
.opp-container.wf-fullboard .opp-resize { display:none; }
@media (prefers-reduced-motion: reduce) { .opp-c.new, .opp-b.new { animation:none !important; } }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="operations-posees"], .opp-container, .opp-container * { cursor:default !important; }
.opp-container .opp-header { cursor:grab !important; }
.opp-container .opp-header:active { cursor:grabbing !important; }
.opp-container button, .opp-container [data-act] { cursor:pointer !important; }
.opp-container button:disabled { cursor:default !important; }
.opp-container input, .opp-container textarea { cursor:text !important; }
.opp-container .opp-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // OUTILS
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const R = t => `<span class="opp-r">${t}</span>`;

    const OPS = {
        add: { label: 'Addition',       sym: '+', icon: '➕', color: '#2F80ED' },
        sub: { label: 'Soustraction',   sym: '−', icon: '➖', color: '#EB5757' },
        mul: { label: 'Multiplication', sym: '×', icon: '✖️', color: '#27AE60' },
        div: { label: 'Division',       sym: '÷', icon: '➗', color: '#9B51E0' }
    };
    const LEVELS = { 1: { label: '😊 Facile', color: '#2FBF71' }, 2: { label: '😐 Moyen', color: '#F2994A' }, 3: { label: '😤 Difficile', color: '#EB5757' } };

    const PLACE_N = ['unités', 'dizaines', 'centaines', 'unités de mille', 'dizaines de mille', 'centaines de mille', 'unités de millions'];
    const PLACE_S = ['unité', 'dizaine', 'centaine', 'unité de mille', 'dizaine de mille', 'centaine de mille', 'unité de millions'];
    const PLACE_L = ['u', 'd', 'c', 'um', 'dm', 'cm', 'uM'];
    const DEC_N = ['dixièmes', 'centièmes', 'millièmes'];
    const DEC_S = ['dixième', 'centième', 'millième'];
    const DEC_L = ['1/10', '1/100', '1/1000'];
    const TINTS = ['#e3eeff', '#ffe4e4', '#e2f5e8', '#fff3c9', '#ece6ff', '#ffe3f2', '#dff3f3'];
    const placeN = k => k >= 0 ? (PLACE_N[k] || '') : (DEC_N[-k - 1] || '');
    const placeS = k => k >= 0 ? (PLACE_S[k] || '') : (DEC_S[-k - 1] || '');
    const placeL = k => k >= 0 ? (PLACE_L[k] || '') : (DEC_L[-k - 1] || '');
    const tint = k => k >= 0 ? TINTS[k % TINTS.length] : (k === -1 ? '#eef2f7' : '#f4eef7');
    // Article devant le nom de la colonne : « des unités », « des dizaines »…
    const ofPlace = k => 'des ' + placeN(k);

    // Nombre décimal « mis à l'échelle » → texte français (« 12,5 »)
    function fmt(n, dec) {
        const s = String(n).padStart(dec + 1, '0');
        return dec ? s.slice(0, -dec) + ',' + s.slice(-dec) : s;
    }
    const digitsOf = (n, dec) => String(n).padStart(dec + 1, '0');
    function dAt(str, p) { const i = str.length - 1 - p; return i >= 0 ? +str[i] : null; }

    // =====================================================================
    // LECTURE D'UNE OPÉRATION ÉCRITE (« 4572 + 389 », « 347 x 26 », « 1957 : 7 »)
    // =====================================================================
    function cleanNum(s) {
        let [i, f] = s.split(',');
        i = i.replace(/^0+(?=\d)/, '');
        if (f !== undefined) { f = f.replace(/0+$/, ''); return f ? i + ',' + f : i; }
        return i;
    }
    function parseOp(line) {
        let s = String(line || '').trim().replace(/\s+/g, '')
            .replace(/[×xX*]/g, '×').replace(/[÷:\/]/g, '÷').replace(/[−–—]/g, '-').replace(/\./g, ',');
        if (!s) return null;
        const NUM = '\\d+(?:,\\d+)?';
        let m;
        if (s.indexOf('+') !== -1) {
            const parts = s.split('+');
            if (parts.length < 2 || parts.length > 4 || !parts.every(p => new RegExp('^' + NUM + '$').test(p))) return { err: 'Addition illisible : « ' + line + ' »' };
            const nums = parts.map(cleanNum);
            if (nums.some(n => n.replace(',', '').length > 8)) return { err: 'Nombres trop grands : « ' + line + ' »' };
            return { op: 'add', nums };
        }
        if ((m = s.match(new RegExp('^(' + NUM + ')-(' + NUM + ')$')))) {
            const a = cleanNum(m[1]), b = cleanNum(m[2]);
            const sc = scaleAll([a, b]);
            if (sc.vals[0] < sc.vals[1]) return { err: 'Soustraction : le premier nombre doit être le plus grand (« ' + line + ' »).' };
            if (a.replace(',', '').length > 8) return { err: 'Nombres trop grands : « ' + line + ' »' };
            return { op: 'sub', nums: [a, b] };
        }
        if ((m = s.match(/^(\d+)×(\d+)$/))) {
            const a = cleanNum(m[1]), b = cleanNum(m[2]);
            if (+b === 0 || +a === 0) return { err: 'Multiplication par 0 : rien à poser (« ' + line + ' »).' };
            if (a.length > 6 || b.length > 3) return { err: 'Multiplication trop grande (6 chiffres × 3 chiffres au plus).' };
            return { op: 'mul', nums: [a, b] };
        }
        if ((m = s.match(/^(\d+)÷(\d+)$/))) {
            const a = cleanNum(m[1]), b = cleanNum(m[2]);
            if (+b === 0) return { err: 'On ne peut pas diviser par 0 !' };
            if (a.length > 6 || b.length > 3) return { err: 'Division trop grande (6 chiffres ÷ 3 chiffres au plus).' };
            return { op: 'div', nums: [a, b] };
        }
        if (/,/.test(s) && /[×÷]/.test(s)) return { err: 'Multiplications et divisions : nombres entiers seulement (« ' + line + ' »).' };
        return { err: 'Opération illisible : « ' + line + ' ». Exemples : 4572 + 389 · 503 - 47 · 347 x 26 · 1957 : 7' };
    }
    function scaleAll(strs) {
        const parts = strs.map(s => { const [i, f = ''] = String(s).split(','); return { i, f }; });
        const D = Math.max(...parts.map(p => p.f.length));
        return { D, vals: parts.map(p => parseInt(p.i + p.f.padEnd(D, '0'), 10)), decs: parts.map(p => p.f.length) };
    }
    const specText = sp => sp.op === 'add' ? sp.nums.join(' + ') : sp.nums[0] + ' ' + OPS[sp.op].sym + ' ' + sp.nums[1];

    // =====================================================================
    // MOTEUR : construit la « pose » de l'opération et ses étapes
    //   L.items : cases (chiffres, signes, retenues…) avec l'étape où elles
    //             apparaissent ; ans = case à remplir par l'élève.
    //   L.lines : traits ; L.steps : explications étape par étape.
    // =====================================================================
    function newL(op) { return { op, cols: [{ w: 1 }], rows: [], items: [], lines: [], steps: [], slots: [] }; }
    function addRow(L, h) { L.rows.push(h); return L.rows.length - 1; }
    function put(L, o) { o.id = 'c' + L.items.length; if (o.step === undefined) o.step = 0; L.items.push(o); return o.id; }
    function step(L, t, hl) { L.steps.push({ t, hl: (hl || []).filter(Boolean) }); return L.steps.length - 1; }
    function byId(L, id) { return L.items[+id.slice(1)]; }
    // Colonnes de chiffres : position p (0 = chiffre le plus à droite) → index de colonne
    function setCols(L, W, dec) {
        for (let p = W - 1; p >= 0; p--) {
            L.cols.push({ w: 1, k: p - dec });
            if (dec > 0 && p === dec) L.cols.push({ w: .42, comma: true });
        }
        L.cols.push({ w: .35 });
        L.commaCol = dec > 0 ? W - dec + 1 : -1;
        return p => 1 + (W - 1 - p) + (dec > 0 && p < dec ? 1 : 0);
    }
    // Cases du résultat qui doivent rester vides (pas de 0 devant un nombre)
    function blanks(L, row, col, from, to, st) {
        for (let p = from; p <= to; p++) put(L, { r: row, c: col(p), ch: '', k: 'd', ans: 1, expect: '', alt: ['0'], step: st });
    }

    // ── Addition ────────────────────────────────────────────────────────
    function buildAdd(numStrs) {
        const L = newL('add');
        const { D: dec, vals, decs } = scaleAll(numStrs);
        const S = vals.reduce((a, b) => a + b, 0);
        const strs = vals.map(n => digitsOf(n, dec)), sStr = digitsOf(S, dec);
        const Lmax = Math.max(...strs.map(s => s.length));
        const W = Math.max(Lmax + 1, sStr.length);
        const col = setCols(L, W, dec);
        const rC = addRow(L, .62);
        const rN = vals.map(() => addRow(L, 1));
        const rR = addRow(L, 1);
        const ids = vals.map(() => ({}));
        strs.forEach((s, i) => {
            for (let p = 0; p < s.length; p++) ids[i][p] = put(L, { r: rN[i], c: col(p), ch: String(dAt(s, p)), k: 'd', g: 1, cls: p < dec - decs[i] ? 'pad' : '' });
            if (dec) put(L, { r: rN[i], c: L.commaCol, ch: ',', k: 'comma', g: 1 });
        });
        put(L, { r: rN[rN.length - 1], c: 0, ch: '+', k: 'sign', g: 1 });
        L.lines.push({ r: rN[rN.length - 1], c1: 0, c2: L.cols.length - 2, g: 1 });
        if (dec) put(L, { r: rR, c: L.commaCol, ch: ',', k: 'comma', g: 1 });
        const padded = decs.some(d => d < dec);
        step(L, `On pose l'addition : les chiffres de même rang sont alignés, les unités sous les unités${dec ? ', et <b>les virgules sous les virgules</b>' + (padded ? ' (j\'ajoute des 0 en gris pour avoir autant de chiffres après la virgule)' : '') : ''}. Je commence par la colonne de droite.`);
        for (let p = 1; p < W; p++) L.slots.push({ r: rC, c: col(p), k: 'car' });
        let carry = 0, carryId = null;
        for (let p = 0; p < Lmax; p++) {
            const parts = [], hl = [];
            if (carry) { parts.push(R(carry)); hl.push(carryId); }
            let sum = carry;
            strs.forEach((s, i) => { const d = dAt(s, p); if (d !== null) { parts.push(d); sum += d; hl.push(ids[i][p]); } });
            const digit = sum % 10, nc = Math.floor(sum / 10);
            const st = L.steps.length;
            put(L, { r: rR, c: col(p), ch: String(digit), k: 'd', ans: 1, expect: String(digit), step: st });
            let ncId = null;
            if (nc) ncId = put(L, { r: rC, c: col(p + 1), ch: String(nc), k: 'car', ans: 1, opt: 1, expect: String(nc), step: st });
            let t = `Colonne ${ofPlace(p - dec)} : `;
            if (parts.length === 1) t += `il n'y a que ${parts[0]} : j'écris <b>${digit}</b>.`;
            else t += `${parts.join(' + ')} = <b>${sum}</b>. ` + (nc ? `J'écris <b>${digit}</b> et je retiens ${R(nc)} en haut de la colonne ${ofPlace(p + 1 - dec)}.` : `J'écris <b>${digit}</b>.`);
            step(L, t, hl);
            carry = nc; carryId = ncId;
        }
        let top = Lmax - 1;
        if (carry) {
            const st = L.steps.length;
            put(L, { r: rR, c: col(Lmax), ch: String(carry), k: 'd', ans: 1, expect: String(carry), step: st });
            step(L, `Il n'y a plus de chiffres à additionner : j'abaisse la retenue ${R(carry)} dans la colonne ${ofPlace(Lmax - dec)}.`, [carryId]);
            top = Lmax;
        }
        blanks(L, rR, col, top + 1, W - 1, L.steps.length - 1);
        step(L, `✅ ${vals.map(v => fmt(v, dec)).join(' + ')} = <b>${fmt(S, dec)}</b>. Je vérifie avec un ordre de grandeur : le résultat doit être proche de ${vals.map(v => approx(v / 10 ** dec)).join(' + ')}.`);
        L.summary = vals.map(v => fmt(v, dec)).join(' + ') + ' = ' + fmt(S, dec);
        return L;
    }
    function approx(x) {
        if (x < 10) return String(Math.round(x));
        const p = 10 ** (Math.floor(Math.log10(x)) - 1);
        return String(Math.round(x / p) * p);
    }

    // ── Soustraction ────────────────────────────────────────────────────
    function buildSub(numStrs, method) {
        const L = newL('sub');
        const { D: dec, vals, decs } = scaleAll(numStrs);
        const [a, b] = vals, Rv = a - b;
        const aS = digitsOf(a, dec), bS = digitsOf(b, dec), rS = digitsOf(Rv, dec);
        const W = aS.length;
        const col = setCols(L, W, dec);
        const emp = method === 'emp';
        const rE = emp ? addRow(L, .62) : -1;
        const rA = addRow(L, 1), rB = addRow(L, 1);
        const rU = emp ? -1 : addRow(L, .5);   // « +1 » écrit sous le chiffre du bas
        const rR = addRow(L, 1);
        const aId = {}, bId = {};
        for (let p = 0; p < aS.length; p++) aId[p] = put(L, { r: rA, c: col(p), ch: String(dAt(aS, p)), k: 'd', g: 1, cls: p < dec - decs[0] ? 'pad' : '' });
        for (let p = 0; p < bS.length; p++) bId[p] = put(L, { r: rB, c: col(p), ch: String(dAt(bS, p)), k: 'd', g: 1, cls: p < dec - decs[1] ? 'pad' : '' });
        if (dec) [rA, rB, rR].forEach(r => put(L, { r, c: L.commaCol, ch: ',', k: 'comma', g: 1 }));
        put(L, { r: rB, c: 0, ch: '−', k: 'sign', g: 1 });
        L.lines.push({ r: emp ? rB : rU, c1: 0, c2: L.cols.length - 2, g: 1 });
        step(L, `On pose la soustraction : le plus grand nombre en haut, les chiffres de même rang alignés${dec ? ', <b>les virgules sous les virgules</b>' : ''}. Je commence par la colonne de droite.`);
        const writeDigit = (p, digit, st) => {
            if (p < rS.length) put(L, { r: rR, c: col(p), ch: String(digit), k: 'd', ans: 1, expect: String(digit), step: st });
            else put(L, { r: rR, c: col(p), ch: '', k: 'd', ans: 1, expect: '', alt: ['0'], step: st });
        };
        for (let p = 0; p < W - 1; p++) L.slots.push({ r: rA, c: col(p), k: 'b', pos: 'tl' });
        for (let p = 1; p < W; p++) L.slots.push(emp ? { r: rE, c: col(p), k: 'car', cls: 'blue' } : { r: rU, c: col(p), k: 'b', pos: 'bc' });
        const zeroNote = p => p >= rS.length ? ' Je n\'écris pas de 0 devant un nombre.' : '';
        if (!emp) {
            // Méthode par compensation (« retenue ») : +10 en haut, +1 en bas à gauche
            let borrow = 0, borrowId = null;
            for (let p = 0; p < W; p++) {
                const t = dAt(aS, p), u0 = dAt(bS, p), u = (u0 || 0) + borrow;
                const st = L.steps.length;
                const hl = [aId[p], bId[p], borrowId];
                let digit, txt = `Colonne ${ofPlace(p - dec)} : `, nb = 0, nbId = null;
                if (borrow) txt += u0 === null ? `en bas, il y a seulement la retenue ${R(1)}. ` : `en bas, ${u0} + ${R(1)} = ${u}. `;
                if (u === 0) { digit = t; txt += `il n'y a rien à enlever : j'écris <b>${t}</b>.`; }
                else if (t >= u) { digit = t - u; txt += `${t} − ${u} = <b>${digit}</b>.`; }
                else {
                    digit = t + 10 - u; nb = 1;
                    put(L, { r: rA, c: col(p), ch: '1', k: 'b', pos: 'tl', ans: 1, opt: 1, expect: '1', step: st });
                    nbId = put(L, { r: rU, c: col(p + 1), ch: '+1', k: 'b', pos: 'bc', ans: 1, opt: 1, expect: '1', step: st });
                    txt += `${t} − ${u} : impossible, ${t} est plus petit que ${u} ! J'ajoute ${R('10')} en haut : ${t + 10} − ${u} = <b>${digit}</b>. Pour compenser, j'ajoute ${R('1')} en bas, dans la colonne ${ofPlace(p + 1 - dec)}.`;
                }
                txt += zeroNote(p);
                writeDigit(p, digit, st);
                step(L, txt, hl);
                borrow = nb; borrowId = nbId;
            }
        } else {
            // Méthode par emprunt (« je casse une dizaine »)
            const w = {}; for (let p = 0; p < W; p++) w[p] = dAt(aS, p);
            const topId = Object.assign({}, aId);
            for (let p = 0; p < W; p++) {
                const u = dAt(bS, p) || 0;
                const st = L.steps.length;
                let txt = `Colonne ${ofPlace(p - dec)} : `, digit;
                const hl = [topId[p], bId[p]];
                if (w[p] < u) {
                    let k = p + 1; while (w[k] === 0) k++;
                    const old = w[k]; w[k] -= 1;
                    byId(L, aId[k]).off = st; byId(L, aId[k]).offType = 'strike';
                    if (topId[k] !== aId[k]) { byId(L, topId[k]).off = st; byId(L, topId[k]).offType = 'strike'; }
                    topId[k] = put(L, { r: rE, c: col(k), ch: String(w[k]), k: 'car', cls: 'blue', ans: 1, opt: 1, expect: String(w[k]), step: st });
                    for (let j = k - 1; j > p; j--) {
                        w[j] = 9;
                        byId(L, aId[j]).off = st; byId(L, aId[j]).offType = 'strike';
                        topId[j] = put(L, { r: rE, c: col(j), ch: '9', k: 'car', cls: 'blue', ans: 1, opt: 1, expect: '9', step: st });
                    }
                    const before = w[p]; w[p] += 10;
                    put(L, { r: rA, c: col(p), ch: '1', k: 'b', pos: 'tl', ans: 1, opt: 1, expect: '1', step: st });
                    digit = w[p] - u;
                    txt += `${before} − ${u} : impossible ! `;
                    if (k === p + 1) txt += `Je casse 1 ${placeS(k - dec)} : ${old} devient ${R(w[k])}, et ${before} devient ${R(w[p])}. `;
                    else txt += `Il n'y a rien à casser dans la colonne ${ofPlace(p + 1 - dec)} : je casse 1 ${placeS(k - dec)} (${old} devient ${R(w[k])}), les 0 deviennent ${R(9)}, et ${before} devient ${R(w[p])}. `;
                    txt += `${w[p]} − ${u} = <b>${digit}</b>.`;
                } else if (u === 0 && dAt(bS, p) === null) { digit = w[p]; txt += `il n'y a rien à enlever : j'écris <b>${digit}</b>.`; }
                else { digit = w[p] - u; txt += `${w[p]} − ${u} = <b>${digit}</b>.`; }
                txt += zeroNote(p);
                writeDigit(p, digit, st);
                step(L, txt, hl);
            }
        }
        step(L, `✅ ${fmt(a, dec)} − ${fmt(b, dec)} = <b>${fmt(Rv, dec)}</b>. Je vérifie : ${fmt(Rv, dec)} + ${fmt(b, dec)} doit redonner ${fmt(a, dec)}.`);
        L.summary = fmt(a, dec) + ' − ' + fmt(b, dec) + ' = ' + fmt(Rv, dec);
        return L;
    }

    // ── Multiplication ──────────────────────────────────────────────────
    function buildMul(numStrs) {
        const L = newL('mul');
        const aS = numStrs[0], bS = numStrs[1];
        const a = +aS, b = +bS, P = a * b;
        const La = aS.length, Lb = bS.length, W = La + Lb;
        const col = setCols(L, W, 0);
        const NZ = []; for (let i = 0; i < Lb; i++) if (dAt(bS, i) !== 0) NZ.push(i);
        const multi = NZ.length > 1;
        const rA = addRow(L, 1), rB = addRow(L, 1);
        const rC2 = multi ? addRow(L, .58) : -1;
        const rP = NZ.map(() => addRow(L, 1));
        const rR = multi ? addRow(L, 1) : rP[0];
        const aId = {}, bId = {};
        for (let p = 0; p < La; p++) aId[p] = put(L, { r: rA, c: col(p), ch: String(dAt(aS, p)), k: 'd', g: 1 });
        for (let p = 0; p < Lb; p++) bId[p] = put(L, { r: rB, c: col(p), ch: String(dAt(bS, p)), k: 'd', g: 1 });
        put(L, { r: rB, c: 0, ch: '×', k: 'sign', g: 1 });
        const lastDigitCol = L.cols.length - 2;
        L.lines.push({ r: rB, c1: 0, c2: lastDigitCol, g: 1 });
        // Zone des retenues, à droite de l'opération : une ligne par produit partiel,
        // la première retenue écrite tout à droite
        const CW = Math.max(1, La - 1);
        L.cols.push({ w: .5 });
        const sideSep = L.cols.length - 1;
        const side0 = L.cols.length;
        for (let q = 0; q < CW; q++) L.cols.push({ w: .62 });
        L.cols.push({ w: .2 });
        const sideCol = q => side0 + (CW - 1 - q);
        L.side = { sep: sideSep, c1: side0, c2: side0 + CW - 1, r1: rP[0], r2: rP[rP.length - 1] };
        step(L, `On pose la multiplication : les unités sous les unités. Je multiplie ${Lb === 1 ? 'le chiffre du bas par chaque chiffre du nombre du haut' : 'par chaque chiffre du nombre du bas, l\'un après l\'autre'}, en commençant par la droite.`);
        // Une retenue utilisée est barrée dès l'étape où on l'ajoute
        const strike = (id, st) => { if (id) { byId(L, id).off = st; byId(L, id).offType = 'strike'; } };
        const partIds = [];
        NZ.forEach((i, j) => {
            const bi = dAt(bS, i), row = rP[j];
            partIds[j] = {};
            if (i > 0) {
                const st = L.steps.length;
                for (let p = 0; p < i; p++) partIds[j][p] = put(L, { r: row, c: col(p), ch: '0', k: 'd', ans: 1, expect: '0', step: st });
                let txt = '';
                const skipped = []; for (let q = (j > 0 ? NZ[j - 1] + 1 : 0); q < i; q++) skipped.push(placeN(q));
                if (skipped.length) txt += `Le chiffre des ${skipped.join(' et des ')} est 0 : je n'ai pas besoin de cette ligne. `;
                txt += `Je multiplie maintenant par le chiffre des ${placeN(i)} : <b>${bi}</b>. Comme ce sont des ${placeN(i)}, je décale : j'écris <b>${i === 1 ? 'un 0' : i + ' zéros'}</b> à droite.`;
                step(L, txt, [bId[i]]);
            } else if (multi) {
                step(L, `Je multiplie d'abord par le chiffre des unités : <b>${bi}</b>.`, [bId[0]]);
            }
            for (let q = 0; q < CW; q++) L.slots.push({ r: row, c: sideCol(q), k: 'car', cls: 'side' });
            let carry = 0, carryId = null;
            let nCar = 0;
            for (let k = 0; k < La; k++) {
                const ak = dAt(aS, k), prod = ak * bi, tot = prod + carry, last = k === La - 1;
                const st = L.steps.length;
                const hl = [aId[k], bId[i], carryId];
                if (carry) strike(carryId, st);
                let txt = `${bi} × ${ak} = ${prod}` + (carry ? `, plus la retenue ${R(carry)} (je la barre) : ${tot}` : '');
                if (!last) {
                    const digit = tot % 10, nc = Math.floor(tot / 10);
                    partIds[j][i + k] = put(L, { r: row, c: col(i + k), ch: String(digit), k: 'd', ans: 1, expect: String(digit), step: st });
                    carryId = null;
                    if (nc) { carryId = put(L, { r: row, c: sideCol(nCar++), ch: String(nc), k: 'car', cls: 'side', ans: 1, opt: 1, expect: String(nc), step: st }); }
                    txt += nc ? `. J'écris <b>${digit}</b> et je retiens ${R(nc)} (je l'écris à droite de l'opération).` : `. J'écris <b>${digit}</b>.`;
                    carry = nc;
                } else {
                    const ts = String(tot);
                    for (let q = 0; q < ts.length; q++) partIds[j][i + k + q] = put(L, { r: row, c: col(i + k + q), ch: ts[ts.length - 1 - q], k: 'd', ans: 1, expect: ts[ts.length - 1 - q], step: st });
                    txt += `. C'est le dernier chiffre : j'écris <b>${tot}</b>.`;
                }
                step(L, txt, hl);
            }
            const ppLen = String(a * bi).length;
            if (multi) blanks(L, row, col, i + ppLen, i + La, L.steps.length - 1);
            else blanks(L, row, col, i + ppLen, W - 1, L.steps.length - 1);
        });
        if (multi) {
            const st = L.steps.length;
            put(L, { r: rP[rP.length - 1], c: 0, ch: '+', k: 'sign', step: st });
            L.lines.push({ r: rP[rP.length - 1], c1: 0, c2: lastDigitCol, step: st });
            step(L, `J'ai tous les <b>produits partiels</b>. Maintenant, je les additionne, colonne par colonne.`);
            const fulls = NZ.map(i => String(a * dAt(bS, i) * 10 ** i));
            const mx = Math.max(...fulls.map(s => s.length));
            for (let p = 1; p < W; p++) L.slots.push({ r: rC2, c: col(p), k: 'car' });
            let carry = 0, carryId = null;
            for (let p = 0; p < mx; p++) {
                const parts = [], hl = [];
                if (carry) { parts.push(R(carry)); hl.push(carryId); }
                let sum = carry;
                fulls.forEach((s, j) => { const d = dAt(s, p); if (d !== null) { parts.push(d); sum += d; hl.push(partIds[j][p]); } });
                const digit = sum % 10, nc = Math.floor(sum / 10);
                const st2 = L.steps.length;
                put(L, { r: rR, c: col(p), ch: String(digit), k: 'd', ans: 1, expect: String(digit), step: st2 });
                if (carry) strike(carryId, st2);
                let ncId = null;
                if (nc) ncId = put(L, { r: rC2, c: col(p + 1), ch: String(nc), k: 'car', ans: 1, opt: 1, expect: String(nc), step: st2 });
                let t = `Colonne ${ofPlace(p)} : `;
                if (parts.length === 1) t += `il n'y a que ${parts[0]} : j'écris <b>${digit}</b>.`;
                else t += `${parts.join(' + ')} = <b>${sum}</b>. ` + (nc ? `J'écris <b>${digit}</b> et je retiens ${R(nc)}.` : `J'écris <b>${digit}</b>.`);
                if (carry) t += ` Je barre la retenue ${R(carry)} que je viens d'utiliser.`;
                step(L, t, hl);
                carry = nc; carryId = ncId;
            }
            let top = mx - 1;
            if (carry) {
                const st3 = L.steps.length;
                strike(carryId, st3);
                put(L, { r: rR, c: col(mx), ch: String(carry), k: 'd', ans: 1, expect: String(carry), step: st3 });
                step(L, `J'abaisse la dernière retenue ${R(carry)} et je la barre.`, [carryId]);
                top = mx;
            }
            blanks(L, rR, col, top + 1, W - 1, L.steps.length - 1);
        }
        step(L, `✅ ${a} × ${b} = <b>${P}</b>. Je vérifie avec un ordre de grandeur : ${approx(a)} × ${approx(b)} = ${+approx(a) * +approx(b)}, c'est proche ✔.`);
        L.summary = a + ' × ' + b + ' = ' + P;
        return L;
    }

    // ── Division (potence) ──────────────────────────────────────────────
    function buildDiv(numStrs, dsub) {
        const L = newL('div');
        const aStr = numStrs[0], dStr = numStrs[1];
        const a = +aStr, d = +dStr;
        const A = aStr.split('').map(Number), n = A.length;
        let i0 = 0, P = A[0];
        while (P < d && i0 < n - 1) { i0++; P = P * 10 + A[i0]; }
        const qlen = n - i0, Q = Math.floor(a / d), Rm = a % d;
        const areaW = Math.max(dStr.length, qlen);
        for (let i = 0; i < n; i++) L.cols.push({ w: 1 });
        L.cols.push({ w: .6 });
        const D0 = L.cols.length;
        for (let j = 0; j < areaW; j++) L.cols.push({ w: 1 });
        L.cols.push({ w: .35 });
        const ensure = r => { while (L.rows.length <= r) L.rows.push(1); };
        ensure(1);
        const divIds = A.map((x, i) => put(L, { r: 0, c: i + 1, ch: String(x), k: 'd', g: 1 }));
        const dIds = dStr.split('').map((x, j) => put(L, { r: 0, c: D0 + j, ch: x, k: 'd', g: 1 }));
        const vline = { r: 0, r2: 1, c: D0, v: 1, g: 1 };
        L.lines.push(vline);
        L.lines.push({ r: 0, c1: D0, c2: D0 + areaW - 1, g: 1 });
        step(L, `On pose la division : le <b>dividende</b> ${a} à gauche, le <b>diviseur</b> ${d} dans la potence. Le quotient s'écrira sous le diviseur.`);
        const prefix = A.slice(0, i0).join('');
        step(L, (i0 > 0 && P >= d ? `${prefix} est trop petit pour contenir ${d}. ` : '') +
            (P >= d ? `Je prends <b>${P}</b> : c'est le premier nombre qui contient ${d}. Le quotient aura <b>${qlen}</b> chiffre${qlen > 1 ? 's' : ''}.`
                    : `${a} est plus petit que ${d} : il ne contient pas ${d}.`), divIds.slice(0, i0 + 1));
        let row = 0, e = i0, pIds = divIds.slice(0, i0 + 1), qi = 0, endCol = i0 + 1, sc = 1;
        const qCell = (q, st) => put(L, { r: 1, c: D0 + qi, ch: String(q), k: 'd', ans: 1, expect: String(q), step: st });
        while (true) {
            const q = Math.floor(P / d), r = P - q * d;
            if (q === 0 && e < n - 1) {
                const st = L.steps.length;
                qCell(0, st);
                const low = put(L, { r: row, c: e + 2, ch: String(A[e + 1]), k: 'd', ans: 1, expect: String(A[e + 1]), step: st });
                L.lines.push({ arrow: 1, c: e + 2, r: 0, r2: row, step: st });
                step(L, `Dans ${P}, combien de fois ${d} ? <b>0</b> fois : ${P} est trop petit ! J'écris <b>0</b> au quotient et j'abaisse le chiffre suivant : <b>${A[e + 1]}</b>.`, pIds.concat([divIds[e + 1]]).concat(dIds));
                P = P * 10 + A[e + 1]; e++; endCol = e + 1; pIds = pIds.concat([low]); qi++;
                continue;
            }
            let st = L.steps.length;
            qCell(q, st);
            step(L, q === 0 ? `Dans ${P}, combien de fois ${d} ? <b>0</b> fois. J'écris <b>0</b> au quotient.`
                : `Dans ${P}, combien de fois ${d} ? <b>${q}</b> fois, car ${q} × ${d} = ${q * d}` + ((q + 1) * d > P ? ` (et ${q + 1} × ${d} = ${(q + 1) * d}, c'est trop).` : '.') + ` J'écris <b>${q}</b> au quotient.`,
                pIds.concat(dIds));
            if (q === 0) break;
            const prod = q * d, pStr = String(prod), rStr = String(r);
            let rr;
            if (dsub) {
                const pr = row + 1; ensure(pr);
                st = L.steps.length;
                const prodIds = [];
                for (let c = sc; c <= endCol; c++) {
                    const jj = endCol - c, dg = jj < pStr.length ? pStr[pStr.length - 1 - jj] : null;
                    prodIds.push(put(L, dg !== null ? { r: pr, c, ch: dg, k: 'd', ans: 1, expect: dg, step: st }
                                                    : { r: pr, c, ch: '', k: 'd', ans: 1, expect: '', alt: ['0'], step: st }));
                }
                put(L, { r: pr, c: Math.max(0, endCol - pStr.length), ch: '−', k: 'sign', step: st });
                L.lines.push({ r: pr, c1: Math.max(1, endCol - pStr.length + 1), c2: endCol, step: st });
                step(L, `${q} × ${d} = <b>${prod}</b> : je l'écris sous ${P} et je soustrais.`, pIds);
                rr = row + 2;
            } else rr = row + 1;
            ensure(rr);
            st = L.steps.length;
            const remIds = [];
            const lowerNext = e < n - 1;
            for (let c = sc; c <= endCol; c++) {
                const jj = endCol - c, dg = jj < rStr.length ? rStr[rStr.length - 1 - jj] : null;
                if (dg !== null) remIds.push(put(L, (r === 0 && lowerNext) ? { r: rr, c, ch: '0', k: 'd', ans: 1, expect: '0', alt: [''], step: st }
                                                                           : { r: rr, c, ch: dg, k: 'd', ans: 1, expect: dg, step: st }));
                else put(L, { r: rr, c, ch: '', k: 'd', ans: 1, expect: '', alt: ['0'], step: st });
            }
            step(L, dsub ? `${P} − ${prod} = <b>${r}</b>. Le reste ${r} est bien plus petit que ${d} ✔.`
                         : `${q} × ${d} = ${prod} ; ${P} − ${prod} = <b>${r}</b> : j'écris le reste ${r} sous ${P}. Il est bien plus petit que ${d} ✔.`, pIds);
            if (lowerNext) {
                st = L.steps.length;
                const low = put(L, { r: rr, c: e + 2, ch: String(A[e + 1]), k: 'd', ans: 1, expect: String(A[e + 1]), step: st });
                L.lines.push({ arrow: 1, c: e + 2, r: 0, r2: rr, step: st });
                const newP = r * 10 + A[e + 1];
                step(L, `J'abaisse le chiffre suivant du dividende (la flèche) : <b>${A[e + 1]}</b>. J'obtiens <b>${newP}</b>.`, remIds.concat([divIds[e + 1]]));
                P = newP; e++; endCol = e + 1; sc = endCol - String(P).length + 1;
                pIds = (r === 0 ? [] : remIds).concat([low]);
                row = rr; qi++;
                continue;
            }
            break;
        }
        vline.r2 = L.rows.length - 1;
        step(L, `✅ ${a} ÷ ${d} : le <b>quotient</b> est <b>${Q}</b> et le <b>reste</b> est <b>${Rm}</b>. Je vérifie : (${Q} × ${d}) + ${Rm} = ${Q * d + Rm}.`);
        L.summary = `${a} = (${d} × ${Q}) + ${Rm}`;
        return L;
    }

    const _cache = {};
    function buildOp(spec, opts) {
        const key = JSON.stringify([spec.op, spec.nums, opts.method, opts.dsub]);
        if (_cache[key]) return _cache[key];
        let L;
        if (spec.op === 'add') L = buildAdd(spec.nums);
        else if (spec.op === 'sub') L = buildSub(spec.nums, opts.method);
        else if (spec.op === 'mul') L = buildMul(spec.nums);
        else L = buildDiv(spec.nums, opts.dsub);
        // Cases « leurres » pour les retenues : si l'élève écrit les retenues,
        // il ne doit pas deviner où elles sont à la forme des cases
        const last = L.steps.length - 1;
        L.slots.forEach(sl => {
            if (L.items.some(it => it.opt && it.r === sl.r && it.c === sl.c && it.k === sl.k && it.pos === sl.pos)) return;
            put(L, Object.assign({ ch: '', ans: 1, opt: 1, decoy: 1, expect: '', step: last }, sl));
        });
        // Ordre de saisie naturel = ordre d'écriture
        L.order = L.items.filter(it => it.ans && it.k !== 'b' && !it.decoy).map(it => it.id);
        _cache[key] = L;
        return L;
    }

    // =====================================================================
    // GÉNÉRATION D'OPÉRATIONS
    // =====================================================================
    function rndNum(nd) { return nd <= 1 ? rnd(1, 9) : rnd(10 ** (nd - 1), 10 ** nd - 1); }
    function mkDec(totalDigits, dd) {
        const intD = Math.max(1, totalDigits - dd);
        const ip = intD === 1 ? String(rnd(0, 9)) : String(rndNum(intD));
        if (!dd) return ip === '0' ? String(rnd(1, 9)) : ip;
        let fp = ''; for (let i = 0; i < dd; i++) fp += (i === dd - 1 ? rnd(1, 9) : rnd(0, 9));
        return ip + ',' + fp;
    }
    function colInfo(strs) {
        const { D, vals } = scaleAll(strs);
        const ss = vals.map(v => digitsOf(v, D));
        return { D, vals, ss, mx: Math.max(...ss.map(s => s.length)) };
    }
    function genAdd(lvl, terms, carry, dec) {
        const RG = { 1: [2, 2], 2: [3, 4], 3: [4, 5] }[lvl];
        if (carry === 'sans') {
            // Construction colonne par colonne : aucune colonne ne dépasse 9
            const lens = Array.from({ length: terms }, () => rnd(RG[0], RG[1]) + (dec ? 1 : 0));
            const dg = lens.map(() => []);
            const mx = Math.max(...lens);
            for (let p = 0; p < mx; p++) {
                const who = lens.map((l, i) => i).filter(i => p < lens[i]);
                const mins = who.map(i => ((p === lens[i] - 1 && lens[i] - dec > 1) || (dec && p === 0)) ? 1 : 0);
                let rest = 9;
                who.forEach((i, idx) => {
                    const reserve = mins.slice(idx + 1).reduce((s, x) => s + x, 0);
                    const v = rnd(mins[idx], Math.max(mins[idx], Math.min(9, rest - reserve)));
                    dg[i][p] = v; rest -= v;
                });
            }
            return dg.map(arr => {
                const s = arr.slice().reverse().join('');
                return dec ? cleanNum(s.slice(0, -dec) + ',' + s.slice(-dec)) : s;
            });
        }
        for (let t = 0; t < 300; t++) {
            const nums = Array.from({ length: terms }, () => {
                const dd = dec ? (lvl === 3 ? rnd(1, dec) : dec) : 0;
                return mkDec(rnd(RG[0], RG[1]) + (dd ? 1 : 0), dd);
            });
            const { ss, mx } = colInfo(nums);
            let c = 0, any = false;
            for (let p = 0; p < mx; p++) { const s = c + ss.reduce((x, st) => x + (dAt(st, p) || 0), 0); if (s >= 10) any = true; c = Math.floor(s / 10); }
            if (any) return nums.map(cleanNum);
        }
        return ['2748', '1576'];
    }
    function genSub(lvl, carry, dec) {
        const RG = { 1: [2, 3], 2: [3, 4], 3: [4, 5] }[lvl];
        for (let t = 0; t < 400; t++) {
            const nA = rnd(RG[0], RG[1]) + (dec ? 1 : 0);
            const nB = Math.max(dec ? 2 : 1, nA - rnd(0, 1));
            let aStr, bStr;
            if (carry === 'sans') {
                const ad = [], bd = [];
                for (let p = 0; p < nA; p++) {
                    const lead = p === nA - 1;
                    ad[p] = rnd(lead ? 1 : 0, 9);
                    if (p < nB) bd[p] = rnd((p === nB - 1 && nB - dec > 1) ? 1 : 0, ad[p]);
                }
                if (nB === nA && bd[nA - 1] === 0 && nA - dec > 1) continue;
                aStr = ad.slice().reverse().join(''); bStr = bd.slice().reverse().join('');
            } else {
                aStr = String(rndNum(nA));
                if (lvl === 3 && Math.random() < .5 && nA >= 4) {
                    const arr = aStr.split(''); for (let i = 1; i < nA - 1; i++) if (Math.random() < .6) arr[i] = '0'; aStr = arr.join('');
                }
                bStr = String(rndNum(nB));
            }
            if (dec) {
                aStr = aStr.slice(0, -dec) + ',' + aStr.slice(-dec);
                bStr = bStr.length > dec ? bStr.slice(0, -dec) + ',' + bStr.slice(-dec) : '0,' + bStr.padStart(dec, '0');
            }
            const { vals, ss } = colInfo([aStr, bStr]);
            if (vals[0] <= vals[1] || vals[1] === 0) continue;
            let any = false; for (let p = 0; p < ss[0].length; p++) if ((dAt(ss[0], p) || 0) < (dAt(ss[1], p) || 0)) any = true;
            if ((carry === 'sans') === any) continue;
            return [cleanNum(aStr), cleanNum(bStr)];
        }
        return ['5203', '1486'];
    }
    function genMul(lvl) {
        const digit = () => rnd(2, 9);
        const multi = n => { let s = String(digit()); for (let i = 1; i < n; i++) s = String(rnd(1, 9)) + s; return s; };
        if (lvl === 1) return [String(rndNum(rnd(2, 3))), String(digit())];
        if (lvl === 2) return [String(rndNum(3)), multi(2)];
        return [String(rndNum(rnd(3, 4))), multi(rnd(2, 3))];
    }
    function genDiv(lvl, exact) {
        for (let t = 0; t < 300; t++) {
            let d, q;
            if (lvl === 1) { d = rnd(2, 9); q = rnd(10, Math.floor(999 / d)); }
            else if (lvl === 2) { d = rnd(3, 9); q = rnd(Math.ceil(100 / d), Math.floor(9999 / d)); }
            else { d = rnd(11, 49); q = rnd(12, Math.floor(9999 / d)); }
            const r = exact ? 0 : rnd(0, d - 1);
            const a = q * d + r;
            if (a < 10 || a > 99999) continue;
            if (lvl >= 2 && a < 100) continue;
            return [String(a), String(d)];
        }
        return ['1957', '7'];
    }
    function genSpec(op, ex) {
        if (op === 'add') return { op, nums: genAdd(ex.level, ex.terms, ex.carry, ex.dec) };
        if (op === 'sub') return { op, nums: genSub(ex.level, ex.carry, ex.dec) };
        if (op === 'mul') return { op, nums: genMul(ex.level) };
        return { op, nums: genDiv(ex.level, ex.dexact) };
    }

    // =====================================================================
    // SONS / VOIX
    // =====================================================================
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function speak(html) {
        if (!canSpeak) return;
        try {
            const tmp = document.createElement('div'); tmp.innerHTML = html;
            const text = tmp.textContent.replace(/✅|✔|💡|🦉/g, '').replace(/−/g, ' moins ').replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ');
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
        bad:  () => { tone(220, 0, 0.18, 'square', 0.05); tone(170, 0.16, 0.25, 'square', 0.05); },
        pop:  () => tone(880, 0, 0.06, 'sine', 0.05),
        drop: () => { tone(1320, 0, 0.07, 'sine', 0.06); tone(990, 0.06, 0.1, 'sine', 0.05); },
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    // =====================================================================
    // LEÇONS
    // =====================================================================
    const LESSONS = [
        { id: 'add', label: '➕ L\'addition',       color: '#2F80ED' },
        { id: 'sub', label: '➖ La soustraction',   color: '#EB5757' },
        { id: 'mul', label: '✖️ La multiplication', color: '#27AE60' },
        { id: 'div', label: '➗ La division',        color: '#9B51E0' }
    ];
    const DEMO_DEFAULT = { add: '2748 + 1576', sub: '5203 - 1486', mul: '347 x 26', div: '1957 : 7' };
    const LESSON_TXT = {
        add: {
            title: '➕ L\'addition posée',
            what: `Poser une addition, c'est écrire les nombres <b>les uns sous les autres</b> en alignant les chiffres de même rang : unités sous unités, dizaines sous dizaines… Le résultat s'appelle la <b>somme</b>.`,
            how: [`J'aligne bien les chiffres (et les <b>virgules</b> pour les nombres décimaux).`,
                  `Je commence <b>toujours par la droite</b>, par la colonne des unités.`,
                  `Si une colonne dépasse 9, j'écris le chiffre des unités et je ${R('retiens')} la dizaine en haut de la colonne suivante.`,
                  `Je n'oublie pas d'ajouter la retenue dans la colonne suivante.`],
            memo: `<b>10 unités = 1 dizaine</b>, 10 dizaines = 1 centaine… C'est pour cela qu'on retient !`,
            trap: `Mal aligner des nombres qui n'ont pas le même nombre de chiffres, ou oublier la retenue.`,
            check: `<b>Ordre de grandeur</b> : 2748 + 1576, c'est environ 2700 + 1600 = 4300. Mon résultat doit être proche.`
        },
        sub: {
            title: '➖ La soustraction posée',
            what: `On écrit <b>le plus grand nombre en haut</b> et on aligne les chiffres de même rang. Le résultat s'appelle la <b>différence</b>.`,
            how: [`Je commence par la droite : chiffre du haut − chiffre du bas.`,
                  `<b>Méthode par compensation (retenue)</b> : si le chiffre du haut est trop petit, j'ajoute ${R('10')} en haut, et j'ajoute ${R('1')} en bas dans la colonne suivante. J'ai ajouté la même quantité aux deux nombres : la différence ne change pas.`,
                  `<b>Méthode par emprunt (je casse)</b> : si le chiffre du haut est trop petit, je casse 1 dizaine (ou 1 centaine…) du nombre du haut pour en faire 10 unités.`],
            memo: `On ne mélange pas les deux méthodes dans la même opération !`,
            trap: `Quand le chiffre du haut est plus petit, on ne retourne pas la soustraction : 2 − 7, ce n'est pas 7 − 2 = 5 !`,
            check: `<b>Preuve</b> : différence + nombre du bas = nombre du haut.`
        },
        mul: {
            title: '✖️ La multiplication posée',
            what: `Les nombres que l'on multiplie s'appellent les <b>facteurs</b>. Le résultat s'appelle le <b>produit</b>.`,
            how: [`Par un chiffre : je multiplie chaque chiffre du nombre du haut, de droite à gauche, et j'ajoute les ${R('retenues')}.`,
                  `Par un nombre à 2 chiffres : je multiplie d'abord par les unités, puis par les dizaines en <b>décalant d'un rang</b> (j'écris un 0 à droite, car je multiplie des dizaines).`,
                  `J'additionne ensuite les <b>produits partiels</b>.`],
            memo: `Il faut connaître ses <b>tables de multiplication</b> par cœur !`,
            trap: `Oublier le 0 du décalage. Ou ajouter la retenue avant de multiplier : on <b>multiplie d'abord</b>, on <b>ajoute la retenue ensuite</b>.`,
            check: `<b>Ordre de grandeur</b> : 347 × 26, c'est environ 350 × 25 = 8750.`
        },
        div: {
            title: '➗ La division posée',
            what: `Dans 1957 ÷ 7 : 1957 est le <b>dividende</b>, 7 le <b>diviseur</b>. On cherche le <b>quotient</b> et le <b>reste</b>. On a toujours : dividende = (diviseur × quotient) + reste, et <b>reste &lt; diviseur</b>.`,
            how: [`Je cherche le premier nombre du dividende qui contient le diviseur : il me dit combien de chiffres aura le quotient.`,
                  `Je cherche combien de fois il contient le diviseur (avec les tables !) et j'écris ce chiffre au quotient.`,
                  `Je multiplie, je soustrais, puis j'<b>abaisse</b> le chiffre suivant du dividende.`,
                  `Je recommence jusqu'à ce qu'il n'y ait plus de chiffre à abaisser.`],
            memo: `À chaque étape, <b>le reste doit être plus petit que le diviseur</b>. Sinon, j'ai choisi un chiffre trop petit au quotient.`,
            trap: `Oublier un <b>0 au quotient</b> quand le nombre obtenu est trop petit pour contenir le diviseur.`,
            check: `<b>Preuve</b> : (diviseur × quotient) + reste = dividende.`
        }
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'add',
            demo: Object.assign({}, DEMO_DEFAULT), dstep: 0, dmethod: 'comp', ddsub: true,
            ex: { op: 'add', level: 1, mode: 'auto', mine: '', terms: 2, carry: 'avec', dec: 0, method: 'comp', dexact: false, dsub: true, wret: false, n: 5 },
            cs: 52, cols: true, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createOperationsPoseesWidget = function (saved) {
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
        container.className = 'opp-container';
        container.innerHTML = `
            <div class="opp-header">
                <span class="opp-title">🧮 Opérations posées</span>
                <div class="opp-tabs">
                    <button class="opp-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="opp-tab-lbl">Leçons</span></button>
                    <button class="opp-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="opp-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="opp-icon-btn" data-act="sound" title="Son"></button>
                    <button class="opp-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="opp-body"></div>
            <div class="opp-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — L'addition, la soustraction, la multiplication et la division posées. Chaque leçon a une <b>démonstration animée</b> : ▶ fait avancer d'une étape (les chiffres s'écrivent, les retenues tombent en rouge), ⏯ déroule tout seul, 🔊 lit l'étape. Écris ta propre opération dans la case (ex. <i>4572 + 389</i>, <i>503 - 47</i>, <i>347 x 26</i>, <i>1957 : 7</i>) puis touche <b>Poser</b>.</p>
                <p><b>✏️ Exercices</b> — « L'élève propose, le tableau vérifie » : touche une case pointillée, puis écris le chiffre avec le pavé (ou le clavier). La case suivante se sélectionne toute seule. <b>✔ Vérifier</b> colorie en vert les chiffres justes, en rouge les faux. <b>💡 Indice</b> remplit la prochaine case en expliquant pourquoi. <b>🎬 Correction</b> rejoue l'opération pas à pas.</p>
                <p>Les cases du résultat qui doivent rester <b>vides</b> (pas de 0 devant un nombre) font partie du piège ! Tu peux aussi faire écrire les <b>retenues</b> (réglage « Saisie »), et poser <b>tes propres opérations</b> (une par ligne).</p>
                <p>Les colonnes colorées (u, d, c…) s'affichent ou se masquent avec le bouton <b>🎨</b>. <b>A− / A+</b> change la taille des chiffres.</p>
            </div>
            <div class="opp-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.opp-body');
        const help = container.querySelector('.opp-help');
        const resizeHandle = container.querySelector('.opp-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let msg = '', demoMsg = '', prevStep = { demo: -1, ex: -1 }, autoT = null, active = false;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };
        const exOpts = () => ({ method: S.ex.method, dsub: S.ex.dsub });
        const runOpts = Rn => Rn.opts || exOpts();

        // ── Opération de la démonstration ──
        function demoLayout() {
            const sp = parseOp(S.demo[S.lesson]);
            if (!sp || sp.err) { demoMsg = sp ? sp.err : 'Écris une opération.'; return buildOp(parseOp(DEMO_DEFAULT[S.lesson]), { method: S.dmethod, dsub: S.ddsub }); }
            demoMsg = '';
            return buildOp(sp, { method: S.dmethod, dsub: S.ddsub });
        }
        const curRunLayout = Rn => buildOp(Rn.queue[Rn.qi], runOpts(Rn));

        // =================================================================
        // RENDU DE LA GRILLE
        //   o.mode = 'anim' : étape o.k (affiche ce qui est écrit jusque-là)
        //   o.mode = 'ex'   : cases à remplir (réponses de l'élève)
        // =================================================================
        function gridHtml(L, o) {
            const off = (S.cols && L.op !== 'div') ? 1 : 0;
            const colsT = L.cols.map(c => `calc(var(--cs) * ${c.w})`).join(' ');
            const rowsT = (off ? ['calc(var(--cs) * .46)'] : []).concat(L.rows.map(h => `calc(var(--cs) * ${h})`)).join(' ');
            const last = L.rows.length + off;
            let h = `<div class="opp-grid" style="--cs:${S.cs}px;grid-template-columns:${colsT};grid-template-rows:${rowsT}">`;
            if (off) L.cols.forEach((c, ci) => {
                if (c.k === undefined) return;
                h += `<div class="opp-tint" style="grid-column:${ci + 1};grid-row:1 / ${last + 1};background:${tint(c.k)}"></div>`;
                h += `<div class="opp-head" style="grid-column:${ci + 1};grid-row:1">${placeL(c.k)}</div>`;
            });
            if (L.side) {
                h += `<div class="opp-sidesep" style="grid-column:${L.side.sep + 1};grid-row:${L.side.r1 + 1 + off} / ${L.side.r2 + 2 + off}"></div>`;
                h += `<div class="opp-sidehead" style="grid-column:${L.side.c1 + 1} / ${L.side.c2 + 2};grid-row:${L.side.r1 + off}">retenues</div>`;
            }
            const anim = o.mode === 'anim';
            const k = o.k, hl = anim && L.steps[k] ? L.steps[k].hl : [];
            const fwd = anim && o.k > o.prev;
            L.lines.forEach(ln => {
                if (anim && !ln.g && ln.step > k) return;
                if (ln.arrow) { h += `<div class="opp-arrow${anim && fwd && ln.step === k ? ' new' : ''}" style="grid-column:${ln.c + 1};grid-row:${ln.r + 1 + off} / ${ln.r2 + 2 + off}"></div>`; return; }
                if (ln.v) h += `<div class="opp-vline" style="grid-column:${ln.c + 1};grid-row:${ln.r + 1 + off} / ${ln.r2 + 2 + off}"></div>`;
                else h += `<div class="opp-line" style="grid-column:${ln.c1 + 1} / ${ln.c2 + 2};grid-row:${ln.r + 1 + off}"></div>`;
            });
            const Rn = o.R;
            // Exercice de multiplication : une retenue écrite par l'élève est barrée
            // dès qu'il a écrit un chiffre de l'étape qui l'utilise
            const usedStep = {};
            if (!anim && Rn && Rn.wret && L.op === 'mul') L.items.forEach(it => {
                if (it.ans && !it.opt && it.expect !== '' && (Rn.ans[it.id] || '') !== '') usedStep[it.step] = 1;
            });
            L.items.forEach(it => {
                const pos = `grid-row:${it.r + 1 + off};grid-column:${it.c + 1}`;
                if (anim) {
                    if (it.step > k || it.ch === '') return;
                    let cls = 'opp-c';
                    if (it.k === 'sign') cls += ' opp-sign';
                    else if (it.k === 'comma') cls += ' opp-comma';
                    else if (it.k === 'car') cls += ' opp-car';
                    if (it.k === 'b') cls = 'opp-b ' + it.pos;
                    if (it.cls) cls += ' ' + it.cls;
                    if (!it.g && it.k === 'd') cls += ' sol';
                    if (it.off !== undefined && k >= it.off) cls += it.offType === 'strike' ? ' struck' : ' faded';
                    if (hl.indexOf(it.id) !== -1) cls += ' hl';
                    if (fwd && it.step === k && !it.g) cls += ' new' + ((it.k === 'car' || it.k === 'b') ? ' fall' : '');
                    h += `<div class="${cls}" style="${pos}">${esc(it.ch)}</div>`;
                    return;
                }
                // Mode exercice
                if (it.g || !it.ans) {
                    let cls = 'opp-c' + (it.k === 'sign' ? ' opp-sign' : it.k === 'comma' ? ' opp-comma' : '') + (it.cls ? ' ' + it.cls : '');
                    h += `<div class="${cls}" style="${pos}">${esc(it.ch)}</div>`;
                    return;
                }
                if (it.opt && !Rn.wret) return;
                const v = Rn.ans[it.id] || '';
                const editable = Rn.phase === 'play';
                const act = editable ? ` data-act="cell" data-id="${it.id}"` : '';
                if (it.k === 'b') {
                    h += `<div class="opp-b ${it.pos} tog ${v ? 'on' : ''}"${act} style="${pos}">${v ? (it.pos === 'bc' ? '+1' : '1') : ''}</div>`;
                    return;
                }
                let cls = 'opp-c box' + (it.k === 'car' ? ' mini' : '') + (it.cls ? ' ' + it.cls : '');
                if (Rn.sel === it.id && editable) cls += ' sel';
                const mk = Rn.marks && Rn.marks[it.id];
                if (mk === 'ok' && v !== '') cls += ' ok';
                if (mk === 'ko') cls += ' ko';
                if (!editable) cls += ' lock';
                if (it.k === 'car' && v !== '' && it.offType === 'strike' && usedStep[it.off]) cls += ' struck';
                h += `<div class="${cls}"${act} style="${pos}">${esc(v)}</div>`;
            });
            return h + `</div>`;
        }
        function playerHtml(L, k, tgt) {
            const n = L.steps.length;
            const prev = prevStep[tgt];
            prevStep[tgt] = k;
            const playing = autoT && autoT.tgt === tgt;
            return `<div class="opp-say">${L.steps[k] ? L.steps[k].t : ''}</div>
                <div class="opp-gwrap">${gridHtml(L, { mode: 'anim', k, prev })}</div>
                <div class="opp-ctrl">
                    <button class="opp-btn alt small" data-act="step" data-tgt="${tgt}" data-d="first" title="Revenir au début">⏮</button>
                    <button class="opp-btn alt small" data-act="step" data-tgt="${tgt}" data-d="-1" ${k <= 0 ? 'disabled' : ''} title="Étape précédente">◀</button>
                    <span class="opp-stepn">Étape ${k + 1} / ${n}</span>
                    <button class="opp-btn go" data-act="step" data-tgt="${tgt}" data-d="1" ${k >= n - 1 ? 'disabled' : ''}>Étape suivante ▶</button>
                    <button class="opp-btn alt small" data-act="auto" data-tgt="${tgt}" title="Lecture automatique">${playing ? '⏸' : '⏯'}</button>
                    <button class="opp-btn alt small" data-act="step" data-tgt="${tgt}" data-d="last" title="Tout montrer">⏭</button>
                    ${canSpeak ? `<button class="opp-btn alt small" data-act="say" data-tgt="${tgt}" title="Lire l'étape à voix haute">🔊</button>` : ''}
                    <button class="opp-btn alt small" data-act="cols" title="Colonnes colorées">🎨</button>
                    <button class="opp-btn alt small" data-act="cs" data-d="-6">A−</button>
                    <button class="opp-btn alt small" data-act="cs" data-d="6">A+</button>
                </div>`;
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="opp-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const T = LESSON_TXT[S.lesson], col = OPS[S.lesson].color;
            const L = demoLayout();
            S.dstep = Math.max(0, Math.min(S.dstep, L.steps.length - 1));
            const ch = (act, v, on, lbl) => `<button class="opp-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}" style="--c:${col}">${lbl}</button>`;
            let opt = '';
            if (L.op === 'sub') opt = `<div class="opp-srow"><span class="opp-hint">Méthode :</span>${ch('dmethod', 'comp', S.dmethod === 'comp', 'par compensation (retenue)')}${ch('dmethod', 'emp', S.dmethod === 'emp', 'par emprunt (je casse)')}</div>`;
            if (L.op === 'div') opt = `<div class="opp-srow"><span class="opp-hint">Soustractions :</span>${ch('ddsub', '1', S.ddsub, 'je les écris')}${ch('ddsub', '0', !S.ddsub, 'je ne les écris pas')}</div>`;
            const main = `<div class="opp-ltitle"><h2 style="color:${col}">${T.title}</h2></div>
                <div class="opp-demo" style="--c:${col}">
                    <div class="opp-demo-top">
                        <input class="opp-demo-in" value="${esc(S.demo[S.lesson])}" placeholder="Ex. : ${esc(DEMO_DEFAULT[S.lesson])}" spellcheck="false" autocomplete="off">
                        <button class="opp-btn small" data-act="dpose">▶ Poser</button>
                        <button class="opp-btn alt small" data-act="drandom" title="Une autre opération au hasard">🎲</button>
                    </div>
                    ${opt}
                    ${demoMsg ? `<div class="opp-msg">⚠️ ${esc(demoMsg)}</div>` : ''}
                    ${playerHtml(L, S.dstep, 'demo')}
                </div>
                <div class="opp-box opp-what"><b class="t">🔤 Le vocabulaire</b>${T.what}</div>
                <div class="opp-box opp-test"><b class="t">🔧 La méthode</b><ol>${T.how.map(x => `<li>${x}</li>`).join('')}</ol></div>
                <div class="opp-box opp-memo"><b class="t">🧠 Pour retenir</b>${T.memo}</div>
                <div class="opp-box opp-trap"><b class="t">⚠️ Attention au piège</b>${T.trap}</div>
                <div class="opp-box opp-tool"><b class="t">🔎 Je vérifie</b>${T.check}</div>
                <div><button class="opp-btn go" data-act="practice" data-v="${S.lesson}">✏️ S'entraîner : ${OPS[S.lesson].label.toLowerCase()}</button></div>`;
            return `<div class="opp-lesson"><div class="opp-side">${side}</div><div class="opp-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="opp-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="opp-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="opp-settings">`;
            h += `<div class="opp-srow"><span class="l">1. Opération</span>${Object.keys(OPS).map(k => ch('op', k, ex.op === k, OPS[k].icon + ' ' + OPS[k].label, OPS[k].color)).join('')}${ch('op', 'mix', ex.op === 'mix', '🎲 Mélange')}</div>`;
            h += `<div class="opp-srow"><span class="l">2. Opérations</span>${[1, 2, 3].map(l => ch('level', l, ex.mode === 'auto' && ex.level === l, LEVELS[l].label, LEVELS[l].color)).join('')}${ch('mode', 'mine', ex.mode === 'mine', '✍️ Mes opérations')}</div>`;
            if (ex.mode === 'mine') {
                const lines = ex.mine.split(/\r?\n/).filter(l => l.trim());
                const okN = lines.filter(l => { const p = parseOp(l); return p && !p.err; }).length;
                h += `<div class="opp-srow" style="flex-direction:column;align-items:stretch">
                    <textarea class="opp-mine" placeholder="Une opération par ligne, par exemple :&#10;4572 + 389&#10;503 - 47&#10;347 x 26&#10;1957 : 7" spellcheck="false">${esc(ex.mine)}</textarea>
                    <div class="opp-hint opp-mine-count">${okN} opération${okN > 1 ? 's' : ''} utilisable${okN > 1 ? 's' : ''}${lines.length > okN ? ' · ' + (lines.length - okN) + ' ligne(s) illisible(s)' : ''}</div></div>`;
            } else {
                const showAdd = ex.op === 'add', showSub = ex.op === 'sub', showDiv = ex.op === 'div';
                if (showAdd) h += `<div class="opp-srow"><span class="l">Nombres à additionner</span>${ch('terms', 2, ex.terms === 2, '2 nombres')}${ch('terms', 3, ex.terms === 3, '3 nombres')}</div>`;
                if (showAdd || showSub) {
                    h += `<div class="opp-srow"><span class="l">Retenues</span>${ch('carry', 'avec', ex.carry === 'avec', 'avec retenues')}${ch('carry', 'sans', ex.carry === 'sans', 'sans retenue')}</div>`;
                    h += `<div class="opp-srow"><span class="l">Nombres</span>${ch('dec', 0, ex.dec === 0, 'entiers')}${ch('dec', 1, ex.dec === 1, 'décimaux (1 chiffre après la virgule)')}${ch('dec', 2, ex.dec === 2, 'décimaux (2 chiffres)')}</div>`;
                }
                if (showDiv) h += `<div class="opp-srow"><span class="l">Reste</span>${ch('dexact', '0', !ex.dexact, 'au hasard')}${ch('dexact', '1', ex.dexact, 'reste nul')}</div>`;
                h += `<div class="opp-srow"><span class="l">Nombre d'opérations</span>${[3, 5, 8].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            }
            if (ex.op === 'sub' || ex.op === 'mix' || ex.mode === 'mine') h += `<div class="opp-srow"><span class="l">Soustraction</span>${ch('method', 'comp', ex.method === 'comp', 'par compensation (retenue)')}${ch('method', 'emp', ex.method === 'emp', 'par emprunt (je casse)')}</div>`;
            if (ex.op === 'div' || ex.op === 'mix' || ex.mode === 'mine') h += `<div class="opp-srow"><span class="l">Division</span>${ch('dsub', '1', ex.dsub, 'soustractions écrites')}${ch('dsub', '0', !ex.dsub, 'sans les soustractions')}</div>`;
            h += `<div class="opp-srow"><span class="l">Saisie</span>${ch('wret', '0', !ex.wret, 'le résultat seulement')}${ch('wret', '1', ex.wret, '✍️ aussi les retenues')}</div>`;
            h += `<div class="opp-srow"><span class="l">Taille des chiffres</span><button class="opp-btn alt small" data-act="cs" data-d="-6">A−</button><button class="opp-btn alt small" data-act="cs" data-d="6">A+</button>
                <button class="opp-btn alt small" data-act="cols">🎨 Colonnes ${S.cols ? 'colorées' : 'blanches'}</button>
                <span style="flex:1"></span>${S.run ? '<button class="opp-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="opp-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="opp-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function renderRun() {
            const Rn = S.run;
            const dots = Rn.queue.map((_, i) => `<span class="opp-dot ${Rn.results[i] || (i === Rn.qi && Rn.phase !== 'final' ? 'cur' : '')}"></span>`).join('');
            const sp = Rn.queue[Math.min(Rn.qi, Rn.queue.length - 1)];
            let h = `<div class="opp-topbar"><span class="opp-pill">${Rn.phase === 'final' ? '🏁 Série terminée' : `${OPS[sp.op].icon} Opération ${Rn.qi + 1} / ${Rn.queue.length}`}</span><div class="opp-dots">${dots}</div><span class="opp-pill">⭐ ${Rn.stars}</span></div>`;
            if (Rn.phase === 'final') {
                const max = Rn.queue.length * 3;
                const title = Rn.medal === '🥇' ? 'As du calcul posé !' : Rn.medal === '🥈' ? 'Très beau travail !' : 'Série terminée !';
                return h + `<div class="opp-final"><div class="medal">${Rn.medal}</div><div style="font-size:26px;font-weight:900">${title}</div>
                    <div style="font-size:18px;font-weight:800">${Rn.stars} ⭐ sur ${max}</div>
                    <button class="opp-btn go" data-act="regen">🔄 Nouvelle série</button></div>`;
            }
            const L = curRunLayout(Rn);
            if (Rn.view === 'anim') {
                Rn.astep = Math.max(0, Math.min(Rn.astep, L.steps.length - 1));
                h += playerHtml(L, Rn.astep, 'ex');
                h += `<div class="opp-actions"><button class="opp-btn alt" data-act="view">↩ Revoir ma réponse</button>
                    <button class="opp-btn go" data-act="next">${Rn.qi >= Rn.queue.length - 1 ? '🏁 Voir le bilan' : 'Opération suivante ➜'}</button></div>`;
                return h;
            }
            h += `<div class="opp-say ${Rn.say ? Rn.say.mood : ''}">${Rn.say ? Rn.say.html : ''}</div>`;
            const play = Rn.phase === 'play';
            const pad = play ? `<div class="opp-pad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(k => `<button class="opp-key" data-act="key" data-k="${k}">${k}</button>`).join('')}
                    <button class="opp-key fn" data-act="key" data-k="del" title="Effacer la case">⌫</button>
                    <button class="opp-key" data-act="key" data-k="0">0</button>
                    <button class="opp-key fn" data-act="key" data-k="next" title="Case suivante">➜</button></div>` : '';
            h += `<div class="opp-play"><div class="opp-gwrap">${gridHtml(L, { mode: 'ex', R: Rn })}</div>${pad}</div>`;
            h += `<div class="opp-actions">` + (play
                ? `<button class="opp-btn go" data-act="check">✔ Vérifier</button>
                   <button class="opp-btn alt" data-act="hint">💡 Indice</button>
                   <button class="opp-btn alt" data-act="clear">🧹 Effacer</button>
                   <button class="opp-btn alt" data-act="show">🎬 Correction</button>
                   <button class="opp-btn alt" data-act="skip">⏭ Passer</button>`
                : `<button class="opp-btn go" data-act="next">${Rn.qi >= Rn.queue.length - 1 ? '🏁 Voir le bilan' : 'Opération suivante ➜'}</button>
                   <button class="opp-btn alt" data-act="show">🎬 Revoir pas à pas</button>`) + `</div>`;
            return h;
        }
        function renderTrain() {
            let h = `<div class="opp-train">${renderSettings()}`;
            if (S.run) h += `<div style="display:flex;flex-direction:column;gap:12px">${renderRun()}</div>`;
            else if (!msg) h += `<div class="opp-info">Choisis l'opération et ses réglages, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function fitGrids() {
            body.querySelectorAll('.opp-gwrap').forEach(w => {
                const g = w.querySelector('.opp-grid');
                if (!g) return;
                g.style.setProperty('--cs', S.cs + 'px');
                const avail = w.clientWidth - 10, need = g.scrollWidth;
                if (avail > 0 && need > avail) g.style.setProperty('--cs', Math.max(18, Math.floor(S.cs * avail / need)) + 'px');
            });
        }
        function render() {
            container.querySelectorAll('.opp-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : renderLesson();
            body.scrollTop = top;
            fitGrids();
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'opp-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // =================================================================
        // EXERCICES : logique
        // =================================================================
        function genRun() {
            const ex = S.ex;
            let queue;
            if (ex.mode === 'mine') {
                const parsed = ex.mine.split(/\r?\n/).filter(l => l.trim()).map(parseOp);
                const errs = parsed.filter(p => p && p.err);
                queue = parsed.filter(p => p && !p.err).slice(0, 20);
                if (!queue.length) return errs.length ? errs[0].err : 'Écris au moins une opération (une par ligne).';
            } else {
                const ops = ex.op === 'mix' ? ['add', 'sub', 'mul', 'div'] : [ex.op];
                let plan = [];
                while (plan.length < ex.n) plan = plan.concat(shuffle(ops));
                queue = plan.slice(0, ex.n).map(op => genSpec(op, ex));
            }
            S.run = { queue, opts: exOpts(), wret: ex.wret, qi: 0, results: [], stars: 0, phase: 'play', medal: '' };
            loadOp(S.run);
            return '';
        }
        function editableOrder(Rn, L) {
            return L.order.filter(id => { const it = byId(L, id); return !it.opt || Rn.wret; });
        }
        function loadOp(Rn) {
            const L = curRunLayout(Rn);
            Rn.ans = {}; Rn.marks = null; Rn.errors = 0; Rn.hints = 0; Rn.helped = false; Rn.phase = 'play'; Rn.view = 'grid'; Rn.astep = 0;
            const ord = editableOrder(Rn, L).filter(id => byId(L, id).expect !== '');
            Rn.sel = ord[0] || null;
            const sp = Rn.queue[Rn.qi];
            const n = Rn.queue.length;
            Rn.say = { mood: '', html: `🦉 Opération ${Rn.qi + 1} sur ${n} : <b>${esc(specText(sp))}</b>. ` + (sp.op === 'div'
                ? 'Commence par chercher le premier chiffre du quotient.'
                : 'Touche une case et écris le chiffre. Commence par la <b>droite</b> !') };
        }
        function valOk(it, v) { return v === it.expect || (it.alt || []).indexOf(v) !== -1; }
        function exCheck(Rn) {
            const L = curRunLayout(Rn);
            const cells = L.items.filter(it => it.ans && !it.opt);
            if (!cells.some(it => (Rn.ans[it.id] || '') !== '')) { Rn.say = { mood: 'bad', html: '✋ Écris d\'abord ta réponse dans les cases pointillées.' }; sfx('bad'); return; }
            Rn.marks = {};
            let bad = 0, good = 0, todo = 0;
            cells.forEach(it => {
                const v = Rn.ans[it.id] || '';
                const ok = valOk(it, v);
                Rn.marks[it.id] = ok ? 'ok' : 'ko';
                if (ok) { if (it.expect !== '') good++; }
                else { bad++; if (v === '') todo++; }
            });
            if (!bad) {
                const st = Rn.errors === 0 && Rn.hints === 0 && !Rn.helped ? 3 : Rn.errors + Rn.hints <= 2 ? 2 : 1;
                Rn.stars += st; Rn.results[Rn.qi] = st === 3 ? 'good' : 'meh'; Rn.phase = 'won';
                Rn.say = { mood: 'good', html: `🎉 ${pick(['Bravo', 'Parfait', 'Super', 'Excellent', 'Génial'])} ! ${esc(L.summary)} ${'⭐'.repeat(st)}` };
                sfx('good'); if (st === 3) party();
                return;
            }
            Rn.errors++;
            const total = cells.filter(it => it.expect !== '').length;
            let tip = '';
            if (todo === bad) tip = ' Il reste des cases vides à remplir.';
            else if (cells.some(it => it.expect === '' && (Rn.ans[it.id] || '') !== '' && !valOk(it, Rn.ans[it.id]))) tip = ' Attention : certaines cases doivent rester vides.';
            else if (Rn.errors >= 2) tip = ' Besoin d\'aide ? Essaie 💡 Indice.';
            Rn.say = { mood: 'bad', html: `🤔 Pas encore ! <b>${good}</b> chiffre${good > 1 ? 's' : ''} juste${good > 1 ? 's' : ''} sur ${total} (en vert), les cases rouges sont à corriger.${tip}` };
            sfx('bad');
        }
        function exHint(Rn) {
            const L = curRunLayout(Rn);
            const ord = L.order.filter(id => { const it = byId(L, id); return !it.opt && it.expect !== ''; });
            const id = ord.find(x => !valOk(byId(L, x), Rn.ans[x] || ''));
            if (!id) { Rn.say = { mood: '', html: '💡 Toutes les cases semblent remplies : clique sur ✔ Vérifier !' }; return; }
            const it = byId(L, id);
            Rn.ans[id] = it.expect; Rn.hints++; Rn.sel = id;
            if (Rn.marks) delete Rn.marks[id];
            Rn.say = { mood: '', html: '💡 ' + (L.steps[it.step] ? L.steps[it.step].t : '') };
            sfx('pop');
        }
        function moveSel(Rn, dir) {
            const L = curRunLayout(Rn);
            const ord = editableOrder(Rn, L);
            const i = ord.indexOf(Rn.sel);
            if (dir > 0) {
                // Case suivante : on saute les cases qui doivent rester vides
                for (let j = i + 1; j < ord.length; j++) if (byId(L, ord[j]).expect !== '' || byId(L, ord[j]).k === 'car') { Rn.sel = ord[j]; return; }
            } else if (i > 0) Rn.sel = ord[i - 1];
        }
        function typeKey(Rn, k) {
            if (Rn.phase !== 'play' || !Rn.sel) return;
            if (k === 'del') { delete Rn.ans[Rn.sel]; if (Rn.marks) delete Rn.marks[Rn.sel]; return; }
            if (k === 'next') { moveSel(Rn, 1); return; }
            Rn.ans[Rn.sel] = String(k);
            if (Rn.marks) delete Rn.marks[Rn.sel];
            sfx('pop');
            moveSel(Rn, 1);
        }
        function exNext(Rn) {
            if (canSpeak) window.speechSynthesis.cancel();
            if (Rn.qi >= Rn.queue.length - 1) {
                Rn.phase = 'final';
                const max = Rn.queue.length * 3;
                Rn.medal = Rn.stars >= max - 2 ? '🥇' : Rn.stars >= Math.round(max * 0.6) ? '🥈' : '🥉';
                sfx('win'); if (Rn.medal === '🥇') party();
            } else { Rn.qi++; loadOp(Rn); }
        }

        // ── Lecture automatique des étapes ──
        function stopAuto() { if (autoT) { clearInterval(autoT.id); autoT = null; } }
        function stepTo(tgt, d) {
            const L = tgt === 'demo' ? demoLayout() : curRunLayout(S.run);
            const n = L.steps.length;
            let k = tgt === 'demo' ? S.dstep : S.run.astep;
            if (d === 'first') k = 0; else if (d === 'last') k = n - 1; else k = Math.max(0, Math.min(n - 1, k + d));
            if (tgt === 'demo') S.dstep = k; else S.run.astep = k;
            if (d === 1 && S.sound) {
                const hasCar = L.items.some(it => it.step === k && !it.g && (it.k === 'car' || it.k === 'b'));
                sfx(hasCar ? 'drop' : 'pop');
            }
            return k >= n - 1;
        }
        function startAuto(tgt) {
            stopAuto();
            const L = tgt === 'demo' ? demoLayout() : curRunLayout(S.run);
            const cur = tgt === 'demo' ? S.dstep : S.run.astep;
            if (cur >= L.steps.length - 1) { if (tgt === 'demo') S.dstep = 0; else S.run.astep = 0; }
            autoT = { tgt, id: setInterval(() => {
                if (!widget.isConnected) { stopAuto(); return; }
                const end = stepTo(tgt, 1);
                if (end) stopAuto();
                render();
            }, 2600) };
        }

        // ── Actions ──
        function act(a, el) {
            const Rn = S.run, ex = S.ex;
            if (a !== 'auto' && a !== 'say' && a !== 'cs' && a !== 'cols') stopAuto();
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🧮 Opérations posées', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); requestAnimationFrame(fitGrids); return;
                case 'close':
                    if (canSpeak) window.speechSynthesis.cancel();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; S.dstep = 0; prevStep.demo = -1; body.scrollTop = 0; break;
                case 'dpose': {
                    const inp = body.querySelector('.opp-demo-in');
                    if (inp) S.demo[S.lesson] = inp.value;
                    const sp = parseOp(S.demo[S.lesson]);
                    if (sp && !sp.err && sp.op !== S.lesson) { S.demo[sp.op] = S.demo[S.lesson]; S.demo[S.lesson] = DEMO_DEFAULT[S.lesson]; S.lesson = sp.op; }
                    S.dstep = 0; prevStep.demo = -1;
                    break;
                }
                case 'drandom': {
                    const sp = genSpec(S.lesson, { level: S.lesson === 'div' ? 2 : 2, terms: 2, carry: 'avec', dec: 0, dexact: false });
                    S.demo[S.lesson] = specText(sp).replace('×', 'x').replace('÷', ':');
                    S.dstep = 0; prevStep.demo = -1;
                    break;
                }
                case 'dmethod': S.dmethod = el.dataset.v; S.dstep = 0; break;
                case 'ddsub': S.ddsub = el.dataset.v === '1'; S.dstep = 0; break;
                case 'step': stepTo(el.dataset.tgt, isNaN(+el.dataset.d) ? el.dataset.d : +el.dataset.d); break;
                case 'auto':
                    if (autoT && autoT.tgt === el.dataset.tgt) stopAuto(); else startAuto(el.dataset.tgt);
                    break;
                case 'say': {
                    const L = el.dataset.tgt === 'demo' ? demoLayout() : curRunLayout(Rn);
                    const k = el.dataset.tgt === 'demo' ? S.dstep : Rn.astep;
                    if (L.steps[k]) speak(L.steps[k].t);
                    return;
                }
                case 'cols': S.cols = !S.cols; prevStep.demo = prevStep.ex = 1e9; break;
                case 'cs': S.cs = Math.max(28, Math.min(96, S.cs + (+el.dataset.d))); prevStep.demo = prevStep.ex = 1e9; break;
                case 'practice':
                    ex.op = el.dataset.v; ex.mode = 'auto'; S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'op': ex.op = el.dataset.v; msg = ''; break;
                case 'level': ex.level = +el.dataset.v; ex.mode = 'auto'; msg = ''; break;
                case 'mode': ex.mode = el.dataset.v; msg = ''; break;
                case 'terms': ex.terms = +el.dataset.v; break;
                case 'carry': ex.carry = el.dataset.v; break;
                case 'dec': ex.dec = +el.dataset.v; break;
                case 'dexact': ex.dexact = el.dataset.v === '1'; break;
                case 'method': ex.method = el.dataset.v; break;
                case 'dsub': ex.dsub = el.dataset.v === '1'; break;
                case 'wret': ex.wret = el.dataset.v === '1'; if (Rn) Rn.wret = ex.wret; break;
                case 'n': ex.n = +el.dataset.v; break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'cell': {
                    if (!Rn || Rn.phase !== 'play') return;
                    const L = curRunLayout(Rn), it = byId(L, el.dataset.id);
                    if (it.k === 'b') { if (Rn.ans[it.id]) delete Rn.ans[it.id]; else Rn.ans[it.id] = '1'; sfx('drop'); }
                    else Rn.sel = it.id;
                    help.classList.remove('show');
                    break;
                }
                case 'key': if (Rn) typeKey(Rn, el.dataset.k); break;
                case 'check': if (Rn && Rn.phase === 'play') exCheck(Rn); break;
                case 'hint': if (Rn && Rn.phase === 'play') exHint(Rn); break;
                case 'clear':
                    if (!Rn || Rn.phase !== 'play') return;
                    Rn.ans = {}; Rn.marks = null;
                    { const L = curRunLayout(Rn); Rn.sel = editableOrder(Rn, L).filter(id => byId(L, id).expect !== '')[0] || null; }
                    break;
                case 'show':
                    if (!Rn) return;
                    if (Rn.phase === 'play') { Rn.phase = 'shown'; Rn.results[Rn.qi] = 'meh'; Rn.say = { mood: '', html: '🎬 Voici la correction pas à pas.' }; }
                    Rn.view = 'anim'; Rn.astep = 0; prevStep.ex = -1;
                    break;
                case 'view': if (Rn) Rn.view = 'grid'; break;
                case 'skip': {
                    if (!Rn || Rn.phase !== 'play') return;
                    Rn.results[Rn.qi] = 'meh';
                    const sol = `⏭ La réponse était : <b>${esc(curRunLayout(Rn).summary)}</b>`;
                    exNext(Rn);
                    if (Rn.phase === 'play') Rn.say = { mood: '', html: sol + '<br>' + Rn.say.html };
                    break;
                }
                case 'next': if (Rn) exNext(Rn); break;
                default: return;
            }
            render(); save();
        }

        // ── Événements : souris, stylet et tactile (dédoublonnés) ──
        // Le « pointerup » agit tout de suite ; le « click » qui le suit est ignoré
        // (la page a été redessinée entre-temps). Le « click » seul (clavier) agit.
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
            active = true;
            if (typeof bringToFront === 'function') bringToFront(widget);
            // Seule la barre de titre (hors boutons) sert à déplacer le widget
            if (e.target.closest('.opp-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.opp-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Saisie de texte (sans tout redessiner)
        container.addEventListener('input', e => {
            const t = e.target;
            if (t.classList.contains('opp-demo-in')) { S.demo[S.lesson] = t.value; saveSoon(); }
            else if (t.classList.contains('opp-mine')) {
                S.ex.mine = t.value;
                const lines = t.value.split(/\r?\n/).filter(l => l.trim());
                const okN = lines.filter(l => { const p = parseOp(l); return p && !p.err; }).length;
                const c = body.querySelector('.opp-mine-count');
                if (c) c.textContent = `${okN} opération${okN > 1 ? 's' : ''} utilisable${okN > 1 ? 's' : ''}${lines.length > okN ? ' · ' + (lines.length - okN) + ' ligne(s) illisible(s)' : ''}`;
                saveSoon();
            }
        });
        container.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.classList.contains('opp-demo-in')) { e.preventDefault(); act('dpose', e.target); }
        });
        // Clavier physique pendant un exercice
        function onKey(e) {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            if (!active || S.tab !== 'train' || !S.run || S.run.phase !== 'play' || S.run.view === 'anim') return;
            const tg = e.target;
            if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const Rn = S.run;
            if (/^[0-9]$/.test(e.key)) typeKey(Rn, e.key);
            else if (e.key === 'Backspace' || e.key === 'Delete') typeKey(Rn, 'del');
            else if (e.key === 'ArrowRight' || e.key === 'Tab') moveSel(Rn, 1);
            else if (e.key === 'ArrowLeft') moveSel(Rn, -1);
            else if (e.key === 'Enter') exCheck(Rn);
            else return;
            e.preventDefault(); e.stopPropagation();
            render(); saveSoon();
        }
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', function closeHelp(e) {
            if (!widget.isConnected) { document.removeEventListener('pointerdown', closeHelp, true); return; }
            if (!container.contains(e.target)) active = false;
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
                fitGrids();
            };
            const up = () => { resizeHandle.removeEventListener('pointermove', mv); resizeHandle.removeEventListener('pointerup', up); save(); };
            resizeHandle.addEventListener('pointermove', mv);
            resizeHandle.addEventListener('pointerup', up);
        });
        if (typeof ResizeObserver === 'function') {
            let raf = 0;
            new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fitGrids); }).observe(body);
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
        widget._opGetData = function () {
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
            fitGrids();
            save();
        }));
        return widget;
    };

    // Accès au moteur (tests, autres activités)
    window._oppEngine = { parseOp, buildOp, genSpec };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createOperationsPoseesWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
