// ══════════════════════════════════════════════════════════════════
//  widget-horloge.js  —  Horloge interactive pour la classe (v2)
//  • Cadran clair très lisible, aiguilles colorées (rouge = heures,
//    bleue = minutes), boutons de réglage aux mêmes couleurs.
//  • Glisser une aiguille OU toucher le cadran (centre = heures,
//    bord = minutes) : la grande aiguille entraîne la petite.
//  • Heure en chiffres + heure en lettres (masquables, clic = révéler).
//  • Exercices : « Lire l'heure » (heure au hasard, réponse cachée)
//    et « Placer les aiguilles » (consigne + vérification).
//  • Repères : chiffres 1–12, minutes 00–55, 13–24, zones « et / moins »,
//    portions colorées (quart, demie, moins le quart…), matin/après-midi.
//  Compatible avec la sauvegarde existante (_hrlgGetData / _hrlgSetData).
// ══════════════════════════════════════════════════════════════════

function _hrlgInjectStyles() {
    if (document.getElementById('hrlg-style-v2')) return;
    const s = document.createElement('style');
    s.id = 'hrlg-style-v2';
    s.textContent = `
    @font-face {
        font-family: 'MarelleBaton';
        src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
        font-weight: normal; font-style: normal;
    }
    .widget[data-type="horloge"] { cursor: move; overflow: visible !important; }
    /* Réduit en mini-barre : la mini-barre impose 300×50 et masque le reste */
    .widget[data-type="horloge"].hrlg-collapsed { overflow: hidden !important; }
    .widget[data-type="horloge"].hrlg-fit {
        width: max-content !important; height: max-content !important;
        min-width: 0 !important; min-height: 0 !important;
    }
    .widget[data-type="horloge"] button { cursor: pointer; }
    .widget[data-type="horloge"] .drag-handle { cursor: move; }

    .hrlg-ec { overflow: visible !important; display: flex; flex-direction: column; height: auto !important; }

    /* ── Thème (variables) ───────────────────────────────────── */
    .hrlg-container {
        --h-bg:#15152e; --h-head:#1d1d3d; --h-line:#2f2f58; --h-text:#e0e7ff; --h-muted:#a5b4fc;
        --h-chip:#23234a; --h-chip-on:#6366f1; --h-card:#1f1f44;
        --h-face:#fffdf8; --h-num:#1e1b4b; --h-num24:#7c83a8; --h-tick:#b8bccf; --h-tick5:#312e81;
        --h-hour:#ef4444; --h-min:#2563eb; --h-ok:#16a34a; --h-ko:#dc2626;
        position: relative;
        display: flex; flex-direction: column;
        background: var(--h-bg); color: var(--h-text);
        border-radius: 1.1em; border: 1px solid var(--h-line);
        box-shadow: 0 0.4em 1.8em rgba(0,0,0,.35);
        font-size: 15px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        width: max-content; box-sizing: border-box;
    }
    .hrlg-container:not(.wf-fullboard) {
        width: max-content !important; min-width: 0 !important; max-width: none !important;
        height: auto !important; min-height: 0 !important; max-height: none !important;
    }
    body.menu-light .hrlg-container {
        --h-bg:#f6f7ff; --h-head:#eceefe; --h-line:#d6d8f0; --h-text:#1e1b4b; --h-muted:#4338ca;
        --h-chip:#ffffff; --h-chip-on:#4f46e5; --h-card:#ffffff;
    }
    .hrlg-container *, .hrlg-container *::before, .hrlg-container *::after { box-sizing: border-box; }

    /* ── En-tête ─────────────────────────────────────────────── */
    .hrlg-header {
        display: flex; align-items: center; gap: 0.5em;
        padding: 0.5em 0.8em; background: var(--h-head);
        border-bottom: 1px solid var(--h-line); border-radius: 1.1em 1.1em 0 0;
        cursor: move; user-select: none;
    }
    .hrlg-title { font-size: 0.9em; font-weight: 800; color: var(--h-muted); letter-spacing: .02em; }
    .hrlg-icon-btn {
        background: var(--h-chip); border: 1px solid var(--h-line); color: var(--h-muted);
        font-size: 0.8em; font-weight: 800; min-width: 2em; height: 2em; border-radius: 0.6em;
        display: inline-flex; align-items: center; justify-content: center; padding: 0 0.4em;
        transition: background .15s, transform .1s;
    }
    .hrlg-icon-btn:hover { filter: brightness(1.15); }
    .hrlg-icon-btn.is-on { background: var(--h-chip-on); color: #fff; border-color: transparent; }

    /* ── Aide ────────────────────────────────────────────────── */
    .hrlg-help-popup {
        display: none; position: absolute; top: 3.2em; left: 0.8em; right: 0.8em; z-index: 200;
        background: var(--h-card); border: 1px solid var(--h-line); border-radius: 0.8em;
        padding: 0.9em 1em; box-shadow: 0 6px 24px rgba(0,0,0,.45);
        font-size: 0.78em; line-height: 1.5; max-height: calc(100% - 4.5em); overflow-y: auto;
    }
    .hrlg-help-popup.hrlg-help-show { display: block; }
    .hrlg-help-popup h4 { margin: 0 0 .5em; color: var(--h-muted); font-size: 1.1em; }
    .hrlg-help-popup p { margin: 0 0 .55em; }
    .hrlg-help-popup kbd { background: var(--h-chip); border: 1px solid var(--h-line); border-radius: 4px; padding: 0 .35em; font-size: .9em; }

    /* ── Réglages ────────────────────────────────────────────── */
    .hrlg-settings-bar {
        position: absolute; top: 3em; left: 0; right: 0; bottom: 0; z-index: 150;
        display: flex; flex-direction: column; gap: 0.55em;
        padding: 0.8em 0.9em 1.2em; background: var(--h-head); border-top: 1px solid var(--h-line);
        border-radius: 0 0 1.1em 1.1em; overflow-y: auto;
    }
    .hrlg-settings-close {
        align-self: center; margin-top: .3em; border: none; border-radius: .7em; padding: .5em 1.4em;
        font-size: .8em; font-weight: 800; color: #fff; background: var(--h-chip-on);
    }
    .hrlg-settings-bar.hrlg-settings-hidden { display: none; }
    .hrlg-set-title { font-size: 0.66em; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--h-muted); opacity: .85; margin-bottom: .3em; }
    .hrlg-chips { display: flex; flex-wrap: wrap; gap: 0.35em; }
    .hrlg-chip {
        display: inline-flex; align-items: center; gap: .4em;
        background: var(--h-chip); color: var(--h-text); border: 1px solid var(--h-line);
        border-radius: 999px; padding: .35em .75em; font-size: .72em; font-weight: 600;
        white-space: nowrap; transition: background .15s, color .15s;
    }
    .hrlg-chip:hover { filter: brightness(1.12); }
    .hrlg-chip.is-on { background: var(--h-chip-on); color: #fff; border-color: transparent; }
    .hrlg-swatch { width: .85em; height: .85em; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(255,255,255,.6); }

    /* ── Corps ───────────────────────────────────────────────── */
    .hrlg-body { display: flex; flex-direction: row; align-items: center; gap: 1.4em; padding: 1em 1.2em max(1.3em, 22px); }
    .hrlg-side { display: flex; flex-direction: column; gap: 0.7em; width: 17em; flex-shrink: 0; }
    .hrlg-clock-wrap { width: 20em; height: 20em; flex-shrink: 0; }
    .hrlg-svg { width: 100%; height: 100%; display: block; overflow: visible; touch-action: none; user-select: none; cursor: pointer; }
    .hrlg-number    { font-family: 'MarelleBaton', 'Comic Sans MS', cursive; font-weight: 700; fill: var(--h-num); }
    .hrlg-number24  { font-family: system-ui, sans-serif; font-weight: 700; fill: var(--h-num24); }
    .hrlg-number-min{ font-family: system-ui, sans-serif; font-weight: 800; fill: #fff; }
    .hrlg-tick-min  { stroke: var(--h-tick); stroke-width: 1.1; stroke-linecap: round; }
    .hrlg-tick-5    { stroke: var(--h-tick5); stroke-width: 2.6; stroke-linecap: round; }
    .hrlg-hand-g, .hrlg-hit-g {
        transform-box: view-box; transform-origin: 100px 100px;
        transition: transform .55s cubic-bezier(.34,1.35,.5,1);
    }
    .hrlg-dragging .hrlg-hand-g, .hrlg-dragging .hrlg-hit-g { transition: none; }
    .hrlg-hit { stroke: transparent; stroke-linecap: round; cursor: grab; }
    .hrlg-dragging .hrlg-svg, .hrlg-dragging .hrlg-hit { cursor: grabbing; }

    /* ── Carte réponse ───────────────────────────────────────── */
    .hrlg-answer { display: flex; flex-direction: column; gap: .45em; }
    .hrlg-in-task .hrlg-answer { display: none; }
    .hrlg-in-task.hrlg-task-done .hrlg-answer { display: flex; }
    .hrlg-digital, .hrlg-words {
        position: relative; background: var(--h-card); border: 1px solid var(--h-line);
        border-radius: .8em; text-align: center; cursor: pointer; overflow: hidden;
        transition: transform .1s;
    }
    .hrlg-digital:active, .hrlg-words:active { transform: scale(.98); }
    .hrlg-digital { padding: .15em .8em; }
    .hrlg-time-display {
        font-family: 'MarelleBaton', 'Comic Sans MS', cursive; font-size: 3em; font-weight: 700;
        letter-spacing: .04em; line-height: 1.25; display: inline-block;
    }
    .hrlg-td-h { color: var(--h-hour); } .hrlg-td-m { color: var(--h-min); }
    .hrlg-colon { color: var(--h-muted); }
    .hrlg-words { padding: .55em .8em; font-size: 1.05em; font-weight: 700; line-height: 1.35; min-height: 2.6em; display: flex; align-items: center; justify-content: center; flex-direction: column; }
    .hrlg-words-alt { font-size: .75em; font-weight: 600; opacity: .7; }
    .hrlg-mask {
        position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
        font-weight: 800; color: var(--h-muted); font-size: 1em;
        background: repeating-linear-gradient(45deg, var(--h-card) 0 .7em, var(--h-head) .7em 1.4em);
    }
    .hrlg-digital .hrlg-mask { font-size: 1.6em; letter-spacing: .1em; }
    .is-hidden .hrlg-mask { display: flex; }
    .is-hidden > :not(.hrlg-mask) { visibility: hidden; }
    .hrlg-off { display: none !important; }

    /* ── Boutons de réglage ──────────────────────────────────── */
    .hrlg-steppers { display: grid; grid-template-columns: repeat(6, 1fr); gap: .35em; }
    .hrlg-step {
        border: none; border-radius: .7em; padding: .55em 0; font-size: .8em; font-weight: 800;
        color: #fff; box-shadow: 0 .18em 0 rgba(0,0,0,.25); transition: transform .08s, box-shadow .08s, filter .15s;
        line-height: 1.1;
    }
    .hrlg-step small { display: block; font-size: .75em; font-weight: 700; opacity: .85; }
    .hrlg-step:hover { filter: brightness(1.1); }
    .hrlg-step:active { transform: translateY(.15em); box-shadow: 0 0 0 rgba(0,0,0,.25); }
    .hrlg-step-h { background: linear-gradient(#f87171, #dc2626); }
    .hrlg-step-m { background: linear-gradient(#60a5fa, #2563eb); }

    .hrlg-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .35em; }
    .hrlg-act {
        min-width: 0; overflow: hidden; text-overflow: ellipsis; border: none; border-radius: .75em; padding: .6em .35em;
        font-size: .82em; font-weight: 800; color: #fff; white-space: nowrap;
        box-shadow: 0 .18em 0 rgba(0,0,0,.25); transition: transform .08s, box-shadow .08s, filter .15s;
    }
    .hrlg-act:hover { filter: brightness(1.1); }
    .hrlg-act:active { transform: translateY(.15em); box-shadow: none; }
    .hrlg-act-read  { background: linear-gradient(#fbbf24, #d97706); }
    .hrlg-act-place { background: linear-gradient(#34d399, #059669); }
    .hrlg-act-show  { background: linear-gradient(#818cf8, #4f46e5); }
    .hrlg-act-small { padding: .6em .55em; background: var(--h-chip); color: var(--h-text); border: 1px solid var(--h-line); box-shadow: none; }

    /* ── Exercice « placer » ─────────────────────────────────── */
    .hrlg-task {
        display: none; flex-direction: column; align-items: center; gap: .4em;
        background: var(--h-card); border: 2px dashed #34d399; border-radius: .9em; padding: .6em .7em;
        text-align: center;
    }
    .hrlg-in-task .hrlg-task { display: flex; }
    .hrlg-task-label { font-size: .78em; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: .06em; }
    .hrlg-task-target { font-family: 'MarelleBaton', 'Comic Sans MS', cursive; font-size: 2.2em; font-weight: 700; line-height: 1.15; }
    .hrlg-task-target.is-words { font-family: inherit; font-size: 1.15em; font-weight: 800; }
    .hrlg-task-fb { font-size: .9em; font-weight: 700; min-height: 1.2em; }
    .hrlg-task-fb.ok { color: var(--h-ok); animation: hrlg-pop .5s ease; }
    .hrlg-task-fb.ko { color: var(--h-ko); animation: hrlg-shake .4s ease; }
    .hrlg-task-btns { display: flex; flex-wrap: wrap; gap: .35em; justify-content: center; }
    .hrlg-task-btns button { border: none; border-radius: .6em; padding: .45em .8em; font-size: .78em; font-weight: 800; color: #fff; background: #059669; }
    .hrlg-task-btns button[data-task="solution"] { background: #d97706; }
    .hrlg-task-btns button[data-task="next"] { background: #4f46e5; }
    .hrlg-task-btns button[data-task="quit"] { background: var(--h-chip); color: var(--h-text); border: 1px solid var(--h-line); }
    .hrlg-task-done .hrlg-task { border-style: solid; border-color: var(--h-ok); }
    @keyframes hrlg-pop { 0% { transform: scale(.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
    @keyframes hrlg-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
    .hrlg-flash-ok .hrlg-face-c { animation: hrlg-face-ok 1s ease; }
    @keyframes hrlg-face-ok { 0%,100% { fill: var(--h-face); } 30% { fill: #bbf7d0; } }

    /* ── Poignée de redimensionnement ────────────────────────── */
    .hrlg-custom-resize-handle {
        position: absolute; bottom: 2px; right: 4px; width: 20px; height: 20px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; color: var(--h-muted); opacity: .55; cursor: se-resize; user-select: none; z-index: 10;
        touch-action: none;
    }
    .hrlg-custom-resize-handle:hover { opacity: 1; }

    /* ── Plein écran du tableau ──────────────────────────────── */
    .hrlg-container.wf-fullboard {
        position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important;
        z-index: 9999 !important; border-radius: 0 !important; overflow: hidden !important;
    }
    .hrlg-container.wf-fullboard .hrlg-header { border-radius: 0; }
    .hrlg-container.wf-fullboard .hrlg-body { flex: 1; justify-content: center; min-height: 0; }
    .hrlg-container.wf-fullboard .hrlg-custom-resize-handle { display: none; }

    /* ── Boutons fenêtre (si absents) ────────────────────────── */
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; padding:0; font-size:0; flex-shrink:0; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn-min { background:#febc2e; } .wf-btn-max { background:#28c840; } .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
    `;
    document.head.appendChild(s);
}

