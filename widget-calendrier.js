// =========================================================================
// WIDGET CALENDRIER — Le Bureau du Prof
// =========================================================================

// =========================================================================
// STYLES — injectés dynamiquement (évite de polluer index.html)
// =========================================================================
(function _calInjectStyles() {
    if (document.getElementById('cal-widget-styles')) return; // déjà injecté
    const style = document.createElement('style');
    style.id = 'cal-widget-styles';
    style.textContent = `
/* ══════════════════════════════════════════════════
   WIDGET CALENDRIER
   Toutes les tailles sont en em : un seul font-size
   sur .cal-container (posé par JS via ResizeObserver)
   suffit pour tout faire grossir/rétrécir.
══════════════════════════════════════════════════ */

/* ── Conteneur principal ─────────────────────────── */
.cal-container {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    border-radius: 0.6em;
    padding: 0.5em;
    min-width: 260px;
    min-height: 220px;
    overflow: hidden;
    box-sizing: border-box;
    user-select: none;
    background: #ffffff;
}
.cal-container.cal-light { background: #ffffff; }

/* ── Header ─────────────────────────────────────── */
.cal-header {
    display: flex;
    align-items: center;
    gap: 0.3em;
    margin-bottom: 0.4em;
}
.cal-title {
    flex: 1;
    text-align: center;
    font-weight: 700;
    font-size: 1.05em;
    color: #1a1a3a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.cal-nav {
    background: #f0f0f8;
    border: 1px solid #c8c8e0;
    color: #444;
    border-radius: 0.4em;
    width: 1.9em; height: 1.9em;
    cursor: pointer;
    font-size: 1.1em;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 0;
    transition: background .15s;
    flex-shrink: 0;
}
.cal-nav:hover { background: #4a90e2; color: #fff; border-color: #4a90e2; }
.cal-today-btn {
    background: #eef5ff;
    border: 1px solid #4a90e2;
    color: #2a6abf;
    border-radius: 0.4em;
    padding: 0.15em 0.5em;
    font-size: 0.85em;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
    flex-shrink: 0;
}
.cal-today-btn:hover { background: #4a90e2; color: #fff; }
.cal-year-btn {
    background: #f0f0f8;
    border: 1px solid #c8c8e0;
    color: #555;
    border-radius: 0.4em;
    width: 1.9em; height: 1.9em;
    font-size: 1em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    padding: 0;
    transition: background .15s;
    flex-shrink: 0;
}
.cal-year-btn:hover { background: #4a90e2; color: #fff; border-color: #4a90e2; }
.cal-opts-btn {
    background: #f0f0f8;
    border: 1px solid #c8c8e0;
    color: #666;
    border-radius: 0.4em;
    width: 1.9em; height: 1.9em;
    font-size: 1em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    padding: 0;
    transition: background .15s;
    flex-shrink: 0;
}
.cal-opts-btn:hover { background: #444; color: #fff; border-color: #444; }

/* ── Panneau options ─────────────────────────────── */
.cal-opts-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    background: #f0f0f8;
    border: 1px solid #c8c8e0;
    border-radius: 0.5em;
    padding: 0.4em 0.5em;
    margin-bottom: 0.4em;
    align-items: center;
}
.cal-opt-check {
    display: flex; align-items: center; gap: 0.35em;
    font-size: 0.82em; color: #444; cursor: pointer;
}
.cal-opt-check input { accent-color: #4a90e2; cursor: pointer; }
.cal-opts-sep {
    width: 1px;
    background: #ccc;
    align-self: stretch;
    margin: 0 2px;
    flex-shrink: 0;
}
.cal-idb-status {
    background: #f0fff0;
    border: 1px solid #aaddaa;
    border-radius: 0.4em;
    color: #2a7a2a;
    font-size: 0.72em;
    padding: 0.12em 0.35em;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background .12s;
    line-height: 1.4;
}
.cal-idb-status:hover { background: #d0f0d0; }
.cal-export-btn, .cal-import-lbl {
    background: #eef5ff;
    border: 1px solid #4a90e2;
    border-radius: 0.4em;
    color: #2a6abf;
    font-size: 0.72em;
    padding: 0.12em 0.35em;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background .12s;
    font-family: inherit;
    display: flex; align-items: center;
    line-height: 1.4;
}
.cal-export-btn:hover, .cal-import-lbl:hover { background: #4a90e2; color: #fff; }
.cal-school-btn {
    background: #fff0f2;
    border: 1px solid #e0909a;
    border-radius: 0.4em;
    color: #a04050;
    font-size: 0.72em;
    padding: 0.12em 0.4em;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background .12s;
    font-family: inherit;
    line-height: 1.4;
}
.cal-school-btn:hover { background: #e0909a; color: #fff; }

/* ── Vue annuelle (mini-calendriers) ────────────── */
.cal-year-panel {
    margin-bottom: 0.4em;
    overflow: hidden;
}
.cal-year-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(2, auto);
    gap: 0.35em;
    background: #f0f0f8;
    border: 1px solid #c8c8e0;
    border-radius: 0.5em;
    padding: 0.4em;
}
.cal-ym-card {
    background: #fff;
    border: 1.5px solid #dde;
    border-radius: 0.4em;
    cursor: pointer;
    padding: 0.25em 0.2em 0.2em;
    display: flex;
    flex-direction: column;
    gap: 0.15em;
    transition: border-color .12s, box-shadow .12s;
    overflow: hidden;
}
.cal-ym-card:hover { border-color: #4a90e2; box-shadow: 0 2px 6px rgba(74,144,226,0.18); }
.cal-ym-card.cal-ym-active { border-color: #4a90e2; background: #eef5ff; }
.cal-ym-card.cal-ym-today:not(.cal-ym-active) { border-color: #9ab8e0; }
.cym-title {
    text-align: center;
    font-weight: 700;
    font-size: 0.5em;
    color: #3a3a6a;
    line-height: 1.2;
    padding-bottom: 0.15em;
    border-bottom: 1px solid #eee;
    white-space: nowrap;
}
.cal-ym-card.cal-ym-active .cym-title { color: #1a4a8a; }
.cym-yr { font-weight: 400; opacity: 0.65; font-size: 0.9em; }
.cym-grid { display: flex; flex-direction: column; gap: 0; }
.cym-row { display: grid; grid-template-columns: repeat(7, 1fr); }
.cym-row span {
    text-align: center;
    font-size: 0.3em;
    line-height: 1.7;
    border-radius: 0;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    box-sizing: border-box;
}
.cym-row span:last-child { border-right: none; }
.cym-row:last-child span { border-bottom: none; }
.cym-head span {
    font-weight: 700;
    color: #8888bb;
    font-size: 0.4em;
    line-height: 1.8;
    border-bottom: 1px solid #d0d0e8;
    background: #f6f6fc;
}
.cym-empty { visibility: hidden; }
.cym-row span.cym-school { background: #f5d5d8; color: #a04050; }
.cym-row span.cym-curday { background: #4a90e2; color: #fff; font-weight: 700; border-radius: 50%; }
.cym-row span.cym-curday.cym-school { background: #c0607a; color: #fff; }

/* ── Grille principale ───────────────────────────── */
.cal-grid {
    display: grid;
    gap: 0;
    border: 1px solid #ddd;
    border-radius: 0.4em;
    overflow: hidden;
}
.cal-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0.2em 0.1em;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
}
.cal-border-r { border-right:  1px solid #ddd; }
.cal-border-b { border-bottom: 1px solid #ddd; }
.cal-day-head {
    font-weight: 700;
    font-size: 0.82em;
    color: #6666aa;
    min-height: 1.4em;
    justify-content: center;
    padding: 0.2em 0;
    border-bottom: 1px solid #c8c8e0;
    width: 100%;
    text-align: center;
}
.cal-we.cal-day-head { color: #8855bb; }
.cal-wn-head { min-height: 1.4em; border-bottom: 1px solid #c8c8e0; }
.cal-wn {
    font-size: 0.7em;
    color: #aaa;
    justify-content: flex-start;
    padding-top: 0.3em;
    min-height: 2.2em;
}
.cal-day {
    cursor: pointer;
    transition: background .12s;
    min-height: 2.2em;
    width: 100%;
}
.cal-day:hover { background: #e8f0ff; }
.cal-day-num {
    font-size: 0.88em;
    font-weight: 600;
    color: #222244;
    line-height: 1.3;
    padding-top: 0.1em;
}
.cal-other-month .cal-day-num { color: #bbb; opacity: 0.25;}
.cal-today { background: #ddeeff !important; border: 0.1em solid #4a90e2 !important; }
.cal-today .cal-day-num { color: #1a5abf; font-weight: 800; }
.cal-we .cal-day-num { color: #8855bb; }
.cal-selected { background: #cce0ff !important; outline: 1px solid #4a90e2; }
.cal-event {
    font-size: 0.4em;
    border-radius: 0.25em;
    padding: 0.1em 0.25em;
    margin-top: 0.1em;
    width: 100%;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    line-height: 1.3;
    box-sizing: border-box;
}
.cal-grey-col { background: rgba(0,0,0,0.075); }

/* ── Jours vacances / fériés (vieux rose) ────────── */
.cal-school-day { background: #f5d5d8 !important; }
.cal-school-day:hover { background: #ebbfc4 !important; }
.cal-school-day .cal-day-num { color: #a04050 !important; }
.cal-school-day.cal-today { background: #e8aab2 !important; border-color: #c0607080 !important; }
.cal-school-day.cal-today .cal-day-num { color: #7a2535 !important; }

/* ── Barre d'événement ──────────────────────────── */
.cal-event-bar {
    display: flex;
    align-items: center;
    gap: 0.35em;
    background: #f0f0f8;
    border: 1px solid #c8c8e0;
    border-radius: 0.5em;
    padding: 0.35em 0.55em;
    margin-top: 0.4em;
    flex-wrap: wrap;
}
.cal-ev-input {
    flex: 1;
    min-width: 4em;
    background: #fff;
    border: 1px solid #aab;
    border-radius: 0.35em;
    color: #222;
    font-size: 0.85em;
    padding: 0.2em 0.45em;
    outline: none;
    font-family: inherit;
}
.cal-ev-input:focus { border-color: #4a90e2; }
.cal-ev-color {
    background: #fff;
    border: 1px solid #aab;
    border-radius: 0.35em;
    color: #444;
    font-size: 0.82em;
    padding: 0.2em 0.3em;
    cursor: pointer;
    font-family: inherit;
}
.cal-ev-save, .cal-ev-del, .cal-ev-cancel {
    background: #e8e8f5;
    border: 1px solid #c8c8e0;
    border-radius: 0.35em;
    color: #444;
    font-size: 0.95em;
    width: 1.8em; height: 1.8em;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background .12s;
}
.cal-ev-save:hover   { background: #27ae60; color: #fff; border-color: #27ae60; }
.cal-ev-del:hover    { background: #c0392b; color: #fff; border-color: #c0392b; }
.cal-ev-cancel:hover { background: #555; color: #fff; }

/* ══════════════════════════════════════════════
   MODAL DATES SCOLAIRES
══════════════════════════════════════════════ */
#cal-school-modal {
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center;
}
.csm-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
.csm-box {
    position: relative; z-index: 1;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.28);
    width: min(640px, 96vw);
    max-height: 85vh;
    display: flex; flex-direction: column;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    overflow: hidden;
}
.csm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px 12px;
    background: linear-gradient(135deg, #fce4ec, #f8bbd0);
    border-bottom: 1px solid #f0c0cc;
    flex-shrink: 0;
}
.csm-title { font-weight: 700; font-size: 1.1em; color: #8c2a3e; }
.csm-close {
    background: rgba(255,255,255,0.6); border: 1px solid #e0909a;
    border-radius: 6px; color: #a04050; width: 28px; height: 28px;
    cursor: pointer; font-size: 13px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s;
}
.csm-close:hover { background: #e0909a; color: #fff; }
.csm-body { overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 18px; }
.csm-section { display: flex; flex-direction: column; gap: 8px; }
.csm-section-title {
    font-weight: 700; font-size: 0.92em; color: #7a3045;
    padding-bottom: 4px; border-bottom: 1px solid #f0d0d8;
}
.csm-vacances-list, .csm-feries-list { display: flex; flex-direction: column; gap: 6px; }
.csm-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.csm-inp {
    border: 1px solid #ddd; border-radius: 6px;
    padding: 5px 8px; font-size: 0.88em; font-family: inherit;
    outline: none; transition: border-color .12s;
    background: #fafafa; color: #333;
}
.csm-inp:focus { border-color: #e0909a; background: #fff; }
.csm-inp-label { flex: 1; min-width: 130px; }
.csm-inp-date  { width: 140px; }
.csm-arrow { color: #aaa; font-size: 0.9em; flex-shrink: 0; }
.csm-del {
    background: none; border: 1px solid transparent;
    border-radius: 6px; color: #ccc; cursor: pointer;
    font-size: 1em; width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    transition: color .12s, background .12s, border-color .12s;
    flex-shrink: 0;
}
.csm-del:hover { color: #c0392b; background: #ffeaea; border-color: #e0a0a0; }
.csm-add-vac, .csm-add-fer {
    align-self: flex-start;
    background: #fff0f2; border: 1px dashed #e0909a;
    border-radius: 7px; color: #a04050;
    font-size: 0.82em; font-family: inherit; font-weight: 600;
    padding: 5px 12px; cursor: pointer;
    transition: background .12s;
}
.csm-add-vac:hover, .csm-add-fer:hover { background: #ffe0e5; }
.csm-footer {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 12px 18px;
    border-top: 1px solid #f0d0d8;
    background: #fdf7f8;
    flex-shrink: 0;
}
.csm-cancel {
    background: #f5f5f5; border: 1px solid #ddd;
    border-radius: 7px; color: #666; font-family: inherit;
    font-size: 0.9em; padding: 7px 18px; cursor: pointer;
    transition: background .12s;
}
.csm-cancel:hover { background: #eee; }
.csm-save {
    background: linear-gradient(135deg, #e8909a, #d06070);
    border: none; border-radius: 7px; color: #fff;
    font-family: inherit; font-size: 0.9em; font-weight: 700;
    padding: 7px 22px; cursor: pointer;
    transition: opacity .12s;
}
.csm-save:hover { opacity: .88; }
`;
    document.head.appendChild(style);
})();



