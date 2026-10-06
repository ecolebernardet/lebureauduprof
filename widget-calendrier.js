// =========================================================================
// WIDGET CALENDRIER — Le Bureau du Prof
//
// Mise en page adaptative (calculée par _calLayout) :
//   - l'année scolaire (12 mini-mois) se place soit EN HAUT, soit SUR LE CÔTÉ,
//     selon ce qui laisse le plus de place au mois affiché ;
//   - en haut, le nombre de mois par ligne augmente avec la largeur (3, 4, 6, 12) ;
//   - la taille du texte de la grille est calculée pour que TOUT tienne
//     dans le widget (et dans l'écran en plein écran), sans défilement.
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
══════════════════════════════════════════════════ */
.cal-container {
    --cal-accent: #3b6fd8;
    --cal-accent-soft: #e8effc;
    --cal-ink: #1f2340;
    --cal-soft: #7a7f9a;
    --cal-line: #e3e5ef;
    --cal-panel: #f6f7fb;
    --cal-grey: #f2f3f8;
    --cal-we: #8a5cc7;
    --cal-school: #f9dde1;
    --cal-school-ink: #a23a52;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    color: var(--cal-ink);
    background: #ffffff;
    border-radius: 12px;
    padding: 0.7em 0.8em 0.8em;
    box-sizing: border-box;
    overflow: hidden;
    user-select: none;
    display: flex;
    flex-direction: column;
    gap: 0.55em;
    position: relative;
    min-width: 260px;
    min-height: 220px;
}

