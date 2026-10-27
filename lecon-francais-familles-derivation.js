// =========================================================================
// ACTIVITÉ « FAMILLES DE MOTS ET DÉRIVATION » — Le Bureau du Prof
// Leçons + atelier de briques + exercices corrigés (présentation de « La phrase »).
//
// 📖 Leçons : la famille de mots, le radical, les préfixes, les suffixes,
//    former des mots (dérivation). Exemples colorés : préfixe en bleu,
//    radical en orange, suffixe en vert, terminaison du verbe en gris.
// 🧱 Atelier : on assemble des briques (préfixe + radical + suffixe) puis on
//    vérifie dans le dictionnaire si le mot existe (avec sa définition).
//    Pour chaque radical, on compte les mots de la famille trouvés.
// ✏️ Exercices :
//    🕵️ L'intrus : trouver le mot qui n'est pas de la famille.
//    🗂️ Trier par famille : ranger les mots dans la bonne famille.
//    ✂️ Découper : couper le mot entre préfixe, radical et suffixe.
//    🔨 Construire : former le mot qui correspond à la définition.
//    🎯 Le sens : que veut dire ce préfixe / ce suffixe ?
//
// Ouverture : createWidget('familles-derivation')  ou  createFamillesDerivationWidget()
// Sauvegarde : w._fdGetData()  /  createFamillesDerivationWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'familles-derivation';

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

    // ── CSS (préfixe fd-) ─────────────────────────────────────────────────
    if (!document.getElementById('fd-style')) {
        const s = document.createElement('style');
        s.id = 'fd-style';
        s.textContent = `
.widget[data-type="familles-derivation"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.fd-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    --cpre:#2F80ED; --crad:#E8862A; --csuf:#22A35A; --cend:#8A8FA3;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.fd-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .fd-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .fd-tab-lbl { display:none; }
    .fd-title { font-size:17px !important; }
    .fd-lesson { flex-direction:column; }
    .fd-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .fd-gbtn { flex:1 1 auto; text-align:center !important; }
    .fd-srow > .l { min-width:0 !important; width:100%; }
    .fd-slot { min-width:70px !important; }
}
.fd-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.fd-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.fd-tabs { display:flex; gap:6px; margin-left:12px; }
.fd-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.fd-tab:hover { background:rgba(255,255,255,.1); }
.fd-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.fd-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.fd-icon-btn:hover { background:rgba(255,255,255,.28); }
.fd-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* Parties du mot */
.fd-pre { color:var(--cpre); font-weight:900; }
.fd-rad { color:var(--crad); font-weight:900; }
.fd-suf { color:var(--csuf); font-weight:900; }
.fd-end { color:var(--cend); font-weight:800; }
.fd-word { font-family:'MDI',cursive; font-size:calc(var(--f, 30px) * .9); line-height:1.35; }
.fd-word .fd-pre, .fd-word .fd-rad, .fd-word .fd-suf, .fd-word .fd-end { font-weight:700; }
.fd-word.lined .fd-pre { border-bottom:3px solid var(--cpre); }
.fd-word.lined .fd-rad { border-bottom:3px solid var(--crad); }
.fd-word.lined .fd-suf { border-bottom:3px solid var(--csuf); }

/* ── Leçons ── */
.fd-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.fd-side { width:210px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.fd-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.fd-gbtn:hover { transform:translateX(2px); }
.fd-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.fd-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.fd-ltitle h2 { margin:0; font-size:34px; font-weight:900; }
.fd-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.fd-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.fd-box ul { margin:4px 0 0; padding-left:20px; }
.fd-what { background:#f1edff; border:2px solid #c8bbf5; }
.fd-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.fd-memo { background:#fff6d6; border:2px solid #f3d36b; }
.fd-trap { background:#ffecee; border:2px solid #f6a7b0; }
.fd-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.fd-ex { font-family:'MDI',cursive; font-size:21px; line-height:1.55; }
.fd-legend { display:flex; gap:12px; flex-wrap:wrap; font-size:14px; font-weight:800; }
.fd-legend span::before { content:''; display:inline-block; width:12px; height:12px; border-radius:3px; margin-right:5px; vertical-align:-1px; background:currentColor; }
.fd-famchips { display:flex; gap:6px; flex-wrap:wrap; }
.fd-famgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:8px; }
.fd-famcard { background:#fff; border:2px solid #e3d8c3; border-radius:12px; padding:6px 10px; }
.fd-famcard .fd-word { --f:30px; }
.fd-famcard .d { font-size:13px; color:#5a5470; line-height:1.35; }
.fd-famcard.base { border-color:var(--crad); background:#fff6ec; }
.fd-table { width:100%; border-collapse:separate; border-spacing:0 4px; font-size:15px; }
.fd-table td { background:#fff; padding:5px 10px; border-top:2px solid #eee4d2; border-bottom:2px solid #eee4d2; }
.fd-table td:first-child { border-left:2px solid #eee4d2; border-radius:10px 0 0 10px; font-weight:900; font-size:18px; white-space:nowrap; }
.fd-table td:last-child { border-right:2px solid #eee4d2; border-radius:0 10px 10px 0; }
.fd-table .fd-ex { font-size:18px; }
.fd-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.fd-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.fd-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.fd-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.fd-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }
.fd-btn:disabled { opacity:.45; }

/* ── Briques ── */
.fd-brick { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:4px; min-width:44px; padding:10px 12px 7px; margin-top:7px;
    border-radius:7px; border:none; color:#fff; font:inherit; font-weight:900; font-size:17px; line-height:1.1; touch-action:manipulation;
    background:var(--bc); box-shadow:inset 0 -5px 0 rgba(0,0,0,.18), 0 3px 0 rgba(0,0,0,.18); text-shadow:0 1px 0 rgba(0,0,0,.2); }
.fd-brick::before { content:''; position:absolute; top:-7px; left:8px; right:8px; height:8px;
    background:radial-gradient(circle at 50% 100%, var(--bc) 0 5px, transparent 5.5px) 0 0 / 20px 16px repeat-x; filter:brightness(1.08); }
.fd-brick small { font-weight:700; font-size:11px; opacity:.9; display:block; }
.fd-brick.vert { flex-direction:column; gap:0; }
.fd-brick.pre { --bc:#2F80ED; } .fd-brick.rad { --bc:#E8862A; } .fd-brick.suf { --bc:#22A35A; } .fd-brick.end { --bc:#8A8FA3; } .fd-brick.none { --bc:#b9b2c9; }
.fd-brick.on { outline:4px solid var(--or); outline-offset:2px; }
.fd-brick:active { transform:translateY(2px); }
.fd-brick.drop { animation:fd-drop .45s cubic-bezier(.3,1.6,.5,1); }
@keyframes fd-drop { 0% { transform:translateY(-40px); opacity:0; } 100% { transform:translateY(0); opacity:1; } }
.fd-tray { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:6px 10px 10px; }
.fd-tray h4 { margin:2px 0 2px; font-size:14px; display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
.fd-tray h4 span { font-weight:700; font-size:12px; color:#7b7393; }
.fd-tray .bricks { display:flex; gap:7px; flex-wrap:wrap; }
.fd-build { display:flex; align-items:flex-end; justify-content:center; gap:4px; flex-wrap:wrap; padding:14px 10px 10px; background:#fff; border:3px dashed #d9cdb6; border-radius:18px; }
.fd-slot { min-width:110px; min-height:58px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:2px; }
.fd-slot .lbl { font-size:12px; font-weight:900; color:#9a8f7a; }
.fd-slot .empty { min-width:96px; height:46px; border:3px dashed #d9cdb6; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#c3b9a5; font-weight:900; font-size:22px; }
.fd-slot .fd-brick { font-size:24px; padding:12px 16px 9px; }
.fd-plus { font-size:26px; font-weight:900; color:#b6ab95; padding-bottom:12px; }
.fd-result { border-radius:16px; padding:10px 14px; text-align:center; display:flex; flex-direction:column; gap:4px; align-items:center; }
.fd-result.ok { background:#e2f7ec; border:2px solid #8fd8b0; }
.fd-result.ko { background:#ffe9eb; border:2px solid #f6a7b0; }
.fd-result.info { background:#f1edff; border:2px solid #c8bbf5; }
.fd-result .fd-word { --f:52px; }
.fd-result .d { font-size:16px; }
.fd-found { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }
.fd-found > span { background:#fff; border:2px solid #e3d8c3; border-radius:999px; padding:2px 10px; font-weight:800; font-size:14px; }
.fd-found .fd-word { --f:22px; }
.fd-found > span.hid { color:#c3b9a5; letter-spacing:2px; }

/* ── Exercices ── */
.fd-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.fd-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.fd-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fd-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.fd-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.fd-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.fd-hint { font-size:12.5px; color:#6a6380; }
.fd-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.fd-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.fd-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.fd-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.fd-pill.score { background:var(--vert); font-size:16px; }
.fd-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.fd-grid { --gap:calc(var(--f) * .5); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 2 * var(--gap)) / 3), min(100%, 280px)),1fr)); }
.fd-grid.wide { grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 360px)),1fr)); }
.fd-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .35) calc(var(--f) * .5) calc(var(--f) * .45); box-shadow:0 3px 0 rgba(42,31,74,.08);
    display:flex; flex-direction:column; gap:calc(var(--f) * .25); }
.fd-q.ok { border-color:var(--vert); background:#f3fcf7; }
.fd-q.ko { border-color:var(--rouge); background:#fff5f6; }
.fd-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:14px; font-weight:800; color:#5a5470; }
.fd-num { font-weight:900; color:#9a8f7a; }
.fd-qmain { text-align:center; }
.fd-qdef { font-size:calc(var(--f) * .55); font-weight:800; text-align:center; line-height:1.35; }
.fd-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.fd-choice { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:3px 11px; font:inherit; font-weight:900; font-size:calc(var(--f) * .5);
    color:var(--encre); touch-action:manipulation; }
.fd-choice.w { font-family:'MDI',cursive; font-weight:700; font-size:calc(var(--f) * .7); }
.fd-choice.on { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; }
.fd-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.fd-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.fd-why { font-size:13.5px; color:#5a5470; text-align:center; line-height:1.35; }
.fd-sol { font-family:'MDI',cursive; font-size:calc(var(--f) * .7); text-align:center; }
/* Découpe */
.fd-cut { display:flex; justify-content:center; align-items:stretch; flex-wrap:nowrap; font-family:'MDI',cursive; font-size:calc(var(--f) * 1.05); line-height:1.2; }
.fd-cut .let { padding:0 1px; }
.fd-cut .gap { width:calc(var(--f) * .42); display:flex; justify-content:center; touch-action:manipulation; border-radius:6px; }
.fd-cut .gap::after { content:''; width:2px; background:#e3d8c3; border-radius:2px; margin:4px 0; }
.fd-cut .gap:hover::after { background:#b9abef; }
.fd-cut .gap.on::after { width:5px; background:var(--rouge); }
.fd-cut .gap.ko::after { background:repeating-linear-gradient(#ff4f5e 0 4px, transparent 4px 7px); width:5px; }
.fd-cut .gap.miss::after { width:5px; background:repeating-linear-gradient(var(--vert) 0 4px, transparent 4px 7px); }
/* Construire */
.fd-mini { display:flex; align-items:flex-end; justify-content:center; gap:6px; flex-wrap:wrap; }
.fd-mini .col { display:flex; flex-direction:column; gap:4px; align-items:stretch; }
.fd-mini .fd-brick { font-size:calc(var(--f) * .48); padding:7px 9px 5px; margin-top:5px; min-width:36px; }
.fd-mini .fd-brick::before { top:-6px; height:7px; background-size:16px 14px; }
.fd-mini .fd-brick.rad { font-size:calc(var(--f) * .62); padding:12px 12px 9px; }
.fd-preview { text-align:center; min-height:calc(var(--f) * 1.1); }
.fd-preview .bad { color:#c0293a; text-decoration:line-through; }
/* Trier */
.fd-pool { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; padding:10px; background:#faf7f0; border:2px solid #e3d8c3; border-radius:16px; min-height:calc(var(--f) * 1.4); }
.fd-wchip { font-family:'MDI',cursive; font-size:calc(var(--f) * .8); font-weight:700; background:#fff; border:2px solid #d1c6ad; border-radius:10px; padding:.05em .45em;
    box-shadow:0 3px 0 rgba(42,31,74,.12); touch-action:manipulation; }
.fd-wchip.sel { border-color:var(--violet); background:#f3efff; box-shadow:0 0 0 4px #ddd3fb; }
.fd-wchip.ok { border-color:var(--vert); background:#e2f7ec; color:#178a4b; }
.fd-wchip.ko { border-color:var(--rouge); background:#ffe9eb; color:#c0293a; }
.fd-cols { display:grid; gap:10px; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); }
.fd-colbox { background:#fff; border:3px solid var(--c); border-radius:16px; padding:8px; display:flex; flex-direction:column; gap:6px; align-items:center; min-height:calc(var(--f) * 3); }
.fd-colbox.target { box-shadow:0 0 0 4px #ddd3fb; background:#fbf9ff; }
.fd-colbox h4 { margin:0; font-size:calc(var(--f) * .6); color:var(--c); font-weight:900; }
.fd-colbox .wl { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
.fd-say { border-radius:14px; padding:8px 14px; font-size:16px; line-height:1.5; text-align:center; background:#f1edff; border:2px solid #c8bbf5; }
.fd-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:fd-fall 1.6s ease-in forwards; }
@keyframes fd-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.fd-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:420px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.fd-help.show { display:block; }
.fd-help h4 { margin:0 0 6px; font-size:15px; }
.fd-help p { margin:0 0 6px; }
.fd-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.fd-container:hover .fd-resize { opacity:1; }
.fd-container.wf-fullboard .fd-resize { display:none; }
@media (prefers-reduced-motion: reduce) { .fd-brick.drop { animation:none !important; } }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="familles-derivation"], .fd-container, .fd-container * { cursor:default !important; }
.fd-container .fd-header { cursor:grab !important; }
.fd-container .fd-header:active { cursor:grabbing !important; }
.fd-container button, .fd-container [data-act] { cursor:pointer !important; }
.fd-container button:disabled { cursor:default !important; }
.fd-container .fd-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES : préfixes, suffixes, terminaisons
    // =====================================================================
    const PRE = {
        re:   { label: 're-',   forms: ['re', 'ré'],               sens: 'de nouveau' },
        de:   { label: 'dé-',   forms: ['dé', 'dés'],              sens: 'le contraire, enlever' },
        in:   { label: 'in-',   forms: ['in', 'im', 'il', 'ir'],   sens: 'le contraire (pas)' },
        pre:  { label: 'pré-',  forms: ['pré'],                    sens: 'avant' },
        sous: { label: 'sous-', forms: ['sous', 'sous-'],                   sens: 'en dessous' },
        sur:  { label: 'sur-',  forms: ['sur'],                    sens: 'au-dessus, trop' },
        en:   { label: 'en-',   forms: ['en', 'em'],               sens: 'mettre dans, donner' },
        mal:  { label: 'mal-',  forms: ['mal'],                    sens: 'pas bien, le contraire' },
        a:    { label: 'a-',    forms: ['a', 'al', 'ap', 'at'],    sens: 'vers, rendre' },
        anti: { label: 'anti-', forms: ['anti'],                   sens: 'contre' },
        co:   { label: 'co-',   forms: ['co'],                     sens: 'avec, ensemble' },
        bi:   { label: 'bi-',   forms: ['bi'],                     sens: 'deux' },
        tri:  { label: 'tri-',  forms: ['tri'],                    sens: 'trois' },
        para: { label: 'para-', forms: ['para'],                   sens: 'qui protège de' }
    };
    const SENS = {
        P: 'la personne qui fait (le métier)', O: 'un objet, un appareil', Pe: 'petit', A: 'l\'action de…',
        M: 'de façon… (manière)', L: 'un lieu, un magasin', Q: 'qu\'on peut…', H: 'qui a, plein de',
        Qu: 'le fait d\'être… (qualité)', Ar: 'l\'arbre (qui porte le fruit)', R: 'le résultat, ce qui est fait'
    };
    const SUF = {
        eur:  { label: '-eur',  forms: ['eur', 'ueur'], def: 'P' },
        ette: { label: '-ette', forms: ['ette'],        def: 'Pe' },
        et:   { label: '-et',   forms: ['et'],          def: 'Pe' },
        on:   { label: '-on',   forms: ['on'],          def: 'Pe' },
        age:  { label: '-age',  forms: ['age'],         def: 'A' },
        ment: { label: '-ment', forms: ['ment'],        def: 'M' },
        ier:  { label: '-ier',  forms: ['ier'],         def: 'P' },
        erie: { label: '-erie', forms: ['erie'],        def: 'L' },
        iste: { label: '-iste', forms: ['iste'],        def: 'P' },
        able: { label: '-able', forms: ['able'],        def: 'Q' },
        eux:  { label: '-eux',  forms: ['eux'],         def: 'H' },
        ure:  { label: '-ure',  forms: ['ure'],         def: 'R' },
        ion:  { label: '-ion',  forms: ['ion', 'ation'], def: 'A' },
        ite:  { label: '-ité',  forms: ['ité', 'té'],   def: 'Qu' },
        esse: { label: '-esse', forms: ['esse'],        def: 'Qu' },
        oir:  { label: '-oir',  forms: ['oir'],         def: 'O' }
    };
    const END = { er: { label: '-er', forms: ['er'] }, ir: { label: '-ir', forms: ['ir'] } };

    // ── Familles : radical (brique) + mots. « pré|rad|suf=définition »,
    //    « #X » = sens du suffixe dans ce mot, « ! » = pas de question « sens ».
    const FAMS_RAW = [
        ['coll', ['colle=Pâte qui sert à faire tenir des objets ensemble.', 'coll|er=Faire tenir avec de la colle.', 'dé|coll|er=Détacher ce qui était collé.',
            're|coll|er=Coller de nouveau.', 'en|coll|er=Mettre de la colle sur quelque chose.', 'coll|age=Action de coller ; image faite de morceaux collés.', 'dé|coll|age=Moment où l\'avion quitte le sol.!']],
        ['plant', ['plante=Végétal qui pousse dans la terre.', 'plant|er=Mettre une plante en terre.', 're|plant|er=Planter de nouveau.',
            'plant|ation=Action de planter.', 'plant|eur=Personne qui plante, qui cultive.', 'plant|oir=Outil pour faire les trous où l\'on plante.']],
        ['lav', ['lav|er=Nettoyer avec de l\'eau.', 're|lav|er=Laver de nouveau.', 'dé|lav|er=Faire perdre ses couleurs en lavant.', 'lav|age=Action de laver.',
            'pré|lav|age=Lavage fait avant le vrai lavage.', 'lav|able=Qu\'on peut laver.', 'lav|eur=Personne qui lave (un laveur de vitres).',
            'lav|ette=Petit carré de tissu pour laver la vaisselle.', 'lav|oir#L=Lieu où l\'on lavait le linge autrefois.']],
        ['chant', ['chant=Suite de sons musicaux faits avec la voix.', 'chant|er=Faire des sons musicaux avec la voix.', 'chant|eur=Personne qui chante.',
            'en|chant|er=Charmer, rendre très heureux.!', 'dé|chant|er=Être déçu, perdre ses illusions.!']],
        ['jardin', ['jardin=Terrain où l\'on cultive des fleurs, des légumes.', 'jardin|er=S\'occuper d\'un jardin.', 'jardin|ier=Personne dont le métier est de s\'occuper des jardins.',
            'jardin|age=Action de jardiner.', 'jardin|et=Petit jardin.', 'jardin|erie=Magasin où l\'on vend des plantes et des outils de jardin.']],
        ['dent', ['dent=Petit os dur dans la bouche, qui sert à mâcher.', 'dent|iste=Médecin qui soigne les dents.', 'dent|ier#O=Appareil qui remplace des dents.']],
        ['fleur', ['fleur=Partie colorée d\'une plante.', 'fleur|ir=Se couvrir de fleurs.', 're|fleur|ir=Fleurir de nouveau.', 'dé|fleur|ir=Perdre ses fleurs.',
            'fleur|iste=Personne qui vend des fleurs.', 'fleur|ette=Petite fleur.']],
        ['lent', ['lent=Qui ne va pas vite.', 'lente|ment=De façon lente.', 'lent|eur#Qu=Le fait d\'être lent.']],
        ['long', ['long=Qui mesure beaucoup d\'un bout à l\'autre.', 'long|ueur#Qu=La taille d\'un bout à l\'autre.', 'al|long|er=Rendre plus long.', 'longue|ment=Pendant longtemps.']],
        ['possible', ['possible=Qui peut se faire.', 'im|possible=Qui ne peut pas se faire.', 'possibil|ité=Ce qui est possible.', 'im|possibil|ité=Le fait d\'être impossible.!']],
        ['propre', ['propre=Qui n\'est pas sale.', 'propre|ment=De façon propre.', 'propre|té=Le fait d\'être propre.', 'mal|propre=Qui n\'est pas propre, sale.']],
        ['port', ['port|er=Tenir une chose qui pèse et la déplacer.', 'port|eur=Personne qui porte.', 'port|able=Qu\'on peut porter facilement.',
            'ap|port|er=Porter vers quelqu\'un.', 'port|age=Action de porter.']],
        ['mont', ['mont=Grande montagne.', 'mont|er=Aller vers le haut ; assembler les pièces d\'un objet.', 'dé|mont|er=Défaire un objet pièce par pièce.',
            're|mont|er=Monter de nouveau.', 'sur|mont|er=Passer au-dessus d\'un obstacle.', 'mont|age=Action d\'assembler les pièces d\'un objet.']],
        ['faire', ['faire=Fabriquer, réaliser.', 're|faire=Faire de nouveau.', 'dé|faire=Détruire ce qui était fait.']],
        ['chauff', ['chauff|er=Rendre chaud.', 'ré|chauff|er=Chauffer de nouveau.', 'pré|chauff|er=Chauffer à l\'avance.', 'sur|chauff|er=Chauffer trop.',
            'chauff|age=Appareil ou action qui chauffe une maison.', 'chauff|eur=Personne qui conduit une voiture, un car.', 'chauff|erie=Lieu où se trouvent les chaudières.']],
        ['gentil', ['gentil=Aimable avec les autres.', 'gentill|esse=Le fait d\'être gentil.', 'genti|ment=De façon gentille.']],
        ['sage', ['sage=Calme, obéissant.', 'sag|esse=Le fait d\'être sage.', 'sage|ment=De façon sage.']],
        ['lait', ['lait=Liquide blanc que donnent les vaches et les mamans.', 'lait|ier=Personne qui vend ou livre du lait.', 'lait|erie=Lieu où l\'on transforme le lait.',
            'lait|age#R=Aliment fait avec du lait.', 'al|lait|er=Nourrir un bébé avec son lait.!']],
        ['courag', ['courage=Force qui permet d\'affronter le danger.', 'courag|eux=Qui a du courage.', 'dé|courag|er=Faire perdre courage.', 'en|courag|er=Donner du courage.']],
        ['mur', ['mur=Construction en pierres ou en briques qui ferme un lieu.', 'mur|et=Petit mur.', 'mur|er=Fermer avec un mur.', 'em|mur|er=Enfermer derrière un mur.']],
        ['cycl', ['cycle=Véhicule à roues, comme le vélo.', 'bi|cycl|ette=Vélo à deux roues.', 'tri|cycle=Vélo à trois roues.', 'cycl|iste=Personne qui fait du vélo.']],
        ['pilot', ['pilote=Personne qui conduit un avion ou une voiture de course.', 'pilot|er=Conduire un avion, une voiture.', 'co|pilote=Pilote qui aide le pilote.', 'pilot|age=Action de piloter.']],
        ['gel', ['gel=Glace qui se forme quand il fait très froid.', 'gel|er=Transformer en glace.', 'dé|gel|er=Faire fondre ce qui était gelé.', 'dé|gel=Moment où la glace fond.',
            'anti|gel=Produit qui empêche de geler.']],
        ['pluie', ['pluie=Eau qui tombe des nuages.', 'para|pluie=Objet qui protège de la pluie.']],
        ['sol', ['sol=Surface sur laquelle on marche.', 'sous-|sol=Étage qui se trouve sous le sol.']],
        ['charg', ['charg|er=Mettre une charge, un poids.', 'dé|charg|er=Enlever la charge.', 're|charg|er=Charger de nouveau.', 'sur|charg|er=Charger trop.',
            'charg|eur#O=Appareil qui recharge une batterie.', 'charge|ment#A=Action de charger ; ce qui est chargé.']],
        ['coiff', ['coiff|er=Arranger les cheveux.', 'coiff|eur=Personne dont le métier est de coiffer.', 'coiff|ure=Façon dont les cheveux sont arrangés.', 'dé|coiff|er=Déranger la coiffure.']],
        ['nag', ['nage=Façon de nager.', 'nag|er=Se déplacer dans l\'eau.', 'nag|eur=Personne qui nage.']],
        ['tir', ['tir|er=Amener vers soi.', 're|tir|er=Enlever, reprendre.!', 'tir|oir=Petite caisse qui glisse dans un meuble.', 'tir|age=Action de tirer au sort.']],
        ['arros', ['arros|er=Verser de l\'eau sur les plantes.', 'arros|oir=Récipient qui sert à arroser.', 'arros|age=Action d\'arroser.']],
        ['connu', ['connu=Que l\'on connaît.', 'in|connu=Que l\'on ne connaît pas.']],
        ['visible', ['visible=Que l\'on peut voir.', 'in|visible=Que l\'on ne peut pas voir.', 'visibil|ité=Le fait d\'être visible.']],
        ['lisible', ['lisible=Que l\'on peut lire.', 'il|lisible=Que l\'on ne peut pas lire.']],
        ['réel', ['réel=Qui existe vraiment.', 'ir|réel=Qui n\'existe pas vraiment.']],
        ['mobile', ['mobile=Qui peut bouger.', 'im|mobile=Qui ne bouge pas.']],
        ['patient', ['patient=Qui sait attendre calmement.', 'im|patient=Qui n\'aime pas attendre.']],
        ['buv', ['buv|able=Qu\'on peut boire.', 'im|buv|able=Qu\'on ne peut pas boire.']],
        ['oubli', ['oubli=Le fait d\'oublier.', 'oubli|er=Ne plus se souvenir.', 'in|oubli|able=Qu\'on ne peut pas oublier.']],
        ['agréable', ['agréable=Qui fait plaisir.', 'dés|agréable=Qui n\'est pas agréable.', 'agréable|ment=De façon agréable.']],
        ['obé', ['obé|ir=Faire ce qui est demandé.', 'dés|obé|ir=Ne pas obéir.']],
        ['terr', ['terre=Sol sur lequel on marche.', 'en|terr|er=Mettre dans la terre.', 'dé|terr|er=Sortir de la terre.', 'at|terr|ir=Se poser sur le sol.', 'terr|ier#L=Trou où vit le lapin.']],
        ['lun', ['lune=Astre qui tourne autour de la Terre.', 'a|lun|ir=Se poser sur la Lune.']],
        ['plat', ['plat=Sans creux ni bosse.', 'a|plat|ir=Rendre plat.']],
        ['nuag', ['nuage=Masse de gouttes d\'eau dans le ciel.', 'nuag|eux=Couvert de nuages.']],
        ['peur', ['peur=Sentiment que l\'on a face au danger.', 'peur|eux=Qui a souvent peur.']],
        ['chat', ['chat=Petit animal domestique qui miaule.', 'chat|on=Petit du chat.']],
        ['âne', ['âne=Animal aux longues oreilles.', 'ân|on=Petit de l\'âne.']],
        ['camion', ['camion=Gros véhicule qui transporte des marchandises.', 'camionn|ette=Petit camion.', 'camionn|eur=Personne qui conduit un camion.']],
        ['maison', ['maison=Bâtiment où l\'on habite.', 'maisonn|ette=Petite maison.']],
        ['savon', ['savon=Produit qui sert à se laver.', 'savonn|er=Laver avec du savon.', 'savonn|ette=Petit savon.']],
        ['poisson', ['poisson=Animal qui vit dans l\'eau.', 'poissonn|ier=Personne qui vend du poisson.', 'poissonn|erie=Magasin où l\'on vend du poisson.']],
        ['pomm', ['pomme=Fruit rond du pommier.', 'pomm|ier#Ar=Arbre qui donne des pommes.']],
        ['poir', ['poire=Fruit du poirier.', 'poir|ier#Ar=Arbre qui donne des poires.']],
        ['ceris', ['cerise=Petit fruit rouge à noyau.', 'ceris|ier#Ar=Arbre qui donne des cerises.']]
    ];

    // Mots de la même famille (y compris avec un radical qui change) + intrus
    const INTRUS = [
        { base: 'terre',   fam: ['terrier', 'enterrer', 'atterrir', 'déterrer'],   x: 'terrible',  why: 'Terrible vient de « terreur » (une très grande peur), pas de « terre ».' },
        { base: 'mer',     fam: ['marin', 'maritime', 'amerrir', 'marée'],         x: 'merci',     why: 'Merci n\'a rien à voir avec la mer : seules les lettres se ressemblent.' },
        { base: 'chant',   fam: ['chanter', 'chanteur', 'chanson', 'enchanter'],   x: 'chantier',  why: 'Un chantier est un lieu de construction : rien à voir avec le chant.' },
        { base: 'colle',   fam: ['coller', 'décoller', 'recoller', 'collage'],     x: 'collier',   why: 'Collier vient de « col » (le cou), pas de « colle ».' },
        { base: 'lait',    fam: ['laitier', 'laitage', 'allaiter', 'laiterie'],    x: 'laid',      why: 'Laid veut dire « pas beau » : rien à voir avec le lait.' },
        { base: 'dent',    fam: ['dentiste', 'dentier', 'édenté', 'dentaire'],     x: 'accident',  why: 'Accident se termine par « dent », mais n\'a rien à voir avec les dents.' },
        { base: 'mont',    fam: ['monter', 'montagne', 'démonter', 'montée'],      x: 'montre',    why: 'Une montre donne l\'heure : ce mot vient de « montrer ».' },
        { base: 'nuit',    fam: ['minuit', 'nocturne', 'nuitée', 'noctambule'],    x: 'nuire',     why: 'Nuire veut dire « faire du mal » : rien à voir avec la nuit.' },
        { base: 'pied',    fam: ['piéton', 'pédestre', 'trépied', 'piétiner'],     x: 'pierre',    why: 'Une pierre est un caillou : rien à voir avec le pied.' },
        { base: 'jardin',  fam: ['jardiner', 'jardinier', 'jardinage', 'jardinerie'], x: 'jarre',  why: 'Une jarre est un grand vase en terre.' },
        { base: 'chat',    fam: ['chaton', 'chatte', 'chatière'],                  x: 'château',   why: 'Château commence par « chat », mais c\'est une grande demeure.' },
        { base: 'poisson', fam: ['poissonnier', 'poissonnerie', 'poissonneux'],    x: 'poison',    why: 'Un poison est un produit dangereux : rien à voir avec le poisson.' },
        { base: 'vent',    fam: ['venteux', 'éventail', 'ventilateur', 'paravent'], x: 'ventre',   why: 'Le ventre est une partie du corps : rien à voir avec le vent.' },
        { base: 'savon',   fam: ['savonner', 'savonnette', 'savonneux'],           x: 'savoir',    why: 'Savoir veut dire « connaître » : rien à voir avec le savon.' },
        { base: 'glace',   fam: ['glacier', 'glacial', 'glaçon', 'glacer'],        x: 'glisser',   why: 'Glisser commence pareil, mais ne vient pas de « glace ».' },
        { base: 'sel',     fam: ['saler', 'salière', 'dessaler', 'salé'],          x: 'selle',     why: 'Une selle se met sur le dos d\'un cheval.' },
        { base: 'cheval',  fam: ['chevalier', 'chevaucher', 'chevalin', 'chevaux'], x: 'cheveu',   why: 'Un cheveu pousse sur la tête : rien à voir avec le cheval.' },
        { base: 'fleur',   fam: ['fleuriste', 'fleurir', 'floral', 'fleurette'],   x: 'fleuve',    why: 'Un fleuve est un grand cours d\'eau.' },
        { base: 'porter',  fam: ['porteur', 'portable', 'apporter', 'transporter'], x: 'porc',     why: 'Le porc est un animal (le cochon).' },
        { base: 'bois',    fam: ['boisé', 'déboiser', 'reboiser', 'boiserie'],     x: 'boisson',   why: 'Une boisson se boit : ce mot vient de « boire ».' }
    ];

    // ── Lecture des données ──
    const preOf = {}, sufOf = {};
    Object.keys(PRE).forEach(id => PRE[id].forms.forEach(f => preOf[f] = id));
    Object.keys(SUF).forEach(id => SUF[id].forms.forEach(f => sufOf[f] = id));
    Object.keys(END).forEach(id => END[id].forms.forEach(f => sufOf[f] = id));
    const isEnd = id => !!END[id];
    const FAMS = FAMS_RAW.map(([r, list], fi) => {
        const words = list.map(raw => {
            let [spec, def] = raw.split('=');
            let noSens = false;
            if (def && def.slice(-1) === '!') { noSens = true; def = def.slice(0, -1); }
            let sense = null;
            if (spec.indexOf('#') !== -1) { [spec, sense] = spec.split('#'); }
            const parts = spec.split('|');
            let pre = '', rad = '', suf = '';
            if (parts.length === 1) rad = parts[0];
            else if (parts.length === 3) [pre, rad, suf] = parts;
            else if (sufOf[parts[1]] !== undefined) [rad, suf] = parts;
            else [pre, rad] = parts;
            const p = pre ? preOf[pre] : '', s = suf ? sufOf[suf] : '';
            if (s && !isEnd(s) && !sense) sense = SUF[s].def;
            return { w: pre + rad + suf, pre, rad, suf, p, s, def, sense, noSens, fi };
        });
        const map = {};
        words.forEach(e => map[e.p + '|' + e.s] = e);
        const base = words.find(e => !e.p && (!e.s || isEnd(e.s))) || words[0];
        return { r, words, map, base, fi };
    });
    const ALL = [].concat(...FAMS.map(f => f.words));

    // =====================================================================
    // OUTILS
    // =====================================================================
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];
    // Mot coloré : préfixe bleu, radical orange, suffixe vert, terminaison grise
    function colored(e, lined) {
        const endCls = e.s && isEnd(e.s) ? 'fd-end' : 'fd-suf';
        return `<span class="fd-word${lined ? ' lined' : ''}">${e.pre ? `<span class="fd-pre">${esc(e.pre)}</span>` : ''}<span class="fd-rad">${esc(e.rad)}</span>${e.suf ? `<span class="${endCls}">${esc(e.suf)}</span>` : ''}</span>`;
    }
    const brickLabel = (kind, id) => kind === 'pre' ? PRE[id].label : kind === 'rad' ? FAMS[id].r : (SUF[id] || END[id]).label;
    function naive(p, fi, s) {
        return (p ? PRE[p].forms[0] : '') + FAMS[fi].r + (s ? (SUF[s] || END[s]).forms[0] : '');
    }

    // Lecture à voix haute
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
        clic: () => { tone(520, 0, 0.05, 'square', 0.04); tone(390, 0.04, 0.07, 'square', 0.03); },
        win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22))
    };

    // =====================================================================
    // LEÇONS
    // =====================================================================
    const LESSONS = [
        { id: 'famille', label: '🌳 La famille de mots', color: '#E8862A' },
        { id: 'radical', label: '🧱 Le radical',         color: '#C0392B' },
        { id: 'prefixe', label: '⬅️ Les préfixes',       color: '#2F80ED' },
        { id: 'suffixe', label: '➡️ Les suffixes',       color: '#22A35A' },
        { id: 'derive',  label: '🔨 Former des mots',    color: '#6C4FD8' }
    ];
    const VIEW_FAMS = ['lav', 'chauff', 'jardin', 'coll', 'charg', 'mont', 'fleur', 'gel'];
    const EXT = {
        intrus:    { label: '🕵️ L\'intrus',          color: '#E8862A' },
        tri:       { label: '🗂️ Trier par famille',   color: '#C0392B' },
        decoupe:   { label: '✂️ Découper le mot',     color: '#2F80ED' },
        construis: { label: '🔨 Construire le mot',   color: '#6C4FD8' },
        sens:      { label: '🎯 Le sens',             color: '#22A35A' }
    };

    function defaultState() {
        return {
            tab: 'lecon', lesson: 'famille', viewFam: 'lav',
            at: { p: '', r: FAMS.findIndex(f => f.r === 'coll'), s: '', res: null, showAll: false },
            found: {},
            ex: { type: 'intrus', n: 8, nf: 3 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createFamillesDerivationWidget = function (saved) {
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
        container.className = 'fd-container';
        container.innerHTML = `
            <div class="fd-header">
                <span class="fd-title">🧱 Familles de mots</span>
                <div class="fd-tabs">
                    <button class="fd-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="fd-tab-lbl">Leçons</span></button>
                    <button class="fd-tab" data-act="tab" data-tab="atelier"><span>🧱</span><span class="fd-tab-lbl">Atelier</span></button>
                    <button class="fd-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="fd-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="fd-icon-btn" data-act="sound" title="Son"></button>
                    <button class="fd-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="fd-body"></div>
            <div class="fd-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — La famille de mots, le radical, les préfixes, les suffixes et la formation des mots. Les couleurs aident : <b style="color:#2F80ED">préfixe</b>, <b style="color:#E8862A">radical</b>, <b style="color:#22A35A">suffixe</b>, <b style="color:#8A8FA3">terminaison du verbe</b>.</p>
                <p><b>🧱 Atelier</b> — Touche une brique de chaque couleur pour l'assembler (touche une brique posée pour l'enlever), puis <b>📖 Vérifier dans le dictionnaire</b> : le mot existe-t-il ? Pour chaque radical, essaie de trouver tous les mots de la famille.</p>
                <p><b>✏️ Exercices</b> — Cinq types : l'intrus, le tri par famille, le découpage (touche entre deux lettres pour couper), la construction d'un mot à partir de sa définition, et le sens des préfixes et suffixes. Puis <b>👁 Correction</b> avec le score.</p>
            </div>
            <div class="fd-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.fd-body');
        const help = container.querySelector('.fd-help');
        const resizeHandle = container.querySelector('.fd-resize');

        // ── État ──
        const S = defaultState();
        if (saved && saved.state) {
            Object.keys(S).forEach(k => {
                if (saved.state[k] === undefined) return;
                if (S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign(S[k], saved.state[k]);
                else S[k] = saved.state[k];
            });
        }
        if (!FAMS[S.at.r]) S.at.r = 0;
        let msg = '', dropKind = '';
        const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        const LEG = `<div class="fd-legend"><span style="color:#2F80ED">préfixe</span><span style="color:#E8862A">radical</span><span style="color:#22A35A">suffixe</span><span style="color:#8A8FA3">terminaison du verbe</span></div>`;
        const W = w => { const e = ALL.find(x => x.w === w); return e ? colored(e) : esc(w); };
        function famViewer() {
            const f = FAMS.find(x => x.r === S.viewFam) || FAMS[0];
            const chips = VIEW_FAMS.map(r => { const ff = FAMS.find(x => x.r === r); return `<button class="fd-chip ${S.viewFam === r ? 'on' : ''}" style="--c:#E8862A" data-act="viewfam" data-v="${r}">${esc(ff.base.w)}</button>`; }).join('');
            const cards = f.words.map(e => `<div class="fd-famcard ${e === f.base ? 'base' : ''}">${colored(e)}<div class="d">${e === f.base ? '<b>Mot de base.</b> ' : ''}${esc(e.def)}</div></div>`).join('');
            return `<div class="fd-box fd-tool"><b class="t">🔎 Exemple : choisis une famille</b><div class="fd-famchips">${chips}</div>
                <div style="margin:8px 0 6px">${LEG}</div><div class="fd-famgrid">${cards}</div></div>`;
        }
        function renderFamille() {
            return `<div class="fd-ltitle"><h2 style="color:#E8862A">🌳 La famille de mots</h2></div>
                <div class="fd-box fd-what"><b class="t">🔤 Qu'est-ce qu'une famille de mots ?</b>Les mots d'une même famille sont formés à partir du <b>même mot de base</b>. Ils ont une partie commune, le <b>radical</b>, et ils parlent de la <b>même idée</b>.
                    <div class="fd-ex">${W('jardin')} · ${W('jardiner')} · ${W('jardinier')} · ${W('jardinage')} · ${W('jardinet')}</div></div>
                ${famViewer()}
                <div class="fd-box fd-memo"><b class="t">🧠 Pour retenir</b>Deux conditions : <b>le même radical</b> ET <b>le même sens</b>. Il faut les deux !</div>
                <div class="fd-box fd-trap"><b class="t">⚠️ Piège n°1 : les faux amis</b>Des mots peuvent se ressembler sans être de la même famille :
                    <span class="fd-ex">colle / collier · chant / chantier · lait / laid · mont / montre</span>. Le collier se met autour du <i>col</i> (le cou), pas avec de la colle !</div>
                <div class="fd-box fd-trap"><b class="t">⚠️ Piège n°2 : le radical peut changer</b>Certains mots de la même famille ont un radical un peu différent, venu du latin :
                    <span class="fd-ex">mer → marin, maritime · fleur → floral · nuit → nocturne · pied → piéton, pédestre · dent → dentaire</span></div>
                <div><button class="fd-btn go" data-act="practice" data-v="intrus">✏️ S'entraîner : l'intrus</button> <button class="fd-btn alt" data-act="practice" data-v="tri">🗂️ Trier par famille</button></div>`;
        }
        function renderRadical() {
            return `<div class="fd-ltitle"><h2 style="color:#C0392B">🧱 Le radical</h2></div>
                <div class="fd-box fd-what"><b class="t">🔤 Le radical</b>Le <b>radical</b> est la partie <b>commune</b> à tous les mots d'une famille. C'est la brique de base sur laquelle on construit les autres mots.
                    <div class="fd-ex">${W('chauffer')} · ${W('réchauffer')} · ${W('chauffage')} · ${W('chauffeur')} · ${W('chaufferie')}</div></div>
                <div class="fd-box fd-test"><b class="t">🔎 Mot simple ou mot dérivé ?</b><ul>
                    <li>Un <b>mot simple</b> n'a ni préfixe ni suffixe : <span class="fd-ex">${W('chat')}, ${W('lent')}, ${W('fleur')}</span>.</li>
                    <li>Un <b>mot dérivé</b> est fabriqué à partir d'un mot simple, en ajoutant un préfixe et / ou un suffixe : <span class="fd-ex">${W('chaton')}, ${W('lentement')}, ${W('refleurir')}</span>.</li></ul></div>
                ${famViewer()}
                <div class="fd-box fd-memo"><b class="t">🧠 Pour retenir</b>Pour trouver le radical, j'écris plusieurs mots de la famille les uns sous les autres et je cherche <b>ce qui ne change pas</b>.</div>
                <div class="fd-box fd-trap"><b class="t">⚠️ Attention</b>Pour les verbes, <b>-er</b> et <b>-ir</b> ne sont pas des suffixes : c'est la <b>terminaison</b> de l'infinitif. <span class="fd-ex">${W('coller')} = radical coll + terminaison er</span>. Parfois le radical s'écrit un peu différemment : <span class="fd-ex">savon → ${W('savonnette')}, gentil → ${W('gentiment')}</span>.</div>
                <div><button class="fd-btn go" data-act="practice" data-v="decoupe">✏️ S'entraîner : découper le mot</button></div>`;
        }
        function exFor(kind, id, n) {
            const list = ALL.filter(e => (kind === 'pre' ? e.p : e.s) === id).slice(0, n || 3);
            return list.map(e => colored(e)).join(', ');
        }
        function renderPrefixe() {
            const rows = Object.keys(PRE).map(id => `<tr><td style="color:#2F80ED">${PRE[id].label}</td><td>${esc(PRE[id].sens)}</td><td class="fd-ex">${exFor('pre', id)}</td></tr>`).join('');
            return `<div class="fd-ltitle"><h2 style="color:#2F80ED">⬅️ Les préfixes</h2></div>
                <div class="fd-box fd-what"><b class="t">🔤 Le préfixe</b>Le <b>préfixe</b> est une brique qui se place <b>avant le radical</b>. Il <b>change le sens</b> du mot.
                    <div class="fd-ex">${W('coller')} → ${W('décoller')} (le contraire) · ${W('recoller')} (de nouveau)</div></div>
                <table class="fd-table"><tbody>${rows}</tbody></table>
                <div class="fd-box fd-memo"><b class="t">🧠 Pour retenir</b>Le préfixe change le sens, mais <b>pas la nature</b> du mot : <i>coller</i> et <i>décoller</i> sont deux verbes ; <i>possible</i> et <i>impossible</i> deux adjectifs.</div>
                <div class="fd-box fd-trap"><b class="t">⚠️ Le préfixe change d'orthographe</b><ul>
                    <li><b>in-</b> devient <b>im-</b> devant m, b, p (<span class="fd-ex">${W('immobile')}, ${W('imbuvable')}, ${W('impossible')}</span>), <b>il-</b> devant l (<span class="fd-ex">${W('illisible')}</span>), <b>ir-</b> devant r (<span class="fd-ex">${W('irréel')}</span>).</li>
                    <li><b>dé-</b> devient <b>dés-</b> devant une voyelle : <span class="fd-ex">${W('désobéir')}, ${W('désagréable')}</span>.</li>
                    <li><b>en-</b> devient <b>em-</b> devant m, b, p : <span class="fd-ex">${W('emmurer')}</span> ; <b>re-</b> devient parfois <b>ré-</b> : <span class="fd-ex">${W('réchauffer')}</span>.</li>
                    <li><b>a-</b> double souvent la consonne : <span class="fd-ex">${W('allonger')}, ${W('apporter')}, ${W('atterrir')}</span>.</li></ul></div>
                <div><button class="fd-btn go" data-act="practice" data-v="sens">✏️ S'entraîner : le sens</button> <button class="fd-btn alt" data-act="tab" data-tab="atelier">🧱 Aller à l'atelier</button></div>`;
        }
        function renderSuffixe() {
            const rows = Object.keys(SUF).map(id => `<tr><td style="color:#22A35A">${SUF[id].label}</td><td>${esc(SENS[SUF[id].def])}</td><td class="fd-ex">${exFor('suf', id)}</td></tr>`).join('');
            return `<div class="fd-ltitle"><h2 style="color:#22A35A">➡️ Les suffixes</h2></div>
                <div class="fd-box fd-what"><b class="t">🔤 Le suffixe</b>Le <b>suffixe</b> est une brique qui se place <b>après le radical</b>. Il change le sens du mot et, souvent, sa <b>nature</b>.
                    <div class="fd-ex">${W('laver')} (verbe) → ${W('lavage')} (nom) · ${W('lavable')} (adjectif) · ${W('lent')} (adjectif) → ${W('lentement')} (adverbe)</div></div>
                <table class="fd-table"><tbody>${rows}</tbody></table>
                <div class="fd-box fd-memo"><b class="t">🧠 Pour retenir</b>Un même suffixe peut avoir plusieurs sens : <b>-ier</b> donne un métier (<span class="fd-ex">${W('jardinier')}</span>), un arbre (<span class="fd-ex">${W('pommier')}</span>) ou un objet (<span class="fd-ex">${W('dentier')}</span>). <b>-eur</b> donne une personne (<span class="fd-ex">${W('nageur')}</span>), un appareil (<span class="fd-ex">${W('chargeur')}</span>) ou une qualité (<span class="fd-ex">${W('lenteur')}</span>).</div>
                <div class="fd-box fd-trap"><b class="t">⚠️ Attention</b>Pour former un adverbe en <b>-ment</b>, on part de l'adjectif au <b>féminin</b> : lente → <span class="fd-ex">${W('lentement')}</span>. Et parfois la consonne double : savon → <span class="fd-ex">${W('savonnette')}</span>, camion → <span class="fd-ex">${W('camionnette')}</span>.</div>
                <div><button class="fd-btn go" data-act="practice" data-v="sens">✏️ S'entraîner : le sens</button> <button class="fd-btn alt" data-act="practice" data-v="decoupe">✂️ Découper le mot</button></div>`;
        }
        function renderDerive() {
            const brick = (k, t) => `<span class="fd-brick ${k}" style="font-size:20px">${esc(t)}</span>`;
            const plus = '<span class="fd-plus">+</span>';
            return `<div class="fd-ltitle"><h2 style="color:#6C4FD8">🔨 Former des mots (la dérivation)</h2></div>
                <div class="fd-box fd-what"><b class="t">🔤 Construire un mot, comme avec des briques</b>On peut fabriquer un mot nouveau en ajoutant des briques au radical : c'est la <b>dérivation</b>. Le mot obtenu est un <b>mot dérivé</b>.
                    <div class="fd-build" style="margin-top:10px">${brick('pre', 'dé-')}${plus}${brick('rad', 'coll')}${plus}${brick('suf', '-age')}<span class="fd-plus">=</span><span style="padding-bottom:8px">${W('décollage')}</span></div></div>
                <div class="fd-box fd-test"><b class="t">🔎 D'autres constructions</b>
                    <div class="fd-ex">${W('impossibilité')} · ${W('bicyclette')} · ${W('inoubliable')} · ${W('prélavage')} · ${W('imbuvable')}</div></div>
                <div class="fd-box fd-memo"><b class="t">🧠 Pour retenir</b>mot dérivé = <b style="color:#2F80ED">préfixe</b> (s'il y en a un) + <b style="color:#E8862A">radical</b> + <b style="color:#22A35A">suffixe</b> (s'il y en a un).</div>
                <div class="fd-box fd-trap"><b class="t">⚠️ On ne peut pas coller n'importe quelles briques !</b><i>recollerie</i>, <i>délentement</i> ou <i>chatier</i> n'existent pas. Quand j'invente un mot, je vérifie dans le <b>dictionnaire</b>.</div>
                <div><button class="fd-btn go" data-act="tab" data-tab="atelier">🧱 Aller à l'atelier des briques</button> <button class="fd-btn alt" data-act="practice" data-v="construis">🔨 Construire le mot</button></div>`;
        }
        function renderLesson() {
            const side = LESSONS.map(l => `<button class="fd-gbtn ${S.lesson === l.id ? 'active' : ''}" style="--c:${l.color}" data-act="lesson" data-g="${l.id}">${l.label}</button>`).join('');
            const main = { famille: renderFamille, radical: renderRadical, prefixe: renderPrefixe, suffixe: renderSuffixe, derive: renderDerive }[S.lesson]();
            return `<div class="fd-lesson"><div class="fd-side">${side}</div><div class="fd-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : ATELIER DES BRIQUES
        // =================================================================
        function renderAtelier() {
            const A = S.at, F = FAMS[A.r];
            const slot = (kind, lbl, val) => {
                const has = kind === 'rad' ? true : !!val;
                const inner = has ? `<button class="fd-brick ${kind === 'suf' && isEnd(val) ? 'end' : kind}${dropKind === kind ? ' drop' : ''}" data-act="unslot" data-k="${kind}" title="Enlever">${esc(brickLabel(kind, val))}</button>`
                                  : `<div class="empty">?</div>`;
                return `<div class="fd-slot"><span class="lbl">${lbl}</span>${inner}</div>`;
            };
            let h = `<div class="fd-train">`;
            h += `<div class="fd-build">${slot('pre', 'préfixe', A.p)}<span class="fd-plus">+</span>${slot('rad', 'radical', A.r)}<span class="fd-plus">+</span>${slot('suf', 'suffixe ou terminaison', A.s)}</div>`;
            h += `<div class="fd-actions"><button class="fd-btn go" data-act="check-at">📖 Vérifier dans le dictionnaire</button><button class="fd-btn alt" data-act="clear-at">🧹 Vider</button></div>`;
            if (A.res) {
                const e = A.res.ok ? F.map[A.res.key] : null;
                if (e) {
                    const bits = [];
                    if (e.p) bits.push(`<b style="color:#2F80ED">${PRE[e.p].label}</b> = ${esc(PRE[e.p].sens)}`);
                    if (e.s && !isEnd(e.s)) bits.push(`<b style="color:#22A35A">${SUF[e.s].label}</b> = ${esc(SENS[e.sense])}`);
                    if (e.s && isEnd(e.s)) bits.push(`<b style="color:#8A8FA3">${END[e.s].label}</b> = terminaison du verbe`);
                    h += `<div class="fd-result ok"><div>✅ Ce mot existe !</div>${colored(e, true)}<div class="d">📖 ${esc(e.def)}</div>${bits.length ? `<div class="fd-hint">${bits.join(' · ')}</div>` : ''}
                        ${canSpeak ? `<button class="fd-btn alt small" data-act="say-at">🔊 Écouter</button>` : ''}</div>`;
                } else {
                    h += `<div class="fd-result ko"><div>❌ <b>${esc(A.res.txt)}</b> n'est pas dans mon dictionnaire.</div><div class="d">Essaie une autre brique !</div></div>`;
                }
            } else h += `<div class="fd-result info"><div class="d">Touche une brique de chaque couleur pour construire un mot, puis vérifie dans le dictionnaire.</div></div>`;
            // Mots trouvés de la famille
            const found = S.found[F.r] || [];
            const items = F.words.map(e => {
                const k = e.p + '|' + e.s;
                return found.indexOf(k) !== -1 || A.showAll ? `<span>${colored(e)}</span>` : `<span class="hid">${'•'.repeat(Math.min(e.w.length, 9))}</span>`;
            }).join('');
            h += `<div class="fd-tray"><h4>🌳 Famille du radical « ${esc(F.r)} » : ${found.length} / ${F.words.length} mots trouvés
                    <button class="fd-btn alt small" data-act="showall">${A.showAll ? '🙈 Cacher' : '👀 Montrer'} les mots</button></h4><div class="fd-found">${items}</div></div>`;
            // Bacs à briques
            const brick = (kind, id, on, extra) => `<button class="fd-brick ${kind}${extra ? ' vert' : ''} ${on ? 'on' : ''}" data-act="brick" data-k="${kind}" data-v="${id}">${esc(brickLabel(kind === 'end' ? 'suf' : kind, id))}${extra ? `<small>${esc(extra)}</small>` : ''}</button>`;
            h += `<div class="fd-tray"><h4 style="color:#2F80ED">⬅️ Préfixes <span>(avant le radical)</span></h4><div class="bricks">${Object.keys(PRE).map(id => brick('pre', id, A.p === id, PRE[id].sens)).join('')}</div></div>`;
            const rads = FAMS.map((f, i) => ({ f, i })).sort((x, y) => x.f.r.localeCompare(y.f.r, 'fr'));
            h += `<div class="fd-tray"><h4 style="color:#E8862A">🧱 Radicaux <span>(la base du mot)</span></h4><div class="bricks">${rads.map(o => brick('rad', o.i, A.r === o.i)).join('')}</div></div>`;
            h += `<div class="fd-tray"><h4 style="color:#22A35A">➡️ Suffixes <span>(après le radical)</span></h4><div class="bricks">${Object.keys(SUF).map(id => brick('suf', id, A.s === id, SENS[SUF[id].def])).join('')}</div>
                  <h4 style="color:#8A8FA3;margin-top:8px">🔚 Terminaisons du verbe <span>(pour fabriquer un verbe)</span></h4><div class="bricks">${Object.keys(END).map(id => brick('end', id, A.s === id)).join('')}</div></div>`;
            return h + `</div>`;
        }
        function checkAtelier() {
            const A = S.at, F = FAMS[A.r];
            const key = A.p + '|' + A.s;
            const e = F.map[key];
            if (e) {
                A.res = { ok: true, key };
                const list = S.found[F.r] || (S.found[F.r] = []);
                const isNew = list.indexOf(key) === -1;
                if (isNew) list.push(key);
                sfx('good');
                if (isNew && list.length === F.words.length) party();
            } else {
                A.res = { ok: false, txt: naive(A.p, A.r, A.s) };
                sfx('bad');
            }
        }

        // =================================================================
        // EXERCICES : génération
        // =================================================================
        function genRun() {
            const ex = S.ex, n = ex.n;
            let qs = [];
            if (ex.type === 'intrus') {
                qs = shuffle(INTRUS).slice(0, n).map(g => ({ base: g.base, x: g.x, why: g.why, opts: shuffle(shuffle(g.fam).slice(0, 4).concat([g.x])) }));
            } else if (ex.type === 'tri') {
                const groups = shuffle(INTRUS).slice(0, ex.nf);
                const words = shuffle([].concat(...groups.map((g, gi) => g.fam.map(w => ({ w, g: gi })))));
                S.run = { type: 'tri', groups: groups.map(g => g.base), words, place: {}, sel: null, corrected: false };
                return '';
            } else if (ex.type === 'decoupe') {
                const pool = ALL.filter(e => e.pre || (e.suf && !isEnd(e.s)));
                qs = shuffle(pool).slice(0, n).map(e => ({ fi: e.fi, key: e.p + '|' + e.s }));
            } else if (ex.type === 'construis') {
                const pool = ALL.filter(e => e.p || e.s);
                qs = shuffle(pool).slice(0, n).map(e => {
                    const pres = shuffle(Object.keys(PRE).filter(id => id !== e.p)).slice(0, e.p ? 2 : 3);
                    if (e.p) pres.push(e.p);
                    const sufIds = Object.keys(SUF).concat(Object.keys(END));
                    const sufs = shuffle(sufIds.filter(id => id !== e.s)).slice(0, e.s ? 2 : 3);
                    if (e.s) sufs.push(e.s);
                    return { fi: e.fi, key: e.p + '|' + e.s, pres: shuffle(pres), sufs: shuffle(sufs) };
                });
            } else {
                const pool = [];
                ALL.forEach(e => {
                    if (e.noSens) return;
                    if (e.p) pool.push({ fi: e.fi, key: e.p + '|' + e.s, on: 'pre' });
                    if (e.s && !isEnd(e.s)) pool.push({ fi: e.fi, key: e.p + '|' + e.s, on: 'suf' });
                });
                qs = shuffle(pool).slice(0, n).map(q => {
                    const e = FAMS[q.fi].map[q.key];
                    let good, all;
                    if (q.on === 'pre') { good = PRE[e.p].sens; all = Object.keys(PRE).map(id => PRE[id].sens); }
                    else { good = SENS[e.sense]; all = Object.keys(SENS).map(k => SENS[k]); }
                    const opts = shuffle(all.filter((v, i, a) => v !== good && a.indexOf(v) === i)).slice(0, 3).concat([good]);
                    return Object.assign(q, { good, opts: shuffle(opts) });
                });
            }
            if (!qs.length) return 'Aucune question disponible.';
            S.run = { type: ex.type, qs, ans: [], corrected: false };
            return '';
        }
        const entry = q => FAMS[q.fi].map[q.key];
        function cutsOf(e) {
            const c = [];
            if (e.pre) c.push(e.pre.length);
            if (e.suf && !isEnd(e.s)) c.push(e.pre.length + e.rad.length);
            return c.join(',');
        }
        function isRight(R, q, i) {
            const a = R.ans[i];
            if (R.type === 'intrus') return a === q.x;
            if (R.type === 'decoupe') return (a || '') === cutsOf(entry(q));
            if (R.type === 'construis') return a && (a.p || '') + '|' + (a.s || '') === q.key;
            if (R.type === 'sens') return a === q.good;
            return false;
        }
        function scoreOf(R) {
            if (R.type === 'tri') return { ok: R.words.filter((w, i) => R.place[i] === w.g).length, n: R.words.length };
            return { ok: R.qs.filter((q, i) => isRight(R, q, i)).length, n: R.qs.length };
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="fd-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="fd-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="fd-settings">`;
            h += `<div class="fd-srow"><span class="l">1. Exercice</span>${Object.keys(EXT).map(k => ch('type', k, ex.type === k, EXT[k].label, EXT[k].color)).join('')}</div>`;
            if (ex.type === 'tri') h += `<div class="fd-srow"><span class="l">Nombre de familles</span>${[2, 3, 4].map(n => ch('nf', n, ex.nf === n, String(n))).join('')}</div>`;
            else h += `<div class="fd-srow"><span class="l">Nombre de questions</span>${[6, 8, 12].map(n => ch('n', n, ex.n === n, String(n))).join('')}</div>`;
            h += `<div class="fd-srow"><span class="l">Taille du texte</span><button class="fd-btn alt small" data-act="font" data-d="-2">A−</button><button class="fd-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="fd-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="fd-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="fd-msg">⚠️ ${esc(msg)}</div>`;
            return h + `</div>`;
        }
        function card(R, i, inner, title) {
            let cls = '', mark = '';
            if (R.corrected) { const ok = isRight(R, R.qs[i], i); cls = ok ? 'ok' : 'ko'; mark = ok ? '✅' : '❌'; }
            return `<div class="fd-q ${cls}"><div class="fd-qtop"><span class="fd-num">${i + 1})</span>${title}<span style="margin-left:auto">${mark}</span></div>${inner}</div>`;
        }
        function renderQuestions(R) {
            if (R.type === 'intrus') {
                return `<div class="fd-grid wide">` + R.qs.map((q, i) => {
                    const a = R.ans[i];
                    const btns = q.opts.map(w => {
                        let c = a === w ? 'on' : '';
                        if (R.corrected) c = w === q.x ? 'good' : (a === w ? 'bad' : '');
                        return `<button class="fd-choice w ${c}" style="--c:#E8862A" data-act="ans" data-i="${i}" data-v="${esc(w)}">${esc(w)}</button>`;
                    }).join('');
                    return card(R, i, `<div class="fd-choices">${btns}</div>${R.corrected ? `<div class="fd-why">🕵️ <b>${esc(q.x)}</b> : ${esc(q.why)} Les autres sont de la famille de « ${esc(q.base)} ».</div>` : ''}`, 'Quel mot n\'est pas de la même famille ?');
                }).join('') + `</div>`;
            }
            if (R.type === 'decoupe') {
                return `<div class="fd-grid">` + R.qs.map((q, i) => {
                    const e = entry(q), w = e.w;
                    const mine = (R.ans[i] || '').split(',').filter(Boolean).map(Number);
                    const good = cutsOf(e).split(',').filter(Boolean).map(Number);
                    let h = `<div class="fd-cut">`;
                    for (let k = 0; k < w.length; k++) {
                        if (k > 0) {
                            let c = mine.indexOf(k) !== -1 ? 'on' : '';
                            if (R.corrected) { if (c && good.indexOf(k) === -1) c = 'ko'; else if (!c && good.indexOf(k) !== -1) c = 'miss'; }
                            h += `<span class="gap ${c}"${R.corrected ? '' : ` data-act="cut" data-i="${i}" data-k="${k}"`}></span>`;
                        }
                        h += `<span class="let">${esc(w[k])}</span>`;
                    }
                    h += `</div>`;
                    if (R.corrected) h += `<div class="fd-sol">${colored(e, true)}</div>`;
                    return card(R, i, h, 'Coupe entre le préfixe, le radical et le suffixe');
                }).join('') + `</div>`;
            }
            if (R.type === 'construis') {
                return `<div class="fd-grid wide">` + R.qs.map((q, i) => {
                    const e = entry(q), a = R.ans[i] || {};
                    const F = FAMS[q.fi];
                    const b = (kind, id, on) => `<button class="fd-brick ${kind === 'suf' && id && isEnd(id) ? 'end' : (id ? kind : 'none')} ${on ? 'on' : ''}"${R.corrected ? '' : ` data-act="cbrick" data-i="${i}" data-k="${kind}" data-v="${id}"`}>${id ? esc(brickLabel(kind, id)) : '∅'}</button>`;
                    const pres = `<div class="col">${b('pre', '', !a.p)}${q.pres.map(id => b('pre', id, a.p === id)).join('')}</div>`;
                    const sufs = `<div class="col">${b('suf', '', !a.s)}${q.sufs.map(id => b('suf', id, a.s === id)).join('')}</div>`;
                    const got = F.map[(a.p || '') + '|' + (a.s || '')];
                    let prev;
                    if (!a.p && !a.s) prev = `<span class="fd-hint">Choisis tes briques…</span>`;
                    else if (got) prev = colored(got);
                    else prev = `<span class="fd-word bad">${esc(naive(a.p, q.fi, a.s))}</span>`;
                    let h = `<div class="fd-qdef">« ${esc(e.def)} »</div><div class="fd-mini">${pres}<div class="col"><span class="fd-brick rad">${esc(F.r)}</span></div>${sufs}</div><div class="fd-preview">${prev}</div>`;
                    if (R.corrected && !isRight(R, q, i)) h += `<div class="fd-sol">→ ${colored(e, true)}</div>`;
                    return card(R, i, h, 'Construis le mot qui correspond');
                }).join('') + `</div>`;
            }
            // Sens
            return `<div class="fd-grid wide">` + R.qs.map((q, i) => {
                const e = entry(q), a = R.ans[i];
                const btns = q.opts.map(v => {
                    let c = a === v ? 'on' : '';
                    if (R.corrected) c = v === q.good ? 'good' : (a === v ? 'bad' : '');
                    return `<button class="fd-choice ${c}" style="--c:${q.on === 'pre' ? '#2F80ED' : '#22A35A'}" data-act="ans" data-i="${i}" data-v="${esc(v)}">${esc(v)}</button>`;
                }).join('');
                const aff = q.on === 'pre' ? `le préfixe <b style="color:#2F80ED">${esc(e.pre)}-</b>` : `le suffixe <b style="color:#22A35A">-${esc(e.suf)}</b>`;
                return card(R, i, `<div class="fd-qmain">${colored(e)}</div><div class="fd-qdef" style="font-size:15px">Dans ce mot, ${aff} veut dire :</div><div class="fd-choices">${btns}</div>${R.corrected ? `<div class="fd-why">📖 ${esc(e.def)}</div>` : ''}`, 'Le sens du ' + (q.on === 'pre' ? 'préfixe' : 'suffixe'));
            }).join('') + `</div>`;
        }
        function renderTri(R) {
            const COLS = ['#E8862A', '#2F80ED', '#22A35A', '#9B51E0'];
            const chip = (w, i) => {
                let c = R.sel === i ? 'sel' : '';
                if (R.corrected && R.place[i] !== undefined) c = R.place[i] === w.g ? 'ok' : 'ko';
                return `<button class="fd-wchip ${c}"${R.corrected ? '' : ` data-act="tw" data-i="${i}"`}>${esc(w.w)}</button>`;
            };
            const pool = R.corrected ? '' : R.words.map((w, i) => R.place[i] === undefined ? chip(w, i) : '').join('');
            let h = `<div class="fd-say">${R.corrected ? '🗂️ En rouge : mots mal rangés. En gris : mots qui manquaient dans la famille.' : R.sel !== null && R.sel !== undefined ? '👉 Touche maintenant la famille où ranger ce mot.' : '👆 Touche un mot, puis touche la famille où il faut le ranger.'}</div>`;
            if (!R.corrected) h += `<div class="fd-pool">${pool || '<span class="fd-hint">Tous les mots sont rangés : clique sur 👁 Correction !</span>'}</div>`;
            h += `<div class="fd-cols">` + R.groups.map((b, gi) => {
                const ws = R.words.map((w, i) => R.place[i] === gi ? chip(w, i) : '').join('');
                const target = !R.corrected && R.sel !== null && R.sel !== undefined;
                let missing = '';
                if (R.corrected) missing = R.words.filter((w, i) => w.g === gi && R.place[i] !== gi).map(w => `<span class="fd-wchip" style="opacity:.5">${esc(w.w)}</span>`).join('');
                return `<div class="fd-colbox ${target ? 'target' : ''}" style="--c:${COLS[gi % 4]}"${target ? ` data-act="tc" data-g="${gi}"` : ''}><h4>Famille de « ${esc(b)} »</h4><div class="wl">${ws}${missing}</div></div>`;
            }).join('') + `</div>`;
            return h;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            let h = `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += `<div class="fd-topbar"><span class="fd-pill">${EXT[R.type].label} · ${R.type === 'tri' ? R.words.length + ' mots' : R.qs.length + ' questions'}</span>
                ${sc ? `<span class="fd-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="fd-actions">
                <button class="fd-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="fd-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="fd-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += R.type === 'tri' ? renderTri(R) : renderQuestions(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="fd-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!msg) h += `<div class="fd-info">Choisis l'exercice et ses réglages, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.fd-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
            const sb = container.querySelector('[data-act="sound"]');
            sb.textContent = S.sound ? '🔊' : '🔇'; sb.title = S.sound ? 'Couper le son' : 'Activer le son';
            const top = body.scrollTop;
            body.innerHTML = S.tab === 'train' ? renderTrain() : S.tab === 'atelier' ? renderAtelier() : renderLesson();
            body.scrollTop = top;
            dropKind = '';
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const cols = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6'];
            for (let i = 0; i < 30; i++) {
                const c = document.createElement('i');
                c.className = 'fd-confetti';
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = cols[Math.floor(Math.random() * cols.length)];
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                container.appendChild(c);
                setTimeout(() => c.remove(), 2200);
            }
        }

        // ── Actions ──
        function act(a, el) {
            const R = S.run, ex = S.ex, A = S.at;
            switch (a) {
                case 'help': help.classList.toggle('show'); return;
                case 'sound': S.sound = !S.sound; break;
                case 'min':
                    container.classList.remove('wf-fullboard');
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🧱 Familles de mots', { onExpand: render });
                    return;
                case 'max': container.classList.toggle('wf-fullboard'); save(); return;
                case 'close':
                    if (canSpeak) window.speechSynthesis.cancel();
                    if (typeof snapshotNow === 'function') snapshotNow();
                    widget.remove(); save(); return;
                case 'tab': S.tab = el.dataset.tab; body.scrollTop = 0; break;
                case 'lesson': S.lesson = el.dataset.g; body.scrollTop = 0; break;
                case 'viewfam': S.viewFam = el.dataset.v; break;
                case 'practice':
                    ex.type = el.dataset.v; S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                // Atelier
                case 'brick': {
                    const k = el.dataset.k, v = el.dataset.v;
                    if (k === 'pre') A.p = A.p === v ? '' : v;
                    else if (k === 'rad') { A.r = +v; A.showAll = false; }
                    else A.s = A.s === v ? '' : v;
                    A.res = null; dropKind = k === 'end' ? 'suf' : k; sfx('clic');
                    break;
                }
                case 'unslot': {
                    const k = el.dataset.k;
                    if (k === 'pre') A.p = ''; else if (k === 'suf') A.s = ''; else return;
                    A.res = null; sfx('pop');
                    break;
                }
                case 'clear-at': A.p = ''; A.s = ''; A.res = null; break;
                case 'check-at': checkAtelier(); break;
                case 'say-at': { const e = A.res && A.res.ok && FAMS[A.r].map[A.res.key]; if (e) speak(e.w + '. ' + e.def); return; }
                case 'showall': A.showAll = !A.showAll; break;
                // Exercices
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'n': ex.n = +el.dataset.v; break;
                case 'nf': ex.nf = +el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'clear':
                    if (!R) return;
                    if (R.type === 'tri') { R.place = {}; R.sel = null; } else R.ans = [];
                    R.corrected = false;
                    break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected;
                    if (R.corrected) {
                        R.sel = null;
                        const sc = scoreOf(R);
                        if (sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'ans':
                    if (!R || R.corrected) return;
                    R.ans[+el.dataset.i] = el.dataset.v; sfx('pop');
                    break;
                case 'cut': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, k = +el.dataset.k;
                    let cuts = (R.ans[i] || '').split(',').filter(Boolean).map(Number);
                    if (cuts.indexOf(k) !== -1) cuts = cuts.filter(x => x !== k);
                    else { cuts.push(k); if (cuts.length > 2) cuts.shift(); }
                    R.ans[i] = cuts.sort((x, y) => x - y).join(',');
                    sfx('pop');
                    break;
                }
                case 'cbrick': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i, a2 = Object.assign({}, R.ans[i] || {});
                    a2[el.dataset.k === 'pre' ? 'p' : 's'] = el.dataset.v;
                    R.ans[i] = a2; sfx('clic');
                    break;
                }
                case 'tw': {
                    if (!R || R.corrected) return;
                    const i = +el.dataset.i;
                    if (R.place[i] !== undefined) { delete R.place[i]; R.sel = null; }
                    else R.sel = R.sel === i ? null : i;
                    sfx('pop');
                    break;
                }
                case 'tc':
                    if (!R || R.corrected || R.sel === null || R.sel === undefined) return;
                    R.place[R.sel] = +el.dataset.g; R.sel = null; sfx('clic');
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
            if (e.target.closest('.fd-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.fd-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });
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
        widget._fdGetData = function () {
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

    // Accès aux données (tests)
    window._fdData = { FAMS, ALL, PRE, SUF, END, INTRUS };

    // =====================================================================
    // HOOK dans createWidget
    // =====================================================================
    function install(orig) {
        window.createWidget = function (type) {
            if (type === TYPE) return window.createFamillesDerivationWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
