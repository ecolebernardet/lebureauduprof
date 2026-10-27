// =========================================================================
// ACTIVITÉ « LES FONCTIONS » — Le Bureau du Prof
// Leçons + exercices corrigés (même présentation que « La conjugaison »).
//
// Fonctions travaillées (à cocher / décocher) :
//   sujet · COD · COI · complément circonstanciel (CC) · attribut du sujet ·
//   complément du nom (CDN)
// Le verbe est toujours montré comme repère.
//
// 📖 Leçons : vue d'ensemble (phrase en couleurs à faire défiler, couleurs
//    à cacher), puis une leçon par fonction.
// ✏️ Exercices :
//    🎯 Trouver la fonction : un groupe souligné, choisir sa fonction.
//    🔍 La chasse aux fonctions : toucher le(s) groupe(s) d'une fonction.
//    🏷️ Étiqueter la phrase : donner sa fonction à chaque groupe.
//    Bouton Correction avec score.
//
// Ouverture : createWidget('fonctions')  ou  createFonctionsWidget()
// Sauvegarde : w._fnGetData()  /  createFonctionsWidget(données)
// =========================================================================

(function () {
    'use strict';

    const TYPE = 'fonctions';

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

    // ── CSS (préfixe f2-) ─────────────────────────────────────────────────
    if (!document.getElementById('f2-style')) {
        const s = document.createElement('style');
        s.id = 'f2-style';
        s.textContent = `
.widget[data-type="fonctions"] { min-width:unset; background:transparent !important; border:none !important; box-shadow:none !important; }
.f2-container {
    --encre:#2A1F4A; --or:#FFC933; --vert:#2FBF71; --rouge:#FF4F5E; --violet:#6C4FD8; --creme:#FFF8EC;
    position:relative; width:1000px; height:680px; min-width:480px; min-height:400px; box-sizing:border-box;
    display:flex; flex-direction:column; overflow:hidden; user-select:none;
    background:var(--creme); border-radius:22px; border:3px solid var(--encre);
    box-shadow:0 7px 0 #16102B, 0 14px 34px rgba(20,10,50,.3);
    font-family:'Nunito','Segoe UI',system-ui,sans-serif; color:var(--encre);
}
.f2-container.wf-fullboard { position:fixed !important; inset:0 !important; width:100% !important; height:100% !important;
    z-index:9999 !important; border-radius:0 !important; border:none !important; padding-left:60px !important; }
@media (max-width:768px), (max-height:500px) and (pointer:coarse) {
    .f2-container.wf-fullboard { left:40px !important; width:calc(100vw - 40px) !important; height:100dvh !important; min-width:0 !important; padding-left:0 !important; }
    .f2-tab-lbl { display:none; }
    .f2-title { font-size:17px !important; }
    .f2-lesson { flex-direction:column; }
    .f2-side { flex-direction:row !important; flex-wrap:wrap; width:auto !important; }
    .f2-gbtn { flex:1 1 auto; text-align:center !important; }
    .f2-srow > .l { min-width:0 !important; width:100%; }
}
.f2-header { display:flex; align-items:center; gap:10px; padding:10px 14px 8px; background:var(--encre); flex-shrink:0; flex-wrap:wrap; }
.f2-title { font-size:22px; font-weight:900; color:var(--or); text-shadow:0 2px 0 #B3470F; white-space:nowrap; pointer-events:none; letter-spacing:.3px; }
.f2-tabs { display:flex; gap:6px; margin-left:12px; }
.f2-tab { border:2px solid rgba(255,255,255,.25); background:transparent; color:#fff; border-radius:999px; padding:5px 14px;
    font:inherit; font-weight:900; font-size:14px; touch-action:manipulation; display:flex; gap:6px; align-items:center; }
.f2-tab:hover { background:rgba(255,255,255,.1); }
.f2-tab.active { background:var(--or); border-color:var(--or); color:var(--encre); }
.f2-icon-btn { width:26px; height:26px; border-radius:50%; border:none; padding:0; background:rgba(255,255,255,.14);
    color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; }
.f2-icon-btn:hover { background:rgba(255,255,255,.28); }
.f2-body { flex:1; min-height:0; overflow:auto; position:relative; }

/* ── Leçons ── */
.f2-lesson { display:flex; gap:14px; padding:14px; min-height:100%; box-sizing:border-box; }
.f2-side { width:200px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; }
.f2-gbtn { border:2px solid #e3d8c3; border-left:7px solid var(--c,#e3d8c3); background:#fff; border-radius:12px; padding:8px 10px; font:inherit; font-weight:900; font-size:15px;
    color:var(--encre); text-align:left; touch-action:manipulation; transition:transform .1s; }
.f2-gbtn:hover { transform:translateX(2px); }
.f2-gbtn.active { background:var(--c,var(--violet)); border-color:var(--c,var(--violet)); color:#fff; box-shadow:0 3px 0 rgba(0,0,0,.18); }
.f2-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
.f2-ltitle h2 { margin:0; font-size:32px; font-weight:900; }
.f2-box { border-radius:14px; padding:10px 14px; font-size:15px; line-height:1.5; }
.f2-box b.t { display:block; font-size:15px; margin-bottom:2px; }
.f2-box ul { margin:4px 0 0; padding-left:20px; }
.f2-what { background:#f1edff; border:2px solid #c8bbf5; }
.f2-test { background:#e8f4ff; border:2px solid #a9d1f5; }
.f2-memo { background:#fff6d6; border:2px solid #f3d36b; }
.f2-trap { background:#ffecee; border:2px solid #f6a7b0; }
.f2-tool { background:#e9f8f0; border:2px solid #8fd8b0; }
.f2-legend { display:flex; flex-wrap:wrap; gap:8px; }
.f2-ltag { background:var(--c); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; border:none; }
.f2-q-ask { display:inline-block; background:var(--c); color:#fff; border-radius:10px; padding:2px 10px; font-weight:900; margin:2px 0; }
.f2-sentence { font-family:'MDI',cursive; font-size:22px; line-height:1.9; }
.f2-sentence .hl { color:var(--c); font-weight:700; border-bottom:4px solid var(--c); }
/* Phrase découpée en groupes */
.f2-gs { display:flex; flex-wrap:wrap; gap:8px 6px; align-items:flex-start; justify-content:center; font-family:'MDI',cursive; font-size:var(--f, 26px); }
.f2-blk { display:inline-flex; flex-direction:column; align-items:center; border:3px solid var(--c,#d9cdb6); border-radius:12px; background:#fff;
    padding:.1em .35em .05em; touch-action:manipulation; font:inherit; color:var(--encre); }
.f2-blk .w { display:inline-flex; gap:.25em; align-items:baseline; flex-wrap:wrap; justify-content:center; }
.f2-blk small { font-family:'Nunito',sans-serif; font-size:12px; font-weight:900; color:var(--c,#b8ad96); text-transform:uppercase; line-height:1.3; }
.f2-blk.plain { border-color:#e3d8c3; }
.f2-blk.plain small { visibility:hidden; }
.f2-blk.off { border-style:dashed; border-color:#d9cdb6; background:#f7f4ee; color:#9a8f7a; }
.f2-blk.off small { color:#b8ad96; }
.f2-blk.ok { box-shadow:0 0 0 4px #bfe9d1; }
.f2-blk.ko { box-shadow:0 0 0 4px #f8c3c9; }
.f2-cdn { display:inline-flex; flex-direction:column; align-items:center; border:2px dashed var(--c,#c9a2b8); border-radius:9px; padding:0 .2em; background:#fff7fb; }
.f2-cdn small { font-size:10.5px; }
.f2-cdn.plain { border-color:#e3d8c3; background:transparent; }
.f2-cdn.ok { box-shadow:0 0 0 3px #bfe9d1; }
.f2-cdn.ko { box-shadow:0 0 0 3px #f8c3c9; }
.f2-exp { font-family:'Nunito',sans-serif; font-size:11px; font-weight:900; color:#178a4b; }
.f2-loose { align-self:center; color:#9a8f7a; }
.f2-btn { border:none; border-radius:14px; padding:10px 18px; font:inherit; font-weight:900; font-size:16px;
    touch-action:manipulation; background:var(--violet); color:#fff; box-shadow:0 4px 0 #4a34a3; transition:transform .08s; }
.f2-btn:active { transform:translateY(3px); box-shadow:0 1px 0 #4a34a3; }
.f2-btn.go { background:var(--vert); box-shadow:0 4px 0 #1e8a50; }
.f2-btn.alt { background:#fff; color:var(--encre); border:2px solid #d9cdb6; box-shadow:0 4px 0 #e3d8c3; }
.f2-btn.small { font-size:13px; padding:6px 12px; border-radius:11px; }

/* ── Exercices ── */
.f2-train { padding:12px 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.f2-settings { background:#fff; border:2px solid #e3d8c3; border-radius:16px; padding:10px 12px; display:flex; flex-direction:column; gap:9px; }
.f2-srow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.f2-srow > .l { font-weight:900; font-size:13px; margin-right:4px; min-width:120px; }
.f2-chip { border:2px solid var(--c,#d9cdb6); background:#fff; border-radius:999px; padding:4px 11px; font:inherit; font-weight:800; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.f2-chip.on { background:var(--c,var(--encre)); border-color:var(--c,var(--encre)); color:#fff; }
.f2-hint { font-size:12.5px; color:#6a6380; }
.f2-msg { background:#ffe9eb; border:2px solid #f6a7b0; border-radius:12px; padding:8px 12px; font-weight:800; }
.f2-info { background:#fff6d6; border:2px solid #f3d36b; border-radius:12px; padding:10px 14px; font-weight:700; text-align:center; }
.f2-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center; }
.f2-pill { background:var(--encre); color:#fff; border-radius:999px; padding:4px 12px; font-weight:900; font-size:14px; white-space:nowrap; }
.f2-pill.score { background:var(--vert); font-size:16px; }
.f2-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.f2-grid { --gap:calc(var(--f) * .55); display:grid; row-gap:var(--gap); column-gap:var(--gap);
    grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - 2 * var(--gap)) / 3), min(100%, 290px)),1fr)); }
.f2-grid.wide { grid-template-columns:repeat(auto-fill,minmax(max(calc((100% - var(--gap)) / 2), min(100%, 360px)),1fr)); }
.f2-grid.one { grid-template-columns:1fr; }
.f2-q { background:#fff; border:2px solid #e3d8c3; border-radius:14px; padding:calc(var(--f) * .4) calc(var(--f) * .6) calc(var(--f) * .5); box-shadow:0 3px 0 rgba(42,31,74,.08); }
.f2-q.ok { border-color:var(--vert); background:#f3fcf7; }
.f2-q.ko { border-color:var(--rouge); background:#fff5f6; }
.f2-qtop { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px; font-size:14px; font-weight:800; color:#5a5470; }
.f2-num { font-weight:900; color:#9a8f7a; }
.f2-qsent { font-family:'MDI',cursive; font-size:calc(var(--f) * .85); line-height:1.6; text-align:center; margin-bottom:calc(var(--f) * .3); }
.f2-qsent .target { font-weight:700; color:var(--violet); border-bottom:4px solid var(--violet); padding:0 2px; }
.f2-choices { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.f2-choice { border:2px solid var(--c); background:#fff; border-radius:999px; padding:3px 10px; font:inherit; font-weight:900; font-size:13.5px;
    color:var(--encre); touch-action:manipulation; }
.f2-choice.on { background:var(--c); color:#fff; }
.f2-choice.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.f2-choice.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.f2-hunt { display:flex; flex-wrap:wrap; gap:calc(var(--f) * .2); justify-content:center; align-items:center; font-family:'MDI',cursive; font-size:var(--f); }
.f2-hw { border:2px solid #e3d8c3; border-radius:10px; padding:0 .25em; font:inherit; color:var(--encre); background:#fff; touch-action:manipulation; }
.f2-hw:hover { background:#f6f2ff; }
.f2-hw.on { background:var(--c); border-color:var(--c); color:#fff; }
.f2-hw.good { background:var(--vert); border-color:var(--vert); color:#fff; }
.f2-hw.bad { background:var(--rouge); border-color:var(--rouge); color:#fff; }
.f2-hw.miss { border-color:#e67e22; border-style:dashed; color:#c25a00; }
.f2-confetti { position:absolute; top:-10px; width:9px; height:14px; border-radius:2px; pointer-events:none; z-index:30; animation:f2-fall 1.6s ease-in forwards; }
@keyframes f2-fall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(560px) rotate(540deg); opacity:0; } }
.f2-help { display:none; position:absolute; top:50px; right:12px; z-index:40; width:400px; max-width:calc(100% - 24px); max-height:calc(100% - 70px); overflow:auto;
    background:#fff; color:#3d3654; border:2px solid var(--encre); border-radius:14px; box-shadow:0 10px 26px rgba(0,0,0,.25); padding:12px 14px; font-size:13px; line-height:1.55; }
.f2-help.show { display:block; }
.f2-help h4 { margin:0 0 6px; font-size:15px; }
.f2-help p { margin:0 0 6px; }
.f2-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; z-index:35; opacity:0; transition:opacity .2s;
    background:linear-gradient(135deg,transparent 50%,#9a8f7a 50%); border-radius:0 0 18px 0; touch-action:none; }
.f2-container:hover .f2-resize { opacity:1; }
.f2-container.wf-fullboard .f2-resize { display:none; }
/* Curseur : la flèche partout, la main sur la barre du haut (déplacement) */
.widget[data-type="fonctions"], .f2-container, .f2-container * { cursor:default !important; }
.f2-container .f2-header { cursor:grab !important; }
.f2-container .f2-header:active { cursor:grabbing !important; }
/* Le doigt qui clique sur tout ce qui est cliquable */
.f2-container button, .f2-container [data-act],
.f2-container .f2-header button { cursor:pointer !important; }
.f2-container button:disabled { cursor:default !important; }
.f2-container .f2-resize { cursor:se-resize !important; }
`;
        document.head.appendChild(s);
    }

    // =====================================================================
    // DONNÉES
    // =====================================================================
    const ORDER = ['S', 'COD', 'COI', 'CC', 'ATT', 'CDN'];
    const F = {
        S:   { label: 'Sujet',                     short: 'sujet', find: 'le sujet',                          color: '#EB5757', ico: '👤' },
        V:   { label: 'Verbe',                     short: 'verbe', find: 'le verbe',                          color: '#27AE60', ico: '⚡' },
        COD: { label: 'COD',                       short: 'COD',   find: 'le COD',                            color: '#2F80ED', ico: '🎯' },
        COI: { label: 'COI',                       short: 'COI',   find: 'le COI',                            color: '#9B51E0', ico: '🔗' },
        CC:  { label: 'Complément circonstanciel', short: 'CC',    find: 'les compléments circonstanciels (CC)', color: '#F2994A', ico: '🧭' },
        ATT: { label: 'Attribut du sujet',         short: 'attribut', find: 'l\'attribut du sujet',           color: '#0E9AA7', ico: '🪞' },
        CDN: { label: 'Complément du nom',         short: 'CDN',   find: 'les compléments du nom',            color: '#C2185B', ico: '🧩' }
    };
    const chipLabel = k => k === 'CC' ? 'CC' : k === 'ATT' ? 'Attribut' : k === 'CDN' ? 'Compl. du nom' : F[k].label;

    // Phrases : [groupe]FONCTION ; {…} = complément du nom à l'intérieur d'un groupe
    const BANK_RAW = [
        '[Le chat]S [dort]V [sur le canapé]CC .',
        '[Les enfants]S [mangent]V [une glace]COD .',
        '[Ma sœur]S [téléphone]V [à sa copine]COI .',
        '[Le ciel]S [est]V [bleu]ATT .',
        '[Le livre {de Paul}]S [est]V [passionnant]ATT .',
        '[Demain]CC , [nous]S [irons]V [à la piscine]CC .',
        '[Tom]S [range]V [ses jouets]COD [dans sa chambre]CC .',
        '[Le facteur]S [apporte]V [une lettre]COD [à mes parents]COI .',
        '[La maîtresse]S [parle]V [de la sortie {au musée}]COI .',
        '[Mon frère]S [deviendra]V [pilote]ATT .',
        '[Le soir]CC , [je]S [lis]V [une histoire]COD .',
        '[Les oiseaux]S [chantent]V [dans les arbres {du jardin}]CC .',
        '[Léa]S [semble]V [fatiguée]ATT .',
        '[Nous]S [pensons]V [à nos vacances]COI .',
        '[Le boulanger]S [prépare]V [le pain]COD [chaque matin]CC .',
        '[La porte {du garage}]S [est]V [ouverte]ATT .',
        '[Les élèves]S [écoutent]V [la maîtresse]COD [attentivement]CC .',
        '[Mon grand-père]S [raconte]V [des histoires {de pirates}]COD .',
        '[Pendant la récréation]CC , [les enfants]S [jouent]V [au ballon]COI .',
        '[Le chien {de mon voisin}]S [aboie]V [toute la nuit]CC .',
        '[Tu]S [ressembles]V [à ton père]COI .',
        '[Ces fleurs]S [restent]V [fraîches]ATT [longtemps]CC .',
        '[Julie]S [cherche]V [son cahier {de poésie}]COD .',
        '[Le train {pour Paris}]S [partira]V [à huit heures]CC .',
        '[Les pompiers]S [ont éteint]V [le feu]COD [rapidement]CC .',
        '[Ma cousine]S [est]V [une excellente nageuse]ATT .',
        '[Paul]S [obéit]V [à ses parents]COI .',
        '[Le vent]S [souffle]V [fort]CC .',
        '[Les vaches]S [mangent]V [l\'herbe {du pré}]COD .',
        '[À la montagne]CC , [il]S [neige]V [souvent]CC .',
        '[Mon père]S [lave]V [la voiture]COD [dans la cour]CC .',
        '[Ce gâteau {au chocolat}]S [paraît]V [délicieux]ATT .',
        '[Je]S [parle]V [à mon amie]COI [au téléphone]CC .',
        '[Le lion]S [chasse]V [une gazelle]COD .',
        '[La tour Eiffel]S [est]V [un monument {de Paris}]ATT .',
        '[Les feuilles {des arbres}]S [tombent]V [en automne]CC .',
        '[Léo et Lina]S [construisent]V [une cabane]COD .',
        '[Sous le lit]CC , [le chat]S [cache]V [sa souris {en peluche}]COD .',
        '[Le maître]S [donne]V [des exercices]COD [aux élèves]COI .',
        '[Mes amis]S [sont]V [contents]ATT .',
        '[Le petit garçon]S [a perdu]V [sa casquette]COD [au parc]CC .',
        '[Ce matin]CC , [la neige]S [recouvre]V [les toits {de la ville}]COD .'
    ];
    function parseF(str) {
        const out = [], re = /\[([^\]]+)\](S|V|COD|COI|CC|ATT)|(\S+)/g;
        let m;
        while ((m = re.exec(str))) {
            if (m[1] !== undefined) {
                const parts = [];
                m[1].split(/(\{[^}]+\})/).forEach(p => {
                    p = p.trim();
                    if (!p) return;
                    if (p[0] === '{') parts.push({ t: p.slice(1, -1), cdn: true });
                    else parts.push({ t: p, cdn: false });
                });
                out.push({ f: m[2], parts });
            } else out.push({ f: null, loose: true, parts: [{ t: m[3], cdn: false }] });
        }
        return out;
    }
    const BANK = BANK_RAW.map(parseF);
    const gText = g => g.parts.map(p => p.t).join(' ');
    const hasCdn = s => s.some(g => g.parts.some(p => p.cdn));
    // Assemble les groupes (pas d'espace avant . et ,)
    function joinG(groups, fn) {
        return groups.map((g, i) => (i === 0 || (g.loose && /^[.,]$/.test(g.parts[0].t)) ? '' : ' ') + fn(g, i)).join('');
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    // Leçons
    const LESSONS = {
        S: {
            title: 'Le sujet',
            what: `Le <b>sujet</b> indique <b>qui fait l'action</b> du verbe, ou <b>de qui (de quoi) on parle</b>. C'est lui qui <b>commande l'accord du verbe</b>.`,
            ask: `Qui est-ce qui … ?  /  Qu'est-ce qui … ?`,
            tests: [`J'encadre le groupe par <b>« C'est … qui »</b> : <i>C'est le chat qui dort.</i>`,
                    `Je peux le remplacer par un <b>pronom</b> : il, elle, ils, elles (<i>Le chat dort → Il dort</i>).`,
                    `Le sujet peut être un groupe nominal (<i>le petit chat</i>), un nom propre (<i>Tom</i>) ou un pronom (<i>nous</i>).`],
            memo: `Pour trouver le sujet, je trouve d'abord le <b>verbe</b>, puis je pose la question « Qui est-ce qui + verbe ? ».`,
            trap: `Le sujet n'est pas toujours au début de la phrase : <i>Demain, <b>nous</b> irons à la piscine.</i> Il peut même être après le verbe : <i>Où vas-<b>tu</b> ?</i>`
        },
        COD: {
            title: 'Le complément d\'objet direct (COD)',
            what: `Le <b>COD</b> complète le <b>verbe</b>. Il est relié au verbe <b>directement</b>, <b>sans préposition</b>.`,
            ask: `sujet + verbe + qui ? / quoi ?`,
            tests: [`On ne peut <b>ni le supprimer ni le déplacer</b> (en général) : <i>Tom range <s>ses jouets</s>…</i> ✗`,
                    `Je peux le remplacer par <b>le, la, l', les</b> placé devant le verbe : <i>Tom range ses jouets → Tom <b>les</b> range.</i>`],
            memo: `COD = Complément d'Objet <b>Direct</b> : « direct » parce qu'il n'y a <b>pas de petit mot</b> (à, de…) entre le verbe et lui.`,
            trap: `Ne le confonds pas avec le sujet : le COD est (presque toujours) <b>après</b> le verbe et il ne commande pas l'accord du verbe.`
        },
        COI: {
            title: 'Le complément d\'objet indirect (COI)',
            what: `Le <b>COI</b> complète aussi le <b>verbe</b>, mais il est relié au verbe <b>indirectement</b>, par une <b>préposition</b> : <b>à</b>, <b>de</b> (au, aux, du, des…).`,
            ask: `sujet + verbe + à qui ? à quoi ? de qui ? de quoi ?`,
            tests: [`On ne peut <b>ni le supprimer ni le déplacer</b>.`,
                    `Je peux le remplacer par <b>lui, leur, en, y</b> : <i>Paul obéit à ses parents → Paul <b>leur</b> obéit.</i>`],
            memo: `Quand il y a déjà un COD, le COI s'appelle aussi <b>COS</b> (complément d'objet second) : <i>Le facteur apporte une lettre <b>à mes parents</b>.</i>`,
            trap: `<i>« à la piscine »</i> répond à « <b>où ?</b> » : c'est un <b>CC de lieu</b>, pas un COI. On le voit car on peut le déplacer : <i>À la piscine, nous irons.</i>`
        },
        CC: {
            title: 'Le complément circonstanciel (CC)',
            what: `Le <b>CC</b> donne des précisions sur les <b>circonstances</b> de l'action : le <b>lieu</b>, le <b>temps</b>, la <b>manière</b> (et aussi la cause, le but…).`,
            ask: `Où ? (lieu) · Quand ? (temps) · Comment ? (manière)`,
            tests: [`On peut le <b>déplacer</b> : <i>Le chat dort sur le canapé → Sur le canapé, le chat dort.</i>`,
                    `On peut le <b>supprimer</b> : la phrase reste correcte (<i>Le chat dort.</i>).`],
            memo: `CC = <b>déplaçable</b> et <b>supprimable</b>. Une phrase peut avoir <b>plusieurs CC</b> : <i>Ce matin, la neige tombe sur la ville.</i>`,
            trap: `Un CC peut être un seul mot (un adverbe) : <i>Le vent souffle <b>fort</b>. Il neige <b>souvent</b>.</i>`
        },
        ATT: {
            title: 'L\'attribut du sujet',
            what: `L'<b>attribut du sujet</b> donne une <b>qualité</b>, une <b>caractéristique</b> du sujet. Il est relié au sujet par un <b>verbe d'état</b>.`,
            ask: `Les verbes d'état : être, paraître, sembler, devenir, rester, demeurer, avoir l'air`,
            tests: [`Je peux remplacer le verbe par <b>être</b> : <i>Léa semble fatiguée → Léa est fatiguée.</i>`,
                    `S'il est un adjectif, il <b>s'accorde avec le sujet</b> : <i>Ces fleurs restent fraîch<b>es</b>.</i>`],
            memo: `L'attribut et le sujet parlent de la <b>même personne</b> ou de la <b>même chose</b> : <i>Ma cousine = une excellente nageuse.</i>`,
            trap: `Après « être », tout n'est pas attribut : <i>Le chat est <b>sur le canapé</b></i> répond à « où ? » : c'est un CC de lieu.`
        },
        CDN: {
            title: 'Le complément du nom',
            what: `Le <b>complément du nom</b> <b>complète un nom</b> pour le préciser. Il fait partie du <b>groupe nominal</b>.`,
            ask: `nom + de / à / en / pour / sans… + nom`,
            tests: [`Il est presque toujours introduit par une <b>préposition</b> : <i>le livre <b>de</b> Paul, un gâteau <b>au</b> chocolat, une souris <b>en</b> peluche.</i>`,
                    `On peut le <b>supprimer</b>, mais pas le déplacer tout seul : il reste <b>collé à son nom</b>.`],
            memo: `Le complément du nom est rangé <b>à l'intérieur</b> d'un autre groupe : dans un sujet, un COD, un CC… <i>[Le chien <b>de mon voisin</b>] aboie.</i>`,
            trap: `Ne le confonds pas avec un COI : dans <i>la sortie <b>au musée</b></i>, « au musée » complète le <b>nom</b> « sortie », pas le verbe.`
        }
    };

    // ── Utilitaires ───────────────────────────────────────────────────────
    function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    const pick = a => a[Math.floor(Math.random() * a.length)];

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
            ex: { type: 'quiz', fns: ['S', 'COD', 'CC'], nq: 9, nh: 4, target: 'random', nl: 2 },
            font: 30, sound: true, settingsOpen: true,
            run: null
        };
    }

    // =====================================================================
    // CRÉATION DU WIDGET
    // =====================================================================
    window.createFonctionsWidget = function (saved) {
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
        container.className = 'f2-container';
        container.innerHTML = `
            <div class="f2-header">
                <span class="f2-title">🧭 Les fonctions</span>
                <div class="f2-tabs">
                    <button class="f2-tab" data-act="tab" data-tab="lecon"><span>📖</span><span class="f2-tab-lbl">Leçons</span></button>
                    <button class="f2-tab" data-act="tab" data-tab="train"><span>✏️</span><span class="f2-tab-lbl">Exercices</span></button>
                </div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="f2-icon-btn" data-act="sound" title="Son"></button>
                    <button class="f2-icon-btn" data-act="help" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-act="min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-act="max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-act="close" title="Fermer"></button>
                </div>
            </div>
            <div class="f2-body"></div>
            <div class="f2-help">
                <h4>💡 Comment utiliser cette activité ?</h4>
                <p><b>📖 Leçons</b> — « Les fonctions » explique la différence entre nature et fonction, avec une phrase découpée en groupes colorés (◀ ▶ pour changer de phrase, 🙈 pour cacher les couleurs et faire chercher la classe). Puis une leçon par fonction : la question à poser, les tests, une astuce et un piège.</p>
                <p><b>✏️ Exercices</b> — Commence par cocher les <b>fonctions travaillées</b> (par exemple seulement le sujet et le COD). Les autres groupes ne sont pas demandés.</p>
                <p>🎯 <b>Trouver la fonction</b> : un groupe est souligné, on choisit sa fonction.</p>
                <p>🔍 <b>La chasse aux fonctions</b> : on touche le ou les groupes demandés (ex. : le sujet).</p>
                <p>🏷️ <b>Étiqueter la phrase</b> : on touche chaque groupe pour lui donner sa fonction (chaque toucher passe à la fonction suivante). Le verbe est déjà indiqué. Les compléments du nom sont dans un petit cadre à l'intérieur de leur groupe.</p>
                <p><b>👁 Correction</b> colorie les réponses et donne le score.</p>
            </div>
            <div class="f2-resize" title="Redimensionner"></div>`;
        widget.appendChild(container);

        const body = container.querySelector('.f2-body');
        const help = container.querySelector('.f2-help');
        const resizeHandle = container.querySelector('.f2-resize');

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
        const sfx = k => { if (S.sound && SFX[k]) SFX[k](); };
        const active = () => ORDER.filter(k => S.ex.fns.includes(k));

        // ── Génération d'un exercice ──
        function genRun() {
            const ex = S.ex, A = active();
            if (ex.type === 'quiz') {
                if (A.length < 2) return 'Coche au moins 2 fonctions.';
                const items = {};
                A.forEach(k => items[k] = []);
                BANK.forEach((s, si) => s.forEach((g, gi) => {
                    if (g.f && A.includes(g.f) && g.f !== 'V') items[g.f].push({ si, gi, pi: -1, ans: g.f });
                    if (A.includes('CDN')) g.parts.forEach((p, pi) => { if (p.cdn) items.CDN.push({ si, gi, pi, ans: 'CDN' }); });
                }));
                const avail = A.filter(k => items[k].length);
                const plan = [];
                while (plan.length < ex.nq) plan.push(...shuffle(avail));
                const used = new Set(), qs = [];
                plan.slice(0, ex.nq).forEach(k => {
                    const pool = shuffle(items[k]);
                    const it = pool.find(x => !used.has(x.si + ':' + x.gi + ':' + x.pi)) || pool[0];
                    used.add(it.si + ':' + it.gi + ':' + it.pi);
                    qs.push(it);
                });
                S.run = { type: 'quiz', fns: A, qs: shuffle(qs), ans: [], corrected: false };
            } else if (ex.type === 'chasse') {
                if (!A.length) return 'Coche au moins une fonction.';
                const cards = [], usedS = new Set();
                for (let c = 0; c < ex.nh; c++) {
                    const tgts = ex.target !== 'random' && A.includes(ex.target) ? [ex.target] : shuffle(A);
                    let made = false;
                    for (const tg of tgts) {
                        const cand = BANK.map((s, si) => si).filter(si => !usedS.has(si) && (tg === 'CDN' ? hasCdn(BANK[si]) : BANK[si].some(g => g.f === tg)));
                        if (!cand.length) continue;
                        const si = pick(cand); usedS.add(si);
                        cards.push({ si, target: tg, picked: [] });
                        made = true; break;
                    }
                    if (!made) break;
                }
                S.run = { type: 'chasse', cards, corrected: false };
            } else {
                if (!A.length) return 'Coche au moins une fonction.';
                const ok = BANK.map((s, si) => si).filter(si => labelUnits(si, A).length >= (A.length > 1 ? 2 : 1));
                if (!ok.length) return 'Aucune phrase ne correspond à ces fonctions.';
                const cards = shuffle(ok).slice(0, ex.nl).map(si => ({ si, lab: {} }));
                S.run = { type: 'label', fns: A, cards, corrected: false };
            }
            return '';
        }
        // Unités à étiqueter dans une phrase : [{ key, ans }]
        function labelUnits(si, A) {
            const out = [];
            BANK[si].forEach((g, gi) => {
                if (g.f && g.f !== 'V' && A.includes(g.f) && A.some(k => k !== 'CDN')) out.push({ key: 'g' + gi, ans: g.f });
                if (A.includes('CDN')) g.parts.forEach((p, pi) => { if (p.cdn) out.push({ key: 'p' + gi + '_' + pi, ans: 'CDN' }); });
            });
            return out;
        }

        // =================================================================
        // RENDU : LEÇONS
        // =================================================================
        // Phrase découpée en groupes, avec l'étiquette de chaque fonction
        function blocksHtml(s, hide) {
            return `<div class="f2-gs">` + s.map(g => {
                if (g.loose) return `<span class="f2-loose">${esc(g.parts[0].t)}</span>`;
                const c = F[g.f].color;
                const words = g.parts.map(p => p.cdn
                    ? `<span class="f2-cdn ${hide ? 'plain' : ''}" style="--c:${F.CDN.color}"><span>${esc(p.t)}</span>${hide ? '' : `<small>${F.CDN.short}</small>`}</span>`
                    : `<span>${esc(p.t)}</span>`).join('');
                return `<span class="f2-blk ${hide ? 'plain' : ''}" style="--c:${hide ? '#d9cdb6' : c}"><span class="w">${words}</span><small>${F[g.f].short}</small></span>`;
            }).join('') + `</div>`;
        }
        function renderOverview() {
            const s = BANK[((S.demo % BANK.length) + BANK.length) % BANK.length];
            return `<div class="f2-ltitle"><h2 style="color:#6C4FD8">🧩 Les fonctions dans la phrase</h2></div>
                <div class="f2-box f2-what"><b class="t">🔤 Nature ou fonction ?</b>La <b>nature</b> dit <b>ce qu'est</b> un mot (un nom, un verbe…) : elle ne change pas. La <b>fonction</b> dit le <b>rôle</b> d'un mot ou d'un <b>groupe de mots</b> dans la phrase : elle change selon la phrase.
                    <ul><li><i><b>Le chat</b> dort.</i> → « le chat » est <b>sujet</b>.</li><li><i>Je caresse <b>le chat</b>.</i> → « le chat » est <b>COD</b>.</li></ul></div>
                <div class="f2-legend">${['S', 'V'].concat(ORDER.slice(1)).map(k => `<button class="f2-ltag" style="--c:${F[k].color}" ${k !== 'V' ? `data-act="lesson" data-g="${k}"` : ''}>${F[k].ico} ${F[k].label}</button>`).join('')}</div>
                <div class="f2-box f2-tool"><b class="t">🎨 Une phrase découpée en groupes</b>Chaque couleur est une fonction. Cache les couleurs pour faire chercher la classe, puis montre-les.
                    <div style="--f:26px;margin:8px 0">${blocksHtml(s, S.demoHide)}</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="f2-btn alt small" data-act="demo" data-d="-1">◀ Phrase précédente</button>
                        <button class="f2-btn alt small" data-act="demo" data-d="1">Phrase suivante ▶</button>
                        <button class="f2-btn alt small" data-act="demo" data-d="r">🎲 Au hasard</button>
                        <button class="f2-btn small ${S.demoHide ? 'go' : 'alt'}" data-act="demohide">${S.demoHide ? '👁 Montrer les fonctions' : '🙈 Cacher les fonctions'}</button>
                    </div></div>
                <div class="f2-box f2-test"><b class="t">🔧 Dans quel ordre chercher ?</b><ul>
                    <li>1. Je trouve le <b>verbe conjugué</b> (je change le temps de la phrase).</li>
                    <li>2. Je trouve son <b>sujet</b> : « Qui est-ce qui … ? ».</li>
                    <li>3. Je cherche ce qui complète le verbe : <b>COD</b> (quoi ?), <b>COI</b> (à qui ? de quoi ?), ou l'<b>attribut</b> après un verbe d'état.</li>
                    <li>4. Je repère les <b>CC</b> : je peux les déplacer ou les supprimer.</li>
                    <li>5. Dans les groupes nominaux, je cherche les <b>compléments du nom</b>.</li></ul></div>
                <div class="f2-box f2-memo"><b class="t">🧠 Pour retenir</b>Le <b>sujet</b>, le <b>verbe</b>, le COD, le COI et l'attribut sont <b>essentiels</b> : on ne peut pas les enlever. Les <b>CC</b> sont souvent <b>facultatifs</b> : on peut les supprimer.</div>
                <div class="f2-box f2-trap"><b class="t">⚠️ Attention au piège</b>Une fonction concerne souvent un <b>groupe de mots</b>, pas un seul mot : dans <i>Le petit chat dort</i>, le sujet est <b>le petit chat</b> (les trois mots).</div>
                <div><button class="f2-btn go" data-act="practice" data-v="label">✏️ S'entraîner : étiqueter des phrases</button></div>`;
        }
        function examplesFor(k) {
            return BANK.filter(s => k === 'CDN' ? hasCdn(s) : s.some(g => g.f === k))
                .sort((a, b) => (k === 'CDN' ? 0 : b.filter(g => g.f === k).length - a.filter(g => g.f === k).length)).slice(0, 3);
        }
        function renderFnLesson(k) {
            const L = LESSONS[k], N = F[k];
            const ex = examplesFor(k).map(s => `<div class="f2-sentence">${joinG(s, g => {
                if (g.loose) return esc(g.parts[0].t);
                if (k === 'CDN') return g.parts.map(p => p.cdn ? `<span class="hl" style="--c:${N.color}">${esc(p.t)}</span>` : esc(p.t)).join(' ');
                return g.f === k ? `<span class="hl" style="--c:${N.color}">${esc(gText(g))}</span>` : esc(gText(g));
            })}</div>`).join('');
            return `<div class="f2-ltitle"><h2 style="color:${N.color}">${N.ico} ${L.title}</h2></div>
                <div class="f2-box f2-what"><b class="t">🔤 C'est quoi ?</b>${L.what}</div>
                <div class="f2-box f2-test"><b class="t">❓ ${k === 'ATT' ? 'Après quels verbes ?' : k === 'CDN' ? 'Comment est-il construit ?' : 'Quelle question poser ?'}</b><span class="f2-q-ask" style="--c:${N.color}">${esc(L.ask)}</span></div>
                <div class="f2-box f2-test"><b class="t">🔎 Comment le reconnaître ?</b><ul>${L.tests.map(t => `<li>${t}</li>`).join('')}</ul></div>
                <div class="f2-box f2-tool"><b class="t">📝 Dans des phrases</b>${ex}</div>
                <div class="f2-box f2-memo"><b class="t">🧠 Pour retenir</b>${L.memo}</div>
                <div class="f2-box f2-trap"><b class="t">⚠️ Attention au piège</b>${L.trap}</div>
                <div><button class="f2-btn go" data-act="practice" data-v="${k}">✏️ S'entraîner : ${k === 'CC' ? 'les CC' : k === 'CDN' ? 'les compléments du nom' : k === 'ATT' ? 'l\'attribut du sujet' : k === 'S' ? 'le sujet' : 'le ' + k}</button></div>`;
        }
        function renderLesson() {
            const side = `<button class="f2-gbtn ${S.lesson === 'vue' ? 'active' : ''}" style="--c:#6C4FD8" data-act="lesson" data-g="vue">🧩 Les fonctions</button>` +
                ORDER.map(k => `<button class="f2-gbtn ${S.lesson === k ? 'active' : ''}" style="--c:${F[k].color}" data-act="lesson" data-g="${k}">${F[k].ico} ${k === 'CC' ? 'Compl. circonst.' : k === 'CDN' ? 'Compl. du nom' : k === 'ATT' ? 'Attribut du sujet' : F[k].label}</button>`).join('');
            const main = LESSONS[S.lesson] ? renderFnLesson(S.lesson) : renderOverview();
            return `<div class="f2-lesson"><div class="f2-side">${side}</div><div class="f2-main">${main}</div></div>`;
        }

        // =================================================================
        // RENDU : EXERCICES
        // =================================================================
        function renderSettings() {
            if (!S.settingsOpen) return `<div style="display:flex;justify-content:flex-end"><button class="f2-btn alt small" data-act="settings">⚙ Réglages</button></div>`;
            const ex = S.ex;
            const ch = (act, v, on, lbl, col) => `<button class="f2-chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}"${col ? ` style="--c:${col}"` : ''}>${lbl}</button>`;
            let h = `<div class="f2-settings">`;
            h += `<div class="f2-srow"><span class="l">1. Exercice</span>${ch('type', 'quiz', ex.type === 'quiz', '🎯 Trouver la fonction')}${ch('type', 'chasse', ex.type === 'chasse', '🔍 La chasse aux fonctions')}${ch('type', 'label', ex.type === 'label', '🏷️ Étiqueter la phrase')}</div>`;
            h += `<div class="f2-srow"><span class="l">2. Fonctions travaillées</span>${ORDER.map(k => ch('fn', k, ex.fns.includes(k), F[k].ico + ' ' + chipLabel(k), F[k].color)).join('')}
                <button class="f2-btn alt small" data-act="fnall">Toutes</button></div>`;
            if (ex.type === 'quiz') h += `<div class="f2-srow"><span class="l">Nombre de questions</span>${[6, 9, 12, 15].map(n => ch('nq', n, ex.nq === n, String(n))).join('')}</div>`;
            if (ex.type === 'chasse') {
                h += `<div class="f2-srow"><span class="l">Nombre de phrases</span>${[2, 4, 6].map(n => ch('nh', n, ex.nh === n, String(n))).join('')}</div>`;
                h += `<div class="f2-srow"><span class="l">Fonction à chercher</span>${ch('target', 'random', ex.target === 'random', '🎲 Au hasard')}${active().map(k => ch('target', k, ex.target === k, chipLabel(k), F[k].color)).join('')}</div>`;
            }
            if (ex.type === 'label') h += `<div class="f2-srow"><span class="l">Nombre de phrases</span>${[1, 2, 4, 6].map(n => ch('nl', n, ex.nl === n, String(n))).join('')}</div>`;
            h += `<div class="f2-srow"><span class="l">Taille du texte</span><button class="f2-btn alt small" data-act="font" data-d="-2">A−</button><button class="f2-btn alt small" data-act="font" data-d="2">A+</button>
                <span style="flex:1"></span>${S.run ? '<button class="f2-btn alt small" data-act="settings">Masquer les réglages</button>' : ''}
                <button class="f2-btn go small" data-act="gen">▶ Générer l'exercice</button></div>`;
            if (msg) h += `<div class="f2-msg">⚠️ ${msg}</div>`;
            return h + `</div>`;
        }
        function scoreOf(R) {
            if (R.type === 'quiz') return { ok: R.qs.filter((q, i) => R.ans[i] === q.ans).length, n: R.qs.length };
            if (R.type === 'chasse') {
                let ok = 0, n = 0;
                R.cards.forEach(c => huntUnits(c).forEach(u => {
                    const got = c.picked.includes(u.key);
                    if (u.want) n++;
                    if (u.want && got) ok++;
                    if (!u.want && got) ok--;        // un groupe touché à tort enlève un point
                }));
                return { ok: Math.max(0, ok), n };
            }
            let ok = 0, n = 0;
            R.cards.forEach(c => labelUnits(c.si, R.fns).forEach(u => { n++; if (c.lab[u.key] === u.ans) ok++; }));
            return { ok, n };
        }
        function renderQuiz(R) {
            return `<div class="f2-grid">` + R.qs.map((q, i) => {
                const a = R.ans[i];
                let cls = '', mark = '';
                if (R.corrected) { cls = a === q.ans ? 'ok' : 'ko'; mark = a === q.ans ? '✅' : '❌'; }
                const sent = joinG(BANK[q.si], (g, gi) => {
                    if (gi !== q.gi) return esc(gText(g));
                    if (q.pi < 0) return `<span class="target">${esc(gText(g))}</span>`;
                    return g.parts.map((p, pi) => pi === q.pi ? `<span class="target">${esc(p.t)}</span>` : esc(p.t)).join(' ');
                });
                const btns = R.fns.map(k => {
                    let c = a === k ? 'on' : '';
                    if (R.corrected) c = k === q.ans ? 'good' : (a === k ? 'bad' : '');
                    return `<button class="f2-choice ${c}" style="--c:${F[k].color}" data-act="quiz" data-i="${i}" data-v="${k}">${chipLabel(k)}</button>`;
                }).join('');
                return `<div class="f2-q ${cls}"><div class="f2-qtop"><span class="f2-num">${i + 1})</span>Quelle est la fonction du groupe souligné ?<span style="margin-left:auto">${mark}</span></div>
                    <div class="f2-qsent">${sent}</div><div class="f2-choices">${btns}</div></div>`;
            }).join('') + `</div>`;
        }
        // Unités touchables d'une carte « chasse »
        function huntUnits(c) {
            const s = BANK[c.si], out = [];
            s.forEach((g, gi) => {
                if (g.loose) { out.push({ loose: true, t: g.parts[0].t }); return; }
                if (c.target === 'CDN') g.parts.forEach((p, pi) => out.push({ key: 'p' + gi + '_' + pi, t: p.t, want: p.cdn }));
                else out.push({ key: 'g' + gi, t: gText(g), want: g.f === c.target });
            });
            return out;
        }
        function renderChasse(R) {
            return `<div class="f2-grid wide">` + R.cards.map((c, ci) => {
                const N = F[c.target], units = huntUnits(c);
                let cardCls = '', mark = '';
                if (R.corrected) {
                    const good = units.every(u => u.loose || u.want === c.picked.includes(u.key));
                    cardCls = good ? 'ok' : 'ko'; mark = good ? '✅' : '❌';
                }
                const html = units.map((u, i) => {
                    const sp = i === 0 || (u.loose && /^[.,]$/.test(u.t)) ? '' : ' ';
                    if (u.loose) return sp + `<span class="f2-loose">${esc(u.t)}</span>`;
                    const got = c.picked.includes(u.key);
                    let cls = got ? 'on' : '';
                    if (R.corrected) cls = u.want && got ? 'good' : (!u.want && got ? 'bad' : (u.want ? 'miss' : ''));
                    return sp + `<button class="f2-hw ${cls}" style="--c:${N.color}" data-act="hunt" data-c="${ci}" data-u="${u.key}">${esc(u.t)}</button>`;
                }).join('');
                return `<div class="f2-q ${cardCls}"><div class="f2-qtop"><span class="f2-num">${ci + 1})</span>Touche <b style="color:${N.color}">${esc(N.find)}</b><span style="margin-left:auto">${mark}</span></div>
                    <div class="f2-hunt">${html}</div></div>`;
            }).join('') + `</div>`;
        }
        function renderLabel(R) {
            const A = R.fns;
            return `<div class="f2-grid one">` + R.cards.map((c, ci) => {
                const units = labelUnits(c.si, A), need = new Set(units.map(u => u.key));
                const ansOf = {}; units.forEach(u => { ansOf[u.key] = u.ans; });
                let okN = 0;
                units.forEach(u => { if (c.lab[u.key] === u.ans) okN++; });
                const blocks = BANK[c.si].map((g, gi) => {
                    if (g.loose) return `<span class="f2-loose">${esc(g.parts[0].t)}</span>`;
                    const key = 'g' + gi;
                    const words = g.parts.map((p, pi) => {
                        if (!p.cdn) return `<span>${esc(p.t)}</span>`;
                        const pk = 'p' + gi + '_' + pi;
                        if (!need.has(pk)) return `<span>${esc(p.t)}</span>`;
                        const v = c.lab[pk];
                        let cl = '';
                        if (R.corrected) cl = v === 'CDN' ? 'ok' : 'ko';
                        return `<span class="f2-cdn ${cl}" style="--c:${v ? F[v].color : '#c9a2b8'}" data-act="lab" data-c="${ci}" data-u="${pk}"><span>${esc(p.t)}</span><small>${v ? F[v].short : '?'}</small>${R.corrected && v !== 'CDN' ? `<span class="f2-exp">→ CDN</span>` : ''}</span>`;
                    }).join('');
                    if (g.f === 'V') return `<span class="f2-blk" style="--c:${F.V.color}"><span class="w">${words}</span><small>verbe</small></span>`;
                    if (!need.has(key)) return `<span class="f2-blk off" title="Fonction non travaillée"><span class="w">${words}</span><small>—</small></span>`;
                    const v = c.lab[key];
                    let cl = '';
                    if (R.corrected) cl = v === ansOf[key] ? 'ok' : 'ko';
                    return `<span class="f2-blk ${cl}" style="--c:${v ? F[v].color : '#d9cdb6'}" data-act="lab" data-c="${ci}" data-u="${key}"><span class="w">${words}</span><small>${v ? F[v].short : '?'}</small>${R.corrected && v !== ansOf[key] ? `<span class="f2-exp">→ ${F[ansOf[key]].short}</span>` : ''}</span>`;
                }).join('');
                const cardCls = R.corrected ? (okN === units.length ? 'ok' : 'ko') : '';
                return `<div class="f2-q ${cardCls}"><div class="f2-qtop"><span class="f2-num">${ci + 1})</span>Touche chaque groupe pour lui donner sa fonction${R.corrected ? `<span style="margin-left:auto">${okN} / ${units.length}</span>` : ''}</div>
                    <div class="f2-gs" style="--f:${S.font}px">${blocks}</div></div>`;
            }).join('') + `</div>`;
        }
        function renderRun() {
            const R = S.run;
            const sc = R.corrected ? scoreOf(R) : null;
            const title = R.type === 'quiz' ? `🎯 ${R.qs.length} groupes à analyser` : R.type === 'chasse' ? `🔍 La chasse aux fonctions · ${R.cards.length} phrase${R.cards.length > 1 ? 's' : ''}` : `🏷️ Étiqueter ${R.cards.length} phrase${R.cards.length > 1 ? 's' : ''}`;
            let h = `<div class="f2-topbar"><span class="f2-pill">${title}</span>
                ${sc ? `<span class="f2-pill score">${sc.ok >= sc.n * 0.9 ? '🏆' : sc.ok >= sc.n * 0.6 ? '🎉' : '💪'} ${sc.ok} / ${sc.n}</span>` : ''}</div>
            <div class="f2-actions">
                <button class="f2-btn ${R.corrected ? 'alt' : 'go'}" data-act="correct">${R.corrected ? '🙈 Masquer la correction' : '👁 Correction'}</button>
                <button class="f2-btn alt" data-act="clear">🧹 Recommencer</button>
                <button class="f2-btn alt" data-act="regen">🔄 Nouvel exercice</button>
            </div>`;
            h += `<div style="--f:${S.font}px;display:flex;flex-direction:column;gap:12px">`;
            h += R.type === 'quiz' ? renderQuiz(R) : R.type === 'chasse' ? renderChasse(R) : renderLabel(R);
            return h + `</div>`;
        }
        function renderTrain() {
            let h = `<div class="f2-train">${renderSettings()}`;
            if (S.run) h += renderRun();
            else if (!S.settingsOpen || !msg) h += `<div class="f2-info">Coche les fonctions travaillées, choisis l'exercice, puis clique sur <b>▶ Générer l'exercice</b>.</div>`;
            return h + `</div>`;
        }

        function render() {
            container.querySelectorAll('.f2-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
                c.className = 'f2-confetti';
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
                    if (typeof window._wfMiniBarCollapse === 'function') window._wfMiniBarCollapse(widget, '🧭 Les fonctions', { onExpand: render });
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
                    if (v === 'label') ex.type = 'label';
                    else {
                        ex.type = 'chasse'; ex.target = v;
                        if (!ex.fns.includes(v)) ex.fns.push(v);
                    }
                    S.tab = 'train'; msg = genRun(); S.settingsOpen = !!msg; body.scrollTop = 0;
                    break;
                }
                case 'settings': S.settingsOpen = !S.settingsOpen; break;
                case 'type': ex.type = el.dataset.v; msg = ''; break;
                case 'fn':
                    toggleIn(ex.fns, el.dataset.v); msg = '';
                    if (ex.target !== 'random' && !ex.fns.includes(ex.target)) ex.target = 'random';
                    break;
                case 'fnall': ex.fns = ORDER.slice(); msg = ''; break;
                case 'nq': ex.nq = +el.dataset.v; break;
                case 'nh': ex.nh = +el.dataset.v; break;
                case 'nl': ex.nl = +el.dataset.v; break;
                case 'target': ex.target = el.dataset.v; break;
                case 'font': S.font = Math.max(18, Math.min(56, S.font + (+el.dataset.d))); break;
                case 'gen':
                case 'regen':
                    msg = genRun();
                    if (!msg) { S.settingsOpen = false; body.scrollTop = 0; } else S.settingsOpen = true;
                    break;
                case 'clear':
                    if (!R) return;
                    if (R.type === 'quiz') R.ans = [];
                    else if (R.type === 'chasse') R.cards.forEach(c => { c.picked = []; });
                    else R.cards.forEach(c => { c.lab = {}; });
                    R.corrected = false;
                    break;
                case 'correct': {
                    if (!R) return;
                    R.corrected = !R.corrected;
                    if (R.corrected) {
                        const sc = scoreOf(R);
                        if (sc.n && sc.ok === sc.n) { sfx('win'); party(); } else sfx(sc.ok >= sc.n * 0.5 ? 'good' : 'meh');
                    }
                    break;
                }
                case 'quiz':
                    if (!R || R.corrected) return;
                    R.ans[+el.dataset.i] = el.dataset.v; sfx('pop');
                    break;
                case 'hunt': {
                    if (!R || R.corrected) return;
                    const c = R.cards[+el.dataset.c], k = el.dataset.u, i = c.picked.indexOf(k);
                    if (i === -1) c.picked.push(k); else c.picked.splice(i, 1);
                    sfx('pop');
                    break;
                }
                case 'lab': {
                    if (!R || R.corrected) return;
                    const c = R.cards[+el.dataset.c], k = el.dataset.u;
                    // Pour un groupe : les fonctions cochées (sans CDN) ; pour un complément du nom : toutes les fonctions cochées
                    const opts = [null].concat(k[0] === 'p' ? R.fns : R.fns.filter(f => f !== 'CDN'));
                    const cur = c.lab[k] || null;
                    const nxt = opts[(opts.indexOf(cur) + 1) % opts.length];
                    if (nxt) c.lab[k] = nxt; else delete c.lab[k];
                    sfx('pop');
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
            if (e.target.closest('.f2-header') && !e.target.closest('button')) {
                widget.focus({ preventScroll: true });
                if (typeof positionActionBar === 'function') positionActionBar(widget);
                return;
            }
            e.stopPropagation();
        }
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('mousedown', onDown);
        container.addEventListener('touchstart', e => { if (!(e.target.closest('.f2-header') && !e.target.closest('button'))) e.stopPropagation(); }, { passive: true });
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
        widget._fnGetData = function () {
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
            if (type === TYPE) return window.createFonctionsWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') install(window.createWidget);
    else document.addEventListener('DOMContentLoaded', () => { if (typeof window.createWidget === 'function') install(window.createWidget); });

})();
