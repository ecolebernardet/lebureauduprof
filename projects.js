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
// Gardé dans sessionStorage : propre à chaque onglet, effacé quand l'onglet
// est fermé, conservé par F5. Un nouvel onglet démarre donc toujours sans
// tableau ouvert, et deux onglets ne se marchent plus dessus.
let _startupDone = false;   // passe à true quand l'ouverture du site est terminée
function _readCurId()   { try { return sessionStorage.getItem('currentProjectId') || null; } catch(e) { return null; } }
function _writeCurId(id) {
    try {
        if (id) sessionStorage.setItem('currentProjectId', id);
        else    sessionStorage.removeItem('currentProjectId');
    } catch(e) {}
}
function getCurrentProjectId() {
    if (_isDraft) return null;
    return _readCurId();
}
function setCurrentProjectId(id) {
    if (_isDraft) return;
    _writeCurId(id);
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
        const curId = _readCurId();
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
        const oldCurId = _readCurId();
        if (oldCurId && toDelete.includes(oldCurId) && toAdd.length) {
            _writeCurId(toAdd[0].id);
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
    // Repartir de l'enregistrement existant pour ne pas perdre ses autres champs
    // (notamment « order », sinon le tableau saute en fin de liste)
    let existing = null;
    try { existing = await dbGet(id); } catch(e) {}
    const project = Object.assign({}, existing || {}, {
        id,
        name:         name || 'Sans titre',
        scenes:       scenes.slice(0, 1), // toujours 1 scène
        currentScene: 0,
        updatedAt:    Date.now(),
    });
    await dbPut(project);
    return project;
}

// ── Charger un projet depuis la DB ───────────────────────────────────────
async function loadProjectFromDB(id) {
    const project = await dbGet(id);
    if (!project) return false;
    _cancelProjectAutoSave();   // un enregistrement en attente viserait l'ancien tableau
    _isDraft = false;   // ouvrir un tableau de la bibliothèque quitte le brouillon (import compris)
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
    _cancelProjectAutoSave();   // sinon l'ancien tableau serait écrasé par le tableau vide
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
    _cancelProjectAutoSave();
    _isDraft = true;
    _writeCurId(null);
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
// Ouverture du site (nouvel onglet) : tableau vierge en mode brouillon,
// aucun tableau de la bibliothèque n'est ouvert, donc aucun ne peut être écrasé.
// Rechargement (F5) d'un onglet où un tableau était ouvert : ce tableau est
// relu depuis la bibliothèque (enregistrée automatiquement), qui fait foi.
async function initCurrentProjectName() {
    // Page de garde (iframe) : ne jamais toucher à la bibliothèque
    if (window.location.search.indexOf('mode=pagegarde') !== -1) {
        _isDraft = true;
        _startupDone = true;
        return;
    }
    // Lancer la migration en premier
    await migrateScenesToProjects();
    const id = getCurrentProjectId();
    let project = null;
    if (id) {
        try { project = await loadProjectFromDB(id); } catch(e) {}
    }
    if (project) {
        _updateProjectTitle(project.name);
    } else {
        _writeCurId(null);
        _isDraft = true;
        _updateProjectTitle('');
    }
    _startupDone = true;
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
    if (name === null) return false;
    const finalName = name.trim() || 'Nouveau projet';
    _isDraft = false;
    const newId = 'proj_' + Date.now();
    setCurrentProjectId(newId);
    saveCurrentSceneData();
    await dbPut({ id: newId, name: finalName, scenes, currentScene: 0, updatedAt: Date.now() });
    _updateProjectTitle(finalName);
    if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
    return true;
}

// ── Avertissement avant de quitter un brouillon qui contient du travail ──
// Renvoie true si on peut continuer (brouillon vide, enregistré ou abandonné
// volontairement), false si l'utilisateur annule.
function _draftHasContent() {
    if (document.querySelector('#board .widget, #board .shape-widget')) return true;
    try { if (typeof strokes !== 'undefined' && strokes && strokes.length) return true; } catch(e) {}
    return false;
}
async function _confirmLeaveDraft() {
    if (!_isDraft || !_draftHasContent()) return true;
    const choice = await _draftChoiceDialog();
    if (choice === 'save')    return await _projSaveDraft();   // false si le nom est annulé → on reste sur le brouillon
    if (choice === 'discard') return true;
    return false;                                              // ✕, Échap ou clic à côté : on reste sur le brouillon
}

// Fenêtre à deux choix. Renvoie 'save', 'discard' ou null (fermée sans choisir).
function _draftChoiceDialog() {
    return new Promise(resolve => {
        if (!document.getElementById('draft-dlg-style')) {
            const st = document.createElement('style');
            st.id = 'draft-dlg-style';
            st.textContent = `
#draft-dlg{position:fixed;inset:0;z-index:70000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(10,10,20,.55);font-family:'Quicksand','Nunito',sans-serif;}
#draft-dlg .dd-box{position:relative;width:100%;max-width:440px;box-sizing:border-box;padding:22px 22px 18px;border-radius:18px;background:#1c1a26;color:#ecebf3;border:1px solid #2c2838;box-shadow:0 18px 50px rgba(0,0,0,.5);}
#draft-dlg h3{margin:0 34px 10px 0;font-size:19px;font-weight:800;}
#draft-dlg p{margin:0 0 4px;font-size:14px;line-height:1.45;color:#c9c6d6;}
#draft-dlg .dd-btns{display:flex;flex-direction:column;gap:8px;margin-top:16px;}
#draft-dlg .dd-btns button{padding:11px 14px;border-radius:12px;cursor:pointer;font:inherit;font-size:14px;font-weight:800;border:none;text-align:center;}
#draft-dlg .dd-save{background:#4a90e2;color:#fff;box-shadow:0 4px 12px rgba(74,144,226,.4);}
#draft-dlg .dd-discard{background:transparent;color:#ff7b7b;border:1px solid rgba(255,107,107,.55)!important;}
#draft-dlg .dd-btns button:hover{filter:brightness(1.08);}
#draft-dlg .dd-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;background:rgba(255,255,255,.08);color:#ccc;font-size:14px;}
body.menu-light #draft-dlg .dd-box{background:#f5f4f8;color:#2a2440;border-color:#dddbe6;}
body.menu-light #draft-dlg p{color:#4a4660;}
body.menu-light #draft-dlg .dd-discard{color:#d33a3f;border-color:rgba(211,58,63,.45)!important;}
body.menu-light #draft-dlg .dd-close{background:rgba(42,36,64,.07);color:#5c5870;}`;
            document.head.appendChild(st);
        }
        const ov = document.createElement('div');
        ov.id = 'draft-dlg';
        ov.setAttribute('role', 'dialog');
        ov.setAttribute('aria-modal', 'true');
        ov.innerHTML =
            '<div class="dd-box">' +
              '<button type="button" class="dd-close" title="Annuler" aria-label="Annuler">✕</button>' +
              '<h3>Brouillon non enregistré</h3>' +
              '<p>Le tableau affiché contient du travail en cours.</p>' +
              '<p>Que voulez-vous faire ?</p>' +
              '<div class="dd-btns">' +
                '<button type="button" class="dd-save">L\'enregistrer dans « Mes tableaux » avant de continuer</button>' +
                '<button type="button" class="dd-discard">Quitter le brouillon et perdre le travail en cours</button>' +
              '</div>' +
            '</div>';
        function close(result) {
            ov.remove();
            resolve(result);
        }
        ov.querySelector('.dd-save').addEventListener('click', () => close('save'));
        ov.querySelector('.dd-discard').addEventListener('click', () => close('discard'));
        ov.querySelector('.dd-close').addEventListener('click', () => close(null));
        ov.addEventListener('mousedown', e => { if (e.target === ov) close(null); });
        // Les touches ne déclenchent pas les raccourcis du tableau ; Échap annule
        ov.addEventListener('keydown', e => {
            e.stopPropagation();
            if (e.key === 'Escape') { e.preventDefault(); close(null); }
        });
        document.body.appendChild(ov);
        setTimeout(() => ov.querySelector('.dd-save').focus(), 30);
    });
}

// ── Sauvegarder silencieusement sans changer l'ordre (updatedAt préservé) ─
async function _saveProjectSilent(id) {
    // Ne pas sauvegarder si une restauration est en cours (board potentiellement vide/incomplet)
    if (typeof isRestoringState !== 'undefined' && isRestoringState) return;
    // Le tableau affiché doit être celui qu'on enregistre : sinon on écrirait
    // le contenu d'un tableau dans un autre (changement de tableau entre-temps)
    if (_isDraft || !id || id !== getCurrentProjectId()) return;
    saveCurrentSceneData();
    const existing = await dbGet(id);
    if (!existing) return;
    existing.scenes       = scenes.slice(0, 1);
    existing.currentScene = 0;
    // Ne pas toucher à updatedAt pour ne pas changer l'ordre de la liste
    await dbPut(existing);
}

// ── Enregistrement automatique du tableau ouvert (1,5 s après la dernière modification) ──
let _autoSaveTimer = null;
function _cancelProjectAutoSave() {
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = null;
}
function scheduleProjectAutoSave() {
    if (!_startupDone || _isDraft) return;
    if (window.location.search.indexOf('mode=pagegarde') !== -1) return; // ne jamais toucher aux tableaux depuis la page de garde
    const id = getCurrentProjectId();
    if (!id) return;
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => { _autoSaveTimer = null; _saveProjectSilent(id).catch(() => {}); }, 1500);
}

// ── Fermeture de l'onglet / de la page ───────────────────────────────────
// 1. Un enregistrement automatique en attente (les 1,5 dernières secondes) est
//    fait tout de suite, au lieu d'être perdu.
// 2. Un brouillon qui contient du travail déclenche l'avertissement du
//    navigateur (« Quitter le site ? »). Le texte de cette fenêtre est imposé
//    par le navigateur et ne peut pas être personnalisé.
function flushProjectAutoSave() {
    if (!_autoSaveTimer) return;
    _cancelProjectAutoSave();
    const id = getCurrentProjectId();
    if (id) _saveProjectSilent(id).catch(() => {});
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushProjectAutoSave();
});
window.addEventListener('pagehide', flushProjectAutoSave);
window.addEventListener('beforeunload', (e) => {
    flushProjectAutoSave();
    if (window.location.search.indexOf('mode=pagegarde') !== -1) return;
    if (_isDraft && _draftHasContent()) {
        e.preventDefault();
        e.returnValue = '';   // nécessaire pour Chrome / Edge
        return '';
    }
});

async function _projLoad(id) {
    if (!await _confirmLeaveDraft()) return;
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
    if (!await _confirmLeaveDraft()) return;
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
    const wasCurrent = (id === getCurrentProjectId());
    if (wasCurrent) _cancelProjectAutoSave();
    await dbDelete(id);
    if (wasCurrent) {
        // Le tableau reste affiché, mais devient un brouillon : il peut être
        // ré-enregistré, et quitter ce brouillon déclenchera l'avertissement.
        _writeCurId(null);
        _isDraft = true;
        _updateProjectTitle('');
    }
    if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
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
            _cancelProjectAutoSave();   // ne rien réécrire dans la base pendant le remplacement
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
