// =========================================================================
// BIBLIOTHÈQUE DE PROJETS — Le Bureau du Prof
// Stockage des projets en IndexedDB (local, sans serveur)
// VERSION SIMPLIFIÉE : 1 projet = 1 tableau (plus de scènes multiples)
// =========================================================================

const DB_NAME    = 'ProfBureauDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

let _db = null;

// ── Ouverture / init de la base ───────────────────────────────────────────
function dbOpen() {
    return new Promise((resolve, reject) => {
        if (_db) { resolve(_db); return; }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };
        req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
        req.onerror   = (e) => reject(e.target.error);
    });
}

function dbGet(id) {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    }));
}

function dbPut(obj) {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(obj);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    }));
}

function dbDelete(id) {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(id);
        req.onsuccess = () => resolve();
        req.onerror   = () => reject(req.error);
    }));
}

function dbGetAll() {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).index('updatedAt').getAll();
        req.onsuccess = () => {
            const all = (req.result || []).reverse();
            // Trier par order si présent, sinon conserver l'ordre updatedAt
            const hasOrder = all.some(p => typeof p.order === 'number');
            if (hasOrder) {
                all.sort((a, b) => {
                    const ao = typeof a.order === 'number' ? a.order : 99999;
                    const bo = typeof b.order === 'number' ? b.order : 99999;
                    return ao - bo;
                });
            }
            resolve(all);
        };
        req.onerror   = () => reject(req.error);
    }));
}

// ── Mode brouillon ────────────────────────────────────────────────────────
let _isDraft = false;
function isDraftMode() { return _isDraft; }

// ── ID du projet courant ──────────────────────────────────────────────────
function getCurrentProjectId() {
    if (_isDraft) return null;
    return localStorage.getItem('currentProjectId') || null;
}
function setCurrentProjectId(id) {
    if (_isDraft) return;
    if (id) localStorage.setItem('currentProjectId', id);
    else    localStorage.removeItem('currentProjectId');
}

// ── Migration : projets multi-scènes → un projet par scène ───────────────
async function migrateScenesToProjects() {
    // v2 : correction du bug config=null — on rejoue si l'ancienne version a tourné
    if (localStorage.getItem('_scenesMigrationDone') === 'v2') return;
    // Supprimer l'ancien flag pour forcer le rejeu
    localStorage.removeItem('_scenesMigrationDone');
    try {
        // Sauvegarder l'état courant en DB avant de lire les projets,
        // sinon la scène active peut avoir config=null ou obsolète.
        // Attendre que la restauration du board soit terminée.
        const curId = localStorage.getItem('currentProjectId');
        if (curId) {
            try {
                // Patienter jusqu'à 3s que isRestoringState soit false
                await new Promise(resolve => {
                    let tries = 0;
                    const poll = setInterval(() => {
                        tries++;
                        if ((typeof isRestoringState === 'undefined' || !isRestoringState) || tries > 30) {
                            clearInterval(poll); resolve();
                        }
                    }, 100);
                });
                saveCurrentSceneData(); // met à jour scenes[0].config depuis le DOM
                const cur = await dbGet(curId);
                if (cur) {
                    cur.scenes = scenes.slice();
                    cur.updatedAt = Date.now();
                    await dbPut(cur);
                }
            } catch(e) {}
        }

        const allProjects = await dbGetAll();
        const toAdd = [];
        const toDelete = [];

        for (const p of allProjects) {
            const sceneList = p.scenes || [];
            if (sceneList.length <= 1) {
                // Déjà compatible — normaliser pour ne garder qu'une scène
                if (sceneList.length === 1) {
                    p.scenes = [sceneList[0]];
                    p.currentScene = 0;
                    await dbPut(p);
                }
                continue;
            }
            // Plusieurs scènes → éclater en projets séparés
            toDelete.push(p.id);
            sceneList.forEach((sc, idx) => {
                toAdd.push({
                    id:           'proj_' + Date.now() + '_' + idx,
                    name:         p.name + (sceneList.length > 1 ? ' — ' + (sc.name || 'Tableau ' + (idx + 1)) : ''),
                    scenes:       [{ id: sc.id || Date.now(), name: sc.name || 'Tableau 1', config: sc.config || null, background: sc.background || 'none' }],
                    currentScene: 0,
                    updatedAt:    (p.updatedAt || Date.now()) + idx,
                });
            });
        }

        for (const id of toDelete) await dbDelete(id);
        for (const p of toAdd)    await dbPut(p);

        // Si le projet courant a été éclaté, pointer sur le premier nouveau
        const oldCurId = localStorage.getItem('currentProjectId');
        if (oldCurId && toDelete.includes(oldCurId) && toAdd.length) {
            localStorage.setItem('currentProjectId', toAdd[0].id);
        }

        localStorage.setItem('_scenesMigrationDone', 'v2');
        console.log('[Migration] Scènes → projets terminée.');
    } catch(e) {
        console.warn('[Migration] Erreur :', e);
    }
}