// =========================================================================
// CAL EVENT STORAGE — IndexedDB (même pattern que pdfStorage dans board.js)
// DB : 'BureauDuProf_CalEvents'  |  Store : 'events'
// Clé : calId (string uuid par widget)
// API : calEventStorage.set(id, events), .get(id) → Promise, .remove(id)
// =========================================================================
const calEventStorage = (() => {
    const DB_NAME = 'BureauDuProf_CalEvents';
    const STORE   = 'events';
    let _db = null;

    function openDB() {
        if (_db) return Promise.resolve(_db);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
            req.onsuccess = e => { _db = e.target.result; resolve(_db); };
            req.onerror   = () => reject(req.error);
        });
    }

    function tx(mode) {
        return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
    }

    return {
        // Sauvegarde les événements (objet JSON) sous la clé calId
        set(calId, eventsObj) {
            return tx('readwrite').then(store => new Promise((res) => {
                const r = store.put(JSON.stringify(eventsObj), calId);
                r.onsuccess = () => res();
                r.onerror   = () => { console.warn('[calEventStorage] Erreur écriture:', r.error); res(); };
            })).catch(err => { console.warn('[calEventStorage] set échoué:', err); });
        },
        // Lit les événements → retourne un objet {} ou null
        get(calId) {
            return tx('readonly').then(store => new Promise((res) => {
                const r = store.get(calId);
                r.onsuccess = () => {
                    try { res(r.result ? JSON.parse(r.result) : null); }
                    catch(e) { res(null); }
                };
                r.onerror = () => res(null);
            })).catch(() => Promise.resolve(null));
        },
        // Supprime les événements d'un widget
        remove(calId) {
            return tx('readwrite').then(store => new Promise((res) => {
                store.delete(calId).onsuccess = () => res();
            })).catch(() => {});
        },
        // Liste tous les calIds stockés (pour purge des orphelins)
        listIds() {
            return tx('readonly').then(store => new Promise((res) => {
                const r = store.getAllKeys();
                r.onsuccess = () => res(r.result || []);
                r.onerror   = () => res([]);
            })).catch(() => []);
        },
        // Supprime les entrées dont le calId n'est plus utilisé sur le board
        async purgeOrphans() {
            const usedIds = new Set(
                [...document.querySelectorAll('.widget[data-type="calendrier"][data-cal-id]')]
                    .map(w => w.dataset.calId)
            );
            const storedIds = await this.listIds();
            let removed = 0;
            for (const id of storedIds) {
                if (!usedIds.has(id)) { await this.remove(id); removed++; }
            }
            if (removed > 0) console.log(`[calEventStorage] ${removed} entrée(s) orpheline(s) supprimée(s)`);
        }
    };
})();