// Portions colorées (clés identiques à la version précédente → sauvegardes compatibles)
const HRLG_ARC_DEFS = {
    quart: { startMin: 0,  endMin: 15, color: '#34d399', label: 'Et quart' },
    demi:  { startMin: 0,  endMin: 30, color: '#60a5fa', label: 'Et demie' },
    troiq: { startMin: 0,  endMin: 45, color: '#f472b6', label: 'Trois-quarts' },
    m5:    { startMin: 55, endMin: 60, color: '#fbbf24', label: 'Moins cinq' },
    m10:   { startMin: 50, endMin: 60, color: '#fb923c', label: 'Moins dix' },
    mq:    { startMin: 45, endMin: 60, color: '#f87171', label: 'Moins le quart' },
    m20:   { startMin: 40, endMin: 60, color: '#c084fc', label: 'Moins vingt' },
    m25:   { startMin: 35, endMin: 60, color: '#e879f9', label: 'Moins vingt-cinq' },
};

function createHorlogeWidget() {
    _hrlgInjectStyles();
    const uid = 'hrlg' + Math.random().toString(36).slice(2, 8);

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'horloge';
    widget.dataset.transparent = 'true';
    widget.classList.add('hrlg-fit');
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 80, y: 80 };
    widget.style.cssText = `left:100px; top:${p.y}px; overflow:visible; flex-direction:row;`;

    widget.addEventListener('mousedown', () => {
        if (typeof isDrawMode   !== 'undefined' && isDrawMode)   return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true' && typeof bringToFront === 'function') bringToFront(widget);
    });

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle"  onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle"   onclick="togglePin(this.closest('.widget,.shape-widget'))"    title="Épingler">📌</div>
            <div class="widget-back-handle"  onclick="sendToBack(this.closest('.widget,.shape-widget'))"   title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>`;

    const ec = document.createElement('div');
    ec.className = 'hrlg-ec';
    ec.style.overflow = 'visible';

    const arcChips = Object.entries(HRLG_ARC_DEFS).map(([k, d]) =>
        `<button class="hrlg-chip" data-arc="${k}"><span class="hrlg-swatch" style="background:${d.color}"></span>${d.label}</button>`).join('');

    ec.innerHTML = `
    <div class="hrlg-container">
        <div class="hrlg-header">
            <span class="hrlg-title">🕐 Horloge</span>
            <button class="hrlg-icon-btn hrlg-settings-toggle" title="Réglages">⚙️</button>
            <button class="hrlg-icon-btn hrlg-help-btn" title="Aide">?</button>
            <button class="hrlg-icon-btn" data-act="now"   title="Mettre l'heure actuelle">🕒</button>
            <button class="hrlg-icon-btn" data-act="reset" title="Remettre à 12:00">↺</button>
            <div class="wf-btns" style="margin-left:auto">
                <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
            </div>
        </div>

        <div class="hrlg-help-popup">
            <h4>💡 Horloge interactive</h4>
            <p><strong>Bouger les aiguilles :</strong> faites glisser la <span style="color:#ef4444;font-weight:700">petite aiguille rouge</span> (heures) ou la <span style="color:#2563eb;font-weight:700">grande aiguille bleue</span> (minutes). On peut aussi toucher le cadran : près du centre on règle les heures, près du bord les minutes. Quand la grande aiguille fait le tour, la petite avance toute seule.</p>
            <p><strong>Boutons rouges / bleus :</strong> ajoutent ou retirent 1 h, 5 min ou 1 min.</p>
            <p><strong>Réponse cachée :</strong> touchez l'heure numérique ou l'heure en lettres pour la cacher ou la révéler.</p>
            <p><strong>🎲 Lire :</strong> une heure au hasard, la réponse est masquée. Les élèves lisent, puis on appuie sur <em>👁 Réponse</em>.</p>
            <p><strong>🎯 Placer les aiguilles :</strong> une consigne s'affiche, l'élève place les aiguilles puis appuie sur <em>Vérifier</em>. L'horloge indique quelle aiguille est mal placée.</p>
            <p><strong>Taille :</strong> tirez la poignée ⤡ en bas à droite ; l'horloge garde ses proportions et reste dans le tableau. <strong>🕒</strong> met l'heure actuelle, <strong>↺</strong> remet à 12:00.</p>
            <p><strong>⚙️ Réglages :</strong> repères du cadran (chiffres, minutes, 13–24, zones « et / moins »), portions colorées, matin / après-midi, niveau des exercices et pas des aiguilles.</p>
            <p><strong>Clavier</strong> (horloge sélectionnée) : <kbd>←</kbd> <kbd>→</kbd> minutes, <kbd>↑</kbd> <kbd>↓</kbd> heures.</p>
        </div>

        <div class="hrlg-settings-bar hrlg-settings-hidden">
            <div>
                <div class="hrlg-set-title">Repères sur le cadran</div>
                <div class="hrlg-chips">
                    <button class="hrlg-chip" data-opt="showHourNums">🔴 Chiffres 1–12</button>
                    <button class="hrlg-chip" data-opt="showMinNums">🔵 Minutes 00–55</button>
                    <button class="hrlg-chip" data-opt="show24">13–24</button>
                    <button class="hrlg-chip" data-opt="showZones">Zones « et / moins »</button>
                </div>
            </div>
            <div>
                <div class="hrlg-set-title">Portions colorées</div>
                <div class="hrlg-chips">${arcChips}</div>
            </div>
            <div>
                <div class="hrlg-set-title">Affichage de l'heure</div>
                <div class="hrlg-chips">
                    <button class="hrlg-chip" data-opt="showDigital">12:45 En chiffres</button>
                    <button class="hrlg-chip" data-opt="showWordsCard">En lettres</button>
                    <button class="hrlg-chip" data-period="none">Sans période</button>
                    <button class="hrlg-chip" data-period="am">🌅 Matin</button>
                    <button class="hrlg-chip" data-period="pm">🌇 Après-midi</button>
                </div>
            </div>
            <div>
                <div class="hrlg-set-title">Exercices</div>
                <div class="hrlg-chips">
                    <button class="hrlg-chip" data-level="h">Heures pile</button>
                    <button class="hrlg-chip" data-level="demi">+ demies</button>
                    <button class="hrlg-chip" data-level="quart">+ quarts</button>
                    <button class="hrlg-chip" data-level="5">5 en 5 min</button>
                    <button class="hrlg-chip" data-level="1">Toutes</button>
                </div>
                <div class="hrlg-chips" style="margin-top:.35em">
                    <button class="hrlg-chip" data-step="1">Aiguilles : pas 1 min</button>
                    <button class="hrlg-chip" data-step="5">Aiguilles : pas 5 min</button>
                    <button class="hrlg-chip" data-opt="taskWords">Consigne en lettres</button>
                </div>
            </div>
            <button class="hrlg-settings-close">✓ Fermer les réglages</button>
        </div>

        <div class="hrlg-body">
            <div class="hrlg-clock-wrap">
                <svg class="hrlg-svg" viewBox="-22 -22 244 244" xmlns="http://www.w3.org/2000/svg"></svg>
            </div>
            <div class="hrlg-side">
                <div class="hrlg-task">
                    <div class="hrlg-task-label">🎯 Place les aiguilles sur</div>
                    <div class="hrlg-task-target"></div>
                    <div class="hrlg-task-fb"></div>
                    <div class="hrlg-task-btns">
                        <button data-task="check">✔ Vérifier</button>
                        <button data-task="solution">💡 Solution</button>
                        <button data-task="next">↻ Une autre</button>
                        <button data-task="quit" title="Quitter l'exercice">✖</button>
                    </div>
                </div>
                <div class="hrlg-answer">
                    <div class="hrlg-digital" title="Toucher pour cacher / révéler">
                        <span class="hrlg-time-display"></span>
                        <span class="hrlg-mask">? ? : ? ?</span>
                    </div>
                    <div class="hrlg-words" title="Toucher pour cacher / révéler">
                        <span class="hrlg-words-txt"></span>
                        <span class="hrlg-words-alt"></span>
                        <span class="hrlg-mask">En lettres … touche pour révéler</span>
                    </div>
                </div>
                <div class="hrlg-steppers">
                    <button class="hrlg-step hrlg-step-h" data-delta="-60" title="Reculer d'une heure">−1<small>h</small></button>
                    <button class="hrlg-step hrlg-step-m" data-delta="-5"  title="Reculer de 5 minutes">−5<small>min</small></button>
                    <button class="hrlg-step hrlg-step-m" data-delta="-1"  title="Reculer d'une minute">−1<small>min</small></button>
                    <button class="hrlg-step hrlg-step-m" data-delta="1"   title="Avancer d'une minute">+1<small>min</small></button>
                    <button class="hrlg-step hrlg-step-m" data-delta="5"   title="Avancer de 5 minutes">+5<small>min</small></button>
                    <button class="hrlg-step hrlg-step-h" data-delta="60"  title="Avancer d'une heure">+1<small>h</small></button>
                </div>
                <div class="hrlg-actions">
                    <button class="hrlg-act hrlg-act-read"  data-act="read"  title="Heure au hasard, réponse cachée">🎲 Lire</button>
                    <button class="hrlg-act hrlg-act-place" data-act="place" title="Placer les aiguilles sur une heure donnée">🎯 Placer</button>
                    <button class="hrlg-act hrlg-act-show"  data-act="show">👁 Réponse</button>
                </div>
            </div>
        </div>
    </div>`;

    widget.appendChild(ec);
    document.getElementById('board').appendChild(widget);

    if (typeof bringToFront            === 'function') bringToFront(widget);
    if (typeof makeDraggable           === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate     === 'function') makeDraggableRotate(widget);
    if (typeof makeResizableByHandle   === 'function') makeResizableByHandle(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    _initHorlogeResize(widget);

    // ── En-tête = poignée de déplacement ──────────────────────────
    const header = widget.querySelector('.hrlg-header');
    if (header && typeof startWidgetDrag === 'function') {
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        header.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Boutons fenêtre ───────────────────────────────────────────
    const wfMin = widget.querySelector('[data-role="wf-min"]');
    const wfMax = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const container = widget.querySelector('.hrlg-container');
    let isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            widget.classList.remove('hrlg-fit');
            widget.classList.add('hrlg-collapsed');
            window._wfMiniBarCollapse(widget, '🕐 Horloge', {
                onExpand: () => {
                    widget.classList.remove('hrlg-collapsed');
                    widget.classList.add('hrlg-fit');
                    if (widget._hrlgApplyScale) widget._hrlgApplyScale();
                }
            });
        }
    });
    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        isMax = !isMax;
        container.classList.toggle('wf-fullboard', isMax);
        widget._hrlgApplyScale && widget._hrlgApplyScale();
    });
    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Aide ──────────────────────────────────────────────────────
    const helpBtn = widget.querySelector('.hrlg-help-btn');
    const helpPopup = widget.querySelector('.hrlg-help-popup');
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpBtn.classList.toggle('is-on', helpPopup.classList.toggle('hrlg-help-show'));
    });
    helpPopup.addEventListener('click', (e) => e.stopPropagation());
    const closeHelp = () => {
        if (!widget.isConnected) { document.removeEventListener('click', closeHelp); return; }
        helpPopup.classList.remove('hrlg-help-show'); helpBtn.classList.remove('is-on');
    };
    document.addEventListener('click', closeHelp);

    // ── Suppr / Retour arrière ────────────────────────────────────
    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    _initHorlogeWidget(widget, uid);

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();
    return widget;
}

// ── Mise à l'échelle + poignée de redimensionnement ───────────────
//  Toute la mise en page est en « em » : une seule valeur (la taille de
//  police du conteneur) agrandit ou réduit le widget d'un bloc, en gardant
//  ses proportions. La taille est bornée pour rester dans le tableau.
const HRLG_MIN_FS = 8;
const HRLG_MAX_FS = 60;

function _initHorlogeResize(widget) {
    const cont = widget.querySelector('.hrlg-container');
    if (!cont) return;

    const handle = document.createElement('div');
    handle.className = 'hrlg-custom-resize-handle';
    handle.title = 'Redimensionner';
    handle.textContent = '⤡';
    cont.appendChild(handle);

    const isFull = () => cont.classList.contains('wf-fullboard');
    const setFs = (fs) => { cont.style.fontSize = fs + 'px'; };
    const getFs = () => parseFloat(cont.style.fontSize) || 15;

    // facteur de zoom éventuel du tableau (transform: scale)
    const zoom = () => {
        const w = cont.offsetWidth;
        return w ? (cont.getBoundingClientRect().width / w) || 1 : 1;
    };

    // Taille maximale autorisée pour rester dans le tableau (ou la fenêtre)
    function maxFsInBoard() {
        const fs = getFs();
        const r = cont.getBoundingClientRect();
        const z = zoom();
        const board = document.getElementById('board');
        const br = board ? board.getBoundingClientRect() : { right: window.innerWidth, bottom: window.innerHeight };
        const right  = Math.min(br.right,  window.innerWidth)  - 8;
        const bottom = Math.min(br.bottom, window.innerHeight) - 8;
        const availW = (right  - r.left) / z, availH = (bottom - r.top) / z;
        const wEm = cont.offsetWidth / fs, hEm = cont.offsetHeight / fs;
        if (availW <= 0 || availH <= 0) return HRLG_MAX_FS;
        return Math.max(HRLG_MIN_FS, Math.min(availW / wEm, availH / hEm));
    }

    // Plein écran : on calcule la taille qui remplit l'écran sans déborder
    function fitFullscreen() {
        const header = cont.querySelector('.hrlg-header');
        const body   = cont.querySelector('.hrlg-body');
        const side   = cont.querySelector('.hrlg-side');
        const landscape = true;
        for (let i = 0; i < 2; i++) {           // 2 passes : les éléments en px fixes faussent un peu le 1er calcul
            const fs = getFs();
            const hdrEm  = header.offsetHeight / fs;
            const sideEm = side.offsetHeight / fs;
            const cs = getComputedStyle(body);
            const padV = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) / fs;
            const padH = (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) / fs;
            const gap  = parseFloat(cs.columnGap || cs.gap) / fs || 1;
            const wEm = landscape ? 20 + gap + side.offsetWidth / fs + padH : 20 + padH;
            const hEm = hdrEm + padV + (landscape ? Math.max(20, sideEm) : 20 + gap + sideEm);
            setFs(Math.max(HRLG_MIN_FS, Math.min(window.innerWidth * 0.96 / wEm, window.innerHeight * 0.97 / hEm)));
        }
    }

    function applyScale() {
        if (isFull()) { fitFullscreen(); return; }
        setFs(widget._hrlgFs || 15);
        if (widget._hrlgSyncFrame) widget._hrlgSyncFrame();
    }
    widget._hrlgApplyScale = applyScale;

    // Taille initiale : ~26 % de la largeur de l'écran, sans dépasser la hauteur visible
    widget._hrlgFs = Math.max(10, Math.min(window.innerWidth * 0.42 / 41, 20));
    setFs(widget._hrlgFs);
    requestAnimationFrame(() => {
        if (!widget.isConnected || isFull()) return;
        const m = maxFsInBoard();
        if (widget._hrlgFs > m) { widget._hrlgFs = m; setFs(m); }
    });

    // Glisser la poignée : on projette le déplacement sur la diagonale du widget
    handle.addEventListener('pointerdown', (e) => {
        if (isFull()) return;
        e.preventDefault(); e.stopPropagation();
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
        const z = zoom();
        const w0 = cont.offsetWidth, h0 = cont.offsetHeight, fs0 = getFs();
        const x0 = e.clientX, y0 = e.clientY;
        const maxFs = Math.min(HRLG_MAX_FS, maxFsInBoard());
        const move = (ev) => {
            if (ev.pointerId !== e.pointerId) return;
            const dx = (ev.clientX - x0) / z, dy = (ev.clientY - y0) / z;
            const k = 1 + (dx * w0 + dy * h0) / (w0 * w0 + h0 * h0);
            const fs = Math.max(HRLG_MIN_FS, Math.min(maxFs, fs0 * k));
            widget._hrlgFs = Math.round(fs * 100) / 100;
            setFs(widget._hrlgFs);
        };
        const up = (ev) => {
            if (ev.pointerId !== e.pointerId) return;
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', up);
            handle.removeEventListener('pointercancel', up);
            if (widget._hrlgSyncFrame) widget._hrlgSyncFrame();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
    });
    handle.addEventListener('mousedown', (e) => e.stopPropagation());
    handle.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); }, { passive: false });

    // ── Poignée du tableau (largeur seule) ──────────────────────────
    //  La poignée générique du tableau change la largeur du widget (ou de
    //  son conteneur). On en déduit la taille de police : tout le contenu
    //  suit, hauteur comprise, et le cadre du widget reste collé au contenu.
    const ec = widget.querySelector('.hrlg-ec');
    let syncing = false;
    const isCollapsed = () => widget.classList.contains('hrlg-collapsed') || !!widget.querySelector(':scope > .wf-mini-bar');

    // largeur / hauteur « naturelles » du contenu, exprimées en em
    function naturalEm() {
        const fs = getFs(), prev = cont.style.width;
        cont.style.width = '';
        const r = { w: cont.offsetWidth / fs, h: cont.offsetHeight / fs };
        cont.style.width = prev;
        return r;
    }

    // Recolle le cadre du widget à la taille réelle du contenu
    function syncFrame() {
        if (isCollapsed()) return;
        syncing = true;
        cont.style.width = '';
        if (ec && ec.style.width) ec.style.width = '';
        if (widget.style.width)  widget.style.width  = cont.offsetWidth + 'px';
        if (widget.style.height) widget.style.height = '';
        if (ec && ec.style.height) ec.style.height = '';
        if (cont.style.height) cont.style.height = '';
        Promise.resolve().then(() => { syncing = false; });
    }
    widget._hrlgSyncFrame = syncFrame;

    // Redimensionnement uniquement proportionnel et fluide.
    //  Au début du geste on mémorise la taille de départ ; ensuite chaque
    //  nouvelle largeur/hauteur imposée par la poignée du tableau est
    //  comparée à ce départ (et non à l'étape précédente), ce qui évite
    //  les à-coups. Le cadre n'est recollé au contenu qu'à la fin du geste.
    let gesture = null;
    const readStyle = (prop) => {
        for (const el of [cont, ec, widget]) {
            const v = el && parseFloat(el.style[prop]);
            if (v > 0) return v;
        }
        return NaN;
    };
    const startGesture = () => {
        gesture = {
            fs: getFs(),
            w: cont.offsetWidth, h: cont.offsetHeight,
            sw: readStyle('width'), sh: readStyle('height'),
            maxFs: Math.min(HRLG_MAX_FS, maxFsInBoard()),
        };
    };
    const onPress = () => { if (!isFull() && !isCollapsed()) startGesture(); };
    widget.addEventListener('pointerdown', onPress, true);
    widget.addEventListener('mousedown', () => { if (!gesture) onPress(); }, true);
    widget.addEventListener('touchstart', () => { if (!gesture) onPress(); }, { capture: true, passive: true });

    function onExternalResize() {
        if (syncing || isFull() || isCollapsed()) return;
        const W = readStyle('width'), H = readStyle('height');
        if (!(W > 0) && !(H > 0)) return;
        // hors geste (programme, chargement…) : calcul ponctuel depuis la taille actuelle
        const single = !gesture;
        const g = gesture || {
            fs: getFs(), w: cont.offsetWidth, h: cont.offsetHeight, sw: NaN, sh: NaN,
            maxFs: Math.min(HRLG_MAX_FS, maxFsInBoard()),
        };
        // déplacement depuis le départ (si la poignée ne touche pas une dimension, elle reste à 0)
        const dW = W > 0 ? W - (g.sw > 0 ? g.sw : g.w) : 0;
        const dH = H > 0 ? H - (g.sh > 0 ? g.sh : g.h) : 0;
        let k;
        if (dW && dH) k = 1 + (dW * g.w + dH * g.h) / (g.w * g.w + g.h * g.h);   // diagonale
        else if (dW)  k = 1 + dW / g.w;                                         // largeur seule
        else if (dH)  k = 1 + dH / g.h;                                         // hauteur seule
        else return;
        const fs = Math.max(HRLG_MIN_FS, Math.min(g.maxFs, g.fs * k));
        widget._hrlgFs = Math.round(fs * 100) / 100;
        setFs(widget._hrlgFs);
        if (single) syncFrame();
    }

    if (typeof MutationObserver !== 'undefined') {
        const mo = new MutationObserver(onExternalResize);
        [widget, ec, cont].forEach(el => el && mo.observe(el, { attributes: true, attributeFilter: ['style'] }));
    }
    // Fin du geste : on recolle le cadre au contenu
    const endExternal = () => {
        if (!widget.isConnected) { ['mouseup','touchend','pointerup','pointercancel'].forEach(t => window.removeEventListener(t, endExternal, true)); return; }
        if (!gesture) return;
        setTimeout(() => {
            gesture = null;
            if (!isFull() && !isCollapsed()) syncFrame();
        }, 0);
    };
    ['mouseup','touchend','pointerup','pointercancel'].forEach(t => window.addEventListener(t, endExternal, true));
    window.addEventListener('resize', () => { if (widget.isConnected && isFull()) fitFullscreen(); });
}

// ── Heure en lettres ──────────────────────────────────────────────
const _HRLG_U = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze',
    'treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
const _HRLG_T = { 20: 'vingt', 30: 'trente', 40: 'quarante', 50: 'cinquante' };
function _hrlgNum(n) {
    if (n < 20) return _HRLG_U[n];
    const t = Math.floor(n / 10) * 10, u = n % 10;
    if (u === 0) return _HRLG_T[t];
    if (u === 1) return _HRLG_T[t] + ' et un';
    return _HRLG_T[t] + '-' + _HRLG_U[u];
}
const _hrlgFem = (s) => s.replace(/un$/, 'une');
function _hrlgHourName(h24) {
    if (h24 === 0) return 'minuit';
    if (h24 === 12) return 'midi';
    const h = h24 % 12;
    return h === 1 ? 'une heure' : _hrlgFem(_hrlgNum(h)) + ' heures';
}
function _hrlgSuffix(h24, withPeriod) {
    if (!withPeriod || h24 === 0 || h24 === 12) return '';
    if (h24 < 12) return ' du matin';
    if (h24 < 18) return " de l'après-midi";
    return ' du soir';
}
// Lecture « courante » (et quart, moins le quart…)
function _hrlgSpoken(h24, m, withPeriod) {
    const MOINS = { 35: 'vingt-cinq', 40: 'vingt', 45: 'le quart', 50: 'dix', 55: 'cinq' };
    if (MOINS[m]) {
        const n = (h24 + 1) % 24;
        return _hrlgHourName(n) + ' moins ' + MOINS[m] + _hrlgSuffix(n, withPeriod);
    }
    let s = _hrlgHourName(h24);
    if (m === 15) s += ' et quart';
    else if (m === 30) s += (h24 % 12 === 0) ? ' et demi' : ' et demie';
    else if (m > 0) s += ' ' + _hrlgNum(m);
    return s + _hrlgSuffix(h24, withPeriod);
}
// Lecture « officielle » sur 24 h (quinze heures quarante-cinq)
function _hrlgFormal(h24, m) {
    const h = h24 === 0 ? 'zéro heure' : h24 === 1 ? 'une heure' : _hrlgFem(_hrlgNum(h24)) + ' heures';
    return h + (m ? ' ' + _hrlgNum(m) : '');
}

// ── Logique interne ───────────────────────────────────────────────
function _initHorlogeWidget(widget, uid) {
    uid = uid || ('hrlg' + Math.random().toString(36).slice(2, 8));
    const NS = 'http://www.w3.org/2000/svg';
    const cont        = widget.querySelector('.hrlg-container');
    const svg         = widget.querySelector('.hrlg-svg');
    const timeDisplay = widget.querySelector('.hrlg-time-display');
    const digitalBox  = widget.querySelector('.hrlg-digital');
    const wordsBox    = widget.querySelector('.hrlg-words');
    const wordsTxt    = widget.querySelector('.hrlg-words-txt');
    const wordsAlt    = widget.querySelector('.hrlg-words-alt');
    const showBtn     = widget.querySelector('[data-act="show"]');
    const taskTarget  = widget.querySelector('.hrlg-task-target');
    const taskFb      = widget.querySelector('.hrlg-task-fb');

    const state = {
        hours: 12, minutes: 0,
        showTime: true, showWords: true,           // réponse visible / masquée
        showDigital: true, showWordsCard: true,    // cartes présentes ou non
        arcs: {}, period: null,
        showMinNums: false, showHourNums: true, show24: false, showZones: false,
        level: 'quart', step: 1, taskWords: false,
    };
    let task = null;          // { total, done }
    let visTotal = 12 * 60;   // compteur continu pour des rotations fluides

    const commit = () => {
        if (typeof snapshotNow === 'function') snapshotNow();
        if (typeof saveBoard   === 'function') saveBoard();
    };
    const total = () => state.hours * 60 + state.minutes;
    const setTotal = (t) => {
        t = ((Math.round(t) % 1440) + 1440) % 1440;
        state.hours = Math.floor(t / 60); state.minutes = t % 60;
    };
    const eff24 = (h) => state.period === 'am' ? h % 12 : state.period === 'pm' ? (h % 12) + 12 : h;

    // ── Sauvegarde ────────────────────────────────────────────────
    widget._hrlgGetData = () => {
        const isFull = cont.classList.contains('wf-fullboard');
        const { hours, minutes, showTime, showWords, showDigital, showWordsCard, period,
                showMinNums, showHourNums, show24, showZones, level, step, taskWords } = state;
        return { hours, minutes, showTime, showWords, showDigital, showWordsCard, period,
                 showMinNums, showHourNums, show24, showZones, level, step, taskWords,
                 arcs: { ...state.arcs }, fs: widget._hrlgFs || null,
                 containerW: isFull ? null : cont.offsetWidth };
    };
    widget._hrlgSetData = (data) => {
        if (!data) return;
        ['hours','minutes','showTime','showWords','showDigital','showWordsCard','period','showMinNums',
         'showHourNums','show24','showZones','level','step','taskWords'].forEach(k => {
            if (data[k] !== undefined) state[k] = data[k];
        });
        if (data.arcs && typeof data.arcs === 'object') Object.assign(state.arcs, data.arcs);
        if (data.fs) widget._hrlgFs = Math.max(HRLG_MIN_FS, Math.min(HRLG_MAX_FS, Number(data.fs)));
        else if (data.containerW) widget._hrlgFs = Math.max(HRLG_MIN_FS, Math.min(HRLG_MAX_FS, data.containerW / 28)); // anciennes sauvegardes (horloge au-dessus)
        cont.style.width = '';
        if (widget._hrlgApplyScale) widget._hrlgApplyScale();
        visTotal = total();
        render();
    };

    // ── Construction du cadran ────────────────────────────────────
    const el = (tag, attrs, parent) => {
        const n = document.createElementNS(NS, tag);
        for (const k in attrs) n.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(n);
        return n;
    };
    const pt = (min, r) => {
        const a = (min * 6 - 90) * Math.PI / 180;
        return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
    };
    const sector = (m0, m1, r) => {
        if (m1 - m0 >= 60) return `M ${100 - r} 100 A ${r} ${r} 0 1 1 ${100 + r} 100 A ${r} ${r} 0 1 1 ${100 - r} 100 Z`;
        const [x1, y1] = pt(m0, r), [x2, y2] = pt(m1, r);
        return `M 100 100 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${m1 - m0 > 30 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    };

    const defs = el('defs', {}, svg);
    defs.innerHTML = `
        <linearGradient id="${uid}-bz" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a5b4fc"/><stop offset=".5" stop-color="#6366f1"/><stop offset="1" stop-color="#3730a3"/>
        </linearGradient>
        <radialGradient id="${uid}-cap"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d97706"/></radialGradient>
        <filter id="${uid}-sh" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1.2" dy="1.8" stdDeviation="1.4" flood-color="#000" flood-opacity=".3"/>
        </filter>`;

    el('circle', { cx: 100, cy: 100, r: 100, fill: `url(#${uid}-bz)`, filter: `url(#${uid}-sh)` }, svg);
    el('circle', { cx: 100, cy: 100, r: 92, fill: 'var(--h-face)', class: 'hrlg-face-c' }, svg);

    const gZones = el('g', {}, svg);
    el('path', { d: sector(0, 30, 92), fill: '#22c55e', 'fill-opacity': .13 }, gZones);
    el('path', { d: sector(30, 60, 92), fill: '#f97316', 'fill-opacity': .13 }, gZones);
    el('line', { x1: 100, y1: 8, x2: 100, y2: 192, stroke: '#64748b', 'stroke-width': .8, 'stroke-dasharray': '3 3' }, gZones);
    const zt1 = el('text', { x: 128, y: 128, 'font-size': 10, 'font-weight': 800, fill: '#16a34a', 'text-anchor': 'middle' }, gZones); zt1.textContent = 'et …';
    const zt2 = el('text', { x: 72, y: 128, 'font-size': 10, 'font-weight': 800, fill: '#ea580c', 'text-anchor': 'middle' }, gZones); zt2.textContent = 'moins …';

    const gArcs = el('g', {}, svg);

    const gTicks = el('g', {}, svg);
    for (let i = 0; i < 60; i++) {
        const big = i % 5 === 0;
        const [x1, y1] = pt(i, big ? 80 : 85), [x2, y2] = pt(i, 90);
        el('line', { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), class: big ? 'hrlg-tick-5' : 'hrlg-tick-min' }, gTicks);
    }

    const gNums = el('g', {}, svg);
    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((n, i) => {
        const [x, y] = pt(i * 5, 68);
        const t = el('text', { x: x.toFixed(2), y: y.toFixed(2), class: 'hrlg-number', 'font-size': 16, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, gNums);
        t.textContent = n;
    });
    const g24 = el('g', {}, svg);
    [24, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].forEach((n, i) => {
        const [x, y] = pt(i * 5, 51);
        const t = el('text', { x: x.toFixed(2), y: y.toFixed(2), class: 'hrlg-number24', 'font-size': 7.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g24);
        t.textContent = n;
    });
    const gMinNums = el('g', {}, svg);
    for (let n = 0; n < 60; n += 5) {
        const [x, y] = pt(n, 111);
        el('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: 7.8, fill: '#2563eb', stroke: '#fff', 'stroke-width': 1 }, gMinNums);
        const t = el('text', { x: x.toFixed(2), y: (y + .3).toFixed(2), class: 'hrlg-number-min', 'font-size': 7.2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, gMinNums);
        t.textContent = String(n).padStart(2, '0');
    }

    // Aiguilles (dessinées vers le haut, tournées par CSS)
    const gHour = el('g', { class: 'hrlg-hand-g', filter: `url(#${uid}-sh)` }, svg);
    el('path', { d: 'M 100 113 L 95 100 L 96.5 60 L 100 49 L 103.5 60 L 105 100 Z', fill: 'var(--h-hour)', stroke: 'var(--h-hour)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, gHour);
    const gMin = el('g', { class: 'hrlg-hand-g', filter: `url(#${uid}-sh)` }, svg);
    el('path', { d: 'M 100 116 L 96.8 100 L 98 28 L 100 15 L 102 28 L 103.2 100 Z', fill: 'var(--h-min)', stroke: 'var(--h-min)', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, gMin);
    el('circle', { cx: 100, cy: 100, r: 6, fill: `url(#${uid}-cap)`, stroke: '#fff', 'stroke-width': 1.5 }, svg);

    // Zones de saisie (larges, invisibles) — heures au-dessus près du centre
    const gHitMin = el('g', { class: 'hrlg-hit-g' }, svg);
    el('line', { x1: 100, y1: 100, x2: 100, y2: 14, class: 'hrlg-hit hrlg-hit-min', 'stroke-width': 22 }, gHitMin);
    const gHitHour = el('g', { class: 'hrlg-hit-g' }, svg);
    el('line', { x1: 100, y1: 100, x2: 100, y2: 46, class: 'hrlg-hit hrlg-hit-hour', 'stroke-width': 26 }, gHitHour);

    // ── Rendu ─────────────────────────────────────────────────────
    function render() {
        // rotation continue (évite le « retour en arrière » de 359° → 0°)
        let d = total() - (((visTotal % 1440) + 1440) % 1440);
        if (d > 720) d -= 1440; else if (d < -720) d += 1440;
        visTotal += d;
        gMin.style.transform = gHitMin.style.transform = `rotate(${visTotal * 6}deg)`;
        gHour.style.transform = gHitHour.style.transform = `rotate(${visTotal * 0.5}deg)`;

        gNums.style.display    = state.showHourNums ? '' : 'none';
        g24.style.display      = state.show24 ? '' : 'none';
        gMinNums.style.display = state.showMinNums ? '' : 'none';
        gZones.style.display   = state.showZones ? '' : 'none';

        gArcs.innerHTML = '';
        Object.entries(HRLG_ARC_DEFS).forEach(([k, def]) => {
            if (!state.arcs[k]) return;
            el('path', { d: sector(def.startMin, def.endMin, 91), fill: def.color, 'fill-opacity': .28, stroke: def.color, 'stroke-width': 1.2 }, gArcs);
        });

        // Heure numérique
        const h24 = eff24(state.hours);
        const hTxt = state.period ? String(h24).padStart(2, '0') : String((state.hours % 12) || 12);
        timeDisplay.innerHTML = `<span class="hrlg-td-h">${hTxt}</span><span class="hrlg-colon">:</span><span class="hrlg-td-m">${String(state.minutes).padStart(2, '0')}</span>`;

        // Heure en lettres
        const spoken = _hrlgSpoken(h24, state.minutes, !!state.period);
        wordsTxt.textContent = 'Il est ' + spoken + '.';
        const formal = (state.period && h24 >= 13) ?_hrlgFormal(h24, state.minutes) : '';
        wordsAlt.textContent = formal ? '(ou ' + formal + ')' : '';
        wordsAlt.style.display = formal ? '' : 'none';

        digitalBox.classList.toggle('is-hidden', !state.showTime);
        wordsBox.classList.toggle('is-hidden', !state.showWords);
        digitalBox.classList.toggle('hrlg-off', !state.showDigital);
        wordsBox.classList.toggle('hrlg-off', !state.showWordsCard);
        const anyHidden = (state.showDigital && !state.showTime) || (state.showWordsCard && !state.showWords);
        showBtn.textContent = anyHidden ? '👁 Réponse' : '🙈 Cacher';

        // Exercice « placer »
        cont.classList.toggle('hrlg-in-task', !!task);
        cont.classList.toggle('hrlg-task-done', !!(task && task.done));
        if (task) {
            const th = Math.floor(task.total / 60), tm = task.total % 60, te = eff24(th);
            if (state.taskWords) {
                taskTarget.textContent = _hrlgSpoken(te, tm, !!state.period);
                taskTarget.classList.add('is-words');
            } else {
                const ht = state.period ? String(te).padStart(2, '0') : String((th % 12) || 12);
                taskTarget.textContent = ht + ':' + String(tm).padStart(2, '0');
                taskTarget.classList.remove('is-words');
            }
        }

        // Pastilles de réglages
        widget.querySelectorAll('.hrlg-chip[data-opt]').forEach(c => c.classList.toggle('is-on', !!state[c.dataset.opt]));
        widget.querySelectorAll('.hrlg-chip[data-arc]').forEach(c => c.classList.toggle('is-on', !!state.arcs[c.dataset.arc]));
        widget.querySelectorAll('.hrlg-chip[data-period]').forEach(c => c.classList.toggle('is-on', (c.dataset.period === 'none' ? null : c.dataset.period) === state.period));
        widget.querySelectorAll('.hrlg-chip[data-level]').forEach(c => c.classList.toggle('is-on', c.dataset.level === String(state.level)));
        widget.querySelectorAll('.hrlg-chip[data-step]').forEach(c => c.classList.toggle('is-on', Number(c.dataset.step) === Number(state.step)));
    }

    // ── Manipulation des aiguilles (souris, doigt, stylet) ────────
    let drag = null;
    const polar = (e) => {
        const r = svg.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        let a = Math.atan2(dx, -dy) * 180 / Math.PI; if (a < 0) a += 360;
        return { a, dist: Math.hypot(dx, dy) / (r.width / 2) * 122 };
    };
    const applyAngle = (a) => {
        let d = a - drag.last; d = ((d + 540) % 360) - 180;
        drag.last = a;
        drag.acc += drag.hand === 'min' ? d / 6 : d * 2;
        const step = Number(state.step) || 1;
        setTotal(Math.round(drag.acc / step) * step);
        if (task && task.done) { task.done = false; taskFb.textContent = ''; taskFb.className = 'hrlg-task-fb'; }
        render();
    };
    const onMove = (e) => { if (drag && e.pointerId === drag.id) { e.preventDefault(); applyAngle(polar(e).a); } };
    const onUp = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        cont.classList.remove('hrlg-dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        commit();
    };
    svg.addEventListener('pointerdown', (e) => {
        if (e.button > 0 || drag) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        const { a, dist } = polar(e);
        let hand;
        if (e.target.classList.contains('hrlg-hit-hour')) hand = 'hour';
        else if (e.target.classList.contains('hrlg-hit-min')) hand = 'min';
        else hand = dist < 58 ? 'hour' : 'min';
        const t = total();
        drag = { hand, id: e.pointerId, acc: t, last: hand === 'min' ? (t % 60) * 6 : (t % 720) / 2 };
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
        cont.classList.add('hrlg-dragging');
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        applyAngle(a);
    });
    // Empêche le déplacement du widget quand on manipule le cadran
    svg.addEventListener('mousedown', (e) => e.stopPropagation());
    svg.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); }, { passive: false });

    // ── Boutons ±1 h / ±5 min / ±1 min ────────────────────────────
    widget.querySelectorAll('.hrlg-step').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        setTotal(total() + Number(b.dataset.delta));
        if (task && task.done) { task.done = false; taskFb.textContent = ''; }
        render(); commit();
    }));

    // ── Cacher / révéler en touchant les cartes ───────────────────
    digitalBox.addEventListener('click', (e) => { e.stopPropagation(); state.showTime = !state.showTime; render(); commit(); });
    wordsBox.addEventListener('click',   (e) => { e.stopPropagation(); state.showWords = !state.showWords; render(); commit(); });

    // ── Tirage au hasard selon le niveau ──────────────────────────
    const randomTotal = () => {
        const L = String(state.level);
        const pool = L === 'h' ? [0] : L === 'demi' ? [0, 30] : L === 'quart' ? [0, 15, 30, 45]
                   : L === '5' ? [0,5,10,15,20,25,30,35,40,45,50,55] : null;
        let t, guard = 0;
        do {
            const m = pool ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * 60);
            t = Math.floor(Math.random() * 24) * 60 + m;
        } while ((t % 720) === (total() % 720) && guard++ < 20);
        return t;
    };

    // ── Actions principales ───────────────────────────────────────
    const actions = {
        read() {
            task = null;
            setTotal(randomTotal());
            state.showTime = false; state.showWords = false;
        },
        place() {
            task = { total: randomTotal(), done: false };
            setTotal(12 * 60);
            taskFb.textContent = ''; taskFb.className = 'hrlg-task-fb';
        },
        show() {
            const anyHidden = (state.showDigital && !state.showTime) || (state.showWordsCard && !state.showWords);
            state.showTime = state.showWords = anyHidden;
        },
        now() {
            task = null;
            const d = new Date();
            setTotal(d.getHours() * 60 + d.getMinutes());
        },
        reset() { task = null; setTotal(12 * 60); },
    };
    widget.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        actions[b.dataset.act]();
        render(); commit();
    }));

    // ── Exercice « placer les aiguilles » ─────────────────────────
    const flashOk = () => {
        cont.classList.remove('hrlg-flash-ok'); void cont.offsetWidth; cont.classList.add('hrlg-flash-ok');
    };
    const feedback = (cls, txt) => {
        taskFb.className = 'hrlg-task-fb'; void taskFb.offsetWidth;
        taskFb.className = 'hrlg-task-fb ' + cls; taskFb.textContent = txt;
    };
    widget.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!task && b.dataset.task !== 'quit') return;
        switch (b.dataset.task) {
            case 'check': {
                const cur = total() % 720, tgt = task.total % 720;
                if (cur === tgt) {
                    task.done = true; state.showTime = state.showWords = true;
                    feedback('ok', '🎉 Bravo, c\'est juste !'); flashOk();
                } else {
                    const msgs = [];
                    if (Math.floor(cur / 60) !== Math.floor(tgt / 60)) msgs.push('la petite aiguille 🔴');
                    if (cur % 60 !== tgt % 60) msgs.push('la grande aiguille 🔵');
                    feedback('ko', '🤔 Pas encore… vérifie ' + msgs.join(' et ') + '.');
                }
                break;
            }
            case 'solution':
                setTotal(task.total); task.done = true; state.showTime = state.showWords = true;
                feedback('', '💡 Voici la solution.');
                break;
            case 'next':
                actions.place();
                break;
            case 'quit':
                task = null;
                break;
        }
        render(); commit();
    }));

    // ── Réglages ──────────────────────────────────────────────────
    const settingsToggle = widget.querySelector('.hrlg-settings-toggle');
    const settingsBar    = widget.querySelector('.hrlg-settings-bar');
    widget.querySelector('.hrlg-settings-close').addEventListener('click', (e) => {
        e.stopPropagation();
        settingsBar.classList.add('hrlg-settings-hidden');
        settingsToggle.classList.remove('is-on');
    });
    settingsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const hidden = settingsBar.classList.toggle('hrlg-settings-hidden');
        settingsToggle.classList.toggle('is-on', !hidden);
    });
    settingsBar.addEventListener('click', (e) => {
        const c = e.target.closest('.hrlg-chip');
        if (!c) return;
        e.stopPropagation();
        if (c.dataset.opt) {
            const k = c.dataset.opt;
            state[k] = !state[k];
            // garder au moins une carte d'affichage
            if (!state.showDigital && !state.showWordsCard) state[k === 'showDigital' ? 'showWordsCard' : 'showDigital'] = true;
        }
        else if (c.dataset.arc)    state.arcs[c.dataset.arc] = !state.arcs[c.dataset.arc];
        else if (c.dataset.period) state.period = c.dataset.period === 'none' ? null : c.dataset.period;
        else if (c.dataset.level)  state.level = c.dataset.level;
        else if (c.dataset.step)   state.step = Number(c.dataset.step);
        render(); commit();
    });

    // ── Clavier ───────────────────────────────────────────────────
    widget.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const step = Number(state.step) || 1;
        const map = { ArrowRight: step, ArrowLeft: -step, ArrowUp: 60, ArrowDown: -60 };
        if (!(e.key in map)) return;
        e.preventDefault(); e.stopPropagation();
        setTotal(total() + map[e.key]);
        render(); commit();
    });

    render();
}
