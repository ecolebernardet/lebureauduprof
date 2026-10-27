// =========================================================================
// ACTIVITÉ « LES TABLES DE MULTIPLICATION » — Le Bureau du Prof
// Leçons pleines d'astuces + exercices (même présentation que « Opérations posées »).
//
// 📖 Leçons :
//    🦸 Les super-pouvoirs : l'ordre ne compte pas, je découpe (×5 + reste),
//       les comptines (1-2-3-4, 5-6-7-8), l'ordre conseillé pour apprendre.
//    🔢 La table de Pythagore « qui fond » : à chaque astuce, les cases
//       déjà connues s'effacent… il ne reste que 15 faits à apprendre !
//    ×1 … ×10 : une leçon par table, avec une animation propre à chaque table
//       (miroir du 2, pavé de calculatrice du 3, doubles du 4 et du 8,
//       horloge du 5, doigts du 9, glissement d'un rang du 10…),
//       la table en « cache-cache », la lecture à voix haute et
//       « ce que tu sais déjà » (les faits appris dans les autres tables).
// ✏️ Exercices : une table ou plusieurs (toutes en même temps).
//    Modes : je tape la réponse, QCM, le facteur caché, vrai ou faux, mélange.
//    Séries de 10, 20, 30 questions, toute la table dans l'ordre, ou défi
//    « 1 minute ». Chrono par question en option. Une erreur revient en fin
//    de série, avec l'astuce qui aide à la retenir. 🗺️ La carte de mes tables
//    garde en mémoire les faits réussis / ratés, et le mode 🎯 « points
//    faibles » interroge davantage sur les faits difficiles.
//
// Ouverture : createWidget('tables-multi')  ou  createTablesMultiWidget()
// Sauvegarde : w._tmuGetData()  /  createTablesMultiWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'tables-multi';

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

    // ── CSS (préfixe tmu-) ────────────────────────────────────────────────
    if (!document.getElementById('tmu-style')) {
        const s = document.createElement('style');
        s.id = 'tmu-style';
        s.textContent = `
.widget[data-type="tables-multi"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.tmu-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC; --tc:#6C4FD8;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.tmu-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .tmu-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .tmu-tab-lbl { display:none; }
    .tmu-title { font-size:17px !important; }
    .tmu-lesson { flex-direction:column; }
    .tmu-side { width:auto !important; }
    .tmu-tbtns { grid-template-columns:repeat(5, 1fr) !important; }
    .tmu-srow > .l { min-width:0 !important; width:100%; }
    .tmu-pad { grid-template-columns:repeat(3, 50px) !important; }
    .tmu-key { height:50px !important; font-size:22px !important; }
}
.tmu-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.tmu-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.tmu-tabs { display:flex; gap:6px; margin-left:12px; }
.tmu-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.tmu-tab:hover { background:rgba(255,255,255,.1); }
.tmu-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.tmu-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.tmu-icon-btn:hover { background:rgba(255,255,255,.28); }
.tmu-body { flex:1; min-height:0; overflow:auto; position:relative; container-type:inline-size; }

/* ── Leçons ── */
.tmu-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.tmu-side { width:190px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.tmu-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.tmu-gbtn:hover { transform:translateX(2px); }
.tmu-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.tmu-sidelbl { font-size:12px; font-weight:900; color:#7b7393; text-transform:uppercase; letter-spacing:.6px; margin-top:6px; }
.tmu-tbtns { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.tmu-tbtn { border:2px solid var(--c); background:#fff; color:var(--c); border-radius:12px; padding:7px 4px; font:inherit; font-weight:900; font-size:16px; touch-action:manipulation; }
.tmu-tbtn.active { background:var(--c); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.tmu-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.tmu-ltitle { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
.tmu-ltitle h2 { margin:0; font-size:32px; font-weight:900; color:var(--tc); }
.tmu-ltitle .sub { font-size:16px; font-weight:800; color:#6a6380; font-style:italic; }
.tmu-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.tmu-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.tmu-box ul, .tmu-box ol { margin:4px 0 0; padding-left:22px; }
.tmu-box li { margin:3px 0; }
.tmu-what { background:#f1edff; border:2px solid #c8bbf5; }
.tmu-tips { background:#fff6d6; border:2px solid #f3d36b; }
.tmu-trap { background:#ffecee; border:2px solid #f6a7b0; }
.tmu-know { background:#e9f8f0; border:2px solid #8fd8b0; }
.tmu-song { background:#e8f4ff; border:2px solid #a9d1f5; }
.tmu-hl { background:#FFE58A; border-radius:5px; padding:0 3px; font-weight:900; }
.tmu-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.tmu-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.tmu-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.tmu-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.tmu-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.tmu-btn:disabled { opacity:.45; }

/* ── Démonstration (leçon d'une table) ── */
.tmu-demo { background:#fff; border:3px solid var(--tc); border-radius:18px; padding:12px; display:flex; flex-direction:column; gap:10px; align-items:center; }
.tmu-kbar { display:flex; gap:5px; flex-wrap:wrap; justify-content:center; align-items:center; }
.tmu-k { width:38px; height:38px; border-radius:50%; border:2px solid #e3d8c3; background:#fff; font:inherit; font-weight:900; font-size:16px; color:var(--encre); touch-action:manipulation; padding:0; }
.tmu-k.on { background:var(--tc); border-color:var(--tc); color:#fff; transform:scale(1.12); }
.tmu-eq { font-size:clamp(34px, 6.5cqw, 64px); font-weight:900; font-family:'Andika','Nunito',sans-serif; letter-spacing:1px; }
.tmu-eq .r { color:var(--tc); display:inline-block; animation:tmu-pop .45s ease-out; }
@keyframes tmu-pop { 0% { transform:scale(.3); opacity:0; } 70% { transform:scale(1.15); opacity:1; } 100% { transform:scale(1); } }
.tmu-vis { display:flex; flex-wrap:wrap; gap:18px; align-items:center; justify-content:center; width:100%; }
.tmu-vcap { font-size:15px; font-weight:700; text-align:center; line-height:1.45; max-width:520px; }
.tmu-dots { display:grid; gap:4px; padding:8px; background:#fbf7ef; border-radius:12px; border:2px dashed #e3d8c3; }
.tmu-dot { border-radius:50%; animation:tmu-pop .35s ease-out backwards; }
.tmu-mirror { display:flex; align-items:center; gap:10px; }
.tmu-mirror .bar { width:5px; align-self:stretch; background:linear-gradient(#b7d7ff,#5ba3f5); border-radius:3px; box-shadow:0 0 8px #9cc8ff; }
.tmu-chain { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:center; }
.tmu-chain .n { min-width:54px; padding:8px 10px; border-radius:12px; background:#fff; border:3px solid var(--tc); font-size:24px; font-weight:900; text-align:center; animation:tmu-pop .4s ease-out backwards; }
.tmu-chain .n.last { background:var(--tc); color:#fff; }
.tmu-chain .a { font-size:13px; font-weight:900; color:var(--tc); display:flex; flex-direction:column; align-items:center; }
.tmu-chain .a::after { content:'➜'; font-size:20px; }
.tmu-pave { display:grid; grid-template-columns:repeat(3, 54px); gap:6px; padding:10px; background:#3a3352; border-radius:14px; }
.tmu-pkey { height:54px; border-radius:10px; background:#5b5277; color:#fff; font-size:24px; font-weight:900; display:flex; align-items:center; justify-content:center; position:relative; }
.tmu-pkey.seen { background:#27AE60; }
.tmu-pkey.cur { background:var(--or); color:var(--encre); transform:scale(1.1); box-shadow:0 0 0 4px #fff6; }
.tmu-pkey i { position:absolute; top:2px; right:5px; font-style:normal; font-size:11px; opacity:.85; }
.tmu-hands { display:flex; align-items:flex-end; gap:5px; padding:10px 14px 6px; background:#fbf7ef; border-radius:14px; }
.tmu-hgap { width:22px; }
.tmu-finger { width:30px; border:none; border-radius:15px 15px 6px 6px; font:inherit; font-size:12px; font-weight:900; color:#fff; padding:0; display:flex; align-items:flex-start; justify-content:center; padding-top:4px; box-sizing:border-box; touch-action:manipulation; transition:height .3s; }
.tmu-finger.tens { background:#2F80ED; }
.tmu-finger.units { background:#F2994A; }
.tmu-finger.fold { background:#c9c1d9; height:18px !important; }
.tmu-num { display:grid; grid-template-columns:repeat(4, 54px); border:3px solid var(--encre); border-radius:10px; overflow:hidden; }
.tmu-num > div { height:48px; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900; border-left:1px solid #d9cdb6; border-top:1px solid #d9cdb6; }
.tmu-num > .h { height:28px; font-size:13px; background:#f1edff; color:#6a6380; border-top:none; }
.tmu-num > .z { color:var(--tc); animation:tmu-pop .5s ease-out; }
.tmu-table { display:grid; grid-template-columns:repeat(2, 1fr); gap:4px 22px; width:100%; max-width:560px; }
.tmu-trow { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 12px; border-radius:10px; font-size:22px; font-weight:800; font-family:'Andika','Nunito',sans-serif; background:#fff; border:2px solid #efe6d4; }
.tmu-trow.cur { border-color:var(--tc); background:#f7f3ff; }
.tmu-trow .res { min-width:56px; text-align:right; color:var(--tc); font-weight:900; }
.tmu-trow .res.hid { color:transparent; background:repeating-linear-gradient(45deg,#e8ddc8,#e8ddc8 6px,#f3ecdd 6px,#f3ecdd 12px); border-radius:8px; }
.tmu-knowrow { display:flex; gap:5px; flex-wrap:wrap; margin-top:6px; }
.tmu-kf { border-radius:10px; padding:4px 9px; font-weight:900; font-size:14px; background:#fff; border:2px solid #8fd8b0; }
.tmu-kf.new { background:#ffe58a; border-color:#f3c23b; }
.tmu-kf small { display:block; font-size:10.5px; font-weight:700; color:#6a6380; }
.tmu-clock text { font-family:'Nunito',sans-serif; font-weight:900; }

/* ── Pythagore ── */
.tmu-pyth { display:grid; gap:3px; justify-content:center; }
.tmu-pc { width:var(--pc,44px); height:var(--pc,44px); display:flex; align-items:center; justify-content:center; border-radius:8px; font-weight:900; font-size:calc(var(--pc,44px) * .38);
    background:#fff; border:2px solid #efe6d4; transition:opacity .4s, transform .2s, background .3s; touch-action:manipulation; padding:0; font-family:'Andika','Nunito',sans-serif; color:var(--encre); }
.tmu-pc.hd { background:var(--encre); color:var(--or); border-color:var(--encre); }
.tmu-pc.gone { opacity:.18; transform:scale(.82); }
.tmu-pc.left { background:#ffe58a; border-color:#f3c23b; }
.tmu-pc.sq { box-shadow:inset 0 0 0 2px #9B51E0; }
.tmu-pc.line { outline:3px solid #b9abef; outline-offset:-1px; }
.tmu-pc.sel { background:var(--violet); color:#fff; border-color:var(--violet); transform:scale(1.12); }
.tmu-steps { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }
.tmu-say { border-radius:14px; padding:8px 14px; font-size:17px; line-height:1.5; text-align:center; background:#f1edff; border:2px solid #c8bbf5; min-height:28px; width:100%; box-sizing:border-box; }
.tmu-say.good { background:#e2f7ec; border-color:#8fd8b0; }
.tmu-say.bad { background:#ffe9eb; border-color:#f6a7b0; }

/* ── Exercices ── */
.tmu-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.tmu-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.tmu-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.tmu-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:130px; }
.tmu-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.tmu-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.tmu-chip.tb { min-width:40px; font-size:15px; font-weight:900; }
.tmu-hint { font-size:12.5px; color:#6a6380; }
.tmu-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.tmu-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.tmu-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.tmu-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.tmu-pill.fire { background:#FF7A1A; }
.tmu-time { height:12px; border-radius:6px; background:#ece4d4; overflow:hidden; width:100%; }
.tmu-time > i { display:block; height:100%; width:100%; background:linear-gradient(90deg,#2FBF71,#FFC933 60%,#FF4F5E); border-radius:6px; transform-origin:left; }
.tmu-stage { display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:wrap; }
.tmu-qcard { flex:1 1 340px; min-width:0; max-width:640px; background:#fff; border:3px solid var(--tc); border-radius:20px; padding:16px 14px; display:flex; flex-direction:column; align-items:center; gap:12px; box-shadow:0 5px 0 rgba(0,0,0,.08); }
.tmu-q { font-size:clamp(40px, 9cqw, 96px); font-weight:900; font-family:'Andika','Nunito',sans-serif; line-height:1.05; text-align:center; white-space:nowrap; }
.tmu-q .ans { display:inline-block; min-width:1.6em; padding:0 .15em; border-bottom:5px solid var(--tc); color:#3949AB; text-align:center; }
.tmu-q .ans.blink::after { content:'|'; color:var(--tc); animation:tmu-blink 1s steps(1) infinite; }
@keyframes tmu-blink { 50% { opacity:0; } }
.tmu-q .ans.ok { color:#178a4b; border-color:var(--vert); }
.tmu-q .ans.ko { color:#c0293a; border-color:var(--rouge); text-decoration:line-through; }
.tmu-qcard.shake { animation:tmu-shake .4s; }
@keyframes tmu-shake { 20%,60% { transform:translateX(-8px); } 40%,80% { transform:translateX(8px); } }
.tmu-qcard.yay { animation:tmu-yay .5s; }
@keyframes tmu-yay { 40% { transform:scale(1.04); } }
.tmu-choices { display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; max-width:460px; }
.tmu-choice { border:none; border-radius:16px; padding:12px 6px; font:inherit; font-size:clamp(24px, 4.5cqw, 40px); font-weight:900; background:#f1edff; color:var(--encre);
    box-shadow:0 4px 0 #cfc3f7; touch-action:manipulation; font-family:'Andika','Nunito',sans-serif; }
.tmu-choice:active { transform:translateY(3px); box-shadow:0 1px 0 #cfc3f7; }
.tmu-choice.good { background:var(--vert); color:#fff; box-shadow:0 4px 0 #1e8a50; }
.tmu-choice.bad { background:var(--rouge); color:#fff; box-shadow:0 4px 0 #b02a37; }
.tmu-choice.vrai { background:#e2f7ec; box-shadow:0 4px 0 #8fd8b0; }
.tmu-choice.faux { background:#ffe9eb; box-shadow:0 4px 0 #f6a7b0; }
.tmu-pad { display:grid; grid-template-columns:repeat(3, 60px); gap:8px; padding:10px; background:#fff; border:2px solid #e3d8c3; border-radius:16px; flex-shrink:0; }
.tmu-key { height:60px; border:none; border-radius:12px; background:#f1edff; color:var(--encre); font:inherit; font-size:26px; font-weight:900;
    box-shadow:0 3px 0 #cfc3f7; touch-action:manipulation; font-family:'Andika','Nunito',sans-serif; }
.tmu-key:active { transform:translateY(2px); box-shadow:0 1px 0 #cfc3f7; }
.tmu-key.fn { background:#fff6d6; box-shadow:0 3px 0 #f3d36b; font-size:20px; }
.tmu-key.ok { background:var(--vert); color:#fff; box-shadow:0 3px 0 #1e8a50; font-size:22px; }
.tmu-fb { width:100%; box-sizing:border-box; border-radius:14px; padding:8px 12px; font-size:16px; line-height:1.5; text-align:center; }
.tmu-fb.good { background:#e2f7ec; border:2px solid #8fd8b0; }
.tmu-fb.bad { background:#ffe9eb; border:2px solid #f6a7b0; }
.tmu-fb.tip { background:#fff6d6; border:2px solid #f3d36b; }
.tmu-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.tmu-dots2 { display:flex; gap:3px; flex-wrap:wrap; max-width:420px; }
.tmu-d { width:11px; height:11px; border-radius:50%; background:#e3d8c3; }
.tmu-d.good { background:var(--vert); } .tmu-d.bad { background:var(--rouge); } .tmu-d.cur { background:var(--violet); box-shadow:0 0 0 3px #cfc3f7; } .tmu-d.retry { background:#FFB020; }
.tmu-map { display:grid; grid-template-columns:repeat(11, 1fr); gap:2px; width:100%; max-width:360px; }
.tmu-map > div { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:10px; font-weight:900; color:#5a5470; background:#eee8dc; }
.tmu-map > .h { background:var(--encre); color:var(--or); }
.tmu-map > .m0 { background:#eee8dc; color:transparent; }
.tmu-map > .m1 { background:#ff9aa5; } .tmu-map > .m2 { background:#ffd27a; } .tmu-map > .m3 { background:#c8efd6; } .tmu-map > .m4 { background:#6fd39b; color:#fff; }
.tmu-map > .x { outline:2px solid var(--rouge); outline-offset:-2px; }
.tmu-legend { display:flex; gap:8px; flex-wrap:wrap; font-size:11.5px; font-weight:700; color:#6a6380; }
.tmu-legend i { display:inline-block; width:11px; height:11px; border-radius:3px; vertical-align:-1px; margin-right:3px; }
.tmu-final { text-align:center; display:flex; flex-direction:column; gap:10px; align-items:center; }
.tmu-final .medal { font-size:64px; }
.tmu-errs { display:flex; flex-direction:column; gap:6px; width:100%; max-width:640px; text-align:left; }
.tmu-err { background:#fff; border:2px solid #f6a7b0; border-radius:12px; padding:6px 10px; font-size:14px; line-height:1.45; }
.tmu-err b.f { font-size:17px; color:#c0293a; margin-right:6px; }
.tmu-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:tmu-conf 1.6s ease-in forwards; }
@keyframes tmu-conf { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.tmu-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:430px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.tmu-help.show { display:block; }
.tmu-help h4 { margin:0 0 6px; font-size:15px; }
.tmu-help p { margin:0 0 6px; }
.tmu-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.tmu-container:hover .tmu-resize { opacity:1; }
.tmu-container.wf-fullboard .tmu-resize { display:none; }
@media (prefers-reduced-motion: reduce) { .tmu-container * { animation:none !important; } }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="tables-multi"], .tmu-container, .tmu-container * { cursor:default !important; }
.tmu-container .tmu-header { cursor:grab !important; }
.tmu-container .tmu-header:active { cursor:grabbing !important; }
.tmu-container button, .tmu-container [data-act] { cursor:pointer !important; }
.tmu-container button:disabled { cursor:default !important; }
.tmu-container .tmu-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // OUTILS
    // =====================================================================
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const HL = t => `<span class="tmu-hl">${t}</span>`;
    const ord = n => n === 1 ? '1<sup>er</sup>' : n + '<sup>e</sup>';
    const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');

    // Couleur de chaque table
    const TCOL = { 1: '#7F8C8D', 2: '#2F80ED', 3: '#27AE60', 4: '#F2994A', 5: '#EB5757', 6: '#9B51E0', 7: '#16A085', 8: '#D35400', 9: '#C2185B', 10: '#B7950B' };
    const factKey = (a, b) => Math.min(a, b) + 'x' + Math.max(a, b);

    // =====================================================================
    // L'ASTUCE QUI AIDE À RETENIR UN FAIT (a × b)
    //   hide = true : on montre la méthode sans donner le résultat (indice)
    // =====================================================================
    function tipFor(a, b, hide) {
        const p = a * b, lo = Math.min(a, b), hi = Math.max(a, b);
        const P = hide ? '<b>?</b>' : `<b>${p}</b>`;
        const oth = n => (lo === n ? hi : lo);
        const SPECIAL = {
            '7x8': `🎵 5, 6, 7, 8 : 56 = 7 × 8 ! Les quatre chiffres se suivent.`,
            '3x4': `🎵 1, 2, 3, 4 : 12 = 3 × 4 ! Les quatre chiffres se suivent.`,
            '6x7': `6 × 7 = 6 × 5 + 6 × 2 = 30 + 12 = ${P}. Retiens : « six fois sept, quarante-deux, c'est la réponse à toutes les questions ! »`,
            '6x8': `6 × un nombre pair finit par ce même nombre : 6 × 8 = 4… <b>8</b>. Et 6 × 8 = 5 × 8 + 8 = 40 + 8 = ${P}.`,
            '6x6': `6 × un nombre pair finit par ce même nombre : 6 × 6 = 3… <b>6</b>. Et 6 × 6 = 5 × 6 + 6 = 30 + 6 = ${P}.`,
            '4x6': `6 × un nombre pair finit par ce même nombre : 6 × 4 = 2… <b>4</b>. Double du double : 6 → 12 → ${P}.`,
            '7x7': `7 × 7, c'est un carré : 7 × 5 + 7 × 2 = 35 + 14 = ${P}.`,
            '8x8': `8 × 8 : double, double, double ! 8 → 16 → 32 → ${P}. Un échiquier a 8 × 8 = 64 cases ♟️.`
        };
        const key = factKey(a, b);
        if (SPECIAL[key] && !(hide && /^🎵/.test(SPECIAL[key]))) return SPECIAL[key];
        if (SPECIAL[key] && hide) return key === '7x8' ? '🎵 Pense à la comptine « 5, 6, 7, 8 »…' : '🎵 Pense à la comptine « 1, 2, 3, 4 »…';
        if (lo === 0) return `Multiplier par 0, ça donne toujours 0 : le zéro avale tout !`;
        if (lo === 1) return `Multiplier par 1 ne change rien : le nombre se regarde dans un miroir. ${hi} × 1 = ${hide ? '<b>?</b>' : '<b>' + hi + '</b>'}.`;
        if (hi === 10) return `× 10 : j'écris un 0 à droite, chaque chiffre glisse d'un rang. ${lo} × 10 = ${P}.`;
        if (lo === 2) return `× 2, c'est le double : ${hi} + ${hi} = ${P}.`;
        if (lo === 5 || hi === 5) { const o = oth(5); return `× 5, c'est la moitié de × 10 : ${o} × 10 = ${o * 10}, et la moitié de ${o * 10}, c'est ${P}. Sur l'horloge : la grande aiguille sur le ${o}, c'est ${hide ? '?' : p} minutes 🕐.`; }
        if (hi === 9) { const o = lo; return `Astuce des doigts ✋✋ : je plie le ${ord(o)} doigt. À gauche ${plural(o - 1, 'doigt')} (les dizaines), à droite ${plural(10 - o, 'doigt')} (les unités) : ${P}. Ou bien : ${o} × 10 − ${o} = ${o * 10} − ${o} = ${P}.`; }
        if (lo === 4 || hi === 4) { const o = oth(4); return `× 4, c'est le double du double : ${o} → ${2 * o} → ${P}.`; }
        if (lo === 3 || hi === 3) { const o = oth(3); return `× 3 : le double, plus encore une fois : ${o} × 2 = ${2 * o}, puis ${2 * o} + ${o} = ${P}.`; }
        if (lo === 8 || hi === 8) { const o = oth(8); return `× 8 : double, double, double ! ${o} → ${2 * o} → ${4 * o} → ${P}.`; }
        if (lo === 6 || hi === 6) { const o = oth(6); return `× 6 = × 5, plus encore une fois : ${o * 5} + ${o} = ${P}.`; }
        if (lo === 7 || hi === 7) { const o = oth(7); return `× 7 = × 5 + × 2 : ${o * 5} + ${o * 2} = ${P}.`; }
        return `${a} × ${b} = ${P}.`;
    }

    // =====================================================================
    // CONTENU DES LEÇONS (une par table)
    // =====================================================================
    const TABLES = {
        1: {
            nick: 'le miroir',
            what: `Multiplier par 1 ne change rien : <b>1 × 7 = 7</b>. Le nombre se regarde dans un miroir et se voit… tel qu'il est ! La table de 1, c'est simplement compter : 1, 2, 3, 4…`,
            tips: [`<b>× 1</b> : le résultat, c'est l'autre nombre. 1 × 9 = 9, 8 × 1 = 8.`,
                   `<b>× 0</b> (bonus !) : le zéro est un trou noir 🕳️, il avale tout : 7 × 0 = 0, 1000 × 0 = 0.`,
                   `Grâce à la table de 1, tu connais déjà une ligne <b>et</b> une colonne entières de la table de Pythagore !`],
            trap: `Ne confonds pas « × 1 » (rien ne change) et « + 1 » (on avance d'un) : 6 × 1 = 6, mais 6 + 1 = 7.`
        },
        2: {
            nick: 'le double',
            what: `Multiplier par 2, c'est faire le <b>double</b> : ajouter le nombre à lui-même. 2 × 7 = 7 + 7 = 14.`,
            tips: [`On compte de 2 en 2 : 2, 4, 6, 8, 10, 12…`,
                   `Tous les résultats sont <b>pairs</b> : ils finissent par 0, 2, 4, 6 ou 8.`,
                   `Pense aux paires 🧦 : 7 paires de chaussettes, c'est 14 chaussettes. 🖐️🖐️ : 2 mains de 5 doigts = 10 doigts.`,
                   `Les doubles se retrouvent partout : sur les dominos, dans un miroir, avec les deux mains.`],
            trap: `2 × 6, ce n'est pas 2 + 6 = 8 ! C'est 6 + 6 = 12.`
        },
        3: {
            nick: 'le pavé magique',
            what: `Multiplier par 3, c'est faire le double, puis ajouter encore une fois le nombre : 3 × 7 = 14 + 7 = 21.`,
            tips: [`<b>Le pavé de la calculatrice</b> 🧮 : lis les colonnes <b>de bas en haut</b>, en commençant par la droite : 3, 6, 9 · 2, 5, 8 · 1, 4, 7. Ce sont les chiffres des unités de la table ! Les dizaines font : 0, 0, 0 · 1, 1, 1 · 2, 2, 2.`,
                   `Additionne les chiffres d'un résultat : tu trouves <b>toujours 3, 6 ou 9</b> ! 27 → 2 + 7 = 9 ✔. 24 → 2 + 4 = 6 ✔.`,
                   `Le trio : un tricycle a 3 roues 🚲, un trèfle 3 feuilles ☘️ : 4 trèfles = 12 feuilles.`],
            trap: `Vérifie avec l'astuce des chiffres : si tu trouves 3 × 8 = 25, alors 2 + 5 = 7 ✗ : ce n'est pas dans la table de 3 !`
        },
        4: {
            nick: 'le double du double',
            what: `Multiplier par 4, c'est faire <b>le double du double</b> : 4 × 6 → le double de 6 = 12, le double de 12 = 24.`,
            tips: [`Si tu connais la table de 2, tu connais la table de 4 : il suffit de doubler encore !`,
                   `Les résultats sont tous <b>pairs</b>. Les chiffres des unités tournent en rond : 4, 8, 2, 6, 0, 4, 8, 2, 6, 0.`,
                   `Pense aux pattes 🐱 : 6 chats, c'est 6 × 4 = 24 pattes. Une voiture 🚗 a 4 roues.`],
            trap: `Ne double pas une seule fois : 4 × 7, ce n'est pas 14 (ça, c'est 2 × 7) ! On double encore : 28.`
        },
        5: {
            nick: 'l\'horloge',
            what: `Multiplier par 5, c'est prendre <b>la moitié de × 10</b> : 5 × 8 → 10 × 8 = 80, la moitié = 40.`,
            tips: [`Les résultats finissent <b>toujours par 0 ou par 5</b>. Par 0 si on multiplie par un nombre pair, par 5 sinon.`,
                   `<b>L'horloge</b> 🕐 : quand la grande aiguille est sur le 7, il est « et 35 minutes » : 5 × 7 = 35.`,
                   `On compte de 5 en 5 : 5, 10, 15, 20… comme les doigts d'une main ✋.`],
            trap: `5 × 9 ne peut pas finir par un autre chiffre que 0 ou 5 : 45 ✔, 44 ✗.`
        },
        6: {
            nick: 'le pair qui revient',
            what: `Multiplier par 6, c'est multiplier par 5, puis ajouter encore une fois le nombre : 6 × 7 = 35 + 7 = 42.`,
            tips: [`<b>6 × un nombre pair</b> : le résultat finit par ce nombre ! 6 × 2 = 1<b>2</b>, 6 × 4 = 2<b>4</b>, 6 × 6 = 3<b>6</b>, 6 × 8 = 4<b>8</b>. Et le chiffre des dizaines, c'est la moitié du nombre !`,
                   `6, c'est le double de 3 : 6 × 7 = le double de 3 × 7 = le double de 21 = 42.`,
                   `Une boîte d'œufs 🥚 contient 6 œufs : 3 boîtes = 18 œufs.`],
            trap: `Après 6 × 5 = 30, beaucoup d'élèves se trompent : 6 × 6 = 36, 6 × 7 = 42 (pas 46 !).`
        },
        7: {
            nick: 'le dernier rempart',
            what: `La table de 7 fait peur… mais tu la connais déjà presque toute ! 7 × 1, 7 × 2, 7 × 3… se trouvent déjà dans les autres tables.`,
            tips: [`🎵 <b>5, 6, 7, 8</b> : 56 = 7 × 8. Les chiffres se suivent !`,
                   `7 × un nombre = 5 × ce nombre + 2 × ce nombre : 7 × 6 = 30 + 12 = 42.`,
                   `7 × 7 = 49 : « quarante-neuf, le carré tout neuf ».`,
                   `Une semaine a 7 jours 📅 : 3 semaines = 21 jours, 4 semaines = 28 jours.`],
            trap: `On confond souvent 7 × 8 = 56 et 6 × 9 = 54. Pense à la comptine 5, 6, 7, 8 !`
        },
        8: {
            nick: 'triple double',
            what: `Multiplier par 8, c'est faire <b>double, double, double</b> : 8 × 6 → 12 → 24 → 48.`,
            tips: [`Les chiffres des unités descendent de 2 en 2 : 8, 6, 4, 2, 0… puis ça recommence : 8, 6, 4, 2, 0.`,
                   `8 = 10 − 2 : 8 × 7 = 70 − 14 = 56.`,
                   `Une araignée 🕷️ a 8 pattes : 3 araignées = 24 pattes. Un échiquier ♟️ a 8 × 8 = 64 cases.`],
            trap: `Compte bien tes doublements : il en faut <b>trois</b> (× 2, × 2, × 2).`
        },
        9: {
            nick: 'les doigts magiques',
            what: `La table de 9 se lit sur tes doigts ✋✋ ! Et 9 × un nombre = 10 × ce nombre − ce nombre : 9 × 7 = 70 − 7 = 63.`,
            tips: [`<b>L'astuce des doigts</b> : pour 9 × 4, plie le 4<sup>e</sup> doigt. À gauche : 3 doigts (les dizaines). À droite : 6 doigts (les unités). 9 × 4 = 36 !`,
                   `Le chiffre des dizaines, c'est le nombre moins 1 : 9 × 7 → 6… Et les deux chiffres font toujours <b>9</b> : 6 + 3 = 9 → 63.`,
                   `Les dizaines montent, les unités descendent : 09, 18, 27, 36, 45, 54, 63, 72, 81, 90. Et 45/54, 36/63, 27/72, 18/81 sont des « miroirs » !`],
            trap: `9 × 6 = 54 et non 56 (ça, c'est 7 × 8). Vérifie : 5 + 4 = 9 ✔.`
        },
        10: {
            nick: 'le glissement',
            what: `Multiplier par 10, c'est écrire un <b>0 à droite</b> : 10 × 7 = 70. Chaque chiffre glisse d'un rang vers la gauche dans le tableau de numération : les unités deviennent des dizaines.`,
            tips: [`On compte de 10 en 10 : 10, 20, 30… comme les billets de 10 € 💶.`,
                   `10 × 8 = 80, c'est « huit dizaines ».`,
                   `La table de 10 aide pour la table de 5 (la moitié) et la table de 9 (10 fois moins une fois) !`],
            trap: `L'astuce du 0 marche pour les nombres entiers. Avec un nombre à virgule (2,5 × 10 = 25), c'est le glissement qui compte.`
        }
    };

    // =====================================================================
    // DESSINS
    // =====================================================================
    function rectHtml(rows, cols, o) {
        o = o || {};
        const s = Math.max(9, Math.min(22, Math.floor(240 / Math.max(rows, cols, 1))));
        let h = `<div class="tmu-dots" style="grid-template-columns:repeat(${cols}, ${s}px)">`;
        let i = 0;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            let col = o.colA || '#6C4FD8';
            if (o.splitRow && r >= o.splitRow) col = o.colB;
            if (o.splitCol && c >= o.splitCol) col = o.colB;
            h += `<span class="tmu-dot" style="width:${s}px;height:${s}px;background:${col};animation-delay:${Math.min(i++ * 12, 900)}ms"></span>`;
        }
        return h + '</div>';
    }
    // k points, rangés par 5 (comme sur un dé)
    function groupHtml(k, col) {
        let h = `<div class="tmu-dots" style="grid-template-columns:repeat(${Math.min(k, 5)}, 18px)">`;
        for (let i = 0; i < k; i++) h += `<span class="tmu-dot" style="width:18px;height:18px;background:${col};animation-delay:${i * 40}ms"></span>`;
        return h + '</div>';
    }
    function clockSvg(k, col) {
        let t = '';
        for (let h = 1; h <= 12; h++) {
            const a = (h * 30 - 90) * Math.PI / 180;
            const on = h <= k;
            t += `<text x="${80 + 58 * Math.cos(a)}" y="${84 + 58 * Math.sin(a)}" text-anchor="middle" font-size="${h === k ? 17 : 13}" fill="${h === k ? col : on ? '#2A1F4A' : '#b3abc4'}">${h}</text>`;
            t += `<text x="${80 + 74 * Math.cos(a)}" y="${83 + 74 * Math.sin(a)}" text-anchor="middle" font-size="9" fill="${h === k ? col : '#b3abc4'}">${h * 5 === 60 ? '00' : h * 5}</text>`;
        }
        const a = (k * 30 - 90) * Math.PI / 180;
        const x2 = 80 + 46 * Math.cos(a), y2 = 80 + 46 * Math.sin(a);
        // secteur parcouru
        const large = k * 30 > 180 ? 1 : 0;
        const ex = 80 + 40 * Math.cos(a), ey = 80 + 40 * Math.sin(a);
        const sector = k >= 12 ? `<circle cx="80" cy="80" r="40" fill="${col}22"/>` : `<path d="M80 80 L80 40 A40 40 0 ${large} 1 ${ex} ${ey} Z" fill="${col}22"/>`;
        return `<svg class="tmu-clock" width="170" height="170" viewBox="-5 -5 170 170">
            <circle cx="80" cy="80" r="84" fill="#fff" stroke="#2A1F4A" stroke-width="4"/>${sector}${t}
            <line x1="80" y1="80" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>
            <line x1="80" y1="80" x2="80" y2="58" stroke="#2A1F4A" stroke-width="6" stroke-linecap="round"/>
            <circle cx="80" cy="80" r="5" fill="#2A1F4A"/></svg>`;
    }
    function keypadHtml(k) {
        const seq = [3, 6, 9, 2, 5, 8, 1, 4, 7];
        let h = '<div class="tmu-pave">';
        [[7, 8, 9], [4, 5, 6], [1, 2, 3]].forEach(row => row.forEach(d => {
            const idx = seq.indexOf(d) + 1;
            const cls = idx === k ? 'cur' : idx < k ? 'seen' : '';
            h += `<div class="tmu-pkey ${cls}">${d}${idx <= k ? `<i>${idx}</i>` : ''}</div>`;
        }));
        return h + '</div>';
    }
    function handsHtml(k) {
        const FH = [0, 46, 60, 66, 60, 40, 40, 60, 66, 60, 46];
        let h = '<div class="tmu-hands">';
        for (let i = 1; i <= 10; i++) {
            if (i === 6) h += '<span class="tmu-hgap"></span>';
            const cls = i === k ? 'fold' : i < k ? 'tens' : 'units';
            h += `<button class="tmu-finger ${cls}" data-act="vk" data-v="${i}" style="height:${FH[i] + 20}px" title="Plier le ${i}e doigt">${i}</button>`;
        }
        return h + '</div>';
    }
    function chainHtml(k, times) {
        let h = '<div class="tmu-chain">', v = k;
        h += `<span class="n" style="animation-delay:0ms">${v}</span>`;
        for (let i = 1; i <= times; i++) {
            v *= 2;
            h += `<span class="a">double</span><span class="n${i === times ? ' last' : ''}" style="animation-delay:${i * 350}ms">${v}</span>`;
        }
        return h + '</div>';
    }
    function numHtml(k) {
        const a = String(k).padStart(3, ' '), b = String(k * 10).padStart(3, ' ');
        let h = '<div class="tmu-num"><div class="h">c</div><div class="h">d</div><div class="h">u</div><div class="h"></div>';
        for (let i = 0; i < 3; i++) h += `<div>${a[i].trim()}</div>`;
        h += `<div style="font-size:15px;color:#6a6380">${k}</div>`;
        for (let i = 0; i < 3; i++) h += `<div class="${i === 2 ? 'z' : ''}">${b[i].trim()}</div>`;
        h += `<div style="font-size:15px;color:#6a6380">× 10</div>`;
        return h + '</div>';
    }

    // Visuel propre à chaque table (n) pour le multiplicateur k
    function visHtml(n, k, rot) {
        const col = TCOL[n], p = n * k;
        const rect = () => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${rot ? rectHtml(k, n, { colA: col }) : rectHtml(n, k, { colA: col })}
            <div class="tmu-vcap">${rot ? `${k} rangées de ${n}` : `${n} rangées de ${k}`} = ${p} points
            <button class="tmu-btn alt small" data-act="rot" title="Tourner le rectangle">🔄 Tourner</button></div></div>`;
        let v = '', cap = '';
        switch (n) {
            case 1:
                v = rectHtml(1, k, { colA: col });
                cap = `1 rangée de ${k} points : il y a ${k} points. Rien ne change !`;
                break;
            case 2: {
                const half = groupHtml(k, col);
                v = `<div class="tmu-mirror">${half}<span class="bar"></span>${half}</div>`;
                cap = `Le miroir 🪞 : ${k} et encore ${k}, c'est le double : ${k} + ${k} = <b>${p}</b>.`;
                break;
            }
            case 3:
                if (k <= 9) {
                    v = keypadHtml(k);
                    cap = `Le pavé : le ${ord(k)} chiffre allumé est <b>${p % 10}</b> (les unités). Les dizaines : ${k <= 3 ? '0' : k <= 6 ? '1' : '2'}. Donc 3 × ${k} = <b>${p}</b>. Et ${String(p).split('').join(' + ')} = ${String(p).split('').reduce((s, d) => s + +d, 0)} ✔.`;
                } else { v = keypadHtml(9); cap = `3 × 10 = <b>30</b> : on écrit un 0 à droite de 3.`; }
                break;
            case 4: v = chainHtml(k, 2); cap = `Le double du double : ${k} → ${2 * k} → <b>${p}</b>.`; break;
            case 8: v = chainHtml(k, 3); cap = `Double, double, double : ${k} → ${2 * k} → ${4 * k} → <b>${p}</b>.`; break;
            case 5: v = clockSvg(k, col); cap = `La grande aiguille est sur le ${k} : il est « et ${p} minutes ». 5 × ${k} = <b>${p}</b>. C'est aussi la moitié de 10 × ${k} = ${10 * k}.`; break;
            case 6: v = rectHtml(6, k, { colA: TCOL[5], colB: col, splitRow: 5 });
                cap = `5 rangées (5 × ${k} = ${5 * k}) + 1 rangée (${k}) = <b>${p}</b>.` + (k % 2 === 0 && k < 10 ? ` Et ${k} est pair : le résultat finit par ${k} !` : '');
                break;
            case 7: v = rectHtml(7, k, { colA: TCOL[5], colB: col, splitRow: 5 });
                cap = `5 rangées (5 × ${k} = ${5 * k}) + 2 rangées (2 × ${k} = ${2 * k}) = <b>${p}</b>.`;
                break;
            case 9: v = handsHtml(k);
                cap = k === 10 ? `9 × 10 = 90 : 9 doigts à gauche, 0 à droite.`
                    : `Je plie le ${ord(k)} doigt (touche un doigt pour essayer). À gauche : <b style="color:#2F80ED">${k - 1}</b> dizaine${k - 1 > 1 ? 's' : ''} · à droite : <b style="color:#F2994A">${10 - k}</b> unité${10 - k > 1 ? 's' : ''} → <b>${p}</b>.`;
                break;
            case 10: v = numHtml(k); cap = `Chaque chiffre glisse d'un rang vers la gauche, et un 0 vient remplir les unités : 10 × ${k} = <b>${p}</b>.`; break;
        }
        let h = `<div class="tmu-vis"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">${v}<div class="tmu-vcap">${cap}</div></div>`;
        if ([2, 3, 4, 5, 8, 9, 10].indexOf(n) !== -1) h += rect();
        return h + '</div>';
    }

    // Faits de la table de n déjà appris ailleurs
    function knownFacts(n) {
        const easy = { 1: 'table de 1', 2: 'table de 2', 5: 'table de 5', 10: 'table de 10' };
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => {
            if (k === n && (n === 1 || n === 2 || n === 5 || n === 10)) return { k, from: 'c\'est la table facile' };
            if (easy[k] && k !== n) return { k, from: easy[k] };
            if (k < n) return { k, from: 'table de ' + k };
            return { k, from: null };
        });
    }

    // =====================================================================
    // SONS / VOIX
    // =====================================================================
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function speak(text) {
        if (!canSpeak) return;
        try {
            const tmp = document.createElement('div'); tmp.innerHTML = text;
            const t = tmp.textContent.replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').replace(/×/g, ' fois ').replace(/−/g, ' moins ').replace(/→/g, ', ');
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(t);
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
        fire: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.06 * i, 0.14)),
        bad:  () => { tone(220, 0, 0.18, 'square', 0.05); tone(170, 0.16, 0.25, 'square', 0.05); },
        pop:  () => tone(880, 0, 0.06, 'sine', 0.05),
        tick: () => tone(1200, 0, 0.03, 'sine', 0.03),
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    // =====================================================================
    // QUESTIONS
    // =====================================================================
    function distractors(x, y, n) {
        const p = x * y;
        const rev = +String(p).split('').reverse().join('');
        const cand = shuffle([x * (y + 1), x * (y - 1), (x + 1) * y, (x - 1) * y, p + 1, p - 1, p + 10, p - 10, rev, p + 2, p - 2, (x + 1) * (y + 1) - 1]);
        const out = [];
        cand.forEach(v => { if (v > 0 && v !== p && v <= 121 && out.indexOf(v) === -1 && out.length < n) out.push(v); });
        while (out.length < n) { const v = p + rnd(3, 12); if (out.indexOf(v) === -1) out.push(v); }
        return out;
    }
    function makeQ(a, b, kind, both) {
        let x = a, y = b;
        if (both && Math.random() < .5) { x = b; y = a; }
        const p = a * b;
        const q = { a, b, x, y, p, kind };
        if (kind === 'qcm') { q.choices = shuffle([p].concat(distractors(x, y, 3))); q.ans = p; }
        else if (kind === 'manquant') { q.hide = Math.random() < .5 ? 0 : 1; q.ans = q.hide ? y : x; }
        else if (kind === 'vf') { q.truth = Math.random() < .5; q.shown = q.truth ? p : pick(distractors(x, y, 3)); }
        else q.ans = p;
        return q;
    }

    // =====================================================================
    // ÉTAT
    // =====================================================================
    function defaultState() {
        return {
            tab: 'lecon', lesson: 'super', vk: 1, rot: false, hide: false, revealed: [],
            va: 7, vb: 8, split: true, plevel: 0, psel: null,
            ex: { tables: [2, 3, 4, 5], mode: 'saisie', order: 'hasard', len: 10, chrono: 0, both: true, weak: false },
            stats: {}, record60: 0,
            sound: true, settingsOpen: true, run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createTablesMultiWidget = function (saved) {
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
        container.className = 'tmu-container';
        container.innerHTML = `
            <div class="tmu-header">
                <span class="tmu-title">✖️ Les tables de multiplication</span>
                <div class="tmu-tabs">
                    <button class="tmu-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="tmu-tab-lbl">Leçons</span></button>
                    <button class="tmu-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="tmu-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="tmu-icon-btn" data-act="sound" title="Son"></button>
                    <button class="tmu-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="tmu-body"></div>
            <div class="tmu-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — Commence par <b>🦸 Les super-pouvoirs</b> : l'ordre ne compte pas, on peut découper une multiplication, et il y a des comptines. La <b>🔢 table de Pythagore</b> « fond » à chaque astuce : touche les étapes ①②③④⑤ pour voir combien de faits il reste vraiment à apprendre. Chaque table (× 1 à × 10) a son animation : choisis le nombre avec les ronds 1 à 10. <b>🙈 Cache-cache</b> masque les résultats : touche une ligne pour la découvrir. 🔊 lit la table à voix haute.</p>
                <p><b>✏️ Exercices</b> — Choisis une ou plusieurs tables (ou toutes), le type de questions et la longueur de la série. Réponds avec le pavé ou le clavier (Entrée pour valider ; 1 à 4 pour le QCM ; V / F pour vrai ou faux). Une erreur montre l'astuce et revient en fin de série. <b>💡 Astuce</b> donne la méthode sans la réponse.</p>
                <p><b>🗺️ Ma carte des tables</b> retient les réussites (vert) et les erreurs (rouge) d'une séance à l'autre. Le réglage <b>🎯 Mes points faibles</b> pose plus souvent les faits difficiles. Le <b>⏱ défi 1 minute</b> garde le record.</p>
            </div>
            <div class="tmu-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.tmu-body');
        const help = container.querySelector('.tmu-help');
        const resizeHandle = container.querySelector('.tmu-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        let msg = '', active = false, advT = null, anim = '', lastVk = -1;
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        let saveT = null;
        const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 600); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // Une série chronométrée est mise en pause après une actualisation
        if (S.run && (S.run.mode60 || S.run.chrono) && (S.run.phase === 'ask' || S.run.phase === 'right')) {
            if (S.run.phase === 'right') S.run.pendingNext = true;
            S.run.phase = 'pause';
        } else if (S.run && S.run.phase === 'right') {
            S.run.qi++; if (S.run.qi >= S.run.queue.length) S.run.phase = 'final'; else { S.run.phase = 'ask'; S.run.input = ''; S.run.fb = null; }
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        function renderSide() {
            let h = `<button class="tmu-gbtn ${S.lesson === 'super' ? 'active' : ''}" style="--c:#6C4FD8" data-act="lesson" data-g="super">🦸 Les super-pouvoirs</button>
                <button class="tmu-gbtn ${S.lesson === 'pyth' ? 'active' : ''}" style="--c:#2A1F4A" data-act="lesson" data-g="pyth">🔢 La table de Pythagore</button>
                <div class="tmu-sidelbl">Les tables</div><div class="tmu-tbtns">`;
            for (let n = 1; n <= 10; n++) h += `<button class="tmu-tbtn ${S.lesson === n ? 'active' : ''}" style="--c:${TCOL[n]}" data-act="lesson" data-g="${n}">× ${n}</button>`;
            return h + `</div><div class="tmu-hint" style="margin-top:4px">💡 Ordre conseillé : 1, 2, 5, 10, puis 9, 4, 3, 6, 8 et enfin 7.</div>`;
        }
        function kbar(cur) {
            let h = `<div class="tmu-kbar"><button class="tmu-btn alt small" data-act="vstep" data-d="-1" ${cur <= 1 ? 'disabled' : ''}>◀</button>`;
            for (let k = 1; k <= 10; k++) h += `<button class="tmu-k ${k === cur ? 'on' : ''}" data-act="vk" data-v="${k}">${k}</button>`;
            return h + `<button class="tmu-btn alt small" data-act="vstep" data-d="1" ${cur >= 10 ? 'disabled' : ''}>▶</button></div>`;
        }
        function renderTableLesson(n) {
            const T = TABLES[n], k = S.vk, p = n * k;
            const popR = lastVk !== k;
            lastVk = k;
            let h = `<div class="tmu-ltitle"><h2>La table de ${n}</h2><span class="sub">« ${T.nick} »</span></div>`;
            h += `<div class="tmu-demo">${kbar(k)}
                <div class="tmu-eq">${n} × ${k} = <span class="${popR ? 'r' : ''}" style="color:var(--tc)">${p}</span></div>
                ${visHtml(n, k, S.rot)}</div>`;
            h += `<div class="tmu-box tmu-what"><b class="t">🔤 Le secret de la table de ${n}</b>${T.what}</div>`;
            // La table
            let rows = '';
            for (let i = 1; i <= 10; i++) {
                const hid = S.hide && S.revealed.indexOf(i) === -1;
                rows += `<div class="tmu-trow ${i === k ? 'cur' : ''}" data-act="trow" data-v="${i}"><span>${n} × ${i} =</span><span class="res ${hid ? 'hid' : ''}">${n * i}</span></div>`;
            }
            h += `<div class="tmu-box" style="background:#fff;border:2px solid #e3d8c3;display:flex;flex-direction:column;align-items:center;gap:8px">
                <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center"><b>📋 La table de ${n}</b>
                <button class="tmu-btn alt small" data-act="hide">${S.hide ? '👀 Tout montrer' : '🙈 Cache-cache'}</button>
                ${canSpeak ? `<button class="tmu-btn alt small" data-act="saytable">🔊 Lire la table</button>` : ''}</div>
                ${S.hide ? '<div class="tmu-hint">Récite le résultat, puis touche la ligne pour vérifier !</div>' : ''}
                <div class="tmu-table">${rows}</div></div>`;
            h += `<div class="tmu-box tmu-tips"><b class="t">🪄 Les astuces</b><ul>${T.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
            // Ce que je sais déjà
            const kf = knownFacts(n), newOnes = kf.filter(f => !f.from);
            h += `<div class="tmu-box tmu-know"><b class="t">🧠 Ce que tu sais déjà</b>`;
            h += newOnes.length
                ? `Grâce aux autres tables (et parce que <b>l'ordre ne compte pas</b> : ${n} × 3 = 3 × ${n}), il ne te reste que <b>${plural(newOnes.length, 'fait')} nouveau${newOnes.length > 1 ? 'x' : ''}</b> à apprendre dans cette table ${newOnes.length <= 3 ? '🎉' : ''} :`
                : `Cette table est facile : tu la connais déjà toute ! 🎉`;
            h += `<div class="tmu-knowrow">${kf.map(f => `<span class="tmu-kf ${f.from ? '' : 'new'}">${n} × ${f.k}<small>${f.from ? '✔ ' + f.from : '★ à apprendre'}</small></span>`).join('')}</div></div>`;
            h += `<div class="tmu-box tmu-trap"><b class="t">⚠️ Attention au piège</b>${T.trap}</div>`;
            h += `<div><button class="tmu-btn go" data-act="practice" data-v="${n}">✏️ S'entraîner sur la table de ${n}</button></div>`;
            return h;
        }
        function renderSuper() {
            const a = S.va, b = S.vb, p = a * b;
            const chips = (act, cur) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<button class="tmu-k ${v === cur ? 'on' : ''}" data-act="${act}" data-v="${v}" style="width:32px;height:32px;font-size:14px">${v}</button>`).join('');
            let h = `<div class="tmu-ltitle"><h2 style="color:#6C4FD8">🦸 Les super-pouvoirs des tables</h2></div>`;
            h += `<div class="tmu-box tmu-what"><b class="t">🎯 Pourquoi apprendre les tables ?</b>Pour calculer vite et sans effort : les tables servent partout (opérations posées, fractions, conversions, partages…). Bonne nouvelle : avec quelques astuces, il y a <b>beaucoup moins à apprendre</b> qu'on ne le croit !</div>`;
            // Démonstration interactive
            const splitOk = b > 5 && S.split;
            h += `<div class="tmu-demo" style="--tc:#6C4FD8">
                <div class="tmu-kbar"><b style="margin-right:6px">Premier nombre</b>${chips('va', a)}</div>
                <div class="tmu-kbar"><b style="margin-right:6px">Second nombre</b>${chips('vb', b)}</div>
                <div class="tmu-eq">${S.rot ? `${b} × ${a}` : `${a} × ${b}`} = <span style="color:#6C4FD8">${p}</span></div>
                <div class="tmu-vis"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">
                    ${S.rot ? rectHtml(b, a, splitOk ? { colA: '#EB5757', colB: '#2F80ED', splitRow: 5 } : { colA: '#6C4FD8' })
                            : rectHtml(a, b, splitOk ? { colA: '#EB5757', colB: '#2F80ED', splitCol: 5 } : { colA: '#6C4FD8' })}
                    <div class="tmu-actions"><button class="tmu-btn alt small" data-act="rot">🔄 Tourner</button>
                    ${b > 5 ? `<button class="tmu-btn alt small" data-act="split">${S.split ? '⬜ Ne pas découper' : '✂️ Découper en 5 + ' + (b - 5)}</button>` : ''}</div>
                </div>
                <div class="tmu-vcap" style="text-align:left">
                    🔄 <b>L'ordre ne compte pas</b> : ${a} × ${b} = ${b} × ${a}. C'est le même rectangle, tourné ! Si tu connais l'un, tu connais l'autre.<br>
                    ${splitOk ? `✂️ <b>Je découpe</b> : <span style="color:#EB5757;font-weight:900">${a} × 5 = ${a * 5}</span> et <span style="color:#2F80ED;font-weight:900">${a} × ${b - 5} = ${a * (b - 5)}</span>, donc ${a} × ${b} = ${a * 5} + ${a * (b - 5)} = <b>${p}</b>.<br>` : ''}
                    💡 ${tipFor(a, b)}
                </div></div></div>`;
            h += `<div class="tmu-box tmu-tips"><b class="t">🪄 Les 6 super-pouvoirs</b><ol>
                <li><b>🔄 L'ordre ne compte pas</b> : 3 × 8 = 8 × 3. La moitié du travail est déjà faite !</li>
                <li><b>🪞 × 1 ne change rien</b>, <b>🕳️ × 0 donne toujours 0</b>.</li>
                <li><b>➕0 × 10</b> : j'écris un 0 à droite. <b>✋ × 5</b> : la moitié de × 10.</li>
                <li><b>🪄 Doubler</b> : × 2 = double · × 4 = double du double · × 8 = double, double, double.</li>
                <li><b>✂️ Je découpe</b> une multiplication difficile en deux faciles : 7 × 8 = 7 × 5 + 7 × 3 = 35 + 21 = 56.</li>
                <li><b>✋✋ × 9</b> : avec les doigts, ou 10 fois moins une fois : 9 × 6 = 60 − 6 = 54.</li></ol></div>`;
            h += `<div class="tmu-box tmu-song"><b class="t">🎵 Les comptines à retenir</b><ul>
                <li><b>1, 2, 3, 4</b> → 12 = 3 × 4</li>
                <li><b>5, 6, 7, 8</b> → 56 = 7 × 8</li>
                <li>« Six fois sept, quarante-deux, c'est la réponse à toutes les questions ! »</li>
                <li>« Sept fois sept, quarante-neuf, le carré tout neuf. »</li>
                <li>« Huit fois huit, soixante-quatre : un échiquier, c'est 64 cases ! » ♟️</li></ul></div>`;
            h += `<div class="tmu-box tmu-know"><b class="t">🧠 Comment bien les retenir ?</b><ul>
                <li><b>Un peu chaque jour</b> (5 minutes) vaut mieux qu'une heure une fois par semaine.</li>
                <li>Récite à voix haute, <b>dans le désordre</b> : 7 × 6 ? 7 × 3 ? 7 × 9 ?</li>
                <li>Utilise le <b>cache-cache</b> des leçons, puis les exercices. La carte des tables montre ce qu'il reste à travailler.</li>
                <li>Quand tu te trompes, retrouve l'<b>astuce</b> : c'est elle qui t'aidera la prochaine fois.</li></ul></div>`;
            h += `<div class="tmu-actions"><button class="tmu-btn" data-act="lesson" data-g="pyth">🔢 Voir la table de Pythagore qui fond ➜</button></div>`;
            return h;
        }
        // Niveaux de la table de Pythagore « qui fond »
        const PSTEPS = [
            { lbl: '① Tout', txt: 'La table de Pythagore complète : <b>100 multiplications</b>. Ça fait peur ? Touche les étapes suivantes…' },
            { lbl: '② L\'ordre ne compte pas', txt: '🔄 3 × 8 = 8 × 3 : on enlève la moitié en double. Il en reste <b>{n}</b>.' },
            { lbl: '③ × 1 et × 10', txt: '🪞 × 1 ne change rien, ➕0 × 10 ajoute un 0. Il en reste <b>{n}</b>.' },
            { lbl: '④ × 2 et × 5', txt: '🪄 × 2 c\'est le double, ✋ × 5 la moitié de × 10. Il en reste <b>{n}</b>.' },
            { lbl: '⑤ × 9', txt: '✋✋ × 9 se lit sur les doigts. Il ne reste que <b>{n} faits</b> à apprendre par cœur ! (en jaune, et la diagonale violette, ce sont les carrés)' }
        ];
        function pythGone(a, b, lvl) {
            if (lvl >= 1 && a > b) return true;
            if (lvl >= 2 && (a === 1 || b === 1 || a === 10 || b === 10)) return true;
            if (lvl >= 3 && (a === 2 || b === 2 || a === 5 || b === 5)) return true;
            if (lvl >= 4 && (a === 9 || b === 9)) return true;
            return false;
        }
        function renderPyth() {
            const lvl = S.plevel;
            let left = 0;
            for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) if (!pythGone(a, b, lvl)) left++;
            let sel = null;
            if (S.psel) { const [a, b] = S.psel.split('-').map(Number); sel = { a, b }; }
            let h = `<div class="tmu-ltitle"><h2 style="color:#2A1F4A">🔢 La table de Pythagore</h2><span class="sub">« la table qui fond »</span></div>`;
            h += `<div class="tmu-demo" style="--tc:#2A1F4A">
                <div class="tmu-steps">${PSTEPS.map((s, i) => `<button class="tmu-chip ${i === lvl ? 'on' : ''}" data-act="plevel" data-v="${i}">${s.lbl}</button>`).join('')}</div>
                <div class="tmu-say">${PSTEPS[lvl].txt.replace('{n}', left)}</div>
                <div class="tmu-pyth" style="grid-template-columns:repeat(11, var(--pc));--pc:clamp(26px, 5.4cqw, 46px)">`;
            h += `<div class="tmu-pc hd">×</div>`;
            for (let b = 1; b <= 10; b++) h += `<div class="tmu-pc hd" style="background:${TCOL[b]};border-color:${TCOL[b]};color:#fff">${b}</div>`;
            for (let a = 1; a <= 10; a++) {
                h += `<div class="tmu-pc hd" style="background:${TCOL[a]};border-color:${TCOL[a]};color:#fff">${a}</div>`;
                for (let b = 1; b <= 10; b++) {
                    const gone = pythGone(a, b, lvl);
                    let cls = 'tmu-pc';
                    if (gone) cls += ' gone';
                    else if (lvl === 4) cls += ' left';
                    if (a === b && !gone) cls += ' sq';
                    if (sel && !(sel.a === a && sel.b === b) && (sel.a === a || sel.b === b)) cls += ' line';
                    if (sel && sel.a === a && sel.b === b) cls += ' sel';
                    h += `<button class="${cls}" data-act="pcell" data-v="${a}-${b}">${a * b}</button>`;
                }
            }
            h += `</div>`;
            h += sel ? `<div class="tmu-say good"><b>${sel.a} × ${sel.b} = ${sel.a * sel.b}</b> · ${tipFor(sel.a, sel.b)}</div>`
                     : `<div class="tmu-hint">Touche une case pour voir l'astuce qui la fait retenir.</div>`;
            h += `<div class="tmu-actions"><button class="tmu-btn alt small" data-act="plevel" data-v="${Math.max(0, lvl - 1)}" ${lvl === 0 ? 'disabled' : ''}>◀ Étape précédente</button>
                <button class="tmu-btn go small" data-act="plevel" data-v="${Math.min(4, lvl + 1)}" ${lvl === 4 ? 'disabled' : ''}>Étape suivante ▶</button></div></div>`;
            h += `<div class="tmu-box tmu-what"><b class="t">🔤 Comment lire la table ?</b>Je cherche le premier nombre dans la colonne de gauche, le second dans la ligne du haut : le résultat est à la croisée des deux. Les nombres de la <b>diagonale</b> (1, 4, 9, 16, 25…) sont les <b>carrés</b> : 4 × 4, 5 × 5…</div>`;
            h += `<div class="tmu-box tmu-tips"><b class="t">🏁 Les 15 faits à apprendre par cœur</b>3 × 3, 3 × 4, 3 × 6, 3 × 7, 3 × 8, 4 × 4, 4 × 6, 4 × 7, 4 × 8, 6 × 6, 6 × 7, 6 × 8, 7 × 7, 7 × 8, 8 × 8. Et même ceux-là ont leurs astuces (touche-les dans la table) !</div>`;
            h += `<div class="tmu-actions"><button class="tmu-btn go" data-act="practice15">✏️ S'entraîner sur ces 15 faits</button></div>`;
            return h;
        }
        function renderLesson() {
            let main;
            if (S.lesson === 'super') main = renderSuper();
            else if (S.lesson === 'pyth') main = renderPyth();
            else main = renderTableLesson(S.lesson);
            const tc = typeof S.lesson === 'number' ? TCOL[S.lesson] : '#6C4FD8';
            return `<div class="tmu-lesson" style="--tc:${tc}"><div class="tmu-side">${renderSide()}</div><div class="tmu-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function masteryClass(a, b) {
            const st = S.stats[factKey(a, b)];
            if (!st || st[0] + st[1] === 0) return 'm0';
            const [ok, ko] = st, r = ok / (ok + ko);
            if (ko > ok) return 'm1';
            if (r < .8) return 'm2';
            if (ok >= 3) return 'm4';
            return 'm3';
        }
        function mapHtml(errSet) {
            let h = `<div class="tmu-map"><div class="h">×</div>`;
            for (let b = 1; b <= 10; b++) h += `<div class="h">${b}</div>`;
            for (let a = 1; a <= 10; a++) {
                h += `<div class="h">${a}</div>`;
                for (let b = 1; b <= 10; b++) h += `<div class="${masteryClass(a, b)}${errSet && errSet[factKey(a, b)] ? ' x' : ''}" title="${a} × ${b} = ${a * b}">${a * b}</div>`;
            }
            return h + `</div><div class="tmu-legend"><span><i style="background:#eee8dc"></i>pas encore vu</span><span><i style="background:#ff9aa5"></i>difficile</span><span><i style="background:#ffd27a"></i>presque</span><span><i style="background:#c8efd6"></i>réussi</span><span><i style="background:#6fd39b"></i>acquis</span></div>`;
        }
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="tmu-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col, extra) => `<button class="tmu-chip ${extra || ''} ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="tmu-settings">`;
            h += `<div class="tmu-srow"><span class="l">1. Les tables</span>`;
            for (let n = 1; n <= 10; n++) h += ch('tb', n, ex.tables.indexOf(n) !== -1, '× ' + n, TCOL[n], 'tb');
            h += ch('tball', 1, ex.tables.length === 10, '⭐ Toutes') + ch('tball', 0, false, '✖ Aucune') + `</div>`;
            const MODES = { saisie: '⌨️ Je tape la réponse', qcm: '🔘 QCM', manquant: '❓ Le nombre caché', vf: '✔✘ Vrai ou faux', mix: '🎲 Mélange' };
            h += `<div class="tmu-srow"><span class="l">2. Les questions</span>${Object.keys(MODES).map(m => ch('mode', m, ex.mode === m, MODES[m])).join('')}</div>`;
            h += `<div class="tmu-srow"><span class="l">3. La série</span>${[10, 20, 30].map(n => ch('len', n, ex.order === 'hasard' && ex.len === n, n + ' questions')).join('')}
                ${ch('order', 'ordre', ex.order === 'ordre', '📋 Toute la table dans l\'ordre')}${ch('len', 60, ex.order === 'hasard' && ex.len === 60, '⏱ Défi 1 minute', '#FF7A1A')}</div>`;
            h += `<div class="tmu-srow"><span class="l">Chrono par question</span>${[[0, 'sans'], [10, '10 s'], [6, '6 s'], [3, '3 s ⚡']].map(c => ch('chrono', c[0], ex.chrono === c[0], c[1])).join('')}</div>`;
            h += `<div class="tmu-srow"><span class="l">Options</span>${ch('both', ex.both ? 0 : 1, ex.both, '🔄 Dans les deux sens (7 × 3 et 3 × 7)')}${ch('weak', ex.weak ? 0 : 1, ex.weak, '🎯 Mes points faibles plus souvent', '#EB5757')}</div>`;
            h += `<details class="tmu-box" style="background:#fbf7ef;border:2px solid #e3d8c3;padding:6px 12px"><summary style="font-weight:900;cursor:pointer">🗺️ Ma carte des tables</summary>
                <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:6px">${mapHtml()}
                <div style="display:flex;flex-direction:column;gap:6px;max-width:260px"><span class="tmu-hint">La carte se colore au fil des exercices. Avec « 🎯 Mes points faibles », les cases rouges et orange reviennent plus souvent.</span>
                ${S.record60 ? `<span class="tmu-pill" style="align-self:flex-start">🏆 Record 1 minute : ${S.record60}</span>` : ''}
                <button class="tmu-btn alt small" data-act="resetmap" style="align-self:flex-start">🧽 Effacer la carte</button></div></div></details>`;
            h += `<div class="tmu-srow"><span style="flex:1"></span>${S.run ? '<button class="tmu-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="tmu-btn go small" data-act="gen">▶ C'est parti !</button></div>`;
            if (msg) h += `<div class="tmu-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        function questionHtml(q, Rn) {
            const phase = Rn.phase;
            if (q.kind === 'vf') {
                return `<div class="tmu-q">${q.x} × ${q.y} = ${q.shown}</div>`;
            }
            let ansCls = 'ans';
            let shown = Rn.input;
            if (phase === 'ask') { if (q.kind !== 'qcm') ansCls += ' blink'; if (q.kind === 'qcm') shown = '?'; }
            else if (phase === 'right') { ansCls += ' ok'; shown = String(q.ans); }
            else if (phase === 'wrong') { ansCls += ' ko'; shown = Rn.picked != null && Rn.picked !== '' ? String(Rn.picked) : '…'; }
            const box = `<span class="${ansCls}">${shown || '&nbsp;'}</span>`;
            if (q.kind === 'manquant') return `<div class="tmu-q">${q.hide === 0 ? box : q.x} × ${q.hide === 1 ? box : q.y} = ${q.p}</div>`;
            return `<div class="tmu-q">${q.x} × ${q.y} = ${box}</div>`;
        }
        function renderRun() {
            const Rn = S.run;
            const n = Rn.queue.length;
            let top = `<div class="tmu-topbar">`;
            if (Rn.mode60) top += `<span class="tmu-pill">⏱ Défi 1 minute</span><span class="tmu-pill">✅ ${Rn.score}</span>`;
            else {
                const dots = Rn.queue.map((qq, i) => `<span class="tmu-d ${Rn.res[i] || (i === Rn.qi && Rn.phase !== 'final' ? 'cur' : '')}${qq.retry && !Rn.res[i] ? ' retry' : ''}"></span>`).join('');
                top += `<span class="tmu-pill">${Rn.phase === 'final' ? '🏁 Terminé' : `Question ${Math.min(Rn.qi + 1, n)} / ${n}`}</span><div class="tmu-dots2">${dots}</div><span class="tmu-pill">⭐ ${Rn.score} / ${Rn.total}</span>`;
            }
            if (Rn.streak >= 3 && Rn.phase !== 'final') top += `<span class="tmu-pill fire">🔥 ${Rn.streak}</span>`;
            if ((Rn.mode60 || Rn.chrono) && Rn.phase !== 'final') top += `<button class="tmu-btn alt small" data-act="pause">${Rn.phase === 'pause' ? '▶' : '⏸'}</button>`;
            top += `</div>`;
            if (Rn.phase === 'final') return top + finalHtml(Rn);
            let h = top;
            if (Rn.mode60) h += `<div class="tmu-time" title="Temps restant"><i class="tmu-tbar60" style="transform:scaleX(${Math.max(0, Rn.timeLeft / 60000)})"></i></div>`;
            else if (Rn.chrono) h += `<div class="tmu-time" title="Temps pour répondre"><i class="tmu-tbarq" style="transform:scaleX(${Math.max(0, 1 - Rn.qEl / (Rn.chrono * 1000))})"></i></div>`;
            if (Rn.phase === 'pause') {
                return h + `<div class="tmu-info" style="font-size:20px">⏸ En pause<br><button class="tmu-btn go" data-act="pause" style="margin-top:8px">▶ Reprendre</button></div>`;
            }
            const q = Rn.queue[Rn.qi];
            const tc = TCOL[q.a] || '#6C4FD8';
            const ask = Rn.phase === 'ask';
            let card = `<div class="tmu-qcard ${anim}" style="--tc:${tc}">${q.retry ? '<span class="tmu-hint">🔁 Une erreur à rattraper</span>' : ''}${questionHtml(q, Rn)}`;
            if (q.kind === 'qcm') {
                card += `<div class="tmu-choices">${q.choices.map((c, i) => {
                    let cls = '';
                    if (!ask) { if (c === q.ans) cls = 'good'; else if (c === Rn.picked) cls = 'bad'; }
                    return `<button class="tmu-choice ${cls}" data-act="choice" data-v="${c}" ${ask ? '' : 'disabled'}>${c}</button>`;
                }).join('')}</div>`;
            } else if (q.kind === 'vf') {
                const cls = v => !ask ? (v === q.truth ? 'good' : (Rn.picked === v ? 'bad' : '')) : (v ? 'vrai' : 'faux');
                card += `<div class="tmu-choices"><button class="tmu-choice ${cls(true)}" data-act="vf" data-v="1" ${ask ? '' : 'disabled'}>✔ Vrai</button><button class="tmu-choice ${cls(false)}" data-act="vf" data-v="0" ${ask ? '' : 'disabled'}>✘ Faux</button></div>`;
            }
            if (Rn.fb) card += `<div class="tmu-fb ${Rn.fb.mood}">${Rn.fb.html}</div>`;
            card += `</div>`;
            const needPad = (q.kind === 'saisie' || q.kind === 'manquant') && ask;
            const pad = needPad ? `<div class="tmu-pad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(k => `<button class="tmu-key" data-act="key" data-k="${k}">${k}</button>`).join('')}
                <button class="tmu-key fn" data-act="key" data-k="del" title="Effacer">⌫</button>
                <button class="tmu-key" data-act="key" data-k="0">0</button>
                <button class="tmu-key ok" data-act="key" data-k="ok" title="Valider">✔</button></div>` : '';
            h += `<div class="tmu-stage">${card}${pad}</div>`;
            if (ask) h += `<div class="tmu-actions"><button class="tmu-btn alt small" data-act="tip">💡 Astuce</button>${canSpeak ? '<button class="tmu-btn alt small" data-act="sayq">🔊 Lire</button>' : ''}<button class="tmu-btn alt small" data-act="stop">🏁 Arrêter</button></div>`;
            else if (Rn.phase === 'wrong') h += `<div class="tmu-actions"><button class="tmu-btn go" data-act="next">Compris ! ➜</button></div>`;
            return h;
        }
        function finalHtml(Rn) {
            const errSet = {};
            Rn.errs.forEach(e => errSet[factKey(e.a, e.b)] = e);
            const errs = Object.keys(errSet).map(k => errSet[k]);
            let h = `<div class="tmu-final">`;
            if (Rn.mode60) {
                h += `<div class="medal">${Rn.newRecord ? '🏆' : Rn.score >= 20 ? '🚀' : '⏱'}</div><div style="font-size:26px;font-weight:900">${Rn.score} bonne${Rn.score > 1 ? 's' : ''} réponse${Rn.score > 1 ? 's' : ''} en 1 minute !</div>`;
                h += Rn.newRecord ? `<div class="tmu-pill fire" style="font-size:16px">🎉 Nouveau record !</div>` : `<div class="tmu-hint">Record : ${S.record60}</div>`;
            } else {
                const pct = Rn.total ? Rn.score / Rn.total : 0;
                const medal = pct >= .9 ? '🥇' : pct >= .7 ? '🥈' : '🥉';
                const title = pct === 1 ? 'Sans faute, champion·ne des tables !' : pct >= .9 ? 'Excellent !' : pct >= .7 ? 'Très bien, continue !' : 'Bien essayé, on s\'entraîne encore !';
                h += `<div class="medal">${medal}</div><div style="font-size:26px;font-weight:900">${title}</div>
                    <div style="font-size:18px;font-weight:800">${Rn.score} sur ${Rn.total} du premier coup${Rn.fixed ? ` · ${Rn.fixed} erreur${Rn.fixed > 1 ? 's' : ''} rattrapée${Rn.fixed > 1 ? 's' : ''} 💪` : ''} · meilleure série 🔥 ${Rn.best}</div>`;
            }
            if (errs.length) {
                h += `<div class="tmu-errs"><b>📌 Les faits à revoir, avec leur astuce :</b>${errs.map(e => `<div class="tmu-err"><b class="f">${e.a} × ${e.b} = ${e.a * e.b}</b>${tipFor(e.a, e.b)}</div>`).join('')}</div>`;
            }
            h += `<details class="tmu-box" style="background:#fbf7ef;border:2px solid #e3d8c3;padding:6px 12px;width:100%;max-width:640px;box-sizing:border-box;text-align:left"><summary style="font-weight:900;cursor:pointer">🗺️ Ma carte des tables (les erreurs de la série sont entourées)</summary><div style="margin-top:6px">${mapHtml(errSet)}</div></details>`;
            h += `<div class="tmu-actions">${errs.length ? '<button class="tmu-btn" data-act="replayerr">🔁 Rejouer mes erreurs</button>' : ''}<button class="tmu-btn go" data-act="gen">🔄 Nouvelle série</button></div></div>`;
            return h;
        }
        function renderTrain() {
            let h = `<div class="tmu-train">${renderSettings()}`;
            if (S.run) h += `<div style="display:flex;flex-direction:column;gap:12px">${renderRun()}</div>`;
            else if (!msg) h += `<div class="tmu-info">Choisis une ou plusieurs tables, le type de questions, puis clique sur <b>▶ C'est parti !</b></div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.tmu-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            // garder ouvert un <details> de la carte
            const openDet = !!body.querySelector('details[open]');
            body.innerHTML = S.tab === 'train' ? renderTrain() : renderLesson();
            if (openDet) { const d = body.querySelector('details'); if (d) d.open = true; }
            body.scrollTop = top;
            anim = '';
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'tmu-confetti';
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
        function kindFor(mode) { return mode === 'mix' ? pick(['saisie', 'qcm', 'manquant', 'vf']) : mode; }
        function weightOf(a, b) {
            if (!S.ex.weak) return 1;
            const st = S.stats[factKey(a, b)];
            if (!st) return 1.5;
            return Math.max(.3, 1 + st[1] * 2.5 - Math.min(st[0], 4) * .2);
        }
        function drawFacts(pool, n) {
            const out = [];
            let last = null;
            for (let i = 0; i < n; i++) {
                const cand = pool.filter(f => !last || pool.length < 3 || factKey(f[0], f[1]) !== last);
                const tot = cand.reduce((s, f) => s + weightOf(f[0], f[1]), 0);
                let r = Math.random() * tot, f = cand[0];
                for (const c of cand) { r -= weightOf(c[0], c[1]); if (r <= 0) { f = c; break; } }
                out.push(f); last = factKey(f[0], f[1]);
            }
            return out;
        }
        function poolOf(tables) {
            const pool = [];
            tables.forEach(t => { for (let k = 1; k <= 10; k++) pool.push([t, k]); });
            return pool;
        }
        function genRun(customPool) {
            const ex = S.ex;
            const tables = ex.tables.slice().sort((a, b) => a - b);
            if (!customPool && !tables.length) return 'Choisis au moins une table.';
            let queue, mode60 = false;
            if (customPool) {
                queue = shuffle(customPool).map(f => makeQ(f[0], f[1], kindFor(ex.mode), ex.both));
            } else if (ex.order === 'ordre') {
                queue = [];
                tables.forEach(t => { for (let k = 1; k <= 10; k++) queue.push(makeQ(t, k, kindFor(ex.mode), false)); });
            } else {
                mode60 = ex.len === 60;
                const facts = drawFacts(poolOf(tables), mode60 ? 25 : ex.len);
                queue = facts.map(f => makeQ(f[0], f[1], kindFor(ex.mode), ex.both));
            }
            S.run = { queue, total: queue.length, qi: 0, res: [], score: 0, fixed: 0, streak: 0, best: 0, errs: [],
                      mode60, timeLeft: 60000, chrono: mode60 ? 0 : ex.chrono, qEl: 0, phase: 'ask', input: '', fb: null };
            return '';
        }
        function record(a, b, ok) {
            const k = factKey(a, b);
            const st = S.stats[k] || [0, 0];
            st[ok ? 0 : 1]++;
            S.stats[k] = st;
        }
        function clearAdv() { if (advT) { clearTimeout(advT); advT = null; } }
        function answer(val) {
            const Rn = S.run;
            if (!Rn || Rn.phase !== 'ask') return;
            const q = Rn.queue[Rn.qi];
            const ok = q.kind === 'vf' ? val === q.truth : +val === q.ans;
            record(q.a, q.b, ok);
            Rn.picked = val;
            if (ok) {
                if (!q.retry) Rn.score++; else Rn.fixed++;
                Rn.res[Rn.qi] = 'good';
                Rn.streak++; Rn.best = Math.max(Rn.best, Rn.streak);
                Rn.phase = 'right'; anim = 'yay';
                const fire = Rn.streak > 0 && Rn.streak % 5 === 0;
                Rn.fb = { mood: 'good', html: fire ? `🔥 ${Rn.streak} bonnes réponses d'affilée !` : pick(['Bravo !', 'Super !', 'Exact !', 'Parfait !', 'Bien joué !', 'Génial !']) + (q.kind === 'vf' ? ` ${q.x} × ${q.y} = ${q.p}` : '') };
                sfx(fire ? 'fire' : 'good');
                clearAdv();
                advT = setTimeout(() => { advT = null; if (widget.isConnected && S.run === Rn && Rn.phase === 'right') { next(); render(); saveSoon(); } }, Rn.mode60 ? 450 : 1000);
            } else {
                Rn.res[Rn.qi] = 'bad';
                Rn.streak = 0;
                Rn.errs.push({ a: q.a, b: q.b });
                if (!Rn.mode60 && !q.retry) {
                    const r = makeQ(q.a, q.b, q.kind, S.ex.both); r.retry = true;
                    Rn.queue.push(r);
                }
                Rn.phase = 'wrong'; anim = 'shake';
                const what = q.kind === 'vf' ? (q.truth ? `C'était vrai : ${q.x} × ${q.y} = <b>${q.p}</b>.` : `C'était faux : ${q.x} × ${q.y} = <b>${q.p}</b>, et pas ${q.shown}.`)
                    : val === null ? `⏰ Temps écoulé ! ${q.x} × ${q.y} = <b>${q.p}</b>.` : `Oups ! ${q.x} × ${q.y} = <b>${q.p}</b>.`;
                Rn.fb = { mood: 'bad', html: `${what}<br>💡 ${tipFor(q.a, q.b)}` };
                sfx('bad');
            }
        }
        function next() {
            const Rn = S.run;
            if (!Rn) return;
            clearAdv();
            if (canSpeak) window.speechSynthesis.cancel();
            Rn.qi++;
            if (Rn.mode60 && Rn.qi >= Rn.queue.length - 2) {
                const ex = S.ex;
                drawFacts(poolOf(ex.tables), 15).forEach(f => Rn.queue.push(makeQ(f[0], f[1], kindFor(ex.mode), ex.both)));
            }
            if (Rn.qi >= Rn.queue.length) { finish(); return; }
            Rn.phase = 'ask'; Rn.input = ''; Rn.fb = null; Rn.qEl = 0; Rn.picked = undefined;
        }
        function finish() {
            const Rn = S.run;
            clearAdv();
            Rn.phase = 'final';
            if (Rn.mode60) {
                Rn.queue = Rn.queue.slice(0, Rn.qi);
                Rn.newRecord = Rn.score > (S.record60 || 0);
                if (Rn.newRecord) S.record60 = Rn.score;
            }
            sfx('win');
            if ((Rn.mode60 && Rn.newRecord) || (!Rn.mode60 && Rn.score === Rn.total)) party();
        }
        function typeKey(k) {
            const Rn = S.run;
            if (!Rn || Rn.phase !== 'ask') return;
            const q = Rn.queue[Rn.qi];
            if (q.kind !== 'saisie' && q.kind !== 'manquant') return;
            if (k === 'del') { Rn.input = Rn.input.slice(0, -1); return; }
            if (k === 'ok') { if (Rn.input !== '') answer(Rn.input); return; }
            if (Rn.input.length >= 3) return;
            Rn.input += String(k);
            sfx('pop');
            // Validation automatique quand le nombre de chiffres attendu est atteint
            if (Rn.input.length === String(q.ans).length && Rn.input === String(q.ans)) answer(Rn.input);
        }

        // ── Chronomètres ──
        let lastT = Date.now();
        const tickT = setInterval(() => {
            if (!widget.isConnected) { clearInterval(tickT); return; }
            const now = Date.now(), dt = now - lastT;
            lastT = now;
            const Rn = S.run;
            if (!Rn || S.tab !== 'train') return;
            if (Rn.mode60 && (Rn.phase === 'ask' || Rn.phase === 'right')) {
                Rn.timeLeft -= dt;
                const bar = body.querySelector('.tmu-tbar60');
                if (bar) bar.style.transform = `scaleX(${Math.max(0, Rn.timeLeft / 60000)})`;
                if (Rn.timeLeft <= 0) { Rn.timeLeft = 0; finish(); render(); save(); }
            } else if (Rn.chrono && Rn.phase === 'ask') {
                Rn.qEl += dt;
                const bar = body.querySelector('.tmu-tbarq');
                if (bar) bar.style.transform = `scaleX(${Math.max(0, 1 - Rn.qEl / (Rn.chrono * 1000))})`;
                if (Rn.qEl >= Rn.chrono * 1000) { answer(null); render(); saveSoon(); }
            }
        }, 100);

        // ── Actions ──
        function act(a, el) {
            const Rn = S.run, ex = S.ex;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (Rn && (Rn.mode60 || Rn.chrono) && (Rn.phase === 'ask' || Rn.phase === 'right')) { if (Rn.phase === 'right') Rn.pendingNext = true; clearAdv(); Rn.phase = 'pause'; render(); }
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '✖️ Les tables de multiplication', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (canSpeak) window.speechSynthesis.cancel();
                    clearInterval(tickT); clearAdv();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab':
                    S.tab = el.dataset.tab; body.scrollTop = 0;
                    if (S.tab !== 'train' && Rn && (Rn.mode60 || Rn.chrono) && (Rn.phase === 'ask' || Rn.phase === 'right')) { if (Rn.phase === 'right') Rn.pendingNext = true; clearAdv(); Rn.phase = 'pause'; }
                    break;
                // Leçons
                case 'lesson': {
                    const g = el.dataset.g;
                    S.lesson = /^\d+$/.test(g) ? +g : g;
                    S.revealed = []; S.rot = false; lastVk = -1; body.scrollTop = 0;
                    break;
                }
                case 'vk': S.vk = +el.dataset.v; if (S.lesson === 9) sfx('pop'); break;
                case 'vstep': S.vk = Math.max(1, Math.min(10, S.vk + (+el.dataset.d))); break;
                case 'rot': S.rot = !S.rot; break;
                case 'split': S.split = !S.split; break;
                case 'va': S.va = +el.dataset.v; break;
                case 'vb': S.vb = +el.dataset.v; break;
                case 'hide': S.hide = !S.hide; S.revealed = []; break;
                case 'trow': {
                    const v = +el.dataset.v;
                    if (S.hide && S.revealed.indexOf(v) === -1) { S.revealed.push(v); sfx('pop'); }
                    S.vk = v;
                    break;
                }
                case 'saytable': {
                    const n = S.lesson; const parts = [];
                    for (let i = 1; i <= 10; i++) parts.push(`${n} fois ${i}, ${n * i}.`);
                    speak(parts.join(' '));
                    return;
                }
                case 'plevel': S.plevel = +el.dataset.v; S.psel = null; sfx('pop'); break;
                case 'pcell': S.psel = S.psel === el.dataset.v ? null : el.dataset.v; break;
                case 'practice':
                    ex.tables = [+el.dataset.v]; ex.order = 'hasard'; ex.len = 10;
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                case 'practice15': {
                    const pool = [];
                    [3, 4, 6, 7, 8].forEach(x => [3, 4, 6, 7, 8].forEach(y => { if (x <= y) pool.push([x, y]); }));
                    S.tab = 'train'; msg = genRun(pool); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                }
                // Réglages
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'tb': {
                    const v = +el.dataset.v, i = ex.tables.indexOf(v);
                    if (i === -1) ex.tables.push(v); else ex.tables.splice(i, 1);
                    msg = ''; break;
                }
                case 'tball': ex.tables = el.dataset.v === '1' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : []; break;
                case 'mode': ex.mode = el.dataset.v; break;
                case 'len': ex.len = +el.dataset.v; ex.order = 'hasard'; break;
                case 'order': ex.order = 'ordre'; break;
                case 'chrono': ex.chrono = +el.dataset.v; break;
                case 'both': ex.both = el.dataset.v === '1'; break;
                case 'weak': ex.weak = el.dataset.v === '1'; break;
                case 'resetmap':
                    if (!window.confirm || window.confirm('Effacer toute la carte des tables (réussites et erreurs) ?')) { S.stats = {}; S.record60 = 0; }
                    break;
                case 'gen':
                    clearAdv();
                    msg = genRun();
                    S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                case 'replayerr': {
                    if (!Rn) return;
                    const seen = {}, pool = [];
                    Rn.errs.forEach(e => { const k = factKey(e.a, e.b); if (!seen[k]) { seen[k] = 1; pool.push([e.a, e.b]); } });
                    // chaque erreur deux fois, pour bien la fixer
                    msg = genRun(pool.concat(pool));
                    if (S.run) { S.run.chrono = 0; S.run.mode60 = false; }
                    break;
                }
                // Partie en cours
                case 'key': typeKey(el.dataset.k); break;
                case 'choice': answer(+el.dataset.v); break;
                case 'vf': answer(el.dataset.v === '1'); break;
                case 'next':
                    if (!Rn) return;
                    next(); break;
                case 'tip': {
                    if (!Rn || Rn.phase !== 'ask') return;
                    const q = Rn.queue[Rn.qi];
                    Rn.fb = { mood: 'tip', html: '💡 ' + tipFor(q.a, q.b, true) };
                    Rn.streak = 0;
                    break;
                }
                case 'sayq': {
                    if (!Rn) return;
                    const q = Rn.queue[Rn.qi];
                    if (q.kind === 'vf') speak(`${q.x} fois ${q.y} égale ${q.shown}. Vrai ou faux ?`);
                    else if (q.kind === 'manquant') speak(q.hide === 0 ? `Combien de fois ${q.y} égale ${q.p} ?` : `${q.x} fois combien égale ${q.p} ?`);
                    else speak(`${q.x} fois ${q.y} ?`);
                    return;
                }
                case 'pause':
                    if (!Rn) return;
                    if (Rn.phase === 'pause') {
                        if (Rn.pendingNext) { Rn.pendingNext = false; next(); }
                        else Rn.phase = 'ask';
                        if (Rn.phase === 'pause') Rn.phase = 'ask';
                        lastT = Date.now();
                    } else if (Rn.phase === 'ask' || Rn.phase === 'right') {
                        if (Rn.phase === 'right') Rn.pendingNext = true;
                        clearAdv(); Rn.phase = 'pause';
                    }
                    break;
                case 'stop':
                    if (!Rn) return;
                    Rn.total = Rn.mode60 ? Rn.total : Rn.queue.slice(0, Rn.qi).filter(q => !q.retry).length;
                    if (!Rn.mode60) Rn.queue = Rn.queue.slice(0, Rn.qi);
                    finish(); break;
                default: return;
            }
            render(); save();
        }

        // ── Événements : souris, stylet et tactile (dédoublonnés) ──
        let lastUp = 0;
        function onTap(e) {
            const el = e.target.closest && e.target.closest('[data-act]');
            if (e.type === 'click') {
                if (Date.now() - lastUp < 700) { e.stopPropagation(); if (el) e.preventDefault(); return; }
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
            if (e.target.closest('.tmu-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.tmu-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });

        // Clavier physique
        function onKey(e) {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            if (!active) return;
            const tg = e.target;
            if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (S.tab === 'lecon' && typeof S.lesson === 'number') {
                if (e.key === 'ArrowRight') { S.vk = Math.min(10, S.vk + 1); }
                else if (e.key === 'ArrowLeft') { S.vk = Math.max(1, S.vk - 1); }
                else return;
                e.preventDefault(); e.stopPropagation(); render(); saveSoon(); return;
            }
            const Rn = S.run;
            if (S.tab !== 'train' || !Rn) return;
            if (Rn.phase === 'wrong' && (e.key === 'Enter' || e.key === ' ')) { next(); }
            else if (Rn.phase === 'right' && e.key === 'Enter') { next(); }
            else if (Rn.phase === 'ask') {
                const q = Rn.queue[Rn.qi];
                if (q.kind === 'qcm' && /^[1-4]$/.test(e.key)) answer(q.choices[+e.key - 1]);
                else if (q.kind === 'vf' && /^[vVoO]$/.test(e.key)) answer(true);
                else if (q.kind === 'vf' && /^[fFnN]$/.test(e.key)) answer(false);
                else if (/^[0-9]$/.test(e.key)) typeKey(e.key);
                else if (e.key === 'Backspace' || e.key === 'Delete') typeKey('del');
                else if (e.key === 'Enter') typeKey('ok');
                else return;
            } else return;
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
        widget._tmuGetData = function () {
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

    // Accès aux astuces (tests, autres activités)
    window._tmuEngine = { tipFor, makeQ, distractors };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createTablesMultiWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
