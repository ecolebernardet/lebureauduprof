// ══════════════════════════════════════════════════════════════════
//  widget-couleurs.js  —  Mélangeur de couleurs interactif
// ══════════════════════════════════════════════════════════════════

function createCouleursWidget() {

    // ── CSS (injecté une seule fois) ──────────────────────────────
    const _existingStyle = document.getElementById('clr-style');
    if (_existingStyle) _existingStyle.remove();
    {
        const s = document.createElement('style');
        s.id = 'clr-style';
        s.textContent = `
        .widget[data-type="couleurs"] {
            cursor: move;
            overflow: visible !important;
        }
        .widget[data-type="couleurs"] button { cursor: pointer; }
        .widget[data-type="couleurs"] .custom-resize-handle { cursor: se-resize; }
        .widget[data-type="couleurs"] .drag-handle { cursor: move; }

        .clr-ec {
            overflow: visible !important;
            display: flex;
            flex-direction: column;
            height: auto !important;
        }

        /* ── Fullboard ── */
        .clr-container.clr-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            font-size: 14px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            overflow-y: auto !important;
        }
        .clr-container.clr-fullboard .clr-header {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            flex-shrink: 0 !important;
        }
        .clr-container.clr-fullboard .clr-body {
            width: min(900px, 92vw) !important;
            padding: 1.5em 1em !important;
        }
        .clr-container.clr-fullboard .clr-result-circle {
            width: 200px !important;
            height: 200px !important;
        }
        .clr-container.clr-fullboard .clr-palette-btn {
            width: 70px !important;
            height: 70px !important;
            font-size: 0.75em !important;
        }

        /* ── Container ── */
        .clr-container {
            display: flex;
            flex-direction: column;
            background: #12122a;
            border-radius: 14px;
            border: 0.07em solid #2e2e50;
            box-shadow: 0 0.3em 1.4em rgba(0,0,0,.35);
            font-size: 14px;
            min-width: 260px;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
        }

        /* ── Header ── */
        .clr-header {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.55em 0.85em;
            background: #1a1a38;
            border-bottom: 0.07em solid #2e2e50;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            border-radius: 14px 14px 0 0;
        }
        .clr-title { font-size: 0.82em; font-weight: 700; color: #a5b4fc; letter-spacing: 0.03em; }

        /* ── Help btn ── */
        .clr-help-btn {
            background: rgba(165,180,252,.12); border: 0.07em solid rgba(165,180,252,.3);
            color: #a5b4fc; font-size: 0.65em; font-weight: 700;
            width: 1.7em; height: 1.7em; border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
            flex-shrink: 0;
        }

        /* ── Help popup ── */
        .clr-help-popup {
            display: none; position: absolute; top: 3em; left: 0.8em; right: 0.8em;
            background: #1e1e40; border: 1px solid #3a3a60; border-radius: 10px;
            padding: 0.8em 1em; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,.5);
            color: #c7d2fe; font-size: 0.8em; line-height: 1.5;
        }
        .clr-help-popup.clr-help-show { display: block; }
        .clr-help-popup h4 { margin: 0 0 0.5em; color: #a5b4fc; font-size: 1em; }
        .clr-help-section { margin-bottom: 0.5em; }
        .clr-help-section:last-child { margin-bottom: 0; }

        /* ── Body ── */
        .clr-body {
            display: flex;
            flex-direction: column;
            padding: 1em 0.85em;
            gap: 1em;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }

        /* ── Palette source ── */
        .clr-section-title {
            font-size: 0.78em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.1em;
            color: #6366f1; opacity: 0.8;
            margin-bottom: 0.4em;
        }

        .clr-palette {
            display: flex;
            gap: 0.6em;
            flex-wrap: wrap;
            align-items: center;
        }

        .clr-palette-btn {
            width: 68px;
            height: 68px;
            border-radius: 50%;
            border: 3px solid transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.72em;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: rgba(255,255,255,0.9);
            text-shadow: 0 1px 3px rgba(0,0,0,0.6);
            transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
            flex-shrink: 0;
            position: relative;
            user-select: none;
        }
        .clr-palette-btn:hover { transform: scale(1.1); }
        .clr-palette-btn:active { transform: scale(0.95); }
        .clr-palette-btn.clr-selected {
            border-color: #fff;
            box-shadow: 0 0 0 2px #6366f1, 0 0 14px rgba(99,102,241,.5);
        }
        .clr-palette-btn .clr-btn-qty {
            position: absolute;
            bottom: -6px; right: -4px;
            background: #1a1a38;
            color: #a5b4fc;
            font-size: 1.2em;
            font-weight: 900;
            border-radius: 50%;
            width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid #3a3a60;
            line-height: 1;
        }
        /* Noir : texte en blanc visible */
        .clr-palette-btn[data-color="noir"] { color: rgba(255,255,255,0.7); text-shadow: none; }
        /* Blanc : texte sombre */
        .clr-palette-btn[data-color="blanc"] { color: rgba(0,0,0,0.6); text-shadow: none; }

        /* ── Zone de mélange ── */
        .clr-mix-zone {
            display: flex;
            align-items: center;
            gap: 1em;
            flex-wrap: wrap;
        }

        .clr-bucket {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4em;
            flex: 1;
            min-width: 120px;
        }

        .clr-bucket-label {
            font-size: 0.78em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: #c7d2fe; opacity: 0.6;
        }

        .clr-bucket-preview {
            width: 130px; height: 130px;
            border-radius: 50%;
            border: 3px solid #2e2e50;
            background: #1c1c3a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75em;
            color: rgba(255,255,255,0.35);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            transition: background-color 0.4s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .clr-bucket-preview:hover { border-color: #6366f1; }

        .clr-bucket-clear-btn {
            font-size: 0.72em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.05em;
            color: #f87171; border: 1px solid rgba(248,113,113,.3);
            background: transparent; border-radius: 0.5em;
            padding: 0.2em 0.6em; cursor: pointer;
            transition: background 0.15s, opacity 0.15s;
            opacity: 0;
            pointer-events: none;
        }
        .clr-bucket-clear-btn.clr-bucket-has-color {
            opacity: 1;
            pointer-events: auto;
        }
        .clr-bucket-clear-btn:hover { background: rgba(248,113,113,.1); }
        .clr-bucket-clear-btn:active { transform: scale(0.94); }

        .clr-bucket-ingredients {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            justify-content: center;
            max-width: 110px;
            min-height: 20px;
        }
        .clr-ingredient-dot {
            width: 14px; height: 14px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
        }

        /* ── Flèche ── */
        .clr-arrow {
            font-size: 1.8em;
            color: #6366f1;
            opacity: 0.5;
            flex-shrink: 0;
        }

        /* ── Résultat ── */
        .clr-result-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.6em;
        }

        .clr-result-circle {
            width: 160px; height: 160px;
            border-radius: 50%;
            border: 4px solid #2e2e50;
            background: #1c1c3a;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: background-color 0.4s ease, border-color 0.3s;
            box-shadow: 0 0 20px rgba(0,0,0,0.4);
            position: relative;
        }
        .clr-result-circle.clr-has-result {
            box-shadow: 0 0 30px var(--clr-glow, rgba(99,102,241,.3));
        }

        .clr-result-name {
            font-size: 0.92em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.05em;
            color: rgba(255,255,255,0.9);
            text-shadow: 0 1px 4px rgba(0,0,0,0.6);
            text-align: center;
            padding: 0 8px;
            line-height: 1.2;
        }
        .clr-result-hex {
            font-size: 0.72em; font-weight: 600;
            color: rgba(255,255,255,0.55);
            margin-top: 2px;
            font-family: monospace;
        }

        .clr-result-desc {
            font-size: 0.88em;
            color: #c7d2fe;
            text-align: center;
            line-height: 1.5;
            opacity: 0.8;
            min-height: 2.5em;
            font-style: italic;
        }

        /* ── Boutons action ── */
        .clr-actions {
            display: flex;
            gap: 0.5em;
            justify-content: center;
            flex-wrap: wrap;
        }
        .clr-action-btn {
            font-size: 0.78em; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.04em;
            border-radius: 0.5em; padding: 0.35em 0.75em;
            border: 0.1em solid; cursor: pointer;
            transition: transform 0.15s;
            background: transparent;
        }
        .clr-action-btn:active { transform: scale(0.94); }
        .clr-btn-reset-mix { color: #fb923c; border-color: rgba(251,146,60,.3); }
        .clr-btn-save      { color: #34d399; border-color: rgba(52,211,153,.3); }

        /* ── Palette sauvegardée ── */
        .clr-saved-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
            align-items: center;
            min-height: 28px;
        }
        .clr-saved-chip {
            display: flex;
            align-items: center;
            gap: 0.3em;
            border-radius: 2em;
            padding: 0.2em 0.5em;
            border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer;
            transition: transform 0.12s;
            font-size: 0.6em;
            font-weight: 700;
            color: rgba(255,255,255,0.8);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            user-select: none;
        }
        .clr-saved-chip:hover { transform: scale(1.07); border-color: rgba(255,255,255,0.35); }
        .clr-saved-chip .clr-chip-dot {
            width: 12px; height: 12px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
        }
        .clr-saved-chip .clr-chip-del {
            opacity: 0.4;
            font-size: 1.1em;
            line-height: 1;
            margin-left: 2px;
        }
        .clr-saved-chip:hover .clr-chip-del { opacity: 1; }
        .clr-saved-empty {
            font-size: 0.6em;
            color: #6366f1;
            opacity: 0.45;
            font-style: italic;
        }

        /* ── Séparateur ── */
        .clr-sep {
            border: none;
            border-top: 1px solid #2e2e50;
            margin: 0;
        }

        /* ── Toast ── */
        .clr-toast {
            position: absolute;
            bottom: 1em; left: 50%; transform: translateX(-50%);
            background: #6366f1;
            color: #fff;
            font-size: 0.65em; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.06em;
            padding: 0.4em 1em;
            border-radius: 2em;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 100;
            white-space: nowrap;
        }
        .clr-toast.clr-toast-show { opacity: 1; }

        /* ── Mode clair ── */
        body.menu-light .clr-container { background: #f4f5ff; border-color: #d4d4e8; }
        body.menu-light .clr-header    { background: #eef0f8; border-bottom-color: #d4d4e8; }
        body.menu-light .clr-title     { color: #4338ca; }
        body.menu-light .clr-help-btn  { background: rgba(67,56,202,.08); border-color: rgba(67,56,202,.3); color: #4338ca; }
        body.menu-light .clr-section-title { color: #4338ca; }
        body.menu-light .clr-bucket-label { color: #312e81; }
        body.menu-light .clr-bucket-preview { border-color: #d4d4e8; background: #fff; }
        body.menu-light .clr-result-circle { border-color: #d4d4e8; background: #e8eaff; }
        body.menu-light .clr-result-desc   { color: #312e81; }
        body.menu-light .clr-saved-empty   { color: #4338ca; }
        body.menu-light .clr-sep { border-color: #d4d4e8; }
        body.menu-light .clr-help-popup { background: #fff; border-color: #d4d4e8; color: #312e81; }
        body.menu-light .clr-help-popup h4 { color: #4338ca; }
        body.menu-light .clr-saved-chip { color: rgba(0,0,0,0.75); border-color: rgba(0,0,0,0.15); }
        `;
        document.head.appendChild(s);
    }

    // ── Widget DOM ───────────────────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'couleurs';
    widget.dataset.transparent = 'true';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 100 };
    const initW = 680;
    const initH = 660;
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px; top:${p.y}px; overflow:visible;`;

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
    ec.className = 'clr-ec';
    ec.style.overflow = 'visible';

    ec.innerHTML = `
        <div class="clr-container" style="width:${initW}px; min-height:${initH}px; position:relative;">
            <div class="clr-header">
                <span class="clr-title">🎨 Mélange de couleurs</span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="clr-help-btn" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>
            <div class="clr-help-popup">
                <h4>🎨 Mélangeur de couleurs</h4>
                <div class="clr-help-section"><strong>1. Choisir une couleur</strong><br>Clique sur une couleur de la palette pour la sélectionner.</div>
                <div class="clr-help-section"><strong>2. Verser dans un pot</strong><br>Clique sur un pot (A, B ou C) pour y ajouter la couleur choisie. Tu peux ajouter la même plusieurs fois !</div>
                <div class="clr-help-section"><strong>3. Voir le résultat</strong><br>Le mélange se calcule automatiquement à droite. Plus tu ajoutes d'une couleur, plus elle domine.</div>
                <div class="clr-help-section"><strong>🔄 Vider un pot</strong><br>Clique sur un pot pour le vider.</div>
                <div class="clr-help-section"><strong>💾 Sauvegarder</strong><br>Garde une couleur créée dans ta palette personnelle en bas.</div>
            </div>
            <div class="clr-body">

                <!-- Palette source -->
                <div>
                    <div class="clr-section-title">Palette de base</div>
                    <div class="clr-palette" id="clr-palette">
                        <button class="clr-palette-btn" data-color="rouge"  style="background:#ff0000" title="Rouge">Rouge</button>
                        <button class="clr-palette-btn" data-color="vert"   style="background:#008000" title="Vert">Vert</button>
                        <button class="clr-palette-btn" data-color="jaune"  style="background:#ffff00; color:rgba(0,0,0,0.6); text-shadow:none;" title="Jaune">Jaune</button>
                        <button class="clr-palette-btn" data-color="bleu"   style="background:#0000ff" title="Bleu">Bleu</button>
                        <button class="clr-palette-btn" data-color="blanc"  style="background:#ffffff; border:2px solid #aaa; color:rgba(0,0,0,0.6); text-shadow:none;" title="Blanc">Blanc</button>
                        <button class="clr-palette-btn" data-color="noir"   style="background:#000000" title="Noir">Noir</button>
                    </div>
                </div>

                <hr class="clr-sep">

                <!-- Zone de mélange -->
                <div>
                    <div class="clr-section-title">Mélange — clique sur une couleur puis sur un pot</div>
                    <div class="clr-mix-zone">
                        <div class="clr-bucket" id="clr-bucket-0">
                            <div class="clr-bucket-label">Pot A</div>
                            <div class="clr-bucket-preview" data-bucket="0" title="Cliquer pour ajouter la couleur sélectionnée">
                                <span class="clr-bucket-empty-hint">vide</span>
                            </div>
                            <div class="clr-bucket-ingredients" id="clr-ing-0"></div>
                            <button class="clr-bucket-clear-btn" data-clear="0" title="Vider le pot A">🗑️ Vider</button>
                        </div>
                        <div class="clr-bucket" id="clr-bucket-1">
                            <div class="clr-bucket-label">Pot B</div>
                            <div class="clr-bucket-preview" data-bucket="1" title="Cliquer pour ajouter la couleur sélectionnée">
                                <span class="clr-bucket-empty-hint">vide</span>
                            </div>
                            <div class="clr-bucket-ingredients" id="clr-ing-1"></div>
                            <button class="clr-bucket-clear-btn" data-clear="1" title="Vider le pot B">🗑️ Vider</button>
                        </div>
                        <div class="clr-bucket" id="clr-bucket-2">
                            <div class="clr-bucket-label">Pot C</div>
                            <div class="clr-bucket-preview" data-bucket="2" title="Cliquer pour ajouter la couleur sélectionnée">
                                <span class="clr-bucket-empty-hint">vide</span>
                            </div>
                            <div class="clr-bucket-ingredients" id="clr-ing-2"></div>
                            <button class="clr-bucket-clear-btn" data-clear="2" title="Vider le pot C">🗑️ Vider</button>
                        </div>

                        <div class="clr-arrow">→</div>

                        <!-- Résultat -->
                        <div class="clr-result-area">
                            <div class="clr-bucket-label">Résultat</div>
                            <div class="clr-result-circle" id="clr-result-circle">
                                <span class="clr-result-name" id="clr-result-name">?</span>
                                <span class="clr-result-hex"  id="clr-result-hex"></span>
                            </div>
                            <div class="clr-result-desc" id="clr-result-desc">Ajoute des couleurs dans les pots…</div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="clr-actions">
                    <button class="clr-action-btn clr-btn-reset-mix" id="clr-reset-btn">🔄 Tout vider</button>
                    <button class="clr-action-btn clr-btn-save"      id="clr-save-btn">💾 Sauvegarder cette couleur</button>
                </div>

                <hr class="clr-sep">

                <!-- Couleurs sauvegardées -->
                <div>
                    <div class="clr-section-title">Mes créations</div>
                    <div class="clr-saved-row" id="clr-saved-row">
                        <span class="clr-saved-empty">Aucune couleur sauvegardée</span>
                    </div>
                </div>
            </div>
            <div class="clr-toast" id="clr-toast"></div>
        </div>`;

    widget.appendChild(ec);

    const board = document.getElementById('board');
    board.appendChild(widget);

    if (typeof bringToFront          === 'function') bringToFront(widget);
    if (typeof makeDraggable         === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate   === 'function') makeDraggableRotate(widget);
    // makeResizableByHandle cherche .editor-container/.snd-container etc. — on lui passe .clr-container
    // en créant la poignée manuellement avec la même logique
    _clrMakeResizable(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    // ── Injecter CSS wf-btns (si pas déjà présent) ───────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; padding:0; font-size:0; flex-shrink:0; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    // ── Header drag ───────────────────────────────────────────────
    const clrHeader = widget.querySelector('.clr-header');
    if (clrHeader && typeof startWidgetDrag === 'function') {
        clrHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        clrHeader.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Boutons wf ────────────────────────────────────────────────
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const cont    = widget.querySelector('.clr-container');
    let _isMax = false, _savedW = '';

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            if (typeof window._wfMiniBarCollapse === 'function') {
                ec.style.display = 'none';
                window._wfMiniBarCollapse(widget, '🎨 Couleurs', {
                    onExpand: () => { ec.style.display = ''; }
                });
            }
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = cont.style.width;
                cont.classList.add('clr-fullboard');
            } else {
                cont.classList.remove('clr-fullboard');
                if (_savedW) cont.style.width = _savedW;
            }
        });
    }
    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Aide ──────────────────────────────────────────────────────
    const helpBtn   = widget.querySelector('.clr-help-btn');
    const helpPopup = widget.querySelector('.clr-help-popup');
    if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('clr-help-show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('clr-help-show'));
    }

    // ── Touche Suppr ──────────────────────────────────────────────
    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Logique couleurs ──────────────────────────────────────────
    _initCouleursWidget(widget);

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();
    return widget;
}

// ══════════════════════════════════════════════════════════════════
//  Poignée de redimensionnement pour .clr-container
// ══════════════════════════════════════════════════════════════════
function _clrMakeResizable(elmnt) {
    if (elmnt.querySelector('.custom-resize-handle')) return;
    const container = elmnt.querySelector('.clr-container');
    if (!container) return;

    const handle = document.createElement('div');
    handle.className = 'custom-resize-handle';
    handle.title = 'Redimensionner';
    if (getComputedStyle(elmnt).position === 'static') elmnt.style.position = 'relative';
    elmnt.appendChild(handle);

    handle.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.stopPropagation(); e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;

        function onMove(ev) {
            ev.preventDefault();
            const minW = parseInt(getComputedStyle(container).minWidth)  || 260;
            const minH = parseInt(getComputedStyle(container).minHeight) || 200;
            container.style.width  = Math.max(minW, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(minH, startH + ev.clientY - startY) + 'px';
        }
        function onUp() {
            handle.removeEventListener('pointermove',   onMove);
            handle.removeEventListener('pointerup',     onUp);
            handle.removeEventListener('pointercancel', onUp);
            handle.style.opacity = ''; handle.style.pointerEvents = '';
            elmnt.blur();
            if (typeof saveBoard === 'function') saveBoard();
        }
        handle.addEventListener('pointermove',   onMove);
        handle.addEventListener('pointerup',     onUp);
        handle.addEventListener('pointercancel', onUp);
    });
}

// ══════════════════════════════════════════════════════════════════
//  Logique interne du mélangeur
// ══════════════════════════════════════════════════════════════════
function _initCouleursWidget(widget) {

    // ── Couleurs de base ──────────────────────────────────────────
    // Valeurs pigments réalistes (pas les primaires RGB pures)
    // pour que les mélanges donnent des résultats cohérents avec la peinture
    const BASE_COLORS = {
        rouge: { hex: '#ff0000', r: 255, g: 0,   b: 0,   c: 0,    m: 1,    y: 1    },
        vert:  { hex: '#008000', r: 0,   g: 128, b: 0,   c: 1,    m: 0.50, y: 1    },
        jaune: { hex: '#ffff00', r: 255, g: 255, b: 0,   c: 0,    m: 0,    y: 1    },
        bleu:  { hex: '#0000ff', r: 0,   g: 0,   b: 255, c: 1,    m: 1,    y: 0    },
        blanc: { hex: '#ffffff', r: 255, g: 255, b: 255, c: 0,    m: 0,    y: 0    },
        noir:  { hex: '#000000', r: 0,   g: 0,   b: 0,   c: 1,    m: 1,    y: 1    },
    };

    // NAMED_MIXES — utilisé uniquement en fallback pour les combinaisons non listées
    const NAMED_MIXES = [
        { name: 'Vert',          desc: 'Bleu + Jaune = Vert ! 🟢',                  r: 0,   g: 128, b: 0   },
        { name: 'Orange',        desc: 'Jaune + Rouge = Orange 🟠',                  r: 255, g: 165, b: 0   },
        { name: 'Violet',        desc: 'Bleu + Rouge = Violet 💜',                   r: 128, g: 0,   b: 128 },
        { name: 'Rose',          desc: 'Rouge + Blanc = Rose 🌸',                    r: 255, g: 182, b: 193 },
        { name: 'Bleu ciel',     desc: 'Bleu + Blanc = Bleu ciel ☁️',               r: 173, g: 216, b: 230 },
        { name: 'Jaune pâle',    desc: 'Jaune + Blanc = Jaune pâle 🌟',              r: 255, g: 255, b: 180 },
        { name: 'Vert clair',    desc: 'Vert + Blanc = Vert clair 🌱',               r: 144, g: 238, b: 144 },
        { name: 'Gris',          desc: 'Blanc + Noir = Gris 🩶',                     r: 128, g: 128, b: 128 },
        { name: 'Rouge sombre',  desc: 'Rouge + Noir = Rouge sombre 🍷',             r: 139, g: 0,   b: 0   },
        { name: 'Bleu marine',   desc: 'Bleu + Noir = Bleu marine 🌊',               r: 0,   g: 0,   b: 139 },
        { name: 'Kaki',          desc: 'Jaune + Noir = Kaki 🪖',                     r: 128, g: 128, b: 0   },
        { name: 'Vert forêt',    desc: 'Vert + Noir = Vert forêt 🌲',               r: 0,   g: 64,  b: 0   },
        { name: 'Cyan',          desc: 'Bleu + Vert = Cyan 🩵',                      r: 0,   g: 128, b: 128 },
        { name: 'Vert pomme',    desc: 'Jaune + Vert = Vert pomme 🍏',               r: 128, g: 192, b: 0   },
        { name: 'Marron',        desc: 'Rouge + Jaune + Bleu = Marron 🤎',           r: 100, g: 80,  b: 20  },
        { name: 'Lavande',       desc: 'Rouge + Bleu + Blanc = Lavande 🪻',          r: 200, g: 160, b: 220 },
        { name: 'Saumon',        desc: 'Rouge + Jaune + Blanc = Saumon 🍑',          r: 255, g: 200, b: 150 },
        { name: 'Bordeaux',      desc: 'Rouge + Bleu + Noir = Bordeaux 🍇',          r: 80,  g: 0,   b: 80  },
        { name: 'Vert olive',    desc: 'Bleu + Jaune + Noir = Vert olive 🫒',        r: 40,  g: 70,  b: 10  },
    ];

    // ── État ──────────────────────────────────────────────────────
    let selectedColor = null;   // nom de la couleur sélectionnée
    let buckets = [[], [], []]; // chaque bucket = tableau de noms de couleurs
    let savedColors = [];       // { hex, name, ingredients }

    // ── Références DOM ────────────────────────────────────────────
    const paletteEl     = widget.querySelector('#clr-palette');
    const resultCircle  = widget.querySelector('#clr-result-circle');
    const resultName    = widget.querySelector('#clr-result-name');
    const resultHex     = widget.querySelector('#clr-result-hex');
    const resultDesc    = widget.querySelector('#clr-result-desc');
    const resetBtn      = widget.querySelector('#clr-reset-btn');
    const saveBtn       = widget.querySelector('#clr-save-btn');
    const savedRow      = widget.querySelector('#clr-saved-row');
    const toastEl       = widget.querySelector('#clr-toast');
    const bucketPreviews = widget.querySelectorAll('.clr-bucket-preview');

    // ── Utilitaires ───────────────────────────────────────────────
    function hexFromRGB(r, g, b) {
        return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    }

    function colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
    }

    // ── Table de mélanges explicites (pigments réels) ─────────────
    // Clé = ingrédients triés alphabétiquement et joints par "+"
    // Les quantités sont normalisées : on trie et déduplique les noms
    const EXPLICIT_MIXES = {
        // ── 2 couleurs ──
        'bleu+jaune':  { r: 0,   g: 128, b: 0,   name: 'Vert',        desc: 'Bleu + Jaune = Vert ! 🟢' },
        'jaune+rouge': { r: 255, g: 165, b: 0,   name: 'Orange',      desc: 'Jaune + Rouge = Orange 🟠' },
        'bleu+rouge':  { r: 128, g: 0,   b: 128, name: 'Violet',      desc: 'Bleu + Rouge = Violet 💜' },
        'blanc+rouge': { r: 255, g: 182, b: 193, name: 'Rose',        desc: 'Rouge + Blanc = Rose 🌸' },
        'blanc+bleu':  { r: 173, g: 216, b: 230, name: 'Bleu ciel',   desc: 'Bleu + Blanc = Bleu ciel ☁️' },
        'blanc+jaune': { r: 255, g: 255, b: 180, name: 'Jaune pâle',  desc: 'Jaune + Blanc = Jaune pâle 🌟' },
        'blanc+vert':  { r: 144, g: 238, b: 144, name: 'Vert clair',  desc: 'Vert + Blanc = Vert clair 🌱' },
        'blanc+noir':  { r: 128, g: 128, b: 128, name: 'Gris',        desc: 'Blanc + Noir = Gris 🩶' },
        'noir+rouge':  { r: 139, g: 0,   b: 0,   name: 'Rouge sombre',desc: 'Rouge + Noir = Rouge sombre 🍷' },
        'bleu+noir':   { r: 0,   g: 0,   b: 139, name: 'Bleu marine', desc: 'Bleu + Noir = Bleu marine 🌊' },
        'jaune+noir':  { r: 128, g: 128, b: 0,   name: 'Kaki',        desc: 'Jaune + Noir = Kaki 🪖' },
        'noir+vert':   { r: 0,   g: 64,  b: 0,   name: 'Vert forêt',  desc: 'Vert + Noir = Vert forêt 🌲' },
        'bleu+vert':   { r: 0,   g: 128, b: 128, name: 'Cyan',        desc: 'Bleu + Vert = Cyan 🩵' },
        'jaune+vert':  { r: 128, g: 192, b: 0,   name: 'Vert pomme',  desc: 'Jaune + Vert = Vert pomme 🍏' },
        // ── 3 couleurs ──
        'bleu+jaune+rouge':  { r: 100, g: 80,  b: 20,  name: 'Marron',    desc: 'Rouge + Jaune + Bleu = Marron 🤎' },
        'blanc+bleu+rouge':  { r: 200, g: 160, b: 220, name: 'Lavande',   desc: 'Rouge + Bleu + Blanc = Lavande 🪻' },
        'blanc+jaune+rouge': { r: 255, g: 200, b: 150, name: 'Saumon',    desc: 'Rouge + Jaune + Blanc = Saumon 🍑' },
        'blanc+bleu+jaune':  { r: 180, g: 220, b: 200, name: 'Turquoise clair', desc: 'Bleu + Jaune + Blanc = Turquoise 🩵' },
        'bleu+jaune+noir':   { r: 40,  g: 70,  b: 10,  name: 'Vert olive', desc: 'Bleu + Jaune + Noir = Vert olive 🫒' },
        'bleu+noir+rouge':   { r: 80,  g: 0,   b: 80,  name: 'Bordeaux',  desc: 'Rouge + Bleu + Noir = Bordeaux 🍇' },
        'blanc+jaune+vert':  { r: 200, g: 240, b: 160, name: 'Vert pomme clair', desc: 'Jaune + Vert + Blanc = Vert pomme clair 🍃' },
        'bleu+rouge+vert':   { r: 60,  g: 40,  b: 60,  name: 'Brun violet', desc: 'Rouge + Vert + Bleu = Brun violet' },
    };

    function getMixKey(ingredients) {
        // Trie les noms uniques alphabétiquement → clé canonique
        return [...new Set(ingredients)].sort().join('+');
    }

    // Fallback CMY pour les combinaisons non listées
    function mixCMY(ingredients) {
        let tc = 0, tm = 0, ty = 0;
        ingredients.forEach(name => {
            const c = BASE_COLORS[name];
            if (c) { tc += c.c; tm += c.m; ty += c.y; }
        });
        const n = ingredients.length;
        return {
            r: Math.round((1 - tc/n) * 255),
            g: Math.round((1 - tm/n) * 255),
            b: Math.round((1 - ty/n) * 255)
        };
    }

    function mixBuckets() {
        const allIng = buckets.flat();
        if (allIng.length === 0) return null;

        // Couleur pure unique
        const uniqueColors = [...new Set(allIng)];
        if (uniqueColors.length === 1) {
            const name = uniqueColors[0];
            const c = BASE_COLORS[name];
            const label = name.charAt(0).toUpperCase() + name.slice(1);
            return { r: c.r, g: c.g, b: c.b, hex: c.hex, name: label, desc: `${label} pur — essaie de mélanger avec d'autres couleurs !` };
        }

        // Chercher dans la table explicite (ignore les doublons, trie)
        const key = getMixKey(allIng);
        if (EXPLICIT_MIXES[key]) {
            const m = EXPLICIT_MIXES[key];
            return { r: m.r, g: m.g, b: m.b, hex: hexFromRGB(m.r, m.g, m.b), name: m.name, desc: m.desc };
        }

        // Fallback : CMY + nom le plus proche dans NAMED_MIXES
        const rgb = mixCMY(allIng);
        const r = rgb.r, g = rgb.g, b = rgb.b;
        let bestName = '', bestDesc = '', bestDist = Infinity;
        NAMED_MIXES.forEach(m => {
            const d = colorDistance(r, g, b, m.r, m.g, m.b);
            if (d < bestDist) { bestDist = d; bestName = m.name; bestDesc = m.desc; }
        });
        return { r, g, b, hex: hexFromRGB(r, g, b), name: bestName || 'Couleur créée', desc: bestDesc || 'Un mélange unique ✨' };
    }

    function contrastColor(hex) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
        return luminance > 0.55 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
    }

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('clr-toast-show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toastEl.classList.remove('clr-toast-show'), 1800);
    }

    // ── Rendu des pots ────────────────────────────────────────────
    function renderBuckets() {
        buckets.forEach((ing, i) => {
            const preview  = widget.querySelector(`.clr-bucket-preview[data-bucket="${i}"]`);
            const ingEl    = widget.querySelector(`#clr-ing-${i}`);
            const clearBtn = widget.querySelector(`.clr-bucket-clear-btn[data-clear="${i}"]`);
            const emptyHint = preview.querySelector('.clr-bucket-empty-hint');

            ingEl.innerHTML = '';

            if (ing.length === 0) {
                preview.style.background = '';
                if (emptyHint) emptyHint.style.display = '';
                if (clearBtn) clearBtn.classList.remove('clr-bucket-has-color');
            } else {
                // Couleur du pot = moyenne des ingrédients de ce pot
                let tr = 0, tg = 0, tb = 0;
                ing.forEach(name => {
                    const c = BASE_COLORS[name];
                    if (c) { tr += c.r; tg += c.g; tb += c.b; }
                });
                const n = ing.length;
                const hex = hexFromRGB(tr/n, tg/n, tb/n);
                preview.style.background = hex;
                if (emptyHint) emptyHint.style.display = 'none';
                if (clearBtn) clearBtn.classList.add('clr-bucket-has-color');

                // Petits points ingrédients
                ing.forEach(name => {
                    const dot = document.createElement('div');
                    dot.className = 'clr-ingredient-dot';
                    dot.style.background = BASE_COLORS[name]?.hex || '#888';
                    dot.title = name;
                    ingEl.appendChild(dot);
                });
            }
        });
    }

    // ── Rendu du résultat ─────────────────────────────────────────
    function renderResult() {
        const mix = mixBuckets();
        if (!mix) {
            resultCircle.style.background = '';
            resultCircle.style.removeProperty('--clr-glow');
            resultCircle.classList.remove('clr-has-result');
            resultName.textContent = '?';
            resultName.style.color = '';
            resultHex.textContent = '';
            resultDesc.textContent = 'Ajoute des couleurs dans les pots…';
            return;
        }
        resultCircle.style.background = mix.hex;
        resultCircle.style.setProperty('--clr-glow', mix.hex + '66');
        resultCircle.classList.add('clr-has-result');
        resultName.textContent = mix.name;
        resultName.style.color = contrastColor(mix.hex);
        resultHex.textContent = mix.hex;
        resultHex.style.color = contrastColor(mix.hex).replace('0.9', '0.5').replace('0.7', '0.4');
        resultDesc.textContent = mix.desc;
    }

    // ── Rendu sauvegarde ─────────────────────────────────────────
    function renderSaved() {
        savedRow.innerHTML = '';
        if (savedColors.length === 0) {
            savedRow.innerHTML = '<span class="clr-saved-empty">Aucune couleur sauvegardée</span>';
            return;
        }
        savedColors.forEach((c, idx) => {
            const chip = document.createElement('div');
            chip.className = 'clr-saved-chip';
            chip.title = c.ingredients.join(' + ');
            chip.innerHTML = `<div class="clr-chip-dot" style="background:${c.hex}"></div>${c.name}<span class="clr-chip-del">✕</span>`;
            chip.querySelector('.clr-chip-del').addEventListener('click', (e) => {
                e.stopPropagation();
                savedColors.splice(idx, 1);
                renderSaved();
                if (typeof saveBoard === 'function') saveBoard();
            });
            savedRow.appendChild(chip);
        });
    }

    // ── Sélection couleur palette ─────────────────────────────────
    paletteEl.querySelectorAll('.clr-palette-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const colorName = btn.dataset.color;
            if (selectedColor === colorName) {
                // Désélectionner
                selectedColor = null;
                btn.classList.remove('clr-selected');
            } else {
                selectedColor = colorName;
                paletteEl.querySelectorAll('.clr-palette-btn').forEach(b => b.classList.remove('clr-selected'));
                btn.classList.add('clr-selected');
            }
        });
    });

    // ── Clic sur un pot ───────────────────────────────────────────
    bucketPreviews.forEach(preview => {
        preview.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(preview.dataset.bucket);
            if (selectedColor) {
                buckets[idx].push(selectedColor);
                if (typeof snapshotNow === 'function') snapshotNow();
                renderBuckets();
                renderResult();
                if (typeof saveBoard === 'function') saveBoard();
            } else {
                showToast('Sélectionne d\'abord une couleur dans la palette !');
            }
        });
    });

    // ── Boutons vider chaque pot ──────────────────────────────────
    widget.querySelectorAll('.clr-bucket-clear-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.clear);
            if (buckets[idx].length > 0) {
                buckets[idx] = [];
                if (typeof snapshotNow === 'function') snapshotNow();
                renderBuckets();
                renderResult();
                showToast('Pot vidé !');
                if (typeof saveBoard === 'function') saveBoard();
            }
        });
    });

    // ── Tout vider ────────────────────────────────────────────────
    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        buckets = [[], [], []];
        if (typeof snapshotNow === 'function') snapshotNow();
        renderBuckets();
        renderResult();
        showToast('Pots vidés !');
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Sauvegarder la couleur ────────────────────────────────────
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mix = mixBuckets();
        if (!mix) { showToast('Rien à sauvegarder !'); return; }
        const allIng = buckets.flat();
        if (allIng.length === 0) { showToast('Rien à sauvegarder !'); return; }
        // Éviter les doublons exacts
        if (savedColors.find(c => c.hex === mix.hex)) { showToast('Déjà sauvegardé !'); return; }
        savedColors.push({ hex: mix.hex, name: mix.name, ingredients: allIng });
        renderSaved();
        showToast('Couleur sauvegardée 💾');
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Sauvegarde / restauration ─────────────────────────────────
    widget._clrGetData = () => {
        const c = widget.querySelector('.clr-container');
        const isFullboard = c ? c.classList.contains('clr-fullboard') : false;
        return { buckets, savedColors, containerW: c ? c.offsetWidth : null, fullboard: isFullboard };
    };
    widget._clrSetData = (data) => {
        if (!data) return;
        if (Array.isArray(data.buckets))     buckets = data.buckets;
        if (Array.isArray(data.savedColors)) savedColors = data.savedColors;
        if (data.fullboard) _isMax = true;
        renderBuckets();
        renderResult();
        renderSaved();
    };

    // ── Rendu initial ─────────────────────────────────────────────
    renderBuckets();
    renderResult();
    renderSaved();
}