// ─── Génère un ID unique pour chaque widget calendrier ────────────────────
function _calGenId() {
    return 'cal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// =========================================================================
// CONSTANTES
// =========================================================================
const CALENDRIER_JOURS  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const CALENDRIER_MOIS   = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];
const CALENDRIER_THEMES = {
    bleu:   { bg: '#4a90e2', text: '#fff' },
    vert:   { bg: '#27ae60', text: '#fff' },
    rouge:  { bg: '#e74c3c', text: '#fff' },
    orange: { bg: '#f39c12', text: '#fff' },
    violet: { bg: '#8e44ad', text: '#fff' },
    rose:   { bg: '#e84393', text: '#fff' },
};
const CAL_REF_WIDTH = 320;

// =========================================================================
// DATES SCOLAIRES PARTAGÉES (vacances + jours fériés)
// Stockées dans IndexedDB sous la clé spéciale '__schoolDates__'
// Format : { vacances: [ {label, start, end}, … ], feries: [ {label, date}, … ] }
// =========================================================================
const _calSchoolDates = (() => {
    let _data = { vacances: [], feries: [] };
    let _listeners = new Set();

    // Calcule l'ensemble des dates YYYY-MM-DD couvertes
    function _buildSet() {
        const s = new Set();

        // Construit une Date locale (sans décalage UTC) à partir de 'YYYY-MM-DD'
        function localDate(str) {
            const [y, mo, d] = str.split('-').map(Number);
            return new Date(y, mo - 1, d);
        }
        // Formate une Date locale en 'YYYY-MM-DD'
        function fmtDate(d) {
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }

        for (const v of _data.vacances) {
            if (!v.start || !v.end) continue;
            const d   = localDate(v.start);
            const end = localDate(v.end);
            while (d <= end) {
                s.add(fmtDate(d));
                d.setDate(d.getDate() + 1);
            }
        }
        for (const f of _data.feries) {
            if (f.date) s.add(f.date); // déjà YYYY-MM-DD, pas de conversion
        }
        return s;
    }

    return {
        get data()    { return _data; },
        get dateSet() { return _buildSet(); },

        load() {
            return calEventStorage.get('__schoolDates__').then(d => {
                if (d && (Array.isArray(d.vacances) || Array.isArray(d.feries))) {
                    _data = { vacances: d.vacances || [], feries: d.feries || [] };
                }
                return _data;
            }).catch(() => _data);
        },

        save(newData) {
            _data = newData;
            calEventStorage.set('__schoolDates__', _data);
            // Redessiner tous les calendriers ouverts
            document.querySelectorAll('.widget[data-type="calendrier"]').forEach(w => {
                if (w._calState) _calRender(w);
            });
        },

        subscribe(fn)   { _listeners.add(fn); },
        unsubscribe(fn) { _listeners.delete(fn); }
    };
})();

