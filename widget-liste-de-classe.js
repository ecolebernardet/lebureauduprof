// =========================================================================
// WIDGET LISTE DE CLASSE — Le Bureau du Prof
// Permet de saisir / importer les prénoms de ses élèves (une ou plusieurs
// classes) et de les réutiliser dans le widget Tirage au Sort et le
// widget Équipes.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (AVANT widget-tirage.js et widget-equipes.js) :
//      <script src="widget-liste-de-classe.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createClasseWidget();closeMainMenu()">
//          <span class="mm-ico">📋</span>Liste de classe
//      </div>
//
// 📌 API globale pour les autres widgets (window.ClasseListe) :
//   ClasseListe.getClasses()          → [{ id, name, count }]
//   ClasseListe.getActiveId()         → id de la classe active (ou null)
//   ClasseListe.getStudents(classId)  → [{ id, prenom, nom, sexe, niveau, dob }]
//                                       (même format que widget-tirage ; sexe = 'F' | 'G' | '')
//                                       classId omis = classe active
//   ClasseListe.getClass(classId)     → { id, name, students:[…] } ou null
//   ClasseListe.onChange(cb)          → cb(source) à chaque modification ; renvoie une
//                                       fonction pour se désabonner
//   (l'événement window 'bdp-classes-changed' est aussi émis)
// =========================================================================