// ── Sauvegarder le projet courant en DB ──────────────────────────────────
async function saveProjectToDB(name) {
    // Ne pas capturer l'état du board si une restauration est en cours
    if (typeof isRestoringState === 'undefined' || !isRestoringState) {
        saveCurrentSceneData();
    }
    if (_isDraft) return null;
    let id = getCurrentProjectId();
    if (!id) return null;
    const project = {
        id,
        name:         name || 'Sans titre',
        scenes:       scenes.slice(0, 1), // toujours 1 scène
        currentScene: 0,
        updatedAt:    Date.now(),
    };
    await dbPut(project);
    return project;
}

// ── Charger un projet depuis la DB ───────────────────────────────────────
async function loadProjectFromDB(id) {
    const project = await dbGet(id);
    if (!project) return false;
    setCurrentProjectId(project.id);
    scenes       = project.scenes && project.scenes.length ? [project.scenes[0]] : [{ id: Date.now(), name: 'Tableau 1', config: null, background: 'none' }];
    currentScene = 0;
    saveScenesMeta();
    loadScene(0);
    renderScenesBar();
    return project;
}

// ── Nouveau projet vierge ────────────────────────────────────────────────
async function newProject(name) {
    const curId = getCurrentProjectId();
    if (curId) {
        try {
            const cur = await dbGet(curId);
            await saveProjectToDB(cur?.name || 'Sans titre');
        } catch(e) {
            await saveProjectToDB('Sans titre');
        }
    }
    _isDraft = false;
    setCurrentProjectId(null);
    scenes = [{ id: Date.now(), name: 'Tableau 1', config: null, background: 'none' }];
    currentScene = 0;
    saveScenesMeta();
    loadScene(0);
    renderScenesBar();

    const newId = 'proj_' + Date.now();
    setCurrentProjectId(newId);
    await dbPut({ id: newId, name: name || 'Nouveau projet', scenes, currentScene: 0, updatedAt: Date.now() });
    _updateProjectTitle(name || 'Nouveau projet');
}

// ── Nouveau projet brouillon ──────────────────────────────────────────────
async function newDraftProject() {
    if (!_isDraft) {
        const curId = getCurrentProjectId();
        if (curId) {
            try {
                const cur = await dbGet(curId);
                await saveProjectToDB(cur?.name || 'Sans titre');
            } catch(e) {}
        }
    }
    _isDraft = true;
    localStorage.removeItem('currentProjectId');
    scenes = [{ id: Date.now(), name: 'Tableau 1', config: null, background: '#BAA09B' }];
    currentScene = 0;
    loadScene(0);
    renderScenesBar();
    _updateProjectTitle('');
}

// ── Afficher le titre du projet courant ──────────────────────────────────
function _updateProjectTitle(name) {
    const el = document.getElementById('current-project-name');
    if (el) el.textContent = name ? '📁 ' + name : '';
    const rubriquelabel = document.getElementById('sub-fichier-tableaux-label');
    if (rubriquelabel) rubriquelabel.textContent = name ? `🗂️ Projet "${name}"` : '🗂️ Projet';
}