// Charge les dates au démarrage (silencieux)
_calSchoolDates.load();

// ─── Modal vacances / jours fériés ───────────────────────────────────────
function _calOpenSchoolDatesModal() {
    if (document.getElementById('cal-school-modal')) return;

    // Toujours recharger depuis IndexedDB avant d'ouvrir la modal
    // pour être sûr d'avoir les données les plus récentes
    _calSchoolDates.load().then(() => {
        const data = JSON.parse(JSON.stringify(_calSchoolDates.data)); // deep copy fraîche

        const modal = document.createElement('div');
        modal.id = 'cal-school-modal';
    modal.innerHTML = `
      <div class="csm-overlay"></div>
      <div class="csm-box">
        <div class="csm-header">
          <span class="csm-title">🌸 Vacances & Jours fériés</span>
          <button class="csm-close" title="Fermer">✕</button>
        </div>
        <div class="csm-body">
          <div class="csm-section">
            <div class="csm-section-title">🏖️ Périodes de vacances</div>
            <div class="csm-vacances-list"></div>
            <button class="csm-add-vac">+ Ajouter une période</button>
          </div>
          <div class="csm-section">
            <div class="csm-section-title">🎉 Jours fériés</div>
            <div class="csm-feries-list"></div>
            <button class="csm-add-fer">+ Ajouter un jour férié</button>
          </div>
        </div>
        <div class="csm-footer">
          <button class="csm-cancel">Annuler</button>
          <button class="csm-save">✓ Enregistrer</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    function renderVac() {
        const list = modal.querySelector('.csm-vacances-list');
        list.innerHTML = '';
        data.vacances.forEach((v, i) => {
            const row = document.createElement('div');
            row.className = 'csm-row';
            row.innerHTML = `
              <input class="csm-inp csm-inp-label" type="text" placeholder="Nom (ex: Toussaint)" value="${v.label||''}">
              <input class="csm-inp csm-inp-date" type="date" value="${v.start||''}">
              <span class="csm-arrow">→</span>
              <input class="csm-inp csm-inp-date" type="date" value="${v.end||''}">
              <button class="csm-del" data-i="${i}" title="Supprimer">🗑</button>`;
            row.querySelector('.csm-inp-label').addEventListener('input', e => { data.vacances[i].label = e.target.value; });
            row.querySelectorAll('.csm-inp-date')[0].addEventListener('change', e => { data.vacances[i].start = e.target.value; });
            row.querySelectorAll('.csm-inp-date')[1].addEventListener('change', e => { data.vacances[i].end   = e.target.value; });
            row.querySelector('.csm-del').addEventListener('click', () => { data.vacances.splice(i, 1); renderVac(); });
            list.appendChild(row);
        });
    }

    function renderFer() {
        const list = modal.querySelector('.csm-feries-list');
        list.innerHTML = '';
        data.feries.forEach((f, i) => {
            const row = document.createElement('div');
            row.className = 'csm-row';
            row.innerHTML = `
              <input class="csm-inp csm-inp-label" type="text" placeholder="Nom (ex: 1er mai)" value="${f.label||''}">
              <input class="csm-inp csm-inp-date" type="date" value="${f.date||''}">
              <button class="csm-del" data-i="${i}" title="Supprimer">🗑</button>`;
            row.querySelector('.csm-inp-label').addEventListener('input', e => { data.feries[i].label = e.target.value; });
            row.querySelector('.csm-inp-date').addEventListener('change', e => { data.feries[i].date = e.target.value; });
            row.querySelector('.csm-del').addEventListener('click', () => { data.feries.splice(i, 1); renderFer(); });
            list.appendChild(row);
        });
    }

    renderVac();
    renderFer();

    modal.querySelector('.csm-add-vac').addEventListener('click', () => {
        data.vacances.push({ label: '', start: '', end: '' });
        renderVac();
    });
    modal.querySelector('.csm-add-fer').addEventListener('click', () => {
        data.feries.push({ label: '', date: '' });
        renderFer();
    });

    const close = () => { modal.remove(); };
    modal.querySelector('.csm-close').addEventListener('click', close);
    modal.querySelector('.csm-cancel').addEventListener('click', close);
    modal.querySelector('.csm-overlay').addEventListener('click', close);

    modal.querySelector('.csm-save').addEventListener('click', () => {
        // Nettoyer les entrées vides
        data.vacances = data.vacances.filter(v => v.label || v.start || v.end);
        data.feries   = data.feries.filter(f => f.label || f.date);
        _calSchoolDates.save(data);
        close();
    });

    // Bloquer le drag depuis la modal
    modal.addEventListener('mousedown', e => e.stopPropagation());
    }); // fin _calSchoolDates.load().then(...)
}

// =========================================================================
// CRÉATION DU WIDGET
// =========================================================================
function createCalendrierWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type  = 'calendrier';
    widget.dataset.calId = _calGenId();   // identifiant unique pour IndexedDB
    widget.tabIndex = 0;

    const p = findFreePosition(720, 800);
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left   = '100px';
    widget.style.top    = p.y + 'px';
    widget.style.width  = '720px';
    // Pas de height fixe : le système de resize pilote l'editor-container,
    // et widget-content (flex-grow:1) s'adapte automatiquement.

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget, .shape-widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget, .shape-widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();if(w.dataset.calId)calEventStorage.remove(w.dataset.calId);w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
        <div class="widget-content">
            <div class="cal-container editor-container"></div>
        </div>`;

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    widget.addEventListener('mousedown', (e) => {
        if (typeof isDrawMode !== 'undefined' && isDrawMode) return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true') bringToFront(widget);
    });

    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        calEventStorage.remove(widget.dataset.calId);
        widget.remove();
        saveBoard();
    });

    const now = new Date();
    widget._calState = {
        year:          now.getFullYear(),
        month:         now.getMonth(),
        events:        {},
        showWeekends:  true,
        showWeekNums:  false,
        yearPanelOpen: true,
    };

    _calRender(widget);

    // Hauteur initiale sur l'editor-container (c'est lui que makeResizableByHandle pilote,
    // pas le widget lui-même en hauteur)
    const conInit = widget.querySelector('.cal-container');
    if (conInit) conInit.style.height = '780px';

    // ResizeObserver : font-size proportionnel + barre action compacte
    if (typeof ResizeObserver !== 'undefined') {
        const con = widget.querySelector('.cal-container');
        if (con) {
            const ro = new ResizeObserver(() => {
                _calScaleFont(con);
                if (typeof _updateActionBarCompact === 'function') _updateActionBarCompact(widget);
            });
            ro.observe(con);
        }
    }

    if (!isInitialLoading && !isRestoringState) saveBoard();

    if (typeof _updateActionBarCompact === 'function') {
        requestAnimationFrame(() => _updateActionBarCompact(widget));
        setTimeout(() => _updateActionBarCompact(widget), 200);
    }

    return widget;
}

