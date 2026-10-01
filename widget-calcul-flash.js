// =========================================================================
// WIDGET CALCUL FLASH — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'calcul-flash'.
//
// Les calculs défilent un par un, en grand, à un rythme réglable.
// C'est l'enseignant qui mène la séance collectivement (pause, suivant,
// arrêt), puis la correction s'affiche à la fin (révélation carte par carte
// ou tout d'un coup).
//
// Types : additions, soustractions (nombres min / max de chaque terme),
//         tables de multiplication, compléments à 10, compléments à 100,
//         doubles, moitiés.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-calcul-flash.js"></script>
//   2. Carte du panneau Activités (rubrique Activités de mathématiques) :
//      onclick="createWidget('calcul-flash');toggleActivitiesPanel()"
// =========================================================================

(function () {

    var TYPE = 'calcul-flash';
    var SETTINGS_KEY = 'calcul-flash-settings';

    // (copie identique à widget-calcul.js : n'est définie qu'une seule fois)
    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
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
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
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
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
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

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Wrapper externe ── */
    .widget[data-type="calcul-flash"] .cf-outer {
        position: relative;
        width: 800px;
        height: 520px;
        min-width: 360px;
        min-height: 320px;
        overflow: hidden;
        box-sizing: border-box;
        border-radius: 16px;
        cursor: move;
    }
    .widget[data-type="calcul-flash"] .cf-outer button { cursor: pointer; }
    .widget[data-type="calcul-flash"] .cf-outer input  { cursor: text; }
    .widget[data-type="calcul-flash"]:hover .cf-outer,
    .widget[data-type="calcul-flash"]:focus-within .cf-outer {
        outline: 2px dashed rgba(92,107,192,0.4);
    }

    @font-face { font-family: 'Marelle'; src: url('polices/marelle-regular.ttf') format('truetype'); }
    @font-face { font-family: 'Nunito';  src: url('polices/nunito-regular.ttf') format('truetype'); }

    .cf-widget {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        box-sizing: border-box;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        position: relative;
    }

    /* ── Header ── */
    .cf-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 7px 10px 7px 14px;
        background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        flex-shrink: 0; cursor: move;
    }
    .cf-title {
        font-size: 12px; font-weight: 900; text-transform: uppercase;
        letter-spacing: 0.08em; color: #5c6bc0;
        pointer-events: none; user-select: none;
    }

    /* ── Boutons fenêtre (même rendu que le Calcul mental) ── */
    .cf-widget .wf-btns { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }
    .cf-widget .wf-btn {
        width: 13px; height: 13px; border-radius: 50%; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; font-size: 0;
        transition: filter 0.15s, transform 0.1s; flex-shrink: 0; position: relative; padding: 0;
    }
    .cf-widget .wf-btn:hover  { filter: brightness(0.82); transform: scale(1.15); }
    .cf-widget .wf-btn:active { transform: scale(0.92); }
    .cf-widget .wf-btn-min   { background: #febc2e; }
    .cf-widget .wf-btn-max   { background: #28c840; }
    .cf-widget .wf-btn-close { background: #ff5f57; }
    .cf-widget .wf-btns:hover .wf-btn::after { font-size: 8px; font-weight: 900; color: rgba(0,0,0,0.5); line-height: 1; }
    .cf-widget .wf-btns:hover .wf-btn-min::after   { content: '−'; }
    .cf-widget .wf-btns:hover .wf-btn-max::after   { content: '⤢'; font-size: 7px; }
    .cf-widget .wf-btns:hover .wf-btn-close::after { content: '×'; font-size: 10px; }

    /* ── Plein écran board ── */
    .cf-outer.wf-fullboard {
        position: fixed !important; inset: 0 !important;
        width: 100% !important; height: 100% !important;
        z-index: 9999 !important; border-radius: 0 !important;
        transform: none !important; padding-left: 40px !important;
    }
    .cf-outer.wf-fullboard .cf-widget { border-radius: 0; }

    /* ── Corps ── */
    .cf-body {
        flex: 1; min-height: 0; overflow-y: auto;
        padding: 12px; display: flex; flex-direction: column;
    }
    .cf-body::-webkit-scrollbar { width: 4px; }
    .cf-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
    .cf-zone { display: none; flex-direction: column; gap: 10px; flex: 1; min-height: 0; }
    .cf-zone.active { display: flex; }

    /* ══ RÉGLAGES ══ */
    .cf-section-label {
        font-size: 13px; font-weight: 900; letter-spacing: 0.12em;
        color: #333; margin: 8px 0 6px; text-align: center;
    }
    .cf-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .cf-type {
        border: 2px solid #999; border-radius: 20px; background: #f8fafc;
        min-width: 90px; height: 50px; padding: 0 10px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: inherit; font-size: 12px; font-weight: 900; color: #555;
        transition: all 0.18s; user-select: none; line-height: 1.15;
    }
    .cf-type .cf-type-ico { font-size: 18px; font-family: 'Marelle', 'Nunito', sans-serif; }
    .cf-type.on {
        border-color: #5c6bc0; background: #5c6bc0; color: #fff;
        box-shadow: 0 2px 8px rgba(92,107,192,0.3);
    }
    .cf-small {
        min-width: 40px; height: 40px; padding: 0 8px;
        border: 1px solid #999; border-radius: 20px; background: #f8fafc;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Marelle', 'Nunito', sans-serif; font-size: 15px; font-weight: 900; color: #555;
        transition: all 0.18s; user-select: none;
    }
    .cf-small.cf-all { font-family: 'Nunito', sans-serif; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
    .cf-small.on { border-color: #5c6bc0; background: #5c6bc0; color: #fff; }
    .cf-sub { display: none; }
    .cf-sub.visible { display: block; }

    .cf-params { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }
    .cf-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
    .cf-spinner-label {
        font-size: 11px; font-weight: 900; color: #555; letter-spacing: 0.08em; text-align: center;
    }
    .cf-spinner-inner {
        display: flex; align-items: center;
        background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden;
    }
    .cf-spinner-btn {
        width: 34px; height: 44px; border: none; background: transparent;
        font-size: 20px; font-weight: 700; color: #5c6bc0;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.12s; user-select: none; padding: 0;
    }
    .cf-spinner-btn:hover  { background: #eceef9; }
    .cf-spinner-btn:active { background: #dcdff3; }
    .cf-spinner-val {
        width: 50px; height: 44px; text-align: center; border: none;
        border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;
        background: #fff; font-size: 22px; font-weight: 800; color: #1e293b;
        outline: none; padding: 0; -moz-appearance: textfield;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .cf-spinner-val.cf-wide { width: 64px; }
    .cf-spinner-val::-webkit-inner-spin-button,
    .cf-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

    .cf-toggle {
        display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid #cbd5e1; border-radius: 20px; background: #f8fafc;
        padding: 7px 14px; font-family: inherit; font-size: 12px; font-weight: 800; color: #64748b;
        transition: all 0.18s;
    }
    .cf-toggle.on { border-color: #5c6bc0; color: #3949ab; background: #f3f4fb; }
    .cf-toggle .cf-dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; transition: background 0.18s; }
    .cf-toggle.on .cf-dot { background: #5c6bc0; }

    .cf-warn { text-align: center; color: #dc2626; font-size: 12px; font-weight: 800; min-height: 16px; }
    .cf-start-btn {
        display: block; margin: 6px auto 4px;
        padding: 18px 30px; border-radius: 50px;
        font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;
        border: none; background: #5c6bc0; color: #fff;
        transition: transform 0.1s, box-shadow 0.15s;
        box-shadow: 0 3px 12px rgba(92,107,192,0.3);
    }
    .cf-start-btn:hover  { box-shadow: 0 5px 18px rgba(92,107,192,0.45); }
    .cf-start-btn:active { transform: scale(0.97); }

    /* ══ DÉFILEMENT ══ */
    .cf-flash-top { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .cf-counter {
        font-size: 15px; font-weight: 900; color: #5c6bc0; white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }
    .cf-progress { flex: 1; height: 10px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
    .cf-progress-bar {
        height: 100%; width: 100%; border-radius: 99px;
        background: linear-gradient(90deg, #7986cb, #5c6bc0);
    }
    .cf-progress-bar.cf-paused { background: #cbd5e1; }
    .cf-dots { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; flex-shrink: 0; }
    .cf-dots span { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; }
    .cf-dots span.done { background: #c5cae9; }
    .cf-dots span.current { background: #5c6bc0; transform: scale(1.3); }

    .cf-stage {
        flex: 1; min-height: 0; position: relative;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
    }
    .cf-big {
        font-family: 'Marelle', 'Nunito', sans-serif; font-weight: 900;
        color: #1e293b; white-space: nowrap; line-height: 1; letter-spacing: -0.01em;
        user-select: none;
    }
    .cf-big.cf-pop { animation: cf-pop 0.35s ease-out; }
    @keyframes cf-pop { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
    .cf-big.cf-count { color: #5c6bc0; }
    .cf-q {
        display: inline-block; min-width: 0.9em; padding: 0 0.12em;
        border: 0.06em solid #5c6bc0; border-radius: 0.14em;
        color: #5c6bc0; text-align: center; line-height: 1.05;
    }
    .cf-pause-badge {
        position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
        background: #f3f4fb; border: 1px solid #c5cae9; color: #3949ab;
        border-radius: 99px; padding: 4px 14px; font-size: 12px; font-weight: 900;
        display: none; letter-spacing: 0.06em; text-transform: uppercase;
    }
    .cf-pause-badge.visible { display: block; }
    .cf-end-msg { text-align: center; line-height: 1.25; white-space: normal; }
    .cf-end-msg .cf-end-ico { font-size: 54px; line-height: 1.3; margin-bottom: 18px; }
    .cf-end-msg .cf-end-title { font-size: 26px; font-weight: 900; margin: 6px 0 4px; }
    .cf-end-msg .cf-end-sub { font-size: 14px; color: #64748b; }

    /* ── Boutons d'action ── */
    .cf-actions { display: flex; gap: 6px; flex-shrink: 0; justify-content: center; }
    .cf-action {
        flex: 1; max-width: 220px; padding: 10px 6px; border: none; border-radius: 50px;
        font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;
        color: #fff; transition: opacity 0.15s, transform 0.1s; font-family: inherit;
    }
    .cf-action:hover  { opacity: 0.85; }
    .cf-action:active { transform: scale(0.96); }
    .cf-action span { font-size: 13px; }
    .cf-b-grey   { background: #6b7280; }
    .cf-b-orange { background: #5c6bc0; }
    .cf-b-amber  { background: #7986cb; }
    .cf-b-green  { background: #10b981; }
    .cf-b-red    { background: #ef4444; }
    .cf-b-blue   { background: #3b82f6; }

    /* ══ CORRECTION ══ */
    .cf-corr-hint { text-align: center; font-size: 12px; color: #64748b; flex-shrink: 0; }
    .cf-grid {
        display: grid; gap: 14px; align-content: start; flex: 1; min-height: 0;
        overflow-y: auto; padding: 2px;
        grid-template-columns: repeat(3, 1fr);
    }
    .cf-card {
        background: #e6e8eb; border: 1.5px solid #abaeb3; border-radius: 10px;
        padding: 10px 10px 10px 24px; min-height: 70px; position: relative;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        font-family: 'Marelle', 'Nunito', sans-serif; font-weight: 900;
        white-space: nowrap; transition: background 0.2s, border-color 0.2s; cursor: pointer;
    }
    .cf-card:hover { border-color: #5c6bc0; }
    .cf-card.revealed { background: #ecfdf5; border-color: #6ee7b7; }
    .cf-card-num {
        position: absolute; top: 4px; left: 7px;
        font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 900; color: #5c6bc0;
    }
    .cf-card .cf-q { border-width: 2px; border-radius: 6px; }
    .cf-card-ans { color: #047954; display: none; }
    .cf-card.revealed .cf-card-ans { display: inline; }
    .cf-card.revealed .cf-q { display: none; }

    /* ── Poignée resize ── */
    .cf-resize-handle {
        position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
        cursor: se-resize; background: linear-gradient(135deg, transparent 50%, #aaa 50%);
        border-radius: 0 0 16px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        touch-action: none;
    }
    .cf-outer:hover .cf-resize-handle { opacity: 1; }
    .cf-outer.wf-fullboard .cf-resize-handle { display: none; }
    `;

    if (!document.getElementById('cf-widget-style')) {
        const s = document.createElement('style');
        s.id = 'cf-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── Template ─────────────────────────────────────────────────────────
    if (!document.getElementById('template-calcul-flash')) {
        const tpl = document.createElement('template');
        tpl.id = 'template-calcul-flash';
        tpl.innerHTML = `
<div class="cf-outer editor-container">
  <div class="cf-widget">

    <div class="cf-header">
      <span class="cf-title">⚡ Calcul flash</span>
      <div class="wf-btns">
        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
      </div>
    </div>

    <div class="cf-body">

      <!-- ══ RÉGLAGES ══ -->
      <div class="cf-zone active" data-role="setup">
        <div>
          <div class="cf-section-label">Types de calculs</div>
          <div class="cf-chips">
            <button class="cf-type" data-type="add"><span class="cf-type-ico">+</span>Additions</button>
            <button class="cf-type" data-type="sub"><span class="cf-type-ico">−</span>Soustractions</button>
            <button class="cf-type" data-type="tables"><span class="cf-type-ico">×</span>Tables</button>
            <button class="cf-type" data-type="c10" title="Compléments à 10"><span class="cf-type-ico">…+?=10</span>Compl. à 10</button>
            <button class="cf-type" data-type="c100" title="Compléments à 100"><span class="cf-type-ico">…+?=100</span>Compl. à 100</button>
            <button class="cf-type" data-type="doubles"><span class="cf-type-ico">2 ×</span>Doubles</button>
            <button class="cf-type" data-type="moities"><span class="cf-type-ico">½</span>Moitiés</button>
          </div>
        </div>

        <div class="cf-sub" data-role="sub-addsub">
          <div class="cf-section-label">Additions et soustractions : nombres de chaque terme</div>
          <div class="cf-params">
            <div class="cf-spinner">
              <div class="cf-spinner-label">NOMBRE<br>MINIMUM</div>
              <div class="cf-spinner-inner">
                <button class="cf-spinner-btn" data-role="addmin-minus">−</button>
                <input type="number" class="cf-spinner-val cf-wide" data-role="addmin" min="0" max="999" value="1">
                <button class="cf-spinner-btn" data-role="addmin-plus">+</button>
              </div>
            </div>
            <div class="cf-spinner">
              <div class="cf-spinner-label">NOMBRE<br>MAXIMUM</div>
              <div class="cf-spinner-inner">
                <button class="cf-spinner-btn" data-role="addmax-minus">−</button>
                <input type="number" class="cf-spinner-val cf-wide" data-role="addmax" min="0" max="999" value="20">
                <button class="cf-spinner-btn" data-role="addmax-plus">+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="cf-sub" data-role="sub-tables">
          <div class="cf-section-label">Tables</div>
          <div class="cf-chips" data-role="tables"></div>
        </div>

        <div class="cf-sub" data-role="sub-limit">
          <div class="cf-section-label">Doubles et moitiés : nombres jusqu'à</div>
          <div class="cf-chips" data-role="limits">
            <button class="cf-small" data-limit="10">10</button>
            <button class="cf-small" data-limit="20">20</button>
            <button class="cf-small" data-limit="50">50</button>
            <button class="cf-small" data-limit="100">100</button>
          </div>
        </div>

        <div class="cf-params">
          <div class="cf-spinner">
            <div class="cf-spinner-label">SECONDES<br>PAR CALCUL</div>
            <div class="cf-spinner-inner">
              <button class="cf-spinner-btn" data-role="speed-minus">−</button>
              <input type="number" class="cf-spinner-val" data-role="speed" min="2" max="60" value="6">
              <button class="cf-spinner-btn" data-role="speed-plus">+</button>
            </div>
          </div>
          <div class="cf-spinner">
            <div class="cf-spinner-label">NOMBRE<br>DE CALCULS</div>
            <div class="cf-spinner-inner">
              <button class="cf-spinner-btn" data-role="count-minus">−</button>
              <input type="number" class="cf-spinner-val" data-role="count" min="3" max="40" value="10">
              <button class="cf-spinner-btn" data-role="count-plus">+</button>
            </div>
          </div>
        </div>

        <div class="cf-chips" style="margin-top:6px;">
          <button class="cf-toggle" data-opt="voice"><span class="cf-dot"></span>🔊 Lire les calculs à voix haute</button>
          <button class="cf-toggle" data-opt="beep"><span class="cf-dot"></span>🔔 Signal sonore à chaque calcul</button>
        </div>

        <div class="cf-warn" data-role="warn"></div>
        <button class="cf-start-btn" data-role="start">⚡ Lancer le calcul flash</button>
      </div>

      <!-- ══ DÉFILEMENT ══ -->
      <div class="cf-zone" data-role="flash">
        <div class="cf-flash-top">
          <div class="cf-counter" data-role="counter">1 / 10</div>
          <div class="cf-progress"><div class="cf-progress-bar" data-role="bar"></div></div>
        </div>
        <div class="cf-dots" data-role="dots"></div>
        <div class="cf-stage" data-role="stage">
          <div class="cf-pause-badge" data-role="pause-badge">⏸ En pause</div>
          <div class="cf-big" data-role="big"></div>
        </div>
        <div class="cf-actions" data-role="flash-actions">
          <button class="cf-action cf-b-grey"   data-role="stop"><span>⏹</span> Arrêter</button>
          <button class="cf-action cf-b-amber"  data-role="pause"><span>⏸</span> Pause</button>
          <button class="cf-action cf-b-orange" data-role="next"><span>⏭</span> Suivant</button>
        </div>
        <div class="cf-actions" data-role="end-actions" style="display:none;">
          <button class="cf-action cf-b-grey"  data-role="end-setup"><span>⚙️</span> Réglages</button>
          <button class="cf-action cf-b-green" data-role="end-correct"><span>✅</span> Voir la correction</button>
        </div>
      </div>

      <!-- ══ CORRECTION ══ -->
      <div class="cf-zone" data-role="correction">
        <div class="cf-corr-hint">Touchez un calcul pour révéler sa réponse.</div>
        <div class="cf-grid" data-role="grid"></div>
        <div class="cf-actions">
          <button class="cf-action cf-b-grey"   data-role="c-setup"><span>⚙️</span> Réglages</button>
          <button class="cf-action cf-b-green"  data-role="c-reveal"><span>👁</span> Tout révéler</button>
          <button class="cf-action cf-b-blue"   data-role="c-replay"><span>🔁</span> Rejouer la série</button>
          <button class="cf-action cf-b-orange" data-role="c-new"><span>🎲</span> Nouvelle série</button>
        </div>
      </div>

    </div>
  </div>
  <div class="cf-resize-handle"></div>
</div>`;
        document.body.appendChild(tpl);
    }

    // ── Réglages mémorisés (dernier usage) ───────────────────────────────
    var DEFAULTS = { addMin: 1, addMax: 20, types: ['tables'], tables: [2,3,4,5,6,7,8,9,10], limit: 20, speed: 6, count: 10, voice: false, beep: true };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') return Object.assign({}, DEFAULTS, s);
        } catch (e) {}
        return Object.assign({}, DEFAULTS);
    }
    function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }

    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    var Q = '<span class="cf-q">?</span>';

    // ── Générateurs de calculs ───────────────────────────────────────────
    // Chaque calcul : { html, text (correction), ans, say (voix), key }
    function addRange(s) {
        var a = Math.max(0, Math.min(999, s.addMin | 0)), b = Math.max(0, Math.min(999, s.addMax | 0));
        return a <= b ? [a, b] : [b, a];
    }
    var GEN = {
        add: function (s) {
            var r = addRange(s), a = rnd(r[0], r[1]), b = rnd(r[0], r[1]);
            return { html: a + ' + ' + b, ans: a + b, say: a + ' plus ' + b, key: 'a' + Math.min(a, b) + '_' + Math.max(a, b) };
        },
        sub: function (s) {
            var r = addRange(s), a = rnd(r[0], r[1]), b = rnd(r[0], r[1]);
            if (a < b) { var t = a; a = b; b = t; }      // résultat jamais négatif
            return { html: a + ' − ' + b, ans: a - b, say: a + ' moins ' + b, key: 's' + a + '_' + b };
        },
        tables: function (s) {
            var t = pick(s.tables.length ? s.tables : DEFAULTS.tables), n = rnd(1, 10);
            var a = t, b = n;
            if (Math.random() < 0.5) { a = n; b = t; }
            return { html: a + ' × ' + b, ans: a * b, say: a + ' fois ' + b, key: 'x' + Math.min(a, b) + '_' + Math.max(a, b) };
        },
        c10: function () {
            var a = rnd(1, 9);
            return { html: a + ' + ' + Q + ' = 10', ans: 10 - a, say: a + ' plus combien égale 10 ?', key: 'c10_' + a };
        },
        c100: function () {
            var a = Math.random() < 0.35 ? rnd(1, 9) * 10 : rnd(1, 99);
            return { html: a + ' + ' + Q + ' = 100', ans: 100 - a, say: a + ' plus combien égale 100 ?', key: 'c100_' + a };
        },
        doubles: function (s) {
            var n = rnd(1, s.limit);
            return { html: 'double de ' + n, ans: 2 * n, say: 'le double de ' + n, key: 'd' + n };
        },
        moities: function (s) {
            var n = 2 * rnd(1, Math.max(1, Math.floor(s.limit / 2)));
            return { html: 'moitié de ' + n, ans: n / 2, say: 'la moitié de ' + n, key: 'm' + n };
        }
    };

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    // Répartition équilibrée : chaque type reçoit le même nombre de calculs
    // (le reste éventuel est attribué au hasard, un calcul de plus par type),
    // puis l'ordre est mélangé en évitant autant que possible deux calculs
    // du même type à la suite.
    function balancedTypes(types, count) {
        var n = types.length, base = Math.floor(count / n), rest = count % n;
        var extra = shuffle(types.slice()).slice(0, rest);
        var pool = [];
        types.forEach(function (t) {
            var k = base + (extra.indexOf(t) >= 0 ? 1 : 0);
            for (var i = 0; i < k; i++) pool.push(t);
        });
        var best = shuffle(pool.slice()), bestRuns = Infinity;
        for (var attempt = 0; attempt < 40 && n > 1; attempt++) {
            var cand = shuffle(pool.slice()), runs = 0;
            for (var i = 1; i < cand.length; i++) if (cand[i] === cand[i - 1]) runs++;
            if (runs < bestRuns) { best = cand; bestRuns = runs; }
            if (runs === 0) break;
        }
        return best;
    }

    function generateSeries(s) {
        var list = [], used = {}, last = '';
        var order = balancedTypes(s.types, s.count);
        for (var i = 0; i < s.count; i++) {
            var type = order[i], item = null;
            for (var tries = 0; tries < 60; tries++) {
                var it = GEN[type](s);
                if (it.key === last) continue;
                if (used[it.key] && tries < 50) continue;
                item = it; break;
            }
            if (!item) item = GEN[type](s);
            used[item.key] = true; last = item.key;
            list.push(item);
        }
        return list;
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    window.initCalculFlashWidget = function (widget) {

        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW = window.innerWidth;
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));

        const outer = widget.querySelector('.cf-outer');
        const $ = (r) => widget.querySelector('[data-role="' + r + '"]');

        // Laisser remonter le drag sauf sur les contrôles
        function _down(e) {
            const tag = e.target.tagName;
            if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'LABEL' ||
                e.target.closest('.cf-card, .cf-resize-handle')) {
                e.stopPropagation();
            }
            if (typeof bringToFront === 'function') bringToFront(widget);
            if (!widget.hasAttribute('tabindex')) widget.setAttribute('tabindex', '-1');
            if (tag !== 'INPUT') widget.focus({ preventScroll: true });
            if (typeof positionActionBar === 'function') positionActionBar(widget);
        }
        outer.addEventListener('mousedown',   _down);
        outer.addEventListener('pointerdown', _down);

        // ── Références ───────────────────────────────────────────────────
        const zones = { setup: $('setup'), flash: $('flash'), correction: $('correction') };
        const tablesWrap = $('tables'), subTables = $('sub-tables'), subLimit = $('sub-limit');
        const subAddSub = $('sub-addsub'), inAddMin = $('addmin'), inAddMax = $('addmax');
        const inSpeed = $('speed'), inCount = $('count'), warn = $('warn');
        const counter = $('counter'), bar = $('bar'), dots = $('dots'), stage = $('stage');
        const big = $('big'), pauseBadge = $('pause-badge');
        const flashActions = $('flash-actions'), endActions = $('end-actions');
        const btnPause = $('pause'), grid = $('grid'), btnReveal = $('c-reveal');

        let S = loadSettings();
        let series = [], idx = 0, phase = 'setup';
        let itemStart = 0, pausedAt = 0, paused = false, rafId = null, cdTimer = null;

        function showZone(name) {
            Object.keys(zones).forEach(k => zones[k].classList.toggle('active', k === name));
        }

        // ── Construction des réglages ────────────────────────────────────
        (function buildTables() {
            let html = '';
            for (let i = 2; i <= 10; i++) html += '<button class="cf-small" data-table="' + i + '">' + i + '</button>';
            html += '<button class="cf-small cf-all" data-table="all">Toutes</button>';
            tablesWrap.innerHTML = html;
        })();

        function syncSetup() {
            widget.querySelectorAll('.cf-type').forEach(b => b.classList.toggle('on', S.types.indexOf(b.dataset.type) >= 0));
            tablesWrap.querySelectorAll('[data-table]').forEach(b => {
                if (b.dataset.table === 'all') b.classList.toggle('on', S.tables.length === 9);
                else b.classList.toggle('on', S.tables.indexOf(+b.dataset.table) >= 0);
            });
            widget.querySelectorAll('[data-limit]').forEach(b => b.classList.toggle('on', +b.dataset.limit === S.limit));
            widget.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
            subAddSub.classList.toggle('visible', S.types.indexOf('add') >= 0 || S.types.indexOf('sub') >= 0);
            inAddMin.value = S.addMin; inAddMax.value = S.addMax;
            subTables.classList.toggle('visible', S.types.indexOf('tables') >= 0);
            subLimit.classList.toggle('visible', S.types.indexOf('doubles') >= 0 || S.types.indexOf('moities') >= 0);
            inSpeed.value = S.speed; inCount.value = S.count;
            warn.textContent = '';
        }

        widget.querySelectorAll('.cf-type').forEach(b => b.addEventListener('click', () => {
            const t = b.dataset.type, i = S.types.indexOf(t);
            if (i >= 0) S.types.splice(i, 1); else S.types.push(t);
            syncSetup(); saveSettings(S);
        }));
        tablesWrap.addEventListener('click', (e) => {
            const b = e.target.closest('[data-table]'); if (!b) return;
            if (b.dataset.table === 'all') S.tables = S.tables.length === 9 ? [] : [2,3,4,5,6,7,8,9,10];
            else {
                const n = +b.dataset.table, i = S.tables.indexOf(n);
                if (i >= 0) S.tables.splice(i, 1); else S.tables.push(n);
                S.tables.sort((a, b) => a - b);
            }
            syncSetup(); saveSettings(S);
        });
        widget.querySelectorAll('[data-limit]').forEach(b => b.addEventListener('click', () => {
            S.limit = +b.dataset.limit; syncSetup(); saveSettings(S);
        }));
        widget.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
            S[b.dataset.opt] = !S[b.dataset.opt]; syncSetup(); saveSettings(S);
            if (b.dataset.opt === 'voice' && S.voice) speak('Lecture activée');
        }));

        // Spinners +/− avec appui long (comme le Calcul mental)
        function bindSpinner(input, minusRole, plusRole, key) {
            const min = +input.min, max = +input.max;
            let hold = null, delay = null;
            function set(v) {
                v = Math.max(min, Math.min(max, v | 0));
                input.value = v; S[key] = v; saveSettings(S);
            }
            [[$(minusRole), -1], [$(plusRole), 1]].forEach(([btn, d]) => {
                btn.addEventListener('pointerdown', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    try { btn.setPointerCapture(e.pointerId); } catch (err) {}
                    set((+input.value || 0) + d);
                    delay = setTimeout(() => { hold = setInterval(() => set((+input.value || 0) + d), 90); }, 400);
                });
                const stop = () => { clearTimeout(delay); clearInterval(hold); delay = hold = null; };
                btn.addEventListener('pointerup', stop);
                btn.addEventListener('pointercancel', stop);
                btn.addEventListener('lostpointercapture', stop);
            });
            input.addEventListener('change', () => set(+input.value));
            input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') input.blur(); });
        }
        bindSpinner(inSpeed, 'speed-minus', 'speed-plus', 'speed');
        bindSpinner(inCount, 'count-minus', 'count-plus', 'count');
        bindSpinner(inAddMin, 'addmin-minus', 'addmin-plus', 'addMin');
        bindSpinner(inAddMax, 'addmax-minus', 'addmax-plus', 'addMax');

        // ── Sons & voix ──────────────────────────────────────────────────
        let audioCtx = null;
        function tone(freq, dur, vol) {
            try {
                audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
                const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'sine'; o.frequency.value = freq;
                g.gain.setValueAtTime(vol || 0.25, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + dur);
                o.start(t); o.stop(t + dur + 0.02);
            } catch (e) {}
        }
        function speak(text) {
            if (!window.speechSynthesis) return;
            try {
                speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'fr-FR'; u.rate = 0.95;
                const v = speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang));
                if (v) u.voice = v;
                speechSynthesis.speak(u);
            } catch (e) {}
        }
        function stopSpeech() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

        // ── Taille du texte géant ────────────────────────────────────────
        // Taille maximale selon la hauteur, puis mesure réelle de la largeur
        // affichée (case « ? » comprise) et réduction pour tenir dans la zone.
        function fitBig() {
            const w = stage.clientWidth, h = stage.clientHeight;
            if (!w || !h) return;
            const maxW = w * 0.9;
            let fs = Math.max(16, h * 0.62);
            big.style.fontSize = fs + 'px';
            for (let i = 0; i < 3; i++) {
                const bw = big.scrollWidth;
                if (bw <= maxW) break;
                fs = Math.max(16, fs * (maxW / bw));
                big.style.fontSize = fs + 'px';
            }
        }

        function setBig(html, cls) {
            big.className = 'cf-big' + (cls ? ' ' + cls : '');
            big.innerHTML = html;
            fitBig();
            void big.offsetWidth;          // relance l'animation
            big.classList.add('cf-pop');
        }

        // ── Défilement ───────────────────────────────────────────────────
        function renderDots() {
            dots.innerHTML = series.map((_, i) =>
                '<span class="' + (i < idx ? 'done' : i === idx ? 'current' : '') + '"></span>').join('');
        }

        function startSeries(keepSeries) {
            S.speed = Math.max(2, Math.min(60, +inSpeed.value || S.speed));
            S.count = Math.max(3, Math.min(40, +inCount.value || S.count));
            S.addMin = Math.max(0, Math.min(999, parseInt(inAddMin.value, 10) || 0));
            S.addMax = Math.max(0, Math.min(999, parseInt(inAddMax.value, 10) || 0));
            if ((S.types.indexOf('add') >= 0 || S.types.indexOf('sub') >= 0) && S.addMax === 0 && S.addMin === 0) {
                warn.textContent = 'Indiquez un nombre maximum pour les additions et soustractions.'; return;
            }
            if (!S.types.length) { warn.textContent = 'Choisissez au moins un type de calculs.'; return; }
            if (S.types.length === 1 && S.types[0] === 'tables' && !S.tables.length) {
                warn.textContent = 'Choisissez au moins une table.'; return;
            }
            saveSettings(S);
            if (!keepSeries || !series.length) series = generateSeries(S);
            idx = 0; paused = false;
            showZone('flash');
            flashActions.style.display = ''; endActions.style.display = 'none';
            pauseBadge.classList.remove('visible');
            counter.textContent = 'Prêts ?';
            bar.style.width = '100%'; bar.classList.remove('cf-paused');
            renderDots();
            countdown(3);
        }

        function countdown(n) {
            phase = 'countdown';
            clearTimeout(cdTimer);
            if (n <= 0) { showItem(); return; }
            setBig(String(n), 'cf-count');
            if (S.beep) tone(660, 0.12, 0.2);
            cdTimer = setTimeout(() => countdown(n - 1), 800);
        }

        function showItem() {
            phase = 'flash';
            const it = series[idx];
            counter.textContent = (idx + 1) + ' / ' + series.length;
            renderDots();
            setBig(it.html);
            if (S.beep) tone(880, 0.15, 0.22);
            if (S.voice) speak(it.say);
            itemStart = performance.now();
            paused = false;
            loop();
        }

        function loop() {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(function step(now) {
                if (phase !== 'flash' || paused) return;
                const dur = S.speed * 1000;
                const t = now - itemStart;
                bar.style.width = Math.max(0, 100 - (t / dur) * 100) + '%';
                if (t >= dur) { nextItem(); return; }
                rafId = requestAnimationFrame(step);
            });
        }

        function nextItem() {
            cancelAnimationFrame(rafId);
            if (phase === 'countdown') { clearTimeout(cdTimer); showItem(); return; }
            if (phase !== 'flash') return;
            idx++;
            if (idx >= series.length) { endSeries(); return; }
            showItem();
        }

        function togglePause() {
            if (phase !== 'flash') return;
            if (!paused) {
                paused = true; pausedAt = performance.now();
                cancelAnimationFrame(rafId); stopSpeech();
                pauseBadge.classList.add('visible'); bar.classList.add('cf-paused');
                btnPause.innerHTML = '<span>▶</span> Reprendre';
            } else {
                paused = false; itemStart += performance.now() - pausedAt;
                pauseBadge.classList.remove('visible'); bar.classList.remove('cf-paused');
                btnPause.innerHTML = '<span>⏸</span> Pause';
                loop();
            }
        }

        function stopAll() {
            cancelAnimationFrame(rafId); clearTimeout(cdTimer); stopSpeech();
            paused = false;
            pauseBadge.classList.remove('visible'); bar.classList.remove('cf-paused');
            btnPause.innerHTML = '<span>⏸</span> Pause';
        }

        function endSeries() {
            stopAll();
            phase = 'end';
            idx = series.length; renderDots();
            counter.textContent = 'Terminé';
            bar.style.width = '0%';
            big.className = 'cf-big';
            big.style.fontSize = '';
            big.innerHTML = '<div class="cf-end-msg"><div class="cf-end-ico">✏️</div>' +
                '<div class="cf-end-title">Terminé ! Posez vos crayons.</div></div>';
            flashActions.style.display = 'none'; endActions.style.display = '';
            if (S.beep) { tone(660, 0.18, 0.25); setTimeout(() => tone(990, 0.35, 0.25), 180); }
            if (S.voice) speak('Terminé ! Posez vos crayons.');
        }

        // ── Correction ───────────────────────────────────────────────────
        // Colonnes selon la largeur ET la longueur des calculs, puis la
        // police est réduite si une carte déborde encore.
        // 4 colonnes au maximum ; la police grandit avec la largeur des cartes,
        // puis elle est réduite si une carte déborde encore.
        function layoutGrid() {
            const cards = Array.from(grid.querySelectorAll('.cf-card'));
            if (!cards.length) return;
            const GAP = 14;
            const avail = grid.clientWidth || outer.offsetWidth || 800;
            const baseFs = outer.offsetWidth >= 1100 ? 30 : outer.offsetWidth >= 700 ? 26 : 22;
            const maxLen = Math.max.apply(null, series.map(it =>
                (it.html.replace(/<[^>]+>/g, '') + ' = 00').length));
            const cardMin = maxLen * baseFs * 0.44 + 44;
            const cols = Math.max(1, Math.min(4, Math.floor((avail + GAP) / (cardMin + GAP))));
            grid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
            const cardW = (avail - GAP * (cols - 1)) / cols;
            const startFs = Math.max(18, Math.min(56, (cardW - 44) / (maxLen * 0.42)));
            cards.forEach(c => {
                let fs = startFs;
                c.style.fontSize = fs + 'px';
                c.style.minHeight = Math.round(fs * 2.3) + 'px';
                while (c.scrollWidth > c.clientWidth && fs > 12) { fs -= 1; c.style.fontSize = fs + 'px'; }
            });
        }
        function showCorrection() {
            stopAll();
            phase = 'correction';
            grid.innerHTML = series.map((it, i) => {
                const withAns = it.html.indexOf('cf-q') >= 0
                    ? it.html.replace(Q, '<span class="cf-card-ans">' + it.ans + '</span>' + Q)
                    : it.html + ' = ' + Q + '<span class="cf-card-ans">' + it.ans + '</span>';
                return '<div class="cf-card" data-i="' + i + '"><span class="cf-card-num">' + (i + 1) + '</span>' + withAns + '</div>';
            }).join('');
            btnReveal.innerHTML = '<span>👁</span> Tout révéler';
            showZone('correction');
            layoutGrid();
        }
        grid.addEventListener('click', (e) => {
            const c = e.target.closest('.cf-card'); if (!c) return;
            c.classList.toggle('revealed');
        });
        btnReveal.addEventListener('click', () => {
            const cards = grid.querySelectorAll('.cf-card');
            const allOn = Array.from(cards).every(c => c.classList.contains('revealed'));
            cards.forEach(c => c.classList.toggle('revealed', !allOn));
            btnReveal.innerHTML = allOn ? '<span>👁</span> Tout révéler' : '<span>🙈</span> Tout masquer';
        });

        function backToSetup() { stopAll(); phase = 'setup'; syncSetup(); showZone('setup'); }

        // ── Boutons ──────────────────────────────────────────────────────
        $('start').addEventListener('click', () => startSeries(false));
        $('pause').addEventListener('click', togglePause);
        $('next').addEventListener('click', nextItem);
        $('stop').addEventListener('click', endSeries);
        $('end-setup').addEventListener('click', backToSetup);
        $('end-correct').addEventListener('click', showCorrection);
        $('c-setup').addEventListener('click', backToSetup);
        $('c-replay').addEventListener('click', () => startSeries(true));
        $('c-new').addEventListener('click', () => startSeries(false));

        // Clavier (widget sélectionné) : Espace = pause, → = suivant
        widget.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (phase !== 'flash' && phase !== 'countdown') return;
            if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); togglePause(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); nextItem(); }
        });

        // ── Redimensionnement : suivi de la taille ───────────────────────
        function onResize() {
            if (phase === 'flash' || phase === 'countdown') fitBig();
            if (phase === 'correction') layoutGrid();
        }
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                onResize();
                if (!outer.classList.contains('wf-fullboard')) {
                    if (outer.offsetWidth > 0)  widget.dataset.cfW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.cfH = outer.offsetHeight;
                }
            });
            ro.observe(outer);
            ro.observe(stage);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }

        // ── Boutons fenêtre ──────────────────────────────────────────────
        const wfMin = $('wf-min'), wfMax = $('wf-max'), wfClose = $('wf-close');
        let _savedW = null, _savedH = null, _isMax = false;

        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            if (phase === 'flash' && !paused) togglePause();
            window._wfMiniBarCollapse(widget, '⚡ Calcul flash', { onExpand: onResize });
        });

        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = outer.style.width  || outer.offsetWidth  + 'px';
                _savedH = outer.style.height || outer.offsetHeight + 'px';
                outer.classList.add('wf-fullboard');
            } else {
                outer.classList.remove('wf-fullboard');
                outer.style.width  = _savedW || '800px';
                outer.style.height = _savedH || '520px';
            }
            requestAnimationFrame(onResize);
        });

        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            stopAll();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Poignée resize (souris, stylet, doigt) ───────────────────────
        const handle = widget.querySelector('.cf-resize-handle');
        handle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            try { handle.setPointerCapture(e.pointerId); } catch (err) {}
            const sx = e.clientX, sy = e.clientY, sw = outer.offsetWidth, sh = outer.offsetHeight;
            const move = (ev) => {
                outer.style.width  = Math.max(360, sw + ev.clientX - sx) + 'px';
                outer.style.height = Math.max(320, sh + ev.clientY - sy) + 'px';
            };
            const up = () => {
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', up);
                handle.removeEventListener('pointercancel', up);
                if (typeof saveBoard === 'function') saveBoard();
            };
            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up);
            handle.addEventListener('pointercancel', up);
        });
        handle.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
        handle.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });

        // Nettoyage
        const obs = new MutationObserver(function () {
            if (!document.contains(widget)) { stopAll(); obs.disconnect(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        syncSetup();
        showZone('setup');
    };

    // =========================================================================
    // SAUVEGARDE / RESTAURATION DE LA TAILLE (même principe que le Calcul mental)
    // =========================================================================
    (function patchRestore() {
        const _orig = window.restoreBoardFromJSON;
        if (typeof _orig !== 'function') { document.addEventListener('DOMContentLoaded', patchRestore); return; }
        if (_orig._cfPatched) return;
        window.restoreBoardFromJSON = function (json) {
            let sizes = {};
            try {
                const parsed = JSON.parse(json);
                const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                widgets.forEach(w => {
                    if (w.type === TYPE && (w.cfW || w.cfH)) {
                        const key = (w.leftPercent || 0).toFixed(1) + '_' + (w.topPercent || 0).toFixed(1);
                        sizes[key] = { w: w.cfW, h: w.cfH };
                    }
                });
            } catch (e) {}
            const res = _orig.apply(this, arguments);
            setTimeout(() => {
                document.querySelectorAll('.widget[data-type="' + TYPE + '"]').forEach(widget => {
                    const outer = widget.querySelector('.cf-outer');
                    if (!outer) return;
                    const key = (parseFloat(widget.dataset.leftPercent) || 0).toFixed(1) + '_' + (parseFloat(widget.dataset.topPercent) || 0).toFixed(1);
                    const s = sizes[key];
                    const w = (s && s.w) || parseFloat(widget.dataset.cfW);
                    const h = (s && s.h) || parseFloat(widget.dataset.cfH);
                    if (w > 0) outer.style.width  = w + 'px';
                    if (h > 0) outer.style.height = h + 'px';
                });
            }, 150);
            return res;
        };
        window.restoreBoardFromJSON._cfPatched = true;
    })();

    (function patchBuild() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function') return;
        window.buildBoardState = function () {
            const state = _orig.apply(this, arguments);
            document.querySelectorAll('.widget[data-type="' + TYPE + '"]').forEach(widget => {
                const outer = widget.querySelector('.cf-outer');
                if (!outer || !state || !state.widgets) return;
                const match = state.widgets.find(w => w.type === TYPE &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 0.1);
                if (match) {
                    const full = outer.classList.contains('wf-fullboard');
                    match.cfW = full ? parseFloat(widget.dataset.cfW) || 800 : outer.offsetWidth;
                    match.cfH = full ? parseFloat(widget.dataset.cfH) || 520 : outer.offsetHeight;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function hook(orig) {
        return function (type) {
            var widget = orig.apply(this, arguments);
            if (type === TYPE && widget) initCalculFlashWidget(widget);
            return widget;
        };
    }
    if (typeof window.createWidget === 'function') {
        window.createWidget = hook(window.createWidget);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof window.createWidget === 'function') window.createWidget = hook(window.createWidget);
        });
    }

})();