// ─────────────────────────────────────────────────────────────────────────
// STOCKAGE PARTAGÉ (défini une seule fois, quel que soit l'ordre de chargement)
// ─────────────────────────────────────────────────────────────────────────
if (!window.ClasseListe) {
    (function () {
        const KEY = 'bdp_classes_v1';
        const EVT = 'bdp-classes-changed';
        const listeners = new Set();

        function empty() { return { activeId: null, nextClassId: 1, classes: [] }; }

        function read() {
            try {
                const raw = localStorage.getItem(KEY);
                if (raw) {
                    const d = JSON.parse(raw);
                    if (d && Array.isArray(d.classes)) return d;
                }
            } catch (e) {}
            return empty();
        }

        let data = read();

        function commit(source) {
            try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
            listeners.forEach(cb => { try { cb(source); } catch (e) { console.warn('ClasseListe listener', e); } });
            window.dispatchEvent(new CustomEvent(EVT, { detail: { source: source || null } }));
        }

        // Synchronisation entre onglets
        window.addEventListener('storage', (e) => {
            if (e.key !== KEY) return;
            data = read();
            listeners.forEach(cb => { try { cb('storage'); } catch (err) {} });
            window.dispatchEvent(new CustomEvent(EVT, { detail: { source: 'storage' } }));
        });

        function find(id) { return data.classes.find(c => c.id === id) || null; }
        function clone(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }

        function normSexe(v) {
            const s = String(v || '').trim().toLowerCase();
            if (!s) return '';
            if (s === 'f' || s.startsWith('fi') || s.startsWith('fé') || s.startsWith('fe')) return 'F';
            if (s === 'g' || s === 'm' || s === 'h' || s.startsWith('ga') || s.startsWith('gar') ||
                s.startsWith('ma') || s.startsWith('ho')) return 'G';
            return '';
        }

        window.ClasseListe = {
            normSexe,

            onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },

            getClasses() {
                return data.classes.map(c => ({ id: c.id, name: c.name, count: c.students.length }));
            },
            getActiveId() {
                if (data.activeId && find(data.activeId)) return data.activeId;
                return data.classes.length ? data.classes[0].id : null;
            },
            getClass(id) { return clone(find(id || this.getActiveId())); },

            /** Élèves au format attendu par widget-tirage / widget-equipes */
            getStudents(id) {
                const c = find(id || this.getActiveId());
                if (!c) return [];
                const niveau = (c.name || 'CLASSE').trim().toUpperCase();
                return c.students.map(s => ({
                    id: s.id, prenom: s.prenom, nom: s.nom || '',
                    sexe: s.sexe || '', niveau, dob: ''
                }));
            },

            setActive(id, source) {
                if (!find(id)) return;
                data.activeId = id;
                commit(source);
            },
            createClass(name, source) {
                const id = 'c' + (data.nextClassId++);
                data.classes.push({ id, name: (name || 'Ma classe').trim() || 'Ma classe', nextStudentId: 1, students: [] });
                data.activeId = id;
                commit(source);
                return id;
            },
            renameClass(id, name, source) {
                const c = find(id); name = (name || '').trim();
                if (!c || !name) return;
                c.name = name;
                commit(source);
            },
            deleteClass(id, source) {
                data.classes = data.classes.filter(c => c.id !== id);
                if (data.activeId === id) data.activeId = data.classes.length ? data.classes[0].id : null;
                commit(source);
            },

            /** list = [{ prenom, nom?, sexe? }] → renvoie le nombre d'élèves ajoutés */
            addStudents(id, list, source) {
                const c = find(id); if (!c) return 0;
                let n = 0;
                (list || []).forEach(e => {
                    const prenom = String(e.prenom || '').trim();
                    if (!prenom) return;
                    c.students.push({
                        id: c.nextStudentId++, prenom,
                        nom: String(e.nom || '').trim(), sexe: normSexe(e.sexe)
                    });
                    n++;
                });
                if (n) commit(source);
                return n;
            },
            updateStudent(id, sid, patch, source) {
                const c = find(id); if (!c) return;
                const s = c.students.find(x => x.id === sid); if (!s) return;
                if ('prenom' in patch) s.prenom = String(patch.prenom).trim() || s.prenom;
                if ('nom'    in patch) s.nom    = String(patch.nom).trim();
                if ('sexe'   in patch) s.sexe   = normSexe(patch.sexe);
                commit(source);
            },
            removeStudent(id, sid, source) {
                const c = find(id); if (!c) return;
                c.students = c.students.filter(s => s.id !== sid);
                commit(source);
            },
            clearStudents(id, source) {
                const c = find(id); if (!c) return;
                c.students = [];
                commit(source);
            },
            sortStudents(id, source) {
                const c = find(id); if (!c) return;
                c.students.sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' }));
                commit(source);
            },

            // Sauvegarde dans le JSON du board (secours si le localStorage est vide)
            exportData() { return clone(data); },
            hasAnyStudent() { return data.classes.some(c => c.students.length > 0); },
            hydrate(d, source) {
                if (!d || !Array.isArray(d.classes)) return;
                data = clone(d);
                commit(source);
            }
        };
    })();
}

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent ── */
    .widget[data-type="classe"] {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="classe"] .classe-outer {
        position: relative;
        width: 520px;
        height: 620px;
        min-width: 300px;
        min-height: 240px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
    }
    .widget[data-type="classe"] .classe-outer::-webkit-resizer { display: none; }

    /* ── Container intérieur plein ── */
    .classe-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border: 1.5px solid #d1d5db;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(0,0,0,0.12);
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #374151;
        user-select: none;
        box-sizing: border-box;
        position: relative;
    }

    /* ── Header ── */
    .classe-header {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
        cursor: move;
    }
    .classe-header-title {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.3px;
        flex-grow: 1;
        color: #374151;
        pointer-events: none;
    }

    /* ── Onglets classes ── */
    .classe-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 6px 10px;
        align-items: center;
        flex-shrink: 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .classe-tab {
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid #e0e0e0;
        transition: all .15s;
        font-family: inherit;
        background: #f0f0f0;
        color: #999;
        max-width: 160px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .classe-tab:hover { border-color: #9ca3af; }
    .classe-tab.active { background: #6366f1; border-color: #6366f1; color: #fff; }
    .classe-tab-add { background: #f0f4ff; border-color: #c7d2fe; color: #6366f1; }
    .classe-tab-tool {
        padding: 3px 6px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: #fff;
        cursor: pointer;
        font-size: 11px;
        line-height: 1;
        font-family: inherit;
        transition: background .15s;
    }
    .classe-tab-tool:hover { background: #f3f4f6; }
    .classe-tab-tools { margin-left: auto; display: flex; gap: 4px; }

    /* ── Barre d'ajout ── */
    .classe-addbar {
        display: flex;
        gap: 6px;
        padding: 10px 12px 6px;
        flex-shrink: 0;
    }
    .classe-add-input {
        flex: 1;
        min-width: 0;
        padding: 7px 10px;
        border-radius: 8px;
        border: 1.5px solid #d1d5db;
        font-size: 12px;
        font-family: inherit;
        font-weight: 600;
        color: #374151;
        user-select: text;
        transition: border-color .15s;
    }
    .classe-add-input:focus { outline: none; border-color: #6366f1; }
    .classe-btn {
        padding: 7px 12px;
        border-radius: 8px;
        border: none;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: background .15s, transform .1s;
        font-family: inherit;
        background: #6366f1;
        color: #fff;
        white-space: nowrap;
    }
    .classe-btn:hover  { background: #4f46e5; }
    .classe-btn:active { transform: scale(0.96); }
    .classe-btn-soft { background: #f3f4f6; color: #4b5563; }
    .classe-btn-soft:hover { background: #e5e7eb; }
    .classe-btn-danger { background: #f87171; color: #fff; }
    .classe-btn-danger:hover { background: #ef4444; }

    /* ── Barre d'outils ── */
    .classe-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 12px 8px;
        flex-shrink: 0;
    }
    .classe-toolbar .classe-btn { padding: 5px 10px; font-size: 10px; }

    /* ── Liste élèves ── */
    .classe-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 4px 12px 10px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 6px;
        align-content: start;
        scrollbar-width: thin;
        scrollbar-color: #d1d5db transparent;
    }
    .classe-empty {
        grid-column: 1 / -1;
        text-align: center;
        color: #9ca3af;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.6;
        padding: 30px 10px;
    }
    .classe-row {
        display: flex;
        align-items: center;
        gap: 5px;
        background: #f8f9fa;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 3px 6px;
    }
    .classe-num {
        width: 20px;
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
        text-align: right;
        flex-shrink: 0;
    }
    .classe-in {
        min-width: 0;
        flex: 1;
        border: 1px solid transparent;
        background: transparent;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 5px;
        border-radius: 5px;
        color: #374151;
        user-select: text;
    }
    .classe-in:hover { background: #fff; border-color: #e5e7eb; }
    .classe-in:focus { outline: none; background: #fff; border-color: #6366f1; }
    .classe-in-nom { font-weight: 500; color: #6b7280; }
    .classe-sexe {
        width: 26px; height: 22px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: #fff;
        color: #9ca3af;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
        flex-shrink: 0;
        padding: 0;
        font-family: inherit;
        transition: all .15s;
    }
    .classe-sexe[data-s="F"] { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
    .classe-sexe[data-s="G"] { color: #ea580c; border-color: #fed7aa; background: #fff7ed; }
    .classe-del {
        width: 20px; height: 20px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: #d1d5db;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        flex-shrink: 0;
        padding: 0;
        transition: all .15s;
    }
    .classe-del:hover { background: #fee2e2; color: #dc2626; }

    /* ── Footer ── */
    .classe-footer {
        padding: 8px 12px 10px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        flex-shrink: 0;
    }
    .classe-stats { font-size: 10px; color: #9ca3af; font-weight: 600; }
    .classe-stats.ok  { color: #059669; }
    .classe-stats.err { color: #dc2626; }
    .classe-use { display: flex; gap: 6px; align-items: center; font-size: 10px; font-weight: 700; color: #6b7280; }
    .classe-use .classe-btn { padding: 5px 10px; font-size: 10px; }

    /* ── Modal ── */
    .classe-modal-overlay {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 200;
        background: rgba(0,0,0,0.35);
        backdrop-filter: blur(4px);
        align-items: center;
        justify-content: center;
        padding: 20px;
        border-radius: 16px;
        box-sizing: border-box;
    }
    .classe-modal-overlay.open { display: flex; }
    .classe-modal-box {
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        width: 100%;
        max-width: 340px;
        color: #374151;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
        box-sizing: border-box;
    }
    .classe-modal-title { font-size: 13px; font-weight: 800; text-align: center; margin-bottom: 7px; color: #374151; }
    .classe-modal-text {
        font-size: 12px; color: #6b7280; text-align: center; line-height: 1.5;
        font-weight: 500; white-space: pre-line; margin: 0 0 4px;
    }
    .classe-modal-text:empty { display: none; }
    .classe-modal-input, .classe-modal-textarea {
        display: none;
        width: 100%;
        box-sizing: border-box;
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1.5px solid #d1d5db;
        font-size: 12px;
        font-family: inherit;
        color: #374151;
        user-select: text;
    }
    .classe-modal-textarea { resize: vertical; min-height: 130px; }
    .classe-modal-input:focus, .classe-modal-textarea:focus { outline: none; border-color: #6366f1; }
    .classe-modal-btns { display: flex; gap: 8px; margin-top: 14px; }
    .classe-modal-btn {
        flex: 1; padding: 8px; border: none; border-radius: 8px;
        font-weight: 700; font-size: 11px; cursor: pointer; font-family: inherit;
        transition: background .15s, transform .1s;
    }
    .classe-modal-btn:active { transform: scale(0.96); }
    .classe-modal-cancel { background: #f3f4f6; color: #6b7280; }
    .classe-modal-cancel:hover { background: #e5e7eb; }

    /* ── Popup aide ── */
    .classe-help-popup {
        display: none;
        position: absolute;
        top: 42px;
        right: 10px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 12px 14px;
        width: 270px;
        font-size: 11px;
        color: #4b5563;
        z-index: 10;
        line-height: 1.6;
    }
    .classe-help-popup.show { display: block; }
    .classe-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; font-weight: 800; }
    `;

    if (!document.getElementById('classe-widget-style')) {
        const s = document.createElement('style');
        s.id = 'classe-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // Injecter le CSS des boutons wf si pas déjà fait (normalement par widget-monnaie / tirage)
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

    // ── Constantes ────────────────────────────────────────────────────────
    const CL_DEFAULT_W = 520;
    const CL_DEFAULT_H = 620;
    const CL_MIN_W     = 300;
    const CL_MIN_H     = 240;
    const CL_LABEL     = '📋 Liste de classe';

    // ── Analyse d'un texte (saisie, collage, fichier .txt/.csv) ───────────
    // Accepte : un prénom par ligne | prénoms séparés par des virgules |
    //           Prénom;NOM;sexe;… (format du widget tirage) | copier-coller Excel (tabulations)
    function parseStudentsText(text) {
        const CL = window.ClasseListe;
        let lines = String(text || '').replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 1 && lines[0].includes(',') && !/[;\t]/.test(lines[0])) {
            lines = lines[0].split(',').map(s => s.trim()).filter(Boolean);
        }
        const out = [];
        lines.forEach((line, i) => {
            const parts = line.split(/[;\t]/).map(s => s.trim());
            const prenom = parts[0];
            if (!prenom) return;
            if (i === 0 && /^pr[ée]nom$/i.test(prenom)) return; // ligne d'en-tête
            let nom = parts[1] || '', sexe = parts[2] || '';
            // "Léa;F" → le 2e champ est un sexe, pas un nom
            if (parts.length === 2 && /^(f|g|m|h)$/i.test(nom)) { sexe = nom; nom = ''; }
            out.push({ prenom, nom, sexe: CL.normSexe(sexe) });
        });
        return out;
    }

    // ── HTML interne partagé (création + restauration) ────────────────────
    function classeInnerHTML() {
        return `
        <div class="classe-inner">
            <div class="classe-header">
                <div class="classe-header-title">${CL_LABEL}</div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="classe-help-btn-wf" title="Aide" onmousedown="event.stopPropagation()" style="width:22px;height:22px;border-radius:50%;border:1px solid #bbb;background:#f5f5f5;color:#666;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;font-family:inherit;">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                </div>
            </div>
            <div class="classe-help-popup">
                <h4>💡 Comment ça marche</h4>
                <p>• Tapez un prénom puis <b>Entrée</b> pour l'ajouter.<br>
                • <b>📋 Coller une liste</b> : un prénom par ligne (ou séparés par des virgules).
                Format complet accepté : <em>Prénom;NOM;sexe</em><br>
                • Cliquez sur un prénom/nom pour le corriger, sur <b>F / G</b> pour changer le sexe (couleur dans le tirage).<br>
                • Plusieurs classes possibles (onglets). La classe active est proposée par défaut
                dans les widgets <b>Tirage</b> et <b>Équipes</b>.<br>
                • Les listes sont mémorisées sur cet ordinateur.</p>
            </div>
            <div class="classe-tabs"></div>
            <div class="classe-addbar">
                <input type="text" class="classe-add-input" placeholder="Ajouter un prénom puis Entrée…" autocomplete="off">
                <button class="classe-btn classe-add-btn" title="Ajouter">➕</button>
            </div>
            <div class="classe-toolbar">
                <button class="classe-btn classe-btn-soft classe-bulk-btn">📋 Coller une liste</button>
                <button class="classe-btn classe-btn-soft classe-file-btn">📄 Importer un fichier</button>
                <button class="classe-btn classe-btn-soft classe-export-btn">💾 Exporter</button>
                <button class="classe-btn classe-btn-soft classe-sort-btn">🔤 Trier A→Z</button>
                <button class="classe-btn classe-btn-soft classe-clear-btn">🗑️ Vider</button>
                <input type="file" class="classe-file-input" accept=".txt,.csv" style="display:none;">
            </div>
            <div class="classe-list"></div>
            <div class="classe-footer">
                <div class="classe-stats">--</div>
                <div class="classe-use">
                    Utiliser dans :
                    <button class="classe-btn classe-use-tirage">🎲 Tirage</button>
                    <button class="classe-btn classe-use-equipes">👥 Équipes</button>
                </div>
            </div>
            <div class="classe-modal-overlay">
                <div class="classe-modal-box">
                    <div class="classe-modal-title">Confirmation</div>
                    <p class="classe-modal-text"></p>
                    <input type="text" class="classe-modal-input" autocomplete="off">
                    <textarea class="classe-modal-textarea"></textarea>
                    <div class="classe-modal-btns">
                        <button class="classe-modal-btn classe-modal-cancel">Annuler</button>
                        <button class="classe-modal-btn classe-modal-confirm" style="background:#6366f1;color:#fff;">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ── Mini-barre (widget réduit) — partagé collapse + restauration ──────
    function classeApplyCollapsedLook(widget) {
        widget.querySelector('.classe-outer').style.display = 'none';
        widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
              .forEach(el => el.style.display = 'none');

        const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
        const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
            w !== widget && w.dataset.collapsed === '1'
        );
        const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
        widget.style.top          = MARGIN_TOP + 'px';
        widget.style.left         = occupiedX  + 'px';
        widget.style.width        = COLLAPSED_W + 'px';
        widget.style.height       = COLLAPSED_H + 'px';
        widget.style.overflow     = 'hidden';
        widget.style.background   = '#2a2a3e';
        widget.style.borderRadius = '8px';
        widget.style.border       = 'none';
        widget.style.padding      = '0';
        const wc = widget.querySelector('.widget-content');
        if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
        widget.dataset.collapsed = '1';

        if (widget.querySelector('.classe-mini-bar')) return;

        const miniBar = document.createElement('div');
        miniBar.className = 'classe-mini-bar';
        miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

        const labelEl = document.createElement('span');
        labelEl.textContent = CL_LABEL;
        labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

        const expandBtn = document.createElement('button');
        expandBtn.title = 'Déplier';
        expandBtn.textContent = '▲';
        expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
        expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
        expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
        expandBtn.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            if (typeof widget._classeExpand === 'function') widget._classeExpand();
        });

        miniBar.appendChild(labelEl);
        miniBar.appendChild(expandBtn);
        widget.appendChild(miniBar);

        // Mini-barre draggable
        miniBar.addEventListener('pointerdown', (e) => {
            if (e.target === expandBtn || expandBtn.contains(e.target)) return;
            e.stopPropagation(); e.preventDefault();
            miniBar.setPointerCapture(e.pointerId);
            const startX = e.clientX - widget.offsetLeft;
            const startY = e.clientY - widget.offsetTop;
            const onMove = ev => {
                widget.style.left = Math.max(0, ev.clientX - startX) + 'px';
                widget.style.top  = Math.max(0, ev.clientY - startY) + 'px';
            };
            const onUp = () => {
                miniBar.removeEventListener('pointermove', onMove);
                miniBar.removeEventListener('pointerup',   onUp);
                const curW  = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            miniBar.addEventListener('pointermove', onMove);
            miniBar.addEventListener('pointerup',   onUp);
        });
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initClasseWidget = function (widget) {

        // Nettoyer une éventuelle initialisation précédente (déplier, etc.)
        if (typeof widget._classeCleanup === 'function') widget._classeCleanup();
        const cleanups = [];
        widget._classeCleanup = () => cleanups.forEach(fn => { try { fn(); } catch (e) {} });

        const CL    = window.ClasseListe;
        const outer = widget.querySelector('.classe-outer');

        // Bloquer la remontée mousedown/clavier depuis l'intérieur
        // (sinon le drag ou les raccourcis du board se déclenchent pendant la saisie)
        outer.addEventListener('mousedown', e => e.stopPropagation());
        outer.addEventListener('keydown',   e => e.stopPropagation());
        outer.addEventListener('keyup',     e => e.stopPropagation());

        // ── Header draggable (une seule fois) ─────────────────────────────
        const classeHeader = widget.querySelector('.classe-header');
        if (classeHeader && !classeHeader._dragInit) {
            classeHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            classeHeader.addEventListener('mousedown',  onHeaderDown);
            classeHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const tabsEl       = widget.querySelector('.classe-tabs');
        const addInput     = widget.querySelector('.classe-add-input');
        const addBtn       = widget.querySelector('.classe-add-btn');
        const bulkBtn      = widget.querySelector('.classe-bulk-btn');
        const fileBtn      = widget.querySelector('.classe-file-btn');
        const exportBtn    = widget.querySelector('.classe-export-btn');
        const sortBtn      = widget.querySelector('.classe-sort-btn');
        const clearBtn     = widget.querySelector('.classe-clear-btn');
        const fileInput    = widget.querySelector('.classe-file-input');
        const listEl       = widget.querySelector('.classe-list');
        const statsEl      = widget.querySelector('.classe-stats');
        const useTirageBtn = widget.querySelector('.classe-use-tirage');
        const useEquipBtn  = widget.querySelector('.classe-use-equipes');
        const modalOverlay = widget.querySelector('.classe-modal-overlay');
        const helpBtn      = widget.querySelector('.classe-help-btn-wf');
        const helpPopup    = widget.querySelector('.classe-help-popup');
        const wfMin        = widget.querySelector('[data-role="wf-min"]');
        const wfMax        = widget.querySelector('[data-role="wf-max"]');
        const wfClose      = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;
        let flashTimer = null;

        // ── Données : secours depuis le JSON du board si localStorage vide ─
        if (!CL.getClasses().length && widget.dataset.classeData) {
            try { CL.hydrate(JSON.parse(widget.dataset.classeData), widget); } catch (e) {}
        }
        if (!CL.getClasses().length) CL.createClass('Ma classe', widget);

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        function classeCollapse() {
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.classeW) || CL_DEFAULT_W;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.classeH) || CL_DEFAULT_H;
            widget.dataset.classeW = savedW;
            widget.dataset.classeH = savedH;

            // Sauvegarder la position ORIGINALE avant de déplacer le widget
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.classeSavedLeft = widget.offsetLeft;
            widget.dataset.classeSavedTop  = widget.offsetTop;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            classeApplyCollapsedLook(widget);
            if (typeof saveBoard === 'function') saveBoard();
        }

        function classeExpand() {
            const savedW    = parseFloat(widget.dataset.classeW) || CL_DEFAULT_W;
            const savedH    = parseFloat(widget.dataset.classeH) || CL_DEFAULT_H;
            const savedLeft = parseFloat(widget.dataset.classeSavedLeft);
            const savedTop  = parseFloat(widget.dataset.classeSavedTop);

            widget.querySelectorAll('.classe-mini-bar').forEach(el => el.remove());

            // Réinitialiser tous les styles inline du widget
            widget.removeAttribute('style');
            widget.style.left = (!isNaN(savedLeft) ? savedLeft : widget.offsetLeft) + 'px';
            widget.style.top  = (!isNaN(savedTop)  ? savedTop  : widget.offsetTop)  + 'px';

            const wc = widget.querySelector('.widget-content');
            if (wc) wc.removeAttribute('style');

            widget.dataset.collapsed = '0';

            outer.style.display = '';
            outer.style.width   = savedW + 'px';
            outer.style.height  = savedH + 'px';

            // Réinjecter le HTML interne et réinitialiser
            outer.innerHTML = classeInnerHTML();
            initClasseWidget(widget);

            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        widget._classeExpand = classeExpand;

        function toggleMax() {
            _isMax = !_isMax;
            const inner = widget.querySelector('.classe-inner');
            if (_isMax) {
                inner.style.position     = 'fixed';
                inner.style.inset        = '0';
                inner.style.width        = '100%';
                inner.style.height       = '100%';
                inner.style.zIndex       = '9999';
                inner.style.borderRadius = '0';
            } else {
                inner.style.position     = '';
                inner.style.inset        = '';
                inner.style.width        = '';
                inner.style.height       = '';
                inner.style.zIndex       = '';
                inner.style.borderRadius = '';
            }
        }

        if (wfMin) {
            wfMin.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            wfMin.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); classeCollapse(); });
        }
        if (wfMax) wfMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMax(); });
        if (wfClose) {
            wfClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }
        // Échap = quitter le plein écran
        outer.addEventListener('keydown', (e) => { if (e.key === 'Escape' && _isMax) toggleMax(); });

        // ── Aide popup ────────────────────────────────────────────────────
        if (helpBtn && helpPopup) {
            helpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                helpPopup.classList.toggle('show');
            });
            helpBtn.addEventListener('mouseover', () => { helpBtn.style.background = '#e0e0e0'; helpBtn.style.color = '#333'; });
            helpBtn.addEventListener('mouseout',  () => { helpBtn.style.background = '#f5f5f5'; helpBtn.style.color = '#666'; });
            const closeHelp = () => helpPopup.classList.remove('show');
            document.addEventListener('click', closeHelp);
            cleanups.push(() => document.removeEventListener('click', closeHelp));
        }

        // ── Modal générique ───────────────────────────────────────────────
        // opts : { title, text, input:{value,placeholder}, textarea:{placeholder},
        //          confirmLabel, danger, onConfirm(value) }  (sans onConfirm = simple information)
        const mTitle   = modalOverlay.querySelector('.classe-modal-title');
        const mText    = modalOverlay.querySelector('.classe-modal-text');
        const mInput   = modalOverlay.querySelector('.classe-modal-input');
        const mArea    = modalOverlay.querySelector('.classe-modal-textarea');
        const mCancel  = modalOverlay.querySelector('.classe-modal-cancel');
        const mConfirm = modalOverlay.querySelector('.classe-modal-confirm');

        function closeModal() { modalOverlay.classList.remove('open'); }

        function showModal(opts) {
            mTitle.textContent = opts.title || 'Confirmation';
            mText.textContent  = opts.text  || '';
            mInput.style.display = opts.input    ? 'block' : 'none';
            mArea.style.display  = opts.textarea ? 'block' : 'none';
            if (opts.input)    { mInput.value = opts.input.value || ''; mInput.placeholder = opts.input.placeholder || ''; }
            if (opts.textarea) { mArea.value = ''; mArea.placeholder = opts.textarea.placeholder || ''; }
            mConfirm.textContent      = opts.confirmLabel || 'Confirmer';
            mConfirm.style.background = opts.danger ? '#f87171' : '#6366f1';

            const submit = () => {
                const val = opts.input ? mInput.value.trim() : (opts.textarea ? mArea.value : '');
                if ((opts.input || opts.textarea) && !val.trim()) return;
                closeModal();
                if (opts.onConfirm) opts.onConfirm(val);
            };
            if (opts.onConfirm) {
                mCancel.style.display = '';
                mConfirm.onclick = submit;
            } else {
                mCancel.style.display = 'none';
                mConfirm.onclick = closeModal;
            }
            mInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };

            modalOverlay.classList.add('open');
            setTimeout(() => {
                if (opts.input) { mInput.focus(); mInput.select(); }
                else if (opts.textarea) mArea.focus();
            }, 30);
        }
        mCancel.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

        // ── Utilitaires d'affichage ───────────────────────────────────────
        function flash(msg, cls) {
            statsEl.textContent = msg;
            statsEl.className   = 'classe-stats' + (cls ? ' ' + cls : '');
            clearTimeout(flashTimer);
            flashTimer = setTimeout(renderStats, 2500);
        }

        function activeClass() { return CL.getClass(CL.getActiveId()); }

        function renderStats() {
            statsEl.className = 'classe-stats';
            const cls = activeClass();
            if (!cls) { statsEl.textContent = '--'; return; }
            const n = cls.students.length;
            const f = cls.students.filter(s => s.sexe === 'F').length;
            const g = cls.students.filter(s => s.sexe === 'G').length;
            statsEl.textContent = n + ' élève' + (n > 1 ? 's' : '') + (f || g ? ' · ' + f + ' F · ' + g + ' G' : '');
        }

        // ── Onglets classes ───────────────────────────────────────────────
        function renderTabs() {
            tabsEl.innerHTML = '';
            const activeId = CL.getActiveId();
            CL.getClasses().forEach(c => {
                const tab = document.createElement('button');
                tab.className   = 'classe-tab' + (c.id === activeId ? ' active' : '');
                tab.textContent = c.name + ' (' + c.count + ')';
                tab.title       = c.name;
                tab.addEventListener('click', () => { CL.setActive(c.id, widget); refreshAll(); });
                tabsEl.appendChild(tab);
            });

            const addTab = document.createElement('button');
            addTab.className   = 'classe-tab classe-tab-add';
            addTab.textContent = '➕ Classe';
            addTab.title       = 'Nouvelle classe';
            addTab.addEventListener('click', () => {
                showModal({
                    title: 'Nouvelle classe',
                    input: { placeholder: 'Ex : CM2 A' },
                    confirmLabel: 'Créer',
                    onConfirm: (name) => { CL.createClass(name, widget); refreshAll(); addInput.focus(); }
                });
            });
            tabsEl.appendChild(addTab);

            const tools = document.createElement('div');
            tools.className = 'classe-tab-tools';

            const renameBtn = document.createElement('button');
            renameBtn.className = 'classe-tab-tool';
            renameBtn.textContent = '✏️';
            renameBtn.title = 'Renommer la classe';
            renameBtn.addEventListener('click', () => {
                const cls = activeClass(); if (!cls) return;
                showModal({
                    title: 'Renommer la classe',
                    input: { value: cls.name },
                    confirmLabel: 'Renommer',
                    onConfirm: (name) => { CL.renameClass(cls.id, name, widget); renderTabs(); }
                });
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'classe-tab-tool';
            delBtn.textContent = '🗑';
            delBtn.title = 'Supprimer la classe';
            delBtn.addEventListener('click', () => {
                const cls = activeClass(); if (!cls) return;
                showModal({
                    title: 'Supprimer la classe ?',
                    text: '« ' + cls.name + ' » et ses ' + cls.students.length + ' élève(s) seront supprimés.',
                    confirmLabel: 'Supprimer', danger: true,
                    onConfirm: () => {
                        CL.deleteClass(cls.id, widget);
                        if (!CL.getClasses().length) CL.createClass('Ma classe', widget);
                        refreshAll();
                    }
                });
            });

            tools.appendChild(renameBtn);
            tools.appendChild(delBtn);
            tabsEl.appendChild(tools);
        }

        // ── Liste des élèves ──────────────────────────────────────────────
        const SEXE_LABEL = { '': '–', 'F': 'F', 'G': 'G' };
        const SEXE_NEXT  = { '': 'F', 'F': 'G', 'G': '' };

        function renderList() {
            const cls = activeClass();
            listEl.innerHTML = '';
            if (!cls) return;

            if (!cls.students.length) {
                const empty = document.createElement('div');
                empty.className = 'classe-empty';
                empty.innerHTML = '👋 Aucun élève pour l\'instant.<br>Tapez un prénom ci-dessus puis Entrée,<br>ou utilisez « Coller une liste ».';
                listEl.appendChild(empty);
                return;
            }

            cls.students.forEach((s, i) => {
                const row = document.createElement('div');
                row.className = 'classe-row';

                const num = document.createElement('span');
                num.className = 'classe-num';
                num.textContent = i + 1;

                const inP = document.createElement('input');
                inP.className = 'classe-in classe-in-prenom';
                inP.value = s.prenom;
                inP.placeholder = 'Prénom';
                inP.addEventListener('change', () => {
                    const v = inP.value.trim();
                    if (!v) { inP.value = s.prenom; return; }
                    s.prenom = v;
                    CL.updateStudent(cls.id, s.id, { prenom: v }, widget);
                });
                inP.addEventListener('keydown', (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    inP.blur();
                    const next = row.nextElementSibling && row.nextElementSibling.querySelector('.classe-in-prenom');
                    if (next) next.focus();
                    else addInput.focus();
                });

                const inN = document.createElement('input');
                inN.className = 'classe-in classe-in-nom';
                inN.value = s.nom || '';
                inN.placeholder = 'Nom';
                inN.addEventListener('change', () => {
                    s.nom = inN.value.trim();
                    CL.updateStudent(cls.id, s.id, { nom: s.nom }, widget);
                });
                inN.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inN.blur(); } });

                const sx = document.createElement('button');
                sx.className = 'classe-sexe';
                sx.dataset.s = s.sexe || '';
                sx.textContent = SEXE_LABEL[s.sexe || ''];
                sx.title = 'Sexe : cliquer pour changer (–, F, G)';
                sx.addEventListener('click', () => {
                    s.sexe = SEXE_NEXT[s.sexe || ''];
                    sx.dataset.s = s.sexe;
                    sx.textContent = SEXE_LABEL[s.sexe];
                    CL.updateStudent(cls.id, s.id, { sexe: s.sexe }, widget);
                    renderStats();
                });

                const del = document.createElement('button');
                del.className = 'classe-del';
                del.textContent = '×';
                del.title = 'Retirer cet élève';
                del.addEventListener('click', () => {
                    CL.removeStudent(cls.id, s.id, widget);
                    refreshAll(true);
                });

                row.appendChild(num);
                row.appendChild(inP);
                row.appendChild(inN);
                row.appendChild(sx);
                row.appendChild(del);
                listEl.appendChild(row);
            });
        }

        function refreshAll(keepScroll) {
            const st = listEl.scrollTop;
            renderTabs();
            renderList();
            renderStats();
            if (keepScroll) listEl.scrollTop = st;
        }

        // ── Ajout ─────────────────────────────────────────────────────────
        function addFromText(text, fromBulk) {
            const cls = activeClass(); if (!cls) return;
            const entries = parseStudentsText(text);
            if (!entries.length) { flash('Aucun prénom trouvé.', 'err'); return; }
            const n = CL.addStudents(cls.id, entries, widget);
            refreshAll();
            listEl.scrollTop = listEl.scrollHeight;
            flash('✓ ' + n + ' élève' + (n > 1 ? 's' : '') + ' ajouté' + (n > 1 ? 's' : ''), 'ok');
            if (!fromBulk) addInput.focus();
        }

        function addSingle() {
            const v = addInput.value.trim();
            if (!v) return;
            addFromText(v);
            addInput.value = '';
            addInput.focus();
        }

        addBtn.addEventListener('click', addSingle);
        addInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSingle(); } });
        // Coller plusieurs lignes directement dans le champ
        addInput.addEventListener('paste', (e) => {
            const txt = (e.clipboardData || window.clipboardData).getData('text');
            if (/[\n\r;\t]/.test(txt.trim())) {
                e.preventDefault();
                addFromText(txt);
            }
        });

        bulkBtn.addEventListener('click', () => {
            showModal({
                title: 'Coller une liste d\'élèves',
                text: 'Un prénom par ligne, ou séparés par des virgules.\nFormat complet : Prénom;NOM;sexe',
                textarea: { placeholder: 'Léa\nHugo\nMaïa;Durand;F\nLucas;Martin;G' },
                confirmLabel: 'Ajouter',
                onConfirm: (val) => addFromText(val, true)
            });
        });

        // ── Import fichier ────────────────────────────────────────────────
        fileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => addFromText(ev.target.result, true);
            reader.readAsText(file, 'UTF-8');
            e.target.value = '';
        });

        // ── Export .txt (compatible avec l'import du widget tirage) ───────
        exportBtn.addEventListener('click', () => {
            const cls = activeClass();
            if (!cls || !cls.students.length) { flash('Rien à exporter.', 'err'); return; }
            const niveau = cls.name.trim().toUpperCase();
            const txt = cls.students.map(s => [s.prenom, s.nom || '', s.sexe || '', niveau, ''].join(';')).join('\n');
            const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'classe-' + cls.name.replace(/[^\w\-]+/g, '_') + '.txt';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            flash('✓ Liste exportée', 'ok');
        });

        // ── Trier / Vider ─────────────────────────────────────────────────
        sortBtn.addEventListener('click', () => {
            const cls = activeClass(); if (!cls) return;
            CL.sortStudents(cls.id, widget);
            refreshAll();
        });

        clearBtn.addEventListener('click', () => {
            const cls = activeClass();
            if (!cls || !cls.students.length) return;
            showModal({
                title: 'Vider la classe ?',
                text: 'Les ' + cls.students.length + ' élèves de « ' + cls.name + ' » seront retirés.',
                confirmLabel: 'Vider', danger: true,
                onConfirm: () => { CL.clearStudents(cls.id, widget); refreshAll(); }
            });
        });

        // ── Ouvrir les autres widgets ─────────────────────────────────────
        useTirageBtn.addEventListener('click', () => {
            if (typeof window.createTirageWidget === 'function') window.createTirageWidget();
            else showModal({ title: 'Widget indisponible', text: 'Le widget Tirage au Sort n\'est pas chargé.' });
        });
        useEquipBtn.addEventListener('click', () => {
            const fn = window.createEquipesWidget || window.createEquipeWidget || window.createTeamsWidget;
            if (typeof fn === 'function') fn();
            else if (typeof window.createWidget === 'function') window.createWidget('equipes');
            else showModal({ title: 'Widget indisponible', text: 'Le widget Équipes n\'est pas chargé.' });
        });

        // ── Synchronisation avec les autres widgets liste de classe ───────
        const off = CL.onChange((source) => {
            if (source === widget) return;
            if (!document.contains(widget)) { off(); return; }
            if (widget.querySelector('.classe-modal-overlay.open')) return;
            refreshAll(true);
        });
        cleanups.push(off);

        // ── Mise à jour du JSON du board quand les données changent ───────
        const offSave = CL.onChange(() => {
            if (!document.contains(widget)) { offSave(); return; }
            widget.dataset.classeData = JSON.stringify(CL.exportData());
        });
        cleanups.push(offSave);
        widget.dataset.classeData = JSON.stringify(CL.exportData());

        // ── Rendu initial ─────────────────────────────────────────────────
        refreshAll();

        // ── Poignée de redimensionnement custom ───────────────────────────
        if (!widget.querySelector('.custom-resize-handle')) {
            const handle = document.createElement('div');
            handle.className = 'custom-resize-handle';
            handle.title = 'Redimensionner';
            widget.appendChild(handle);

            handle.addEventListener('pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                e.stopPropagation();
                e.preventDefault();
                handle.setPointerCapture(e.pointerId);
                const startX = e.clientX, startY = e.clientY;
                const startW = outer.offsetWidth,  startH = outer.offsetHeight;

                function onMove(ev) {
                    ev.preventDefault();
                    outer.style.width  = Math.max(CL_MIN_W, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(CL_MIN_H, startH + ev.clientY - startY) + 'px';
                }
                function onUp() {
                    handle.removeEventListener('pointermove',   onMove);
                    handle.removeEventListener('pointerup',     onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                handle.addEventListener('pointermove',   onMove);
                handle.addEventListener('pointerup',     onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        }

        // ── Sauvegarder la taille via ResizeObserver ──────────────────────
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                // Ne pas écraser les dimensions sauvegardées si le widget est réduit
                if (widget.dataset.collapsed !== '1') {
                    if (outer.offsetWidth  > 0) widget.dataset.classeW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.classeH = outer.offsetHeight;
                }
            });
            ro.observe(outer);
            cleanups.push(() => ro.disconnect());
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
            cleanups.push(() => guard.disconnect());
        }
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createClasseWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 120, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'classe';
        widget.dataset.transparent = 'true';
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
            <div class="classe-outer">${classeInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        initClasseWidget(widget);
        saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK buildBoardState — inclure dimensions + données dans le JSON
    // =========================================================================
    (function patchBuildBoardState() {
        function doPatch() {
            const _orig = window.buildBoardState;
            if (typeof _orig !== 'function') return;
            window.buildBoardState = function () {
                const state = _orig.apply(this, arguments);
                const curW  = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                document.querySelectorAll('.widget[data-type="classe"]').forEach(widget => {
                    const outer     = widget.querySelector('.classe-outer');
                    const collapsed = widget.dataset.collapsed === '1';
                    if (!outer) return;

                    // Quand réduit, leftPercent/topPercent = position d'ORIGINE (sauvée avant collapse)
                    if (collapsed) {
                        const origLeft = parseFloat(widget.dataset.classeSavedLeft);
                        const origTop  = parseFloat(widget.dataset.classeSavedTop);
                        if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                        if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                    }

                    const match = (state.widgets || []).find(w => w.type === 'classe' &&
                        Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                    );
                    if (match) {
                        const w = parseFloat(widget.dataset.classeW) || outer.offsetWidth;
                        const h = parseFloat(widget.dataset.classeH) || outer.offsetHeight;
                        if (w > 0) match.classeW = w;
                        if (h > 0) match.classeH = h;
                        match.widthPercent    = 0;
                        match.contentHPercent = 0;
                        if (collapsed) {
                            match.leftPercent = parseFloat(widget.dataset.leftPercent);
                            match.topPercent  = parseFloat(widget.dataset.topPercent);
                        }
                        match.classeCollapsed = collapsed;
                        if (widget.dataset.classeSavedLeft) match.classeSavedLeft = widget.dataset.classeSavedLeft;
                        if (widget.dataset.classeSavedTop)  match.classeSavedTop  = widget.dataset.classeSavedTop;
                        if (widget.dataset.classeData)      match.classeData      = widget.dataset.classeData;
                    }
                });
                return state;
            };
        }
        if (typeof window.buildBoardState === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestoreClasse() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                let classeList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === 'classe') classeList.push(w); });
                } catch (e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="classe"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.classe-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'classe-outer';
                            widget.appendChild(outer);
                        }
                        if (!outer.querySelector('.classe-inner')) {
                            outer.innerHTML = classeInnerHTML();
                        }

                        // Correspondance par index d'ordre
                        const saved = classeList[idx];

                        if (saved) {
                            if (saved.classeData)      widget.dataset.classeData      = saved.classeData;
                            if (saved.classeSavedLeft) widget.dataset.classeSavedLeft = saved.classeSavedLeft;
                            if (saved.classeSavedTop)  widget.dataset.classeSavedTop  = saved.classeSavedTop;
                            const w = saved.classeW || parseFloat(widget.dataset.classeW);
                            const h = saved.classeH || parseFloat(widget.dataset.classeH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.classeW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.classeH = h; }

                            if (saved.classeCollapsed) {
                                const origLeft = parseFloat(saved.classeSavedLeft);
                                const origTop  = parseFloat(saved.classeSavedTop);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initClasseWidget(widget);

                        // Appliquer l'état réduit APRÈS init
                        if (saved && saved.classeCollapsed) classeApplyCollapsedLook(widget);
                    });
                }, 150);
            };
        }

        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK createWidget — intercepter type 'classe'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'classe') return window.createClasseWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