// ─── Font-size proportionnel à la largeur ────────────────────────────────
function _calScaleFont(con) {
    const w = con.offsetWidth;
    if (!w) return;
    const basePx = Math.max(9, Math.round(13 * w / CAL_REF_WIDTH));
    con.style.fontSize = basePx + 'px';
}

// =========================================================================
// RENDU COMPLET
// =========================================================================
function _calRender(widget) {
    const s   = widget._calState;
    const con = widget.querySelector('.cal-container');
    if (!con) return;

    const { year, month, events, showWeekends, showWeekNums } = s;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Toujours en mode clair
    con.classList.add('cal-light');

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay();
    startDow = (startDow === 0) ? 6 : startDow - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const cols      = showWeekends ? 7 : 5;
    const colLabels = showWeekends ? CALENDRIER_JOURS : CALENDRIER_JOURS.slice(0, 5);

    // Colonnes grisées : Mer=2, Sam=5, Dim=6  (lundi=0)
    const GREY_COLS = new Set(showWeekends ? [2, 5, 6] : [2]);

    // Vue annuelle : toujours l'année scolaire EN COURS (basée sur aujourd'hui)
    // sept→déc : schoolYear = today.year ; jan→août : schoolYear = today.year - 1
    const schoolYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    const yearViewMois   = [8,9,10,11,0,1,2,3,4,5,6,7]; // indices JS
    const schoolSet      = _calSchoolDates.dateSet;

    // Génère le HTML d'un mini-calendrier pour un mois donné
    function _miniCal(m, yr) {
        const isActive  = (m === month && yr === year);
        const isToday   = (m === today.getMonth() && yr === today.getFullYear());
        let wrapCls = 'cal-ym-card';
        if (isActive) wrapCls += ' cal-ym-active';
        if (isToday)  wrapCls += ' cal-ym-today';

        const dim = new Date(yr, m + 1, 0).getDate();
        let dow = new Date(yr, m, 1).getDay();
        dow = dow === 0 ? 6 : dow - 1; // lundi=0

        const JOURS_MINI = ['L','M','M','J','V','S','D'];
        let grid = '<div class="cym-row cym-head">';
        JOURS_MINI.forEach(j => { grid += `<span>${j}</span>`; });
        grid += '</div><div class="cym-row">';

        // cases vides avant le 1er
        for (let b = 0; b < dow; b++) grid += '<span class="cym-empty"></span>';

        let col = dow;
        for (let d = 1; d <= dim; d++) {
            const key = `${yr}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isSchool   = schoolSet.has(key);
            const isTodayDay = (isToday && d === today.getDate());
            let cls = '';
            if (isSchool)   cls += ' cym-school';
            if (isTodayDay) cls += ' cym-curday';
            grid += `<span class="${cls.trim()}">${d}</span>`;
            col++;
            if (col % 7 === 0 && d < dim) grid += '</div><div class="cym-row">';
        }
        grid += '</div>';

        const mLabel = CALENDRIER_MOIS[m].slice(0, 4);
        return `<div class="${wrapCls}" data-ym-month="${m}" data-ym-year="${yr}">
            <div class="cym-title">${mLabel} <span class="cym-yr">${yr}</span></div>
            <div class="cym-grid">${grid}</div>
        </div>`;
    }

    let html = `
    <div class="cal-header">
        <button class="cal-nav cal-prev" title="Mois précédent">‹</button>
        <span class="cal-title">${CALENDRIER_MOIS[month]} ${year}</span>
        <button class="cal-nav cal-next" title="Mois suivant">›</button>
        <button class="cal-today-btn" title="Aujourd'hui">Auj.</button>
        <button class="cal-year-btn" title="Vue annuelle (sept→août)">📅</button>
        <button class="cal-opts-btn" title="Options">⚙</button>
    </div>
    <div class="cal-year-panel" style="display:${s.yearPanelOpen ? 'block' : 'none'};">
        <div class="cal-year-grid">
            ${yearViewMois.map(m => {
                const yr = (m >= 8) ? schoolYear : schoolYear + 1;
                return _miniCal(m, yr);
            }).join('')}
        </div>
    </div>
    <div class="cal-opts-panel" style="display:none;">
        <label class="cal-opt-check"><input type="checkbox" class="cal-cb-we" ${showWeekends?'checked':''}> Week-ends</label>
        <label class="cal-opt-check"><input type="checkbox" class="cal-cb-wn" ${showWeekNums?'checked':''}> N° semaine</label>
        <div class="cal-opts-sep"></div>
        <button class="cal-school-btn" title="Gérer les vacances et jours fériés">🌸 Vacances</button>
        <div class="cal-opts-sep"></div>
        <button class="cal-idb-status" title="État de la sauvegarde IndexedDB">💾 …</button>
        <button class="cal-export-btn" title="Exporter les événements en JSON">⬇ JSON</button>
        <label class="cal-import-lbl" title="Importer des événements depuis un fichier JSON">⬆ JSON<input type="file" class="cal-import-input" accept=".json" style="display:none;"></label>
    </div>
    <div class="cal-grid" style="grid-template-columns:${showWeekNums ? '2em ' : ''}repeat(${cols}, 1fr);">`;

    // En-têtes jours
    if (showWeekNums) html += `<div class="cal-cell cal-wn-head"></div>`;
    colLabels.forEach((j, i) => {
        const isWE   = showWeekends && (i === 5 || i === 6);
        const isGrey = GREY_COLS.has(i);
        let cls = 'cal-cell cal-day-head';
        if (isWE)   cls += ' cal-we';
        if (isGrey) cls += ' cal-grey-col';
        html += `<div class="${cls}">${j}</div>`;
    });

    // Cellules
    let cellDay = 1 - startDow;
    const totalCells = Math.ceil((startDow + daysInMonth) / cols) * cols;
    const totalRows  = totalCells / cols;
    // schoolSet est déjà déclaré plus haut (utilisé aussi par _miniCal)

    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const isLastRow = row === totalRows - 1;
        const isLastCol = col === cols - 1;

        if (showWeekNums && col === 0) {
            const d = cellDay > 0 && cellDay <= daysInMonth
                ? new Date(year, month, cellDay)
                : cellDay <= 0
                    ? new Date(year, month - 1, daysInPrev + cellDay)
                    : new Date(year, month + 1, cellDay - daysInMonth);
            const wnCls = 'cal-cell cal-wn' + (isLastRow ? '' : ' cal-border-b');
            html += `<div class="${wnCls}">${_getWeekNumber(d)}</div>`;
        }

        const isWE   = showWeekends && (col === 5 || col === 6);
        const isGrey = GREY_COLS.has(col);
        let cls = 'cal-cell cal-day';
        if (!isLastRow) cls += ' cal-border-b';
        if (!isLastCol) cls += ' cal-border-r';
        if (isGrey)     cls += ' cal-grey-col';

        let labelNum = '';
        let evtHtml  = '';

        if (cellDay < 1) {
            cls += ' cal-other-month';
            labelNum = daysInPrev + cellDay;
        } else if (cellDay > daysInMonth) {
            cls += ' cal-other-month';
            labelNum = cellDay - daysInMonth;
        } else {
            if (isCurrentMonth && cellDay === today.getDate()) cls += ' cal-today';
            if (isWE) cls += ' cal-we';
            const key = `${year}-${String(month+1).padStart(2,'0')}-${String(cellDay).padStart(2,'0')}`;
            if (schoolSet.has(key)) cls += ' cal-school-day';
            if (events[key]) {
                const ev = events[key];
                const th = CALENDRIER_THEMES[ev.color] || CALENDRIER_THEMES.bleu;
                evtHtml = `<div class="cal-event" style="background:${th.bg};color:${th.text};" title="${ev.label}">${ev.label}</div>`;
            }
            labelNum = cellDay;
        }

        const dataAttr = (cellDay >= 1 && cellDay <= daysInMonth)
            ? `data-day="${cellDay}" data-month="${month}" data-year="${year}"`
            : '';

        html += `<div class="${cls}" ${dataAttr}><span class="cal-day-num">${labelNum}</span>${evtHtml}</div>`;
        cellDay++;
    }

    html += `</div>
    <div class="cal-event-bar" style="display:none;">
        <input class="cal-ev-input" type="text" placeholder="Étiquette…" maxlength="30">
        <select class="cal-ev-color">
            ${Object.keys(CALENDRIER_THEMES).map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
        <button class="cal-ev-save">✓</button>
        <button class="cal-ev-del">🗑</button>
        <button class="cal-ev-cancel">✕</button>
    </div>`;

    con.innerHTML = html;
    _calScaleFont(con);
    _calBindEvents(widget);
    _calUpdateIdbStatus(widget);
}

// =========================================================================
// SAUVEGARDE IndexedDB + helpers
// =========================================================================

// Sauvegarde les événements dans IndexedDB et met à jour l'indicateur
function _calSaveEvents(widget) {
    const calId = widget.dataset.calId;
    if (!calId) return;
    const events = widget._calState?.events || {};
    calEventStorage.set(calId, events)
        .then(() => _calUpdateIdbStatus(widget))
        .catch(() => _calUpdateIdbStatus(widget, true));
}

// Met à jour le badge "💾" dans le panneau options
function _calUpdateIdbStatus(widget, error = false) {
    const btn = widget.querySelector('.cal-idb-status');
    if (!btn) return;
    const count = Object.keys(widget._calState?.events || {}).length;
    if (error) {
        btn.textContent = '💾 ❌';
        btn.title = 'Erreur de sauvegarde IndexedDB';
    } else {
        btn.textContent = count > 0 ? `💾 ${count} évent.` : '💾 Vide';
        btn.title = `${count} événement(s) sauvegardé(s) dans IndexedDB`;
    }
}

// =========================================================================
// EXPORT / IMPORT JSON
// =========================================================================

function _calExportJSON(widget) {
    const s     = widget._calState;
    const calId = widget.dataset.calId || 'calendrier';
    const events = s.events || {};
    const count  = Object.keys(events).length;

    // Recharger depuis IndexedDB avant export pour garantir que les données sont fraîches
    _calSchoolDates.load().then(schoolDates => {
        const payload = {
            _source:      'Le Bureau du Prof — Widget Calendrier',
            _calId:       calId,
            _exportedAt:  new Date().toISOString(),
            _eventCount:  count,
            events,
            schoolDates   // vacances + fériés, fraîchement lus depuis IndexedDB
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `calendrier-events-${calId.slice(-8)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
}

function _calImportJSON(widget, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Restaurer les dates scolaires si présentes dans le fichier
            if (data.schoolDates && (Array.isArray(data.schoolDates.vacances) || Array.isArray(data.schoolDates.feries))) {
                const sd = {
                    vacances: data.schoolDates.vacances || [],
                    feries:   data.schoolDates.feries   || []
                };
                _calSchoolDates.save(sd);
            }

            // Extraire les événements (ignorer les clés méta commençant par _)
            const events = data.events || (() => {
                const obj = {};
                for (const [k, v] of Object.entries(data)) {
                    if (!k.startsWith('_') && k !== 'schoolDates') obj[k] = v;
                }
                return obj;
            })();

            // Valider : toutes les clés doivent être YYYY-MM-DD → { label, color }
            let valid = typeof events === 'object' && events !== null;
            if (valid) {
                for (const [k, v] of Object.entries(events)) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || typeof v.label !== 'string') {
                        valid = false; break;
                    }
                }
            }
            if (!valid) { alert('Fichier JSON invalide — format attendu : { "YYYY-MM-DD": { "label": "...", "color": "..." } }'); return; }

            if (typeof snapshotNow === 'function') snapshotNow();
            widget._calState.events = events;
            calEventStorage.set(widget.dataset.calId, events);
            _calRender(widget);
            if (typeof saveBoard === 'function') saveBoard();
        } catch(err) {
            alert('Impossible de lire le fichier JSON : ' + err.message);
        }
    };
    reader.readAsText(file);
}