/* ── En-tête ─────────────────────────────────────── */
.cal-header {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.5em;
    min-width: 0;
}
.cal-title {
    flex: 1;
    min-width: 0;
    font-size: 1.45em;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.cal-title-year { font-weight: 400; color: var(--cal-soft); margin-left: 0.2em; }
.cal-navgroup {
    flex: none;
    display: flex;
    align-items: center;
    background: var(--cal-panel);
    border: 1px solid var(--cal-line);
    border-radius: 999px;
    padding: 0.15em;
}
.cal-nav {
    border: 0;
    background: none;
    color: var(--cal-ink);
    width: 1.9em; height: 1.9em;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.05em;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 0;
}
.cal-nav:hover, .cal-today-btn:hover { background: #fff; box-shadow: 0 1px 3px rgba(20,24,60,.15); }
.cal-today-btn {
    border: 0;
    background: none;
    color: var(--cal-accent);
    font-family: inherit;
    font-weight: 800;
    font-size: 0.85em;
    padding: 0.4em 0.8em;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
}
.cal-tool {
    flex: none;
    border: 1px solid var(--cal-line);
    background: var(--cal-panel);
    color: var(--cal-soft);
    width: 2.1em; height: 2.1em;
    border-radius: 0.6em;
    cursor: pointer;
    font-size: 0.95em;
    display: flex; align-items: center; justify-content: center;
    padding: 0;
    transition: background .12s, border-color .12s;
}
.cal-tool:hover { border-color: #c4c9de; color: var(--cal-ink); }
.cal-tool.is-on { background: var(--cal-accent-soft); border-color: var(--cal-accent); color: var(--cal-accent); }
.cal-header .wf-btns { margin-left: 0.35em; }

/* ── Menu Options (déroulant, ne prend pas de place) ── */
.cal-opts-panel {
    position: absolute;
    top: 3.3em;
    right: 0.8em;
    z-index: 5;
    display: none;
    flex-direction: column;
    gap: 0.45em;
    min-width: 14em;
    background: #fff;
    border: 1px solid var(--cal-line);
    border-radius: 0.8em;
    padding: 0.8em 0.9em 0.9em;
    box-shadow: 0 10px 30px rgba(20,24,60,.18);
}
.cal-opts-panel.is-open { display: flex; }
.cal-opts-title {
    font-size: 0.7em;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--cal-soft);
    margin-top: 0.35em;
}
.cal-opts-title:first-child { margin-top: 0; }
.cal-opt-check { display: flex; align-items: center; gap: 0.45em; font-size: 0.9em; cursor: pointer; }
.cal-opt-check input { accent-color: var(--cal-accent); cursor: pointer; width: 1em; height: 1em; margin: 0; }
.cal-opts-row { display: flex; flex-wrap: wrap; gap: 0.35em; }
.cal-opt-btn {
    border: 1px solid var(--cal-line);
    background: var(--cal-panel);
    color: var(--cal-ink);
    font-family: inherit;
    font-size: 0.8em;
    font-weight: 700;
    padding: 0.35em 0.7em;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex; align-items: center;
    transition: background .12s, border-color .12s;
}
.cal-opt-btn:hover { background: var(--cal-accent-soft); border-color: var(--cal-accent); }
.cal-school-btn { background: var(--cal-school); border-color: #efbcc5; color: var(--cal-school-ink); }
.cal-school-btn:hover { background: #f3c6ce; border-color: var(--cal-school-ink); }

/* ── Corps : année scolaire + mois ───────────────── */
.cal-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    gap: 0.7em;
}
.cal-body.cal-mode-top  { flex-direction: column; }
.cal-body.cal-mode-side { flex-direction: row; }
.cal-body.cal-year-hidden .cal-year-panel { display: none; }

.cal-year-panel {
    flex: none;
    display: grid;
    grid-template-columns: repeat(var(--ym-cols, 6), minmax(0, 1fr));
    gap: var(--ym-gap, 6px);
    align-content: start;
}
.cal-main {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

/* ── Mini-mois (tailles en cqi : tout suit la largeur de la carte) ── */
.cal-ym-card {
    container-type: inline-size;
    aspect-ratio: 10 / 11;
    box-sizing: border-box;
    padding: 4% 4% 3%;
    background: #fff;
    border: 1px solid var(--cal-line);
    border-radius: 8px;
    cursor: pointer;
    display: grid;
    grid-template-rows: 1.5fr repeat(7, 1fr);
    overflow: hidden;
    transition: border-color .12s, box-shadow .12s;
}
.cal-ym-card:hover { border-color: var(--cal-accent); }
.cal-ym-card.cal-ym-active { border-color: var(--cal-accent); box-shadow: 0 0 0 2px var(--cal-accent-soft); }
.cym-title {
    font-size: 11cqi;
    font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    gap: 0.3em;
    white-space: nowrap;
    overflow: hidden;
    line-height: 1;
}
.cal-ym-today .cym-title { color: var(--cal-accent); }
.cym-yr { font-weight: 400; color: var(--cal-soft); }
.cym-row { display: grid; grid-template-columns: repeat(7, 1fr); min-height: 0; }
.cym-row span {
    font-size: 8cqi;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
    min-height: 0;
}
.cym-head span { font-size: 6.5cqi; font-weight: 800; color: var(--cal-soft); }
.cym-we { color: var(--cal-we); }
.cym-row span.cym-school { background: var(--cal-school); color: var(--cal-school-ink); }
.cym-row span.cym-curday { background: var(--cal-accent); color: #fff; font-weight: 800; border-radius: 999px; }

/* ── Grille du mois ─────────────────────────────── */
.cal-grid {
    flex: 1 1 auto;
    min-height: 0;
    display: grid;
    grid-template-rows: auto;
    grid-auto-rows: minmax(auto, 1fr);
    border: 1px solid var(--cal-line);
    border-radius: 0.6em;
    overflow: hidden;
    background: #fff;
}
.cal-cell {
    display: flex;
    flex-direction: column;
    min-width: 0;
    box-sizing: border-box;
    overflow: clip;            /* (pas "hidden" : la hauteur mini du contenu reste prise en compte) */
    position: relative;
}
.cal-border-r { border-right:  1px solid var(--cal-line); }
.cal-border-b { border-bottom: 1px solid var(--cal-line); }
.cal-day-head {
    font-size: 0.62em;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--cal-soft);
    padding: 0.55em 0;
    align-items: center;
    justify-content: center;
    background: var(--cal-panel);
    border-bottom: 1px solid var(--cal-line);
}
.cal-we.cal-day-head { color: var(--cal-we); }
.cal-wn-head { background: var(--cal-panel); border-bottom: 1px solid var(--cal-line); }
.cal-wn {
    font-size: 0.55em;
    font-weight: 700;
    color: #a9adc2;
    align-items: center;
    padding-top: 0.6em;
    background: var(--cal-panel);
}
.cal-day {
    cursor: pointer;
    padding: 0.25em 0.3em;
    transition: background .12s;
}
.cal-grey-col { background: var(--cal-grey); }
.cal-day:hover { background: #eaf0ff; }
.cal-day-num {
    align-self: flex-start;
    font-size: 1em;
    font-weight: 700;
    line-height: 1;
    padding: 0.2em 0.3em;
    border-radius: 999px;
    min-width: 1em;
    text-align: center;
}
.cal-we .cal-day-num { color: var(--cal-we); }
.cal-other-month .cal-day-num { color: #cdd0dc; font-weight: 600; }
.cal-school-day { background: var(--cal-school); }
.cal-school-day:hover { background: #f3c6ce; }
.cal-school-day .cal-day-num { color: var(--cal-school-ink); }
.cal-today { box-shadow: inset 0 0 0 2px var(--cal-accent); }
.cal-today .cal-day-num { background: var(--cal-accent); color: #fff; }
.cal-school-day.cal-today .cal-day-num { background: var(--cal-school-ink); color: #fff; }
.cal-selected { box-shadow: inset 0 0 0 2px #f0a500 !important; }
.cal-event {
    margin-top: 0.25em;
    font-size: 0.5em;
    font-weight: 700;
    line-height: 1.2;
    padding: 0.3em 0.5em;
    border-radius: 0.45em;
    overflow: hidden;
    overflow-wrap: anywhere;
    display: -webkit-box;           /* 2 lignes maximum, puis « … » */
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* ── Barre d'édition d'un événement ──────────────── */
.cal-event-bar {
    flex: none;
    display: none;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45em;
    background: var(--cal-panel);
    border: 1px solid var(--cal-line);
    border-radius: 0.7em;
    padding: 0.4em 0.5em;
}
.cal-event-bar.is-open { display: flex; }
.cal-ev-date { font-weight: 800; font-size: 0.85em; color: var(--cal-accent); white-space: nowrap; }
.cal-ev-input {
    flex: 1;
    min-width: 6em;
    background: #fff;
    border: 1px solid #cfd3e3;
    border-radius: 0.45em;
    color: var(--cal-ink);
    font-family: inherit;
    font-size: 0.9em;
    padding: 0.3em 0.5em;
    outline: none;
    user-select: text;
}
.cal-ev-input:focus { border-color: var(--cal-accent); }
.cal-ev-colors { display: flex; gap: 0.3em; }
.cal-ev-sw {
    width: 1.3em; height: 1.3em;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #cfd3e3;
    cursor: pointer;
    padding: 0;
}
.cal-ev-sw.is-sel { box-shadow: 0 0 0 2px var(--cal-ink); }
.cal-ev-btn {
    border: 1px solid #cfd3e3;
    background: #fff;
    color: var(--cal-ink);
    width: 1.9em; height: 1.9em;
    border-radius: 0.45em;
    font-size: 0.9em;
    cursor: pointer;
    padding: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s, color .12s;
}
.cal-ev-save:hover   { background: #27ae60; border-color: #27ae60; color: #fff; }
.cal-ev-del:hover    { background: #c0392b; border-color: #c0392b; color: #fff; }
.cal-ev-cancel:hover { background: #555;    border-color: #555;    color: #fff; }

/* ── Plein écran board ───────────────────────────── */
.cal-container.cal-fullboard {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 9999 !important;
    border-radius: 0 !important;
    min-width: 0 !important;
    min-height: 0 !important;
    padding: 1em 1.4em 1.2em;
}
.widget.cal-is-full > .drag-handle,
.widget.cal-is-full > .widget-rotate-handle,
.widget.cal-is-full > .widget-action-bar,
.widget.cal-is-full > .widget-ctx-menu,
.widget.cal-is-full > .custom-resize-handle { display: none !important; }

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

    // CSS partagé des boutons fenêtre (identique à l'éphéméride / défi calme).
    // Injecté seulement s'il n'existe pas déjà.
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

    const p = findFreePosition(900, 640);
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left   = '100px';
    widget.style.top    = p.y + 'px';
    widget.style.width  = '900px';
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

    const con = widget.querySelector('.cal-container');

    // Fermer le menu Options quand on clique ailleurs dans le calendrier
    // (écouteur posé une seule fois : le conteneur survit aux re-rendus)
    con.addEventListener('pointerdown', (e) => {
        const panel = con.querySelector('.cal-opts-panel');
        if (!panel || !panel.classList.contains('is-open')) return;
        if (panel.contains(e.target) || e.target.closest('.cal-opts-btn')) return;
        panel.classList.remove('is-open');
        widget._calOptsOpen = false;
        const b = con.querySelector('.cal-opts-btn');
        if (b) b.classList.remove('is-on');
    });

    _calRender(widget);

    // Hauteur initiale sur l'editor-container (c'est lui que makeResizableByHandle pilote,
    // pas le widget lui-même en hauteur)
    con.style.height = '640px';

    // ResizeObserver : mise en page + barre action compacte
    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
            _calLayout(con);
            if (typeof _updateActionBarCompact === 'function') _updateActionBarCompact(widget);
        });
        ro.observe(con);
    }

    if (!isInitialLoading && !isRestoringState) saveBoard();

    if (typeof _updateActionBarCompact === 'function') {
        requestAnimationFrame(() => _updateActionBarCompact(widget));
        setTimeout(() => _updateActionBarCompact(widget), 200);
    }

    return widget;
}

// =========================================================================
// MISE EN PAGE ADAPTATIVE
// =========================================================================
const CAL_YM_RATIO = 1.1;   // hauteur / largeur d'un mini-mois (aspect-ratio 10/11)
const CAL_YM_GAP   = 6;     // espace entre les mini-mois (px)
const CAL_YM_MIN   = 95;    // largeur mini d'un mini-mois lisible (px)
const CAL_YM_MAX   = 240;   // au-delà, les mini-mois prennent trop de place (px)

// Choisit la disposition de l'année scolaire qui laisse les plus grandes
// cases au mois affiché :
//   'top'  : mini-mois en haut, sur 1 à 4 lignes (12, 6, 4 ou 3 par ligne)
//   'side' : mini-mois sur le côté gauche, en 1, 2 ou 3 colonnes
function _calChooseYearLayout(W, H, gap, barH, minCw) {
    let best = null;
    const consider = (mode, cols) => {
        const rows = 12 / cols;
        let cw, panelW, mainW, mainH;
        if (mode === 'top') {
            cw = (W - (cols - 1) * CAL_YM_GAP) / cols;
            if (cw > CAL_YM_MAX) return;
            const panelH = rows * cw * CAL_YM_RATIO + (rows - 1) * CAL_YM_GAP;
            panelW = W;
            mainW  = W;
            mainH  = H - panelH - gap - barH;
        } else {
            cw = Math.min(
                (H - (rows - 1) * CAL_YM_GAP) / (rows * CAL_YM_RATIO),   // tenir en hauteur
                (W * 0.5 - (cols - 1) * CAL_YM_GAP) / cols,              // au plus la moitié de la largeur
                CAL_YM_MAX
            );
            panelW = cols * cw + (cols - 1) * CAL_YM_GAP;
            mainW  = W - panelW - gap;
            mainH  = H - barH;
        }
        if (cw < minCw || mainW < 140 || mainH < 120) return;
        const cell  = Math.min(mainW / 7, mainH / 7);   // taille d'une case du mois
        const score = cell + 0.25 * cw;                 // les mini-mois doivent rester lisibles
        if (!best || score > best.score) best = { mode, cols, panelW: Math.floor(panelW), score };
    };
    [3, 4, 6, 12].forEach(c => consider('top',  c));
    [1, 2, 3].forEach(c     => consider('side', c));
    return best;
}

function _calLayout(con) {
    if (!con || !con.isConnected) return;
    const header = con.querySelector('.cal-header');
    const body   = con.querySelector('.cal-body');
    if (!header || !body) return;

    const cs = getComputedStyle(con);
    const W = con.clientWidth  - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = con.clientHeight - parseFloat(cs.paddingTop)  - parseFloat(cs.paddingBottom);
    if (W <= 0 || H <= 0) return;

    // 1. Taille du texte de l'en-tête, du menu et de la barre d'événement
    const hf = Math.round(Math.max(12, Math.min(26, W / 48, H / 26)));
    con.style.fontSize = hf + 'px';

    // 2. Place disponible pour le corps (année + mois)
    const main  = con.querySelector('.cal-main');
    const panel = con.querySelector('.cal-year-panel');
    const bar   = con.querySelector('.cal-event-bar');
    const bodyGap = Math.round(hf * 0.7);
    body.style.gap = bodyGap + 'px';
    const outerGap = parseFloat(cs.rowGap) || 0;
    const bodyW = W;
    const bodyH = H - header.offsetHeight - outerGap;
    const barH  = (bar && bar.classList.contains('is-open'))
        ? bar.offsetHeight + (parseFloat(getComputedStyle(main).rowGap) || 0)
        : 0;

    // 3. Disposition de l'année scolaire
    let mode = 'top';
    if (panel && !body.classList.contains('cal-year-hidden')) {
        const best = _calChooseYearLayout(bodyW, bodyH, bodyGap, barH, CAL_YM_MIN)
                  || _calChooseYearLayout(bodyW, bodyH, bodyGap, barH, 0)
                  || { mode: 'top', cols: 12, panelW: bodyW };
        mode = best.mode;
        panel.style.setProperty('--ym-cols', best.cols);
        panel.style.setProperty('--ym-gap', CAL_YM_GAP + 'px');
        panel.style.width = mode === 'side' ? best.panelW + 'px' : '';
    }
    body.classList.toggle('cal-mode-side', mode === 'side');
    body.classList.toggle('cal-mode-top',  mode !== 'side');

    // 4. Taille du texte de la grille : la plus grande qui tient
    _calFitGrid(con.querySelector('.cal-grid'));
}

// Recherche par dichotomie de la plus grande police pour laquelle
// toutes les cases du mois tiennent dans la grille, sans débordement.
function _calFitGrid(grid) {
    if (!grid) return;
    const gw = grid.clientWidth, gh = grid.clientHeight;
    if (!gw || !gh) return;
    const nCols = grid.querySelectorAll('.cal-day-head').length || 7;
    const nRows = grid.querySelectorAll('.cal-day').length / nCols || 6;
    const wn    = grid.querySelector('.cal-wn-head');
    const cellW = (gw - (wn ? wn.offsetWidth : 0)) / nCols;
    const fits = px => {
        grid.style.fontSize = px + 'px';
        return grid.scrollHeight <= grid.clientHeight + 1;
    };
    const lo0 = 7;
    // Plafond : le numéro du jour ne doit pas manger la place des événements
    let hi = Math.max(lo0, Math.min(48, cellW / 4.2, gh / ((nRows + 0.7) * 2.6)));
    if (fits(hi)) return;
    let lo = lo0;
    if (!fits(lo)) return;
    for (let i = 0; i < 10 && hi - lo > 0.25; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid; else hi = mid;
    }
    fits(Math.floor(lo * 4) / 4);
}

// Ancien nom conservé pour compatibilité
function _calScaleFont(con) { _calLayout(con); }

// Réajuste les calendriers en plein écran quand la fenêtre change de taille
window.addEventListener('resize', () => {
    document.querySelectorAll('.cal-container.cal-fullboard').forEach(_calLayout);
});

// =========================================================================
// RENDU COMPLET
// =========================================================================
const CAL_MOIS_COURT = ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
const CAL_JOURS_LONG = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

// Échappe le texte saisi par l'utilisateur avant de l'insérer dans le HTML
function _calEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Mini-calendrier d'un mois (toujours 6 lignes de semaines : toutes les cartes ont la même taille)
function _calMiniHtml(m, yr, s, today, schoolSet) {
    const isActive = (m === s.month && yr === s.year);
    const isToday  = (m === today.getMonth() && yr === today.getFullYear());
    let cls = 'cal-ym-card';
    if (isActive) cls += ' cal-ym-active';
    if (isToday)  cls += ' cal-ym-today';

    const dim = new Date(yr, m + 1, 0).getDate();
    let dow = new Date(yr, m, 1).getDay();
    dow = dow === 0 ? 6 : dow - 1; // lundi = 0

    let h = `<div class="cym-title">${CAL_MOIS_COURT[m]} <span class="cym-yr">${yr}</span></div>`;
    h += '<div class="cym-row cym-head">' +
         ['L','M','M','J','V','S','D'].map((j, i) => `<span class="${i >= 5 ? 'cym-we' : ''}">${j}</span>`).join('') +
         '</div>';
    for (let r = 0; r < 6; r++) {
        h += '<div class="cym-row">';
        for (let c = 0; c < 7; c++) {
            const d = r * 7 + c - dow + 1;
            if (d < 1 || d > dim) { h += '<span></span>'; continue; }
            const key = `${yr}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let sc = c >= 5 ? 'cym-we' : '';
            if (schoolSet.has(key))              sc += ' cym-school';
            if (isToday && d === today.getDate()) sc += ' cym-curday';
            h += `<span class="${sc.trim()}">${d}</span>`;
        }
        h += '</div>';
    }
    return `<div class="${cls}" data-ym-month="${m}" data-ym-year="${yr}" title="${CALENDRIER_MOIS[m]} ${yr}">${h}</div>`;
}

function _calRender(widget) {
    const s   = widget._calState;
    const con = widget.querySelector('.cal-container');
    if (!con) return;

    const { year, month, events, showWeekends, showWeekNums } = s;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const isFull = con.classList.contains('cal-fullboard');

    let startDow = new Date(year, month, 1).getDay();
    startDow = (startDow === 0) ? 6 : startDow - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const cols      = showWeekends ? 7 : 5;
    const colLabels = showWeekends ? CALENDRIER_JOURS : CALENDRIER_JOURS.slice(0, 5);
    // Colonnes grisées : Mer=2, Sam=5, Dim=6  (lundi=0)
    const GREY_COLS = new Set(showWeekends ? [2, 5, 6] : [2]);

    // Vue annuelle : toujours l'année scolaire EN COURS (sept → août)
    const schoolYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    const yearViewMois = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];
    const schoolSet = _calSchoolDates.dateSet;

    // ── En-tête ──
    let html = `
    <div class="cal-header">
        <div class="cal-title">${CALENDRIER_MOIS[month]}<span class="cal-title-year">${year}</span></div>
        <div class="cal-navgroup">
            <button class="cal-nav cal-prev" title="Mois précédent">‹</button>
            <button class="cal-today-btn" title="Revenir au mois en cours">Aujourd'hui</button>
            <button class="cal-nav cal-next" title="Mois suivant">›</button>
        </div>
        <button class="cal-tool cal-year-btn ${s.yearPanelOpen ? 'is-on' : ''}" title="Afficher / masquer l'année scolaire">🗓</button>
        <button class="cal-tool cal-opts-btn ${widget._calOptsOpen ? 'is-on' : ''}" title="Options">⚙</button>
        <div class="wf-btns">
            <button type="button" class="wf-btn wf-btn-min" data-cal-wf="min" title="Réduire" aria-label="Réduire"></button>
            <button type="button" class="wf-btn wf-btn-max" data-cal-wf="max" title="${isFull ? 'Quitter le plein écran' : 'Plein écran'}" aria-label="Plein écran"></button>
            <button type="button" class="wf-btn wf-btn-close" data-cal-wf="close" title="Fermer" aria-label="Fermer"></button>
        </div>
    </div>`;

    // ── Menu Options (déroulant) ──
    html += `
    <div class="cal-opts-panel ${widget._calOptsOpen ? 'is-open' : ''}">
        <div class="cal-opts-title">Affichage</div>
        <label class="cal-opt-check"><input type="checkbox" class="cal-cb-we" ${showWeekends ? 'checked' : ''}> Week-ends</label>
        <label class="cal-opt-check"><input type="checkbox" class="cal-cb-wn" ${showWeekNums ? 'checked' : ''}> Numéros de semaine</label>
        <div class="cal-opts-title">Année scolaire</div>
        <div class="cal-opts-row"><button class="cal-opt-btn cal-school-btn" title="Gérer les vacances et jours fériés">🌸 Vacances et jours fériés</button></div>
        <div class="cal-opts-title">Sauvegarde des événements</div>
        <div class="cal-opts-row">
            <button class="cal-opt-btn cal-idb-status" title="État de la sauvegarde IndexedDB">💾 …</button>
            <button class="cal-opt-btn cal-export-btn" title="Exporter les événements en JSON">⬇ Exporter</button>
            <label class="cal-opt-btn cal-import-lbl" title="Importer des événements depuis un fichier JSON">⬆ Importer<input type="file" class="cal-import-input" accept=".json" style="display:none;"></label>
        </div>
    </div>`;

    // ── Corps : année scolaire + mois ──
    html += `
    <div class="cal-body cal-mode-top ${s.yearPanelOpen ? '' : 'cal-year-hidden'}">
        <div class="cal-year-panel">
            ${yearViewMois.map(m => _calMiniHtml(m, m >= 8 ? schoolYear : schoolYear + 1, s, today, schoolSet)).join('')}
        </div>
        <div class="cal-main">
            <div class="cal-grid" style="grid-template-columns:${showWeekNums ? '2.2em ' : ''}repeat(${cols}, minmax(0, 1fr));">`;

    // En-têtes des jours
    if (showWeekNums) html += `<div class="cal-cell cal-wn-head"></div>`;
    colLabels.forEach((j, i) => {
        let cls = 'cal-cell cal-day-head';
        if (showWeekends && (i === 5 || i === 6)) cls += ' cal-we';
        if (GREY_COLS.has(i)) cls += ' cal-grey-col';
        if (i < cols - 1) cls += ' cal-border-r';
        html += `<div class="${cls}">${j}</div>`;
    });

    // Cases des jours
    let cellDay = 1 - startDow;
    // Sans les week-ends, on saute les samedis/dimanches : on avance par semaine de 7 jours
    const weeks = Math.ceil((startDow + daysInMonth) / 7);
    for (let w = 0; w < weeks; w++) {
        const isLastRow = w === weeks - 1;
        const weekStart = cellDay;
        if (showWeekNums) {
            const d = new Date(year, month, weekStart);
            html += `<div class="cal-cell cal-wn${isLastRow ? '' : ' cal-border-b'}">${_getWeekNumber(d)}</div>`;
        }
        for (let c = 0; c < 7; c++, cellDay++) {
            if (!showWeekends && c >= 5) continue;
            const isWE = c >= 5;
            let cls = 'cal-cell cal-day';
            if (!isLastRow)    cls += ' cal-border-b';
            if (c < cols - 1)  cls += ' cal-border-r';
            if (GREY_COLS.has(c)) cls += ' cal-grey-col';

            let labelNum, evtHtml = '', dataAttr = '';
            if (cellDay < 1) {
                cls += ' cal-other-month';
                labelNum = daysInPrev + cellDay;
            } else if (cellDay > daysInMonth) {
                cls += ' cal-other-month';
                labelNum = cellDay - daysInMonth;
            } else {
                labelNum = cellDay;
                if (isCurrentMonth && cellDay === today.getDate()) cls += ' cal-today';
                if (isWE) cls += ' cal-we';
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
                if (schoolSet.has(key)) cls += ' cal-school-day';
                if (events[key]) {
                    const ev = events[key];
                    const th = CALENDRIER_THEMES[ev.color] || CALENDRIER_THEMES.bleu;
                    const lbl = _calEsc(ev.label);
                    evtHtml = `<div class="cal-event" style="background:${th.bg};color:${th.text};" title="${lbl}">${lbl}</div>`;
                }
                dataAttr = `data-day="${cellDay}" data-month="${month}" data-year="${year}"`;
            }
            html += `<div class="${cls}" ${dataAttr}><span class="cal-day-num">${labelNum}</span>${evtHtml}</div>`;
        }
    }

    // ── Barre d'édition d'un événement ──
    html += `</div>
            <div class="cal-event-bar">
                <span class="cal-ev-date"></span>
                <input class="cal-ev-input" type="text" placeholder="Étiquette…" maxlength="30">
                <div class="cal-ev-colors">
                    ${Object.entries(CALENDRIER_THEMES).map(([k, th]) =>
                        `<button class="cal-ev-sw" data-color="${k}" title="${k}" style="background:${th.bg};"></button>`).join('')}
                </div>
                <button class="cal-ev-btn cal-ev-save"   title="Enregistrer (Entrée)">✓</button>
                <button class="cal-ev-btn cal-ev-del"    title="Supprimer l'événement">🗑</button>
                <button class="cal-ev-btn cal-ev-cancel" title="Fermer (Échap)">✕</button>
            </div>
        </div>
    </div>`;

    con.innerHTML = html;
    _calBindEvents(widget);
    _calUpdateIdbStatus(widget);
    _calLayout(con);
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
    const on  = (sel, ev, fn) => { const el = con.querySelector(sel); if (el) el.addEventListener(ev, fn); };

    // ── Navigation ──
    on('.cal-prev', 'click', (e) => {
        e.stopPropagation();
        s.month--; if (s.month < 0) { s.month = 11; s.year--; }
        _calRender(widget); saveBoard();
    });
    on('.cal-next', 'click', (e) => {
        e.stopPropagation();
        s.month++; if (s.month > 11) { s.month = 0; s.year++; }
        _calRender(widget); saveBoard();
    });
    on('.cal-today-btn', 'click', (e) => {
        e.stopPropagation();
        const now = new Date(); s.year = now.getFullYear(); s.month = now.getMonth();
        _calRender(widget); saveBoard();
    });

    // ── Afficher / masquer l'année scolaire ──
    on('.cal-year-btn', 'click', (e) => {
        e.stopPropagation();
        s.yearPanelOpen = !s.yearPanelOpen;
        con.querySelector('.cal-body').classList.toggle('cal-year-hidden', !s.yearPanelOpen);
        e.currentTarget.classList.toggle('is-on', s.yearPanelOpen);
        _calLayout(con);
        saveBoard();
    });
    con.querySelectorAll('.cal-ym-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            s.month = parseInt(card.dataset.ymMonth);
            s.year  = parseInt(card.dataset.ymYear);
            _calRender(widget); saveBoard();
        });
    });

    // ── Menu Options ──
    on('.cal-opts-btn', 'click', (e) => {
        e.stopPropagation();
        const panel = con.querySelector('.cal-opts-panel');
        widget._calOptsOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', widget._calOptsOpen);
        e.currentTarget.classList.toggle('is-on', widget._calOptsOpen);
    });
    on('.cal-cb-we', 'change', function (e) {
        e.stopPropagation(); s.showWeekends = this.checked; _calRender(widget); saveBoard();
    });
    on('.cal-cb-wn', 'change', function (e) {
        e.stopPropagation(); s.showWeekNums = this.checked; _calRender(widget); saveBoard();
    });
    on('.cal-school-btn', 'click', (e) => { e.stopPropagation(); _calOpenSchoolDatesModal(); });
    on('.cal-export-btn', 'click', (e) => { e.stopPropagation(); _calExportJSON(widget); });
    on('.cal-idb-status', 'click', (e) => { e.stopPropagation(); _calSaveEvents(widget); });
    const importInput = con.querySelector('.cal-import-input');
    if (importInput) importInput.addEventListener('change', (e) => {
        e.stopPropagation();
        _calImportJSON(widget, importInput.files[0]);
        importInput.value = '';
    });

    // ── Barre d'édition d'un événement ──
    const bar = con.querySelector('.cal-event-bar');
    const input = bar.querySelector('.cal-ev-input');
    const selectColor = (color) => {
        bar.dataset.color = CALENDRIER_THEMES[color] ? color : 'bleu';
        bar.querySelectorAll('.cal-ev-sw').forEach(sw => sw.classList.toggle('is-sel', sw.dataset.color === bar.dataset.color));
    };
    const closeBar = () => {
        bar.classList.remove('is-open');
        con.querySelectorAll('.cal-day.cal-selected').forEach(c => c.classList.remove('cal-selected'));
        _calLayout(con);
    };

    con.querySelectorAll('.cal-day[data-day]').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const y = +cell.dataset.year, m = +cell.dataset.month, d = +cell.dataset.day;
            const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const ev  = s.events[key] || { label: '', color: 'bleu' };
            con.querySelectorAll('.cal-day.cal-selected').forEach(c => c.classList.remove('cal-selected'));
            cell.classList.add('cal-selected');
            bar.dataset.key = key;
            bar.querySelector('.cal-ev-date').textContent =
                `${CAL_JOURS_LONG[new Date(y, m, d).getDay()]} ${d} ${CALENDRIER_MOIS[m].toLowerCase()}`;
            input.value = ev.label;
            selectColor(ev.color || 'bleu');
            const wasOpen = bar.classList.contains('is-open');
            bar.classList.add('is-open');
            if (!wasOpen) _calLayout(con);
            input.focus();
        });
    });

    bar.querySelectorAll('.cal-ev-sw').forEach(sw => {
        sw.addEventListener('click', (e) => { e.stopPropagation(); selectColor(sw.dataset.color); input.focus(); });
    });
    bar.querySelector('.cal-ev-save').addEventListener('click', (e) => {
        e.stopPropagation();
        const label = input.value.trim();
        if (label) s.events[bar.dataset.key] = { label, color: bar.dataset.color || 'bleu' };
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
    bar.querySelector('.cal-ev-cancel').addEventListener('click', (e) => { e.stopPropagation(); closeBar(); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  bar.querySelector('.cal-ev-save').click();
        if (e.key === 'Escape') closeBar();
        e.stopPropagation();
    });

    // ── Boutons fenêtre : réduire / plein écran / fermer ──
    con.querySelectorAll('[data-cal-wf]').forEach(btn => {
        ['pointerdown', 'touchstart'].forEach(t =>
            btn.addEventListener(t, e => e.stopPropagation(), { passive: true }));
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const act = btn.dataset.calWf;
            if (act === 'min')   _calMinimize(widget);
            if (act === 'max')   _calToggleFull(widget);
            if (act === 'close') _calClose(widget);
        });
    });

    // Bloquer le déplacement du widget depuis les contrôles
    con.querySelectorAll('button, input, select, label, .cal-ym-card, .cal-day').forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
    });
}

// =========================================================================
// BOUTONS FENÊTRE (même comportement que le widget Éphéméride)
// =========================================================================

// Plein écran board (force : true = entrer, false = sortir, undefined = basculer)
function _calToggleFull(widget, force) {
    const con = widget.querySelector('.cal-container');
    if (!con) return;
    const full = force !== undefined ? force : !con.classList.contains('cal-fullboard');
    if (full === con.classList.contains('cal-fullboard')) return;

    if (full) {
        // Passer le widget au premier plan pour que le plein écran couvre les autres
        widget.dataset.calSavedZ = widget.style.zIndex || '';
        widget.style.zIndex = '9999';
    } else {
        widget.style.zIndex = widget.dataset.calSavedZ || '';
        delete widget.dataset.calSavedZ;
    }
    con.classList.toggle('cal-fullboard', full);
    widget.classList.toggle('cal-is-full', full);

    const b = con.querySelector('[data-cal-wf="max"]');
    if (b) b.title = full ? 'Quitter le plein écran' : 'Plein écran';
    _calLayout(con);
}

// Réduire en mini-barre (fonction partagée installée par widget-ephemeride.js)
function _calMinimize(widget) {
    if (typeof window._wfMiniBarCollapse !== 'function') return;
    const con = widget.querySelector('.cal-container');
    _calToggleFull(widget, false);
    if (con) con.style.visibility = 'hidden'; // le calendrier ne doit pas déborder sur la mini-barre
    window._wfMiniBarCollapse(widget, '📅 Calendrier', {
        onExpand: () => {
            if (con) con.style.visibility = '';
            _calRender(widget);
        }
    });
}

// Fermer (identique à la croix de la barre d'action)
function _calClose(widget) {
    if (typeof snapshotNow === 'function') snapshotNow();
    if (typeof closeCtxMenuAll === 'function') closeCtxMenuAll();
    if (widget.dataset.calId) calEventStorage.remove(widget.dataset.calId);
    widget.remove();
    if (typeof saveBoard === 'function') saveBoard();
}

// Échap : quitter le plein écran
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.widget.cal-is-full').forEach(w => _calToggleFull(w, false));
}, true);

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