// ── Charger le nom du projet courant au démarrage ────────────────────────
async function initCurrentProjectName() {
    // Lancer la migration en premier
    await migrateScenesToProjects();
    const id = getCurrentProjectId();
    if (!id) return;
    try {
        const p = await dbGet(id);
        if (p) _updateProjectTitle(p.name);
    } catch(e) {}
}


// ── Actions ───────────────────────────────────────────────────────────────

async function _saveProjectsOrder(projects) {
    for (let i = 0; i < projects.length; i++) {
        const p = await dbGet(projects[i].id);
        if (p) { p.order = i; await dbPut(p); }
    }
}

async function saveCurrentProject() {
    if (_isDraft) { await _projSaveDraft(); return; }
    const id = getCurrentProjectId();
    if (!id) return;
    try {
        const cur = await dbGet(id);
        await saveProjectToDB(cur?.name || 'Sans titre');
        _updateProjectTitle(cur?.name || 'Sans titre');
        if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
    } catch(e) {}
}

async function _projSaveDraft() {
    const name = await modalPrompt('Enregistrer le brouillon', 'Donnez un nom à ce tableau :', 'Nouveau tableau');
    if (name === null) return;
    const finalName = name.trim() || 'Nouveau projet';
    _isDraft = false;
    const newId = 'proj_' + Date.now();
    localStorage.setItem('currentProjectId', newId);
    saveCurrentSceneData();
    await dbPut({ id: newId, name: finalName, scenes, currentScene: 0, updatedAt: Date.now() });
    _updateProjectTitle(finalName);
    if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
}

// ── Sauvegarder silencieusement sans changer l'ordre (updatedAt préservé) ─
async function _saveProjectSilent(id) {
    // Ne pas sauvegarder si une restauration est en cours (board potentiellement vide/incomplet)
    if (typeof isRestoringState !== 'undefined' && isRestoringState) return;
    saveCurrentSceneData();
    if (_isDraft || !id) return;
    const existing = await dbGet(id);
    if (!existing) return;
    existing.scenes       = scenes.slice(0, 1);
    existing.currentScene = 0;
    // Ne pas toucher à updatedAt pour ne pas changer l'ordre de la liste
    await dbPut(existing);
}

async function _projLoad(id) {
    if (!_isDraft) {
        const curId = getCurrentProjectId();
        if (curId) {
            // Attendre que la restauration en cours soit terminée avant de sauvegarder
            await new Promise(resolve => {
                if (typeof isRestoringState === 'undefined' || !isRestoringState) { resolve(); return; }
                let tries = 0;
                const poll = setInterval(() => {
                    tries++;
                    if ((typeof isRestoringState === 'undefined' || !isRestoringState) || tries > 40) {
                        clearInterval(poll); resolve();
                    }
                }, 75);
            });
            try { await _saveProjectSilent(curId); } catch(e) {}
        }
    }
    _isDraft = false;
    const project = await loadProjectFromDB(id);
    if (project) {
        _updateProjectTitle(project.name);
        // Rafraîchir le panneau après que l'ID courant soit bien posé
        if (typeof refreshProjectsPanel === 'function') {
            setTimeout(() => refreshProjectsPanel(), 50);
        }
    }
}

async function _projNewProject() {
    const name = await modalPrompt('Nouveau tableau', 'Nom du nouveau tableau :', 'Nouveau tableau');
    if (name === null) return;
    const finalName = name.trim() || 'Nouveau tableau';
    await newProject(finalName);
    _updateProjectTitle(finalName);
    if (typeof refreshProjectsPanel === 'function') {
        setTimeout(() => refreshProjectsPanel(), 50);
    }
}

async function _projRename(id, currentName) {
    const newName = await modalPrompt('Renommer le tableau', 'Nouveau nom :', currentName);
    if (newName === null || !newName.trim()) return;
    const p = await dbGet(id);
    if (!p) return;
    p.name = newName.trim();
    await dbPut(p);
    if (id === getCurrentProjectId()) _updateProjectTitle(p.name);
    if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
}