// =========================================================================
// LIAISON DES ÉVÉNEMENTS
// =========================================================================
function _calBindEvents(widget) {
    const s   = widget._calState;
    const con = widget.querySelector('.cal-container');

    // ── Navigation ──
    con.querySelector('.cal-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        s.month--; if (s.month < 0) { s.month = 11; s.year--; }
        _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-next').addEventListener('click', (e) => {
        e.stopPropagation();
        s.month++; if (s.month > 11) { s.month = 0; s.year++; }
        _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-today-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const now = new Date(); s.year = now.getFullYear(); s.month = now.getMonth();
        _calRender(widget); saveBoard();
    });

    // ── Vue annuelle ──
    const yearBtn   = con.querySelector('.cal-year-btn');
    const yearPanel = con.querySelector('.cal-year-panel');
    yearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = yearPanel.style.display === 'none';
        yearPanel.style.display = open ? 'block' : 'none';
        s.yearPanelOpen = open;
        saveBoard();
    });
    con.querySelectorAll('.cal-ym-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            s.month = parseInt(card.dataset.ymMonth);
            s.year  = parseInt(card.dataset.ymYear);
            s.yearPanelOpen = true;
            _calRender(widget); saveBoard();
        });
    });

    // ── Options ──
    const optsBtn   = con.querySelector('.cal-opts-btn');
    const optsPanel = con.querySelector('.cal-opts-panel');
    optsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        optsPanel.style.display = optsPanel.style.display === 'none' ? 'flex' : 'none';
    });
    con.querySelector('.cal-cb-we').addEventListener('change', function(e) {
        e.stopPropagation(); s.showWeekends = this.checked; _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-cb-wn').addEventListener('change', function(e) {
        e.stopPropagation(); s.showWeekNums = this.checked; _calRender(widget); saveBoard();
    });

    // ── Bouton vacances / fériés ──
    con.querySelector('.cal-school-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        _calOpenSchoolDatesModal();
    });

    // ── Export JSON ──
    con.querySelector('.cal-export-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        _calExportJSON(widget);
    });

    // ── Import JSON ──
    const importInput = con.querySelector('.cal-import-input');
    importInput.addEventListener('change', (e) => {
        e.stopPropagation();
        _calImportJSON(widget, importInput.files[0]);
        importInput.value = '';
    });

    // ── Badge IDB (clic = forcer re-sauvegarde) ──
    con.querySelector('.cal-idb-status').addEventListener('click', (e) => {
        e.stopPropagation();
        _calSaveEvents(widget);
    });

    // ── Clic sur un jour ──
    con.querySelectorAll('.cal-day[data-day]').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = `${cell.dataset.year}-${String(parseInt(cell.dataset.month)+1).padStart(2,'0')}-${String(cell.dataset.day).padStart(2,'0')}`;
            const ev  = s.events[key] || { label: '', color: 'bleu' };
            const bar = con.querySelector('.cal-event-bar');
            con.querySelectorAll('.cal-day.cal-selected').forEach(c => c.classList.remove('cal-selected'));
            cell.classList.add('cal-selected');
            bar.querySelector('.cal-ev-input').value = ev.label;
            bar.querySelector('.cal-ev-color').value = ev.color || 'bleu';
            bar.dataset.key = key;
            bar.style.display = 'flex';
            bar.querySelector('.cal-ev-input').focus();
        });
    });

    // ── Barre événement ──
    const bar = con.querySelector('.cal-event-bar');

    bar.querySelector('.cal-ev-save').addEventListener('click', (e) => {
        e.stopPropagation();
        const label = bar.querySelector('.cal-ev-input').value.trim();
        const color = bar.querySelector('.cal-ev-color').value;
        if (label) s.events[bar.dataset.key] = { label, color };
        else delete s.events[bar.dataset.key];
        _calSaveEvents(widget);   // → IndexedDB
        _calRender(widget);
        saveBoard();              // → localStorage
    });
    bar.querySelector('.cal-ev-del').addEventListener('click', (e) => {
        e.stopPropagation();
        delete s.events[bar.dataset.key];
        _calSaveEvents(widget);
        _calRender(widget);
        saveBoard();
    });
    bar.querySelector('.cal-ev-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        bar.style.display = 'none';
        con.querySelectorAll('.cal-day.cal-selected').forEach(c => c.classList.remove('cal-selected'));
    });
    bar.querySelector('.cal-ev-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  bar.querySelector('.cal-ev-save').click();
        if (e.key === 'Escape') bar.querySelector('.cal-ev-cancel').click();
        e.stopPropagation();
    });

    // Bloquer drag sur tous les contrôles
    con.querySelectorAll('button, input, select, label').forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
    });
}

