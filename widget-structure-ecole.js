// =========================================================================
// WIDGET STRUCTURE ÉCOLE — Le Bureau du Prof
// Inspiré de outils_structure_ecole.html (OutilsProfs)
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-structure-ecole.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils divers) :
//      <div class="mm-sub-item" onclick="createStructureEcoleWidget();closeMainMenu()">
//          <span class="mm-ico">🏫</span>Structure École
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent ── */
    .widget[data-type="structure-ecole"] {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="structure-ecole"] .se-outer {
        position: relative;
        width: 580px;
        height: 700px;
        min-width: 280px;
        min-height: 200px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
    }
    .widget[data-type="structure-ecole"] .se-outer::-webkit-resizer { display: none; }

    /* ── Poignée de redimensionnement libre ── */
    .se-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 18px;
        height: 18px;
        cursor: se-resize;
        z-index: 20;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        padding: 3px;
        box-sizing: border-box;
        border-bottom-right-radius: 16px;
    }
    .se-resize-handle::after {
        content: '';
        display: block;
        width: 10px;
        height: 10px;
        border-right: 2.5px solid #94a3b8;
        border-bottom: 2.5px solid #94a3b8;
        border-bottom-right-radius: 3px;
        opacity: 0.6;
        transition: opacity .15s;
    }
    .se-resize-handle:hover::after { opacity: 1; }

    /* ── Container intérieur ── */
    .se-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 22px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #1e293b;
        user-select: none;
        box-sizing: border-box;
        position: relative;
    }

    /* ── Header ── */
    .se-header {
        background: #1e293b;
        border-bottom: 2px solid #334155;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
        cursor: move;
    }
    .se-header-title {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.3px;
        flex-grow: 1;
        color: #f1f5f9;
        pointer-events: none;
    }

    /* ── Corps scrollable ── */
    .se-body {
        flex: 1;
        overflow-y: auto;
        padding: 12px 14px;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: #94a3b8 transparent;
        background: #f8fafc;
    }

    /* ── Sections ── */
    .se-section {
        border: 1.5px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 10px;
        background: #ffffff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .se-section-title {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #64748b;
        text-align: center;
        margin-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 6px;
    }

    /* ── Grille effectifs ── */
    .se-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 10px;
    }
    .se-grid-2 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 8px;
    }
    .se-field {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
    }
    .se-field-label {
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        text-align: center;
        line-height: 1.2;
    }
    .se-label-ps  { color: #7c3aed; }
    .se-label-ms  { color: #0891b2; }
    .se-label-gs  { color: #d97706; }
    .se-label-cp  { color: #db2777; }
    .se-label-ce1 { color: #2563eb; }
    .se-label-ce2 { color: #92400e; }
    .se-label-cm1 { color: #dc2626; }
    .se-label-cm2 { color: #16a34a; }
    .se-label-def { color: #475569; }

    .se-input {
        width: 100%;
        padding: 5px 6px;
        border-radius: 20px;
        border: 1.5px solid #cbd5e1;
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 800;
        font-size: 13px;
        text-align: center;
        box-sizing: border-box;
        font-family: inherit;
        outline: none;
        transition: border-color .15s, box-shadow .15s;
    }
    .se-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }

    /* ── Contraintes ── */
    .se-check-group {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 0;
        color: #1e293b;
    }
    .se-check-group input[type="checkbox"] {
        width: 14px;
        height: 14px;
        cursor: pointer;
        flex-shrink: 0;
        accent-color: #3b82f6;
    }
    .se-avoid-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        margin-top: 6px;
    }
    .se-separator {
        border: none;
        border-top: 1.5px solid #e2e8f0;
        margin: 8px 0;
    }

    /* ── Boutons action ── */
    .se-btn {
        padding: 9px 10px;
        border-radius: 50px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        width: 100%;
        border: none;
        transition: transform .15s, filter .15s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        font-family: inherit;
        letter-spacing: 0.4px;
    }
    .se-btn:active { transform: scale(0.97); }
    .se-btn-primary { background: #2563eb; color: #fff; }
    .se-btn-primary:hover { filter: brightness(0.88); }
    .se-btn-danger  { background: #dc2626; color: #fff; }
    .se-btn-danger:hover  { filter: brightness(0.88); }
    .se-btn-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 10px;
    }
    .se-btn-full { grid-column: span 2; }

    /* ── Résultats ── */
    .se-results { margin-top: 10px; }
    .se-error {
        color: #991b1b;
        background: #fee2e2;
        border: 1px solid #fca5a5;
        padding: 10px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 10px;
        text-align: center;
        display: none;
        margin-bottom: 8px;
    }
    .se-proposition {
        margin-bottom: 14px;
    }
    .se-prop-title {
        font-weight: 900;
        font-size: 10px;
        text-transform: uppercase;
        color: #1d4ed8;
        margin-bottom: 8px;
        letter-spacing: 0.8px;
        background: #dbeafe;
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
    }
    .se-prop-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }
    .se-classe-item {
        background: #ffffff;
        padding: 9px;
        border-radius: 10px;
        border: 1.5px solid #e2e8f0;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .se-classe-header {
        font-size: 8px;
        font-weight: 900;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 5px;
        letter-spacing: 0.5px;
    }
    .se-classe-niv {
        font-size: 12px;
        color: #0f172a;
        font-weight: 900;
    }
    .se-badge-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-bottom: 6px;
    }
    .se-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 800;
        font-size: 10px;
    }
    .se-badge-ps  { background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; }
    .se-badge-ms  { background: #cffafe; color: #0e7490; border: 1px solid #67e8f9; }
    .se-badge-gs  { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
    .se-badge-cp  { background: #fce7f3; color: #be185d; border: 1px solid #f9a8d4; }
    .se-badge-ce1 { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
    .se-badge-ce2 { background: #fff7ed; color: #92400e; border: 1px solid #fdba74; }
    .se-badge-cm1 { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .se-badge-cm2 { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .se-total-badge {
        font-size: 10px;
        font-weight: 900;
        background: #1e293b;
        color: #f1f5f9;
        display: inline-block;
        padding: 2px 9px;
        border-radius: 5px;
    }
    .se-computing {
        text-align: center;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #64748b;
        padding: 16px 0;
    }

    /* ── Popup aide ── */
    .se-help-popup {
        display: none;
        position: absolute;
        top: 42px;
        right: 10px;
        background: #fff;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.18);
        padding: 12px 14px;
        width: 260px;
        font-size: 10px;
        color: #334155;
        z-index: 10;
        line-height: 1.7;
        font-family: inherit;
    }
    .se-help-popup.show { display: block; }
    .se-help-popup h4 {
        margin: 0 0 8px;
        font-size: 12px;
        color: #0f172a;
        font-weight: 900;
    }
    .se-help-popup li { margin-bottom: 5px; }
    `;

    if (!document.getElementById('se-widget-style')) {
        const s = document.createElement('style');
        s.id = 'se-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // Injecter CSS boutons wf si pas déjà présents
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
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    // ── HTML interne (création + restauration) ────────────────────────────
    function seInnerHTML() {
        return `
        <div class="se-inner">
            <div class="se-header">
                <div class="se-header-title">🏫 Structure École</div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="se-help-btn" title="Aide" onmousedown="event.stopPropagation()" style="width:22px;height:22px;border-radius:50%;border:1px solid #475569;background:#334155;color:#94a3b8;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;font-family:inherit;">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                </div>
            </div>
            <div class="se-resize-handle" title="Redimensionner"></div>
            <div class="se-help-popup">
                <h4>💡 Structure École</h4>
                <ul style="padding-left:14px;margin:0;">
                    <li><strong>Effectifs</strong> : saisir le nombre d'élèves par niveau et le nombre de classes souhaité.</li>
                    <li><strong>Contraintes</strong> : ajuster les niveaux max, les écarts et la limite CP/CE1 à 24.</li>
                    <li><strong>Éviter</strong> : cocher les mélanges de niveaux indésirables.</li>
                    <li>L'algorithme génère jusqu'à 3 propositions différentes et équilibrées.</li>
                    <li>Minimum 6 élèves par niveau dans les classes doubles.</li>
                </ul>
            </div>
            <div class="se-body">
                <div class="se-section">
                    <div class="se-section-title">Effectifs par niveau</div>
                    <div class="se-grid-3">
                        <div class="se-field">
                            <span class="se-field-label se-label-ps">PS</span>
                            <input class="se-input se-ps" type="number" min="0" value="0">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-ms">MS</span>
                            <input class="se-input se-ms" type="number" min="0" value="0">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-gs">GS</span>
                            <input class="se-input se-gs" type="number" min="0" value="0">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-cp">CP</span>
                            <input class="se-input se-cp" type="number" min="0" value="30">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-ce1">CE1</span>
                            <input class="se-input se-ce1" type="number" min="0" value="30">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-ce2">CE2</span>
                            <input class="se-input se-ce2" type="number" min="0" value="38">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-cm1">CM1</span>
                            <input class="se-input se-cm1" type="number" min="0" value="42">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-cm2">CM2</span>
                            <input class="se-input se-cm2" type="number" min="0" value="28">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-def">Nb Classes</span>
                            <input class="se-input se-nb-classes" type="number" min="1" value="7">
                        </div>
                    </div>
                </div>

                <div class="se-section">
                    <div class="se-section-title">Contraintes</div>
                    <div class="se-grid-2">
                        <div class="se-field">
                            <span class="se-field-label se-label-def" style="text-align:center;line-height:1.3;">Niveaux max<br>/ classe</span>
                            <input class="se-input se-max-niv" type="number" min="1" max="5" value="2">
                        </div>
                        <div class="se-field">
                            <span class="se-field-label se-label-def" style="text-align:center;line-height:1.3;">Écart max<br>entre niveaux</span>
                            <input class="se-input se-gap-niv" type="number" min="1" value="1" >
                        </div>
						<div class="se-field" style="margin-bottom:8px;">
							<span class="se-field-label se-label-def" style="margin-bottom:3px;">Écart effectif max<br>entre classes</span>
							<input class="se-input se-gap-eff" type="number" min="1" max="20" value="4" >
						</div>
                    </div>
                    <hr class="se-separator">
                    <div class="se-check-group">
                        <input type="checkbox" class="se-limit24">
                        <span>Limiter CP et CE1 à 24 élèves max</span>
                    </div>
                    <hr class="se-separator">
                    <div class="se-section-title" style="margin-bottom:4px;margin-top:4px;">Éviter ces mélanges</div>
                    <div class="se-avoid-grid">
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="1-2"> PS/MS</label>
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="2-3"> MS/GS</label>
						<label class="se-check-group"><input type="checkbox" class="se-avoid" value="1-3"> PS/GS</label>
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="3-4"> GS/CP</label>
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="4-5"> CP/CE1</label>
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="5-6"> CE1/CE2</label>
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="6-7"> CE2/CM1</label>
                        <label class="se-check-group"><input type="checkbox" class="se-avoid" value="7-8"> CM1/CM2</label>
                    </div>
                </div>

                <div class="se-btn-grid">
                    <button class="se-btn se-btn-primary se-btn-full se-btn-calc">⚙️ Générer les propositions</button>
                    <button class="se-btn se-btn-danger se-btn-clear">🗑 Effacer</button>
                    <button class="se-btn se-btn-primary se-btn-reset-form" style="background:#6b7280;">↺ Réinitialiser</button>
                </div>

                <div class="se-error"></div>
                <div class="se-results"></div>
            </div>
        </div>`;
    }

    // =========================================================================
    // ALGORITHME DE GÉNÉRATION (extrait de outils_structure_ecole.html)
    // =========================================================================

    function genererUneSolution(data) {
        const totalE = data.niveaux.reduce((s, n) => s + n.n, 0);
        const moyenne = totalE / data.nbClasses;
        let classes = Array.from({ length: data.nbClasses }, (_, i) => ({
            id: i + 1,
            eleves: [],
            total: 0,
            cible: Math.floor(moyenne) + (i < (totalE % data.nbClasses) ? 1 : 0),
            niveaux: new Set()
        }));

        let niveaux = [...data.niveaux].filter(n => n.n > 0).sort(() => Math.random() - 0.5);

        for (let niv of niveaux) {
            while (niv.n > 0) {
                let candidates = classes.filter(c => {
                    if (c.total >= c.cible + 2) return false;
                    const dejaNiv = c.niveaux.has(niv.id);
                    if (!dejaNiv && c.niveaux.size >= data.maxNiv) return false;
                    if (c.niveaux.size > 0 && !dejaNiv) {
                        const min = Math.min(...c.niveaux);
                        const max = Math.max(...c.niveaux);
                        if (Math.abs(niv.id - min) > data.gapNiv || Math.abs(niv.id - max) > data.gapNiv) return false;
                        let respecteAvoid = true;
                        c.niveaux.forEach(ex => {
                            if (data.avoid.includes(`${ex}-${niv.id}`) || data.avoid.includes(`${niv.id}-${ex}`)) {
                                respecteAvoid = false;
                            }
                        });
                        if (!respecteAvoid) return false;
                    }
                    if (data.limit24 && (niv.id === 4 || niv.id === 5) && c.total >= 24) return false;
                    return true;
                }).sort(() => Math.random() - 0.5);

                if (candidates.length === 0) return null;
                let c = candidates[0];
                let placeDispo = (c.cible + 2) - c.total;
                let aPrendre;

                if (niv.n <= placeDispo) {
                    aPrendre = niv.n;
                } else {
                    aPrendre = Math.floor(Math.random() * (placeDispo - 6 + 1)) + 6;
                    if (niv.n - aPrendre > 0 && niv.n - aPrendre < 6) {
                        aPrendre = niv.n - 6;
                    }
                }

                if (aPrendre < 6 && !c.niveaux.has(niv.id)) {
                    if (niv.n <= placeDispo) {
                        aPrendre = niv.n;
                    } else {
                        return null;
                    }
                }
                if (aPrendre <= 0) return null;

                let elIdx = c.eleves.findIndex(e => e.nom === niv.nom);
                if (elIdx > -1) {
                    c.eleves[elIdx].count += aPrendre;
                } else {
                    c.eleves.push({ nom: niv.nom, count: aPrendre });
                }

                c.total += aPrendre;
                c.niveaux.add(niv.id);
                niv.n -= aPrendre;
            }
        }

        const effectifs = classes.map(c => c.total);
        if (Math.max(...effectifs) - Math.min(...effectifs) > data.gapEffectif) return null;

        for (let cl of classes) {
            if (cl.niveaux.size > 1 && cl.eleves.some(e => e.count < 6)) return null;
            if (data.limit24 && (cl.niveaux.has(4) || cl.niveaux.has(5)) && cl.total > 24) return null;
        }

        return classes;
    }

    function optimiserEffectifs(classes, data) {
        const mapNiveaux = { "PS": 1, "MS": 2, "GS": 3, "CP": 4, "CE1": 5, "CE2": 6, "CM1": 7, "CM2": 8 };
        let modifie = true;
        let iterations = 0;

        while (modifie && iterations < 50) {
            modifie = false;
            iterations++;
            for (let niveauNom of ["PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"]) {
                const niveauId = mapNiveaux[niveauNom];
                const classesDoubles = classes.filter(c =>
                    c.niveaux.size > 1 &&
                    c.niveaux.has(niveauId) &&
                    c.eleves.find(e => e.nom === niveauNom && e.count > 6)
                );
                const classesSimples = classes.filter(c =>
                    c.niveaux.size === 1 &&
                    c.niveaux.has(niveauId)
                );
                if (classesDoubles.length > 0 && classesSimples.length > 0) {
                    classesDoubles.sort((a, b) => b.total - a.total);
                    classesSimples.sort((a, b) => a.total - b.total);
                    const classeDouble = classesDoubles[0];
                    const classeSimple = classesSimples[0];
                    if (classeDouble.total > classeSimple.total + 1) {
                        const eleveDouble = classeDouble.eleves.find(e => e.nom === niveauNom);
                        const eleveSimple = classeSimple.eleves.find(e => e.nom === niveauNom);
                        if (eleveDouble && eleveDouble.count > 6) {
                            const ecart = classeDouble.total - classeSimple.total;
                            let aDeplacer = Math.min(Math.floor(ecart / 2), eleveDouble.count - 6, 2);
                            if (aDeplacer > 0) {
                                if (data.limit24 && (niveauId === 4 || niveauId === 5) && classeSimple.total + aDeplacer > 24) {
                                    aDeplacer = Math.max(0, 24 - classeSimple.total);
                                }
                                if (aDeplacer > 0) {
                                    eleveDouble.count -= aDeplacer;
                                    classeDouble.total -= aDeplacer;
                                    if (eleveSimple) {
                                        eleveSimple.count += aDeplacer;
                                    } else {
                                        classeSimple.eleves.push({ nom: niveauNom, count: aDeplacer });
                                    }
                                    classeSimple.total += aDeplacer;
                                    modifie = true;
                                    if (eleveDouble.count === 0) {
                                        classeDouble.eleves = classeDouble.eleves.filter(e => e.count > 0);
                                        classeDouble.niveaux.delete(niveauId);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return classes;
    }

    function equilibrerClassesIdentiques(classes, data) {
        const mapNiveaux = { "CP": 1, "CE1": 2, "CE2": 3, "CM1": 4, "CM2": 5 };
        let modifie = true;
        let iterations = 0;

        while (modifie && iterations < 50) {
            modifie = false;
            iterations++;
            const groupes = {};
            classes.forEach((classe) => {
                const signature = Array.from(classe.niveaux).sort((a, b) => a - b).join('-');
                if (!groupes[signature]) groupes[signature] = [];
                groupes[signature].push({ classe });
            });
            for (let signature in groupes) {
                const groupe = groupes[signature];
                if (groupe.length >= 2) {
                    groupe.sort((a, b) => b.classe.total - a.classe.total);
                    const classePlus  = groupe[0].classe;
                    const classeMoins = groupe[groupe.length - 1].classe;
                    if (classePlus.total - classeMoins.total >= 2) {
                        for (let niveauNom of ["CP", "CE1", "CE2", "CM1", "CM2"]) {
                            const niveauId = mapNiveaux[niveauNom];
                            if (classePlus.niveaux.has(niveauId) && classeMoins.niveaux.has(niveauId)) {
                                const elevePlus  = classePlus.eleves.find(e => e.nom === niveauNom);
                                const eleveMoins = classeMoins.eleves.find(e => e.nom === niveauNom);
                                if (elevePlus && eleveMoins && elevePlus.count > eleveMoins.count) {
                                    const ecartNiveau = elevePlus.count - eleveMoins.count;
                                    const ecartTotal  = classePlus.total - classeMoins.total;
                                    let aDeplacer = Math.min(
                                        Math.floor(ecartNiveau / 2),
                                        Math.floor(ecartTotal / 2),
                                        3
                                    );
                                    if (classePlus.niveaux.size > 1 && elevePlus.count - aDeplacer < 6) {
                                        aDeplacer = Math.max(0, elevePlus.count - 6);
                                    }
                                    if (aDeplacer > 0) {
                                        if (data.limit24 && (niveauId === 4 || niveauId === 5) && classeMoins.total + aDeplacer > 24) {
                                            aDeplacer = Math.max(0, 24 - classeMoins.total);
                                        }
                                        if (aDeplacer > 0) {
                                            elevePlus.count  -= aDeplacer;
                                            classePlus.total -= aDeplacer;
                                            eleveMoins.count += aDeplacer;
                                            classeMoins.total += aDeplacer;
                                            modifie = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return classes;
    }

    function calculerSolutions(data) {
        let solutions = [];
        let tentatives = 0;
        while (solutions.length < 3 && tentatives < 15000) {
            tentatives++;
            const sol = genererUneSolution(JSON.parse(JSON.stringify(data)));
            if (sol) {
                const solOpt = optimiserEffectifs(sol, data);
                const solEq  = equilibrerClassesIdentiques(solOpt, data);
                const signature = solEq.map(c => c.eleves.map(e => e.nom).sort().join('+')).sort().join(' / ');
                if (!solutions.find(s => s.sig === signature)) {
                    solutions.push({ data: solEq, sig: signature });
                }
            }
        }
        return solutions;
    }

    function renderPropositions(solutions) {
        const ordreNiveaux = { "PS": 1, "MS": 2, "GS": 3, "CP": 4, "CE1": 5, "CE2": 6, "CM1": 7, "CM2": 8 };
        let html = '';

        solutions.forEach((s, idx) => {
            const classes = s.data;
            classes.forEach(c => c.eleves.sort((a, b) => ordreNiveaux[a.nom] - ordreNiveaux[b.nom]));
            classes.sort((a, b) => {
                const valA = a.niveaux.size > 1 ? Math.min(...a.niveaux) + 0.5 : Math.min(...a.niveaux);
                const valB = b.niveaux.size > 1 ? Math.min(...b.niveaux) + 0.5 : Math.min(...b.niveaux);
                return valA - valB;
            });

            html += `<div class="se-proposition">
                <div class="se-prop-title">Proposition n°${idx + 1}</div>
                <div class="se-prop-grid">`;

            classes.forEach((c, i) => {
                const nomsNiveaux = c.eleves.map(e => e.nom).join('/');
                const badgesHtml = c.eleves.map(e => {
                    const cls = `se-badge se-badge-${e.nom.toLowerCase()}`;
                    return `<span class="${cls}">${e.count} ${e.nom}</span>`;
                }).join('');

                html += `<div class="se-classe-item">
                    <div class="se-classe-header">Classe ${i + 1} : <span class="se-classe-niv">${nomsNiveaux}</span></div>
                    <div class="se-badge-wrap">${badgesHtml}</div>
                    <span class="se-total-badge">Total : ${c.total}</span>
                </div>`;
            });

            html += `</div></div>`;
        });

        return html;
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    window.initStructureEcoleWidget = function (widget) {

        const outer = widget.querySelector('.se-outer');

        // Bloquer remontée mousedown
        outer.addEventListener('mousedown', e => e.stopPropagation());

        // ── Header draggable ──────────────────────────────────────────────
        const seHeader = widget.querySelector('.se-header');
        if (seHeader && !seHeader._dragInit) {
            seHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            seHeader.addEventListener('mousedown',  onHeaderDown);
            seHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const helpBtn  = widget.querySelector('.se-help-btn');
        const helpPop  = widget.querySelector('.se-help-popup');
        const wfMin    = widget.querySelector('[data-role="wf-min"]');
        const wfMax    = widget.querySelector('[data-role="wf-max"]');
        const wfClose  = widget.querySelector('[data-role="wf-close"]');
        const btnCalc  = widget.querySelector('.se-btn-calc');
        const btnClear = widget.querySelector('.se-btn-clear');
        const btnReset = widget.querySelector('.se-btn-reset-form');
        const errorBox = widget.querySelector('.se-error');
        const results  = widget.querySelector('.se-results');

        let _isMax = false;

        // ── Aide popup ────────────────────────────────────────────────────
        if (helpBtn && helpPop) {
            helpBtn.addEventListener('click', e => {
                e.stopPropagation();
                helpPop.classList.toggle('show');
            });
            document.addEventListener('click', () => helpPop.classList.remove('show'));
        }

        // ── Boutons fenêtre wf ────────────────────────────────────────────
        function seCollapse() {
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.seW) || 580;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.seH) || 700;
            widget.dataset.seW = savedW;
            widget.dataset.seH = savedH;

            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.seLeftSaved = widget.offsetLeft;
            widget.dataset.seTopSaved  = widget.offsetTop;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            outer.style.display = 'none';
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                  .forEach(el => el.style.display = 'none');

            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.dataset.collapsed === '1'
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top    = MARGIN_TOP + 'px';
            widget.style.left   = occupiedX  + 'px';
            widget.style.width  = COLLAPSED_W + 'px';
            widget.style.height = COLLAPSED_H + 'px';
            widget.style.overflow     = 'hidden';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.padding      = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.dataset.collapsed = '1';

            const miniBar = document.createElement('div');
            miniBar.className = 'se-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '🏫 Structure École';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); seExpand(); });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup',   onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup',   onUp);
            });

            if (typeof saveBoard === 'function') saveBoard();
        }

        function seExpand() {
            const savedW    = parseFloat(widget.dataset.seW) || 580;
            const savedH    = parseFloat(widget.dataset.seH) || 700;
            const savedLeft = parseFloat(widget.dataset.seLeftSaved);
            const savedTop  = parseFloat(widget.dataset.seTopSaved);

            widget.querySelectorAll('.se-mini-bar').forEach(el => el.remove());
            widget.removeAttribute('style');
            widget.style.left = (!isNaN(savedLeft) ? savedLeft : widget.offsetLeft) + 'px';
            widget.style.top  = (!isNaN(savedTop)  ? savedTop  : widget.offsetTop)  + 'px';

            const wc = widget.querySelector('.widget-content');
            if (wc) wc.removeAttribute('style');
            widget.dataset.collapsed = '0';

            outer.style.display = '';
            outer.style.width   = savedW + 'px';
            outer.style.height  = savedH + 'px';

            outer.innerHTML = seInnerHTML();
            initStructureEcoleWidget(widget);

            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        widget._seExpand = seExpand;

        if (wfMin) {
            wfMin.addEventListener('pointerdown', e => e.stopPropagation());
            wfMin.addEventListener('mousedown',   e => e.stopPropagation());
            wfMin.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); seCollapse(); });
        }
        if (wfMax) {
            wfMax.addEventListener('click', e => {
                e.stopPropagation();
                _isMax = !_isMax;
                const inner = widget.querySelector('.se-inner');
                if (_isMax) {
                    inner.style.position = 'fixed';
                    inner.style.inset = '0';
                    inner.style.width = '100%';
                    inner.style.height = '100%';
                    inner.style.zIndex = '9999';
                    inner.style.borderRadius = '0';
                } else {
                    inner.style.position = '';
                    inner.style.inset = '';
                    inner.style.width = '';
                    inner.style.height = '';
                    inner.style.zIndex = '';
                    inner.style.borderRadius = '';
                }
            });
        }
        if (wfClose) {
            wfClose.addEventListener('click', e => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Restauration des données ──────────────────────────────────────
        if (widget.dataset.seFormData) {
            try {
                const fd = JSON.parse(widget.dataset.seFormData);
                widget.querySelector('.se-ps').value           = fd.ps  ?? 0;
                widget.querySelector('.se-ms').value           = fd.ms  ?? 0;
                widget.querySelector('.se-gs').value           = fd.gs  ?? 0;
                widget.querySelector('.se-cp').value           = fd.cp  ?? 28;
                widget.querySelector('.se-ce1').value          = fd.ce1 ?? 31;
                widget.querySelector('.se-ce2').value          = fd.ce2 ?? 36;
                widget.querySelector('.se-cm1').value          = fd.cm1 ?? 41;
                widget.querySelector('.se-cm2').value          = fd.cm2 ?? 29;
                widget.querySelector('.se-nb-classes').value   = fd.nbC ?? 7;
                widget.querySelector('.se-max-niv').value      = fd.maxNiv ?? 2;
                widget.querySelector('.se-gap-niv').value      = fd.gapNiv ?? 1;
                widget.querySelector('.se-gap-eff').value      = fd.gapEff ?? 4;
                widget.querySelector('.se-limit24').checked    = fd.limit24 ?? false;
                widget.querySelectorAll('.se-avoid').forEach(cb => {
                    cb.checked = (fd.avoid || []).includes(cb.value);
                });
            } catch(e) {}
        }

        if (widget.dataset.seResults) {
            results.innerHTML = widget.dataset.seResults;
        }

        // ── Persistance ───────────────────────────────────────────────────
        function persistFormData() {
            widget.dataset.seFormData = JSON.stringify({
                ps:      parseInt(widget.querySelector('.se-ps').value)         || 0,
                ms:      parseInt(widget.querySelector('.se-ms').value)         || 0,
                gs:      parseInt(widget.querySelector('.se-gs').value)         || 0,
                cp:      parseInt(widget.querySelector('.se-cp').value)         || 0,
                ce1:     parseInt(widget.querySelector('.se-ce1').value)        || 0,
                ce2:     parseInt(widget.querySelector('.se-ce2').value)        || 0,
                cm1:     parseInt(widget.querySelector('.se-cm1').value)        || 0,
                cm2:     parseInt(widget.querySelector('.se-cm2').value)        || 0,
                nbC:     parseInt(widget.querySelector('.se-nb-classes').value) || 1,
                maxNiv:  parseInt(widget.querySelector('.se-max-niv').value)    || 2,
                gapNiv:  parseInt(widget.querySelector('.se-gap-niv').value)    || 1,
                gapEff:  parseInt(widget.querySelector('.se-gap-eff').value)    || 4,
                limit24: widget.querySelector('.se-limit24').checked,
                avoid:   Array.from(widget.querySelectorAll('.se-avoid:checked')).map(c => c.value)
            });
        }

        // ── Calcul ────────────────────────────────────────────────────────
        btnCalc.addEventListener('click', () => {
            errorBox.style.display = 'none';
            results.innerHTML = '<div class="se-computing">⏳ Calcul en cours…</div>';
            persistFormData();
            if (typeof saveBoard === 'function') saveBoard();

            setTimeout(() => {
                const data = {
                    niveaux: [
                        { id: 1, nom: "PS",  n: parseInt(widget.querySelector('.se-ps').value)  || 0 },
                        { id: 2, nom: "MS",  n: parseInt(widget.querySelector('.se-ms').value)  || 0 },
                        { id: 3, nom: "GS",  n: parseInt(widget.querySelector('.se-gs').value)  || 0 },
                        { id: 4, nom: "CP",  n: parseInt(widget.querySelector('.se-cp').value)  || 0 },
                        { id: 5, nom: "CE1", n: parseInt(widget.querySelector('.se-ce1').value) || 0 },
                        { id: 6, nom: "CE2", n: parseInt(widget.querySelector('.se-ce2').value) || 0 },
                        { id: 7, nom: "CM1", n: parseInt(widget.querySelector('.se-cm1').value) || 0 },
                        { id: 8, nom: "CM2", n: parseInt(widget.querySelector('.se-cm2').value) || 0 }
                    ],
                    nbClasses:   parseInt(widget.querySelector('.se-nb-classes').value) || 1,
                    maxNiv:      parseInt(widget.querySelector('.se-max-niv').value)    || 2,
                    gapNiv:      parseInt(widget.querySelector('.se-gap-niv').value)    || 1,
                    gapEffectif: parseInt(widget.querySelector('.se-gap-eff').value)    || 4,
                    limit24:     widget.querySelector('.se-limit24').checked,
                    avoid:       Array.from(widget.querySelectorAll('.se-avoid:checked')).map(c => c.value)
                };

                const solutions = calculerSolutions(data);
                if (solutions.length === 0) {
                    results.innerHTML = '';
                    errorBox.textContent = '❌ Aucune solution trouvée. Augmentez l\'écart max ou décochez des contraintes.';
                    errorBox.style.display = 'block';
                    widget.dataset.seResults = '';
                } else {
                    results.innerHTML = renderPropositions(solutions);
                    widget.dataset.seResults = results.innerHTML;
                }
                if (typeof saveBoard === 'function') saveBoard();
            }, 30);
        });

        // ── Effacer résultats ─────────────────────────────────────────────
        btnClear.addEventListener('click', () => {
            results.innerHTML = '';
            errorBox.style.display = 'none';
            widget.dataset.seResults = '';
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Réinitialiser formulaire ──────────────────────────────────────
        btnReset.addEventListener('click', () => {
            widget.querySelector('.se-ps').value         = 0;
            widget.querySelector('.se-ms').value         = 0;
            widget.querySelector('.se-gs').value         = 0;
            widget.querySelector('.se-cp').value         = 28;
            widget.querySelector('.se-ce1').value        = 31;
            widget.querySelector('.se-ce2').value        = 36;
            widget.querySelector('.se-cm1').value        = 41;
            widget.querySelector('.se-cm2').value        = 29;
            widget.querySelector('.se-nb-classes').value = 7;
            widget.querySelector('.se-max-niv').value    = 2;
            widget.querySelector('.se-gap-niv').value    = 1;
            widget.querySelector('.se-gap-eff').value    = 4;
            widget.querySelector('.se-limit24').checked  = false;
            widget.querySelectorAll('.se-avoid').forEach(cb => cb.checked = false);
            results.innerHTML = '';
            errorBox.style.display = 'none';
            widget.dataset.seResults = '';
            widget.dataset.seFormData = '';
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── ResizeObserver ────────────────────────────────────────────────
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                if (outer.offsetWidth  > 0) widget.dataset.seW = outer.offsetWidth;
                if (outer.offsetHeight > 0) widget.dataset.seH = outer.offsetHeight;
            });
            ro.observe(outer);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }

        // ── Poignée de redimensionnement libre ───────────────────────────
        const resizeHandle = widget.querySelector('.se-resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                resizeHandle.setPointerCapture(e.pointerId);
                const startX = e.clientX;
                const startY = e.clientY;
                const startW = outer.offsetWidth;
                const startH = outer.offsetHeight;
                const MIN_W = 280, MIN_H = 200;
                const onMove = (ev) => {
                    const newW = Math.max(MIN_W, startW + ev.clientX - startX);
                    const newH = Math.max(MIN_H, startH + ev.clientY - startY);
                    outer.style.width  = newW + 'px';
                    outer.style.height = newH + 'px';
                    widget.dataset.seW = newW;
                    widget.dataset.seH = newH;
                };
                const onUp = () => {
                    resizeHandle.removeEventListener('pointermove', onMove);
                    resizeHandle.removeEventListener('pointerup',   onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                };
                resizeHandle.addEventListener('pointermove', onMove);
                resizeHandle.addEventListener('pointerup',   onUp);
            });
        }
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createStructureEcoleWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 160, y: 90 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'structure-ecole';
        widget.dataset.transparent = 'true';
        // Le widget s'ouvre à 100px du bord gauche du board.
        widget.style.cssText = `left:100px; top:${pos.y}px;`;
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
            <div class="widget-ctx-menu"></div>
            <div class="se-outer">${seInnerHTML()}</div>
        `;

        const board = document.getElementById('board');
        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        initStructureEcoleWidget(widget);
        if (typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK buildBoardState — sauvegarder les données dans le JSON
    // =========================================================================
    (function patchBuildBoardState() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function') return;
        window.buildBoardState = function () {
            const state = _orig.apply(this, arguments);
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;

            document.querySelectorAll('.widget[data-type="structure-ecole"]').forEach(widget => {
                const outer     = widget.querySelector('.se-outer');
                const collapsed = widget.dataset.collapsed === '1';
                if (!outer) return;

                if (collapsed) {
                    const origLeft = parseFloat(widget.dataset.seLeftSaved);
                    const origTop  = parseFloat(widget.dataset.seTopSaved);
                    if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                    if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                }

                const match = (state.widgets || []).find(w => w.type === 'structure-ecole' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                );
                if (match) {
                    const w = parseFloat(widget.dataset.seW) || outer.offsetWidth;
                    const h = parseFloat(widget.dataset.seH) || outer.offsetHeight;
                    if (w > 0) match.seW = w;
                    if (h > 0) match.seH = h;
                    match.widthPercent    = 0;
                    match.contentHPercent = 0;
                    if (collapsed) {
                        match.leftPercent = parseFloat(widget.dataset.leftPercent);
                        match.topPercent  = parseFloat(widget.dataset.topPercent);
                    }
                    match.seCollapsed  = collapsed;
                    if (widget.dataset.seLeftSaved)  match.seLeftSaved  = widget.dataset.seLeftSaved;
                    if (widget.dataset.seTopSaved)   match.seTopSaved   = widget.dataset.seTopSaved;
                    if (widget.dataset.seFormData)   match.seFormData   = widget.dataset.seFormData;
                    if (widget.dataset.seResults)    match.seResults    = widget.dataset.seResults;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire après chargement
    // =========================================================================
    (function patchRestoreStructureEcole() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                let seList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === 'structure-ecole') seList.push(w); });
                } catch(e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="structure-ecole"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.se-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'se-outer';
                            widget.appendChild(outer);
                        }
                        if (!outer.querySelector('.se-inner')) {
                            outer.innerHTML = seInnerHTML();
                        }

                        const saved = seList[idx];
                        if (saved) {
                            if (saved.seFormData)   widget.dataset.seFormData  = saved.seFormData;
                            if (saved.seResults)    widget.dataset.seResults   = saved.seResults;
                            if (saved.seLeftSaved)  widget.dataset.seLeftSaved = saved.seLeftSaved;
                            if (saved.seTopSaved)   widget.dataset.seTopSaved  = saved.seTopSaved;
                            const w = saved.seW || parseFloat(widget.dataset.seW);
                            const h = saved.seH || parseFloat(widget.dataset.seH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.seW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.seH = h; }

                            if (saved.seCollapsed) {
                                const origLeft = parseFloat(saved.seLeftSaved);
                                const origTop  = parseFloat(saved.seTopSaved);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initStructureEcoleWidget(widget);

                        if (saved && saved.seCollapsed) {
                            outer.style.display = 'none';
                            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                                  .forEach(el => el.style.display = 'none');
                            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
                            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                                w !== widget && w.dataset.collapsed === '1'
                            );
                            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
                            widget.style.top    = MARGIN_TOP + 'px';
                            widget.style.left   = occupiedX  + 'px';
                            widget.style.width  = COLLAPSED_W + 'px';
                            widget.style.height = COLLAPSED_H + 'px';
                            widget.style.overflow     = 'hidden';
                            widget.style.background   = '#2a2a3e';
                            widget.style.borderRadius = '8px';
                            widget.style.border       = 'none';
                            widget.style.padding      = '0';
                            const wc = widget.querySelector('.widget-content');
                            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
                            widget.dataset.collapsed = '1';

                            if (!widget.querySelector('.se-mini-bar')) {
                                const miniBar = document.createElement('div');
                                miniBar.className = 'se-mini-bar';
                                miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
                                const labelEl = document.createElement('span');
                                labelEl.textContent = '🏫 Structure École';
                                labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
                                const expandBtn = document.createElement('button');
                                expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
                                expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
                                expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
                                expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
                                expandBtn.addEventListener('click', e => {
                                    e.stopPropagation(); e.preventDefault();
                                    if (typeof widget._seExpand === 'function') widget._seExpand();
                                });
                                miniBar.appendChild(labelEl);
                                miniBar.appendChild(expandBtn);
                                miniBar.addEventListener('pointerdown', (e) => {
                                    if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                                    e.stopPropagation(); e.preventDefault();
                                    miniBar.setPointerCapture(e.pointerId);
                                    const startX = e.clientX - widget.offsetLeft;
                                    const startY = e.clientY - widget.offsetTop;
                                    const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                                    const onUp = () => {
                                        miniBar.removeEventListener('pointermove', onMove);
                                        miniBar.removeEventListener('pointerup', onUp);
                                        const curW = window.innerWidth;
                                        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                                        widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                                        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                                        if (typeof saveBoard === 'function') saveBoard();
                                    };
                                    miniBar.addEventListener('pointermove', onMove);
                                    miniBar.addEventListener('pointerup', onUp);
                                });
                                widget.appendChild(miniBar);
                            }
                        }
                    });
                }, 150);
            };
        }

        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK createWidget — intercepter type 'structure-ecole'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'structure-ecole') return window.createStructureEcoleWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