async function _projDelete(id) {
    const p = await dbGet(id);
    if (!p) return;
    if (!await modalConfirm('Supprimer ce tableau', `Voulez-vous vraiment supprimer "${p.name}" ?\n\nCette action est irréversible.`, { danger: true })) return;
    await dbDelete(id);
    if (id === getCurrentProjectId()) {
        setCurrentProjectId(null);
        _updateProjectTitle('');
    }
    _renderProjectsList();
}

function exportCurrentProject() {
    saveCurrentSceneData();
    const scene = scenes[0] || {};
    const exportData = {
        _type:    'prof-bureau-single-project',
        _version: 1,
        exportedAt: Date.now(),
        project: {
            id:           getCurrentProjectId(),
            name:         document.getElementById('proj-current-name')?.value || 'projet',
            scenes:       [scene],
            currentScene: 0,
            updatedAt:    Date.now(),
        }
    };
    const name = exportData.project.name;
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
    a.download = `lebureauduprof_${name.replace(/\s+/g,'-')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove();
}

async function exportAllProjects() {
    const curId = getCurrentProjectId();
    if (curId) {
        try { const cur = await dbGet(curId); await saveProjectToDB(cur?.name || 'Sans titre'); } catch(e) {}
    }
    const allProjects = await dbGetAll();
    if (!allProjects.length) { await modalAlert('Export', 'Aucun tableau à exporter.', 'warning'); return; }
    const exportData = {
        _type: 'prof-bureau-all-projects',
        _version: 1,
        exportedAt: Date.now(),
        currentProjectId: getCurrentProjectId(),
        projects: allProjects
    };
    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
    a.download = `lebureauduprof_TOUS-LES-TABLEAUX_${date}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    const btn = document.getElementById('proj-export-all-btn');
    if (btn) { const orig = btn.textContent; btn.textContent = '✅ Exporté !'; setTimeout(() => btn.textContent = orig, 2000); }
}

async function importAllProjects() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const text = await file.text();
        try {
            const data = JSON.parse(text);
            if (data._type !== 'prof-bureau-all-projects' || !Array.isArray(data.projects)) {
                await modalAlert('Import impossible', 'Ce fichier ne contient pas une sauvegarde complète.\n\nPour importer un seul tableau, utilisez "Charger un projet (JSON)" dans le menu Fichier.', 'warning');
                return;
            }
            const count = data.projects.length;
            const ok = await modalConfirm(
                'Importer tous les tableaux',
                `Ce fichier contient ${count} tableau${count > 1 ? 'x' : ''}.\n\nAttention : cela va remplacer tous vos tableaux actuels.`,
                { danger: true }
            );
            if (!ok) return;
            const db = await dbOpen();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const req = tx.objectStore(STORE_NAME).clear();
                req.onsuccess = resolve; req.onerror = reject;
            });
            for (const p of data.projects) {
                if (p.scenes && p.scenes.length > 1) p.scenes = [p.scenes[0]];
                p.currentScene = 0;
                await dbPut(p);
            }
            const restoredCurId = data.currentProjectId || data.projects[0]?.id;
            if (restoredCurId) {
                const project = await loadProjectFromDB(restoredCurId);
                if (project) _updateProjectTitle(project.name);
            }
            if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
            await modalAlert('Import réussi', `${count} tableau${count > 1 ? 'x' : ''} restauré${count > 1 ? 's' : ''} avec succès !`, 'success');
        } catch(err) {
            await modalAlert('Erreur d\'importation', err.message, 'error');
        }
    };
    input.click();
}

// ── Scrollbar discrète ────────────────────────────────────────────────────
(function() {
    const s = document.createElement('style');
    s.id = 'projects-scrollbar-style';
    s.textContent = `
        #projects-list::-webkit-scrollbar { width: 5px; }
        #projects-list::-webkit-scrollbar-track { background: transparent; }
        #projects-list::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        body.menu-light #projects-list::-webkit-scrollbar-thumb { background: #ccc; }
    `;
    document.head.appendChild(s);
})();