// =========================================================================
// UTILITAIRES
// =========================================================================
function _getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// =========================================================================
// SÉRIALISATION (save-load board)
// =========================================================================
function _calGetSaveData(widget) {
    return widget._calState ? JSON.stringify(widget._calState) : null;
}

// Restauration depuis le JSON du board — charge aussi les événements depuis IndexedDB
// et les dates scolaires (vacances/fériés) depuis IndexedDB avant de rendre
function _calRestoreData(widget, json) {
    try {
        widget._calState = JSON.parse(json);
        if (widget._calState.yearPanelOpen === undefined) widget._calState.yearPanelOpen = true;
    } catch(e) {
        const now = new Date();
        widget._calState = { year: now.getFullYear(), month: now.getMonth(), events: {}, showWeekends: true, showWeekNums: false, yearPanelOpen: true };
    }

    const calId = widget.dataset.calId;

    // Charger en parallèle : events du widget + dates scolaires partagées
    const pEvents      = calId
        ? calEventStorage.get(calId).catch(() => null)
        : Promise.resolve(null);
    const pSchoolDates = _calSchoolDates.load().catch(() => null);

    Promise.all([pEvents, pSchoolDates]).then(([idbEvents]) => {
        if (idbEvents && Object.keys(idbEvents).length > 0) {
            // IndexedDB prime pour les événements
            widget._calState.events = idbEvents;
        }
        // _calSchoolDates._data est maintenant à jour (chargé par pSchoolDates)
        _calRender(widget);
    });
}
